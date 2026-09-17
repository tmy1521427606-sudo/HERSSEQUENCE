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

test("cycles through the three demo voice states", async () => {
  const { nextVoiceState } = await loadUtils();
  assert.equal(nextVoiceState("idle"), "connecting");
  assert.equal(nextVoiceState("connecting"), "active");
  assert.equal(nextVoiceState("active"), "idle");
});
