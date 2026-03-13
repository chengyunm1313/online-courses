"use client";

import Image from "next/image";
import { useState } from "react";

export interface UserRoleManagerUser {
  id: string;
  name?: string;
  email?: string;
  role: string;
  image?: string;
}

interface UserRoleManagerProps {
  users: UserRoleManagerUser[];
  currentUserId: string;
}

const ROLE_OPTIONS = [
  { value: "instructor", label: "講師" },
  { value: "student", label: "學生" },
];
const ADMIN_OPTION = { value: "admin", label: "管理員" };

/**
 * 後台角色管理元件，提供管理員更新使用者權限
 */
export default function UserRoleManager({
  users,
  currentUserId,
}: UserRoleManagerProps) {
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});
  const [roleMap, setRoleMap] = useState<Record<string, string>>(() =>
    Object.fromEntries(users.map((user) => [user.id, user.role ?? "student"])),
  );

  const handleRoleChange = (userId: string, role: string) => {
    setRoleMap((prev) => ({ ...prev, [userId]: role }));
  };

  const updateUserRole = async (userId: string) => {
    const newRole = roleMap[userId];

    if (!newRole) {
      return;
    }

    setStatusMap((prev) => ({ ...prev, [userId]: "saving" }));

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "更新失敗");
      }

      setStatusMap((prev) => ({ ...prev, [userId]: "success" }));
    } catch (error) {
      console.error(error);
      setStatusMap((prev) => ({ ...prev, [userId]: "error" }));
    } finally {
      setTimeout(() => {
        setStatusMap((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      }, 2000);
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900">帳號與權限管理</h2>
        <p className="text-sm text-gray-600">
          為使用者指派管理員或講師等角色，控制後台存取權限。
        </p>
      </div>

      <div className="divide-y">
        {users.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-600">目前沒有使用者資料。</p>
        ) : (
          users.map((user) => {
            const status = statusMap[user.id];
            const isCurrentUser = user.id === currentUserId;
            const currentRole = roleMap[user.id] ?? "student";
            const isAdminRole = currentRole === "admin";
            const disabled = status === "saving" || isAdminRole;

            return (
              <div
                key={user.id}
                className="flex flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-3">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name ?? user.email ?? "User avatar"}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
                      {(user.name ?? user.email ?? "U").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {user.name ?? "未命名使用者"}
                    </p>
                    <p className="text-xs text-gray-500">{user.email ?? "無信箱資訊"}</p>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-3 md:flex-row md:items-center">
                  <select
                    value={currentRole}
                    onChange={(event) => handleRoleChange(user.id, event.target.value)}
                    className="rounded-md border-gray-300 bg-white text-sm font-medium text-gray-900 shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-500"
                    disabled={disabled}
                  >
                    {isAdminRole ? (
                      <option value={ADMIN_OPTION.value}>
                        {ADMIN_OPTION.label}（不可調整）
                      </option>
                    ) : null}
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => updateUserRole(user.id)}
                    disabled={disabled}
                    className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    {status === "saving"
                      ? "儲存中..."
                      : status === "success"
                      ? "已更新"
                      : "更新權限"}
                  </button>

                  {isAdminRole && (
                    <span className="text-xs text-gray-500">
                      管理員權限僅能由系統維護
                    </span>
                  )}

                  {isCurrentUser && (
                    <span className="text-xs text-gray-500">
                      （您目前使用此帳號登入）
                    </span>
                  )}

                  {status === "error" && (
                    <span className="text-xs text-red-600">更新失敗，請稍後再試。</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
