/**
 * ai.ts — Smarter AI for Ramakien Strategy Game
 *
 * Design goals:
 *  • Evaluates board state with a multi-factor scoring function (territory,
 *    capture threats, danger, centre control, combo tags).
 *  • Skill targeting is smart per skill kind (kill biggest group, block best
 *    liberty-removing cell, push to kill etc.)
 *  • Human-like variation: easy 50% best / normal 80% best / hard 95% best.
 *  • Comeback bonus: aggressive weighting when AI is losing.
 *  • Anti-repeat: avoids placing on the same cell twice in a row.
 *
 * The public signature of aiChooseMove() is UNCHANGED — all callers remain
 * compatible.
 */

import type { Board, Card, Coord, Faction, Move, ScoreBreakdown } from "./types";
import {
  applyCapturesAfterPlacement,
  cloneBoard,
  getGroup,
  getLiberties,
  getNeighbors,
  inBounds,
  isSuicideUnlessCapture,
  placeUnit,
  removeGroup,
} from "./logic";
import { computeScore } from "./territory";

// ─── Public input type (unchanged) ───────────────────────────────────────────

export type AiInput = {
  level: 1 | 2 | 3;
  board: Board;
  turn: number;
  aiFaction: Faction;
  humanFaction: Faction;
  hand: Card[];
  energy: number;
  captures: Record<Faction, number>;
  /** Optional: coord-string of the AI's previous move (for anti-repeat). */
  lastMoveCoord?: string;
};

// ─── Internals ────────────────────────────────────────────────────────────────

function allCoords(size: number): Coord[] {
  const out: Coord[] = [];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) out.push({ r, c });
  return out;
}

function coordKey(p: Coord) { return `${p.r},${p.c}`; }

/** Crypto-quality randomness when available, fallback to Math.random */
function rand01(): number {
  if (
    typeof globalThis !== "undefined" &&
    "crypto" in globalThis &&
    "getRandomValues" in globalThis.crypto
  ) {
    const a = new Uint32Array(1);
    globalThis.crypto.getRandomValues(a);
    return a[0]! / 0xffffffff;
  }
  return Math.random();
}

function randInt(n: number) { return Math.floor(rand01() * Math.max(1, n)); }

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

// ─── Board evaluation ─────────────────────────────────────────────────────────

/**
 * Rich multi-factor board evaluation.
 * Returns a score from the AI's perspective (higher = better for AI).
 */
function evaluateBoard(
  board: Board,
  aiFaction: Faction,
  humanFaction: Faction,
  captures: Record<Faction, number>,
): number {
  const { scores } = computeScore(board, captures);
  const size = board.length;
  const centre = Math.floor(size / 2);

  let score = 0;

  // ── Territory (primary) ────────────────────────────────────────────────────
  score += (scores.territory[aiFaction] - scores.territory[humanFaction]) * 2;
  // ── Captures ──────────────────────────────────────────────────────────────
  score += (scores.captures[aiFaction] - scores.captures[humanFaction]) * 1.5;

  const seenGroups = new Set<string>();

  for (const p of allCoords(size)) {
    const t = board[p.r]![p.c]!;
    if (t.kind !== "unit") continue;

    const isAi = t.faction === aiFaction;
    const g = getGroup(board, p);
    const gKey = g.map(coordKey).sort().join("|");
    if (seenGroups.has(gKey)) continue;
    seenGroups.add(gKey);

    const libs = getLiberties(board, g).length;

    if (isAi) {
      // ── Danger: our groups with few liberties ──────────────────────────
      if (libs === 0) score -= 12;
      else if (libs === 1) score -= 7;
      else if (libs === 2) score -= 2;
      // ── Centre control bonus ───────────────────────────────────────────
      for (const c of g) {
        const dist = Math.max(Math.abs(c.r - centre), Math.abs(c.c - centre));
        if (dist <= 1) score += 1.2;
        else if (dist <= 2) score += 0.4;
      }
    } else {
      // ── Capture opportunity: enemy groups with few liberties ───────────
      if (libs === 0) score += 14;        // already dead (shouldn't normally happen)
      else if (libs === 1) score += 9;    // one move to kill
      else if (libs === 2) score += 3.5;  // reachable threat
    }
  }

  return score;
}

// ─── Unit move scoring ────────────────────────────────────────────────────────

function scoreUnitMove(
  board: Board,
  at: Coord,
  aiFaction: Faction,
  humanFaction: Faction,
  captures: Record<Faction, number>,
  card: Card,
  scores: ScoreBreakdown,
): number {
  const legality = isSuicideUnlessCapture(board, at, aiFaction);
  if (!legality.ok) return -Infinity;

  const placed = placeUnit(board, at, aiFaction);
  const after = applyCapturesAfterPlacement(placed, at, aiFaction);

  const myGroup = getGroup(after.board, at);
  const myLibs = getLiberties(after.board, myGroup).length;

  // Hard veto: placing here leaves our group with 0 liberties.
  if (myLibs === 0) return -Infinity;

  const capturedCount = after.captured.reduce((sum, e) => sum + e.stonesRemoved.length, 0);

  // Updated captures for scoring
  const newCaptures = { ...captures, [aiFaction]: captures[aiFaction] + capturedCount };
  const boardScore = evaluateBoard(after.board, aiFaction, humanFaction, newCaptures);

  let s = boardScore;

  // ── Liberty safety ─────────────────────────────────────────────────────────
  if (myLibs === 1) s -= 6;     // very risky
  else if (myLibs === 2) s -= 1;
  else if (myLibs >= 4) s += 1; // very safe

  // ── Capture reward ────────────────────────────────────────────────────────
  s += capturedCount * 5;

  // ── Synergy/combo tag bonus ───────────────────────────────────────────────
  const tags = card.synergyTags ?? [];
  const comboTags = ["monkey", "demon", "hero_rama", "hero_lanka", "chain", "summon"];
  for (const t of tags) if (comboTags.includes(t)) { s += 1.5; break; }

  // ── Legendary: only play in a safe position ───────────────────────────────
  if (card.tier === "legendary") {
    if (myLibs >= 3) s += 3;
    else s -= 4;
  }

  // ── Comeback bonus: AI losing → boost aggressive moves ───────────────────
  const aiTotal = scores.total[aiFaction];
  const humanTotal = scores.total[humanFaction];
  if (aiTotal < humanTotal - 5) {
    s += capturedCount > 0 ? 4 : 1.5;
  }

  return s;
}

// ─── Skill move scoring ───────────────────────────────────────────────────────

type ScoredSkillMove = { move: Move; score: number };

function scoreSkillMoves(
  board: Board,
  card: Card,
  aiFaction: Faction,
  humanFaction: Faction,
  captures: Record<Faction, number>,
  scores: ScoreBreakdown,
): ScoredSkillMove[] {
  if (card.type !== "skill") return [];
  const size = board.length;
  const isDesperate = scores.total[aiFaction] < scores.total[humanFaction] - 5;
  const results: ScoredSkillMove[] = [];

  // ── destroyWeakGroup ──────────────────────────────────────────────────────
  if (card.skill.kind === "destroyWeakGroup") {
    const targets: { p: Coord; libs: number; size: number }[] = [];
    const seen = new Set<string>();
    for (const p of allCoords(size)) {
      const t = board[p.r]![p.c]!;
      if (t.kind !== "unit" || t.faction === aiFaction) continue;
      const g = getGroup(board, p);
      const key = g.map(coordKey).sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      const libs = getLiberties(board, g).length;
      if (libs > 0 && libs <= 2) targets.push({ p, libs, size: g.length });
    }
    // Sort: 1-liberty > 2-liberty, then larger group first
    targets.sort((a, b) => a.libs - b.libs || b.size - a.size);
    for (const { p, libs, size: gs } of targets.slice(0, 3)) {
      const bonus = isDesperate ? 4 : 0;
      results.push({
        move: { kind: "skillDestroyWeakGroup", caster: aiFaction, targetAnyCellInEnemyGroup: p, fromCardId: card.id },
        score: (libs === 1 ? 12 : 7) + gs * 1.5 + bonus,
      });
    }
  }

  // ── blockTile ─────────────────────────────────────────────────────────────
  if (card.skill.kind === "blockTile") {
    const empties: { p: Coord; libertyReduction: number; distCentre: number }[] = [];
    const centre = Math.floor(size / 2);
    for (const p of allCoords(size)) {
      if (board[p.r]![p.c]!.kind !== "empty") continue;
      // Count how many enemy liberties this cell is
      let libertyReduction = 0;
      for (const n of getNeighbors(p)) {
        const t = board[n.r]?.[n.c];
        if (t && t.kind === "unit" && t.faction === humanFaction) libertyReduction++;
      }
      const distCentre = Math.abs(p.r - centre) + Math.abs(p.c - centre);
      empties.push({ p, libertyReduction, distCentre });
    }
    // Sort: most enemy liberty reduction first, then closest to centre
    empties.sort((a, b) => b.libertyReduction - a.libertyReduction || a.distCentre - b.distCentre);
    for (const { p, libertyReduction } of empties.slice(0, 4)) {
      results.push({
        move: { kind: "skillBlockTile", caster: aiFaction, at: p, durationTurns: 2, fromCardId: card.id },
        score: 2.5 + libertyReduction * 2.5,
      });
    }
  }

  // ── pushUnit ──────────────────────────────────────────────────────────────
  if (card.skill.kind === "pushUnit") {
    const dirs = ["up", "down", "left", "right"] as const;
    const deltas: Record<string, Coord> = { up: { r: -1, c: 0 }, down: { r: 1, c: 0 }, left: { r: 0, c: -1 }, right: { r: 0, c: 1 } };
    for (const p of allCoords(size)) {
      const t = board[p.r]![p.c]!;
      if (t.kind !== "unit" || t.faction === aiFaction) continue;
      for (const dir of dirs) {
        const to = { r: p.r + deltas[dir]!.r, c: p.c + deltas[dir]!.c };
        if (!inBounds(board, to) || board[to.r]![to.c]!.kind !== "empty") continue;
        const sim = cloneBoard(board);
        sim[to.r]![to.c] = { kind: "unit", faction: humanFaction };
        sim[p.r]![p.c] = { kind: "empty" };
        const movedGroup = getGroup(sim, to);
        const newLibs = getLiberties(sim, movedGroup).length;
        const killBonus = newLibs === 0 ? 8 : newLibs === 1 ? 4 : 0;
        if (killBonus > 0 || isDesperate) {
          results.push({
            move: { kind: "skillPushUnit", caster: aiFaction, from: p, dir, fromCardId: card.id },
            score: 4 + killBonus + (isDesperate ? 2 : 0),
          });
        }
      }
    }
  }

  // ── stormCut ──────────────────────────────────────────────────────────────
  if (card.skill.kind === "stormCut") {
    const centres: { p: Coord; enemiesHit: number; alliesHit: number }[] = [];
    for (const p of allCoords(size)) {
      let enemiesHit = 0;
      let alliesHit = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const q = { r: p.r + dr, c: p.c + dc };
          if (!inBounds(board, q)) continue;
          const t = board[q.r]![q.c]!;
          if (t.kind === "unit") {
            if (t.faction === humanFaction) enemiesHit++;
            else alliesHit++;
          }
        }
      }
      if (enemiesHit > 0 && enemiesHit > alliesHit) {
        centres.push({ p, enemiesHit, alliesHit });
      }
    }
    centres.sort((a, b) => b.enemiesHit - a.enemiesHit || a.alliesHit - b.alliesHit);
    for (const { p, enemiesHit, alliesHit } of centres.slice(0, 3)) {
      results.push({
        move: { kind: "skillStormCut", caster: aiFaction, center: p, radius: 1, fromCardId: card.id },
        score: 5 + enemiesHit * 3 - alliesHit * 4 + (isDesperate ? 3 : 0),
      });
    }
  }

  return results;
}

// ─── Minimax (depth-2, level 3 only) ─────────────────────────────────────────

function simulateUnitMove(board: Board, at: Coord, faction: Faction): Board | null {
  if (!inBounds(board, at) || board[at.r]![at.c]!.kind !== "empty") return null;
  if (!isSuicideUnlessCapture(board, at, faction).ok) return null;
  const placed = placeUnit(board, at, faction);
  return applyCapturesAfterPlacement(placed, at, faction).board;
}

function worstReplyEval(
  board: Board,
  aiFaction: Faction,
  humanFaction: Faction,
  captures: Record<Faction, number>,
): number {
  const empties: Coord[] = [];
  for (const p of allCoords(board.length)) if (board[p.r]![p.c]!.kind === "empty") empties.push(p);

  let worstForAi = Infinity;
  for (const at of empties.slice(0, 20)) {
    const b2 = simulateUnitMove(board, at, humanFaction);
    if (!b2) continue;
    const s = evaluateBoard(b2, aiFaction, humanFaction, captures);
    if (s < worstForAi) worstForAi = s;
  }
  return worstForAi === Infinity ? evaluateBoard(board, aiFaction, humanFaction, captures) : worstForAi;
}

// ─── Public entry point ───────────────────────────────────────────────────────

export function aiChooseMove(input: AiInput): Move {
  const { level, board, aiFaction, humanFaction, hand, energy, captures, lastMoveCoord } = input;

  const unitCards = hand.filter((c) => c.type === "unit" && c.cost <= energy);
  const skillCards = hand.filter((c) => c.type === "skill" && c.cost <= energy);
  const size = board.length;

  // ── Level 1: mostly random legal placement ───────────────────────────────
  if (level === 1) {
    const empties: Coord[] = [];
    for (const p of allCoords(size)) if (board[p.r]![p.c]!.kind === "empty") empties.push(p);
    const candidates = shuffled(empties);
    for (const at of candidates) {
      const card = unitCards[randInt(Math.max(1, unitCards.length))];
      if (!card) break;
      if (isSuicideUnlessCapture(board, at, aiFaction).ok)
        return { kind: "playUnit", faction: aiFaction, at, fromCardId: card.id };
    }
    return { kind: "pass" };
  }

  // ── Level 2 / 3: heuristic search ───────────────────────────────────────
  const { scores } = computeScore(board, captures);

  type Cand = { move: Move; score: number };
  const cands: Cand[] = [];

  // Unit placements
  const empties: Coord[] = [];
  for (const p of allCoords(size)) if (board[p.r]![p.c]!.kind === "empty") empties.push(p);

  for (const card of unitCards) {
    for (const at of empties) {
      const s = scoreUnitMove(board, at, aiFaction, humanFaction, captures, card, scores);
      if (s === -Infinity) continue;
      cands.push({
        move: { kind: "playUnit", faction: aiFaction, at, fromCardId: card.id },
        score: s,
      });
    }
  }

  // Skill moves
  for (const card of skillCards) {
    const skillCands = scoreSkillMoves(board, card, aiFaction, humanFaction, captures, scores);
    for (const sc of skillCands) cands.push(sc);
  }

  if (!cands.length) return { kind: "pass" };

  cands.sort((a, b) => b.score - a.score);

  // Anti-repeat: if best move == last move coord, demote it slightly
  if (lastMoveCoord && cands.length > 1) {
    const bestMove = cands[0]!.move;
    let bestCoord: string | undefined;
    if (bestMove.kind === "playUnit") bestCoord = coordKey(bestMove.at);
    if (bestCoord === lastMoveCoord) {
      // Swap best and second-best
      const tmp = cands[0]!;
      cands[0] = cands[1]!;
      cands[1] = tmp;
    }
  }

  // ── Level 3 minimax on top candidates ────────────────────────────────────
  if (level === 3) {
    const top = cands.slice(0, 8);
    let bestMove = top[0]!.move;
    let bestScore = -Infinity;

    for (const cand of top) {
      let afterBoard: Board | null = null;
      if (cand.move.kind === "playUnit") {
        afterBoard = simulateUnitMove(board, cand.move.at, aiFaction);
      }
      const futureScore = afterBoard
        ? worstReplyEval(afterBoard, aiFaction, humanFaction, captures)
        : cand.score;
      const combined = cand.score * 0.6 + futureScore * 0.4;
      if (combined > bestScore) {
        bestScore = combined;
        bestMove = cand.move;
      }
    }
    return bestMove;
  }

  // ── Human-like variation ─────────────────────────────────────────────────
  //   level 2: 80% pick best, 20% pick randomly from top 5
  const bestThreshold = level === 2 ? 0.80 : 0.95;
  if (rand01() > bestThreshold && cands.length > 1) {
    const pool = cands.slice(0, Math.min(5, cands.length));
    return pool[randInt(pool.length)]!.move;
  }

  return cands[0]!.move;
}
