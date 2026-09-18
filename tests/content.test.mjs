import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

async function loadContent() {
  const source = await readFile(new URL("../content.ts", import.meta.url), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  Function("module", "exports", output)(module, module.exports);
  return module.exports;
}

test("content has the required catalog sizes and stable ids", async () => {
  const content = await loadContent();
  assert.equal(content.painPoints.length, 3);
  assert.equal(content.steps.length, 3);
  assert.equal(content.personas.length, 6);
  assert.ok(content.ingredients.length >= 8);
  assert.ok(content.stories.length >= 3);
  assert.equal(content.principles.length, 2);
  assert.equal(content.plans.length, 2);
  assert.ok(content.faqs.length >= 6);

  for (const collection of [
    content.painPoints,
    content.steps,
    content.personas,
    content.ingredients,
    content.stories,
    content.plans,
    content.faqs,
  ]) {
    assert.equal(new Set(collection.map((item) => item.id)).size, collection.length);
  }
});

test("visible copy avoids prohibited medical and placeholder claims", async () => {
  const content = await loadContent();
  const text = JSON.stringify(content);
  for (const phrase of ["治愈", "治疗疾病", "预防疾病", "保证效果", "模拟", "演示", "概念展示", "10万+", "10 万+"]) {
    assert.doesNotMatch(text, new RegExp(phrase));
  }
});

test("stories describe scenarios instead of invented individuals", async () => {
  const content = await loadContent();
  for (const story of content.stories) {
    assert.ok(story.scene && story.context, "stories carry scenario and context labels");
    assert.equal(story.name, undefined, "stories must not attribute invented personal names");
  }
  for (const principle of content.principles) {
    assert.equal(principle.initials, undefined, "principles must not carry invented expert identities");
  }
});
