import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserOrders, getAllOrders, getOrderStats } from "@/lib/orders";

/**
 * GET /api/orders
 * 獲取訂單列表
 * - 普通用戶：返回自己的訂單
 * - 管理員：返回所有訂單
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "未登入" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get("includeStats") === "true";

    // 管理員可以查看所有訂單
    if (session.user.role === "admin") {
      const orders = await getAllOrders();

      if (includeStats) {
        const stats = await getOrderStats();
        return NextResponse.json({ orders, stats });
      }

      return NextResponse.json({ orders });
    }

    // 普通用戶只能查看自己的訂單
    const orders = await getUserOrders(session.user.id);
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "無法獲取訂單列表" },
      { status: 500 }
    );
  }
}
