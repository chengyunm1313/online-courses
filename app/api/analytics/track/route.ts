import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/session";
import { createAnalyticsEvent } from "@/lib/d1-repository";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      eventName?: string;
      sessionId?: string;
      courseId?: string;
      orderId?: string;
      discountCode?: string;
      paymentMethod?: string;
      amount?: number;
      payload?: Record<string, unknown>;
    };

    if (!body.eventName || typeof body.eventName !== "string") {
      return NextResponse.json({ error: "缺少事件名稱" }, { status: 400 });
    }

    const session = await getSessionContext();
    await createAnalyticsEvent({
      eventName: body.eventName,
      userId: session?.userId,
      sessionId: typeof body.sessionId === "string" ? body.sessionId : undefined,
      courseId: typeof body.courseId === "string" ? body.courseId : undefined,
      orderId: typeof body.orderId === "string" ? body.orderId : undefined,
      discountCode: typeof body.discountCode === "string" ? body.discountCode : undefined,
      paymentMethod: typeof body.paymentMethod === "string" ? body.paymentMethod : undefined,
      amount: typeof body.amount === "number" ? body.amount : undefined,
      payload: body.payload,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[analytics-track] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "追蹤事件失敗" },
      { status: 500 },
    );
  }
}
