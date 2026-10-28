"use client";

import { useLang } from "@/lib/i18n";

export function SiteFooter() {
  const { t } = useLang();
  return (
    <footer className="border-t border-border py-6 text-center text-xs text-muted">
      {t(
        "سیستم هوشمند ارس زنجان — بر پایه کاتالوگ رسمی شرکت ارس زنجان (AZCO). داده‌های فنی از کاتالوگ منبع استخراج شده و در بخش «کیفیت داده» قابل بررسی است.",
        "Aras Zanjan Smart System — based on the official Aras Zanjan (AZCO) catalogue. Technical data is extracted from the source catalogue and can be reviewed in the “Data Quality” section."
      )}
    </footer>
  );
}
