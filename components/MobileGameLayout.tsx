"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Board } from "@/components/Board";
import { MobileHand } from "@/components/MobileHand";
import { useGameStore } from "@/store/gameStore";
import { humanPlayerLabel, aiPlayerLabel } from "@/lib/factionUi";
import { EffectBar } from "@/components/EffectBar";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

// ─── Compact contextual hint (Floating) ───────────────────────────────────────

function MobileHint({
  isMyTurn,
  hasCardSelected,
  cardsLeft,
}: {
  isMyTurn: boolean;
  hasCardSelected: boolean;
  cardsLeft: number;
}) {
  const hint = (() => {
    if (!isMyTurn) return null;
    if (!hasCardSelected) return { text: "แตะค้างดูข้อมูล · แตะใช้การ์ด 👇", icon: "" };
    return { text: "แตะช่องสีเขียวบนกระดาน 🎯", icon: "" };
  })();

  return (
    <AnimatePresence mode="wait">
      {hint && (
        <motion.div
          key={hint.text}
          initial={{ opacity: 0, scale: 0.9, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-1.5 rounded-full bg-indigo-950/95 border border-indigo-500/50 px-4 py-1.5 text-xs font-bold text-indigo-200 shadow-xl backdrop-blur-md whitespace-nowrap pointer-events-auto"
        >
          <span>{hint.text}</span>
          {cardsLeft > 0 && (
            <span className="ml-1 rounded-full bg-indigo-900 px-1.5 py-0.5 text-[10px] text-indigo-300">
              เหลือ {cardsLeft} ใบ
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Mobile Game Layout ───────────────────────────────────────────────────────

export function MobileGameLayout() {
  const router = useRouter();

  const phase = useGameStore((s) => s.phase);
  const active = useGameStore((s) => s.active);
  const turn = useGameStore((s) => s.turn);
  const human = useGameStore((s) => s.human);
  const ai = useGameStore((s) => s.ai);
  const scores = useGameStore((s) => s.scores);
  const selectedCardId = useGameStore((s) => s.selectedCardId);
  const cardsPlayed = useGameStore((s) => s.cardsPlayedThisTurn);
  const message = useGameStore((s) => s.message);
  const tryPass = useGameStore((s) => s.tryPass);
  const tryEndTurn = useGameStore((s) => s.tryEndTurn);
  const undoLastMove = useGameStore((s) => s.undoLastMove);
  const undoAvailable = useGameStore((s) => Boolean(s.undoSnapshot));
  const targetSelection = useGameStore((s) => s.targetSelection);
  const cancelTargetSelection = useGameStore((s) => s.cancelTargetSelection);
  const confirmTargetSelection = useGameStore((s) => s.confirmTargetSelection);
  const activeSynergies = useGameStore((s) => s.activeSynergies);
  const comboState = useGameStore((s) => s.comboState);

  const isMyTurn = phase === "player" && active === "HUMAN";
  const cardsLeft = 2 - cardsPlayed;
  const humanTotal = scores.total[human.faction] ?? 0;
  const aiTotal = scores.total[ai.faction] ?? 0;
  const leading = humanTotal > aiTotal ? "HUMAN" : humanTotal < aiTotal ? "AI" : "TIED";

  // ─── ONLINE SYNC ──────────────────────────────────────────────────────────
  const onlineMode = useGameStore((s) => s.onlineMode);
  const onlineRoomId = useGameStore((s) => s.onlineRoomId);
  const onlineUserId = useGameStore((s) => s.onlineUserId);
  const onlinePlayerRole = useGameStore((s) => s.onlinePlayerRole);
  const syncFromOnline = useGameStore((s) => s.syncFromOnline);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => { setMounted(true); }, []);

  React.useEffect(() => {
    if (!mounted || !onlineMode || !onlineRoomId) return;

    const roomRef = ref(db, `battle_rooms_v2/${onlineRoomId}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.status === "playing" && data.gameState) {
        syncFromOnline(data);
      }
    });

    return () => unsubscribe();
  }, [mounted, onlineMode, onlineRoomId, onlineUserId, syncFromOnline]);

  // Lock body scroll
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const humanColor = human.faction === "RAMA" ? "text-blue-300" : "text-red-300";
  const aiColor = ai.faction === "LANKA" ? "text-red-400" : "text-blue-300";

  return (
    <div
      className="bg-slate-950 text-slate-100 font-sans flex flex-col"
      style={{
        height: "100dvh",
        overflow: "hidden",
      }}
    >
      <EffectBar />
      {/* ══ 1. TOP BAR (COMPACT HEADER + ENERGY) ══════════════════════════════ */}
      <header className="flex flex-col bg-slate-900 border-b border-slate-800 z-20 flex-shrink-0 shadow-md">
        {/* Row 1: Turn, Ownership and Scores */}
        <div className="flex items-center justify-between px-3 h-12">
          {/* Left: Your Score */}
          <div className="flex flex-col items-center min-w-[45px] bg-slate-950/30 rounded-lg py-0.5 px-1.5 border border-slate-800/50">
            <span className={`text-xs font-black tabular-nums leading-none ${humanColor}`}>{humanTotal}</span>
            <span className="text-[7px] text-slate-500 font-bold uppercase tracking-tighter mt-0.5">YOU ⭐</span>
          </div>

          <div className="flex flex-col items-center">
            <div className={["text-[10px] font-black uppercase tracking-[0.1em] tabular-nums",
              turn >= 27 ? "text-red-400 animate-pulse" : turn >= 22 ? "text-amber-400" : "text-slate-400",
            ].join(" ")}>
              เทิร์น {turn}/30
            </div>
            <div className={["text-[9px] font-bold px-2 py-0.5 rounded-full mt-0.5 leading-none flex items-center border shadow-sm",
              isMyTurn ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-blue-500/10 text-blue-400 border-blue-500/30",
            ].join(" ")}>
              {isMyTurn ? "🎮 ตาคุณ" : (
                <motion.span
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                {onlineMode 
                  ? "⌛ ตาคู่แข่ง..." 
                  : "🤖 ตา AI..."
                }
                </motion.span>
              )}
            </div>
          </div>

          {/* Right: Opponent Score + Menu */}
          <div className="flex items-center gap-1.5 min-w-[45px] justify-end">
            <div className="flex flex-col items-center bg-slate-950/30 rounded-lg py-0.5 px-1.5 border border-slate-800/50">
              <span className={`text-xs font-black tabular-nums leading-none ${aiColor}`}>{aiTotal}</span>
              <span className="text-[7px] text-slate-500 font-bold uppercase tracking-tighter mt-0.5">OPP ⭐</span>
            </div>
            <button
              onClick={() => router.push("/menu")}
              className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 active:bg-slate-700 shadow-md"
              style={{ touchAction: "manipulation" }}
            >
              ≡
            </button>
          </div>
        </div>

        {/* Row 2: Status Inline */}
        <div className="flex items-center justify-between px-3 py-1 bg-slate-950/40 border-t border-slate-800 h-8">
          {/* Energy */}
          <div className="flex items-center gap-1.5">
            <span className="text-orange-400 font-bold text-xs leading-none">⚡</span>
            <span className="text-orange-300 font-black text-xs tabular-nums leading-none">{human.energy}/10</span>
            <div className="hidden sm:block w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden ml-1">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-yellow-400 transition-all duration-300"
                style={{ width: `${(human.energy / 10) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex gap-3 text-[10px] font-bold text-slate-500">
            <span>🎴 {human.deck.length}</span>
            <span>เหลือลง {2 - cardsPlayed} ใบ</span>
          </div>
        </div>
      </header>

      {/* ══ 2. MESSAGE AND SYNERGY BADGES ══════════════════════════════════════ */}
      {(message?.text || (isMyTurn && (activeSynergies.length > 0 || comboState.comboCount > 0))) && (
        <div className="w-full bg-slate-950 p-1 flex justify-center flex-shrink-0 z-10 flex-wrap gap-1">
          <AnimatePresence mode="wait">
            {message?.text && (
              <motion.div
                key={message.nonce ?? message.text}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className={["px-3 py-1 rounded-full text-[10px] font-bold text-center",
                  message.kind === "warn"
                    ? "bg-rose-900/50 border border-rose-500/40 text-rose-300"
                    : "bg-emerald-900/40 border border-emerald-500/30 text-emerald-300",
                ].join(" ")}
              >
                {message.kind === "warn" ? "⚠️ " : "💬 "}{message.text}
              </motion.div>
            )}
          </AnimatePresence>

          {isMyTurn && activeSynergies.length > 0 && (
            <span className="rounded-full bg-yellow-400/20 px-2 py-1 text-[10px] font-bold text-yellow-300 ring-1 ring-yellow-400/30">
              ✨ พลังร่วมทำงาน!
            </span>
          )}
          {isMyTurn && comboState.comboCount > 0 && (
            <span className="rounded-full bg-orange-500/20 px-2 py-1 text-[10px] font-bold text-orange-300 ring-1 ring-orange-500/30">
              🔥 คอมโบ x{comboState.comboCount}
            </span>
          )}
        </div>
      )}

      {/* ══ 3. BOARD (MAIN FOCUS) ═══════════════════════════════════════════════ */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden min-h-0 relative pb-8 pt-2">
        {/* Sticky Mobile Hint */}
        <div className="w-full flex justify-center sticky top-1 z-30 h-0 overflow-visible pointer-events-none drop-shadow-md">
          <MobileHint isMyTurn={isMyTurn} hasCardSelected={!!selectedCardId} cardsLeft={cardsLeft} />
        </div>

        {/* Full width board container */}
        <div className="w-full flex-shrink-0 flex items-center justify-center pointer-events-auto">
          {/* Unconstrained square board to prevent squishing and ensure playability */}
          <div className="w-full max-w-[600px] aspect-square p-1 mt-6">
            <Board compact={true} />
          </div>
        </div>
      </div>

      {/* ══ 4. ACTION BUTTONS (STICKY) ═════════════════════════════════════════ */}
      {targetSelection ? (
        <div className="grid grid-cols-2 gap-2 px-2 py-2 border-t border-slate-800 bg-slate-900/90 flex-shrink-0 z-40">
          <button
            onClick={() => cancelTargetSelection()}
            className="py-2.5 text-sm font-bold rounded-xl bg-slate-800 border border-slate-700 text-slate-300 active:bg-slate-700 transition-colors"
          >
            ❌ ยกเลิกสกิล
          </button>
          <button
            onClick={() => confirmTargetSelection()}
            className="py-2.5 text-sm font-black rounded-xl bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] active:bg-blue-500 transition-all cursor-pointer"
            style={{ touchAction: "manipulation" }}
          >
            🎯 ยืนยันเป้าหมาย ({Math.max(0, targetSelection.selectedCoords.length - 1)}/{targetSelection.maxSteps})
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 px-2 py-2 border-t border-slate-800 bg-slate-900/90 flex-shrink-0 z-40">
          <button
            onClick={() => undoLastMove()}
            disabled={!isMyTurn || !undoAvailable}
            className="py-2.5 text-xs font-bold rounded-xl bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-30 active:bg-slate-700 transition-colors"
            style={{ touchAction: "manipulation" }}
          >
            ↩ ย้อนกลับ
          </button>
          <button
            onClick={() => tryPass()}
            disabled={!isMyTurn}
            className="py-2.5 text-xs font-bold rounded-xl bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-30 active:bg-slate-700 transition-colors"
            style={{ touchAction: "manipulation" }}
          >
            ⏭ ข้ามตา
          </button>
          <button
            onClick={() => tryEndTurn()}
            disabled={!isMyTurn}
            className={[
              "py-2.5 text-xs font-black rounded-xl text-white transition-all disabled:opacity-30 active:scale-95",
              isMyTurn
                ? "bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)] active:bg-blue-500"
                : "bg-slate-700",
            ].join(" ")}
            style={{ touchAction: "manipulation" }}
          >
            ✅ จบเทิร์น
          </button>
        </div>
      )}

      {/* ══ 5. HAND (CARDS) ════════════════════════════════════════════════════ */}
      <div
        className="flex-shrink-0 bg-slate-950 z-50"
        style={{
          height: 185,
          paddingBottom: "env(safe-area-inset-bottom, 8px)",
        }}
      >
        <MobileHand />
      </div>
    </div>
  );
}
