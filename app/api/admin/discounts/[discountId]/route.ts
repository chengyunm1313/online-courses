import { NextResponse } from "next/server";
import {
  normalizeAdminDiscountInput,
  updateDiscountForManagement,
} from "@/lib/admin-data";
import { requireRole } from "@/lib/session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ discountId: string }> },
) {
  try {
    const sessionResult = await requireRole(["admin"]);
    if ("error" in sessionResult) {
      return sessionResult.error;
    }

    const body = await request.json();
    const payload = normalizeAdminDiscountInput((body ?? {}) as Record<string, unknown>);
    const resolvedParams = await params;
    const discount = await updateDiscountForManagement(resolvedParams.discountId, payload);
    return NextResponse.json({ discount });
  } catch (error) {
    console.error("[admin-discounts] PATCH error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新折扣碼失敗" },
      { status: 400 },
    );
  }
}
