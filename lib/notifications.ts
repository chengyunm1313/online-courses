import { createOrderEvent, hasOrderEvent } from "@/lib/d1-repository";
import { getSiteSettings } from "@/lib/site-settings";

interface GmailAccessTokenResponse {
  access_token: string;
}

type EmailTheme = "neutral" | "success" | "warning";

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

function encodeMimeHeader(value: string): string {
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function formatCurrency(value?: number): string {
  if (typeof value !== "number") {
    return "—";
  }
  return `NT$ ${value.toLocaleString("zh-TW")}`;
}

function buildSummaryRows(
  rows: Array<{ label: string; value: string }>,
): string {
  return rows
    .map(
      (row) => `
        <tr>
          <td style="padding: 10px 0; color: #64748b; font-size: 14px; width: 110px; vertical-align: top;">${escapeHtml(row.label)}</td>
          <td style="padding: 10px 0; color: #0f172a; font-size: 15px; font-weight: 600;">${escapeHtml(row.value)}</td>
        </tr>
      `,
    )
    .join("");
}

function buildEmailTemplate(input: {
  brandName: string;
  supportEmail: string;
  preheader: string;
  heading: string;
  description: string;
  badgeText: string;
  theme?: EmailTheme;
  summaryRows: Array<{ label: string; value: string }>;
  helpText: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  const theme = input.theme ?? "neutral";
  const themeStyles: Record<EmailTheme, { accent: string; badgeBg: string; badgeText: string }> = {
    neutral: { accent: "#2563eb", badgeBg: "#dbeafe", badgeText: "#1d4ed8" },
    success: { accent: "#059669", badgeBg: "#d1fae5", badgeText: "#047857" },
    warning: { accent: "#d97706", badgeBg: "#fef3c7", badgeText: "#b45309" },
  };
  const colors = themeStyles[theme];

  return `
    <!doctype html>
    <html lang="zh-Hant">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(input.heading)}</title>
      </head>
      <body style="margin: 0; padding: 0; background: #f8fafc; color: #0f172a; font-family: 'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', sans-serif;">
        <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">${escapeHtml(input.preheader)}</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f8fafc; padding: 32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 28px 32px; background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%); border-bottom: 1px solid #e2e8f0;">
                    <div style="font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: ${colors.accent}; font-weight: 700;">
                      ${escapeHtml(input.brandName)}
                    </div>
                    <div style="margin-top: 18px;">
                      <span style="display: inline-block; padding: 6px 12px; border-radius: 999px; background: ${colors.badgeBg}; color: ${colors.badgeText}; font-size: 12px; font-weight: 700;">
                        ${escapeHtml(input.badgeText)}
                      </span>
                    </div>
                    <h1 style="margin: 18px 0 0; font-size: 30px; line-height: 1.3; color: #0f172a;">
                      ${escapeHtml(input.heading)}
                    </h1>
                    <p style="margin: 12px 0 0; font-size: 16px; line-height: 1.8; color: #475569;">
                      ${escapeHtml(input.description)}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 28px 32px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #e2e8f0; border-radius: 18px; padding: 0 20px; background: #ffffff;">
                      ${buildSummaryRows(input.summaryRows)}
                    </table>
                    ${
                      input.ctaLabel && input.ctaHref
                        ? `
                          <div style="margin-top: 24px;">
                            <a href="${escapeHtml(input.ctaHref)}" style="display: inline-block; background: ${colors.accent}; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px; border-radius: 12px; padding: 12px 20px;">
                              ${escapeHtml(input.ctaLabel)}
                            </a>
                          </div>
                        `
                        : ""
                    }
                    <div style="margin-top: 28px; padding: 18px 20px; border-radius: 16px; background: #f8fafc; border: 1px solid #e2e8f0;">
                      <p style="margin: 0; font-size: 14px; line-height: 1.8; color: #475569;">
                        ${escapeHtml(input.helpText)}
                      </p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 32px 28px; border-top: 1px solid #e2e8f0; font-size: 12px; line-height: 1.8; color: #94a3b8;">
                    此信件由 ${escapeHtml(input.brandName)} 系統自動發送。若需協助，請聯絡 ${escapeHtml(input.supportEmail)}。
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
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
  const settings = await getSiteSettings();
  const senderName = settings.platformName;
  const accessToken = await getGmailAccessToken();
  const lines = [
    `From: ${encodeMimeHeader(senderName)} <${senderEmail}>`,
    `To: ${input.to}`,
    `Subject: ${encodeMimeHeader(input.subject)}`,
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
  eventKey?: string;
  payload: Record<string, unknown>;
}) {
  try {
    await createOrderEvent({
      orderId: input.orderId,
      type: input.type,
      eventKey: input.eventKey,
      payload: input.payload,
    });
  } catch (error) {
    console.error("[notifications] 無法記錄通知事件", error);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendOrderCreatedEmail(input: {
  orderId: string;
  to: string;
  courseTitles: string[];
  total: number;
}) {
  try {
    const settings = await getSiteSettings();
    const result = await sendEmail({
      to: input.to,
      subject: "訂單已建立",
      html: buildEmailTemplate({
        brandName: settings.platformName,
        supportEmail: settings.supportEmail,
        preheader: "您的訂單已建立，請依照付款方式完成付款。",
        heading: "訂單已建立",
        description: "我們已為您保留課程名額，請依照選擇的付款方式完成付款。",
        badgeText: "待付款",
        theme: "neutral",
        summaryRows: [
          { label: "訂單編號", value: input.orderId },
          { label: "課程", value: input.courseTitles.join("、") },
          { label: "訂單金額", value: formatCurrency(input.total) },
        ],
        helpText: "付款完成後，系統會自動寄送付款成功與課程開通信件。",
      }),
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
    const settings = await getSiteSettings();
    const result = await sendEmail({
      to: input.to,
      subject: "付款成功通知",
      html: buildEmailTemplate({
        brandName: settings.platformName,
        supportEmail: settings.supportEmail,
        preheader: "付款成功，課程即將加入您的學習清單。",
        heading: "付款成功",
        description: "我們已確認您的付款，課程將立即加入您的學習清單。",
        badgeText: "付款完成",
        theme: "success",
        summaryRows: [
          { label: "訂單編號", value: input.orderId },
          { label: "課程", value: input.courseTitles.join("、") },
          { label: "付款金額", value: formatCurrency(input.total) },
        ],
        helpText: "若您剛完成付款，學習權限通常會立即開通；若稍有延遲，請重新登入後再查看。",
        ctaLabel: "前往我的學習",
        ctaHref: `${process.env.APP_BASE_URL || "http://localhost:3000"}/learning`,
      }),
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
    const settings = await getSiteSettings();
    const result = await sendEmail({
      to: input.to,
      subject: "課程已開通",
      html: buildEmailTemplate({
        brandName: settings.platformName,
        supportEmail: settings.supportEmail,
        preheader: "課程已開通，現在就可以開始學習。",
        heading: "課程已開通",
        description: "您的購買內容已完成開通，現在就可以前往學習頁開始上課。",
        badgeText: "已開通",
        theme: "success",
        summaryRows: [
          { label: "訂單編號", value: input.orderId },
          { label: "課程", value: input.courseTitles.join("、") },
          { label: "學習狀態", value: "可立即開始" },
        ],
        helpText: "建議先從第一堂課開始，之後可隨時回到學習頁繼續進度。",
        ctaLabel: "開始學習",
        ctaHref: `${process.env.APP_BASE_URL || "http://localhost:3000"}/learning`,
      }),
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

export async function sendRefundRequestedEmail(input: {
  orderId: string;
  to: string;
  courseTitles: string[];
  refundReason?: string;
  supportEmail?: string;
}) {
  const eventKey = `mail:refund-requested:${input.orderId}`;
  if (await hasOrderEvent(eventKey)) {
    return;
  }

  try {
    const settings = await getSiteSettings();
    const result = await sendEmail({
      to: input.to,
      subject: "已收到您的退款申請",
      html: buildEmailTemplate({
        brandName: settings.platformName,
        supportEmail: input.supportEmail || settings.supportEmail,
        preheader: "我們已收到您的退款申請，客服將盡快處理。",
        heading: "已收到退款申請",
        description: "我們已收到您的退款申請，客服將盡快為您處理。",
        badgeText: "退款處理中",
        theme: "warning",
        summaryRows: [
          { label: "訂單編號", value: input.orderId },
          { label: "課程", value: input.courseTitles.join("、") },
          { label: "退款狀態", value: "已申請" },
          { label: "退款原因", value: input.refundReason?.trim() || "未提供" },
        ],
        helpText: `若有補充資料，請直接回覆此信或聯絡客服 ${input.supportEmail || settings.supportEmail}。`,
      }),
    });
    await recordNotificationResult({
      orderId: input.orderId,
      type: "MAIL_REFUND_REQUESTED",
      eventKey,
      payload: result,
    });
  } catch (error) {
    await recordNotificationResult({
      orderId: input.orderId,
      type: "MAIL_REFUND_REQUESTED_FAILED",
      payload: {
        message: error instanceof Error ? error.message : "unknown error",
      },
    });
  }
}

export async function sendRefundCompletedEmail(input: {
  orderId: string;
  to: string;
  courseTitles: string[];
  refundReason?: string;
  supportEmail?: string;
}) {
  const eventKey = `mail:refund-completed:${input.orderId}`;
  if (await hasOrderEvent(eventKey)) {
    return;
  }

  try {
    const settings = await getSiteSettings();
    const result = await sendEmail({
      to: input.to,
      subject: "退款已完成通知",
      html: buildEmailTemplate({
        brandName: settings.platformName,
        supportEmail: input.supportEmail || settings.supportEmail,
        preheader: "您的退款已完成，請留意銀行或付款通路入帳時間。",
        heading: "退款已完成",
        description: "您的退款已完成，若款項尚未入帳，請留意發卡銀行或付款通路的實際作業時間。",
        badgeText: "退款完成",
        theme: "success",
        summaryRows: [
          { label: "訂單編號", value: input.orderId },
          { label: "課程", value: input.courseTitles.join("、") },
          { label: "退款狀態", value: "已退款" },
          { label: "退款原因", value: input.refundReason?.trim() || "未提供" },
        ],
        helpText: `若超過預期時間仍未收到退款，請聯絡客服 ${input.supportEmail || settings.supportEmail}。`,
      }),
    });
    await recordNotificationResult({
      orderId: input.orderId,
      type: "MAIL_REFUND_COMPLETED",
      eventKey,
      payload: result,
    });
  } catch (error) {
    await recordNotificationResult({
      orderId: input.orderId,
      type: "MAIL_REFUND_COMPLETED_FAILED",
      payload: {
        message: error instanceof Error ? error.message : "unknown error",
      },
    });
  }
}

export async function sendLeadMagnetEmail(input: {
  to: string;
  courseTitle: string;
  couponCode?: string;
  leadMagnetTitle?: string;
  leadMagnetDescription?: string;
}) {
  const settings = await getSiteSettings();
  return sendEmail({
    to: input.to,
    subject: input.leadMagnetTitle?.trim() || "您的課程優惠與開賣提醒",
    html: buildEmailTemplate({
      brandName: settings.platformName,
      supportEmail: settings.supportEmail,
      preheader: "已收到您的資料，我們先把本次課程優惠與提醒內容寄給您。",
      heading: input.leadMagnetTitle?.trim() || "已為您保留本次優惠資訊",
      description:
        input.leadMagnetDescription?.trim() ||
        "感謝您留下聯絡方式，我們已為您保留本次優惠與後續開賣提醒。",
      badgeText: input.couponCode ? "限時優惠" : "已加入名單",
      theme: "neutral",
      summaryRows: [
        { label: "課程", value: input.courseTitle },
        { label: "優惠碼", value: input.couponCode?.trim() || "將於開賣時另外通知" },
        { label: "客服信箱", value: settings.supportEmail },
      ],
      helpText: "若您暫時還在比較課程內容，建議先保留此信件，之後可直接回到網站完成報名。",
      ctaLabel: "回到課程頁",
      ctaHref: `${process.env.APP_BASE_URL || "http://localhost:3000"}/courses`,
    }),
  });
}

export async function sendWaitlistConfirmationEmail(input: {
  to: string;
  courseTitle: string;
  launchStartsAt?: string;
}) {
  const launchLabel = input.launchStartsAt
    ? new Date(input.launchStartsAt).toLocaleString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "開賣時間確認後將另行通知";

  const settings = await getSiteSettings();

  return sendEmail({
    to: input.to,
    subject: "您已加入課程等待名單",
    html: buildEmailTemplate({
      brandName: settings.platformName,
      supportEmail: settings.supportEmail,
      preheader: "我們已收到您的等待名單申請，開賣時會優先通知您。",
      heading: "已加入等待名單",
      description: "課程尚未開賣或本期已結束，我們會在下一波開賣時優先通知您。",
      badgeText: "等待名單",
      theme: "warning",
      summaryRows: [
        { label: "課程", value: input.courseTitle },
        { label: "開賣通知", value: launchLabel },
        { label: "客服信箱", value: settings.supportEmail },
      ],
      helpText: "若您對課程內容、付款方式或退款政策有疑問，可直接回覆此信與我們聯繫。",
      ctaLabel: "瀏覽更多課程",
      ctaHref: `${process.env.APP_BASE_URL || "http://localhost:3000"}/courses`,
    }),
  });
}
