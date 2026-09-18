import assert from "node:assert/strict";
import test from "node:test";
import { loadModule } from "./load-module.mjs";

const { buildRecommendation, computeDimensionScores, getPlanPricing } = loadModule("@/lib/recommendation-engine");

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

function makeAnswers(overrides = {}) {
  return {
    age: "25-34",
    stage: "daily",
    goals: ["balance"],
    dietPattern: "balanced",
    exclusions: ["none"],
    foodFrequency: fullFrequency("weekly35"),
    wellbeing: fullWellbeing,
    lifestyle: [],
    supplements: ["none"],
    safetyChecks: fullSafety,
    ...overrides,
  };
}

test("green results contain exactly one stage base pack and at most two focus modules", () => {
  const result = buildRecommendation(makeAnswers({ goals: ["sleep", "energy"] }));
  assert.equal(result.basePack.title, "每日平衡基础包");
  assert.ok(result.focusModules.length <= 2);
  assert.equal(result.safety.level, "green");
  assert.equal(result.safety.canCheckout, true);
});

test("different goals produce different focus modules and plans", () => {
  const sleep = buildRecommendation(makeAnswers({
    goals: ["sleep"],
    wellbeing: { ...fullWellbeing, sleep: 5, stress: 5 },
  }));
  const energy = buildRecommendation(makeAnswers({
    goals: ["energy"],
    wellbeing: { ...fullWellbeing, energy: 5 },
  }));

  assert.ok(sleep.focusModules.some((module) => module.id === "sleep"));
  assert.ok(energy.focusModules.some((module) => module.id === "energy"));
  assert.ok(!sleep.focusModules.some((module) => module.id === "energy"));
  assert.notDeepEqual(
    sleep.focusModules.map((module) => module.id),
    energy.focusModules.map((module) => module.id),
  );
});

test("focus module ingredients never duplicate the base pack", () => {
  const result = buildRecommendation(makeAnswers({
    goals: ["sleep", "active"],
    lifestyle: ["exercise"],
    wellbeing: { ...fullWellbeing, sleep: 4, recovery: 4 },
  }));
  const baseIds = result.basePack.ingredients.map((item) => item.id);
  for (const module of result.focusModules) {
    for (const ingredient of module.ingredients) {
      assert.ok(!baseIds.includes(ingredient.id), `${ingredient.id} appears in both base pack and a module`);
    }
  }
});

test("stage answers switch the base pack track", () => {
  const cases = {
    daily: "每日平衡基础包",
    preconception: "备孕准备基础包",
    pregnancy: "孕期陪伴基础包",
    postpartum: "产后恢复基础包",
    cycle: "周期关照基础包",
    menopause: "更年期护航基础包",
  };
  for (const [stage, title] of Object.entries(cases)) {
    const result = buildRecommendation(makeAnswers({ stage, goals: ["balance"] }));
    assert.equal(result.basePack.title, title, `${stage} maps to ${title}`);
  }
});

test("plant-based diets surface B12 and algal DHA source notes", () => {
  const vegan = buildRecommendation(makeAnswers({
    dietPattern: "vegan",
    foodFrequency: fullFrequency("rarely"),
  }));
  const noteIds = vegan.dietaryNotes.map((note) => note.id);
  assert.ok(noteIds.includes("plant-b12"));
  assert.ok(noteIds.includes("algal-dha"));
  assert.ok(noteIds.includes("calcium-source"));

  const balanced = buildRecommendation(makeAnswers());
  const balancedIds = balanced.dietaryNotes.map((note) => note.id);
  assert.ok(!balancedIds.includes("plant-b12"));
});

test("dimension scores combine goals, scales, lifestyle and branch details", () => {
  const scores = computeDimensionScores(
    makeAnswers({
      goals: ["sleep"],
      wellbeing: { ...fullWellbeing, sleep: 5 },
      lifestyle: ["lateSleep"],
      sleepDetail: "hardFall",
    }),
  );
  const sleep = scores.find((item) => item.id === "sleep");
  const energy = scores.find((item) => item.id === "energy");
  assert.ok(sleep.score > energy.score);
  assert.ok(sleep.score >= 3 + 4 + 1 + 1, "goal + scale + lifestyle + detail contributions accumulate");
});

test("subscription pricing updates by cycle", () => {
  assert.equal(getPlanPricing("monthly").days, 30);
  assert.equal(getPlanPricing("monthly").total, 299);
  assert.equal(getPlanPricing("quarterly").days, 90);
  assert.equal(getPlanPricing("quarterly").total, 759);
});

test("every recommended ingredient carries source, dose, timing and reason fields", () => {
  const result = buildRecommendation(makeAnswers({ goals: ["sleep"] }));
  const all = [...result.basePack.ingredients, ...result.focusModules.flatMap((module) => module.ingredients)];
  assert.ok(all.length > 0);
  for (const ingredient of all) {
    assert.ok(ingredient.source && ingredient.dose && ingredient.timing && ingredient.benefit);
    assert.ok(["human", "consensus", "design"].includes(ingredient.evidence));
  }
});
