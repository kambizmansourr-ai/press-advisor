"use client";

import { applications } from "@/data/applications";
import { ApplicationCategory } from "@/types/application";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { Check } from "lucide-react";

const categoryLabels: Record<ApplicationCategory, { fa: string; en: string }> = {
  assembly: { fa: "مونتاژ / پرس‌فیت", en: "Assembly / Press-Fit" },
  cutting: { fa: "برش / پانچ", en: "Cutting / Punching" },
  forming: { fa: "شکل‌دهی", en: "Forming" },
  joining: { fa: "اتصال", en: "Joining" },
  craft: { fa: "صنایع دستی و ظریف‌کاری", en: "Crafts & Fine Work" },
};

const categoryOrder: ApplicationCategory[] = ["assembly", "cutting", "forming", "joining", "craft"];

export function ApplicationPicker({ value, onSelect }: { value: string; onSelect: (id: string) => void }) {
  const { lang, t } = useLang();
  return (
    <div className="space-y-5">
      {categoryOrder.map((cat) => {
        const items = applications.filter((a) => a.category === cat);
        if (!items.length) return null;
        return (
          <div key={cat}>
            <div className="mb-2 text-xs font-semibold text-muted">{t(categoryLabels[cat].fa, categoryLabels[cat].en)}</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {items.map((app) => {
                const active = value === app.id;
                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => onSelect(app.id)}
                    className={cn(
                      "relative rounded-lg border p-3 text-start text-sm transition-colors",
                      active
                        ? "border-accent bg-accent-soft text-accent-strong"
                        : "border-border bg-surface hover:border-accent/50 hover:bg-surface-2"
                    )}
                  >
                    {active && (
                      <span className="absolute end-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-white">
                        <Check size={11} />
                      </span>
                    )}
                    {lang === "en" ? (
                      <div className="font-semibold">{app.nameEn}</div>
                    ) : (
                      <>
                        <div className="font-semibold">{app.nameFa}</div>
                        <div className="mt-0.5 text-[11px] text-muted">{app.nameEn}</div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
