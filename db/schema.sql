CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  image TEXT,
  role TEXT NOT NULL DEFAULT 'student',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  slug TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft',
  description TEXT NOT NULL DEFAULT '',
  thumbnail TEXT,
  og_image TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  level TEXT NOT NULL DEFAULT 'beginner',
  duration REAL NOT NULL DEFAULT 0,
  lessons INTEGER NOT NULL DEFAULT 0,
  rating REAL NOT NULL DEFAULT 0,
  students_enrolled INTEGER NOT NULL DEFAULT 0,
  tags_json TEXT,
  instructor_id TEXT,
  instructor_name TEXT,
  instructor_avatar TEXT,
  instructor_bio TEXT,
  target_audience_json TEXT,
  learning_outcomes_json TEXT,
  faq_json TEXT,
  sales_blocks_json TEXT,
  seo_title TEXT,
  seo_description TEXT,
  published INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS course_modules (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (course_id) REFERENCES courses(id)
);

CREATE TABLE IF NOT EXISTS course_lessons (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL DEFAULT 0,
  video_url TEXT,
  preview INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (module_id) REFERENCES course_modules(id)
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  merchant_trade_no TEXT UNIQUE,
  status TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  shipping_method TEXT,
  subtotal INTEGER NOT NULL DEFAULT 0,
  tax INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  transaction_id TEXT,
  ecpay_data_json TEXT,
  refund_status TEXT NOT NULL DEFAULT 'none',
  refund_reason TEXT,
  refund_note TEXT,
  refund_requested_at TEXT,
  refunded_at TEXT,
  reconciliation_status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  paid_at TEXT,
  failed_at TEXT,
  canceled_at TEXT
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  course_title_snapshot TEXT NOT NULL,
  course_thumbnail_snapshot TEXT,
  instructor_name_snapshot TEXT,
  price_snapshot INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS enrollments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  order_id TEXT,
  course_title_snapshot TEXT,
  progress INTEGER NOT NULL DEFAULT 0,
  completed_lessons_json TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  last_accessed_at TEXT,
  UNIQUE (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS order_events (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  type TEXT NOT NULL,
  event_key TEXT,
  payload_json TEXT,
  created_at TEXT NOT NULL
);

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

CREATE INDEX IF NOT EXISTS idx_courses_published ON courses (published, updated_at);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses (status, updated_at);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_merchant_trade_no ON orders (merchant_trade_no);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_order_events_event_key ON order_events (event_key);
CREATE INDEX IF NOT EXISTS idx_discounts_code ON discounts (code, enabled);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_course ON lesson_progress (user_id, course_id);
