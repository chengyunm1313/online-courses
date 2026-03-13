import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listInstructorOptions } from "@/lib/admin-data";
import CourseForm from "@/components/admin/CourseForm";

export default async function AdminCreateCoursePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/test");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  const instructorOptionsRaw = await listInstructorOptions();
  const instructorOptions = instructorOptionsRaw.some((option) => option.id === session.user.id)
    ? instructorOptionsRaw
    : [
        {
          id: session.user.id,
          name: session.user.name ?? "管理員",
          email: session.user.email ?? "",
        },
        ...instructorOptionsRaw,
      ];

  return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">建立新課程</h1>
          <p className="text-sm text-gray-600">
            請填寫基本資訊並指派講師，儲存後即可由學生報名或稍後再編輯內容。
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <CourseForm
            mode="create"
            canEditInstructor
            instructors={instructorOptions}
            redirectTo="/admin/courses"
            submitLabel="建立課程"
          />
        </div>
      </div>
  );
}
