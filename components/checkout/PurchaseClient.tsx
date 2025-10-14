"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface PurchaseClientProps {
  course: {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    price: number;
    category: string;
    level: string;
    instructorName: string;
    lessons: number;
    duration: number;
  };
}

interface DiscountResponse {
  code?: string;
  valid: boolean;
  originalPrice: number;
  finalPrice: number;
  discountAmount: number;
  message?: string;
}

const defaultBankInfo = {
  bankName: "範例銀行",
  bankCode: "999",
  accountName: "線上學院股份有限公司",
  accountNumber: "1234567890123",
};

export default function PurchaseClient({ course }: PurchaseClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetCode = searchParams?.get("code") ?? "";

  const [discountCode, setDiscountCode] = useState(presetCode);
  const [finalPrice, setFinalPrice] = useState(course.price);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [appliedCode, setAppliedCode] = useState<string | null>(
    presetCode || null
  );

  const handleApplyDiscount = async () => {
    setIsApplying(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/checkout/discount", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId: course.id,
          code: discountCode.trim(),
        }),
      });

      const data: DiscountResponse = await response.json();

      if (!response.ok || !data.valid) {
        setAppliedCode(null);
        setFinalPrice(data.originalPrice ?? course.price);
        setDiscountAmount(0);
        setError(data.message ?? "折扣碼無效，請再試一次。");
        return;
      }

      setAppliedCode(data.code ?? discountCode.trim());
      setFinalPrice(data.finalPrice);
      setDiscountAmount(data.discountAmount);
      setSuccess(data.message ?? "折扣碼已套用。");
    } catch (err) {
      console.error(err);
      setError("套用折扣碼時發生錯誤，請稍後再試。");
    } finally {
      setIsApplying(false);
    }
  };

  const proceedToCheckout = () => {
    const params = new URLSearchParams();
    params.set("price", String(finalPrice));
    if (appliedCode) params.set("code", appliedCode);
    params.set("discount", String(discountAmount));
    router.push(`/checkout/${course.id}/atm?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">課程購買</h1>
        <p className="text-sm text-gray-600">
          確認課程資料，套用折扣碼後即可前往結帳。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold text-gray-900">
              {course.title}
            </h2>
            <p className="text-sm text-gray-600">{course.description}</p>
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              <span>分類：{course.category}</span>
              <span>
                等級：
                {course.level === "intermediate"
                  ? "中級"
                  : course.level === "advanced"
                  ? "高級"
                  : "初級"}
              </span>
              <span>{course.lessons} 堂課程</span>
              <span>{course.duration} 小時內容</span>
              <span>講師：{course.instructorName}</span>
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>原價</span>
              <span className="font-semibold text-gray-900">
                NT$ {course.price.toLocaleString()}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
              <span>折扣</span>
              <span className="font-semibold text-red-600">
                - NT$ {discountAmount.toLocaleString()}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3 text-base font-semibold text-gray-900">
              <span>應付金額</span>
              <span>NT$ {finalPrice.toLocaleString()}</span>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">折扣碼</h3>
            <p className="text-sm text-gray-600">
              若您擁有折扣碼，請輸入後套用。未輸入則以原價計算。
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="text"
              value={discountCode}
              onChange={(event) => setDiscountCode(event.target.value)}
              placeholder="輸入折扣碼"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleApplyDiscount}
              disabled={isApplying}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isApplying ? "套用中..." : "套用折扣碼"}
            </button>
          </div>

          {success ? (
            <p className="text-sm text-green-600">{success}</p>
          ) : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            <p className="font-semibold text-gray-800">付款方式</p>
            <p className="mt-1">目前僅提供 ATM 轉帳：</p>
            <ul className="mt-2 space-y-1 text-gray-600">
              <li>銀行：{defaultBankInfo.bankName}</li>
              <li>銀行代碼：{defaultBankInfo.bankCode}</li>
              <li>帳戶名稱：{defaultBankInfo.accountName}</li>
              <li>帳號：{defaultBankInfo.accountNumber}</li>
            </ul>
            <p className="mt-2 text-xs text-gray-500">
              匯款完成後請於結帳頁點擊「確認匯款」完成購買。
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={proceedToCheckout}
              className="inline-flex items-center rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              前往結帳
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
