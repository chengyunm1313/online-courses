import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Navbar from "@/components/Navbar";
import { authOptions } from "@/lib/auth";
import { getPublishedCourseById } from "@/lib/public-courses";
import { evaluateDiscount } from "@/lib/checkout";
import CheckoutATM from "@/components/checkout/CheckoutATM";

interface CheckoutPageProps {
  params: { courseId: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function CheckoutATMPage({
  params,
  searchParams = {},
}: CheckoutPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/test");
  }

  const course = await getPublishedCourseById(params.courseId);

  if (!course) {
    redirect("/courses");
  }

  const codeParam = typeof searchParams.code === "string" ? searchParams.code : undefined;
  const discountResult = evaluateDiscount(course.price, codeParam);

  const summary = {
    title: course.title,
    category: course.category,
    level: course.level,
    thumbnail: course.thumbnail,
    lessons: course.lessons,
    duration: course.duration,
    instructorName: course.instructor.name,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <CheckoutATM
          courseId={course.id}
          courseSummary={summary}
          pricing={discountResult}
        />
      </div>
    </div>
  );
}
