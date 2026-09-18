import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, Mail, MessageCircle } from "lucide-react";
import { contactPage } from "@/site-pages";
import PageLayout from "@/components/PageLayout";
import ContactForm from "@/components/ContactForm";
import AdvisorLauncher from "@/components/AdvisorLauncher";

export const metadata: Metadata = {
  title: contactPage.title,
  description: contactPage.intro,
  alternates: { canonical: "/contact" },
};

const channelIcons = { advisor: MessageCircle, email: Mail, hours: Clock } as const;

export default function ContactPage() {
  return (
    <PageLayout
      eyebrow={contactPage.eyebrow}
      title={contactPage.title}
      intro={contactPage.intro}
      crumbs={[{ label: "联系我们" }]}
    >
      <div className="bg-cream py-14 sm:py-20">
        <div className="mx-auto max-w-[1120px] px-5 sm:px-8">
          <dl className="grid gap-4 sm:grid-cols-3">
            {contactPage.channels.map((channel) => {
              const Icon = channelIcons[channel.id as keyof typeof channelIcons] ?? MessageCircle;
              return (
                <div key={channel.id} className="rounded-[1.75rem] border border-ink/8 bg-white p-6">
                  <span className="grid size-11 place-items-center rounded-full bg-lilac text-[#a93257]">
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <dt className="mt-5 text-sm font-semibold text-ink/60">{channel.label}</dt>
                  <dd className="mt-1 text-lg font-semibold text-ink">{channel.value}</dd>
                  <dd className="mt-2 text-sm leading-6 text-ink/55">{channel.detail}</dd>
                  {channel.id === "advisor" && (
                    <dd className="mt-4">
                      <AdvisorLauncher label="现在打开顾问面板" variant="outline" />
                    </dd>
                  )}
                </div>
              );
            })}
          </dl>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
            <ContactForm />
            <div className="space-y-4">
              <div className="rounded-[1.75rem] border border-ink/8 bg-ink p-6 text-white sm:p-8">
                <p className="text-xs font-semibold tracking-[.2em] text-rose-200">FASTEST ROUTE</p>
                <h2 className="mt-3 font-serif text-2xl">先问站内顾问</h2>
                <p className="mt-3 text-sm leading-7 text-white/70">
                  营养方向、成分来源、剂量标注、订阅规则与配送时效都有预设回答；涉及孕产、用药与过敏时会先提示专业确认。
                </p>
                <p className="mt-5 rounded-2xl bg-white/8 p-4 text-xs leading-6 text-white/55">
                  顾问面板在页面右下角，支持文字提问与语音交互两种模式；点下面的按钮可以直接打开。
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <AdvisorLauncher label="打开顾问面板" variant="solid" />
                  <Link href="/quiz" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/20 px-6 text-sm font-semibold text-white/80 transition hover:border-rose/45 hover:text-white">
                    也可以直接开始测评 <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </div>
              <div className="rounded-[1.75rem] border border-ink/8 bg-white p-6">
                <h2 className="font-semibold text-ink">售后与条款</h2>
                <p className="mt-2 text-sm leading-7 text-ink/60">
                  退换、配送范围与订阅调整规则都写在服务条款里，下单前建议先看一眼。
                </p>
                <Link href="/policies" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#a93257] transition hover:text-ink">
                  查看服务条款 <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
