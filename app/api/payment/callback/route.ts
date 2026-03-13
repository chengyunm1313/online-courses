import { NextRequest, NextResponse } from "next/server";
import { getECPayConfig, verifyCheckMacValue } from "@/lib/ecpay";
import { processVerifiedPayment } from "@/lib/payment-processing";
import { sanitizeLogContext } from "@/lib/logging";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const params: Record<string, string | number> = {};
    formData.forEach((value, key) => {
      params[key] = typeof value === "string" ? value : value.toString();
    });

    const merchantTradeNo = String(params.MerchantTradeNo ?? "");
    const rtnCode = parseInt(String(params.RtnCode ?? "0"), 10);
    const tradeNo = String(params.TradeNo ?? "");
    const tradeAmt = parseInt(String(params.TradeAmt ?? "0"), 10);

    console.log("[payment callback] received", sanitizeLogContext({
      merchantTradeNo,
      rtnCode,
      tradeNo,
      tradeAmt,
    }));

    const config = getECPayConfig();
    const signatureVerified = verifyCheckMacValue(params, config.hashKey, config.hashIV);
    if (!signatureVerified) {
      return new NextResponse("0|CheckMacValue verification failed", {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
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
      source: "callback",
    });

    if (!result.ok) {
      return new NextResponse(`0|${result.reason}`, {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    return new NextResponse("1|OK", {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("[payment callback] error", error);
    return new NextResponse("0|Internal server error", {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
