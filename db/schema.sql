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
  hero_title TEXT,
  hero_subtitle TEXT,
  guarantee_text TEXT,
  cta_label TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  description TEXT NOT NULL DEFAULT '',
  thumbnail TEXT,
  og_image TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  original_price INTEGER,
  sales_mode TEXT NOT NULL DEFAULT 'evergreen',
  sales_status TEXT NOT NULL DEFAULT 'draft',
  launch_starts_at TEXT,
  launch_ends_at TEXT,
  show_countdown INTEGER NOT NULL DEFAULT 0,
  show_seats INTEGER NOT NULL DEFAULT 0,
  seat_limit INTEGER,
  sold_count_mode TEXT NOT NULL DEFAULT 'enrollments',
  lead_magnet_enabled INTEGER NOT NULL DEFAULT 0,
  lead_magnet_title TEXT,
  lead_magnet_description TEXT,
  lead_magnet_coupon_code TEXT,
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

CREATE TABLE IF NOT EXISTS course_modules (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  preview_mode TEXT NOT NULL DEFAULT 'locked',
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
  preview_override TEXT NOT NULL DEFAULT 'inherit',
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
  discount_amount INTEGER NOT NULL DEFAULT 0,
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

CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  user_id TEXT,
  session_id TEXT,
  course_id TEXT,
  order_id TEXT,
  discount_code TEXT,
  payment_method TEXT,
  amount INTEGER,
  payload_json TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  order_id TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  user_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
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

CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY,
  platform_name TEXT NOT NULL DEFAULT '線上學院',
  support_email TEXT NOT NULL DEFAULT 'chengyunm1313@gmail.com',
  footer_notice TEXT NOT NULL DEFAULT '提供優質的線上學習體驗，幫助每個人實現學習目標。',
  contact_intro TEXT NOT NULL DEFAULT '若您遇到付款異常、退款申請、課程內容或帳號問題，請直接提交客服單。我們會依類型與訂單資訊進行追蹤處理。',
  support_hours TEXT NOT NULL DEFAULT '週一至週五 10:00 - 18:00',
  support_guidelines TEXT NOT NULL DEFAULT '付款問題：請附上付款方式、時間與錯誤訊息。\n退款申請：請務必填寫訂單編號，方便客服核對。\n課程問題：請描述章節、影片或內容異常的具體情況。',
  refund_summary TEXT NOT NULL DEFAULT '本平台販售之商品為數位課程。付款成功後系統會立即開通課程，因此退款申請將採人工審核。',
  purchase_guide_summary TEXT NOT NULL DEFAULT '購買流程為：課程頁確認資訊、登入後結帳、完成付款、課程立即開通。',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_courses_published ON courses (published, updated_at);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses (status, updated_at);
CREATE INDEX IF NOT EXISTS idx_courses_sales_status ON courses (sales_status, updated_at);
CREATE INDEX IF NOT EXISTS idx_price_ladders_course_sort ON price_ladders (course_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_merchant_trade_no ON orders (merchant_trade_no);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_order_events_event_key ON order_events (event_key);
CREATE INDEX IF NOT EXISTS idx_discounts_code ON discounts (code, enabled);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_course ON lesson_progress (user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name_created ON analytics_events (event_name, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_course_created ON analytics_events (course_id, created_at);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status_created ON support_tickets (status, created_at);
CREATE INDEX IF NOT EXISTS idx_leads_course_created ON leads (course_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlists_course_email ON waitlists (course_id, email);
