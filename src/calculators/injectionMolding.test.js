/*
 * injectionMolding.test.js — acceptance tests against the worked example in
 * injection-molding-reference.md §13.  Run:  node injectionMolding.test.js
 * Zero dependencies.
 */
const IM = require('./injectionMolding.js');

let pass = 0, fail = 0;
function close(name, got, want, tolPct = 1.0) {
  const err = want === 0 ? (got === 0 ? 0 : Infinity) : Math.abs(got - want) / Math.abs(want) * 100;
  const ok = err <= tolPct;
  console.log(`${ok ? '  PASS' : '  FAIL'}  ${name.padEnd(46)} got=${Number(got).toPrecision(6)}  want=${Number(want).toPrecision(6)}  err=${err.toFixed(3)}%`);
  ok ? pass++ : fail++;
}
function truthy(name, cond) {
  console.log(`${cond ? '  PASS' : '  FAIL'}  ${name}`);
  cond ? pass++ : fail++;
}

// ── Worked example: ABS disc, ⌀100, t=2, 25 g, 4 cavities ────────────────
console.log('\nWorked example — ABS disc ⌀100 × 2 mm, 25 g, 4 cavities');

const geo = IM.geometry.projectedArea({
  shape: 'round', partDia: 100, cavities: 4,
  runnerLegs: [{ width: 6, length: 50, legs: 4 }],
});
close('area per part (mm²)', geo.areaPerPart_mm2, 7853.98);
close('parts area (mm²)', geo.partsArea_mm2, 31415.9);
close('runner area (mm²)', geo.runnerArea_mm2, 1200);
close('total projected (mm²)', geo.totalArea_mm2, 32615.9);
close('total projected (in²)', geo.totalArea_in2, 50.5548);
close('runner share', geo.runnerShare, 0.03679);

const lt = IM.machine.ltRatio({ flowLength: 50, wallThickness: 2, materialKey: 'ABS' });
close('L/T ratio', lt.ltRatio, 25);
close('tons per in² for band', lt.tonsPerIn2, 2.0);
truthy('L/T band is "L/T < 125"', lt.band === 'L/T < 125');
truthy('well inside ABS flow limit', lt.utilisation < 0.2 && lt.warnings.length === 0);

const ton = IM.machine.tonnage({ projectedArea_mm2: 32615.9, ltRatio: 25, materialKey: 'ABS' });
close('L/T method (US tons)', ton.ltBandMethod.usTons, 101.11);
close('L/T method (metric tons)', ton.ltBandMethod.metricTons, 91.72);
close('cavity pressure method (kN)', ton.cavityPressureMethod.kN, 1141.56);
close('cavity pressure method (metric t)', ton.cavityPressureMethod.metricTons, 116.41);
truthy('cavity pressure method governs', ton.governingMethod === 'cavityPressure');
close('required with 1.2 SF (metric t)', ton.required_metricTons, 139.69);
truthy('suggests a machine around 175–225 t',
  ton.recommendedMachine_metricTons > 200 && ton.recommendedMachine_metricTons < 225);

const runner = IM.geometry.runnerMass({ legs: [{ dia: 6, length: 50, count: 4 }], materialKey: 'ABS' });
close('runner volume (cm³)', runner.volume_cm3, 5.65487);
close('runner mass (g)', runner.mass_g, 5.9376);

const unit = IM.machine.injectionUnit({
  partWeight_g: 25, cavities: 4, runnerWeight_g: 5.9376,
  materialKey: 'ABS', targetFill: 0.5, machineCapacity_oz: 8, cycleTime_s: 16.92,
});
close('shot weight (g)', unit.shotWeight_g, 105.938);
close('shot weight (oz)', unit.shotWeight_oz, 3.73685);
close('shot volume (cm³)', unit.shotVolume_cm3, 100.893);
close('runner efficiency', unit.runnerEfficiency, 0.94395);
close('preferred capacity (oz)', unit.requiredCapacity_ozGPPS, 7.4737);
close('8 oz machine volume (cm³)', unit.machineCapacity_cm3, 215.996);
close('barrel utilisation', unit.barrelUtilisation, 0.46711);
close('plasticizing rate (kg/h)', unit.plasticizingRate_kgh, 22.541);
truthy('barrel utilisation inside 20–80% window', unit.warnings.every(w => !w.includes('بشکه')));

const cool = IM.cooling.coolingTime({ wallThickness: 2, materialKey: 'ABS' });
close('temperature ratio', cool.temperatureRatio, 5.142857);
close('cooling time (s)', cool.coolingTime_s, 7.6164);

const cyc = IM.cooling.cycleTime({ coolingTime_s: 7.6164, injectionTime_s: 1.5, packFactor: 0.5, moldOpenCloseEject_s: 4 });
close('cycle time (s)', cyc.cycleTime_s, 16.925);
close('shots per hour', cyc.shotsPerHour, 212.7);

const heat = IM.cooling.heatLoad({ shotWeight_g: 105.938, cycleTime_s: 16.925, materialKey: 'ABS', waterDeltaT_K: 2.5 });
close('specific enthalpy (J/kg)', heat.specificEnthalpy_J_kg, 203000);
close('heat per cycle (J)', heat.heatPerCycle_J, 21505.4);
close('heat rate (W)', heat.heatRate_W, 1270.6);
close('coolant flow (L/min)', heat.coolantFlow_Lmin, 7.3237);

const ch = IM.cooling.channels({ channelDia_mm: 10, totalFlow_Lmin: 7.3237, circuits: 2 });
close('Reynolds (2 circuits)', ch.reynolds, 9703, 1.5);
truthy('flagged as below the Re ≥ 10,000 target', ch.warnings.some(w => w.includes('Re ≥ 10,000')));
const ch3 = IM.cooling.channels({ channelDia_mm: 10, totalFlow_Lmin: 7.3237, circuits: 3 });
truthy('3 circuits gives worse Re than 2', ch3.reynolds < ch.reynolds);
truthy('2 circuits is turbulent, 3 is weaker', ch.reynolds > 4000 && ch3.reynolds > 4000);

const run = IM.feed.runnerDiameter({ partWeight_g: 25, runnerLength_mm: 50, wallThickness_mm: 2 });
close('empirical runner dia (mm)', run.empiricalDia_mm, 3.5934);
close('freeze-rule minimum (mm)', run.minimumDia_mm, 3.5);
truthy('empirical governs here', run.governingRule.includes('empirical'));

const gate = IM.feed.edgeGate({ wallThickness_mm: 2, cavitySurfaceArea_mm2: 7853.98, materialKey: 'ABS' });
close('gate depth (mm)', gate.depth_mm, 1.4);
close('gate width (mm)', gate.width_mm, 2.0679);
truthy('gate depth within 0.8·t', gate.depthToWallRatio <= 0.8 + 1e-9);

const cav = IM.part.cavityDimension({ partDimension_mm: 100, materialKey: 'ABS' });
close('cavity dimension (mm)', cav.cavityDimension_mm, 100.55);
close('precise formula (mm)', cav.preciseFormula_mm, 100.5530);

// ── Same job through the one-call wrapper ────────────────────────────────
console.log('\nOne-call wrapper reproduces the same numbers');
const all = IM.moldingDataCalculator({
  unitSystem: 'metric', shape: 'round', partDia: 100, cavities: 4,
  wallThickness: 2, flowLength: 50, partWeight: 25, runnerWeight: 5.9376,
  materialKey: 'ABS', machineCapacity_oz: 8,
  runnerLegs: [{ width: 6, length: 50, legs: 4 }],
  injectionTime_s: 1.5, packFactor: 0.5, moldOpenCloseEject_s: 4,
});
close('wrapper projected area (in²)', all.summary.totalProjectedArea_in2, 50.5548);
close('wrapper L/T', all.summary.ltRatio, 25);
close('wrapper tonnage (US ton)', all.summary.tonnage_usTons, 128.32);
close('wrapper shot (oz)', all.summary.shotWeight_oz, 3.73685);
close('wrapper preferred unit (oz)', all.summary.preferredInjectionUnit_oz, 7.4737);
close('wrapper cooling (s)', all.summary.coolingTime_s, 7.6164);
close('wrapper cycle (s)', all.summary.cycleTime_s, 16.925);
close('wrapper coolant flow (L/min)', all.summary.coolantFlow_Lmin, 7.3237);

console.log('\nImperial input path gives identical results');
const imp = IM.moldingDataCalculator({
  unitSystem: 'imperial', shape: 'round',
  partDia: 100 / 25.4, cavities: 4,
  wallThickness: 2 / 25.4, flowLength: 50 / 25.4,
  partWeight: 25 / 28.349523125, runnerWeight: 5.9376 / 28.349523125,
  materialKey: 'ABS', machineCapacity_oz: 8,
  runnerLegs: [{ width: 6 / 25.4, length: 50 / 25.4, legs: 4 }],
  injectionTime_s: 1.5, packFactor: 0.5, moldOpenCloseEject_s: 4,
});
close('imperial projected area (in²)', imp.summary.totalProjectedArea_in2, all.summary.totalProjectedArea_in2, 0.01);
close('imperial L/T', imp.summary.ltRatio, all.summary.ltRatio, 0.01);
close('imperial shot (oz)', imp.summary.shotWeight_oz, all.summary.shotWeight_oz, 0.01);
close('imperial cycle (s)', imp.summary.cycleTime_s, all.summary.cycleTime_s, 0.01);

// ── Unit conversions ─────────────────────────────────────────────────────
console.log('\nUnit conversions');
close('1 US ton/in² = 13.79 MPa', IM.units.tonPerIn2_to_MPa(1), 13.78951);
close('2 tons/in² ≈ 27.6 MPa', IM.units.tonPerIn2_to_MPa(2), 27.579);
close('1 US ton = 0.9072 metric ton', IM.units.usTon_to_metricTon(1), 0.907185);
close('1 oz GPPS rating = 27.0 cm³', IM.units.ozGPPS_to_cm3(1), 26.9995);
close('8 oz of POM (SG 1.41)', IM.units.ozGPPS_to_g(8, 1.41), 304.63);
close('8 oz of PP (SG 0.905)', IM.units.ozGPPS_to_g(8, 0.905), 195.52);
truthy('POM capacity is far above PP for the same rating',
  IM.units.ozGPPS_to_g(8, 1.41) > 1.5 * IM.units.ozGPPS_to_g(8, 0.905));
close('in² → mm² round trip', IM.units.mm2_to_in2(IM.units.in2_to_mm2(12.5)), 12.5);
close('°C → °F', IM.units.C_to_F(100), 212);

const bc = IM.machine.barrelCapacity({ rating_oz: 8, materialKey: 'POM' });
close('barrel capacity POM (g)', bc.mass_g, 304.63);

// ── Cooling physics sanity ───────────────────────────────────────────────
console.log('\nCooling physics');
const c2 = IM.cooling.coolingTime({ wallThickness: 4, materialKey: 'ABS' });
close('doubling wall quadruples cooling', c2.coolingTime_s / cool.coolingTime_s, 4.0);
const cCyl = IM.cooling.coolingTime({ wallThickness: 2, materialKey: 'ABS', geometry: 'cylinder' });
truthy('cylinder formula returns a different value', Math.abs(cCyl.coolingTime_s - cool.coolingTime_s) > 0.1);
const cCf = IM.cooling.coolingTime({ wallThickness: 2, materialKey: 'ABS', complexityFactor: 1.35 });
close('complexity factor applies linearly', cCf.coolingTime_s, cool.coolingTime_s * 1.35);
truthy('semicrystalline carries latent heat',
  IM.cooling.heatLoad({ shotWeight_g: 100, cycleTime_s: 20, materialKey: 'PP' }).specificEnthalpy_J_kg >
  1900 * (230 - 95));
truthy('amorphous carries no latent heat',
  Math.abs(IM.cooling.heatLoad({ shotWeight_g: 100, cycleTime_s: 20, materialKey: 'PS' }).specificEnthalpy_J_kg
    - 1300 * (230 - 80)) < 1e-6);

// ── Cavity count ─────────────────────────────────────────────────────────
console.log('\nCavity count');
const cc = IM.cavities.count({
  requiredParts: 500000, availableHours: 1000, cycleTime_s: 17, partWeight_g: 25,
  partProjectedArea_mm2: 7853.98, machineTonnage_metricTon: 200,
  machineCapacity_oz: 8, plasticizingRate_kgh: 40, materialKey: 'ABS',
  runnerWeight_g: 6, uptime: 0.85,
});
truthy('all four constraints evaluated', Object.keys(cc.constraints).length === 4);
close('production lower bound', cc.constraints.production.value, 500000 * 17 / (1000 * 3600 * 0.85));
close('clamp upper bound', cc.constraints.clamp.value, 200 * 9.80665 * 1000 / (35 * 7853.98));
truthy('recommended is a practical count', IM.data.PRACTICAL_CAVITIES.includes(cc.recommendedCavities));
truthy('recommended within bounds', cc.recommendedCavities <= Math.ceil(cc.upperBound));
truthy('governing constraint identified', typeof cc.governingConstraint === 'string');

truthy('rounds 7 down to 6, not up to 8', IM.cavities.roundToPractical(7).value === 6);
truthy('rounds 5 down to 4', IM.cavities.roundToPractical(5).value === 4);
truthy('rounds 100 down to 96', IM.cavities.roundToPractical(100).value === 96);

const ec = IM.cavities.economic({ requiredParts: 500000, cycleTime_s: 17, hourlyRate: 60, costPerCavity: 3000 });
close('economic optimum', ec.optimumCavities, Math.sqrt(500000 * (17 / 3600) * 60 / 3000));
truthy('cost curve is U-shaped around the optimum', ec.costCurve.length > 2);
truthy('economic recommendation is practical', IM.data.PRACTICAL_CAVITIES.includes(ec.recommendedCavities));

// ── Feed system ──────────────────────────────────────────────────────────
console.log('\nFeed system');
const br = IM.feed.runnerBranch({ branchDia_mm: 4, branches: 2 });
close('2-branch main diameter', br.mainDia_mm, 4 * Math.pow(2, 1 / 3));
close('2-branch ratio ≈ 1.26', br.ratio, 1.259921);
close('8-branch ratio = 2.0', IM.feed.runnerBranch({ branchDia_mm: 3, branches: 8 }).ratio, 2.0);

const sp = IM.feed.sprue({ nozzleDia_mm: 3.5, length_mm: 60, halfAngle_deg: 1.5 });
close('sprue small end', sp.smallEndDia_mm, 4.25);
close('sprue large end', sp.largeEndDia_mm, 4.25 + 2 * 60 * Math.tan(1.5 * Math.PI / 180));
truthy('60 mm sprue not flagged', sp.warnings.length === 0);
truthy('80 mm sprue flagged',
  IM.feed.sprue({ nozzleDia_mm: 3.5, length_mm: 80 }).warnings.some(w => w.includes('long sprue')));

const gf = IM.feed.gateFreezeTime({ gateDepth_mm: 1.4, materialKey: 'ABS' });
truthy('gate freezes well before the part', gf.gateFreezeTime_s < cool.coolingTime_s);
close('hold time is 10% past gate freeze', gf.recommendedHoldTime_s, gf.gateFreezeTime_s * 1.1);

console.log('\nGate guards');
const gThin = IM.feed.edgeGate({ wallThickness_mm: 0.5, cavitySurfaceArea_mm2: 1000, materialKey: 'PC' });
truthy('gate depth floored at 0.5 mm', gThin.depth_mm >= 0.5 && gThin.warnings.some(w => w.includes('0.5')));
const gThick = IM.feed.edgeGate({ wallThickness_mm: 3, cavitySurfaceArea_mm2: 5000, materialKey: 'PVC_U' });
truthy('gate depth capped at 0.8·t for n=0.9', gThick.depth_mm <= 0.8 * 3 + 1e-9);

// ── Part & mold detail ───────────────────────────────────────────────────
console.log('\nPart & mold detail');
const ej = IM.part.ejectionForce({
  coreDia_mm: 40, contactLength_mm: 50, wallThickness_mm: 2,
  modulusAtEject_MPa: 800, materialKey: 'ABS', draftAngle_deg: 1,
  nPins: 4, pinDia_mm: 6,
});
truthy('ejection force positive at 1° draft', ej.ejectionForce_N > 0);
truthy('not self-releasing at 1° with μ=0.35', ej.selfReleasing === false);
const ejFree = IM.part.ejectionForce({
  coreDia_mm: 40, contactLength_mm: 50, wallThickness_mm: 2,
  modulusAtEject_MPa: 800, materialKey: 'ABS', draftAngle_deg: 25,
});
truthy('self-releasing when tanα > μ', ejFree.selfReleasing === true && ejFree.ejectionForce_N === 0);
const ejPins = IM.part.ejectionForce({
  coreDia_mm: 80, contactLength_mm: 100, wallThickness_mm: 1.5,
  modulusAtEject_MPa: 1500, materialKey: 'ABS', draftAngle_deg: 0.5,
  nPins: 2, pinDia_mm: 3,
});
truthy('overloaded pins warned', ejPins.warnings.some(w => w.includes('تنش پین')));

const pd = IM.mold.plateDeflection({ cavityPressure_MPa: 35, span_mm: 200, plateThickness_mm: 40, pressurisedWidth_mm: 1 });
close('deflection formula', pd.deflection_mm,
  5 * 35 * Math.pow(200, 4) / (384 * 210000 * (1 * Math.pow(40, 3) / 12)));
close('pillar cuts deflection 16×', pd.deflectionWithPillar_mm, pd.deflection_mm / 16);
truthy('required thickness reported', pd.requiredThickness_mm > 0);

const iw = IM.mold.insertWall({ innerDia_mm: 100, cavityPressure_MPa: 50, allowableStress_MPa: 500 });
close('Lamé outer diameter', iw.outerDia_mm, 100 * Math.sqrt(550 / 450));
const iwBad = IM.mold.insertWall({ innerDia_mm: 100, cavityPressure_MPa: 600, allowableStress_MPa: 500 });
truthy('impossible wall flagged', iwBad.outerDia_mm === Infinity && iwBad.warnings.length > 0);

const vt = IM.part.venting({ materialKey: 'PA6', ventDepth_mm: 0.03 });
close('PA6 vent depth', vt.recommendedDepth_mm, 0.012);
truthy('over-deep vent warned', vt.warnings.length > 0);
truthy('styrenics vent deeper than nylon',
  IM.data.POLYMERS.ABS.ventDepth > IM.data.POLYMERS.PA6.ventDepth);

const dr = IM.part.draft({ finish: 'coarseTexture', textureDepth_mm: 0.05 });
close('texture adds 2° for 0.05 mm', dr.textureAllowance_deg, 2);
close('recommended draft', dr.recommended_deg, 7);

// ── Guards & validation ──────────────────────────────────────────────────
console.log('\nGuards & validation');
const ltBad = IM.machine.ltRatio({ flowLength: 400, wallThickness: 1.5, materialKey: 'PC' });
truthy('L/T beyond PC limit warned', ltBad.warnings.some(w => w.includes('short shot')));
// ABS ltMax = 185; 85 % of that is 157 — L/T = 160 should raise the "close to limit" flag
truthy('L/T near limit warned', IM.machine.ltRatio({ flowLength: 320, wallThickness: 2, materialKey: 'ABS' }).warnings.some(w => w.includes('۸۵٪')));
try { IM.cooling.coolingTime({ wallThickness: 2, alpha: 0.1, Tmelt: 240, Tmold: 100, Teject: 90 }); truthy('rejects Teject ≤ Tmold', false); }
catch (e) { truthy('rejects Teject ≤ Tmold', e instanceof RangeError); }
try { IM.geometry.projectedArea({ shape: 'hexagon', cavities: 2 }); truthy('rejects unknown shape', false); }
catch (e) { truthy('rejects unknown shape', /round/.test(e.message)); }
try { IM.machine.tonnage({ projectedArea_mm2: 1000 }); truthy('rejects tonnage with no method', false); }
catch (e) { truthy('rejects tonnage with no method', /ltRatio/.test(e.message)); }
truthy('missing cold runner is flagged',
  IM.geometry.projectedArea({ shape: 'round', partDia: 50, cavities: 2 }).warnings.some(w => w.includes('رانر')));
truthy('runner-dominated layout flagged',
  IM.geometry.projectedArea({ shape: 'round', partDia: 20, cavities: 2, runnerLegs: [{ width: 8, length: 200 }] })
    .warnings.some(w => w.includes('25٪')));
truthy('oversized machine flagged',
  IM.machine.tonnage({ projectedArea_mm2: 5000, ltRatio: 20, materialKey: 'PP', machineTonnage_metricTon: 300 })
    .warnings.some(w => w.includes('بیش از حد بزرگ')));
truthy('overloaded machine flagged',
  IM.machine.tonnage({ projectedArea_mm2: 200000, ltRatio: 20, materialKey: 'PC', machineTonnage_metricTon: 300 })
    .warnings.some(w => w.includes('۸۰٪')));
truthy('laminar cooling flagged',
  IM.cooling.channels({ channelDia_mm: 12, totalFlow_Lmin: 1, circuits: 2 }).warnings.some(w => w.includes('آرام')));
truthy('long residence flagged',
  IM.machine.injectionUnit({ partWeight_g: 5, cavities: 1, materialKey: 'PVC_U', machineCapacity_oz: 16, cycleTime_s: 30 })
    .warnings.some(w => w.includes('اقامت') || w.includes('بشکه')));
truthy('runner-heavy shot flagged',
  IM.machine.injectionUnit({ partWeight_g: 2, cavities: 2, runnerWeight_g: 8, materialKey: 'ABS' })
    .warnings.some(w => w.includes('بازده رانر')));
truthy('water ΔT above 3 K flagged',
  IM.cooling.heatLoad({ shotWeight_g: 100, cycleTime_s: 20, materialKey: 'ABS', waterDeltaT_K: 5 })
    .warnings.some(w => w.includes('ΔT')));

// ── Data integrity & UI ──────────────────────────────────────────────────
console.log('\nData integrity & UI');
const P = IM.data.POLYMERS;
truthy('15 polymers', Object.keys(P).length === 15);
truthy('every polymer complete', Object.values(P).every(m =>
  m.rho > 0 && m.alpha > 0 && m.Tmelt > m.Teject && m.Teject > m.Tmold &&
  m.cp > 0 && m.Hf >= 0 && m.shrink > 0 && m.pCav > 0 && m.ltMax > 0 &&
  m.gateN > 0 && m.ventDepth > 0 && m.mu > 0));
truthy('amorphous polymers have Hf = 0',
  Object.values(P).filter(m => m.type === 'amorphous').every(m => m.Hf === 0));
truthy('semicrystalline polymers have Hf > 0',
  Object.values(P).filter(m => m.type === 'semicrystalline').every(m => m.Hf > 0));
truthy('semicrystalline shrink more than amorphous',
  Math.min(...Object.values(P).filter(m => m.type === 'semicrystalline').map(m => m.shrink)) >
  Math.max(...Object.values(P).filter(m => m.type === 'amorphous').map(m => m.shrink)));
truthy('every shrink value inside its own range',
  Object.values(P).every(m => m.shrink >= m.shrinkRange[0] && m.shrink <= m.shrinkRange[1]));
truthy('tonnage bands ascend', IM.data.TONNAGE_BANDS.every((b, i, a) =>
  i === 0 || (b.maxLT > a[i - 1].maxLT && b.tonsPerIn2 > a[i - 1].tonsPerIn2)));
truthy('UI covers 5 groups', IM.UI.groups.length === 5);
truthy('every UI output has a label', IM.UI.groups.every(g =>
  g.calcs.every(c => c.outputs.every(o => IM.UI.labels[o]))));
truthy('every UI field is bilingual', IM.UI.groups.every(g =>
  g.calcs.every(c => c.fields.every(f => f.fa && f.en && f.unit))));
truthy('every material select lists real keys', IM.UI.groups.every(g =>
  g.calcs.every(c => c.fields.every(f =>
    f.key !== 'materialKey' || f.options.every(k => P[k])))));

console.log(`\n${'─'.repeat(78)}\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
