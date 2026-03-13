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

INSERT OR IGNORE INTO site_settings (
  id,
  platform_name,
  support_email,
  footer_notice,
  contact_intro,
  support_hours,
  support_guidelines,
  refund_summary,
  purchase_guide_summary,
  created_at,
  updated_at
) VALUES (
  'default',
  '線上學院',
  'chengyunm1313@gmail.com',
  '提供優質的線上學習體驗，幫助每個人實現學習目標。',
  '若您遇到付款異常、退款申請、課程內容或帳號問題，請直接提交客服單。我們會依類型與訂單資訊進行追蹤處理。',
  '週一至週五 10:00 - 18:00',
  '付款問題：請附上付款方式、時間與錯誤訊息。\n退款申請：請務必填寫訂單編號，方便客服核對。\n課程問題：請描述章節、影片或內容異常的具體情況。',
  '本平台販售之商品為數位課程。付款成功後系統會立即開通課程，因此退款申請將採人工審核。',
  '購買流程為：課程頁確認資訊、登入後結帳、完成付款、課程立即開通。',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
