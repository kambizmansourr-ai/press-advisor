"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Plus } from "lucide-react";
import { pressModels, getPressById } from "@/data/presses";
import { getSeriesById } from "@/data/series";
import { applications } from "@/data/applications";
import { Card, Badge, SectionTitle } from "@/components/ui";
import { formatNumber } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

function Spec({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === "") return null;
  return (
    <div className="rounded-lg bg-surface-2 px-3 py-2.5">
      <div className="text-[11px] text-muted">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

export function PressDetail({ id }: { id: string }) {
  const { lang, t } = useLang();
  const en = lang === "en";
  const press = getPressById(id);
  if (!press) notFound();

  const series = getSeriesById(press.seriesId);
  const relatedApplications = applications.filter((a) => a.recommendedSeriesIds.includes(press.seriesId));
  const siblingModels = pressModels.filter((p) => p.seriesId === press.seriesId && p.id !== press.id);
  const notes = en ? (press.notesEn ?? press.notesFa) : press.notesFa;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link href="/catalog" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-accent">
        <ArrowRight size={15} className="ltr:rotate-180" />
        {t("بازگشت به کاتالوگ", "Back to catalogue")}
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div>
          {series && (
            <div className="relative h-64 w-full overflow-hidden rounded-xl bg-surface-2 lg:h-full">
              <Image src={series.imageUrl} alt={press.model} fill className="object-cover" sizes="380px" priority />
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge tone={press.frameMaterial === "cast-iron" ? "neutral" : "accent"}>
              {press.frameMaterial === "cast-iron" ? t("بدنه چدنی", "Cast-iron frame") : t("بدنه آهنی", "Steel frame")}
            </Badge>
            {series && <Badge tone="accent">{series.code}</Badge>}
            {press.lowConfidence && <Badge tone="warn">{t("نیاز به تایید ابعاد", "Dimensions need verification")}</Badge>}
          </div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{press.model}</h1>
          <p className="mt-1 text-sm text-muted">{en ? series?.nameEn : series?.nameFa}</p>
          {series && (
            <p className="mt-3 max-w-2xl text-sm text-muted">{en ? series.descriptionEn : series.descriptionFa}</p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={`/compare?ids=${press.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-strong"
            >
              <Plus size={14} />
              {t("افزودن به مقایسه", "Add to comparison")}
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2"
            >
              {t("انتخاب هوشمند بر اساس کاربرد", "Smart selection by application")}
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <Spec label={t("ظرفیت نهایی", "Full capacity")} value={`${formatNumber(press.capacityFullKgf, lang)} kgf`} />
            <Spec
              label={t("ظرفیت اولیه", "Initial capacity")}
              value={press.capacityInitialKgf ? `${press.capacityInitialKgf} kgf` : undefined}
            />
            <Spec
              label={t("فشار پنوماتیک", "Pneumatic pressure")}
              value={press.pneumaticPressureBar ? `${press.pneumaticPressureBar} bar` : undefined}
            />
            <Spec
              label={t("فشار هیدرولیک", "Hydraulic pressure")}
              value={press.hydraulicPressureBar ? `${press.hydraulicPressureBar} bar` : undefined}
            />
            <Spec
              label={t("قطر سیلندر", "Cylinder diameter")}
              value={press.cylinderDiameterMm ? `${press.cylinderDiameterMm}mm` : undefined}
            />
            <Spec
              label={t("کورس قدرتی", "Power stroke")}
              value={
                press.strokeOptions?.length
                  ? press.strokeOptions.map((s) => s.powerMm).filter(Boolean).join(" / ") + "mm"
                  : undefined
              }
            />
            <Spec
              label={t("فاصله محور تا بدنه", "Throat depth")}
              value={press.throatDepthMm ? `${press.throatDepthMm}mm` : undefined}
            />
            <Spec label={t("ابعاد میز", "Table size")} value={press.tableSizeMm} />
            <Spec label={t("ابعاد پلاک", "Plate size")} value={press.plateSizeMm} />
            <Spec
              label={t("بازه ارتفاع قابل تنظیم", "Adjustable daylight range")}
              value={press.daylightRangeMm ? `${press.daylightRangeMm[0]}–${press.daylightRangeMm[1]}mm` : undefined}
            />
            <Spec
              label={t("ارتفاع کل دستگاه", "Overall machine height")}
              value={press.totalHeightMm ? `${press.totalHeightMm}mm` : undefined}
            />
            <Spec label={t("جهت دسته", "Handle direction")} value={press.handleDirection} />
            <Spec label={t("کد سفارش", "Ordering code")} value={press.orderingCode} />
            <Spec label={t("نمونه کد سفارش", "Example ordering code")} value={press.exampleCode} />
            <Spec
              label={t("صفحه منبع کاتالوگ", "Catalogue source page")}
              value={t(`صفحه ${press.sourcePage}`, `Page ${press.sourcePage}`)}
            />
          </div>

          {press.rawDimensionsMm && Object.keys(press.rawDimensionsMm).length > 0 && (
            <div className="mt-5">
              <div className="mb-2 text-xs font-semibold text-muted">{t("سایر ابعاد (mm)", "Other dimensions (mm)")}</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(press.rawDimensionsMm).map(([k, v]) => (
                  <span key={k} className="rounded-md bg-surface-2 px-2.5 py-1 text-xs">
                    <span className="text-muted">{k}: </span>
                    <span className="font-semibold">{v}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {notes && (
            <div className="mt-5 rounded-lg border border-border bg-surface-2 p-3 text-xs text-muted">{notes}</div>
          )}
        </div>
      </div>

      {relatedApplications.length > 0 && (
        <div className="mt-10">
          <SectionTitle
            eyebrow={t("کاربردها", "Applications")}
            title={t(`کاربردهای مناسب سری ${series?.code}`, `Suitable applications for the ${series?.code} series`)}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {relatedApplications.map((a) => (
              <Card key={a.id} className="p-4">
                <div className="font-semibold">{en ? a.nameEn : a.nameFa}</div>
                {!en && <div className="mt-0.5 text-[11px] text-muted">{a.nameEn}</div>}
                <p className="mt-2 text-xs text-muted">{en ? a.descriptionEn : a.descriptionFa}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {siblingModels.length > 0 && (
        <div className="mt-10">
          <SectionTitle
            eyebrow={t(`سری ${series?.code}`, `${series?.code} series`)}
            title={t("سایر مدل‌های همین سری", "Other models in this series")}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {siblingModels.map((p) => (
              <Link key={p.id} href={`/catalog/${p.id}`} className="rounded-lg border border-border bg-surface p-3 text-sm hover:border-accent">
                <div className="font-bold">{p.model}</div>
                <div className="mt-0.5 text-[11px] text-muted">{formatNumber(p.capacityFullKgf, lang)} kgf</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
