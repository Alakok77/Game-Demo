"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ref, set, update, onValue, get } from "firebase/database";
import { db } from "@/lib/firebase";
import { useGameStore, readStoredCustomDeckTemplateIds } from "@/store/gameStore";
import { buildDefaultDeckTemplateIds } from "@/data/cards";
import { Navigation } from "@/components/Navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function OnlinePage() {
  const router = useRouter();
  const onlineUserId = useGameStore((s) => s.onlineUserId);
  const setOnlineMode = useGameStore((s) => s.setOnlineMode);
  
  const [roomIdInput, setRoomIdInput] = React.useState("");
  const [currentRoomId, setCurrentRoomId] = React.useState<string | null>(null);
  const [roomData, setRoomData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [lobbyFaction, setLobbyFaction] = React.useState<"RAMA" | "LANKA">("RAMA");
  
  const customDeck = React.useMemo(() => readStoredCustomDeckTemplateIds(lobbyFaction), [lobbyFaction]);
  const defaultDeck = React.useMemo(() => buildDefaultDeckTemplateIds(lobbyFaction), [lobbyFaction]);

  const currentDeckIds = customDeck || defaultDeck;
  const currentDeckName = customDeck ? `จัดเอง (${lobbyFaction})` : `เริ่มต้น (${lobbyFaction})`;

  // Sync room data when in a room
  React.useEffect(() => {
    if (!currentRoomId) return;

    const roomRef = ref(db, `battle_rooms_v2/${currentRoomId}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setError("ห้องถูกปิดหรือหาไม่พบ");
        setCurrentRoomId(null);
        return;
      }
      setRoomData(data);

      // If game started, redirect to game page
      if (data.status === "playing") {
        setOnlineMode(currentRoomId, data.hostId === onlineUserId ? "host" : "guest");
        router.push("/game");
      }
    });

    return () => unsubscribe();
  }, [currentRoomId, onlineUserId, router, setOnlineMode]);

  const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleCreateRoom = async () => {
    if (!db) {
      setError("ไม่สามารถเชื่อมต่อฐานข้อมูลได้ (Firebase Database not found)");
      return;
    }
    setLoading(true);
    setError(null);
    const id = generateCode();
    try {
      await set(ref(db, `battle_rooms_v2/${id}`), {
        hostId: onlineUserId,
        status: "waiting",
        player1: { 
          id: onlineUserId, 
          ready: false, 
          name: "Player 1",
          faction: lobbyFaction,
          deckTemplateIds: currentDeckIds,
          deckName: currentDeckName
        },
        player2: null,
        gameState: null,
        turn: "player1"
      });
      setCurrentRoomId(id);
    } catch (err: any) {
      console.error("CREATE ROOM ERROR:", err);
      setError(`ไม่สามารถสร้างห้องได้: ${err.message || "โปรดลองอีกครั้ง"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomIdInput || roomIdInput.length < 6) {
      setError("โปรดใส่รหัสห้อง 6 หลัก");
      return;
    }
    if (!db) {
      setError("ไม่สามารถเชื่อมต่อฐานข้อมูลได้ (Firebase Database not found)");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const roomSnap = await get(ref(db, `battle_rooms_v2/${roomIdInput}`));
      if (!roomSnap.exists()) {
        setError("ไม่พบห้องที่ระบุ");
        return;
      }
      const data = roomSnap.val();
      if (data.status !== "waiting") {
        setError("ไม่สามารถเข้าห้องได้ (ห้องกำลังเล่นหรือจบแล้ว)");
        return;
      }
      
      const player1Id = data.player1?.id;
      if (player1Id === onlineUserId) {
        // Already joined
      } else if (data.player2 && data.player2.id !== onlineUserId) {
        setError("ห้องเต็มแล้ว");
        return;
      } else {
        await update(ref(db, `battle_rooms_v2/${roomIdInput}`), {
          player2: { 
            id: onlineUserId, 
            ready: false, 
            name: "Player 2",
            faction: lobbyFaction,
            deckTemplateIds: currentDeckIds,
            deckName: currentDeckName
          }
        });
      }
      setCurrentRoomId(roomIdInput);
    } catch (err: any) {
      console.error("JOIN ROOM ERROR:", err);
      setError(`ไม่สามารถเข้าห้องได้: ${err.message || "โปรดลองอีกครั้ง"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReady = async () => {
    if (!currentRoomId || !roomData || !onlineUserId) return;
    
    const role = roomData.player1?.id === onlineUserId ? "player1" : "player2";
    const isReady = roomData[role]?.ready;

    await update(ref(db, `battle_rooms_v2/${currentRoomId}/${role}`), {
      ready: !isReady,
      faction: lobbyFaction,
      deckTemplateIds: currentDeckIds,
      deckName: currentDeckName
    });
  };

  const handleSwitchFaction = async (faction: "RAMA" | "LANKA") => {
    setLobbyFaction(faction);
    const custom = readStoredCustomDeckTemplateIds(faction);
    const deckIds = custom || buildDefaultDeckTemplateIds(faction);
    const deckName = custom ? `จัดเอง (${faction})` : `เริ่มต้น (${faction})`;
    
    if (currentRoomId && roomData) {
      const role = roomData.player1?.id === onlineUserId ? "player1" : "player2";
      
      await update(ref(db, `battle_rooms_v2/${currentRoomId}/${role}`), {
        faction: faction,
        deckTemplateIds: deckIds,
        deckName: deckName
      });
    }
  };


  const handleStartGame = async () => {
    if (!currentRoomId || !roomData) return;
    const p1 = roomData.player1;
    const p2 = roomData.player2;
    const allReady = p1?.ready && p2?.ready;
    
    if (!allReady) {
      setError("ผู้เล่นยังไม่พร้อมทั้งหมด");
      return;
    }

    // Initialize game state (this logic should match fresh() in gameStore but for 2 players)
    // For simplicity, we'll let the game page handle the first initialization if gameState is null
    // But setting status to 'playing' triggers the redirect
    await update(ref(db, `battle_rooms_v2/${currentRoomId}`), {
      status: "playing",
      // We'll leave gameState null and let the host's GamePage initialize it via Sync logic
    });
  };

  const handleLeaveRoom = async () => {
    if (!currentRoomId) return;
    // Simple: just clear state. A more robust implementation would remove player from DB.
    setCurrentRoomId(null);
    setRoomData(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col">
      <div className="mx-auto w-full max-w-lg px-4 py-6 flex-1 flex flex-col">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent italic">
              ONLINE BATTLE
            </h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">βeta Version</p>
          </div>
          <button 
            onClick={() => router.push("/menu")}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold hover:bg-slate-800 transition shadow-lg"
          >
            ← กลับ
          </button>
        </header>

        <main className="flex-1 flex flex-col justify-center items-center">
          <AnimatePresence mode="wait">
            {!currentRoomId ? (
              <motion.div 
                key="join-create"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full space-y-8"
              >
                {/* Create Section */}
                <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 shadow-2xl backdrop-blur-sm text-center">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-purple-500/20">
                    <span className="text-2xl">🛡️</span>
                  </div>
                  <h2 className="text-lg font-bold mb-1 text-slate-200">สร้างสนามรบใหม่</h2>
                  <p className="text-slate-400 text-xs mb-5">สร้างห้องแล้วส่งรหัสให้เพื่อน</p>
                  <button 
                    onClick={handleCreateRoom}
                    disabled={loading}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 font-black text-sm shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:brightness-110 active:scale-[0.98] transition disabled:opacity-50"
                  >
                    {loading ? "กำลังสร้าง..." : "✨ สร้างห้อง"}
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-slate-800" />
                  <span className="text-xs font-black text-slate-600 uppercase tracking-tighter">หรือ</span>
                  <div className="h-px flex-1 bg-slate-800" />
                </div>

                {/* Join Section */}
                <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 shadow-2xl backdrop-blur-sm">
                  <h2 className="text-lg font-bold mb-4 text-center text-slate-200">เข้าร่วมสนามรบ</h2>
                  <div className="relative mb-4">
                    <input 
                      type="text" 
                      maxLength={6}
                      placeholder="รหัส 6 หลัก"
                      value={roomIdInput}
                      onChange={(e) => setRoomIdInput(e.target.value.replace(/[^0-9]/g, ""))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-center text-xl font-black tracking-[0.5em] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition uppercase"
                    />
                  </div>
                  <button 
                    onClick={handleJoinRoom}
                    disabled={loading || roomIdInput.length < 6}
                    className="w-full py-3 rounded-2xl bg-slate-800 border border-slate-700 text-sm font-bold hover:bg-slate-700 active:scale-[0.98] transition disabled:opacity-50"
                  >
                    {loading ? "กำลังเข้าร่วม..." : "⚔️ เข้าห้อง"}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="lobby"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm p-6 rounded-3xl bg-slate-900/80 border border-slate-700 shadow-2xl backdrop-blur-md"
              >
                {/* Room ID Display */}
                <div className="text-center mb-4 bg-slate-950/50 rounded-2xl py-2 border border-slate-800/50 shadow-inner">
                  <p className="text-slate-500 text-[8px] font-black uppercase tracking-[0.2em] mb-0.5">รหัสห้อง (Room ID)</p>
                  <div className="text-2xl font-black tracking-[0.3em] text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                    {currentRoomId}
                  </div>
                </div>

                {/* Status Section */}
                <div className="flex items-center gap-1.5 mb-3">
                  <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${lobbyFaction === "RAMA" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
                    ฝ่าย {lobbyFaction === "RAMA" ? "วานร" : "ยักษ์"}
                  </div>
                  <div className="px-2 py-0.5 rounded-md bg-slate-800/50 text-slate-400 border border-slate-700 text-[8px] font-black uppercase">
                    {currentDeckName}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 mb-4">
                  {/* Faction Selection */}
                  <div className="space-y-2">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1 text-center">เลือกฝ่ายและเด็คที่คุณจัดไว้</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleSwitchFaction("RAMA")}
                        className={`flex-1 flex flex-row items-center justify-center gap-2 p-3 rounded-2xl border transition ${lobbyFaction === "RAMA" ? "bg-blue-600/20 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)]" : "bg-slate-800/50 border-slate-700 opacity-40 hover:opacity-100"}`}
                      >
                        <span className="text-xl">🐒</span>
                        <span className={`text-[9px] font-black uppercase tracking-tighter ${lobbyFaction === "RAMA" ? "text-blue-400" : "text-slate-500"}`}>RAMA (ลิง)</span>
                      </button>
                      <button 
                        onClick={() => handleSwitchFaction("LANKA")}
                        className={`flex-1 flex flex-row items-center justify-center gap-2 p-3 rounded-2xl border transition ${lobbyFaction === "LANKA" ? "bg-red-600/20 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]" : "bg-slate-800/50 border-slate-700 opacity-40 hover:opacity-100"}`}
                      >
                        <span className="text-xl">👹</span>
                        <span className={`text-[9px] font-black uppercase tracking-tighter ${lobbyFaction === "LANKA" ? "text-red-400" : "text-slate-500"}`}>LANKA (ยักษ์)</span>
                      </button>
                    </div>
                    {customDeck ? (
                      <p className="text-[8px] text-center text-emerald-400 font-bold uppercase animate-pulse">✨ ใช้เด็คที่คุณจัดไว้เรียบร้อยแล้ว</p>
                    ) : (
                      <p className="text-[8px] text-center text-amber-500/70 font-bold uppercase">⚠️ ตรวจไม่พบเด็คจัดเอง (จะใช้เด็คเริ่มต้นให้)</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1">ผู้เล่นในห้อง</p>
                  
                  {/* Player 1 Slot */}
                  {roomData?.player1 && (
                    <div className={`flex items-center justify-between p-2 rounded-2xl border ${roomData.player1.id === onlineUserId ? "bg-blue-500/10 border-blue-500/30" : "bg-slate-800/50 border-slate-700"}`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-sm font-black ${roomData.player1.faction === "RAMA" ? "bg-blue-600" : "bg-red-600"} text-white shadow-lg`}>
                          {roomData.player1.faction === "RAMA" ? "🐒" : "👹"}
                        </div>
                        <div>
                          <p className="font-bold text-[11px]">{roomData.player1.id === onlineUserId ? "คุณ" : "P1 (Host)"}</p>
                          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tight">{roomData.player1.deckName || "เด็คเริ่มต้น"}</p>
                        </div>
                      </div>
                      <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${roomData.player1.ready ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-700/50 text-slate-500 border border-slate-600/30"}`}>
                        {roomData.player1.ready ? "READY" : "WAITING"}
                      </div>
                    </div>
                  )}

                  {/* Player 2 Slot */}
                  {roomData?.player2 ? (
                    <div className={`flex items-center justify-between p-2 rounded-2xl border ${roomData.player2.id === onlineUserId ? "bg-blue-500/10 border-blue-500/30" : "bg-slate-800/50 border-slate-700"}`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-sm font-black ${roomData.player2.faction === "RAMA" ? "bg-blue-600" : "bg-red-600"} text-white shadow-lg`}>
                          {roomData.player2.faction === "RAMA" ? "🐒" : "👹"}
                        </div>
                        <div>
                          <p className="font-bold text-[11px]">{roomData.player2.id === onlineUserId ? "คุณ" : "P2 (Guest)"}</p>
                          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tight">{roomData.player2.deckName || "เด็คเริ่มต้น"}</p>
                        </div>
                      </div>
                      <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${roomData.player2.ready ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-700/50 text-slate-500 border border-slate-600/30"}`}>
                        {roomData.player2.ready ? "READY" : "WAITING"}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 rounded-2xl border border-dashed border-slate-700 flex items-center justify-center text-slate-600 text-[9px] font-bold italic h-10 animate-pulse">
                      กำลังรอผู้เล่นเข้าร่วม...
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={handleLeaveRoom}
                    className="py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-400 hover:text-white transition active:scale-95"
                  >
                    ออกห้อง
                  </button>
                  <button 
                    onClick={handleToggleReady}
                    className={`py-2.5 rounded-2xl text-[10px] font-black transition active:scale-95 shadow-xl ${(roomData?.player1?.id === onlineUserId ? roomData?.player1?.ready : roomData?.player2?.ready) ? "bg-rose-600 text-white shadow-rose-900/20" : "bg-emerald-600 text-white shadow-emerald-900/20"}`}
                  >
                    {(roomData?.player1?.id === onlineUserId ? roomData?.player1?.ready : roomData?.player2?.ready) ? "ยกเลิกพร้อม" : "พร้อมรบ!"}
                  </button>
                </div>

                {roomData?.hostId === onlineUserId && (
                  <div className="mt-3">
                    <button 
                      onClick={handleStartGame}
                      disabled={!roomData?.player1?.ready || !roomData?.player2?.ready}
                      className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 font-black text-xs shadow-2xl shadow-blue-900/20 hover:brightness-110 disabled:opacity-30 disabled:grayscale transition active:scale-95"
                    >
                      🚀 เริ่มเกมเลย!
                    </button>
                    <p className="mt-1.5 text-[8px] text-center text-slate-500 font-bold uppercase">เฉพาะหัวหน้าห้องเท่านั้นที่เริ่มได้</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl bg-rose-600 text-white text-xs font-bold shadow-2xl z-50 whitespace-nowrap"
              >
                ⚠️ {error}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="mt-8 text-center text-[10px] text-slate-600 font-black uppercase tracking-[0.2em]">
          Ramakien Strategy Card Game • Multiplayer Engine
        </footer>
      </div>
    </div>
  );
}
