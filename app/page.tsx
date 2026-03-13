import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { getFeaturedCourses } from "@/lib/public-courses";

export const dynamic = "force-dynamic";

export default async function Home() {
  const featuredCourses = await getFeaturedCourses(6);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[rgba(239,68,68,0.9)] text-white text-sm md:text-base font-semibold shadow-xl gap-2 tracking-[0.1em]">
              <span aria-hidden="true">⚠️</span>
              <span>vibe coding Demo｜此為練習作品，非真實網站與服務</span>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              歡迎來到線上學院
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              探索優質課程，開啟您的學習之旅
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/courses"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
              >
                瀏覽課程
              </Link>
              <Link
                href="/auth/test"
                className="bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-400 transition border-2 border-white"
              >
                立即開始
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Courses Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">熱門課程</h2>
          <Link
            href="/courses"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            查看全部 →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredCourses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.slug ?? course.id}`}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden group"
            >
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  src={course.thumbnail}
                  alt={course.title}
                  fill
                  className="object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute top-3 right-3 rounded-full bg-slate-950/90 px-3 py-1.5 text-sm font-semibold text-white shadow-lg ring-1 ring-white/20 backdrop-blur-sm">
                  NT$ {course.price.toLocaleString()}
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {course.category}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {course.level === "beginner"
                      ? "初級"
                      : course.level === "intermediate"
                      ? "中級"
                      : "高級"}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {course.title}
                </h3>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {course.description}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4 text-yellow-400 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                    <span className="font-medium">{course.rating}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span>{course.studentsEnrolled} 位學生</span>
                    <span>{course.lessons} 堂課</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                    <Image
                      src={course.instructor.avatar}
                      alt={course.instructor.name}
                      width={32}
                      height={32}
                    />
                  </div>
                  <span className="text-sm text-gray-600">
                    {course.instructor.name}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-slate-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
              Platform Advantage
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
              為什麼選擇我們
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-700">
              不只提供課程，而是把學習設計成更容易開始、更容易完成，也更容易實際用在工作上的體驗。
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 shadow-inner">
                <svg
                  className="h-8 w-8 text-blue-700"
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
              </div>
              <h3 className="text-xl font-semibold text-slate-950">豐富課程</h3>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                涵蓋多個領域的優質課程，滿足不同學習需求
              </p>
              <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                多領域主題 × 可立即上手
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-100 shadow-inner">
                <svg
                  className="h-8 w-8 text-cyan-700"
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
              </div>
              <h3 className="text-xl font-semibold text-slate-950">彈性學習</h3>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                隨時隨地學習，按照自己的步調掌握知識
              </p>
              <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                自主安排節奏 × 不中斷複習
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 shadow-inner">
                <svg
                  className="h-8 w-8 text-indigo-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-950">專業講師</h3>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                由業界專家親自授課，分享實戰經驗
              </p>
              <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                實戰導向內容 × 更貼近工作場景
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">準備開始學習了嗎？</h2>
          <p className="text-xl mb-8 text-blue-100">
            立即註冊，開啟您的學習之旅
          </p>
          <Link
            href="/auth/test"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
          >
            免費註冊
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">線上學院</h3>
              <p className="text-sm">
                提供優質的線上學習體驗，幫助每個人實現學習目標。
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">課程分類</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/courses?category=程式開發" className="hover:text-white">
                    程式開發
                  </Link>
                </li>
                <li>
                  <Link href="/courses?category=數據科學" className="hover:text-white">
                    數據科學
                  </Link>
                </li>
                <li>
                  <Link href="/courses?category=設計" className="hover:text-white">
                    設計
                  </Link>
                </li>
                <li>
                  <Link href="/courses?category=行銷" className="hover:text-white">
                    行銷
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">關於我們</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/about" className="hover:text-white">
                    關於平台
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white">
                    聯絡我們
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white">
                    使用條款
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white">
                    隱私政策
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">聯絡資訊</h4>
              <p className="text-sm">
                Email: contact@example.com
                <br />
                電話: (02) 1234-5678
              </p>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            © 2024 線上學院. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
