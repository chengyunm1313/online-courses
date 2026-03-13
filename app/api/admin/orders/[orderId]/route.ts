import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { updateOrderOperations } from "@/lib/orders";
import type { ReconciliationStatus, RefundStatus } from "@/types/order";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const sessionResult = await requireRole(["admin"]);
    if ("error" in sessionResult) {
      return sessionResult.error;
    }

    const body = (await request.json()) as {
      refundStatus?: RefundStatus;
      refundReason?: string;
      refundNote?: string;
      refundRequestedAt?: string;
      refundedAt?: string;
      reconciliationStatus?: ReconciliationStatus;
      notes?: string;
    };
    const resolvedParams = await params;

    await updateOrderOperations({
      orderId: resolvedParams.orderId,
      refundStatus: body.refundStatus,
      refundReason: body.refundReason,
      refundNote: body.refundNote,
      refundRequestedAt: body.refundRequestedAt ? new Date(body.refundRequestedAt) : undefined,
      refundedAt: body.refundedAt ? new Date(body.refundedAt) : undefined,
      reconciliationStatus: body.reconciliationStatus,
      notes: body.notes,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin-orders] PATCH error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新訂單失敗" },
      { status: 400 },
    );
  }
}
