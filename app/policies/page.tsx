import type { Metadata } from "next";
import Link from "next/link";
import { FileText, ShieldCheck } from "lucide-react";
import { policiesPage } from "@/site-pages";
import PageLayout from "@/components/PageLayout";

export const metadata: Metadata = {
  title: policiesPage.title,
  description: policiesPage.intro,
  alternates: { canonical: "/policies" },
};

export default function PoliciesPage() {
  return (
    <PageLayout
      eyebrow={policiesPage.eyebrow}
      title={policiesPage.title}
      intro={policiesPage.intro}
      crumbs={[{ label: "服务条款" }]}
    >
      <div className="bg-cream py-14 sm:py-20">
        <div className="mx-auto grid max-w-[1120px] gap-10 px-5 sm:px-8 lg:grid-cols-[220px_1fr] lg:gap-14">
          <nav aria-label="条款目录" className="lg:sticky lg:top-28 lg:self-start">
            <p className="flex items-center gap-2 text-xs font-semibold tracking-[.2em] text-ink/45">
              <FileText size={14} aria-hidden="true" />目录
            </p>
            <ul className="mt-4 space-y-1.5">
              {policiesPage.sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="flex min-h-10 items-center rounded-xl px-3 text-sm text-ink/60 transition hover:bg-white hover:text-ink"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-2xl border border-ink/8 bg-white p-4 text-[11px] leading-5 text-ink/50">
              最近更新：2026 年 9 月
              <br />
              条款调整后会在本页标注更新月份。
            </p>
          </nav>

          <div className="space-y-5">
            {policiesPage.sections.map((section) => (
              <section key={section.id} id={section.id} className="rounded-[1.75rem] border border-ink/8 bg-white p-6 sm:p-8">
                <h2 className="font-serif text-2xl sm:text-3xl">{section.title}</h2>
                <div className="mt-5 space-y-4">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="leading-8 text-ink/66">{paragraph}</p>
                  ))}
                </div>
                <ul className="mt-5 space-y-2 rounded-2xl bg-cream p-4 sm:p-5">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3 text-sm leading-7 text-ink/62">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-rose" aria-hidden="true" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            <p className="flex items-start gap-2 rounded-[1.75rem] border border-ink/8 bg-white p-6 text-sm leading-7 text-ink/55">
              <ShieldCheck size={17} className="mt-1 shrink-0 text-rose" aria-hidden="true" />
              <span>
                {policiesPage.footnote}
                <br />
                还可以查看 <Link href="/about" className="underline decoration-ink/20 underline-offset-4 hover:text-ink">品牌与配方方法</Link>、
                <Link href="/contact" className="underline decoration-ink/20 underline-offset-4 hover:text-ink">联系我们</Link>，
                或直接用右下角的站内顾问提问。
              </span>
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
