"use client";

import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { 
  loadProfile, 
  saveProfile, 
  buyCard, 
  buyRandomPack, 
  claimDailyReward,
  type PlayerProfile 
} from "@/progression/progression";
import { getCardPrice } from "@/progression/rewards";
import { CARD_LIBRARY, type CardTemplate } from "@/data/cards";
import { motion, AnimatePresence } from "framer-motion";

// Helper parsers for cleaner UX
const getRoleInfo = (card: CardTemplate) => {
  if (card.type === "unit") {
    if (card.synergyTags?.includes("guard")) return { icon: "🛡️", label: "ป้องกัน" };
    if (card.synergyTags?.includes("mobility")) return { icon: "🏃", label: "รวดเร็ว" };
    return { icon: "⚔️", label: "โจมตี" };
  }
  if (card.effectType === "damage" || card.effectType === "aoe") return { icon: "🎯", label: "ทำลาย" };
  if (card.effectType === "control" || card.skillKind === "blockTile") return { icon: "🪤", label: "ควบคุม" };
  return { icon: "✨", label: "สกิลพิเศษ" };
};

const parseAbilityText = (card: CardTemplate) => {
  const parts = { effect: "", condition: "", result: "" };
  let remaining = card.description || "";

  // Parse เงื่อนไข
  const condMatch = remaining.match(/เงื่อนไข:\s*([^\s]+(?: [^\s]+)*?)(?=ผลลัพธ์:|$)/);
  if (condMatch) {
    parts.condition = condMatch[1].trim();
    remaining = remaining.replace(condMatch[0], "");
  }

  // Parse ผลลัพธ์
  const resMatch = remaining.match(/ผลลัพธ์:\s*(.*)/);
  if (resMatch) {
    parts.result = resMatch[1].trim();
    remaining = remaining.replace(resMatch[0], "");
  }

  remaining = remaining.replace(/—/g, "").trim();
  
  if (!parts.condition && !parts.result && (card.ability?.includes("—") || remaining.includes("—"))) {
    const src = card.ability?.includes("—") ? card.ability : remaining;
    const split = src.split("—");
    parts.effect = split[0].trim();
    parts.result = split.slice(1).join(" ").trim();
  } else {
    parts.effect = remaining || card.ability || "";
  }

  return parts;
};

const CardVisualizer = ({ 
  card, 
  isOwned, 
  price, 
  canAfford, 
  onBuy 
}: { 
  card: CardTemplate, 
  isOwned: boolean, 
  price: number, 
  canAfford: boolean, 
  onBuy: () => void 
}) => {
  const role = getRoleInfo(card);
  const parsed = parseAbilityText(card);
  const maxCopies = card.tier === "basic" ? 4 : card.tier === "hero" ? 2 : 1;

  let bgClass = "bg-slate-800 border-slate-700";
  let tierLabel = "BASIC";
  let tierColorText = "text-slate-400";
  let shimmer = false;
  
  if (card.tier === "hero") {
    bgClass = "bg-gradient-to-br from-slate-800 to-purple-900/40 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]";
    tierLabel = "HERO";
    tierColorText = "text-purple-300";
    shimmer = true;
  } else if (card.tier === "legendary") {
    bgClass = "bg-gradient-to-br from-slate-900 via-yellow-900/30 to-purple-950 border-yellow-500/40 animate-legendary-border shadow-[0_0_20px_rgba(234,179,8,0.2)]";
    tierLabel = "LEGENDARY";
    tierColorText = "text-yellow-400 font-bold";
    shimmer = true;
  }

  if (isOwned) {
    bgClass = "bg-slate-800/60 border-emerald-500/40 opacity-80 mix-blend-luminosity hover:mix-blend-normal";
  }

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOwned && canAfford) onBuy();
  };

  return (
    <motion.div 
      layout
      whileHover={!isOwned ? { scale: 0.98, y: -4 } : {}}
      className={`group relative flex flex-col rounded-xl sm:rounded-2xl border p-2.5 sm:p-4 transition-all overflow-hidden ${bgClass}`}
    >
      {shimmer && !isOwned && (
        <div className="pointer-events-none absolute inset-0 -translate-x-[150%] animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12" />
      )}
      
      {/* Top Bar: Role & Cost */}
      <div className="flex justify-between items-start mb-3 z-10">
        <div className="flex items-center gap-1.5 bg-slate-950/50 rounded-full pl-1.5 pr-2.5 py-1 ring-1 ring-white/10 backdrop-blur-sm">
          <span className="text-sm">{role.icon}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">{role.label}</span>
        </div>
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-600 text-white font-black text-sm shadow-[0_0_10px_rgba(249,115,22,0.5)] ring-2 ring-orange-200/20">
          {card.cost}
        </div>
      </div>

      {/* Main Info */}
      <div className="mb-4 z-10">
        <div className={`text-[10px] uppercase tracking-widest mb-0.5 ${tierColorText}`}>{tierLabel}</div>
        <h3 className="text-xl font-black text-white leading-tight">{card.name}</h3>
      </div>

      {/* Structural Ability Block */}
      <div className="flex-1 bg-black/20 rounded-xl p-2 sm:p-3 border border-white/5 flex flex-col gap-1 sm:gap-2 z-10 mb-2 sm:mb-4 sm:h-[110px] overflow-hidden group-hover:overflow-y-auto custom-scrollbar">
        {parsed.effect && (
          <div className="text-[9px] sm:text-xs text-slate-200"><span className="text-indigo-300 font-bold mr-1">⚡</span>{parsed.effect}</div>
        )}
        {parsed.condition && (
          <div className="text-[9px] sm:text-xs text-slate-300"><span className="text-amber-300 font-bold mr-1">⚠️</span>{parsed.condition}</div>
        )}
        {parsed.result && (
          <div className="text-[9px] sm:text-xs text-emerald-200 font-medium"><span className="text-emerald-400 font-bold mr-1">✨</span>{parsed.result}</div>
        )}
        {!parsed.effect && !parsed.condition && !parsed.result && (
          <div className="text-[9px] sm:text-xs text-slate-400 italic">ไม่มีความสามารถพิเศษ</div>
        )}
      </div>

      {/* Footer / Buy Action */}
      <div className="mt-auto pt-3 border-t border-white/10 flex items-center justify-between z-10">
        <div className="text-[10px] text-slate-500 font-medium">
          {card.cardFaction === "RAMA" ? "ทัพพลับพลา" : card.cardFaction === "LANKA" ? "ทัพลงกา" : "ทั่วไป"}
        </div>
        
        {isOwned ? (
          <div className="flex flex-col items-end">
            <span className="text-[10px] sm:text-xs font-bold text-emerald-400 mb-0.5">✅ มีแล้ว</span>
            <span className="text-[8px] sm:text-[9px] text-emerald-500/70">ใส่เด็คได้ {maxCopies} ใบ</span>
          </div>
        ) : (
          <motion.button
            whileTap={canAfford ? { scale: 0.9, y: 2 } : {}}
            onClick={handleBuy}
            disabled={!canAfford}
            className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1 shadow-lg ${
              canAfford 
                ? "bg-slate-100 text-slate-900 hover:bg-white ring-2 ring-transparent hover:ring-indigo-400/50" 
                : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700 shadow-none"
            }`}
          >
            {canAfford ? (
               <>ซื้อ <span className="bg-slate-200 px-1 py-0.5 rounded-md text-[9px] sm:text-[10px] text-slate-800 flex items-center leading-none">{price} 🪙</span></>
            ) : (
               <>ขาดเงิน <span className="opacity-50">({price}🪙)</span></>
            )}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default function ShopPage() {
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [filter, setFilter] = useState<"all" | "basic" | "hero" | "legendary" | "owned">("all");
  
  const [packResult, setPackResult] = useState<CardTemplate[] | null>(null);
  const [showPackModal, setShowPackModal] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  
  const [flyCoins, setFlyCoins] = useState<{id:number, x:number, y:number}[]>([]);

  useEffect(() => {
    setProfile(loadProfile());
    setMounted(true);
  }, []);

  if (!mounted || !profile) {
    return (
      <div className="h-screen overflow-y-auto bg-slate-950 text-slate-100 pb-[env(safe-area-inset-bottom)] relative select-none">
        <div className="flex h-64 items-center justify-center animate-pulse text-slate-500">กำลังเดินทางไปร้านค้า...</div>
      </div>
    );
  }

  const ownedIds = profile.ownedCardTemplateIds || [];
  const today = new Date().toISOString().slice(0, 10);
  const canClaimDaily = profile.lastDailyReward !== today;

  const handleClaimDaily = () => {
    const res = claimDailyReward(profile);
    if (res.ok) {
      setProfile(res.newProfile);
      saveProfile(res.newProfile);
    }
  };

  const filteredCards = CARD_LIBRARY.filter(c => {
    if (filter === "owned") return ownedIds.includes(c.templateId);
    if (filter !== "all" && c.tier !== filter) return false;
    return true;
  });

  const triggerCoinFly = (e?: React.MouseEvent) => {
    if (!e) return;
    const newCoin = { id: Date.now(), x: e.clientX, y: e.clientY };
    setFlyCoins(prev => [...prev, newCoin]);
    setTimeout(() => {
      setFlyCoins(prev => prev.filter(c => c.id !== newCoin.id));
    }, 1000);
  };

  const handleBuyCard = (card: CardTemplate, e?: React.MouseEvent) => {
    const price = getCardPrice(card.tier, card.unlockLevel);
    const res = buyCard(profile, card.templateId, price);
    if (res.ok) {
      triggerCoinFly(e);
      setProfile(res.newProfile);
      saveProfile(res.newProfile);
    }
  };

  const handleBuyPack = () => {
    if (isRolling) return;
    setIsRolling(true);
    setShowPackModal(true);
    
    setTimeout(() => {
      const res = buyRandomPack(profile, CARD_LIBRARY.map(c => c.templateId));
      if (res.ok) {
        setProfile(res.newProfile);
        saveProfile(res.newProfile);
        const receivedCards = res.received.map(id => CARD_LIBRARY.find(c => c.templateId === id)!);
        setPackResult(receivedCards);
      }
      setIsRolling(false);
    }, 1500); // 1.5s build up shake animation
  };

  return (
    <div className="h-[100dvh] bg-slate-950 p-2 md:p-4 pb-[env(safe-area-inset-bottom,8px)] text-slate-100 flex flex-col font-sans overflow-hidden">
      <div className="mx-auto w-full max-w-6xl flex-1 flex flex-col min-h-0 relative pb-4">
        <Navigation />

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          {/* ── Header Mobile-First ── */}
          <div className="mb-2 mt-1 md:mb-6 rounded-xl md:rounded-2xl bg-slate-900 border border-slate-800 p-2 sm:p-4 shadow-md flex flex-row items-center justify-between gap-2 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-3xl font-black bg-gradient-to-r from-indigo-300 to-purple-400 bg-clip-text text-transparent truncate">🛒 พ่อค้าพเนจร</h1>
              {/* Inline Pack Button to save vertical space on mobile */}
              <button
                onClick={handleBuyPack}
                disabled={isRolling || profile.coins < 300}
                className="flex sm:hidden items-center gap-1 rounded-lg bg-gradient-to-r from-purple-700 to-indigo-700 px-2 py-1 font-bold text-white active:scale-95 transition-all text-[9px]"
              >
                <span>📦 สุ่ม</span>
                <span className="bg-black/30 px-1 rounded flex items-center text-[8px]">
                  300🪙
                </span>
              </button>
            </div>
            <p className="hidden sm:block text-xs md:text-sm text-slate-500 mt-1">แลกเปลี่ยนเหรียญทองแดงเพื่อครอบครองพลังแห่งทวยเทพ</p>
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0">
            {canClaimDaily && (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClaimDaily}
                className="rounded-lg bg-yellow-500/10 px-2 py-1.5 text-[10px] md:text-sm font-bold text-yellow-400 ring-1 ring-yellow-500/50 hover:bg-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.15)] flex items-center gap-1"
              >
                <span>🎁</span> <span className="hidden md:inline">รับเงินฟรี</span> +200 <span className="hidden sm:inline">🪙</span>
              </motion.button>
            )}
            <div className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 ring-1 ring-yellow-500/40 shadow-inner">
              <span className="text-yellow-500 text-lg">🪙</span>
              <span className="font-mono text-lg md:text-xl font-bold tracking-tight text-white">{profile.coins.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* ── Layout Shift Desktop/Mobile ── */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0 gap-4 md:gap-6">
          
          {/* ── Sidebar / Horizontal Mobile Menu ── */}
          <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-4">
            
            {/* Pill Filters */}
            <div className="overflow-x-auto custom-scrollbar pb-2 lg:pb-0">
              <div className="flex lg:flex-col gap-2 min-w-max lg:min-w-0">
                {[
                  { id: "all", label: "ทั้งหมด", icon: "📚", color: "text-slate-300" },
                  { id: "basic", label: "ทหาร (Basic)", icon: "🟦", color: "text-blue-300" },
                  { id: "hero", label: "แม่ทัพ (Hero)", icon: "🟪", color: "text-purple-400" },
                  { id: "legendary", label: "ตำนาน (Legend)", icon: "🟨", color: "text-yellow-400" },
                  { id: "owned", label: "มีแล้ว (Owned)", icon: "✅", color: "text-emerald-400" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id as any)}
                    className={`rounded-xl px-2.5 py-1.5 text-[10px] md:text-base font-bold transition-all flex items-center gap-1 shrink-0 ${
                      filter === f.id
                        ? "bg-slate-800 text-white shadow-md ring-1 ring-white/10"
                        : "bg-slate-900/50 text-slate-500 hover:bg-slate-800/80 hover:text-slate-300"
                    }`}
                  >
                    <span className="text-xs sm:text-lg">{f.icon}</span>
                    <span className={filter === f.id ? "text-white" : f.color}>{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pack Banner Desktop */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="mt-auto lg:mt-4 rounded-3xl bg-gradient-to-br from-indigo-900 to-purple-900 p-5 border border-indigo-500/40 shadow-2xl relative overflow-hidden hidden sm:block"
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
              <h2 className="font-black text-white text-xl relative z-10 flex items-center gap-2">
                <span>📦</span> สุ่มแพ็คเกลือ
              </h2>
              <p className="text-xs text-indigo-200 mt-2 mb-5 relative z-10 font-medium">สุุ่มหาทหารใหม่ 3 ใบ การันตีไม่ซ้ำของเดิม</p>
              
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleBuyPack}
                disabled={isRolling || profile.coins < 300}
                className="w-full flex items-center justify-between rounded-xl bg-white px-4 py-3 font-bold text-indigo-900 hover:bg-indigo-50 disabled:opacity-50 disabled:grayscale transition-all shadow-lg relative z-10"
              >
                <span>เปิดผนึก</span>
                <span className="bg-indigo-900/10 px-2 py-0.5 rounded text-sm flex items-center gap-1 border border-indigo-900/10">
                  <span className="text-[10px]">🪙</span>300
                </span>
              </motion.button>
            </motion.div>
          </div>

          {/* ── Main Shop Grid ── */}
          <div className="mt-2 px-1">
            <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-4">
              {filteredCards.map((card) => {
                const isOwned = ownedIds.includes(card.templateId);
                const price = getCardPrice(card.tier, card.unlockLevel);
                const canAfford = profile.coins >= price;
                
                return (
                  <CardVisualizer 
                    key={card.templateId} 
                    card={card} 
                    isOwned={isOwned} 
                    price={price} 
                    canAfford={canAfford}
                    onBuy={() => handleBuyCard(card)}
                  />
                );
              })}
            </div>
            
            {filteredCards.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-slate-500 text-sm">
                <div className="text-4xl mb-4 opacity-50">🪹</div>
                ไม่มีการ์ดในหมวดหมู่นี้
              </div>
            )}
          </div>
        </div>
      </div>

        {/* ── Float Effects ── */}
        <AnimatePresence>
          {flyCoins.map(coin => (
            <motion.div
              key={coin.id}
              initial={{ x: coin.x, y: coin.y, opacity: 1, scale: 1 }}
              animate={{ x: window.innerWidth - 100, y: 50, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="fixed pointer-events-none z-50 text-2xl drop-shadow-md"
            >
              🪙
            </motion.div>
          ))}
        </AnimatePresence>

        {/* ── Pack Opening Modal ── */}
        <AnimatePresence>
          {showPackModal && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4"
            >
              {/* Shake Box Phase */}
              {!packResult && (
                <motion.div 
                  animate={{ 
                    rotate: [0, -5, 5, -5, 5, 0],
                    scale: [1, 1.1, 1.1, 1.1, 1.1, 1.2]
                  }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  className="text-9xl drop-shadow-[0_0_50px_rgba(168,85,247,0.8)] filter"
                >
                  📦
                </motion.div>
              )}

              {/* Reveal Phase */}
              {packResult && (
                <div className="relative w-full max-w-4xl flex flex-col items-center">
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl md:text-5xl font-black text-white mb-12 drop-shadow-lg text-center"
                  >
                    🎉 ได้รับการ์ดใหม่!
                  </motion.div>
                  
                  <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center justify-center w-full">
                    {packResult.map((card, i) => {
                      const isLeg = card.tier === "legendary";
                      return (
                        <motion.div
                          key={card.templateId}
                          initial={{ opacity: 0, scale: 0, rotateY: 180 }}
                          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                          transition={{ 
                            delay: isLeg ? 1.5 + i * 0.2 : i * 0.2, // dramatic delay for legendary
                            type: "spring",
                            stiffness: 200,
                            damping: 20
                          }}
                          className={`relative w-48 h-64 md:w-56 md:h-80 rounded-2xl p-1 ${isLeg ? 'bg-gradient-to-br from-yellow-300 via-yellow-600 to-yellow-900' : card.tier === 'hero' ? 'bg-gradient-to-br from-indigo-400 to-purple-600' : 'bg-slate-600'} shadow-[0_0_30px_rgba(0,0,0,0.5)]`}
                        >
                          <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_20px_rgba(255,255,255,0.2)] mix-blend-overlay pointer-events-none"></div>
                          
                          <div className="w-full h-full bg-slate-900 rounded-xl m-[2px] flex flex-col items-center justify-center p-4 text-center">
                            <div className="text-6xl mb-4 drop-shadow-lg filter">
                              {card.icon === "hero" ? "🦸" : card.icon === "legendary" ? "✨" : "🔥"}
                            </div>
                            <div className="text-xl font-bold text-white mb-2">{card.name}</div>
                            <div className={`text-xs font-bold uppercase tracking-widest ${isLeg ? 'text-yellow-400' : card.tier === 'hero' ? 'text-purple-300' : 'text-slate-400'}`}>
                              {card.tier}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  <motion.button 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.5 }}
                    onClick={() => { setShowPackModal(false); setPackResult(null); }}
                    className="mt-16 px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold ring-1 ring-white/30 backdrop-blur-sm transition transition-all"
                  >
                    เก็บเข้าคลังสะสม
                  </motion.button>

                  {/* Legendary Screen Flash */}
                  {packResult.some(c => c.tier === "legendary") && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ delay: 1.4, duration: 0.5 }} // Syncs with legendary delay
                      className="fixed inset-0 bg-white pointer-events-none z-[-1]"
                    />
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
