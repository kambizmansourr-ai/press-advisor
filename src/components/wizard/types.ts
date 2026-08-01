export interface WizardFormValues {
  applicationId: string;
  materialId: string;

  // punching / blanking
  shape: "circle" | "rectangle";
  diameterMm?: number;
  rectLengthMm?: number;
  rectWidthMm?: number;
  holeCount?: number;
  thicknessMm?: number;

  // bending
  bendLengthMm?: number;
  dieOpeningMm?: number;

  // press-fit
  shaftDiameterMm?: number;
  hubOuterDiameterMm?: number;
  diametralInterferenceMm?: number;
  contactLengthMm?: number;
  frictionCoefficient?: number;

  // riveting
  rivetDiameterMm?: number;

  // coining / marking
  projectedAreaMm2?: number;
  pressureFactor?: number;

  // manual override
  manualForceKgf?: number;
  useManualForce: boolean;

  // dimensional refinement (optional, applies to all calculators)
  partWidthMm?: number;
  partDepthMm?: number;
  partHeightMm?: number;
  throatNeededMm?: number;
  strokeNeededMm?: number;
  bodyPreference: "any" | "cast-iron" | "steel";
}

export const wizardDefaultValues: WizardFormValues = {
  applicationId: "",
  materialId: "s235jr",
  shape: "circle",
  diameterMm: 10,
  holeCount: 1,
  thicknessMm: 1,
  bendLengthMm: 50,
  rivetDiameterMm: 4,
  projectedAreaMm2: 100,
  shaftDiameterMm: 20,
  hubOuterDiameterMm: 40,
  diametralInterferenceMm: 0.03,
  contactLengthMm: 15,
  frictionCoefficient: 0.12,
  useManualForce: false,
  bodyPreference: "any",
};
