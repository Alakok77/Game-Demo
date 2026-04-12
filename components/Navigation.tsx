"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/menu", label: "🏠 เมนู" },
  { href: "/game", label: "⚔️ เกม" },
  { href: "/deck", label: "🃏 จัดเด็ค" },
  { href: "/shop", label: "🛒 ร้านค้า" },
];

import { loadProfile } from "@/progression/progression";
import { useEffect, useState } from "react";

export function Navigation() {
  const pathname = usePathname();
  const [coins, setCoins] = useState(0);

  useEffect(() => {
    const profile = loadProfile();
    setCoins(profile.coins || 0);
  }, [pathname]);

  return (
    <div className="mb-2 sm:mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between rounded-xl border border-slate-600 bg-slate-900/90 px-2 sm:px-4 py-2 gap-2 text-xs text-slate-200 shrink-0 shadow-md">
      <div className="font-bold flex items-center justify-between sm:justify-start gap-4">
        <span className="hidden sm:inline">หน้าปัจจุบัน: <span className="text-white uppercase tracking-wider">{pathname.replace("/", "") || "menu"}</span></span>
        <span className="sm:hidden font-black text-slate-400 uppercase tracking-widest text-[10px] pl-1">Ramakien</span>
        <span className="font-black text-yellow-400 bg-slate-800 px-2 py-0.5 rounded-lg border border-yellow-500/30 flex items-center gap-1 shadow-inner">
          <span className="text-[10px] sm:text-xs">🪙</span> {coins.toLocaleString()}
        </span>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto custom-scrollbar pb-1 sm:pb-0" style={{ scrollbarWidth: "none" }}>
        {items.map((it) => {
          const isActive = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={[
                "rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-1 font-bold transition-all flex-shrink-0 whitespace-nowrap active:scale-95",
                isActive 
                 ? "bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)] ring-1 ring-blue-400/50" 
                 : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/50",
              ].join(" ")}
            >
              {it.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

