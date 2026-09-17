import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

async function loadUtils() {
  const contentSource = await readFile(new URL("../quiz-content.ts", import.meta.url), "utf8");
  const utilsSource = await readFile(new URL("../lib/quiz-utils.ts", import.meta.url), "utf8");
  const compilerOptions = { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 };
  const contentOutput = ts.transpileModule(contentSource, { compilerOptions }).outputText;
  const utilsOutput = ts.transpileModule(utilsSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const contentModule = { exports: {} };
  Function("module", "exports", contentOutput)(contentModule, contentModule.exports);
  const utilsModule = { exports: {} };
  const require = (id) => {
    if (id === "@/quiz-content") return contentModule.exports;
    throw new Error(`Unexpected import: ${id}`);
  };
  Function("module", "exports", "require", utilsOutput)(utilsModule, utilsModule.exports, require);
  return utilsModule.exports;
}

test("generates distinct focus plans and keeps the maternal caution", async () => {
  const { generatePlan } = await loadUtils();
  const sleep = generatePlan({ stage: "daily", goal: "sleep", diet: "balanced", routine: "late" });
  const energy = generatePlan({ stage: "daily", goal: "energy", diet: "balanced", routine: "regular" });

  assert.notEqual(sleep.title, energy.title);
  assert.deepEqual(
    sleep.nutrients.slice(0, 2).map((item) => item.name),
    ["甘氨酸镁", "L-茶氨酸"],
  );

  const maternal = generatePlan({ stage: "maternal", goal: "balance", diet: "balanced", routine: "regular" });
  assert.match(maternal.caution, /专业人士/);
});

test("adapts source notes for plant-based diets and routine strain", async () => {
  const { generatePlan } = await loadUtils();
  const plan = generatePlan({ stage: "preconception", goal: "balance", diet: "vegan", routine: "shift" });

  assert.match(plan.sourceNote, /藻油 DHA/);
  assert.match(plan.sourceNote, /活性 B12/);
  assert.match(plan.routineNote, /轮班/);
});

test("returns literal 30 and 90 day totals", async () => {
  const { getOrderSummary } = await loadUtils();

  assert.deepEqual(getOrderSummary("monthly"), { days: 30, compareAt: 359, total: 299, saving: 60 });
  assert.deepEqual(getOrderSummary("quarterly"), { days: 90, compareAt: 1077, total: 759, saving: 318 });
});

test("requires every delivery field and one payment option", async () => {
  const { validateCheckout } = await loadUtils();

  assert.deepEqual(validateCheckout({ name: "", phone: "", city: "", address: "" }, ""), {
    name: "请输入收货人姓名",
    phone: "请输入手机号码",
    city: "请输入所在城市",
    address: "请输入详细地址",
    payment: "请选择模拟支付方式",
  });
  assert.deepEqual(
    validateCheckout(
      { name: "林岚", phone: "13800138000", city: "上海", address: "静安区示例路 1 号" },
      "wechat",
    ),
    {},
  );
});
