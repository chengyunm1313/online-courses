"use client";

import { useState, useTransition } from "react";
import type { ReconciliationStatus, RefundStatus } from "@/types/order";

interface OrderOperationsFormProps {
  orderId: string;
  refundStatus?: RefundStatus;
  refundReason?: string;
  refundNote?: string;
  refundRequestedAt?: string;
  refundedAt?: string;
  reconciliationStatus?: ReconciliationStatus;
  notes?: string;
}

export default function OrderOperationsForm({
  orderId,
  refundStatus = "none",
  refundReason = "",
  refundNote = "",
  refundRequestedAt = "",
  refundedAt = "",
  reconciliationStatus = "pending",
  notes = "",
}: OrderOperationsFormProps) {
  const [refundStatusValue, setRefundStatusValue] = useState<RefundStatus>(refundStatus);
  const [refundReasonValue, setRefundReasonValue] = useState(refundReason);
  const [refundNoteValue, setRefundNoteValue] = useState(refundNote);
  const [refundRequestedAtValue, setRefundRequestedAtValue] = useState(refundRequestedAt);
  const [refundedAtValue, setRefundedAtValue] = useState(refundedAt);
  const [reconciliationValue, setReconciliationValue] =
    useState<ReconciliationStatus>(reconciliationStatus);
  const [notesValue, setNotesValue] = useState(notes);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/orders/${orderId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            refundStatus: refundStatusValue,
            refundReason: refundReasonValue || undefined,
            refundNote: refundNoteValue || undefined,
            refundRequestedAt: refundRequestedAtValue || undefined,
            refundedAt: refundedAtValue || undefined,
            reconciliationStatus: reconciliationValue,
            notes: notesValue || undefined,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error ?? "更新訂單失敗");
        }

        setMessage("已更新退款與對帳資訊");
        window.location.reload();
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "更新訂單失敗");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-900">退款狀態</label>
        <select
          value={refundStatusValue}
          onChange={(event) => setRefundStatusValue(event.target.value as RefundStatus)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="none">未申請</option>
          <option value="requested">已申請</option>
          <option value="processing">退款處理中</option>
          <option value="refunded">已退款</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-900">對帳狀態</label>
        <select
          value={reconciliationValue}
          onChange={(event) =>
            setReconciliationValue(event.target.value as ReconciliationStatus)
          }
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="pending">待確認</option>
          <option value="matched">已對帳</option>
          <option value="flagged">異常待處理</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-900">退款原因</label>
        <input
          value={refundReasonValue}
          onChange={(event) => setRefundReasonValue(event.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="例如：重複購買、內容不符需求"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-900">退款備註</label>
        <textarea
          value={refundNoteValue}
          onChange={(event) => setRefundNoteValue(event.target.value)}
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-900">退款申請時間</label>
          <input
            type="datetime-local"
            value={refundRequestedAtValue}
            onChange={(event) => setRefundRequestedAtValue(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-900">退款完成時間</label>
          <input
            type="datetime-local"
            value={refundedAtValue}
            onChange={(event) => setRefundedAtValue(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-900">客服與內部備註</label>
        <textarea
          value={notesValue}
          onChange={(event) => setNotesValue(event.target.value)}
          rows={4}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-green-600">{message}</p> : null}
      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
      >
        {isPending ? "儲存中..." : "更新退款／對帳資訊"}
      </button>
    </div>
  );
}
