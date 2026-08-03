import type { ReactElement } from "react";
import { CenterLabel, IllustrationFrame } from "./primitives";

const RHOMBUS_ANGLE: Record<string, number> = { C: 80, D: 55, E: 75, M: 86, V: 35 };
const PARALLELOGRAM_ANGLE: Record<string, number> = { A: 85, B: 82, K: 55 };
const REGULAR_POLYGON_SIDES: Record<string, number> = { S: 4, T: 3, H: 6, O: 8, P: 5 };

function polygonPoints(cx: number, cy: number, r: number, sides: number, rotationDeg = 0): string {
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const a = ((360 / sides) * i + rotationDeg) * (Math.PI / 180);
    pts.push(`${cx + r * Math.sin(a)},${cy - r * Math.cos(a)}`);
  }
  return pts.join(" ");
}

function rhombusPoints(cx: number, cy: number, r: number, pointAngleDeg: number): string {
  const half = (pointAngleDeg / 2) * (Math.PI / 180);
  const dx = r * Math.sin(half);
  const dy = r * Math.cos(half);
  return `${cx},${cy - r} ${cx + dx},${cy - (r - dy)} ${cx},${cy + r} ${cx - dx},${cy - (r - dy)}`;
}

function parallelogramPoints(cx: number, cy: number, w: number, h: number, angleDeg: number): string {
  const skew = h / Math.tan((angleDeg * Math.PI) / 180);
  return `${cx - w / 2 - skew / 2},${cy - h / 2} ${cx + w / 2 - skew / 2},${cy - h / 2} ${cx + w / 2 + skew / 2},${cy + h / 2} ${cx - w / 2 + skew / 2},${cy + h / 2}`;
}

/** Live-ish (parametrized by shape code) schematic of the insert's top-view outline. */
export function InsertShapeIllustration({ shapeCode }: { shapeCode: string }) {
  const cx = 160;
  const cy = 95;
  const r = 55;

  let shapeEl: ReactElement;
  if (shapeCode === "R") {
    shapeEl = <circle cx={cx} cy={cy} r={r} className="fill-accent-soft stroke-accent" strokeWidth={2} />;
  } else if (shapeCode === "L") {
    shapeEl = <rect x={cx - r * 1.3} y={cy - r * 0.55} width={r * 2.6} height={r * 1.1} className="fill-accent-soft stroke-accent" strokeWidth={2} />;
  } else if (shapeCode === "W") {
    // trigon: rounded-triangle approximation using a triangle with heavily rounded corners
    shapeEl = (
      <polygon
        points={polygonPoints(cx, cy, r, 3)}
        className="fill-accent-soft stroke-accent"
        strokeWidth={2}
        strokeLinejoin="round"
        transform={`rotate(60 ${cx} ${cy})`}
      />
    );
  } else if (shapeCode in REGULAR_POLYGON_SIDES) {
    const sides = REGULAR_POLYGON_SIDES[shapeCode];
    const rotation = shapeCode === "S" ? 45 : 0;
    shapeEl = <polygon points={polygonPoints(cx, cy, r, sides, rotation)} className="fill-accent-soft stroke-accent" strokeWidth={2} strokeLinejoin="round" />;
  } else if (shapeCode in RHOMBUS_ANGLE) {
    shapeEl = <polygon points={rhombusPoints(cx, cy, r, RHOMBUS_ANGLE[shapeCode])} className="fill-accent-soft stroke-accent" strokeWidth={2} strokeLinejoin="round" />;
  } else if (shapeCode in PARALLELOGRAM_ANGLE) {
    shapeEl = (
      <polygon
        points={parallelogramPoints(cx, cy, r * 1.5, r * 1.1, PARALLELOGRAM_ANGLE[shapeCode])}
        className="fill-accent-soft stroke-accent"
        strokeWidth={2}
        strokeLinejoin="round"
      />
    );
  } else {
    shapeEl = <polygon points={polygonPoints(cx, cy, r, 4, 45)} className="fill-accent-soft stroke-accent" strokeWidth={2} strokeLinejoin="round" />;
  }

  return (
    <IllustrationFrame>
      {shapeEl}
      <circle cx={cx} cy={cy} r={4} className="fill-surface stroke-border" strokeWidth={1} />
      <CenterLabel x={cx} y={178} text={`نمای بالای اینسرت — کد شکل ${shapeCode}`} className="fill-muted" />
    </IllustrationFrame>
  );
}
