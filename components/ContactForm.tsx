"use client";

import { Check, Send } from "lucide-react";
import { type FormEvent, useState } from "react";
import { contactPage } from "@/site-pages";

type FieldId = "name" | "contact" | "topic" | "message";

const emptyValues: Record<FieldId, string> = { name: "", contact: "", topic: "", message: "" };

export default function ContactForm() {
  const [values, setValues] = useState<Record<FieldId, string>>(emptyValues);
  const [errors, setErrors] = useState<Partial<Record<FieldId, string>>>({});
  const [done, setDone] = useState(false);

  function update(id: FieldId, value: string) {
    setValues((current) => ({ ...current, [id]: value }));
    setErrors((current) => (current[id] ? { ...current, [id]: undefined } : current));
    setDone(false);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Partial<Record<FieldId, string>> = {};
    for (const field of contactPage.form.fields) {
      const id = field.id as FieldId;
      if (!values[id].trim()) nextErrors[id] = contactPage.form.errors[id];
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setDone(false);
      return;
    }
    setDone(true);
    setValues(emptyValues);
  }

  return (
    <form onSubmit={submit} noValidate className="rounded-[1.75rem] border border-ink/8 bg-white p-6 sm:p-8">
      <h2 className="font-serif text-2xl sm:text-3xl">{contactPage.form.title}</h2>
      <p className="mt-3 text-sm leading-7 text-ink/60">{contactPage.form.copy}</p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {contactPage.form.fields.map((field) => {
          const id = field.id as FieldId;
          const error = errors[id];
          const shared = {
            id: `contact-${id}`,
            name: id,
            value: values[id],
            placeholder: field.placeholder,
            autoComplete: field.autoComplete,
            "aria-invalid": Boolean(error),
            "aria-describedby": error ? `contact-${id}-error` : undefined,
            className: `mt-2 w-full rounded-2xl border bg-cream px-4 py-3 text-sm text-ink placeholder:text-ink/35 focus:outline-none ${
              error ? "border-[#c0455f]/50 focus:border-[#c0455f]" : "border-ink/12 focus:border-rose"
            }`,
          };
          return (
            <p key={id} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
              <label htmlFor={`contact-${id}`} className="text-sm font-semibold text-ink/70">{field.label}</label>
              {field.type === "textarea" ? (
                <textarea
                  {...shared}
                  rows={4}
                  onChange={(event) => update(id, event.target.value)}
                />
              ) : (
                <input
                  {...shared}
                  type="text"
                  onChange={(event) => update(id, event.target.value)}
                />
              )}
              {error && (
                <span id={`contact-${id}-error`} className="mt-2 block text-xs font-medium text-[#a03248]">{error}</span>
              )}
            </p>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-white transition hover:bg-rose"
        >
          <Send size={16} aria-hidden="true" />{contactPage.form.submit}
        </button>
        <p aria-live="polite" className="flex items-center gap-2 text-sm text-ink/60">
          {done && <><Check size={16} className="text-[#3f8f6b]" aria-hidden="true" />{contactPage.form.success}</>}
        </p>
      </div>
    </form>
  );
}
