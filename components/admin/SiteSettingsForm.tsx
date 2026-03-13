"use client";

import { useState } from "react";
import type { SiteSettingsRecord } from "@/lib/site-settings";

interface SiteSettingsFormProps {
  initialValues: SiteSettingsRecord;
}

export default function SiteSettingsForm({ initialValues }: SiteSettingsFormProps) {
  const [form, setForm] = useState({
    platformName: initialValues.platformName,
    supportEmail: initialValues.supportEmail,
    footerNotice: initialValues.footerNotice,
    contactIntro: initialValues.contactIntro,
    supportHours: initialValues.supportHours,
    supportGuidelines: initialValues.supportGuidelines,
    refundSummary: initialValues.refundSummary,
    purchaseGuideSummary: initialValues.purchaseGuideSummary,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/settings/site", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "儲存失敗");
      }

      setMessage("已更新全站設定。");
    } catch (submitError) {
      console.error(submitError);
      setError(submitError instanceof Error ? submitError.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  }

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-950">品牌與聯絡資訊</h2>
          <p className="text-sm leading-6 text-slate-700">
            管理頁尾、客服聯絡方式與全站品牌名稱。
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="平台名稱">
            <input
              value={form.platformName}
              onChange={(event) => updateField("platformName", event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </Field>
          <Field label="客服 Email">
            <input
              type="email"
              value={form.supportEmail}
              onChange={(event) => updateField("supportEmail", event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </Field>
          <Field label="服務時間">
            <input
              value={form.supportHours}
              onChange={(event) => updateField("supportHours", event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </Field>
          <Field label="頁尾品牌文案" full>
            <textarea
              rows={3}
              value={form.footerNotice}
              onChange={(event) => updateField("footerNotice", event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-950">客服與政策文案</h2>
          <p className="text-sm leading-6 text-slate-700">
            這些文案會同步用於聯絡頁、退款政策、購買須知與通知信。
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5">
          <Field label="聯絡頁說明文案">
            <textarea
              rows={4}
              value={form.contactIntro}
              onChange={(event) => updateField("contactIntro", event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </Field>
          <Field label="客服處理說明">
            <textarea
              rows={5}
              value={form.supportGuidelines}
              onChange={(event) => updateField("supportGuidelines", event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </Field>
          <Field label="退款政策摘要">
            <textarea
              rows={5}
              value={form.refundSummary}
              onChange={(event) => updateField("refundSummary", event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </Field>
          <Field label="購買須知摘要">
            <textarea
              rows={5}
              value={form.purchaseGuideSummary}
              onChange={(event) => updateField("purchaseGuideSummary", event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </Field>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {saving ? "儲存中..." : "儲存全站設定"}
        </button>
        {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  full = false,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="mb-2 block text-sm font-semibold text-slate-900">{label}</label>
      {children}
    </div>
  );
}
