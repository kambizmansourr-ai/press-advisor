"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, SectionTitle, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { InsertShapeIllustration } from "@/components/illustrations/insertShape";
import {
  insertShapes,
  insertClearances,
  insertTolerances,
  insertGeometries,
  insertSizesMetric,
  insertThicknessesMetric,
  insertCornersMetric,
  optionLabel,
  optionDetail,
  DesignationOption,
} from "@/data/insertDesignation";
import {
  recommendInsert,
  getSmartTips,
  operationLabels,
  materialLabels,
  priorityLabels,
  priorityLabelsEn,
  InsertOperation,
  InsertMaterialGroup,
  InsertPriority,
} from "@/rules/insertEngine";
import { Gift, Info, Sparkles } from "lucide-react";

const operationGroups: { groupFa: string; groupEn: string; ops: InsertOperation[] }[] = [
  { groupFa: "تراشکاری", groupEn: "Turning", ops: ["turning-ext", "turning-int", "facing", "grooving"] },
  { groupFa: "فرزکاری و سوراخ‌کاری", groupEn: "Milling and drilling", ops: ["face-milling", "shoulder-milling", "drilling"] },
];

const materialKeys = Object.keys(materialLabels) as InsertMaterialGroup[];
const priorityKeys = Object.keys(priorityLabels) as InsertPriority[];

export default function InsertSelectorPage() {
  const { lang, t } = useLang();
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

  const recommendation = useMemo(() => (engineInput ? recommendInsert(engineInput, lang) : null), [engineInput, lang]);
  const smartTips = useMemo(() => (engineInput ? getSmartTips(engineInput, lang) : []), [engineInput, lang]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 max-w-3xl">
        <Badge tone="accent">
          <Gift size={12} /> {t("ابزار رایگان مهندسی", "Free engineering tool")}
        </Badge>
        <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">
          {t("راهنمای انتخاب اینسرت کاربایدی (استاندارد ANSI/ISO)", "Carbide Insert Selection Guide (ANSI/ISO Standard)")}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {t(
            "به‌جای حفظ‌کردن کدگذاری استاندارد اینسرت، فرآیند ماشین‌کاری، جنس قطعه و اولویت خود را انتخاب کنید تا سیستم یک کد شروع منطقی (مثل CNMG 120408) با استدلال مهندسی پیشنهاد دهد. این ابزار رایگان توسط تیم مهندسی ارس زنجان برای هر ماشین‌کار و طراح قالب در اختیار قرار گرفته است.",
            "Instead of memorizing the standard insert designation system, choose your machining operation, workpiece material and priority, and the system will suggest a sensible starting code (e.g. CNMG 120408) with the engineering reasoning behind it. This free tool is provided by the Aras Zanjan engineering team for every machinist and die designer."
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <Card className="p-5">
            <SectionTitle eyebrow={t("مرحله ۱", "Step 1")} title={t("نوع عملیات ماشین‌کاری", "Machining operation")} />
            <div className="space-y-4">
              {operationGroups.map((g) => (
                <div key={g.groupFa}>
                  <div className="mb-2 text-xs font-semibold text-muted">{t(g.groupFa, g.groupEn)}</div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {g.ops.map((op) => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => setOperation(op)}
                        className={cn(
                          "rounded-lg border p-3 text-start text-xs font-medium transition-colors",
                          operation === op
                            ? "border-accent bg-accent-soft text-accent-strong"
                            : "border-border bg-surface hover:border-accent/50 hover:bg-surface-2"
                        )}
                      >
                        {t(operationLabels[op].fa, operationLabels[op].en)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {operation && (
            <Card className="p-5">
              <SectionTitle
                eyebrow={t("مرحله ۲", "Step 2")}
                title={t("جنس قطعه کار و اولویت فرآیند", "Workpiece material and process priority")}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted">{t("جنس قطعه کار", "Workpiece material")}</span>
                  <select
                    value={material}
                    onChange={(e) => setMaterial(e.target.value as InsertMaterialGroup)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                  >
                    {materialKeys.map((m) => (
                      <option key={m} value={m}>
                        {t(
                          `${materialLabels[m].fa} (گروه ISO ${materialLabels[m].isoGroup})`,
                          `${materialLabels[m].en} (ISO group ${materialLabels[m].isoGroup})`
                        )}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted">{t("اولویت فرآیند", "Process priority")}</span>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as InsertPriority)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                  >
                    {priorityKeys.map((p) => (
                      <option key={p} value={p}>
                        {t(priorityLabels[p], priorityLabelsEn[p])}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted">
                    {t("عمق برش تقریبی (اختیاری)", "Approximate depth of cut (optional)")}
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={depthOfCutMm}
                      onChange={(e) => setDepthOfCutMm(e.target.value)}
                      placeholder={t("مثلاً ۲", "e.g. 2")}
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                    />
                    <span className="text-xs text-muted">mm</span>
                  </div>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted">
                    {t("پیشروی تقریبی (اختیاری)", "Approximate feed (optional)")}
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step={0.01}
                      value={feedMmRev}
                      onChange={(e) => setFeedMmRev(e.target.value)}
                      placeholder={t("مثلاً ۰.۲", "e.g. 0.2")}
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                    />
                    <span className="text-xs text-muted">mm/rev</span>
                  </div>
                </label>
              </div>
              <p className="mt-3 flex items-start gap-1.5 text-[11px] text-muted">
                <Info size={13} className="mt-0.5 shrink-0" />
                {t(
                  "در صورت خالی بودن عمق برش/پیشروی، مقادیر معمول همان اولویت انتخابی به‌طور خودکار فرض می‌شود.",
                  "If depth of cut / feed is left empty, typical values for the selected priority are assumed automatically."
                )}
              </p>

              {smartTips.length > 0 && (
                <div className="mt-4 space-y-1.5 rounded-lg border border-accent/30 bg-accent-soft p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-accent-strong">
                    <Sparkles size={13} /> {t("نکات هوشمند برای این انتخاب", "Smart tips for this selection")}
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
            <Card className="p-5 text-sm text-muted">
              {t(
                "ابتدا نوع عملیات ماشین‌کاری را از مرحله ۱ انتخاب کنید تا کد پیشنهادی نمایش داده شود.",
                "First choose the machining operation in Step 1 to see the suggested insert code."
              )}
            </Card>
          )}

          {operation && recommendation && (
            <>
              <Card className="p-5">
                <div className="mb-1 text-xs text-muted">{t("کد اینسرت پیشنهادی", "Suggested insert designation")}</div>
                <div dir="ltr" className="mb-4 text-3xl font-extrabold tracking-wider text-accent-strong">
                  {recommendation.designationCode}
                </div>

                <div className="mb-4">
                  <InsertShapeIllustration shapeCode={recommendation.shape.code} />
                </div>

                <div className="space-y-2.5">
                  {[
                    { label: t("شکل", "Shape"), field: recommendation.shape },
                    { label: t("زاویه آزاد", "Relief angle"), field: recommendation.clearance },
                    { label: t("کلاس تلورانس", "Tolerance class"), field: recommendation.tolerance },
                    { label: t("هندسه/شکن‌براده", "Geometry / chipbreaker"), field: recommendation.geometry },
                    { label: t("قطر داخلی (IC)", "Inscribed circle (IC)"), field: recommendation.size },
                    { label: t("ضخامت", "Thickness"), field: recommendation.thickness },
                    { label: t("شعاع نوک", "Nose radius"), field: recommendation.corner },
                  ].map((row) => (
                    <div key={row.label} className="rounded-lg border border-border bg-surface-2 p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold">
                          {row.label} <span dir="ltr" className="font-mono text-accent-strong">({row.field.code})</span>
                        </span>
                        <span className="text-[11px] text-muted">{row.field.label}</span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted">{row.field.reason}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-lg bg-accent-soft p-3 text-xs text-accent-strong">
                  <div className="mb-1 font-semibold">{t("توصیه گرید و پوشش", "Grade and coating recommendation")}</div>
                  {recommendation.gradeAdvice}
                </div>

                {recommendation.notes.length > 0 && (
                  <ul className="mt-3 space-y-1 border-t border-border/60 pt-3">
                    {recommendation.notes.map((n, i) => (
                      <li key={i} className="text-[10px] text-muted">
                        • {n}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card className="p-4 text-xs text-muted">
                {lang === "fa" ? (
                  <>
                    این ابزار رایگان توسط تیم مهندسی <span className="font-semibold text-foreground">ارس زنجان (AZCO)</span> در
                    اختیار جامعه ماشین‌کاری و قالب‌سازی قرار گرفته است. برای پرس‌های هیدروپنوماتیک، پنوماتیک و اجزای استاندارد
                    قالب، به{" "}
                    <Link href="/catalog" className="font-medium text-accent hover:underline">
                      کاتالوگ محصولات ما
                    </Link>{" "}
                    سر بزنید.
                  </>
                ) : (
                  <>
                    This free tool is provided to the machining and die-making community by the engineering team of{" "}
                    <span className="font-semibold text-foreground">Aras Zanjan (AZCO)</span>. For hydropneumatic and pneumatic presses
                    and standard die components, visit our{" "}
                    <Link href="/catalog" className="font-medium text-accent hover:underline">
                      product catalogue
                    </Link>
                    .
                  </>
                )}
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function OptionTable({ title, options }: { title: string; options: DesignationOption[] }) {
  const { lang } = useLang();
  return (
    <div>
      <div className="mb-2 text-xs font-semibold text-muted">{title}</div>
      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {options.map((o) => {
          const detail = optionDetail(o, lang);
          return (
            <div key={o.code} className="flex items-baseline gap-2 rounded-md bg-surface-2 px-2 py-1.5 text-[11px]">
              <span dir="ltr" className="shrink-0 rounded bg-surface px-1.5 py-0.5 font-mono font-bold text-accent-strong">
                {o.code}
              </span>
              <span className="text-muted">
                {optionLabel(o, lang)}
                {detail && (
                  <span className="ms-1 text-[10px]">
                    <span dir="ltr"> — {detail}</span>
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReferenceChart() {
  const { t } = useLang();
  return (
    <Card className="p-5">
      <SectionTitle
        eyebrow={t("مرجع کامل", "Full reference")}
        title={t("جدول کدگذاری اینسرت (ANSI/ISO)", "Insert designation chart (ANSI/ISO)")}
        description={t(
          "ترتیب کد: شکل–زاویه آزاد–کلاس تلورانس–هندسه · قطر داخلی–ضخامت–شعاع نوک (مثال: CNMG 120408).",
          "Code order: shape – relief angle – tolerance class – geometry · inscribed circle – thickness – nose radius (example: CNMG 120408)."
        )}
      />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <OptionTable title={t("شکل (Shape)", "Shape")} options={insertShapes} />
        <OptionTable title={t("زاویه آزاد (Clearance)", "Relief angle (Clearance)")} options={insertClearances} />
        <OptionTable title={t("کلاس تلورانس (Tolerance)", "Tolerance class")} options={insertTolerances} />
        <OptionTable title={t("هندسه/شکن‌براده (Geometry)", "Geometry / chipbreaker")} options={insertGeometries} />
        <OptionTable title={t("قطر داخلی — IC، متریک ISO (Size)", "Inscribed circle — IC, ISO metric (Size)")} options={insertSizesMetric} />
        <OptionTable title={t("ضخامت، متریک ISO (Thickness)", "Thickness, ISO metric")} options={insertThicknessesMetric} />
        <OptionTable title={t("شعاع نوک، متریک ISO (Corner)", "Nose radius, ISO metric (Corner)")} options={insertCornersMetric} />
      </div>
      <p className="mt-4 text-[11px] text-muted">
        {t(
          "هندسه: کدهای B، C، H، J زاویه سوراخ کشویی بین ۷۰ تا ۹۰ درجه دارند؛ کدهای Q، T، U، W بین ۴۰ تا ۶۰ درجه.",
          "Geometry: codes B, C, H and J have a countersunk hole angle of 70 to 90 degrees; codes Q, T, U and W have 40 to 60 degrees."
        )}
      </p>
    </Card>
  );
}
