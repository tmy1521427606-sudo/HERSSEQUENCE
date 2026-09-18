import { assessmentCopy, ingredients, type AssessmentAnswers } from "@/assessment-content";
import { getConfirm, getMulti, getSingle } from "@/lib/assessment-engine";

export type SafetyLevel = "green" | "yellow" | "red";

export type SafetyEvaluation = {
  level: SafetyLevel;
  /** 命中的分流原因说明，逐条展示给用户。 */
  reasons: string[];
  /** 强制排除的成分 id，任何得分都不能把它们加回来。 */
  excludedIngredientIds: string[];
  /** 被排除成分的原因说明，用于“为什么没有加入”。 */
  exclusionReasons: Record<string, string>;
  consultNote: string;
  /** 只有绿色结果允许进入结算。 */
  canCheckout: boolean;
};

/** 补剂类别与成分的重复摄入映射。 */
const supplementCategoryMap: Record<string, string[]> = {
  multivitamin: ["b12", "b6", "d3"],
  iron: ["iron"],
  calcium: ["calcium"],
  vitaminD: ["d3"],
  omega3: ["algalDha"],
  folate: ["folate"],
  magnesium: ["magnesium"],
  other: [],
};

export function evaluateSafety(answers: AssessmentAnswers, candidateIngredientIds: string[]): SafetyEvaluation {
  const reasons: string[] = [];
  const exclusionReasons: Record<string, string> = {};
  const excluded = new Set<string>();
  const safety = assessmentCopy.safety;

  const checks = getConfirm(answers, "safetyChecks");
  const supplements = getMulti(answers, "supplements");
  const stage = getSingle(answers, "stage");

  // 红色：明确专业限制或已知成分过敏，直接停止具体推荐。
  if (checks.restricted === "yes") reasons.push(safety.redReasons.restricted);
  if (checks.ingredientAllergy === "yes") reasons.push(safety.redReasons.ingredientAllergy);

  // 防御性兜底：安全筛查未完成时不足以生成方案。
  const safetyQuestionAnswered =
    checks.prescription !== undefined &&
    checks.thyroid !== undefined &&
    checks.chronic !== undefined &&
    checks.surgery !== undefined &&
    checks.restricted !== undefined &&
    checks.ingredientAllergy !== undefined;
  if (!safetyQuestionAnswered) reasons.push(safety.redReasons.insufficient);

  const red =
    checks.restricted === "yes" ||
    checks.ingredientAllergy === "yes" ||
    !safetyQuestionAnswered;

  if (!red) {
    // 黄色：需要专业确认的情况。
    if (stage === "preconception") reasons.push(safety.yellowReasons.preconception);
    if (stage === "pregnancy") reasons.push(safety.yellowReasons.pregnancy);
    if (stage === "postpartum" && getSingle(answers, "breastfeeding") === "yes") {
      reasons.push(safety.yellowReasons.postpartumBreastfeeding);
    }
    if (checks.prescription === "yes") reasons.push(safety.yellowReasons.prescription);
    if (checks.chronic === "yes") reasons.push(safety.yellowReasons.chronic);
    if (checks.surgery === "yes") reasons.push(safety.yellowReasons.surgery);

    // 甲状腺相关情况：暂缓碘相关成分，并进入专业确认。
    if (checks.thyroid === "yes") {
      reasons.push(safety.yellowReasons.thyroid);
      for (const id of candidateIngredientIds) {
        if (ingredients[id]?.requiresThyroidCaution) {
          excluded.add(id);
          exclusionReasons[id] = "甲状腺相关情况待确认，碘相关成分暂不推荐。";
        }
      }
    }

    // 重复摄入检查：已在使用同类补剂时，从候选中排除并说明。
    const duplicates: string[] = [];
    for (const category of supplements) {
      for (const id of supplementCategoryMap[category] ?? []) {
        if (candidateIngredientIds.includes(id) && !excluded.has(id)) {
          excluded.add(id);
          duplicates.push(id);
        }
      }
    }
    if (duplicates.length > 0) reasons.push(safety.yellowReasons.duplicate);
    for (const id of duplicates) {
      exclusionReasons[id] = "你已在使用的补剂覆盖了这一成分，为避免重复摄入暂不加入。";
    }
  }

  const level: SafetyLevel = red ? "red" : reasons.length > 0 ? "yellow" : "green";

  return {
    level,
    reasons: Array.from(new Set(reasons)),
    excludedIngredientIds: Array.from(excluded),
    exclusionReasons,
    consultNote: safety.consult,
    canCheckout: level === "green",
  };
}
