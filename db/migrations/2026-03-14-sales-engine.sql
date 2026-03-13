ALTER TABLE courses ADD COLUMN original_price INTEGER;
ALTER TABLE courses ADD COLUMN sales_mode TEXT NOT NULL DEFAULT 'evergreen';
ALTER TABLE courses ADD COLUMN sales_status TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE courses ADD COLUMN launch_starts_at TEXT;
ALTER TABLE courses ADD COLUMN launch_ends_at TEXT;
ALTER TABLE courses ADD COLUMN show_countdown INTEGER NOT NULL DEFAULT 0;
ALTER TABLE courses ADD COLUMN show_seats INTEGER NOT NULL DEFAULT 0;
ALTER TABLE courses ADD COLUMN seat_limit INTEGER;
ALTER TABLE courses ADD COLUMN sold_count_mode TEXT NOT NULL DEFAULT 'enrollments';
ALTER TABLE courses ADD COLUMN lead_magnet_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE courses ADD COLUMN lead_magnet_title TEXT;
ALTER TABLE courses ADD COLUMN lead_magnet_description TEXT;
ALTER TABLE courses ADD COLUMN lead_magnet_coupon_code TEXT;

UPDATE courses
SET
  original_price = COALESCE(original_price, price),
  sales_mode = COALESCE(sales_mode, 'evergreen'),
  sales_status = CASE
    WHEN status = 'published' THEN 'selling'
    WHEN status = 'archived' THEN 'closed'
    ELSE 'draft'
  END,
  sold_count_mode = COALESCE(sold_count_mode, 'enrollments')
WHERE original_price IS NULL
   OR sales_mode IS NULL
   OR sales_status IS NULL
   OR sold_count_mode IS NULL;

CREATE TABLE IF NOT EXISTS price_ladders (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  starts_at TEXT,
  ends_at TEXT,
  seat_limit INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (course_id) REFERENCES courses(id)
);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  source TEXT NOT NULL,
  coupon_code TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  user_id TEXT,
  payload_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS waitlists (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  user_id TEXT,
  payload_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_courses_sales_status ON courses (sales_status, updated_at);
CREATE INDEX IF NOT EXISTS idx_price_ladders_course_sort ON price_ladders (course_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_leads_course_created ON leads (course_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlists_course_email ON waitlists (course_id, email);
