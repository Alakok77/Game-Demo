"use client";

import { motion } from "framer-motion";
import type { Card as CardT, Faction } from "@/game/types";
import { Tooltip } from "./Tooltip";

// ─── Design tokens ─────────────────────────────────────────────────────────────

/** Full card shell — border + background tint by faction × tier */
function cardShellClasses(
  faction: Faction,
  tier: "basic" | "hero" | "legendary" | undefined,
  selected: boolean,
  playable: boolean,
  cheapestPlayable: boolean,
  disabled: boolean,
) {
  const base =
    "relative select-none rounded-2xl border-2 text-left transition-all duration-200 overflow-hidden cursor-pointer";

  // Tier-based background
  const tierBg =
    tier === "legendary"
      ? faction === "RAMA"
        ? "bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950"
        : "bg-gradient-to-b from-red-950 via-purple-950 to-slate-950"
      : tier === "hero"
      ? faction === "RAMA"
        ? "bg-gradient-to-b from-blue-950 via-slate-900 to-slate-950"
        : "bg-gradient-to-b from-red-950 via-slate-900 to-slate-950"
      : "bg-gradient-to-b from-slate-800 to-slate-950";

  // Border color — selected overrides everything
  const border = selected
    ? "border-yellow-400"
    : tier === "legendary"
    ? "border-purple-500"
    : tier === "hero"
    ? faction === "RAMA"
      ? "border-blue-400"
      : "border-red-400"
    : cheapestPlayable
    ? "border-yellow-400/80"
    : playable
    ? "border-green-400/70"
    : faction === "RAMA"
    ? "border-blue-500/40"
    : "border-red-500/40";

  // Shadow / ring — priority: selected > cheapest > playable > tier
  const glow = selected
    ? "shadow-[0_0_32px_rgba(250,204,21,0.7)] ring-2 ring-yellow-400"
    : cheapestPlayable
    ? "shadow-[0_0_20px_rgba(250,204,21,0.55)] ring-2 ring-yellow-400/90"
    : playable
    ? "shadow-[0_0_16px_rgba(52,211,153,0.40)] ring-1 ring-emerald-400/70"
    : tier === "legendary"
    ? "shadow-[0_0_20px_rgba(168,85,247,0.35)]"
    : tier === "hero"
    ? faction === "RAMA"
      ? "shadow-[0_0_12px_rgba(59,130,246,0.25)]"
      : "shadow-[0_0_12px_rgba(239,68,68,0.25)]"
    : "shadow-sm";

  const interactive = disabled
    ? "opacity-45 grayscale cursor-not-allowed pointer-events-none"
    : "hover:scale-[1.05] hover:shadow-xl";

  const legendaryPulse = tier === "legendary" ? "animate-legendary-border" : "";

  return [base, tierBg, border, glow, interactive, legendaryPulse].filter(Boolean).join(" ");
}

// ─── Sub-components ────────────────────────────────────────────────────────────

/** Rarity badge — top-left */
function RarityBadge({ tier }: { tier?: "basic" | "hero" | "legendary" }) {
  if (tier === "legendary")
    return (
      <span className="rounded-md bg-purple-500/50 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-purple-100 ring-1 ring-purple-400/70 shadow-[0_0_8px_rgba(168,85,247,0.4)]">
        ✨ ตำนาน
      </span>
    );
  if (tier === "hero")
    return (
      <span className="rounded-md bg-amber-500/25 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-yellow-200 ring-1 ring-yellow-400/60">
        ⚔️ ฮีโร่
      </span>
    );
  return (
    <span className="rounded-md bg-slate-600/60 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-300 ring-1 ring-slate-500/40">
      พื้นฐาน
    </span>
  );
}

/** Card type badge — shown below rarity */
function TypeBadge({ type }: { type: "unit" | "skill" }) {
  if (type === "skill")
    return (
      <span className="rounded-md bg-violet-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-violet-300 ring-1 ring-violet-400/40">
        ✨ สกิล
      </span>
    );
  return (
    <span className="rounded-md bg-slate-700/60 px-1.5 py-0.5 text-[9px] font-semibold text-slate-300 ring-1 ring-slate-500/30">
      👤 ยูนิต
    </span>
  );
}

/** Cost gem — top-right */
function CostGem({ cost, faction }: { cost: number; faction: Faction }) {
  return (
    <div
      className={[
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-black text-white",
        faction === "RAMA"
          ? "border-yellow-400 bg-gradient-to-br from-yellow-400 to-amber-600 shadow-[0_0_10px_rgba(251,191,36,0.6)]"
          : "border-red-400 bg-gradient-to-br from-red-500 to-rose-700 shadow-[0_0_10px_rgba(239,68,68,0.5)]",
      ].join(" ")}
    >
      {cost}
    </div>
  );
}

/** Faction colour stripe at card top */
function FactionStripe({ faction, tier }: { faction: Faction; tier?: string }) {
  const color =
    tier === "legendary"
      ? "from-purple-500 via-violet-400 to-purple-600"
      : faction === "RAMA"
      ? "from-blue-500 via-indigo-400 to-blue-600"
      : "from-red-500 via-rose-400 to-red-600";
  return <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${color}`} />;
}

/** "กำลังเลือก" badge overlay when selected */
function SelectedBadge() {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 -top-3 z-10 whitespace-nowrap rounded-full bg-yellow-400 px-2 py-0.5 text-[9px] font-black text-slate-900 shadow-lg ring-1 ring-yellow-300">
      ✔ กำลังเลือก
    </div>
  );
}

/** Status footer pill */
function StatusPill({
  playable,
  cheapestPlayable,
  disabled,
}: {
  playable?: boolean;
  cheapestPlayable?: boolean;
  disabled?: boolean;
}) {
  if (cheapestPlayable)
    return (
      <div className="mt-auto flex items-center justify-center rounded-lg bg-yellow-400/25 py-1 text-[10px] font-bold text-yellow-200 ring-1 ring-yellow-400/50">
        ⚡ แนะนำ
      </div>
    );
  if (playable)
    return (
      <div className="mt-auto flex items-center justify-center rounded-lg bg-emerald-500/25 py-1 text-[10px] font-bold text-emerald-200 ring-1 ring-emerald-400/50">
        ✓ วางได้
      </div>
    );
  if (disabled)
    return (
      <div className="mt-auto flex items-center justify-center rounded-lg bg-slate-700/60 py-1 text-[10px] font-semibold text-slate-500">
        🔒 พลังงานไม่พอ
      </div>
    );
  return null;
}

// ─── Card Component ───────────────────────────────────────────────────────────

export function Card({
  card,
  selected,
  disabled,
  cheapestPlayable,
  playable,
  faction,
  disableHover,
  onClick,
}: {
  card: CardT;
  selected: boolean;
  disabled?: boolean;
  cheapestPlayable?: boolean;
  playable?: boolean;
  faction: Faction;
  disableHover?: boolean;
  onClick: () => void;
}) {
  const isSkill = card.type === "skill";

  const shellClass = cardShellClasses(faction, card.tier, selected, !!playable, !!cheapestPlayable, !!disabled);
  const finalClass = disableHover ? shellClass.replace("hover:scale-[1.05] hover:shadow-xl", "") : shellClass;

  // Faction icon watermark
  const factionMark = faction === "RAMA" ? "⭐" : "🔥";

  return (
    <Tooltip
      content={
        <div className="space-y-1.5 max-w-[220px]">
          <div className="flex items-center justify-between gap-2">
            <div className="font-bold text-white">{card.icon} {card.name}</div>
            <div className="rounded-md bg-slate-700 px-2 py-0.5 text-[11px] text-yellow-300 font-bold">
              ⚡ {card.cost}
            </div>
          </div>
          <div className="text-[11px] text-slate-300 leading-relaxed">{card.description}</div>
          {card.ability && card.ability.trigger !== "-" ? (
            <div className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] text-amber-300 font-semibold">
              {card.ability.action === "ไม่มี" ? card.ability.result : `${card.ability.action} ➔ ${card.ability.result}`}
            </div>
          ) : null}
          <div className="flex gap-1 pt-0.5">
            <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400">
              {isSkill ? "✨ สกิล" : "👤 ยูนิต"}
            </span>
            <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400">
              {card.tier === "legendary" ? "✨ ตำนาน" : card.tier === "hero" ? "⚔️ ฮีโร่" : "พื้นฐาน"}
            </span>
          </div>
        </div>
      }
    >
      <motion.button
        whileTap={{ scale: disabled ? 1 : 0.96 }}
        whileHover={disableHover ? undefined : { y: disabled ? 0 : -6 }}
        onClick={disabled ? undefined : onClick}
        className={[
          "w-[160px] h-[220px] flex flex-col gap-0",
          finalClass,
        ].join(" ")}
      >
        {/* Faction stripe */}
        <FactionStripe faction={faction} tier={card.tier} />

        {/* "กำลังเลือก" badge */}
        {selected ? <SelectedBadge /> : null}

        {/* Subtle inner glow overlay */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/5" />

        {/* Faction watermark */}
        <div className="pointer-events-none absolute right-2 bottom-10 text-4xl opacity-5 select-none">
          {factionMark}
        </div>

        {/* ── HEADER ── */}
        <div className="flex items-start justify-between gap-1 px-3 pt-4">
          <div className="flex flex-col gap-1">
            <RarityBadge tier={card.tier} />
            <TypeBadge type={card.type} />
          </div>
          <CostGem cost={card.cost} faction={faction} />
        </div>

        {/* ── ICON + NAME ── */}
        <div className="flex flex-col items-center px-3 py-2 text-center">
          <div className="text-3xl leading-none drop-shadow-lg">{card.icon ?? "🃏"}</div>
          <div className="mt-1.5 line-clamp-2 text-xs font-bold leading-tight text-white">
            {card.name}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-3 border-t border-white/10" />

        {/* ── ABILITY BODY ── */}
        <div className="flex flex-1 flex-col gap-1 px-3 py-2">
          <div
            className={[
              "text-[9px] font-bold uppercase tracking-widest",
              isSkill ? "text-violet-400" : "text-slate-500",
            ].join(" ")}
          >
            {isSkill ? "✨ ความสามารถ" : "👤 รายละเอียด"}
          </div>
          <p className="line-clamp-3 text-[10px] leading-relaxed text-slate-300">
            {card.ability && card.ability.trigger !== "-"
              ? (card.ability.action === "ไม่มี" ? card.ability.result : `${card.ability.action} ➔ ${card.ability.result}`)
              : card.description}
          </p>
        </div>

        {/* ── FOOTER STATUS ── */}
        <div className="px-3 pb-3">
          <StatusPill playable={playable} cheapestPlayable={cheapestPlayable} disabled={disabled} />
        </div>
      </motion.button>
    </Tooltip>
  );
}
