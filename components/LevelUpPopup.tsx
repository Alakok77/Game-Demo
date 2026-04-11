"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LevelUpResult } from "@/progression/progression";

type Props = {
  levelUps: LevelUpResult[];
  onDismiss: () => void;
};

export function LevelUpPopup({ levelUps, onDismiss }: Props) {
  const [currentIdx, setCurrentIdx] = React.useState(0);
  const current = levelUps[currentIdx];

  if (!current) return null;

  const isLast = currentIdx >= levelUps.length - 1;

  const handleNext = () => {
    if (isLast) {
      onDismiss();
    } else {
      setCurrentIdx((i) => i + 1);
    }
  };

  // Particle stars for visual flair
  const stars = Array.from({ length: 12 }, (_, i) => i);

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) handleNext(); }}
      >
        {/* Floating stars */}
        {stars.map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0.5],
              x: Math.cos((i / stars.length) * Math.PI * 2) * (80 + Math.random() * 80),
              y: Math.sin((i / stars.length) * Math.PI * 2) * (80 + Math.random() * 80),
            }}
            transition={{ duration: 1.4, delay: 0.2 + i * 0.05, ease: "easeOut" }}
            className="pointer-events-none absolute text-yellow-300 text-xl"
          >
            ⭐
          </motion.div>
        ))}

        {/* Main card */}
        <motion.div
          key={`card-${currentIdx}`}
          initial={{ scale: 0.6, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
          className="relative mx-4 w-full max-w-sm overflow-hidden rounded-3xl border border-yellow-500/50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 shadow-[0_0_60px_rgba(251,191,36,0.3),0_32px_80px_rgba(0,0,0,0.6)]"
        >
          {/* Golden glow top bar */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400" />

          {/* Trophy + heading */}
          <div className="text-center">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.15 }}
              className="text-6xl"
            >
              🏆
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="mt-3 text-sm font-semibold uppercase tracking-widest text-amber-400">
                เลเวลอัป!
              </div>
              <div className="mt-1 bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 bg-clip-text text-7xl font-black text-transparent">
                {current.newLevel}
              </div>
              <div className="text-sm text-slate-400">เลเวล {current.newLevel} สำเร็จ!</div>
            </motion.div>
          </div>

          {/* Rewards */}
          {current.rewards.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="mt-6 space-y-2"
            >
              <div className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                รางวัลที่ได้รับ
              </div>
              {current.rewards.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-800/60 px-4 py-3"
                >
                  <span className="text-2xl">{r.icon}</span>
                  <span className="text-sm font-semibold text-white">{r.label}</span>
                </div>
              ))}
            </motion.div>
          )}

          {/* Unlock tier hint */}
          {[3, 4, 5, 8].includes(current.newLevel) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-4 rounded-xl bg-blue-900/40 border border-blue-500/40 px-4 py-3 text-sm text-blue-200"
            >
              {current.newLevel === 3
                ? "⚔️ Hero Cards ปลดล็อกแล้ว! เพิ่มสู่เด็คเพื่อเปิดคอมโบ"
                : current.newLevel === 4
                ? "🆕 Power Cards ใหม่ปลดล็อก! (วาปหนุมาน, หลุมมิติ, และอีกมาก)"
                : current.newLevel === 5
                ? "✨ Legendary Cards ปลดล็อกแล้ว! พลังสูงสุดอยู่ในมือคุณ"
                : "🌟 ปลดล็อกครบทุกใบแล้ว! คุณสำรวจทุกอย่างในเกมนี้"}
            </motion.div>
          )}

          {/* Button */}
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            onClick={handleNext}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 py-3.5 text-base font-extrabold text-slate-900 shadow-[0_0_24px_rgba(251,191,36,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_0_32px_rgba(251,191,36,0.6)] active:scale-95"
          >
            {isLast ? "รับรางวัล! 🎉" : `ถัดไป (${currentIdx + 1}/${levelUps.length})`}
          </motion.button>

          {/* Multi-levelup counter */}
          {levelUps.length > 1 && (
            <div className="mt-3 flex justify-center gap-1.5">
              {levelUps.map((_, i) => (
                <div
                  key={i}
                  className={["h-1.5 w-6 rounded-full transition-colors", i === currentIdx ? "bg-yellow-400" : "bg-slate-700"].join(" ")}
                />
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
