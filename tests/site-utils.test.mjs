import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

async function loadUtils() {
  const source = await readFile(new URL("../lib/site-utils.ts", import.meta.url), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  Function("module", "exports", output)(module, module.exports);
  return module.exports;
}

test("filters ingredients by a selected transparency tag", async () => {
  const { filterIngredients } = await loadUtils();
  const items = [
    { id: "a", tags: ["vegan"] },
    { id: "b", tags: ["pregnancy", "allergenFree"] },
  ];

  assert.deepEqual(filterIngredients(items, "all").map((item) => item.id), ["a", "b"]);
  assert.deepEqual(filterIngredients(items, "pregnancy").map((item) => item.id), ["b"]);
});

test("formats subscription prices and per-day cost", async () => {
  const { formatPrice, pricePerDay } = await loadUtils();
  assert.equal(formatPrice(759), "¥759");
  assert.equal(pricePerDay(759, 90), "¥8.4 / 天");
});

test("maps a real RTC session state onto the panel display state", async () => {
  const { voiceDisplayState } = await loadUtils();

  // 配了后端地址时，展示状态就是 RTC 的真实状态（不再有演示用的状态轮播）
  assert.equal(voiceDisplayState("idle", true), "idle");
  assert.equal(voiceDisplayState("connecting", true), "connecting");
  assert.equal(voiceDisplayState("active", true), "active");
  assert.equal(voiceDisplayState("error", true), "error");

  // 静态导出站没注入 NEXT_PUBLIC_VOICE_API 时，属于构建配置缺失，
  // 要单独表达成 unsupported，而不是让用户点了才发现报错
  assert.equal(voiceDisplayState("idle", false), "unsupported");
  assert.equal(voiceDisplayState("active", false), "unsupported");
});
