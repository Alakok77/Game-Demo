"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/menu", label: "Menu" },
  { href: "/game", label: "Game" },
  { href: "/deck", label: "Deck" },
];

export function Navigation() {
  const pathname = usePathname();
  return (
    <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-600 bg-slate-900/90 px-4 py-2 text-xs text-slate-200">
      <div className="font-semibold">ตอนนี้คุณอยู่หน้า: {pathname.replace("/", "") || "menu"}</div>
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

