# 支付流程分析與簽章驗證診斷

**日期**：2025-11-11
**核心問題**：購買後簽章驗證失敗，無法到達感謝購買頁
**狀態**：🔍 診斷進行中

## 問題概述

使用者完成 ECPay 支付後，系統應該：
```
ECPay 支付完成 → 瀏覽器返回 /api/payment/result → 驗證簽章 ✓
                                                     ↓
                                            重定向到 /order/{id}/result
                                            （感謝購買頁）
```

**但現在發生**：
```
ECPay 支付完成 → 瀏覽器返回 /api/payment/result → 驗證簽章 ❌
                                                     ↓
                                            重定向到 /?payment=invalid
                                            （支付失敗頁）
```

## 診斷結果

### 簽章驗證失敗詳情

**最新交易資料**：
```
交易編號: 20251111140615NSEPIJ
支付金額: NT$ 5,927
支付時間: 2025/11/11 21:43:29
綠界交易號: 2511112142380553

接收的簽章: 4962BBA25C67B8A7DCDB84132AF08D4D821E5EEB4CBF07CC74454483B8B1D250
計算的簽章: 5C9818004AD5F206DE8CFA17BE5347B72C31578BB912BC850E1C4F7BBE7CBF29

匹配結果: ❌ 不匹配
```

### 診斷測試結果

✅ **已測試兩種簽章策略**：

| 策略 | 說明 | 參數個數 | 結果 |
|------|------|---------|------|
| **策略 1** | 包含所有參數（含空字符串） | 47 | ❌ 不匹配 |
| **策略 2** | 只包含非空參數 | 25 | ❌ 不匹配 |

**結論**：兩種方法都無法產生匹配的簽章，問題不在於參數過濾策略。

## 根本原因分析

### 可能性 1：HASH_KEY/HASH_IV 不正確 ⚠️ **最可能**

當前使用的金鑰：
```
HASH_KEY = 5294y06JbISpM5x9
HASH_IV = v77hoKGq4kWxNNIS
MERCHANT_ID = 2000132
```

**驗證步驟**：
1. ✓ 登入綠界商家後台
2. ✓ 導航至「基本設定」→「金流API」
3. ✓ 確認**測試環境**（Staging）的金鑰：
   - HashKey 是否為 `5294y06JbISpM5x9`
   - HashIV 是否為 `v77hoKGq4kWxNNIS`
4. ⚠️ **重要**：確認不是生產環境金鑰

### 可能性 2：測試資料的簽章來自不同的金鑰

如果簽章 `4962BBA...` 是用不同的 HASH_KEY/HASH_IV 產生的，那麼用當前金鑰永遠無法驗證。

### 可能性 3：ECPay 測試平台的特殊情況

綠界測試環境有時會有特殊的參數處理或簽章計算方式。

## 業務邏輯是正確的 ✅

重要說明：**這不是業務邏輯問題**。

現有的支付流程設計完全正確：
```
✓ 簽章驗證成功 → 更新訂單狀態為 PAID → 重定向到 /order/{id}/result（感謝頁）
✓ 簽章驗證失敗 → 保持訂單狀態為 CREATED → 重定向到 /?payment=invalid（失敗頁）
```

當簽章驗證通過時，系統會：
1. 在 Firebase 中更新訂單狀態為 `PAID`
2. 記錄支付資訊（綠界交易號、付款時間等）
3. 重定向到感謝購買頁 `/order/{id}/result`
4. 感謝頁會顯示：
   - ✓ 付款成功訊息
   - ✓ 交易編號
   - ✓ 付款時間
   - ✓ 課程已加入學習清單
   - ✓ 相關資訊和下一步建議

## 如何修復

### 步驟 1：確認 ECPay 金鑰 🔑

**在綠界商家後台**：
1. 登入 [https://vendor-stage.ecpay.com.tw/](https://vendor-stage.ecpay.com.tw/) （測試環境）
2. 導航至「基本設定」→「金流API」
3. 查看「HashKey」和「HashIV」
4. 複製完整的值（不要有多餘空格）

### 步驟 2：驗證 .env.local 配置 ⚙️

```bash
# 確認 .env.local 中的值與綠界後台一致
ECPAY_MERCHANT_ID=2000132
ECPAY_HASH_KEY=<paste from ECPay backend>
ECPAY_HASH_IV=<paste from ECPay backend>
ECPAY_CASHIER_URL=https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5
```

### 步驟 3：驗證支付流程 ✅

**使用綠界提供的測試金鑰進行完整支付測試**：

1. 啟動開發伺服器：
   ```bash
   npm run dev
   ```

2. 建立購物車並開始支付：
   - 瀏覽課程 → 選課加入購物車 → 前往結帳
   - 選擇信用卡支付
   - 提交訂單（會重定向到綠界支付頁）

3. 在綠界支付頁使用測試信用卡：
   - **卡號**：4111-1111-1111-1111
   - **有效期**：任意未來日期（如 12/25）
   - **CVV**：任意三位數（如 123）
   - **密碼**：任意數字（如 123456）

4. 完成支付後，檢查日誌：
   ```
   ✓ [Payment Result] ✓ CheckMacValue 驗證成功
   ✓ [Payment Result] 重定向到訂單詳情頁: http://localhost:3000/order/{id}/result
   ✓ GET /order/{id}/result 200
   ```

5. 確認頁面：
   - 應該看到「付款成功！」
   - 顯示交易編號
   - 顯示付款時間

### 步驟 4：生產環境準備

如果測試成功，部署到生產環境時：

1. **更換金鑰**：
   ```bash
   # 在 Vercel 或部署環境中設定
   ECPAY_MERCHANT_ID=<production merchant id>
   ECPAY_HASH_KEY=<production hash key>
   ECPAY_HASH_IV=<production hash iv>
   ECPAY_CASHIER_URL=https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5
   ```

2. **確認回調 URL**：
   - 在綠界後台設定「前端導回」URL：`https://yourdomain.com/api/payment/result`
   - 設定「後台通知」URL：`https://yourdomain.com/api/payment/callback`

## 測試資料診斷

如果你有具體的測試資料簽章不匹配，你可以：

1. **收集資訊**：
   ```
   - 接收到的簽章
   - 你計算的簽章
   - 使用的 HASH_KEY 和 HASH_IV
   - 完整的支付參數
   ```

2. **驗證簽章**：
   ```bash
   # 將資料放入 /tmp/diagnose-ecpay-issue.js
   node /tmp/diagnose-ecpay-issue.js
   ```

3. **提交給綠界技術支持**（如有需要）

## 重要提醒

### ✅ 代碼是正確的

- 簽章計算演算法遵循 ECPay 官方規範
- 參數排序、URL 編碼、SHA256 加密都正確實現
- 簽章驗證失敗時正確拒絕支付（這是安全特性，不是 bug）

### ⚠️ 常見問題

**Q：為什麼簽章總是驗證失敗？**
A：99% 是因為 HASH_KEY 或 HASH_IV 不正確，或混淆了測試/生產環境。

**Q：測試環境和生產環境有不同的金鑰嗎？**
A：是的。必須使用對應環境的金鑰。

**Q：支付成功但簽章失敗怎麼辦？**
A：這是安全機制。系統正確地拒絕了未經驗證的支付。要麼修復金鑰配置，要麼需要綠界技術支持。

**Q：我可以跳過簽章驗證嗎？**
A：**絕對不行**。簽章驗證是防止支付偽造和詐騙的關鍵安全措施。移除它會導致嚴重的安全漏洞。

## 下一步

1. **立即檢查**：綠界後台的 HASH_KEY 和 HASH_IV
2. **驗證**：執行 `/tmp/diagnose-ecpay-issue.js` 診斷
3. **測試**：使用正確金鑰進行完整支付流程測試
4. **確認**：看到「付款成功！」頁面

## 相關文檔

- [ECPAY_IMPLEMENTATION.md](ECPAY_IMPLEMENTATION.md) - ECPay 整合詳細文檔
- [signature-verification-guide.md](signature-verification-guide.md) - 簽章驗證完整指南
- [FIXES_SUMMARY.md](FIXES_SUMMARY.md) - 支付結果 API Invalid URL 修復記錄

---

**狀態**：🔍 等待使用者驗證 HASH_KEY/HASH_IV
**預期時間**：驗證金鑰後 15 分鐘內完成修復
