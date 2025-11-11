import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import {
  getECPayConfig,
  verifyCheckMacValue,
  generateCheckMacValue,
} from '@/lib/ecpay';
import type { ECPayData } from '@/types/ecpay';

/**
 * POST /api/payment/callback
 * 接收綠界的伺服器端通知，驗證並更新訂單狀態
 * 這是綠界伺服器發送的通知（而非使用者瀏覽器）
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
    const rtnMsg = String(params.RtnMsg);
    const tradeNo = String(params.TradeNo);
    const tradeAmt = parseInt(String(params.TradeAmt), 10);
    const paymentDate = params.PaymentDate;
    const paymentType = params.PaymentType;
    const card4no = params.card4no;
    const card6no = params.card6no;
    const authCode = params.AuthCode;

    console.log('[Payment Callback] 收到綠界通知:', {
      merchantTradeNo,
      rtnCode,
      rtnMsg,
      tradeNo,
      tradeAmt,
    });

    // 取得 ECPay 設定
    const config = getECPayConfig();

    // 詳細調試：檢查簽章驗證
    const receivedCheckMacValue = String(params.CheckMacValue);
    const calculatedCheckMacValue = generateCheckMacValue(params, config.hashKey, config.hashIV);

    console.log('[Payment Callback] 簽章驗證詳情:', {
      merchantTradeNo,
      receivedCheckMacValue,
      calculatedCheckMacValue,
      match: receivedCheckMacValue === calculatedCheckMacValue,
      paramKeys: Object.keys(params).sort(),
    });

    // 輸出所有接收到的參數（用於調試）
    console.log('[Payment Callback] 接收到的完整參數:', JSON.stringify(params, null, 2));

    // 驗證 CheckMacValue
    // 臨時調試：檢查簽章驗證是否是問題所在
    const signatureVerified = verifyCheckMacValue(params, config.hashKey, config.hashIV);

    if (!signatureVerified) {
      console.warn('[Payment Callback] ⚠️ CheckMacValue 驗證失敗 (但在開發環境繼續處理):', {
        merchantTradeNo,
        received: receivedCheckMacValue,
        calculated: calculatedCheckMacValue,
      });
      // 在開發環境臨時禁用簽章驗證，以確定是否是簽章計算的問題
      if (process.env.NODE_ENV === 'production') {
        return new NextResponse('0|CheckMacValue verification failed', {
          status: 200,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
      // 開發環境：記錄警告但繼續處理
      console.log('[Payment Callback] ⚠️ 開發模式：跳過簽章驗證，繼續處理訂單...');
    } else {
      console.log('[Payment Callback] CheckMacValue 驗證成功');
    }

    // 查詢訂單
    const orderSnapshot = await adminDb
      .collection('orders')
      .where('merchantTradeNo', '==', merchantTradeNo)
      .limit(1)
      .get();

    if (orderSnapshot.empty) {
      console.error('[Payment Callback] 找不到訂單:', merchantTradeNo);
      return new NextResponse('0|Order not found', {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    const orderDoc = orderSnapshot.docs[0];
    const orderId = orderDoc.id;
    const existingOrder = orderDoc.data();

    // 檢查是否已處理過（去重）
    const eventSnapshot = await adminDb
      .collection('order_events')
      .where('orderId', '==', orderId)
      .where('type', '==', 'PAYMENT_CALLBACK')
      .where('payload.rtnCode', '==', rtnCode)
      .limit(1)
      .get();

    if (!eventSnapshot.empty) {
      console.log('[Payment Callback] 訂單已處理過，跳過:', {
        orderId,
        merchantTradeNo,
        rtnCode,
      });
      // 重複通知：回傳成功，但不更新狀態
      return new NextResponse('1|OK', {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // 準備 ECPay 回傳資料
    const ecpayData: ECPayData = {
      RtnCode: rtnCode,
      RtnMsg: rtnMsg,
      TradeNo: tradeNo,
      TradeAmt: tradeAmt,
      PaymentDate: String(paymentDate),
      PaymentType: String(paymentType),
      PaymentTypeChargeFee: parseInt(String(params.PaymentTypeChargeFee) || '0', 10),
      TradeDate: String(params.TradeDate),
      SimulatePaid: parseInt(String(params.SimulatePaid) || '0', 10),
      CheckMacValue: String(params.CheckMacValue),
      ...(card4no && { card4no: String(card4no) }),
      ...(card6no && { card6no: String(card6no) }),
      ...(authCode && { AuthCode: String(authCode) }),
    };

    // 根據 RtnCode 更新訂單狀態
    let newStatus = 'FAILED';
    if (rtnCode === 1) {
      newStatus = 'PAID';
    }

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

    // 更新訂單
    await orderDoc.ref.update(updateData);

    console.log('[Payment Callback] 訂單狀態已更新:', {
      orderId,
      merchantTradeNo,
      newStatus,
      rtnCode,
    });

    // 記錄事件
    await adminDb.collection('order_events').add({
      orderId,
      type: 'PAYMENT_CALLBACK',
      payload: {
        merchantTradeNo,
        rtnCode,
        rtnMsg,
        tradeNo,
        tradeAmt,
        paymentType,
      },
      createdAt: new Date(),
    });

    // 回傳成功回應
    return new NextResponse('1|OK', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error) {
    console.error('[Payment Callback Error]', error);
    // 綠界會根據回傳內容判斷是否重試，因此也要回傳 200
    return new NextResponse('0|Internal server error', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
