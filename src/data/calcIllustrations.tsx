// Maps every EngineeringCalcPanel calc ("<moduleKey>" → "<groupKey>.<calcKey>",
// same keying as calcReference.ts) to a live SVG illustration that redraws
// itself from the calc's current field values.

import type { ReactElement } from "react";
import {
  BilletIllustration,
  ClosedDieIllustration,
  ExtrusionIllustration,
  FlashDesignIllustration,
  RollingPassIllustration,
  UpsetIllustration,
  WireDrawIllustration,
} from "@/components/illustrations/bulkForming";
import {
  CupDrawIllustration,
  DesignCheckIllustration,
  GuillotineIllustration,
  PunchDieIllustration,
  SpringbackIllustration,
  StripLayoutIllustration,
  VBendIllustration,
} from "@/components/illustrations/sheetForming";
import {
  CavityDimensionIllustration,
  CavityLayoutIllustration,
  CoolingChannelIllustration,
  CoolingIllustration,
  EdgeGateIllustration,
  EjectionForceIllustration,
  GateFreezeIllustration,
  MoldCavityIllustration,
  PlateDeflectionIllustration,
  RunnerSprueIllustration,
  VentingIllustration,
} from "@/components/illustrations/injectionMolding";

type IllustrationFn = (values: Record<string, string>) => ReactElement;

const bulkFormingIllustrations: Record<string, IllustrationFn> = {
  "forging.upsetCylinder": (values) => <UpsetIllustration values={values} />,
  "forging.upsetSlab": (values) => <UpsetIllustration values={values} slab />,
  "forging.closedDie": (values) => <ClosedDieIllustration values={values} />,
  "forging.flashDesign": (values) => <FlashDesignIllustration values={values} />,
  "forging.billet": (values) => <BilletIllustration values={values} />,
  "rolling.pass": (values) => <RollingPassIllustration values={values} />,
  "rolling.maxDraft": (values) => <RollingPassIllustration values={values} />,
  "rolling.schedule": (values) => <RollingPassIllustration values={values} />,
  "extrusion.pressure": (values) => <ExtrusionIllustration values={values} />,
  "extrusion.byConstant": (values) => <ExtrusionIllustration values={values} />,
  "drawing.wire": (values) => <WireDrawIllustration values={values} />,
  "drawing.schedule": (values) => <WireDrawIllustration values={values} />,
  "drawing.maxReduction": (values) => <WireDrawIllustration values={values} />,
};

const sheetFormingIllustrations: Record<string, IllustrationFn> = {
  "cutting.operation": (values) => <PunchDieIllustration values={values} />,
  "cutting.clearance": (values) => <PunchDieIllustration values={values} />,
  "cutting.force": (values) => <PunchDieIllustration values={values} />,
  "cutting.stripLayout": (values) => <StripLayoutIllustration values={values} />,
  "cutting.guillotine": (values) => <GuillotineIllustration values={values} />,
  "bending.allowance": (values) => <VBendIllustration values={values} />,
  "bending.force": (values) => <VBendIllustration values={values} />,
  "bending.springback": (values) => <SpringbackIllustration values={values} />,
  "bending.designCheck": (values) => <DesignCheckIllustration values={values} />,
  "drawing.blankDiameter": (values) => <CupDrawIllustration values={values} />,
  "drawing.feasibility": (values) => <CupDrawIllustration values={values} />,
  "drawing.force": (values) => <CupDrawIllustration values={values} />,
  "drawing.redrawPlan": (values) => <CupDrawIllustration values={values} />,
};

const injectionMoldingIllustrations: Record<string, IllustrationFn> = {
  "machineSizing.moldingDataCalculator": (values) => <MoldCavityIllustration values={values} />,
  "machineSizing.projectedArea": (values) => <MoldCavityIllustration values={values} />,
  "machineSizing.tonnage": (values) => <MoldCavityIllustration values={values} />,
  "machineSizing.injectionUnit": (values) => <MoldCavityIllustration values={values} />,
  "cooling.coolingTime": (values) => <CoolingIllustration values={values} />,
  "cooling.heatLoad": (values) => <CoolingIllustration values={values} />,
  "cooling.channels": (values) => <CoolingChannelIllustration values={values} />,
  "cavities.count": (values) => <CavityLayoutIllustration values={values} />,
  "cavities.economic": (values) => <CavityLayoutIllustration values={values} />,
  "feed.runnerDiameter": (values) => <RunnerSprueIllustration values={values} />,
  "feed.edgeGate": (values) => <EdgeGateIllustration values={values} />,
  "feed.sprue": (values) => <RunnerSprueIllustration values={values} />,
  "feed.gateFreezeTime": (values) => <GateFreezeIllustration values={values} />,
  "partMold.cavityDimension": (values) => <CavityDimensionIllustration values={values} />,
  "partMold.ejectionForce": (values) => <EjectionForceIllustration values={values} />,
  "partMold.plateDeflection": (values) => <PlateDeflectionIllustration values={values} />,
  "partMold.venting": (values) => <VentingIllustration values={values} />,
};

const registry: Record<string, Record<string, IllustrationFn>> = {
  bulkForming: bulkFormingIllustrations,
  sheetForming: sheetFormingIllustrations,
  injectionMolding: injectionMoldingIllustrations,
};

export function getCalcIllustration(
  moduleKey: string,
  groupKey: string,
  calcKey: string,
  values: Record<string, string>
): ReactElement | undefined {
  const fn = registry[moduleKey]?.[`${groupKey}.${calcKey}`];
  return fn?.(values);
}
