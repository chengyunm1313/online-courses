import "dotenv/config";
import { adminDb } from "../lib/firebase-admin";
import { executeD1 } from "../lib/d1";

async function migrateUsers() {
  const snapshot = await adminDb.collection("users").get();
  for (const doc of snapshot.docs) {
    const data = doc.data() ?? {};
    await executeD1(
      `INSERT OR REPLACE INTO users (id, email, name, image, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        doc.id,
        String(data.email ?? ""),
        String(data.name ?? data.displayName ?? data.email ?? "未命名使用者"),
        typeof data.image === "string" ? data.image : typeof data.photoURL === "string" ? data.photoURL : null,
        String(data.role ?? "student"),
        new Date(data.createdAt?.toDate?.() ?? Date.now()).toISOString(),
        new Date(data.updatedAt?.toDate?.() ?? Date.now()).toISOString(),
      ],
    );
  }
}

async function migrateCourses() {
  const snapshot = await adminDb.collection("courses").get();
  for (const doc of snapshot.docs) {
    const data = doc.data() ?? {};
    await executeD1(
      `INSERT OR REPLACE INTO courses (
        id, title, description, thumbnail, price, category, level, duration, lessons,
        rating, students_enrolled, tags_json, instructor_id, instructor_name, instructor_avatar,
        instructor_bio, published, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        doc.id,
        String(data.title ?? ""),
        String(data.description ?? ""),
        typeof data.thumbnail === "string" ? data.thumbnail : null,
        Number(data.price ?? 0),
        typeof data.category === "string" ? data.category : null,
        String(data.level ?? "beginner"),
        Number(data.duration ?? 0),
        Number(data.lessons ?? 0),
        Number(data.rating ?? 0),
        Number(data.studentsEnrolled ?? 0),
        JSON.stringify(Array.isArray(data.tags) ? data.tags : []),
        typeof data.instructorId === "string" ? data.instructorId : null,
        typeof data.instructorName === "string" ? data.instructorName : null,
        typeof data.instructor?.avatar === "string" ? data.instructor.avatar : null,
        typeof data.instructor?.bio === "string" ? data.instructor.bio : null,
        data.published ? 1 : 0,
        new Date(data.createdAt?.toDate?.() ?? Date.now()).toISOString(),
        new Date(data.updatedAt?.toDate?.() ?? Date.now()).toISOString(),
      ],
    );

    const modules = Array.isArray(data.modules) ? data.modules : [];
    for (const courseModule of modules) {
      await executeD1(
        `INSERT OR REPLACE INTO course_modules (id, course_id, title, description, sort_order)
         VALUES (?, ?, ?, ?, ?)`,
        [
          String(courseModule.id ?? crypto.randomUUID()),
          doc.id,
          String(courseModule.title ?? "未命名章節"),
          typeof courseModule.description === "string" ? courseModule.description : null,
          Number(courseModule.order ?? 1),
        ],
      );

      const lessons = Array.isArray(courseModule.lessons) ? courseModule.lessons : [];
      for (const lesson of lessons) {
        await executeD1(
          `INSERT OR REPLACE INTO course_lessons (
            id, module_id, title, description, duration, video_url, preview, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            String(lesson.id ?? crypto.randomUUID()),
            String(courseModule.id),
            String(lesson.title ?? "未命名課程"),
            typeof lesson.description === "string" ? lesson.description : null,
            Number(lesson.duration ?? 0),
            typeof lesson.videoUrl === "string" ? lesson.videoUrl : null,
            lesson.preview ? 1 : 0,
            Number(lesson.order ?? 1),
          ],
        );
      }
    }
  }
}

async function migrateEnrollments() {
  const snapshot = await adminDb.collection("enrollments").get();
  for (const doc of snapshot.docs) {
    const data = doc.data() ?? {};
    await executeD1(
      `INSERT OR REPLACE INTO enrollments (
        id, user_id, course_id, order_id, course_title_snapshot, progress,
        completed_lessons_json, status, created_at, last_accessed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        doc.id,
        String(data.userId ?? ""),
        String(data.courseId ?? ""),
        typeof data.orderId === "string" ? data.orderId : null,
        typeof data.courseTitle === "string" ? data.courseTitle : null,
        Number(data.progress ?? 0),
        JSON.stringify(Array.isArray(data.completedLessons) ? data.completedLessons : []),
        String(data.status ?? "active"),
        new Date(data.createdAt?.toDate?.() ?? Date.now()).toISOString(),
        new Date(data.lastAccessed?.toDate?.() ?? Date.now()).toISOString(),
      ],
    );
  }
}

async function migrateOrders() {
  const snapshot = await adminDb.collection("orders").get();
  for (const doc of snapshot.docs) {
    const data = doc.data() ?? {};
    await executeD1(
      `INSERT OR REPLACE INTO orders (
        id, user_id, user_name, user_email, merchant_trade_no, status, payment_method,
        shipping_method, subtotal, tax, total, notes, transaction_id, ecpay_data_json,
        created_at, updated_at, paid_at, failed_at, canceled_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        doc.id,
        String(data.userId ?? ""),
        String(data.userName ?? ""),
        String(data.userEmail ?? ""),
        typeof data.merchantTradeNo === "string" ? data.merchantTradeNo : null,
        String(data.status ?? "CREATED"),
        String(data.paymentMethod ?? "CREDIT"),
        typeof data.shippingMethod === "string" ? data.shippingMethod : null,
        Number(data.subtotal ?? 0),
        Number(data.tax ?? 0),
        Number(data.total ?? 0),
        typeof data.notes === "string" ? data.notes : null,
        typeof data.transactionId === "string" ? data.transactionId : null,
        data.ecpayData ? JSON.stringify(data.ecpayData) : null,
        new Date(data.createdAt?.toDate?.() ?? Date.now()).toISOString(),
        new Date(data.updatedAt?.toDate?.() ?? Date.now()).toISOString(),
        data.paidAt?.toDate?.() ? new Date(data.paidAt.toDate()).toISOString() : null,
        data.failedAt?.toDate?.() ? new Date(data.failedAt.toDate()).toISOString() : null,
        data.canceledAt?.toDate?.() ? new Date(data.canceledAt.toDate()).toISOString() : null,
      ],
    );

    const items = Array.isArray(data.items) ? data.items : [];
    for (const item of items) {
      await executeD1(
        `INSERT OR REPLACE INTO order_items (
          id, order_id, course_id, course_title_snapshot, course_thumbnail_snapshot,
          instructor_name_snapshot, price_snapshot
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          crypto.randomUUID(),
          doc.id,
          String(item.courseId ?? ""),
          String(item.courseTitle ?? ""),
          typeof item.courseThumbnail === "string" ? item.courseThumbnail : null,
          typeof item.instructor === "string" ? item.instructor : null,
          Number(item.price ?? 0),
        ],
      );
    }
  }
}

async function main() {
  await migrateUsers();
  await migrateCourses();
  await migrateEnrollments();
  await migrateOrders();
  console.log("Firestore -> D1 遷移完成");
}

main().catch((error) => {
  console.error("遷移失敗", error);
  process.exit(1);
});
