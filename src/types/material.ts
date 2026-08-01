export type MaterialCategory =
  | "carbon-steel"
  | "stainless-steel"
  | "aluminum"
  | "copper-alloy"
  | "titanium"
  | "thermoplastic"
  | "elastomer";

export interface Material {
  id: string;
  nameFa: string;
  nameEn: string; // e.g. "S235JR"
  stdNo: string; // e.g. "1.0037"
  standard: string; // e.g. "DIN EN 10025 (1994-03)"
  category: MaterialCategory;
  /** N/mm^2 (MPa) — as printed in the Setak tensile-strength reference table */
  tensileMinMPa: number;
  tensileMaxMPa: number;
  /** used by force calculators; shear strength approximated as 0.8 x tensile (standard sheet-metal rule of thumb) */
  shearFactor: number;
}
