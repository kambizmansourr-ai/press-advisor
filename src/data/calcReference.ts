// Concise formula + use-case reference for every calculation exposed through
// EngineeringCalcPanel, across the three vendored modules. Keyed by
// "<moduleKey>" → "<groupKey>.<calcKey>" (the exact pair shown in the UI),
// not by the underlying JS namespace — group keys don't always match a
// namespace 1:1 (see EngineeringCalcPanel's resolveCalcFn), but they are
// always unique within a module's own UI metadata.

export interface CalcRefEntry {
  formula?: string;
  useCase: string;
}

export const engineCalcReference: Record<string, Record<string, CalcRefEntry>> = {
  bulkForming: {
    "forging.upsetCylinder": {
      formula: "F = Kf · Ȳf · A1  (Ȳf = K·εⁿ/(1+n))",
      useCase: "نیروی فورجینگ آزاد (upsetting) یک استوانه توپر بین دو سندان تخت — مبنای انتخاب پرس برای فشردن شمش‌های ساده.",
    },
    "forging.upsetSlab": {
      formula: "همانند upsetCylinder با فرض کرنش مسطح",
      useCase: "فشردن یک تیغه یا میلگرد مستطیلی بلند که طول آن ثابت می‌ماند و فقط عرض پهن می‌شود.",
    },
    "forging.closedDie": {
      formula: "F = Kf · Ȳf · A_proj",
      useCase: "تخمین اولیه نیروی فورجینگ در قالب بسته (با پلیسه)؛ Kf از جدول پیچیدگی شکل انتخاب می‌شود. دقت ±۲۵ تا ۴۰٪، فقط برای انتخاب اولیه پرس.",
    },
    "forging.flashDesign": {
      formula: "sf = 0.015·√A_proj ، bf = نسبت × sf",
      useCase: "تعیین ضخامت و عرض پلیسه (flash land) قالب فورجینگ بسته پیش از ساخت قالب.",
    },
    "forging.billet": {
      formula: "V_بیلت = V_قطعه + V_پلیسه + V_پوسته + V_راهگاه",
      useCase: "محاسبه حجم و جرم بیلت اولیه لازم برای یک سیکل فورجینگ قالب بسته.",
    },
    "rolling.pass": {
      formula: "F = Ȳf_مؤثر · w · L  (L = √(R·d))",
      useCase: "نیرو، گشتاور و توان لازم برای یک پاس نورد تخت — برای انتخاب موتور و بررسی ظرفیت غلتک.",
    },
    "rolling.maxDraft": {
      formula: "d_max = μ² · R",
      useCase: "تعیین حداکثر کاهش ضخامت ممکن در یک پاس نورد بدون لغزیدن ورق زیر غلتک.",
    },
    "rolling.schedule": {
      useCase: "تقسیم یک کاهش ضخامت بزرگ به چند پاس نورد با کرنش تقریباً مساوی در هر پاس.",
    },
    "extrusion.pressure": {
      formula: "p = Ȳf·(εx + 2L/D0) ، εx = a + b·ln(rx)  (معادله جانسون)",
      useCase: "محاسبه دقیق فشار و نیروی اکستروژن مستقیم یا غیرمستقیم، شامل افزایش دمای ناشی از تغییر شکل.",
    },
    "extrusion.byConstant": {
      formula: "F = A0 · Ke · ln(rx)",
      useCase: "تخمین سریع صنعتی نیروی اکستروژن وقتی K و n ماده در دسترس نیست، فقط ثابت اکستروژن Ke.",
    },
    "drawing.wire": {
      formula: "σd = Ȳf·φ·(1+μ/tanα)·ln(A0/Af)",
      useCase: "تنش و نیروی کشش یک پاس مفتول یا میله از میان یک قالب مخروطی؛ شامل بررسی خطر پارگی.",
    },
    "drawing.schedule": {
      useCase: "تقسیم یک کاهش قطر بزرگ به چند پاس کشش مفتول با تعیین محل آنیل میانی در صورت نیاز.",
    },
    "drawing.maxReduction": {
      useCase: "حداکثر کاهش مجاز در هر پاس کشش مفتول پیش از رسیدن تنش کشش به تنش شکست.",
    },
  },

  sheetForming: {
    "cutting.operation": {
      useCase: "محاسبه یکجای یک عملیات کامل پانچ/بلانکینگ: لقی و ابعاد ابزار + نیرو و انرژی + بررسی مقاومت سنبه در برابر کمانش.",
    },
    "cutting.clearance": {
      formula: "لقی یک‌طرفه c = Ac · t",
      useCase: "تعیین لقی استاندارد بین سنبه و ماتریس و در نتیجه ابعاد دقیق هرکدام، بر اساس جنس و ضخامت ورق.",
    },
    "cutting.force": {
      formula: "F = S · t · L  (S ≈ ۰.۷ × UTS)",
      useCase: "نیروی برش، نیروی جداکننده (stripping) و انرژی لازم برای پانچ یا بلانکینگ — مبنای اصلی انتخاب تناژ پرس.",
    },
    "cutting.stripLayout": {
      useCase: "طراحی چیدمان نوار فلزی (گام، عرض نوار، بازده مواد) برای قالب پیشرو یا تغذیه نواری.",
    },
    "cutting.guillotine": {
      formula: "F = S · t² / (2·tanφ)",
      useCase: "نیروی برش با تیغه گیوتین (زاویه‌دار)؛ برخلاف پانچ، این نیرو مستقل از طول برش است.",
    },
    "bending.allowance": {
      formula: "BA = α·(R + K·t)",
      useCase: "محاسبه طول خم و ابعاد گسترده (flat pattern) قطعه پیش از خم — لازم برای برش دقیق بلانک.",
    },
    "bending.force": {
      formula: "F = Kbf · UTS · w · t² / D",
      useCase: "تخمین نیروی خم V برای انتخاب تناژ پرس؛ ضریب Kbf بر اساس نوع قالب (V/U/لبه‌خم‌کن) تغییر می‌کند.",
    },
    "bending.springback": {
      formula: "فرمول Kalpakjian بر پایه Ri·Y/(E·t)",
      useCase: "پیش‌بینی میزان برگشت فنری پس از خم و تعیین زاویه اضافه‌خم لازم روی قالب برای رسیدن به زاویه هدف.",
    },
    "bending.designCheck": {
      useCase: "بررسی رعایت قواعد طراحی خم: حداقل شعاع مجاز، حداقل طول لبه و حداقل فاصله سوراخ تا خط خم.",
    },
    "drawing.blankDiameter": {
      formula: "Db = √(d² + 4dh)  (با اصلاح برای شعاع گوشه کف)",
      useCase: "محاسبه قطر بلانک اولیه لازم برای کشش یک کاپ استوانه‌ای به قطر و ارتفاع مشخص.",
    },
    "drawing.feasibility": {
      useCase: "بررسی امکان‌پذیری کشش در یک مرحله بر اساس نسبت کشش (DR)، درصد کاهش و نسبت ضخامت به قطر بلانک.",
    },
    "drawing.force": {
      formula: "F = π·Dp·t·UTS·(DR − 0.7)",
      useCase: "نیروی کشش و نیروی ورق‌گیر لازم — مبنای انتخاب تناژ پرس کشش عمیق.",
    },
    "drawing.redrawPlan": {
      useCase: "برنامه‌ریزی کشش چندمرحله‌ای وقتی نسبت کشش کل بیش از حد یک مرحله (معمولاً DR>2) باشد.",
    },
  },

  injectionMolding: {
    "machineSizing.moldingDataCalculator": {
      useCase: "محاسبه یکجای تمام پارامترهای اصلی انتخاب ماشین (سطح تصویرشده، نسبت L/T، تناژ، وزن شات، خنک‌کاری، سیکل) فقط از روی ابعاد قطعه.",
    },
    "machineSizing.projectedArea": {
      useCase: "محاسبه سطح تصویرشده قطعه(ها) و رانر سرد — عدد پایه برای محاسبه تناژ قفل‌کننده.",
    },
    "machineSizing.tonnage": {
      formula: "تناژ = سطح تصویرشده × فشار حفره (از جدول ماده)",
      useCase: "تعیین تناژ قفل‌کننده لازم ماشین تزریق بر اساس سطح تصویرشده و نسبت L/T.",
    },
    "machineSizing.injectionUnit": {
      useCase: "محاسبه وزن شات و ظرفیت تزریق لازم، و بررسی درصد استفاده از ظرفیت بشکه ماشین.",
    },
    "cooling.coolingTime": {
      useCase: "تخمین زمان خنک‌کاری در قالب بر اساس ضخامت دیواره و ماده — معمولاً بزرگ‌ترین بخش زمان سیکل.",
    },
    "cooling.heatLoad": {
      useCase: "محاسبه بار حرارتی هر سیکل و دبی آب خنک‌کننده لازم برای دفع آن.",
    },
    "cooling.channels": {
      useCase: "بررسی رژیم جریان آب (آرام/متلاطم، عدد رینولدز) و افت فشار در کانال‌های خنک‌کاری قالب.",
    },
    "cavities.count": {
      useCase: "تعیین تعداد حفره لازم بر اساس محدودیت‌های تیراژ، تناژ ماشین، ظرفیت شات و نرخ پلاستیسایز.",
    },
    "cavities.economic": {
      useCase: "تعیین تعداد حفره اقتصادی (کمترین هزینه کل تولید) بر اساس نرخ ساعتی ماشین و هزینه ساخت هر حفره اضافه.",
    },
    "feed.runnerDiameter": {
      useCase: "تعیین قطر مناسب رانر سرد بر اساس وزن قطعه تغذیه‌شده و طول رانر.",
    },
    "feed.edgeGate": {
      useCase: "طراحی ابعاد گیت لبه‌ای (عمق، عرض، طول زمین) بر اساس ضخامت دیواره و ماده.",
    },
    "feed.sprue": {
      useCase: "محاسبه ابعاد اسپرو (قطر ابتدا و انتها، حجم) بر اساس قطر نازل دستگاه و طول اسپرو.",
    },
    "feed.gateFreezeTime": {
      useCase: "زمان انجماد گیت — مبنای تعیین زمان نگه‌داشت (hold/pack time) مناسب در سیکل تزریق.",
    },
    "partMold.cavityDimension": {
      formula: "ابعاد حفره = ابعاد قطعه × (1 + انقباض)",
      useCase: "جبران انقباض ماده هنگام سرد شدن، برای تعیین ابعاد دقیق حفره قالب متناسب با ابعاد نهایی قطعه.",
    },
    "partMold.ejectionForce": {
      useCase: "محاسبه نیروی پران لازم و بررسی تنش پین‌های پران و خودآزاد بودن قطعه بر اساس زاویه شیب.",
    },
    "partMold.plateDeflection": {
      useCase: "بررسی خیز صفحه قالب زیر فشار حفره و کفایت ضخامت آن، با یا بدون ستون پشتیبان (support pillar).",
    },
    "partMold.venting": {
      useCase: "تعیین عمق مناسب ونت برای خروج هوا از حفره بدون ایجاد پلیسه یا سوختگی سطحی روی قطعه.",
    },
  },
};

export function getCalcRef(moduleKey: string, groupKey: string, calcKey: string): CalcRefEntry | undefined {
  return engineCalcReference[moduleKey]?.[`${groupKey}.${calcKey}`];
}
