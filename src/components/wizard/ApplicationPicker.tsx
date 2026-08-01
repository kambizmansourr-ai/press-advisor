"use client";

import { applications } from "@/data/applications";
import { ApplicationCategory } from "@/types/application";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const categoryLabels: Record<ApplicationCategory, string> = {
  assembly: "مونتاژ / پرس‌فیت",
  cutting: "برش / پانچ",
  forming: "شکل‌دهی",
  joining: "اتصال",
  craft: "صنایع دستی و ظریف‌کاری",
};

const categoryOrder: ApplicationCategory[] = ["assembly", "cutting", "forming", "joining", "craft"];

export function ApplicationPicker({ value, onSelect }: { value: string; onSelect: (id: string) => void }) {
  return (
    <div className="space-y-5">
      {categoryOrder.map((cat) => {
        const items = applications.filter((a) => a.category === cat);
        if (!items.length) return null;
        return (
          <div key={cat}>
            <div className="mb-2 text-xs font-semibold text-muted">{categoryLabels[cat]}</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {items.map((app) => {
                const active = value === app.id;
                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => onSelect(app.id)}
                    className={cn(
                      "relative rounded-lg border p-3 text-right text-sm transition-colors",
                      active
                        ? "border-accent bg-accent-soft text-accent-strong"
                        : "border-border bg-surface hover:border-accent/50 hover:bg-surface-2"
                    )}
                  >
                    {active && (
                      <span className="absolute left-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-white">
                        <Check size={11} />
                      </span>
                    )}
                    <div className="font-semibold">{app.nameFa}</div>
                    <div className="mt-0.5 text-[11px] text-muted">{app.nameEn}</div>
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
