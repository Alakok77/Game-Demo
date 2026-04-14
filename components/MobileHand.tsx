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
    : playable
    ? "border-emerald-500/60 shadow-[0_4px_15px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500/20"
    : "border-slate-800/80 shadow-[0_4px_10px_rgba(0,0,0,0.5)]";

  const opacity = disabled && !selected ? "opacity-60 grayscale-[0.8] brightness-[0.7]" : "";

  // Premium Energy Gem - Dynamic Color
  const costColor = playable || selected
    ? "bg-gradient-to-br from-amber-400 to-orange-600 border-yellow-200 shadow-[inset_0_1px_3px_rgba(255,255,255,0.6),0_2px_6px_rgba(0,0,0,0.6)] text-white"
    : "bg-slate-700 border-slate-600 shadow-inner text-slate-400";

  const stripe =
    card.tier === "legendary"
      ? "from-purple-400 via-pink-400 to-purple-500"
      : faction === "RAMA"
      ? "from-blue-400 via-cyan-300 to-blue-500"
      : "from-red-400 via-rose-300 to-red-500";

  // Prevent parent click when clicking info button
  const mountTime = React.useRef(Date.now());
  const handleInfoClick = (e: React.MouseEvent | React.TouchEvent) => {
    // Mounting guard: ignore clicks within 500ms of mount to prevent ghost clicks from previous screen 
    if (Date.now() - mountTime.current < 500) return;

    if (e.cancelable) e.preventDefault();
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
        "transition-all active:scale-[0.93]",
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

      {/* Disabled Overlay Icon */}
      {disabled && !selected && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-20 pointer-events-none">
          <div className="p-1.5 rounded-full bg-slate-900/60 border border-white/10 shadow-lg">
             <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
             </svg>
          </div>
        </div>
      )}

      {/* Cost gem */}
      <div className={`absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full border-[1.5px] text-xs font-black z-30 transition-colors ${costColor}`}>
        {card.cost}
      </div>

      {/* Info Button (Small circular) */}
      <div 
        onClick={handleInfoClick}
        className="absolute top-1.5 left-1.5 size-7 flex items-center justify-center bg-slate-900/80 border border-white/20 rounded-full z-30 shadow-lg active:scale-90 transition-transform"
      >
        <svg className="w-4 h-4 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      {/* Icon & Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-start gap-0.5 pt-5 pointer-events-none z-10">
        <div className="relative h-10 flex items-center justify-center shrink-0">
          {card.tier === "legendary" && (
            <div className="absolute inset-x-[-30%] inset-y-[-30%] blur-xl bg-indigo-500/15 rounded-full animate-pulse" />
          )}
          {card.image ? (
            <img 
              src={card.image} 
              alt={card.name} 
              className="h-9 w-auto object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] relative z-10"
            />
          ) : (
            <div className="text-[28px] drop-shadow-[0_4px_8px_rgba(0,0,0,0.7)] relative z-10">{card.icon ?? "🃏"}</div>
          )}
        </div>
        
        <div className="w-full px-1 text-center text-[9.5px] font-black tracking-tight text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] leading-[1.1] min-h-[22px] max-h-[26px] flex items-center justify-center line-clamp-2 shrink-0">
          {card.name}
        </div>

        {/* Ability Summary — with more compact vertical budget */}
        <div className="w-[92%] mt-0.5 shrink-0">
           <div className="py-0.5 px-1 rounded-lg bg-black/50 border border-white/5 shadow-inner min-h-[28px] flex items-center justify-center">
             <span className="text-[9px] font-bold text-blue-100 leading-[1.1] line-clamp-2 text-center block">
                {card.ability?.result || (card.description.length > 25 ? card.description.slice(0, 22) + "..." : card.description)}
             </span>
           </div>
        </div>
        
        {/* Tier text strictly for hero/leg */}
        {card.tier !== "basic" && (
          <div className="px-1.5 py-0.5 mt-0.5 rounded-full border border-white/10 bg-black/40 text-[7px] font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500">
            {card.tier === "legendary" ? "LEGEND" : "HERO"}
          </div>
        )}
      </div>

      {/* Playable pulse */}
      {cheapestPlayable && !selected && (
        <div className="pointer-events-none absolute inset-0 rounded-xl bg-emerald-400/10 animate-pulse" />
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
        className="flex items-center gap-2 overflow-x-auto px-4 py-3 h-[180px]"
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
