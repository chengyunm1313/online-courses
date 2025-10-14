import { adminDb } from "@/lib/firebase-admin";

interface RawEnrollment {
  id: string;
  courseId: string;
  courseTitle?: string;
  progress?: number;
  lastAccessed?: unknown;
  createdAt?: unknown;
  completedLessons: string[];
}

interface ModuleLessonBase {
  id: string;
  title: string;
  description?: string;
  duration: number;
  order: number;
  videoUrl?: string;
  preview?: boolean;
}

interface ModuleBase {
  id: string;
  title: string;
  description?: string;
  order: number;
  lessons: ModuleLessonBase[];
}

interface RawCourse {
  id: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  lessons?: number;
  duration?: number;
  instructorName?: string;
  category?: string;
  modules: ModuleBase[];
}

function toDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  if (typeof value === "object" && value !== null && "toDate" in value) {
    try {
      return (value as { toDate: () => Date }).toDate();
    } catch {
      return undefined;
    }
  }
  return undefined;
}

const PLACEHOLDER_THUMBNAIL =
  "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=800";

function normalizeSyllabusLessons(rawSyllabus: unknown): ModuleLessonBase[] {
  if (!Array.isArray(rawSyllabus)) {
    return [];
  }

  return rawSyllabus
    .map((lesson, index) => {
      if (typeof lesson !== "object" || lesson === null) {
        return null;
      }
      const lessonRecord = lesson as Record<string, unknown>;
      const title =
        typeof lessonRecord.title === "string" && lessonRecord.title.trim()
          ? lessonRecord.title.trim()
          : "";
      if (!title) {
        return null;
      }
      const durationValue = Number(lessonRecord.duration ?? 0);
      const orderValue =
        typeof lessonRecord.order === "number"
          ? lessonRecord.order
          : Number(lessonRecord.order ?? 0) || index + 1;
      return {
        id:
          typeof lessonRecord.id === "string" && lessonRecord.id.trim()
            ? lessonRecord.id.trim()
            : `lesson-${index + 1}`,
        title,
        description:
          typeof lessonRecord.description === "string"
            ? lessonRecord.description.trim() || undefined
            : undefined,
        duration: Number.isFinite(durationValue) ? Math.max(durationValue, 0) : 0,
        order: orderValue,
        videoUrl:
          typeof lessonRecord.videoUrl === "string" && lessonRecord.videoUrl.trim()
            ? lessonRecord.videoUrl.trim()
            : undefined,
        preview: Boolean(lessonRecord.preview),
      } satisfies ModuleLessonBase;
    })
    .filter((lesson): lesson is ModuleLessonBase => Boolean(lesson))
    .sort((a, b) => a.order - b.order)
    .map((lesson, index) => ({
      ...lesson,
      order: index + 1,
    }));
}

function normalizeModules(rawModules: unknown, rawSyllabus: unknown): ModuleBase[] {
  if (Array.isArray(rawModules)) {
    const modules = rawModules
      .map((module, moduleIndex) => {
        if (typeof module !== "object" || module === null) {
          return null;
        }
        const moduleRecord = module as Record<string, unknown>;
        const lessonsRaw = moduleRecord.lessons;
        const lessons: ModuleLessonBase[] = Array.isArray(lessonsRaw)
          ? lessonsRaw
              .map((lesson, lessonIndex) => {
                if (typeof lesson !== "object" || lesson === null) {
                  return null;
                }
                const lessonRecord = lesson as Record<string, unknown>;
                const title =
                  typeof lessonRecord.title === "string" && lessonRecord.title.trim()
                    ? lessonRecord.title.trim()
                    : "";
                if (!title) {
                  return null;
                }
                const durationValue = Number(lessonRecord.duration ?? 0);
                const orderValue =
                  typeof lessonRecord.order === "number"
                    ? lessonRecord.order
                    : Number(lessonRecord.order ?? 0) || lessonIndex + 1;
                return {
                  id:
                    typeof lessonRecord.id === "string" && lessonRecord.id.trim()
                      ? lessonRecord.id.trim()
                      : `lesson-${moduleIndex + 1}-${lessonIndex + 1}`,
                  title,
                  description:
                    typeof lessonRecord.description === "string"
                      ? lessonRecord.description.trim() || undefined
                      : undefined,
                  duration: Number.isFinite(durationValue) ? Math.max(durationValue, 0) : 0,
                  order: orderValue,
                  videoUrl:
                    typeof lessonRecord.videoUrl === "string" && lessonRecord.videoUrl.trim()
                      ? lessonRecord.videoUrl.trim()
                      : undefined,
                  preview: Boolean(lessonRecord.preview),
                } satisfies ModuleLessonBase;
              })
              .filter((lesson): lesson is ModuleLessonBase => Boolean(lesson))
              .sort((a, b) => a.order - b.order)
              .map((lesson, index) => ({
                ...lesson,
                order: index + 1,
              }))
          : [];

        if (!lessons.length && typeof moduleRecord.title !== "string") {
          return null;
        }

        const orderValue =
          typeof moduleRecord.order === "number"
            ? moduleRecord.order
            : Number(moduleRecord.order ?? 0) || moduleIndex + 1;

        return {
          id:
            typeof moduleRecord.id === "string" && moduleRecord.id.trim()
              ? moduleRecord.id.trim()
              : `module-${moduleIndex + 1}`,
          title:
            typeof moduleRecord.title === "string" && moduleRecord.title.trim()
              ? moduleRecord.title.trim()
              : `章節 ${moduleIndex + 1}`,
          description:
            typeof moduleRecord.description === "string"
              ? moduleRecord.description.trim() || undefined
              : undefined,
          order: orderValue,
          lessons,
        } satisfies ModuleBase;
      })
      .filter((module): module is ModuleBase => Boolean(module))
      .sort((a, b) => a.order - b.order)
      .map((module, index) => ({
        ...module,
        order: index + 1,
        lessons: module.lessons.map((lesson, lessonIndex) => ({
          ...lesson,
          order: lessonIndex + 1,
        })),
      }));

    if (modules.length > 0) {
      return modules;
    }
  }

  const fallbackLessons = normalizeSyllabusLessons(rawSyllabus);
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
export interface LearningCourseLesson extends ModuleLessonBase {
  completed: boolean;
  isNext: boolean;
}

export interface LearningCourseModule {
  id: string;
  title: string;
  description?: string;
  order: number;
  lessons: LearningCourseLesson[];
}

export interface LearningCourse {
  enrollmentId: string;
  courseId: string;
  title: string;
  description: string;
  thumbnail: string;
  lessons: number;
  duration: number;
  progress: number;
  lastAccessed: string;
  category: string;
  instructorName: string;
  modules: LearningCourseModule[];
  completedLessonsCount: number;
  nextLessonId?: string;
  nextLessonTitle?: string;
}

async function fetchEnrollments(userId: string): Promise<RawEnrollment[]> {
  const snapshot = await adminDb
    .collection("enrollments")
    .where("userId", "==", userId)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data() ?? {};
    return {
      id: doc.id,
      courseId: String(data.courseId ?? ""),
      courseTitle: data.courseTitle as string | undefined,
      progress:
        typeof data.progress === "number"
          ? data.progress
          : Number(data.progress ?? 0) || 0,
      lastAccessed: data.lastAccessed,
      createdAt: data.createdAt,
      completedLessons: Array.isArray(data.completedLessons)
        ? (data.completedLessons as unknown[]).map((lessonId) => String(lessonId))
        : [],
    } satisfies RawEnrollment;
  });
}

async function fetchCourses(courseIds: string[]): Promise<Map<string, RawCourse>> {
  const uniqueIds = Array.from(new Set(courseIds.filter(Boolean)));
  const result = new Map<string, RawCourse>();

  await Promise.all(
    uniqueIds.map(async (id) => {
      const doc = await adminDb.collection("courses").doc(id).get();
      if (!doc.exists) return;
      const data = doc.data() ?? {};
      const modules = normalizeModules(data.modules, data.syllabus);
      result.set(id, {
        id,
        title: data.title as string | undefined,
        description: data.description as string | undefined,
        thumbnail: data.thumbnail as string | undefined,
        lessons:
          typeof data.lessons === "number"
            ? data.lessons
            : Number(data.lessons ?? 0) || 0,
        duration:
          typeof data.duration === "number"
            ? data.duration
            : Number(data.duration ?? 0) || 0,
        instructorName: data.instructorName as string | undefined,
        category: data.category as string | undefined,
        modules,
      });
    })
  );

  return result;
}

export async function getLearningCoursesForUser(
  userId: string
): Promise<LearningCourse[]> {
  const enrollments = await fetchEnrollments(userId);
  if (enrollments.length === 0) {
    return [];
  }

  const courseMap = await fetchCourses(enrollments.map((item) => item.courseId));

  return enrollments
    .map((enrollment) => {
      const course = courseMap.get(enrollment.courseId);
      if (!course) return null;

      const modules = course.modules;
      const completedLessonSet = new Set(enrollment.completedLessons);
      const flatLessons = modules.flatMap((module) => module.lessons);
      const totalLessons =
        flatLessons.length > 0 ? flatLessons.length : course.lessons ?? 0;
      const completedLessonsCount = flatLessons.filter((lesson) =>
        completedLessonSet.has(lesson.id),
      ).length;
      const nextLesson = flatLessons.find(
        (lesson) => !completedLessonSet.has(lesson.id),
      );

      const modulesWithStatus: LearningCourseModule[] = modules.map((module) => ({
        ...module,
        lessons: module.lessons.map((lesson) => ({
          ...lesson,
          completed: completedLessonSet.has(lesson.id),
          isNext: nextLesson ? lesson.id === nextLesson.id : false,
        })),
      }));

      const storedProgress = Math.min(
        Math.max(enrollment.progress ?? 0, 0),
        100,
      );
      const derivedProgress =
        totalLessons > 0
          ? Math.round((completedLessonsCount / totalLessons) * 100)
          : storedProgress;
      const progress = Math.min(
        Math.max(totalLessons > 0 ? derivedProgress : storedProgress, 0),
        100,
      );

      const lastAccessed =
        toDate(enrollment.lastAccessed) ?? toDate(enrollment.createdAt) ?? new Date();

      return {
        enrollmentId: enrollment.id,
        courseId: enrollment.courseId,
        title: course.title ?? enrollment.courseTitle ?? "未命名課程",
        description: course.description ?? "講師尚未提供課程描述。",
        thumbnail: course.thumbnail ?? PLACEHOLDER_THUMBNAIL,
        lessons: totalLessons,
        duration: course.duration ?? 0,
        progress,
        lastAccessed: lastAccessed.toISOString(),
        category: course.category ?? "未分類",
        instructorName: course.instructorName ?? "講師",
        modules: modulesWithStatus,
        completedLessonsCount,
        nextLessonId: nextLesson?.id,
        nextLessonTitle: nextLesson?.title,
      } satisfies LearningCourse;
    })
    .filter((item): item is LearningCourse => item !== null)
    .sort(
      (a, b) =>
        new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime()
    );
}
