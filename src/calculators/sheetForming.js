/*!
 * sheetForming.js — فرم‌دهی و برش ورق / Sheet Metal Forming & Cutting
 * Drop-in calculation module. Companion to bulkForming.js — same unit system,
 * same return shape ({ ...results, warnings[], steps[] }), same UMD wrapper.
 *
 * UNIT SYSTEM (internal, consistent):
 *   length mm | area mm² | stress MPa (= N/mm²) | force N | energy J
 *   angle DEGREES at the API boundary | E in MPa (not GPa)
 *
 * Coverage: shearing/blanking/punching · bending · deep drawing
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SheetForming = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ────────────────────────────────────────────────────────────────────────
  // 0. Helpers
  // ────────────────────────────────────────────────────────────────────────

  const DEG = Math.PI / 180;
  const rad = (d) => d * DEG;
  const deg = (r) => r / DEG;

  function req(v, name) {
    if (typeof v !== 'number' || !isFinite(v)) {
      throw new TypeError(`sheetForming: parameter "${name}" must be a finite number (got ${v})`);
    }
    return v;
  }
  function pos(v, name) {
    req(v, name);
    if (v <= 0) throw new RangeError(`sheetForming: parameter "${name}" must be > 0 (got ${v})`);
    return v;
  }
  const areaOfCircle = (d) => Math.PI * d * d / 4;
  const round = (x, p = 4) => {
    if (typeof x !== 'number' || !isFinite(x)) return x;
    if (x === 0) return 0;
    const m = Math.pow(10, p - 1 - Math.floor(Math.log10(Math.abs(x))));
    return Math.round(x * m) / m;
  };
  function Step(label, expr, value, unit) { return { label, expr, value: round(value), unit }; }

  // ────────────────────────────────────────────────────────────────────────
  // 1. Sheet material data — جداول داده ورق
  // ────────────────────────────────────────────────────────────────────────

  /**
   * Y: yield (MPa) | UTS (MPa) | S: shear strength (MPa) | K,n: flow curve
   * rBar: normal anisotropy | elong: total elongation % | RbT: R_min/t
   * E: Young's modulus (MPa) | Ac: die clearance allowance
   */
  const SHEET_MATERIALS = {
    steel_DC01:    { fa: 'فولاد نورد سرد DC01',   en: 'CR steel DC01',      Y: 210, UTS: 330, S: 240, K: 530,  n: 0.24, rBar: 1.5,  elong: 38, RbT: 0.5, E: 207000, Ac: 0.075 },
    steel_DC04:    { fa: 'فولاد کشش عمیق DC04',   en: 'DDQ steel DC04',     Y: 180, UTS: 300, S: 215, K: 500,  n: 0.26, rBar: 1.8,  elong: 42, RbT: 0.5, E: 207000, Ac: 0.060 },
    steel_halfhard:{ fa: 'فولاد نیمه‌سخت',         en: 'Half-hard steel',    Y: 400, UTS: 480, S: 360, K: 620,  n: 0.10, rBar: 1.0,  elong: 12, RbT: 1.5, E: 207000, Ac: 0.075 },
    steel_HSLA340: { fa: 'فولاد HSLA 340',        en: 'HSLA 340',           Y: 340, UTS: 440, S: 320, K: 700,  n: 0.18, rBar: 1.1,  elong: 24, RbT: 1.5, E: 207000, Ac: 0.075 },
    steel_DP600:   { fa: 'فولاد دوفازی DP600',    en: 'Dual-phase DP600',   Y: 380, UTS: 620, S: 460, K: 1000, n: 0.16, rBar: 0.9,  elong: 20, RbT: 2.5, E: 207000, Ac: 0.080 },
    stainless_304: { fa: 'فولاد زنگ‌نزن 304',      en: 'Stainless 304',      Y: 275, UTS: 620, S: 480, K: 1275, n: 0.45, rBar: 1.0,  elong: 55, RbT: 0.5, E: 195000, Ac: 0.075 },
    stainless_430: { fa: 'فولاد زنگ‌نزن 430',      en: 'Stainless 430',      Y: 310, UTS: 480, S: 360, K: 800,  n: 0.22, rBar: 1.2,  elong: 25, RbT: 1.0, E: 195000, Ac: 0.075 },
    al_1100_O:     { fa: 'آلومینیوم 1100-O',      en: 'Al 1100-O',          Y: 35,  UTS: 90,  S: 60,  K: 180,  n: 0.20, rBar: 0.7,  elong: 40, RbT: 0,   E: 70000,  Ac: 0.045 },
    al_3003_O:     { fa: 'آلومینیوم 3003-O',      en: 'Al 3003-O',          Y: 45,  UTS: 110, S: 75,  K: 200,  n: 0.20, rBar: 0.7,  elong: 35, RbT: 0.5, E: 70000,  Ac: 0.045 },
    al_5052_O:     { fa: 'آلومینیوم 5052-O',      en: 'Al 5052-O',          Y: 90,  UTS: 195, S: 125, K: 420,  n: 0.13, rBar: 0.66, elong: 25, RbT: 0.5, E: 70000,  Ac: 0.045 },
    al_6061_T4:    { fa: 'آلومینیوم 6061-T4',     en: 'Al 6061-T4',         Y: 145, UTS: 240, S: 155, K: 450,  n: 0.16, rBar: 0.7,  elong: 22, RbT: 1.5, E: 70000,  Ac: 0.060 },
    al_6061_T6:    { fa: 'آلومینیوم 6061-T6',     en: 'Al 6061-T6',         Y: 275, UTS: 310, S: 205, K: 400,  n: 0.05, rBar: 0.7,  elong: 12, RbT: 3.0, E: 70000,  Ac: 0.060 },
    al_2024_T4:    { fa: 'آلومینیوم 2024-T4',     en: 'Al 2024-T4',         Y: 325, UTS: 470, S: 285, K: 690,  n: 0.16, rBar: 0.7,  elong: 20, RbT: 3.0, E: 73000,  Ac: 0.060 },
    copper_ann:    { fa: 'مس آنیل',                en: 'Copper, annealed',   Y: 70,  UTS: 220, S: 150, K: 315,  n: 0.54, rBar: 0.9,  elong: 45, RbT: 0,   E: 117000, Ac: 0.050 },
    brass_70_30:   { fa: 'برنج 70-30 آنیل',        en: 'Brass 70-30 ann.',   Y: 100, UTS: 325, S: 220, K: 895,  n: 0.49, rBar: 0.9,  elong: 62, RbT: 0,   E: 100000, Ac: 0.050 },
    ti_cp_gr2:     { fa: 'تیتانیوم خالص Gr2',      en: 'Ti CP Grade 2',      Y: 275, UTS: 345, S: 240, K: 700,  n: 0.25, rBar: 4.5,  elong: 28, RbT: 0.7, E: 116000, Ac: 0.075 },
    ti_6al4v:      { fa: 'Ti-6Al-4V آنیل',         en: 'Ti-6Al-4V',          Y: 830, UTS: 900, S: 590, K: 1015, n: 0.11, rBar: 2.0,  elong: 12, RbT: 4.0, E: 116000, Ac: 0.080 },
    mg_az31_O:     { fa: 'منیزیم AZ31-O',          en: 'Mg AZ31-O',          Y: 150, UTS: 255, S: 165, K: 450,  n: 0.16, rBar: 1.5,  elong: 15, RbT: 5.0, E: 45000,  Ac: 0.060 },
  };

  /** Die clearance allowance Ac by material class (fallback when not using SHEET_MATERIALS) */
  const CLEARANCE_ALLOWANCE = {
    al_soft:        { fa: 'آلومینیوم 1100/5052', en: 'Al 1100, 5052',      Ac: 0.045 },
    al_hard:        { fa: 'آلومینیوم 2024-T/6061-T', en: 'Al 2024-T, 6061-T', Ac: 0.060 },
    steel_soft:     { fa: 'فولاد نرم آنیل',      en: 'Soft annealed steel', Ac: 0.060 },
    steel_halfhard: { fa: 'فولاد نورد سرد نیمه‌سخت', en: 'CR steel half-hard', Ac: 0.075 },
    stainless:      { fa: 'زنگ‌نزن نیمه‌سخت',     en: 'Stainless half-hard', Ac: 0.075 },
    copper_brass:   { fa: 'مس و برنج',            en: 'Copper, brass',       Ac: 0.050 },
  };

  /** Penetration fraction to fracture — used for cutting energy */
  const PENETRATION = {
    soft:      { fa: 'نرم و شکل‌پذیر', en: 'Soft, ductile',   min: 0.50, max: 0.60, def: 0.55 },
    halfhard:  { fa: 'نیمه‌سخت',       en: 'Half-hard',       min: 0.35, max: 0.45, def: 0.40 },
    hard:      { fa: 'سخت / فنری',     en: 'Hard / spring',   min: 0.20, max: 0.30, def: 0.25 },
  };

  /** Bending force coefficient Kbf */
  const BEND_COEFF = {
    v_die:      { fa: 'قالب V', en: 'V-die',      Kbf: 1.33 },
    wiping_die: { fa: 'قالب لبه‌خم‌کن', en: 'Wiping die', Kbf: 0.33 },
    u_die:      { fa: 'قالب U (دو خم)', en: 'U-die (channel)', Kbf: 2.67 },
  };

  /** Bottoming / coining force multipliers relative to air bending */
  const BEND_MODE = {
    air:       { fa: 'خم در هوا',  en: 'Air bending', mult: 1,  springback: 'زیاد / high' },
    bottoming: { fa: 'کوبش کف',    en: 'Bottoming',   mult: 4,  springback: 'کم / low' },
    coining:   { fa: 'سکه‌زنی',     en: 'Coining',     mult: 8,  springback: 'ناچیز / negligible' },
  };

  /** Successive redraw ratio limits */
  const REDRAW_LIMITS = [
    { stage: 1, DRmin: 1.6,  DRmax: 2.0,  reduction: [0.40, 0.50] },
    { stage: 2, DRmin: 1.2,  DRmax: 1.4,  reduction: [0.20, 0.30] },
    { stage: 3, DRmin: 1.15, DRmax: 1.25, reduction: [0.15, 0.20] },
  ];

  // ────────────────────────────────────────────────────────────────────────
  // 2. Sheet fundamentals — مبانی ورق
  // ────────────────────────────────────────────────────────────────────────

  const core = {
    /** Shear strength from UTS. factor defaults to 0.7 (0.6–0.65 soft Al, 0.75–0.8 hard steel). */
    shearStrength: (UTS, factor = 0.7) => pos(UTS, 'UTS') * req(factor, 'factor'),

    /** Normal anisotropy r̄ = (r0 + 2r45 + r90)/4 */
    normalAnisotropy: (r0, r45, r90) => (req(r0, 'r0') + 2 * req(r45, 'r45') + req(r90, 'r90')) / 4,

    /** Planar anisotropy Δr = (r0 − 2r45 + r90)/2 — drives earing */
    planarAnisotropy: (r0, r45, r90) => (req(r0, 'r0') - 2 * req(r45, 'r45') + req(r90, 'r90')) / 2,

    /** Lankford r-value from a tensile coupon (uses volume constancy for thickness) */
    rValue(w0, wf, L0, Lf) {
      pos(w0, 'w0'); pos(wf, 'wf'); pos(L0, 'L0'); pos(Lf, 'Lf');
      const ew = Math.log(wf / w0);
      const et = Math.log((L0 * w0) / (Lf * wf));
      return ew / et;
    },

    /** Practical LDR estimate from r̄ */
    limitingDrawRatio(rBar) {
      pos(rBar, 'rBar');
      const ldr = 2.0 + 0.5 * (rBar - 1);
      return { LDR: Math.max(1.6, Math.min(3.0, ldr)), rBar,
        note: 'تقریب عملی؛ LDR واقعی به روانکاری، شعاع ماتریس و نیروی ورق‌گیر هم بستگی دارد' };
    },

    /** Thinning from in-plane strains (plane stress) */
    thinning(t0, eps1, eps2) {
      pos(t0, 't0'); req(eps1, 'eps1'); req(eps2, 'eps2');
      const eps3 = -(eps1 + eps2);
      const tf = t0 * Math.exp(eps3);
      const pct = (1 - tf / t0) * 100;
      const warnings = [];
      if (pct > 25) warnings.push('نازک‌شدگی > 25٪ — گلویی‌شدن و پارگی محتمل / necking likely');
      else if (pct > 20) warnings.push('نازک‌شدگی > 20٪ — نزدیک حد ایمن / approaching the safe limit');
      return { thicknessStrain: eps3, finalThickness: tf, thinningPercent: pct, warnings };
    },

    /** Uniform elongation limit = n */
    uniformElongation: (n) => ({ trueStrain: req(n, 'n'), engStrain: Math.exp(n) - 1 }),

    /** Flow curve helpers (same as bulk module, repeated so this file stands alone) */
    flowStress: (K, n, eps) => (eps <= 0 ? 0 : pos(K, 'K') * Math.pow(eps, req(n, 'n'))),
    avgFlowStress: (K, n, eps) => core.flowStress(K, n, eps) / (1 + n),

    /** Minimum bend radius from tensile reduction of area (%) */
    minBendRadiusFromRA(t, RA_percent) {
      pos(t, 't'); pos(RA_percent, 'RA_percent');
      return Math.max(0, t * (50 / RA_percent - 1));
    },
  };

  // ────────────────────────────────────────────────────────────────────────
  // 3. Cutting — برشکاری
  // ────────────────────────────────────────────────────────────────────────

  const cutting = {
    /**
     * Die clearance and punch/die sizing — لقی و ابعاد سنبه و ماتریس.
     * @param {object} o
     * @param {number} o.t         sheet thickness (mm)
     * @param {number} o.size      nominal feature size — blank OD or hole dia (mm)
     * @param {'blanking'|'punching'} o.operation
     * @param {number} [o.Ac]      clearance allowance; or give materialKey / clearanceClass
     * @param {string} [o.materialKey] key of SHEET_MATERIALS
     * @param {string} [o.clearanceClass] key of CLEARANCE_ALLOWANCE
     */
    clearance(o) {
      const t = pos(o.t, 't');
      const size = pos(o.size, 'size');
      const op = o.operation;
      if (op !== 'blanking' && op !== 'punching') {
        throw new Error('clearance: operation must be "blanking" or "punching" — this determines which member carries the clearance');
      }
      let Ac = o.Ac, src;
      if (typeof Ac !== 'number') {
        const m = SHEET_MATERIALS[o.materialKey] || CLEARANCE_ALLOWANCE[o.clearanceClass];
        if (!m) throw new Error('clearance: supply Ac, materialKey, or clearanceClass');
        Ac = m.Ac; src = `${m.fa} / ${m.en}`;
      } else src = 'Ac supplied';

      const c = Ac * t;
      const warnings = [];
      let punchSize, dieSize, note;
      if (op === 'blanking') {
        dieSize = size; punchSize = size - 2 * c;
        note = 'بلانکینگ: ماتریس ابعاد قطعه را می‌سازد، لقی روی سنبه / die sets the size, clearance on the punch';
      } else {
        punchSize = size; dieSize = size + 2 * c;
        note = 'پانچینگ: سنبه ابعاد سوراخ را می‌سازد، لقی روی ماتریس / punch sets the size, clearance on the die';
      }
      if (Ac < 0.02) warnings.push('Ac < 2٪ — لقی خیلی کم: برش دوباره، پلیسه ثانویه، سایش شدید / clearance too small');
      if (Ac > 0.10) warnings.push('Ac > 10٪ — لقی خیلی زیاد: گردشدگی و پلیسه بلند / clearance too large');
      if (punchSize <= 0) warnings.push('اندازه سنبه منفی — ورودی نامعتبر / negative punch size');

      return {
        operation: op, Ac, clearancePerSide_mm: c, clearanceTotal_mm: 2 * c,
        punchSize_mm: punchSize, dieSize_mm: dieSize, source: src, note,
        angularClearance_deg: [0.25, 1.5], dieLandHeight_mm: [3, 10], warnings,
        steps: [
          Step('لقی یک‌طرفه / clearance per side', 'c = Ac·t', c, 'mm'),
          Step('قطر سنبه / punch size', op === 'blanking' ? 'D − 2c' : 'D', punchSize, 'mm'),
          Step('قطر ماتریس / die size', op === 'blanking' ? 'D' : 'D + 2c', dieSize, 'mm'),
        ],
      };
    },

    /**
     * Cutting force, stripping force, energy — نیرو و انرژی برش.
     * @param {object} o
     * @param {number} o.t              thickness (mm)
     * @param {number} o.perimeter      total cut length L (mm) — or give shape+dims
     * @param {number} [o.diameter]     convenience: circular cut, L = πD
     * @param {number} [o.S]            shear strength (MPa); or UTS, or materialKey
     * @param {number} [o.UTS]          used as S = 0.7·UTS if S absent
     * @param {string} [o.materialKey]
     * @param {number} [o.shearDepth=0] punch/die bevel depth h_shear (mm)
     * @param {number} [o.stripFactor=0.10]
     * @param {number} [o.penetration]  pt; or penetrationClass
     * @param {string} [o.penetrationClass='halfhard']
     */
    force(o) {
      const t = pos(o.t, 't');
      const warnings = [];
      let L = o.perimeter;
      if (typeof L !== 'number' && typeof o.diameter === 'number') L = Math.PI * pos(o.diameter, 'diameter');
      pos(L, 'perimeter');

      const mat = SHEET_MATERIALS[o.materialKey];
      let S = o.S, UTS = o.UTS;
      if (typeof S !== 'number') {
        if (mat) S = mat.S;
        else if (typeof UTS === 'number') S = 0.7 * UTS;
        else throw new Error('force: supply S, UTS, or materialKey');
      }
      if (typeof UTS !== 'number' && mat) UTS = mat.UTS;

      const Fbase = S * t * L;
      const hs = o.shearDepth || 0;
      const Fcut = hs > 0 ? Fbase * t / (t + hs) : Fbase;
      const stripFactor = o.stripFactor === undefined ? 0.10 : o.stripFactor;
      const Fstrip = stripFactor * Fcut;
      const Ftotal = Fcut + Fstrip;

      let pt = o.penetration;
      if (typeof pt !== 'number') {
        const pc = PENETRATION[o.penetrationClass || 'halfhard'];
        pt = pc.def;
      }
      // Energy uses the UN-sheared peak force: bevelling spreads the same work over more stroke
      const W = Fbase * t * pt / 1000;

      if (hs > 0) warnings.push(`با شیب ${hs} mm پیک نیرو ${round((1 - Fcut / Fbase) * 100, 3)}٪ کاهش یافت؛ انرژی کل تغییر نکرد / bevel cuts peak force, not energy`);
      if (stripFactor > 0.20) warnings.push('ضریب جداکننده > 20٪ غیرمعمول است / stripping factor unusually high');

      return {
        shearStrength: S, UTS, cutLength_mm: L, thickness_mm: t,
        forceUnsheared_N: Fbase, shearDepth_mm: hs,
        cuttingForce_N: Fcut, cuttingForce_kN: Fcut / 1000, cuttingForce_tonf: Fcut / 9806.65,
        strippingForce_N: Fstrip, strippingForce_kN: Fstrip / 1000,
        totalForce_N: Ftotal, totalForce_kN: Ftotal / 1000, totalForce_tonf: Ftotal / 9806.65,
        pressRating_kN: 1.2 * Ftotal / 1000,
        penetration: pt, energy_J: W, warnings,
        steps: [
          Step('استحکام برشی / shear strength', 'S ≈ 0.7·UTS', S, 'MPa'),
          Step('نیروی برش / cutting force', 'F = S·t·L', Fcut, 'N'),
          Step('نیروی جداکننده / stripping', 'F_s = k·F', Fstrip, 'N'),
          Step('انرژی / energy', 'W = F·t·pt', W, 'J'),
        ],
      };
    },

    /**
     * Punch strength & buckling check — بررسی مقاومت و کمانش سنبه.
     * @param {object} o {punchDiameter, force_N, punchLength (mm, unsupported),
     *                    E=207000, allowableStress=1500, t (sheet thickness), safetyFactor=2.5}
     */
    punchCheck(o) {
      const d = pos(o.punchDiameter, 'punchDiameter');
      const F = pos(o.force_N, 'force_N');
      const E = o.E || 207000;
      const allow = o.allowableStress || 1500;
      const SF = o.safetyFactor || 2.5;
      const warnings = [];

      const A = areaOfCircle(d);
      const sigma = F / A;
      const I = Math.PI * Math.pow(d, 4) / 64;
      const Lmax = Math.sqrt(Math.PI * Math.PI * E * I / (4 * F * SF));

      if (sigma > allow) warnings.push(`تنش سنبه ${round(sigma)} MPa > ${allow} MPa مجاز — سنبه می‌شکند / punch will fail in compression`);
      else if (sigma > 0.7 * allow) warnings.push('تنش سنبه بالای 70٪ حد مجاز / punch stress above 70% of allowable');
      if (typeof o.t === 'number' && d < o.t) warnings.push('قطر سوراخ کمتر از ضخامت ورق — خطر شکست سنبه / hole smaller than sheet thickness');
      if (typeof o.punchLength === 'number' && o.punchLength > Lmax) {
        warnings.push(`طول آزاد سنبه ${o.punchLength} mm > حد کمانش ${round(Lmax)} mm — راهنمای سنبه لازم است / punch guide required`);
      }

      return {
        punchArea_mm2: A, punchStress_MPa: sigma, allowableStress_MPa: allow,
        stressUtilisation: sigma / allow, momentOfInertia: I,
        maxUnsupportedLength_mm: Lmax, safetyFactor: SF,
        minRecommendedHoleDia_mm: typeof o.t === 'number' ? o.t : null, warnings,
        steps: [
          Step('تنش سنبه / punch stress', 'σ = 4F/(πd²)', sigma, 'MPa'),
          Step('حد کمانش / buckling limit', 'L = √(π²EI/(4F·SF))', Lmax, 'mm'),
        ],
      };
    },

    /** Guillotine / rake-angle shear force — برش با گیوتین. */
    guillotine({ t, S, rakeAngle_deg, UTS }) {
      pos(t, 't'); pos(rakeAngle_deg, 'rakeAngle_deg');
      const s = (typeof S === 'number') ? S : 0.7 * pos(UTS, 'UTS');
      const F = s * t * t / (2 * Math.tan(rad(rakeAngle_deg)));
      const warnings = [];
      if (rakeAngle_deg < 0.5 || rakeAngle_deg > 5) warnings.push('زاویه تیغه معمولاً 0.5–3 درجه است / rake angle normally 0.5–3°');
      return {
        shearStrength: s, rakeAngle_deg,
        force_N: F, force_kN: F / 1000, force_tonf: F / 9806.65, warnings,
        note: 'نیرو مستقل از طول برش است — فقط تابع ضخامت و زاویه تیغه',
        steps: [Step('نیرو / force', 'F = S·t²/(2·tanφ)', F, 'N')],
      };
    },

    /**
     * Strip layout & material utilisation — چیدمان نوار و بازده مواد.
     * @param {object} o {partWidth (across strip, mm), partLength (along feed, mm),
     *                    partArea (mm²), t, bridge (mm, optional), edge (mm, optional),
     *                    rows=1, stripLength (mm, optional — for part count)}
     */
    stripLayout(o) {
      const t = pos(o.t, 't');
      const pw = pos(o.partWidth, 'partWidth');
      const pl = pos(o.partLength, 'partLength');
      const A = pos(o.partArea, 'partArea');
      const rows = o.rows || 1;
      // recommended web widths
      let bf, ef;
      if (t < 1) { bf = 1.0 / t; ef = 1.5 / t; }
      else if (t < 2) { bf = 1.0; ef = 1.5; }
      else if (t < 4) { bf = 1.2; ef = 1.5; }
      else { bf = 1.5; ef = 2.0; }
      const bridge = o.bridge !== undefined ? o.bridge : Math.max(1.0, bf * t);
      const edge = o.edge !== undefined ? o.edge : Math.max(1.0, ef * t);

      const pitch = pl + bridge;
      const stripWidth = rows * pw + (rows - 1) * bridge + 2 * edge;
      const utilisation = (rows * A) / (pitch * stripWidth);
      const warnings = [];
      if (bridge < 1) warnings.push('عرض پل کمتر از 1 mm — نوار در تغذیه پاره می‌شود / scrap bridge too narrow');
      if (utilisation < 0.5) warnings.push('بازده مواد زیر 50٪ — چیدمان مورب یا چندردیفه را بررسی کنید / consider staggered or multi-row nesting');

      const partsPerStrip = o.stripLength ? Math.floor(o.stripLength / pitch) * rows : null;
      return {
        bridge_mm: bridge, edge_mm: edge, pitch_mm: pitch, stripWidth_mm: stripWidth, rows,
        partArea_mm2: A, blankArea_mm2: pitch * stripWidth / rows,
        utilisation, scrapPercent: (1 - utilisation) * 100, partsPerStrip, warnings,
        steps: [
          Step('گام / pitch', 'p = L_part + bridge', pitch, 'mm'),
          Step('عرض نوار / strip width', 'W = n·w + (n−1)·bridge + 2·edge', stripWidth, 'mm'),
          Step('بازده / utilisation', 'η = n·A_part/(p·W)', utilisation, '—'),
        ],
      };
    },

    /**
     * Complete blanking/punching job in one call — combines clearance + force + punch check.
     * @param {object} o merged options of clearance() and force()
     */
    operation(o) {
      const cl = cutting.clearance(o);
      const perim = o.perimeter !== undefined ? o.perimeter : Math.PI * o.size;
      const fr = cutting.force(Object.assign({}, o, { perimeter: perim }));
      const pc = cutting.punchCheck({
        punchDiameter: cl.punchSize_mm, force_N: fr.cuttingForce_N,
        punchLength: o.punchLength, t: o.t, E: o.E, allowableStress: o.allowableStress,
      });
      return {
        clearance: cl, force: fr, punch: pc,
        summary: {
          punchSize_mm: cl.punchSize_mm, dieSize_mm: cl.dieSize_mm,
          cuttingForce_kN: fr.cuttingForce_kN, totalForce_kN: fr.totalForce_kN,
          pressRating_kN: fr.pressRating_kN, energy_J: fr.energy_J,
          punchStress_MPa: pc.punchStress_MPa,
        },
        warnings: [].concat(cl.warnings, fr.warnings, pc.warnings),
      };
    },
  };

  // ────────────────────────────────────────────────────────────────────────
  // 4. Bending — خم‌کاری
  // ────────────────────────────────────────────────────────────────────────

  const bending = {
    /** K-factor from R/t ratio */
    kFactor(R, t, simplified = false) {
      pos(R, 'R'); pos(t, 't');
      if (simplified) return R < 2 * t ? 0.33 : 0.50;
      const ratio = R / t;
      if (ratio < 0.5) return 0.30;
      if (ratio < 1.5) return 0.33;
      if (ratio < 3) return 0.40;
      return 0.45;
    },

    /**
     * Bend allowance, deduction, flat pattern — طول خم و گسترده.
     * @param {object} o {angle_deg (bend/rotation angle), R (inside radius),
     *                    t, K (optional), simplifiedK=true, legs: number[] (outside leg lengths, optional)}
     */
    allowance(o) {
      const a = pos(o.angle_deg, 'angle_deg');
      const R = pos(o.R, 'R');
      const t = pos(o.t, 't');
      const K = (typeof o.K === 'number') ? o.K : bending.kFactor(R, t, o.simplifiedK !== false);
      const warnings = [];

      const BA = rad(a) * (R + K * t);
      const OSSB = (R + t) * Math.tan(rad(a) / 2);
      const BD = 2 * OSSB - BA;

      let flatLength = null;
      if (Array.isArray(o.legs)) {
        flatLength = o.legs.reduce((s, L) => s + L, 0) - BD * (o.legs.length - 1);
      }
      if (a >= 180) warnings.push('زاویه ≥ 180° — برای هم (hem) از محاسبه جداگانه استفاده کنید / use hemming calculation');
      return {
        angle_deg: a, R, t, K, bendAllowance_mm: BA, OSSB_mm: OSSB, bendDeduction_mm: BD,
        flatLength_mm: flatLength, warnings,
        steps: [
          Step('ضریب K / K-factor', 'از نسبت R/t', K, '—'),
          Step('طول خم / bend allowance', 'BA = α·(R + K·t)', BA, 'mm'),
          Step('OSSB', '(R + t)·tan(α/2)', OSSB, 'mm'),
          Step('کسر خم / bend deduction', 'BD = 2·OSSB − BA', BD, 'mm'),
        ],
      };
    },

    /**
     * Bending force — نیروی خم.
     * @param {object} o {w (bend line length, mm), t, dieOpening (mm), UTS (MPa) or materialKey,
     *                    dieType='v_die', mode='air'}
     */
    force(o) {
      const w = pos(o.w, 'w');
      const t = pos(o.t, 't');
      const D = pos(o.dieOpening, 'dieOpening');
      const mat = SHEET_MATERIALS[o.materialKey];
      const UTS = (typeof o.UTS === 'number') ? o.UTS : (mat ? mat.UTS : null);
      if (!UTS) throw new Error('bending.force: supply UTS or materialKey');
      const dt = BEND_COEFF[o.dieType || 'v_die'];
      const md = BEND_MODE[o.mode || 'air'];
      const warnings = [];

      const Fair = dt.Kbf * UTS * w * t * t / D;
      const F = Fair * md.mult;

      if (D < 6 * t) warnings.push(`دهانه ماتریس ${D} mm < 6t = ${round(6 * t)} mm — نیرو بسیار بالا و خطر ترک / die opening too small`);
      if (D > 12 * t) warnings.push(`دهانه ماتریس > 12t — برگشت فنری زیاد و شعاع بزرگ / die opening too large`);

      return {
        dieType: `${dt.fa} / ${dt.en}`, Kbf: dt.Kbf, mode: `${md.fa} / ${md.en}`, modeMultiplier: md.mult,
        UTS, dieOpening_mm: D, dieOpeningRatio: D / t,
        airBendForce_N: Fair, force_N: F, force_kN: F / 1000, force_tonf: F / 9806.65,
        pressRating_kN: 1.2 * F / 1000,
        estimatedAirBendRadius_mm: 0.16 * D,
        springbackNote: md.springback, warnings,
        steps: [
          Step('نیروی خم در هوا', 'F = Kbf·UTS·w·t²/D', Fair, 'N'),
          Step('نیروی نهایی / final force', `× ${md.mult} (${md.en})`, F, 'N'),
        ],
      };
    },

    /**
     * Springback — برگشت فنری (Kalpakjian).
     * @param {object} o {Ri (inside radius under load, mm), t, Y (MPa), E (MPa) or materialKey,
     *                    targetAngle_deg (optional)}
     */
    springback(o) {
      const Ri = pos(o.Ri, 'Ri');
      const t = pos(o.t, 't');
      const mat = SHEET_MATERIALS[o.materialKey];
      const Y = (typeof o.Y === 'number') ? o.Y : (mat ? mat.Y : null);
      const E = (typeof o.E === 'number') ? o.E : (mat ? mat.E : null);
      if (!Y || !E) throw new Error('springback: supply Y and E, or materialKey');
      const warnings = [];
      if (E < 1000) warnings.push('E به نظر بر حسب GPa است — باید MPa باشد / E looks like GPa, must be MPa');

      const x = Ri * Y / (E * t);
      const ratio = 4 * Math.pow(x, 3) - 3 * x + 1;          // Ri/Rf
      const Rf = Ri / ratio;
      const Ks = (2 * Ri / t + 1) / (2 * Rf / t + 1);

      let dieAngle = null, overbend = null;
      if (typeof o.targetAngle_deg === 'number') {
        dieAngle = o.targetAngle_deg / Ks;
        overbend = dieAngle - o.targetAngle_deg;
      }
      if (Ks < 0.95) warnings.push('برگشت فنری شدید (Ks < 0.95) — جبران قالب یا bottoming لازم است / severe springback');
      if (Ri / t > 20) warnings.push('R/t > 20 — برگشت فنری بسیار حساس، فرمول دقت خود را از دست می‌دهد / formula loses accuracy');

      return {
        Ri, Y, E, RiYEt: x, radiusRatio: ratio, finalRadius_mm: Rf,
        radiusIncrease_mm: Rf - Ri, springbackFactor: Ks,
        requiredDieAngle_deg: dieAngle, overbend_deg: overbend, warnings,
        steps: [
          Step('پارامتر بی‌بعد', 'Ri·Y/(E·t)', x, '—'),
          Step('نسبت شعاع / radius ratio', 'Ri/Rf = 4x³ − 3x + 1', ratio, '—'),
          Step('شعاع نهایی / final radius', 'Rf = Ri/ratio', Rf, 'mm'),
          Step('ضریب برگشت / springback factor', 'Ks = (2Ri/t+1)/(2Rf/t+1)', Ks, '—'),
        ],
      };
    },

    /**
     * Bend design checks — قواعد طراحی خم.
     * @param {object} o {R, t, flangeLength (mm), holeDistance (mm, optional),
     *                    materialKey or RbT (R_min/t), grainDirection: 'perpendicular'|'parallel'}
     */
    designCheck(o) {
      const R = pos(o.R, 'R');
      const t = pos(o.t, 't');
      const mat = SHEET_MATERIALS[o.materialKey];
      let RbT = (typeof o.RbT === 'number') ? o.RbT : (mat ? mat.RbT : null);
      if (RbT === null) throw new Error('designCheck: supply RbT or materialKey');
      const warnings = [];

      let Rmin = RbT * t;
      let grainNote = 'خم عمود بر جهت نورد / bend perpendicular to rolling direction';
      if (o.grainDirection === 'parallel') {
        Rmin *= 1.75;
        grainNote = 'خم موازی جهت نورد — R_min ×1.75 / bend parallel to grain';
      }

      const minFlange = 2.5 * t + R;
      const minHoleDistance = 2.5 * t + R;
      const minBetweenBends = 3 * t;

      if (R < Rmin) warnings.push(`R = ${R} mm < R_min = ${round(Rmin)} mm — ترک سطح خارجی / outer surface will crack`);
      if (typeof o.flangeLength === 'number' && o.flangeLength < minFlange) {
        warnings.push(`طول لبه ${o.flangeLength} mm < ${round(minFlange)} mm — لبه در ماتریس نمی‌نشیند / flange too short`);
      }
      if (typeof o.holeDistance === 'number' && o.holeDistance < minHoleDistance) {
        warnings.push(`فاصله سوراخ تا خم کمتر از ${round(minHoleDistance)} mm — سوراخ بیضی می‌شود / hole will distort`);
      }

      return {
        minBendRadius_mm: Rmin, RbT, grainNote,
        minFlangeLength_mm: minFlange, minHoleDistance_mm: minHoleDistance,
        minDistanceBetweenBends_mm: minBetweenBends,
        recommendedDieOpening_mm: [6 * t, 8 * t, 12 * t], warnings,
      };
    },
  };

  // ────────────────────────────────────────────────────────────────────────
  // 5. Deep drawing — کشش عمیق
  // ────────────────────────────────────────────────────────────────────────

  const drawing = {
    /**
     * Blank diameter for a cylindrical cup — قطر بلانک.
     * @param {object} o {d (cup mean diameter), h (cup height), r (bottom corner radius, mm),
     *                    trimAllowance=0.03}
     */
    blankDiameter(o) {
      const d = pos(o.d, 'd');
      const h = pos(o.h, 'h');
      const r = o.r === undefined ? 0 : o.r;
      const trim = o.trimAllowance === undefined ? 0.03 : o.trimAllowance;
      const warnings = [];

      let Db, formula;
      if (r <= 0 || d / r > 20) {
        Db = Math.sqrt(d * d + 4 * d * h);
        formula = 'Db = √(d² + 4dh)';
      } else if (d / r > 15) {
        Db = Math.sqrt(d * d + 4 * d * h - 0.5 * r);
        formula = 'Db = √(d² + 4dh − 0.5r)';
      } else if (d / r > 10) {
        Db = Math.sqrt(d * d + 4 * d * h - r);
        formula = 'Db = √(d² + 4dh − r)';
      } else {
        Db = Math.sqrt(Math.pow(d - 2 * r, 2) + 4 * d * (h - r) + 2 * Math.PI * r * (d - 0.7 * r));
        formula = 'Db = √((d−2r)² + 4d(h−r) + 2πr(d−0.7r))';
      }
      const DbTrim = Db * (1 + trim);
      if (r > d / 4) warnings.push('شعاع گوشه بیش از یک‌چهارم قطر — هندسه فنجان نیست / geometry is not a cup');

      return {
        blankDiameter_mm: Db, blankDiameterWithTrim_mm: DbTrim, trimAllowance: trim,
        blankArea_mm2: areaOfCircle(Db), formula, cornerRadius_mm: r, dOverR: r > 0 ? d / r : Infinity,
        warnings,
        steps: [
          Step('قطر بلانک / blank diameter', formula, Db, 'mm'),
          Step('با اضافه پیرایش / with trim', `× (1 + ${trim})`, DbTrim, 'mm'),
        ],
      };
    },

    /** Cup height achievable from a given blank — ارتفاع فنجان از بلانک. */
    cupHeight({ Db, Dp }) {
      pos(Db, 'Db'); pos(Dp, 'Dp');
      if (Dp >= Db) throw new RangeError('cupHeight: Dp must be < Db');
      const h = (Db * Db - Dp * Dp) / (4 * Dp);
      return { height_mm: h, drawRatio: Db / Dp, steps: [Step('ارتفاع / height', 'h = (Db² − Dp²)/(4Dp)', h, 'mm')] };
    },

    /**
     * Feasibility of a single draw — امکان‌سنجی کشش یک‌مرحله‌ای.
     * @param {object} o {Db, Dp, t, rBar (optional or materialKey)}
     */
    feasibility(o) {
      const Db = pos(o.Db, 'Db');
      const Dp = pos(o.Dp, 'Dp');
      const t = pos(o.t, 't');
      const mat = SHEET_MATERIALS[o.materialKey];
      const rBar = (typeof o.rBar === 'number') ? o.rBar : (mat ? mat.rBar : null);
      const warnings = [];

      const DR = Db / Dp;
      const reduction = (Db - Dp) / Db;
      const tRatio = t / Db;
      const ldr = rBar ? core.limitingDrawRatio(rBar).LDR : 2.0;

      const okDR = DR <= 2.0;
      const okRed = reduction <= 0.50;
      const okT = tRatio >= 0.01;
      const okLDR = DR <= ldr;

      if (!okDR) warnings.push(`DR = ${round(DR)} > 2.0 — یک مرحله کافی نیست، کشش چندمرحله‌ای لازم است / multi-stage drawing required`);
      if (!okRed) warnings.push(`کاهش ${round(reduction * 100, 3)}٪ > 50٪ — فراتر از حد یک مرحله / reduction beyond single-stage limit`);
      if (!okT) warnings.push(`t/Db = ${round(tRatio * 100, 3)}٪ < 1٪ — خطر چروکیدگی شدید، ورق‌گیر حیاتی / severe wrinkling risk`);
      if (rBar && !okLDR) warnings.push(`DR = ${round(DR)} بیش از LDR این ماده (${round(ldr)}) / exceeds this material's LDR`);

      return {
        drawRatio: DR, reduction, thicknessRatio: tRatio, rBar, LDR: ldr,
        feasible: okDR && okRed && okT && okLDR,
        checks: {
          drawRatio: { value: DR, limit: 2.0, pass: okDR },
          reduction: { value: reduction, limit: 0.50, pass: okRed },
          thicknessRatio: { value: tRatio, limit: 0.01, pass: okT, comparison: '≥' },
          LDR: { value: DR, limit: ldr, pass: okLDR },
        },
        warnings,
      };
    },

    /**
     * Deep drawing force, blankholder force, tooling — نیرو و ابزار کشش عمیق.
     * @param {object} o {Db, Dp, t, UTS, Y (or materialKey), Rd (die corner radius, mm),
     *                    clearanceFactor=1.1, cupHeight (optional, for energy)}
     */
    force(o) {
      const Db = pos(o.Db, 'Db');
      const Dp = pos(o.Dp, 'Dp');
      const t = pos(o.t, 't');
      const mat = SHEET_MATERIALS[o.materialKey];
      const UTS = (typeof o.UTS === 'number') ? o.UTS : (mat ? mat.UTS : null);
      const Y = (typeof o.Y === 'number') ? o.Y : (mat ? mat.Y : null);
      if (!UTS || !Y) throw new Error('drawing.force: supply UTS and Y, or materialKey');
      const Rd = o.Rd === undefined ? 6 * t : o.Rd;
      const cf = o.clearanceFactor === undefined ? 1.1 : o.clearanceFactor;
      const warnings = [];

      const DR = Db / Dp;
      const Fdraw = Math.PI * Dp * t * UTS * (DR - 0.7);
      const holderRing = Dp + 2.2 * t + 2 * Rd;
      const bracket = Db * Db - holderRing * holderRing;
      const Fhold = bracket > 0 ? 0.015 * Y * Math.PI * bracket : 0;
      const Ftotal = Fdraw + Fhold;
      const clearance = cf * t;

      let energy = null;
      if (typeof o.cupHeight === 'number') energy = 0.7 * Fdraw * o.cupHeight / 1000;

      if (bracket <= 0) warnings.push('حلقه ورق‌گیر بزرگ‌تر از بلانک است — Rd یا Dp را بررسی کنید / blankholder ring exceeds blank');
      if (Rd < 4 * t) warnings.push(`Rd = ${round(Rd)} mm < 4t — خطر پارگی روی شعاع ماتریس / tearing risk at die radius`);
      if (Rd > 10 * t) warnings.push(`Rd > 10t — ناحیه بدون تکیه‌گاه زیاد، چروکیدگی / unsupported area too large`);
      if (cf < 1.0) warnings.push('لقی کمتر از ضخامت — اتوکشی (ironing) رخ می‌دهد و نیروی اضافی می‌خواهد / ironing will occur');
      if (Fhold / Fdraw > 0.6) warnings.push('نیروی ورق‌گیر بیش از 60٪ نیروی کشش — خطر پارگی کف / blankholder force may cause bottom fracture');

      return {
        drawRatio: DR, UTS, Y,
        drawForce_N: Fdraw, drawForce_kN: Fdraw / 1000, drawForce_tonf: Fdraw / 9806.65,
        blankholderForce_N: Fhold, blankholderForce_kN: Fhold / 1000,
        holderForceRatio: Fdraw > 0 ? Fhold / Fdraw : null,
        totalForce_N: Ftotal, totalForce_kN: Ftotal / 1000, totalForce_tonf: Ftotal / 9806.65,
        pressRating_kN: 1.2 * Ftotal / 1000,
        dieCornerRadius_mm: Rd, recommendedRd_mm: [4 * t, 6 * t, 10 * t],
        punchCornerRadius_mm: [3 * t, 10 * t],
        clearancePerSide_mm: clearance, energy_J: energy, warnings,
        steps: [
          Step('نیروی کشش / draw force', 'F = π·Dp·t·UTS·(Db/Dp − 0.7)', Fdraw, 'N'),
          Step('نیروی ورق‌گیر / blankholder', 'Fh = 0.015·Y·π·[Db² − (Dp+2.2t+2Rd)²]', Fhold, 'N'),
          Step('نیروی کل / total', 'F + Fh', Ftotal, 'N'),
          Step('لقی / clearance', `${cf}·t`, clearance, 'mm'),
        ],
      };
    },

    /**
     * Multi-stage redraw plan — برنامه کشش چندمرحله‌ای.
     * @param {object} o {Db, DpFinal, t, materialKey or {UTS,Y,rBar}, Rd}
     */
    redrawPlan(o) {
      const Db = pos(o.Db, 'Db');
      const DpF = pos(o.DpFinal, 'DpFinal');
      const t = pos(o.t, 't');
      if (DpF >= Db) throw new RangeError('redrawPlan: DpFinal must be < Db');
      const stages = [];
      let D = Db, i = 0;
      const warnings = [];

      while (D > DpF && i < 10) {
        const lim = REDRAW_LIMITS[Math.min(i, REDRAW_LIMITS.length - 1)];
        const DRmax = lim.DRmax;
        let Dnext = D / DRmax;
        if (Dnext <= DpF) Dnext = DpF;
        const f = drawing.force(Object.assign({}, o, { Db: D, Dp: Dnext, t }));
        stages.push({
          stage: i + 1, Din_mm: round(D), Dout_mm: round(Dnext),
          drawRatio: round(D / Dnext), reduction: round((D - Dnext) / D),
          allowedDRmax: DRmax,
          drawForce_kN: f.drawForce_kN, blankholderForce_kN: f.blankholderForce_kN,
          totalForce_kN: f.totalForce_kN,
        });
        D = Dnext; i++;
      }
      if (i >= 10) warnings.push('بیش از 10 مرحله — نسبت کشش کل غیرعملی است / drawing ratio impractical');
      const totalStrain = 2 * Math.log(Db / DpF);
      if (totalStrain > 1.5) warnings.push('کرنش تجمعی بالا — آنیل میانی احتمالاً لازم است / intermediate anneal likely required');

      return {
        stages, nStages: stages.length, overallDrawRatio: Db / DpF, totalStrain,
        maxForce_kN: stages.length ? Math.max(...stages.map((s) => s.totalForce_kN)) : 0,
        warnings,
      };
    },

    /** Ironing force when clearance < t — نیروی اتوکشی. */
    ironing({ dMean, t0, tf, UTS, materialKey }) {
      pos(dMean, 'dMean'); pos(t0, 't0'); pos(tf, 'tf');
      const mat = SHEET_MATERIALS[materialKey];
      const uts = (typeof UTS === 'number') ? UTS : (mat ? mat.UTS : null);
      if (!uts) throw new Error('ironing: supply UTS or materialKey');
      if (tf >= t0) throw new RangeError('ironing: tf must be < t0');
      const F = Math.PI * dMean * tf * uts * Math.log(t0 / tf);
      const reduction = 1 - tf / t0;
      const warnings = [];
      if (reduction > 0.40) warnings.push('کاهش ضخامت > 40٪ در یک مرحله اتوکشی — خطر پارگی دیواره / wall tearing risk');
      return {
        thicknessReduction: reduction, force_N: F, force_kN: F / 1000, warnings,
        steps: [Step('نیروی اتوکشی / ironing force', 'F = π·d·tf·UTS·ln(t0/tf)', F, 'N')],
      };
    },

    /** Earing estimate from planar anisotropy — گوش‌دار شدن. */
    earing({ deltaR, cupHeight }) {
      req(deltaR, 'deltaR'); pos(cupHeight, 'cupHeight');
      // empirical: ear height amplitude roughly proportional to |Δr|
      const amplitude = Math.abs(deltaR) * 0.12 * cupHeight;
      const trimAllowance = amplitude * 2;
      const warnings = [];
      if (Math.abs(deltaR) > 0.4) warnings.push('|Δr| > 0.4 — گوش‌دار شدن قابل توجه، اضافه پیرایش لازم / significant earing, allow for trimming');
      return {
        deltaR, earAmplitude_mm: amplitude, recommendedTrimAllowance_mm: trimAllowance,
        earPositions: deltaR > 0 ? '0° و 90° نسبت به جهت نورد' : '45° نسبت به جهت نورد',
        warnings,
      };
    },
  };

  // ────────────────────────────────────────────────────────────────────────
  // 6. UI metadata — برای ساخت خودکار فرم‌ها
  // ────────────────────────────────────────────────────────────────────────

  const matOptions = Object.keys(SHEET_MATERIALS);

  const UI = {
    groups: [
      {
        key: 'cutting', fa: 'برشکاری', en: 'Cutting',
        calcs: [
          { key: 'operation', fa: 'عملیات برش کامل', en: 'Complete cutting operation',
            fields: [
              { key: 'operation', fa: 'نوع عملیات', en: 'Operation', unit: 'select', options: ['blanking', 'punching'] },
              { key: 'size', fa: 'اندازه اسمی (قطر بلانک یا سوراخ)', en: 'Nominal size', unit: 'mm' },
              { key: 't', fa: 'ضخامت ورق', en: 'Sheet thickness', unit: 'mm' },
              { key: 'materialKey', fa: 'ماده', en: 'Material', unit: 'select', options: matOptions },
              { key: 'perimeter', fa: 'محیط برش (اختیاری، پیش‌فرض دایره)', en: 'Cut perimeter (optional)', unit: 'mm' },
              { key: 'shearDepth', fa: 'عمق شیب ابزار', en: 'Tool bevel depth', unit: 'mm' },
              { key: 'punchLength', fa: 'طول آزاد سنبه', en: 'Unsupported punch length', unit: 'mm' },
            ],
            outputs: ['punchSize_mm', 'dieSize_mm', 'cuttingForce_kN', 'totalForce_kN', 'pressRating_kN', 'energy_J', 'punchStress_MPa'] },
          { key: 'clearance', fa: 'لقی و ابعاد ابزار', en: 'Clearance & tool sizing',
            fields: [
              { key: 't', fa: 'ضخامت', en: 'Thickness', unit: 'mm' },
              { key: 'size', fa: 'اندازه اسمی', en: 'Nominal size', unit: 'mm' },
              { key: 'operation', fa: 'نوع عملیات', en: 'Operation', unit: 'select', options: ['blanking', 'punching'] },
              { key: 'materialKey', fa: 'ماده', en: 'Material', unit: 'select', options: matOptions },
            ],
            outputs: ['clearancePerSide_mm', 'punchSize_mm', 'dieSize_mm'] },
          { key: 'force', fa: 'نیرو و انرژی برش', en: 'Cutting force & energy',
            fields: [
              { key: 't', fa: 'ضخامت', en: 'Thickness', unit: 'mm' },
              { key: 'perimeter', fa: 'محیط برش', en: 'Cut perimeter', unit: 'mm' },
              { key: 'materialKey', fa: 'ماده', en: 'Material', unit: 'select', options: matOptions },
              { key: 'shearDepth', fa: 'عمق شیب', en: 'Bevel depth', unit: 'mm' },
              { key: 'stripFactor', fa: 'ضریب جداکننده', en: 'Stripping factor', unit: '—' },
              { key: 'penetrationClass', fa: 'کلاس نفوذ', en: 'Penetration class', unit: 'select', options: Object.keys(PENETRATION) },
            ],
            outputs: ['cuttingForce_kN', 'strippingForce_kN', 'totalForce_kN', 'energy_J'] },
          { key: 'stripLayout', fa: 'چیدمان نوار', en: 'Strip layout',
            fields: [
              { key: 'partWidth', fa: 'عرض قطعه', en: 'Part width', unit: 'mm' },
              { key: 'partLength', fa: 'طول قطعه (جهت تغذیه)', en: 'Part length (feed)', unit: 'mm' },
              { key: 'partArea', fa: 'سطح قطعه', en: 'Part area', unit: 'mm²' },
              { key: 't', fa: 'ضخامت', en: 'Thickness', unit: 'mm' },
              { key: 'rows', fa: 'تعداد ردیف', en: 'Rows', unit: '—' },
              { key: 'stripLength', fa: 'طول نوار (اختیاری)', en: 'Strip length (optional)', unit: 'mm' },
            ],
            outputs: ['pitch_mm', 'stripWidth_mm', 'utilisation', 'scrapPercent', 'partsPerStrip'] },
          { key: 'guillotine', fa: 'برش با گیوتین', en: 'Guillotine shearing',
            fields: [
              { key: 't', fa: 'ضخامت', en: 'Thickness', unit: 'mm' },
              { key: 'UTS', fa: 'استحکام کششی', en: 'UTS', unit: 'MPa' },
              { key: 'rakeAngle_deg', fa: 'زاویه تیغه', en: 'Rake angle', unit: 'deg' },
            ],
            outputs: ['force_kN', 'force_tonf'] },
        ],
      },
      {
        key: 'bending', fa: 'خم‌کاری', en: 'Bending',
        calcs: [
          { key: 'allowance', fa: 'طول خم و گسترده', en: 'Bend allowance & flat pattern',
            fields: [
              { key: 'angle_deg', fa: 'زاویه خم', en: 'Bend angle', unit: 'deg' },
              { key: 'R', fa: 'شعاع داخلی', en: 'Inside radius', unit: 'mm' },
              { key: 't', fa: 'ضخامت', en: 'Thickness', unit: 'mm' },
              { key: 'K', fa: 'ضریب K (اختیاری)', en: 'K-factor (optional)', unit: '—' },
            ],
            outputs: ['bendAllowance_mm', 'bendDeduction_mm', 'OSSB_mm', 'K'] },
          { key: 'force', fa: 'نیروی خم', en: 'Bending force',
            fields: [
              { key: 'w', fa: 'طول خط خم', en: 'Bend line length', unit: 'mm' },
              { key: 't', fa: 'ضخامت', en: 'Thickness', unit: 'mm' },
              { key: 'dieOpening', fa: 'دهانه ماتریس', en: 'Die opening', unit: 'mm' },
              { key: 'materialKey', fa: 'ماده', en: 'Material', unit: 'select', options: matOptions },
              { key: 'dieType', fa: 'نوع قالب', en: 'Die type', unit: 'select', options: Object.keys(BEND_COEFF) },
              { key: 'mode', fa: 'روش خم', en: 'Bending mode', unit: 'select', options: Object.keys(BEND_MODE) },
            ],
            outputs: ['force_kN', 'force_tonf', 'pressRating_kN', 'estimatedAirBendRadius_mm'] },
          { key: 'springback', fa: 'برگشت فنری', en: 'Springback',
            fields: [
              { key: 'Ri', fa: 'شعاع داخلی زیر بار', en: 'Loaded inside radius', unit: 'mm' },
              { key: 't', fa: 'ضخامت', en: 'Thickness', unit: 'mm' },
              { key: 'materialKey', fa: 'ماده', en: 'Material', unit: 'select', options: matOptions },
              { key: 'targetAngle_deg', fa: 'زاویه هدف', en: 'Target angle', unit: 'deg' },
            ],
            outputs: ['finalRadius_mm', 'springbackFactor', 'requiredDieAngle_deg', 'overbend_deg'] },
          { key: 'designCheck', fa: 'بررسی قواعد طراحی', en: 'Design rule check',
            fields: [
              { key: 'R', fa: 'شعاع خم', en: 'Bend radius', unit: 'mm' },
              { key: 't', fa: 'ضخامت', en: 'Thickness', unit: 'mm' },
              { key: 'materialKey', fa: 'ماده', en: 'Material', unit: 'select', options: matOptions },
              { key: 'flangeLength', fa: 'طول لبه', en: 'Flange length', unit: 'mm' },
              { key: 'holeDistance', fa: 'فاصله سوراخ تا خم', en: 'Hole-to-bend distance', unit: 'mm' },
              { key: 'grainDirection', fa: 'جهت نسبت به نورد', en: 'Grain direction', unit: 'select', options: ['perpendicular', 'parallel'] },
            ],
            outputs: ['minBendRadius_mm', 'minFlangeLength_mm', 'minHoleDistance_mm'] },
        ],
      },
      {
        key: 'drawing', fa: 'کشش عمیق', en: 'Deep drawing',
        calcs: [
          { key: 'blankDiameter', fa: 'قطر بلانک', en: 'Blank diameter',
            fields: [
              { key: 'd', fa: 'قطر متوسط فنجان', en: 'Cup mean diameter', unit: 'mm' },
              { key: 'h', fa: 'ارتفاع فنجان', en: 'Cup height', unit: 'mm' },
              { key: 'r', fa: 'شعاع گوشه کف', en: 'Bottom corner radius', unit: 'mm' },
              { key: 'trimAllowance', fa: 'اضافه پیرایش', en: 'Trim allowance', unit: '—' },
            ],
            outputs: ['blankDiameter_mm', 'blankDiameterWithTrim_mm', 'blankArea_mm2'] },
          { key: 'feasibility', fa: 'امکان‌سنجی کشش', en: 'Draw feasibility',
            fields: [
              { key: 'Db', fa: 'قطر بلانک', en: 'Blank diameter', unit: 'mm' },
              { key: 'Dp', fa: 'قطر سنبه', en: 'Punch diameter', unit: 'mm' },
              { key: 't', fa: 'ضخامت', en: 'Thickness', unit: 'mm' },
              { key: 'materialKey', fa: 'ماده', en: 'Material', unit: 'select', options: matOptions },
            ],
            outputs: ['drawRatio', 'reduction', 'thicknessRatio', 'LDR', 'feasible'] },
          { key: 'force', fa: 'نیروی کشش و ورق‌گیر', en: 'Draw & blankholder force',
            fields: [
              { key: 'Db', fa: 'قطر بلانک', en: 'Blank diameter', unit: 'mm' },
              { key: 'Dp', fa: 'قطر سنبه', en: 'Punch diameter', unit: 'mm' },
              { key: 't', fa: 'ضخامت', en: 'Thickness', unit: 'mm' },
              { key: 'materialKey', fa: 'ماده', en: 'Material', unit: 'select', options: matOptions },
              { key: 'Rd', fa: 'شعاع گوشه ماتریس', en: 'Die corner radius', unit: 'mm' },
              { key: 'cupHeight', fa: 'ارتفاع فنجان (برای انرژی)', en: 'Cup height (for energy)', unit: 'mm' },
            ],
            outputs: ['drawForce_kN', 'blankholderForce_kN', 'totalForce_kN', 'pressRating_kN', 'clearancePerSide_mm', 'energy_J'] },
          { key: 'redrawPlan', fa: 'برنامه کشش چندمرحله‌ای', en: 'Multi-stage redraw plan',
            fields: [
              { key: 'Db', fa: 'قطر بلانک', en: 'Blank diameter', unit: 'mm' },
              { key: 'DpFinal', fa: 'قطر نهایی', en: 'Final punch diameter', unit: 'mm' },
              { key: 't', fa: 'ضخامت', en: 'Thickness', unit: 'mm' },
              { key: 'materialKey', fa: 'ماده', en: 'Material', unit: 'select', options: matOptions },
            ],
            outputs: ['nStages', 'overallDrawRatio', 'maxForce_kN', 'totalStrain'] },
        ],
      },
    ],
    labels: {
      // cutting
      clearancePerSide_mm: { fa: 'لقی یک‌طرفه', en: 'Clearance per side', unit: 'mm' },
      punchSize_mm: { fa: 'قطر سنبه', en: 'Punch size', unit: 'mm' },
      dieSize_mm: { fa: 'قطر ماتریس', en: 'Die size', unit: 'mm' },
      cuttingForce_kN: { fa: 'نیروی برش', en: 'Cutting force', unit: 'kN' },
      strippingForce_kN: { fa: 'نیروی جداکننده', en: 'Stripping force', unit: 'kN' },
      totalForce_kN: { fa: 'نیروی کل', en: 'Total force', unit: 'kN' },
      totalForce_tonf: { fa: 'نیروی کل', en: 'Total force', unit: 'tonf' },
      pressRating_kN: { fa: 'ظرفیت پرس پیشنهادی', en: 'Suggested press rating', unit: 'kN' },
      energy_J: { fa: 'انرژی', en: 'Energy', unit: 'J' },
      punchStress_MPa: { fa: 'تنش سنبه', en: 'Punch stress', unit: 'MPa' },
      maxUnsupportedLength_mm: { fa: 'حد طول آزاد سنبه', en: 'Max unsupported punch length', unit: 'mm' },
      pitch_mm: { fa: 'گام', en: 'Pitch', unit: 'mm' },
      stripWidth_mm: { fa: 'عرض نوار', en: 'Strip width', unit: 'mm' },
      utilisation: { fa: 'بازده مواد', en: 'Material utilisation', unit: '—' },
      scrapPercent: { fa: 'درصد ضایعات', en: 'Scrap', unit: '%' },
      partsPerStrip: { fa: 'قطعه در هر نوار', en: 'Parts per strip', unit: '—' },
      force_kN: { fa: 'نیرو', en: 'Force', unit: 'kN' },
      force_tonf: { fa: 'نیرو', en: 'Force', unit: 'tonf' },
      // bending
      bendAllowance_mm: { fa: 'طول خم', en: 'Bend allowance', unit: 'mm' },
      bendDeduction_mm: { fa: 'کسر خم', en: 'Bend deduction', unit: 'mm' },
      OSSB_mm: { fa: 'OSSB', en: 'Outside setback', unit: 'mm' },
      K: { fa: 'ضریب K', en: 'K-factor', unit: '—' },
      flatLength_mm: { fa: 'طول گسترده', en: 'Flat length', unit: 'mm' },
      estimatedAirBendRadius_mm: { fa: 'شعاع تخمینی خم در هوا', en: 'Est. air-bend radius', unit: 'mm' },
      finalRadius_mm: { fa: 'شعاع پس از برگشت', en: 'Radius after springback', unit: 'mm' },
      springbackFactor: { fa: 'ضریب برگشت فنری', en: 'Springback factor', unit: '—' },
      requiredDieAngle_deg: { fa: 'زاویه قالب لازم', en: 'Required die angle', unit: 'deg' },
      overbend_deg: { fa: 'اضافه‌خم', en: 'Overbend', unit: 'deg' },
      minBendRadius_mm: { fa: 'حداقل شعاع خم', en: 'Min bend radius', unit: 'mm' },
      minFlangeLength_mm: { fa: 'حداقل طول لبه', en: 'Min flange length', unit: 'mm' },
      minHoleDistance_mm: { fa: 'حداقل فاصله سوراخ', en: 'Min hole distance', unit: 'mm' },
      // drawing
      blankDiameter_mm: { fa: 'قطر بلانک', en: 'Blank diameter', unit: 'mm' },
      blankDiameterWithTrim_mm: { fa: 'قطر بلانک با پیرایش', en: 'Blank dia. with trim', unit: 'mm' },
      blankArea_mm2: { fa: 'سطح بلانک', en: 'Blank area', unit: 'mm²' },
      drawRatio: { fa: 'نسبت کشش', en: 'Draw ratio', unit: '—' },
      reduction: { fa: 'نسبت کاهش', en: 'Reduction', unit: '—' },
      thicknessRatio: { fa: 'نسبت ضخامت t/Db', en: 'Thickness ratio', unit: '—' },
      LDR: { fa: 'حد کشش', en: 'Limiting draw ratio', unit: '—' },
      feasible: { fa: 'امکان‌پذیر', en: 'Feasible', unit: '—' },
      drawForce_kN: { fa: 'نیروی کشش', en: 'Draw force', unit: 'kN' },
      blankholderForce_kN: { fa: 'نیروی ورق‌گیر', en: 'Blankholder force', unit: 'kN' },
      nStages: { fa: 'تعداد مراحل', en: 'Number of stages', unit: '—' },
      overallDrawRatio: { fa: 'نسبت کشش کل', en: 'Overall draw ratio', unit: '—' },
      maxForce_kN: { fa: 'بیشترین نیرو', en: 'Peak force', unit: 'kN' },
      totalStrain: { fa: 'کرنش کل', en: 'Total strain', unit: '—' },
      height_mm: { fa: 'ارتفاع', en: 'Height', unit: 'mm' },
    },
  };

  // ────────────────────────────────────────────────────────────────────────
  // 7. Unit helpers (display layer only)
  // ────────────────────────────────────────────────────────────────────────

  const units = {
    N_to_kN: (x) => x / 1000,
    N_to_tonf: (x) => x / 9806.65,
    N_to_lbf: (x) => x / 4.4482216,
    MPa_to_ksi: (x) => x / 6.894757,
    MPa_to_kgf_mm2: (x) => x / 9.80665,
    GPa_to_MPa: (x) => x * 1000,
    mm_to_in: (x) => x / 25.4,
    in_to_mm: (x) => x * 25.4,
    mm2_to_in2: (x) => x / 645.16,
    J_to_ftlb: (x) => x / 1.355818,
  };

  // ────────────────────────────────────────────────────────────────────────

  return {
    version: '1.0.0',
    core, cutting, bending, drawing, units, UI,
    data: {
      SHEET_MATERIALS, CLEARANCE_ALLOWANCE, PENETRATION,
      BEND_COEFF, BEND_MODE, REDRAW_LIMITS,
    },
    helpers: { areaOfCircle, rad, deg, round },
  };
});
