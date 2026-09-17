import type { Metadata } from "next";
import QuizExperience from "@/components/QuizExperience";

export const metadata: Metadata = {
  title: "定制你的每日营养｜她序 HERSEQUENCE",
  description: "用四个简单问题体验女性阶段营养方案与模拟订阅流程。",
};

export default function QuizPage() {
  return <QuizExperience />;
}
