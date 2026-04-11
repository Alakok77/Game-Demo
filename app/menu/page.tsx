"use client";

import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { ProfilePanel } from "@/components/ProfilePanel";

export default function MenuPage() {
  const router = useRouter();
  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-slate-900 to-slate-800 p-4 text-white">
      <div className="mx-auto h-full w-full max-w-6xl">
        <Navigation />
        <div className="flex h-[calc(100%-56px)] items-center justify-center">
          <div className="w-full max-w-md space-y-4">
            {/* Profile Panel */}
            <ProfilePanel />

            {/* Game mode card */}
            <div className="rounded-2xl border border-slate-600 bg-slate-900/90 p-6 text-center shadow-lg">
              <h1 className="text-2xl font-bold">รามเกียรติ์: ศึกชิงพื้นที่</h1>
              <p className="mt-1 text-sm text-slate-400">เลือกโหมดที่ต้องการ</p>
              <div className="mt-5 grid gap-3">
                <button
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 font-semibold hover:brightness-110 transition"
                  onClick={() => router.push("/select-faction")}
                >
                  ⚔️ เริ่มเกม
                </button>
                <button
                  className="rounded-xl bg-slate-700 px-4 py-3 font-semibold hover:bg-slate-600 transition"
                  onClick={() => router.push("/deck")}
                >
                  🃏 Deck Builder
                </button>
                <button
                  className="rounded-xl bg-slate-700 px-4 py-3 font-semibold hover:bg-slate-600 transition"
                  onClick={() => router.push("/select-faction?tutorial=1")}
                >
                  📖 Tutorial
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
