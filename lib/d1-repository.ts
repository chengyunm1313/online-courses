import { mockCourses } from "@/lib/mock-data";
import type {
  Course,
  CourseFaqItem,
  CourseModule,
  CourseModuleItem,
  CoursePriceLadder,
  CourseSalesBlock,
  CourseSyllabus,
} from "@/types/course";
import type {
  Order,
  OrderItem,
  OrderStats,
  OrderStatus,
  PaymentMethod,
  ReconciliationStatus,
  RefundStatus,
} from "@/types/order";
import type { SupportTicket, SupportTicketCategory, SupportTicketStatus } from "@/types/support";
import { D1ConfigError, executeD1, isD1Configured, queryD1, queryFirstD1 } from "@/lib/d1";

export type AppRole = "student" | "instructor" | "admin";

interface UserRow {
  id: string;
  email: string;
  name: string;
  image: string | null;
  role: AppRole;
  created_at: string;
  updated_at: string;
}

interface CourseRow {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string | null;
  status: "draft" | "published" | "archived";
  description: string;
  thumbnail: string | null;
  og_image: string | null;
  price: number;
  original_price: number | null;
  sales_mode: "evergreen" | "launch";
  sales_status: "draft" | "waitlist" | "selling" | "closed";
  launch_starts_at: string | null;
  launch_ends_at: string | null;
  show_countdown: number;
  show_seats: number;
  seat_limit: number | null;
  sold_count_mode: "paid_orders" | "enrollments";
  lead_magnet_enabled: number;
  lead_magnet_title: string | null;
  lead_magnet_description: string | null;
  lead_magnet_coupon_code: string | null;
  category: string | null;
  level: "beginner" | "intermediate" | "advanced";
  duration: number;
  lessons: number;
  rating: number;
  students_enrolled: number;
  tags_json: string | null;
  instructor_id: string | null;
  instructor_name: string | null;
  instructor_avatar: string | null;
  instructor_bio: string | null;
  target_audience_json: string | null;
  learning_outcomes_json: string | null;
  faq_json: string | null;
  sales_blocks_json: string | null;
  seo_title: string | null;
  seo_description: string | null;
  published: number;
  created_at: string;
  updated_at: string;
}

interface CourseModuleRow {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  sort_order: number;
}

interface CourseLessonRow {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  duration: number;
  video_url: string | null;
  preview: number;
  sort_order: number;
}

interface PriceLadderRow {
  id: string;
  course_id: string;
  name: string;
  price: number;
  starts_at: string | null;
  ends_at: string | null;
  seat_limit: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface EnrollmentRow {
  id: string;
  user_id: string;
  course_id: string;
  order_id: string | null;
  course_title_snapshot: string | null;
  progress: number;
  completed_lessons_json: string | null;
  status: "active" | "completed" | "cancelled";
  created_at: string;
  last_accessed_at: string | null;
}

interface OrderRow {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  merchant_trade_no: string | null;
  status: string;
  payment_method: string;
  shipping_method: string | null;
  subtotal: number;
  discount_amount: number;
  tax: number;
  total: number;
  notes: string | null;
  transaction_id: string | null;
  ecpay_data_json: string | null;
  refund_status: RefundStatus;
  refund_reason: string | null;
  refund_note: string | null;
  refund_requested_at: string | null;
  refunded_at: string | null;
  reconciliation_status: ReconciliationStatus;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  failed_at: string | null;
  canceled_at: string | null;
}

interface OrderItemRow {
  id: string;
  order_id: string;
  course_id: string;
  course_title_snapshot: string;
  course_thumbnail_snapshot: string | null;
  instructor_name_snapshot: string | null;
  price_snapshot: number;
}

interface OrderEventRow {
  id: string;
  order_id: string;
  type: string;
  event_key: string | null;
  payload_json: string | null;
  created_at: string;
}

interface DiscountRow {
  id: string;
  code: string;
  type: "percentage" | "amount";
  value: number;
  description: string | null;
  starts_at: string | null;
  ends_at: string | null;
  usage_limit: number | null;
  per_user_limit: number | null;
  minimum_amount: number;
  course_ids_json: string | null;
  enabled: number;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

interface LessonProgressRow {
  id: string;
  user_id: string;
  course_id: string;
  lesson_id: string;
  completed_at: string | null;
  last_position: number;
  created_at: string;
  updated_at: string;
}

interface SupportTicketRow {
  id: string;
  name: string;
  email: string;
  category: SupportTicketCategory;
  subject: string;
  message: string;
  order_id: string | null;
  status: SupportTicketStatus;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

interface LeadRow {
  id: string;
  course_id: string;
  email: string;
  name: string | null;
  source: string;
  coupon_code: string | null;
  status: string;
  user_id: string | null;
  payload_json: string | null;
  created_at: string;
  updated_at: string;
}

interface WaitlistRow {
  id: string;
  course_id: string;
  email: string;
  name: string | null;
  source: string;
  status: string;
  user_id: string | null;
  payload_json: string | null;
  created_at: string;
  updated_at: string;
}

export interface DiscountRecord {
  id: string;
  code: string;
  type: "percentage" | "amount";
  value: number;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  usageLimit?: number;
  perUserLimit?: number;
  minimumAmount: number;
  courseIds: string[];
  enabled: boolean;
  usageCount: number;
}

export interface AnalyticsEventInput {
  eventName: string;
  userId?: string;
  sessionId?: string;
  courseId?: string;
  orderId?: string;
  discountCode?: string;
  paymentMethod?: string;
  amount?: number;
  payload?: Record<string, unknown>;
}

export interface LeadRecord {
  id: string;
  courseId: string;
  email: string;
  name?: string;
  source: string;
  couponCode?: string;
  status: string;
  userId?: string;
  payload?: Record<string, unknown>;
  createdAt: string;
}

export interface WaitlistRecord {
  id: string;
  courseId: string;
  email: string;
  name?: string;
  source: string;
  status: string;
  userId?: string;
  payload?: Record<string, unknown>;
  createdAt: string;
}

export interface LeadRecordInput {
  courseId: string;
  email: string;
  name?: string;
  source: string;
  couponCode?: string;
  status?: string;
  userId?: string;
  payload?: Record<string, unknown>;
}

export interface WaitlistRecordInput {
  courseId: string;
  email: string;
  name?: string;
  source: string;
  status?: string;
  userId?: string;
  payload?: Record<string, unknown>;
}

export interface CheckoutFunnelMetrics {
  purchasePageViews: number;
  discountApplied: number;
  checkoutStarted: number;
  ordersCreated: number;
  paymentsSucceeded: number;
  leadSubmitted: number;
  waitlistJoined: number;
  couponPopupShown: number;
  couponPopupClaimed: number;
  countdownClicked: number;
}

function mapSupportTicket(row: SupportTicketRow): SupportTicket {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    category: row.category,
    subject: row.subject,
    message: row.message,
    orderId: row.order_id ?? undefined,
    status: row.status,
    userId: row.user_id ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

const PLACEHOLDER_THUMBNAIL =
  "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=800";
const DEFAULT_INSTRUCTOR_ID = "demo-instructor-skypassion5000";
const DEFAULT_INSTRUCTOR_EMAIL = "skypassion5000@gmail.com";
const DEFAULT_ADMIN_ID = "demo-admin-chengyunm1313";
const DEFAULT_ADMIN_EMAIL = "chengyunm1313@gmail.com";

let seedPromise: Promise<void> | null = null;

function nowIso(): string {
  return new Date().toISOString();
}

function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map((item) => String(item));
  } catch {
    return [];
  }
}

function parseJsonTypedArray<T>(value: string | null | undefined): T[] {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function parseJsonObject<T>(value: string | null | undefined): T | undefined {
  if (!value) {
    return undefined;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

function stringifyJson(value: unknown): string {
  return JSON.stringify(value);
}

function toCourseSyllabusFromModuleLesson(
  lesson: CourseModuleItem,
  order: number,
): CourseSyllabus {
  return {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description ?? "",
    duration: lesson.duration,
    order,
    videoUrl: lesson.videoUrl,
    preview: lesson.preview,
  };
}

function buildSyllabus(modules: CourseModule[]): CourseSyllabus[] {
  let order = 1;
  return modules.flatMap((module) =>
    module.lessons.map((lesson) => {
      const syllabus = toCourseSyllabusFromModuleLesson(lesson, order);
      order += 1;
      return syllabus;
    }),
  );
}

function mapPriceLadderRow(row: PriceLadderRow): CoursePriceLadder {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price ?? 0),
    startsAt: row.starts_at ?? undefined,
    endsAt: row.ends_at ?? undefined,
    seatLimit: typeof row.seat_limit === "number" ? row.seat_limit : undefined,
    sortOrder: Number(row.sort_order ?? 1),
  };
}

function mapCourseRow(
  row: CourseRow,
  modules: CourseModule[],
  priceLadders: CoursePriceLadder[],
): Course {
  const syllabus = buildSyllabus(modules);
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    slug: row.slug ?? undefined,
    description: row.description,
    thumbnail: row.thumbnail ?? PLACEHOLDER_THUMBNAIL,
    ogImage: row.og_image ?? undefined,
    instructor: {
      id: row.instructor_id ?? DEFAULT_INSTRUCTOR_ID,
      name: row.instructor_name ?? "未設定講師",
      avatar: row.instructor_avatar ?? PLACEHOLDER_THUMBNAIL,
      bio: row.instructor_bio ?? "",
    },
    price: Number(row.price ?? 0),
    originalPrice: typeof row.original_price === "number" ? Number(row.original_price) : undefined,
    category: row.category ?? "未分類",
    level: row.level ?? "beginner",
    duration: Number(row.duration ?? 0),
    lessons: Number(row.lessons ?? syllabus.length),
    rating: Number(row.rating ?? 0),
    studentsEnrolled: Number(row.students_enrolled ?? 0),
    syllabus,
    modules,
    tags: parseJsonArray(row.tags_json),
    status: row.status ?? (row.published ? "published" : "draft"),
    salesMode: row.sales_mode ?? "evergreen",
    salesStatus: row.sales_status ?? "draft",
    launchStartsAt: row.launch_starts_at ?? undefined,
    launchEndsAt: row.launch_ends_at ?? undefined,
    showCountdown: Boolean(row.show_countdown),
    showSeats: Boolean(row.show_seats),
    seatLimit: typeof row.seat_limit === "number" ? row.seat_limit : undefined,
    soldCountMode: row.sold_count_mode ?? "enrollments",
    leadMagnetEnabled: Boolean(row.lead_magnet_enabled),
    leadMagnetTitle: row.lead_magnet_title ?? undefined,
    leadMagnetDescription: row.lead_magnet_description ?? undefined,
    leadMagnetCouponCode: row.lead_magnet_coupon_code ?? undefined,
    priceLadders,
    targetAudience: parseJsonArray(row.target_audience_json),
    learningOutcomes: parseJsonArray(row.learning_outcomes_json),
    faq: parseJsonTypedArray<CourseFaqItem>(row.faq_json),
    salesBlocks: parseJsonTypedArray<CourseSalesBlock>(row.sales_blocks_json),
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    published: Boolean(row.published),
  };
}

async function listCourseRows(): Promise<CourseRow[]> {
  return queryD1<CourseRow>(
    `SELECT * FROM courses ORDER BY updated_at DESC`,
  );
}

async function listCourseModules(courseIds: string[]): Promise<Map<string, CourseModule[]>> {
  if (courseIds.length === 0) {
    return new Map();
  }

  const placeholders = courseIds.map(() => "?").join(", ");
  const moduleRows = await queryD1<CourseModuleRow>(
    `SELECT * FROM course_modules WHERE course_id IN (${placeholders}) ORDER BY sort_order ASC`,
    courseIds,
  );

  const lessonRows = await queryD1<CourseLessonRow>(
    `SELECT l.*
     FROM course_lessons l
     INNER JOIN course_modules m ON m.id = l.module_id
     WHERE m.course_id IN (${placeholders})
     ORDER BY l.sort_order ASC`,
    courseIds,
  );

  const lessonsByModule = new Map<string, CourseModuleItem[]>();
  for (const row of lessonRows) {
    const lessons = lessonsByModule.get(row.module_id) ?? [];
    lessons.push({
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      duration: Number(row.duration ?? 0),
      order: Number(row.sort_order ?? lessons.length + 1),
      videoUrl: row.video_url ?? undefined,
      preview: Boolean(row.preview),
    });
    lessonsByModule.set(row.module_id, lessons);
  }

  const modulesByCourse = new Map<string, CourseModule[]>();
  for (const row of moduleRows) {
    const modules = modulesByCourse.get(row.course_id) ?? [];
    modules.push({
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      order: Number(row.sort_order ?? modules.length + 1),
      lessons: (lessonsByModule.get(row.id) ?? []).map((lesson, index) => ({
        ...lesson,
        order: index + 1,
      })),
    });
    modulesByCourse.set(row.course_id, modules);
  }

  return modulesByCourse;
}

async function listCoursePriceLadders(courseIds: string[]): Promise<Map<string, CoursePriceLadder[]>> {
  if (courseIds.length === 0) {
    return new Map();
  }

  const placeholders = courseIds.map(() => "?").join(", ");
  const rows = await queryD1<PriceLadderRow>(
    `SELECT * FROM price_ladders WHERE course_id IN (${placeholders}) ORDER BY sort_order ASC, created_at ASC`,
    courseIds,
  );

  const map = new Map<string, CoursePriceLadder[]>();
  for (const row of rows) {
    const items = map.get(row.course_id) ?? [];
    items.push(mapPriceLadderRow(row));
    map.set(row.course_id, items);
  }
  return map;
}

async function seedDefaultUsers(): Promise<void> {
  const now = nowIso();
  await executeD1(
    `INSERT OR IGNORE INTO users (id, email, name, image, role, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      DEFAULT_INSTRUCTOR_ID,
      DEFAULT_INSTRUCTOR_EMAIL,
      DEFAULT_INSTRUCTOR_EMAIL,
      "https://api.dicebear.com/7.x/avataaars/svg?seed=DemoInstructor",
      "instructor",
      now,
      now,
    ],
  );

  await executeD1(
    `INSERT OR IGNORE INTO users (id, email, name, image, role, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      DEFAULT_ADMIN_ID,
      DEFAULT_ADMIN_EMAIL,
      DEFAULT_ADMIN_EMAIL,
      "https://api.dicebear.com/7.x/avataaars/svg?seed=AdminUser",
      "admin",
      now,
      now,
    ],
  );
}

async function seedMockCourses(): Promise<void> {
  const existing = await queryFirstD1<{ count: number }>(
    `SELECT COUNT(*) AS count FROM courses`,
  );
  if (Number(existing?.count ?? 0) > 0) {
    return;
  }

  for (const course of mockCourses.filter((item) => item.published)) {
    const createdAt = course.createdAt instanceof Date ? course.createdAt.toISOString() : new Date(course.createdAt).toISOString();
    const updatedAt = course.updatedAt instanceof Date ? course.updatedAt.toISOString() : new Date(course.updatedAt).toISOString();

    await executeD1(
      `INSERT OR REPLACE INTO courses (
        id, title, subtitle, slug, status, description, thumbnail, og_image, price, original_price,
        sales_mode, sales_status, launch_starts_at, launch_ends_at, show_countdown, show_seats, seat_limit,
        sold_count_mode, lead_magnet_enabled, lead_magnet_title, lead_magnet_description, lead_magnet_coupon_code,
        category, level, duration, lessons, rating, students_enrolled, tags_json, instructor_id, instructor_name, instructor_avatar,
        instructor_bio, target_audience_json, learning_outcomes_json, faq_json, sales_blocks_json,
        seo_title, seo_description, published, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        course.id,
        course.title,
        course.subtitle ?? null,
        course.slug ?? course.id,
        course.status ?? (course.published ? "published" : "draft"),
        course.description,
        course.thumbnail,
        course.ogImage ?? null,
        course.price,
        course.originalPrice ?? course.price,
        course.salesMode ?? "evergreen",
        course.salesStatus ?? (course.published ? "selling" : "draft"),
        course.launchStartsAt ?? null,
        course.launchEndsAt ?? null,
        course.showCountdown ? 1 : 0,
        course.showSeats ? 1 : 0,
        course.seatLimit ?? null,
        course.soldCountMode ?? "enrollments",
        course.leadMagnetEnabled ? 1 : 0,
        course.leadMagnetTitle ?? null,
        course.leadMagnetDescription ?? null,
        course.leadMagnetCouponCode ?? null,
        course.category,
        course.level,
        course.duration,
        course.lessons,
        course.rating,
        course.studentsEnrolled,
        stringifyJson(course.tags),
        DEFAULT_INSTRUCTOR_ID,
        course.instructor.name,
        course.instructor.avatar,
        course.instructor.bio,
        stringifyJson(course.targetAudience ?? []),
        stringifyJson(course.learningOutcomes ?? []),
        stringifyJson(course.faq ?? []),
        stringifyJson(course.salesBlocks ?? []),
        course.seoTitle ?? null,
        course.seoDescription ?? null,
        course.published ? 1 : 0,
        createdAt,
        updatedAt,
      ],
    );

    for (const courseModule of course.modules) {
      await executeD1(
        `INSERT OR REPLACE INTO course_modules (id, course_id, title, description, sort_order)
         VALUES (?, ?, ?, ?, ?)`,
        [
          courseModule.id,
          course.id,
          courseModule.title,
          courseModule.description ?? null,
          courseModule.order,
        ],
      );

      for (const lesson of courseModule.lessons) {
        await executeD1(
          `INSERT OR REPLACE INTO course_lessons (
            id, module_id, title, description, duration, video_url, preview, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            lesson.id,
            courseModule.id,
            lesson.title,
            lesson.description ?? null,
            lesson.duration,
            lesson.videoUrl ?? null,
            lesson.preview ? 1 : 0,
            lesson.order,
          ],
        );
      }
    }
  }
}

async function seedDefaultDiscounts(): Promise<void> {
  const existing = await queryFirstD1<{ count: number }>(
    `SELECT COUNT(*) AS count FROM discounts`,
  );
  if (Number(existing?.count ?? 0) > 0) {
    return;
  }
  const now = nowIso();
  const defaults: Array<Omit<DiscountRecord, "id" | "usageCount">> = [
    {
      code: "WELCOME10",
      type: "percentage",
      value: 10,
      description: "新會員九折優惠",
      minimumAmount: 0,
      courseIds: [],
      enabled: true,
    },
    {
      code: "STUDENT200",
      type: "amount",
      value: 200,
      description: "學生專屬折抵 NT$200",
      minimumAmount: 0,
      courseIds: [],
      enabled: true,
    },
    {
      code: "VIP500",
      type: "amount",
      value: 500,
      description: "VIP 折抵 NT$500",
      minimumAmount: 0,
      courseIds: [],
      enabled: true,
    },
  ];

  for (const discount of defaults) {
    await executeD1(
      `INSERT OR IGNORE INTO discounts (
        id, code, type, value, description, starts_at, ends_at, usage_limit, per_user_limit,
        minimum_amount, course_ids_json, enabled, usage_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        crypto.randomUUID(),
        discount.code,
        discount.type,
        discount.value,
        discount.description ?? null,
        null,
        null,
        null,
        null,
        discount.minimumAmount,
        stringifyJson(discount.courseIds),
        discount.enabled ? 1 : 0,
        0,
        now,
        now,
      ],
    );
  }
}

export async function ensureD1Seeded(): Promise<void> {
  if (!isD1Configured()) {
    return;
  }

  if (!seedPromise) {
    seedPromise = (async () => {
      try {
        await seedDefaultUsers();
        await seedMockCourses();
        await seedDefaultDiscounts();
      } catch (error) {
        if (error instanceof D1ConfigError) {
          return;
        }
        throw error;
      }
    })();
  }

  await seedPromise;
}

export interface AppUser {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: AppRole;
  createdAt: string;
  updatedAt: string;
}

function mapUserRow(row: UserRow): AppUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    image: row.image ?? undefined,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function ensureAppUser(input: {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}): Promise<AppUser> {
  await ensureD1Seeded();

  if (!isD1Configured()) {
    return {
      id: input.id,
      email: input.email,
      name: input.name ?? input.email,
      image: input.image ?? undefined,
      role: "student",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
  }

  const now = nowIso();
  const existing = await queryFirstD1<UserRow>(
    `SELECT * FROM users WHERE id = ? LIMIT 1`,
    [input.id],
  );
  const existingByEmail = existing
    ? null
    : await queryFirstD1<UserRow>(
        `SELECT * FROM users WHERE email = ? LIMIT 1`,
        [input.email],
      );

  if (!existing && !existingByEmail) {
    await executeD1(
      `INSERT INTO users (id, email, name, image, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        input.id,
        input.email,
        input.name ?? input.email,
        input.image ?? null,
        "student",
        now,
        now,
      ],
    );
  } else if (existingByEmail) {
    await executeD1(
      `UPDATE users
       SET id = ?, email = ?, name = ?, image = ?, updated_at = ?
       WHERE id = ?`,
      [
        input.id,
        input.email,
        input.name ?? existingByEmail.name,
        input.image ?? existingByEmail.image,
        now,
        existingByEmail.id,
      ],
    );
  } else {
    const matchedUser = existing;
    if (!matchedUser) {
      throw new Error("更新使用者失敗");
    }
    await executeD1(
      `UPDATE users
       SET email = ?, name = ?, image = ?, updated_at = ?
       WHERE id = ?`,
      [
        input.email,
        input.name ?? matchedUser.name,
        input.image ?? matchedUser.image,
        now,
        input.id,
      ],
    );
  }

  const user = await queryFirstD1<UserRow>(
    `SELECT * FROM users WHERE id = ? LIMIT 1`,
    [input.id],
  );

  if (!user) {
    throw new Error("建立使用者失敗");
  }

  return mapUserRow(user);
}

export async function getAppUserById(userId: string): Promise<AppUser | null> {
  await ensureD1Seeded();

  if (!isD1Configured()) {
    return null;
  }

  const row = await queryFirstD1<UserRow>(
    `SELECT * FROM users WHERE id = ? LIMIT 1`,
    [userId],
  );
  return row ? mapUserRow(row) : null;
}

export async function listAppUsers(): Promise<AppUser[]> {
  await ensureD1Seeded();
  if (!isD1Configured()) {
    return [];
  }
  const rows = await queryD1<UserRow>(`SELECT * FROM users ORDER BY created_at DESC`);
  return rows.map(mapUserRow);
}

export async function updateAppUserRole(userId: string, role: AppRole): Promise<void> {
  const now = nowIso();
  await executeD1(
    `UPDATE users SET role = ?, updated_at = ? WHERE id = ?`,
    [role, now, userId],
  );
}

export async function getPublishedCoursesFromStore(): Promise<Course[]> {
  await ensureD1Seeded();

  if (!isD1Configured()) {
    return mockCourses.filter((course) => course.published);
  }

  const rows = await queryD1<CourseRow>(
    `SELECT * FROM courses WHERE published = 1 ORDER BY updated_at DESC`,
  );
  const modulesMap = await listCourseModules(rows.map((row) => row.id));
  const priceLaddersMap = await listCoursePriceLadders(rows.map((row) => row.id));
  return rows.map((row) => mapCourseRow(row, modulesMap.get(row.id) ?? [], priceLaddersMap.get(row.id) ?? []));
}

export async function listAllCoursesFromStore(): Promise<Course[]> {
  await ensureD1Seeded();

  if (!isD1Configured()) {
    return mockCourses;
  }

  const rows = await listCourseRows();
  const modulesMap = await listCourseModules(rows.map((row) => row.id));
  const priceLaddersMap = await listCoursePriceLadders(rows.map((row) => row.id));
  return rows.map((row) => mapCourseRow(row, modulesMap.get(row.id) ?? [], priceLaddersMap.get(row.id) ?? []));
}

export async function getCourseByIdFromStore(courseId: string): Promise<Course | null> {
  await ensureD1Seeded();

  if (!isD1Configured()) {
    return mockCourses.find((course) => course.id === courseId) ?? null;
  }

  const row = await queryFirstD1<CourseRow>(
    `SELECT * FROM courses WHERE id = ? LIMIT 1`,
    [courseId],
  );
  if (!row) {
    return null;
  }

  const modulesMap = await listCourseModules([courseId]);
  const priceLaddersMap = await listCoursePriceLadders([courseId]);
  return mapCourseRow(row, modulesMap.get(courseId) ?? [], priceLaddersMap.get(courseId) ?? []);
}

export interface OrderDraftItem {
  courseId: string;
  courseTitle: string;
  courseThumbnail: string;
  instructor: string;
  price: number;
}

export interface OrderDraft {
  userId: string;
  userName: string;
  userEmail: string;
  items: OrderDraftItem[];
  subtotal: number;
  discountAmount: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  shippingMethod?: "HOME" | "STORE";
  merchantTradeNo?: string;
  transactionId?: string;
  notes?: string;
  ecpayData?: Record<string, unknown>;
  paidAt?: Date;
  failedAt?: Date;
  canceledAt?: Date;
  refundStatus?: RefundStatus;
  refundReason?: string;
  refundNote?: string;
  refundRequestedAt?: Date;
  refundedAt?: Date;
  reconciliationStatus?: ReconciliationStatus;
}

function mapOrder(
  row: OrderRow,
  items: OrderItem[],
): Order {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    items,
    subtotal: Number(row.subtotal ?? 0),
    discountAmount: Number(row.discount_amount ?? 0),
    tax: Number(row.tax ?? 0),
    total: Number(row.total ?? 0),
    status: row.status as OrderStatus,
    paymentMethod: row.payment_method as PaymentMethod,
    shippingMethod: (row.shipping_method as "HOME" | "STORE" | undefined) ?? undefined,
    merchantTradeNo: row.merchant_trade_no ?? undefined,
    transactionId: row.transaction_id ?? undefined,
    notes: row.notes ?? undefined,
    ecpayData: parseJsonObject<Order["ecpayData"]>(row.ecpay_data_json),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    paidAt: row.paid_at ? new Date(row.paid_at) : undefined,
    failedAt: row.failed_at ? new Date(row.failed_at) : undefined,
    canceledAt: row.canceled_at ? new Date(row.canceled_at) : undefined,
    completedAt: row.paid_at ? new Date(row.paid_at) : undefined,
    refundStatus: row.refund_status ?? "none",
    refundReason: row.refund_reason ?? undefined,
    refundNote: row.refund_note ?? undefined,
    refundRequestedAt: row.refund_requested_at ? new Date(row.refund_requested_at) : undefined,
    refundedAt: row.refunded_at ? new Date(row.refunded_at) : undefined,
    reconciliationStatus: row.reconciliation_status ?? "pending",
  };
}

async function getOrderItemMap(orderIds: string[]): Promise<Map<string, OrderItem[]>> {
  if (orderIds.length === 0) {
    return new Map();
  }
  const placeholders = orderIds.map(() => "?").join(", ");
  const rows = await queryD1<OrderItemRow>(
    `SELECT * FROM order_items WHERE order_id IN (${placeholders}) ORDER BY id ASC`,
    orderIds,
  );
  const map = new Map<string, OrderItem[]>();
  for (const row of rows) {
    const items = map.get(row.order_id) ?? [];
    items.push({
      courseId: row.course_id,
      courseTitle: row.course_title_snapshot,
      courseThumbnail: row.course_thumbnail_snapshot ?? PLACEHOLDER_THUMBNAIL,
      price: Number(row.price_snapshot ?? 0),
      instructor: row.instructor_name_snapshot ?? "未設定講師",
    });
    map.set(row.order_id, items);
  }
  return map;
}

export async function createOrderRecord(input: OrderDraft): Promise<string> {
  await ensureD1Seeded();
  const id = crypto.randomUUID();
  const now = nowIso();

  await executeD1(
    `INSERT INTO orders (
      id, user_id, user_name, user_email, merchant_trade_no, status, payment_method,
      shipping_method, subtotal, discount_amount, tax, total, notes, transaction_id, ecpay_data_json,
      refund_status, refund_reason, refund_note, refund_requested_at, refunded_at, reconciliation_status,
      created_at, updated_at, paid_at, failed_at, canceled_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.userId,
      input.userName,
      input.userEmail,
      input.merchantTradeNo ?? null,
      input.status,
      input.paymentMethod,
      input.shippingMethod ?? null,
      input.subtotal,
      input.discountAmount,
      input.tax,
      input.total,
      input.notes ?? null,
      input.transactionId ?? null,
      input.ecpayData ? stringifyJson(input.ecpayData) : null,
      input.refundStatus ?? "none",
      input.refundReason ?? null,
      input.refundNote ?? null,
      input.refundRequestedAt ? input.refundRequestedAt.toISOString() : null,
      input.refundedAt ? input.refundedAt.toISOString() : null,
      input.reconciliationStatus ?? "pending",
      now,
      now,
      input.paidAt ? input.paidAt.toISOString() : null,
      input.failedAt ? input.failedAt.toISOString() : null,
      input.canceledAt ? input.canceledAt.toISOString() : null,
    ],
  );

  for (const item of input.items) {
    await executeD1(
      `INSERT INTO order_items (
        id, order_id, course_id, course_title_snapshot, course_thumbnail_snapshot,
        instructor_name_snapshot, price_snapshot
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        crypto.randomUUID(),
        id,
        item.courseId,
        item.courseTitle,
        item.courseThumbnail,
        item.instructor,
        item.price,
      ],
    );
  }

  return id;
}

export async function getOrderByIdFromStore(orderId: string): Promise<Order | null> {
  const row = await queryFirstD1<OrderRow>(
    `SELECT * FROM orders WHERE id = ? LIMIT 1`,
    [orderId],
  );
  if (!row) {
    return null;
  }
  const itemMap = await getOrderItemMap([orderId]);
  return mapOrder(row, itemMap.get(orderId) ?? []);
}

export async function getOrderByMerchantTradeNo(
  merchantTradeNo: string,
): Promise<Order | null> {
  const row = await queryFirstD1<OrderRow>(
    `SELECT * FROM orders WHERE merchant_trade_no = ? LIMIT 1`,
    [merchantTradeNo],
  );
  if (!row) {
    return null;
  }
  const itemMap = await getOrderItemMap([row.id]);
  return mapOrder(row, itemMap.get(row.id) ?? []);
}

export async function listOrdersFromStore(userId?: string): Promise<Order[]> {
  const rows = userId
    ? await queryD1<OrderRow>(
        `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
        [userId],
      )
    : await queryD1<OrderRow>(
        `SELECT * FROM orders ORDER BY created_at DESC LIMIT 200`,
      );
  const itemMap = await getOrderItemMap(rows.map((row) => row.id));
  return rows.map((row) => mapOrder(row, itemMap.get(row.id) ?? []));
}

export async function updateOrderRecord(
  orderId: string,
  updates: Partial<{
    status: OrderStatus;
    notes: string;
    transactionId: string;
    ecpayData: Record<string, unknown>;
    paidAt: Date;
    failedAt: Date;
    canceledAt: Date;
    refundStatus: RefundStatus;
    refundReason: string;
    refundNote: string;
    refundRequestedAt: Date;
    refundedAt: Date;
    reconciliationStatus: ReconciliationStatus;
  }>,
): Promise<void> {
  const existing = await queryFirstD1<OrderRow>(
    `SELECT * FROM orders WHERE id = ? LIMIT 1`,
    [orderId],
  );
  if (!existing) {
    throw new Error("找不到訂單");
  }

  await executeD1(
    `UPDATE orders
     SET status = ?, notes = ?, transaction_id = ?, ecpay_data_json = ?, paid_at = ?, failed_at = ?, canceled_at = ?,
         refund_status = ?, refund_reason = ?, refund_note = ?, refund_requested_at = ?, refunded_at = ?, reconciliation_status = ?, updated_at = ?
     WHERE id = ?`,
    [
      updates.status ?? existing.status,
      updates.notes ?? existing.notes,
      updates.transactionId ?? existing.transaction_id,
      updates.ecpayData ? stringifyJson(updates.ecpayData) : existing.ecpay_data_json,
      updates.paidAt ? updates.paidAt.toISOString() : existing.paid_at,
      updates.failedAt ? updates.failedAt.toISOString() : existing.failed_at,
      updates.canceledAt ? updates.canceledAt.toISOString() : existing.canceled_at,
      updates.refundStatus ?? existing.refund_status,
      updates.refundReason ?? existing.refund_reason,
      updates.refundNote ?? existing.refund_note,
      updates.refundRequestedAt ? updates.refundRequestedAt.toISOString() : existing.refund_requested_at,
      updates.refundedAt ? updates.refundedAt.toISOString() : existing.refunded_at,
      updates.reconciliationStatus ?? existing.reconciliation_status,
      nowIso(),
      orderId,
    ],
  );
}

export async function getOrderStatsFromStore(): Promise<OrderStats> {
  const orders = await listOrdersFromStore();
  const paidOrders = orders.filter((order) => order.status === "PAID" || order.status === "completed");
  return {
    totalOrders: orders.length,
    totalRevenue: paidOrders.reduce((sum, order) => sum + order.total, 0),
    pendingOrders: orders.filter((order) => order.status === "CREATED" || order.status === "pending").length,
    completedOrders: paidOrders.length,
    averageOrderValue:
      paidOrders.length > 0
        ? paidOrders.reduce((sum, order) => sum + order.total, 0) / paidOrders.length
        : 0,
  };
}

export async function hasOrderEvent(eventKey: string): Promise<boolean> {
  const row = await queryFirstD1<{ count: number }>(
    `SELECT COUNT(*) AS count FROM order_events WHERE event_key = ?`,
    [eventKey],
  );
  return Number(row?.count ?? 0) > 0;
}

export async function createOrderEvent(input: {
  orderId: string;
  type: string;
  eventKey?: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await executeD1(
    `INSERT INTO order_events (id, order_id, type, event_key, payload_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      crypto.randomUUID(),
      input.orderId,
      input.type,
      input.eventKey ?? null,
      input.payload ? stringifyJson(input.payload) : null,
      nowIso(),
    ],
  );
}

export async function getEnrollmentByUserAndCourse(
  userId: string,
  courseId: string,
): Promise<EnrollmentRow | null> {
  return queryFirstD1<EnrollmentRow>(
    `SELECT * FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1`,
    [userId, courseId],
  );
}

export async function createEnrollmentRecord(input: {
  userId: string;
  courseId: string;
  orderId?: string;
  courseTitleSnapshot?: string;
}): Promise<string> {
  const existing = await getEnrollmentByUserAndCourse(input.userId, input.courseId);
  if (existing) {
    return existing.id;
  }
  const id = `${input.userId}_${input.courseId}`;
  const now = nowIso();
  await executeD1(
    `INSERT INTO enrollments (
      id, user_id, course_id, order_id, course_title_snapshot, progress,
      completed_lessons_json, status, created_at, last_accessed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.userId,
      input.courseId,
      input.orderId ?? null,
      input.courseTitleSnapshot ?? null,
      0,
      stringifyJson([]),
      "active",
      now,
      now,
    ],
  );
  await executeD1(
    `UPDATE courses
     SET students_enrolled = students_enrolled + 1, updated_at = ?
     WHERE id = ?`,
    [now, input.courseId],
  );
  return id;
}

export async function touchEnrollment(input: {
  userId: string;
  courseId: string;
  completedLessons?: string[];
}): Promise<void> {
  const existing = await getEnrollmentByUserAndCourse(input.userId, input.courseId);
  if (!existing) {
    return;
  }
  const lessons = input.completedLessons ?? parseJsonArray(existing.completed_lessons_json);
  await executeD1(
    `UPDATE enrollments
     SET completed_lessons_json = ?, last_accessed_at = ?
     WHERE id = ?`,
    [stringifyJson(lessons), nowIso(), existing.id],
  );
}

export async function listLessonProgressForUserCourse(
  userId: string,
  courseId: string,
): Promise<LessonProgressRow[]> {
  return queryD1<LessonProgressRow>(
    `SELECT * FROM lesson_progress WHERE user_id = ? AND course_id = ? ORDER BY updated_at DESC`,
    [userId, courseId],
  );
}

export async function upsertLessonProgress(input: {
  userId: string;
  courseId: string;
  lessonId: string;
  completed: boolean;
  lastPosition?: number;
}): Promise<void> {
  const existing = await queryFirstD1<LessonProgressRow>(
    `SELECT * FROM lesson_progress WHERE user_id = ? AND course_id = ? AND lesson_id = ? LIMIT 1`,
    [input.userId, input.courseId, input.lessonId],
  );
  const now = nowIso();

  if (existing) {
    await executeD1(
      `UPDATE lesson_progress
       SET completed_at = ?, last_position = ?, updated_at = ?
       WHERE id = ?`,
      [
        input.completed ? now : null,
        input.lastPosition ?? existing.last_position,
        now,
        existing.id,
      ],
    );
  } else {
    await executeD1(
      `INSERT INTO lesson_progress (
        id, user_id, course_id, lesson_id, completed_at, last_position, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        crypto.randomUUID(),
        input.userId,
        input.courseId,
        input.lessonId,
        input.completed ? now : null,
        input.lastPosition ?? 0,
        now,
        now,
      ],
    );
  }

  const progressRows = await listLessonProgressForUserCourse(input.userId, input.courseId);
  const completedLessons = progressRows
    .filter((row) => Boolean(row.completed_at))
    .map((row) => row.lesson_id);
  await touchEnrollment({
    userId: input.userId,
    courseId: input.courseId,
    completedLessons,
  });
}

function mapDiscountRow(row: DiscountRow): DiscountRecord {
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    value: Number(row.value ?? 0),
    description: row.description ?? undefined,
    startsAt: row.starts_at ?? undefined,
    endsAt: row.ends_at ?? undefined,
    usageLimit: row.usage_limit ?? undefined,
    perUserLimit: row.per_user_limit ?? undefined,
    minimumAmount: Number(row.minimum_amount ?? 0),
    courseIds: parseJsonArray(row.course_ids_json),
    enabled: Boolean(row.enabled),
    usageCount: Number(row.usage_count ?? 0),
  };
}

export async function listDiscountsFromStore(): Promise<DiscountRecord[]> {
  await ensureD1Seeded();
  if (!isD1Configured()) {
    return [];
  }
  const rows = await queryD1<DiscountRow>(`SELECT * FROM discounts ORDER BY updated_at DESC`);
  return rows.map(mapDiscountRow);
}

export async function getDiscountByCodeFromStore(code: string): Promise<DiscountRecord | null> {
  await ensureD1Seeded();
  if (!isD1Configured()) {
    return null;
  }
  const row = await queryFirstD1<DiscountRow>(
    `SELECT * FROM discounts WHERE code = ? LIMIT 1`,
    [code.toUpperCase()],
  );
  return row ? mapDiscountRow(row) : null;
}

export async function createDiscountRecord(input: Omit<DiscountRecord, "id" | "usageCount">): Promise<string> {
  const id = crypto.randomUUID();
  const now = nowIso();
  await executeD1(
    `INSERT INTO discounts (
      id, code, type, value, description, starts_at, ends_at, usage_limit, per_user_limit,
      minimum_amount, course_ids_json, enabled, usage_count, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.code.toUpperCase(),
      input.type,
      input.value,
      input.description ?? null,
      input.startsAt ?? null,
      input.endsAt ?? null,
      input.usageLimit ?? null,
      input.perUserLimit ?? null,
      input.minimumAmount,
      stringifyJson(input.courseIds),
      input.enabled ? 1 : 0,
      0,
      now,
      now,
    ],
  );
  return id;
}

export async function updateDiscountRecord(
  id: string,
  input: Partial<Omit<DiscountRecord, "id" | "usageCount">>,
): Promise<void> {
  const existing = await queryFirstD1<DiscountRow>(`SELECT * FROM discounts WHERE id = ? LIMIT 1`, [id]);
  if (!existing) {
    throw new Error("找不到折扣碼");
  }
  await executeD1(
    `UPDATE discounts
     SET code = ?, type = ?, value = ?, description = ?, starts_at = ?, ends_at = ?, usage_limit = ?,
         per_user_limit = ?, minimum_amount = ?, course_ids_json = ?, enabled = ?, updated_at = ?
     WHERE id = ?`,
    [
      input.code?.toUpperCase() ?? existing.code,
      input.type ?? existing.type,
      input.value ?? existing.value,
      input.description ?? existing.description,
      input.startsAt ?? existing.starts_at,
      input.endsAt ?? existing.ends_at,
      input.usageLimit ?? existing.usage_limit,
      input.perUserLimit ?? existing.per_user_limit,
      input.minimumAmount ?? existing.minimum_amount,
      input.courseIds ? stringifyJson(input.courseIds) : existing.course_ids_json,
      typeof input.enabled === "boolean" ? (input.enabled ? 1 : 0) : existing.enabled,
      nowIso(),
      id,
    ],
  );
}

export async function incrementDiscountUsage(id: string): Promise<void> {
  await executeD1(
    `UPDATE discounts SET usage_count = usage_count + 1, updated_at = ? WHERE id = ?`,
    [nowIso(), id],
  );
}

export async function listEnrollmentsByUser(userId: string): Promise<EnrollmentRow[]> {
  return queryD1<EnrollmentRow>(
    `SELECT * FROM enrollments WHERE user_id = ? ORDER BY created_at DESC`,
    [userId],
  );
}

export async function createCourseRecord(input: {
  title: string;
  subtitle?: string;
  slug?: string;
  status: "draft" | "published" | "archived";
  description: string;
  thumbnail?: string;
  ogImage?: string;
  price: number;
  originalPrice?: number;
  salesMode: "evergreen" | "launch";
  salesStatus: "draft" | "waitlist" | "selling" | "closed";
  launchStartsAt?: string;
  launchEndsAt?: string;
  showCountdown: boolean;
  showSeats: boolean;
  seatLimit?: number;
  soldCountMode: "paid_orders" | "enrollments";
  leadMagnetEnabled: boolean;
  leadMagnetTitle?: string;
  leadMagnetDescription?: string;
  leadMagnetCouponCode?: string;
  priceLadders: CoursePriceLadder[];
  category?: string;
  level: "beginner" | "intermediate" | "advanced";
  duration: number;
  lessons: number;
  tags: string[];
  published: boolean;
  instructorId: string;
  instructorName: string;
  instructorAvatar?: string;
  instructorBio?: string;
  targetAudience: string[];
  learningOutcomes: string[];
  faq: CourseFaqItem[];
  salesBlocks: CourseSalesBlock[];
  seoTitle?: string;
  seoDescription?: string;
  modules: CourseModule[];
}): Promise<string> {
  const id = crypto.randomUUID();
  const now = nowIso();
  await executeD1(
      `INSERT INTO courses (
      id, title, subtitle, slug, status, description, thumbnail, og_image, price, original_price,
      sales_mode, sales_status, launch_starts_at, launch_ends_at, show_countdown, show_seats, seat_limit,
      sold_count_mode, lead_magnet_enabled, lead_magnet_title, lead_magnet_description, lead_magnet_coupon_code,
      category, level, duration, lessons, rating, students_enrolled, tags_json, instructor_id, instructor_name, instructor_avatar,
      instructor_bio, target_audience_json, learning_outcomes_json, faq_json, sales_blocks_json,
      seo_title, seo_description, published, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.title,
      input.subtitle ?? null,
      input.slug ?? id,
      input.status,
      input.description,
      input.thumbnail ?? null,
      input.ogImage ?? null,
      input.price,
      input.originalPrice ?? input.price,
      input.salesMode,
      input.salesStatus,
      input.launchStartsAt ?? null,
      input.launchEndsAt ?? null,
      input.showCountdown ? 1 : 0,
      input.showSeats ? 1 : 0,
      input.seatLimit ?? null,
      input.soldCountMode,
      input.leadMagnetEnabled ? 1 : 0,
      input.leadMagnetTitle ?? null,
      input.leadMagnetDescription ?? null,
      input.leadMagnetCouponCode ?? null,
      input.category ?? null,
      input.level,
      input.duration,
      input.lessons,
      0,
      0,
      stringifyJson(input.tags),
      input.instructorId,
      input.instructorName,
      input.instructorAvatar ?? null,
      input.instructorBio ?? null,
      stringifyJson(input.targetAudience),
      stringifyJson(input.learningOutcomes),
      stringifyJson(input.faq),
      stringifyJson(input.salesBlocks),
      input.seoTitle ?? null,
      input.seoDescription ?? null,
      input.status === "published" ? 1 : 0,
      now,
      now,
    ],
  );
  await replaceCourseModules(id, input.modules);
  await replacePriceLadders(id, input.priceLadders);
  return id;
}

export async function replacePriceLadders(courseId: string, priceLadders: CoursePriceLadder[]): Promise<void> {
  await executeD1(`DELETE FROM price_ladders WHERE course_id = ?`, [courseId]);
  const now = nowIso();
  for (const ladder of priceLadders) {
    await executeD1(
      `INSERT INTO price_ladders (
        id, course_id, name, price, starts_at, ends_at, seat_limit, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ladder.id || crypto.randomUUID(),
        courseId,
        ladder.name,
        ladder.price,
        ladder.startsAt ?? null,
        ladder.endsAt ?? null,
        ladder.seatLimit ?? null,
        ladder.sortOrder,
        now,
        now,
      ],
    );
  }
}

export async function replaceCourseModules(courseId: string, modules: CourseModule[]): Promise<void> {
  const existingModules = await queryD1<CourseModuleRow>(
    `SELECT id FROM course_modules WHERE course_id = ?`,
    [courseId],
  );
  for (const existingModule of existingModules) {
    await executeD1(`DELETE FROM course_lessons WHERE module_id = ?`, [existingModule.id]);
  }
  await executeD1(`DELETE FROM course_modules WHERE course_id = ?`, [courseId]);

  for (const courseModule of modules) {
    await executeD1(
      `INSERT INTO course_modules (id, course_id, title, description, sort_order)
       VALUES (?, ?, ?, ?, ?)`,
      [
        courseModule.id || crypto.randomUUID(),
        courseId,
        courseModule.title,
        courseModule.description ?? null,
        courseModule.order,
      ],
    );
    for (const lesson of courseModule.lessons) {
      await executeD1(
        `INSERT INTO course_lessons (
          id, module_id, title, description, duration, video_url, preview, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          lesson.id || crypto.randomUUID(),
          courseModule.id,
          lesson.title,
          lesson.description ?? null,
          lesson.duration,
          lesson.videoUrl ?? null,
          lesson.preview ? 1 : 0,
          lesson.order,
        ],
      );
    }
  }
}

export async function createAnalyticsEvent(input: AnalyticsEventInput): Promise<void> {
  await executeD1(
    `INSERT INTO analytics_events (
      id, event_name, user_id, session_id, course_id, order_id, discount_code,
      payment_method, amount, payload_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      crypto.randomUUID(),
      input.eventName,
      input.userId ?? null,
      input.sessionId ?? null,
      input.courseId ?? null,
      input.orderId ?? null,
      input.discountCode ?? null,
      input.paymentMethod ?? null,
      typeof input.amount === "number" ? input.amount : null,
      input.payload ? stringifyJson(input.payload) : null,
      nowIso(),
    ],
  );
}

export async function getCheckoutFunnelMetrics(days = 30): Promise<CheckoutFunnelMetrics> {
  const startAt = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const rows = await queryD1<{ event_name: string; count: number }>(
    `SELECT event_name, COUNT(*) AS count
     FROM analytics_events
     WHERE created_at >= ?
       AND event_name IN (
         'purchase_page_view',
         'lead_submitted',
         'waitlist_joined',
         'discount_applied',
         'coupon_popup_shown',
         'coupon_popup_claimed',
         'countdown_clicked',
         'checkout_started',
         'order_created',
         'payment_succeeded'
       )
     GROUP BY event_name`,
    [startAt],
  );

  const counts = new Map(rows.map((row) => [row.event_name, Number(row.count ?? 0)]));
  return {
    purchasePageViews: counts.get("purchase_page_view") ?? 0,
    leadSubmitted: counts.get("lead_submitted") ?? 0,
    waitlistJoined: counts.get("waitlist_joined") ?? 0,
    discountApplied: counts.get("discount_applied") ?? 0,
    couponPopupShown: counts.get("coupon_popup_shown") ?? 0,
    couponPopupClaimed: counts.get("coupon_popup_claimed") ?? 0,
    countdownClicked: counts.get("countdown_clicked") ?? 0,
    checkoutStarted: counts.get("checkout_started") ?? 0,
    ordersCreated: counts.get("order_created") ?? 0,
    paymentsSucceeded: counts.get("payment_succeeded") ?? 0,
  };
}

function mapLeadRow(row: LeadRow): LeadRecord {
  return {
    id: row.id,
    courseId: row.course_id,
    email: row.email,
    name: row.name ?? undefined,
    source: row.source,
    couponCode: row.coupon_code ?? undefined,
    status: row.status,
    userId: row.user_id ?? undefined,
    payload: row.payload_json ? parseJsonObject(row.payload_json) : undefined,
    createdAt: row.created_at,
  };
}

function mapWaitlistRow(row: WaitlistRow): WaitlistRecord {
  return {
    id: row.id,
    courseId: row.course_id,
    email: row.email,
    name: row.name ?? undefined,
    source: row.source,
    status: row.status,
    userId: row.user_id ?? undefined,
    payload: row.payload_json ? parseJsonObject(row.payload_json) : undefined,
    createdAt: row.created_at,
  };
}

export async function createLeadRecord(input: LeadRecordInput): Promise<LeadRecord> {
  const id = crypto.randomUUID();
  const now = nowIso();
  const normalizedEmail = input.email.trim().toLowerCase();
  await executeD1(
    `INSERT INTO leads (
      id, course_id, email, name, source, coupon_code, status, user_id, payload_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.courseId,
      normalizedEmail,
      input.name?.trim() || null,
      input.source,
      input.couponCode?.trim().toUpperCase() || null,
      input.status ?? "new",
      input.userId ?? null,
      input.payload ? stringifyJson(input.payload) : null,
      now,
      now,
    ],
  );

  return mapLeadRow({
    id,
    course_id: input.courseId,
    email: normalizedEmail,
    name: input.name?.trim() || null,
    source: input.source,
    coupon_code: input.couponCode?.trim().toUpperCase() || null,
    status: input.status ?? "new",
    user_id: input.userId ?? null,
    payload_json: input.payload ? stringifyJson(input.payload) : null,
    created_at: now,
    updated_at: now,
  });
}

export async function createWaitlistRecord(
  input: WaitlistRecordInput,
): Promise<WaitlistRecord> {
  const email = input.email.trim().toLowerCase();
  const existing = await queryFirstD1<WaitlistRow>(
    `SELECT * FROM waitlists WHERE course_id = ? AND email = ? LIMIT 1`,
    [input.courseId, email],
  );
  const now = nowIso();

  if (existing) {
    await executeD1(
      `UPDATE waitlists
       SET name = ?, source = ?, status = ?, user_id = ?, payload_json = ?, updated_at = ?
       WHERE id = ?`,
      [
        input.name?.trim() || existing.name,
        input.source,
        input.status ?? existing.status,
        input.userId ?? existing.user_id,
        input.payload ? stringifyJson(input.payload) : existing.payload_json,
        now,
        existing.id,
      ],
    );

    return mapWaitlistRow({
      ...existing,
      name: input.name?.trim() || existing.name,
      source: input.source,
      status: input.status ?? existing.status,
      user_id: input.userId ?? existing.user_id,
      payload_json: input.payload ? stringifyJson(input.payload) : existing.payload_json,
      updated_at: now,
    });
  }

  const id = crypto.randomUUID();
  await executeD1(
    `INSERT INTO waitlists (
      id, course_id, email, name, source, status, user_id, payload_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.courseId,
      email,
      input.name?.trim() || null,
      input.source,
      input.status ?? "waiting",
      input.userId ?? null,
      input.payload ? stringifyJson(input.payload) : null,
      now,
      now,
    ],
  );

  return {
    id,
    courseId: input.courseId,
    email,
    name: input.name?.trim() || undefined,
    source: input.source,
    status: input.status ?? "waiting",
    userId: input.userId,
    payload: input.payload,
    createdAt: now,
  };
}

export async function createSupportTicket(input: {
  name: string;
  email: string;
  category: SupportTicketCategory;
  subject: string;
  message: string;
  orderId?: string;
  userId?: string;
}): Promise<string> {
  const id = crypto.randomUUID();
  const now = nowIso();
  await executeD1(
    `INSERT INTO support_tickets (
      id, name, email, category, subject, message, order_id, status, user_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name,
      input.email,
      input.category,
      input.subject,
      input.message,
      input.orderId ?? null,
      "open",
      input.userId ?? null,
      now,
      now,
    ],
  );
  return id;
}

export async function listSupportTickets(): Promise<SupportTicket[]> {
  const rows = await queryD1<SupportTicketRow>(
    `SELECT * FROM support_tickets ORDER BY created_at DESC LIMIT 200`,
  );
  return rows.map(mapSupportTicket);
}

export async function updateCourseRecord(input: {
  id: string;
  title: string;
  subtitle?: string;
  slug?: string;
  status: "draft" | "published" | "archived";
  description: string;
  thumbnail?: string;
  ogImage?: string;
  price: number;
  originalPrice?: number;
  salesMode: "evergreen" | "launch";
  salesStatus: "draft" | "waitlist" | "selling" | "closed";
  launchStartsAt?: string;
  launchEndsAt?: string;
  showCountdown: boolean;
  showSeats: boolean;
  seatLimit?: number;
  soldCountMode: "paid_orders" | "enrollments";
  leadMagnetEnabled: boolean;
  leadMagnetTitle?: string;
  leadMagnetDescription?: string;
  leadMagnetCouponCode?: string;
  priceLadders: CoursePriceLadder[];
  category?: string;
  level: "beginner" | "intermediate" | "advanced";
  duration: number;
  lessons: number;
  tags: string[];
  published: boolean;
  instructorId: string;
  instructorName: string;
  instructorAvatar?: string;
  instructorBio?: string;
  targetAudience: string[];
  learningOutcomes: string[];
  faq: CourseFaqItem[];
  salesBlocks: CourseSalesBlock[];
  seoTitle?: string;
  seoDescription?: string;
  modules: CourseModule[];
}): Promise<void> {
  await executeD1(
    `UPDATE courses
     SET title = ?, subtitle = ?, slug = ?, status = ?, description = ?, thumbnail = ?, og_image = ?, price = ?, original_price = ?,
         sales_mode = ?, sales_status = ?, launch_starts_at = ?, launch_ends_at = ?, show_countdown = ?, show_seats = ?, seat_limit = ?,
         sold_count_mode = ?, lead_magnet_enabled = ?, lead_magnet_title = ?, lead_magnet_description = ?, lead_magnet_coupon_code = ?,
         category = ?, level = ?, duration = ?, lessons = ?, tags_json = ?, published = ?, instructor_id = ?, instructor_name = ?, instructor_avatar = ?,
         instructor_bio = ?, target_audience_json = ?, learning_outcomes_json = ?, faq_json = ?, sales_blocks_json = ?,
         seo_title = ?, seo_description = ?, updated_at = ?
     WHERE id = ?`,
    [
      input.title,
      input.subtitle ?? null,
      input.slug ?? input.id,
      input.status,
      input.description,
      input.thumbnail ?? null,
      input.ogImage ?? null,
      input.price,
      input.originalPrice ?? input.price,
      input.salesMode,
      input.salesStatus,
      input.launchStartsAt ?? null,
      input.launchEndsAt ?? null,
      input.showCountdown ? 1 : 0,
      input.showSeats ? 1 : 0,
      input.seatLimit ?? null,
      input.soldCountMode,
      input.leadMagnetEnabled ? 1 : 0,
      input.leadMagnetTitle ?? null,
      input.leadMagnetDescription ?? null,
      input.leadMagnetCouponCode ?? null,
      input.category ?? null,
      input.level,
      input.duration,
      input.lessons,
      stringifyJson(input.tags),
      input.status === "published" ? 1 : 0,
      input.instructorId,
      input.instructorName,
      input.instructorAvatar ?? null,
      input.instructorBio ?? null,
      stringifyJson(input.targetAudience),
      stringifyJson(input.learningOutcomes),
      stringifyJson(input.faq),
      stringifyJson(input.salesBlocks),
      input.seoTitle ?? null,
      input.seoDescription ?? null,
      nowIso(),
      input.id,
    ],
  );
  await replaceCourseModules(input.id, input.modules);
  await replacePriceLadders(input.id, input.priceLadders);
}

export async function deleteCourseRecord(courseId: string): Promise<void> {
  const modules = await queryD1<CourseModuleRow>(
    `SELECT id FROM course_modules WHERE course_id = ?`,
    [courseId],
  );
  for (const existingModule of modules) {
    await executeD1(`DELETE FROM course_lessons WHERE module_id = ?`, [existingModule.id]);
  }
  await executeD1(`DELETE FROM course_modules WHERE course_id = ?`, [courseId]);
  await executeD1(`DELETE FROM courses WHERE id = ?`, [courseId]);
}

export async function listInstructorUsers(): Promise<AppUser[]> {
  const rows = await queryD1<UserRow>(
    `SELECT * FROM users WHERE role IN ('instructor', 'admin') ORDER BY name ASC`,
  );
  return rows.map(mapUserRow);
}

export async function listOrderEvents(limit = 50): Promise<OrderEventRow[]> {
  return queryD1<OrderEventRow>(
    `SELECT * FROM order_events ORDER BY created_at DESC LIMIT ?`,
    [limit],
  );
}
