import { CenterLabel, DimH, DimV, ForceArrowDown, IllustrationFrame, num } from "./primitives";

/** forging.upsetCylinder / upsetSlab — a billet compressed between two flat platens. */
export function UpsetIllustration({ values, slab }: { values: Record<string, string>; slab?: boolean }) {
  const h0 = num(values, "h0", 40);
  const h1 = num(values, slab ? "h1" : "h1", Math.max(h0 * 0.6, 10));
  const w0 = slab ? num(values, "w", 30) : num(values, "d0", 30);
  // volume/area conservation for the schematic shape after squashing
  const w1 = slab ? (w0 * h0) / h1 : w0 * Math.sqrt(h0 / h1);

  const scaleH = 80 / Math.max(h0, 1);
  const scaleW = 180 / Math.max(w0, w1, 1);
  const bottomY = 148;
  const h0px = h0 * scaleH;
  const h1px = h1 * scaleH;
  const w0px = w0 * scaleW;
  const w1px = w1 * scaleW;
  const cx = 160;

  return (
    <IllustrationFrame>
      {/* platens */}
      <rect x={cx - 110} y={30} width={220} height={10} className="fill-surface-2 stroke-border" />
      <rect x={cx - 110} y={bottomY} width={220} height={10} className="fill-surface-2 stroke-border" />
      {/* before (dashed, faded) */}
      <rect
        x={cx - w0px / 2}
        y={bottomY - h0px}
        width={w0px}
        height={h0px}
        className="fill-none stroke-muted"
        strokeDasharray="4 3"
        strokeWidth={1}
      />
      {/* after (solid) */}
      <rect x={cx - w1px / 2} y={bottomY - h1px} width={w1px} height={h1px} className="fill-accent-soft stroke-accent" strokeWidth={1.5} />
      <ForceArrowDown x={cx} y={12} len={16} />
      <DimV y1={bottomY - h0px} y2={bottomY} x={cx - w0px / 2 - 14} label={slab ? "h0" : "h0"} />
      <DimV y1={bottomY - h1px} y2={bottomY} x={cx + w1px / 2 + 14} label="h1" left={false} />
      <DimH x1={cx - w0px / 2} x2={cx + w0px / 2} y={bottomY - h0px - 8} label={slab ? "w0" : "d0"} />
      <CenterLabel x={cx} y={bottomY + 24} text={slab ? "فشردن تیغه (کرنش مسطح)" : "فشردن استوانه بین دو سندان تخت"} className="fill-muted" />
    </IllustrationFrame>
  );
}

/** forging.closedDie — projected area clamped between two die halves, with a flash line. */
export function ClosedDieIllustration({ values }: { values: Record<string, string> }) {
  const area = num(values, "projectedArea", 2000);
  const halfWidth = Math.min(120, Math.max(40, Math.sqrt(area) * 1.4));
  const cx = 160;
  const partTop = 90;
  const partBottom = 130;

  return (
    <IllustrationFrame>
      <path d={`M ${cx - halfWidth - 20} 60 H ${cx + halfWidth + 20} L ${cx + halfWidth + 20} 85 H ${cx - halfWidth - 20} Z`} className="fill-surface-2 stroke-border" />
      <path
        d={`M ${cx - halfWidth - 20} 135 H ${cx + halfWidth + 20} L ${cx + halfWidth + 20} 160 H ${cx - halfWidth - 20} Z`}
        className="fill-surface-2 stroke-border"
      />
      <path
        d={`M ${cx - halfWidth} ${partTop} Q ${cx} ${partTop - 14} ${cx + halfWidth} ${partTop} L ${cx + halfWidth + 14} 110 L ${cx + halfWidth} ${partBottom} Q ${cx} ${
          partBottom + 14
        } ${cx - halfWidth} ${partBottom} L ${cx - halfWidth - 14} 110 Z`}
        className="fill-accent-soft stroke-accent"
        strokeWidth={1.5}
      />
      <line x1={cx - halfWidth - 20} y1={110} x2={cx + halfWidth + 20} y2={110} className="stroke-warn" strokeDasharray="3 2" strokeWidth={1} />
      <ForceArrowDown x={cx} y={40} len={16} />
      <DimH x1={cx - halfWidth} x2={cx + halfWidth} y={72} label="سطح تصویرشده (با پلیسه)" />
      <CenterLabel x={cx} y={178} text="فورجینگ قالب بسته — پلیسه در خط جدایش" className="fill-muted" />
    </IllustrationFrame>
  );
}

/** forging.flashDesign — close-up on the flash land at the parting line. */
export function FlashDesignIllustration({ values }: { values: Record<string, string> }) {
  const ratio = num(values, "ratio", 3);
  const sf = 8;
  const bf = Math.min(60, Math.max(16, sf * ratio * 1.2));
  const cy = 100;
  const cx = 160;

  return (
    <IllustrationFrame>
      <rect x={40} y={50} width={240} height={40} className="fill-surface-2 stroke-border" />
      <rect x={40} y={110} width={240} height={40} className="fill-surface-2 stroke-border" />
      <path d={`M 40 ${cy - sf / 2} H ${cx - bf / 2} L ${cx - bf / 2 - 20} ${cy - 20} L 40 ${cy - 20} Z`} className="fill-accent-soft stroke-accent" strokeWidth={1} />
      <rect x={cx - bf / 2} y={cy - sf / 2} width={bf} height={sf} className="fill-accent-soft stroke-accent" strokeWidth={1.5} />
      <path d={`M 280 ${cy - sf / 2} H ${cx + bf / 2} L ${cx + bf / 2 + 20} ${cy - 20} L 280 ${cy - 20} Z`} className="fill-accent-soft stroke-accent" strokeWidth={1} />
      <DimV y1={cy - sf / 2} y2={cy + sf / 2} x={cx + bf / 2 + 16} label="sf" left={false} />
      <DimH x1={cx - bf / 2} x2={cx + bf / 2} y={cy + sf / 2 + 14} label="bf" above={false} />
      <CenterLabel x={cx} y={30} text="طراحی زمین پلیسه (flash land)" className="fill-muted" />
    </IllustrationFrame>
  );
}

/** forging.billet — a round bar billet sized for one forging cycle. */
export function BilletIllustration({ values }: { values: Record<string, string> }) {
  const barDia = num(values, "barDiameter", 40);
  const rx = Math.min(24, Math.max(10, barDia / 3));
  const length = 140;
  const cx = 90;
  const cy = 100;

  return (
    <IllustrationFrame>
      <rect x={cx - length / 2} y={cy - rx} width={length} height={rx * 2} rx={rx} className="fill-accent-soft stroke-accent" strokeWidth={1.5} />
      <ellipse cx={cx - length / 2} cy={cy} rx={rx * 0.35} ry={rx} className="fill-surface stroke-accent" strokeWidth={1} />
      <DimH x1={cx - length / 2} x2={cx + length / 2} y={cy + rx + 16} label="طول بیلت" above={false} />
      <DimV y1={cy - rx} y2={cy + rx} x={cx - length / 2 - 14} label="قطر" />
      <path d="M 230 100 L 270 100" className="stroke-muted" strokeWidth={1.5} markerEnd="url(#arrow)" />
      <defs>
        <marker id="arrow" markerWidth={8} markerHeight={8} refX={6} refY={3} orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" className="fill-muted" />
        </marker>
      </defs>
      <path d="M 275 82 L 300 82 Q 308 82 308 90 L 308 110 Q 308 118 300 118 L 275 118 Z" className="fill-surface-2 stroke-border" />
      <CenterLabel x={292} y={100} text="قطعه" className="fill-muted" />
    </IllustrationFrame>
  );
}

/** rolling.pass / maxDraft / schedule — flat strip drawn through two work rolls. */
export function RollingPassIllustration({ values }: { values: Record<string, string> }) {
  const t0 = num(values, "t0", 10);
  const t1 = num(values, "t1", 7);
  const R = num(values, "R", 150);
  const rollR = Math.min(46, Math.max(26, R / 4));
  const scale = 4;
  const t0px = t0 * scale;
  const t1px = Math.min(t0px - 4, t1 * scale);
  const cx = 160;
  const cy = 100;

  return (
    <IllustrationFrame>
      <circle cx={cx - 34} cy={cy - t1px / 2 - rollR + 4} r={rollR} className="fill-surface-2 stroke-border" strokeWidth={1.5} />
      <circle cx={cx - 34} cy={cy + t1px / 2 + rollR - 4} r={rollR} className="fill-surface-2 stroke-border" strokeWidth={1.5} />
      <path
        d={`M 40 ${cy - t0px / 2} H ${cx - 34} L ${cx + 60} ${cy - t1px / 2} H 280 V ${cy + t1px / 2} H ${cx + 60} L ${cx - 34} ${cy + t0px / 2} H 40 Z`}
        className="fill-accent-soft stroke-accent"
        strokeWidth={1.5}
      />
      <DimV y1={cy - t0px / 2} y2={cy + t0px / 2} x={30} label="t0" />
      <DimV y1={cy - t1px / 2} y2={cy + t1px / 2} x={290} label="t1" left={false} />
      <CenterLabel x={cx} y={172} text="پاس نورد تخت بین دو غلتک" className="fill-muted" />
    </IllustrationFrame>
  );
}

/** extrusion.pressure / byConstant — ram pushing a billet through a die to a smaller product. */
export function ExtrusionIllustration({ values }: { values: Record<string, string> }) {
  const D0 = num(values, "D0", Math.sqrt(num(values, "A0", 2500)));
  const Df = num(values, "Df", Math.sqrt(num(values, "Af", 700)));
  const rD0 = Math.min(56, Math.max(24, D0 * 0.9));
  const rDf = Math.min(rD0 - 6, Math.max(6, Df * 0.9));
  const cy = 100;

  return (
    <IllustrationFrame>
      <rect x={40} y={cy - rD0} width={130} height={rD0 * 2} className="fill-accent-soft stroke-accent" strokeWidth={1.5} />
      <rect x={30} y={cy - rD0 * 0.5} width={14} height={rD0} className="fill-muted stroke-border" />
      <path d={`M 170 ${cy - rD0} L 200 ${cy - rDf} H 230 V ${cy + rDf} H 200 L 170 ${cy + rD0} Z`} className="fill-surface-2 stroke-border" strokeWidth={1.5} />
      <rect x={230} y={cy - rDf} width={60} height={rDf * 2} className="fill-accent-soft stroke-accent" strokeWidth={1.5} />
      <DimV y1={cy - rD0} y2={cy + rD0} x={62} label="D0" />
      <DimV y1={cy - rDf} y2={cy + rDf} x={260} label="Df" left={false} />
      <CenterLabel x={160} y={178} text="اکستروژن مستقیم بیلت از میان قالب" className="fill-muted" />
    </IllustrationFrame>
  );
}

/** drawing.wire / schedule / maxReduction — wire pulled through a conical die. */
export function WireDrawIllustration({ values }: { values: Record<string, string> }) {
  const D0 = num(values, "D0", 6);
  const Df = num(values, "Df", num(values, "DFinal", 4.5));
  const alpha = num(values, "alpha", 12);
  const rD0 = Math.min(30, Math.max(10, D0 * 3));
  const rDf = Math.min(rD0 - 4, Math.max(3, Df * 3));
  const cy = 100;

  return (
    <IllustrationFrame>
      <rect x={30} y={cy - rD0} width={90} height={rD0 * 2} className="fill-accent-soft stroke-accent" strokeWidth={1.5} />
      <path d={`M 120 ${cy - rD0} L 190 ${cy - rDf} H 220 L 220 ${cy + rDf} H 190 L 120 ${cy + rD0} Z`} className="fill-surface-2 stroke-border" strokeWidth={1.5} />
      <rect x={220} y={cy - rDf} width={70} height={rDf * 2} className="fill-accent-soft stroke-accent" strokeWidth={1.5} />
      <path d={`M 120 ${cy - rD0} L 190 ${cy - rDf}`} className="stroke-warn" strokeWidth={1} strokeDasharray="3 2" />
      <path d={`M 130 ${cy - rD0} Q 140 ${cy - rD0} 145 ${cy - rD0 + 12}`} className="stroke-muted fill-none" strokeWidth={1} />
      <text x={148} y={cy - rD0 + 20} className="fill-muted" style={{ fontSize: 9 }}>
        α≈{alpha.toFixed(0)}°
      </text>
      <DimV y1={cy - rD0} y2={cy + rD0} x={20} label="D0" />
      <DimV y1={cy - rDf} y2={cy + rDf} x={300} label="Df" left={false} />
      <CenterLabel x={160} y={178} text="کشش مفتول/میله از قالب مخروطی" className="fill-muted" />
    </IllustrationFrame>
  );
}
