"use client";

import { useState } from "react";
import { Check, Loader2, MessageCircle, Phone, AlertCircle } from "lucide-react";
import { SITE } from "@/lib/data";

const DEVICES = [
  "موبایل",
  "لپ تاپ",
  "تبلت",
  "ساعت هوشمند",
  "تلویزیون",
  "مانیتور",
  "کنسول بازی",
  "سایر",
];

const BRANDS = [
  "سامسونگ",
  "اپل",
  "شیائومی",
  "هواوی",
  "ایسوس",
  "لنوو",
  "اچ پی",
  "دل",
  "ایسر",
  "سونی",
  "نوکیا",
  "موتورولا",
  "سایر",
];

const BRANCHES = ["شعبه مرکزی (مطهری)", "شعبه غرب (سعادت آباد)", "فرقی ندارد"];

type State = "idle" | "sending" | "sent" | "error";

const field =
  "w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink-900 outline-none transition focus:border-accent focus:bg-white";
const label = "mb-2 block text-[13px] font-bold text-ink-800";

export default function RepairRequestForm() {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");
  // Kept so the WhatsApp fallback can carry what the customer already typed.
  const [form, setForm] = useState({
    name: "",
    phone: "",
    device: "",
    brand: "",
    model: "",
    branch: "",
    problem: "",
  });

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const whatsappHref = () => {
    const text = [
      "درخواست تعمیر",
      form.name && `نام: ${form.name}`,
      form.phone && `تماس: ${form.phone}`,
      form.device && `دستگاه: ${form.device}`,
      form.brand && `برند: ${form.brand}`,
      form.model && `مدل: ${form.model}`,
      form.problem && `ایراد: ${form.problem}`,
    ]
      .filter(Boolean)
      .join("\n");
    return `${SITE.socials.whatsapp}?text=${encodeURIComponent(text)}`;
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setError("");
    try {
      const res = await fetch("/send-repair-request.php", {
        method: "POST",
        body: new FormData(e.currentTarget),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "ارسال درخواست انجام نشد.");
      }
      setState("sent");
    } catch (err) {
      setState("error");
      setError(
        err instanceof Error && err.message !== "Failed to fetch"
          ? err.message
          : "ارتباط با سرور برقرار نشد.",
      );
    }
  }

  if (state === "sent") {
    return (
      <div className="rounded-[22px] border border-line bg-white p-8 text-center shadow-card">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#2BB673]/10 text-[#2BB673]">
          <Check className="h-7 w-7" strokeWidth={2.6} />
        </div>
        <h2 className="mt-5 text-xl font-extrabold text-ink-900">
          درخواست شما ثبت شد
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-8 text-ink-500">
          کارشناسان ما در ساعات کاری با شما تماس می گیرند. اگر عجله دارید،
          مستقیم تماس بگیرید.
        </p>
        <a
          href={SITE.phoneHref}
          dir="ltr"
          className="mt-6 inline-flex items-center gap-2 rounded-[13px] bg-accent px-6 py-3 text-sm font-bold text-white transition hover:bg-accent-deep"
        >
          <Phone className="h-4 w-4" />
          {SITE.phone}
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[22px] border border-line bg-white p-5 shadow-card sm:p-7"
    >
      {/* Honeypot — hidden from people, tempting to bots. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute right-[-9999px] h-0 w-0 opacity-0"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="rr-name">
            نام و نام خانوادگی <span className="text-accent">*</span>
          </label>
          <input
            id="rr-name"
            name="name"
            required
            maxLength={120}
            value={form.name}
            onChange={set("name")}
            className={field}
            placeholder="مثلا علی رضایی"
          />
        </div>
        <div>
          <label className={label} htmlFor="rr-phone">
            شماره تماس <span className="text-accent">*</span>
          </label>
          <input
            id="rr-phone"
            name="phone"
            required
            inputMode="tel"
            dir="ltr"
            maxLength={40}
            value={form.phone}
            onChange={set("phone")}
            className={`${field} text-right`}
            placeholder="09xxxxxxxxx"
          />
        </div>
        <div>
          <label className={label} htmlFor="rr-device">
            نوع دستگاه
          </label>
          <select
            id="rr-device"
            name="device"
            value={form.device}
            onChange={set("device")}
            className={field}
          >
            <option value="">انتخاب کنید</option>
            {DEVICES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="rr-brand">
            برند
          </label>
          <select
            id="rr-brand"
            name="brand"
            value={form.brand}
            onChange={set("brand")}
            className={field}
          >
            <option value="">انتخاب کنید</option>
            {BRANDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="rr-model">
            مدل دستگاه
          </label>
          <input
            id="rr-model"
            name="model"
            maxLength={120}
            value={form.model}
            onChange={set("model")}
            className={field}
            placeholder="مثلا Galaxy A54"
          />
        </div>
        <div>
          <label className={label} htmlFor="rr-branch">
            شعبه مورد نظر
          </label>
          <select
            id="rr-branch"
            name="branch"
            value={form.branch}
            onChange={set("branch")}
            className={field}
          >
            <option value="">انتخاب کنید</option>
            {BRANCHES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5">
        <label className={label} htmlFor="rr-problem">
          شرح ایراد دستگاه <span className="text-accent">*</span>
        </label>
        <textarea
          id="rr-problem"
          name="problem"
          required
          rows={5}
          maxLength={2000}
          value={form.problem}
          onChange={set("problem")}
          className={`${field} resize-y leading-8`}
          placeholder="چه اتفاقی افتاده؟ از کی شروع شده؟ آیا قبلا تعمیر شده؟"
        />
      </div>

      {state === "error" && (
        <div className="mt-5 flex gap-2.5 rounded-xl border border-accent/25 bg-accent/[.04] p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <div className="text-[13px] leading-7 text-ink-700">
            {error} می توانید همین اطلاعات را در واتساپ بفرستید یا تماس بگیرید.
            <div className="mt-3 flex flex-wrap gap-2.5">
              <a
                href={whatsappHref()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-[13px] font-bold text-white"
              >
                <MessageCircle className="h-4 w-4" />
                ارسال در واتساپ
              </a>
              <a
                href={SITE.phoneHref}
                dir="ltr"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-[13px] font-bold text-white"
              >
                <Phone className="h-4 w-4" />
                {SITE.phone}
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={state === "sending"}
          className="inline-flex items-center gap-2.5 rounded-[14px] bg-accent px-7 py-3.5 text-base font-bold text-white shadow-[0_10px_26px_rgba(218,37,28,.30)] transition hover:-translate-y-0.5 hover:bg-accent-deep disabled:translate-y-0 disabled:opacity-60"
        >
          {state === "sending" ? (
            <>
              <Loader2 className="h-[18px] w-[18px] animate-spin" />
              در حال ارسال
            </>
          ) : (
            "ثبت درخواست تعمیر"
          )}
        </button>
        <span className="text-[12.5px] text-ink-300">
          ثبت درخواست رایگان است و هیچ هزینه ای بابت آن دریافت نمی شود.
        </span>
      </div>
    </form>
  );
}
