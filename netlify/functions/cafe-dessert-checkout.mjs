import { json, ready, settings, square, validatePickup } from "../lib/cafe-square.mjs";

const products = {
  bala: ["Bala Baiana", 175],
  bem: ["Bem-casado", 250],
  bolo: ["Mini Bolo de Cenoura", 500],
  bundle: ["Tasting Bundle", 850]
};
const pickupDay = "2026-11-15";
const deadline = Date.parse("2026-11-15T00:00:00-06:00");
const storefront = "https://glca-todays-flavors.bimlabsstudio.chatgpt.site";

export default async function checkout(req) {
  const origin = req.headers.get("origin");
  const headers = {
    "Access-Control-Allow-Origin": storefront,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  function respond(data, status = 200) {
    const response = json(data, status);
    for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
    return response;
  }
  if (origin !== storefront) return respond({ error: "Invalid storefront." }, 403);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return respond({ error: "Method not allowed." }, 405);
  if (Date.now() >= deadline) return respond({ error: "Dessert preorders are closed." }, 409);
  const cfg = settings();
  if (!ready(cfg) || cfg.environment !== "production") return respond({ error: "Dessert checkout is unavailable." }, 503);
  const slot = globalThis.Netlify?.env?.get?.("GLCA_DESSERT_PICKUP_TIME") ?? process.env.GLCA_DESSERT_PICKUP_TIME;
  const pickupAt = validatePickup(pickupDay, slot, { ...cfg, pickupDays: [0], pickupSlots: [slot] });
  if (!pickupAt) return respond({ error: "Dessert pickup time has not been set." }, 503);
  let body;
  try {
    if (!req.headers.get("content-type")?.includes("application/json")) throw Error();
    const raw = await req.text();
    if (raw.length > 4000) throw Error();
    body = JSON.parse(raw);
  } catch {
    return respond({ error: "Invalid order." }, 400);
  }
  const { studentName, email, idempotencyKey, items } = body ?? {};
  const name = typeof studentName === "string" ? studentName.trim() : "";
  if (name.length < 2 || name.length > 80 || typeof email !== "string" ||
      email.length > 150 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ||
      typeof idempotencyKey !== "string" || !/^[\w-]{16,80}$/.test(idempotencyKey) ||
      !items || typeof items !== "object" || Array.isArray(items)) {
    return respond({ error: "Check your name, email, and cart." }, 400);
  }
  const entries = Object.entries(items);
  if (!entries.length || entries.some(([id, quantity]) => !Object.hasOwn(products, id) ||
      !Number.isInteger(quantity) || quantity < 1 || quantity > 10)) {
    return respond({ error: "Choose between one and ten of each item." }, 400);
  }
  const counts = { bala: 0, bem: 0, bolo: 0, bundle: 0, ...items };
  const matched = Math.min(counts.bala, counts.bem, counts.bolo);
  for (const id of ["bala", "bem", "bolo"]) counts[id] -= matched;
  counts.bundle += matched;
  const lineItems = Object.entries(counts).filter(([, quantity]) => quantity).map(([id, quantity]) => ({
    name: products[id][0],
    quantity: String(quantity),
    base_price_money: { amount: products[id][1], currency: "USD" },
    ...(id === "bundle" ? { note: "One Bala Baiana, one Bem-casado, one mini Bolo de Cenoura" } : {})
  }));
  try {
    const result = await square("/v2/online-checkout/payment-links", { method: "POST", body: {
      idempotency_key: "dessert-" + idempotencyKey,
      description: "GLCA Café dessert preorder",
      order: {
        location_id: cfg.locationId,
        source: { name: "GLCA Café" },
        line_items: lineItems,
        pricing_options: { auto_apply_taxes: true },
        fulfillments: [{ type: "PICKUP", state: "PROPOSED", pickup_details: {
          schedule_type: "SCHEDULED", pickup_at: pickupAt,
          recipient: { display_name: name, email_address: email },
          note: "Brazilian dessert preorder"
        } }]
      },
      checkout_options: { allow_tipping: false, ask_for_shipping_address: false, redirect_url: storefront + "/?checkout=returned" },
      pre_populated_data: { buyer_email: email }
    } }, cfg);
    const { url, order_id: orderId } = result.payment_link ?? {};
    if (!orderId || !/^https:\/\/(?:square\.link|(?:checkout\.)?square\.site)\//.test(url || "")) throw Error();
    return respond({ checkoutUrl: url, orderId });
  } catch {
    return respond({ error: "Square could not start checkout. Please try again." }, 502);
  }
}
