import {
  chapters,
  questions,
  type AssessmentAnswers,
  type AssessmentQuestion,
  type ChapterId,
  type VisibilityContext,
} from "@/assessment-content";

export function getSingle(answers: AssessmentAnswers, id: string): string {
  const value = answers[id];
  return typeof value === "string" ? value : "";
}

export function getMulti(answers: AssessmentAnswers, id: string): string[] {
  const value = answers[id];
  return Array.isArray(value) ? value : [];
}

export function getScale(answers: AssessmentAnswers, id: string): Record<string, number> {
  const value = answers[id];
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, number>;
  }
  return {};
}

export function getMatrix(answers: AssessmentAnswers, id: string): Record<string, string> {
  const value = answers[id];
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, string>;
  }
  return {};
}

export function getConfirm(answers: AssessmentAnswers, id: string): Record<string, string> {
  return getMatrix(answers, id);
}

export function buildContext(answers: AssessmentAnswers): VisibilityContext {
  return {
    single: (id) => getSingle(answers, id),
    multi: (id) => getMulti(answers, id),
    scale: (id) => getScale(answers, id),
    matrix: (id) => getMatrix(answers, id),
    confirm: (id) => getConfirm(answers, id),
    answered: (id) => isAnswered(questions.find((question) => question.id === id), answers),
  };
}

export function isQuestionVisible(question: AssessmentQuestion, answers: AssessmentAnswers): boolean {
  if (!question.visibleWhen) return true;
  return question.visibleWhen(buildContext(answers));
}

export function computeVisibleQuestions(answers: AssessmentAnswers): AssessmentQuestion[] {
  const visible: AssessmentQuestion[] = [];
  for (const question of questions) {
    if (isQuestionVisible(question, answers)) visible.push(question);
  }
  return visible;
}

function normalizeMulti(question: AssessmentQuestion, value: string[]): string[] {
  if (value.includes("none") && value.length > 1) {
    return value.filter((item) => item !== "none");
  }
  return value;
}

export function cleanupAnswers(answers: AssessmentAnswers): AssessmentAnswers {
  const cleaned: AssessmentAnswers = {};
  for (const question of questions) {
    if (!(question.id in answers)) continue;
    if (!isQuestionVisible(question, answers)) continue;
    const value = answers[question.id];
    if (question.type === "multi" && Array.isArray(value)) {
      cleaned[question.id] = normalizeMulti(question, value);
    } else {
      cleaned[question.id] = value;
    }
  }
  return cleaned;
}

export function isAnswered(question: AssessmentQuestion | undefined, answers: AssessmentAnswers): boolean {
  if (!question) return false;
  const value = answers[question.id];
  if (value === undefined) return false;
  switch (question.type) {
    case "single":
      return typeof value === "string" && value.length > 0;
    case "multi":
      return Array.isArray(value) && value.length > 0;
    case "scale":
      return question.scaleItems!.every((item) => typeof getScale(answers, question.id)[item.id] === "number");
    case "matrix":
      return question.matrixRows!.every((row) => typeof getMatrix(answers, question.id)[row.id] === "string");
    case "confirm":
      return question.confirmItems!.every(
        (item) => getConfirm(answers, question.id)[item.id] === "yes" || getConfirm(answers, question.id)[item.id] === "no",
      );
    default:
      return false;
  }
}

export function validateAnswer(
  question: AssessmentQuestion,
  answers: AssessmentAnswers,
  messages: { single: string; multi: string; multiMax: string; scale: string; matrix: string; confirm: string },
): string {
  const value = answers[question.id];
  switch (question.type) {
    case "single":
      return typeof value === "string" && value.length > 0 ? "" : messages.single;
    case "multi": {
      if (!Array.isArray(value) || value.length === 0) return messages.multi;
      if (question.maxSelections && value.length > question.maxSelections) return messages.multiMax;
      return "";
    }
    case "scale":
      return isAnswered(question, answers) ? "" : messages.scale;
    case "matrix":
      return isAnswered(question, answers) ? "" : messages.matrix;
    case "confirm":
      return isAnswered(question, answers) ? "" : messages.confirm;
    default:
      return "";
  }
}

export type AssessmentProgress = {
  visible: number;
  answered: number;
  percent: number;
  chapterLabel: string;
  chapterIndex: number;
  chapterCount: number;
};

export function getProgress(answers: AssessmentAnswers): AssessmentProgress {
  const visible = computeVisibleQuestions(answers);
  const answered = visible.filter((question) => isAnswered(question, answers)).length;
  const current = visible.find((question) => !isAnswered(question, answers));
  const chapterIndex = current
    ? chapters.findIndex((chapter) => chapter.id === current.chapter)
    : chapters.length - 1;
  return {
    visible: visible.length,
    answered,
    percent: visible.length === 0 ? 0 : Math.round((answered / visible.length) * 100),
    chapterLabel: chapters[Math.max(0, chapterIndex)].label,
    chapterIndex: Math.max(0, chapterIndex),
    chapterCount: chapters.length,
  };
}

export type CompletenessItem = { id: string; label: string; complete: boolean };

export function getCompleteness(answers: AssessmentAnswers): CompletenessItem[] {
  const byId = new Map(questions.map((question) => [question.id, question]));
  const items: { id: string; label: string; questionIds: string[] }[] = [
    { id: "profile", label: "基础画像", questionIds: ["age", "stage", "goals"] },
    { id: "diet", label: "饮食信息", questionIds: ["dietPattern", "exclusions", "foodFrequency"] },
    { id: "lifestyle", label: "生活方式", questionIds: ["wellbeing", "lifestyle"] },
    { id: "supplements", label: "补剂信息", questionIds: ["supplements"] },
    { id: "safety", label: "安全筛查", questionIds: ["safetyChecks"] },
  ];
  return items.map((item) => ({
    id: item.id,
    label: item.label,
    complete: item.questionIds.every((id) => isAnswered(byId.get(id), answers)),
  }));
}

export function chapterOf(question: AssessmentQuestion): ChapterId {
  return question.chapter;
}
