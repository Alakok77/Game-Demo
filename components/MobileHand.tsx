"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Card as CardT, Faction } from "@/game/types";
import { MobileCardModal } from "./MobileCardModal";
import { useGameStore } from "@/store/gameStore";

// ─── Giant thumb-friendly mobile card ─────────────────────────────────────────

function MiniCard({
  card,
  faction,
  selected,
  playable,
  cheapestPlayable,
  disabled,
  onTap,
  onInfo,
}: {
  card: CardT;
  faction: Faction;
  selected: boolean;
  playable: boolean;
  cheapestPlayable: boolean;
  disabled: boolean;
  onTap: () => void;
  onInfo: () => void;
}) {
  const tierBg =
    card.tier === "legendary"
      ? faction === "RAMA"
        ? "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900 via-indigo-950 to-slate-950"
        : "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900 via-rose-950 to-slate-950"
      : card.tier === "hero"
      ? faction === "RAMA"
        ? "bg-gradient-to-b from-blue-900 via-slate-900 to-slate-950"
        : "bg-gradient-to-b from-red-900 via-slate-900 to-slate-950"
      : "bg-gradient-to-br from-slate-800 to-slate-900";

  const border = selected
    ? "border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.5),inset_0_0_15px_rgba(250,204,21,0.2)] ring-1 ring-yellow-300"
    : cheapestPlayable
    ? "border-yellow-500/70 shadow-[0_0_15px_rgba(250,204,21,0.3)]"
    : playable
    ? "border-emerald-500/60 shadow-[0_4px_15px_rgba(16,185,129,0.2)]"
    : "border-slate-700/60 shadow-[0_4px_10px_rgba(0,0,0,0.5)]";

  const opacity = disabled && !selected ? "opacity-50 grayscale-[0.3]" : "";

  // Premium Energy Gem
  const costColor = "bg-gradient-to-br from-amber-400 to-orange-600 border-yellow-200 shadow-[inset_0_1px_3px_rgba(255,255,255,0.6),0_2px_6px_rgba(0,0,0,0.6)] text-white";

  const stripe =
    card.tier === "legendary"
      ? "from-purple-400 via-pink-400 to-purple-500"
      : faction === "RAMA"
      ? "from-blue-400 via-cyan-300 to-blue-500"
      : "from-red-400 via-rose-300 to-red-500";

  // Prevent parent click when clicking info button
  const handleInfoClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    onInfo();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, y: selected ? -12 : 0, scale: selected ? 1.05 : 1 }}
      exit={{ opacity: 0, scale: 0.7 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={() => onTap()}
      className={[
        "relative flex-shrink-0 w-[110px] h-[145px] rounded-2xl border-[3px] overflow-hidden cursor-pointer select-none",
        "transition-transform active:scale-[0.93]",
        tierBg,
        border,
        opacity,
        selected ? "z-20" : "z-10",
      ].join(" ")}
      style={{ touchAction: "manipulation" }}
    >
      {/* Top ambient highlight */}
      <div className="absolute top-0 inset-x-0 h-[100px] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

      {/* Stripe */}
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${stripe} shadow-[0_2px_8px_rgba(0,0,0,0.5)]`} />

      {/* Selected badge */}
      {selected && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-b from-yellow-300 to-amber-500 px-2.5 py-0.5 text-[9px] font-black text-amber-950 leading-none z-30 shadow-[0_2px_6px_rgba(0,0,0,0.6)] border border-yellow-200 tracking-wider">
          ✔ เลือกแล้ว
        </div>
      )}

      {/* Cost gem */}
      <div className={`absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full border-[1.5px] text-xs font-black z-20 ${costColor}`}>
        {card.cost}
      </div>

      {/* Info Button */}
      <div 
        onClick={handleInfoClick}
        onTouchEnd={handleInfoClick}
        className="absolute top-2 left-2 p-1.5 bg-slate-950/60 hover:bg-slate-900 border border-white/20 rounded-full z-20 backdrop-blur-md shadow-lg transition-colors"
      >
        <svg className="w-3.5 h-3.5 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      {/* Icon & Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pt-4 pointer-events-none z-10">
        <div className="relative">
          {card.tier === "legendary" && (
            <div className="absolute inset-0 blur-lg bg-pink-500/50 rounded-full scale-[1.5]" />
          )}
          <div className="text-[42px] drop-shadow-[0_6px_8px_rgba(0,0,0,0.7)] relative z-10">{card.icon ?? "🃏"}</div>
        </div>
        
        <div className="w-full px-1.5 mt-2 text-center text-[11px] font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] leading-tight">
          {card.name}
        </div>
        
        {/* Tier text strictly for hero/leg */}
        {card.tier !== "basic" && (
          <div className="px-2 py-0.5 mt-0.5 rounded border border-white/10 bg-black/60 shadow-inner text-[8px] font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500">
            {card.tier === "legendary" ? "LEGENDARY" : "HERO"}
          </div>
        )}
      </div>

      {/* Playable pulse */}
      {cheapestPlayable && !selected && (
        <div className="pointer-events-none absolute inset-0 rounded-xl bg-yellow-400/10 animate-pulse" />
      )}
    </motion.div>
  );
}

// ─── Mobile Hand ──────────────────────────────────────────────────────────────

export function MobileHand() {
  const human          = useGameStore((s) => s.human);
  const phase          = useGameStore((s) => s.phase);
  const active         = useGameStore((s) => s.active);
  const selectedCardId = useGameStore((s) => s.selectedCardId);
  const selectCard     = useGameStore((s) => s.selectCard);

  const [modalCard, setModalCard] = React.useState<CardT | null>(null);

  const playableCards = human.hand.filter((c) => c.cost <= human.energy);
  const cheapestCost  = playableCards.length
    ? Math.min(...playableCards.map((c) => c.cost))
    : undefined;

  const canPlay = phase === "player" && active === "HUMAN";

  function handleTap(card: CardT) {
    if (!canPlay) return;
    // Toggle selection
    selectCard(selectedCardId === card.id ? undefined : card.id);
  }

  return (
    <>
      <div
        className="flex items-center gap-3 overflow-x-auto px-4 py-3 h-[165px]"
        style={{
          overscrollBehaviorX: "contain",
          WebkitOverflowScrolling: "touch",
          scrollSnapType: "x mandatory",
        }}
      >
        <AnimatePresence>
          {human.hand.map((card) => {
            const isSelected       = selectedCardId === card.id;
            const isPlayable       = canPlay && card.cost <= human.energy;
            const isCheapest       = isPlayable && card.cost === cheapestCost;
            const isDisabled       = !canPlay || card.cost > human.energy;

            return (
              <div key={card.id} style={{ scrollSnapAlign: "center" }}>
                <MiniCard
                  card={card}
                  faction={human.faction}
                  selected={isSelected}
                  playable={isPlayable}
                  cheapestPlayable={isCheapest}
                  disabled={isDisabled}
                  onTap={() => handleTap(card)}
                  onInfo={() => setModalCard(card)}
                />
              </div>
            );
          })}
        </AnimatePresence>

        {human.hand.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-500 font-bold bg-slate-900/50 rounded-2xl h-full border border-dashed border-slate-700">
            ไม่มีการ์ดในมือแล้ว! 🃏
          </div>
        )}
      </div>

      {/* Card detail modal */}
      <AnimatePresence>
        {modalCard && (
          <MobileCardModal
            key={modalCard.id}
            card={modalCard}
            faction={human.faction}
            isSelected={selectedCardId === modalCard.id}
            canPlay={canPlay && modalCard.cost <= human.energy}
            disabled={!canPlay || modalCard.cost > human.energy}
            onClose={() => setModalCard(null)}
            onSelect={() => {
              if (canPlay) selectCard(selectedCardId === modalCard.id ? undefined : modalCard.id);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
