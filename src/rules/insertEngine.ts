// Guided recommendation engine for carbide insert selection, built on top
// of the ANSI designation tables in @/data/insertDesignation. This is a
// simplified decision-table (not a physics calculation) grounded in common
// machining practice: it points to a sensible starting designation code —
// final grade/coating choice should still be checked against a tool
// manufacturer's catalog (see `notes`).
//
// All user-facing strings are returned in the requested language (default
// Persian). This module is pure (no React) so it only imports from @/lib/lang.

import {
  findOption,
  insertClearances,
  insertCornersMetric,
  insertGeometries,
  insertShapes,
  insertSizesMetric,
  insertThicknessesMetric,
  optionLabel,
} from "@/data/insertDesignation";
import type { Lang } from "@/lib/lang";

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

// `label` / `reason` / `gradeAdvice` / `notes` are already in the language
// passed to recommendInsert().
export interface InsertField {
  code: string;
  label: string;
  reason: string;
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
  gradeAdvice: string;
  notes: string[];
}

interface Bi {
  fa: string;
  en: string;
}

export const operationLabels: Record<InsertOperation, { fa: string; en: string; groupFa: string; groupEn: string }> = {
  "turning-ext": { fa: "تراشکاری خارجی (رو تراشی)", en: "External turning", groupFa: "تراشکاری", groupEn: "Turning" },
  "turning-int": { fa: "تراشکاری داخلی (بورینگ)", en: "Internal turning (boring)", groupFa: "تراشکاری", groupEn: "Turning" },
  facing: { fa: "رویه‌تراشی (Facing)", en: "Facing", groupFa: "تراشکاری", groupEn: "Turning" },
  grooving: { fa: "شیارزنی / برش (Grooving/Part-off)", en: "Grooving / parting-off", groupFa: "تراشکاری", groupEn: "Turning" },
  "face-milling": { fa: "فرزکاری صفحه‌تخت", en: "Face milling", groupFa: "فرزکاری و سوراخ‌کاری", groupEn: "Milling and drilling" },
  "shoulder-milling": { fa: "فرزکاری شانه/گونیا", en: "Shoulder milling", groupFa: "فرزکاری و سوراخ‌کاری", groupEn: "Milling and drilling" },
  drilling: { fa: "سوراخ‌کاری با اینسرت", en: "Indexable-insert drilling", groupFa: "فرزکاری و سوراخ‌کاری", groupEn: "Milling and drilling" },
};

export const materialLabels: Record<InsertMaterialGroup, { fa: string; en: string; isoGroup: string }> = {
  steel: { fa: "فولاد کربنی/آلیاژی", en: "Carbon / alloy steel", isoGroup: "P" },
  stainless: { fa: "استیل ضدزنگ", en: "Stainless steel", isoGroup: "M" },
  castiron: { fa: "چدن", en: "Cast iron", isoGroup: "K" },
  nonferrous: { fa: "آلومینیوم/غیرآهنی", en: "Aluminium / non-ferrous", isoGroup: "N" },
  hardened: { fa: "فولاد سخت‌کاری‌شده", en: "Hardened steel", isoGroup: "H" },
  superalloy: { fa: "سوپرآلیاژ/تیتانیوم", en: "Superalloy / titanium", isoGroup: "S" },
};

export const priorityLabels: Record<InsertPriority, string> = {
  roughing: "خشن‌کاری (حداکثر براده‌برداری)",
  general: "متعادل / عمومی",
  finishing: "پرداخت‌کاری (بهترین کیفیت سطح)",
};

export const priorityLabelsEn: Record<InsertPriority, string> = {
  roughing: "Roughing (maximum stock removal)",
  general: "Balanced / general purpose",
  finishing: "Finishing (best surface quality)",
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

const shapeReason: Record<InsertOperation, Bi> = {
  "turning-ext": {
    fa: "زاویه نوک ۸۰° لوزی، تعادل بین استحکام لبه و دسترسی به قطعه در تراشکاری خارجی؛ برای پرداخت‌کاری زاویه ۵۵° نوک تیزتر و نیروی برش کمتری می‌دهد.",
    en: "The 80° rhombic shape balances edge strength and workpiece access in external turning; for finishing, the 55° shape gives a sharper nose and lower cutting forces.",
  },
  facing: {
    fa: "همانند تراشکاری خارجی — لوزی ۸۰° برای عمومی/خشن‌کاری، ۵۵° برای پرداخت سطح صاف.",
    en: "Same as external turning — 80° rhombic for general/roughing, 55° for finishing flat surfaces.",
  },
  "turning-int": {
    fa: "در بورینگ باید فضای کافی بین لبه برنده و دیواره سوراخ باقی بماند؛ لوزی ۸۰° برای اکثر قطرها و ۳۵° برای سوراخ‌های کوچک/عمیق مناسب‌تر است.",
    en: "In boring, enough clearance must remain between the cutting edge and the bore wall; the 80° rhombic suits most diameters, while the 35° rhombic is better for small or deep bores.",
  },
  grooving: {
    fa: "شیارزنی و برش معمولاً از اینسرت‌های تیغه‌ای/مستطیلی اختصاصی سازنده استفاده می‌کند؛ کد L صرفاً یک تقریب کلی است — به کاتالوگ اینسرت شیار مراجعه کنید.",
    en: "Grooving and parting-off normally use the manufacturer's dedicated blade-type/rectangular inserts; code L is only a rough approximation — refer to the grooving insert catalogue.",
  },
  "face-milling": {
    fa: "برای فرزکاری صفحه، شکل گرد (R) در خشن‌کاری تناژ بالا و مقاومت لبه بیشتری می‌دهد؛ مربع (S) انتخاب عمومی رایج است و هشت‌ضلعی (O) با ۸ لبه برنده اقتصادی‌تر برای پرداخت است.",
    en: "For face milling, the round shape (R) gives high stock removal in roughing and greater edge strength; the square (S) is the usual general-purpose choice, and the octagon (O) with 8 cutting edges is more economical for finishing.",
  },
  "shoulder-milling": {
    fa: "برای ایجاد دیواره ۹۰° در فرزکاری شانه، شکل مربعی (S) زاویه گونیای دقیق و لبه‌های برنده کافی فراهم می‌کند.",
    en: "To produce a 90° wall in shoulder milling, the square shape (S) provides an accurate 90° corner and enough cutting edges.",
  },
  drilling: {
    fa: "مته‌های اینسرتی معمولاً از دو اینسرت با شکل سه‌گوش (W) در مرکز و محیط استفاده می‌کنند؛ برای مته‌های تک‌اینسرت کوچک، مثلثی (T) رایج‌تر است.",
    en: "Indexable-insert drills usually use two trigon-shaped (W) inserts, one central and one peripheral; for small single-insert drills, the triangle (T) is more common.",
  },
};

// Relief/clearance angle depends on workpiece material at least as much as
// on priority: cast iron & hardened steel want a rigid negative (N) edge
// regardless of pass; stainless wants a sharp positive edge to avoid
// work-hardening; aluminum wants an even sharper edge to shed chips cleanly.
function pickClearanceCode(operation: InsertOperation, material: InsertMaterialGroup, priority: InsertPriority): string {
  if (material === "castiron" || material === "hardened") return "N";
  if (material === "nonferrous") return priority === "finishing" ? "E" : "P";
  if (material === "stainless") return priority === "finishing" ? "P" : "C";
  let code = priority === "finishing" ? "C" : "N";
  if (operation === "turning-int" && code === "N") code = "C"; // boring needs extra clearance for chip evacuation
  return code;
}

function clearanceReason(code: string, operation: InsertOperation, material: InsertMaterialGroup, lang: Lang): string {
  const pick = (fa: string, en: string) => (lang === "en" ? en : fa);
  if (material === "castiron" || material === "hardened")
    return pick(
      "برای چدن/فولاد سخت‌کاری‌شده، زاویه آزاد صفر (N) لبه برنده مقاوم‌تری در برابر سایش و ضربه فراهم می‌کند.",
      "For cast iron / hardened steel, a 0° relief angle (N) gives a cutting edge that is more resistant to wear and impact."
    );
  if (material === "nonferrous")
    return code === "E"
      ? pick(
          "زاویه آزاد بزرگ (E≈20°) برای پرداخت‌کاری آلومینیوم، برش تیزتری می‌دهد و از چسبیدن براده به لبه جلوگیری می‌کند.",
          "A large relief angle (E≈20°) for finishing aluminium gives a sharper cut and prevents chips from sticking to the edge."
        )
      : pick(
          "زاویه آزاد مثبت (P≈11°) برای آلیاژهای آلومینیوم/غیرآهنی نیروی برش را کاهش داده و از چسبیدن براده جلوگیری می‌کند.",
          "A positive relief angle (P≈11°) for aluminium / non-ferrous alloys lowers the cutting force and prevents chip sticking."
        );
  if (material === "stainless")
    return code === "P"
      ? pick(
          "زاویه آزاد مثبت بزرگ‌تر (P≈11°) برای پرداخت‌کاری استیل ضدزنگ، نیروی برش و گرمای موضعی را کاهش می‌دهد.",
          "A larger positive relief angle (P≈11°) for finishing stainless steel reduces the cutting force and localized heat."
        )
      : pick(
          "زاویه آزاد مثبت (C≈7°) لبه تیزتری برای استیل ضدزنگ فراهم می‌کند و از سخت‌شدگی سطحی (work hardening) جلوگیری می‌کند.",
          "A positive relief angle (C≈7°) gives stainless steel a sharper edge and helps avoid work hardening."
        );
  if (operation === "turning-int" && code === "C")
    return pick(
      "در بورینگ، زاویه آزاد مثبت (C≈7°) فضای بیشتری برای خروج براده از داخل سوراخ فراهم می‌کند.",
      "In boring, a positive relief angle (C≈7°) provides more room for chips to leave the bore."
    );
  return code === "N"
    ? pick(
        "زاویه آزاد صفر (منفی) لبه برنده ضخیم‌تر و مقاوم‌تری برای نیروی برش بالا در خشن‌کاری/عمومی می‌دهد و امکان استفاده دوطرفه (اقتصادی‌تر) را فراهم می‌کند.",
        "A 0° (negative-type) relief angle gives a thicker, stronger cutting edge for high cutting forces in roughing/general work and allows double-sided (more economical) use."
      )
    : pick(
        "زاویه آزاد مثبت (C≈7°) نیروی برش را کاهش می‌دهد و برای پرداخت‌کاری سطح بهتری ایجاد می‌کند.",
        "A positive relief angle (C≈7°) reduces the cutting force and produces a better surface finish in finishing."
      );
}

// Per common turning practice: G (precision) for finishing / non-ferrous /
// hardened-steel finishing; M (general → heavy roughing) as the versatile
// default; U (loosest) specifically for roughing.
const toleranceByPriority: Record<InsertPriority, string> = {
  roughing: "U",
  general: "M",
  finishing: "G",
};

const toleranceReason: Record<InsertPriority, Bi> = {
  roughing: {
    fa: "کلاس U (بازترین تلورانس) برای خشن‌کاری کافی و مقرون‌به‌صرفه‌ترین انتخاب است؛ اختلاف جزئی ابعاد اینسرت در این مرحله اهمیتی ندارد.",
    en: "Class U (loosest tolerance) is sufficient and the most economical choice for roughing; small variations in insert dimensions do not matter at this stage.",
  },
  general: {
    fa: "کلاس M طیف وسیعی از عمومی تا خشن‌کاری سنگین را پوشش می‌دهد و رایج‌ترین انتخاب صنعتی برای کاربرد عمومی است.",
    en: "Class M covers everything from general-purpose to heavy roughing and is the most common industrial choice for general use.",
  },
  finishing: {
    fa: "کلاس G (دقیق) برای پرداخت‌کاری، فلزات غیرآهنی و پرداخت فولاد سخت‌کاری‌شده مناسب است — ثبات ابعاد اینسرت در این پاس‌ها اهمیت دارد.",
    en: "Class G (precision) suits finishing, non-ferrous metals and finishing hardened steel — dimensional consistency of the insert matters in these passes.",
  },
};

const geometryByPriority: Record<InsertPriority, string> = {
  roughing: "R",
  general: "G",
  finishing: "F",
};

const geometryReason: Record<InsertPriority, Bi> = {
  roughing: {
    fa: "هندسه/شکن‌براده سنگین (R) برای تحمل ضربه و براده ضخیم در خشن‌کاری طراحی شده است.",
    en: "The heavy-duty geometry/chipbreaker (R) is designed to withstand impact and thick chips in roughing.",
  },
  general: {
    fa: "هندسه G شکن‌براده متوسط، دقیقاً همان نمونه رایج صنعتی CNMG برای کاربرد عمومی.",
    en: "Geometry G has a medium chipbreaker — the classic industrial CNMG type for general use.",
  },
  finishing: {
    fa: "هندسه/شکن‌براده ظریف (F) برای براده نازک و کیفیت سطح بالا در پرداخت‌کاری بهینه شده است.",
    en: "The fine geometry/chipbreaker (F) is optimized for thin chips and high surface quality in finishing.",
  },
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

// Nose radius rule: rε ≥ 1.25 × feed (so max feed never exceeds ~80% of the
// radius — beyond that, chip control and edge strength both suffer). This is
// a *minimum*; practical roughing/general/finishing defaults sit well above
// it for typical feeds and only escalate when the entered feed demands it.
const cornerFloorByPriority: Record<InsertPriority, string> = { roughing: "16", general: "08", finishing: "04" };
const cornerMmByCode: Record<string, number> = { "02": 0.2, "04": 0.4, "08": 0.8, "12": 1.2, "16": 1.6, "24": 2.4, "32": 3.2 };

function pickCornerCode(feedMm: number, priority: InsertPriority): string {
  const minByFormula = 1.25 * feedMm;
  const floorMm = cornerMmByCode[cornerFloorByPriority[priority]];
  const target = Math.max(minByFormula, floorMm);
  const ordered = insertCornersMetric.filter((c) => c.code !== "00").map((c) => ({ code: c.code, mm: cornerMmByCode[c.code] }));
  const fit = ordered.find((c) => c.mm >= target);
  return (fit ?? ordered[ordered.length - 1]).code;
}

function cornerReason(code: string, feedMm: number, priority: InsertPriority, lang: Lang): string {
  const radiusMm = cornerMmByCode[code];
  const minByFormula = 1.25 * feedMm;
  if (minByFormula > cornerMmByCode[cornerFloorByPriority[priority]]) {
    return lang === "en"
      ? `Per the rule rε ≥ 1.25 × feed (chip control / edge strength), a feed of ~${feedMm.toFixed(2)}mm/rev requires a minimum nose radius of ${minByFormula.toFixed(2)}mm.`
      : `طبق قاعده rε ≥ ۱.۲۵×پیشروی (کنترل براده/استحکام لبه)، با پیشروی ~${feedMm.toFixed(2)}mm/rev حداقل شعاع نوک ${minByFormula.toFixed(
          2
        )}mm لازم است.`;
  }
  return lang === "en"
    ? `A nose radius of ${radiusMm}mm is typical for this priority and clearly satisfies the rule rε ≥ 1.25 × feed at the entered feed.`
    : `شعاع نوک ${radiusMm}mm، مقدار متداول برای این اولویت کاری و به‌وضوح قاعده rε ≥ ۱.۲۵×پیشروی را با پیشروی وارد‌شده رعایت می‌کند.`;
}

const gradeAdviceByMaterial: Record<InsertMaterialGroup, Bi> = {
  steel: {
    fa: "برای فولاد (گروه P)، گرید کارباید پوشش‌دار CVD/PVD با مقاومت سایشی بالا مناسب است؛ در سرعت برش بالا از کوتینگ TiCN/Al2O3 استفاده کنید.",
    en: "For steel (group P), a CVD/PVD-coated carbide grade with high wear resistance is suitable; at high cutting speeds use a TiCN/Al2O3 coating.",
  },
  stainless: {
    fa: "استیل ضدزنگ (گروه M) به لبه برنده تیز و مثبت، هندسه ضدجوش (anti-sticking) و کنترل حرارت (خنک‌کاری فشار بالا) نیاز دارد.",
    en: "Stainless steel (group M) needs a sharp, positive cutting edge, an anti-sticking geometry and heat control (high-pressure coolant).",
  },
  castiron: {
    fa: "چدن (گروه K) معمولاً بدون پوشش یا با پوشش نازک CVD و لبه ساده (بدون شکن‌براده پیچیده) بهتر جواب می‌دهد.",
    en: "Cast iron (group K) usually works best with an uncoated or thin CVD-coated grade and a simple edge (no complex chipbreaker).",
  },
  nonferrous: {
    fa: "آلومینیوم/غیرآهنی (گروه N) به گرید کارباید ریزدانه بدون پوشش یا پوشش الماسی (PCD) با لبه بسیار تیز و صیقلی نیاز دارد تا از چسبیدن براده جلوگیری شود.",
    en: "Aluminium / non-ferrous (group N) needs a fine-grain uncoated carbide grade or a diamond-coated/PCD insert with a very sharp, polished edge to prevent chip adhesion.",
  },
  hardened: {
    fa: "فولاد سخت‌کاری‌شده (گروه H، بالای ۴۵ HRC) نیازمند اینسرت CBN یا سرامیکی با سرعت برش کنترل‌شده و صلبیت بالای دستگاه است.",
    en: "Hardened steel (group H, above 45 HRC) requires a CBN or ceramic insert, a controlled cutting speed and high machine rigidity.",
  },
  superalloy: {
    fa: "سوپرآلیاژ/تیتانیوم (گروه S) به گرید کارباید مقاوم به حرارت، سرعت برش پایین‌تر و خنک‌کاری فراوان (اغلب فشار بالا) نیاز دارد.",
    en: "Superalloys / titanium (group S) need a heat-resistant carbide grade, a lower cutting speed and plenty of coolant (often high-pressure).",
  },
};

export function recommendInsert(input: InsertRecommendationInput, lang: Lang = "fa"): InsertRecommendation {
  const en = lang === "en";
  const { operation, material, priority } = input;
  const depthMm = input.depthOfCutMm && input.depthOfCutMm > 0 ? input.depthOfCutMm : defaultDepthByPriorityMm[priority];
  const feedMm = input.feedMmRev && input.feedMmRev > 0 ? input.feedMmRev : defaultFeedByPriorityMm[priority];

  const shapeCode = shapeByOperationAndPriority[operation][priority];
  const clearanceCode = pickClearanceCode(operation, material, priority);
  const toleranceCode = toleranceByPriority[priority];
  const geometryCode = geometryByPriority[priority];
  const sizeCode = pickSizeCode(depthMm, priority);
  const thicknessCode = pickThicknessCode(feedMm, priority);
  const cornerCode = pickCornerCode(feedMm, priority);

  const shapeOpt = findOption(insertShapes, shapeCode)!;
  const geometryOpt = findOption(insertGeometries, geometryCode)!;
  const sizeOpt = findOption(insertSizesMetric, sizeCode)!;
  const thicknessOpt = findOption(insertThicknessesMetric, thicknessCode)!;
  const cornerOpt = findOption(insertCornersMetric, cornerCode)!;
  const clearanceOpt = findOption(insertClearances, clearanceCode);

  const notes: string[] = [
    en
      ? "This tool is a first-pass guide based on general machining principles, not a precise engineering calculation. For the final choice of carbide grade, coating and exact manufacturer code, always check your tool manufacturer's catalogue."
      : "این ابزار یک راهنمای اولیه بر پایه اصول عمومی ماشین‌کاری است، نه محاسبه دقیق مهندسی. برای انتخاب نهایی گرید کارباید، پوشش و کد دقیق سازنده، حتماً کاتالوگ تولیدکننده ابزار خود را بررسی کنید.",
    en
      ? "The last six digits (size–thickness–nose radius) follow the ISO 1832 metric standard (e.g. 12 04 08); the first four letters of the code (shape, relief angle, tolerance, geometry) are common to the ANSI and ISO systems."
      : "شش رقم پایانی کد (اندازه–ضخامت–شعاع نوک) با استاندارد متریک ISO 1832 نوشته شده‌اند (مثلاً 12 04 08)؛ چهار حرف ابتدایی کد (شکل، زاویه آزاد، تلورانس، هندسه) بین سیستم ANSI و ISO مشترک است.",
    en
      ? "Manufacturers usually append a proprietary suffix (such as “-MS” or “-PM”) after this ten-character code to identify their exact chipbreaker type — look for the closest equivalent in the manufacturer's catalogue."
      : "سازندگان معمولاً یک پسوند اختصاصی (مثل «-MS» یا «-PM») بعد از این کد ده‌رقمی برای مشخص‌کردن نوع دقیق شکن‌براده خود اضافه می‌کنند — در کاتالوگ سازنده به‌دنبال نزدیک‌ترین معادل بگردید.",
  ];
  if (operation === "grooving") {
    notes.push(
      en
        ? "Grooving/parting-off usually has its own dedicated (blade-type) insert family that does not fully match this general designation system."
        : "شیارزنی/برش معمولاً خانواده اینسرت اختصاصی (تیغه‌ای) دارد که با این جدول کدگذاری عمومی تطابق کامل ندارد."
    );
  }
  if (operation === "drilling") {
    notes.push(
      en
        ? "Indexable-insert drills often use two different insert codes (central and peripheral); the suggested code is only a starting point."
        : "مته‌های اینسرتی اغلب از دو کد اینسرت متفاوت (مرکزی و محیطی) استفاده می‌کنند؛ کد پیشنهادی فقط یک نقطه شروع است."
    );
  }
  const grooveFamilyLetter = priority === "roughing" ? "R" : priority === "finishing" ? "F" : "M";
  const familyCode = `${materialLabels[material].isoGroup}${grooveFamilyLetter}`;
  notes.push(
    en
      ? `In commercial catalogues, the chipbreaker family is often named by combining the ISO material group with the process type — for this selection look for something like “${familyCode}” (e.g. PM for general steel, KF for finishing cast iron).`
      : `در کاتالوگ‌های تجاری، خانواده شکن‌براده اغلب با ترکیب گروه ماده ISO و نوع فرآیند نام‌گذاری می‌شود — برای این انتخاب دنبال چیزی شبیه «${familyCode}» بگردید (مثلاً PM برای فولاد عمومی، KF برای پرداخت چدن).`
  );

  return {
    designationCode: `${shapeCode}${clearanceCode}${toleranceCode}${geometryCode} ${sizeCode}${thicknessCode}${cornerCode}`,
    shape: { code: shapeCode, label: optionLabel(shapeOpt, lang), reason: shapeReason[operation][lang] },
    clearance: {
      code: clearanceCode,
      label: `${en ? "Relief angle" : "زاویه آزاد"} ${clearanceOpt ? optionLabel(clearanceOpt, lang) : ""}`,
      reason: clearanceReason(clearanceCode, operation, material, lang),
    },
    tolerance: {
      code: toleranceCode,
      label: en ? `Tolerance class ${toleranceCode}` : `کلاس تلورانس ${toleranceCode}`,
      reason: toleranceReason[priority][lang],
    },
    geometry: { code: geometryCode, label: optionLabel(geometryOpt, lang), reason: geometryReason[priority][lang] },
    size: {
      code: sizeCode,
      label: optionLabel(sizeOpt, lang),
      reason: en
        ? `Common base size for this priority; a depth of cut of ~${depthMm.toFixed(1)}mm does not require a larger insert (a larger insert is suggested at greater depths).`
        : `اندازه پایه رایج برای این اولویت کاری؛ عمق برش ~${depthMm.toFixed(1)}mm نیازمند بزرگ‌تر شدن اینسرت نیست (در عمق‌های بیشتر، اینسرت بزرگ‌تر پیشنهاد می‌شود).`,
    },
    thickness: {
      code: thicknessCode,
      label: optionLabel(thicknessOpt, lang),
      reason: en
        ? `Based on the approximate feed of ~${feedMm.toFixed(2)}mm/rev and the edge strength required for this priority.`
        : `بر اساس پیشروی تقریبی ~${feedMm.toFixed(2)}mm/rev و نیاز به استحکام لبه در این اولویت کاری.`,
    },
    corner: { code: cornerCode, label: optionLabel(cornerOpt, lang), reason: cornerReason(cornerCode, feedMm, priority, lang) },
    gradeAdvice: gradeAdviceByMaterial[material][lang],
    notes,
  };
}

const materialTip: Record<InsertMaterialGroup, Bi> = {
  steel: {
    fa: "برای فولاد عمومی، سرعت برش و پیشروی استاندارد کاتالوگ گرید انتخابی را مبنا قرار دهید؛ نیازی به تمهیدات ویژه نیست.",
    en: "For general steel, use the standard cutting speed and feed from the catalogue of the selected grade; no special measures are needed.",
  },
  stainless: {
    fa: "استیل ضدزنگ مستعد سخت‌شدگی سطحی (work hardening) است — از خنک‌کاری کافی/فشار بالا و پیشروی پیوسته (بدون توقف روی قطعه) استفاده کنید.",
    en: "Stainless steel is prone to work hardening — use adequate or high-pressure coolant and a continuous feed (no dwelling on the workpiece).",
  },
  castiron: {
    fa: "چدن معمولاً براده پودری تولید می‌کند؛ اغلب می‌توان بدون خنک‌کاری (خشک) کار کرد، اما جمع‌آوری گرد و غبار را در نظر بگیرید.",
    en: "Cast iron usually produces powdery chips; it can often be machined dry (without coolant), but plan for dust extraction.",
  },
  nonferrous: {
    fa: "برای آلومینیوم، سرعت برش بالا و لبه بسیار تیز کلیدی است تا از تشکیل لبه انباشته (BUE) روی ابزار جلوگیری شود.",
    en: "For aluminium, a high cutting speed and a very sharp edge are key to preventing built-up edge (BUE) on the tool.",
  },
  hardened: {
    fa: "فولاد سخت‌کاری‌شده (بالای ۴۵ HRC) نیازمند صلبیت بسیار بالای دستگاه و هلدر است؛ کوچک‌ترین لرزش عمر ابزار را به‌شدت کاهش می‌دهد.",
    en: "Hardened steel (above 45 HRC) demands very high machine and toolholder rigidity; even slight vibration drastically reduces tool life.",
  },
  superalloy: {
    fa: "سوپرآلیاژ/تیتانیوم گرمای برش را در نوک ابزار متمرکز می‌کند — سرعت برش را پایین نگه دارید و خنک‌کاری فراوان و پیوسته فراهم کنید.",
    en: "Superalloys / titanium concentrate cutting heat at the tool tip — keep the cutting speed low and provide abundant, continuous coolant.",
  },
};

const operationTip: Partial<Record<InsertOperation, Bi>> = {
  "turning-int": {
    fa: "در بورینگ، میله ابزار (boring bar) را تا حد امکان کوتاه و ضخیم انتخاب کنید — طول آزاد زیاد اصلی‌ترین عامل لرزش است.",
    en: "In boring, choose the shortest, stiffest boring bar possible — excessive overhang is the main cause of chatter.",
  },
  grooving: {
    fa: "عرض اینسرت شیار باید دقیقاً برابر عرض شیار طراحی‌شده باشد؛ کد پیشنهادی این ابزار برای شکل کلی است، نه عرض دقیق شیار.",
    en: "The grooving insert width must exactly match the designed groove width; the code suggested by this tool covers the general shape, not the exact groove width.",
  },
  drilling: {
    fa: "برای مته اینسرتی، پیشروی ورودی (ورود به سطح) را کمتر از پیشروی پایدار شروع کنید تا از شکست لبه در لحظه تماس جلوگیری شود.",
    en: "For an indexable-insert drill, start with an entry feed lower than the steady-state feed to avoid edge chipping at the moment of contact.",
  },
  "face-milling": {
    fa: "در فرزکاری صفحه، محور فرز را کمی (۱۰ تا ۱۵ میلی‌متر) نسبت به مرکز قطعه آفست کنید تا از برخورد هم‌زمان چند لبه و لرزش جلوگیری شود.",
    en: "In face milling, offset the cutter axis slightly (10 to 15 mm) from the workpiece centre to avoid several edges engaging at once and to reduce vibration.",
  },
};

/** Live, low-cost contextual tips shown alongside the form — not part of the designation code itself. */
export function getSmartTips(input: InsertRecommendationInput, lang: Lang = "fa"): string[] {
  const en = lang === "en";
  const tips: string[] = [materialTip[input.material][lang]];
  const opTip = operationTip[input.operation];
  if (opTip) tips.push(opTip[lang]);

  if (input.priority === "finishing" && input.feedMmRev && input.feedMmRev > 0.15) {
    tips.push(
      en
        ? "The entered feed is relatively high for finishing — the desired surface finish may not be achieved; consider a feed below 0.15mm/rev."
        : "پیشروی واردشده برای پرداخت‌کاری نسبتاً بالاست — ممکن است کیفیت سطح مطلوب حاصل نشود؛ پیشروی کمتر از ۰.۱۵mm/rev را در نظر بگیرید."
    );
  }
  if (input.priority === "roughing" && input.depthOfCutMm !== undefined && input.depthOfCutMm > 0 && input.depthOfCutMm < 1) {
    tips.push(
      en
        ? "The entered depth of cut looks low for roughing — if machine power and rigidity allow, a deeper cut increases productivity."
        : "عمق برش واردشده برای خشن‌کاری کم به نظر می‌رسد — در صورت اجازه دستگاه/قدرت، عمق بیشتر بهره‌وری را بالا می‌برد."
    );
  }
  return tips;
}
