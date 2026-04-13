import type { Card, EffectType, Faction, SkillKind, AbilityConfig } from "@/game/types";

export type CardTemplate = {
  templateId: string;
  name: string;
  cost: number;
  type: "unit" | "skill";
  tier: "basic" | "hero" | "legendary";
  cardFaction: Faction | "NEUTRAL";
  description: string;
  ability: AbilityConfig | null;
  icon: string;
  effectType?: EffectType;
  /** For skill-type cards: which game mechanic this skill uses */
  skillKind?: SkillKind;
  synergyTags: string[];
  comboType?: string;
  unlockLevel: number;
  /** AI helper: how this card is used in a strategy */
  logicRole?: "setup" | "finisher" | "control" | "utility" | "none";
  image?: string;
};

// ─── Shorthand tier aliases ───────────────────────────────────────────────────
const B = "basic" as const;
const H = "hero" as const;
const L = "legendary" as const;

export const CARD_LIBRARY: CardTemplate[] = [
  // ============================================================================
  // [RAMA] ยูนิตพื้นฐาน
  // ============================================================================
  { templateId: "r_b1", name: "พลทหารวานร", cost: 1, type: "unit", tier: B, cardFaction: "RAMA", description: "ไม่มีความสามารถ", ability: null, icon: "🐒", synergyTags: ["monkey"], unlockLevel: 1, logicRole: "none", image: "/RAMA_png/monkey-soldier.png" },
  { templateId: "r_b2", name: "วานรปืนใหญ่", cost: 2, type: "unit", tier: B, cardFaction: "RAMA", description: "ไม่มีความสามารถ", ability: null, icon: "Bomb", synergyTags: ["monkey", "heavy"], unlockLevel: 1, logicRole: "none", image: "/RAMA_png/monkey-big-gun.png" },
  { templateId: "r_b3", name: "ลิงลมคลุกฝุ่น", cost: 1, type: "unit", tier: B, cardFaction: "RAMA", description: "ไม่มีความสามารถ", ability: null, icon: "Wind", synergyTags: ["monkey", "speed"], unlockLevel: 1, logicRole: "none", image: "/RAMA_png/small-monkey.png" },
  { templateId: "r_b4", name: "กองสอดแนมขีดขิน", cost: 1, type: "unit", tier: B, cardFaction: "RAMA", description: "ไม่มีความสามารถ", ability: null, icon: "Eagle", synergyTags: ["monkey", "scout"], unlockLevel: 1, logicRole: "none", image: "/RAMA_png/monkey-scout.png" },
  { templateId: "r_b5", name: "วานรแบกศิลา", cost: 3, type: "unit", tier: B, cardFaction: "RAMA", description: "ไม่มีความสามารถ", ability: null, icon: "Rock", synergyTags: ["monkey", "guard"], unlockLevel: 1, logicRole: "none", image: "/RAMA_png/monkey-carry-stone.png" },

  // ============================================================================
  // [RAMA] ฮีโร่ และ ตำนาน
  // ============================================================================
  {
    templateId: "r_h1", name: "พระลักษณ์", cost: 4, type: "unit", tier: H, cardFaction: "RAMA",
    description: "สลับตำแหน่งพระลักษณ์กับยูนิตศัตรูที่อยู่ติดกัน",
    ability: { trigger: "เมื่อวางการ์ด", requiresTarget: false, selectableTargets: "adjacent_enemy", action: "เป้าหมายศัตรูที่ติดกัน", result: "สลับตำแหน่งทันที", ui: "highlight 2 ตัว", animation: "swap flash" },
    icon: "🏹", effectType: "control", synergyTags: ["hero", "rama"], unlockLevel: 2, logicRole: "control", image: "/RAMA_png/phra-lak.png",
  },
  {
    templateId: "r_h2", name: "องคต", cost: 3, type: "unit", tier: H, cardFaction: "RAMA",
    description: "เปลี่ยนสีหมากศัตรู 1 ตัวที่ติดกับองคตให้กลายเป็นฝ่ายเรา",
    ability: { trigger: "เมื่อวางการ์ด", requiresTarget: false, selectableTargets: "adjacent_enemy", action: "เป้าหมายศัตรูที่อยู่ติดกัน 1 ตัว", result: "เปลี่ยนศัตรูเป็นฝ่ายเรา", ui: "highlight ศัตรูติดกัน", animation: "convert glow" },
    icon: "😤", effectType: "control", synergyTags: ["monkey", "hero"], unlockLevel: 2, logicRole: "control", image: "/RAMA_png/angada.png",
  },
  {
    templateId: "r_h3", name: "นิลพัท", cost: 4, type: "unit", tier: H, cardFaction: "RAMA",
    description: "สร้างหมากฝ่ายเรา 1 ตัวในช่องว่างที่ติดกับนิลพัท",
    ability: { trigger: "เมื่อลงสนาม", requiresTarget: false, selectableTargets: "adjacent_empty", action: "เป้าหมายช่องว่างติดกัน", result: "สร้างหมากร่างโคลน 1 ตัว", ui: "highlight ช่องว่างติดกัน", animation: "spawn glow" },
    icon: "🦍", effectType: "summon", synergyTags: ["monkey", "hero"], unlockLevel: 3, logicRole: "setup", image: "/RAMA_png/nila-pat.png",
  },
  {
    templateId: "r_h4", name: "สุครีพ", cost: 5, type: "unit", tier: H, cardFaction: "RAMA",
    description: "ทำลายยูนิตรอบข้างในรัศมี 1 ช่อง (ทั้งเราและศัตรู)",
    ability: { trigger: "เมื่อลงกระดาน", requiresTarget: false, action: "เรียกพลังคลื่นกระแทก", result: "ระเบิดทำลายทุกตัวรอบข้าง 1 ช่อง", ui: "วง radius แดง", animation: "shockwave" },
    icon: "🤛", effectType: "aoe", synergyTags: ["monkey", "hero"], unlockLevel: 3, logicRole: "finisher", image: "/RAMA_png/sukrip.png",
  },
  {
    templateId: "r_h5", name: "พาลี", cost: 6, type: "unit", tier: H, cardFaction: "RAMA",
    description: "สุ่มเปลี่ยนสีหมากศัตรูบนกระดาน 1 ตัวให้เป็นฝ่ายเรา",
    ability: { trigger: "เมื่อลงกระดาน", requiresTarget: false, action: "ร่ายเวทสุ่มเป้าหมาย", result: "ยึดอำนาจศัตรู 1 ตัวแบบสุ่มเป็นของเรา", ui: "random lock-on", animation: "convert glow" },
    icon: "👑", effectType: "global", synergyTags: ["monkey", "hero"], unlockLevel: 4, logicRole: "finisher", image: "/RAMA_png/bali.png",
  },
  {
    templateId: "r_l1", name: "หนุมาน", cost: 6, type: "unit", tier: L, cardFaction: "RAMA",
    description: "เมื่อจะถูกล้อมตาย ย้ายตัวเองไปที่ช่องว่างที่ไกลที่สุด 1 ครั้ง",
    ability: { trigger: "เมื่อกำลังจะถูกล้อมตาย", requiresTarget: false, action: "ตรวจหาช่องว่างที่ไกลที่สุด", result: "ย้ายตัวเองไปช่องนั้นทันที 1 ครั้งแบบอมตะ", ui: "highlight ช่องปลายทาง", animation: "dash + smoke" },
    icon: "🐵", effectType: "passive", synergyTags: ["monkey", "legendary"], unlockLevel: 5, logicRole: "utility", image: "/RAMA_png/hanuman.png",
  },
  {
    templateId: "r_l2", name: "พิเภก", cost: 5, type: "unit", tier: L, cardFaction: "RAMA",
    description: "ทำลายศัตรู 1 ตัวที่มีช่องหายใจน้อยกว่า 2",
    ability: { trigger: "เมื่อลงสนาม", requiresTarget: false, selectableTargets: "weak_enemy", action: "เป้าหมายศัตรูที่กำลังอ่อนแอ", result: "ทำลายเป้าหมายทันที", ui: "highlight ศัตรูที่ใกล้ตาย", animation: "explode" },
    icon: "🔮", effectType: "damage", synergyTags: ["magic", "legendary"], unlockLevel: 5, logicRole: "finisher", image: "/RAMA_png/phiphek.png",
  },
  {
    templateId: "r_l3", name: "พระราม", cost: 7, type: "unit", tier: L, cardFaction: "RAMA",
    description: "สร้าง 'วานรปืนใหญ่' ขึ้นมาตลอดแนวตั้งที่พระรามยืนอยู่",
    ability: { trigger: "เมื่อลงประทับกระดาน", requiresTarget: false, action: "เรียกพลสนับสนุน", result: "สร้างวานรปืนใหญ่เต็มแนวตั้ง!", ui: "highlight ทั้งคอลัมน์", animation: "spawn glow" },
    icon: "✨", effectType: "global", synergyTags: ["hero", "legendary"], unlockLevel: 7, logicRole: "finisher", image: "/RAMA_png/phra-ram.png",
  },
  {
    templateId: "r_s1", name: "ศรพรหมมาสตร์", cost: 5, type: "skill", tier: L, cardFaction: "RAMA",
    description: "ทำลายศัตรูทั้งหมดในแนวนอนที่เลือก",
    ability: { trigger: "เมื่อกดใช้สกิล", requiresTarget: false, selectableTargets: "row", action: "เป้าหมายแถวแนวนอน 1 แถว", result: "ทำลายศัตรูทั้งหมดในแถวนั้นราบคาบ", ui: "highlight แถว", animation: "beam ยิงผ่าน" },
    icon: "💫", effectType: "damage", synergyTags: ["skill", "legendary"], unlockLevel: 6, logicRole: "finisher", image: "/RAMA_png/arrow-brahma.png",
  },
  {
    templateId: "r_s2", name: "พรพระอิศวร", cost: 4, type: "skill", tier: H, cardFaction: "RAMA",
    description: "สุ่มสร้างหมากฝ่ายเรา 2 ตัวในพื้นที่ที่ไม่มีศัตรูอยู่เลย",
    ability: { trigger: "เมื่อเรียกใช้สกิล", requiresTarget: false, action: "รับพรจากฟ้า", result: "สร้างแนวร่วม 2 ตัวในแดนปลอดภัย", ui: "ping พื้นที่ว่าง", animation: "spawn glow" },
    icon: "👼", effectType: "buff", synergyTags: ["skill", "hero"], unlockLevel: 5, logicRole: "setup", image: "/RAMA_png/blessing-of-shiva.png",
  },

  // ============================================================================
  // [LANKA] ยูนิตพื้นฐาน
  // ============================================================================
  { templateId: "l_b1", name: "ยักษ์สมุน", cost: 1, type: "unit", tier: B, cardFaction: "LANKA", description: "ไม่มีความสามารถ", ability: null, icon: "👹", synergyTags: ["demon", "basic"], unlockLevel: 1, logicRole: "none", image: "/LANKA_png/ยักษ์สมุน.png" },
  { templateId: "l_b2", name: "อสูรเฝ้าด่าน", cost: 2, type: "unit", tier: B, cardFaction: "LANKA", description: "ไม่มีความสามารถ", ability: null, icon: "🛡️", synergyTags: ["demon", "basic"], unlockLevel: 1, logicRole: "none", image: "/LANKA_png/อสูรเฝ้าด่าน.png" },
  { templateId: "l_b3", name: "ยักษ์รากษส", cost: 1, type: "unit", tier: B, cardFaction: "LANKA", description: "ไม่มีความสามารถ", ability: null, icon: "🪓", synergyTags: ["demon", "basic"], unlockLevel: 1, logicRole: "none", image: "/LANKA_png/ยักษ์รากษส.png" },
  { templateId: "l_b4", name: "อสูรกองหน้า", cost: 1, type: "unit", tier: B, cardFaction: "LANKA", description: "ไม่มีความสามารถ", ability: null, icon: "⚔️", synergyTags: ["demon", "basic"], unlockLevel: 1, logicRole: "none", image: "/LANKA_png/อสูรกองหน้า.png" },
  { templateId: "l_b5", name: "เพชฌฆาตอสูร", cost: 3, type: "unit", tier: B, cardFaction: "LANKA", description: "ไม่มีความสามารถ", ability: null, icon: "☠️", synergyTags: ["demon", "basic"], unlockLevel: 1, logicRole: "none", image: "/LANKA_png/เพชฌฆาตอสูร.png" },

  // ============================================================================
  // [LANKA] ฮีโร่ และ ตำนาน
  // ============================================================================
  {
    templateId: "l_h1", name: "กุมภกรรณ", cost: 5, type: "unit", tier: H, cardFaction: "LANKA",
    description: "พุ่งไปข้างหน้าและทำลายหมากทุกตัวที่ขวางหน้าจนสุดขอบกระดาน",
    ability: { trigger: "เมื่อวางการ์ดลงพื้น", requiresTarget: false, selectableTargets: "direction", action: "เป้าหมายทิศทาง (สุ่ม)", result: "พุ่งชน ทำลายทุกตัวตามแนว!", ui: "arrow path", animation: "charge smash" },
    icon: "🔱", effectType: "damage", synergyTags: ["demon", "hero"], unlockLevel: 3, logicRole: "finisher", image: "/LANKA_png/Kumbhakarna.png",
  },
  {
    templateId: "l_h2", name: "นางสำมนักขา", cost: 3, type: "unit", tier: H, cardFaction: "LANKA",
    description: "เมื่อตาย ทำลายหมากสุ่มบนกระดาน 2 ตัว",
    ability: { trigger: "เมื่อถูกทำลาย", requiresTarget: false, action: "กรีดร้องลากวิญญาณศัตรู", result: "ระเบิดพาเป้าหมายแบบสุ่ม 2 ตัวตายตามไป", ui: "lock on เป้าหมาย", animation: "explode" },
    icon: "💃", effectType: "passive", synergyTags: ["demon", "hero"], unlockLevel: 3, logicRole: "utility", image: "/LANKA_png/Sammanakha.png",
  },
  {
    templateId: "l_h3", name: "วิรุญจำบัง", cost: 4, type: "unit", tier: H, cardFaction: "LANKA",
    description: "ย้ายหมากศัตรูที่อยู่ติดกันไปไว้ในตำแหน่งสุ่มบนกระดาน",
    ability: { trigger: "เมื่อวางลงพื้น", requiresTarget: false, selectableTargets: "adjacent_enemy", action: "เป้าหมายศัตรู 1 ตัวที่ติดกัน", result: "ย้ายศัตรูนั้นให้ลอยไปตกแบบสุ่ม", ui: "highlight ศัตรูที่ติดกัน", animation: "slide + teleport" },
    icon: "🥷", effectType: "control", synergyTags: ["demon", "hero"], unlockLevel: 4, logicRole: "control", image: "/LANKA_png/Virunjambang.png",
  },
  {
    templateId: "l_h4", name: "สหัสเดชะ", cost: 6, type: "unit", tier: H, cardFaction: "LANKA",
    description: "สุ่มสร้างร่างปลอม (หมากสีเรา) 3 ตัวในตำแหน่งสุ่ม",
    ability: { trigger: "ทันทีที่วางไพ่", requiresTarget: false, action: "เรียกร่างแยกพรางตา", result: "สร้างมินเนี่ยนโคลนปลอมๆ 3 ตัวบนบอร์ด", ui: "ping ที่ช่องว่างแบบสุ่ม 3 จุด", animation: "spawn glow" },
    icon: "🎭", effectType: "summon", synergyTags: ["demon", "hero"], unlockLevel: 5, logicRole: "setup", image: "/LANKA_png/Sahasadecha.png",
  },
  {
    templateId: "l_h5", name: "สัทธาสูร", cost: 5, type: "unit", tier: H, cardFaction: "LANKA",
    description: "ทำลายศัตรูรอบข้างในรัศมี 1 ช่อง เฉพาะตัวที่มีหมากฝ่ายเราล้อมอยู่มากกว่า 1 ด้าน",
    ability: { trigger: "เมื่อลงสนาม", requiresTarget: false, action: "กวาดล้างจุดอ่อน", result: "ทำลายศัตรูรอบข้างที่กำลังโดนขนาบ!", ui: "radius check", animation: "explode" },
    icon: "💀", effectType: "aoe", synergyTags: ["demon", "hero"], unlockLevel: 4, logicRole: "finisher", image: "/LANKA_png/Sattasur.png",
  },
  {
    templateId: "l_l1", name: "ทศกัณฐ์", cost: 7, type: "unit", tier: L, cardFaction: "LANKA",
    description: "สร้าง 'ยักษ์สมุน' 1 ตัวในทุกช่องว่างที่อยู่ติดกับทศกัณฐ์",
    ability: { trigger: "เมื่อลงสนาม", requiresTarget: false, action: "ขยายอาณาเขตจอมมาร", result: "เสกยักษ์สมุนเกิดรอบตัวเต็มสูบ!", ui: "highlight ช่องว่างติดกัน 4 ทิศ", animation: "spawn glow" },
    icon: "👺", effectType: "summon", synergyTags: ["demon", "legendary"], unlockLevel: 7, logicRole: "finisher", image: "/LANKA_png/tosakan.png",
  },
  {
    templateId: "l_l2", name: "อินทรชิต", cost: 6, type: "unit", tier: L, cardFaction: "LANKA",
    description: "เปลี่ยนสีหมากศัตรูทั้งหมดที่ติดกับอินทรชิตให้เป็นฝ่ายเรา",
    ability: { trigger: "เมื่อลงสนาม", requiresTarget: false, action: "ร่ายเวทบงการจิต", result: "ครอบงำศัตรูรอบตัวทุกตัวให้เปลี่ยนสี!", ui: "วงกลมขยายออกรอบตัว", animation: "convert color change" },
    icon: "🏹", effectType: "global", synergyTags: ["demon", "legendary"], unlockLevel: 6, logicRole: "finisher", image: "/LANKA_png/indrajit.png",
  },
  {
    templateId: "l_l3", name: "ไมยราพณ์", cost: 5, type: "unit", tier: L, cardFaction: "LANKA",
    description: "สลับสีหมากของเราทั้งหมดบนกระดานให้เป็นสีศัตรู และศัตรูเป็นของเรา",
    ability: { trigger: "เมื่อวางทาบกระดาน", requiresTarget: false, action: "ยืนยันการใช้เป่ามนต์สะกด", result: "สลับสีทุกตัวบนกระดานแบบกะทันหัน!", ui: "ทั้งบอร์ดกระพริบแดง/น้ำเงิน", animation: "global invert color" },
    icon: "💤", effectType: "global", synergyTags: ["demon", "legendary"], unlockLevel: 6, logicRole: "utility", image: "/LANKA_png/maiyarap.png",
  },
  {
    templateId: "l_s1", name: "พิธีชุบหอก", cost: 4, type: "skill", tier: H, cardFaction: "LANKA",
    description: "สุ่มเปลี่ยนสีหมากศัตรู 2 ตัวที่อยู่ขอบกระดานให้เป็นฝ่ายเรา",
    ability: { trigger: "เมื่อร่ายสกิล", requiresTarget: false, action: "สูบพลังดวงวิญญาณจากชายขอบ", result: "เปลี่ยนสีศัตรูขอบกระดาน 2 ตัว", ui: "highlight กรอบกระดาน", animation: "convert glow" },
    icon: "💥", effectType: "global", synergyTags: ["skill", "hero"], unlockLevel: 5, logicRole: "control", image: "/LANKA_png/พิธีชุบหอก.png",
  },
  {
    templateId: "l_s2", name: "คำสาปลงกา", cost: 5, type: "skill", tier: L, cardFaction: "LANKA",
    description: "สุ่มทำลายยูนิต Basic ของศัตรู 3 ตัว",
    ability: { trigger: "เมื่อโยนสกิล", requiresTarget: false, action: "ปล่อยคำสาปมรณะ", result: "ทะลวงทำลายยูนิตระดับรากหญ้าศัตรู 3 เป้าหมาย!", ui: "lock on เป้าหมายแบบสุ่ม", animation: "explode" },
    icon: "🧛", effectType: "damage", synergyTags: ["skill", "legendary"], unlockLevel: 8, logicRole: "finisher", image: "/LANKA_png/Curse of Lanka.png",
  },

  // ============================================================================
  // [NEUTRAL] ยูนิตพื้นฐาน
  // ============================================================================
  { templateId: "n_b1", name: "ม้านิลมังกร", cost: 1, type: "unit", tier: B, cardFaction: "NEUTRAL", description: "ไม่มีความสามารถ", ability: null, icon: "🐴", synergyTags: ["neutral", "basic"], unlockLevel: 1, logicRole: "none", image: "/NEUTRAL_png/Manil Maakorn.png" },
  { templateId: "n_b2", name: "นกสาริกา", cost: 1, type: "unit", tier: B, cardFaction: "NEUTRAL", description: "ไม่มีความสามารถ", ability: null, icon: "🐦", synergyTags: ["neutral", "basic"], unlockLevel: 1, logicRole: "none", image: "/NEUTRAL_png/salika.png" },
  { templateId: "n_b3", name: "พญานาคเด็ก", cost: 2, type: "unit", tier: B, cardFaction: "NEUTRAL", description: "ไม่มีความสามารถ", ability: null, icon: "🐉", synergyTags: ["neutral", "basic"], unlockLevel: 1, logicRole: "none", image: "/NEUTRAL_png/พญานาคเด็ก.png" },
  { templateId: "n_b4", name: "กินรี", cost: 1, type: "unit", tier: B, cardFaction: "NEUTRAL", description: "ไม่มีความสามารถ", ability: null, icon: "💃", synergyTags: ["neutral", "basic"], unlockLevel: 1, logicRole: "none", image: "/NEUTRAL_png/Kinnari.png" },
  { templateId: "n_b5", name: "ฤๅษีฝึกหัด", cost: 3, type: "unit", tier: B, cardFaction: "NEUTRAL", description: "ไม่มีความสามารถ", ability: null, icon: "🧘", synergyTags: ["neutral", "basic"], unlockLevel: 1, logicRole: "none", image: "/NEUTRAL_png/ฤๅษีฝึกหัด.png" },

  // ============================================================================
  // [NEUTRAL] ฮีโร่ และ ตำนาน
  // ============================================================================
  {
    templateId: "n_l1", name: "นางสีดา", cost: 7, type: "unit", tier: L, cardFaction: "NEUTRAL",
    description: "ทำลายหมากทุกตัวบนกระดานที่มีช่องหายใจเหลือเพียง 1 ช่อง",
    ability: { trigger: "เมื่อก้าวลงสมรภูมิ", requiresTarget: false, action: "ไม่มีเป้าหมาย", result: "ทำลายทุกตัวบนกระดานที่เหลือช่องหายใจแค่ 1 ทันที!", ui: "highlight ทุกตัวที่โดน", animation: "collapse explode" },
    icon: "👸", effectType: "global", synergyTags: ["neutral", "legendary"], unlockLevel: 8, logicRole: "finisher", image: "/NEUTRAL_png/sida.png",
  },
  {
    templateId: "n_l2", name: "อนันตนาคราช", cost: 6, type: "unit", tier: L, cardFaction: "NEUTRAL",
    description: "สร้างสิ่งกีดขวาง (กำแพง) ตลอดแนวขวางของกระดาน",
    ability: { trigger: "เมื่ออัญเชิญปักหมุด", requiresTarget: false, selectableTargets: "row", action: "เป้าหมายแถวนอน 1 แถว", result: "กำแพงพญานาคพุ่งขวางเต็มแถวปิดกั้น 2 เทิร์น", ui: "highlight แถวนอนยาว", animation: "spawn block" },
    icon: "🐍", effectType: "zone_control", synergyTags: ["neutral", "legendary"], unlockLevel: 7, logicRole: "control", image: "/NEUTRAL_png/Ananta Shesha.png",
  },
  {
    templateId: "n_l3", name: "ฤๅษีดัดตน", cost: 4, type: "unit", tier: L, cardFaction: "NEUTRAL",
    description: "สลับตำแหน่งหมากฝ่ายเรา 1 ตัวกับหมากฝ่ายเราอีก 1 ตัวที่ไหนก็ได้",
    ability: { trigger: "เมื่อลงสมาธิ", requiresTarget: false, selectableTargets: "two_allies", action: "เป้าหมายพรรคพวก 2 ตัว", result: "สลับตำแหน่งเพื่อนข้ามกระดาน!", ui: "highlight 2 ตัวระยะไกล", animation: "swap teleport" },
    icon: "🧘‍♂️", effectType: "buff", synergyTags: ["neutral", "legendary"], unlockLevel: 8, logicRole: "utility", image: "/NEUTRAL_png/ฤๅษีดัดตน.png",
  },
  {
    templateId: "n_h1", name: "มัจฉานุ", cost: 3, type: "unit", tier: H, cardFaction: "NEUTRAL",
    description: "ย้ายตัวเองไปที่ตำแหน่งใดก็ได้ที่ติดกับพื้นที่บล็อค",
    ability: { trigger: "หลังจากลงกระดาน", requiresTarget: false, selectableTargets: "empty_near_block", action: "เป้าหมายช่องใกล้กำแพง/อุปสรรอ", result: "ร่อนกระโดดไปสู่จุดใหม่ทันที", ui: "highlight ช่องว่างรอบอุปสรรค", animation: "slide + splash" },
    icon: "🐵", effectType: "buff", synergyTags: ["neutral", "hero"], unlockLevel: 3, logicRole: "utility", image: "/NEUTRAL_png/Matchanu.png",
  },
  {
    templateId: "n_h2", name: "นกสดายุ", cost: 4, type: "unit", tier: H, cardFaction: "NEUTRAL",
    description: "สลับสีหมากที่อยู่ติดกัน 2 ตัว (เลือกคู่ไหนก็ได้บนบอร์ด)",
    ability: { trigger: "เมื่อสยายปีก", requiresTarget: false, selectableTargets: "two_adjacent_units", action: "เป้าหมายหมาก 2 ตัวคู่กัน", result: "สร้างความปั่นป่วน สลับสีกันทั้งคู่!", ui: "highlight หมาก 2 ตัวติดกัน", animation: "color swap" },
    icon: "🦅", effectType: "control", synergyTags: ["neutral", "hero"], unlockLevel: 4, logicRole: "control", image: "/NEUTRAL_png/sadayu.png",
  },
  {
    templateId: "n_h3", name: "สุพรรณมัจฉา", cost: 4, type: "unit", tier: H, cardFaction: "NEUTRAL",
    description: "สร้าง 'พญานาคเด็ก' แบบสุ่ม 2 ตัวในพื้นที่ที่ติดกับสิ่งกีดขวาง",
    ability: { trigger: "เมื่อสัมผัสน้ำ", requiresTarget: false, action: "ร่ายเวทบงการน้ำ", result: "สร้างลูกพญานาคกระโดดลงสนาม 2 ตัว!", ui: "ping 2 จุด", animation: "spawn glow" },
    icon: "🧜‍♀️", effectType: "summon", synergyTags: ["neutral", "hero"], unlockLevel: 3, logicRole: "setup", image: "/NEUTRAL_png/Suvannamaccha.png",
  },
  {
    templateId: "n_h4", name: "นกสัมพาที", cost: 3, type: "unit", tier: H, cardFaction: "NEUTRAL",
    description: "ย้ายยูนิตศัตรู 1 ตัวไปไว้ในตำแหน่งที่ทำให้มันโดนล้อมตายทันที",
    ability: { trigger: "เมื่อคำรามก้อง", requiresTarget: false, selectableTargets: "enemy_unit", action: "เป้าหมายศัตรู 1 ตัว", result: "ย้ายศัตรูไปโยนลงช่องมรณะที่ไม่มีทางหนีรอด", ui: "highlight ศัตรู", animation: "slide + explode" },
    icon: "🔥", effectType: "damage", synergyTags: ["neutral", "hero"], unlockLevel: 2, logicRole: "finisher", image: "/NEUTRAL_png/Sampati.png",
  },
  {
    templateId: "n_h5", name: "ทรพี", cost: 5, type: "unit", tier: H, cardFaction: "NEUTRAL",
    description: "สลับสีตัวเอง (เปลี่ยนเป็นสีศัตรู) เพื่อทำลายกลุ่มหมากศัตรูจากข้างใน",
    ability: { trigger: "เมื่อวัดรอยเท้า", requiresTarget: false, selectableTargets: "self", action: "คลิกที่ตัวเองเพื่อเร่งพลัง", result: "ปลอมตัวเข้าแทรกซึมทำให้ศัตรูถูกตัดช่องหายใจ", ui: "highlight ตัวเอก", animation: "convert + shockwave" },
    icon: "🐃", effectType: "aoe", synergyTags: ["neutral", "hero"], unlockLevel: 4, logicRole: "utility", image: "/NEUTRAL_png/Thorapi.png",
  },
  {
    templateId: "n_s1", name: "พายุอาเพศ", cost: 3, type: "skill", tier: H, cardFaction: "NEUTRAL",
    description: "สุ่มสลับตำแหน่งยูนิต 4 ตัวบนกระดาน (ไม่สนฝ่าย)",
    ability: { trigger: "เมื่อเรียกใช้พายุ", requiresTarget: false, action: "พัดกวาดทั้งกระดาน", result: "พายุมืดพัดให้หมาก 4 ตัววิ่งสลับตำแหน่งมั่วซั่วไปหมด", ui: "ทั้งบอร์ดกระพริบเตือน", animation: "tornado mix" },
    icon: "🌪️", effectType: "control", synergyTags: ["skill", "hero"], unlockLevel: 4, logicRole: "control", image: "/NEUTRAL_png/พายุอาเพศ.png",
  },
  {
    templateId: "n_s2", name: "มนต์เรียกปลา", cost: 2, type: "skill", tier: H, cardFaction: "NEUTRAL",
    description: "เปลี่ยนหมากศัตรูทั้งหมดในพื้นที่ 3x3 ให้เป็นฝ่ายเรา",
    ability: { trigger: "เมื่อลั่นเวทเรียกน้ำ", requiresTarget: false, selectableTargets: "area_3x3", action: "เป้าหมายพื้นที่กระดาน 3x3", result: "คลื่นน้ำกลืนกิน เปลี่ยนศัตรูในเขตนั้นเป็นฝ่ายเราทั้งหมด", ui: "area highlight", animation: "wave convert" },
    icon: "🌊", effectType: "global", synergyTags: ["skill", "hero"], unlockLevel: 3, logicRole: "finisher", image: "/NEUTRAL_png/มนต์เรียกปลา.png",
  },
];

// ─── Deck constants ───────────────────────────────────────────────────────────

export const DECK_SIZE = 20;

export function buildDefaultDeckTemplateIds(faction: Faction, ownedIds: string[] = []): string[] {
  const eligibleCards = CARD_LIBRARY.filter(
    (c) =>
      c.tier === "basic" &&
      ownedIds.includes(c.templateId) &&
      (c.cardFaction === faction || c.cardFaction === "NEUTRAL"),
  );

  const pool: string[] = [];
  for (const c of eligibleCards) {
    const maxCopies = c.tier === "basic" ? 4 : c.tier === "hero" ? 2 : 1;
    for (let i = 0; i < maxCopies; i++) pool.push(c.templateId);
  }

  const fallbackId =
    CARD_LIBRARY.find((c) => c.tier === "basic" && c.unlockLevel <= 1)?.templateId ?? 
    (faction === "RAMA" ? "r_b1" : "l_b1");

  while (pool.length < DECK_SIZE) pool.push(fallbackId);
  return pool.slice(0, DECK_SIZE);
}

export function validateDeckOwnership(deckIds: string[], faction: Faction, ownedIds: string[]): string[] {
  const fallbackId =
    CARD_LIBRARY.find((c) => ownedIds.includes(c.templateId) && c.tier === "basic")?.templateId ??
    (faction === "RAMA" ? "r_b1" : "l_b1");

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
    .filter((c): c is CardTemplate => Boolean(c))
    .map((t) => {
      const base = {
        id: `${owner}_${t.templateId}_${i++}`,
        name: t.name,
        cost: t.cost,
        rarity: t.tier === "legendary" ? "epic" : t.tier === "hero" ? "rare" : "common",
        tier: t.tier,
        description: t.description,
        ability: t.ability,
        icon: t.icon,
        image: t.image,
        effectType: t.effectType,
        synergyTags: t.synergyTags,
        comboType: t.templateId,
      } as const;
      if (t.type === "unit") return { ...base, type: "unit", unit: { faction: owner } } as Card;

      // Add a default skill property, will be intercepted by the universal pipeline anyway
      const skillKind: SkillKind = t.skillKind ?? "blockTile";
      return { ...base, type: "skill", skill: { kind: skillKind } } as Card;
    });
}
