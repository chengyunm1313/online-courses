# PRD v0.1.5 - 全面資安審計與文字對比優化

**發布日期**: 2025-10-14
**版本**: v0.1.5
**類型**: Security Audit & UX Enhancement

---

## 📋 更新摘要

本次更新完成了專案的全面資安審計，產出詳細的安全審計報告，涵蓋新手常見錯誤、OWASP Top 10 檢查、以及具體的修復建議。同時優化了搜尋框的文字對比度，提升無障礙體驗。

---

## 🔒 資安審計重點

### 審計範圍
- **技術棧分析**: Next.js 15.5.4, NextAuth v4, Firebase Admin SDK, Firestore
- **安全性檢查**: 新手常見錯誤、OWASP Top 10、API 權限控制、輸入驗證
- **檔案範圍**: 所有 API 路由、認證邏輯、資料庫操作、環境變數管理

### 發現的主要威脅

#### 🔴 高風險（需立即修復）

**1. 硬編碼的管理員權限控制**
- **檔案**: `lib/auth.ts` (第 12-15 行)
- **問題**: 講師和管理員 Email 硬編碼在程式碼中
- **風險**: 任何有權限查看程式碼的人都知道管理員帳號
- **影響**: 權限提升攻擊、內部人員威脅、社交工程攻擊
- **建議**: 改為資料庫查詢，實作審計日誌

**2. 環境變數洩露風險**
- **檔案**: `.env.local`
- **問題**: 包含 Firebase 私鑰、Google OAuth Secret
- **風險**: 如果洩露到 Git history，攻擊者可完全控制資料庫
- **影響**: 資料外洩、帳號被盜、服務癱瘓
- **建議**: 檢查 Git history、輪換 credentials、使用 Secret 管理服務

**3. 缺少 Rate Limiting**
- **檔案**: 所有 API 路由
- **問題**: 無限制的 API 請求
- **風險**: 暴力破解、DoS 攻擊、成本激增
- **影響**: 折扣碼被破解、伺服器過載、Firebase 費用暴增
- **建議**: 實作 Upstash Rate Limiting

#### 🟡 中風險（兩週內修復）

**4. 輸入驗證不足**
- **檔案**: `app/api/admin/courses/route.ts`, `app/api/enrollments/route.ts`
- **問題**: 缺少嚴格的輸入驗證
- **建議**: 使用 Zod 驗證庫

**5. 錯誤訊息洩露敏感資訊**
- **檔案**: 多個 API 路由的 catch 區塊
- **問題**: 直接返回 `error.message` 給前端
- **建議**: 實作統一的錯誤處理機制

**6. Console.log 洩露**
- **檔案**: 42 處 console.error 和 console.log
- **問題**: 可能在生產環境洩露敏感資訊
- **建議**: 實作 Logger 系統

**7. 缺少 CSRF 保護**
- **問題**: 自定義 API 路由沒有額外的 CSRF 檢查
- **建議**: 實作 Middleware

**8. Session 管理不安全**
- **檔案**: `lib/auth.ts`
- **問題**: maxAge 設定為 30 天，時間過長
- **建議**: 改為 7 天，實作重新驗證機制

---

## 📊 OWASP Top 10 檢查結果

| 項目 | 狀態 | 說明 |
|------|------|------|
| A01: 權限控制失效 | ⚠️ 需改進 | 硬編碼權限邏輯需改為資料庫 |
| A02: 加密機制失效 | ✅ 良好 | NextAuth 加密、Firebase TLS |
| A03: 注入式攻擊 | ✅ 風險較低 | Firestore 不易受注入，但需加強驗證 |
| A04: 不安全的設計 | ⚠️ 需改進 | 缺少 Rate Limiting、帳號鎖定 |
| A05: 安全設定錯誤 | ⚠️ 需改進 | 缺少 Security Headers |
| A06: 危險元件 | ✅ 良好 | 無已知漏洞 |
| A07: 身份驗證失效 | ⚠️ 需改進 | Session 時間過長 |
| A08: 資料完整性失效 | ✅ 良好 | package-lock.json 已提交 |
| A09: 監控失效 | ⚠️ 需改進 | 缺少審計日誌 |
| A10: SSRF | ✅ 風險較低 | 無用戶可控制的 URL 請求 |

---

## ✨ UX 改進

### 搜尋框文字對比優化

**修改檔案**: `components/courses/CourseCatalog.tsx` (第 174 行)

**修改內容**:
```typescript
// 修改前
className="... placeholder:text-gray-600 ..."

// 修改後
className="... placeholder:text-gray-500 ..."
```

**改進說明**:
- 提升 placeholder 文字對比度
- 符合 WCAG AA 無障礙標準
- 提升視覺清晰度

---

## 📄 新增文件

### security-fixes.md

建立於專案根目錄的完整資安審計報告，包含：

**第一部分：新手常見的災難性錯誤檢查**
- 硬編碼的管理員權限
- .env.local 檔案洩露風險
- API Rate Limiting 缺失

**第二部分：標準應用程式安全審計**
- 輸入驗證
- 錯誤訊息處理
- Console.log 管理
- CSRF 保護
- Session 管理

**第三部分：OWASP Top 10 檢查**
- 逐項檢查結果
- 具體修復建議

**特色內容**:
- 🎭 **駭客攻擊劇本**: 用第一人稱故事方式解釋攻擊手法
- 🔧 **修復原理**: 用簡單比喻解釋為何修復方法有效
- 💻 **完整程式碼範例**: 修正前/後對比
- 📅 **修復優先順序**: 分三階段的詳細時程

---

## 🔧 修復建議總覽

### 第一階段（立即執行）- 2-3 天

**Day 1:**
1. 檢查 Git history 是否有 `.env.local` 洩露
2. 如有洩露，立即輪換所有 credentials
3. 實作 Rate Limiting（使用 Upstash）

**Day 2:**
4. 移除硬編碼的 Email 清單
5. 修改 session callback 改為查詢資料庫
6. 建立初始管理員腳本

**Day 3:**
7. 安裝 Zod 並建立驗證 schemas
8. 更新重要的 API 路由（enrollments, courses, users）

### 第二階段（兩週內）- 5-7 天

**Week 1:**
- 實作統一的錯誤處理機制
- 建立 Logger 系統
- 更新所有 API 路由使用新的錯誤處理

**Week 2:**
- 實作 CSRF Middleware
- 調整 Session 設定（maxAge, updateAge）
- 實作基本的審計日誌

### 第三階段（一個月內）- 7-10 天

**Week 3:**
- 新增 Security Headers（CSP、HSTS 等）
- 實作帳號鎖定機制
- 完善審計日誌系統

**Week 4:**
- 整合錯誤追蹤服務（Sentry）
- 實作監控和警報
- 安全性測試和滲透測試

---

## 📚 技術細節

### 建議使用的工具與套件

**安全相關**:
- `@upstash/ratelimit` - Rate Limiting
- `@upstash/redis` - Redis 儲存
- `zod` - 輸入驗證
- `@sentry/nextjs` - 錯誤追蹤
- `git-secrets` - Git commit 掃描
- `husky` - Git hooks
- `snyk` - 依賴漏洞掃描

**開發流程**:
- `lint-staged` - Pre-commit 檢查
- `prettier` - 程式碼格式化
- `eslint` - 程式碼品質檢查

### 環境變數管理

**開發環境**:
```bash
# .env.local (不提交到 Git)
FIREBASE_PROJECT_ID=xxx
FIREBASE_PRIVATE_KEY=xxx
GOOGLE_CLIENT_SECRET=xxx
```

**生產環境**:
```bash
# 使用 Vercel Environment Variables
vercel env add FIREBASE_PROJECT_ID
vercel env add FIREBASE_PRIVATE_KEY
vercel env add GOOGLE_CLIENT_SECRET
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN
```

---

## 🎯 修復優先級評分

### 關鍵性（Critical）- 立即修復
- 🔴 硬編碼的管理員權限控制
- 🔴 環境變數洩露風險檢查
- 🔴 缺少 Rate Limiting

### 高優先級（High）- 兩週內
- 🟡 輸入驗證不足
- 🟡 錯誤訊息洩露
- 🟡 Console.log 洩露

### 中優先級（Medium）- 一個月內
- 🟡 缺少 CSRF 保護
- 🟡 Session 管理優化
- 🟡 缺少 Security Headers
- 🟡 缺少審計日誌

### 低優先級（Low）- 持續改進
- 🟢 實作 2FA
- 🟢 整合 Sentry
- 🟢 實作進階監控
- 🟢 定期安全掃描

---

## 📈 影響範圍

### 受影響的模組

**認證系統**:
- `lib/auth.ts` - 需要重構權限邏輯
- `app/api/auth/[...nextauth]/route.ts` - Session 管理

**API 路由**:
- `app/api/enrollments/route.ts` - 需要 Rate Limiting 和輸入驗證
- `app/api/admin/**` - 需要更嚴格的權限檢查
- `app/api/checkout/discount/route.ts` - 需要 Rate Limiting

**資料庫操作**:
- `lib/admin-data.ts` - 需要加入審計日誌
- `lib/orders.ts` - 需要加入輸入驗證

**前端組件**:
- `components/courses/CourseCatalog.tsx` - 文字對比已優化

---

## 🧪 測試建議

### 安全性測試

**手動測試**:
1. 嘗試存取未授權的 API 端點
2. 測試 Rate Limiting 是否生效
3. 檢查錯誤訊息是否洩露敏感資訊
4. 驗證輸入驗證是否正確運作

**自動化測試**:
```bash
# 依賴漏洞掃描
npm audit
snyk test

# Git secrets 掃描
git secrets --scan

# OWASP ZAP 掃描
zap-cli quick-scan http://localhost:3000
```

### 效能測試

**Rate Limiting 測試**:
```bash
# 使用 Apache Bench 測試
ab -n 100 -c 10 http://localhost:3000/api/checkout/discount

# 預期結果：超過限制後返回 429 Too Many Requests
```

---

## 📝 檢查清單

### 上線前必須完成

- [ ] 檢查 Git history 無 `.env.local` 洩露
- [ ] 所有 credentials 已輪換
- [ ] Rate Limiting 已實作並測試
- [ ] 硬編碼權限已改為資料庫查詢
- [ ] 輸入驗證已加入關鍵 API
- [ ] 錯誤處理已統一
- [ ] Console.log 已清理或條件化
- [ ] Security Headers 已加入

### 建議完成

- [ ] CSRF Middleware 已實作
- [ ] Session maxAge 已調整為 7 天
- [ ] 審計日誌已實作
- [ ] 帳號鎖定機制已實作
- [ ] Sentry 已整合
- [ ] 監控和警報已設定

---

## 🔗 相關資源

### 官方文件
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [NextAuth.js Security](https://next-auth.js.org/configuration/options#security)

### 工具與服務
- [Upstash](https://upstash.com/) - Rate Limiting
- [Sentry](https://sentry.io/) - 錯誤追蹤
- [Snyk](https://snyk.io/) - 依賴掃描
- [Vercel](https://vercel.com/docs/security) - 部署安全

---

## 📊 版本比較

### v0.1.4 → v0.1.5

| 項目 | v0.1.4 | v0.1.5 |
|------|--------|--------|
| 資安審計 | ❌ 無 | ✅ 完整報告 |
| 威脅識別 | ❌ 未知 | ✅ 8 個主要威脅 |
| 修復建議 | ❌ 無 | ✅ 詳細指南 |
| OWASP 檢查 | ❌ 未執行 | ✅ Top 10 完成 |
| 文字對比 | ⚠️ 部分不足 | ✅ 符合 WCAG AA |
| 安全評分 | ❓ 未知 | 📊 6.5/10 |

---

## 🎓 學習重點

### 新手開發者最常犯的錯誤

1. **把 secrets 提交到 Git** - 最致命的錯誤
2. **硬編碼權限控制** - 難以維護且不安全
3. **沒有 Rate Limiting** - 容易被攻擊
4. **輸入未驗證** - 資料完整性問題
5. **錯誤訊息洩露** - 給攻擊者提供線索

### 安全開發的核心原則

1. **最小權限原則** - 只給必要的權限
2. **縱深防禦** - 多層安全措施
3. **輸入驗證** - 永遠不信任用戶輸入
4. **錯誤處理** - 不洩露敏感資訊
5. **持續監控** - 及時發現異常

---

## 💡 後續建議

### 短期（1-2 週）
1. 優先修復所有 🔴 高風險項目
2. 實作基本的 Rate Limiting
3. 改善輸入驗證

### 中期（1-2 個月）
1. 完成所有 🟡 中風險項目修復
2. 建立完整的審計日誌系統
3. 整合錯誤追蹤服務

### 長期（3-6 個月）
1. 實作進階安全功能（2FA、SSO）
2. 建立自動化安全測試流程
3. 定期進行滲透測試

---

## 📞 支援與回饋

如果在實作修復建議時遇到問題：

1. **查看完整報告**: `/security-fixes.md`
2. **參考程式碼範例**: 報告中包含完整的修正前/後對比
3. **查詢官方文件**: 每個建議都附有相關連結
4. **社群支援**: OWASP Slack、Stack Overflow Security

---

## 🎉 結論

本次資安審計是專案邁向生產環境的重要里程碑。雖然發現了 8 個主要威脅，但專案的基礎是穩固的：

**做得好的地方** ✅:
- Firebase Admin SDK 初始化正確
- `.gitignore` 配置正確
- 大部分 API 有權限檢查
- 沒有使用危險的 React API

**需要改進的地方** ⚠️:
- 硬編碼的權限控制
- 缺少 Rate Limiting
- 輸入驗證不夠嚴格

按照報告中的修復建議，分三個階段逐步改進，你的專案將達到生產級別的安全標準。

**記住：安全不是一次性的任務，而是持續的過程。** 🛡️

---

**審計完成日期**: 2025-10-14
**下次審計建議時間**: 修復高風險問題後 2 週
**安全評分**: 6.5/10 → 目標 8.5/10（修復後）

**版本狀態**: ⚠️ 需要修復高風險項目後才建議上線
