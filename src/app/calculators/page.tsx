"use client";

import { useMemo, useState } from "react";
import { Card, SectionTitle } from "@/components/ui";
import { materials } from "@/data/materials";
import { getMaterialById, tensileAvg } from "@/data/materials";
import {
  calcPunchingForce,
  calcBendingForce,
  calcPressFitForce,
  calcRivetingForce,
  calcCoiningForce,
} from "@/calculators/forceCalculators";
import { formatNumber, cn } from "@/lib/utils";
import { EngineeringCalcPanel } from "@/components/EngineeringCalcPanel";
import {
  PunchingIllustration,
  BendingIllustration,
  PressFitIllustration,
  RivetingIllustration,
  CoiningIllustration,
} from "@/components/illustrations/simpleCalcs";
import BulkForming from "@/calculators/bulkForming.js";
import SheetForming from "@/calculators/sheetForming.js";
import InjectionMolding from "@/calculators/injectionMolding.js";
import { Compass } from "lucide-react";
import { useLang } from "@/lib/i18n";

type Tab = "punching" | "bending" | "pressFit" | "riveting" | "coining" | "sheetForming" | "bulkForming" | "injectionMolding";

const tabs: { id: Tab; label: string; labelEn: string; whenToUse: string; whenToUseEn: string }[] = [
  {
    id: "punching",
    label: "نیروی پانچ/برش",
    whenToUse: "کِی استفاده کنید: سوراخ‌کاری یا برش ساده یک شکل (دایره/مستطیل) از ورق فلزی نازک با سنبه و ماتریس — پیش از انتخاب پرس برای عملیات پانچ یا بلانکینگ ساده.",
    labelEn: "Punching / Shearing Force",
    whenToUseEn: "When to use: piercing or simple blanking of a single shape (circle/rectangle) from thin sheet metal with a punch and die — before selecting a press for simple punching or blanking operations.",
  },
  {
    id: "bending",
    label: "نیروی خم (V)",
    whenToUse: "کِی استفاده کنید: تخمین سریع نیروی لازم برای یک خم ساده تک‌مرحله‌ای با قالب V در پرس — برای انتخاب تناژ، نه طراحی دقیق قالب.",
    labelEn: "V-Bending Force",
    whenToUseEn: "When to use: quick estimate of the force for a simple single-stage V-die bend in a press — for selecting tonnage, not for detailed die design.",
  },
  {
    id: "pressFit",
    label: "نیروی پرس‌فیت",
    whenToUse: "کِی استفاده کنید: جای‌گذاری فشاری یک قطعه استوانه‌ای (بوش، یاتاقان، پین، میل راهنما) با تداخل قطری داخل یک سوراخ.",
    labelEn: "Press-Fit Force",
    whenToUseEn: "When to use: pressing a cylindrical part (bush, bearing, pin, guide pillar) with diametral interference into a bore.",
  },
  {
    id: "riveting",
    label: "نیروی پرچ‌کاری",
    whenToUse: "کِی استفاده کنید: تخمین نیروی لازم برای فرم‌دهی سرد سر یک پرچ فلزی جهت اتصال دو یا چند ورق.",
    labelEn: "Riveting Force",
    whenToUseEn: "When to use: estimating the force needed to cold-head a metal rivet to join two or more sheets.",
  },
  {
    id: "coining",
    label: "نیروی کوینینگ/امباس",
    whenToUse: "کِی استفاده کنید: تخمین نیروی لازم برای حک یا فرم‌دهی سطحی کم‌عمق (مارک‌زنی، لوگو، امباس) بر اساس سطح تصویرشده نقش.",
    labelEn: "Coining / Embossing Force",
    whenToUseEn: "When to use: estimating the force for marking or shallow surface forming (marking, logo, embossing) from the projected area of the impression.",
  },
  {
    id: "sheetForming",
    label: "فرم‌دهی و برش ورق (پیشرفته)",
    whenToUse: "کِی استفاده کنید: طراحی دقیق‌تر قالب و فرآیند برای قطعات ورقی — شامل لقی و ابزار برش، طول خم و برگشت فنری، و کشش عمیق (قطر بلانک، امکان‌سنجی، برنامه چندمرحله‌ای). وقتی محاسبه‌های ساده بالا کافی نیستند از این استفاده کنید.",
    labelEn: "Sheet Forming & Cutting (Advanced)",
    whenToUseEn: "When to use: more detailed die and process design for sheet-metal parts — including cutting clearance and tooling, bend allowance and springback, and deep drawing (blank diameter, feasibility, multi-stage plan). Use it when the simple calculators above are not enough.",
  },
  {
    id: "bulkForming",
    label: "فرم‌دهی حجمی (فورجینگ/نورد/اکستروژن/کشش)",
    whenToUse: "کِی استفاده کنید: قطعه از یک شمش یا میلگرد توپر ساخته می‌شود، نه از ورق — فورجینگ آزاد/قالب بسته، نورد تخت، اکستروژن یا کشش مفتول و میله.",
    labelEn: "Bulk Forming (Forging / Rolling / Extrusion / Drawing)",
    whenToUseEn: "When to use: the part is made from a solid billet or bar, not from sheet — open-die or closed-die forging, flat rolling, extrusion, or wire and rod drawing.",
  },
  {
    id: "injectionMolding",
    label: "قالب‌گیری تزریقی پلاستیک",
    whenToUse: "کِی استفاده کنید: قطعه از جنس پلاستیک و با فرآیند تزریق ساخته می‌شود — انتخاب ماشین تزریق، زمان سیکل، تعداد حفره، سیستم تغذیه (رانر/گیت) و جزئیات قالب.",
    labelEn: "Plastic Injection Molding",
    whenToUseEn: "When to use: the part is plastic and made by injection molding — machine selection, cycle time, number of cavities, feed system (runner/gate) and mold detail design.",
  },
];

function UseCaseNote({ text }: { text: string }) {
  return (
    <div className="mb-4 flex gap-2 rounded-lg border border-border bg-surface-2 p-3 text-xs text-muted">
      <Compass size={14} className="mt-0.5 shrink-0 text-accent" />
      <p>{text}</p>
    </div>
  );
}

function ResultBox({ forceKgf, formulaFa, assumptionsFa }: { forceKgf: number; formulaFa: string; assumptionsFa: string[] }) {
  const { lang, t } = useLang();
  return (
    <div className="rounded-lg border border-accent/30 bg-accent-soft p-4">
      <div className="text-xs text-muted">{t("نیروی موردنیاز", "Required force")}</div>
      <div className="text-2xl font-extrabold text-accent-strong">
        {Number.isFinite(forceKgf) ? formatNumber(forceKgf, lang) : "—"} <span className="text-sm font-medium">kgf</span>
      </div>
      <div className="mt-3 rounded bg-surface/60 p-2 text-[11px] leading-relaxed">{formulaFa}</div>
      <ul className="mt-2 space-y-1">
        {assumptionsFa.map((a, i) => (
          <li key={i} className="text-[10px] text-muted">
            • {a}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Field({
  label,
  unit,
  value,
  onChange,
  step = 0.1,
}: {
  label: string;
  unit?: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex justify-between text-xs font-medium text-muted">
        <span>{label}</span>
        {unit && <span>{unit}</span>}
      </span>
      <input
        type="number"
        step={step}
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => onChange(e.target.valueAsNumber)}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
      />
    </label>
  );
}

function MaterialSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { lang, t } = useLang();
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{t("جنس ماده", "Material")}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm">
        {materials.map((m) => (
          <option key={m.id} value={m.id}>
            {lang === "en" ? m.labelEn : `${m.nameFa} (${m.nameEn})`} — {m.tensileMinMPa}-{m.tensileMaxMPa} MPa
          </option>
        ))}
      </select>
    </label>
  );
}

export default function CalculatorsPage() {
  const [tab, setTab] = useState<Tab>("punching");
  const { lang, t } = useLang();
  const activeTab = tabs.find((x) => x.id === tab)!;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <SectionTitle
        eyebrow={t("ماشین‌حساب‌های مهندسی", "Engineering Calculators")}
        title={t("محاسبه مستقل نیروی موردنیاز", "Standalone Required-Force Calculation")}
        description={t(
          "این ماشین‌حساب‌ها مستقل از فرآیند انتخاب دستگاه هستند و صرفاً برای محاسبه سریع نیروی موردنیاز فرآیند شما کاربرد دارند. تمام فرمول‌ها و مفروضات به‌طور شفاف نمایش داده می‌شوند.",
          "These calculators are independent of the machine-selection process and are only meant for a quick calculation of the force your process requires. All formulas and assumptions are shown transparently."
        )}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              tab === tb.id ? "bg-accent text-white" : "bg-surface-2 text-muted hover:text-foreground"
            )}
          >
            {lang === "en" ? tb.labelEn : tb.label}
          </button>
        ))}
      </div>

      <UseCaseNote text={lang === "en" ? activeTab.whenToUseEn : activeTab.whenToUse} />

      {tab === "punching" && <PunchingCalc />}
      {tab === "bending" && <BendingCalc />}
      {tab === "pressFit" && <PressFitCalc />}
      {tab === "riveting" && <RivetingCalc />}
      {tab === "coining" && <CoiningCalc />}
      {tab === "sheetForming" && <EngineeringCalcPanel module={SheetForming} moduleKey="sheetForming" />}
      {tab === "bulkForming" && <EngineeringCalcPanel module={BulkForming} moduleKey="bulkForming" />}
      {tab === "injectionMolding" && <EngineeringCalcPanel module={InjectionMolding} moduleKey="injectionMolding" />}
    </div>
  );
}

function PunchingCalc() {
  const { lang, t } = useLang();
  const [shape, setShape] = useState<"circle" | "rectangle">("circle");
  const [diameter, setDiameter] = useState(10);
  const [length, setLength] = useState(20);
  const [width, setWidth] = useState(10);
  const [thickness, setThickness] = useState(1);
  const [holeCount, setHoleCount] = useState(1);
  const [materialId, setMaterialId] = useState("s235jr");

  const result = useMemo(() => {
    const m = getMaterialById(materialId)!;
    const rm = tensileAvg(m);
    return calcPunchingForce(
      {
        shape,
        diameterMm: diameter,
        lengthMm: length,
        widthMm: width,
        thicknessMm: thickness,
        shearStrengthMPa: rm * m.shearFactor,
        holeCount,
      },
      lang
    );
  }, [shape, diameter, length, width, thickness, holeCount, materialId, lang]);

  return (
    <Card className="grid grid-cols-1 gap-6 p-5 md:grid-cols-2">
      <div className="space-y-3">
        <div className="flex gap-2">
          <button onClick={() => setShape("circle")} className={cn("rounded-lg px-3 py-1.5 text-xs", shape === "circle" ? "bg-accent text-white" : "bg-surface-2")}>
            {t("دایره", "Circle")}
          </button>
          <button onClick={() => setShape("rectangle")} className={cn("rounded-lg px-3 py-1.5 text-xs", shape === "rectangle" ? "bg-accent text-white" : "bg-surface-2")}>
            {t("مستطیل", "Rectangle")}
          </button>
        </div>
        {shape === "circle" ? (
          <Field label={t("قطر سوراخ", "Hole diameter")} unit="mm" value={diameter} onChange={setDiameter} />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("طول", "Length")} unit="mm" value={length} onChange={setLength} />
            <Field label={t("عرض", "Width")} unit="mm" value={width} onChange={setWidth} />
          </div>
        )}
        <Field label={t("ضخامت ورق", "Sheet thickness")} unit="mm" value={thickness} onChange={setThickness} />
        <Field label={t("تعداد سوراخ", "Number of holes")} value={holeCount} onChange={setHoleCount} step={1} />
        <MaterialSelect value={materialId} onChange={setMaterialId} />
        <div className="rounded-lg border border-border bg-surface-2 p-3">
          <PunchingIllustration shape={shape} diameter={diameter} length={length} width={width} thickness={thickness} />
        </div>
      </div>
      <ResultBox {...result} />
    </Card>
  );
}

function BendingCalc() {
  const { lang, t } = useLang();
  const [bendLength, setBendLength] = useState(50);
  const [thickness, setThickness] = useState(1.5);
  const [dieOpening, setDieOpening] = useState(0);
  const [materialId, setMaterialId] = useState("s235jr");

  const result = useMemo(() => {
    const m = getMaterialById(materialId)!;
    return calcBendingForce(
      {
        bendLengthMm: bendLength,
        thicknessMm: thickness,
        tensileStrengthMPa: tensileAvg(m),
        dieOpeningMm: dieOpening || undefined,
      },
      lang
    );
  }, [bendLength, thickness, dieOpening, materialId, lang]);

  return (
    <Card className="grid grid-cols-1 gap-6 p-5 md:grid-cols-2">
      <div className="space-y-3">
        <Field label={t("طول خم", "Bend length")} unit="mm" value={bendLength} onChange={setBendLength} />
        <Field label={t("ضخامت ورق", "Sheet thickness")} unit="mm" value={thickness} onChange={setThickness} />
        <Field label={t("دهانه قالب V (۰ = خودکار: ۸×ضخامت)", "V-die opening (0 = auto: 8×thickness)")} unit="mm" value={dieOpening} onChange={setDieOpening} />
        <MaterialSelect value={materialId} onChange={setMaterialId} />
        <div className="rounded-lg border border-border bg-surface-2 p-3">
          <BendingIllustration bendLength={bendLength} thickness={thickness} />
        </div>
      </div>
      <ResultBox {...result} />
    </Card>
  );
}

function PressFitCalc() {
  const { lang, t } = useLang();
  const [shaft, setShaft] = useState(20);
  const [hub, setHub] = useState(40);
  const [interference, setInterference] = useState(0.03);
  const [contactLength, setContactLength] = useState(15);
  const [friction, setFriction] = useState(0.12);
  const [youngs, setYoungs] = useState(210000);

  const result = useMemo(
    () =>
      calcPressFitForce(
        {
          shaftDiameterMm: shaft,
          hubOuterDiameterMm: hub,
          diametralInterferenceMm: interference,
          contactLengthMm: contactLength,
          frictionCoefficient: friction,
          youngsModulusMPa: youngs,
        },
        lang
      ),
    [shaft, hub, interference, contactLength, friction, youngs, lang]
  );

  return (
    <Card className="grid grid-cols-1 gap-6 p-5 md:grid-cols-2">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("قطر شفت/بوش", "Shaft/bush diameter")} unit="mm" value={shaft} onChange={setShaft} />
          <Field label={t("قطر بیرونی میزبان", "Hub outer diameter")} unit="mm" value={hub} onChange={setHub} />
          <Field label={t("تداخل قطری", "Diametral interference")} unit="mm" value={interference} onChange={setInterference} step={0.005} />
          <Field label={t("طول تماس", "Contact length")} unit="mm" value={contactLength} onChange={setContactLength} />
          <Field label={t("ضریب اصطکاک", "Friction coefficient")} value={friction} onChange={setFriction} step={0.01} />
          <Field label={t("مدول یانگ", "Young's modulus")} unit="N/mm²" value={youngs} onChange={setYoungs} step={1000} />
        </div>
        <div className="rounded-lg border border-border bg-surface-2 p-3">
          <PressFitIllustration shaft={shaft} hub={hub} contactLength={contactLength} />
        </div>
      </div>
      <ResultBox {...result} />
    </Card>
  );
}

function RivetingCalc() {
  const { lang, t } = useLang();
  const [diameter, setDiameter] = useState(4);
  const [materialId, setMaterialId] = useState("s235jr");
  const [factor, setFactor] = useState(3);

  const result = useMemo(() => {
    const m = getMaterialById(materialId)!;
    return calcRivetingForce({ rivetDiameterMm: diameter, tensileStrengthMPa: tensileAvg(m), upsetFactor: factor }, lang);
  }, [diameter, materialId, factor, lang]);

  return (
    <Card className="grid grid-cols-1 gap-6 p-5 md:grid-cols-2">
      <div className="space-y-3">
        <Field label={t("قطر پرچ", "Rivet diameter")} unit="mm" value={diameter} onChange={setDiameter} />
        <MaterialSelect value={materialId} onChange={setMaterialId} />
        <Field label={t("ضریب فرم‌دهی سرد", "Cold-heading factor")} value={factor} onChange={setFactor} step={0.5} />
        <div className="rounded-lg border border-border bg-surface-2 p-3">
          <RivetingIllustration diameter={diameter} />
        </div>
      </div>
      <ResultBox {...result} />
    </Card>
  );
}

function CoiningCalc() {
  const { lang, t } = useLang();
  const [area, setArea] = useState(100);
  const [materialId, setMaterialId] = useState("s235jr");
  const [factor, setFactor] = useState(5);

  const result = useMemo(() => {
    const m = getMaterialById(materialId)!;
    return calcCoiningForce({ projectedAreaMm2: area, tensileStrengthMPa: tensileAvg(m), pressureFactor: factor }, lang);
  }, [area, materialId, factor, lang]);

  return (
    <Card className="grid grid-cols-1 gap-6 p-5 md:grid-cols-2">
      <div className="space-y-3">
        <Field label={t("سطح تصویرشده نقش", "Projected relief area")} unit="mm²" value={area} onChange={setArea} step={1} />
        <MaterialSelect value={materialId} onChange={setMaterialId} />
        <Field label={t("ضریب فشار کوینینگ", "Coining pressure factor")} value={factor} onChange={setFactor} step={0.5} />
        <div className="rounded-lg border border-border bg-surface-2 p-3">
          <CoiningIllustration area={area} />
        </div>
      </div>
      <ResultBox {...result} />
    </Card>
  );
}
