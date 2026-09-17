import { goalPlans, routineNotes, stageNutrients, stageReasons, type DietId, type GoalId, type Nutrient, type RoutineId, type StageId } from "@/quiz-content";

export type QuizAnswers = {
  stage: StageId;
  goal: GoalId;
  diet: DietId;
  routine: RoutineId;
};

export type PlanResult = {
  title: string;
  label: string;
  reason: string;
  stageReason: string;
  nutrients: Nutrient[];
  sourceNote: string;
  routineNote: string;
  caution: string;
};

export type BillingCycle = "monthly" | "quarterly";

export type OrderSummary = {
  days: number;
  compareAt: number;
  total: number;
  saving: number;
};

export type CheckoutFields = {
  name: string;
  phone: string;
  city: string;
  address: string;
};

export function generatePlan(answers: QuizAnswers): PlanResult {
  const focus = goalPlans[answers.goal];
  const plantBased = answers.diet === "vegetarian" || answers.diet === "vegan";

  return {
    title: focus.title,
    label: focus.label,
    reason: focus.reason,
    stageReason: stageReasons[answers.stage],
    nutrients: [...focus.nutrients, stageNutrients[answers.stage]],
    sourceNote: plantBased
      ? "已优先标注植物来源选择：藻油 DHA 与活性 B12，实际配方仍需逐项核对来源。"
      : answers.diet === "irregular"
        ? "饮食不规律时，补充剂不能替代完整膳食；先保证规律进餐与食物多样性。"
        : "方案兼顾常见饮食来源，正式选择前仍应核对完整配料表与过敏原信息。",
    routineNote: routineNotes[answers.routine],
    caution:
      answers.stage === "maternal" || answers.stage === "preconception"
        ? "备孕、孕期或产后阶段，请在使用任何补充剂前咨询医生或营养专业人士。"
        : "本结果仅用于品牌交互演示，不构成医疗建议或真实个性化推荐。",
  };
}

export function getOrderSummary(cycle: BillingCycle): OrderSummary {
  return cycle === "monthly"
    ? { days: 30, compareAt: 359, total: 299, saving: 60 }
    : { days: 90, compareAt: 1077, total: 759, saving: 318 };
}

export function validateCheckout(fields: CheckoutFields, payment: string): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!fields.name.trim()) errors.name = "请输入收货人姓名";
  if (!fields.phone.trim()) errors.phone = "请输入手机号码";
  if (!fields.city.trim()) errors.city = "请输入所在城市";
  if (!fields.address.trim()) errors.address = "请输入详细地址";
  if (!payment) errors.payment = "请选择模拟支付方式";
  return errors;
}
