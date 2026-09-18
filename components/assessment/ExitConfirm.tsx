"use client";

import { useEffect, useRef } from "react";
import { assessmentCopy } from "@/assessment-content";

export default function ExitConfirm({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-ink/45 p-5 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-dialog-title"
        aria-describedby="exit-dialog-copy"
        className="w-full max-w-md rounded-[1.75rem] border border-white/60 bg-white p-7 shadow-[0_30px_90px_rgba(59,42,67,.25)]"
      >
        <h2 id="exit-dialog-title" className="font-serif text-3xl text-ink">{assessmentCopy.exitDialog.title}</h2>
        <p id="exit-dialog-copy" className="mt-4 leading-7 text-ink/60">{assessmentCopy.exitDialog.copy}</p>
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-ink/12 bg-white px-6 font-semibold text-ink transition hover:border-rose/45"
          >
            {assessmentCopy.exitDialog.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-6 font-semibold text-white transition hover:bg-rose"
          >
            {assessmentCopy.exitDialog.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
