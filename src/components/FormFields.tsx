import { UseFormRegister, FieldValues, Path } from "react-hook-form";
import { cn } from "@/lib/utils";

interface NumberFieldProps<T extends FieldValues> {
  label: string;
  unit?: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  step?: number;
  min?: number;
  hint?: string;
  className?: string;
}

export function NumberField<T extends FieldValues>({
  label,
  unit,
  name,
  register,
  step = 0.1,
  min = 0,
  hint,
  className,
}: NumberFieldProps<T>) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 flex items-baseline justify-between text-xs font-medium text-muted">
        <span>{label}</span>
        {unit && <span className="text-[10px] text-muted">{unit}</span>}
      </span>
      <input
        type="number"
        step={step}
        min={min}
        {...register(name, { valueAsNumber: true })}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
      />
      {hint && <span className="mt-1 block text-[10px] text-muted">{hint}</span>}
    </label>
  );
}

interface SelectFieldProps<T extends FieldValues> {
  label: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  options: { value: string; label: string }[];
  className?: string;
}

export function SelectField<T extends FieldValues>({ label, name, register, options, className }: SelectFieldProps<T>) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      <select
        {...register(name)}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
