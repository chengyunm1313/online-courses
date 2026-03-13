import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/session";
import {
  createAnalyticsEvent,
  createWaitlistRecord,
  getCourseByIdFromStore,
} from "@/lib/d1-repository";
import { sendWaitlistConfirmationEmail } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      courseId?: string;
      email?: string;
      name?: string;
      source?: string;
      launchStartsAt?: string;
    };

    if (!body.courseId || !body.email) {
      return NextResponse.json({ message: "缺少課程或 Email 資料" }, { status: 400 });
    }

    const course = await getCourseByIdFromStore(body.courseId);
    if (!course) {
      return NextResponse.json({ message: "找不到指定課程" }, { status: 404 });
    }

    const session = await getSessionContext();
    const record = await createWaitlistRecord({
      courseId: course.id,
      email: body.email,
      name: body.name,
      source: body.source || "waitlist",
      userId: session?.userId,
      payload: {
        launchStartsAt: body.launchStartsAt || course.launchStartsAt,
      },
    });

    await createAnalyticsEvent({
      eventName: "waitlist_joined",
      userId: session?.userId,
      courseId: course.id,
      payload: {
        source: record.source,
      },
    });

    await sendWaitlistConfirmationEmail({
      to: record.email,
      courseTitle: course.title,
      launchStartsAt: course.launchStartsAt,
    });

    return NextResponse.json({
      success: true,
      message: `已加入等待名單，之後會通知 ${record.email}`,
    });
  } catch (error) {
    console.error("[waitlists] POST error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "加入等待名單失敗" },
      { status: 500 },
    );
  }
}
