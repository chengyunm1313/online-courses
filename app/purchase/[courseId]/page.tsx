import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Navbar from "@/components/Navbar";
import { authOptions } from "@/lib/auth";
import { getPublishedCourseById } from "@/lib/public-courses";
import PurchaseClient from "@/components/checkout/PurchaseClient";
import { resolveCourseOffer } from "@/lib/course-sales";

export default async function PurchasePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/test");
  }

  const resolvedParams = await params;
  const course = await getPublishedCourseById(resolvedParams.courseId);

  if (!course) {
    redirect("/courses");
  }

  const offer = resolveCourseOffer(course);

  const serializedCourse = {
    id: course.id,
    title: course.title,
    description: course.description,
    price: course.price,
    originalPrice: offer.originalPrice,
    currentPrice: offer.currentPrice,
    discountLabel: offer.discountLabel,
    nextPrice: offer.nextPrice,
    nextTierName: offer.nextTierName,
    nextTransitionAt: offer.nextTransitionAt,
    countdownEndsAt: offer.countdownEndsAt,
    canPurchase: offer.canPurchase,
    requiresWaitlist: offer.requiresWaitlist,
    salesStatusLabel: offer.salesStatusLabel,
    soldCount: offer.soldCount,
    remainingSeats: offer.remainingSeats,
    category: course.category,
    level: course.level,
    thumbnail: course.thumbnail,
    instructorName: course.instructor.name,
    lessons: course.lessons,
    duration: course.duration,
    salesMode: course.salesMode,
    salesStatus: course.salesStatus,
    launchStartsAt: course.launchStartsAt,
    leadMagnetEnabled: course.leadMagnetEnabled,
    leadMagnetTitle: course.leadMagnetTitle,
    leadMagnetDescription: course.leadMagnetDescription,
    leadMagnetCouponCode: course.leadMagnetCouponCode,
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
