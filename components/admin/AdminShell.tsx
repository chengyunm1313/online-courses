"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";

interface AdminShellProps {
  userName?: string | null;
  children: ReactNode;
}

const NAV_GROUPS = [
  {
    label: "營運管理",
    items: [
      { href: "/admin", label: "總覽" },
      { href: "/admin/courses", label: "課程管理" },
      { href: "/admin/orders", label: "訂單管理" },
      { href: "/admin/reports", label: "營運報表" },
      { href: "/admin/discounts", label: "折扣碼" },
      { href: "/admin/support", label: "客服單" },
    ],
  },
  {
    label: "系統設定",
    items: [
      { href: "/admin/settings/users", label: "帳號與權限管理" },
      { href: "/admin/settings/site", label: "全站設定" },
    ],
  },
];

const PAGE_LABELS: Array<{ prefix: string; label: string }> = [
  { prefix: "/admin/settings/users", label: "帳號與權限管理" },
  { prefix: "/admin/settings/site", label: "全站設定" },
  { prefix: "/admin/courses/new", label: "建立課程" },
  { prefix: "/admin/courses/", label: "編輯課程" },
  { prefix: "/admin/courses", label: "課程管理" },
  { prefix: "/admin/orders/", label: "訂單詳情" },
  { prefix: "/admin/orders", label: "訂單管理" },
  { prefix: "/admin/reports", label: "營運報表" },
  { prefix: "/admin/discounts", label: "折扣碼" },
  { prefix: "/admin/support", label: "客服單" },
  { prefix: "/admin/activity", label: "活動紀錄" },
  { prefix: "/admin", label: "後台總覽" },
];

export default function AdminShell({ userName, children }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentLabel = useMemo(
    () => PAGE_LABELS.find((item) => pathname?.startsWith(item.prefix))?.label ?? "後台",
    [pathname],
  );

  const sidebar = (
    <div className="flex h-full flex-col border-r border-slate-200 bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 px-5 py-5">
        <Link href="/admin" className="text-lg font-bold tracking-tight text-white">
          線上學院後台
        </Link>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          將平台營運、客服與系統設定集中管理。
        </p>
      </div>
      <div className="flex-1 space-y-8 overflow-y-auto px-4 py-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {group.label}
            </p>
            <nav className="mt-3 space-y-1">
              {group.items.map((item) => {
                const active =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center rounded-xl px-3 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-300 hover:bg-slate-900 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="lg:hidden">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Back Office</p>
            <h1 className="text-lg font-semibold text-slate-950">{currentLabel}</h1>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800"
          >
            {mobileOpen ? "關閉選單" : "後台選單"}
          </button>
        </div>
        {mobileOpen ? <div className="h-[calc(100vh-73px)]">{sidebar}</div> : null}
      </div>

      <div className="lg:grid lg:min-h-screen lg:grid-cols-[272px_minmax(0,1fr)]">
        <aside className="hidden lg:block">{sidebar}</aside>

        <div className="flex min-w-0 flex-col">
          <header className="hidden border-b border-slate-200 bg-white px-8 py-5 shadow-sm lg:flex lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Back Office</p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-950">{currentLabel}</h1>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-slate-500">目前登入</p>
              <p className="text-sm font-semibold text-slate-900">{userName || "管理員"}</p>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
