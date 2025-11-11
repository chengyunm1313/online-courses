import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

/**
 * GET /api/orders/[id]
 * 取得單個訂單詳情
 */
export async function GET(
  request: NextRequest,
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

    // 從 Firestore 取得訂單
    const orderDoc = await adminDb.collection('orders').doc(orderId).get();

    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: '訂單不存在' },
        { status: 404 }
      );
    }

    const orderData = orderDoc.data();

    // 檢查權限：只允許訂單所有者和管理員查看
    if (
      orderData?.userId !== session.user.id &&
      session.user.role !== 'admin'
    ) {
      return NextResponse.json(
        { error: '無權訪問此訂單' },
        { status: 403 }
      );
    }

    // 返回訂單資料
    return NextResponse.json({
      id: orderId,
      ...orderData,
      createdAt: orderData?.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
      updatedAt: orderData?.updatedAt?.toDate?.().toISOString() || new Date().toISOString(),
      paidAt: orderData?.paidAt?.toDate?.().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: '取得訂單失敗' },
      { status: 500 }
    );
  }
}
