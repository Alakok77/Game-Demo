import type { Card, EffectType, Faction, SkillKind, AbilityConfig } from "@/game/types";

export type CardTemplate = {
  templateId: string;
  name: string;
  cost: number;
  type: "unit" | "skill";
  tier: "basic" | "hero" | "legendary";
  cardFaction: Faction | "NEUTRAL";
  description: string;
  ability: AbilityConfig;
  icon: string;
  effectType?: EffectType;
  skillKind?: SkillKind;
  synergyTags: string[];
  comboType?: string;
  unlockLevel: number;
};

// ─── Shorthand tier aliases ───────────────────────────────────────────────────
const B = "basic" as const;
const H = "hero" as const;
const L = "legendary" as const;

export const CARD_LIBRARY: CardTemplate[] = [
  // ============================================================================
  // [RAMA] ยูนิตพื้นฐาน และ ฮีโร่
  // ============================================================================
  {
    templateId: "r_b1", name: "พลทหารวานร", cost: 1, type: "unit", tier: B, cardFaction: "RAMA",
    description: "หน่วยรบปะทะเดินเท้า",
    ability: { trigger: "เมื่อวาง", action: "ไม่มี", result: "ไม่มีความสามารถ (ใช้ยึดพื้นที่)", ui: "-", animation: "วางธรรมดา" },
    icon: "🐒", synergyTags: ["monkey"], unlockLevel: 1,
  },
  {
    templateId: "r_b2", name: "วานรปืนใหญ่", cost: 2, type: "unit", tier: B, cardFaction: "RAMA",
    description: "หน่วยยิงสนับสนุนจากแนวหลัง",
    ability: { trigger: "เมื่อวาง", action: "ไม่มี", result: "ไม่มีความสามารถ (ใช้ยึดพื้นที่)", ui: "-", animation: "วางธรรมดา" },
    icon: "💣", synergyTags: ["monkey", "heavy"], unlockLevel: 1,
  },
  {
    templateId: "r_b3", name: "ลิงลมคลุกฝุ่น", cost: 1, type: "unit", tier: B, cardFaction: "RAMA",
    description: "หน่วยแทรกซึมแนวรบ",
    ability: { trigger: "เมื่อวาง", action: "ไม่มี", result: "ไม่มีความสามารถ (ใช้ยึดพื้นที่)", ui: "-", animation: "วางธรรมดา" },
    icon: "💨", synergyTags: ["monkey", "speed"], unlockLevel: 1,
  },
  {
    templateId: "r_b4", name: "กองสอดแนมขีดขิน", cost: 1, type: "unit", tier: B, cardFaction: "RAMA",
    description: "ทหารพรานล่าตระเวนป่า",
    ability: { trigger: "เมื่อวาง", action: "ไม่มี", result: "ไม่มีความสามารถ (ใช้ยึดพื้นที่)", ui: "-", animation: "วางธรรมดา" },
    icon: "🦅", synergyTags: ["monkey", "scout"], unlockLevel: 1,
  },
  {
    templateId: "r_b5", name: "วานรแบกศิลา", cost: 3, type: "unit", tier: B, cardFaction: "RAMA",
    description: "สายกำลังหินผาปกป้องพรรคพวก",
    ability: { trigger: "เมื่อวาง", action: "ไม่มี", result: "ไม่มีความสามารถ (ใช้ยึดพื้นที่)", ui: "-", animation: "วางธรรมดา" },
    icon: "🪨", synergyTags: ["monkey", "guard"], unlockLevel: 1,
  },
  {
    templateId: "r_h1", name: "พระลักษณ์", cost: 4, type: "unit", tier: H, cardFaction: "RAMA",
    description: "ถอนสมอ: สลับตำแหน่งสร้างช่องโหว่ให้ศัตรู",
    ability: { trigger: "เมื่อวางการ์ดลงสนาม", action: "เลือกยูนิตฝ่ายเรา 1 ตัว และศัตรูที่อยู่ติดกัน 1 ตัว", result: "สลับตำแหน่งยูนิตทั้งสองทันที", ui: "ไฮไลท์สลับสองเป้าหมายที่ถูกเลือก", animation: "แสงวูบวาบดึงสลับตำแหน่ง" },
    icon: "🏹", effectType: "control", synergyTags: ["hero", "rama"], unlockLevel: 2,
  },
  {
    templateId: "r_h2", name: "องคต", cost: 3, type: "unit", tier: H, cardFaction: "RAMA",
    description: "เขตห้ามรบ: ปิดกั้นการจัดวางทัพ",
    ability: { trigger: "ตลอดเวลา (Passive)", action: "ไม่มี (แสดงผลออร่าอัตโนมัติ)", result: "ศัตรูไม่สามารถวางยูนิตใหม่ในช่องที่ติดกับองคตได้ตลอดเวลา", ui: "บนบอร์ดจะกางรัศมีห้ามบุกรุกสีแดงบางๆเตือนศัตรู", animation: "กางโล่บาเรียสีทองรอบตัวอ่อนๆ" },
    icon: "😤", effectType: "passive", synergyTags: ["monkey", "hero"], unlockLevel: 2,
  },
  {
    templateId: "r_h3", name: "นิลพัท", cost: 4, type: "unit", tier: H, cardFaction: "RAMA",
    description: "ถมถนน: แปรรูปภูมิประเทศ",
    ability: { trigger: "เมื่อลงสนาม", action: "เลือกช่องว่าง 1 ช่องบนกระดาน", result: "เปลี่ยนช่องนั้นให้กลายเป็นพื้นที่ 'ทางเดิน' (ครอบครองทันที)", ui: "ไฮไลท์ช่องว่างบนกระดานเป็นตารางสีฟ้า", animation: "แผ่นหินงอกขึ้นมาถมเต็มช่อง" },
    icon: "🦍", effectType: "zone_control", synergyTags: ["monkey", "hero"], unlockLevel: 3,
  },
  {
    templateId: "r_h4", name: "สุครีพ", cost: 5, type: "unit", tier: H, cardFaction: "RAMA",
    description: "ถอนราก: ทำลายอุปสรรคทุกชนิดรอบเขต",
    ability: { trigger: "เมื่อเล็งเป้าแล้วยืนยัน", action: "เลือกรัศมี 1 ช่องรอบตัวเป้าหมาย", result: "ทำลายสิ่งกีดขวางหรือกำแพงทั้งหมดทิ้งราบคาบ", ui: "วงกลมกากบาทตีกรอบครอบกำแพงทั้งหมดเป้าหมาย", animation: "ระเบิดหินแตกกระจายรอบทิศ" },
    icon: "🤛", effectType: "aoe", synergyTags: ["monkey", "hero"], unlockLevel: 3,
  },
  {
    templateId: "r_h5", name: "พาลี", cost: 6, type: "unit", tier: H, cardFaction: "RAMA",
    description: "แย่งชิง: ดึงพลังศัตรูย้อนเกล็ด",
    ability: { trigger: "ป้องกันการปะทะ (Passive)", action: "ไม่มี (ต้านทานอัตโนมัติเมื่อเงื่อนไขสำเร็จ)", result: "ถ้าอยู่ติดยูนิตฮีโร่/ตำนานข้าศึก จะเป็นอมตะต้านทาน 1 ดาเมจต่อเทิร์น", ui: "เกราะเรืองแสงเชื่อมต่อกับยูนิตข้าศึกที่โดนดูด", animation: "ถ่ายโอนแสงสีเขียวจากศัตรูมาใส่พาลี" },
    icon: "👑", effectType: "passive", synergyTags: ["monkey", "hero"], unlockLevel: 4,
  },
  {
    templateId: "r_l1", name: "หนุมาน", cost: 6, type: "unit", tier: L, cardFaction: "RAMA",
    description: "หาวเป็นดาวเป็นเดือน: ไร้พ่ายหลบหนีเกิดใหม่",
    ability: { trigger: "เมื่อโดนล้อมจนตาย (Passive)", action: "ผู้เล่นระบบจะกระโดดหนีอัตโนมัติหากพบช่องว่าง", result: "หนุมานไม่ตาย แต่จะย้ายไปเกิดใหม่ช่องว่างที่ปลอดภัย", ui: "กระพริบไอคอนเทวดาเมื่อพร้อมทำงาน", animation: "หาวเป็นดาวเรืองแสงแล้วลอยวาร์ปหายตัว" },
    icon: "🐵", effectType: "passive", synergyTags: ["monkey", "legendary"], unlockLevel: 5,
  },
  {
    templateId: "r_l2", name: "พิเภก", cost: 5, type: "unit", tier: L, cardFaction: "RAMA",
    description: "ชี้ชะตา: สกัดดาวรุ่งฝ่ายตรงข้าม",
    ability: { trigger: "เมื่อลงสนาม", action: "เลือกชี้เป้าหมายยูนิตศัตรู 1 ตัว", result: "ขับไล่ยูนิตนั้นออกจากการนับคะแนนเขตพื้นที่จนจบเกม (เหมือนไร้ตัวตน)", ui: "วงสัญลักษณ์สีม่วงครอบยูนิตเป้าหมายถาวร", animation: "ร่ายคาถาตัวอักษรขอมล็อควิญญาณ" },
    icon: "🔮", effectType: "control", synergyTags: ["magic", "legendary"], unlockLevel: 5,
  },
  {
    templateId: "r_l3", name: "พระราม", cost: 7, type: "unit", tier: L, cardFaction: "RAMA",
    description: "บารมีจักรพรรดิ: บัฟป้องกันทั้งกองทัพ",
    ability: { trigger: "ลงประทับกระดาน (Passive)", action: "เพิ่มพลังทั้งบอร์ดทันที", result: "ยูนิตฝ่ายเราทั้งหมดได้รับช่องหายใจ (Liberty) หูตากว้างไกลขึ้นดิ้นรนหนีง่ายขึ้น", ui: "พื้นกระดานฝั่งเราขึ้นสีทองสว่างวาบทั้งผืน", animation: "แสงออร่าแผ่กว้างแบบรัศมีวงกลม" },
    icon: "✨", effectType: "global", synergyTags: ["hero", "legendary"], unlockLevel: 7,
  },
  {
    templateId: "r_s1", name: "ศรพรหมมาสตร์", cost: 5, type: "skill", tier: L, cardFaction: "RAMA",
    description: "ทะลวงทัพศัตรูวิบัติ",
    ability: { trigger: "เมื่อกดใช้สกิล", action: "เลือกกดยูนิตเป้าหมาย 1 ตัวเป็นจุดเล็ง", result: "ปล่อยศรทำลายยูนิตศัตรูตัวนั้นและตัวที่เรียงติดกันในแนวตรงเป็นโดมิโน่", ui: "เลเซอร์เส้นตรงกวาดผ่านทับเป้าหมาย", animation: "ดาวตกหรือศรแสงระเบิดแหวกอากาศ" },
    icon: "💫", effectType: "damage", synergyTags: ["skill", "legendary"], unlockLevel: 6,
  },
  {
    templateId: "r_s2", name: "พรพระอิศวร", cost: 4, type: "skill", tier: H, cardFaction: "RAMA",
    description: "ชุบตัวจากธุลี",
    ability: { trigger: "เมื่อเรียกใช้สกิล", action: "เลือกช่องว่างที่พันธมิตรเพิ่งถูกล้อมทลายในเทิร์นนี้", result: "ชุบชีวิตพันธมิตรกลับคืนมาตำแหน่งเดิม", ui: "ไฮไลท์ช่องที่มีเงาวิญญาณตกค้าง", animation: "ละอองแสงร่ายรำคืนสภาพร่างกาย" },
    icon: "👼", effectType: "summon", synergyTags: ["skill", "hero"], unlockLevel: 5,
  },

  // ============================================================================
  // [LANKA] ยูนิตพื้นฐาน และ ฮีโร่
  // ============================================================================
  {
    templateId: "l_b1", name: "ยักษ์สมุน", cost: 1, type: "unit", tier: B, cardFaction: "LANKA",
    description: "นักรบรากหญ้าแห่งลงกา",
    ability: { trigger: "เมื่อวาง", action: "ไม่มี", result: "ไม่มีความสามารถ (ใช้ยึดพื้นที่)", ui: "-", animation: "วางธรรมดา" },
    icon: "👹", synergyTags: ["demon", "basic"], unlockLevel: 1,
  },
  {
    templateId: "l_b2", name: "อสูรเฝ้าด่าน", cost: 2, type: "unit", tier: B, cardFaction: "LANKA",
    description: "ปราการด่านแรกชะลอข้าศึก",
    ability: { trigger: "เมื่อวาง", action: "ไม่มี", result: "ไม่มีความสามารถ (ใช้ยึดพื้นที่)", ui: "-", animation: "วางธรรมดา" },
    icon: "🛡️", synergyTags: ["demon", "basic"], unlockLevel: 1,
  },
  {
    templateId: "l_b3", name: "ยักษ์รากษส", cost: 1, type: "unit", tier: B, cardFaction: "LANKA",
    description: "ตัวบุกป่าฝ่าดงทะลวงฟัน",
    ability: { trigger: "เมื่อวาง", action: "ไม่มี", result: "ไม่มีความสามารถ (ใช้ยึดพื้นที่)", ui: "-", animation: "วางธรรมดา" },
    icon: "🪓", synergyTags: ["demon", "basic"], unlockLevel: 1,
  },
  {
    templateId: "l_b4", name: "อสูรกองหน้า", cost: 1, type: "unit", tier: B, cardFaction: "LANKA",
    description: "แนวหน้าพลีชีพตะลุยแหลก",
    ability: { trigger: "เมื่อวาง", action: "ไม่มี", result: "ไม่มีความสามารถ (ใช้ยึดพื้นที่)", ui: "-", animation: "วางธรรมดา" },
    icon: "⚔️", synergyTags: ["demon", "basic"], unlockLevel: 1,
  },
  {
    templateId: "l_b5", name: "เพชฌฆาตอสูร", cost: 3, type: "unit", tier: B, cardFaction: "LANKA",
    description: "พลขวานสังหารปลิดชีพ",
    ability: { trigger: "เมื่อวาง", action: "ไม่มี", result: "ไม่มีความสามารถ (ใช้ยึดพื้นที่)", ui: "-", animation: "วางธรรมดา" },
    icon: "☠️", synergyTags: ["demon", "basic"], unlockLevel: 1,
  },
  {
    templateId: "l_h1", name: "กุมภกรรณ", cost: 5, type: "unit", tier: H, cardFaction: "LANKA",
    description: "พุ่งหลาว: ทะลวงแนวหอกล้มทัพหน้า",
    ability: { trigger: "เมื่อวางการ์ดลงพื้น", action: "เลือกทิศทางเดิน (ซ้าย/ขวา/บน/ล่าง)", result: "แผลงศรพุ่งไปทำลายยูนิตแรกสุดที่ขวางหน้าในทิศนั้น", ui: "แสดงเส้นลูกศรแดงยาวสุดกระดานบอกทิศการปา", animation: "แอนิเมชั่นหอกพุ่งทะลุกระดาน" },
    icon: "🔱", effectType: "damage", synergyTags: ["demon", "hero"], unlockLevel: 3,
  },
  {
    templateId: "l_h2", name: "นางสำมนักขา", cost: 3, type: "unit", tier: H, cardFaction: "LANKA",
    description: "ริษยา: พิษแค้นจากการถูกล้อมตาย",
    ability: { trigger: "เมื่อถูกโจมตีจนตาย (Passive)", action: "สแกนพื้นที่รอบด้าน", result: "ลากยูนิตศัตรูที่ต้นทุนสูงสุดในรัศมี 1 ช่องตายตามไปด้วยทันที", ui: "เครื่องหมายระเบิดเวลาลอยเหนือหัวยูนิตศัตรูใกล้ๆ", animation: "หมอกควันระเบิดพิษหลังการแตกหัก" },
    icon: "💃", effectType: "passive", synergyTags: ["demon", "hero"], unlockLevel: 3,
  },
  {
    templateId: "l_h3", name: "วิรุญจำบัง", cost: 4, type: "unit", tier: H, cardFaction: "LANKA",
    description: "หายตัว: เร้นกายในหมอกควัน",
    ability: { trigger: "เมื่อยืนหยัดปกติ (Passive)", action: "กลืนร่างเข้ากับแผ่นดิน", result: "ไม่สามารถตกเป็นเป้าหมายของ Skill ได้ (ล้อมฆ่าปกติเท่านั้น)", ui: "หมอกสีเทาปกคลุมไพ่เป็นเงาจางๆ", animation: "มีเอฟเฟกต์หมอกวิ่งรอบการ์ดเบาๆตลอดเวลา" },
    icon: "🥷", effectType: "passive", synergyTags: ["demon", "hero"], unlockLevel: 4,
  },
  {
    templateId: "l_h4", name: "สหัสเดชะ", cost: 6, type: "unit", tier: H, cardFaction: "LANKA",
    description: "พันหน้า: ป่วนสมรภูมิร่างกระจาย",
    ability: { trigger: "เมื่อศัตรูเดินชมาก (Passive)", action: "ทำงานสวนกลับเมื่อกระดานเปลี่ยน", result: "ทุกครั้งที่ศัตรูวางยูนิต สหัสเดชะจะปล่อยมินเนี่ยนตัวปลอม (Dummy) ขวาง 1 ช่อง", ui: "กระพริบไอคอนพันหน้าเตือนสติศัตรู", animation: "แยกร่างสบัดโคลนลงบนช่องรอบๆ" },
    icon: "🎭", effectType: "passive", synergyTags: ["demon", "hero"], unlockLevel: 5,
  },
  {
    templateId: "l_h5", name: "สัทธาสูร", cost: 5, type: "unit", tier: H, cardFaction: "LANKA",
    description: "ขโมยวิญญาณ: ดักกลืนกินพลังศพ",
    ability: { trigger: "หลังล้อมข้าศึกแตก (Passive)", action: "ดูดซับพลังวิญญาณผู้พ่ายแพ้", result: "โอนพลังงานมาให้ผู้เล่นอัญเชิญยูนิต Basic หลงเหลือในมือได้ฟรี 1 ตัวด่วนทันที", ui: "เพิ่มเลข Energy ชั่วคราวสีเขียว", animation: "ดูดหมอกวิญญาณวิ่งเข้าหาไพ่สัทธาสูร" },
    icon: "💀", effectType: "passive", synergyTags: ["demon", "hero"], unlockLevel: 4,
  },
  {
    templateId: "l_l1", name: "ทศกัณฐ์", cost: 7, type: "unit", tier: L, cardFaction: "LANKA",
    description: "จอมราชันย์: สิทธิ์ผู้เปี่ยมแสนยานุภาพ",
    ability: { trigger: "ทันทีที่เหยียบกระดาน", action: "ปลดล็อคข้อจำกัดเทิร์น", result: "บีบคั้นให้ได้สิทธิ์คอมโบ วางการ์ดจากบนมือลงบอร์ดเพิ่มฟรีทันทีอีก 1 ดาบ", ui: "สัญลักษณ์ 2x โผล่ขึ้นบนมือผู้เล่น", animation: "ฟ้าผ่าระเบิดเปิดเทิร์นสีแดงทอง" },
    icon: "👺", effectType: "global", synergyTags: ["demon", "legendary"], unlockLevel: 7,
  },
  {
    templateId: "l_l2", name: "อินทรชิต", cost: 6, type: "unit", tier: L, cardFaction: "LANKA",
    description: "ศรนาคบาศ: เปลี่ยนผืนนาคเป็นคุก",
    ability: { trigger: "แผลงศรก่อนวาปเข้าบอร์ด", action: "เลือกกดยูนิตศัตรูเป้าหมาย 1 ตัว", result: "เสกสิ่งกีดขวาง (งู) พลุ่ยครอบช่องรอบตัวศัตรูนั้นทั้งหมด ปิดกั้นทางหายใจดุเดือด", ui: "โชว์รอยวงแหวนอสรพิษล้อมพันศัตรู", animation: "ฝูงงูรัดตรึงโผล่จากพื้นผูกมัดวงล้อม" },
    icon: "🏹", effectType: "zone_control", synergyTags: ["demon", "legendary"], unlockLevel: 6,
  },
  {
    templateId: "l_l3", name: "ไมยราพณ์", cost: 5, type: "unit", tier: L, cardFaction: "LANKA",
    description: "สะกดทัพ: มนตราแห่งความหลับใหล",
    ability: { trigger: "จังหวะวางไพ่ทิ้งลงบอร์ด", action: "เลือกเขตแดน 3x3 ช่องใดๆบนบอร์ด", result: "สะกดเวท ศัตรูในวงนั้นไม่สามารถถูกนับเป็นพรรคพวกเวลาล้อมพื้นที่ได้", ui: "หน้าปัด 3x3 แสดงตารางโดนแสงสีม่วงอาบ", animation: "ผงนิทราโรยลูบหน้าทุกเซลล์ในเป้าหมาย" },
    icon: "💤", effectType: "aoe", synergyTags: ["demon", "legendary"], unlockLevel: 6,
  },
  {
    templateId: "l_s1", name: "พิธีชุบหอก", cost: 4, type: "skill", tier: H, cardFaction: "LANKA",
    description: "คลั่ง: ระเบิดวงกว้างล้างหน้าตัก",
    ability: { trigger: "ร่ายเวทใส่สมุนฝั่งเรา", action: "เลือกกดยูนิตฝ่ายเรา 1 ตัว (เพื่อพลีชีพ)", result: "ยูนิตนั้นระเบิดตัวเองตาย แลกกับการทำลายยูนิตติดกันพังทลายเป็นซากทั้งหมด", ui: "เป้าพลีชีพเป็นจุดแดง ศูนย์กลางระเบิด", animation: "ซูดแสงแดงเข้าไปศูนย์กลางก่อนตูมกระจุย" },
    icon: "💥", effectType: "damage", synergyTags: ["skill", "hero"], unlockLevel: 5,
  },
  {
    templateId: "l_s2", name: "คำสาปลงกา", cost: 5, type: "skill", tier: L, cardFaction: "LANKA",
    description: "แย่งชิง: สะกดจิตโอนย้ายสัญชาติ",
    ability: { trigger: "ทุ่มเวทควบคุม", action: "เลือกยูนิต Basic ศัตรู 1 ตัวเป้าหมาย", result: "เปลี่ยนยูนิตศัตรูกลายมาเป็นพรรคพวกของเราแบบดื้อๆ", ui: "เล็งหมากศัตรูสีฟ้า แล้วทำปฏิกิริยากระตุกเป็นสีแดง", animation: "สายฟ้าสีดำช็อตดึงเปลี่ยนสีแฟชั่นทันที" },
    icon: "🧛", effectType: "control", synergyTags: ["skill", "legendary"], unlockLevel: 8,
  },

  // ============================================================================
  // [NEUTRAL] ยูนิตพื้นฐาน และ ฮีโร่ทั่วไป
  // ============================================================================
  {
    templateId: "n_b1", name: "ม้านิลมังกร", cost: 1, type: "unit", tier: B, cardFaction: "NEUTRAL",
    description: "ขุนพลสัตว์วิเศษปะทะต้านชะตา",
    ability: { trigger: "เมื่อวาง", action: "ไม่มี", result: "ไม่มีความสามารถ (ใช้ยึดพื้นที่)", ui: "-", animation: "วางธรรมดา" },
    icon: "🐴", synergyTags: ["neutral", "basic"], unlockLevel: 1,
  },
  {
    templateId: "n_b2", name: "นกสาริกา", cost: 1, type: "unit", tier: B, cardFaction: "NEUTRAL",
    description: "สำรวจฟากฟ้าเก็บข้อมูล",
    ability: { trigger: "เมื่อวาง", action: "ไม่มี", result: "ไม่มีความสามารถ (ใช้ยึดพื้นที่)", ui: "-", animation: "วางธรรมดา" },
    icon: "🐦", synergyTags: ["neutral", "basic"], unlockLevel: 1,
  },
  {
    templateId: "n_b3", name: "พญานาคเด็ก", cost: 2, type: "unit", tier: B, cardFaction: "NEUTRAL",
    description: "อารักขาบาดาลต้านความเจ็บปวด",
    ability: { trigger: "เมื่อวาง", action: "ไม่มี", result: "ไม่มีความสามารถ (ใช้ยึดพื้นที่)", ui: "-", animation: "วางธรรมดา" },
    icon: "🐉", synergyTags: ["neutral", "basic"], unlockLevel: 1,
  },
  {
    templateId: "n_b4", name: "กินรี", cost: 1, type: "unit", tier: B, cardFaction: "NEUTRAL",
    description: "เริงระบำมนตราเบนความสนใจ",
    ability: { trigger: "เมื่อวาง", action: "ไม่มี", result: "ไม่มีความสามารถ (ใช้ยึดพื้นที่)", ui: "-", animation: "วางธรรมดา" },
    icon: "💃", synergyTags: ["neutral", "basic"], unlockLevel: 1,
  },
  {
    templateId: "n_b5", name: "ฤๅษีฝึกหัด", cost: 3, type: "unit", tier: B, cardFaction: "NEUTRAL",
    description: "ภาวนาพร่ำบ่นก่อเกิดความแข็งแกร่ง",
    ability: { trigger: "เมื่อวาง", action: "ไม่มี", result: "ไม่มีความสามารถ (ใช้ยึดพื้นที่)", ui: "-", animation: "วางธรรมดา" },
    icon: "🧘", synergyTags: ["neutral", "basic"], unlockLevel: 1,
  },
  {
    templateId: "n_h1", name: "มัจฉานุ", cost: 3, type: "unit", tier: H, cardFaction: "NEUTRAL",
    description: "สะเทินน้ำสะเทินบก: วางอิสระบนจุดหน่วง",
    ability: { trigger: "เมื่อถึงคิวลงกระดาน", action: "ลงพื้นที่น้ำหรือพื้นที่ปกติก็ได้ออโต้", result: "สามารถวางทับพื้นที่น้ำ (อุปสรรค) หรือกำแพงดินได้โดยไม่ถูกจำกัดสิทธิ์", ui: "ไฮไลท์สีฟ้าอมเขียวอนุญาตให้ร่อนลงตามสิ่งกีดขวาง", animation: "แหวกว่ายละอองน้ำโผล่ลงไปบนจุดทับ" },
    icon: "🐵", effectType: "buff", synergyTags: ["neutral", "hero"], unlockLevel: 3,
  },
  {
    templateId: "n_h2", name: "นกสดายุ", cost: 4, type: "unit", tier: H, cardFaction: "NEUTRAL",
    description: "กางปีก: สยายปีกบังลมกรดคุ้มครองเพื่อน",
    ability: { trigger: "ตั้งหลักยืนเกาะบอร์ด (Passive)", action: "ให้พรแบบไม่ต้องเลือก", result: "ยูนิตพันธมิตรที่ติดกันจะไม่สามารถถูกสกิลปะทะ เคาะสลับย้ายตำแหน่ง หรือตีเด้งได้", ui: "รัศมี 2 ช่องรอบสดายุขีดเส้นปะเหลืองป้องกันเพื่อน", animation: "กระพือปีกโบกปัดสถานะเด้งทุกรอบ" },
    icon: "🦅", effectType: "passive", synergyTags: ["neutral", "hero"], unlockLevel: 4,
  },
  {
    templateId: "n_h3", name: "สุพรรณมัจฉา", cost: 4, type: "unit", tier: H, cardFaction: "NEUTRAL",
    description: "กองทัพปลา: งัดก้อนกรวดปิดค่ายสกัดคลื่น",
    ability: { trigger: "จังหวะทิ้งการ์ดลงน่านน้ำ", action: "ผู้เล่นเลือกชี้ช่อง 2 ช่องใดๆ", result: "สร้างกำแพงชั่วคราวติดบล็อคพื้นที่บล็อคทางเดินปิดเส้น 2 ช่อง", ui: "ตีกรอบลูกศรเลือกช่องว่างบังคับเป้า", animation: "คลื่นปลายกรวดลอยขึ้นมากดทับสร้างหินผา" },
    icon: "🧜‍♀️", effectType: "zone_control", synergyTags: ["neutral", "hero"], unlockLevel: 3,
  },
  {
    templateId: "n_h4", name: "นกสัมพาที", cost: 3, type: "unit", tier: H, cardFaction: "NEUTRAL",
    description: "ส่องหล้า: มองทะลุแจ้งประจ่างปัดเป่ามาร",
    ability: { trigger: "ขยับปีกลงสนามปุ๊บ", action: "คำรามสะท้านกระดาน (Auto Action)", result: "ปลดล้างกับดักศัตรูทั้งหมดที่ซ่อนเร้นทิ้งเรียบ เปิดพื้นที่หมอกมืดทุกจุด", ui: "ตาข่ายเลเซอร์สแกนรันพราดเต็มแผ่นดินกระดาน", animation: "ดวงตาเพลิงสว่างจ้ากวาดกลืนซากกับดักวิบัติสิ้น" },
    icon: "🔥", effectType: "global", synergyTags: ["neutral", "hero"], unlockLevel: 2,
  },
  {
    templateId: "n_h5", name: "ทรพี", cost: 5, type: "unit", tier: H, cardFaction: "NEUTRAL",
    description: "วัดรอยเท้า: กระทืบบาททำลายการค้ำชูศัตรู",
    ability: { trigger: "เมื่อเลือกยืนซ้อนติดฝูงศัตรู", action: "สะเทือนแผ่นดิน (Auto Strike)", result: "ยูนิตศัตรูที่อยู่ติดกับทรพีจะไม่สามารถแชร์ Liberty (ช่องหายใจ) กับเพื่อนมันได้ ปล่อยให้ล้อมตายง่ายดาย!", ui: "เส้นโยงผูกจิตศัตรูรอบๆถูกทำลายขาดสะบั้น", animation: "กระทืบพื้นดินแตกแรงอัดวงกว้างกระตุกขาด" },
    icon: "🐃", effectType: "aoe", synergyTags: ["neutral", "hero"], unlockLevel: 4,
  },
  {
    templateId: "n_l1", name: "นางสีดา", cost: 7, type: "unit", tier: L, cardFaction: "NEUTRAL",
    description: "พิสูจน์ตน: อัคคีล้างบาปผุดผาดสิ้นวงจรเวท",
    ability: { trigger: "ย่างกรายลงสมรภูมิ", action: "ชำระล้างกฎและกติกา", result: "ลบล้างเอฟเฟกต์ คำสาป บัฟ ทางเดิน บล็อค กับดัก ทั้งหมดจนเหลือบนบอร์ดแค่ 'ตัวหมากเปล่าๆ'", ui: "กระพริบวงสว่างเคลียร์มลทินล้างลบช่องทุกชนิดออก", animation: "ระเบิดม่านแสงสีขาวฟุ้งกระจายเคลียร์กระดานสงบลง" },
    icon: "👸", effectType: "global", synergyTags: ["neutral", "legendary"], unlockLevel: 8,
  },
  {
    templateId: "n_l2", name: "พญาอนันตนาคราช", cost: 6, type: "unit", tier: L, cardFaction: "NEUTRAL",
    description: "รัดกุม: จมเขี้ยวฉีกช่องหายใจแหลก",
    ability: { trigger: "อัญเชิญปักหมุด", action: "เล็งเลือกเป้ายูนิตศัตรู 3 ตัว (เรียงตัว)", result: "ทั้งสามตัวที่ถูกเล็งจะถูกพันธนาการ ห้ามใช้ช่องหายใจรอดพ้น ตายล้างกระดานฉับพลันในเทิร์นหน้าถ้าเพื่อนไม่แก้", ui: "คิวไฮไลท์งูกระหวัด 1-2-3 ชิ้นเหนือศัตรู", animation: "พญานาครัดพันพันธนาการแน่น" },
    icon: "🐍", effectType: "control", synergyTags: ["neutral", "legendary"], unlockLevel: 7,
  },
  {
    templateId: "n_l3", name: "ฤๅษีดัดตน", cost: 4, type: "unit", tier: L, cardFaction: "NEUTRAL",
    description: "คืนชีพ: วิถีเบิกบุญเก่าหล่อหลอมชีพใหม่",
    ability: { trigger: "เปิดดวงตาลงสมาธิ", action: "เลือกกดยูนิต Legendary ที่ตายไปแล้วของคุณ", result: "สลับเข้าจั่วลงมือ สามารถวางกลับลงบอร์ดเพื่อเปิดศึกใหม่!", ui: "แผงผีลอยขึ้นมาให้เกมเมอร์จิ้มเลือกชุบตัวกษัตริย์", animation: "แสงทองหมุนติ้วปั้นลมปราณเข้าเป็นไพ่เด้งใส่มือ" },
    icon: "🧘‍♂️", effectType: "summon", synergyTags: ["neutral", "legendary"], unlockLevel: 8,
  },
  {
    templateId: "n_s1", name: "พายุอาเพศ", cost: 3, type: "skill", tier: H, cardFaction: "NEUTRAL",
    description: "ชิ่งปั่นป่วน: ลมหมุนสลาตันฉีกกระชากซ้ำ",
    ability: { trigger: "ร่ายเวทมนตร์เสร็จสิ้น", action: "ชี้เป้ายูนิตศัตรู 1 ตัวแรก", result: "พายุลูกติดเข้าทำลาย และเด้งกระโดดต่อไปพังยูนิตที่อยู่ติดกันอีก 1 เป้ารวด", ui: "สัญลักษณ์เป้าหลักและเป้ารองชิ่งรันกัน 2 เตป", animation: "เกลียวพายุปัดเป่าตัวแรกแล้วโค้งไปบิดบดตัวที่สองทะลุ" },
    icon: "🌪️", effectType: "chain", synergyTags: ["skill", "hero"], unlockLevel: 4,
  },
  {
    templateId: "n_s2", name: "มนต์เรียกปลา", cost: 2, type: "skill", tier: H, cardFaction: "NEUTRAL",
    description: "เปลี่ยนชัยภูมิ: ขับน้ำท่วมผืนแผ่นดินจำกัดขอบเดิน",
    ability: { trigger: "เมื่อลั่นเวทเรียกน้ำ", action: "ลากครอบคลุมพื้นที่ 3 ช่องแบบอิสระ", result: "เปลี่ยนพื้นที่เป็นสมรภูมิน้ำ ตัดกระบวนทัพเดินทหารราบทันที", ui: "เล็งชี้ 3 พอยต์เชื่อมทางแล้วไฮไลท์เป็นเส้นเขตน้ำ", animation: "น้ำพุพุ่งปะทุแผ่ราดย้อมพื้นที่เป็นสีฟ้าคราม" },
    icon: "🌊", effectType: "zone_control", synergyTags: ["skill", "hero"], unlockLevel: 3,
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
        image: undefined,
        effectType: t.effectType,
        synergyTags: t.synergyTags,
        comboType: t.templateId,
      } as const;
      if (t.type === "unit") return { ...base, type: "unit", unit: { faction: owner } } as Card;
      
      // Default to blockTile for now until skillKinds are fully mapped if missing
      return { ...base, type: "skill", skill: { kind: "blockTile" } } as Card;
    });
}
