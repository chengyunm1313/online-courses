## 專案簡介

本專案為 Next.js 17（App Router + Turbopack）打造的線上課程平台示範，提供課程瀏覽、講師後台、學員學習清單，以及完整的「折扣碼 ➜ 結帳 ➜ ATM 匯款」購買流程。所有 demo 課程會自動同步到 Firestore，並預設綁定講師 **skypassion5000@gmail.com**，方便實測報名與後台管理。

## 本次更新重點

- Firestore 課程文件新增 `modules`（章節 + 課程清單），與既有 `syllabus` 自動同步，確保前台、後台與舊元件都能使用
- 後台 `CourseForm` 支援章節與課程內容編輯：可設定排序、影片網址與免費試看，並自動換算課程總堂數與時數
- 課程詳情頁 `/courses/[id]` 以章節呈現目錄與試看影片，並提供正式課程提示與錨點，方便從學習頁跳轉
- 學員「我的學習」頁 `/learning` 顯示章節完成狀態、下一堂課提醒與前往章節的連結
- Demo 匯入腳本與 README 已更新，啟動時會把章節資料寫入 Firestore，減少手動維護成本

## 開發環境

| 項目 | 版本 |
| --- | --- |
| Node.js | 18+ |
| Next.js | 17 (App Router) |
| UI 套件 | Tailwind CSS |
| 驗證 | NextAuth (Google OAuth) |
| 後端儲存 | Firebase Firestore（Admin SDK） |

```bash
npm install
npm run dev
# 伺服器預設在 http://localhost:3000
```

## 主要路由功能

| 路徑 | 權限 | 說明 |
| --- | --- | --- |
| `/` | 公開 | 首頁，展示精選課程，資料來自 Firestore，同步 demo 課程時會自動匯入。 |
| `/courses` | 公開 | 課程列表，可依分類、難度、價格、關鍵字與排序（熱門、最新、價格）搜尋。 |
| `/courses/[id]` | 公開 | 課程詳情頁，章節若含影片網址會自動嵌入，按「立即購買」進入購買流程。 |
| `/purchase/[courseId]` | 登入學員 | 購買頁，可輸入折扣碼試算金額，確認後進入 ATM 結帳頁。 |
| `/checkout/[courseId]/atm` | 登入學員 | 顯示假 ATM 匯款資訊，點「完成匯款並完成購買」即寫入 Firestore `enrollments`。 |
| `/learning` | 登入學員 | 實際讀取 Firestore，顯示學員已購課程與進度。 |
| `/admin` | 管理員 | 後台儀表板，含課程列表、講師統計、帳號權限管理。 |
| `/admin/courses` | 管理員 | 課程 CRUD，預設講師下拉會帶入 demo 講師（skypassion5000@gmail.com）。 |
| `/instructor/courses` | 講師 | 講師專屬課程管理（限講師角色）。 |

## 購買流程說明

1. 學員登入後，在課程詳情按「立即購買」
2. 前往 `/purchase/[courseId]`：
   - 可輸入折扣碼 ➜ 點「套用折扣碼」即時試算
   - 顯示折抵後的應付金額
   - 確認無誤後按「前往結帳」
3. 系統帶 query 參數 redirect 到 `/checkout/[courseId]/atm`
   - 顯示假銀行資料供匯款：
     - 銀行：**範例銀行**（代碼 999）
     - 帳戶：**線上學院股份有限公司**（1234567890123）
   - 完成匯款後按「完成匯款並完成購買」，會呼叫 `/api/enrollments` 寫入 Firestore，並自動導回 `/learning`

### 內建折扣碼

折扣碼邏輯集中在 `lib/checkout.ts`，同時被購買頁 API `/api/checkout/discount` 與前端共用。預設提供以下範例：

| 折扣碼 | 類型 | 折扣 | 說明 |
| --- | --- | --- | --- |
| `WELCOME10` | 百分比 | 9 折 | 新會員優惠 |
| `STUDENT200` | 金額 | -NT$200 | 學生折扣 |
| `VIP500` | 金額 | -NT$500 | VIP 專屬 |

> **注意**：若要新增或修改折扣碼，只需更新 `lib/checkout.ts` 即可。

## Demo 課程與資料同步

- 首次啟動時，`lib/public-courses.ts` 會確保 demo 課程寫入 Firestore（集合：`courses`），並自動建立講師帳號 `skypassion5000@gmail.com`
- 課程章節、標籤、學生人數等欄位也會一併帶入，方便測試報名功能
- 每門課程會儲存 `modules`（章節 + 課程清單）與 `syllabus`（扁平章節）兩種結構，後台表單會依章節內容自動同步，確保前台與舊版元件皆可使用
- 匯入 demo 課程時會依章節時數自動換算課程總時數與堂數，避免手動維護錯誤
- 後台顯示的所有課程資訊都來自 Firestore，請勿手動刪除 demo 講師帳號

## Firestore 課程資料結構

`courses/{courseId}` 文件會同步保存章節與課程清單，下方為主要欄位示意：

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
| `skypassion5000@gmail.com` | Demo 講師（預設就是為他建立課程） |
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

## 開發注意事項

- 所有資料讀寫皆透過 Firebase Admin SDK（請確認環境變數 `FIREBASE_*` 設定完整）
- 課程同步與折扣碼為 demo 範例，正式上線請改為實際後端邏輯
- ATM 轉帳資訊僅為假資料，與 `CheckoutATM` 介面配合展示

## 手動測試建議

1. 以學員身分登入，挑選任一課程依購買流程完成匯款，確認訂單寫入 `enrollments`
2. 回到 `/learning` 檢查是否能看到章節列表、進度與「下一堂課」提示
3. 點擊章節中的「前往章節」連結，確認會帶到課程詳情的對應段落
4. 在 `/courses/[id]` 確認章節折疊面板可播放試看影片，並顯示正式課程需購買後觀看的提示

歡迎依需求調整或擴充功能，若需進一步整合真實金流（如綠界、藍新、Stripe），建議另建實際付款 API 與 webhook。祝開發順利！
