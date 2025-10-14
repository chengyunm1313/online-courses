import { adminDb } from "./firebase-admin";

interface RawEnrollmentDoc {
  status?: string;
  completedLessons?: unknown;
  lastAccessed?: unknown;
}

export interface EnrollmentStatus {
  id: string;
  courseId: string;
  userId: string;
  status: "active" | "completed" | "cancelled";
  completedLessons: string[];
  lastAccessedAt?: Date;
}

function toDate(value: unknown): Date | undefined {
  if (!value) {
    return undefined;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "number") {
    return new Date(value);
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
    return undefined;
  }
  if (typeof value === "object" && value !== null && "toDate" in value) {
    try {
      return (value as { toDate: () => Date }).toDate();
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export async function getEnrollmentStatusForUser(
  courseId: string,
  userId: string,
): Promise<EnrollmentStatus | null> {
  if (!courseId || !userId) {
    return null;
  }

  const docId = `${userId}_${courseId}`;
  const snapshot = await adminDb.collection("enrollments").doc(docId).get();
  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() as RawEnrollmentDoc | undefined;
  const status =
    data?.status === "completed" || data?.status === "cancelled"
      ? data.status
      : "active";

  const completedLessons = Array.isArray(data?.completedLessons)
    ? (data?.completedLessons as unknown[]).map((lesson) => String(lesson))
    : [];

  return {
    id: snapshot.id,
    courseId,
    userId,
    status,
    completedLessons,
    lastAccessedAt: toDate(data?.lastAccessed),
  };
}

export async function touchEnrollmentLastAccessed(
  courseId: string,
  userId: string,
): Promise<void> {
  if (!courseId || !userId) {
    return;
  }

  const docId = `${userId}_${courseId}`;
  await adminDb
    .collection("enrollments")
    .doc(docId)
    .set(
      {
        lastAccessed: new Date(),
      },
      { merge: true },
    );
}
