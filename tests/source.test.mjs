import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("homepage declares every required section", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const experience = await readFile(new URL("../components/HomeExperience.tsx", import.meta.url), "utf8");
  const source = `${page}\n${experience}`;
  for (const id of [
    "hero",
    "pain-points",
    "how-it-works",
    "personas",
    "ingredients",
    "stories",
    "pricing",
    "faq",
    "final-cta",
  ]) {
    assert.match(source, new RegExp(`id=[\\"']${id}[\\"']`));
  }
});

test("homepage exposes accessibility affordances", async () => {
  const source = await readFile(new URL("../components/HomeExperience.tsx", import.meta.url), "utf8");
  for (const marker of ["跳到主要内容", "aria-expanded", "aria-live", "prefers-reduced-motion", "界面交互展示"]) {
    assert.match(source, new RegExp(marker));
  }
});

test("assessment route exposes the adaptive flow and accessibility affordances", async () => {
  const files = [
    "../app/quiz/page.tsx",
    "../assessment-content.ts",
    "../components/assessment/AssessmentExperience.tsx",
    "../components/assessment/QuestionRenderer.tsx",
    "../components/assessment/ExitConfirm.tsx",
    "../components/assessment/ResultDashboard.tsx",
    "../components/assessment/AssessmentCheckout.tsx",
  ];
  let source = "";
  for (const file of files) {
    source += await readFile(new URL(file, import.meta.url), "utf8");
    source += "\n";
  }

  for (const marker of [
    "AssessmentExperience",
    "生成我的营养方案",
    "退出测评",
    "aria-pressed",
    "aria-live",
    "aria-modal",
    "安全支付",
    "订阅已确认",
    "prefers-reduced-motion",
  ]) {
    assert.match(source, new RegExp(marker), `assessment flow should expose ${marker}`);
  }
});

test("homepage primary assessment CTAs enter the assessment route", async () => {
  const source = await readFile(new URL("../components/HomeExperience.tsx", import.meta.url), "utf8");
  const quizLinks = source.match(/href=["']\/quiz["']/g) ?? [];

  assert.ok(quizLinks.length >= 3);
});

test("customer-visible sources never use placeholder-ware wording", async () => {
  const targets = [
    "app/page.tsx",
    "app/layout.tsx",
    "app/quiz/page.tsx",
    "components/HomeExperience.tsx",
    "content.ts",
    "assessment-content.ts",
    "lib/site-utils.ts",
    "lib/assessment-engine.ts",
    "lib/recommendation-engine.ts",
    "lib/safety-rules.ts",
  ];
  const assessmentDir = await readdir(path.join(root, "components/assessment"));
  for (const file of assessmentDir.filter((name) => name.endsWith(".tsx"))) {
    targets.push(`components/assessment/${file}`);
  }

  const banned = ["模拟", "演示", "概念展示"];
  for (const target of targets) {
    const source = await readFile(path.join(root, target), "utf8");
    for (const phrase of banned) {
      assert.ok(!source.includes(phrase), `${target} must not contain "${phrase}"`);
    }
  }
});
