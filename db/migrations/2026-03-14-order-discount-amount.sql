ALTER TABLE orders ADD COLUMN discount_amount INTEGER NOT NULL DEFAULT 0;

UPDATE orders
SET discount_amount = CASE
  WHEN subtotal > total THEN subtotal - total
  ELSE 0
END
WHERE discount_amount = 0;
