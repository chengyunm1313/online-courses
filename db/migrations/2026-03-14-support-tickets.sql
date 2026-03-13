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

CREATE INDEX IF NOT EXISTS idx_support_tickets_status_created ON support_tickets (status, created_at);
