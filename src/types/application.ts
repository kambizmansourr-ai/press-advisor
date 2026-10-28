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
  descriptionEn: string;
  howItWorksFa: string;
  howItWorksEn: string;
  industriesFa: string[];
  industriesEn: string[];
  samplePartsFa: string[];
  samplePartsEn: string[];
  advantagesFa: string[];
  advantagesEn: string[];
  limitationsFa: string[];
  limitationsEn: string[];
  safetyNotesFa: string[];
  safetyNotesEn: string[];
  /** ids of press series suited to this application, ordered by fit */
  recommendedSeriesIds: string[];
  /** which calculator (if any) estimates required force for this application */
  forceCalculator?: "punching" | "bending" | "pressFit" | "riveting" | "coining" | null;
  strokeGuidanceFa: string;
  strokeGuidanceEn: string;
  confidenceNoteFa?: string;
  confidenceNoteEn?: string;
}
