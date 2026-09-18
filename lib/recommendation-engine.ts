import {
  assessmentCopy,
  basePacks,
  dimensionLabels,
  focusModules,
  ingredients,
  planPricing,
  stageLabels,
  type AssessmentAnswers,
  type BillingCycle,
  type DietaryNote,
  type DimensionId,
  type OrderSummary,
  type PlanIngredient,
  type StageId,
} from "@/assessment-content";
import { getCompleteness, getMatrix, getMulti, getScale, getSingle, type CompletenessItem } from "@/lib/assessment-engine";
import { evaluateSafety, type SafetyEvaluation } from "@/lib/safety-rules";

const dimensionIds: DimensionId[] = ["sleep", "energy", "cycle", "recovery", "digestion", "hairSkin"];

const goalToDimension: Record<string, DimensionId> = {
  sleep: "sleep",
  energy: "energy",
  active: "recovery",
  cycle: "cycle",
  digestion: "digestion",
  hairSkin: "hairSkin",
};

const scaleToDimension: Record<string, DimensionId> = {
  sleep: "sleep",
  stress: "sleep",
  energy: "energy",
  digestion: "digestion",
  cycle: "cycle",
  hairSkin: "hairSkin",
  recovery: "recovery",
};

const lifestyleToDimension: Record<string, DimensionId> = {
  lateSleep: "sleep",
  shiftWork: "sleep",
  caffeine: "sleep",
  exercise: "recovery",
};

const detailToDimension: Record<string, DimensionId> = {
  sleepDetail: "sleep",
  exerciseDetail: "recovery",
  cycleDetail: "cycle",
  hairDetail: "hairSkin",
  digestionDetail: "digestion",
};

/** 重点模块入选的最低关注度得分。 */
const moduleThreshold = 5;

export type DimensionScore = { id: DimensionId; label: string; score: number };

export type RecommendationModule = {
  id: DimensionId;
  title: string;
  label: string;
  summary: string;
  ingredients: PlanIngredient[];
};

export type RecommendationResult = {
  stage: StageId;
  stageLabel: string;
  stageSummary: string;
  basePack: {
    id: StageId;
    title: string;
    label: string;
    summary: string;
    reason: string;
    ingredients: PlanIngredient[];
  };
  focusModules: RecommendationModule[];
  dimensionScores: DimensionScore[];
  dietaryNotes: DietaryNote[];
  whyIncluded: string[];
  whyNotIncluded: string[];
  completeness: CompletenessItem[];
  safety: SafetyEvaluation;
};

export function getPlanPricing(cycle: BillingCycle): OrderSummary {
  return planPricing[cycle];
}

export function computeDimensionScores(answers: AssessmentAnswers): DimensionScore[] {
  const scores: Record<DimensionId, number> = {
    sleep: 0,
    energy: 0,
    cycle: 0,
    recovery: 0,
    digestion: 0,
    hairSkin: 0,
  };

  for (const goal of getMulti(answers, "goals")) {
    const dimension = goalToDimension[goal];
    if (dimension) scores[dimension] += 3;
  }

  const wellbeing = getScale(answers, "wellbeing");
  for (const [item, dimension] of Object.entries(scaleToDimension)) {
    const value = wellbeing[item];
    if (typeof value === "number") scores[dimension] += value - 1;
  }

  for (const item of getMulti(answers, "lifestyle")) {
    const dimension = lifestyleToDimension[item];
    if (dimension) scores[dimension] += 1;
  }

  for (const [questionId, dimension] of Object.entries(detailToDimension)) {
    if (getSingle(answers, questionId)) scores[dimension] += 1;
  }

  const stage = getSingle(answers, "stage") as StageId;
  if (stage === "cycle") scores.cycle += 2;
  if (stage === "menopause") {
    if (getSingle(answers, "menopauseChange") === "hotFlush") scores.sleep += 1;
    if (getSingle(answers, "menopauseChange") === "bone") scores.recovery += 1;
  }

  return dimensionIds.map((id) => ({ id, label: dimensionLabels[id], score: scores[id] }));
}

export function buildDietaryNotes(answers: AssessmentAnswers): DietaryNote[] {
  const notes: DietaryNote[] = [];
  const diet = getSingle(answers, "dietPattern");
  const frequency = getMatrix(answers, "foodFrequency");
  const lifestyle = getMulti(answers, "lifestyle");

  if (diet === "vegetarian" || diet === "vegan") {
    notes.push({
      id: "plant-b12",
      title: "维生素 B12 来源",
      copy: "植物性饮食中 B12 来源有限，方案优先选择发酵来源的活性 B12，并建议定期关注整体状态。",
    });
  }

  if (diet === "vegan" || frequency.fish === "rarely" || frequency.fish === "weekly12") {
    notes.push({
      id: "algal-dha",
      title: "藻油 DHA 来源",
      copy: "鱼类摄入较少时，藻油是植物来源的 Omega-3 选择；如对藻类来源也敏感，请先咨询专业人士。",
    });
  }

  if (diet === "vegan" || diet === "vegetarian" || frequency.redMeat === "rarely") {
    notes.push({
      id: "iron-attention",
      title: "铁的关注方向",
      copy: "红肉摄入较少时，铁更容易处于边缘状态；饮食信号只提示关注方向，不代表缺乏结论。",
    });
  }

  if (frequency.dairy === "rarely" || getMulti(answers, "exclusions").includes("dairy")) {
    notes.push({
      id: "calcium-source",
      title: "钙的替代来源",
      copy: "不依赖奶制品时，可以从钙强化食品、豆制品与深绿叶菜补足；方案中的钙采用海藻来源。",
    });
  }

  if (lifestyle.includes("indoor")) {
    notes.push({
      id: "vitamin-d",
      title: "日照与维生素 D",
      copy: "户外日照较少时，维生素 D 更依赖补充来源，方案中的 D3 采用地衣来源，素食可用。",
    });
  }

  if (diet === "irregular") {
    notes.push({
      id: "regular-meals",
      title: "先回到规律进餐",
      copy: "补充剂不能替代完整膳食。先保证规律进餐与食物多样性，再谈额外补充。",
    });
  }

  return notes;
}

export function buildRecommendation(answers: AssessmentAnswers): RecommendationResult {
  const stage = (getSingle(answers, "stage") || "daily") as StageId;
  const pack = basePacks[stage];
  const dimensionScores = computeDimensionScores(answers);

  // 依据得分挑选重点模块候选（先不应用排除，排除交给安全层统一裁决）。
  const ranked = [...dimensionScores].sort((a, b) => b.score - a.score);
  const moduleCandidates = ranked.filter((item) => item.score >= moduleThreshold).slice(0, 2);
  const fallback = ranked.filter((item) => item.score < moduleThreshold).length > 0 ? [] : [];

  // 候选成分集合 = 基础包 + 全部模块候选成分，交给安全规则评估。
  const candidateIds = Array.from(new Set([...pack.ingredientIds, ...moduleCandidates.flatMap((item) => focusModules[item.id].ingredientIds)]));
  const safety = evaluateSafety(answers, candidateIds);
  const excluded = new Set(safety.excludedIngredientIds);

  // 基础包成分：应用排除。
  const baseIngredients = pack.ingredientIds
    .filter((id) => !excluded.has(id))
    .map((id) => ingredients[id])
    .filter(Boolean);

  // 重点模块：去掉与基础包重复及被排除的成分；模块为空则顺延到下一位候选。
  const baseIngredientIds = new Set(baseIngredients.map((item) => item.id));
  const selectedModules: RecommendationModule[] = [];
  const taken = new Set(baseIngredientIds);
  const queue = ranked.filter((item) => item.score >= moduleThreshold);
  for (const candidate of queue) {
    if (selectedModules.length >= 2) break;
    const focusModule = focusModules[candidate.id];
    const moduleIngredients = focusModule.ingredientIds
      .filter((id) => !excluded.has(id) && !taken.has(id))
      .map((id) => ingredients[id])
      .filter(Boolean);
    if (moduleIngredients.length === 0) continue;
    moduleIngredients.forEach((item) => taken.add(item.id));
    selectedModules.push({
      id: focusModule.id,
      title: focusModule.title,
      label: focusModule.label,
      summary: focusModule.summary,
      ingredients: moduleIngredients,
    });
  }

  // 为什么加入。
  const whyIncluded: string[] = [`阶段基础包：${pack.reason}`];
  for (const selected of selectedModules) {
    const score = dimensionScores.find((item) => item.id === selected.id);
    whyIncluded.push(`${selected.title}：你的关注度得分最高（${score?.score ?? 0} 分），进入重点模块。`);
  }
  const dietaryNotes = buildDietaryNotes(answers);
  for (const note of dietaryNotes) {
    whyIncluded.push(`${note.title}：依据你的饮食回答生成来源提示。`);
  }

  // 为什么没有加入。
  const whyNotIncluded: string[] = [];
  for (const id of safety.excludedIngredientIds) {
    whyNotIncluded.push(safety.exclusionReasons[id] ?? `${ingredients[id]?.name ?? id} 已被安全规则排除。`);
  }
  for (const dimension of dimensionIds) {
    const entry = dimensionScores.find((item) => item.id === dimension);
    const selected = selectedModules.some((module) => module.id === dimension);
    if (!selected && (entry?.score ?? 0) > 0) {
      whyNotIncluded.push(`「${dimensionLabels[dimension]}」关注度未达到优先级门槛，未加入对应模块，保持组合克制。`);
    }
  }
  if (selectedModules.length < 2 && moduleCandidates.length === 0) {
    whyNotIncluded.push("当前答案没有形成明显的重点方向，方案保持基础配置，避免成分堆叠。");
  }

  const completeness = getCompleteness(answers);

  return {
    stage,
    stageLabel: stageLabels[stage],
    stageSummary: pack.summary,
    basePack: {
      id: pack.id,
      title: pack.title,
      label: pack.label,
      summary: pack.summary,
      reason: pack.reason,
      ingredients: baseIngredients,
    },
    focusModules: selectedModules,
    dimensionScores,
    dietaryNotes,
    whyIncluded,
    whyNotIncluded,
    completeness,
    safety,
  };
}
