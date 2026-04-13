"use client";

import * as React from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CARD_LIBRARY, DECK_SIZE, buildDefaultDeckTemplateIds, validateDeckOwnership } from "@/data/cards";
import { readStoredCustomDeckTemplateIds, useGameStore } from "@/store/gameStore";
import { DraggableCard } from "./DraggableCard";
import { DroppableDeck, RemoveZone } from "./DroppableDeck";
import { loadProfile } from "@/progression/progression";
import { unlockLevelHint } from "@/progression/rewards";
import {
  generateRandomDeck,
  varianceLabel,
  varianceBg,
  type RandomDeckResult,
} from "@/lib/randomDeck";

type FilterType = "all" | "basic" | "hero" | "legendary";
type FilterFaction = "all" | "RAMA" | "LANKA" | "NEUTRAL";

export function DeckBuilder({ onBack }: { onBack?: () => void }) {
  const saveCustomDeck = useGameStore((s) => s.saveCustomDeck);
  const playerFaction = useGameStore((s) => s.playerFaction);
  const setPlayerFaction = useGameStore((s) => s.setPlayerFaction);
  const [filterType, setFilterType] = React.useState<FilterType>("all");
  const [filterFaction, setFilterFaction] = React.useState<FilterFaction>("all");
  const [search, setSearch] = React.useState("");
  const [deckIds, setDeckIds] = React.useState<string[]>([]);
  const [warn, setWarn] = React.useState("");
  const [invalidPulse, setInvalidPulse] = React.useState(false);
  const [activeDragTemplateId, setActiveDragTemplateId] = React.useState<string>();
  const [previewTemplateId, setPreviewTemplateId] = React.useState<string>();
  const [playerLevel, setPlayerLevel] = React.useState<number>(1);
  const [ownedIds, setOwnedIds] = React.useState<string[]>([]);
  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor));

  // ── Random deck state
  const [randomResult, setRandomResult] = React.useState<RandomDeckResult | null>(null);

  React.useEffect(() => {
    const profile = loadProfile();
    setPlayerLevel(profile.level);
    const owned = profile.ownedCardTemplateIds || [];
    setOwnedIds(owned);

    const parsed = readStoredCustomDeckTemplateIds(playerFaction);
    const rawDeck = parsed && parsed.length ? parsed : buildDefaultDeckTemplateIds(playerFaction, owned);
    setDeckIds(validateDeckOwnership(rawDeck, playerFaction, owned));
  }, [playerFaction]);

  const counts = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const id of deckIds) map.set(id, (map.get(id) ?? 0) + 1);
    return map;
  }, [deckIds]);

  const summary = React.useMemo(() => {
    const cards = deckIds.map((id) => CARD_LIBRARY.find((c) => c.templateId === id)).filter(Boolean);
    const basics = cards.filter((c) => c!.tier === "basic").length;
    const heroes = cards.filter((c) => c!.tier === "hero").length;
    const legends = cards.filter((c) => c!.tier === "legendary").length;
    return { basics, heroes, legends };
  }, [deckIds]);

  const filteredCards = CARD_LIBRARY.filter((c) => {
    if (filterType !== "all" && c.tier !== filterType) return false;
    if (filterFaction !== "all" && c.cardFaction !== filterFaction) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const canAdd = (templateId: string, sourceDeck = deckIds) => {
    if (sourceDeck.length >= DECK_SIZE) return "เด็คเต็มแล้ว (20 ใบ)";
    const card = CARD_LIBRARY.find((c) => c.templateId === templateId);
    if (!card) return "ไม่พบการ์ด";
    if (!(card.cardFaction === playerFaction || card.cardFaction === "NEUTRAL")) return "ไม่สามารถเพิ่มการ์ดนี้ได้";
    // Lock check
    if (!ownedIds.includes(templateId)) return "ยังไม่ได้ซื้อ";
    const current = sourceDeck.filter((id) => id === templateId).length;
    const maxDup = card.tier === "basic" ? 4 : card.tier === "hero" ? 2 : 1;
    if (current >= maxDup) return "ไม่สามารถเพิ่มการ์ดนี้ได้";
    return undefined;
  };

  const removeAt = (idx: number) => {
    if (idx < 0) return;
    const next = [...deckIds];
    next.splice(idx, 1);
    setDeckIds(next);
  };

  const save = () => {
    const result = saveCustomDeck(deckIds);
    if (!result.ok) {
      setWarn(result.reason ?? "บันทึกเด็คไม่สำเร็จ");
      return;
    }
    setWarn("💾 บันทึกเด็คสำเร็จ");
  };

  // ── Random deck handlers
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
    setWarn(`🎲 เด็ค ${randomResult.archetype.nameThai} ${randomResult.archetype.emoji} พร้อมแล้ว!`);
  };

  const dismissRandomDeck = () => setRandomResult(null);

  const addCard = (templateId: string) => {
    const reason = canAdd(templateId);
    if (reason) {
      setWarn(reason);
      setInvalidPulse(true);
      window.setTimeout(() => setInvalidPulse(false), 240);
      return;
    }
    setDeckIds((prev) => [...prev, templateId].slice(0, DECK_SIZE));
    setWarn("เพิ่มการ์ดแล้ว");
  };

  const handleDragStart = (id: string) => {
    if (id.startsWith("lib:")) setActiveDragTemplateId(id.replace("lib:", ""));
    else if (id.startsWith("deck:")) setActiveDragTemplateId(id.split(":")[2]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : "";
    setActiveDragTemplateId(undefined);
    if (!overId && activeId.startsWith("deck:")) {
      const idx = Number(activeId.split(":")[1]);
      if (!Number.isNaN(idx)) removeAt(idx);
      return;
    }
    if (activeId.startsWith("lib:")) {
      const templateId = activeId.replace("lib:", "");
      if (!(overId === "deck-root" || overId.startsWith("slot:"))) return;
      const reason = canAdd(templateId);
      if (reason) return addCard(templateId);
      const next = [...deckIds];
      if (overId.startsWith("slot:")) {
        const idx = Number(overId.replace("slot:", ""));
        next.splice(Math.max(0, Math.min(next.length, idx)), 0, templateId);
      } else next.push(templateId);
      setDeckIds(next.slice(0, DECK_SIZE));
      setWarn("เพิ่มการ์ดแล้ว");
      return;
    }
    if (activeId.startsWith("deck:")) {
      const from = Number(activeId.split(":")[1]);
      if (Number.isNaN(from)) return;
      if (overId === "remove-zone" || !overId) return removeAt(from);
      if (overId.startsWith("slot:")) {
        const to = Number(overId.replace("slot:", ""));
        if (Number.isNaN(to) || to === from || from >= deckIds.length) return;
        const next = [...deckIds];
        const [moved] = next.splice(from, 1);
        next.splice(Math.min(to, next.length), 0, moved!);
        setDeckIds(next);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e) => handleDragStart(String(e.active.id))}
      onDragEnd={handleDragEnd}
    >
      <div className="grid h-full min-h-0 grid-cols-2 gap-6">
        <div className="min-h-0 rounded-2xl border border-slate-500/70 bg-slate-900 p-4 text-white shadow-md">
          <div className="flex h-full min-h-0 flex-col">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-bold">คลังการ์ด</div>
              <div className="flex items-center gap-1 rounded-lg border border-slate-600 p-0.5 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setPlayerFaction("RAMA")}
                  className={[
                    "rounded-md px-2 py-1 transition",
                    playerFaction === "RAMA" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800",
                  ].join(" ")}
                >
                  ฝ่ายพระราม
                </button>
                <button
                  type="button"
                  onClick={() => setPlayerFaction("LANKA")}
                  className={[
                    "rounded-md px-2 py-1 transition",
                    playerFaction === "LANKA" ? "bg-fuchsia-700 text-white" : "text-slate-300 hover:bg-slate-800",
                  ].join(" ")}
                >
                  ฝ่ายลงกา
                </button>
              </div>
            </div>
            <div className="mb-1 text-xs text-slate-400">กำลังแก้ไขเด็ค: {playerFaction === "RAMA" ? "พระราม" : "ลงกา"} (บันทึกแยกตามฝ่าย)</div>
            <div className="mb-2 flex items-center justify-end">
              <div className="text-xs text-slate-300">ค้นหา/กรองการ์ด</div>
            </div>
            <div className="mb-2 flex gap-2">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาชื่อการ์ด..." className="w-full rounded bg-slate-800 px-2 py-1 text-xs" />
            </div>
            <div className="mb-2 flex gap-2">
              <select value={filterType} onChange={(e) => setFilterType(e.target.value as FilterType)} className="rounded bg-slate-800 px-2 py-1 text-xs">
                <option value="all">ทุกประเภท</option><option value="basic">Basic</option><option value="hero">Hero</option><option value="legendary">Legendary</option>
              </select>
              <select value={filterFaction} onChange={(e) => setFilterFaction(e.target.value as FilterFaction)} className="rounded bg-slate-800 px-2 py-1 text-xs">
                <option value="all">ทุกฝ่าย</option>
                <option value="RAMA">พระราม</option>
                <option value="LANKA">ลงกา</option>
                <option value="NEUTRAL">กลาง</option>
              </select>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-slate-700 p-2">
          <div className="grid grid-cols-1 gap-1">
          {filteredCards.map((c) => {
            const locked = !ownedIds.includes(c.templateId);
            const lockHint = locked ? "ยังไม่ได้ซื้อ" : undefined;
            return (
              <div
                key={c.templateId}
                onMouseEnter={() => setPreviewTemplateId(c.templateId)}
                onClick={() => setPreviewTemplateId(c.templateId)}
                className={[
                  "relative flex items-center justify-between gap-2 rounded-xl border p-2",
                  locked
                    ? "border-slate-600 bg-slate-800/30 opacity-70"
                    : "border-slate-700 bg-slate-900/40",
                ].join(" ")}
              >
                {/* Lock overlay */}
                {locked && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-slate-900/80 backdrop-blur-[1px]">
                    <span className="text-2xl">🔒</span>
                    <span className="mt-1 text-[11px] font-semibold text-slate-300">{lockHint}</span>
                  </div>
                )}
                <div className="flex-1">
                  <DraggableCard templateId={c.templateId} source="library" disabled={Boolean(canAdd(c.templateId))} />
                </div>
                <span className="text-slate-300">{c.cardFaction === "LANKA" ? "ฝ่ายลงกา" : counts.get(c.templateId) ?? 0}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addCard(c.templateId);
                  }}
                  disabled={Boolean(canAdd(c.templateId))}
                  className="rounded-lg bg-blue-600 px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-40"
                >
                  + เพิ่ม
                </button>
              </div>
            );
          })}
        </div>
            </div>
            <div className="mt-2 rounded-xl border border-slate-700 bg-slate-800/60 p-3 text-xs">
              {(() => {
                const p = CARD_LIBRARY.find((x) => x.templateId === previewTemplateId);
                if (!p) return <div className="text-slate-400">วางเมาส์บนการ์ดเพื่อดูความสามารถ</div>;
                return (
                  <div>
                  <div className="flex items-center gap-2">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="h-8 w-auto object-contain drop-shadow-sm" />
                    ) : (
                      <span className="text-xl">{p.icon}</span>
                    )}
                    <div className="text-sm font-bold text-white">{p.name}</div>
                  </div>
                    <div className="mt-1 text-slate-300">พลังงาน {p.cost} • {p.tier}</div>
                    <div className="mt-1 text-slate-100">ความสามารถ: {p.ability?.trigger !== "-" ? (p.ability?.action === "ไม่มี" ? p.ability?.result : `${p.ability?.action} ➔ ${p.ability?.result}`) : "ไม่มี"}</div>
                    <div className="text-slate-400">คำอธิบาย: {p.description}</div>
                  </div>
                );
              })()}
            </div>
          </div>
      </div>
      <div className="min-h-0 rounded-2xl border border-slate-500/70 bg-slate-900 p-4 text-white shadow-md">
        <div className="flex h-full min-h-0 flex-col">
          <div className="mb-2">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-bold">เด็คปัจจุบัน</div>
              <div className="text-xs text-slate-300">{deckIds.length} / {DECK_SIZE}</div>
            </div>
            <div className="mb-2 text-xs text-slate-300">Basic: {summary.basics} • Hero: {summary.heroes} • Legendary: {summary.legends}</div>
            <div className="mb-2 grid grid-cols-10 gap-1">
              {Array.from({ length: DECK_SIZE }).map((_, i) => (
                <div key={i} className={["h-3 rounded", i < deckIds.length ? "bg-blue-500/60" : "bg-slate-700"].join(" ")} />
              ))}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <DroppableDeck
              deckIds={deckIds}
              invalidPulse={invalidPulse}
              onRemoveAt={removeAt}
              onPreview={setPreviewTemplateId}
              selectedTemplateId={previewTemplateId}
            />
          </div>
          <div className="mt-2">
            <RemoveZone />
          </div>
          <div className="mt-2 rounded border border-slate-700 bg-slate-800/60 p-2 text-xs">
            พื้นฐานอย่างน้อย 8 ใบ • ตำนานไม่เกิน 3 ใบ
            {deckIds.length >= DECK_SIZE ? <div className="mt-1 text-rose-300">⚠️ เด็คเต็มแล้ว (20 ใบ)</div> : null}
            {summary.basics < 8 ? <div className="mt-1 text-rose-300">⚠️ ต้องมีการ์ดพื้นฐานอย่างน้อย 8 ใบ</div> : null}
            {summary.legends > 3 ? <div className="mt-1 text-rose-300">⚠️ การ์ดตำนานเกินกำหนด</div> : null}
            {warn ? <div className="mt-1 text-emerald-300">{warn}</div> : null}
          </div>
          <div className="mt-2 space-y-2">

            {/* ── Random Deck Preview Panel */}
            {randomResult && (
              <div className="rounded-xl border border-amber-500/40 bg-gradient-to-b from-amber-950/70 to-slate-900/80 overflow-hidden">
                <div className="h-[2px] w-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
                <div className="px-3 py-2.5 space-y-2">
                  {/* Archetype title row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl leading-none">{randomResult.archetype.emoji}</span>
                      <div>
                        <div className="text-[9px] text-amber-400 font-bold uppercase tracking-widest">เด็คแบบ</div>
                        <div className="text-sm font-black text-white leading-tight">{randomResult.archetype.nameThai}</div>
                      </div>
                    </div>
                    <span className={["text-[9px] font-bold px-2 py-0.5 rounded-full border", varianceBg(randomResult.variance)].join(" ")}>
                      {varianceLabel(randomResult.variance)}
                    </span>
                  </div>
                  {/* Stats */}
                  <div className="flex items-center gap-2 text-[10px]">
                    {(() => {
                      const cards = randomResult.ids.map((id) => CARD_LIBRARY.find((c) => c.templateId === id)).filter(Boolean);
                      return (
                        <>
                          <span className="text-slate-400">พื้นฐาน <span className="text-white font-bold">{cards.filter((c) => c!.tier === "basic").length}</span></span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-400">ฮีโร่ <span className="text-yellow-300 font-bold">{cards.filter((c) => c!.tier === "hero").length}</span></span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-400">ตำนาน <span className="text-purple-300 font-bold">{cards.filter((c) => c!.tier === "legendary").length}</span></span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-400">ราคาถูก <span className="text-emerald-300 font-bold">{cards.filter((c) => c!.cost <= 2).length}</span></span>
                        </>
                      );
                    })()}
                  </div>
                  {/* Actions */}
                  <div className="flex gap-1.5">
                    <button
                      onClick={dismissRandomDeck}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-700/80 border border-slate-600/50 text-slate-300 text-[10px] font-bold hover:bg-slate-600/80 transition"
                    >
                      ✕
                    </button>
                    <button
                      onClick={rerollRandomDeck}
                      className="flex-1 py-1.5 rounded-lg text-[10px] font-bold transition border bg-amber-800/60 border-amber-600/50 text-amber-200 hover:bg-amber-700/60"
                    >
                      🎲 สุ่มใหม่
                    </button>
                    <button
                      onClick={acceptRandomDeck}
                      className="flex-[1.4] py-1.5 rounded-lg bg-amber-500 text-slate-900 text-[10px] font-black hover:bg-amber-400 transition shadow-[0_0_12px_rgba(245,158,11,0.35)]"
                    >
                      ✅ ใช้เด็คนี้
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── 🎲 สุ่มเด็ค button — full width */}
            <button
              onClick={rollRandomDeck}
              className="w-full py-2 rounded-lg bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-900 text-xs font-black hover:from-amber-500 hover:to-yellow-400 transition shadow-[0_0_14px_rgba(245,158,11,0.3)] flex items-center justify-center gap-1.5"
            >
              <span>🎲</span> สุ่มเด็ค
            </button>

            {/* ── Existing action grid */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  if (!window.confirm("คุณต้องการลบเด็คทั้งหมดหรือไม่?")) return;
                  setDeckIds([]);
                  setWarn("ลบเด็คทั้งหมดแล้ว");
                }}
                className="rounded bg-rose-700 px-3 py-1.5 text-xs font-semibold hover:bg-rose-600 transition"
              >
                🔥 ลบเด็คทั้งหมด
              </button>
              <button
                onClick={() => setDeckIds(buildDefaultDeckTemplateIds(playerFaction, ownedIds))}
                className="rounded bg-indigo-700 px-3 py-1.5 text-xs font-semibold hover:bg-indigo-600 transition"
              >
                🤖 จัดเด็คอัตโนมัติ
              </button>
              <button onClick={save} className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold hover:bg-blue-500 transition">💾 บันทึกเด็ค</button>
              <button onClick={() => onBack?.()} className="rounded bg-slate-700 px-3 py-1.5 text-xs font-semibold hover:bg-slate-600 transition">🔙 กลับเมนู</button>
            </div>
          </div>
        </div>
      </div>
      </div>
      <DragOverlay>
        {activeDragTemplateId ? (
          <div className="w-44 scale-105 drop-shadow-xl">
            <DraggableCard templateId={activeDragTemplateId} source="library" />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

