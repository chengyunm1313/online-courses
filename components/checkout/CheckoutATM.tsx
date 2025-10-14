"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import type { DiscountResult } from "@/lib/checkout";

interface CheckoutATMProps {
  courseId: string;
  courseSummary: {
    title: string;
    category: string;
    level: string;
    thumbnail: string;
    lessons: number;
    duration: number;
    instructorName: string;
  };
  pricing: DiscountResult;
}

const atmInfo = {
  bank: "範例銀行",
  bankCode: "999",
  accountName: "線上學院股份有限公司",
  accountNumber: "1234567890123",
  note: "請於 3 天內完成匯款，逾期訂單將自動取消。",
};

function levelLabel(level: string) {
  if (level === "intermediate") return "中級";
  if (level === "advanced") return "高級";
  return "初級";
}

export default function CheckoutATM({ courseId, courseSummary, pricing }: CheckoutATMProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleConfirmTransfer = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/enrollments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ courseId }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "完成報名時發生錯誤。");
      }

      setSuccess("已確認匯款，課程已加入您的學習清單！");
      setTimeout(() => {
        router.push("/learning");
        router.refresh();
      }, 800);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "完成報名時發生錯誤。請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">ATM 轉帳結帳</h1>
        <p className="text-sm text-gray-600">
          請依指示完成匯款，匯款後按下確認即可完成購買。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">課程資訊</h2>
          <div className="flex gap-4">
            <div className="relative h-24 w-32 flex-shrink-0 overflow-hidden rounded-lg">
              <Image
                src={courseSummary.thumbnail}
                alt={courseSummary.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-gray-900">{courseSummary.title}</p>
              <p className="text-gray-600">
                {courseSummary.category} · {levelLabel(courseSummary.level)}
              </p>
              <p className="text-gray-600">
                {courseSummary.lessons} 堂課 · {courseSummary.duration} 小時
              </p>
              <p className="text-gray-600">講師：{courseSummary.instructorName}</p>
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>原價</span>
              <span className="font-semibold text-gray-900">
                NT$ {pricing.originalPrice.toLocaleString()}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
              <span>折扣</span>
              <span className="font-semibold text-red-600">
                - NT$ {pricing.discountAmount.toLocaleString()}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3 text-base font-semibold text-gray-900">
              <span>應付金額</span>
              <span>NT$ {pricing.finalPrice.toLocaleString()}</span>
            </div>
            {pricing.code ? (
              <p className="mt-2 text-xs text-gray-500">折扣碼：{pricing.code}</p>
            ) : null}
          </div>
        </section>

        <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">ATM 匯款資訊</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>
              <span className="font-semibold text-gray-900">銀行名稱：</span>
              {atmInfo.bank}
            </li>
            <li>
              <span className="font-semibold text-gray-900">銀行代碼：</span>
              {atmInfo.bankCode}
            </li>
            <li>
              <span className="font-semibold text-gray-900">帳戶名稱：</span>
              {atmInfo.accountName}
            </li>
            <li>
              <span className="font-semibold text-gray-900">匯款帳號：</span>
              {atmInfo.accountNumber}
            </li>
          </ul>
          <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">
            <p>請在匯款時於備註欄填寫：「{courseId}」。</p>
            <p className="mt-1 text-xs text-blue-600">{atmInfo.note}</p>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {success ? <p className="text-sm text-green-600">{success}</p> : null}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleConfirmTransfer}
              disabled={isSubmitting}
              className="inline-flex items-center rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isSubmitting ? "確認中..." : "完成匯款並完成購買"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
