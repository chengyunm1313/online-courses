/**
 * 初始化 Firebase 訂單測試數據腳本
 * 運行: npx tsx scripts/seed-orders.ts
 */

import dotenv from "dotenv";
import { resolve } from "path";

// 載入 .env.local 文件
dotenv.config({ path: resolve(__dirname, "../.env.local") });

import { adminDb } from "../lib/firebase-admin";
import type { Order } from "../types/order";

const testOrders: Omit<Order, "id">[] = [
  {
    userId: "kCiJmyMRkehBu4mBqbPC", // 您的實際用戶 ID (從 auth/test 頁面獲取)
    userName: "yun cheng",
    userEmail: "chengyunm1313@gmail.com",
    items: [
      {
        courseId: "1",
        courseTitle: "完整 Web 開發入門：從零開始學習前端與後端",
        courseThumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800",
        price: 1980,
        instructor: "skypassion5000@gmail.com"
      }
    ],
    subtotal: 1980,
    tax: 99,
    total: 2079,
    status: "completed",
    paymentMethod: "credit_card",
    transactionId: "TXN-20250114-001",
    createdAt: new Date("2025-01-14T10:30:00"),
    updatedAt: new Date("2025-01-14T10:31:00"),
    completedAt: new Date("2025-01-14T10:31:00"),
    notes: "付款成功，課程已開通"
  },
  {
    userId: "kCiJmyMRkehBu4mBqbPC",
    userName: "yun cheng",
    userEmail: "chengyunm1313@gmail.com",
    items: [
      {
        courseId: "2",
        courseTitle: "Python 數據分析完整攻略：從入門到實戰應用",
        courseThumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800",
        price: 2480,
        instructor: "skypassion5000@gmail.com"
      }
    ],
    subtotal: 2480,
    tax: 124,
    total: 2604,
    status: "pending",
    paymentMethod: "bank_transfer",
    createdAt: new Date("2025-01-15T14:20:00"),
    updatedAt: new Date("2025-01-15T14:20:00"),
    notes: "等待銀行轉帳確認"
  }
];

async function seedOrders() {
  console.log("開始初始化訂單數據...");

  try {
    // 檢查是否已有訂單
    const existingOrders = await adminDb.collection("orders").limit(1).get();
    if (!existingOrders.empty) {
      console.log("⚠️  已有訂單數據存在。");
      console.log("如果要重新初始化，請先手動刪除 Firestore 中的 orders collection。");
      return;
    }

    // 創建測試訂單
    for (const order of testOrders) {
      const orderRef = await adminDb.collection("orders").add(order);
      console.log(`✅ 已創建訂單: ${orderRef.id}`);
    }

    console.log("\n🎉 訂單數據初始化完成！");
    console.log(`總共創建了 ${testOrders.length} 筆訂單`);
    console.log("\n提示：");
    console.log("1. 訪問 http://localhost:3000/orders 查看用戶訂單");
    console.log("2. 訪問 http://localhost:3000/admin/orders 查看管理員訂單管理");
  } catch (error) {
    console.error("❌ 初始化失敗:", error);
    throw error;
  }
}

// 執行腳本
seedOrders()
  .then(() => {
    console.log("\n✅ 腳本執行完成");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ 腳本執行失敗:", error);
    process.exit(1);
  });
