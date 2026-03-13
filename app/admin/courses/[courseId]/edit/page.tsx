import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getCourseForManagement,
  listInstructorOptions,
} from "@/lib/admin-data";
import CourseForm from "@/components/admin/CourseForm";

export default async function AdminEditCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/test");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  const resolvedParams = await params;
  const [course, instructorOptions] = await Promise.all([
    getCourseForManagement(resolvedParams.courseId, {
      role: session.user.role,
      userId: session.user.id,
    }),
    listInstructorOptions(),
  ]);

  if (!course) {
    notFound();
  }

  return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">編輯課程</h1>
          <p className="text-sm text-gray-600">
            更新課程資訊後記得儲存，已發布課程將立即同步最新內容。
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <CourseForm
            mode="edit"
            courseId={course.id}
            canEditInstructor
            instructors={instructorOptions}
            initialValues={{
              title: course.title,
              subtitle: course.subtitle,
              slug: course.slug,
              heroTitle: course.heroTitle,
              heroSubtitle: course.heroSubtitle,
              guaranteeText: course.guaranteeText,
              ctaLabel: course.ctaLabel,
              description: course.description,
              thumbnail: course.thumbnail,
              ogImage: course.ogImage,
              price: course.price,
              originalPrice: course.originalPrice,
              category: course.category,
              level: course.level as "beginner" | "intermediate" | "advanced",
              status: course.status,
              duration: course.duration,
              lessons: course.lessons,
              tags: course.tags,
              published: course.published,
              instructorId: course.instructorId,
              targetAudience: course.targetAudience,
              learningOutcomes: course.learningOutcomes,
              faq: course.faq,
              salesBlocks: course.salesBlocks,
              seoTitle: course.seoTitle,
              seoDescription: course.seoDescription,
              salesMode: course.salesMode,
              salesStatus: course.salesStatus,
              launchStartsAt: course.launchStartsAt,
              launchEndsAt: course.launchEndsAt,
              showCountdown: course.showCountdown,
              showSeats: course.showSeats,
              seatLimit: course.seatLimit,
              soldCountMode: course.soldCountMode,
              leadMagnetEnabled: course.leadMagnetEnabled,
              leadMagnetTitle: course.leadMagnetTitle,
              leadMagnetDescription: course.leadMagnetDescription,
              leadMagnetCouponCode: course.leadMagnetCouponCode,
              priceLadders: course.priceLadders,
              modules: course.modules,
            }}
            redirectTo="/admin/courses"
            submitLabel="儲存變更"
          />
        </div>
      </div>
  );
}
