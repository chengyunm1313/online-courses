import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Navbar from "@/components/Navbar";
import { authOptions } from "@/lib/auth";
import {
  getCourseForManagement,
  listInstructorOptions,
} from "@/lib/admin-data";
import CourseForm from "@/components/admin/CourseForm";

interface AdminEditCoursePageProps {
  params: { courseId: string };
}

export default async function AdminEditCoursePage({ params }: AdminEditCoursePageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/test");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  const [course, instructorOptions] = await Promise.all([
    getCourseForManagement(params.courseId, {
      role: session.user.role,
      userId: session.user.id,
    }),
    listInstructorOptions(),
  ]);

  if (!course) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">編輯課程</h1>
          <p className="text-sm text-gray-600">
            更新課程資訊後記得儲存，已發布課程將立即同步最新內容。
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <CourseForm
            mode="edit"
            courseId={course.id}
            canEditInstructor
            instructors={instructorOptions}
            initialValues={{
              title: course.title,
              description: course.description,
              thumbnail: course.thumbnail,
              price: course.price,
              category: course.category,
              level: course.level as "beginner" | "intermediate" | "advanced",
              duration: course.duration,
              lessons: course.lessons,
              tags: course.tags,
              published: course.published,
              instructorId: course.instructorId,
              modules: course.modules,
            }}
            redirectTo="/admin/courses"
            submitLabel="儲存變更"
          />
        </div>
      </div>
    </div>
  );
}
