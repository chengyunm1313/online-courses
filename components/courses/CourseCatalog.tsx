"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type CourseLevel = "beginner" | "intermediate" | "advanced";

export interface CourseCatalogCourse {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  instructor: {
    id: string;
    name: string;
    avatar: string;
    bio: string;
  };
  price: number;
  category: string;
  level: CourseLevel;
  duration: number;
  lessons: number;
  rating: number;
  studentsEnrolled: number;
  tags: string[];
  syllabus: unknown[];
  createdAt: string;
  updatedAt: string;
}

interface CourseCatalogProps {
  courses: CourseCatalogCourse[];
}

const priceOptions = [
  { value: "all", label: "全部價格" },
  { value: "free", label: "免費課程" },
  { value: "under2000", label: "NT$ 2,000 以下" },
  { value: "2000to3000", label: "NT$ 2,000 - 3,000" },
  { value: "over3000", label: "NT$ 3,000 以上" },
];

const sortOptions = [
  { value: "popular", label: "最受歡迎" },
  { value: "rating", label: "最高評分" },
  { value: "price-low", label: "價格由低到高" },
  { value: "price-high", label: "價格由高到低" },
  { value: "newest", label: "最新上架" },
];

export default function CourseCatalog({ courses }: CourseCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("popular");

  const categories = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((course) => {
      if (course.category) {
        set.add(course.category);
      }
    });
    return Array.from(set);
  }, [courses]);

  const filteredCourses = useMemo(() => {
    let filtered = [...courses];
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (normalizedQuery) {
      filtered = filtered.filter((course) => {
        const inTitle = course.title.toLowerCase().includes(normalizedQuery);
        const inDescription = course.description
          .toLowerCase()
          .includes(normalizedQuery);
        const inTags = course.tags.some((tag) =>
          tag.toLowerCase().includes(normalizedQuery)
        );
        return inTitle || inDescription || inTags;
      });
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (course) => course.category === selectedCategory
      );
    }

    if (selectedLevel !== "all") {
      filtered = filtered.filter((course) => course.level === selectedLevel);
    }

    if (priceRange === "free") {
      filtered = filtered.filter((course) => course.price === 0);
    } else if (priceRange === "under2000") {
      filtered = filtered.filter(
        (course) => course.price > 0 && course.price <= 2000
      );
    } else if (priceRange === "2000to3000") {
      filtered = filtered.filter(
        (course) => course.price > 2000 && course.price <= 3000
      );
    } else if (priceRange === "over3000") {
      filtered = filtered.filter((course) => course.price > 3000);
    }

    if (sortBy === "popular") {
      filtered.sort((a, b) => b.studentsEnrolled - a.studentsEnrolled);
    } else if (sortBy === "rating") {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "price-low") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === "newest") {
      filtered.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return filtered;
  }, [courses, searchQuery, selectedCategory, selectedLevel, priceRange, sortBy]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedLevel("all");
    setPriceRange("all");
    setSortBy("popular");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">瀏覽課程</h1>
          <p className="text-sm text-gray-600">
            探索 {filteredCourses.length} 門課程，找到最適合您的學習內容。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
          <span>排序：</span>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="rounded-md border-gray-300 bg-white px-3 py-1.5 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900">
              搜尋課程
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="搜尋課程標題、描述或標籤..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">
                課程分類
              </h2>
              <button
                onClick={resetFilters}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                清除條件
              </button>
            </div>
            <div className="space-y-2 text-sm text-gray-700">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="category"
                  value="all"
                  checked={selectedCategory === "all"}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                />
                全部分類
              </label>
              {categories.map((category) => (
                <label key={category} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="category"
                    value={category}
                    checked={selectedCategory === category}
                    onChange={(event) => setSelectedCategory(event.target.value)}
                  />
                  {category}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">難度等級</h2>
            <div className="space-y-2 text-sm text-gray-700">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="level"
                  value="all"
                  checked={selectedLevel === "all"}
                  onChange={(event) => setSelectedLevel(event.target.value)}
                />
                全部等級
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="level"
                  value="beginner"
                  checked={selectedLevel === "beginner"}
                  onChange={(event) => setSelectedLevel(event.target.value)}
                />
                初級
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="level"
                  value="intermediate"
                  checked={selectedLevel === "intermediate"}
                  onChange={(event) => setSelectedLevel(event.target.value)}
                />
                中級
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="level"
                  value="advanced"
                  checked={selectedLevel === "advanced"}
                  onChange={(event) => setSelectedLevel(event.target.value)}
                />
                高級
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">價格區間</h2>
            <div className="space-y-2 text-sm text-gray-700">
              {priceOptions.map((option) => (
                <label key={option.value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="price"
                    value={option.value}
                    checked={priceRange === option.value}
                    onChange={(event) => setPriceRange(event.target.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>
        </aside>

        <section className="space-y-6">
          {filteredCourses.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-600">
              找不到符合條件的課程，請調整搜尋或篩選條件再試一次。
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="relative h-44 w-full overflow-hidden">
                    <Image
                      src={course.thumbnail}
                      alt={course.title}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2 right-2 rounded-full bg-white px-2 py-1 text-xs font-semibold text-gray-900">
                      NT$ {course.price.toLocaleString()}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="rounded bg-blue-100 px-2 py-1 text-blue-700">
                        {course.category}
                      </span>
                      <span className="rounded bg-gray-100 px-2 py-1 text-gray-700">
                        {course.level === "beginner"
                          ? "初級"
                          : course.level === "intermediate"
                          ? "中級"
                          : "高級"}
                      </span>
                    </div>

                    <h3 className="mt-3 line-clamp-2 text-lg font-semibold text-gray-900">
                      {course.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                      {course.description}
                    </p>

                    <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <svg
                          className="h-4 w-4 text-yellow-400"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                        <span className="font-medium">{course.rating.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span>{course.studentsEnrolled.toLocaleString()} 位學生</span>
                        <span>{course.lessons} 堂課</span>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center gap-3 border-t pt-4">
                      <div className="h-9 w-9 overflow-hidden rounded-full bg-gray-200">
                        <Image
                          src={course.instructor.avatar}
                          alt={course.instructor.name}
                          width={36}
                          height={36}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="text-sm text-gray-600">
                        {course.instructor.name}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
