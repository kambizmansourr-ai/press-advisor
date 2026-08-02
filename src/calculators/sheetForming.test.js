/*
 * sheetForming.test.js — acceptance tests against the worked examples in
 * sheet-forming-cutting-reference.md §6.  Run:  node sheetForming.test.js
 * Zero dependencies.
 */
const SF = require('./sheetForming.js');

let pass = 0, fail = 0;
function close(name, got, want, tolPct = 1.0) {
  const err = want === 0 ? (got === 0 ? 0 : Infinity) : Math.abs(got - want) / Math.abs(want) * 100;
  const ok = err <= tolPct;
  console.log(`${ok ? '  PASS' : '  FAIL'}  ${name.padEnd(44)} got=${Number(got).toPrecision(6)}  want=${Number(want).toPrecision(6)}  err=${err.toFixed(3)}%`);
  ok ? pass++ : fail++;
}
function truthy(name, cond) {
  console.log(`${cond ? '  PASS' : '  FAIL'}  ${name}`);
  cond ? pass++ : fail++;
}

// ── Example 1: blanking a disc ───────────────────────────────────────────
console.log('\nExample 1 — Blanking ⌀75 from 3.2 mm CR steel half-hard');
const e1 = SF.cutting.operation({
  operation: 'blanking', size: 75, t: 3.2, Ac: 0.075, UTS: 400,
  stripFactor: 0.10, penetrationClass: 'halfhard',
});
close('clearance per side (mm)', e1.clearance.clearancePerSide_mm, 0.24);
close('die size (mm)', e1.clearance.dieSize_mm, 75.0);
close('punch size (mm)', e1.clearance.punchSize_mm, 74.52);
close('cut length (mm)', e1.force.cutLength_mm, 235.62);
close('shear strength (MPa)', e1.force.shearStrength, 280);
close('cutting force (kN)', e1.force.cuttingForce_kN, 211.12);
close('stripping force (kN)', e1.force.strippingForce_kN, 21.11);
close('total force (kN)', e1.force.totalForce_kN, 232.23);
close('energy (J)', e1.force.energy_J, 270.2);
truthy('clearance in the practical band', !e1.warnings.some(w => w.includes('لقی')));

console.log('\nExample 1b — bevel halves the peak force');
const e1s = SF.cutting.force({ t: 3.2, diameter: 75, UTS: 400, shearDepth: 3.2 });
close('sheared force (kN)', e1s.cuttingForce_kN, 105.56);
close('energy unchanged (J)', e1s.energy_J, 270.2);

// ── Example 2: punching a hole (clearance flips) ─────────────────────────
console.log('\nExample 2 — Punching ⌀20 hole in the same sheet');
const e2 = SF.cutting.operation({ operation: 'punching', size: 20, t: 3.2, Ac: 0.075, UTS: 400 });
close('punch size (mm)', e2.clearance.punchSize_mm, 20.0);
close('die size (mm)', e2.clearance.dieSize_mm, 20.48);
close('cutting force (kN)', e2.force.cuttingForce_kN, 56.30);
close('punch stress (MPa)', e2.punch.punchStress_MPa, 179.2);
truthy('punch stress well within allowable', e2.punch.stressUtilisation < 0.2);
truthy('blanking and punching size the tools differently',
  e1.clearance.punchSize_mm < e1.clearance.dieSize_mm && e2.clearance.punchSize_mm < e2.clearance.dieSize_mm);

// ── Example 3: V-bending ─────────────────────────────────────────────────
console.log('\nExample 3 — 90° V-bend, t=4, R=6, w=40, D=32');
const e3a = SF.bending.allowance({ angle_deg: 90, R: 6, t: 4 });
close('K-factor (R < 2t)', e3a.K, 0.33);
close('bend allowance (mm)', e3a.bendAllowance_mm, 11.498);
close('OSSB (mm)', e3a.OSSB_mm, 10.0);
close('bend deduction (mm)', e3a.bendDeduction_mm, 8.502);

const e3f = SF.bending.force({ w: 40, t: 4, dieOpening: 32, UTS: 400, dieType: 'v_die', mode: 'air' });
close('bending force (N)', e3f.force_N, 10640);
close('die opening ratio', e3f.dieOpeningRatio, 8.0);
truthy('die opening within 6t–12t', e3f.warnings.length === 0);

const e3s = SF.bending.springback({ Ri: 6, t: 4, Y: 250, E: 207000, targetAngle_deg: 90 });
close('Ri·Y/(E·t)', e3s.RiYEt, 0.0018116);
close('radius ratio Ri/Rf', e3s.radiusRatio, 0.9945652);
close('final radius (mm)', e3s.finalRadius_mm, 6.032776);
close('springback factor Ks', e3s.springbackFactor, 0.995920);
close('required die angle (deg)', e3s.requiredDieAngle_deg, 90.3688);
close('overbend (deg)', e3s.overbend_deg, 0.3688);

console.log('\nExample 3b — bottoming multiplies force, cuts springback');
const e3b = SF.bending.force({ w: 40, t: 4, dieOpening: 32, UTS: 400, mode: 'bottoming' });
close('bottoming force (N)', e3b.force_N, 42560);
truthy('wiping die is much lighter than V-die',
  SF.bending.force({ w: 40, t: 4, dieOpening: 32, UTS: 400, dieType: 'wiping_die' }).force_N < e3f.force_N);

// ── Example 4: deep drawing ──────────────────────────────────────────────
console.log('\nExample 4 — Deep drawn cup Dp=60, h=26.67, t=2');
const e4b = SF.drawing.blankDiameter({ d: 60, h: 26.67, r: 0, trimAllowance: 0 });
close('blank diameter (mm)', e4b.blankDiameter_mm, 100.0);

const e4h = SF.drawing.cupHeight({ Db: 100, Dp: 60 });
close('cup height from blank (mm)', e4h.height_mm, 26.667);

const e4feas = SF.drawing.feasibility({ Db: 100, Dp: 60, t: 2, rBar: 1.5 });
close('draw ratio', e4feas.drawRatio, 1.6667);
close('reduction', e4feas.reduction, 0.40);
close('t/Db', e4feas.thicknessRatio, 0.02);
truthy('single draw is feasible', e4feas.feasible === true);

const e4 = SF.drawing.force({ Db: 100, Dp: 60, t: 2, UTS: 400, Y: 250, Rd: 8, cupHeight: 26.67 });
close('draw force (kN)', e4.drawForce_kN, 145.77);
close('blankholder force (kN)', e4.blankholderForce_kN, 41.657);
close('total force (kN)', e4.totalForce_kN, 187.43);
close('clearance per side (mm)', e4.clearancePerSide_mm, 2.2);
close('energy (J)', e4.energy_J, 2721.3);
truthy('no tooling warnings at Rd = 4t', e4.warnings.length === 0);

console.log('\nExample 4b — feasibility guards fire');
const bad1 = SF.drawing.feasibility({ Db: 200, Dp: 60, t: 2 });
truthy('DR > 2.0 rejected', bad1.feasible === false && bad1.warnings.some(w => w.includes('DR')));
const bad2 = SF.drawing.feasibility({ Db: 300, Dp: 200, t: 1 });
truthy('t/Db < 1% warned', bad2.warnings.some(w => w.includes('t/Db')));
const bad3 = SF.drawing.force({ Db: 100, Dp: 60, t: 2, UTS: 400, Y: 250, Rd: 4 });
truthy('Rd < 4t warned', bad3.warnings.some(w => w.includes('Rd')));

// ── Example 5: strip layout ──────────────────────────────────────────────
console.log('\nExample 5 — Strip layout for the ⌀75 blank');
const e5 = SF.cutting.stripLayout({ partWidth: 75, partLength: 75, partArea: Math.PI * 75 * 75 / 4, t: 3.2 });
close('bridge (mm)', e5.bridge_mm, 3.84);
close('edge (mm)', e5.edge_mm, 4.80);
close('pitch (mm)', e5.pitch_mm, 78.84);
close('strip width (mm)', e5.stripWidth_mm, 84.60);
close('utilisation', e5.utilisation, 0.6624);
close('scrap %', e5.scrapPercent, 33.76);

const e5two = SF.cutting.stripLayout({ partWidth: 75, partLength: 75, partArea: Math.PI * 75 * 75 / 4, t: 3.2, rows: 2 });
truthy('two rows improve utilisation', e5two.utilisation > e5.utilisation);

// ── Core sheet mechanics ─────────────────────────────────────────────────
console.log('\nCore sheet mechanics');
close('shear strength default 0.7·UTS', SF.core.shearStrength(400), 280);
close('normal anisotropy r̄', SF.core.normalAnisotropy(1.6, 1.2, 1.8), 1.45);
close('planar anisotropy Δr', SF.core.planarAnisotropy(1.6, 1.2, 1.8), 0.5);
truthy('Δr = 0 for isotropic sheet', SF.core.planarAnisotropy(1.4, 1.4, 1.4) === 0);
close('LDR rises with r̄', SF.core.limitingDrawRatio(1.8).LDR, 2.4);
truthy('LDR clamped at 3.0 for Ti', SF.core.limitingDrawRatio(6).LDR === 3.0);
const th = SF.core.thinning(2.0, 0.15, 0.10);
close('thickness strain', th.thicknessStrain, -0.25);
close('final thickness (mm)', th.finalThickness, 1.5576);
truthy('thinning > 20% warns', th.warnings.length > 0);
close('uniform elongation = n', SF.core.uniformElongation(0.24).trueStrain, 0.24);
close('min bend radius from RA', SF.core.minBendRadiusFromRA(3, 50), 0);
close('min bend radius, RA=25%', SF.core.minBendRadiusFromRA(3, 25), 3);
// r-value round trip: a coupon that keeps thickness constant has r → ∞; use a real case
const rv = SF.core.rValue(12.5, 11.8, 50, 55);
truthy('r-value positive and finite', rv > 0 && isFinite(rv));

console.log('\nK-factor table');
close('K at R/t = 0.25', SF.bending.kFactor(1, 4, false), 0.30);
close('K at R/t = 1.0', SF.bending.kFactor(4, 4, false), 0.33);
close('K at R/t = 2.0', SF.bending.kFactor(8, 4, false), 0.40);
close('K at R/t = 5.0', SF.bending.kFactor(20, 4, false), 0.45);
close('simplified K, R < 2t', SF.bending.kFactor(6, 4, true), 0.33);
close('simplified K, R ≥ 2t', SF.bending.kFactor(10, 4, true), 0.50);

console.log('\nGuards & validation');
try { SF.cutting.clearance({ t: 2, size: 50, Ac: 0.075 }); truthy('rejects missing operation', false); }
catch (e) { truthy('rejects missing operation (blanking vs punching)', /blanking/.test(e.message)); }
truthy('too-tight clearance warns', SF.cutting.clearance({ t: 2, size: 50, Ac: 0.01, operation: 'blanking' }).warnings.some(w => w.includes('2٪')));
truthy('too-loose clearance warns', SF.cutting.clearance({ t: 2, size: 50, Ac: 0.15, operation: 'blanking' }).warnings.some(w => w.includes('10٪')));
truthy('small hole warns', SF.cutting.punchCheck({ punchDiameter: 1.5, force_N: 5000, t: 2 }).warnings.some(w => w.includes('ضخامت')));
truthy('slender punch buckling warns', SF.cutting.punchCheck({ punchDiameter: 3, force_N: 8000, punchLength: 200 }).warnings.some(w => w.includes('کمانش')));
truthy('overstressed punch warns', SF.cutting.punchCheck({ punchDiameter: 2, force_N: 60000 }).warnings.some(w => w.includes('می‌شکند')));
truthy('R < R_min warns', SF.bending.designCheck({ R: 0.5, t: 4, materialKey: 'steel_DC01' }).warnings.some(w => w.includes('R_min')));
truthy('short flange warns', SF.bending.designCheck({ R: 4, t: 4, materialKey: 'steel_DC01', flangeLength: 5 }).warnings.some(w => w.includes('لبه')));
truthy('parallel grain raises R_min 1.75×',
  Math.abs(SF.bending.designCheck({ R: 10, t: 4, materialKey: 'steel_DC01', grainDirection: 'parallel' }).minBendRadius_mm - 3.5) < 1e-9);
truthy('die opening < 6t warns', SF.bending.force({ w: 40, t: 4, dieOpening: 20, UTS: 400 }).warnings.length > 0);
truthy('E given in GPa is caught', SF.bending.springback({ Ri: 6, t: 4, Y: 250, E: 207 }).warnings.some(w => w.includes('GPa')));
try { SF.drawing.cupHeight({ Db: 60, Dp: 100 }); truthy('rejects Dp ≥ Db', false); }
catch (e) { truthy('rejects Dp ≥ Db', e instanceof RangeError); }
try { SF.cutting.force({ t: 2, perimeter: 100 }); truthy('rejects missing material data', false); }
catch (e) { truthy('rejects missing material data', /S, UTS, or materialKey/.test(e.message)); }

console.log('\nBlank diameter formula branches');
const b1 = SF.drawing.blankDiameter({ d: 60, h: 27, r: 1, trimAllowance: 0 });   // d/r = 60 > 20
const b2 = SF.drawing.blankDiameter({ d: 60, h: 27, r: 3.5, trimAllowance: 0 }); // d/r = 17.1
const b3 = SF.drawing.blankDiameter({ d: 60, h: 27, r: 5, trimAllowance: 0 });   // d/r = 12
const b4 = SF.drawing.blankDiameter({ d: 60, h: 27, r: 8, trimAllowance: 0 });   // d/r = 7.5
truthy('branch 1 selected', b1.formula.includes('4dh)'));
truthy('branch 2 selected', b2.formula.includes('0.5r'));
truthy('branch 3 selected', b3.formula.includes('− r'));
truthy('branch 4 selected', b4.formula.includes('0.7r'));
truthy('larger corner radius → smaller blank', b1.blankDiameter_mm > b3.blankDiameter_mm);
close('trim allowance applied', SF.drawing.blankDiameter({ d: 60, h: 26.67, r: 0 }).blankDiameterWithTrim_mm, 103.0);

console.log('\nRedraw plan');
const rp = SF.drawing.redrawPlan({ Db: 200, DpFinal: 60, t: 2, UTS: 400, Y: 250, Rd: 12 });
truthy('multi-stage plan generated', rp.nStages >= 2);
truthy('final diameter reached', Math.abs(rp.stages[rp.stages.length - 1].Dout_mm - 60) < 0.01);
truthy('each stage within its DR limit', rp.stages.every(s => s.drawRatio <= s.allowedDRmax + 1e-9));
truthy('stage ratios decrease', rp.stages.length < 2 || rp.stages[0].allowedDRmax >= rp.stages[1].allowedDRmax);
close('overall draw ratio', rp.overallDrawRatio, 200 / 60);

console.log('\nIroning & earing');
const ir = SF.drawing.ironing({ dMean: 60, t0: 2, tf: 1.4, UTS: 400 });
close('ironing reduction', ir.thicknessReduction, 0.30);
truthy('ironing force positive', ir.force_kN > 0);
const ea = SF.drawing.earing({ deltaR: 0.5, cupHeight: 40 });
truthy('significant earing warned', ea.warnings.length > 0);
truthy('ears at 0/90 for positive Δr', ea.earPositions.includes('0°'));

console.log('\nGuillotine');
const g = SF.cutting.guillotine({ t: 6, UTS: 400, rakeAngle_deg: 2 });
close('guillotine force (kN)', g.force_kN, 280 * 36 / (2 * Math.tan(2 * Math.PI / 180)) / 1000);
truthy('force independent of cut length', !('cutLength_mm' in g));

console.log('\nData tables & UI');
truthy('18 sheet materials', Object.keys(SF.data.SHEET_MATERIALS).length === 18);
truthy('every material complete', Object.values(SF.data.SHEET_MATERIALS).every(m =>
  m.Y > 0 && m.UTS > 0 && m.S > 0 && m.K > 0 && m.n >= 0 && m.rBar > 0 && m.E > 1000 && m.Ac > 0));
truthy('S is between 0.55 and 0.85 of UTS for every material',
  Object.values(SF.data.SHEET_MATERIALS).every(m => m.S / m.UTS > 0.55 && m.S / m.UTS < 0.85));
truthy('DDQ steel has the highest r̄ among steels',
  SF.data.SHEET_MATERIALS.steel_DC04.rBar > SF.data.SHEET_MATERIALS.steel_DC01.rBar);
truthy('UI covers 3 process groups', SF.UI.groups.length === 3);
truthy('every UI output has a label', SF.UI.groups.every(g =>
  g.calcs.every(c => c.outputs.every(o => SF.UI.labels[o]))));
truthy('every UI field has fa and en', SF.UI.groups.every(g =>
  g.calcs.every(c => c.fields.every(f => f.fa && f.en && f.unit))));

console.log('\nMaterial-key path matches explicit values');
const byKey = SF.drawing.force({ Db: 100, Dp: 60, t: 2, materialKey: 'steel_DC01', Rd: 12 });
const byVal = SF.drawing.force({ Db: 100, Dp: 60, t: 2, UTS: 330, Y: 210, Rd: 12 });
close('materialKey === explicit UTS/Y', byKey.totalForce_kN, byVal.totalForce_kN, 0.001);

console.log(`\n${'─'.repeat(76)}\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
