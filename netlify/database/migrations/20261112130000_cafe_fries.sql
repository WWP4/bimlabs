CREATE TABLE IF NOT EXISTS cafe_fries_claims (
  campaign text NOT NULL,
  slot integer NOT NULL CHECK (slot BETWEEN 1 AND 50),
  checkout_key text NOT NULL,
  square_order_id text,
  PRIMARY KEY (campaign, slot),
  UNIQUE (campaign, checkout_key)
);
