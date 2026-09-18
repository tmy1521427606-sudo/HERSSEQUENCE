import Link from "next/link";
import { ChevronRight } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export type Crumb = { label: string; href?: string };

export default function PageLayout({
  eyebrow,
  title,
  intro,
  crumbs,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  crumbs: Crumb[];
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main>
        <div className="border-b border-ink/8 bg-[linear-gradient(135deg,#fff9f8_15%,#f7f1fb_100%)]">
          <div className="mx-auto max-w-[1120px] px-5 py-12 sm:px-8 sm:py-16">
            <nav aria-label="面包屑" className="flex flex-wrap items-center gap-1.5 text-xs text-ink/45">
              <Link href="/" className="transition hover:text-ink">首页</Link>
              {crumbs.map((crumb) => (
                <span key={crumb.label} className="flex items-center gap-1.5">
                  <ChevronRight size={13} aria-hidden="true" />
                  {crumb.href ? (
                    <Link href={crumb.href} className="transition hover:text-ink">{crumb.label}</Link>
                  ) : (
                    <span aria-current="page" className="text-ink/70">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
            <p className="mt-8 text-sm font-semibold tracking-[.24em] text-[#bd3f66]">{eyebrow}</p>
            <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-[1.12] text-ink sm:text-5xl lg:text-6xl">{title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-ink/62 sm:text-lg">{intro}</p>
          </div>
        </div>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
