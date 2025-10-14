import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Navbar from "@/components/Navbar";
import { authOptions } from "@/lib/auth";
import { getPublishedCourseById } from "@/lib/public-courses";
import PurchaseClient from "@/components/checkout/PurchaseClient";

export default async function PurchasePage({
  params,
}: {
  params: { courseId: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/test");
  }

  const course = await getPublishedCourseById(params.courseId);

  if (!course) {
    redirect("/courses");
  }

  const serializedCourse = {
    id: course.id,
    title: course.title,
    description: course.description,
    price: course.price,
    category: course.category,
    level: course.level,
    thumbnail: course.thumbnail,
    instructorName: course.instructor.name,
    lessons: course.lessons,
    duration: course.duration,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <PurchaseClient course={serializedCourse} />
      </div>
    </div>
  );
}
