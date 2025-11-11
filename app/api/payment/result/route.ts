import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import {
  getECPayConfig,
  verifyCheckMacValue,
  generateCheckMacValue,
} from '@/lib/ecpay';
import type { ECPayData } from '@/types/ecpay';

/**
 * 安全地構造重定向 URL，確保在各種 Next.js 上下文中都能正常工作
 */
function getRedirectUrl(request: NextRequest, path: string): string {
  // 優先使用 request.nextUrl 的原點
  let origin = request.nextUrl.origin;

  // 如果原點無效，嘗試從 request.url 提取
  if (!origin || origin === 'null') {
    try {
      const parsedUrl = new URL(request.url);
      origin = `${parsedUrl.protocol}//${parsedUrl.host}`;
    } catch {
      // 最後的備用方案 - 使用環境變數或預設值
      origin = process.env.APP_BASE_URL || 'http://localhost:3000';
    }
  }

  // 確保 origin 是有效的字符串
  if (typeof origin !== 'string' || !origin) {
    origin = process.env.APP_BASE_URL || 'http://localhost:3000';
  }

  // 安全地構造 URL
  try {
    return new URL(path, origin).toString();
  } catch {
    // 備用：簡單的字符串拼接
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
    return `${normalizedOrigin}${normalizedPath}`;
  }
}

/**
 * POST /api/payment/result
 * 接收綠界的前端導回，驗證並重定向到訂單詳情頁
 * 這是使用者瀏覽器發送的請求（從綠界支付頁面返回）
 */
export async function POST(request: NextRequest) {
  try {
    // 解析 FormData
    const formData = await request.formData();
    const params: Record<string, string | number> = {};

    formData.forEach((value, key) => {
      params[key] = typeof value === 'string' ? value : value.toString();
    });

    // 提取關鍵欄位
    const merchantTradeNo = String(params.MerchantTradeNo);
    const rtnCode = parseInt(String(params.RtnCode), 10);
    const tradeNo = String(params.TradeNo);

    if (!merchantTradeNo) {
      console.warn('[Payment Result] 缺少商家交易編號');
      return NextResponse.redirect(getRedirectUrl(request, '/?payment=missing'), { status: 307 });
    }

    console.log('[Payment Result] 收到支付結果:', {
      merchantTradeNo,
      rtnCode,
      tradeNo,
    });

    // 取得 ECPay 設定
    const config = getECPayConfig();

    // 詳細調試：檢查簽章驗證
    const receivedCheckMacValue = String(params.CheckMacValue);
    const calculatedCheckMacValue = generateCheckMacValue(params, config.hashKey, config.hashIV);

    console.log('[Payment Result] 簽章驗證詳情:', {
      merchantTradeNo,
      receivedCheckMacValue,
      calculatedCheckMacValue,
      match: receivedCheckMacValue === calculatedCheckMacValue,
      paramKeys: Object.keys(params).sort(),
    });

    // 輸出所有接收到的參數（用於調試）
    console.log('[Payment Result] 接收到的完整參數:', JSON.stringify(params, null, 2));

    // 詳細調試：輸出用於簽章計算的參數及其值
    const filteredForSignature: Record<string, string | number> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && key !== 'CheckMacValue') {
        filteredForSignature[key] = value;
      }
    });
    const sortedKeysForSignature = Object.keys(filteredForSignature).sort();
    console.log('[Payment Result] 簽章計算的參數值:',
      sortedKeysForSignature.map(key => `${key}=${filteredForSignature[key]}`).join('&')
    );

    // 驗證 CheckMacValue
    const signatureVerified = verifyCheckMacValue(params, config.hashKey, config.hashIV);

    if (!signatureVerified) {
      console.error('[Payment Result] ❌ CheckMacValue 驗證失敗:', {
        merchantTradeNo,
        received: receivedCheckMacValue,
        calculated: calculatedCheckMacValue,
      });
      return NextResponse.redirect(getRedirectUrl(request, '/?payment=invalid'), { status: 307 });
    }

    console.log('[Payment Result] ✓ CheckMacValue 驗證成功');

    // 查詢訂單
    const orderSnapshot = await adminDb
      .collection('orders')
      .where('merchantTradeNo', '==', merchantTradeNo)
      .limit(1)
      .get();

    if (orderSnapshot.empty) {
      console.error('[Payment Result] 找不到訂單:', merchantTradeNo);
      return NextResponse.redirect(getRedirectUrl(request, '/?payment=not-found'), { status: 307 });
    }

    const orderDoc = orderSnapshot.docs[0];
    const orderId = orderDoc.id;
    const existingOrder = orderDoc.data() as Record<string, unknown> | undefined;

    console.log('[Payment Result] 訂單找到:', {
      orderId,
      merchantTradeNo,
      currentStatus: existingOrder?.status,
    });

    // 作為最後保險更新訂單狀態
    // 如果 callback 因網路問題延遲，這裡會補救
    if (existingOrder?.status === 'CREATED') {
      const rtnMsg = String(params.RtnMsg);
      const tradeAmt = parseInt(String(params.TradeAmt), 10);
      const paymentDate = String(params.PaymentDate);
      const paymentType = String(params.PaymentType);
      const card4no = params.card4no;
      const card6no = params.card6no;
      const authCode = params.AuthCode;

      // 準備 ECPay 回傳資料
      const ecpayData: ECPayData = {
        RtnCode: rtnCode,
        RtnMsg: rtnMsg,
        TradeNo: tradeNo,
        TradeAmt: tradeAmt,
        PaymentDate: paymentDate,
        PaymentType: paymentType,
        PaymentTypeChargeFee: parseInt(String(params.PaymentTypeChargeFee || '0'), 10),
        TradeDate: String(params.TradeDate),
        SimulatePaid: parseInt(String(params.SimulatePaid || '0'), 10),
        CheckMacValue: String(params.CheckMacValue),
        ...(card4no && { card4no: String(card4no) }),
        ...(card6no && { card6no: String(card6no) }),
        ...(authCode && { AuthCode: String(authCode) }),
      };

      let newStatus = 'FAILED';
      if (rtnCode === 1) {
        newStatus = 'PAID';
      } else if (rtnCode === 0) {
        // RtnCode = 0 表示使用者取消，不更新狀態
        newStatus = existingOrder.status;
      }

      if (newStatus !== existingOrder?.status) {
        const updateData: Record<string, string | number | Date | ECPayData> = {
          status: newStatus,
          ecpayData,
          updatedAt: new Date(),
        };

        if (newStatus === 'PAID') {
          updateData.paidAt = new Date();
        } else if (newStatus === 'FAILED') {
          updateData.failedAt = new Date();
        }

        await orderDoc.ref.update(updateData);

        console.log('[Payment Result] 訂單狀態已更新（來自前端導回）:', {
          orderId,
          merchantTradeNo,
          newStatus,
        });
      }
    }

    // 重定向到訂單詳情頁
    const redirectPath = `/order/${orderId}/result`;
    console.log('[Payment Result] 重定向到訂單詳情頁:', redirectPath);
    return NextResponse.redirect(getRedirectUrl(request, redirectPath), { status: 307 });
  } catch (error) {
    console.error('[Payment Result Error]', error);
    return NextResponse.redirect(getRedirectUrl(request, '/?payment=error'), { status: 307 });
  }
}
