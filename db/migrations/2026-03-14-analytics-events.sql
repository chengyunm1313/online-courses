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

CREATE INDEX IF NOT EXISTS idx_analytics_events_name_created ON analytics_events (event_name, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_course_created ON analytics_events (course_id, created_at);
