"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "./Card";
import { useGameStore } from "@/store/gameStore";

export function Hand() {
  const human          = useGameStore((s) => s.human);
  const phase          = useGameStore((s) => s.phase);
  const active         = useGameStore((s) => s.active);
  const selectedCardId = useGameStore((s) => s.selectedCardId);
  const selectCard     = useGameStore((s) => s.selectCard);

  const playableCards = human.hand.filter((c) => c.cost <= human.energy);
  const cheapestPlayableCost = playableCards.length
    ? Math.min(...playableCards.map((c) => c.cost))
    : undefined;

  const canPlay = phase === "player" && active === "HUMAN";

  return (
    /* Outer: fill the hand zone, allow horizontal scroll when cards overflow */
    <div className="w-full h-full flex items-end justify-center overflow-x-auto overflow-y-hidden px-2 pb-2">
      {/* Inner: fanned/overlapping cards centred, no-wrap */}
      <div className="flex items-end flex-nowrap flex-shrink-0 mx-auto">
        <AnimatePresence>
          {human.hand.map((c, i) => {
            const isSelected = selectedCardId === c.id;

            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 50, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2, delay: i * 0.04 }}
                onClick={() => canPlay && selectCard(selectedCardId === c.id ? undefined : c.id)}
                /* Fan: negative left margin for visual overlap except first card */
                className={[
                  "relative flex-shrink-0 cursor-pointer",
                  "transition-transform duration-150 origin-bottom",
                  i === 0 ? "ml-0" : "-ml-8 sm:-ml-6",
                  isSelected ? "-translate-y-5 z-20" : "hover:-translate-y-4 hover:z-20 z-0",
                ].join(" ")}
                style={{ width: 88, height: 128 }}
              >
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 origin-bottom scale-[0.62] drop-shadow-xl">
                  <Card
                    card={c}
                    faction={human.faction}
                    selected={isSelected}
                    disabled={!canPlay || c.cost > human.energy}
                    playable={canPlay && c.cost <= human.energy}
                    cheapestPlayable={
                      canPlay &&
                      c.cost <= human.energy &&
                      c.cost === cheapestPlayableCost
                    }
                    disableHover
                    onClick={() => {}}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
