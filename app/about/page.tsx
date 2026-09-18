import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, FlaskConical, ShieldCheck } from "lucide-react";
import { aboutPage } from "@/site-pages";
import PageLayout from "@/components/PageLayout";

export const metadata: Metadata = {
  title: aboutPage.title,
  description: aboutPage.intro,
  alternates: { canonical: "/about" },
};

const levelStyles: Record<string, { border: string; badge: string; dot: string }> = {
  green: { border: "border-[#3f8f6b]/25", badge: "bg-[#3f8f6b]/12 text-[#2f7355]", dot: "#3F8F6B" },
  yellow: { border: "border-[#c98a2b]/30", badge: "bg-[#c98a2b]/14 text-[#9a6720]", dot: "#C98A2B" },
  red: { border: "border-[#c0455f]/25", badge: "bg-[#c0455f]/12 text-[#a03248]", dot: "#C0455F" },
};

export default function AboutPage() {
  return (
    <PageLayout
      eyebrow={aboutPage.eyebrow}
      title={aboutPage.title}
      intro={aboutPage.intro}
      crumbs={[{ label: "关于她序" }]}
    >
      <section id="method" aria-labelledby="method-title" className="bg-cream py-16 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-5 sm:px-8">
          <p className="text-sm font-semibold tracking-[.24em] text-[#bd3f66]">METHOD</p>
          <h2 id="method-title" className="mt-4 font-serif text-3xl sm:text-4xl">{aboutPage.method.title}</h2>
          <p className="mt-4 max-w-2xl leading-8 text-ink/62">{aboutPage.method.copy}</p>
          <ol className="mt-12 grid gap-4 sm:grid-cols-2">
            {aboutPage.method.steps.map((step) => (
              <li key={step.id} className="rounded-[1.75rem] border border-ink/8 bg-white p-6 sm:p-8">
                <span className="font-serif text-4xl text-ink/20">{step.number}</span>
                <h3 className="mt-4 font-serif text-2xl">{step.title}</h3>
                <p className="mt-3 leading-7 text-ink/62">{step.copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="sourcing" aria-labelledby="sourcing-title" className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-5 sm:px-8">
          <p className="flex items-center gap-2 text-sm font-semibold tracking-[.24em] text-[#bd3f66]">
            <FlaskConical size={16} aria-hidden="true" />SOURCING
          </p>
          <h2 id="sourcing-title" className="mt-4 font-serif text-3xl sm:text-4xl">{aboutPage.sourcing.title}</h2>
          <p className="mt-4 max-w-2xl leading-8 text-ink/62">{aboutPage.sourcing.copy}</p>
          <dl className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {aboutPage.sourcing.items.map((item) => (
              <div key={item.id} className="rounded-[1.75rem] border border-ink/8 bg-cream p-6">
                <dt className="font-semibold text-ink">{item.title}</dt>
                <dd className="mt-3 text-sm leading-7 text-ink/62">{item.copy}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="safety" aria-labelledby="safety-title" className="bg-lilac py-16 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-5 sm:px-8">
          <p className="flex items-center gap-2 text-sm font-semibold tracking-[.24em] text-[#bd3f66]">
            <ShieldCheck size={16} aria-hidden="true" />SAFETY ROUTING
          </p>
          <h2 id="safety-title" className="mt-4 font-serif text-3xl sm:text-4xl">{aboutPage.safetyModel.title}</h2>
          <p className="mt-4 max-w-2xl leading-8 text-ink/62">{aboutPage.safetyModel.copy}</p>
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {aboutPage.safetyModel.levels.map((level) => {
              const style = levelStyles[level.id] ?? levelStyles.green;
              return (
                <article key={level.id} className={`rounded-[1.75rem] border bg-white p-6 sm:p-8 ${style.border}`}>
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${style.badge}`}>
                    <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: style.dot }} />
                    {level.title}
                  </span>
                  <p className="mt-5 leading-7 text-ink/65">{level.copy}</p>
                </article>
              );
            })}
          </div>
          <div className="mt-10 rounded-[1.75rem] border border-ink/8 bg-white p-6 sm:p-8">
            <h3 className="font-semibold text-ink">{aboutPage.review.title}</h3>
            <p className="mt-2 leading-7 text-ink/62">{aboutPage.review.copy}</p>
            <ul className="mt-5 space-y-3">
              {aboutPage.review.points.map((point) => (
                <li key={point} className="flex gap-3 text-sm leading-7 text-ink/62">
                  <span className="mt-1.5 grid size-5 shrink-0 place-items-center rounded-full bg-rose/12 text-[#a93257]">
                    <Check size={12} strokeWidth={3} aria-hidden="true" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section aria-label="开始测评" className="bg-cream py-16 sm:py-20">
        <div className="mx-auto flex max-w-[1120px] flex-col items-start gap-6 px-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl">{aboutPage.cta.title}</h2>
            <p className="mt-3 max-w-xl leading-8 text-ink/62">{aboutPage.cta.copy}</p>
          </div>
          <Link
            href="/quiz"
            className="inline-flex min-h-14 shrink-0 items-center gap-3 rounded-full bg-[#bd3f66] px-7 font-semibold text-white shadow-[0_16px_40px_rgba(189,63,102,.25)] transition hover:-translate-y-1 hover:bg-[#a93257]"
          >
            {aboutPage.cta.button} <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </PageLayout>
  );
}
