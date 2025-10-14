import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import { getPublishedCourseById } from "@/lib/public-courses";
import VideoEmbed from "@/components/VideoEmbed";
import EnrollButton from "./EnrollButton";
export const dynamic = "force-dynamic";
import {
  getEnrollmentStatusForUser,
  touchEnrollmentLastAccessed,
} from "@/lib/enrollments";

const SECTION_CONFIG = [
  { id: "overview", label: "總覽" },
  { id: "introduction", label: "課程介紹" },
  { id: "catalog", label: "目錄與試看" },
  { id: "plans", label: "選購方案" },
  { id: "instructor", label: "講師" },
  { id: "faq", label: "常見問題" },
  { id: "qa", label: "問與答" },
];

const FALLBACK_FAQ = [
  {
    question: "課程購買後多久可以開始學習？",
    answer: "完成付款後即可立即開始觀看所有課程內容，沒有觀看次數限制。",
  },
  {
    question: "是否提供課程更新與下載資料？",
    answer: "講師會視最新業界趨勢不定期更新內容，並提供相關練習檔與範本供下載。",
  },
  {
    question: "付款方式有哪些？",
    answer: "目前支援 ATM 轉帳，未來將持續擴充信用卡等多元金流。",
  },
];

const FALLBACK_QA = [
  {
    question: "需要具備程式基礎才能學嗎？",
    answer: "課程從基礎觀念開始說明，適合零基礎到初學者。",
  },
  {
    question: "可以重複觀看嗎？",
    answer: "課程提供終身不限次數觀看，隨時登入即可複習。",
  },
];

const FALLBACK_VIDEO_IDS = ["4mEddAUzzgk", "K2_lgpTThEw", "KHCHTCXGyug"];

function formatMinutesToTime(min: number) {
  const hours = Math.floor(min / 60);
  const minutes = min % 60;
  if (hours === 0) return `${minutes} 分鐘`;
  return `${hours} 小時 ${minutes} 分鐘`;
}

function extractYouTubeId(url?: string) {
  if (!url) return null;
  try {
    const parsed = new URL(url, "https://youtube.com");
    if (parsed.hostname.includes("youtube.com")) {
      const v = parsed.searchParams.get("v");
      if (v) return v;
      const segments = parsed.pathname.split("/").filter(Boolean);
      if (segments[0] === "embed" && segments[1]) return segments[1];
    }
    if (parsed.hostname === "youtu.be") {
      const id = parsed.pathname.replace("/", "");
      return id || null;
    }
  } catch {
    return null;
  }
  return null;
}

function levelLabel(level: string) {
  if (level === "intermediate") return "中級";
  if (level === "advanced") return "高級";
  return "初級";
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const course = await getPublishedCourseById(resolvedParams.id);

  if (!course) {
    notFound();
  }

  const session = await getServerSession(authOptions);

  const modules = (course.modules.length > 0
    ? course.modules
    : [
        {
          id: "module-1",
          title: "課程內容",
          description: undefined,
          order: 1,
          lessons: course.syllabus.map((item, index) => ({
            id: item.id,
            title: item.title,
            description: item.description || undefined,
            duration: item.duration ?? 0,
            order: item.order ?? index + 1,
            videoUrl: item.videoUrl,
            preview: item.preview ?? index < 2,
          })),
        },
      ]
  )
    .map((module) => ({
      ...module,
      lessons: module.lessons
        .slice()
        .sort((a, b) => a.order - b.order),
    }))
    .filter((module) => module.lessons.length > 0)
    .sort((a, b) => a.order - b.order);

  const enrollment =
    session?.user?.id && course
      ? await getEnrollmentStatusForUser(course.id, session.user.id)
      : null;

  if (enrollment && session?.user?.id) {
    await touchEnrollmentLastAccessed(course.id, session.user.id);
  }

  const isEnrolled =
    Boolean(enrollment) && enrollment?.status !== "cancelled";
  const completedLessonSet = new Set(enrollment?.completedLessons ?? []);

  const totalLessons = modules.reduce(
    (sum, module) => sum + module.lessons.length,
    0,
  );
  const totalMinutes = modules.reduce(
    (sum, module) =>
      sum + module.lessons.reduce((inner, lesson) => inner + lesson.duration, 0),
    0,
  );

  const flatLessons = modules.flatMap((module) => module.lessons);
  const nextLessonCandidate = flatLessons.find(
    (lesson) => !completedLessonSet.has(lesson.id),
  );
  const nextLessonId = nextLessonCandidate?.id ?? flatLessons[0]?.id ?? null;

  let fallbackVideoIndex = 0;
  const pickFallbackVideoId = () => {
    const videoId =
      FALLBACK_VIDEO_IDS[fallbackVideoIndex % FALLBACK_VIDEO_IDS.length];
    fallbackVideoIndex += 1;
    return videoId;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section
        id="overview"
        className="border-b border-gray-200 bg-gray-900 text-white"
      >
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <nav className="flex items-center gap-2 text-sm text-gray-400">
                <Link href="/courses" className="hover:text-white">
                  課程列表
                </Link>
                <span>/</span>
                <span className="text-white">{course.title}</span>
              </nav>

              <div>
                <span className="inline-flex items-center rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-100">
                  {course.category}
                </span>
                <h1 className="mt-4 text-3xl font-bold md:text-4xl">
                  {course.title}
                </h1>
                <p className="mt-3 text-lg text-gray-300">
                  {course.description || "講師尚未提供課程介紹。"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                  <span className="font-semibold text-white">
                    {(course.rating ?? 0).toFixed(1)} / 5.0
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-blue-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <span>{Number(course.studentsEnrolled ?? 0).toLocaleString()} 位學員</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-blue-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>課程時數：約 {formatMinutesToTime(totalMinutes)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-blue-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                  <span>{totalLessons} 堂章節</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-blue-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 11c0 3.866-3.582 7-8 7 4.418 0 8 3.582 8 8 0-4.418 3.582-8 8-8-4.418 0-8-3.134-8-7z"
                    />
                  </svg>
                  <span>難度：{levelLabel(course.level)}</span>
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-lg bg-white p-6 text-gray-900 shadow-sm">
                <div className="text-center">
                  <p className="text-3xl font-bold">
                    NT$ {course.price.toLocaleString()}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    包含所有章節，終身不限次數觀看
                  </p>
                </div>

                <div className="mt-6">
                  <EnrollButton
                    courseId={course.id}
                    isLoggedIn={!!session}
                    isEnrolled={isEnrolled}
                    nextLessonId={nextLessonId}
                  />
                </div>

                <ul className="mt-6 space-y-2 text-sm text-gray-600">
                  <li>• {course.duration} 小時隨選視訊</li>
                  <li>• 完課證書與學習紀錄</li>
                  <li>• 支援手機與桌面裝置</li>
                  <li>• 提供章節練習檔與模板</li>
                </ul>

                {course.tags.length > 0 ? (
                  <div className="mt-6 border-t pt-4">
                    <p className="text-xs font-semibold text-gray-500">
                      相關標籤
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                      {course.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-gray-100 px-3 py-1"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Sticky Section Nav */}
      <div className="sticky top-0 z-10 hidden border-b border-gray-200 bg-white shadow-sm lg:block">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 text-sm">
          {SECTION_CONFIG.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="py-4 text-gray-600 transition hover:text-blue-600"
            >
              {section.label}
            </a>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-16 px-4 py-12 sm:px-6 lg:px-8">
        {/* Introduction */}
        <section id="introduction" className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">課程介紹</h2>
          <p className="text-gray-700">
            {course.description ||
              "本課程結合理論與實務案例，幫助學員快速掌握核心技能，並提供大量應用範例與練習檔案。"}
          </p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-600">最適合</p>
              <p className="mt-1 text-base font-semibold text-gray-900">
                想要提升 {course.category} 能力的學員
              </p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-600">課程亮點</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-gray-700">
                <li>包含 {totalLessons} 堂章節，搭配實務演練</li>
                <li>提供章節試看與練習檔，快速上手</li>
                <li>講師具備豐富產業實務與教學經驗</li>
              </ul>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-600">學習成果</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-gray-700">
                <li>能獨立規劃與完成實際專案</li>
                <li>熟悉工具與流程最佳實務</li>
                <li>累積可展示的作品與資源</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Catalog */}
        <section id="catalog" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">目錄與試看</h2>
            <span className="text-sm text-gray-500">
              共 {totalLessons} 堂 · 約 {formatMinutesToTime(totalMinutes)}
            </span>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            {modules.length === 0 ? (
              <div className="p-6 text-sm text-gray-500">
                講師尚未公布章節內容，請稍後再查看。
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {modules.map((module, moduleIndex) => {
                  const moduleMinutes = module.lessons.reduce(
                    (sum, lesson) => sum + lesson.duration,
                    0,
                  );

                  return (
                    <details
                      key={module.id}
                      className="group"
                      open={moduleIndex === 0}
                    >
                      <summary className="flex cursor-pointer items-start justify-between gap-3 px-6 py-4 text-sm text-gray-700 hover:bg-gray-50">
                        <div className="flex flex-1 items-start gap-3">
                          <span className="mt-1 text-xs font-semibold text-gray-500">
                            {String(moduleIndex + 1).padStart(2, "0")}
                          </span>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {module.title}
                            </p>
                            {module.description ? (
                              <p className="text-xs text-gray-600">{module.description}</p>
                            ) : null}
                            <p className="mt-1 text-xs text-gray-500">
                              {module.lessons.length} 堂 · {formatMinutesToTime(moduleMinutes || 0)}
                            </p>
                          </div>
                        </div>
                        <svg
                          className="h-4 w-4 text-gray-500 transition group-open:rotate-180"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </summary>
                      <div className="divide-y border-t border-gray-200 bg-gray-50">
                        {module.lessons.length === 0 ? (
                          <div className="px-6 py-4 text-xs text-gray-500">
                            講師尚未新增課程內容。
                          </div>
                        ) : (
                          module.lessons.map((lesson, lessonIndex) => {
                            const lessonNumber = `${moduleIndex + 1}.${String(lessonIndex + 1).padStart(2, "0")}`;
                            const allowPlayback = lesson.preview || isEnrolled;
                            const rawVideoId = allowPlayback
                              ? extractYouTubeId(lesson.videoUrl)
                              : null;
                            const videoId = rawVideoId ?? (allowPlayback ? pickFallbackVideoId() : null);
                            const isLessonCompleted = completedLessonSet.has(lesson.id);
                            const isNextLesson = nextLessonId === lesson.id;

                            let statusText = "正式課程";
                            let statusClasses = "border-gray-300 text-gray-500";
                            if (lesson.preview) {
                              statusText = "免費試看";
                              statusClasses = "border-blue-500 text-blue-600";
                            } else if (isEnrolled) {
                              if (isLessonCompleted) {
                                statusText = "已完成";
                                statusClasses = "border-green-500 text-green-600";
                              } else if (isNextLesson) {
                                statusText = "下一堂課";
                                statusClasses = "border-blue-500 text-blue-600";
                              } else {
                                statusText = "已解鎖";
                                statusClasses = "border-emerald-500 text-emerald-600";
                              }
                            }

                            return (
                              <div
                                key={lesson.id}
                                id={`lesson-${lesson.id}`}
                                className="space-y-3 px-6 py-4 text-sm text-gray-700"
                              >
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                  <div className="flex items-start gap-3">
                                    <span className="text-xs font-semibold text-gray-500">
                                      {lessonNumber}
                                    </span>
                                    <div>
                                      <p className="font-semibold text-gray-900">
                                        {lesson.title}
                                      </p>
                                      <p className="text-xs text-gray-600">
                                        {lesson.description || "講師尚未提供描述。"}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusClasses}`}
                                    >
                                      {statusText}
                                    </span>
                                    {isLessonCompleted && (
                                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                                        已完成
                                      </span>
                                    )}
                                    <span className="text-xs text-gray-500">
                                      {lesson.duration ? `${lesson.duration} 分鐘` : "時長未設定"}
                                    </span>
                                  </div>
                                </div>
                                {allowPlayback ? (
                                  videoId ? (
                                    <VideoEmbed
                                      videoId={videoId}
                                      title={`${lesson.title} 課程內容`}
                                    />
                                  ) : (
                                    <p className="text-xs text-gray-500">
                                      講師尚未提供影片，請稍後再試或參考課程補充資料。
                                    </p>
                                  )
                                ) : (
                                  <p className="text-xs text-gray-500">
                                    購買課程後即可觀看完整內容與影片教學。
                                  </p>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </details>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Plans */}
        {isEnrolled ? (
          <section id="plans" className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">學習資源</h2>
            <div className="rounded-xl border border-emerald-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-emerald-700">您已擁有此課程</h3>
              <p className="mt-2 text-sm text-gray-600">
                所有章節已全面解鎖，可直接透過上方章節清單或「我的學習」頁面持續觀看與追蹤進度。如需發票或團隊授權，歡迎聯繫我們的教學支援。
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span>最後學習時間將在每次觀看時自動更新</span>
                <span>完成章節後可回到「我的學習」檢視完成率</span>
              </div>
              <div className="mt-6">
                <a
                  href={nextLessonId ? `#lesson-${nextLessonId}` : "#catalog"}
                  className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  {nextLessonId ? "繼續前往下一堂課" : "查看章節列表"}
                </a>
              </div>
            </div>
          </section>
        ) : (
          <section id="plans" className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">選購方案</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    單堂購買
                  </h3>
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
                    熱門
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  立即解鎖全部章節，提供終身觀看與更新。
                </p>
                <p className="mt-4 text-3xl font-bold text-gray-900">
                  NT$ {course.price.toLocaleString()}
                </p>
                <ul className="mt-4 space-y-2 text-sm text-gray-600">
                  <li>• 完整課程內容與練習檔</li>
                  <li>• 學習紀錄與完課證書</li>
                  <li>• 常見問題與問答支援</li>
                </ul>
                <div className="mt-6">
                  <EnrollButton
                    courseId={course.id}
                    isLoggedIn={!!session}
                    isEnrolled={isEnrolled}
                    nextLessonId={nextLessonId}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">
                  團隊/企業方案
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  若需大量授權或客製化培訓，可來信洽詢專屬方案。
                </p>
                <ul className="mt-4 space-y-2 text-sm text-gray-600">
                  <li>• 支援多人帳號與監測進度</li>
                  <li>• 可加購線上直播或實體講座</li>
                  <li>• 提供企業內訓諮詢與課程客製化</li>
                </ul>
                <Link
                  href="mailto:sales@example.com?subject=企業方案洽詢"
                  className="mt-6 inline-flex items-center rounded-md border border-blue-500 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                >
                  聯絡我們
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Instructor */}
        <section id="instructor" className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">講師介紹</h2>
          <div className="flex flex-col gap-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-center">
            <div className="h-32 w-32 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
              <Image
                src={course.instructor.avatar}
                alt={course.instructor.name}
                width={128}
                height={128}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-blue-600">講師</p>
                <h3 className="text-xl font-semibold text-gray-900">
                  {course.instructor.name}
                </h3>
              </div>
              <p className="text-sm text-gray-700">
                {course.instructor.bio ||
                  "講師具備豐富的實務經驗與教學背景，熟悉產業需求，擅長將複雜概念轉化為易懂步驟。"}
              </p>
              <ul className="list-disc space-y-1 pl-5 text-xs text-gray-600">
                <li>專長領域：{course.category}</li>
                <li>授課經驗：10 年以上企業與線上教學</li>
                <li>授課風格：強調實務案例與可立即套用的模板</li>
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">常見問題</h2>
          <div className="space-y-3">
            {FALLBACK_FAQ.map((faq) => (
              <details
                key={faq.question}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
              >
                <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50">
                  {faq.question}
                </summary>
                <div className="border-t border-gray-200 px-4 py-3 text-sm text-gray-700">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Q&A */}
        <section id="qa" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">問與答</h2>
              <p className="text-sm text-gray-600">
                歡迎針對課程內容提出問題，講師與助教將定期回覆。
              </p>
            </div>
            <Link
              href="mailto:instructor@example.com?subject=課程問答"
              className="rounded-md border border-blue-500 px-4 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
            >
              提出問題
            </Link>
          </div>

          <div className="space-y-3">
            {FALLBACK_QA.map((qa) => (
              <div
                key={qa.question}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <p className="text-sm font-semibold text-gray-900">
                  Q：{qa.question}
                </p>
                <p className="mt-1 text-sm text-gray-700">A：{qa.answer}</p>
              </div>
            ))}

            <p className="text-xs text-gray-500">
              * 問答區內容為示意，正式版可串接留言或討論系統。
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
