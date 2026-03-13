"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function EnrollButton({
  courseId,
  isLoggedIn,
  isEnrolled,
  nextLessonId,
  hasPreviewLessons = false,
  ctaLabel,
}: {
  courseId: string;
  isLoggedIn: boolean;
  isEnrolled: boolean;
  nextLessonId?: string | null;
  hasPreviewLessons?: boolean;
  ctaLabel?: string;
}) {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isEnrolled) {
    const target = nextLessonId ? `#lesson-${nextLessonId}` : "#catalog";
    return (
      <div className="space-y-3">
        <a
          href={target}
          className="inline-flex w-full justify-center rounded-lg bg-green-600 py-3 px-6 font-semibold text-white transition hover:bg-green-700"
        >
          {nextLessonId ? "繼續學習" : "查看章節"}
        </a>
        <p className="text-center text-xs text-gray-500">
          已加入「我的學習」，可在此頁面或學習清單中持續追蹤進度。
        </p>
      </div>
    );
  }

  const handleEnroll = async () => {
    if (!isLoggedIn) {
      router.push("/auth/test");
      return;
    }

    setError(null);
    setIsRedirecting(true);
    router.push(`/purchase/${courseId}`);
  };

  return (
    <div className="space-y-3">
      {!isEnrolled && isLoggedIn && hasPreviewLessons ? (
        <a
          href="#catalog"
          className="inline-flex w-full justify-center rounded-lg border border-blue-200 bg-blue-50 py-3 px-6 font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
        >
          開始試看
        </a>
      ) : null}
      <button
        onClick={handleEnroll}
        disabled={isRedirecting}
        className="w-full rounded-lg bg-blue-600 py-3 px-6 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {isRedirecting
          ? "前往購買..."
          : isLoggedIn
            ? ctaLabel || "立即購買"
            : hasPreviewLessons
              ? "登入後試看課程"
              : "登入後購買"}
      </button>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
