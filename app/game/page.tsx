"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Board } from "@/components/Board";
import { Hand } from "@/components/Hand";
import { TutorialOverlay } from "@/components/TutorialOverlay";
import { GameLegend } from "@/components/GameLegend";
import { MobileGameLayout } from "@/components/MobileGameLayout";
import { useGameStore, performOnlineAction } from "@/store/gameStore";
import { humanPlayerLabel, aiPlayerLabel } from "@/lib/factionUi";
import { ref, onValue, update } from "firebase/database";
import { db } from "@/lib/firebase";

// ─── Mobile detection ─────────────────────────────────────────────────────────

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

// ─── Contextual hint ──────────────────────────────────────────────────────────

function ContextHint({
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
    if (!hasCardSelected) return { text: "เลือกการ์ดจากด้านล่าง", icon: "👇" };
    return { text: "คลิกช่องสีเขียวเพื่อวาง", icon: "🎯" };
  })();

  return (
    <AnimatePresence mode="wait">
      {hint && (
        <motion.div
          key={hint.text}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
        >
          <div className="flex items-center gap-1.5 rounded-full bg-slate-900/90 border border-slate-600/70 px-3 py-1 text-[11px] font-semibold text-slate-300 shadow-xl backdrop-blur-sm whitespace-nowrap">
            <span>{hint.icon}</span>
            <span>{hint.text}</span>
            {cardsLeft > 0 && (
              <span className="ml-1 rounded-full bg-slate-700 px-1.5 py-0.5 text-[9px] text-slate-400">
                เหลือ {cardsLeft} ใบ
              </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GamePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

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

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (phase === "gameOver") router.push("/result"); }, [phase, router]);

  // ─── ONLINE SYNC ──────────────────────────────────────────────────────────
  const onlineMode = useGameStore((s) => s.onlineMode);
  const onlineRoomId = useGameStore((s) => s.onlineRoomId);
  const onlineUserId = useGameStore((s) => s.onlineUserId);
  const onlinePlayerRole = useGameStore((s) => s.onlinePlayerRole);
  const syncFromOnline = useGameStore((s) => s.syncFromOnline);
  const playerFaction = useGameStore((s) => s.playerFaction);
  const settings = useGameStore((s) => s.settings);
  const [onlineRoomData, setOnlineRoomData] = useState<any>(null);

  useEffect(() => {
    if (!mounted || !onlineMode || !onlineRoomId) return;

    const roomRef = ref(db, `battle_rooms_v2/${onlineRoomId}`);

    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      setOnlineRoomData(data);

      if (data.status === "playing") {
        syncFromOnline(data);
      }
    });

    return () => unsubscribe();
  }, [mounted, onlineMode, onlineRoomId, onlineUserId, syncFromOnline]);

  // Host initialization helper
  const initOnlineGame = useGameStore((s) => s.initOnlineGame);
  useEffect(() => {
    if (onlineMode && onlineRoomId && onlinePlayerRole === "host" && phase === "connecting" && mounted) {
      initOnlineGame();
    }
  }, [onlineMode, onlineRoomId, onlinePlayerRole, phase, mounted, initOnlineGame]);

  const isMobile = useIsMobile();

  if (!mounted) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center text-slate-300 text-sm">
        กำลังโหลดเกม...
      </div>
    );
  }

  // ── Mobile layout — completely separate, touch-first ──────────────────────
  if (isMobile) {
    return (
      <>
        <MobileGameLayout />
        <TutorialOverlay />
      </>
    );
  }

  const humanTotal = scores.total[human.faction] ?? 0;
  const aiTotal = scores.total[ai.faction] ?? 0;
  const isMyTurn = phase === "player" && active === "HUMAN";
  const cardsLeft = 2 - cardsPlayed;

  return (
    /*
     * LAYOUT (top → bottom, each row is fixed height except the middle):
     *
     *  ┌──────────────────────────────────────────────────────┐  h-12 (header)
     *  ├──────────────────────────┬───────────────────────────┤
     *  │                          │                           │  flex-1 (board + side)
     *  │        BOARD             │       SIDE PANEL          │
     *  │                          │                           │
     *  ├──────────────────────────┴───────────────────────────┤  h-12 (action bar)
     *  ├──────────────────────────────────────────────────────┤  h-40 (hand)
     *  └──────────────────────────────────────────────────────┘
     *
     * Uses CSS grid with named rows so overflow cannot happen.
     */
    <div
      className="bg-slate-950 text-slate-100 font-sans overflow-hidden"
      style={{
        height: "100dvh",           // dynamic viewport height (avoids mobile browser chrome issues)
        display: "grid",
        gridTemplateRows: "48px 1fr 52px 160px",
        gridTemplateColumns: "1fr 260px",
      }}
    >
      {/* ══ ROW 1: HEADER (col-span-2) ═══════════════════════════════════════ */}
      <header
        className="flex items-center gap-3 px-4 border-b border-slate-800 bg-slate-900/80 z-20"
        style={{ gridColumn: "1 / -1" }}
      >
        {/* Player */}
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${human.faction === "RAMA" ? "bg-blue-400" : "bg-red-500"}`} />
          <div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 leading-none">{humanPlayerLabel(human.faction)}</div>
            <div className={`text-xl font-black tabular-nums leading-tight ${human.faction === "RAMA" ? "text-blue-300" : "text-red-300"}`}>{humanTotal}⭐</div>
          </div>
        </div>

        {/* Centre */}
        <div className="flex-1 flex flex-col items-center">
          <div className={["text-[10px] font-bold uppercase tracking-widest tabular-nums",
            turn >= 27 ? "text-red-400 animate-pulse" : turn >= 22 ? "text-amber-400" : "text-slate-500",
          ].join(" ")}>เทิร์น {turn} / 30</div>
          <div className={["text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5",
            isMyTurn ? "bg-emerald-500/15 text-emerald-400" : "bg-blue-500/15 text-blue-400",
          ].join(" ")}>
            <div className="flex flex-col items-center">
              <span className="text-[10px] opacity-70 font-black tracking-widest mb-0.5">
                {onlineMode
                  ? (onlinePlayerRole?.includes("player1") || onlinePlayerRole === "host" ? `🏆 ผู้เล่น 1 (HOST)` : `⚔️ ผู้เล่น 2 (GUEST)`)
                  : "🕹️ โหมดเล่นคนเดียว"
                }
              </span>

              {/* Added Transparency: Internal States */}
              {onlineMode && (
                <div className="flex gap-2 text-[8px] font-black uppercase opacity-60 mb-1">
                  <span className="px-1 bg-slate-800 rounded">Role: {onlinePlayerRole}</span>
                  <span className="px-1 bg-slate-800 rounded">Room Turn: {onlineRoomData?.turn || "..."}</span>
                  <span className="px-1 bg-slate-800 rounded">UI State: {active}</span>
                </div>
              )}

              {isMyTurn ? "🎮 เทิร์นคุณ" : (
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {onlineMode
                    ? (onlineRoomData?.gameState ? "⌛ ถึงตาคู่แข่ง..." : "⏳ กำลังซิงค์ข้อมูล...")
                    : (turn < 5 ? "🤖 AI กำลังวางหมาก..." : turn < 15 ? "🤔 AI กำลังคำนวณแผน..." : "💭 AI กำลังเร่งปิดเกม...")
                  }
                </motion.span>
              )}
            </div>
          </div>
        </div>

        {/* AI */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 leading-none">{aiPlayerLabel(ai.faction)}</div>
            <div className={`text-xl font-black tabular-nums leading-tight ${ai.faction === "LANKA" ? "text-red-400" : "text-blue-300"}`}>{aiTotal}⭐</div>
          </div>
          <div className={`w-2.5 h-2.5 rounded-full ${ai.faction === "LANKA" ? "bg-red-500" : "bg-blue-400"}`} />
          <button
            onClick={() => router.push("/menu")}
            className="text-xs font-semibold px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            ← Menu
          </button>
        </div>
      </header>

      {/* ══ ROW 2 COL 1: BOARD ════════════════════════════════════════════════ */}
      <div className="relative flex items-center justify-center min-h-0 min-w-0 p-2 overflow-hidden bg-slate-950">
        {/*
          The board must be square so the 7×7 cells look correct.
          We use a div constrained to the smaller of (container-w, container-h).
          CSS trick: both w and h = 100%, but the parent is a flex centering box,
          so we then constrain to the shorter dimension via aspect-square + max-h/max-w.
        */}
        <div
          className="aspect-square"
          style={{ height: "min(100%, calc(100vw - 260px - 16px))", width: "auto", maxHeight: "100%" }}
        >
          <Board compact={true} />
        </div>
        <ContextHint isMyTurn={isMyTurn} hasCardSelected={!!selectedCardId} cardsLeft={cardsLeft} />
      </div>

      {/* ══ ROW 2 COL 2: SIDE PANEL ═══════════════════════════════════════════ */}
      <aside className="flex flex-col min-h-0 overflow-y-auto border-l border-slate-800 bg-slate-900/30 p-3">
        <GameLegend
          scores={scores}
          humanFaction={human.faction}
          aiFaction={ai.faction}
          humanEnergy={human.energy}
          humanCaptures={human.captures}
          aiCaptures={ai.captures}
          deckCount={human.deck.length}
          discardCount={human.discard.length}
          nextCard={human.deck[0] ?? null}
          message={message}
        />
      </aside>

      {/* ══ ROW 3: ACTION BAR (col-span-2) ════════════════════════════════════ */}
      <div
        className="flex items-center justify-center gap-3 border-t border-slate-800 bg-slate-900/60 z-10"
        style={{ gridColumn: "1 / -1" }}
      >
        <button
          onClick={() => undoLastMove()}
          disabled={!isMyTurn}
          className="px-4 py-1.5 text-sm font-semibold bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition disabled:opacity-25 text-slate-300"
        >↩ Undo</button>
        <button
          onClick={() => tryPass()}
          disabled={!isMyTurn}
          className="px-4 py-1.5 text-sm font-semibold bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition disabled:opacity-25 text-slate-300"
        >⏭ ข้าม</button>
        <button
          onClick={() => tryEndTurn()}
          disabled={!isMyTurn}
          className={["px-8 py-1.5 text-sm font-black rounded-lg text-white transition disabled:opacity-25",
            isMyTurn ? "bg-blue-600 hover:bg-blue-500 shadow-[0_0_16px_rgba(37,99,235,0.35)]" : "bg-slate-700",
          ].join(" ")}
        >✅ จบเทิร์น</button>
      </div>

      {/* ══ ROW 4: HAND (col-span-2) ═══════════════════════════════════════════ */}
      <div
        className="flex items-end justify-center overflow-hidden bg-slate-900 border-t border-slate-800/50"
        style={{ gridColumn: "1 / -1" }}
      >
        <Hand />
      </div>

      <TutorialOverlay />
    </div>
  );
}
