// Pure (non-React) language helpers — safe to import from data, rules and calculator modules.
export type Lang = "fa" | "en";

const PERSIAN = /[؀-ۿ]/;

/**
 * Many engineering strings are stored as a single "فارسی / English" string
 * (calculator warnings, step labels). Return the half matching `lang`.
 * Strings without a Persian/English pair are returned unchanged.
 */
export function biPick(s: string, lang: Lang): string {
  if (typeof s !== "string") return s;
  let from = 0;
  for (;;) {
    const i = s.indexOf(" / ", from);
    if (i === -1) return s;
    const left = s.slice(0, i);
    const right = s.slice(i + 3);
    if (PERSIAN.test(left) && !PERSIAN.test(right)) return lang === "fa" ? left : right;
    from = i + 3;
  }
}

export function formatNumberFor(lang: Lang, n: number, maxFractionDigits = 1): string {
  return new Intl.NumberFormat(lang === "fa" ? "fa-IR" : "en-US", { maximumFractionDigits: maxFractionDigits }).format(n);
}

