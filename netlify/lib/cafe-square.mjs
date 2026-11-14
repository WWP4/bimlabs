// GLCA Café — shared Square read, availability and pickup validation.
// Square tokens never leave the Netlify function runtime.
const env = (key) => globalThis.Netlify?.env?.get?.(key) ?? process.env[key] ?? "";
export const settings = () => ({
  accessToken: env("SQUARE_ACCESS_TOKEN"),
  locationId: env("SQUARE_LOCATION_ID"),
  categoryId: env("SQUARE_CAFE_CATEGORY_ID"),
  categoryName: env("SQUARE_CAFE_CATEGORY_NAME") || "GLCA Café",
  featuredCategoryName: env("SQUARE_CAFE_FEATURED_CATEGORY_NAME") || "GLCA Featured",
  environment: env("SQUARE_ENVIRONMENT") === "production" ? "production" : "sandbox",
  useSandboxMenu: env("SQUARE_CAFE_SANDBOX_MENU") === "true",
  preorderStartsAt: env("SQUARE_CAFE_PREORDER_STARTS_AT"),
  preorderEndsAt: env("SQUARE_CAFE_PREORDER_ENDS_AT"),
  acceptingOrders: env("SQUARE_ENVIRONMENT") === "production" && env("SQUARE_CAFE_PREORDER_STARTS_AT")
    ? Date.now() >= Date.parse(env("SQUARE_CAFE_PREORDER_STARTS_AT")) && Date.now() < Date.parse(env("SQUARE_CAFE_PREORDER_ENDS_AT"))
    : env("SQUARE_CAFE_ORDERS_ENABLED") === "true",
  pickupSlots: (env("SQUARE_CAFE_PICKUP_SLOTS") || "").split(",").map(s => s.trim()).filter(s => /^\d\d:\d\d$/.test(s)),
  pickupDays: (env("SQUARE_CAFE_PICKUP_DAYS") || "1,2,3,4,5").split(",").map(Number).filter(x => Number.isInteger(x) && x >= 0 && x <= 6),
  timeZone: env("SQUARE_CAFE_TIME_ZONE") || "America/Chicago",
  minLeadMinutes: Math.min(1440, Math.max(15, Number(env("SQUARE_CAFE_LEAD_MINUTES")) || 30)),
  maxDaysAhead: Math.min(30, Math.max(1, Number(env("SQUARE_CAFE_DAYS_AHEAD")) || 7)),
  returnUrl: env("SQUARE_CAFE_RETURN_URL") || "https://www.bimlabsstudio.com/cafe.html?checkout=returned"
});
export const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
export function ready(config) { return Boolean(config.accessToken && config.locationId); }
export async function square(path, options = {}, config = settings()) {
  if (!ready(config)) throw new Error("Square is not connected.");
  const base = config.environment === "production" ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com";
  const res = await fetch(base + path, {
    method: options.method || "GET",
    headers: { "Authorization": "Bearer " + config.accessToken, "Square-Version": "2026-09-16", "Content-Type": "application/json" },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: AbortSignal.timeout(12000)
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.errors?.length) {
    const errors = (body.errors || []).map(x => x.code).join(", ");
    console.error("Square API request failed", res.status, errors); // Never log tokens or customer data.
    const error = new Error("Square could not complete this request (" + res.status + ").");
    error.fields = (body.errors || []).map(x => [x.code, x.field].filter(v => /^[a-zA-Z0-9_.\u005b\u005d-]+$/.test(v ?? "")).join(":"));
    throw error;
  }
  return body;
}
const belongsHere = (obj, locationId) =>
  !obj?.absent_at_location_ids?.includes(locationId) &&
  (obj?.present_at_all_locations !== false || obj?.present_at_location_ids?.includes(locationId));
export async function liveCatalog(config = settings()) {
  if (config.environment === "production" || config.useSandboxMenu) {
    const items = [
      ["combo", "Burger, Fries & Milkshake Combo", 1250],
      ["burger", "Burger", 650],
      ["fries", "Fries", 350],
      ["milkshake", "Milkshake", 375]
    ].map(([id, name, priceCents]) => ({
      id: (config.environment === "production" ? "cafe-" : "sandbox-") + id, name, priceCents, currency: "USD", available: true, category: "Café Favorites"
    }));
    return { items, categoryFound: true, sandboxMenu: true };
  }
  const objects = [];
  let cursor = "";
  for (let page = 0; page < 20; page++) {
    const path = "/v2/catalog/list?types=ITEM,CATEGORY,IMAGE" + (cursor ? "&cursor=" + encodeURIComponent(cursor) : "");
    const response = await square(path, {}, config);
    objects.push(...(response.objects || []));
    if (!response.cursor) break;
    cursor = response.cursor;
    if (page === 19) throw new Error("Square menu is too large to load completely.");
  }
  const categories = new Map(objects.filter(x => x.type === "CATEGORY").map(x => [x.id, x.category_data?.name || "Other"]));
  const images = new Map(objects.filter(x => x.type === "IMAGE").map(x => [x.id, x.image_data?.url || ""]));
  let categoryId = config.categoryId;
  if (!categoryId) {
    const match = [...categories].find(([, name]) => name.toLowerCase().trim() === config.categoryName.toLowerCase().trim());
    categoryId = match?.[0] || "";
  }
  if (!categoryId) return { items: [], categoryFound: false };
  const featuredCategoryId = [...categories].find(([,name])=>name.toLowerCase().trim()===config.featuredCategoryName.toLowerCase().trim())?.[0] || "";
  const items = [];
  for (const item of objects.filter(x => x.type === "ITEM" && belongsHere(x, config.locationId))) {
    const data = item.item_data || {};
    const itemCats = (data.categories || []).map(c => c.id).concat(data.category_id ? [data.category_id] : []);
    if (!itemCats.includes(categoryId)) continue;
    if (data.is_archived || data.product_type === "GIFT_CARD") continue;
    const secondaryId = itemCats.find(id => id !== categoryId && categories.has(id));
    const group = secondaryId ? categories.get(secondaryId) : "Café Favorites";
    for (const variation of data.variations || []) {
      if (!belongsHere(variation, config.locationId) || variation.is_deleted) continue;
      const vd = variation.item_variation_data || {};
      const soldOut = (vd.location_overrides || []).some(x => x.location_id === config.locationId && x.sold_out === true);
      const amount = vd.price_money?.amount;
      const currency = vd.price_money?.currency || "USD";
      if (!Number.isSafeInteger(Number(amount)) || Number(amount) < 0 || currency !== "USD" || vd.pricing_type === "VARIABLE_PRICING") continue;
      const imgId = data.image_ids?.[0] || vd.image_ids?.[0];
      const image = images.get(imgId) || "";
      items.push({
        id: variation.id, name: data.name || "Café item", variation: vd.name || "",
        description: data.description_plaintext || data.description || "",
        category: group, priceCents: Number(amount), currency: "USD",
        image: /^https:\/\//.test(image) ? image : "",
        available: !soldOut, featured: Boolean(featuredCategoryId && itemCats.includes(featuredCategoryId))
      });
    }
  }
  return { items: items.sort((a,b)=>a.name.localeCompare(b.name)), categoryFound: true };
}
function zoneParts(date, timeZone) {
  const x = new Intl.DateTimeFormat("en-US", { timeZone, year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23" }).formatToParts(date);
  const out = Object.fromEntries(x.filter(y => y.type !== "literal").map(y => [y.type, Number(y.value)]));
  return out;
}
export function validatePickup(day, time, cfg = settings()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day || "") || !/^\d{2}:\d{2}$/.test(time || "")) return null;
  if (!cfg.pickupSlots.includes(time)) return null;
  const [year, month, date] = day.split("-").map(Number), [hour, minute] = time.split(":").map(Number);
  if (month < 1 || month > 12 || hour > 23 || minute > 59) return null;
  const calendarDate = new Date(Date.UTC(year,month-1,date,12));
  if (calendarDate.getUTCFullYear() !== year || calendarDate.getUTCMonth() !== month-1 || calendarDate.getUTCDate() !== date || !cfg.pickupDays.includes(calendarDate.getUTCDay())) return null;
  const requestedAsUTC = Date.UTC(year,month-1,date,hour,minute);
  let epoch = requestedAsUTC;
  try {
    for (let pass=0; pass<3; pass++) {
      const p = zoneParts(new Date(epoch), cfg.timeZone);
      const displayedAsUTC = Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute);
      epoch += requestedAsUTC-displayedAsUTC;
    }
    const check = zoneParts(new Date(epoch),cfg.timeZone);
    if (check.year!==year||check.month!==month||check.day!==date||check.hour!==hour||check.minute!==minute) return null;
  } catch(e){ return null; }
  const offset = epoch - Date.now();
  if (offset < cfg.minLeadMinutes*60000 || offset > cfg.maxDaysAhead*86400000) return null;
  return new Date(epoch).toISOString();
}
