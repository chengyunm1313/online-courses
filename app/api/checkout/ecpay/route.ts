import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import {
  getECPayConfig,
  generateCheckMacValue,
  generateMerchantTradeNo,
  generateECPayForm,
  prepareECPayParams,
} from '@/lib/ecpay';

/**
 * POST /api/checkout/ecpay
 * 建立綠界結帳訂單並返回支付表單或 ATM 重定向 URL
 */
export async function POST(request: NextRequest) {
  try {
    // 驗證用戶登入
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '請先登入' },
        { status: 401 }
      );
    }

    // 解析請求體
    const body = await request.json() as {
      items?: Array<{courseTitle: string; price: number}>;
      paymentMethod?: 'CREDIT' | 'ATM';
      shippingMethod?: 'HOME' | 'STORE';
      subtotal?: number;
      tax?: number;
      total?: number;
      notes?: string;
    };
    const {
      items,
      paymentMethod = 'CREDIT',
      shippingMethod = 'HOME',
      subtotal = 0,
      tax = 0,
      total = 0,
      notes,
    } = body;

    // 驗證必填欄位
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: '購物車為空' },
        { status: 400 }
      );
    }

    if (!total || total <= 0) {
      return NextResponse.json(
        { error: '訂單金額無效' },
        { status: 400 }
      );
    }

    // 取得 ECPay 設定
    const config = getECPayConfig();
    const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';

    // 生成商家交易編號
    const merchantTradeNo = generateMerchantTradeNo();

    // 建立訂單到 Firestore
    const orderData = {
      userId: session.user.id,
      userName: session.user.name || '',
      userEmail: session.user.email || '',
      items,
      subtotal,
      tax,
      total,
      status: 'CREATED' as const,
      paymentMethod,
      shippingMethod,
      merchantTradeNo,
      notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const orderRef = await adminDb.collection('orders').add(orderData);
    const orderId = orderRef.id;

    console.log('[Checkout] 訂單已建立:', {
      orderId,
      merchantTradeNo,
      total,
      paymentMethod,
    });

    // 若為 ATM 轉帳，直接返回重定向 URL
    if (paymentMethod === 'ATM') {
      return NextResponse.json({
        orderId,
        merchantTradeNo,
        redirectUrl: `/order/${orderId}/result?payment=atm`,
      });
    }

    // 信用卡流程：準備 ECPay AIO 參數
    const itemNames = items.map((item: {courseTitle: string; price: number}) => item.courseTitle).join(', ');
    const ecpayParams = prepareECPayParams(
      merchantTradeNo,
      Math.round(total),
      itemNames.substring(0, 200),
      config.merchantId,
      appBaseUrl,
      'Credit'
    );

    // 生成 CheckMacValue
    const checkMacValue = generateCheckMacValue(
      ecpayParams,
      config.hashKey,
      config.hashIV
    );

    // 將 CheckMacValue 加入參數
    const fullParams = {
      ...ecpayParams,
      CheckMacValue: checkMacValue,
    };

    // 產生自動提交的 HTML 表單
    const htmlForm = generateECPayForm(fullParams, config.cashierUrl);

    console.log('[Checkout] HTML 表單已產生:', {
      orderId,
      merchantTradeNo,
      merchantId: config.merchantId,
    });

    // 返回 HTML（自動提交）
    return new NextResponse(htmlForm, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('[Checkout Error]', error);
    const detailedError = process.env.NODE_ENV === 'development'
      ? (error instanceof Error ? error.message : String(error))
      : undefined;

    return NextResponse.json(
      {
        error: '建立訂單失敗',
        ...(detailedError && { detailedError }),
      },
      { status: 500 }
    );
  }
}
