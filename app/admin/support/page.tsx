import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Navbar from "@/components/Navbar";
import { authOptions } from "@/lib/auth";
import { listSupportTickets } from "@/lib/d1-repository";

const CATEGORY_LABEL: Record<string, string> = {
  payment: "付款問題",
  refund: "退款申請",
  course: "課程內容",
  account: "帳號問題",
  other: "其他",
};

const STATUS_LABEL: Record<string, string> = {
  open: "待處理",
  in_progress: "處理中",
  resolved: "已完成",
};

export default async function AdminSupportPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/test");
  }
  if (session.user.role !== "admin") {
    redirect("/");
  }

  const tickets = await listSupportTickets();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">客服單管理</h1>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            集中查看付款異常、退款申請與課程問題，避免客服需求散落在 email。
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <th className="px-4 py-3">建立時間</th>
                <th className="px-4 py-3">主旨</th>
                <th className="px-4 py-3">提問者</th>
                <th className="px-4 py-3">分類</th>
                <th className="px-4 py-3">訂單編號</th>
                <th className="px-4 py-3">狀態</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-600">
                    目前沒有任何客服單。
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="align-top text-slate-800 transition hover:bg-slate-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      {ticket.createdAt.toLocaleString("zh-TW")}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-950">{ticket.subject}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{ticket.message}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-950">{ticket.name}</p>
                      <p className="text-xs text-slate-600">{ticket.email}</p>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">{CATEGORY_LABEL[ticket.category] ?? ticket.category}</td>
                    <td className="px-4 py-4 font-mono text-xs">{ticket.orderId ?? "—"}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{STATUS_LABEL[ticket.status] ?? ticket.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
