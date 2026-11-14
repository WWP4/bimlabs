import { getDatabase } from "@netlify/database";
import { settings, ready, square } from "../lib/cafe-square.mjs";

export const config = { schedule: "* * * * *" };

const recipients = ["info@wonderworldplaysets.com", "tricitycanvasproducts@gmail.com"];
const env = key => globalThis.Netlify?.env?.get?.(key) ?? process.env[key];

const dessertStart = Date.parse("2026-11-14T00:00:00-06:00");
const dessertEnd = Date.parse("2026-11-15T00:00:00-06:00");
const dessertNote = "Sunday pickup at GLCA Café, 10 AM–4 PM Central";

function ticket(order, fulfillment, timeZone) {
  const pickup = fulfillment.pickup_details;
  const contact = pickup.recipient || {};
  const when = new Intl.DateTimeFormat("en-US", {
    timeZone, weekday:"short", hour:"numeric", minute:"2-digit"
  }).format(new Date(pickup.pickup_at));
  return [
    "GLCA CAFÉ · PAID ORDER",
    "Order " + order.id,
    pickup.note,
    pickup.note === dessertNote ? undefined : "Service time: " + when,
    "Name: " + (contact.display_name || "Not provided"),
    contact.phone_number && "Phone: " + contact.phone_number,
    "",
    ...(order.line_items || []).map(item => item.quantity + " × " + item.name + (pickup.note === dessertNote && item.note ? " (" + item.note + ")" : ""))
  ].filter(line => line !== undefined && line !== false).join("\n");
}

async function sendTicket(order, fulfillment, recipient, cfg, sql) {
  const response = await fetch("https://api.resend.com/emails", {
    method:"POST",
    headers:{
      Authorization:"Bearer " + env("RESEND_API_KEY"),
      "Content-Type":"application/json",
      "Idempotency-Key":"glca-cafe-ticket/" + order.id + "/" + recipient
    },
    body:JSON.stringify({
      from:env("BOOKING_FROM_EMAIL"), to:[recipient],
      subject:(fulfillment.pickup_details.note === dessertNote ? "GLCA Café paid dessert order #" : "GLCA Café paid order #") + order.id.slice(-8),
      text:ticket(order,fulfillment,cfg.timeZone)
    }),
    signal:AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error("Email provider status " + response.status);
  await sql`
    INSERT INTO cafe_ticket_deliveries (square_order_id, recipient)
    VALUES (${order.id}, ${recipient}) ON CONFLICT DO NOTHING
  `;
}

export default async () => {
  const cfg = settings();
  const burgerStart = Date.parse(cfg.preorderStartsAt);
  const burgerEnd = Date.parse(cfg.preorderEndsAt);
  const now = Date.now();
  const burgerActive = Number.isFinite(burgerStart) && now >= burgerStart && now <= burgerEnd + 86400000;
  const dessertActive = now >= dessertStart && now <= dessertEnd + 86400000;
  if (!ready(cfg) || cfg.environment !== "production" || (!burgerActive && !dessertActive)) {
    return new Response(null, { status:204 });
  }
  const start = Math.min(burgerActive ? burgerStart : Infinity, dessertActive ? dessertStart : Infinity);
  if (!env("RESEND_API_KEY") || !env("BOOKING_FROM_EMAIL")) {
    console.error("Café ticket email sender is missing");
    return new Response(null,{status:503});
  }

  const { sql } = getDatabase();
  const deliveries = await sql`SELECT square_order_id, recipient FROM cafe_ticket_deliveries WHERE sent_at >= ${new Date(start).toISOString()}::timestamptz`;
  const sent = new Set(deliveries.map(row => row.square_order_id + "/" + row.recipient));
  const seen = new Set();
  let cursor, failed = false;
  do {
    const params = new URLSearchParams({
      location_id:cfg.locationId, limit:"100", begin_time:new Date(start).toISOString()
    });
    if (cursor) params.set("cursor",cursor);
    const page = await square("/v2/payments?" + params,{},cfg);
    for (const payment of page.payments || []) {
      const id = payment.order_id;
      if (payment.status !== "COMPLETED" || !id || seen.has(id)) continue;
      seen.add(id);
      const pending = recipients.filter(address => !sent.has(id + "/" + address));
      if (!pending.length) continue;
      try {
        const { order } = await square("/v2/orders/" + encodeURIComponent(id),{},cfg);
        if (order?.location_id !== cfg.locationId || order.source?.name !== "GLCA Café") continue;
        const fulfillment = order.fulfillments?.find(entry => entry.type === "PICKUP" && entry.pickup_details?.pickup_at);
        if (!fulfillment) continue;
        const created = Date.parse(order.created_at);
        const dessert = fulfillment.pickup_details.note === dessertNote;
        if (dessert ? !dessertActive || !(created >= dessertStart && created < dessertEnd)
                    : !burgerActive || !(created >= burgerStart)) continue;
        const results = await Promise.allSettled(pending.map(address => sendTicket(order,fulfillment,address,cfg,sql)));
        for (const result of results) if (result.status === "rejected") {
          console.error("Café ticket send failed:",result.reason.message);
          failed = true;
        }
      } catch {
        console.error("Café ticket order lookup failed");
        failed = true;
      }
    }
    cursor = page.cursor;
  } while (cursor);
  return new Response(null,{status:failed?503:204});
};
