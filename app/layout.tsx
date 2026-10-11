import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SplashSkipScript } from "@/components/SplashSkipScript";
import "./globals.css";

export const metadata: Metadata = {
  title: "Outplay — حلّل. افهم. اتقدّم.",
  description: "تحليل الشطرنج بالعربي — افهم كل غلطة وليه.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;700;900&family=Inter:wght@300;400;500;600;700;900&family=Cairo:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SplashSkipScript />
        {children}
        <Analytics />
        <Script
          src="https://umami-two-nu.vercel.app/script.js"
          data-website-id="cba17b50-a680-47d3-abc3-f6f2251c87e5"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
