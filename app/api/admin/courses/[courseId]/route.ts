import { NextResponse } from "next/server";
import {
  deleteCourseForManagement,
  getCourseForManagement,
  normalizeAdminCourseInput,
  updateCourseForManagement,
} from "@/lib/admin-data";
import { requireRole } from "@/lib/session";

async function resolveSession() {
  return requireRole(["admin", "instructor"]);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const sessionResult = await resolveSession();
  if ("error" in sessionResult) {
    return sessionResult.error;
  }

  const resolvedParams = await params;
  const course = await getCourseForManagement(resolvedParams.courseId, sessionResult.context);

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

    const body = await request.json();
    const payload = normalizeAdminCourseInput((body ?? {}) as Record<string, unknown>);
    const course = await updateCourseForManagement(
      resolvedParams.courseId,
      payload,
      sessionResult.context,
    );

    return NextResponse.json({ course });
  } catch (error) {
    console.error("[admin-courses] PATCH error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新課程失敗" },
      { status: 400 },
    );
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

    await deleteCourseForManagement(resolvedParams.courseId, sessionResult.context);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin-courses] DELETE error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "刪除課程失敗" },
      { status: 400 },
    );
  }
}
