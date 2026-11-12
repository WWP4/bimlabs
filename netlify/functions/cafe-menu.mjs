import { json, ready, settings, liveCatalog, validatePickup } from "../lib/cafe-square.mjs";
export default async (req) => {
  if (req.method !== "GET") return json({ error:"Method not allowed" },405);
  const config = settings();
  if (!ready(config)) return json({ connected:false, acceptingOrders:false, items:[], categories:[], pickupSlots:[], pickupDays:[], timeZone:config.timeZone, reason:"Square connection required." });
  try {
    const { items, categoryFound } = await liveCatalog(config);
    const hasMenu = categoryFound && items.some(x=>x.available);
    const acceptingOrders = config.acceptingOrders && hasMenu && config.pickupSlots.length > 0;
    const parts=new Intl.DateTimeFormat("en",{timeZone:config.timeZone,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
    const date=Object.fromEntries(parts.map(part=>[part.type,part.value]));
    const day=`${date.year}-${date.month}-${date.day}`;
    const formatter=new Intl.DateTimeFormat("en-US",{timeZone:config.timeZone,hour:"numeric",minute:"2-digit"});
    const serviceTimes=config.pickupSlots.flatMap(value=>{
      const at=validatePickup(day,value,config);
      return at?[{value,label:formatter.format(new Date(at))}]:[];
    });
    return json({
      serviceTimes, connected:true, acceptingOrders, mode:config.environment, items, categoryFound,
      preorderStartsAt:config.preorderStartsAt, preorderEndsAt:config.preorderEndsAt,
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
