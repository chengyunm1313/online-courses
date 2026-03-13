import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { updateAppUserRole, type AppRole } from "@/lib/d1-repository";

const UPDATABLE_ROLES = new Set(["instructor", "student"]);

/**
 * 更新使用者角色
 */
export async function PATCH(request: NextRequest) {
  try {
    const sessionResult = await requireRole(["admin"]);
    if ("error" in sessionResult) {
      return sessionResult.error;
    }

    const { userId, role } = await request.json();

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "缺少使用者 ID" }, { status: 400 });
    }

    if (!role || typeof role !== "string" || !UPDATABLE_ROLES.has(role)) {
      return NextResponse.json(
        { error: "僅能指派講師或學生角色" },
        { status: 400 },
      );
    }

    await updateAppUserRole(userId, role as AppRole);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin-users] Failed to update role:", error);
    return NextResponse.json({ error: "更新失敗，請稍後再試" }, { status: 500 });
  }
}
