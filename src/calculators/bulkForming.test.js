/*
 * bulkForming.test.js — acceptance tests against the worked examples in
 * bulk-forming-reference.md §8.  Run:  node bulkForming.test.js
 * Zero dependencies.
 */
const BF = require('./bulkForming.js');

let pass = 0, fail = 0;
function close(name, got, want, tolPct = 1.0) {
  const err = Math.abs(got - want) / Math.abs(want) * 100;
  const ok = err <= tolPct;
  console.log(`${ok ? '  PASS' : '  FAIL'}  ${name.padEnd(42)} got=${Number(got).toPrecision(6)}  want=${Number(want).toPrecision(6)}  err=${err.toFixed(3)}%`);
  ok ? pass++ : fail++;
}
function truthy(name, cond) {
  console.log(`${cond ? '  PASS' : '  FAIL'}  ${name}`);
  cond ? pass++ : fail++;
}

// ── Example 1: open-die upsetting ────────────────────────────────────────
console.log('\nExample 1 — Open-die upsetting (steel 1010)');
const e1 = BF.forging.upsetCylinder({ d0: 50, h0: 40, h1: 30, mu: 0.20, K: 530, n: 0.26, v: 100 });
close('ε', e1.eps, 0.2877);
close('Ȳf (MPa)', e1.avgFlowStress, 305.9);
close('d1 (mm)', e1.d1, 57.74);
close('A1 (mm²)', e1.A1, 2618.8);
close('Kf', e1.Kf, 1.154);
close('F (kN)', e1.force_kN, 924.6);
close('W_ideal (J)', e1.energyIdeal_J, 6910, 2);
truthy('no spurious warnings', e1.warnings.length === 0);

// ── Example 2: flat rolling ──────────────────────────────────────────────
console.log('\nExample 2 — Flat rolling (steel)');
const e2 = BF.rolling.pass({ t0: 25, t1: 20, w: 300, R: 250, mu: 0.20, K: 530, n: 0.26, rpm: 50, planeStrain: false });
close('draft (mm)', e2.draft, 5);
close('d_max (mm)', e2.maxDraft, 10);
close('ε', e2.eps, 0.2231);
close('Ȳf (MPa)', e2.avgFlowStress, 283.9);
close('L (mm)', e2.contactLength, 35.36);
close('F (kN)', e2.force_kN, 3011);
close('T per roll (N·m)', e2.torquePerRoll_Nm, 53250);   // = 53.25 kN·m in the reference doc
close('P total (kW)', e2.powerTotal_kW, 557.3);
truthy('bite condition satisfied (no warning)', !e2.warnings.some(w => w.includes('گاز نمی‌کند')));

const e2ps = BF.rolling.pass({ t0: 25, t1: 20, w: 300, R: 250, mu: 0.20, K: 530, n: 0.26, rpm: 50 });
close('F plane-strain (kN)', e2ps.force_kN, 3477);
close('P plane-strain (kW)', e2ps.powerTotal_kW, 643.6);

console.log('\nExample 2b — bite-condition guard should fire');
const e2bad = BF.rolling.pass({ t0: 25, t1: 10, w: 300, R: 250, mu: 0.20, K: 530, n: 0.26 });
truthy('warns when d > μ²R', e2bad.warnings.some(w => w.includes('d_max')));

// ── Example 3: direct extrusion ──────────────────────────────────────────
console.log('\nExample 3 — Direct extrusion (aluminum)');
const e3 = BF.extrusion.pressure({ D0: 100, Df: 40, billetLength: 300, Yf: 100, type: 'direct', a: 0.8, b: 1.4 });
close('A0 (mm²)', e3.A0, 7854);
close('Af (mm²)', e3.Af, 1256.6);
close('rx', e3.extrusionRatio, 6.25);
close('εx (Johnson)', e3.epsJohnson, 3.366);
close('p (MPa)', e3.pressure_MPa, 936.6);
close('F (kN)', e3.force_kN, 7358);

const e3i = BF.extrusion.pressure({ D0: 100, Df: 40, Yf: 100, type: 'indirect', a: 0.8, b: 1.4 });
close('p indirect (MPa)', e3i.pressure_MPa, 336.6);
close('F indirect (kN)', e3i.force_kN, 2644);
truthy('direct/indirect ratio ≈ 2.8', Math.abs(e3.force_kN / e3i.force_kN - 2.78) < 0.05);

console.log('\nExample 3b — pressure falls over the stroke');
const curve = BF.extrusion.directPressureCurve({ D0: 100, Df: 40, billetLength: 300, Yf: 100, type: 'direct', points: 4 });
truthy('curve is monotonically decreasing', curve.every((p, i, a) => i === 0 || p.pressure_MPa <= a[i - 1].pressure_MPa));
close('final pressure ≈ indirect', curve[curve.length - 1].pressure_MPa, 336.6);

// ── Example 4: wire drawing ──────────────────────────────────────────────
console.log('\nExample 4 — Wire drawing (steel)');
const e4 = BF.drawing.wire({ D0: 3.0, Df: 2.5, alpha: 8, mu: 0.07, K: 530, n: 0.26, speed: 2000 });
close('A0 (mm²)', e4.A0, 7.069);
close('Af (mm²)', e4.Af, 4.909);
close('r', e4.reduction, 0.3056);
close('ε', e4.eps, 0.3646);
close('Ȳf (MPa)', e4.avgFlowStress, 324.3);
close('Lc (mm)', e4.contactLength, 1.796);
close('φ', e4.redundantWorkFactor, 1.0637);
close('σd (MPa)', e4.drawStress_MPa, 188.4);
close('F (N)', e4.force_N, 925);
close('P (W)', e4.power_W, 1850);
close('σf_exit (MPa)', e4.exitFlowStress, 408.6);
close('safety ratio', e4.safetyRatio, 0.4611);
truthy('safe (no break warning)', !e4.warnings.some(w => w.includes('پاره')));

console.log('\nExample 4b — over-reduction guard should fire');
const e4bad = BF.drawing.wire({ D0: 3.0, Df: 1.6, alpha: 8, mu: 0.07, K: 530, n: 0.26 });
truthy('warns on r > 0.45', e4bad.warnings.some(w => w.includes('0.45')));

// ── Core sanity checks ───────────────────────────────────────────────────
console.log('\nCore sanity');
close('volume constancy A1', BF.core.volumeConstancy({ A0: 100, L0: 50, L1: 25 }).A1, 200);
close('true↔eng strain roundtrip', BF.core.engFromTrueStrain(BF.core.trueFromEngStrain(0.35)), 0.35);
close('plane-strain factor', BF.core.planeStrainFlowStress(100), 115.47);
close('von Mises uniaxial', BF.core.vonMises(300, 0, 0), 300);
close('Tresca uniaxial', BF.core.tresca(300, 0, 0), 300);
close('specificWork = Ȳf·ε', BF.core.specificWork(530, 0.26, 0.2877), BF.core.avgFlowStress(530, 0.26, 0.2877) * 0.2877);
truthy('hot flow stress rises with ε̇', BF.core.hotFlowStress(100, 0.1, 10) > BF.core.hotFlowStress(100, 0.1, 1));
const reg = BF.core.tempRegime(1100, 'steel');
truthy('1100°C on steel classified hot', reg.regime === 'hot');
truthy('20°C on steel classified cold', BF.core.tempRegime(20, 'steel').regime === 'cold');

console.log('\nForging model variants (same case, should be within ~25% of each other)');
const mg = BF.forging.upsetCylinder({ d0: 50, h0: 40, h1: 30, mu: 0.20, K: 530, n: 0.26 }).force_kN;
const mk = BF.forging.upsetCylinder({ d0: 50, h0: 40, h1: 30, mu: 0.20, K: 530, n: 0.26, model: 'kalpakjian' }).force_kN;
const mx = BF.forging.upsetCylinder({ d0: 50, h0: 40, h1: 30, mu: 0.20, K: 530, n: 0.26, model: 'exact' }).force_kN;
console.log(`  groover=${mg.toFixed(1)} kN  kalpakjian=${mk.toFixed(1)} kN  exact=${mx.toFixed(1)} kN`);
truthy('all three within 25%', Math.max(mg, mk, mx) / Math.min(mg, mk, mx) < 1.25);
truthy('exact ≥ linearised (friction hill is convex)', mx >= mk * 0.99);

console.log('\nGuards & validation');
truthy('buckling warning at h0/d0 > 2', BF.forging.upsetCylinder({ d0: 20, h0: 50, h1: 40, mu: 0.1, K: 530, n: 0.26 }).warnings.some(w => w.includes('کمانش')));
truthy('sticking warning at μ ≥ 0.577', BF.forging.upsetCylinder({ d0: 50, h0: 40, h1: 30, mu: 0.6, K: 530, n: 0.26 }).warnings.some(w => w.includes('چسبیدن')));
truthy('center-burst warning at rx < 2', BF.extrusion.pressure({ D0: 100, Df: 80, Yf: 100, type: 'indirect' }).warnings.some(w => w.includes('center-burst')));
try { BF.drawing.wire({ D0: 2, Df: 3, alpha: 8, mu: 0.07, K: 530, n: 0.26 }); truthy('rejects Df ≥ D0', false); }
catch (e) { truthy('rejects Df ≥ D0', e instanceof RangeError); }
try { BF.forging.upsetCylinder({ d0: -1, h0: 40, h1: 30, mu: 0.2, K: 530, n: 0.26 }); truthy('rejects negative diameter', false); }
catch (e) { truthy('rejects negative diameter', e instanceof RangeError); }
try { BF.core.volumeConstancy({ A0: 1, L0: 2 }); truthy('volumeConstancy needs 3 args', false); }
catch (e) { truthy('volumeConstancy needs 3 args', true); }

console.log('\nSchedules');
const rs = BF.rolling.schedule({ t0: 25, tFinal: 10, nPasses: 4, w: 300, R: 250, mu: 0.20, K: 530, n: 0.26, rpm: 50 });
close('rolling schedule total strain', rs.totalStrain, Math.log(2.5));
truthy('4 passes generated', rs.passes.length === 4);
truthy('final thickness reached', Math.abs(rs.passes[3].tOut - 10) < 0.01);
const ds = BF.drawing.schedule({ D0: 5, DFinal: 2, alpha: 8, mu: 0.07, K: 530, n: 0.26, rPerPass: 0.25, speed: 2000 });
close('drawing schedule total strain', ds.totalStrain, Math.log(Math.pow(5 / 2, 2)));
truthy('final diameter reached', Math.abs(ds.passes[ds.passes.length - 1].Dout - 2) < 0.01);
truthy('every pass below break limit', ds.passes.every(p => p.safetyRatio < 1));

console.log('\nData tables');
truthy('17 cold materials', Object.keys(BF.data.MATERIALS_COLD).length === 17);
truthy('every cold material has K and n', Object.values(BF.data.MATERIALS_COLD).every(m => m.K > 0 && m.n >= 0));
truthy('every physical entry complete', Object.values(BF.data.PHYSICAL).every(m => m.rho && m.cp && m.Tm && m.E && m.nu));
truthy('UI groups cover 4 processes', BF.UI.groups.length === 4);
truthy('every UI output has a label', BF.UI.groups.every(g => g.calcs.every(c => c.outputs.every(o => BF.UI.labels[o]))));

console.log(`\n${'─'.repeat(72)}\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
