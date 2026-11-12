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
    result.canTakeOrders = result.locationValid && categoryFound && result.availableItemCount > 0 &&
      result.pickupSlotsConfigured && result.checkoutEnabled;
    result.summary = result.canTakeOrders ? "The café is configured to accept orders." :
      !categoryFound ? "Create the GLCA Café category and assign items to it in Square." :
      !result.availableItemCount ? "Add at least one available, fixed-price item to GLCA Café in Square." :
      !result.pickupSlotsConfigured ? "Configure actual pickup time slots in Netlify." :
      !result.checkoutEnabled ? "Sandbox checkout is disabled until you enable it." :
      "Additional configuration required.";
    return json(result);
  } catch (err) {
    console.error("GLCA Square catalog test failed:",err.message);
    return json({...result,summary:"The Square catalog could not be read. Verify the token permissions and item setup."});
  }
};
