"use client";

import { UseFormRegister, UseFormWatch } from "react-hook-form";
import { WizardFormValues } from "./types";
import { NumberField, SelectField } from "@/components/FormFields";
import { materials } from "@/data/materials";
import { Application } from "@/types/application";
import {
  PunchingIllustration,
  BendingIllustration,
  PressFitIllustration,
  RivetingIllustration,
  CoiningIllustration,
} from "@/components/illustrations/simpleCalcs";

const materialOptions = materials.map((m) => ({ value: m.id, label: `${m.nameFa} (${m.nameEn})` }));

export function DynamicInputs({
  application,
  register,
  watch,
}: {
  application: Application;
  register: UseFormRegister<WizardFormValues>;
  watch: UseFormWatch<WizardFormValues>;
}) {
  const shape = watch("shape");
  const useManualForce = watch("useManualForce");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2">
        <span className="text-xs font-medium">نیروی موردنیاز را می‌دانم و نیازی به محاسبه ندارم</span>
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input type="checkbox" {...register("useManualForce")} className="h-4 w-4 accent-[var(--accent)]" />
        </label>
      </div>

      {useManualForce ? (
        <NumberField<WizardFormValues> label="نیروی موردنیاز" unit="kgf" name="manualForceKgf" register={register} step={1} />
      ) : (
        <>
          <SelectField<WizardFormValues> label="جنس قطعه" name="materialId" register={register} options={materialOptions} />

          {application.forceCalculator === "punching" && (
            <div className="space-y-3">
              <SelectField<WizardFormValues>
                label="شکل سوراخ/برش"
                name="shape"
                register={register}
                options={[
                  { value: "circle", label: "دایره" },
                  { value: "rectangle", label: "مستطیل" },
                ]}
              />
              <div className="grid grid-cols-2 gap-3">
                {shape === "circle" ? (
                  <NumberField<WizardFormValues> label="قطر سوراخ" unit="mm" name="diameterMm" register={register} className="col-span-2" />
                ) : (
                  <>
                    <NumberField<WizardFormValues> label="طول" unit="mm" name="rectLengthMm" register={register} />
                    <NumberField<WizardFormValues> label="عرض" unit="mm" name="rectWidthMm" register={register} />
                  </>
                )}
                <NumberField<WizardFormValues> label="ضخامت ورق" unit="mm" name="thicknessMm" register={register} step={0.1} />
                <NumberField<WizardFormValues> label="تعداد سوراخ/قطعه" name="holeCount" register={register} step={1} min={1} />
              </div>
              <div className="rounded-lg border border-border bg-surface-2 p-3">
                <PunchingIllustration
                  shape={shape}
                  diameter={watch("diameterMm") ?? 10}
                  length={watch("rectLengthMm") ?? 20}
                  width={watch("rectWidthMm") ?? 10}
                  thickness={watch("thicknessMm") ?? 1}
                />
              </div>
            </div>
          )}

          {application.forceCalculator === "bending" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <NumberField<WizardFormValues> label="طول خم" unit="mm" name="bendLengthMm" register={register} />
                <NumberField<WizardFormValues> label="ضخامت ورق" unit="mm" name="thicknessMm" register={register} step={0.1} />
                <NumberField<WizardFormValues>
                  label="دهانه قالب V (اختیاری)"
                  unit="mm"
                  name="dieOpeningMm"
                  register={register}
                  hint="در صورت خالی بودن، ۸ برابر ضخامت فرض می‌شود"
                />
              </div>
              <div className="rounded-lg border border-border bg-surface-2 p-3">
                <BendingIllustration bendLength={watch("bendLengthMm") ?? 50} thickness={watch("thicknessMm") ?? 1} />
              </div>
            </div>
          )}

          {application.forceCalculator === "pressFit" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <NumberField<WizardFormValues> label="قطر شفت/بوش" unit="mm" name="shaftDiameterMm" register={register} />
                <NumberField<WizardFormValues> label="قطر بیرونی میزبان" unit="mm" name="hubOuterDiameterMm" register={register} />
                <NumberField<WizardFormValues>
                  label="تداخل قطری"
                  unit="mm"
                  name="diametralInterferenceMm"
                  register={register}
                  step={0.005}
                />
                <NumberField<WizardFormValues> label="طول تماس" unit="mm" name="contactLengthMm" register={register} />
                <NumberField<WizardFormValues>
                  label="ضریب اصطکاک (اختیاری)"
                  name="frictionCoefficient"
                  register={register}
                  step={0.01}
                  className="col-span-2"
                  hint="پیش‌فرض ۰.۱۲ برای تماس خشک فولاد-فولاد"
                />
              </div>
              <div className="rounded-lg border border-border bg-surface-2 p-3">
                <PressFitIllustration
                  shaft={watch("shaftDiameterMm") ?? 20}
                  hub={watch("hubOuterDiameterMm") ?? 40}
                  contactLength={watch("contactLengthMm") ?? 15}
                />
              </div>
            </div>
          )}

          {application.forceCalculator === "riveting" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <NumberField<WizardFormValues> label="قطر پرچ/پین" unit="mm" name="rivetDiameterMm" register={register} />
              </div>
              <div className="rounded-lg border border-border bg-surface-2 p-3">
                <RivetingIllustration diameter={watch("rivetDiameterMm") ?? 4} />
              </div>
            </div>
          )}

          {application.forceCalculator === "coining" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <NumberField<WizardFormValues> label="سطح تصویرشده نقش" unit="mm²" name="projectedAreaMm2" register={register} step={1} />
                <NumberField<WizardFormValues>
                  label="ضریب فشار (اختیاری)"
                  name="pressureFactor"
                  register={register}
                  step={0.5}
                  hint="پیش‌فرض ۵× برای کوینینگ متوسط؛ برای مارکینگ کم‌عمق ۲ تا ۳ کافی است"
                />
              </div>
              <div className="rounded-lg border border-border bg-surface-2 p-3">
                <CoiningIllustration area={watch("projectedAreaMm2") ?? 100} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
