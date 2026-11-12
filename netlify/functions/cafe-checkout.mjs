import { json, ready, settings, liveCatalog, validatePickup, square } from "../lib/cafe-square.mjs";
export default async (req) => {
  if (req.method !== "POST") return json({ error:"Method not allowed." },405);
  const cfg=settings();
  if (!ready(cfg) || !cfg.acceptingOrders || !cfg.pickupSlots.length) return json({ error:"GLCA Café ordering is not currently open." },503);
  const type=req.headers.get("content-type") || "";
  if (!type.includes("application/json")) return json({ error:"Invalid request format." },415);
  let body;
  try { if (Number(req.headers.get("content-length") || 0)>12000) throw Error(); body=await req.json(); }
  catch(e){ return json({error:"Invalid order."},400); }
  if (!body || typeof body!=="object") return json({error:"Invalid order."},400);
  const name=String(body.studentName||"").trim();
  const email=String(body.email||"").trim();
  const phone=String(body.phone||"").trim();
  const digits=phone.replace(/\D/g,"");
  const legacy=body.fulfillment===undefined;
  const mode=body.fulfillment??"pickup";
  const building=String(body.dormBuilding||"").trim();
  const room=String(body.dormRoom||"").trim();
  if (!["pickup","delivery"].includes(mode) || (!legacy && (!email || !/^[+\d(). -]{7,25}$/.test(phone) || digits.length<7 || digits.length>15)) ||
      (mode==="delivery" && ![building,room].every(value=>/^[\w -]{1,40}$/.test(value)))) return json({error:"Check your contact and dorm details."},400);
  const items=body.items;
  const sauces=body.sauces ?? [];
  const normalizedName=(name)=>String(name||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
  const approved=[
    {names:["burger fries milkshake combo","burger fries shake combo","glca combo","combo","burger combo"],price:1350},
    {names:["burger","single burger"],price:850},
    {names:["fries","french fries"],price:250},
    {names:["milkshake","shake"],price:375}
  ];
  if(!Array.isArray(sauces)||sauces.length>2||new Set(sauces).size!==sauces.length||
     sauces.some(x=>x!=="ketchup"&&x!=="mayo"))
    return json({error:"Choose ketchup, mayo, both, or no sauce."},400);
  const sauceNote=sauces.length?"Free sauces: "+sauces.map(x=>x==="ketchup"?"Ketchup":"Mayo").join(", "):"No sauces requested";
  const idempotencyKey=String(body.idempotencyKey||"");
  if (name.length<2||name.length>80 || email.length>150 || (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) ||
      !Array.isArray(items) || !items.length||items.length>16 ||
      !/^[\w-]{16,80}$/.test(idempotencyKey)) return json({ error:"Please check your name, order, and contact details." },400);
  // Assign the next configured café service slot when the customer leaves scheduling to the café.
  const parts=new Intl.DateTimeFormat("en",{timeZone:cfg.timeZone,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  const dateParts=Object.fromEntries(parts.map(part=>[part.type,part.value]));
  const today=`${dateParts.year}-${dateParts.month}-${dateParts.day}`;
  const dates=Array.from({length:cfg.maxDaysAhead+1},(_,index)=>new Date(Date.parse(today+"T12:00:00Z")+index*86400000).toISOString().slice(0,10));
  const pickupAt=legacy?validatePickup(body.pickupDay,body.pickupTime,cfg):dates.flatMap(date=>cfg.pickupSlots.map(time=>validatePickup(date,time,cfg))).filter(Boolean).sort()[0];
  if (!pickupAt) return json({error:"No café service times are available right now."},409);
  try{
    const {items:catalog,categoryFound,sandboxMenu}=await liveCatalog(cfg);
    if(!categoryFound) return json({error:"The café menu is not configured."},503);
    const catalogMap=new Map(catalog.map(x=>[x.id,x]));
    const grouped=new Map();
    for(const entry of items){
      const id=String(entry.id||"");
      const qty=Number(entry.quantity);
      const product=catalogMap.get(id);
      if(!product||!product.available||!Number.isInteger(qty)||qty<1||qty>10)
        return json({error:"One or more items are unavailable. Please refresh the menu."},409);
      const allowed=approved.some(x=>x.price===product.priceCents&&x.names.includes(normalizedName(product.name)));
      if(!allowed)return json({error:"Square item or price does not match the GLCA menu. Please contact café staff."},409);
      grouped.set(id,(grouped.get(id)||0)+qty);
      if(grouped.get(id)>10) return json({error:"Maximum quantity per item is 10."},400);
    }
    const qtyTotal=[...grouped.values()].reduce((a,b)=>a+b,0);
    const subtotal=[...grouped].reduce((total,[id,qty])=>total+catalogMap.get(id).priceCents*qty,0);
    if(qtyTotal>30 || subtotal<=0 || subtotal>50000) return json({error:"Please contact the café for large or zero-price orders."},400);
    const recipient={display_name:name};
    if(email)recipient.email_address=email;
    if(phone)recipient.phone_number=phone;
    const delivery=mode==="delivery";
    const destination=delivery?`Dorm delivery: building ${building}, room ${room}`:"Café pickup";
    const description=[destination,sauceNote,legacy&&body.boardingHouse&&"Dorm: "+String(body.boardingHouse).slice(0,80),legacy&&body.notes&&"Note: "+String(body.notes).slice(0,350)].filter(Boolean).join(" | ");
    const squareBody={
      idempotency_key:idempotencyKey,
      description:delivery?"GLCA Café dorm delivery":"GLCA Café pickup",
      order:{
        location_id:cfg.locationId,
        source:{name:"GLCA Café"},
        line_items:[...grouped].map(([id,qty])=>{
          const item=catalogMap.get(id);
          const product=sandboxMenu
            ? {name:item.name,base_price_money:{amount:item.priceCents,currency:"USD"}}
            : {catalog_object_id:id};
          return {...product,quantity:String(qty),note:description};
        }),
        pricing_options:{auto_apply_taxes:true,auto_apply_discounts:true},
        // Campus staff handle dorm delivery using the destination on the café ticket.
        fulfillments:[{
          type:"PICKUP",state:"PROPOSED",pickup_details:{schedule_type:"SCHEDULED",pickup_at:pickupAt,recipient,note:description}
        }]
      },
      checkout_options:{allow_tipping:false,ask_for_shipping_address:false,redirect_url:cfg.returnUrl}
    };
    const response=await square("/v2/online-checkout/payment-links",{method:"POST",body:squareBody},cfg);
    const link=response.payment_link?.url;
    const orderId=response.payment_link?.order_id;
    if(!link || !/^https:\/\/(?:square\.link|(?:checkout\.)?square\.site|checkout\.squareupsandbox\.com|(?:sandbox|staging)\.square\.link)\//.test(link))
      throw Error("Square checkout link not available.");
    return json({checkoutUrl:link,orderId,mode:cfg.environment});
  } catch(err){
    console.error("Café checkout error:",err.message);
    return json({error:"Square could not start checkout. Please try again or ask café staff."},502);
  }
};
