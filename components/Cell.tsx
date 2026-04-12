"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Coord, Faction, Tile } from "@/game/types";
import { placementRingClasses, unitHoverRingClasses } from "@/lib/factionUi";
import { BoardUnit } from "./BoardUnit";
import { CARD_LIBRARY } from "@/data/cards";
import { useEffect, useState } from "react";

// ─── Territory visual helpers ─────────────────────────────────────────────────

/** Base cell background — strongest visual signal for territory ownership */
function cellBg(territoryOwner: "none" | Faction, humanFaction: Faction) {
  if (territoryOwner === "none") return "bg-slate-700";
  const isPlayer = territoryOwner === humanFaction;
  return isPlayer
    ? "bg-blue-900/60"   // player territory — clearly blue
    : "bg-red-900/55";   // enemy territory — clearly red
}

/** Strong coloured fill overlay on top of base bg */
function territoryFill(territoryOwner: "none" | Faction, humanFaction: Faction) {
  if (territoryOwner === "none") return null;
  const isPlayer = territoryOwner === humanFaction;
  return isPlayer
    ? "bg-gradient-to-br from-blue-500/30 to-blue-700/20"
    : "bg-gradient-to-br from-red-500/30 to-red-700/20";
}

/** Outer border colour when cell is territory-owned */
function territoryBorderClass(territoryOwner: "none" | Faction, humanFaction: Faction) {
  if (territoryOwner === "none") return "";
  const isPlayer = territoryOwner === humanFaction;
  return isPlayer ? "border-blue-500/70" : "border-red-500/70";
}

export function Cell({
  coord,
  tile,
  territoryOwner,
  humanFaction,
  actingFaction,
  isValidTarget,
  isHovered,
  showGhost,
  ghostFaction,
  warning,
  suggested,
  aiFocus,
  captureFx,
  skillFxType,
  skillPreview,
  hasSynergy,
  hasCardSelected,
  onClick,
  onEnter,
  onLeave,
}: {
  coord: Coord;
  tile: Tile;
  territoryOwner: "none" | Faction;
  humanFaction: Faction;
  actingFaction: Faction;
  isValidTarget: boolean;
  isHovered: boolean;
  showGhost: boolean;
  ghostFaction?: Faction;
  warning?: boolean;
  suggested?: boolean;
  aiFocus?: boolean;
  captureFx?: boolean;
  skillFxType?: "damage" | "buff" | "aoe" | "legendary" | "summon" | "chain" | "zone_control" | "global" | "passive" | "control";
  skillPreview?: boolean;
  hasSynergy?: boolean;
  hasCardSelected?: boolean;
  onClick: () => void;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const [mobileTooltip, setMobileTooltip] = useState(false);

  // Auto-hide mobile tooltip after 3s
  useEffect(() => {
    if (mobileTooltip) {
      const t = setTimeout(() => setMobileTooltip(false), 3000);
      return () => clearTimeout(t);
    }
  }, [mobileTooltip]);

  const showTooltip = (isHovered && !showGhost) || (isMobile && mobileTooltip);
  const isTerritory = territoryOwner !== "none";
  const isPlayerTerritory = isTerritory && territoryOwner === humanFaction;
  const isEnemyTerritory = isTerritory && territoryOwner !== humanFaction;

  // When a card is selected, dim everything that isn't a valid target
  // But never dim units — they might be valid skill targets or context clues
  const dimmed = hasCardSelected && !isValidTarget && tile.kind === "empty";

  // Decide the base background
  const baseBg = tile.kind === "block"
    ? "bg-slate-900/80"
    : cellBg(territoryOwner, humanFaction);

  // Decide the border
  const borderClass = (() => {
    if (isHovered && isValidTarget)
      return "border-yellow-400 scale-[1.06] shadow-[0_0_14px_rgba(250,204,21,0.60)]";
    if (isValidTarget)
      return "border-green-400/80";
    if (isHovered && tile.kind === "unit")
      return unitHoverRingClasses(tile.faction, humanFaction) + " border-transparent";
    if (isHovered)
      return "border-slate-300/50 scale-[1.03]";
    if (isPlayerTerritory)
      return "border-blue-400/60";
    if (isEnemyTerritory)
      return "border-red-400/60";
    return "border-slate-600/50";
  })();

  return (
      <button
        aria-label={`cell-${coord.r}-${coord.c}`}
        onClick={() => {
          if (isMobile && tile.kind === "unit" && !hasCardSelected) {
            setMobileTooltip(!mobileTooltip);
          }
          onClick();
        }}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onFocus={onEnter}
        onBlur={onLeave}
        className={[
          "relative w-full h-full rounded-lg sm:rounded-xl",
          baseBg,
          "border transition-all duration-150",
          "shadow-[inset_0_0_0_1px_rgba(15,23,42,0.35)]",
          borderClass,
          dimmed ? "opacity-35" : "",
          isValidTarget ? "cursor-pointer" : "cursor-default",
          warning ? "animate-cell-warn" : "",
        ].join(" ")}
      >
      {/* ══ TERRITORY LAYER ═════════════════════════════════════════ */}

      {/* Strong gradient fill */}
      {isTerritory ? (
        <div
          className={[
            "pointer-events-none absolute inset-0 rounded-xl",
            territoryFill(territoryOwner, humanFaction) ?? "",
          ].join(" ")}
        />
      ) : null}

      {/* Territory "dot-grid" texture for player */}
      {isPlayerTerritory ? (
        <div
          className="pointer-events-none absolute inset-0 rounded-xl opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(96,165,250,0.8) 1px, transparent 1px)",
            backgroundSize: "6px 6px",
          }}
        />
      ) : null}

      {/* Territory "line" texture for enemy */}
      {isEnemyTerritory ? (
        <div
          className="pointer-events-none absolute inset-0 rounded-xl opacity-15"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(248,113,113,0.7) 0px, rgba(248,113,113,0.7) 1px, transparent 1px, transparent 5px)",
          }}
        />
      ) : null}

      {/* Corner ownership icon */}
      {isTerritory && tile.kind === "empty" ? (
        <div
          className={[
            "pointer-events-none absolute bottom-0.5 right-1 text-[9px] leading-none select-none",
            isPlayerTerritory ? "opacity-70" : "opacity-65",
          ].join(" ")}
        >
          {isPlayerTerritory ? "⭐" : "🔥"}
        </div>
      ) : null}

      {/* Inner bottom glow stripe */}
      {isTerritory ? (
        <div
          className={[
            "pointer-events-none absolute inset-x-0 bottom-0 h-[3px] rounded-b-xl",
            isPlayerTerritory
              ? "bg-gradient-to-r from-blue-500/0 via-blue-400/60 to-blue-500/0"
              : "bg-gradient-to-r from-red-500/0 via-red-400/60 to-red-500/0",
          ].join(" ")}
        />
      ) : null}

      {/* AI focus tint */}
      {aiFocus ? <div className="absolute inset-0 rounded-xl bg-white/8" /> : null}

      {/* Suggested move tint */}
      {suggested ? <div className="absolute inset-0 rounded-xl bg-amber-400/12" /> : null}

      {/* ══ VALID TARGET MARKERS ══════════════════════════════════════ */}

      {/* Empty cell valid target (unit placement) */}
      {isValidTarget && tile.kind === "empty" ? (
        <>
          <div
            className={[
              "pointer-events-none absolute inset-0 rounded-xl",
              placementRingClasses(actingFaction),
            ].join(" ")}
          />
          {/* pulsing green fill */}
          <div className="pointer-events-none absolute inset-0 rounded-xl bg-green-400/12 animate-playable-pulse" />
          {/* centre dot */}
          <div
            className={[
              "pointer-events-none absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full",
              actingFaction === "RAMA" ? "bg-blue-400/70" : "bg-red-400/70",
            ].join(" ")}
          />
        </>
      ) : null}

      {/* Enemy unit valid skill target — pulsing red/orange ring */}
      {isValidTarget && tile.kind === "unit" && tile.faction !== actingFaction ? (
        <>
          <div className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-red-400/90 animate-playable-pulse" />
          <div className="pointer-events-none absolute inset-0 rounded-xl bg-red-400/15" />
          {/* crosshair centre dot */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-400/80 ring-1 ring-white/60" />
        </>
      ) : null}

      {/* Hover on valid target — bright yellow */}
      {isHovered && isValidTarget ? (
        <div className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-yellow-400/90 bg-yellow-300/12" />
      ) : null}

      {/* ══ SKILL PREVIEW ═════════════════════════════════════════════ */}
      {skillPreview ? (
        <div
          className={[
            "pointer-events-none absolute inset-0 rounded-xl",
            skillFxType === "damage"
              ? "bg-red-500/22 ring-2 ring-red-400/90"
              : skillFxType === "buff" || skillFxType === "global"
              ? "bg-emerald-500/22 ring-2 ring-emerald-300/90"
              : skillFxType === "legendary" || skillFxType === "zone_control"
              ? "bg-purple-500/22 ring-2 ring-purple-300/95 animate-legendary-border"
              : skillFxType === "summon"
              ? "bg-cyan-500/22 ring-2 ring-cyan-300/85"
              : skillFxType === "chain"
              ? "bg-yellow-500/22 ring-2 ring-yellow-300/90"
              : skillFxType === "passive" || skillFxType === "control"
              ? "bg-slate-500/22 ring-2 ring-slate-300/80"
              : "bg-cyan-500/22 ring-2 ring-cyan-300/85",
          ].join(" ")}
        />
      ) : null}

      {/* ══ SYNERGY ═══════════════════════════════════════════════════ */}
      {hasSynergy ? (
        <div className="pointer-events-none absolute inset-0 rounded-xl animate-synergy-pulse ring-2 ring-yellow-300/90 bg-yellow-300/12" />
      ) : null}

      {/* ══ BLOCK TILE ═══════════════════════════════════════════════ */}
      <AnimatePresence>
        {tile.kind === "block" ? (
          <motion.div
            key="block"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-2 rounded-lg bg-slate-900/85 ring-1 ring-slate-300/20"
          >
            <div className="absolute inset-0 rounded-lg bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.10),transparent_55%)]" />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ══ UNIT STONE RENDERER (REPLACED WITH BOARDUNIT) ══════════════ */}
      <AnimatePresence>
        {tile.kind === "unit" ? (
          <motion.div
            key={`unit-${coord.r}-${coord.c}-${tile.templateId}`}
            layout
            initial={{ opacity: 0, scale: 0.55, y: 5 }}
            animate={{ 
              opacity: 1, 
              scale: isHovered ? 1.1 : 1, // Increased scale per requirement
              y: 0,
              zIndex: isHovered ? 50 : 10
            }}
            exit={{ opacity: 0, scale: 0, rotate: 45 }} // 'Breaking' effect
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            className="absolute inset-1 pointer-events-none"
          >
            <BoardUnit 
              templateId={tile.templateId}
              faction={tile.faction}
              isPlayer={tile.faction === humanFaction}
              statusEffects={tile.statusEffects}
              isMobile={isMobile}
            />
            
            {/* MINI TOOLTIP ON HOVER / TAP */}
            {showTooltip && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="absolute -top-16 left-1/2 -translate-x-1/2 z-[100] min-w-32 bg-slate-900 border border-white/20 rounded shadow-2xl p-2 text-[10px] pointer-events-none"
              >
                <div className="font-bold text-yellow-300">
                  {CARD_LIBRARY.find(c => c.templateId === tile.templateId)?.name || (tile.faction === "RAMA" ? "วานร" : "ยักษ์")}
                </div>
                <div className="text-white/70 line-clamp-2">
                  {CARD_LIBRARY.find(c => c.templateId === tile.templateId)?.ability?.result || "ไม่มีความสามารถ"}
                </div>
                <div className={`mt-0.5 font-semibold ${tile.faction === humanFaction ? "text-blue-400" : "text-red-400"}`}>
                  {tile.faction === humanFaction ? "ฝ่ายคุณ" : "ฝ่ายศัตรู"}
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ══ GHOST PLACEMENT PREVIEW ══════════════════════════════════ */}
      <AnimatePresence>
        {showGhost && tile.kind === "empty" && ghostFaction ? (
          <motion.div
            key="ghost"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 0.52, scale: 0.96 }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{ duration: 0.12 }}
            className={[
              "absolute left-1/2 top-1/2 size-[66%] -translate-x-1/2 -translate-y-1/2 rounded-full",
              ghostFaction === "RAMA" ? "bg-blue-400/65" : "bg-red-400/65",
              "blur-[0.5px]",
            ].join(" ")}
          />
        ) : null}
      </AnimatePresence>

      {/* ══ WARNING ═══════════════════════════════════════════════════ */}
      {warning ? (
        <div className="pointer-events-none absolute inset-0 rounded-xl border-2 border-red-400" />
      ) : null}

      {/* ══ CAPTURE FX ══════════════════════════════════════════════ */}
      {captureFx ? (
        <>
          <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-red-500 opacity-60 animate-flash-fast" />
          <div className="pointer-events-none absolute inset-0 rounded-xl bg-white/20 animate-capture-flash" />
        </>
      ) : null}

      {/* ══ TERRITORY FLASH (newly captured) ════════════════════════ */}
      <AnimatePresence>
        {captureFx && isTerritory ? (
          <motion.div
            key="territory-flash"
            initial={{ opacity: 0.9, scale: 1.1 }}
            animate={{ opacity: 0, scale: 1.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className={[
              "pointer-events-none absolute inset-0 rounded-xl",
              isPlayerTerritory ? "bg-blue-400/50" : "bg-red-400/50",
            ].join(" ")}
          />
        ) : null}
      </AnimatePresence>
    </button>
  );
}
