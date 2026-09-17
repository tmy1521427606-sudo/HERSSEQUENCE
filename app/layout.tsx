import type { Metadata } from "next";
import { DM_Serif_Display, Inter, Noto_Sans_SC } from "next/font/google";
import "./globals.css";

const serif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const noto = Noto_Sans_SC({
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "她序 HERSEQUENCE｜女性专属营养订阅",
  description: "基于女性阶段与生活方式的个性化维生素订阅服务。",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className={`${serif.variable} ${inter.variable} ${noto.variable}`}>
      <body>{children}</body>
    </html>
  );
}
