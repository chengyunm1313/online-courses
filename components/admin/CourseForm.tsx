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
  subtitle?: string;
  slug?: string;
  description?: string;
  thumbnail?: string;
  ogImage?: string;
  price?: number;
  category?: string;
  level?: "beginner" | "intermediate" | "advanced";
  status?: "draft" | "published" | "archived";
  duration?: number;
  lessons?: number;
  tags?: string[];
  published?: boolean;
  instructorId?: string;
  targetAudience?: string[];
  learningOutcomes?: string[];
  faq?: {
    question: string;
    answer: string;
  }[];
  salesBlocks?: {
    title: string;
    content: string;
  }[];
  seoTitle?: string;
  seoDescription?: string;
  originalPrice?: number;
  salesMode?: "evergreen" | "launch";
  salesStatus?: "draft" | "waitlist" | "selling" | "closed";
  launchStartsAt?: string;
  launchEndsAt?: string;
  showCountdown?: boolean;
  showSeats?: boolean;
  seatLimit?: number;
  soldCountMode?: "paid_orders" | "enrollments";
  leadMagnetEnabled?: boolean;
  leadMagnetTitle?: string;
  leadMagnetDescription?: string;
  leadMagnetCouponCode?: string;
  priceLadders?: {
    id: string;
    name: string;
    price: number;
    startsAt?: string;
    endsAt?: string;
    seatLimit?: number;
    sortOrder: number;
  }[];
  syllabus?: {
    id: string;
    title: string;
    description: string;
    duration: number;
    order: number;
    videoUrl?: string;
    preview?: boolean;
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

const STATUS_OPTIONS = [
  { value: "draft", label: "草稿" },
  { value: "published", label: "已上架" },
  { value: "archived", label: "已封存" },
];

const SALES_MODE_OPTIONS = [
  { value: "evergreen", label: "常態販售" },
  { value: "launch", label: "限時開賣" },
];

const SALES_STATUS_OPTIONS = [
  { value: "draft", label: "尚未公開" },
  { value: "waitlist", label: "收集名單" },
  { value: "selling", label: "販售中" },
  { value: "closed", label: "本期結束" },
];

const SOLD_COUNT_MODE_OPTIONS = [
  { value: "enrollments", label: "已註冊人數" },
  { value: "paid_orders", label: "已付款訂單數" },
];

function toDateTimeLocalValue(value?: string) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

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
      subtitle: initialValues?.subtitle ?? "",
      slug: initialValues?.slug ?? "",
      description: initialValues?.description ?? "",
      thumbnail: initialValues?.thumbnail ?? "",
      ogImage: initialValues?.ogImage ?? "",
      price: initialValues?.price ?? 0,
      category: initialValues?.category ?? "",
      level: initialValues?.level ?? "beginner",
      status: initialValues?.status ?? (initialValues?.published ? "published" : "draft"),
      duration: initialValues?.duration ?? 0,
      lessons: initialValues?.lessons ?? 0,
      tags: initialValues?.tags?.join(", ") ?? "",
      published: Boolean(initialValues?.published),
      instructorId: initialValues?.instructorId ?? instructors[0]?.id ?? "",
      targetAudience: initialValues?.targetAudience?.join("\n") ?? "",
      learningOutcomes: initialValues?.learningOutcomes?.join("\n") ?? "",
      faq:
        initialValues?.faq?.map((item) => `${item.question} | ${item.answer}`).join("\n") ?? "",
      salesBlocks:
        initialValues?.salesBlocks?.map((item) => `${item.title} | ${item.content}`).join("\n") ??
        "",
      seoTitle: initialValues?.seoTitle ?? "",
      seoDescription: initialValues?.seoDescription ?? "",
      originalPrice: initialValues?.originalPrice ?? initialValues?.price ?? 0,
      salesMode: initialValues?.salesMode ?? "evergreen",
      salesStatus: initialValues?.salesStatus ?? (initialValues?.published ? "selling" : "draft"),
      launchStartsAt: toDateTimeLocalValue(initialValues?.launchStartsAt),
      launchEndsAt: toDateTimeLocalValue(initialValues?.launchEndsAt),
      showCountdown: Boolean(initialValues?.showCountdown),
      showSeats: Boolean(initialValues?.showSeats),
      seatLimit: initialValues?.seatLimit ?? 0,
      soldCountMode: initialValues?.soldCountMode ?? "enrollments",
      leadMagnetEnabled: Boolean(initialValues?.leadMagnetEnabled),
      leadMagnetTitle: initialValues?.leadMagnetTitle ?? "",
      leadMagnetDescription: initialValues?.leadMagnetDescription ?? "",
      leadMagnetCouponCode: initialValues?.leadMagnetCouponCode ?? "",
      priceLadders:
        initialValues?.priceLadders
          ?.slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(
            (item) =>
              [
                item.name,
                item.price,
                toDateTimeLocalValue(item.startsAt),
                toDateTimeLocalValue(item.endsAt),
                item.seatLimit ?? "",
              ].join(" | "),
          )
          .join("\n") ?? "",
      modules: baseModules ?? syllabusFallback,
    };
  }, [initialValues, instructors]);

  const [title, setTitle] = useState(defaultValues.title);
  const [subtitle, setSubtitle] = useState(defaultValues.subtitle);
  const [slug, setSlug] = useState(defaultValues.slug);
  const [description, setDescription] = useState(defaultValues.description);
  const [thumbnail, setThumbnail] = useState(defaultValues.thumbnail);
  const [ogImage, setOgImage] = useState(defaultValues.ogImage);
  const [price, setPrice] = useState(String(defaultValues.price || ""));
  const [category, setCategory] = useState(defaultValues.category);
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">(
    defaultValues.level as "beginner" | "intermediate" | "advanced"
  );
  const [status, setStatus] = useState<"draft" | "published" | "archived">(
    defaultValues.status as "draft" | "published" | "archived"
  );
  const [duration, setDuration] = useState(String(defaultValues.duration || ""));
  const [lessons, setLessons] = useState(String(defaultValues.lessons || ""));
  const [tags, setTags] = useState(defaultValues.tags);
  const [instructorId, setInstructorId] = useState(defaultValues.instructorId);
  const [targetAudience, setTargetAudience] = useState(defaultValues.targetAudience);
  const [learningOutcomes, setLearningOutcomes] = useState(defaultValues.learningOutcomes);
  const [faq, setFaq] = useState(defaultValues.faq);
  const [salesBlocks, setSalesBlocks] = useState(defaultValues.salesBlocks);
  const [seoTitle, setSeoTitle] = useState(defaultValues.seoTitle);
  const [seoDescription, setSeoDescription] = useState(defaultValues.seoDescription);
  const [originalPrice, setOriginalPrice] = useState(String(defaultValues.originalPrice || ""));
  const [salesMode, setSalesMode] = useState<"evergreen" | "launch">(
    defaultValues.salesMode as "evergreen" | "launch"
  );
  const [salesStatus, setSalesStatus] = useState<"draft" | "waitlist" | "selling" | "closed">(
    defaultValues.salesStatus as "draft" | "waitlist" | "selling" | "closed"
  );
  const [launchStartsAt, setLaunchStartsAt] = useState(defaultValues.launchStartsAt);
  const [launchEndsAt, setLaunchEndsAt] = useState(defaultValues.launchEndsAt);
  const [showCountdown, setShowCountdown] = useState(Boolean(defaultValues.showCountdown));
  const [showSeats, setShowSeats] = useState(Boolean(defaultValues.showSeats));
  const [seatLimit, setSeatLimit] = useState(String(defaultValues.seatLimit || ""));
  const [soldCountMode, setSoldCountMode] = useState<"paid_orders" | "enrollments">(
    defaultValues.soldCountMode as "paid_orders" | "enrollments"
  );
  const [leadMagnetEnabled, setLeadMagnetEnabled] = useState(
    Boolean(defaultValues.leadMagnetEnabled)
  );
  const [leadMagnetTitle, setLeadMagnetTitle] = useState(defaultValues.leadMagnetTitle);
  const [leadMagnetDescription, setLeadMagnetDescription] = useState(
    defaultValues.leadMagnetDescription
  );
  const [leadMagnetCouponCode, setLeadMagnetCouponCode] = useState(
    defaultValues.leadMagnetCouponCode
  );
  const [priceLadders, setPriceLadders] = useState(defaultValues.priceLadders);
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

    const sanitizedModules = modules
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
      .filter(Boolean) as unknown as SanitizedModule[];

    if (sanitizedModules.length === 0) {
      setError("請至少新增一個章節並包含一堂課程內容");
      return;
    }

    const flattenedSyllabus = sanitizedModules.flatMap((module) => module.lessons);
    const normalizedFaq = faq
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [question, ...answerParts] = line.split("|");
        return {
          question: question?.trim() ?? "",
          answer: answerParts.join("|").trim(),
        };
      })
      .filter((item) => item.question && item.answer);
    const normalizedSalesBlocks = salesBlocks
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [blockTitle, ...contentParts] = line.split("|");
        return {
          title: blockTitle?.trim() ?? "",
          content: contentParts.join("|").trim(),
        };
      })
      .filter((item) => item.title && item.content);
    const normalizedPriceLadders = priceLadders
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const [name, priceValue, startsAtValue, endsAtValue, seatLimitValue] = line
          .split("|")
          .map((item) => item.trim());
        return {
          id: `ladder-${index + 1}`,
          name,
          price: Number(priceValue ?? 0) || 0,
          startsAt: startsAtValue || undefined,
          endsAt: endsAtValue || undefined,
          seatLimit: Number(seatLimitValue ?? 0) || undefined,
          sortOrder: index + 1,
        };
      })
      .filter((item) => item.name && item.price > 0);

    const totalLessons = flattenedSyllabus.length;
    const totalMinutes = flattenedSyllabus.reduce(
      (sum, lesson) => sum + (lesson.duration ?? 0),
      0
    );

    const payload: Record<string, unknown> = {
      title,
      subtitle: subtitle.trim() || undefined,
      slug: slug.trim() || undefined,
      description,
      thumbnail,
      ogImage: ogImage.trim() || undefined,
      price: Number(price) || 0,
      category,
      level,
      status,
      duration: Number(duration) || Number((totalMinutes / 60).toFixed(1)) || 0,
      lessons: Number(lessons) || totalLessons,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      published: status === "published",
      instructorId: canEditInstructor ? instructorId : undefined,
      targetAudience: targetAudience
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      learningOutcomes: learningOutcomes
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      faq: normalizedFaq,
      salesBlocks: normalizedSalesBlocks,
      seoTitle: seoTitle.trim() || undefined,
      seoDescription: seoDescription.trim() || undefined,
      originalPrice: Number(originalPrice) || Number(price) || 0,
      salesMode,
      salesStatus,
      launchStartsAt: launchStartsAt || undefined,
      launchEndsAt: launchEndsAt || undefined,
      showCountdown,
      showSeats,
      seatLimit: Number(seatLimit) || undefined,
      soldCountMode,
      leadMagnetEnabled,
      leadMagnetTitle: leadMagnetTitle.trim() || undefined,
      leadMagnetDescription: leadMagnetDescription.trim() || undefined,
      leadMagnetCouponCode: leadMagnetCouponCode.trim().toUpperCase() || undefined,
      priceLadders: normalizedPriceLadders,
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
          <label className="text-sm font-semibold text-gray-800">副標題</label>
          <input
            type="text"
            value={subtitle}
            onChange={(event) => setSubtitle(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例如：把教學內容變成真正能成交的數位產品"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-800">公開網址 Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例如：build-online-academy"
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
          <label className="text-sm font-semibold text-gray-800">上架狀態</label>
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as "draft" | "published" | "archived")
            }
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-800">OG 圖網址</label>
          <input
            type="url"
            value={ogImage}
            onChange={(event) => setOgImage(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/og-cover.jpg"
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-800">適合對象</label>
          <textarea
            value={targetAudience}
            onChange={(event) => setTargetAudience(event.target.value)}
            rows={5}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={"每行一項，例如：\n想建立線上課程的創作者\n希望擴大招生轉換的講師"}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-800">課程收穫</label>
          <textarea
            value={learningOutcomes}
            onChange={(event) => setLearningOutcomes(event.target.value)}
            rows={5}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={"每行一項，例如：\n完成從銷售頁到付款開通的商業流程\n學會設計售後與對帳機制"}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-800">常見問題</label>
          <textarea
            value={faq}
            onChange={(event) => setFaq(event.target.value)}
            rows={6}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={"每行一組，格式：問題 | 答案\n例如：購買後多久開通？ | 完成付款後立即開通"}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-800">銷售段落</label>
          <textarea
            value={salesBlocks}
            onChange={(event) => setSalesBlocks(event.target.value)}
            rows={6}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={"每行一組，格式：標題 | 內容\n例如：購買保障 | 7 天內可申請人工退款審核"}
          />
        </div>
      </div>

      <section className="space-y-4 rounded-xl border border-blue-100 bg-blue-50/40 p-5">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900">販售設定</h2>
          <p className="text-sm text-gray-600">
            可設定常態販售、等待名單、限時開賣與價格階梯，支援前台倒數與 lead magnet。
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">販售模式</label>
            <select
              value={salesMode}
              onChange={(event) => setSalesMode(event.target.value as "evergreen" | "launch")}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SALES_MODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">販售狀態</label>
            <select
              value={salesStatus}
              onChange={(event) =>
                setSalesStatus(
                  event.target.value as "draft" | "waitlist" | "selling" | "closed"
                )
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SALES_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">原價（顯示刪除線）</label>
            <input
              type="number"
              min="0"
              step="1"
              value={originalPrice}
              onChange={(event) => setOriginalPrice(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如：2980"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">售出數基準</label>
            <select
              value={soldCountMode}
              onChange={(event) =>
                setSoldCountMode(event.target.value as "paid_orders" | "enrollments")
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SOLD_COUNT_MODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">開賣時間</label>
            <input
              type="datetime-local"
              value={launchStartsAt}
              onChange={(event) => setLaunchStartsAt(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">結束時間</label>
            <input
              type="datetime-local"
              value={launchEndsAt}
              onChange={(event) => setLaunchEndsAt(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">名額上限</label>
            <input
              type="number"
              min="0"
              step="1"
              value={seatLimit}
              onChange={(event) => setSeatLimit(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如：100"
            />
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 md:justify-center">
            <label className="flex items-center gap-3 text-sm font-semibold text-gray-800">
              <input
                type="checkbox"
                checked={showCountdown}
                onChange={(event) => setShowCountdown(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              顯示倒數計時
            </label>
            <label className="flex items-center gap-3 text-sm font-semibold text-gray-800">
              <input
                type="checkbox"
                checked={showSeats}
                onChange={(event) => setShowSeats(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              顯示剩餘名額
            </label>
            <label className="flex items-center gap-3 text-sm font-semibold text-gray-800">
              <input
                type="checkbox"
                checked={leadMagnetEnabled}
                onChange={(event) => setLeadMagnetEnabled(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              啟用 lead magnet
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">Lead Magnet 標題</label>
            <input
              type="text"
              value={leadMagnetTitle}
              onChange={(event) => setLeadMagnetTitle(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如：留下 Email 立即取得早鳥優惠"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">Lead Magnet 折扣碼</label>
            <input
              type="text"
              value={leadMagnetCouponCode}
              onChange={(event) => setLeadMagnetCouponCode(event.target.value.toUpperCase())}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如：EARLY100"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-800">Lead Magnet 說明</label>
          <textarea
            value={leadMagnetDescription}
            onChange={(event) => setLeadMagnetDescription(event.target.value)}
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例如：留下 Email 可收到限時優惠與開賣通知。"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-800">價格階梯</label>
          <textarea
            value={priceLadders}
            onChange={(event) => setPriceLadders(event.target.value)}
            rows={5}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={"每行一階，格式：名稱 | 價格 | 開始時間 | 結束時間 | 名額上限\n例如：早鳥票 | 1680 | 2026-03-20T10:00 | 2026-03-27T23:59 | 50"}
          />
          <p className="text-xs text-gray-600">
            只要填名稱與價格即可；日期與名額可留空。系統會依順序判定目前階梯與下一階價格。
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-800">SEO 標題</label>
          <input
            type="text"
            value={seoTitle}
            onChange={(event) => setSeoTitle(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="搜尋結果標題"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-800">SEO 描述</label>
          <textarea
            value={seoDescription}
            onChange={(event) => setSeoDescription(event.target.value)}
            rows={4}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="搜尋結果與社群分享描述"
          />
        </div>
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

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm font-semibold text-gray-800">上架說明</p>
        <p className="mt-1 text-xs text-gray-600">
          草稿不會在前台曝光；已上架課程可直接招生；封存則保留資料但不再對外販售。
        </p>
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
