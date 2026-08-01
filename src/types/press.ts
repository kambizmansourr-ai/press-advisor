// Domain types for the Aras Zanjan press knowledge base.
// All numeric fields come directly from the source catalogue (Presses-Catalogue-1.pdf).
// Fields the catalogue does not publish (weight, motor, speed) are intentionally omitted
// rather than invented — see DATA_GAPS in src/data/dataGaps.ts.

export type FrameMaterial = "cast-iron" | "steel";

export type DriveType =
  | "hand-lever" // اهرمی دستی (PAD)
  | "hand-screw" // لنگی (PH / PHn)
  | "pneumatic-direct" // پنوماتیک مستقیم (PPN)
  | "pneumatic-lever" // اهرمی پنوماتیک غیرمستقیم (PAP)
  | "hydro-pneumatic" // هیدروپنوماتیک (PHP)
  | "three-plate-pneumatic" // سه‌صفحه‌ای پنوماتیک (PSU)
  | "three-plate-hydro-pneumatic"; // سه‌صفحه‌ای هیدروپنوماتیک (PHU / ASH)

export type Actuation = "direct" | "indirect";

export interface StrokeOption {
  /** کورس آزاد (mm) — fast free-run stroke before work contact */
  freeMm?: number;
  /** کورس قدرتی (mm) — powered/working stroke */
  powerMm?: number;
}

export interface PressSeries {
  id: string;
  code: string; // PHP, PAP, PPN, PAD, PH, PHn, ASH, ASB, PSU, PHU
  nameFa: string;
  nameEn: string;
  driveType: DriveType;
  actuation: Actuation;
  descriptionFa: string;
  orderingCodePattern: string;
  exampleCode: string;
  sourcePages: number[];
  /** product photo cropped from the source catalogue, representative of this series */
  imageUrl: string;
}

export interface PressModel {
  id: string;
  seriesId: string;
  model: string; // e.g. "PHP/1800"
  frameMaterial: FrameMaterial;
  /** نیروی اولیه (kgf) — first-stage/approach force, only for two-stage hydro-pneumatic units */
  capacityInitialKgf?: number;
  /** نیروی نهایی/قدرتی (kgf) — rated full working capacity, the primary sizing figure */
  capacityFullKgf: number;
  pneumaticPressureBar?: number; // usually 6
  hydraulicPressureBar?: number; // usually 140 (ASH/ASB/PSU/PHU)
  cylinderDiameterMm?: number;
  strokeOptions?: StrokeOption[];
  /** فاصله محور سیلندر تا بدنه/گلویی — throat depth (mm) */
  throatDepthMm?: number;
  /** ابعاد میز A×B (mm) as printed */
  tableSizeMm?: string;
  /** بازه ارتفاع قابل تنظیم میز کار (mm) */
  daylightRangeMm?: [number, number];
  totalHeightMm?: number;
  plateSizeMm?: string; // for ASH/ASB/PSU/PHU three-plate die-set frames
  handleDirection?: "R" | "L" | "R or L";
  orderingCode: string;
  exampleCode: string;
  sourcePage: number;
  /** verbatim extra columns from the catalogue table not modeled above, kept for traceability */
  rawDimensionsMm?: Record<string, string | number>;
  notesFa?: string;
  /** true when a value could not be read with full confidence from the source PDF */
  lowConfidence?: boolean;
}

export interface GuideBushOption {
  code: number;
  nameFa: string;
  nameEn: string;
}
