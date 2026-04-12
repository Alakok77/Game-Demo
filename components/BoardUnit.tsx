"use client";

import React from "react";
import { motion } from "framer-motion";
import type { Faction, StatusEffect } from "@/game/types";
import { CARD_LIBRARY } from "@/data/cards";

interface BoardUnitProps {
  templateId?: string;
  faction: Faction;
  isPlayer: boolean;
  statusEffects?: StatusEffect[];
  isMobile?: boolean;
}

export const BoardUnit: React.FC<BoardUnitProps> = ({
  templateId,
  faction,
  isPlayer,
  statusEffects = [],
  isMobile = false,
}) => {
  const card = templateId ? CARD_LIBRARY.find((c) => c.templateId === templateId) : null;
  const name = card?.name || (faction === "RAMA" ? "วานร" : "ยักษ์");
  const icon = card?.icon || (faction === "RAMA" ? "🐒" : "👹");
  const tier = card?.tier || "basic";

  // Tier visual config
  const tierConfig = {
    basic: { label: "B", color: "text-slate-400", bg: "bg-slate-800/80", glow: "" },
    hero: { label: "H", color: "text-blue-300", bg: "bg-blue-900/90", glow: "shadow-[0_0_8px_rgba(59,130,246,0.5)]" },
    legendary: { label: "L", color: "text-yellow-200", bg: "bg-amber-900/95", glow: "shadow-[0_0_12px_rgba(251,191,36,0.7)] animate-pulse" },
  };

  const t = tierConfig[tier];

  // Specific hero visuals
  const getSpecialEffect = () => {
    if (templateId === "r_l1") return "hanuman-wind"; // Hanuman
    if (templateId === "r_l3") return "rama-light"; // Rama
    if (templateId === "l_l1") return "thotsakan-aura"; // Thotsakan
    if (templateId === "n_l1") return "sida-glow"; // Sida
    return "";
  };

  const specialEffect = getSpecialEffect();

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center transition-all duration-300 ${
        faction === "RAMA" 
          ? "rounded-full bg-blue-900/60 border-blue-400/70 shadow-[0_0_15px_rgba(59,130,246,0.3)] bg-texture-rama ring-2 ring-blue-500/20" 
          : "rounded-xl bg-red-950/70 border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.3)] bg-texture-lanka ring-2 ring-red-600/20"
      }`}
    >
      {/* Texture Filter Overlay */}
      <div className={`absolute inset-0 pointer-events-none opacity-40 ${
        faction === "RAMA" ? "rounded-full" : "rounded-xl"
      }`} />
      {/* [ TOP LEFT ] Faction Indicator */}
      <div className={`absolute flex items-center justify-center rounded-full text-[10px] shadow-sm ${
        faction === "RAMA" ? "top-1.5 left-1.5 size-4" : "top-0.5 left-0.5 size-4"
      } ${
        isPlayer ? "bg-blue-600" : "bg-red-600"
      }`}>
        {isPlayer ? "🔵" : "🔴"}
      </div>

      {/* [ TOP RIGHT ] Tier Badge */}
      <div className={`absolute rounded text-[9px] font-bold ${t.bg} ${t.color} ${t.glow} border border-white/10 uppercase ${
        faction === "RAMA" ? "top-1.5 right-1.5 px-1.5" : "top-0.5 right-0.5 px-1"
      }`}>
        {t.label}
      </div>

      {/* [ CENTER ] Character Icon */}
      <div className={`relative flex items-center justify-center text-3xl sm:text-4xl select-none ${specialEffect}`}>
         {icon}
         {/* Special visual layers */}
         {specialEffect === "hanuman-wind" && (
           <div className="absolute inset-0 animate-spin-slow opacity-40 text-blue-200 pointer-events-none">🌀</div>
         )}
         {specialEffect === "rama-light" && (
           <div className="absolute inset-0 animate-pulse-slow opacity-30 bg-yellow-400 blur-xl rounded-full pointer-events-none" />
         )}
         {specialEffect === "thotsakan-aura" && (
           <div className="absolute inset-0 animate-pulse opacity-40 bg-purple-600 blur-lg rounded-full pointer-events-none" />
         )}
         {specialEffect === "sida-glow" && (
           <div className="absolute inset-0 animate-pulse-slow opacity-30 bg-pink-400 blur-md rounded-full pointer-events-none" />
         )}
      </div>

      {/* [ BOTTOM ] Short Name */}
      {!isMobile && (
        <div className="absolute bottom-0 w-full bg-black/40 backdrop-blur-[2px] py-0.5 text-center">
          <span className="text-[10px] font-medium text-white/90 truncate px-1 block leading-tight">
            {name}
          </span>
        </div>
      )}

      {/* STATUS EFFECTS LAYER */}
      <div className="absolute top-5 left-1 flex flex-col gap-0.5 pointer-events-none">
        {statusEffects.includes("damage") && <span className="text-[10px] animate-bounce">🔥</span>}
        {statusEffects.includes("protected") && <span className="text-[10px]">🛡️</span>}
        {statusEffects.includes("buff") && <span className="text-[10px] animate-pulse">⚡</span>}
        {statusEffects.includes("willDie") && <span className="text-[10px] animate-flash-fast">💀</span>}
      </div>

      {/* TIER GLOW OVERLAY */}
      {tier === "legendary" && (
        <>
          <div className="absolute inset-0 border-2 border-yellow-400 rounded-xl animate-pulse pointer-events-none shadow-[0_0_20px_rgba(251,191,36,0.5)]" />
          <div className="absolute inset-[-20%] bg-gradient-to-tr from-yellow-400/20 via-transparent to-yellow-400/20 animate-spin-slow pointer-events-none" />
        </>
      )}
    </div>
  );
};
