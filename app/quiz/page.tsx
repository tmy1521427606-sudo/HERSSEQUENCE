import type { Metadata } from "next";
import AssessmentExperience from "@/components/assessment/AssessmentExperience";

export const metadata: Metadata = {
  title: "生成我的营养方案｜她序 HERSEQUENCE",
  description: "四章节自适应营养测评：从生命阶段、饮食来源、生活节奏到安全筛查，生成此刻更适合你的每日营养方案。",
};

export default function QuizPage() {
  return <AssessmentExperience />;
}
