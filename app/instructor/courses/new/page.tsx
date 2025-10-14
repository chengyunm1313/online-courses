import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Navbar from "@/components/Navbar";
import { authOptions } from "@/lib/auth";
import CourseForm from "@/components/admin/CourseForm";

export default async function InstructorCreateCoursePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/test");
  }

  if (session.user.role === "admin") {
    redirect("/admin/courses/new");
  }

  if (session.user.role !== "instructor") {
    redirect("/");
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
          <h1 className="text-3xl font-bold text-gray-900">建立新課程</h1>
          <p className="text-sm text-gray-600">
            填寫課程資訊後即可送出，若想稍後再補充內容也可以儲存為草稿。
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <CourseForm
            mode="create"
            canEditInstructor={false}
            instructors={[instructorOption]}
            initialValues={{ instructorId: instructorOption.id }}
            redirectTo="/instructor/courses"
            submitLabel="送出課程"
          />
        </div>
      </div>
    </div>
  );
}
