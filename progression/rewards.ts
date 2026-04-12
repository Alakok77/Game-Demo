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
    { kind: "coins", amount: 75,  label: "+75 Coins รางวัลเริ่มต้น", icon: "🪙" },
  ],
  3: [
    { kind: "coins", amount: 100, label: "+100 Coins",                icon: "🪙" },
    { kind: "card", label: "⚔️ Hero Cards ปลดล็อกในร้านค้า! (หนุมาน, พระลักษณ์…)", icon: "⚔️" },
  ],
  4: [
    { kind: "coins", amount: 150, label: "+150 Coins",                icon: "🪙" },
    { kind: "card", label: "🆕 New Power Cards เข้าร้านค้า! (วาปหนุมาน, หลุมมิติ…)", icon: "🆕" },
  ],
  5: [
    { kind: "coins", amount: 200, label: "+200 Coins",                icon: "🪙" },
    { kind: "card", label: "✨ Legendary Cards ปลดล็อกในร้าน! (พระราม, ทศกัณฐ์…)", icon: "✨" },
  ],
  6: [
    { kind: "coins", amount: 200, label: "+200 Coins",                icon: "🪙" },
  ],
  7: [
    { kind: "coins", amount: 250, label: "+250 Coins",                icon: "🪙" },
  ],
  8: [
    { kind: "coins", amount: 300, label: "+300 Coins",                icon: "🪙" },
    { kind: "card", label: "🌟 การ์ดทั้งหมดปลดล็อกในร้านค้าแล้ว!", icon: "🌟" },
  ],
  9: [
    { kind: "coins", amount: 350, label: "+350 Coins",                icon: "🪙" },
  ],
  10: [
    { kind: "coins", amount: 500, label: "+500 Coins 🎊 Milestone ครบ 10!", icon: "🪙🎊" },
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

/**
 * Calculates the shop price of a card based on its tier and unlockLevel.
 */
export function getCardPrice(tier: "basic" | "hero" | "legendary", unlockLevel: number): number {
  if (tier === "basic") {
    if (unlockLevel === 1) return 75;
    if (unlockLevel === 2) return 100;
    return 150;
  }
  if (tier === "hero") {
    if (unlockLevel <= 3) return 250;
    if (unlockLevel === 4) return 300;
    return 400;
  }
  if (tier === "legendary") {
    if (unlockLevel === 5) return 800;
    if (unlockLevel === 6) return 1000;
    return 1500;
  }
  return 100;
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
  if (playerLevel < 3) return `⚔️ Hero Cards จะปรากฏในร้านค้าเลเวล 3 (ขาด ${3 - playerLevel})`;
  if (playerLevel < 4) return `🆕 Power Cards ลงร้านค้าเลเวล 4 (ขาด ${4 - playerLevel})`;
  if (playerLevel < 5) return `✨ Legendary Cards ลงร้านค้าเลเวล 5 (ขาด ${5 - playerLevel})`;
  if (playerLevel < 8) return `ปลดล็อกการ์ดลงร้านค้าครบที่เลเวล 8 (ขาด ${8 - playerLevel})`;
  if (playerLevel < 10) return "🌟 เล่นต่อเพื่อรับ Coins พิเศษ";
  return "👑 Legendary Player — ทุกอย่างเข้าสู่ร้านค้าแล้ว!";
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
