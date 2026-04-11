import type { Card, EffectType, Faction, SkillKind } from "@/game/types";

// ─── CardTemplate type ────────────────────────────────────────────────────────

export type CardTemplate = {
  templateId: string;
  name: string;
  cost: number;
  type: "unit" | "skill";
  tier: "basic" | "hero" | "legendary";
  cardFaction: Faction | "NEUTRAL";
  description: string;
  /** Short ability text shown on card face */
  ability: string;
  icon: string;
  effectType: EffectType;
  skillKind?: SkillKind;
  synergyTags: string[];
  comboType?: string;
  /** Minimum player level required to add this card to a deck (1 = always available) */
  unlockLevel: number;
};

// ─── Shorthand tier aliases ───────────────────────────────────────────────────

const B = "basic" as const;
const H = "hero" as const;
const L = "legendary" as const;

// ─────────────────────────────────────────────────────────────────────────────
// CARD LIBRARY — 20 impactful cards
//   • 2 NEUTRAL basics  (ลิงว่องไว, ยักษ์นักรบ)
//   • 9 RAMA faction cards (heroes + legendaries)
//   • 9 LANKA faction cards (heroes + legendaries)
// ─────────────────────────────────────────────────────────────────────────────

export const CARD_LIBRARY: CardTemplate[] = [

  // ══════════════════════════════════════════════════════════════
  // [NEUTRAL] BASICS — available to both factions, unlockLevel 1
  // ══════════════════════════════════════════════════════════════

  {
    templateId: "quick_monkey",
    name: "ลิงว่องไว",
    cost: 1,
    type: "unit",
    tier: B,
    cardFaction: "NEUTRAL",
    description: "วางตัวละครลิงลงบนช่องว่างที่มีช่องว่างรอบตัวอย่างน้อย 1 ช่อง — ราคาถูก ใช้งานง่าย เหมาะยึดพื้นที่",
    ability: "💥 วางลิงบนช่องว่าง — ราคา 1 พลังงาน",
    icon: "🐒",
    effectType: "unit",
    synergyTags: ["monkey"],
    unlockLevel: 1,
  },
  {
    templateId: "demon_warrior",
    name: "ยักษ์นักรบ",
    cost: 1,
    type: "unit",
    tier: B,
    cardFaction: "NEUTRAL",
    description: "วางตัวละครยักษ์ลงบนช่องว่างที่มีช่องว่างรอบตัวอย่างน้อย 1 ช่อง — แข็งแกร่ง เหมาะตั้งแนวป้องกัน",
    ability: "💥 วางยักษ์บนช่องว่าง — ราคา 1 พลังงาน",
    icon: "👹",
    effectType: "unit",
    synergyTags: ["demon"],
    unlockLevel: 1,
  },

  // ══════════════════════════════════════════════════════════════
  // [RAMA] HEROES — unlockLevel 3
  // ══════════════════════════════════════════════════════════════

  {
    templateId: "hanuman",
    name: "หนุมาน",
    cost: 2,
    type: "unit",
    tier: H,
    cardFaction: "RAMA",
    description: "วางหนุมานลงบนกระดาน — พิเศษ: กระโดดข้ามช่องที่ถูกปิดได้! ใช้บุกทะลวงแนวป้องกันศัตรู เงื่อนไข: ช่องปลายทางต้องมีช่องว่างรอบตัวอย่างน้อย 1 ช่อง",
    ability: "⚡ กระโดดข้ามช่องปิดได้ — บุกทะลวงแนวศัตรู",
    icon: "🐒🔥",
    effectType: "buff",
    synergyTags: ["monkey", "hanuman", "hero_rama"],
    comboType: "hanuman",
    unlockLevel: 3,
  },
  {
    templateId: "phra_lak",
    name: "พระลักษณ์",
    cost: 3,
    type: "unit",
    tier: H,
    cardFaction: "RAMA",
    description: "วางพระลักษณ์ลงบนช่องว่าง — ตัวละครของเราทุกตัวที่อยู่ติดกันได้รับ +1 ช่องว่างรอบตัว ทำให้ถูกล้อมแตกได้ยากขึ้น เหมาะสร้างแนวป้องกันตรงกลาง",
    ability: "⚡ ตัวละครข้างเคียงได้รับ +1 ช่องว่างรอบตัว — ทนทานขึ้น",
    icon: "🛡️✨",
    effectType: "buff",
    synergyTags: ["hero_rama", "rama_char"],
    comboType: "phra_lak",
    unlockLevel: 3,
  },
  {
    templateId: "bridge",
    name: "สร้างสะพาน",
    cost: 3,
    type: "skill",
    tier: H,
    cardFaction: "RAMA",
    description: "คลิกช่องว่างบนกระดาน 1 ช่อง — ช่องนั้นจะถูกปิด ศัตรูวางตัวละครลงไม่ได้ ใช้ต่อเส้นทางให้กลุ่มเราหรือปิดกั้นเส้นทางหนีของศัตรู เงื่อนไข: ต้องเป็นช่องว่างเท่านั้น",
    ability: "⚡ ปิด 1 ช่องว่าง — ศัตรูวางตัวไม่ได้",
    icon: "🌉",
    effectType: "buff",
    skillKind: "blockTile",
    synergyTags: ["block_skill", "bridge"],
    comboType: "bridge",
    unlockLevel: 3,
  },
  {
    templateId: "swap",
    name: "ย้ายตำแหน่ง",
    cost: 3,
    type: "skill",
    tier: H,
    cardFaction: "RAMA",
    description: "คลิกตัวละครศัตรู 1 ตัว — ผลักมันออกจากตำแหน่ง ถ้าตำแหน่งใหม่ทำให้หมดช่องว่างรอบตัว จะถูกล้อมแตกทันที ใช้สลายแนวป้องกันศัตรู",
    ability: "⚡ ผลักตัวละครศัตรู 1 ตัว — อาจล้อมแตกได้ทันที",
    icon: "🔄",
    effectType: "damage",
    skillKind: "pushUnit",
    synergyTags: ["push_skill"],
    comboType: "swap",
    unlockLevel: 3,
  },
  {
    templateId: "deva_power",
    name: "พลังเทวดา",
    cost: 3,
    type: "skill",
    tier: H,
    cardFaction: "RAMA",
    description: "คลิกตัวละครศัตรูตัวใดก็ได้ในกลุ่ม — ถ้ากลุ่มนั้นมีช่องว่างรอบตัว ≤ 2 ช่อง ทำลายทุกตัวในกลุ่มทันที เหมาะกำจัดกลุ่มศัตรูที่ถูกล้อมจนเกือบแตก",
    ability: "⚡ ทำลายกลุ่มศัตรูที่มีช่องว่างรอบตัว ≤ 2",
    icon: "⚡🌟",
    effectType: "damage",
    skillKind: "destroyWeakGroup",
    synergyTags: ["cut_skill"],
    comboType: "deva_power",
    unlockLevel: 3,
  },
  {
    templateId: "revive",
    name: "ฟื้นพลัง",
    cost: 3,
    type: "skill",
    tier: H,
    cardFaction: "RAMA",
    description: "คลิกตัวละครของเรา 1 ตัว — ผลักมันออกจากตำแหน่งอันตรายไปยังช่องว่างใกล้เคียง ใช้ช่วยชีวิตตัวละครที่กำลังถูกล้อมอยู่ เงื่อนไข: ต้องมีช่องว่างใกล้เคียงให้ย้ายได้",
    ability: "⚡ ผลักตัวละครเราออกจากจุดอันตราย — ช่วยชีวิต",
    icon: "💫",
    effectType: "buff",
    skillKind: "pushUnit",
    synergyTags: ["push_skill", "revive"],
    comboType: "revive",
    unlockLevel: 3,
  },

  // ══════════════════════════════════════════════════════════════
  // [RAMA] LEGENDARIES — unlockLevel 5
  // ══════════════════════════════════════════════════════════════

  {
    templateId: "phra_ram",
    name: "พระราม",
    cost: 4,
    type: "unit",
    tier: L,
    cardFaction: "RAMA",
    description: "วางพระรามลงบนช่องว่าง — แม่ทัพหลักของฝ่ายพระราม พลังร่วม: ถ้าหนุมานอยู่บนกระดานในกลุ่มเดียวกัน กลุ่มนั้นจะไม่ถูกล้อมแตกในเทิร์นนั้น! เหมาะเป็นหัวใจของแนวรบ",
    ability: "✨ พลังร่วม: หนุมาน + พระราม = กลุ่มไม่แตกเทิร์นนี้!",
    icon: "🏹✨",
    effectType: "buff",
    synergyTags: ["hero_rama", "rama_char"],
    comboType: "phra_ram",
    unlockLevel: 5,
  },
  {
    templateId: "hanuman_fire",
    name: "หนุมานเผาลงกา",
    cost: 4,
    type: "skill",
    tier: L,
    cardFaction: "RAMA",
    description: "คลิกตำแหน่งใดก็ได้บนกระดาน — ระเบิดพื้นที่ 3x3 รอบจุดนั้น ทำลายทุกตัวละครในบริเวณ กลุ่มที่อ่อนแออยู่แล้วจะถูกล้อมแตกต่อ ใช้ล้างกลุ่มใหญ่ของศัตรูแบบ AoE",
    ability: "✨ ระเบิดพื้นที่ 3x3 — ทำลายทุกตัวละครในบริเวณ",
    icon: "🔥🐒",
    effectType: "legendary",
    skillKind: "stormCut",
    synergyTags: ["storm_skill", "legendary_skill"],
    comboType: "hanuman_fire",
    unlockLevel: 5,
  },
  {
    templateId: "monkey_army",
    name: "กองทัพลิง",
    cost: 5,
    type: "skill",
    tier: L,
    cardFaction: "RAMA",
    description: "คลิกตัวละครศัตรูตัวใดก็ได้ในกลุ่ม — ถ้ากลุ่มนั้นมีช่องว่างรอบตัว ≤ 2 ทำลายทุกตัวในกลุ่มทันที แรงกว่าพลังเทวดา เหมาะเปิดฉากโจมตีใหญ่",
    ability: "✨ ทำลายกลุ่มศัตรูอ่อนแอทั้งกลุ่ม — โจมตีใหญ่!",
    icon: "🐒🐒🐒",
    effectType: "legendary",
    skillKind: "destroyWeakGroup",
    synergyTags: ["monkey", "legendary_skill", "army"],
    comboType: "monkey_army",
    unlockLevel: 5,
  },

  // ══════════════════════════════════════════════════════════════
  // [LANKA] HEROES — unlockLevel 3
  // ══════════════════════════════════════════════════════════════

  {
    templateId: "indrajit",
    name: "อินทรชิต",
    cost: 2,
    type: "skill",
    tier: H,
    cardFaction: "LANKA",
    description: "คลิกช่องว่างบนกระดาน 1 ช่อง — ช่องนั้นถูกปิด ศัตรูวางตัวละครไม่ได้ และตัวละครศัตรูที่อยู่ติดกับช่องนั้นจะสูญเสียช่องว่างรอบตัว 1 ช่อง เหมาะดักขยับศัตรู",
    ability: "⚡ ปิด 1 ช่อง — ลดช่องว่างรอบตัวศัตรูที่อยู่ใกล้",
    icon: "🪄🕸️",
    effectType: "buff",
    skillKind: "blockTile",
    synergyTags: ["trap", "block_skill", "indrajit"],
    comboType: "indrajit",
    unlockLevel: 3,
  },
  {
    templateId: "kumpha",
    name: "กุมภกรรณ",
    cost: 3,
    type: "unit",
    tier: H,
    cardFaction: "LANKA",
    description: "วางกุมภกรรณลงบนช่องว่าง — ยักษ์ขนาดใหญ่ พลังร่วม: ถ้าอยู่ในกลุ่มเดียวกับยักษ์ตัวอื่น กลุ่มนั้นจะมีช่องว่างรอบตัวเพิ่มขึ้น ทนทานถูกล้อมแตกได้ยากมาก",
    ability: "⚡ พลังร่วม: อยู่กับยักษ์อื่น → กลุ่มแข็งแกร่งมาก",
    icon: "💤👹",
    effectType: "buff",
    synergyTags: ["demon", "kumpha", "hero_lanka"],
    comboType: "kumpha",
    unlockLevel: 3,
  },
  {
    templateId: "maya",
    name: "มายา",
    cost: 2,
    type: "skill",
    tier: H,
    cardFaction: "LANKA",
    description: "คลิกช่องว่างบนกระดาน 1 ช่อง — ปิดช่องนั้นด้วยภาพมายา ศัตรูวางตัวละครไม่ได้ 2 เทิร์น หลังจากนั้นช่องจะเปิดเองอัตโนมัติ เหมาะรบกวนการวางแผนของศัตรู",
    ability: "⚡ ปิดช่องด้วยภาพหลอก — ศัตรูวางไม่ได้ 2 เทิร์น",
    icon: "🌫️🪄",
    effectType: "buff",
    skillKind: "blockTile",
    synergyTags: ["trap", "block_skill", "maya"],
    comboType: "maya",
    unlockLevel: 3,
  },
  {
    templateId: "block_area",
    name: "ปิดพื้นที่",
    cost: 3,
    type: "skill",
    tier: H,
    cardFaction: "LANKA",
    description: "คลิกช่องว่างสำคัญ 1 ช่อง — ปิดช่องนั้นเพื่อตัดเส้นทางหนีหรือเส้นทางขยายของศัตรู ตัวละครศัตรูที่อยู่ติดกับจุดนั้นจะสูญเสียช่องว่างรอบตัว ใช้บีบให้ศัตรูหมดที่หายใจ",
    ability: "⚡ ปิด 1 ช่องสำคัญ — ตัดเส้นทางรอดศัตรู",
    icon: "🚫",
    effectType: "buff",
    skillKind: "blockTile",
    synergyTags: ["trap", "block_skill"],
    comboType: "block_area",
    unlockLevel: 3,
  },
  {
    templateId: "drain",
    name: "ดูดพลัง",
    cost: 3,
    type: "skill",
    tier: H,
    cardFaction: "LANKA",
    description: "คลิกตัวละครศัตรูตัวใดก็ได้ในกลุ่ม — ถ้ากลุ่มนั้นมีช่องว่างรอบตัว ≤ 2 ช่อง ทำลายทุกตัวในกลุ่มแล้วดูดพลังงาน 1 มาให้เรา เหมาะกำจัดกลุ่มเล็กศัตรูพร้อมฟื้นพลัง",
    ability: "⚡ ทำลายกลุ่มศัตรูอ่อนแอ + รับพลังงาน 1",
    icon: "🌑💨",
    effectType: "damage",
    skillKind: "destroyWeakGroup",
    synergyTags: ["cut_skill", "drain"],
    comboType: "drain",
    unlockLevel: 3,
  },
  {
    templateId: "giant_wall",
    name: "กำแพงยักษ์",
    cost: 4,
    type: "skill",
    tier: H,
    cardFaction: "LANKA",
    description: "คลิกตัวละครศัตรู 1 ตัว — ผลักมันออกไปยังช่องว่างใกล้เคียง ถ้าหลังผลักแล้วมันหมดช่องว่างรอบตัว จะถูกล้อมแตกทันที ใช้สลายแนวป้องกันแข็งแกร่งของศัตรู",
    ability: "⚡ ผลักตัวละครศัตรู 1 ตัว — ถ้าหมดช่องว่างรอบตัว → ล้อมแตก",
    icon: "🧱👹",
    effectType: "damage",
    skillKind: "pushUnit",
    synergyTags: ["push_skill", "wall"],
    comboType: "giant_wall",
    unlockLevel: 3,
  },

  // ══════════════════════════════════════════════════════════════
  // [LANKA] LEGENDARIES — unlockLevel 5
  // ══════════════════════════════════════════════════════════════

  {
    templateId: "tosakan",
    name: "ทศกัณฐ์",
    cost: 4,
    type: "unit",
    tier: L,
    cardFaction: "LANKA",
    description: "วางทศกัณฐ์ลงบนช่องว่าง — ราชาลงกา พลังร่วม: ถ้าทศกัณฐ์อยู่ใกล้กับ 'ดูดพลัง' ที่เล่นในเทิร์นเดียวกัน กลุ่มศัตรูรอบข้างจะสูญเสียช่องว่างรอบตัวเพิ่ม ทำให้ถูกล้อมแตกง่ายมาก",
    ability: "✨ พลังร่วม: ทศกัณฐ์ + ดูดพลัง = ศัตรูหมดช่องว่างรอบตัว!",
    icon: "👹👑",
    effectType: "buff",
    synergyTags: ["demon", "tosakan", "hero_lanka"],
    comboType: "tosakan",
    unlockLevel: 5,
  },
  {
    templateId: "bomb",
    name: "ระเบิดลงกา",
    cost: 4,
    type: "skill",
    tier: L,
    cardFaction: "LANKA",
    description: "คลิกตำแหน่งใดก็ได้บนกระดาน — ระเบิดพื้นที่ 3x3 รอบจุดนั้น ทำลายทุกตัวละครในบริเวณ กลุ่มที่อ่อนแออยู่แล้วจะถูกล้อมแตกต่อทันที ใช้เปิดพื้นที่ขนาดใหญ่",
    ability: "✨ ระเบิดพื้นที่ 3x3 — ทำลายทุกตัวละครในบริเวณ",
    icon: "💥🔥",
    effectType: "legendary",
    skillKind: "stormCut",
    synergyTags: ["storm_skill", "legendary_skill", "bomb"],
    comboType: "bomb",
    unlockLevel: 5,
  },
  {
    templateId: "web_trap",
    name: "ใยกับดัก",
    cost: 5,
    type: "skill",
    tier: L,
    cardFaction: "LANKA",
    description: "คลิกตัวละครศัตรูตัวใดก็ได้ในกลุ่ม — ถ้ากลุ่มนั้นมีช่องว่างรอบตัว ≤ 2 ทำลายทุกตัวในกลุ่มนั้น พร้อมแพร่ผลไปยังกลุ่มใกล้เคียงที่อ่อนแอด้วย เหมาะทำลายแนวรบศัตรูพร้อมกันหลายกลุ่ม",
    ability: "✨ ทำลายกลุ่มศัตรูอ่อนแอ + แพร่ผลไปกลุ่มใกล้เคียง",
    icon: "🕸️🌑",
    effectType: "legendary",
    skillKind: "destroyWeakGroup",
    synergyTags: ["trap", "legendary_skill", "web"],
    comboType: "web_trap",
    unlockLevel: 5,
  },
  // ══════════════════════════════════════════════════════════════
  // [RAMA] NEW CARDS — Mobility · Combo · Summon · Chain
  // unlockLevel 4 (mid-game power spike)
  // ══════════════════════════════════════════════════════════════

  {
    templateId: "hanuman_split",
    name: "หนุมานแยกร่าง",
    cost: 4,
    type: "skill",
    tier: L,
    cardFaction: "RAMA",
    description:
      "เลือก 1 ช่องบนกระดาน — สร้างลิง 3 ตัวในช่องว่างที่อยู่ติดกับจุดนั้น (สูงสุด 3 ช่อง) " +
      "เงื่อนไข: ต้องมีช่องว่างรอบจุดที่เลือกอย่างน้อย 1 ช่อง " +
      "ผลลัพธ์: วางยูนิตฝ่ายเรา 3 ตัวพร้อมกัน ยึดพื้นที่ขนาดใหญ่ในเทิร์นเดียว",
    ability: "✨ สร้างลิงพร้อมกัน 3 ตัวรอบจุดที่เลือก — ยึดพื้นที่ใหญ่ทันที",
    icon: "🐒🐒🐒💥",
    effectType: "summon",
    skillKind: "stormCut",
    synergyTags: ["monkey", "summon", "aoe", "hanuman", "hero_rama"],
    comboType: "hanuman_split",
    unlockLevel: 4,
  },

  {
    templateId: "rama_lightning",
    name: "สายฟ้าพระราม",
    cost: 5,
    type: "skill",
    tier: L,
    cardFaction: "RAMA",
    description:
      "เลือกตัวละครศัตรู 1 ตัว — ถ้ากลุ่มนั้นมีช่องว่างรอบตัว ≤ 2 ทำลายกลุ่มนั้นทันที " +
      "จากนั้น chain ไปยังกลุ่มศัตรูอื่นที่อยู่ใกล้เคียง (ในระยะ 1 ช่อง) สูงสุด 3 กลุ่ม " +
      "ผลลัพธ์: ล้างแนวรบศัตรูพร้อมกันหลายจุด ถ้าทุกกลุ่มอ่อนแอเพียงพอ",
    ability: "✨ Chain ทำลายกลุ่มศัตรูอ่อนแอได้สูงสุด 3 กลุ่มต่อเนื่อง",
    icon: "⚡🏹⚡",
    effectType: "chain",
    skillKind: "destroyWeakGroup",
    synergyTags: ["chain", "damage", "cut_skill", "legendary_skill", "hero_rama"],
    comboType: "rama_lightning",
    unlockLevel: 4,
  },

  {
    templateId: "divine_blessing",
    name: "พรจากเทวดา",
    cost: 4,
    type: "skill",
    tier: L,
    cardFaction: "RAMA",
    description:
      "ใช้การ์ดนี้ทันที — ตัวละครฝ่ายเราทุกตัวบนกระดานได้รับ +1 ช่องว่างรอบตัวเทิร์นนี้ " +
      "เงื่อนไข: ไม่มี เล่นได้ทุกสถานการณ์ " +
      "ผลลัพธ์: กลุ่มของเราทนทานมากขึ้น ยากถูกล้อมแตกในรอบนี้ — ใช้รับมือการโจมตีของ AI",
    ability: "✨ ตัวละครเราทั้งกระดาน +1 ช่องว่างรอบตัว เทิร์นนี้",
    icon: "🌟✨🌟",
    effectType: "global",
    skillKind: "pushUnit",
    synergyTags: ["global", "buff", "hero_rama", "rama_char", "mobility"],
    comboType: "divine_blessing",
    unlockLevel: 4,
  },

  {
    templateId: "hanuman_warp",
    name: "วาปหนุมาน",
    cost: 3,
    type: "skill",
    tier: H,
    cardFaction: "RAMA",
    description:
      "เลือกตัวละครฝ่ายเรา 1 ตัว — ย้ายมันออกจากตำแหน่งเดิมไปยังช่องว่างใดก็ได้บนกระดาน " +
      "เงื่อนไข: ตำแหน่งปลายทางต้องว่างและมีช่องว่างรอบตัวอย่างน้อย 1 ช่อง " +
      "ผลลัพธ์: ช่วยชีวิตตัวละครที่ถูกล้อม หรือวางตำแหน่งใหม่เพื่อเปิดการโจมตี",
    ability: "⚡ ย้ายตัวละครเราไปตำแหน่งใดก็ได้ — หนีกับดักหรือบุกทะลวง",
    icon: "🌀🐒",
    effectType: "buff",
    skillKind: "pushUnit",
    synergyTags: ["mobility", "buff", "monkey", "hanuman", "hero_rama"],
    comboType: "hanuman_warp",
    unlockLevel: 4,
  },

  // ══════════════════════════════════════════════════════════════
  // [LANKA] NEW CARDS — Control · Trap · Curse · Zone
  // unlockLevel 4 (mid-game power spike)
  // ══════════════════════════════════════════════════════════════

  {
    templateId: "hellfire",
    name: "นรกเพลิง",
    cost: 5,
    type: "skill",
    tier: L,
    cardFaction: "LANKA",
    description:
      "เลือก 1 จุดบนกระดาน — ระเบิดไฟในพื้นที่ 3x3 รอบจุดนั้น " +
      "ตัวละครศัตรูทุกตัวในพื้นที่นี้สูญเสียช่องว่างรอบตัว -1 ทันที " +
      "ถ้าตัวใดมีช่องว่างรอบตัวเหลือ 0 — ถูกล้อมแตกทันที " +
      "ผลลัพธ์: ยึดครองพื้นที่ขนาดใหญ่และบีบศัตรูพร้อมกัน",
    ability: "✨ เผาพื้นที่ 3x3 — ศัตรูในบริเวณสูญเสียช่องว่างรอบตัว -1 ทันที",
    icon: "🔥🌋🔥",
    effectType: "zone_control",
    skillKind: "stormCut",
    synergyTags: ["zone_control", "aoe", "damage", "legendary_skill", "fire"],
    comboType: "hellfire",
    unlockLevel: 4,
  },

  {
    templateId: "lanka_curse",
    name: "คำสาปลงกา",
    cost: 4,
    type: "skill",
    tier: H,
    cardFaction: "LANKA",
    description:
      "เลือกตัวละครศัตรู 1 ตัว — ตัวนั้นติด curse ทันที " +
      "เงื่อนไข: ต้องมีช่องว่างรอบตัวมากกว่า 0 " +
      "ผลลัพธ์: ตัวละครนั้นสูญเสียช่องว่างรอบตัว 1 ช่อง ถ้าเหลือ 0 — ถูกล้อมแตกทันที",
    ability: "⚡ Curse ศัตรู 1 ตัว → สูญเสียช่องว่างรอบตัว -1 ถ้าหมด = ล้อมแตกทันที",
    icon: "🌑🪄💀",
    effectType: "passive",
    skillKind: "destroyWeakGroup",
    synergyTags: ["curse", "control", "passive", "trap", "hero_lanka"],
    comboType: "lanka_curse",
    unlockLevel: 4,
  },

  {
    templateId: "shadow_army",
    name: "กองทัพเงา",
    cost: 5,
    type: "skill",
    tier: L,
    cardFaction: "LANKA",
    description:
      "เลือก 1 ช่องบนกระดาน — สร้างยักษ์ 2 ตัวในช่องว่างใกล้เคียดจุดนั้น " +
      "เงื่อนไข: ต้องมีช่องว่างอย่างน้อย 2 ช่องรอบจุดที่เลือก " +
      "ผลลัพธ์: วางยูนิตฝ่ายเรา 2 ตัวพร้อมกัน บวกปิด 1 ช่องว่างด้วยกับดักเงา ศัตรูไม่สามารถวางตัวลงในช่องนั้น 1 เทิร์น",
    ability: "✨ สร้างยักษ์ 2 ตัว + ปิด 1 ช่องด้วยกับดักเงา 1 เทิร์น",
    icon: "👹👹🌑",
    effectType: "summon",
    skillKind: "stormCut",
    synergyTags: ["summon", "demon", "trap", "legendary_skill", "hero_lanka"],
    comboType: "shadow_army",
    unlockLevel: 4,
  },

  {
    templateId: "void_pit",
    name: "หลุมมิติ",
    cost: 4,
    type: "skill",
    tier: H,
    cardFaction: "LANKA",
    description:
      "เลือกตัวละครศัตรู 1 ตัวที่มีช่องว่างรอบตัว ≤ 2 — " +
      "ดึงมันออกจากกระดานชั่วคราว แล้วปิดช่องนั้นด้วยหลุมมิติ 1 เทิร์น " +
      "เมื่อหมดเวลา ช่องเปิดเป็นช่องว่าง (ตัวละครนั้นหายถาวร) " +
      "ผลลัพธ์: กำจัดตัวละครศัตรูที่อ่อนแออยู่แล้ว และยึดตำแหน่งนั้นด้วยกับดัก",
    ability: "⚡ ดึงศัตรู (ช่องว่างรอบตัว ≤ 2) หายจากกระดาน + ปิดช่องนั้น 1 เทิร์น",
    icon: "🕳️🌑🌀",
    effectType: "control",
    skillKind: "blockTile",
    synergyTags: ["control", "trap", "curse", "hero_lanka"],
    comboType: "void_pit",
    unlockLevel: 4,
  },

  // ══════════════════════════════════════════════════════════════
  // 🟦 BASIC UNITS — core placement (unlockLevel 1)
  // cost 1–2  •  tier basic  •  no conditions
  // ══════════════════════════════════════════════════════════════

  {
    templateId: "scout_monkey",
    name: "ลิงลาดตระเวน",
    cost: 1,
    type: "unit",
    tier: B,
    cardFaction: "NEUTRAL",
    description:
      "วางลิงลาดตระเวนลงบนช่องว่างที่มีช่องว่างรอบตัวอย่างน้อย 1 ช่อง " +
      "เงื่อนไข: ไม่มีผลพิเศษ " +
      "ผลลัพธ์: ยึดพื้นที่ราคาถูก เหมาะเปิดเกมต้น",
    ability: "💥 วางลิงลาดตระเวน — ยึดตำแหน่งเร็ว ราคา 1",
    icon: "🐒🔍",
    effectType: "unit",
    synergyTags: ["monkey", "scout"],
    unlockLevel: 1,
  },

  {
    templateId: "guard_demon",
    name: "ยักษ์เฝ้าประตู",
    cost: 2,
    type: "unit",
    tier: B,
    cardFaction: "NEUTRAL",
    description:
      "วางยักษ์เฝ้าประตูลงบนช่องว่างที่มีช่องว่างรอบตัวอย่างน้อย 1 ช่อง " +
      "เงื่อนไข: ต้องมีช่องว่างรอบตัว " +
      "ผลลัพธ์: ยูนิตขนาดใหญ่ที่ยากถูกล้อมแตก เหมาะตั้งแนวกลาง",
    ability: "💥 วางยักษ์แข็งแกร่ง — ช่องว่างรอบตัวเยอะกว่าปกติ",
    icon: "👹🚪",
    effectType: "unit",
    synergyTags: ["demon", "guard"],
    unlockLevel: 1,
  },

  {
    templateId: "rama_soldier",
    name: "ทหารพระราม",
    cost: 1,
    type: "unit",
    tier: B,
    cardFaction: "RAMA",
    description:
      "วางทหารพระรามลงบนช่องว่างที่มีช่องว่างรอบตัวอย่างน้อย 1 ช่อง " +
      "เงื่อนไข: เฉพาะช่องว่างเท่านั้น " +
      "ผลลัพธ์: ยูนิตพื้นฐานฝ่ายพระราม เหมาะสร้างฐานยึดพื้นที่",
    ability: "💥 วางทหาร — ราคา 1 ยึดพื้นที่ฝ่ายพระราม",
    icon: "🏹🧑",
    effectType: "unit",
    synergyTags: ["hero_rama", "rama_char", "soldier"],
    unlockLevel: 1,
  },

  {
    templateId: "lanka_soldier",
    name: "ทหารลงกา",
    cost: 1,
    type: "unit",
    tier: B,
    cardFaction: "LANKA",
    description:
      "วางทหารลงกาลงบนช่องว่างที่มีช่องว่างรอบตัวอย่างน้อย 1 ช่อง " +
      "เงื่อนไข: เฉพาะช่องว่างเท่านั้น " +
      "ผลลัพธ์: ยูนิตพื้นฐานฝ่ายลงกา เหมาะสร้างกำแพงหน้า",
    ability: "💥 วางทหาร — ราคา 1 ยึดพื้นที่ฝ่ายลงกา",
    icon: "👺🧑",
    effectType: "unit",
    synergyTags: ["hero_lanka", "demon", "soldier"],
    unlockLevel: 1,
  },

  {
    templateId: "forest_spirit",
    name: "วิญญาณป่า",
    cost: 1,
    type: "unit",
    tier: B,
    cardFaction: "NEUTRAL",
    description:
      "วางวิญญาณป่าลงบนช่องว่าง — ยูนิตขนาดเล็กที่เคลื่อนที่ได้คล่องตัว " +
      "เงื่อนไข: ต้องมีช่องว่างรอบตัวอย่างน้อย 1 ช่อง " +
      "ผลลัพธ์: ยึดพื้นที่รวดเร็ว ราคาถูก เหมาะใส่เด็คให้ลื่น",
    ability: "💥 วางวิญญาณป่า — เบา เร็ว ราคา 1",
    icon: "🌿👻",
    effectType: "unit",
    synergyTags: ["neutral", "light"],
    unlockLevel: 1,
  },

  {
    templateId: "market_merchant",
    name: "พ่อค้าตลาด",
    cost: 2,
    type: "unit",
    tier: B,
    cardFaction: "NEUTRAL",
    description:
      "วางพ่อค้าตลาดลงบนช่องว่าง — ยูนิตที่มีค่าสูงกว่ายูนิตธรรมดา " +
      "เงื่อนไข: ต้องมีช่องว่างรอบตัว " +
      "ผลลัพธ์: ยึดพื้นที่และยากถูกล้อมแตกในช่วงกลางเกม",
    ability: "💥 วางพ่อค้า — ราคา 2 ทนทานกว่าปกติ",
    icon: "🧑‍🤝‍🧑💰",
    effectType: "unit",
    synergyTags: ["neutral", "economy"],
    unlockLevel: 1,
  },

  // ══════════════════════════════════════════════════════════════
  // 🟩 AREA EXPANSION — ง่าย เพิ่มพื้นที่
  // ══════════════════════════════════════════════════════════════

  {
    templateId: "advance_line",
    name: "เดินหน้า",
    cost: 1,
    type: "unit",
    tier: B,
    cardFaction: "NEUTRAL",
    description:
      "วางยูนิตลงบนช่องว่างที่ติดกับยูนิตฝ่ายเราอย่างน้อย 1 ตัว " +
      "เงื่อนไข: ต้องวางติดยูนิตของเรา " +
      "ผลลัพธ์: ขยายแนวหน้า ยึดพื้นที่ต่อเนื่องจากกลุ่มที่มีอยู่",
    ability: "💥 วางต่อจากแนวของเรา — ขยายพื้นที่ทันที",
    icon: "⬆️🧑",
    effectType: "unit",
    synergyTags: ["neutral", "advance", "mobility"],
    unlockLevel: 1,
  },

  {
    templateId: "pincer_monkey",
    name: "ลิงโอบล้อม",
    cost: 1,
    type: "unit",
    tier: B,
    cardFaction: "NEUTRAL",
    description:
      "วางลิงลงบนช่องว่าง — เหมาะวางขนาบข้างศัตรูเพื่อลดช่องว่างรอบตัวของพวกมัน " +
      "เงื่อนไข: ต้องมีช่องว่างรอบตัวอย่างน้อย 1 ช่อง " +
      "ผลลัพธ์: การวางตำแหน่งดีทำให้ศัตรูสูญเสียช่องว่างรอบตัวได้ทันที",
    ability: "💥 วางลิงโอบล้อม — ลดช่องว่างรอบตัวศัตรูด้วยตำแหน่ง",
    icon: "🐒🤝",
    effectType: "unit",
    synergyTags: ["monkey", "pincer", "aoe"],
    unlockLevel: 1,
  },

  {
    templateId: "hill_demon",
    name: "ยักษ์เนิน",
    cost: 2,
    type: "unit",
    tier: B,
    cardFaction: "NEUTRAL",
    description:
      "วางยักษ์เนินลงบนช่องว่าง — ยูนิตขนาดใหญ่ที่ยึดพื้นที่ได้เยอะ " +
      "เงื่อนไข: ต้องมีช่องว่างรอบตัวอย่างน้อย 1 ช่อง " +
      "ผลลัพธ์: ยึดพื้นที่ขนาดใหญ่ และทนทานกว่ายูนิตราคา 1",
    ability: "💥 วางยักษ์เนิน — ราคา 2 ยึดพื้นที่มาก",
    icon: "👹⛰️",
    effectType: "unit",
    synergyTags: ["demon", "territory"],
    unlockLevel: 1,
  },

  {
    templateId: "vanguard_rama",
    name: "แนวหน้าพระราม",
    cost: 2,
    type: "unit",
    tier: B,
    cardFaction: "RAMA",
    description:
      "วางแนวหน้าพระรามลงบนช่องว่าง — ยูนิตฝ่ายพระรามที่มีความทนทานสูงกว่าทหารธรรมดา " +
      "เงื่อนไข: ต้องมีช่องว่างรอบตัวอย่างน้อย 1 ช่อง " +
      "ผลลัพธ์: ยึดพื้นที่กลางกระดาน ทนทานกว่าทหารราคา 1",
    ability: "💥 แนวหน้าฝ่ายพระราม — ราคา 2 ทนทาน ยึดพื้นที่มาก",
    icon: "🏹⚔️",
    effectType: "unit",
    synergyTags: ["hero_rama", "rama_char", "vanguard"],
    unlockLevel: 1,
  },

  {
    templateId: "vanguard_lanka",
    name: "แนวหน้าลงกา",
    cost: 2,
    type: "unit",
    tier: B,
    cardFaction: "LANKA",
    description:
      "วางแนวหน้าลงกาลงบนช่องว่าง — ยูนิตฝ่ายลงกาที่แข็งแกร่งกว่าทหารธรรมดา " +
      "เงื่อนไข: ต้องมีช่องว่างรอบตัวอย่างน้อย 1 ช่อง " +
      "ผลลัพธ์: ยึดพื้นที่กลางกระดาน สร้างกำแพงที่แข็งแกร่ง",
    ability: "💥 แนวหน้าฝ่ายลงกา — ราคา 2 ทนทาน สร้างกำแพง",
    icon: "👺⚔️",
    effectType: "unit",
    synergyTags: ["hero_lanka", "demon", "vanguard"],
    unlockLevel: 1,
  },

  // ══════════════════════════════════════════════════════════════
  // 🟥 ENEMY DISRUPTION — รบกวนศัตรู ราคาถูก
  // ══════════════════════════════════════════════════════════════

  {
    templateId: "quick_block",
    name: "ปิดทางด่วน",
    cost: 1,
    type: "skill",
    tier: B,
    cardFaction: "NEUTRAL",
    description:
      "เลือก 1 ช่องว่างบนกระดาน — ปิดช่องนั้น ศัตรูวางยูนิตไม่ได้ 1 เทิร์น " +
      "เงื่อนไข: ต้องเป็นช่องว่างเท่านั้น " +
      "ผลลัพธ์: ตัดเส้นทางขยายของศัตรูชั่วคราว ราคาถูกที่สุด",
    ability: "⚡ ปิด 1 ช่อง 1 เทิร์น — ตัดเส้นทางศัตรู ราคา 1",
    icon: "🚫⚡",
    effectType: "damage",
    skillKind: "blockTile",
    synergyTags: ["block_skill", "trap", "utility"],
    unlockLevel: 1,
  },

  {
    templateId: "squeeze_push",
    name: "บีบให้แน่น",
    cost: 2,
    type: "skill",
    tier: B,
    cardFaction: "NEUTRAL",
    description:
      "เลือกยูนิตศัตรู 1 ตัว — ผลักมันออกจากตำแหน่งปัจจุบัน 1 ช่อง " +
      "เงื่อนไข: มีช่องว่างให้ผลัก " +
      "ผลลัพธ์: ถ้าหลังผลักมันหมดช่องว่างรอบตัว — ล้อมแตกทันที",
    ability: "⚡ ผลักศัตรู 1 ตัว — ถ้าหมดช่องว่างรอบตัว = ล้อมแตก",
    icon: "👊💢",
    effectType: "damage",
    skillKind: "pushUnit",
    synergyTags: ["push_skill", "damage"],
    unlockLevel: 1,
  },

  {
    templateId: "road_block",
    name: "ถนนปิด",
    cost: 1,
    type: "skill",
    tier: B,
    cardFaction: "LANKA",
    description:
      "เลือก 1 ช่องว่างบนกระดาน — ปิดช่องนั้น ศัตรูวางยูนิตไม่ได้ 1 เทิร์น " +
      "เงื่อนไข: ต้องเป็นช่องว่างเท่านั้น " +
      "ผลลัพธ์: ตัดเส้นทางขยายฝ่ายพระราม ราคาถูก ทำ combo กับกับดักได้ดี",
    ability: "⚡ ปิดถนน 1 ช่อง — ตัดเส้นทางพระราม 1 เทิร์น",
    icon: "🚧👺",
    effectType: "damage",
    skillKind: "blockTile",
    synergyTags: ["block_skill", "trap", "hero_lanka"],
    unlockLevel: 1,
  },

  {
    templateId: "arrow_shot",
    name: "ยิงธนู",
    cost: 1,
    type: "skill",
    tier: B,
    cardFaction: "RAMA",
    description:
      "เลือก 1 ช่องว่างบนกระดาน — ปิดช่องนั้น ศัตรูวางยูนิตไม่ได้ 1 เทิร์น " +
      "เงื่อนไข: ต้องเป็นช่องว่างเท่านั้น " +
      "ผลลัพธ์: ตัดเส้นทางขยายฝ่ายลงกา ราคาถูก ทำ combo กับยูนิตได้ดี",
    ability: "⚡ ยิงธนูปิด 1 ช่อง — ตัดเส้นทางลงกา 1 เทิร์น",
    icon: "🏹💥",
    effectType: "damage",
    skillKind: "blockTile",
    synergyTags: ["block_skill", "hero_rama"],
    unlockLevel: 1,
  },

  {
    templateId: "sweep_kick",
    name: "เตะกวาด",
    cost: 2,
    type: "skill",
    tier: B,
    cardFaction: "NEUTRAL",
    description:
      "เลือกยูนิตศัตรู 1 ตัวที่มีช่องว่างรอบตัว ≤ 2 — ผลักมันออก 1 ช่อง " +
      "เงื่อนไข: ศัตรูต้องมีช่องว่างรอบตัวน้อย " +
      "ผลลัพธ์: บีบให้กลุ่มอ่อนแอลงทันที ทำให้ถูก destroyWeakGroup ได้ง่ายขึ้น",
    ability: "⚡ เตะศัตรู (ช่องว่างรอบตัว ≤ 2) — บีบให้กลุ่มแตกง่ายขึ้น",
    icon: "🦶💥",
    effectType: "damage",
    skillKind: "pushUnit",
    synergyTags: ["push_skill", "damage", "cut_skill"],
    unlockLevel: 1,
  },

  {
    templateId: "wall_of_thorns",
    name: "กำแพงหนาม",
    cost: 2,
    type: "skill",
    tier: B,
    cardFaction: "LANKA",
    description:
      "เลือก 1 ช่องว่างบนกระดาน — ปิดช่องนั้น ศัตรูวางยูนิตไม่ได้ 2 เทิร์น " +
      "เงื่อนไข: ต้องเป็นช่องว่างเท่านั้น " +
      "ผลลัพธ์: กำแพงหนามอยู่นานกว่าการปิดธรรมดา บีบศัตรูในพื้นที่",
    ability: "⚡ กำแพงหนาม — ปิด 1 ช่อง 2 เทิร์น บีบพื้นที่ศัตรู",
    icon: "🌵🚫",
    effectType: "buff",
    skillKind: "blockTile",
    synergyTags: ["block_skill", "trap", "hero_lanka"],
    unlockLevel: 1,
  },

  // ══════════════════════════════════════════════════════════════
  // 🟨 EARLY SYNERGY — สร้าง tag combo ง่าย
  // ══════════════════════════════════════════════════════════════

  {
    templateId: "monkey_duo",
    name: "คู่ลิงแสน",
    cost: 1,
    type: "unit",
    tier: B,
    cardFaction: "NEUTRAL",
    description:
      "วางลิงลงบนช่องว่าง — ถ้าในกลุ่มเดียวกันมีลิงอยู่แล้ว 1 ตัว กลุ่มจะแข็งแกร่งขึ้น " +
      "เงื่อนไข: มีลิงในกลุ่มอยู่แล้ว " +
      "ผลลัพธ์: เปิด synergy THREE_MONKEYS เร็วขึ้น (ต้องการ 3 ตัว)",
    ability: "💥 ลิงตัวที่ 2 — เปิดทางสู่ synergy กลุ่มลิง",
    icon: "🐒🐒",
    effectType: "unit",
    synergyTags: ["monkey", "summon"],
    unlockLevel: 1,
  },

  {
    templateId: "demon_pair",
    name: "คู่ยักษ์แกร่ง",
    cost: 1,
    type: "unit",
    tier: B,
    cardFaction: "NEUTRAL",
    description:
      "วางยักษ์ลงบนช่องว่าง — ถ้าในกลุ่มเดียวกันมียักษ์อยู่แล้ว 1 ตัว กลุ่มจะแข็งแกร่งขึ้น " +
      "เงื่อนไข: มียักษ์ในกลุ่มอยู่แล้ว " +
      "ผลลัพธ์: เปิด synergy TWO_DEMONS ทันที ทนทานต่อการล้อมแตก",
    ability: "💥 ยักษ์ตัวที่ 2 — เปิด synergy คู่ยักษ์ทันที",
    icon: "👹👹",
    effectType: "unit",
    synergyTags: ["demon", "summon"],
    unlockLevel: 1,
  },

  {
    templateId: "mixed_troop",
    name: "กองทัพผสม",
    cost: 2,
    type: "unit",
    tier: B,
    cardFaction: "NEUTRAL",
    description:
      "วางยูนิตผสมลงบนช่องว่าง — มีทั้ง tag monkey และ demon " +
      "เงื่อนไข: ต้องมีช่องว่างรอบตัวอย่างน้อย 1 ช่อง " +
      "ผลลัพธ์: เปิดทาง synergy ได้ทั้ง THREE_MONKEYS และ TWO_DEMONS",
    ability: "💥 กองผสม — นับทั้ง monkey และ demon synergy tag",
    icon: "🐒👹",
    effectType: "unit",
    synergyTags: ["monkey", "demon", "mixed"],
    unlockLevel: 1,
  },

  {
    templateId: "rally_call",
    name: "รวมพล",
    cost: 2,
    type: "skill",
    tier: B,
    cardFaction: "NEUTRAL",
    description:
      "เลือก 1 ช่องว่างบนกระดาน — ปิดช่องนั้น ตัดเส้นทางศัตรู " +
      "เงื่อนไข: ต้องเป็นช่องว่างเท่านั้น " +
      "ผลลัพธ์: ใช้รวมกับยูนิตเพื่อบีบพื้นที่ทำ combo ง่ายขึ้น มี tag mobility",
    ability: "⚡ รวมพล — ปิดช่องและสร้าง mobility synergy",
    icon: "📣🤝",
    effectType: "buff",
    skillKind: "blockTile",
    synergyTags: ["mobility", "buff", "block_skill"],
    unlockLevel: 1,
  },

  {
    templateId: "rama_banner",
    name: "ธงพระราม",
    cost: 1,
    type: "unit",
    tier: B,
    cardFaction: "RAMA",
    description:
      "วางธงพระรามลงบนช่องว่าง — ยูนิตที่มี tag hero_rama และ rama_char " +
      "เงื่อนไข: ต้องมีช่องว่างรอบตัว " +
      "ผลลัพธ์: เปิดทาง synergy HANUMAN_RAMA และคอมโบกับ hero ฝ่ายพระรามได้เร็วขึ้น",
    ability: "💥 ธง — tag rama_char เปิด synergy กับหนุมานและพระราม",
    icon: "🏹🚩",
    effectType: "unit",
    synergyTags: ["hero_rama", "rama_char"],
    unlockLevel: 1,
  },

  {
    templateId: "lanka_banner",
    name: "ธงลงกา",
    cost: 1,
    type: "unit",
    tier: B,
    cardFaction: "LANKA",
    description:
      "วางธงลงกาลงบนช่องว่าง — ยูนิตที่มี tag hero_lanka และ demon " +
      "เงื่อนไข: ต้องมีช่องว่างรอบตัว " +
      "ผลลัพธ์: เปิดทาง synergy ฝ่ายลงกาและคอมโบกับกุมภกรรณ ทศกัณฐ์ได้เร็วขึ้น",
    ability: "💥 ธง — tag demon + hero_lanka เปิด synergy ได้เร็ว",
    icon: "👺🚩",
    effectType: "unit",
    synergyTags: ["hero_lanka", "demon"],
    unlockLevel: 1,
  },

  // ══════════════════════════════════════════════════════════════
  // 🟪 UTILITY — เครื่องมือ cost-effective
  // ══════════════════════════════════════════════════════════════

  {
    templateId: "quick_dash",
    name: "พุ่งไว",
    cost: 1,
    type: "skill",
    tier: B,
    cardFaction: "NEUTRAL",
    description:
      "เลือกยูนิตศัตรู 1 ตัว — ผลักมันออก 1 ช่อง " +
      "เงื่อนไข: ต้องมีช่องว่างให้ผลัก " +
      "ผลลัพธ์: ราคาถูกที่สุดสำหรับสกิลผลัก เหมาะ combo กับสกิลอื่น",
    ability: "⚡ พุ่งผลักศัตรู 1 ตัว — ราคา 1 ถูกที่สุดในหมวดผลัก",
    icon: "💨👊",
    effectType: "buff",
    skillKind: "pushUnit",
    synergyTags: ["push_skill", "mobility"],
    unlockLevel: 1,
  },

  {
    templateId: "reinforce",
    name: "เสริมแนว",
    cost: 2,
    type: "unit",
    tier: B,
    cardFaction: "NEUTRAL",
    description:
      "วางยูนิตเสริมแนวลงบนช่องว่างที่ติดกับยูนิตฝ่ายเราอย่างน้อย 2 ตัว " +
      "เงื่อนไข: ต้องวางติดยูนิตของเราอย่างน้อย 2 ตัว " +
      "ผลลัพธ์: กลุ่มจะแข็งแกร่งขึ้นและยากถูกล้อมแตก",
    ability: "💥 เสริมแนว — ต้องวางติดยูนิตเรา 2 ตัว กลุ่มแข็งแกร่งขึ้น",
    icon: "🛡️➕",
    effectType: "unit",
    synergyTags: ["neutral", "buff", "guard"],
    unlockLevel: 1,
  },

  {
    templateId: "decoy",
    name: "ตัวล่อ",
    cost: 1,
    type: "unit",
    tier: B,
    cardFaction: "NEUTRAL",
    description:
      "วางตัวล่อลงบนช่องว่าง — ยูนิตเล็กเหมาะล่อให้ศัตรูเสียโอกาส " +
      "เงื่อนไข: ต้องมีช่องว่างรอบตัวอย่างน้อย 1 ช่อง " +
      "ผลลัพธ์: ถ้าศัตรูโจมตีตัวล่อ เราใช้เทิร์นอื่นขยายพื้นที่ได้",
    ability: "💥 ตัวล่อ — ล่อให้ศัตรูเสียเทิร์น ราคา 1",
    icon: "🎯🐣",
    effectType: "unit",
    synergyTags: ["neutral", "trap", "decoy"],
    unlockLevel: 1,
  },

  {
    templateId: "fortify",
    name: "สร้างป้อมชั่วคราว",
    cost: 2,
    type: "skill",
    tier: B,
    cardFaction: "NEUTRAL",
    description:
      "เลือก 1 ช่องว่างบนกระดาน — ปิดช่องนั้น 2 เทิร์น " +
      "เงื่อนไข: ต้องเป็นช่องว่างเท่านั้น " +
      "ผลลัพธ์: สร้างป้อมปิดศัตรูได้นาน ใช้รักษาตำแหน่งสำคัญกลางกระดาน",
    ability: "⚡ สร้างป้อม — ปิด 1 ช่อง 2 เทิร์น รักษาตำแหน่งสำคัญ",
    icon: "🏰🚫",
    effectType: "buff",
    skillKind: "blockTile",
    synergyTags: ["utility", "block_skill", "buff"],
    unlockLevel: 1,
  },

  {
    templateId: "energy_tap",
    name: "แตะพลัง",
    cost: 1,
    type: "unit",
    tier: B,
    cardFaction: "NEUTRAL",
    description:
      "วางยูนิตราคาถูกลงบนช่องว่าง — ใช้เมื่อมีพลังงานเหลือ 1 " +
      "เงื่อนไข: ต้องมีช่องว่างรอบตัวอย่างน้อย 1 ช่อง " +
      "ผลลัพธ์: ไม่เสียพลังงานเปล่า ยึดพื้นที่ได้ในช่วง dead turn",
    ability: "💥 ใช้พลัง 1 อย่างคุ้มค่า — ยึดพื้นที่ได้แม้พลังเหลือน้อย",
    icon: "⚡🖐️",
    effectType: "unit",
    synergyTags: ["neutral", "utility", "light"],
    unlockLevel: 1,
  },

  {
    templateId: "shadow_step",
    name: "ก้าวเงา",
    cost: 1,
    type: "skill",
    tier: B,
    cardFaction: "LANKA",
    description:
      "เลือก 1 ช่องว่างบนกระดาน — ปิดช่องนั้น ศัตรูใช้ไม่ได้ 1 เทิร์น " +
      "เงื่อนไข: ต้องเป็นช่องว่างเท่านั้น " +
      "ผลลัพธ์: แม้เป็นสกิลธรรมดา แต่มี tag trap+cursor เปิด combo กับ card ฝ่ายลงกาได้",
    ability: "⚡ ก้าวเงา — ปิด 1 ช่อง มี trap tag ใช้ combo ได้",
    icon: "👺💨",
    effectType: "buff",
    skillKind: "blockTile",
    synergyTags: ["trap", "block_skill", "hero_lanka", "curse"],
    unlockLevel: 1,
  },

  {
    templateId: "light_arrow",
    name: "ธนูแสง",
    cost: 1,
    type: "skill",
    tier: B,
    cardFaction: "RAMA",
    description:
      "เลือกยูนิตศัตรู 1 ตัว — ผลักมันออก 1 ช่อง " +
      "เงื่อนไข: ต้องมีช่องว่างให้ผลัก " +
      "ผลลัพธ์: สกิลผลักราคาถูกของฝ่ายพระราม มี tag hero_rama + mobility ทำ combo ได้",
    ability: "⚡ ธนูแสง — ผลักศัตรู 1 ตัว มี mobility tag ทำ combo",
    icon: "🏹✨",
    effectType: "buff",
    skillKind: "pushUnit",
    synergyTags: ["hero_rama", "push_skill", "mobility"],
    unlockLevel: 1,
  },

  {
    templateId: "river_guard",
    name: "ยักษ์เฝ้าแม่น้ำ",
    cost: 2,
    type: "unit",
    tier: B,
    cardFaction: "NEUTRAL",
    description:
      "วางยักษ์เฝ้าแม่น้ำลงบนช่องว่างกลางกระดาน — ยูนิตที่เหมาะตั้งรับ " +
      "เงื่อนไข: ต้องมีช่องว่างรอบตัวอย่างน้อย 1 ช่อง " +
      "ผลลัพธ์: ยึดพื้นที่กลาง ทนทาน เหมาะ combo กับ TWO_DEMONS",
    ability: "💥 ยักษ์เฝ้าแม่น้ำ — ยึดพื้นที่กลาง เหมาะ synergy demon",
    icon: "👹🌊",
    effectType: "unit",
    synergyTags: ["demon", "guard", "territory"],
    unlockLevel: 1,
  },

  {
    templateId: "jungle_monkey",
    name: "ลิงป่าใหญ่",
    cost: 2,
    type: "unit",
    tier: B,
    cardFaction: "NEUTRAL",
    description:
      "วางลิงป่าใหญ่ลงบนช่องว่าง — ลิงขนาดใหญ่กว่าปกติ " +
      "เงื่อนไข: ต้องมีช่องว่างรอบตัวอย่างน้อย 1 ช่อง " +
      "ผลลัพธ์: ยึดพื้นที่ได้มากกว่าลิงธรรมดา เหมาะ combo กับ THREE_MONKEYS",
    ability: "💥 ลิงป่าใหญ่ — ยึดพื้นที่มาก เหมาะ synergy monkey",
    icon: "🐒🌴",
    effectType: "unit",
    synergyTags: ["monkey", "summon", "territory"],
    unlockLevel: 1,
  },

  {
    templateId: "mirror_block",
    name: "ปิดกระจก",
    cost: 2,
    type: "skill",
    tier: B,
    cardFaction: "RAMA",
    description:
      "เลือก 1 ช่องว่างบนกระดาน — ปิดช่องนั้น 2 เทิร์น ตัดเส้นทางลงกา " +
      "เงื่อนไข: ต้องเป็นช่องว่างเท่านั้น " +
      "ผลลัพธ์: สกิลปิดนาน มี hero_rama tag ทำ combo กับยูนิตพระรามได้",
    ability: "⚡ ปิดกระจก — ปิด 1 ช่อง 2 เทิร์น + tag hero_rama สำหรับ combo",
    icon: "🪞🔒",
    effectType: "buff",
    skillKind: "blockTile",
    synergyTags: ["hero_rama", "block_skill", "mobility"],
    unlockLevel: 1,
  },
];


// ─── Deck constants ───────────────────────────────────────────────────────────

export const DECK_SIZE = 20;

/**
 * Build a starter 20-card deck for the given faction.
 *
 * IMPORTANT: Only uses cards with unlockLevel <= 1 so the starter deck
 * never contains locked cards. Pads remaining slots with copies of basic cards
 * to always reach exactly DECK_SIZE.
 */
export function buildDefaultDeckTemplateIds(faction: Faction): string[] {
  // Only starter-eligible cards (unlockLevel <= 1) that match the faction
  const eligibleCards = CARD_LIBRARY.filter(
    (c) =>
      c.unlockLevel <= 1 &&
      (c.cardFaction === faction || c.cardFaction === "NEUTRAL"),
  );

  // Build a pool: 4 copies of each basic, 2 of each hero, 1 of each legendary
  const pool: string[] = [];
  for (const c of eligibleCards) {
    const maxCopies = c.tier === "basic" ? 4 : c.tier === "hero" ? 2 : 1;
    for (let i = 0; i < maxCopies; i++) pool.push(c.templateId);
  }

  // If pool is smaller than DECK_SIZE, pad with the cheapest available basic
  const fallbackId =
    CARD_LIBRARY.find(
      (c) => c.tier === "basic" && c.unlockLevel <= 1,
    )?.templateId ?? "quick_monkey";

  while (pool.length < DECK_SIZE) pool.push(fallbackId);

  return pool.slice(0, DECK_SIZE);
}

// ─── Deck instantiation ───────────────────────────────────────────────────────

export function instantiateDeck(templateIds: string[], owner: Faction): Card[] {
  let i = 0;
  return templateIds
    .map((id) => CARD_LIBRARY.find((c) => c.templateId === id))
    .filter(Boolean)
    .map((tpl) => {
      const t = tpl!;
      const base = {
        id: `${owner}_${t.templateId}_${i++}`,
        name: t.name,
        cost: t.cost,
        rarity: t.tier === "legendary" ? "epic" : t.tier === "hero" ? "rare" : "common",
        tier: t.tier,
        description: t.description,
        ability: t.ability,
        icon: t.icon,
        image: undefined,
        effectType: t.effectType,
        synergyTags: t.synergyTags,
        comboType: t.templateId,
      } as const;
      if (t.type === "unit") return { ...base, type: "unit", unit: { faction: owner } } as Card;
      return { ...base, type: "skill", skill: { kind: t.skillKind ?? "blockTile" } } as Card;
    });
}
