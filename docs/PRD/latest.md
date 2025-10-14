## 最新版本摘要（v0.1.2 / 2025-10-14）

### 本次重點
- **資料驗證修復**：解決 Firestore 無法接受 `undefined` 值的錯誤，修改課程資料正規化邏輯，將所有 `undefined` 改為空字串 `""`。
- **使用體驗優化**：
  - 章節描述與課程描述欄位改為多行 textarea，提升長文字編輯體驗。
  - 課程縮圖新增預留圖片機制，避免空字串導致的載入錯誤。
  - 網站標題與描述更新為繁體中文，提升 SEO 與本地化體驗。
- **Next.js 15 相容性**：修復訂單詳情頁面的 params 型別問題，確保動態路由正常運作。

### 修復的問題
| 問題 | 影響範圍 | 狀態 |
| --- | --- | --- |
| Firestore undefined 值錯誤 | `/admin/courses` 建立/編輯課程 | ✅ 已修復 |
| 訂單詳情頁 404 錯誤 | `/orders/[orderId]`, `/admin/orders/[orderId]` | ✅ 已修復 |
| 空白縮圖圖片錯誤 | `/courses` 課程列表 | ✅ 已修復 |

### 重要修改檔案
- `lib/admin-data.ts` - 修改資料正規化邏輯
- `components/admin/CourseForm.tsx` - 改善表單輸入體驗
- `app/layout.tsx` - 更新網站元資料
- `components/courses/CourseCatalog.tsx` - 新增縮圖預留機制
- `app/admin/orders/[orderId]/page.tsx` - 修復 params 型別
- `app/orders/[orderId]/page.tsx` - 修復 params 型別

> 詳細資訊請參考 [`prd-v0.1.2.md`](./prd-v0.1.2.md)。
> 若需查看舊版需求，可參考 [`prd-v0.1.md`](./prd-v0.1.md)。
