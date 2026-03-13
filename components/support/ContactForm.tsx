"use client";

import { useState } from "react";

const CATEGORY_OPTIONS = [
  { value: "payment", label: "付款問題" },
  { value: "refund", label: "退款申請" },
  { value: "course", label: "課程內容" },
  { value: "account", label: "帳號問題" },
  { value: "other", label: "其他" },
] as const;

export default function ContactForm(props: {
  defaultName?: string;
  defaultEmail?: string;
}) {
  const [name, setName] = useState(props.defaultName ?? "");
  const [email, setEmail] = useState(props.defaultEmail ?? "");
  const [category, setCategory] = useState<(typeof CATEGORY_OPTIONS)[number]["value"]>("other");
  const [orderId, setOrderId] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      const response = await fetch("/api/support/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          category,
          orderId: orderId.trim() || undefined,
          subject,
          message,
        }),
      });

      const data = (await response.json()) as { id?: string; error?: string };
      if (!response.ok) {
        throw new Error(data.error || "提交失敗");
      }

      setSuccess(`客服單已送出，編號：${data.id}`);
      setOrderId("");
      setSubject("");
      setMessage("");
      setCategory("other");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "提交失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-gray-900">姓名</span>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-gray-900">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-gray-900">問題類型</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as (typeof CATEGORY_OPTIONS)[number]["value"])}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-gray-900">訂單編號（選填）</span>
          <input
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
            placeholder="例如：439fcd61-..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>

      <label className="space-y-2 text-sm">
        <span className="font-semibold text-gray-900">主旨</span>
        <input
          required
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </label>

      <label className="space-y-2 text-sm">
        <span className="font-semibold text-gray-900">問題說明</span>
        <textarea
          required
          rows={7}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          placeholder="請盡量附上完整情境、錯誤訊息、付款方式或重現步驟。"
        />
      </label>

      {success ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {loading ? "送出中..." : "送出客服單"}
      </button>
    </form>
  );
}
