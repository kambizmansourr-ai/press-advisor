"use client";

import { biPick, formatNumberFor, type Lang } from "./lang";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "lang";

export type { Lang };
export { biPick, formatNumberFor };

interface LanguageContextValue {
  lang: Lang;
  isRtl: boolean;
  setLang: (lang: Lang) => void;
  /** Pick the string for the active language: t("فارسی", "English"). */
  t: (fa: string, en: string) => string;
  /** Format a number with locale digits (Persian digits in fa, Latin in en). */
  fmt: (n: number, maxFractionDigits?: number) => string;
  /** Pick the active-language half of a combined "فارسی / English" string. */
  bi: (s: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "fa",
  isRtl: true,
  setLang: () => {},
  t: (fa) => fa,
  fmt: (n, d = 1) => formatNumberFor("fa", n, d),
  bi: (s) => biPick(s, "fa"),
});

export function useLang() {
  return useContext(LanguageContext);
}

function applyToDocument(lang: Lang) {
  const root = document.documentElement;
  root.setAttribute("lang", lang);
  root.setAttribute("dir", lang === "fa" ? "rtl" : "ltr");
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fa");

  useEffect(() => {
    // One-time sync on mount: window/localStorage are unavailable during SSR.
    let stored: string | null = null;
    try {
      const fromUrl = new URLSearchParams(window.location.search).get("lang");
      if (fromUrl === "en" || fromUrl === "fa") {
        stored = fromUrl;
        window.localStorage.setItem(STORAGE_KEY, fromUrl);
      } else {
        stored = window.localStorage.getItem(STORAGE_KEY);
      }
    } catch {
      /* storage blocked — fall through to default */
    }
    const initial: Lang = stored === "en" || stored === "fa" ? stored : "fa";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLangState(initial);
    applyToDocument(initial);
    // Reveal the page once React has committed the chosen language (set by the early script in layout.tsx).
    requestAnimationFrame(() =>
      requestAnimationFrame(() => document.documentElement.removeAttribute("data-lang-pending"))
    );
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    applyToDocument(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      isRtl: lang === "fa",
      setLang,
      t: (fa, en) => (lang === "fa" ? fa : en),
      fmt: (n, d = 1) => formatNumberFor(lang, n, d),
      bi: (s) => biPick(s, lang),
    }),
    [lang, setLang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
