"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/menu", label: "Menu" },
  { href: "/game", label: "Game" },
  { href: "/deck", label: "Deck" },
  { href: "/shop", label: "Shop" },
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
    <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-600 bg-slate-900/90 px-4 py-2 text-xs text-slate-200">
      <div className="font-semibold flex items-center gap-4">
        <span>ตอนนี้คุณอยู่หน้า: {pathname.replace("/", "") || "menu"}</span>
        <span className="font-bold text-yellow-400 bg-slate-800 px-2 py-0.5 rounded border border-yellow-500/30">🪙 {coins.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-2">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={[
              "rounded-lg px-3 py-1 font-semibold transition",
              pathname === it.href ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-100 hover:bg-slate-600",
            ].join(" ")}
          >
            {it.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

