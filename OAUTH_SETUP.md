# Google OAuth 登入設定指南

## 問題描述
如果您在 Google 登入後無法返回網站，可能是 Google Cloud Console 的 OAuth 重定向 URI 設定不正確。

## 解決步驟

### 1. 檢查 Google Cloud Console 設定

前往 [Google Cloud Console](https://console.cloud.google.com/):

1. 選擇您的專案（online-courses-bbcae）
2. 進入「API 和服務」 > 「憑證」
3. 找到您的 OAuth 2.0 客戶端 ID（1084123760849-klaqr35jhoiiu6s1h0fbpo2vbbp39k8v）
4. 點擊編輯

### 2. 添加授權的重新導向 URI

在「已授權的重新導向 URI」部分，確保包含以下 URI：

#### 開發環境：
```
http://localhost:3000/api/auth/callback/google
```

#### 如果使用其他端口（例如 3001）：
```
http://localhost:3001/api/auth/callback/google
```

#### 生產環境（部署後）：
```
https://yourdomain.com/api/auth/callback/google
```

### 3. 授權的 JavaScript 來源

同時確保在「已授權的 JavaScript 來源」中包含：

#### 開發環境：
```
http://localhost:3000
```

#### 生產環境：
```
https://yourdomain.com
```

### 4. 儲存更改

點擊「儲存」按鈕保存更改。

**重要：Google OAuth 設定變更可能需要幾分鐘才能生效。**

## 測試登入流程

1. 啟動開發伺服器：
   ```bash
   npm run dev
   ```

2. 開啟瀏覽器：
   ```
   http://localhost:3000/auth/test
   ```

3. 點擊「Sign in with Google」按鈕

4. 完成 Google 登入流程

5. 確認是否正確返回 `/auth/test` 頁面並顯示用戶資訊

## 常見錯誤

### 錯誤 1: redirect_uri_mismatch
**錯誤訊息**：「Error 400: redirect_uri_mismatch」

**原因**：Google Cloud Console 中的重定向 URI 與實際請求的 URI 不匹配

**解決方案**：
1. 查看錯誤訊息中顯示的實際 redirect_uri
2. 確保該 URI 完全匹配（包括協議、域名、端口、路徑）
3. 在 Google Cloud Console 中添加該 URI
4. 等待幾分鐘讓更改生效

### 錯誤 2: 登入後卡在空白頁面
**可能原因**：
- NextAuth 回調處理失敗
- Session 創建失敗
- Firestore 連接問題

**解決方案**：
1. 檢查瀏覽器控制台的錯誤訊息
2. 檢查開發伺服器終端的日誌
3. 確認 Firebase Admin SDK 配置正確
4. 清除瀏覽器 Cookie 後重試

### 錯誤 3: 無限重定向循環
**可能原因**：
- Session 創建失敗但沒有顯示錯誤
- Firestore adapter 配置問題

**解決方案**：
1. 檢查 `.env.local` 中的 Firebase 憑證
2. 確認 Firestore 資料庫已啟用
3. 檢查 Firebase 專案是否正確設定
4. 清除瀏覽器 Cookie 和網站數據

## 更新後的 NextAuth 配置

我已經更新了 `lib/auth.ts`，包含以下改進：

1. **明確的重定向策略**：
   ```typescript
   async redirect({ url, baseUrl }) {
     if (url.startsWith("/")) return `${baseUrl}${url}`;
     else if (new URL(url).origin === baseUrl) return url;
     return baseUrl;
   }
   ```

2. **資料庫 Session 策略**：
   ```typescript
   session: {
     strategy: "database",
     maxAge: 30 * 24 * 60 * 60, // 30 days
   }
   ```

3. **Google OAuth 優化參數**：
   ```typescript
   authorization: {
     params: {
       prompt: "consent",
       access_type: "offline",
       response_type: "code"
     }
   }
   ```

4. **自定義錯誤頁面**：
   - 登入頁面：`/auth/test`
   - 錯誤頁面：`/auth/error`

## Debug 模式

NextAuth 的 debug 模式已在開發環境啟用。查看終端日誌以獲取詳細的認證流程資訊。

如果仍有問題，請檢查：
1. 終端中的 NextAuth debug 日誌
2. 瀏覽器控制台的錯誤
3. Firebase Console 的日誌
4. Google Cloud Console 的 OAuth 同意屏幕設定

## 驗證成功的標誌

登入成功後，您應該看到：
- ✅ 返回到 `/auth/test` 頁面
- ✅ 顯示「You are logged in!」訊息
- ✅ 顯示您的 Google 頭像
- ✅ 顯示您的姓名和電子郵件
- ✅ 顯示用戶 ID
- ✅ Navbar 顯示您的頭像和姓名
- ✅ 可以訪問受保護的頁面（/profile, /learning）

## 需要幫助？

如果按照以上步驟仍無法解決問題，請提供以下資訊：

1. 瀏覽器控制台的完整錯誤訊息
2. 開發伺服器終端的日誌
3. Google OAuth 錯誤屏幕的截圖（如果有）
4. 您當前使用的 URL（localhost:3000 或其他）

這些資訊將幫助我們更快地診斷和解決問題。
