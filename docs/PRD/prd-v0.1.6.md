# PRD v0.1.6 - Next.js Image 域名配置修復

**發布日期**: 2025-10-14
**版本**: v0.1.6
**類型**: Bug Fix

---

## 📋 更新摘要

本次更新修復了 Next.js Image 組件無法載入 Unsplash Plus 圖片的問題。透過在 `next.config.ts` 中新增 `plus.unsplash.com` 域名配置，確保課程縮圖能正常顯示。

---

## 🐛 Bug 修復

### 問題：Next.js Image 組件域名未配置

**錯誤訊息**:
```
Invalid src prop (https://plus.unsplash.com/premium_photo-...) on `next/image`,
hostname "plus.unsplash.com" is not configured under images in your `next.config.js`
```

**問題描述**:
- 課程縮圖使用 Unsplash Plus 的圖片 URL（`plus.unsplash.com`）
- Next.js 配置中只有 `images.unsplash.com`，缺少 `plus.unsplash.com`
- 導致圖片無法載入，顯示錯誤訊息

**受影響的元件**:
- 檔案: `components/courses/CourseCatalog.tsx` (第 295 行)
- 頁面: `/courses` - 課程列表頁
- 影響: 所有使用 Unsplash Plus 圖片的課程縮圖無法顯示

**根本原因**:
Next.js 15 的 Image 組件基於安全考量，要求所有外部圖片域名必須在 `next.config.ts` 的 `images.remotePatterns` 中明確配置。Unsplash 有多個圖片服務域名：
- `images.unsplash.com` - 免費圖片
- `plus.unsplash.com` - Unsplash+ 付費圖片
- `unsplash.com` - 主站

---

## 🔧 修復詳情

### 修改檔案: `next.config.ts`

**修改前** (第 11-15 行):
```typescript
{
  protocol: 'https',
  hostname: 'images.unsplash.com',
  pathname: '**',
},
```

**修改後** (第 11-20 行):
```typescript
{
  protocol: 'https',
  hostname: 'images.unsplash.com',
  pathname: '**',
},
{
  protocol: 'https',
  hostname: 'plus.unsplash.com',
  pathname: '**',
},
```

### 完整的圖片域名配置

修復後，系統現在支援以下圖片來源：

| 域名 | 用途 | 說明 |
|------|------|------|
| `lh3.googleusercontent.com` | Google 用戶頭像 | OAuth 登入後的用戶頭像 |
| `images.unsplash.com` | Unsplash 免費圖片 | 課程縮圖 |
| `plus.unsplash.com` | Unsplash+ 付費圖片 | 高品質課程縮圖 |
| `api.dicebear.com` | 頭像生成器 | 預設用戶頭像 |

---

## 📊 影響範圍

### 受影響的頁面

| 頁面 | 影響 | 修復後狀態 |
|------|------|-----------|
| `/courses` | 課程列表縮圖無法顯示 | ✅ 正常顯示 |
| `/` | 首頁推薦課程縮圖無法顯示 | ✅ 正常顯示 |
| `/courses/[id]` | 課程詳情頁縮圖無法顯示 | ✅ 正常顯示 |

### 受影響的組件

- `components/courses/CourseCatalog.tsx` - 課程列表組件
- `components/courses/CourseCard.tsx` - 課程卡片組件（如有）
- 所有使用 Next.js Image 組件載入課程縮圖的地方

---

## 🧪 測試建議

### 手動測試檢查清單

- [x] 瀏覽 `/courses` 頁面，確認所有課程縮圖正常顯示
- [x] 檢查瀏覽器控制台，確認無 Image 相關錯誤
- [x] 測試不同課程的縮圖載入
- [x] 確認 placeholder 圖片（`/placeholder-course.jpg`）仍然有效

### 瀏覽器測試

建議在以下瀏覽器測試：
- Chrome/Edge (Chromium)
- Firefox
- Safari

### 效能測試

Next.js Image 組件會自動優化圖片：
- ✅ 自動調整大小
- ✅ WebP 格式轉換（支援的瀏覽器）
- ✅ Lazy loading
- ✅ Blur placeholder（如有設定）

---

## 📝 技術細節

### Next.js Image 安全機制

Next.js 要求配置外部圖片域名的原因：

1. **安全性**: 防止任意外部圖片被載入，避免惡意圖片攻擊
2. **效能**: 只對信任的域名進行圖片優化處理
3. **隱私**: 防止圖片追蹤和隱私洩露

### remotePatterns 配置說明

```typescript
{
  protocol: 'https',    // 只允許 HTTPS
  hostname: 'plus.unsplash.com',  // 完整域名
  pathname: '**',       // 允許所有路徑 (** = 任意子路徑)
}
```

### 替代方案（不建議）

如果不想逐一配置域名，可以使用 `unoptimized` 選項：

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  images: {
    unoptimized: true,  // ⚠️ 不建議：會失去圖片優化功能
  },
};
```

但這樣會失去 Next.js Image 的所有優化功能，**不建議使用**。

---

## 🔍 相關問題排查

### 如果圖片還是無法顯示

1. **檢查開發伺服器是否重啟**
   ```bash
   # 強制重啟
   pkill -f "node.*next" && npm run dev
   ```

2. **檢查圖片 URL 格式**
   ```typescript
   // 確認 URL 是完整的 HTTPS URL
   console.log(course.thumbnail);
   // 應該是: https://plus.unsplash.com/...
   ```

3. **檢查瀏覽器快取**
   - 清除快取或使用無痕模式

4. **檢查網路連線**
   - 確認能正常存取 Unsplash

### 如果需要新增其他圖片域名

在 `next.config.ts` 中新增：

```typescript
{
  protocol: 'https',
  hostname: 'your-image-domain.com',
  pathname: '**',
}
```

---

## 📚 參考資料

### 官方文件
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Next.js Image Configuration](https://nextjs.org/docs/app/api-reference/components/image#remotepatterns)
- [Next.js Error: next-image-unconfigured-host](https://nextjs.org/docs/messages/next-image-unconfigured-host)

### Unsplash 相關
- [Unsplash API](https://unsplash.com/developers)
- [Unsplash 圖片 URL 格式](https://unsplash.com/documentation#example-image-use)

---

## 🎯 未來改進建議

### 圖片管理優化

1. **使用 CDN**
   - 考慮使用自己的 CDN（如 Cloudflare Images）
   - 減少對第三方服務的依賴

2. **圖片上傳功能**
   - 實作講師上傳課程縮圖功能
   - 儲存至 Firebase Storage
   - 更好的圖片管理和控制

3. **Placeholder 優化**
   - 使用 blur placeholder
   - 提升載入體驗

```typescript
// 範例：使用 blur placeholder
<Image
  src={course.thumbnail || "/placeholder-course.jpg"}
  alt={course.title}
  fill
  placeholder="blur"
  blurDataURL="/placeholder-blur.jpg"
/>
```

4. **圖片驗證**
   - 在後台上傳時驗證圖片 URL
   - 確保域名在允許清單中

---

## 📊 版本比較

### v0.1.5 → v0.1.6

| 項目 | v0.1.5 | v0.1.6 |
|------|--------|--------|
| Unsplash 圖片支援 | ❌ 僅 images.unsplash.com | ✅ 包含 plus.unsplash.com |
| 課程縮圖顯示 | ⚠️ 部分無法顯示 | ✅ 完全正常 |
| Image 錯誤 | ❌ 有錯誤訊息 | ✅ 無錯誤 |
| 配置的圖片域名數量 | 3 個 | 4 個 |

---

## ✅ 檢查清單

### 開發環境

- [x] `next.config.ts` 已更新
- [x] 開發伺服器已重啟
- [x] 課程列表頁圖片正常顯示
- [x] 瀏覽器控制台無錯誤

### 測試環境

- [ ] 部署到測試環境
- [ ] 確認圖片載入正常
- [ ] 檢查圖片優化是否生效
- [ ] 測試不同網路環境

### 生產環境（待部署）

- [ ] Vercel 環境變數檢查
- [ ] CDN 快取清除
- [ ] 生產環境測試
- [ ] 效能監控

---

## 💡 經驗教訓

### 為什麼會發生這個問題？

1. **Unsplash 有多個域名**: 不同等級的圖片使用不同子域名
2. **配置不完整**: 只配置了 `images.unsplash.com`，遺漏了 `plus.unsplash.com`
3. **測試覆蓋不足**: 沒有測試使用 Unsplash+ 圖片的課程

### 如何避免類似問題？

1. **完整的圖片域名清單**
   - 文件化所有可能的圖片來源
   - 在配置時一次加入所有域名

2. **錯誤監控**
   - 使用 Sentry 等工具監控生產環境錯誤
   - 及時發現 Image 相關錯誤

3. **完整測試**
   - 測試不同來源的圖片
   - 包含邊界情況（錯誤 URL、斷網等）

---

## 🔗 相關 Issue

如遇到類似問題，可參考：
- [Next.js GitHub Issues - Image Configuration](https://github.com/vercel/next.js/issues?q=is%3Aissue+remotePatterns)
- [Next.js Discussions - Image Optimization](https://github.com/vercel/next.js/discussions?discussions_q=image+optimization)

---

## 📞 後續支援

如果在部署或使用過程中遇到圖片載入問題：

1. **檢查錯誤訊息**: 確認是否為域名配置問題
2. **查看文件**: 參考 [Next.js Image 文件](https://nextjs.org/docs/app/api-reference/components/image)
3. **更新配置**: 按照本文件的方式新增域名

---

## 🎉 結論

本次更新是一個簡單但重要的修復：

**修復內容**: ✅ 新增 `plus.unsplash.com` 域名配置
**影響範圍**: 📸 所有使用 Unsplash+ 圖片的課程縮圖
**修復時間**: ⚡ 立即生效（重啟後）
**優先級**: 🔴 高（影響用戶體驗）

雖然只是一行配置的更新，但對用戶體驗有重要影響。所有課程縮圖現在都能正常顯示，不再有令人困擾的錯誤訊息。

---

**修復完成日期**: 2025-10-14
**測試狀態**: ✅ 通過
**部署狀態**: ⚠️ 待部署到生產環境
