export type ApplicationCategory =
  | "assembly" // پرس‌فیت / مونتاژ
  | "cutting" // پانچ / برش
  | "forming" // خم / امباس / کوینینگ
  | "joining" // پرچ / استیکینگ
  | "craft"; // طلاسازی / چرم / صنایع دستی

export interface Application {
  id: string;
  nameFa: string;
  nameEn: string;
  category: ApplicationCategory;
  descriptionFa: string;
  howItWorksFa: string;
  industriesFa: string[];
  samplePartsFa: string[];
  advantagesFa: string[];
  limitationsFa: string[];
  safetyNotesFa: string[];
  /** ids of press series suited to this application, ordered by fit */
  recommendedSeriesIds: string[];
  /** which calculator (if any) estimates required force for this application */
  forceCalculator?: "punching" | "bending" | "pressFit" | "riveting" | "coining" | null;
  strokeGuidanceFa: string;
  confidenceNoteFa?: string;
}
