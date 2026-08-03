"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, SectionTitle, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { InsertShapeIllustration } from "@/components/illustrations/insertShape";
import {
  insertShapes,
  insertClearances,
  insertTolerances,
  insertGeometries,
  insertSizesMetric,
  insertThicknessesMetric,
  insertCornersMetric,
  DesignationOption,
} from "@/data/insertDesignation";
import {
  recommendInsert,
  getSmartTips,
  operationLabels,
  materialLabels,
  priorityLabels,
  InsertOperation,
  InsertMaterialGroup,
  InsertPriority,
} from "@/rules/insertEngine";
import { Gift, Info, Sparkles } from "lucide-react";

const operationGroups: { groupFa: string; ops: InsertOperation[] }[] = [
  { groupFa: "تراشکاری", ops: ["turning-ext", "turning-int", "facing", "grooving"] },
  { groupFa: "فرزکاری و سوراخ‌کاری", ops: ["face-milling", "shoulder-milling", "drilling"] },
];

const materialKeys = Object.keys(materialLabels) as InsertMaterialGroup[];
const priorityKeys = Object.keys(priorityLabels) as InsertPriority[];

export default function InsertSelectorPage() {
  const [operation, setOperation] = useState<InsertOperation | null>(null);
  const [material, setMaterial] = useState<InsertMaterialGroup>("steel");
  const [priority, setPriority] = useState<InsertPriority>("general");
  const [depthOfCutMm, setDepthOfCutMm] = useState<string>("");
  const [feedMmRev, setFeedMmRev] = useState<string>("");

  const engineInput = useMemo(
    () =>
      operation
        ? {
            operation,
            material,
            priority,
            depthOfCutMm: depthOfCutMm ? Number(depthOfCutMm) : undefined,
            feedMmRev: feedMmRev ? Number(feedMmRev) : undefined,
          }
        : null,
    [operation, material, priority, depthOfCutMm, feedMmRev]
  );

  const recommendation = useMemo(() => (engineInput ? recommendInsert(engineInput) : null), [engineInput]);
  const smartTips = useMemo(() => (engineInput ? getSmartTips(engineInput) : []), [engineInput]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 max-w-3xl">
        <Badge tone="accent">
          <Gift size={12} /> ابزار رایگان مهندسی
        </Badge>
        <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">راهنمای انتخاب اینسرت کاربایدی (استاندارد ANSI/ISO)</h1>
        <p className="mt-2 text-sm text-muted">
          به‌جای حفظ‌کردن کدگذاری استاندارد اینسرت، فرآیند ماشین‌کاری، جنس قطعه و اولویت خود را انتخاب کنید تا سیستم یک کد شروع
          منطقی (مثل CNMG 120408) با استدلال مهندسی پیشنهاد دهد. این ابزار رایگان توسط تیم مهندسی ارس زنجان برای هر ماشین‌کار و
          طراح قالب در اختیار قرار گرفته است.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <Card className="p-5">
            <SectionTitle eyebrow="مرحله ۱" title="نوع عملیات ماشین‌کاری" />
            <div className="space-y-4">
              {operationGroups.map((g) => (
                <div key={g.groupFa}>
                  <div className="mb-2 text-xs font-semibold text-muted">{g.groupFa}</div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {g.ops.map((op) => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => setOperation(op)}
                        className={cn(
                          "rounded-lg border p-3 text-right text-xs font-medium transition-colors",
                          operation === op
                            ? "border-accent bg-accent-soft text-accent-strong"
                            : "border-border bg-surface hover:border-accent/50 hover:bg-surface-2"
                        )}
                      >
                        {operationLabels[op].fa}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {operation && (
            <Card className="p-5">
              <SectionTitle eyebrow="مرحله ۲" title="جنس قطعه کار و اولویت فرآیند" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted">جنس قطعه کار</span>
                  <select
                    value={material}
                    onChange={(e) => setMaterial(e.target.value as InsertMaterialGroup)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                  >
                    {materialKeys.map((m) => (
                      <option key={m} value={m}>
                        {materialLabels[m].fa} (گروه ISO {materialLabels[m].isoGroup})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted">اولویت فرآیند</span>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as InsertPriority)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                  >
                    {priorityKeys.map((p) => (
                      <option key={p} value={p}>
                        {priorityLabels[p]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted">عمق برش تقریبی (اختیاری)</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={depthOfCutMm}
                      onChange={(e) => setDepthOfCutMm(e.target.value)}
                      placeholder="مثلاً ۲"
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                    />
                    <span className="text-xs text-muted">mm</span>
                  </div>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted">پیشروی تقریبی (اختیاری)</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step={0.01}
                      value={feedMmRev}
                      onChange={(e) => setFeedMmRev(e.target.value)}
                      placeholder="مثلاً ۰.۲"
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                    />
                    <span className="text-xs text-muted">mm/rev</span>
                  </div>
                </label>
              </div>
              <p className="mt-3 flex items-start gap-1.5 text-[11px] text-muted">
                <Info size={13} className="mt-0.5 shrink-0" />
                در صورت خالی بودن عمق برش/پیشروی، مقادیر معمول همان اولویت انتخابی به‌طور خودکار فرض می‌شود.
              </p>

              {smartTips.length > 0 && (
                <div className="mt-4 space-y-1.5 rounded-lg border border-accent/30 bg-accent-soft p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-accent-strong">
                    <Sparkles size={13} /> نکات هوشمند برای این انتخاب
                  </div>
                  <ul className="space-y-1">
                    {smartTips.map((tip, i) => (
                      <li key={i} className="text-[11px] leading-relaxed text-accent-strong">
                        • {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )}

          <ReferenceChart />
        </div>

        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {!operation && (
            <Card className="p-5 text-sm text-muted">ابتدا نوع عملیات ماشین‌کاری را از مرحله ۱ انتخاب کنید تا کد پیشنهادی نمایش داده شود.</Card>
          )}

          {operation && recommendation && (
            <>
              <Card className="p-5">
                <div className="mb-1 text-xs text-muted">کد اینسرت پیشنهادی</div>
                <div dir="ltr" className="mb-4 text-3xl font-extrabold tracking-wider text-accent-strong">
                  {recommendation.designationCode}
                </div>

                <div className="mb-4">
                  <InsertShapeIllustration shapeCode={recommendation.shape.code} />
                </div>

                <div className="space-y-2.5">
                  {[
                    { label: "شکل", field: recommendation.shape },
                    { label: "زاویه آزاد", field: recommendation.clearance },
                    { label: "کلاس تلورانس", field: recommendation.tolerance },
                    { label: "هندسه/شکن‌براده", field: recommendation.geometry },
                    { label: "قطر داخلی (IC)", field: recommendation.size },
                    { label: "ضخامت", field: recommendation.thickness },
                    { label: "شعاع نوک", field: recommendation.corner },
                  ].map((row) => (
                    <div key={row.label} className="rounded-lg border border-border bg-surface-2 p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">
                          {row.label} <span dir="ltr" className="font-mono text-accent-strong">({row.field.code})</span>
                        </span>
                        <span className="text-[11px] text-muted">{row.field.labelFa}</span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted">{row.field.reasonFa}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-lg bg-accent-soft p-3 text-xs text-accent-strong">
                  <div className="mb-1 font-semibold">توصیه گرید و پوشش</div>
                  {recommendation.gradeAdviceFa}
                </div>

                {recommendation.notesFa.length > 0 && (
                  <ul className="mt-3 space-y-1 border-t border-border/60 pt-3">
                    {recommendation.notesFa.map((n, i) => (
                      <li key={i} className="text-[10px] text-muted">
                        • {n}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card className="p-4 text-xs text-muted">
                این ابزار رایگان توسط تیم مهندسی <span className="font-semibold text-foreground">ارس زنجان (AZCO)</span> در
                اختیار جامعه ماشین‌کاری و قالب‌سازی قرار گرفته است. برای پرس‌های هیدروپنوماتیک، پنوماتیک و اجزای استاندارد
                قالب، به{" "}
                <Link href="/catalog" className="font-medium text-accent hover:underline">
                  کاتالوگ محصولات ما
                </Link>{" "}
                سر بزنید.
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function OptionTable({ title, options }: { title: string; options: DesignationOption[] }) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold text-muted">{title}</div>
      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {options.map((o) => (
          <div key={o.code} className="flex items-baseline gap-2 rounded-md bg-surface-2 px-2 py-1.5 text-[11px]">
            <span dir="ltr" className="shrink-0 rounded bg-surface px-1.5 py-0.5 font-mono font-bold text-accent-strong">
              {o.code}
            </span>
            <span className="text-muted">
              {o.labelFa}
              {o.detailFa && <span dir="ltr" className="mr-1 text-[10px]"> — {o.detailFa}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReferenceChart() {
  return (
    <Card className="p-5">
      <SectionTitle
        eyebrow="مرجع کامل"
        title="جدول کدگذاری اینسرت (ANSI/ISO)"
        description="ترتیب کد: شکل–زاویه آزاد–کلاس تلورانس–هندسه · قطر داخلی–ضخامت–شعاع نوک (مثال: CNMG 120408)."
      />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <OptionTable title="شکل (Shape)" options={insertShapes} />
        <OptionTable title="زاویه آزاد (Clearance)" options={insertClearances} />
        <OptionTable title="کلاس تلورانس (Tolerance)" options={insertTolerances} />
        <OptionTable title="هندسه/شکن‌براده (Geometry)" options={insertGeometries} />
        <OptionTable title="قطر داخلی — IC، متریک ISO (Size)" options={insertSizesMetric} />
        <OptionTable title="ضخامت، متریک ISO (Thickness)" options={insertThicknessesMetric} />
        <OptionTable title="شعاع نوک، متریک ISO (Corner)" options={insertCornersMetric} />
      </div>
      <p className="mt-4 text-[11px] text-muted">
        هندسه: کدهای B، C، H، J زاویه سوراخ کشویی بین ۷۰ تا ۹۰ درجه دارند؛ کدهای Q، T، U، W بین ۴۰ تا ۶۰ درجه.
      </p>
    </Card>
  );
}
