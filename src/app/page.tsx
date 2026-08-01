"use client";

import { useForm } from "react-hook-form";
import { useMemo } from "react";
import { WizardFormValues, wizardDefaultValues } from "@/components/wizard/types";
import { ApplicationPicker } from "@/components/wizard/ApplicationPicker";
import { DynamicInputs } from "@/components/wizard/DynamicInputs";
import { RefinementPanel } from "@/components/wizard/RefinementPanel";
import { PressResultCard, CompareAllButton } from "@/components/wizard/PressResultCard";
import { Card, SectionTitle, Badge } from "@/components/ui";
import { getApplicationById } from "@/data/applications";
import { getMaterialById, tensileAvg } from "@/data/materials";
import {
  calcPunchingForce,
  calcBendingForce,
  calcPressFitForce,
  calcRivetingForce,
  calcCoiningForce,
  CalcResult,
} from "@/calculators/forceCalculators";
import { recommendPresses } from "@/rules/engine";
import { formatNumber } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

export default function Home() {
  const { register, watch, setValue } = useForm<WizardFormValues>({ defaultValues: wizardDefaultValues });
  // react-hook-form's watch() intentionally opts this component out of React Compiler
  // auto-memoization; force-recalculation below is handled explicitly via useMemo.
  // eslint-disable-next-line react-hooks/incompatible-library
  const values = watch();
  const application = values.applicationId ? getApplicationById(values.applicationId) : undefined;

  const calc: CalcResult | null = useMemo(() => {
    if (values.useManualForce || !application) return null;
    const material = getMaterialById(values.materialId);
    const rm = material ? tensileAvg(material) : 300;
    const shearMpa = material ? rm * material.shearFactor : rm * 0.8;
    try {
      switch (application.forceCalculator) {
        case "punching":
          return calcPunchingForce({
            shape: values.shape,
            diameterMm: values.diameterMm,
            lengthMm: values.rectLengthMm,
            widthMm: values.rectWidthMm,
            thicknessMm: values.thicknessMm ?? 0,
            shearStrengthMPa: shearMpa,
            holeCount: values.holeCount ?? 1,
          });
        case "bending":
          return calcBendingForce({
            bendLengthMm: values.bendLengthMm ?? 0,
            thicknessMm: values.thicknessMm ?? 0,
            tensileStrengthMPa: rm,
            dieOpeningMm: values.dieOpeningMm || undefined,
          });
        case "pressFit":
          return calcPressFitForce({
            shaftDiameterMm: values.shaftDiameterMm ?? 0,
            hubOuterDiameterMm: values.hubOuterDiameterMm ?? 0,
            diametralInterferenceMm: values.diametralInterferenceMm ?? 0,
            contactLengthMm: values.contactLengthMm ?? 0,
            frictionCoefficient: values.frictionCoefficient || undefined,
          });
        case "riveting":
          return calcRivetingForce({
            rivetDiameterMm: values.rivetDiameterMm ?? 0,
            tensileStrengthMPa: rm,
          });
        case "coining":
          return calcCoiningForce({
            projectedAreaMm2: values.projectedAreaMm2 ?? 0,
            tensileStrengthMPa: rm,
            pressureFactor: values.pressureFactor || undefined,
          });
        default:
          return null;
      }
    } catch {
      return null;
    }
  }, [application, values]);

  const requiredForceKgf = values.useManualForce ? values.manualForceKgf : calc?.forceKgf;

  const results = useMemo(() => {
    if (!application) return [];
    return recommendPresses({
      applicationId: application.id,
      requiredForceKgf: requiredForceKgf && requiredForceKgf > 0 ? requiredForceKgf : undefined,
      partWidthMm: values.partWidthMm || undefined,
      partDepthMm: values.partDepthMm || undefined,
      partHeightMm: values.partHeightMm || undefined,
      throatNeededMm: values.throatNeededMm || undefined,
      strokeNeededMm: values.strokeNeededMm || undefined,
      bodyPreference: values.bodyPreference,
    });
  }, [
    application,
    requiredForceKgf,
    values.partWidthMm,
    values.partDepthMm,
    values.partHeightMm,
    values.throatNeededMm,
    values.strokeNeededMm,
    values.bodyPreference,
  ]);

  const topRecommended = results.filter((r) => r.status !== "excluded").slice(0, 5).map((r) => r.press.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 max-w-3xl">
        <Badge tone="accent">سیستم پشتیبان تصمیم مهندسی</Badge>
        <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">انتخاب هوشمند پرس ارس زنجان</h1>
        <p className="mt-2 text-sm text-muted">
          به‌جای انتخاب مستقیم مدل، کاربرد قطعه خود را مشخص کنید تا سیستم بر اساس فرمول‌های مهندسی واقعی (نیروی برش، خمش، پرس‌فیت و ...) و
          مشخصات فنی کاتالوگ رسمی، بهترین دستگاه را با استدلال پیشنهاد دهد.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <Card className="p-5">
            <SectionTitle eyebrow="مرحله ۱" title="نوع کاربرد را انتخاب کنید" />
            <ApplicationPicker value={values.applicationId} onSelect={(id) => setValue("applicationId", id)} />
          </Card>

          {application && (
            <Card className="p-5">
              <SectionTitle eyebrow="مرحله ۲" title="مشخصات قطعه و ماده" description={application.descriptionFa} />
              <DynamicInputs application={application} register={register} watch={watch} />
              <div className="mt-4">
                <RefinementPanel register={register} />
              </div>
            </Card>
          )}

          {application && (
            <Card className="p-5">
              <SectionTitle eyebrow="راهنمای مهندسی" title={application.nameFa} />
              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <InfoList title="صنایع مصرف‌کننده" items={application.industriesFa} />
                <InfoList title="قطعات نمونه" items={application.samplePartsFa} />
                <InfoList title="مزایا" items={application.advantagesFa} tone="good" />
                <InfoList title="محدودیت‌ها" items={application.limitationsFa} tone="warn" />
                {application.safetyNotesFa.length > 0 && (
                  <InfoList title="نکات ایمنی" items={application.safetyNotesFa} tone="danger" />
                )}
                <div>
                  <div className="mb-1 text-xs font-semibold text-muted">راهنمای کورس</div>
                  <p className="text-xs">{application.strokeGuidanceFa}</p>
                </div>
              </div>
              {application.confidenceNoteFa && (
                <div className="mt-4 flex gap-2 rounded-lg bg-warn-soft p-3 text-xs text-warn">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>{application.confidenceNoteFa}</span>
                </div>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">نتیجه زنده</h2>
              {topRecommended.length > 0 && <CompareAllButton ids={topRecommended} />}
            </div>

            {!application && (
              <p className="text-sm text-muted">ابتدا یک کاربرد از لیست سمت راست انتخاب کنید تا پیشنهادها نمایش داده شود.</p>
            )}

            {application && calc && !values.useManualForce && (
              <div className="mb-4 rounded-lg border border-border bg-surface-2 p-3">
                <div className="text-xs text-muted">نیروی محاسبه‌شده موردنیاز</div>
                <div className="text-xl font-extrabold text-accent-strong">{formatNumber(calc.forceKgf)} kgf</div>
                <div className="mt-2 text-[11px] text-muted">{calc.formulaFa}</div>
                <ul className="mt-1.5 space-y-0.5">
                  {calc.assumptionsFa.map((a, i) => (
                    <li key={i} className="text-[10px] text-muted">
                      • {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {application && results.length === 0 && <p className="text-sm text-muted">هیچ مدلی برای این ترکیب یافت نشد.</p>}

            <div className="max-h-[70vh] space-y-3 overflow-y-auto thin-scroll pe-1">
              {application && results.map((r, idx) => <PressResultCard key={r.press.id} result={r} rank={idx} />)}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoList({ title, items, tone }: { title: string; items: string[]; tone?: "good" | "warn" | "danger" }) {
  if (!items.length) return null;
  const colors: Record<string, string> = {
    good: "text-good",
    warn: "text-warn",
    danger: "text-danger",
  };
  return (
    <div>
      <div className="mb-1 text-xs font-semibold text-muted">{title}</div>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className={`text-xs ${tone ? colors[tone] : ""}`}>
            • {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
