# 安全性與可簡化程式碼審查報告

## Executive Summary

本次審查聚焦於 `Next.js + NextAuth + Firebase Admin + ECPay` 的核心風險面。確認到 4 個高優先度問題，其中 2 個屬於可直接影響金流或整體系統控制權的重大風險：

1. 專案內已有實際敏感憑證檔案被提交。
2. 結帳 API 直接信任前端傳入金額與商品資訊，存在金額竄改風險。
3. 公開的金流 debug 路由可被當成簽章 oracle 使用。
4. 管理員權限由硬編碼 email 直接提升，繞過資料庫角色治理。

另有數個中低風險與程式簡化機會，包括過度詳細的金流日誌、缺少統一安全標頭、以及多處重複的 payload 清洗邏輯。

---

## Critical

### Finding SEC-001
- Rule ID: `NEXT-SECRETS-001`
- Severity: Critical
- Location: [.env.local](/Users/hsuhsiang/Desktop/project/vibe-coding/online-courses/.env.local#L1)
- Evidence:

```dotenv
FIREBASE_PRIVATE_KEY="[REDACTED]"
NEXTAUTH_SECRET=[REDACTED]
GOOGLE_CLIENT_SECRET=[REDACTED]
```

- Impact: 任何取得 repository 或工作目錄備份的人，都可能直接取得 Firebase Admin 權限、偽造 NextAuth session、或濫用 OAuth 設定，影響範圍是整個系統。
- Fix: 立刻輪替所有已暴露憑證，將 `.env.local` 從版本控制移除，並確認 `.gitignore` 已涵蓋；後續只保留 `.env.example` 或文件模板。
- Mitigation: 若短時間無法全數輪替，至少先停用現有 Firebase service account / OAuth secret / NextAuth secret，避免持續暴露。
- False positive notes: 這不是理論風險；檔案中可見的是實際值而非 placeholder。

### Finding SEC-002
- Rule ID: `NEXT-INPUT-001`
- Severity: Critical
- Location: [app/api/checkout/ecpay/route.ts](/Users/hsuhsiang/Desktop/project/vibe-coding/online-courses/app/api/checkout/ecpay/route.ts#L28)
- Evidence:

```ts
const body = await request.json()
const { items, subtotal = 0, tax = 0, total = 0 } = body;
...
const orderData = {
  items,
  subtotal,
  tax,
  total,
}
...
Math.round(total)
```

- Impact: 使用者可直接修改前端 request body，把 `items`、`subtotal`、`tax`、`total` 改成任意值，導致低價購買、錯誤對帳，甚至建立與實際課程不一致的金流訂單。
- Fix: 後端只接受 `courseId`、折扣碼、付款方式等必要輸入，商品名稱與金額必須由後端重新查詢課程資料並重算；不要信任 sessionStorage 或 client payload 的價格欄位。
- Mitigation: 在正式修正前，至少在 callback/result 比對 `TradeAmt` 與 server-side order amount 是否一致，不一致時拒絕入帳。
- False positive notes: 目前程式碼內沒有任何 server-side price recomputation 的證據。

### Finding SEC-003
- Rule ID: `NEXT-SECRETS-002`
- Severity: Critical
- Location: [app/api/payment/result-debug/route.ts](/Users/hsuhsiang/Desktop/project/vibe-coding/online-courses/app/api/payment/result-debug/route.ts#L24)
- Evidence:

```ts
export async function POST(request: NextRequest) {
  const params = await request.json();
  const HASH_KEY = process.env.ECPAY_HASH_KEY || '...';
  const HASH_IV = process.env.ECPAY_HASH_IV || '...';
  ...
  const sig = crypto.createHash('sha256')...
  return NextResponse.json({ results: ... signature: sig ... })
}
```

- Impact: 這個公開 route 會用正式金流密鑰替任意輸入計算簽章，等同提供外部簽章服務。攻擊者若知道或猜到 `MerchantTradeNo`，就能更容易偽造回調或繞過金流完整性檢查。
- Fix: 立即移除此 route，或至少在 production 完全停用，並限制為本機開發可用；不要在 API 回應或日誌中輸出簽章、HashKey、HashIV。
- Mitigation: 若暫時必須保留，至少加上強制管理員驗證、環境開關、IP allowlist，且不能使用正式密鑰。
- False positive notes: 風險成立前提是此 route 可從外部存取；目前程式碼內沒有任何保護。

## High

### Finding SEC-004
- Rule ID: `NEXT-AUTHZ-001`
- Severity: High
- Location: [lib/auth.ts](/Users/hsuhsiang/Desktop/project/vibe-coding/online-courses/lib/auth.ts#L12)
- Evidence:

```ts
const INSTRUCTOR_EMAILS = new Set([...]);
...
if (isInstructor) {
  session.user.role = "admin";
}
```

- Impact: 角色提升邏輯被寫死在程式碼中，且 email 一旦符合就直接成為 `admin`。這會繞過資料庫中的角色治理，讓權限模型無法被一致稽核，也放大單一帳號遭入侵時的影響。
- Fix: 將角色來源統一改為資料庫或受控的後台流程；若要有 bootstrap admin，應透過受限環境變數或一次性 migration 設定，而不是每次 session callback 自動提升。
- Mitigation: 至少把硬編碼提升從 `admin` 降為最低必要角色，並加上明確註記與環境限制。
- False positive notes: 若這是 demo 專案的刻意設計，仍應註明其非 production-safe。

## Medium

### Finding SEC-005
- Rule ID: `NEXT-LOG-001`
- Severity: Medium
- Location: [app/api/payment/callback/route.ts](/Users/hsuhsiang/Desktop/project/vibe-coding/online-courses/app/api/payment/callback/route.ts#L37)
- Evidence:

```ts
console.log('[Payment Callback] 簽章驗證詳情:', {
  receivedCheckMacValue,
  calculatedCheckMacValue,
})
console.log('[Payment Callback] 接收到的完整參數:', JSON.stringify(params, null, 2));
```

- Impact: 金流回呼資料可能包含卡號末碼、授權碼、交易編號與簽章值。這些資訊若進入集中式日誌、第三方 log 平台或錯誤追蹤工具，會增加敏感資訊外洩面。
- Fix: production 僅記錄必要欄位，例如 `merchantTradeNo`、`RtnCode`、內部 `orderId`；移除完整 payload 與簽章輸出。
- Mitigation: 若為除錯保留，應以 `NODE_ENV === "development"` 或明確 debug flag 包起來，並預設關閉。
- False positive notes: 需再確認部署平台是否會長期保留 server logs。

### Finding SEC-006
- Rule ID: `REACT-XSS-001`
- Severity: Medium
- Location: [app/checkout/ecpay/page.tsx](/Users/hsuhsiang/Desktop/project/vibe-coding/online-courses/app/checkout/ecpay/page.tsx#L132)
- Evidence:

```ts
const html = await response.text();
document.write(html);
document.close();
```

- Impact: `document.write` 是高風險 DOM sink。這裡雖然目前寫入的是自家 API 回傳 HTML，但若前一步 HTML 內容受到未轉義的使用者輸入影響，會形成 XSS 或 HTML 注入鏈。
- Fix: 改成後端回傳 `redirectUrl`，前端用 `window.location.assign()` 導向；若一定要提交表單，前端應建立受控 `<form>` 節點而非直接寫整段 HTML。
- Mitigation: 至少確認 server 端輸出的 HTML 對所有 dynamic values 都做完整 escaping，而不是只替換雙引號。
- False positive notes: 此問題的利用性與 `app/api/checkout/ecpay/route.ts` 對 client payload 的信任程度高度相關。

### Finding SEC-007
- Rule ID: `NEXT-HEADERS-001`
- Severity: Medium
- Location: [next.config.ts](/Users/hsuhsiang/Desktop/project/vibe-coding/online-courses/next.config.ts#L1)
- Evidence:

```ts
const nextConfig: NextConfig = {
  images: { ... }
};
```

- Impact: 專案中看不到 CSP、`X-Content-Type-Options`、`Referrer-Policy`、`frame-ancestors` 等基礎安全標頭設定。若 edge / CDN 端也未補上，整體對 XSS、clickjacking 與 MIME sniffing 的防禦較弱。
- Fix: 在 `next.config.ts` 或部署層加入統一安全標頭；若有第三方 iframe / payment flow 需求，需明確列出 CSP 允許來源。
- Mitigation: 若標頭在 Cloudflare / nginx / Vercel 已設定，請補文件說明，避免 app code 與實際部署設定脫節。
- False positive notes: 這一項可能已在基礎設施層處理，需 runtime 驗證。

---

## 可簡化程式碼區塊

### SIM-001 重複的 `removeUndefined` / `normalizePayload`
- Location:
  - [app/api/admin/courses/route.ts](/Users/hsuhsiang/Desktop/project/vibe-coding/online-courses/app/api/admin/courses/route.ts#L13)
  - [app/api/admin/courses/[courseId]/route.ts](/Users/hsuhsiang/Desktop/project/vibe-coding/online-courses/app/api/admin/courses/[courseId]/route.ts#L13)
- Observation: 兩個 route 幾乎複製了相同的 payload 正規化與 undefined 清洗邏輯。
- Simplify: 抽成 `lib/admin-course-input.ts` 之類的共用模組，讓驗證規則只維護一次，也降低未來權限或欄位修補時漏改的機率。

### SIM-002 金流導回頁面的重複 HTML redirect 模板
- Location: [app/api/payment/result/route.ts](/Users/hsuhsiang/Desktop/project/vibe-coding/online-courses/app/api/payment/result/route.ts#L30)
- Observation: 缺參數、簽章失敗、找不到訂單、成功、例外等分支都在手寫類似的 HTML meta refresh。
- Simplify: 抽一個 `htmlRedirect(url: string)` 工具函式，集中 escape 與 response header，降低 copy-paste 錯誤。

### SIM-003 權限檢查分散且格式不一致
- Location:
  - [app/api/admin/users/route.ts](/Users/hsuhsiang/Desktop/project/vibe-coding/online-courses/app/api/admin/users/route.ts#L10)
  - [app/api/admin/courses/route.ts](/Users/hsuhsiang/Desktop/project/vibe-coding/online-courses/app/api/admin/courses/route.ts#L60)
  - [app/api/admin/courses/[courseId]/route.ts](/Users/hsuhsiang/Desktop/project/vibe-coding/online-courses/app/api/admin/courses/[courseId]/route.ts#L66)
- Observation: 每個 route 各自做 session / role 檢查，回傳格式與錯誤訊息不完全一致。
- Simplify: 抽成共用的 `requireRole()` 或 `resolveSessionContext()` helper，讓 RBAC 一致且更容易稽核。

---

## 建議修復順序

1. 移除並輪替 `.env.local` 內所有敏感憑證。
2. 關閉 `app/api/payment/result-debug/route.ts`，避免繼續暴露簽章能力。
3. 重寫 `app/api/checkout/ecpay/route.ts`，改為後端重新計價。
4. 移除 `lib/auth.ts` 中的硬編碼 admin 提升邏輯。
5. 收斂金流詳細日誌與加上基礎安全標頭。
