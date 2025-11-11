# ECPay CheckMacValue 簽章驗證調試指南

## 概述

本文檔提供完整的 ECPay 簽章驗證調試方法。簽章驗證是支付流程中最關鍵的安全機制，確保訂單和支付結果的真實性。

## 快速問題診斷

| 症狀 | 最可能的原因 | 解決方案 |
|------|-----------|--------|
| 重定向到 `/?payment=invalid` | HashKey/HashIV 不正確 | 驗證 `.env.local` 中的值 |
| 伺服器日誌中 `match: false` | 簽章算法不符 | 檢查 URL 編碼規則 |
| `receivedCheckMacValue !== calculatedCheckMacValue` | 接收到的參數不同 | 檢查完整參數日誌 |
| 簽章值格式很奇怪 | 簽章生成失敗 | 檢查有無異常和日誌 |

## 詳細調試流程

### 第一步：重新檢查環境變數

**最常見的原因**是 `.env.local` 中的 HashKey 或 HashIV 有誤。

```bash
# 檢查環境變數
cat .env.local | grep "ECPAY_HASH"
```

應該看到：
```bash
ECPAY_HASH_KEY=5294y06JbISpM5x9
ECPAY_HASH_IV=v77hoKGq4kWxNNIS
```

**常見錯誤**：
- ❌ `ECPAY_HASH_KEY=5294y06JbISpM5x9 ` （末尾有空格）
- ❌ `ECPAY_HASH_KEY = 5294y06JbISpM5x9` （周圍有空格）
- ❌ `ECPAY_HASH_KEY=5294y06jbispm5x9` （小寫，應該區分大小寫）
- ❌ 使用正式環境的金鑰而非測試環境

### 第二步：檢查完整的伺服器日誌和參數

**重要發現**：ECPay 返回的參數可能包含許多空字符串（如未使用的付款方式字段）。在計算簽章時，**必須過濾掉空字符串**。

ECPay 在簽章計算時會過濾掉：
- `CheckMacValue` 欄位本身
- `undefined` 值
- **空字符串 (`""`)** ← 這很重要！

提升日誌輸出級別，重新運行完整的支付流程：

```bash
# 1. 啟動伺服器
npm run dev

# 2. 完成支付流程

# 3. 查看伺服器日誌，尋找以下日誌

# Checkout 時：
[Checkout] 簽章詳情: {
  merchantTradeNo: '<trade-no>',
  checkMacValue: '<generated-signature>',
  paramKeys: [...]
}

# 支付結果時：
[Payment Result] 簽章驗證詳情: {
  merchantTradeNo: '<trade-no>',
  receivedCheckMacValue: '<from-ecpay>',
  calculatedCheckMacValue: '<calculated-by-us>',
  match: <true or false>,
  paramKeys: [...]
}

[Payment Result] 接收到的完整參數: {
  "MerchantID": "...",
  "MerchantTradeNo": "...",
  ...
}

[Payment Result] CheckMacValue 驗證詳情: {
  received: '<from-ecpay>',
  calculated: '<calculated-by-us>',
  match: <true or false>
}
```

**關鍵指標**：
- `match: true` → 簽章驗證成功
- `match: false` → 簽章不匹配，需要調試

### 第三步：對比簽章值

如果 `match: false`，對比三個簽章值：

1. **Checkout 時生成的簽章** (`[Checkout] checkMacValue`)
   - 這是我們根據訂單參數生成的簽章

2. **ECPay 返回的簽章** (`[Payment Result] receivedCheckMacValue`)
   - 這是 ECPay 伺服器發送的簽章

3. **我們重新計算的簽章** (`[Payment Result] calculatedCheckMacValue`)
   - 基於接收到的參數重新計算

**分析**：

如果 `receivedCheckMacValue === checkMacValue`，說明 ECPay 接收到的訂單是正確的。

如果 `calculatedCheckMacValue === receivedCheckMacValue`，說明我們的簽章驗證邏輯是正確的。

如果都不相等，逐一檢查：
- HashKey/HashIV 是否正確
- 參數是否被正確解析
- URL 編碼規則是否符合

### 第四步：手動測試簽章算法

從日誌中複製完整的參數，建立測試腳本：

```javascript
// /tmp/debug-signature.js
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
  // 1. 過濾參數
  const filtered = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && key !== 'CheckMacValue') {
      filtered[key] = value;
    }
  });

  // 2. 排序參數
  const sortedKeys = Object.keys(filtered).sort();
  console.log('Sorted keys:', sortedKeys);

  // 3. 組合字符串
  const paramString = sortedKeys
    .map(key => `${key}=${filtered[key]}`)
    .join('&');

  // 4. 加上 HashKey 和 HashIV
  const rawString = `HashKey=${hashKey}&${paramString}&HashIV=${hashIV}`;
  console.log('\nRaw string:');
  console.log(rawString);

  // 5. URL Encode
  const encodedString = urlEncodeForECPay(rawString);
  console.log('\nEncoded string (first 200 chars):');
  console.log(encodedString.substring(0, 200) + '...');

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

// 從日誌中複製參數
const params = {
  MerchantID: '2000132',
  MerchantTradeNo: '20251111094114UHZXGY',
  // ... 複製所有來自 "[Payment Result] 接收到的完整參數" 的字段
};

const generated = generateCheckMacValue(
  params,
  '5294y06JbISpM5x9',
  'v77hoKGq4kWxNNIS'
);

console.log('\n=== 結果 ===');
console.log('Generated:  ', generated);
console.log('Expected:   ', '3F9B0A9C...'); // 從日誌中複製
console.log('Match:      ', generated === '3F9B0A9C...');
```

執行：
```bash
node /tmp/debug-signature.js
```

### 第五步：逐步驗證簽章生成步驟

確保每一步都正確：

**Step 1: 參數過濾**
```
原始參數: { CheckMacValue: 'xxx', Param1: 'value1', ... }
過濾後: { Param1: 'value1', ... }  // 移除 CheckMacValue
```

**Step 2: 參數排序**
```
未排序: { Param2: 'value2', Param1: 'value1' }
排序後: { Param1: 'value1', Param2: 'value2' }
```

**Step 3: 字符串組合**
```
組合: HashKey=<key>&Param1=value1&Param2=value2&HashIV=<iv>
```

**Step 4: URL 編碼**
```
原始: HashKey=abc&Param1=value1
編碼: HashKey%3Dabc%26Param1%3Dvalue1
恢復: HashKey=abc&Param1=value1  // 某些字符需要恢復
```

**Step 5-7: 加密和轉大寫**
```
SHA256(rawString)  → 小寫 64 字符十六進制
轉大寫              → 大寫 64 字符十六進制
```

### 第六步：重啟開發伺服器

確認所有配置無誤後，完全重啟伺服器：

```bash
# 終止當前伺服器 (Ctrl+C)

# 清除快取（可選）
rm -rf .next

# 重新啟動
npm run dev
```

**重要**：Node.js 進程需要重新讀取 `.env.local` 文件。簡單的頁面重新整理不會更新環境變數。

## 完整驗證清單

在宣稱簽章問題已解決前，確保所有項目都已檢查：

- [ ] `.env.local` 中的 `ECPAY_HASH_KEY` 完全正確
- [ ] `.env.local` 中的 `ECPAY_HASH_IV` 完全正確
- [ ] 兩個值都是測試環境的值（不是正式環境）
- [ ] 無前後空格、換行或其他字符
- [ ] 開發伺服器已完全重啟（進程終止並重新啟動）
- [ ] 瀏覽器快取已清除（F12 → Application → Clear all）
- [ ] 再次完整執行支付流程
- [ ] 伺服器日誌中 `match: true`
- [ ] 成功重定向到 `/order/[id]/result` 頁面
- [ ] 訂單狀態在 Firestore 中已更新為 `PAID` 或 `FAILED`

## 常見陷阱

### 1. 環境變數未生效

**症狀**：修改 `.env.local` 後仍然出現簽章錯誤

**原因**：Node.js 進程在啟動時讀取環境變數，不會自動重新讀取

**解決**：
```bash
# 完全終止當前進程
# 在 macOS/Linux：
lsof -ti:3000 | xargs kill -9

# 或使用 Ctrl+C，然後等待進程完全終止
npm run dev
```

### 2. 區分大小寫錯誤

**症狀**：簽章驗證失敗，但 `.env.local` 看起來正確

**原因**：ECPay 金鑰區分大小寫，`5294y06JbISpM5x9` 和 `5294y06jbispm5x9` 是不同的

**檢查**：
```bash
# 逐字符對比
echo "Expected: 5294y06JbISpM5x9"
echo "Actual:   $(grep ECPAY_HASH_KEY .env.local | cut -d= -f2)"
```

### 3. 使用了正式環境的金鑰

**症狀**：一切看起來都正確，但仍然簽章驗證失敗

**原因**：意外使用了正式環境的 HashKey/HashIV

**檢查**：
```bash
# 確認使用的是測試環境
ECPAY_HASH_KEY=5294y06JbISpM5x9       # ✓ 測試
ECPAY_HASH_KEY=your_production_key    # ✗ 正式
```

### 4. 參數編碼不符

**症狀**：手動計算的簽章與日誌中的不符

**原因**：URL 編碼規則不同（ECPay 有特殊規則）

**檢查**：使用文檔中的 `urlEncodeForECPay` 函數，不要使用標準的 encodeURIComponent

### 5. 未清除瀏覽器快取

**症狀**：修改代碼並重啟伺服器後仍然失敗

**原因**：瀏覽器緩存了舊的 JavaScript 或會話

**解決**：
```
F12 → Application → Cookies/LocalStorage → 清除所有
或使用無痕模式重新測試
```

## ECPay 簽章規範

如果上述步驟都無法解決，參考 [ECPay 官方文檔](https://developers.ecpay.com.tw/)：

- 簽章算法：SHA256
- 編碼方式：UTF-8
- 輸出格式：大寫十六進制字符串（64 字符）
- 參數排序：按鍵名字母順序（Case-sensitive）

## 聯絡 ECPay 支持

如果確認本地實現無誤，但仍然無法驗證，可以：

1. 在 [ECPay 開發者社區](https://developers.ecpay.com.tw/) 提問
2. 檢查是否有新的簽章算法更新
3. 確認商家帳號狀態（測試/正式）
4. 驗證 IP 白名單配置（如適用）

## 相關文檔

- [CHECKOUT_TROUBLESHOOTING.md](./CHECKOUT_TROUBLESHOOTING.md) - 結帳流程常見問題
- [env-ecpay-example.md](./env-ecpay-example.md) - 環境變數配置說明
- [README.md](../README.md) - 項目整體文檔，含 ECPay 測試信息

---

**最後更新**：2025-11-11
