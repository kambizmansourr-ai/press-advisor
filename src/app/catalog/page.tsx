"use client";

import { useMemo, useState } from "react";
import { Card, SectionTitle, Badge } from "@/components/ui";
import { pressModels } from "@/data/presses";
import { pressSeries, getSeriesById } from "@/data/series";
import { SeriesCapacityChart } from "@/components/charts/SeriesCapacityChart";
import { formatNumber } from "@/lib/utils";
import { Search } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useLang } from "@/lib/i18n";

export default function CatalogPage() {
  const { lang, t } = useLang();
  const [seriesFilter, setSeriesFilter] = useState<string>("all");
  const [bodyFilter, setBodyFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return pressModels.filter((p) => {
      if (seriesFilter !== "all" && p.seriesId !== seriesFilter) return false;
      if (bodyFilter !== "all" && p.frameMaterial !== bodyFilter) return false;
      if (query && !p.model.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [seriesFilter, bodyFilter, query]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <SectionTitle
        eyebrow={t("کاتالوگ دیجیتال", "Digital Catalogue")}
        title={t("همه سری‌ها و مدل‌های پرس ارس زنجان", "All Aras Zanjan Press Series and Models")}
        description={t(
          "داده‌های این صفحه مستقیماً از کاتالوگ رسمی (Presses-Catalogue-1.pdf) استخراج شده است. برای مشاهده استدلال انتخاب بر اساس کاربرد، از صفحه «انتخاب هوشمند» استفاده کنید.",
          "The data on this page is taken directly from the official catalogue (Presses-Catalogue-1.pdf). To see application-based selection reasoning, use the \"Smart Selection\" page."
        )}
      />

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {pressSeries.map((s) => (
          <Card key={s.id} className="overflow-hidden p-0">
            <div className="relative h-40 w-full bg-surface-2">
              <Image src={s.imageUrl} alt={lang === "en" ? s.nameEn : s.nameFa} fill className="object-cover" sizes="(min-width: 1024px) 33vw, 100vw" />
            </div>
            <div className="p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-bold">{s.code}</span>
                <Badge tone="accent">{lang === "en" ? `${pressModels.filter((m) => m.seriesId === s.id).length} models` : `${pressModels.filter((m) => m.seriesId === s.id).length} مدل`}</Badge>
              </div>
              <div className="text-xs font-semibold text-muted">{lang === "en" ? s.nameEn : s.nameFa}</div>
              <p className="mt-2 line-clamp-3 text-xs text-muted">{lang === "en" ? s.descriptionEn : s.descriptionFa}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mb-8 p-5">
        <SectionTitle title={t("بازه ظرفیت هر سری (kgf)", "Capacity range per series (kgf)")} />
        <SeriesCapacityChart />
      </Card>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative">
          <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("جستجوی مدل...", "Search models...")}
            className="w-56 rounded-lg border border-border bg-surface py-2 pe-3 ps-9 text-sm outline-none focus:border-accent"
          />
        </div>
        <select
          value={seriesFilter}
          onChange={(e) => setSeriesFilter(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="all">{t("همه سری‌ها", "All series")}</option>
          {pressSeries.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code}
            </option>
          ))}
        </select>
        <select
          value={bodyFilter}
          onChange={(e) => setBodyFilter(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="all">{t("همه بدنه‌ها", "All frames")}</option>
          <option value="cast-iron">{t("چدنی", "Cast iron")}</option>
          <option value="steel">{t("آهنی", "Steel")}</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => {
          const series = getSeriesById(p.seriesId);
          return (
            <Card key={p.id} className="overflow-hidden p-0 transition-colors hover:border-accent">
              <Link href={`/catalog/${p.id}`} className="block">
                {series && (
                  <div className="relative h-32 w-full bg-surface-2">
                    <Image src={series.imageUrl} alt={p.model} fill className="object-cover" sizes="(min-width: 1024px) 33vw, 50vw" />
                  </div>
                )}
                <div className="p-4 pb-0">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-bold">{p.model}</span>
                    <Badge tone={p.frameMaterial === "cast-iron" ? "neutral" : "accent"}>
                      {p.frameMaterial === "cast-iron" ? t("چدنی", "Cast iron") : t("آهنی", "Steel")}
                    </Badge>
                  </div>
                  <div className="mb-2 text-[11px] text-muted">{lang === "en" ? series?.nameEn : series?.nameFa}</div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <div>
                      <span className="text-muted">{t("ظرفیت: ", "Capacity: ")}</span>
                      <span className="font-semibold">{formatNumber(p.capacityFullKgf, lang)} kgf</span>
                    </div>
                    {p.capacityInitialKgf && (
                      <div>
                        <span className="text-muted">{t("اولیه: ", "Initial: ")}</span>
                        <span className="font-semibold">{p.capacityInitialKgf} kgf</span>
                      </div>
                    )}
                    {p.tableSizeMm && (
                      <div>
                        <span className="text-muted">{t("میز: ", "Table: ")}</span>
                        <span className="font-semibold">{p.tableSizeMm}</span>
                      </div>
                    )}
                    {p.plateSizeMm && (
                      <div>
                        <span className="text-muted">{t("پلاک: ", "Plate: ")}</span>
                        <span className="font-semibold">{p.plateSizeMm}</span>
                      </div>
                    )}
                    {p.throatDepthMm && (
                      <div>
                        <span className="text-muted">{t("فاصله محور: ", "Throat: ")}</span>
                        <span className="font-semibold">{p.throatDepthMm}mm</span>
                      </div>
                    )}
                    {p.daylightRangeMm && (
                      <div>
                        <span className="text-muted">{t("بازه ارتفاع: ", "Daylight: ")}</span>
                        <span className="font-semibold">
                          {p.daylightRangeMm[0]}–{p.daylightRangeMm[1]}mm
                        </span>
                      </div>
                    )}
                  </div>
                  {p.lowConfidence && (
                    <div className="mt-2 text-[10px] text-warn">⚠ {t("برخی ابعاد این مدل نیاز به تایید دارد.", "Some dimensions of this model need verification.")}</div>
                  )}
                </div>
              </Link>
              <div className="flex items-center justify-between px-4 pb-4 pt-3">
                <Link href={`/catalog/${p.id}`} className="text-xs font-medium text-accent hover:underline">
                  {t("مشاهده مشخصات کامل ←", "View full specifications →")}
                </Link>
                <Link href={`/compare?ids=${p.id}`} className="text-xs font-medium text-muted hover:text-accent">
                  {t("افزودن به مقایسه", "Add to comparison")}
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
