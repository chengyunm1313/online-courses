"use client";

import { useState, useTransition } from "react";

interface LessonProgressToggleProps {
  courseId: string;
  lessonId: string;
  initialCompleted: boolean;
}

export default function LessonProgressToggle({
  courseId,
  lessonId,
  initialCompleted,
}: LessonProgressToggleProps) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggleCompleted = () => {
    setError(null);
    const nextCompleted = !completed;
    setCompleted(nextCompleted);

    startTransition(async () => {
      try {
        const response = await fetch("/api/learning/progress", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            courseId,
            lessonId,
            completed: nextCompleted,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error ?? "更新學習進度失敗");
        }

        window.location.reload();
      } catch (fetchError) {
        setCompleted(!nextCompleted);
        setError(fetchError instanceof Error ? fetchError.message : "更新學習進度失敗");
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={toggleCompleted}
        disabled={isPending}
        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
          completed
            ? "bg-green-100 text-green-700 hover:bg-green-200"
            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
        } disabled:cursor-not-allowed disabled:opacity-70`}
      >
        {isPending ? "更新中..." : completed ? "標記為未完成" : "標記完成"}
      </button>
      {error ? <p className="text-right text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
