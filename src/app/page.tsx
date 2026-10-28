"use client";

import { useForm } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
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
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { AlertTriangle } from "lucide-react";
import Image from "next/image";

const HERO_SLIDES = [
  {
    src: "/images/home/ph-press-single.jpg",
    alt: "پرس دستی ارس زنجان مدل PH/5N",
    altEn: "Aras Zanjan PH/5N hand press",
    titleFa: "پرس دستی PH/5N",
    titleEn: "PH/5N Hand Press",
  },
  {
    src: "/images/home/ph-press-pair.jpg",
    alt: "پرس‌های دستی ارس زنجان سری PH در دو سایز",
    altEn: "Aras Zanjan PH-series hand presses in two sizes",
    titleFa: "پرس‌های دستی سری PH — دو سایز",
    titleEn: "PH-Series Hand Presses — Two Sizes",
  },
];

export default function Home() {
  const { lang, t, fmt } = useLang();
  const { register, watch, setValue } = useForm<WizardFormValues>({ defaultValues: wizardDefaultValues });
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setSlide((s) => (s + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(timer);
  }, [slide]);
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
          }, lang);
        case "bending":
          return calcBendingForce({
            bendLengthMm: values.bendLengthMm ?? 0,
            thicknessMm: values.thicknessMm ?? 0,
            tensileStrengthMPa: rm,
            dieOpeningMm: values.dieOpeningMm || undefined,
          }, lang);
        case "pressFit":
          return calcPressFitForce({
            shaftDiameterMm: values.shaftDiameterMm ?? 0,
            hubOuterDiameterMm: values.hubOuterDiameterMm ?? 0,
            diametralInterferenceMm: values.diametralInterferenceMm ?? 0,
            contactLengthMm: values.contactLengthMm ?? 0,
            frictionCoefficient: values.frictionCoefficient || undefined,
          }, lang);
        case "riveting":
          return calcRivetingForce({
            rivetDiameterMm: values.rivetDiameterMm ?? 0,
            tensileStrengthMPa: rm,
          }, lang);
        case "coining":
          return calcCoiningForce({
            projectedAreaMm2: values.projectedAreaMm2 ?? 0,
            tensileStrengthMPa: rm,
            pressureFactor: values.pressureFactor || undefined,
          }, lang);
        default:
          return null;
      }
    } catch {
      return null;
    }
  }, [application, values, lang]);

  const requiredForceKgf = values.useManualForce ? values.manualForceKgf : calc?.forceKgf;

  const results = useMemo(() => {
    if (!application) return [];
    return recommendPresses(
      {
      applicationId: application.id,
      requiredForceKgf: requiredForceKgf && requiredForceKgf > 0 ? requiredForceKgf : undefined,
      partWidthMm: values.partWidthMm || undefined,
      partDepthMm: values.partDepthMm || undefined,
      partHeightMm: values.partHeightMm || undefined,
      throatNeededMm: values.throatNeededMm || undefined,
      strokeNeededMm: values.strokeNeededMm || undefined,
      bodyPreference: values.bodyPreference,
      },
      lang
    );
  }, [
    application,
    requiredForceKgf,
    values.partWidthMm,
    values.partDepthMm,
    values.partHeightMm,
    values.throatNeededMm,
    values.strokeNeededMm,
    values.bodyPreference,
    lang,
  ]);

  const topRecommended = results.filter((r) => r.status !== "excluded").slice(0, 5).map((r) => r.press.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <div className="max-w-3xl">
            <Badge tone="accent">{t("سیستم پشتیبان تصمیم مهندسی", "Engineering decision-support system")}</Badge>
            <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">{t("انتخاب هوشمند پرس ارس زنجان", "Aras Zanjan Smart Press Selection")}</h1>
            <p className="mt-2 text-sm text-muted">
              {t(
                "به‌جای انتخاب مستقیم مدل، کاربرد قطعه خود را مشخص کنید تا سیستم بر اساس فرمول‌های مهندسی واقعی (نیروی برش، خمش، پرس‌فیت و ...) و مشخصات فنی کاتالوگ رسمی، بهترین دستگاه را با استدلال پیشنهاد دهد.",
                "Instead of picking a model directly, specify what your part needs to do. Based on real engineering formulas (cutting force, bending, press-fit, etc.) and the official catalogue specifications, the system will recommend the best machine and explain why."
              )}
            </p>
          </div>

          <Card className="p-5">
            <SectionTitle eyebrow={t("مرحله ۱", "Step 1")} title={t("نوع کاربرد را انتخاب کنید", "Select the application type")} />
            <ApplicationPicker value={values.applicationId} onSelect={(id) => setValue("applicationId", id)} />
          </Card>

          {application && (
            <Card className="p-5">
              <SectionTitle
                eyebrow={t("مرحله ۲", "Step 2")}
                title={t("مشخصات قطعه و ماده", "Part and material specifications")}
                description={lang === "en" ? application.descriptionEn : application.descriptionFa}
              />
              <DynamicInputs application={application} register={register} watch={watch} />
              <div className="mt-4">
                <RefinementPanel register={register} />
              </div>
            </Card>
          )}

          {application && (
            <Card className="p-5">
              <SectionTitle eyebrow={t("راهنمای مهندسی", "Engineering guide")} title={lang === "en" ? application.nameEn : application.nameFa} />
              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <InfoList
                  title={t("صنایع مصرف‌کننده", "Consuming industries")}
                  items={lang === "en" ? application.industriesEn : application.industriesFa}
                />
                <InfoList
                  title={t("قطعات نمونه", "Sample parts")}
                  items={lang === "en" ? application.samplePartsEn : application.samplePartsFa}
                />
                <InfoList
                  title={t("مزایا", "Advantages")}
                  items={lang === "en" ? application.advantagesEn : application.advantagesFa}
                  tone="good"
                />
                <InfoList
                  title={t("محدودیت‌ها", "Limitations")}
                  items={lang === "en" ? application.limitationsEn : application.limitationsFa}
                  tone="warn"
                />
                {application.safetyNotesFa.length > 0 && (
                  <InfoList
                    title={t("نکات ایمنی", "Safety notes")}
                    items={lang === "en" ? application.safetyNotesEn : application.safetyNotesFa}
                    tone="danger"
                  />
                )}
                <div>
                  <div className="mb-1 text-xs font-semibold text-muted">{t("راهنمای کورس", "Stroke guidance")}</div>
                  <p className="text-xs">{lang === "en" ? application.strokeGuidanceEn : application.strokeGuidanceFa}</p>
                </div>
              </div>
              {(lang === "en" ? application.confidenceNoteEn : application.confidenceNoteFa) && (
                <div className="mt-4 flex gap-2 rounded-lg bg-warn-soft p-3 text-xs text-warn">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>{lang === "en" ? application.confidenceNoteEn : application.confidenceNoteFa}</span>
                </div>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card
            className={cn(
              "relative overflow-hidden bg-white transition-[height] duration-500",
              application ? "h-44" : "h-72 sm:h-96 lg:h-[calc(100vh-13rem)] lg:min-h-[420px]"
            )}
          >
            {application ? (
              <Image
                src="/images/home/ph-press-pair.jpg"
                alt={t("پرس‌های دستی ارس زنجان سری PH در دو سایز", "Aras Zanjan PH-series hand presses in two sizes")}
                fill
                className="object-cover object-[50%_60%]"
                sizes="(min-width: 1024px) 420px, 100vw"
              />
            ) : (
              HERO_SLIDES.map((s, i) => (
                <Image
                  key={s.src}
                  src={s.src}
                  alt={lang === "en" ? s.altEn : s.alt}
                  fill
                  className={cn(
                    "object-contain object-center p-3 pb-24 transition-opacity duration-700",
                    i === slide ? "opacity-100" : "opacity-0"
                  )}
                  sizes="(min-width: 1024px) 420px, 100vw"
                  priority={i === 0}
                />
              ))
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 text-white">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80">Aras Zanjan • AZCO</div>
              <div className="mt-0.5 text-base font-extrabold">{application
                  ? t("پرس‌های دستی سری PH", "PH-Series Hand Presses")
                  : lang === "en"
                    ? HERO_SLIDES[slide].titleEn
                    : HERO_SLIDES[slide].titleFa}</div>
              <div className="text-[11px] text-white/85">
                {t("ساخت ارس زنجان — بدون نیاز به برق یا هوای فشرده", "Made by Aras Zanjan — no electricity or compressed air required")}
              </div>
            </div>
            {!application && (
              <div className="absolute start-3 top-3 flex gap-1.5">
                {HERO_SLIDES.map((s, i) => (
                  <button
                    key={s.src}
                    type="button"
                    aria-label={lang === "en" ? s.titleEn : s.titleFa}
                    onClick={() => setSlide(i)}
                    className={cn(
                      "h-2 rounded-full border border-black/10 transition-all",
                      i === slide ? "w-6 bg-accent" : "w-2 bg-black/20 hover:bg-black/40"
                    )}
                  />
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">{t("نتیجه زنده", "Live Result")}</h2>
              {topRecommended.length > 0 && <CompareAllButton ids={topRecommended} />}
            </div>

            {!application && (
              <p className="text-sm text-muted">
                {t("ابتدا یک کاربرد از لیست سمت راست انتخاب کنید تا پیشنهادها نمایش داده شود.", "First select an application from the list to see recommendations.")}
              </p>
            )}

            {application && calc && !values.useManualForce && (
              <div className="mb-4 rounded-lg border border-border bg-surface-2 p-3">
                <div className="text-xs text-muted">{t("نیروی محاسبه‌شده موردنیاز", "Calculated required force")}</div>
                <div className="text-xl font-extrabold text-accent-strong">{fmt(calc.forceKgf)} kgf</div>
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

            {application && results.length === 0 && <p className="text-sm text-muted">{t("هیچ مدلی برای این ترکیب یافت نشد.", "No model was found for this combination.")}</p>}

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
