import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Navbar from "@/components/Navbar";
import { authOptions } from "@/lib/auth";
import { getInstructorCourses } from "@/lib/admin-data";
import CourseList from "@/components/admin/CourseList";

export default async function InstructorCoursesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/test");
  }

  if (session.user.role === "admin") {
    redirect("/admin/courses");
  }

  if (session.user.role !== "instructor") {
    redirect("/");
  }

  const courses = await getInstructorCourses(session.user.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">我的課程</h1>
            <p className="text-sm text-gray-600">
              查看並管理您所建立的課程，可以隨時更新或新增內容。
            </p>
          </div>

          <Link
            href="/instructor/courses/new"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            建立新課程
          </Link>
        </div>

        <CourseList
          courses={courses}
          basePath="/instructor/courses"
          canDelete={false}
          emptyMessage="目前沒有任何課程，立即新增一門課程開始分享您的專業。"
        />
      </div>
    </div>
  );
}
