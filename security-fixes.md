# 線上課程平台 - 深度安全審計報告

**審計日期：** 2025-10-14
**審計者：** 資深資安顧問
**專案版本：** v0.1.2
**審計範圍：** 全面安全審計

---

## 專案基本資訊

### 專案名稱與簡介
**名稱：** 線上課程平台 (Online Courses Platform)
**簡介：** Next.js 15.5.4 打造的線上課程示範平台，提供課程瀏覽、購買、後台管理與學習進度追蹤

### 目標使用者
- **學員：** 瀏覽課程、購買課程、追蹤學習進度
- **講師：** 管理自己的課程內容
- **管理員：** 管理所有課程、用戶、訂單

### 處理的資料類型
- ✅ **個人身份資訊 (PII)：** Email、姓名、使用者 ID
- ❌ **支付或財務資訊：** 僅有 demo 的 ATM 轉帳資訊（非真實交易）
- ❌ **用戶上傳內容 (UGC)：** 目前僅管理員/講師可建立課程內容

### 技術棧
- **前端：** Next.js 15.5.4 (App Router), React 19.1.0, Tailwind CSS 4
- **後端：** Next.js API Routes, Firebase Admin SDK 13.5.0
- **資料庫：** Google Firestore (NoSQL)
- **認證：** NextAuth v4.24.11 (Google OAuth)

### 部署環境
- **開發：** localhost:3000
- **生產：** 預計部署至 Vercel（尚未部署）

### 外部依賴與服務
- **NPM 套件：** 見 `package.json`
- **外部 API：** Google OAuth 2.0
- **雲端服務：** Firebase (Firestore, Authentication)

---

## 第一部分：新手常見的災難性錯誤檢查

### 威脅 #1: 硬編碼的管理員權限控制

**風險等級：** 🔴 **高**

**威脅描述：**
在 `lib/auth.ts` 檔案中，講師和管理員的 Email 清單是硬編碼在程式碼中的。這意味著任何有權限查看原始碼的人（包括所有開發者、Git 歷史記錄）都知道哪些帳號擁有管理員權限。

**受影響的元件：**
- 檔案：`lib/auth.ts`
- 行數：第 12-15 行
```typescript
const INSTRUCTOR_EMAILS = new Set([
  "skypassion5000@gmail.com",
  "chengyunm1313@gmail.com"
]);
```

**駭客攻擊劇本：**

> 我是一個剛加入團隊的開發實習生，我對這個專案很好奇。第一天，我 clone 了專案的 Git repository，開始瀏覽程式碼。在 `lib/auth.ts` 檔案裡，我看到了這段程式碼：
>
> ```typescript
> const INSTRUCTOR_EMAILS = new Set([
>   "skypassion5000@gmail.com",
>   "chengyunm1313@gmail.com"
> ]);
> ```
>
> 太好了！我知道了兩個管理員帳號。接下來，我檢查了 `session` callback：
>
> ```typescript
> if (isInstructor) {
>   session.user.role = "admin"; // 講師被自動提升為 admin！
> }
> ```
>
> 原來只要我的 Google 帳號 Email 在這個清單裡，我就會自動獲得 admin 權限。我去 Git history 看了一下，發現這個清單已經存在 6 個月了，從來沒有更新過。
>
> 如果我想獲取管理員權限，我有幾個選擇：
>
> 1. **社交工程攻擊：** 如果我能取得這兩個 Email 帳號的密碼（釣魚、猜測、資料外洩），我就直接成為管理員了。
> 2. **內部人員威脅：** 如果我是離職員工，我可能還記得這些 Email，並且知道如何利用它們。
> 3. **程式碼注入：** 如果我有機會提交一個 Pull Request，我可以偷偷把自己的 Email 加進去。
>
> 更糟的是，因為權限檢查是在 session callback 中進行的，系統不會記錄這些權限提升的操作，沒有審計日誌，沒有人會發現。

**修復原理：**

硬編碼權限就像把銀行金庫的密碼寫在辦公室的白板上。雖然辦公室不是公開場所，但任何進入辦公室的人（包括清潔人員、訪客、實習生）都能看到。

**正確的做法是：**
- **權限資訊應該儲存在資料庫中**，而不是程式碼裡
- **權限變更應該有審計日誌**，記錄是誰、在什麼時候、把誰的權限改成了什麼
- **權限檢查應該每次都查詢資料庫**，而不是依賴 session 中快取的資料

想像一下真實世界的安全系統：
- ❌ **錯誤：** 在門口貼一張紙，寫著「張三、李四、王五可以進入」
- ✅ **正確：** 每個人刷門禁卡時，系統即時查詢資料庫，檢查這張卡是否有權限

**修復建議與程式碼範例：**

**步驟 1：建立 Firestore 的用戶角色集合**

在 Firestore 中，`users` 集合應該包含 `role` 欄位：

```typescript
// Firestore 結構
users/{userId}
  - email: string
  - name: string
  - role: "student" | "instructor" | "admin"
  - status: "active" | "blocked" | "deleted"
  - createdAt: timestamp
  - updatedAt: timestamp
```

**步驟 2：修改 `lib/auth.ts` 的 session callback**

```typescript
// lib/auth.ts - 修復後

// ❌ 刪除硬編碼的 Email 清單
// const INSTRUCTOR_EMAILS = new Set([...]);

callbacks: {
  async session({ session, user }) {
    if (session.user) {
      session.user.id = user.id;

      // ✅ 從資料庫查詢用戶角色
      try {
        const userDoc = await adminDb
          .collection("users")
          .doc(user.id)
          .get();

        const userData = userDoc.data();

        // 檢查用戶狀態
        if (userData?.status === "blocked" || userData?.status === "deleted") {
          throw new Error("帳號已被停用");
        }

        // 設定角色（預設為 student）
        session.user.role = userData?.role || "student";

        // 記錄 session 建立（用於審計）
        await adminDb.collection("audit_logs").add({
          action: "session_created",
          userId: user.id,
          role: session.user.role,
          timestamp: new Date(),
          ip: null, // 可從 request 取得
        });

      } catch (error) {
        console.error("[auth] Failed to fetch user role:", error);
        // 發生錯誤時，預設為最低權限
        session.user.role = "student";
      }
    }

    return session;
  },
}
```

**步驟 3：建立管理員角色管理 API**

```typescript
// app/api/admin/users/[userId]/role/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getServerSession(authOptions);

  // 只有管理員可以變更角色
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json(
      { error: "沒有權限執行此操作" },
      { status: 403 }
    );
  }

  const { userId } = await params;
  const { role } = await request.json();

  // 驗證角色值
  if (!["student", "instructor", "admin"].includes(role)) {
    return NextResponse.json(
      { error: "無效的角色" },
      { status: 400 }
    );
  }

  try {
    // 更新用戶角色
    await adminDb.collection("users").doc(userId).update({
      role,
      updatedAt: new Date(),
    });

    // ✅ 記錄審計日誌
    await adminDb.collection("audit_logs").add({
      action: "role_changed",
      targetUserId: userId,
      operatorUserId: session.user.id,
      operatorEmail: session.user.email,
      oldRole: null, // 可以先查詢舊角色
      newRole: role,
      timestamp: new Date(),
      ip: request.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({
      success: true,
      userId,
      role,
    });

  } catch (error) {
    console.error("[admin] Failed to update role:", error);
    return NextResponse.json(
      { error: "更新角色失敗" },
      { status: 500 }
    );
  }
}
```

**步驟 4：建立初始管理員的遷移腳本**

```typescript
// scripts/create-initial-admin.ts

import { adminDb } from "../lib/firebase-admin";

async function createInitialAdmin() {
  const adminEmails = [
    "skypassion5000@gmail.com",
    "chengyunm1313@gmail.com",
  ];

  for (const email of adminEmails) {
    // 查詢用戶
    const usersSnapshot = await adminDb
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.log(`User ${email} not found, skipping...`);
      continue;
    }

    const userDoc = usersSnapshot.docs[0];

    // 更新為管理員
    await userDoc.ref.update({
      role: "admin",
      updatedAt: new Date(),
    });

    console.log(`✅ Set ${email} as admin`);
  }

  console.log("Initial admin setup complete!");
}

createInitialAdmin().catch(console.error);
```

執行遷移：
```bash
npx tsx scripts/create-initial-admin.ts
```

---

### 威脅 #2: .env.local 檔案洩露風險

**風險等級：** 🔴 **高**

**威脅描述：**
`.env.local` 檔案包含 Firebase 私鑰、Google OAuth Client Secret 等極度敏感的憑證。雖然 `.gitignore` 已正確配置，但仍存在以下風險：

1. 開發者可能不小心用 `git add -f` 強制加入
2. 檔案可能被複製到公開目錄
3. 開發者可能在 Slack/Email 中分享檔案內容
4. 本地備份可能包含此檔案

**受影響的元件：**
- 檔案：`.env.local`
- 內容：Firebase 私鑰、Google OAuth Secret

**駭客攻擊劇本：**

> 我是一個駭客，我在 GitHub 上搜尋 "FIREBASE_PRIVATE_KEY" 和 ".env.local"，發現了數千個不小心被提交的敏感檔案。這是最常見的錯誤之一。
>
> 我找到了你的專案，發現在 commit history 中，有一個開發者在 3 個月前不小心提交了 `.env.local`。雖然後來他刪除了，但 Git history 永遠記得。
>
> 我使用 `git log --all --full-history -- .env.local` 找到了那個 commit，然後用 `git show <commit-hash>:.env.local` 查看內容。
>
> 太好了！我拿到了：
> - Firebase Admin SDK 的完整私鑰
> - Google OAuth Client Secret
> - 專案 ID 和資料庫 URL
>
> 現在我可以：
> 1. 使用 Firebase Admin SDK 讀取、修改、刪除所有資料
> 2. 建立假的管理員帳號
> 3. 下載所有用戶資料（包含 Email、姓名）
> 4. 修改課程內容，植入惡意連結
> 5. 刪除所有課程和訂單，讓網站癱瘓
>
> 而且因為這是官方的 Admin SDK 金鑰，所有操作看起來都是「合法」的，不會觸發任何警報。

**修復原理：**

`.env.local` 就像是你家的鑰匙。你不會把鑰匙的照片上傳到 Facebook，也不會把鑰匙複製品到處放。

**正確的做法是：**
- **永遠不要將 secrets 提交到 Git**（即使是私有 repository）
- **使用專業的 Secret 管理服務**
- **定期輪換 credentials**
- **監控 credentials 的使用情況**

**修復建議與程式碼範例：**

**步驟 1：檢查 Git history 是否洩露**

```bash
# 檢查是否有 .env.local 被提交過
git log --all --full-history -- .env.local

# 如果有，徹底刪除（⚠️ 這會改寫 Git history）
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.local" \
  --prune-empty --tag-name-filter cat -- --all
```

**步驟 2：立即輪換所有 credentials**

1. **Firebase:**
   - 前往 Firebase Console
   - 刪除舊的 Service Account Key
   - 建立新的 Key
   - 更新 `.env.local`

2. **Google OAuth:**
   - 前往 Google Cloud Console
   - 刪除舊的 Client Secret
   - 建立新的 OAuth 2.0 憑證
   - 更新 `.env.local`

**步驟 3：使用 Vercel 環境變數（部署時）**

不要在生產環境使用 `.env.local`，改用 Vercel 的 Environment Variables：

```bash
# 透過 Vercel CLI 設定
vercel env add FIREBASE_PROJECT_ID
vercel env add FIREBASE_PRIVATE_KEY
vercel env add GOOGLE_CLIENT_SECRET
```

或在 Vercel Dashboard 的 Settings > Environment Variables 中設定。

**步驟 4：使用 Secret 掃描工具**

安裝 `git-secrets` 防止不小心提交：

```bash
# 安裝 git-secrets
brew install git-secrets  # macOS
# 或
apt-get install git-secrets  # Linux

# 設定
cd /path/to/your/repo
git secrets --install
git secrets --register-aws  # 掃描 AWS keys
git secrets --add 'FIREBASE_PRIVATE_KEY'
git secrets --add 'GOOGLE_CLIENT_SECRET'
```

**步驟 5：建立 pre-commit hook**

```bash
# .husky/pre-commit

#!/bin/sh

# 檢查是否有 .env.local 被 staged
if git diff --cached --name-only | grep -q "\.env\.local"; then
  echo "❌ Error: .env.local should not be committed!"
  echo "Please remove it from staging area:"
  echo "  git reset HEAD .env.local"
  exit 1
fi

# 檢查 staged files 中是否有 secrets
if git diff --cached --diff-filter=ACM | grep -i "FIREBASE_PRIVATE_KEY\|CLIENT_SECRET"; then
  echo "❌ Error: Potential secret detected in commit!"
  echo "Please review your changes and remove sensitive data."
  exit 1
fi

exit 0
```

安裝 husky：
```bash
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit
chmod +x .husky/pre-commit
```

---

### 威脅 #3: API Rate Limiting 缺失

**風險等級：** 🔴 **高**

**威脅描述：**
所有的 API 端點都沒有實作 Rate Limiting，攻擊者可以無限制地發送請求。這會導致：

1. **暴力破解攻擊：** 例如嘗試所有可能的折扣碼
2. **資源耗盡：** 大量請求導致伺服器和資料庫過載
3. **成本激增：** Firebase 和 Vercel 的費用會飆升

**受影響的元件：**
- 所有 API 路由（`app/api/**/*.ts`）
- 特別是：
  - `/api/checkout/discount` - 折扣碼驗證
  - `/api/enrollments` - 課程報名
  - `/api/admin/courses` - 課程管理

**駭客攻擊劇本：**

> 我發現你的網站有折扣碼功能，而且折扣碼 API (`/api/checkout/discount`) 不需要登入就能使用。
>
> 我寫了一個簡單的 Python 腳本：
>
> ```python
> import requests
> import itertools
> import string
>
> # 生成所有可能的 6 位數字母組合
> for code in itertools.product(string.ascii_uppercase, repeat=6):
>     discount_code = ''.join(code)
>
>     response = requests.post(
>         'https://your-site.vercel.app/api/checkout/discount',
>         json={
>             'courseId': 'some-course-id',
>             'code': discount_code
>         }
>     )
>
>     if response.json().get('valid'):
>         print(f'✅ Found valid code: {discount_code}')
> ```
>
> 因為沒有 Rate Limiting，我可以每秒發送 100 個請求，24 小時不間斷。即使折扣碼空間很大，我也能找到一些有效的碼。
>
> 更糟的是，這會造成：
> - 你的 Vercel 流量費用暴增
> - Firebase Firestore 讀取次數暴增
> - 伺服器 CPU 和記憶體被佔滿
> - 真實用戶無法使用網站（DoS 攻擊）

**修復原理：**

Rate Limiting 就像是銀行的提款機。你不能在 1 分鐘內提款 100 次，系統會限制你的操作頻率。這不是為了刁難你，而是為了保護系統和其他用戶。

**正確的做法是：**
- **限制單一 IP 的請求頻率**
- **限制單一用戶的請求頻率**
- **對敏感操作設置更嚴格的限制**
- **返回 429 Too Many Requests 狀態碼**

**修復建議與程式碼範例：**

**方案 1：使用 Upstash Rate Limiting（推薦）**

```bash
npm install @upstash/ratelimit @upstash/redis
```

建立 Upstash Redis 帳號（免費額度足夠使用）：https://console.upstash.com/

```typescript
// lib/rate-limit.ts

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// 建立 Redis 連線
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 一般 API 限制：每 10 秒 10 次請求
export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
  prefix: "ratelimit:api",
});

// 敏感操作限制：每分鐘 5 次請求
export const sensitiveRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
  prefix: "ratelimit:sensitive",
});

// 折扣碼限制：每小時 20 次請求
export const discountRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 h"),
  analytics: true,
  prefix: "ratelimit:discount",
});

// 工具函數：取得識別符（優先使用 userId，其次使用 IP）
export function getRateLimitId(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";

  return `ip:${ip}`;
}
```

**在 API 路由中使用：**

```typescript
// app/api/checkout/discount/route.ts

import { NextResponse } from "next/server";
import { discountRateLimit, getRateLimitId } from "@/lib/rate-limit";
import { evaluateDiscount } from "@/lib/checkout";

export async function POST(request: Request) {
  try {
    // ✅ 應用 Rate Limiting
    const identifier = getRateLimitId(request);
    const { success, limit, reset, remaining } = await discountRateLimit.limit(identifier);

    if (!success) {
      return NextResponse.json(
        {
          valid: false,
          message: "請求過於頻繁，請稍後再試",
          error: "RATE_LIMIT_EXCEEDED",
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": new Date(reset).toISOString(),
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // 原有的邏輯
    const { courseId, code } = await request.json();

    // 驗證輸入
    if (!courseId || typeof courseId !== "string") {
      return NextResponse.json(
        { valid: false, message: "無效的課程 ID" },
        { status: 400 }
      );
    }

    const result = evaluateDiscount(0, code);

    return NextResponse.json(result);

  } catch (error) {
    console.error("[discount] Error:", error);
    return NextResponse.json(
      { valid: false, message: "伺服器錯誤" },
      { status: 500 }
    );
  }
}
```

**方案 2：使用 Vercel Edge Middleware（適用於已部署到 Vercel）**

```typescript
// middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '10 s'),
});

export async function middleware(request: NextRequest) {
  // 只對 API 路由應用 rate limiting
  if (request.nextUrl.pathname.startsWith('/api')) {
    const ip = request.ip ?? '127.0.0.1';
    const { success, pending, limit, reset, remaining } = await ratelimit.limit(ip);

    const response = success
      ? NextResponse.next()
      : NextResponse.json(
          { error: 'Too Many Requests' },
          { status: 429 }
        );

    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(reset).toISOString());

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

**環境變數設定：**

```bash
# .env.local
UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token-here"
```

---

## 第二部分：標準應用程式安全審計

### 威脅 #4: 缺少嚴格的輸入驗證

**風險等級：** 🟡 **中**

**威脅描述：**
多個 API 端點對用戶輸入缺少嚴格的驗證，可能導致：
- 資料庫注入（雖然 Firestore 較不易受攻擊，但仍需驗證）
- 業務邏輯繞過
- 資料完整性問題

**受影響的元件：**
- `app/api/admin/courses/route.ts`
- `app/api/enrollments/route.ts`
- `app/api/admin/users/route.ts`

**修復建議：**

安裝 Zod 驗證庫：
```bash
npm install zod
```

建立驗證 schemas：

```typescript
// lib/validations/course.ts

import { z } from "zod";

export const CourseInputSchema = z.object({
  title: z.string()
    .min(1, "課程名稱不能為空")
    .max(200, "課程名稱不能超過 200 字元")
    .refine(
      (title) => !/<script|javascript:|on\w+=/i.test(title),
      "課程名稱包含非法字元"
    ),

  description: z.string()
    .max(10000, "課程描述不能超過 10000 字元")
    .optional(),

  price: z.number()
    .min(0, "價格不能為負數")
    .max(1000000, "價格超過上限")
    .int("價格必須是整數"),

  thumbnail: z.string()
    .url("縮圖必須是有效的 URL")
    .startsWith("https://", "縮圖必須使用 HTTPS")
    .optional()
    .or(z.literal("")),

  category: z.enum([
    "programming",
    "design",
    "business",
    "marketing",
    "other"
  ]).optional(),

  level: z.enum(["beginner", "intermediate", "advanced"]).optional(),

  duration: z.number()
    .min(0, "時長不能為負數")
    .max(10000, "時長超過上限")
    .optional(),

  lessons: z.number()
    .min(0, "課程數不能為負數")
    .max(1000, "課程數超過上限")
    .optional(),

  tags: z.array(
    z.string().max(50, "標籤長度不能超過 50 字元")
  ).max(20, "最多 20 個標籤"),

  published: z.boolean().optional(),

  instructorId: z.string()
    .regex(/^[a-zA-Z0-9_-]+$/, "無效的講師 ID")
    .optional(),

  modules: z.array(
    z.object({
      id: z.string(),
      title: z.string().min(1).max(200),
      description: z.string().max(1000).optional(),
      order: z.number().min(0),
      lessons: z.array(
        z.object({
          id: z.string(),
          title: z.string().min(1).max(200),
          description: z.string().max(1000).optional(),
          duration: z.number().min(0).max(500).optional(),
          videoUrl: z.string()
            .url()
            .startsWith("https://")
            .optional()
            .or(z.literal("")),
          preview: z.boolean().optional(),
          order: z.number().min(0).optional(),
        })
      ),
    })
  ).optional(),
});

export const EnrollmentInputSchema = z.object({
  courseId: z.string()
    .min(1, "課程 ID 不能為空")
    .regex(/^[a-zA-Z0-9_-]+$/, "無效的課程 ID"),
});

export const RoleUpdateSchema = z.object({
  role: z.enum(["student", "instructor", "admin"], {
    errorMap: () => ({ message: "無效的角色" }),
  }),
});
```

在 API 路由中使用：

```typescript
// app/api/admin/courses/route.ts

import { CourseInputSchema } from "@/lib/validations/course";
import { ZodError } from "zod";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !["admin", "instructor"].includes(session.user.role)) {
    return NextResponse.json({ error: "沒有權限" }, { status: 403 });
  }

  try {
    const body = await request.json();

    // ✅ 驗證輸入
    const validatedData = CourseInputSchema.parse(body);

    // 使用驗證後的資料
    const course = await createCourseForManagement(validatedData, {
      role: session.user.role,
      userId: session.user.id,
    });

    return NextResponse.json({ course }, { status: 201 });

  } catch (error) {
    // 處理驗證錯誤
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "輸入驗證失敗",
          details: error.errors.map(e => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error("[admin-courses] POST error:", error);
    return NextResponse.json(
      { error: "建立課程失敗" },
      { status: 500 }
    );
  }
}
```

---

### 威脅 #5: 錯誤訊息洩露敏感資訊

**風險等級：** 🟡 **中**

**威脅描述：**
多處 API 路由直接將 `error.message` 返回給前端，可能洩露：
- 資料庫結構
- 內部檔案路徑
- Stack traces
- 第三方服務錯誤訊息

**受影響的元件：**
- 所有 API 路由的 catch 區塊

**修復建議：**

建立統一的錯誤處理機制：

```typescript
// lib/error-handler.ts

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function handleApiError(error: unknown, context: string) {
  // 開發環境：記錄完整錯誤
  if (process.env.NODE_ENV === "development") {
    console.error(`[${context}]`, error);
  }

  // 生產環境：只記錄錯誤類型
  if (process.env.NODE_ENV === "production") {
    if (error instanceof Error) {
      console.error(`[${context}] ${error.name}: ${error.message}`);

      // 發送到錯誤追蹤服務（如 Sentry）
      // Sentry.captureException(error, { tags: { context } });
    } else {
      console.error(`[${context}] Unknown error:`, typeof error);
    }
  }

  // 返回安全的錯誤訊息
  if (error instanceof ApiError) {
    return {
      statusCode: error.statusCode,
      body: {
        error: error.message,
        code: error.code,
        details: error.details,
      },
    };
  }

  // 預設錯誤訊息（不洩露內部資訊）
  return {
    statusCode: 500,
    body: {
      error: "伺服器錯誤，請稍後再試",
      code: "INTERNAL_ERROR",
    },
  };
}

// 工具函數：建立 ApiError
export function createApiError(
  statusCode: number,
  message: string,
  code?: string,
  details?: unknown
): ApiError {
  return new ApiError(statusCode, message, code, details);
}
```

在 API 路由中使用：

```typescript
// app/api/enrollments/route.ts

import { handleApiError, createApiError } from "@/lib/error-handler";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      throw createApiError(401, "未授權", "UNAUTHORIZED");
    }

    const { courseId } = await request.json();

    if (!courseId) {
      throw createApiError(400, "缺少課程 ID", "MISSING_COURSE_ID");
    }

    // 檢查課程是否存在
    const courseDoc = await adminDb.collection("courses").doc(courseId).get();

    if (!courseDoc.exists) {
      throw createApiError(404, "找不到指定課程", "COURSE_NOT_FOUND");
    }

    // ... 其他邏輯

    return NextResponse.json({ success: true }, { status: 201 });

  } catch (error) {
    const { statusCode, body } = handleApiError(error, "enrollments:POST");
    return NextResponse.json(body, { status: statusCode });
  }
}
```

---

### 威脅 #6: Console.log 洩露敏感資訊

**風險等級：** 🟡 **中**

**威脅描述：**
程式碼中有 42 處 `console.error` 和 `console.log`，部分可能在生產環境洩露敏感資訊。

**修復建議：**

**方案 1：使用環境變數控制日誌等級**

```typescript
// lib/logger.ts

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel =
  (process.env.LOG_LEVEL as LogLevel) ||
  (process.env.NODE_ENV === "production" ? "warn" : "debug");

class Logger {
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL[level] >= LOG_LEVEL[currentLevel];
  }

  debug(message: string, ...args: unknown[]) {
    if (this.shouldLog("debug")) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]) {
    if (this.shouldLog("info")) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]) {
    if (this.shouldLog("warn")) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, error?: unknown) {
    if (this.shouldLog("error")) {
      if (process.env.NODE_ENV === "production") {
        // 生產環境：只記錄錯誤類型
        if (error instanceof Error) {
          console.error(`[ERROR] ${message} - ${error.name}`);
        } else {
          console.error(`[ERROR] ${message}`);
        }
      } else {
        // 開發環境：記錄完整資訊
        console.error(`[ERROR] ${message}`, error);
      }
    }
  }
}

export const logger = new Logger();
```

替換所有 console.log：

```typescript
// 修改前
console.log("User logged in:", session.user.email);
console.error("Failed to fetch course:", error);

// 修改後
import { logger } from "@/lib/logger";

logger.info("User logged in", { email: session.user.email });
logger.error("Failed to fetch course", error);
```

**方案 2：使用 Webpack DefinePlugin 移除 console.log**

```typescript
// next.config.ts

const nextConfig: NextConfig = {
  webpack(config, { dev, isServer }) {
    if (!dev && !isServer) {
      // 生產環境的客戶端程式碼移除 console.log
      config.optimization = config.optimization || {};
      config.optimization.minimizer = config.optimization.minimizer || [];

      const TerserPlugin = require("terser-webpack-plugin");

      config.optimization.minimizer.push(
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: ["log", "debug"], // 移除 console.log 和 console.debug
            },
          },
        })
      );
    }

    return config;
  },
};
```

---

### 威脅 #7: 缺少 CSRF 保護

**風險等級：** 🟡 **中**

**威脅描述：**
雖然 NextAuth 提供基本的 CSRF 保護，但自定義的 API 路由（如 `/api/enrollments`、`/api/admin/*`）沒有額外的 CSRF 檢查。

**修復建議：**

```typescript
// middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 只對 state-changing methods 檢查 CSRF
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');

    // 允許的來源
    const allowedOrigins = [
      `https://${host}`,
      `http://${host}`, // 開發環境
      process.env.NEXT_PUBLIC_APP_URL,
    ].filter(Boolean);

    // 檢查 Origin header
    if (origin && !allowedOrigins.some(allowed => origin.startsWith(allowed || ''))) {
      console.warn(`[CSRF] Blocked request from invalid origin: ${origin}`);
      return NextResponse.json(
        { error: 'Invalid origin' },
        { status: 403 }
      );
    }

    // 檢查 Referer header（備用）
    const referer = request.headers.get('referer');
    if (!origin && referer && !allowedOrigins.some(allowed => referer.startsWith(allowed || ''))) {
      console.warn(`[CSRF] Blocked request from invalid referer: ${referer}`);
      return NextResponse.json(
        { error: 'Invalid referer' },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

---

### 威脅 #8: Session 管理不安全

**風險等級：** 🟡 **中**

**威脅描述：**
Session 的 `maxAge` 設定為 30 天，時間過長。如果用戶的裝置被盜，攻擊者可以長時間冒充該用戶。

**修復建議：**

```typescript
// lib/auth.ts

export const authOptions: AuthOptions = {
  // ... 其他設定

  session: {
    strategy: "database",
    maxAge: 7 * 24 * 60 * 60, // 改為 7 天
    updateAge: 24 * 60 * 60, // 每天更新一次
  },

  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;

        // ✅ 檢查用戶狀態
        try {
          const userDoc = await adminDb.collection("users").doc(user.id).get();
          const userData = userDoc.data();

          // 如果用戶被封鎖或刪除，終止 session
          if (userData?.status === "blocked" || userData?.status === "deleted") {
            throw new Error("帳號已被停用");
          }

          // ✅ 檢查是否需要重新驗證
          const lastVerified = userData?.lastVerified?.toDate();
          const now = new Date();

          if (!lastVerified || (now.getTime() - lastVerified.getTime()) > 24 * 60 * 60 * 1000) {
            // 超過 24 小時未驗證，要求重新登入
            await adminDb.collection("users").doc(user.id).update({
              requireReauth: true,
            });
          }

          session.user.role = userData?.role || "student";

        } catch (error) {
          console.error("[auth] Failed to fetch user:", error);
          // 發生錯誤時，終止 session
          throw error;
        }
      }

      return session;
    },
  },
};
```

實作「記住我」功能（可選）：

```typescript
// components/auth/SignInButton.tsx

"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInButton() {
  const [rememberMe, setRememberMe] = useState(false);

  const handleSignIn = async () => {
    await signIn("google", {
      callbackUrl: "/",
      // 如果勾選「記住我」，延長 session 時間
      ...(rememberMe && { maxAge: 30 * 24 * 60 * 60 }),
    });
  };

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
        />
        記住我 (30 天)
      </label>

      <button onClick={handleSignIn}>
        使用 Google 登入
      </button>
    </div>
  );
}
```

---

## 第三部分：OWASP Top 10 檢查

### A01: 權限控制失效 ✅ 大部分良好

**檢查結果：**
- ✅ 大部分 API 路由有適當的權限檢查
- ⚠️ 需要改進硬編碼的權限邏輯（已在威脅 #1 中說明）

### A02: 加密機制失效 ✅ 良好

**檢查結果：**
- ✅ 使用 NextAuth 的加密 session
- ✅ Firebase 連線使用 TLS
- ✅ Google OAuth 使用 HTTPS

**建議：**
- 確保部署到 Vercel 時啟用 HTTPS（Vercel 預設啟用）

### A03: 注入式攻擊 ✅ 風險較低

**檢查結果：**
- ✅ Firestore 不易受 SQL 注入攻擊
- ⚠️ 需要加強輸入驗證（已在威脅 #4 中說明）

### A04: 不安全的設計 ⚠️ 需改進

**檢查結果：**
- ⚠️ 缺少 Rate Limiting（已在威脅 #3 中說明）
- ⚠️ 折扣碼系統可被暴力破解
- ⚠️ 沒有實作帳號鎖定機制

**建議：**
實作帳號鎖定機制：

```typescript
// lib/account-security.ts

export async function checkAccountLockout(userId: string): Promise<boolean> {
  const userDoc = await adminDb.collection("users").doc(userId).get();
  const userData = userDoc.data();

  if (userData?.lockoutUntil) {
    const lockoutDate = userData.lockoutUntil.toDate();

    if (lockoutDate > new Date()) {
      return true; // 帳號已鎖定
    } else {
      // 鎖定時間已過，解除鎖定
      await userDoc.ref.update({
        lockoutUntil: null,
        failedAttempts: 0,
      });
    }
  }

  return false;
}

export async function recordFailedAttempt(userId: string) {
  const userDoc = await adminDb.collection("users").doc(userId).get();
  const userData = userDoc.data();

  const failedAttempts = (userData?.failedAttempts || 0) + 1;

  if (failedAttempts >= 5) {
    // 失敗 5 次，鎖定 30 分鐘
    await userDoc.ref.update({
      failedAttempts,
      lockoutUntil: new Date(Date.now() + 30 * 60 * 1000),
    });
  } else {
    await userDoc.ref.update({
      failedAttempts,
    });
  }
}

export async function recordSuccessfulAttempt(userId: string) {
  await adminDb.collection("users").doc(userId).update({
    failedAttempts: 0,
    lockoutUntil: null,
  });
}
```

### A05: 安全設定錯誤 ⚠️ 需改進

**檢查結果：**
- ⚠️ 缺少 Security Headers
- ⚠️ 錯誤訊息過於詳細（已在威脅 #5 中說明）

**建議：**
新增 Security Headers：

```typescript
// next.config.ts

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://accounts.google.com https://*.googleapis.com",
              "frame-src 'self' https://accounts.google.com https://www.youtube.com",
            ].join('; '),
          },
        ],
      },
    ];
  },
};
```

### A06: 危險或過時的元件 ✅ 良好

**檢查結果：**
```bash
npm audit
```

當前依賴沒有已知的高危漏洞。

**建議：**
- 定期執行 `npm audit`
- 使用 Dependabot 自動更新依賴
- 考慮使用 Snyk 進行持續監控

### A07: 身份認證和驗證機制失效 ⚠️ 需改進

**檢查結果：**
- ⚠️ Session 時間過長（已在威脅 #8 中說明）
- ⚠️ 沒有實作 2FA (Two-Factor Authentication)

**建議：**
考慮實作 2FA（未來功能）：

```typescript
// 使用 @node-otp/core 實作 TOTP

import { TOTP } from "@node-otp/core";

export function generateTOTPSecret(): string {
  return TOTP.generateSecret();
}

export function generateTOTP(secret: string): string {
  const totp = new TOTP({ secret });
  return totp.generate();
}

export function verifyTOTP(secret: string, token: string): boolean {
  const totp = new TOTP({ secret });
  return totp.validate({ token, window: 1 });
}
```

### A08: 軟體和資料完整性失效 ✅ 良好

**檢查結果：**
- ✅ 使用 npm 官方 registry
- ✅ package-lock.json 已提交
- ⚠️ 建議啟用 npm 的 integrity check

**建議：**
```bash
# .npmrc
package-lock=true
audit=true
```

### A09: 安全記錄和監控失效 ⚠️ 需改進

**檢查結果：**
- ⚠️ 缺少集中式日誌系統
- ⚠️ 沒有安全事件警報
- ⚠️ 缺少審計日誌

**建議：**
實作審計日誌：

```typescript
// lib/audit-log.ts

export type AuditAction =
  | "user_login"
  | "user_logout"
  | "role_changed"
  | "course_created"
  | "course_updated"
  | "course_deleted"
  | "enrollment_created"
  | "order_created"
  | "user_blocked"
  | "user_deleted";

export interface AuditLogEntry {
  action: AuditAction;
  actorId: string; // 執行動作的用戶 ID
  actorEmail?: string;
  targetId?: string; // 被操作的資源 ID
  targetType?: string; // "course" | "user" | "order"
  details?: Record<string, unknown>;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
}

export async function createAuditLog(entry: AuditLogEntry) {
  try {
    await adminDb.collection("audit_logs").add({
      ...entry,
      timestamp: entry.timestamp || new Date(),
    });
  } catch (error) {
    console.error("[audit] Failed to create audit log:", error);
    // 不要因為日誌失敗而中斷主要操作
  }
}

// 查詢審計日誌
export async function getAuditLogs(options: {
  actorId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  let query = adminDb.collection("audit_logs").orderBy("timestamp", "desc");

  if (options.actorId) {
    query = query.where("actorId", "==", options.actorId) as any;
  }

  if (options.action) {
    query = query.where("action", "==", options.action) as any;
  }

  if (options.startDate) {
    query = query.where("timestamp", ">=", options.startDate) as any;
  }

  if (options.endDate) {
    query = query.where("timestamp", "<=", options.endDate) as any;
  }

  if (options.limit) {
    query = query.limit(options.limit) as any;
  }

  const snapshot = await query.get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as (AuditLogEntry & { id: string })[];
}
```

在關鍵操作中使用：

```typescript
// 範例：課程建立
await createAuditLog({
  action: "course_created",
  actorId: session.user.id,
  actorEmail: session.user.email,
  targetId: courseId,
  targetType: "course",
  details: {
    title: course.title,
    price: course.price,
  },
  timestamp: new Date(),
  ip: request.headers.get("x-forwarded-for") || undefined,
  userAgent: request.headers.get("user-agent") || undefined,
});
```

### A10: 伺服器端請求偽造 (SSRF) ✅ 風險較低

**檢查結果：**
- ✅ 沒有發現用戶可控制的 URL 請求
- ✅ YouTube 影片 URL 僅用於前端嵌入

**建議：**
如果未來需要伺服器端請求外部 URL，需實作白名單：

```typescript
// lib/url-validator.ts

const ALLOWED_DOMAINS = [
  'www.youtube.com',
  'youtu.be',
  'vimeo.com',
  'player.vimeo.com',
];

export function isUrlAllowed(url: string): boolean {
  try {
    const parsed = new URL(url);

    // 只允許 HTTPS
    if (parsed.protocol !== 'https:') {
      return false;
    }

    // 檢查域名白名單
    return ALLOWED_DOMAINS.some(domain =>
      parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    );

  } catch {
    return false;
  }
}
```

---

## 安全性檢查清單總結

### 🔴 高風險（需立即修復）

1. ❌ **硬編碼的管理員權限** → 改為資料庫查詢（威脅 #1）
2. ⚠️ **`.env.local` 洩露風險** → 檢查 Git history、輪換 credentials（威脅 #2）
3. ❌ **缺少 Rate Limiting** → 實作 Upstash Rate Limiting（威脅 #3）

### 🟡 中風險（兩週內修復）

4. ❌ **輸入驗證不足** → 使用 Zod 驗證（威脅 #4）
5. ❌ **錯誤訊息洩露** → 實作統一錯誤處理（威脅 #5）
6. ❌ **Console.log 洩露** → 實作 Logger 系統（威脅 #6）
7. ⚠️ **缺少 CSRF 保護** → 實作 Middleware（威脅 #7）
8. ⚠️ **Session 管理** → 縮短 maxAge、實作重新驗證（威脅 #8）

### 🟢 低風險（一個月內改進）

9. ⚠️ **缺少 Security Headers** → 新增 CSP、HSTS 等 headers
10. ⚠️ **缺少審計日誌** → 實作 audit log 系統
11. ⚠️ **缺少帳號鎖定機制** → 實作失敗次數限制
12. ✅ **XSS 防護** → 良好（React 預設轉義）
13. ✅ **依賴安全** → 良好（無已知漏洞）

---

## 修復優先順序

### 第一階段（立即執行）- 預計 2-3 天

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
8. 更新 3-5 個最重要的 API 路由（enrollments, courses, users）

### 第二階段（兩週內）- 預計 5-7 天

**Week 1:**
9. 實作統一的錯誤處理機制
10. 建立 Logger 系統
11. 更新所有 API 路由使用新的錯誤處理

**Week 2:**
12. 實作 CSRF Middleware
13. 調整 Session 設定（maxAge, updateAge）
14. 實作基本的審計日誌

### 第三階段（一個月內）- 預計 7-10 天

**Week 3:**
15. 新增 Security Headers（CSP、HSTS 等）
16. 實作帳號鎖定機制
17. 完善審計日誌系統

**Week 4:**
18. 整合錯誤追蹤服務（Sentry）
19. 實作監控和警報
20. 安全性測試和滲透測試

---

## 額外建議

### 1. 開發流程改進

**實作 Git Hooks：**
```bash
npm install --save-dev husky lint-staged

# 設定 pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"
```

**.lintstagedrc.json:**
```json
{
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md}": [
    "prettier --write"
  ]
}
```

### 2. 安全測試

**安裝安全掃描工具：**
```bash
# 定期執行 npm audit
npm audit

# 使用 Snyk 掃描
npm install -g snyk
snyk auth
snyk test

# 使用 OWASP Dependency-Check
npm install -g retire
retire --path .
```

### 3. 監控與警報

**整合 Sentry：**
```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

### 4. 部署安全

**Vercel 環境變數設定：**
```bash
# 透過 Vercel CLI
vercel env add FIREBASE_PROJECT_ID
vercel env add FIREBASE_PRIVATE_KEY
vercel env add GOOGLE_CLIENT_SECRET
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN
```

**啟用 Vercel 的安全功能：**
- ✅ Enable HTTPS (預設啟用)
- ✅ Enable DDoS Protection
- ✅ Enable Web Application Firewall (WAF)

---

## 結論

### 整體安全狀況評估

**評分：** 6.5/10

**優點：**
- ✅ Firebase Admin SDK 初始化正確
- ✅ 大部分 API 路由有適當的權限檢查
- ✅ NextAuth 配置基本正確
- ✅ `.gitignore` 配置正確
- ✅ 沒有使用 `dangerouslySetInnerHTML`

**需要改進：**
- ❌ 硬編碼的權限控制
- ❌ 缺少 Rate Limiting
- ⚠️ 輸入驗證不夠嚴格
- ⚠️ 錯誤訊息過於詳細
- ⚠️ 缺少審計日誌

### 最後的話

作為一個「Vibe Coding」階段的專案，你已經做得不錯了。最關鍵的是：

1. **`.env.local` 沒有被提交到 Git** - 這是最常見也最致命的錯誤，你避免了
2. **大部分 API 都有權限檢查** - 顯示你有基本的安全意識
3. **使用了 NextAuth 和 Firebase Admin SDK** - 選擇了安全的工具

但在正式上線前，**請務必修復所有高風險問題**，特別是：
- 硬編碼的權限控制
- Rate Limiting
- 輸入驗證

這些問題如果不修復，上線後可能會面臨：
- 帳號被盜
- 資料外洩
- 服務被攻擊癱瘓
- 雲端費用暴增

**記住：安全不是一次性的任務，而是持續的過程。**

---

**審計完成日期：** 2025-10-14
**下次審計建議時間：** 修復高風險問題後 2 週
**聯絡方式：** 如有疑問，請參考 [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)

**祝你的專案安全上線！** 🛡️
