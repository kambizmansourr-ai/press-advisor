"use client";

import { Card, SectionTitle, Badge } from "@/components/ui";
import { dataGaps } from "@/data/dataGaps";
import { AlertTriangle } from "lucide-react";
import { useLang } from "@/lib/i18n";

export function DataQualityContent() {
  const { lang, t } = useLang();
  const en = lang === "en";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <SectionTitle
        eyebrow={t("شفافیت داده", "Data Transparency")}
        title={t("کیفیت داده و منابع اطلاعاتی", "Data Quality and Sources")}
        description={t(
          "این سیستم تنها بر اساس داده‌های واقعاً موجود در سند منبع کار می‌کند. هیچ مقداری (وزن، توان موتور، سرعت) حدس زده یا جعل نشده — در عوض هر کمبود اطلاعاتی صراحتاً در این صفحه ثبت شده است.",
          "This system works only from data that actually exists in the source document. No value (weight, motor power, speed) has been guessed or invented; instead, every information gap is explicitly recorded on this page."
        )}
      />

      <div className="mb-8">
        <Card className="p-4">
          <Badge tone="accent">{t("منبع", "Source")}</Badge>
          <h3 className="mt-2 font-bold">Presses-Catalogue-1.pdf</h3>
          <p className="mt-1 text-xs text-muted">
            {t(
              "کاتالوگ رسمی شرکت ارس زنجان (برند AZCO) — ۱۰ صفحه، طراحی‌شده با CorelDRAW X7 در سال ۱۳۹۵ (۲۰۱۶ میلادی). شامل معرفی شرکت، مشخصات فنی ۷ سری پرس و لیست نمایندگی‌های فروش قطعات استاندارد قالب.",
              "Official catalogue of Aras Zanjan (AZCO brand) — 10 pages, designed in CorelDRAW X7 in 1395 (2016 CE). It includes a company introduction, the technical specifications of 7 press series, and a list of sales agencies for standard die components."
            )}
          </p>
        </Card>
      </div>

      <div className="space-y-3">
        {dataGaps.map((gap) => (
          <Card key={gap.id} className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warn" />
              <div>
                <h4 className="font-semibold">{en ? gap.topicEn : gap.topicFa}</h4>
                <p className="mt-1 text-xs text-muted">{en ? gap.detailEn : gap.detailFa}</p>
                <p className="mt-1 text-xs text-foreground/80">
                  <span className="font-medium text-warn">{t("تاثیر بر سیستم: ", "Impact on the system: ")}</span>
                  {en ? gap.impactEn : gap.impactFa}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
