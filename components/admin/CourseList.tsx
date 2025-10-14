"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { AdminCourseSummary } from "@/lib/admin-data";

interface CourseListProps {
  courses: AdminCourseSummary[];
  basePath: string;
  canDelete: boolean;
  emptyMessage?: string;
}

/**
 * 後台課程列表，支援編輯與刪除操作
 */
export default function CourseList({
  courses,
  basePath,
  canDelete,
  emptyMessage = "目前尚未建立任何課程。",
}: CourseListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = (courseId: string, title: string) => {
    if (!canDelete) {
      return;
    }

    const confirmed = window.confirm(`確定要刪除「${title}」嗎？此操作無法復原。`);
    if (!confirmed) {
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/courses/${courseId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error ?? "刪除課程失敗");
        }

        router.refresh();
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "刪除課程失敗");
      }
    });
  };

  if (courses.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-600">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                課程名稱
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                講師
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                類別
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                報名數
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                狀態
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                最近更新
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white text-sm">
            {courses.map((course) => (
              <tr key={course.id} className="hover:bg-gray-50">
                <td className="max-w-xs px-4 py-3">
                  <p className="truncate font-medium text-gray-900" title={course.title}>
                    {course.title}
                  </p>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {course.instructorName ?? "—"}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {course.category ?? "未分類"}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {course.enrollmentCount.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      course.published
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {course.published ? "已上架" : "草稿"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {course.updatedAt
                    ? new Date(course.updatedAt).toLocaleDateString("zh-TW")
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`${basePath}/${course.id}/edit`}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                    >
                      編輯
                    </Link>
                    {canDelete ? (
                      <button
                        type="button"
                        onClick={() => handleDelete(course.id, course.title)}
                        className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:bg-gray-100"
                        disabled={isPending}
                      >
                        刪除
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
