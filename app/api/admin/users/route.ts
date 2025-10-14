import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";

const UPDATABLE_ROLES = new Set(["instructor", "student"]);

/**
 * 更新使用者角色
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "沒有權限執行此操作" }, { status: 403 });
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

    await adminDb.collection("users").doc(userId).set(
      {
        role,
        updatedAt: new Date(),
      },
      { merge: true },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin-users] Failed to update role:", error);
    return NextResponse.json({ error: "更新失敗，請稍後再試" }, { status: 500 });
  }
}
