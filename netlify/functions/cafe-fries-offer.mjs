import { json, settings } from "../lib/cafe-square.mjs";
import { friesCampaign, friesAvailability } from "../lib/cafe-fries.mjs";

export default async (req) => {
  if (req.method !== "GET") return json({error:"Method not allowed."},405);
  const cfg=settings();
  const campaign=friesCampaign(cfg);
  if (!campaign) return json({active:false});
  try {
    return json({active:true,...await friesAvailability(campaign,cfg)});
  } catch (err) {
    console.error("Café fries offer unavailable",err.message);
    return json({active:false},503);
  }
};
