# 綠界金流環境變數配置指南

本文檔說明如何配置綠界 ECPay 相關的環境變數。

## 環境變數設定

在 `.env.local` 檔案中新增以下變數：

### 綠界 ECPay 配置

```bash
# ECPay 商家設定（測試環境）
ECPAY_MERCHANT_ID=2000132
ECPAY_HASH_KEY=5294y06JbISpM5x9
ECPAY_HASH_IV=v77hoKGq4kWxNNIS
ECPAY_CASHIER_URL=https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5

# 應用程式基礎 URL（用於綠界回傳）
APP_BASE_URL=http://localhost:3000
```

### 正式環境配置

上線前，將以下變數更換為正式環境的金鑰：

```bash
# ECPay 商家設定（正式環境）
ECPAY_MERCHANT_ID=your_production_merchant_id
ECPAY_HASH_KEY=your_production_hash_key
ECPAY_HASH_IV=your_production_hash_iv
ECPAY_CASHIER_URL=https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5

# 應用程式基礎 URL（正式域名）
APP_BASE_URL=https://yourdomain.com
```

## 變數說明

| 變數 | 說明 | 範例 | 備註 |
| --- | --- | --- | --- |
| `ECPAY_MERCHANT_ID` | 綠界商家 ID | `2000132` | 測試環境統一使用 |
| `ECPAY_HASH_KEY` | 簽名用的 HashKey | `5294y06JbISpM5x9` | 測試環境固定值，正式環境需更換 |
| `ECPAY_HASH_IV` | 簽名用的 HashIV | `v77hoKGq4kWxNNIS` | 測試環境固定值，正式環境需更換 |
| `ECPAY_CASHIER_URL` | 綠界支付頁面 URL | `https://payment-stage.ecpay.com.tw/...` | 測試環境和正式環境不同 |
| `APP_BASE_URL` | 應用程式基礎 URL | `http://localhost:3000` | 用於綠界回傳 callback 和 result |

## 測試環境認證資訊

### 測試信用卡

| 卡號 | 有效期 | CVV | 結果 |
| --- | --- | --- | --- |
| 4311-9522-2222-2222 | 任意未來日期 | 任意 | ✓ 支付成功 |
| 其他卡號 | - | - | ✗ 支付失敗 |

### 測試 OTP 驗證

當系統提示輸入 OTP 或其他驗證碼時，輸入任意 4 位數字即可通過。

## 本地開發設定

確保你的 `.env.local` 檔案包含所有必要的環境變數：

```bash
# Firebase Admin SDK（既有）
FIREBASE_PROJECT_ID=online-courses-bbcae
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@online-courses-bbcae.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# NextAuth.js（既有）
NEXTAUTH_SECRET=your-secret-here
AUTH_TRUST_HOST=true

# Google OAuth（既有）
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# 綠界金流（新增）
ECPAY_MERCHANT_ID=2000132
ECPAY_HASH_KEY=5294y06JbISpM5x9
ECPAY_HASH_IV=v77hoKGq4kWxNNIS
ECPAY_CASHIER_URL=https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5
APP_BASE_URL=http://localhost:3000
```

## 取得正式環境金鑰

1. 在 [綠界科技官網](https://www.ecpay.com.tw/) 註冊商家帳號
2. 登入綠界商家後台
3. 進入「系統設定」→「特店設定」
4. 找到您的商家 ID、HashKey 和 HashIV
5. 複製這些值到你的環境變數中

## ngrok 用於本地測試

如果你在本地開發環境進行測試，綠界無法直接連接到 `localhost:3000`。使用 ngrok 公開本地伺服器：

```bash
# 安裝 ngrok（如未安裝）
npm install -g ngrok

# 啟動 ngrok
ngrok http 3000

# 記錄輸出的公開 URL，例如：
# https://xxxx-xxx-xxx-xxx.ngrok.io

# 在 .env.local 中更新
APP_BASE_URL=https://xxxx-xxx-xxx-xxx.ngrok.io
```

## 安全性提醒

⚠️ **重要**：
- 永遠不要將 `.env.local` 提交到 Git（已在 .gitignore 中）
- 永遠不要在版本控制中洩露 HashKey、HashIV 或其他敏感資訊
- 在生產環境中，使用 Vercel 或其他平台的環境變數管理工具存儲敏感資訊

## 驗證設定

啟動開發伺服器後，測試以下步驟：

1. 進入首頁
2. 選擇一門課程
3. 點擊「立即購買」或進入購物車
4. 完成結帳表單
5. 選擇支付方式（信用卡或 ATM）
6. 提交結帳
   - **信用卡**：應被導向綠界支付頁面
   - **ATM**：應顯示銀行轉帳資訊
7. 完成支付（使用測試卡號）
8. 驗證訂單狀態更新

## 常見問題

### CheckMacValue 驗證失敗

**症狀**：API 返回 "CheckMacValue verification failed"

**可能原因**：
- HashKey 或 HashIV 不正確
- 環境變數未正確讀取

**解決**：
1. 確認 `.env.local` 中的 HashKey 和 HashIV 正確
2. 重啟開發伺服器
3. 檢查伺服器日誌中的簽名值對比

### 綠界沒有回傳通知

**症狀**：訂單狀態保持為 CREATED，未更新為 PAID/FAILED

**可能原因**：
- ReturnURL 不可達（本地環境）
- 防火牆或網路問題
- 伺服器返回非 "1|OK"

**解決**：
1. 使用 ngrok 公開本地伺服器
2. 檢查伺服器日誌和 Firestore 中的訂單狀態
3. 驗證 `/api/payment/callback` 端點正確回傳 "1|OK"

### 訂單總金額不符

**症狀**：ECPay 顯示的金額與訂單不符

**可能原因**：
- 小數點計算精度問題
- 運費或稅金計算錯誤

**解決**：
1. 確保所有金額都是整數（台幣以元為單位）
2. 使用 `Math.round()` 確保精度
3. 在結帳前驗證總金額

## 參考資源

- [綠界 ECPay 文檔](https://developers.ecpay.com.tw/)
- [ECPay AIO 一次付清規格](https://developers.ecpay.com.tw/?p=2856)
- [測試說明](https://developers.ecpay.com.tw/docs/ecpay-payment-integration-overview)

---

**最後更新**：2025-11-11
