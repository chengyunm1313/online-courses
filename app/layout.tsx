import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "線上課程平台 - 學習專業技能，開啟職涯新篇章",
  description: "提供高品質的線上課程，涵蓋程式設計、數據分析、設計等多種專業領域。隨時隨地學習，掌握未來技能。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body className={`antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
