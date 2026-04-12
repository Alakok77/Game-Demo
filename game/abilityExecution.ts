import type { Board, Coord, Faction, Tile } from "@/game/types";
import { getGroup, getLiberties } from "@/game/logic";

function cloneBoard(b: Board): Board {
  return b.map(row => row.map(cell => ({ ...cell })));
}

function otherFaction(f: Faction): Faction {
  return f === "RAMA" ? "LANKA" : "RAMA";
}

function randInt(max: number) {
  return Math.floor(Math.random() * max);
}

function getEmptyCells(b: Board): Coord[] {
  const empty: Coord[] = [];
  for (let r = 0; r < b.length; r++) {
    for (let c = 0; c < b.length; c++) {
      if (b[r]![c]!.kind === "empty") empty.push({ r, c });
    }
  }
  return empty;
}

function getEnemyUnits(b: Board, faction: Faction): {r: number, c: number, t: Tile}[] {
  const units: {r: number, c: number, t: Tile}[] = [];
  for (let r = 0; r < b.length; r++) {
    for (let c = 0; c < b.length; c++) {
      const t = b[r]![c]!;
      if (t.kind === "unit" && t.faction !== faction) units.push({ r, c, t });
    }
  }
  return units;
}

function getAllUnits(b: Board): Coord[] {
  const units: Coord[] = [];
  for (let r = 0; r < b.length; r++) {
    for (let c = 0; c < b.length; c++) {
      if (b[r]![c]!.kind === "unit") units.push({ r, c });
    }
  }
  return units;
}

function getAdjacentEnemy(b: Board, me: Coord, faction: Faction): Coord | null {
  const enemies: Coord[] = [];
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of dirs) {
    const nr = me.r + dr, nc = me.c + dc;
    if (nr >= 0 && nr < b.length && nc >= 0 && nc < b.length) {
      const t = b[nr]![nc]!;
      if (t.kind === "unit" && t.faction !== faction) enemies.push({ r: nr, c: nc });
    }
  }
  return enemies.length > 0 ? enemies[randInt(enemies.length)]! : null;
}

function getAdjacentEmpty(b: Board, me: Coord): Coord | null {
  const empties: Coord[] = [];
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of dirs) {
    const nr = me.r + dr, nc = me.c + dc;
    if (nr >= 0 && nr < b.length && nc >= 0 && nc < b.length) {
      const t = b[nr]![nc]!;
      if (t.kind === "empty") empties.push({ r: nr, c: nc });
    }
  }
  return empties.length > 0 ? empties[randInt(empties.length)]! : null;
}

function getWeakEnemy(b: Board, faction: Faction): Coord | null {
  const enemies = getEnemyUnits(b, faction);
  const weak = enemies.filter(u => {
    const g = getGroup(b, { r: u.r, c: u.c });
    return getLiberties(b, g).length < 2;
  });
  return weak.length > 0 ? weak[randInt(weak.length)]! : null;
}

function getAllies(b: Board, faction: Faction): Coord[] {
  const allies: Coord[] = [];
  for (let r = 0; r < b.length; r++) {
    for (let c = 0; c < b.length; c++) {
      const t = b[r]![c]!;
      if (t.kind === "unit" && t.faction === faction) allies.push({ r, c });
    }
  }
  return allies;
}

export function applyCardEffect(board: Board, templateId: string, coords: Coord[], caster: Faction): Board {
  const b = cloneBoard(board);
  const me = coords[0]; // placement cell (if unit), or center if skill
  const sz = b.length;

  switch (templateId) {
    // === RAMA ===
    case "r_h1": // พระลักษณ์: Swap self with adjacent enemy
      if (me) {
        const target = getAdjacentEnemy(b, me, caster);
        if (target) {
          const temp = b[me.r]![me.c]!;
          b[me.r]![me.c] = b[target.r]![target.c]!;
          b[target.r]![target.c] = temp;
        }
      }
      break;

    case "r_h2": // องคต: Change adjacent enemy to our color
      if (me) {
        const target = getAdjacentEnemy(b, me, caster);
        if (target) {
          (b[target.r]![target.c]! as any).faction = caster;
        }
      }
      break;

    case "r_h3": // นิลพัท: Spawn clone in adjacent empty
      if (me) {
        const target = getAdjacentEmpty(b, me);
        if (target) {
          b[target.r]![target.c] = { kind: "unit", faction: caster, templateId: "r_b1", statusEffects: [] };
        }
      }
      break;

    case "r_h4": // สุครีพ: Destroy units in 1-cell radius
      if (me) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
             if (dr===0 && dc===0) continue;
             const nr = me.r + dr, nc = me.c + dc;
             if (nr >= 0 && nr < sz && nc >= 0 && nc < sz) {
                if (b[nr]![nc]!.kind === "unit") b[nr]![nc] = { kind: "empty" };
             }
          }
        }
      }
      break;

    case "r_h5": // พาลี: Random change 1 enemy color
      const enemies = getEnemyUnits(b, caster);
      if (enemies.length > 0) {
        const target = enemies[randInt(enemies.length)]!;
        (b[target.r]![target.c]! as any).faction = caster;
      }
      break;

    case "r_l1": break; // Passive

    case "r_l2": // พิเภก: Destroy weak enemy
      const weak = getWeakEnemy(b, caster);
      if (weak) b[weak.r]![weak.c] = { kind: "empty" };
      break;

    case "r_l3": // พระราม: Spawn full column
      if (me) {
        for (let r = 0; r < sz; r++) {
          if (b[r]![me.c]!.kind === "empty") {
             b[r]![me.c] = { kind: "unit", faction: caster, templateId: "r_b2", statusEffects: [] };
          }
        }
      }
      break;

    case "r_s1": // ศรพรหมมาสตร์: Destroy all enemies in row
      if (me) {
        for (let c = 0; c < sz; c++) {
          const t = b[me.r]![c]!;
          if (t.kind === "unit" && t.faction !== caster) {
             b[me.r]![c] = { kind: "empty" };
          }
        }
      }
      break;

    case "r_s2": { // พรพระอิศวร: Spawn 2 allies in safe empty spaces
      const emptyCells = getEmptyCells(b).filter(c => {
         let safe = true;
         for (let dr = -1; dr <= 1; dr++) {
           for (let dc = -1; dc <= 1; dc++) {
             const nr = c.r + dr, nc = c.c + dc;
             if (nr >= 0 && nr < sz && nc >= 0 && nc < sz) {
                const t = b[nr]![nc]!;
                if (t.kind === "unit" && t.faction !== caster) safe = false;
             }
           }
         }
         return safe;
      });
      for (let i = 0; i < 2; i++) {
        if (emptyCells.length > 0) {
           const idx = randInt(emptyCells.length);
           const cell = emptyCells.splice(idx, 1)[0]!;
           b[cell.r]![cell.c] = { kind: "unit", faction: caster, templateId: "r_b1", statusEffects: [] };
        }
      }
      break;
    }

    // === LANKA ===
    case "l_h1": // กุมภกรรณ: Charge line
      if (me) {
        // Randomly pick a cardinal direction
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        const [dr, dc] = dirs[randInt(dirs.length)]!;
        let r = me.r + dr, c = me.c + dc;
        while (r >= 0 && r < sz && c >= 0 && c < sz) {
          if (b[r]![c]!.kind === "unit") b[r]![c] = { kind: "empty" };
          r += dr; c += dc;
        }
      }
      break;

    case "l_h2": break; // Passive

    case "l_h3": // วิรุญจำบัง: fling adjacent enemy
      if (me) {
        const target = getAdjacentEnemy(b, me, caster);
        if (target) {
          const empties = getEmptyCells(b);
          if (empties.length > 0) {
            const dest = empties[randInt(empties.length)]!;
            b[dest.r]![dest.c] = b[target.r]![target.c]!;
            b[target.r]![target.c] = { kind: "empty" };
          }
        }
      }
      break;

    case "l_h4": // สหัสเดชะ: Spawn 3 random allies
      for (let i = 0; i < 3; i++) {
        const empties = getEmptyCells(b);
        if (empties.length > 0) {
           const dest = empties[randInt(empties.length)]!;
           b[dest.r]![dest.c] = { kind: "unit", faction: caster, templateId: "l_b1", statusEffects: [] };
        }
      }
      break;

    case "l_h5": // สัทธาสูร: Destroy enemies with >1 flank
      if (me) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr===0 && dc===0) continue;
            const nr = me.r+dr, nc = me.c+dc;
            if (nr >= 0 && nr < sz && nc >= 0 && nc < sz) {
               const target = b[nr]![nc]!;
               if (target.kind === "unit" && target.faction !== caster) {
                  let flanks = 0;
                  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
                  for (let [fdr, fdc] of dirs) {
                     const fr = nr+fdr, fc = nc+fdc;
                     if (fr >= 0 && fr < sz && fc >= 0 && fc < sz) {
                        const ft = b[fr]![fc]!;
                        if (ft.kind === "unit" && ft.faction === caster) flanks++;
                     }
                  }
                  if (flanks > 1) b[nr]![nc] = { kind: "empty" };
               }
            }
          }
        }
      }
      break;

    case "l_l1": // ทศกัณฐ์: Spawn allies adjacent
      if (me) {
        const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
        for (let [dr, dc] of dirs) {
           const nr = me.r+dr, nc = me.c+dc;
           if (nr >= 0 && nr < sz && nc >= 0 && nc < sz && b[nr]![nc]!.kind === "empty") {
              b[nr]![nc] = { kind: "unit", faction: caster, templateId: "l_b1", statusEffects: [] };
           }
        }
      }
      break;

    case "l_l2": // อินทรชิต: Convert adjacent enemies
      if (me) {
        const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
        for (let [dr, dc] of dirs) {
           const nr = me.r+dr, nc = me.c+dc;
           if (nr >= 0 && nr < sz && nc >= 0 && nc < sz) {
              const t = b[nr]![nc]!;
              if (t.kind === "unit" && t.faction !== caster) {
                (b[nr]![nc]! as any).faction = caster;
              }
           }
        }
      }
      break;

    case "l_l3": // ไมยราพณ์: Global swap color
      for (let r = 0; r < sz; r++) {
        for (let c = 0; c < sz; c++) {
           const t = b[r]![c]!;
           if (t.kind === "unit") {
              (b[r]![c]! as any).faction = otherFaction(t.faction);
           }
        }
      }
      break;

    case "l_s1": // พิธีชุบหอก: change 2 random edge enemies
      const edges = getEnemyUnits(b, caster).filter(u => u.r===0 || u.r===sz-1 || u.c===0 || u.c===sz-1);
      for (let i = 0; i < 2; i++) {
         if (edges.length > 0) {
            const idx = randInt(edges.length);
            const target = edges.splice(idx, 1)[0]!;
            (b[target.r]![target.c]! as any).faction = caster;
         }
      }
      break;

    case "l_s2": { // คำสาปลงกา: destroy 3 random enemies
      const enemies = getEnemyUnits(b, caster); 
      for (let i = 0; i < 3; i++) {
        if (enemies.length > 0) {
           const idx = randInt(enemies.length);
           const target = enemies.splice(idx, 1)[0]!;
           b[target.r]![target.c] = { kind: "empty" };
        }
      }
      break;
    }

    // === NEUTRAL ===
    case "n_l1": // สีดา: Global kill 1-liberty units
      for (let r = 0; r < sz; r++) {
        for (let c = 0; c < sz; c++) {
           const t = b[r]![c]!;
           if (t.kind === "unit") {
              const g = getGroup(b, {r, c});
              if (getLiberties(b, g).length === 1) {
                b[r]![c] = { kind: "empty" };
              }
           }
        }
      }
      break;

    case "n_l2": // อนันตนาคราช: Block row
      if (me) {
         for (let c = 0; c < sz; c++) b[me.r]![c] = { kind: "block", expiresAtTurn: 999, owner: caster };
      }
      break;

    case "n_l3": // ฤๅษีดัดตน: swap 2 allies
      const allies = getAllies(b, caster);
      if (allies.length >= 2) {
        const i1 = randInt(allies.length);
        const a1 = allies.splice(i1, 1)[0]!;
        const i2 = randInt(allies.length);
        const a2 = allies.splice(i2, 1)[0]!;
        const temp = b[a1.r]![a1.c]!;
        b[a1.r]![a1.c] = b[a2.r]![a2.c]!;
        b[a2.r]![a2.c] = temp;
      }
      break;

    case "n_h1": // มัจฉานุ: move self to empty near block
      if (me) {
        const target = ((): Coord | null => {
          const valid: Coord[] = [];
          for (let r = 0; r < sz; r++) {
            for (let c = 0; c < sz; c++) {
              if (b[r]![c]!.kind === "empty") {
                let near = false;
                const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
                for (const [dr, dc] of dirs) {
                  const nr = r+dr, nc = c+dc;
                  if (nr>=0 && nr<sz && nc>=0 && nc<sz && b[nr]![nc]!.kind === "block") near = true;
                }
                if (near) valid.push({r, c});
              }
            }
          }
          return valid.length > 0 ? valid[randInt(valid.length)]! : null;
        })();
        if (target) {
          b[target.r]![target.c] = b[me.r]![me.c]!;
          b[me.r]![me.c] = { kind: "empty" };
        }
      }
      break;

    case "n_h2": // สดายุ: swap color of 2 adj units
      if (me) {
        const adj = ((): Coord[] => {
          const list: Coord[] = [];
          const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
          for (const [dr, dc] of dirs) {
            const nr = me.r+dr, nc = me.c+dc;
            if (nr>=0 && nr<sz && nc>=0 && nc<sz && b[nr]![nc]!.kind === "unit") list.push({r: nr, c: nc});
          }
          return list;
        })();
        if (adj.length >= 2) {
          const i1 = randInt(adj.length);
          const t1 = adj.splice(i1, 1)[0]!;
          const i2 = randInt(adj.length);
          const t2 = adj.splice(i2, 1)[0]!;
          (b[t1.r]![t1.c]! as any).faction = otherFaction((b[t1.r]![t1.c] as any).faction);
          (b[t2.r]![t2.c]! as any).faction = otherFaction((b[t2.r]![t2.c] as any).faction);
        }
      }
      break;

    case "n_h3": // สุพรรณมัจฉา: spawn 2 around blocks
      {
         const okCells: Coord[] = [];
         for (let dr = 0; dr < sz; dr++) {
           for (let dc = 0; dc < sz; dc++) {
             if (b[dr]![dc]!.kind === "empty") {
                let hasBlock = false;
                for (let br = -1; br <= 1; br++) {
                  for (let bc = -1; bc <= 1; bc++) {
                    const nr = dr+br, nc = dc+bc;
                    if (nr>=0 && nr<sz && nc>=0 && nc<sz && b[nr]![nc]!.kind==="block") hasBlock = true;
                  }
                }
                if (hasBlock) okCells.push({r:dr, c:dc});
             }
           }
         }
         const pool = okCells.length >= 2 ? okCells : getEmptyCells(b);
         for (let i = 0; i < 2; i++) {
           if (pool.length > 0) {
              const idx = randInt(pool.length);
              const cell = pool.splice(idx, 1)[0]!;
              b[cell.r]![cell.c] = { kind: "unit", faction: caster, templateId: "n_b1", statusEffects: [] };
           }
         }
      }
      break;

    case "n_h4": // สัมพาที: Move random enemy to death trap
      if (me) {
        const target = getAdjacentEnemy(b, me, caster);
        if (target) b[target.r]![target.c] = { kind: "empty" }; // just kills for now
      }
      break;

    case "n_h5": // ทรพี: Switch self color to enemy
      if (me && b[me.r]![me.c]!.kind === "unit") {
         (b[me.r]![me.c]! as any).faction = otherFaction(caster);
      }
      break;

    case "n_s1": // พายุอาเพศ: Shuffle 4
      {
         const units = getAllUnits(b);
         const picked: {r: number, c: number, t: Tile}[] = [];
         for (let i = 0; i < 4; i++) {
           if (units.length > 0) {
             const idx = randInt(units.length);
             const cell = units.splice(idx, 1)[0]!;
             picked.push({r: cell.r, c: cell.c, t: b[cell.r]![cell.c]!});
           }
         }
         if (picked.length > 1) {
            const firstT = picked[0]!.t;
            for (let i = 0; i < picked.length - 1; i++) {
               b[picked[i]!.r]![picked[i]!.c] = picked[i+1]!.t;
            }
            b[picked[picked.length-1]!.r]![picked[picked.length-1]!.c] = firstT;
         }
      }
      break;

    case "n_s2": // มนต์เรียกปลา 3x3
      if (me) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = me.r+dr, nc = me.c+dc;
            if (nr >= 0 && nr < sz && nc >= 0 && nc < sz) {
               const t = b[nr]![nc]!;
               if (t.kind === "unit") (b[nr]![nc]! as any).faction = caster;
            }
          }
        }
      }
      break;

    default:
      break;
  }

  return globalCaptureSweep(b);
}

export function globalCaptureSweep(b: Board): Board {
  // Clear all status effects before recalculating
  for (let r = 0; r < b.length; r++) {
    for (let c = 0; c < b.length; c++) {
      const tile = b[r]![c]!;
      if (tile.kind === "unit") {
        tile.statusEffects = [];
      }
    }
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (let r = 0; r < b.length; r++) {
      for (let c = 0; c < b.length; c++) {
        if (b[r]![c]!.kind === "unit") {
           const g = getGroup(b, {r, c});
           const libs = getLiberties(b, g);
           if (libs.length === 0) {
              for (const stone of g) {
                 b[stone.r]![stone.c] = { kind: "empty" };
              }
              changed = true;
           } else if (libs.length === 1) {
              // Add willDie marker
              for (const stone of g) {
                const t = b[stone.r]![stone.c]!;
                if (t.kind === "unit") {
                  if (!t.statusEffects) t.statusEffects = [];
                  if (!t.statusEffects.includes("willDie")) t.statusEffects.push("willDie");
                }
              }
           }
        }
      }
    }
  }
  return b;
}

