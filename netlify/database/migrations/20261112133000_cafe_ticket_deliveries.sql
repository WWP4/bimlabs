CREATE TABLE IF NOT EXISTS cafe_ticket_deliveries (
  square_order_id text NOT NULL,
  recipient text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (square_order_id, recipient)
);
