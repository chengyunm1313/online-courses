/**
 * 初始化 D1 訂單測試數據腳本
 * 運行: npm run db:seed:orders
 */

import "dotenv/config";
import { createOrderRecord, getCourseByIdFromStore, getOrderByMerchantTradeNo } from "../lib/d1-repository";

const TEST_USER_ID = "kCiJmyMRkehBu4mBqbPC";
const TEST_USER_NAME = "yun cheng";
const TEST_USER_EMAIL = "chengyunm1313@gmail.com";

const seedOrders = [
  {
    merchantTradeNo: "SEED-ORDER-20250114-001",
    courseId: "1",
    status: "completed" as const,
    paymentMethod: "credit_card" as const,
    transactionId: "TXN-20250114-001",
    notes: "付款成功，課程已開通",
  },
  {
    merchantTradeNo: "SEED-ORDER-20250115-001",
    courseId: "2",
    status: "pending" as const,
    paymentMethod: "bank_transfer" as const,
    transactionId: undefined,
    notes: "等待銀行轉帳確認",
  },
];

async function main() {
  console.log("開始初始化 D1 訂單測試數據...");

  for (const seed of seedOrders) {
    const existing = await getOrderByMerchantTradeNo(seed.merchantTradeNo);
    if (existing) {
      console.log(`⚠️ 已存在訂單，略過：${seed.merchantTradeNo}`);
      continue;
    }

    const course = await getCourseByIdFromStore(seed.courseId);
    if (!course) {
      throw new Error(`找不到課程：${seed.courseId}`);
    }

    const orderId = await createOrderRecord({
      userId: TEST_USER_ID,
      userName: TEST_USER_NAME,
      userEmail: TEST_USER_EMAIL,
      items: [
        {
          courseId: course.id,
          courseTitle: course.title,
          courseThumbnail: course.thumbnail,
          instructor: course.instructor.name,
          price: course.price,
        },
      ],
      subtotal: course.price,
      discountAmount: 0,
      tax: 0,
      total: course.price,
      status: seed.status,
      paymentMethod: seed.paymentMethod,
      merchantTradeNo: seed.merchantTradeNo,
      transactionId: seed.transactionId,
      notes: seed.notes,
      paidAt: seed.status === "completed" ? new Date("2025-01-14T10:31:00") : undefined,
    });

    console.log(`✅ 已建立訂單：${orderId} (${seed.merchantTradeNo})`);
  }

  console.log("\n🎉 D1 訂單測試資料初始化完成");
  console.log("1. 訪問 http://localhost:3000/orders 查看用戶訂單");
  console.log("2. 訪問 http://localhost:3000/admin/orders 查看管理員訂單管理");
}

main().catch((error) => {
  console.error("❌ 初始化失敗:", error);
  process.exit(1);
});
