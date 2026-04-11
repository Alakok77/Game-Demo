import type { Board, Coord, Faction, Tile } from "./types";

export function inBounds(board: Board, cell: Coord) {
  return cell.r >= 0 && cell.c >= 0 && cell.r < board.length && cell.c < board[0]!.length;
}

// 1) REQUIRED: getNeighbors(cell)
export function getNeighbors(cell: Coord): Coord[] {
  return [
    { r: cell.r - 1, c: cell.c },
    { r: cell.r + 1, c: cell.c },
    { r: cell.r, c: cell.c - 1 },
    { r: cell.r, c: cell.c + 1 },
  ];
}

function tileAt(board: Board, c: Coord): Tile | null {
  if (!inBounds(board, c)) return null;
  return board[c.r]![c.c]!;
}

function isLibertyTile(tile: Tile | null): boolean {
  if (!tile) return false;
  return tile.kind === "empty";
}

export function isOccupied(tile: Tile) {
  return tile.kind === "unit" || tile.kind === "block";
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((t) => ({ ...t }))) as Board;
}

export function normalizeEphemeralTiles(board: Board, turn: number): Board {
  // Clear expired blocks.
  const next = cloneBoard(board);
  for (let r = 0; r < next.length; r++) {
    for (let c = 0; c < next[r]!.length; c++) {
      const t = next[r]![c]!;
      if (t.kind === "block" && t.expiresAtTurn <= turn) next[r]![c] = { kind: "empty" };
    }
  }
  return next;
}

// 2) REQUIRED: getGroup(board, cell)
export function getGroup(board: Board, cell: Coord): Coord[] {
  const start = tileAt(board, cell);
  if (!start || start.kind !== "unit") return [];
  const faction = start.faction;
  const key = (p: Coord) => `${p.r},${p.c}`;
  const seen = new Set<string>();
  const stack: Coord[] = [cell];
  const group: Coord[] = [];

  while (stack.length) {
    const cur = stack.pop()!;
    const k = key(cur);
    if (seen.has(k)) continue;
    seen.add(k);
    const t = tileAt(board, cur);
    if (!t || t.kind !== "unit" || t.faction !== faction) continue;
    group.push(cur);
    for (const n of getNeighbors(cur)) {
      if (inBounds(board, n)) stack.push(n);
    }
  }
  return group;
}

// 3) REQUIRED: getLiberties(group)
export function getLiberties(board: Board, group: Coord[]): Coord[] {
  const key = (p: Coord) => `${p.r},${p.c}`;
  const libs = new Set<string>();
  for (const stone of group) {
    for (const n of getNeighbors(stone)) {
      const t = tileAt(board, n);
      if (isLibertyTile(t)) libs.add(key(n));
    }
  }
  return Array.from(libs).map((k) => {
    const [r, c] = k.split(",").map(Number);
    return { r, c };
  });
}

// 4) REQUIRED: removeGroup(group)
export function removeGroup(board: Board, group: Coord[]): Board {
  const next = cloneBoard(board);
  for (const cell of group) {
    if (inBounds(next, cell)) next[cell.r]![cell.c] = { kind: "empty" };
  }
  return next;
}

export function placeUnit(board: Board, at: Coord, faction: Faction): Board {
  const next = cloneBoard(board);
  next[at.r]![at.c] = { kind: "unit", faction };
  return next;
}

export function countLibertiesAt(board: Board, cell: Coord): number {
  const t = tileAt(board, cell);
  if (!t || t.kind !== "unit") return 0;
  const group = getGroup(board, cell);
  return getLiberties(board, group).length;
}

export function findAdjacentEnemyGroups(board: Board, at: Coord, myFaction: Faction): Coord[][] {
  const groups: Coord[][] = [];
  const seen = new Set<string>();
  for (const n of getNeighbors(at)) {
    const t = tileAt(board, n);
    if (!t || t.kind !== "unit" || t.faction === myFaction) continue;
    const g = getGroup(board, n);
    const key = g
      .map((p) => `${p.r},${p.c}`)
      .sort()
      .join("|");
    if (key && !seen.has(key)) {
      seen.add(key);
      groups.push(g);
    }
  }
  return groups;
}

export function applyCapturesAfterPlacement(board: Board, placedAt: Coord, myFaction: Faction) {
  let next = board;
  const captured: { factionCaptured: Faction; stonesRemoved: Coord[] }[] = [];
  const enemyGroups = findAdjacentEnemyGroups(next, placedAt, myFaction);
  for (const g of enemyGroups) {
    const libs = getLiberties(next, g);
    if (libs.length === 0) {
      const factionCaptured = (tileAt(next, g[0]!) as { kind: "unit"; faction: Faction }).faction;
      next = removeGroup(next, g);
      captured.push({ factionCaptured, stonesRemoved: g });
    }
  }
  return { board: next, captured };
}

export function isSuicideUnlessCapture(board: Board, at: Coord, myFaction: Faction): {
  ok: boolean;
  willCapture: boolean;
} {
  const withStone = placeUnit(board, at, myFaction);
  const after = applyCapturesAfterPlacement(withStone, at, myFaction);
  const myGroup = getGroup(after.board, at);
  const myLibs = getLiberties(after.board, myGroup).length;
  const willCapture = after.captured.length > 0;
  if (myLibs > 0) return { ok: true, willCapture };
  // Suicide is illegal unless you captured something by doing it.
  return { ok: willCapture, willCapture };
}

