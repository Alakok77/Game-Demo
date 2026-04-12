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
        <div className="flex h-[calc(100%-56px)] flex-col items-center justify-start sm:justify-center overflow-y-auto pt-6 sm:pt-0 pb-[env(safe-area-inset-bottom,20px)]">
          <div className="w-full max-w-md space-y-4 px-4 sm:px-0 mt-2 sm:mt-0">
            {/* Profile Panel */}
            <ProfilePanel />

            {/* Game mode card */}
            <div className="rounded-3xl border border-slate-600/60 bg-slate-900/95 p-5 sm:p-8 text-center shadow-2xl backdrop-blur-md">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-amber-200 to-yellow-500 bg-clip-text text-transparent">รามเกียรติ์: ศึกชิงพื้นที่</h1>
              <p className="mt-1.5 text-sm font-semibold text-slate-400">เลือกโหมดที่ต้องการ</p>
              <div className="mt-6 flex flex-col gap-3">
                <button
                  className="rounded-2xl bg-gradient-to-b from-blue-500 to-blue-700 px-4 py-4 text-lg font-bold shadow-[0_4px_20px_rgba(37,99,235,0.4)] hover:brightness-110 active:scale-95 transition-all"
                  onClick={() => router.push("/select-faction")}
                >
                  ⚔️ เริ่มเกม
                </button>
                <button
                  className="rounded-2xl bg-slate-800 border border-slate-700 px-4 py-3.5 font-bold hover:bg-slate-700 active:scale-95 transition-all w-full leading-tight"
                  onClick={() => router.push("/deck")}
                >
                  🃏 จัดเด็คการ์ด
                </button>
                <button
                  className="rounded-2xl bg-slate-800 border border-slate-700 px-4 py-3.5 font-bold hover:bg-slate-700 active:scale-95 transition-all w-full leading-tight"
                  onClick={() => router.push("/select-faction?tutorial=1")}
                >
                  📖 วิธีสอนเล่น
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
