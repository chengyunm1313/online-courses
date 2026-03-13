import type { CourseModule, CoursePriceLadder } from "@/types/course";
import {
  getCheckoutFunnelMetrics,
  createDiscountRecord,
  createCourseRecord,
  deleteCourseRecord,
  type DiscountRecord,
  getCourseByIdFromStore,
  getDiscountByCodeFromStore,
  getAppUserById,
  listDiscountsFromStore,
  listAllCoursesFromStore,
  listAppUsers,
  listInstructorUsers,
  listOrderEvents,
  listOrdersFromStore,
  updateDiscountRecord,
  updateCourseRecord,
} from "@/lib/d1-repository";

export interface AdminDashboardStats {
  totalCourses: number;
  totalStudents: number;
  totalInstructors: number;
  totalRevenue: number;
  totalEnrollments: number;
  averageRating: number;
}

export interface AdminCourseSummary {
  id: string;
  title: string;
  subtitle?: string;
  slug?: string;
  price: number;
  enrollmentCount: number;
  instructorName: string;
  published: boolean;
  status: "draft" | "published" | "archived";
  updatedAt?: string;
  category?: string;
  level?: string;
}

export interface AdminCourseDetail extends AdminCourseSummary {
  description: string;
  thumbnail?: string;
  ogImage?: string;
  duration?: number;
  lessons?: number;
  tags: string[];
  instructorId: string;
  modules: AdminCourseModule[];
  targetAudience: string[];
  learningOutcomes: string[];
  faq: { question: string; answer: string }[];
  salesBlocks: { title: string; content: string }[];
  seoTitle?: string;
  seoDescription?: string;
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
}

export interface AdminCourseLesson {
  id: string;
  title: string;
  description?: string;
  duration: number;
  order: number;
  videoUrl?: string;
  preview?: boolean;
}

export interface AdminCourseModule {
  id: string;
  title: string;
  description?: string;
  order: number;
  lessons: AdminCourseLesson[];
}

export interface AdminInstructorSummary {
  id: string;
  name: string;
  email?: string;
  courseCount: number;
  role: string;
}

export interface AdminUserSummary {
  id: string;
  name?: string;
  email?: string;
  role: string;
  image?: string;
  createdAt?: string;
}

export interface AdminDashboardData {
  stats: AdminDashboardStats;
  courseSummaries: AdminCourseSummary[];
  instructorSummaries: AdminInstructorSummary[];
  users: AdminUserSummary[];
}

export interface AdminCourseInput {
  title: string;
  subtitle?: string;
  slug?: string;
  status?: "draft" | "published" | "archived";
  description?: string;
  thumbnail?: string;
  ogImage?: string;
  price?: number;
  category?: string;
  level?: "beginner" | "intermediate" | "advanced";
  duration?: number;
  lessons?: number;
  tags?: string[];
  published?: boolean;
  instructorId?: string;
  targetAudience?: string[];
  learningOutcomes?: string[];
  faq?: { question: string; answer: string }[];
  salesBlocks?: { title: string; content: string }[];
  seoTitle?: string;
  seoDescription?: string;
  originalPrice?: number;
  salesMode?: "evergreen" | "launch";
  salesStatus?: "draft" | "waitlist" | "selling" | "closed";
  launchStartsAt?: string;
  launchEndsAt?: string;
  showCountdown?: boolean;
  showSeats?: boolean;
  seatLimit?: number;
  soldCountMode?: "paid_orders" | "enrollments";
  leadMagnetEnabled?: boolean;
  leadMagnetTitle?: string;
  leadMagnetDescription?: string;
  leadMagnetCouponCode?: string;
  priceLadders?: CoursePriceLadder[];
  modules?: AdminCourseModule[];
  syllabus?: AdminCourseLesson[];
}

export interface AdminDiscountInput {
  code: string;
  type: "percentage" | "amount";
  value: number;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  usageLimit?: number;
  perUserLimit?: number;
  minimumAmount?: number;
  courseIds?: string[];
  enabled?: boolean;
}

export interface RevenueByMonth {
  month: string;
  revenue: number;
  enrollments: number;
}

export interface DailyEnrollment {
  date: string;
  count: number;
}

export interface ActivityItem {
  id: string;
  type: "enrollment" | "course" | "user";
  title: string;
  description: string;
  timestamp: string;
}

export interface AdminReportData {
  kpis: {
    grossRevenue: number;
    netRevenue: number;
    discountGiven: number;
    paymentSuccessRate: number;
    refundRate: number;
    paidOrderCount: number;
    refundedOrderCount: number;
  };
  funnel: {
    purchasePageViews: number;
    leadSubmitted: number;
    waitlistJoined: number;
    discountApplied: number;
    couponPopupShown: number;
    couponPopupClaimed: number;
    countdownClicked: number;
    checkoutStarted: number;
    ordersCreated: number;
    paymentsSucceeded: number;
    purchaseToCheckoutRate: number;
    checkoutToPaidRate: number;
  };
  revenueByMonth: RevenueByMonth[];
  dailyEnrollments: DailyEnrollment[];
  topCoursesByRevenue: (AdminCourseSummary & { revenue: number })[];
  topDiscounts: Array<{
    id: string;
    code: string;
    usageCount: number;
    valueLabel: string;
    enabled: boolean;
  }>;
  categoryBreakdown: {
    category: string;
    courseCount: number;
    enrollmentCount: number;
  }[];
}

interface RoleContext {
  role: string;
  userId: string;
}

export function normalizeAdminCourseInput(body: Record<string, unknown>): AdminCourseInput {
  const tagsRaw = body.tags;
  const tags = Array.isArray(tagsRaw)
    ? tagsRaw
    : typeof tagsRaw === "string"
      ? tagsRaw.split(",")
      : [];

  const modules = Array.isArray(body.modules)
    ? (body.modules as AdminCourseModule[])
    : [];
  const syllabus = Array.isArray(body.syllabus)
    ? (body.syllabus as AdminCourseLesson[])
    : [];
  const targetAudience = Array.isArray(body.targetAudience)
    ? body.targetAudience
    : typeof body.targetAudience === "string"
      ? body.targetAudience.split("\n")
      : [];
  const learningOutcomes = Array.isArray(body.learningOutcomes)
    ? body.learningOutcomes
    : typeof body.learningOutcomes === "string"
      ? body.learningOutcomes.split("\n")
      : [];
  const faq = Array.isArray(body.faq) ? body.faq : [];
  const salesBlocks = Array.isArray(body.salesBlocks) ? body.salesBlocks : [];
  const priceLadders = Array.isArray(body.priceLadders) ? body.priceLadders : [];

  return {
    title: String(body.title ?? "").trim(),
    subtitle: typeof body.subtitle === "string" ? body.subtitle.trim() : "",
    slug: typeof body.slug === "string" ? body.slug.trim() : "",
    status:
      body.status === "draft" || body.status === "published" || body.status === "archived"
        ? body.status
        : Boolean(body.published)
          ? "published"
          : "draft",
    description: typeof body.description === "string" ? body.description.trim() : "",
    thumbnail: typeof body.thumbnail === "string" ? body.thumbnail.trim() : "",
    ogImage: typeof body.ogImage === "string" ? body.ogImage.trim() : "",
    price: Number(body.price ?? 0) || 0,
    category: typeof body.category === "string" ? body.category.trim() : "",
    level:
      body.level === "beginner" || body.level === "intermediate" || body.level === "advanced"
        ? body.level
        : "beginner",
    duration: Number(body.duration ?? 0) || 0,
    lessons: Number(body.lessons ?? 0) || 0,
    tags: tags.map((tag) => String(tag).trim()).filter(Boolean),
    published: Boolean(body.published),
    instructorId: typeof body.instructorId === "string" ? body.instructorId : undefined,
    targetAudience: targetAudience.map((item) => String(item).trim()).filter(Boolean),
    learningOutcomes: learningOutcomes.map((item) => String(item).trim()).filter(Boolean),
    faq: faq
      .map((item) => ({
        question: typeof item === "object" && item && "question" in item ? String(item.question).trim() : "",
        answer: typeof item === "object" && item && "answer" in item ? String(item.answer).trim() : "",
      }))
      .filter((item) => item.question && item.answer),
    salesBlocks: salesBlocks
      .map((item) => ({
        title: typeof item === "object" && item && "title" in item ? String(item.title).trim() : "",
        content: typeof item === "object" && item && "content" in item ? String(item.content).trim() : "",
      }))
      .filter((item) => item.title && item.content),
    seoTitle: typeof body.seoTitle === "string" ? body.seoTitle.trim() : "",
    seoDescription: typeof body.seoDescription === "string" ? body.seoDescription.trim() : "",
    originalPrice: Number(body.originalPrice ?? 0) || undefined,
    salesMode: body.salesMode === "launch" ? "launch" : "evergreen",
    salesStatus:
      body.salesStatus === "waitlist" ||
      body.salesStatus === "selling" ||
      body.salesStatus === "closed" ||
      body.salesStatus === "draft"
        ? body.salesStatus
        : Boolean(body.published)
          ? "selling"
          : "draft",
    launchStartsAt: typeof body.launchStartsAt === "string" ? body.launchStartsAt : "",
    launchEndsAt: typeof body.launchEndsAt === "string" ? body.launchEndsAt : "",
    showCountdown: body.showCountdown === true,
    showSeats: body.showSeats === true,
    seatLimit: Number(body.seatLimit ?? 0) || undefined,
    soldCountMode: body.soldCountMode === "paid_orders" ? "paid_orders" : "enrollments",
    leadMagnetEnabled: body.leadMagnetEnabled === true,
    leadMagnetTitle:
      typeof body.leadMagnetTitle === "string" ? body.leadMagnetTitle.trim() : "",
    leadMagnetDescription:
      typeof body.leadMagnetDescription === "string"
        ? body.leadMagnetDescription.trim()
        : "",
    leadMagnetCouponCode:
      typeof body.leadMagnetCouponCode === "string"
        ? body.leadMagnetCouponCode.trim().toUpperCase()
        : "",
    priceLadders: priceLadders
      .map((item, index) => ({
        id:
          typeof item === "object" && item && "id" in item
            ? String(item.id || "").trim()
            : "",
        name:
          typeof item === "object" && item && "name" in item
            ? String(item.name || "").trim()
            : "",
        price:
          typeof item === "object" && item && "price" in item
            ? Number(item.price ?? 0) || 0
            : 0,
        startsAt:
          typeof item === "object" && item && "startsAt" in item && typeof item.startsAt === "string"
            ? item.startsAt
            : undefined,
        endsAt:
          typeof item === "object" && item && "endsAt" in item && typeof item.endsAt === "string"
            ? item.endsAt
            : undefined,
        seatLimit:
          typeof item === "object" && item && "seatLimit" in item
            ? Number(item.seatLimit ?? 0) || undefined
            : undefined,
        sortOrder:
          typeof item === "object" && item && "sortOrder" in item
            ? Number(item.sortOrder ?? index + 1) || index + 1
            : index + 1,
      }))
      .filter((item) => item.name && item.price > 0),
    modules,
    syllabus,
  };
}

export function normalizeAdminDiscountInput(body: Record<string, unknown>): AdminDiscountInput {
  const courseIds = Array.isArray(body.courseIds)
    ? body.courseIds
    : typeof body.courseIds === "string"
      ? body.courseIds.split(",")
      : [];

  return {
    code: String(body.code ?? "").trim().toUpperCase(),
    type: body.type === "percentage" ? "percentage" : "amount",
    value: Number(body.value ?? 0) || 0,
    description: typeof body.description === "string" ? body.description.trim() : "",
    startsAt: typeof body.startsAt === "string" ? body.startsAt : "",
    endsAt: typeof body.endsAt === "string" ? body.endsAt : "",
    usageLimit: Number(body.usageLimit ?? 0) || undefined,
    perUserLimit: Number(body.perUserLimit ?? 0) || undefined,
    minimumAmount: Number(body.minimumAmount ?? 0) || 0,
    courseIds: courseIds.map((item) => String(item).trim()).filter(Boolean),
    enabled: body.enabled !== false,
  };
}

function buildModules(input: AdminCourseInput): CourseModule[] {
  if ((input.modules ?? []).length > 0) {
    return (input.modules ?? []).map((module, moduleIndex) => ({
      id: module.id || `module-${moduleIndex + 1}`,
      title: module.title || `章節 ${moduleIndex + 1}`,
      description: module.description,
      order: module.order || moduleIndex + 1,
      lessons: (module.lessons ?? []).map((lesson, lessonIndex) => ({
        id: lesson.id || `lesson-${moduleIndex + 1}-${lessonIndex + 1}`,
        title: lesson.title,
        description: lesson.description,
        duration: Number(lesson.duration ?? 0),
        order: lesson.order || lessonIndex + 1,
        videoUrl: lesson.videoUrl,
        preview: Boolean(lesson.preview),
      })),
    }));
  }

  if ((input.syllabus ?? []).length > 0) {
    const syllabus = input.syllabus ?? [];
    return [
      {
        id: "module-1",
        title: "課程內容",
        order: 1,
        lessons: syllabus.map((lesson, lessonIndex) => ({
          id: lesson.id || `lesson-${lessonIndex + 1}`,
          title: lesson.title,
          description: lesson.description,
          duration: Number(lesson.duration ?? 0),
          order: lesson.order || lessonIndex + 1,
          videoUrl: lesson.videoUrl,
          preview: Boolean(lesson.preview),
        })),
      },
    ];
  }

  return [];
}

function deriveDuration(modules: CourseModule[], fallback = 0): number {
  const totalMinutes = modules.reduce(
    (sum, module) =>
      sum + module.lessons.reduce((moduleSum, lesson) => moduleSum + lesson.duration, 0),
    0,
  );
  return totalMinutes > 0 ? Number((totalMinutes / 60).toFixed(1)) : fallback;
}

function deriveLessons(modules: CourseModule[], fallback = 0): number {
  const total = modules.reduce((sum, module) => sum + module.lessons.length, 0);
  return total > 0 ? total : fallback;
}

function ensureCanEditCourse(course: { instructor: { id: string } }, context: RoleContext) {
  if (context.role === "admin") {
    return;
  }

  if (context.role === "instructor" && course.instructor.id === context.userId) {
    return;
  }

  throw new Error("沒有權限操作此課程");
}

function mapCourseSummary(course: NonNullable<Awaited<ReturnType<typeof getCourseByIdFromStore>>>, enrollmentCount = 0): AdminCourseSummary {
  return {
    id: course.id,
    title: course.title,
    subtitle: course.subtitle,
    slug: course.slug,
    price: course.price,
    enrollmentCount,
    instructorName: course.instructor.name,
    published: course.published,
    status: course.status,
    updatedAt: course.updatedAt.toISOString(),
    category: course.category,
    level: course.level,
  };
}

function mapCourseDetail(
  course: NonNullable<Awaited<ReturnType<typeof getCourseByIdFromStore>>>,
  enrollmentCount = 0,
): AdminCourseDetail {
  return {
    ...mapCourseSummary(course, enrollmentCount),
    description: course.description,
    thumbnail: course.thumbnail,
    ogImage: course.ogImage,
    duration: course.duration,
    lessons: course.lessons,
    tags: course.tags,
    instructorId: course.instructor.id,
    modules: course.modules.map((module) => ({
      ...module,
      lessons: module.lessons.map((lesson) => ({ ...lesson })),
    })),
    targetAudience: course.targetAudience,
    learningOutcomes: course.learningOutcomes,
    faq: course.faq,
    salesBlocks: course.salesBlocks,
    seoTitle: course.seoTitle,
    seoDescription: course.seoDescription,
    originalPrice: course.originalPrice,
    salesMode: course.salesMode,
    salesStatus: course.salesStatus,
    launchStartsAt: course.launchStartsAt,
    launchEndsAt: course.launchEndsAt,
    showCountdown: course.showCountdown,
    showSeats: course.showSeats,
    seatLimit: course.seatLimit,
    soldCountMode: course.soldCountMode,
    leadMagnetEnabled: course.leadMagnetEnabled,
    leadMagnetTitle: course.leadMagnetTitle,
    leadMagnetDescription: course.leadMagnetDescription,
    leadMagnetCouponCode: course.leadMagnetCouponCode,
    priceLadders: course.priceLadders,
  };
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const [courses, users, orders] = await Promise.all([
    listAllCoursesFromStore(),
    listAppUsers(),
    listOrdersFromStore(),
  ]);

  const stats: AdminDashboardStats = {
    totalCourses: courses.length,
    totalStudents: users.filter((user) => user.role === "student").length,
    totalInstructors: users.filter((user) => user.role === "instructor" || user.role === "admin").length,
    totalRevenue: orders
      .filter((order) => order.status === "PAID" || order.status === "completed")
      .reduce((sum, order) => sum + order.total, 0),
    totalEnrollments: orders.length,
    averageRating:
      courses.length > 0
        ? courses.reduce((sum, course) => sum + course.rating, 0) / courses.length
        : 0,
  };

  const courseSummaries = courses.map((course) =>
    mapCourseSummary(course, course.studentsEnrolled),
  );

  const instructorCourseCounts = new Map<string, number>();
  for (const course of courses) {
    instructorCourseCounts.set(
      course.instructor.id,
      (instructorCourseCounts.get(course.instructor.id) ?? 0) + 1,
    );
  }

  const instructorSummaries = users
    .filter((user) => user.role === "instructor" || user.role === "admin")
    .map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      courseCount: instructorCourseCounts.get(user.id) ?? 0,
      role: user.role,
    }));

  return {
    stats,
    courseSummaries,
    instructorSummaries,
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
      createdAt: user.createdAt,
    })),
  };
}

export async function listCoursesForManagement(
  context: RoleContext,
): Promise<AdminCourseSummary[]> {
  const courses = await listAllCoursesFromStore();
  return courses
    .filter((course) => context.role === "admin" || course.instructor.id === context.userId)
    .map((course) => mapCourseSummary(course, course.studentsEnrolled))
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
}

export async function getCourseForManagement(
  courseId: string,
  context: RoleContext,
): Promise<AdminCourseDetail | null> {
  const course = await getCourseByIdFromStore(courseId);
  if (!course) {
    return null;
  }

  ensureCanEditCourse(course, context);
  return mapCourseDetail(course, course.studentsEnrolled);
}

export async function createCourseForManagement(
  input: AdminCourseInput,
  context: RoleContext,
): Promise<AdminCourseDetail> {
  if (!input.title?.trim()) {
    throw new Error("課程名稱為必填");
  }

  const instructorUser =
    context.role === "admin"
      ? await getAppUserById(input.instructorId ?? context.userId)
      : await getAppUserById(context.userId);

  if (!instructorUser) {
    throw new Error("無法找到指定講師帳號");
  }

  const modules = buildModules(input);
  const duration = input.duration && input.duration > 0 ? input.duration : deriveDuration(modules);
  const lessons = input.lessons && input.lessons > 0 ? input.lessons : deriveLessons(modules);

  const courseId = await createCourseRecord({
    title: input.title.trim(),
    subtitle: input.subtitle?.trim() || undefined,
    slug: input.slug?.trim() || undefined,
    status: input.status ?? (input.published ? "published" : "draft"),
    description: input.description?.trim() ?? "",
    thumbnail: input.thumbnail?.trim() || undefined,
    ogImage: input.ogImage?.trim() || undefined,
    price: Number(input.price ?? 0),
    category: input.category?.trim() || undefined,
    level: input.level ?? "beginner",
    duration,
    lessons,
    tags: input.tags ?? [],
    published: Boolean(input.published),
    instructorId: instructorUser.id,
    instructorName: instructorUser.name,
    instructorAvatar: instructorUser.image,
    instructorBio: "",
    targetAudience: input.targetAudience ?? [],
    learningOutcomes: input.learningOutcomes ?? [],
    faq: input.faq ?? [],
    salesBlocks: input.salesBlocks ?? [],
    seoTitle: input.seoTitle?.trim() || undefined,
    seoDescription: input.seoDescription?.trim() || undefined,
    originalPrice: Number(input.originalPrice ?? input.price ?? 0) || undefined,
    salesMode: input.salesMode ?? "evergreen",
    salesStatus: input.salesStatus ?? (input.published ? "selling" : "draft"),
    launchStartsAt: input.launchStartsAt || undefined,
    launchEndsAt: input.launchEndsAt || undefined,
    showCountdown: Boolean(input.showCountdown),
    showSeats: Boolean(input.showSeats),
    seatLimit: input.seatLimit,
    soldCountMode: input.soldCountMode ?? "enrollments",
    leadMagnetEnabled: Boolean(input.leadMagnetEnabled),
    leadMagnetTitle: input.leadMagnetTitle?.trim() || undefined,
    leadMagnetDescription: input.leadMagnetDescription?.trim() || undefined,
    leadMagnetCouponCode: input.leadMagnetCouponCode?.trim().toUpperCase() || undefined,
    priceLadders: input.priceLadders ?? [],
    modules,
  });

  const course = await getCourseByIdFromStore(courseId);
  if (!course) {
    throw new Error("建立課程後讀取失敗");
  }

  return mapCourseDetail(course, 0);
}

export async function updateCourseForManagement(
  courseId: string,
  input: AdminCourseInput,
  context: RoleContext,
): Promise<AdminCourseDetail> {
  const existing = await getCourseByIdFromStore(courseId);
  if (!existing) {
    throw new Error("找不到指定課程");
  }

  ensureCanEditCourse(existing, context);

  const instructorUser =
    context.role === "admin"
      ? await getAppUserById(input.instructorId ?? existing.instructor.id)
      : await getAppUserById(existing.instructor.id);

  if (!instructorUser) {
    throw new Error("無法找到指定講師帳號");
  }

  const modules = buildModules(input);
  const duration = input.duration && input.duration > 0 ? input.duration : deriveDuration(modules, existing.duration);
  const lessons = input.lessons && input.lessons > 0 ? input.lessons : deriveLessons(modules, existing.lessons);

  await updateCourseRecord({
    id: courseId,
    title: input.title.trim(),
    subtitle: input.subtitle?.trim() || undefined,
    slug: input.slug?.trim() || existing.slug,
    status: input.status ?? (input.published ? "published" : existing.status),
    description: input.description?.trim() ?? "",
    thumbnail: input.thumbnail?.trim() || undefined,
    ogImage: input.ogImage?.trim() || undefined,
    price: Number(input.price ?? 0),
    category: input.category?.trim() || undefined,
    level: input.level ?? "beginner",
    duration,
    lessons,
    tags: input.tags ?? [],
    published: Boolean(input.published),
    instructorId: instructorUser.id,
    instructorName: instructorUser.name,
    instructorAvatar: instructorUser.image,
    instructorBio: "",
    targetAudience: input.targetAudience ?? existing.targetAudience,
    learningOutcomes: input.learningOutcomes ?? existing.learningOutcomes,
    faq: input.faq ?? existing.faq,
    salesBlocks: input.salesBlocks ?? existing.salesBlocks,
    seoTitle: input.seoTitle?.trim() || existing.seoTitle,
    seoDescription: input.seoDescription?.trim() || existing.seoDescription,
    originalPrice: Number(input.originalPrice ?? existing.originalPrice ?? input.price ?? existing.price) || undefined,
    salesMode: input.salesMode ?? existing.salesMode,
    salesStatus: input.salesStatus ?? existing.salesStatus,
    launchStartsAt: input.launchStartsAt || existing.launchStartsAt,
    launchEndsAt: input.launchEndsAt || existing.launchEndsAt,
    showCountdown: typeof input.showCountdown === "boolean" ? input.showCountdown : existing.showCountdown,
    showSeats: typeof input.showSeats === "boolean" ? input.showSeats : existing.showSeats,
    seatLimit: input.seatLimit ?? existing.seatLimit,
    soldCountMode: input.soldCountMode ?? existing.soldCountMode,
    leadMagnetEnabled:
      typeof input.leadMagnetEnabled === "boolean"
        ? input.leadMagnetEnabled
        : existing.leadMagnetEnabled,
    leadMagnetTitle: input.leadMagnetTitle?.trim() || existing.leadMagnetTitle,
    leadMagnetDescription:
      input.leadMagnetDescription?.trim() || existing.leadMagnetDescription,
    leadMagnetCouponCode:
      input.leadMagnetCouponCode?.trim().toUpperCase() || existing.leadMagnetCouponCode,
    priceLadders: input.priceLadders ?? existing.priceLadders,
    modules,
  });

  const updated = await getCourseByIdFromStore(courseId);
  if (!updated) {
    throw new Error("更新課程後讀取失敗");
  }

  return mapCourseDetail(updated, updated.studentsEnrolled);
}

export async function deleteCourseForManagement(
  courseId: string,
  context: RoleContext,
): Promise<void> {
  if (context.role !== "admin") {
    throw new Error("只有管理員可以刪除課程");
  }

  await deleteCourseRecord(courseId);
}

export async function listInstructorOptions(): Promise<
  {
    id: string;
    name: string;
    email?: string;
  }[]
> {
  const instructors = await listInstructorUsers();
  return instructors.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
  }));
}

export async function getInstructorCourses(
  instructorId: string,
): Promise<AdminCourseSummary[]> {
  const courses = await listAllCoursesFromStore();
  return courses
    .filter((course) => course.instructor.id === instructorId)
    .map((course) => mapCourseSummary(course, course.studentsEnrolled))
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
}

export async function getAdminReportData(): Promise<AdminReportData> {
  const [courses, orders, discounts, funnel] = await Promise.all([
    listAllCoursesFromStore(),
    listOrdersFromStore(),
    listDiscountsFromStore(),
    getCheckoutFunnelMetrics(),
  ]);

  const paidOrders = orders.filter((order) => order.status === "PAID" || order.status === "completed");
  const refundedOrders = orders.filter((order) =>
    order.refundStatus === "requested" ||
    order.refundStatus === "processing" ||
    order.refundStatus === "refunded" ||
    order.status === "refunded",
  );
  const revenueByMonthMap = new Map<string, RevenueByMonth>();
  const dailyEnrollmentsMap = new Map<string, DailyEnrollment>();
  const courseRevenueMap = new Map<string, number>();
  const categoryMap = new Map<string, { courseCount: number; enrollmentCount: number }>();

  for (const course of courses) {
    const current = categoryMap.get(course.category) ?? { courseCount: 0, enrollmentCount: 0 };
    current.courseCount += 1;
    current.enrollmentCount += course.studentsEnrolled;
    categoryMap.set(course.category, current);
  }

  for (const order of paidOrders) {
    const month = order.createdAt.toISOString().slice(0, 7);
    const daily = order.createdAt.toISOString().slice(0, 10);
    const revenueEntry = revenueByMonthMap.get(month) ?? { month, revenue: 0, enrollments: 0 };
    revenueEntry.revenue += order.total;
    revenueEntry.enrollments += order.items.length;
    revenueByMonthMap.set(month, revenueEntry);

    const dailyEntry = dailyEnrollmentsMap.get(daily) ?? { date: daily, count: 0 };
    dailyEntry.count += order.items.length;
    dailyEnrollmentsMap.set(daily, dailyEntry);

    for (const item of order.items) {
      courseRevenueMap.set(item.courseId, (courseRevenueMap.get(item.courseId) ?? 0) + item.price);
    }
  }

  const topCoursesByRevenue = courses
    .map((course) => ({
      ...mapCourseSummary(course, course.studentsEnrolled),
      revenue: courseRevenueMap.get(course.id) ?? 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const grossRevenue = paidOrders.reduce((sum, order) => sum + order.subtotal + order.tax, 0);
  const netRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);
  const discountGiven = paidOrders.reduce((sum, order) => sum + order.discountAmount, 0);
  const paymentSuccessRate = orders.length > 0 ? paidOrders.length / orders.length : 0;
  const refundRate = paidOrders.length > 0 ? refundedOrders.length / paidOrders.length : 0;
  const topDiscounts = discounts
    .sort((a, b) => b.usageCount - a.usageCount || a.code.localeCompare(b.code))
    .slice(0, 10)
    .map((discount) => ({
      id: discount.id,
      code: discount.code,
      usageCount: discount.usageCount,
      valueLabel:
        discount.type === "percentage"
          ? `${discount.value}%`
          : `NT$ ${discount.value.toLocaleString("zh-TW")}`,
      enabled: discount.enabled,
    }));

  return {
    kpis: {
      grossRevenue,
      netRevenue,
      discountGiven,
      paymentSuccessRate,
      refundRate,
      paidOrderCount: paidOrders.length,
      refundedOrderCount: refundedOrders.length,
    },
    funnel: {
      ...funnel,
      purchaseToCheckoutRate:
        funnel.purchasePageViews > 0 ? funnel.checkoutStarted / funnel.purchasePageViews : 0,
      checkoutToPaidRate:
        funnel.checkoutStarted > 0 ? funnel.paymentsSucceeded / funnel.checkoutStarted : 0,
    },
    revenueByMonth: Array.from(revenueByMonthMap.values()).sort((a, b) => a.month.localeCompare(b.month)),
    dailyEnrollments: Array.from(dailyEnrollmentsMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
    topCoursesByRevenue,
    topDiscounts,
    categoryBreakdown: Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      courseCount: data.courseCount,
      enrollmentCount: data.enrollmentCount,
    })),
  };
}

export async function getAdminActivityFeed(limit = 25): Promise<ActivityItem[]> {
  const [events, users] = await Promise.all([listOrderEvents(limit), listAppUsers()]);
  const items: ActivityItem[] = events.map((event) => ({
    id: event.id,
    type: event.type.includes("MAIL") ? "user" : event.type.includes("PAYMENT") ? "enrollment" : "course",
    title: event.type,
    description: event.payload_json ?? "",
    timestamp: event.created_at,
  }));

  const userActivities = users.slice(0, Math.max(limit - items.length, 0)).map((user) => ({
    id: `user-${user.id}`,
    type: "user" as const,
    title: "新使用者同步",
    description: `${user.name} (${user.role})`,
    timestamp: user.updatedAt,
  }));

  return [...items, ...userActivities]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit);
}

export async function listDiscountsForManagement(): Promise<DiscountRecord[]> {
  return listDiscountsFromStore();
}

export async function createDiscountForManagement(input: AdminDiscountInput) {
  if (!input.code) {
    throw new Error("折扣碼為必填");
  }
  if (input.value <= 0) {
    throw new Error("折扣值必須大於 0");
  }
  if (await getDiscountByCodeFromStore(input.code)) {
    throw new Error("折扣碼已存在");
  }

  const id = await createDiscountRecord({
    code: input.code,
    type: input.type,
    value: input.value,
    description: input.description,
    startsAt: input.startsAt || undefined,
    endsAt: input.endsAt || undefined,
    usageLimit: input.usageLimit,
    perUserLimit: input.perUserLimit,
    minimumAmount: input.minimumAmount ?? 0,
    courseIds: input.courseIds ?? [],
    enabled: input.enabled ?? true,
  });

  return { id };
}

export async function updateDiscountForManagement(id: string, input: AdminDiscountInput) {
  await updateDiscountRecord(id, {
    code: input.code,
    type: input.type,
    value: input.value,
    description: input.description,
    startsAt: input.startsAt || undefined,
    endsAt: input.endsAt || undefined,
    usageLimit: input.usageLimit,
    perUserLimit: input.perUserLimit,
    minimumAmount: input.minimumAmount ?? 0,
    courseIds: input.courseIds ?? [],
    enabled: input.enabled ?? true,
  });
}
