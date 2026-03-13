# Cloudflare 上線 Checklist

本文件用於這一版「D1 + Gmail API + ECPay + Google OAuth」架構的實際上線前檢查。

## 1. 基礎設定

- 確認本機 `npm run lint`
- 確認本機 `npm run build`
- 確認本機 `npm run cf:build`
- 確認 [wrangler.toml](/Users/hsuhsiang/Desktop/project/vibe-coding/online-courses/wrangler.toml) 的 `database_id`、`APP_BASE_URL` 已替換成正式值
- 確認正式環境不再使用 repo 內任何實際密鑰

## 2. Cloudflare D1

- 建立正式 D1 database
- 執行 [db/schema.sql](/Users/hsuhsiang/Desktop/project/vibe-coding/online-courses/db/schema.sql)
- 確認 `users`、`courses`、`course_modules`、`course_lessons`、`orders`、`order_items`、`enrollments`、`order_events` 皆已建立
- 若要保留舊資料，先在有 Firebase 憑證的環境執行 `npm run db:migrate:firestore-to-d1`
- 遷移後抽查 `users.role`、課程價格、訂單總額與報名資料是否正確

## 3. Cloudflare Secrets / Vars

依照 [.env.example](/Users/hsuhsiang/Desktop/project/vibe-coding/online-courses/.env.example) 設定正式環境值。

必要 secrets:

- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_D1_DATABASE_ID`
- `CLOUDFLARE_API_TOKEN`
- `ECPAY_MERCHANT_ID`
- `ECPAY_HASH_KEY`
- `ECPAY_HASH_IV`
- `GMAIL_CLIENT_ID`
- `GMAIL_CLIENT_SECRET`
- `GMAIL_REFRESH_TOKEN`
- `GMAIL_SENDER_EMAIL`

必要 vars:

- `APP_BASE_URL`
- `ECPAY_CASHIER_URL`

若仍需執行舊資料遷移腳本，再額外提供：

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

## 4. Google OAuth

- 在 Google Cloud Console 將正式網域加入 OAuth Authorized JavaScript origins
- 將 `${APP_BASE_URL}/api/auth/callback/google` 加入 Authorized redirect URIs
- 用非 admin 的一般帳號登入一次，確認會在 D1 `users` 建立 `student`
- 用 admin 帳號登入一次，確認 `users.role` 可正確帶入 session

## 5. Gmail API 通知

- 確認 Gmail API 已啟用
- 確認 refresh token 尚未失效
- 確認寄件信箱與 `GMAIL_SENDER_EMAIL` 一致
- 觸發一筆測試通知，至少驗證：
  - 訂單建立成功信
  - 付款成功信
  - 報名開通信
- 確認寄信失敗時不會回滾訂單狀態

## 6. ECPay 金流

- 確認 `APP_BASE_URL` 指向正式網域，且 ECPay callback / result URL 可公開連線
- 確認 `ECPAY_HASH_KEY`、`ECPAY_HASH_IV`、`ECPAY_MERCHANT_ID` 為正確環境值
- 以測試卡或測試流程驗證：
  - 建立訂單後，後端會依 `courseId/courseIds` 重算價格
  - callback 驗簽成功時，訂單可轉為 `PAID`
  - callback `TradeAmt` 不一致時會拒絕更新
  - 重送 callback 不會重複入帳
  - `order_events` 會留下事件紀錄
- 確認正式環境不存在 `app/api/payment/result-debug/route.ts` 對應端點

## 7. 權限與後台

- 確認沒有硬編碼 email 升權
- 確認非 admin 無法進入 `/admin`
- 確認 instructor 只能編輯自己的課程
- 確認 admin 可以調整使用者角色
- 確認 demo 管理員與 demo 講師帳號僅存在於需要的環境

## 8. 安全檢查

- 確認 response headers 含安全標頭
- 確認 logs 不包含完整 payment payload、簽章、密鑰或 refresh token
- 確認 repo 未提交 `.env.local`、service account JSON 或其他實際密鑰
- 確認 `npm audit --omit=dev` 的結果已理解
  - 目前殘留風險主要來自遷移用途的 `firebase-admin` 開發期依賴鏈，不在 production request path

## 9. 正式部署

- 執行 `npm run cf:deploy`
- 部署後檢查首頁、課程列表、課程詳情、購買頁、結帳頁、訂單頁、學習頁
- 檢查 `/api/auth/[...nextauth]`、`/api/checkout/ecpay`、`/api/payment/callback`、`/api/payment/result` 可正常工作
- 完成一筆實際測試交易
- 確認付款成功後可看到：
  - 訂單狀態更新
  - 報名資料建立
  - Gmail 通知發出

## 10. 上線後觀察

- 觀察 Cloudflare logs 是否有 D1、OAuth、Gmail、ECPay 錯誤
- 觀察 payment callback 是否有驗簽失敗或金額不一致事件
- 觀察是否有重複入帳或重複報名
- 若有異常，優先比對 `order_events` 與 payment route logs
