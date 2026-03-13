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

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
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
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-950">營運報表</h1>
          <p className="text-sm leading-6 text-slate-700">
            聚焦銷售、退款與折扣成效，協助您快速判斷目前營運狀態。
          </p>
        </div>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">淨營收</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {formatCurrency(report.kpis.netRevenue)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              已付款 {formatNumber(report.kpis.paidOrderCount)} 筆，原價營收 {formatCurrency(report.kpis.grossRevenue)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">付款成功率</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {formatPercent(report.kpis.paymentSuccessRate)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              以全部訂單為分母計算，用來觀察結帳完成品質。
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">退款率</p>
            <p className="mt-2 text-3xl font-bold text-amber-600">
              {formatPercent(report.kpis.refundRate)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              已申請 / 處理中 / 已退款共 {formatNumber(report.kpis.refundedOrderCount)} 筆。
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">折扣讓利</p>
            <p className="mt-2 text-3xl font-bold text-blue-600">
              {formatCurrency(report.kpis.discountGiven)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              累積折扣金額，可用來評估活動成本。
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">結帳漏斗</h2>
            <p className="text-sm leading-6 text-slate-700">
              最近 30 天從課程購買頁到付款成功的轉換情況。
            </p>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">購買頁瀏覽</p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">
                    {formatNumber(report.funnel.purchasePageViews)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">折扣碼套用</p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">
                    {formatNumber(report.funnel.discountApplied)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">開始結帳</p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">
                    {formatNumber(report.funnel.checkoutStarted)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">建立訂單</p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">
                    {formatNumber(report.funnel.ordersCreated)}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">付款成功</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-600">
                    {formatNumber(report.funnel.paymentsSucceeded)}
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
                <p>購買頁 → 開始結帳：{formatPercent(report.funnel.purchaseToCheckoutRate)}</p>
                <p className="mt-1">開始結帳 → 付款成功：{formatPercent(report.funnel.checkoutToPaidRate)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">折扣碼使用排行</h2>
            <p className="text-sm leading-6 text-slate-700">
              依使用次數排序，快速判斷哪些促銷活動真的有被用到。
            </p>
            <div className="mt-4 space-y-3">
              {report.topDiscounts.length === 0 ? (
                <p className="text-sm text-slate-700">目前還沒有任何折扣碼資料。</p>
              ) : (
                <ol className="space-y-3 text-sm text-slate-700">
                  {report.topDiscounts.map((discount, index) => (
                    <li
                      key={discount.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-blue-600">#{index + 1}</span>
                        <div>
                          <p className="font-semibold text-slate-950">{discount.code}</p>
                          <p className="text-xs text-slate-600">
                            {discount.valueLabel} • {discount.enabled ? "啟用中" : "已停用"}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">
                        {formatNumber(discount.usageCount)} 次
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">營運判讀</h2>
            <p className="text-sm leading-6 text-slate-700">
              用目前的訂單資料，先給管理後台一個能直接行動的摘要。
            </p>
            <div className="mt-4 space-y-3 text-sm text-slate-800">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-950">付款狀態</p>
                <p className="mt-1">
                  目前付款成功率為 {formatPercent(report.kpis.paymentSuccessRate)}，若持續低於 70%，建議優先檢查結帳文案、金流選項與付款失敗原因。
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-950">退款風險</p>
                <p className="mt-1">
                  目前退款率為 {formatPercent(report.kpis.refundRate)}，若上升，應先交叉檢查課程銷售頁承諾、付款後交付內容與客服回應速度。
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-950">促銷成本</p>
                <p className="mt-1">
                  累積折扣讓利 {formatCurrency(report.kpis.discountGiven)}。如果折扣碼使用次數高，但淨營收沒有跟著成長，代表活動結構需要重調。
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              月度營收與報名數
            </h2>
            <p className="text-sm leading-6 text-slate-700">
              依月份統計總營收與報名筆數，觀察季節性變化。
            </p>
            <div className="mt-4 space-y-3">
              {report.revenueByMonth.length === 0 ? (
                <p className="text-sm text-slate-700">
                  尚無報名紀錄，完成第一筆交易後即可查看。
                </p>
              ) : (
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      <th className="px-3 py-2">月份</th>
                      <th className="px-3 py-2">營收</th>
                      <th className="px-3 py-2">報名數</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {report.revenueByMonth.map((item) => (
                      <tr key={item.month} className="text-slate-800">
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

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              近兩週每日報名
            </h2>
            <p className="text-sm leading-6 text-slate-700">
              了解最近 14 天的每日報名變化，可搭配行銷活動評估成效。
            </p>

            <div className="mt-4 h-64 overflow-y-auto">
              {report.dailyEnrollments.length === 0 ? (
                <p className="text-sm text-slate-700">
                  尚無每日資料。
                </p>
              ) : (
                <ul className="space-y-2 text-sm text-slate-800">
                  {report.dailyEnrollments.map((item) => (
                    <li key={item.date} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
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
