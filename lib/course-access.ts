import type { CourseModule, CourseModuleItem, LessonAccessState } from "@/types/course";

interface ResolveLessonAccessInput {
  lesson: CourseModuleItem;
  module?: CourseModule;
  isLoggedIn: boolean;
  isEnrolled: boolean;
}

export function resolveLessonAccess({
  lesson,
  module,
  isLoggedIn,
  isEnrolled,
}: ResolveLessonAccessInput): LessonAccessState {
  if (isEnrolled) {
    return "full";
  }

  if (!isLoggedIn) {
    return "hidden";
  }

  const lessonOverride = lesson.previewOverride ?? (lesson.preview ? "preview" : "inherit");
  if (lessonOverride === "preview") {
    return "preview";
  }
  if (lessonOverride === "locked") {
    return "hidden";
  }

  if ((module?.previewMode ?? "locked") === "preview") {
    return "preview";
  }

  return "hidden";
}

export function isLessonPreviewable(lesson: CourseModuleItem, module?: CourseModule) {
  const lessonOverride = lesson.previewOverride ?? (lesson.preview ? "preview" : "inherit");
  if (lessonOverride === "preview") {
    return true;
  }
  if (lessonOverride === "locked") {
    return false;
  }
  return (module?.previewMode ?? "locked") === "preview";
}
