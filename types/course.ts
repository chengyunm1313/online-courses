/**
 * Course-related type definitions
 */

export interface Course {
  id: string;
  title: string;
  subtitle?: string;
  slug?: string;
  description: string;
  thumbnail: string;
  ogImage?: string;
  instructor: {
    id: string;
    name: string;
    avatar: string;
    bio: string;
  };
  price: number;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in hours
  lessons: number;
  rating: number;
  studentsEnrolled: number;
  syllabus: CourseSyllabus[];
  modules: CourseModule[];
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  targetAudience: string[];
  learningOutcomes: string[];
  faq: CourseFaqItem[];
  salesBlocks: CourseSalesBlock[];
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Date;
  updatedAt: Date;
  published: boolean;
}

export interface CourseFaqItem {
  question: string;
  answer: string;
}

export interface CourseSalesBlock {
  title: string;
  content: string;
}

export interface CourseSyllabus {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  order: number;
  videoUrl?: string;
  preview?: boolean;
  resources?: CourseResource[];
}

export interface CourseModuleItem {
  id: string;
  title: string;
  description?: string;
  duration: number;
  order: number;
  videoUrl?: string;
  preview?: boolean;
}

export interface CourseModule {
  id: string;
  title: string;
  description?: string;
  order: number;
  lessons: CourseModuleItem[];
}

export interface CourseResource {
  id: string;
  title: string;
  type: 'pdf' | 'video' | 'link' | 'file';
  url: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: Date;
  progress: number; // 0-100
  completedLessons: string[];
  lastAccessedAt: Date;
  status: 'active' | 'completed' | 'cancelled';
}

export interface LessonProgress {
  lessonId: string;
  courseId: string;
  userId: string;
  completedAt?: Date;
  lastPosition: number;
}

export interface Review {
  id: string;
  courseId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface CourseFilters {
  category?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  priceMin?: number;
  priceMax?: number;
  rating?: number;
  search?: string;
}
