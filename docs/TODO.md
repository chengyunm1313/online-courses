# 待辦清單：購買後學習體驗與講師上架工具優化

## 1. 數據結構與型別擴充
- [x] Firestore 課程文件新增 `modules` 結構（章節 + 課程清單）
- [x] `types/course.ts` 擴充 `CourseModule` / `CourseModuleItem` 型別並更新關聯處

## 2. 後台／講師課程編輯工具
- [x] `CourseForm` 表單加入章節與課程內容編輯 UI（可新增／刪除課程、設定影片網址與試看）
- [x] `/api/admin/courses` 建立／更新時寫入 `modules` 與同步 `syllabus`
- [x] 管理員／講師後台頁面改用新表單元件

## 3. 前台課程詳情頁改版
- [x] `app/courses/[id]/page.tsx` 改為使用 `modules` 顯示「目錄與試看」等區塊
- [x] 支援章節試看標記與影片嵌入

## 4. 學員「我的學習」頁面
- [x] `lib/learning.ts` 回傳課程 modules 與進度資訊
- [x] `app/learning/page.tsx` 顯示章節列表與播放連結（或導向課程詳情對應章節）

## 5. Demo / 同步腳本
- [x] `lib/public-courses.ts` 匯入 demo 資料時同時寫入 modules
- [x] 更新 seed / README 文件，說明 neuen modules 結構

## 6. 其他整合
- [ ] 折扣、購買、訂單流程確認仍可運作，新增章節資訊不影響
- [ ] 撰寫測試指引（手動檢查購買後能看到完整章節影片）
