import { create } from "zustand";
import { ref, runTransaction, update, get as getDb } from "firebase/database";
import { db } from "@/lib/firebase";
import { loadData, saveData } from "@/lib/storage";
import { applyCardEffect } from "@/game/abilityExecution";
import type {
  Board,
  Card,
  Coord,
  Faction,
  GameState,
  Move,
  Player,
  PlayerState,
  PreviewResult,
  Settings,
  SkillCard,
  TurnPhase,
  UnitCard,
} from "@/game/types";
import {
  applyCapturesAfterPlacement,
  cloneBoard,
  countLibertiesAt,
  getGroup,
  getLiberties,
  inBounds,
  isSuicideUnlessCapture,
  normalizeEphemeralTiles,
  placeUnit,
  removeGroup,
} from "@/game/logic";
import { computeScore, emptyTerritoryMap } from "@/game/territory";
import { aiChooseMove, type AiInput } from "@/game/ai";
import { getTargetDef } from "@/game/targetMechanics";
import {
  CARD_LIBRARY,
  validateDeckOwnership,
  instantiateDeck,
  buildDefaultDeckTemplateIds,
  DECK_SIZE,
} from "@/data/cards";
import { generateRandomDeck } from "@/lib/randomDeck";
import { loadProfile } from "@/progression/progression";
import {
  checkAllSynergies,
  flattenSynergyCells,
  makeEmptyComboState,
  evaluateCombo,
  type CellCardInfo,
  type ComboState,
  type SynergyCell,
  type ComboFeedback,
} from "@/game/synergy";

type Actions = {
  setSettings: (patch: Partial<Settings>) => void;
  setPlayerFaction: (faction: Faction) => void;
  startMenu: () => void;
  startTutorial: () => void;
  beginTutorialWithCurrentFaction: () => void;
  startGame: () => void;
  openDeckBuilder: () => void;
  closeDeckBuilder: () => void;
  saveCustomDeck: (templateIds: string[]) => { ok: boolean; reason?: string };
  restart: () => void;
  selectCard: (cardId?: string) => void;
  setHoverCell: (cell?: Coord) => void;
  tryPlayAt: (cell: Coord) => void;
  tryPass: () => void;
  tryEndTurn: () => void;
  undoLastMove: () => void;
  dismissMessage: () => void;
  nextTutorial: () => void;
  prevTutorial: () => void;
  mulliganOnce: () => void;
  dismissComboFeedback: () => void;
  cancelTargetSelection: () => void;
  confirmTargetSelection: () => void;
  triggerActiveEffect: (payload: import("@/game/types").ActiveEffectPayload) => void;
  // Online actions
  setOnlineMode: (roomId: string | null, role: "host" | "guest" | null) => void;
  syncFromOnline: (roomData: any) => void;
  initOnlineGame: () => Promise<void>;
};

/**
 * Ensures a PlayerState has all required arrays (prevents Firebase undefined issues).
 */
function normalizePlayerState(ps: any): PlayerState {
  if (!ps) return ps;
  return {
    ...ps,
    hand: ps.hand || [],
    deck: ps.deck || [],
    discard: ps.discard || [],
  };
}

/**
 * Ensures a GameState has all required arrays and maps (prevents Firebase undefined issues).
 */
export function normalizeState(state: any): GameState {
  if (!state) return state;
  const s = { ...state };
  s.boardStateHistory = s.boardStateHistory || [];
  s.activeSynergies = s.activeSynergies || [];
  s.lastCaptures = (s.lastCaptures || []).map((e: any) => ({
    ...e,
    stonesRemoved: e.stonesRemoved || [],
  }));
  s.human = normalizePlayerState(s.human);
  s.ai = normalizePlayerState(s.ai);
  s.comboState = {
    ...(s.comboState || {}),
    playedTemplateIds: s.comboState?.playedTemplateIds || [],
    playedCardTypes: s.comboState?.playedCardTypes || [],
  };
  
  if (s.cardMap && !(s.cardMap instanceof Map)) {
    s.cardMap = new Map(Object.entries(s.cardMap));
  } else if (!s.cardMap) {
    s.cardMap = new Map();
  }
  
  return s as GameState;
}

function makeEmptyBoard(size: number): Board {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => ({ kind: "empty" })));
}

function random01() {
  // Prefer cryptographically strong randomness when available.
  if (typeof globalThis !== "undefined" && "crypto" in globalThis && "getRandomValues" in globalThis.crypto) {
    const arr = new Uint32Array(1);
    globalThis.crypto.getRandomValues(arr);
    return arr[0]! / 0xffffffff;
  }
  return Math.random();
}

function uid(prefix: string, index: number) {
  return `${prefix}_${index}`;
}

// ─────────────────────────────────────────────────────────────
// Synergy helpers
// ─────────────────────────────────────────────────────────────

function coordKey(c: Coord) {
  return `${c.r},${c.c}`;
}

/** Build a cardMap from the current board and the owning players' info */
function buildCardMap(
  board: Board,
  human: PlayerState,
  ai: PlayerState,
  prevMap: Map<string, CellCardInfo>,
  addedCoord?: Coord,
  addedCard?: Card,
  removedCoords?: Coord[],
): Map<string, CellCardInfo> {
  const next = new Map(prevMap);
  // Remove cells that were cleared
  if (removedCoords) {
    for (const c of removedCoords) next.delete(coordKey(c));
  }
  // Remove stale entries where the board tile no longer matches
  for (const [k] of next) {
    const [r, c] = k.split(",").map(Number);
    const tile = board[r!]?.[c!];
    if (!tile || tile.kind !== "unit") next.delete(k);
  }
  // Add the newly placed card
  if (addedCoord && addedCard) {
    next.set(coordKey(addedCoord), {
      templateId: addedCard.comboType ?? addedCard.id,
      synergyTags: addedCard.synergyTags ?? [],
      faction: ("unit" in addedCard && addedCard.type === "unit") ? addedCard.unit.faction : human.faction,
    });
  }
  return next;
}

/** Recompute activated synergy cells from current board + cardMap */
function recomputeSynergies(
  board: Board,
  cardMap: Map<string, CellCardInfo>,
  territoryMap: ("none" | Faction)[][],
): SynergyCell[] {
  const results = checkAllSynergies(board, cardMap, territoryMap);
  return flattenSynergyCells(results);
}

function buildDeck(faction: Faction, templateIds?: string[]): Card[] {
  const ids = templateIds && templateIds.length ? templateIds : buildDefaultDeckTemplateIds(faction);
  const deck = instantiateDeck(ids, faction);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random01() * (i + 1));
    [deck[i], deck[j]] = [deck[j]!, deck[i]!];
  }
  return deck;
}

/**
 * When the draw deck is empty, shuffle the discard pile back into it.
 * Returns reshuffled=true so callers can show a "deck reshuffled" message.
 */
function reshuffleIfEmpty(
  deck: Card[],
  discard: Card[],
): { deck: Card[]; discard: Card[]; reshuffled: boolean } {
  const d = deck || [];
  const disc = discard || [];
  if (d.length > 0) return { deck: d, discard: disc, reshuffled: false };
  if (disc.length === 0) return { deck: d, discard: disc, reshuffled: false };
  const newDeck = [...disc];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(random01() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j]!, newDeck[i]!];
  }
  return { deck: newDeck, discard: [], reshuffled: true };
}

function makeFallbackBasicCard(faction: Faction): UnitCard {
  return {
    id: `fallback_${faction}_${Date.now()}_${Math.floor(random01() * 100000)}`,
    type: "unit",
    name: faction === "RAMA" ? "ลิงทหารสำรอง" : "ยักษ์ทหารสำรอง",
    cost: 1,
    rarity: "common",
    tier: "basic",
    description: "การ์ดสำรองเพื่อให้เล่นได้ทุกเทิร์น",
    ability: {
      trigger: "-",
      requiresTarget: false,
      action: "ไม่มี",
      result: "-",
      ui: "-",
      animation: "ไม่มี"
    },
    icon: faction === "RAMA" ? "🐒" : "👹",
    image: faction === "RAMA" ? "/RAMA_png/monkey-soldier.png" : "/LANKA_png/ยักษ์สมุน.png",
    effectType: "unit",
    unit: { faction },
  };
}

const LEGACY_HUMAN_DECK_STORAGE_KEY = "ramakien_custom_deck_v1";

function deckStorageKey(faction: Faction) {
  return `ramakien_custom_deck_${faction}_v1`;
}

export function readStoredCustomDeckTemplateIds(faction: Faction): string[] | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const key = deckStorageKey(faction);
    let parsed = loadData<string[] | undefined>(key, undefined);
    
    // Legacy cross-user migration
    if (!parsed && faction === "RAMA") {
      const raw = window.localStorage.getItem(LEGACY_HUMAN_DECK_STORAGE_KEY);
      if (raw) {
        parsed = JSON.parse(raw);
        saveData(key, parsed);
      }
    }
    
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : undefined;
  } catch {
    return undefined;
  }
}

function loadCustomDeckIds(faction: Faction): string[] | undefined {
  return readStoredCustomDeckTemplateIds(faction);
}

function saveCustomDeckIds(ids: string[], faction: Faction) {
  saveData(deckStorageKey(faction), ids);
}

function validateDeckTemplateIds(ids: string[], faction: Faction) {
  if (ids.length !== DECK_SIZE) return { ok: false as const, reason: "จำนวนการ์ดต้องเท่ากับ 20" };
  const counts = new Map<string, number>();
  let basics = 0;
  let legends = 0;
  for (const id of ids) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
    const tpl = CARD_LIBRARY.find((c) => c.templateId === id);
    if (!tpl) return { ok: false as const, reason: "พบการ์ดที่ไม่ถูกต้อง" };
    if (!(tpl.cardFaction === faction || tpl.cardFaction === "NEUTRAL")) {
      return { ok: false as const, reason: "มีการ์ดคนละฝ่ายในเด็ค" };
    }
    if (tpl.tier === "basic") basics += 1;
    if (tpl.tier === "legendary") legends += 1;
  }
  for (const [id, count] of counts) {
    const tpl = CARD_LIBRARY.find((c) => c.templateId === id)!;
    const maxDup = tpl.tier === "basic" ? 4 : tpl.tier === "hero" ? 2 : 1;
    if (count > maxDup) return { ok: false as const, reason: `การ์ด ${tpl.name} ซ้ำเกินกำหนด` };
  }
  if (basics < 8) return { ok: false as const, reason: "ต้องมีการ์ดพื้นฐานอย่างน้อย 8 ใบ" };
  if (legends > 3) return { ok: false as const, reason: "การ์ดระดับตำนานเกินกำหนด" };
  return { ok: true as const };
}

function ensurePlayableCard(
  hand: Card[],
  deck: Card[],
  discard: Card[],
  energy: number,
  faction: Faction,
): { hand: Card[]; deck: Card[]; discard: Card[]; guaranteed: boolean } {
  const h = hand ? [...hand] : [];
  const d = deck ? [...deck] : [];
  const disc = discard ? [...discard] : [];
  if (h.some((c) => c.cost <= energy)) return { hand: h, deck: d, discard: disc, guaranteed: false };
  if (h.length === 0) {
    h.push(makeFallbackBasicCard(faction));
    return { hand: h, deck: d, discard: disc, guaranteed: true };
  }

  // Smart redraw: replace one expensive card with an affordable card from deck if available.
  const replaceIdx = h.reduce((best, c, i, arr) => (arr[best]!.cost >= c.cost ? best : i), 0);
  const affordableInDeck = d.findIndex((c) => c.cost <= energy);
  if (replaceIdx >= 0 && affordableInDeck >= 0) {
    const replaced = h.splice(replaceIdx, 1)[0]!;
    const [drawn] = d.splice(affordableInDeck, 1);
    h.push(drawn!);
    disc.unshift(replaced);
    return { hand: h, deck: d, discard: disc, guaranteed: true };
  }

  // Hard guarantee: inject one basic card when RNG would cause a dead turn.
  if (replaceIdx >= 0) {
    const replaced = h.splice(replaceIdx, 1)[0]!;
    disc.unshift(replaced);
  }
  h.push(makeFallbackBasicCard(faction));
  return { hand: h, deck: d, discard: disc, guaranteed: true };
}

function drawUpTo(
  hand: Card[],
  deck: Card[],
  discard: Card[],
  target: number,
): { hand: Card[]; deck: Card[]; discard: Card[]; reshuffled: boolean } {
  const h = hand ? [...hand] : [];
  let d = deck ? [...deck] : [];
  let disc = discard ? [...discard] : [];
  let reshuffled = false;
  while (h.length < target) {
    if (d.length === 0) {
      const r = reshuffleIfEmpty(d, disc);
      if (!r.reshuffled) break; // truly empty — stop
      d = r.deck;
      disc = r.discard;
      reshuffled = true;
    }
    h.push(d.shift()!);
  }
  return { hand: h, deck: d, discard: disc, reshuffled };
}

function drawOne(
  hand: Card[],
  deck: Card[],
  discard: Card[],
): { hand: Card[]; deck: Card[]; discard: Card[]; reshuffled: boolean } {
  const h = hand ? [...hand] : [];
  let d = deck ? [...deck] : [];
  let disc = discard ? [...discard] : [];
  let reshuffled = false;
  if (d.length === 0) {
    const r = reshuffleIfEmpty(d, disc);
    if (r.reshuffled) { d = r.deck; disc = r.discard; reshuffled = true; }
  }
  if (d.length) h.push(d.shift()!);
  return { hand: h, deck: d, discard: disc, reshuffled };
}

function initPlayer(faction: Faction, templateIds?: string[]): PlayerState {
  const deck = buildDeck(faction, templateIds);
  const drawn = drawUpTo([], deck, [], 5);
  const ensured = ensurePlayableCard(drawn.hand, drawn.deck, drawn.discard, 2, faction);
  return {
    faction,
    deck: ensured.deck,
    hand: ensured.hand,
    discard: ensured.discard,
    energy: 2,
    captures: 0,
    passedLastTurn: false,
    mulliganUsed: false,
  };
}

function recompute(board: Board, human: PlayerState, ai: PlayerState) {
  const captures = { RAMA: 0, LANKA: 0 } as Record<Faction, number>;
  captures[human.faction] += human.captures;
  captures[ai.faction] += ai.captures;
  return computeScore(board, captures);
}

function otherFaction(f: Faction): Faction {
  return f === "RAMA" ? "LANKA" : "RAMA";
}

function getActiveFaction(state: GameState): Faction {
  return state.active === "HUMAN" ? state.human.faction : state.ai.faction;
}

export function getActivePlayerState(state: GameState): PlayerState {
  return state.active === "HUMAN" ? state.human : state.ai;
}

export function setMessage(text: string, kind: "info" | "warn" = "info") {
  return { kind, text, nonce: Date.now() + Math.random() };
}

export function clonePlayerState(ps: PlayerState): PlayerState {
  return {
    ...ps,
    deck: ps.deck ? [...ps.deck] : [],
    hand: ps.hand ? [...ps.hand] : [],
    discard: ps.discard ? [...ps.discard] : [],
  };
}

export function makeUndoSnapshot(state: GameState): NonNullable<GameState["undoSnapshot"]> {
  return {
    board: cloneBoard(state.board),
    human: clonePlayerState(state.human),
    ai: clonePlayerState(state.ai),
    territoryMap: state.territoryMap.map((r) => [...r]),
    scores: {
      territory: { ...state.scores.territory },
      captures: { ...state.scores.captures },
      bonus: { ...state.scores.bonus },
      total: { ...state.scores.total },
    },
    lastCaptures: (state.lastCaptures || []).map((e) => ({ ...e, stonesRemoved: (e.stonesRemoved || []).map((p) => ({ ...p })) })),
    lastMove: state.lastMove ? { ...state.lastMove } : undefined,
    cardsPlayedThisTurn: state.cardsPlayedThisTurn,
    selectedCardId: state.selectedCardId,
    hoverCell: state.hoverCell ? { ...state.hoverCell } : undefined,
    turnEnergyBonus: {
      HUMAN: { ...state.turnEnergyBonus.HUMAN },
      AI: { ...state.turnEnergyBonus.AI },
    },
    activeSynergies: [...(state.activeSynergies || [])],
    comboState: { ...state.comboState, playedTemplateIds: [...(state.comboState.playedTemplateIds || [])], playedCardTypes: [...(state.comboState.playedCardTypes || [])] },
    cardMap: state.cardMap instanceof Map ? new Map(state.cardMap) : new Map(Object.entries(state.cardMap as Record<string, import("@/game/synergy").CellCardInfo>)),
  };
}

function isBoardFull(board: Board) {
  for (const row of board) for (const t of row) if (t.kind === "empty") return false;
  return true;
}

function makePreview(state: GameState, hover?: Coord): PreviewResult {
  const at = hover ?? state.hoverCell;
  if (!at) {
    return {
      ok: false,
      reason: "noCardSelected",
      willCapture: [],
      territoryBefore: state.scores,
      territoryAfter: state.scores,
      territoryMapAfter: state.territoryMap,
    };
  }
  if (!inBounds(state.board, at)) {
    return {
      ok: false,
      reason: "outOfBounds",
      willCapture: [],
      territoryBefore: state.scores,
      territoryAfter: state.scores,
      territoryMapAfter: state.territoryMap,
    };
  }

  const activePS = getActivePlayerState(state);
  const faction = getActiveFaction(state);
  const selected = state.selectedCardId
    ? activePS.hand.find((c) => c.id === state.selectedCardId)
    : undefined;

  if (!selected) {
    return {
      ok: false,
      reason: "noCardSelected",
      willCapture: [],
      territoryBefore: state.scores,
      territoryAfter: state.scores,
      territoryMapAfter: state.territoryMap,
    };
  }

  if (selected.cost > activePS.energy) {
    return {
      ok: false,
      reason: "insufficientEnergy",
      willCapture: [],
      territoryBefore: state.scores,
      territoryAfter: state.scores,
      territoryMapAfter: state.territoryMap,
    };
  }

  const tile = state.board[at.r]![at.c]!;
  if (tile.kind === "unit") {
    return {
      ok: false,
      reason: "occupied",
      willCapture: [],
      territoryBefore: state.scores,
      territoryAfter: state.scores,
      territoryMapAfter: state.territoryMap,
    };
  }
  const canJumpBlock = canPlaceOnBlockedTile(selected);
  if (tile.kind === "block" && !canJumpBlock) {
    return {
      ok: false,
      reason: "blocked",
      willCapture: [],
      territoryBefore: state.scores,
      territoryAfter: state.scores,
      territoryMapAfter: state.territoryMap,
    };
  }

  if (selected.type === "unit") {
    const boardForPlacement = tile.kind === "block" && canJumpBlock ? cloneBoard(state.board) : state.board;
    if (tile.kind === "block" && canJumpBlock) boardForPlacement[at.r]![at.c] = { kind: "empty" };
    const legality = isSuicideUnlessCapture(boardForPlacement, at, faction);
    if (!legality.ok) {
      return {
        ok: false,
        reason: "illegalNoLiberties",
        willCapture: [],
        territoryBefore: state.scores,
        territoryAfter: state.scores,
        territoryMapAfter: state.territoryMap,
        ghost: { at, faction },
      };
    }
    const withStone = placeUnit(boardForPlacement, at, faction);
    const afterCap = applyCapturesAfterPlacement(withStone, at, faction);
    const tmpHuman = { ...state.human };
    const tmpAi = { ...state.ai };
    const captureCount = afterCap.captured.reduce((acc, e) => acc + e.stonesRemoved.length, 0);
    if (state.active === "HUMAN") tmpHuman.captures += captureCount;
    else tmpAi.captures += captureCount;
    const afterScore = recompute(afterCap.board, tmpHuman, tmpAi);
    return {
      ok: true,
      willCapture: afterCap.captured,
      territoryBefore: state.scores,
      territoryAfter: afterScore.scores,
      territoryMapAfter: afterScore.territoryMap,
      ghost: { at, faction },
    };
  }

  // Skill previews: lightweight (some need a second click; show "target needed" as invalidTarget).
  if (selected.type === "skill") {
    if (selected.skill.kind === "blockTile") {
      const b = cloneBoard(state.board);
      b[at.r]![at.c] = { kind: "block", expiresAtTurn: state.turn + 2, owner: faction };
      const afterScore = recompute(b, state.human, state.ai);
      return {
        ok: true,
        willCapture: [],
        territoryBefore: state.scores,
        territoryAfter: afterScore.scores,
        territoryMapAfter: afterScore.territoryMap,
      };
    }
    return {
      ok: false,
      reason: "invalidTarget",
      willCapture: [],
      territoryBefore: state.scores,
      territoryAfter: state.scores,
      territoryMapAfter: state.territoryMap,
    };
  }

  return {
    ok: false,
    reason: "invalidTarget",
    willCapture: [],
    territoryBefore: state.scores,
    territoryAfter: state.scores,
    territoryMapAfter: state.territoryMap,
  };
}

function computeSuggestion(state: GameState): { at?: Coord; text?: string } {
  if (!state.settings.beginnerMode) return {};
  if (state.phase !== "player" || state.active !== "HUMAN") return {};
  const ps = state.human;
  const faction = ps.faction;
  const unitCards = ps.hand.filter((c) => c.type === "unit" && c.cost <= ps.energy);
  if (!unitCards.length) return { text: "คำแนะนำ: ถ้าไม่มีจุดปลอดภัย ลองข้ามเทิร์นได้" };

  const size = state.board.length;
  let best: { at: Coord; score: number; text: string } | null = null;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const at = { r, c };
      if (state.board[r]![c]!.kind !== "empty") continue;
      const legal = isSuicideUnlessCapture(state.board, at, faction);
      if (!legal.ok) continue;
      const withStone = placeUnit(state.board, at, faction);
      const after = applyCapturesAfterPlacement(withStone, at, faction);
      const libs = getLiberties(after.board, getGroup(after.board, at)).length;
      const captureCount = after.captured.reduce((acc, e) => acc + e.stonesRemoved.length, 0);
      const { scores } = recompute(after.board, { ...state.human, captures: state.human.captures + captureCount }, state.ai);
      const diff = scores.total[faction] - scores.total[otherFaction(faction)];
      const baseDiff = state.scores.total[faction] - state.scores.total[otherFaction(faction)];
      const gain = diff - baseDiff;
      const s = gain * 3 + libs * 0.35 + (captureCount ? 2.5 : 0);
      const text = captureCount
        ? "จุดนี้ยึดกลุ่มศัตรูได้"
        : gain > 0.5
          ? "ตำแหน่งนี้ช่วยขยายพื้นที่"
          : libs <= 1
            ? "ระวัง ยูนิตอาจโดนล้อม"
            : "จุดนี้ช่วยให้ตำแหน่งมั่นคงขึ้น";
      if (!best || s > best.score) best = { at, score: s, text };
    }
  }
  return best ? { at: best.at, text: best.text } : { text: "คำแนะนำ: หากทุกจุดเสี่ยง การข้ามเทิร์นก็เป็นทางเลือกที่ดี" };
}

function applyMove(state: GameState, move: Move): GameState {
  let board = normalizeEphemeralTiles(state.board, state.turn);
  let human = { ...state.human };
  let ai = { ...state.ai };
  const active: Player = state.active;
  const activePS = active === "HUMAN" ? human : ai;
  const faction = activePS.faction;
  const activeKey: Player = active;
  const beforeTerritoryOwned = state.scores.territory[faction];

  const discardCard = (cardId: string) => {
    const idx = activePS.hand.findIndex((c) => c.id === cardId);
    if (idx >= 0) {
      const [card] = activePS.hand.splice(idx, 1);
      activePS.discard = [card!, ...(activePS.discard || [])];
    }
  };

  const applyCaptured = (captured: { factionCaptured: Faction; stonesRemoved: Coord[] }[]) => {
    const n = captured.reduce((acc, e) => acc + e.stonesRemoved.length, 0);
    activePS.captures += n;
    return captured;
  };

  let lastCaptures: GameState["lastCaptures"] = [];

  if (move.kind === "pass") {
    activePS.passedLastTurn = true;
  } else {
    activePS.passedLastTurn = false;
  }

  if (move.kind === "playUnit") {
    const playedCard = activePS.hand.find((c) => c.id === move.fromCardId);
    const canJumpBlock = canPlaceOnBlockedTile(playedCard);
    if (!inBounds(board, move.at)) return state;
    const targetTile = board[move.at.r]![move.at.c]!;
    if (targetTile.kind === "unit") return state;
    if (targetTile.kind === "block" && !canJumpBlock) return state;
    if (activePS.energy < cardCost(activePS.hand, move.fromCardId)) return state;
    if (targetTile.kind === "block" && canJumpBlock) {
      board = cloneBoard(board);
      board[move.at.r]![move.at.c] = { kind: "empty" };
    }
    const legal = isSuicideUnlessCapture(board, move.at, faction);
    if (!legal.ok) return state;
    board = placeUnit(board, move.at, faction, playedCard?.comboType);
    const after = applyCapturesAfterPlacement(board, move.at, faction);
    board = after.board;
    lastCaptures = applyCaptured(after.captured);
    activePS.energy -= cardCost(activePS.hand, move.fromCardId);
    discardCard(move.fromCardId);
  }

  if (move.kind === "skillBlockTile") {
    if (!inBounds(board, move.at)) return state;
    if (board[move.at.r]![move.at.c]!.kind !== "empty") return state;
    if (activePS.energy < cardCost(activePS.hand, move.fromCardId)) return state;
    board = cloneBoard(board);
    board[move.at.r]![move.at.c] = {
      kind: "block",
      expiresAtTurn: state.turn + move.durationTurns,
      owner: faction,
    };
    activePS.energy -= cardCost(activePS.hand, move.fromCardId);
    discardCard(move.fromCardId);
  }

  if (move.kind === "skillDestroyWeakGroup") {
    if (activePS.energy < cardCost(activePS.hand, move.fromCardId)) return state;
    const target = move.targetAnyCellInEnemyGroup;
    if (!inBounds(board, target)) return state;
    const t = board[target.r]![target.c]!;
    if (t.kind !== "unit" || t.faction === faction) return state;
    const g = getGroup(board, target);
    const libs = getLiberties(board, g).length;
    if (libs > 2) return state;
    board = removeGroup(board, g);
    lastCaptures = applyCaptured([{ factionCaptured: t.faction, stonesRemoved: g }]);
    activePS.energy -= cardCost(activePS.hand, move.fromCardId);
    discardCard(move.fromCardId);
  }

  if (move.kind === "skillPushUnit") {
    if (activePS.energy < cardCost(activePS.hand, move.fromCardId)) return state;
    const from = move.from;
    if (!inBounds(board, from)) return state;
    const t = board[from.r]![from.c]!;
    if (t.kind !== "unit" || t.faction === faction) return state;
    const delta = move.dir === "up" ? { r: -1, c: 0 } : move.dir === "down" ? { r: 1, c: 0 } : move.dir === "left" ? { r: 0, c: -1 } : { r: 0, c: 1 };
    const to = { r: from.r + delta.r, c: from.c + delta.c };
    if (!inBounds(board, to)) return state;
    if (board[to.r]![to.c]!.kind !== "empty") return state;
    const next = cloneBoard(board);
    next[to.r]![to.c] = { kind: "unit", faction: t.faction };
    next[from.r]![from.c] = { kind: "empty" };
    // If push causes the moved unit to have no liberties, it will be captured immediately (Go-like resolution).
    const movedGroup = getGroup(next, to);
    const libs = getLiberties(next, movedGroup).length;
    board = next;
    if (libs === 0) {
      board = removeGroup(board, movedGroup);
      lastCaptures = applyCaptured([{ factionCaptured: t.faction, stonesRemoved: movedGroup }]);
    }
    activePS.energy -= cardCost(activePS.hand, move.fromCardId);
    discardCard(move.fromCardId);
  }

  if (move.kind === "skillStormCut") {
    if (activePS.energy < cardCost(activePS.hand, move.fromCardId)) return state;
    const { center, radius } = move;
    if (!inBounds(board, center)) return state;
    const next = cloneBoard(board);
    const removed: Coord[] = [];
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        const p = { r: center.r + dr, c: center.c + dc };
        if (!inBounds(next, p)) continue;
        const t = next[p.r]![p.c]!;
        if (t.kind === "unit") {
          next[p.r]![p.c] = { kind: "empty" };
          removed.push(p);
        }
      }
    }
    // After clearing, resolve any newly captured adjacent groups by checking all stones near the cleared area.
    board = next;
    const capturedEvents: { factionCaptured: Faction; stonesRemoved: Coord[] }[] = [];
    const seenGroups = new Set<string>();
    for (const p of removed) {
      for (const n of [
        p,
        { r: p.r - 1, c: p.c },
        { r: p.r + 1, c: p.c },
        { r: p.r, c: p.c - 1 },
        { r: p.r, c: p.c + 1 },
      ]) {
        if (!inBounds(board, n)) continue;
        const t = board[n.r]![n.c]!;
        if (t.kind !== "unit") continue;
        const g = getGroup(board, n);
        const sig = g
          .map((q) => `${q.r},${q.c}`)
          .sort()
          .join("|");
        if (seenGroups.has(sig)) continue;
        seenGroups.add(sig);
        if (getLiberties(board, g).length === 0) {
          board = removeGroup(board, g);
          capturedEvents.push({ factionCaptured: t.faction, stonesRemoved: g });
        }
      }
    }
    lastCaptures = applyCaptured(capturedEvents);
    activePS.energy -= cardCost(activePS.hand, move.fromCardId);
    discardCard(move.fromCardId);
  }

  // Recompute score/territory after any move.
  const recomputed = recompute(board, human, ai);

  // Bonus energy: capture +1 once per turn for active player.
  const capturedNow = lastCaptures.reduce((a, e) => a + e.stonesRemoved.length, 0);
  const nextTurnEnergyBonus = {
    HUMAN: { ...state.turnEnergyBonus.HUMAN },
    AI: { ...state.turnEnergyBonus.AI },
  };
  if (capturedNow > 0 && !nextTurnEnergyBonus[activeKey].captureAwarded) {
    activePS.energy = Math.min(10, activePS.energy + 1);
    nextTurnEnergyBonus[activeKey].captureAwarded = true;
  }

  // Bonus energy: securing territory (+1, max 2 per turn).
  const territoryDelta = Math.max(0, recomputed.scores.territory[faction] - beforeTerritoryOwned);
  const territoryAwards = territoryDelta >= 4 ? 2 : territoryDelta > 0 ? 1 : 0;
  const territoryBudget = Math.max(0, 2 - nextTurnEnergyBonus[activeKey].territoryAwards);
  const territoryGain = Math.min(territoryAwards, territoryBudget);
  if (territoryGain > 0) {
    activePS.energy = Math.min(10, activePS.energy + territoryGain);
    nextTurnEnergyBonus[activeKey].territoryAwards += territoryGain;
  }

  // Comeback energy: losing large group (>=3) gives +1 to the losing side.
  const losingLargeGroup = lastCaptures.some((e) => e.stonesRemoved.length >= 3);
  if (losingLargeGroup) {
    const loserFaction = lastCaptures.find((e) => e.stonesRemoved.length >= 3)!.factionCaptured;
    const loser = human.faction === loserFaction ? human : ai;
    loser.energy = Math.min(10, loser.energy + 1);
  }

  return {
    ...state,
    board,
    human,
    ai,
    territoryMap: recomputed.territoryMap,
    scores: recomputed.scores,
    lastCaptures,
    lastMove: move,
    turnEnergyBonus: nextTurnEnergyBonus,
  };
}

function cardCost(hand: Card[], cardId: string) {
  return hand.find((c) => c.id === cardId)?.cost ?? 99;
}

function hasPlayableCard(ps: PlayerState) {
  return ps.hand.some((c) => c.cost <= ps.energy);
}

function canPlaceOnBlockedTile(card: Card | undefined) {
  return card?.type === "unit" && card.name.includes("หนุมาน");
}

/** Maximum turns before the game is force-ended. */
const MAX_TURNS = 30;

/**
 * Compute a compact fingerprint of the board for repetition detection.
 * Encodes each cell as a single char: '.' empty, 'R' RAMA unit, 'L' LANKA unit, 'B' block.
 */
function boardFingerprint(board: Board): string {
  return board
    .flat()
    .map((t) => (t.kind === "unit" ? (t.faction === "RAMA" ? "R" : "L") : t.kind === "block" ? "B" : "."))
    .join("");
}

function endTurnIfNeeded(state: GameState): GameState {
  const boardFull = isBoardFull(state.board);

  // ① Full board
  if (boardFull) {
    return {
      ...state,
      phase: "gameOver" as const,
      selectedCardId: undefined,
      hoverCell: undefined,
      gameOverReason: "กระดานเต็มแล้ว",
      message: setMessage("กระดานเต็มแล้ว — สรุปคะแนน!"),
    };
  }

  // ② Turn limit
  if (state.turn >= MAX_TURNS) {
    return {
      ...state,
      phase: "gameOver" as const,
      selectedCardId: undefined,
      hoverCell: undefined,
      gameOverReason: `ครบ ${MAX_TURNS} เทิร์น`,
      message: setMessage(`ครบ ${MAX_TURNS} เทิร์นแล้ว — สรุปคะแนน!`),
    };
  }

  // ③ Consecutive-pass lockout (4 consecutive half-turns = both sides passed twice)
  if (state.consecutivePasses >= 4) {
    return {
      ...state,
      phase: "gameOver" as const,
      selectedCardId: undefined,
      hoverCell: undefined,
      gameOverReason: "ทั้งสองฝ่ายไม่มีที่ลง",
      message: setMessage("ทั้งสองฝ่ายข้ามเทิร์นหลายครั้งติด — สรุปคะแนน!"),
    };
  }

  // Legacy: both-passed flag (kept for compatibility)
  const bothPassed = state.human.passedLastTurn && state.ai.passedLastTurn;
  if (bothPassed) {
    return {
      ...state,
      phase: "gameOver" as const,
      selectedCardId: undefined,
      hoverCell: undefined,
      gameOverReason: "ทั้งสองฝ่ายผ่านเทิร์น",
      message: setMessage("ทั้งสองฝ่ายข้ามเทิร์น — สรุปคะแนน!"),
    };
  }

  // ④ Board-state repetition (same fingerprint appears 3 times)
  const fp = boardFingerprint(state.board);
  const history = [...(state.boardStateHistory || []), fp];
  const repeatCount = history.filter((h) => h === fp).length;
  if (repeatCount >= 3) {
    return {
      ...state,
      boardStateHistory: history,
      phase: "gameOver" as const,
      selectedCardId: undefined,
      hoverCell: undefined,
      gameOverReason: "กระดานวนซ้ำ",
      message: setMessage("กระดานอยู่ในสถานการณ์วนซ้ำ — สรุปคะแนน!"),
    };
  }

  return { ...state, boardStateHistory: history };
}

function startOfTurn(state: GameState, who: Player): GameState {
  const turn = state.turn + (who === "HUMAN" ? 1 : 0);
  const bump = (ps: PlayerState, trailingBonus: number) => {
    // Guaranteed +2 energy each turn, carry-over allowed (cap 10), draw 1 card.
    const energyAfterBase = Math.min(10, ps.energy + 2 + trailingBonus);
    const drawn = drawOne(ps.hand, ps.deck, ps.discard);
    let next = { ...ps, energy: energyAfterBase, hand: drawn.hand, deck: drawn.deck, discard: drawn.discard };
    const guaranteed = ensurePlayableCard(next.hand, next.deck, next.discard, next.energy, next.faction);
    next = { ...next, hand: guaranteed.hand, deck: guaranteed.deck, discard: guaranteed.discard };
    // Keep old fallback energy safety if still unlucky after replacement logic.
    if (!next.hand.some((c) => c.cost <= next.energy)) next = { ...next, energy: Math.min(10, next.energy + 1) };
    return { player: next, reshuffled: drawn.reshuffled };
  };

  const leadDiff = state.scores.total[state.human.faction] - state.scores.total[state.ai.faction];
  const humanTrailingBonus = leadDiff < -10 ? 1 : 0;
  const aiTrailingBonus = leadDiff > 10 ? 1 : 0;

  if (who === "HUMAN") {
    const { player: human, reshuffled } = bump(state.human, humanTrailingBonus);
    const rec = recompute(normalizeEphemeralTiles(state.board, turn), human, state.ai);
    const newCardMap = buildCardMap(rec.territoryMap ? state.board : state.board, human, state.ai, state.cardMap);
    return {
      ...state,
      turn,
      board: normalizeEphemeralTiles(state.board, turn),
      human,
      territoryMap: rec.territoryMap,
      scores: rec.scores,
      cardsPlayedThisTurn: 0,
      turnEnergyBonus: {
        ...state.turnEnergyBonus,
        HUMAN: { captureAwarded: false, territoryAwards: 0 },
      },
      // Reset combo state on new turn
      comboState: makeEmptyComboState(),
      comboFeedback: undefined,
      cardMap: newCardMap,
      activeSynergies: recomputeSynergies(normalizeEphemeralTiles(state.board, turn), newCardMap, rec.territoryMap),
      message: reshuffled
        ? { text: "🔄 สับเด็คใหม่จากกองทิ้งแล้ว!", kind: "info" as const, nonce: Date.now() }
        : state.message,
    };
  }
  const { player: ai, reshuffled: aiReshuffled } = bump(state.ai, aiTrailingBonus);
  const rec = recompute(normalizeEphemeralTiles(state.board, turn), state.human, ai);
  const aiCardMap = buildCardMap(state.board, state.human, ai, state.cardMap);
  return {
    ...state,
    turn,
    board: normalizeEphemeralTiles(state.board, turn),
    ai,
    territoryMap: rec.territoryMap,
    scores: rec.scores,
    cardsPlayedThisTurn: 0,
    turnEnergyBonus: {
      ...state.turnEnergyBonus,
      AI: { captureAwarded: false, territoryAwards: 0 },
    },
    comboState: makeEmptyComboState(),
    comboFeedback: undefined,
    cardMap: aiCardMap,
    activeSynergies: recomputeSynergies(normalizeEphemeralTiles(state.board, turn), aiCardMap, rec.territoryMap),
    message: aiReshuffled
      ? { text: "🔄 AI สับเด็คใหม่แล้ว", kind: "info" as const, nonce: Date.now() }
      : state.message,
  };
}

function ensureOnlineUserId() {
  if (typeof window === "undefined") return "server";
  let id = sessionStorage.getItem("game_online_user_id");
  if (!id) {
    id = "u_" + Math.random().toString(36).substring(2, 7);
    sessionStorage.setItem("game_online_user_id", id);
  }
  return id;
}

const BOARD_SIZE = 7;

export const useGameStore = create<GameState & Actions>((set, get) => {
  const fresh = (playerFaction: Faction, settingsOverride?: { aiLevel: 1 | 2 | 3 }): GameState => {
    const profile = loadProfile();
    const ownedIds = profile.ownedCardTemplateIds || [];

    const custom = loadCustomDeckIds(playerFaction);
    let deck = custom ? custom : buildDefaultDeckTemplateIds(playerFaction, ownedIds);
    deck = validateDeckOwnership(deck, playerFaction, ownedIds);
    const human = initPlayer(playerFaction, deck);

    // AI gets a fresh random deck every game.
    // In Hard mode, AI gets access to all cards for maximum challenge.
    // Otherwise, AI is restricted to the player's owned cards for fairness.
    const aiLevelForDeck = settingsOverride?.aiLevel ?? 2;
    const aiFaction = otherFaction(playerFaction);
    const aiOwnedIds = aiLevelForDeck >= 3 ? CARD_LIBRARY.map(c => c.templateId) : ownedIds;
    const aiRandomDeck = generateRandomDeck(aiFaction, aiOwnedIds, Date.now());
    
    const ai = initPlayer(aiFaction, aiRandomDeck.ids);
    const board = makeEmptyBoard(BOARD_SIZE);
    const rec = recompute(board, human, ai);
    const emptyCardMap = new Map<string, CellCardInfo>();
    return {
      playerFaction,
      boardSize: BOARD_SIZE,
      board,
      turn: 0,
      active: "HUMAN",
      phase: "menu",
      settings: { beginnerMode: true, aiLevel: 2, sound: true },
      human,
      ai,
      territoryMap: rec.territoryMap ?? emptyTerritoryMap(BOARD_SIZE),
      scores: rec.scores,
      lastCaptures: [],
      selectedCardId: undefined,
      cardsPlayedThisTurn: 0,
      hoverCell: undefined,
      message: undefined,
      aiAnnounce: undefined,
      undoSnapshot: undefined,
      turnEnergyBonus: {
        HUMAN: { captureAwarded: false, territoryAwards: 0 },
        AI: { captureAwarded: false, territoryAwards: 0 },
      },
      activeSynergies: [],
      comboState: makeEmptyComboState(),
      comboFeedback: undefined,
      targetSelection: undefined,
      cardMap: emptyCardMap,
      tutorialStep: 0,
      consecutivePasses: 0,
      boardStateHistory: [],
      gameOverReason: undefined,
      // Online state defaults
      onlineMode: false,
      onlineRoomId: null,
      onlinePlayerRole: null,
      onlineUserId: ensureOnlineUserId(),
    };
  };

  const runAiTurn = () => {
    const current = get();
    const next = { ...current, active: "AI" as const, phase: "aiThinking" as const, cardsPlayedThisTurn: 0, undoSnapshot: undefined };
    set(() => next);

    // AI "thinking" with delay and pre-move highlight.
    const delay = 500 + Math.floor(Math.random() * 1000);
    window.setTimeout(() => {
      const cur = get();
      if (cur.phase !== "aiThinking") return;
      const profile = loadProfile();
      const stats = profile.stats;
      const winRate = stats.matchesPlayed > 0 ? stats.matchesWon / stats.matchesPlayed : 0.5;
      const comboRate = stats.matchesPlayed > 0 ? stats.totalCombos / stats.matchesPlayed : 0;
      
      const humanCards = cur.human.deck;
      const avgTier = humanCards.reduce((acc, c) => acc + (c.tier === "legendary" ? 3 : c.tier === "hero" ? 2 : 1), 0) / Math.max(1, humanCards.length);
      const deckPower = humanCards.reduce((acc, c) => acc + (c.tier === "legendary" ? 5 : c.tier === "hero" ? 3 : 1), 0);

      const aiInput: AiInput = {
        level: cur.settings.aiLevel as any,
        board: cur.board,
        turn: cur.turn,
        aiFaction: cur.ai.faction,
        humanFaction: cur.human.faction,
        hand: cur.ai.hand,
        energy: cur.ai.energy,
        captures: cur.scores.captures as Record<Faction, number>,
        playerPowerMetrics: {
          averageCardTier: avgTier,
          totalDeckPower: deckPower,
          winRate: winRate,
          comboUsageRate: comboRate,
          consecutiveCombos: cur.comboState.comboCount
        },
        lastMoveCoord: cur.lastMove && cur.lastMove.kind === "playUnit" ? `${cur.lastMove.at.r},${cur.lastMove.at.c}` : undefined,
      };
      const move = aiChooseMove(aiInput);
      let announceAt: Coord | undefined;
      if (move.kind === "playUnit") announceAt = move.at;
      if (move.kind === "skillBlockTile") announceAt = move.at;
      if (move.kind === "skillDestroyWeakGroup") announceAt = move.targetAnyCellInEnemyGroup;
      if (move.kind === "skillPushUnit") announceAt = move.from;
      if (move.kind === "skillStormCut") announceAt = move.center;
      if (announceAt) {
        set((st) => ({ ...st, aiAnnounce: { at: announceAt!, kind: move.kind === "playUnit" ? "unit" : "skill", nonce: Date.now() + Math.random() } }));
      }
      window.setTimeout(() => {
        const cur2 = get();
        if (cur2.phase !== "aiThinking") return;
        const started = startOfTurn(cur2, "AI");
        
        // Before applyMove (which discards the card), find the card template
        const playedCard = started.ai.hand.find(c => c.id === (move as any).fromCardId);
        
        let after = applyMove(started, move);
        
        // Track consecutive passes for the AI
        const aiPassed = move.kind === "pass";
        after = {
          ...after,
          consecutivePasses: aiPassed ? (after.consecutivePasses + 1) : 0,
        };

        // NEW: Apply card abilities for AI if it wasn't a pass
        if (playedCard && !aiPassed) {
          const templateId = (playedCard as any).comboType ?? playedCard.id;
          let coords: Coord[] = [];
          if (move.kind === "playUnit" || move.kind === "skillBlockTile") coords = [move.at];
          else if (move.kind === "skillDestroyWeakGroup") coords = [move.targetAnyCellInEnemyGroup];
          else if (move.kind === "skillPushUnit") coords = [move.from];
          else if (move.kind === "skillStormCut") coords = [move.center];

          // Re-apply the effect (matches player's logic in tryPlayAt)
          after.board = applyCardEffect(after.board, templateId, coords, after.ai.faction);
          
          // Re-sync all calculated state after board changed
          const rec = recompute(after.board, after.human, after.ai);
          after.scores = rec.scores;
          after.territoryMap = rec.territoryMap;
          after.cardMap = buildCardMap(after.board, after.human, after.ai, after.cardMap);
          after.activeSynergies = recomputeSynergies(after.board, after.cardMap, after.territoryMap);

          // Show active effect banner for AI
          if (playedCard.ability) {
             after.activeEffect = {
               cardName: playedCard.name,
               icon: playedCard.icon || "",
               type: playedCard.type,
               action: playedCard.ability.action,
               result: playedCard.ability.result,
             };
          }
        }

        after = endTurnIfNeeded(after);
        if (after.phase === "gameOver") return set(() => ({ ...after, aiAnnounce: undefined }));
        const back = startOfTurn({ ...after, active: "HUMAN", phase: "player", aiAnnounce: undefined }, "HUMAN");
        const suggestion = computeSuggestion(back);
        const turnMsg = hasPlayableCard(back.human)
          ? "ตาของคุณ (+2 พลังงาน)"
          : "พลังงานไม่พอ แต่คุณจะได้โบนัสในตาถัดไป";
        return set(() => ({
          ...back,
          undoSnapshot: undefined,
          message: setMessage(suggestion.text ?? turnMsg),
        }));
      }, 450);
    }, delay);
  };

  const defaultState = fresh("RAMA");
  let initialState = defaultState;
  
  if (typeof window !== "undefined") {
    const saved = loadData<GameState | null>("game_state", null);
    if (saved && saved.board && saved.phase) {
      // Re-hydrate cards from library to ensure they have the new 'image' property
      const patchPlayer = (ps: PlayerState) => {
        const patchCard = (c: Card) => {
          const tpl = CARD_LIBRARY.find(t => t.templateId === c.comboType || t.icon === c.icon || t.name === c.name);
          if (tpl && !c.image) return { ...c, image: tpl.image };
          return c;
        };
        return {
          ...ps,
          deck: ps.deck.map(patchCard),
          hand: ps.hand.map(patchCard),
          discard: ps.discard.map(patchCard),
        };
      };
      
      initialState = { 
        ...defaultState, 
        ...saved,
        human: patchPlayer(saved.human),
        ai: patchPlayer(saved.ai),
      };
    }
  }

  return {
    ...initialState,

    setSettings: (patch) => set((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
    setPlayerFaction: (faction) => set({ playerFaction: faction }),
    startMenu: () => set((s) => ({ ...s, phase: "menu", tutorialStep: 0, message: undefined })),
    startTutorial: () => set((s) => ({ ...s, phase: "tutorial", tutorialStep: 0, message: undefined })),
    beginTutorialWithCurrentFaction: () =>
      set(() => {
        const pf = get().playerFaction ?? "RAMA";
        const s = fresh(pf);
        return { ...s, phase: "tutorial" as const, tutorialStep: 0, message: undefined };
      }),
    openDeckBuilder: () => set((s) => ({ ...s, phase: "deckBuilder", message: undefined })),
    closeDeckBuilder: () => set((s) => ({ ...s, phase: "menu", message: undefined })),
    saveCustomDeck: (templateIds) => {
      const faction = get().playerFaction ?? "RAMA";
      const v = validateDeckTemplateIds(templateIds, faction);
      if (!v.ok) return { ok: false, reason: v.reason };
      saveCustomDeckIds(templateIds, faction);
      return { ok: true };
    },
    startGame: () =>
      set(() => {
        const pf = get().playerFaction ?? "RAMA";
        const s = fresh(pf, get().settings);
        const started = startOfTurn({ ...s, phase: "player", active: "HUMAN" }, "HUMAN");
        const text = hasPlayableCard(started.human)
          ? "ตาของคุณ (+2 พลังงาน) เลือกการ์ดแล้ววางบนกระดาน"
          : "พลังงานไม่พอ แต่คุณจะได้โบนัสในตาถัดไป";
        return { ...started, message: setMessage(text) };
      }),
    restart: () => set(() => fresh(get().playerFaction ?? "RAMA")),

    selectCard: (cardId) =>
      set((s) => {
        if (!cardId) return { ...s, selectedCardId: undefined, message: undefined };
        const card = s.human.hand.find(c => c.id === cardId);
        let hint: string | undefined;
        if (card?.type === "skill") {
          if (card.skill.kind === "destroyWeakGroup") hint = "🎲 คลิกที่ใดก็ได้บนกระดาน — สุ่มทำลายศัตรูที่อ่อนแอ";
          else if (card.skill.kind === "pushUnit") hint = "🎲 คลิกที่ใดก็ได้บนกระดาน — สุ่มผลักยูนิตศัตรู 1 ตัว";
          else if (card.skill.kind === "stormCut") hint = "🎲 คลิกที่ใดก็ได้บนกระดาน — สุ่มจุดระเบิดทำลายล้าง 3x3";
          else if (card.skill.kind === "blockTile") hint = "🎲 คลิกที่ใดก็ได้บนกระดาน — สุ่มสร้างกำแพงชั่วคราว";
        }
        return {
          ...s,
          selectedCardId: cardId,
          message: hint ? setMessage(hint) : s.message,
        };
      }),

    setHoverCell: (cell) => set((s) => ({ ...s, hoverCell: cell })),

    dismissMessage: () => set((s) => ({ ...s, message: undefined })),

    tryPlayAt: (cell) => {
      const s = get();
      
      const canProceed = s.phase === "player" && s.active === "HUMAN";
      if (!canProceed) {
        if (s.onlineMode) console.warn("NOT YOUR TURN", { role: s.onlinePlayerRole, active: s.active });
        return;
      }

      if (s.onlineMode && s.onlineRoomId) {
        if (!s.onlineUserId) {
          console.error("NO USER ID");
          return;
        }
        console.log("TRY PLAY AT", { cell, role: s.onlinePlayerRole });
        const actingPlayer = s.human; // Use s.human because it's swapped in syncFromOnline
        const selected = s.selectedCardId ? actingPlayer.hand.find((c) => c.id === s.selectedCardId) : undefined;
        
        if (!selected) return set((st) => ({ ...st, message: setMessage("กรุณาเลือกการ์ดก่อน", "warn") }));
        if (actingPlayer.energy < selected.cost) return set((st) => ({ ...st, message: setMessage("พลังงานไม่พอ", "warn") }));
        if (s.cardsPlayedThisTurn >= 2) return set((st) => ({ ...st, message: setMessage("เล่นได้สูงสุด 2 ใบ", "warn") }));

        performOnlineAction(s.onlineRoomId!, s.onlineUserId, {
          kind: "move",
          move: { kind: "playUnit", faction: actingPlayer.faction, at: cell, fromCardId: selected.id } as Move
        });
        return;
      }

      const ps = s.human;
      const selected = s.selectedCardId ? ps.hand.find((c) => c.id === s.selectedCardId) : undefined;
      if (!selected) return set((st) => ({ ...st, message: setMessage("กรุณาเลือกการ์ดก่อน", "warn") }));
      if (ps.energy < selected.cost) return set((st) => ({ ...st, message: setMessage("พลังงานไม่พอสำหรับการ์ดใบนี้", "warn") }));
      if (s.cardsPlayedThisTurn >= 2) return set((st) => ({ ...st, message: setMessage("เทิร์นนี้เล่นการ์ดได้สูงสุด 2 ใบ", "warn") }));

      if (selected.type === "unit") {
        const tile = s.board[cell.r]?.[cell.c];
        if (!tile) return;
        const canJumpBlock = canPlaceOnBlockedTile(selected);
        if (tile.kind === "unit") return set((st) => ({ ...st, message: setMessage("ช่องนี้มีตัวอยู่แล้ว", "warn") }));
        if (tile.kind === "block" && !canJumpBlock) return set((st) => ({ ...st, message: setMessage("ช่องนี้ถูกปิดอยู่", "warn") }));
        const boardForPlacement = tile.kind === "block" && canJumpBlock ? cloneBoard(s.board) : s.board;
        if (tile.kind === "block" && canJumpBlock) boardForPlacement[cell.r]![cell.c] = { kind: "empty" };
        const legal = isSuicideUnlessCapture(boardForPlacement, cell, ps.faction);
        if (!legal.ok) return set((st) => ({ ...st, message: setMessage("ตำแหน่งนี้วางไม่ได้", "warn") }));
        const snapshot = makeUndoSnapshot(s);
        let next = applyMove(s, { kind: "playUnit", faction: ps.faction, at: cell, fromCardId: selected.id });

        // ── Synergy: update cardMap and recompute synergy cells ──
        const newCardMap = buildCardMap(next.board, next.human, next.ai, s.cardMap, cell, selected);
        const newSynergies = recomputeSynergies(next.board, newCardMap, next.territoryMap);

        // ── Combo: track sequence and evaluate ──
        const newComboState: ComboState = {
          ...s.comboState,
          playedTemplateIds: [...s.comboState.playedTemplateIds, selected.comboType ?? selected.id],
          playedCardTypes: [...s.comboState.playedCardTypes, "unit"],
        };
        const comboResult = evaluateCombo(newComboState);
        let comboFeedback: ComboFeedback | undefined;
        if (comboResult) {
          newComboState.comboCount = s.comboState.comboCount + 1;
          newComboState.totalCombosThisGame = (s.comboState.totalCombosThisGame ?? 0) + 1;
          if (comboResult.energyBonus > 0) {
            next = { ...next, human: { ...next.human, energy: Math.min(10, next.human.energy + comboResult.energyBonus) } };
            newComboState.energyGranted = s.comboState.energyGranted + comboResult.energyBonus;
          }
          if (comboResult.strongerSkill) newComboState.strongerSkillActive = true;
          comboFeedback = { kind: comboResult.kind, label: comboResult.label, nonce: Date.now() + Math.random() };
        }

        next = {
          ...next,
          cardsPlayedThisTurn: next.cardsPlayedThisTurn + 1,
          selectedCardId: undefined,
          undoSnapshot: snapshot,
          cardMap: newCardMap,
          activeSynergies: newSynergies,
          comboState: newComboState,
          comboFeedback,
        };

        // Apply ability effect immediately (instant auto-execution)
        if (selected.ability) {
           // Before ability, we already have 'next' from applyMove which handled placement and dismissal.
           next.board = applyCardEffect(next.board, selected.comboType ?? selected.id, [cell], ps.faction);
           const { scores, territoryMap } = recompute(next.board, next.human, next.ai);
           next.scores = scores; next.territoryMap = territoryMap;
           next.cardMap = buildCardMap(next.board, next.human, next.ai, next.cardMap);
           next.activeSynergies = recomputeSynergies(next.board, next.cardMap, next.territoryMap);

           next.message = setMessage(`✨ ${selected.name}: ${selected.ability.result}`);
           next.activeEffect = {
             cardName: selected.name,
             icon: selected.icon || "",
             type: selected.type,
             action: selected.ability.action,
             result: selected.ability.result,
           };
        }

        return set(() => endTurnIfNeeded(next));
      }

      if (selected.type === "skill") {
        const sClean = { ...s, targetSelection: undefined };
        const snapshot = makeUndoSnapshot(s);

        // Combo tracking
        const newComboState: ComboState = {
           ...s.comboState, 
           playedTemplateIds: [...s.comboState.playedTemplateIds, selected.comboType ?? selected.id],
           playedCardTypes: [...s.comboState.playedCardTypes, "skill" as const],
        };
        const comboResult = evaluateCombo(newComboState);
        let comboFeedback: ComboFeedback | undefined;
        if (comboResult) {
           newComboState.comboCount++; 
           newComboState.totalCombosThisGame = (newComboState.totalCombosThisGame ?? 0) + 1;
           if (comboResult.energyBonus > 0) {
             comboFeedback = { kind: comboResult.kind, label: comboResult.label, nonce: Date.now() + Math.random() };
           }
           if (comboResult.strongerSkill) newComboState.strongerSkillActive = true;
        }

        // Skill instant execution
        const nextBoard = applyCardEffect(sClean.board, selected.comboType ?? selected.id, [cell], ps.faction); 
        
        // Manual hand/energy management
        const newHand = ps.hand.filter(c => c.id !== selected.id);
        const newDiscard = [selected, ...ps.discard];
        let newEnergy = ps.energy - selected.cost;
        if (comboResult?.energyBonus) newEnergy = Math.min(10, newEnergy + comboResult.energyBonus);

        let next = { 
          ...sClean, 
          board: nextBoard,
          human: { ...ps, hand: newHand, discard: newDiscard, energy: newEnergy }
        };

        const { scores, territoryMap } = recompute(next.board, next.human, next.ai);
        next.scores = scores; next.territoryMap = territoryMap;
        next.cardMap = buildCardMap(next.board, next.human, next.ai, next.cardMap);
        next.activeSynergies = recomputeSynergies(next.board, next.cardMap, next.territoryMap);

        if (selected.ability) {
           next.message = setMessage(`✨ ${selected.name}: ${selected.ability.result}`);
           next.activeEffect = {
             cardName: selected.name, icon: selected.icon || "", type: selected.type,
             action: selected.ability.action, result: selected.ability.result,
           };
        }
        next.cardsPlayedThisTurn += 1;
        next.selectedCardId = undefined;
        next.undoSnapshot = snapshot;
        next.comboState = newComboState;
        next.comboFeedback = comboFeedback;
        return set(() => endTurnIfNeeded(next));
      }
    },

    cancelTargetSelection: () => {
      const s = get();
      if (!s.targetSelection || !s.undoSnapshot) return;
      // Revert state
      set(() => ({
         ...s.undoSnapshot,
         targetSelection: undefined,
         message: undefined
      }));
    },

    confirmTargetSelection: () => {
      const s = get();
      if (!s.targetSelection) return;
      
      const ts = s.targetSelection;
      
      const isSkill = !ts.selectedCoords[0] || (ts.maxSteps > 0 && ts.selectedCoords.length === 0);
      const expectedSteps = isSkill ? ts.maxSteps : ts.maxSteps + 1; // if unit, index 0 is placement
      if (ts.selectedCoords.length < expectedSteps) {
         return set((st) => ({ ...st, message: setMessage("กรุณาเลือกเป้าหมายให้ครบ", "warn") }));
      }
      
      const handCard = s.undoSnapshot?.human.hand.find(c => c.comboType === ts.templateId || c.id === ts.templateId) || s.human.hand.find(c => c.id === ts.cardId);
      
      // ONLINE MODE: Call performOnlineAction instead of local logic
      if (s.onlineMode && s.onlineRoomId && s.onlineUserId) {
         // Determine which move kind to send based on template/skill
         let kind: Move["kind"] = "playUnit";
         if (handCard?.type === "skill") {
           const sk = handCard.skill.kind;
           if (sk === "destroyWeakGroup") kind = "skillDestroyWeakGroup";
           else if (sk === "blockTile") kind = "skillBlockTile";
           else if (sk === "pushUnit") kind = "skillPushUnit";
           else if (sk === "stormCut") kind = "skillStormCut";
         }

         const move: any = { 
           kind, 
           faction: s.human.faction, 
           fromCardId: ts.cardId,
           // Inject targets into the move object
           targets: ts.selectedCoords 
         };

         // Map specific fields expected by types.ts if necessary
         if (kind === "playUnit") move.at = ts.selectedCoords[0];
         if (kind === "skillBlockTile") move.at = ts.selectedCoords[0];
         if (kind === "skillDestroyWeakGroup") move.targetAnyCellInEnemyGroup = ts.selectedCoords[0];
         if (kind === "skillPushUnit") move.from = ts.selectedCoords[0];
         if (kind === "skillStormCut") move.center = ts.selectedCoords[0];

         performOnlineAction(s.onlineRoomId, s.onlineUserId, { kind: "move", move: move as Move });
         set({ targetSelection: undefined }); // Clear local UI state
         return;
      }

      // LOCAL MODE (remains unchanged)
      const newBoard = applyCardEffect(s.board, ts.templateId, ts.selectedCoords, s.human.faction);
      let nextState = { ...s, targetSelection: undefined, board: newBoard };
      
      const { scores, territoryMap } = recompute(newBoard, nextState.human, nextState.ai);
      nextState.scores = scores;
      nextState.territoryMap = territoryMap;
      
      const newCardMap = buildCardMap(newBoard, nextState.human, nextState.ai, nextState.cardMap);
      nextState.cardMap = newCardMap;
      nextState.activeSynergies = recomputeSynergies(newBoard, newCardMap, territoryMap);

      nextState.message = setMessage(`💥 ${handCard?.ability?.result || "อานุภาพสำแดงผล!"}`);
      if (handCard?.ability) {
        nextState.activeEffect = {
          cardName: handCard.name,
          icon: handCard.icon || "",
          type: handCard.type,
          action: handCard.ability.action,
          result: handCard.ability.result
        };
      }
      
      return set(() => endTurnIfNeeded(nextState));
    },

    triggerActiveEffect: (payload) => set((s) => ({ ...s, activeEffect: payload })),

    tryPass: () => {
      const s = get();
      if (s.phase !== "player" || s.active !== "HUMAN") {
        if (s.onlineMode) console.warn("PASS BLOCKED", { role: s.onlinePlayerRole, active: s.active });
        return;
      }

      if (s.onlineMode && s.onlineRoomId) {
        console.log("TRY PASS", { role: s.onlinePlayerRole });
        performOnlineAction(s.onlineRoomId!, s.onlineUserId, { kind: "pass" });
        return;
      }

      if (s.cardsPlayedThisTurn > 0) {
        return set((st) => ({ ...st, message: setMessage("ข้ามเทิร์นไม่ได้ เพราะคุณเล่นการ์ดแล้ว ให้กดจบเทิร์นแทน", "warn") }));
      }
      let next = applyMove(s, { kind: "pass" });
      // Count this pass towards consecutive-pass detection.
      next = { ...next, consecutivePasses: s.consecutivePasses + 1, selectedCardId: undefined, hoverCell: undefined, undoSnapshot: undefined };
      next = endTurnIfNeeded(next);
      if (next.phase === "gameOver") return set(() => next);
      set(() => next);
      runAiTurn();
    },

    tryEndTurn: () => {
      const s = get();
      if (s.phase !== "player" || s.active !== "HUMAN") {
        if (s.onlineMode) console.warn("END TURN BLOCKED", { role: s.onlinePlayerRole, active: s.active });
        return;
      }

      if (s.onlineMode && s.onlineRoomId) {
        console.log("TRY END TURN (ONLINE)", { role: s.onlinePlayerRole });
        performOnlineAction(s.onlineRoomId!, s.onlineUserId, { kind: "endTurn" });
        set((st) => ({ ...st, selectedCardId: undefined, message: undefined }));
        return;
      }

      if (s.cardsPlayedThisTurn === 0) {
        return set((st) => ({ ...st, message: setMessage("หากไม่ต้องการเล่นการ์ด ให้กดข้ามเทิร์น", "info") }));
      }
      // Card was played — reset consecutive passes.
      const next = {
        ...s,
        human: { ...s.human, passedLastTurn: false },
        consecutivePasses: 0,
        selectedCardId: undefined,
        hoverCell: undefined,
        undoSnapshot: undefined,
        message: setMessage("จบเทิร์นแล้ว รอ AI เล่น...", "info"),
      };
      set(() => next);
      runAiTurn();
    },

    undoLastMove: () => {
      const s = get();
      if (s.phase !== "player" || s.active !== "HUMAN") return;
      if (!s.undoSnapshot) {
        return set((st) => ({ ...st, message: setMessage("ยังไม่มีการลงล่าสุดให้ยกเลิก", "warn") }));
      }
      const snap = s.undoSnapshot;
      set((st) => ({
        ...st,
        board: cloneBoard(snap.board),
        human: clonePlayerState(snap.human),
        ai: clonePlayerState(snap.ai),
        territoryMap: snap.territoryMap.map((r) => [...r]),
        scores: {
          territory: { ...snap.scores.territory },
          captures: { ...snap.scores.captures },
          bonus: { ...snap.scores.bonus },
          total: { ...snap.scores.total },
        },
        lastCaptures: snap.lastCaptures.map((e) => ({ ...e, stonesRemoved: e.stonesRemoved.map((p) => ({ ...p })) })),
        lastMove: snap.lastMove ? { ...snap.lastMove } : undefined,
        cardsPlayedThisTurn: snap.cardsPlayedThisTurn,
        selectedCardId: snap.selectedCardId,
        hoverCell: snap.hoverCell ? { ...snap.hoverCell } : undefined,
        turnEnergyBonus: {
          HUMAN: { ...snap.turnEnergyBonus.HUMAN },
          AI: { ...snap.turnEnergyBonus.AI },
        },
        activeSynergies: [...snap.activeSynergies],
        comboState: { ...snap.comboState, playedTemplateIds: [...snap.comboState.playedTemplateIds], playedCardTypes: [...snap.comboState.playedCardTypes] },
        cardMap: new Map(snap.cardMap),
        comboFeedback: undefined,
        undoSnapshot: undefined,
        message: setMessage("ยกเลิกการลงล่าสุดแล้ว", "info"),
      }));
    },

    nextTutorial: () => set((s) => ({ ...s, tutorialStep: Math.min(4, s.tutorialStep + 1) })),
    prevTutorial: () => set((s) => ({ ...s, tutorialStep: Math.max(0, s.tutorialStep - 1) })),
    dismissComboFeedback: () => set((s) => ({ ...s, comboFeedback: undefined })),
    mulliganOnce: () => {
      const s = get();
      if (s.phase !== "player" || s.active !== "HUMAN") return;
      if (s.turn > 1 || s.human.mulliganUsed) return;
      const handToDiscard = [...s.human.hand, ...s.human.discard];
      const redrawn = drawUpTo([], s.human.deck, handToDiscard, 5);
      const ensured = ensurePlayableCard(redrawn.hand, redrawn.deck, redrawn.discard, s.human.energy, s.human.faction);
      set((st) => ({
        ...st,
        human: {
          ...st.human,
          hand: ensured.hand,
          deck: ensured.deck,
          discard: ensured.discard,
          mulliganUsed: true,
        },
        selectedCardId: undefined,
        message: setMessage("สับมือใหม่แล้ว (Mulligan)"),
      }));
    },

    setOnlineMode: (roomId, role) => set((s) => {
      // CLEAR any existing game state completely when switching to online mode
      // This prevents AI game data from bleeding into the online room.
      const pf = s.playerFaction ?? "RAMA";
      const emptyBoard = makeEmptyBoard(BOARD_SIZE);
      const emptyPlayer = (faction: Faction): PlayerState => ({
        faction,
        deck: [],
        hand: [],
        discard: [],
        energy: 0,
        captures: 0,
        passedLastTurn: false,
        mulliganUsed: false,
      });

      return {
        ...s,
        onlineMode: !!roomId,
        onlineRoomId: roomId,
        onlinePlayerRole: role,
        active: "AI", // Lock UI until sync/init completes
        phase: roomId ? "connecting" : "menu",
        // Reset core game state
        board: emptyBoard,
        turn: 0,
        human: emptyPlayer(pf),
        ai: emptyPlayer(otherFaction(pf)),
        scores: computeScore(emptyBoard, { RAMA: 0, LANKA: 0 }).scores,
        territoryMap: emptyTerritoryMap(BOARD_SIZE),
        cardsPlayedThisTurn: 0,
        selectedCardId: undefined,
        undoSnapshot: undefined,
        message: roomId ? setMessage("กำลังเชื่อมต่อห้อง...", "info") : undefined,
      };
    }),

    syncFromOnline: (room) => set((s) => {
      const myRole: "player1" | "player2" = room.player1?.id === s.onlineUserId ? "player1" : "player2";
      const isMyTurn = room.turn === myRole;
      const isPlaying = room.status === "playing";
      
      const rawSnap = room.gameState;
      if (!rawSnap) {
        console.log("SYNC: Waiting for gameState", { isPlaying, isMyTurn });
        return {
          ...s,
          onlineMode: true,
          onlineRoomId: s.onlineRoomId,
          onlinePlayerRole: myRole,
          active: "AI" as Player,
          phase: "connecting" as TurnPhase,
          message: isPlaying && isMyTurn ? setMessage("กำลังซิงค์ข้อมูลเกม...", "info") : s.message
        };
      }

      const snap = normalizeState(rawSnap);

      const isGameOver = snap.phase === "gameOver";

      const baseUpdate: Partial<GameState> = {
        onlineMode: true,
        onlineRoomId: s.onlineRoomId,
        onlinePlayerRole: myRole,
        active: (isPlaying && isMyTurn) ? "HUMAN" : "AI" as Player,
        phase: (isPlaying && !isMyTurn && !isGameOver) ? "aiThinking" : (snap.phase as TurnPhase),
      };

      // Role Swapping Logic:
      // Firebase: player1 = Host, player2 = Guest
      // Local Store: human = ME, ai = OPPONENT
      let human = clonePlayerState(snap.human);
      let ai = clonePlayerState(snap.ai);

      if (myRole === "player2") {
        human = clonePlayerState(snap.ai);
        ai = clonePlayerState(snap.human);
      }

      return {
        ...s,
        ...baseUpdate,
        board: snap.board || s.board,
        turn: snap.turn ?? s.turn,
        scores: snap.scores || s.scores,
        territoryMap: snap.territoryMap || s.territoryMap,
        lastCaptures: snap.lastCaptures || s.lastCaptures,
        lastMove: snap.lastMove || s.lastMove,
        cardsPlayedThisTurn: snap.cardsPlayedThisTurn ?? s.cardsPlayedThisTurn,
        activeSynergies: snap.activeSynergies || s.activeSynergies,
        comboState: snap.comboState || s.comboState,
        boardStateHistory: snap.boardStateHistory || s.boardStateHistory || [],
        consecutivePasses: snap.consecutivePasses ?? s.consecutivePasses,
        cardMap: snap.cardMap,
        human,
        ai,
      };
    }),

    initOnlineGame: async () => {
      const s = get();
      if (!s.onlineMode || !s.onlineRoomId || s.onlinePlayerRole !== "host") return;
      if (s.isInitializing) return;

      set({ isInitializing: true });
      try {
        const pf = s.playerFaction ?? "RAMA";
        const hostFaction = pf;
        const guestFaction = otherFaction(pf);
        
        const sInit = fresh(hostFaction, s.settings);
        const aiRandomDeck = generateRandomDeck(guestFaction, CARD_LIBRARY.map(c => c.templateId), Date.now());
        sInit.ai = initPlayer(guestFaction, aiRandomDeck.ids);

        // RANDOMIZE TURN ORDER BEFORE STARTING
        const firstTurn: "player1" | "player2" = Math.random() > 0.5 ? "player1" : "player2";
        const firstActor: Player = (firstTurn === "player1") ? "HUMAN" : "AI";

        const started = startOfTurn({ ...sInit, phase: "player", active: firstActor }, firstActor);

        const firebaseState = stripUndefined({
          ...started,
          cardMap: serializeMap(started.cardMap),
          undoSnapshot: null,
          onlineMode: true,
          hostId: s.onlineUserId
        });

        console.log("PUSHING INITIAL GAME STATE", { firstTurn, firebaseState });

        await update(ref(db, `battle_rooms_v2/${s.onlineRoomId}`), {
          gameState: firebaseState,
          turn: firstTurn,
          status: "playing",
        });
        
        console.log("INITIALIZATION COMPLETE");
        set({ phase: "player" });
      } finally {
        set({ isInitializing: false });
      }
    },
  };
});

export const serializeMap = (map: Map<any, any> | undefined | null) => {
  if (!map || !(map instanceof Map)) return {};
  return Object.fromEntries(map);
};

/**
 * Recursively removes all properties with 'undefined' values from an object.
 * Required for Firebase compatibility as it does not allow 'undefined' in updates.
 */
function stripUndefined(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(v => stripUndefined(v));
  } else if (obj !== null && typeof obj === "object") {
    return Object.entries(obj).reduce((acc: any, [key, value]) => {
      if (value !== undefined) {
        acc[key] = stripUndefined(value);
      }
      return acc;
    }, {});
  }
  return obj;
}

export async function performOnlineAction(roomId: string, userId: string, action: { kind: "move", move: Move } | { kind: "pass" } | { kind: "endTurn" }) {
  const roomRef = ref(db, `battle_rooms_v2/${roomId}`);
  
  return runTransaction(roomRef, (room) => {
    if (!room) return room;
    
    const myRole = room.player1?.id === userId ? "player1" : "player2";
    console.log("TRANSACTION ATTEMPT", { myRole, roomTurn: room.turn, action: action.kind });

    if (room.turn !== myRole) {
      console.warn("TRANSACTION BLOCKED: NOT YOUR TURN", { myRole, roomTurn: room.turn });
      return room;
    }

    const rawState = room.gameState;
    if (!rawState) {
      console.warn("TRANSACTION BLOCKED: NO GAME STATE");
      return room;
    } 

    const rawNormalized = normalizeState(rawState);
    const turnActor: Player = room.turn === "player1" ? "HUMAN" : "AI";
    
    // CRITICAL: Ensure the state we are about to modify has the correct active player matching the turn
    const state: GameState = {
      ...rawNormalized,
      active: turnActor
    };

    const myRoleForActor = room.player1?.id === userId ? "player1" : "player2";
    const actor = myRoleForActor === "player1" ? "HUMAN" : "AI"; 
    
    let nextState = { ...state };
    let shouldToggleTurn = false;

    if (action.kind === "move") {
      // Apply move directly to existing state (using the synced active player)
      nextState = applyMove(state, action.move);

      // Apply card effects
      const move = action.move;
      if (move.kind !== "pass") {
        const playedCard = (actor === "HUMAN" ? state.human : state.ai).hand.find(c => c.id === (move as any).fromCardId);
        if (playedCard && playedCard.ability) {
          const templateId = playedCard.comboType ?? playedCard.id;
          let coords: Coord[] = [];
          if (move.kind === "playUnit" || move.kind === "skillBlockTile") coords = [move.at];
          else if (move.kind === "skillDestroyWeakGroup") coords = [move.targetAnyCellInEnemyGroup];
          else if (move.kind === "skillPushUnit") coords = [move.from];
          else if (move.kind === "skillStormCut") coords = [move.center];

          nextState.board = applyCardEffect(nextState.board, templateId, coords, (actor === "HUMAN" ? nextState.human.faction : nextState.ai.faction));
          
          const rec = recompute(nextState.board, nextState.human, nextState.ai);
          nextState.scores = rec.scores;
          nextState.territoryMap = rec.territoryMap;
          nextState.cardMap = buildCardMap(nextState.board, nextState.human, nextState.ai, nextState.cardMap);
          nextState.activeSynergies = recomputeSynergies(nextState.board, nextState.cardMap, nextState.territoryMap);
        }
      }
      nextState.cardsPlayedThisTurn++;
    } else if (action.kind === "pass") {
      const actor = myRoleForActor === "player1" ? "HUMAN" : "AI";
      nextState = applyMove(state, { kind: "pass" });
      nextState.consecutivePasses++;
      shouldToggleTurn = true;
    } else if (action.kind === "endTurn") {
      shouldToggleTurn = true;
    }

    nextState = endTurnIfNeeded(nextState);
    
    if (shouldToggleTurn && nextState.phase !== "gameOver") {
      room.turn = (room.turn === "player1") ? "player2" : "player1";
      const nextActor = room.turn === "player1" ? "HUMAN" : "AI";
      nextState = startOfTurn(nextState, nextActor);
    }

    // Prepare for Firebase (serialize Map)
    const firebaseState = stripUndefined({
      ...nextState,
      cardMap: serializeMap(nextState.cardMap),
      undoSnapshot: null, 
    });

    room.gameState = firebaseState;
    return room;
  });
}

export function usePreview(): PreviewResult | undefined {
  const s = useGameStore();
  if (s.phase !== "player" && s.phase !== "aiThinking") return undefined;
  if (!s.hoverCell) return undefined;
  return makePreview(s, s.hoverCell);
}

export function useSuggestion() {
  const s = useGameStore();
  return computeSuggestion(s);
}

export function libertiesOverlay(board: Board) {
  const size = board.length;
  const dots: { at: Coord; faction: Faction; n: number }[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const t = board[r]![c]!;
      if (t.kind !== "unit") continue;
      const n = countLibertiesAt(board, { r, c });
      dots.push({ at: { r, c }, faction: t.faction, n });
    }
  }
  return dots;
}

if (typeof window !== "undefined") {
  useGameStore.subscribe((state) => {
    saveData("game_state", state);
  });
}
