"use client";

import { ArrowLeft, CreditCard, LockKeyhole } from "lucide-react";
import { type FormEvent, useState } from "react";
import { checkoutCopy, paymentMethods, type BillingCycle } from "@/assessment-content";
import { getPlanPricing } from "@/lib/recommendation-engine";

export type CheckoutFields = { name: string; phone: string; city: string; address: string };

const initialFields: CheckoutFields = { name: "", phone: "", city: "", address: "" };

const fieldMeta = [
  { id: "name", label: "收货人", placeholder: "例如：林女士", autoComplete: "name" },
  { id: "phone", label: "手机号码", placeholder: "用于配送联系", autoComplete: "tel" },
  { id: "city", label: "所在城市", placeholder: "例如：上海", autoComplete: "address-level2" },
  { id: "address", label: "详细地址", placeholder: "街道与门牌号", autoComplete: "street-address" },
] satisfies Array<{ id: keyof CheckoutFields; label: string; placeholder: string; autoComplete: string }>;

export function validateCheckout(fields: CheckoutFields, payment: string): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!fields.name.trim()) errors.name = "请输入收货人姓名";
  if (!fields.phone.trim()) errors.phone = "请输入手机号码";
  if (!fields.city.trim()) errors.city = "请输入所在城市";
  if (!fields.address.trim()) errors.address = "请输入详细地址";
  if (!payment) errors.payment = "请选择支付方式";
  return errors;
}

export default function AssessmentCheckout({
  planTitle,
  ingredientCount,
  onBack,
  onSuccess,
}: {
  planTitle: string;
  ingredientCount: number;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [cycle, setCycle] = useState<BillingCycle>("quarterly");
  const [fields, setFields] = useState<CheckoutFields>(initialFields);
  const [payment, setPayment] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const order = getPlanPricing(cycle);

  function updateField(field: keyof CheckoutFields, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateCheckout(fields, payment);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) onSuccess();
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-rose">{checkoutCopy.eyebrow}</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-ink sm:text-5xl">{checkoutCopy.title}</h1>
          <p className="mt-3 text-ink/56">{planTitle} · 每日 {ingredientCount} 项营养</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-[#fff0f4] px-4 py-2 text-sm font-semibold text-[#a93257]"><LockKeyhole size={15} aria-hidden="true" /> 安全支付</span>
      </div>

      <fieldset className="mt-8">
        <legend className="font-semibold text-ink">{checkoutCopy.cycleLabel}</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(["monthly", "quarterly"] as BillingCycle[]).map((item) => {
            const summary = getPlanPricing(item);
            const selected = cycle === item;
            return (
              <button key={item} type="button" aria-pressed={selected} onClick={() => setCycle(item)} className={`relative min-h-[98px] rounded-[1.3rem] border p-4 text-left transition ${selected ? "border-rose bg-[#fff2f5]" : "border-ink/10 bg-white hover:border-rose/35"}`}>
                {item === "quarterly" && <span className="absolute right-3 top-3 rounded-full bg-rose px-2.5 py-1 text-[10px] font-semibold text-white">订阅优惠</span>}
                <span className="block font-semibold">{summary.days} 天装</span>
                <span className="mt-2 block text-2xl font-semibold">¥{summary.total} <span className="text-sm font-normal text-ink/38 line-through">¥{summary.compareAt}</span></span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mt-8">
        <legend className="font-semibold text-ink">{checkoutCopy.addressLabel}</legend>
        <p className="mt-1 text-sm text-ink/45">{checkoutCopy.addressNote}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {fieldMeta.map((field) => (
            <label key={field.id} className={field.id === "address" ? "sm:col-span-2" : ""}>
              <span className="mb-2 block text-sm font-medium text-ink/72">{field.label}</span>
              <input
                type={field.id === "phone" ? "tel" : "text"}
                value={fields[field.id]}
                onChange={(event) => updateField(field.id, event.target.value)}
                autoComplete={field.autoComplete}
                aria-invalid={Boolean(errors[field.id])}
                aria-describedby={errors[field.id] ? `${field.id}-error` : undefined}
                placeholder={field.placeholder}
                className="min-h-12 w-full rounded-2xl border border-ink/10 bg-white px-4 text-ink placeholder:text-ink/28 focus:border-rose focus:outline-none"
              />
              {errors[field.id] && <span id={`${field.id}-error`} className="mt-1.5 block text-xs font-medium text-[#a93257]">{errors[field.id]}</span>}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-8">
        <legend className="font-semibold text-ink">{checkoutCopy.paymentLabel}</legend>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
          {paymentMethods.map((method) => {
            const selected = payment === method.id;
            return (
              <button key={method.id} type="button" aria-pressed={selected} onClick={() => { setPayment(method.id); setErrors((current) => ({ ...current, payment: "" })); }} className={`min-h-[82px] rounded-[1.2rem] border p-3 text-center transition ${selected ? "border-rose bg-[#fff2f5]" : "border-ink/10 bg-white hover:border-rose/35"}`}>
                <span className={`mx-auto grid size-8 place-items-center rounded-full text-xs font-bold ${selected ? "bg-rose text-white" : "bg-lilac text-ink/65"}`}>{method.mark}</span>
                <span className="mt-2 block text-xs font-semibold sm:text-sm">{method.label}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 min-h-5 text-xs font-medium text-[#a93257]" aria-live="polite">{errors.payment}</p>
      </fieldset>

      <div className="mt-6 rounded-[1.4rem] bg-ink p-5 text-white sm:p-6">
        <p className="text-sm font-semibold text-white/80">{checkoutCopy.summary}</p>
        <div className="mt-3 flex items-center justify-between border-b border-white/10 pb-4"><span className="text-white/60">{order.days} 天方案</span><span className="text-white/45 line-through">¥{order.compareAt}</span></div>
        <div className="flex items-center justify-between py-3 text-sm"><span className="text-white/60">{checkoutCopy.saving}</span><span className="text-rose-200">-¥{order.saving}</span></div>
        <div className="flex items-end justify-between border-t border-white/10 pt-4"><span className="font-semibold">{checkoutCopy.total}</span><span className="text-3xl font-semibold">¥{order.total}</span></div>
      </div>

      <p className="mt-4 text-sm text-[#a93257]" aria-live="polite">
        {Object.keys(errors).length > 0 ? "请完善标注的信息后继续。" : ""}
      </p>
      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button type="button" onClick={onBack} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-ink/12 bg-white px-6 font-semibold"><ArrowLeft size={17} aria-hidden="true" /> 返回方案</button>
        <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-rose px-7 font-semibold text-white shadow-[0_14px_35px_rgba(232,108,141,.25)] transition hover:-translate-y-0.5 hover:bg-[#bd3f66]"><CreditCard size={17} aria-hidden="true" /> {checkoutCopy.confirm}</button>
      </div>
    </form>
  );
}
