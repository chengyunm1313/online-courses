import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Navbar from "@/components/Navbar";
import { authOptions } from "@/lib/auth";
import { getAdminReportData } from "@/lib/admin-data";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-TW").format(value);
}

export default async function AdminReportsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/test");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  const report = await getAdminReportData();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">營運報表</h1>
          <p className="text-sm text-gray-600">
            綜觀營收趨勢、每日報名與課程成效，協助您掌握平台成長情況。
          </p>
        </div>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              月度營收與報名數
            </h2>
            <p className="text-xs text-gray-500">
              依月份統計總營收與報名筆數，觀察季節性變化。
            </p>
            <div className="mt-4 space-y-3">
              {report.revenueByMonth.length === 0 ? (
                <p className="text-sm text-gray-600">
                  尚無報名紀錄，完成第一筆交易後即可查看。
                </p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                      <th className="px-3 py-2">月份</th>
                      <th className="px-3 py-2">營收</th>
                      <th className="px-3 py-2">報名數</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {report.revenueByMonth.map((item) => (
                      <tr key={item.month} className="text-gray-700">
                        <td className="px-3 py-2">{item.month}</td>
                        <td className="px-3 py-2">{formatCurrency(item.revenue)}</td>
                        <td className="px-3 py-2">{formatNumber(item.enrollments)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              近兩週每日報名
            </h2>
            <p className="text-xs text-gray-500">
              了解最近 14 天的每日報名變化，可搭配行銷活動評估成效。
            </p>

            <div className="mt-4 h-64 overflow-y-auto">
              {report.dailyEnrollments.length === 0 ? (
                <p className="text-sm text-gray-600">
                  尚無每日資料。
                </p>
              ) : (
                <ul className="space-y-2 text-sm text-gray-700">
                  {report.dailyEnrollments.map((item) => (
                    <li key={item.date} className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
                      <span>{item.date}</span>
                      <span className="font-semibold text-blue-600">
                        {formatNumber(item.count)} 筆
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              課程營收排行榜
            </h2>
            <p className="text-xs text-gray-500">
              依營收由高到低排序，評估熱門課程與後續推廣策略。
            </p>

            <div className="mt-4 space-y-3">
              {report.topCoursesByRevenue.length === 0 ? (
                <p className="text-sm text-gray-600">
                  目前還沒有產生營收的課程。
                </p>
              ) : (
                <ol className="space-y-3 text-sm text-gray-700">
                  {report.topCoursesByRevenue.map((course, index) => (
                    <li
                      key={course.id}
                      className="flex items-start justify-between rounded-md border border-gray-100 bg-gray-50 px-3 py-3"
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 text-xs font-semibold text-blue-600">
                          #{index + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {course.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {course.instructorName} • {formatNumber(course.enrollmentCount)} 位學生
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-green-600">
                        {formatCurrency(course.revenue)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              課程分類概況
            </h2>
            <p className="text-xs text-gray-500">
              檢視各類別的課程數量與報名情況，發掘尚未耕耘的主題。
            </p>

            <div className="mt-4 space-y-2">
              {report.categoryBreakdown.length === 0 ? (
                <p className="text-sm text-gray-600">尚未設定課程分類。</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                      <th className="px-3 py-2">分類</th>
                      <th className="px-3 py-2">課程數</th>
                      <th className="px-3 py-2">報名數</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {report.categoryBreakdown.map((item) => (
                      <tr key={item.category} className="text-gray-700">
                        <td className="px-3 py-2">{item.category}</td>
                        <td className="px-3 py-2">{formatNumber(item.courseCount)}</td>
                        <td className="px-3 py-2">{formatNumber(item.enrollmentCount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
