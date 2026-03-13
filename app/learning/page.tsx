import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { authOptions } from "@/lib/auth";
import { getLearningCoursesForUser } from "@/lib/learning";
import LessonProgressToggle from "@/components/learning/LessonProgressToggle";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("zh-TW");
}

export default async function LearningPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/test");
  }

  const courses = await getLearningCoursesForUser(session.user.id);

  const completedCount = courses.filter((course) => course.progress >= 100).length;
  const totalHours = courses.reduce((sum, course) => sum + course.duration, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">我的學習</h1>
          <p className="text-gray-600">追蹤進度，繼續您的學習旅程。</p>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center text-gray-600">
            <p className="text-sm">尚未加入任何課程，前往課程列表挑選適合的內容吧！</p>
            <Link
              href="/courses"
              className="mt-4 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              瀏覽課程
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-600">已報名課程</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{courses.length}</p>
              </div>
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-600">已完成課程</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{completedCount}</p>
              </div>
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-600">總學習時數</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{Math.floor(totalHours)}</p>
              </div>
            </div>

            <div className="rounded-lg bg-white shadow-sm">
              <div className="border-b p-6">
                <h2 className="text-xl font-semibold text-gray-900">進行中的課程</h2>
              </div>

              <div className="divide-y">
                {courses.map((course) => (
                  <div key={course.enrollmentId} className="flex flex-col gap-6 p-6 md:flex-row">
                    <Link
                      href={`/courses/${course.courseId}`}
                      className="relative h-36 w-full flex-shrink-0 overflow-hidden rounded-lg md:w-64"
                    >
                      <Image
                        src={course.thumbnail}
                        alt={course.title}
                        fill
                        className="object-cover"
                      />
                    </Link>

                    <div className="flex-1">
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <Link
                            href={`/courses/${course.courseId}`}
                            className="line-clamp-1 text-xl font-semibold text-gray-900 hover:text-blue-600"
                          >
                            {course.title}
                          </Link>
                          <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                            {course.description}
                          </p>
                          {course.nextLessonTitle ? (
                            <p className="mt-2 text-xs text-gray-500">
                              下一堂課：{course.nextLessonTitle}
                            </p>
                          ) : (
                            <p className="mt-2 text-xs text-green-600">
                              已完成全部課程
                            </p>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          最後學習：{formatDate(course.lastAccessed)}
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="mb-1 flex items-center justify-between text-sm text-gray-600">
                          <span>學習進度</span>
                          <span className="font-semibold text-gray-900">
                            {course.progress}%
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-200">
                          <div
                            className="h-2 rounded-full bg-blue-600"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span>
                          已完成 {course.completedLessonsCount}/{course.lessons} 堂
                        </span>
                        <span>{course.duration} 小時內容</span>
                        <span>分類：{course.category}</span>
                        <span>講師：{course.instructorName}</span>
                      </div>

                      {course.modules.length > 0 ? (
                        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white/70">
                          {course.modules.map((module, moduleIndex) => {
                            const moduleCompleted = module.lessons.filter(
                              (lesson) => lesson.completed
                            ).length;
                            return (
                              <details
                                key={module.id}
                                className="group border-b border-gray-200 last:border-b-0"
                                open={moduleIndex === 0}
                              >
                                <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
                                  <div>
                                    <p className="font-semibold text-gray-900">
                                      {moduleIndex + 1}. {module.title}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {moduleCompleted}/{module.lessons.length} 堂完成
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span>{module.lessons.length} 堂</span>
                                    <svg
                                      className="h-4 w-4 transition group-open:rotate-180"
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
                                  </div>
                                </summary>
                                <ul className="space-y-3 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                                  {module.lessons.map((lesson) => {
                                    const isNext = !lesson.completed && lesson.isNext;
                                    const statusClasses = lesson.completed
                                      ? "bg-green-100 text-green-600"
                                      : isNext
                                      ? "bg-blue-100 text-blue-600"
                                      : "bg-gray-100 text-gray-500";
                                    return (
                                      <li
                                        key={lesson.id}
                                        className="flex flex-col gap-3 rounded-md border border-gray-200 bg-white px-3 py-3 md:flex-row md:items-center md:justify-between"
                                      >
                                        <div className="flex items-start gap-3">
                                          <span
                                            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${statusClasses}`}
                                          >
                                            {lesson.completed ? (
                                              <svg
                                                className="h-3 w-3"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                                viewBox="0 0 24 24"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  d="M5 13l4 4L19 7"
                                                />
                                              </svg>
                                            ) : isNext ? (
                                              <svg
                                                className="h-3 w-3"
                                                fill="currentColor"
                                                viewBox="0 0 24 24"
                                              >
                                                <path d="M8 5v14l11-7z" />
                                              </svg>
                                            ) : (
                                              <svg
                                                className="h-2 w-2"
                                                fill="currentColor"
                                                viewBox="0 0 8 8"
                                              >
                                                <circle cx="4" cy="4" r="3" />
                                              </svg>
                                            )}
                                          </span>
                                          <div>
                                            <p className="font-medium text-gray-900">
                                              {lesson.title}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                              {lesson.duration
                                                ? `${lesson.duration} 分鐘`
                                                : "時長未設定"}
                                              {lesson.preview ? " · 可試看" : ""}
                                              {isNext ? " · 下一堂課" : ""}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <Link
                                            href={`/courses/${course.courseId}#lesson-${lesson.id}`}
                                            className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700"
                                          >
                                            前往章節
                                          </Link>
                                          <LessonProgressToggle
                                            courseId={course.courseId}
                                            lessonId={lesson.id}
                                            initialCompleted={lesson.completed}
                                          />
                                        </div>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </details>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="mt-4 rounded-lg bg-gray-100 px-4 py-3 text-xs text-gray-500">
                          講師尚未建立章節內容。
                        </p>
                      )}

                      <div className="mt-4 flex items-center justify-end">
                        <Link
                          href={
                            course.nextLessonId
                              ? `/courses/${course.courseId}#lesson-${course.nextLessonId}`
                              : `/courses/${course.courseId}`
                          }
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                        >
                          繼續學習
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
