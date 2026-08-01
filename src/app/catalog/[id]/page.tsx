import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Plus } from "lucide-react";
import { pressModels, getPressById } from "@/data/presses";
import { getSeriesById } from "@/data/series";
import { applications } from "@/data/applications";
import { Card, Badge, SectionTitle } from "@/components/ui";
import { formatNumber } from "@/lib/utils";

export function generateStaticParams() {
  return pressModels.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const press = getPressById(id);
  return { title: press ? `${press.model} | ارس زنجان` : "مدل یافت نشد | ارس زنجان" };
}

function Spec({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === "") return null;
  return (
    <div className="rounded-lg bg-surface-2 px-3 py-2.5">
      <div className="text-[11px] text-muted">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

export default async function PressDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const press = getPressById(id);
  if (!press) notFound();

  const series = getSeriesById(press.seriesId);
  const relatedApplications = applications.filter((a) => a.recommendedSeriesIds.includes(press.seriesId));
  const siblingModels = pressModels.filter((p) => p.seriesId === press.seriesId && p.id !== press.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link href="/catalog" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-accent">
        <ArrowRight size={15} />
        بازگشت به کاتالوگ
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
              {press.frameMaterial === "cast-iron" ? "بدنه چدنی" : "بدنه آهنی"}
            </Badge>
            {series && <Badge tone="accent">{series.code}</Badge>}
            {press.lowConfidence && <Badge tone="warn">نیاز به تایید ابعاد</Badge>}
          </div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{press.model}</h1>
          <p className="mt-1 text-sm text-muted">{series?.nameFa}</p>
          {series && <p className="mt-3 max-w-2xl text-sm text-muted">{series.descriptionFa}</p>}

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={`/compare?ids=${press.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-strong"
            >
              <Plus size={14} />
              افزودن به مقایسه
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2"
            >
              انتخاب هوشمند بر اساس کاربرد
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <Spec label="ظرفیت نهایی" value={`${formatNumber(press.capacityFullKgf)} kgf`} />
            <Spec label="ظرفیت اولیه" value={press.capacityInitialKgf ? `${press.capacityInitialKgf} kgf` : undefined} />
            <Spec label="فشار پنوماتیک" value={press.pneumaticPressureBar ? `${press.pneumaticPressureBar} bar` : undefined} />
            <Spec label="فشار هیدرولیک" value={press.hydraulicPressureBar ? `${press.hydraulicPressureBar} bar` : undefined} />
            <Spec label="قطر سیلندر" value={press.cylinderDiameterMm ? `${press.cylinderDiameterMm}mm` : undefined} />
            <Spec
              label="کورس قدرتی"
              value={
                press.strokeOptions?.length
                  ? press.strokeOptions.map((s) => s.powerMm).filter(Boolean).join(" / ") + "mm"
                  : undefined
              }
            />
            <Spec label="فاصله محور تا بدنه" value={press.throatDepthMm ? `${press.throatDepthMm}mm` : undefined} />
            <Spec label="ابعاد میز" value={press.tableSizeMm} />
            <Spec label="ابعاد پلاک" value={press.plateSizeMm} />
            <Spec
              label="بازه ارتفاع قابل تنظیم"
              value={press.daylightRangeMm ? `${press.daylightRangeMm[0]}–${press.daylightRangeMm[1]}mm` : undefined}
            />
            <Spec label="ارتفاع کل دستگاه" value={press.totalHeightMm ? `${press.totalHeightMm}mm` : undefined} />
            <Spec label="جهت دسته" value={press.handleDirection} />
            <Spec label="کد سفارش" value={press.orderingCode} />
            <Spec label="نمونه کد سفارش" value={press.exampleCode} />
            <Spec label="صفحه منبع کاتالوگ" value={`صفحه ${press.sourcePage}`} />
          </div>

          {press.rawDimensionsMm && Object.keys(press.rawDimensionsMm).length > 0 && (
            <div className="mt-5">
              <div className="mb-2 text-xs font-semibold text-muted">سایر ابعاد (mm)</div>
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

          {press.notesFa && (
            <div className="mt-5 rounded-lg border border-border bg-surface-2 p-3 text-xs text-muted">{press.notesFa}</div>
          )}
        </div>
      </div>

      {relatedApplications.length > 0 && (
        <div className="mt-10">
          <SectionTitle eyebrow="کاربردها" title={`کاربردهای مناسب سری ${series?.code}`} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {relatedApplications.map((a) => (
              <Card key={a.id} className="p-4">
                <div className="font-semibold">{a.nameFa}</div>
                <div className="mt-0.5 text-[11px] text-muted">{a.nameEn}</div>
                <p className="mt-2 text-xs text-muted">{a.descriptionFa}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {siblingModels.length > 0 && (
        <div className="mt-10">
          <SectionTitle eyebrow={`سری ${series?.code}`} title="سایر مدل‌های همین سری" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {siblingModels.map((p) => (
              <Link key={p.id} href={`/catalog/${p.id}`} className="rounded-lg border border-border bg-surface p-3 text-sm hover:border-accent">
                <div className="font-bold">{p.model}</div>
                <div className="mt-0.5 text-[11px] text-muted">{formatNumber(p.capacityFullKgf)} kgf</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
