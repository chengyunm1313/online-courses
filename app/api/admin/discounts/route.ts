import { NextResponse } from "next/server";
import {
  createDiscountForManagement,
  listDiscountsForManagement,
  normalizeAdminDiscountInput,
} from "@/lib/admin-data";
import { requireRole } from "@/lib/session";

export async function GET() {
  const sessionResult = await requireRole(["admin"]);
  if ("error" in sessionResult) {
    return sessionResult.error;
  }

  const discounts = await listDiscountsForManagement();
  return NextResponse.json({ discounts });
}

export async function POST(request: Request) {
  try {
    const sessionResult = await requireRole(["admin"]);
    if ("error" in sessionResult) {
      return sessionResult.error;
    }

    const body = await request.json();
    const payload = normalizeAdminDiscountInput((body ?? {}) as Record<string, unknown>);
    const discount = await createDiscountForManagement(payload);
    return NextResponse.json({ discount }, { status: 201 });
  } catch (error) {
    console.error("[admin-discounts] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "建立折扣碼失敗" },
      { status: 400 },
    );
  }
}
