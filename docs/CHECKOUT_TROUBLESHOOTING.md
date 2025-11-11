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

## CheckMacValue 簽章驗證詳細指南

### 症狀
- 支付完成後被重定向到 `/?payment=invalid`
- 伺服器日誌中看到 `[Payment Result] CheckMacValue 驗證失敗`
- API 返回 "CheckMacValue verification failed"

### 簽章驗證的工作原理

ECPay 使用 SHA256 簽章來確保訂單的完整性和安全性。簽章驗證分為三個階段：

1. **Checkout 階段**（我們發送訂單到 ECPay）
   - 我們根據訂單參數生成 CheckMacValue
   - 將此值發送給 ECPay
   - ECPay 驗證簽章正確性

2. **支付階段**（用戶在 ECPay 頁面支付）
   - ECPay 處理支付
   - 生成支付結果

3. **回調階段**（ECPay 返回結果）
   - ECPay 使用相同的 HashKey/HashIV 生成新的簽章
   - 我們接收參數並使用相同的算法重新計算簽章
   - 對比雙方的簽章值

### 詳細調試步驟

**步驟 1：驗證環境變數和簽章過濾規則**

最常見的原因是：
1. **HashKey 或 HashIV 不正確** ⚠️
2. **簽章計算時未過濾空字符串** ⚠️

確保 `.env.local` 中的值：
- 完全相同（區分大小寫）
- 無前後空格
- 使用測試環境的值

**關鍵點**：ECPay 返回的參數中包含許多空字符串（未使用的付款方式字段）。簽章驗證時必須過濾掉這些空字符串。本項目已修復此問題，確保在簽章計算時過濾以下內容：
- `CheckMacValue` 欄位
- `undefined` 值
- **空字符串 (`""`)**

```bash
# .env.local 中必須完全如下
ECPAY_HASH_KEY=5294y06JbISpM5x9
ECPAY_HASH_IV=v77hoKGq4kWxNNIS
```

驗證：
```bash
grep "ECPAY_HASH" .env.local
```

**步驟 2：檢查完整的簽章日誌**

伺服器會輸出詳細的簽章驗證過程。查找日誌：

```
[Checkout] 簽章詳情: {
  merchantTradeNo: '20251111094114UHZXGY',
  checkMacValue: '3F9B0A9C4FB36CAA...',  // ← 我們生成的簽章
  paramKeys: ['ChoosePayment', 'ClientBackURL', ...]
}

[Payment Result] 簽章驗證詳情: {
  merchantTradeNo: '20251111094114UHZXGY',
  receivedCheckMacValue: '3F9B0A9C4FB36CAA...',  // ← ECPay 發送的簽章
  calculatedCheckMacValue: '3F9B0A9C4FB36CAA...',  // ← 我們重新計算的簽章
  match: true,  // ✓ 匹配成功
  paramKeys: [...]
}

[Payment Result] 接收到的完整參數: {
  "MerchantID": "2000132",
  "MerchantTradeNo": "20251111094114UHZXGY",
  "RtnCode": "1",
  ...
}
```

**三種可能的不匹配情況**：

1. **`receivedCheckMacValue !== calculatedCheckMacValue`**
   - ECPay 發送的簽章與我們計算的不符
   - 可能原因：
     - 接收到的參數與預期不同
     - 參數解析出錯
     - 參數順序問題

   **調試**：
   - 檢查 `接收到的完整參數` 中是否有預期外的字段
   - 檢查參數值是否被正確轉換為字符串
   - 確認沒有額外的空白字符

2. **`match: false`（即使 ECPay 發送的簽章正確）**
   - 我們的簽章算法生成了不同的值
   - 可能原因：
     - HashKey/HashIV 不正確 ⚠️ 最常見
     - URL 編碼規則不同
     - 字符編碼不是 UTF-8

   **調試**：
   - 重新檢查 `.env.local` 中的 HashKey/HashIV
   - 確保環境變數已保存並伺服器已重啟
   - 檢查是否有隱藏的空格或特殊字符

3. **簽章值看起來很短或格式不對**
   - 簽章應該是 64 個字符的十六進制字符串（SHA256）
   - 如果格式不對，表示簽章生成失敗

**步驟 3：手動測試簽章算法**

建立文件 `/tmp/test-ecpay.js`：

```javascript
const crypto = require('crypto');

function urlEncodeForECPay(str) {
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

function generateCheckMacValue(params, hashKey, hashIV) {
  const filtered = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && key !== 'CheckMacValue') {
      filtered[key] = value;
    }
  });

  const sortedKeys = Object.keys(filtered).sort();
  const paramString = sortedKeys
    .map(key => `${key}=${filtered[key]}`)
    .join('&');

  const rawString = `HashKey=${hashKey}&${paramString}&HashIV=${hashIV}`;
  console.log('Raw string:', rawString);

  const encodedString = urlEncodeForECPay(rawString);
  console.log('Encoded:', encodedString);

  const lowerCaseString = encodedString.toLowerCase();
  const hash = crypto
    .createHash('sha256')
    .update(lowerCaseString, 'utf8')
    .digest('hex')
    .toUpperCase();

  return hash;
}

// 使用日誌中的完整參數測試
const params = {
  MerchantID: '2000132',
  MerchantTradeNo: '20251111094114UHZXGY',
  // 從日誌的 "接收到的完整參數" 複製所有字段
  // ...
};

const result = generateCheckMacValue(
  params,
  '5294y06JbISpM5x9',  // HashKey
  'v77hoKGq4kWxNNIS'   // HashIV
);

console.log('Generated:', result);
console.log('Expected:', '3F9B0A9C4FB36CAA...'); // 從日誌中複製
console.log('Match:', result === '3F9B0A9C4FB36CAA...');
```

執行：
```bash
node /tmp/test-ecpay.js
```

**步驟 4：對比簽章生成步驟**

正確的簽章生成流程：

1. **過濾參數**
   - 移除 `CheckMacValue` 字段
   - 移除 `undefined` 值

2. **排序參數**
   - 按鍵名字母順序排序（區分大小寫）
   - A-Z 在 a-z 之前

3. **組合字符串**
   ```
   HashKey=<hashKey>&key1=value1&key2=value2&HashIV=<hashIV>
   ```

4. **URL 編碼**（ECPay 專用規則）
   - 使用標準 URL 編碼
   - 然後恢復特殊字符：`=`, `&`, `/`, `:` 等

5. **轉小寫**

6. **SHA256 加密**

7. **轉大寫**

**步驟 5：重啟伺服器**

確認所有變更後，重啟開發伺服器：

```bash
# 終止當前伺服器 (Ctrl+C)
npm run dev
```

新的伺服器會讀取更新的 `.env.local` 文件。

### 驗證清單

在認為簽章問題已解決前，確保：

- [ ] `.env.local` 中的 ECPAY_HASH_KEY 完全正確
- [ ] `.env.local` 中的 ECPAY_HASH_IV 完全正確
- [ ] 無前後空格或換行符
- [ ] 使用的是**測試環境**的值（不是正式環境）
- [ ] 開發伺服器已重啟
- [ ] 瀏覽器快取已清除（F12 → Application → Storage → Clear all）
- [ ] 伺服器日誌中的 `match: true`
- [ ] 成功重定向到訂單確認頁面

---

## 聯絡支持

如果問題仍未解決：

1. 收集完整的伺服器日誌（包含簽章驗證詳情）
2. 驗證 `.env.local` 中的 HashKey/HashIV（不要提交給他人）
3. 檢查 [ECPay 開發者文檔](https://developers.ecpay.com.tw/)
4. 查閱 [Firebase 故障排除指南](https://firebase.google.com/docs/troubleshooting)
5. 提交 issue 附加調試資訊（隱藏敏感信息）

