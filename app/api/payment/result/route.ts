import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import {
  getECPayConfig,
  verifyCheckMacValue,
} from '@/lib/ecpay';
import type { ECPayData } from '@/types/ecpay';

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
      const redirectUrl = new URL('/', request.url);
      redirectUrl.searchParams.set('payment', 'missing');
      return NextResponse.redirect(redirectUrl.toString());
    }

    console.log('[Payment Result] 收到支付結果:', {
      merchantTradeNo,
      rtnCode,
      tradeNo,
    });

    // 取得 ECPay 設定
    const config = getECPayConfig();

    // 驗證 CheckMacValue
    if (!verifyCheckMacValue(params, config.hashKey, config.hashIV)) {
      console.error('[Payment Result] CheckMacValue 驗證失敗:', {
        merchantTradeNo,
      });
      const redirectUrl = new URL('/', request.url);
      redirectUrl.searchParams.set('payment', 'invalid');
      return NextResponse.redirect(redirectUrl.toString());
    }

    console.log('[Payment Result] CheckMacValue 驗證成功');

    // 查詢訂單
    const orderSnapshot = await adminDb
      .collection('orders')
      .where('merchantTradeNo', '==', merchantTradeNo)
      .limit(1)
      .get();

    if (orderSnapshot.empty) {
      console.error('[Payment Result] 找不到訂單:', merchantTradeNo);
      const redirectUrl = new URL('/', request.url);
      redirectUrl.searchParams.set('payment', 'not-found');
      return NextResponse.redirect(redirectUrl.toString());
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
    const redirectUrl = new URL(`/order/${orderId}/result`, request.url);
    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('[Payment Result Error]', error);
    const redirectUrl = new URL('/', request.url);
    redirectUrl.searchParams.set('payment', 'error');
    return NextResponse.redirect(redirectUrl.toString());
  }
}
