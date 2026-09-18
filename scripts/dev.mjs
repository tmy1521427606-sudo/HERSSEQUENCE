/**
 * 隔离版开发服务器。
 *
 * 背景：`next dev` 默认使用 `.next/`，而 `next build`（含 `npm run build`）也会写入 `.next/`。
 * 一旦在 dev 运行期间执行过生产构建，`.next/` 就会被替换成生产产物：
 *   - dev 请求的是 `/_next/static/css/app/layout.css`（dev 命名）
 *   - 目录里只剩 `/_next/static/css/<hash>.css`（生产命名）
 *   → CSS 404、Tailwind 全丢，页面变成无样式，固定在右下角的 AI 顾问按钮
 *     会掉回文档流里（跑到页面很下面的位置），看起来就是“点不开”。
 *
 * 所以这里给 dev 单独一个构建目录 `.next-dev/`，与 `.next/`（build）、
 * `.next-build/`（build:static）彻底分开，任何一方都不会破坏另一方。
 *
 * 用法：npm run dev
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const args = process.argv.slice(2);

const child = spawn(process.execPath, [nextBin, "dev", ...args], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, NEXT_DIST_DIR: ".next-dev" },
});

child.on("exit", (code) => process.exit(code ?? 0));
