import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { AppHeader } from "@/components/AppHeader";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const vazirmatn = Vazirmatn({
  variable: "--font-vazir",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "سیستم هوشمند انتخاب پرس | ارس زنجان",
  description:
    "سیستم پشتیبان تصمیم مهندسی برای انتخاب پرس مناسب از میان محصولات شرکت ارس زنجان بر اساس کاربرد، جنس و ابعاد قطعه.",
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
    title: "ارس زنجان",
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
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <ServiceWorkerRegister />
          <AppHeader />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-border py-6 text-center text-xs text-muted">
            سیستم هوشمند انتخاب پرس — بر پایه کاتالوگ رسمی شرکت ارس زنجان (AZCO). داده‌های فنی از کاتالوگ منبع استخراج شده و در بخش «کیفیت داده» قابل بررسی است.
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
