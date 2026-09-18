import Link from "next/link";
import { Instagram, Leaf, PackageCheck, ShieldCheck, Truck, Undo2 } from "lucide-react";
import {
  compliance,
  footerColumns,
  footerLegal,
  footerPayments,
  guarantees,
  newsletter,
} from "@/content";
import NewsletterForm from "@/components/NewsletterForm";
import AdvisorLauncher from "@/components/AdvisorLauncher";

const guaranteeIcons = { shipping: Truck, returns: Undo2, pause: PackageCheck, support: Leaf } as const;

export default function SiteFooter() {
  return (
    <footer className="bg-ink text-white">
      <div className="border-b border-white/10 px-5 py-10 sm:px-8">
        <dl className="mx-auto grid max-w-[1280px] gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {guarantees.map((item) => {
            const Icon = guaranteeIcons[item.id as keyof typeof guaranteeIcons] ?? ShieldCheck;
            return (
              <div key={item.id} className="flex gap-3">
                <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-full bg-white/8 text-rose">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span>
                  <dt className="text-sm font-semibold">{item.title}</dt>
                  <dd className="mt-1 text-xs leading-5 text-white/55">{item.copy}</dd>
                </span>
              </div>
            );
          })}
        </dl>
      </div>

      <div className="mx-auto max-w-[1280px] px-5 pt-16 pb-14 sm:px-8 lg:pb-36">
        <div className="grid gap-12 border-b border-white/10 pb-14 lg:grid-cols-[1.05fr_1.5fr_1.15fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3 font-semibold tracking-[.16em]">
              <span className="grid size-10 place-items-center rounded-full bg-rose text-ink">她</span> HERSEQUENCE
            </Link>
            <p className="mt-5 max-w-sm leading-7 text-white/70">关注女性每一个阶段的定制营养订阅，让信息更透明，也让坚持更轻松。</p>
            <div className="mt-6 flex gap-3">
              <span className="grid size-11 place-items-center rounded-full border border-white/20"><Instagram size={18} aria-hidden="true" /></span>
              <span className="grid size-11 place-items-center rounded-full border border-white/20 font-serif">微</span>
            </div>
            <div className="mt-4">
              <AdvisorLauncher label="与 AI 顾问聊聊" variant="link" className="text-rose-200" />
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {footerPayments.map((item) => (
                <span key={item} className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] text-white/60">{item}</span>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-white/40">
              <ShieldCheck size={13} aria-hidden="true" /> {footerLegal.security}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {footerColumns.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h2 className="text-sm font-semibold">{column.title}</h2>
                <ul className="mt-5 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm text-white/70 transition hover:text-white">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          <div>
            <h2 className="text-sm font-semibold">{newsletter.title}</h2>
            <p className="mt-4 text-sm leading-6 text-white/60">{newsletter.copy}</p>
            <div className="mt-5">
              <NewsletterForm />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-8 text-xs leading-6 text-white/65 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl space-y-1">
            <p>{compliance}</p>
            <p className="text-white/40">{footerLegal.icp}</p>
          </div>
          <p className="shrink-0">{footerLegal.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
