import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "她序 HERSEQUENCE｜女性专属营养订阅",
  description: "基于女性阶段与生活方式的个性化维生素订阅服务。",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
