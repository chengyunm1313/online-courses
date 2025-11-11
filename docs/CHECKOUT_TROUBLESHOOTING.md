# ECPay 結帳故障排除指南

## 常見錯誤與解決方案

### 1. "Cannot use \"undefined\" as a Firestore value" 錯誤

#### 症狀
結帳時顯示錯誤：`建立訂單失敗: Value for argument "data" is not a valid Firestore document. Cannot use "undefined" as a Firestore value (found in field "notes")`

#### 原因分析
Firestore 不允許文檔欄位值為 `undefined`。當訂單備註（notes）為空時，該欄位被設置為 `undefined`，導致驗證失敗。

#### 快速修復 ✅

此錯誤已在版本 0.1.7 中修復。只需更新代碼：

```bash
git pull origin main
npm install
npm run build
```

**修復內容**：
- 只有當 `notes` 有實際值時才將其添加到訂單文檔
- 其他可選欄位也遵循相同模式

---

### 2. "建立訂單失敗" (Failed to Create Order) - 一般錯誤

#### 症狀
當點擊結帳按鈕時，顯示 "建立訂單失敗" 錯誤訊息（不包含具體的 Firestore 錯誤）。

#### 原因分析
此錯誤通常源自 `/api/checkout/ecpay` 路由的 catch 區塊。最常見的原因是：

1. **缺少 ECPay 環境變數** ⚠️ 最常見
2. Firebase 連接問題
3. 用戶未登入
4. Firestore 權限不足

#### 快速修復 ✅

**步驟 1：驗證環境變數**

編輯 `.env.local` 檔案，確保包含以下變數：

```bash
# ECPay Payment Gateway (Test Environment)
ECPAY_MERCHANT_ID=2000132
ECPAY_HASH_KEY=5294y06JbISpM5x9
ECPAY_HASH_IV=v77hoKGq4kWxNNIS
ECPAY_CASHIER_URL=https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5
APP_BASE_URL=http://localhost:3000
```

**步驟 2：重啟開發伺服器**

```bash
# 停止當前伺服器 (Ctrl+C)
# 重新啟動
npm run dev
```

**步驟 3：清除瀏覽器快取**

1. 開啟開發者工具 (F12)
2. 進入 Application → Storage
3. 清除所有 Cookies 和 LocalStorage
4. 重新整理頁面

#### 驗證環境變數是否正確讀取

執行以下命令檢查：

```bash
grep "ECPAY_" .env.local
```

應該顯示：
```
ECPAY_MERCHANT_ID=2000132
ECPAY_HASH_KEY=5294y06JbISpM5x9
ECPAY_HASH_IV=v77hoKGq4kWxNNIS
ECPAY_CASHIER_URL=https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5
```

---

### 3. 結帳按鈕不顯示

#### 症狀
在購物車頁面上看不到結帳按鈕。

#### 可能原因
- 用戶未登入
- 購物車為空
- 課程資訊未正確載入

#### 解決方案
1. 確保已登入（檢查頁面頂部）
2. 確認課程已被添加到購物車
3. 檢查瀏覽器主控台是否有 JavaScript 錯誤

---

### 4. 重定向到綠界支付頁面失敗

#### 症狀
選擇信用卡支付後，頁面沒有重定向到綠界支付頁面。

#### 可能原因
- 訂單建立失敗
- HTML 表單生成錯誤
- 伺服器日誌中有錯誤

#### 解決方案

**檢查伺服器日誌：**

```bash
# 開啟新終端，監看伺服器日誌
npm run dev

# 查找 [Checkout] 開頭的日誌
```

應該看到類似：
```
[Checkout] 訂單已建立: {
  orderId: '...',
  merchantTradeNo: '...',
  total: 2990,
  paymentMethod: 'CREDIT'
}
```

如果沒有此日誌，表示在建立訂單時失敗。

---

### 5. 購物車資料丟失

#### 症狀
導航到結帳頁面時，購物車資料顯示為空。

#### 原因分析
- SessionStorage 被清除
- 瀏覽器隱私模式問題
- 購物車資料格式不正確

#### 解決方案

**檢查 SessionStorage：**

1. 開啟開發者工具 (F12)
2. 進入 Application → Session Storage
3. 查找 `checkoutCart` 鑰
4. 確保其包含有效的 JSON 資料

**手動測試：**

在瀏覽器主控台執行：

```javascript
// 檢查購物車資料
console.log(JSON.parse(sessionStorage.getItem('checkoutCart')))

// 手動設置測試資料
sessionStorage.setItem('checkoutCart', JSON.stringify({
  items: [{
    courseId: '1',
    courseTitle: 'React 完整開發指南',
    courseThumbnail: 'https://images.unsplash.com/...',
    price: 2990,
    instructor: '講師名稱'
  }],
  paymentMethod: 'CREDIT',
  shippingMethod: 'HOME',
  subtotal: 2990,
  tax: 0,
  total: 2990
}))

// 導航到結帳頁面
window.location.href = '/checkout/ecpay'
```

---

### 6. Firebase 權限或連接錯誤

#### 症狀
結帳失敗，並在伺服器日誌中看到 Firebase 相關錯誤。

#### 可能原因
- Firebase 憑證無效或過期
- Firestore 集合不存在
- 安全規則限制訪問

#### 解決方案

**驗證 Firebase 連接：**

```bash
# 檢查 Firebase 環境變數
grep "FIREBASE_" .env.local
```

應該看到 `FIREBASE_PROJECT_ID`、`FIREBASE_CLIENT_EMAIL` 和 `FIREBASE_PRIVATE_KEY`。

**檢查 Firestore 集合：**

1. 進入 [Firebase Console](https://console.firebase.google.com/)
2. 選擇你的項目
3. 進入 Firestore Database
4. 確保存在 `orders` 集合
5. 確保存在 `order_events` 集合（用於去重）

---

## 詳細調試步驟

### 啟用詳細日誌

編輯 `.env.local` 添加：

```bash
# 為開發環境啟用詳細日誌
NODE_ENV=development
```

重啟伺服器後，API 錯誤將包含詳細的 `detailedError` 欄位。

### 查看網路請求

1. 開啟開發者工具 (F12)
2. 進入 Network 標籤
3. 執行結帳操作
4. 尋找對 `/api/checkout/ecpay` 的請求
5. 檢查 Response 欄位中的完整錯誤訊息

### 檢查伺服器日誌

完整日誌應該包含：

```
[Checkout] 訂單已建立: { ... }
[Checkout] HTML 表單已產生: { ... }
```

如果看到 `[Checkout Error]`，查看後面的錯誤訊息。

---

## 完整測試清單

進行完整的結帳流程測試：

- [ ] 已登入並有效的用戶會話
- [ ] 購物車中有課程
- [ ] .env.local 包含所有 ECPay 環境變數
- [ ] 開發伺服器已重啟
- [ ] 瀏覽器快取已清除
- [ ] 點擊結帳按鈕時無 JavaScript 錯誤
- [ ] API 返回成功狀態 (200)
- [ ] 信用卡支付時重定向到綠界頁面
- [ ] ATM 支付時顯示銀行轉帳資訊
- [ ] Firebase 中創建了訂單記錄

---

## 聯絡支持

如果問題仍未解決：

1. 收集完整的錯誤訊息和伺服器日誌
2. 檢查 [ECPay 開發者文檔](https://developers.ecpay.com.tw/)
3. 查閱 [Firebase 故障排除指南](https://firebase.google.com/docs/troubleshooting)
4. 提交 issue 附加調試資訊

