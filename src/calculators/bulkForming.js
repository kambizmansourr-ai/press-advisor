/*!
 * bulkForming.js — فرم‌دهی حجمی / Bulk (Massive) Metal Forming
 * Drop-in calculation module for an engineering calculator.
 *
 * UNIT SYSTEM (internal, consistent — do not mix):
 *   length mm | area mm² | stress MPa (= N/mm²) | force N | torque N·mm
 *   power W   | velocity mm/s | angle DEGREES at the API boundary
 *   density kg/m³ | cp J/(kg·K) | temperature °C
 * Because MPa × mm² = N exactly, no conversion factors appear in the force paths.
 *
 * UMD: works as <script>, CommonJS require, or `import BulkForming from './bulkForming.js'`
 *      after adding `export default BulkForming;` at the end.
 *
 * Every function returns a plain object with:
 *   - numeric result fields
 *   - `warnings`: string[]  (bilingual fa/en) — surface these in the UI
 *   - `steps`: {label, expr, value, unit}[] — for a "show working" panel
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BulkForming = factory();
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
      throw new TypeError(`bulkForming: parameter "${name}" must be a finite number (got ${v})`);
    }
    return v;
  }
  function pos(v, name) {
    req(v, name);
    if (v <= 0) throw new RangeError(`bulkForming: parameter "${name}" must be > 0 (got ${v})`);
    return v;
  }
  const areaOfCircle = (d) => Math.PI * d * d / 4;
  const diaOfArea = (A) => Math.sqrt(4 * A / Math.PI);
  const round = (x, p = 4) => {
    if (!isFinite(x)) return x;
    if (x === 0) return 0;
    const m = Math.pow(10, p - 1 - Math.floor(Math.log10(Math.abs(x))));
    return Math.round(x * m) / m;
  };

  function Step(label, expr, value, unit) { return { label, expr, value: round(value), unit }; }

  // ────────────────────────────────────────────────────────────────────────
  // 1. Material data — جداول داده مواد
  // ────────────────────────────────────────────────────────────────────────

  /** Cold-working flow curve σf = K·εⁿ  (K in MPa, room temperature) */
  const MATERIALS_COLD = {
    steel_1010:      { fa: 'فولاد کم‌کربن 1010',      en: 'Low-carbon steel 1010',  K: 530,  n: 0.26 },
    steel_1045:      { fa: 'فولاد 1045',               en: 'Steel 1045',             K: 965,  n: 0.14 },
    steel_4135:      { fa: 'فولاد آلیاژی 4135 آنیل',   en: 'Alloy steel 4135 ann.',  K: 1015, n: 0.17 },
    stainless_304:   { fa: 'فولاد زنگ‌نزن 304',        en: 'Stainless 304',          K: 1275, n: 0.45 },
    stainless_410:   { fa: 'فولاد زنگ‌نزن 410',        en: 'Stainless 410',          K: 960,  n: 0.10 },
    al_1100_O:       { fa: 'آلومینیوم 1100-O',         en: 'Aluminum 1100-O',        K: 180,  n: 0.20 },
    al_2024_T4:      { fa: 'آلومینیوم 2024-T4',        en: 'Aluminum 2024-T4',       K: 690,  n: 0.16 },
    al_6061_O:       { fa: 'آلومینیوم 6061-O',         en: 'Aluminum 6061-O',        K: 205,  n: 0.20 },
    al_7075_O:       { fa: 'آلومینیوم 7075-O',         en: 'Aluminum 7075-O',        K: 400,  n: 0.17 },
    copper_ann:      { fa: 'مس خالص آنیل',             en: 'Copper, annealed',       K: 315,  n: 0.54 },
    brass_70_30:     { fa: 'برنج 70-30',               en: 'Brass 70-30',            K: 895,  n: 0.49 },
    bronze_phosphor: { fa: 'برنز فسفری',               en: 'Phosphor bronze',        K: 720,  n: 0.46 },
    ti_pure:         { fa: 'تیتانیوم خالص آنیل',       en: 'Ti, pure annealed',      K: 700,  n: 0.25 },
    ti_6al4v:        { fa: 'Ti-6Al-4V',                en: 'Ti-6Al-4V',              K: 1015, n: 0.11 },
    mg_az31:         { fa: 'منیزیم AZ31',              en: 'Magnesium AZ31',         K: 450,  n: 0.16 },
    nickel_ann:      { fa: 'نیکل آنیل',                en: 'Nickel, annealed',       K: 640,  n: 0.40 },
    lead:            { fa: 'سرب',                      en: 'Lead',                   K: 30,   n: 0.19 },
  };

  /** Hot-working σf = C·ε̇^m  (C in MPa·s^m) */
  const MATERIALS_HOT = {
    steel_lowC_1000:  { fa: 'فولاد کم‌کربن @1000°C',  en: 'Low-C steel @1000°C',  T: 1000, C: 100, m: 0.10 },
    steel_lowC_1200:  { fa: 'فولاد کم‌کربن @1200°C',  en: 'Low-C steel @1200°C',  T: 1200, C: 50,  m: 0.17 },
    steel_alloy_1000: { fa: 'فولاد آلیاژی @1000°C',   en: 'Alloy steel @1000°C',  T: 1000, C: 160, m: 0.10 },
    stainless_1000:   { fa: 'زنگ‌نزن @1000°C',        en: 'Stainless @1000°C',    T: 1000, C: 170, m: 0.10 },
    al_400:           { fa: 'آلومینیوم @400°C',       en: 'Aluminum @400°C',      T: 400,  C: 60,  m: 0.10 },
    al_alloy_500:     { fa: 'آلیاژ آلومینیوم @500°C', en: 'Al alloys @500°C',     T: 500,  C: 35,  m: 0.12 },
    copper_900:       { fa: 'مس @900°C',              en: 'Copper @900°C',        T: 900,  C: 130, m: 0.06 },
    brass_800:        { fa: 'برنج @800°C',            en: 'Brass @800°C',         T: 800,  C: 40,  m: 0.15 },
    titanium_900:     { fa: 'تیتانیوم @900°C',        en: 'Titanium @900°C',      T: 900,  C: 200, m: 0.12 },
  };

  /** Physical properties: rho kg/m³, cp J/(kg·K), Tm °C, E MPa, nu */
  const PHYSICAL = {
    steel:     { fa: 'فولاد',        en: 'Steel',           rho: 7850, cp: 460,  Tm: 1500, E: 210000, nu: 0.29 },
    stainless: { fa: 'فولاد زنگ‌نزن', en: 'Stainless steel', rho: 7900, cp: 500,  Tm: 1420, E: 195000, nu: 0.29 },
    aluminum:  { fa: 'آلومینیوم',    en: 'Aluminum',        rho: 2700, cp: 900,  Tm: 660,  E: 70000,  nu: 0.33 },
    copper:    { fa: 'مس',           en: 'Copper',          rho: 8960, cp: 385,  Tm: 1085, E: 117000, nu: 0.34 },
    brass:     { fa: 'برنج',         en: 'Brass',           rho: 8500, cp: 380,  Tm: 930,  E: 100000, nu: 0.33 },
    titanium:  { fa: 'تیتانیوم',     en: 'Titanium',        rho: 4510, cp: 520,  Tm: 1670, E: 116000, nu: 0.32 },
    magnesium: { fa: 'منیزیم',       en: 'Magnesium',       rho: 1740, cp: 1020, Tm: 650,  E: 45000,  nu: 0.29 },
    nickel:    { fa: 'نیکل',         en: 'Nickel',          rho: 8900, cp: 440,  Tm: 1455, E: 200000, nu: 0.31 },
  };

  /** Extrusion constant Ke (MPa) at typical hot-extrusion temperature */
  const EXTRUSION_CONSTANT = {
    al_pure:       { fa: 'آلومینیوم خالص', en: 'Al, pure',        T: '400–500', Ke: 120 },
    al_6061:       { fa: 'آلیاژ Al 6061',  en: 'Al 6061',         T: '450–500', Ke: 175 },
    al_7075:       { fa: 'آلیاژ Al 7075',  en: 'Al 7075',         T: '400–450', Ke: 275 },
    copper:        { fa: 'مس',             en: 'Copper',          T: '800–900', Ke: 325 },
    brass:         { fa: 'برنج',           en: 'Brass',           T: '700–800', Ke: 275 },
    steel_lowC:    { fa: 'فولاد کم‌کربن',  en: 'Low-C steel',     T: '1100–1200', Ke: 400 },
    stainless:     { fa: 'فولاد زنگ‌نزن',  en: 'Stainless steel', T: '1100–1200', Ke: 625 },
    titanium:      { fa: 'تیتانیوم',       en: 'Titanium',        T: '900–1000', Ke: 450 },
  };

  /** Friction: Coulomb μ and shear factor m, with typical mid value for defaults */
  const FRICTION = {
    cold_good_lube:   { fa: 'سردکار، روانکار خوب',   en: 'Cold, good lubricant', muMin: 0.05, muMax: 0.10, mu: 0.07, mMin: 0.1, mMax: 0.2 },
    cold_moderate:    { fa: 'سردکار، روانکار معمولی', en: 'Cold, moderate lube',  muMin: 0.10, muMax: 0.15, mu: 0.12, mMin: 0.2, mMax: 0.3 },
    warm:             { fa: 'گرم‌کار',                en: 'Warm forming',         muMin: 0.15, muMax: 0.25, mu: 0.20, mMin: 0.3, mMax: 0.5 },
    hot_lubricated:   { fa: 'داغ‌کار با روانکار',     en: 'Hot, lubricated',      muMin: 0.20, muMax: 0.40, mu: 0.30, mMin: 0.4, mMax: 0.7 },
    hot_dry:          { fa: 'داغ‌کار خشک',            en: 'Hot, dry (sticking)',  muMin: 0.40, muMax: 0.60, mu: 0.50, mMin: 0.7, mMax: 1.0 },
    rolling_cold:     { fa: 'نورد سرد فولاد',         en: 'Cold rolling steel',   muMin: 0.05, muMax: 0.10, mu: 0.08 },
    rolling_hot:      { fa: 'نورد داغ فولاد',         en: 'Hot rolling steel',    muMin: 0.20, muMax: 0.70, mu: 0.40 },
    wire_drawing:     { fa: 'کشش مفتول',              en: 'Wire drawing',         muMin: 0.03, muMax: 0.10, mu: 0.06 },
    extrusion_cold:   { fa: 'اکستروژن سرد',           en: 'Cold extrusion',       muMin: 0.05, muMax: 0.10, mu: 0.07 },
    extrusion_hot_al: { fa: 'اکستروژن داغ آلومینیوم', en: 'Hot Al extrusion',     muMin: 0.10, muMax: 0.30, mu: 0.20 },
  };

  /** Deformation efficiency η (ideal work / actual work) */
  const EFFICIENCY = {
    openDieForging:   { fa: 'آهنگری آزاد',           en: 'Open-die forging',   min: 0.30, max: 0.60, def: 0.45 },
    closedDieForging: { fa: 'آهنگری قالب بسته',      en: 'Closed-die forging', min: 0.20, max: 0.40, def: 0.30 },
    rolling:          { fa: 'نورد',                  en: 'Rolling',            min: 0.70, max: 0.90, def: 0.80 },
    extrusionDirect:  { fa: 'اکستروژن مستقیم',       en: 'Direct extrusion',   min: 0.50, max: 0.65, def: 0.58 },
    extrusionIndirect:{ fa: 'اکستروژن غیرمستقیم',    en: 'Indirect extrusion', min: 0.60, max: 0.75, def: 0.68 },
    wireDrawing:      { fa: 'کشش مفتول',             en: 'Wire drawing',       min: 0.60, max: 0.80, def: 0.70 },
  };

  /** Closed-die shape factor Kf (Groover) */
  const SHAPE_FACTOR_KF = {
    simple_no_flash:   { fa: 'ساده، بدون پلیسه',        en: 'Simple, no flash',      min: 3,  max: 5,  def: 4 },
    simple_flash:      { fa: 'ساده، با پلیسه',          en: 'Simple, with flash',    min: 5,  max: 8,  def: 6.5 },
    complex_flash:     { fa: 'پیچیده، با پلیسه',        en: 'Complex, with flash',   min: 8,  max: 12, def: 10 },
    very_complex:      { fa: 'بسیار پیچیده، جان نازک',  en: 'Very complex, thin web',min: 12, max: 20, def: 16 },
    coining:           { fa: 'سکه‌زنی',                 en: 'Coining',               min: 12, max: 20, def: 16 },
  };

  // ────────────────────────────────────────────────────────────────────────
  // 2. Core mechanics — مبانی
  // ────────────────────────────────────────────────────────────────────────

  const core = {
    /** ε = ln(1+e) */
    trueFromEngStrain: (e) => Math.log(1 + req(e, 'e')),
    /** e = exp(ε) − 1 */
    engFromTrueStrain: (eps) => Math.exp(req(eps, 'eps')) - 1,

    /** True strain from a length/height/thickness pair: ε = ln(L0/L1) magnitude */
    trueStrain(L0, L1) {
      pos(L0, 'L0'); pos(L1, 'L1');
      return Math.abs(Math.log(L0 / L1));
    },

    /** True strain from areas: ε = ln(A0/Af) */
    trueStrainFromAreas(A0, Af) {
      pos(A0, 'A0'); pos(Af, 'Af');
      return Math.log(A0 / Af);
    },

    /** Instantaneous flow stress σf = K·εⁿ  (MPa) */
    flowStress(K, n, eps) {
      pos(K, 'K'); req(n, 'n'); req(eps, 'eps');
      if (eps <= 0) return 0;
      return K * Math.pow(eps, n);
    },

    /** Average flow stress Ȳf = K·εⁿ/(1+n)  (MPa) — use this for FORCE */
    avgFlowStress(K, n, eps) {
      return core.flowStress(K, n, eps) / (1 + n);
    },

    /** Hot flow stress σf = C·ε̇^m  (MPa) */
    hotFlowStress(C, m, edot) {
      pos(C, 'C'); req(m, 'm'); pos(edot, 'edot');
      return C * Math.pow(edot, m);
    },

    /** Plane-strain flow stress: Yf' = 1.1547·Yf */
    planeStrainFlowStress: (Yf) => (2 / Math.sqrt(3)) * pos(Yf, 'Yf'),

    /** von Mises equivalent stress from principal stresses (MPa) */
    vonMises(s1, s2, s3) {
      req(s1, 's1'); req(s2, 's2'); req(s3, 's3');
      return Math.sqrt(((s1 - s2) ** 2 + (s2 - s3) ** 2 + (s3 - s1) ** 2) / 2);
    },

    /** Tresca equivalent stress (MPa) */
    tresca(s1, s2, s3) {
      const a = [req(s1, 's1'), req(s2, 's2'), req(s3, 's3')];
      return Math.max(...a) - Math.min(...a);
    },

    /** Shear friction stress τ = m·σ̄/√3 (MPa) */
    shearFriction: (m, sBar) => req(m, 'm') * pos(sBar, 'sBar') / Math.sqrt(3),

    /** Ideal specific work u = K·ε^(n+1)/(n+1)  (N·mm/mm³ = MPa) */
    specificWork(K, n, eps) {
      pos(K, 'K'); req(n, 'n');
      if (eps <= 0) return 0;
      return K * Math.pow(eps, n + 1) / (n + 1);
    },

    /**
     * Deformation energy.
     * @returns {{uIdeal:number, Wideal:number, Wactual:number}} energy in J (V in mm³)
     */
    energy(K, n, eps, V_mm3, eta = 1) {
      pos(V_mm3, 'V_mm3'); pos(eta, 'eta');
      const u = core.specificWork(K, n, eps);       // MPa = N·mm/mm³
      const Wideal = u * V_mm3 / 1000;              // N·mm → J
      return { uIdeal: u, Wideal, Wactual: Wideal / eta };
    },

    /** Adiabatic temperature rise ΔT (K). u in MPa (=N·mm/mm³), rho kg/m³, cp J/kg·K */
    tempRise(u_MPa, rho, cp, beta = 0.9) {
      pos(rho, 'rho'); pos(cp, 'cp');
      // u [N·mm/mm³] = u [MJ/m³] → ×1e6 J/m³ ; ρcp in J/(m³·K)
      return beta * (u_MPa * 1e6) / (rho * cp);
    },

    /** Volume constancy solver. Give any 3 of {A0,L0,A1,L1}; the missing one is returned. */
    volumeConstancy({ A0, L0, A1, L1 }) {
      const known = [A0, L0, A1, L1].filter((v) => typeof v === 'number' && isFinite(v)).length;
      if (known !== 3) throw new Error('volumeConstancy: supply exactly 3 of A0, L0, A1, L1');
      if (A1 === undefined) return { A1: A0 * L0 / L1, V: A0 * L0 };
      if (L1 === undefined) return { L1: A0 * L0 / A1, V: A0 * L0 };
      if (A0 === undefined) return { A0: A1 * L1 / L0, V: A1 * L1 };
      return { L0: A1 * L1 / A0, V: A1 * L1 };
    },

    /** Power from force and velocity: P (W) = F(N) · v(mm/s) / 1000 */
    power: (F_N, v_mm_s) => req(F_N, 'F_N') * req(v_mm_s, 'v_mm_s') / 1000,

    /** Rotational power: P (W) = 2π·N(rev/s)·T(N·mm)/1000 */
    rotPower: (N_rev_s, T_Nmm) => 2 * Math.PI * req(N_rev_s, 'N_rev_s') * req(T_Nmm, 'T_Nmm') / 1000,

    /** Temperature regime classification from °C and material key */
    tempRegime(T_C, materialKey) {
      const p = PHYSICAL[materialKey];
      if (!p) throw new Error(`tempRegime: unknown material "${materialKey}"`);
      const ratio = (T_C + 273.15) / (p.Tm + 273.15);
      let regime, fa;
      if (ratio < 0.3) { regime = 'cold'; fa = 'سردکار'; }
      else if (ratio < 0.5) { regime = 'warm'; fa = 'گرم‌کار'; }
      else { regime = 'hot'; fa = 'داغ‌کار'; }
      return { ratio, regime, fa, Tm_C: p.Tm };
    },
  };

  // ────────────────────────────────────────────────────────────────────────
  // 3. Forging — آهنگری
  // ────────────────────────────────────────────────────────────────────────

  const forging = {
    /**
     * Open-die upsetting of a solid cylinder — آهنگری آزاد استوانه.
     * @param {object} o
     * @param {number} o.d0  initial diameter (mm)
     * @param {number} o.h0  initial height (mm)
     * @param {number} o.h1  final height (mm)
     * @param {number} o.mu  Coulomb friction coefficient
     * @param {number} o.K   strength coefficient (MPa)
     * @param {number} o.n   strain-hardening exponent
     * @param {number} [o.v] ram speed (mm/s) — for strain rate
     * @param {number} [o.eta=0.45] deformation efficiency for energy
     * @param {'groover'|'kalpakjian'|'exact'|'sticking'} [o.model='groover']
     */
    upsetCylinder(o) {
      const { d0, h0, h1, mu, K, n } = o;
      pos(d0, 'd0'); pos(h0, 'h0'); pos(h1, 'h1'); req(mu, 'mu'); pos(K, 'K'); req(n, 'n');
      const model = o.model || 'groover';
      const eta = o.eta || EFFICIENCY.openDieForging.def;
      const warnings = [];
      if (h1 >= h0) warnings.push('h1 ≥ h0 — فشردنی رخ نمی‌دهد / no compression occurs');

      const eps = Math.log(h0 / h1);
      const Yf = core.avgFlowStress(K, n, eps);
      const sigmaF = core.flowStress(K, n, eps);
      const d1 = d0 * Math.sqrt(h0 / h1);
      const A1 = areaOfCircle(d1);
      const A0 = areaOfCircle(d0);
      const V = A0 * h0;
      const a = d1 / 2;

      let Kf, pAvg, F, modelNote;
      switch (model) {
        case 'kalpakjian':
          Kf = 1 + 2 * mu * a / (3 * h1);
          pAvg = Yf * Kf; F = pAvg * A1;
          modelNote = 'Kalpakjian linearised friction hill: p̄ = Ȳf(1 + 2μa/3h)';
          break;
        case 'exact': {
          const x = 2 * mu * a / h1;
          // F = Ȳf·(2πh²/(4μ²))·[e^x − x − 1]
          F = Yf * (2 * Math.PI * h1 * h1 / (4 * mu * mu)) * (Math.exp(x) - x - 1);
          pAvg = F / A1; Kf = pAvg / Yf;
          modelNote = 'Exact integration of the sliding friction hill';
          break;
        }
        case 'sticking':
          Kf = 1 + 2 * a / (3 * Math.sqrt(3) * h1);
          pAvg = Yf * Kf; F = pAvg * A1;
          modelNote = 'Sticking friction: p̄ = Ȳf(1 + 2a/(3√3·h))';
          break;
        default:
          Kf = 1 + 0.4 * mu * d1 / h1;
          pAvg = Yf * Kf; F = pAvg * A1;
          modelNote = 'Groover shape factor: Kf = 1 + 0.4μd/h';
      }

      const en = core.energy(K, n, eps, V, eta);
      const edot = (typeof o.v === 'number') ? o.v / h1 : null;
      const pMax = Yf * Math.exp(2 * mu * a / h1); // centre pressure, sliding

      // guards
      if (h0 / d0 > 2) warnings.push('h0/d0 > 2 — خطر کمانش؛ چند مرحله‌ای کنید / buckling risk, use multiple stages');
      if (mu * d1 / h1 > 0.5) warnings.push('μ·d/h > 0.5 — بشکه‌ای شدن شدید و توزیع فشار غیریکنواخت / severe barrelling');
      if (mu >= 0.577 && model !== 'sticking') warnings.push('μ ≥ 0.577 — حالت چسبیدن؛ از model="sticking" استفاده کنید / sticking regime');
      if (eps > 1.5) warnings.push('ε > 1.5 — فراتر از یک مرحله معمول؛ آنیل میانی لازم است / intermediate anneal likely needed');

      return {
        eps, strainRate: edot, avgFlowStress: Yf, flowStress: sigmaF,
        d1, A0, A1, V, Kf, pAvg, pCentreMax: pMax,
        force_N: F, force_kN: F / 1000, force_tonf: F / 9806.65,
        pressRating_kN: 1.2 * F / 1000,
        energyIdeal_J: en.Wideal, energyActual_J: en.Wactual, eta,
        model, modelNote, warnings,
        steps: [
          Step('کرنش حقیقی / true strain', 'ε = ln(h0/h1)', eps, '—'),
          Step('تنش جریان میانگین / avg flow stress', 'Ȳf = K·εⁿ/(1+n)', Yf, 'MPa'),
          Step('قطر نهایی / final dia', 'd1 = d0·√(h0/h1)', d1, 'mm'),
          Step('سطح تماس / contact area', 'A1 = π·d1²/4', A1, 'mm²'),
          Step('ضریب شکل / shape factor', modelNote, Kf, '—'),
          Step('نیرو / force', 'F = Kf·Ȳf·A1', F, 'N'),
        ],
      };
    },

    /**
     * Plane-strain upsetting of a long slab — فشردن تیغه طویل (کرنش مسطح).
     * @param {object} o {w (slab width across flow, mm), h0, h1, L (length along flow, mm), mu, K, n}
     * Note: `w` is the dimension that spreads; `L` stays constant (plane strain).
     */
    upsetSlab(o) {
      const { w, h0, h1, L, mu, K, n } = o;
      pos(w, 'w'); pos(h0, 'h0'); pos(h1, 'h1'); pos(L, 'L'); req(mu, 'mu'); pos(K, 'K'); req(n, 'n');
      const warnings = [];
      const eps = Math.log(h0 / h1);
      const Yf = core.avgFlowStress(K, n, eps);
      const YfPS = core.planeStrainFlowStress(Yf);
      const w1 = w * h0 / h1;          // volume constancy, L constant
      const a = w1 / 2;
      const pAvg = YfPS * (1 + mu * a / h1);
      const A = w1 * L;
      const F = pAvg * A;
      const V = w * h0 * L;
      const en = core.energy(K, n, eps, V, o.eta || EFFICIENCY.openDieForging.def);
      if (mu * a / h1 > 1) warnings.push('μ·a/h > 1 — تپه اصطکاک بسیار شدید؛ تقریب خطی نامعتبر / linearisation invalid');
      return {
        eps, avgFlowStress: Yf, planeStrainFlowStress: YfPS, w1, contactArea: A, pAvg,
        force_N: F, force_kN: F / 1000,
        energyIdeal_J: en.Wideal, energyActual_J: en.Wactual, warnings,
        steps: [
          Step('کرنش / strain', 'ε = ln(h0/h1)', eps, '—'),
          Step('تنش جریان کرنش‌مسطح', "Yf' = 1.155·Ȳf", YfPS, 'MPa'),
          Step('عرض نهایی / final width', 'w1 = w0·h0/h1', w1, 'mm'),
          Step('فشار میانگین / avg pressure', "p̄ = Yf'(1 + μa/h)", pAvg, 'MPa'),
          Step('نیرو / force', 'F = p̄·w1·L', F, 'N'),
        ],
      };
    },

    /** Friction-hill pressure profile — for plotting. Returns [{r, p}] (cylinder, sliding friction). */
    frictionHill({ d, h, mu, Yf, points = 40 }) {
      pos(d, 'd'); pos(h, 'h'); req(mu, 'mu'); pos(Yf, 'Yf');
      const a = d / 2, out = [];
      for (let i = 0; i <= points; i++) {
        const r = a * i / points;
        out.push({ r: round(r), p: round(Yf * Math.exp(2 * mu * (a - r) / h)) });
      }
      return out;
    },

    /**
     * Closed-die (impression-die) forging load — آهنگری قالب بسته.
     * @param {object} o
     * @param {number} o.projectedArea  projected area INCLUDING flash (mm²)
     * @param {number} o.Yf  average flow stress at working temperature (MPa)
     * @param {number} [o.Kf] shape factor; or give `shapeClass`
     * @param {string} [o.shapeClass] key of SHAPE_FACTOR_KF
     */
    closedDie(o) {
      const A = pos(o.projectedArea, 'projectedArea');
      const Yf = pos(o.Yf, 'Yf');
      const warnings = [];
      let Kf = o.Kf, note;
      if (typeof Kf !== 'number') {
        const sc = SHAPE_FACTOR_KF[o.shapeClass];
        if (!sc) throw new Error('closedDie: supply Kf or a valid shapeClass');
        Kf = sc.def; note = `${sc.fa} / ${sc.en} (Kf ${sc.min}–${sc.max}, using ${sc.def})`;
      } else note = `Kf supplied = ${Kf}`;
      const F = Kf * Yf * A;
      warnings.push('دقت این تخمین ±25–40٪ است — فقط برای انتخاب اولیه پرس / ±25–40% accuracy, press sizing only');
      return {
        Kf, note, projectedArea: A, avgFlowStress: Yf,
        force_N: F, force_kN: F / 1000, force_tonf: F / 9806.65,
        pressRating_kN: 1.2 * F / 1000, warnings,
        steps: [Step('نیرو / force', 'F = Kf·Ȳf·A_proj', F, 'N')],
      };
    },

    /**
     * Siebel/Schuler European load form — separates body and flash contributions.
     * @param {object} o {Abody (mm²), sAvg (mm, mean body section thickness),
     *                    Aflash (mm²), bf (flash land width, mm), sf (flash thickness, mm), kf (MPa)}
     */
    closedDieSiebel(o) {
      const { Abody, sAvg, Aflash, bf, sf, kf } = o;
      pos(Abody, 'Abody'); pos(sAvg, 'sAvg'); pos(Aflash, 'Aflash');
      pos(bf, 'bf'); pos(sf, 'sf'); pos(kf, 'kf');
      const bodyFactor = 1 + 0.2 * Math.sqrt(Abody) / sAvg;
      const flashFactor = 1 + 1.26 * bf / sf;
      const F = kf * (Abody * bodyFactor + Aflash * flashFactor);
      const warnings = [];
      if (bf / sf < 2 || bf / sf > 5) warnings.push('bf/sf خارج از محدوده 2–5 توصیه‌شده / flash land ratio outside 2–5');
      return {
        bodyFactor, flashFactor, flashPressure: kf * flashFactor,
        force_N: F, force_kN: F / 1000, force_tonf: F / 9806.65, warnings,
        steps: [
          Step('ضریب بدنه / body factor', '1 + 0.2√A_body/s', bodyFactor, '—'),
          Step('ضریب پلیسه / flash factor', '1 + 1.26·bf/sf', flashFactor, '—'),
          Step('نیرو / force', 'F = kf(A_b·f_b + A_f·f_f)', F, 'N'),
        ],
      };
    },

    /** Flash land design from projected area — طراحی پلیسه. */
    flashDesign({ projectedArea, ratio = 3 }) {
      const A = pos(projectedArea, 'projectedArea');
      const sf = 0.015 * Math.sqrt(A);
      const bf = ratio * sf;
      const warnings = [];
      if (ratio < 2 || ratio > 5) warnings.push('نسبت bf/sf توصیه‌شده 2–5 است / recommended bf/sf is 2–5');
      return {
        flashThickness_mm: sf, flashLandWidth_mm: bf, ratio,
        note: 'پلیسه نازک‌تر و پهن‌تر ⇒ پر شدن بهتر حفره، اما نیرو و سایش قالب بیشتر',
        warnings,
        steps: [
          Step('ضخامت پلیسه / flash thickness', 'sf = 0.015√A_proj', sf, 'mm'),
          Step('عرض زمین / land width', 'bf = ratio·sf', bf, 'mm'),
        ],
      };
    },

    /**
     * Billet sizing — محاسبه حجم و جرم بیلت.
     * @param {object} o {partVolume (mm³), flashFraction=0.15, scaleFraction=0.03,
     *                    sprueVolume=0, materialKey (PHYSICAL), barDiameter (mm, optional)}
     */
    billet(o) {
      const Vp = pos(o.partVolume, 'partVolume');
      const ff = o.flashFraction === undefined ? 0.15 : o.flashFraction;
      const sf = o.scaleFraction === undefined ? 0.03 : o.scaleFraction;
      const Vsprue = o.sprueVolume || 0;
      const Vflash = Vp * ff, Vscale = Vp * sf;
      const V = Vp + Vflash + Vscale + Vsprue;
      const p = PHYSICAL[o.materialKey];
      const mass_kg = p ? p.rho * V * 1e-9 : null;   // mm³ → m³
      const L = o.barDiameter ? 4 * V / (Math.PI * o.barDiameter ** 2) : null;
      const warnings = [];
      if (ff < 0.10 || ff > 0.30) warnings.push('سهم پلیسه معمولاً 10–30٪ حجم قطعه است / flash is normally 10–30% of part volume');
      return {
        partVolume: Vp, flashVolume: Vflash, scaleVolume: Vscale, sprueVolume: Vsprue,
        billetVolume: V, materialYield: Vp / V, mass_kg, billetLength_mm: L, warnings,
        steps: [
          Step('حجم بیلت / billet volume', 'V = Vp + Vf + Vscale + Vsprue', V, 'mm³'),
          Step('بازده مواد / material yield', 'Vp/V', Vp / V, '—'),
        ],
      };
    },

    /** Drop-hammer blow energy and required number of blows — انرژی ضربه چکش. */
    hammerBlows({ mass_kg, dropHeight_m, requiredEnergy_J, blowEfficiency = 0.5 }) {
      pos(mass_kg, 'mass_kg'); pos(dropHeight_m, 'dropHeight_m'); pos(requiredEnergy_J, 'requiredEnergy_J');
      const E = mass_kg * 9.80665 * dropHeight_m;
      const Eavail = E * blowEfficiency;
      const v = Math.sqrt(2 * 9.80665 * dropHeight_m);
      return {
        impactVelocity_m_s: v, blowEnergy_J: E, availableEnergy_J: Eavail,
        blowsRequired: Math.ceil(requiredEnergy_J / Eavail), blowEfficiency,
        steps: [
          Step('سرعت برخورد / impact velocity', 'v = √(2gH)', v, 'm/s'),
          Step('انرژی ضربه / blow energy', 'E = mgH', E, 'J'),
        ],
      };
    },
  };

  // ────────────────────────────────────────────────────────────────────────
  // 4. Flat rolling — نوردکاری تخت
  // ────────────────────────────────────────────────────────────────────────

  const rolling = {
    /**
     * Flat rolling pass — یک پاس نورد تخت.
     * @param {object} o
     * @param {number} o.t0 entry thickness (mm)
     * @param {number} o.t1 exit thickness (mm)
     * @param {number} o.w  strip width (mm)
     * @param {number} o.R  roll radius (mm)
     * @param {number} o.mu friction coefficient
     * @param {number} o.K, o.n  flow-curve constants
     * @param {number} [o.rpm] roll speed (rev/min) — required for power
     * @param {boolean} [o.planeStrain=true] apply the 1.155 factor
     * @param {number} [o.backTension=0] , [o.frontTension=0] (MPa)
     * @param {boolean} [o.rollFlattening=false] iterate Hitchcock correction
     * @param {number} [o.E], [o.nu]  roll elastic constants (needed if rollFlattening)
     */
    pass(o) {
      const { t0, t1, w, R, mu, K, n } = o;
      pos(t0, 't0'); pos(t1, 't1'); pos(w, 'w'); pos(R, 'R'); req(mu, 'mu'); pos(K, 'K'); req(n, 'n');
      const planeStrain = o.planeStrain !== false;
      const warnings = [];
      if (t1 >= t0) warnings.push('t1 ≥ t0 — کاهش ضخامتی رخ نمی‌دهد / no reduction');

      const d = t0 - t1;
      const r = d / t0;
      const eps = Math.log(t0 / t1);
      const Yf = core.avgFlowStress(K, n, eps);
      const psFactor = planeStrain ? 2 / Math.sqrt(3) : 1;
      const Yeff = Yf * psFactor;

      const dMax = mu * mu * R;
      const biteAngle = deg(Math.acos(Math.max(-1, Math.min(1, 1 - d / (2 * R)))));
      const alphaMax = deg(Math.atan(mu));

      // Hitchcock roll flattening (iterative)
      let Reff = R, L, F, iters = 0;
      const Emod = o.E, nu = o.nu === undefined ? 0.3 : o.nu;
      do {
        L = Math.sqrt(Reff * d);
        const tAvg = ((o.backTension || 0) + (o.frontTension || 0)) / 2;
        F = Math.max(0, (Yeff - tAvg)) * w * L;
        if (!o.rollFlattening) break;
        if (!Emod) { warnings.push('rollFlattening نیاز به E دارد — نادیده گرفته شد / rollFlattening needs E, skipped'); break; }
        const Rnew = R * (1 + (16 * (1 - nu * nu) / (Math.PI * Emod)) * F / (w * d));
        if (Math.abs(Rnew - Reff) / Reff < 0.01) { Reff = Rnew; L = Math.sqrt(Reff * d); break; }
        Reff = Rnew;
      } while (++iters < 20);

      const pAvg = F / (w * L);
      const T = 0.5 * F * L;                      // N·mm per roll
      let N_rev_s = null, powerPerRoll = null, powerTotal = null, v_roll = null, v_exit = null;
      if (typeof o.rpm === 'number') {
        N_rev_s = o.rpm / 60;
        powerPerRoll = core.rotPower(N_rev_s, T);
        powerTotal = 2 * powerPerRoll;
        v_roll = 2 * Math.PI * R * N_rev_s;       // mm/s (surface speed)
        v_exit = v_roll * 1.0;                    // ≈ roll speed at exit (ignoring forward slip)
      }

      // strain rate
      const strainRate = v_roll ? (v_roll / L) * eps : null;
      // neutral point (approximate)
      const aRad = rad(biteAngle);
      const phiN = deg(Math.max(0, (aRad / 2) * (1 - aRad / (2 * mu))));
      // minimum rollable thickness
      const tMin = Emod ? (6.5 * mu * R * Yeff) / Emod : null;

      if (d > dMax) warnings.push(`d = ${round(d)} mm > d_max = ${round(dMax)} mm — گاز نمی‌کند / roll will not bite; reduce draft or raise μ`);
      if (biteAngle > alphaMax) warnings.push(`زاویه گاز ${round(biteAngle)}° > arctan(μ) = ${round(alphaMax)}° / bite condition violated`);
      if (tMin && t1 < tMin) warnings.push(`t1 زیر حداقل ضخامت قابل نورد (${round(tMin)} mm) / below minimum rollable thickness`);
      if (w / t0 < 10 && planeStrain) warnings.push('w/t0 < 10 — فرض کرنش مسطح ضعیف است، پهن‌شدگی رخ می‌دهد / plane-strain assumption weak, spreading occurs');

      return {
        draft: d, reduction: r, eps, strainRate,
        avgFlowStress: Yf, effectiveFlowStress: Yeff, planeStrain,
        contactLength: L, effectiveRollRadius: Reff, rollFlatteningIterations: iters,
        maxDraft: dMax, biteAngle_deg: biteAngle, maxBiteAngle_deg: alphaMax,
        neutralPointAngle_deg: phiN, minRollableThickness: tMin,
        pAvg, force_N: F, force_kN: F / 1000, force_tonf: F / 9806.65,
        torquePerRoll_Nmm: T, torquePerRoll_Nm: T / 1000,
        powerPerRoll_W: powerPerRoll, powerTotal_W: powerTotal, powerTotal_kW: powerTotal ? powerTotal / 1000 : null,
        rollSurfaceSpeed_mm_s: v_roll, exitSpeed_mm_s: v_exit,
        warnings,
        steps: [
          Step('کاهش ضخامت / draft', 'd = t0 − t1', d, 'mm'),
          Step('نسبت کاهش / reduction', 'r = d/t0', r, '—'),
          Step('کرنش / strain', 'ε = ln(t0/t1)', eps, '—'),
          Step('تنش جریان مؤثر', planeStrain ? "1.155·Ȳf" : 'Ȳf', Yeff, 'MPa'),
          Step('طول تماس / contact length', 'L = √(R·d)', L, 'mm'),
          Step('نیرو / roll force', 'F = Yf_eff·w·L', F, 'N'),
          Step('گشتاور / torque', 'T = 0.5·F·L', T / 1000, 'N·m'),
          Step('توان کل / total power', 'P = 2·2πNT', powerTotal, 'W'),
        ],
      };
    },

    /** Maximum possible draft and reduction for a given μ, R, t0. */
    maxDraft({ mu, R, t0 }) {
      req(mu, 'mu'); pos(R, 'R'); pos(t0, 't0');
      const dMax = mu * mu * R;
      return {
        maxDraft_mm: dMax, maxReduction: Math.min(1, dMax / t0),
        minExitThickness_mm: Math.max(0, t0 - dMax),
        maxBiteAngle_deg: deg(Math.atan(mu)),
        steps: [Step('حداکثر draft', 'd_max = μ²R', dMax, 'mm')],
      };
    },

    /**
     * Multi-pass rolling schedule with equal true strain per pass.
     * @returns {{passes: object[], totalStrain: number}}
     */
    schedule({ t0, tFinal, nPasses, w, R, mu, K, n, rpm }) {
      pos(t0, 't0'); pos(tFinal, 'tFinal'); pos(nPasses, 'nPasses');
      const epsTotal = Math.log(t0 / tFinal);
      const passes = [];
      let t = t0;
      for (let i = 1; i <= nPasses; i++) {
        const tNext = t0 * Math.exp(-epsTotal * i / nPasses);
        const p = rolling.pass({ t0: t, t1: tNext, w, R, mu, K, n, rpm });
        passes.push(Object.assign({ pass: i, tIn: round(t), tOut: round(tNext) }, p));
        t = tNext;
      }
      return {
        totalStrain: epsTotal, passes,
        maxForce_kN: Math.max(...passes.map((p) => p.force_kN)),
        totalPower_kW: passes.reduce((s, p) => s + (p.powerTotal_kW || 0), 0),
        warnings: passes.flatMap((p, i) => p.warnings.map((wn) => `پاس ${i + 1}: ${wn}`)),
      };
    },

    /** Wusatowski spread estimate for narrow sections. Returns exit width (mm). */
    spread({ t0, t1, w0, R }) {
      pos(t0, 't0'); pos(t1, 't1'); pos(w0, 'w0'); pos(R, 'R');
      const expo = Math.pow(10, -1.269 * Math.pow(w0 / t0, 0.556) * Math.pow(t0 / R, 0.294));
      const w1 = w0 * Math.pow(t0 / t1, expo);
      return { exitWidth_mm: w1, spread_mm: w1 - w0, exponent: expo };
    },
  };

  // ────────────────────────────────────────────────────────────────────────
  // 5. Extrusion — اکستروژن
  // ────────────────────────────────────────────────────────────────────────

  const extrusion = {
    /**
     * Direct or indirect extrusion — اکستروژن مستقیم یا غیرمستقیم.
     * @param {object} o
     * @param {number} o.A0  billet cross-section (mm²)  — or give D0
     * @param {number} o.Af  product cross-section (mm²) — or give Df
     * @param {number} [o.D0], [o.Df]  diameters (mm), used if areas omitted
     * @param {number} o.Yf  average flow stress at working temperature (MPa)
     * @param {number} [o.billetLength] remaining billet length L (mm) — direct only
     * @param {'direct'|'indirect'} [o.type='direct']
     * @param {number} [o.a=0.8], [o.b=1.4]  Johnson constants
     * @param {number} [o.ramSpeed]  mm/s — for strain rate & power
     * @param {number} [o.dieHalfAngle=45] degrees
     * @param {string} [o.materialKey]  PHYSICAL key — enables ΔT and hot-shortness check
     * @param {number} [o.billetTemp_C]
     */
    pressure(o) {
      const type = o.type || 'direct';
      const a = o.a === undefined ? 0.8 : o.a;
      const b = o.b === undefined ? 1.4 : o.b;
      const alpha = o.dieHalfAngle === undefined ? 45 : o.dieHalfAngle;
      const Yf = pos(o.Yf, 'Yf');
      const warnings = [];

      const A0 = (typeof o.A0 === 'number') ? pos(o.A0, 'A0') : areaOfCircle(pos(o.D0, 'D0'));
      const Af = (typeof o.Af === 'number') ? pos(o.Af, 'Af') : areaOfCircle(pos(o.Df, 'Df'));
      if (Af >= A0) throw new RangeError('extrusion: Af must be < A0');

      const D0 = (typeof o.D0 === 'number') ? o.D0 : diaOfArea(A0);
      const Df = (typeof o.Df === 'number') ? o.Df : diaOfArea(Af);

      const rx = A0 / Af;
      const reduction = 1 - Af / A0;
      const epsIdeal = Math.log(rx);
      const epsX = a + b * epsIdeal;

      let frictionTerm = 0;
      if (type === 'direct') {
        const L = o.billetLength;
        if (typeof L !== 'number') warnings.push('اکستروژن مستقیم بدون billetLength — جمله اصطکاک جداره صفر فرض شد / wall friction term omitted');
        else frictionTerm = 2 * L / D0;
      }
      const p = Yf * (epsX + frictionTerm);
      const F = p * A0;
      const pIdeal = Yf * epsIdeal;

      // strain rate & power
      const v = o.ramSpeed;
      let strainRate = null, exitSpeed = null, power = null;
      if (typeof v === 'number') {
        strainRate = (6 * v * D0 * D0 * Math.tan(rad(alpha))) / (Math.pow(D0, 3) - Math.pow(Df, 3));
        exitSpeed = v * rx;
        power = core.power(F, v);
      }

      // temperature rise
      let deltaT = null, exitTemp = null;
      const phys = PHYSICAL[o.materialKey];
      if (phys) {
        const u = Yf * epsX;                     // MPa = N·mm/mm³
        deltaT = core.tempRise(u, phys.rho, phys.cp);
        if (typeof o.billetTemp_C === 'number') {
          exitTemp = o.billetTemp_C + deltaT;
          if (exitTemp > phys.Tm - 50) {
            warnings.push(`دمای خروج ${round(exitTemp)}°C به دمای ذوب نزدیک است — ترک داغ / hot shortness risk, reduce ram speed or billet temperature`);
          }
        }
      }

      if (rx < 2) warnings.push('rx < 2 — خطر ترک مرکزی (center-burst) / center-burst risk');
      if (rx > 100) warnings.push('rx > 100 — معادله Johnson فراتر از محدوده اعتبار / Johnson equation outside validated range');

      return {
        type, A0, Af, D0, Df, extrusionRatio: rx, reduction,
        epsIdeal, epsJohnson: epsX, johnson: { a, b },
        avgFlowStress: Yf, frictionTerm,
        pressureIdeal_MPa: pIdeal, pressure_MPa: p,
        force_N: F, force_kN: F / 1000, force_tonf: F / 9806.65,
        pressRating_kN: 1.2 * F / 1000,
        strainRate, exitSpeed_mm_s: exitSpeed, power_W: power, power_kW: power ? power / 1000 : null,
        deltaT_K: deltaT, exitTemp_C: exitTemp, warnings,
        steps: [
          Step('نسبت اکستروژن / extrusion ratio', 'rx = A0/Af', rx, '—'),
          Step('کرنش ایده‌آل / ideal strain', 'ε = ln(rx)', epsIdeal, '—'),
          Step('کرنش Johnson', 'εx = a + b·ln(rx)', epsX, '—'),
          Step('جمله اصطکاک جداره', type === 'direct' ? '2L/D0' : '0 (indirect)', frictionTerm, '—'),
          Step('فشار / pressure', 'p = Ȳf(εx + 2L/D0)', p, 'MPa'),
          Step('نیرو / force', 'F = p·A0', F, 'N'),
        ],
      };
    },

    /** Quick industrial estimate using the extrusion constant: F = A0·Ke·ln(rx). */
    byConstant({ A0, Af, Ke, materialKey }) {
      pos(A0, 'A0'); pos(Af, 'Af');
      const K = (typeof Ke === 'number') ? Ke : (EXTRUSION_CONSTANT[materialKey] || {}).Ke;
      if (typeof K !== 'number') throw new Error('byConstant: supply Ke or a valid materialKey');
      const rx = A0 / Af;
      const F = A0 * K * Math.log(rx);
      return {
        extrusionRatio: rx, Ke: K,
        force_N: F, force_kN: F / 1000, force_tonf: F / 9806.65,
        pressure_MPa: F / A0,
        warnings: ['تخمین سریع صنعتی؛ اصطکاک جداره در Ke مستتر است / quick estimate, wall friction lumped into Ke'],
        steps: [Step('نیرو / force', 'F = A0·Ke·ln(rx)', F, 'N')],
      };
    },

    /**
     * Direct-extrusion pressure curve over the stroke — منحنی فشار در طول کورس.
     * @returns [{stroke_mm, remainingLength_mm, pressure_MPa, force_kN}]
     */
    directPressureCurve(o) {
      const L0 = pos(o.billetLength, 'billetLength');
      const points = o.points || 20;
      const out = [];
      for (let i = 0; i <= points; i++) {
        const L = L0 * (1 - i / points);
        const r = extrusion.pressure(Object.assign({}, o, { billetLength: Math.max(L, 1e-6), type: 'direct' }));
        out.push({
          stroke_mm: round(L0 - L), remainingLength_mm: round(L),
          pressure_MPa: round(r.pressure_MPa), force_kN: round(r.force_kN),
        });
      }
      return out;
    },

    /** Optimum die half-angle estimate (degrees). */
    optimumDieAngle({ mu, extrusionRatio, regime = 'hot' }) {
      req(mu, 'mu'); pos(extrusionRatio, 'extrusionRatio');
      const analytic = deg(Math.sqrt(1.5 * mu * Math.log(extrusionRatio)));
      const practical = regime === 'cold' ? [20, 30] : [45, 60];
      return {
        analytic_deg: analytic, practicalRange_deg: practical,
        note: regime === 'hot'
          ? 'قالب تخت 90° در اکستروژن داغ آلومینیوم رایج است (منطقه فلز مرده نقش قالب مخروطی را بازی می‌کند)'
          : 'زاویه کوچک‌تر برای اکستروژن سرد با روانکاری خوب',
      };
    },
  };

  // ────────────────────────────────────────────────────────────────────────
  // 6. Wire / rod drawing — کشش مفتول و میله
  // ────────────────────────────────────────────────────────────────────────

  const drawing = {
    /**
     * Single-pass round wire/rod drawing — کشش یک پاس مقطع دایره.
     * @param {object} o
     * @param {number} o.D0 entry diameter (mm)
     * @param {number} o.Df exit diameter (mm)
     * @param {number} o.alpha die half-angle (degrees)
     * @param {number} o.mu friction coefficient
     * @param {number} o.K, o.n flow-curve constants
     * @param {number} [o.speed] draw speed (mm/s)
     * @param {number} [o.backTension=0] (MPa)
     * @param {number} [o.safetyTarget=0.7] max acceptable σd/σf_exit
     */
    wire(o) {
      const { D0, Df, alpha, mu, K, n } = o;
      pos(D0, 'D0'); pos(Df, 'Df'); pos(alpha, 'alpha'); req(mu, 'mu'); pos(K, 'K'); req(n, 'n');
      if (Df >= D0) throw new RangeError('drawing.wire: Df must be < D0');
      const warnings = [];

      const A0 = areaOfCircle(D0), Af = areaOfCircle(Df);
      const reduction = 1 - Af / A0;
      const eps = Math.log(A0 / Af);
      const Yf = core.avgFlowStress(K, n, eps);
      const sigmaExit = core.flowStress(K, n, eps);

      const Davg = (D0 + Df) / 2;
      const Lc = (D0 - Df) / (2 * Math.sin(rad(alpha)));
      const phi = 0.88 + 0.12 * (Davg / Lc);
      const frictionFactor = 1 + mu / Math.tan(rad(alpha));

      const sigmaIdeal = Yf * eps;
      const backT = o.backTension || 0;
      const sigmaD = Yf * phi * frictionFactor * eps + backT;
      const F = sigmaD * Af;
      const diePressure = Yf - backT;

      const safety = sigmaExit > 0 ? sigmaD / sigmaExit : Infinity;
      const target = o.safetyTarget === undefined ? 0.7 : o.safetyTarget;

      const v = o.speed;
      const power = (typeof v === 'number') ? core.power(F, v) : null;
      const strainRate = (typeof v === 'number') ? v * eps / Lc : null;

      if (safety >= 1) warnings.push(`σd ≥ σf_exit (${round(safety)}) — مفتول پاره می‌شود / wire will break, reduce pass reduction`);
      else if (safety > target) warnings.push(`حاشیه امنیت ${round(safety)} > ${target} — خطر پارگی / draw stress margin too high`);
      if (reduction > 0.45) warnings.push('r > 0.45 — فراتر از حد عملی یک پاس / beyond practical single-pass reduction');
      if (alpha > 15) warnings.push('α > 15° — فرم Schey برای زوایای بزرگ نامعتبر می‌شود / Schey form loses validity');
      if (alpha < 3) warnings.push('α < 3° — اصطکاک به‌شدت رشد می‌کند / friction term blows up at very small angles');

      return {
        A0, Af, reduction, eps, avgFlowStress: Yf, exitFlowStress: sigmaExit,
        Davg, contactLength: Lc, redundantWorkFactor: phi, frictionFactor,
        drawStressIdeal_MPa: sigmaIdeal, drawStress_MPa: sigmaD,
        diePressure_MPa: diePressure, backTension_MPa: backT,
        force_N: F, force_kN: F / 1000,
        power_W: power, power_kW: power ? power / 1000 : null, strainRate,
        safetyRatio: safety, safetyTarget: target, warnings,
        steps: [
          Step('نسبت کاهش / reduction', 'r = 1 − Af/A0', reduction, '—'),
          Step('کرنش / strain', 'ε = ln(A0/Af)', eps, '—'),
          Step('تنش جریان میانگین', 'Ȳf = K·εⁿ/(1+n)', Yf, 'MPa'),
          Step('طول تماس / contact length', 'Lc = (D0−Df)/(2 sinα)', Lc, 'mm'),
          Step('ضریب کار زائد / redundant work', 'φ = 0.88 + 0.12·D_avg/Lc', phi, '—'),
          Step('ضریب اصطکاک / friction factor', '1 + μ/tanα', frictionFactor, '—'),
          Step('تنش کشش / draw stress', 'σd = Ȳf·φ·(1+μ/tanα)·ln(A0/Af)', sigmaD, 'MPa'),
          Step('نیرو / force', 'F = σd·Af', F, 'N'),
        ],
      };
    },

    /** Theoretical & practical maximum reduction per pass — حداکثر کاهش هر پاس. */
    maxReduction({ n = 0, mu = 0, alpha = 8, kind = 'wire' }) {
      // Ideal frictionless, non-hardening: ε ≤ 1 → r ≤ 1 − 1/e
      const rIdeal = 1 - Math.exp(-1);
      // With friction/redundant work the attainable ε shrinks by 1/(φ·(1+μ/tanα)) approximately
      const phiApprox = 1.05;
      const fFactor = 1 + mu / Math.tan(rad(alpha));
      const epsMax = 1 / (phiApprox * fFactor);
      const rWithFriction = 1 - Math.exp(-epsMax);
      const practical = kind === 'rod' ? [0.30, 0.45] : [0.20, 0.30];
      return {
        idealMaxReduction: rIdeal, maxStrainWithFriction: epsMax,
        maxReductionWithFriction: rWithFriction, practicalRange: practical,
        note: 'حد نظری از شرط σd ≤ σf می‌آید؛ کارسختی (n>0) آن را کمی بالا و اصطکاک آن را پایین می‌برد',
      };
    },

    /**
     * Multi-pass drawing schedule with equal reduction per pass.
     * @param {object} o {D0, DFinal, nPasses (or rPerPass), alpha, mu, K, n, speed, annealStrain=3}
     */
    schedule(o) {
      const { D0, DFinal, alpha, mu, K, n } = o;
      pos(D0, 'D0'); pos(DFinal, 'DFinal');
      const A0 = areaOfCircle(D0), Af = areaOfCircle(DFinal);
      const epsTotal = Math.log(A0 / Af);
      let N = o.nPasses;
      if (!N) {
        const rp = o.rPerPass || 0.25;
        N = Math.ceil(epsTotal / Math.log(1 / (1 - rp)));
      }
      const rPass = 1 - Math.pow(Af / A0, 1 / N);
      const passes = [];
      let D = D0, cumStrain = 0;
      const annealStrain = o.annealStrain === undefined ? 3 : o.annealStrain;
      const anneals = [];
      for (let i = 1; i <= N; i++) {
        const Dnext = D0 * Math.pow(DFinal / D0, i / N);
        const p = drawing.wire({ D0: D, Df: Dnext, alpha, mu, K, n, speed: o.speed });
        cumStrain += p.eps;
        if (cumStrain > annealStrain) { anneals.push(i); cumStrain = 0; }
        passes.push(Object.assign({ pass: i, Din: round(D), Dout: round(Dnext), cumulativeStrain: round(cumStrain) }, p));
        D = Dnext;
      }
      return {
        nPasses: N, reductionPerPass: rPass, totalStrain: epsTotal, passes,
        annealAfterPasses: anneals,
        maxForce_kN: Math.max(...passes.map((p) => p.force_kN)),
        totalPower_kW: passes.reduce((s, p) => s + (p.power_kW || 0), 0),
        warnings: passes.flatMap((p, i) => p.warnings.map((wn) => `پاس ${i + 1}: ${wn}`)),
      };
    },

    /** Optimum die half-angle (degrees). */
    optimumDieAngle({ mu, A0, Af }) {
      req(mu, 'mu'); pos(A0, 'A0'); pos(Af, 'Af');
      const a = deg(Math.sqrt(1.5 * mu * Math.log(A0 / Af)));
      return { analytic_deg: a, practicalRange_deg: [6, 12], note: '6–10° فولاد، 8–12° مس و آلومینیوم' };
    },
  };

  // ────────────────────────────────────────────────────────────────────────
  // 7. UI metadata — برای ساخت خودکار فرم‌ها
  // ────────────────────────────────────────────────────────────────────────

  const UI = {
    groups: [
      {
        key: 'forging', fa: 'آهنگری', en: 'Forging',
        calcs: [
          { key: 'upsetCylinder', fa: 'فشردن استوانه (قالب آزاد)', en: 'Open-die cylinder upsetting',
            fields: [
              { key: 'd0', fa: 'قطر اولیه', en: 'Initial diameter', unit: 'mm' },
              { key: 'h0', fa: 'ارتفاع اولیه', en: 'Initial height', unit: 'mm' },
              { key: 'h1', fa: 'ارتفاع نهایی', en: 'Final height', unit: 'mm' },
              { key: 'mu', fa: 'ضریب اصطکاک', en: 'Friction coefficient', unit: '—' },
              { key: 'K', fa: 'ضریب استحکام K', en: 'Strength coefficient K', unit: 'MPa' },
              { key: 'n', fa: 'توان کارسختی n', en: 'Strain-hardening exponent n', unit: '—' },
              { key: 'v', fa: 'سرعت سنبه (اختیاری)', en: 'Ram speed (optional)', unit: 'mm/s' },
            ],
            outputs: ['force_kN', 'pAvg', 'eps', 'd1', 'energyActual_J'] },
          { key: 'upsetSlab', fa: 'فشردن تیغه (کرنش مسطح)', en: 'Plane-strain slab upsetting',
            fields: [
              { key: 'w', fa: 'عرض اولیه', en: 'Initial width', unit: 'mm' },
              { key: 'h0', fa: 'ارتفاع اولیه', en: 'Initial height', unit: 'mm' },
              { key: 'h1', fa: 'ارتفاع نهایی', en: 'Final height', unit: 'mm' },
              { key: 'L', fa: 'طول (ثابت)', en: 'Length (constant)', unit: 'mm' },
              { key: 'mu', fa: 'ضریب اصطکاک', en: 'Friction coefficient', unit: '—' },
              { key: 'K', fa: 'ضریب استحکام K', en: 'K', unit: 'MPa' },
              { key: 'n', fa: 'توان کارسختی n', en: 'n', unit: '—' },
            ],
            outputs: ['force_kN', 'pAvg', 'w1'] },
          { key: 'closedDie', fa: 'آهنگری قالب بسته', en: 'Closed-die forging',
            fields: [
              { key: 'projectedArea', fa: 'سطح تصویرشده (با پلیسه)', en: 'Projected area (incl. flash)', unit: 'mm²' },
              { key: 'Yf', fa: 'تنش جریان میانگین', en: 'Average flow stress', unit: 'MPa' },
              { key: 'shapeClass', fa: 'کلاس شکل', en: 'Shape class', unit: 'select', options: Object.keys(SHAPE_FACTOR_KF) },
            ],
            outputs: ['force_kN', 'force_tonf', 'pressRating_kN'] },
          { key: 'flashDesign', fa: 'طراحی پلیسه', en: 'Flash design',
            fields: [
              { key: 'projectedArea', fa: 'سطح تصویرشده', en: 'Projected area', unit: 'mm²' },
              { key: 'ratio', fa: 'نسبت bf/sf', en: 'bf/sf ratio', unit: '—' },
            ],
            outputs: ['flashThickness_mm', 'flashLandWidth_mm'] },
          { key: 'billet', fa: 'محاسبه بیلت', en: 'Billet sizing',
            fields: [
              { key: 'partVolume', fa: 'حجم قطعه', en: 'Part volume', unit: 'mm³' },
              { key: 'flashFraction', fa: 'سهم پلیسه', en: 'Flash fraction', unit: '—' },
              { key: 'scaleFraction', fa: 'سهم پوسته', en: 'Scale fraction', unit: '—' },
              { key: 'materialKey', fa: 'ماده', en: 'Material', unit: 'select', options: Object.keys(PHYSICAL) },
              { key: 'barDiameter', fa: 'قطر میلگرد (اختیاری)', en: 'Bar diameter (optional)', unit: 'mm' },
            ],
            outputs: ['billetVolume', 'mass_kg', 'billetLength_mm', 'materialYield'] },
        ],
      },
      {
        key: 'rolling', fa: 'نوردکاری', en: 'Rolling',
        calcs: [
          { key: 'pass', fa: 'پاس نورد تخت', en: 'Flat rolling pass',
            fields: [
              { key: 't0', fa: 'ضخامت ورودی', en: 'Entry thickness', unit: 'mm' },
              { key: 't1', fa: 'ضخامت خروجی', en: 'Exit thickness', unit: 'mm' },
              { key: 'w', fa: 'عرض ورق', en: 'Strip width', unit: 'mm' },
              { key: 'R', fa: 'شعاع غلتک', en: 'Roll radius', unit: 'mm' },
              { key: 'mu', fa: 'ضریب اصطکاک', en: 'Friction coefficient', unit: '—' },
              { key: 'K', fa: 'ضریب استحکام K', en: 'K', unit: 'MPa' },
              { key: 'n', fa: 'توان کارسختی n', en: 'n', unit: '—' },
              { key: 'rpm', fa: 'سرعت غلتک', en: 'Roll speed', unit: 'rev/min' },
            ],
            outputs: ['force_kN', 'torquePerRoll_Nm', 'powerTotal_kW', 'contactLength', 'maxDraft', 'biteAngle_deg'] },
          { key: 'maxDraft', fa: 'حداکثر کاهش ممکن', en: 'Maximum draft',
            fields: [
              { key: 'mu', fa: 'ضریب اصطکاک', en: 'μ', unit: '—' },
              { key: 'R', fa: 'شعاع غلتک', en: 'Roll radius', unit: 'mm' },
              { key: 't0', fa: 'ضخامت ورودی', en: 'Entry thickness', unit: 'mm' },
            ],
            outputs: ['maxDraft_mm', 'maxReduction', 'minExitThickness_mm'] },
          { key: 'schedule', fa: 'برنامه چند پاس', en: 'Multi-pass schedule',
            fields: [
              { key: 't0', fa: 'ضخامت اولیه', en: 'Initial thickness', unit: 'mm' },
              { key: 'tFinal', fa: 'ضخامت نهایی', en: 'Final thickness', unit: 'mm' },
              { key: 'nPasses', fa: 'تعداد پاس', en: 'Number of passes', unit: '—' },
              { key: 'w', fa: 'عرض', en: 'Width', unit: 'mm' },
              { key: 'R', fa: 'شعاع غلتک', en: 'Roll radius', unit: 'mm' },
              { key: 'mu', fa: 'اصطکاک', en: 'μ', unit: '—' },
              { key: 'K', fa: 'K', en: 'K', unit: 'MPa' },
              { key: 'n', fa: 'n', en: 'n', unit: '—' },
              { key: 'rpm', fa: 'سرعت غلتک', en: 'Roll speed', unit: 'rev/min' },
            ],
            outputs: ['maxForce_kN', 'totalPower_kW', 'totalStrain'] },
        ],
      },
      {
        key: 'extrusion', fa: 'اکستروژن', en: 'Extrusion',
        calcs: [
          { key: 'pressure', fa: 'فشار و نیروی اکستروژن', en: 'Extrusion pressure & force',
            fields: [
              { key: 'D0', fa: 'قطر بیلت', en: 'Billet diameter', unit: 'mm' },
              { key: 'Df', fa: 'قطر محصول', en: 'Product diameter', unit: 'mm' },
              { key: 'billetLength', fa: 'طول بیلت', en: 'Billet length', unit: 'mm' },
              { key: 'Yf', fa: 'تنش جریان میانگین', en: 'Average flow stress', unit: 'MPa' },
              { key: 'type', fa: 'نوع', en: 'Type', unit: 'select', options: ['direct', 'indirect'] },
              { key: 'a', fa: 'ثابت Johnson a', en: 'Johnson a', unit: '—' },
              { key: 'b', fa: 'ثابت Johnson b', en: 'Johnson b', unit: '—' },
              { key: 'ramSpeed', fa: 'سرعت سنبه', en: 'Ram speed', unit: 'mm/s' },
              { key: 'materialKey', fa: 'ماده', en: 'Material', unit: 'select', options: Object.keys(PHYSICAL) },
              { key: 'billetTemp_C', fa: 'دمای بیلت', en: 'Billet temperature', unit: '°C' },
            ],
            outputs: ['pressure_MPa', 'force_kN', 'extrusionRatio', 'epsJohnson', 'deltaT_K', 'exitSpeed_mm_s'] },
          { key: 'byConstant', fa: 'تخمین با ثابت اکستروژن', en: 'Estimate via extrusion constant',
            fields: [
              { key: 'A0', fa: 'سطح بیلت', en: 'Billet area', unit: 'mm²' },
              { key: 'Af', fa: 'سطح محصول', en: 'Product area', unit: 'mm²' },
              { key: 'materialKey', fa: 'ماده', en: 'Material', unit: 'select', options: Object.keys(EXTRUSION_CONSTANT) },
            ],
            outputs: ['force_kN', 'pressure_MPa', 'extrusionRatio'] },
        ],
      },
      {
        key: 'drawing', fa: 'کشش مفتول و میله', en: 'Wire & rod drawing',
        calcs: [
          { key: 'wire', fa: 'کشش یک پاس', en: 'Single-pass drawing',
            fields: [
              { key: 'D0', fa: 'قطر ورودی', en: 'Entry diameter', unit: 'mm' },
              { key: 'Df', fa: 'قطر خروجی', en: 'Exit diameter', unit: 'mm' },
              { key: 'alpha', fa: 'نیم‌زاویه قالب', en: 'Die half-angle', unit: 'deg' },
              { key: 'mu', fa: 'ضریب اصطکاک', en: 'μ', unit: '—' },
              { key: 'K', fa: 'K', en: 'K', unit: 'MPa' },
              { key: 'n', fa: 'n', en: 'n', unit: '—' },
              { key: 'speed', fa: 'سرعت کشش', en: 'Draw speed', unit: 'mm/s' },
              { key: 'backTension', fa: 'کشش عقب', en: 'Back tension', unit: 'MPa' },
            ],
            outputs: ['drawStress_MPa', 'force_kN', 'power_kW', 'reduction', 'safetyRatio'] },
          { key: 'schedule', fa: 'برنامه چند پاس', en: 'Multi-pass schedule',
            fields: [
              { key: 'D0', fa: 'قطر اولیه', en: 'Initial diameter', unit: 'mm' },
              { key: 'DFinal', fa: 'قطر نهایی', en: 'Final diameter', unit: 'mm' },
              { key: 'nPasses', fa: 'تعداد پاس (اختیاری)', en: 'Passes (optional)', unit: '—' },
              { key: 'rPerPass', fa: 'کاهش هر پاس', en: 'Reduction per pass', unit: '—' },
              { key: 'alpha', fa: 'نیم‌زاویه قالب', en: 'Die half-angle', unit: 'deg' },
              { key: 'mu', fa: 'اصطکاک', en: 'μ', unit: '—' },
              { key: 'K', fa: 'K', en: 'K', unit: 'MPa' },
              { key: 'n', fa: 'n', en: 'n', unit: '—' },
              { key: 'speed', fa: 'سرعت', en: 'Speed', unit: 'mm/s' },
            ],
            outputs: ['nPasses', 'reductionPerPass', 'maxForce_kN', 'annealAfterPasses'] },
          { key: 'maxReduction', fa: 'حداکثر کاهش هر پاس', en: 'Max reduction per pass',
            fields: [
              { key: 'mu', fa: 'اصطکاک', en: 'μ', unit: '—' },
              { key: 'alpha', fa: 'نیم‌زاویه قالب', en: 'Die half-angle', unit: 'deg' },
              { key: 'kind', fa: 'نوع', en: 'Kind', unit: 'select', options: ['wire', 'rod'] },
            ],
            outputs: ['idealMaxReduction', 'maxReductionWithFriction', 'practicalRange'] },
        ],
      },
    ],
    /** Output label lookup for rendering results */
    labels: {
      force_N: { fa: 'نیرو', en: 'Force', unit: 'N' },
      force_kN: { fa: 'نیرو', en: 'Force', unit: 'kN' },
      force_tonf: { fa: 'نیرو', en: 'Force', unit: 'tonf' },
      pressRating_kN: { fa: 'ظرفیت پرس پیشنهادی', en: 'Suggested press rating', unit: 'kN' },
      pAvg: { fa: 'فشار میانگین', en: 'Average pressure', unit: 'MPa' },
      pCentreMax: { fa: 'فشار حداکثر مرکز', en: 'Peak centre pressure', unit: 'MPa' },
      eps: { fa: 'کرنش حقیقی', en: 'True strain', unit: '—' },
      strainRate: { fa: 'نرخ کرنش', en: 'Strain rate', unit: '1/s' },
      avgFlowStress: { fa: 'تنش جریان میانگین', en: 'Average flow stress', unit: 'MPa' },
      d1: { fa: 'قطر نهایی', en: 'Final diameter', unit: 'mm' },
      w1: { fa: 'عرض نهایی', en: 'Final width', unit: 'mm' },
      energyIdeal_J: { fa: 'انرژی ایده‌آل', en: 'Ideal energy', unit: 'J' },
      energyActual_J: { fa: 'انرژی واقعی', en: 'Actual energy', unit: 'J' },
      draft: { fa: 'کاهش ضخامت', en: 'Draft', unit: 'mm' },
      reduction: { fa: 'نسبت کاهش', en: 'Reduction', unit: '—' },
      contactLength: { fa: 'طول تماس', en: 'Contact length', unit: 'mm' },
      maxDraft: { fa: 'حداکثر draft ممکن', en: 'Maximum draft', unit: 'mm' },
      maxDraft_mm: { fa: 'حداکثر draft ممکن', en: 'Maximum draft', unit: 'mm' },
      maxReduction: { fa: 'حداکثر نسبت کاهش', en: 'Max reduction', unit: '—' },
      minExitThickness_mm: { fa: 'حداقل ضخامت خروجی', en: 'Min exit thickness', unit: 'mm' },
      biteAngle_deg: { fa: 'زاویه گاز', en: 'Bite angle', unit: 'deg' },
      torquePerRoll_Nm: { fa: 'گشتاور هر غلتک', en: 'Torque per roll', unit: 'N·m' },
      powerTotal_kW: { fa: 'توان کل', en: 'Total power', unit: 'kW' },
      maxForce_kN: { fa: 'بیشترین نیرو', en: 'Peak force', unit: 'kN' },
      totalPower_kW: { fa: 'توان کل', en: 'Total power', unit: 'kW' },
      totalStrain: { fa: 'کرنش کل', en: 'Total strain', unit: '—' },
      extrusionRatio: { fa: 'نسبت اکستروژن', en: 'Extrusion ratio', unit: '—' },
      epsJohnson: { fa: 'کرنش Johnson', en: 'Johnson strain', unit: '—' },
      pressure_MPa: { fa: 'فشار', en: 'Pressure', unit: 'MPa' },
      deltaT_K: { fa: 'افزایش دما', en: 'Temperature rise', unit: 'K' },
      exitTemp_C: { fa: 'دمای خروج', en: 'Exit temperature', unit: '°C' },
      exitSpeed_mm_s: { fa: 'سرعت خروج', en: 'Exit speed', unit: 'mm/s' },
      drawStress_MPa: { fa: 'تنش کشش', en: 'Draw stress', unit: 'MPa' },
      power_kW: { fa: 'توان', en: 'Power', unit: 'kW' },
      safetyRatio: { fa: 'نسبت σd/σf', en: 'σd/σf ratio', unit: '—' },
      nPasses: { fa: 'تعداد پاس', en: 'Passes', unit: '—' },
      reductionPerPass: { fa: 'کاهش هر پاس', en: 'Reduction per pass', unit: '—' },
      annealAfterPasses: { fa: 'آنیل بعد از پاس', en: 'Anneal after pass', unit: '—' },
      idealMaxReduction: { fa: 'حد نظری کاهش', en: 'Ideal max reduction', unit: '—' },
      maxReductionWithFriction: { fa: 'حد با اصطکاک', en: 'Max with friction', unit: '—' },
      practicalRange: { fa: 'محدوده عملی', en: 'Practical range', unit: '—' },
      billetVolume: { fa: 'حجم بیلت', en: 'Billet volume', unit: 'mm³' },
      mass_kg: { fa: 'جرم', en: 'Mass', unit: 'kg' },
      billetLength_mm: { fa: 'طول بیلت', en: 'Billet length', unit: 'mm' },
      materialYield: { fa: 'بازده مواد', en: 'Material yield', unit: '—' },
      flashThickness_mm: { fa: 'ضخامت پلیسه', en: 'Flash thickness', unit: 'mm' },
      flashLandWidth_mm: { fa: 'عرض زمین پلیسه', en: 'Flash land width', unit: 'mm' },
    },
  };

  // ────────────────────────────────────────────────────────────────────────
  // 8. Unit conversion helpers — تبدیل یکا (display layer only)
  // ────────────────────────────────────────────────────────────────────────

  const units = {
    N_to_kN: (x) => x / 1000,
    N_to_tonf: (x) => x / 9806.65,
    N_to_lbf: (x) => x / 4.4482216,
    MPa_to_ksi: (x) => x / 6.894757,
    MPa_to_kgf_mm2: (x) => x / 9.80665,
    mm_to_in: (x) => x / 25.4,
    W_to_kW: (x) => x / 1000,
    W_to_hp: (x) => x / 745.6999,
    Nmm_to_Nm: (x) => x / 1000,
    Nmm_to_lbft: (x) => x / 1355.818,
    rpm_to_revps: (x) => x / 60,
    C_to_K: (x) => x + 273.15,
    mm3_to_cm3: (x) => x / 1000,
  };

  // ────────────────────────────────────────────────────────────────────────

  return {
    version: '1.0.0',
    core, forging, rolling, extrusion, drawing, units, UI,
    data: {
      MATERIALS_COLD, MATERIALS_HOT, PHYSICAL, EXTRUSION_CONSTANT,
      FRICTION, EFFICIENCY, SHAPE_FACTOR_KF,
    },
    helpers: { areaOfCircle, diaOfArea, rad, deg, round },
  };
});
