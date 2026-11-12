import { json, ready, settings, liveCatalog } from "./cafe-square.mjs";
export default async (req) => {
  if (req.method !== "GET") return json({ error:"Method not allowed" },405);
  const config = settings();
  if (!ready(config)) return json({ connected:false, acceptingOrders:false, items:[], categories:[], pickupSlots:[], pickupDays:[], timeZone:config.timeZone, reason:"Square connection required." });
  try {
    const { items, categoryFound } = await liveCatalog(config);
    const hasMenu = categoryFound && items.some(x=>x.available);
    const acceptingOrders = config.acceptingOrders && hasMenu && config.pickupSlots.length > 0;
    return json({
      connected:true, acceptingOrders, mode:config.environment, items, categoryFound,
      categories:[...new Set(items.map(x=>x.category))],
      pickupSlots:config.pickupSlots, pickupDays:config.pickupDays, timeZone:config.timeZone,
      maxDaysAhead:config.maxDaysAhead, minLeadMinutes:config.minLeadMinutes,
      reason:!categoryFound ? "Create a Square category named GLCA Café and assign café items to it." :
        !hasMenu ? "No available café items were found in Square." :
        !config.pickupSlots.length ? "Pickup times must be configured before ordering opens." :
        !config.acceptingOrders ? "Live orders have not been enabled yet." : ""
    });
  } catch(err) {
    console.error("Café menu request failed:",err.message);
    return json({ connected:false, acceptingOrders:false, items:[], categories:[], pickupSlots:[], pickupDays:[], reason:"The Square menu is temporarily unavailable." },503);
  }
};
