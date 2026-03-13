import type { Course, CoursePriceLadder, ResolvedCourseOffer } from "@/types/course";

function isWithinTimeWindow(now: number, startsAt?: string, endsAt?: string) {
  const start = startsAt ? new Date(startsAt).getTime() : null;
  const end = endsAt ? new Date(endsAt).getTime() : null;

  if (start && !Number.isNaN(start) && now < start) {
    return false;
  }
  if (end && !Number.isNaN(end) && now > end) {
    return false;
  }
  return true;
}

function resolveActiveLadder(
  ladders: CoursePriceLadder[],
  soldCount: number,
  now: number,
): { current?: CoursePriceLadder; next?: CoursePriceLadder } {
  const ordered = [...ladders].sort((a, b) => a.sortOrder - b.sortOrder);
  const currentIndex = ordered.findIndex((ladder) => {
    const seatsOpen = !ladder.seatLimit || soldCount < ladder.seatLimit;
    return seatsOpen && isWithinTimeWindow(now, ladder.startsAt, ladder.endsAt);
  });

  if (currentIndex === -1) {
    return {
      current: undefined,
      next: ordered.find((ladder) => {
        const start = ladder.startsAt ? new Date(ladder.startsAt).getTime() : null;
        return Boolean(start && !Number.isNaN(start) && start > now);
      }),
    };
  }

  return {
    current: ordered[currentIndex],
    next: ordered[currentIndex + 1],
  };
}

function resolveRemainingSeats(course: Course, soldCount: number) {
  if (!course.showSeats || !course.seatLimit) {
    return undefined;
  }
  return Math.max(course.seatLimit - soldCount, 0);
}

export function resolveCourseOffer(course: Course): ResolvedCourseOffer {
  const now = Date.now();
  const soldCount = course.soldCountMode === "paid_orders"
    ? course.studentsEnrolled
    : course.studentsEnrolled;
  const originalPrice = course.originalPrice ?? course.price;
  const { current, next } = resolveActiveLadder(course.priceLadders, soldCount, now);
  const currentPrice = current?.price ?? course.price;
  const countdownEndsAt = current?.endsAt ?? course.launchEndsAt;
  const remainingSeats = resolveRemainingSeats(course, soldCount);
  const launchStarted = !course.launchStartsAt || new Date(course.launchStartsAt).getTime() <= now;
  const launchEnded = Boolean(course.launchEndsAt && new Date(course.launchEndsAt).getTime() < now);

  let canPurchase = true;
  let requiresWaitlist = false;
  let salesStatusLabel = "可立即購買";

  if (course.salesStatus === "waitlist") {
    canPurchase = false;
    requiresWaitlist = true;
    salesStatusLabel = "等待開賣";
  } else if (course.salesStatus === "closed") {
    canPurchase = false;
    requiresWaitlist = true;
    salesStatusLabel = "本期已結束";
  } else if (course.salesStatus === "draft") {
    canPurchase = false;
    requiresWaitlist = false;
    salesStatusLabel = "尚未公開";
  } else if (course.salesMode === "launch" && (!launchStarted || launchEnded)) {
    canPurchase = false;
    requiresWaitlist = true;
    salesStatusLabel = launchEnded ? "本期已結束" : "即將開賣";
  }

  return {
    currentPrice,
    originalPrice,
    discountLabel: current && current.price < originalPrice ? current.name : undefined,
    nextPrice: next?.price,
    nextTierName: next?.name,
    nextTransitionAt: next?.startsAt ?? current?.endsAt,
    activeTierName: current?.name,
    countdownEndsAt: course.showCountdown ? countdownEndsAt : undefined,
    soldCount,
    remainingSeats,
    canPurchase,
    requiresWaitlist,
    salesStatusLabel,
  };
}
