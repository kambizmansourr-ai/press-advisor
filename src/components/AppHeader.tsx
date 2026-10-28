"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { InstallButton } from "./InstallButton";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

const navItems = [
  { href: "/", fa: "انتخاب هوشمند", en: "Smart Selection" },
  { href: "/calculators", fa: "ماشین‌حساب‌های مهندسی", en: "Engineering Calculators" },
  { href: "/catalog", fa: "کاتالوگ محصولات", en: "Product Catalogue" },
  { href: "/compare", fa: "مقایسه دستگاه‌ها", en: "Compare Machines" },
  { href: "/insert-selector", fa: "راهنمای انتخاب اینسرت", en: "Insert Selection Guide" },
];

export function AppHeader() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const { lang, setLang, t } = useLang();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg">
            <Image src="/icons/icon-192.png" alt={t("ارس زنجان", "Aras Zanjan")} fill className="object-cover" sizes="36px" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-bold">{t("ارس زنجان", "Aras Zanjan")}</span>
            <span className="text-[11px] text-muted">{t("سیستم هوشمند ارس زنجان", "Aras Zanjan Smart System")}</span>
          </span>
        </Link>

        <nav className="hidden flex-1 items-center gap-1 overflow-x-auto md:flex">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors",
                  active ? "bg-accent-soft text-accent-strong font-semibold" : "text-muted hover:bg-surface-2 hover:text-foreground"
                )}
              >
                {t(item.fa, item.en)}
              </Link>
            );
          })}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <InstallButton />
          <button
            onClick={() => setLang(lang === "fa" ? "en" : "fa")}
            aria-label={t("Switch to English", "تغییر زبان به فارسی")}
            title={t("Switch to English", "تغییر زبان به فارسی")}
            className="flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-muted hover:text-foreground hover:bg-surface-2 transition-colors"
          >
            <Languages size={15} />
            <span>{lang === "fa" ? "EN" : "فا"}</span>
          </button>
          <button
            onClick={toggle}
            aria-label={t("تغییر حالت روشن/تاریک", "Toggle light/dark mode")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted hover:text-foreground hover:bg-surface-2 transition-colors"
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto border-t border-border px-4 py-1.5 md:hidden">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs transition-colors",
                active ? "bg-accent-soft text-accent-strong font-semibold" : "text-muted"
              )}
            >
              {t(item.fa, item.en)}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
