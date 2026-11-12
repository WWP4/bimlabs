import { json, settings, ready, square } from "../lib/cafe-square.mjs";
// Public endpoint discloses payment/fulfillment state only, never buyer details.
export default async (req) => {
  if (req.method !== "GET") return json({ error:"Method not allowed." },405);
  const cfg=settings();
  if (!ready(cfg)) return json({ status:"unavailable" },503);
  const u=new URL(req.url), orderId=u.searchParams.get("orderId") || "";
  if (!/^[A-Za-z0-9_-]{12,200}$/.test(orderId)) return json({error:"Invalid order ID."},400);
  try {
    const response=await square("/v2/orders/"+encodeURIComponent(orderId),{},cfg);
    const order=response.order;
    if (!order || order.location_id!==cfg.locationId || !order.fulfillments?.some(f=>f.type==="PICKUP")) return json({status:"unavailable"},404);
    // This endpoint does not equate a redirect with payment. Verify against Square Payments.
    const begin = order.created_at ? new Date(Math.max(new Date(order.created_at).getTime()-3600000,Date.now()-30*86400000)).toISOString() : new Date(Date.now()-2*86400000).toISOString();
    const seen=new Set();
    let cursor="";
    for (let page=0;page<10;page++){
      const params=new URLSearchParams({location_id:cfg.locationId,begin_time:begin,limit:"100"});
      if(cursor)params.set("cursor",cursor);
      const paymentResult=await square("/v2/payments?"+params.toString(),{},cfg);
      const relevant=(paymentResult.payments||[]).filter(p=>p.order_id===orderId);
      if(relevant.some(p=>p.status==="COMPLETED")) {
        const fulfillment=order.fulfillments.find(f=>f.type==="PICKUP");
        const pickup=fulfillment?.pickup_details;
        const at=Date.parse(pickup?.pickup_at);
        const serviceTime=Number.isFinite(at)?new Intl.DateTimeFormat("en-US",{
          timeZone:cfg.timeZone,hour:"numeric",minute:"2-digit"
        }).format(at):null;
        return json({status:"paid",method:pickup?.note?.startsWith("Dorm delivery:")?"delivery":"pickup",serviceTime});
      }
      if(!paymentResult.cursor || seen.has(paymentResult.cursor))break;
      seen.add(paymentResult.cursor);cursor=paymentResult.cursor;
    }
    return json({status:"pending"});
  }catch(err){console.error("Order status verification failed:",err.message);return json({status:"unavailable"},503)}
};
