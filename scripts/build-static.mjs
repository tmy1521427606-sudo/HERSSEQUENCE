/**
 * 开发服务器安全版静态构建。
 *
 * 背景：`next dev` 与 `next build` 默认共用 `.next` 目录，在 dev 正在运行时执行
 * `next build` 会覆盖 dev 的编译产物，导致 dev server 报 500（Cannot find module './xxx.js'）。
 *
 * 这个脚本把构建产物写进独立的 `.next-build/`，再把结果同步到 `out/`，
 * 因此可以在 3000 端口的 dev server 继续运行时安全地刷新静态预览。
 *
 * 用法：npm run build:static
 */
import { spawn } from "node:child_process";
import { cpSync, existsSync, renameSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = ".next-build";
const exportDir = path.join(root, distDir);
const outDir = path.join(root, "out");
const stagingDir = path.join(root, ".out-staging");

const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");

console.log(`[build:static] 1/2 正在构建（产物写入 ${distDir}/，不影响 .next/ 与 dev server）…`);

const dotNext = path.join(root, ".next-dev");
const dotNextStamp = (() => {
  try {
    return statSync(dotNext).mtimeMs;
  } catch {
    return null;
  }
})();

const code = await new Promise((resolve) => {
  const child = spawn(process.execPath, [nextBin, "build"], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, NEXT_DIST_DIR: distDir },
  });
  // 用 exit 而不是 close：next build 可能留下未关闭的 stdio 句柄，
  // 只监听 close 会让脚本看似“卡住”而不进入同步阶段。
  child.on("exit", (exitCode) => resolve(exitCode));
});

if (code !== 0) {
  console.error(`\n构建失败（退出码 ${code}），out/ 保持不变。`);
  process.exit(code ?? 1);
}

// 安全兜底：dev 用的是 .next-dev/，构建不应该碰它。
// 一旦被碰，dev 会变成“CSS 全丢、按钮点不动”的状态，这里必须报警。
const dotNextAfter = (() => {
  try {
    return statSync(dotNext).mtimeMs;
  } catch {
    return null;
  }
})();

if (dotNextAfter !== dotNextStamp) {
  console.warn(
    "\n⚠️  检测到 .next-dev/ 在构建期间被修改，dev server 可能已被污染。\n" +
      "   修复方式：停掉 dev，删除 .next-dev/，再执行 npm run dev。",
  );
}

if (!existsSync(path.join(exportDir, "index.html"))) {
  console.error(`\n没有在 ${distDir}/ 找到导出的 index.html，已跳过同步。`);
  process.exit(1);
}

console.log(`[build:static] 2/2 正在同步 ${distDir}/ → out/（先写临时目录再整体替换，避免同步中断留下半成品）…`);

// 先复制到临时目录，成功后再整体替换 out/。
// 直接 rmSync(out) + cpSync 一旦中途被打断，out/ 会只剩一半文件（且缺少 _next/），
// 4173 预览会白屏。
rmSync(stagingDir, { recursive: true, force: true });
cpSync(exportDir, stagingDir, { recursive: true });

if (!existsSync(path.join(stagingDir, "_next", "static"))) {
  rmSync(stagingDir, { recursive: true, force: true });
  console.error("\n临时目录校验失败（缺少 _next/static），已放弃同步，out/ 保持不变。");
  process.exit(1);
}

rmSync(outDir, { recursive: true, force: true });
renameSync(stagingDir, outDir);

console.log(`\n已同步 ${distDir}/ → out/，本地 4173 预览即可看到最新构建。`);
