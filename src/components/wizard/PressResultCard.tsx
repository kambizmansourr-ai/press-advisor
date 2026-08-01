"use client";

import { useState } from "react";
import { RecommendationResult } from "@/rules/engine";
import { Badge, ProgressBar, Button } from "@/components/ui";
import { formatNumber } from "@/lib/utils";
import { ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSeriesById } from "@/data/series";
import Link from "next/link";
import Image from "next/image";

const statusTone: Record<RecommendationResult["status"], "good" | "warn" | "danger"> = {
  recommended: "good",
  marginal: "warn",
  excluded: "danger",
};
const statusLabel: Record<RecommendationResult["status"], string> = {
  recommended: "پیشنهاد می‌شود",
  marginal: "قابل بررسی",
  excluded: "نامناسب",
};

export function PressResultCard({ result, rank }: { result: RecommendationResult; rank: number }) {
  const [open, setOpen] = useState(rank === 0);
  const { press, seriesNameFa, status, utilizationPercent, reasonsFa, warningsFa, exclusionReasonsFa } = result;
  const series = getSeriesById(press.seriesId);

  return (
    <div className={cn("rounded-xl border bg-surface p-4 transition-colors", status === "recommended" && rank === 0 ? "border-accent" : "border-border")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {series && (
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-2">
              <Image src={series.imageUrl} alt={press.model} fill className="object-cover" sizes="56px" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold">{press.model}</h3>
              <Badge tone={statusTone[status]}>{statusLabel[status]}</Badge>
              {rank === 0 && status === "recommended" && <Badge tone="accent">بهترین گزینه</Badge>}
            </div>
            <div className="mt-0.5 text-xs text-muted">{seriesNameFa}</div>
          </div>
        </div>
        <Link
          href={`/compare?ids=${press.id}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted hover:text-accent hover:border-accent"
          title="افزودن به مقایسه"
        >
          <Plus size={14} />
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <Spec label="ظرفیت نهایی" value={`${formatNumber(press.capacityFullKgf)} kgf`} />
        <Spec label="بدنه" value={press.frameMaterial === "cast-iron" ? "چدنی" : "آهنی"} />
        <Spec label="ابعاد میز" value={press.tableSizeMm ?? press.plateSizeMm ?? "—"} />
        <Spec label="فاصله محور" value={press.throatDepthMm ? `${press.throatDepthMm}mm` : "—"} />
      </div>

      {utilizationPercent != null && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[11px] text-muted">
            <span>درصد استفاده از ظرفیت</span>
            <span>{utilizationPercent.toFixed(0)}٪</span>
          </div>
          <ProgressBar percent={utilizationPercent} tone={utilizationPercent > 100 ? "danger" : utilizationPercent > 90 ? "warn" : "good"} />
        </div>
      )}

      {(reasonsFa.length > 0 || warningsFa.length > 0 || exclusionReasonsFa.length > 0) && (
        <div className="mt-3">
          <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1 text-xs font-medium text-accent">
            چرا این دستگاه؟ <ChevronDown size={13} className={cn("transition-transform", open && "rotate-180")} />
          </button>
          {open && (
            <ul className="mt-2 space-y-1.5 text-xs">
              {exclusionReasonsFa.map((r, i) => (
                <li key={`e${i}`} className="flex gap-1.5 text-danger">
                  <span>✕</span>
                  <span>{r}</span>
                </li>
              ))}
              {warningsFa.map((r, i) => (
                <li key={`w${i}`} className="flex gap-1.5 text-warn">
                  <span>!</span>
                  <span>{r}</span>
                </li>
              ))}
              {reasonsFa.map((r, i) => (
                <li key={`r${i}`} className="flex gap-1.5 text-good">
                  <span>✓</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-surface-2 px-2 py-1.5">
      <div className="text-[10px] text-muted">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

export function CompareAllButton({ ids }: { ids: string[] }) {
  if (!ids.length) return null;
  return (
    <Link href={`/compare?ids=${ids.join(",")}`}>
      <Button variant="outline" size="sm">
        مقایسه {ids.length} مدل برتر
      </Button>
    </Link>
  );
}
