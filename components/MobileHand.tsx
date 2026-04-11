"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Card as CardT, Faction } from "@/game/types";
import { MobileCardModal } from "./MobileCardModal";
import { useGameStore } from "@/store/gameStore";

// ─── Mini card thumbnail for the hand strip ───────────────────────────────────

function MiniCard({
  card,
  faction,
  selected,
  playable,
  cheapestPlayable,
  disabled,
  onTap,
  onLongPress,
}: {
  card: CardT;
  faction: Faction;
  selected: boolean;
  playable: boolean;
  cheapestPlayable: boolean;
  disabled: boolean;
  onTap: () => void;
  onLongPress: () => void;
}) {
  // Long-press detection
  const pressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = React.useRef(false);

  function handleTouchStart() {
    didLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      onLongPress();
    }, 420);
  }

  function handleTouchEnd() {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    if (!didLongPress.current) onTap();
  }

  function handleTouchMove() {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  }

  // Tier colours
  const tierBg =
    card.tier === "legendary"
      ? faction === "RAMA"
        ? "bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950"
        : "bg-gradient-to-b from-red-950 via-purple-950 to-slate-950"
      : card.tier === "hero"
      ? faction === "RAMA"
        ? "bg-gradient-to-b from-blue-950 via-slate-900 to-slate-950"
        : "bg-gradient-to-b from-red-950 via-slate-900 to-slate-950"
      : "bg-gradient-to-b from-slate-800 to-slate-950";

  const border = selected
    ? "border-yellow-400 shadow-[0_0_18px_rgba(250,204,21,0.65)] ring-2 ring-yellow-400"
    : cheapestPlayable
    ? "border-yellow-400/80 shadow-[0_0_12px_rgba(250,204,21,0.45)]"
    : playable
    ? "border-green-400/60 shadow-[0_0_10px_rgba(52,211,153,0.35)]"
    : "border-slate-600/50";

  const opacity = disabled && !selected ? "opacity-40" : "";

  const costColor = faction === "RAMA"
    ? "bg-gradient-to-br from-yellow-400 to-amber-600 border-yellow-400"
    : "bg-gradient-to-br from-red-500 to-rose-700 border-red-400";

  // Top stripe colour
  const stripe =
    card.tier === "legendary"
      ? "from-purple-500 via-violet-400 to-purple-600"
      : faction === "RAMA"
      ? "from-blue-500 via-indigo-400 to-blue-600"
      : "from-red-500 via-rose-400 to-red-600";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.85 }}
      animate={{ opacity: 1, y: selected ? -8 : 0, scale: selected ? 1.06 : 1 }}
      exit={{ opacity: 0, scale: 0.7 }}
      transition={{ duration: 0.18 }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onClick={() => { if (!('ontouchstart' in window)) onTap(); }}
      className={[
        "relative flex-shrink-0 w-[80px] h-[110px] rounded-xl border-2 overflow-hidden cursor-pointer select-none",
        "transition-transform duration-150 active:scale-95",
        tierBg,
        border,
        opacity,
        selected ? "z-20" : "z-10",
      ].join(" ")}
      style={{ touchAction: "manipulation" }}
    >
      {/* Stripe */}
      <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${stripe}`} />

      {/* Selected badge */}
      {selected && (
        <div className="absolute top-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-yellow-400 px-1.5 py-0.5 text-[8px] font-black text-slate-900 leading-none z-10">
          ✔
        </div>
      )}

      {/* Cost gem */}
      <div className={`absolute top-2 right-1.5 flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-black text-white ${costColor}`}>
        {card.cost}
      </div>

      {/* Icon */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 pt-2">
        <div className="text-2xl leading-none drop-shadow-lg">{card.icon ?? "🃏"}</div>
        <div className="mt-1 w-full px-1 text-center text-[9px] font-bold text-white line-clamp-2 leading-tight">
          {card.name}
        </div>
      </div>

      {/* Playable pulse */}
      {cheapestPlayable && !selected && (
        <div className="pointer-events-none absolute inset-0 rounded-xl bg-yellow-400/10 animate-playable-pulse" />
      )}

      {/* Info hint */}
      <div className="absolute bottom-1 right-1 text-[8px] text-slate-500 leading-none select-none">
        ℹ
      </div>
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

  function handleLongPress(card: CardT) {
    setModalCard(card);
  }

  return (
    <>
      {/* Hand strip */}
      <div
        className="flex items-center gap-2 overflow-x-auto px-3 py-2 h-full"
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
              <div key={card.id} style={{ scrollSnapAlign: "start" }}>
                <MiniCard
                  card={card}
                  faction={human.faction}
                  selected={isSelected}
                  playable={isPlayable}
                  cheapestPlayable={isCheapest}
                  disabled={isDisabled}
                  onTap={() => handleTap(card)}
                  onLongPress={() => handleLongPress(card)}
                />
              </div>
            );
          })}
        </AnimatePresence>

        {human.hand.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-600 font-semibold">
            ไม่มีการ์ดในมือ
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
