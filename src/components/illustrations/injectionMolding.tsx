import { CenterLabel, DimH, DimV, ForceArrowDown, ForceArrowUp, IllustrationFrame, num } from "./primitives";

/** machineSizing.* — part cavity between clamped platens, projected area shaded (top view inset). */
export function MoldCavityIllustration({ values }: { values: Record<string, string> }) {
  const area = num(values, "projectedArea_mm2", num(values, "partDia", 40) * num(values, "partLength", 60) || 2400);
  const halfW = Math.min(90, Math.max(30, Math.sqrt(area) * 1.1));

  return (
    <IllustrationFrame>
      <rect x={40} y={30} width={240} height={16} className="fill-surface-2 stroke-border" strokeWidth={1} />
      <rect x={40} y={154} width={240} height={16} className="fill-surface-2 stroke-border" strokeWidth={1} />
      <rect x={160 - halfW} y={46} width={halfW * 2} height={108} className="fill-accent-soft stroke-accent" strokeWidth={1.5} />
      <ForceArrowDown x={100} y={8} len={16} />
      <DimH x1={160 - halfW} x2={160 + halfW} y={70} label="سطح تصویرشده" />
      <CenterLabel x={160} y={100} text="حفره قالب" />
      <CenterLabel x={160} y={186} text="تناژ قفل‌کننده = سطح تصویرشده × فشار حفره" className="fill-muted" />
    </IllustrationFrame>
  );
}

/** cooling.coolingTime — wall cross-section with cooling channels below the surface. */
export function CoolingIllustration({ values }: { values: Record<string, string> }) {
  const wall = Math.min(30, Math.max(6, num(values, "wallThickness", 2.5) * 8));
  const cx = 160;

  return (
    <IllustrationFrame>
      <rect x={60} y={70} width={200} height={wall} className="fill-accent-soft stroke-accent" strokeWidth={1.5} />
      <circle cx={cx - 60} cy={70 + wall + 24} r={9} className="fill-surface-2 stroke-border" strokeWidth={1.5} />
      <circle cx={cx + 60} cy={70 + wall + 24} r={9} className="fill-surface-2 stroke-border" strokeWidth={1.5} />
      <path d={`M ${cx - 60} 70 V 40`} className="stroke-muted" strokeDasharray="2 2" strokeWidth={1} />
      <path d={`M ${cx - 60} ${70 + wall + 24} V ${70 + wall}`} className="stroke-muted" strokeDasharray="2 2" strokeWidth={1} />
      <DimV y1={70} y2={70 + wall} x={50} label="t" />
      <CenterLabel x={160} y={186} text="کانال خنک‌کاری زیر سطح دیواره قطعه" className="fill-muted" />
    </IllustrationFrame>
  );
}

/** cooling.channels — coolant flow through a circular channel. */
export function CoolingChannelIllustration({ values }: { values: Record<string, string> }) {
  const dia = Math.min(50, Math.max(14, num(values, "channelDia_mm", 10) * 3));
  const cx = 160;
  const cy = 100;

  return (
    <IllustrationFrame>
      <rect x={40} y={cy - dia * 0.9} width={240} height={dia * 1.8} className="fill-surface-2 stroke-border" strokeWidth={1} />
      <circle cx={cx} cy={cy} r={dia / 2} className="fill-accent-soft stroke-accent" strokeWidth={1.5} />
      <path d={`M ${cx - dia / 2 - 40} ${cy} H ${cx - dia / 2}`} className="stroke-accent" strokeWidth={2} markerEnd="url(#flowArrow)" />
      <defs>
        <marker id="flowArrow" markerWidth={8} markerHeight={8} refX={6} refY={3} orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" className="fill-accent" />
        </marker>
      </defs>
      <DimV y1={cy - dia / 2} y2={cy + dia / 2} x={cx + dia / 2 + 16} label="قطر کانال" left={false} />
      <CenterLabel x={160} y={186} text="جریان آب خنک‌کننده در کانال قالب" className="fill-muted" />
    </IllustrationFrame>
  );
}

/** cavities.count / economic — a grid of cavities laid out on the mold plate (illustrative, since the count is the calc's output). */
export function CavityLayoutIllustration({ values }: { values: Record<string, string> }) {
  const count = Math.max(1, Math.min(12, Math.round(num(values, "cavities", 4))));
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const cellW = 220 / cols;
  const cellH = 120 / rows;
  const cells = Array.from({ length: count });

  return (
    <IllustrationFrame>
      <rect x={40} y={30} width={240} height={140} className="fill-surface-2 stroke-border" strokeWidth={1} />
      {cells.map((_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cx = 50 + col * cellW + cellW / 2;
        const cy = 40 + row * cellH + cellH / 2;
        return <circle key={i} cx={cx} cy={cy} r={Math.min(cellW, cellH) * 0.32} className="fill-accent-soft stroke-accent" strokeWidth={1.5} />;
      })}
      <CenterLabel x={160} y={186} text={`چیدمان ${count} حفره روی صفحه قالب`} className="fill-muted" />
    </IllustrationFrame>
  );
}

/** feed.sprue / runnerDiameter — sprue, runner and gate feeding the cavity. */
export function RunnerSprueIllustration({ values }: { values: Record<string, string> }) {
  const nozzleDia = Math.min(24, Math.max(8, num(values, "nozzleDia_mm", 4) * 3));
  const halfAngle = num(values, "halfAngle_deg", 2);
  const cy = 100;

  return (
    <IllustrationFrame>
      <path d={`M ${160 - nozzleDia / 2} 40 L ${160 - nozzleDia} 130 H ${160 + nozzleDia} L ${160 + nozzleDia / 2} 40 Z`} className="fill-accent-soft stroke-accent" strokeWidth={1.5} />
      <rect x={160 + nozzleDia} y={cy + 20} width={90} height={10} className="fill-surface-2 stroke-border" strokeWidth={1} />
      <rect x={250} y={cy + 10} width={16} height={30} rx={3} className="fill-accent-soft stroke-accent" strokeWidth={1.5} />
      <text x={160} y={30} textAnchor="middle" className="fill-muted" style={{ fontSize: 9 }}>
        نیم‌زاویه≈{halfAngle.toFixed(0)}°
      </text>
      <DimH x1={160 + nozzleDia} x2={250} y={cy + 44} label="رانر" above={false} />
      <CenterLabel x={200} y={186} text="اسپرو → رانر → گیت → حفره" className="fill-muted" />
    </IllustrationFrame>
  );
}

/** feed.edgeGate — close-up of an edge gate cross-section into the cavity wall. */
export function EdgeGateIllustration({ values }: { values: Record<string, string> }) {
  const wall = Math.min(28, Math.max(8, num(values, "wallThickness_mm", 2.5) * 6));

  return (
    <IllustrationFrame>
      <rect x={40} y={70} width={110} height={wall} className="fill-surface-2 stroke-border" strokeWidth={1} />
      <path d={`M 150 ${70 + wall * 0.15} H 190 V ${70 + wall * 0.85} H 150 Z`} className="fill-accent-soft stroke-accent" strokeWidth={1.5} />
      <rect x={190} y={70 - 6} width={90} height={wall + 12} className="fill-accent-soft stroke-accent" strokeWidth={1.5} />
      <DimV y1={70} y2={70 + wall} x={30} label="t" />
      <DimH x1={150} x2={190} y={70 + wall + 16} label="طول زمین گیت" above={false} />
      <CenterLabel x={160} y={186} text="مقطع گیت لبه‌ای در دیواره حفره" className="fill-muted" />
    </IllustrationFrame>
  );
}

/** feed.gateFreezeTime — gate solidification cross-section. */
export function GateFreezeIllustration({ values }: { values: Record<string, string> }) {
  const depth = Math.min(26, Math.max(6, num(values, "gateDepth_mm", 1.5) * 10));

  return (
    <IllustrationFrame>
      <rect x={60} y={90} width={200} height={depth} className="fill-accent-soft stroke-accent" strokeWidth={1.5} />
      <path d={`M 60 90 V 70 M 60 ${90 + depth} V ${110 + depth}`} className="stroke-muted" strokeDasharray="2 2" strokeWidth={1} />
      <DimV y1={90} y2={90 + depth} x={50} label="عمق گیت" />
      <CenterLabel x={160} y={186} text="زمان انجماد گیت پیش از باز شدن جریان مذاب" className="fill-muted" />
    </IllustrationFrame>
  );
}

/** partMold.cavityDimension — part outline vs. the (slightly larger) cavity that compensates for shrinkage. */
export function CavityDimensionIllustration({ values }: { values: Record<string, string> }) {
  const partDim = Math.min(120, Math.max(40, num(values, "partDimension_mm", 60)));
  const shrinkage = num(values, "shrinkage", 0.02);
  const cavityDim = partDim * (1 + Math.max(shrinkage, 0.005));
  const cx = 160;
  const cy = 100;

  return (
    <IllustrationFrame>
      <rect x={cx - cavityDim / 2} y={cy - 30} width={cavityDim} height={60} rx={4} className="fill-none stroke-muted" strokeDasharray="4 3" strokeWidth={1.5} />
      <rect x={cx - partDim / 2} y={cy - 24} width={partDim} height={48} rx={4} className="fill-accent-soft stroke-accent" strokeWidth={1.5} />
      <DimH x1={cx - partDim / 2} x2={cx + partDim / 2} y={cy + 40} label="ابعاد قطعه" above={false} />
      <DimH x1={cx - cavityDim / 2} x2={cx + cavityDim / 2} y={cy - 46} label="ابعاد حفره (با انقباض)" />
      <CenterLabel x={160} y={186} text="حفره بزرگ‌تر از قطعه به اندازه انقباض ماده" className="fill-muted" />
    </IllustrationFrame>
  );
}

/** partMold.ejectionForce — ejector pins pushing the part off a core, at the draft angle. */
export function EjectionForceIllustration({ values }: { values: Record<string, string> }) {
  const coreDia = Math.min(80, Math.max(30, num(values, "coreDia_mm", 30) * 1.4));
  const draft = num(values, "draftAngle_deg", 1);
  const skew = Math.min(18, Math.max(2, draft * 4));
  const cx = 160;

  return (
    <IllustrationFrame>
      <path d={`M ${cx - coreDia / 2 - skew} 50 L ${cx + coreDia / 2 + skew} 50 L ${cx + coreDia / 2} 140 L ${cx - coreDia / 2} 140 Z`} className="fill-accent-soft stroke-accent" strokeWidth={1.5} />
      {[cx - coreDia / 2 + 12, cx, cx + coreDia / 2 - 12].map((x, i) => (
        <g key={i}>
          <rect x={x - 3} y={140} width={6} height={20} className="fill-surface-2 stroke-border" strokeWidth={1} />
          <ForceArrowUp x={x} y={158} len={12} />
        </g>
      ))}
      <text x={cx + coreDia / 2 + skew + 10} y={45} className="fill-muted" style={{ fontSize: 9 }}>
        شیب≈{draft.toFixed(1)}°
      </text>
      <CenterLabel x={160} y={30} text="پران‌های زیر قطعه در امتداد زاویه شیب" className="fill-muted" />
    </IllustrationFrame>
  );
}

/** partMold.plateDeflection — a supported plate flexing under uniform cavity pressure. */
export function PlateDeflectionIllustration({ values }: { values: Record<string, string> }) {
  const span = Math.min(220, Math.max(80, num(values, "span_mm", 100) * 1.4));
  const thickness = Math.min(24, Math.max(8, num(values, "plateThickness_mm", 20) * 0.8));
  const cx = 160;
  const y0 = 90;

  return (
    <IllustrationFrame>
      <path
        d={`M ${cx - span / 2} ${y0} Q ${cx} ${y0 + 18} ${cx + span / 2} ${y0}`}
        className="fill-none stroke-accent"
        strokeWidth={thickness}
        strokeLinecap="round"
      />
      <rect x={cx - span / 2 - 14} y={y0 - 10} width={16} height={26} className="fill-surface-2 stroke-border" strokeWidth={1} />
      <rect x={cx + span / 2 - 2} y={y0 - 10} width={16} height={26} className="fill-surface-2 stroke-border" strokeWidth={1} />
      {[cx - 50, cx, cx + 50].map((x, i) => (
        <ForceArrowDown key={i} x={x} y={y0 - thickness / 2 - 26} len={16} />
      ))}
      <DimH x1={cx - span / 2} x2={cx + span / 2} y={y0 - thickness / 2 - 34} label="دهانه بین تکیه‌گاه" />
      <CenterLabel x={160} y={186} text="خیز صفحه قالب زیر فشار یکنواخت حفره" className="fill-muted" />
    </IllustrationFrame>
  );
}

/** partMold.venting — a shallow vent groove at the parting line. */
export function VentingIllustration({ values }: { values: Record<string, string> }) {
  const depth = Math.min(20, Math.max(6, num(values, "ventDepth_mm", 0.02) * 400));

  return (
    <IllustrationFrame>
      <rect x={40} y={80} width={240} height={16} className="fill-surface-2 stroke-border" strokeWidth={1} />
      <rect x={150} y={80 - depth} width={30} height={depth} className="fill-accent-soft stroke-accent" strokeWidth={1.5} />
      <rect x={40} y={64} width={240} height={16} className="fill-surface-2 stroke-border" strokeWidth={1} />
      <DimV y1={80 - depth} y2={80} x={140} label="عمق ونت" />
      <CenterLabel x={160} y={186} text="شیار کم‌عمق ونت در خط جدایش قالب" className="fill-muted" />
    </IllustrationFrame>
  );
}
