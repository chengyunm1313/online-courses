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
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">新增折扣碼</h2>
          <p className="mt-1 text-sm text-gray-600">
            折扣碼改由資料庫管理，可設定期間、金額門檻與適用課程。
          </p>
        </div>

        <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <input
            value={form.code}
            onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
            placeholder="折扣碼，例如：WELCOME10"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <select
            value={form.type}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, type: event.target.value as "percentage" | "amount" }))
            }
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="amount">固定金額</option>
            <option value="percentage">百分比</option>
          </select>
          <input
            value={form.value}
            onChange={(event) => setForm((prev) => ({ ...prev, value: event.target.value }))}
            placeholder="折扣值"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            value={form.minimumAmount}
            onChange={(event) => setForm((prev) => ({ ...prev, minimumAmount: event.target.value }))}
            placeholder="最低訂單金額"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="描述，例如：新會員首購優惠"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm md:col-span-2"
          />
          <input
            type="datetime-local"
            value={form.startsAt}
            onChange={(event) => setForm((prev) => ({ ...prev, startsAt: event.target.value }))}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="datetime-local"
            value={form.endsAt}
            onChange={(event) => setForm((prev) => ({ ...prev, endsAt: event.target.value }))}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            value={form.usageLimit}
            onChange={(event) => setForm((prev) => ({ ...prev, usageLimit: event.target.value }))}
            placeholder="總使用次數上限"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            value={form.perUserLimit}
            onChange={(event) => setForm((prev) => ({ ...prev, perUserLimit: event.target.value }))}
            placeholder="每人使用次數上限"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            value={form.courseIds}
            onChange={(event) => setForm((prev) => ({ ...prev, courseIds: event.target.value }))}
            placeholder="適用課程 ID，以逗點分隔；留空則全站可用"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm md:col-span-2"
          />
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(event) => setForm((prev) => ({ ...prev, enabled: event.target.checked }))}
            />
            立即啟用
          </label>
          <div className="md:col-span-2">
            {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              {saving ? "儲存中..." : "建立折扣碼"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">折扣碼清單</h2>
        </div>
        <div className="divide-y">
          {discounts.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-500">目前尚未建立任何折扣碼。</p>
          ) : (
            discounts.map((discount) => (
              <div key={discount.id} className="flex flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-3">
                    <p className="text-base font-semibold text-gray-900">{discount.code}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${discount.enabled ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>
                      {discount.enabled ? "啟用中" : "停用中"}
                    </span>
                  </div>
                  <p>{discount.description || "未填寫描述"}</p>
                  <p>
                    類型：{discount.type === "percentage" ? `百分比 ${discount.value * 100}%` : `折抵 NT$ ${discount.value.toLocaleString()}`}
                    {" · "}
                    已使用 {discount.usageCount} 次
                    {discount.usageLimit ? ` / 上限 ${discount.usageLimit}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void toggleEnabled(discount)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700"
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
