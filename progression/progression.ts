/**
 * progression.ts — Pure EXP / Level / Gold engine.
 * No React or Zustand deps. All state lives in localStorage via
 * loadProfile / saveProfile.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type Reward = {
  kind: "card" | "gold";
  templateId?: string;   // for card rewards
  amount?: number;       // for gold rewards
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
  gold: number;
  /** templateIds the player has unlocked via rewards (beyond tier-unlock) */
  unlockedCardTemplateIds: string[];
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

export function calcMatchGold(won: boolean): number {
  return won ? 50 : 20;
}

// ─── Default Profile ──────────────────────────────────────────────────────────

export function defaultProfile(): PlayerProfile {
  return { name: "ผู้เล่น", level: 1, exp: 0, totalExp: 0, gold: 0, unlockedCardTemplateIds: [] };
}

// ─── Persistence ──────────────────────────────────────────────────────────────

const STORAGE_KEY = "ramakien_profile_v1";

export function loadProfile(): PlayerProfile {
  if (typeof window === "undefined") return defaultProfile();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProfile();
    const p = JSON.parse(raw) as Partial<PlayerProfile>;
    return {
      name: p.name ?? "ผู้เล่น",
      level: p.level ?? 1,
      exp: p.exp ?? 0,
      totalExp: p.totalExp ?? 0,
      gold: p.gold ?? 0,
      unlockedCardTemplateIds: p.unlockedCardTemplateIds ?? [],
    };
  } catch {
    return defaultProfile();
  }
}

export function saveProfile(profile: PlayerProfile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

// ─── Core Logic ───────────────────────────────────────────────────────────────

/**
 * Apply EXP and gold gains to a profile.
 * Handles multi-level-up in a single call.
 * Returns the updated profile and an ordered list of level-up events.
 */
export function applyMatchRewards(
  profile: PlayerProfile,
  expGain: number,
  goldGain: number,
  getRewards: (level: number) => Reward[],
): { newProfile: PlayerProfile; levelUps: LevelUpResult[] } {
  let { name, level, exp, totalExp, gold, unlockedCardTemplateIds } = profile;
  totalExp += expGain;
  exp += expGain;
  gold += goldGain;

  const levelUps: LevelUpResult[] = [];

  while (exp >= expToNextLevel(level)) {
    exp -= expToNextLevel(level);
    level++;
    const rewards = getRewards(level);
    for (const r of rewards) {
      if (r.kind === "card" && r.templateId && !unlockedCardTemplateIds.includes(r.templateId)) {
        unlockedCardTemplateIds = [...unlockedCardTemplateIds, r.templateId];
      }
      if (r.kind === "gold" && r.amount) gold += r.amount;
    }
    levelUps.push({ newLevel: level, rewards });
  }

  return { newProfile: { name, level, exp, totalExp, gold, unlockedCardTemplateIds }, levelUps };
}

/**
 * Whether a card is accessible to the player.
 * - unlockLevel 1 → always accessible.
 * - Otherwise accessible if playerLevel >= unlockLevel.
 */
export function isCardAccessible(unlockLevel: number, playerLevel: number): boolean {
  return playerLevel >= unlockLevel;
}

/**
 * Returns all cards from a library that a player at `playerLevel` can use.
 * Import CARD_LIBRARY from data/cards at call site to avoid circular deps.
 */
export function getUnlockedCardIds(allTemplateIds: string[], unlockLevelMap: Map<string, number>, playerLevel: number): string[] {
  return allTemplateIds.filter((id) => {
    const lvl = unlockLevelMap.get(id) ?? 1;
    return lvl <= playerLevel;
  });
}
