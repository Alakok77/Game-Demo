"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Card, Faction } from "@/game/types";

function tierLabel(tier?: string) {
  if (tier === "legendary") return { label: "✨ ตำนาน", cls: "bg-purple-500/30 text-purple-200 ring-1 ring-purple-400/50" };
  if (tier === "hero")      return { label: "⚔️ ฮีโร่",  cls: "bg-amber-500/20 text-yellow-200 ring-1 ring-yellow-400/40" };
  return { label: "พื้นฐาน", cls: "bg-slate-700/60 text-slate-300 ring-1 ring-slate-500/30" };
}

function factionColor(faction: Faction) {
  return faction === "RAMA" ? "from-blue-900 via-slate-900 to-slate-950" : "from-red-900 via-slate-900 to-slate-950";
}

function factionBorder(faction: Faction) {
  return faction === "RAMA" ? "border-blue-500/50" : "border-red-500/50";
}

function costGem(cost: number, faction: Faction) {
  const cls = faction === "RAMA"
    ? "border-yellow-400 bg-gradient-to-br from-yellow-400 to-amber-600 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
    : "border-red-400 bg-gradient-to-br from-red-500 to-rose-700 shadow-[0_0_10px_rgba(239,68,68,0.5)]";
  return (
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-base font-black text-white ${cls}`}>
      {cost}
    </div>
  );
}

export function MobileCardModal({
  card,
  faction,
  onClose,
  onSelect,
  isSelected,
  canPlay,
  disabled,
}: {
  card: Card;
  faction: Faction;
  onClose: () => void;
  onSelect: () => void;
  isSelected: boolean;
  canPlay: boolean;
  disabled: boolean;
}) {
  const tier = tierLabel(card.tier);
  const gradientBg = factionColor(faction);
  const border = factionBorder(faction);

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <motion.div
        key="sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className={[
          "fixed inset-x-0 bottom-0 z-50",
          "rounded-t-3xl border-t-2",
          `bg-gradient-to-b ${gradientBg}`,
          border,
          "shadow-[0_-12px_60px_rgba(0,0,0,0.7)]",
        ].join(" ")}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-600" />
        </div>

        {/* Header row */}
        <div className="flex items-start justify-between gap-3 px-5 pt-2 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl leading-none drop-shadow-lg">{card.icon ?? "🃏"}</span>
            <div>
              <div className="text-lg font-black text-white leading-tight">{card.name}</div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${tier.cls}`}>
                  {tier.label}
                </span>
                <span className="rounded-md bg-slate-700/60 px-2 py-0.5 text-[10px] font-semibold text-slate-300 ring-1 ring-slate-500/30">
                  {card.type === "skill" ? "✨ สกิล" : "👤 ยูนิต"}
                </span>
              </div>
            </div>
          </div>
          {costGem(card.cost, faction)}
        </div>

        {/* Divider */}
        <div className="mx-5 border-t border-white/10" />

        {/* Body */}
        <div className="px-5 pt-3 pb-4 space-y-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
              {card.type === "skill" ? "✨ ความสามารถ" : "👤 รายละเอียด"}
            </div>
            <p className="text-sm leading-relaxed text-slate-200">
              {card.description}
            </p>
          </div>

          {card.ability && card.ability !== "ไม่มีความสามารถพิเศษ" && (
            <div className="rounded-xl bg-slate-800/80 border border-slate-700/60 px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1">⚡ ความสามารถพิเศษ</div>
              <p className="text-sm text-amber-200 font-semibold leading-relaxed">{card.ability}</p>
            </div>
          )}

          {/* Status badge */}
          {disabled && (
            <div className="rounded-xl bg-slate-700/50 border border-slate-600/50 px-4 py-2 text-center text-sm text-slate-400 font-semibold">
              🔒 พลังงานไม่พอ (ต้องการ ⚡{card.cost})
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 text-sm font-semibold active:scale-95 transition-transform"
          >
            ปิด
          </button>
          <button
            onClick={() => { onSelect(); onClose(); }}
            disabled={disabled}
            className={[
              "flex-[2] py-3.5 rounded-2xl text-sm font-black transition-all active:scale-95 text-white",
              isSelected
                ? "bg-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)]"
                : canPlay
                ? "bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                : "bg-slate-700 opacity-50 cursor-not-allowed",
            ].join(" ")}
          >
            {isSelected ? "✔ กำลังเลือกอยู่" : disabled ? "🔒 พลังงานไม่พอ" : "🎯 เลือกการ์ดนี้"}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
