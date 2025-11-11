# 綠界 ECPay 金流整合實施指南

本文檔說明如何在 Online Courses 平台中整合綠界 ECPay 支付功能。

## 實施摘要

已實現以下功能：

### ✅ 核心功能
- [x] ECPay 簽名生成和驗證（CheckMacValue）
- [x] 信用卡支付流程
- [x] ATM 轉帳支付流程
- [x] 支付回調通知處理（伺服器端）
- [x] 支付結果前端導回處理
- [x] 訂單去重機制（防止重複扣款）
- [x] 訂單狀態追蹤

### 📂 新增檔案

#### 核心邏輯
```
lib/
  └─ ecpay.ts                           # ECPay 工具函式：簽名、驗證、表單生成
types/
  └─ ecpay.ts                           # ECPay 類型定義
```

#### API 路由
```
app/api/
  ├─ checkout/ecpay/route.ts            # 結帳 API（建立訂單、產生支付表單）
  ├─ payment/callback/route.ts          # 支付回調 API（綠界伺服器通知）
  ├─ payment/result/route.ts            # 支付結果 API（使用者瀏覽器導回）
  └─ orders/[id]/route.ts               # 取得訂單詳情 API
```

#### 前端頁面
```
app/
  ├─ checkout/ecpay/page.tsx            # 結帳頁面（選擇付款方式）
  └─ order/[id]/result/page.tsx         # 訂單結果頁面（顯示支付結果）
```

#### 文檔
```
docs/
  ├─ env-ecpay-example.md               # 環境變數配置說明
  └─ ECPAY_IMPLEMENTATION.md            # 本文檔
```

### 📝 更新檔案
- `types/order.ts` - 新增 ECPay 相關欄位

## 快速開始

### 1. 環境變數配置

在 `.env.local` 中新增以下變數（測試環境）：

```bash
# ECPay 設定
ECPAY_MERCHANT_ID=2000132
ECPAY_HASH_KEY=5294y06JbISpM5x9
ECPAY_HASH_IV=v77hoKGq4kWxNNIS
ECPAY_CASHIER_URL=https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5
APP_BASE_URL=http://localhost:3000
```

詳見 [docs/env-ecpay-example.md](./env-ecpay-example.md)

### 2. 啟動開發伺服器

```bash
npm run dev
```

### 3. 測試完整流程

1. **登入**：使用 Google OAuth 登入
2. **選擇課程**：進入課程頁面選擇課程
3. **結帳**：點擊「購買」進入結帳頁面
4. **選擇付款方式**：
   - **信用卡**：選擇信用卡付款
   - **ATM**：選擇 ATM 轉帳
5. **付款**：
   - **信用卡**：使用測試卡號 `4311-9522-2222-2222` 完成支付
   - **ATM**：查看銀行轉帳資訊
6. **驗證**：確認訂單狀態已更新為 PAID 或 CREATED

## 流程說明

### 信用卡支付流程

```
┌─────────────────────────────────────────┐
│ 1. 用戶進入結帳頁面 (/checkout/ecpay)   │
│    ├─ 選擇商品和付款方式                 │
│    └─ 提交結帳表單                      │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│ 2. POST /api/checkout/ecpay             │
│    ├─ 驗證用戶登入                       │
│    ├─ 建立訂單（狀態：CREATED）         │
│    ├─ 生成 CheckMacValue                │
│    └─ 返回 HTML 表單                    │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│ 3. HTML 表單自動提交                    │
│    └─ 導向綠界支付頁面                   │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│ 4. 用戶輸入信用卡資訊並付款              │
│    └─ 綠界處理支付                      │
└──────────────────┬──────────────────────┘
                   ↓
        ┌──────────┴──────────┐
        ↓                     ↓
┌──────────────────┐  ┌──────────────────┐
│ 5a. 伺服器通知   │  │ 5b. 前端導回     │
│ POST /api/       │  │ POST /api/       │
│ payment/callback │  │ payment/result   │
│ （綠界伺服器）   │  │ （用戶瀏覽器）   │
└────────┬─────────┘  └────────┬─────────┘
         ↓                     ↓
  ┌──────────────┐      ┌──────────────┐
  │ 驗證簽名     │      │ 驗證簽名     │
  │ 更新訂單     │      │ 更新訂單     │
  │ 回傳 1|OK    │      │ 重定向到結果 │
  └──────┬───────┘      └──────┬───────┘
         │                     │
         └──────────┬──────────┘
                    ↓
        ┌─────────────────────────┐
        │ 訂單狀態更新為 PAID      │
        │ Firestore 記錄 ecpayData│
        └─────────────────────────┘
                    ↓
        ┌─────────────────────────┐
        │ 6. 用戶看到成功頁面     │
        │ /order/[id]/result      │
        └─────────────────────────┘
```

### ATM 轉帳流程

```
┌─────────────────────────────────────────┐
│ 1. 用戶進入結帳頁面 (/checkout/ecpay)   │
│    ├─ 選擇商品和付款方式（ATM）         │
│    └─ 提交結帳表單                      │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│ 2. POST /api/checkout/ecpay             │
│    ├─ 驗證用戶登入                       │
│    ├─ 建立訂單（狀態：CREATED）         │
│    └─ 返回重定向 URL                    │
└──────────────────┬──────────────────────┘
                   ↓
        ┌─────────────────────────┐
        │ 3. 重定向到結果頁面     │
        │ /order/[id]/result      │
        │ ?payment=atm            │
        └────────────┬────────────┘
                     ↓
        ┌─────────────────────────┐
        │ 4. 顯示銀行轉帳資訊     │
        │ ├─ 銀行名稱             │
        │ ├─ 帳號                │
        │ └─ 轉帳金額             │
        └─────────────────────────┘
                     ↓
        ┌─────────────────────────┐
        │ 5. 用戶進行銀行轉帳     │
        │ （線下操作）             │
        └────────────┬────────────┘
                     ↓
        ┌─────────────────────────┐
        │ 6. 管理員核帳後更新狀態│
        │ 狀態改為 PAID           │
        └─────────────────────────┘
```

## API 端點文檔

### POST /api/checkout/ecpay

**請求**：
```json
{
  "items": [
    {
      "courseId": "1",
      "courseTitle": "React 完整開發指南",
      "courseThumbnail": "https://...",
      "price": 2999,
      "instructor": "王小明"
    }
  ],
  "paymentMethod": "CREDIT",
  "shippingMethod": "HOME",
  "subtotal": 2999,
  "tax": 0,
  "total": 2999,
  "notes": "請於下午送達"
}
```

**回應**（信用卡）：
```html
<!DOCTYPE html>
<html>
  <form id="ecpayForm" method="POST" action="https://payment-stage.ecpay.com.tw/...">
    <input type="hidden" name="MerchantID" value="2000132" />
    <!-- ... 其他隱藏欄位 -->
  </form>
  <script>
    document.getElementById('ecpayForm').submit();
  </script>
</html>
```

**回應**（ATM）：
```json
{
  "orderId": "xxx",
  "merchantTradeNo": "20251111123456ABC",
  "redirectUrl": "/order/xxx/result?payment=atm"
}
```

### POST /api/payment/callback

**來源**：綠界伺服器

**請求**（FormData）：
```
MerchantTradeNo=20251111123456ABC
RtnCode=1
RtnMsg=Success
TradeNo=2411111234567890
TradeAmt=2999
PaymentDate=2025/11/11 12:34:56
card4no=1111
CheckMacValue=XXXXXXXXXXXXX
```

**回應**：
```
1|OK
```

### POST /api/payment/result

**來源**：使用者瀏覽器

**請求**（FormData）：同上

**回應**：
```
HTTP 302 → /order/[orderId]/result
```

### GET /api/orders/[id]

**請求**：
```
GET /api/orders/xxxxx
```

**回應**：
```json
{
  "id": "xxxxx",
  "userId": "user-id",
  "status": "PAID",
  "total": 2999,
  "items": [...],
  "merchantTradeNo": "20251111123456ABC",
  "ecpayData": {
    "RtnCode": 1,
    "TradeNo": "2411111234567890",
    "card4no": "1111",
    ...
  },
  "paidAt": "2025-11-11T12:34:56.000Z",
  "createdAt": "2025-11-11T12:30:00.000Z"
}
```

## 資料結構

### Order 文件（Firestore）

```typescript
{
  id: string;                           // 文件 ID
  userId: string;                       // 用戶 ID
  userName: string;                     // 用戶名
  userEmail: string;                    // 用戶信箱
  status: 'CREATED' | 'PAID' | 'FAILED' | 'CANCELED';
  paymentMethod: 'CREDIT' | 'ATM';
  shippingMethod: 'HOME' | 'STORE';
  items: OrderItem[];                   // 商品列表
  subtotal: number;                     // 小計
  tax: number;                          // 稅額
  total: number;                        // 合計
  merchantTradeNo: string;              // 綠界交易編號
  ecpayData?: {                         // 綠界回傳資料
    RtnCode: number;
    RtnMsg: string;
    TradeNo: string;
    TradeAmt: number;
    PaymentDate: string;
    PaymentType: string;
    card4no?: string;
    // ...
  };
  paidAt?: Date;                        // 付款時間
  failedAt?: Date;                      // 失敗時間
  notes?: string;                       // 訂單備註
  createdAt: Date;                      // 建立時間
  updatedAt: Date;                      // 更新時間
}
```

### OrderEvent 文件（Firestore）

```typescript
{
  id: string;
  orderId: string;
  type: 'PAYMENT_CALLBACK' | 'PAYMENT_RESULT';
  payload: {
    merchantTradeNo: string;
    rtnCode?: number;
    rtnMsg?: string;
    tradeNo?: string;
    // ...
  };
  createdAt: Date;
}
```

## 安全性考量

### CheckMacValue 驗證

所有接收綠界資料的端點都會驗證 CheckMacValue：

```typescript
const isValid = verifyCheckMacValue(params, config.hashKey, config.hashIV);
if (!isValid) {
  return '0|Invalid signature';
}
```

**原理**：
- HashKey 和 HashIV 僅存儲在伺服器環境變數中
- 前端無法得知這些金鑰
- 因此前端無法偽造有效的簽名

### 去重機制（防止重複扣款）

```typescript
const eventSnapshot = await adminDb
  .collection('order_events')
  .where('orderId', '==', orderId)
  .where('type', '==', 'PAYMENT_CALLBACK')
  .where('payload.rtnCode', '==', rtnCode)
  .limit(1)
  .get();

if (!eventSnapshot.empty) {
  // 已處理過：回傳成功，但不更新狀態
  return '1|OK';
}
```

### 環境變數保護

- 所有敏感資訊存儲在環境變數
- `.env.local` 被加入 `.gitignore`，不提交到 Git
- 伺服器端讀取環境變數，不暴露給前端

## 測試清單

### 本地測試

- [ ] 配置環境變數（.env.local）
- [ ] 啟動開發伺服器（npm run dev）
- [ ] 使用 Google OAuth 登入
- [ ] 選擇課程進入結帳
- [ ] 選擇信用卡付款
- [ ] 使用測試卡號 `4311-9522-2222-2222` 完成支付
- [ ] 驗證訂單狀態更新為 PAID
- [ ] 驗證訂單結果頁面顯示正確
- [ ] 重複測試確認去重機制有效

### ngrok 本地公開測試

```bash
# 安裝並啟動 ngrok
ngrok http 3000

# 在 .env.local 中更新
APP_BASE_URL=https://xxxx.ngrok.io

# 重啟開發伺服器並測試完整流程
```

### 正式環境上線

1. **更新環境變數**：切換為正式環境的金鑰
2. **驗證 HTTPS**：確保所有通訊使用 HTTPS
3. **部署到 Vercel**：上傳環境變數並部署
4. **測試完整流程**：在正式環境驗證所有功能
5. **監控日誌**：設置日誌監控和告警

## 常見問題

### Q1：CheckMacValue 驗證失敗

**症狀**：API 返回 "0|CheckMacValue verification failed"

**解決**：
1. 確認 `.env.local` 中的 HashKey 和 HashIV 正確
2. 確認環境變數已正確讀取（可在伺服器端日誌中驗證）
3. 重啟開發伺服器

### Q2：綠界沒有回傳通知

**症狀**：訂單狀態保持為 CREATED，未更新為 PAID

**原因**：本地環境無法接收綠界通知（localhost 不可公開訪問）

**解決**：
1. 使用 ngrok 公開本地伺服器
2. 或直接部署到 Vercel 預覽環境測試

### Q3：訂單被建立多次

**症狀**：結帳時產生多個訂單

**解決**：
- 前端應禁用結帳按鈕，直到支付完成
- 使用 `disabled` 狀態和載入指示器

### Q4：如何查看訂單詳情

**API**：
```bash
GET /api/orders/{orderId}
Authorization: Bearer {session-token}
```

**Firestore**：
1. 進入 Firebase Console
2. 導航到 Firestore Database
3. 查看 `orders` Collection

## 參考資源

- [綠界 ECPay 官方文檔](https://developers.ecpay.com.tw/)
- [ECPay AIO 一次付清規格](https://developers.ecpay.com.tw/?p=2856)
- [測試環境說明](https://developers.ecpay.com.tw/docs/ecpay-payment-integration-overview)

## 後續優化

### 可選功能

1. **電子發票**：整合綠界電子發票服務
2. **多幣別支持**：支援多種貨幣
3. **定期付款**：支援訂閱式課程
4. **退款流程**：實現退款和部分退款
5. **付款分期**：支援信用卡分期

### 性能優化

1. **請求快取**：快取訂單資料減少資料庫查詢
2. **非同步處理**：使用隊列處理支付通知
3. **監控告警**：設置支付失敗告警

---

**最後更新**：2025-11-11
**版本**：1.0
