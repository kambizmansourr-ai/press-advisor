// Concise formula + use-case reference for every calculation exposed through
// EngineeringCalcPanel, across the three vendored modules. Keyed by
// "<moduleKey>" → "<groupKey>.<calcKey>" (the exact pair shown in the UI),
// not by the underlying JS namespace — group keys don't always match a
// namespace 1:1 (see EngineeringCalcPanel's resolveCalcFn), but they are
// always unique within a module's own UI metadata.

export interface CalcRefEntry {
  formula?: string;
  /** English formula - only set when the Persian `formula` contains Persian words (otherwise `formula` is language-neutral). */
  formulaEn?: string;
  useCase: string;
  useCaseEn: string;
}

export const engineCalcReference: Record<string, Record<string, CalcRefEntry>> = {
  bulkForming: {
    "forging.upsetCylinder": {
      formula: "F = Kf · Ȳf · A1  (Ȳf = K·εⁿ/(1+n))",
      useCase: "نیروی فورجینگ آزاد (upsetting) یک استوانه توپر بین دو سندان تخت — مبنای انتخاب پرس برای فشردن شمش‌های ساده.",
      useCaseEn: "Free-forging (upsetting) force of a solid cylinder between two flat anvils - the basis for selecting a press to squash simple billets.",
    },
    "forging.upsetSlab": {
      formula: "همانند upsetCylinder با فرض کرنش مسطح",
      useCase: "فشردن یک تیغه یا میلگرد مستطیلی بلند که طول آن ثابت می‌ماند و فقط عرض پهن می‌شود.",
      useCaseEn: "Upsetting a long rectangular bar or slab whose length stays constant while only the width spreads.",
      formulaEn: "Same as upsetCylinder, assuming plane strain",
    },
    "forging.closedDie": {
      formula: "F = Kf · Ȳf · A_proj",
      useCase: "تخمین اولیه نیروی فورجینگ در قالب بسته (با پلیسه)؛ Kf از جدول پیچیدگی شکل انتخاب می‌شود. دقت ±۲۵ تا ۴۰٪، فقط برای انتخاب اولیه پرس.",
      useCaseEn: "First estimate of closed-die forging force (with flash); Kf is chosen from the shape-complexity table. Accuracy ±25–40%, for initial press selection only.",
    },
    "forging.flashDesign": {
      formula: "sf = 0.015·√A_proj ، bf = نسبت × sf",
      useCase: "تعیین ضخامت و عرض پلیسه (flash land) قالب فورجینگ بسته پیش از ساخت قالب.",
      useCaseEn: "Sizing the flash thickness and land width of a closed-die forging die before die manufacture.",
      formulaEn: "sf = 0.015·√A_proj , bf = ratio × sf",
    },
    "forging.billet": {
      formula: "V_بیلت = V_قطعه + V_پلیسه + V_پوسته + V_راهگاه",
      useCase: "محاسبه حجم و جرم بیلت اولیه لازم برای یک سیکل فورجینگ قالب بسته.",
      useCaseEn: "Initial billet volume and mass required for one closed-die forging cycle.",
      formulaEn: "V_billet = V_part + V_flash + V_scale + V_runner",
    },
    "rolling.pass": {
      formula: "F = Ȳf_مؤثر · w · L  (L = √(R·d))",
      formulaEn: "F = Ȳf_eff · w · L  (L = √(R·d))",
      useCase: "نیرو، گشتاور و توان لازم برای یک پاس نورد تخت — برای انتخاب موتور و بررسی ظرفیت غلتک.",
      useCaseEn: "Force, torque and power for a single flat-rolling pass - for motor selection and roll capacity checks.",
    },
    "rolling.maxDraft": {
      formula: "d_max = μ² · R",
      useCase: "تعیین حداکثر کاهش ضخامت ممکن در یک پاس نورد بدون لغزیدن ورق زیر غلتک.",
      useCaseEn: "Maximum thickness reduction possible in one rolling pass without the strip slipping under the rolls.",
    },
    "rolling.schedule": {
      useCase: "تقسیم یک کاهش ضخامت بزرگ به چند پاس نورد با کرنش تقریباً مساوی در هر پاس.",
      useCaseEn: "Splitting a large thickness reduction into several rolling passes with roughly equal strain per pass.",
    },
    "extrusion.pressure": {
      formula: "p = Ȳf·(εx + 2L/D0) ، εx = a + b·ln(rx)  (معادله جانسون)",
      useCase: "محاسبه دقیق فشار و نیروی اکستروژن مستقیم یا غیرمستقیم، شامل افزایش دمای ناشی از تغییر شکل.",
      useCaseEn: "Detailed pressure and force for direct or indirect extrusion, including the deformation-induced temperature rise.",
      formulaEn: "p = Ȳf·(εx + 2L/D0) , εx = a + b·ln(rx)  (Johnson equation)",
    },
    "extrusion.byConstant": {
      formula: "F = A0 · Ke · ln(rx)",
      useCase: "تخمین سریع صنعتی نیروی اکستروژن وقتی K و n ماده در دسترس نیست، فقط ثابت اکستروژن Ke.",
      useCaseEn: "Quick industrial estimate of extrusion force when the material's K and n are not available - only the extrusion constant Ke.",
    },
    "drawing.wire": {
      formula: "σd = Ȳf·φ·(1+μ/tanα)·ln(A0/Af)",
      useCase: "تنش و نیروی کشش یک پاس مفتول یا میله از میان یک قالب مخروطی؛ شامل بررسی خطر پارگی.",
      useCaseEn: "Draw stress and force for one pass of wire or rod through a conical die, including a fracture-risk check.",
    },
    "drawing.schedule": {
      useCase: "تقسیم یک کاهش قطر بزرگ به چند پاس کشش مفتول با تعیین محل آنیل میانی در صورت نیاز.",
      useCaseEn: "Splitting a large diameter reduction into several wire-drawing passes, with intermediate anneal locations where needed.",
    },
    "drawing.maxReduction": {
      useCase: "حداکثر کاهش مجاز در هر پاس کشش مفتول پیش از رسیدن تنش کشش به تنش شکست.",
      useCaseEn: "Maximum permissible reduction per wire-drawing pass before the draw stress reaches the fracture stress.",
    },
  },

  sheetForming: {
    "cutting.operation": {
      useCase: "محاسبه یکجای یک عملیات کامل پانچ/بلانکینگ: لقی و ابعاد ابزار + نیرو و انرژی + بررسی مقاومت سنبه در برابر کمانش.",
      useCaseEn: "All-in-one calculation of a complete punching/blanking operation: clearance and tool dimensions + force and energy + punch buckling check.",
    },
    "cutting.clearance": {
      formula: "لقی یک‌طرفه c = Ac · t",
      useCase: "تعیین لقی استاندارد بین سنبه و ماتریس و در نتیجه ابعاد دقیق هرکدام، بر اساس جنس و ضخامت ورق.",
      useCaseEn: "Standard punch-to-die clearance and the resulting punch and die dimensions, based on sheet material and thickness.",
      formulaEn: "One-sided clearance c = Ac · t",
    },
    "cutting.force": {
      formula: "F = S · t · L  (S ≈ ۰.۷ × UTS)",
      formulaEn: "F = S · t · L  (S ≈ 0.7 × UTS)",
      useCase: "نیروی برش، نیروی جداکننده (stripping) و انرژی لازم برای پانچ یا بلانکینگ — مبنای اصلی انتخاب تناژ پرس.",
      useCaseEn: "Cutting force, stripping force and energy for punching or blanking - the main basis for press tonnage selection.",
    },
    "cutting.stripLayout": {
      useCase: "طراحی چیدمان نوار فلزی (گام، عرض نوار، بازده مواد) برای قالب پیشرو یا تغذیه نواری.",
      useCaseEn: "Designing the strip layout (pitch, strip width, material utilization) for a progressive die or strip feeding.",
    },
    "cutting.guillotine": {
      formula: "F = S · t² / (2·tanφ)",
      useCase: "نیروی برش با تیغه گیوتین (زاویه‌دار)؛ برخلاف پانچ، این نیرو مستقل از طول برش است.",
      useCaseEn: "Shearing force with an angled guillotine blade; unlike punching, this force is independent of cut length.",
    },
    "bending.allowance": {
      formula: "BA = α·(R + K·t)",
      useCase: "محاسبه طول خم و ابعاد گسترده (flat pattern) قطعه پیش از خم — لازم برای برش دقیق بلانک.",
      useCaseEn: "Bend allowance and flat-pattern dimensions of the part before bending - needed for an accurate blank cut.",
    },
    "bending.force": {
      formula: "F = Kbf · UTS · w · t² / D",
      useCase: "تخمین نیروی خم V برای انتخاب تناژ پرس؛ ضریب Kbf بر اساس نوع قالب (V/U/لبه‌خم‌کن) تغییر می‌کند.",
      useCaseEn: "V-bending force estimate for press tonnage selection; the Kbf factor varies with die type (V/U/wipe bending).",
    },
    "bending.springback": {
      formula: "فرمول Kalpakjian بر پایه Ri·Y/(E·t)",
      useCase: "پیش‌بینی میزان برگشت فنری پس از خم و تعیین زاویه اضافه‌خم لازم روی قالب برای رسیدن به زاویه هدف.",
      useCaseEn: "Predicting springback after bending and the overbend angle needed in the die to reach the target angle.",
      formulaEn: "Kalpakjian formula based on Ri·Y/(E·t)",
    },
    "bending.designCheck": {
      useCase: "بررسی رعایت قواعد طراحی خم: حداقل شعاع مجاز، حداقل طول لبه و حداقل فاصله سوراخ تا خط خم.",
      useCaseEn: "Checking bend design rules: minimum allowable radius, minimum flange length and minimum hole-to-bend-line distance.",
    },
    "drawing.blankDiameter": {
      formula: "Db = √(d² + 4dh)  (با اصلاح برای شعاع گوشه کف)",
      useCase: "محاسبه قطر بلانک اولیه لازم برای کشش یک کاپ استوانه‌ای به قطر و ارتفاع مشخص.",
      useCaseEn: "Initial blank diameter needed to draw a cylindrical cup of given diameter and height.",
      formulaEn: "Db = √(d² + 4dh)  (corrected for the bottom corner radius)",
    },
    "drawing.feasibility": {
      useCase: "بررسی امکان‌پذیری کشش در یک مرحله بر اساس نسبت کشش (DR)، درصد کاهش و نسبت ضخامت به قطر بلانک.",
      useCaseEn: "Checking whether a single-stage draw is feasible, based on the draw ratio (DR), percent reduction and thickness-to-blank-diameter ratio.",
    },
    "drawing.force": {
      formula: "F = π·Dp·t·UTS·(DR − 0.7)",
      useCase: "نیروی کشش و نیروی ورق‌گیر لازم — مبنای انتخاب تناژ پرس کشش عمیق.",
      useCaseEn: "Drawing force and blank-holder force - the basis for selecting a deep-drawing press tonnage.",
    },
    "drawing.redrawPlan": {
      useCase: "برنامه‌ریزی کشش چندمرحله‌ای وقتی نسبت کشش کل بیش از حد یک مرحله (معمولاً DR>2) باشد.",
      useCaseEn: "Planning a multi-stage draw when the total draw ratio exceeds what one stage can do (typically DR > 2).",
    },
  },

  injectionMolding: {
    "machineSizing.moldingDataCalculator": {
      useCase: "محاسبه یکجای تمام پارامترهای اصلی انتخاب ماشین (سطح تصویرشده، نسبت L/T، تناژ، وزن شات، خنک‌کاری، سیکل) فقط از روی ابعاد قطعه.",
      useCaseEn: "All-in-one calculation of the main machine-selection parameters (projected area, L/T ratio, tonnage, shot weight, cooling, cycle) from the part dimensions alone.",
    },
    "machineSizing.projectedArea": {
      useCase: "محاسبه سطح تصویرشده قطعه(ها) و رانر سرد — عدد پایه برای محاسبه تناژ قفل‌کننده.",
      useCaseEn: "Projected area of the part(s) and cold runner - the base number for clamp tonnage.",
    },
    "machineSizing.tonnage": {
      formula: "تناژ = سطح تصویرشده × فشار حفره (از جدول ماده)",
      useCase: "تعیین تناژ قفل‌کننده لازم ماشین تزریق بر اساس سطح تصویرشده و نسبت L/T.",
      useCaseEn: "Required clamp tonnage of the injection machine from the projected area and the L/T ratio.",
      formulaEn: "Tonnage = projected area × cavity pressure (from the material table)",
    },
    "machineSizing.injectionUnit": {
      useCase: "محاسبه وزن شات و ظرفیت تزریق لازم، و بررسی درصد استفاده از ظرفیت بشکه ماشین.",
      useCaseEn: "Shot weight and required injection capacity, and the percentage of the machine's barrel capacity used.",
    },
    "cooling.coolingTime": {
      useCase: "تخمین زمان خنک‌کاری در قالب بر اساس ضخامت دیواره و ماده — معمولاً بزرگ‌ترین بخش زمان سیکل.",
      useCaseEn: "Estimated in-mold cooling time from wall thickness and material - usually the largest part of the cycle time.",
    },
    "cooling.heatLoad": {
      useCase: "محاسبه بار حرارتی هر سیکل و دبی آب خنک‌کننده لازم برای دفع آن.",
      useCaseEn: "Heat load per cycle and the coolant flow rate needed to remove it.",
    },
    "cooling.channels": {
      useCase: "بررسی رژیم جریان آب (آرام/متلاطم، عدد رینولدز) و افت فشار در کانال‌های خنک‌کاری قالب.",
      useCaseEn: "Checking the coolant flow regime (laminar/turbulent, Reynolds number) and pressure drop in the mold cooling channels.",
    },
    "cavities.count": {
      useCase: "تعیین تعداد حفره لازم بر اساس محدودیت‌های تیراژ، تناژ ماشین، ظرفیت شات و نرخ پلاستیسایز.",
      useCaseEn: "Number of cavities required, based on production-quantity limits, machine tonnage, shot capacity and plasticizing rate.",
    },
    "cavities.economic": {
      useCase: "تعیین تعداد حفره اقتصادی (کمترین هزینه کل تولید) بر اساس نرخ ساعتی ماشین و هزینه ساخت هر حفره اضافه.",
      useCaseEn: "Economic cavity count (lowest total production cost) based on the machine hourly rate and the cost of each additional cavity.",
    },
    "feed.runnerDiameter": {
      useCase: "تعیین قطر مناسب رانر سرد بر اساس وزن قطعه تغذیه‌شده و طول رانر.",
      useCaseEn: "Suitable cold-runner diameter based on the fed part weight and runner length.",
    },
    "feed.edgeGate": {
      useCase: "طراحی ابعاد گیت لبه‌ای (عمق، عرض، طول زمین) بر اساس ضخامت دیواره و ماده.",
      useCaseEn: "Edge-gate dimensions (depth, width, land length) based on wall thickness and material.",
    },
    "feed.sprue": {
      useCase: "محاسبه ابعاد اسپرو (قطر ابتدا و انتها، حجم) بر اساس قطر نازل دستگاه و طول اسپرو.",
      useCaseEn: "Sprue dimensions (inlet and outlet diameter, volume) from the machine nozzle diameter and sprue length.",
    },
    "feed.gateFreezeTime": {
      useCase: "زمان انجماد گیت — مبنای تعیین زمان نگه‌داشت (hold/pack time) مناسب در سیکل تزریق.",
      useCaseEn: "Gate freeze time - the basis for choosing a suitable hold/pack time in the injection cycle.",
    },
    "partMold.cavityDimension": {
      formula: "ابعاد حفره = ابعاد قطعه × (1 + انقباض)",
      useCase: "جبران انقباض ماده هنگام سرد شدن، برای تعیین ابعاد دقیق حفره قالب متناسب با ابعاد نهایی قطعه.",
      useCaseEn: "Compensating for material shrinkage on cooling to size the mold cavity precisely for the final part dimensions.",
      formulaEn: "Cavity dimension = part dimension × (1 + shrinkage)",
    },
    "partMold.ejectionForce": {
      useCase: "محاسبه نیروی پران لازم و بررسی تنش پین‌های پران و خودآزاد بودن قطعه بر اساس زاویه شیب.",
      useCaseEn: "Required ejection force, ejector-pin stress check and part self-release based on draft angle.",
    },
    "partMold.plateDeflection": {
      useCase: "بررسی خیز صفحه قالب زیر فشار حفره و کفایت ضخامت آن، با یا بدون ستون پشتیبان (support pillar).",
      useCaseEn: "Checking mold-plate deflection under cavity pressure and whether its thickness is adequate, with or without support pillars.",
    },
    "partMold.venting": {
      useCase: "تعیین عمق مناسب ونت برای خروج هوا از حفره بدون ایجاد پلیسه یا سوختگی سطحی روی قطعه.",
      useCaseEn: "Suitable vent depth to let air escape from the cavity without causing flash or burn marks on the part.",
    },
  },
};

export function getCalcRef(moduleKey: string, groupKey: string, calcKey: string): CalcRefEntry | undefined {
  return engineCalcReference[moduleKey]?.[`${groupKey}.${calcKey}`];
}
