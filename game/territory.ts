import type { Board, Coord, Faction, ScoreBreakdown, TerritoryMap, Tile } from "./types";
import { getGroup, getNeighbors, inBounds } from "./logic";

function tileAt(board: Board, c: Coord): Tile | null {
  if (!inBounds(board, c)) return null;
  return board[c.r]![c.c]!;
}

export function emptyTerritoryMap(size: number): TerritoryMap {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => "none"));
}

export function computeTerritory(board: Board): TerritoryMap {
  const size = board.length;
  const terr = emptyTerritoryMap(size);
  const seen = new Set<string>();
  const key = (p: Coord) => `${p.r},${p.c}`;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const start: Coord = { r, c };
      const t = tileAt(board, start);
      if (!t || t.kind !== "empty") continue;
      const k = key(start);
      if (seen.has(k)) continue;

      const region: Coord[] = [];
      const bordering = new Set<Faction>();
      const stack: Coord[] = [start];
      while (stack.length) {
        const cur = stack.pop()!;
        const ck = key(cur);
        if (seen.has(ck)) continue;
        seen.add(ck);
        const ct = tileAt(board, cur);
        if (!ct || ct.kind !== "empty") continue;
        region.push(cur);
        for (const n of getNeighbors(cur)) {
          if (!inBounds(board, n)) continue;
          const nt = tileAt(board, n)!;
          if (nt.kind === "empty") {
            stack.push(n);
          } else if (nt.kind === "unit") {
            bordering.add(nt.faction);
          } else {
            // Blocks do not count as enclosure owners.
          }
        }
      }

      if (bordering.size === 1) {
        const owner = Array.from(bordering)[0]!;
        for (const cell of region) terr[cell.r]![cell.c] = owner;
      }
    }
  }
  return terr;
}

function ownedCellCount(board: Board, territory: TerritoryMap, faction: Faction, cell: Coord) {
  const t = board[cell.r]![cell.c]!;
  if (t.kind === "unit" && t.faction === faction) return 1;
  if (territory[cell.r]![cell.c] === faction) return 1;
  return 0;
}

function centerControlBonus(board: Board, territory: TerritoryMap): Record<Faction, number> {
  const size = board.length;
  const mid = Math.floor(size / 2);
  const cells: Coord[] = [];
  for (let r = mid - 1; r <= mid + 1; r++) {
    for (let c = mid - 1; c <= mid + 1; c++) {
      if (r >= 0 && c >= 0 && r < size && c < size) cells.push({ r, c });
    }
  }
  const rama = cells.reduce((a, cell) => a + ownedCellCount(board, territory, "RAMA", cell), 0);
  const lanka = cells.reduce((a, cell) => a + ownedCellCount(board, territory, "LANKA", cell), 0);
  return {
    RAMA: rama > lanka ? 3 : 0,
    LANKA: lanka > rama ? 3 : 0,
  };
}

function largestGroupBonus(board: Board): Record<Faction, number> {
  const seen = new Set<string>();
  const largest: Record<Faction, number> = { RAMA: 0, LANKA: 0 };
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board.length; c++) {
      const tile = board[r]![c]!;
      if (tile.kind !== "unit") continue;
      const k = `${r},${c}`;
      if (seen.has(k)) continue;
      const group = getGroup(board, { r, c });
      for (const p of group) seen.add(`${p.r},${p.c}`);
      largest[tile.faction] = Math.max(largest[tile.faction], group.length);
    }
  }
  return {
    RAMA: largest.RAMA >= 4 ? 2 : 0,
    LANKA: largest.LANKA >= 4 ? 2 : 0,
  };
}

export function scoreFromTerritoryAndCaptures(board: Board, territory: TerritoryMap, captures: Record<Faction, number>): ScoreBreakdown {
  let rama = 0;
  let lanka = 0;
  for (const row of territory) {
    for (const v of row) {
      if (v === "RAMA") rama++;
      if (v === "LANKA") lanka++;
    }
  }
  const territoryScore = { RAMA: rama, LANKA: lanka } as Record<Faction, number>;
  const bonus = { RAMA: 0, LANKA: 0 } as Record<Faction, number>;
  const total = {
    RAMA: territoryScore.RAMA + captures.RAMA,
    LANKA: territoryScore.LANKA + captures.LANKA,
  } as Record<Faction, number>;
  return { territory: territoryScore, captures, bonus, total };
}

export function computeScore(board: Board, captures: Record<Faction, number>) {
  const territoryMap = computeTerritory(board);
  const scores = scoreFromTerritoryAndCaptures(board, territoryMap, captures);
  return { territoryMap, scores };
}

