// ANSI carbide insert designation reference tables — transcribed from the
// standard 7-position ANSI insert designation chart (Shape-Clearance-
// Tolerance-Geometry · Size-Thickness-Corner, e.g. "CNMG 432").
// This is reference/lookup data, not a live calculation — kept as plain
// tables so both the recommendation engine and the on-page reference
// chart read from a single source of truth.

export interface DesignationOption {
  code: string;
  labelFa: string;
  detailFa?: string;
}

export const insertShapes: DesignationOption[] = [
  { code: "A", labelFa: "متوازی‌الاضلاع ۸۵°" },
  { code: "B", labelFa: "متوازی‌الاضلاع ۸۲°" },
  { code: "C", labelFa: "لوزی (Rhombic) ۸۰°" },
  { code: "D", labelFa: "لوزی (Rhombic) ۵۵°" },
  { code: "E", labelFa: "لوزی (Rhombic) ۷۵°" },
  { code: "H", labelFa: "شش‌ضلعی" },
  { code: "K", labelFa: "متوازی‌الاضلاع ۵۵°" },
  { code: "L", labelFa: "مستطیلی" },
  { code: "M", labelFa: "لوزی (Rhombic) ۸۶°" },
  { code: "O", labelFa: "هشت‌ضلعی" },
  { code: "P", labelFa: "پنج‌ضلعی" },
  { code: "R", labelFa: "دایره‌ای (Round)" },
  { code: "S", labelFa: "مربعی (Square)" },
  { code: "T", labelFa: "مثلثی (Triangle)" },
  { code: "V", labelFa: "لوزی (Rhombic) ۳۵°" },
  { code: "W", labelFa: "سه‌گوش گرد (Trigon) ۸۰°" },
];

export const insertClearances: DesignationOption[] = [
  { code: "N", labelFa: "۰°" },
  { code: "A", labelFa: "۳°" },
  { code: "B", labelFa: "۵°" },
  { code: "C", labelFa: "۷°" },
  { code: "P", labelFa: "۱۱°" },
  { code: "D", labelFa: "۱۵°" },
  { code: "E", labelFa: "۲۰°" },
  { code: "F", labelFa: "۲۵°" },
  { code: "G", labelFa: "۳۰°" },
];

// Chinese/ISO-aligned metric tolerance table (m = nose-height tolerance,
// IC = inscribed-circle tolerance, S1 = thickness tolerance), in mm.
export const insertTolerances: DesignationOption[] = [
  { code: "A", labelFa: "کلاس A", detailFa: "m=±0.005mm · IC=±0.025mm · S1=±0.025mm" },
  { code: "F", labelFa: "کلاس F", detailFa: "m=±0.005mm · IC=±0.013mm · S1=±0.025mm" },
  { code: "C", labelFa: "کلاس C", detailFa: "m=±0.013mm · IC=±0.025mm · S1=±0.025mm" },
  { code: "H", labelFa: "کلاس H", detailFa: "m=±0.013mm · IC=±0.013mm · S1=±0.025mm" },
  { code: "E", labelFa: "کلاس E", detailFa: "m=±0.025mm · IC=±0.025mm · S1=±0.025mm" },
  { code: "G", labelFa: "کلاس G (دقیق — پرداخت‌کاری/غیرآهنی/فولاد سخت‌کاری‌شده)", detailFa: "m=±0.025mm · IC=±0.025mm · S1=±0.13mm" },
  { code: "J", labelFa: "کلاس J", detailFa: "m=±0.005mm · IC=±0.05 تا ±0.13mm · S1=±0.025mm" },
  { code: "K", labelFa: "کلاس K", detailFa: "m=±0.013mm · IC=±0.05 تا ±0.13mm · S1=±0.025mm" },
  { code: "L", labelFa: "کلاس L", detailFa: "m=±0.025mm · IC=±0.05 تا ±0.13mm · S1=±0.025mm" },
  { code: "M", labelFa: "کلاس M (عمومی تا خشن‌کاری سنگین — رایج‌ترین)", detailFa: "m=±0.08 تا ±0.18mm · IC=±0.05 تا ±0.13mm · S1=±0.13mm" },
  { code: "N", labelFa: "کلاس N", detailFa: "m=±0.08 تا ±0.18mm · IC=±0.05 تا ±0.13mm · S1=±0.025mm" },
  { code: "U", labelFa: "کلاس U (خشن‌کاری)", detailFa: "m=±0.08 تا ±0.18mm · IC=±0.08 تا ±0.25mm · S1=±0.13mm" },
];

export const insertGeometries: DesignationOption[] = [
  { code: "A", labelFa: "بدون سوراخ، تخت" },
  { code: "F", labelFa: "پرداخت‌کاری، شکن‌براده ظریف" },
  { code: "G", labelFa: "عمومی، شکن‌براده متوسط (نمونه رایج CNMG)" },
  { code: "M", labelFa: "خشن‌کاری متوسط تا سنگین" },
  { code: "R", labelFa: "خشن‌کاری سنگین، لبه مقاوم" },
  { code: "N", labelFa: "بدون سوراخ" },
  { code: "Q", labelFa: "دو طرفه، سوراخ کشویی ۴۰–۶۰°" },
  { code: "T", labelFa: "یک‌طرفه، سوراخ کشویی ۴۰–۶۰°" },
  { code: "U", labelFa: "دو طرفه بدون شکن‌براده، ۴۰–۶۰°" },
  { code: "W", labelFa: "یک‌طرفه بدون شکن‌براده، ۴۰–۶۰°" },
  { code: "B", labelFa: "سوراخ کشویی ۷۰–۹۰°" },
  { code: "C", labelFa: "دو طرفه، سوراخ کشویی ۷۰–۹۰°" },
  { code: "H", labelFa: "یک‌طرفه، سوراخ کشویی ۷۰–۹۰°" },
  { code: "J", labelFa: "دو طرفه، سوراخ کشویی ۷۰–۹۰° (نوع دوم)" },
  { code: "X", labelFa: "طراحی ویژه (Special Design)" },
];

// Same numeric family used for both Size (inscribed circle) and Thickness —
// meaning differs per position (see notes below).
export const insertSizes: DesignationOption[] = [
  { code: "1.8", labelFa: "۷/۳۲ اینچ (~5.6mm)" },
  { code: "2", labelFa: "۱/۴ اینچ (~6.35mm)" },
  { code: "3", labelFa: "۳/۸ اینچ (~9.5mm)" },
  { code: "4", labelFa: "۱/۲ اینچ (~12.7mm)" },
  { code: "5", labelFa: "۵/۸ اینچ (~15.9mm)" },
  { code: "6", labelFa: "۳/۴ اینچ (~19mm)" },
  { code: "8", labelFa: "۱ اینچ (~25.4mm)" },
];

export const insertThicknesses: DesignationOption[] = [
  { code: "1", labelFa: "۱/۱۶ اینچ (~1.6mm)" },
  { code: "1.5", labelFa: "۳/۳۲ اینچ (~2.4mm)" },
  { code: "2", labelFa: "۱/۸ اینچ (~3.2mm)" },
  { code: "2.5", labelFa: "۵/۳۲ اینچ (~4.0mm)" },
  { code: "3", labelFa: "۳/۱۶ اینچ (~4.8mm)" },
  { code: "4", labelFa: "۱/۴ اینچ (~6.4mm)" },
  { code: "5", labelFa: "۵/۱۶ اینچ (~7.9mm)" },
  { code: "6", labelFa: "۳/۸ اینچ (~9.5mm)" },
];

export const insertCorners: DesignationOption[] = [
  { code: "0", labelFa: "لبه تیز (بدون شعاع)" },
  { code: ".5", labelFa: "شعاع 0.008 اینچ" },
  { code: "1", labelFa: "شعاع ۱/۶۴ اینچ (~0.4mm)" },
  { code: "2", labelFa: "شعاع ۱/۳۲ اینچ (~0.8mm)" },
  { code: "3", labelFa: "شعاع ۳/۶۴ اینچ (~1.2mm)" },
  { code: "4", labelFa: "شعاع ۱/۱۶ اینچ (~1.6mm)" },
  { code: "6", labelFa: "شعاع ۳/۳۲ اینچ (~2.4mm)" },
  { code: "8", labelFa: "شعاع ۱/۸ اینچ (~3.2mm)" },
  { code: "12", labelFa: "شعاع ۳/۱۶ اینچ (~4.8mm)" },
  { code: "A", labelFa: "مربعی با پخ ۴۵°" },
  { code: "D", labelFa: "مربعی با پخ ۳۰°" },
  { code: "E", labelFa: "مربعی با پخ ۱۵°" },
  { code: "K", labelFa: "مربعی با پخ دوبل ۱۵°" },
  { code: "N", labelFa: "مثلثی بریده (Truncated)" },
  { code: "P", labelFa: "مثلثی با گوشه صاف‌شده" },
];

// ISO metric size/thickness/corner suffix (ISO 1832) — this is the numeric
// format used by most real-world catalogs today (e.g. "CNMG 12 04 08"),
// distinct from the older ANSI inch-fraction codes above. Shape, clearance,
// tolerance and geometry letters are shared between both systems.
export const insertSizesMetric: DesignationOption[] = [
  { code: "06", labelFa: "IC ≈ 6.35mm (1/4″)" },
  { code: "09", labelFa: "IC ≈ 9.525mm (3/8″)" },
  { code: "12", labelFa: "IC ≈ 12.7mm (1/2″) — رایج‌ترین اندازه" },
  { code: "16", labelFa: "IC ≈ 15.875mm (5/8″)" },
  { code: "19", labelFa: "IC ≈ 19.05mm (3/4″)" },
  { code: "25", labelFa: "IC ≈ 25.4mm (1″)" },
];

export const insertThicknessesMetric: DesignationOption[] = [
  { code: "02", labelFa: "ضخامت ≈ 2.38mm" },
  { code: "03", labelFa: "ضخامت ≈ 3.18mm" },
  { code: "04", labelFa: "ضخامت ≈ 4.76mm — رایج با IC=12" },
  { code: "05", labelFa: "ضخامت ≈ 5.56mm" },
  { code: "06", labelFa: "ضخامت ≈ 6.35mm" },
  { code: "07", labelFa: "ضخامت ≈ 7.94mm" },
];

export const insertCornersMetric: DesignationOption[] = [
  { code: "00", labelFa: "لبه تیز (بدون شعاع)" },
  { code: "02", labelFa: "شعاع ۰.۲mm" },
  { code: "04", labelFa: "شعاع ۰.۴mm" },
  { code: "08", labelFa: "شعاع ۰.۸mm — رایج‌ترین شعاع عمومی" },
  { code: "12", labelFa: "شعاع ۱.۲mm" },
  { code: "16", labelFa: "شعاع ۱.۶mm" },
  { code: "24", labelFa: "شعاع ۲.۴mm" },
  { code: "32", labelFa: "شعاع ۳.۲mm" },
];

export function findOption(list: DesignationOption[], code: string): DesignationOption | undefined {
  return list.find((o) => o.code === code);
}
