// Loose ambient typing for the vendored bulkForming.js calculation engine.
// The module is intentionally left dynamically-typed (`any`) — it's a
// self-contained, independently-tested calculation library (see
// bulkForming.test.js) driven generically via its own UI metadata
// (BulkForming.UI.groups) rather than hand-typed per function.

export interface BulkFormingStep {
  label: string;
  expr: string;
  value: number;
  unit: string;
}

export interface BulkFormingResult {
  [key: string]: unknown;
  warnings: string[];
  steps?: BulkFormingStep[];
}

export interface BulkFormingField {
  key: string;
  fa: string;
  en: string;
  unit: string;
  options?: string[];
}

export interface BulkFormingCalcMeta {
  key: string;
  fa: string;
  en: string;
  fields: BulkFormingField[];
  outputs: string[];
}

export interface BulkFormingGroup {
  key: string;
  fa: string;
  en: string;
  calcs: BulkFormingCalcMeta[];
}

export interface BulkFormingLabel {
  fa: string;
  en: string;
  unit: string;
}

export interface BulkFormingModule {
  version: string;
  core: Record<string, (...args: unknown[]) => unknown>;
  forging: Record<string, (input: Record<string, unknown>) => BulkFormingResult>;
  rolling: Record<string, (input: Record<string, unknown>) => BulkFormingResult>;
  extrusion: Record<string, (input: Record<string, unknown>) => BulkFormingResult>;
  drawing: Record<string, (input: Record<string, unknown>) => BulkFormingResult>;
  units: Record<string, (x: number) => number>;
  UI: {
    groups: BulkFormingGroup[];
    labels: Record<string, BulkFormingLabel>;
  };
  data: {
    MATERIALS_COLD: Record<string, { fa: string; en: string; K: number; n: number }>;
    MATERIALS_HOT: Record<string, { fa: string; en: string; T: number; C: number; m: number }>;
    PHYSICAL: Record<string, { fa: string; en: string; rho: number; cp: number; Tm: number; E: number; nu: number }>;
    EXTRUSION_CONSTANT: Record<string, { fa: string; en: string; T: string; Ke: number }>;
    FRICTION: Record<string, { fa: string; en: string; mu?: number }>;
    EFFICIENCY: Record<string, { fa: string; en: string; min: number; max: number; def: number }>;
    SHAPE_FACTOR_KF: Record<string, { fa: string; en: string; min: number; max: number; def: number }>;
  };
  helpers: Record<string, (...args: unknown[]) => unknown>;
}

declare const BulkForming: BulkFormingModule;
export default BulkForming;
