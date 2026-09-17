import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("homepage declares every required section", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
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
    assert.match(page, new RegExp(`id=[\\"']${id}[\\"']`));
  }
});
