"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Order, OrderStatus, OrderStats } from "@/types/order";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    averageOrderValue: 0,
  });
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // 從 API 獲取訂單數據
  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await fetch("/api/orders?includeStats=true");
        if (!response.ok) throw new Error("Failed to fetch orders");
        const data = await response.json();
        setOrders(data.orders || []);
        if (data.stats) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        // 已保留資料載入流程，頁面目前不額外顯示 loading skeleton。
      }
    }
    fetchOrders();
  }, []);

  // 過濾訂單
  const filteredOrders = orders.filter((order) => {
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    const matchesSearch =
      searchQuery === "" ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // 將日期字符串轉換為 Date 對象
  const normalizeOrder = (order: Order): Order => ({
    ...order,
    createdAt: typeof order.createdAt === 'string' ? new Date(order.createdAt) : order.createdAt,
    updatedAt: typeof order.updatedAt === 'string' ? new Date(order.updatedAt) : order.updatedAt,
    completedAt: order.completedAt
      ? (typeof order.completedAt === 'string' ? new Date(order.completedAt) : order.completedAt)
      : undefined,
  });

  const getStatusBadge = (status: OrderStatus) => {
    const styles: Record<string, string> = {
      PAID: "bg-green-100 text-green-800",
      CREATED: "bg-yellow-100 text-yellow-800",
      FAILED: "bg-red-100 text-red-800",
      CANCELED: "bg-red-100 text-red-800",
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
      refunded: "bg-gray-100 text-gray-800",
    };
    const labels: Record<string, string> = {
      PAID: "已付款",
      CREATED: "待處理",
      FAILED: "付款失敗",
      CANCELED: "已取消",
      completed: "已完成",
      pending: "處理中",
      cancelled: "已取消",
      refunded: "已退款",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    // TODO: 實現更新訂單狀態的 API 調用
    console.log(`Updating order ${orderId} to status ${newStatus}`);
    alert(`訂單 ${orderId} 狀態更新功能即將推出`);
  };

  return (
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-950">訂單管理</h1>
          <p className="mt-2 text-sm leading-6 text-slate-700">管理所有課程訂單和交易記錄</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-xl bg-blue-100 p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">總訂單數</p>
                <p className="text-2xl font-semibold text-slate-950">{stats.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-xl bg-green-100 p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">總營收</p>
                <p className="text-2xl font-semibold text-slate-950">NT$ {stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-xl bg-yellow-100 p-3">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">待處理</p>
                <p className="text-2xl font-semibold text-slate-950">{stats.pendingOrders}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-xl bg-violet-100 p-3">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">已完成</p>
                <p className="text-2xl font-semibold text-slate-950">{stats.completedOrders}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="search" className="mb-2 block text-sm font-semibold text-slate-900">
                搜尋訂單
              </label>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="訂單編號、客戶名稱或電子郵件..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
            </div>
            <div>
              <label htmlFor="status" className="mb-2 block text-sm font-semibold text-slate-900">
                訂單狀態
              </label>
              <select
                id="status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as OrderStatus | "all")}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                <option value="all">全部狀態</option>
                <option value="PAID">已付款</option>
                <option value="CREATED">待付款</option>
                <option value="FAILED">付款失敗</option>
                <option value="completed">已完成</option>
                <option value="pending">處理中</option>
                <option value="cancelled">已取消</option>
                <option value="refunded">已退款</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    訂單資訊
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    客戶
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    課程
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    金額
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    狀態
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-600">
                      沒有找到符合條件的訂單
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const normalizedOrder = normalizeOrder(order);
                    return (
                    <tr key={order.id} className="transition hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-slate-950">{normalizedOrder.id}</div>
                          <div className="text-slate-600">
                            {normalizedOrder.createdAt.toLocaleDateString("zh-TW")}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-slate-950">{order.userName}</div>
                          <div className="text-slate-600">{order.userEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-950">
                          {order.items.length === 1 ? (
                            <div className="flex items-center space-x-2">
                              <Image
                                src={order.items[0].courseThumbnail}
                                alt={order.items[0].courseTitle}
                                width={40}
                                height={30}
                                className="rounded object-cover"
                              />
                              <span className="line-clamp-1">{order.items[0].courseTitle}</span>
                            </div>
                          ) : (
                            <span>{order.items.length} 門課程</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-slate-950">
                          NT$ {order.total.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="text-blue-600 transition hover:text-blue-800"
                          >
                            查看
                          </Link>
                          {order.status === "pending" && (
                            <button
                              onClick={() => handleStatusChange(order.id, "completed")}
                              className="text-green-600 transition hover:text-green-800"
                            >
                              完成
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
}
