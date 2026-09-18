"use client";

import { Check } from "lucide-react";
import {
  assessmentCopy,
  type AssessmentAnswers,
  type AssessmentQuestion,
} from "@/assessment-content";
import { getConfirm, getMatrix, getMulti, getScale } from "@/lib/assessment-engine";

type ChangeHandler = (question: AssessmentQuestion, next: AssessmentAnswers) => void;

function chipClass(selected: boolean): string {
  return `min-h-11 rounded-full border px-4 text-sm font-semibold transition ${
    selected ? "border-rose bg-[#fff1f4] text-[#a93257]" : "border-ink/12 bg-white text-ink/70 hover:border-rose/40"
  }`;
}

function SingleQuestion({ question, answers, onChange }: { question: AssessmentQuestion; answers: AssessmentAnswers; onChange: ChangeHandler }) {
  const value = typeof answers[question.id] === "string" ? (answers[question.id] as string) : "";
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2" role="group" aria-label={question.title}>
      {question.options!.map((option) => {
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(question, { ...answers, [question.id]: option.id })}
            className={`group relative min-h-[92px] rounded-[1.4rem] border p-4 text-left transition sm:p-5 ${
              selected
                ? "border-rose bg-[#fff1f4] shadow-[0_12px_35px_rgba(232,108,141,.14)]"
                : "border-ink/10 bg-white/72 hover:-translate-y-0.5 hover:border-rose/35 hover:bg-white"
            }`}
          >
            <span className="block pr-7 font-semibold text-ink">{option.label}</span>
            {option.detail && <span className="mt-1 block text-sm leading-6 text-ink/48">{option.detail}</span>}
            <span className={`absolute right-4 top-4 size-3 rounded-full border ${selected ? "border-rose bg-rose" : "border-ink/15"}`} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

function MultiQuestion({ question, answers, onChange }: { question: AssessmentQuestion; answers: AssessmentAnswers; onChange: ChangeHandler }) {
  const selected = getMulti(answers, question.id);
  const max = question.maxSelections;

  function toggle(optionId: string) {
    let next: string[];
    if (optionId === "none") {
      next = selected.includes("none") ? [] : ["none"];
    } else if (selected.includes(optionId)) {
      next = selected.filter((item) => item !== optionId && item !== "none");
    } else {
      const limit = max ?? Number.MAX_SAFE_INTEGER;
      const base = selected.filter((item) => item !== "none");
      if (base.length >= limit) return;
      next = [...base, optionId];
    }
    onChange(question, { ...answers, [question.id]: next });
  }

  return (
    <div>
      <p className="mt-2 text-sm font-medium text-ink/55" aria-live="polite">
        已选 {selected.length} 项{max ? ` · 最多 ${max} 项` : ""}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2" role="group" aria-label={question.title}>
        {question.options!.map((option) => {
          const active = selected.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(option.id)}
              className={`relative min-h-[72px] rounded-[1.3rem] border p-4 text-left transition ${
                active ? "border-rose bg-[#fff1f4]" : "border-ink/10 bg-white/72 hover:border-rose/35 hover:bg-white"
              }`}
            >
              <span className={`mr-3 inline-grid size-6 place-items-center rounded-md border align-middle ${active ? "border-rose bg-rose text-white" : "border-ink/20"}`}>
                {active && <Check size={14} aria-hidden="true" />}
              </span>
              <span className="align-middle font-semibold text-ink">{option.label}</span>
              {option.detail && <span className="mt-1 block pl-9 text-sm text-ink/48">{option.detail}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ScaleQuestion({ question, answers, onChange }: { question: AssessmentQuestion; answers: AssessmentAnswers; onChange: ChangeHandler }) {
  const values = getScale(answers, question.id);
  const labels = question.scaleLabels ?? [];

  function pick(item: string, value: number) {
    onChange(question, { ...answers, [question.id]: { ...values, [item]: value } });
  }

  return (
    <div className="mt-8 space-y-5">
      <div className="hidden gap-2 pl-1 sm:grid sm:grid-cols-[1.15fr_repeat(5,minmax(0,1fr))]">
        <span />
        {labels.map((label) => (
          <span key={label} className="text-center text-xs font-semibold text-ink/45">{label}</span>
        ))}
      </div>
      {question.scaleItems!.map((item) => (
        <fieldset key={item.id}>
          <legend className="sr-only">{item.label}</legend>
          <div className="grid gap-2 sm:grid-cols-[1.15fr_repeat(5,minmax(0,1fr))] sm:items-center">
            <span className="text-sm font-medium text-ink/80">{item.label}</span>
            <div className="flex gap-2 sm:contents">
              {labels.map((label, index) => {
                const value = index + 1;
                const active = values[item.id] === value;
                return (
                  <label key={label} className={`${chipClass(active)} flex flex-1 cursor-pointer items-center justify-center sm:w-full`}>
                    <input
                      type="radio"
                      name={`${question.id}-${item.id}`}
                      value={value}
                      checked={active}
                      onChange={() => pick(item.id, value)}
                      className="sr-only"
                    />
                    <span aria-hidden="true" className="sm:hidden">{label}</span>
                    <span className="hidden sm:inline">{value}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </fieldset>
      ))}
    </div>
  );
}

function MatrixQuestion({ question, answers, onChange }: { question: AssessmentQuestion; answers: AssessmentAnswers; onChange: ChangeHandler }) {
  const values = getMatrix(answers, question.id);
  const options = question.matrixOptions!;

  function pick(row: string, value: string) {
    onChange(question, { ...answers, [question.id]: { ...values, [row]: value } });
  }

  return (
    <div className="mt-8 overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <caption className="sr-only">{question.title}</caption>
        <thead>
          <tr>
            <th scope="col" className="p-2 text-left font-semibold text-ink/45">食物 / 频率</th>
            {options.map((option) => (
              <th key={option.id} scope="col" className="p-2 text-center text-xs font-semibold text-ink/45">{option.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {question.matrixRows!.map((row) => (
            <tr key={row.id} className="border-t border-ink/8">
              <th scope="row" className="p-2 text-left font-medium text-ink/80">{row.label}</th>
              {options.map((option) => {
                const active = values[row.id] === option.id;
                return (
                  <td key={option.id} className="p-1.5 text-center">
                    <label className={`${chipClass(active)} inline-flex min-w-11 cursor-pointer items-center justify-center`}>
                      <input
                        type="radio"
                        name={`${question.id}-${row.id}`}
                        value={option.id}
                        checked={active}
                        onChange={() => pick(row.id, option.id)}
                        className="sr-only"
                      />
                      <span className="grid size-5 place-items-center rounded-full border" aria-hidden="true">
                        {active && <span className="size-2.5 rounded-full bg-rose" />}
                      </span>
                      <span className="sr-only">{option.label}</span>
                    </label>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ConfirmQuestion({ question, answers, onChange }: { question: AssessmentQuestion; answers: AssessmentAnswers; onChange: ChangeHandler }) {
  const values = getConfirm(answers, question.id);

  function pick(item: string, value: string) {
    onChange(question, { ...answers, [question.id]: { ...values, [item]: value } });
  }

  return (
    <div className="mt-8 space-y-3">
      {question.confirmItems!.map((item) => (
        <fieldset key={item.id} className="rounded-[1.3rem] border border-ink/10 bg-white/72 p-4">
          <legend className="sr-only">{item.label}</legend>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium text-ink/85">{item.label}</span>
            <div className="flex gap-2">
              {(["no", "yes"] as const).map((value) => {
                const active = values[item.id] === value;
                return (
                  <label key={value} className={`${chipClass(active)} inline-flex cursor-pointer items-center`}>
                    <input
                      type="radio"
                      name={`${question.id}-${item.id}`}
                      value={value}
                      checked={active}
                      onChange={() => pick(item.id, value)}
                      className="sr-only"
                    />
                    {value === "yes" ? "是" : "否"}
                  </label>
                );
              })}
            </div>
          </div>
        </fieldset>
      ))}
    </div>
  );
}

export default function QuestionRenderer({
  question,
  answers,
  error,
  onChange,
}: {
  question: AssessmentQuestion;
  answers: AssessmentAnswers;
  error: string;
  onChange: ChangeHandler;
}) {
  return (
    <div>
      {question.description && <p className="mt-4 leading-7 text-ink/58">{question.description}</p>}
      {question.type === "single" && <SingleQuestion question={question} answers={answers} onChange={onChange} />}
      {question.type === "multi" && <MultiQuestion question={question} answers={answers} onChange={onChange} />}
      {question.type === "scale" && <ScaleQuestion question={question} answers={answers} onChange={onChange} />}
      {question.type === "matrix" && <MatrixQuestion question={question} answers={answers} onChange={onChange} />}
      {question.type === "confirm" && <ConfirmQuestion question={question} answers={answers} onChange={onChange} />}
      <p className="mt-4 min-h-6 text-sm font-medium text-[#a93257]" aria-live="polite">{error}</p>
      {question.type === "multi" && question.maxSelections ? null : null}
      {void 0}
      {assessmentCopy.nav.chapter ? null : null}
    </div>
  );
}
