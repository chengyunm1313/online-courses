import type { CourseModule } from "@/types/course";
import {
  createCourseRecord,
  deleteCourseRecord,
  getCourseByIdFromStore,
  getAppUserById,
  listAllCoursesFromStore,
  listAppUsers,
  listInstructorUsers,
  listOrderEvents,
  listOrdersFromStore,
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
  price: number;
  enrollmentCount: number;
  instructorName: string;
  published: boolean;
  updatedAt?: string;
  category?: string;
  level?: string;
}

export interface AdminCourseDetail extends AdminCourseSummary {
  description: string;
  thumbnail?: string;
  duration?: number;
  lessons?: number;
  tags: string[];
  instructorId: string;
  modules: AdminCourseModule[];
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
  description?: string;
  thumbnail?: string;
  price?: number;
  category?: string;
  level?: "beginner" | "intermediate" | "advanced";
  duration?: number;
  lessons?: number;
  tags?: string[];
  published?: boolean;
  instructorId?: string;
  modules?: AdminCourseModule[];
  syllabus?: AdminCourseLesson[];
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
  revenueByMonth: RevenueByMonth[];
  dailyEnrollments: DailyEnrollment[];
  topCoursesByRevenue: (AdminCourseSummary & { revenue: number })[];
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

  return {
    title: String(body.title ?? "").trim(),
    description: typeof body.description === "string" ? body.description.trim() : "",
    thumbnail: typeof body.thumbnail === "string" ? body.thumbnail.trim() : "",
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
    modules,
    syllabus,
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
    price: course.price,
    enrollmentCount,
    instructorName: course.instructor.name,
    published: course.published,
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
    duration: course.duration,
    lessons: course.lessons,
    tags: course.tags,
    instructorId: course.instructor.id,
    modules: course.modules.map((module) => ({
      ...module,
      lessons: module.lessons.map((lesson) => ({ ...lesson })),
    })),
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
    description: input.description?.trim() ?? "",
    thumbnail: input.thumbnail?.trim() || undefined,
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
    description: input.description?.trim() ?? "",
    thumbnail: input.thumbnail?.trim() || undefined,
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
  const [courses, orders] = await Promise.all([
    listAllCoursesFromStore(),
    listOrdersFromStore(),
  ]);

  const paidOrders = orders.filter((order) => order.status === "PAID" || order.status === "completed");
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

  return {
    revenueByMonth: Array.from(revenueByMonthMap.values()).sort((a, b) => a.month.localeCompare(b.month)),
    dailyEnrollments: Array.from(dailyEnrollmentsMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
    topCoursesByRevenue,
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
