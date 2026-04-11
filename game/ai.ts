import type { Board, Card, Coord, Faction, Move } from "./types";
import { cloneBoard, getGroup, getLiberties, inBounds, isSuicideUnlessCapture, placeUnit } from "./logic";
import { computeScore } from "./territory";

function allCoords(size: number): Coord[] {
  const out: Coord[] = [];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) out.push({ r, c });
  return out;
}

function tileEmpty(board: Board, at: Coord) {
  const t = board[at.r]![at.c]!;
  return t.kind === "empty";
}

function randInt(n: number) {
  return Math.floor(Math.random() * n);
}

export type AiInput = {
  level: 1 | 2 | 3;
  board: Board;
  turn: number;
  aiFaction: Faction;
  humanFaction: Faction;
  hand: Card[];
  energy: number;
  captures: Record<Faction, number>;
};

export function aiChooseMove(input: AiInput): Move {
  const { level, board, aiFaction, hand, energy } = input;
  const unitCards = hand.filter((c) => c.type === "unit" && c.cost <= energy);
  const skillCards = hand.filter((c) => c.type === "skill" && c.cost <= energy);

  const size = board.length;
  const empties = allCoords(size).filter((p) => tileEmpty(board, p));

  if (level === 1) {
    // Random valid unit placement, else pass.
    for (let tries = 0; tries < 80; tries++) {
      const card = unitCards[randInt(Math.max(1, unitCards.length))];
      const at = empties[randInt(Math.max(1, empties.length))];
      if (!card || !at) break;
      const ok = isSuicideUnlessCapture(board, at, aiFaction).ok;
      if (ok) return { kind: "playUnit", faction: aiFaction, at, fromCardId: card.id };
    }
    return { kind: "pass" };
  }

  // Level 2/3: heuristic search over legal unit placements and a small set of skill uses.
  type Cand = { move: Move; score: number };
  const cands: Cand[] = [];

  const { scores: baseScore } = computeScore(board, input.captures);
  const baseTotal = baseScore.total[aiFaction] - baseScore.total[input.humanFaction];

  for (const card of unitCards) {
    for (const at of empties) {
      const legality = isSuicideUnlessCapture(board, at, aiFaction);
      if (!legality.ok) continue;
      const after = placeUnit(board, at, aiFaction);
      // cheap safety estimate: liberties of placed group
      const libs = getLiberties(after, getGroup(after, at)).length;
      const { scores } = computeScore(after, input.captures);
      const diff = scores.total[aiFaction] - scores.total[input.humanFaction];
      const gain = diff - baseTotal;
      const s = gain * 3 + libs * 0.4 + (legality.willCapture ? 2 : 0);
      cands.push({ move: { kind: "playUnit", faction: aiFaction, at, fromCardId: card.id }, score: s });
    }
  }

  // Skills: keep readable and bounded.
  for (const card of skillCards) {
    if (card.type !== "skill") continue;
    if (card.skill.kind === "destroyWeakGroup") {
      // Look for an enemy group with <=2 liberties; target any stone in it.
      const targets: Coord[] = [];
      for (const p of allCoords(size)) {
        const t = board[p.r]![p.c]!;
        if (t.kind !== "unit" || t.faction === aiFaction) continue;
        const g = getGroup(board, p);
        const libs = getLiberties(board, g).length;
        if (libs > 0 && libs <= 2) targets.push(p);
      }
      if (targets.length) {
        const target = targets[randInt(targets.length)]!;
        cands.push({
          move: { kind: "skillDestroyWeakGroup", caster: aiFaction, targetAnyCellInEnemyGroup: target, fromCardId: card.id },
          score: 6.5,
        });
      }
    }
    if (card.type === "skill" && card.skill.kind === "blockTile") {
      // Block a central-ish empty tile.
      const centerish = empties
        .map((p) => ({ p, d: Math.abs(p.r - 3) + Math.abs(p.c - 3) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 12);
      if (centerish.length) {
        cands.push({
          move: { kind: "skillBlockTile", caster: aiFaction, at: centerish[0]!.p, durationTurns: 2, fromCardId: card.id },
          score: 2.2,
        });
      }
    }
  }

  if (!cands.length) return { kind: "pass" };

  cands.sort((a, b) => b.score - a.score);
  const best = cands[0]!;

  // Level 3: tiny minimax (depth 2) over unit placements only (kept optional + bounded).
  if (level === 3) {
    const top = cands.slice(0, 10);
    let bestMove = best.move;
    let bestMin = -Infinity;
    for (const cand of top) {
      const after = simulateMove(board, cand.move, aiFaction, input.turn);
      if (!after) continue;
      const reply = worstReplyScore(after, input);
      const overall = cand.score + reply * 0.9;
      if (overall > bestMin) {
        bestMin = overall;
        bestMove = cand.move;
      }
    }
    return bestMove;
  }

  return best.move;
}

function simulateMove(board: Board, move: Move, faction: Faction, turn: number): Board | null {
  const b = cloneBoard(board);
  if (move.kind === "playUnit") {
    if (!inBounds(b, move.at)) return null;
    if (b[move.at.r]![move.at.c]!.kind !== "empty") return null;
    if (!isSuicideUnlessCapture(b, move.at, faction).ok) return null;
    return placeUnit(b, move.at, faction);
  }
  if (move.kind === "skillBlockTile") {
    if (!inBounds(b, move.at)) return null;
    if (b[move.at.r]![move.at.c]!.kind !== "empty") return null;
    b[move.at.r]![move.at.c] = { kind: "block", expiresAtTurn: turn + move.durationTurns, owner: faction };
    return b;
  }
  // For AI lookahead, skip other skill simulations.
  return b;
}

function worstReplyScore(afterBoard: Board, input: AiInput) {
  // Human "reply" approximation: best territory diff swing for human by placing a unit anywhere.
  const size = afterBoard.length;
  const empties: Coord[] = [];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (afterBoard[r]![c]!.kind === "empty") empties.push({ r, c });
  const { scores: baseScore } = computeScore(afterBoard, input.captures);
  const baseTotal = baseScore.total[input.aiFaction] - baseScore.total[input.humanFaction];

  let bestHuman = -Infinity;
  for (const at of empties.slice(0, 25)) {
    if (!isSuicideUnlessCapture(afterBoard, at, input.humanFaction).ok) continue;
    const b2 = placeUnit(afterBoard, at, input.humanFaction);
    const libs = getLiberties(b2, getGroup(b2, at)).length;
    const { scores } = computeScore(b2, input.captures);
    const diff = scores.total[input.aiFaction] - scores.total[input.humanFaction];
    const swing = baseTotal - diff; // positive is bad for AI
    bestHuman = Math.max(bestHuman, swing * 2 + libs * 0.2);
  }
  return -bestHuman;
}

