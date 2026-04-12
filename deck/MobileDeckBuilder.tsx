"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CARD_LIBRARY, DECK_SIZE, buildDefaultDeckTemplateIds } from "@/data/cards";
import type { CardTemplate } from "@/data/cards";
import { readStoredCustomDeckTemplateIds, useGameStore } from "@/store/gameStore";
import { loadProfile } from "@/progression/progression";
import { unlockLevelHint } from "@/progression/rewards";
import type { Faction } from "@/game/types";
import {
  generateRandomDeck,
  varianceLabel,
  varianceBg,
  type RandomDeckResult,
} from "@/lib/randomDeck";
import { validateDeckOwnership } from "@/data/cards";


type FilterType    = "all" | "basic" | "hero" | "legendary";
type FilterFaction = "all" | "RAMA" | "LANKA" | "NEUTRAL";

// ─── Card detail bottom-sheet modal ──────────────────────────────────────────

function CardDetailModal({
  card,
  inDeck,
  canAdd,
  canAddReason,
  onAdd,
  onClose,
}: {
  card: CardTemplate;
  inDeck: number;
  canAdd: boolean;
  canAddReason?: string;
  onAdd: () => void;
  onClose: () => void;
}) {
  const tierBg =
    card.tier === "legendary"
      ? "from-indigo-950 via-purple-950 to-slate-950"
      : card.tier === "hero"
      ? "from-blue-950 via-slate-900 to-slate-950"
      : "from-slate-800 to-slate-950";

  const tierBadge =
    card.tier === "legendary"
      ? { label: "✨ ตำนาน", cls: "bg-purple-500/30 text-purple-200 ring-1 ring-purple-400/50" }
      : card.tier === "hero"
      ? { label: "⚔️ ฮีโร่",  cls: "bg-amber-500/20 text-yellow-200 ring-1 ring-yellow-400/40" }
      : { label: "พื้นฐาน",   cls: "bg-slate-700/60 text-slate-300 ring-1 ring-slate-500/30" };

  const stripe =
    card.cardFaction === "RAMA"    ? "from-blue-500 via-indigo-400 to-blue-600"
    : card.cardFaction === "LANKA" ? "from-red-500 via-rose-400 to-red-600"
    : "from-slate-500 via-slate-400 to-slate-500";

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        key="sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className={[
          "fixed inset-x-0 bottom-0 z-50 rounded-t-3xl overflow-hidden",
          `bg-gradient-to-b ${tierBg}`,
          "border-t-2 border-slate-700/60 shadow-[0_-12px_60px_rgba(0,0,0,0.7)]",
        ].join(" ")}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)" }}
      >
        {/* Top stripe */}
        <div className={`h-[3px] w-full bg-gradient-to-r ${stripe}`} />

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-600" />
        </div>

        {/* Header */}
        <div className="flex items-start gap-3 px-5 pt-1 pb-3">
          <span className="text-5xl leading-none drop-shadow-lg mt-1">{card.icon ?? "🃏"}</span>
          <div className="flex-1 min-w-0">
            <div className="text-xl font-black text-white leading-tight">{card.name}</div>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${tierBadge.cls}`}>
                {tierBadge.label}
              </span>
              <span className="rounded-md bg-slate-700/60 px-2 py-0.5 text-[10px] font-semibold text-slate-300 ring-1 ring-slate-500/30">
                {card.type === "skill" ? "✨ สกิล" : "👤 ยูนิต"}
              </span>
              <span className="rounded-md bg-orange-500/20 px-2 py-0.5 text-[10px] font-bold text-orange-300 ring-1 ring-orange-400/30">
                ⚡ {card.cost}
              </span>
              {inDeck > 0 && (
                <span className="rounded-md bg-blue-500/25 px-2 py-0.5 text-[10px] font-bold text-blue-300 ring-1 ring-blue-400/40">
                  ในเด็ค {inDeck}ใบ
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 border-t border-white/10" />

        {/* Body */}
        <div className="px-5 pt-3 pb-2 space-y-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
              {card.type === "skill" ? "✨ ความสามารถ" : "👤 รายละเอียด"}
            </div>
            <p className="text-sm leading-relaxed text-slate-200">{card.description}</p>
          </div>
          {card.ability && card.ability !== "ไม่มีความสามารถพิเศษ" && (
            <div className="rounded-xl bg-slate-800/80 border border-slate-700/60 px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1">
                ⚡ ความสามารถพิเศษ
              </div>
              <p className="text-sm text-amber-200 font-semibold leading-relaxed">{card.ability}</p>
            </div>
          )}
          {canAddReason && (
            <div className="rounded-xl bg-slate-700/40 border border-slate-600/40 px-4 py-2 text-center text-sm text-slate-400 font-semibold">
              🔒 {canAddReason}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-5 pt-2 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 text-sm font-semibold active:scale-95 transition-transform"
          >
            ปิด
          </button>
          <button
            onClick={() => { onAdd(); onClose(); }}
            disabled={!canAdd}
            className={[
              "flex-[2] py-3.5 rounded-2xl text-sm font-black text-white transition-all active:scale-95",
              canAdd
                ? "bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                : "bg-slate-700 opacity-50 cursor-not-allowed",
            ].join(" ")}
          >
            {canAdd ? "➕ เพิ่มเข้าเด็ค" : "ไม่สามารถเพิ่มได้"}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Deck slot card (compact visual) ─────────────────────────────────────────

function DeckSlotCard({
  templateId,
  index,
  onRemove,
  onTap,
}: {
  templateId?: string;
  index: number;
  onRemove?: (idx: number) => void;
  onTap?: (templateId: string) => void;
}) {
  const card = templateId ? CARD_LIBRARY.find((c) => c.templateId === templateId) : undefined;

  const emptySlot = (
    <div className="w-full aspect-[3/4] bg-slate-800/50 border border-slate-700/50 border-dashed rounded-xl flex items-center justify-center text-slate-600 text-lg">
      {index + 1}
    </div>
  );

  if (!card) return emptySlot;

  const tierColor =
    card.tier === "legendary" ? "from-purple-900 to-slate-900 border-purple-500/60"
    : card.tier === "hero"    ? "from-blue-900 to-slate-900 border-blue-400/50"
    : "from-slate-800 to-slate-900 border-slate-600/50";

  const stripe =
    card.cardFaction === "RAMA"    ? "from-blue-500 to-indigo-600"
    : card.cardFaction === "LANKA" ? "from-red-500 to-rose-600"
    : "from-slate-500 to-slate-600";

  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.7, opacity: 0 }}
      transition={{ duration: 0.15 }}
      className={[
        "relative w-full aspect-[3/4] rounded-xl border bg-gradient-to-b overflow-hidden",
        "flex flex-col items-center cursor-pointer active:scale-95 transition-transform",
        tierColor,
      ].join(" ")}
      onClick={() => onTap?.(card.templateId)}
    >
      {/* Top stripe */}
      <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${stripe}`} />

      {/* Remove button */}
      <button
        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600/80 text-white text-[10px] font-black flex items-center justify-center z-10 active:bg-red-500 leading-none"
        onClick={(e) => { e.stopPropagation(); onRemove?.(index); }}
      >
        ×
      </button>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-1 pt-3 pb-1 text-center">
        <div className="text-xl leading-none mb-0.5">{card.icon ?? "🃏"}</div>
        <div className="text-[8px] font-bold text-white line-clamp-2 leading-tight px-0.5">
          {card.name}
        </div>
        <div className="mt-0.5 text-[7px] text-orange-400 font-bold">⚡{card.cost}</div>
      </div>
    </motion.div>
  );
}

// ─── Library card row ─────────────────────────────────────────────────────────

function LibraryCardRow({
  card,
  inDeck,
  canAdd,
  locked,
  lockHint,
  onTap,
  onAdd,
}: {
  card: CardTemplate;
  inDeck: number;
  canAdd: boolean;
  locked: boolean;
  lockHint?: string;
  onTap: () => void;
  onAdd: () => void;
}) {
  const tierBg =
    card.tier === "legendary" ? "border-purple-500/40 bg-purple-950/30"
    : card.tier === "hero"    ? "border-blue-500/30 bg-blue-950/20"
    : "border-slate-700/50 bg-slate-800/30";

  const tierBadge =
    card.tier === "legendary" ? { label: "✨ ตำนาน", cls: "text-purple-300" }
    : card.tier === "hero"    ? { label: "⚔️ ฮีโร่",  cls: "text-yellow-300" }
    : { label: "พื้นฐาน",       cls: "text-slate-500" };

  const stripe =
    card.cardFaction === "RAMA"    ? "from-blue-500 to-indigo-600"
    : card.cardFaction === "LANKA" ? "from-red-500 to-rose-600"
    : "from-slate-500 to-slate-600";

  return (
    <div
      className={[
        "relative flex items-center gap-3 rounded-xl border px-3 py-3 transition-all active:scale-[0.98]",
        tierBg,
        locked ? "opacity-55" : "",
      ].join(" ")}
      onClick={onTap}
    >
      {/* Faction strip */}
      <div className={`absolute left-0 inset-y-0 w-[3px] rounded-l-xl bg-gradient-to-b ${stripe}`} />

      {/* Lock overlay */}
      {locked && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-slate-900/70 backdrop-blur-[1px]">
          <span className="text-2xl">🔒</span>
          <span className="text-[11px] font-semibold text-slate-300 mt-1">{lockHint}</span>
        </div>
      )}

      {/* Icon */}
      <span className="text-2xl leading-none shrink-0">{card.icon ?? "🃏"}</span>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-white truncate">{card.name}</div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`text-[10px] font-semibold ${tierBadge.cls}`}>{tierBadge.label}</span>
          <span className="text-[10px] text-slate-500">•</span>
          <span className="text-[10px] text-orange-400 font-bold">⚡{card.cost}</span>
          {inDeck > 0 && (
            <span className="text-[10px] text-blue-400 font-bold ml-1">({inDeck}ใบ)</span>
          )}
        </div>
      </div>

      {/* Add button */}
      <button
        disabled={!canAdd || locked}
        onClick={(e) => { e.stopPropagation(); onAdd(); }}
        className={[
          "flex-shrink-0 w-10 h-10 rounded-xl text-lg font-black flex items-center justify-center transition-all active:scale-90",
          canAdd && !locked
            ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.35)]"
            : "bg-slate-700/50 text-slate-600 cursor-not-allowed",
        ].join(" ")}
      >
        +
      </button>
    </div>
  );
}

// ─── Main Mobile Deck Builder ─────────────────────────────────────────────────

export function MobileDeckBuilder({ onBack }: { onBack?: () => void }) {
  const saveCustomDeck  = useGameStore((s) => s.saveCustomDeck);
  const playerFaction   = useGameStore((s) => s.playerFaction);
  const setPlayerFaction = useGameStore((s) => s.setPlayerFaction);

  const [filterType,    setFilterType]    = React.useState<FilterType>("all");
  const [filterFaction, setFilterFaction] = React.useState<FilterFaction>("all");
  const [search,        setSearch]        = React.useState("");
  const [deckIds,       setDeckIds]       = React.useState<string[]>([]);
  const [warn,          setWarn]          = React.useState<{ text: string; kind: "ok" | "err" } | null>(null);
  const [playerLevel,   setPlayerLevel]   = React.useState<number>(1);
  const [ownedIds,      setOwnedIds]      = React.useState<string[]>([]);
  const [modalCard,     setModalCard]     = React.useState<CardTemplate | null>(null);
  const [activeSection, setActiveSection] = React.useState<"deck" | "library">("deck");

  // ── Random deck state ──────────────────────────────────────────────────────
  const [randomResult,  setRandomResult]  = React.useState<RandomDeckResult | null>(null);

  React.useEffect(() => {
    const profile = loadProfile();
    setPlayerLevel(profile.level);
    const owned = profile.ownedCardTemplateIds || [];
    setOwnedIds(owned);

    const parsed = readStoredCustomDeckTemplateIds(playerFaction);
    const rawDeck = parsed && parsed.length ? parsed : buildDefaultDeckTemplateIds(playerFaction, owned);
    setDeckIds(validateDeckOwnership(rawDeck, playerFaction, owned));
  }, [playerFaction]);

  // Lock body scroll
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Auto-dismiss warn
  React.useEffect(() => {
    if (!warn) return;
    const t = setTimeout(() => setWarn(null), 2200);
    return () => clearTimeout(t);
  }, [warn]);

  const counts = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const id of deckIds) map.set(id, (map.get(id) ?? 0) + 1);
    return map;
  }, [deckIds]);

  const summary = React.useMemo(() => {
    const cards = deckIds.map((id) => CARD_LIBRARY.find((c) => c.templateId === id)).filter(Boolean);
    return {
      basics:  cards.filter((c) => c!.tier === "basic").length,
      heroes:  cards.filter((c) => c!.tier === "hero").length,
      legends: cards.filter((c) => c!.tier === "legendary").length,
    };
  }, [deckIds]);

  const validateCanAdd = (templateId: string, source = deckIds): string | undefined => {
    if (source.length >= DECK_SIZE) return "เด็คเต็มแล้ว (20 ใบ)";
    const card = CARD_LIBRARY.find((c) => c.templateId === templateId);
    if (!card) return "ไม่พบการ์ด";
    if (!(card.cardFaction === playerFaction || card.cardFaction === "NEUTRAL")) return "ไม่ใช่การ์ดฝ่ายนี้";
    if (!ownedIds.includes(templateId)) return "ยังไม่ได้ซื้อ";
    const current = source.filter((id) => id === templateId).length;
    const maxDup  = card.tier === "basic" ? 4 : card.tier === "hero" ? 2 : 1;
    if (current >= maxDup) return "เพิ่มได้สูงสุดแล้ว";
    return undefined;
  };

  const removeAt = (idx: number) => {
    const next = [...deckIds];
    next.splice(idx, 1);
    setDeckIds(next);
  };

  const addCard = (templateId: string) => {
    const reason = validateCanAdd(templateId);
    if (reason) { setWarn({ text: reason, kind: "err" }); return; }
    setDeckIds((prev) => [...prev, templateId].slice(0, DECK_SIZE));
    setWarn({ text: "✅ เพิ่มการ์ดแล้ว", kind: "ok" });
  };

  const save = () => {
    const result = saveCustomDeck(deckIds);
    if (!result.ok) { setWarn({ text: result.reason ?? "บันทึกไม่สำเร็จ", kind: "err" }); return; }
    setWarn({ text: "💾 บันทึกเด็คสำเร็จ!", kind: "ok" });
  };

  // ── Random deck handlers ───────────────────────────────────────────────────
  const rollRandomDeck = () => {
    const result = generateRandomDeck(playerFaction, ownedIds, Date.now());
    setRandomResult(result);
  };

  const rerollRandomDeck = () => {
    const result = generateRandomDeck(playerFaction, ownedIds, Date.now());
    setRandomResult(result);
  };

  const acceptRandomDeck = () => {
    if (!randomResult) return;
    setDeckIds(randomResult.ids);
    setRandomResult(null);
    setActiveSection("deck");
    setWarn({ text: `🎲 เด็ค ${randomResult.archetype.nameThai} ${randomResult.archetype.emoji} พร้อมแล้ว!`, kind: "ok" });
  };

  const dismissRandomDeck = () => setRandomResult(null);

  const filteredCards = CARD_LIBRARY.filter((c) => {
    if (filterType    !== "all" && c.tier         !== filterType)    return false;
    if (filterFaction !== "all" && c.cardFaction  !== filterFaction) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const deckFull    = deckIds.length >= DECK_SIZE;
  const deckBadBasic= summary.basics < 8;
  const deckBadLeg  = summary.legends > 3;
  const deckValid   = deckIds.length === DECK_SIZE && !deckBadBasic && !deckBadLeg;

  return (
    <div
      className="bg-slate-950 text-slate-100 font-sans flex flex-col"
      style={{ height: "100dvh", overflow: "hidden" }}
    >
      {/* ══ HEADER ══════════════════════════════════════════════════════════════ */}
      <header className="flex-shrink-0 flex items-center justify-between px-3 py-2.5 bg-slate-900/90 border-b border-slate-800 z-10">
        <div className="flex items-center gap-2">
          <span className="text-base font-black text-white">🃏 จัดเด็ค</span>
          <span className={[
            "text-sm font-black tabular-nums px-2 py-0.5 rounded-lg",
            deckFull ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400",
          ].join(" ")}>
            {deckIds.length}/{DECK_SIZE}
          </span>
        </div>

        {/* Faction toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-700 p-0.5 text-xs font-bold">
          <button
            onClick={() => setPlayerFaction("RAMA" as Faction)}
            className={[
              "rounded-md px-2.5 py-1 transition-all",
              playerFaction === "RAMA" ? "bg-blue-600 text-white" : "text-slate-400",
            ].join(" ")}
          >
            พระราม
          </button>
          <button
            onClick={() => setPlayerFaction("LANKA" as Faction)}
            className={[
              "rounded-md px-2.5 py-1 transition-all",
              playerFaction === "LANKA" ? "bg-fuchsia-700 text-white" : "text-slate-400",
            ].join(" ")}
          >
            ลงกา
          </button>
        </div>

        <button
          onClick={onBack}
          className="text-slate-400 text-xl px-2 py-1 active:text-white transition"
        >
          ✕
        </button>
      </header>

      {/* ══ DECK SUMMARY ════════════════════════════════════════════════════════ */}
      <div className="flex-shrink-0 mx-3 mt-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>พื้นฐาน <span className="text-white font-bold">{summary.basics}</span></span>
            <span className="text-slate-700">•</span>
            <span>ฮีโร่ <span className="text-yellow-300 font-bold">{summary.heroes}</span></span>
            <span className="text-slate-700">•</span>
            <span>ตำนาน <span className="text-purple-300 font-bold">{summary.legends}</span></span>
          </div>
          {deckValid && <span className="text-[10px] text-emerald-400 font-bold">✅ พร้อมเล่น</span>}
        </div>

        {/* Fill bar */}
        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={[
              "h-full rounded-full transition-all duration-500",
              deckValid ? "bg-gradient-to-r from-emerald-500 to-green-400"
              : deckFull ? "bg-gradient-to-r from-orange-500 to-yellow-400"
              : "bg-gradient-to-r from-blue-500 to-indigo-400",
            ].join(" ")}
            style={{ width: `${(deckIds.length / DECK_SIZE) * 100}%` }}
          />
        </div>

        {/* Warnings */}
        <div className="mt-1.5 flex flex-wrap gap-1">
          {deckBadBasic && <span className="text-[9px] text-rose-400 font-semibold">⚠ ต้องมีพื้นฐานอย่างน้อย 8 ใบ</span>}
          {deckBadLeg   && <span className="text-[9px] text-rose-400 font-semibold">⚠ ตำนานเกิน 3 ใบ</span>}
        </div>
      </div>

      {/* ══ SECTION TABS ════════════════════════════════════════════════════════ */}
      <div className="flex-shrink-0 flex mx-3 mt-2 rounded-xl bg-slate-900 border border-slate-800 p-1 gap-1">
        {(["deck", "library"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={[
              "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
              activeSection === s
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-500 hover:text-slate-300",
            ].join(" ")}
          >
            {s === "deck" ? `🃏 เด็ค (${deckIds.length})` : "📚 คลังการ์ด"}
          </button>
        ))}
      </div>

      {/* ══ MAIN CONTENT (scrollable) ════════════════════════════════════════════ */}
      <div className="flex-1 min-h-0 overflow-y-auto">

        {/* ── DECK VIEW ──────────────────────────────────────────────────────── */}
        {activeSection === "deck" && (
          <div className="px-3 pt-3 pb-4">
            <AnimatePresence>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: DECK_SIZE }).map((_, i) => {
                  const id = deckIds[i];
                  return (
                    <DeckSlotCard
                      key={i}
                      index={i}
                      templateId={id}
                      onRemove={removeAt}
                      onTap={(tid) => {
                        const c = CARD_LIBRARY.find((x) => x.templateId === tid);
                        if (c) setModalCard(c);
                      }}
                    />
                  );
                })}
              </div>
            </AnimatePresence>
          </div>
        )}

        {/* ── LIBRARY VIEW ───────────────────────────────────────────────────── */}
        {activeSection === "library" && (
          <div className="px-3 pt-3 pb-4">
            {/* Search */}
            <div className="relative mb-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 ค้นหาชื่อการ์ด..."
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 transition"
              />
              {search && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg leading-none"
                  onClick={() => setSearch("")}
                >
                  ×
                </button>
              )}
            </div>

            {/* Filter pills */}
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {(["all", "basic", "hero", "legendary"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={[
                    "flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all",
                    filterType === t
                      ? t === "legendary" ? "bg-purple-600 text-white"
                        : t === "hero" ? "bg-amber-500 text-white"
                        : "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-400 border border-slate-700",
                  ].join(" ")}
                >
                  {t === "all" ? "ทั้งหมด" : t === "basic" ? "พื้นฐาน" : t === "hero" ? "ฮีโร่" : "✨ ตำนาน"}
                </button>
              ))}
              <div className="w-px bg-slate-700 mx-1 flex-shrink-0" />
              {(["all", "RAMA", "LANKA", "NEUTRAL"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterFaction(f)}
                  className={[
                    "flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all",
                    filterFaction === f
                      ? f === "RAMA" ? "bg-blue-600 text-white"
                        : f === "LANKA" ? "bg-fuchsia-700 text-white"
                        : "bg-slate-600 text-white"
                      : "bg-slate-800 text-slate-400 border border-slate-700",
                  ].join(" ")}
                >
                  {f === "all" ? "ทุกฝ่าย" : f === "RAMA" ? "พระราม" : f === "LANKA" ? "ลงกา" : "กลาง"}
                </button>
              ))}
            </div>

            {/* Card list */}
            <div className="flex flex-col gap-2">
              {filteredCards.map((c) => {
                const locked   = !ownedIds.includes(c.templateId);
                const lockHint = locked ? "ยังไม่ได้ซื้อ" : undefined;
                const inDeck   = counts.get(c.templateId) ?? 0;
                const reason   = validateCanAdd(c.templateId);
                return (
                  <LibraryCardRow
                    key={c.templateId}
                    card={c}
                    inDeck={inDeck}
                    canAdd={!reason}
                    locked={locked}
                    lockHint={lockHint}
                    onTap={() => setModalCard(c)}
                    onAdd={() => addCard(c.templateId)}
                  />
                );
              })}
              {filteredCards.length === 0 && (
                <div className="text-center text-slate-500 text-sm py-8">ไม่พบการ์ดที่ตรงกัน</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ══ ACTION BUTTONS (fixed bottom, above safe area) ══════════════════════ */}
      <div
        className="flex-shrink-0 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md px-3 pt-2 pb-3 z-10"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
      >
        {/* Toast */}
        <AnimatePresence>
          {warn && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className={[
                "mb-2 text-center text-xs font-semibold py-1.5 rounded-xl",
                warn.kind === "ok"
                  ? "bg-emerald-900/50 text-emerald-300 border border-emerald-700/40"
                  : "bg-rose-900/50 text-rose-300 border border-rose-700/40",
              ].join(" ")}
            >
              {warn.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Random Deck Preview Panel ───────────────────────────────────── */}
        <AnimatePresence>
          {randomResult && (
            <motion.div
              key="random-preview"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="mb-3 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-950/60 to-slate-900/80 overflow-hidden"
            >
              {/* Top accent bar */}
              <div className="h-[2px] w-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />

              <div className="px-4 py-3 space-y-2.5">
                {/* Archetype title */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl leading-none">{randomResult.archetype.emoji}</span>
                    <div>
                      <div className="text-xs text-amber-400 font-bold uppercase tracking-widest">เด็คแบบ</div>
                      <div className="text-base font-black text-white leading-tight">
                        {randomResult.archetype.nameThai}
                      </div>
                    </div>
                  </div>
                  <span
                    className={[
                      "text-[10px] font-bold px-2.5 py-1 rounded-full border",
                      varianceBg(randomResult.variance),
                    ].join(" ")}
                  >
                    {varianceLabel(randomResult.variance)}
                  </span>
                </div>

                {/* Card composition stats */}
                <div className="flex items-center gap-3 text-[11px]">
                  {(() => {
                    const previewCards = randomResult.ids.map((id) =>
                      CARD_LIBRARY.find((c) => c.templateId === id)
                    ).filter(Boolean);
                    const b = previewCards.filter((c) => c!.tier === "basic").length;
                    const h = previewCards.filter((c) => c!.tier === "hero").length;
                    const l = previewCards.filter((c) => c!.tier === "legendary").length;
                    const lc = previewCards.filter((c) => c!.cost <= 2).length;
                    return (
                      <>
                        <span className="text-slate-400">พื้นฐาน <span className="text-white font-bold">{b}</span></span>
                        <span className="text-slate-700">•</span>
                        <span className="text-slate-400">ฮีโร่ <span className="text-yellow-300 font-bold">{h}</span></span>
                        <span className="text-slate-700">•</span>
                        <span className="text-slate-400">ตำนาน <span className="text-purple-300 font-bold">{l}</span></span>
                        <span className="text-slate-700">•</span>
                        <span className="text-slate-400">ราคาถูก <span className="text-emerald-300 font-bold">{lc}</span></span>
                      </>
                    );
                  })()}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={dismissRandomDeck}
                    className="flex-none px-3.5 py-2.5 rounded-xl bg-slate-700/80 border border-slate-600/50 text-slate-300 text-xs font-bold active:scale-95 transition-transform"
                  >
                    ✕
                  </button>
                  <button
                    onClick={rerollRandomDeck}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 border bg-amber-700/60 border-amber-600/50 text-amber-200"
                  >
                    🎲 สุ่มใหม่
                  </button>
                  <button
                    onClick={acceptRandomDeck}
                    className="flex-[1.5] py-2.5 rounded-xl bg-amber-500 text-slate-900 text-xs font-black active:scale-95 transition-transform shadow-[0_0_16px_rgba(245,158,11,0.4)]"
                  >
                    ✅ ใช้เด็คนี้
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Existing action buttons ─────────────────────────────────────── */}

        {/* Random deck button — full width */}
        <button
          onClick={rollRandomDeck}
          className="w-full mb-2 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-900 text-xs font-black active:scale-95 transition-transform shadow-[0_0_18px_rgba(245,158,11,0.35)] flex items-center justify-center gap-2"
        >
          <span className="text-base">🎲</span>
          <span>สุ่มเด็ค</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => { if (!window.confirm("ลบเด็คทั้งหมด?")) return; setDeckIds([]); setWarn({ text: "🗑 ลบเด็คแล้ว", kind: "ok" }); }}
            className="py-3 rounded-xl bg-rose-700/80 border border-rose-600/50 text-white text-xs font-bold active:scale-95 transition-transform"
          >
            🔥 ล้างเด็ค
          </button>
          <button
            onClick={() => { setDeckIds(buildDefaultDeckTemplateIds(playerFaction, ownedIds)); setWarn({ text: "🤖 จัดเด็คอัตโนมัติ", kind: "ok" }); }}
            className="py-3 rounded-xl bg-indigo-700/80 border border-indigo-600/50 text-white text-xs font-bold active:scale-95 transition-transform"
          >
            🤖 อัตโนมัติ
          </button>
          <button
            onClick={onBack}
            className="py-3 rounded-xl bg-slate-700/80 border border-slate-600/50 text-slate-300 text-xs font-bold active:scale-95 transition-transform"
          >
            ← กลับ
          </button>
          <button
            onClick={save}
            className="py-3 rounded-xl bg-blue-600 text-white text-xs font-black active:scale-95 transition-transform shadow-[0_0_16px_rgba(37,99,235,0.4)]"
          >
            💾 บันทึกเด็ค
          </button>
        </div>
      </div>

      {/* ══ CARD DETAIL MODAL ═══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {modalCard && (
          <CardDetailModal
            key={modalCard.templateId}
            card={modalCard}
            inDeck={counts.get(modalCard.templateId) ?? 0}
            canAdd={!validateCanAdd(modalCard.templateId)}
            canAddReason={validateCanAdd(modalCard.templateId)}
            onAdd={() => addCard(modalCard.templateId)}
            onClose={() => setModalCard(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
