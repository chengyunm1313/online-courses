"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, useCallback } from "react";

export interface CourseFormInstructorOption {
  id: string;
  name: string;
  email?: string;
}

export interface CourseFormInitialValues {
  title?: string;
  description?: string;
  thumbnail?: string;
  price?: number;
  category?: string;
  level?: "beginner" | "intermediate" | "advanced";
  duration?: number;
  lessons?: number;
  tags?: string[];
  published?: boolean;
  instructorId?: string;
  syllabus?: {
    id: string;
    title: string;
    description: string;
    duration: number;
    order: number;
    videoUrl?: string;
  }[];
  modules?: {
    id: string;
    title: string;
    description?: string;
    order?: number;
    lessons: {
      id: string;
      title: string;
      description?: string;
      duration?: number;
      videoUrl?: string;
      preview?: boolean;
      order?: number;
    }[];
  }[];
}

interface CourseFormProps {
  mode: "create" | "edit";
  courseId?: string;
  initialValues?: CourseFormInitialValues;
  instructors?: CourseFormInstructorOption[];
  canEditInstructor: boolean;
  redirectTo: string;
  submitLabel?: string;
}

type LessonForm = {
  id: string;
  title: string;
  description: string;
  duration: string;
  videoUrl: string;
  preview: boolean;
};

type ModuleForm = {
  id: string;
  title: string;
  description: string;
  lessons: LessonForm[];
};

type SanitizedLesson = {
  id: string;
  title: string;
  description?: string;
  duration: number;
  order: number;
  videoUrl?: string;
  preview?: boolean;
};

type SanitizedModule = {
  id: string;
  title: string;
  description?: string;
  order: number;
  lessons: SanitizedLesson[];
};

const generateId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2, 10)}`;

const LEVEL_OPTIONS = [
  { value: "beginner", label: "初級" },
  { value: "intermediate", label: "中級" },
  { value: "advanced", label: "高級" },
];

const createLessonForm = (lesson?: Partial<LessonForm>): LessonForm => ({
  id: lesson?.id || `lesson-${generateId()}`,
  title: lesson?.title ?? "",
  description: lesson?.description ?? "",
  duration: lesson?.duration ?? "0",
  videoUrl: lesson?.videoUrl ?? "",
  preview: Boolean(lesson?.preview),
});

const createModuleForm = (module?: Partial<ModuleForm>): ModuleForm => ({
  id: module?.id || `module-${generateId()}`,
  title: module?.title ?? "",
  description: module?.description ?? "",
  lessons: module?.lessons?.map((lesson) => createLessonForm(lesson)) ?? [],
});

/**
 * 後台／講師課程編輯表單
 */
export default function CourseForm({
  mode,
  courseId,
  initialValues,
  instructors = [],
  canEditInstructor,
  redirectTo,
  submitLabel,
}: CourseFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const defaultValues = useMemo(() => {
    const baseModules = initialValues?.modules?.length
      ? initialValues.modules
          .slice()
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((module) =>
            createModuleForm({
              ...module,
              lessons: module.lessons
                .slice()
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((lesson) =>
                  createLessonForm({
                    id: lesson.id,
                    title: lesson.title,
                    description: lesson.description ?? "",
                    duration: String(lesson.duration ?? 0),
                    videoUrl: lesson.videoUrl ?? "",
                    preview: Boolean(lesson.preview),
                  })
                ),
            })
          )
      : undefined;

    const syllabusFallback = initialValues?.syllabus?.length
      ? [
          createModuleForm({
            id: "module-1",
            title: "課程內容",
            lessons: initialValues.syllabus.map((item) =>
              createLessonForm({
                id: item.id,
                title: item.title,
                description: item.description,
                duration: String(item.duration ?? 0),
                videoUrl: item.videoUrl ?? "",
                preview: item.preview ?? item.order <= 2,
              })
            ),
          }),
        ]
      : [createModuleForm()];

    return {
      title: initialValues?.title ?? "",
      description: initialValues?.description ?? "",
      thumbnail: initialValues?.thumbnail ?? "",
      price: initialValues?.price ?? 0,
      category: initialValues?.category ?? "",
      level: initialValues?.level ?? "beginner",
      duration: initialValues?.duration ?? 0,
      lessons: initialValues?.lessons ?? 0,
      tags: initialValues?.tags?.join(", ") ?? "",
      published: Boolean(initialValues?.published),
      instructorId: initialValues?.instructorId ?? instructors[0]?.id ?? "",
      modules: baseModules ?? syllabusFallback,
    };
  }, [initialValues, instructors]);

  const [title, setTitle] = useState(defaultValues.title);
  const [description, setDescription] = useState(defaultValues.description);
  const [thumbnail, setThumbnail] = useState(defaultValues.thumbnail);
  const [price, setPrice] = useState(String(defaultValues.price || ""));
  const [category, setCategory] = useState(defaultValues.category);
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">(
    defaultValues.level as "beginner" | "intermediate" | "advanced"
  );
  const [duration, setDuration] = useState(String(defaultValues.duration || ""));
  const [lessons, setLessons] = useState(String(defaultValues.lessons || ""));
  const [tags, setTags] = useState(defaultValues.tags);
  const [published, setPublished] = useState(defaultValues.published);
  const [instructorId, setInstructorId] = useState(defaultValues.instructorId);
  const [modules, setModules] = useState<ModuleForm[]>(defaultValues.modules);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isEditMode = mode === "edit";

  const addModule = useCallback(() => {
    setModules((prev) => [
      ...prev,
      createModuleForm({ title: "", description: "", lessons: [] }),
    ]);
  }, []);

  const removeModule = useCallback((index: number) => {
    setModules((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const updateModuleField = useCallback(
    (index: number, field: keyof ModuleForm, value: string) => {
      setModules((prev) =>
        prev.map((module, idx) =>
          idx === index ? { ...module, [field]: value } : module
        )
      );
    },
    []
  );

  const addLesson = useCallback((moduleIndex: number) => {
    setModules((prev) =>
      prev.map((module, idx) =>
        idx === moduleIndex
          ? {
              ...module,
              lessons: [
                ...module.lessons,
                createLessonForm({ title: "", description: "", duration: "0" }),
              ],
            }
          : module
      )
    );
  }, []);

  const removeLesson = useCallback((moduleIndex: number, lessonIndex: number) => {
    setModules((prev) =>
      prev.map((module, idx) =>
        idx === moduleIndex
          ? {
              ...module,
              lessons: module.lessons.filter((_, lIdx) => lIdx !== lessonIndex),
            }
          : module
      )
    );
  }, []);

  const updateLessonField = useCallback(
    (moduleIndex: number, lessonIndex: number, field: keyof LessonForm, value: string | boolean) => {
      setModules((prev) =>
        prev.map((module, idx) =>
          idx === moduleIndex
            ? {
                ...module,
                lessons: module.lessons.map((lesson, lIdx) =>
                  lIdx === lessonIndex ? { ...lesson, [field]: value } : lesson
                ),
              }
            : module
        )
      );
    },
    []
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!title.trim()) {
      setError("課程名稱為必填欄位");
      return;
    }

    if (canEditInstructor && !instructorId) {
      setError("請選擇課程講師");
      return;
    }

    const sanitizedModules: SanitizedModule[] = modules
      .map((module, moduleIndex) => {
        const sanitizedLessons: SanitizedLesson[] = module.lessons
          .map((lesson, lessonIndex) => {
            const durationNum = Number(lesson.duration);
            const trimmedDescription = lesson.description?.trim();
            const trimmedVideoUrl = lesson.videoUrl?.trim();
            return {
              id: lesson.id || `lesson-${moduleIndex + 1}-${lessonIndex + 1}`,
              title: lesson.title.trim(),
              description: trimmedDescription || undefined,
              duration: Number.isFinite(durationNum) ? Math.max(durationNum, 0) : 0,
              videoUrl: trimmedVideoUrl || undefined,
              preview: Boolean(lesson.preview),
            };
          })
          .filter((lesson) => lesson.title)
          .map((lesson, index) => ({
            ...lesson,
            order: index + 1,
          }));

        if (sanitizedLessons.length === 0 && !module.title.trim()) {
          return null;
        }

        const trimmedModuleDescription = module.description?.trim();
        return {
          id: module.id || `module-${moduleIndex + 1}`,
          title: module.title.trim() || `章節 ${moduleIndex + 1}`,
          description: trimmedModuleDescription || undefined,
          order: moduleIndex + 1,
          lessons: sanitizedLessons,
        };
      })
      .filter((module): module is SanitizedModule => module !== null);

    if (sanitizedModules.length === 0) {
      setError("請至少新增一個章節並包含一堂課程內容");
      return;
    }

    const flattenedSyllabus = sanitizedModules.flatMap((module) => module.lessons);

    const totalLessons = flattenedSyllabus.length;
    const totalMinutes = flattenedSyllabus.reduce(
      (sum, lesson) => sum + (lesson.duration ?? 0),
      0
    );

    const payload: Record<string, unknown> = {
      title,
      description,
      thumbnail,
      price: Number(price) || 0,
      category,
      level,
      duration: Number(duration) || Number((totalMinutes / 60).toFixed(1)) || 0,
      lessons: Number(lessons) || totalLessons,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      published,
      instructorId: canEditInstructor ? instructorId : undefined,
      modules: sanitizedModules,
      syllabus: flattenedSyllabus.map((lesson, index) => ({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description ?? "",
        duration: lesson.duration ?? 0,
        order: index + 1,
        videoUrl: lesson.videoUrl,
        preview: Boolean(lesson.preview),
      })),
    };

    const endpoint = mode === "create" ? "/api/admin/courses" : `/api/admin/courses/${courseId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    startTransition(async () => {
      try {
        const response = await fetch(endpoint, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error ?? "儲存失敗");
        }

        setSuccessMessage("已成功儲存課程");
        setTimeout(() => {
          router.push(redirectTo);
          router.refresh();
        }, 500);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "儲存失敗，請稍後再試");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-900">
            課程名稱 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="請輸入課程名稱"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-800">課程分類</label>
          <input
            type="text"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例如：程式開發、設計"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-800">價格（新台幣）</label>
          <input
            type="number"
            min="0"
            step="1"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例如：1980"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-800">課程等級</label>
          <select
            value={level}
            onChange={(event) => setLevel(event.target.value as "beginner" | "intermediate" | "advanced")}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {LEVEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-800">總時數（小時）</label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例如：24"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-800">課程堂數</label>
          <input
            type="number"
            min="0"
            step="1"
            value={lessons}
            onChange={(event) => setLessons(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例如：12"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-800">講師帳號</label>
          {canEditInstructor ? (
            <select
              value={instructorId}
              onChange={(event) => setInstructorId(event.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">請選擇講師</option>
              {instructors.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name} {option.email ? `（${option.email}）` : ""}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={
                instructors.find((item) => item.id === instructorId)?.name ?? "目前登入帳號"
              }
              disabled
              className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700"
            />
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-800">縮圖網址</label>
          <input
            type="url"
            value={thumbnail}
            onChange={(event) => setThumbnail(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/cover.jpg"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-800">課程描述</label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={5}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="請簡要介紹課程內容與學習重點"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-800">標籤（以逗點分隔）</label>
        <input
          type="text"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例如：JavaScript, 系統設計, 軟體工程"
        />
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">課程章節設定</h2>
            <p className="text-xs text-gray-500">
              建議依章節拆分內容，並提供影片網址與是否免費試看。
            </p>
          </div>
          <button
            type="button"
            onClick={addModule}
            className="inline-flex items-center rounded-md border border-blue-500 px-3 py-1.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
          >
            新增章節模組
          </button>
        </div>

        {modules.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
            目前還沒有章節，請點選「新增章節模組」。
          </div>
        ) : (
          <div className="space-y-6">
            {modules.map((module, moduleIndex) => (
              <div key={module.id} className="space-y-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">章節標題</label>
                        <input
                          type="text"
                          value={module.title}
                          onChange={(event) =>
                            updateModuleField(moduleIndex, "title", event.target.value)
                          }
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={`例如：模組 ${moduleIndex + 1}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">章節描述</label>
                        <textarea
                          value={module.description}
                          onChange={(event) =>
                            updateModuleField(
                              moduleIndex,
                              "description",
                              event.target.value
                            )
                          }
                          rows={3}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="此章節主要學習重點"
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeModule(moduleIndex)}
                    className="inline-flex items-center rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    移除此章節
                  </button>
                </div>

                <div className="space-y-3">
                  {module.lessons.length === 0 ? (
                    <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 p-4 text-xs text-gray-500">
                      尚未新增課程內容。
                    </div>
                  ) : (
                    module.lessons.map((lesson, lessonIndex) => (
                      <div key={lesson.id} className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <p className="text-sm font-semibold text-gray-900">
                            課程 {lessonIndex + 1}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeLesson(moduleIndex, lessonIndex)}
                            className="inline-flex items-center rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                          >
                            移除課程
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-600">標題</label>
                            <input
                              type="text"
                              value={lesson.title}
                              onChange={(event) =>
                                updateLessonField(moduleIndex, lessonIndex, "title", event.target.value)
                              }
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="例如：章節概述"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-600">影片網址</label>
                            <input
                              type="url"
                              value={lesson.videoUrl}
                              onChange={(event) =>
                                updateLessonField(moduleIndex, lessonIndex, "videoUrl", event.target.value)
                              }
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="https://www.youtube.com/watch?v=..."
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-600">描述</label>
                            <textarea
                              value={lesson.description}
                              onChange={(event) =>
                                updateLessonField(moduleIndex, lessonIndex, "description", event.target.value)
                              }
                              rows={3}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="說明本堂課內容"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-600">時長（分鐘）</label>
                            <input
                              type="number"
                              min="0"
                              value={lesson.duration}
                              onChange={(event) =>
                                updateLessonField(moduleIndex, lessonIndex, "duration", event.target.value)
                              }
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="例如：10"
                            />
                          </div>
                        </div>
                        <label className="inline-flex items-center gap-2 text-xs text-gray-600">
                          <input
                            type="checkbox"
                            checked={lesson.preview}
                            onChange={(event) =>
                              updateLessonField(moduleIndex, lessonIndex, "preview", event.target.checked)
                            }
                          />
                          免費試看
                        </label>
                      </div>
                    ))
                  )}
                  <button
                    type="button"
                    onClick={() => addLesson(moduleIndex)}
                    className="inline-flex items-center rounded-md border border-blue-500 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                  >
                    新增課程內容
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div>
          <p className="text-sm font-semibold text-gray-800">公開發布</p>
          <p className="text-xs text-gray-600">開啟後，課程會顯示在課程列表並允許學員購買。</p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">
            {published ? "已發布" : "草稿"}
          </span>
          <input
            type="checkbox"
            checked={published}
            onChange={(event) => setPublished(event.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </label>
      </div>

      {error ? (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-700">
          {successMessage}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push(redirectTo)}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isPending}
        >
          取消
        </button>
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          disabled={isPending}
        >
          {isPending ? "儲存中..." : submitLabel ?? (isEditMode ? "更新課程" : "建立課程")}
        </button>
      </div>
    </form>
  );
}
