ALTER TABLE courses ADD COLUMN subtitle TEXT;
ALTER TABLE courses ADD COLUMN slug TEXT;
ALTER TABLE courses ADD COLUMN status TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE courses ADD COLUMN og_image TEXT;
ALTER TABLE courses ADD COLUMN target_audience_json TEXT;
ALTER TABLE courses ADD COLUMN learning_outcomes_json TEXT;
ALTER TABLE courses ADD COLUMN faq_json TEXT;
ALTER TABLE courses ADD COLUMN sales_blocks_json TEXT;
ALTER TABLE courses ADD COLUMN seo_title TEXT;
ALTER TABLE courses ADD COLUMN seo_description TEXT;

UPDATE courses
SET
  status = CASE
    WHEN published = 1 THEN 'published'
    ELSE 'draft'
  END,
  seo_title = COALESCE(seo_title, title),
  seo_description = COALESCE(seo_description, description)
WHERE status IS NULL
   OR status = ''
   OR seo_title IS NULL
   OR seo_description IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_courses_slug ON courses (slug);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses (status, updated_at);

ALTER TABLE orders ADD COLUMN refund_status TEXT NOT NULL DEFAULT 'none';
ALTER TABLE orders ADD COLUMN refund_reason TEXT;
ALTER TABLE orders ADD COLUMN refund_note TEXT;
ALTER TABLE orders ADD COLUMN refund_requested_at TEXT;
ALTER TABLE orders ADD COLUMN refunded_at TEXT;
ALTER TABLE orders ADD COLUMN reconciliation_status TEXT NOT NULL DEFAULT 'pending';

UPDATE orders
SET
  refund_status = COALESCE(refund_status, 'none'),
  reconciliation_status = COALESCE(reconciliation_status, 'pending')
WHERE refund_status IS NULL
   OR reconciliation_status IS NULL;

CREATE TABLE IF NOT EXISTS discounts (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  value INTEGER NOT NULL,
  description TEXT,
  starts_at TEXT,
  ends_at TEXT,
  usage_limit INTEGER,
  per_user_limit INTEGER,
  minimum_amount INTEGER NOT NULL DEFAULT 0,
  course_ids_json TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lesson_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  completed_at TEXT,
  last_position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (user_id, course_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_discounts_code ON discounts (code, enabled);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_course ON lesson_progress (user_id, course_id);
