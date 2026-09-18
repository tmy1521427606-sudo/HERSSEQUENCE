import type { Metadata, Viewport } from "next";
import "./globals.css";
import AdvisorWidget from "@/components/AdvisorWidget";
import CookieNotice from "@/components/CookieNotice";
import AuthProvider from "@/components/AuthProvider";

const title = "她序 HERSEQUENCE｜女性阶段定制营养订阅";
const description =
  "按生命阶段、饮食方式与作息状态组合每日营养的维生素订阅服务：四章节自适应测评、成分来源与剂量透明、绿黄红三级安全分流。";
const shareImage = "/images/hero-women-optimized.webp";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://hersequence.example"),
  title: { default: title, template: "%s｜她序 HERSEQUENCE" },
  description,
  applicationName: "她序 HERSEQUENCE",
  keywords: ["女性营养", "定制维生素", "营养订阅", "备孕营养", "孕期营养", "周期营养", "更年期营养"],
  icons: { icon: "/favicon.svg" },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "她序 HERSEQUENCE",
    title,
    description,
    images: [{ url: shareImage, width: 1600, height: 900, alt: "她序 HERSEQUENCE 品牌形象" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [shareImage],
  },
};

export const viewport: Viewport = {
  themeColor: "#1A1A2E",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        {/* 顾问面板、测评选项与登录都依赖 JavaScript；脚本未执行时页面看着完整但点不动，
            这里给出明确提示，避免被误判成“按钮坏了”。 */}
        <noscript>
          <div
            role="alert"
            style={{
              position: "fixed",
              inset: "0 0 auto 0",
              zIndex: 999,
              background: "#1A1A2E",
              color: "#fff",
              padding: "12px 16px",
              textAlign: "center",
              fontSize: "14px",
              lineHeight: 1.6,
            }}
          >
            当前浏览器未执行 JavaScript：页面样式会正常显示，但顾问面板、测评选项、登录与结算都无法使用。请在浏览器设置中允许 JavaScript 后刷新页面。
          </div>
        </noscript>
        <AuthProvider>
          {children}
          <AdvisorWidget />
          <CookieNotice />
        </AuthProvider>
      </body>
    </html>
  );
}
