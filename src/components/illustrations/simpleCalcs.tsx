import { CenterLabel, DimH, DimV, ForceArrowDown, IllustrationFrame } from "./primitives";

export function PunchingIllustration({ shape, diameter, length, width, thickness }: { shape: "circle" | "rectangle"; diameter: number; length: number; width: number; thickness: number }) {
  const tpx = Math.min(30, Math.max(8, thickness * 8));
  const sizePx = shape === "circle" ? Math.min(70, Math.max(20, diameter * 1.6)) : Math.min(70, Math.max(20, ((length + width) / 2) * 1.2));
  const cx = 160;
  const sheetY = 100;

  return (
    <IllustrationFrame>
      <rect x={40} y={sheetY - tpx / 2} width={240} height={tpx} className="fill-surface-2 stroke-border" strokeWidth={1} />
      {shape === "circle" ? (
        <circle cx={cx} cy={62} r={sizePx / 2} className="fill-accent-soft stroke-accent" strokeWidth={1.5} />
      ) : (
        <rect x={cx - sizePx / 2} y={30} width={sizePx} height={64} className="fill-accent-soft stroke-accent" strokeWidth={1.5} />
      )}
      <ForceArrowDown x={cx} y={6} len={10} />
      <DimV y1={sheetY - tpx / 2} y2={sheetY + tpx / 2} x={30} label="t" />
      <DimH x1={cx - sizePx / 2} x2={cx + sizePx / 2} y={sheetY - tpx / 2 - 10} label={shape === "circle" ? "قطر" : "طول×عرض"} />
      <CenterLabel x={160} y={186} text="پانچ یا بلانکینگ یک شکل از ورق" className="fill-muted" />
    </IllustrationFrame>
  );
}

export function BendingIllustration({ bendLength, thickness }: { bendLength: number; thickness: number }) {
  const t = Math.min(14, Math.max(4, thickness * 3));
  const cx = 160;
  const apex = 130;

  return (
    <IllustrationFrame>
      <path d="M 90 170 L 160 100 L 230 170" className="fill-none stroke-border" strokeWidth={10} strokeLinejoin="round" />
      <path
        d={`M 70 40 L ${cx} ${apex} L 250 40 L ${250 - t * 1.6} 40 L ${cx} ${apex - t * 1.6} L ${70 + t * 1.6} 40 Z`}
        className="fill-accent-soft stroke-accent"
        strokeWidth={1.5}
      />
      <ForceArrowDown x={cx} y={16} len={16} />
      <DimH x1={70} x2={250} y={26} label={`طول خم ${bendLength ? bendLength.toFixed(0) + " mm" : ""}`} />
      <CenterLabel x={160} y={186} text="خم V تک‌مرحله‌ای در پرس" className="fill-muted" />
    </IllustrationFrame>
  );
}

export function PressFitIllustration({ shaft, hub, contactLength }: { shaft: number; hub: number; contactLength: number }) {
  const rShaft = Math.min(50, Math.max(14, shaft * 1.2));
  const rHub = Math.min(80, Math.max(rShaft + 14, hub * 0.9));
  const lenPx = Math.min(140, Math.max(40, contactLength * 3));
  const cx = 160;
  const cy = 100;

  return (
    <IllustrationFrame>
      <rect x={cx - lenPx / 2} y={cy - rHub} width={lenPx} height={rHub * 2} rx={6} className="fill-surface-2 stroke-border" strokeWidth={1.5} />
      <rect x={cx - lenPx / 2 - 10} y={cy - rShaft} width={lenPx + 20} height={rShaft * 2} rx={rShaft * 0.3} className="fill-accent-soft stroke-accent" strokeWidth={1.5} />
      <DimV y1={cy - rShaft} y2={cy + rShaft} x={cx - lenPx / 2 - 26} label="شفت" />
      <DimV y1={cy - rHub} y2={cy + rHub} x={cx + lenPx / 2 + 26} label="میزبان" left={false} />
      <DimH x1={cx - lenPx / 2} x2={cx + lenPx / 2} y={cy + rHub + 16} label="طول تماس" above={false} />
      <CenterLabel x={160} y={30} text="جای‌گذاری فشاری شفت داخل سوراخ میزبان" className="fill-muted" />
    </IllustrationFrame>
  );
}

export function RivetingIllustration({ diameter }: { diameter: number }) {
  const shankR = Math.min(16, Math.max(5, diameter * 1.5));
  const headR = shankR * 1.8;
  const cx = 160;
  const plateY = 110;

  return (
    <IllustrationFrame>
      <rect x={60} y={plateY} width={200} height={16} className="fill-surface-2 stroke-border" strokeWidth={1} />
      <rect x={60} y={plateY + 16} width={200} height={16} className="fill-surface-2 stroke-border" strokeWidth={1} />
      <rect x={cx - shankR} y={70} width={shankR * 2} height={plateY - 70} className="fill-accent-soft stroke-accent" strokeWidth={1.5} />
      <path d={`M ${cx - headR} 70 Q ${cx} 50 ${cx + headR} 70 Z`} className="fill-accent-soft stroke-accent" strokeWidth={1.5} />
      <path d={`M ${cx - headR} ${plateY + 32} Q ${cx} ${plateY + 52} ${cx + headR} ${plateY + 32} Z`} className="fill-accent-soft stroke-accent" strokeWidth={1.5} />
      <ForceArrowDown x={cx} y={20} len={14} />
      <DimH x1={cx - shankR} x2={cx + shankR} y={plateY + 66} label="قطر پرچ" above={false} />
      <CenterLabel x={160} y={186} text="فرم‌دهی سرد سر پرچ برای اتصال دو ورق" className="fill-muted" />
    </IllustrationFrame>
  );
}

export function CoiningIllustration({ area }: { area: number }) {
  const halfW = Math.min(80, Math.max(24, Math.sqrt(area) * 1.4));
  const cx = 160;

  return (
    <IllustrationFrame>
      <rect x={cx - halfW - 10} y={90} width={halfW * 2 + 20} height={20} className="fill-surface-2 stroke-border" strokeWidth={1} />
      <path d={`M ${cx - halfW} 60 H ${cx + halfW} L ${cx + halfW} 84 Q ${cx} 74 ${cx - halfW} 84 Z`} className="fill-accent-soft stroke-accent" strokeWidth={1.5} />
      <ForceArrowDown x={cx} y={20} len={20} />
      <DimH x1={cx - halfW} x2={cx + halfW} y={44} label="سطح تصویرشده نقش" />
      <CenterLabel x={160} y={186} text="حکاکی کم‌عمق سطحی (کوینینگ/امباس)" className="fill-muted" />
    </IllustrationFrame>
  );
}
