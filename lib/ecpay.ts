import crypto from 'crypto';
import type { ECPayAIOParams, ECPayConfig } from '@/types/ecpay';

/**
 * 綠界 ECPay 工具函式
 * 提供簽名生成、驗證、表單產生等功能
 */

/**
 * 取得 ECPay 設定
 */
export function getECPayConfig(): ECPayConfig {
  const merchantId = process.env.ECPAY_MERCHANT_ID;
  const hashKey = process.env.ECPAY_HASH_KEY;
  const hashIV = process.env.ECPAY_HASH_IV;
  const cashierUrl = process.env.ECPAY_CASHIER_URL;

  if (!merchantId || !hashKey || !hashIV || !cashierUrl) {
    throw new Error('缺少綠界金流環境變數');
  }

  return { merchantId, hashKey, hashIV, cashierUrl };
}

/**
 * ECPay 專用 URL Encode
 * 需要將某些字符轉換回未編碼的形式
 */
function urlEncodeForECPay(str: string): string {
  return encodeURIComponent(str)
    .replace(/%20/g, '+')
    .replace(/%21/g, '!')
    .replace(/%28/g, '(')
    .replace(/%29/g, ')')
    .replace(/%2A/gi, '*')
    .replace(/%2D/g, '-')
    .replace(/%2E/g, '.')
    .replace(/%5F/g, '_')
    .replace(/%7E/g, '~');
}

/**
 * 產生 CheckMacValue 簽名
 */
export function generateCheckMacValue(
  params: Record<string, string | number | undefined>,
  hashKey: string,
  hashIV: string
): string {
  // 1. 移除 CheckMacValue 欄位並過濾 undefined 值
  const filteredParams: Record<string, string | number> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && key !== 'CheckMacValue') {
      filteredParams[key] = value;
    }
  });

  // 2. 依照鍵名排序（區分大小寫）
  const sortedKeys = Object.keys(filteredParams).sort();

  // 3. 組合參數字串
  const paramString = sortedKeys
    .map((key) => `${key}=${filteredParams[key]}`)
    .join('&');

  // 4. 加上 HashKey 和 HashIV
  const rawString = `HashKey=${hashKey}&${paramString}&HashIV=${hashIV}`;

  // 5. URL Encode (ECPay 專用規則)
  const encodedString = urlEncodeForECPay(rawString);

  // 6. 轉小寫
  const lowerCaseString = encodedString.toLowerCase();

  // 7. SHA256 加密
  const hash = crypto
    .createHash('sha256')
    .update(lowerCaseString, 'utf8')
    .digest('hex');

  // 8. 轉大寫
  return hash.toUpperCase();
}

/**
 * 驗證 CheckMacValue 簽名
 */
export function verifyCheckMacValue(
  params: Record<string, string | number | undefined>,
  hashKey: string,
  hashIV: string
): boolean {
  const receivedCheckMacValue = params.CheckMacValue;
  if (!receivedCheckMacValue) {
    return false;
  }

  const calculatedCheckMacValue = generateCheckMacValue(params, hashKey, hashIV);

  // 詳細調試日誌
  if (process.env.NODE_ENV === 'development') {
    console.log('[ECPay] 簽章驗證細節:', {
      received: String(receivedCheckMacValue),
      calculated: calculatedCheckMacValue,
      match: String(receivedCheckMacValue) === calculatedCheckMacValue,
    });
  }

  return String(receivedCheckMacValue) === calculatedCheckMacValue;
}

/**
 * 產生商家交易編號
 * 格式：YYYYMMDDHHmmss + 6位隨機碼 = 20碼
 */
export function generateMerchantTradeNo(): string {
  const now = new Date();
  const dateString = now
    .toISOString()
    .replace(/[-:T.]/g, '')
    .substring(0, 14); // YYYYMMDDHHmmss
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${dateString}${random}`.substring(0, 20);
}

/**
 * 格式化日期為綠界要求的格式
 * 格式：yyyy/MM/dd HH:mm:ss
 */
export function formatECPayTradeDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 產生 ECPay AIO 支付表單
 */
export function generateECPayForm(
  params: ECPayAIOParams,
  cashierUrl: string
): string {
  const formFields = Object.entries(params)
    .map(
      ([key, value]) =>
        `<input type="hidden" name="${key}" value="${String(value).replace(/"/g, '&quot;')}" />`
    )
    .join('\n    ');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>前往綠界付款</title>
</head>
<body>
  <form id="ecpayForm" method="POST" action="${cashierUrl}">
    ${formFields}
  </form>
  <script>
    document.getElementById('ecpayForm').submit();
  </script>
</body>
</html>`.trim();
}

/**
 * 準備 ECPay AIO 參數
 */
export function prepareECPayParams(
  merchantTradeNo: string,
  totalAmount: number,
  itemName: string,
  merchantId: string,
  appBaseUrl: string,
  paymentMethod: 'Credit' | 'ATM' | 'ALL' = 'Credit'
): ECPayAIOParams {
  return {
    MerchantID: merchantId,
    MerchantTradeNo: merchantTradeNo,
    MerchantTradeDate: formatECPayTradeDate(),
    PaymentType: 'aio',
    TotalAmount: totalAmount,
    TradeDesc: '線上課程購買',
    ItemName: itemName,
    ReturnURL: `${appBaseUrl}/api/payment/callback`,
    ChoosePayment: paymentMethod,
    EncryptType: 1,
    ClientBackURL: `${appBaseUrl}/order/result`,
    OrderResultURL: `${appBaseUrl}/api/payment/result`,
    NeedExtraPaidInfo: 'Y',
  };
}
