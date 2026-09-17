import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

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

test("homepage exposes accessibility and demo-state affordances", async () => {
  const source = await readFile(new URL("../components/HomeExperience.tsx", import.meta.url), "utf8");
  for (const marker of [
    "跳到主要内容",
    "aria-expanded",
    "aria-live",
    "prefers-reduced-motion",
    "仅为交互演示",
  ]) {
    assert.match(source, new RegExp(marker));
  }
});
