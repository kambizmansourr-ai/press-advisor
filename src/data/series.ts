import { PressSeries } from "@/types/press";

export const pressSeries: PressSeries[] = [
  {
    id: "php",
    code: "PHP",
    nameFa: "پرس هیدروپنوماتیک (عملکرد مستقیم)",
    nameEn: "Hydro-Pneumatic Press (Direct Acting)",
    driveType: "hydro-pneumatic",
    actuation: "direct",
    descriptionFa:
      "سیلندر هیدروپنوماتیک دو مرحله‌ای: تقرب سریع با نیروی کم (پنوماتیک) و سپس ضربه نهایی با نیروی بالا (هیدرولیک داخلی). مناسب کارهایی که هم سرعت تقرب و هم نیروی نهایی بالا لازم دارند.",
    descriptionEn:
      "Two-stage hydro-pneumatic cylinder: fast approach at low force (pneumatic), then a high-force final stroke (internal hydraulic). Suited to jobs that need both a fast approach and high final force.",
    orderingCodePattern: "PHP/F/D1×D2[/St]",
    exampleCode: "PHP/1800/100×10",
    sourcePages: [5, 6],
    imageUrl: "/images/series/php.jpg",
  },
  {
    id: "pap",
    code: "PAP",
    nameFa: "پرس اهرمی پنوماتیک (عملکرد غیرمستقیم)",
    nameEn: "Pneumatic Lever/Toggle Press (Indirect Acting)",
    driveType: "pneumatic-lever",
    actuation: "indirect",
    descriptionFa:
      "نیروی سیلندر پنوماتیک از طریق مکانیزم اهرمی (toggle) تشدید می‌شود؛ در انتهای کورس نیروی زیادی با فشار هوای معمولی (۶ بار) تولید می‌کند.",
    descriptionEn:
      "The pneumatic cylinder force is multiplied through a toggle linkage, producing high force at the end of the stroke from ordinary 6 bar air.",
    orderingCodePattern: "PAP/F[/St]",
    exampleCode: "PAP/1100/St",
    sourcePages: [7, 8],
    imageUrl: "/images/series/pap.jpg",
  },
  {
    id: "ppn",
    code: "PPN",
    nameFa: "پرس پنوماتیک (عملکرد مستقیم)",
    nameEn: "Pneumatic Press (Direct Acting)",
    driveType: "pneumatic-direct",
    actuation: "direct",
    descriptionFa:
      "سیلندر پنوماتیک مستقیماً به سر پرس متصل است؛ ساده‌ترین و سریع‌ترین نوع پرس پنوماتیک برای نیروهای کوچک‌تر.",
    descriptionEn:
      "The pneumatic cylinder is mounted directly on the press head; the simplest and fastest type of pneumatic press, for lower forces.",
    orderingCodePattern: "PPN/F[/St]",
    exampleCode: "PPN/170",
    sourcePages: [9, 10],
    imageUrl: "/images/series/ppn.jpg",
  },
  {
    id: "pad",
    code: "PAD",
    nameFa: "پرس اهرمی دستی",
    nameEn: "Hand Lever Press",
    driveType: "hand-lever",
    actuation: "indirect",
    descriptionFa:
      "نیروی محرکه کاملاً دستی از طریق اهرم؛ بدون نیاز به هوای فشرده یا برق. جهت دسته قابل سفارش راست یا چپ است.",
    descriptionEn:
      "Fully manual drive through a lever; no compressed air or electricity required. The handle side can be ordered right- or left-handed.",
    orderingCodePattern: "PAD/F/R or L[/St]",
    exampleCode: "PAD/500/R",
    sourcePages: [11, 12],
    imageUrl: "/images/series/pad.jpg",
  },
  {
    id: "ph",
    code: "PH / PHn",
    nameFa: "پرس لنگی",
    nameEn: "Hand Screw/Crank Press",
    driveType: "hand-screw",
    actuation: "indirect",
    descriptionFa:
      "پرس دستی با مکانیزم لنگ (crank)، کورس ثابت مشخصه (b/m/z) و مناسب کارهای تکرارشونده سبک نظیر مارکینگ یا سوراخ‌کاری کوچک.",
    descriptionEn:
      "Hand-operated crank press with a fixed stroke (b/m/z); suited to light repetitive work such as marking or small hole punching.",
    orderingCodePattern: "PH/F/b or m or z[/St]",
    exampleCode: "PH/16/b",
    sourcePages: [13, 14],
    imageUrl: "/images/series/ph.jpg",
  },
  {
    id: "ash",
    code: "ASH / ASB",
    nameFa: "پرس سه‌صفحه‌ای با قالب یکپارچه",
    nameEn: "Three-Plate Press with Integrated Die Set",
    driveType: "three-plate-hydro-pneumatic",
    actuation: "direct",
    descriptionFa:
      "سیلندر پنوماتیک/هیدرولیک روی یک کفشک سه‌صفحه‌ای کامل (با میل و بوش راهنما) سوار شده؛ برای مونتاژ دقیق قطعات با هم‌راستایی بالا. مدل ASB فقط برای نیروی حداکثر ۴.۵ تن اجرا می‌شود.",
    descriptionEn:
      "A pneumatic/hydraulic cylinder mounted on a complete three-plate die set (with guide pillars and bushes) for precise, well-aligned assembly of parts. The ASB model is built only for a maximum force of 4.5 tonnes.",
    orderingCodePattern: "ASH/PH/a1×b2/[Bush 1-4]/[Fix A1-A4 or B1-B2]",
    exampleCode: "ASH/PH/500×500/1/A1/B2",
    sourcePages: [15],
    imageUrl: "/images/series/ash.jpg",
  },
  {
    id: "psu",
    code: "PSU / PHU",
    nameFa: "پرس سه‌صفحه‌ای روی کفشک استاندارد",
    nameEn: "Three-Plate Press on Standard Die Set",
    driveType: "three-plate-pneumatic",
    actuation: "direct",
    descriptionFa:
      "سیلندر پنوماتیک (PSU) یا هیدروپنوماتیک (PHU) روی کفشک استاندارد گرد (CD) یا مستطیلی (CB) سوار می‌شود؛ گزینه انعطاف‌پذیر برای ساخت پرس اختصاصی حول یک کفشک آماده.",
    descriptionEn:
      "A pneumatic (PSU) or hydro-pneumatic (PHU) cylinder mounted on a standard round (CD) or rectangular (CB) die set; a flexible option for building a custom press around a ready-made die set.",
    orderingCodePattern: "PSU|PHU/CD or CB-Size/[Bush 1-4]",
    exampleCode: "PSU/CB-250×125/1",
    sourcePages: [16],
    imageUrl: "/images/series/psu.jpg",
  },
];

export function getSeriesById(id: string): PressSeries | undefined {
  return pressSeries.find((s) => s.id === id);
}
