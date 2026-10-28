import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Persian-digit formatting by default; pass lang "en" for Latin digits. Prefer `useLang().fmt` in components. */
export function formatNumber(n: number, lang: "fa" | "en" = "fa"): string {
  return new Intl.NumberFormat(lang === "fa" ? "fa-IR" : "en-US").format(Math.round(n * 10) / 10);
}
