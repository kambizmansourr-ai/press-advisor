"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { InstallButton } from "./InstallButton";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "انتخاب هوشمند" },
  { href: "/catalog", label: "کاتالوگ محصولات" },
  { href: "/compare", label: "مقایسه دستگاه‌ها" },
  { href: "/calculators", label: "ماشین‌حساب‌های مهندسی" },
  { href: "/data-quality", label: "کیفیت داده و منابع" },
];

export function AppHeader() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg">
            <Image src="/icons/icon-192.png" alt="ارس زنجان" fill className="object-cover" sizes="36px" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-bold">ارس زنجان</span>
            <span className="text-[11px] text-muted">سیستم هوشمند انتخاب پرس</span>
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
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <InstallButton />
          <button
            onClick={toggle}
            aria-label="تغییر حالت روشن/تاریک"
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
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
