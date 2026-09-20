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
import {
  cpSync,
  existsSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
} from "node:fs";
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

// 先清空导出目录。
// 为什么必须清：如果上一次构建在 “Collecting build traces” 阶段被打断（本项目出现过），
// distDir 里会留下「新 HTML + 旧 _next/static」的混合产物 —— index.html 在、_next/static 也在，
// 能骗过下面的存在性校验，于是同步出一个 CSS 全丢的站点：Tailwind 没了，
// 右下角 position:fixed 的 AI 顾问按钮掉进文档流（跑到页面很下面），看起来就是“点不开”。
rmSync(exportDir, { recursive: true, force: true });

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

// 导出完整性校验：每张 HTML 引用的每个 /_next/... 资源都必须真实存在。
// 只判断 index.html 与 _next/static 存在是不够的（见上面清空 distDir 的注释），
// 那正是本项目出过一次「同步出无 CSS 站点」的原因。
const htmlFiles = readdirSync(exportDir).filter((f) => f.endsWith(".html"));

if (htmlFiles.length === 0) {
  console.error(`\n没有在 ${distDir}/ 找到任何导出的 HTML，已跳过同步。`);
  process.exit(1);
}

const referenced = new Set();
for (const file of htmlFiles) {
  const content = readFileSync(path.join(exportDir, file), "utf8");
  for (const match of content.matchAll(/\/_next\/[A-Za-z0-9._/-]+\.(?:js|css)/g)) {
    referenced.add(match[0]);
  }
}

const missing = Array.from(referenced).filter(
  (ref) => !existsSync(path.join(exportDir, ref.replace(/^\//, ""))),
);

if (missing.length > 0) {
  console.error(
    `\n导出不完整：${missing.length} 个被引用的资源缺失，已放弃同步，out/ 保持不变。`,
  );
  for (const ref of missing.slice(0, 10)) console.error(`   缺失 ${ref}`);
  console.error(
    "   常见原因：上一次构建在 Collecting build traces 阶段被打断，导出目录留下了混合产物。",
  );
  console.error("   处理方式：重新执行 npm run build:static，确保构建完整跑完。");
  process.exit(1);
}

console.log(
  `  导出完整性校验通过：${htmlFiles.length} 张 HTML、${referenced.size} 个资源全部存在。`,
);

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
