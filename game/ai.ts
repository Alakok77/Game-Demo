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

export type PlayerPowerMetrics = {
  averageCardTier: number; // 1: basic, 2: hero, 3: legendary
  totalDeckPower: number;   // sum of tiers or similar
  winRate: number;         // 0.0 - 1.0
  comboUsageRate: number;  // average combos per match
  consecutiveCombos?: number; // current match info
};

export type AiInput = {
  level: 1 | 2 | 3 | 4; // Now supports Level 4 (Supreme)
  board: Board;
  turn: number;
  aiFaction: Faction;
  humanFaction: Faction;
  hand: Card[];
  energy: number;
  captures: Record<Faction, number>;
  /** Optional meta-metrics for adaptive scaling */
  playerPowerMetrics?: PlayerPowerMetrics;
  /** Optional: coord-string of the AI's previous move (for anti-repeat). */
  lastMoveCoord?: string;
};

// ─── Internals ────────────────────────────────────────────────────────────────

/**
 * Part 1: AI Level System (Dynamic)
 * aiLevel = function(playerPower)
 */
export function calculateDynamicLevel(metrics: PlayerPowerMetrics): number {
  const { averageCardTier, totalDeckPower, winRate, comboUsageRate, consecutiveCombos = 0 } = metrics;
  
  // Player Power Formula:
  // Normalize factors (approximate weights)
  const power = 
    (averageCardTier * 2) + 
    (totalDeckPower / 10) + 
    (winRate * 10) + 
    (comboUsageRate * 2) +
    (consecutiveCombos * 1.5);

  if (power < 10) return 1;
  if (power < 18) return 2;
  if (power < 28) return 3;
  return 4; // Supreme AI
}

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

// ─── Strategy Modes (Part 3 & 4) ──────────────────────────────────────────────

type StrategyMode = "Aggressive" | "Defense" | "Control" | "Combo";

type StrategyWeights = {
  killValue: number;
  territoryGain: number;
  survival: number;
  comboPotential: number;
  boardControl: number;
};

const STRATEGY_MODES: Record<StrategyMode, StrategyWeights> = {
  Aggressive: { killValue: 12, territoryGain: 2, survival: 3, comboPotential: 5, boardControl: 2 },
  Defense:    { killValue: 5,  territoryGain: 4, survival: 12, comboPotential: 3, boardControl: 6 },
  Control:    { killValue: 6,  territoryGain: 10, survival: 5, comboPotential: 4, boardControl: 8 },
  Combo:      { killValue: 4,  territoryGain: 3, survival: 4, comboPotential: 15, boardControl: 3 },
};

function chooseStrategy(scoreDiff: number, turn: number): StrategyMode {
  // If losing significantly, go Aggressive
  if (scoreDiff < -15) return "Aggressive";
  // If winning significantly, go Defense
  if (scoreDiff > 15) return "Defense";
  // Early game, prefer Control
  if (turn < 10) return "Control";
  // mid game, random mix or based on hand (simplified here to random)
  const r = rand01();
  if (r < 0.3) return "Aggressive";
  if (r < 0.6) return "Combo";
  return "Control";
}

// ─── Board evaluation ─────────────────────────────────────────────────────────

/**
 * Rich multi-factor board evaluation.
 * Modified for Part 2 & 5 (Adaptive Board Evaluation).
 */
function evaluateBoard(
  board: Board,
  aiFaction: Faction,
  humanFaction: Faction,
  captures: Record<Faction, number>,
  weights: StrategyWeights,
): number {
  const { scores } = computeScore(board, captures);
  const size = board.length;
  const centre = Math.floor(size / 2);

  let score = 0;

  // ── Territory & Captures (Weighted per Strategy) ──────────────────────────
  score += (scores.territory[aiFaction] - scores.territory[humanFaction]) * weights.boardControl;
  score += (scores.captures[aiFaction] - scores.captures[humanFaction]) * weights.killValue;

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
      // ── Survival Weight ──────────────────────────────────────────────────
      if (libs === 0) score -= weights.survival * 1.5;
      else if (libs === 1) score -= weights.survival;
      else if (libs === 2) score -= weights.survival * 0.3;
      
      // ── Territory Gain (Control) ─────────────────────────────────────────
      for (const c of g) {
        const dist = Math.max(Math.abs(c.r - centre), Math.abs(c.c - centre));
        if (dist <= 1) score += (weights.territoryGain * 0.5);
      }
    } else {
      // ── Kill Opportunity ──────────────────────────────────────────────────
      if (libs === 0) score += weights.killValue;
      else if (libs === 1) score += (weights.killValue * 0.7);
      else if (libs === 2) score += (weights.killValue * 0.3);
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
  weights: StrategyWeights,
): number {
  const legality = isSuicideUnlessCapture(board, at, aiFaction);
  if (!legality.ok) return -Infinity;

  const placed = placeUnit(board, at, aiFaction);
  const after = applyCapturesAfterPlacement(placed, at, aiFaction);

  const myGroup = getGroup(after.board, at);
  const myLibs = getLiberties(after.board, myGroup).length;

  if (myLibs === 0) return -Infinity;

  const capturedCount = after.captured.reduce((sum, e) => sum + e.stonesRemoved.length, 0);
  const newCaptures = { ...captures, [aiFaction]: captures[aiFaction] + capturedCount };
  const boardScore = evaluateBoard(after.board, aiFaction, humanFaction, newCaptures, weights);

  let s = boardScore;

  // ── Survival Adjustment ───────────────────────────────────────────────────
  if (myLibs === 1) s -= weights.survival;
  else if (myLibs === 2) s -= (weights.survival * 0.2);

  // ── Kill Reward ──────────────────────────────────────────────────────────
  s += capturedCount * (weights.killValue * 0.5);

  // ── Combo Logic (Part 8 & 9) ──────────────────────────────────────────────
  const role = (card as any).logicRole ?? "none";
  if (weights.comboPotential > 10) {
     if (role === "setup") s += weights.comboPotential;
     if (role === "finisher" && capturedCount > 0) s += weights.comboPotential * 1.5;
  }

  // ── Legendary: more conservative ─────────────────────────────────────────
  if (card.tier === "legendary") {
    if (myLibs >= 3) s += 5;
    else s -= weights.survival;
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
  weights: StrategyWeights,
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
        score: (libs === 1 ? weights.killValue : weights.killValue * 0.5) + gs * 1.5 + (isDesperate ? 5 : 0),
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
        score: (weights.boardControl * 0.5) + libertyReduction * 2,
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
            score: (weights.boardControl * 0.5) + killBonus * 1.5 + (isDesperate ? 2 : 0),
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
        score: (weights.killValue * 0.5) + enemiesHit * 3 - alliesHit * 4 + (isDesperate ? 3 : 0),
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
  weights: StrategyWeights,
): number {
  const empties: Coord[] = [];
  for (const p of allCoords(board.length)) if (board[p.r]![p.c]!.kind === "empty") empties.push(p);

  let worstForAi = Infinity;
  for (const at of empties.slice(0, 20)) {
    const b2 = simulateUnitMove(board, at, humanFaction);
    if (!b2) continue;
    const s = evaluateBoard(b2, aiFaction, humanFaction, captures, weights);
    if (s < worstForAi) worstForAi = s;
  }
  return worstForAi === Infinity ? evaluateBoard(board, aiFaction, humanFaction, captures, weights) : worstForAi;
}

// ─── Public entry point ───────────────────────────────────────────────────────

export function aiChooseMove(input: AiInput): Move {
  let { level, board, aiFaction, humanFaction, hand, energy, captures, lastMoveCoord, playerPowerMetrics } = input;

  // Part 1: Dynamic Level Calculation
  if (playerPowerMetrics) {
    level = calculateDynamicLevel(playerPowerMetrics) as any;
  }

  const unitCards = hand.filter((c) => c.type === "unit" && c.cost <= energy);
  const skillCards = hand.filter((c) => c.type === "skill" && c.cost <= energy);
  const size = board.length;

  const { scores } = computeScore(board, captures);
  
  // Part 3: Strategy Selection
  const strategy = chooseStrategy(scores.total[aiFaction] - scores.total[humanFaction], input.turn);
  const weights = STRATEGY_MODES[strategy];

  // ── Level 1: Beginner (Heuristic with mistakes) ─────────────────────────
  // Part 10: Smart Mistakes (Instead of random, pick 3rd or 4th best)
  if (level === 1) {
    const cands = getAllCandidates(board, unitCards, skillCards, aiFaction, humanFaction, captures, scores, weights);
    if (!cands.length) return { kind: "pass" };
    cands.sort((a, b) => b.score - a.score);
    // Pick from index 3-5 if available, else best
    const index = Math.min(cands.length - 1, randInt(3) + 2);
    return cands[index]!.move;
  }

  // ── Level 2 / 3 / 4: Professional to Supreme ────────────────────────────
  const cands = getAllCandidates(board, unitCards, skillCards, aiFaction, humanFaction, captures, scores, weights);
  if (!cands.length) return { kind: "pass" };

  cands.sort((a, b) => b.score - a.score);

  // Anti-repeat
  if (lastMoveCoord && cands.length > 1) {
    const bestMove = cands[0]!.move;
    let bestCoord: string | undefined;
    if (bestMove.kind === "playUnit") bestCoord = coordKey(bestMove.at);
    if (bestCoord === lastMoveCoord) {
      const tmp = cands[0]!;
      cands[0] = cands[1]!;
      cands[1] = tmp;
    }
  }

  // ── Level 3 & 4 (Forward Planning) ───────────────────────────────────────
  if (level >= 3) {
    // Level 3 looks at top 8, Level 4 looks at top 15
    const lookaheadCount = level === 4 ? 15 : 8;
    const top = cands.slice(0, lookaheadCount);
    let bestMove = top[0]!.move;
    let bestScore = -Infinity;

    for (const cand of top) {
      let afterBoard: Board | null = null;
      if (cand.move.kind === "playUnit") {
        afterBoard = simulateUnitMove(board, cand.move.at, aiFaction);
      }
      // TODO: Simulate skill effects too in Phase 3
      const futureScore = afterBoard
        ? worstReplyEval(afterBoard, aiFaction, humanFaction, captures, weights)
        : cand.score;
      
      const combined = cand.score * 0.5 + futureScore * 0.5;
      if (combined > bestScore) {
        bestScore = combined;
        bestMove = cand.move;
      }
    }
    return bestMove;
  }

  // Level 2: 70% best, 30% top-3 random
  if (rand01() > 0.7 && cands.length > 1) {
    return cands[randInt(Math.min(3, cands.length))]!.move;
  }

  return cands[0]!.move;
}

/** Helper to gather all possible moves and their heuristic scores */
function getAllCandidates(
  board: Board,
  unitCards: Card[],
  skillCards: Card[],
  aiFaction: Faction,
  humanFaction: Faction,
  captures: Record<Faction, number>,
  scores: ScoreBreakdown,
  weights: StrategyWeights
): { move: Move; score: number }[] {
  const cands: { move: Move; score: number }[] = [];
  const size = board.length;
  const empties: Coord[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r]![c]!.kind === "empty") empties.push({ r, c });
    }
  }

  for (const card of unitCards) {
    for (const at of empties) {
      const s = scoreUnitMove(board, at, aiFaction, humanFaction, captures, card, scores, weights);
      if (s !== -Infinity) cands.push({ move: { kind: "playUnit", faction: aiFaction, at, fromCardId: card.id }, score: s });
    }
  }

  for (const card of skillCards) {
    const scs = scoreSkillMoves(board, card, aiFaction, humanFaction, captures, scores, weights);
    for (const sc of scs) cands.push(sc);
  }

  return cands;
}
