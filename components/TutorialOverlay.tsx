"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "@/store/gameStore";

const steps = [
  {
    title: "1) เป้าหมายคือคุมพื้นที่",
    body: "ช่องว่างที่ถูกล้อมครบโดยฝ่ายเดียว จะนับเป็นพื้นที่ คะแนนรวม = พื้นที่ + ยึดได้",
  },
  {
    title: "2) ยูนิตต้องมีช่องหายใจ",
    body: "ยูนิตและกลุ่มที่เชื่อมกัน ต้องมีช่องว่างติดกันอย่างน้อย 1 ช่อง ถ้าไม่มีจะถูกยึด",
  },
  {
    title: "3) เล่นการ์ดเพื่อทำแอ็กชัน",
    body: "แต่ละเทิร์นเล่นได้ 1-2 ใบ การ์ดยูนิตใช้วางตัว การ์ดสกิลใช้เปลี่ยนสถานการณ์บนกระดาน",
  },
  {
    title: "4) ชี้เมาส์เพื่อดูพรีวิว",
    body: "ชี้ที่ช่องเพื่อดูว่าวางได้ไหม จะยึดได้หรือไม่ และคะแนนจะเปลี่ยนเท่าไร",
  },
  {
    title: "5) ข้ามเทิร์นเพื่อจบเกม",
    body: "ถ้าทั้งสองฝ่ายข้ามเทิร์นติดกัน เกมจะจบและตัดสินด้วยคะแนนรวม",
  },
];

export function TutorialOverlay() {
  const phase = useGameStore((s) => s.phase);
  const step = useGameStore((s) => s.tutorialStep);
  const next = useGameStore((s) => s.nextTutorial);
  const prev = useGameStore((s) => s.prevTutorial);
  const startGame = useGameStore((s) => s.startGame);
  const startMenu = useGameStore((s) => s.startMenu);

  const s = steps[Math.min(steps.length - 1, step)]!;
  const done = step >= steps.length - 1;

  return (
    <AnimatePresence>
      {phase === "tutorial" ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur"
        >
          <motion.div
            initial={{ y: 18, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 18, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950/90 p-5 text-white shadow-[0_30px_90px_rgba(0,0,0,0.55)]"
          >
            <div className="text-sm font-semibold text-white/90">วิธีเล่น</div>
            <div className="mt-2 text-lg font-semibold">{s.title}</div>
            <div className="mt-2 text-sm text-white/75">{s.body}</div>
            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                onClick={() => startMenu()}
                className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/90 hover:bg-white/15"
              >
                ปิด
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => prev()}
                  disabled={step === 0}
                  className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/90 hover:bg-white/15 disabled:opacity-40"
                >
                  ย้อนกลับ
                </button>
                {done ? (
                  <button
                    onClick={() => startGame()}
                    className="rounded-full bg-[#ffd56a]/15 px-4 py-2 text-xs font-semibold text-[#ffe7a8] ring-1 ring-[#ffd56a]/30 hover:bg-[#ffd56a]/20"
                  >
                    เล่นกับ AI
                  </button>
                ) : (
                  <button
                    onClick={() => next()}
                    className="rounded-full bg-[#ffd56a]/15 px-4 py-2 text-xs font-semibold text-[#ffe7a8] ring-1 ring-[#ffd56a]/30 hover:bg-[#ffd56a]/20"
                  >
                    ถัดไป
                  </button>
                )}
              </div>
            </div>
            <div className="mt-3 text-xs text-white/50">
              ขั้นตอน {step + 1} / {steps.length}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

