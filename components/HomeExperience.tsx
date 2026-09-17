"use client";

import Image from "next/image";
import {
  ArrowRight,
  Brain,
  CalendarDays,
  Check,
  ChevronDown,
  CirclePlay,
  ClipboardCheck,
  Heart,
  Instagram,
  Leaf,
  Menu,
  Mic,
  PackageCheck,
  Pause,
  Play,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  X,
} from "lucide-react";
import { AnimatePresence, LazyMotion, domAnimation, m as motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { type MouseEvent, useEffect, useRef, useState } from "react";
import {
  compliance,
  experts,
  faqs,
  footerColumns,
  ingredientFilters,
  ingredients,
  navigation,
  painPoints,
  personas,
  planBenefits,
  plans,
  steps,
  stories,
  trustItems,
  type IconName,
  type IngredientTag,
  type Persona,
} from "@/content";
import { filterIngredients, formatPrice, nextVoiceState, pricePerDay, type VoiceState } from "@/lib/site-utils";

const icons = {
  sparkles: Sparkles,
  target: Target,
  calendar: CalendarDays,
  shield: ShieldCheck,
  stethoscope: Stethoscope,
  heart: Heart,
  clipboard: ClipboardCheck,
  brain: Brain,
  package: PackageCheck,
} satisfies Record<IconName, typeof Sparkles>;

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return <div className={className} style={delay ? { animationDelay: `${delay}s` } : undefined}>{children}</div>;
}

function SectionIntro({ eyebrow, title, copy, light = false }: { eyebrow: string; title: string; copy: string; light?: boolean }) {
  return (
    <Reveal className="mx-auto max-w-3xl text-center">
      <p className={`mb-4 text-sm font-semibold tracking-[0.24em] ${light ? "text-rose-200" : "text-[#bd3f66]"}`}>{eyebrow}</p>
      <h2 className={`font-serif text-4xl leading-[1.12] sm:text-5xl lg:text-6xl ${light ? "text-white" : "text-ink"}`}>{title}</h2>
      <p className={`mx-auto mt-5 max-w-2xl text-base leading-8 sm:text-lg ${light ? "text-white/68" : "text-ink/62"}`}>{copy}</p>
    </Reveal>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <nav className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12" aria-label="主要导航">
        <a href="#hero" className="group flex min-h-11 items-center gap-3 font-semibold tracking-[0.16em] text-ink">
          <span className="grid size-9 place-items-center rounded-full bg-ink text-xs text-white transition-transform group-hover:rotate-6">她</span>
          <span>HERSEQUENCE</span>
        </a>
        <div className="hidden items-center gap-8 lg:flex">
          {navigation.map((item) => (
            <a key={item.href} href={item.href} className="text-sm font-medium text-ink/68 transition-colors hover:text-ink">{item.label}</a>
          ))}
        </div>
        <a href="/quiz" className="hidden min-h-11 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-rose lg:flex">
          获取专属方案 <ArrowRight size={16} aria-hidden="true" />
        </a>
        <button type="button" className="grid size-11 place-items-center rounded-full border border-ink/10 bg-white/70 lg:hidden" aria-label={open ? "关闭菜单" : "打开菜单"} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mx-5 rounded-3xl border border-ink/10 bg-white p-4 shadow-soft lg:hidden">
            {navigation.map((item) => <a key={item.href} href={item.href} onClick={() => setOpen(false)} className="flex min-h-12 items-center rounded-2xl px-4 font-medium hover:bg-lilac">{item.label}</a>)}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function Hero() {
  return (
    <section id="hero" aria-label="品牌介绍" className="relative min-h-[880px] overflow-hidden bg-[radial-gradient(circle_at_80%_10%,#f4d7e0_0,transparent_35%),linear-gradient(135deg,#fff9f8_15%,#f7f1fb_100%)] pt-28">
      <Header />
      <div className="absolute -left-24 top-56 size-64 rounded-full border border-rose/15" />
      <div className="relative mx-auto grid max-w-[1440px] items-center gap-12 px-5 pb-16 pt-12 sm:px-8 lg:min-h-[760px] lg:grid-cols-[0.92fr_1.08fr] lg:px-12 lg:py-20">
        <div className="relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-rose/20 bg-white/70 px-4 py-2 text-sm font-semibold text-rose backdrop-blur">
            <Sparkles size={16} aria-hidden="true" /> 女性阶段营养 · 每月为你更新
          </div>
          <h1 className="max-w-2xl font-serif text-[clamp(3.25rem,7vw,6.8rem)] leading-[0.98] tracking-[-0.03em] text-ink">
            为每一个她，<span className="relative whitespace-nowrap text-rose">定制专属营养<span className="absolute -bottom-2 left-0 h-2 w-full rounded-full bg-rose/15" /></span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-ink/66 sm:text-xl">从生命阶段、饮食方式到作息状态，让每天的一袋营养，真正回应此刻的你。</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href="/quiz" className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#bd3f66] px-7 font-semibold text-white shadow-[0_16px_40px_rgba(189,63,102,.25)] transition hover:-translate-y-1 hover:bg-[#a93257]">
              免费测评，获取专属方案 <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </a>
            <a href="#personas" className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full border border-ink/12 bg-white/70 px-7 font-semibold text-ink backdrop-blur transition hover:border-rose/40 hover:bg-white"><CirclePlay size={19} aria-hidden="true" /> 先看看适合谁</a>
          </div>
          <p className="mt-5 flex items-center gap-2 text-sm text-ink/50"><ShieldCheck size={16} aria-hidden="true" /> 2 分钟了解需求 · 当前为品牌概念展示</p>
        </div>
        <div className="relative mx-auto w-full max-w-2xl lg:max-w-none">
          <div className="relative aspect-[1.06/1] overflow-hidden rounded-[2rem] bg-[#eedce3] shadow-[0_35px_100px_rgba(61,39,68,.18)] sm:rounded-[3rem]">
            <Image src="/images/hero-women-optimized.webp" alt="三位处于不同人生阶段的女性自然相聚" fill priority fetchPriority="high" sizes="(max-width: 1024px) 100vw, 54vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 rounded-3xl border border-white/40 bg-white/88 p-4 shadow-lg backdrop-blur sm:bottom-8 sm:left-8 sm:p-5">
              <p className="text-xs font-semibold tracking-[.18em] text-rose">TODAY&apos;S PACK</p>
              <div className="mt-2 flex items-center gap-4">
                <span className="grid size-12 place-items-center rounded-2xl bg-rose text-lg font-bold text-ink">21</span>
                <div><p className="font-semibold">你的第 21 天</p><p className="text-sm text-ink/50">3 种营养 · 早餐后</p></div>
              </div>
            </div>
          </div>
          <div aria-hidden="true" className="absolute -right-2 top-10 hidden rounded-3xl border border-white/60 bg-white/90 px-5 py-4 shadow-soft backdrop-blur sm:block">
            <p className="text-xs font-semibold text-ink/45">本月关注</p><p className="mt-1 font-serif text-2xl text-ink">睡眠 · 周期 · 活力</p>
          </div>
        </div>
      </div>
      <div className="relative mx-auto grid max-w-[1440px] grid-cols-1 border-y border-ink/8 bg-white/50 px-5 backdrop-blur sm:grid-cols-3 sm:px-8 lg:px-12">
        {trustItems.map((item, index) => { const Icon = icons[item.icon]; return <div key={item.id} className={`flex items-center justify-center gap-3 py-5 text-sm font-semibold text-ink/72 ${index < 2 ? "sm:border-r sm:border-ink/8" : ""}`}><Icon size={19} className="text-rose" aria-hidden="true" />{item.label}{item.id === "trusted" && <span className="text-xs font-normal text-ink/40">*</span>}</div>; })}
      </div>
    </section>
  );
}

function PainPoints() {
  return (
    <section id="pain-points" aria-label="女性营养痛点" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <SectionIntro eyebrow="WHY HERSEQUENCE" title="营养不该只有一种标准答案" copy="不是补得越多越好，而是在正确的阶段，选择真正需要的那一些。" />
        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {painPoints.map((item, index) => { const Icon = icons[item.icon]; return <Reveal key={item.id} delay={index * 0.08}><article className="group relative h-full overflow-hidden rounded-[2rem] border border-ink/8 bg-cream p-7 transition duration-500 hover:-translate-y-2 hover:border-rose/25 hover:shadow-soft sm:p-9"><span aria-hidden="true" className="absolute right-6 top-3 font-serif text-7xl text-ink/50">{item.number}</span><span className="grid size-14 place-items-center rounded-2xl bg-white text-[#bd3f66] shadow-sm transition group-hover:rotate-6 group-hover:bg-[#bd3f66] group-hover:text-white"><Icon size={25} aria-hidden="true" /></span><h3 className="mt-8 font-serif text-3xl leading-tight">{item.title}</h3><p className="mt-4 leading-7 text-ink/65">{item.copy}</p></article></Reveal>; })}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });
  const line = useSpring(scrollYProgress, { stiffness: 100, damping: 24 });
  return (
    <section id="how-it-works" aria-label="定制流程" className="overflow-hidden bg-lilac py-24 sm:py-32">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <SectionIntro eyebrow="HOW IT WORKS" title="从了解你开始，三步抵达日常" copy="流程简单，但每一步都让方案更接近真实的你。" />
        <div ref={ref} className="relative mt-16 grid gap-8 lg:grid-cols-3 lg:gap-12">
          <div className="absolute left-[16.67%] right-[16.67%] top-10 hidden h-px bg-ink/10 lg:block"><motion.div className="h-full origin-left bg-rose" style={{ scaleX: line }} /></div>
          {steps.map((step, index) => { const Icon = icons[step.icon]; return <Reveal key={step.id} delay={index * 0.12} className="relative"><article className="relative z-10 rounded-[2rem] bg-white/68 p-7 backdrop-blur sm:p-9 lg:bg-transparent lg:p-0 lg:text-center"><span className="mx-auto grid size-20 place-items-center rounded-full border-8 border-lilac bg-ink text-white shadow-lg"><Icon size={27} aria-hidden="true" /></span><p className="mt-7 text-xs font-bold tracking-[.2em] text-[#a93257]">STEP {step.number} · {step.duration}</p><h3 className="mt-3 font-serif text-3xl">{step.title}</h3><p className="mx-auto mt-4 max-w-sm leading-7 text-ink/65">{step.copy}</p></article></Reveal>; })}
        </div>
      </div>
    </section>
  );
}

function PersonaCard({ persona, index }: { persona: Persona; index: number }) {
  const reduced = useReducedMotion();
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  function move(event: MouseEvent<HTMLElement>) {
    if (reduced) return;
    const box = event.currentTarget.getBoundingClientRect();
    setTilt({
      y: ((event.clientX - box.left) / box.width - 0.5) * 8,
      x: -((event.clientY - box.top) / box.height - 0.5) * 8,
    });
  }
  return (
    <article onMouseMove={move} onMouseLeave={() => setTilt({ x: 0, y: 0 })} style={reduced ? undefined : { transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }} className="group relative min-h-[470px] overflow-hidden rounded-[2rem] bg-ink shadow-[0_24px_70px_rgba(26,26,46,.13)] transition-transform duration-200" data-card-index={index}>
      <Image src={`/images/persona-${persona.id}.webp`} alt={`${persona.name}生活方式画像`} fill loading="lazy" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover transition duration-700 group-hover:scale-[1.04]" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/15 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
        <p className="text-xs font-semibold tracking-[.2em] text-white/65">{persona.english} · {persona.eyebrow}</p>
        <h3 className="mt-2 font-serif text-4xl">{persona.name}</h3>
        <p className="mt-2 text-lg text-white/85">{persona.tagline}</p>
        <div className="mt-5 flex flex-wrap gap-2">{persona.ingredients.map((ingredient) => <span key={ingredient} className="rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-xs backdrop-blur">{ingredient}</span>)}</div>
        <div className="grid grid-rows-[0fr] transition-all duration-500 group-hover:grid-rows-[1fr] group-focus-within:grid-rows-[1fr]"><div className="overflow-hidden"><p className="pt-4 text-sm leading-6 text-white/70">{persona.detail}</p></div></div>
        <a href="#pricing" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-ink transition hover:bg-rose hover:text-white">查看她的方案 <ArrowRight size={15} aria-hidden="true" /></a>
      </div>
    </article>
  );
}

function Personas() {
  return (
    <section id="personas" aria-label="女性画像" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <SectionIntro eyebrow="MADE FOR HER" title="六种当下，不止六种可能" copy="你不需要被归类。画像只是入口，方案会继续根据你的饮食、作息与关注方向细化。" />
        <div className="mt-16 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{personas.map((persona, index) => <PersonaCard key={persona.id} persona={persona} index={index} />)}</div>
      </div>
    </section>
  );
}

function IngredientLibrary() {
  const [filter, setFilter] = useState<(typeof ingredientFilters)[number]["id"]>("all");
  const filtered = filterIngredients(ingredients, filter);
  const filterLabels: Record<IngredientTag, string> = { pregnancy: "孕期可选", vegan: "素食", allergenFree: "无常见过敏原" };
  return (
    <section id="ingredients" aria-label="成分透明" className="relative overflow-hidden bg-ink py-24 text-white sm:py-32">
      <div aria-hidden="true" className="absolute -right-32 top-0 size-[34rem] rounded-full bg-rose/15 blur-3xl" />
      <div className="relative mx-auto max-w-[1280px] px-5 sm:px-8">
        <SectionIntro eyebrow="INGREDIENT TRANSPARENCY" title="每一种成分，都应该说得清楚" copy="来源、剂型、适用限制与选择理由，一起放在台面上。" light />
        <div className="mt-10 flex flex-wrap justify-center gap-2" role="group" aria-label="筛选成分">
          {ingredientFilters.map((item) => <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)} className={`min-h-11 rounded-full px-5 text-sm font-semibold transition ${filter === item.id ? "bg-[#bd3f66] text-white" : "border border-white/15 bg-white/5 text-white/75 hover:bg-white/10"}`}>{item.label}</button>)}
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
          {filtered.map((item, index) => <article key={item.id} className="group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[.065] p-6 backdrop-blur transition hover:-translate-y-1 hover:bg-white/[.1]">
            <div className="flex items-start justify-between gap-4"><span className="grid size-12 place-items-center rounded-full" style={{ backgroundColor: item.accent }}><Leaf size={20} className="text-ink" aria-hidden="true" /></span><span aria-hidden="true" className="font-serif text-4xl text-white/45">{String(index + 1).padStart(2, "0")}</span></div>
            <h3 className="mt-5 font-serif text-2xl">{item.name}</h3><p className="mt-1 text-xs tracking-[.14em] text-white/65">{item.english.toUpperCase()}</p><p className="mt-4 text-sm leading-6 text-white/70">{item.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">{item.tags.map((tag) => <span key={tag} className="rounded-full bg-white/8 px-2.5 py-1 text-[11px] text-white/70">{filterLabels[tag]}</span>)}</div>
          </article>)}
        </div>
        <p className="mt-8 text-center text-sm text-white/42">“孕期可选”等标签为产品概念分类，不替代个人专业建议。</p>
      </div>
    </section>
  );
}

function Stories() {
  const [active, setActive] = useState(0);
  return (
    <section id="stories" aria-label="用户故事" className="bg-cream py-24 sm:py-32">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <SectionIntro eyebrow="REAL ROUTINES" title="被坚持下来的，才是好方案" copy="三段概念用户故事，展示她序希望融入的真实日常。" />
        <div className="mt-14 grid gap-8 lg:grid-cols-[1.45fr_.75fr]">
          <Reveal><div className="relative overflow-hidden rounded-[2.25rem] bg-ink">
            <div className="grid sm:grid-cols-[.85fr_1.15fr]">
              <div className="relative min-h-[400px] sm:min-h-[520px]"><Image key={stories[active].id} src={`/images/story-${stories[active].id}.webp`} alt={`${stories[active].name}的日常故事封面`} fill loading="lazy" sizes="(max-width: 640px) 100vw, 40vw" className="object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-ink/55 to-transparent" /><span role="img" aria-label="UGC 视频封面演示" className="absolute bottom-5 left-5 grid size-14 place-items-center rounded-full bg-white text-ink shadow-lg"><Play size={20} fill="currentColor" aria-hidden="true" /></span></div>
              <div className="flex min-h-[380px] flex-col justify-between p-7 text-white sm:p-10"><div><p className="text-xs font-semibold tracking-[.2em] text-rose-200">UGC STORY · 概念展示</p><div><blockquote className="mt-8 font-serif text-3xl leading-tight sm:text-4xl">“{stories[active].quote}”</blockquote><p className="mt-7 font-semibold">{stories[active].name}</p><p className="mt-1 text-sm text-white/60">{stories[active].context} · {stories[active].duration}</p></div></div><div className="mt-9 flex gap-2">{stories.map((story, index) => <button key={story.id} type="button" aria-label={`查看${story.name}的故事`} aria-pressed={active === index} onClick={() => setActive(index)} className={`h-1.5 rounded-full transition-all ${active === index ? "w-12 bg-rose" : "w-6 bg-white/35"}`} />)}</div></div>
            </div>
          </div></Reveal>
          <div className="grid gap-4">{experts.map((expert, index) => <Reveal key={expert.id} delay={index * .08}><article className="h-full rounded-[2rem] border border-ink/8 bg-white p-7 sm:p-8"><div className="flex items-center gap-4"><span className="grid size-12 place-items-center rounded-full bg-lilac font-serif text-[#a93257]">{expert.initials}</span><div><h3 className="font-semibold">{expert.title}</h3><p className="text-sm text-ink/65">{expert.role}</p></div></div><blockquote className="mt-7 font-serif text-2xl leading-snug text-ink/82">“{expert.quote}”</blockquote><p className="mt-6 text-xs text-ink/65">概念专家角色 · 非真实人物背书</p></article></Reveal>)}</div>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const [planIndex, setPlanIndex] = useState(1);
  const plan = plans[planIndex];
  return (
    <section id="pricing" aria-label="订阅价格" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-[1120px] px-5 sm:px-8">
        <SectionIntro eyebrow="SUBSCRIPTION" title="为坚持，留一点轻松的位置" copy="透明定价、自由调整。先选择适合你的节奏，方案内容再根据测评生成。" />
        <Reveal className="mx-auto mt-14 max-w-4xl"><div className="overflow-hidden rounded-[2.5rem] border border-ink/8 bg-cream shadow-soft">
          <div className="grid lg:grid-cols-[.9fr_1.1fr]">
            <div className="relative overflow-hidden bg-ink p-7 text-white sm:p-10"><div className="absolute -right-16 -top-16 size-56 rounded-full bg-rose/25 blur-3xl" /><div className="relative"><div className="inline-flex rounded-full bg-white/8 p-1" role="group" aria-label="选择订阅周期">{plans.map((item, index) => <button type="button" key={item.id} aria-pressed={planIndex === index} onClick={() => setPlanIndex(index)} className={`min-h-11 rounded-full px-5 text-sm font-semibold transition ${planIndex === index ? "bg-white text-ink" : "text-white/75"}`}>{item.label}</button>)}</div><p className="mt-10 text-sm text-white/70">{plan.badge}</p><div className="mt-2 flex items-end gap-3"><span className="font-serif text-7xl">{formatPrice(plan.price)}</span><span className="mb-3 text-white/65">/ {plan.days} 天</span></div><p className="mt-3 text-sm text-white/70"><span className="line-through">{formatPrice(plan.compareAt)}</span><span className="ml-3 rounded-full bg-[#bd3f66] px-3 py-1 font-semibold text-white">节省 {plan.saving}%</span></p><p className="mt-7 text-lg text-white/80">{plan.note}</p><p className="mt-2 text-sm text-white/65">约 {pricePerDay(plan.price, plan.days)}</p></div></div>
            <div className="p-7 sm:p-10"><p className="text-sm font-semibold tracking-[.16em] text-[#a93257]">EVERY BOX INCLUDES</p><ul className="mt-7 space-y-5">{planBenefits.map((benefit) => <li key={benefit} className="flex gap-3 text-ink/70"><span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-rose/12 text-[#a93257]"><Check size={14} strokeWidth={3} aria-hidden="true" /></span>{benefit}</li>)}</ul><a href="#final-cta" className="mt-9 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-[#bd3f66] px-6 font-semibold text-white shadow-[0_16px_35px_rgba(189,63,102,.22)] transition hover:-translate-y-1 hover:bg-[#a93257]">开始 2 分钟测评 <ArrowRight size={18} aria-hidden="true" /></a><p className="mt-4 text-center text-xs leading-5 text-ink/70">展示价格，不产生真实订单或扣款</p></div>
          </div>
        </div></Reveal>
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState<string | null>(faqs[0].id);
  return (
    <section id="faq" aria-label="常见问题" className="bg-lilac py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <SectionIntro eyebrow="GOOD TO KNOW" title="开始之前，你可能还想知道" copy="关于定制方式、特殊阶段与订阅规则，我们先把重要的事情说清楚。" />
        <div className="mt-12 divide-y divide-ink/10 border-y border-ink/10">{faqs.map((item) => { const expanded = open === item.id; return <div key={item.id}><h3><button type="button" onClick={() => setOpen(expanded ? null : item.id)} aria-expanded={expanded} aria-controls={`answer-${item.id}`} className="flex min-h-20 w-full items-center justify-between gap-5 py-5 text-left text-lg font-semibold sm:text-xl"><span>{item.question}</span><span className={`grid size-10 shrink-0 place-items-center rounded-full border border-ink/10 transition ${expanded ? "rotate-180 bg-ink text-white" : "bg-white"}`}><ChevronDown size={18} aria-hidden="true" /></span></button></h3><div id={`answer-${item.id}`} className={`grid transition-[grid-template-rows] duration-300 ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}><div className="overflow-hidden"><p className="max-w-3xl pb-7 pr-12 leading-8 text-ink/58">{item.answer}</p></div></div></div>; })}</div>
      </div>
    </section>
  );
}

function FinalCTA() {
  const particles = [{ x: "8%", y: "20%", s: 7 }, { x: "17%", y: "74%", s: 4 }, { x: "31%", y: "12%", s: 5 }, { x: "72%", y: "20%", s: 6 }, { x: "88%", y: "66%", s: 8 }, { x: "64%", y: "82%", s: 4 }];
  return (
    <section id="final-cta" aria-label="开始定制" className="relative overflow-hidden bg-rose px-5 py-28 text-center sm:py-36">
      {particles.map((particle, index) => <span key={index} aria-hidden="true" className="absolute animate-pulse rounded-full bg-white/50" style={{ left: particle.x, top: particle.y, width: particle.s, height: particle.s, animationDelay: `${index * .3}s` }} />)}
      <div className="relative mx-auto max-w-4xl text-ink"><p className="text-sm font-semibold tracking-[.24em] text-ink">YOUR NEXT CHAPTER</p><h2 className="mt-5 font-serif text-5xl leading-[1.08] sm:text-6xl lg:text-7xl">下一袋营养，<br />从更了解自己开始</h2><p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-ink">用两分钟回答几个问题，看看此刻的你，更适合怎样的日常支持。</p><a href="/quiz" className="relative mt-9 inline-flex min-h-16 items-center justify-center gap-3 rounded-full bg-white px-8 font-semibold text-ink shadow-2xl transition hover:-translate-y-1">免费测评，获取专属方案 <ArrowRight size={19} aria-hidden="true" /></a><p className="mt-5 text-xs text-ink">体验版不收集健康数据，不产生真实推荐</p></div>
    </section>
  );
}

function VoiceDemo() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<VoiceState>("idle");
  const [seconds, setSeconds] = useState(0);
  useEffect(() => { if (state !== "connecting") return; const id = window.setTimeout(() => setState("active"), 1200); return () => window.clearTimeout(id); }, [state]);
  useEffect(() => { if (state !== "active") { setSeconds(0); return; } const id = window.setInterval(() => setSeconds((value) => value + 1), 1000); return () => window.clearInterval(id); }, [state]);
  function act() { setState((current) => nextVoiceState(current)); }
  const status = state === "idle" ? "准备好后，开始一段模拟对话" : state === "connecting" ? "正在连接 AI 营养顾问…" : `对话中 · 00:${String(seconds).padStart(2, "0")}`;
  return (
    <div className="fixed bottom-5 right-5 z-50 sm:bottom-7 sm:right-7">
      <AnimatePresence>
        {open && <motion.aside initial={{ opacity: 0, y: 18, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: .96 }} className="mb-3 w-[min(355px,calc(100vw-2.5rem))] overflow-hidden rounded-[1.75rem] border border-white/50 bg-ink text-white shadow-[0_28px_90px_rgba(26,26,46,.34)]" aria-label="AI 实时语音演示">
          <div className="flex items-center justify-between border-b border-white/10 p-5"><div><p className="text-xs font-semibold tracking-[.16em] text-rose-200">HER AI · VOICE</p><h2 className="mt-1 font-serif text-2xl">AI 营养顾问</h2></div><button type="button" onClick={() => { setOpen(false); setState("idle"); }} aria-label="关闭语音演示" className="grid size-11 place-items-center rounded-full bg-white/8 hover:bg-white/14"><X size={18} /></button></div>
          <div className="p-5"><p className="rounded-2xl bg-white/7 p-4 text-sm leading-6 text-white/65">“最近入睡有点慢，而且白天工作强度很高，我该优先关注什么？”</p><div className="my-6 flex h-14 items-center justify-center gap-1" aria-hidden="true">{[18, 34, 24, 46, 30, 40, 20, 36, 16].map((height, index) => <motion.span key={index} className="w-1 rounded-full bg-rose" animate={state === "active" ? { height: [10, height, 10] } : { height: 8 }} transition={{ duration: .7, repeat: state === "active" ? Infinity : 0, delay: index * .06 }} />)}</div><p className="text-center text-sm text-white/52" aria-live="polite">{status}</p>{state === "active" && <div className="mt-5 rounded-2xl bg-rose/12 p-4"><p className="text-xs font-semibold text-rose-200">方案提示</p><p className="mt-2 text-sm leading-6 text-white/72">先从作息记录开始；营养方向可关注甘氨酸镁与 B 族维生素。</p></div>}<button type="button" onClick={act} disabled={state === "connecting"} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-rose font-semibold text-white disabled:cursor-wait disabled:opacity-70">{state === "active" ? <><Pause size={17} />结束演示</> : <><Mic size={17} />{state === "connecting" ? "连接中…" : "开始模拟对话"}</>}</button><p className="mt-3 text-center text-[11px] text-white/35">仅为交互演示，不会调用麦克风或 AI 服务</p></div>
        </motion.aside>}
      </AnimatePresence>
      <button type="button" onClick={() => setOpen((value) => !value)} aria-label="AI 语音顾问" aria-expanded={open} className="ml-auto flex min-h-14 items-center gap-3 rounded-full bg-ink px-5 font-semibold text-white shadow-[0_16px_45px_rgba(26,26,46,.3)] transition hover:-translate-y-1"><span className="relative grid size-8 place-items-center rounded-full bg-rose text-ink"><Mic size={16} className="relative" /></span><span className="hidden sm:inline">AI 语音顾问</span></button>
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-ink px-5 pb-10 pt-20 text-white sm:px-8">
      <div className="mx-auto max-w-[1280px]"><div className="grid gap-12 border-b border-white/10 pb-14 lg:grid-cols-[1.3fr_1.7fr]"><div><a href="#hero" className="inline-flex items-center gap-3 font-semibold tracking-[.16em]"><span className="grid size-10 place-items-center rounded-full bg-rose text-ink">她</span> HERSEQUENCE</a><p className="mt-5 max-w-sm leading-7 text-white/70">关注女性每一个阶段的定制营养订阅，让信息更透明，也让坚持更轻松。</p><div className="mt-6 flex gap-3"><span className="grid size-11 place-items-center rounded-full border border-white/20"><Instagram size={18} /></span><span className="grid size-11 place-items-center rounded-full border border-white/20 font-serif">微</span></div></div><div className="grid grid-cols-2 gap-8 sm:grid-cols-3">{footerColumns.map((column) => <div key={column.title}><h2 className="text-sm font-semibold">{column.title}</h2><ul className="mt-5 space-y-3">{column.links.map((link) => <li key={link}><a href="#hero" className="text-sm text-white/70 transition hover:text-white">{link}</a></li>)}</ul></div>)}</div></div><div className="flex flex-col gap-5 pt-8 text-xs leading-6 text-white/65 lg:flex-row lg:items-start lg:justify-between"><p className="max-w-4xl">{compliance}</p><p className="shrink-0">© 2026 HERSEQUENCE · 概念展示</p></div></div>
    </footer>
  );
}

export default function HomeExperience() {
  return (
    <LazyMotion features={domAnimation}>
      <a href="#main-content" className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-full bg-ink px-5 py-3 font-semibold text-white transition focus:translate-y-0">跳到主要内容</a>
      <main id="main-content"><Hero /><PainPoints /><HowItWorks /><Personas /><IngredientLibrary /><Stories /><Pricing /><FAQ /><FinalCTA /></main>
      <Footer />
      <VoiceDemo />
      <span className="sr-only">页面动效支持 prefers-reduced-motion 设置。</span>
    </LazyMotion>
  );
}
