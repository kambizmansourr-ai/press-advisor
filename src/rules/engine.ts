import { PressModel, DriveType, FrameMaterial } from "@/types/press";
import { pressModels } from "@/data/presses";
import { pressSeries, getSeriesById } from "@/data/series";
import { getApplicationById } from "@/data/applications";

export interface RecommendationQuery {
  applicationId?: string;
  requiredForceKgf?: number;
  partWidthMm?: number;
  partDepthMm?: number;
  partHeightMm?: number;
  throatNeededMm?: number;
  strokeNeededMm?: number;
  bodyPreference?: FrameMaterial | "any";
  driveTypePreference?: DriveType | "any";
}

export type RecommendationStatus = "recommended" | "marginal" | "excluded";

export interface RecommendationResult {
  press: PressModel;
  seriesNameFa: string;
  status: RecommendationStatus;
  score: number;
  utilizationPercent?: number;
  reasonsFa: string[];
  warningsFa: string[];
  exclusionReasonsFa: string[];
}

function parseTableSize(size?: string): { a: number; b: number } | null {
  if (!size) return null;
  const parts = size.split(/[×xX]/).map((p) => parseFloat(p.trim()));
  if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) return null;
  return { a: parts[0], b: parts[1] };
}

function maxPowerStroke(press: PressModel): number | undefined {
  if (!press.strokeOptions || press.strokeOptions.length === 0) return undefined;
  const values = press.strokeOptions.map((s) => s.powerMm).filter((v): v is number => v != null);
  return values.length ? Math.max(...values) : undefined;
}

export function recommendPresses(query: RecommendationQuery): RecommendationResult[] {
  const application = query.applicationId ? getApplicationById(query.applicationId) : undefined;
  const candidatePool = application
    ? pressModels.filter((p) => application.recommendedSeriesIds.includes(p.seriesId))
    : pressModels;

  const results: RecommendationResult[] = candidatePool.map((press) => {
    const series = getSeriesById(press.seriesId);
    const reasonsFa: string[] = [];
    const warningsFa: string[] = [];
    const exclusionReasonsFa: string[] = [];
    let score = 60; // baseline before adjustments

    if (application) {
      const rank = application.recommendedSeriesIds.indexOf(press.seriesId);
      score += (application.recommendedSeriesIds.length - rank) * 4;
      reasonsFa.push(`سری ${series?.code} برای کاربرد «${application.nameFa}» در کاتالوگ ارس زنجان توصیه‌شده است.`);
    }

    // --- Force / capacity check ---
    let utilizationPercent: number | undefined;
    if (query.requiredForceKgf != null && query.requiredForceKgf > 0) {
      utilizationPercent = (query.requiredForceKgf / press.capacityFullKgf) * 100;
      if (utilizationPercent > 100) {
        exclusionReasonsFa.push(
          `نیروی موردنیاز (${Math.round(query.requiredForceKgf)} kgf) از ظرفیت این دستگاه (${press.capacityFullKgf} kgf) بیشتر است.`
        );
      } else if (utilizationPercent > 90) {
        warningsFa.push("دستگاه نزدیک به سقف ظرفیت خود کار می‌کند؛ برای کار مداوم/تولید انبوه مدل بزرگ‌تری در نظر بگیرید.");
        score += 6;
      } else if (utilizationPercent >= 25) {
        reasonsFa.push(`استفاده از حدود ${utilizationPercent.toFixed(0)}٪ ظرفیت — بازه اقتصادی و ایمن.`);
        score += 20;
      } else if (utilizationPercent >= 5) {
        warningsFa.push("دستگاه نسبت به نیاز کمی بزرگ است؛ مدل کوچک‌تر ممکن است مقرون‌به‌صرفه‌تر باشد.");
        score += 8;
      } else {
        warningsFa.push("این دستگاه بسیار بزرگ‌تر از نیروی موردنیاز است — انتخاب غیراقتصادی.");
        score -= 15;
      }
    }

    // --- Table footprint check ---
    if (query.partWidthMm != null && query.partDepthMm != null) {
      const table = parseTableSize(press.tableSizeMm);
      if (table) {
        const fits =
          (query.partWidthMm <= table.a && query.partDepthMm <= table.b) ||
          (query.partWidthMm <= table.b && query.partDepthMm <= table.a);
        if (!fits) {
          exclusionReasonsFa.push(
            `ابعاد میز (${press.tableSizeMm}mm) برای قطعه ${query.partWidthMm}×${query.partDepthMm}mm کافی نیست.`
          );
        } else {
          reasonsFa.push(`ابعاد میز (${press.tableSizeMm}mm) قطعه را در خود جای می‌دهد.`);
        }
      }
    }

    // --- Throat depth check ---
    if (query.throatNeededMm != null && press.throatDepthMm != null) {
      if (press.throatDepthMm < query.throatNeededMm) {
        warningsFa.push(
          `فاصله محور تا بدنه (${press.throatDepthMm}mm) کمتر از عمق موردنیاز قطعه (${query.throatNeededMm}mm) است — دسترسی ممکن است محدود شود.`
        );
        score -= 10;
      } else {
        reasonsFa.push(`فاصله محور تا بدنه (${press.throatDepthMm}mm) برای دسترسی به قطعه کافی است.`);
      }
    }

    // --- Daylight / part height check ---
    if (query.partHeightMm != null && press.daylightRangeMm) {
      const [minD, maxD] = press.daylightRangeMm;
      if (query.partHeightMm < minD || query.partHeightMm > maxD) {
        warningsFa.push(
          `ارتفاع قطعه/قالب (${query.partHeightMm}mm) خارج از بازه قابل تنظیم میز (${minD}–${maxD}mm) است.`
        );
        score -= 10;
      } else {
        reasonsFa.push(`بازه ارتفاع قابل تنظیم میز (${minD}–${maxD}mm) با ارتفاع قطعه سازگار است.`);
      }
    }

    // --- Stroke check ---
    if (query.strokeNeededMm != null) {
      const maxStroke = maxPowerStroke(press);
      if (maxStroke != null && maxStroke < query.strokeNeededMm) {
        warningsFa.push(`کورس قدرتی حداکثر (${maxStroke}mm) ممکن است برای این کار (${query.strokeNeededMm}mm) کافی نباشد.`);
        score -= 8;
      }
    }

    // --- Preferences (soft) ---
    if (query.bodyPreference && query.bodyPreference !== "any") {
      if (press.frameMaterial === query.bodyPreference) {
        score += 5;
      } else {
        warningsFa.push(
          press.frameMaterial === "cast-iron"
            ? "بدنه این مدل چدنی است (ترجیح شما بدنه آهنی بود)."
            : "بدنه این مدل آهنی (فولادی جوشی) است (ترجیح شما بدنه چدنی بود)."
        );
      }
    }
    if (query.driveTypePreference && query.driveTypePreference !== "any" && series) {
      if (series.driveType === query.driveTypePreference) {
        score += 5;
      }
    }

    if (press.lowConfidence) {
      warningsFa.push("برخی ابعاد این مدل در منبع اصلی با اطمینان کامل قابل خواندن نبود — پیش از سفارش با ارس زنجان تایید شود.");
    }

    const status: RecommendationStatus = exclusionReasonsFa.length > 0 ? "excluded" : warningsFa.length > 1 ? "marginal" : "recommended";

    return {
      press,
      seriesNameFa: series?.nameFa ?? press.seriesId,
      status,
      score: Math.max(0, Math.round(score)),
      utilizationPercent,
      reasonsFa,
      warningsFa,
      exclusionReasonsFa,
    };
  });

  return results.sort((a, b) => {
    if (a.status !== b.status) {
      const order: Record<RecommendationStatus, number> = { recommended: 0, marginal: 1, excluded: 2 };
      return order[a.status] - order[b.status];
    }
    return b.score - a.score;
  });
}

export function allSeriesCoverage() {
  return pressSeries.map((series) => ({
    series,
    modelCount: pressModels.filter((p) => p.seriesId === series.id).length,
    minForce: Math.min(...pressModels.filter((p) => p.seriesId === series.id).map((p) => p.capacityFullKgf)),
    maxForce: Math.max(...pressModels.filter((p) => p.seriesId === series.id).map((p) => p.capacityFullKgf)),
  }));
}
