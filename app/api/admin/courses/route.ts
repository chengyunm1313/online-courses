import { NextResponse } from "next/server";
import {
  createCourseForManagement,
  listCoursesForManagement,
  normalizeAdminCourseInput,
} from "@/lib/admin-data";
import { requireRole } from "@/lib/session";

export async function GET() {
  const sessionResult = await requireRole(["admin", "instructor"]);
  if ("error" in sessionResult) {
    return sessionResult.error;
  }

  const courses = await listCoursesForManagement({
    role: sessionResult.context.role,
    userId: sessionResult.context.userId,
  });

  return NextResponse.json({ courses });
}

export async function POST(request: Request) {
  try {
    const sessionResult = await requireRole(["admin", "instructor"]);
    if ("error" in sessionResult) {
      return sessionResult.error;
    }

    const body = await request.json();
    const payload = normalizeAdminCourseInput((body ?? {}) as Record<string, unknown>);

    const course = await createCourseForManagement(payload, {
      role: sessionResult.context.role,
      userId: sessionResult.context.userId,
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error("[admin-courses] POST error:", error);
    const message =
      error instanceof Error ? error.message : "建立課程失敗，請稍後再試";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
