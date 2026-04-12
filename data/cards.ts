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
// CARD LIBRARY — 50+ Unique Cards categorized by Roles & Themes
// ─────────────────────────────────────────────────────────────────────────────

export const CARD_LIBRARY: CardTemplate[] = [

  // ============================================================================
  // [BASIC UNITS] NO ABILITY RULE APPLIED (Starter/Fodder Units)
  // ============================================================================

  // -- RAMA BASICS --
  {
    templateId: "quick_monkey",
    name: "ลิงว่องไว",
    cost: 1,
    type: "unit",
    tier: B,
    cardFaction: "RAMA",
    description: "ยูนิตพื้นฐาน ใช้ยึดพื้นที่เท่านั้น",
    ability: "ไม่มีความสามารถ",
    icon: "🏃",
    effectType: "unit",
    synergyTags: ["monkey", "mobility", "light"],
    unlockLevel: 1,
  },
  {
    templateId: "macaque_scout",
    name: "วานรลาดตระเวน",
    cost: 1,
    type: "unit",
    tier: B,
    cardFaction: "RAMA",
    description: "ยูนิตพื้นฐาน ใช้ยึดพื้นที่เท่านั้น",
    ability: "ไม่มีความสามารถ",
    icon: "🔭",
    effectType: "unit",
    synergyTags: ["monkey", "scout"],
    unlockLevel: 1,
  },
  {
    templateId: "monkey_warrior",
    name: "วานรทหารราบ",
    cost: 2,
    type: "unit",
    tier: B,
    cardFaction: "RAMA",
    description: "ยูนิตพื้นฐาน ใช้ยึดพื้นที่เท่านั้น",
    ability: "ไม่มีความสามารถ",
    icon: "🐒",
    effectType: "unit",
    synergyTags: ["monkey", "soldier"],
    unlockLevel: 1,
  },
  {
    templateId: "macaque_guard",
    name: "วานรโล่ศิลา",
    cost: 2,
    type: "unit",
    tier: B,
    cardFaction: "RAMA",
    description: "ยูนิตพื้นฐาน ใช้ยึดพื้นที่เท่านั้น",
    ability: "ไม่มีความสามารถ",
    icon: "🛡️",
    effectType: "unit",
    synergyTags: ["monkey", "guard", "heavy"],
    unlockLevel: 1,
  },
  {
    templateId: "monkey_archer",
    name: "วานรธนู",
    cost: 2,
    type: "unit",
    tier: B,
    cardFaction: "RAMA",
    description: "ยูนิตพื้นฐาน ใช้ยึดพื้นที่เท่านั้น",
    ability: "ไม่มีความสามารถ",
    icon: "🏹",
    effectType: "unit",
    synergyTags: ["monkey", "archer"],
    unlockLevel: 1,
  },
  {
    templateId: "monkey_medic",
    name: "หมอยาวานร",
    cost: 2,
    type: "unit",
    tier: B,
    cardFaction: "RAMA",
    description: "ยูนิตพื้นฐาน ใช้ยึดพื้นที่เท่านั้น",
    ability: "ไม่มีความสามารถ",
    icon: "💊",
    effectType: "unit",
    synergyTags: ["monkey", "medic"],
    unlockLevel: 1,
  },
  {
    templateId: "monkey_spear",
    name: "วานรหอกยาว",
    cost: 2,
    type: "unit",
    tier: B,
    cardFaction: "RAMA",
    description: "ยูนิตพื้นฐาน ใช้ยึดพื้นที่เท่านั้น",
    ability: "ไม่มีความสามารถ",
    icon: "🔱",
    effectType: "unit",
    synergyTags: ["monkey", "soldier"],
    unlockLevel: 1,
  },

  // -- LANKA BASICS --
  {
    templateId: "demon_soldier",
    name: "ยักษ์นักรบ",
    cost: 2,
    type: "unit",
    tier: B,
    cardFaction: "LANKA",
    description: "ยูนิตพื้นฐาน ใช้ยึดพื้นที่เท่านั้น",
    ability: "ไม่มีความสามารถ",
    icon: "👹",
    effectType: "unit",
    synergyTags: ["demon", "soldier"],
    unlockLevel: 1,
  },
  {
    templateId: "demon_guard",
    name: "อสูรโล่เหล็ก",
    cost: 2,
    type: "unit",
    tier: B,
    cardFaction: "LANKA",
    description: "ยูนิตพื้นฐาน ใช้ยึดพื้นที่เท่านั้น",
    ability: "ไม่มีความสามารถ",
    icon: "🛡️",
    effectType: "unit",
    synergyTags: ["demon", "guard", "heavy"],
    unlockLevel: 1,
  },
  {
    templateId: "demon_archer",
    name: "อสูรหน้าไม้",
    cost: 2,
    type: "unit",
    tier: B,
    cardFaction: "LANKA",
    description: "ยูนิตพื้นฐาน ใช้ยึดพื้นที่เท่านั้น",
    ability: "ไม่มีความสามารถ",
    icon: "🎯",
    effectType: "unit",
    synergyTags: ["demon", "archer"],
    unlockLevel: 1,
  },
  {
    templateId: "demon_warrior",
    name: "ยักษ์ขวานสังหาร",
    cost: 3,
    type: "unit",
    tier: B,
    cardFaction: "LANKA",
    description: "ยูนิตพื้นฐาน ใช้ยึดพื้นที่เท่านั้น",
    ability: "ไม่มีความสามารถ",
    icon: "🪓",
    effectType: "unit",
    synergyTags: ["demon", "vanguard", "heavy"],
    unlockLevel: 1,
  },
  {
    templateId: "demon_beast",
    name: "สุนัขโลกันตร์",
    cost: 1,
    type: "unit",
    tier: B,
    cardFaction: "LANKA",
    description: "ยูนิตพื้นฐาน ใช้ยึดพื้นที่เท่านั้น",
    ability: "ไม่มีความสามารถ",
    icon: "🐺",
    effectType: "unit",
    synergyTags: ["demon", "beast", "mobility"],
    unlockLevel: 1,
  },
  {
    templateId: "demon_drummer",
    name: "อสูรกลองศึก",
    cost: 2,
    type: "unit",
    tier: B,
    cardFaction: "LANKA",
    description: "ยูนิตพื้นฐาน ใช้ยึดพื้นที่เท่านั้น",
    ability: "ไม่มีความสามารถ",
    icon: "🥁",
    effectType: "unit",
    synergyTags: ["demon", "support"],
    unlockLevel: 1,
  },

  // -- NEUTRAL BASIC SKILLS -- 
  {
    templateId: "move_skill",
    name: "ย้ายทัพ",
    cost: 1,
    type: "skill",
    tier: B,
    cardFaction: "NEUTRAL",
    description: "เงื่อนไข: เลือกยูนิตของฝ่ายเดียวกัน 1 ตัว\nผลลัพธ์: สลับตำแหน่งยูนิตนี้ไปยังช่องว่างใกล้เคียง",
    ability: "สลับตำแหน่งยูนิตฝ่ายเรา",
    icon: "↪️",
    effectType: "control",
    skillKind: "pushUnit",
    synergyTags: ["mobility", "dodge"],
    unlockLevel: 1,
  },
  {
    templateId: "cut_skill",
    name: "ฟันฝ่า",
    cost: 2,
    type: "skill",
    tier: B,
    cardFaction: "NEUTRAL",
    description: "เงื่อนไข: ศัตรูอยู่ตัวเดียว ไม่มีพวกติดกัน\nผลลัพธ์: โจมตีและทำลายเป้าหมายทันที",
    ability: "ทำลายยูนิตโดดเดี่ยว",
    icon: "🗡️",
    effectType: "damage",
    skillKind: "destroyWeakGroup",
    synergyTags: ["cut_skill", "damage"],
    unlockLevel: 1,
  },
  {
    templateId: "block_skill",
    name: "ขวางทาง",
    cost: 1,
    type: "skill",
    tier: B,
    cardFaction: "NEUTRAL",
    description: "เงื่อนไข: เลือกช่องว่าง 1 ช่อง\nผลลัพธ์: ปิดช่องนั้นทิ้ง 1 เทิร์น ห้ามวางการ์ดเด็ดขาด",
    ability: "ปิด 1 ช่องว่าง",
    icon: "🚧",
    effectType: "zone_control",
    skillKind: "blockTile",
    synergyTags: ["block_skill", "territory"],
    unlockLevel: 1,
  },
  {
    templateId: "mirror_block",
    name: "ปิดกระจก",
    cost: 2,
    type: "skill",
    tier: B,
    cardFaction: "RAMA",
    description: "เงื่อนไข: เลือกช่องว่าง 1 ช่อง\nผลลัพธ์: ปิดช่องนั้น 2 เทิร์น ตัดเส้นทางลงกา",
    ability: "ปิดกระจกยาวนาน 2 เทิร์น",
    icon: "🪞",
    effectType: "zone_control",
    skillKind: "blockTile",
    synergyTags: ["hero_rama", "block_skill", "mobility"],
    unlockLevel: 1,
  },

  // ============================================================================
  // [HERO & LEGENDARY] DISTINCT ROLES APPLIED
  // ============================================================================

  // ── 1. ASSASSIN (ฆ่าเป้าหมายเดี่ยว) ──────────────────────────────────────
  {
    templateId: "snipe_arrow",
    name: "ศรลอบสังหาร",
    cost: 3,
    type: "skill",
    tier: H,
    cardFaction: "NEUTRAL",
    description: "เงื่อนไข: เลือกยูนิตศัตรู\nผลลัพธ์: เล็งจุดอ่อน ทำลายศัตรูทิ้งทันทีไม่ว่าจะขนาดย่อหรือใหญ่",
    ability: "ลอบสังหารเป้าหมายเดี่ยว",
    icon: "🏹",
    effectType: "damage",
    skillKind: "destroyWeakGroup",
    synergyTags: ["assassin", "damage"],
    unlockLevel: 3,
  },
  {
    templateId: "demon_assassin",
    name: "อสูรซุ่มโจมตี",
    cost: 3,
    type: "unit",
    tier: H,
    cardFaction: "LANKA",
    description: "เงื่อนไข: โยนลงแนบชิดศัตรู\nผลลัพธ์: ถ้าศัตรูตัวนั้นเหลือช่องหายใจแค่ 1 ช่อง จะถูกลอบกัดทำลายทันที",
    ability: "ทำลายศัตรูที่อ่อนแอจากเงามืด",
    icon: "🥷",
    effectType: "damage",
    synergyTags: ["demon", "assassin", "vanguard"],
    comboType: "demon_assassin",
    unlockLevel: 2,
  },

  // ── 2. ZONE CONTROL (คุมพื้นที่) ─────────────────────────────────────────
  {
    templateId: "giant_wall",
    name: "กำแพงพสุธายักษ์",
    cost: 3,
    type: "skill",
    tier: H,
    cardFaction: "LANKA",
    description: "เงื่อนไข: ร่ายลงบนพื้นที่ว่าง 2 แผ่น\nผลลัพธ์: สร้างกำแพงถาวร 2 ช่อง ปิดกั้นการเดินของทัพศัตรูอย่างเด็ดขาด",
    ability: "ปิดพื้นที่ทำกำแพงถาวร",
    icon: "🧱",
    effectType: "zone_control",
    skillKind: "blockTile",
    synergyTags: ["demon", "guard", "zone_control"],
    unlockLevel: 4,
  },
  {
    templateId: "block_area",
    name: "เขตแดนวิญญาณ",
    cost: 2,
    type: "skill",
    tier: H,
    cardFaction: "NEUTRAL",
    description: "เงื่อนไข: เลือกจุดยุทธศาสตร์จุดเชื่อม\nผลลัพธ์: ผนึกช่องว่างนั้น 3 เทิร์น ทำลายการบุกรุกโดยสิ้นเชิง",
    ability: "ปิดพื้นที่แบบเจาะจงจุดตาย",
    icon: "🛑",
    effectType: "zone_control",
    skillKind: "blockTile",
    synergyTags: ["magic", "zone_control", "territory"],
    unlockLevel: 5,
  },

  // ── 3. SUMMON (สร้างยูนิตทดแทน) ─────────────────────────────────────────
  {
    templateId: "monkey_army",
    name: "กองทัพพลับพลา",
    cost: 5,
    type: "unit",
    tier: H,
    cardFaction: "RAMA",
    description: "เงื่อนไข: วางลงในดินแดนเรา\nผลลัพธ์: อัญเชิญ ลิงว่องไว 2 ตัว ออกมาช่วยคุมพื้นที่โดยรอบอัตโนมัติในตาหน้า",
    ability: "เรียกลูกน้อง ลิงว่องไว x2",
    icon: "🧑‍🤝‍🧑",
    effectType: "summon",
    synergyTags: ["monkey", "summon", "army"],
    comboType: "monkey_army",
    unlockLevel: 4,
  },
  {
    templateId: "demon_army",
    name: "ค่ายกลอสูร",
    cost: 5,
    type: "unit",
    tier: H,
    cardFaction: "LANKA",
    description: "เงื่อนไข: วางทับกองทัพฝ่ายตัวเอง\nผลลัพธ์: อัญเชิญ ยักษ์นักรบ 2 ตัว พุ่งออกมาจากประตูมิติเข้าล้อมศัตรูที่ใกล้ที่สุด",
    ability: "สุ่มเสกมนต์ยักษ์นักรบ x2",
    icon: "🏯",
    effectType: "summon",
    synergyTags: ["demon", "summon", "army"],
    comboType: "demon_army",
    unlockLevel: 4,
  },

  // ── 4. TELEPORT (ย้ายตำแหน่ง/หนีตาย) ────────────────────────────────────
  {
    templateId: "macaque_captain",
    name: "วานรทลายด่าน",
    cost: 4,
    type: "unit",
    tier: H,
    cardFaction: "RAMA",
    description: "เอฟเฟกต์: เลือกยูนิตพันธมิตร 1 ตัวที่ตกอยู่ในวงล้อม\nผลลัพธ์: สลับตำแหน่งวานรตัวนี้กับเป้าหมายเพื่อดึงเพื่อนหนีตายด่วน",
    ability: "สลับตำแหน่งดึงเพื่อนหนี",
    icon: "🌀",
    effectType: "control",
    synergyTags: ["monkey", "vanguard", "teleport"],
    comboType: "macaque_cap",
    unlockLevel: 2,
  },

  // ── 5. TRAP (กับดักวางล่วงหน้า) ──────────────────────────────────────────
  {
    templateId: "push_wind",
    name: "กับดักพายุหมุน",
    cost: 2,
    type: "skill",
    tier: H,
    cardFaction: "NEUTRAL",
    description: "เงื่อนไข: วางซ่อนไว้ในช่องว่าง 1 ช่อง\nผลลัพธ์: หากในเทิร์นหน้าศัตรูพยายามเดินทับ จะสะท้อนกระเด็นออกปลิวไปไกล",
    ability: "ซ่อนกับดักลมพายุดีดศัตรู",
    icon: "🌪️",
    effectType: "passive",
    skillKind: "pushUnit",
    synergyTags: ["trap", "wind", "control"],
    unlockLevel: 3,
  },
  {
    templateId: "fire_trap",
    name: "กับดักอัคคีบาดาล",
    cost: 3,
    type: "skill",
    tier: H,
    cardFaction: "LANKA",
    description: "เงื่อนไข: ระบุช่องว่าง 1 ช่องซ่อนระเบิดไว้\nผลลัพธ์: หากในเทิร์นถัดไปมีศัตรูชิ้นใดเข้ามาเหยียบ จะลุกไหม้และทำลายยูนิตนั้น",
    ability: "วางกับดักไฟล้างบาง",
    icon: "🔥",
    effectType: "passive",
    skillKind: "destroyWeakGroup", // acts as trap kill
    synergyTags: ["demon", "trap", "fire"],
    unlockLevel: 5,
  },

  // ── 6. BUFF AREA (บัฟกลุ่ม/สนับสนุนทัพ) ───────────────────────────────────
  {
    templateId: "monkey_general",
    name: "แม่ทัพขุนเหล็ก",
    cost: 4,
    type: "unit",
    tier: H,
    cardFaction: "RAMA",
    description: "เงื่อนไข: ยูนิตฝ่ายเราอยู่ชิดรอบตัว\nผลลัพธ์: ลดอัตราการถูกล้อม (ไม่ต้องใช้ช่องหายใจเยอะ) ทำให้ทัพเหนียวแน่นขึ้น!",
    ability: "ออร่าลดจุดตายของเพื่อนรอบวง",
    icon: "👑",
    effectType: "buff",
    synergyTags: ["monkey", "guard", "buff_area", "commander"],
    comboType: "monkey_general",
    unlockLevel: 3,
  },
  {
    templateId: "healing_drum",
    name: "กลองรบรักษา",
    cost: 3,
    type: "unit",
    tier: H,
    cardFaction: "NEUTRAL",
    description: "เอฟเฟกต์: ยูนิตทุกตัวฝั่งเราในรัศมี 2 ช่อง\nผลลัพธ์: ไม่สนใจสถานะผิดปกติใดๆ (ต้านทานการถูกทำลายฟรี 1 ครั้ง)",
    ability: "คุ้มครองอาณาเขต 2 ช่อง",
    icon: "🥁",
    effectType: "buff",
    synergyTags: ["support", "buff_area"],
    comboType: "healing_drum",
    unlockLevel: 6,
  },

  // ── 7. DEBUFF (ลดความสามารถ/ปั่นป่วน) ────────────────────────────────────
  {
    templateId: "demon_general",
    name: "แม่ทัพอสูรทมิฬ",
    cost: 4,
    type: "unit",
    tier: H,
    cardFaction: "LANKA",
    description: "เอฟเฟกต์: แผ่จิตสังหารในดินแดน\nผลลัพธ์: ศัตรูใดที่ล้ำเข้ามาในรัศมี 1 ช่อง จะไม่สามารถกระตุ้นโบนัส Combo ใดๆได้เลย",
    ability: "ปิดกั้นคอมโบของศัตรูรอบๆ",
    icon: "👹",
    effectType: "aoe",
    synergyTags: ["demon", "debuff", "commander"],
    comboType: "demon_general",
    unlockLevel: 3,
  },

  // ── 8. ENERGY CONTROL (ยุ่งกับทรัพยากร/จั่ว) ──────────────────────────────
  {
    templateId: "drain",
    name: "คำสาปสูบโลหิต",
    cost: 3,
    type: "skill",
    tier: L,
    cardFaction: "LANKA",
    description: "เอฟเฟกต์: ยิงคำสาปสูบพลังใส่กษัตริย์\nผลลัพธ์: ขโมย 1 Energy จากศัตรูมาเป็นของเราทันที (ศัตรูขาดแคลนพลังงานต้านทาน)",
    ability: "แย่งชิง Energy 1 แต้ม",
    icon: "🧛",
    effectType: "global",
    synergyTags: ["magic", "energy_control", "curse"],
    unlockLevel: 7,
  },

  // ── 9. COPY / CLONE (ตบตา/สร้างร่างแยก) ─────────────────────────────────
  {
    templateId: "indrajit",
    name: "อินทรชิต",
    cost: 6,
    type: "unit",
    tier: L,
    cardFaction: "LANKA",
    description: "เอฟเฟกต์: ร่ายคาถาลวงตาสร้างร่างปลอม\nผลลัพธ์: ก๊อปปี้ร่างโคลนอีก 1 ร่างลงฝั่งตรงข้ามเพื่อหลอกล่อและคุมช่องกระดานไปพร้อมกัน",
    ability: "แยกร่างโคลนป่วนยุทธวิธี",
    icon: "🦹",
    effectType: "summon",
    synergyTags: ["demon", "indrajit", "clone", "magic"],
    comboType: "indrajit",
    unlockLevel: 7,
  },

  // ── 10. SACRIFICE (สละชีวิตแลกพลังมหาศาล) ────────────────────────────────
  {
    templateId: "bomb",
    name: "พลีชีพทำลายล้าง",
    cost: 4,
    type: "skill",
    tier: L,
    cardFaction: "NEUTRAL",
    description: "เงื่อนไข: สละยูนิตของเราเอง 1 ตัวในการร่ายเวท\nผลลัพธ์: ระเบิดตูมใหญ่กวาดล้างยูนิตศัตรูพินาศทั้งรัศมี 2 ช่องรอบตัวร่าย!",
    ability: "สังเวยเพื่อระเบิดระดับปูพรม",
    icon: "💣",
    effectType: "damage",
    skillKind: "stormCut", // Large Area kill mechanic
    synergyTags: ["sacrifice", "bomb", "aoe"],
    unlockLevel: 6,
  },

  // ── 11. DELAY (เอฟเฟกต์ล่าช้าที่เลี่ยงบอด) ─────────────────────────────────
  {
    templateId: "phra_lak",
    name: "พระลักษณ์",
    cost: 5,
    type: "unit",
    tier: H,
    cardFaction: "RAMA",
    description: "เงื่อนไข: วางลงเคียงข้างกองพล\nผลลัพธ์: ในรอบหน้า ศัตรูจะไม่สามารถใช้สกิลก่อกวนใดๆ ในแนวแผ่นดินนี้ได้เลย",
    ability: "คุ้มกันเพื่อนจากการรุกล้ำตาหน้า",
    icon: "🛡️",
    effectType: "buff",
    synergyTags: ["hero_rama", "rama_char", "delay"],
    comboType: "phra_lak",
    unlockLevel: 3,
  },
  {
    templateId: "kumpha",
    name: "กุมภกรรณ",
    cost: 6,
    type: "unit",
    tier: L,
    cardFaction: "LANKA",
    description: "เงื่อนไข: เมื่อถูกวางลงทับหน้าแนวรบ\nผลลัพธ์: ส่งวิญญาณศัตรูทั้งหมดให้ \"หลับลึก\" หยุดการขยายอาณาเขตศัตรูถาวรไป 1 เทิร์นเต็มๆ",
    ability: "หลับไหลศัตรูทั้งผืนฟ้า 1 เทิร์น",
    icon: "💤",
    effectType: "global",
    synergyTags: ["demon", "kumpha", "delay", "guard"],
    comboType: "kumpha",
    unlockLevel: 6,
  },

  // ── 12. CHAIN (โจมตีชิ่งทะลวงตับ) ────────────────────────────────────────
  {
    templateId: "storm_spell",
    name: "ศรสายฟ้าฟาด",
    cost: 4,
    type: "skill",
    tier: L,
    cardFaction: "NEUTRAL",
    description: "เอฟเฟกต์: ชิ่งโจมตีกระแสไฟฟ้าแรงสูง\nผลลัพธ์: ผ่าทำลายศัตรูแรก และจะชิ่งต่อไปยังศัตรูใกล้ๆ สูงสุดรวมถึง 4 เป้าหมาย!!",
    ability: "โจมตีชิ่ง 4 เป้าหมายอย่างรุนแรง",
    icon: "⚡",
    effectType: "chain",
    skillKind: "stormCut",
    synergyTags: ["magic", "storm_skill", "chain", "damage"],
    unlockLevel: 7,
  },

  // ── 13. TERRITORY SCORING (รุกรานเอาคะแนนตรงๆ) ──────────────────────────
  {
    templateId: "deva_power",
    name: "โองการสวรรค์",
    cost: 5,
    type: "skill",
    tier: L,
    cardFaction: "RAMA",
    description: "เอฟเฟกต์: เบิกฟ้ารับพระราชทานพร\nผลลัพธ์: เปลี่ยนสุ่มช่องว่าง 3 ช่องให้กลายเป็นเขตแดนของเราโกยคะแนนฟรีทันที",
    ability: "โกยคะแนนเขตแดน +3 ฟรี",
    icon: "⛅",
    effectType: "global",
    synergyTags: ["magic", "legendary_skill", "territory_scoring"],
    unlockLevel: 8,
  },

  // ── 14. BOARD-WIDE AURA (บัฟเปลี่ยนแกนเกม) ──────────────────────────────
  {
    templateId: "phra_ram",
    name: "พระราม",
    cost: 7,
    type: "unit",
    tier: L,
    cardFaction: "RAMA",
    description: "เอฟเฟกต์: ประทับราชรถ ประกาศศักดา\nผลลัพธ์: เพิ่มคะแนนการควบคุมพื้นที่ของฝั่งเรา x2 ทั่วทั้งกระดาน!",
    ability: "ออร่าเทพ x2 คะแนนกินพื้นที่",
    icon: "⚜️",
    effectType: "global",
    synergyTags: ["hero_rama", "rama_char", "commander"],
    comboType: "phra_ram",
    unlockLevel: 5,
  },

  // ── 15. IMMORTAL (คอยป่วน โดดหนีตลอดศก) ─────────────────────────────────
  {
    templateId: "hanuman",
    name: "หนุมานคลุกฝุ่น",
    cost: 6,
    type: "unit",
    tier: L,
    cardFaction: "RAMA",
    description: "เงื่อนไข: เมื่อโดนล้อมจนช่องหายใจหมด และรอดูกำลังจะพัง\nผลลัพธ์: เป็นอมตะ! กระโดดหนีขึ้นฟ้าไปตกช่องว่างที่ปลอดภัยอัตโนมัติ",
    ability: "อมตะและกระโดดหนีการจับกุม",
    icon: "🐵",
    effectType: "passive",
    synergyTags: ["monkey", "hanuman", "vanguard", "immortal"],
    comboType: "hanuman",
    unlockLevel: 5,
  },

  // ── 16. MULTI-ACT (สแปมเทิร์น) ──────────────────────────────────────────
  {
    templateId: "tosakan",
    name: "ทศกัณฐ์",
    cost: 7,
    type: "unit",
    tier: L,
    cardFaction: "LANKA",
    description: "เอฟเฟกต์: สำแดงร่างสิบหน้า ยี่สิบกร\nผลลัพธ์: ทันทีที่ลงสนาม จะไม่นับว่าเสียเทิร์น ผู้เล่นกดร่ายการ์ดฟรีเพิ่มได้อีก 1 ใบแบบต่อเนื่อง",
    ability: "คืนแอคชั่นและจั่วไพ่ลงเพิ่ม 1 ครั้ง",
    icon: "👺",
    effectType: "global",
    synergyTags: ["demon", "tosakan", "heavy", "multi_act"],
    comboType: "tosakan",
    unlockLevel: 5,
  },

  // ── 17. REVIVAL (ฟื้นชีพ) ──────────────────────────────────────────────
  {
    templateId: "revive",
    name: "ฟื้นกายาคลายสาป",
    cost: 4,
    type: "skill",
    tier: L,
    cardFaction: "NEUTRAL",
    description: "เงื่อนไข: เล็งไปที่ช่องว่างติดกับอาณาเขตเดิมของเรา\nผลลัพธ์: ชุบชีวิตยูนิตที่เคยตายในสนาม ให้ฟื้นกลับมายืนบนจุดนั้นแบบเต็มสูบ",
    ability: "ชุบชีวิตเพื่อนที่ตาย",
    icon: "🌱",
    effectType: "summon", // Revival plays as a summon mechanic in logic
    synergyTags: ["magic", "healing", "revive"],
    unlockLevel: 7,
  },

  // ── 18. THE NEW EXPANDED CAST! (Adding more diversity) ───────────────────
  {
    templateId: "sukrip",
    name: "สุครีพถอนราก",
    cost: 5,
    type: "unit",
    tier: H,
    cardFaction: "RAMA",
    description: "เงื่อนไข: เมื่อยืนประจันหน้ากำแพง\nผลลัพธ์: ทลาย Effect ปิดช่องทุกประเภท และพังทลายกับดักของศัตรูในโซนนั้น",
    ability: "ทำลายกับดักและล้างกำแพงศัตรู",
    icon: "🦍",
    effectType: "aoe",
    synergyTags: ["monkey", "commander", "siege"],
    unlockLevel: 5,
  },
  {
    templateId: "wali",
    name: "พาลีผู้แย่งชิง",
    cost: 6,
    type: "unit",
    tier: L,
    cardFaction: "RAMA",
    description: "เอฟเฟกต์: ยิ่งศัตรูแกร่ง ข้ายิ่งแกร่งกว่า\nผลลัพธ์: ถ้าพาลีอยู่ติดกับยูนิตระดับตำนานของศัตรู จะดูดดึงพลังมาและกางบาเรียสะท้อนเวท",
    ability: "แย่งชิงพลังยูนิตตำนานศัตรู",
    icon: "👑",
    effectType: "passive",
    synergyTags: ["monkey", "commander", "immortal", "debuff"],
    unlockLevel: 8,
  },
  {
    templateId: "mai_yarap",
    name: "ไมยราพณ์แห่งเมืองบาดาล",
    cost: 5,
    type: "unit",
    tier: L,
    cardFaction: "LANKA",
    description: "เงื่อนไข: หลับใหลในโซนมืด\nผลลัพธ์: สับเปลี่ยนพื้นที่เราและพื้นที่ศัตรูกลับด้านกัน 1 ช่องแบบหน้าด้านๆ",
    ability: "ขโมยแผ่นดินตรงๆ 1 ช่อง",
    icon: "🌃",
    effectType: "zone_control",
    synergyTags: ["demon", "magic", "territory_scoring"],
    unlockLevel: 7,
  },
  {
    templateId: "pipe_of_trance",
    name: "ปี่พญานาค",
    cost: 3,
    type: "skill",
    tier: H,
    cardFaction: "NEUTRAL",
    description: "เอฟเฟกต์: เป่าปี่สะกดทัพ\nผลลัพธ์: กดดันให้ยูนิตศัตรูในเขตต้องสุ่มเดินหนีเปะปะและเสียพื้นที่ยืนไป 1 ก้าว",
    ability: "ไล่ศัตรูร่นถอยสุ่ม 1 ช่อง",
    icon: "🐍",
    effectType: "control",
    skillKind: "pushUnit",
    synergyTags: ["music", "control"],
    unlockLevel: 5,
  },
  {
    templateId: "crystal_shield",
    name: "เกราะแก้วสุระกานต์",
    cost: 2,
    type: "skill",
    tier: H,
    cardFaction: "NEUTRAL",
    description: "เงื่อนไข: กดใช้ใส่เป้าหมายเพื่อน\nผลลัพธ์: อาบแสงต้านทานเวท การ์ดสายฟ้าฟาดหรือลอบฆ่าจะเสื่อมสลายทันทีถ้าโดน",
    ability: "บัฟอมตะกันการทำลายสกิล 1 ครั้ง",
    icon: "✨",
    effectType: "buff",
    synergyTags: ["magic", "shield"],
    unlockLevel: 4,
  },
  {
    templateId: "nang_sida",
    name: "สีดาลุยไฟ",
    cost: 5,
    type: "unit",
    tier: L,
    cardFaction: "NEUTRAL", // Because she causes chaos for both
    description: "เอฟเฟกต์: เพลิงความบริสุทธิ์\nผลลัพธ์: กวาดล้างสถานะผิดปกติทั้งหมดบนบอร์ด ทำให้ทุกคนกลับไปเหลือแค่คะแนนกระดานเพียวๆ",
    ability: "ชำระล้างล้างเอฟเฟกต์ทั้งเกม",
    icon: "🔥",
    effectType: "global",
    synergyTags: ["fire", "purify", "global"],
    unlockLevel: 9,
  },
];

// ─── Deck constants ───────────────────────────────────────────────────────────

export const DECK_SIZE = 20;

/**
 * Build a starter 20-card deck for the given faction.
 *
 * IMPORTANT: Only uses cards that the player OWNS (isOwned === true).
 * Pads remaining slots with copies of basic cards to always reach exactly DECK_SIZE.
 */
export function buildDefaultDeckTemplateIds(faction: Faction, ownedIds: string[] = []): string[] {
  // Only owned eligible cards that match the faction AND are basic tier
  const eligibleCards = CARD_LIBRARY.filter(
    (c) =>
      c.tier === "basic" &&
      ownedIds.includes(c.templateId) &&
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

/**
 * Validates an array of card IDs against the user's ownedIds
 * Replaces any card not owned or wrong faction with a basic fallback.
 */
export function validateDeckOwnership(deckIds: string[], faction: Faction, ownedIds: string[]): string[] {
  const fallbackId =
    CARD_LIBRARY.find((c) => ownedIds.includes(c.templateId) && c.tier === "basic")?.templateId
    ?? "quick_monkey";

  return deckIds.map(id => {
    const card = CARD_LIBRARY.find(c => c.templateId === id);
    if (!card) return fallbackId;
    if (!ownedIds.includes(id)) return fallbackId;
    if (card.cardFaction !== faction && card.cardFaction !== "NEUTRAL") return fallbackId;
    return id;
  });
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
