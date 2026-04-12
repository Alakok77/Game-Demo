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
        ? "bg-gradient-to-b from-indigo-950 via-purple-900 to-slate-950"
        : "bg-gradient-to-b from-red-950 via-purple-900 to-slate-950"
      : card.tier === "hero"
      ? faction === "RAMA"
        ? "bg-gradient-to-b from-blue-950 via-slate-800 to-slate-950"
        : "bg-gradient-to-b from-red-950 via-slate-800 to-slate-950"
      : "bg-gradient-to-b from-slate-800 to-slate-950";

  const border = selected
    ? "border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)] ring-2 ring-yellow-400"
    : cheapestPlayable
    ? "border-yellow-500/80 shadow-[0_0_12px_rgba(250,204,21,0.3)]"
    : playable
    ? "border-emerald-500/70 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
    : "border-slate-700/60";

  const opacity = disabled && !selected ? "opacity-50" : "";

  const costColor = faction === "RAMA"
    ? "bg-gradient-to-br from-yellow-400 to-amber-600 border-yellow-400"
    : "bg-gradient-to-br from-red-500 to-rose-700 border-red-400";

  const stripe =
    card.tier === "legendary"
      ? "from-purple-400 via-violet-300 to-purple-500"
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
      animate={{ opacity: 1, y: selected ? -10 : 0, scale: selected ? 1.05 : 1 }}
      exit={{ opacity: 0, scale: 0.7 }}
      transition={{ duration: 0.2 }}
      onClick={() => onTap()}
      className={[
        "relative flex-shrink-0 w-[110px] h-[145px] rounded-2xl border-[3px] overflow-hidden cursor-pointer select-none",
        "transition-transform active:scale-95",
        tierBg,
        border,
        opacity,
        selected ? "z-20" : "z-10",
      ].join(" ")}
      style={{ touchAction: "manipulation" }}
    >
      {/* Stripe */}
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${stripe}`} />

      {/* Selected badge */}
      {selected && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-yellow-400 px-2 py-0.5 text-[9px] font-black text-slate-900 leading-none z-10 shadow-md">
          ✔ กำลังเลือก
        </div>
      )}

      {/* Cost gem */}
      <div className={`absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full border text-xs font-black text-white shadow-xl ${costColor}`}>
        {card.cost}
      </div>

      {/* Info Button - Huge tap target! */}
      <div 
        onClick={handleInfoClick}
        onTouchEnd={handleInfoClick}
        className="absolute top-1 left-1.5 p-2 bg-black/40 hover:bg-black/60 rounded-full z-20 backdrop-blur-sm"
      >
        <span className="text-white text-[12px] leading-none block font-mono">ℹ️</span>
      </div>

      {/* Icon & Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pt-4 pointer-events-none">
        <div className="text-4xl drop-shadow-xl">{card.icon ?? "🃏"}</div>
        <div className="w-full px-2 mt-2 text-center text-[11px] font-extrabold text-white leading-tight drop-shadow-md">
          {card.name}
        </div>
        
        {/* Tier text strictly for hero/leg */}
        {card.tier !== "basic" && (
          <div className="px-2 py-0.5 mt-1 rounded bg-black/50 text-[8px] font-bold text-slate-300">
            {card.tier === "legendary" ? "✨ LEGENDARY" : "⚔️ HERO"}
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
