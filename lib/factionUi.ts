import type { Faction } from "@/game/types";

export function humanPlayerLabel(f: Faction): string {
  return f === "RAMA" ? "คุณ (พระราม)" : "คุณ (ลงกา)";
}

export function aiPlayerLabel(f: Faction): string {
  return f === "RAMA" ? "AI (พระราม)" : "AI (ลงกา)";
}

/** Left / “you” column in score UI — follows human faction colors */
export function humanPanelShellClasses(f: Faction): string {
  return f === "RAMA"
    ? "border-blue-400/40 bg-blue-500/10"
    : "border-fuchsia-500/40 bg-gradient-to-br from-red-950/40 to-purple-950/50";
}

export function humanPanelTitleClasses(f: Faction): string {
  return f === "RAMA" ? "text-blue-200" : "text-fuchsia-200";
}

export function humanPanelScoreClasses(f: Faction): string {
  return f === "RAMA" ? "text-yellow-300" : "text-fuchsia-200";
}

/** Right / AI column */
export function aiPanelShellClasses(f: Faction): string {
  return f === "RAMA"
    ? "border-blue-400/40 bg-blue-500/10"
    : "border-fuchsia-500/40 bg-gradient-to-br from-red-950/40 to-purple-950/50";
}

export function aiPanelTitleClasses(f: Faction): string {
  return f === "RAMA" ? "text-blue-200" : "text-fuchsia-200";
}

export function aiPanelScoreClasses(f: Faction): string {
  return f === "RAMA" ? "text-yellow-300" : "text-fuchsia-200";
}

export function activeTurnBannerClasses(isHumanTurn: boolean, humanFaction: Faction): string {
  if (isHumanTurn) {
    return humanFaction === "RAMA"
      ? "bg-blue-500/20 text-blue-100 ring-1 ring-blue-300/60"
      : "bg-fuchsia-600/25 text-fuchsia-100 ring-1 ring-fuchsia-400/50";
  }
  return humanFaction === "RAMA"
    ? "bg-fuchsia-600/20 text-fuchsia-100 ring-1 ring-fuchsia-400/50"
    : "bg-blue-500/20 text-blue-100 ring-1 ring-blue-300/60";
}

export function badgeFactionClasses(f: Faction): string {
  return f === "RAMA"
    ? "bg-blue-500/20 text-blue-100 ring-1 ring-blue-400/50"
    : "bg-fuchsia-950/50 text-fuchsia-100 ring-1 ring-fuchsia-500/45";
}

/** Highlight ring when hovering a unit on the board */
export function unitHoverRingClasses(tileFaction: Faction, humanFaction: Faction): string {
  const friendly = tileFaction === humanFaction;
  if (friendly) {
    return humanFaction === "RAMA" ? "ring-2 ring-blue-400" : "ring-2 ring-fuchsia-400";
  }
  return humanFaction === "RAMA" ? "ring-2 ring-fuchsia-400" : "ring-2 ring-blue-400";
}

/** Valid empty-cell placement preview ring for the acting faction */
export function placementRingClasses(actingFaction: Faction): string {
  return actingFaction === "RAMA"
    ? "ring-2 ring-blue-400/80 shadow-[0_0_14px_rgba(96,165,250,0.6)]"
    : "ring-2 ring-fuchsia-400/80 shadow-[0_0_14px_rgba(217,70,239,0.5)]";
}

/** Score panel (human / left): emphasis when it is their turn */
export function humanTurnPanelClasses(isHumanTurn: boolean, humanFaction: Faction): string {
  if (!isHumanTurn) return "border-slate-600 bg-slate-800/80 opacity-60";
  return humanFaction === "RAMA"
    ? "border-blue-400/70 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.35)] animate-pulse"
    : "border-fuchsia-500/70 bg-gradient-to-br from-red-950/50 to-purple-950/45 shadow-[0_0_20px_rgba(217,70,239,0.32)] animate-pulse";
}

/** Score panel (AI / right): emphasis when it is AI turn */
export function aiTurnPanelClasses(isAiTurn: boolean, aiFaction: Faction): string {
  if (!isAiTurn) return "border-slate-600 bg-slate-800/80 opacity-60";
  return aiFaction === "RAMA"
    ? "border-blue-400/70 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.35)] animate-pulse"
    : "border-fuchsia-500/70 bg-gradient-to-br from-red-950/50 to-purple-950/45 shadow-[0_0_20px_rgba(217,70,239,0.32)] animate-pulse";
}
