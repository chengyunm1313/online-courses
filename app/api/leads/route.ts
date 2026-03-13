import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/session";
import { createAnalyticsEvent, createLeadRecord, getCourseByIdFromStore } from "@/lib/d1-repository";
import { sendLeadMagnetEmail } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      courseId?: string;
      courseTitle?: string;
      email?: string;
      name?: string;
      source?: string;
      couponCode?: string;
    };

    if (!body.courseId || !body.email) {
      return NextResponse.json({ message: "缺少課程或 Email 資料" }, { status: 400 });
    }

    const course = await getCourseByIdFromStore(body.courseId);
    if (!course) {
      return NextResponse.json({ message: "找不到指定課程" }, { status: 404 });
    }

    const session = await getSessionContext();
    const record = await createLeadRecord({
      courseId: course.id,
      email: body.email,
      name: body.name,
      source: body.source || "course_page",
      couponCode: body.couponCode || course.leadMagnetCouponCode,
      userId: session?.userId,
      payload: {
        courseTitle: body.courseTitle || course.title,
      },
    });

    await createAnalyticsEvent({
      eventName: "lead_submitted",
      userId: session?.userId,
      courseId: course.id,
      discountCode: record.couponCode,
      payload: {
        source: record.source,
      },
    });

    await sendLeadMagnetEmail({
      to: record.email,
      courseTitle: course.title,
      couponCode: record.couponCode,
      leadMagnetTitle: course.leadMagnetTitle,
      leadMagnetDescription: course.leadMagnetDescription,
    });

    return NextResponse.json({
      success: true,
      message: record.couponCode
        ? `優惠資訊已寄到 ${record.email}`
        : `已收到您的資料，我們會以 ${record.email} 與您聯繫`,
    });
  } catch (error) {
    console.error("[leads] POST error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "建立 lead 失敗" },
      { status: 500 },
    );
  }
}
