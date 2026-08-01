// Pure engineering calculators — no UI coupling, no hidden hardcoded results.
// Every function returns the formula it used (Farsi) alongside the number so the UI can render it verbatim.
// 1 kgf = 9.80665 N.

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
}): CalcResult {
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
    formulaFa: "F = محیط برش (mm) × ضخامت (mm) × استحکام برشی (N/mm²) × تعداد سوراخ",
    assumptionsFa: [
      "استحکام برشی معمولاً حدود ۸۰٪ استحکام کششی ماده در نظر گرفته می‌شود (برای فلزات نرم تا متوسط).",
      "این فرمول ضریب ایمنی و اصطکاک قالب را لحاظ نمی‌کند؛ در عمل ۱۰ تا ۲۰٪ حاشیه اطمینان توصیه می‌شود.",
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
}): CalcResult {
  const dieOpening = input.dieOpeningMm ?? input.thicknessMm * 8;
  const k = input.kFactor ?? 1.33;
  const forceN =
    (k * input.bendLengthMm * input.thicknessMm ** 2 * input.tensileStrengthMPa) / dieOpening;
  return {
    forceKgf: forceN / G,
    formulaFa: "F = (K × طول خم × ضخامت² × استحکام کششی) / (دهانه قالب V × g) ، K≈1.33",
    assumptionsFa: [
      `دهانه قالب V در صورت عدم ورود، ۸ برابر ضخامت ورق فرض شده است (${dieOpening.toFixed(1)}mm).`,
      "این پرس‌ها برک‌پرس نیستند؛ طول خم عملاً به عرض میز دستگاه محدود است.",
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
}): CalcResult {
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
      "p = (E×i/d) × (Do²−d²)/(2×Do²) ؛ سپس F = μ × p × π × d × L (فرمول ساده‌شده تداخل قطر، شفت توپر، هم‌جنس با یاتاقان)",
    assumptionsFa: [
      `مدول یانگ فرض‌شده: ${E.toLocaleString("fa-IR")} N/mm² (فولاد در صورت عدم ورود مقدار دیگر).`,
      `ضریب اصطکاک فرض‌شده: ${mu} (تماس خشک تا کمی روان‌کاری‌شده فولاد-فولاد).`,
      "این یک تخمین مهندسی اولیه است؛ برای اجرای دقیق، آزمایش عملی یا محاسبه کامل با ضریب پواسون توصیه می‌شود.",
    ],
  };
}

// ---------------- Riveting (cold heading / upsetting, rule-of-thumb) ----------------
// Upsetting a rivet shank requires exceeding tensile strength substantially due to triaxial confinement.
export function calcRivetingForce(input: {
  rivetDiameterMm: number;
  tensileStrengthMPa: number;
  upsetFactor?: number; // default 3x — common rule-of-thumb multiplier for cold-heading confinement
}): CalcResult {
  const factor = input.upsetFactor ?? 3;
  const areaMm2 = (Math.PI / 4) * input.rivetDiameterMm ** 2;
  const forceN = areaMm2 * input.tensileStrengthMPa * factor;
  return {
    forceKgf: forceN / G,
    formulaFa: "F = (π/4 × قطر پرچ²) × استحکام کششی × ضریب فرم‌دهی سرد (پیش‌فرض ۳×)",
    assumptionsFa: [
      "ضریب ۳× یک قاعده سرانگشتی رایج برای فرم‌دهی سرد (upsetting) به دلیل مهار سه‌محوره ماده است؛ بسته به هندسه سر پرچ می‌تواند ۲ تا ۴ برابر باشد.",
    ],
  };
}

// ---------------- Coining / Embossing ----------------
// F = projected area x coining pressure (typically several multiples of tensile strength for shallow relief)
export function calcCoiningForce(input: {
  projectedAreaMm2: number;
  tensileStrengthMPa: number;
  pressureFactor?: number; // default 5x tensile strength — typical for shallow coining/marking
}): CalcResult {
  const factor = input.pressureFactor ?? 5;
  const forceN = input.projectedAreaMm2 * input.tensileStrengthMPa * factor;
  return {
    forceKgf: forceN / G,
    formulaFa: "F = سطح تصویرشده نقش (mm²) × استحکام کششی (N/mm²) × ضریب فشار کوینینگ (پیش‌فرض ۵×)",
    assumptionsFa: [
      "برای امباس یا مارکینگ کم‌عمق ضریب پایین‌تر (۲ تا ۳×) و برای کوینینگ عمیق با جزئیات ریز ضریب بالاتر (۵ تا ۸×) واقعی‌تر است.",
    ],
  };
}
