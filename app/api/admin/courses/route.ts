import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createCourseForManagement,
  listCoursesForManagement,
  type AdminCourseInput,
  type AdminCourseLesson,
  type AdminCourseModule,
} from "@/lib/admin-data";

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

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.role) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  if (!["admin", "instructor"].includes(session.user.role)) {
    return NextResponse.json({ error: "沒有權限" }, { status: 403 });
  }

  const courses = await listCoursesForManagement({
    role: session.user.role,
    userId: session.user.id,
  });

  return NextResponse.json({ courses });
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.role) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    if (!["admin", "instructor"].includes(session.user.role)) {
      return NextResponse.json({ error: "沒有權限" }, { status: 403 });
    }

    const body = await request.json();
    const payload = normalizePayload(body ?? {});

    const course = await createCourseForManagement(payload, {
      role: session.user.role,
      userId: session.user.id,
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error("[admin-courses] POST error:", error);
    const message =
      error instanceof Error ? error.message : "建立課程失敗，請稍後再試";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
