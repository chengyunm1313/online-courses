## PRD v0.1.3 — 學習體驗與可用性提升

發布日期：2025-10-14  
版本：v0.1.3  
類型：Feature & UX Enhancement

---

### 🆕 本次更新重點
- 學習體驗強化：
  - 課程詳情頁（`/courses/[id]`）改以 `modules` 章節呈現，並依是否已購買切換 CTA（已購顯示「開始學習」）。
  - 已購學員可直接播放所有章節；章節徽章顯示「已完成 / 下一堂課 / 已解鎖 / 免費試看」。
  - 進入課程時自動更新 `enrollments.lastAccessed`，利於學習排序與追蹤。
- 我的學習（`/learning`）升級：
  - 顯示章節列表、已完成統計、下一堂課提示，並提供「前往章節」連結至課程詳情對應錨點。
- 首頁可用性：
  - Hero 區塊新增紅色警示 Banner：「vibe coding Demo｜此為練習作品，非真實網站與服務」。
- 可及性（A11y）：
  - 課程清單搜尋輸入與排序下拉調整文字與 placeholder 對比（`text-gray-900` / `placeholder:text-gray-600`）。

---

### 🔧 技術與資料結構
- `types/course.ts`：擴充 `CourseModule` / `CourseModuleItem`，加入 `order`、`preview`、`duration` 等欄位，`modules` 成為主要資料來源。
- `lib/admin-data.ts` / API：建立、更新課程時，同步寫入 `modules` 與展平 `syllabus`，自動換算總時數與堂數。
- `lib/public-courses.ts`：demo 匯入與補種時，一併寫入 `modules`，並以章節長度回推 `duration` / `lessons`。
- `lib/learning.ts`：回傳學員用的 `modules`、完成統計與 `nextLessonId`。
- `app/courses/[id]`：依是否已購買控制章節可播放與 CTA，並提供章節錨點 `#lesson-{id}`。

---

### 📄 文件與指引
- README：新增 Firestore `modules` 結構與手動測試建議。
- PRD：`index.md` 與 `latest.md` 同步目前平台狀態。

---

### ✅ 驗收建議
1. 以已購帳號進入 `/learning` ➜ 點「前往章節」是否跳至 `/courses/[id]#lesson-...`。  
2. 在課程詳情頁確認：
   - 已購會員 CTA 顯示「開始學習」。
   - 非試看章節仍可播放（已購），未提供影片顯示提示文案。
   - 章節徽章（已完成 / 下一堂課 / 已解鎖 / 免費試看）是否正確呈現。
3. 回到 `/learning` 檢視「最後學習」是否更新。

