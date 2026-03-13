import {
  createAnalyticsEvent,
  createOrderEvent,
  getOrderByMerchantTradeNo,
  hasOrderEvent,
  updateOrderRecord,
} from "@/lib/d1-repository";
import { ensureEnrollmentForPaidOrder } from "@/lib/enrollments";
import { sendEnrollmentConfirmedEmail, sendPaymentSuccessEmail } from "@/lib/notifications";

interface PaymentProcessingInput {
  merchantTradeNo: string;
  rtnCode: number;
  rtnMsg: string;
  tradeNo: string;
  tradeAmt: number;
  paymentDate?: string;
  paymentType?: string;
  paymentTypeChargeFee?: number;
  tradeDate?: string;
  simulatePaid?: number;
  checkMacValue?: string;
  card4no?: string;
  card6no?: string;
  authCode?: string;
  source: "callback" | "result";
}

export async function processVerifiedPayment(input: PaymentProcessingInput) {
  const order = await getOrderByMerchantTradeNo(input.merchantTradeNo);
  if (!order) {
    return { ok: false, reason: "ORDER_NOT_FOUND" as const };
  }

  if (Math.round(order.total) !== Math.round(input.tradeAmt)) {
    await createOrderEvent({
      orderId: order.id,
      type: "PAYMENT_AMOUNT_MISMATCH",
      eventKey: `payment-amount-mismatch:${input.tradeNo}`,
      payload: {
        merchantTradeNo: input.merchantTradeNo,
        expected: order.total,
        received: input.tradeAmt,
        source: input.source,
      },
    });
    return { ok: false, reason: "AMOUNT_MISMATCH" as const, orderId: order.id };
  }

  const eventKey = `payment:${input.tradeNo}:${input.rtnCode}:${input.source}`;
  if (await hasOrderEvent(eventKey)) {
    return { ok: true, duplicate: true as const, orderId: order.id, status: order.status };
  }

  const ecpayData = {
    RtnCode: input.rtnCode,
    RtnMsg: input.rtnMsg,
    TradeNo: input.tradeNo,
    TradeAmt: input.tradeAmt,
    PaymentDate: input.paymentDate,
    PaymentType: input.paymentType,
    PaymentTypeChargeFee: input.paymentTypeChargeFee,
    TradeDate: input.tradeDate,
    SimulatePaid: input.simulatePaid,
    CheckMacValue: input.checkMacValue,
    ...(input.card4no ? { card4no: input.card4no } : {}),
    ...(input.card6no ? { card6no: input.card6no } : {}),
    ...(input.authCode ? { AuthCode: input.authCode } : {}),
  };

  let status = order.status;
  if (input.rtnCode === 1) {
    status = "PAID";
  } else if (input.rtnCode !== 0) {
    status = "FAILED";
  }

  if (status !== order.status) {
    await updateOrderRecord(order.id, {
      status,
      transactionId: input.tradeNo,
      ecpayData,
      paidAt: status === "PAID" ? new Date() : undefined,
      failedAt: status === "FAILED" ? new Date() : undefined,
    });
  }

  await createOrderEvent({
    orderId: order.id,
    type: input.source === "callback" ? "PAYMENT_CALLBACK" : "PAYMENT_RESULT",
    eventKey,
    payload: {
      merchantTradeNo: input.merchantTradeNo,
      rtnCode: input.rtnCode,
      tradeNo: input.tradeNo,
      tradeAmt: input.tradeAmt,
    },
  });

  if (status === "PAID") {
    await createAnalyticsEvent({
      eventName: "payment_succeeded",
      userId: order.userId,
      courseId: order.items[0]?.courseId,
      orderId: order.id,
      paymentMethod: order.paymentMethod,
      amount: order.total,
      payload: {
        tradeNo: input.tradeNo,
        source: input.source,
      },
    });
    for (const item of order.items) {
      await ensureEnrollmentForPaidOrder({
        userId: order.userId,
        courseId: item.courseId,
        orderId: order.id,
        courseTitle: item.courseTitle,
      });
    }

    if (order.userEmail) {
      void sendPaymentSuccessEmail({
        orderId: order.id,
        to: order.userEmail,
        courseTitles: order.items.map((item) => item.courseTitle),
        total: order.total,
      });
      void sendEnrollmentConfirmedEmail({
        orderId: order.id,
        to: order.userEmail,
        courseTitles: order.items.map((item) => item.courseTitle),
      });
    }
  }

  return { ok: true, orderId: order.id, status };
}
