import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { createOrder } from "@/lib/orders";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const { courseId } = await request.json();

    if (!courseId || typeof courseId !== "string") {
      return NextResponse.json({ error: "缺少課程編號" }, { status: 400 });
    }

    const courseDoc = await adminDb.collection("courses").doc(courseId).get();

    if (!courseDoc.exists) {
      return NextResponse.json({ error: "找不到課程" }, { status: 404 });
    }

    const courseData = courseDoc.data() ?? {};

    if (!courseData.published) {
      return NextResponse.json({ error: "課程尚未開放報名" }, { status: 400 });
    }

    const enrollmentId = `${session.user.id}_${courseId}`;
    const enrollmentRef = adminDb.collection("enrollments").doc(enrollmentId);
    const existing = await enrollmentRef.get();

    if (existing.exists) {
      return NextResponse.json({ success: true, message: "已加入學習清單" });
    }

    const now = new Date();

    await enrollmentRef.set({
      courseId,
      courseTitle: courseData.title ?? "",
      userId: session.user.id,
      userEmail: session.user.email ?? "",
      userName: session.user.name ?? "",
      createdAt: now,
      lastAccessed: now,
      progress: 0,
      status: "active",
    });

    await adminDb
      .collection("courses")
      .doc(courseId)
      .set(
        {
          studentsEnrolled: FieldValue.increment(1),
          updatedAt: now,
        },
        { merge: true }
      );

    // 創建訂單記錄
    try {
      const coursePrice = courseData.price ?? 0;
      const tax = Math.round(coursePrice * 0.05); // 5% 稅金
      const total = coursePrice + tax;

      await createOrder({
        userId: session.user.id,
        userName: session.user.name ?? "",
        userEmail: session.user.email ?? "",
        items: [
          {
            courseId,
            courseTitle: courseData.title ?? "",
            courseThumbnail: courseData.thumbnail ?? "/placeholder-course.jpg",
            instructor: courseData.instructorName ?? "Unknown",
            price: coursePrice,
          },
        ],
        subtotal: coursePrice,
        tax,
        total,
        status: "completed",
        paymentMethod: "bank_transfer",
        transactionId: `TXN-${Date.now()}-${session.user.id.slice(0, 8)}`,
        createdAt: now,
        updatedAt: now,
        completedAt: now,
        notes: "課程購買成功",
      });
    } catch (orderError) {
      console.error("[enrollments] Failed to create order:", orderError);
      // 訂單創建失敗不影響報名成功
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[enrollments] POST error:", error);
    const message =
      error instanceof Error ? error.message : "報名失敗，請稍後再試";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
