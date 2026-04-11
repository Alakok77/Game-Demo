import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Board, Card, Coord, Faction } from "../game/types";
import {
  applyCapturesAfterPlacement,
  getGroup,
  getLiberties,
  isSuicideUnlessCapture,
  placeUnit,
} from "../game/logic";
import { computeTerritory, scoreFromTerritoryAndCaptures } from "../game/territory";
import { aiChooseMove } from "../game/ai";
import { useGameStore } from "../store/gameStore";

function emptyBoard(size = 7): Board {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => ({ kind: "empty" })));
}

function u(id: string, faction: Faction, cost = 1): Card {
  return {
    id,
    type: "unit",
    name: "ยูนิตทดสอบ",
    cost,
    rarity: "common",
    description: "วางยูนิตลงในช่องว่าง",
    unit: { faction },
  };
}

describe("Core rules: liberties, capture, suicide, territory", () => {
  it("captures a single surrounded unit immediately", () => {
    let b = emptyBoard(5);
    b = placeUnit(b, { r: 2, c: 2 }, "LANKA");
    b = placeUnit(b, { r: 2, c: 1 }, "RAMA");
    b = placeUnit(b, { r: 1, c: 2 }, "RAMA");
    b = placeUnit(b, { r: 3, c: 2 }, "RAMA");
    const withFinal = placeUnit(b, { r: 2, c: 3 }, "RAMA");
    const after = applyCapturesAfterPlacement(withFinal, { r: 2, c: 3 }, "RAMA");
    expect(after.captured.length).toBe(1);
    expect(after.captured[0]!.stonesRemoved).toEqual([{ r: 2, c: 2 }]);
    expect(after.board[2]![2]!.kind).toBe("empty");
  });

  it("captures a multi-unit orthogonal group with shared liberties", () => {
    let b = emptyBoard(5);
    b = placeUnit(b, { r: 2, c: 2 }, "LANKA");
    b = placeUnit(b, { r: 2, c: 3 }, "LANKA");
    b = placeUnit(b, { r: 1, c: 2 }, "RAMA");
    b = placeUnit(b, { r: 1, c: 3 }, "RAMA");
    b = placeUnit(b, { r: 3, c: 2 }, "RAMA");
    b = placeUnit(b, { r: 3, c: 3 }, "RAMA");
    b = placeUnit(b, { r: 2, c: 1 }, "RAMA");
    const withFinal = placeUnit(b, { r: 2, c: 4 }, "RAMA");
    const after = applyCapturesAfterPlacement(withFinal, { r: 2, c: 4 }, "RAMA");
    expect(after.captured.length).toBe(1);
    expect(after.captured[0]!.stonesRemoved.length).toBe(2);
    expect(after.board[2]![2]!.kind).toBe("empty");
    expect(after.board[2]![3]!.kind).toBe("empty");
  });

  it("blocks suicide unless the move captures enemy", () => {
    let b = emptyBoard(5);
    b = placeUnit(b, { r: 1, c: 2 }, "LANKA");
    b = placeUnit(b, { r: 2, c: 1 }, "LANKA");
    b = placeUnit(b, { r: 2, c: 3 }, "LANKA");
    b = placeUnit(b, { r: 3, c: 2 }, "LANKA");
    const illegal = isSuicideUnlessCapture(b, { r: 2, c: 2 }, "RAMA");
    expect(illegal.ok).toBe(false);

    let b2 = emptyBoard(5);
    b2 = placeUnit(b2, { r: 0, c: 0 }, "LANKA");
    b2 = placeUnit(b2, { r: 0, c: 1 }, "RAMA");
    b2 = placeUnit(b2, { r: 1, c: 1 }, "RAMA");
    const legalBecauseCapture = isSuicideUnlessCapture(b2, { r: 1, c: 0 }, "RAMA");
    expect(legalBecauseCapture.ok).toBe(true);
    expect(legalBecauseCapture.willCapture).toBe(true);
  });

  it("computes enclosed territory correctly", () => {
    let b = emptyBoard(5);
    const ramaRing: Coord[] = [
      { r: 1, c: 1 }, { r: 1, c: 2 }, { r: 1, c: 3 },
      { r: 2, c: 1 }, { r: 2, c: 3 },
      { r: 3, c: 1 }, { r: 3, c: 2 }, { r: 3, c: 3 },
    ];
    for (const p of ramaRing) b = placeUnit(b, p, "RAMA");
    const terr = computeTerritory(b);
    expect(terr[2]![2]).toBe("RAMA");
    const score = scoreFromTerritoryAndCaptures(b, terr, { RAMA: 0, LANKA: 0 });
    expect(score.territory.RAMA).toBeGreaterThanOrEqual(1);
  });
});

describe("Store-level flow: energy, placement validity, max cards/turn", () => {
  it("rejects invalid placements and limits plays per turn", () => {
    useGameStore.getState().startGame();
    let s = useGameStore.getState();
    expect(s.phase).toBe("player");
    expect(s.active).toBe("HUMAN");

    const playable = s.human.hand.find((c) => c.type === "unit" && c.cost <= s.human.energy);
    expect(playable).toBeTruthy();
    useGameStore.getState().selectCard(playable!.id);
    useGameStore.getState().tryPlayAt({ r: 0, c: 0 });

    s = useGameStore.getState();
    expect(s.board[0]![0]!.kind).toBe("unit");
    expect(s.cardsPlayedThisTurn).toBe(1);

    // Occupied same cell should fail.
    const nextPlayable = s.human.hand.find((c) => c.type === "unit" && c.cost <= s.human.energy);
    if (nextPlayable) {
      useGameStore.getState().selectCard(nextPlayable.id);
      useGameStore.getState().tryPlayAt({ r: 0, c: 0 });
      const s2 = useGameStore.getState();
      expect(s2.message?.kind).toBe("warn");
    }

    // Try to exceed max 2 cards per turn.
    let current = useGameStore.getState();
    for (let i = 0; i < 3; i++) {
      const unit = current.human.hand.find((c) => c.type === "unit" && c.cost <= current.human.energy);
      if (!unit) break;
      useGameStore.getState().selectCard(unit.id);
      const target = findLegalCell(current.board, current.human.faction);
      if (!target) break;
      useGameStore.getState().tryPlayAt(target);
      current = useGameStore.getState();
    }
    expect(current.cardsPlayedThisTurn).toBeLessThanOrEqual(2);
  });
});

describe("AI behavior and full match simulations", () => {
  it("AI chooses legal move and avoids obvious suicide", () => {
    let b = emptyBoard(5);
    b = placeUnit(b, { r: 1, c: 2 }, "LANKA");
    b = placeUnit(b, { r: 2, c: 1 }, "LANKA");
    b = placeUnit(b, { r: 2, c: 3 }, "LANKA");
    b = placeUnit(b, { r: 3, c: 2 }, "LANKA");
    const mv = aiChooseMove({
      level: 2,
      board: b,
      turn: 1,
      aiFaction: "RAMA",
      humanFaction: "LANKA",
      hand: [u("u1", "RAMA", 1)],
      energy: 1,
      captures: { RAMA: 0, LANKA: 0 },
    });
    if (mv.kind === "playUnit") {
      expect(isSuicideUnlessCapture(b, mv.at, "RAMA").ok).toBe(true);
    } else {
      expect(mv.kind).toBe("pass");
    }
  });

  it("simulates at least 3 full games without invalid state", () => {
    const results: { moves: number; endedBy: "full" | "passes"; captures: number }[] = [];
    for (let game = 0; game < 3; game++) {
      const out = runFullGameSimulation(game);
      results.push(out);
    }

    for (const r of results) {
      expect(r.moves).toBeGreaterThan(10);
      expect(["full", "passes"]).toContain(r.endedBy);
    }
    // Across 3 games, there should be at least some capture activity.
    expect(results.reduce((a, b) => a + b.captures, 0)).toBeGreaterThan(0);
  });
});

describe("UI/UX localization and labels", () => {
  it("keeps key UI texts in Thai", () => {
    const files = [
      "app/page.tsx",
      "components/Board.tsx",
      "components/HUD.tsx",
      "components/Card.tsx",
      "components/TutorialOverlay.tsx",
    ];
    const joined = files
      .map((f) => readFileSync(resolve(process.cwd(), f), "utf8"))
      .join("\n");

    expect(joined).toContain("เลือกการ์ด แล้วคลิกบนกระดาน");
    expect(joined).toContain("ข้ามเทิร์น");
    expect(joined).toContain("เมนู");
    expect(joined).toContain("พรีวิว");
    expect(joined).toContain("วิธีเล่น");
  });

  it("keeps AI thinking delay range in code (0.5-1.5s)", () => {
    const storeCode = readFileSync(resolve(process.cwd(), "store/gameStore.ts"), "utf8");
    expect(storeCode).toContain("500 + Math.floor(Math.random() * 1000)");
  });
});

function findLegalCell(board: Board, faction: Faction): Coord | undefined {
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board.length; c++) {
      if (board[r]![c]!.kind !== "empty") continue;
      if (isSuicideUnlessCapture(board, { r, c }, faction).ok) return { r, c };
    }
  }
  return undefined;
}

function runFullGameSimulation(seed: number) {
  let board = emptyBoard(7);
  let turn = 1;
  let active: Faction = seed % 2 === 0 ? "RAMA" : "LANKA";
  const captures: Record<Faction, number> = { RAMA: 0, LANKA: 0 };
  let consecutivePasses = 0;
  let moves = 0;

  const handFor = (f: Faction): Card[] => [
    u(`${f}-u1-${seed}`, f, 1),
    u(`${f}-u2-${seed}`, f, 1),
    u(`${f}-u3-${seed}`, f, 2),
  ];

  while (moves < 300) {
    const enemy = active === "RAMA" ? "LANKA" : "RAMA";
    const move = aiChooseMove({
      level: 2,
      board,
      turn,
      aiFaction: active,
      humanFaction: enemy,
      hand: handFor(active),
      energy: Math.min(10, 1 + Math.floor(turn / 2)),
      captures,
    });

    if (move.kind === "pass") {
      consecutivePasses += 1;
    } else if (move.kind === "playUnit") {
      // Validate before apply.
      if (
        move.at.r < 0 ||
        move.at.c < 0 ||
        move.at.r >= board.length ||
        move.at.c >= board.length ||
        board[move.at.r]![move.at.c]!.kind !== "empty" ||
        !isSuicideUnlessCapture(board, move.at, active).ok
      ) {
        consecutivePasses += 1;
      } else {
        consecutivePasses = 0;
        board = placeUnit(board, move.at, active);
        const after = applyCapturesAfterPlacement(board, move.at, active);
        board = after.board;
        captures[active] += after.captured.reduce((a, e) => a + e.stonesRemoved.length, 0);
      }
    } else {
      // Ignore skill move in this simulation and count as pass.
      consecutivePasses += 1;
    }

    moves += 1;
    if (isBoardFull(board)) {
      return { moves, endedBy: "full" as const, captures: captures.RAMA + captures.LANKA };
    }
    if (consecutivePasses >= 2) {
      return { moves, endedBy: "passes" as const, captures: captures.RAMA + captures.LANKA };
    }
    active = enemy;
    turn += 1;
  }
  return { moves, endedBy: "passes" as const, captures: captures.RAMA + captures.LANKA };
}

function isBoardFull(board: Board) {
  for (const row of board) for (const t of row) if (t.kind === "empty") return false;
  return true;
}

