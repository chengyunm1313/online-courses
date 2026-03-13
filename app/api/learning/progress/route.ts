import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getEnrollmentStatusForUser,
  updateLessonProgressForUser,
} from "@/lib/enrollments";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const body = (await request.json()) as {
      courseId?: string;
      lessonId?: string;
      completed?: boolean;
      lastPosition?: number;
    };

    if (!body.courseId || !body.lessonId) {
      return NextResponse.json({ error: "缺少課程或課堂資訊" }, { status: 400 });
    }

    const enrollment = await getEnrollmentStatusForUser(body.courseId, session.user.id);
    if (!enrollment) {
      return NextResponse.json({ error: "尚未購買此課程" }, { status: 403 });
    }

    await updateLessonProgressForUser({
      courseId: body.courseId,
      lessonId: body.lessonId,
      userId: session.user.id,
      completed: Boolean(body.completed),
      lastPosition: body.lastPosition,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[learning-progress] POST error:", error);
    return NextResponse.json({ error: "更新學習進度失敗" }, { status: 500 });
  }
}
