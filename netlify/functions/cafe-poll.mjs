import { getDatabase } from "@netlify/database";
const countries=new Set(["AW","AF","AO","AI","AX","AL","AD","AE","AR","AM","AS","AQ","TF","AG","AU","AT","AZ","BI","BE","BJ","BQ","BF","BD","BG","BH","BS","BA","BL","BY","BZ","BM","BO","BR","BB","BN","BT","BV","BW","CF","CA","CC","CH","CL","CN","CI","CM","CD","CG","CK","CO","KM","CV","CR","CU","CW","CX","KY","CY","CZ","DE","DJ","DM","DK","DO","DZ","EC","EG","ER","EH","ES","EE","ET","FI","FJ","FK","FR","FO","FM","GA","GB","GE","GG","GH","GI","GN","GP","GM","GW","GQ","GR","GD","GL","GT","GF","GU","GY","HK","HM","HN","HR","HT","HU","ID","IM","IN","IO","IE","IR","IQ","IS","IL","IT","JM","JE","JO","JP","KZ","KE","KG","KH","KI","KN","KR","KW","LA","LB","LR","LY","LC","LI","LK","LS","LT","LU","LV","MO","MF","MA","MC","MD","MG","MV","MX","MH","MK","ML","MT","MM","ME","MN","MP","MZ","MR","MS","MQ","MU","MW","MY","YT","NA","NC","NE","NF","NG","NI","NU","NL","NO","NP","NR","NZ","OM","PK","PA","PN","PE","PH","PW","PG","PL","PR","KP","PT","PY","PS","PF","QA","RE","RO","RU","RW","SA","SD","SN","SG","GS","SH","SJ","SB","SL","SV","SM","SO","PM","RS","SS","ST","SR","SK","SI","SE","SZ","SX","SC","SY","TC","TD","TG","TH","TJ","TK","TM","TL","TO","TT","TN","TR","TV","TW","TZ","UG","UA","UM","UY","US","UZ","VA","VC","VE","VG","VI","VN","VU","WF","WS","YE","ZA","ZM","ZW"]);
const json=(data,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store"}});
export default async function(req){
  const {sql}=getDatabase();
  try{
    if(req.method==="POST"){
      if(!req.headers.get("content-type")?.startsWith("application/json"))return json({error:"Invalid ballot."},415);
      const raw=await req.text();
      if(raw.length>2048)return json({error:"Ballot is too long."},413);
      let ballot;
      try{ballot=JSON.parse(raw)}catch{return json({error:"Invalid ballot."},400)}
      const {id,item,special,country,dish}=ballot||{};
      if(typeof id!=="string"||!/^[a-f0-9-]{36}$/.test(id)||!["chicken","fries"].includes(item)||
         !["meal","dessert"].includes(special)||!countries.has(country)||typeof dish!=="string"||dish.trim().length>100)
        return json({error:"Choose a menu item, a special, and a country or territory."},400);
      await sql`INSERT INTO cafe_menu_ballots (id,item,special,country,dish) VALUES (${id},${item},${special},${country},${dish.trim()}) ON CONFLICT (id) DO NOTHING`;
      return json({ok:true});
    }
    if(req.method!=="GET")return json({error:"Method not allowed."},405);
    const rows=await sql`SELECT item,special,country,count(*)::int AS votes FROM cafe_menu_ballots GROUP BY item,special,country`;
    const results={item:{chicken:0,fries:0},special:{meal:0,dessert:0},country:{},total:0};
    for(const row of rows){
      results.item[row.item]+=row.votes;
      results.special[row.special]+=row.votes;
      results.country[row.country]=(results.country[row.country]||0)+row.votes;
      results.total+=row.votes;
    }
    return json(results);
  }catch(error){
    console.error("Café poll database error",error.code||error.name);
    return json({error:"Voting is temporarily unavailable. Try again shortly."},503);
  }
}
