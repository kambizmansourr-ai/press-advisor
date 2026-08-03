// Guided recommendation engine for carbide insert selection, built on top
// of the ANSI designation tables in @/data/insertDesignation. This is a
// simplified decision-table (not a physics calculation) grounded in common
// machining practice: it points to a sensible starting designation code —
// final grade/coating choice should still be checked against a tool
// manufacturer's catalog (see notesFa).

import {
  findOption,
  insertClearances,
  insertCornersMetric,
  insertGeometries,
  insertShapes,
  insertSizesMetric,
  insertThicknessesMetric,
} from "@/data/insertDesignation";

export type InsertOperation =
  | "turning-ext"
  | "turning-int"
  | "facing"
  | "grooving"
  | "face-milling"
  | "shoulder-milling"
  | "drilling";

export type InsertMaterialGroup = "steel" | "stainless" | "castiron" | "nonferrous" | "hardened" | "superalloy";

export type InsertPriority = "roughing" | "general" | "finishing";

export interface InsertRecommendationInput {
  operation: InsertOperation;
  material: InsertMaterialGroup;
  priority: InsertPriority;
  depthOfCutMm?: number;
  feedMmRev?: number;
}

export interface InsertField {
  code: string;
  labelFa: string;
  reasonFa: string;
}

export interface InsertRecommendation {
  designationCode: string;
  shape: InsertField;
  clearance: InsertField;
  tolerance: InsertField;
  geometry: InsertField;
  size: InsertField;
  thickness: InsertField;
  corner: InsertField;
  gradeAdviceFa: string;
  notesFa: string[];
}

export const operationLabels: Record<InsertOperation, { fa: string; groupFa: string }> = {
  "turning-ext": { fa: "تراشکاری خارجی (رو تراشی)", groupFa: "تراشکاری" },
  "turning-int": { fa: "تراشکاری داخلی (بورینگ)", groupFa: "تراشکاری" },
  facing: { fa: "رویه‌تراشی (Facing)", groupFa: "تراشکاری" },
  grooving: { fa: "شیارزنی / برش (Grooving/Part-off)", groupFa: "تراشکاری" },
  "face-milling": { fa: "فرزکاری صفحه‌تخت", groupFa: "فرزکاری و سوراخ‌کاری" },
  "shoulder-milling": { fa: "فرزکاری شانه/گونیا", groupFa: "فرزکاری و سوراخ‌کاری" },
  drilling: { fa: "سوراخ‌کاری با اینسرت", groupFa: "فرزکاری و سوراخ‌کاری" },
};

export const materialLabels: Record<InsertMaterialGroup, { fa: string; isoGroup: string }> = {
  steel: { fa: "فولاد کربنی/آلیاژی", isoGroup: "P" },
  stainless: { fa: "استیل ضدزنگ", isoGroup: "M" },
  castiron: { fa: "چدن", isoGroup: "K" },
  nonferrous: { fa: "آلومینیوم/غیرآهنی", isoGroup: "N" },
  hardened: { fa: "فولاد سخت‌کاری‌شده", isoGroup: "H" },
  superalloy: { fa: "سوپرآلیاژ/تیتانیوم", isoGroup: "S" },
};

export const priorityLabels: Record<InsertPriority, string> = {
  roughing: "خشن‌کاری (حداکثر براده‌برداری)",
  general: "متعادل / عمومی",
  finishing: "پرداخت‌کاری (بهترین کیفیت سطح)",
};

const shapeByOperationAndPriority: Record<InsertOperation, Record<InsertPriority, string>> = {
  "turning-ext": { roughing: "C", general: "C", finishing: "D" },
  facing: { roughing: "C", general: "C", finishing: "D" },
  "turning-int": { roughing: "C", general: "C", finishing: "V" },
  grooving: { roughing: "L", general: "L", finishing: "L" },
  "face-milling": { roughing: "R", general: "S", finishing: "O" },
  "shoulder-milling": { roughing: "S", general: "S", finishing: "S" },
  drilling: { roughing: "W", general: "W", finishing: "T" },
};

const shapeReasonFa: Record<InsertOperation, string> = {
  "turning-ext": "زاویه نوک ۸۰° لوزی، تعادل بین استحکام لبه و دسترسی به قطعه در تراشکاری خارجی؛ برای پرداخت‌کاری زاویه ۵۵° نوک تیزتر و نیروی برش کمتری می‌دهد.",
  facing: "همانند تراشکاری خارجی — لوزی ۸۰° برای عمومی/خشن‌کاری، ۵۵° برای پرداخت سطح صاف.",
  "turning-int": "در بورینگ باید فضای کافی بین لبه برنده و دیواره سوراخ باقی بماند؛ لوزی ۸۰° برای اکثر قطرها و ۳۵° برای سوراخ‌های کوچک/عمیق مناسب‌تر است.",
  grooving: "شیارزنی و برش معمولاً از اینسرت‌های تیغه‌ای/مستطیلی اختصاصی سازنده استفاده می‌کند؛ کد L صرفاً یک تقریب کلی است — به کاتالوگ اینسرت شیار مراجعه کنید.",
  "face-milling": "برای فرزکاری صفحه، شکل گرد (R) در خشن‌کاری تناژ بالا و مقاومت لبه بیشتری می‌دهد؛ مربع (S) انتخاب عمومی رایج است و هشت‌ضلعی (O) با ۸ لبه برنده اقتصادی‌تر برای پرداخت است.",
  "shoulder-milling": "برای ایجاد دیواره ۹۰° در فرزکاری شانه، شکل مربعی (S) زاویه گونیای دقیق و لبه‌های برنده کافی فراهم می‌کند.",
  drilling: "مته‌های اینسرتی معمولاً از دو اینسرت با شکل سه‌گوش (W) در مرکز و محیط استفاده می‌کنند؛ برای مته‌های تک‌اینسرت کوچک، مثلثی (T) رایج‌تر است.",
};

const clearanceByPriority: Record<InsertPriority, string> = {
  roughing: "N",
  general: "N",
  finishing: "C",
};

const clearanceReasonFa: Record<InsertPriority, string> = {
  roughing:
    "زاویه آزاد ۰° (منفی) لبه برنده ضخیم‌تر و مقاوم‌تری برای ضربه و نیروی برش بالا در خشن‌کاری می‌دهد و امکان استفاده دوطرفه (اقتصادی‌تر) را فراهم می‌کند.",
  general: "زاویه آزاد ۰° (منفی) رایج‌ترین انتخاب برای هلدر و کاربرد عمومی است — همان پایه اینسرت‌های خانواده CNMG.",
  finishing: "زاویه آزاد مثبت ۷° نیروی برش را کاهش می‌دهد و برای قطعات کم‌صلبیت یا دیواره نازک، پرداخت سطح بهتری ایجاد می‌کند.",
};

const toleranceByPriority: Record<InsertPriority, string> = {
  roughing: "M",
  general: "M",
  finishing: "G",
};

const toleranceReasonFa: Record<InsertPriority, string> = {
  roughing: "کلاس M استاندارد و مقرون‌به‌صرفه‌ترین کلاس تلورانس عمومی است؛ در خشن‌کاری اختلاف جزئی ابعاد اینسرت اهمیتی ندارد.",
  general: "کلاس M برای اکثر کاربردهای عمومی کافی و رایج‌ترین انتخاب صنعتی است.",
  finishing: "کلاس G تلورانس ضخامت دقیق‌تری دارد و برای پاس‌های پرداخت‌کاری که ثبات ابعاد اینسرت مهم است مناسب‌تر است.",
};

const geometryByPriority: Record<InsertPriority, string> = {
  roughing: "R",
  general: "G",
  finishing: "F",
};

const geometryReasonFa: Record<InsertPriority, string> = {
  roughing: "هندسه/شکن‌براده سنگین (R) برای تحمل ضربه و براده ضخیم در خشن‌کاری طراحی شده است.",
  general: "هندسه G شکن‌براده متوسط، دقیقاً همان نمونه رایج صنعتی CNMG برای کاربرد عمومی.",
  finishing: "هندسه/شکن‌براده ظریف (F) برای براده نازک و کیفیت سطح بالا در پرداخت‌کاری بهینه شده است.",
};

const defaultDepthByPriorityMm: Record<InsertPriority, number> = { roughing: 3, general: 1.5, finishing: 0.4 };
const defaultFeedByPriorityMm: Record<InsertPriority, number> = { roughing: 0.35, general: 0.2, finishing: 0.08 };

// ISO metric size/thickness/corner suffix (e.g. "CNMG 12 04 08"). Real
// toolholders standardize on a handful of common IC sizes; depth of cut
// mostly matters as an *escalation* trigger (deep cuts need a bigger insert
// for edge-strength/approach-angle clearance), not as a direct multiplier —
// a 1.5mm finishing-ish depth should not shrink the insert to a rare size.
const sizeFloorByPriority: Record<InsertPriority, string> = { roughing: "16", general: "12", finishing: "09" };
const sizeMmByCode: Record<string, number> = { "06": 6.35, "09": 9.525, "12": 12.7, "16": 15.875, "19": 19.05, "25": 25.4 };

function pickSizeCode(depthMm: number, priority: InsertPriority): string {
  // rule of thumb: inscribed circle should be roughly ≥1.8× max depth of cut
  const targetMm = depthMm * 1.8;
  const ordered = insertSizesMetric.map((s) => ({ code: s.code, mm: sizeMmByCode[s.code] }));
  const floorMm = sizeMmByCode[sizeFloorByPriority[priority]];
  const fit = ordered.find((s) => s.mm >= Math.max(targetMm, floorMm));
  return (fit ?? ordered[ordered.length - 1]).code;
}

const thicknessFloorByPriority: Record<InsertPriority, string> = { roughing: "05", general: "04", finishing: "03" };
const thicknessMmByCode: Record<string, number> = { "02": 2.38, "03": 3.18, "04": 4.76, "05": 5.56, "06": 6.35, "07": 7.94 };

function pickThicknessCode(feedMm: number, priority: InsertPriority): string {
  // rule of thumb: thickness scales with feed/edge-strength needs, floored to a practical minimum
  const baseMm = Math.max(feedMm * 9, thicknessMmByCode[thicknessFloorByPriority[priority]]);
  const ordered = insertThicknessesMetric.map((t) => ({ code: t.code, mm: thicknessMmByCode[t.code] }));
  const fit = ordered.find((t) => t.mm >= baseMm);
  return (fit ?? ordered[ordered.length - 1]).code;
}

const cornerByPriority: Record<InsertPriority, string> = { roughing: "16", general: "08", finishing: "04" };
const cornerReasonFa: Record<InsertPriority, string> = {
  roughing: "شعاع نوک بزرگ‌تر (1.6mm) لبه برنده را در برابر ضربه و نیروی خشن‌کاری تقویت می‌کند.",
  general: "شعاع نوک متوسط (0.8mm) — رایج‌ترین انتخاب — تعادل خوبی بین استحکام لبه و کیفیت سطح می‌دهد.",
  finishing: "شعاع نوک کوچک (0.4mm) نیروی رادیال را کاهش داده و از لرزش/چتر در پاس‌های سبک پرداخت‌کاری جلوگیری می‌کند.",
};

const gradeAdviceByMaterial: Record<InsertMaterialGroup, string> = {
  steel: "برای فولاد (گروه P)، گرید کارباید پوشش‌دار CVD/PVD با مقاومت سایشی بالا مناسب است؛ در سرعت برش بالا از کوتینگ TiCN/Al2O3 استفاده کنید.",
  stainless: "استیل ضدزنگ (گروه M) به لبه برنده تیز و مثبت، هندسه ضدجوش (anti-sticking) و کنترل حرارت (خنک‌کاری فشار بالا) نیاز دارد.",
  castiron: "چدن (گروه K) معمولاً بدون پوشش یا با پوشش نازک CVD و لبه ساده (بدون شکن‌براده پیچیده) بهتر جواب می‌دهد.",
  nonferrous: "آلومینیوم/غیرآهنی (گروه N) به گرید کارباید ریزدانه بدون پوشش یا پوشش الماسی (PCD) با لبه بسیار تیز و صیقلی نیاز دارد تا از چسبیدن براده جلوگیری شود.",
  hardened: "فولاد سخت‌کاری‌شده (گروه H، بالای ۴۵ HRC) نیازمند اینسرت CBN یا سرامیکی با سرعت برش کنترل‌شده و صلبیت بالای دستگاه است.",
  superalloy: "سوپرآلیاژ/تیتانیوم (گروه S) به گرید کارباید مقاوم به حرارت، سرعت برش پایین‌تر و خنک‌کاری فراوان (اغلب فشار بالا) نیاز دارد.",
};

export function recommendInsert(input: InsertRecommendationInput): InsertRecommendation {
  const { operation, material, priority } = input;
  const depthMm = input.depthOfCutMm && input.depthOfCutMm > 0 ? input.depthOfCutMm : defaultDepthByPriorityMm[priority];
  const feedMm = input.feedMmRev && input.feedMmRev > 0 ? input.feedMmRev : defaultFeedByPriorityMm[priority];

  const shapeCode = shapeByOperationAndPriority[operation][priority];
  const clearanceCode = clearanceByPriority[priority];
  const toleranceCode = toleranceByPriority[priority];
  const geometryCode = geometryByPriority[priority];
  const sizeCode = pickSizeCode(depthMm, priority);
  const thicknessCode = pickThicknessCode(feedMm, priority);
  const cornerCode = cornerByPriority[priority];

  const shapeOpt = findOption(insertShapes, shapeCode)!;
  const geometryOpt = findOption(insertGeometries, geometryCode)!;
  const sizeOpt = findOption(insertSizesMetric, sizeCode)!;
  const thicknessOpt = findOption(insertThicknessesMetric, thicknessCode)!;
  const cornerOpt = findOption(insertCornersMetric, cornerCode)!;

  const notesFa: string[] = [
    "این ابزار یک راهنمای اولیه بر پایه اصول عمومی ماشین‌کاری است، نه محاسبه دقیق مهندسی. برای انتخاب نهایی گرید کارباید، پوشش و کد دقیق سازنده، حتماً کاتالوگ تولیدکننده ابزار خود را بررسی کنید.",
    "شش رقم پایانی کد (اندازه–ضخامت–شعاع نوک) با استاندارد متریک ISO 1832 نوشته شده‌اند (مثلاً 12 04 08)؛ چهار حرف ابتدایی کد (شکل، زاویه آزاد، تلورانس، هندسه) بین سیستم ANSI و ISO مشترک است.",
  ];
  if (operation === "grooving") {
    notesFa.push("شیارزنی/برش معمولاً خانواده اینسرت اختصاصی (تیغه‌ای) دارد که با این جدول کدگذاری عمومی تطابق کامل ندارد.");
  }
  if (operation === "drilling") {
    notesFa.push("مته‌های اینسرتی اغلب از دو کد اینسرت متفاوت (مرکزی و محیطی) استفاده می‌کنند؛ کد پیشنهادی فقط یک نقطه شروع است.");
  }

  return {
    designationCode: `${shapeCode}${clearanceCode}${toleranceCode}${geometryCode} ${sizeCode}${thicknessCode}${cornerCode}`,
    shape: { code: shapeCode, labelFa: shapeOpt.labelFa, reasonFa: shapeReasonFa[operation] },
    clearance: { code: clearanceCode, labelFa: `زاویه آزاد ${findOption(insertClearances, clearanceCode)?.labelFa ?? ""}`, reasonFa: clearanceReasonFa[priority] },
    tolerance: { code: toleranceCode, labelFa: `کلاس تلورانس ${toleranceCode}`, reasonFa: toleranceReasonFa[priority] },
    geometry: { code: geometryCode, labelFa: geometryOpt.labelFa, reasonFa: geometryReasonFa[priority] },
    size: { code: sizeCode, labelFa: sizeOpt.labelFa, reasonFa: `اندازه پایه رایج برای این اولویت کاری؛ عمق برش ~${depthMm.toFixed(1)}mm نیازمند بزرگ‌تر شدن اینسرت نیست (در عمق‌های بیشتر، اینسرت بزرگ‌تر پیشنهاد می‌شود).` },
    thickness: { code: thicknessCode, labelFa: thicknessOpt.labelFa, reasonFa: `بر اساس پیشروی تقریبی ~${feedMm.toFixed(2)}mm/rev و نیاز به استحکام لبه در این اولویت کاری.` },
    corner: { code: cornerCode, labelFa: cornerOpt.labelFa, reasonFa: cornerReasonFa[priority] },
    gradeAdviceFa: gradeAdviceByMaterial[material],
    notesFa,
  };
}
