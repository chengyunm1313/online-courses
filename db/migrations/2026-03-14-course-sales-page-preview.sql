ALTER TABLE courses ADD COLUMN hero_title TEXT;
ALTER TABLE courses ADD COLUMN hero_subtitle TEXT;
ALTER TABLE courses ADD COLUMN guarantee_text TEXT;
ALTER TABLE courses ADD COLUMN cta_label TEXT;

ALTER TABLE course_modules ADD COLUMN preview_mode TEXT NOT NULL DEFAULT 'locked';
ALTER TABLE course_lessons ADD COLUMN preview_override TEXT NOT NULL DEFAULT 'inherit';

UPDATE course_lessons
SET preview_override = CASE
  WHEN preview = 1 THEN 'preview'
  ELSE 'inherit'
END
WHERE preview_override IS NULL OR preview_override = '';
