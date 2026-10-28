// ANSI carbide insert designation reference tables — transcribed from the
// standard 7-position ANSI insert designation chart (Shape-Clearance-
// Tolerance-Geometry · Size-Thickness-Corner, e.g. "CNMG 432").
// This is reference/lookup data, not a live calculation — kept as plain
// tables so both the recommendation engine and the on-page reference
// chart read from a single source of truth.

import type { Lang } from "@/lib/lang";

export interface DesignationOption {
  code: string;
  labelFa: string;
  labelEn: string;
  detailFa?: string;
  detailEn?: string;
}

/** Language-aware accessors for table rows (Persian is the default). */
export function optionLabel(o: DesignationOption, lang: Lang = "fa"): string {
  return lang === "en" ? o.labelEn : o.labelFa;
}

export function optionDetail(o: DesignationOption, lang: Lang = "fa"): string | undefined {
  return lang === "en" ? o.detailEn : o.detailFa;
}

export const insertShapes: DesignationOption[] = [
  { code: "A", labelFa: "متوازی‌الاضلاع ۸۵°", labelEn: "85° parallelogram" },
  { code: "B", labelFa: "متوازی‌الاضلاع ۸۲°", labelEn: "82° parallelogram" },
  { code: "C", labelFa: "لوزی (Rhombic) ۸۰°", labelEn: "80° rhombic" },
  { code: "D", labelFa: "لوزی (Rhombic) ۵۵°", labelEn: "55° rhombic" },
  { code: "E", labelFa: "لوزی (Rhombic) ۷۵°", labelEn: "75° rhombic" },
  { code: "H", labelFa: "شش‌ضلعی", labelEn: "Hexagon" },
  { code: "K", labelFa: "متوازی‌الاضلاع ۵۵°", labelEn: "55° parallelogram" },
  { code: "L", labelFa: "مستطیلی", labelEn: "Rectangle" },
  { code: "M", labelFa: "لوزی (Rhombic) ۸۶°", labelEn: "86° rhombic" },
  { code: "O", labelFa: "هشت‌ضلعی", labelEn: "Octagon" },
  { code: "P", labelFa: "پنج‌ضلعی", labelEn: "Pentagon" },
  { code: "R", labelFa: "دایره‌ای (Round)", labelEn: "Round" },
  { code: "S", labelFa: "مربعی (Square)", labelEn: "Square" },
  { code: "T", labelFa: "مثلثی (Triangle)", labelEn: "Triangle" },
  { code: "V", labelFa: "لوزی (Rhombic) ۳۵°", labelEn: "35° rhombic" },
  { code: "W", labelFa: "سه‌گوش گرد (Trigon) ۸۰°", labelEn: "80° trigon" },
];

export const insertClearances: DesignationOption[] = [
  { code: "N", labelFa: "۰°", labelEn: "0°" },
  { code: "A", labelFa: "۳°", labelEn: "3°" },
  { code: "B", labelFa: "۵°", labelEn: "5°" },
  { code: "C", labelFa: "۷°", labelEn: "7°" },
  { code: "P", labelFa: "۱۱°", labelEn: "11°" },
  { code: "D", labelFa: "۱۵°", labelEn: "15°" },
  { code: "E", labelFa: "۲۰°", labelEn: "20°" },
  { code: "F", labelFa: "۲۵°", labelEn: "25°" },
  { code: "G", labelFa: "۳۰°", labelEn: "30°" },
];

// Chinese/ISO-aligned metric tolerance table (m = nose-height tolerance,
// IC = inscribed-circle tolerance, S1 = thickness tolerance), in mm.
export const insertTolerances: DesignationOption[] = [
  { code: "A", labelFa: "کلاس A", labelEn: "Class A", detailFa: "m=±0.005mm · IC=±0.025mm · S1=±0.025mm", detailEn: "m=±0.005mm · IC=±0.025mm · S1=±0.025mm" },
  { code: "F", labelFa: "کلاس F", labelEn: "Class F", detailFa: "m=±0.005mm · IC=±0.013mm · S1=±0.025mm", detailEn: "m=±0.005mm · IC=±0.013mm · S1=±0.025mm" },
  { code: "C", labelFa: "کلاس C", labelEn: "Class C", detailFa: "m=±0.013mm · IC=±0.025mm · S1=±0.025mm", detailEn: "m=±0.013mm · IC=±0.025mm · S1=±0.025mm" },
  { code: "H", labelFa: "کلاس H", labelEn: "Class H", detailFa: "m=±0.013mm · IC=±0.013mm · S1=±0.025mm", detailEn: "m=±0.013mm · IC=±0.013mm · S1=±0.025mm" },
  { code: "E", labelFa: "کلاس E", labelEn: "Class E", detailFa: "m=±0.025mm · IC=±0.025mm · S1=±0.025mm", detailEn: "m=±0.025mm · IC=±0.025mm · S1=±0.025mm" },
  {
    code: "G",
    labelFa: "کلاس G (دقیق — پرداخت‌کاری/غیرآهنی/فولاد سخت‌کاری‌شده)",
    labelEn: "Class G (precision — finishing / non-ferrous / hardened steel)",
    detailFa: "m=±0.025mm · IC=±0.025mm · S1=±0.13mm",
    detailEn: "m=±0.025mm · IC=±0.025mm · S1=±0.13mm",
  },
  { code: "J", labelFa: "کلاس J", labelEn: "Class J", detailFa: "m=±0.005mm · IC=±0.05 تا ±0.13mm · S1=±0.025mm", detailEn: "m=±0.005mm · IC=±0.05 to ±0.13mm · S1=±0.025mm" },
  { code: "K", labelFa: "کلاس K", labelEn: "Class K", detailFa: "m=±0.013mm · IC=±0.05 تا ±0.13mm · S1=±0.025mm", detailEn: "m=±0.013mm · IC=±0.05 to ±0.13mm · S1=±0.025mm" },
  { code: "L", labelFa: "کلاس L", labelEn: "Class L", detailFa: "m=±0.025mm · IC=±0.05 تا ±0.13mm · S1=±0.025mm", detailEn: "m=±0.025mm · IC=±0.05 to ±0.13mm · S1=±0.025mm" },
  {
    code: "M",
    labelFa: "کلاس M (عمومی تا خشن‌کاری سنگین — رایج‌ترین)",
    labelEn: "Class M (general to heavy roughing — most common)",
    detailFa: "m=±0.08 تا ±0.18mm · IC=±0.05 تا ±0.13mm · S1=±0.13mm",
    detailEn: "m=±0.08 to ±0.18mm · IC=±0.05 to ±0.13mm · S1=±0.13mm",
  },
  { code: "N", labelFa: "کلاس N", labelEn: "Class N", detailFa: "m=±0.08 تا ±0.18mm · IC=±0.05 تا ±0.13mm · S1=±0.025mm", detailEn: "m=±0.08 to ±0.18mm · IC=±0.05 to ±0.13mm · S1=±0.025mm" },
  {
    code: "U",
    labelFa: "کلاس U (خشن‌کاری)",
    labelEn: "Class U (roughing)",
    detailFa: "m=±0.08 تا ±0.18mm · IC=±0.08 تا ±0.25mm · S1=±0.13mm",
    detailEn: "m=±0.08 to ±0.18mm · IC=±0.08 to ±0.25mm · S1=±0.13mm",
  },
];

export const insertGeometries: DesignationOption[] = [
  { code: "A", labelFa: "بدون سوراخ، تخت", labelEn: "No hole, flat" },
  { code: "F", labelFa: "پرداخت‌کاری، شکن‌براده ظریف", labelEn: "Finishing, fine chipbreaker" },
  { code: "G", labelFa: "عمومی، شکن‌براده متوسط (نمونه رایج CNMG)", labelEn: "General purpose, medium chipbreaker (typical CNMG)" },
  { code: "M", labelFa: "خشن‌کاری متوسط تا سنگین", labelEn: "Medium to heavy roughing" },
  { code: "R", labelFa: "خشن‌کاری سنگین، لبه مقاوم", labelEn: "Heavy roughing, strong edge" },
  { code: "N", labelFa: "بدون سوراخ", labelEn: "No hole" },
  { code: "Q", labelFa: "دو طرفه، سوراخ کشویی ۴۰–۶۰°", labelEn: "Double-sided, countersunk hole 40–60°" },
  { code: "T", labelFa: "یک‌طرفه، سوراخ کشویی ۴۰–۶۰°", labelEn: "Single-sided, countersunk hole 40–60°" },
  { code: "U", labelFa: "دو طرفه بدون شکن‌براده، ۴۰–۶۰°", labelEn: "Double-sided, no chipbreaker, 40–60°" },
  { code: "W", labelFa: "یک‌طرفه بدون شکن‌براده، ۴۰–۶۰°", labelEn: "Single-sided, no chipbreaker, 40–60°" },
  { code: "B", labelFa: "سوراخ کشویی ۷۰–۹۰°", labelEn: "Countersunk hole 70–90°" },
  { code: "C", labelFa: "دو طرفه، سوراخ کشویی ۷۰–۹۰°", labelEn: "Double-sided, countersunk hole 70–90°" },
  { code: "H", labelFa: "یک‌طرفه، سوراخ کشویی ۷۰–۹۰°", labelEn: "Single-sided, countersunk hole 70–90°" },
  { code: "J", labelFa: "دو طرفه، سوراخ کشویی ۷۰–۹۰° (نوع دوم)", labelEn: "Double-sided, countersunk hole 70–90° (type 2)" },
  { code: "X", labelFa: "طراحی ویژه (Special Design)", labelEn: "Special design" },
];

// Same numeric family used for both Size (inscribed circle) and Thickness —
// meaning differs per position (see notes below).
export const insertSizes: DesignationOption[] = [
  { code: "1.8", labelFa: "۷/۳۲ اینچ (~5.6mm)", labelEn: "7/32 in (~5.6mm)" },
  { code: "2", labelFa: "۱/۴ اینچ (~6.35mm)", labelEn: "1/4 in (~6.35mm)" },
  { code: "3", labelFa: "۳/۸ اینچ (~9.5mm)", labelEn: "3/8 in (~9.5mm)" },
  { code: "4", labelFa: "۱/۲ اینچ (~12.7mm)", labelEn: "1/2 in (~12.7mm)" },
  { code: "5", labelFa: "۵/۸ اینچ (~15.9mm)", labelEn: "5/8 in (~15.9mm)" },
  { code: "6", labelFa: "۳/۴ اینچ (~19mm)", labelEn: "3/4 in (~19mm)" },
  { code: "8", labelFa: "۱ اینچ (~25.4mm)", labelEn: "1 in (~25.4mm)" },
];

export const insertThicknesses: DesignationOption[] = [
  { code: "1", labelFa: "۱/۱۶ اینچ (~1.6mm)", labelEn: "1/16 in (~1.6mm)" },
  { code: "1.5", labelFa: "۳/۳۲ اینچ (~2.4mm)", labelEn: "3/32 in (~2.4mm)" },
  { code: "2", labelFa: "۱/۸ اینچ (~3.2mm)", labelEn: "1/8 in (~3.2mm)" },
  { code: "2.5", labelFa: "۵/۳۲ اینچ (~4.0mm)", labelEn: "5/32 in (~4.0mm)" },
  { code: "3", labelFa: "۳/۱۶ اینچ (~4.8mm)", labelEn: "3/16 in (~4.8mm)" },
  { code: "4", labelFa: "۱/۴ اینچ (~6.4mm)", labelEn: "1/4 in (~6.4mm)" },
  { code: "5", labelFa: "۵/۱۶ اینچ (~7.9mm)", labelEn: "5/16 in (~7.9mm)" },
  { code: "6", labelFa: "۳/۸ اینچ (~9.5mm)", labelEn: "3/8 in (~9.5mm)" },
];

export const insertCorners: DesignationOption[] = [
  { code: "0", labelFa: "لبه تیز (بدون شعاع)", labelEn: "Sharp corner (no radius)" },
  { code: ".5", labelFa: "شعاع 0.008 اینچ", labelEn: "0.008 in radius" },
  { code: "1", labelFa: "شعاع ۱/۶۴ اینچ (~0.4mm)", labelEn: "1/64 in radius (~0.4mm)" },
  { code: "2", labelFa: "شعاع ۱/۳۲ اینچ (~0.8mm)", labelEn: "1/32 in radius (~0.8mm)" },
  { code: "3", labelFa: "شعاع ۳/۶۴ اینچ (~1.2mm)", labelEn: "3/64 in radius (~1.2mm)" },
  { code: "4", labelFa: "شعاع ۱/۱۶ اینچ (~1.6mm)", labelEn: "1/16 in radius (~1.6mm)" },
  { code: "6", labelFa: "شعاع ۳/۳۲ اینچ (~2.4mm)", labelEn: "3/32 in radius (~2.4mm)" },
  { code: "8", labelFa: "شعاع ۱/۸ اینچ (~3.2mm)", labelEn: "1/8 in radius (~3.2mm)" },
  { code: "12", labelFa: "شعاع ۳/۱۶ اینچ (~4.8mm)", labelEn: "3/16 in radius (~4.8mm)" },
  { code: "A", labelFa: "مربعی با پخ ۴۵°", labelEn: "Square corner with 45° chamfer" },
  { code: "D", labelFa: "مربعی با پخ ۳۰°", labelEn: "Square corner with 30° chamfer" },
  { code: "E", labelFa: "مربعی با پخ ۱۵°", labelEn: "Square corner with 15° chamfer" },
  { code: "K", labelFa: "مربعی با پخ دوبل ۱۵°", labelEn: "Square corner with double 15° chamfer" },
  { code: "N", labelFa: "مثلثی بریده (Truncated)", labelEn: "Truncated triangle" },
  { code: "P", labelFa: "مثلثی با گوشه صاف‌شده", labelEn: "Triangle with flattened corner" },
];

// ISO metric size/thickness/corner suffix (ISO 1832) — this is the numeric
// format used by most real-world catalogs today (e.g. "CNMG 12 04 08"),
// distinct from the older ANSI inch-fraction codes above. Shape, clearance,
// tolerance and geometry letters are shared between both systems.
export const insertSizesMetric: DesignationOption[] = [
  { code: "06", labelFa: "IC ≈ 6.35mm (1/4″)", labelEn: "IC ≈ 6.35mm (1/4″)" },
  { code: "09", labelFa: "IC ≈ 9.525mm (3/8″)", labelEn: "IC ≈ 9.525mm (3/8″)" },
  { code: "12", labelFa: "IC ≈ 12.7mm (1/2″) — رایج‌ترین اندازه", labelEn: "IC ≈ 12.7mm (1/2″) — most common size" },
  { code: "16", labelFa: "IC ≈ 15.875mm (5/8″)", labelEn: "IC ≈ 15.875mm (5/8″)" },
  { code: "19", labelFa: "IC ≈ 19.05mm (3/4″)", labelEn: "IC ≈ 19.05mm (3/4″)" },
  { code: "25", labelFa: "IC ≈ 25.4mm (1″)", labelEn: "IC ≈ 25.4mm (1″)" },
];

export const insertThicknessesMetric: DesignationOption[] = [
  { code: "02", labelFa: "ضخامت ≈ 2.38mm", labelEn: "Thickness ≈ 2.38mm" },
  { code: "03", labelFa: "ضخامت ≈ 3.18mm", labelEn: "Thickness ≈ 3.18mm" },
  { code: "04", labelFa: "ضخامت ≈ 4.76mm — رایج با IC=12", labelEn: "Thickness ≈ 4.76mm — common with IC=12" },
  { code: "05", labelFa: "ضخامت ≈ 5.56mm", labelEn: "Thickness ≈ 5.56mm" },
  { code: "06", labelFa: "ضخامت ≈ 6.35mm", labelEn: "Thickness ≈ 6.35mm" },
  { code: "07", labelFa: "ضخامت ≈ 7.94mm", labelEn: "Thickness ≈ 7.94mm" },
];

export const insertCornersMetric: DesignationOption[] = [
  { code: "00", labelFa: "لبه تیز (بدون شعاع)", labelEn: "Sharp corner (no radius)" },
  { code: "02", labelFa: "شعاع ۰.۲mm", labelEn: "Nose radius 0.2mm" },
  { code: "04", labelFa: "شعاع ۰.۴mm", labelEn: "Nose radius 0.4mm" },
  { code: "08", labelFa: "شعاع ۰.۸mm — رایج‌ترین شعاع عمومی", labelEn: "Nose radius 0.8mm — most common general-purpose radius" },
  { code: "12", labelFa: "شعاع ۱.۲mm", labelEn: "Nose radius 1.2mm" },
  { code: "16", labelFa: "شعاع ۱.۶mm", labelEn: "Nose radius 1.6mm" },
  { code: "24", labelFa: "شعاع ۲.۴mm", labelEn: "Nose radius 2.4mm" },
  { code: "32", labelFa: "شعاع ۳.۲mm", labelEn: "Nose radius 3.2mm" },
];

export function findOption(list: DesignationOption[], code: string): DesignationOption | undefined {
  return list.find((o) => o.code === code);
}
