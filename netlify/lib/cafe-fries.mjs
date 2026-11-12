import { getDatabase } from "@netlify/database";
import { square } from "./cafe-square.mjs";

export function friesCampaign(cfg, includeScheduled = false) {
  const endsAt = globalThis.Netlify?.env?.get("SQUARE_CAFE_FRIES_ENDS_AT") || process.env.SQUARE_CAFE_FRIES_ENDS_AT;
  const end = Date.parse(endsAt);
  return cfg.environment === "production" && end > Date.now() && (cfg.acceptingOrders || (includeScheduled && Date.parse(cfg.preorderStartsAt) > Date.now() && Date.parse(cfg.preorderStartsAt) < end))
    ? new Date(end).toISOString() : null;
}

export async function reserveFries(campaign, key) {
  const { sql } = getDatabase();
  const existing = await sql`SELECT slot FROM cafe_fries_claims WHERE campaign=${campaign} AND checkout_key=${key}`;
  if (existing.length) return true;
  // Each slot is unique, so concurrent checkouts cannot exceed the cap.
  const inserted = await sql`
    INSERT INTO cafe_fries_claims (campaign, slot, checkout_key)
    SELECT ${campaign}, candidate, ${key}
    FROM generate_series(1, 50) AS candidate
    WHERE NOT EXISTS (
      SELECT 1 FROM cafe_fries_claims WHERE campaign=${campaign} AND slot=candidate
    )
    ORDER BY candidate LIMIT 1
    ON CONFLICT DO NOTHING RETURNING slot
  `;
  if (inserted.length) return true;
  const retry = await sql`SELECT slot FROM cafe_fries_claims WHERE campaign=${campaign} AND checkout_key=${key}`;
  return retry.length > 0;
}

export async function attachFriesOrder(campaign, key, orderId) {
  const { sql } = getDatabase();
  await sql`UPDATE cafe_fries_claims SET square_order_id=${orderId} WHERE campaign=${campaign} AND checkout_key=${key}`;
}

export async function friesAvailability(campaign, cfg) {
  const { sql } = getDatabase();
  const claims = await sql`SELECT square_order_id FROM cafe_fries_claims WHERE campaign=${campaign}`;
  const orders = new Set(claims.map(row => row.square_order_id).filter(Boolean));
  const paid = new Set();
  let cursor;
  if (orders.size) {
    do {
      const query = new URLSearchParams({location_id:cfg.locationId,limit:"100",begin_time:new Date(Date.parse(campaign)-86400000).toISOString()});
      if (cursor) query.set("cursor",cursor);
      const result = await square("/v2/payments?"+query,{},cfg);
      for (const payment of result.payments || []) {
        if (payment.status === "COMPLETED" && orders.has(payment.order_id)) paid.add(payment.order_id);
      }
      cursor = result.cursor;
    } while (cursor && paid.size < orders.size);
  }
  return {endsAt:campaign, available:50-claims.length, paid:paid.size};
}
