import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { authOptions } from "@/lib/auth";
import { getOrderById } from "@/lib/orders";
import type { OrderItem } from "@/types/order";
import OrderOperationsForm from "@/components/admin/OrderOperationsForm";

function formatDate(value: Date | string | undefined) {
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

function PaymentMethodLabel({ method }: { method: string }) {
  const map: Record<string, string> = {
    credit_card: "信用卡",
    paypal: "PayPal",
    bank_transfer: "銀行轉帳",
    other: "其他",
  };
  return <>{map[method] ?? method}</>;
}

function formatDateTimeLocal(value?: Date | string) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

const statusStyle: Record<string, string> = {
  completed: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-gray-200 text-gray-700",
};

const statusLabel: Record<string, string> = {
  completed: "已完成",
  pending: "處理中",
  cancelled: "已取消",
  refunded: "已退款",
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/test");
  }

  if (session.user.role !== "admin") {
    redirect("/admin");
  }

  const resolvedParams = await params;
  const order = await getOrderById(resolvedParams.orderId);

  if (!order) {
    redirect("/admin/orders");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">訂單詳情</h1>
            <p className="text-sm text-slate-700">訂單編號：{order.id}</p>
          </div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
          >
            返回訂單列表
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[order.status] ?? "bg-gray-100 text-gray-700"}`}
              >
                {statusLabel[order.status] ?? order.status}
              </span>
              <span className="text-sm text-slate-600">
                下單時間：{formatDate(order.createdAt)}
              </span>
              {order.completedAt ? (
                <span className="text-sm text-slate-600">
                  完成時間：{formatDate(order.completedAt)}
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-slate-950">購買人資訊</h2>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 space-y-1">
                  <p>
                    <span className="font-semibold text-slate-950">姓名：</span>
                    {order.userName || "未提供"}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-950">Email：</span>
                    {order.userEmail || "未提供"}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-950">付款方式：</span>
                    <PaymentMethodLabel method={order.paymentMethod} />
                  </p>
                  {order.transactionId ? (
                    <p>
                      <span className="font-semibold text-slate-950">交易編號：</span>
                      {order.transactionId}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-slate-950">金額資訊</h2>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 space-y-1">
                  <p className="flex items-center justify-between">
                    <span>課程金額</span>
                    <span className="font-semibold text-slate-950">NT$ {order.subtotal.toLocaleString()}</span>
                  </p>
                  {order.discountAmount > 0 ? (
                    <p className="flex items-center justify-between text-green-800">
                      <span>折扣</span>
                      <span className="font-semibold">- NT$ {order.discountAmount.toLocaleString()}</span>
                    </p>
                  ) : null}
                  <p className="flex items-center justify-between">
                    <span>稅額</span>
                    <span className="font-semibold text-slate-950">NT$ {order.tax.toLocaleString()}</span>
                  </p>
                  <p className="flex items-center justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-950">
                    <span>合計</span>
                    <span>NT$ {order.total.toLocaleString()}</span>
                  </p>
                </div>
              </div>
            </div>

            {order.notes ? (
              <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
                <p className="font-semibold">備註</p>
                <p className="mt-1 whitespace-pre-line">{order.notes}</p>
              </div>
            ) : null}

            <div>
              <h2 className="text-sm font-semibold text-slate-950">購買項目</h2>
              <div className="mt-3 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
                {order.items.length === 0 ? (
                  <div className="p-4 text-sm text-slate-600">此訂單沒有課程項目。</div>
                ) : (
                  order.items.map((item: OrderItem) => (
                    <div key={item.courseId} className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
                      <div className="relative h-24 w-32 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                        {item.courseThumbnail ? (
                          <Image
                            src={item.courseThumbnail}
                            alt={item.courseTitle}
                            fill
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="flex flex-1 flex-col gap-1 text-sm text-slate-800">
                        <p className="text-base font-semibold text-slate-950">
                          {item.courseTitle}
                        </p>
                        <p>講師：{item.instructor}</p>
                        <p className="font-semibold text-slate-950">
                          NT$ {item.price.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/courses/${item.courseId}`}
                          className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-800 transition hover:bg-slate-100"
                        >
                          查看課程
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">操作</h2>
              <div className="mt-4">
                <OrderOperationsForm
                  orderId={order.id}
                  refundStatus={order.refundStatus}
                  refundReason={order.refundReason}
                  refundNote={order.refundNote}
                  refundRequestedAt={formatDateTimeLocal(order.refundRequestedAt)}
                  refundedAt={formatDateTimeLocal(order.refundedAt)}
                  reconciliationStatus={order.reconciliationStatus}
                  notes={order.notes}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3 text-sm text-slate-800">
              <h2 className="text-lg font-semibold text-slate-950">其他資訊</h2>
              <p>建立時間：{formatDate(order.createdAt)}</p>
              <p>更新時間：{formatDate(order.updatedAt)}</p>
              <p>退款狀態：{order.refundStatus ?? "none"}</p>
              <p>對帳狀態：{order.reconciliationStatus ?? "pending"}</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
