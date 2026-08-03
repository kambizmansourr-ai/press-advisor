// Small, reusable SVG building blocks shared by every calc illustration.
// All diagrams use a 320×200 viewBox and the app's theme colors (via
// Tailwind utility classes bound to CSS variables) so they adapt to
// light/dark mode automatically.

import type { ReactNode } from "react";

export function IllustrationFrame({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 320 200" className="h-auto w-full" style={{ direction: "ltr" }}>
      {children}
    </svg>
  );
}

export function DimH({ x1, x2, y, label, above = true }: { x1: number; x2: number; y: number; label: string; above?: boolean }) {
  const ty = above ? y - 6 : y + 13;
  return (
    <g>
      <line x1={x1} y1={y} x2={x2} y2={y} className="stroke-muted" strokeWidth={1} />
      <line x1={x1} y1={y - 4} x2={x1} y2={y + 4} className="stroke-muted" strokeWidth={1} />
      <line x1={x2} y1={y - 4} x2={x2} y2={y + 4} className="stroke-muted" strokeWidth={1} />
      <text x={(x1 + x2) / 2} y={ty} textAnchor="middle" className="fill-muted" style={{ fontSize: 9 }}>
        {label}
      </text>
    </g>
  );
}

export function DimV({ y1, y2, x, label, left = true }: { y1: number; y2: number; x: number; label: string; left?: boolean }) {
  const tx = left ? x - 6 : x + 6;
  return (
    <g>
      <line x1={x} y1={y1} x2={x} y2={y2} className="stroke-muted" strokeWidth={1} />
      <line x1={x - 4} y1={y1} x2={x + 4} y2={y1} className="stroke-muted" strokeWidth={1} />
      <line x1={x - 4} y1={y2} x2={x + 4} y2={y2} className="stroke-muted" strokeWidth={1} />
      <text
        x={tx}
        y={(y1 + y2) / 2}
        textAnchor={left ? "end" : "start"}
        dominantBaseline="middle"
        className="fill-muted"
        style={{ fontSize: 9 }}
      >
        {label}
      </text>
    </g>
  );
}

export function CenterLabel({ x, y, text, className = "fill-foreground" }: { x: number; y: number; text: string; className?: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" className={className} style={{ fontSize: 10, fontWeight: 600 }}>
      {text}
    </text>
  );
}

export function ForceArrowDown({ x, y, len = 24 }: { x: number; y: number; len?: number }) {
  return (
    <g className="stroke-accent" strokeWidth={2} fill="none">
      <line x1={x} y1={y} x2={x} y2={y + len} />
      <path d={`M ${x - 5} ${y + len - 6} L ${x} ${y + len} L ${x + 5} ${y + len - 6}`} />
    </g>
  );
}

export function ForceArrowUp({ x, y, len = 24 }: { x: number; y: number; len?: number }) {
  return (
    <g className="stroke-accent" strokeWidth={2} fill="none">
      <line x1={x} y1={y} x2={x} y2={y - len} />
      <path d={`M ${x - 5} ${y - len + 6} L ${x} ${y - len} L ${x + 5} ${y - len + 6}`} />
    </g>
  );
}

/** Parse a form field's raw string value to a finite number, or fall back. */
export function num(values: Record<string, string>, key: string, fallback: number): number {
  const raw = values[key];
  if (raw === undefined || raw === "") return fallback;
  const v = Number(raw);
  return Number.isFinite(v) && v !== 0 ? v : fallback;
}

/** Clamp a ratio so illustrations never collapse to a degenerate sliver. */
export function clampRatio(a: number, b: number, min = 0.25, max = 4): number {
  const r = a / b;
  if (!Number.isFinite(r) || r <= 0) return 1;
  return Math.min(max, Math.max(min, r));
}
