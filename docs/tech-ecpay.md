# 綠界金流結帳功能技術規格書 (ECPay Checkout Integration)

> **文件版本**：v1.0
> **最後更新**：2025-11-11
> **維護者**：平台開發團隊
> **用途**：為其他專案提供綠界金流整合的完整技術參考
>
> 本文檔記錄了綠界 (ECPay) AIO 一次付清付款方案的完整實作細節，可作為其他專案進行綠界金流整合的開發藍本。
> 參考來源：綠界科技金流整合指南、[全方位物流服務 API 技術文件](https://developers.ecpay.com.tw/?p=10075)。

本文件說明專案中與綠界金流（ECPay）串接的重點設定與流程，協助開發者在測試環境完成信用卡一次付清的導轉與 callback 驗證。

---

## 目錄

1. [概述](#概述)
2. [User Stories](#user-stories)
3. [功能需求](#功能需求)
4. [技術架構](#技術架構)
5. [核心模組實作](#核心模組實作)
6. [API 規格](#api-規格)
7. [資料模型](#資料模型)
8. [安全性考量](#安全性考量)
9. [錯誤處理](#錯誤處理)
10. [測試策略](#測試策略)
11. [導入其他專案的步驟](#導入其他專案的步驟)
12. [常見問題](#常見問題)
13. [參考資料](#參考資料)

---

## 概述

### 什麼是綠界 ECPay？

綠界科技 (ECPay) 是台灣領先的第三方支付服務商，提供多種支付方案。本文檔特別關注 **AIO 一次付清** (All In One, 即時結帳) 方案，該方案支援：

- **信用卡**：一次付清（含分期、紅利等）
- **電子錢包**：LINE Pay、Apple Pay、Google Pay 等
- **ATM 轉帳**：銀行帳號自動轉帳
- **超商繳費**：7-11、全家、OK 等

### 本專案採用範圍

此技術規格採用 **信用卡一次付清** + **ATM 轉帳** 的混合模式：

```
信用卡流程：前台 → API建立訂單 → 導轉綠界付款頁 → 綠界回傳結果 → 更新訂單狀態
ATM流程：  前台 → API建立訂單 → 直接導回結果頁（顯示銀行帳號） → 手動或自動核帳
```

### 技術棧

```
Frontend:
  ├─ Next.js 15 (App Router)
  ├─ React 19
  ├─ TypeScript
  └─ Tailwind CSS 4

Backend:
  ├─ Next.js Route Handlers
  ├─ Firebase Admin SDK (Firestore)
  └─ Node.js crypto (CheckMacValue簽名)

Payment Gateway:
  └─ ECPay AIO 一次付清
    ├─ 測試環境：https://payment-stage.ecpay.com.tw
    └─ 正式環境：https://payment.ecpay.com.tw
```

---

## User Stories

### US-001: 信用卡結帳流程

**As a** 顧客
**I want to** 使用信用卡在我的購物清單上付款
**So that** 我可以快速完成購買流程

**驗收條件：**
- [ ] 顧客可以在結帳頁面選擇信用卡付款
- [ ] 系統建立訂單並顯示支付確認
- [ ] 顧客被導向綠界金流頁面
- [ ] 付款成功後，訂單狀態更新為 PAID
- [ ] 顧客看到成功確認頁面

**技術流程：**
```
1. POST /api/checkout → 建立訂單（狀態：CREATED）
2. 後端計算 CheckMacValue 並產生 HTML 表單
3. 返回 HTML（自動提交表單到綠界）
4. 綠界顯示付款頁面
5. 顧客刷卡付款
6. 綠界回傳通知：
   - POST /api/payment/callback（伺服器通知，確保收到）
   - POST /api/payment/result（使用者前端導回）
7. 驗證 CheckMacValue 並更新訂單狀態為 PAID
8. 顯示訂單確認頁面
```

### US-002: ATM 轉帳流程

**As a** 顧客
**I want to** 選擇 ATM 轉帳進行付款
**So that** 我可以透過銀行轉帳完成購買

**驗收條件：**
- [ ] 顧客可以在結帳頁面選擇 ATM 轉帳
- [ ] 系統建立訂單（狀態：CREATED）
- [ ] 顧客被導向訂單詳情頁，顯示銀行帳號與轉帳資訊
- [ ] 訂單標記為「待匯款」狀態
- [ ] 管理員可手動或自動更新訂單為已付款

**技術流程：**
```
1. POST /api/checkout → 建立訂單（狀態：CREATED）
2. 檢測 paymentMethod === 'ATM'
3. 返回 JSON { redirectUrl: /order/:id/result?payment=atm }
4. 前端導向結果頁
5. 顯示銀行轉帳資訊（無綠界參與）
6. 顧客進行銀行轉帳
7. 管理員核帳後，手動更新訂單狀態為 PAID
```

### US-003: 支付結果查詢

**As a** 顧客
**I want to** 查看我的訂單付款狀態
**So that** 我可以確認購買是否完成

**驗收條件：**
- [ ] 顧客可以訪問 `/order/:id/result` 查看訂單詳情
- [ ] 頁面清楚顯示付款狀態（成功/待款/失敗）
- [ ] 信用卡訂單顯示末四碼、付款時間
- [ ] ATM 訂單顯示轉帳資訊

### US-004: 防重複扣款

**As a** 系統管理員
**I want to** 綠界在發送重複通知時不會重複處理訂單
**So that** 顧客不會被重複扣款

**驗收條件：**
- [ ] 系統記錄每筆交易的處理狀態
- [ ] 同一 MerchantTradeNo + RtnCode 的通知只處理一次
- [ ] 重複通知回傳成功（1|OK），但不更新訂單狀態

### US-005: 安全的簽名驗證

**As a** 系統管理員
**I want to** 確認所有支付通知的完整性
**So that** 防止支付資訊被竄改

**驗收條件：**
- [ ] 所有綠界回傳的資料都驗證 CheckMacValue
- [ ] 簽名驗證失敗的請求被拒絕
- [ ] 所有簽名生成與驗證邏輯完全相同

---

## 功能需求

### 功能清單

#### FN-001: 訂單建立（Checkout）

**目的**：建立新訂單並初始化支付流程

**輸入**：
```typescript
{
  item: { name, price, quantity, variant? },
  buyer: { name, email, phone, address, city, district, zipCode },
  shippingMethod: 'HOME' | 'STORE',
  paymentMethod: 'CREDIT' | 'ATM',
  originalAmount: number,
  amount: number,
  discount?: number,
  shippingFee: number,
  totalAmount: number,
  couponCode?: string,
  note?: string
}
```

**輸出**：
- 信用卡：返回自動提交的 HTML 表單（表單會自動導轉綠界）
- ATM：返回 JSON，前端導向訂單詳情頁

**流程**：
1. 驗證輸入資料完整性
2. 建立訂單到資料庫（狀態：CREATED）
3. 生成 MerchantTradeNo（綠界交易編號）
4. 若為信用卡：計算 CheckMacValue，產生 HTML 表單
5. 若為 ATM：回傳重定向 URL

---

#### FN-002: CheckMacValue 簽名

**目的**：確保支付資訊完整性和安全性

**演算法**：SHA256 簽名

**步驟**：
```
1. 移除 CheckMacValue 欄位
2. 按 ASCII 順序排序參數
3. 組合字串：key1=value1&key2=value2...
4. 加入 HashKey 與 HashIV：HashKey=xxx&參數&HashIV=xxx
5. URL Encode（ECPay 專用規則）
6. 小寫轉換
7. SHA256 加密
8. 大寫轉換
```

**ECPay 專用 URL Encode**：
```javascript
encodeURIComponent(str)
  .replace(/%20/g, '+')
  .replace(/%21/g, '!')
  .replace(/%28/g, '(')
  .replace(/%29/g, ')')
  .replace(/%2A/gi, '*')
```

---

#### FN-003: 支付通知處理（Webhook）

**目的**：接收綠界的支付結果通知並更新訂單狀態

**觸發方式**：
- **ReturnURL** (`/api/payment/callback`)：綠界伺服器發送 POST 請求
- **OrderResultURL** (`/api/payment/result`)：用戶瀏覽器發送 POST 請求

**參數**：
```typescript
{
  MerchantTradeNo: string,      // 商家交易編號
  RtnCode: 1 | 非1,             // 1=成功, 其他=失敗
  RtnMsg: string,               // 回傳訊息
  TradeNo: string,              // 綠界交易編號
  TradeAmt: number,             // 交易金額
  PaymentDate: string,          // 付款時間（yyyy/MM/dd HH:mm:ss）
  PaymentType: string,          // 付款方式（Credit 等）
  card4no?: string,             // 信用卡末四碼
  card6no?: string,             // 信用卡前六碼
  AuthCode?: string,            // 授權碼
  CheckMacValue: string         // 簽名
}
```

**流程**：
1. 解析 FormData
2. 驗證 CheckMacValue
3. 查詢訂單
4. 檢查是否已處理（防重複）
5. 根據 RtnCode 更新訂單狀態
   - RtnCode = 1 → 狀態改為 PAID
   - 其他 → 狀態改為 FAILED
6. 回傳 "1|OK"（表示成功接收）

---

#### FN-004: 去重機制（Idempotent）

**目的**：防止重複的支付通知導致重複扣款

**實現方式**：
```typescript
// 記錄每個 (MerchantTradeNo, RtnCode) 的處理狀況
// 如果同樣的組合再次收到，直接回傳成功但不更新狀態
const alreadyProcessed = await isOrderAlreadyProcessed(
  merchantTradeNo,
  rtnCode
);

if (alreadyProcessed) {
  return '1|OK'; // 直接回傳成功
}
```

**儲存方式**：
- 可用 Firestore `order_events` Collection 記錄
- 或在 `orders` Collection 記錄 `lastProcessedRtnCode`

---

### 非功能需求

| 需求 | 描述 | 驗收標準 |
| --- | --- | --- |
| **安全性** | 所有支付資訊加密簽名，防止篡改 | 100% 的通知都驗證 CheckMacValue |
| **可靠性** | 支付通知即使重複也不會重複扣款 | 重複通知測試通過 |
| **效能** | API 響應時間 < 500ms | 支付結果頁加載 < 2s |
| **可觀測性** | 記錄所有支付相關的事件和錯誤 | 有完整的日誌和審計線索 |
| **容錯性** | 綠界通知延遲時也能正確處理 | 前後端通知都能更新訂單狀態 |

---

## 技術架構

### 高層架構圖

```
┌─────────────────────────────────────────────────────────┐
│ Frontend (Next.js 15 - Client Components)              │
│  ├─ 商品頁面：展示商品、規格、購物車                     │
│  ├─ 結帳頁面：收集買家資訊、選擇配送與付款方式          │
│  └─ 訂單詳情頁：顯示訂單狀態、付款結果                   │
└─────────────────────────────────────────────────────────┘
                            ↓ POST /api/checkout
┌─────────────────────────────────────────────────────────┐
│ Backend API (Next.js Route Handlers - Server Side)      │
│  ├─ POST /api/checkout                                  │
│  │   ├─ 驗證表單資料                                    │
│  │   ├─ 建立訂單（Firestore）                           │
│  │   └─ 產生綠界表單或重定向 URL                        │
│  ├─ POST /api/payment/callback                          │
│  │   ├─ 驗證 CheckMacValue                              │
│  │   ├─ 查詢訂單並檢查去重                              │
│  │   └─ 更新訂單狀態                                    │
│  └─ POST /api/payment/result                            │
│      ├─ 驗證 CheckMacValue                              │
│      ├─ 作為最後保險更新狀態（若 callback 延遲）       │
│      └─ 導轉到訂單詳情頁                                │
└─────────────────────────────────────────────────────────┘
         ↓                                    ↓
   ┌──────────────────┐          ┌───────────────────┐
   │ Firebase         │          │ ECPay Payment     │
   │ Firestore DB     │          │ Gateway (Stage)   │
   │  ├─ orders       │          │ Payment Page      │
   │  ├─ order_events │          │ Server Notify     │
   │  └─ coupons      │          │ User Return       │
   └──────────────────┘          └───────────────────┘
```

### 資料流圖

```
User Click "Pay"
    ↓
POST /api/checkout
    ├─ Create Order (CREATED status)
    ├─ Generate MerchantTradeNo
    └─ [Credit Card] Generate HTML Form with CheckMacValue
       [ATM] Return redirect URL
    ↓
[Credit Card Flow]
    ├─ Browser auto-submit form to ECPay
    └─ User enters credit card details
        ↓
    ECPay processes payment
        ├─ Success: RtnCode=1
        └─ Failure: RtnCode≠1
    ↓
    [Parallel] Server-to-Server notification
    ├─ POST /api/payment/callback
    ├─ Verify CheckMacValue
    ├─ Get Order and check idempotent
    ├─ Update status to PAID/FAILED
    └─ Return "1|OK"
    ↓
    [Parallel] User browser return
    ├─ POST /api/payment/result
    ├─ Verify CheckMacValue
    └─ Redirect to /order/:id/result
    ↓
    Display Order Confirmation Page

[ATM Flow]
    ├─ Return redirect URL
    └─ Redirect to /order/:id/result?payment=atm
        ├─ Display bank transfer info
        └─ Status: CREATED (waiting for payment)
    ↓
    Manual or automatic reconciliation
    └─ Update status to PAID
```

### 系統組件

| 組件 | 位置 | 責任 |
| --- | --- | --- |
| **ECPay 工具** | `lib/ecpay.ts` | 簽名生成、驗證、表單生成 |
| **訂單管理** | `lib/orders.ts` | 訂單 CRUD、狀態更新、去重 |
| **結帳 API** | `app/api/checkout/route.ts` | 接收結帳請求，建立訂單 |
| **支付回調** | `app/api/payment/callback/route.ts` | 綠界伺服器通知 |
| **支付結果** | `app/api/payment/result/route.ts` | 綠界前端導回 |
| **前端結帳** | `app/page.tsx` | 購物車、結帳表單、提交 |
| **訂單頁面** | `app/order/[id]/result/page.tsx` | 顯示訂單結果 |

---

## 核心模組實作

### 模組 1: ECPay 工具 (`lib/ecpay.ts`)

#### 函式：getECPayConfig()

```typescript
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
```

**責任**：讀取環境變數並驗證完整性

---

#### 函式：generateCheckMacValue()

```typescript
export function generateCheckMacValue(
  params: Record<string, any>,
  hashKey: string,
  hashIV: string
): string {
  // 1. 移除 CheckMacValue 欄位
  const filteredParams = { ...params };
  delete filteredParams.CheckMacValue;

  // 2. 依照鍵名排序
  const sortedKeys = Object.keys(filteredParams).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  );

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
  const hash = crypto.createHash('sha256')
    .update(lowerCaseString)
    .digest('hex');

  // 8. 轉大寫
  return hash.toUpperCase();
}
```

**責任**：產生 CheckMacValue 簽名

**關鍵點**：
- 排序參數時使用 `localeCompare` 而非簡單 `sort`，避免大小寫敏感問題
- URL Encode 使用 ECPay 專用規則（不同於標準 RFC）
- 必須先轉小寫再 SHA256，再轉大寫

---

#### 函式：verifyCheckMacValue()

```typescript
export function verifyCheckMacValue(
  params: Record<string, any>,
  hashKey: string,
  hashIV: string
): boolean {
  const receivedCheckMacValue = params.CheckMacValue;
  if (!receivedCheckMacValue) {
    return false;
  }

  const calculatedCheckMacValue = generateCheckMacValue(
    params,
    hashKey,
    hashIV
  );
  return receivedCheckMacValue === calculatedCheckMacValue;
}
```

**責任**：驗證簽名完整性

**使用場景**：
- 在 `/api/payment/callback` 驗證綠界通知
- 在 `/api/payment/result` 驗證前端導回資料

---

#### 函式：generateMerchantTradeNo()

```typescript
export function generateMerchantTradeNo(): string {
  const now = new Date();
  const dateString = now
    .toISOString()
    .replace(/[-:T.]/g, '')
    .substring(0, 14); // YYYYMMDDHHmmss
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${dateString}${random}`.substring(0, 20);
}
```

**責任**：產生唯一的交易編號

**格式**：`YYYYMMDDHHmmss` + 6 位隨機碼 = 20 碼

**優點**：
- 時間戳基礎 + 隨機數，幾乎不會重複
- 易於追蹤（包含時間資訊）

---

#### 函式：formatECPayTradeDate()

```typescript
export function formatECPayTradeDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}
```

**責任**：格式化日期為綠界要求的格式

**格式**：`yyyy/MM/dd HH:mm:ss`

---

#### 函式：generateECPayForm()

```typescript
export function generateECPayForm(
  params: ECPayAIOParams,
  cashierUrl: string
): string {
  const formFields = Object.entries(params)
    .map(([key, value]) =>
      `<input type="hidden" name="${key}" value="${value}" />`
    )
    .join('\n    ');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>前往綠界付款</title>
</head>
<body>
  <form id="ecpayForm" method="post" action="${cashierUrl}">
    ${formFields}
  </form>
  <script>
    document.getElementById('ecpayForm').submit();
  </script>
</body>
</html>
  `.trim();
}
```

**責任**：產生自動提交的 HTML 表單

**特點**：
- 返回純 HTML，無需前端介入
- 瀏覽器自動提交表單到綠界
- 所有參數隱藏在 hidden input 中

---

### 模組 2: 訂單管理 (`lib/orders.ts`)

#### 函式：createOrder()

**責任**：建立新訂單到資料庫

**輸入**：
```typescript
interface CreateOrderInput {
  item: { name, price, quantity, variant? };
  buyer: { name, email, phone, address, city, district, zipCode };
  originalAmount: number;
  amount: number;
  discount?: number;
  shippingFee: number;
  totalAmount: number;
  shippingMethod: 'HOME' | 'STORE';
  paymentMethod: 'CREDIT' | 'ATM';
  couponCode?: string;
  note?: string;
}
```

**流程**：
1. 生成 MerchantTradeNo
2. 設定初始狀態為 CREATED
3. 寫入 Firestore
4. 記錄事件到 order_events

**輸出**：訂單物件（含 ID）

---

#### 函式：getOrderByMerchantTradeNo()

**責任**：根據綠界交易編號查詢訂單

**使用場景**：
- 在支付回調中查詢訂單

---

#### 函式：updateOrderStatus()

**責任**：更新訂單狀態

**流程**：
1. 查詢訂單
2. 更新狀態與 ecpay 資料
3. 設定 paidAt/failedAt 時間戳
4. 記錄事件

---

#### 函式：isOrderAlreadyProcessed()

**責任**：檢查訂單是否已處理過（去重）

**實現**：
```typescript
async function isOrderAlreadyProcessed(
  merchantTradeNo: string,
  rtnCode: number
): Promise<boolean> {
  // 查詢 order_events，檢查是否存在相同的 (merchantTradeNo, rtnCode)
  const event = await db.collection('order_events')
    .where('merchantTradeNo', '==', merchantTradeNo)
    .where('rtnCode', '==', rtnCode)
    .limit(1)
    .get();

  return !event.empty;
}
```

---

### 模組 3: 結帳 API (`app/api/checkout/route.ts`)

**目的**：接收結帳請求，建立訂單，回傳支付資訊

**HTTP 方法**：POST

**請求體**：
```json
{
  "item": { "name": "商品名稱", "price": 1000, "quantity": 1 },
  "buyer": {
    "name": "王小明",
    "email": "wang@example.com",
    "phone": "0912345678",
    "address": "大安區中山路100號",
    "city": "台北市",
    "district": "大安區",
    "zipCode": "10001"
  },
  "shippingMethod": "HOME",
  "paymentMethod": "CREDIT",
  "originalAmount": 1000,
  "amount": 900,
  "discount": 100,
  "shippingFee": 100,
  "totalAmount": 1000,
  "couponCode": "VIBE100",
  "note": "請於下午送達"
}
```

**流程**：

```javascript
1. 驗證必填欄位（item, buyer, amount 等）
2. 規範化輸入（paymentMethod, shippingMethod）
3. 建立訂單
   await createOrder(orderInput)
4. 檢查付款方式

   if (paymentMethod === 'ATM') {
     // ATM 流程：直接返回重定向 URL
     return {
       orderId: order.id,
       redirectUrl: `/order/${order.id}/result?payment=atm`
     };
   }

   // 信用卡流程
5. 取得綠界設定
   getECPayConfig()
6. 準備綠界 AIO 參數
   {
     MerchantID: "2000132",
     MerchantTradeNo: "20251111123456ABC",
     MerchantTradeDate: "2025/11/11 12:34:56",
     PaymentType: "aio",
     TotalAmount: 1000,
     TradeDesc: "線上購物",
     ItemName: "商品名稱",
     ReturnURL: "https://example.com/api/payment/callback",
     ChoosePayment: "Credit",
     EncryptType: 1,
     ClientBackURL: "https://example.com/order/xxx/result",
     OrderResultURL: "https://example.com/api/payment/result",
     NeedExtraPaidInfo: "Y"
   }
7. 生成 CheckMacValue
   generateCheckMacValue(params, hashKey, hashIV)
8. 將 CheckMacValue 加入參數
9. 產生 HTML 表單
   generateECPayForm(fullParams, cashierUrl)
10. 返回 HTML（自動提交）
```

**回傳格式**：

**信用卡**：
```
Content-Type: text/html; charset=utf-8
Body: 自動提交的 HTML 表單
```

**ATM**：
```json
{
  "orderId": "xxx",
  "redirectUrl": "/order/xxx/result?payment=atm"
}
```

**錯誤回傳**：
```json
{
  "error": "建立訂單失敗",
  "detailedError": "缺少買家資料"  // 只在開發環境返回
}
```

---

### 模組 4: 支付回調 API (`app/api/payment/callback/route.ts`)

**目的**：接收綠界的伺服器端通知，驗證並更新訂單狀態

**HTTP 方法**：POST

**請求來源**：綠界伺服器（而非使用者瀏覽器）

**請求體**：FormData（表單格式）

**流程**：

```javascript
1. 解析 FormData
   const params = {};
   formData.forEach((value, key) => { params[key] = value; });

2. 記錄日誌
   console.log('[Payment Callback] 收到綠界通知:', {
     MerchantTradeNo, RtnCode, RtnMsg, TradeNo, TradeAmt
   });

3. 取得綠界設定
   getECPayConfig()

4. 驗證 CheckMacValue
   if (!verifyCheckMacValue(params, hashKey, hashIV)) {
     return '0|CheckMacValue verification failed';
   }

5. 查詢訂單
   const order = getOrderByMerchantTradeNo(MerchantTradeNo);
   if (!order) {
     return '0|Order not found';
   }

6. 檢查是否已處理（去重）
   const alreadyProcessed = isOrderAlreadyProcessed(
     MerchantTradeNo,
     RtnCode
   );
   if (alreadyProcessed) {
     return '1|OK';  // 直接回傳成功，但不更新狀態
   }

7. 準備綠界回傳資料
   {
     RtnCode: 1,        // 1 = 成功
     RtnMsg: "成功",
     TradeNo: "xxx",
     TradeAmt: 1000,
     PaymentDate: "2025/11/11 12:34:56",
     card4no: "1111",
     AuthCode: "xxx"
   }

8. 根據 RtnCode 更新訂單狀態
   if (RtnCode === 1) {
     updateOrderStatus(order.id, 'PAID', ecpayData);
   } else {
     updateOrderStatus(order.id, 'FAILED', ecpayData);
   }

9. 記錄事件
   createOrderEvent(order.id, 'PAYMENT_SUCCESS', ecpayData);

10. 回傳成功回應
    return '1|OK';
```

**回傳格式**：

```
Content-Type: text/plain
Body: "1|OK"  (成功)
Body: "0|..." (失敗)
```

**重點**：
- 必須回傳純文字 "1|OK"，綠界才認為成功接收
- 回傳 "0|" 前綴表示失敗，綠界會重試
- 整個流程應在 30 秒內完成

---

### 模組 5: 支付結果 API (`app/api/payment/result/route.ts`)

**目的**：接收綠界的前端導回，驗證並重定向到訂單詳情頁

**HTTP 方法**：POST

**請求來源**：使用者瀏覽器（綠界付款頁面）

**流程**：

```javascript
1. 解析 FormData

2. 提取 MerchantTradeNo
   if (!MerchantTradeNo) {
     redirect('/?payment=missing');
   }

3. 查詢訂單
   const order = getOrderByMerchantTradeNo(MerchantTradeNo);
   if (!order) {
     redirect('/?payment=not-found');
   }

4. 驗證 CheckMacValue
   if (!verifyCheckMacValue(params, hashKey, hashIV)) {
     redirect(`/order/${order.id}/result?payment=invalid`);
   }

5. 作為最後保險更新訂單狀態
   // 如果 callback 尚未執行，這裡更新
   if (order.status === 'CREATED') {
     if (RtnCode === 1) {
       updateOrderStatus(order.id, 'PAID', ecpayData);
     } else if (RtnCode !== 0) {
       updateOrderStatus(order.id, 'FAILED', ecpayData);
     }
   }

6. 重定向到訂單頁面
   redirect(`/order/${order.id}/result`);
```

**回傳格式**：HTTP 302 重定向

**特點**：
- 這是備用通知，主要的狀態更新在 `/api/payment/callback`
- 如果 callback 因網路問題延遲，這裡會補救

---

## API 規格

### 完整 API 參考表

| 端點 | 方法 | 來源 | 責任 | 回傳 |
| --- | --- | --- | --- | --- |
| `/api/checkout` | POST | 前端 | 建立訂單、產生支付資訊 | HTML (信用卡) 或 JSON (ATM) |
| `/api/payment/callback` | POST | 綠界伺服器 | 驗證並更新訂單狀態 | "1\|OK" 或 "0\|..." |
| `/api/payment/result` | POST | 使用者瀏覽器 | 驗證並重定向 | HTTP 302 重定向 |

### API 詳細規格

#### POST /api/checkout

```yaml
Request:
  Content-Type: application/json
  Body:
    {
      "item": {
        "name": string,
        "price": number,
        "quantity": number,
        "variant": string?
      },
      "buyer": {
        "name": string,
        "email": string,
        "phone": string,
        "address": string,
        "city": string,
        "district": string,
        "zipCode": string
      },
      "shippingMethod": "HOME" | "STORE",
      "paymentMethod": "CREDIT" | "ATM",
      "originalAmount": number,
      "amount": number,
      "discount": number?,
      "shippingFee": number,
      "totalAmount": number,
      "couponCode": string?,
      "note": string?
    }

Response Success (Credit Card):
  Status: 200
  Content-Type: text/html; charset=utf-8
  Body: <HTML form with auto-submit>

Response Success (ATM):
  Status: 200
  Content-Type: application/json
  Body:
    {
      "orderId": "xxx",
      "redirectUrl": "/order/xxx/result?payment=atm"
    }

Response Error:
  Status: 400 | 500
  Content-Type: application/json
  Body:
    {
      "error": "建立訂單失敗",
      "detailedError": "..." (dev only)
    }
```

---

#### POST /api/payment/callback

```yaml
Request:
  Content-Type: application/x-www-form-urlencoded
  Body: FormData
    MerchantTradeNo=xxx
    RtnCode=1
    RtnMsg=成功
    TradeNo=xxx
    TradeAmt=1000
    PaymentDate=2025/11/11 12:34:56
    card4no=1111
    CheckMacValue=xxx

Response Success:
  Status: 200
  Content-Type: text/plain
  Body: "1|OK"

Response Error:
  Status: 200  (仍要回傳 200)
  Content-Type: text/plain
  Body: "0|CheckMacValue verification failed"
```

---

#### POST /api/payment/result

```yaml
Request:
  Content-Type: application/x-www-form-urlencoded
  Body: FormData (same as callback)

Response Success:
  Status: 302
  Location: /order/{orderId}/result

Response Error:
  Status: 302
  Location: /?payment=error
```

---

## 資料模型

### Order 資料結構

```typescript
interface Order {
  // 基本資訊
  id: string;                      // Firestore 文件 ID
  status: 'CREATED' | 'PAID' | 'FAILED' | 'CANCELED';

  // 金額資訊
  originalAmount: number;          // 折扣前金額
  amount: number;                  // 折扣後金額
  discount?: number;               // 折扣金額
  couponCode?: string;             // 優惠券代碼
  promotionNote?: string;          // 促銷備註
  freeShippingApplied?: boolean;   // 是否套用滿額免運
  shippingFee: number;             // 運費
  totalAmount: number;             // 總金額

  // 配送資訊
  shippingMethod: 'HOME' | 'STORE';

  // 付款資訊
  paymentMethod: 'CREDIT' | 'ATM';

  // 商品資訊
  item: {
    name: string;
    price: number;
    quantity: number;
    variant?: string;
  };

  // 買家資訊
  buyer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    district: string;
    zipCode: string;
  };

  // 訂單備註
  note?: string;

  // 綠界交易資訊
  merchantTradeNo: string;         // 綠界交易編號（唯一）
  ecpay?: {
    MerchantID: string;
    StoreID?: string;
    RtnCode: number;
    RtnMsg: string;
    TradeNo: string;
    TradeAmt: number;
    PaymentDate: string;
    PaymentType: string;
    PaymentTypeChargeFee: number;
    TradeDate: string;
    SimulatePaid: number;
    CheckMacValue: string;
    card4no?: string;              // 信用卡末四碼
    card6no?: string;              // 信用卡前六碼
    AuthCode?: string;             // 授權碼
  };

  // 時間戳
  createdAt: Date;
  paidAt?: Date;
  failedAt?: Date;
  canceledAt?: Date;
}
```

### OrderEvent 資料結構

```typescript
interface OrderEvent {
  id: string;
  orderId: string;
  type: 'CREATED' | 'PAYMENT_INITIATED' | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'COUPON_APPLIED';
  payload: Record<string, any>;
  createdAt: Date;
}
```

### Firestore Collection Schema

**Collection: orders**
```
orders/
  {orderId}/
    id: string
    status: string
    originalAmount: number
    amount: number
    discount: number
    couponCode: string
    shippingFee: number
    totalAmount: number
    shippingMethod: string
    paymentMethod: string
    item: { name, price, quantity, variant }
    buyer: { name, email, phone, address, city, district, zipCode }
    note: string
    merchantTradeNo: string (indexed)
    ecpay: { RtnCode, RtnMsg, TradeNo, ... }
    createdAt: timestamp
    paidAt: timestamp
    failedAt: timestamp
    canceledAt: timestamp
```

**Collection: order_events**
```
order_events/
  {eventId}/
    orderId: string (indexed)
    type: string
    payload: { ... }
    createdAt: timestamp
```

### 創建索引

在 Firestore 中創建以下索引以提高查詢效能：

```
Collection: orders
  Index 1: merchantTradeNo (Ascending)
  Index 2: createdAt (Descending)
  Index 3: status (Ascending) + createdAt (Descending)

Collection: order_events
  Index 1: orderId (Ascending) + createdAt (Descending)
  Index 2: type (Ascending) + createdAt (Descending)
```

---

## 安全性考量

### SC-001: CheckMacValue 驗證

**目的**：防止支付資訊被竄改或僞造

**實現**：
```typescript
// 所有接收綠界資料的 API 都必須驗證
const isValid = verifyCheckMacValue(params, hashKey, hashIV);
if (!isValid) {
  // 拒絕處理
  return '0|Invalid CheckMacValue';
}
```

**原理**：
- HashKey 和 HashIV 只在後端存儲（環境變數）
- 前端無法得知這些金鑰
- 因此前端無法偽造有效的簽名

---

### SC-002: 防重複扣款

**目的**：防止綠界重複發送通知導致重複扣款

**實現**：
```typescript
// 記錄已處理的 (MerchantTradeNo, RtnCode)
const alreadyProcessed = await isOrderAlreadyProcessed(
  merchantTradeNo,
  rtnCode
);

if (alreadyProcessed) {
  // 回傳成功，但不更新狀態
  return '1|OK';
}

// 首次處理：更新訂單狀態並記錄事件
await updateOrderStatus(orderId, 'PAID', ecpayData);
```

---

### SC-003: 環境變數保護

**原則**：
- 所有敏感資訊（HashKey、HashIV、API 金鑰）存儲在環境變數
- `.env.local` 被加入 `.gitignore`，不提交到 Git
- Firebase Service Account Key 也必須存儲為環境變數

**環境變數列表**：
```bash
ECPAY_MERCHANT_ID=2000132
ECPAY_HASH_KEY=xxxxx
ECPAY_HASH_IV=xxxxx
ECPAY_CASHIER_URL=https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5
APP_BASE_URL=http://localhost:3000
FIREBASE_PROJECT_ID=xxx
FIREBASE_CLIENT_EMAIL=xxx
FIREBASE_PRIVATE_KEY=xxx
```

---

### SC-004: HTTPS 強制

**生產環境要求**：
- 所有通信都必須使用 HTTPS
- 在 Vercel 上自動啟用
- 可在 next.config.ts 中添加安全標頭

```typescript
// next.config.ts
export default {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },
};
```

---

### SC-005: API 端點保護

**保護措施**：

```typescript
// 1. 速率限制（可用第三方庫如 ratelimit）
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'),
});

// 2. 驗證請求來源（綠界 IP 白名單）
const allowedIPs = ['xxx.xxx.xxx.xxx']; // ECPay servers
if (!allowedIPs.includes(req.ip)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// 3. 驗證簽名
if (!verifyCheckMacValue(params, hashKey, hashIV)) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
}
```

---

## 錯誤處理

### 常見錯誤及處理

| 錯誤代碼 | 原因 | 處理方式 |
| --- | --- | --- |
| CheckMacValue 驗證失敗 | 簽名不正確，可能被篡改 | 拒絕處理，記錄日誌 |
| 訂單不存在 | MerchantTradeNo 無法查詢到訂單 | 返回錯誤，調查 |
| 訂單已處理 | 同樣的通知已處理過 | 返回成功，跳過更新 |
| 環境變數缺失 | HashKey 或 HashIV 未設定 | 拋出錯誤，終止程序 |
| 資料庫連接失敗 | Firestore 不可用 | 返回 500，綠界會重試 |

### 錯誤日誌範例

```javascript
// 成功案例
console.log('[Checkout] 訂單已建立:', order.id, order.merchantTradeNo);
console.log('[Payment Callback] CheckMacValue 驗證成功');
console.log('[Payment Callback] 訂單付款成功:', order.id);

// 失敗案例
console.error('[Checkout] 缺少綠界金流環境變數');
console.error('[Payment Callback] CheckMacValue 驗證失敗');
console.error('[Payment Callback] 找不到訂單:', merchantTradeNo);
```

---

## 測試策略

### TT-001: 單元測試

**測試對象**：
- `generateCheckMacValue()` - 簽名產生
- `verifyCheckMacValue()` - 簽名驗證
- `generateMerchantTradeNo()` - 交易編號唯一性
- `formatECPayTradeDate()` - 日期格式化

**測試框架**：Jest

**範例**：
```typescript
describe('ECPay Utils', () => {
  it('should generate CheckMacValue correctly', () => {
    const params = { MerchantID: '123', TotalAmount: 1000 };
    const checkMac = generateCheckMacValue(params, 'hashKey', 'hashIV');
    expect(checkMac).toMatch(/^[A-F0-9]{64}$/); // SHA256
  });

  it('should verify CheckMacValue correctly', () => {
    const params = { MerchantID: '123' };
    const checkMac = generateCheckMacValue(params, 'hashKey', 'hashIV');
    const result = verifyCheckMacValue(
      { ...params, CheckMacValue: checkMac },
      'hashKey',
      'hashIV'
    );
    expect(result).toBe(true);
  });

  it('should reject invalid CheckMacValue', () => {
    const params = { MerchantID: '123', CheckMacValue: 'invalid' };
    const result = verifyCheckMacValue(params, 'hashKey', 'hashIV');
    expect(result).toBe(false);
  });
});
```

---

### TT-002: 集成測試

**測試場景**：

1. **信用卡結帳流程**
   ```
   POST /api/checkout (信用卡)
     ✓ 訂單建立
     ✓ 返回 HTML 表單
     ✓ CheckMacValue 正確
   ```

2. **支付回調處理**
   ```
   POST /api/payment/callback (成功)
     ✓ 驗證簽名
     ✓ 訂單狀態更新為 PAID
     ✓ 返回 "1|OK"
   ```

3. **重複通知去重**
   ```
   POST /api/payment/callback (同一筆通知)
     ✓ 檢測已處理
     ✓ 返回成功但不更新狀態
   ```

4. **簽名驗證失敗**
   ```
   POST /api/payment/callback (簽名被篡改)
     ✓ 驗證失敗
     ✓ 返回 "0|"
     ✓ 訂單狀態不變
   ```

---

### TT-003: 端對端測試

**測試環境**：ECPay 測試環境

**測試卡號**：
- 成功：`4311-9522-2222-2222`
- 失敗：其他卡號或過期

**完整流程測試**：
```
1. 選擇商品，填寫結帳資訊
2. 點擊「前往付款」
3. 導轉到綠界測試頁
4. 輸入測試卡號、OTP
5. 付款完成
6. 驗證訂單狀態已更新
7. 檢查日誌和資料庫
```

---

## 導入其他專案的步驟

### 第一步：環境準備

#### 1.1 確認技術棧

```bash
✓ Next.js 13+ (最好是 15+)
✓ TypeScript
✓ Firebase Firestore
✓ Node.js 18+
```

#### 1.2 安裝依賴

```bash
npm install firebase-admin
npm install crypto  # 通常已內建
```

---

### 第二步：複製文件結構

```bash
# 複製以下檔案到你的專案：

lib/
  ├─ ecpay.ts              # 綠界工具函式
  ├─ orders.ts             # 訂單管理函式
  ├─ firebase-admin.ts     # Firebase 初始化

types/
  ├─ ecpay.ts              # ECPay 型別定義
  ├─ order.ts              # Order 型別定義

app/api/
  ├─ checkout/route.ts     # 結帳 API
  ├─ payment/
  │   ├─ callback/route.ts # 支付回調 API
  │   └─ result/route.ts   # 支付結果 API
```

---

### 第三步：配置環境變數

**建立 `.env.local`**：

```bash
# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# ECPay (測試環境)
ECPAY_MERCHANT_ID=2000132
ECPAY_HASH_KEY=5294y06JbISpM5x9
ECPAY_HASH_IV=v77hoKGq4kWxNNIS
ECPAY_CASHIER_URL=https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5
APP_BASE_URL=http://localhost:3000

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@...iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

---

### 第四步：修改文件中的業務邏輯

#### 4.1 自訂商品資訊

在 `createOrder()` 中，根據你的商品結構調整：

```typescript
// lib/orders.ts
const order = {
  item: {
    name: input.item.name,
    price: input.item.price,
    quantity: input.item.quantity,
    variant: input.item.variant  // 根據需要添加
  },
  // ... 其他欄位
};
```

#### 4.2 自訂買家資料驗證

在 `/api/checkout/route.ts` 中，根據你的需求調整：

```typescript
// 驗證必填欄位
if (!body.buyer.phone || !/^\d{10}$/.test(body.buyer.phone)) {
  return NextResponse.json(
    { error: '請輸入正確的手機號碼' },
    { status: 400 }
  );
}
```

#### 4.3 自訂訂單狀態流轉

在 `updateOrderStatus() 中`：

```typescript
// lib/orders.ts
if (newStatus === 'PAID') {
  // 可在這裡觸發自動發貨、Email 通知等
  await notifyCustomer(order.id, 'order_paid');
  await triggerShippingProcess(order.id);
}
```

---

### 第五步：建立前端結帳頁面

**基本結帳表單結構**：

```tsx
// app/checkout/page.tsx
'use client';

import { useState } from 'react';

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item: { name: '商品', price: 1000, quantity: 1 },
          buyer: { name, email, phone, address, city, district, zipCode },
          paymentMethod: 'CREDIT',
          // ... 其他欄位
        }),
      });

      const data = await response.json();

      if (response.status === 200 && data.redirectUrl) {
        // ATM 流程
        window.location.href = data.redirectUrl;
      } else if (response.status === 200) {
        // 信用卡流程 - HTML 表單自動提交
        document.write(await response.text());
      } else {
        alert(data.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 商品資訊 */}
      {/* 買家資訊 */}
      {/* 配送方式 */}
      {/* 付款方式 */}
      <button type="submit" disabled={loading}>
        {loading ? '處理中...' : '前往付款'}
      </button>
    </form>
  );
}
```

---

### 第六步：建立訂單結果頁面

**顯示訂單詳情和支付結果**：

```tsx
// app/order/[id]/result/page.tsx
'use client';

import { useEffect, useState } from 'react';

export default function OrderResultPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 取得訂單詳情
    fetch(`/api/orders/${params.id}`)
      .then(r => r.json())
      .then(data => setOrder(data))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div>載入中...</div>;
  if (!order) return <div>訂單不存在</div>;

  return (
    <div>
      <h1>訂單結果</h1>
      <div className={`status-${order.status}`}>
        {order.status === 'PAID' && '✓ 付款成功'}
        {order.status === 'FAILED' && '✗ 付款失敗'}
        {order.status === 'CREATED' && '⏳ 待匯款'}
      </div>

      {/* 訂單詳情 */}
      <section>
        <h2>訂單資訊</h2>
        <p>訂單編號：{order.id}</p>
        <p>金額：${order.totalAmount}</p>
      </section>

      {/* ATM 匯款資訊 */}
      {order.paymentMethod === 'ATM' && order.status === 'CREATED' && (
        <section>
          <h2>銀行轉帳資訊</h2>
          <p>銀行：台灣銀行</p>
          <p>帳號：1234567890</p>
        </section>
      )}

      {/* 信用卡末四碼 */}
      {order.ecpay?.card4no && (
        <p>刷卡末四碼：****{order.ecpay.card4no}</p>
      )}
    </div>
  );
}
```

---

### 第七步：測試

#### 7.1 測試環境設定

```bash
# 使用測試環境的綠界金鑰和網址
ECPAY_MERCHANT_ID=2000132
ECPAY_HASH_KEY=5294y06JbISpM5x9
ECPAY_HASH_IV=v77hoKGq4kWxNNIS
ECPAY_CASHIER_URL=https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5
```

#### 7.2 本地測試

```bash
# 啟動開發伺服器
npm run dev

# 打開瀏覽器
http://localhost:3000

# 執行測試
npm run test
```

#### 7.3 測試信用卡流程

1. 選擇商品，填寫資訊
2. 選擇信用卡付款
3. 點擊「前往付款」
4. 輸入測試卡號：`4311-9522-2222-2222`
5. 安全碼：`222`
6. OTP：`1234`
7. 驗證訂單狀態更新為 PAID

#### 7.4 測試 ATM 流程

1. 選擇商品，填寫資訊
2. 選擇 ATM 轉帳
3. 點擊「前往付款」
4. 驗證重定向到訂單詳情頁
5. 驗證顯示銀行轉帳資訊

---

### 第八步：上線部署

#### 8.1 切換到正式環境

更新環境變數：

```bash
# 改為正式環境的金鑰
ECPAY_MERCHANT_ID=2000333         # 你的正式特店編號
ECPAY_HASH_KEY=xxxxxx             # 正式 HashKey
ECPAY_HASH_IV=xxxxxx              # 正式 HashIV
ECPAY_CASHIER_URL=https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5
APP_BASE_URL=https://yourdomain.com
```

#### 8.2 部署到 Vercel

```bash
# 推送到 Git
git push origin main

# Vercel 會自動部署
# 在 Vercel 專案設定中新增環境變數
```

#### 8.3 安全檢查清單

- [ ] 更換為正式環境金鑰
- [ ] 驗證 HTTPS 啟用
- [ ] 檢查環境變數已在 Vercel 設定
- [ ] 測試完整支付流程
- [ ] 設定監控和告警
- [ ] 備份資料庫設定

---

## 常見問題

### Q1: CheckMacValue 驗證一直失敗

**原因**：
1. HashKey 或 HashIV 錯誤
2. 參數排序不正確
3. URL Encode 方式不對
4. 包含了額外的空格或特殊字元

**解決**：
```typescript
// 啟用詳細日誌，對比計算結果
console.log('[ECPay] CheckMacValue 原始字串:', rawString);
console.log('[ECPay] URL Encode 後:', encodedString);
console.log('[ECPay] SHA256 結果:', hash);
console.log('[ECPay] 收到的值:', params.CheckMacValue);
```

---

### Q2: 綠界沒有回傳通知（Callback）

**原因**：
1. ReturnURL 不可達（localhost 在測試環境下無法接收）
2. 防火牆或網路問題
3. 伺服器返回非 "1|OK"

**解決**：
```bash
# 使用 ngrok 公開 localhost
ngrok http 3000

# 設定環境變數
APP_BASE_URL=https://xxxx.ngrok.io

# 或直接部署到 Vercel 預覽環境測試
```

---

### Q3: 訂單被重複扣款

**原因**：去重機制未正確實現

**解決**：
```typescript
// 確保 isOrderAlreadyProcessed 邏輯正確
const alreadyProcessed = await isOrderAlreadyProcessed(
  merchantTradeNo,
  rtnCode
);

if (alreadyProcessed) {
  console.log('[Payment Callback] 已處理過，跳過');
  return '1|OK';  // 必須回傳成功
}
```

---

### Q4: 如何支援 ATM 以外的其他付款方式

**步驟**：
1. 修改 `ChoosePayment` 參數
   ```typescript
   // 改為支援多種
   ChoosePayment: 'ALL'  // 用戶選擇
   ```

2. 處理不同的付款類型
   ```typescript
   const { PaymentType } = ecpayData;
   // CREDIT, ATM, WEBATM, CVS, BARCODE, APPLEPAY, GOOGLEPAY, LINEPAY
   ```

---

### Q5: 如何自動核帳 ATM 訂單

**整合銀行 API**：
1. 透過銀行 API 查詢轉帳記錄
2. 與 `merchantTradeNo` 和金額對帳
3. 自動更新訂單狀態為 PAID

**簡單方案**：
```typescript
// 定期檢查待付款訂單
const overdueOrders = await db.collection('orders')
  .where('status', '==', 'CREATED')
  .where('paymentMethod', '==', 'ATM')
  .where('createdAt', '<', Date.now() - 7 * 24 * 60 * 60 * 1000)
  .get();

// 標記為過期
for (const doc of overdueOrders.docs) {
  await doc.ref.update({ status: 'CANCELED' });
}
```

---

### Q6: 如何處理部分金額轉帳

**場景**：顧客轉帳金額不足

**解決**：
1. 金額驗證
   ```typescript
   if (receivedAmount < orderAmount) {
     status = 'PARTIAL_PAID';
   }
   ```

2. 通知顧客補款
3. 設定補款期限

---

## 參考資料

### 官方文件

- [綠界科技 ECPay AIO 文件](https://developers.ecpay.com.tw/)
  - 信用卡一次付清串接規格書（AIO）  
  - 常見錯誤碼與 `CheckMacValue` 問題排查：請參閱前述技術文件與 PRD。
- [ECPay 測試環境說明](https://developers.ecpay.com.tw/docs/ecpay-payment-integration-overview)
- [CheckMacValue 驗證演算法](https://developers.ecpay.com.tw/docs/ecpay-logistics-standard)

### 技術文件

- [Next.js 15 API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Firebase Firestore](https://firebase.google.com/docs/firestore)
- [Node.js Crypto Module](https://nodejs.org/api/crypto.html)

### 相關實作

- 本專案 GitHub：[你的 repo 連結]
- 示例程式碼：見本文件 [核心模組實作](#核心模組實作) 章節

---

## 版本歷史

| 版本 | 日期 | 更新內容 |
| --- | --- | --- |
| v1.0 | 2025-11-11 | 初始版本，涵蓋信用卡和 ATM 支付流程 |

---

## 文件維護

**維護者**：平台開發團隊
**最後更新**：2025-11-11
**下次審核**：2025-12-11

如有任何問題或建議，請提交 Issue 或 PR。

---

**免責聲明**：本文檔為技術參考，實際部署時應根據你的業務需求調整。所有支付相關操作應符合當地法規和 PCI DSS 標準。
