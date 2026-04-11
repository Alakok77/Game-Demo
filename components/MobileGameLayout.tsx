"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Board } from "@/components/Board";
import { MobileHand } from "@/components/MobileHand";
import { useGameStore } from "@/store/gameStore";
import { humanPlayerLabel, aiPlayerLabel } from "@/lib/factionUi";

// ─── Compact contextual hint ──────────────────────────────────────────────────

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
    if (!hasCardSelected) return { text: "กดค้างการ์ดเพื่อดูรายละเอียด · แตะเพื่อเลือก", icon: "👇" };
    return { text: "แตะช่องสีเขียวบนกระดานเพื่อวาง", icon: "🎯" };
  })();

  return (
    <AnimatePresence mode="wait">
      {hint && (
        <motion.div
          key={hint.text}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-1.5 rounded-full bg-slate-900/90 border border-slate-700/70 px-3 py-1.5 text-[11px] font-semibold text-slate-300 shadow-lg backdrop-blur-sm whitespace-nowrap mx-auto w-fit"
        >
          <span>{hint.icon}</span>
          <span>{hint.text}</span>
          {cardsLeft > 0 && (
            <span className="ml-1 rounded-full bg-slate-700 px-1.5 py-0.5 text-[9px] text-slate-400">
              เหลือได้อีก {cardsLeft} ใบ
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

  const phase          = useGameStore((s) => s.phase);
  const active         = useGameStore((s) => s.active);
  const turn           = useGameStore((s) => s.turn);
  const human          = useGameStore((s) => s.human);
  const ai             = useGameStore((s) => s.ai);
  const scores         = useGameStore((s) => s.scores);
  const selectedCardId = useGameStore((s) => s.selectedCardId);
  const cardsPlayed    = useGameStore((s) => s.cardsPlayedThisTurn);
  const message        = useGameStore((s) => s.message);
  const tryPass        = useGameStore((s) => s.tryPass);
  const tryEndTurn     = useGameStore((s) => s.tryEndTurn);
  const undoLastMove   = useGameStore((s) => s.undoLastMove);
  const undoAvailable  = useGameStore((s) => Boolean(s.undoSnapshot));
  const activeSynergies = useGameStore((s) => s.activeSynergies);
  const comboState     = useGameStore((s) => s.comboState);

  const isMyTurn   = phase === "player" && active === "HUMAN";
  const cardsLeft  = 2 - cardsPlayed;
  const humanTotal = scores.total[human.faction] ?? 0;
  const aiTotal    = scores.total[ai.faction] ?? 0;
  const leading    = humanTotal > aiTotal ? "HUMAN" : humanTotal < aiTotal ? "AI" : "TIED";

  // Lock body scroll while this layout is mounted
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Faction colour helpers
  const humanColor = human.faction === "RAMA" ? "text-blue-300" : "text-red-300";
  const aiColor    = ai.faction === "LANKA"   ? "text-red-400"  : "text-blue-300";
  const humanDot   = human.faction === "RAMA" ? "bg-blue-400"   : "bg-red-500";
  const aiDot      = ai.faction === "LANKA"   ? "bg-red-500"    : "bg-blue-400";

  return (
    <div
      className="bg-slate-950 text-slate-100 font-sans flex flex-col"
      style={{
        height: "100dvh",
        overflow: "hidden",
      }}
    >
      {/* ══ 1. HEADER ═══════════════════════════════════════════════════════════ */}
      <header className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/90 z-20 flex-shrink-0">
        {/* Human */}
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${humanDot}`} />
          <div>
            <div className="text-[8px] font-bold uppercase tracking-widest text-slate-500 leading-none">
              {humanPlayerLabel(human.faction)}
            </div>
            <div className={`text-base font-black tabular-nums leading-tight ${humanColor}`}>
              {humanTotal}⭐
            </div>
          </div>
        </div>

        {/* Centre — turn */}
        <div className="flex flex-col items-center">
          <div className={[
            "text-[9px] font-bold uppercase tracking-wider tabular-nums",
            turn >= 27 ? "text-red-400 animate-pulse" : turn >= 22 ? "text-amber-400" : "text-slate-500",
          ].join(" ")}>
            เทิร์น {turn}/30
          </div>
          <div className={[
            "text-[9px] font-semibold px-2 py-0.5 rounded-full mt-0.5",
            isMyTurn ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-800 text-slate-500",
          ].join(" ")}>
            {isMyTurn ? "🎮 ตาคุณ" : "🤖 AI คิด…"}
          </div>
        </div>

        {/* AI + menu */}
        <div className="flex items-center gap-1.5">
          <div className="text-right">
            <div className="text-[8px] font-bold uppercase tracking-widest text-slate-500 leading-none">
              {aiPlayerLabel(ai.faction)}
            </div>
            <div className={`text-base font-black tabular-nums leading-tight ${aiColor}`}>
              {aiTotal}⭐
            </div>
          </div>
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${aiDot}`} />
          <button
            onClick={() => router.push("/menu")}
            className="ml-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 active:bg-slate-700 transition"
            style={{ touchAction: "manipulation" }}
          >
            ≡
          </button>
        </div>
      </header>

      {/* ══ 2. SCORE + ENERGY BAR ═══════════════════════════════════════════════ */}
      <div className="flex items-center justify-between px-3 py-2 text-xs bg-slate-900/50 border-b border-slate-800/50 flex-shrink-0">
        {/* Energy */}
        <div className="flex items-center gap-1.5">
          <span className="text-orange-400 font-bold text-[10px]">⚡</span>
          <div className="flex items-center gap-1">
            <span className="text-orange-300 font-black tabular-nums">{human.energy}</span>
            <span className="text-slate-600 text-[9px]">/10</span>
          </div>
          {/* mini energy bar */}
          <div className="w-16 h-1.5 rounded-full bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-yellow-400 transition-all duration-300"
              style={{ width: `${(human.energy / 10) * 100}%` }}
            />
          </div>
        </div>

        {/* Card count */}
        <div className="text-slate-500 text-[9px]">
          การ์ด {cardsPlayed}/2
        </div>

        {/* Score comparison */}
        <div className="flex items-center gap-1 text-[10px]">
          <span className={humanColor + " font-black tabular-nums"}>{humanTotal}</span>
          <span className="text-slate-600">vs</span>
          <span className={aiColor + " font-black tabular-nums"}>{aiTotal}</span>
          {leading === "HUMAN" && <span className="text-emerald-400 font-bold ml-1">+{humanTotal - aiTotal}</span>}
          {leading === "AI"    && <span className="text-rose-400 font-bold ml-1">-{aiTotal - humanTotal}</span>}
        </div>

        {/* Deck */}
        <div className="flex items-center gap-1 text-[9px] text-slate-500">
          <span>🃏</span>
          <span className="tabular-nums text-cyan-400 font-bold">{human.deck.length}</span>
        </div>
      </div>

      {/* Active synergy / combo badges */}
      {(activeSynergies.length > 0 || comboState.comboCount > 0) && isMyTurn && (
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/30 flex-shrink-0 flex-wrap">
          {activeSynergies.length > 0 && (
            <span className="rounded-full bg-yellow-400/20 px-2 py-0.5 text-[9px] font-bold text-yellow-200 animate-pulse">
              ✨ พลังร่วมทำงาน!
            </span>
          )}
          {comboState.comboCount > 0 && (
            <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[9px] font-bold text-orange-200">
              🔥 คอมโบ x{comboState.comboCount}
            </span>
          )}
          {comboState.strongerSkillActive && (
            <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[9px] font-bold text-purple-200">
              ⚡ สกิลแรงขึ้น!
            </span>
          )}
        </div>
      )}

      {/* ══ 3. BOARD ════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col items-center justify-center px-2 py-1 min-h-0 overflow-hidden">
        {/* Contextual hint */}
        <div className="w-full flex justify-center mb-1 flex-shrink-0">
          <MobileHint isMyTurn={isMyTurn} hasCardSelected={!!selectedCardId} cardsLeft={cardsLeft} />
        </div>

        {/* Message toast */}
        <AnimatePresence mode="wait">
          {message?.text && (
            <motion.div
              key={message.nonce ?? message.text}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={[
                "w-full mb-1 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-center flex-shrink-0",
                message.kind === "warn"
                  ? "bg-rose-900/50 border border-rose-500/40 text-rose-300"
                  : "bg-emerald-900/40 border border-emerald-500/30 text-emerald-300",
              ].join(" ")}
            >
              {message.kind === "warn" ? "⚠️ " : "💬 "}{message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Board — square, max 60vh */}
        <div
          className="w-full flex-shrink-0"
          style={{
            aspectRatio: "1 / 1",
            maxHeight: "58vh",
            maxWidth: "100%",
          }}
        >
          <Board compact={true} />
        </div>
      </div>

      {/* ══ 4. ACTION BUTTONS ═══════════════════════════════════════════════════ */}
      <div className="flex items-center justify-center gap-2 px-3 py-2 border-t border-slate-800 bg-slate-900/70 flex-shrink-0 z-10">
        <button
          onClick={() => undoLastMove()}
          disabled={!isMyTurn || !undoAvailable}
          className="flex-1 py-3 text-sm font-semibold rounded-xl bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-30 active:bg-slate-700 transition-colors"
          style={{ touchAction: "manipulation" }}
        >
          ↩ Undo
        </button>
        <button
          onClick={() => tryPass()}
          disabled={!isMyTurn}
          className="flex-1 py-3 text-sm font-semibold rounded-xl bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-30 active:bg-slate-700 transition-colors"
          style={{ touchAction: "manipulation" }}
        >
          ⏭ ข้าม
        </button>
        <button
          onClick={() => tryEndTurn()}
          disabled={!isMyTurn}
          className={[
            "flex-[2] py-3 text-sm font-black rounded-xl text-white transition-all disabled:opacity-30 active:scale-95",
            isMyTurn
              ? "bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.45)] active:bg-blue-500"
              : "bg-slate-700",
          ].join(" ")}
          style={{ touchAction: "manipulation" }}
        >
          ✅ จบเทิร์น
        </button>
      </div>

      {/* ══ 5. HAND (fixed bottom strip) ════════════════════════════════════════ */}
      <div
        className="flex-shrink-0 border-t border-slate-800/80 bg-black/70 backdrop-blur-md z-20"
        style={{
          height: 130,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <MobileHand />
      </div>
    </div>
  );
}
