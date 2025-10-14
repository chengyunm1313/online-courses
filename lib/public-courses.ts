import { adminDb } from "@/lib/firebase-admin";
import { mockCourses } from "@/lib/mock-data";
import type { Course, CourseModule, CourseModuleItem, CourseSyllabus } from "@/types/course";

interface PublicCourse extends Course {
  createdAt: Date;
  updatedAt: Date;
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

function normalizeSyllabus(value: unknown): CourseSyllabus[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item): CourseSyllabus | null => {
      if (typeof item !== "object" || item === null) return null;
      const id = String((item as Record<string, unknown>).id ?? "");
      const title = String((item as Record<string, unknown>).title ?? "");
      if (!id || !title) return null;
      const itemRecord = item as Record<string, unknown>;
      const duration = typeof itemRecord.duration === "number"
        ? itemRecord.duration
        : Number(itemRecord.duration ?? 0) || 0;
      const order = typeof itemRecord.order === "number"
        ? itemRecord.order
        : Number(itemRecord.order ?? 0) || 0;

      return {
        id,
        title,
        description: String(itemRecord.description ?? ""),
        duration,
        order,
        videoUrl: String(
          (item as Record<string, unknown>).videoUrl ?? ""
        ) || undefined,
        preview: Boolean(itemRecord.preview),
        resources: Array.isArray(
          (item as Record<string, unknown>).resources
        )
          ? ((item as Record<string, unknown>).resources as CourseSyllabus["resources"])
          : undefined
      } satisfies CourseSyllabus;
    })
    .filter((item): item is CourseSyllabus => item !== null)
    .sort((a, b) => a.order - b.order);
}

function normalizeModules(
  value: unknown,
  fallbackSyllabus: CourseSyllabus[],
): CourseModule[] {
  if (Array.isArray(value)) {
    const modules = (
      value
        .map((module, moduleIndex) => {
        if (typeof module !== "object" || module === null) {
          return null;
        }
        const moduleRecord = module as Record<string, unknown>;
        const rawLessons = moduleRecord.lessons;
        const lessons = Array.isArray(rawLessons)
          ? (
              rawLessons
                .map((lesson, lessonIndex) => {
                if (typeof lesson !== "object" || lesson === null) {
                  return null;
                }
                const lessonRecord = lesson as Record<string, unknown>;
                const durationValue = Number(lessonRecord.duration ?? 0);
                const orderValue =
                  typeof lessonRecord.order === "number"
                    ? lessonRecord.order
                    : Number(lessonRecord.order ?? 0) || lessonIndex + 1;
                const titleValue =
                  typeof lessonRecord.title === "string" && lessonRecord.title.trim()
                    ? lessonRecord.title.trim()
                    : "";
                if (!titleValue) {
                  return null;
                }
                return {
                  id:
                    typeof lessonRecord.id === "string" && lessonRecord.id.trim()
                      ? lessonRecord.id.trim()
                      : `lesson-${moduleIndex + 1}-${lessonIndex + 1}`,
                  title: titleValue,
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
                } satisfies CourseModuleItem;
              })
              .filter(Boolean) as CourseModuleItem[]
            )
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
        } satisfies CourseModule;
        })
        .filter(Boolean) as CourseModule[]
    )
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

  if (fallbackSyllabus.length > 0) {
    return [
      {
        id: "module-1",
        title: "課程內容",
        order: 1,
        lessons: fallbackSyllabus.map((lesson, index) => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description || undefined,
          duration: lesson.duration,
          order: index + 1,
          videoUrl: lesson.videoUrl,
          preview: lesson.preview,
        })),
      },
    ];
  }

  return [];
}

function mapMockCourse(course: Course): PublicCourse {
  return {
    ...course,
    createdAt:
      course.createdAt instanceof Date
        ? course.createdAt
        : new Date(course.createdAt),
    updatedAt:
      course.updatedAt instanceof Date
        ? course.updatedAt
        : new Date(course.updatedAt),
  };
}

function mapCourseDoc(
  id: string,
  data: Record<string, unknown>
): PublicCourse | null {
  const createdAt = toDate(data.createdAt) ?? new Date();
  const updatedAt = toDate(data.updatedAt) ?? createdAt;

  const price =
    typeof data.price === "number"
      ? data.price
      : Number(data.price ?? 0) || 0;
  const rating =
    typeof data.rating === "number"
      ? data.rating
      : Number(data.rating ?? 0) || 0;
  const studentsEnrolled =
    typeof data.studentsEnrolled === "number"
      ? data.studentsEnrolled
      : Number(data.studentsEnrolled ?? 0) || 0;

  const instructorObj =
    (typeof data.instructor === "object" && data.instructor !== null
      ? (data.instructor as Record<string, unknown>)
      : null) ?? {};

  const instructorId =
    (data.instructorId as string | undefined) ??
    (instructorObj.id as string | undefined) ??
    "unknown";
  const instructorName =
    (data.instructorName as string | undefined) ??
    (instructorObj.name as string | undefined) ??
    "未設定講師";
  const instructorAvatar =
    (instructorObj.avatar as string | undefined) ?? PLACEHOLDER_THUMBNAIL;
  const instructorBio =
    (instructorObj.bio as string | undefined) ?? "講師資料尚未提供";

  const syllabus = normalizeSyllabus(data.syllabus);
  const modules = normalizeModules(data.modules, syllabus);

  const fallbackSyllabusFromModules: CourseSyllabus[] = [];
  modules.forEach((module) => {
    module.lessons.forEach((lesson) => {
      fallbackSyllabusFromModules.push({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description ?? "",
        duration: lesson.duration,
        order: fallbackSyllabusFromModules.length + 1,
        videoUrl: lesson.videoUrl,
        preview: lesson.preview,
      });
    });
  });

  const resolvedSyllabus =
    syllabus.length > 0 ? syllabus : fallbackSyllabusFromModules;

  const providedLessons =
    typeof data.lessons === "number"
      ? data.lessons
      : Number(data.lessons ?? 0) || 0;
  const derivedLessonCount =
    modules.reduce((sum, module) => sum + module.lessons.length, 0) ||
    resolvedSyllabus.length;
  const lessons =
    providedLessons > 0 ? providedLessons : derivedLessonCount;

  const minutesFromModules = modules.reduce(
    (total, module) =>
      total + module.lessons.reduce((sum, lesson) => sum + lesson.duration, 0),
    0,
  );
  const minutesFromSyllabus = resolvedSyllabus.reduce(
    (sum, item) => sum + item.duration,
    0,
  );
  const totalMinutes =
    minutesFromModules > 0 ? minutesFromModules : minutesFromSyllabus;

  const providedDuration =
    typeof data.duration === "number"
      ? data.duration
      : Number(data.duration ?? 0) || 0;
  const duration =
    providedDuration > 0
      ? providedDuration
      : totalMinutes > 0
      ? Number((totalMinutes / 60).toFixed(1))
      : 0;

  return {
    id,
    title: (data.title as string) ?? "未命名課程",
    description: (data.description as string) ?? "",
    thumbnail:
      (data.thumbnail as string | undefined) ?? PLACEHOLDER_THUMBNAIL,
    instructor: {
      id: instructorId,
      name: instructorName,
      avatar: instructorAvatar,
      bio: instructorBio,
    },
    price,
    category: (data.category as string) ?? "未分類",
    level:
      (data.level as "beginner" | "intermediate" | "advanced") ?? "beginner",
    duration,
    lessons,
    rating,
    studentsEnrolled,
    syllabus: resolvedSyllabus,
    modules,
    tags: Array.isArray(data.tags)
      ? (data.tags as unknown[]).map((tag) => String(tag)).filter(Boolean)
      : [],
    createdAt,
    updatedAt,
    published: Boolean(data.published),
  };
}

const DEFAULT_INSTRUCTOR_EMAIL = "skypassion5000@gmail.com";
const DEFAULT_INSTRUCTOR_DOC_ID = "demo-instructor-skypassion5000";

async function ensureDefaultInstructor() {
  const usersRef = adminDb.collection("users");
  const existing = await usersRef
    .where("email", "==", DEFAULT_INSTRUCTOR_EMAIL)
    .limit(1)
    .get();

  if (!existing.empty) {
    const doc = existing.docs[0];
    const data = doc.data() ?? {};
    return {
      id: doc.id,
      name:
        (data.name as string) ??
        (data.displayName as string) ??
        DEFAULT_INSTRUCTOR_EMAIL,
      avatar: (data.image as string) ?? undefined,
      bio: (data.bio as string) ?? "",
    };
  }

  const defaultProfile = {
    email: DEFAULT_INSTRUCTOR_EMAIL,
    name: DEFAULT_INSTRUCTOR_EMAIL,
    role: "instructor",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=DemoInstructor",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await usersRef.doc(DEFAULT_INSTRUCTOR_DOC_ID).set(defaultProfile, { merge: true });

  return {
    id: DEFAULT_INSTRUCTOR_DOC_ID,
    name: DEFAULT_INSTRUCTOR_EMAIL,
    avatar: defaultProfile.image,
    bio: "",
  };
}

async function ensureDemoCoursesSynced() {
  const instructor = await ensureDefaultInstructor();
  const snapshot = await adminDb.collection("courses").get();
  const existingIds = new Set(snapshot.docs.map((doc) => doc.id));

  const tasks = mockCourses
    .filter((course) => course.published)
    .map(async (course) => {
      if (existingIds.has(course.id)) {
        return;
      }

      const mappedSyllabus = course.syllabus.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        duration: item.duration,
        order: item.order,
        videoUrl: item.videoUrl ?? null,
      }));
      const mappedModules = course.modules.map((module) => ({
        id: module.id,
        title: module.title,
        description: module.description ?? "",
        order: module.order,
        lessons: module.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description ?? "",
          duration: lesson.duration,
          order: lesson.order,
          videoUrl: lesson.videoUrl ?? null,
          preview: Boolean(lesson.preview),
        })),
      }));
      const totalLessons =
        course.modules.reduce((sum, module) => sum + module.lessons.length, 0) ||
        course.lessons;
      const totalMinutes = course.modules.reduce(
        (sum, module) =>
          sum + module.lessons.reduce((inner, lesson) => inner + lesson.duration, 0),
        0,
      );
      const derivedDuration =
        totalMinutes > 0 ? Number((totalMinutes / 60).toFixed(1)) : course.duration;

      await adminDb.collection("courses").doc(course.id).set(
        {
          title: course.title,
          description: course.description,
          thumbnail: course.thumbnail,
          price: course.price,
          category: course.category,
          level: course.level,
          duration: derivedDuration,
          lessons: totalLessons,
          rating: course.rating,
          studentsEnrolled: course.studentsEnrolled,
          tags: course.tags,
          published: true,
          createdAt: course.createdAt,
          updatedAt: new Date(),
          instructorId: instructor.id,
          instructorName: instructor.name,
          instructor: {
            id: instructor.id,
            name: instructor.name,
            avatar: instructor.avatar ?? course.instructor.avatar,
            email: DEFAULT_INSTRUCTOR_EMAIL,
            bio: instructor.bio || course.instructor.bio,
          },
          syllabus: mappedSyllabus,
          modules: mappedModules,
        },
        { merge: true }
      );
    });

  await Promise.all(tasks);
}

async function fetchPublishedCourses(): Promise<PublicCourse[]> {
  await ensureDemoCoursesSynced();

  const snapshot = await adminDb.collection("courses").get();
  const courses = snapshot.docs
    .map((doc) => mapCourseDoc(doc.id, doc.data() ?? {}))
    .filter((course): course is PublicCourse => Boolean(course))
    .filter((course) => course.published)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  if (courses.length > 0) {
    return courses;
  }

  return mockCourses
    .filter((course) => course.published)
    .map(mapMockCourse);
}

export async function getPublishedCourses(): Promise<PublicCourse[]> {
  return fetchPublishedCourses();
}

export async function getFeaturedCourses(limit = 6): Promise<PublicCourse[]> {
  const courses = await fetchPublishedCourses();
  return courses
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
}

export async function getPublishedCourseById(
  courseId: string
): Promise<PublicCourse | null> {
  await ensureDemoCoursesSynced();

  const doc = await adminDb.collection("courses").doc(courseId).get();
  if (doc.exists) {
    const course = mapCourseDoc(doc.id, doc.data() ?? {});
    if (course && course.published) {
      return course;
    }
  }

  const fallback = mockCourses.find(
    (course) => course.id === courseId && course.published
  );

  if (!fallback) {
    return null;
  }

  const instructor = await ensureDefaultInstructor();
  const fallbackTotalLessons =
    fallback.modules.reduce((sum, module) => sum + module.lessons.length, 0) ||
    fallback.lessons;
  const fallbackTotalMinutes = fallback.modules.reduce(
    (total, module) =>
      total + module.lessons.reduce((inner, lesson) => inner + lesson.duration, 0),
    0,
  );
  const fallbackDuration =
    fallbackTotalMinutes > 0
      ? Number((fallbackTotalMinutes / 60).toFixed(1))
      : fallback.duration;

  await adminDb.collection("courses").doc(courseId).set(
    {
      title: fallback.title,
      description: fallback.description,
      thumbnail: fallback.thumbnail,
      price: fallback.price,
      category: fallback.category,
      level: fallback.level,
      duration: fallbackDuration,
      lessons: fallbackTotalLessons,
      rating: fallback.rating,
      studentsEnrolled: fallback.studentsEnrolled,
      tags: fallback.tags,
      published: true,
      createdAt: fallback.createdAt,
      updatedAt: new Date(),
      instructorId: instructor.id,
      instructorName: instructor.name,
      instructor: {
        id: instructor.id,
        name: instructor.name,
        avatar: instructor.avatar ?? fallback.instructor.avatar,
        email: DEFAULT_INSTRUCTOR_EMAIL,
        bio: instructor.bio || fallback.instructor.bio,
      },
      syllabus: fallback.syllabus.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        duration: item.duration,
        order: item.order,
        videoUrl: item.videoUrl ?? null,
      })),
      modules: fallback.modules.map((module) => ({
        id: module.id,
        title: module.title,
        description: module.description ?? "",
        order: module.order,
        lessons: module.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description ?? "",
          duration: lesson.duration,
          order: lesson.order,
          videoUrl: lesson.videoUrl ?? null,
          preview: Boolean(lesson.preview),
        })),
      })),
    },
    { merge: true }
  );

  return mapMockCourse(fallback);
}

export type { PublicCourse };
