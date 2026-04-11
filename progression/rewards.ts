/**
 * rewards.ts — Level-up reward table and unlock helpers.
 */
import type { Reward } from "./progression";

// ─── Level Reward Table ───────────────────────────────────────────────────────

/**
 * All rewards granted when the player reaches a given level.
 * Gold amounts are added to the profile automatically by applyMatchRewards.
 * "unlock" kind is purely cosmetic — actual card availability is driven by
 * card.unlockLevel vs playerLevel comparison in deck building.
 */
export const LEVEL_REWARDS: Record<number, Reward[]> = {
  2: [
    { kind: "gold", amount: 75,  label: "+75 Gold รางวัลเริ่มต้น", icon: "🪙" },
  ],
  3: [
    { kind: "gold", amount: 100, label: "+100 Gold",                icon: "🪙" },
    { kind: "card", label: "⚔️ Hero Cards ปลดล็อกแล้ว! (หนุมาน, พระลักษณ์, กุมภกรรณ…)", icon: "⚔️" },
  ],
  4: [
    { kind: "gold", amount: 150, label: "+150 Gold",                icon: "🪙" },
    { kind: "card", label: "🆕 New Power Cards ปลดล็อก! (วาปหนุมาน, หลุมมิติ…)", icon: "🆕" },
  ],
  5: [
    { kind: "gold", amount: 200, label: "+200 Gold",                icon: "🪙" },
    { kind: "card", label: "✨ Legendary Cards ปลดล็อกแล้ว! (พระราม, ทศกัณฐ์, หนุมานเผาลงกา…)", icon: "✨" },
  ],
  6: [
    { kind: "gold", amount: 200, label: "+200 Gold",                icon: "🪙" },
  ],
  7: [
    { kind: "gold", amount: 250, label: "+250 Gold",                icon: "🪙" },
  ],
  8: [
    { kind: "gold", amount: 300, label: "+300 Gold",                icon: "🪙" },
    { kind: "card", label: "🌟 การ์ดทั้งหมดปลดล็อกแล้ว! คุณถึงจุดสูงสุด", icon: "🌟" },
  ],
  9: [
    { kind: "gold", amount: 350, label: "+350 Gold",                icon: "🪙" },
  ],
  10: [
    { kind: "gold", amount: 500, label: "+500 Gold 🎊 Milestone ครบ 10!", icon: "🪙🎊" },
    { kind: "card", label: "👑 Legendary Player — ทำสำเร็จทุกอย่างแล้ว!", icon: "👑" },
  ],
};

export function getRewardsForLevel(level: number): Reward[] {
  return LEVEL_REWARDS[level] ?? [];
}

// ─── Unlock Level Helpers ─────────────────────────────────────────────────────

/**
 * Minimum player level required to use cards of this tier.
 * Basic: 1 (always available), Hero: 3, Legendary: 5.
 */
export function tierUnlockLevel(tier: "basic" | "hero" | "legendary"): number {
  if (tier === "basic") return 1;
  if (tier === "hero") return 3;
  return 5; // legendary
}

/** Human-readable lock hint shown on locked cards in deck builder. */
export function unlockLevelHint(unlockLevel: number): string {
  if (unlockLevel <= 1) return "";
  return `ปลดล็อกที่เลเวล ${unlockLevel}`;
}

/**
 * What the player unlocks next, given their current level.
 * Used in ProfilePanel / progression UI.
 */
export function nextUnlockHint(playerLevel: number): string {
  if (playerLevel < 3) return `ปลดล็อก ⚔️ Hero Cards ที่เลเวล 3 (อีก ${3 - playerLevel} เลเวล)`;
  if (playerLevel < 4) return `ปลดล็อก 🆕 Power Cards ใหม่ที่เลเวล 4 (อีก ${4 - playerLevel} เลเวล)`;
  if (playerLevel < 5) return `ปลดล็อก ✨ Legendary Cards ที่เลเวล 5 (อีก ${5 - playerLevel} เลเวล)`;
  if (playerLevel < 8) return `ปลดล็อกการ์ดทั้งหมดที่เลเวล 8 (อีก ${8 - playerLevel} เลเวล)`;
  if (playerLevel < 10) return "🌟 เล่นต่อเพื่อรับ Gold พิเศษ";
  return "👑 Legendary Player — ทุกอย่างปลดล็อกแล้ว!";
}

/**
 * Emoji icon for current progression stage.
 */
export function progressionStageIcon(playerLevel: number): string {
  if (playerLevel < 3) return "🥚";
  if (playerLevel < 5) return "⚔️";
  if (playerLevel < 8) return "🌟";
  if (playerLevel < 10) return "💎";
  return "👑";
}
