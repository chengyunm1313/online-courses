import { NextRequest } from "next/server";
import { getECPayConfig, verifyCheckMacValue } from "@/lib/ecpay";
import { processVerifiedPayment } from "@/lib/payment-processing";
import { sanitizeLogContext } from "@/lib/logging";

function paymentRedirect(path: string): Response {
  const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
  const targetUrl = `${baseUrl}${path}`;
  const escapedUrl = targetUrl.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  return new Response(
    `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${escapedUrl}"></head><body></body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const params: Record<string, string | number> = {};
    formData.forEach((value, key) => {
      params[key] = typeof value === "string" ? value : value.toString();
    });

    const merchantTradeNo = String(params.MerchantTradeNo ?? "");
    if (!merchantTradeNo) {
      return paymentRedirect("/?payment=missing");
    }

    const rtnCode = parseInt(String(params.RtnCode ?? "0"), 10);
    const tradeNo = String(params.TradeNo ?? "");
    const tradeAmt = parseInt(String(params.TradeAmt ?? "0"), 10);

    console.log("[payment result] received", sanitizeLogContext({
      merchantTradeNo,
      rtnCode,
      tradeNo,
      tradeAmt,
    }));

    const config = getECPayConfig();
    const signatureVerified = verifyCheckMacValue(params, config.hashKey, config.hashIV);
    if (!signatureVerified) {
      return paymentRedirect("/?payment=invalid");
    }

    const result = await processVerifiedPayment({
      merchantTradeNo,
      rtnCode,
      rtnMsg: String(params.RtnMsg ?? ""),
      tradeNo,
      tradeAmt,
      paymentDate: String(params.PaymentDate ?? ""),
      paymentType: String(params.PaymentType ?? ""),
      paymentTypeChargeFee: parseInt(String(params.PaymentTypeChargeFee ?? "0"), 10),
      tradeDate: String(params.TradeDate ?? ""),
      simulatePaid: parseInt(String(params.SimulatePaid ?? "0"), 10),
      checkMacValue: String(params.CheckMacValue ?? ""),
      card4no: typeof params.card4no === "string" ? params.card4no : undefined,
      card6no: typeof params.card6no === "string" ? params.card6no : undefined,
      authCode: typeof params.AuthCode === "string" ? params.AuthCode : undefined,
      source: "result",
    });

    if (!result.ok || !result.orderId) {
      return paymentRedirect("/?payment=error");
    }

    return paymentRedirect(`/order/${result.orderId}/result`);
  } catch (error) {
    console.error("[payment result] error", error);
    return paymentRedirect("/?payment=error");
  }
}
