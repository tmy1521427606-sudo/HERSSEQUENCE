/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  poweredByHeader: false,
  // 目录约定（实测 Next 14 行为：构建产物始终落在 .next/，distDir 只决定静态导出的目录）
  //   npm run dev         → dev 产物 .next-dev/（scripts/dev.mjs 注入）
  //   npm run build       → 构建 .next/   + 导出到 .next/
  //   npm run build:static→ 构建 .next/   + 导出到 .next-build/ → 同步到 out/
  // 关键点：dev 必须用独立的 .next-dev/。如果 dev 用默认 .next/，
  // 任何一次生产构建都会把 dev 的 CSS 资源名换成 hash 版，
  // dev 请求的 /_next/static/css/app/layout.css 就会 404：
  // 页面样式全丢，右下角固定的 AI 顾问按钮掉进文档流，看起来像“点不开”。
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
