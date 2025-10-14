import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  deleteCourseForManagement,
  getCourseForManagement,
  updateCourseForManagement,
  type AdminCourseInput,
  type AdminCourseLesson,
  type AdminCourseModule,
} from "@/lib/admin-data";

/**
 * 深度移除物件中的所有 undefined 值
 * Firestore 不允許 undefined 值
 * 使用 JSON 序列化來移除所有 undefined 值
 */
function removeUndefined<T>(obj: T): T {
  // 使用 JSON.stringify 的 replacer 函數來移除 undefined
  const jsonString = JSON.stringify(obj, (key, value) => {
    // 保留 null，但移除 undefined
    return value === undefined ? null : value;
  });

  return JSON.parse(jsonString) as T;
}

function normalizePayload(body: Record<string, unknown>): AdminCourseInput {
  const tagsRaw = body.tags;
  const tags = Array.isArray(tagsRaw)
    ? tagsRaw
    : typeof tagsRaw === "string"
    ? tagsRaw.split(",")
    : [];

  return {
    title: String(body.title ?? ""),
    description: typeof body.description === "string" ? body.description : undefined,
    thumbnail: typeof body.thumbnail === "string" ? body.thumbnail : undefined,
    price:
      typeof body.price === "number"
        ? body.price
        : Number(body.price ?? 0) || 0,
    category: typeof body.category === "string" ? body.category : undefined,
    level:
      body.level === "beginner" || body.level === "intermediate" || body.level === "advanced"
        ? body.level
        : undefined,
    duration:
      typeof body.duration === "number"
        ? body.duration
        : Number(body.duration ?? 0) || 0,
    lessons:
      typeof body.lessons === "number"
        ? body.lessons
        : Number(body.lessons ?? 0) || 0,
    tags: tags.map((tag) => String(tag).trim()).filter(Boolean),
    published: Boolean(body.published),
    instructorId:
      typeof body.instructorId === "string" ? body.instructorId : undefined,
    modules: Array.isArray(body.modules) ? (body.modules as AdminCourseModule[]) : undefined,
    syllabus: Array.isArray(body.syllabus) ? (body.syllabus as AdminCourseLesson[]) : undefined,
  };
}

async function resolveSession() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.role) {
    return { error: NextResponse.json({ error: "未授權" }, { status: 401 }) };
  }

  if (!["admin", "instructor"].includes(session.user.role)) {
    return { error: NextResponse.json({ error: "沒有權限" }, { status: 403 }) };
  }

  return {
    session,
    context: {
      role: session.user.role,
      userId: session.user.id,
    },
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const sessionResult = await resolveSession();
  if ("error" in sessionResult) {
    return sessionResult.error;
  }

  const { context } = sessionResult;
  const resolvedParams = await params;
  const course = await getCourseForManagement(resolvedParams.courseId, context);

  if (!course) {
    return NextResponse.json({ error: "找不到課程" }, { status: 404 });
  }

  return NextResponse.json({ course });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const resolvedParams = await params;
  try {
    const sessionResult = await resolveSession();
    if ("error" in sessionResult) {
      return sessionResult.error;
    }

    const { context } = sessionResult;
    const body = await request.json();
    const payload = normalizePayload(body ?? {});

    // 移除所有 undefined 值以符合 Firestore 要求
    const cleanedPayload = removeUndefined(payload);

    const course = await updateCourseForManagement(resolvedParams.courseId, cleanedPayload, context);
    return NextResponse.json({ course });
  } catch (error) {
    console.error("[admin-courses] PATCH error:", error);
    const message =
      error instanceof Error ? error.message : "更新課程失敗，請稍後再試";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const resolvedParams = await params;
  try {
    const sessionResult = await resolveSession();
    if ("error" in sessionResult) {
      return sessionResult.error;
    }

    const { context } = sessionResult;

    await deleteCourseForManagement(resolvedParams.courseId, context);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin-courses] DELETE error:", error);
    const message =
      error instanceof Error ? error.message : "刪除課程失敗，請稍後再試";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
