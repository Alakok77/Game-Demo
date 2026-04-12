/**
 * randomDeck.ts
 *
 * Random deck generation system for the Ramakien Strategy Game.
 * Generates balanced, playable decks with archetype biasing and variance modes.
 *
 * Rules:
 *   - deck size = 20
 *   - basic ≥ 10 (≥50%)
 *   - hero ≤ 6
 *   - legendary ≤ 2
 *   - low-cost cards (cost ≤ 2) ≥ 8
 *   - must have at least 1 unit card
 *   - respects unlockLevel and faction
 */

import { CARD_LIBRARY, DECK_SIZE } from "@/data/cards";
import type { CardTemplate } from "@/data/cards";
import type { Faction } from "@/game/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type VarianceMode = "balanced" | "aggressive" | "weird";

export type ArchetypeId =
  | "monkey_combo"
  | "giant_control"
  | "magic_burst"
  | "rush"
  | "trap_zone";

export interface Archetype {
  id: ArchetypeId;
  nameThai: string;
  emoji: string;
  /** synergyTags that get priority weight boost */
  priorityTags: string[];
  /** factions this archetype is best suited for (undefined = all) */
  factions?: Faction[];
}

export interface RandomDeckResult {
  ids: string[];
  archetype: Archetype;
  variance: VarianceMode;
}

// ─── Archetype definitions ────────────────────────────────────────────────────

export const ARCHETYPES: Archetype[] = [
  {
    id: "monkey_combo",
    nameThai: "ลิง combo",
    emoji: "🐒",
    priorityTags: ["monkey", "chain", "summon", "hanuman"],
    factions: ["RAMA"],
  },
  {
    id: "giant_control",
    nameThai: "ยักษ์ control",
    emoji: "👹",
    priorityTags: ["demon", "guard", "territory", "kumpha"],
    factions: ["LANKA"],
  },
  {
    id: "magic_burst",
    nameThai: "เวท burst",
    emoji: "⚡",
    priorityTags: ["cut_skill", "damage", "legendary_skill", "storm_skill"],
  },
  {
    id: "rush",
    nameThai: "บุกเร็ว",
    emoji: "🏃",
    priorityTags: ["advance", "mobility", "soldier", "vanguard", "light"],
  },
  {
    id: "trap_zone",
    nameThai: "ดักกับดัก",
    emoji: "🕸️",
    priorityTags: ["trap", "block_skill", "curse", "control", "push_skill"],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function seededRandom(seed: number): () => number {
  // Simple mulberry32 PRNG for reproducible results when seed is passed.
  let s = seed >>> 0;
  return function () {
    s = Math.imul(s ^ (s >>> 15), s | 1);
    s ^= s + Math.imul(s ^ (s >>> 7), s | 61);
    return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
  };
}

function cryptoRandom(): number {
  if (
    typeof globalThis !== "undefined" &&
    "crypto" in globalThis &&
    "getRandomValues" in globalThis.crypto
  ) {
    const arr = new Uint32Array(1);
    globalThis.crypto.getRandomValues(arr);
    return arr[0]! / 0xffffffff;
  }
  return Math.random();
}

function weightedPick<T>(items: T[], weights: number[], rng: () => number): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return items[i]!;
  }
  return items[items.length - 1]!;
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Card weight for a given archetype — priority tags increase weight */
function cardWeight(card: CardTemplate, archetype: Archetype): number {
  const matchCount = card.synergyTags.filter((t) =>
    archetype.priorityTags.includes(t)
  ).length;
  return 1 + matchCount * 2;
}

// ─── Owned card pool ───────────────────────────────────────────────────────

function getOwnedCards(faction: Faction, ownedIds: string[]): CardTemplate[] {
  return CARD_LIBRARY.filter(
    (c) =>
      ownedIds.includes(c.templateId) &&
      (c.cardFaction === faction || c.cardFaction === "NEUTRAL")
  );
}

// ─── Core generation ──────────────────────────────────────────────────────────

/**
 * Main entry point.
 *
 * @param faction        Active player faction
 * @param ownedIds       Array of card IDs the player owns
 * @param rerollSeed     Optional seed for reproducibility (pass Date.now() for fresh random)
 */
export function generateRandomDeck(
  faction: Faction,
  ownedIds: string[],
  rerollSeed?: number
): RandomDeckResult {
  const rng = rerollSeed !== undefined ? seededRandom(rerollSeed) : cryptoRandom;

  // ── Step 1: Owned card pool ─────────────────────────────────────────────
  const unlocked = getOwnedCards(faction, ownedIds);
  const basics     = unlocked.filter((c) => c.tier === "basic");
  const heroes     = unlocked.filter((c) => c.tier === "hero");
  const legendaries = unlocked.filter((c) => c.tier === "legendary");

  // ── Step 2: Roll variance ──────────────────────────────────────────────────
  const varianceRoll = rng();
  const variance: VarianceMode =
    varianceRoll < 0.7 ? "balanced" : varianceRoll < 0.9 ? "aggressive" : "weird";

  // ── Step 3: Pick archetype ─────────────────────────────────────────────────
  // Filter to archetypes that suit this faction OR have no faction restriction.
  const eligible = ARCHETYPES.filter(
    (a) => !a.factions || a.factions.includes(faction)
  );
  // Weight archetypes by how many priority-tag cards are in the unlocked pool.
  const archetypeWeights = eligible.map((a) =>
    unlocked.reduce((sum, c) => sum + cardWeight(c, a), 0)
  );
  const archetype = weightedPick(eligible, archetypeWeights, rng);

  // ── Step 4: Determine slot budget ─────────────────────────────────────────
  let basicTarget: number;
  let heroMax: number;
  let legMax: number;

  if (variance === "balanced") {
    basicTarget = 10 + Math.floor(rng() * 5); // 10–14
    heroMax     = 6;
    legMax      = 2;
  } else if (variance === "aggressive") {
    basicTarget = 10 + Math.floor(rng() * 3); // 10–12, more room for heroes
    heroMax     = 6;
    legMax      = 2;
  } else {
    // "weird" — push limits a bit, still satisfy hard rules
    basicTarget = 10 + Math.floor(rng() * 3); // 10–12
    heroMax     = 6;
    legMax      = 2;
  }

  // ── Step 5: Build weighted card lists ──────────────────────────────────────
  const weightedBasics     = basics.map((c) => cardWeight(c, archetype));
  const weightedHeroes     = heroes.map((c) => cardWeight(c, archetype));
  const weightedLegendaries = legendaries.map((c) => cardWeight(c, archetype));

  // ── Step 6: Pick cards respecting max-duplicate rules ─────────────────────
  const counts = new Map<string, number>(); // templateId → copies in deck
  const deckIds: string[] = [];

  function available(card: CardTemplate): boolean {
    const cur = counts.get(card.templateId) ?? 0;
    const max = card.tier === "basic" ? 4 : card.tier === "hero" ? 2 : 1;
    return cur < max;
  }

  function tryPick(pool: CardTemplate[], weights: number[]): boolean {
    // Filter to available
    const avail: CardTemplate[] = [];
    const availW: number[] = [];
    for (let i = 0; i < pool.length; i++) {
      if (available(pool[i]!)) {
        avail.push(pool[i]!);
        availW.push(weights[i]!);
      }
    }
    if (avail.length === 0) return false;
    const picked = weightedPick(avail, availW, rng);
    counts.set(picked.templateId, (counts.get(picked.templateId) ?? 0) + 1);
    deckIds.push(picked.templateId);
    return true;
  }

  // Phase A: Fill basic cards
  let basicCount = 0;
  while (basicCount < basicTarget && basicCount < DECK_SIZE) {
    if (!tryPick(basics, weightedBasics)) break;
    basicCount++;
  }

  // Phase B: Add heroes (up to heroMax or remaining slots, whichever is smaller)
  let heroCount = 0;
  const heroSlots = Math.min(heroMax, DECK_SIZE - deckIds.length);
  for (let i = 0; i < heroSlots; i++) {
    if (rng() < 0.75) { // 75% chance to add a hero each slot
      if (tryPick(heroes, weightedHeroes)) heroCount++;
    }
  }

  // Phase C: Add legendaries
  const legChance = variance === "weird" ? 0.7 : variance === "aggressive" ? 0.55 : 0.4;
  let legCount = 0;
  for (let i = 0; i < legMax && deckIds.length < DECK_SIZE; i++) {
    if (rng() < legChance) {
      if (tryPick(legendaries, weightedLegendaries)) legCount++;
    }
  }

  // Phase D: Fill remaining slots with basics
  while (deckIds.length < DECK_SIZE) {
    if (!tryPick(basics, weightedBasics)) break;
  }

  // Phase E: If still short (very few cards owned), pad with cheapest owned basic, or fail-safe fallback
  if (deckIds.length < DECK_SIZE) {
    const fallback =
      basics[0]?.templateId ??
      CARD_LIBRARY.find((c) => ownedIds.includes(c.templateId) && c.tier === "basic")?.templateId ??
      "quick_monkey";
    while (deckIds.length < DECK_SIZE) {
      // Only add if within max duplicate limit
      const cur = counts.get(fallback) ?? 0;
      if (cur < 4) {
        deckIds.push(fallback);
        counts.set(fallback, cur + 1);
      } else {
        break; // can't add more — deck is as full as possible
      }
    }
  }

  // ── Step 7: Balance filter ─────────────────────────────────────────────────
  applyBalanceFilter(deckIds, basics, weightedBasics, rng);

  // ── Step 8: Ensure at least 1 unit ────────────────────────────────────────
  ensureHasUnit(deckIds, basics, rng);

  // ── Step 9: Final shuffle ──────────────────────────────────────────────────
  const shuffled = shuffle(deckIds.slice(0, DECK_SIZE), rng);

  return { ids: shuffled, archetype, variance };
}

// ─── Balance filter ───────────────────────────────────────────────────────────

/**
 * Ensures the deck has ≥8 low-cost (cost ≤ 2) cards.
 * If not, replaces expensive basics with cheap ones.
 */
function applyBalanceFilter(
  ids: string[],
  basicPool: CardTemplate[],
  basicWeights: number[],
  rng: () => number
): void {
  const LOW_COST_THRESHOLD = 2;
  const MIN_LOW_COST = 8;

  const cheapBasics = basicPool
    .map((c, i) => ({ c, w: basicWeights[i]! }))
    .filter(({ c }) => c.cost <= LOW_COST_THRESHOLD);

  function lowCostCount(): number {
    return ids.filter((id) => {
      const card = CARD_LIBRARY.find((c) => c.templateId === id);
      return card && card.cost <= LOW_COST_THRESHOLD;
    }).length;
  }

  let attempts = 0;
  while (lowCostCount() < MIN_LOW_COST && attempts < 30) {
    attempts++;
    if (cheapBasics.length === 0) break;

    // Find an expensive card (cost > 2) in deckIds that is NOT a legendary to swap
    const expensiveIdx = ids.findIndex((id) => {
      const card = CARD_LIBRARY.find((c) => c.templateId === id);
      return card && card.cost > LOW_COST_THRESHOLD && card.tier !== "legendary";
    });
    if (expensiveIdx === -1) break;

    // Count current copies to respect max-dup rules
    const counts = new Map<string, number>();
    for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);

    // Pick a cheap basic that can still be added
    const available = cheapBasics.filter(({ c }) => {
      const cur = counts.get(c.templateId) ?? 0;
      return cur < 4;
    });
    if (available.length === 0) break;

    const picked = weightedPick(
      available.map(({ c }) => c),
      available.map(({ w }) => w),
      rng
    );
    ids[expensiveIdx] = picked.templateId;
  }
}

// ─── Ensure at least 1 unit ───────────────────────────────────────────────────

function ensureHasUnit(ids: string[], basicPool: CardTemplate[], rng: () => number): void {
  const hasUnit = ids.some((id) => {
    const card = CARD_LIBRARY.find((c) => c.templateId === id);
    return card?.type === "unit";
  });
  if (hasUnit) return;

  const unitBasics = basicPool.filter((c) => c.type === "unit");
  if (unitBasics.length === 0) return;

  // Replace a skill card
  const skillIdx = ids.findIndex((id) => {
    const card = CARD_LIBRARY.find((c) => c.templateId === id);
    return card?.type === "skill" && card.tier === "basic";
  });
  if (skillIdx === -1) return;

  const pick = unitBasics[Math.floor(rng() * unitBasics.length)]!;
  ids[skillIdx] = pick.templateId;
}

// ─── Variance label helpers ───────────────────────────────────────────────────

export function varianceLabel(v: VarianceMode): string {
  if (v === "balanced")   return "⚖️ สมดุล";
  if (v === "aggressive") return "⚔️ บุกรุก";
  return "🎭 แปลก";
}

export function varianceBg(v: VarianceMode): string {
  if (v === "balanced")   return "bg-emerald-800/50 text-emerald-300 border-emerald-600/40";
  if (v === "aggressive") return "bg-red-900/50 text-red-300 border-red-700/40";
  return "bg-purple-900/50 text-purple-300 border-purple-700/40";
}
