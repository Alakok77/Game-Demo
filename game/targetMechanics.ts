import type { Coord, Board, Faction } from "@/game/types";
import { CARD_LIBRARY } from "@/data/cards";
import { inBounds } from "@/game/logic";

export type TargetDef = {
  maxSteps: number;
  validateTarget?: (board: Board, cell: Coord, faction: Faction, step: number, selectedCoords: Coord[]) => boolean;
  onConfirm: (board: Board, selectedCoords: Coord[], faction: Faction) => Board | void; 
};

// Helper: Check if two coords are adjacent
function isAdjacent(c1: Coord, c2: Coord) {
  const dr = Math.abs(c1.r - c2.r);
  const dc = Math.abs(c1.c - c2.c);
  return dr + dc === 1;
}

// Global registry based on selectableTargets string
const SELECTABLE_TARGETS_MAP: Record<string, Omit<TargetDef, "onConfirm">> = {
  "adjacent_enemy": {
    // step 1: placement of the card itself (always assumed empty tile for units)
    // step 2: choose adjacent enemy
    maxSteps: 2, 
    validateTarget: (board, cell, faction, step, selected) => {
      const t = board[cell.r]?.[cell.c];
      if (step === 1) return t?.kind === "empty";
      if (step === 2) {
        if (!isAdjacent(selected[0], cell)) return false;
        return t?.kind === "unit" && t.faction !== faction;
      }
      return false;
    }
  },
  "adjacent_empty": {
    maxSteps: 2,
    validateTarget: (board, cell, faction, step, selected) => {
      const t = board[cell.r]?.[cell.c];
      if (step === 1) return t?.kind === "empty";
      if (step === 2) {
        if (!isAdjacent(selected[0], cell)) return false;
        return t?.kind === "empty";
      }
      return false;
    }
  },
  "weak_enemy": {
    maxSteps: 2,
    validateTarget: (board, cell, faction, step) => {
      const t = board[cell.r]?.[cell.c];
      if (step === 1) return t?.kind === "empty";
      if (step === 2) return t?.kind === "unit" && t.faction !== faction; // full liberty check done in engine
      return false;
    }
  },
  "row": {
    maxSteps: 2, // 1: placement, 2: choose row (by clicking any cell in it)
    validateTarget: (board, cell, faction, step) => {
      if (step === 1) return board[cell.r]?.[cell.c]?.kind === "empty";
      return true; // any cell specifies its row
    }
  },
  "direction": {
    maxSteps: 2,
    validateTarget: (board, cell, faction, step, selected) => {
      if (step === 1) return board[cell.r]?.[cell.c]?.kind === "empty";
      if (step === 2) return cell.r === selected[0].r || cell.c === selected[0].c; // Cardinal direction
      return false;
    }
  },
  "two_allies": {
    maxSteps: 3, // 1: placement, 2: first friend, 3: second friend
    validateTarget: (board, cell, faction, step) => {
      const t = board[cell.r]?.[cell.c];
      if (step === 1) return t?.kind === "empty";
      return t?.kind === "unit" && t.faction === faction;
    }
  },
  "two_adjacent_units": {
    maxSteps: 3, // 1: placement, 2: first unit, 3: adjacent second unit
    validateTarget: (board, cell, faction, step, selected) => {
      const t = board[cell.r]?.[cell.c];
      if (step === 1) return t?.kind === "empty";
      if (step === 2) return t?.kind === "unit";
      if (step === 3) return t?.kind === "unit" && isAdjacent(selected[1], cell);
      return false;
    }
  },
  "empty_near_block": {
    maxSteps: 2,
    validateTarget: (board, cell, faction, step) => {
      const t = board[cell.r]?.[cell.c];
      if (step === 1) return t?.kind === "empty";
      if (step === 2) {
        if (t?.kind !== "empty") return false;
        // check if any neighbor is blocker
        for (const dr of [-1, 0, 1]) {
          for (const dc of [-1, 0, 1]) {
            if (dr === 0 && dc === 0) continue;
            const nb = board[cell.r + dr]?.[cell.c + dc];
            if (nb?.kind === "block") return true;
          }
        }
        return false;
      }
      return false;
    }
  },
  "enemy_unit": {
    maxSteps: 2, 
    validateTarget: (board, cell, faction, step) => {
      const t = board[cell.r]?.[cell.c];
      if (step === 1) return t?.kind === "empty";
      if (step === 2) return t?.kind === "unit" && t.faction !== faction;
      return false;
    }
  },
  "self": {
    maxSteps: 2, // 1: placement, 2: click itself
    validateTarget: (board, cell, faction, step, selected) => {
      if (step === 1) return board[cell.r]?.[cell.c]?.kind === "empty";
      if (step === 2) return cell.r === selected[0].r && cell.c === selected[0].c;
      return false;
    }
  },
  "area_3x3": {
    maxSteps: 1, // Skip placement click if it's a skill
    validateTarget: (board, cell) => {
      return true; // anywhere
    }
  }
};

export function getTargetDef(templateId: string): TargetDef | undefined {
  const tpl = CARD_LIBRARY.find(c => c.templateId === templateId);
  if (!tpl || !tpl.ability) return undefined;
  
  if (tpl.ability.requiresTarget) {
    const selectable = tpl.ability.selectableTargets;
    if (selectable && SELECTABLE_TARGETS_MAP[selectable]) {
      const base = SELECTABLE_TARGETS_MAP[selectable];
      return {
        ...base,
        onConfirm: () => {} // Logic handled inside gameStore applyEffect for now
      };
    }
    // Default fallback
    return {
      maxSteps: tpl.type === "unit" ? 2 : 1,
      onConfirm: () => {}
    };
  }
  return undefined;
}

export function requiresTargetSelection(templateId: string): boolean {
  return !!getTargetDef(templateId);
}
