import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import CourseCatalog from "@/components/courses/CourseCatalog";
import { getPublishedCourses, type PublicCourse } from "@/lib/public-courses";

type SerializableCourse = Omit<PublicCourse, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

function serializeCourses(courses: PublicCourse[]): SerializableCourse[] {
  return courses.map((course) => ({
    ...course,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
  }));
}

export default async function CoursesPage() {
  const courses = await getPublishedCourses();
  const serializedCourses = serializeCourses(courses);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <CourseCatalog courses={serializedCourses} />
      </div>
      <SiteFooter />
    </div>
  );
}
export const dynamic = "force-dynamic";
