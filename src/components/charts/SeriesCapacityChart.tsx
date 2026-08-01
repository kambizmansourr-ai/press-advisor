"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { allSeriesCoverage } from "@/rules/engine";

export function SeriesCapacityChart() {
  const data = allSeriesCoverage().map((c) => ({
    name: c.series.code,
    base: c.minForce,
    range: c.maxForce - c.minForce,
    min: c.minForce,
    max: c.maxForce,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted)" }} unit=" kgf" />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "var(--foreground)" }} width={70} />
        <Tooltip
          contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
          formatter={(_value, name, item) => {
            if (name === "base") return ["", ""];
            const p = item.payload as { min: number; max: number };
            return [`${p.min.toLocaleString()} – ${p.max.toLocaleString()} kgf`, "بازه ظرفیت"];
          }}
        />
        <Bar dataKey="base" stackId="a" fill="transparent" />
        <Bar dataKey="range" stackId="a" fill="var(--accent)" radius={[4, 4, 4, 4]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
