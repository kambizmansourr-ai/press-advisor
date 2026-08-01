"use client";

import { useState } from "react";
import { UseFormRegister } from "react-hook-form";
import { WizardFormValues } from "./types";
import { NumberField, SelectField } from "@/components/FormFields";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function RefinementPanel({ register }: { register: UseFormRegister<WizardFormValues> }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium"
      >
        <span>تنظیمات تکمیلی (ابعاد قطعه، ترجیح بدنه)</span>
        <ChevronDown size={16} className={cn("transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="space-y-3 border-t border-border p-3">
          <div className="grid grid-cols-2 gap-3">
            <NumberField<WizardFormValues> label="عرض قطعه" unit="mm" name="partWidthMm" register={register} />
            <NumberField<WizardFormValues> label="عمق قطعه" unit="mm" name="partDepthMm" register={register} />
            <NumberField<WizardFormValues> label="ارتفاع قطعه/قالب" unit="mm" name="partHeightMm" register={register} />
            <NumberField<WizardFormValues>
              label="عمق دسترسی موردنیاز"
              unit="mm"
              name="throatNeededMm"
              register={register}
              hint="فاصله محور سنبه تا لبه قطعه"
            />
            <NumberField<WizardFormValues> label="کورس قدرتی موردنیاز" unit="mm" name="strokeNeededMm" register={register} />
          </div>
          <SelectField<WizardFormValues>
            label="ترجیح جنس بدنه"
            name="bodyPreference"
            register={register}
            options={[
              { value: "any", label: "فرقی نمی‌کند" },
              { value: "cast-iron", label: "چدنی" },
              { value: "steel", label: "آهنی (فولادی جوشی)" },
            ]}
          />
        </div>
      )}
    </div>
  );
}
