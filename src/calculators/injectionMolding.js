/*!
 * injectionMolding.js — قالب تزریق پلاستیک / Injection Mold Design & Molding Data
 * Drop-in calculation module. Third in the set with bulkForming.js and sheetForming.js —
 * same UMD wrapper, same { ...results, warnings[], steps[] } return shape.
 *
 * UNIT SYSTEM — metric core, imperial I/O layer:
 *   length mm | area mm² | volume cm³ | stress/pressure MPa | force kN
 *   mass g | temperature °C | time s | power W | flow L/min | angle DEGREES
 * Imperial helpers live in `units` and `imperial`; nothing internal uses them.
 *
 * Machine injection capacity in ounces is rated on GPPS (SG 1.05) — see machine.injectionUnit.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.InjectionMolding = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ────────────────────────────────────────────────────────────────────────
  // 0. Helpers & constants
  // ────────────────────────────────────────────────────────────────────────

  const DEG = Math.PI / 180;
  const rad = (d) => d * DEG;
  const deg = (r) => r / DEG;

  const MM2_PER_IN2 = 645.16;
  const MM_PER_IN = 25.4;
  const G_PER_OZ = 28.349523125;
  const KN_PER_US_TON = 8.896443;
  const KN_PER_METRIC_TON = 9.80665;
  const MPA_PER_TON_IN2 = 13.78951;      // 2000 psi
  const CM3_PER_OZ_GPPS = G_PER_OZ / 1.05; // 26.999… cm³ of any melt per rated oz
  const GPPS_SG = 1.05;

  /** Water properties at ~30 °C */
  const WATER = { rho: 996, cp: 4180, mu: 0.798e-3 };
  const STEEL_E = 210000; // MPa

  function req(v, name) {
    if (typeof v !== 'number' || !isFinite(v)) {
      throw new TypeError(`injectionMolding: parameter "${name}" must be a finite number (got ${v})`);
    }
    return v;
  }
  function pos(v, name) {
    req(v, name);
    if (v <= 0) throw new RangeError(`injectionMolding: parameter "${name}" must be > 0 (got ${v})`);
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
  // 1. Polymer database — جدول داده پلیمرها
  // ────────────────────────────────────────────────────────────────────────

  /**
   * rho g/cm³ | alpha thermal diffusivity mm²/s | Tmelt/Tmold/Teject °C
   * cp J/(kg·K) | Hf latent heat of crystallisation kJ/kg (0 for amorphous)
   * shrink fractional (mean) | shrinkRange [min,max] | pCav typical cavity pressure MPa
   * ltMax max flow-length ratio | gateN side-gate material constant
   * ventDepth mm | mu friction on polished steel | maxResidence_s
   */
  const POLYMERS = {
    PS:    { fa: 'پلی‌استایرن', en: 'Polystyrene', type: 'amorphous',
      rho: 1.05, alpha: 0.09, Tmelt: 230, Tmold: 40, Teject: 80, cp: 1300, Hf: 0,
      shrink: 0.0055, shrinkRange: [0.004, 0.007], pCav: 25, ltMax: 275, gateN: 0.6,
      ventDepth: 0.025, mu: 0.35, maxResidence_s: 600 },
    ABS:   { fa: 'ای‌بی‌اس', en: 'ABS', type: 'amorphous',
      rho: 1.05, alpha: 0.10, Tmelt: 240, Tmold: 60, Teject: 95, cp: 1400, Hf: 0,
      shrink: 0.0055, shrinkRange: [0.004, 0.007], pCav: 35, ltMax: 185, gateN: 0.7,
      ventDepth: 0.025, mu: 0.35, maxResidence_s: 600 },
    SAN:   { fa: 'اس‌ای‌ان', en: 'SAN', type: 'amorphous',
      rho: 1.08, alpha: 0.09, Tmelt: 230, Tmold: 60, Teject: 95, cp: 1350, Hf: 0,
      shrink: 0.005, shrinkRange: [0.004, 0.006], pCav: 35, ltMax: 200, gateN: 0.6,
      ventDepth: 0.025, mu: 0.35, maxResidence_s: 600 },
    PMMA:  { fa: 'پلکسی‌گلاس', en: 'Acrylic (PMMA)', type: 'amorphous',
      rho: 1.18, alpha: 0.09, Tmelt: 230, Tmold: 70, Teject: 90, cp: 1450, Hf: 0,
      shrink: 0.0055, shrinkRange: [0.003, 0.008], pCav: 50, ltMax: 145, gateN: 0.8,
      ventDepth: 0.025, mu: 0.45, maxResidence_s: 480 },
    PC:    { fa: 'پلی‌کربنات', en: 'Polycarbonate', type: 'amorphous',
      rho: 1.20, alpha: 0.13, Tmelt: 300, Tmold: 100, Teject: 135, cp: 1250, Hf: 0,
      shrink: 0.0065, shrinkRange: [0.005, 0.008], pCav: 55, ltMax: 115, gateN: 0.8,
      ventDepth: 0.025, mu: 0.45, maxResidence_s: 480 },
    PVC_U: { fa: 'پی‌وی‌سی سخت', en: 'Rigid PVC', type: 'amorphous',
      rho: 1.40, alpha: 0.12, Tmelt: 180, Tmold: 40, Teject: 70, cp: 1000, Hf: 0,
      shrink: 0.006, shrinkRange: [0.004, 0.008], pCav: 50, ltMax: 110, gateN: 0.9,
      ventDepth: 0.015, mu: 0.40, maxResidence_s: 240 },
    PSU:   { fa: 'پلی‌سولفون', en: 'Polysulfone', type: 'amorphous',
      rho: 1.24, alpha: 0.13, Tmelt: 355, Tmold: 140, Teject: 180, cp: 1300, Hf: 0,
      shrink: 0.007, shrinkRange: [0.006, 0.008], pCav: 60, ltMax: 90, gateN: 0.8,
      ventDepth: 0.025, mu: 0.45, maxResidence_s: 300 },
    PP:    { fa: 'پلی‌پروپیلن', en: 'Polypropylene', type: 'semicrystalline',
      rho: 0.905, alpha: 0.09, Tmelt: 230, Tmold: 40, Teject: 95, cp: 1900, Hf: 100,
      shrink: 0.018, shrinkRange: [0.012, 0.025], pCav: 25, ltMax: 265, gateN: 0.7,
      ventDepth: 0.020, mu: 0.25, maxResidence_s: 900 },
    PE_HD: { fa: 'پلی‌اتیلن سنگین', en: 'HDPE', type: 'semicrystalline',
      rho: 0.95, alpha: 0.17, Tmelt: 230, Tmold: 40, Teject: 90, cp: 2300, Hf: 200,
      shrink: 0.022, shrinkRange: [0.015, 0.030], pCav: 22, ltMax: 250, gateN: 0.6,
      ventDepth: 0.020, mu: 0.25, maxResidence_s: 900 },
    PE_LD: { fa: 'پلی‌اتیلن سبک', en: 'LDPE', type: 'semicrystalline',
      rho: 0.92, alpha: 0.12, Tmelt: 210, Tmold: 35, Teject: 80, cp: 2300, Hf: 130,
      shrink: 0.022, shrinkRange: [0.015, 0.030], pCav: 20, ltMax: 280, gateN: 0.6,
      ventDepth: 0.020, mu: 0.25, maxResidence_s: 900 },
    POM:   { fa: 'پلی‌استال', en: 'Acetal (POM)', type: 'semicrystalline',
      rho: 1.41, alpha: 0.09, Tmelt: 200, Tmold: 90, Teject: 140, cp: 1500, Hf: 160,
      shrink: 0.021, shrinkRange: [0.018, 0.025], pCav: 55, ltMax: 180, gateN: 0.7,
      ventDepth: 0.015, mu: 0.25, maxResidence_s: 300 },
    PA6:   { fa: 'نایلون ۶', en: 'Nylon 6 (PA6)', type: 'semicrystalline',
      rho: 1.13, alpha: 0.09, Tmelt: 250, Tmold: 80, Teject: 135, cp: 1700, Hf: 130,
      shrink: 0.012, shrinkRange: [0.008, 0.015], pCav: 40, ltMax: 285, gateN: 0.7,
      ventDepth: 0.012, mu: 0.25, maxResidence_s: 480 },
    PA66:  { fa: 'نایلون ۶۶', en: 'Nylon 66 (PA66)', type: 'semicrystalline',
      rho: 1.14, alpha: 0.10, Tmelt: 280, Tmold: 80, Teject: 150, cp: 1700, Hf: 130,
      shrink: 0.014, shrinkRange: [0.008, 0.020], pCav: 40, ltMax: 285, gateN: 0.7,
      ventDepth: 0.012, mu: 0.25, maxResidence_s: 480 },
    PBT:   { fa: 'پی‌بی‌تی', en: 'PBT', type: 'semicrystalline',
      rho: 1.31, alpha: 0.08, Tmelt: 250, Tmold: 70, Teject: 130, cp: 1600, Hf: 120,
      shrink: 0.020, shrinkRange: [0.015, 0.025], pCav: 45, ltMax: 175, gateN: 0.7,
      ventDepth: 0.015, mu: 0.25, maxResidence_s: 420 },
    PET:   { fa: 'پی‌ای‌تی', en: 'PET', type: 'semicrystalline',
      rho: 1.37, alpha: 0.09, Tmelt: 275, Tmold: 120, Teject: 130, cp: 1550, Hf: 110,
      shrink: 0.016, shrinkRange: [0.012, 0.020], pCav: 45, ltMax: 175, gateN: 0.7,
      ventDepth: 0.015, mu: 0.25, maxResidence_s: 420 },
  };

  /** Tonnage bands by L/T ratio — the Caco Pacific sheet convention */
  const TONNAGE_BANDS = [
    { maxLT: 125,      tonsPerIn2: 2.0, fa: 'L/T < 125',       en: 'L/T < 125' },
    { maxLT: 200,      tonsPerIn2: 3.0, fa: '125 ≤ L/T < 200', en: '125 ≤ L/T < 200' },
    { maxLT: 300,      tonsPerIn2: 4.0, fa: '200 ≤ L/T < 300', en: '200 ≤ L/T < 300' },
    { maxLT: Infinity, tonsPerIn2: 5.0, fa: 'L/T ≥ 300',       en: 'L/T ≥ 300' },
  ];

  /** Practical cavity counts — even, balanceable layouts */
  const PRACTICAL_CAVITIES = [1, 2, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 128];

  /** Draft angle guidance by surface finish */
  const DRAFT_GUIDANCE = {
    polished:      { fa: 'پولیش‌شده',        en: 'Polished',        min: 0.5, max: 1.0 },
    machined:      { fa: 'ماشین‌کاری معمولی', en: 'As-machined',     min: 1.0, max: 2.0 },
    lightTexture:  { fa: 'بافت سبک VDI 24-27', en: 'Light texture',  min: 2.0, max: 3.0 },
    coarseTexture: { fa: 'بافت درشت VDI 33-45', en: 'Coarse texture', min: 3.0, max: 5.0 },
  };

  /** Gate types and typical dimensions */
  const GATE_TYPES = {
    edge:      { fa: 'گیت لبه‌ای',  en: 'Edge / side gate', sized: true },
    pin:       { fa: 'گیت نقطه‌ای', en: 'Pin / pinpoint',   dia: [0.8, 1.5] },
    submarine: { fa: 'زیرگیت',      en: 'Submarine / tunnel', dia: [0.8, 1.5], angle: [30, 45] },
    fan:       { fa: 'گیت پره‌ای',  en: 'Fan gate',         depthFactor: [0.3, 0.6] },
    film:      { fa: 'گیت فیلمی',   en: 'Film / flash gate', depth: [0.2, 0.6] },
    diaphragm: { fa: 'گیت دیسکی',   en: 'Diaphragm gate',   note: 'قطعات استوانه‌ای هم‌محور' },
    direct:    { fa: 'گیت مستقیم',  en: 'Direct / sprue gate', note: 'تک‌حفره‌ای بزرگ' },
  };

  // ────────────────────────────────────────────────────────────────────────
  // 2. Unit conversion
  // ────────────────────────────────────────────────────────────────────────

  const units = {
    in_to_mm: (x) => x * MM_PER_IN,
    mm_to_in: (x) => x / MM_PER_IN,
    in2_to_mm2: (x) => x * MM2_PER_IN2,
    mm2_to_in2: (x) => x / MM2_PER_IN2,
    in3_to_cm3: (x) => x * 16.387064,
    cm3_to_in3: (x) => x / 16.387064,
    oz_to_g: (x) => x * G_PER_OZ,
    g_to_oz: (x) => x / G_PER_OZ,
    usTon_to_kN: (x) => x * KN_PER_US_TON,
    kN_to_usTon: (x) => x / KN_PER_US_TON,
    metricTon_to_kN: (x) => x * KN_PER_METRIC_TON,
    kN_to_metricTon: (x) => x / KN_PER_METRIC_TON,
    usTon_to_metricTon: (x) => x * KN_PER_US_TON / KN_PER_METRIC_TON,
    metricTon_to_usTon: (x) => x * KN_PER_METRIC_TON / KN_PER_US_TON,
    tonPerIn2_to_MPa: (x) => x * MPA_PER_TON_IN2,
    MPa_to_tonPerIn2: (x) => x / MPA_PER_TON_IN2,
    psi_to_MPa: (x) => x * 0.006894757,
    MPa_to_psi: (x) => x / 0.006894757,
    C_to_F: (x) => x * 9 / 5 + 32,
    F_to_C: (x) => (x - 32) * 5 / 9,
    /** Machine injection rating: ounces of GPPS → volumetric capacity in cm³ */
    ozGPPS_to_cm3: (x) => x * CM3_PER_OZ_GPPS,
    cm3_to_ozGPPS: (x) => x / CM3_PER_OZ_GPPS,
    /** Machine rating in oz → actual grams of a material with given specific gravity */
    ozGPPS_to_g: (oz, sg) => oz * G_PER_OZ * (sg / GPPS_SG),
    Lmin_to_m3s: (x) => x / 60000,
    m3s_to_Lmin: (x) => x * 60000,
  };

  // ────────────────────────────────────────────────────────────────────────
  // 3. Geometry — projected area  |  سطح تصویرشده
  // ────────────────────────────────────────────────────────────────────────

  const geometry = {
    /**
     * Projected area of parts + cold runner — the Caco sheet, in metric.
     * @param {object} o
     * @param {'round'|'rect'|'custom'} o.shape
     * @param {number} [o.partDia]      round parts (mm)
     * @param {number} [o.partLength], [o.partWidth]   rect parts (mm)
     * @param {number} [o.areaPerPart]  custom (mm²)
     * @param {number} o.cavities
     * @param {Array<{width:number,length:number,legs?:number}>} [o.runnerLegs]
     */
    projectedArea(o) {
      const n = pos(o.cavities, 'cavities');
      const warnings = [];
      let areaPerPart, shapeNote;
      switch (o.shape) {
        case 'round':
          areaPerPart = areaOfCircle(pos(o.partDia, 'partDia'));
          shapeNote = 'A = π·D²/4';
          break;
        case 'rect':
          areaPerPart = pos(o.partLength, 'partLength') * pos(o.partWidth, 'partWidth');
          shapeNote = 'A = L × W';
          break;
        case 'custom':
          areaPerPart = pos(o.areaPerPart, 'areaPerPart');
          shapeNote = 'A supplied';
          break;
        default:
          throw new Error('projectedArea: shape must be "round", "rect", or "custom"');
      }
      const partsArea = n * areaPerPart;
      let runnerArea = 0;
      const legs = [];
      (o.runnerLegs || []).forEach((L, i) => {
        const cnt = L.legs || 1;
        const a = pos(L.width, `runnerLegs[${i}].width`) * pos(L.length, `runnerLegs[${i}].length`) * cnt;
        legs.push({ index: i + 1, width: L.width, length: L.length, legs: cnt, area_mm2: round(a) });
        runnerArea += a;
      });
      const total = partsArea + runnerArea;
      const runnerShare = total > 0 ? runnerArea / total : 0;
      if (runnerShare > 0.25) warnings.push('سهم رانر از سطح تصویرشده > 25٪ — رانر را کوچک‌تر یا هات‌رانر را بررسی کنید / runner dominates projected area');
      if (!o.runnerLegs || !o.runnerLegs.length) warnings.push('رانر سرد وارد نشده — اگر قالب رانر سرد دارد، سطح آن را اضافه کنید / cold runner area not included');

      return {
        shape: o.shape, shapeNote, cavities: n,
        areaPerPart_mm2: areaPerPart, areaPerPart_in2: areaPerPart / MM2_PER_IN2,
        partsArea_mm2: partsArea, runnerArea_mm2: runnerArea, runnerLegs: legs,
        totalArea_mm2: total, totalArea_in2: total / MM2_PER_IN2,
        runnerShare, warnings,
        steps: [
          Step('سطح هر قطعه / area per part', shapeNote, areaPerPart, 'mm²'),
          Step('سطح قطعات / parts area', 'n × A_part', partsArea, 'mm²'),
          Step('سطح رانر / runner area', 'Σ(w × L × legs)', runnerArea, 'mm²'),
          Step('سطح کل / total projected', 'parts + runner', total, 'mm²'),
        ],
      };
    },

    /** Part volume and mass from geometry — helper for shot weight. */
    partMass({ volume_mm3, materialKey, rho }) {
      pos(volume_mm3, 'volume_mm3');
      const p = POLYMERS[materialKey];
      const density = (typeof rho === 'number') ? rho : (p ? p.rho : null);
      if (!density) throw new Error('partMass: supply rho or materialKey');
      return { volume_cm3: volume_mm3 / 1000, rho: density, mass_g: volume_mm3 / 1000 * density };
    },

    /** Round cold-runner volume and mass from leg geometry. */
    runnerMass({ legs, materialKey, rho }) {
      if (!Array.isArray(legs) || !legs.length) throw new Error('runnerMass: legs array required');
      const p = POLYMERS[materialKey];
      const density = (typeof rho === 'number') ? rho : (p ? p.rho : null);
      if (!density) throw new Error('runnerMass: supply rho or materialKey');
      let vol = 0;
      legs.forEach((L, i) => {
        const cnt = L.count || 1;
        vol += areaOfCircle(pos(L.dia, `legs[${i}].dia`)) * pos(L.length, `legs[${i}].length`) * cnt;
      });
      return { volume_mm3: vol, volume_cm3: vol / 1000, mass_g: vol / 1000 * density };
    },
  };

  // ────────────────────────────────────────────────────────────────────────
  // 4. Machine sizing — L/T, tonnage, shot, injection unit
  // ────────────────────────────────────────────────────────────────────────

  const machine = {
    /** Flow-length to wall-thickness ratio — نسبت L/T. */
    ltRatio({ flowLength, wallThickness, materialKey }) {
      const L = pos(flowLength, 'flowLength');
      const t = pos(wallThickness, 'wallThickness');
      const lt = L / t;
      const p = POLYMERS[materialKey];
      const band = TONNAGE_BANDS.find((b) => lt < b.maxLT);
      const warnings = [];
      if (p && lt > p.ltMax) {
        warnings.push(`L/T = ${round(lt)} بیش از حد ${p.en} (${p.ltMax}) — پرنشدن محتمل؛ گیت اضافه یا دیواره ضخیم‌تر / short shot likely`);
      } else if (p && lt > 0.85 * p.ltMax) {
        warnings.push(`L/T در ۸۵٪ حد ماده — حاشیه کم / close to the material's flow limit`);
      }
      return {
        ltRatio: lt, band: band.en, bandFa: band.fa, tonsPerIn2: band.tonsPerIn2,
        equivalentCavityPressure_MPa: band.tonsPerIn2 * MPA_PER_TON_IN2,
        materialLtMax: p ? p.ltMax : null,
        utilisation: p ? lt / p.ltMax : null, warnings,
        steps: [Step('نسبت L/T', 'L / t', lt, '—')],
      };
    },

    /**
     * Clamping tonnage by both methods — تناژ قفل‌کننده.
     * @param {object} o
     * @param {number} o.projectedArea_mm2
     * @param {number} [o.ltRatio]        drives the Caco band method
     * @param {number} [o.cavityPressure_MPa]  or materialKey for the engineering method
     * @param {string} [o.materialKey]
     * @param {number} [o.safetyFactor=1.2]
     * @param {number} [o.machineTonnage_metricTon]  optional, to check utilisation
     */
    tonnage(o) {
      const A = pos(o.projectedArea_mm2, 'projectedArea_mm2');
      const A_in2 = A / MM2_PER_IN2;
      const SF = o.safetyFactor === undefined ? 1.2 : o.safetyFactor;
      const p = POLYMERS[o.materialKey];
      const warnings = [];

      // Method A — L/T band (Caco sheet)
      let bandResult = null;
      if (typeof o.ltRatio === 'number') {
        const band = TONNAGE_BANDS.find((b) => o.ltRatio < b.maxLT);
        const usTons = A_in2 * band.tonsPerIn2;
        bandResult = {
          band: band.en, tonsPerIn2: band.tonsPerIn2,
          usTons, metricTons: usTons * KN_PER_US_TON / KN_PER_METRIC_TON,
          kN: usTons * KN_PER_US_TON,
        };
      }

      // Method B — cavity pressure
      let pressureResult = null;
      const pCav = (typeof o.cavityPressure_MPa === 'number') ? o.cavityPressure_MPa : (p ? p.pCav : null);
      if (pCav) {
        const kN = pCav * A / 1000;
        pressureResult = {
          cavityPressure_MPa: pCav, kN,
          metricTons: kN / KN_PER_METRIC_TON, usTons: kN / KN_PER_US_TON,
        };
      }
      if (!bandResult && !pressureResult) {
        throw new Error('tonnage: supply ltRatio, or cavityPressure_MPa / materialKey');
      }

      const candidates = [bandResult, pressureResult].filter(Boolean).map((r) => r.kN);
      const governing_kN = Math.max(...candidates);
      const governingMethod = (pressureResult && governing_kN === pressureResult.kN) ? 'cavityPressure' : 'ltBand';
      const required_kN = governing_kN * SF;

      if (bandResult && pressureResult) {
        const spread = Math.abs(bandResult.kN - pressureResult.kN) / Math.min(bandResult.kN, pressureResult.kN);
        if (spread > 0.30) warnings.push(`دو روش ${round(spread * 100, 3)}٪ اختلاف دارند — ورودی‌ها را بازبینی کنید / the two methods disagree by more than 30%`);
      }

      let utilisation = null, recommendedMachine = null;
      if (typeof o.machineTonnage_metricTon === 'number') {
        const mach_kN = o.machineTonnage_metricTon * KN_PER_METRIC_TON;
        utilisation = governing_kN / mach_kN;
        if (utilisation > 0.8) warnings.push('نیروی لازم > ۸۰٪ ظرفیت ماشین — حاشیه ناکافی / insufficient clamp margin');
        if (utilisation < 0.3) warnings.push('نیروی لازم < ۳۰٪ ظرفیت — ماشین بیش از حد بزرگ: هزینه و ریسک بستن ونت‌ها / machine oversized');
      } else {
        // suggest a machine so the requirement lands at ~65 % of rating
        recommendedMachine = required_kN / KN_PER_METRIC_TON / 0.65;
      }

      return {
        projectedArea_mm2: A, projectedArea_in2: A_in2,
        ltBandMethod: bandResult, cavityPressureMethod: pressureResult,
        governingMethod, governing_kN,
        governing_metricTons: governing_kN / KN_PER_METRIC_TON,
        governing_usTons: governing_kN / KN_PER_US_TON,
        safetyFactor: SF, required_kN,
        required_metricTons: required_kN / KN_PER_METRIC_TON,
        required_usTons: required_kN / KN_PER_US_TON,
        machineUtilisation: utilisation,
        recommendedMachine_metricTons: recommendedMachine, warnings,
        steps: [
          bandResult ? Step('روش باند L/T', 'F = A[in²] × tons/in²', bandResult.usTons, 'US ton') : null,
          pressureResult ? Step('روش فشار حفره', 'F = p × A / 1000', pressureResult.kN, 'kN') : null,
          Step('نیروی لازم / required', `governing × ${SF}`, required_kN, 'kN'),
        ].filter(Boolean),
      };
    },

    /**
     * Shot weight and injection unit sizing — وزن شات و واحد تزریق.
     * @param {object} o
     * @param {number} o.partWeight_g
     * @param {number} o.cavities
     * @param {number} [o.runnerWeight_g=0]
     * @param {string} [o.materialKey]  or specificGravity
     * @param {number} [o.specificGravity]
     * @param {number} [o.targetFill=0.5]  desired fraction of barrel capacity
     * @param {number} [o.machineCapacity_oz]  optional, to check utilisation
     * @param {number} [o.cycleTime_s]  optional, for residence time & plasticizing rate
     */
    injectionUnit(o) {
      const wPart = pos(o.partWeight_g, 'partWeight_g');
      const n = pos(o.cavities, 'cavities');
      const wRunner = o.runnerWeight_g || 0;
      const p = POLYMERS[o.materialKey];
      const sg = (typeof o.specificGravity === 'number') ? o.specificGravity : (p ? p.rho : null);
      if (!sg) throw new Error('injectionUnit: supply specificGravity or materialKey');
      const targetFill = o.targetFill === undefined ? 0.5 : o.targetFill;
      const warnings = [];

      const wShot = n * wPart + wRunner;
      const vShot = wShot / sg;                                  // cm³
      const shotOz = wShot / G_PER_OZ;
      const runnerEfficiency = (n * wPart) / wShot;

      // Machine rating in oz is GPPS-based: capacity_cm3 = oz × 27.0
      const requiredCapacity_cm3 = vShot / targetFill;
      const requiredCapacity_ozGPPS = requiredCapacity_cm3 / CM3_PER_OZ_GPPS;
      const minCapacity_ozGPPS = (vShot / 0.80) / CM3_PER_OZ_GPPS;
      const maxCapacity_ozGPPS = (vShot / 0.20) / CM3_PER_OZ_GPPS;

      let utilisation = null, machineCapacity_cm3 = null, machineCapacity_g = null;
      let residence_s = null, plasticizingRate_kgh = null;
      if (typeof o.machineCapacity_oz === 'number') {
        machineCapacity_cm3 = o.machineCapacity_oz * CM3_PER_OZ_GPPS;
        machineCapacity_g = machineCapacity_cm3 * sg;
        utilisation = vShot / machineCapacity_cm3;
        if (utilisation > 0.80) warnings.push(`استفاده از بشکه ${round(utilisation * 100, 3)}٪ > ۸۰٪ — کوسن ناکافی / no cushion left`);
        if (utilisation < 0.20) warnings.push(`استفاده از بشکه ${round(utilisation * 100, 3)}٪ < ۲۰٪ — زمان اقامت طولانی و تخریب حرارتی / residence time too long`);
        if (typeof o.cycleTime_s === 'number') {
          residence_s = (machineCapacity_cm3 / vShot) * o.cycleTime_s;
          if (p && residence_s > p.maxResidence_s) {
            warnings.push(`زمان اقامت ${round(residence_s)} s بیش از حد ${p.en} (${p.maxResidence_s} s) — تخریب حرارتی / thermal degradation risk`);
          }
        }
      }
      if (typeof o.cycleTime_s === 'number') {
        plasticizingRate_kgh = wShot * 3600 / (o.cycleTime_s * 1000);
      }
      if (runnerEfficiency < 0.7) warnings.push(`بازده رانر ${round(runnerEfficiency * 100, 3)}٪ < ۷۰٪ — رانر بیش از حد سنگین / runner too heavy relative to parts`);

      return {
        partWeight_g: wPart, cavities: n, runnerWeight_g: wRunner,
        shotWeight_g: wShot, shotWeight_oz: shotOz,
        shotVolume_cm3: vShot, specificGravity: sg, runnerEfficiency,
        requiredCapacity_cm3, requiredCapacity_ozGPPS, targetFill,
        capacityWindow_ozGPPS: [minCapacity_ozGPPS, maxCapacity_ozGPPS],
        machineCapacity_cm3, machineCapacity_g, barrelUtilisation: utilisation,
        residenceTime_s: residence_s, residenceTime_min: residence_s ? residence_s / 60 : null,
        plasticizingRate_kgh, warnings,
        steps: [
          Step('وزن شات / shot weight', 'n × W_part + W_runner', wShot, 'g'),
          Step('حجم شات / shot volume', 'W_shot / SG', vShot, 'cm³'),
          Step('ظرفیت ترجیحی / preferred capacity', `V_shot / ${targetFill} ÷ 27.0`, requiredCapacity_ozGPPS, 'oz'),
        ],
      };
    },

    /** Convert a machine's oz rating to real capacity for a given polymer. */
    barrelCapacity({ rating_oz, materialKey, specificGravity }) {
      pos(rating_oz, 'rating_oz');
      const p = POLYMERS[materialKey];
      const sg = (typeof specificGravity === 'number') ? specificGravity : (p ? p.rho : null);
      if (!sg) throw new Error('barrelCapacity: supply specificGravity or materialKey');
      const cm3 = rating_oz * CM3_PER_OZ_GPPS;
      return {
        rating_oz, volume_cm3: cm3, mass_g: cm3 * sg, specificGravity: sg,
        note: 'رتبه اونس ماشین بر مبنای GPPS با SG=1.05 است / machine oz rating is GPPS-based',
      };
    },
  };

  // ────────────────────────────────────────────────────────────────────────
  // 5. Cooling & cycle — خنک‌کاری و سیکل
  // ────────────────────────────────────────────────────────────────────────

  const cooling = {
    /**
     * Cooling time — زمان خنک‌کاری.
     * @param {object} o
     * @param {number} o.wallThickness   plate thickness s (mm), or diameter for 'cylinder'
     * @param {'plate'|'cylinder'} [o.geometry='plate']
     * @param {string} [o.materialKey]   supplies alpha and temperatures
     * @param {number} [o.alpha]         mm²/s
     * @param {number} [o.Tmelt], [o.Tmold], [o.Teject]  °C
     * @param {number} [o.complexityFactor=1]  1.2–1.5 for ribbed / variable-thickness parts
     */
    coolingTime(o) {
      const s = pos(o.wallThickness, 'wallThickness');
      const p = POLYMERS[o.materialKey];
      const alpha = (typeof o.alpha === 'number') ? o.alpha : (p ? p.alpha : null);
      const Tm = (typeof o.Tmelt === 'number') ? o.Tmelt : (p ? p.Tmelt : null);
      const Tw = (typeof o.Tmold === 'number') ? o.Tmold : (p ? p.Tmold : null);
      const Te = (typeof o.Teject === 'number') ? o.Teject : (p ? p.Teject : null);
      if (!alpha || Tm === null || Tw === null || Te === null) {
        throw new Error('coolingTime: supply alpha/Tmelt/Tmold/Teject, or materialKey');
      }
      const warnings = [];
      if (Te <= Tw) throw new RangeError('coolingTime: Teject must be > Tmold (otherwise the part never reaches ejection temperature)');
      if (Tm <= Te) throw new RangeError('coolingTime: Tmelt must be > Teject');

      const ratio = (Tm - Tw) / (Te - Tw);
      const geom = o.geometry || 'plate';
      const cf = o.complexityFactor === undefined ? 1 : o.complexityFactor;
      let t, formula;
      if (geom === 'cylinder') {
        t = (s * s / (23.1 * alpha)) * Math.log(0.692 * ratio);
        formula = 't = (d²/(23.1·α))·ln(0.692·ΔT_ratio)';
      } else {
        t = (s * s / (Math.PI * Math.PI * alpha)) * Math.log((4 / Math.PI) * ratio);
        formula = 't = (s²/(π²·α))·ln((4/π)·ΔT_ratio)';
      }
      const tAdj = t * cf;

      if (cf === 1 && s > 3) warnings.push('دیواره > 3 mm — برای قطعات دنده‌دار یا با ضخامت متغیر ضریب پیچیدگی 1.2–1.5 اعمال کنید / consider a complexity factor');
      if (alpha > 0.25 || alpha < 0.05) warnings.push('α خارج از محدوده معمول پلیمرها (0.05–0.20 mm²/s) — واحد را بررسی کنید / thermal diffusivity outside the usual polymer range');

      return {
        geometry: geom, wallThickness_mm: s, alpha, Tmelt: Tm, Tmold: Tw, Teject: Te,
        temperatureRatio: ratio, complexityFactor: cf,
        coolingTime_s: tAdj, coolingTimeBase_s: t, formula, warnings,
        steps: [
          Step('نسبت دما / temperature ratio', '(Tm − Tw)/(Te − Tw)', ratio, '—'),
          Step('زمان خنک‌کاری / cooling time', formula, tAdj, 's'),
        ],
      };
    },

    /**
     * Full cycle time — زمان سیکل.
     * @param {object} o {coolingTime_s, injectionTime_s, packTime_s (or packFactor),
     *                    moldOpenCloseEject_s}
     */
    cycleTime(o) {
      const tc = pos(o.coolingTime_s, 'coolingTime_s');
      const ti = o.injectionTime_s === undefined ? 1.5 : o.injectionTime_s;
      const tp = o.packTime_s !== undefined ? o.packTime_s : tc * (o.packFactor === undefined ? 0.5 : o.packFactor);
      const tm = o.moldOpenCloseEject_s === undefined ? 4 : o.moldOpenCloseEject_s;
      const total = ti + tp + tc + tm;
      const warnings = [];
      const coolShare = tc / total;
      if (coolShare < 0.4) warnings.push('سهم خنک‌کاری < ۴۰٪ — معمولاً ۷۰–۸۰٪ است؛ ورودی‌ها را بررسی کنید / cooling share unusually low');
      return {
        injectionTime_s: ti, packTime_s: tp, coolingTime_s: tc, moldTime_s: tm,
        cycleTime_s: total, coolingShare: coolShare,
        shotsPerHour: 3600 / total, warnings,
        steps: [Step('زمان سیکل / cycle time', 't_inj + t_pack + t_cool + t_mold', total, 's')],
      };
    },

    /**
     * Heat load and coolant flow — بار حرارتی و دبی.
     * @param {object} o {shotWeight_g, cycleTime_s, materialKey (or cp, Hf, Tmelt, Teject),
     *                    waterDeltaT_K=2.5}
     */
    heatLoad(o) {
      const m = pos(o.shotWeight_g, 'shotWeight_g') / 1000;   // kg
      const tCycle = pos(o.cycleTime_s, 'cycleTime_s');
      const p = POLYMERS[o.materialKey];
      const cp = (typeof o.cp === 'number') ? o.cp : (p ? p.cp : null);
      const Hf = (typeof o.Hf === 'number') ? o.Hf : (p ? p.Hf : 0);
      const Tm = (typeof o.Tmelt === 'number') ? o.Tmelt : (p ? p.Tmelt : null);
      const Te = (typeof o.Teject === 'number') ? o.Teject : (p ? p.Teject : null);
      if (!cp || Tm === null || Te === null) throw new Error('heatLoad: supply cp/Tmelt/Teject or materialKey');
      const dTw = o.waterDeltaT_K === undefined ? 2.5 : o.waterDeltaT_K;
      const warnings = [];

      const specificEnthalpy = cp * (Tm - Te) + Hf * 1000;    // J/kg
      const Q = m * specificEnthalpy;                          // J per cycle
      const Qdot = Q / tCycle;                                 // W
      const Vdot_m3s = Qdot / (WATER.rho * WATER.cp * dTw);
      const Vdot_Lmin = Vdot_m3s * 60000;

      if (dTw > 3) warnings.push('ΔT آب > 3 K — اختلاف دمای سطح قالب و تاب‌برداشتن قطعه / mold surface temperature gradient, part will warp');
      if (Hf > 0) warnings.push('پلیمر نیمه‌بلوری — گرمای نهان تبلور در محاسبه لحاظ شد / latent heat of crystallisation included');

      return {
        shotMass_kg: m, specificEnthalpy_J_kg: specificEnthalpy,
        heatPerCycle_J: Q, heatRate_W: Qdot,
        waterDeltaT_K: dTw, coolantFlow_m3s: Vdot_m3s, coolantFlow_Lmin: Vdot_Lmin,
        warnings,
        steps: [
          Step('آنتالپی ویژه', 'cp·(Tm − Te) + Hf', specificEnthalpy, 'J/kg'),
          Step('گرمای هر سیکل', 'm · Δh', Q, 'J'),
          Step('توان حرارتی', 'Q / t_cycle', Qdot, 'W'),
          Step('دبی آب / coolant flow', 'Q̇/(ρ·cp·ΔT)', Vdot_Lmin, 'L/min'),
        ],
      };
    },

    /**
     * Cooling channel design & Reynolds check — طراحی کانال خنک‌کاری.
     * @param {object} o {channelDia_mm, totalFlow_Lmin, circuits=1, wallThickness_mm (part),
     *                    channelLength_mm (optional, for pressure drop)}
     */
    channels(o) {
      const d = pos(o.channelDia_mm, 'channelDia_mm');
      const totalFlow = pos(o.totalFlow_Lmin, 'totalFlow_Lmin');
      const circuits = o.circuits || 1;
      const warnings = [];

      const flowPerCircuit_Lmin = totalFlow / circuits;
      const flowPerCircuit_m3s = flowPerCircuit_Lmin / 60000;
      const d_m = d / 1000;
      const area_m2 = Math.PI * d_m * d_m / 4;
      const v = flowPerCircuit_m3s / area_m2;                 // m/s
      const mdot = flowPerCircuit_m3s * WATER.rho;            // kg/s
      const Re = 4 * mdot / (Math.PI * d_m * WATER.mu);

      let regime, regimeFa;
      if (Re < 2300) { regime = 'laminar'; regimeFa = 'آرام'; }
      else if (Re < 4000) { regime = 'transitional'; regimeFa = 'گذرا'; }
      else if (Re < 10000) { regime = 'turbulent (weak)'; regimeFa = 'آشفته ضعیف'; }
      else { regime = 'turbulent'; regimeFa = 'آشفته'; }

      if (Re < 4000) warnings.push(`Re = ${round(Re)} < 4000 — جریان آرام، کانال عملاً بی‌اثر است؛ دبی را بالا ببرید یا مدارها را کم کنید / laminar flow, channel is ineffective`);
      else if (Re < 10000) warnings.push(`Re = ${round(Re)} زیر هدف ۱۰۰۰۰ — انتقال حرارت ضعیف / below the Re ≥ 10,000 target`);

      // pressure drop
      let deltaP_bar = null;
      if (typeof o.channelLength_mm === 'number' && Re > 0) {
        const f = Re > 4000 ? 0.316 / Math.pow(Re, 0.25) : 64 / Re;
        const dp = f * (o.channelLength_mm / 1000 / d_m) * (WATER.rho * v * v / 2);
        deltaP_bar = dp / 1e5;
      }

      // geometry guidance
      const pitch = [3 * d, 5 * d];
      const distFromCavity = [1.5 * d, 3 * d];

      return {
        channelDia_mm: d, circuits,
        flowPerCircuit_Lmin, velocity_m_s: v, massFlowPerCircuit_kg_s: mdot,
        reynolds: Re, regime, regimeFa,
        recommendedPitch_mm: pitch, recommendedDistanceFromCavity_mm: distFromCavity,
        pressureDrop_bar: deltaP_bar, warnings,
        steps: [
          Step('سرعت جریان / velocity', 'V̇ / A', v, 'm/s'),
          Step('عدد رینولدز / Reynolds', '4ṁ/(π·d·μ)', Re, '—'),
        ],
      };
    },

    /** Recommended channel diameter from part wall thickness. */
    recommendChannelDia(wallThickness_mm) {
      const t = pos(wallThickness_mm, 'wallThickness_mm');
      let d;
      if (t < 2) d = 8;
      else if (t < 4) d = 11;
      else if (t < 6) d = 13;
      else d = 14;
      return {
        recommendedDia_mm: d, range_mm: [8, 14],
        pitch_mm: [3 * d, 5 * d], distanceFromCavity_mm: [1.5 * d, 3 * d],
      };
    },
  };

  // ────────────────────────────────────────────────────────────────────────
  // 6. Cavity count — تعداد حفره
  // ────────────────────────────────────────────────────────────────────────

  const cavities = {
    /**
     * Number of cavities from all five constraints — the minimum governs.
     * @param {object} o
     * @param {number} [o.requiredParts]        production requirement over the run
     * @param {number} [o.availableHours]       machine hours available
     * @param {number} [o.uptime=0.85]
     * @param {number} o.cycleTime_s
     * @param {number} o.partWeight_g
     * @param {number} [o.partProjectedArea_mm2]
     * @param {number} [o.machineTonnage_metricTon], [o.cavityPressure_MPa]
     * @param {number} [o.machineCapacity_oz], [o.specificGravity] (or materialKey)
     * @param {number} [o.plasticizingRate_kgh]
     * @param {number} [o.runnerWeight_g=0]
     * @param {number} [o.usablePlateArea_mm2], [o.areaPerCavity_mm2]
     */
    count(o) {
      const tCycle = pos(o.cycleTime_s, 'cycleTime_s');
      const wPart = pos(o.partWeight_g, 'partWeight_g');
      const p = POLYMERS[o.materialKey];
      const sg = (typeof o.specificGravity === 'number') ? o.specificGravity : (p ? p.rho : null);
      const constraints = {};
      const warnings = [];

      if (typeof o.requiredParts === 'number' && typeof o.availableHours === 'number') {
        const uptime = o.uptime === undefined ? 0.85 : o.uptime;
        constraints.production = {
          fa: 'تولید', en: 'Production requirement',
          value: (o.requiredParts * tCycle) / (o.availableHours * 3600 * uptime),
          type: 'minimum',
        };
      }
      if (typeof o.machineTonnage_metricTon === 'number' && typeof o.partProjectedArea_mm2 === 'number') {
        const pCav = o.cavityPressure_MPa || (p ? p.pCav : null);
        if (pCav) {
          constraints.clamp = {
            fa: 'تناژ قفل', en: 'Clamp tonnage',
            value: (o.machineTonnage_metricTon * KN_PER_METRIC_TON * 1000) / (pCav * o.partProjectedArea_mm2),
            type: 'maximum',
          };
        }
      }
      if (typeof o.machineCapacity_oz === 'number' && sg) {
        const cap_g = o.machineCapacity_oz * CM3_PER_OZ_GPPS * sg;
        constraints.shot = {
          fa: 'ظرفیت شات', en: 'Shot capacity',
          value: (0.8 * cap_g - (o.runnerWeight_g || 0)) / wPart,
          type: 'maximum',
        };
      }
      if (typeof o.plasticizingRate_kgh === 'number') {
        constraints.plasticizing = {
          fa: 'نرخ پلاستیسایز', en: 'Plasticizing rate',
          value: (o.plasticizingRate_kgh * 1000 / 3600) * tCycle / wPart,
          type: 'maximum',
        };
      }
      if (typeof o.usablePlateArea_mm2 === 'number' && typeof o.areaPerCavity_mm2 === 'number') {
        constraints.plateSpace = {
          fa: 'فضای صفحه', en: 'Plate space',
          value: o.usablePlateArea_mm2 / o.areaPerCavity_mm2,
          type: 'maximum',
        };
      }

      const maxima = Object.entries(constraints).filter(([, c]) => c.type === 'maximum');
      const minima = Object.entries(constraints).filter(([, c]) => c.type === 'minimum');
      if (!maxima.length && !minima.length) throw new Error('cavities.count: supply at least one constraint set');

      const upperBound = maxima.length ? Math.min(...maxima.map(([, c]) => c.value)) : Infinity;
      const lowerBound = minima.length ? Math.max(...minima.map(([, c]) => c.value)) : 1;
      const governingMax = maxima.length ? maxima.reduce((a, b) => (a[1].value <= b[1].value ? a : b))[0] : null;

      if (lowerBound > upperBound) {
        warnings.push(`نیاز تولید (${round(lowerBound)} حفره) از سقف ماشین (${round(upperBound)}) بیشتر است — ماشین بزرگ‌تر یا سیکل کوتاه‌تر لازم است / production need exceeds machine limits`);
      }
      const raw = Math.min(Math.max(lowerBound, 1), upperBound);
      const practical = cavities.roundToPractical(Math.floor(raw));
      if (practical.value === 0) warnings.push('حتی یک حفره هم از قیود عبور نمی‌کند — ماشین یا قطعه را بازبینی کنید / not even a single cavity fits the constraints');

      return {
        constraints, lowerBound, upperBound, governingConstraint: governingMax,
        rawCavities: raw, recommendedCavities: practical.value,
        practicalOptions: practical.nearby, warnings,
      };
    },

    /** Snap to a balanceable cavity count (never rounding above the input). */
    roundToPractical(n) {
      req(n, 'n');
      const below = PRACTICAL_CAVITIES.filter((c) => c <= n);
      const value = below.length ? below[below.length - 1] : 0;
      const idx = PRACTICAL_CAVITIES.indexOf(value);
      return {
        value,
        nearby: PRACTICAL_CAVITIES.slice(Math.max(0, idx - 1), idx + 2),
        note: 'اعداد فرد و اول چیدمان متوازن نمی‌دهند / odd and prime counts cannot be balanced',
      };
    },

    /**
     * Economic optimum cavity number — تعداد حفره اقتصادی.
     * n_opt = √( N × t_cycle[h] × C_hourly / C_per_cavity )
     */
    economic({ requiredParts, cycleTime_s, hourlyRate, costPerCavity, baseMoldCost }) {
      const N = pos(requiredParts, 'requiredParts');
      const tc = pos(cycleTime_s, 'cycleTime_s') / 3600;   // hours
      const Ch = pos(hourlyRate, 'hourlyRate');
      const Cn = pos(costPerCavity, 'costPerCavity');
      const nOpt = Math.sqrt(N * tc * Ch / Cn);
      const practical = cavities.roundToPractical(Math.round(nOpt));
      const cost = (n) => (baseMoldCost || 0) + n * Cn + (N / n) * tc * Ch;
      return {
        optimumCavities: nOpt, recommendedCavities: practical.value,
        practicalOptions: practical.nearby,
        costAtOptimum: cost(Math.max(1, practical.value)),
        costCurve: PRACTICAL_CAVITIES.filter((c) => c <= nOpt * 3)
          .map((n) => ({ cavities: n, totalCost: round(cost(n)) })),
        steps: [Step('تعداد بهینه / optimum n', '√(N·t_cycle[h]·C_hourly/C_cavity)', nOpt, '—')],
      };
    },
  };

  // ────────────────────────────────────────────────────────────────────────
  // 7. Feed system — اسپرو، رانر، گیت
  // ────────────────────────────────────────────────────────────────────────

  const feed = {
    /** Sprue geometry — اسپرو. */
    sprue({ nozzleDia_mm, length_mm, halfAngle_deg, nozzleRadius_mm }) {
      const dn = pos(nozzleDia_mm, 'nozzleDia_mm');
      const L = pos(length_mm, 'length_mm');
      const a = halfAngle_deg === undefined ? 1.5 : halfAngle_deg;
      const dSmall = dn + 0.75;
      const dLarge = dSmall + 2 * L * Math.tan(rad(a));
      const warnings = [];
      if (a < 1 || a > 2) warnings.push('شیب اسپرو معمولاً ۱ تا ۲ درجه در هر طرف است / sprue draft is normally 1–2° per side');
      if (L > 60) warnings.push('اسپرو بلند — اغلب زمان خنک‌کاری کل را کنترل می‌کند / long sprue may govern the whole cooling time');
      return {
        smallEndDia_mm: dSmall, largeEndDia_mm: dLarge, halfAngle_deg: a, length_mm: L,
        seatRadius_mm: nozzleRadius_mm !== undefined ? nozzleRadius_mm + 1 : null,
        volume_mm3: Math.PI * L * (dSmall * dSmall + dSmall * dLarge + dLarge * dLarge) / 12,
        warnings,
        steps: [
          Step('قطر ورودی / small end', 'D_nozzle + 0.75', dSmall, 'mm'),
          Step('قطر خروجی / large end', 'D_small + 2L·tanα', dLarge, 'mm'),
        ],
      };
    },

    /**
     * Runner diameter — قطر رانر.
     * Empirical: D = √W · ⁴√L / 3.7   (W in g, L in mm)
     */
    runnerDiameter({ partWeight_g, runnerLength_mm, wallThickness_mm }) {
      const W = pos(partWeight_g, 'partWeight_g');
      const L = pos(runnerLength_mm, 'runnerLength_mm');
      const warnings = [];
      const D = Math.sqrt(W) * Math.pow(L, 0.25) / 3.7;
      let Dmin = null, governing = D, rule = 'empirical formula';
      if (typeof wallThickness_mm === 'number') {
        Dmin = wallThickness_mm + 1.5;
        if (Dmin > D) { governing = Dmin; rule = 'D ≥ t_wall + 1.5 (runner must freeze after the part)'; }
      }
      if (W > 200) warnings.push('W > 200 g — فرمول تجربی خارج از محدوده اعتبار؛ از تحلیل افت فشار استفاده کنید / empirical formula out of range');
      if (D < 3 || D > 10) warnings.push(`قطر محاسبه‌شده ${round(D)} mm خارج از بازه معمول ۳–۱۰ mm / computed diameter outside the usual 3–10 mm band`);

      return {
        empiricalDia_mm: D, minimumDia_mm: Dmin, recommendedDia_mm: governing, governingRule: rule,
        volume_mm3: areaOfCircle(governing) * L,
        crossSectionNote: 'دایره بهترین، ذوزنقه‌ای عملی (~85٪ دایره)، نیم‌دایره بدترین / full round best, trapezoidal practical, half-round worst',
        warnings,
        steps: [
          Step('فرمول تجربی / empirical', 'D = √W · ⁴√L / 3.7', D, 'mm'),
          Step('قید انجماد / freeze rule', 'D ≥ t + 1.5', Dmin === null ? D : Dmin, 'mm'),
        ],
      };
    },

    /** Balanced branch sizing: D_main = D_branch · N^(1/3). */
    runnerBranch({ branchDia_mm, branches }) {
      const d = pos(branchDia_mm, 'branchDia_mm');
      const N = pos(branches, 'branches');
      const D = d * Math.pow(N, 1 / 3);
      return {
        branchDia_mm: d, branches: N, mainDia_mm: D, ratio: Math.pow(N, 1 / 3),
        steps: [Step('قطر شاخه اصلی / main dia', 'D = d·N^(1/3)', D, 'mm')],
      };
    },

    /**
     * Edge / side gate dimensions — گیت لبه‌ای.
     * h = n·t   |   w = n·√A/30   (A = cavity surface area, mm²)
     */
    edgeGate({ wallThickness_mm, cavitySurfaceArea_mm2, materialKey, n, landLength_mm }) {
      const t = pos(wallThickness_mm, 'wallThickness_mm');
      const A = pos(cavitySurfaceArea_mm2, 'cavitySurfaceArea_mm2');
      const p = POLYMERS[materialKey];
      const nMat = (typeof n === 'number') ? n : (p ? p.gateN : null);
      if (!nMat) throw new Error('edgeGate: supply n or materialKey');
      const warnings = [];

      let h = nMat * t;
      const w = nMat * Math.sqrt(A) / 30;
      const land = landLength_mm === undefined ? 1.0 : landLength_mm;

      if (h > 0.8 * t) { warnings.push(`عمق گیت به ۰.۸t محدود شد (بود ${round(h)} mm) / gate depth capped at 0.8·t`); h = 0.8 * t; }
      if (h < 0.5) { warnings.push(`عمق گیت ${round(h)} mm < 0.5 mm — انجماد زودرس؛ به 0.5 mm افزایش یافت / gate would freeze prematurely, raised to 0.5 mm`); h = 0.5; }
      if (land > 1.5) warnings.push('طول زمین گیت > 1.5 mm — افت فشار زیاد / gate land too long');

      return {
        materialConstant: nMat, depth_mm: h, width_mm: w, landLength_mm: land,
        area_mm2: h * w, depthToWallRatio: h / t, warnings,
        steps: [
          Step('عمق گیت / gate depth', 'h = n·t', h, 'mm'),
          Step('عرض گیت / gate width', 'w = n·√A/30', w, 'mm'),
        ],
      };
    },

    /** Gate freeze time — uses the plate cooling law with the gate depth. */
    gateFreezeTime({ gateDepth_mm, materialKey, alpha, Tmelt, Tmold, Tfreeze }) {
      const h = pos(gateDepth_mm, 'gateDepth_mm');
      const p = POLYMERS[materialKey];
      const a = (typeof alpha === 'number') ? alpha : (p ? p.alpha : null);
      const Tm = (typeof Tmelt === 'number') ? Tmelt : (p ? p.Tmelt : null);
      const Tw = (typeof Tmold === 'number') ? Tmold : (p ? p.Tmold : null);
      const Tf = (typeof Tfreeze === 'number') ? Tfreeze : (p ? p.Teject : null);
      if (!a || Tm === null || Tw === null || Tf === null) throw new Error('gateFreezeTime: supply properties or materialKey');
      const t = (h * h / (Math.PI * Math.PI * a)) * Math.log((4 / Math.PI) * (Tm - Tw) / (Tf - Tw));
      return {
        gateFreezeTime_s: t,
        recommendedHoldTime_s: t * 1.1,
        note: 'زمان نگه‌داشت باید کمی بیشتر از انجماد گیت باشد؛ بیشتر از آن اتلاف انرژی است / hold slightly past gate freeze, no longer',
        steps: [Step('انجماد گیت / gate freeze', 't = (h²/(π²α))·ln((4/π)·ΔT)', t, 's')],
      };
    },

    /** Runner efficiency — بازده رانر. */
    efficiency({ partsWeight_g, runnerWeight_g }) {
      pos(partsWeight_g, 'partsWeight_g'); req(runnerWeight_g, 'runnerWeight_g');
      const eff = partsWeight_g / (partsWeight_g + runnerWeight_g);
      const warnings = [];
      if (eff < 0.7) warnings.push('بازده رانر < ۷۰٪ — هات‌رانر یا رانر کوچک‌تر را بررسی کنید / consider a hot runner or smaller runner');
      return { efficiency: eff, runnerShare: 1 - eff, warnings };
    },
  };

  // ────────────────────────────────────────────────────────────────────────
  // 8. Part & mold detail — انقباض، پران، ونت، صفحات
  // ────────────────────────────────────────────────────────────────────────

  const part = {
    /** Cavity dimension from part dimension and shrinkage — انقباض. */
    cavityDimension({ partDimension_mm, shrinkage, materialKey, exact }) {
      const d = pos(partDimension_mm, 'partDimension_mm');
      const p = POLYMERS[materialKey];
      const S = (typeof shrinkage === 'number') ? shrinkage : (p ? p.shrink : null);
      if (S === null) throw new Error('cavityDimension: supply shrinkage or materialKey');
      const warnings = [];
      const simple = d * (1 + S);
      const precise = d / (1 - S);
      if (p && p.type === 'semicrystalline') {
        warnings.push('پلیمر نیمه‌بلوری — انقباض به شرایط فرآیند بسیار حساس است / semicrystalline: shrinkage is highly process-sensitive');
      }
      if (p) warnings.push(`محدوده انقباض ${p.en}: ${(p.shrinkRange[0] * 100).toFixed(1)}–${(p.shrinkRange[1] * 100).toFixed(1)}٪ — مقدار میانگین استفاده شد / mean value used`);
      return {
        shrinkage: S, shrinkagePercent: S * 100,
        cavityDimension_mm: exact ? precise : simple,
        simpleFormula_mm: simple, preciseFormula_mm: precise,
        difference_mm: precise - simple,
        shrinkRange: p ? p.shrinkRange : null,
        rangeOfCavityDim_mm: p ? [d * (1 + p.shrinkRange[0]), d * (1 + p.shrinkRange[1])] : null,
        warnings,
        steps: [Step('ابعاد حفره / cavity dim', exact ? 'D/(1−S)' : 'D·(1+S)', exact ? precise : simple, 'mm')],
      };
    },

    /** Draft angle guidance including texture allowance. */
    draft({ finish, textureDepth_mm }) {
      const g = DRAFT_GUIDANCE[finish || 'machined'];
      if (!g) throw new Error(`draft: unknown finish "${finish}"`);
      const textureExtra = textureDepth_mm ? textureDepth_mm / 0.025 : 0;
      return {
        finish: `${g.fa} / ${g.en}`, baseRange_deg: [g.min, g.max],
        textureAllowance_deg: textureExtra,
        recommended_deg: g.max + textureExtra,
        rule: 'به‌ازای هر 0.025 mm عمق بافت، ۱ درجه شیب اضافه / +1° per 0.025 mm of texture depth',
      };
    },

    /**
     * Ejection force — نیروی پران.
     * Contact pressure from shrinkage onto a rigid core, then friction.
     * @param {object} o {coreDia_mm, contactLength_mm, wallThickness_mm,
     *                    modulusAtEject_MPa, shrinkage (or materialKey),
     *                    mu (or materialKey), poisson=0.38, draftAngle_deg=1,
     *                    nPins, pinDia_mm}
     */
    ejectionForce(o) {
      const D = pos(o.coreDia_mm, 'coreDia_mm');
      const L = pos(o.contactLength_mm, 'contactLength_mm');
      const s = pos(o.wallThickness_mm, 'wallThickness_mm');
      const E = pos(o.modulusAtEject_MPa, 'modulusAtEject_MPa');
      const p = POLYMERS[o.materialKey];
      const S = (typeof o.shrinkage === 'number') ? o.shrinkage : (p ? p.shrink : null);
      const mu = (typeof o.mu === 'number') ? o.mu : (p ? p.mu : null);
      if (S === null || mu === null) throw new Error('ejectionForce: supply shrinkage and mu, or materialKey');
      const nu = o.poisson === undefined ? 0.38 : o.poisson;
      const alpha = o.draftAngle_deg === undefined ? 1 : o.draftAngle_deg;
      const warnings = [];

      const pContact = (E * S) / ((D / (2 * s)) * (1 - nu) + (1 + nu));
      const A = Math.PI * D * L;
      const factor = mu * Math.cos(rad(alpha)) - Math.sin(rad(alpha));
      const F = pContact * A * factor;

      if (factor <= 0) {
        warnings.push(`tan α > μ — قطعه خودآزاد است، پران سبک کافی است / part self-releases at ${alpha}° draft`);
      }
      let pinStress = null;
      if (o.nPins && o.pinDia_mm) {
        const Apins = o.nPins * areaOfCircle(o.pinDia_mm);
        pinStress = Math.max(0, F) / Apins;
        if (pinStress > 15) warnings.push(`تنش پین ${round(pinStress)} MPa > 15 MPa — پین‌ها قطعه را فرو می‌برند؛ تعداد یا قطر را زیاد کنید / pins will indent the part`);
      }

      return {
        contactPressure_MPa: pContact, contactArea_mm2: A,
        frictionFactor: factor, draftAngle_deg: alpha, frictionCoefficient: mu,
        ejectionForce_N: Math.max(0, F), ejectionForce_kN: Math.max(0, F) / 1000,
        selfReleasing: factor <= 0,
        pinStress_MPa: pinStress, warnings,
        steps: [
          Step('فشار تماس / contact pressure', 'p = E·S/[(D/2s)(1−ν)+(1+ν)]', pContact, 'MPa'),
          Step('سطح تماس / contact area', 'π·D·L', A, 'mm²'),
          Step('نیروی پران / ejection force', 'p·A·(μcosα − sinα)', Math.max(0, F), 'N'),
        ],
      };
    },

    /** Vent depth guidance — ونت‌گیری. */
    venting({ materialKey, ventDepth_mm }) {
      const p = POLYMERS[materialKey];
      if (!p) throw new Error('venting: valid materialKey required');
      const warnings = [];
      if (typeof ventDepth_mm === 'number' && ventDepth_mm > p.ventDepth * 1.2) {
        warnings.push(`عمق ونت ${ventDepth_mm} mm بیش از حد ${p.en} (${p.ventDepth} mm) — پلیسه / flash risk`);
      }
      return {
        material: `${p.fa} / ${p.en}`, recommendedDepth_mm: p.ventDepth,
        width_mm: [3, 6], landLength_mm: [0.75, 1.5], reliefDepth_mm: 0.3,
        coveragePercent: 30,
        note: 'حداقل ۳۰٪ محیط قطعه، انتهای مسیر جریان و خطوط جوش / at least 30% of the part perimeter, at flow ends and weld lines',
        warnings,
      };
    },
  };

  const mold = {
    /**
     * Plate deflection under cavity pressure — خیز صفحه قالب.
     * Simply supported beam strip, unit width.
     * @param {object} o {cavityPressure_MPa, span_mm, plateThickness_mm, pressurisedWidth_mm,
     *                    E=210000, allowableDeflection_mm=0.05}
     */
    plateDeflection(o) {
      const p = pos(o.cavityPressure_MPa, 'cavityPressure_MPa');
      const L = pos(o.span_mm, 'span_mm');
      const h = pos(o.plateThickness_mm, 'plateThickness_mm');
      const b = o.pressurisedWidth_mm === undefined ? 1 : o.pressurisedWidth_mm;
      const E = o.E || STEEL_E;
      const allow = o.allowableDeflection_mm === undefined ? 0.05 : o.allowableDeflection_mm;
      const warnings = [];

      const q = p * b;                       // N/mm
      const I = b * Math.pow(h, 3) / 12;     // mm⁴
      const delta = 5 * q * Math.pow(L, 4) / (384 * E * I);
      const hRequired = Math.pow(5 * p * Math.pow(L, 4) / (32 * E * allow), 1 / 3);

      if (delta > allow) {
        warnings.push(`خیز ${round(delta, 3)} mm > حد مجاز ${allow} mm — پلیسه در خط جدایش؛ ستون پشتیبان اضافه کنید / add support pillars`);
      }
      warnings.push('δ ∝ L⁴ — نصف کردن دهانه با ستون پشتیبان، خیز را ۱۶ برابر کم می‌کند / halving the span cuts deflection 16×');

      return {
        distributedLoad_N_mm: q, momentOfInertia_mm4: I,
        deflection_mm: delta, allowableDeflection_mm: allow,
        utilisation: delta / allow,
        requiredThickness_mm: hRequired,
        spanIfPillarAdded_mm: L / 2,
        deflectionWithPillar_mm: delta / 16, warnings,
        steps: [
          Step('خیز / deflection', 'δ = 5qL⁴/(384EI)', delta, 'mm'),
          Step('ضخامت لازم / required thickness', 'h = ∛(5pL⁴/(32Eδ))', hRequired, 'mm'),
        ],
      };
    },

    /** Thick-wall cylinder insert sizing (Lamé) — دیواره اینسرت حفره گرد. */
    insertWall({ innerDia_mm, cavityPressure_MPa, allowableStress_MPa }) {
      const Di = pos(innerDia_mm, 'innerDia_mm');
      const p = pos(cavityPressure_MPa, 'cavityPressure_MPa');
      const sa = allowableStress_MPa === undefined ? 500 : pos(allowableStress_MPa, 'allowableStress_MPa');
      const warnings = [];
      if (p >= sa) {
        warnings.push('فشار حفره ≥ تنش مجاز — هیچ ضخامتی کافی نیست؛ ماده قالب را ارتقا دهید / no wall thickness suffices');
        return { outerDia_mm: Infinity, wallThickness_mm: Infinity, allowableStress_MPa: sa, warnings };
      }
      const Do = Di * Math.sqrt((sa + p) / (sa - p));
      return {
        innerDia_mm: Di, outerDia_mm: Do, wallThickness_mm: (Do - Di) / 2,
        allowableStress_MPa: sa, warnings,
        steps: [Step('قطر خارجی / outer dia', 'Do = Di·√((σ+p)/(σ−p))', Do, 'mm')],
      };
    },
  };

  // ────────────────────────────────────────────────────────────────────────
  // 9. Caco-sheet convenience wrapper — یک محاسبه‌ی سرتاسری
  // ────────────────────────────────────────────────────────────────────────

  /**
   * Runs the whole chain in one call, imperial or metric input.
   * Mirrors the Caco Pacific Molding Data Calculator plus cooling and cycle.
   */
  function moldingDataCalculator(o) {
    const imperial = o.unitSystem === 'imperial';
    const toMM = (x) => (imperial ? x * MM_PER_IN : x);
    const toG = (x) => (imperial ? x * G_PER_OZ : x);

    const geo = geometry.projectedArea({
      shape: o.shape,
      partDia: o.partDia !== undefined ? toMM(o.partDia) : undefined,
      partLength: o.partLength !== undefined ? toMM(o.partLength) : undefined,
      partWidth: o.partWidth !== undefined ? toMM(o.partWidth) : undefined,
      areaPerPart: o.areaPerPart,
      cavities: o.cavities,
      runnerLegs: (o.runnerLegs || []).map((L) => ({
        width: toMM(L.width), length: toMM(L.length), legs: L.legs,
      })),
    });

    const lt = machine.ltRatio({
      flowLength: toMM(o.flowLength),
      wallThickness: toMM(o.wallThickness),
      materialKey: o.materialKey,
    });

    const ton = machine.tonnage({
      projectedArea_mm2: geo.totalArea_mm2,
      ltRatio: lt.ltRatio,
      materialKey: o.materialKey,
      cavityPressure_MPa: o.cavityPressure_MPa,
      machineTonnage_metricTon: o.machineTonnage_metricTon,
      safetyFactor: o.safetyFactor,
    });

    const unit = machine.injectionUnit({
      partWeight_g: toG(o.partWeight),
      cavities: o.cavities,
      runnerWeight_g: o.runnerWeight !== undefined ? toG(o.runnerWeight) : 0,
      materialKey: o.materialKey,
      specificGravity: o.specificGravity,
      targetFill: o.targetFill,
      machineCapacity_oz: o.machineCapacity_oz,
      cycleTime_s: o.cycleTime_s,
    });

    let cool = null, cycle = null, heat = null;
    if (o.materialKey || o.alpha) {
      cool = cooling.coolingTime({
        wallThickness: toMM(o.wallThickness),
        materialKey: o.materialKey,
        alpha: o.alpha, Tmelt: o.Tmelt, Tmold: o.Tmold, Teject: o.Teject,
        complexityFactor: o.complexityFactor,
      });
      cycle = cooling.cycleTime({
        coolingTime_s: cool.coolingTime_s,
        injectionTime_s: o.injectionTime_s,
        packFactor: o.packFactor,
        moldOpenCloseEject_s: o.moldOpenCloseEject_s,
      });
      heat = cooling.heatLoad({
        shotWeight_g: unit.shotWeight_g,
        cycleTime_s: cycle.cycleTime_s,
        materialKey: o.materialKey,
        waterDeltaT_K: o.waterDeltaT_K,
      });
    }

    return {
      unitSystem: o.unitSystem || 'metric',
      geometry: geo, ltRatio: lt, tonnage: ton, injectionUnit: unit,
      cooling: cool, cycle, heatLoad: heat,
      summary: {
        totalProjectedArea_in2: geo.totalArea_in2,
        totalProjectedArea_mm2: geo.totalArea_mm2,
        ltRatio: lt.ltRatio,
        tonnage_usTons: ton.governing_usTons,
        tonnage_metricTons: ton.governing_metricTons,
        requiredTonnage_metricTons: ton.required_metricTons,
        shotWeight_g: unit.shotWeight_g,
        shotWeight_oz: unit.shotWeight_oz,
        preferredInjectionUnit_oz: unit.requiredCapacity_ozGPPS,
        coolingTime_s: cool ? cool.coolingTime_s : null,
        cycleTime_s: cycle ? cycle.cycleTime_s : null,
        coolantFlow_Lmin: heat ? heat.coolantFlow_Lmin : null,
      },
      warnings: [].concat(
        geo.warnings, lt.warnings, ton.warnings, unit.warnings,
        cool ? cool.warnings : [], cycle ? cycle.warnings : [], heat ? heat.warnings : []
      ),
    };
  }

  // ────────────────────────────────────────────────────────────────────────
  // 10. UI metadata
  // ────────────────────────────────────────────────────────────────────────

  const matOptions = Object.keys(POLYMERS);

  const UI = {
    groups: [
      {
        key: 'machineSizing', fa: 'انتخاب ماشین', en: 'Machine sizing',
        calcs: [
          { key: 'moldingDataCalculator', fa: 'محاسبه‌گر کامل داده قالب‌گیری', en: 'Complete molding data calculator',
            fields: [
              { key: 'unitSystem', fa: 'سیستم یکا', en: 'Unit system', unit: 'select', options: ['metric', 'imperial'] },
              { key: 'shape', fa: 'شکل قطعه', en: 'Part shape', unit: 'select', options: ['round', 'rect', 'custom'] },
              { key: 'partDia', fa: 'قطر قطعه', en: 'Part diameter', unit: 'mm|in' },
              { key: 'partLength', fa: 'طول قطعه', en: 'Part length', unit: 'mm|in' },
              { key: 'partWidth', fa: 'عرض قطعه', en: 'Part width', unit: 'mm|in' },
              { key: 'cavities', fa: 'تعداد حفره', en: 'Cavities', unit: '—' },
              { key: 'wallThickness', fa: 'ضخامت دیواره', en: 'Wall thickness', unit: 'mm|in' },
              { key: 'flowLength', fa: 'فاصله گیت تا دورترین نقطه', en: 'Gate to furthest point', unit: 'mm|in' },
              { key: 'partWeight', fa: 'وزن قطعه', en: 'Part weight', unit: 'g|oz' },
              { key: 'runnerWeight', fa: 'وزن رانر', en: 'Runner weight', unit: 'g|oz' },
              { key: 'materialKey', fa: 'ماده', en: 'Material', unit: 'select', options: matOptions },
              { key: 'machineCapacity_oz', fa: 'ظرفیت ماشین (اونس)', en: 'Machine capacity (oz)', unit: 'oz' },
              { key: 'machineTonnage_metricTon', fa: 'تناژ ماشین', en: 'Machine tonnage', unit: 'metric ton' },
            ],
            outputs: ['totalProjectedArea_in2', 'ltRatio', 'tonnage_usTons', 'requiredTonnage_metricTons',
              'shotWeight_oz', 'preferredInjectionUnit_oz', 'coolingTime_s', 'cycleTime_s', 'coolantFlow_Lmin'] },
          { key: 'projectedArea', fa: 'سطح تصویرشده', en: 'Projected area',
            fields: [
              { key: 'shape', fa: 'شکل', en: 'Shape', unit: 'select', options: ['round', 'rect', 'custom'] },
              { key: 'partDia', fa: 'قطر', en: 'Diameter', unit: 'mm' },
              { key: 'partLength', fa: 'طول', en: 'Length', unit: 'mm' },
              { key: 'partWidth', fa: 'عرض', en: 'Width', unit: 'mm' },
              { key: 'cavities', fa: 'تعداد حفره', en: 'Cavities', unit: '—' },
            ],
            outputs: ['totalArea_mm2', 'totalArea_in2', 'runnerShare'] },
          { key: 'tonnage', fa: 'تناژ قفل‌کننده', en: 'Clamping tonnage',
            fields: [
              { key: 'projectedArea_mm2', fa: 'سطح تصویرشده', en: 'Projected area', unit: 'mm²' },
              { key: 'ltRatio', fa: 'نسبت L/T', en: 'L/T ratio', unit: '—' },
              { key: 'materialKey', fa: 'ماده', en: 'Material', unit: 'select', options: matOptions },
              { key: 'safetyFactor', fa: 'ضریب اطمینان', en: 'Safety factor', unit: '—' },
            ],
            outputs: ['governing_metricTons', 'governing_usTons', 'required_metricTons', 'recommendedMachine_metricTons'] },
          { key: 'injectionUnit', fa: 'واحد تزریق', en: 'Injection unit',
            fields: [
              { key: 'partWeight_g', fa: 'وزن قطعه', en: 'Part weight', unit: 'g' },
              { key: 'cavities', fa: 'تعداد حفره', en: 'Cavities', unit: '—' },
              { key: 'runnerWeight_g', fa: 'وزن رانر', en: 'Runner weight', unit: 'g' },
              { key: 'materialKey', fa: 'ماده', en: 'Material', unit: 'select', options: matOptions },
              { key: 'machineCapacity_oz', fa: 'ظرفیت ماشین', en: 'Machine capacity', unit: 'oz' },
              { key: 'cycleTime_s', fa: 'زمان سیکل', en: 'Cycle time', unit: 's' },
            ],
            outputs: ['shotWeight_g', 'shotWeight_oz', 'requiredCapacity_ozGPPS', 'barrelUtilisation', 'residenceTime_min', 'plasticizingRate_kgh'] },
        ],
      },
      {
        key: 'cooling', fa: 'خنک‌کاری و سیکل', en: 'Cooling & cycle',
        calcs: [
          { key: 'coolingTime', fa: 'زمان خنک‌کاری', en: 'Cooling time',
            fields: [
              { key: 'wallThickness', fa: 'ضخامت دیواره', en: 'Wall thickness', unit: 'mm' },
              { key: 'materialKey', fa: 'ماده', en: 'Material', unit: 'select', options: matOptions },
              { key: 'geometry', fa: 'هندسه', en: 'Geometry', unit: 'select', options: ['plate', 'cylinder'] },
              { key: 'complexityFactor', fa: 'ضریب پیچیدگی', en: 'Complexity factor', unit: '—' },
            ],
            outputs: ['coolingTime_s', 'temperatureRatio'] },
          { key: 'heatLoad', fa: 'بار حرارتی و دبی', en: 'Heat load & coolant flow',
            fields: [
              { key: 'shotWeight_g', fa: 'وزن شات', en: 'Shot weight', unit: 'g' },
              { key: 'cycleTime_s', fa: 'زمان سیکل', en: 'Cycle time', unit: 's' },
              { key: 'materialKey', fa: 'ماده', en: 'Material', unit: 'select', options: matOptions },
              { key: 'waterDeltaT_K', fa: 'ΔT آب', en: 'Water ΔT', unit: 'K' },
            ],
            outputs: ['heatRate_W', 'coolantFlow_Lmin', 'heatPerCycle_J'] },
          { key: 'channels', fa: 'کانال خنک‌کاری', en: 'Cooling channels',
            fields: [
              { key: 'channelDia_mm', fa: 'قطر کانال', en: 'Channel diameter', unit: 'mm' },
              { key: 'totalFlow_Lmin', fa: 'دبی کل', en: 'Total flow', unit: 'L/min' },
              { key: 'circuits', fa: 'تعداد مدار', en: 'Circuits', unit: '—' },
              { key: 'channelLength_mm', fa: 'طول کانال', en: 'Channel length', unit: 'mm' },
            ],
            outputs: ['reynolds', 'regime', 'velocity_m_s', 'pressureDrop_bar', 'recommendedPitch_mm'] },
        ],
      },
      {
        key: 'cavities', fa: 'تعداد حفره', en: 'Cavitation',
        calcs: [
          { key: 'count', fa: 'تعداد حفره از قیود', en: 'Cavity count from constraints',
            fields: [
              { key: 'requiredParts', fa: 'تعداد قطعه لازم', en: 'Required parts', unit: '—' },
              { key: 'availableHours', fa: 'ساعات در دسترس', en: 'Available hours', unit: 'h' },
              { key: 'cycleTime_s', fa: 'زمان سیکل', en: 'Cycle time', unit: 's' },
              { key: 'partWeight_g', fa: 'وزن قطعه', en: 'Part weight', unit: 'g' },
              { key: 'partProjectedArea_mm2', fa: 'سطح تصویرشده هر قطعه', en: 'Projected area per part', unit: 'mm²' },
              { key: 'machineTonnage_metricTon', fa: 'تناژ ماشین', en: 'Machine tonnage', unit: 'ton' },
              { key: 'machineCapacity_oz', fa: 'ظرفیت شات', en: 'Shot capacity', unit: 'oz' },
              { key: 'plasticizingRate_kgh', fa: 'نرخ پلاستیسایز', en: 'Plasticizing rate', unit: 'kg/h' },
              { key: 'materialKey', fa: 'ماده', en: 'Material', unit: 'select', options: matOptions },
            ],
            outputs: ['recommendedCavities', 'governingConstraint', 'upperBound', 'lowerBound'] },
          { key: 'economic', fa: 'تعداد حفره اقتصادی', en: 'Economic cavity count',
            fields: [
              { key: 'requiredParts', fa: 'کل قطعات', en: 'Total parts', unit: '—' },
              { key: 'cycleTime_s', fa: 'زمان سیکل', en: 'Cycle time', unit: 's' },
              { key: 'hourlyRate', fa: 'نرخ ساعتی ماشین', en: 'Hourly machine rate', unit: 'currency/h' },
              { key: 'costPerCavity', fa: 'هزینه هر حفره', en: 'Cost per cavity', unit: 'currency' },
            ],
            outputs: ['optimumCavities', 'recommendedCavities', 'costAtOptimum'] },
        ],
      },
      {
        key: 'feed', fa: 'سیستم تغذیه', en: 'Feed system',
        calcs: [
          { key: 'runnerDiameter', fa: 'قطر رانر', en: 'Runner diameter',
            fields: [
              { key: 'partWeight_g', fa: 'وزن قطعه تغذیه‌شده', en: 'Part weight fed', unit: 'g' },
              { key: 'runnerLength_mm', fa: 'طول رانر', en: 'Runner length', unit: 'mm' },
              { key: 'wallThickness_mm', fa: 'ضخامت دیواره قطعه', en: 'Part wall thickness', unit: 'mm' },
            ],
            outputs: ['empiricalDia_mm', 'recommendedDia_mm', 'governingRule'] },
          { key: 'edgeGate', fa: 'گیت لبه‌ای', en: 'Edge gate',
            fields: [
              { key: 'wallThickness_mm', fa: 'ضخامت دیواره', en: 'Wall thickness', unit: 'mm' },
              { key: 'cavitySurfaceArea_mm2', fa: 'سطح رویه حفره', en: 'Cavity surface area', unit: 'mm²' },
              { key: 'materialKey', fa: 'ماده', en: 'Material', unit: 'select', options: matOptions },
            ],
            outputs: ['depth_mm', 'width_mm', 'landLength_mm', 'materialConstant'] },
          { key: 'sprue', fa: 'اسپرو', en: 'Sprue',
            fields: [
              { key: 'nozzleDia_mm', fa: 'قطر نازل', en: 'Nozzle diameter', unit: 'mm' },
              { key: 'length_mm', fa: 'طول اسپرو', en: 'Sprue length', unit: 'mm' },
              { key: 'halfAngle_deg', fa: 'نیم‌زاویه', en: 'Half angle', unit: 'deg' },
            ],
            outputs: ['smallEndDia_mm', 'largeEndDia_mm', 'volume_mm3'] },
          { key: 'gateFreezeTime', fa: 'زمان انجماد گیت', en: 'Gate freeze time',
            fields: [
              { key: 'gateDepth_mm', fa: 'عمق گیت', en: 'Gate depth', unit: 'mm' },
              { key: 'materialKey', fa: 'ماده', en: 'Material', unit: 'select', options: matOptions },
            ],
            outputs: ['gateFreezeTime_s', 'recommendedHoldTime_s'] },
        ],
      },
      {
        key: 'partMold', fa: 'قطعه و قالب', en: 'Part & mold',
        calcs: [
          { key: 'cavityDimension', fa: 'ابعاد حفره از انقباض', en: 'Cavity dimension from shrinkage',
            fields: [
              { key: 'partDimension_mm', fa: 'ابعاد قطعه', en: 'Part dimension', unit: 'mm' },
              { key: 'materialKey', fa: 'ماده', en: 'Material', unit: 'select', options: matOptions },
              { key: 'shrinkage', fa: 'انقباض (اختیاری)', en: 'Shrinkage (optional)', unit: '—' },
            ],
            outputs: ['cavityDimension_mm', 'shrinkagePercent', 'rangeOfCavityDim_mm'] },
          { key: 'ejectionForce', fa: 'نیروی پران', en: 'Ejection force',
            fields: [
              { key: 'coreDia_mm', fa: 'قطر کور', en: 'Core diameter', unit: 'mm' },
              { key: 'contactLength_mm', fa: 'طول تماس', en: 'Contact length', unit: 'mm' },
              { key: 'wallThickness_mm', fa: 'ضخامت دیواره', en: 'Wall thickness', unit: 'mm' },
              { key: 'modulusAtEject_MPa', fa: 'مدول در دمای پران', en: 'Modulus at ejection', unit: 'MPa' },
              { key: 'draftAngle_deg', fa: 'زاویه شیب', en: 'Draft angle', unit: 'deg' },
              { key: 'materialKey', fa: 'ماده', en: 'Material', unit: 'select', options: matOptions },
              { key: 'nPins', fa: 'تعداد پین', en: 'Number of pins', unit: '—' },
              { key: 'pinDia_mm', fa: 'قطر پین', en: 'Pin diameter', unit: 'mm' },
            ],
            outputs: ['ejectionForce_N', 'contactPressure_MPa', 'pinStress_MPa', 'selfReleasing'] },
          { key: 'plateDeflection', fa: 'خیز صفحه قالب', en: 'Mold plate deflection',
            fields: [
              { key: 'cavityPressure_MPa', fa: 'فشار حفره', en: 'Cavity pressure', unit: 'MPa' },
              { key: 'span_mm', fa: 'دهانه بین تکیه‌گاه', en: 'Span between supports', unit: 'mm' },
              { key: 'plateThickness_mm', fa: 'ضخامت صفحه', en: 'Plate thickness', unit: 'mm' },
              { key: 'allowableDeflection_mm', fa: 'خیز مجاز', en: 'Allowable deflection', unit: 'mm' },
            ],
            outputs: ['deflection_mm', 'requiredThickness_mm', 'deflectionWithPillar_mm'] },
          { key: 'venting', fa: 'ونت‌گیری', en: 'Venting',
            fields: [
              { key: 'materialKey', fa: 'ماده', en: 'Material', unit: 'select', options: matOptions },
              { key: 'ventDepth_mm', fa: 'عمق ونت طراحی', en: 'Designed vent depth', unit: 'mm' },
            ],
            outputs: ['recommendedDepth_mm', 'width_mm', 'landLength_mm'] },
        ],
      },
    ],
    labels: {
      totalArea_mm2: { fa: 'سطح کل تصویرشده', en: 'Total projected area', unit: 'mm²' },
      totalArea_in2: { fa: 'سطح کل تصویرشده', en: 'Total projected area', unit: 'in²' },
      totalProjectedArea_in2: { fa: 'سطح کل تصویرشده', en: 'Total projected area', unit: 'in²' },
      totalProjectedArea_mm2: { fa: 'سطح کل تصویرشده', en: 'Total projected area', unit: 'mm²' },
      runnerShare: { fa: 'سهم رانر', en: 'Runner share', unit: '—' },
      ltRatio: { fa: 'نسبت L/T', en: 'L/T ratio', unit: '—' },
      tonnage_usTons: { fa: 'تناژ', en: 'Tonnage', unit: 'US ton' },
      tonnage_metricTons: { fa: 'تناژ', en: 'Tonnage', unit: 'metric ton' },
      governing_metricTons: { fa: 'تناژ حاکم', en: 'Governing tonnage', unit: 'metric ton' },
      governing_usTons: { fa: 'تناژ حاکم', en: 'Governing tonnage', unit: 'US ton' },
      required_metricTons: { fa: 'تناژ لازم با حاشیه', en: 'Required tonnage', unit: 'metric ton' },
      requiredTonnage_metricTons: { fa: 'تناژ لازم', en: 'Required tonnage', unit: 'metric ton' },
      recommendedMachine_metricTons: { fa: 'ماشین پیشنهادی', en: 'Suggested machine', unit: 'metric ton' },
      shotWeight_g: { fa: 'وزن شات', en: 'Shot weight', unit: 'g' },
      shotWeight_oz: { fa: 'وزن شات', en: 'Shot weight', unit: 'oz' },
      requiredCapacity_ozGPPS: { fa: 'ظرفیت تزریق ترجیحی', en: 'Preferred injection capacity', unit: 'oz' },
      preferredInjectionUnit_oz: { fa: 'واحد تزریق ترجیحی', en: 'Preferred injection unit', unit: 'oz' },
      barrelUtilisation: { fa: 'استفاده از بشکه', en: 'Barrel utilisation', unit: '—' },
      residenceTime_min: { fa: 'زمان اقامت', en: 'Residence time', unit: 'min' },
      plasticizingRate_kgh: { fa: 'نرخ پلاستیسایز لازم', en: 'Plasticizing rate needed', unit: 'kg/h' },
      coolingTime_s: { fa: 'زمان خنک‌کاری', en: 'Cooling time', unit: 's' },
      temperatureRatio: { fa: 'نسبت دما', en: 'Temperature ratio', unit: '—' },
      cycleTime_s: { fa: 'زمان سیکل', en: 'Cycle time', unit: 's' },
      heatRate_W: { fa: 'توان حرارتی', en: 'Heat rate', unit: 'W' },
      heatPerCycle_J: { fa: 'گرمای هر سیکل', en: 'Heat per cycle', unit: 'J' },
      coolantFlow_Lmin: { fa: 'دبی خنک‌کننده', en: 'Coolant flow', unit: 'L/min' },
      reynolds: { fa: 'عدد رینولدز', en: 'Reynolds number', unit: '—' },
      regime: { fa: 'رژیم جریان', en: 'Flow regime', unit: '—' },
      velocity_m_s: { fa: 'سرعت جریان', en: 'Flow velocity', unit: 'm/s' },
      pressureDrop_bar: { fa: 'افت فشار', en: 'Pressure drop', unit: 'bar' },
      recommendedPitch_mm: { fa: 'گام توصیه‌شده', en: 'Recommended pitch', unit: 'mm' },
      recommendedCavities: { fa: 'تعداد حفره پیشنهادی', en: 'Recommended cavities', unit: '—' },
      governingConstraint: { fa: 'قید حاکم', en: 'Governing constraint', unit: '—' },
      upperBound: { fa: 'سقف حفره', en: 'Upper bound', unit: '—' },
      lowerBound: { fa: 'کف حفره', en: 'Lower bound', unit: '—' },
      optimumCavities: { fa: 'تعداد بهینه', en: 'Optimum cavities', unit: '—' },
      costAtOptimum: { fa: 'هزینه در نقطه بهینه', en: 'Cost at optimum', unit: 'currency' },
      empiricalDia_mm: { fa: 'قطر تجربی رانر', en: 'Empirical runner dia', unit: 'mm' },
      recommendedDia_mm: { fa: 'قطر پیشنهادی', en: 'Recommended diameter', unit: 'mm' },
      governingRule: { fa: 'قاعده حاکم', en: 'Governing rule', unit: '—' },
      depth_mm: { fa: 'عمق گیت', en: 'Gate depth', unit: 'mm' },
      width_mm: { fa: 'عرض', en: 'Width', unit: 'mm' },
      landLength_mm: { fa: 'طول زمین', en: 'Land length', unit: 'mm' },
      materialConstant: { fa: 'ضریب ماده n', en: 'Material constant n', unit: '—' },
      smallEndDia_mm: { fa: 'قطر ورودی اسپرو', en: 'Sprue small end', unit: 'mm' },
      largeEndDia_mm: { fa: 'قطر خروجی اسپرو', en: 'Sprue large end', unit: 'mm' },
      volume_mm3: { fa: 'حجم', en: 'Volume', unit: 'mm³' },
      gateFreezeTime_s: { fa: 'زمان انجماد گیت', en: 'Gate freeze time', unit: 's' },
      recommendedHoldTime_s: { fa: 'زمان نگه‌داشت پیشنهادی', en: 'Recommended hold time', unit: 's' },
      cavityDimension_mm: { fa: 'ابعاد حفره', en: 'Cavity dimension', unit: 'mm' },
      shrinkagePercent: { fa: 'انقباض', en: 'Shrinkage', unit: '%' },
      rangeOfCavityDim_mm: { fa: 'بازه ابعاد حفره', en: 'Cavity dimension range', unit: 'mm' },
      ejectionForce_N: { fa: 'نیروی پران', en: 'Ejection force', unit: 'N' },
      contactPressure_MPa: { fa: 'فشار تماس', en: 'Contact pressure', unit: 'MPa' },
      pinStress_MPa: { fa: 'تنش پین پران', en: 'Ejector pin stress', unit: 'MPa' },
      selfReleasing: { fa: 'خودآزاد', en: 'Self-releasing', unit: '—' },
      deflection_mm: { fa: 'خیز صفحه', en: 'Plate deflection', unit: 'mm' },
      requiredThickness_mm: { fa: 'ضخامت لازم', en: 'Required thickness', unit: 'mm' },
      deflectionWithPillar_mm: { fa: 'خیز با ستون پشتیبان', en: 'Deflection with pillar', unit: 'mm' },
      recommendedDepth_mm: { fa: 'عمق ونت توصیه‌شده', en: 'Recommended vent depth', unit: 'mm' },
    },
  };

  // ────────────────────────────────────────────────────────────────────────

  return {
    version: '1.0.0',
    core: { rad, deg, areaOfCircle, round },
    geometry, machine, cooling, cavities, feed, part, mold,
    moldingDataCalculator, units, UI,
    data: {
      POLYMERS, TONNAGE_BANDS, PRACTICAL_CAVITIES, DRAFT_GUIDANCE, GATE_TYPES,
      WATER, CONSTANTS: {
        MM2_PER_IN2, MM_PER_IN, G_PER_OZ, KN_PER_US_TON, KN_PER_METRIC_TON,
        MPA_PER_TON_IN2, CM3_PER_OZ_GPPS, GPPS_SG, STEEL_E,
      },
    },
  };
});
