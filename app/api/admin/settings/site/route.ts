import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { getSiteSettings, updateSiteSettings } from "@/lib/site-settings";

function normalizeText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function GET() {
  await requireRole(["admin"]);
  const settings = await getSiteSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  await requireRole(["admin"]);

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "請提供設定內容" }, { status: 400 });
  }

  const platformName = normalizeText(body.platformName);
  const supportEmail = normalizeText(body.supportEmail);

  if (!platformName) {
    return NextResponse.json({ error: "平台名稱不可為空白" }, { status: 400 });
  }

  if (!supportEmail || !isValidEmail(supportEmail)) {
    return NextResponse.json({ error: "客服 Email 格式不正確" }, { status: 400 });
  }

  const settings = await updateSiteSettings({
    platformName,
    supportEmail,
    footerNotice: normalizeText(body.footerNotice),
    contactIntro: normalizeText(body.contactIntro),
    supportHours: normalizeText(body.supportHours),
    supportGuidelines: normalizeText(body.supportGuidelines),
    refundSummary: normalizeText(body.refundSummary),
    purchaseGuideSummary: normalizeText(body.purchaseGuideSummary),
  });

  return NextResponse.json({ settings });
}
