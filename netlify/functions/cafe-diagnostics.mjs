import { json, ready, settings, liveCatalog, square } from "../lib/cafe-square.mjs";

// Safe, read-only GLCA Café connection health check. Exposes no API credentials,
// location identifiers, customer data, or Square payment details.
export default async (req) => {
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
  const cfg = settings();
  const result = {
    environment: cfg.environment,
    tokenConfigured: Boolean(cfg.accessToken),
    locationConfigured: Boolean(cfg.locationId),
    locationValid: false,
    squareReachable: false,
    categoryFound: false,
    itemCount: 0,
    availableItemCount: 0,
    expectedMenuReady: false,
    missingMenuItems: [],
    pickupSlotsConfigured: cfg.pickupSlots.length > 0,
    checkoutEnabled: cfg.acceptingOrders,
    canTakeOrders: false
  };
  if (!ready(cfg)) return json({...result, summary:"Square credentials are missing."});
  try {
    const loc = await square("/v2/locations/" + encodeURIComponent(cfg.locationId), {}, cfg);
    result.locationValid = Boolean(loc.location && loc.location.id === cfg.locationId);
    result.squareReachable = true;
  } catch (err) {
    console.error("GLCA Square location test failed:",err.message);
    return json({...result,summary:"Square credentials or location could not be verified."}, 200);
  }
  try {
    const { items, categoryFound } = await liveCatalog(cfg);
    result.categoryFound = categoryFound;
    result.itemCount = items.length;
    result.availableItemCount = items.filter(x => x.available).length;
    const normalize = (s) => String(s||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
    const requirements = [
      { label:"Combo $13.50", names:["burger fries milkshake combo","burger fries shake combo","glca combo","combo","burger combo"], price:1350 },
      { label:"Burger $8.50", names:["burger","single burger"], price:850 },
      { label:"Fries $2.50", names:["fries","french fries"], price:250 },
      { label:"Milkshake $3.75", names:["milkshake","shake"], price:375 }
    ];
    result.missingMenuItems = requirements.filter(rule => !items.some(item =>
      item.available && item.priceCents === rule.price && rule.names.includes(normalize(item.name))
    )).map(rule => rule.label);
    result.expectedMenuReady = result.missingMenuItems.length === 0;
    result.canTakeOrders = result.locationValid && categoryFound && result.expectedMenuReady &&
      result.pickupSlotsConfigured && result.checkoutEnabled;
    result.summary = result.canTakeOrders ? "The café is configured to accept orders." :
      !categoryFound ? "Create the GLCA Café category and assign items to it in Square." :
      !result.expectedMenuReady ? "The GLCA Café production catalog is missing matching combo and/or single items at the listed prices." :
      !result.pickupSlotsConfigured ? "Configure actual pickup time slots in Netlify." :
      !result.checkoutEnabled ? "Café checkout is disabled until you enable it." :
      "Additional configuration required.";
    return json(result);
  } catch (err) {
    console.error("GLCA Square catalog test failed:",err.message);
    return json({...result,summary:"The Square catalog could not be read. Verify the token permissions and item setup."});
  }
};
