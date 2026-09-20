"use client";

import Link from "next/link";
import { ArrowRight, Mic, Pause, Send, ShieldCheck, Sparkles, Trash2, X } from "lucide-react";
import { AnimatePresence, LazyMotion, domAnimation, m as motion, useReducedMotion } from "framer-motion";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { advisorCopy, advisorFallback, advisorQuickReplies, advisorScript } from "@/advisor-content";
import { ADVISOR_OPEN_EVENT } from "@/lib/advisor-bus";
import { createMessage, isAdvisorQueryTooShort, matchAdvisorReply, typingDelay, type AdvisorMessage } from "@/lib/advisor-utils";
import { voiceDisplayState } from "@/lib/site-utils";
import { useVoiceChat } from "@/lib/rtc/useVoiceChat";
import { isVoiceBackendConfigured } from "@/lib/rtc/voice-api";

type Mode = "text" | "voice";

/** 音量条的静态形状：真实音量只缩放它的幅度，不改变整体轮廓。 */
const LEVEL_BARS = [18, 34, 24, 46, 30, 40, 20, 36, 16];

function formatClock(total: number): string {
  const minutes = Math.floor(total / 60);
  return `${String(minutes).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export default function AdvisorWidget({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(defaultOpen);
  const [mode, setMode] = useState<Mode>("text");
  const [messages, setMessages] = useState<AdvisorMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);

  // 语音走真实的火山 RTC 会话：状态、计时、音量、字幕全部由 hook 驱动，
  // 面板只负责展示与转发用户操作。
  const voice = useVoiceChat();
  const voiceState = voiceDisplayState(voice.status, isVoiceBackendConfigured());

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

  // 离开语音模式或关掉面板时必须结束会话：否则麦克风会一直处于采集状态，
  // 浏览器标签页上的录音指示灯不会灭，用户会以为还在被听。
  useEffect(() => {
    if (!open || mode !== "voice") void voice.stop();
    // voice.stop 是稳定的 useCallback，无需进依赖数组；进了反而会在每次状态变化时反复触发。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

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

  const voiceStageCopy = {
    idle: advisorCopy.voiceIdle,
    listening: advisorCopy.voiceStageListening,
    thinking: advisorCopy.voiceStageThinking,
    speaking: advisorCopy.voiceStageSpeaking,
  }[voice.stage];

  const voiceStatus = (() => {
    if (voiceState === "unsupported") return advisorCopy.voiceUnsupported;
    if (voiceState === "connecting") return advisorCopy.voiceLoading;
    if (voiceState === "error") return voice.error ?? advisorCopy.voiceIdle;
    if (voiceState === "active") return `${voiceStageCopy} · ${formatClock(voice.seconds)}`;
    return advisorCopy.voiceIdle;
  })();

  // 音量条由真实麦克风电平驱动：没在会话中时收平，避免看起来像在工作。
  const barHeight = (index: number) => {
    if (voiceState !== "active") return 8;
    return Math.max(8, Math.round((LEVEL_BARS[index] ?? 20) * (0.35 + voice.level * 1.5)));
  };

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
              <>
                {/* 真实字幕流：火山通过房间二进制消息回传，由 useVoiceChat 解析成逐句文本。 */}
                <div
                  role="log"
                  aria-live="polite"
                  aria-relevant="additions"
                  aria-label="语音对话记录"
                  className="flex-1 space-y-3 overflow-y-auto p-4"
                >
                  {voice.subtitles.length === 0 ? (
                    <p className="rounded-2xl bg-white/7 p-4 text-sm leading-6 text-white/50">{advisorCopy.voiceEmptyLog}</p>
                  ) : (
                    voice.subtitles.map((line) => (
                      <div key={line.id} className={line.role === "user" ? "flex justify-end" : "flex justify-start"}>
                        <div className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6 ${line.role === "user" ? "bg-rose text-ink" : "bg-white/8 text-white/78"} ${line.definite ? "" : "opacity-70"}`}>
                          {line.role === "assistant" && <p className="mb-1 text-[11px] font-semibold tracking-[.12em] text-rose-200">顾问</p>}
                          <p>{line.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-white/10 p-5">
                  <div className="flex h-14 items-center justify-center gap-1" aria-hidden="true">
                    {LEVEL_BARS.map((_, index) => (
                      <span
                        key={index}
                        className="w-1 rounded-full bg-rose transition-[height] duration-150 ease-out"
                        style={{ height: `${barHeight(index)}px` }}
                      />
                    ))}
                  </div>
                  <p className="text-center text-sm text-white/52" aria-live="polite">{voiceStatus}</p>

                  {voice.error && voiceState === "error" && (
                    <p role="alert" className="mt-4 rounded-2xl bg-rose/12 px-4 py-3 text-xs leading-5 text-rose-200">
                      {voice.error}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => { if (voiceState === "active") void voice.stop(); else void voice.start(); }}
                    disabled={voiceState === "connecting" || voiceState === "unsupported"}
                    className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-rose font-semibold text-ink transition hover:bg-[#f07d9b] disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {voiceState === "active" ? <><Pause size={17} aria-hidden="true" />{advisorCopy.voiceEnd}</> : <><Mic size={17} aria-hidden="true" />{voiceState === "connecting" ? advisorCopy.voiceLoading : advisorCopy.voiceStart}</>}
                  </button>

                  {voiceState === "active" && (
                    <button
                      type="button"
                      onClick={voice.interrupt}
                      className="mt-3 flex min-h-11 w-full items-center justify-center rounded-full border border-rose/40 text-sm font-semibold text-rose-200 transition hover:border-rose hover:text-white"
                    >
                      {advisorCopy.voiceInterrupt}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setMode("text")}
                    className="mt-3 flex min-h-11 w-full items-center justify-center rounded-full border border-white/15 text-sm font-semibold text-white/70 transition hover:border-rose/40 hover:text-white"
                  >
                    {advisorCopy.switchToText}
                  </button>
                  <p className="mt-3 text-center text-[11px] leading-4 text-white/35">{advisorCopy.voiceNote}</p>
                </div>
              </>
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
