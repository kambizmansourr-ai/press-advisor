"use client";

import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Legend } from "recharts";
import { PressModel } from "@/types/press";
import { pressModels } from "@/data/presses";

const COLORS = ["#0e7c86", "#b7791f", "#b3261e", "#1b7a4d", "#5b3ea6"];

function tableArea(p: PressModel): number {
  const size = p.tableSizeMm ?? p.plateSizeMm;
  if (!size) return 0;
  const parts = size.replace(/[^\dx×.]/gi, "").split(/[x×]/i).map(Number);
  if (parts.length !== 2 || parts.some(Number.isNaN)) return 0;
  return parts[0] * parts[1];
}

function maxStroke(p: PressModel): number {
  if (!p.strokeOptions?.length) return 0;
  return Math.max(...p.strokeOptions.map((s) => s.powerMm ?? 0));
}

export function CompareRadar({ presses }: { presses: PressModel[] }) {
  if (presses.length < 2) return null;

  const maxCapacity = Math.max(...pressModels.map((p) => p.capacityFullKgf));
  const maxThroat = Math.max(...pressModels.map((p) => p.throatDepthMm ?? 0));
  const maxDaylight = Math.max(...pressModels.map((p) => (p.daylightRangeMm ? p.daylightRangeMm[1] - p.daylightRangeMm[0] : 0)));
  const maxTable = Math.max(...pressModels.map(tableArea));
  const maxStrokeAll = Math.max(...pressModels.map(maxStroke)) || 1;

  const metrics = [
    { key: "capacity", label: "ظرفیت" },
    { key: "throat", label: "فاصله محور" },
    { key: "daylight", label: "بازه ارتفاع" },
    { key: "table", label: "سطح میز" },
    { key: "stroke", label: "کورس" },
  ];

  const data = metrics.map((m) => {
    const row: Record<string, string | number> = { metric: m.label };
    presses.forEach((p) => {
      let value = 0;
      if (m.key === "capacity") value = (p.capacityFullKgf / maxCapacity) * 100;
      if (m.key === "throat") value = ((p.throatDepthMm ?? 0) / maxThroat) * 100;
      if (m.key === "daylight")
        value = (((p.daylightRangeMm ? p.daylightRangeMm[1] - p.daylightRangeMm[0] : 0) / maxDaylight) * 100) || 0;
      if (m.key === "table") value = (tableArea(p) / maxTable) * 100;
      if (m.key === "stroke") value = (maxStroke(p) / maxStrokeAll) * 100;
      row[p.model] = Math.round(value);
    });
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={340}>
      <RadarChart data={data}>
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "var(--foreground)" }} />
        {presses.map((p, i) => (
          <Radar
            key={p.id}
            name={p.model}
            dataKey={p.model}
            stroke={COLORS[i % COLORS.length]}
            fill={COLORS[i % COLORS.length]}
            fillOpacity={0.15}
          />
        ))}
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
