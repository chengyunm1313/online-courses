import {
  createEnrollmentRecord,
  getEnrollmentByUserAndCourse,
  touchEnrollment,
} from "@/lib/d1-repository";

export interface EnrollmentStatus {
  id: string;
  courseId: string;
  userId: string;
  status: "active" | "completed" | "cancelled";
  completedLessons: string[];
  lastAccessedAt?: Date;
}

export async function getEnrollmentStatusForUser(
  courseId: string,
  userId: string,
): Promise<EnrollmentStatus | null> {
  if (!courseId || !userId) {
    return null;
  }

  const enrollment = await getEnrollmentByUserAndCourse(userId, courseId);
  if (!enrollment) {
    return null;
  }

  return {
    id: enrollment.id,
    courseId,
    userId,
    status: enrollment.status,
    completedLessons: enrollment.completed_lessons_json
      ? (JSON.parse(enrollment.completed_lessons_json) as string[])
      : [],
    lastAccessedAt: enrollment.last_accessed_at
      ? new Date(enrollment.last_accessed_at)
      : undefined,
  };
}

export async function touchEnrollmentLastAccessed(
  courseId: string,
  userId: string,
): Promise<void> {
  if (!courseId || !userId) {
    return;
  }

  await touchEnrollment({
    userId,
    courseId,
  });
}

export async function ensureEnrollmentForPaidOrder(input: {
  userId: string;
  courseId: string;
  orderId: string;
  courseTitle: string;
}) {
  return createEnrollmentRecord({
    userId: input.userId,
    courseId: input.courseId,
    orderId: input.orderId,
    courseTitleSnapshot: input.courseTitle,
  });
}
