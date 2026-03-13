"use client";

import { useState } from "react";

interface SalesLeadCaptureProps {
  mode: "lead" | "waitlist";
  courseId: string;
  courseTitle: string;
  title: string;
  description: string;
  couponCode?: string;
  launchStartsAt?: string;
  source: string;
  buttonLabel?: string;
  compact?: boolean;
}

export default function SalesLeadCapture({
  mode,
  courseId,
  courseTitle,
  title,
  description,
  couponCode,
  launchStartsAt,
  source,
  buttonLabel,
  compact = false,
}: SalesLeadCaptureProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const endpoint = mode === "waitlist" ? "/api/waitlists" : "/api/leads";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId,
          courseTitle,
          name: name.trim() || undefined,
          email: email.trim(),
          source,
          couponCode,
          launchStartsAt,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.message || "送出失敗，請稍後再試。");
      }

      setMessage(
        data.message ||
          (mode === "waitlist"
            ? "已加入等待名單，開賣時會優先通知您。"
            : "已送出資料，請至信箱收取優惠資訊。"),
      );
      setName("");
      setEmail("");
    } catch (submitError) {
      console.error(submitError);
      setError(submitError instanceof Error ? submitError.message : "送出失敗");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      className={`rounded-2xl border border-blue-100 bg-blue-50/70 ${
        compact ? "p-4" : "p-6"
      }`}
    >
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
        <p className="text-sm leading-6 text-slate-700">{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div className={`grid gap-3 ${compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="姓名（選填）"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            required
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {couponCode ? (
          <p className="text-xs font-medium text-blue-700">
            送出後會寄送優惠碼：{couponCode}
          </p>
        ) : null}

        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {submitting ? "送出中..." : buttonLabel || (mode === "waitlist" ? "加入等待名單" : "索取優惠與提醒")}
        </button>
      </form>
    </section>
  );
}
