import { adminDb } from "@/lib/firebase-admin";
import type { DocumentData } from "firebase-admin/firestore";

/**
 * 後台統計相關型別
 */
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

type FirestoreDocData = DocumentData;

interface RawCourse extends FirestoreDocData {
  id: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  price?: number;
  category?: string;
  level?: string;
  duration?: number;
  lessons?: number;
  rating?: number;
  published?: boolean;
  tags?: string[];
  instructorId?: string;
  instructorName?: string;
  instructor?: {
    id?: string;
    name?: string;
    avatar?: string;
  };
  studentsEnrolled?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
  modules?: unknown;
}

interface RawEnrollment extends FirestoreDocData {
  id: string;
  courseId?: string;
  userId?: string;
  amount?: number;
  pricePaid?: number;
  createdAt?: unknown;
}

interface RawUser extends FirestoreDocData {
  id: string;
  name?: string;
  displayName?: string;
  email?: string;
  role?: string;
  image?: string;
  photoURL?: string;
  createdAt?: unknown;
}

interface AdminCollections {
  courses: RawCourse[];
  enrollments: RawEnrollment[];
  users: RawUser[];
}

const DEFAULT_LEVEL: AdminCourseInput["level"] = "beginner";
const DEFAULT_INSTRUCTOR_EMAIL = "skypassion5000@gmail.com";

function normalizeSyllabusArray(rawSyllabus: unknown): AdminCourseLesson[] {
  if (!Array.isArray(rawSyllabus)) {
    return [];
  }

  const lessons = rawSyllabus
    .map((lesson, lessonIndex) => {
      if (typeof lesson !== "object" || lesson === null) {
        return null;
      }
      const lessonData = lesson as Record<string, unknown>;
      const durationValue = Number(lessonData.duration ?? 0);
      const orderValue =
        typeof lessonData.order === "number"
          ? lessonData.order
          : Number(lessonData.order ?? 0) || lessonIndex + 1;
      const idValue =
        typeof lessonData.id === "string" && lessonData.id.trim()
          ? lessonData.id.trim()
          : `lesson-${lessonIndex + 1}`;
      const titleValue =
        typeof lessonData.title === "string" && lessonData.title.trim()
          ? lessonData.title.trim()
          : "";

      if (!titleValue) {
        return null;
      }

      return {
        id: idValue,
        title: titleValue,
        description:
          typeof lessonData.description === "string"
            ? lessonData.description.trim() || undefined
            : undefined,
        duration: Number.isFinite(durationValue) ? Math.max(durationValue, 0) : 0,
        order: orderValue,
        videoUrl:
          typeof lessonData.videoUrl === "string" && lessonData.videoUrl.trim()
            ? lessonData.videoUrl.trim()
            : undefined,
        preview: Boolean(lessonData.preview),
      } satisfies AdminCourseLesson;
    })
    .filter((lesson): lesson is AdminCourseLesson => Boolean(lesson?.id && lesson.title))
    .sort((a, b) => a.order - b.order)
    .map((lesson, index) => ({
      ...lesson,
      order: index + 1,
    }));

  return lessons;
}

function normalizeModuleArray(rawModules: unknown): AdminCourseModule[] {
  if (!Array.isArray(rawModules)) {
    return [];
  }

  const modules = rawModules
    .map((module, moduleIndex) => {
      if (typeof module !== "object" || module === null) {
        return null;
      }
      const moduleData = module as Record<string, unknown>;
      const lessonsRaw = moduleData.lessons;
      const lessons: AdminCourseLesson[] = Array.isArray(lessonsRaw)
        ? lessonsRaw
            .map((lesson, lessonIndex) => {
              if (typeof lesson !== "object" || lesson === null) {
                return null;
              }
              const lessonData = lesson as Record<string, unknown>;
              const durationValue = Number(lessonData.duration ?? 0);
              const orderValue =
                typeof lessonData.order === "number"
                  ? lessonData.order
                  : Number(lessonData.order ?? 0) || lessonIndex + 1;
              const rawId = typeof lessonData.id === "string" ? lessonData.id.trim() : "";
              const rawTitle =
                typeof lessonData.title === "string" ? lessonData.title.trim() : "";

              if (!rawTitle) {
                return null;
              }

              return {
                id: rawId || `lesson-${moduleIndex + 1}-${lessonIndex + 1}`,
                title: rawTitle,
                description:
                  typeof lessonData.description === "string"
                    ? lessonData.description.trim() || undefined
                    : undefined,
                duration: Number.isFinite(durationValue) ? Math.max(durationValue, 0) : 0,
                order: orderValue,
                videoUrl:
                  typeof lessonData.videoUrl === "string" && lessonData.videoUrl.trim()
                    ? lessonData.videoUrl.trim()
                    : undefined,
                preview: Boolean(lessonData.preview),
              } satisfies AdminCourseLesson;
            })
            .filter((lesson): lesson is AdminCourseLesson => Boolean(lesson?.id && lesson.title))
        : [];

      const moduleTitle =
        typeof moduleData.title === "string" && moduleData.title.trim()
          ? moduleData.title.trim()
          : "";

      if (!moduleTitle && lessons.length === 0) {
        return null;
      }

      const orderValue =
        typeof moduleData.order === "number"
          ? moduleData.order
          : Number(moduleData.order ?? 0) || moduleIndex + 1;

      return {
        id:
          typeof moduleData.id === "string" && moduleData.id.trim()
            ? moduleData.id.trim()
            : `module-${moduleIndex + 1}`,
        title: moduleTitle || `章節 ${moduleIndex + 1}`,
        description:
          typeof moduleData.description === "string"
            ? moduleData.description.trim() || undefined
            : undefined,
        order: orderValue,
        lessons: lessons
          .sort((a, b) => a.order - b.order)
          .map((lesson, lessonIndex) => ({
            ...lesson,
            order: lessonIndex + 1,
          })),
      } satisfies AdminCourseModule;
    })
    .filter((module): module is AdminCourseModule => Boolean(module));

  return modules
    .sort((a, b) => a.order - b.order)
    .map((module, moduleIndex) => ({
      ...module,
      order: moduleIndex + 1,
      lessons: module.lessons.map((lesson, lessonIndex) => ({
        ...lesson,
        order: lessonIndex + 1,
      })),
    }));
}

function parseModules(rawModules: unknown, fallbackSyllabus: unknown): AdminCourseModule[] {
  const modules = normalizeModuleArray(rawModules);
  if (modules.length > 0) {
    return modules;
  }

  const fallbackLessons = normalizeSyllabusArray(fallbackSyllabus);
  if (fallbackLessons.length > 0) {
    return [
      {
        id: "module-1",
        title: "課程內容",
        description: undefined,
        order: 1,
        lessons: fallbackLessons.map((lesson, index) => ({
          ...lesson,
          order: index + 1,
        })),
      },
    ];
  }

  return [];
}

/**
 * 將 Firestore 欄位轉換成 Date 物件
 */
function toDate(value: unknown): Date | undefined {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "object" && value !== null && "toDate" in value) {
    try {
      return (value as { toDate: () => Date }).toDate();
    } catch {
      return undefined;
    }
  }

  if (typeof value === "number") {
    return new Date(value);
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return undefined;
}

function toISOString(value: unknown): string | undefined {
  const date = toDate(value);
  return date ? date.toISOString() : undefined;
}

async function fetchAdminCollections(): Promise<AdminCollections> {
  const [coursesSnapshot, enrollmentsSnapshot, usersSnapshot] = await Promise.all([
    adminDb.collection("courses").get(),
    adminDb.collection("enrollments").get(),
    adminDb.collection("users").get(),
  ]);

  const courses: RawCourse[] = coursesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() ?? {}),
  }));

  const enrollments: RawEnrollment[] = enrollmentsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() ?? {}),
  }));

  const users: RawUser[] = usersSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() ?? {}),
  }));

  return { courses, enrollments, users };
}

async function fetchInstructorByEmail(
  email: string
): Promise<{ id: string; name: string; email: string } | null> {
  const snapshot = await adminDb
    .collection("users")
    .where("email", "==", email)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    name: data.name ?? data.displayName ?? email,
    email: data.email ?? email,
  };
}

function buildCourseSummary(
  course: RawCourse,
  enrollmentCount: number,
): AdminCourseSummary {
  return {
    id: course.id,
    title: course.title ?? "未命名課程",
    price: typeof course.price === "number" ? course.price : Number(course.price) || 0,
    enrollmentCount,
    instructorName:
      course.instructorName ??
      course.instructor?.name ??
      "未設定講師",
    published: Boolean(course.published),
    updatedAt: toISOString(course.updatedAt),
    category: course.category,
    level: course.level,
  };
}

function buildCourseDetail(
  course: RawCourse,
  enrollmentCount: number,
): AdminCourseDetail {
  const summary = buildCourseSummary(course, enrollmentCount);
  const modules = parseModules(course.modules, course.syllabus);
  const aggregatedLessons = modules.reduce(
    (total, module) => total + module.lessons.length,
    0,
  );
  const aggregatedMinutes = modules.reduce(
    (total, module) =>
      total + module.lessons.reduce((sum, lesson) => sum + lesson.duration, 0),
    0,
  );
  const derivedDuration =
    aggregatedLessons > 0 ? Number((aggregatedMinutes / 60).toFixed(1)) : 0;
  const normalizedDuration =
    typeof course.duration === "number"
      ? course.duration
      : Number(course.duration ?? 0) || 0;
  const duration =
    normalizedDuration > 0 ? normalizedDuration : derivedDuration;
  const normalizedLessons =
    typeof course.lessons === "number"
      ? course.lessons
      : Number(course.lessons ?? 0) || 0;
  const lessonsCount =
    normalizedLessons > 0 ? normalizedLessons : aggregatedLessons;
  return {
    ...summary,
    description: course.description ?? "",
    thumbnail: course.thumbnail,
    duration,
    lessons: lessonsCount,
    tags: Array.isArray(course.tags)
      ? course.tags.map(String)
      : [],
    instructorId:
      course.instructorId ??
      course.instructor?.id ??
      "",
    modules,
  };
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function getEnrollmentAmount(enrollment: RawEnrollment, fallbackPrice = 0): number {
  if (typeof enrollment.amount === "number") {
    return enrollment.amount;
  }
  if (typeof enrollment.pricePaid === "number") {
    return enrollment.pricePaid;
  }
  return fallbackPrice;
}

/**
 * 取得後台儀表板總覽資料
 */
export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const { courses, enrollments, users } = await fetchAdminCollections();

  const courseEnrollmentCounts = new Map<string, number>();
  enrollments.forEach((enrollment) => {
    if (!enrollment.courseId) {
      return;
    }
    courseEnrollmentCounts.set(
      enrollment.courseId,
      (courseEnrollmentCounts.get(enrollment.courseId) ?? 0) + 1,
    );
  });

  const uniqueStudentCount = unique(
    enrollments.map((record) => record.userId).filter(Boolean),
  ).length;

  const revenueByCourse = new Map<string, number>();
  enrollments.forEach((enrollment) => {
    if (!enrollment.courseId) {
      return;
    }
    revenueByCourse.set(
      enrollment.courseId,
      (revenueByCourse.get(enrollment.courseId) ?? 0) +
        getEnrollmentAmount(
          enrollment,
          courses.find((course) => course.id === enrollment.courseId)?.price ?? 0,
        ),
    );
  });

  const instructorCourseCounts = new Map<string, number>();
  courses.forEach((course) => {
    const instructorId =
      course.instructorId ?? course.instructor?.id;
    if (!instructorId) {
      return;
    }
    instructorCourseCounts.set(
      instructorId,
      (instructorCourseCounts.get(instructorId) ?? 0) + 1,
    );
  });

  const totalRevenue = Array.from(revenueByCourse.values()).reduce(
    (sum, value) => sum + value,
    0,
  );

  const totalCourses = courses.length;
  const totalEnrollments = enrollments.length;
  const totalInstructors = instructorCourseCounts.size;
  const averageRating =
    totalCourses > 0
      ? courses.reduce((sum, course) => sum + (typeof course.rating === "number" ? course.rating : 0), 0) /
        totalCourses
      : 0;

  const courseSummaries = courses
    .map((course) =>
      buildCourseSummary(
        course,
        courseEnrollmentCounts.get(course.id) ?? course.studentsEnrolled ?? 0,
      ),
    )
    .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
    .slice(0, 8);

  const usersMap = new Map<string, RawUser>();
  users.forEach((user) => {
    usersMap.set(user.id, user);
  });

  const instructorSummaries: AdminInstructorSummary[] = Array.from(
    instructorCourseCounts.entries(),
  )
    .map(([instructorId, courseCount]) => {
      const user = usersMap.get(instructorId);
      return {
        id: instructorId,
        name: user?.name ?? user?.displayName ?? "未知講師",
        email: user?.email,
        courseCount,
        role: user?.role ?? "instructor",
      };
    })
    .sort((a, b) => b.courseCount - a.courseCount);

  const stats: AdminDashboardStats = {
    totalCourses,
    totalStudents: uniqueStudentCount,
    totalInstructors,
    totalRevenue,
    totalEnrollments,
    averageRating: Number.isFinite(averageRating)
      ? Number(averageRating.toFixed(2))
      : 0,
  };

  const userSummaries: AdminUserSummary[] = users.map((user) => ({
    id: user.id,
    name: user.name ?? user.displayName ?? "",
    email: user.email ?? "",
    role: user.role ?? "student",
    image: user.image ?? user.photoURL ?? "",
    createdAt: toISOString(user.createdAt),
  }));

  return {
    stats,
    courseSummaries,
    instructorSummaries,
    users: userSummaries,
  };
}

interface RoleContext {
  role: string;
  userId: string;
}

function ensureCanEditCourse(course: RawCourse, context: RoleContext) {
  if (context.role === "admin") {
    return;
  }

  const instructorId =
    course.instructorId ?? course.instructor?.id;
  if (context.role === "instructor" && instructorId === context.userId) {
    return;
  }

  throw new Error("沒有權限操作此課程");
}

/**
 * 列出管理端可見課程
 */
export async function listCoursesForManagement(
  context: RoleContext,
): Promise<AdminCourseSummary[]> {
  const { courses, enrollments } = await fetchAdminCollections();

  const enrollmentCounts = new Map<string, number>();
  enrollments.forEach((enrollment) => {
    if (!enrollment.courseId) {
      return;
    }
    enrollmentCounts.set(
      enrollment.courseId,
      (enrollmentCounts.get(enrollment.courseId) ?? 0) + 1,
    );
  });

  const filteredCourses =
    context.role === "admin"
      ? courses
      : courses.filter((course) => {
          const instructorId =
            course.instructorId ?? course.instructor?.id;
          return instructorId === context.userId;
        });

  return filteredCourses
    .map((course) =>
      buildCourseSummary(
        course,
        enrollmentCounts.get(course.id) ?? course.studentsEnrolled ?? 0,
      ),
    )
    .sort((a, b) => {
      const aKey = a.updatedAt ?? "";
      const bKey = b.updatedAt ?? "";
      return bKey.localeCompare(aKey);
    });
}

/**
 * 取得管理端課程詳細資料
 */
export async function getCourseForManagement(
  courseId: string,
  context: RoleContext,
): Promise<AdminCourseDetail | null> {
  const doc = await adminDb.collection("courses").doc(courseId).get();
  if (!doc.exists) {
    return null;
  }

  const rawCourse: RawCourse = {
    id: doc.id,
    ...(doc.data() ?? {}),
  };

  ensureCanEditCourse(rawCourse, context);

  const enrollmentsSnapshot = await adminDb
    .collection("enrollments")
    .where("courseId", "==", courseId)
    .get();

  const enrollmentCount = enrollmentsSnapshot.size;
  return buildCourseDetail(rawCourse, enrollmentCount);
}

async function resolveInstructor(
  instructorId: string,
): Promise<{ id: string; name: string; avatar?: string } | null> {
  if (!instructorId) {
    return null;
  }
  const doc = await adminDb.collection("users").doc(instructorId).get();
  if (!doc.exists) {
    return null;
  }
  const data = doc.data() ?? {};
  return {
    id: instructorId,
    name: data.name ?? data.displayName ?? "未知講師",
    avatar: data.image ?? data.photoURL,
  };
}

function normalizeCourseInput(input: AdminCourseInput) {
  const sanitizedModules = normalizeModuleArray(input.modules);
  const sanitizedSyllabus = normalizeSyllabusArray(input.syllabus);

  const modules: AdminCourseModule[] =
    sanitizedModules.length > 0
      ? sanitizedModules
      : sanitizedSyllabus.length > 0
      ? [
          {
            id: "module-1",
            title: "課程內容",
            description: undefined,
            order: 1,
            lessons: sanitizedSyllabus.map((lesson, index) => ({
              ...lesson,
              order: index + 1,
            })),
          },
        ]
      : [];

  const lessonsFromModules = modules.flatMap((module) => module.lessons);
  const effectiveLessons =
    lessonsFromModules.length > 0 ? lessonsFromModules : sanitizedSyllabus;
  const totalMinutes = effectiveLessons.reduce(
    (sum, lesson) => sum + lesson.duration,
    0,
  );
  const derivedDuration =
    effectiveLessons.length > 0
      ? Number((totalMinutes / 60).toFixed(1))
      : 0;

  const providedDuration =
    typeof input.duration === "number"
      ? input.duration
      : Number(input.duration ?? 0);
  const normalizedDuration =
    Number.isFinite(providedDuration) && providedDuration > 0
      ? Math.max(providedDuration, 0)
      : derivedDuration;

  const providedLessons =
    typeof input.lessons === "number"
      ? input.lessons
      : Number(input.lessons ?? 0);
  const normalizedLessons =
    Number.isFinite(providedLessons) && providedLessons > 0
      ? Math.max(Math.floor(providedLessons), 0)
      : effectiveLessons.length;

  const syllabus: AdminCourseLesson[] =
    sanitizedSyllabus.length > 0
      ? sanitizedSyllabus.map((lesson, index) => ({
          ...lesson,
          order: index + 1,
        }))
      : lessonsFromModules.map((lesson, index) => ({
          ...lesson,
          order: index + 1,
        }));

  return {
    title: input.title.trim(),
    description: input.description?.trim() ?? "",
    thumbnail: input.thumbnail?.trim() ?? "",
    price: Number(input.price ?? 0) || 0,
    category: input.category?.trim() ?? "",
    level: input.level ?? DEFAULT_LEVEL,
    duration: normalizedDuration,
    lessons: normalizedLessons,
    tags: Array.isArray(input.tags)
      ? input.tags.map((tag) => String(tag).trim()).filter(Boolean)
      : [],
    published: Boolean(input.published),
    modules,
    syllabus,
  };
}

/**
 * 建立課程
 */
export async function createCourseForManagement(
  input: AdminCourseInput,
  context: RoleContext,
): Promise<AdminCourseDetail> {
  if (!input.title?.trim()) {
    throw new Error("課程名稱為必填");
  }

  let targetInstructorId: string | undefined;
  let instructorInfo: { id: string; name: string; avatar?: string } | null = null;

  if (context.role === "admin") {
    if (input.instructorId) {
      targetInstructorId = input.instructorId;
      instructorInfo = await resolveInstructor(targetInstructorId);
    } else {
      const defaultInstructor = await fetchInstructorByEmail(
        DEFAULT_INSTRUCTOR_EMAIL
      );
      if (defaultInstructor) {
        targetInstructorId = defaultInstructor.id;
        instructorInfo = await resolveInstructor(targetInstructorId);
      }
    }
  } else {
    targetInstructorId = context.userId;
    instructorInfo = await resolveInstructor(targetInstructorId);
  }

  if (!instructorInfo) {
    const fallbackId = targetInstructorId ?? context.userId;
    instructorInfo = await resolveInstructor(fallbackId);
  }

  if (!instructorInfo) {
    throw new Error("無法找到指定講師帳號");
  }

  const now = new Date();
  const normalized = normalizeCourseInput(input);

  const payload = {
    ...normalized,
    instructorId: instructorInfo.id,
    instructorName: instructorInfo.name,
    instructor: instructorInfo,
    studentsEnrolled: 0,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await adminDb.collection("courses").add(payload);
  return buildCourseDetail(
    { id: docRef.id, ...payload },
    0,
  );
}

/**
 * 更新課程
 */
export async function updateCourseForManagement(
  courseId: string,
  input: AdminCourseInput,
  context: RoleContext,
): Promise<AdminCourseDetail> {
  const docRef = adminDb.collection("courses").doc(courseId);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new Error("找不到指定課程");
  }

  const rawCourse: RawCourse = {
    id: doc.id,
    ...(doc.data() ?? {}),
  };

  ensureCanEditCourse(rawCourse, context);

  const normalized = normalizeCourseInput(input);

  let instructorInfo = rawCourse.instructor ?? {
    id: rawCourse.instructorId ?? context.userId,
    name: rawCourse.instructorName ?? "",
  };

  if (context.role === "admin" && input.instructorId) {
    const resolved = await resolveInstructor(input.instructorId);
    if (!resolved) {
      throw new Error("無法找到指定講師帳號");
    }
    instructorInfo = resolved;
  } else if (context.role === "admin" && !input.instructorId) {
    const defaultInstructor = await fetchInstructorByEmail(
      DEFAULT_INSTRUCTOR_EMAIL
    );
    if (defaultInstructor) {
      const resolved = await resolveInstructor(defaultInstructor.id);
      if (resolved) {
        instructorInfo = resolved;
      }
    }
  }

  const payload = {
    ...normalized,
    instructorId: instructorInfo.id,
    instructorName: instructorInfo.name,
    instructor: instructorInfo,
    updatedAt: new Date(),
  };

  await docRef.set(payload, { merge: true });

  const updatedDoc = await docRef.get();
  const updatedCourse: RawCourse = {
    id: updatedDoc.id,
    ...(updatedDoc.data() ?? {}),
  };

  const enrollmentsSnapshot = await adminDb
    .collection("enrollments")
    .where("courseId", "==", courseId)
    .get();

  return buildCourseDetail(updatedCourse, enrollmentsSnapshot.size);
}

/**
 * 刪除課程（僅限管理員）
 */
export async function deleteCourseForManagement(
  courseId: string,
  context: RoleContext,
): Promise<void> {
  if (context.role !== "admin") {
    throw new Error("只有管理員可以刪除課程");
  }

  await adminDb.collection("courses").doc(courseId).delete();
}

/**
 * 取得講師清單（提供下拉選單使用）
 */
export async function listInstructorOptions(): Promise<
  {
    id: string;
    name: string;
    email?: string;
  }[]
> {
  const snapshot = await adminDb.collection("users").get();
  const options = snapshot.docs
    .filter((doc) => {
      const role = (doc.data() ?? {}).role ?? "student";
      return role === "instructor" || role === "admin";
    })
    .map((doc) => {
      const data = doc.data() ?? {};
      return {
        id: doc.id,
        name: data.name ?? data.displayName ?? "未命名使用者",
        email: data.email ?? "",
      };
    });

  const defaultInstructor = await fetchInstructorByEmail(
    DEFAULT_INSTRUCTOR_EMAIL
  );

  if (defaultInstructor && !options.some((o) => o.id === defaultInstructor.id)) {
    options.push({
      id: defaultInstructor.id,
      name: defaultInstructor.name,
      email: defaultInstructor.email,
    });
  }

  return options.sort((a, b) => {
    if (a.email === DEFAULT_INSTRUCTOR_EMAIL) return -1;
    if (b.email === DEFAULT_INSTRUCTOR_EMAIL) return 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * 取得講師個人課程
 */
export async function getInstructorCourses(
  instructorId: string,
): Promise<AdminCourseSummary[]> {
  const snapshot = await adminDb
    .collection("courses")
    .where("instructorId", "==", instructorId)
    .get();

  const courses: RawCourse[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() ?? {}),
  }));

  const enrollmentCounts = new Map<string, number>();

  if (courses.length > 0) {
    const chunkSize = 10;
    const courseIdBatches: string[][] = [];
    for (let i = 0; i < courses.length; i += chunkSize) {
      courseIdBatches.push(courses.slice(i, i + chunkSize).map((course) => course.id));
    }

    for (const batch of courseIdBatches) {
      const enrollmentsSnapshot = await adminDb
        .collection("enrollments")
        .where("courseId", "in", batch)
        .get()
        .catch(() => null);

      enrollmentsSnapshot?.docs.forEach((doc) => {
        const data = doc.data() ?? {};
        const courseId = data.courseId;
        if (!courseId) {
          return;
        }
        enrollmentCounts.set(
          courseId,
          (enrollmentCounts.get(courseId) ?? 0) + 1,
        );
      });
    }
  }

  return courses.map((course) =>
    buildCourseSummary(
      course,
      enrollmentCounts.get(course.id) ?? course.studentsEnrolled ?? 0,
    ),
  );
}

/**
 * 報表資料：營收、趨勢與分類統計
 */
export async function getAdminReportData(): Promise<AdminReportData> {
  const { courses, enrollments } = await fetchAdminCollections();

  const revenueByMonthMap = new Map<string, { revenue: number; enrollments: number }>();
  const dailyEnrollmentMap = new Map<string, number>();
  const revenueByCourse = new Map<string, number>();
  const enrollmentByCourse = new Map<string, number>();

  enrollments.forEach((enrollment) => {
    const date = toDate(enrollment.createdAt) ?? new Date();
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const dayKey = date.toISOString().slice(0, 10);

    const courseId = enrollment.courseId ?? "";
    const coursePrice =
      courses.find((course) => course.id === courseId)?.price ?? 0;
    const amount = getEnrollmentAmount(enrollment, coursePrice);

    const monthRecord = revenueByMonthMap.get(monthKey) ?? { revenue: 0, enrollments: 0 };
    monthRecord.revenue += amount;
    monthRecord.enrollments += 1;
    revenueByMonthMap.set(monthKey, monthRecord);

    dailyEnrollmentMap.set(dayKey, (dailyEnrollmentMap.get(dayKey) ?? 0) + 1);

    if (courseId) {
      revenueByCourse.set(courseId, (revenueByCourse.get(courseId) ?? 0) + amount);
      enrollmentByCourse.set(courseId, (enrollmentByCourse.get(courseId) ?? 0) + 1);
    }
  });

  const revenueByMonth: RevenueByMonth[] = Array.from(revenueByMonthMap.entries())
    .map(([month, record]) => ({
      month,
      revenue: Number(record.revenue.toFixed(0)),
      enrollments: record.enrollments,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const dailyEnrollments: DailyEnrollment[] = Array.from(dailyEnrollmentMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);

  const topCoursesByRevenue = courses
    .map((course) => {
      const summary = buildCourseSummary(
        course,
        enrollmentByCourse.get(course.id) ?? course.studentsEnrolled ?? 0,
      );
      return {
        ...summary,
        revenue: Number(revenueByCourse.get(summary.id) ?? 0),
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const categoryMap = new Map<
    string,
    {
      courseCount: number;
      enrollmentCount: number;
    }
  >();

  courses.forEach((course) => {
    const category = course.category ?? "未分類";
    const record = categoryMap.get(category) ?? { courseCount: 0, enrollmentCount: 0 };
    record.courseCount += 1;
    record.enrollmentCount += enrollmentByCourse.get(course.id) ?? 0;
    categoryMap.set(category, record);
  });

  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      courseCount: data.courseCount,
      enrollmentCount: data.enrollmentCount,
    }))
    .sort((a, b) => b.enrollmentCount - a.enrollmentCount);

  return {
    revenueByMonth,
    dailyEnrollments,
    topCoursesByRevenue,
    categoryBreakdown,
  };
}

/**
 * 活動紀錄（包含新課程、新報名與新使用者）
 */
export async function getAdminActivityFeed(limit = 25): Promise<ActivityItem[]> {
  const { courses, enrollments, users } = await fetchAdminCollections();

  const usersMap = new Map<string, RawUser>();
  users.forEach((user) => usersMap.set(user.id, user));

  const courseMap = new Map<string, RawCourse>();
  courses.forEach((course) => courseMap.set(course.id, course));

  const items: ActivityItem[] = [];

  enrollments.forEach((enrollment) => {
    const timestamp = toISOString(enrollment.createdAt);
    if (!timestamp) {
      return;
    }
    const user = enrollment.userId ? usersMap.get(enrollment.userId) : null;
    const course = enrollment.courseId ? courseMap.get(enrollment.courseId) : null;

    items.push({
      id: `enrollment-${enrollment.id}`,
      type: "enrollment",
      title: `課程報名：${course?.title ?? "未知課程"}`,
      description: `${user?.name ?? user?.displayName ?? "匿名使用者"} 成功報名`,
      timestamp,
    });
  });

  courses.forEach((course) => {
    const timestamp = toISOString(course.updatedAt ?? course.createdAt);
    if (!timestamp) {
      return;
    }
    items.push({
      id: `course-${course.id}`,
      type: "course",
      title: `課程更新：${course.title ?? "未命名課程"}`,
      description: `講師：${
        course.instructorName ?? course.instructor?.name ?? "未設定講師"
      }`,
      timestamp,
    });
  });

  users.forEach((user) => {
    const timestamp = toISOString(user.createdAt);
    if (!timestamp) {
      return;
    }
    items.push({
      id: `user-${user.id}`,
      type: "user",
      title: `新使用者：${user.name ?? user.displayName ?? "未命名"}`,
      description: `權限：${user.role ?? "student"}`,
      timestamp,
    });
  });

  return items
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit);
}
