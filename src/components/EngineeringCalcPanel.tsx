"use client";

import { useMemo, useState } from "react";
import type { EngineField, EngineModule, EngineResult } from "@/calculators/engineModule";
import { getCalcRef } from "@/data/calcReference";
import { cn } from "@/lib/utils";
import { BookOpen } from "lucide-react";

// static translations for the handful of plain enum fields not backed by a data table
const ENUM_LABELS: Record<string, string> = {
  direct: "مستقیم",
  indirect: "غیرمستقیم",
  wire: "مفتول",
  rod: "میله",
  blanking: "بلانکینگ",
  punching: "پانچینگ",
  perpendicular: "عمود بر نورد",
  parallel: "موازی نورد",
  metric: "متریک",
  imperial: "امپریال",
  round: "گرد",
  rect: "مستطیلی",
  custom: "سفارشی",
  plate: "صفحه‌ای",
  cylinder: "استوانه‌ای",
};

/**
 * Vendored modules' `fa` labels/warnings use "آهنگری" and "فنجان" — the
 * project's preferred terms are the transliterated technical ones
 * ("فورجینگ", "کاپ"). The vendored .js files are kept byte-identical to
 * their tested source, so the substitution happens here at render time.
 */
function fixTerm(text: string): string {
  return text.replace(/آهنگری/g, "فورجینگ").replace(/فنجان/g, "کاپ");
}

function optionLabel(module: EngineModule, optionKey: string): string {
  if (ENUM_LABELS[optionKey]) return ENUM_LABELS[optionKey];
  for (const table of Object.values(module.data)) {
    if (Array.isArray(table)) continue;
    const entry = (table as Record<string, { fa?: string }>)[optionKey];
    if (entry?.fa) return fixTerm(entry.fa);
  }
  return optionKey;
}

/** first data table in the module whose entries carry both K and n (flow-curve constants) */
function findMaterialPresetTable(module: EngineModule): Record<string, { fa: string; K: number; n: number }> | null {
  for (const table of Object.values(module.data)) {
    if (Array.isArray(table)) continue;
    const first = Object.values(table)[0] as { K?: number; n?: number } | undefined;
    if (first && typeof first.K === "number" && typeof first.n === "number") {
      return table as Record<string, { fa: string; K: number; n: number }>;
    }
  }
  return null;
}

/**
 * Locate a calc function by key. UI.groups[].key does not always equal the
 * namespace it lives under (e.g. injectionMolding's "machineSizing" group mixes
 * geometry.projectedArea, machine.tonnage, and a bare top-level function) — so
 * resolution tries the fast path first, then falls back to a module-wide search.
 */
function resolveCalcFn(
  module: EngineModule,
  groupKey: string,
  calcKey: string
): ((input: Record<string, unknown>) => EngineResult) | null {
  const m = module as unknown as Record<string, unknown>;
  const direct = (m[groupKey] as Record<string, unknown> | undefined)?.[calcKey];
  if (typeof direct === "function") return direct as (input: Record<string, unknown>) => EngineResult;

  if (typeof m[calcKey] === "function") return m[calcKey] as (input: Record<string, unknown>) => EngineResult;

  for (const ns of Object.values(m)) {
    if (ns && typeof ns === "object" && typeof (ns as Record<string, unknown>)[calcKey] === "function") {
      return (ns as Record<string, unknown>)[calcKey] as (input: Record<string, unknown>) => EngineResult;
    }
  }
  return null;
}

function formatValue(v: unknown): string {
  if (v == null) return "—";
  if (Array.isArray(v)) return v.map((x) => formatValue(x)).join(" – ");
  if (typeof v === "boolean") return v ? "بله" : "خیر";
  if (typeof v === "number") {
    if (!Number.isFinite(v)) return "—";
    const abs = Math.abs(v);
    const decimals = abs >= 100 ? 1 : abs >= 1 ? 2 : 4;
    return v.toLocaleString("fa-IR", { maximumFractionDigits: decimals });
  }
  return String(v);
}

/**
 * Some "complete/wrapper" calculators (e.g. injectionMolding's
 * moldingDataCalculator, sheetForming's cutting.operation) nest their headline
 * numbers under a `summary` object instead of the result's top level — and a
 * few keys (e.g. "ltRatio") exist at BOTH: the flat number in `.summary`, and
 * an entire nested sub-result object of the same name at the top level.
 * `.summary` is always the intended flat/public value, so it must win.
 */
function getOutputValue(data: EngineResult, key: string): unknown {
  const summary = data.summary as Record<string, unknown> | undefined;
  if (summary && key in summary) return summary[key];
  if (key in data) return data[key];
  return undefined;
}

export function EngineeringCalcPanel({ module, moduleKey }: { module: EngineModule; moduleKey: string }) {
  const groups = module.UI.groups;
  const [groupKey, setGroupKey] = useState(groups[0].key);
  const group = useMemo(() => groups.find((g) => g.key === groupKey)!, [groups, groupKey]);
  const [calcKey, setCalcKey] = useState(group.calcs[0].key);
  const calc = useMemo(() => group.calcs.find((c) => c.key === calcKey) ?? group.calcs[0], [group, calcKey]);
  const calcRef = useMemo(() => getCalcRef(moduleKey, groupKey, calcKey), [moduleKey, groupKey, calcKey]);

  const [values, setValues] = useState<Record<string, string>>({});

  const presetTable = useMemo(() => findMaterialPresetTable(module), [module]);
  const hasBareKN = calc.fields.some((f) => f.key === "K") && calc.fields.some((f) => f.key === "n");
  const fieldsGridCols = calc.fields.length > 8 ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1 sm:grid-cols-2";

  const selectGroup = (nextKey: string) => {
    const g = groups.find((x) => x.key === nextKey)!;
    setGroupKey(nextKey);
    setCalcKey(g.calcs[0].key);
    setValues({});
  };
  const selectCalc = (nextKey: string) => {
    setCalcKey(nextKey);
    setValues({});
  };

  const setField = (key: string, v: string) => setValues((prev) => ({ ...prev, [key]: v }));

  const applyMaterialPreset = (materialKey: string) => {
    if (!presetTable) return;
    const m = presetTable[materialKey];
    if (!m) return;
    setValues((prev) => ({ ...prev, K: String(m.K), n: String(m.n) }));
  };

  const result: { data: EngineResult | null; error: string | null } = useMemo(() => {
    const input: Record<string, string | number> = {};
    for (const f of calc.fields) {
      const raw = values[f.key];
      if (raw === undefined || raw === "") continue;
      input[f.key] = f.unit === "select" ? raw : Number(raw);
    }
    const fn = resolveCalcFn(module, groupKey, calcKey);
    if (!fn) return { data: null, error: `تابع محاسبه «${calcKey}» یافت نشد` };
    try {
      return { data: fn(input), error: null };
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : String(e) };
    }
  }, [module, groupKey, calcKey, calc, values]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap gap-2">
          {groups.map((g) => (
            <button
              key={g.key}
              onClick={() => selectGroup(g.key)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                groupKey === g.key ? "bg-accent text-white" : "bg-surface-2 text-muted hover:text-foreground"
              )}
            >
              {fixTerm(g.fa)}
            </button>
          ))}
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">نوع محاسبه</span>
          <select
            value={calcKey}
            onChange={(e) => selectCalc(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          >
            {group.calcs.map((c) => (
              <option key={c.key} value={c.key}>
                {fixTerm(c.fa)}
              </option>
            ))}
          </select>
        </label>

        {calcRef && (
          <div className="flex gap-2 rounded-lg border border-border bg-surface-2 p-3">
            <BookOpen size={14} className="mt-0.5 shrink-0 text-accent" />
            <div className="text-xs">
              <p className="text-muted">{calcRef.useCase}</p>
              {calcRef.formula && (
                <p className="mt-1 rounded bg-surface/70 px-2 py-1 font-mono text-[11px] leading-relaxed" dir="ltr">
                  {calcRef.formula}
                </p>
              )}
            </div>
          </div>
        )}

        {hasBareKN && presetTable && (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">پیش‌فرض K و n از جدول مواد (اختیاری)</span>
            <select
              onChange={(e) => e.target.value && applyMaterialPreset(e.target.value)}
              defaultValue=""
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm"
            >
              <option value="">— انتخاب ماده —</option>
              {Object.entries(presetTable).map(([key, m]) => (
                <option key={key} value={key}>
                  {fixTerm(m.fa)} (K={m.K}, n={m.n})
                </option>
              ))}
            </select>
          </label>
        )}

        <div className={cn("grid gap-3", fieldsGridCols)}>
          {calc.fields.map((f: EngineField) => (
            <FieldInput key={f.key} module={module} field={f} value={values[f.key] ?? ""} onChange={(v) => setField(f.key, v)} />
          ))}
        </div>
      </div>

      <div className="min-w-0 rounded-lg border border-accent/30 bg-accent-soft p-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto thin-scroll">
        {result.error && (
          <div className="rounded-md bg-danger-soft p-3 text-xs text-danger">
            ورودی نامعتبر / محاسبه ناموفق: {result.error}
          </div>
        )}

        {!result.error && result.data && (
          <>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {calc.outputs.map((key) => {
                const label = module.UI.labels[key];
                const value = getOutputValue(result.data!, key);
                return (
                  <div key={key} className="rounded-md bg-surface/60 px-2.5 py-2">
                    <div className="text-[10px] text-muted">{label?.fa ? fixTerm(label.fa) : key}</div>
                    <div className="text-sm font-bold break-words">
                      {formatValue(value)}
                      {label?.unit && label.unit !== "—" ? ` ${label.unit}` : ""}
                    </div>
                  </div>
                );
              })}
            </div>

            {result.data.steps && result.data.steps.length > 0 && (
              <div className="mt-3 space-y-1.5 border-t border-border/60 pt-3">
                {result.data.steps.map((s, i) => (
                  <div key={i} className="flex flex-wrap items-baseline justify-between gap-x-2 text-[11px]">
                    <span className="text-muted">
                      {fixTerm(s.label)} <span className="text-muted/70">({s.expr})</span>
                    </span>
                    <span className="shrink-0 font-medium">
                      {formatValue(s.value)} {s.unit !== "—" ? s.unit : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {result.data.warnings.length > 0 && (
              <ul className="mt-3 space-y-1 border-t border-border/60 pt-3">
                {result.data.warnings.map((w, i) => (
                  <li key={i} className="text-[11px] text-warn">
                    ⚠ {fixTerm(w)}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {!result.error && !result.data && (
          <p className="text-sm text-muted">مقادیر ورودی را وارد کنید تا نتیجه محاسبه نمایش داده شود.</p>
        )}
      </div>
    </div>
  );
}

function FieldInput({
  module,
  field,
  value,
  onChange,
}: {
  module: EngineModule;
  field: EngineField;
  value: string;
  onChange: (v: string) => void;
}) {
  if (field.unit === "select") {
    return (
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">{fixTerm(field.fa)}</span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="">—</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {optionLabel(module, opt)}
            </option>
          ))}
        </select>
      </label>
    );
  }
  return (
    <label className="block">
      <span className="mb-1 flex justify-between text-xs font-medium text-muted">
        <span>{fixTerm(field.fa)}</span>
        <span>{field.unit !== "—" ? field.unit : ""}</span>
      </span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
      />
    </label>
  );
}
