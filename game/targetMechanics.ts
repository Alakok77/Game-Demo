import type { Coord, Board, Faction } from "@/game/types";

export type TargetDef = {
  maxSteps: number;
  validateTarget?: (board: Board, cell: Coord, faction: Faction, step: number, selectedCoords: Coord[]) => boolean;
  onConfirm: (board: Board, selectedCoords: Coord[], faction: Faction) => Board | void; // void means rely on the default playUnit / skill logic, board return means override board state completely
};

/** mapping templateId to target mechanics */
export const TARGET_MECHANICS: Record<string, TargetDef> = {
  // r_h1 พระลักษณ์: เลือกฝ่ายเรา ติดศัตรู
  "r_h1": {
    maxSteps: 2,
    validateTarget: (board, cell, faction, step) => {
       const t = board[cell.r]?.[cell.c];
       if (step === 1) return t?.kind === "unit" && t.faction === faction;
       if (step === 2) return t?.kind === "unit" && t.faction !== faction; // simplifying adjacency check for ease
       return false;
    },
    onConfirm: (board, coords) => {
       // logic will be handled inside gameStore apply sequence or here
    }
  },
  // n_s2 มนต์เรียกปลา
  "n_s2": {
    maxSteps: 3,
    validateTarget: (board, cell) => {
       return board[cell.r]?.[cell.c]?.kind === "empty";
    },
    onConfirm: () => {}
  }
};

/** Tells if placing this card requires entering target selection mode */
export function requiresTargetSelection(templateId: string): boolean {
  return templateId in TARGET_MECHANICS;
}
