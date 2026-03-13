import { createOrderEvent } from "@/lib/d1-repository";

interface GmailAccessTokenResponse {
  access_token: string;
}

function isGmailConfigured(): boolean {
  return Boolean(
    process.env.GMAIL_CLIENT_ID &&
      process.env.GMAIL_CLIENT_SECRET &&
      process.env.GMAIL_REFRESH_TOKEN &&
      process.env.GMAIL_SENDER_EMAIL,
  );
}

async function getGmailAccessToken(): Promise<string> {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("缺少 Gmail API 憑證設定");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`取得 Gmail access token 失敗：${response.status}`);
  }

  const data = (await response.json()) as GmailAccessTokenResponse;
  return data.access_token;
}

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}) {
  if (!isGmailConfigured()) {
    return { delivered: false, skipped: true };
  }

  const senderEmail = process.env.GMAIL_SENDER_EMAIL!;
  const accessToken = await getGmailAccessToken();
  const lines = [
    `From: ${senderEmail}`,
    `To: ${input.to}`,
    `Subject: ${input.subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    input.replyTo ? `Reply-To: ${input.replyTo}` : "",
    "",
    input.html,
  ].filter(Boolean);

  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        raw: toBase64Url(lines.join("\r\n")),
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Gmail API 發信失敗：${response.status}`);
  }

  return { delivered: true, skipped: false };
}

async function recordNotificationResult(input: {
  orderId: string;
  type: string;
  payload: Record<string, unknown>;
}) {
  try {
    await createOrderEvent({
      orderId: input.orderId,
      type: input.type,
      payload: input.payload,
    });
  } catch (error) {
    console.error("[notifications] 無法記錄通知事件", error);
  }
}

export async function sendOrderCreatedEmail(input: {
  orderId: string;
  to: string;
  courseTitles: string[];
  total: number;
}) {
  try {
    const result = await sendEmail({
      to: input.to,
      subject: "訂單已建立",
      html: `<p>您的訂單已建立。</p><p>課程：${input.courseTitles.join("、")}</p><p>金額：NT$ ${input.total.toLocaleString()}</p>`,
    });
    await recordNotificationResult({
      orderId: input.orderId,
      type: "MAIL_ORDER_CREATED",
      payload: result,
    });
  } catch (error) {
    await recordNotificationResult({
      orderId: input.orderId,
      type: "MAIL_ORDER_CREATED_FAILED",
      payload: {
        message: error instanceof Error ? error.message : "unknown error",
      },
    });
  }
}

export async function sendPaymentSuccessEmail(input: {
  orderId: string;
  to: string;
  courseTitles: string[];
  total: number;
}) {
  try {
    const result = await sendEmail({
      to: input.to,
      subject: "付款成功通知",
      html: `<p>您的付款已成功。</p><p>課程：${input.courseTitles.join("、")}</p><p>金額：NT$ ${input.total.toLocaleString()}</p>`,
    });
    await recordNotificationResult({
      orderId: input.orderId,
      type: "MAIL_PAYMENT_SUCCESS",
      payload: result,
    });
  } catch (error) {
    await recordNotificationResult({
      orderId: input.orderId,
      type: "MAIL_PAYMENT_SUCCESS_FAILED",
      payload: {
        message: error instanceof Error ? error.message : "unknown error",
      },
    });
  }
}

export async function sendEnrollmentConfirmedEmail(input: {
  orderId: string;
  to: string;
  courseTitles: string[];
}) {
  try {
    const result = await sendEmail({
      to: input.to,
      subject: "課程已開通",
      html: `<p>您的課程已開通。</p><p>課程：${input.courseTitles.join("、")}</p>`,
    });
    await recordNotificationResult({
      orderId: input.orderId,
      type: "MAIL_ENROLLMENT_CONFIRMED",
      payload: result,
    });
  } catch (error) {
    await recordNotificationResult({
      orderId: input.orderId,
      type: "MAIL_ENROLLMENT_CONFIRMED_FAILED",
      payload: {
        message: error instanceof Error ? error.message : "unknown error",
      },
    });
  }
}
