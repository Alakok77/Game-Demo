"use client";

import * as React from "react";
import { motion } from "framer-motion";
import type { Coord, Faction } from "@/game/types";
import { getGroup, getLiberties, isSuicideUnlessCapture } from "@/game/logic";
import { useGameStore, usePreview, useSuggestion } from "@/store/gameStore";
import { Cell } from "./Cell";

function coordKey(c: { r: number; c: number }) {
  return `${c.r},${c.c}`;
}

function keyOf(c: Coord) {
  return `${c.r},${c.c}`;
}

function dotsForLiberties(n: number) {
  const k = Math.max(0, Math.min(4, n));
  return Array.from({ length: k }, (_, i) => i);
}

function dotPos(i: number) {
  // 4-corner micro dots.
  const pos = [
    "left-[18%] top-[18%]",
    "right-[18%] top-[18%]",
    "left-[18%] bottom-[18%]",
    "right-[18%] bottom-[18%]",
  ];
  return pos[i] ?? pos[0]!;
}

export function Board({ compact = false }: { compact?: boolean }) {
  const board = useGameStore((s) => s.board);
  const territory = useGameStore((s) => s.territoryMap);
  const hoverCell = useGameStore((s) => s.hoverCell);
  const selectedCardId = useGameStore((s) => s.selectedCardId);
  const phase = useGameStore((s) => s.phase);
  const active = useGameStore((s) => s.active);
  const human = useGameStore((s) => s.human);
  const ai = useGameStore((s) => s.ai);
  const cardsPlayed = useGameStore((s) => s.cardsPlayedThisTurn);
  const aiAnnounce = useGameStore((s) => s.aiAnnounce);
  const lastMove = useGameStore((s) => s.lastMove);
  const lastCaptures = useGameStore((s) => s.lastCaptures);
  const hover = useGameStore((s) => s.hoverCell);
  const selectCard = useGameStore((s) => s.selectCard);
  const setHover = useGameStore((s) => s.setHoverCell);
  const tryPlayAt = useGameStore((s) => s.tryPlayAt);
  const targetSelection = useGameStore((s) => s.targetSelection);
  const cancelTargetSelection = useGameStore((s) => s.cancelTargetSelection);
  const confirmTargetSelection = useGameStore((s) => s.confirmTargetSelection);

  const preview = usePreview();
  const suggestion = useSuggestion();
  const territoryView = preview?.ok ? preview.territoryMapAfter : territory;

  const activeSynergies = useGameStore((s) => s.activeSynergies);
  const comboFeedback = useGameStore((s) => s.comboFeedback);
  const comboState = useGameStore((s) => s.comboState);
  const dismissComboFeedback = useGameStore((s) => s.dismissComboFeedback);

  // Build set of cell keys that have active synergy
  const synergyCellKeys = React.useMemo(() => {
    const set = new Set<string>();
    for (const sc of activeSynergies) set.add(coordKey(sc.coord));
    return set;
  }, [activeSynergies]);

  // Pick first synergy label to display
  const synergyLabel = React.useMemo(() => {
    if (!activeSynergies.length) return null;
    const seen = new Set<string>();
    const labels: string[] = [];
    for (const sc of activeSynergies) {
      const k = sc.kind;
      if (!seen.has(k)) { seen.add(k); labels.push(sc.kind); }
    }
    const kindToLabel: Record<string, string> = {
      HANUMAN_RAMA: "Synergy! หนุมาน + พระราม",
      THREE_MONKEYS: "Synergy! ลิงสามตัว",
      TWO_DEMONS: "Synergy! ยักษ์คู่",
      TERRITORY: "Synergy! ยึดพื้นที่",
    };
    return labels.map((k) => kindToLabel[k] ?? "Synergy!").join(" · ");
  }, [activeSynergies]);

  // Auto-dismiss combo feedback after 1.2s
  React.useEffect(() => {
    if (!comboFeedback) return;
    const t = window.setTimeout(() => dismissComboFeedback(), 1200);
    return () => window.clearTimeout(t);
  }, [comboFeedback, dismissComboFeedback]);

  const activePS = active === "HUMAN" ? human : ai;
  const faction = activePS.faction;
  const selected = selectedCardId ? activePS.hand.find((c) => c.id === selectedCardId) : undefined;
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);
  const [captureFxKeys, setCaptureFxKeys] = React.useState<Set<string>>(new Set());
  const [skillFx, setSkillFx] = React.useState<{
    keys: Set<string>;
    effectType?: "damage" | "buff" | "aoe" | "legendary" | "summon" | "chain" | "zone_control" | "global" | "passive" | "control";
    text?: string;
    nonce: number;
  }>();

  const size = board.length;

  const validTargets = React.useMemo(() => {
    const set = new Set<string>();
    if (phase === "menu" || phase === "tutorial" || phase === "gameOver") return set;
    
    if (targetSelection) {
      // In target selection mode, allow any cell to be selected for simplicity in MVP, 
      // or customize if we build further validation.
      for (let r = 0; r < size; r++) {
         for (let c = 0; c < size; c++) {
             set.add(keyOf({ r, c }));
         }
      }
      return set;
    }

    if (!selected) return set;
    if (selected.cost > activePS.energy) return set;
    if (cardsPlayed >= 2) return set;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const at = { r, c };
        const t = board[r]![c]!;
        if (selected.type === "unit") {
          const canJumpBlock = selected.name.includes("หนุมาน");
          if (t.kind === "unit") continue;
          if (t.kind === "block" && !canJumpBlock) continue;
          const boardForPlacement = t.kind === "block" && canJumpBlock ? board.map((row) => [...row]) : board;
          if (t.kind === "block" && canJumpBlock) boardForPlacement[r]![c] = { kind: "empty" };
          if (isSuicideUnlessCapture(boardForPlacement, at, faction).ok) set.add(keyOf(at));
        } else {
          if (selected.skill.kind === "blockTile") {
            if (t.kind === "empty") set.add(keyOf(at));
          }
          if (selected.skill.kind === "destroyWeakGroup") {
            if (t.kind === "unit" && t.faction !== faction) {
              const g = getGroup(board, at);
              const libs = getLiberties(board, g).length;
              if (libs <= 2) set.add(keyOf(at));
            }
          }
          if (selected.skill.kind === "pushUnit") {
            if (t.kind === "unit" && t.faction !== faction) set.add(keyOf(at));
          }
          if (selected.skill.kind === "stormCut") {
            set.add(keyOf(at));
          }
        }
      }
    }
    return set;
  }, [selected, phase, activePS.energy, cardsPlayed, size, board, faction]);

  React.useEffect(() => {
    const captured = new Set<string>();
    for (const ev of lastCaptures) for (const p of ev.stonesRemoved) captured.add(keyOf(p));
    if (!captured.size) return;
    setCaptureFxKeys(captured);
    const t = window.setTimeout(() => setCaptureFxKeys(new Set()), 420);
    return () => window.clearTimeout(t);
  }, [lastCaptures, lastMove]);

  React.useEffect(() => {
    if (!lastMove || lastMove.kind === "pass" || lastMove.kind === "playUnit") return;
    const keys = new Set<string>();
    let effectType: "damage" | "buff" | "aoe" | "legendary" | "summon" | "chain" | "zone_control" | "global" | "passive" | "control" = "damage";
    let text = "ใช้สกิล!";
    if (lastMove.kind === "skillDestroyWeakGroup") {
      keys.add(keyOf(lastMove.targetAnyCellInEnemyGroup));
      effectType = "damage";
      text = "เผาทำลาย!";
    }
    if (lastMove.kind === "skillPushUnit") {
      keys.add(keyOf(lastMove.from));
      effectType = "buff";
      text = "ล้อมสำเร็จ!";
    }
    if (lastMove.kind === "skillBlockTile") {
      keys.add(keyOf(lastMove.at));
      effectType = "buff";
      text = "เพิ่มพลัง!";
    }
    if (lastMove.kind === "skillStormCut") {
      effectType = "legendary";
      text = "สกิลตำนาน!";
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) keys.add(keyOf({ r: lastMove.center.r + dr, c: lastMove.center.c + dc }));
      }
    }
    setSkillFx({ keys, effectType, text, nonce: Date.now() });
    const t = window.setTimeout(() => setSkillFx(undefined), 700);
    return () => window.clearTimeout(t);
  }, [lastMove]);

  const hoveredGroup = React.useMemo(() => {
    if (!hover) return new Set<string>();
    const t = board[hover.r]?.[hover.c];
    if (!t || t.kind !== "unit") return new Set<string>();
    const g = getGroup(board, hover);
    return new Set(g.map(keyOf));
  }, [hover, board]);

  const showGhost = Boolean(selected && hoverCell && preview?.ghost && preview.ghost.at.r === hoverCell.r && preview.ghost.at.c === hoverCell.c);
  const ghostFaction = selected?.type === "unit" ? faction : undefined;

  const aiFocusKey = aiAnnounce ? keyOf(aiAnnounce.at) : undefined;
  const suggestedKey = suggestion.at ? keyOf(suggestion.at) : undefined;

  return (
    !mounted ? (
      <div className="w-full h-full">
        <div className="relative rounded-xl border border-slate-700 bg-slate-900 p-1 w-full h-full shadow-[0_8px_32px_rgba(2,6,23,0.6)]">
          <div className="grid grid-cols-7 grid-rows-7 gap-[4px] sm:gap-[8px] w-full h-full">
            {Array.from({ length: 49 }).map((_, i) => (
              <div key={i} className="w-full h-full rounded sm:rounded-md bg-slate-700 border border-slate-600 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    ) : (
    <div className="w-full h-full">
      <div className="relative rounded-xl border border-slate-700 bg-slate-900 p-0.5 sm:p-1 w-full h-full shadow-[0_8px_32px_rgba(2,6,23,0.6)]">
        <div className="grid grid-cols-7 grid-rows-7 gap-[4px] sm:gap-[8px] w-full h-full">
          {board.map((row, r) =>
            row.map((tile, c) => {
              const coord: Coord = { r, c };
              const k = keyOf(coord);
              const isHovered = hoverCell?.r === r && hoverCell?.c === c;
              const isSelectedTarget = targetSelection?.selectedCoords.some(sc => sc.r === r && sc.c === c);
              const isValid = validTargets.has(k);
              const groupHovered = hoveredGroup.has(k) && tile.kind === "unit";
              const warn = isHovered && preview && !preview.ok && selected?.type === "unit";
              const suggested = suggestedKey === k && phase === "player" && active === "HUMAN";
              const aiFocus = aiFocusKey === k && phase === "aiThinking";
              const capturePreview = Boolean(preview?.ok && isHovered && preview.willCapture.length > 0);
              const skillPreview = Boolean(
                isHovered &&
                  selected?.type === "skill" &&
                  isValid &&
                  (selected.effectType === "damage" ||
                    selected.effectType === "buff" ||
                    selected.effectType === "aoe" ||
                    selected.effectType === "legendary" ||
                    selected.effectType === "summon" ||
                    selected.effectType === "chain" ||
                    selected.effectType === "zone_control" ||
                    selected.effectType === "global" ||
                    selected.effectType === "passive" ||
                    selected.effectType === "control"),
              );

              const libs =
                tile.kind === "unit"
                  ? getLiberties(board, getGroup(board, coord)).length
                  : 0;

              return (
                <div key={`${r}-${c}`} className="relative">
                  <Cell
                    coord={coord}
                    tile={tile}
                    territoryOwner={territoryView[r]![c]!}
                    humanFaction={human.faction}
                    actingFaction={faction}
                    isValidTarget={isValid}
                    isHovered={isHovered}
                    showGhost={showGhost && isHovered}
                    ghostFaction={ghostFaction}
                    warning={warn}
                    suggested={suggested}
                    aiFocus={aiFocus}
                    captureFx={captureFxKeys.has(k)}
                    hasSynergy={synergyCellKeys.has(k) && tile.kind === "unit"}
                    hasCardSelected={!!selectedCardId}
                    skillFxType={
                      skillFx?.keys.has(k)
                        ? skillFx.effectType
                        : selected?.type === "skill" &&
                            (selected.effectType === "damage" ||
                              selected.effectType === "buff" ||
                              selected.effectType === "aoe" ||
                              selected.effectType === "legendary" ||
                              selected.effectType === "summon" ||
                              selected.effectType === "chain" ||
                              selected.effectType === "zone_control" ||
                              selected.effectType === "global" ||
                              selected.effectType === "passive" ||
                              selected.effectType === "control")
                          ? selected.effectType
                          : undefined
                    }
                    skillPreview={skillPreview || Boolean(skillFx?.keys.has(k))}
                    onClick={() => {
                      if (phase !== "player" || active !== "HUMAN") return;
                      // Allow clicking target mode any time
                      if (!targetSelection && !selectedCardId) return;
                      tryPlayAt(coord);
                    }}
                    onEnter={() => setHover(coord)}
                    onLeave={() => setHover(undefined)}
                  />

                  {isSelectedTarget ? (
                    <motion.div
                      className="pointer-events-none absolute inset-0 rounded-xl ring-4 ring-blue-500 bg-blue-500/20 z-40"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: [0.8, 1, 0.8], scale: 1 }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                  ) : null}

                  {/* group outline */}
                  {groupHovered ? <div className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-white/25" /> : null}

                  {capturePreview ? (
                    <motion.div
                      initial={{ opacity: 0.35 }}
                      animate={{ opacity: [0.35, 0.9, 0.35] }}
                      transition={{ repeat: Infinity, duration: 0.9 }}
                      className="pointer-events-none absolute inset-0 rounded-xl border-2 border-red-400"
                    />
                  ) : null}

                  {/* liberties dots */}
                  {tile.kind === "unit" ? (
                    <div className="pointer-events-none absolute inset-0">
                      {dotsForLiberties(libs).map((i) => (
                        <span
                          key={i}
                          className={[
                            "absolute size-1.5 rounded-full",
                            dotPos(i),
                            tile.faction === "RAMA" ? "bg-[#ffd56a]" : "bg-white/80",
                            "shadow-[0_0_0_2px_rgba(0,0,0,0.25)]",
                          ].join(" ")}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            }),
          )}
        </div>
        {skillFx ? (
          <motion.div
            key={skillFx.nonce}
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: -2, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            className={[
              "pointer-events-none absolute left-1/2 top-3 z-30 -translate-x-1/2 rounded-xl px-3 py-1 text-[10px] sm:text-xs font-bold text-center max-w-[90vw] whitespace-nowrap",
              skillFx.effectType === "damage"
                ? "bg-red-500/80 text-white"
                : skillFx.effectType === "buff" || skillFx.effectType === "global"
                  ? "bg-emerald-500/80 text-white"
                  : skillFx.effectType === "legendary" || skillFx.effectType === "zone_control"
                    ? "bg-purple-500/85 text-white animate-screen-shake-soft"
                    : skillFx.effectType === "summon"
                      ? "bg-cyan-500/80 text-white"
                      : skillFx.effectType === "chain"
                        ? "bg-yellow-500/85 text-white"
                        : skillFx.effectType === "passive" || skillFx.effectType === "control"
                          ? "bg-slate-600/90 text-white"
                          : "bg-cyan-500/80 text-white",
            ].join(" ")}
          >
            {skillFx.text}
          </motion.div>
        ) : null}

        {/* Synergy label floating text */}
        {synergyLabel && activeSynergies.length > 0 ? (
          <motion.div
            key={synergyLabel}
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: -2, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none absolute left-1/2 bottom-3 z-30 -translate-x-1/2 rounded-xl px-3 py-1 text-[10px] sm:text-xs font-bold bg-yellow-400/85 text-slate-900 shadow-lg text-center max-w-[90vw] whitespace-nowrap"
          >
            {synergyLabel}
          </motion.div>
        ) : null}

        {/* Combo feedback floating text */}
        {comboFeedback ? (
          <motion.div
            key={comboFeedback.nonce}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1.08, y: -6 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 320, damping: 18 }}
            className="pointer-events-none absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 rounded-2xl px-4 py-2 text-sm sm:text-base font-extrabold bg-orange-500/95 text-white shadow-[0_0_24px_rgba(249,115,22,0.6)] text-center max-w-[90vw] whitespace-nowrap"
          >
            ⚡ {comboFeedback.label}
            {comboState.comboCount > 1 ? <span className="ml-2 text-xs font-bold opacity-80">x{comboState.comboCount}</span> : null}
          </motion.div>
        ) : null}

        {/* hover preview footer */}
        {!compact ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-500/60 bg-slate-800 px-3 py-2 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">พรีวิว</span>
            {preview?.ok ? (
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-200">วางได้</span>
            ) : selected ? (
              <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-rose-200">
                {preview?.reason === "illegalNoLiberties"
                  ? "ไม่มีช่องหายใจ"
                  : preview?.reason === "insufficientEnergy"
                    ? "พลังงานไม่พอ"
                    : preview?.reason === "blocked"
                      ? "ช่องถูกปิด"
                      : preview?.reason === "occupied"
                        ? "มีตัวอยู่แล้ว"
                        : "ต้องเลือกเป้าหมาย"}
              </span>
            ) : (
              <span className="rounded-full bg-slate-700 px-2 py-0.5 text-white">เลือกการ์ดก่อน</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span>
              คะแนนที่จะเปลี่ยน{" "}
              <span className="font-semibold text-white">
                {preview?.ok
                  ? (preview.territoryAfter.total[faction] - preview.territoryBefore.total[faction]).toFixed(0)
                  : "0"}
              </span>
            </span>
            <span className="text-slate-300">เอาเมาส์ชี้เพื่อดูการยึดและพื้นที่</span>
            {selectedCardId ? (
              <button
                className="rounded-lg bg-blue-600 px-3 py-1 font-semibold text-white hover:bg-blue-500"
                onClick={() => selectCard(undefined)}
              >
                ล้างการเลือก
              </button>
            ) : null}
          </div>
          </div>
        ) : null}
      </div>
    </div>
    )
  );
}

