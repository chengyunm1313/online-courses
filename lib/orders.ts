import { adminDb } from "./firebase-admin";
import type { Order } from "@/types/order";

/**
 * 訂單數據訪問函數
 * 使用 Firebase Admin SDK 進行所有訂單相關操作
 */

/**
 * 根據用戶 ID 獲取訂單列表
 */
export async function getUserOrders(userId: string): Promise<Order[]> {
  try {
    // 暫時移除 orderBy 以避免索引問題，在客戶端排序
    const ordersSnapshot = await adminDb
      .collection("orders")
      .where("userId", "==", userId)
      .get();

    if (ordersSnapshot.empty) {
      return [];
    }

    const orders: Order[] = [];
    ordersSnapshot.forEach((doc) => {
      const data = doc.data();
      orders.push({
        id: doc.id,
        userId: data.userId || "",
        userName: data.userName || "",
        userEmail: data.userEmail || "",
        items: data.items || [],
        subtotal: data.subtotal || 0,
        tax: data.tax || 0,
        total: data.total || 0,
        status: data.status || "pending",
        paymentMethod: data.paymentMethod || "credit_card",
        transactionId: data.transactionId,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        completedAt: data.completedAt?.toDate(),
        notes: data.notes,
      });
    });

    // 在記憶體中按日期排序
    orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return orders;
  } catch (error) {
    console.error("Error fetching user orders:", error);
    throw new Error("無法獲取訂單列表");
  }
}

/**
 * 獲取所有訂單（管理員用）
 */
export async function getAllOrders(): Promise<Order[]> {
  try {
    // 暫時移除 orderBy 以避免索引問題，在客戶端排序
    const ordersSnapshot = await adminDb
      .collection("orders")
      .limit(100) // 限制返回數量
      .get();

    if (ordersSnapshot.empty) {
      return [];
    }

    const orders: Order[] = [];
    ordersSnapshot.forEach((doc) => {
      const data = doc.data();
      orders.push({
        id: doc.id,
        userId: data.userId || "",
        userName: data.userName || "",
        userEmail: data.userEmail || "",
        items: data.items || [],
        subtotal: data.subtotal || 0,
        tax: data.tax || 0,
        total: data.total || 0,
        status: data.status || "pending",
        paymentMethod: data.paymentMethod || "credit_card",
        transactionId: data.transactionId,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        completedAt: data.completedAt?.toDate(),
        notes: data.notes,
      });
    });

    // 在記憶體中按日期排序
    orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return orders;
  } catch (error) {
    console.error("Error fetching all orders:", error);
    throw new Error("無法獲取訂單列表");
  }
}

/**
 * 根據訂單 ID 獲取單個訂單
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const orderDoc = await adminDb.collection("orders").doc(orderId).get();

    if (!orderDoc.exists) {
      return null;
    }

    const data = orderDoc.data()!;
    return {
      id: orderDoc.id,
      userId: data.userId || "",
      userName: data.userName || "",
      userEmail: data.userEmail || "",
      items: data.items || [],
      subtotal: data.subtotal || 0,
      tax: data.tax || 0,
      total: data.total || 0,
      status: data.status || "pending",
      paymentMethod: data.paymentMethod || "credit_card",
      transactionId: data.transactionId,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      completedAt: data.completedAt?.toDate(),
      notes: data.notes,
    };
  } catch (error) {
    console.error("Error fetching order:", error);
    throw new Error("無法獲取訂單詳情");
  }
}

/**
 * 創建新訂單
 */
export async function createOrder(orderData: Omit<Order, "id">): Promise<string> {
  try {
    const orderRef = await adminDb.collection("orders").add({
      ...orderData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return orderRef.id;
  } catch (error) {
    console.error("Error creating order:", error);
    throw new Error("無法創建訂單");
  }
}

/**
 * 更新訂單狀態
 */
export async function updateOrderStatus(
  orderId: string,
  status: Order["status"],
  notes?: string
): Promise<void> {
  try {
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };

    if (status === "completed") {
      updateData.completedAt = new Date();
    }

    if (notes) {
      updateData.notes = notes;
    }

    await adminDb.collection("orders").doc(orderId).update(updateData);
  } catch (error) {
    console.error("Error updating order status:", error);
    throw new Error("無法更新訂單狀態");
  }
}

/**
 * 獲取訂單統計（管理員用）
 */
export async function getOrderStats() {
  try {
    const ordersSnapshot = await adminDb.collection("orders").get();

    const stats = {
      totalOrders: 0,
      totalRevenue: 0,
      pendingOrders: 0,
      completedOrders: 0,
      averageOrderValue: 0,
    };

    ordersSnapshot.forEach((doc) => {
      const data = doc.data();
      stats.totalOrders++;

      if (data.status === "completed") {
        stats.completedOrders++;
        stats.totalRevenue += data.total || 0;
      } else if (data.status === "pending") {
        stats.pendingOrders++;
      }
    });

    if (stats.completedOrders > 0) {
      stats.averageOrderValue = stats.totalRevenue / stats.completedOrders;
    }

    return stats;
  } catch (error) {
    console.error("Error fetching order stats:", error);
    throw new Error("無法獲取訂單統計");
  }
}
