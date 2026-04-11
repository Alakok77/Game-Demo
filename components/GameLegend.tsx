"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Card, Faction } from "@/game/types";

// ─── Legend data (used by modal only) ────────────────────────────────────────

const LEGEND_ITEMS = [
  { icon: "⭐", label: "คะแนน",       desc: "ได้จากพื้นที่ที่ยึดได้ + กำจัดศัตรู",            color: "text-yellow-400" },
  { icon: "⚡", label: "พลังงาน",    desc: "ใช้ลงการ์ด — ได้ +2 ทุกเทิร์น สูงสุด 10",       color: "text-orange-400" },
  { icon: "🃏", label: "เด็ค",       desc: "กองจั่ว — หมดแล้วสับจากกองทิ้งอัตโนมัติ",        color: "text-cyan-400"   },
  { icon: "👤", label: "ยูนิต",      desc: "ตัวละครบนกระดาน วางแล้วยึดช่องรอบตัว",           color: "text-slate-300"  },
  { icon: "✨", label: "สกิล",       desc: "ความสามารถพิเศษ ใช้แล้วหายจากมือ",              color: "text-violet-300" },
  { icon: "🟢", label: "วางได้",     desc: "ช่องสีเขียว = วางตัวละครได้ทันที",               color: "text-green-400"  },
  { icon: "💙", label: "พระราม",     desc: "หินสีน้ำเงิน ทรงกลม มี ⭐",                      color: "text-blue-400"   },
  { icon: "🔥", label: "ลงกา",       desc: "หินสีแดง ทรงเหลี่ยม มี 🔥",                      color: "text-red-400"    },
  { icon: "🔒", label: "ล้อมแตก",    desc: "ช่องว่างรอบตัวหมด → ตัวละครถูกกำจัดทันที",      color: "text-rose-400"   },
];

// ─── How To Play modal ────────────────────────────────────────────────────────

function HowToPlayModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <span className="text-sm font-black text-slate-100">📘 วิธีเล่น</span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* How to score */}
          <section>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">📊 วิธีได้คะแนน</div>
            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex items-start gap-2"><span className="text-green-400 shrink-0">•</span> วางตัวละคร → ยึดช่องว่างรอบตัว → คะแนนพื้นที่</div>
              <div className="flex items-start gap-2"><span className="text-orange-400 shrink-0">•</span> ล้อมแตกกลุ่มศัตรู → คะแนนยึด</div>
              <div className="flex items-start gap-2"><span className="text-yellow-400 shrink-0">•</span> ยึดพื้นที่ใหญ่ในเทิร์นเดียว → โบนัสพลังงาน</div>
            </div>
          </section>

          {/* Symbol legend */}
          <section>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">🔣 สัญลักษณ์</div>
            <div className="space-y-2">
              {LEGEND_ITEMS.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-lg shrink-0 w-7 text-center">{item.icon}</span>
                  <div>
                    <span className={`text-xs font-bold ${item.color}`}>{item.label}</span>
                    <span className="text-xs text-slate-500"> — {item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export type GameLegendProps = {
  scores: {
    territory: Record<string, number>;
    captures: Record<string, number>;
    bonus: Record<string, number>;
    total: Record<string, number>;
  };
  humanFaction: Faction;
  aiFaction: Faction;
  humanEnergy: number;
  humanCaptures: number;
  aiCaptures: number;
  deckCount: number;
  discardCount: number;
  nextCard?: Card | null;
  message?: { text: string; kind: "info" | "warn"; nonce?: number } | null;
};

// ─── Main slim side panel ─────────────────────────────────────────────────────

export function GameLegend({
  scores,
  humanFaction,
  aiFaction,
  humanEnergy,
  deckCount,
  discardCount,
  nextCard,
  message,
}: GameLegendProps) {
  const [showModal, setShowModal] = React.useState(false);
  const [showScoreDetail, setShowScoreDetail] = React.useState(false);

  const humanTotal = scores.total[humanFaction] ?? 0;
  const aiTotal    = scores.total[aiFaction]    ?? 0;
  const humanTerritory = scores.territory[humanFaction] ?? 0;
  const aiTerritory    = scores.territory[aiFaction]    ?? 0;
  const humanCaps = scores.captures[humanFaction] ?? 0;
  const aiCaps    = scores.captures[aiFaction]    ?? 0;

  const leading = humanTotal > aiTotal ? "HUMAN" : humanTotal < aiTotal ? "AI" : "TIED";
  const totalTerr = humanTerritory + aiTerritory;

  return (
    <>
      {/* ── Panel content ── */}
      <div className="flex flex-col gap-3 h-full">

        {/* ① Energy */}
        <div className="flex flex-col gap-1.5 p-3 rounded-xl border border-slate-700/80 bg-slate-800/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400">⚡ พลังงาน</span>
            <span className="text-lg font-black text-orange-300 tabular-nums">{humanEnergy}<span className="text-[10px] text-slate-600 font-normal">/10</span></span>
          </div>
          <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-yellow-400"
              animate={{ width: `${(humanEnergy / 10) * 100}%` }}
              transition={{ duration: 0.35 }}
            />
          </div>
        </div>

        {/* ② Score — compact, with hover detail */}
        <div className="flex flex-col gap-1 p-3 rounded-xl border border-slate-700/80 bg-slate-800/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-400">⭐ คะแนน</span>
            <button
              onClick={() => setShowScoreDetail(v => !v)}
              className="text-[10px] text-slate-500 hover:text-slate-300 transition"
            >
              {showScoreDetail ? "▲" : "▼"}
            </button>
          </div>

          {/* vs row */}
          <div className="flex items-center gap-2">
            <div className={`flex-1 rounded-lg py-1 text-center transition-all ${leading === "HUMAN" ? "bg-blue-500/20 ring-1 ring-blue-400/50" : "bg-slate-700/40"}`}>
              <div className={`text-2xl font-black tabular-nums ${humanFaction === "RAMA" ? "text-blue-300" : "text-red-300"}`}>{humanTotal}</div>
              <div className="text-[8px] text-slate-500">คุณ</div>
            </div>
            <div className="text-slate-700 text-xs font-bold">vs</div>
            <div className={`flex-1 rounded-lg py-1 text-center transition-all ${leading === "AI" ? "bg-red-500/20 ring-1 ring-red-400/50" : "bg-slate-700/40"}`}>
              <div className={`text-2xl font-black tabular-nums ${aiFaction === "LANKA" ? "text-red-400" : "text-blue-300"}`}>{aiTotal}</div>
              <div className="text-[8px] text-slate-500">AI</div>
            </div>
          </div>

          {/* lead label */}
          <div className="text-center mt-0.5 text-[10px] font-semibold">
            {leading === "HUMAN" ? <span className="text-emerald-400">🏆 นำ +{humanTotal - aiTotal}</span>
            : leading === "AI"   ? <span className="text-rose-400">⚠️ ตาม -{aiTotal - humanTotal}</span>
            :                      <span className="text-slate-500">เสมอ</span>}
          </div>

          {/* expandable breakdown */}
          <AnimatePresence>
            {showScoreDetail && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <div className="mt-2 pt-2 border-t border-slate-700/50 space-y-1 text-[10px]">
                  <div className="flex justify-between text-slate-400">
                    <span>🗺️ พื้นที่</span>
                    <span><span className={humanFaction === "RAMA" ? "text-blue-300" : "text-red-300"}>{humanTerritory}</span> — <span className={aiFaction === "LANKA" ? "text-red-400" : "text-blue-300"}>{aiTerritory}</span></span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>⚔️ ยึด</span>
                    <span><span className={humanFaction === "RAMA" ? "text-blue-300" : "text-red-300"}>{humanCaps}</span> — <span className={aiFaction === "LANKA" ? "text-red-400" : "text-blue-300"}>{aiCaps}</span></span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ③ Territory bar — shown only when there's territory data */}
        {totalTerr > 0 && (
          <div className="flex flex-col gap-1 p-3 rounded-xl border border-slate-700/80 bg-slate-800/50">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">🗺️ อาณาเขต</div>
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-black tabular-nums w-4 text-right ${humanFaction === "RAMA" ? "text-blue-300" : "text-red-300"}`}>{humanTerritory}</span>
              <div className="flex-1 h-2.5 rounded-full bg-slate-700 overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-500 ${humanFaction === "RAMA" ? "bg-blue-500" : "bg-red-500"}`}
                  style={{ width: `${(humanTerritory / totalTerr) * 100}%` }}
                />
                <div
                  className={`h-full transition-all duration-500 ${aiFaction === "LANKA" ? "bg-red-600" : "bg-blue-600"}`}
                  style={{ width: `${(aiTerritory / totalTerr) * 100}%` }}
                />
              </div>
              <span className={`text-[10px] font-black tabular-nums w-4 ${aiFaction === "LANKA" ? "text-red-400" : "text-blue-300"}`}>{aiTerritory}</span>
            </div>
          </div>
        )}

        {/* ④ Deck — ultra compact */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-slate-700/80 bg-slate-800/50">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">🃏 เด็ค</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-black text-cyan-300 tabular-nums">{deckCount}</span>
              <span className="text-[9px] text-slate-600">({discardCount} ทิ้ง)</span>
              {deckCount === 0 && discardCount > 0 && (
                <span className="text-[9px] text-amber-400 font-semibold">♻️</span>
              )}
            </div>
          </div>
          {nextCard && (
            <div className="flex flex-col items-end gap-0.5">
              <div className="text-[8px] text-slate-600 uppercase tracking-wide">ถัดไป</div>
              <div className="flex items-center gap-1 rounded-lg bg-slate-900/60 border border-slate-700 px-1.5 py-1">
                <span className="text-base">{nextCard.icon ?? "🃏"}</span>
                <div>
                  <div className="text-[9px] font-bold text-white leading-tight truncate max-w-[64px]">{nextCard.name}</div>
                  <div className="text-[8px] text-orange-400 font-bold">⚡{nextCard.cost}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ⑤ Contextual message — only when present */}
        <AnimatePresence mode="wait">
          {message?.text && (
            <motion.div
              key={message.nonce ?? message.text}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className={[
                "px-3 py-2 rounded-xl text-xs font-semibold border",
                message.kind === "warn"
                  ? "bg-rose-900/40 border-rose-500/50 text-rose-300"
                  : "bg-emerald-900/40 border-emerald-500/50 text-emerald-300",
              ].join(" ")}
            >
              {message.kind === "warn" ? "⚠️ " : "💬 "}{message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spacer */}
        <div className="flex-1" />

        {/* ⑥ วิธีเล่น button — bottom of panel */}
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border border-slate-700/60 bg-slate-800/40 hover:bg-slate-700/50 transition text-[11px] font-semibold text-slate-400 hover:text-slate-200"
        >
          📘 วิธีเล่น / สัญลักษณ์
        </button>
      </div>

      {/* ── Modal ── */}
      <AnimatePresence>
        {showModal && <HowToPlayModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </>
  );
}
