// Pure engineering calculators — no UI coupling, no hidden hardcoded results.
// Every function returns the formula it used (Farsi by default, English with lang="en") alongside the number so the UI can render it verbatim.
// The result field names (formulaFa / assumptionsFa) are kept for compatibility; their content follows the `lang` argument.
// 1 kgf = 9.80665 N.

import type { Lang } from "@/lib/lang";

const G = 9.80665;

export interface CalcResult {
  forceKgf: number;
  formulaFa: string;
  assumptionsFa: string[];
}

// ---------------- Punching / Blanking / Piercing ----------------
// F(N) = perimeter(mm) x thickness(mm) x shear strength(N/mm^2)
export function calcPunchingForce(input: {
  shape: "circle" | "rectangle" | "custom-perimeter";
  diameterMm?: number;
  lengthMm?: number;
  widthMm?: number;
  perimeterMm?: number;
  thicknessMm: number;
  shearStrengthMPa: number;
  holeCount: number;
}, lang: Lang = "fa"): CalcResult {
  let perimeter: number;
  if (input.shape === "circle") {
    perimeter = Math.PI * (input.diameterMm ?? 0);
  } else if (input.shape === "rectangle") {
    perimeter = 2 * ((input.lengthMm ?? 0) + (input.widthMm ?? 0));
  } else {
    perimeter = input.perimeterMm ?? 0;
  }
  const forceN = perimeter * input.thicknessMm * input.shearStrengthMPa * input.holeCount;
  return {
    forceKgf: forceN / G,
    formulaFa:
      lang === "fa"
        ? "F = محیط برش (mm) × ضخامت (mm) × استحکام برشی (N/mm²) × تعداد سوراخ"
        : "F = cutting perimeter (mm) × thickness (mm) × shear strength (N/mm²) × number of holes",
    assumptionsFa:
      lang === "fa"
        ? [
            "استحکام برشی معمولاً حدود ۸۰٪ استحکام کششی ماده در نظر گرفته می‌شود (برای فلزات نرم تا متوسط).",
            "این فرمول ضریب ایمنی و اصطکاک قالب را لحاظ نمی‌کند؛ در عمل ۱۰ تا ۲۰٪ حاشیه اطمینان توصیه می‌شود.",
          ]
        : [
            "Shear strength is normally taken as about 80% of the material's tensile strength (for soft to medium-strength metals).",
            "This formula does not include a safety factor or die friction; in practice a 10–20% margin is recommended.",
          ],
  };
}

// ---------------- V-Bending ----------------
// F(kgf) = (K x L x t^2 x Rm) / (W x g), K ≈ 1.33 for standard V-die (air/bottom bending approximation)
export function calcBendingForce(input: {
  bendLengthMm: number;
  thicknessMm: number;
  tensileStrengthMPa: number;
  dieOpeningMm?: number; // defaults to 8x thickness if not given (common V-die rule of thumb)
  kFactor?: number;
}, lang: Lang = "fa"): CalcResult {
  const dieOpening = input.dieOpeningMm ?? input.thicknessMm * 8;
  const k = input.kFactor ?? 1.33;
  const forceN =
    (k * input.bendLengthMm * input.thicknessMm ** 2 * input.tensileStrengthMPa) / dieOpening;
  return {
    forceKgf: forceN / G,
    formulaFa:
      lang === "fa"
        ? "F = (K × طول خم × ضخامت² × استحکام کششی) / (دهانه قالب V × g) ، K≈1.33"
        : "F = (K × bend length × thickness² × tensile strength) / (V-die opening × g), K ≈ 1.33",
    assumptionsFa:
      lang === "fa"
        ? [
            `دهانه قالب V در صورت عدم ورود، ۸ برابر ضخامت ورق فرض شده است (${dieOpening.toFixed(1)}mm).`,
            "این پرس‌ها برک‌پرس نیستند؛ طول خم عملاً به عرض میز دستگاه محدود است.",
          ]
        : [
            `If no V-die opening is entered, 8 × the sheet thickness is assumed (${dieOpening.toFixed(1)}mm).`,
            "These presses are not press brakes; the bend length is practically limited to the machine's table width.",
          ],
  };
}

// ---------------- Press-Fit (interference fit, solid shaft into hub, same-material simplification, DIN 7190 style) ----------------
export function calcPressFitForce(input: {
  shaftDiameterMm: number;
  hubOuterDiameterMm: number;
  diametralInterferenceMm: number;
  contactLengthMm: number;
  youngsModulusMPa?: number; // default: steel 210 GPa
  frictionCoefficient?: number; // default 0.12 (dry/lightly lubricated steel-steel)
}, lang: Lang = "fa"): CalcResult {
  const E = input.youngsModulusMPa ?? 210000;
  const mu = input.frictionCoefficient ?? 0.12;
  const d = input.shaftDiameterMm;
  const Do = input.hubOuterDiameterMm;
  const i = input.diametralInterferenceMm;
  const contactPressureMPa = ((E * i) / d) * ((Do ** 2 - d ** 2) / (2 * Do ** 2));
  const forceN = mu * contactPressureMPa * Math.PI * d * input.contactLengthMm;
  return {
    forceKgf: forceN / G,
    formulaFa:
      lang === "fa"
        ? "p = (E×i/d) × (Do²−d²)/(2×Do²) ؛ سپس F = μ × p × π × d × L (فرمول ساده‌شده تداخل قطر، شفت توپر، هم‌جنس با یاتاقان)"
        : "p = (E×i/d) × (Do²−d²)/(2×Do²); then F = μ × p × π × d × L (simplified diametral-interference formula, solid shaft, same material as the hub)",
    assumptionsFa:
      lang === "fa"
        ? [
            `مدول یانگ فرض‌شده: ${E.toLocaleString("fa-IR")} N/mm² (فولاد در صورت عدم ورود مقدار دیگر).`,
            `ضریب اصطکاک فرض‌شده: ${mu} (تماس خشک تا کمی روان‌کاری‌شده فولاد-فولاد).`,
            "این یک تخمین مهندسی اولیه است؛ برای اجرای دقیق، آزمایش عملی یا محاسبه کامل با ضریب پواسون توصیه می‌شود.",
          ]
        : [
            `Assumed Young's modulus: ${E.toLocaleString("en-US")} N/mm² (steel, if no other value is entered).`,
            `Assumed friction coefficient: ${mu} (dry to lightly lubricated steel-on-steel contact).`,
            "This is a preliminary engineering estimate; for an exact design, practical testing or a full calculation including Poisson's ratio is recommended.",
          ],
  };
}

// ---------------- Riveting (cold heading / upsetting, rule-of-thumb) ----------------
// Upsetting a rivet shank requires exceeding tensile strength substantially due to triaxial confinement.
export function calcRivetingForce(input: {
  rivetDiameterMm: number;
  tensileStrengthMPa: number;
  upsetFactor?: number; // default 3x — common rule-of-thumb multiplier for cold-heading confinement
}, lang: Lang = "fa"): CalcResult {
  const factor = input.upsetFactor ?? 3;
  const areaMm2 = (Math.PI / 4) * input.rivetDiameterMm ** 2;
  const forceN = areaMm2 * input.tensileStrengthMPa * factor;
  return {
    forceKgf: forceN / G,
    formulaFa:
      lang === "fa"
        ? "F = (π/4 × قطر پرچ²) × استحکام کششی × ضریب فرم‌دهی سرد (پیش‌فرض ۳×)"
        : "F = (π/4 × rivet diameter²) × tensile strength × cold-forming factor (default 3×)",
    assumptionsFa:
      lang === "fa"
        ? [
            "ضریب ۳× یک قاعده سرانگشتی رایج برای فرم‌دهی سرد (upsetting) به دلیل مهار سه‌محوره ماده است؛ بسته به هندسه سر پرچ می‌تواند ۲ تا ۴ برابر باشد.",
          ]
        : [
            "The 3× factor is a common rule of thumb for cold upsetting because of the triaxial confinement of the material; depending on the rivet-head geometry it can range from 2× to 4×.",
          ],
  };
}

// ---------------- Coining / Embossing ----------------
// F = projected area x coining pressure (typically several multiples of tensile strength for shallow relief)
export function calcCoiningForce(input: {
  projectedAreaMm2: number;
  tensileStrengthMPa: number;
  pressureFactor?: number; // default 5x tensile strength — typical for shallow coining/marking
}, lang: Lang = "fa"): CalcResult {
  const factor = input.pressureFactor ?? 5;
  const forceN = input.projectedAreaMm2 * input.tensileStrengthMPa * factor;
  return {
    forceKgf: forceN / G,
    formulaFa:
      lang === "fa"
        ? "F = سطح تصویرشده نقش (mm²) × استحکام کششی (N/mm²) × ضریب فشار کوینینگ (پیش‌فرض ۵×)"
        : "F = projected area of the impression (mm²) × tensile strength (N/mm²) × coining pressure factor (default 5×)",
    assumptionsFa:
      lang === "fa"
        ? [
            "برای امباس یا مارکینگ کم‌عمق ضریب پایین‌تر (۲ تا ۳×) و برای کوینینگ عمیق با جزئیات ریز ضریب بالاتر (۵ تا ۸×) واقعی‌تر است.",
          ]
        : [
            "A lower factor (2–3×) is more realistic for shallow embossing or marking, and a higher factor (5–8×) for deep coining with fine detail.",
          ],
  };
}
