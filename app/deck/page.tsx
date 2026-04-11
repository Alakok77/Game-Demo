"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { DeckBuilder } from "@/deck/deckBuilder";
import { MobileDeckBuilder } from "@/deck/MobileDeckBuilder";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

export default function DeckPage() {
  const router = useRouter();
  const isMobile = useIsMobile();

  // Mobile gets a full-screen, touch-first layout (no nav, no padding wrapper)
  if (isMobile) {
    return <MobileDeckBuilder onBack={() => router.push("/menu")} />;
  }

  // Desktop — preserve existing layout
  return (
    <main className="h-screen overflow-hidden bg-gradient-to-b from-slate-900 to-slate-800 p-4 text-white">
      <div className="mx-auto flex h-full w-full max-w-[1280px] min-h-0 flex-col">
        <Navigation />
        <div className="min-h-0 flex-1">
          <DeckBuilder onBack={() => router.push("/menu")} />
        </div>
      </div>
    </main>
  );
}


