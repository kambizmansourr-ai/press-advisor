import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { AppHeader } from "@/components/AppHeader";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { SiteFooter } from "@/components/SiteFooter";
import { LanguageProvider } from "@/lib/i18n";

const vazirmatn = Vazirmatn({
  variable: "--font-vazir",
  subsets: ["arabic", "latin"],
  display: "swap",
});

const EARLY_LANG_SCRIPT = `(function(){try{var q=new URLSearchParams(location.search).get("lang");var l=(q==="en"||q==="fa")?q:localStorage.getItem("lang");if(l==="en"){var d=document.documentElement;d.setAttribute("lang","en");d.setAttribute("dir","ltr");d.setAttribute("data-lang-pending","");setTimeout(function(){d.removeAttribute("data-lang-pending")},3000)}}catch(e){}})();`;

export const metadata: Metadata = {
  title: "سیستم هوشمند ارس زنجان | Aras Zanjan Smart System | AZCO",
  description:
    "سیستم هوشمند مهندسی ارس زنجان: انتخاب پرس مناسب بر اساس کاربرد، ماشین‌حساب‌های فرآیندهای فلزکاری و راهنمای رایگان انتخاب اینسرت کاربایدی. Aras Zanjan engineering smart system: press selection by application, metalworking calculators and a free carbide insert selection guide.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-180.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Aras Zanjan",
  },
};

export const viewport: Viewport = {
  themeColor: "#0e7c86",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: EARLY_LANG_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <LanguageProvider>
            <ServiceWorkerRegister />
            <AppHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
