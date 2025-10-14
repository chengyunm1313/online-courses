import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Navbar from "@/components/Navbar";
import { authOptions } from "@/lib/auth";
import { listCoursesForManagement } from "@/lib/admin-data";
import CourseList from "@/components/admin/CourseList";

export default async function AdminCoursesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/test");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  const courses = await listCoursesForManagement({
    role: session.user.role,
    userId: session.user.id,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">課程管理</h1>
            <p className="text-sm text-gray-600">
              管理所有已上架與草稿課程，可進行新增、編輯與刪除。
            </p>
          </div>

          <Link
            href="/admin/courses/new"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            新增課程
          </Link>
        </div>

        <CourseList
          courses={courses}
          basePath="/admin/courses"
          canDelete
        />
      </div>
    </div>
  );
}
