"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import {
  activeTurnBannerClasses,
  aiPanelScoreClasses,
  aiPlayerLabel,
  aiPanelTitleClasses,
  aiTurnPanelClasses,
  badgeFactionClasses,
  humanPanelScoreClasses,
  humanPlayerLabel,
  humanPanelTitleClasses,
  humanTurnPanelClasses,
} from "@/lib/factionUi";
import { Card } from "./Card";
import { DeckBuilder } from "@/deck/deckBuilder";

export function HUD() {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);
  const phase = useGameStore((s) => s.phase);
  const active = useGameStore((s) => s.active);
  const turn = useGameStore((s) => s.turn);
  const settings = useGameStore((s) => s.settings);
  const human = useGameStore((s) => s.human);
  const ai = useGameStore((s) => s.ai);
  const scores = useGameStore((s) => s.scores);
  const selectedCardId = useGameStore((s) => s.selectedCardId);
  const cardsPlayed = useGameStore((s) => s.cardsPlayedThisTurn);
  const msg = useGameStore((s) => s.message);
  const setSettings = useGameStore((s) => s.setSettings);
  const selectCard = useGameStore((s) => s.selectCard);
  const tryPass = useGameStore((s) => s.tryPass);
  const tryEndTurn = useGameStore((s) => s.tryEndTurn);
  const undoLastMove = useGameStore((s) => s.undoLastMove);
  const startMenu = useGameStore((s) => s.startMenu);
  const openDeckBuilder = useGameStore((s) => s.openDeckBuilder);
  const mulliganOnce = useGameStore((s) => s.mulliganOnce);
  const undoAvailable = useGameStore((s) => Boolean(s.undoSnapshot));
  const activeSynergies = useGameStore((s) => s.activeSynergies);
  const comboState = useGameStore((s) => s.comboState);

  const onlineMode = useGameStore((s) => s.onlineMode);
  const onlinePlayerRole = useGameStore((s) => s.onlinePlayerRole);

  const selected = selectedCardId ? human.hand.find((c) => c.id === selectedCardId) : undefined;
  const playableCards = human.hand.filter((c) => c.cost <= human.energy);
  const cheapestPlayableCost =
    playableCards.length > 0 ? Math.min(...playableCards.map((c) => c.cost)) : undefined;
  const winner =
    scores.total[human.faction] === scores.total[ai.faction]
      ? "เสมอ"
      : scores.total[human.faction] > scores.total[ai.faction]
        ? "คุณชนะ"
        : (onlineMode ? "ศัตรูชนะ" : "AI ชนะ");

  // Don't render dynamic content until after client-side hydration.
  // The Zustand store shuffles decks with Math.random() on init, which
  // differs between server and client, causing hydration mismatches.
  if (!mounted) {
    return (
      <div className="w-full max-w-[520px] space-y-3">
        <div className="h-48 animate-pulse rounded-2xl border border-slate-600 bg-slate-900/80" />
        <div className="h-40 animate-pulse rounded-2xl border border-slate-500/70 bg-slate-900/80" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[520px] space-y-3">
      {/* status panel */}
      <div className="rounded-2xl border border-slate-600 bg-slate-900 p-4 text-white shadow-[0_20px_60px_rgba(2,6,23,0.55)]">
        <div className="mb-3 text-sm font-bold text-white">รามเกียรติ์: ศึกชิงพื้นที่</div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_1fr]">
          <div className={["rounded-xl border p-3 transition", humanTurnPanelClasses(active === "HUMAN", human.faction)].join(" ")}>
            <div className={["text-sm font-bold", humanPanelTitleClasses(human.faction)].join(" ")}>{humanPlayerLabel(human.faction)}</div>
            <div className="mt-2 text-sm text-slate-200">
              {human.faction === "RAMA" ? "🟦" : "🟥"} พื้นที่ที่ล้อมได้: {scores.territory[human.faction]}
            </div>
            <div className="text-sm text-slate-200">⚔ ตัวที่จับได้: {scores.captures[human.faction]}</div>
            <div className={["mt-2 text-3xl font-extrabold", humanPanelScoreClasses(human.faction)].join(" ")}>⭐ {scores.total[human.faction]}</div>
          </div>

          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-center">
            <div className="text-xs text-slate-300">เทิร์น {turn}</div>
            <div className={["mt-1 rounded-lg px-3 py-1.5 text-sm font-bold", activeTurnBannerClasses(active === "HUMAN", human.faction)].join(" ")}>
              {active === "HUMAN" ? "👉 ตาของคุณ" : (onlineMode ? "⌛ ตาคู่แข่ง" : "🤖 ตา AI")}
            </div>
            <div className="mt-2 text-xs text-slate-300">⚡ พลังงาน: {human.energy}</div>
            <div className="text-xs text-emerald-200">+2 พลังงาน / เทิร์น</div>
            <div className="text-xs text-slate-300">การ์ดที่ใช้: {cardsPlayed}/2</div>
            {phase === "aiThinking" ? (
              <div className="mt-1 text-xs font-medium text-red-200 animate-pulse">
                {onlineMode ? "คู่แข่งกำลังคิด..." : "AI กำลังคิด..."}
              </div>
            ) : null}
            {/* Synergy active indicator */}
            {activeSynergies.length > 0 && active === "HUMAN" ? (
              <div className="mt-1 rounded-lg bg-yellow-400/20 px-2 py-0.5 text-xs font-semibold text-yellow-200 animate-pulse">
                ✨ พลังร่วมทำงาน!
              </div>
            ) : null}
            {/* Combo counter indicator */}
            {comboState.comboCount > 0 && active === "HUMAN" ? (
              <div className="mt-1 rounded-lg bg-orange-500/25 px-2 py-0.5 text-xs font-semibold text-orange-200">
                🔥 คอมโบ x{comboState.comboCount}
              </div>
            ) : null}
            {comboState.strongerSkillActive && active === "HUMAN" ? (
              <div className="mt-1 rounded-lg bg-purple-500/25 px-2 py-0.5 text-xs font-semibold text-purple-200">
                ⚡ สกิลแรงขึ้น!
              </div>
            ) : null}
          </div>

          <div className={["rounded-xl border p-3 transition", aiTurnPanelClasses(active === "AI", ai.faction)].join(" ")}>
            <div className={["text-sm font-bold", aiPanelTitleClasses(ai.faction)].join(" ")}>{aiPlayerLabel(ai.faction)}</div>
            <div className="mt-2 text-sm text-slate-200">
              {ai.faction === "RAMA" ? "🟦" : "🟥"} พื้นที่ที่ล้อมได้: {scores.territory[ai.faction]}
            </div>
            <div className="text-sm text-slate-200">⚔ ตัวที่จับได้: {scores.captures[ai.faction]}</div>
            <div className={["mt-2 text-3xl font-extrabold", aiPanelScoreClasses(ai.faction)].join(" ")}>⭐ {scores.total[ai.faction]}</div>
          </div>
        </div>

        <div className="mt-3 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className={["rounded-lg px-2 py-0.5 text-xs font-semibold", badgeFactionClasses(human.faction)].join(" ")}>
                {humanPlayerLabel(human.faction)}
              </div>
              <div className={["rounded-lg px-2 py-0.5 text-xs font-semibold", badgeFactionClasses(ai.faction)].join(" ")}>
                {aiPlayerLabel(ai.faction)}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSettings({ beginnerMode: !settings.beginnerMode })}
                className={[
                  "rounded-lg px-3 py-1 text-xs font-semibold transition",
                  settings.beginnerMode ? "bg-yellow-400/20 text-yellow-200" : "bg-slate-700 text-white hover:bg-slate-600",
                ].join(" ")}
              >
                โหมดแนะนำ {settings.beginnerMode ? "เปิด" : "ปิด"}
              </button>
              <select
                value={settings.aiLevel}
                onChange={(e) => setSettings({ aiLevel: Number(e.target.value) as 1 | 2 | 3 })}
                className="rounded-lg border border-slate-500 bg-slate-700 px-3 py-1 text-xs font-semibold text-white outline-none hover:bg-slate-600"
                aria-label="ระดับ AI"
              >
                <option value={1}>AI ระดับ 1</option>
                <option value={2}>AI ระดับ 2</option>
                <option value={3}>AI ระดับ 3</option>
              </select>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {msg ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18 }}
              className={[
                "mt-3 rounded-2xl border px-3 py-2 text-xs",
                msg.kind === "warn"
                  ? "border-red-500/60 bg-red-500/20 font-semibold text-red-100"
                  : "border-slate-500 bg-slate-800 text-slate-200",
              ].join(" ")}
            >
              {msg.text}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-slate-300">
            {selected ? (
              <span>
                เลือกแล้ว: <span className="font-bold text-white">{selected.name}</span> (พลังงาน {selected.cost})
              </span>
            ) : (
              <span>เลือกการ์ด แล้วคลิกช่องที่ไฮไลต์</span>
            )}
            {undoAvailable ? <span className="ml-2 text-blue-200">สามารถยกเลิกการลงล่าสุดได้</span> : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => undoLastMove()}
              disabled={!undoAvailable || phase !== "player" || active !== "HUMAN"}
              className="rounded-lg bg-slate-700 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ↩️ ยกเลิกการลงล่าสุด
            </button>
            <button
              onClick={() => tryEndTurn()}
              disabled={phase !== "player" || active !== "HUMAN"}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              จบเทิร์น
            </button>
            <button
              onClick={() => tryPass()}
              disabled={phase !== "player" || active !== "HUMAN"}
              className="rounded-lg bg-slate-700 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ข้ามเทิร์น
            </button>
            <button
              onClick={() => mulliganOnce()}
              disabled={phase !== "player" || active !== "HUMAN" || turn > 1 || Boolean(human.mulliganUsed)}
              className="rounded-lg bg-emerald-700 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Mulligan
            </button>
            <button
              onClick={() => startMenu()}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500"
            >
              เมนู
            </button>
          </div>
        </div>
      </div>

      {/* hand */}
      <div className="rounded-2xl border border-slate-500/70 bg-slate-900 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-bold text-white">การ์ดในมือ</div>
          <div className="text-xs text-slate-300">
            ⚡ พลังงาน: {human.energy} / 10 • คลิกเพื่อเลือกการ์ด
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-start gap-3 overflow-x-auto pb-1">
          {human.hand.map((c) => (
            <div key={c.id} className="w-[160px] shrink-0">
              <Card
                card={c}
                faction={human.faction}
                selected={selectedCardId === c.id}
                disabled={phase !== "player" || active !== "HUMAN" || c.cost > human.energy}
                playable={phase === "player" && active === "HUMAN" && c.cost <= human.energy}
                cheapestPlayable={phase === "player" && active === "HUMAN" && c.cost <= human.energy && c.cost === cheapestPlayableCost}
                onClick={() => selectCard(selectedCardId === c.id ? undefined : c.id)}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 text-xs text-slate-300">
          เด็ค {human.deck.length} • กองทิ้ง {human.discard.length}
        </div>
      </div>

      {/* menu actions */}
      {phase === "menu" ? (
        <div className="rounded-2xl border border-slate-500/70 bg-slate-900 p-4 text-slate-300">
          <div className="text-sm font-bold text-white">เริ่มเกม</div>
          <div className="mt-1 text-xs text-slate-300">
            ชนะด้วย <span className="font-bold text-white">พื้นที่ของเรา + ล้อมแตก</span> — เกมจบเมื่อกระดานเต็มหรือทั้งสองฝ่ายข้ามเทิร์น
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => router.push("/select-faction")}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
            >
              เล่นกับ AI
            </button>
            <button
              onClick={() => openDeckBuilder()}
              className="rounded-lg bg-slate-700 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-600"
            >
              จัดเด็ค
            </button>
            <button
              onClick={() => router.push("/select-faction?tutorial=1")}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
            >
              วิธีเล่น
            </button>
          </div>
        </div>
      ) : null}

      {phase === "deckBuilder" ? <DeckBuilder /> : null}

      {phase === "gameOver" ? (
        <div className="rounded-2xl border border-slate-500/70 bg-slate-900 p-4 text-slate-300">
          <div className="text-sm font-bold text-white">จบเกม</div>
          <div className="mt-1 text-xs text-slate-300">
            ผลลัพธ์: <span className="font-bold text-white">{winner}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => router.push("/select-faction")}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
            >
              เริ่มใหม่
            </button>
            <button
              onClick={() => startMenu()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
            >
              กลับเมนู
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

