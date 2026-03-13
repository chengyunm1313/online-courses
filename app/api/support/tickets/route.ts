import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/session";
import { createSupportTicket } from "@/lib/d1-repository";
import type { SupportTicketCategory } from "@/types/support";

const ALLOWED_CATEGORIES: SupportTicketCategory[] = [
  "payment",
  "refund",
  "course",
  "account",
  "other",
];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      category?: SupportTicketCategory;
      subject?: string;
      message?: string;
      orderId?: string;
    };

    if (!body.name?.trim() || !body.email?.trim() || !body.subject?.trim() || !body.message?.trim()) {
      return NextResponse.json({ error: "請完整填寫姓名、Email、主旨與問題說明" }, { status: 400 });
    }

    const category = ALLOWED_CATEGORIES.includes(body.category ?? "other")
      ? (body.category ?? "other")
      : "other";
    const session = await getSessionContext();
    const id = await createSupportTicket({
      name: body.name.trim(),
      email: body.email.trim(),
      category,
      subject: body.subject.trim(),
      message: body.message.trim(),
      orderId: body.orderId?.trim() || undefined,
      userId: session?.userId,
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("[support-tickets] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "建立客服單失敗" },
      { status: 500 },
    );
  }
}
