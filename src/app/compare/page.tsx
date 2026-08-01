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

const MAX_COMPARE = 5;

function CompareContent() {
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
    { label: "سری", render: (p) => getSeriesById(p.seriesId)?.code ?? "—" },
    { label: "بدنه", render: (p) => (p.frameMaterial === "cast-iron" ? "چدنی" : "آهنی") },
    { label: "ظرفیت نهایی (kgf)", render: (p) => formatNumber(p.capacityFullKgf) },
    { label: "ظرفیت اولیه (kgf)", render: (p) => (p.capacityInitialKgf ? formatNumber(p.capacityInitialKgf) : "—") },
    { label: "فشار پنوماتیک", render: (p) => (p.pneumaticPressureBar ? `${p.pneumaticPressureBar} bar` : "—") },
    { label: "فشار هیدرولیک", render: (p) => (p.hydraulicPressureBar ? `${p.hydraulicPressureBar} bar` : "—") },
    { label: "قطر سیلندر", render: (p) => (p.cylinderDiameterMm ? `${p.cylinderDiameterMm}mm` : "—") },
    {
      label: "کورس قدرتی (mm)",
      render: (p) => (p.strokeOptions?.length ? p.strokeOptions.map((s) => s.powerMm).filter(Boolean).join(" / ") : "—"),
    },
    { label: "فاصله محور تا بدنه", render: (p) => (p.throatDepthMm ? `${p.throatDepthMm}mm` : "—") },
    { label: "ابعاد میز/پلاک", render: (p) => p.tableSizeMm ?? p.plateSizeMm ?? "—" },
    { label: "بازه ارتفاع قابل تنظیم", render: (p) => (p.daylightRangeMm ? `${p.daylightRangeMm[0]}–${p.daylightRangeMm[1]}mm` : "—") },
    { label: "ارتفاع کل دستگاه", render: (p) => (p.totalHeightMm ? `${p.totalHeightMm}mm` : "—") },
    { label: "کد سفارش", render: (p) => p.orderingCode },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <SectionTitle
        eyebrow="مقایسه"
        title="مقایسه ۲ تا ۵ مدل پرس"
        description="مدل‌های موردنظر را جستجو و اضافه کنید. تمام مقادیر مستقیماً از پایگاه داده کاتالوگ خوانده می‌شود."
      />

      <Card className="mb-6 p-4">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={selected.length >= MAX_COMPARE ? "حداکثر ۵ مدل" : "جستجو و افزودن مدل..."}
            disabled={selected.length >= MAX_COMPARE}
            className="w-full rounded-lg border border-border bg-surface py-2 pe-9 ps-3 text-sm outline-none focus:border-accent disabled:opacity-50"
          />
          {searchResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-surface shadow-lg">
              {searchResults.map((r) => (
                <button
                  key={r.id}
                  onClick={() => addModel(r.id)}
                  className="block w-full px-3 py-2 text-right text-sm hover:bg-surface-2"
                >
                  {r.model}
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {presses.length === 0 && (
        <Card className="p-8 text-center text-sm text-muted">هنوز مدلی برای مقایسه اضافه نشده است.</Card>
      )}

      {presses.length > 0 && (
        <>
          <Card className="mb-6 overflow-x-auto p-0 thin-scroll">
            <table className="w-full min-w-[600px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  <th className="p-3 text-right text-xs font-semibold text-muted">مشخصه</th>
                  {presses.map((p) => (
                    <th key={p.id} className="p-3 text-right">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold">{p.model}</span>
                        <button onClick={() => removeModel(p.id)} className="text-muted hover:text-danger">
                          <X size={13} />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="p-3 text-xs font-medium text-muted">تصویر</td>
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
              <SectionTitle title="مقایسه بصری (نرمال‌شده نسبت به کل کاتالوگ)" />
              <CompareRadar presses={presses} />
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted">در حال بارگذاری...</div>}>
      <CompareContent />
    </Suspense>
  );
}
