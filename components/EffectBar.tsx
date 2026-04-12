"use client";
import React, { useEffect, useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { motion, AnimatePresence } from "framer-motion";

export function EffectBar() {
  const activeEffect = useGameStore((s) => s.activeEffect);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (activeEffect) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
      }, 3000); // Effect duration
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [activeEffect]);

  return (
    <AnimatePresence>
      {show && activeEffect && (
        <motion.div
          initial={{ y: -100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -50, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed top-14 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-md pointer-events-none"
        >
          <div className="relative rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-white/20 bg-slate-900/95 backdrop-blur-xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-purple-600/20 px-4 py-2.5 border-b border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl filter drop-shadow-md">{activeEffect.icon}</span>
                <span className="font-bold text-lg text-amber-100 drop-shadow-md">
                  {activeEffect.cardName}
                </span>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/10 text-white/80 tracking-widest uppercase shadow-inner">
                {activeEffect.type}
              </span>
            </div>
            {/* Body */}
            <div className="p-4 flex flex-col gap-2.5 relative">
              <div className="flex gap-2">
                <span className="text-white/60 font-medium text-sm w-12 flex-shrink-0">Action:</span>
                <span className="text-blue-100 text-sm font-semibold">{activeEffect.action}</span>
              </div>
              <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <div className="flex gap-2 items-start">
                <span className="text-amber-400 mt-0.5 text-sm filter drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]">▶</span>
                <span className="text-amber-200 text-base font-bold drop-shadow-sm leading-tight">
                  {activeEffect.result}
                </span>
              </div>
            </div>
            {/* Ambient inner glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/5 pointer-events-none blur-[2px]" />
            {/* Animated edge highlight */}
            <motion.div
              initial={{ left: "-100%" }}
              animate={{ left: "200%" }}
              transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 }}
              className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
