"use client";

import * as React from "react";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import type { Faction } from "@/game/types";
import { useGameStore } from "@/store/gameStore";

function FactionSelectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tutorial = searchParams.get("tutorial") === "1";

  const stored = useGameStore((s) => s.playerFaction);
  const setPlayerFaction = useGameStore((s) => s.setPlayerFaction);
  const startGame = useGameStore((s) => s.startGame);
  const beginTutorialWithCurrentFaction = useGameStore((s) => s.beginTutorialWithCurrentFaction);

  const [choice, setChoice] = React.useState<Faction>(stored ?? "RAMA");

  React.useEffect(() => {
    setChoice(stored ?? "RAMA");
  }, [stored]);

  const select = (f: Faction) => {
    setChoice(f);
    setPlayerFaction(f);
  };

  const handleStart = () => {
    setPlayerFaction(choice);
    if (tutorial) beginTutorialWithCurrentFaction();
    else startGame();
    router.push("/game");
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col">
      <Navigation />
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-4 sm:py-6 pb-safe">
        <h1 className="mb-4 sm:mb-8 text-center text-xl sm:text-2xl font-black tracking-tight text-white md:text-3xl drop-shadow-md">เลือกฝ่ายของคุณ</h1>

        <div className="grid w-full max-w-3xl gap-3 sm:gap-6 md:grid-cols-2">
          <motion.button
            type="button"
            onClick={() => select("RAMA")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={[
              "relative flex flex-col rounded-2xl border-2 p-4 sm:p-6 text-left text-white shadow-lg transition",
              "bg-gradient-to-br from-blue-950/80 via-slate-900 to-amber-950/30",
              choice === "RAMA"
                ? "border-amber-300/90 shadow-[0_0_24px_rgba(250,204,21,0.45)] ring-2 ring-amber-200/50"
                : "border-blue-500/40 hover:border-blue-400/70",
            ].join(" ")}
          >
            <div className="text-2xl sm:text-3xl drop-shadow-md">🏹✨</div>
            <div className="mt-2 text-base sm:text-lg font-black text-amber-100/95 leading-tight">ฝ่ายพระราม</div>
            <div className="mt-1 sm:mt-2 text-xs sm:text-sm leading-relaxed text-blue-100/85">
              เน้นการเชื่อมพื้นที่ คล่องตัว วางหมากเร็ว
            </div>
            <div className="mt-2 sm:mt-4 text-[10px] sm:text-xs font-bold text-blue-300/80 uppercase">สี: น้ำเงิน · ทอง</div>
          </motion.button>

          <motion.button
            type="button"
            onClick={() => select("LANKA")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={[
              "relative flex flex-col rounded-2xl border-2 p-4 sm:p-6 text-left text-white shadow-lg transition",
              "bg-gradient-to-br from-red-950/80 via-purple-950/50 to-slate-900",
              choice === "LANKA"
                ? "border-fuchsia-400/90 shadow-[0_0_24px_rgba(217,70,239,0.45)] ring-2 ring-fuchsia-300/45"
                : "border-red-500/35 hover:border-red-400/65",
            ].join(" ")}
          >
            <div className="text-2xl sm:text-3xl drop-shadow-md">👹🔥</div>
            <div className="mt-2 text-base sm:text-lg font-black text-fuchsia-100 leading-tight">ฝ่ายลงกา</div>
            <div className="mt-1 sm:mt-2 text-xs sm:text-sm leading-relaxed text-red-100/85">เน้นป้องกัน แข็งแกร่ง คุมพื้นที่แน่น</div>
            <div className="mt-2 sm:mt-4 text-[10px] sm:text-xs font-bold text-fuchsia-300/80 uppercase">สี: แดง · ม่วง</div>
          </motion.button>
        </div>

        <motion.div className="mt-6 sm:mt-10" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}>
          <button
            type="button"
            onClick={handleStart}
            className="rounded-2xl bg-gradient-to-b from-emerald-500 to-teal-700 px-12 py-3.5 text-base font-black text-white shadow-[0_4px_20px_rgba(16,185,129,0.4)] hover:brightness-110 active:scale-95 transition-all"
          >
            🚀 เริ่มเกม
          </button>
        </motion.div>

        {tutorial ? <p className="mt-4 text-center text-xs text-slate-400">จะเปิดวิธีเล่นก่อนเริ่มตาจริง</p> : null}
      </div>
    </div>
  );
}

export default function SelectFactionPage() {
  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-slate-900 to-slate-800 p-4 text-white">
      <Suspense
        fallback={
          <div className="mx-auto flex h-full max-w-4xl items-center justify-center">
            <div className="text-sm text-slate-400">กำลังโหลด...</div>
          </div>
        }
      >
        <FactionSelectInner />
      </Suspense>
    </div>
  );
}
