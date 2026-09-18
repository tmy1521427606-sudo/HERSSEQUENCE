"use client";

import Link from "next/link";
import { ArrowRight, Mic, Pause, Send, ShieldCheck, Sparkles, Trash2, X } from "lucide-react";
import { AnimatePresence, LazyMotion, domAnimation, m as motion, useReducedMotion } from "framer-motion";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { advisorCopy, advisorFallback, advisorQuickReplies, advisorScript } from "@/advisor-content";
import { ADVISOR_OPEN_EVENT } from "@/lib/advisor-bus";
import { createMessage, isAdvisorQueryTooShort, matchAdvisorReply, typingDelay, type AdvisorMessage } from "@/lib/advisor-utils";
import { nextVoiceState, type VoiceState } from "@/lib/site-utils";

type Mode = "text" | "voice";

export default function AdvisorWidget({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(defaultOpen);
  const [mode, setMode] = useState<Mode>("text");
  const [messages, setMessages] = useState<AdvisorMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [seconds, setSeconds] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);

  // 首次打开时给出欢迎语与常见问题。
  useEffect(() => {
    if (!open) return;
    setMessages((current) =>
      current.length > 0
        ? current
        : [createMessage("assistant", advisorCopy.greeting, { followUps: advisorQuickReplies.slice(0, 4) })],
    );
  }, [open]);

  useEffect(() => {
    function onOpen() {
      setOpen(true);
      setMode("text");
    }
    window.addEventListener(ADVISOR_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(ADVISOR_OPEN_EVENT, onOpen);
  }, []);

  // 免点击入口：URL 带 ?advisor=1 时进入页面就直接展开面板。
  // 浮动按钮万一被其它固定元素挡住、或浏览器缓存了旧资源时，仍有一条可用的路。
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("advisor") === "1") {
      setOpen(true);
      setMode("text");
    }
  }, []);

  useEffect(() => {
    if (open && mode === "text") inputRef.current?.focus();
  }, [open, mode]);

  useEffect(() => {
    const node = logRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" });
  }, [messages, typing, reduceMotion]);

  useEffect(() => () => { timers.current.forEach((id) => window.clearTimeout(id)); }, []);

  useEffect(() => {
    if (voiceState !== "connecting") return;
    const id = window.setTimeout(() => setVoiceState("active"), 1200);
    return () => window.clearTimeout(id);
  }, [voiceState]);

  useEffect(() => {
    if (voiceState !== "active") { setSeconds(0); return; }
    const id = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [voiceState]);

  function ask(value: string) {
    const query = value.trim();
    if (!query || typing || isAdvisorQueryTooShort(query)) return;
    setMessages((current) => [...current, createMessage("user", query)]);
    setDraft("");
    const match = matchAdvisorReply(query, advisorScript, advisorFallback);
    setTyping(true);
    const timer = window.setTimeout(() => {
      setTyping(false);
      setMessages((current) => [
        ...current,
        createMessage("assistant", match.reply, { safety: match.safety, followUps: match.followUps }),
      ]);
    }, typingDelay(match.reply));
    timers.current.push(timer);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    ask(draft);
  }

  function clearConversation() {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setTyping(false);
    setMessages([createMessage("assistant", advisorCopy.cleared, { followUps: advisorQuickReplies.slice(0, 3) })]);
  }

  const lastAssistant = [...messages].reverse().find((message) => message.role === "assistant");
  const suggestions = messages.length <= 1 ? advisorQuickReplies : lastAssistant?.followUps ?? advisorQuickReplies.slice(0, 3);
  const voiceStatus =
    voiceState === "idle" ? advisorCopy.voiceIdle : voiceState === "connecting" ? advisorCopy.voiceLoading : `${advisorCopy.voiceActive} · 00:${String(seconds).padStart(2, "0")}`;

  return (
    // m 组件必须在 LazyMotion 内才会执行动画；缺了它，面板会永远停在
    // initial（opacity: 0）——元素在 DOM 里且尺寸正常，但永远看不见，
    // 还会挡住底下的内容。这里必须保留 LazyMotion 包裹。
    <LazyMotion features={domAnimation}>
      <div className="fixed bottom-[5.25rem] right-4 z-[70] flex flex-col items-end sm:right-7 lg:bottom-7">
        <AnimatePresence>
          {open && (
            <motion.aside
              initial={{ opacity: 0, y: 18, scale: .96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: .96 }}
              transition={reduceMotion ? { duration: 0 } : { duration: .28, ease: [0.16, 1, 0.3, 1] }}
              role="dialog"
              aria-modal="false"
              id="advisor-panel"
              aria-label={advisorCopy.title}
              onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}
              className="mb-3 flex max-h-[min(620px,calc(100vh-9.5rem))] w-[min(390px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-[1.75rem] border border-white/50 bg-ink text-white shadow-[0_28px_90px_rgba(26,26,46,.34)] lg:max-h-[min(620px,calc(100vh-6rem))]"
            >
            <div className="flex items-start justify-between gap-3 border-b border-white/10 p-5">
              <div>
                <p className="text-xs font-semibold tracking-[.16em] text-rose-200">{advisorCopy.eyebrow}</p>
                <h2 className="mt-1 font-serif text-2xl">{advisorCopy.title}</h2>
                <p className="mt-1 text-xs text-white/45">{advisorCopy.subtitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearConversation}
                  aria-label={advisorCopy.clear}
                  className="grid size-11 place-items-center rounded-full bg-white/8 transition hover:bg-white/14"
                >
                  <Trash2 size={17} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={advisorCopy.close}
                  className="grid size-11 place-items-center rounded-full bg-white/8 transition hover:bg-white/14"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="flex gap-1 border-b border-white/10 px-4 py-2" role="tablist" aria-label="交互方式">
              {([["text", "文字提问"], ["voice", "语音交互"]] as [Mode, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={mode === value}
                  onClick={() => setMode(value)}
                  className={`min-h-11 flex-1 rounded-full px-4 text-sm font-semibold transition ${mode === value ? "bg-white text-ink" : "text-white/60 hover:text-white"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {mode === "text" ? (
              <>
                <div ref={logRef} role="log" aria-live="polite" aria-relevant="additions" aria-label="顾问对话记录" className="flex-1 space-y-3 overflow-y-auto p-4">
                  {messages.map((message) => (
                    <div key={message.id} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
                      <div className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-rose text-ink" : "bg-white/8 text-white/78"}`}>
                        {message.role === "assistant" && <p className="mb-1 text-[11px] font-semibold tracking-[.12em] text-rose-200">顾问</p>}
                        <p>{message.text}</p>
                        {message.safety && (
                          <p className="mt-2 flex items-start gap-2 rounded-xl bg-rose/12 px-3 py-2 text-xs leading-5 text-rose-200">
                            <ShieldCheck size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                            {advisorCopy.safetyBadge}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {typing && (
                    <div className="flex items-center gap-2 text-xs text-white/45" aria-live="polite">
                      <span className="flex gap-1" aria-hidden="true">
                        {[0, 1, 2].map((index) => (
                          <motion.span
                            key={index}
                            className="size-1.5 rounded-full bg-rose"
                            animate={reduceMotion ? { opacity: .6 } : { opacity: [.3, 1, .3] }}
                            transition={{ duration: 1, repeat: reduceMotion ? 0 : Infinity, delay: index * .15 }}
                          />
                        ))}
                      </span>
                      {advisorCopy.typing}…
                    </div>
                  )}
                </div>

                <div className="border-t border-white/10 px-4 py-3">
                  <p className="text-[11px] font-semibold tracking-[.12em] text-white/35">{advisorCopy.quickLabel}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {suggestions.slice(0, 4).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => ask(item)}
                        className="min-h-9 rounded-full border border-white/15 bg-white/6 px-3 text-xs text-white/70 transition hover:border-rose/40 hover:text-white"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={submit} className="border-t border-white/10 p-4">
                  <label htmlFor="advisor-input" className="sr-only">{advisorCopy.inputLabel}</label>
                  <div className="flex items-center gap-2">
                    <input
                      id="advisor-input"
                      ref={inputRef}
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder={advisorCopy.inputPlaceholder}
                      autoComplete="off"
                      className="min-h-12 flex-1 rounded-full border border-white/12 bg-white/6 px-4 text-sm text-white placeholder:text-white/35 focus:border-rose focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={typing || isAdvisorQueryTooShort(draft)}
                      className="grid size-12 shrink-0 place-items-center rounded-full bg-rose font-semibold text-ink transition hover:bg-[#f07d9b] disabled:cursor-not-allowed disabled:opacity-45"
                      aria-label={advisorCopy.send}
                    >
                      <Send size={17} aria-hidden="true" />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <Link href="/quiz" className="inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-rose-200 transition hover:text-white">
                      {advisorCopy.assessmentCta} <ArrowRight size={13} aria-hidden="true" />
                    </Link>
                    <p className="text-right text-[10px] leading-4 text-white/30">{advisorCopy.note}</p>
                  </div>
                </form>
              </>
            ) : (
              <div className="p-5">
                <p className="rounded-2xl bg-white/7 p-4 text-sm leading-6 text-white/65">“最近入睡有点慢，而且白天工作强度很高，我该优先关注什么？”</p>
                <div className="my-6 flex h-14 items-center justify-center gap-1" aria-hidden="true">
                  {[18, 34, 24, 46, 30, 40, 20, 36, 16].map((height, index) => (
                    <motion.span
                      key={index}
                      className="w-1 rounded-full bg-rose"
                      animate={voiceState === "active" && !reduceMotion ? { height: [10, height, 10] } : { height: 8 }}
                      transition={{ duration: .7, repeat: voiceState === "active" && !reduceMotion ? Infinity : 0, delay: index * .06 }}
                    />
                  ))}
                </div>
                <p className="text-center text-sm text-white/52" aria-live="polite">{voiceStatus}</p>
                {voiceState === "active" && (
                  <div className="mt-5 rounded-2xl bg-rose/12 p-4">
                    <p className="text-xs font-semibold text-rose-200">方案提示</p>
                    <p className="mt-2 text-sm leading-6 text-white/72">先从作息记录开始；营养方向可关注甘氨酸镁与 B 族维生素。</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setVoiceState((current) => nextVoiceState(current))}
                  disabled={voiceState === "connecting"}
                  className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-rose font-semibold text-ink transition hover:bg-[#f07d9b] disabled:cursor-wait disabled:opacity-70"
                >
                  {voiceState === "active" ? <><Pause size={17} aria-hidden="true" />{advisorCopy.voiceEnd}</> : <><Mic size={17} aria-hidden="true" />{voiceState === "connecting" ? advisorCopy.voiceLoading : advisorCopy.voiceStart}</>}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("text")}
                  className="mt-3 flex min-h-11 w-full items-center justify-center rounded-full border border-white/15 text-sm font-semibold text-white/70 transition hover:border-rose/40 hover:text-white"
                >
                  {advisorCopy.switchToText}
                </button>
                <p className="mt-3 text-center text-[11px] text-white/35">{advisorCopy.voiceNote}</p>
              </div>
            )}
          </motion.aside>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? advisorCopy.close : advisorCopy.open}
          aria-expanded={open}
          aria-controls="advisor-panel"
          data-advisor-trigger="true"
          className="relative flex min-h-14 items-center gap-3 rounded-full bg-ink px-5 font-semibold text-white shadow-[0_16px_45px_rgba(26,26,46,.3)] transition hover:-translate-y-1"
        >
          <span className="relative grid size-8 place-items-center rounded-full bg-rose text-ink">
            <Sparkles size={16} aria-hidden="true" />
            {!open && (
              <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-ink bg-[#3f8f6b]" />
            )}
          </span>
          <span className="hidden sm:inline">{advisorCopy.open}</span>
        </button>
        <span className="sr-only">{advisorCopy.triggerHint}</span>
      </div>
    </LazyMotion>
  );
}
