import { CenterLabel, DimH, DimV, ForceArrowDown, IllustrationFrame, num } from "./primitives";

/** cutting.operation / clearance / force / guillotine (straight punch case) — punch, sheet, die with clearance gap. */
export function PunchDieIllustration({ values }: { values: Record<string, string> }) {
  const t = num(values, "t", 2);
  const tpx = Math.min(30, Math.max(8, t * 8));
  const size = num(values, "size", 20);
  const halfW = Math.min(60, Math.max(18, size * 1.6));
  const cx = 160;
  const sheetY = 100;
  const c = 4;

  return (
    <IllustrationFrame>
      <rect x={40} y={sheetY - tpx / 2} width={240} height={tpx} className="fill-surface-2 stroke-border" strokeWidth={1} />
      <path d={`M ${cx - halfW} 30 V ${sheetY - tpx / 2 - 4} H ${cx + halfW} V 30 Z`} className="fill-accent-soft stroke-accent" strokeWidth={1.5} />
      <path
        d={`M 40 ${sheetY + tpx / 2 + 4} H ${cx - halfW - c} V 170 H ${cx + halfW + c} V ${sheetY + tpx / 2 + 4} Z`}
        className="fill-surface-2 stroke-border"
        strokeWidth={1.5}
      />
      <ForceArrowDown x={cx} y={16} len={12} />
      <DimH x1={cx - halfW} x2={cx + halfW} y={sheetY - tpx / 2 - 10} label="اندازه اسمی" />
      <DimV y1={sheetY - tpx / 2} y2={sheetY + tpx / 2} x={30} label="t" />
      <text x={cx + halfW + c + 6} y={sheetY + 3} className="fill-muted" style={{ fontSize: 9 }}>
        c
      </text>
      <CenterLabel x={cx} y={186} text="سنبه، ورق و ماتریس با لقی c بین آن‌ها" className="fill-muted" />
    </IllustrationFrame>
  );
}

/** cutting.stripLayout — repeated blanks laid out along a feed strip. */
export function StripLayoutIllustration({ values }: { values: Record<string, string> }) {
  const rows = Math.max(1, Math.min(3, Math.round(num(values, "rows", 1))));
  const cx0 = 60;
  const partH = 100 / rows;

  return (
    <IllustrationFrame>
      <rect x={30} y={40} width={260} height={120} className="fill-surface-2 stroke-border" strokeWidth={1} />
      {[0, 1, 2].map((col) =>
        Array.from({ length: rows }).map((_, r) => (
          <rect
            key={`${col}-${r}`}
            x={cx0 + col * 80}
            y={50 + r * partH}
            width={60}
            height={partH - 10}
            rx={6}
            className="fill-accent-soft stroke-accent"
            strokeWidth={1.5}
          />
        ))
      )}
      <DimH x1={cx0} x2={cx0 + 80} y={165} label="گام (pitch)" above={false} />
      <DimV y1={40} y2={160} x={18} label="عرض" />
      <CenterLabel x={160} y={186} text="چیدمان قطعات روی نوار فلزی" className="fill-muted" />
    </IllustrationFrame>
  );
}

/** cutting.guillotine — angled blade shearing a sheet edge. */
export function GuillotineIllustration({ values }: { values: Record<string, string> }) {
  const t = num(values, "t", 3);
  const tpx = Math.min(36, Math.max(10, t * 6));
  const rake = num(values, "rakeAngle_deg", 4);
  const skew = Math.min(40, Math.max(6, rake * 4));

  return (
    <IllustrationFrame>
      <rect x={40} y={100} width={240} height={tpx} className="fill-accent-soft stroke-accent" strokeWidth={1.5} />
      <path d={`M ${230 - skew} 60 L 250 60 L 220 ${100 + tpx + 20} L 200 ${100 + tpx + 20} Z`} className="fill-surface-2 stroke-border" strokeWidth={1.5} />
      <DimV y1={100} y2={100 + tpx} x={30} label="t" />
      <text x={235} y={50} textAnchor="middle" className="fill-muted" style={{ fontSize: 9 }}>
        زاویه تیغه φ≈{rake.toFixed(0)}°
      </text>
      <CenterLabel x={160} y={186} text="برش با تیغه گیوتین زاویه‌دار" className="fill-muted" />
    </IllustrationFrame>
  );
}

/** bending.allowance / force — V-die bend to a given inside radius and angle. */
export function VBendIllustration({ values }: { values: Record<string, string> }) {
  const t = Math.min(14, Math.max(4, num(values, "t", 2) * 3));
  const angle = num(values, "angle_deg", 90);
  const cx = 160;
  const apex = 130;

  return (
    <IllustrationFrame>
      {/* die (V) */}
      <path d={`M 90 170 L ${cx} 100 L 230 170`} className="fill-none stroke-border" strokeWidth={10} strokeLinejoin="round" />
      {/* bent sheet, two legs meeting at apex with thickness t */}
      <path
        d={`M 70 40 L ${cx} ${apex} L 250 40 L ${250 - t * 1.6} 40 L ${cx} ${apex - t * 1.6} L ${70 + t * 1.6} 40 Z`}
        className="fill-accent-soft stroke-accent"
        strokeWidth={1.5}
      />
      <path d={`M ${cx - 26} ${apex - 22} A 26 26 0 0 1 ${cx + 26} ${apex - 22}`} className="fill-none stroke-muted" strokeWidth={1} strokeDasharray="2 2" />
      <text x={cx} y={apex - 30} textAnchor="middle" className="fill-muted" style={{ fontSize: 9 }}>
        R, α≈{angle.toFixed(0)}°
      </text>
      <ForceArrowDown x={cx} y={16} len={16} />
      <CenterLabel x={cx} y={186} text="خم V با شعاع داخلی R و ضخامت t" className="fill-muted" />
    </IllustrationFrame>
  );
}

/** bending.springback — bent angle under load vs. sprung-back final angle. */
export function SpringbackIllustration({ values }: { values: Record<string, string> }) {
  const target = num(values, "targetAngle_deg", 90);
  const cx = 160;
  const cy = 130;
  const r = 60;
  const a1 = ((180 - target) / 2) * (Math.PI / 180);
  // exaggerated visually (real springback is only a few degrees) so the two labels don't collide
  const a2 = a1 + 22 * (Math.PI / 180);

  const p1 = { x: cx + r * Math.cos(Math.PI - a1), y: cy - r * Math.sin(Math.PI - a1) };
  const p2 = { x: cx + r * Math.cos(Math.PI - a2), y: cy - r * Math.sin(Math.PI - a2) };
  const l1 = { x: cx + (r + 14) * Math.cos(Math.PI - a1), y: cy - (r + 14) * Math.sin(Math.PI - a1) };
  const l2 = { x: cx + (r + 14) * Math.cos(Math.PI - a2), y: cy - (r + 14) * Math.sin(Math.PI - a2) };

  return (
    <IllustrationFrame>
      <line x1={cx - r} y1={cy} x2={cx} y2={cy} className="stroke-accent" strokeWidth={3} />
      <line x1={cx} y1={cy} x2={p1.x} y2={p1.y} className="stroke-accent" strokeWidth={3} strokeDasharray="5 3" />
      <line x1={cx} y1={cy} x2={p2.x} y2={p2.y} className="stroke-muted" strokeWidth={3} />
      <circle cx={cx} cy={cy} r={2} className="fill-foreground" />
      <text x={l1.x} y={l1.y} textAnchor="middle" className="fill-accent" style={{ fontSize: 9 }}>
        زیر بار
      </text>
      <text x={l2.x} y={l2.y} textAnchor="middle" className="fill-muted" style={{ fontSize: 9 }}>
        پس از برگشت فنری
      </text>
      <CenterLabel x={cx} y={186} text="زاویه زیر بار در برابر زاویه نهایی پس از برگشت فنری" className="fill-muted" />
    </IllustrationFrame>
  );
}

/** bending.designCheck — flange length and hole-to-bend distance relative to the bend line. */
export function DesignCheckIllustration({ values }: { values: Record<string, string> }) {
  const flange = Math.min(120, Math.max(40, num(values, "flangeLength", 25) * 3));
  const holeDist = Math.min(flange - 20, Math.max(14, num(values, "holeDistance", 10) * 3));
  const cx = 90;

  return (
    <IllustrationFrame>
      <path d={`M ${cx} 60 H ${cx + flange} `} className="stroke-accent fill-none" strokeWidth={10} />
      <path d={`M ${cx} 60 V 150`} className="stroke-accent fill-none" strokeWidth={10} />
      <circle cx={cx + holeDist} cy={60} r={6} className="fill-surface stroke-border" strokeWidth={1.5} />
      <line x1={cx} y1={72} x2={cx} y2={150} className="stroke-muted" strokeDasharray="3 2" strokeWidth={1} />
      <DimH x1={cx} x2={cx + flange} y={38} label="طول لبه" />
      <DimH x1={cx} x2={cx + holeDist} y={80} label="فاصله سوراخ تا خم" above={false} />
      <CenterLabel x={160} y={186} text="حداقل طول لبه و فاصله سوراخ تا خط خم" className="fill-muted" />
    </IllustrationFrame>
  );
}

/** drawing.blankDiameter — a round blank drawn into a cylindrical cup. */
export function CupDrawIllustration({ values }: { values: Record<string, string> }) {
  const d = num(values, "d", 40);
  const h = num(values, "h", 30);
  const r = Math.min(num(values, "r", 4), d / 2 - 2);
  const scale = Math.min(3.2, 130 / Math.max(d, 1));
  const dpx = d * scale;
  const hpx = Math.min(90, h * scale);
  const rpx = Math.max(3, r * scale);
  const cx = 200;
  const bottomY = 155;
  const Dbpx = dpx * 1.5;

  return (
    <IllustrationFrame>
      <ellipse cx={80} cy={100} rx={Dbpx * 0.32} ry={Dbpx * 0.14} className="fill-none stroke-muted" strokeDasharray="4 3" strokeWidth={1} />
      <text x={80} y={100 - Dbpx * 0.14 - 8} textAnchor="middle" className="fill-muted" style={{ fontSize: 9 }}>
        Db (بلانک اولیه)
      </text>
      <path
        d={`M ${cx - dpx / 2} ${bottomY - hpx} L ${cx - dpx / 2} ${bottomY - rpx} Q ${cx - dpx / 2} ${bottomY} ${cx - dpx / 2 + rpx} ${bottomY} L ${
          cx + dpx / 2 - rpx
        } ${bottomY} Q ${cx + dpx / 2} ${bottomY} ${cx + dpx / 2} ${bottomY - rpx} L ${cx + dpx / 2} ${bottomY - hpx}`}
        className="fill-accent-soft stroke-accent"
        strokeWidth={1.5}
        fillOpacity={0.5}
      />
      <DimV y1={bottomY - hpx} y2={bottomY} x={cx - dpx / 2 - 14} label="h" />
      <DimH x1={cx - dpx / 2} x2={cx + dpx / 2} y={bottomY + 14} label="d" above={false} />
      <text x={cx + dpx / 2 + 10} y={bottomY - 4} className="fill-muted" style={{ fontSize: 9 }}>
        r
      </text>
      <CenterLabel x={160} y={30} text="کشش بلانک به یک کاپ استوانه‌ای" className="fill-muted" />
    </IllustrationFrame>
  );
}
