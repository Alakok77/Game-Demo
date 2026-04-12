"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import { LevelUpPopup } from "@/components/LevelUpPopup";
import { useGameStore } from "@/store/gameStore";
import { humanPanelShellClasses, aiPanelShellClasses, humanPlayerLabel, aiPlayerLabel } from "@/lib/factionUi";
import {
  loadProfile,
  saveProfile,
  calcMatchExp,
  calcMatchCoins,
  applyMatchRewards,
  expProgress,
  type LevelUpResult,
  type PlayerProfile,
  type MatchExpResult,
} from "@/progression/progression";
import { getRewardsForLevel } from "@/progression/rewards";

// ─── Small EXP progress bar ───────────────────────────────────────────────────

function MiniExpBar({ pct, animated }: { pct: number; animated?: boolean }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!animated) { setWidth(pct); return; }
    const t = window.setTimeout(() => setWidth(pct), 600);
    return () => window.clearTimeout(t);
  }, [pct, animated]);
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-700/80">
      <div
        className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 shadow-[0_0_10px_rgba(251,191,36,0.5)] transition-all duration-1200 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

// ─── EXP Row ─────────────────────────────────────────────────────────────────

function ExpRow({ icon, label, amount, delay = 0 }: { icon: string; label: string; amount: number; delay?: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), delay);
    return () => window.clearTimeout(t);
  }, [delay]);
  if (!visible) return null;
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between gap-2 text-sm"
    >
      <span className="flex items-center gap-2 text-slate-300">
        <span>{icon}</span>
        <span>{label}</span>
      </span>
      <span className="font-bold text-emerald-300">+{amount} EXP</span>
    </motion.div>
  );
}

// ─── Winner banner classes ────────────────────────────────────────────────────

function winnerBannerClasses(result: "win" | "lose" | "draw") {
  if (result === "win") return "from-blue-900/80 via-indigo-900/60 to-slate-900";
  if (result === "lose") return "from-rose-900/60 via-slate-900 to-slate-900";
  return "from-slate-800 to-slate-900";
}

// ─── Result Page ─────────────────────────────────────────────────────────────

export default function ResultPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Game store
  const scores = useGameStore((s) => s.scores);
  const human = useGameStore((s) => s.human);
  const ai = useGameStore((s) => s.ai);
  const gameOverReason = useGameStore((s) => s.gameOverReason);
  const comboState = useGameStore((s) => s.comboState);

  // Progression state
  const [expResult, setExpResult] = useState<MatchExpResult | null>(null);
  const [coinsGained, setCoinsGained] = useState(0);
  const [oldProfile, setOldProfile] = useState<PlayerProfile | null>(null);
  const [newProfile, setNewProfile] = useState<PlayerProfile | null>(null);
  const [levelUps, setLevelUps] = useState<LevelUpResult[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const appliedRef = useRef(false);

  const winner =
    scores.total[human.faction] === scores.total[ai.faction]
      ? "draw"
      : scores.total[human.faction] > scores.total[ai.faction]
      ? "win"
      : "lose";

  useEffect(() => { setMounted(true); }, []);

  // Apply match rewards once on mount
  useEffect(() => {
    if (!mounted || appliedRef.current) return;
    appliedRef.current = true;

    const profile = loadProfile();
    const expCalc = calcMatchExp({
      won: winner === "win",
      captures: scores.captures[human.faction],
      territory: scores.territory[human.faction],
      comboCount: comboState?.totalCombosThisGame ?? 0,
    });
    const coins = calcMatchCoins(winner === "win", comboState?.totalCombosThisGame ?? 0);

    const { newProfile, levelUps } = applyMatchRewards(profile, expCalc.total, coins, getRewardsForLevel);

    setOldProfile(profile);
    setNewProfile(newProfile);
    setExpResult(expCalc);
    setCoinsGained(coins);
    setLevelUps(levelUps);
    saveProfile(newProfile);

    if (levelUps.length > 0) {
      window.setTimeout(() => setShowLevelUp(true), 2000);
    }
  }, [mounted, winner, scores, human.faction]);

  if (!mounted) {
    return (
      <div className="h-screen overflow-hidden bg-gradient-to-b from-slate-900 to-slate-800 p-4 text-white">
        <div className="mx-auto h-full w-full max-w-6xl">
          <Navigation />
          <div className="flex h-[calc(100%-56px)] items-center justify-center rounded-xl border border-slate-600 bg-slate-900/80">
            <div className="text-sm text-slate-300">กำลังโหลดผลเกม...</div>
          </div>
        </div>
      </div>
    );
  }

  const winnerLabel =
    winner === "win" ? "คุณชนะ! 🎉" : winner === "lose" ? "AI ชนะ 🤖" : "เสมอ 🤝";

  const newProg = newProfile ? expProgress(newProfile.totalExp) : null;
  const oldProg = oldProfile ? expProgress(oldProfile.totalExp) : null;

  // Pick start & end percentages for EXP bar animation
  // If leveled up, just show 0→newPct (bar resets at level boundary)
  const barStartPct = levelUps.length > 0 ? 0 : (oldProg ? Math.round((oldProg.current / oldProg.needed) * 100) : 0);
  const barEndPct = newProg ? Math.round((newProg.current / newProg.needed) * 100) : 0;

  return (
    <>
      {/* Level-up popup */}
      <AnimatePresence>
        {showLevelUp && levelUps.length > 0 && (
          <LevelUpPopup levelUps={levelUps} onDismiss={() => setShowLevelUp(false)} />
        )}
      </AnimatePresence>

      <div className={["h-screen overflow-y-auto bg-gradient-to-b p-4 text-white", winnerBannerClasses(winner)].join(" ")}>
        <div className="mx-auto w-full max-w-2xl pb-8">
          <Navigation />

          {/* ── Winner banner ── */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="mb-4 sm:mb-6 rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6 text-center backdrop-blur"
          >
            <div className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-none">{winnerLabel}</div>
            <div className="mt-2 text-xs sm:text-sm text-slate-300">ผลการแข่งขัน</div>
            {gameOverReason && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-slate-700/60 border border-slate-600/60 px-3 py-1 text-xs font-semibold text-slate-300">
                🏁 เหตุผล: {gameOverReason}
              </div>
            )}
          </motion.div>

          {/* ── Score comparison ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-4 sm:mb-5 grid grid-cols-2 gap-2 sm:gap-3"
          >
            <div className={["rounded-2xl border p-3 sm:p-4", humanPanelShellClasses(human.faction)].join(" ")}>
              <div className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs font-semibold text-white/70 uppercase tracking-wide">{humanPlayerLabel(human.faction)}</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white leading-none">⭐ {scores.total[human.faction]}</div>
              <div className="mt-1.5 sm:mt-2 space-y-0.5 text-[10px] sm:text-xs text-slate-300">
                <div>🗺️ <span className="hidden sm:inline">พื้นที่ของเรา:</span> {scores.territory[human.faction]}</div>
                <div>⚔️ <span className="hidden sm:inline">ล้อมแตก:</span> {scores.captures[human.faction]}</div>
                <div>🎁 <span className="hidden sm:inline">โบนัส:</span> {scores.bonus[human.faction]}</div>
              </div>
            </div>
            <div className={["rounded-2xl border p-3 sm:p-4", aiPanelShellClasses(ai.faction)].join(" ")}>
              <div className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs font-semibold text-white/70 uppercase tracking-wide">{aiPlayerLabel(ai.faction)}</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white leading-none">⭐ {scores.total[ai.faction]}</div>
              <div className="mt-1.5 sm:mt-2 space-y-0.5 text-[10px] sm:text-xs text-slate-300">
                <div>🗺️ <span className="hidden sm:inline">พื้นที่ของเรา:</span> {scores.territory[ai.faction]}</div>
                <div>⚔️ <span className="hidden sm:inline">ล้อมแตก:</span> {scores.captures[ai.faction]}</div>
                <div>🎁 <span className="hidden sm:inline">โบนัส:</span> {scores.bonus[ai.faction]}</div>
              </div>
            </div>
          </motion.div>

          {/* ── EXP & Gold panel ── */}
          {expResult && newProfile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-5 rounded-2xl border border-yellow-500/30 bg-slate-900/80 p-5 backdrop-blur"
            >
              <div className="mb-4 flex items-center gap-2 text-sm font-bold text-yellow-300">
                <span className="text-lg">✨</span> EXP ที่ได้รับ
              </div>

              <div className="space-y-3">
                <ExpRow
                  icon={winner === "win" ? "🏆" : "🛡️"}
                  label={winner === "win" ? "ชนะการต่อสู้" : "สู้จบเกม"}
                  amount={expResult.base}
                  delay={400}
                />
                {expResult.captureBonus > 0 && (
                  <ExpRow icon="⚔️" label="จับยูนิต 3+ ตัว" amount={expResult.captureBonus} delay={600} />
                )}
                {expResult.territoryBonus > 0 && (
                  <ExpRow icon="🗺️" label="ควบคุมพื้นที่ขนาดใหญ่ (10+)" amount={expResult.territoryBonus} delay={800} />
                )}
                {expResult.comboBonus > 0 && (
                  <ExpRow icon="⚡" label={`Combo x${(comboState?.totalCombosThisGame ?? 0)} — โบนัส!`} amount={expResult.comboBonus} delay={1000} />
                )}
              </div>

              <div className="my-4 border-t border-slate-700" />

              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-white">รวม EXP</div>
                <div className="text-xl font-extrabold text-emerald-300">+{expResult.total} EXP</div>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <div className="text-sm text-slate-400">เหรียญที่ได้รับ</div>
                <div className="text-lg font-bold text-yellow-300">🪙 +{coinsGained}</div>
              </div>

              {/* EXP progress bar */}
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    {levelUps.length > 0
                      ? `🎉 เลเวลอัปเป็น Level ${newProfile.level}!`
                      : `Level ${newProfile.level}`}
                  </span>
                  <span className="font-semibold text-yellow-200">
                    {newProg?.current} / {newProg?.needed} EXP
                  </span>
                </div>
                <MiniExpBar pct={barEndPct} animated />
                {levelUps.length > 0 && (
                  <div className="mt-2 text-center text-xs font-semibold text-yellow-300 animate-pulse">
                    🎊 เลเวลอัป! กดรับรางวัลด้านล่าง
                  </div>
                )}
              </div>

              {/* Gold total */}
              <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-800/60 px-3 py-2 text-xs text-slate-400">
                <span>เหรียญสะสมรวม</span>
                <span className="font-bold text-yellow-300">🪙 {newProfile.coins.toLocaleString()}</span>
              </div>
            </motion.div>
          )}

          {/* ── Actions ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-2"
          >
            <button
              onClick={() => router.push("/select-faction")}
              className="flex-1 min-w-[140px] rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 font-bold text-white shadow-lg hover:brightness-110 transition"
            >
              🔄 เล่นใหม่
            </button>
            <button
              onClick={() => router.push("/shop")}
              className="flex-1 min-w-[140px] rounded-2xl bg-slate-700 hover:bg-slate-600 px-5 py-3 font-bold text-white transition flex items-center justify-center gap-1"
            >
              🛒 ไปร้านค้า
            </button>
            {levelUps.length > 0 && (
              <button
                onClick={() => setShowLevelUp(true)}
                className="flex-1 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 px-5 py-3 font-bold text-slate-900 shadow-[0_0_20px_rgba(251,191,36,0.35)] hover:brightness-110 transition"
              >
                🏆 ดูรางวัล
              </button>
            )}
            <button
              onClick={() => router.push("/menu")}
              className="rounded-2xl bg-slate-700 px-5 py-3 font-bold text-white hover:bg-slate-600 transition"
            >
              🏠 เมนู
            </button>
          </motion.div>
        </div>
      </div>
    </>
  );
}
