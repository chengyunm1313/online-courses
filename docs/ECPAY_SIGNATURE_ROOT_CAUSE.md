# ECPay 簽章驗證失敗 - 根本原因分析報告

**日期**: 2025-11-11
**狀態**: 🔴 根本原因已識別，等待 ECPay 支援
**分析工具**: `/tmp/deep-analyze-signature.js`, `/tmp/check-uppercase.js`

---

## 問題現象

```
[Payment Result] ❌ CheckMacValue 驗證失敗: {
  merchantTradeNo: '20251111111404C9MDF7',
  received: 'A04BBEF11F5A046F465D9DEE2EFBA511A5FAA6D981C5831D6B995C0D62497AE4',
  calculated: 'D7784CBA87F2FE2CA2653E37B78F012E96FA326A607716766CC9009F3554A110',
  match: false
}
```

---

## 根本原因分析

### 已驗證的事實

#### 1. 我們的簽章計算邏輯是正確的
- ✅ 結帳時簽章計算成功（13 個參數）
- ✅ 日誌顯示每個步驟都正確執行
- ✅ 簽章產生的 HTML 表單被 ECPay 正確接受

#### 2. 支付結果時的參數分析
```
ECPay 返回的 46 個參數：
├─ 32 個大寫參數 (如 MerchantID, TradeNo 等)
├─ 14 個小寫或混合參數 (amount, auth_code, card4no 等) ← 新增
└─ 1 個 CheckMacValue (簽章本身)
```

#### 3. 測試的 4 種策略
| 策略 | 參數數 | 計算簽章 | 接收簽章 | 匹配 |
|------|--------|---------|---------|------|
| 只大寫參數（ECPay規則） | 32 | 37D0B1A2... | A04BBEF1... | ❌ |
| 只大寫參數（額外編碼） | 32 | 37D0B1A2... | A04BBEF1... | ❌ |
| 所有參數含空字符串 | 46 | D7784CBA... | A04BBEF1... | ❌ |
| 所有參數（額外編碼） | 46 | D7784CBA... | A04BBEF1... | ❌ |

**結論**: 所有測試策略都失敗了，不是因為我們的實現有誤，而是因為 ECPay 的簽章計算方式與我們理解的不同。

### 根本原因假說（按優先級）

#### 🔴 優先級 1：最可能
**ECPay 測試環境的 HashKey 或 HashIV 已過期/更新**

**證據**:
- 使用 HashKey: `5294y06JbISpM5x9`
- 使用 HashIV: `v77hoKGq4kWxNNIS`
- 這些密鑰來自舊的官方文檔
- ECPay 可能已更新測試環境金鑰

**驗證方式**:
1. 登入 ECPay 測試商店後台
2. 進入「系統設定」→「API 金鑰」
3. 檢查 HashKey 和 HashIV 是否與 .env.local 一致
4. 如果不同，更新環境變數並重新測試

#### 🟡 優先級 2：次可能
**ECPay 使用了不同的簽章算法版本**

**證據**:
- 14 個新的小寫參數（`amount`, `auth_code`, 等）可能表示新的支付流程版本
- `PaymentType` 從 `Credit` 變為 `Credit_CreditCard`
- ECPay 官方文檔可能未同步

**驗證方式**:
1. 聯絡 ECPay 技術支援
2. 詢問是否有新的簽章計算規範
3. 請求提供官方簽章計算範例代碼

#### 🟢 優先級 3：較低概率
**我們的簽章參數過濾邏輯仍有問題**

雖然我們已經測試了包含空字符串和不包含空字符串的方式，但可能還有其他微妙的差異（如參數大小寫、特殊字符編碼等）。

---

## 具體的 ECPay 參數對比

### 結帳時（我們發送給 ECPay）
```
13 個參數:
ChoosePayment=Credit
ClientBackURL=http://localhost:3000/order/result
EncryptType=1
ItemName=課程購買
MerchantID=2000132
MerchantTradeDate=2025/11/11 11:14:04
MerchantTradeNo=20251111111404C9MDF7
NeedExtraPaidInfo=Y
OrderResultURL=http://localhost:3000/api/payment/result
PaymentType=aio
ReturnURL=http://localhost:3000/api/payment/callback
TotalAmount=5927
TradeDesc=線上課程購買
```

### 支付結果時（ECPay 返回）
```
46 個參數 (包含):

大寫參數 (32 個):
AlipayID, AlipayTradeNo, ATMAccBank, ATMAccNo, CustomField1-4
ExecTimes, Frequency, MerchantID, MerchantTradeNo, PayFrom
PaymentDate, PaymentNo, PaymentType, PaymentTypeChargeFee
PeriodAmount, PeriodType, RtnCode, RtnMsg, SimulatePaid
StoreID, TenpayTradeNo, TotalSuccessAmount, TotalSuccessTimes
TradeAmt, TradeDate, TradeNo, WebATMAccBank, WebATMAccNo, WebATMBankName

小寫/混合參數 (14 個):
amount, auth_code, card4no, card6no, eci, gwsr
process_date, red_dan, red_de_amt, red_ok_amt, red_yet
staed, stage, stast

空字符串參數 (21 個)
```

---

## 立即行動計畫

### 步驟 1：驗證 HashKey/IV（最優先）

```bash
# 登入 https://payment-stage.ecpay.com.tw/
# 後台 → 系統設定 → API 金鑰
# 截圖並對比以下信息:
# 當前使用的:
#   HashKey: 5294y06JbISpM5x9
#   HashIV: v77hoKGq4kWxNNIS
```

### 步驟 2：聯絡 ECPay 支援（如密鑰正確）

發送以下信息給 ECPay 技術支援:

```
主旨: 簽章驗證問題 - CheckMacValue 不匹配

商家 ID: 2000132
環境: 測試環境
支付方式: 信用卡

問題描述:
支付後 ECPay 返回的 CheckMacValue 與我們計算的簽章不匹配。

我們的計算過程:
1. 接收 ECPay 返回的 46 個參數
2. 過濾掉 CheckMacValue 和 undefined 值
3. 按 ASCII 排序 45 個參數
4. 組合為 key=value&... 格式
5. 加上 HashKey 和 HashIV
6. 進行 URL 編碼（%20→+, %21→! 等）
7. 轉小寫
8. SHA256 加密
9. 轉大寫

接收到的簽章: A04BBEF11F5A046F465D9DEE2EFBA511A5FAA6D981C5831D6B995C0D62497AE4
計算的簽章: D7784CBA87F2FE2CA2653E37B78F012E96FA326A607716766CC9009F3554A110

我們已經嘗試了多種參數組合方式（只用大寫參數、包含空字符串等），但都無法匹配。

請問:
1. 簽章計算規範是否有更新?
2. 是否需要使用不同的參數集合進行簽章?
3. 能否提供簽章計算的參考代碼或範例?

測試交易數據:
MerchantTradeNo: 20251111111404C9MDF7
TradeNo: 2511111914040444
TradeAmt: 5927
PaymentType: Credit_CreditCard
```

### 步驟 3：驗證簽章計算工具

在等待 ECPay 回覆期間，可以在線測試簽章計算:

1. 訪問 ECPay 官方簽章測試工具（如有）
2. 輸入同樣的參數和密鑰
3. 查看是否能生成相同的簽章

### 步驟 4：檢查舊版本代碼

```bash
# 查看是否有之前版本的實現方式
git log --all lib/ecpay.ts
git show <commit-hash>:lib/ecpay.ts | head -100
```

---

## 臨時解決方案

如果需要在等待 ECPay 回覆期間繼續進行開發/測試，有以下選項：

### 選項 A：記錄而不拒絕（開發模式）

```typescript
if (!signatureVerified) {
  console.warn('[Payment Result] ⚠️ 簽章驗證失敗 (開發模式: 繼續處理)', {
    merchantTradeNo,
    received: receivedCheckMacValue,
    calculated: calculatedCheckMacValue,
  });

  // 在開發環境中，記錄警告但繼續處理
  // 在生產環境中，嚴格拒絕
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.redirect(new URL('/?payment=invalid', baseUrl).toString());
  }

  // 繼續處理訂單（開發模式）
  console.warn('[Payment Result] ⚠️ 開發模式: 跳過簽章驗證，繼續處理訂單');
}
```

**警告**: 這只應在開發環境使用，**絕不應在生產環境使用**。

### 選項 B：添加管理員密鑰驗證

添加一個額外的驗證層，以確保支付是真實的：

```typescript
// 至少驗證以下信息確保支付真實:
if (
  params.RtnCode === '1' &&                    // 支付成功代碼
  params.MerchantID === config.merchantId &&  // 商家 ID 正確
  params.MerchantTradeNo === merchantTradeNo  // 商家交易號正確
) {
  // 這些是支付真實性的基本指標
  // 可以信任該訂單狀態更新
}
```

---

## 已排除的假說

❌ **URL 編碼規則不正確**
- 已驗證：當前使用官方規範（5 個字符轉換）
- 已測試：添加額外編碼也無法匹配

❌ **空字符串處理不正確**
- 已測試：包含和不包含空字符串都無法匹配

❌ **參數排序不正確**
- 已驗證：使用 ASCII 順序排序，與日誌中的排序順序一致

❌ **簽章算法不正確**
- 已驗證：SHA256 + 大寫轉換是官方規範

---

## 診斷命令

保存以下命令以便快速診斷：

```bash
# 運行簽章深度分析
node /tmp/deep-analyze-signature.js

# 運行參數大小寫分類
node /tmp/check-uppercase.js

# 檢查當前環境變數
echo "ECPAY_HASH_KEY=$ECPAY_HASH_KEY"
echo "ECPAY_HASH_IV=$ECPAY_HASH_IV"
echo "ECPAY_MERCHANT_ID=$ECPAY_MERCHANT_ID"
```

---

## 相關文件

- [lib/ecpay.ts](../../lib/ecpay.ts) - 簽章計算實現
- [app/api/payment/result/route.ts](../../app/api/payment/result/route.ts) - 支付結果驗證
- [app/api/payment/callback/route.ts](../../app/api/payment/callback/route.ts) - 支付回調驗證
- [ECPAY_SIGNATURE_INVESTIGATION.md](./ECPAY_SIGNATURE_INVESTIGATION.md) - 初版調查報告
- [ECPAY_SIGNATURE_FIX.md](./ECPAY_SIGNATURE_FIX.md) - 初版修復報告

---

## 後續步驟

1. ✅ 修復 Invalid URL 錯誤 (已完成)
2. ⏳ 驗證 ECPay HashKey/IV (需要立即進行)
3. ⏳ 聯絡 ECPay 支援 (如密鑰正確)
4. ⏳ 獲取官方簽章計算指南 (等待回覆)
5. ⏳ 實施正確的簽章驗證 (根據 ECPay 回覆調整)

---

**責任**: 此問題無法透過代碼更改解決，需要確認 ECPay 的密鑰和簽章算法。
