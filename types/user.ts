/**
 * User-related type definitions
 */

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  role: 'student' | 'instructor' | 'admin';
  enrolledCourses: string[]; // course IDs
  createdAt: Date;
  updatedAt: Date;
}

export interface LearningProgress {
  courseId: string;
  courseTitle: string;
  courseThumbnail: string;
  progress: number; // 0-100
  lastAccessedAt: Date;
  completedLessons: number;
  totalLessons: number;
}
