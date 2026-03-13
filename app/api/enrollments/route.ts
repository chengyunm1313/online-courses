import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPublishedCourseById } from "@/lib/public-courses";
import { createEnrollmentRecord, getEnrollmentByUserAndCourse } from "@/lib/d1-repository";
import { createOrder } from "@/lib/orders";
import { sendEnrollmentConfirmedEmail } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const { courseId } = await request.json();
    if (!courseId || typeof courseId !== "string") {
      return NextResponse.json({ error: "缺少課程編號" }, { status: 400 });
    }

    const course = await getPublishedCourseById(courseId);
    if (!course) {
      return NextResponse.json({ error: "找不到課程" }, { status: 404 });
    }

    const existing = await getEnrollmentByUserAndCourse(session.user.id, courseId);
    if (existing) {
      return NextResponse.json({ success: true, message: "已加入學習清單" });
    }

    const orderId = await createOrder({
      userId: session.user.id,
      userName: session.user.name ?? "",
      userEmail: session.user.email ?? "",
      items: [
        {
          courseId: course.id,
          courseTitle: course.title,
          courseThumbnail: course.thumbnail,
          instructor: course.instructor.name,
          price: course.price,
        },
      ],
      subtotal: course.price,
      tax: 0,
      total: course.price,
      status: "completed",
      paymentMethod: "bank_transfer",
      transactionId: `TXN-${Date.now()}-${session.user.id.slice(0, 8)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: new Date(),
      notes: "課程購買成功",
    });

    await createEnrollmentRecord({
      userId: session.user.id,
      courseId,
      orderId,
      courseTitleSnapshot: course.title,
    });

    if (session.user.email) {
      void sendEnrollmentConfirmedEmail({
        orderId,
        to: session.user.email,
        courseTitles: [course.title],
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[enrollments] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "報名失敗，請稍後再試" },
      { status: 500 },
    );
  }
}
