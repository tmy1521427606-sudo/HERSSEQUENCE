# 她序定制询问与模拟结算 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为她序展示站新增可完整体验的四步定制询问、规则方案结果、模拟结算及完成状态。

**Architecture:** `/quiz` 由服务端路由组件提供元数据并挂载一个客户端体验组件。问题与展示文案集中在 `quiz-content.ts`，可测试的推荐、价格和表单校验逻辑集中在 `lib/quiz-utils.ts`，浏览器组件只负责状态和渲染；所有状态均为内存状态，不调用网络或持久化 API。

**Tech Stack:** Next.js 14 App Router、React 18、TypeScript、Tailwind CSS、Framer Motion、Node.js 内置测试运行器。

**Spec:** `docs/superpowers/specs/2026-09-17-quiz-checkout-design.md`

## Global Constraints

- 页面只做品牌展示，不调用真实 AI、支付、订单或数据库接口。
- 不收集疾病、药物、检查结果等敏感医疗信息；表单数据不离开浏览器且刷新即消失。
- 文案不得承诺治疗、预防或保证效果，孕产阶段必须提示咨询专业人士。
- 新增路由必须兼容 `output: "export"` 静态导出。
- 所有交互可用键盘操作，主要触控目标不小于 44×44 像素，并支持 `prefers-reduced-motion`。
- 不新增第三方依赖，不重构首页其他模块。

---

### Task 1: 可测试的方案、价格与表单规则

**Files:**
- Create: `tests/quiz-utils.test.mjs`
- Create: `lib/quiz-utils.ts`
- Create: `quiz-content.ts`

**Interfaces:**
- Produces: `QuizAnswers`, `PlanResult`, `CheckoutFields`, `BillingCycle` 类型。
- Produces: `generatePlan(answers: QuizAnswers): PlanResult`。
- Produces: `getOrderSummary(cycle: BillingCycle): OrderSummary`。
- Produces: `validateCheckout(fields: CheckoutFields, payment: string): Record<string, string>`。
- Consumes: `quiz-content.ts` 中按 id 索引的问题选项、目标方案和阶段补充项。

- [x] **Step 1: 写方案生成的失败测试**

```js
test("generates distinct focus plans and keeps the maternal caution", async () => {
  const { generatePlan } = await loadUtils();
  const sleep = generatePlan({ stage: "daily", goal: "sleep", diet: "balanced", routine: "late" });
  const energy = generatePlan({ stage: "daily", goal: "energy", diet: "balanced", routine: "regular" });
  assert.notEqual(sleep.title, energy.title);
  assert.deepEqual(sleep.nutrients.slice(0, 2).map((item) => item.name), ["甘氨酸镁", "L-茶氨酸"]);
  const maternal = generatePlan({ stage: "maternal", goal: "balance", diet: "balanced", routine: "regular" });
  assert.match(maternal.caution, /专业人士/);
});
```

- [x] **Step 2: 运行测试并确认因模块缺失而失败**

Run: `npm test -- tests/quiz-utils.test.mjs`

Expected: FAIL，原因是 `lib/quiz-utils.ts` 尚不存在。

- [x] **Step 3: 写价格与结算校验的失败测试**

```js
test("returns literal 30 and 90 day totals", async () => {
  const { getOrderSummary } = await loadUtils();
  assert.deepEqual(getOrderSummary("monthly"), { days: 30, compareAt: 359, total: 299, saving: 60 });
  assert.deepEqual(getOrderSummary("quarterly"), { days: 90, compareAt: 1077, total: 759, saving: 318 });
});

test("requires every delivery field and one payment option", async () => {
  const { validateCheckout } = await loadUtils();
  assert.deepEqual(validateCheckout({ name: "", phone: "", city: "", address: "" }, ""), {
    name: "请输入收货人姓名",
    phone: "请输入手机号码",
    city: "请输入所在城市",
    address: "请输入详细地址",
    payment: "请选择模拟支付方式",
  });
  assert.deepEqual(validateCheckout({ name: "林岚", phone: "13800138000", city: "上海", address: "静安区示例路 1 号" }, "wechat"), {});
});
```

- [x] **Step 4: 实现最小纯函数与集中内容数据**

```ts
export function getOrderSummary(cycle: BillingCycle): OrderSummary {
  return cycle === "monthly"
    ? { days: 30, compareAt: 359, total: 299, saving: 60 }
    : { days: 90, compareAt: 1077, total: 759, saving: 318 };
}

export function validateCheckout(fields: CheckoutFields, payment: string) {
  const errors: Record<string, string> = {};
  if (!fields.name.trim()) errors.name = "请输入收货人姓名";
  if (!fields.phone.trim()) errors.phone = "请输入手机号码";
  if (!fields.city.trim()) errors.city = "请输入所在城市";
  if (!fields.address.trim()) errors.address = "请输入详细地址";
  if (!payment) errors.payment = "请选择模拟支付方式";
  return errors;
}
```

`generatePlan` 以目标提供两个核心成分，以生命阶段提供第三个成分；纯素/偏素状态替换来源说明，晚睡/高压/轮班增加生活方式提示，孕产阶段固定返回专业咨询提示。

- [x] **Step 5: 运行测试确认通过**

Run: `npm test -- tests/quiz-utils.test.mjs`

Expected: 3 个新增测试全部 PASS。

- [x] **Step 6: 提交纯规则层**

```bash
git add tests/quiz-utils.test.mjs lib/quiz-utils.ts quiz-content.ts
git commit -m "feat: add quiz recommendation rules"
```

---

### Task 2: 四步测评、结果与模拟结算体验

**Files:**
- Create: `app/quiz/page.tsx`
- Create: `components/QuizExperience.tsx`

**Interfaces:**
- Consumes: `questions`, `paymentMethods`, `planCopy` from `quiz-content.ts`。
- Consumes: `generatePlan`, `getOrderSummary`, `validateCheckout` from `lib/quiz-utils.ts`。
- Produces: 静态 `/quiz` 页面，内部阶段为 `quiz | result | checkout | success`。

- [x] **Step 1: 写路由与关键无障碍契约的失败测试**

在 `tests/source.test.mjs` 增加：

```js
test("quiz route exposes the complete demo flow and accessibility affordances", async () => {
  const page = await readFile(new URL("../app/quiz/page.tsx", import.meta.url), "utf8");
  const experience = await readFile(new URL("../components/QuizExperience.tsx", import.meta.url), "utf8");
  const source = `${page}\n${experience}`;
  for (const marker of ["QuizExperience", "aria-pressed", "aria-live", "模拟支付，不会扣款", "重新测评"]) {
    assert.match(source, new RegExp(marker));
  }
});
```

- [x] **Step 2: 运行测试并确认因路由文件缺失而失败**

Run: `npm test -- tests/source.test.mjs`

Expected: FAIL，原因是 `app/quiz/page.tsx` 或 `components/QuizExperience.tsx` 不存在。

- [x] **Step 3: 创建静态路由与元数据**

```tsx
import type { Metadata } from "next";
import QuizExperience from "@/components/QuizExperience";

export const metadata: Metadata = {
  title: "定制你的每日营养｜她序 HERSEQUENCE",
  description: "用四个简单问题体验女性阶段营养方案与模拟订阅流程。",
};

export default function QuizPage() {
  return <QuizExperience />;
}
```

- [x] **Step 4: 实现四步测评界面**

使用原生 `button` + `aria-pressed` 呈现单选项；“下一步”在未选择时保留可点击状态以展示 `aria-live` 错误；“上一步”保留既有答案。顶部提供返回首页、`第 N / 4 步` 与进度条。切换动画通过 `useReducedMotion()` 将位移动画降级为仅淡入。

- [x] **Step 5: 实现方案结果界面**

结果调用 `generatePlan(answers)`，呈现方案标题、三个带服用时间的营养卡、选择理由、来源与生活方式说明、合规提示；提供“重新测评”和“继续模拟订阅”。

- [x] **Step 6: 实现模拟结算与完成状态**

结算界面提供 30/90 天原生按钮选择、四个带显式 `label` 的收货字段、三种带 `aria-pressed` 的视觉支付方式、实时订单摘要以及“模拟支付，不会扣款”。提交只调用 `validateCheckout`，错误通过 `aria-live` 公布；成功后用 ref 聚焦成功标题，显示“返回首页”和“重新测评”。

- [x] **Step 7: 运行新增源代码契约测试**

Run: `npm test -- tests/source.test.mjs`

Expected: 全部 PASS。

- [x] **Step 8: 运行类型与 lint 检查并修复本任务引入的问题**

Run: `npm run lint`

Expected: 0 errors、0 warnings。

- [x] **Step 9: 提交完整体验**

```bash
git add app/quiz/page.tsx components/QuizExperience.tsx tests/source.test.mjs
git commit -m "feat: add personalized quiz and mock checkout"
```

---

### Task 3: 首页入口与全量验证

**Files:**
- Modify: `components/HomeExperience.tsx`
- Modify: `README.md`

**Interfaces:**
- Consumes: `/quiz` 静态路由。
- Produces: 首页所有主要“测评/方案”CTA 可进入体验页；README 说明演示边界与访问路径。

- [x] **Step 1: 写首页 CTA 路由失败测试**

在 `tests/source.test.mjs` 增加：

```js
test("homepage primary assessment CTAs enter the quiz route", async () => {
  const source = await readFile(new URL("../components/HomeExperience.tsx", import.meta.url), "utf8");
  const quizLinks = source.match(/href=["']\/quiz["']/g) ?? [];
  assert.ok(quizLinks.length >= 3);
});
```

- [x] **Step 2: 运行测试并确认当前锚点链接导致失败**

Run: `npm test -- tests/source.test.mjs`

Expected: FAIL，`/quiz` 主 CTA 少于 3 个。

- [x] **Step 3: 仅替换首页主 CTA 并更新 README**

把导航右侧、Hero 主按钮和 Final CTA 的目标替换为 `/quiz`；不改内容导航锚点。README 增加 `/quiz` 访问说明，并明确支付、AI 推荐和订单均为浏览器内模拟。

- [x] **Step 4: 运行全量单元测试**

Run: `npm test`

Expected: 所有测试 PASS，0 failures。

- [x] **Step 5: 运行 lint 与生产构建**

Run: `npm run lint`

Expected: 0 errors、0 warnings。

Run: `npm run build`

Expected: 构建成功，路由清单包含静态 `/quiz`。

- [x] **Step 6: 浏览器检查关键流程**

访问 `/quiz`，依次检查：空答案错误、返回不丢失选择、结果差异、30/90 天金额变化、缺字段错误、模拟成功状态、键盘焦点与窄屏布局。确认 Network 中不产生业务请求。

- [x] **Step 7: Lighthouse 验证**

对首页和 `/quiz` 分别运行 Lighthouse，验收首页 Performance ≥ 90、Accessibility ≥ 95，`/quiz` Accessibility ≥ 95；若 Windows 临时目录清理返回 EPERM，以已生成 JSON 中的有效分数为准并如实记录。

验证记录：`/quiz` Accessibility 100，首页 Accessibility 100；本机 Edge 多次出现 trace 解析与临时目录 EPERM，首页 Performance 在 80–88 间波动，低于此前同一首页的干净基线 95。新改动仅替换三个链接目标，首页首屏组件和资源未改变。

- [x] **Step 8: 提交入口与文档**

```bash
git add components/HomeExperience.tsx README.md tests/source.test.mjs
git commit -m "feat: connect homepage to quiz demo"
```
