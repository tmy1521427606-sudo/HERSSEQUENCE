"use client";

import { MessageCircle } from "lucide-react";
import { openAdvisorPanel } from "@/lib/advisor-bus";

/** 任意位置唤起右下角顾问面板的入口。 */
export default function AdvisorLauncher({
  label,
  variant = "solid",
  className = "",
}: {
  label: string;
  variant?: "solid" | "outline" | "link";
  className?: string;
}) {
  const styles = {
    solid: "min-h-12 rounded-full bg-rose px-6 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#f07d9b]",
    outline: "min-h-12 rounded-full border border-ink/12 bg-white px-6 font-semibold text-ink transition hover:border-rose/40",
    link: "min-h-11 font-semibold text-[#a93257] transition hover:text-ink",
  } as const;

  return (
    <button type="button" onClick={openAdvisorPanel} className={`inline-flex items-center justify-center gap-2 ${styles[variant]} ${className}`}>
      <MessageCircle size={16} aria-hidden="true" />
      {label}
    </button>
  );
}
