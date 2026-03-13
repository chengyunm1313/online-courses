import type { Order, ReconciliationStatus, RefundStatus } from "@/types/order";
import {
  createOrderEvent,
  createOrderRecord,
  getOrderByIdFromStore,
  getOrderStatsFromStore,
  listOrdersFromStore,
  updateOrderRecord,
  type OrderDraft,
} from "@/lib/d1-repository";
import {
  sendRefundCompletedEmail,
  sendRefundRequestedEmail,
} from "@/lib/notifications";

export async function getUserOrders(userId: string): Promise<Order[]> {
  return listOrdersFromStore(userId);
}

export async function getAllOrders(): Promise<Order[]> {
  return listOrdersFromStore();
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  return getOrderByIdFromStore(orderId);
}

export async function createOrder(orderData: Omit<Order, "id">): Promise<string> {
  const input: OrderDraft = {
    userId: orderData.userId,
    userName: orderData.userName,
    userEmail: orderData.userEmail,
    items: orderData.items,
    subtotal: orderData.subtotal,
    discountAmount: orderData.discountAmount,
    tax: orderData.tax,
    total: orderData.total,
    status: orderData.status,
    paymentMethod: orderData.paymentMethod,
    shippingMethod: orderData.shippingMethod,
    merchantTradeNo: orderData.merchantTradeNo,
    transactionId: orderData.transactionId,
    notes: orderData.notes,
    ecpayData: orderData.ecpayData,
    paidAt: orderData.paidAt,
    failedAt: orderData.failedAt,
    canceledAt: orderData.canceledAt,
  };
  return createOrderRecord(input);
}

export async function updateOrderStatus(
  orderId: string,
  status: Order["status"],
  notes?: string,
): Promise<void> {
  await updateOrderRecord(orderId, {
    status,
    notes,
    paidAt: status === "PAID" || status === "completed" ? new Date() : undefined,
    failedAt: status === "FAILED" ? new Date() : undefined,
    canceledAt: status === "CANCELED" || status === "cancelled" ? new Date() : undefined,
  });
}

export async function getOrderStats() {
  return getOrderStatsFromStore();
}

export async function updateOrderOperations(input: {
  orderId: string;
  refundStatus?: RefundStatus;
  refundReason?: string;
  refundNote?: string;
  refundRequestedAt?: Date;
  refundedAt?: Date;
  reconciliationStatus?: ReconciliationStatus;
  notes?: string;
}) {
  const previousOrder = await getOrderByIdFromStore(input.orderId);
  await updateOrderRecord(input.orderId, {
    refundStatus: input.refundStatus,
    refundReason: input.refundReason,
    refundNote: input.refundNote,
    refundRequestedAt: input.refundRequestedAt,
    refundedAt: input.refundedAt,
    reconciliationStatus: input.reconciliationStatus,
    notes: input.notes,
  });

  const updatedOrder = await getOrderByIdFromStore(input.orderId);
  if (!previousOrder || !updatedOrder || !updatedOrder.userEmail) {
    return;
  }

  const refundStatusChanged = previousOrder.refundStatus !== updatedOrder.refundStatus;
  if (!refundStatusChanged) {
    return;
  }

  const courseTitles = updatedOrder.items.map((item) => item.courseTitle);
  if (updatedOrder.refundStatus === "requested") {
    await sendRefundRequestedEmail({
      orderId: updatedOrder.id,
      to: updatedOrder.userEmail,
      courseTitles,
      refundReason: updatedOrder.refundReason,
    });
  }

  if (updatedOrder.refundStatus === "refunded") {
    await sendRefundCompletedEmail({
      orderId: updatedOrder.id,
      to: updatedOrder.userEmail,
      courseTitles,
      refundReason: updatedOrder.refundReason,
    });
  }
}

export async function recordOrderEvent(input: {
  orderId: string;
  type: string;
  eventKey?: string;
  payload?: Record<string, unknown>;
}) {
  await createOrderEvent(input);
}
