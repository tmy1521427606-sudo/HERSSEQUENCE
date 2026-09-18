"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Home,
  PackageCheck,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, LazyMotion, domAnimation, m as motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  assessmentCopy,
  chapters,
  checkoutCopy,
  type AssessmentAnswers,
} from "@/assessment-content";
import {
  cleanupAnswers,
  computeVisibleQuestions,
  getProgress,
  isAnswered,
  validateAnswer,
} from "@/lib/assessment-engine";
import { buildRecommendation, type RecommendationResult } from "@/lib/recommendation-engine";
import { useAuth } from "@/components/auth-context";
import QuestionRenderer from "@/components/assessment/QuestionRenderer";
import ExitConfirm from "@/components/assessment/ExitConfirm";
import ResultDashboard from "@/components/assessment/ResultDashboard";
import AssessmentCheckout from "@/components/assessment/AssessmentCheckout";

type View = "intro" | "questions" | "result" | "checkout" | "success";

export default function AssessmentExperience() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { user, openLogin } = useAuth();
  const [view, setView] = useState<View>("intro");
  const [answers, setAnswers] = useState<AssessmentAnswers>({});
  const [cursor, setCursor] = useState(0);
  const [error, setError] = useState("");
  const [exitOpen, setExitOpen] = useState(false);
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [pendingCheckout, setPendingCheckout] = useState(false);
  const reminded = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const visible = useMemo(() => computeVisibleQuestions(answers), [answers]);
  const progress = useMemo(() => getProgress(answers), [answers]);
  const current = visible[Math.min(cursor, Math.max(0, visible.length - 1))];

  // 分支收缩时把光标拉回可见范围。
  useEffect(() => {
    if (cursor > visible.length - 1) setCursor(Math.max(0, visible.length - 1));
  }, [cursor, visible.length]);

  // 题目切换后把焦点移到新题目标题，屏幕阅读器随之播报。
  useEffect(() => {
    if (view === "questions") headingRef.current?.focus();
  }, [current?.id, view]);

  // 测评完成后提醒登录：只在首次进入结果页时弹出一次，可关闭。
  useEffect(() => {
    if (view !== "result" || user || reminded.current) return;
    reminded.current = true;
    const id = window.setTimeout(() => openLogin("reminder"), 700);
    return () => window.clearTimeout(id);
  }, [view, user, openLogin]);

  // 结算前的登录门禁：登录成功后自动继续到结算步骤。
  useEffect(() => {
    if (user && pendingCheckout) {
      setPendingCheckout(false);
      setView("checkout");
    }
  }, [user, pendingCheckout]);

  function updateAnswer(questionId: string, next: AssessmentAnswers) {
    const cleaned = cleanupAnswers(next);
    setAnswers(cleaned);
    setError("");
  }

  function next() {
    if (!current) return;
    const message = validateAnswer(current, answers, assessmentCopy.errors);
    if (message) {
      setError(message);
      return;
    }
    if (cursor < visible.length - 1) {
      setCursor((value) => value + 1);
      setError("");
      return;
    }
    submit();
  }

  function submit() {
    const cleaned = cleanupAnswers(answers);
    const pending = computeVisibleQuestions(cleaned).find((question) => !isAnswered(question, cleaned));
    if (pending) {
      const message = validateAnswer(pending, cleaned, assessmentCopy.errors);
      setError(message || assessmentCopy.errors.single);
      setCursor(computeVisibleQuestions(cleaned).findIndex((question) => question.id === pending.id));
      return;
    }
    setResult(buildRecommendation(cleaned));
    setView("result");
  }

  function back() {
    if (cursor > 0) {
      setCursor((value) => value - 1);
      setError("");
    }
  }

  function restart() {
    setAnswers({});
    setCursor(0);
    setError("");
    setResult(null);
    reminded.current = false;
    setPendingCheckout(false);
    setView("intro");
  }

  /** 结算入口：未登录时先唤起登录提醒，登录成功后自动继续。 */
  function requestCheckout() {
    if (!user) {
      setPendingCheckout(true);
      openLogin("login");
      return;
    }
    setView("checkout");
  }

  const transition = reduceMotion ? { duration: 0 } : { duration: 0.42, ease: [0.16, 1, 0.3, 1] as const };
  const key = view === "questions" ? `q-${current?.id}` : view;
  const chapterIndex = current ? chapters.findIndex((chapter) => chapter.id === current.chapter) : 0;

  return (
    <LazyMotion features={domAnimation}>
      <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_10%_15%,rgba(232,108,141,.16),transparent_28%),radial-gradient(circle_at_90%_80%,rgba(154,135,194,.18),transparent_30%),linear-gradient(135deg,#fff9f8,#f5f0ff)] text-ink">
        <a href="#assessment-main" className="fixed left-4 top-3 z-50 -translate-y-24 rounded-full bg-ink px-5 py-3 font-semibold text-white transition focus:translate-y-0">跳到测评内容</a>

        <header className="relative z-20 flex items-center justify-between border-b border-ink/8 px-5 py-4 sm:px-8 lg:px-12">
          <Link href="/" className="group inline-flex min-h-11 items-center gap-3 font-semibold tracking-[0.14em] text-ink">
            <span className="grid size-9 place-items-center rounded-full bg-ink text-xs text-white transition-transform group-hover:rotate-6">她</span>
            <span>HERSEQUENCE</span>
          </Link>
          <div className="flex items-center gap-3 text-sm text-ink/55">
            {view === "questions" && (
              <span className="hidden items-center gap-3 sm:flex">
                <span className="rounded-full bg-white/70 px-4 py-2">{assessmentCopy.nav.chapter} {chapterIndex + 1} / {chapters.length} · {chapters[Math.max(0, chapterIndex)].label}</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2"><Clock3 size={15} aria-hidden="true" /> {assessmentCopy.intro.duration}</span>
              </span>
            )}
            {view === "questions" && (
              <button type="button" onClick={() => setExitOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/12 bg-white/70 px-4 font-semibold text-ink/65 transition hover:border-rose/45 hover:text-ink">
                <X size={15} aria-hidden="true" /> {assessmentCopy.nav.exit}
              </button>
            )}
          </div>
        </header>

        <div aria-hidden="true" className="absolute -left-24 top-36 size-72 rounded-full border border-rose/15" />
        <div aria-hidden="true" className="absolute -right-16 bottom-16 size-52 rounded-full bg-rose/8 blur-2xl" />

        <main id="assessment-main" className="relative mx-auto grid w-full max-w-[1380px] gap-8 px-5 py-8 sm:px-8 sm:py-12 lg:grid-cols-[0.7fr_1.3fr] lg:px-12 lg:py-16">
          <aside className="relative hidden min-h-[680px] overflow-hidden rounded-[2.25rem] bg-ink p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/7 px-4 py-2 text-xs font-semibold tracking-[0.16em] text-rose-200"><Sparkles size={15} aria-hidden="true" /> {assessmentCopy.intro.eyebrow}</span>
              <h2 className="mt-8 font-serif text-5xl leading-[1.08]">不是更多，<br />而是更适合此刻。</h2>
              <p className="mt-6 max-w-sm leading-8 text-white/58">四个章节、自适应分支，只问与方案真正相关的问题。</p>
              {view === "questions" && (
                <ol className="mt-8 space-y-3">
                  {chapters.map((chapter, index) => (
                    <li key={chapter.id} className={`flex items-center gap-3 text-sm ${index === chapterIndex ? "text-white" : "text-white/40"}`}>
                      <span className={`grid size-7 place-items-center rounded-full text-xs ${index < chapterIndex ? "bg-rose/25 text-rose-200" : index === chapterIndex ? "bg-rose text-ink" : "bg-white/8"}`}>
                        {index < chapterIndex ? <Check size={13} aria-hidden="true" /> : String(index + 1)}
                      </span>
                      {chapter.label}
                    </li>
                  ))}
                </ol>
              )}
            </div>
            <div className="relative">
              <div className="absolute -right-24 -top-36 size-72 rounded-full border border-rose/25" />
              <div className="relative grid gap-3">
                {assessmentCopy.intro.bullets.map((item) => (
                  <p key={item} className="flex items-center gap-3 text-sm text-white/65">
                    <span className="grid size-6 place-items-center rounded-full bg-rose/18 text-rose-200"><Check size={13} /></span>{item}
                  </p>
                ))}
              </div>
            </div>
          </aside>

          <section className="flex min-h-[680px] items-center rounded-[2rem] border border-white/70 bg-white/72 p-5 shadow-[0_30px_90px_rgba(59,42,67,.10)] backdrop-blur-xl sm:p-8 lg:p-10" aria-label="自适应营养测评">
            <AnimatePresence mode="wait">
              <motion.div key={key} initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduceMotion ? 0 : -12 }} transition={transition} className="mx-auto w-full max-w-3xl">
                {view === "intro" && (
                  <div>
                    <p className="text-xs font-semibold tracking-[0.22em] text-rose">{assessmentCopy.intro.eyebrow}</p>
                    <h1 className="mt-3 font-serif text-4xl leading-tight text-ink sm:text-5xl">{assessmentCopy.intro.title}</h1>
                    <p className="mt-5 max-w-2xl leading-8 text-ink/60">{assessmentCopy.intro.copy}</p>
                    <ul className="mt-7 grid gap-3">
                      {assessmentCopy.intro.bullets.map((item) => (
                        <li key={item} className="flex items-center gap-3 text-sm text-ink/70">
                          <span className="grid size-6 place-items-center rounded-full bg-rose/12 text-rose"><Check size={13} aria-hidden="true" /></span>{item}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-9 flex flex-wrap items-center gap-4">
                      <button type="button" onClick={() => setView("questions")} className="group inline-flex min-h-12 items-center gap-2 rounded-full bg-ink px-7 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-rose">
                        {assessmentCopy.intro.start} <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
                      </button>
                      <Link href="/" className="inline-flex min-h-12 items-center rounded-full px-4 font-semibold text-ink/60 transition hover:text-ink">先回首页看看</Link>
                    </div>
                  </div>
                )}

                {view === "questions" && current && (
                  <div>
                    <div className="mb-8" aria-label={`整体进度 ${progress.percent}%，已回答 ${progress.answered} 题，共 ${progress.visible} 题`}>
                      <div className="mb-3 flex items-center justify-between text-xs font-semibold tracking-[0.16em] text-ink/48">
                        <span>HER ASSESSMENT · {chapters[Math.max(0, chapterIndex)].eyebrow}</span>
                        <span>{progress.answered} / {progress.visible}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-ink/8">
                        <motion.div className="h-full rounded-full bg-rose" animate={{ width: `${progress.percent}%` }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }} />
                      </div>
                    </div>

                    <h2 ref={headingRef} tabIndex={-1} className="font-serif text-3xl leading-tight text-ink outline-none sm:text-4xl">{current.title}</h2>

                    <QuestionRenderer
                      question={current}
                      answers={answers}
                      error={error}
                      onChange={(question, next) => updateAnswer(question.id, next)}
                    />

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <button type="button" onClick={back} disabled={cursor === 0} className="inline-flex min-h-12 items-center gap-2 rounded-full px-3 font-semibold text-ink/65 disabled:invisible"><ArrowLeft size={17} aria-hidden="true" /> 上一步</button>
                      <button type="button" onClick={next} className="group inline-flex min-h-12 items-center gap-2 rounded-full bg-ink px-7 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-rose">
                        {cursor >= visible.length - 1 ? assessmentCopy.nav.submit : assessmentCopy.nav.next}
                        <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                )}

                {view === "result" && result && (
                  <ResultDashboard
                    result={result}
                    signedIn={Boolean(user)}
                    onLogin={() => openLogin("login")}
                    onRestart={restart}
                    onBackEdit={() => { setView("questions"); setCursor(0); }}
                    onCheckout={requestCheckout}
                  />
                )}

                {view === "checkout" && result && (
                  <AssessmentCheckout
                    planTitle={`${result.basePack.title}${result.focusModules.length > 0 ? ` + ${result.focusModules.map((module) => module.title).join(" + ")}` : ""}`}
                    ingredientCount={result.basePack.ingredients.length + result.focusModules.reduce((sum, module) => sum + module.ingredients.length, 0)}
                    accountName={user?.displayName}
                    onBack={() => setView("result")}
                    onSuccess={() => setView("success")}
                  />
                )}

                {view === "success" && <SuccessView onRestart={restart} />}
              </motion.div>
            </AnimatePresence>
          </section>
        </main>

        <footer className="relative px-5 pb-8 text-center text-xs leading-6 text-ink/42">方案由浏览器内规则引擎生成，不构成医疗建议。本页不发送或保存你填写的内容。</footer>

        {exitOpen && (
          <ExitConfirm
            onCancel={() => setExitOpen(false)}
            onConfirm={() => {
              setAnswers({});
              setCursor(0);
              router.push("/");
            }}
          />
        )}
      </div>
      <span className="sr-only">页面动效支持 prefers-reduced-motion 设置。</span>
    </LazyMotion>
  );
}

function SuccessView({ onRestart }: { onRestart: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { checkoutCopy } = require("@/assessment-content") as typeof import("@/assessment-content");
  useEffect(() => { headingRef.current?.focus(); }, []);

  return (
    <div className="py-6 text-center sm:py-12">
      <span className="mx-auto grid size-20 place-items-center rounded-full bg-[#edf7f2] text-[#35705a]"><CheckCircle2 size={40} aria-hidden="true" /></span>
      <p className="mt-7 text-xs font-semibold tracking-[0.22em] text-rose">{checkoutCopy.successEyebrow}</p>
      <h1 ref={headingRef} tabIndex={-1} className="mt-3 font-serif text-4xl leading-tight text-ink outline-none sm:text-5xl">{checkoutCopy.successTitle}</h1>
      <p className="mx-auto mt-5 max-w-xl leading-8 text-ink/58">{checkoutCopy.successCopy}</p>
      <div className="mx-auto mt-8 max-w-md rounded-[1.5rem] border border-ink/8 bg-white p-5 text-left">
        <div className="flex items-center gap-4">
          <span className="grid size-12 place-items-center rounded-2xl bg-lilac"><PackageCheck size={22} aria-hidden="true" /></span>
          <div><p className="font-semibold">{checkoutCopy.successOrderId}</p><p className="mt-1 text-sm text-ink/45">{checkoutCopy.successOrderNote}</p></div>
        </div>
      </div>
      <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-7 font-semibold text-white transition hover:bg-rose"><Home size={17} aria-hidden="true" /> {checkoutCopy.backHome}</Link>
        <button type="button" onClick={onRestart} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-ink/12 bg-white px-7 font-semibold"><ArrowRight size={17} aria-hidden="true" /> {checkoutCopy.retake}</button>
      </div>
    </div>
  );
}
