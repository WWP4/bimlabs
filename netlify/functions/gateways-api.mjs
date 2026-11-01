// Temporary diagnostic: fail closed and never accept student or scan data.
export default async function handler() {
 return new Response(JSON.stringify({error:"Gateways database activation is pending"}),{status:503,headers:{"content-type":"application/json","cache-control":"no-store"}});
}
export const config={path:"/api/gateways/*"};
