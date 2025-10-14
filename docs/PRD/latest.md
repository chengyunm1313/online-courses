## 最新版本摘要（v0.1.6 / 2025-10-14）

### 本次重點
- **圖片載入修復**：新增 `plus.unsplash.com` 域名配置，修復 Unsplash+ 課程縮圖無法顯示的問題
- **用戶體驗改善**：所有課程列表頁和詳情頁的縮圖現在都能正常載入
- **配置完善**：完整支援 Unsplash 的所有圖片服務域名

### 修復的問題

| 問題 | 影響範圍 | 狀態 |
| --- | --- | --- |
| Next.js Image 域名未配置 | `/courses` 課程列表頁 | ✅ 已修復 |
| Unsplash+ 圖片無法載入 | 所有課程縮圖 | ✅ 已修復 |

### 支援的圖片域名

現在支援以下圖片來源：
- ✅ `lh3.googleusercontent.com` - Google 用戶頭像
- ✅ `images.unsplash.com` - Unsplash 免費圖片
- ✅ `plus.unsplash.com` - Unsplash+ 付費圖片 (新增)
- ✅ `api.dicebear.com` - 頭像生成器

### 相關文件
- 詳細說明：[`prd-v0.1.6.md`](./prd-v0.1.6.md)
- 上一版：[`prd-v0.1.5.md`](./prd-v0.1.5.md) - 全面資安審計
- 完整審計報告：[`/security-fixes.md`](../../security-fixes.md)
- 更早版本：[`prd-v0.1.4.md`](./prd-v0.1.4.md)、[`prd-v0.1.3.md`](./prd-v0.1.3.md)、[`prd-v0.1.2.md`](./prd-v0.1.2.md)、[`prd-v0.1.md`](./prd-v0.1.md)
