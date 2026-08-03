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
import BulkForming from "@/calculators/bulkForming.js";
import SheetForming from "@/calculators/sheetForming.js";
import InjectionMolding from "@/calculators/injectionMolding.js";
import { Compass } from "lucide-react";

type Tab = "punching" | "bending" | "pressFit" | "riveting" | "coining" | "sheetForming" | "bulkForming" | "injectionMolding";

const tabs: { id: Tab; label: string; whenToUse: string }[] = [
  {
    id: "punching",
    label: "نیروی پانچ/برش",
    whenToUse: "کِی استفاده کنید: سوراخ‌کاری یا برش ساده یک شکل (دایره/مستطیل) از ورق فلزی نازک با سنبه و ماتریس — پیش از انتخاب پرس برای عملیات پانچ یا بلانکینگ ساده.",
  },
  {
    id: "bending",
    label: "نیروی خم (V)",
    whenToUse: "کِی استفاده کنید: تخمین سریع نیروی لازم برای یک خم ساده تک‌مرحله‌ای با قالب V در پرس — برای انتخاب تناژ، نه طراحی دقیق قالب.",
  },
  {
    id: "pressFit",
    label: "نیروی پرس‌فیت",
    whenToUse: "کِی استفاده کنید: جای‌گذاری فشاری یک قطعه استوانه‌ای (بوش، یاتاقان، پین، میل راهنما) با تداخل قطری داخل یک سوراخ.",
  },
  {
    id: "riveting",
    label: "نیروی پرچ‌کاری",
    whenToUse: "کِی استفاده کنید: تخمین نیروی لازم برای فرم‌دهی سرد سر یک پرچ فلزی جهت اتصال دو یا چند ورق.",
  },
  {
    id: "coining",
    label: "نیروی کوینینگ/امباس",
    whenToUse: "کِی استفاده کنید: تخمین نیروی لازم برای حک یا فرم‌دهی سطحی کم‌عمق (مارک‌زنی، لوگو، امباس) بر اساس سطح تصویرشده نقش.",
  },
  {
    id: "sheetForming",
    label: "فرم‌دهی و برش ورق (پیشرفته)",
    whenToUse: "کِی استفاده کنید: طراحی دقیق‌تر قالب و فرآیند برای قطعات ورقی — شامل لقی و ابزار برش، طول خم و برگشت فنری، و کشش عمیق (قطر بلانک، امکان‌سنجی، برنامه چندمرحله‌ای). وقتی محاسبه‌های ساده بالا کافی نیستند از این استفاده کنید.",
  },
  {
    id: "bulkForming",
    label: "فرم‌دهی حجمی (فورجینگ/نورد/اکستروژن/کشش)",
    whenToUse: "کِی استفاده کنید: قطعه از یک شمش یا میلگرد توپر ساخته می‌شود، نه از ورق — فورجینگ آزاد/قالب بسته، نورد تخت، اکستروژن یا کشش مفتول و میله.",
  },
  {
    id: "injectionMolding",
    label: "قالب‌گیری تزریقی پلاستیک",
    whenToUse: "کِی استفاده کنید: قطعه از جنس پلاستیک و با فرآیند تزریق ساخته می‌شود — انتخاب ماشین تزریق، زمان سیکل، تعداد حفره، سیستم تغذیه (رانر/گیت) و جزئیات قالب.",
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
  return (
    <div className="rounded-lg border border-accent/30 bg-accent-soft p-4">
      <div className="text-xs text-muted">نیروی موردنیاز</div>
      <div className="text-2xl font-extrabold text-accent-strong">
        {Number.isFinite(forceKgf) ? formatNumber(forceKgf) : "—"} <span className="text-sm font-medium">kgf</span>
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
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">جنس ماده</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm">
        {materials.map((m) => (
          <option key={m.id} value={m.id}>
            {m.nameFa} ({m.nameEn}) — {m.tensileMinMPa}-{m.tensileMaxMPa} MPa
          </option>
        ))}
      </select>
    </label>
  );
}

export default function CalculatorsPage() {
  const [tab, setTab] = useState<Tab>("punching");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <SectionTitle
        eyebrow="ماشین‌حساب‌های مهندسی"
        title="محاسبه مستقل نیروی موردنیاز"
        description="این ماشین‌حساب‌ها مستقل از فرآیند انتخاب دستگاه هستند و صرفاً برای محاسبه سریع نیروی موردنیاز فرآیند شما کاربرد دارند. تمام فرمول‌ها و مفروضات به‌طور شفاف نمایش داده می‌شوند."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              tab === t.id ? "bg-accent text-white" : "bg-surface-2 text-muted hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <UseCaseNote text={tabs.find((t) => t.id === tab)!.whenToUse} />

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
    return calcPunchingForce({
      shape,
      diameterMm: diameter,
      lengthMm: length,
      widthMm: width,
      thicknessMm: thickness,
      shearStrengthMPa: rm * m.shearFactor,
      holeCount,
    });
  }, [shape, diameter, length, width, thickness, holeCount, materialId]);

  return (
    <Card className="grid grid-cols-1 gap-6 p-5 md:grid-cols-2">
      <div className="space-y-3">
        <div className="flex gap-2">
          <button onClick={() => setShape("circle")} className={cn("rounded-lg px-3 py-1.5 text-xs", shape === "circle" ? "bg-accent text-white" : "bg-surface-2")}>
            دایره
          </button>
          <button onClick={() => setShape("rectangle")} className={cn("rounded-lg px-3 py-1.5 text-xs", shape === "rectangle" ? "bg-accent text-white" : "bg-surface-2")}>
            مستطیل
          </button>
        </div>
        {shape === "circle" ? (
          <Field label="قطر سوراخ" unit="mm" value={diameter} onChange={setDiameter} />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Field label="طول" unit="mm" value={length} onChange={setLength} />
            <Field label="عرض" unit="mm" value={width} onChange={setWidth} />
          </div>
        )}
        <Field label="ضخامت ورق" unit="mm" value={thickness} onChange={setThickness} />
        <Field label="تعداد سوراخ" value={holeCount} onChange={setHoleCount} step={1} />
        <MaterialSelect value={materialId} onChange={setMaterialId} />
      </div>
      <ResultBox {...result} />
    </Card>
  );
}

function BendingCalc() {
  const [bendLength, setBendLength] = useState(50);
  const [thickness, setThickness] = useState(1.5);
  const [dieOpening, setDieOpening] = useState(0);
  const [materialId, setMaterialId] = useState("s235jr");

  const result = useMemo(() => {
    const m = getMaterialById(materialId)!;
    return calcBendingForce({
      bendLengthMm: bendLength,
      thicknessMm: thickness,
      tensileStrengthMPa: tensileAvg(m),
      dieOpeningMm: dieOpening || undefined,
    });
  }, [bendLength, thickness, dieOpening, materialId]);

  return (
    <Card className="grid grid-cols-1 gap-6 p-5 md:grid-cols-2">
      <div className="space-y-3">
        <Field label="طول خم" unit="mm" value={bendLength} onChange={setBendLength} />
        <Field label="ضخامت ورق" unit="mm" value={thickness} onChange={setThickness} />
        <Field label="دهانه قالب V (۰ = خودکار: ۸×ضخامت)" unit="mm" value={dieOpening} onChange={setDieOpening} />
        <MaterialSelect value={materialId} onChange={setMaterialId} />
      </div>
      <ResultBox {...result} />
    </Card>
  );
}

function PressFitCalc() {
  const [shaft, setShaft] = useState(20);
  const [hub, setHub] = useState(40);
  const [interference, setInterference] = useState(0.03);
  const [contactLength, setContactLength] = useState(15);
  const [friction, setFriction] = useState(0.12);
  const [youngs, setYoungs] = useState(210000);

  const result = useMemo(
    () =>
      calcPressFitForce({
        shaftDiameterMm: shaft,
        hubOuterDiameterMm: hub,
        diametralInterferenceMm: interference,
        contactLengthMm: contactLength,
        frictionCoefficient: friction,
        youngsModulusMPa: youngs,
      }),
    [shaft, hub, interference, contactLength, friction, youngs]
  );

  return (
    <Card className="grid grid-cols-1 gap-6 p-5 md:grid-cols-2">
      <div className="grid grid-cols-2 gap-3">
        <Field label="قطر شفت/بوش" unit="mm" value={shaft} onChange={setShaft} />
        <Field label="قطر بیرونی میزبان" unit="mm" value={hub} onChange={setHub} />
        <Field label="تداخل قطری" unit="mm" value={interference} onChange={setInterference} step={0.005} />
        <Field label="طول تماس" unit="mm" value={contactLength} onChange={setContactLength} />
        <Field label="ضریب اصطکاک" value={friction} onChange={setFriction} step={0.01} />
        <Field label="مدول یانگ" unit="N/mm²" value={youngs} onChange={setYoungs} step={1000} />
      </div>
      <ResultBox {...result} />
    </Card>
  );
}

function RivetingCalc() {
  const [diameter, setDiameter] = useState(4);
  const [materialId, setMaterialId] = useState("s235jr");
  const [factor, setFactor] = useState(3);

  const result = useMemo(() => {
    const m = getMaterialById(materialId)!;
    return calcRivetingForce({ rivetDiameterMm: diameter, tensileStrengthMPa: tensileAvg(m), upsetFactor: factor });
  }, [diameter, materialId, factor]);

  return (
    <Card className="grid grid-cols-1 gap-6 p-5 md:grid-cols-2">
      <div className="space-y-3">
        <Field label="قطر پرچ" unit="mm" value={diameter} onChange={setDiameter} />
        <MaterialSelect value={materialId} onChange={setMaterialId} />
        <Field label="ضریب فرم‌دهی سرد" value={factor} onChange={setFactor} step={0.5} />
      </div>
      <ResultBox {...result} />
    </Card>
  );
}

function CoiningCalc() {
  const [area, setArea] = useState(100);
  const [materialId, setMaterialId] = useState("s235jr");
  const [factor, setFactor] = useState(5);

  const result = useMemo(() => {
    const m = getMaterialById(materialId)!;
    return calcCoiningForce({ projectedAreaMm2: area, tensileStrengthMPa: tensileAvg(m), pressureFactor: factor });
  }, [area, materialId, factor]);

  return (
    <Card className="grid grid-cols-1 gap-6 p-5 md:grid-cols-2">
      <div className="space-y-3">
        <Field label="سطح تصویرشده نقش" unit="mm²" value={area} onChange={setArea} step={1} />
        <MaterialSelect value={materialId} onChange={setMaterialId} />
        <Field label="ضریب فشار کوینینگ" value={factor} onChange={setFactor} step={0.5} />
      </div>
      <ResultBox {...result} />
    </Card>
  );
}
