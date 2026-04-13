/**
 * progression.ts — Pure EXP / Level / Gold engine.
 * No React or Zustand deps. All state lives in localStorage via
 * loadProfile / saveProfile.
 */

import { loadData, saveData } from "@/lib/storage";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Reward = {
  kind: "card" | "coins";
  templateId?: string;   // for card rewards
  amount?: number;       // for coins rewards
  label: string;
  icon: string;
};

export type LevelUpResult = {
  newLevel: number;
  rewards: Reward[];
};

export type PlayerProfile = {
  name: string;
  level: number;
  /** EXP within the current level (resets on level-up) */
  exp: number;
  /** Lifetime accumulated EXP — never decreases */
  totalExp: number;
  coins: number;
  /** templateIds the player has unlocked via rewards (legacy, kept for compat) */
  unlockedCardTemplateIds: string[];
  /** templateIds the player actually owns (bought or granted) */
  ownedCardTemplateIds: string[];
  /** ISO date string of last daily reward claim */
  lastDailyReward?: string;
  /** Lifetime stats for adaptive AI scaling */
  stats: {
    matchesPlayed: number;
    matchesWon: number;
    totalCombos: number;
    totalCaptures: number;
  };
};

export type MatchInput = {
  won: boolean;
  captures: number;   // captures by the human player this match
  territory: number;  // territory controlled by human at end of match
  comboCount?: number; // number of combos triggered this match (+20 XP each)
};

export type MatchExpResult = {
  base: number;
  captureBonus: number;
  territoryBonus: number;
  comboBonus: number;
  total: number;
};

// ─── Level Formula ────────────────────────────────────────────────────────────

/**
 * EXP required to advance from `level` to `level + 1`.
 * L1→L2: 150, L2→L3: 200, L3→L4: 250 …
 */
export function expToNextLevel(level: number): number {
  return 100 + level * 50;
}

/** Total cumulative EXP needed to reach `level` from zero. */
export function totalExpNeededForLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l++) total += expToNextLevel(l);
  return total;
}

/** Derive level + intra-level progress from lifetime EXP. */
export function expProgress(totalExp: number): {
  level: number;
  current: number;
  needed: number;
} {
  let level = 1;
  let remaining = totalExp;
  while (remaining >= expToNextLevel(level)) {
    remaining -= expToNextLevel(level);
    level++;
  }
  return { level, current: remaining, needed: expToNextLevel(level) };
}

// ─── Match Rewards Calculation ───────────────────────────────────────────────

export function calcMatchExp(input: MatchInput): MatchExpResult {
  const base = input.won ? 100 : 50;
  const captureBonus = input.captures >= 3 ? 20 : 0;
  const territoryBonus = input.territory >= 10 ? 20 : 0;
  const comboBonus = (input.comboCount ?? 0) * 20;
  return { base, captureBonus, territoryBonus, comboBonus, total: base + captureBonus + territoryBonus + comboBonus };
}

export function calcMatchCoins(won: boolean, comboCount: number = 0): number {
  const base = won ? 100 : 50;
  const comboBonus = Math.min(100, comboCount * 20);
  return base + comboBonus;
}

// ─── Default Profile ──────────────────────────────────────────────────────────

export function defaultProfile(): PlayerProfile {
  return {
    name: "ผู้เล่น",
    level: 1,
    exp: 0,
    totalExp: 0,
    coins: 0,
    unlockedCardTemplateIds: [],
    ownedCardTemplateIds: [],
    stats: {
      matchesPlayed: 0,
      matchesWon: 0,
      totalCombos: 0,
      totalCaptures: 0
    }
  };
}

// ─── Persistence ──────────────────────────────────────────────────────────────

const STORAGE_KEY = "ramakien_profile_v1";

export function loadProfile(): PlayerProfile {
  if (typeof window === "undefined") return defaultProfile();
  try {
    // Try to load namespaced data first
    let p = loadData<Partial<PlayerProfile & { gold: number }> | null>(STORAGE_KEY, null);
    
    // If not found, try to migrate from global legacy data
    if (!p) {
      const rawLegacy = window.localStorage.getItem(STORAGE_KEY);
      if (rawLegacy) {
        p = JSON.parse(rawLegacy);
        // Save to new namespaced storage right away if migrated
        saveData(STORAGE_KEY, p);
      }
    }

    if (!p) return applyStarterPack(defaultProfile());
    
    // Migrate gold -> coins
    const coins = typeof p.coins === "number" ? p.coins : (typeof p.gold === "number" ? p.gold : 0);
    
    const profile: PlayerProfile = {
      name: p.name ?? "ผู้เล่น",
      level: p.level ?? 1,
      exp: p.exp ?? 0,
      totalExp: p.totalExp ?? 0,
      coins,
      unlockedCardTemplateIds: p.unlockedCardTemplateIds ?? [],
      ownedCardTemplateIds: p.ownedCardTemplateIds ?? [],
      lastDailyReward: p.lastDailyReward,
      stats: p.stats ?? {
        matchesPlayed: 0,
        matchesWon: 0,
        totalCombos: 0,
        totalCaptures: 0
      }
    };
    
    return applyStarterPack(profile);
  } catch {
    return applyStarterPack(defaultProfile());
  }
}

/** 
 * Grants starter cards if none are owned.
 * Dynamically includes basic tier cards that unlock at level 1.
 */
function applyStarterPack(profile: PlayerProfile): PlayerProfile {
  if (profile.ownedCardTemplateIds && profile.ownedCardTemplateIds.length > 0) {
    return profile;
  }
  
  // Standard starter pack template IDs for level 1 basics
  const starterIds = [
    "quick_monkey", "macaque_scout", "monkey_warrior", "macaque_guard", "monkey_archer",
    "demon_soldier", "demon_guard", "demon_archer", "demon_warrior",
    "move_skill", "cut_skill", "block_skill"
  ];
  
  return {
    ...profile,
    ownedCardTemplateIds: Array.from(new Set([...(profile.ownedCardTemplateIds ?? []), ...starterIds]))
  };
}

export function saveProfile(profile: PlayerProfile): void {
  saveData(STORAGE_KEY, profile);
}

// ─── Core Logic ───────────────────────────────────────────────────────────────

/**
 * Apply EXP and coins gains to a profile.
 * Handles multi-level-up in a single call.
 * Returns the updated profile and an ordered list of level-up events.
 */
export function applyMatchRewards(
  profile: PlayerProfile,
  expGain: number,
  coinsGain: number,
  getRewards: (level: number) => Reward[],
): { newProfile: PlayerProfile; levelUps: LevelUpResult[] } {
  let { name, level, exp, totalExp, coins, unlockedCardTemplateIds, ownedCardTemplateIds, lastDailyReward } = profile;
  totalExp += expGain;
  exp += expGain;
  coins += coinsGain;

  const levelUps: LevelUpResult[] = [];

  while (exp >= expToNextLevel(level)) {
    exp -= expToNextLevel(level);
    level++;
    const rewards = getRewards(level);
    for (const r of rewards) {
      if (r.kind === "card" && r.templateId && !unlockedCardTemplateIds.includes(r.templateId)) {
        unlockedCardTemplateIds = [...unlockedCardTemplateIds, r.templateId];
        if (!ownedCardTemplateIds.includes(r.templateId)) {
          ownedCardTemplateIds = [...ownedCardTemplateIds, r.templateId];
        }
      }
      if (r.kind === "coins" && r.amount) coins += r.amount;
    }
    levelUps.push({ newLevel: level, rewards });
  }

  return { newProfile: { name, level, exp, totalExp, coins, unlockedCardTemplateIds, ownedCardTemplateIds, lastDailyReward, stats: profile.stats }, levelUps };
}

/** 
 * Update lifetime stats after a match.
 */
export function updateStats(profile: PlayerProfile, input: MatchInput): PlayerProfile {
  return {
    ...profile,
    stats: {
      matchesPlayed: profile.stats.matchesPlayed + 1,
      matchesWon: profile.stats.matchesWon + (input.won ? 1 : 0),
      totalCombos: profile.stats.totalCombos + (input.comboCount ?? 0),
      totalCaptures: profile.stats.totalCaptures + input.captures
    }
  };
}

/**
 * Whether a card is accessible to the player.
 * Now primarily governed by ownership in the shop system.
 */
export function isCardAccessible(templateId: string, ownedIds: string[]): boolean {
  return ownedIds.includes(templateId);
}

/**
 * Returns all cards from a library that a player owns.
 */
export function getUnlockedCardIds(allTemplateIds: string[], ownedIds: string[]): string[] {
  return allTemplateIds.filter((id) => ownedIds.includes(id));
}

// ─── Shop Actions ─────────────────────────────────────────────────────────────

export function claimDailyReward(profile: PlayerProfile): { ok: boolean; newProfile: PlayerProfile; awarded: number } {
  const today = new Date().toISOString().slice(0, 10);
  if (profile.lastDailyReward === today) {
    return { ok: false, newProfile: profile, awarded: 0 };
  }
  
  return {
    ok: true,
    awarded: 200,
    newProfile: {
      ...profile,
      coins: profile.coins + 200,
      lastDailyReward: today
    }
  };
}

export function buyCard(profile: PlayerProfile, templateId: string, price: number): { ok: boolean; reason?: string; newProfile: PlayerProfile } {
  if (profile.ownedCardTemplateIds.includes(templateId)) {
    return { ok: false, reason: "มีแล้ว", newProfile: profile };
  }
  if (profile.coins < price) {
    return { ok: false, reason: "เหรียญไม่พอ", newProfile: profile };
  }
  
  return {
    ok: true,
    newProfile: {
      ...profile,
      coins: profile.coins - price,
      ownedCardTemplateIds: [...profile.ownedCardTemplateIds, templateId]
    }
  };
}

export function buyRandomPack(profile: PlayerProfile, allCardIds: string[]): { ok: boolean; reason?: string; newProfile: PlayerProfile; received: string[] } {
  const PRICE = 300;
  if (profile.coins < PRICE) {
    return { ok: false, reason: "เหรียญไม่พอ", newProfile: profile, received: [] };
  }
  
  // Find unowned cards
  const unowned = allCardIds.filter(id => !profile.ownedCardTemplateIds.includes(id));
  if (unowned.length === 0) {
    return { ok: false, reason: "คุณมีการ์ดครบทุกใบแล้ว", newProfile: profile, received: [] };
  }
  
  // Pick up to 3 random unowned cards
  const shuffled = [...unowned].sort(() => Math.random() - 0.5);
  const received = shuffled.slice(0, Math.min(3, shuffled.length));
  
  return {
    ok: true,
    received,
    newProfile: {
      ...profile,
      coins: profile.coins - PRICE,
      ownedCardTemplateIds: [...profile.ownedCardTemplateIds, ...received]
    }
  };
}
