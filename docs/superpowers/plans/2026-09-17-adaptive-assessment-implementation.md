# 她序自适应营养测评 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有四步营销测评替换为四章节、九个核心问题、三至七个条件分支的女性营养自适应评估，并按绿色、黄色、红色安全等级交付可解释结果与受控订阅流程。

**Architecture:** 题库和正式文案集中在 `assessment-content.ts`；可见题目、隐藏答案清理、校验、进度与完整度由纯函数引擎计算；安全规则独立于推荐评分且最后拥有否决权；React 组件只保存内存状态、渲染派生结果和处理导航。旧 `quiz-content.ts`、`lib/quiz-utils.ts` 与 `components/QuizExperience.tsx` 在新流程接通后删除，最终只保留一套测评规则。

**Tech Stack:** Next.js 14 App Router、React 18、TypeScript 5、Tailwind CSS 3、Framer Motion 11、Node.js 内置测试运行器。

**Spec:** `docs/superpowers/specs/2026-09-17-adaptive-assessment-design.md`

## Global Constraints

- 测评包含四个章节、九个核心问题；用户根据答案进入三至七个分支问题，总时长目标为四至六分钟。
- 不接入真实 AI 推理、药物相互作用数据库、后端、账户、支付、订单、实验室、DNA、穿戴设备或健康平台数据。
- 顾客可见页面不出现“模拟”“演示”“概念展示”、无法验证的“10 万+女性信赖”、虚构专家姓名/身份或具体用户姓名。
- 首页使用“规则引擎梳理需求，AI 帮助解释方案”；语音入口不得声称读取麦克风、完成医疗判断或提供真实营养师服务。
- 安全规则拥有最高优先级；黄色和红色结果没有结算入口，且不能由前端操作覆盖。
- 结果不使用“准确率”，只显示“方案依据完整度”，不得暗示诊断或疗效概率。
- 所有健康答案只存在于 React 内存；不写入 Local Storage、Session Storage、Cookie 或 URL 参数，刷新从介绍页重新开始。
- 用户可返回已完成问题；修改上游答案后立即清除不再可见的分支答案；确认退出后清空状态并返回 `/`。
- 原生表单语义、`aria-live`、对话框焦点管理、Escape 关闭、至少 44×44 像素触控目标、200% 缩放和 390px 单列布局必须可用。
- `prefers-reduced-motion` 下取消位移与循环动画；保持 `output: "export"`，不新增运行时依赖。
- 最终验收：全量测试、Lint、静态生产构建通过，首页 Performance ≥ 90，首页和 `/quiz` Accessibility ≥ 95。

## File Structure

- Create `assessment-content.ts`：四章节、九个核心问题、条件分支、选项、矩阵行、营养素展示资料和正式文案。
- Create `tests/helpers/load-ts-module.mjs`：让 Node 测试直接加载无副作用的 TypeScript 纯函数模块。
- Create `lib/assessment-engine.ts`：条件判断、可见序列、隐藏答案清理、题目校验、进度和完整度。
- Create `lib/safety-rules.ts`：安全等级、专业复核原因、强制排除和重复补充判断。
- Create `lib/recommendation-engine.ts`：阶段基础轨道、六维评分、最多两个支持模块、饮食调整、去重和解释。
- Create `lib/subscription-utils.ts`：30/90 天价格和当前页面内的结算字段校验。
- Create `components/assessment/*`：介绍、固定头部、题目渲染、五种题型、退出确认、结果、安全提示和结算。
- Modify `app/quiz/page.tsx`：挂载新体验并更新正式元数据。
- Modify `components/HomeExperience.tsx`、`content.ts`：更新正式品牌文案、内容证明方式和测评入口。
- Modify `README.md`：只在开发文档中说明纯前端、无真实 AI/支付/订单和不持久化健康答案。
- Delete `quiz-content.ts`、`lib/quiz-utils.ts`、`components/QuizExperience.tsx`、`tests/quiz-utils.test.mjs`：新流程通过后移除旧四步规则，避免双实现。

---

### Task 1: 建立题库、类型和测试加载器

**Files:**
- Create: `tests/helpers/load-ts-module.mjs`
- Create: `tests/assessment-content.test.mjs`
- Create: `assessment-content.ts`

**Interfaces:**
- Produces: `SectionId`, `QuestionId`, `QuestionType`, `MatrixAnswer`, `AnswerValue`, `AssessmentAnswers`, `DisplayCondition`, `AssessmentQuestion`, `NutrientDefinition`。
- Produces: `assessmentSections`, `assessmentQuestions`, `nutrientCatalog`, `subscriptionOptions`, `assessmentCopy`。
- Question ids: core `age-range | life-stage | priority-goals | diet-pattern | exclusions | food-frequency | wellbeing-scale | lifestyle | safety-screen`; branch `daily-details | preconception-details | pregnancy-details | postpartum-details | cycle-stage-details | menopause-details | goal-context | balanced-diet-details | plant-sources | irregular-diet-details | exclusion-alternatives | wellbeing-followup | safety-followup`。

- [ ] **Step 1: 写 TypeScript 模块加载器**

```js
// tests/helpers/load-ts-module.mjs
import { readFile } from "node:fs/promises";
import ts from "typescript";

export async function loadTsModule(url, dependencies = {}) {
  const source = await readFile(url, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  const require = (id) => {
    if (Object.hasOwn(dependencies, id)) return dependencies[id];
    throw new Error(`Unexpected import: ${id}`);
  };
  Function("module", "exports", "require", output)(module, module.exports, require);
  return module.exports;
}
```

- [ ] **Step 2: 写题库结构和正式文案的失败测试**

```js
// tests/assessment-content.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { loadTsModule } from "./helpers/load-ts-module.mjs";

test("defines four sections, nine core questions and all supported field types", async () => {
  const content = await loadTsModule(new URL("../assessment-content.ts", import.meta.url));
  assert.equal(content.assessmentSections.length, 4);
  assert.equal(content.assessmentQuestions.filter((question) => question.core).length, 9);
  assert.deepEqual(
    new Set(content.assessmentQuestions.map((question) => question.type)),
    new Set(["single", "multi", "scale", "frequency-matrix", "safety-group"]),
  );
  const stages = content.assessmentQuestions.find((question) => question.id === "life-stage").options;
  assert.deepEqual(stages.map((option) => option.id), ["daily", "preconception", "pregnancy", "postpartum", "cycle", "menopause"]);
});

test("keeps ids unique and every branch declarative", async () => {
  const { assessmentQuestions } = await loadTsModule(new URL("../assessment-content.ts", import.meta.url));
  assert.equal(new Set(assessmentQuestions.map((question) => question.id)).size, assessmentQuestions.length);
  for (const question of assessmentQuestions.filter((item) => !item.core)) {
    assert.ok(question.showWhen);
    assert.ok(question.showWhen.rules.length > 0);
  }
});

test("customer copy uses formal language and no unverifiable proof", async () => {
  const content = await loadTsModule(new URL("../assessment-content.ts", import.meta.url));
  const text = JSON.stringify(content);
  for (const phrase of ["模拟", "演示", "概念展示", "10万+", "准确率"]) {
    assert.doesNotMatch(text, new RegExp(phrase));
  }
});
```

- [ ] **Step 3: 运行测试并确认模块缺失**

Run: `node --test tests/assessment-content.test.mjs`

Expected: FAIL with `ENOENT` for `assessment-content.ts`。

- [ ] **Step 4: 实现题库类型和完整配置**

```ts
// assessment-content.ts
export type SectionId = "profile" | "diet" | "wellbeing" | "safety";
export type QuestionType = "single" | "multi" | "scale" | "frequency-matrix" | "safety-group";
export type MatrixAnswer = Record<string, string | string[]>;
export type AnswerValue = string | string[] | MatrixAnswer;

export type QuestionId =
  | "age-range" | "life-stage" | "priority-goals"
  | "diet-pattern" | "exclusions" | "food-frequency"
  | "wellbeing-scale" | "lifestyle" | "safety-screen"
  | "daily-details" | "preconception-details" | "pregnancy-details"
  | "postpartum-details" | "cycle-stage-details" | "menopause-details"
  | "goal-context" | "balanced-diet-details" | "plant-sources"
  | "irregular-diet-details" | "exclusion-alternatives"
  | "wellbeing-followup" | "safety-followup";

export type AssessmentAnswers = Partial<Record<QuestionId, AnswerValue>>;

export type DisplayCondition = {
  questionId: QuestionId;
  operator: "equals" | "includes-any" | "matrix-includes-any";
  value: string | string[];
  rows?: string[];
};

export type AssessmentQuestion = {
  id: QuestionId;
  sectionId: SectionId;
  type: QuestionType;
  core: boolean;
  title: string;
  description: string;
  options?: Array<{ id: string; label: string; detail?: string }>;
  rows?: Array<{ id: string; label: string; description?: string }>;
  minSelections?: number;
  maxSelections?: number;
  showWhen?: { mode: "all" | "any"; rules: DisplayCondition[] };
  impactTags: string[];
};

export type NutrientDefinition = {
  id: string;
  name: string;
  source: string;
  dailyAmount: string;
  timing: string;
  evidenceLevel: "人体研究支持" | "营养学共识" | "配方设计依据";
  limits: string;
  allergenTags: string[];
  dietTags: string[];
};
```

`assessmentQuestions` 必须按用户流程排序，九个 `core: true` 问题构成主干，每个 `core: false` 分支紧跟触发它的核心问题。六个阶段各有一个阶段详情题；`goal-context` 在两个目标选定后显示；饮食详情按均衡、偏素/纯素、不规律三条路径显示；鱼类或奶制品排除显示 `exclusion-alternatives`；睡眠、压力、恢复、周期、头发皮肤或消化任一频率/影响达到 3–5 显示 `wellbeing-followup`；补剂、处方药、甲状腺/慢病/近期手术、孕哺确认或专业限制任一需要复核时显示 `safety-followup`。

题库配置使用以下固定内容，不把问题或条件散落到组件：

| id | 类型/约束 | 选项或矩阵行 | 显示条件 |
|---|---|---|---|
| `age-range` | single, core | `18-24 / 25-34 / 35-44 / 45-54 / 55-plus` | 始终 |
| `life-stage` | single, core | `daily / preconception / pregnancy / postpartum / cycle / menopause` | 始终 |
| `daily-details` | safety-group | `recent-change / regular-cycle` | stage = daily |
| `preconception-details` | safety-group | `timeline / prenatal-use` | stage = preconception |
| `pregnancy-details` | safety-group | `trimester / doctor-guidance` | stage = pregnancy |
| `postpartum-details` | safety-group | `postpartum-stage / breastfeeding` | stage = postpartum |
| `cycle-stage-details` | safety-group | `regularity / impact` | stage = cycle |
| `menopause-details` | safety-group | `menopause-stage / main-change` | stage = menopause |
| `priority-goals` | multi, core, exactly 2 | `sleep-stress / energy / cycle / recovery / digestion / hair-skin` | 始终 |
| `goal-context` | safety-group | `duration / daily-impact` | 任一 priority goal |
| `diet-pattern` | single, core | `balanced / vegetarian / vegan / irregular` | 始终 |
| `balanced-diet-details` | safety-group | `meal-regularity / variety` | diet = balanced |
| `plant-sources` | safety-group | `b12-source / omega3-source / iron-source / iodine-source` | diet = vegetarian 或 vegan |
| `irregular-diet-details` | safety-group | `skipped-meals / outside-meals` | diet = irregular |
| `exclusions` | multi, core | `fish / dairy / soy / gluten / gelatin / none` | 始终；`none` 与其他项互斥 |
| `exclusion-alternatives` | safety-group | `algae-oil / calcium-fortified / capsule-source` | exclusions 含 fish、dairy 或 gelatin |
| `food-frequency` | frequency-matrix, core | 红肉、鱼、蛋、奶、豆、深色蔬菜、水果、全谷物 × `never / weekly-1-2 / weekly-3-5 / daily` | 始终 |
| `wellbeing-scale` | scale, core | 睡眠、压力、精力、消化、周期、头发皮肤、运动恢复各有 frequency 和 impact，取值 1–5 | 始终 |
| `wellbeing-followup` | safety-group | `caffeine-time / sleep-rhythm / shift-work / exercise-frequency / exercise-type / recovery-feeling / cycle-timing / eating-rhythm / diet-change / symptom-duration / known-intolerance` | wellbeing 任一相关值 3–5；只呈现命中维度对应行 |
| `lifestyle` | safety-group, core | `sunlight / caffeine / alcohol / schedule / exercise` | 始终 |
| `safety-screen` | safety-group, core | `current-supplements / prescription / health-review / ingredient-allergy / professional-restriction` | 始终 |
| `safety-followup` | safety-group | `professional-confirmation / information-complete` | safety-screen 任一值为 yes、unsure、thyroid、chronic 或 recent-surgery |

每条完成路径固定包含一个阶段详情、一个目标详情和一个饮食详情；按答案再增加排除替代、身体感受追问和安全追问，因此实际分支数为 3–6，落在规格要求的 3–7 内。

```ts
export const assessmentSections = [
  { id: "profile", title: "基础画像", eyebrow: "ABOUT YOU" },
  { id: "diet", title: "饮食与营养来源", eyebrow: "NUTRITION SOURCES" },
  { id: "wellbeing", title: "身体感受与生活节奏", eyebrow: "DAILY RHYTHM" },
  { id: "safety", title: "补剂与安全筛查", eyebrow: "SAFETY CHECK" },
] as const;

export const assessmentCopy = {
  introTitle: "用 4–6 分钟，梳理你的阶段与营养重点",
  introBody: "我们会根据生命阶段、饮食来源、生活节奏与安全信息调整后续问题。",
  exitTitle: "要退出本次测评吗？",
  exitBody: "退出后当前答案不会保留。",
  completenessLabel: "方案依据完整度",
  professionalReview: "以下信息需要专业人士结合你的完整情况进一步确认。",
} as const;
```

`nutrientCatalog: NutrientDefinition[]` 为 B12、藻油 DHA、铁、维生素 D、钙、碘、活性叶酸、胆碱、镁、维生素 B6、K2、辅酶 Q10 提供固定字段。剂量采用产品展示用量，不写疗效承诺；孕哺与专业限制写入 `limits`。

```ts
export const subscriptionOptions = [
  { id: "30-days", days: 30, compareAt: 359, total: 299 },
  { id: "90-days", days: 90, compareAt: 1077, total: 759 },
] as const;
```

- [ ] **Step 5: 运行题库测试**

Run: `node --test tests/assessment-content.test.mjs`

Expected: 3 tests PASS。

- [ ] **Step 6: 提交题库边界**

```bash
git add assessment-content.ts tests/assessment-content.test.mjs tests/helpers/load-ts-module.mjs
git commit -m "feat: define adaptive assessment content"
```

---

### Task 2: 实现自适应问题引擎

**Files:**
- Create: `tests/assessment-engine.test.mjs`
- Create: `lib/assessment-engine.ts`

**Interfaces:**
- Consumes: `assessmentQuestions`, `AssessmentAnswers`, `AssessmentQuestion`, `DisplayCondition`, `QuestionId` from `assessment-content.ts`。
- Produces: `matchesCondition(condition, answers): boolean`。
- Produces: `getVisibleQuestions(answers): AssessmentQuestion[]`。
- Produces: `sanitizeAnswers(answers): AssessmentAnswers`。
- Produces: `validateAnswer(question, answer): string | null`。
- Produces: `getAssessmentProgress(answers, currentQuestionId): { current: number; total: number; answered: number; percent: number }`。
- Produces: `getCompleteness(answers): { profile: boolean; diet: boolean; lifestyle: boolean; supplements: boolean; safety: boolean; percent: number }`。

- [ ] **Step 1: 写阶段、饮食和身体感受分支的失败测试**

```js
// tests/assessment-engine.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { loadTsModule } from "./helpers/load-ts-module.mjs";

async function loadEngine() {
  const content = await loadTsModule(new URL("../assessment-content.ts", import.meta.url));
  const engine = await loadTsModule(new URL("../lib/assessment-engine.ts", import.meta.url), {
    "@/assessment-content": content,
  });
  return { ...content, ...engine };
}

test("shows exactly one matching life-stage branch for all six stages", async () => {
  const { getVisibleQuestions } = await loadEngine();
  const expected = {
    daily: "daily-details",
    preconception: "preconception-details",
    pregnancy: "pregnancy-details",
    postpartum: "postpartum-details",
    cycle: "cycle-stage-details",
    menopause: "menopause-details",
  };
  for (const [stage, branch] of Object.entries(expected)) {
    const ids = getVisibleQuestions({ "life-stage": stage }).map((question) => question.id);
    assert.ok(ids.includes(branch));
    assert.equal(Object.values(expected).filter((id) => ids.includes(id)).length, 1);
  }
});

test("adds plant, exclusion and wellbeing follow-ups from answers", async () => {
  const { getVisibleQuestions } = await loadEngine();
  const answers = {
    "diet-pattern": "vegan",
    exclusions: ["fish", "dairy"],
    "wellbeing-scale": { "sleep-frequency": "4", "sleep-impact": "4" },
  };
  const ids = getVisibleQuestions(answers).map((question) => question.id);
  assert.ok(ids.includes("plant-sources"));
  assert.ok(ids.includes("exclusion-alternatives"));
  assert.ok(ids.includes("wellbeing-followup"));
});

test("keeps every completed route within three to seven branch questions", async () => {
  const { getVisibleQuestions } = await loadEngine();
  const scenarios = [
    { "life-stage": "daily", "priority-goals": ["energy", "recovery"], "diet-pattern": "balanced", exclusions: ["none"] },
    {
      "life-stage": "pregnancy", "priority-goals": ["sleep-stress", "energy"], "diet-pattern": "vegan", exclusions: ["fish", "dairy"],
      "wellbeing-scale": { "sleep-frequency": "5", "sleep-impact": "5" },
      "safety-screen": { prescription: "yes", "health-review": "thyroid" },
    },
  ];
  for (const answers of scenarios) {
    const branchCount = getVisibleQuestions(answers).filter((question) => !question.core).length;
    assert.ok(branchCount >= 3 && branchCount <= 7);
  }
});
```

- [ ] **Step 2: 写隐藏答案清理、校验、进度和完整度的失败测试**

```js
test("removes answers whose branch is no longer visible", async () => {
  const { sanitizeAnswers } = await loadEngine();
  const cleaned = sanitizeAnswers({
    "life-stage": "daily",
    "daily-details": { change: "none" },
    "pregnancy-details": { trimester: "second" },
  });
  assert.deepEqual(cleaned, {
    "life-stage": "daily",
    "daily-details": { change: "none" },
  });
});

test("validates selection limits and complete matrices", async () => {
  const { assessmentQuestions, validateAnswer } = await loadEngine();
  const goals = assessmentQuestions.find((question) => question.id === "priority-goals");
  const foods = assessmentQuestions.find((question) => question.id === "food-frequency");
  assert.match(validateAnswer(goals, ["sleep"]), /选择 2 项/);
  assert.match(validateAnswer(goals, ["sleep", "energy", "cycle"]), /最多选择 2 项/);
  assert.match(validateAnswer(foods, { fish: "weekly-1-2" }), /完成每一项/);
});

test("reports visible progress and five-part completeness", async () => {
  const { getAssessmentProgress, getCompleteness } = await loadEngine();
  const answers = {
    "age-range": "25-34",
    "life-stage": "daily",
    "priority-goals": ["energy", "recovery"],
    "diet-pattern": "balanced",
  };
  const progress = getAssessmentProgress(answers, "life-stage");
  assert.equal(progress.current, 2);
  assert.ok(progress.total >= 12 && progress.total <= 16);
  assert.equal(getCompleteness(answers).percent, 20);
});
```

- [ ] **Step 3: 运行测试并确认函数缺失**

Run: `node --test tests/assessment-engine.test.mjs`

Expected: FAIL with `ENOENT` for `lib/assessment-engine.ts`。

- [ ] **Step 4: 实现条件判断、可见序列和稳定清理**

```ts
// lib/assessment-engine.ts
import { assessmentQuestions, type AnswerValue, type AssessmentAnswers, type AssessmentQuestion, type DisplayCondition, type MatrixAnswer, type QuestionId } from "@/assessment-content";

function asList(value: string | string[]): string[] {
  return Array.isArray(value) ? value : [value];
}

export function matchesCondition(condition: DisplayCondition, answers: AssessmentAnswers): boolean {
  const answer = answers[condition.questionId];
  if (answer === undefined) return false;
  if (condition.operator === "equals") return answer === condition.value;
  if (condition.operator === "includes-any") {
    return Array.isArray(answer) && asList(condition.value).some((value) => answer.includes(value));
  }
  if (typeof answer !== "object" || Array.isArray(answer)) return false;
  const rows = condition.rows ?? Object.keys(answer);
  return rows.some((row) => asList(condition.value).some((value) => {
    const cell = (answer as MatrixAnswer)[row];
    return Array.isArray(cell) ? cell.includes(value) : cell === value;
  }));
}

export function getVisibleQuestions(answers: AssessmentAnswers): AssessmentQuestion[] {
  return assessmentQuestions.filter((question) => {
    if (!question.showWhen) return true;
    const matches = question.showWhen.rules.map((rule) => matchesCondition(rule, answers));
    return question.showWhen.mode === "all" ? matches.every(Boolean) : matches.some(Boolean);
  });
}

export function sanitizeAnswers(answers: AssessmentAnswers): AssessmentAnswers {
  let current = { ...answers };
  for (;;) {
    const visible = new Set(getVisibleQuestions(current).map((question) => question.id));
    const next = Object.fromEntries(Object.entries(current).filter(([id]) => visible.has(id as QuestionId))) as AssessmentAnswers;
    if (Object.keys(next).length === Object.keys(current).length) return next;
    current = next;
  }
}
```

- [ ] **Step 5: 实现题型校验、进度和五部分完整度**

```ts
export function validateAnswer(question: AssessmentQuestion, answer: AnswerValue | undefined): string | null {
  if (answer === undefined || answer === "" || (Array.isArray(answer) && answer.length === 0)) return "请完成本题后继续";
  if (question.type === "multi") {
    const values = answer as string[];
    if (question.minSelections && values.length < question.minSelections) return `请选择 ${question.minSelections} 项`;
    if (question.maxSelections && values.length > question.maxSelections) return `最多选择 ${question.maxSelections} 项`;
  }
  if (["scale", "frequency-matrix", "safety-group"].includes(question.type)) {
    const matrix = answer as MatrixAnswer;
    if ((question.rows ?? []).some((row) => matrix[row.id] === undefined || matrix[row.id] === "")) return "请完成每一项后继续";
  }
  return null;
}

export function getAssessmentProgress(answers: AssessmentAnswers, currentQuestionId: QuestionId) {
  const visible = getVisibleQuestions(answers);
  const current = Math.max(1, visible.findIndex((question) => question.id === currentQuestionId) + 1);
  const answered = visible.filter((question) => validateAnswer(question, answers[question.id]) === null).length;
  return { current, total: visible.length, answered, percent: Math.round((answered / visible.length) * 100) };
}

export function getCompleteness(answers: AssessmentAnswers) {
  const safety = answers["safety-screen"] as MatrixAnswer | undefined;
  const parts = {
    profile: ["age-range", "life-stage", "priority-goals"].every((id) => answers[id as QuestionId] !== undefined),
    diet: ["diet-pattern", "exclusions", "food-frequency"].every((id) => answers[id as QuestionId] !== undefined),
    lifestyle: ["wellbeing-scale", "lifestyle"].every((id) => answers[id as QuestionId] !== undefined),
    supplements: Array.isArray(safety?.["current-supplements"]),
    safety: ["prescription", "health-review", "ingredient-allergy", "professional-restriction"].every((id) => safety?.[id] !== undefined),
  };
  return { ...parts, percent: Object.values(parts).filter(Boolean).length * 20 };
}
```

- [ ] **Step 6: 运行引擎测试**

Run: `node --test tests/assessment-engine.test.mjs`

Expected: 6 tests PASS。

- [ ] **Step 7: 提交自适应引擎**

```bash
git add lib/assessment-engine.ts tests/assessment-engine.test.mjs
git commit -m "feat: add adaptive assessment engine"
```

---

### Task 3: 实现不可覆盖的安全规则

**Files:**
- Create: `tests/safety-rules.test.mjs`
- Create: `lib/safety-rules.ts`

**Interfaces:**
- Consumes: `AssessmentAnswers`, `MatrixAnswer`。
- Produces: `SafetyLevel = "green" | "yellow" | "red"`。
- Produces: `SafetyResult = { level; canCheckout; reasons; exclusions; duplicateNutrients }`。
- Produces: `evaluateSafety(answers, candidateNutrientIds): SafetyResult`。

- [ ] **Step 1: 写绿色、黄色、红色和优先级失败测试**

```js
// tests/safety-rules.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { loadTsModule } from "./helpers/load-ts-module.mjs";

async function loadSafety() {
  const content = await loadTsModule(new URL("../assessment-content.ts", import.meta.url));
  return loadTsModule(new URL("../lib/safety-rules.ts", import.meta.url), { "@/assessment-content": content });
}

const clearScreen = {
  "current-supplements": [],
  prescription: "no",
  "health-review": "none",
  "ingredient-allergy": "no",
  "professional-restriction": "no",
};

test("returns green only when no professional review condition is present", async () => {
  const { evaluateSafety } = await loadSafety();
  assert.deepEqual(evaluateSafety({ "life-stage": "daily", "safety-screen": clearScreen }, ["vitamin-d3"]).level, "green");
});

test("routes pregnancy, medication, health review and duplicate intake to yellow", async () => {
  const { evaluateSafety } = await loadSafety();
  const pregnancy = evaluateSafety({ "life-stage": "pregnancy", "safety-screen": clearScreen }, ["dha"]);
  assert.equal(pregnancy.level, "yellow");
  assert.equal(pregnancy.canCheckout, false);
  const duplicate = evaluateSafety({ "life-stage": "daily", "safety-screen": { ...clearScreen, "current-supplements": ["vitamin-d3"] } }, ["vitamin-d3"]);
  assert.deepEqual(duplicate.duplicateNutrients, ["vitamin-d3"]);
  assert.equal(duplicate.level, "yellow");
});

test("red restrictions override all ordinary scores and block checkout", async () => {
  const { evaluateSafety } = await loadSafety();
  const result = evaluateSafety({
    "life-stage": "daily",
    "safety-screen": { ...clearScreen, "professional-restriction": "yes" },
  }, ["magnesium", "vitamin-d3"]);
  assert.equal(result.level, "red");
  assert.equal(result.canCheckout, false);
  assert.deepEqual(result.exclusions, ["magnesium", "vitamin-d3"]);
});
```

- [ ] **Step 2: 运行测试并确认模块缺失**

Run: `node --test tests/safety-rules.test.mjs`

Expected: FAIL with `ENOENT` for `lib/safety-rules.ts`。

- [ ] **Step 3: 实现安全分流和强制排除**

```ts
// lib/safety-rules.ts
import type { AssessmentAnswers, MatrixAnswer } from "@/assessment-content";

export type SafetyLevel = "green" | "yellow" | "red";
export type SafetyResult = {
  level: SafetyLevel;
  canCheckout: boolean;
  reasons: string[];
  exclusions: string[];
  duplicateNutrients: string[];
};

const exclusionMap: Record<string, string[]> = {
  fish: ["fish-oil"], dairy: ["dairy-carrier"], soy: ["soy-carrier"], gluten: ["gluten-carrier"], gelatin: ["gelatin-capsule"],
};

export function evaluateSafety(answers: AssessmentAnswers, candidateNutrientIds: string[]): SafetyResult {
  const screen = (answers["safety-screen"] ?? {}) as MatrixAnswer;
  const current = Array.isArray(screen["current-supplements"]) ? screen["current-supplements"] as string[] : [];
  const exclusions = (Array.isArray(answers.exclusions) ? answers.exclusions : []).flatMap((id) => exclusionMap[id] ?? []);
  const duplicates = candidateNutrientIds.filter((id) => current.includes(id));
  const red = screen["ingredient-allergy"] === "yes" || screen["professional-restriction"] === "yes";
  const stage = answers["life-stage"];
  const stageReview = stage === "preconception" || stage === "pregnancy" || (stage === "postpartum" && (answers["postpartum-details"] as MatrixAnswer | undefined)?.breastfeeding === "yes");
  const yellow = stageReview || screen.prescription === "yes" || screen["health-review"] !== "none" || duplicates.length > 0;
  if (red) return { level: "red", canCheckout: false, reasons: ["已记录需要停止具体组合的安全条件"], exclusions: [...new Set([...exclusions, ...candidateNutrientIds])], duplicateNutrients: duplicates };
  if (yellow) return { level: "yellow", canCheckout: false, reasons: ["需要结合完整情况进行专业确认"], exclusions: [...new Set(exclusions)], duplicateNutrients: duplicates };
  return { level: "green", canCheckout: true, reasons: [], exclusions: [...new Set(exclusions)], duplicateNutrients: [] };
}
```

- [ ] **Step 4: 扩充测试覆盖处方药、甲状腺/慢病/近期手术、孕哺、过敏和专业限制**

```js
test("never lets ordinary candidates downgrade a safety decision", async () => {
  const { evaluateSafety } = await loadSafety();
  for (const [field, value, expected] of [
    ["prescription", "yes", "yellow"],
    ["health-review", "thyroid", "yellow"],
    ["health-review", "chronic", "yellow"],
    ["health-review", "recent-surgery", "yellow"],
    ["ingredient-allergy", "yes", "red"],
  ]) {
    const result = evaluateSafety({ "life-stage": "daily", "safety-screen": { ...clearScreen, [field]: value } }, ["magnesium"]);
    assert.equal(result.level, expected);
    assert.equal(result.canCheckout, false);
  }
});
```

- [ ] **Step 5: 运行安全测试**

Run: `node --test tests/safety-rules.test.mjs`

Expected: 4 tests PASS。

- [ ] **Step 6: 提交安全层**

```bash
git add lib/safety-rules.ts tests/safety-rules.test.mjs
git commit -m "feat: enforce assessment safety routing"
```

---

### Task 4: 实现可解释推荐引擎

**Files:**
- Create: `tests/recommendation-engine.test.mjs`
- Create: `lib/recommendation-engine.ts`

**Interfaces:**
- Consumes: `nutrientCatalog`, `AssessmentAnswers`, `evaluateSafety`, `getCompleteness`。
- Produces: `DimensionId = "sleep-stress" | "energy" | "cycle" | "recovery" | "digestion" | "hair-skin"`。
- Produces: `selectBasePlan(stage): BasePlan`、`scoreDimensions(answers): Record<DimensionId, number>`、`selectSupportModules(scores): SupportModule[]`。
- Produces: `createRecommendation(answers): RecommendationResult`，其中 `basePlan` 在黄色/红色结果为 `null`，`modules` 和 `ingredients` 为空，`guidance` 保留一般关注方向。

- [ ] **Step 1: 写阶段基础包、六维评分和两模块上限的失败测试**

```js
// tests/recommendation-engine.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { loadTsModule } from "./helpers/load-ts-module.mjs";

async function loadRecommendation() {
  const content = await loadTsModule(new URL("../assessment-content.ts", import.meta.url));
  const assessment = await loadTsModule(new URL("../lib/assessment-engine.ts", import.meta.url), { "@/assessment-content": content });
  const safety = await loadTsModule(new URL("../lib/safety-rules.ts", import.meta.url), { "@/assessment-content": content });
  return loadTsModule(new URL("../lib/recommendation-engine.ts", import.meta.url), {
    "@/assessment-content": content,
    "@/lib/assessment-engine": assessment,
    "@/lib/safety-rules": safety,
  });
}

test("maps every stage to exactly one base plan", async () => {
  const { selectBasePlan } = await loadRecommendation();
  for (const stage of ["daily", "preconception", "pregnancy", "postpartum", "cycle", "menopause"]) {
    const plan = selectBasePlan(stage);
    assert.equal(plan.stage, stage);
    assert.ok(plan.ingredientIds.length > 0);
  }
});

test("selects at most two support modules from goals and symptom scores", async () => {
  const { scoreDimensions, selectSupportModules } = await loadRecommendation();
  const scores = scoreDimensions({
    "priority-goals": ["sleep-stress", "energy"],
    "wellbeing-scale": { "sleep-frequency": "5", "sleep-impact": "5", "energy-frequency": "4", "energy-impact": "4", "cycle-frequency": "4", "cycle-impact": "4" },
  });
  assert.equal(Object.keys(scores).length, 6);
  assert.equal(selectSupportModules(scores).length, 2);
});
```

- [ ] **Step 2: 写饮食调整、排除、去重和解释的失败测试**

```js
test("deduplicates nutrients and never re-adds an excluded ingredient", async () => {
  const { createRecommendation } = await loadRecommendation();
  const result = createRecommendation({
    "life-stage": "daily",
    "priority-goals": ["energy", "recovery"],
    "diet-pattern": "vegan",
    exclusions: ["fish"],
    "food-frequency": { fish: "never", eggs: "never", dairy: "never", legumes: "daily", greens: "daily", fruit: "daily", grains: "daily", "red-meat": "never" },
    "wellbeing-scale": { "energy-frequency": "4", "energy-impact": "4" },
    "safety-screen": { "current-supplements": [], prescription: "no", "health-review": "none", "ingredient-allergy": "no", "professional-restriction": "no" },
  });
  assert.equal(new Set(result.ingredients.map((item) => item.id)).size, result.ingredients.length);
  assert.ok(result.ingredients.every((item) => !item.allergenTags.includes("fish")));
  assert.ok(result.includedReasons.length > 0);
  assert.ok(result.omittedReasons.length > 0);
});

test("returns only general guidance when safety is yellow or red", async () => {
  const { createRecommendation } = await loadRecommendation();
  const result = createRecommendation({
    "life-stage": "pregnancy",
    "safety-screen": { "current-supplements": [], prescription: "no", "health-review": "none", "ingredient-allergy": "no", "professional-restriction": "no" },
  });
  assert.equal(result.safety.level, "yellow");
  assert.equal(result.basePlan, null);
  assert.deepEqual(result.modules, []);
  assert.deepEqual(result.ingredients, []);
  assert.ok(result.guidance.length > 0);
});
```

- [ ] **Step 3: 运行测试并确认模块缺失**

Run: `node --test tests/recommendation-engine.test.mjs`

Expected: FAIL with `ENOENT` for `lib/recommendation-engine.ts`。

- [ ] **Step 4: 实现四层规则顺序**

```ts
// lib/recommendation-engine.ts
import { nutrientCatalog, type AssessmentAnswers, type MatrixAnswer, type NutrientDefinition } from "@/assessment-content";
import { getCompleteness } from "@/lib/assessment-engine";
import { evaluateSafety, type SafetyResult } from "@/lib/safety-rules";

export type DimensionId = "sleep-stress" | "energy" | "cycle" | "recovery" | "digestion" | "hair-skin";
export type BasePlan = { id: string; stage: string; title: string; ingredientIds: string[] };
export type SupportModule = { id: DimensionId; title: string; ingredientIds: string[]; score: number };

const basePlans: Record<string, BasePlan> = {
  daily: { id: "daily-foundation", stage: "daily", title: "日常基础轨道", ingredientIds: ["vitamin-d3", "b12"] },
  preconception: { id: "preconception-foundation", stage: "preconception", title: "备孕基础轨道", ingredientIds: ["methylfolate", "choline", "dha"] },
  pregnancy: { id: "pregnancy-foundation", stage: "pregnancy", title: "孕期关注轨道", ingredientIds: ["methylfolate", "choline", "dha"] },
  postpartum: { id: "postpartum-foundation", stage: "postpartum", title: "产后关注轨道", ingredientIds: ["vitamin-d3", "dha", "choline"] },
  cycle: { id: "cycle-foundation", stage: "cycle", title: "周期关注轨道", ingredientIds: ["vitamin-b6", "magnesium"] },
  menopause: { id: "menopause-foundation", stage: "menopause", title: "更年期基础轨道", ingredientIds: ["vitamin-d3", "calcium", "vitamin-k2"] },
};

export function selectBasePlan(stage: string): BasePlan {
  return basePlans[stage] ?? basePlans.daily;
}

export function selectSupportModules(scores: Record<DimensionId, number>): SupportModule[] {
  return Object.entries(scores)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .filter(([, score]) => score > 0)
    .slice(0, 2)
    .map(([id, score]) => ({ id: id as DimensionId, title: moduleCatalog[id as DimensionId].title, ingredientIds: moduleCatalog[id as DimensionId].ingredientIds, score }));
}
```

`scoreDimensions` 对两个优先目标各加 3 分；`wellbeing-scale` 中对应维度的出现频率与影响各加 1–5 分；`lifestyle` 中晚间咖啡因、轮班、每周高强度运动和较少日照只加到相关维度。`moduleCatalog` 固定映射六个模块，避免运行时生成医学判断。

`createRecommendation` 严格按下列顺序执行：阶段基础包 → 最多两个模块 → B12/藻油 DHA/铁/维生素 D/钙/碘饮食来源调整 → `evaluateSafety`。先按 nutrient id 去重，再应用来源和过敏排除；黄色/红色清空具体组合且不能结算。五维图使用 `sleep-stress`、`energy`、`cycle`、`digestion`、`recovery`，其中 `recovery` 显示分数取运动恢复与头发皮肤两者较高值；六维内部评分仍保留用于模块选择。

```ts
export type RecommendationResult = {
  safety: SafetyResult;
  basePlan: BasePlan | null;
  modules: SupportModule[];
  ingredients: NutrientDefinition[];
  attentionProfile: Array<{ id: string; label: string; score: number }>;
  dietaryNotes: string[];
  includedReasons: string[];
  omittedReasons: string[];
  guidance: string[];
  completeness: ReturnType<typeof getCompleteness>;
};
```

- [ ] **Step 5: 运行推荐测试**

Run: `node --test tests/recommendation-engine.test.mjs`

Expected: 4 tests PASS。

- [ ] **Step 6: 提交推荐层**

```bash
git add lib/recommendation-engine.ts tests/recommendation-engine.test.mjs
git commit -m "feat: generate explainable nutrition guidance"
```

---

### Task 5: 构建可中断、可返回的自适应测评 UI

**Files:**
- Create: `components/assessment/AssessmentExperience.tsx`
- Create: `components/assessment/AssessmentIntro.tsx`
- Create: `components/assessment/AssessmentHeader.tsx`
- Create: `components/assessment/ExitDialog.tsx`
- Create: `components/assessment/QuestionRenderer.tsx`
- Create: `components/assessment/SingleChoice.tsx`
- Create: `components/assessment/MultiChoice.tsx`
- Create: `components/assessment/ScaleQuestion.tsx`
- Create: `components/assessment/FrequencyMatrix.tsx`
- Create: `components/assessment/SafetyGroup.tsx`
- Create: `tests/assessment-ui-source.test.mjs`
- Modify: `app/quiz/page.tsx`

**Interfaces:**
- Consumes: all Task 1–4 interfaces。
- Produces: `AssessmentExperience` with views `intro | question | result | checkout | success`。
- Produces: shared field props `{ question; value; onChange; describedBy }`；`QuestionRenderer` is the only switch on `question.type`。

- [ ] **Step 1: 写路由、可访问表单和中断流程的失败测试**

```js
// tests/assessment-ui-source.test.mjs
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentFiles = [
  "AssessmentExperience.tsx", "AssessmentIntro.tsx", "AssessmentHeader.tsx", "ExitDialog.tsx",
  "QuestionRenderer.tsx", "SingleChoice.tsx", "MultiChoice.tsx", "ScaleQuestion.tsx",
  "FrequencyMatrix.tsx", "SafetyGroup.tsx",
];

test("quiz route mounts the adaptive assessment experience", async () => {
  const page = await readFile(new URL("../app/quiz/page.tsx", import.meta.url), "utf8");
  assert.match(page, /AssessmentExperience/);
  assert.match(page, /4–6 分钟/);
});

test("assessment source exposes exit, progress, live errors and native field semantics", async () => {
  const sources = await Promise.all(componentFiles.map((file) => readFile(new URL(`../components/assessment/${file}`, import.meta.url), "utf8")));
  const source = sources.join("\n");
  for (const marker of ["退出测评", "role=\"dialog\"", "aria-live", "fieldset", "legend", "type=\"radio\"", "type=\"checkbox\""]) {
    assert.match(source, new RegExp(marker));
  }
  assert.doesNotMatch(source, /localStorage|sessionStorage|document\.cookie|fetch\(|XMLHttpRequest/);
});
```

- [ ] **Step 2: 运行测试并确认新组件缺失**

Run: `node --test tests/assessment-ui-source.test.mjs`

Expected: FAIL with `ENOENT` for `components/assessment/AssessmentExperience.tsx`。

- [ ] **Step 3: 实现介绍、固定头部和退出对话框**

```tsx
// components/assessment/AssessmentHeader.tsx
export function AssessmentHeader({ section, progress, completedQuestions, onJump, onExit }: {
  section: string;
  progress: { current: number; total: number; percent: number };
  completedQuestions: Array<{ id: QuestionId; title: string }>;
  onJump: (id: QuestionId) => void;
  onExit: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-[#fffaf8]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <span className="font-semibold tracking-[0.14em]">HERSEQUENCE</span>
        <div className="min-w-0 flex-1" aria-label={`整体进度 ${progress.percent}%`}>
          <div className="flex justify-between text-xs"><span>{section}</span><span>{progress.current}/{progress.total}</span></div>
          <div className="mt-2 h-1.5 rounded-full bg-ink/10"><div className="h-full rounded-full bg-rose" style={{ width: `${progress.percent}%` }} /></div>
        </div>
        <details className="relative">
          <summary className="min-h-11 cursor-pointer rounded-full px-4 py-3">已完成</summary>
          <div className="absolute right-0 mt-2 w-64 rounded-2xl border bg-white p-2 shadow-xl">
            {completedQuestions.map((question) => (
              <button key={question.id} type="button" onClick={() => onJump(question.id)} className="min-h-11 w-full rounded-xl px-3 text-left">
                {question.title}
              </button>
            ))}
          </div>
        </details>
        <button type="button" onClick={onExit} className="min-h-11 rounded-full px-4">退出测评</button>
      </div>
    </header>
  );
}
```

`ExitDialog` 使用 `role="dialog" aria-modal="true"`，打开时聚焦“继续测评”，Tab/Shift+Tab 保持在两个操作按钮内，Escape 只关闭对话框；“确认退出”调用父组件的 `resetAndExit()`。`AssessmentIntro` 显示四章节、4–6 分钟、安全分流说明和“开始测评”。

- [ ] **Step 4: 实现五种题型和统一渲染器**

```tsx
// components/assessment/QuestionRenderer.tsx
export function QuestionRenderer(props: FieldProps) {
  switch (props.question.type) {
    case "single": return <SingleChoice {...props} />;
    case "multi": return <MultiChoice {...props} />;
    case "scale": return <ScaleQuestion {...props} />;
    case "frequency-matrix": return <FrequencyMatrix {...props} />;
    case "safety-group": return <SafetyGroup {...props} />;
  }
}
```

单选与量表使用原生 radio；多选使用 checkbox 并在 `aria-live="polite"` 中公布“已选 N / 最多 2 项”；频率矩阵在桌面显示带列标题的表格，在 390px 下每一行折成独立 `fieldset`；安全确认组按行提供“否 / 是 / 不确定”或补剂类别多选。所有 label 与 input 显式关联，错误区 id 传入 `aria-describedby`。

- [ ] **Step 5: 实现内存状态、返回、分支重算和焦点移动**

```tsx
// components/assessment/AssessmentExperience.tsx
"use client";

export default function AssessmentExperience() {
  const [view, setView] = useState<View>("intro");
  const [answers, setAnswers] = useState<AssessmentAnswers>({});
  const [currentId, setCurrentId] = useState<QuestionId>("age-range");
  const [history, setHistory] = useState<QuestionId[]>([]);
  const [error, setError] = useState("");
  const [exitOpen, setExitOpen] = useState(false);
  const visible = useMemo(() => getVisibleQuestions(answers), [answers]);
  const current = visible.find((question) => question.id === currentId) ?? visible[0];

  function updateAnswer(value: AnswerValue) {
    const next = sanitizeAnswers({ ...answers, [current.id]: value });
    setAnswers(next);
    setError("");
  }

  function goNext() {
    const message = validateAnswer(current, answers[current.id]);
    if (message) return setError(message);
    const nextVisible = getVisibleQuestions(answers);
    const index = nextVisible.findIndex((question) => question.id === current.id);
    if (index === nextVisible.length - 1) return setView("result");
    setHistory((items) => [...items, current.id]);
    setCurrentId(nextVisible[index + 1].id);
  }

  function goBack() {
    const previous = history.at(-1);
    if (!previous) return setView("intro");
    setHistory((items) => items.slice(0, -1));
    setCurrentId(previous);
  }

  function jumpTo(questionId: QuestionId) {
    const targetIndex = history.indexOf(questionId);
    if (targetIndex < 0) return;
    setHistory((items) => items.slice(0, targetIndex));
    setCurrentId(questionId);
    setError("");
  }

  function resetAndExit() {
    setAnswers({});
    setHistory([]);
    setCurrentId("age-range");
    window.location.assign("/");
  }
}
```

将 `history` 映射为 `completedQuestions` 传给 `AssessmentHeader`，并把 `jumpTo` 传给 `onJump`，使用户可直接返回任意已完成问题。`jumpTo` 后重新前进时复用现有仍有效答案；修改上游答案后先调用 `sanitizeAnswers` 删除失效分支。`currentId` 变化后的 `useEffect` 对 `id="assessment-question-title" tabIndex={-1}` 调用 `focus()`；动画用 `useReducedMotion()` 把位移改成 0。

- [ ] **Step 6: 更新 `/quiz` 路由**

```tsx
// app/quiz/page.tsx
import type { Metadata } from "next";
import AssessmentExperience from "@/components/assessment/AssessmentExperience";

export const metadata: Metadata = {
  title: "女性营养测评｜她序 HERSEQUENCE",
  description: "用 4–6 分钟梳理生命阶段、饮食来源、生活节奏与安全信息。",
};

export default function QuizPage() {
  return <AssessmentExperience />;
}
```

- [ ] **Step 7: 运行 UI 源码契约测试和 lint**

Run: `node --test tests/assessment-ui-source.test.mjs`

Expected: 2 tests PASS。

Run: `npm run lint`

Expected: 0 errors and 0 warnings。

- [ ] **Step 8: 提交测评 UI**

```bash
git add app/quiz/page.tsx components/assessment tests/assessment-ui-source.test.mjs
git commit -m "feat: build interruptible adaptive assessment"
```

---

### Task 6: 构建三等级结果、证据卡和受控订阅

**Files:**
- Create: `components/assessment/ResultDashboard.tsx`
- Create: `components/assessment/EvidenceCard.tsx`
- Create: `components/assessment/SafetyResult.tsx`
- Create: `components/assessment/CheckoutPanel.tsx`
- Create: `lib/subscription-utils.ts`
- Create: `tests/subscription-utils.test.mjs`
- Modify: `components/assessment/AssessmentExperience.tsx`
- Modify: `tests/assessment-ui-source.test.mjs`

**Interfaces:**
- Consumes: `createRecommendation(answers)` and `RecommendationResult`。
- Produces: `BillingCycle = "30-days" | "90-days"`, `CheckoutFields`, `getOrderSummary(cycle)`, `validateCheckout(fields, payment)`。
- Result contract: green renders exact plan and checkout; yellow renders general directions and professional confirmation; red renders stop reason and edit/professional guidance only。

- [ ] **Step 1: 写订阅价格和正式校验文案的失败测试**

```js
// tests/subscription-utils.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { loadTsModule } from "./helpers/load-ts-module.mjs";

test("returns 30 and 90 day order summaries", async () => {
  const content = await loadTsModule(new URL("../assessment-content.ts", import.meta.url));
  const utils = await loadTsModule(new URL("../lib/subscription-utils.ts", import.meta.url), { "@/assessment-content": content });
  assert.deepEqual(utils.getOrderSummary("30-days"), { days: 30, compareAt: 359, total: 299, saving: 60 });
  assert.deepEqual(utils.getOrderSummary("90-days"), { days: 90, compareAt: 1077, total: 759, saving: 318 });
});

test("requires delivery fields and a payment choice with formal copy", async () => {
  const content = await loadTsModule(new URL("../assessment-content.ts", import.meta.url));
  const { validateCheckout } = await loadTsModule(new URL("../lib/subscription-utils.ts", import.meta.url), { "@/assessment-content": content });
  assert.deepEqual(validateCheckout({ name: "", phone: "", city: "", address: "" }, ""), {
    name: "请输入收货人姓名", phone: "请输入手机号码", city: "请输入所在城市", address: "请输入详细地址", payment: "请选择支付方式",
  });
});
```

- [ ] **Step 2: 运行测试并确认模块缺失**

Run: `node --test tests/subscription-utils.test.mjs`

Expected: FAIL with `ENOENT` for `lib/subscription-utils.ts`。

- [ ] **Step 3: 实现订阅纯函数**

```ts
// lib/subscription-utils.ts
import { subscriptionOptions } from "@/assessment-content";

export type BillingCycle = "30-days" | "90-days";
export type CheckoutFields = { name: string; phone: string; city: string; address: string };

export function getOrderSummary(cycle: BillingCycle) {
  const option = subscriptionOptions.find((item) => item.id === cycle) ?? subscriptionOptions[0];
  return { days: option.days, compareAt: option.compareAt, total: option.total, saving: option.compareAt - option.total };
}

export function validateCheckout(fields: CheckoutFields, payment: string): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!fields.name.trim()) errors.name = "请输入收货人姓名";
  if (!fields.phone.trim()) errors.phone = "请输入手机号码";
  if (!fields.city.trim()) errors.city = "请输入所在城市";
  if (!fields.address.trim()) errors.address = "请输入详细地址";
  if (!payment) errors.payment = "请选择支付方式";
  return errors;
}
```

- [ ] **Step 4: 实现绿色结果仪表盘和证据卡**

```tsx
// components/assessment/EvidenceCard.tsx
export function EvidenceCard({ ingredient }: { ingredient: RecommendationResult["ingredients"][number] }) {
  return (
    <article className="rounded-[1.5rem] border border-ink/10 bg-white p-5">
      <h3 className="font-semibold">{ingredient.name}</h3>
      <dl className="mt-4 grid gap-3 text-sm">
        <div><dt>来源</dt><dd>{ingredient.source}</dd></div>
        <div><dt>产品每日用量</dt><dd>{ingredient.dailyAmount}</dd></div>
        <div><dt>建议时间</dt><dd>{ingredient.timing}</dd></div>
        <div><dt>证据类型</dt><dd>{ingredient.evidenceLevel}</dd></div>
        <div><dt>适用限制</dt><dd>{ingredient.limits}</dd></div>
      </dl>
    </article>
  );
}
```

`ResultDashboard` 展示阶段画像、五维关注度、一个基础方案、最多两个模块、方案依据完整度、为什么加入/未加入、全部证据卡，以及安全范围内的素食来源、剂型、口味和 30/90 天选择。进度条和图表均有文本值，不只依赖颜色。

- [ ] **Step 5: 实现黄色/红色结果和结算硬门禁**

```tsx
// components/assessment/SafetyResult.tsx
export function SafetyResult({ result, onEdit }: { result: RecommendationResult; onEdit: () => void }) {
  const stopped = result.safety.level === "red";
  return (
    <section aria-labelledby="safety-result-title" aria-live="polite">
      <p>{stopped ? "暂不生成具体组合" : "先确认，再决定具体组合"}</p>
      <h1 id="safety-result-title">{stopped ? "你的安全信息需要优先处理" : "这些方向需要专业确认"}</h1>
      <ul>{result.safety.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
      <button type="button" onClick={onEdit} className="min-h-11 rounded-full px-5">返回修改答案</button>
    </section>
  );
}
```

`AssessmentExperience` 只在 `recommendation.safety.canCheckout === true` 时渲染“确认订阅”和 `CheckoutPanel`。`openCheckout()` 再检查一次同一布尔值；黄色/红色 DOM 中不得存在 checkout 按钮。用户不能通过 URL、查询参数或按钮状态改写安全级别。

- [ ] **Step 6: 实现正式结算与完成状态**

`CheckoutPanel` 使用 30/90 天切换、素食来源/剂型/口味选项、四个地址字段和微信/支付宝/银行卡视觉选项；不收集卡号。提交仅运行 `validateCheckout` 并把视图切到 `success`，不发网络请求。按钮文案为“安全支付”，完成标题为“订阅已确认”；成功标题用 ref 聚焦。

```tsx
function submit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  const nextErrors = validateCheckout(fields, payment);
  setErrors(nextErrors);
  if (Object.keys(nextErrors).length === 0) onSuccess();
}
```

- [ ] **Step 7: 扩充 UI 契约测试**

```js
test("renders evidence, all safety states and a green-only checkout gate", async () => {
  const files = ["ResultDashboard.tsx", "EvidenceCard.tsx", "SafetyResult.tsx", "CheckoutPanel.tsx", "AssessmentExperience.tsx"];
  const source = (await Promise.all(files.map((file) => readFile(new URL(`../components/assessment/${file}`, import.meta.url), "utf8")))).join("\n");
  for (const marker of ["方案依据完整度", "为什么加入", "为什么没有加入", "证据类型", "canCheckout", "确认订阅", "安全支付", "订阅已确认"]) {
    assert.match(source, new RegExp(marker));
  }
});
```

- [ ] **Step 8: 运行订阅、UI、lint 测试**

Run: `node --test tests/subscription-utils.test.mjs tests/assessment-ui-source.test.mjs`

Expected: all tests PASS。

Run: `npm run lint`

Expected: 0 errors and 0 warnings。

- [ ] **Step 9: 提交结果与订阅流程**

```bash
git add components/assessment lib/subscription-utils.ts tests/subscription-utils.test.mjs tests/assessment-ui-source.test.mjs
git commit -m "feat: add safety-gated assessment results"
```

---

### Task 7: 更新首页正式文案并删除旧测评

**Files:**
- Modify: `components/HomeExperience.tsx`
- Modify: `content.ts`
- Modify: `tests/content.test.mjs`
- Modify: `tests/source.test.mjs`
- Create: `tests/customer-copy.test.mjs`
- Delete: `components/QuizExperience.tsx`
- Delete: `quiz-content.ts`
- Delete: `lib/quiz-utils.ts`
- Delete: `tests/quiz-utils.test.mjs`

**Interfaces:**
- Consumes: `/quiz` adaptive route。
- Produces: customer-facing copy with no prototype language or invented proof。
- Removes: all imports and tests for the old four-answer `QuizAnswers`/`generatePlan` flow。

- [ ] **Step 1: 写顾客文案和旧实现移除的失败测试**

```js
// tests/customer-copy.test.mjs
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const customerFiles = [
  "../content.ts", "../assessment-content.ts", "../components/HomeExperience.tsx",
  "../app/quiz/page.tsx", "../components/assessment/AssessmentExperience.tsx",
  "../components/assessment/ResultDashboard.tsx", "../components/assessment/CheckoutPanel.tsx",
];

test("customer-facing source contains no prototype language or invented proof", async () => {
  const source = (await Promise.all(customerFiles.map((file) => readFile(new URL(file, import.meta.url), "utf8")))).join("\n");
  for (const phrase of ["模拟", "演示", "概念展示", "10万+", "10 万+", "虚构专家", "准确率"]) {
    assert.doesNotMatch(source, new RegExp(phrase));
  }
});

test("old quiz implementation is removed", async () => {
  for (const file of ["../quiz-content.ts", "../lib/quiz-utils.ts", "../components/QuizExperience.tsx"]) {
    await assert.rejects(access(new URL(file, import.meta.url)));
  }
});
```

- [ ] **Step 2: 运行测试并确认现有顾客文案与旧文件导致失败**

Run: `node --test tests/customer-copy.test.mjs`

Expected: FAIL on existing prototype wording and old files。

- [ ] **Step 3: 替换首页信任、方法和内容证明文案**

```ts
// content.ts
export const trustItems = [
  { id: "testing", label: "第三方批次检测标准", icon: "shield" as IconName },
  { id: "review", label: "专业审核原则", icon: "stethoscope" as IconName },
  { id: "traceable", label: "成分来源透明", icon: "leaf" as IconName },
];

export const steps = [
  { id: "assess", number: "01", title: "梳理阶段与需求", description: "从生命阶段、饮食来源、生活节奏与安全信息开始。" },
  { id: "explain", number: "02", title: "形成可解释方案", description: "规则引擎梳理需求，AI 帮助解释方案。" },
  { id: "deliver", number: "03", title: "按周期送达", description: "在安全确认后选择 30 或 90 天周期。" },
];
```

把原 UGC 引语改为“生活场景内容”卡片，不显示人物姓名、头像式姓名缩写或个人效果陈述；把原专家人物卡改为“专业审核原则”，只展示“剂量复核、来源追溯、适用限制”三项制度，不创造具体专家身份。首页 CTA 保持至少三个 `/quiz` 入口。

- [ ] **Step 4: 调整语音入口避免暗示真实服务**

```tsx
const status = state === "idle"
  ? "选择一段方案讲解"
  : state === "connecting"
    ? "正在准备讲解…"
    : `讲解中 · 00:${String(seconds).padStart(2, "0")}`;
```

语音面板标题使用“AI 方案讲解”，操作使用“播放示例讲解 / 停止讲解”，保留静态波形和预写解释；不请求麦克风权限，不写“正在连接营养师”，并明确“本功能不读取麦克风，不提供医疗判断”。

- [ ] **Step 5: 删除旧文件并更新原有源码测试**

用 `apply_patch` 删除四个旧文件。把 `tests/source.test.mjs` 中旧 `QuizExperience`、模拟支付和四步流程断言替换为 `AssessmentExperience`、退出测评、正式结果与 `/quiz` CTA 断言；把 `tests/content.test.mjs` 中专家数量测试改为审核原则数量测试。

```js
test("homepage links to the adaptive assessment", async () => {
  const source = await readFile(new URL("../components/HomeExperience.tsx", import.meta.url), "utf8");
  assert.ok((source.match(/href=["']\/quiz["']/g) ?? []).length >= 3);
  assert.match(source, /规则引擎梳理需求，AI 帮助解释方案/);
});
```

- [ ] **Step 6: 运行全量测试并确认只有新引擎**

Run: `npm test`

Expected: all tests PASS, 0 failures。

Run: `rg -n "QuizExperience|quiz-content|quiz-utils|generatePlan|QuizAnswers" app components lib tests assessment-content.ts content.ts`

Expected: no matches。

- [ ] **Step 7: 提交正式品牌文案和迁移清理**

```bash
git add -A app components content.ts assessment-content.ts lib tests quiz-content.ts
git commit -m "feat: replace legacy quiz with formal assessment"
```

---

### Task 8: 文档、静态构建和浏览器验收

**Files:**
- Modify: `README.md`
- Modify: `tests/source.test.mjs`

**Interfaces:**
- Documents: `/quiz` adaptive flow, in-memory-only health answers, frontend-only recommendation and checkout boundaries, deployment commands。
- Verifies: no business network calls, responsive flow, safety gating, static export and Lighthouse thresholds。

- [ ] **Step 1: 更新 README 的真实实现边界**

```md
## 实现边界

`/quiz` 是浏览器内规则驱动的自适应营养测评。健康答案只存在于当前 React 内存，刷新或确认退出后清空；项目不调用真实 AI、药物相互作用数据库、医生/营养师后台、支付、订单、库存、物流、邮件、实验室或穿戴设备服务。

绿色结果可继续体验当前页面内的订阅确认；黄色和红色结果由安全规则禁止进入结算。地址与支付方式不发送、不持久化，也不会创建订单或扣款。发布为真实商业服务前，成分剂量、证据引用、合规文案和支付链路仍需分别由营养、法务与工程人员复核。
```

把访问说明改为“四章节、九个核心问题、条件分支、安全分流与可解释结果”，保留 `npm install`、`npm run dev`、`npm test`、`npm run lint`、`npm run build`、Vercel 和静态托管指令。

- [ ] **Step 2: 添加无持久化、无网络和静态路由契约**

```js
test("assessment stays in memory and the export keeps a static quiz route", async () => {
  const experience = await readFile(new URL("../components/assessment/AssessmentExperience.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(experience, /localStorage|sessionStorage|document\.cookie|fetch\(|XMLHttpRequest/);
  const config = await readFile(new URL("../next.config.mjs", import.meta.url), "utf8");
  assert.match(config, /output:\s*["']export["']/);
});
```

- [ ] **Step 3: 运行全量自动验证**

Run: `npm test`

Expected: all tests PASS, 0 failures。

Run: `npm run lint`

Expected: 0 errors and 0 warnings。

Run: `npm run build`

Expected: build succeeds; route list contains static `/` and `/quiz`; `out/quiz/index.html` exists。

- [ ] **Step 4: 验收六阶段和关键分支**

在桌面浏览器依次完成 daily、preconception、pregnancy、postpartum、cycle、menopause 六条路径；再验证 vegan、fish/dairy exclusion、睡眠/压力、运动恢复、周期、头发皮肤、消化与 safety review 分支。每条路径记录：出现的分支、最终安全级别、方案模块数、被排除成分；绿色只能有一个基础包和最多两个模块。

- [ ] **Step 5: 验收返回、修改、中断和刷新**

在中途返回并修改生命阶段，确认旧阶段答案消失；点击“退出测评”后先取消，再确认退出并返回首页；重新进入 `/quiz` 后答案为空；刷新页面回到介绍页。用键盘完成一遍流程，确认对话框焦点不会逃逸且 Escape 可关闭。

- [ ] **Step 6: 验收安全门禁和结算边界**

分别触发处方药/孕哺黄色结果和专业限制/相关成分过敏红色结果，确认 DOM 中没有订阅入口；完成绿色结算，确认没有卡号字段、没有业务网络请求、没有地址持久化，成功标题为“订阅已确认”。

- [ ] **Step 7: 验收 390px、自适应动效和 200% 缩放**

在 390×844 视口完成整条路径，确认矩阵变为单列、固定头部不遮挡标题、按钮触控区至少 44px、无横向滚动；开启系统减少动态效果后确认没有位移或循环动画；浏览器缩放 200% 后内容与操作仍完整。

- [ ] **Step 8: 运行 Lighthouse**

Run in terminal 1: `npx serve out -l 4173`

Run in terminal 2: `npx lighthouse http://localhost:4173 --only-categories=performance,accessibility --chrome-flags="--headless --no-sandbox" --output=json --output-path=./lighthouse-home.json`

Run in terminal 2: `npx lighthouse http://localhost:4173/quiz/ --only-categories=performance,accessibility --chrome-flags="--headless --no-sandbox" --output=json --output-path=./lighthouse-quiz.json`

Expected: homepage Performance ≥ 0.90; homepage and `/quiz` Accessibility ≥ 0.95。生成的 JSON 不提交。

- [ ] **Step 9: 提交文档与最终契约**

```bash
git add README.md tests/source.test.mjs
git commit -m "docs: document adaptive assessment boundaries"
```

---

## Final Verification Checklist

- [ ] `npm test` 全部通过。
- [ ] `npm run lint` 为 0 errors、0 warnings。
- [ ] `npm run build` 生成静态 `/` 与 `/quiz`。
- [ ] 六生命阶段、饮食、身体感受与安全分支均可达。
- [ ] 修改上游答案后隐藏分支答案被删除。
- [ ] 绿色结果一个基础包、最多两个模块；黄色/红色无结算入口。
- [ ] 顾客可见源码不含禁用措辞、虚构身份和无法验证的信任数据。
- [ ] 测评组件无健康数据持久化、业务请求或真实支付调用。
- [ ] 390px、200% 缩放、键盘与减少动态效果验收通过。
- [ ] Lighthouse 达到首页 Performance ≥ 90、首页和 `/quiz` Accessibility ≥ 95。
