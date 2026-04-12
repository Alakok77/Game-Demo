"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Card, Faction } from "@/game/types";

function tierLabel(tier?: string) {
  if (tier === "legendary") return { label: "✨ ตำนาน", cls: "bg-purple-500/30 text-purple-200 ring-1 ring-purple-400/50" };
  if (tier === "hero")      return { label: "⚔️ ฮีโร่",  cls: "bg-amber-500/20 text-yellow-200 ring-1 ring-yellow-400/40" };
  return { label: "พื้นฐาน", cls: "bg-slate-700/60 text-slate-300 ring-1 ring-slate-500/30" };
}

function factionColor(faction: Faction) {
  return faction === "RAMA" ? "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900 via-slate-900 to-slate-950" : "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900 via-slate-900 to-slate-950";
}

function factionBorder(faction: Faction) {
  return faction === "RAMA" ? "border-blue-500/50" : "border-red-500/50";
}

function costGem(cost: number, faction: Faction) {
  const cls = "bg-gradient-to-br from-amber-400 to-orange-600 border-yellow-200 shadow-[inset_0_1px_3px_rgba(255,255,255,0.6),0_2px_6px_rgba(0,0,0,0.6)] text-white";
  return (
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-xl font-black z-20 ${cls}`}>
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
          "rounded-t-[32px] border-t border-white/20",
          gradientBg,
          border,
          "shadow-[0_-5px_40px_rgba(0,0,0,0.8),inset_0_2px_10px_rgba(255,255,255,0.1)]",
        ].join(" ")}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-600" />
        </div>

        {/* Header row */}
        <div className="flex items-start justify-between gap-3 px-6 pt-2 pb-3">
          <div className="flex items-center gap-4">
            <div className="relative">
              {card.tier === "legendary" && (
                <div className="absolute inset-0 blur-lg bg-pink-500/40 rounded-full scale-[1.3]" />
              )}
              <span className="text-[44px] leading-none drop-shadow-[0_4px_6px_rgba(0,0,0,0.7)] relative z-10">{card.icon ?? "🃏"}</span>
            </div>
            <div>
              <div className="text-xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-200 drop-shadow-md leading-tight">{card.name}</div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${tier.cls}`}>
                  {tier.label}
                </span>
                <span className="rounded-md bg-slate-800/80 px-2 py-0.5 text-[10px] font-semibold text-slate-300 ring-1 ring-white/10 shadow-inner">
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

          {card.ability && card.ability.action !== "ไม่มี" && (
            <div className="rounded-xl bg-slate-800/80 border border-slate-700/60 px-4 py-3 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1">⚡ ความสามารถพิเศษ</div>
              <p className="text-sm text-yellow-300 font-semibold leading-relaxed">
                <span className="text-yellow-500 mr-1">[{card.ability.trigger}]</span>
                {card.ability.action} ➔ {card.ability.result}
              </p>
              <div className="flex gap-2 text-[10px] text-slate-400 border-t border-slate-700/50 pt-2 mt-2">
                <span>UI: {card.ability.ui}</span>
                <span>FX: {card.ability.animation}</span>
              </div>
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
