# Cloudflare 初始化指令

本文件提供這個專案在 Cloudflare 上線前常用的初始化指令範本。

## 1. 登入與確認帳號

```bash
npx wrangler login
npx wrangler whoami
```

## 2. 建立 D1 資料庫

```bash
npx wrangler d1 create online-courses
```

建立後請把回傳的 `database_id` 填入 [wrangler.toml](/Users/hsuhsiang/Desktop/project/vibe-coding/online-courses/wrangler.toml) 的 `[[d1_databases]]` 區塊。

## 3. 套用 D1 schema

```bash
npx wrangler d1 execute online-courses --file=db/schema.sql
```

若你是用 `database_id` 綁定，也可以改成：

```bash
npx wrangler d1 execute <YOUR_DATABASE_ID> --file=db/schema.sql
```

## 4. 設定 Cloudflare vars

請先把 [wrangler.toml](/Users/hsuhsiang/Desktop/project/vibe-coding/online-courses/wrangler.toml) 內的下列值改成正式環境：

- `name`
- `database_name`
- `database_id`
- `APP_BASE_URL`
- `ECPAY_CASHIER_URL`

目前範例：

```toml
[vars]
APP_BASE_URL = "https://your-domain.example.com"
ECPAY_CASHIER_URL = "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5"
```

## 5. 設定 Cloudflare secrets

以下指令會逐一把敏感值寫入 Cloudflare Worker secrets：

```bash
npx wrangler secret put NEXTAUTH_SECRET
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put ECPAY_MERCHANT_ID
npx wrangler secret put ECPAY_HASH_KEY
npx wrangler secret put ECPAY_HASH_IV
npx wrangler secret put GMAIL_CLIENT_ID
npx wrangler secret put GMAIL_CLIENT_SECRET
npx wrangler secret put GMAIL_REFRESH_TOKEN
npx wrangler secret put GMAIL_SENDER_EMAIL
```

若要執行舊 Firestore -> D1 遷移腳本，再額外設定：

```bash
export CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
export CLOUDFLARE_D1_DATABASE_ID=your-d1-database-id
export CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
export FIREBASE_PROJECT_ID=your-firebase-project-id
export FIREBASE_CLIENT_EMAIL=your-firebase-client-email
export FIREBASE_PRIVATE_KEY='-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n'
```

## 6. 本機建立 `.env.local`

以 [.env.example](/Users/hsuhsiang/Desktop/project/vibe-coding/online-courses/.env.example) 為基礎建立：

```bash
cp .env.example .env.local
```

再把所有 `replace-with-...` 改成實際值。

## 7. 驗證建置

```bash
npm run lint
npm run build
npm run cf:build
```

## 8. Firestore 舊資料搬移

若要保留舊資料，先確認本機 `.env.local` 已提供 Firebase 與 D1 所需值，再執行：

```bash
npm run db:migrate:firestore-to-d1
```

## 9. Cloudflare 本機預覽

```bash
npm run cf:preview
```

## 10. 正式部署

```bash
npm run cf:deploy
```

## 11. 部署後快速檢查

```bash
npx wrangler tail
```

可優先檢查：

- Google OAuth callback 是否成功
- `/api/checkout/ecpay` 是否能建立訂單
- `/api/payment/callback` 是否有驗簽失敗
- Gmail API 是否有寄信失敗
