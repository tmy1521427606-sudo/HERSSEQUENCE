"use client";

import Link from "next/link";
import { ArrowRight, Check, LogOut, Menu, PackageCheck, ShieldCheck, ShoppingBag, Truck, User, X } from "lucide-react";
import { AnimatePresence, LazyMotion, domAnimation, m as motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  accountCopy,
  accountMenu,
  announcement,
  cartPanel,
  cartSummary,
  freeShipping,
  navigation,
} from "@/content";
import { authCopy } from "@/auth-content";
import { useAuth } from "@/components/auth-context";
import { formatPrice } from "@/lib/site-utils";

export default function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const { user, openLogin, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<"cart" | "account" | null>(null);
  const [noticeOpen, setNoticeOpen] = useState(true);
  const clusterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!panel) return;
    function onPointerDown(event: Event) {
      if (clusterRef.current && !clusterRef.current.contains(event.target as Node)) setPanel(null);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setPanel(null);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [panel]);

  const subtotal = 0;
  const remaining = Math.max(0, freeShipping.threshold - subtotal);
  const progress = Math.min(100, Math.round((subtotal / freeShipping.threshold) * 100));

  return (
    <LazyMotion features={domAnimation}>
      <header className={overlay ? "absolute inset-x-0 top-0 z-40" : "sticky top-0 z-40"}>
        {noticeOpen && (
          <div className="relative bg-ink text-white">
            <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-center gap-x-6 gap-y-1 px-10 py-2.5 text-[11px] font-medium tracking-[.06em] sm:text-xs">
              {announcement.items.map((item, index) => (
                <span key={item} className={index > 0 ? "hidden sm:inline" : ""}>{item}</span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setNoticeOpen(false)}
              aria-label={announcement.dismiss}
              className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>
        )}
        <nav
          className={`mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-5 py-4 sm:px-8 lg:px-12 ${
            overlay ? "" : "border-b border-ink/8 bg-cream/92 backdrop-blur"
          }`}
          aria-label="主要导航"
        >
          <Link href="/" className="group flex min-h-11 shrink-0 items-center gap-3 font-semibold tracking-[0.16em] text-ink">
            <span className="grid size-9 place-items-center rounded-full bg-ink text-xs text-white transition-transform group-hover:rotate-6">她</span>
            <span className="hidden sm:inline">HERSEQUENCE</span>
          </Link>
          <div className="hidden items-center gap-7 xl:flex">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm font-medium text-ink/68 transition-colors hover:text-ink">{item.label}</Link>
            ))}
          </div>
          <div ref={clusterRef} className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPanel(panel === "account" ? null : "account")}
              aria-expanded={panel === "account"}
              aria-controls="account-panel"
              aria-label={user ? authCopy.accountMenuLabelSignedIn : authCopy.accountMenuLabel}
              className="relative grid size-11 place-items-center rounded-full border border-ink/10 bg-white/70 text-sm font-semibold text-ink transition hover:border-rose/40"
            >
              {user ? (
                <>
                  <span aria-hidden="true">{user.initial}</span>
                  <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-white bg-[#3f8f6b]" />
                </>
              ) : (
                <User size={18} aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setPanel(panel === "cart" ? null : "cart")}
              aria-expanded={panel === "cart"}
              aria-controls="cart-panel"
              aria-label={`订阅袋，${cartPanel.count} 件`}
              className="relative grid size-11 place-items-center rounded-full border border-ink/10 bg-white/70 transition hover:border-rose/40"
            >
              <ShoppingBag size={18} aria-hidden="true" />
              {cartPanel.count > 0 && (
                <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-rose text-[10px] font-bold text-white">{cartPanel.count}</span>
              )}
            </button>
            <Link href="/quiz" className="hidden min-h-11 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-rose lg:flex">
              获取专属方案 <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <button
              type="button"
              className="grid size-11 place-items-center rounded-full border border-ink/10 bg-white/70 xl:hidden"
              aria-label={open ? "关闭菜单" : "打开菜单"}
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>

            <AnimatePresence>
              {panel === "cart" && (
                <motion.div
                  id="cart-panel"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute right-0 top-full z-50 mt-3 w-[min(340px,calc(100vw-2.5rem))] rounded-3xl border border-ink/10 bg-white p-5 shadow-soft"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-ink">{cartPanel.title}</h2>
                    <span className="rounded-full bg-lilac px-3 py-1 text-xs font-semibold text-ink/55">{cartPanel.count} 件</span>
                  </div>
                  <div className="mt-4 rounded-2xl border border-dashed border-ink/15 bg-cream p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-ink/75"><PackageCheck size={16} className="text-rose" aria-hidden="true" />{cartPanel.empty}</p>
                    <p className="mt-1.5 text-xs leading-5 text-ink/50">{cartPanel.emptyHint}</p>
                  </div>
                  <div className="mt-4" aria-live="polite">
                    <div className="flex items-center justify-between text-xs font-semibold text-ink/60">
                      <span className="flex items-center gap-1.5"><Truck size={14} className="text-rose" aria-hidden="true" />{freeShipping.label}</span>
                      <span>{formatPrice(subtotal)} / {formatPrice(freeShipping.threshold)}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-lilac">
                      <div className="h-full rounded-full bg-rose transition-[width] duration-500" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="mt-2 text-[11px] leading-5 text-ink/45">
                      {remaining === 0 ? freeShipping.done : `${freeShipping.prefix} ${formatPrice(remaining)} ${freeShipping.suffix}`}
                      {cartPanel.count === 0 ? ` · ${freeShipping.empty}` : ""}
                    </p>
                  </div>
                  <div className="mt-4 space-y-1.5 rounded-2xl bg-cream px-4 py-3 text-sm">
                    <div className="flex items-center justify-between text-ink/60"><span>{cartSummary.subtotalLabel}</span><span className="font-semibold text-ink">{formatPrice(subtotal)}</span></div>
                    <div className="flex items-center justify-between text-xs text-ink/45"><span>运费</span><span>{remaining === 0 ? freeShipping.done : freeShipping.label}</span></div>
                  </div>
                  <button
                    type="button"
                    disabled
                    className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-ink/12 text-sm font-semibold text-ink/40"
                  >
                    <ShieldCheck size={15} aria-hidden="true" /> {cartSummary.checkoutBlocked}
                  </button>
                  <Link href="/quiz" className="mt-2 flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white transition hover:bg-rose">
                    {cartPanel.cta} <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                  <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] leading-5 text-ink/40">
                    <Check size={13} className="text-rose" aria-hidden="true" />{cartSummary.secure} · {cartPanel.note}
                  </p>
                </motion.div>
              )}
              {panel === "account" && (
                <motion.div
                  id="account-panel"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute right-0 top-full z-50 mt-3 w-[min(340px,calc(100vw-2.5rem))] rounded-3xl border border-ink/10 bg-white p-3 shadow-soft"
                >
                  <div className="mb-2 flex items-center gap-3 rounded-2xl bg-cream px-4 py-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-rose/15 text-sm font-semibold text-[#a93257]">
                      {user ? user.initial : "她"}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {user ? `${authCopy.signedIn} · ${user.displayName}` : accountCopy.guest}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-5 text-ink/50">
                        {user ? authCopy.savedBadge : accountCopy.guestHint}
                      </span>
                    </span>
                  </div>
                  {accountMenu.map((item) => (
                    <Link key={item.id} href={item.href} className="flex min-h-14 items-center justify-between gap-3 rounded-2xl px-4 transition hover:bg-lilac">
                      <span>
                        <span className="block text-sm font-semibold text-ink">{item.label}</span>
                        <span className="mt-0.5 block text-xs text-ink/50">{item.copy}</span>
                      </span>
                      <ArrowRight size={15} className="shrink-0 text-ink/35" aria-hidden="true" />
                    </Link>
                  ))}
                  {user ? (
                    <div className="mt-2 border-t border-ink/8 px-2 pt-3">
                      <button
                        type="button"
                        onClick={() => { signOut(); setPanel(null); }}
                        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-ink/12 text-sm font-semibold text-ink/65 transition hover:border-rose/40 hover:text-ink"
                      >
                        <LogOut size={15} aria-hidden="true" /> {authCopy.signOut}
                      </button>
                      <p className="mt-2 text-center text-[11px] leading-5 text-ink/40">{authCopy.sessionNote}</p>
                    </div>
                  ) : (
                    <div className="mt-2 border-t border-ink/8 px-2 pt-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setPanel(null); openLogin("login"); }}
                          className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white transition hover:bg-rose"
                        >
                          {accountCopy.signIn}
                        </button>
                        <span className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-ink/8 text-sm font-semibold text-ink/40">
                          {accountCopy.signUp}
                        </span>
                      </div>
                      <p className="mt-2 text-center text-[11px] leading-5 text-ink/40">{accountCopy.signInHint}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mx-5 rounded-3xl border border-ink/10 bg-white p-4 shadow-soft xl:hidden"
            >
              {navigation.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="flex min-h-12 items-center rounded-2xl px-4 font-medium hover:bg-lilac">{item.label}</Link>
              ))}
              <Link href="/policies" onClick={() => setOpen(false)} className="flex min-h-12 items-center rounded-2xl px-4 font-medium hover:bg-lilac">服务条款</Link>
              <Link href="/contact" onClick={() => setOpen(false)} className="flex min-h-12 items-center rounded-2xl px-4 font-medium hover:bg-lilac">联系我们</Link>
              <button
                type="button"
                onClick={() => { setOpen(false); if (!user) openLogin("login"); else signOut(); }}
                className="flex min-h-12 w-full items-center rounded-2xl px-4 text-left font-medium hover:bg-lilac"
              >
                {user ? `${authCopy.signOut}（${user.displayName}）` : accountCopy.signIn}
              </button>
              <Link href="/quiz" onClick={() => setOpen(false)} className="mt-2 flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-4 font-semibold text-white">
                获取专属方案 <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </LazyMotion>
  );
}
