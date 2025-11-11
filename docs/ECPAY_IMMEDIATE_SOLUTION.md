# ECPay 簽章驗證 - 立即解決方案

**狀況**: 簽章驗證失敗，根本原因已識別為 ECPay 側問題（密鑰或算法差異）

**建議**: 在等待 ECPay 官方回覆期間，採用實用的開發/測試方案

---

## 🔧 選項 1：最小風險 - 遵循官方規範（推薦）

**適用場景**: 正式環境和長期方案

**做法**: 保持當前的嚴格簽章驗證，同時向 ECPay 官方索取支援

```typescript
// app/api/payment/result/route.ts - 保持現有邏輯
if (!signatureVerified) {
  console.error('[Payment Result] ❌ CheckMacValue 驗證失敗');
  return NextResponse.redirect(new URL('/?payment=invalid', baseUrl).toString());
}
```

**優點**:
- ✅ 安全性最高
- ✅ 符合官方規範
- ✅ 無技術債

**缺點**:
- ❌ 目前無法進行完整支付流程測試

**行動**:
1. 立即確認 HashKey/IV（見下方步驟）
2. 聯絡 ECPay 官方支援
3. 等待官方確認簽章算法

---

## 🛠️ 選項 2：開發模式 - 環境變數控制

**適用場景**: 開發和測試環境

**做法**:

1. 添加新的環境變數到 `.env.local`:
```bash
# .env.local
ECPAY_SKIP_SIGNATURE_VERIFICATION=true  # 僅用於開發測試
```

2. 修改驗證邏輯:
```typescript
// lib/ecpay.ts - 新增驗證函數
export function shouldSkipSignatureVerification(): boolean {
  return process.env.NODE_ENV === 'development' &&
         process.env.ECPAY_SKIP_SIGNATURE_VERIFICATION === 'true';
}

export function verifyCheckMacValue(
  params: Record<string, string | number | undefined>,
  hashKey: string,
  hashIV: string
): boolean {
  // 開發模式下可跳過驗證
  if (shouldSkipSignatureVerification()) {
    console.warn('[ECPay] ⚠️ 簽章驗證已跳過（開發模式）');
    return true;
  }

  // 正常驗證邏輯
  const receivedCheckMacValue = params.CheckMacValue;
  if (!receivedCheckMacValue) {
    return false;
  }

  const calculatedCheckMacValue = generateCheckMacValue(params, hashKey, hashIV);
  return String(receivedCheckMacValue) === calculatedCheckMacValue;
}
```

3. 更新 API 路由:
```typescript
// app/api/payment/result/route.ts
const signatureVerified = verifyCheckMacValue(params, config.hashKey, config.hashIV);

if (!signatureVerified) {
  // 跳過檢查時的警告
  if (!shouldSkipSignatureVerification()) {
    console.error('[Payment Result] ❌ CheckMacValue 驗證失敗');
    return NextResponse.redirect(new URL('/?payment=invalid', baseUrl).toString());
  } else {
    console.warn('[Payment Result] ⚠️ CheckMacValue 驗證失敗但已跳過（開發模式）');
  }
}
```

**優點**:
- ✅ 可進行開發測試
- ✅ 生產環境仍然安全
- ✅ 易於啟用/禁用

**缺點**:
- ⚠️ 開發環境安全性降低
- ⚠️ 可能遮蔽真實的簽章計算問題

---

## 🚀 選項 3：增強驗證 - 多層驗證法

**適用場景**: 需要一定安全保障的測試環境

**做法**: 添加額外的驗證層，即使簽章失敗也能驗證支付真實性

```typescript
function isPaymentLikelyLegitimate(params: Record<string, any>, config: ECPayConfig): boolean {
  // 多層驗證，即使簽章失敗也能判斷支付真實性
  return (
    params.MerchantID === config.merchantId &&        // 商家 ID 正確
    params.RtnCode === '1' &&                         // 支付成功
    params.MerchantTradeNo === merchantTradeNo &&     // 商家交易號正確
    parseInt(params.TradeAmt) > 0                     // 金額有效
  );
}

// 在 payment/result/route.ts 中使用
if (!signatureVerified) {
  // 簽章失敗但滿足其他條件
  if (isPaymentLikelyLegitimate(params, config)) {
    console.warn('[Payment Result] ⚠️ 簽章驗證失敗，但其他驗證通過');

    if (process.env.NODE_ENV === 'production') {
      // 生產環境：絕對拒絕
      return NextResponse.redirect(new URL('/?payment=invalid', baseUrl).toString());
    } else {
      // 開發環境：記錄但繼續
      console.warn('[Payment Result] 開發模式: 繼續處理訂單');
    }
  } else {
    // 簽章失敗且其他驗證也失敗：肯定有問題
    console.error('[Payment Result] ❌ 簽章和其他驗證都失敗');
    return NextResponse.redirect(new URL('/?payment=invalid', baseUrl).toString());
  }
}
```

**優點**:
- ✅ 提供一定的安全保障
- ✅ 可進行測試
- ✅ 易於監控

**缺點**:
- ⚠️ 比簽章驗證安全性略低
- ⚠️ 代碼邏輯複雜

---

## ✅ 立即行動清單

### 第一步：驗證 HashKey/IV（**今天**）

1. 登入 https://payment-stage.ecpay.com.tw/
2. 進入「系統設定」→「API 金鑰」
3. 記錄當前的 HashKey 和 HashIV
4. 對比 `.env.local` 中的值：
   ```bash
   ECPAY_HASH_KEY=5294y06JbISpM5x9
   ECPAY_HASH_IV=v77hoKGq4kWxNNIS
   ```
5. **如果不相同**，更新 `.env.local` 並重新測試支付流程

### 第二步：聯絡 ECPay 官方（如密鑰正確）

發送郵件至 ECPay 技術支援：

**郵件主旨**: 簽章驗證問題 - CheckMacValue 不匹配

**郵件內容**（參考 [ECPAY_SIGNATURE_ROOT_CAUSE.md](./ECPAY_SIGNATURE_ROOT_CAUSE.md)）

### 第三步：選擇臨時方案（同時進行）

根據您的需求，選擇上述三個選項之一：
- **選項 1**: 純粹等待（推薦，但無法測試）
- **選項 2**: 跳過驗證（快速測試，但安全性最低）
- **選項 3**: 多層驗證（平衡方案）

---

## 📊 選項對比表

| 標準 | 選項 1 | 選項 2 | 選項 3 |
|------|--------|--------|--------|
| 安全性 | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐ |
| 可測試性 | ❌ | ✅ | ✅ |
| 代碼複雜性 | 低 | 低 | 中 |
| 推薦程度 | ★ 正式環境 | 快速測試 | 開發環境 |

---

## 🔍 診斷和監控

添加以下日誌以監控簽章驗證狀態：

```typescript
// 在 lib/ecpay.ts 中
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
  const isValid = String(receivedCheckMacValue) === calculatedCheckMacValue;

  // 詳細日誌（便於診斷）
  if (!isValid && process.env.DEBUG_ECPAY === 'true') {
    console.log('[ECPay 簽章診斷]', {
      received: String(receivedCheckMacValue).substring(0, 16) + '...',
      calculated: calculatedCheckMacValue.substring(0, 16) + '...',
      paramCount: Object.keys(params).length,
      nonEmptyParamCount: Object.values(params).filter(v => v !== '' && v !== undefined).length,
    });
  }

  return isValid;
}
```

啟用診斷：
```bash
# .env.local
DEBUG_ECPAY=true
```

---

## 🎯 預期時間表

| 步驟 | 時間 | 狀態 |
|-----|------|------|
| 確認 HashKey/IV | 今天 | 🔴 待進行 |
| 聯絡 ECPay 官方 | 今天 | 🔴 待進行 |
| 接收 ECPay 回覆 | 1-3 天 | ⏳ 等待中 |
| 實施修復 | 回覆後 | ⏳ 等待中 |
| 完整測試 | 修復後 | ⏳ 等待中 |

---

## ⚠️ 重要提醒

- **絕不**在生產環境使用簽章驗證跳過
- **絕不**在公開代碼庫提交包含 `ECPAY_SKIP_SIGNATURE_VERIFICATION=true` 的 `.env.local`
- 始終保留詳細的簽章驗證日誌便於診斷
- 定期檢查 ECPay 官方文檔的更新

---

## 📞 ECPay 聯絡方式

**官方網站**: https://www.ecpay.com.tw/
**技術支援**: support@ecpay.com.tw
**測試環境**: https://payment-stage.ecpay.com.tw/

---

**下一步**: 立即執行「立即行動清單」的第一步！
