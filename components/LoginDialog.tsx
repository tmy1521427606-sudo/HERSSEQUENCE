"use client";

import { CheckCircle2, Eye, EyeOff, LockKeyhole, Sparkles, X } from "lucide-react";
import { AnimatePresence, LazyMotion, domAnimation, m as motion } from "framer-motion";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { authCopy, demoAccount } from "@/auth-content";
import { useAuth, type LoginMode } from "@/components/auth-context";

export default function LoginDialog({ open, mode, onClose }: { open: boolean; mode: LoginMode; onClose: () => void }) {
  const { signIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setUsername("");
    setPassword("");
    setShowPassword(false);
    setError("");
    setDone(false);
    const id = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>("button, input, a[href]")).filter((node) => !node.hasAttribute("disabled"));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    }
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open, onClose]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = signIn(username, password);
    if (!result.ok) {
      setError(result.error);
      inputRef.current?.focus();
      return;
    }
    setError("");
    setDone(true);
    timer.current = window.setTimeout(() => onClose(), 800);
  }

  function fillDemo() {
    setUsername(demoAccount.username);
    setPassword(demoAccount.password);
    setError("");
  }

  const title = mode === "reminder" ? authCopy.reminderTitle : authCopy.title;
  const copy = mode === "reminder" ? authCopy.reminderCopy : authCopy.copy;

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-ink/45 p-4 backdrop-blur-sm"
            onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
          >
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="login-dialog-title"
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="my-8 w-full max-w-md rounded-[1.75rem] border border-white/60 bg-white p-6 shadow-[0_30px_90px_rgba(26,26,46,.35)] sm:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold tracking-[.22em] text-rose">{authCopy.eyebrow}</p>
                  <h2 id="login-dialog-title" className="mt-3 font-serif text-3xl leading-tight text-ink">{title}</h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={authCopy.close}
                  className="grid size-10 shrink-0 place-items-center rounded-full border border-ink/10 text-ink/45 transition hover:border-rose/40 hover:text-ink"
                >
                  <X size={17} aria-hidden="true" />
                </button>
              </div>

              <p className="mt-3 text-sm leading-7 text-ink/60">{copy}</p>

              {done ? (
                <div className="mt-7 flex items-center gap-3 rounded-2xl border border-[#3f8f6b]/25 bg-[#f2faf6] p-4" role="status">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#3f8f6b]/12 text-[#2f7355]">
                    <CheckCircle2 size={18} aria-hidden="true" />
                  </span>
                  <p className="text-sm font-semibold text-ink">{authCopy.signInToast}</p>
                </div>
              ) : (
                <form onSubmit={submit} noValidate className="mt-6">
                  <label htmlFor="login-username" className="block">
                    <span className="text-sm font-semibold text-ink/70">{authCopy.usernameLabel}</span>
                    <input
                      id="login-username"
                      name="username"
                      ref={inputRef}
                      value={username}
                      onChange={(event) => { setUsername(event.target.value); setError(""); }}
                      placeholder={authCopy.usernamePlaceholder}
                      autoComplete="username"
                      aria-invalid={Boolean(error)}
                      className="mt-2 min-h-12 w-full rounded-2xl border border-ink/12 bg-cream px-4 text-ink placeholder:text-ink/35 focus:border-rose focus:outline-none"
                    />
                  </label>

                  <label htmlFor="login-password" className="mt-4 block">
                    <span className="text-sm font-semibold text-ink/70">{authCopy.passwordLabel}</span>
                    <span className="relative mt-2 block">
                      <input
                        id="login-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) => { setPassword(event.target.value); setError(""); }}
                        placeholder={authCopy.passwordPlaceholder}
                        autoComplete="current-password"
                        aria-invalid={Boolean(error)}
                        className="min-h-12 w-full rounded-2xl border border-ink/12 bg-cream pl-4 pr-12 text-ink placeholder:text-ink/35 focus:border-rose focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        aria-label={showPassword ? authCopy.hidePassword : authCopy.showPassword}
                        aria-pressed={showPassword}
                        className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-ink/40 transition hover:bg-lilac hover:text-ink"
                      >
                        {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                      </button>
                    </span>
                  </label>

                  <p className="mt-3 min-h-5 text-xs font-medium text-[#a93257]" aria-live="polite">{error}</p>

                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <button type="submit" className="group inline-flex min-h-12 items-center gap-2 rounded-full bg-ink px-7 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-rose">
                      <LockKeyhole size={16} aria-hidden="true" /> {authCopy.submit}
                    </button>
                    {mode === "reminder" && (
                      <button type="button" onClick={onClose} className="inline-flex min-h-12 items-center rounded-full px-4 font-semibold text-ink/55 transition hover:text-ink">
                        {authCopy.cancel}
                      </button>
                    )}
                  </div>

                  <div className="mt-5 flex items-start gap-3 rounded-2xl border border-dashed border-rose/35 bg-[#fff8fa] p-4">
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-rose/15 text-[#a93257]">
                      <Sparkles size={15} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">{authCopy.demoLabel}</p>
                      <p className="mt-0.5 text-xs leading-5 text-ink/55">{authCopy.demoValue}</p>
                      <button type="button" onClick={fillDemo} className="mt-2 min-h-9 rounded-full border border-rose/40 bg-white px-3 text-xs font-semibold text-[#a93257] transition hover:bg-rose/10">
                        {authCopy.demoFill}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              <p className="mt-5 text-[11px] leading-5 text-ink/45">
                {authCopy.sessionNote}
                <br />
                {authCopy.registerNote}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}
