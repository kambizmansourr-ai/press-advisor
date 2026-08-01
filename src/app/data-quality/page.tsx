import { Card, SectionTitle, Badge } from "@/components/ui";
import { dataGaps } from "@/data/dataGaps";
import { AlertTriangle } from "lucide-react";

export const metadata = {
  title: "کیفیت داده و منابع | ارس زنجان",
};

export default function DataQualityPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <SectionTitle
        eyebrow="شفافیت داده"
        title="کیفیت داده و منابع اطلاعاتی"
        description="این سیستم تنها بر اساس داده‌های واقعاً موجود در دو سند منبع کار می‌کند. هیچ مقداری (وزن، توان موتور، سرعت) حدس زده یا جعل نشده — در عوض هر کمبود اطلاعاتی صراحتاً در این صفحه ثبت شده است."
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="p-4">
          <Badge tone="accent">منبع ۱</Badge>
          <h3 className="mt-2 font-bold">Presses-Catalogue-1.pdf</h3>
          <p className="mt-1 text-xs text-muted">
            کاتالوگ رسمی شرکت ارس زنجان (برند AZCO) — ۱۰ صفحه، طراحی‌شده با CorelDRAW X7 در سال ۱۳۹۵ (۲۰۱۶ میلادی). شامل معرفی شرکت،
            مشخصات فنی ۷ سری پرس و لیست نمایندگی‌های فروش قطعات استاندارد قالب.
          </p>
        </Card>
        <Card className="p-4">
          <Badge tone="neutral">منبع ۲</Badge>
          <h3 className="mt-2 font-bold">Setak.pdf</h3>
          <p className="mt-1 text-xs text-muted">
            برگه مرجع «استحکام کششی مواد» از برند SETAAK (تامین‌کننده اجزای قالب) — یک صفحه، تولیدشده با Nitro PDF Pro. این سند محصول
            ارس زنجان نیست؛ صرفاً به‌عنوان مرجع مهندسی برای محاسبات نیرو بر اساس جنس ماده در این سیستم استفاده شده است.
          </p>
        </Card>
      </div>

      <div className="space-y-3">
        {dataGaps.map((gap) => (
          <Card key={gap.id} className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warn" />
              <div>
                <h4 className="font-semibold">{gap.topicFa}</h4>
                <p className="mt-1 text-xs text-muted">{gap.detailFa}</p>
                <p className="mt-1 text-xs text-foreground/80">
                  <span className="font-medium text-warn">تاثیر بر سیستم: </span>
                  {gap.impactFa}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
