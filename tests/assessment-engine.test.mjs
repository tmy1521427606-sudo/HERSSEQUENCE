import assert from "node:assert/strict";
import test from "node:test";
import { loadModule } from "./load-module.mjs";

const engine = loadModule("@/lib/assessment-engine");
const { questions } = loadModule("@/assessment-content");

const byId = new Map(questions.map((question) => [question.id, question]));

function visibleIds(answers) {
  return engine.computeVisibleQuestions(answers).map((question) => question.id);
}

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

const baseAnswers = {
  age: "25-34",
  stage: "daily",
  goals: ["sleep"],
  dietPattern: "balanced",
  exclusions: ["none"],
  foodFrequency: fullFrequency("weekly35"),
  wellbeing: fullWellbeing,
  lifestyle: ["alcohol"],
  supplements: ["none"],
  safetyChecks: fullSafety,
};

test("six life stages enter the correct branch questions", () => {
  const cases = {
    daily: [],
    preconception: ["preconceptionTiming", "preconceptionSupplement"],
    pregnancy: ["pregnancyStage", "pregnancyAdvice"],
    postpartum: ["postpartumStage", "breastfeeding"],
    cycle: ["cycleRegularity", "cycleImpact"],
    menopause: ["menopausePhase", "menopauseChange"],
  };
  for (const [stage, expected] of Object.entries(cases)) {
    const ids = visibleIds({ ...baseAnswers, stage });
    for (const id of expected) {
      assert.ok(ids.includes(id), `${stage} should reveal ${id}`);
    }
    for (const [otherStage, otherExpected] of Object.entries(cases)) {
      if (otherStage === stage) continue;
      for (const id of otherExpected) {
        assert.ok(!ids.includes(id), `${stage} should not reveal ${id} (branch of ${otherStage})`);
      }
    }
  }
});

test("diet and lifestyle answers trigger conditional follow-ups", () => {
  assert.ok(visibleIds({ ...baseAnswers, dietPattern: "vegetarian" }).includes("plantFocus"));
  assert.ok(visibleIds({ ...baseAnswers, dietPattern: "vegan" }).includes("plantFocus"));
  assert.ok(visibleIds({ ...baseAnswers, dietPattern: "vegan" }).includes("algalPreference"));
  assert.ok(
    visibleIds({ ...baseAnswers, foodFrequency: fullFrequency("rarely") }).includes("algalPreference"),
    "rare fish intake reveals algal oil preference",
  );
  assert.ok(
    visibleIds({ ...baseAnswers, foodFrequency: fullFrequency("rarely") }).includes("calciumSource"),
    "rare dairy intake reveals calcium source question",
  );
  assert.ok(
    visibleIds({ ...baseAnswers, exclusions: ["dairy"], foodFrequency: fullFrequency("daily") }).includes("calciumSource"),
    "dairy exclusion reveals calcium source question",
  );
  assert.ok(visibleIds({ ...baseAnswers, wellbeing: { ...fullWellbeing, sleep: 4 } }).includes("sleepDetail"));
  assert.ok(visibleIds({ ...baseAnswers, lifestyle: ["lateSleep"] }).includes("sleepDetail"));
  assert.ok(visibleIds({ ...baseAnswers, lifestyle: ["exercise"] }).includes("exerciseDetail"));
  assert.ok(visibleIds({ ...baseAnswers, wellbeing: { ...fullWellbeing, cycle: 4 } }).includes("cycleDetail"));
  assert.ok(visibleIds({ ...baseAnswers, wellbeing: { ...fullWellbeing, hairSkin: 4 } }).includes("hairDetail"));
  assert.ok(visibleIds({ ...baseAnswers, wellbeing: { ...fullWellbeing, digestion: 4 } }).includes("digestionDetail"));
});

test("changing an upstream answer clears hidden branch answers", () => {
  const answers = {
    ...baseAnswers,
    stage: "cycle",
    cycleRegularity: "irregular",
    cycleImpact: "moderate",
  };
  assert.ok(engine.isAnswered(byId.get("cycleRegularity"), answers));
  const cleaned = engine.cleanupAnswers({ ...answers, stage: "daily" });
  assert.equal(cleaned.cycleRegularity, undefined, "hidden branch answer is removed");
  assert.equal(cleaned.age, "25-34", "still valid answers survive");
});

test("multi answers normalize the none option and respect limits", () => {
  const cleaned = engine.cleanupAnswers({ ...baseAnswers, exclusions: ["none", "fish", "dairy"] });
  assert.deepEqual(cleaned.exclusions, ["fish", "dairy"], "none is dropped when specific items are selected");

  const error = engine.validateAnswer(byId.get("goals"), { ...baseAnswers, goals: ["sleep", "energy", "cycle"] }, {
    single: "s", multi: "m", multiMax: "最多", scale: "sc", matrix: "ma", confirm: "c",
  });
  assert.equal(error, "最多");
  assert.equal(
    engine.validateAnswer(byId.get("goals"), { ...baseAnswers, goals: [] }, {
      single: "s", multi: "m", multiMax: "最多", scale: "sc", matrix: "ma", confirm: "c",
    }),
    "m",
  );
});

test("matrix, scale and confirm questions require full coverage", () => {
  const matrix = byId.get("foodFrequency");
  const partialMatrix = { ...baseAnswers, foodFrequency: { ...fullFrequency("daily"), fish: undefined } };
  assert.ok(!engine.isAnswered(matrix, partialMatrix));
  assert.ok(engine.isAnswered(matrix, baseAnswers));

  const scale = byId.get("wellbeing");
  assert.ok(!engine.isAnswered(scale, { ...baseAnswers, wellbeing: { ...fullWellbeing, energy: undefined } }));
  assert.ok(engine.isAnswered(scale, baseAnswers));

  const confirm = byId.get("safetyChecks");
  assert.ok(!engine.isAnswered(confirm, { ...baseAnswers, safetyChecks: { ...fullSafety, thyroid: undefined } }));
  assert.ok(engine.isAnswered(confirm, baseAnswers));
});

test("progress and completeness reflect answered chapters", () => {
  const progress = engine.getProgress(baseAnswers);
  assert.ok(progress.percent > 0);
  assert.equal(progress.answered, progress.visible, "all visible questions answered in the base set");

  const completeness = engine.getCompleteness(baseAnswers);
  assert.equal(completeness.length, 5);
  for (const item of completeness) {
    assert.ok(item.complete, `${item.label} should be complete`);
  }

  const incomplete = engine.getCompleteness({ ...baseAnswers, supplements: undefined, safetyChecks: undefined });
  assert.ok(!incomplete.find((item) => item.id === "supplements").complete);
  assert.ok(!incomplete.find((item) => item.id === "safety").complete);
});
