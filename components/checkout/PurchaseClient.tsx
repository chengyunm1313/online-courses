"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { trackCheckoutEvent } from "@/lib/analytics";
import SalesLeadCapture from "@/components/courses/SalesLeadCapture";

interface PurchaseClientProps {
  course: {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    price: number;
    originalPrice: number;
    currentPrice: number;
    discountLabel?: string;
    nextPrice?: number;
    nextTierName?: string;
    nextTransitionAt?: string;
    countdownEndsAt?: string;
    canPurchase: boolean;
    requiresWaitlist: boolean;
    salesStatusLabel: string;
    soldCount: number;
    remainingSeats?: number;
    category: string;
    level: string;
    instructorName: string;
    lessons: number;
    duration: number;
    salesMode: "evergreen" | "launch";
    salesStatus: "draft" | "waitlist" | "selling" | "closed";
    launchStartsAt?: string;
    leadMagnetEnabled: boolean;
    leadMagnetTitle?: string;
    leadMagnetDescription?: string;
    leadMagnetCouponCode?: string;
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

function formatDateTime(value?: string) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getTimeLeft(target?: string) {
  if (!target) {
    return null;
  }
  const end = new Date(target).getTime();
  if (Number.isNaN(end)) {
    return null;
  }
  const diff = end - Date.now();
  if (diff <= 0) {
    return "00:00:00";
  }

  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

export default function PurchaseClient({ course }: PurchaseClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetCode = searchParams?.get("coupon") ?? searchParams?.get("code") ?? "";

  const [discountCode, setDiscountCode] = useState(presetCode);
  const [finalPrice, setFinalPrice] = useState(course.currentPrice);
  const [discountAmount, setDiscountAmount] = useState(
    Math.max(course.originalPrice - course.currentPrice, 0),
  );
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [countdownLabel, setCountdownLabel] = useState(() => getTimeLeft(course.countdownEndsAt));
  const trackedViewRef = useRef(false);
  const popupTrackedRef = useRef(false);

  useEffect(() => {
    if (trackedViewRef.current) {
      return;
    }
    trackedViewRef.current = true;
    void trackCheckoutEvent({
      eventName: "purchase_page_view",
      courseId: course.id,
      amount: course.currentPrice,
    });
  }, [course.currentPrice, course.id]);

  useEffect(() => {
    if (!course.countdownEndsAt) {
      return;
    }
    const timer = window.setInterval(() => {
      setCountdownLabel(getTimeLeft(course.countdownEndsAt));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [course.countdownEndsAt]);

  useEffect(() => {
    if (!presetCode) {
      return;
    }
    setAppliedCode(presetCode.toUpperCase());
    void handleApplyDiscount(presetCode);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetCode]);

  useEffect(() => {
    const key = `coupon-popup-shown:${course.id}`;
    if (window.sessionStorage.getItem(key)) {
      return;
    }

    const showPopup = () => {
      if (popupTrackedRef.current || !course.leadMagnetEnabled) {
        return;
      }
      popupTrackedRef.current = true;
      window.sessionStorage.setItem(key, "1");
      setPopupOpen(true);
      void trackCheckoutEvent({
        eventName: "coupon_popup_shown",
        courseId: course.id,
        discountCode: course.leadMagnetCouponCode,
      });
    };

    const onMouseLeave = (event: MouseEvent) => {
      if (event.clientY > 40) {
        return;
      }
      showPopup();
    };

    const onScroll = () => {
      if (window.scrollY < 640) {
        return;
      }
      showPopup();
    };

    const dwellTimer = window.setTimeout(() => {
      showPopup();
    }, 12_000);

    document.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(dwellTimer);
      document.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("scroll", onScroll);
    };
  }, [course.id, course.leadMagnetCouponCode, course.leadMagnetEnabled]);

  async function handleApplyDiscount(nextCode = discountCode) {
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
          code: nextCode.trim(),
        }),
      });

      const data: DiscountResponse = await response.json();

      if (!response.ok || !data.valid) {
        setAppliedCode(null);
        setFinalPrice(data.originalPrice ?? course.currentPrice);
        setDiscountAmount(0);
        setError(data.message ?? "折扣碼無效，請再試一次。");
        return;
      }

      setAppliedCode((data.code ?? nextCode.trim()).toUpperCase());
      setFinalPrice(data.finalPrice);
      setDiscountAmount(data.discountAmount);
      setSuccess(data.message ?? "折扣碼已套用。");
      void trackCheckoutEvent({
        eventName: "discount_applied",
        courseId: course.id,
        discountCode: data.code ?? nextCode.trim(),
        amount: data.discountAmount,
      });
    } catch (applyError) {
      console.error(applyError);
      setError("套用折扣碼時發生錯誤，請稍後再試。");
    } finally {
      setIsApplying(false);
    }
  }

  function proceedToCheckout() {
    try {
      setError(null);

      const cartData = {
        courseIds: [course.id],
        discountCode: appliedCode ?? undefined,
        items: [
          {
            courseId: course.id,
            courseTitle: course.title,
            courseThumbnail: course.thumbnail,
            price: course.currentPrice,
            instructor: course.instructorName,
          },
        ],
        paymentMethod: "CREDIT",
        subtotal: course.currentPrice,
        discountAmount,
        tax: 0,
        total: finalPrice,
        notes: appliedCode ? `折扣碼: ${appliedCode}` : undefined,
      };

      sessionStorage.setItem("checkoutCart", JSON.stringify(cartData));
      void trackCheckoutEvent({
        eventName: "checkout_started",
        courseId: course.id,
        discountCode: appliedCode ?? undefined,
        amount: finalPrice,
      });
      router.push("/checkout/ecpay");
    } catch (checkoutError) {
      console.error(checkoutError);
      setError("前往結帳時發生錯誤，請稍後重試。");
    }
  }

  function handleCountdownClick() {
    if (!course.countdownEndsAt) {
      return;
    }
    void trackCheckoutEvent({
      eventName: "countdown_clicked",
      courseId: course.id,
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">課程購買</h1>
        <p className="text-sm text-gray-600">
          先確認目前優惠與販售狀態，再決定是否立即結帳或先索取優惠提醒。
        </p>
      </div>

      {course.countdownEndsAt && countdownLabel ? (
        <button
          type="button"
          onClick={handleCountdownClick}
          className="flex w-full items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-left"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">限時優惠倒數</p>
            <p className="mt-1 text-sm text-amber-900">
              {course.discountLabel || "目前優惠"} 將於 {formatDateTime(course.countdownEndsAt) || "稍後"} 結束
            </p>
          </div>
          <span className="rounded-xl bg-amber-100 px-4 py-2 text-lg font-bold text-amber-900">
            {countdownLabel}
          </span>
        </button>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {course.salesStatusLabel}
              </span>
              {course.discountLabel ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {course.discountLabel}
                </span>
              ) : null}
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">{course.title}</h2>
            <p className="text-sm leading-6 text-gray-600">{course.description}</p>
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              <span>分類：{course.category}</span>
              <span>講師：{course.instructorName}</span>
              <span>{course.lessons} 堂課</span>
              <span>{course.duration} 小時</span>
              <span>已售／已註冊：{course.soldCount.toLocaleString()}</span>
              {typeof course.remainingSeats === "number" ? (
                <span>剩餘名額：{course.remainingSeats.toLocaleString()}</span>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 px-6 py-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                {course.originalPrice > course.currentPrice ? (
                  <p className="text-sm text-slate-500 line-through">
                    NT$ {course.originalPrice.toLocaleString()}
                  </p>
                ) : null}
                <p className="mt-1 text-3xl font-bold text-slate-950">
                  NT$ {course.currentPrice.toLocaleString()}
                </p>
              </div>
              {course.nextPrice && course.nextTierName ? (
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-right">
                  <p className="text-xs font-semibold text-slate-500">下一階價格</p>
                  <p className="mt-1 text-base font-bold text-slate-900">
                    {course.nextTierName} NT$ {course.nextPrice.toLocaleString()}
                  </p>
                  {course.nextTransitionAt ? (
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(course.nextTransitionAt)}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <div className="flex items-center justify-between">
                <span>本期售價</span>
                <span className="font-semibold">NT$ {course.currentPrice.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>折扣碼讓利</span>
                <span className="font-semibold text-rose-600">
                  - NT$ {discountAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-950">
                <span>目前應付</span>
                <span>NT$ {finalPrice.toLocaleString()}</span>
              </div>
              {appliedCode ? (
                <p className="text-xs font-medium text-blue-700">已套用折扣碼：{appliedCode}</p>
              ) : null}
            </div>
          </div>

          {course.canPurchase ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">折扣碼</h3>
                <p className="text-sm text-gray-600">
                  支援網址自動帶入優惠碼，也可手動輸入折扣碼再前往結帳。
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={discountCode}
                  onChange={(event) => setDiscountCode(event.target.value.toUpperCase())}
                  placeholder="輸入折扣碼"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleApplyDiscount()}
                  disabled={isApplying}
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isApplying ? "套用中..." : "套用折扣碼"}
                </button>
              </div>

              {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm leading-7 text-blue-900">
                <p className="font-semibold">購買說明</p>
                <ul className="mt-2 space-y-1 text-blue-900/90">
                  <li>付款成功後立即開通課程，可從「我的學習」開始上課。</li>
                  <li>價格依本期方案與折扣碼結算，所有交易皆為數位內容，不涉及配送。</li>
                  <li>若需人工退款，請先閱讀退款政策並透過客服表單聯繫。</li>
                </ul>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={proceedToCheckout}
                  className="inline-flex items-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  前往結帳
                </button>
              </div>
            </div>
          ) : (
            <SalesLeadCapture
              mode="waitlist"
              courseId={course.id}
              courseTitle={course.title}
              title={course.salesStatus === "closed" ? "本期已結束，先加入等待名單" : "尚未開賣，先加入等待名單"}
              description="留下 Email 後，下一波開賣、補班次或名額釋出時會優先通知您。"
              launchStartsAt={course.launchStartsAt}
              source="purchase_page_waitlist"
            />
          )}
        </section>

        <aside className="space-y-4">
          {course.leadMagnetEnabled ? (
            <SalesLeadCapture
              mode="lead"
              courseId={course.id}
              courseTitle={course.title}
              title={course.leadMagnetTitle || "留下 Email 取得優惠與提醒"}
              description={
                course.leadMagnetDescription ||
                "如果您還在比較課程內容，可先留下 Email，我們會寄送本次優惠碼與後續提醒。"
              }
              couponCode={course.leadMagnetCouponCode}
              source="purchase_page_lead"
              compact
            />
          ) : null}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">成交訊號</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-950">社會證明</p>
                <p className="mt-1">
                  目前已有 {course.soldCount.toLocaleString()} 位學員加入，適合想在短期內完成實作與系統化學習的學員。
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-950">稀缺性</p>
                <p className="mt-1">
                  {typeof course.remainingSeats === "number"
                    ? `剩餘名額約 ${course.remainingSeats.toLocaleString()} 席，售完後將依下一階價格或下一期開賣規則處理。`
                    : "本課程目前採限時價格策略，建議在本波優惠結束前完成報名。"}
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {popupOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                  限時提醒
                </p>
                <h3 className="mt-2 text-2xl font-bold text-slate-950">
                  先留下 Email，再決定要不要現在購買
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPopupOpen(false)}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-600"
              >
                關閉
              </button>
            </div>
            <div className="mt-4">
              <SalesLeadCapture
                mode="lead"
                courseId={course.id}
                courseTitle={course.title}
                title={course.leadMagnetTitle || "索取優惠與後續提醒"}
                description={
                  course.leadMagnetDescription ||
                  "送出後會把本次優惠與課程提醒寄到您的信箱。"
                }
                couponCode={course.leadMagnetCouponCode}
                source="exit_intent"
                buttonLabel="寄送優惠到信箱"
                compact
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (course.leadMagnetCouponCode) {
                  setDiscountCode(course.leadMagnetCouponCode);
                  setAppliedCode(course.leadMagnetCouponCode);
                  void trackCheckoutEvent({
                    eventName: "coupon_popup_claimed",
                    courseId: course.id,
                    discountCode: course.leadMagnetCouponCode,
                  });
                  void handleApplyDiscount(course.leadMagnetCouponCode);
                }
                setPopupOpen(false);
              }}
              className="mt-4 inline-flex items-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              直接套用優惠並繼續購買
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
