"use client";

import * as React from "react";
import { loadProfile, expProgress, type PlayerProfile } from "@/progression/progression";
import { nextUnlockHint, progressionStageIcon } from "@/progression/rewards";

// ─── EXP Bar ─────────────────────────────────────────────────────────────────

function ExpBar({ current, needed, animated }: { current: number; needed: number; animated?: boolean }) {
  const pct = Math.min(100, Math.round((current / needed) * 100));
  const [width, setWidth] = React.useState(animated ? 0 : pct);

  React.useEffect(() => {
    if (!animated) return;
    const t = window.setTimeout(() => setWidth(pct), 150);
    return () => window.clearTimeout(t);
  }, [pct, animated]);

  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-700">
      <div
        className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(251,191,36,0.5)]"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

// ─── Level Badge ──────────────────────────────────────────────────────────────

function LevelBadge({ level, size = "md" }: { level: number; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-12 h-12 text-lg",
    lg: "w-16 h-16 text-2xl",
  }[size];
  return (
    <div
      className={[
        sizeClasses,
        "flex items-center justify-center rounded-full font-extrabold text-white",
        "bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500",
        "shadow-[0_0_16px_rgba(251,191,36,0.45)] ring-2 ring-yellow-300/60",
      ].join(" ")}
    >
      {level}
    </div>
  );
}

// ─── ProfilePanel ─────────────────────────────────────────────────────────────

type Props = {
  /** If provided, uses this profile instead of loading from localStorage */
  profile?: PlayerProfile;
  /** Compact one-row layout for use in narrow areas */
  compact?: boolean;
};

export function ProfilePanel({ profile: profileProp, compact = false }: Props) {
  const [profile, setProfile] = React.useState<PlayerProfile | null>(null);

  React.useEffect(() => {
    setProfile(profileProp ?? loadProfile());
  }, [profileProp]);

  if (!profile) {
    return (
      <div className={["animate-pulse rounded-2xl bg-slate-800 border border-slate-700", compact ? "h-12" : "h-24"].join(" ")} />
    );
  }

  const { level, exp, gold, name } = profile;
  const prog = expProgress(profile.totalExp);

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-yellow-500/30 bg-slate-900/80 px-3 py-2 shadow-lg backdrop-blur">
        <LevelBadge level={level} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white truncate">{name}</span>
            <span className="text-yellow-300 font-semibold ml-2 shrink-0">🪙 {gold}</span>
          </div>
          <ExpBar current={prog.current} needed={prog.needed} />
          <div className="mt-0.5 text-[10px] text-slate-400">
            {prog.current}/{prog.needed} EXP
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      {/* Header row */}
      <div className="flex items-center gap-4">
        <LevelBadge level={level} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">ผู้เล่น</div>
              <div className="text-lg font-bold text-white leading-tight">{name}</div>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl bg-yellow-500/15 border border-yellow-500/30 px-3 py-1.5">
              <span className="text-xl">🪙</span>
              <span className="text-lg font-bold text-yellow-300">{gold.toLocaleString()}</span>
            </div>
          </div>
          {/* EXP row */}
          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-slate-400">EXP to Level {level + 1}</span>
              <span className="font-semibold text-yellow-200">
                {prog.current} / {prog.needed}
              </span>
            </div>
            <ExpBar current={prog.current} needed={prog.needed} animated />
          </div>
        </div>
      </div>

      {/* Tier hint */}
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-800/60 px-3 py-2 text-xs text-slate-400">
        <span className="text-base">{progressionStageIcon(level)}</span>
        <span>{nextUnlockHint(level)}</span>
      </div>
    </div>
  );
}
