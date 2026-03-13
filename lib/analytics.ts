"use client";

interface TrackCheckoutEventInput {
  eventName:
    | "purchase_page_view"
    | "discount_applied"
    | "checkout_started";
  courseId?: string;
  orderId?: string;
  discountCode?: string;
  paymentMethod?: string;
  amount?: number;
  payload?: Record<string, unknown>;
}

const SESSION_STORAGE_KEY = "checkoutAnalyticsSessionId";

function getAnalyticsSessionId(): string {
  const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const nextId = crypto.randomUUID();
  window.localStorage.setItem(SESSION_STORAGE_KEY, nextId);
  return nextId;
}

export async function trackCheckoutEvent(input: TrackCheckoutEventInput) {
  try {
    const body = JSON.stringify({
      ...input,
      sessionId: getAnalyticsSessionId(),
    });

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/analytics/track", blob);
      return;
    }

    await fetch("/api/analytics/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
      keepalive: true,
    });
  } catch (error) {
    console.error("[analytics] 無法追蹤事件", error);
  }
}
