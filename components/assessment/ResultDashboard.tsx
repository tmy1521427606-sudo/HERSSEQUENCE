"use client";

import { ArrowRight, Check, CircleAlert, CircleCheck, ClipboardList, Leaf, LockKeyhole, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import { assessmentCopy, evidenceLevels, ingredients } from "@/assessment-content";
import { authCopy } from "@/auth-content";
import type { RecommendationResult } from "@/lib/recommendation-engine";

const levelStyles = {
  green: { chip: "bg-[#edf7f2] text-[#35705a]", icon: "#35705a" },
  yellow: { chip: "bg-[#fff4e6] text-[#9a6a2f]", icon: "#9a6a2f" },
  red: { chip: "bg-[#fdeeee] text-[#a93257]", icon: "#a93257" },
} as const;

const levelLabels = {
  green: assessmentCopy.result.greenLabel,
  yellow: assessmentCopy.result.yellowLabel,
  red: assessmentCopy.result.redLabel,
} as const;

const levelCopy = {
  green: assessmentCopy.safety.green,
  yellow: assessmentCopy.safety.yellow,
  red: assessmentCopy.safety.red,
} as const;

function DimensionBars({ result }: { result: RecommendationResult }) {
  const max = Math.max(5, ...result.dimensionScores.map((item) => item.score));
  return (
    <div className="space-y-3">
      {result.dimensionScores.map((item) => (
        <div key={item.id}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium text-ink/75">{item.label}</span>
            <span className="text-ink/45">{item.score} 分</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-ink/8">
            <div className="h-full rounded-full bg-rose" style={{ width: `${Math.min(100, (item.score / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function IngredientCard({ ingredientId, reason }: { ingredientId: string; reason: string }) {
  const ingredient = ingredients[ingredientId];
  if (!ingredient) return null;
  return (
    <article className="relative overflow-hidden rounded-[1.5rem] border border-ink/8 bg-white p-5">
      <span className="absolute right-0 top-0 h-20 w-20 rounded-bl-full opacity-20" style={{ backgroundColor: ingredient.accent }} aria-hidden="true" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <h4 className="text-lg font-semibold">{ingredient.name}</h4>
          <p className="mt-1 text-xs tracking-[0.08em] text-ink/42">{ingredient.english}</p>
        </div>
        <span className="rounded-full bg-lilac px-3 py-1.5 text-[11px] font-semibold text-ink/65">{evidenceLevels[ingredient.evidence].label}</span>
      </div>
      <p className="relative mt-4 text-sm leading-6 text-ink/58">{ingredient.benefit}</p>
      <dl className="relative mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div><dt className="text-ink/42">来源</dt><dd className="mt-0.5 text-ink/75">{ingredient.source}</dd></div>
        <div><dt className="text-ink/42">每日用量</dt><dd className="mt-0.5 text-ink/75">{ingredient.dose}</dd></div>
        <div><dt className="text-ink/42">服用时间</dt><dd className="mt-0.5 text-ink/75">{ingredient.timing}</dd></div>
        <div><dt className="text-ink/42">选择理由</dt><dd className="mt-0.5 text-ink/75">{reason}</dd></div>
      </dl>
    </article>
  );
}

export default function ResultDashboard({
  result,
  signedIn,
  onLogin,
  onRestart,
  onBackEdit,
  onCheckout,
}: {
  result: RecommendationResult;
  signedIn: boolean;
  onLogin: () => void;
  onRestart: () => void;
  onBackEdit: () => void;
  onCheckout: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headingRef.current?.focus(); }, []);

  const style = levelStyles[result.safety.level];
  const green = result.safety.level === "green";

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-rose">{assessmentCopy.result.eyebrow}</p>
          <h1 ref={headingRef} tabIndex={-1} className="mt-3 font-serif text-4xl leading-tight text-ink outline-none sm:text-5xl">{assessmentCopy.result.title}</h1>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${style.chip}`}>
          {result.safety.level === "red" ? <CircleAlert size={16} aria-hidden="true" /> : <ShieldCheck size={16} aria-hidden="true" />}
          {levelLabels[result.safety.level]}
        </span>
      </div>

      <div className={`mt-6 rounded-[1.35rem] border p-5 text-sm leading-7 ${result.safety.level === "green" ? "border-rose/20 bg-[#fff8fa] text-ink/62" : result.safety.level === "yellow" ? "border-[#e6c89a] bg-[#fffaf2] text-ink/70" : "border-[#e6a0aa] bg-[#fff5f6] text-ink/70"}`}>
        <p className="font-semibold text-ink">{levelCopy[result.safety.level].title}</p>
        <p className="mt-1">{levelCopy[result.safety.level].copy}</p>
        {result.safety.reasons.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {result.safety.reasons.map((reason) => (
              <li key={reason} className="flex gap-2"><span aria-hidden="true">·</span><span>{reason}</span></li>
            ))}
          </ul>
        )}
        {result.safety.level !== "green" && (
          <p className="mt-3 flex items-start gap-2 font-medium text-[#a93257]"><ShieldCheck size={17} className="mt-0.5 shrink-0" aria-hidden="true" />{result.safety.consultNote}</p>
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-[1.5rem] bg-lilac p-5" aria-label={assessmentCopy.result.profileTitle}>
          <h2 className="flex items-center gap-2 text-sm font-semibold"><ClipboardList size={17} className="text-[#7a63a8]" aria-hidden="true" />{assessmentCopy.result.profileTitle}</h2>
          <p className="mt-3 font-serif text-2xl text-ink">{result.stageLabel}</p>
          <p className="mt-2 text-sm leading-6 text-ink/56">{result.stageSummary}</p>
          <div className="mt-5" aria-label={assessmentCopy.result.focusTitle}>
            <p className="mb-3 text-sm font-semibold text-ink/75">{assessmentCopy.result.focusTitle}</p>
            <DimensionBars result={result} />
          </div>
        </section>

        {green ? (
          <section className="rounded-[1.5rem] border border-ink/8 bg-white p-5" aria-label={assessmentCopy.result.completenessTitle}>
            <h2 className="flex items-center gap-2 text-sm font-semibold"><Sparkles size={17} className="text-rose" aria-hidden="true" />{assessmentCopy.result.completenessTitle}</h2>
            <ul className="mt-4 space-y-2.5">
              {result.completeness.map((item) => (
                <li key={item.id} className="flex items-center gap-3 text-sm">
                  <span className={`grid size-6 place-items-center rounded-full ${item.complete ? "bg-[#edf7f2] text-[#35705a]" : "bg-ink/8 text-ink/35"}`}>
                    {item.complete ? <Check size={13} strokeWidth={3} aria-hidden="true" /> : <span aria-hidden="true" className="text-[10px]">–</span>}
                  </span>
                  <span className={item.complete ? "text-ink/75" : "text-ink/40"}>{item.label}{item.complete ? "" : "（未完成）"}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-6 text-ink/45">完整度只反映已回答的信息范围，不表示任何医学准确率或效果概率。</p>
          </section>
        ) : (
          <section className="rounded-[1.5rem] border border-ink/8 bg-white p-5" aria-label="一般方向">
            <h2 className="text-sm font-semibold">当前可展示的一般方向</h2>
            <p className="mt-3 text-sm leading-6 text-ink/56">在专业人士确认之前，我们只保留方向性信息：你的阶段是「{result.stageLabel}」，关注度较高的方向为：</p>
            <ul className="mt-3 space-y-1.5 text-sm text-ink/70">
              {[...result.dimensionScores].sort((a, b) => b.score - a.score).slice(0, 2).map((item) => (
                <li key={item.id}>· {item.label}（{item.score} 分）</li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {green && (
        <>
          <section className="mt-6" aria-label={assessmentCopy.result.baseTitle}>
            <h2 className="font-serif text-2xl text-ink">{assessmentCopy.result.baseTitle} · {result.basePack.title}</h2>
            <p className="mt-2 text-sm leading-6 text-ink/56">{result.basePack.summary}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {result.basePack.ingredients.map((item) => (
                <IngredientCard key={item.id} ingredientId={item.id} reason="阶段基础包核心成分" />
              ))}
            </div>
          </section>

          {result.focusModules.length > 0 && (
            <section className="mt-8" aria-label={assessmentCopy.result.modulesTitle}>
              <h2 className="font-serif text-2xl text-ink">{assessmentCopy.result.modulesTitle}</h2>
              {result.focusModules.map((module) => (
                <div key={module.id} className="mt-4 rounded-[1.5rem] border border-ink/8 bg-white/70 p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-lg font-semibold">{module.title}</h3>
                    <span className="text-xs font-semibold tracking-[0.16em] text-rose">{module.label}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-ink/56">{module.summary}</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {module.ingredients.map((item) => (
                      <IngredientCard key={item.id} ingredientId={item.id} reason={`${module.title}重点成分`} />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )}

          {result.dietaryNotes.length > 0 && (
            <section className="mt-8" aria-label={assessmentCopy.result.dietTitle}>
              <h2 className="flex items-center gap-2 font-serif text-2xl text-ink"><Leaf size={20} className="text-[#5f8b76]" aria-hidden="true" />{assessmentCopy.result.dietTitle}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {result.dietaryNotes.map((note) => (
                  <div key={note.id} className="rounded-[1.35rem] bg-lilac p-5">
                    <p className="text-sm font-semibold">{note.title}</p>
                    <p className="mt-2 text-sm leading-6 text-ink/56">{note.copy}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <section className="rounded-[1.5rem] border border-ink/8 bg-white p-5" aria-label={assessmentCopy.result.whyTitle}>
              <h2 className="text-sm font-semibold">{assessmentCopy.result.whyTitle}</h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/60">
                {result.whyIncluded.map((reason) => <li key={reason} className="flex gap-2"><span aria-hidden="true">·</span><span>{reason}</span></li>)}
              </ul>
            </section>
            <section className="rounded-[1.5rem] border border-ink/8 bg-white p-5" aria-label={assessmentCopy.result.whyNotTitle}>
              <h2 className="text-sm font-semibold">{assessmentCopy.result.whyNotTitle}</h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/60">
                {result.whyNotIncluded.length === 0 ? <li>当前没有需要特别说明的排除项。</li> : result.whyNotIncluded.map((reason) => <li key={reason} className="flex gap-2"><span aria-hidden="true">·</span><span>{reason}</span></li>)}
              </ul>
            </section>
          </div>

          <section className="mt-4 rounded-[1.35rem] border border-ink/8 bg-white/70 p-5" aria-label={assessmentCopy.result.evidenceTitle}>
            <h2 className="text-sm font-semibold">{assessmentCopy.result.evidenceTitle}</h2>
            <dl className="mt-3 space-y-2 text-sm leading-6 text-ink/60">
              {Object.values(evidenceLevels).map((level) => (
                <div key={level.label}><dt className="font-semibold text-ink/75">{level.label}</dt><dd>{level.copy}</dd></div>
              ))}
            </dl>
          </section>

          <div className="mt-4 flex items-start gap-3 rounded-[1.35rem] border border-rose/20 bg-[#fff8fa] p-5 text-sm leading-6 text-ink/62">
            <ShieldCheck size={20} className="mt-0.5 shrink-0 text-rose" aria-hidden="true" />
            <div>
              <p className="font-semibold text-ink">{assessmentCopy.result.cautionTitle}</p>
              <p className="mt-1">本方案由规则引擎在浏览器内生成，用于营养与生活方式方向参考，不构成医疗建议。若你处于孕产阶段或正在用药，请先咨询专业人士；出现任何不适请停止使用并就医。</p>
            </div>
          </div>
        </>
      )}

      {signedIn ? (
        <p className="mt-6 flex items-center gap-2 rounded-[1.35rem] border border-[#3f8f6b]/25 bg-[#f2faf6] p-4 text-sm font-medium text-[#2f7355]">
          <CircleCheck size={18} className="shrink-0" aria-hidden="true" />{authCopy.savedBadge}
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-4 rounded-[1.35rem] border border-rose/25 bg-[#fff8fa] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-rose/15 text-[#a93257]">
              <LockKeyhole size={17} aria-hidden="true" />
            </span>
            <div>
              <p className="font-semibold text-ink">{authCopy.savePromptTitle}</p>
              <p className="mt-1 text-sm leading-6 text-ink/60">{authCopy.reminderCopy}</p>
              <p className="mt-2 text-xs text-ink/45">{authCopy.demoLabel}：{authCopy.demoValue}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogin}
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-rose px-6 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#f07d9b]"
          >
            {authCopy.savePromptCta} <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={onRestart} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-ink/12 bg-white px-6 font-semibold text-ink transition hover:border-rose/45">
            <RefreshCw size={17} aria-hidden="true" /> {assessmentCopy.result.restart}
          </button>
          <button type="button" onClick={onBackEdit} className="inline-flex min-h-12 items-center justify-center rounded-full px-4 font-semibold text-ink/60 transition hover:text-ink">
            {assessmentCopy.result.backEdit}
          </button>
        </div>
        {green && (
          <button type="button" onClick={onCheckout} className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-7 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-rose">
            {signedIn ? assessmentCopy.result.checkout : authCopy.checkoutGateCta}
            <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
