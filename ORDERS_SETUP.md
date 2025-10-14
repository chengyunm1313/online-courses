# 訂單系統設置指南

## ✅ 已完成的整合

我已經將訂單系統與 Firebase 完全整合。現在訂單數據將從 Firebase Firestore 讀取，而不是使用假數據。

### 整合內容

1. **訂單數據訪問庫** ([lib/orders.ts](lib/orders.ts))
   - `getUserOrders(userId)` - 獲取用戶的訂單
   - `getAllOrders()` - 獲取所有訂單（管理員）
   - `getOrderById(orderId)` - 獲取單個訂單
   - `createOrder(orderData)` - 創建新訂單
   - `updateOrderStatus(orderId, status)` - 更新訂單狀態
   - `getOrderStats()` - 獲取訂單統計

2. **訂單 API** ([app/api/orders/route.ts](app/api/orders/route.ts))
   - GET `/api/orders` - 根據用戶角色返回訂單列表
   - 支持 `includeStats=true` 參數獲取統計數據

3. **頁面更新**
   - **用戶訂單頁面** ([app/orders/page.tsx](app/orders/page.tsx)) - Server Component，直接從 Firebase 獲取數據
   - **管理員訂單頁面** ([app/admin/orders/page.tsx](app/admin/orders/page.tsx)) - Client Component，通過 API 獲取數據

## 🎯 測試訂單功能

### 方法 1：使用 Firebase Console 手動創建訂單

1. **前往 Firebase Console**
   - 訪問：https://console.firebase.google.com/
   - 選擇專案：`online-courses-bbcae`

2. **進入 Firestore Database**
   - 左側選單選擇 "Firestore Database"
   - 點擊 "Start collection"

3. **創建 orders Collection**
   - Collection ID: `orders`
   - 點擊 "Next"

4. **添加第一個訂單文檔**

您的用戶 ID（從登入後訪問 `/auth/test` 可以看到）：
```
kCiJmyMRkehBu4mBqbPC
```

#### 訂單文檔結構：

**Document ID**: 自動生成或使用 `ORD-2025-001`

**欄位** (Fields):

```javascript
{
  userId: "kCiJmyMRkehBu4mBqbPC",  // string - 您的用戶 ID
  userName: "yun cheng",            // string
  userEmail: "chengyunm1313@gmail.com",  // string
  items: [                          // array
    {                               // map
      courseId: "1",                // string
      courseTitle: "完整 Web 開發入門：從零開始學習前端與後端",  // string
      courseThumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800",  // string
      price: 1980,                  // number
      instructor: "skypassion5000@gmail.com"  // string
    }
  ],
  subtotal: 1980,                   // number
  tax: 99,                          // number
  total: 2079,                      // number
  status: "completed",              // string (completed, pending, cancelled, refunded)
  paymentMethod: "credit_card",     // string (credit_card, paypal, bank_transfer, other)
  transactionId: "TXN-20250114-001",  // string (optional)
  createdAt: [Timestamp] 2025-01-14 10:30:00,   // timestamp
  updatedAt: [Timestamp] 2025-01-14 10:31:00,   // timestamp
  completedAt: [Timestamp] 2025-01-14 10:31:00, // timestamp (optional)
  notes: "付款成功，課程已開通"  // string (optional)
}
```

#### 快速創建欄位步驟：

1. **基本資訊**
   - `userId` (string): `kCiJmyMRkehBu4mBqbPC`
   - `userName` (string): `yun cheng`
   - `userEmail` (string): `chengyunm1313@gmail.com`

2. **訂單項目** (點擊 "Add field" → 選擇 array 類型)
   - `items` (array):
     - 點擊 array 內的 "+" 添加元素
     - 選擇 "map" 類型
     - 在 map 內添加：
       - `courseId` (string): `1`
       - `courseTitle` (string): `完整 Web 開發入門：從零開始學習前端與後端`
       - `courseThumbnail` (string): `https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800`
       - `price` (number): `1980`
       - `instructor` (string): `skypassion5000@gmail.com`

3. **金額資訊**
   - `subtotal` (number): `1980`
   - `tax` (number): `99`
   - `total` (number): `2079`

4. **訂單狀態**
   - `status` (string): `completed`
   - `paymentMethod` (string): `credit_card`
   - `transactionId` (string): `TXN-20250114-001`

5. **時間戳記**
   - `createdAt` (timestamp): 設置為當前時間
   - `updatedAt` (timestamp): 設置為當前時間
   - `completedAt` (timestamp): 設置為當前時間

6. **備註**
   - `notes` (string): `付款成功，課程已開通`

### 方法 2：使用 Firebase Admin SDK 腳本（開發中）

由於環境變數載入問題，腳本功能暫時無法使用。建議使用方法 1 手動創建測試數據。

## 🔍 驗證整合是否成功

### 1. 檢查用戶訂單頁面

1. 登入系統（訪問 `/auth/test`）
2. 點擊導航欄的「我的訂單」或訪問 `/orders`
3. **預期結果**：
   - 如果 Firestore 有訂單數據：顯示訂單列表
   - 如果 Firestore 沒有數據：顯示「沒有訂單記錄」的空狀態

### 2. 檢查管理員訂單頁面

1. 確保您的帳號有管理員權限（role: "admin"）
2. 訪問 `/admin/orders`
3. **預期結果**：
   - 顯示所有訂單列表
   - 顯示統計數據（總訂單數、總營收等）
   - 可以搜尋和過濾訂單

### 3. 檢查瀏覽器控制台

打開瀏覽器開發者工具（F12），檢查：
- 是否有 API 錯誤
- 網路請求是否成功 (`/api/orders`)

## 📊 Firestore 資料結構

### Collection: `orders`

```
orders/
  ├── ORD-2025-001/
  │   ├── userId: "kCiJmyMRkehBu4mBqbPC"
  │   ├── userName: "yun cheng"
  │   ├── userEmail: "chengyunm1313@gmail.com"
  │   ├── items: [{courseId, courseTitle, ...}]
  │   ├── total: 2079
  │   ├── status: "completed"
  │   └── ...
  └── ORD-2025-002/
      └── ...
```

### 索引設定（建議）

為了提高查詢效率，建議在 Firestore 中創建以下索引：

1. **複合索引**：
   - Collection: `orders`
   - Fields: `userId` (Ascending) + `createdAt` (Descending)

您可以在 Firebase Console → Firestore Database → Indexes 中創建。

## 🚀 後續建議

1. **創建訂單 API**
   - POST `/api/orders` - 創建新訂單
   - PATCH `/api/orders/[id]` - 更新訂單狀態

2. **訂單詳情頁面**
   - `/orders/[orderId]` - 用戶查看單筆訂單詳情
   - `/admin/orders/[orderId]` - 管理員查看訂單詳情

3. **整合付款功能**
   - 連接 Stripe 或其他付款服務
   - 實現完整的購買流程

4. **通知系統**
   - 訂單確認郵件
   - 訂單狀態變更通知

## 🔧 故障排除

### 問題 1：訂單頁面顯示空白
- **檢查**：瀏覽器控制台是否有錯誤
- **解決**：確認 Firebase 憑證設置正確

### 問題 2：看不到訂單數據
- **檢查**：Firestore 中是否有 `orders` collection
- **檢查**：訂單的 `userId` 是否與登入用戶的 ID 匹配
- **解決**：使用正確的 user ID 創建測試訂單

### 問題 3：管理員看不到統計數據
- **檢查**：用戶是否有 admin 角色
- **解決**：在 Firebase Console 更新用戶的 role 欄位為 "admin"

## 📝 範例訂單數據（JSON 格式）

您也可以使用 Firebase Console 的 "Import" 功能直接導入：

```json
{
  "userId": "kCiJmyMRkehBu4mBqbPC",
  "userName": "yun cheng",
  "userEmail": "chengyunm1313@gmail.com",
  "items": [
    {
      "courseId": "1",
      "courseTitle": "完整 Web 開發入門：從零開始學習前端與後端",
      "courseThumbnail": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800",
      "price": 1980,
      "instructor": "skypassion5000@gmail.com"
    }
  ],
  "subtotal": 1980,
  "tax": 99,
  "total": 2079,
  "status": "completed",
  "paymentMethod": "credit_card",
  "transactionId": "TXN-20250114-001",
  "notes": "付款成功，課程已開通"
}
```

**注意**：時間戳記（createdAt, updatedAt, completedAt）需要在 Firebase Console 中手動設置為 timestamp 類型。

---

## ✅ 總結

訂單系統已經完全整合 Firebase！現在您只需要：

1. 在 Firebase Console 中手動創建幾筆測試訂單
2. 使用正確的 `userId` (kCiJmyMRkehBu4mBqbPC)
3. 登入後訪問 `/orders` 查看您的訂單
4. 以管理員身份訪問 `/admin/orders` 管理所有訂單

所有數據現在都是真實的 Firebase 數據，不再是假數據！🎉
