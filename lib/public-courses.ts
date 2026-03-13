import type { Course } from "@/types/course";
import { getCourseByIdFromStore, getPublishedCoursesFromStore } from "@/lib/d1-repository";

export type PublicCourse = Course;

export async function getPublishedCourses(): Promise<PublicCourse[]> {
  const courses = await getPublishedCoursesFromStore();
  return courses.filter((course) => course.published);
}

export async function getFeaturedCourses(limit = 6): Promise<PublicCourse[]> {
  const courses = await getPublishedCourses();
  return [...courses].sort((a, b) => b.rating - a.rating).slice(0, limit);
}

export async function getPublishedCourseById(
  courseId: string,
): Promise<PublicCourse | null> {
  const course = await getCourseByIdFromStore(courseId);
  if (!course?.published) {
    return null;
  }
  return course;
}
