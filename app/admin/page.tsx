import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Navbar from "@/components/Navbar";
import { authOptions } from "@/lib/auth";
import {
  getAdminDashboardData,
  AdminCourseSummary,
  AdminInstructorSummary,
} from "@/lib/admin-data";
import UserRoleManager from "@/components/admin/UserRoleManager";

const numberFormatter = new Intl.NumberFormat("zh-TW");
const currencyFormatter = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

function formatCurrency(amount: number) {
  return currencyFormatter.format(amount);
}

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatDate(value?: string) {
  if (!value) {
    return "尚未更新";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "日期格式錯誤";
  }
  return date.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/test");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  const dashboardData = await getAdminDashboardData();
  const { stats, courseSummaries, instructorSummaries, users } = dashboardData;

  const displayedCourses: AdminCourseSummary[] = courseSummaries;
  const displayedInstructors: AdminInstructorSummary[] = instructorSummaries;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-950">後台管理儀表板</h1>
          <p className="text-sm leading-6 text-slate-700">
            透過真實資料掌握平台運營狀況，管理課程、講師與帳號權限。
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/courses"
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <h2 className="text-sm font-semibold text-slate-950">課程 CRUD 管理</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              建立、編輯或下架課程內容，指派講師並維護詳情。
            </p>
            <span className="mt-3 inline-flex items-center text-xs font-semibold text-blue-600">
              前往課程管理 →
            </span>
          </Link>

          <Link
            href="/admin/orders"
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <h2 className="text-sm font-semibold text-slate-950">訂單管理</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              管理課程訂單、追蹤交易狀態與處理付款事宜。
            </p>
            <span className="mt-3 inline-flex items-center text-xs font-semibold text-blue-600">
              前往訂單管理 →
            </span>
          </Link>

          <Link
            href="/admin/reports"
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <h2 className="text-sm font-semibold text-slate-950">營運報表</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              追蹤營收走勢與課程表現，洞察平台成長節奏。
            </p>
            <span className="mt-3 inline-flex items-center text-xs font-semibold text-blue-600">
              查看詳細報表 →
            </span>
          </Link>

          <Link
            href="/admin/discounts"
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <h2 className="text-sm font-semibold text-slate-950">折扣與活動</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              管理促銷折扣碼、活動期間與使用上限，支援真實營運。
            </p>
            <span className="mt-3 inline-flex items-center text-xs font-semibold text-blue-600">
              前往折扣管理 →
            </span>
          </Link>

          <Link
            href="/admin/support"
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <h2 className="text-sm font-semibold text-slate-950">客服單管理</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              集中處理退款、付款異常與課程問題，讓客服需求可追蹤。
            </p>
            <span className="mt-3 inline-flex items-center text-xs font-semibold text-blue-600">
              前往客服單 →
            </span>
          </Link>
        </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="總課程數"
            value={formatNumber(stats.totalCourses)}
            icon={
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            }
          />
          <StatCard
            label="購買學生數"
            helper={`總訂單數：${formatNumber(stats.totalEnrollments)}`}
            value={formatNumber(stats.totalStudents)}
            icon={
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            }
          />
          <StatCard
            label="講師人數"
            helper={`平均評分：${stats.averageRating.toFixed(1)}`}
            value={formatNumber(stats.totalInstructors)}
            icon={
              <svg
                className="h-6 w-6 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            }
          />
          <StatCard
            label="總營收"
            value={formatCurrency(stats.totalRevenue)}
            icon={
              <svg
                className="h-6 w-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
        </section>

        <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">課程表現概況</h2>
                <p className="text-sm leading-6 text-slate-700">
                  依實際報名數排序，觀察熱門課程趨勢。
                </p>
              </div>
              <Link
                href="/admin/courses/new"
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
              >
                新增課程
              </Link>
            </div>

            <div className="divide-y">
              {displayedCourses.length === 0 ? (
                <p className="px-6 py-8 text-sm text-slate-700">
                  尚未有任何課程資料，請先建立課程。
                </p>
              ) : (
                displayedCourses.map((course) => (
                  <div
                    key={course.id}
                    className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {course.title}
                      </p>
                      <p className="text-xs text-slate-600">
                        {course.instructorName} • 更新於 {formatDate(course.updatedAt)}
                      </p>
                    </div>
                    <div className="flex flex-col items-start gap-2 text-sm text-slate-700 md:flex-row md:items-center md:gap-4">
                      <span>{formatNumber(course.enrollmentCount)} 位學生</span>
                      <span>{formatCurrency(course.price)}</span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          course.published
                            ? "bg-green-100 text-green-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {course.published ? "已上架" : "草稿"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b px-6 py-4">
              <h2 className="text-xl font-semibold text-slate-950">講師上傳課程</h2>
              <p className="text-sm leading-6 text-slate-700">
                查看講師貢獻度與課程數量，協助安排內容策略。
              </p>
            </div>

            <div className="divide-y">
              {displayedInstructors.length === 0 ? (
                <p className="px-6 py-8 text-sm text-slate-700">
                  目前還沒有講師上傳課程。
                </p>
              ) : (
                displayedInstructors.map((instructor) => (
                  <div
                    key={instructor.id}
                    className="flex flex-col gap-2 px-6 py-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {instructor.name}
                      </p>
                      <p className="text-xs text-slate-600">
                        {instructor.email ?? "未提供信箱"} • 角色：{instructor.role}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-blue-600">
                      {formatNumber(instructor.courseCount)} 門課程
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <UserRoleManager
          users={users.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.image,
          }))}
          currentUserId={session.user.id}
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  helper?: string;
}

function StatCard({ label, value, icon, helper }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-700">{label}</p>
          <p className="mt-1 text-3xl font-bold text-slate-950">{value}</p>
          {helper ? <p className="mt-1 text-xs text-slate-600">{helper}</p> : null}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 ring-1 ring-blue-100">
          {icon}
        </div>
      </div>
    </div>
  );
}
