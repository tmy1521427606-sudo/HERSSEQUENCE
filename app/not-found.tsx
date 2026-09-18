import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { navigation } from "@/content";

export const metadata = {
  title: "页面不存在",
  description: "这个地址没有对应的页面，可以回到首页或直接开始测评。",
};

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="bg-[linear-gradient(135deg,#fff9f8_15%,#f7f1fb_100%)] px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-white text-[#bd3f66] shadow-soft">
            <Compass size={24} aria-hidden="true" />
          </span>
          <p className="mt-8 text-sm font-semibold tracking-[.24em] text-[#bd3f66]">ERROR 404</p>
          <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">这一页没有找到</h1>
          <p className="mx-auto mt-5 max-w-lg leading-8 text-ink/62">
            链接可能已经调整，或者地址输错了。可以从下面的入口继续，也可以直接用右下角的顾问面板提问。
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-ink px-7 font-semibold text-white transition hover:-translate-y-1 hover:bg-rose">
              回到首页 <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link href="/quiz" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-ink/12 bg-white px-7 font-semibold text-ink transition hover:border-rose/40">
              开始测评
            </Link>
          </div>
          <nav aria-label="常用入口" className="mt-10 flex flex-wrap justify-center gap-2">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-sm text-ink/65 transition hover:border-rose/40 hover:text-ink">
                {item.label}
              </Link>
            ))}
            <Link href="/contact" className="rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-sm text-ink/65 transition hover:border-rose/40 hover:text-ink">
              联系我们
            </Link>
          </nav>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
