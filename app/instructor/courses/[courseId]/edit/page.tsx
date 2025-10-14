import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Navbar from "@/components/Navbar";
import { authOptions } from "@/lib/auth";
import { getCourseForManagement } from "@/lib/admin-data";
import CourseForm from "@/components/admin/CourseForm";

interface InstructorEditCoursePageProps {
  params: { courseId: string };
}

export default async function InstructorEditCoursePage({
  params,
}: InstructorEditCoursePageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/test");
  }

  if (session.user.role === "admin") {
    redirect(`/admin/courses/${params.courseId}/edit`);
  }

  if (session.user.role !== "instructor") {
    redirect("/");
  }

  const course = await getCourseForManagement(params.courseId, {
    role: session.user.role,
    userId: session.user.id,
  });

  if (!course) {
    notFound();
  }

  const instructorOption = {
    id: session.user.id,
    name: session.user.name ?? "講師",
    email: session.user.email ?? "",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">編輯課程</h1>
          <p className="text-sm text-gray-600">
            更新課程內容並儲存，學生將看到最新資訊。
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <CourseForm
            mode="edit"
            courseId={course.id}
            canEditInstructor={false}
            instructors={[instructorOption]}
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
            redirectTo="/instructor/courses"
            submitLabel="儲存變更"
          />
        </div>
      </div>
    </div>
  );
}
