"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, SectionTitle } from "@/components/ui";
import { pressModels, getPressById } from "@/data/presses";
import { getSeriesById } from "@/data/series";
import { CompareRadar } from "@/components/charts/CompareRadar";
import { formatNumber, cn } from "@/lib/utils";
import { X, Search } from "lucide-react";
import Image from "next/image";
import { useLang } from "@/lib/i18n";

const MAX_COMPARE = 5;

function CompareContent() {
  const { lang, t } = useLang();
  const searchParams = useSearchParams();
  const initialIds = (searchParams.get("ids") ?? "").split(",").filter(Boolean);
  const [selected, setSelected] = useState<string[]>(initialIds.slice(0, MAX_COMPARE));
  const [query, setQuery] = useState("");

  const presses = selected.map((id) => getPressById(id)).filter((p): p is NonNullable<typeof p> => !!p);

  const searchResults = query
    ? pressModels.filter((p) => !selected.includes(p.id) && p.model.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : [];

  const addModel = (id: string) => {
    if (selected.length >= MAX_COMPARE) return;
    setSelected((s) => [...s, id]);
    setQuery("");
  };
  const removeModel = (id: string) => setSelected((s) => s.filter((x) => x !== id));

  const rows: { label: string; render: (p: (typeof presses)[number]) => string }[] = [
    { label: t("سری", "Series"), render: (p) => getSeriesById(p.seriesId)?.code ?? "—" },
    { label: t("بدنه", "Frame"), render: (p) => (p.frameMaterial === "cast-iron" ? t("چدنی", "Cast iron") : t("آهنی", "Steel")) },
    { label: t("ظرفیت نهایی (kgf)", "Full capacity (kgf)"), render: (p) => formatNumber(p.capacityFullKgf, lang) },
    { label: t("ظرفیت اولیه (kgf)", "Initial capacity (kgf)"), render: (p) => (p.capacityInitialKgf ? formatNumber(p.capacityInitialKgf, lang) : "—") },
    { label: t("فشار پنوماتیک", "Pneumatic pressure"), render: (p) => (p.pneumaticPressureBar ? `${p.pneumaticPressureBar} bar` : "—") },
    { label: t("فشار هیدرولیک", "Hydraulic pressure"), render: (p) => (p.hydraulicPressureBar ? `${p.hydraulicPressureBar} bar` : "—") },
    { label: t("قطر سیلندر", "Cylinder diameter"), render: (p) => (p.cylinderDiameterMm ? `${p.cylinderDiameterMm}mm` : "—") },
    {
      label: t("کورس قدرتی (mm)", "Power stroke (mm)"),
      render: (p) => (p.strokeOptions?.length ? p.strokeOptions.map((s) => s.powerMm).filter(Boolean).join(" / ") : "—"),
    },
    { label: t("فاصله محور تا بدنه", "Throat depth"), render: (p) => (p.throatDepthMm ? `${p.throatDepthMm}mm` : "—") },
    { label: t("ابعاد میز/پلاک", "Table / plate size"), render: (p) => p.tableSizeMm ?? p.plateSizeMm ?? "—" },
    { label: t("بازه ارتفاع قابل تنظیم", "Adjustable daylight range"), render: (p) => (p.daylightRangeMm ? `${p.daylightRangeMm[0]}–${p.daylightRangeMm[1]}mm` : "—") },
    { label: t("ارتفاع کل دستگاه", "Overall machine height"), render: (p) => (p.totalHeightMm ? `${p.totalHeightMm}mm` : "—") },
    { label: t("کد سفارش", "Ordering code"), render: (p) => p.orderingCode },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <SectionTitle
        eyebrow={t("مقایسه", "Compare")}
        title={t("مقایسه ۲ تا ۵ مدل پرس", "Compare 2 to 5 Press Models")}
        description={t(
          "مدل‌های موردنظر را جستجو و اضافه کنید. تمام مقادیر مستقیماً از پایگاه داده کاتالوگ خوانده می‌شود.",
          "Search for and add the models you want. All values are read directly from the catalogue database."
        )}
      />

      <Card className="mb-6 p-4">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={selected.length >= MAX_COMPARE ? t("حداکثر ۵ مدل", "Maximum 5 models") : t("جستجو و افزودن مدل...", "Search and add a model...")}
            disabled={selected.length >= MAX_COMPARE}
            className="w-full rounded-lg border border-border bg-surface py-2 pe-3 ps-9 text-sm outline-none focus:border-accent disabled:opacity-50"
          />
          {searchResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-surface shadow-lg">
              {searchResults.map((r) => (
                <button
                  key={r.id}
                  onClick={() => addModel(r.id)}
                  className="block w-full px-3 py-2 text-start text-sm hover:bg-surface-2"
                >
                  {r.model}
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {presses.length === 0 && (
        <Card className="p-8 text-center text-sm text-muted">{t("هنوز مدلی برای مقایسه اضافه نشده است.", "No models have been added for comparison yet.")}</Card>
      )}

      {presses.length > 0 && (
        <>
          <Card className="mb-6 overflow-x-auto p-0 thin-scroll">
            <table className="w-full min-w-[600px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  <th className="p-3 text-start text-xs font-semibold text-muted">{t("مشخصه", "Specification")}</th>
                  {presses.map((p) => (
                    <th key={p.id} className="p-3 text-start">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold">{p.model}</span>
                        <button
                          onClick={() => removeModel(p.id)}
                          aria-label={t("حذف از مقایسه", "Remove from comparison")}
                          className="text-muted hover:text-danger"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="p-3 text-xs font-medium text-muted">{t("تصویر", "Image")}</td>
                  {presses.map((p) => {
                    const series = getSeriesById(p.seriesId);
                    return (
                      <td key={p.id} className="p-3">
                        {series && (
                          <div className="relative h-20 w-28 overflow-hidden rounded-lg bg-surface-2">
                            <Image src={series.imageUrl} alt={p.model} fill className="object-cover" sizes="112px" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
                {rows.map((row, i) => (
                  <tr key={row.label} className={cn("border-b border-border", i % 2 === 0 && "bg-surface")}>
                    <td className="p-3 text-xs font-medium text-muted">{row.label}</td>
                    {presses.map((p) => (
                      <td key={p.id} className="p-3 text-xs font-semibold">
                        {row.render(p)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {presses.length >= 2 && (
            <Card className="p-5">
              <SectionTitle title={t("مقایسه بصری (نرمال‌شده نسبت به کل کاتالوگ)", "Visual comparison (normalised against the whole catalogue)")} />
              <CompareRadar presses={presses} />
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function LoadingFallback() {
  const { t } = useLang();
  return <div className="p-8 text-sm text-muted">{t("در حال بارگذاری...", "Loading...")}</div>;
}

export default function ComparePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CompareContent />
    </Suspense>
  );
}
