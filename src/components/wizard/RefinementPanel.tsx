"use client";

import { useState } from "react";
import { UseFormRegister } from "react-hook-form";
import { WizardFormValues } from "./types";
import { NumberField, SelectField } from "@/components/FormFields";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

export function RefinementPanel({ register }: { register: UseFormRegister<WizardFormValues> }) {
  const [open, setOpen] = useState(false);
  const { t } = useLang();
  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium"
      >
        <span>{t("تنظیمات تکمیلی (ابعاد قطعه، ترجیح بدنه)", "Additional settings (part dimensions, frame preference)")}</span>
        <ChevronDown size={16} className={cn("transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="space-y-3 border-t border-border p-3">
          <div className="grid grid-cols-2 gap-3">
            <NumberField<WizardFormValues> label={t("عرض قطعه", "Part width")} unit="mm" name="partWidthMm" register={register} />
            <NumberField<WizardFormValues> label={t("عمق قطعه", "Part depth")} unit="mm" name="partDepthMm" register={register} />
            <NumberField<WizardFormValues> label={t("ارتفاع قطعه/قالب", "Part / die height")} unit="mm" name="partHeightMm" register={register} />
            <NumberField<WizardFormValues>
              label={t("عمق دسترسی موردنیاز", "Required throat depth")}
              unit="mm"
              name="throatNeededMm"
              register={register}
              hint={t("فاصله محور سنبه تا لبه قطعه", "Distance from the punch axis to the edge of the part")}
            />
            <NumberField<WizardFormValues>
              label={t("کورس قدرتی موردنیاز", "Required power stroke")}
              unit="mm"
              name="strokeNeededMm"
              register={register}
            />
          </div>
          <SelectField<WizardFormValues>
            label={t("ترجیح جنس بدنه", "Frame material preference")}
            name="bodyPreference"
            register={register}
            options={[
              { value: "any", label: t("فرقی نمی‌کند", "No preference") },
              { value: "cast-iron", label: t("چدنی", "Cast iron") },
              { value: "steel", label: t("آهنی (فولادی جوشی)", "Steel (welded)") },
            ]}
          />
        </div>
      )}
    </div>
  );
}
