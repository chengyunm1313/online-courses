"use client";

import { useEffect, useState } from "react";

interface DiscountRecord {
  id: string;
  code: string;
  type: "percentage" | "amount";
  value: number;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  usageLimit?: number;
  perUserLimit?: number;
  minimumAmount: number;
  courseIds: string[];
  enabled: boolean;
  usageCount: number;
}

const emptyForm = {
  code: "",
  type: "amount" as "percentage" | "amount",
  value: "0",
  description: "",
  startsAt: "",
  endsAt: "",
  usageLimit: "",
  perUserLimit: "",
  minimumAmount: "0",
  courseIds: "",
  enabled: true,
};

export default function DiscountManagement() {
  const [discounts, setDiscounts] = useState<DiscountRecord[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDiscounts = async () => {
    const response = await fetch("/api/admin/discounts");
    const data = await response.json();
    setDiscounts(data.discounts ?? []);
  };

  useEffect(() => {
    void loadDiscounts();
  }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/discounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: form.code,
          type: form.type,
          value: Number(form.value),
          description: form.description,
          startsAt: form.startsAt || undefined,
          endsAt: form.endsAt || undefined,
          usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
          perUserLimit: form.perUserLimit ? Number(form.perUserLimit) : undefined,
          minimumAmount: Number(form.minimumAmount || 0),
          courseIds: form.courseIds
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          enabled: form.enabled,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "建立折扣碼失敗");
      }

      setForm(emptyForm);
      await loadDiscounts();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "建立折扣碼失敗");
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async (discount: DiscountRecord) => {
    const response = await fetch(`/api/admin/discounts/${discount.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...discount,
        enabled: !discount.enabled,
      }),
    });

    if (response.ok) {
      await loadDiscounts();
    }
  };

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <div className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold tracking-wide text-blue-700">
            PROMOTION SETUP
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">新增折扣碼</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
            折扣碼改由資料庫管理，可設定期間、金額門檻與適用課程。
          </p>
        </div>

        <form onSubmit={handleCreate} className="grid grid-cols-1 gap-5 px-6 py-6 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-900">折扣碼</span>
            <input
              value={form.code}
              onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
              placeholder="例如：WELCOME10"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-900">折扣類型</span>
            <select
              value={form.type}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, type: event.target.value as "percentage" | "amount" }))
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              <option value="amount">固定金額</option>
              <option value="percentage">百分比</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-900">折扣值</span>
            <input
              value={form.value}
              onChange={(event) => setForm((prev) => ({ ...prev, value: event.target.value }))}
              placeholder={form.type === "percentage" ? "例如：0.1 代表 10%" : "例如：100"}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-900">最低訂單金額</span>
            <input
              value={form.minimumAmount}
              onChange={(event) => setForm((prev) => ({ ...prev, minimumAmount: event.target.value }))}
              placeholder="0 代表不限制"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-slate-900">活動說明</span>
            <input
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="例如：新會員首購優惠"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-900">開始時間</span>
            <input
              type="datetime-local"
              value={form.startsAt}
              onChange={(event) => setForm((prev) => ({ ...prev, startsAt: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-900">結束時間</span>
            <input
              type="datetime-local"
              value={form.endsAt}
              onChange={(event) => setForm((prev) => ({ ...prev, endsAt: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-900">總使用次數上限</span>
            <input
              value={form.usageLimit}
              onChange={(event) => setForm((prev) => ({ ...prev, usageLimit: event.target.value }))}
              placeholder="留空代表不限制"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-900">每人使用次數上限</span>
            <input
              value={form.perUserLimit}
              onChange={(event) => setForm((prev) => ({ ...prev, perUserLimit: event.target.value }))}
              placeholder="留空代表不限制"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-slate-900">適用課程 ID</span>
            <input
              value={form.courseIds}
              onChange={(event) => setForm((prev) => ({ ...prev, courseIds: event.target.value }))}
              placeholder="以逗點分隔；留空代表全站可用"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
            <p className="text-xs leading-5 text-slate-600">
              若只想限定特定課程，請輸入課程 ID；若要全站可用可直接留空。
            </p>
          </label>
          <label className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(event) => setForm((prev) => ({ ...prev, enabled: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            建立後立即啟用
          </label>
          <div className="md:col-span-2">
            {error ? <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}
            <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-700">
                建立後可在下方清單快速停用或重新啟用。
              </p>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {saving ? "儲存中..." : "建立折扣碼"}
              </button>
            </div>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <h2 className="text-xl font-semibold text-slate-950">折扣碼清單</h2>
          <p className="mt-1 text-sm text-slate-700">
            檢查啟用狀態、使用次數與活動說明，避免過期或誤開活動長時間在線。
          </p>
        </div>
        <div className="divide-y">
          {discounts.length === 0 ? (
            <p className="px-6 py-8 text-sm text-slate-600">目前尚未建立任何折扣碼。</p>
          ) : (
            discounts.map((discount) => (
              <div key={discount.id} className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2 text-sm text-slate-700">
                  <div className="flex items-center gap-3">
                    <p className="text-base font-semibold text-slate-950">{discount.code}</p>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${discount.enabled ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-700"}`}>
                      {discount.enabled ? "啟用中" : "停用中"}
                    </span>
                  </div>
                  <p className="leading-6 text-slate-700">{discount.description || "未填寫描述"}</p>
                  <p className="text-slate-700">
                    類型：
                    <span className="font-medium text-slate-900">
                      {discount.type === "percentage" ? ` 百分比 ${discount.value * 100}%` : ` 折抵 NT$ ${discount.value.toLocaleString()}`}
                    </span>
                    {" · "}
                    已使用
                    <span className="font-medium text-slate-900"> {discount.usageCount} </span>
                    次
                    {discount.usageLimit ? ` / 上限 ${discount.usageLimit}` : " / 無上限"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void toggleEnabled(discount)}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  {discount.enabled ? "停用" : "啟用"}
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
