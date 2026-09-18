import assert from "node:assert/strict";
import test from "node:test";
import { loadModule } from "./load-module.mjs";

const { evaluateSafety } = loadModule("@/lib/safety-rules");
const { buildRecommendation } = loadModule("@/lib/recommendation-engine");

function fullFrequency(value) {
  return Object.fromEntries(["redMeat", "fish", "eggs", "dairy", "legumes", "darkVeg", "fruit", "grains"].map((row) => [row, value]));
}

const fullWellbeing = { sleep: 3, stress: 3, energy: 3, digestion: 3, cycle: 3, hairSkin: 3, recovery: 3 };

const fullSafety = {
  prescription: "no",
  thyroid: "no",
  chronic: "no",
  surgery: "no",
  restricted: "no",
  ingredientAllergy: "no",
};

const greenAnswers = {
  age: "25-34",
  stage: "daily",
  goals: ["sleep"],
  dietPattern: "balanced",
  exclusions: ["none"],
  foodFrequency: fullFrequency("weekly35"),
  wellbeing: fullWellbeing,
  lifestyle: ["exercise"],
  supplements: ["none"],
  safetyChecks: fullSafety,
};

const allCandidates = [
  "d3", "b12", "magnesium", "theanine", "algalDha", "iron", "folate", "choline", "k2", "calcium", "b6", "coq10", "iodine", "fiber", "zinc",
];

test("clean answers produce a green result that can enter checkout", () => {
  const result = evaluateSafety(greenAnswers, allCandidates);
  assert.equal(result.level, "green");
  assert.equal(result.reasons.length, 0);
  assert.equal(result.canCheckout, true);
});

test("pregnancy and breastfeeding always route to yellow with professional confirmation", () => {
  const pregnancy = evaluateSafety({ ...greenAnswers, stage: "pregnancy" }, allCandidates);
  assert.equal(pregnancy.level, "yellow");
  assert.equal(pregnancy.canCheckout, false);
  assert.ok(pregnancy.reasons.some((reason) => reason.includes("孕期")));

  const breastfeeding = evaluateSafety(
    { ...greenAnswers, stage: "postpartum", breastfeeding: "yes" },
    allCandidates,
  );
  assert.equal(breastfeeding.level, "yellow");
  assert.ok(breastfeeding.reasons.some((reason) => reason.includes("哺乳")));
});

test("prescription, thyroid and chronic conditions require professional confirmation", () => {
  for (const flag of ["prescription", "thyroid", "chronic", "surgery"]) {
    const result = evaluateSafety(
      { ...greenAnswers, safetyChecks: { ...fullSafety, [flag]: "yes" } },
      allCandidates,
    );
    assert.equal(result.level, "yellow", `${flag} should trigger yellow`);
    assert.equal(result.canCheckout, false);
  }
});

test("thyroid conditions hold iodine back even when scores favor it", () => {
  const result = buildRecommendation({
    ...greenAnswers,
    stage: "preconception",
    safetyChecks: { ...fullSafety, thyroid: "yes" },
  });
  assert.equal(result.safety.level, "yellow");
  const usedIds = [...result.basePack.ingredients, ...result.focusModules.flatMap((module) => module.ingredients)].map((item) => item.id);
  assert.ok(!usedIds.includes("iodine"), "iodine must not re-enter after exclusion");
  assert.ok(result.whyNotIncluded.some((reason) => reason.includes("碘")), "exclusion is explained in why-not-included");
});

test("existing supplements trigger duplication checks and exclusion", () => {
  const result = buildRecommendation({ ...greenAnswers, stage: "cycle", supplements: ["iron"] });
  assert.equal(result.safety.level, "yellow");
  const usedIds = [...result.basePack.ingredients, ...result.focusModules.flatMap((module) => module.ingredients)].map((item) => item.id);
  assert.ok(!usedIds.includes("iron"), "duplicate iron supplement removes iron from the plan");
  assert.ok(result.whyNotIncluded.some((reason) => reason.includes("重复")));
});

test("professional restrictions and known ingredient allergies stop specific recommendations", () => {
  const restricted = evaluateSafety(
    { ...greenAnswers, safetyChecks: { ...fullSafety, restricted: "yes" } },
    allCandidates,
  );
  assert.equal(restricted.level, "red");
  assert.equal(restricted.canCheckout, false);

  const allergy = evaluateSafety(
    { ...greenAnswers, safetyChecks: { ...fullSafety, ingredientAllergy: "yes" } },
    allCandidates,
  );
  assert.equal(allergy.level, "red");
  assert.equal(allergy.canCheckout, false);
});

test("incomplete safety screening is treated as insufficient information", () => {
  const result = evaluateSafety(
    { ...greenAnswers, safetyChecks: { ...fullSafety, thyroid: undefined } },
    allCandidates,
  );
  assert.equal(result.level, "red");
  assert.ok(result.reasons.some((reason) => reason.includes("不足以")));
});
