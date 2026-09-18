"use client";

import Link from "next/link";
import { Check, Mail } from "lucide-react";
import { type FormEvent, useState } from "react";
import { newsletter } from "@/content";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!emailPattern.test(email.trim())) {
      setError(newsletter.invalid);
      setStatus("idle");
      return;
    }
    setError(null);
    setStatus("done");
  }

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor="newsletter-email" className="sr-only">{newsletter.placeholder}</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <span className="relative flex-1">
          <Mail size={16} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(event) => { setEmail(event.target.value); if (error) setError(null); }}
            placeholder={newsletter.placeholder}
            autoComplete="email"
            aria-invalid={Boolean(error)}
            aria-describedby="newsletter-status"
            className="min-h-12 w-full rounded-full border border-white/15 bg-white/8 pl-11 pr-4 text-sm text-white placeholder:text-white/35 focus:border-rose focus:outline-none"
          />
        </span>
        <button
          type="submit"
          className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-rose px-6 text-sm font-semibold text-white transition hover:bg-[#f07d9b]"
        >
          {status === "done" ? <><Check size={16} aria-hidden="true" />{newsletter.submit}</> : newsletter.submit}
        </button>
      </div>
      <p id="newsletter-status" aria-live="polite" className={`mt-3 text-xs leading-5 ${error ? "text-rose-200" : "text-white/45"}`}>
        {error ?? (status === "done" ? newsletter.success : "")}
      </p>
      <p className="text-xs leading-5 text-white/35">
        {newsletter.consentLead}
        <Link href={newsletter.privacyHref} className="underline decoration-white/30 underline-offset-4 transition hover:text-white">
          《{newsletter.privacyLabel}》
        </Link>
        {newsletter.consentTail}
      </p>
    </form>
  );
}
