## PRD v0.1.4 — 建置穩定與 Next.js 15 相容性修復

發布日期：2025-10-14  
版本：v0.1.4  
類型：Build & Compatibility Fix

---

### 🧱 本次更新重點
- 建置穩定化（無外網也可完成 build）：
  - 將生產建置由 Turbopack 改為 webpack（`package.json` 的 `build` 移除 `--turbopack`）。
  - 移除 `next/font/google` 在 `app/layout.tsx` 的 Google Fonts 依賴，改用系統字體，避免 build 期外網失敗。
  - 對需要即時讀取 Firestore 的頁面加入 `export const dynamic = "force-dynamic";`，避免預先產生成網路連線需求（如首頁、課程列表、課程詳情）。

- Next.js 15 參數相容性：
  - 將 `params` 與 `searchParams` 調整為 Promise 型別並以 `await` 解析（例如：`/courses/[id]`、`/purchase/[courseId]`、`/checkout/[courseId]/atm`、`/admin|instructor/courses/[courseId]/edit`、`/auth/error`）。

- 型別與程式穩定度：
  - 修正 `lib/admin-data.ts`、`lib/public-courses.ts`、`lib/learning.ts` 的過度嚴格 type predicate（改以一般 `filter(Boolean)` + 斷言），避免 TS 編譯錯誤。
  - `components/admin/CourseForm.tsx`：補齊 `syllabus[].preview` 與清洗後章節型別，移除不必要的顯式型別造成的推斷失敗。
  - `app/orders/page.tsx`：補上 `userOrders: Order[]` 明確型別。

---

### 🔧 主要修改檔案
- `package.json`：`build` 改用 `next build`（webpack）。
- `app/layout.tsx`、`app/globals.css`：移除 Google Fonts，改系統字體變數。
- `app/page.tsx`、`app/courses/page.tsx`、`app/courses/[id]/page.tsx`：加入 `dynamic = "force-dynamic"`。
- `app/**/[...]/page.tsx` 多處：`params` / `searchParams` Promise 型別相容。
- `lib/admin-data.ts`、`lib/public-courses.ts`、`lib/learning.ts`：filter 與排序鍊式重構、型別斷言調整。
- `components/admin/CourseForm.tsx`：表單型別補齊與清洗結果型別安全。

---

### ✅ 驗收建議
1. 於無外網環境執行 `npm run build` 可成功完成建置（不需抓字體或 Access Firestore）。
2. 造訪 `/`、`/courses`、`/courses/[id]`、`/purchase/[courseId]`、`/checkout/[courseId]/atm`，確認頁面能正確取得資料並渲染。
3. 後台與講師編輯頁（`/admin|/instructor/courses/[courseId]/edit`）能正常開啟與儲存。

---

### ⚠️ 相容性與後續
- 以 `force-dynamic` 確保建置時不會預先抓資料，但也喪失部分靜態最佳化；未來可導入 Edge Config/ISR 等策略平衡效能與相依性。
- 若要恢復 Turbopack，可於具權限環境再評估並移除對外網依賴（字體/Firestore）。

