## 專案簡介

本專案為 Next.js App Router 打造的線上課程平台示範，提供課程瀏覽、講師後台、學員學習清單，以及完整的「折扣碼 ➜ 結帳 ➜ 金流回寫」購買流程。應用資料現已以 Cloudflare D1 為主，並預設建立 demo 講師 **skypassion5000@gmail.com** 與 demo 管理員 **chengyunm1313@gmail.com**，方便實測報名與後台管理。

## 目前架構重點

- Google 登入：使用 Firebase / Google OAuth，僅處理身分驗證
- 應用資料庫：改為 Cloudflare D1，負責 `users`、`courses`、`orders`、`enrollments`、`order_events`
- 通知寄信：由 Cloudflare 端直接呼叫 Gmail API
- 金流：ECPay callback / result 都會驗證簽章，並比對 `TradeAmt` 與資料庫訂單金額
- 權限來源：只看 D1 `users.role`，不再使用硬編碼 email 升權

## 本次更新重點

- D1 課程資料支援 `modules`（章節 + 課程清單），並會同步輸出 `syllabus` 給舊畫面使用
- 後台 `CourseForm` 支援章節與課程內容編輯：可設定排序、影片網址與免費試看，並自動換算課程總堂數與時數
- 課程詳情頁 `/courses/[id]` 以章節呈現目錄與試看影片，並提供正式課程提示與錨點，方便從學習頁跳轉
- 學員「我的學習」頁 `/learning` 顯示章節完成狀態、下一堂課提醒與前往章節的連結
- Demo 匯入腳本與 README 已更新，啟動時會把章節資料寫入 D1，減少手動維護成本

## 開發環境

| 項目 | 版本 |
| --- | --- |
| Node.js | 18+ |
| Next.js | 15.5.x (App Router) |
| UI 套件 | Tailwind CSS |
| 驗證 | NextAuth (Google OAuth) |
| 後端儲存 | Cloudflare D1 |

```bash
npm install
npm run dev
# 伺服器預設在 http://localhost:3000
```

### Cloudflare 預覽與部署

```bash
npm run cf:build
npm run cf:preview
npm run cf:deploy
```

### 環境變數

- 請以 [.env.example](.env.example) 建立本機 `.env.local`
- 正式部署時請改用 Cloudflare secrets / vars 管理，不要提交實際密鑰

### D1 資料庫初始化

1. 將 [db/schema.sql](db/schema.sql) 套用到 Cloudflare D1
2. 若要搬移舊 Firestore 資料，執行：

```bash
npm run db:migrate:firestore-to-d1
```

### Cloudflare 佈署骨架

- 已提供 [wrangler.toml](wrangler.toml) 作為 D1 / Worker 綁定範本
- `database_id`、`APP_BASE_URL` 與所有 secrets 需依實際環境填入
- 正式上線前請逐項檢查 [docs/release-checklist-cloudflare.md](docs/release-checklist-cloudflare.md)

## 主要路由功能

| 路徑 | 權限 | 說明 |
| --- | --- | --- |
| `/` | 公開 | 首頁，展示精選課程，資料來自 D1。 |
| `/courses` | 公開 | 課程列表，可依分類、難度、價格、關鍵字與排序（熱門、最新、價格）搜尋。 |
| `/courses/[id]` | 公開 | 課程詳情頁，章節若含影片網址會自動嵌入，按「立即購買」進入購買流程。 |
| `/purchase/[courseId]` | 登入學員 | 購買頁，可輸入折扣碼試算金額，確認後進入綠界結帳頁。 |
| `/checkout/ecpay` | 登入學員 | 綠界金流結帳頁，選擇支付方式（信用卡或 ATM），並輸入選配的訂單備註。 |
| `/order/[id]/result` | 登入學員 | 訂單確認頁，顯示支付結果、訂單摘要與相應的支付資訊。 |
| `/learning` | 登入學員 | 實際讀取 D1，顯示學員已購課程與進度。 |
| `/admin` | 管理員 | 後台儀表板，含課程列表、講師統計、帳號權限管理。 |
| `/admin/courses` | 管理員 | 課程 CRUD，預設講師下拉會帶入 demo 講師（skypassion5000@gmail.com）。 |
| `/instructor/courses` | 講師 | 講師專屬課程管理（限講師角色）。 |

## 購買流程說明（綠界金流）

1. 學員登入後，在課程詳情按「立即購買」
2. 前往 `/purchase/[courseId]`：
   - 可輸入折扣碼 ➜ 點「套用折扣碼」即時試算
   - 顯示折抵後的應付金額
   - 確認無誤後按「前往結帳」，購物車資料會存入 sessionStorage
3. 系統重定向至 `/checkout/ecpay`（綠界結帳頁）：
   - 訂單摘要：顯示課程名稱、價格、折扣
   - **配送方式**：選擇「宅配」或「超商取貨」
   - **支付方式**：
     - **信用卡**：立即支付，點確認後會自動提交表單至綠界支付頁
     - **ATM 轉帳**：顯示銀行帳戶資訊與轉帳金額，待銀行驗證後自動確認
   - **訂單備註**（選填）：輸入特殊要求或備註
4. 支付完成後重定向至 `/order/[id]/result`：
   - 顯示訂單狀態（已支付、待驗證、已取消）
   - **信用卡支付結果**：卡號末 4 碼、驗證碼、支付時間
   - **ATM 轉帳資訊**：銀行代碼、帳號、轉帳金額、參考代號
   - 訂單摘要與後續學習步驟提示

### 內建折扣碼

折扣碼邏輯集中在 `lib/checkout.ts`，同時被購買頁 API `/api/checkout/discount` 與前端共用。預設提供以下範例：

| 折扣碼 | 類型 | 折扣 | 說明 |
| --- | --- | --- | --- |
| `WELCOME10` | 百分比 | 9 折 | 新會員優惠 |
| `STUDENT200` | 金額 | -NT$200 | 學生折扣 |
| `VIP500` | 金額 | -NT$500 | VIP 專屬 |

> **注意**：若要新增或修改折扣碼，只需更新 `lib/checkout.ts` 即可。

## Demo 課程與資料同步

- 首次啟動時，`lib/d1-repository.ts` 會確保 demo 課程寫入 D1，並自動建立 demo 講師與 demo 管理員帳號
- 課程章節、標籤、學生人數等欄位也會一併帶入，方便測試報名功能
- 每門課程會儲存 `modules`（章節 + 課程清單）與 `syllabus`（扁平章節）兩種結構，後台表單會依章節內容自動同步，確保前台與舊版元件皆可使用
- 匯入 demo 課程時會依章節時數自動換算課程總時數與堂數，避免手動維護錯誤
- 後台顯示的所有課程資訊都來自 D1，請勿手動刪除 demo 講師帳號

## 課程資料結構

D1 中 `courses`、`course_modules`、`course_lessons` 會共同保存章節與課程清單，下方為聚合後的主要欄位示意：

```json
{
  "modules": [
    {
      "id": "module-1",
      "title": "章節標題",
      "order": 1,
      "description": "章節摘要（可省略）",
      "lessons": [
        {
          "id": "lesson-1",
          "title": "課程名稱",
          "order": 1,
          "description": "課程介紹",
          "duration": 12,
          "videoUrl": "https://www.youtube.com/watch?v=...",
          "preview": true
        }
      ]
    }
  ],
  "syllabus": [
    {
      "id": "lesson-1",
      "title": "課程名稱",
      "order": 1,
      "description": "課程介紹",
      "duration": 12,
      "videoUrl": "https://www.youtube.com/watch?v=...",
      "preview": true
    }
  ]
}
```

- 管理後台（`/admin/courses`、`/instructor/courses`）的「章節與課程內容編輯器」會維護 `modules`，並自動生成 `syllabus` 供舊版元件使用
- 前台課程詳情頁（`/courses/[id]`）與學員學習頁（`/learning`）皆使用 `modules` 來渲染章節、試看影片與學習進度

## 角色與登入測試建議

| 帳號 | 用途 |
| --- | --- |
| `skypassion5000@gmail.com` | Demo 講師（預設課程建立者） |
| `chengyunm1313@gmail.com` | 預設管理員，可存取 `/admin` |

> 認證使用 Google OAuth，測試前請在 `.env.local` 填入對應的 OAuth Client ID/Secret。

## 相關 API 與檔案位置

| 功能 | 檔案 |
| --- | --- |
| 折扣碼計算 | `lib/checkout.ts` / `app/api/checkout/discount/route.ts` |
| 購買頁前端 | `components/checkout/PurchaseClient.tsx` |
| ATM 結帳頁 | `components/checkout/CheckoutATM.tsx` + `app/checkout/[courseId]/atm/page.tsx` |
| 課程資料同步 | `lib/public-courses.ts` |
| 報名寫入 | `app/api/enrollments/route.ts` |

## 綠界金流測試資訊

### 環境設定

在 `.env.local` 中加入以下綠界測試環境變數：

```bash
# ECPay 測試環境設定
ECPAY_MERCHANT_ID=2000132
ECPAY_HASH_KEY=5294y06JbISpM5x9
ECPAY_HASH_IV=v77hoKGq4kWxNNIS
ECPAY_CASHIER_URL=https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5
APP_BASE_URL=http://localhost:3000
```

> **注意**：上線前請更新為正式環境的商家 ID 與密鑰。詳見 [ECPay 環境變數配置指南](docs/env-ecpay-example.md)。

### 測試信用卡

| 卡號 | 有效期 | CVV | 結果 |
| --- | --- | --- | --- |
| `4311-9522-2222-2222` | 任意未來日期 | 任意 3 位數 | ✓ 支付成功 |
| 其他卡號 | - | - | ✗ 支付失敗 |

### OTP 驗證

系統提示輸入 OTP 或驗證碼時，輸入**任意 4 位數字**即可通過。

### API 端點

| 端點 | 方法 | 說明 |
| --- | --- | --- |
| `/api/checkout/ecpay` | POST | 建立訂單並返回綠界支付表單或 ATM 重定向 URL |
| `/api/payment/callback` | POST | 綠界伺服器端通知，驗證簽章並更新訂單狀態 |
| `/api/payment/result` | POST | 瀏覽器端支付結果回傳，作為 callback 的備用機制 |
| `/api/orders/[id]` | GET | 取得單筆訂單詳情（需要登入） |

### 常見測試情境

1. **信用卡支付成功**：
   - 使用測試卡號 `4311-9522-2222-2222`
   - 輸入任意未來日期與 CVV
   - 提示 OTP 時輸入任意 4 位數字
   - 確認後應顯示支付成功訊息

2. **ATM 轉帳流程**：
   - 選擇「ATM 轉帳」支付方式
   - 查看銀行帳戶與轉帳金額資訊
   - 伺服器會監聽銀行驗證事件並自動更新訂單狀態
   - 測試環境中，訂單會在支付完成後立即更新為「已支付」

3. **支付驗證失敗**：
   - 使用非測試卡號會導致支付失敗
   - 頁面應顯示錯誤訊息與訂單詳情

### 故障排除

詳見 [ECPay 結帳故障排除指南](docs/CHECKOUT_TROUBLESHOOTING.md)，涵蓋常見錯誤與解決方案。

---

## 開發注意事項

- 所有應用資料讀寫皆透過 Cloudflare D1；Firebase 僅保留 Google 登入與舊資料遷移用途
- 綠界金流已完整整合，包含簽章驗證、支付狀態同步與訂單管理
- 課程同步與折扣碼為 demo 範例，正式上線請改為實際後端邏輯
- 所有敏感資訊（ECPAY_HASH_KEY、ECPAY_HASH_IV 等）請存入環境變數，勿提交至版本控制

## 手動測試建議

### 完整購買流程測試

1. **以學員身分登入**，進入任一課程詳情頁
2. **點擊「立即購買」**，前往購買頁面
3. **套用折扣碼**（選填）：
   - 輸入 `WELCOME10`（9 折）或其他有效折扣碼
   - 驗證折扣金額正確計算
4. **進入綠界結帳頁**（`/checkout/ecpay`）：
   - 確認訂單摘要顯示正確
   - 選擇配送方式（宅配或超商）
   - **選擇支付方式**：
     - **信用卡**：使用測試卡號 `4311-9522-2222-2222` 完成支付
     - **ATM 轉帳**：查看銀行轉帳資訊
5. **驗證訂單確認頁**（`/order/[id]/result`）：
   - 確認訂單狀態為「已支付」
   - 檢查支付資訊正確顯示
   - 確認 D1 `orders` / `order_items` 資料已建立
6. **回到「我的學習」頁面** (`/learning`)：
   - 檢查新購課程是否出現在清單
   - 驗證課程進度與章節資訊

### API 測試

使用 REST 客戶端（如 Postman）測試以下端點：

```bash
# 1. 建立訂單（需要 JWT token）
POST /api/checkout/ecpay
Content-Type: application/json

{
  "items": [
    {
      "courseId": "course-1",
      "courseTitle": "React 完整開發指南",
      "courseThumbnail": "https://images.unsplash.com/...",
      "price": 2990,
      "instructor": "講師名稱"
    }
  ],
  "paymentMethod": "CREDIT",
  "shippingMethod": "HOME",
  "subtotal": 2990,
  "tax": 0,
  "total": 2990,
  "notes": "選填備註"
}

# 2. 查詢訂單詳情
GET /api/orders/[orderId]
Authorization: Bearer [JWT Token]
```

### 常見測試案例

| 測試項目 | 預期結果 |
| --- | --- |
| 未登入時點「立即購買」 | 重定向至登入頁 |
| 套用無效折扣碼 | 顯示錯誤訊息，金額不變 |
| 信用卡支付成功 | 訂單狀態更新為「已支付」 |
| ATM 轉帳未驗證 | 訂單狀態為「待驗證」，顯示轉帳資訊 |
| 訂單簽章驗證失敗 | API 返回錯誤，訂單未建立 |
| 無訂單備註 | 訂單正常建立，備註欄位為空 |

---

本專案已整合綠界金流完整生態，包括支付表單、簽章驗證、回調處理與訂單管理。歡迎依需求調整或擴充功能。祝開發順利！
