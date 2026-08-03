// Shared ambient shape for the vendored engineering calculation modules
// (bulkForming.js, sheetForming.js). Both are independently-tested, drop-in
// libraries with an identical structure by design — see each module's
// header comment — so the app UI can drive either one generically off its
// own UI metadata (module.UI.groups) rather than hand-typed per function.

export interface EngineStep {
  label: string;
  expr: string;
  value: number;
  unit: string;
}

export interface EngineResult {
  [key: string]: unknown;
  warnings: string[];
  steps?: EngineStep[];
}

export interface EngineField {
  key: string;
  fa: string;
  en: string;
  unit: string;
  options?: string[];
}

export interface EngineCalcMeta {
  key: string;
  fa: string;
  en: string;
  fields: EngineField[];
  outputs: string[];
}

export interface EngineGroup {
  key: string;
  fa: string;
  en: string;
  calcs: EngineCalcMeta[];
}

export interface EngineLabel {
  fa: string;
  en: string;
  unit: string;
}

export interface EngineDataEntry {
  fa?: string;
  en?: string;
  K?: number;
  n?: number;
  [key: string]: unknown;
}

export interface EngineModule {
  version: string;
  units: Record<string, (x: number) => number>;
  UI: {
    groups: EngineGroup[];
    labels: Record<string, EngineLabel>;
  };
  data: Record<string, Record<string, EngineDataEntry>>;
  helpers?: Record<string, (...args: unknown[]) => unknown>;
  // Process-group namespaces (e.g. forging/rolling/extrusion/drawing for bulk;
  // cutting/bending/drawing for sheet; geometry/machine/cooling/cavities/feed/
  // part/mold for injection molding — UI.groups[].key does not always equal a
  // namespace name 1:1, so calc functions are resolved by searching every
  // namespace, not by direct module[groupKey][calcKey] indexing).
  [processGroup: string]: unknown;
}
