// Explicit register of information gaps found while digitizing the two source PDFs.
// Surfaced in the UI (About / data-quality panel) instead of being silently papered over.

export interface DataGap {
  id: string;
  topicFa: string;
  topicEn: string;
  detailFa: string;
  detailEn: string;
  impactFa: string;
  impactEn: string;
}

export const dataGaps: DataGap[] = [
  {
    id: "no-weight",
    topicFa: "وزن دستگاه‌ها",
    topicEn: "Machine weights",
    detailFa: "کاتالوگ Presses-Catalogue-1.pdf هیچ مقدار وزنی برای هیچ مدلی چاپ نکرده است.",
    detailEn: "The Presses-Catalogue-1.pdf catalogue does not print a weight for any model.",
    impactFa: "امکان محاسبه هزینه حمل یا الزامات زیرسازی کف کارگاه در این نسخه وجود ندارد.",
    impactEn: "Shipping cost or workshop floor/foundation requirements cannot be calculated in this version.",
  },
  {
    id: "no-motor-speed",
    topicFa: "موتور و سرعت (SPM)",
    topicEn: "Motor and speed (SPM)",
    detailFa:
      "این سری از پرس‌ها یا کاملاً دستی (PAD، PH/PHn) یا پنوماتیک/هیدروپنوماتیک بدون موتور الکتریکی مجزا هستند؛ کاتالوگ هیچ سرعت ضربه در دقیقه (SPM) یا توان موتور ذکر نکرده.",
    detailEn: "These presses are either fully manual (PAD, PH/PHn) or pneumatic/hydro-pneumatic without a separate electric motor; the catalogue gives no strokes-per-minute (SPM) or motor power.",
    impactFa: "محاسبه ظرفیت تولید (قطعه بر ساعت) و زمان سیکل دقیق ممکن نیست؛ فقط می‌توان نیروی لازم را با ظرفیت دستگاه مقایسه کرد.",
    impactEn: "Production capacity (parts per hour) and exact cycle time cannot be calculated; only the required force can be compared with the machine capacity.",
  },
  {
    id: "ppn-st-throat",
    topicFa: "ستون C/Ca مدل‌های PPN/420/St و PPN/625/St",
    topicEn: "C/Ca column of models PPN/420/St and PPN/625/St",
    detailFa: "در تصویر منبع، ستون فاصله محور (C) با ستون Ca ادغام/مشترک چاپ شده و عدد دقیق هرکدام به‌طور مجزا قابل تفکیک نبود.",
    detailEn: "In the source image the throat-distance column (C) is printed merged with / shared with column Ca, and the exact value of each could not be separated.",
    impactFa: "مقدار throatDepthMm این دو مدل با درجه اطمینان پایین (lowConfidence) ثبت شده؛ پیش از سفارش با فروش ارس زنجان تایید شود.",
    impactEn: "The throatDepthMm value of these two models is recorded with low confidence (lowConfidence); confirm with Aras Zanjan sales before ordering.",
  },
  {
    id: "phn-25-st-duplicate",
    topicFa: "دو ردیف هم‌نام PHn/25/St",
    topicEn: "Two rows named PHn/25/St",
    detailFa: "جدول صفحه ۱۳ کاتالوگ دو ردیف مجزا (با ارتفاع ۳۲۰mm/Ha=120 و ۴۰۰mm/Ha=200) هر دو را «PHn/25/st» نام‌گذاری کرده که احتمالاً یکی از آن‌ها باید PHn/16/St باشد.",
    detailEn: "The table on catalogue page 13 labels two separate rows (height 320mm/Ha=120 and 400mm/Ha=200) both as \"PHn/25/st\"; one of them is probably meant to be PHn/16/St.",
    impactFa: "تا تایید کاتالوگ اصلی یا فروشنده، فقط ردیف با ارتفاع ۴۰۰mm در پایگاه داده فعلی نگه داشته شده و مورد دیگر حذف شد.",
    impactEn: "Until the original catalogue or the vendor confirms, only the row with 400mm height is kept in the current database and the other was dropped.",
  },
  {
    id: "ph-bmz-meaning",
    topicFa: "معنای دقیق کدهای کورس b / m / z در سری PH",
    topicEn: "Exact meaning of stroke codes b / m / z in the PH series",
    detailFa: "کاتالوگ این حروف را به‌عنوان گزینه‌های کورس (Stroke ID) معرفی کرده اما توضیح متنی از تفاوت مکانیزمی هرکدام نداده؛ فقط تفاوت در ابعاد E قابل استخراج بود.",
    detailEn: "The catalogue introduces these letters as stroke options (Stroke ID) but gives no text explaining the mechanical difference between them; only the difference in dimension E could be extracted.",
    impactFa: "توصیه سیستم بر اساس فاصله محور (E) هر گزینه انجام می‌شود، نه بر اساس عملکرد مکانیزمی متفاوت احتمالی.",
    impactEn: "The system's recommendation is based on the throat distance (E) of each option, not on any possible difference in mechanical behaviour.",
  },
  {
    id: "die-set-stack-dims",
    topicFa: "ابعاد کامل پشته کفشک (میل/بوش/پیچ) سری‌های ASH/ASB و PSU/PHU",
    topicEn: "Full die-set stack dimensions (pillar/bush/screw) of the ASH/ASB and PSU/PHU series",
    detailFa: "کاتالوگ ده‌ها بعد ریز (l1..l4، e1، e2، M1..M4 و مشابه) برای هر پلاک را چاپ کرده که برای انتخاب اولیه پرس ضروری نیست.",
    detailEn: "The catalogue prints dozens of minor dimensions (l1..l4, e1, e2, M1..M4 and similar) for each plate, which are not essential for initial press selection.",
    impactFa: "این ابعاد در پایگاه داده فعلی خلاصه نشده‌اند؛ برای طراحی دقیق کفشک باید به فایل اصلی PDF (صفحه ۱۵ و ۱۶) مراجعه شود.",
    impactEn: "These dimensions are not summarised in the current database; refer to the original PDF (pages 15 and 16) for detailed die-set design.",
  },
  {
    id: "no-heavy-stamping",
    topicFa: "پرس‌های تولیدی سنگین (کشش عمیق قطعات بزرگ، Progressive Die صنعتی، خودرو)",
    topicEn: "Heavy production presses (deep drawing of large parts, industrial progressive dies, automotive)",
    detailFa:
      "کاتالوگ فعلی ارس زنجان هیچ پرس تولیدی با تناژ بالا (مثلاً بالای ۱۵ تن، فریم C یا H صنعتی با موتور و فلای‌ویل) معرفی نکرده — محصولات موجود همگی پرس‌های میزی/ستونی زیر ۱۱ تن هستند.",
    detailEn: "The current Aras Zanjan catalogue lists no high-tonnage production press (e.g. above 15 tonnes, industrial C- or H-frame with motor and flywheel); all available products are bench/column presses below 11 tonnes.",
    impactFa:
      "اگر نیاز مشتری تولید انبوه قطعات بدنه خودرو یا کشش عمیق قطعات بزرگ باشد، این اپلیکیشن صادقانه اعلام می‌کند که محصول مناسب در کاتالوگ فعلی وجود ندارد به‌جای پیشنهاد نادرست یکی از مدل‌های سبک.",
    impactEn: "If the customer needs mass production of automotive body parts or deep drawing of large parts, this application states honestly that no suitable product exists in the current catalogue, instead of wrongly recommending one of the light models.",
  },
  {
    id: "material-list-generic",
    topicFa: "جدول استحکام کششی مواد، مرجع عمومی است نه اختصاصی ارس زنجان",
    topicEn: "The tensile strength table is a general reference, not specific to Aras Zanjan",
    detailFa: "این جدول یک مرجع مهندسی عمومی طبق استانداردهای DIN EN است و مستقیماً محصول ارس زنجان نیست؛ صرفاً به‌عنوان مرجع محاسبه نیرو بر اساس جنس ماده استفاده شده.",
    detailEn: "This table is a general engineering reference based on DIN EN standards and is not directly an Aras Zanjan product; it is used only as a reference for force calculation by material grade.",
    impactFa: "مقادیر استحکام کششی معتبر و طبق استاندارد DIN EN هستند اما ارتباطی به تناژ دستگاه‌های ارس زنجان ندارند و باید مستقل ارزیابی شوند.",
    impactEn: "The tensile strength values are valid per DIN EN, but they are unrelated to the tonnage of Aras Zanjan machines and must be evaluated independently.",
  },
];
