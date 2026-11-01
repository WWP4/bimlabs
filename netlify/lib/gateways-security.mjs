// Netlify Functions server-only helpers. Never import into browser code.
import {getUser,verifyRequestOrigin} from '@netlify/identity';
import {getDatabase} from '@netlify/database';
import {createHmac,timingSafeEqual} from 'node:crypto';
export const db=getDatabase();
export const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
export const error=(status,message)=>reply({error:message},status);
export const getActor=()=>getUser();
export const isAdmin=u=>Array.isArray(u?.roles)&&u.roles.includes('gateways_admin');
export const isStaff=u=>isAdmin(u)||(Array.isArray(u?.roles)&&u.roles.includes('gateways_staff'));
export const dateOK=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const uuidOK=s=>typeof s==='string'&&/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(s);
export const text=(s,max)=>typeof s==='string'?s.trim().slice(0,max):'';
export const sameOrigin=req=>{try{verifyRequestOrigin(req);return true}catch{return false}};
export async function body(req){const raw=await req.text();if(raw.length>16384)throw Error('Request too large');return JSON.parse(raw)}
const key=()=>{const k=Netlify.env.get('GATEWAYS_QR_SECRET');if(!k||k.length<32)throw Error('Gateways signing secret missing');return k};
export function createPass(id){
 const e=Math.floor(Date.now()/1000)+120;
 const encoded=Buffer.from(JSON.stringify({v:1,s:id,e})).toString('base64url');
 const sig=createHmac('sha256',key()).update(encoded).digest('base64url');
 return{token:'GW1.'+encoded+'.'+sig,expiresAt:new Date(e*1000).toISOString()};
}
export function validatePass(token){
 try{
  if(typeof token!=='string'||token.length>800)return null;
  const p=token.split('.');if(p.length!==3||p[0]!=='GW1')return null;
  const expected=createHmac('sha256',key()).update(p[1]).digest();
  const actual=Buffer.from(p[2],'base64url');
  if(expected.length!==actual.length||!timingSafeEqual(expected,actual))return null;
  const parsed=JSON.parse(Buffer.from(p[1],'base64url').toString('utf8'));
  if(parsed.v!==1||!uuidOK(parsed.s)||!Number.isInteger(parsed.e)||parsed.e<Math.floor(Date.now()/1000)||parsed.e>Math.floor(Date.now()/1000)+130)return null;
  return parsed.s;
 }catch{return null}
}
export async function audit(client,who,action,subject,details={}){
 await client.query('INSERT INTO gateways_audit (actor_identity_id,action,subject_id,details) VALUES ($1,$2,$3,$4::jsonb)',[who,action,String(subject),JSON.stringify(details)]);
}
