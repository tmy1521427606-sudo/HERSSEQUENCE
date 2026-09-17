"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  Home,
  Leaf,
  LockKeyhole,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, LazyMotion, domAnimation, m as motion, useReducedMotion } from "framer-motion";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { paymentMethods, questions, type QuizQuestion } from "@/quiz-content";
import {
  generatePlan,
  getOrderSummary,
  validateCheckout,
  type BillingCycle,
  type CheckoutFields,
  type PlanResult,
  type QuizAnswers,
} from "@/lib/quiz-utils";

type View = "quiz" | "result" | "checkout" | "success";

const initialFields: CheckoutFields = { name: "", phone: "", city: "", address: "" };

const fieldMeta = [
  { id: "name", label: "收货人", placeholder: "例如：林岚", autoComplete: "name" },
  { id: "phone", label: "手机号码", placeholder: "仅用于演示，不会保存", autoComplete: "tel" },
  { id: "city", label: "所在城市", placeholder: "例如：上海", autoComplete: "address-level2" },
  { id: "address", label: "详细地址", placeholder: "示例路 1 号", autoComplete: "street-address" },
] satisfies Array<{ id: keyof CheckoutFields; label: string; placeholder: string; autoComplete: string }>;

function BrandHeader({ step }: { step?: string }) {
  return (
    <header className="relative z-20 flex items-center justify-between border-b border-ink/8 px-5 py-4 sm:px-8 lg:px-12">
      <Link href="/" className="group inline-flex min-h-11 items-center gap-3 font-semibold tracking-[0.14em] text-ink">
        <span className="grid size-9 place-items-center rounded-full bg-ink text-xs text-white transition-transform group-hover:rotate-6">她</span>
        <span>HERSEQUENCE</span>
      </Link>
      <div className="flex items-center gap-3 text-sm text-ink/55">
        {step && <span className="hidden sm:inline">{step}</span>}
        <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2">
          <Clock3 size={15} aria-hidden="true" /> 约 2 分钟
        </span>
      </div>
    </header>
  );
}

function Progress({ current }: { current: number }) {
  const percent = ((current + 1) / questions.length) * 100;
  return (
    <div className="mb-8" aria-label={`测评进度，第 ${current + 1} 步，共 ${questions.length} 步`}>
      <div className="mb-3 flex items-center justify-between text-xs font-semibold tracking-[0.16em] text-ink/48">
        <span>PERSONAL PROFILE</span>
        <span>{String(current + 1).padStart(2, "0")} / {String(questions.length).padStart(2, "0")}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-ink/8">
        <motion.div className="h-full rounded-full bg-rose" animate={{ width: `${percent}%` }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }} />
      </div>
    </div>
  );
}

function QuizStep({
  question,
  value,
  error,
  onSelect,
}: {
  question: QuizQuestion;
  value?: string;
  error: string;
  onSelect: (value: QuizAnswers[keyof QuizAnswers]) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.22em] text-rose">{question.eyebrow}</p>
      <h1 className="mt-3 font-serif text-4xl leading-tight text-ink sm:text-5xl">{question.title}</h1>
      <p className="mt-4 leading-7 text-ink/58">{question.description}</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2" role="group" aria-label={question.title}>
        {question.options.map((option) => {
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(option.id as QuizAnswers[keyof QuizAnswers])}
              className={`group relative min-h-[104px] rounded-[1.4rem] border p-4 text-left transition sm:p-5 ${
                selected
                  ? "border-rose bg-[#fff1f4] shadow-[0_12px_35px_rgba(232,108,141,.14)]"
                  : "border-ink/10 bg-white/72 hover:-translate-y-0.5 hover:border-rose/35 hover:bg-white"
              }`}
            >
              <span className={`float-left mr-4 grid size-11 place-items-center rounded-full text-sm font-semibold ${selected ? "bg-rose text-white" : "bg-lilac text-ink/70"}`}>
                {selected ? <Check size={17} aria-hidden="true" /> : option.symbol}
              </span>
              <span className="block pr-7 font-semibold text-ink">{option.label}</span>
              <span className="mt-1 block text-sm leading-6 text-ink/48">{option.detail}</span>
              <span className={`absolute right-4 top-4 size-3 rounded-full border ${selected ? "border-rose bg-rose" : "border-ink/15"}`} aria-hidden="true" />
            </button>
          );
        })}
      </div>
      <p className="mt-4 min-h-6 text-sm font-medium text-[#a93257]" aria-live="polite">{error}</p>
    </div>
  );
}

function PlanResultView({ plan, onRestart, onCheckout }: { plan: PlanResult; onRestart: () => void; onCheckout: () => void }) {
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-rose">{plan.label}</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-ink sm:text-5xl">你的「{plan.title}」</h1>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-[#edf7f2] px-4 py-2 text-sm font-semibold text-[#35705a]">
          <Sparkles size={16} aria-hidden="true" /> 已生成演示方案
        </span>
      </div>

      <p className="mt-5 max-w-2xl text-base leading-8 text-ink/60">{plan.reason} {plan.stageReason}</p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {plan.nutrients.map((nutrient, index) => (
          <article key={`${nutrient.name}-${index}`} className="relative overflow-hidden rounded-[1.5rem] border border-ink/8 bg-white p-5">
            <span className="absolute right-0 top-0 h-20 w-20 rounded-bl-full opacity-20" style={{ backgroundColor: nutrient.accent }} aria-hidden="true" />
            <span className="relative grid size-11 place-items-center rounded-2xl text-sm font-bold text-ink" style={{ backgroundColor: `${nutrient.accent}55` }}>{index + 1}</span>
            <h2 className="relative mt-5 text-lg font-semibold">{nutrient.name}</h2>
            <p className="relative mt-1 text-xs tracking-[0.08em] text-ink/42">{nutrient.english}</p>
            <p className="relative mt-4 text-sm leading-6 text-ink/58">{nutrient.benefit}</p>
            <p className="relative mt-5 inline-flex rounded-full bg-lilac px-3 py-1.5 text-xs font-semibold text-ink/65">{nutrient.timing}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.35rem] bg-lilac p-5">
          <p className="flex items-center gap-2 text-sm font-semibold"><Leaf size={17} className="text-[#5f8b76]" aria-hidden="true" /> 来源说明</p>
          <p className="mt-2 text-sm leading-6 text-ink/56">{plan.sourceNote}</p>
        </div>
        <div className="rounded-[1.35rem] bg-[#fff2eb] p-5">
          <p className="flex items-center gap-2 text-sm font-semibold"><Clock3 size={17} className="text-[#b76c48]" aria-hidden="true" /> 作息建议</p>
          <p className="mt-2 text-sm leading-6 text-ink/56">{plan.routineNote}</p>
        </div>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-[1.35rem] border border-rose/20 bg-[#fff8fa] p-5 text-sm leading-6 text-ink/62">
        <ShieldCheck size={20} className="mt-0.5 shrink-0 text-rose" aria-hidden="true" />
        <p>{plan.caution}</p>
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button type="button" onClick={onRestart} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-ink/12 bg-white px-6 font-semibold text-ink transition hover:border-rose/45">
          <RefreshCw size={17} aria-hidden="true" /> 重新测评
        </button>
        <button type="button" onClick={onCheckout} className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-7 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-rose">
          继续模拟订阅 <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function CheckoutView({ plan, onBack, onSuccess }: { plan: PlanResult; onBack: () => void; onSuccess: () => void }) {
  const [cycle, setCycle] = useState<BillingCycle>("quarterly");
  const [fields, setFields] = useState<CheckoutFields>(initialFields);
  const [payment, setPayment] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const order = getOrderSummary(cycle);

  function updateField(field: keyof CheckoutFields, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateCheckout(fields, payment);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) onSuccess();
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-rose">DEMO CHECKOUT</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-ink sm:text-5xl">确认你的订阅</h1>
          <p className="mt-3 text-ink/56">{plan.title} · 每日 3 项营养示意</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-[#fff0f4] px-4 py-2 text-sm font-semibold text-[#a93257]"><LockKeyhole size={15} aria-hidden="true" /> 模拟支付，不会扣款</span>
      </div>

      <fieldset className="mt-8">
        <legend className="font-semibold text-ink">选择订阅周期</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(["monthly", "quarterly"] as BillingCycle[]).map((item) => {
            const summary = getOrderSummary(item);
            const selected = cycle === item;
            return (
              <button key={item} type="button" aria-pressed={selected} onClick={() => setCycle(item)} className={`relative min-h-[98px] rounded-[1.3rem] border p-4 text-left transition ${selected ? "border-rose bg-[#fff2f5]" : "border-ink/10 bg-white hover:border-rose/35"}`}>
                {item === "quarterly" && <span className="absolute right-3 top-3 rounded-full bg-rose px-2.5 py-1 text-[10px] font-semibold text-white">省 30%</span>}
                <span className="block font-semibold">{summary.days} 天装</span>
                <span className="mt-2 block text-2xl font-semibold">¥{summary.total} <span className="text-sm font-normal text-ink/38 line-through">¥{summary.compareAt}</span></span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mt-8">
        <legend className="font-semibold text-ink">演示收货信息</legend>
        <p className="mt-1 text-sm text-ink/45">以下内容只保存在当前页面内，刷新后即清除。</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {fieldMeta.map((field) => (
            <label key={field.id} className={field.id === "address" ? "sm:col-span-2" : ""}>
              <span className="mb-2 block text-sm font-medium text-ink/72">{field.label}</span>
              <input
                type={field.id === "phone" ? "tel" : "text"}
                value={fields[field.id]}
                onChange={(event) => updateField(field.id, event.target.value)}
                autoComplete={field.autoComplete}
                aria-invalid={Boolean(errors[field.id])}
                aria-describedby={errors[field.id] ? `${field.id}-error` : undefined}
                placeholder={field.placeholder}
                className="min-h-12 w-full rounded-2xl border border-ink/10 bg-white px-4 text-ink placeholder:text-ink/28 focus:border-rose focus:outline-none"
              />
              {errors[field.id] && <span id={`${field.id}-error`} className="mt-1.5 block text-xs font-medium text-[#a93257]">{errors[field.id]}</span>}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-8">
        <legend className="font-semibold text-ink">模拟支付方式</legend>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
          {paymentMethods.map((method) => {
            const selected = payment === method.id;
            return (
              <button key={method.id} type="button" aria-pressed={selected} onClick={() => { setPayment(method.id); setErrors((current) => ({ ...current, payment: "" })); }} className={`min-h-[82px] rounded-[1.2rem] border p-3 text-center transition ${selected ? "border-rose bg-[#fff2f5]" : "border-ink/10 bg-white hover:border-rose/35"}`}>
                <span className={`mx-auto grid size-8 place-items-center rounded-full text-xs font-bold ${selected ? "bg-rose text-white" : "bg-lilac text-ink/65"}`}>{method.mark}</span>
                <span className="mt-2 block text-xs font-semibold sm:text-sm">{method.label}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 min-h-5 text-xs font-medium text-[#a93257]" aria-live="polite">{errors.payment}</p>
      </fieldset>

      <div className="mt-6 rounded-[1.4rem] bg-ink p-5 text-white sm:p-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4"><span className="text-white/60">{order.days} 天方案</span><span className="text-white/45 line-through">¥{order.compareAt}</span></div>
        <div className="flex items-center justify-between py-3 text-sm"><span className="text-white/60">订阅优惠</span><span className="text-rose-200">-¥{order.saving}</span></div>
        <div className="flex items-end justify-between border-t border-white/10 pt-4"><span className="font-semibold">演示应付</span><span className="text-3xl font-semibold">¥{order.total}</span></div>
      </div>

      <p className="mt-4 text-sm text-[#a93257]" aria-live="polite">
        {Object.keys(errors).length > 0 ? "请完善标注的演示信息后继续。" : ""}
      </p>
      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button type="button" onClick={onBack} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-ink/12 bg-white px-6 font-semibold"><ArrowLeft size={17} aria-hidden="true" /> 返回方案</button>
        <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-rose px-7 font-semibold text-white shadow-[0_14px_35px_rgba(232,108,141,.25)] transition hover:-translate-y-0.5 hover:bg-[#bd3f66]"><CreditCard size={17} aria-hidden="true" /> 完成模拟支付</button>
      </div>
    </form>
  );
}

function SuccessView({ onRestart }: { onRestart: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headingRef.current?.focus(); }, []);

  return (
    <div className="py-6 text-center sm:py-12">
      <span className="mx-auto grid size-20 place-items-center rounded-full bg-[#edf7f2] text-[#35705a]"><CheckCircle2 size={40} aria-hidden="true" /></span>
      <p className="mt-7 text-xs font-semibold tracking-[0.22em] text-rose">DEMO COMPLETED</p>
      <h1 ref={headingRef} tabIndex={-1} className="mt-3 font-serif text-4xl leading-tight text-ink outline-none sm:text-5xl">演示订单已完成</h1>
      <p className="mx-auto mt-5 max-w-xl leading-8 text-ink/58">这是一笔不会扣款、不会发货、也不会保存地址的模拟订单。你刚刚体验了她序从了解需求到完成订阅的完整品牌链路。</p>
      <div className="mx-auto mt-8 max-w-md rounded-[1.5rem] border border-ink/8 bg-white p-5 text-left">
        <div className="flex items-center gap-4"><span className="grid size-12 place-items-center rounded-2xl bg-lilac"><PackageCheck size={22} aria-hidden="true" /></span><div><p className="font-semibold">HER-DEMO-2026</p><p className="mt-1 text-sm text-ink/45">仅作作品展示 · 未生成真实订单</p></div></div>
      </div>
      <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-7 font-semibold text-white transition hover:bg-rose"><Home size={17} aria-hidden="true" /> 返回首页</Link>
        <button type="button" onClick={onRestart} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-ink/12 bg-white px-7 font-semibold"><RefreshCw size={17} aria-hidden="true" /> 重新测评</button>
      </div>
    </div>
  );
}

export default function QuizExperience() {
  const reduceMotion = useReducedMotion();
  const [view, setView] = useState<View>("quiz");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});
  const [error, setError] = useState("");
  const question = questions[step];
  const complete = Boolean(answers.stage && answers.goal && answers.diet && answers.routine);
  const plan = useMemo(() => complete ? generatePlan(answers as QuizAnswers) : null, [answers, complete]);

  function select(value: QuizAnswers[keyof QuizAnswers]) {
    setAnswers((current) => ({ ...current, [question.id]: value }));
    setError("");
  }

  function next() {
    if (!answers[question.id]) {
      setError("请先选择一个最接近你的选项。");
      return;
    }
    if (step < questions.length - 1) {
      setStep((current) => current + 1);
      setError("");
      return;
    }
    setView("result");
  }

  function back() {
    if (step > 0) {
      setStep((current) => current - 1);
      setError("");
    }
  }

  function restart() {
    setView("quiz");
    setStep(0);
    setAnswers({});
    setError("");
  }

  const transition = reduceMotion ? { duration: 0 } : { duration: 0.42, ease: [0.16, 1, 0.3, 1] as const };
  const key = view === "quiz" ? `${view}-${step}` : view;

  return (
    <LazyMotion features={domAnimation}>
      <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_10%_15%,rgba(232,108,141,.16),transparent_28%),radial-gradient(circle_at_90%_80%,rgba(154,135,194,.18),transparent_30%),linear-gradient(135deg,#fff9f8,#f5f0ff)] text-ink">
        <a href="#quiz-main" className="fixed left-4 top-3 z-50 -translate-y-24 rounded-full bg-ink px-5 py-3 font-semibold text-white transition focus:translate-y-0">跳到测评内容</a>
        <BrandHeader step={view === "quiz" ? `第 ${step + 1} / ${questions.length} 步` : undefined} />
        <div aria-hidden="true" className="absolute -left-24 top-36 size-72 rounded-full border border-rose/15" />
        <div aria-hidden="true" className="absolute -right-16 bottom-16 size-52 rounded-full bg-rose/8 blur-2xl" />

        <main id="quiz-main" className="relative mx-auto grid w-full max-w-[1380px] gap-8 px-5 py-8 sm:px-8 sm:py-12 lg:grid-cols-[0.7fr_1.3fr] lg:px-12 lg:py-16">
          <aside className="relative hidden min-h-[680px] overflow-hidden rounded-[2.25rem] bg-ink p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/7 px-4 py-2 text-xs font-semibold tracking-[0.16em] text-rose-200"><Sparkles size={15} aria-hidden="true" /> HER NUTRITION PROFILE</span>
              <h2 className="mt-8 font-serif text-5xl leading-[1.08]">不是更多，<br />而是更适合此刻。</h2>
              <p className="mt-6 max-w-sm leading-8 text-white/58">四个简单问题，拼出一份有理由、有边界，也更容易坚持的每日营养示意。</p>
            </div>
            <div className="relative">
              <div className="absolute -right-24 -top-36 size-72 rounded-full border border-rose/25" />
              <div className="relative grid gap-3">
                {["不询问疾病或检查结果", "不保存任何填写内容", "不产生真实建议或订单"].map((item) => <p key={item} className="flex items-center gap-3 text-sm text-white/65"><span className="grid size-6 place-items-center rounded-full bg-rose/18 text-rose-200"><Check size={13} /></span>{item}</p>)}
              </div>
            </div>
          </aside>

          <section className="flex min-h-[680px] items-center rounded-[2rem] border border-white/70 bg-white/72 p-5 shadow-[0_30px_90px_rgba(59,42,67,.10)] backdrop-blur-xl sm:p-8 lg:p-10" aria-label="定制营养体验">
            <AnimatePresence mode="wait">
              <motion.div key={key} initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduceMotion ? 0 : -12 }} transition={transition} className="mx-auto w-full max-w-3xl">
                {view === "quiz" && (
                  <>
                    <Progress current={step} />
                    <QuizStep question={question} value={answers[question.id]} error={error} onSelect={select} />
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <button type="button" onClick={back} disabled={step === 0} className="inline-flex min-h-12 items-center gap-2 rounded-full px-3 font-semibold text-ink/65 disabled:invisible"><ArrowLeft size={17} aria-hidden="true" /> 上一步</button>
                      <button type="button" onClick={next} className="group inline-flex min-h-12 items-center gap-2 rounded-full bg-ink px-7 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-rose">{step === questions.length - 1 ? "生成我的方案" : "下一步"}<ArrowRight size={17} className="transition-transform group-hover:translate-x-1" aria-hidden="true" /></button>
                    </div>
                  </>
                )}
                {view === "result" && plan && <PlanResultView plan={plan} onRestart={restart} onCheckout={() => setView("checkout")} />}
                {view === "checkout" && plan && <CheckoutView plan={plan} onBack={() => setView("result")} onSuccess={() => setView("success")} />}
                {view === "success" && <SuccessView onRestart={restart} />}
              </motion.div>
            </AnimatePresence>
          </section>
        </main>
        <footer className="relative px-5 pb-8 text-center text-xs leading-6 text-ink/42">本体验仅用于品牌概念展示，不构成医疗建议。页面不会发送或保存你填写的内容。</footer>
      </div>
    </LazyMotion>
  );
}
