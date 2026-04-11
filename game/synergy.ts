/**
 * synergy.ts — พลังร่วม (Synergy) + คอมโบ (Combo) Engine
 *
 * Pure engine: No React / Zustand imports.
 * All terminology is Thai:
 *   Liberty    → ช่องหายใจ
 *   Capture    → ล้อมแตก
 *   Territory  → พื้นที่ของเรา
 *   Synergy    → พลังร่วม
 *   Combo      → คอมโบ
 */

import type { Board, Coord, Faction } from "./types";
import { getGroup, getNeighbors, inBounds } from "./logic";

// ─────────────────────────────────────────────────────────────
// Synergy (พลังร่วม) Types
// ─────────────────────────────────────────────────────────────

export type SynergyKind =
  | "HANUMAN_RAMA"    // หนุมาน อยู่ติดกับ พระราม → ทั้งคู่เรืองแสง
  | "THREE_MONKEYS"   // กลุ่มที่มีลิง ≥3 ตัว → พลังร่วม
  | "TWO_DEMONS"      // กลุ่มที่มียักษ์ ≥2 ตัว → พลังร่วม
  | "TERRITORY";      // ยูนิตอยู่ในพื้นที่ของเรา

export type SynergyResult = {
  kind: SynergyKind;
  cells: Coord[];
  label: string;
  /** +1 = แข็งแกร่งขึ้น: threshold ล้อมแตก ลดลงเหลือ ≤1 ช่องหายใจ */
  defensiveBonus: number;
};

// ─────────────────────────────────────────────────────────────
// Combo (คอมโบ) Types
// ─────────────────────────────────────────────────────────────

export type ComboKind =
  | "SKILL_THEN_UNIT"       // สกิล → ยูนิต: +1 พลังงาน
  | "UNIT_THEN_SKILL"       // ยูนิต → สกิล: สกิลแรงขึ้น
  | "HANUMAN_RAMA_SEQ"      // หนุมาน + พระราม: กลุ่มไม่แตก
  | "INDRAJIT_BOMB"         // อินทรชิต + ระเบิด: ระเบิดแรงขึ้น
  | "BRIDGE_ARMY"           // สะพาน + กองทัพลิง: ควบคุมพื้นที่ทันที
  | "TOSAKAN_DRAIN"         // ทศกัณฐ์ + ดูดพลัง: ศัตรูเหลือช่องน้อยมาก
  | "KUMPHA_WALL"           // กุมภกรรณ + กำแพง: ป้องกันไม่ได้ทะลุ
  | "DEVA_QUICKMONKEY"      // พลังเทวดา + ลิงว่องไว: บุกลึกโดยไม่ตาย
  | "REVIVE_PHRARAM"        // ฟื้นพลัง + พระราม: ยูนิตที่ฟื้นกลับมาคุ้มกัน
  | "BLOCK_TOSAKAN"         // ปิดพื้นที่ + ทศกัณฐ์: ศัตรูหนีไม่ได้
  | "CHAIN_3";              // 3 การ์ดใน 1 เทิร์น: +1 พลังงาน

export type ComboResult = {
  kind: ComboKind;
  label: string;
  energyBonus: number;
  strongerSkill: boolean;
  immunityVisual: boolean;
};

export type ComboState = {
  playedTemplateIds: string[];
  playedCardTypes: ("unit" | "skill")[];
  energyGranted: number;
  strongerSkillActive: boolean;
  comboCount: number;
  /** Lifetime combo count for this game session — used for XP bonus at result screen */
  totalCombosThisGame: number;
};

export type ComboFeedback = {
  kind: ComboKind;
  label: string;
  nonce: number;
};

export type SynergyCell = {
  coord: Coord;
  kind: SynergyKind;
};

// ─────────────────────────────────────────────────────────────
// CellCardInfo — ข้อมูลการ์ดที่วางบนกระดาน
// ─────────────────────────────────────────────────────────────

export type CellCardInfo = {
  templateId: string;
  synergyTags: string[];
  faction: Faction;
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function coordKey(c: Coord) {
  return `${c.r},${c.c}`;
}

function parseKey(k: string): Coord {
  const [r, c] = k.split(",").map(Number);
  return { r: r!, c: c! };
}

// ─────────────────────────────────────────────────────────────
// 1. พลังร่วม: หนุมาน อยู่ติดกับ พระราม
// ─────────────────────────────────────────────────────────────

export function checkHanumanRamaSynergy(
  board: Board,
  cardMap: Map<string, CellCardInfo>,
): SynergyResult[] {
  const results: SynergyResult[] = [];
  const seen = new Set<string>();

  for (const [key, info] of cardMap) {
    if (!info.synergyTags.includes("hanuman")) continue;
    const coord = parseKey(key);
    if (!inBounds(board, coord)) continue;

    for (const n of getNeighbors(coord)) {
      const nKey = coordKey(n);
      const nInfo = cardMap.get(nKey);
      if (!nInfo) continue;
      // พระราม หรือ พระลักษณ์ (rama_char tag)
      if (!nInfo.synergyTags.includes("rama_char") && !nInfo.templateId.includes("phra_ram")) continue;
      if (!inBounds(board, n)) continue;

      const pairKey = [key, nKey].sort().join("|");
      if (seen.has(pairKey)) continue;
      seen.add(pairKey);

      results.push({
        kind: "HANUMAN_RAMA",
        cells: [coord, n],
        label: "พลังร่วม! หนุมาน + พระราม 🔥",
        defensiveBonus: 1,
      });
    }
  }
  return results;
}

// ─────────────────────────────────────────────────────────────
// 2. พลังร่วม: ลิง ≥3 ตัว หรือ ยักษ์ ≥2 ตัว ในกลุ่มเดียวกัน
// ─────────────────────────────────────────────────────────────

export function checkGroupSynergies(
  board: Board,
  cardMap: Map<string, CellCardInfo>,
): SynergyResult[] {
  const results: SynergyResult[] = [];
  const visitedGroupKeys = new Set<string>();

  for (const [key] of cardMap) {
    const coord = parseKey(key);
    if (!inBounds(board, coord)) continue;
    const tile = board[coord.r]?.[coord.c];
    if (!tile || tile.kind !== "unit") continue;

    const group = getGroup(board, coord);
    if (!group.length) continue;

    const groupSig = group.map(coordKey).sort().join("|");
    if (visitedGroupKeys.has(groupSig)) continue;
    visitedGroupKeys.add(groupSig);

    let monkeyCount = 0;
    let demonCount = 0;
    for (const cell of group) {
      const info = cardMap.get(coordKey(cell));
      if (!info) continue;
      if (info.synergyTags.includes("monkey")) monkeyCount++;
      if (info.synergyTags.includes("demon")) demonCount++;
    }

    if (monkeyCount >= 3) {
      results.push({
        kind: "THREE_MONKEYS",
        cells: group,
        label: "พลังร่วม! ลิงสามตัว 🐒🐒🐒",
        defensiveBonus: 1,
      });
    }

    if (demonCount >= 2) {
      results.push({
        kind: "TWO_DEMONS",
        cells: group,
        label: "พลังร่วม! ยักษ์คู่บึก 👹👹",
        defensiveBonus: 1,
      });
    }
  }
  return results;
}

// ─────────────────────────────────────────────────────────────
// 3. พลังร่วม: ยูนิตอยู่ในพื้นที่ของเรา
// ─────────────────────────────────────────────────────────────

export function checkTerritorySynergy(
  board: Board,
  cardMap: Map<string, CellCardInfo>,
  territoryMap: ("none" | Faction)[][],
): SynergyResult[] {
  const cells: Coord[] = [];

  for (const [key, info] of cardMap) {
    const coord = parseKey(key);
    if (!inBounds(board, coord)) continue;
    const terrOwner = territoryMap[coord.r]?.[coord.c];
    if (terrOwner === info.faction) {
      cells.push(coord);
    }
  }

  if (!cells.length) return [];
  return [
    {
      kind: "TERRITORY",
      cells,
      label: "พลังร่วม! ยึดพื้นที่ของเรา 🗺️",
      defensiveBonus: 0,
    },
  ];
}

// ─────────────────────────────────────────────────────────────
// Master synergy check
// ─────────────────────────────────────────────────────────────

export function checkAllSynergies(
  board: Board,
  cardMap: Map<string, CellCardInfo>,
  territoryMap: ("none" | Faction)[][],
): SynergyResult[] {
  return [
    ...checkHanumanRamaSynergy(board, cardMap),
    ...checkGroupSynergies(board, cardMap),
    ...checkTerritorySynergy(board, cardMap, territoryMap),
  ];
}

export function flattenSynergyCells(results: SynergyResult[]): SynergyCell[] {
  const seen = new Set<string>();
  const out: SynergyCell[] = [];
  for (const r of results) {
    for (const cell of r.cells) {
      const k = coordKey(cell);
      if (!seen.has(k)) {
        seen.add(k);
        out.push({ coord: cell, kind: r.kind });
      }
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────
// 4. คอมโบ (Combo) System
// ─────────────────────────────────────────────────────────────

const MAX_COMBO_ENERGY_PER_TURN = 2;

/** เรียกหลังจากเล่นการ์ดแต่ละใบ เพื่อตรวจว่าเกิดคอมโบหรือเปล่า */
export function evaluateCombo(state: ComboState): ComboResult | null {
  const { playedTemplateIds, playedCardTypes, energyGranted } = state;
  const n = playedCardTypes.length;
  if (n < 2) return null;

  const last = playedCardTypes[n - 2]!;
  const current = playedCardTypes[n - 1]!;
  const lastId = playedTemplateIds[n - 2] ?? "";
  const currentId = playedTemplateIds[n - 1] ?? "";

  const canGrant = energyGranted < MAX_COMBO_ENERGY_PER_TURN;

  // ── คอมโบ Chain x3: เล่น 3 การ์ดใน 1 เทิร์น ──────────────────
  if (n === 3) {
    return {
      kind: "CHAIN_3",
      label: "🔥 คอมโบ x3! ลำดับสมบูรณ์ (+1 พลังงาน)",
      energyBonus: canGrant ? 1 : 0,
      strongerSkill: false,
      immunityVisual: false,
    };
  }

  // ── คอมโบ: หนุมาน + พระราม ────────────────────────────────────
  const isHanuman = (id: string) => id === "hanuman";
  const isPhraRam = (id: string) => id === "phra_ram";
  if ((isHanuman(lastId) && isPhraRam(currentId)) || (isPhraRam(lastId) && isHanuman(currentId))) {
    return {
      kind: "HANUMAN_RAMA_SEQ",
      label: "🔥 คอมโบ! หนุมาน + พระราม — กลุ่มไม่แตกตานี้!",
      energyBonus: 0,
      strongerSkill: false,
      immunityVisual: true,
    };
  }

  // ── คอมโบ: อินทรชิต + ระเบิดลงกา ────────────────────────────
  const isIndrajit = (id: string) => id === "indrajit";
  const isBomb = (id: string) => id === "bomb";
  if (isIndrajit(lastId) && isBomb(currentId)) {
    return {
      kind: "INDRAJIT_BOMB",
      label: "🔥 คอมโบ! อินทรชิต + ระเบิด — ระเบิดทรงพลังมากขึ้น!",
      energyBonus: canGrant ? 1 : 0,
      strongerSkill: true,
      immunityVisual: false,
    };
  }

  // ── คอมโบ: สะพาน + กองทัพลิง ─────────────────────────────────
  const isBridge = (id: string) => id === "bridge";
  const isMonkeyArmy = (id: string) => id === "monkey_army";
  if (isBridge(lastId) && isMonkeyArmy(currentId)) {
    return {
      kind: "BRIDGE_ARMY",
      label: "🔥 คอมโบ! สะพาน + กองทัพ — ควบคุมพื้นที่ทันที!",
      energyBonus: canGrant ? 1 : 0,
      strongerSkill: true,
      immunityVisual: false,
    };
  }

  // ── คอมโบ: ทศกัณฐ์ + ดูดพลัง ────────────────────────────────
  const isTosakan = (id: string) => id === "tosakan";
  const isDrain = (id: string) => id === "drain";
  if ((isTosakan(lastId) && isDrain(currentId)) || (isDrain(lastId) && isTosakan(currentId))) {
    return {
      kind: "TOSAKAN_DRAIN",
      label: "🔥 คอมโบ! ทศกัณฐ์ + ดูดพลัง — ศัตรูเหลือช่องหายใจน้อยมาก!",
      energyBonus: 0,
      strongerSkill: true,
      immunityVisual: false,
    };
  }

  // ── คอมโบ: กุมภกรรณ + กำแพงยักษ์ ───────────────────────────
  const isKumpha = (id: string) => id === "kumpha";
  const isGiantWall = (id: string) => id === "giant_wall";
  if ((isKumpha(lastId) && isGiantWall(currentId)) || (isGiantWall(lastId) && isKumpha(currentId))) {
    return {
      kind: "KUMPHA_WALL",
      label: "🔥 คอมโบ! กุมภกรรณ + กำแพง — ป้องกันไม่ได้ทะลุ!",
      energyBonus: canGrant ? 1 : 0,
      strongerSkill: false,
      immunityVisual: true,
    };
  }

  // ── คอมโบ: พลังเทวดา + ลิงว่องไว ────────────────────────────
  const isDevaPower = (id: string) => id === "deva_power";
  const isQuickMonkey = (id: string) => id === "quick_monkey";
  if ((isDevaPower(lastId) && isQuickMonkey(currentId)) || (isQuickMonkey(lastId) && isDevaPower(currentId))) {
    return {
      kind: "DEVA_QUICKMONKEY",
      label: "🔥 คอมโบ! พลังเทวดา + ลิงว่องไว — บุกลึกโดยไม่ตาย!",
      energyBonus: canGrant ? 1 : 0,
      strongerSkill: true,
      immunityVisual: false,
    };
  }

  // ── คอมโบ: ฟื้นพลัง + พระราม ────────────────────────────────
  const isRevive = (id: string) => id === "revive";
  if ((isRevive(lastId) && isPhraRam(currentId)) || (isPhraRam(lastId) && isRevive(currentId))) {
    return {
      kind: "REVIVE_PHRARAM",
      label: "🔥 คอมโบ! ฟื้นพลัง + พระราม — ยูนิตฟื้นกลับมาคุ้มกัน!",
      energyBonus: 0,
      strongerSkill: false,
      immunityVisual: true,
    };
  }

  // ── คอมโบ: ปิดพื้นที่ + ทศกัณฐ์ ──────────────────────────────
  const isBlockArea = (id: string) => id === "block_area";
  if ((isBlockArea(lastId) && isTosakan(currentId)) || (isTosakan(lastId) && isBlockArea(currentId))) {
    return {
      kind: "BLOCK_TOSAKAN",
      label: "🔥 คอมโบ! ปิดพื้นที่ + ทศกัณฐ์ — ศัตรูหนีไม่ได้!",
      energyBonus: 0,
      strongerSkill: true,
      immunityVisual: false,
    };
  }

  // ── คอมโบพื้นฐาน: สกิล → ยูนิต ──────────────────────────────
  if (last === "skill" && current === "unit") {
    return {
      kind: "SKILL_THEN_UNIT",
      label: "⚡ คอมโบ! สกิล → ยูนิต (+1 พลังงาน)",
      energyBonus: canGrant ? 1 : 0,
      strongerSkill: false,
      immunityVisual: false,
    };
  }

  // ── คอมโบพื้นฐาน: ยูนิต → สกิล ──────────────────────────────
  if (last === "unit" && current === "skill") {
    return {
      kind: "UNIT_THEN_SKILL",
      label: "⚡ คอมโบ! ยูนิต → สกิลแรงขึ้น",
      energyBonus: 0,
      strongerSkill: true,
      immunityVisual: false,
    };
  }

  return null;
}

/** สถานะคอมโบเริ่มต้น (ต้นเทิร์น) */
export function makeEmptyComboState(): ComboState {
  return {
    playedTemplateIds: [],
    playedCardTypes: [],
    energyGranted: 0,
    strongerSkillActive: false,
    comboCount: 0,
    totalCombosThisGame: 0,
  };
}
