import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrderById } from '@/lib/orders';

/**
 * GET /api/orders/[id]
 * 取得單個訂單詳情
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授權' },
        { status: 401 }
      );
    }

    const orderId = id;

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json(
        { error: '訂單不存在' },
        { status: 404 }
      );
    }

    // 檢查權限：只允許訂單所有者和管理員查看
    if (
      order.userId !== session.user.id &&
      session.user.role !== 'admin'
    ) {
      return NextResponse.json(
        { error: '無權訪問此訂單' },
        { status: 403 }
      );
    }

    // 返回訂單資料
    return NextResponse.json({
      ...order,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      paidAt: order.paidAt?.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: '取得訂單失敗' },
      { status: 500 }
    );
  }
}
