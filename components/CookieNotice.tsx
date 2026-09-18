"use client";

import Link from "next/link";
import { Cookie, X } from "lucide-react";
import { AnimatePresence, LazyMotion, domAnimation, m as motion } from "framer-motion";
import { useState } from "react";
import { cookieNotice } from "@/content";

export default function CookieNotice() {
  const [open, setOpen] = useState(true);

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: .25, ease: [0.16, 1, 0.3, 1] }}
            role="region"
            aria-label={cookieNotice.title}
            className="fixed inset-x-0 top-0 z-[60] lg:inset-x-auto lg:bottom-7 lg:left-7 lg:top-auto lg:max-w-sm"
          >
            <div className="rounded-none border-b border-ink/10 bg-white/96 px-4 py-3 shadow-soft backdrop-blur lg:rounded-3xl lg:border lg:p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 hidden size-9 shrink-0 place-items-center rounded-full bg-lilac text-[#a93257] lg:grid">
                  <Cookie size={17} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{cookieNotice.title}</p>
                  <p className="mt-1 text-xs leading-5 text-ink/55">{cookieNotice.copy}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="min-h-10 rounded-full bg-ink px-4 text-xs font-semibold text-white transition hover:bg-rose"
                    >
                      {cookieNotice.accept}
                    </button>
                    <Link
                      href={cookieNotice.href}
                      className="flex min-h-10 items-center rounded-full border border-ink/12 px-4 text-xs font-semibold text-ink/65 transition hover:border-rose/40 hover:text-ink"
                    >
                      {cookieNotice.more}
                    </Link>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={cookieNotice.dismiss}
                  className="grid size-8 shrink-0 place-items-center rounded-full text-ink/40 transition hover:bg-lilac hover:text-ink"
                >
                  <X size={15} aria-hidden="true" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}
