import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserOrders } from "@/lib/orders";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import type { Order } from "@/types/order";

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/test");
  }

  // 從 Firebase 獲取當前用戶的訂單
  let userOrders: Order[] = [];
  try {
    userOrders = await getUserOrders(session.user.id);
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    // 如果獲取失敗，顯示空狀態
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
      refunded: "bg-gray-100 text-gray-800",
    };
    const labels = {
      completed: "已完成",
      pending: "處理中",
      cancelled: "已取消",
      refunded: "已退款",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      credit_card: "信用卡",
      paypal: "PayPal",
      bank_transfer: "銀行轉帳",
      other: "其他",
    };
    return labels[method as keyof typeof labels] || method;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">我的訂單</h1>
            <p className="mt-2 text-gray-600">查看您的購買記錄和訂單狀態</p>
          </div>

        {/* Orders List */}
        {userOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">沒有訂單記錄</h3>
            <p className="mt-1 text-sm text-gray-500">您還沒有購買任何課程</p>
            <div className="mt-6">
              <Link
                href="/courses"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                瀏覽課程
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {userOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Order Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">訂單編號: {order.id}</p>
                        <p className="text-sm text-gray-500">
                          下單時間: {order.createdAt.toLocaleDateString("zh-TW", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-0 flex items-center space-x-4">
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="px-6 py-4">
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <Image
                            src={item.courseThumbnail}
                            alt={item.courseTitle}
                            width={120}
                            height={80}
                            className="rounded-lg object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/courses/${item.courseId}`}
                            className="text-base font-medium text-gray-900 hover:text-blue-600"
                          >
                            {item.courseTitle}
                          </Link>
                          <p className="text-sm text-gray-500 mt-1">講師: {item.instructor}</p>
                        </div>
                        <div className="flex-shrink-0">
                          <p className="text-lg font-semibold text-gray-900">
                            NT$ {item.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        付款方式: <span className="font-medium text-gray-900">{getPaymentMethodLabel(order.paymentMethod)}</span>
                      </p>
                      {order.transactionId && (
                        <p className="text-sm text-gray-600 mt-1">
                          交易編號: <span className="font-mono text-xs text-gray-900">{order.transactionId}</span>
                        </p>
                      )}
                      {order.notes && (
                        <p className="text-sm text-gray-600 mt-1">
                          備註: <span className="text-gray-900">{order.notes}</span>
                        </p>
                      )}
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm text-gray-600">
                        小計: <span className="font-medium text-gray-900">NT$ {order.subtotal.toLocaleString()}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        稅金: <span className="font-medium text-gray-900">NT$ {order.tax.toLocaleString()}</span>
                      </p>
                      <p className="text-base font-bold text-gray-900 pt-2 border-t border-gray-300">
                        總計: NT$ {order.total.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
                    {order.status === "completed" && (
                      <Link
                        href="/learning"
                        className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        前往學習
                      </Link>
                    )}
                    <Link
                      href={`/orders/${order.id}`}
                      className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      查看詳情
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
