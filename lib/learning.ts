import { getCourseByIdFromStore, listEnrollmentsByUser } from "@/lib/d1-repository";

interface ModuleLessonBase {
  id: string;
  title: string;
  description?: string;
  duration: number;
  order: number;
  videoUrl?: string;
  preview?: boolean;
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

export async function getLearningCoursesForUser(
  userId: string,
): Promise<LearningCourse[]> {
  const enrollments = await listEnrollmentsByUser(userId);
  const results: Array<LearningCourse | null> = await Promise.all(
    enrollments.map(async (enrollment) => {
      const course = await getCourseByIdFromStore(enrollment.course_id);
      if (!course) {
        return null;
      }

      const completedSet = new Set(
        enrollment.completed_lessons_json
          ? (JSON.parse(enrollment.completed_lessons_json) as string[])
          : [],
      );
      const flatLessons = course.modules.flatMap((module) => module.lessons);
      const completedLessonsCount = flatLessons.filter((lesson) => completedSet.has(lesson.id)).length;
      const nextLesson = flatLessons.find((lesson) => !completedSet.has(lesson.id));
      const progress =
        flatLessons.length > 0
          ? Math.round((completedLessonsCount / flatLessons.length) * 100)
          : Number(enrollment.progress ?? 0);

      return {
        enrollmentId: enrollment.id,
        courseId: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        lessons: flatLessons.length || course.lessons,
        duration: course.duration,
        progress,
        lastAccessed: enrollment.last_accessed_at ?? enrollment.created_at,
        category: course.category,
        instructorName: course.instructor.name,
        modules: course.modules.map((module) => ({
          ...module,
          lessons: module.lessons.map((lesson) => ({
            ...lesson,
            completed: completedSet.has(lesson.id),
            isNext: nextLesson ? nextLesson.id === lesson.id : false,
          })),
        })),
        completedLessonsCount,
        nextLessonId: nextLesson?.id,
        nextLessonTitle: nextLesson?.title,
      } satisfies LearningCourse;
    }),
  );

  return results
    .filter((item): item is LearningCourse => item !== null)
    .sort(
      (a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime(),
    );
}
