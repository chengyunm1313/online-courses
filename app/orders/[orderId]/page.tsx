import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { authOptions } from "@/lib/auth";
import { getOrderById } from "@/lib/orders";
import type { OrderItem } from "@/types/order";

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    PAID: "已付款",
    CREATED: "待付款",
    FAILED: "付款失敗",
    CANCELED: "已取消",
    completed: "已完成",
    pending: "處理中",
    cancelled: "已取消",
    refunded: "已退款",
  };
  return labels[status] ?? status;
}

function statusClass(status: string) {
  const map: Record<string, string> = {
    PAID: "bg-green-100 text-green-700",
    CREATED: "bg-yellow-100 text-yellow-700",
    FAILED: "bg-red-100 text-red-700",
    CANCELED: "bg-red-100 text-red-700",
    completed: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    cancelled: "bg-red-100 text-red-700",
    refunded: "bg-gray-200 text-gray-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-700";
}

function formatDate(value?: Date | string) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function paymentMethodLabel(method: string) {
  const labels: Record<string, string> = {
    CREDIT: "信用卡",
    ATM: "ATM 轉帳",
    credit_card: "信用卡",
    paypal: "PayPal",
    bank_transfer: "銀行轉帳",
    other: "其他",
  };
  return labels[method] ?? method;
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/test");
  }

  const resolvedParams = await params;
  const order = await getOrderById(resolvedParams.orderId);

  if (!order) {
    redirect("/orders");
  }

  // 僅允許本人或管理員檢視訂單
  if (session.user.role !== "admin" && order.userId !== session.user.id) {
    redirect("/orders");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">訂單詳情</h1>
            <p className="text-sm text-gray-600">訂單編號：{order.id}</p>
            <p className="text-sm text-gray-500">
              下單時間：{formatDate(order.createdAt)}
            </p>
          </div>
          <Link
            href="/orders"
            className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            返回我的訂單
          </Link>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusClass(order.status)}`}>
              {statusLabel(order.status)}
            </span>
            <span className="text-sm text-gray-500">
              付款方式：{paymentMethodLabel(order.paymentMethod)}
            </span>
            {order.transactionId ? (
              <span className="text-xs text-gray-500">
                交易編號：{order.transactionId}
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 space-y-2">
              <p>
                <span className="font-semibold text-gray-900">姓名：</span>
                {order.userName || "未提供"}
              </p>
              <p>
                <span className="font-semibold text-gray-900">Email：</span>
                {order.userEmail || "未提供"}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 space-y-2">
              <p className="flex justify-between">
                <span>課程金額</span>
                <span className="font-semibold text-gray-900">NT$ {order.subtotal.toLocaleString()}</span>
              </p>
              <p className="flex justify-between">
                <span>稅金</span>
                <span className="font-semibold text-gray-900">NT$ {order.tax.toLocaleString()}</span>
              </p>
              <p className="flex justify-between border-t border-gray-200 pt-2 text-base font-semibold text-gray-900">
                <span>合計</span>
                <span>NT$ {order.total.toLocaleString()}</span>
              </p>
            </div>
          </div>

          {order.notes ? (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
              <p className="font-semibold">備註</p>
              <p className="mt-1 whitespace-pre-line">{order.notes}</p>
            </div>
          ) : null}

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">課程項目</h2>
            <div className="divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200 bg-white">
              {order.items.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">無課程項目</div>
              ) : (
                order.items.map((item: OrderItem) => (
                  <div key={item.courseId} className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
                    <div className="relative h-24 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {item.courseThumbnail ? (
                        <Image
                          src={item.courseThumbnail}
                          alt={item.courseTitle}
                          fill
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="flex flex-1 flex-col gap-1 text-sm text-gray-700">
                      <p className="text-base font-semibold text-gray-900">
                        {item.courseTitle}
                      </p>
                      <p>講師：{item.instructor}</p>
                      <p className="font-semibold text-gray-900">NT$ {item.price.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/courses/${item.courseId}`}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                      >
                        查看課程
                      </Link>
                      {order.status === "completed" || order.status === "PAID" ? (
                        <Link
                          href="/learning"
                          className="rounded-md border border-blue-500 px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-50"
                        >
                          繼續學習
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>最後更新：{formatDate(order.updatedAt)}</span>
          {order.completedAt ? <span>已完成時間：{formatDate(order.completedAt)}</span> : null}
        </div>
      </div>
    </div>
  );
}
