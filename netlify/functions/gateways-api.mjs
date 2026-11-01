// Gateways school lunch API. Only Netlify Identity + Netlify Database.
import {db,reply,error,getActor,isAdmin,isStaff,dateOK,today,uuidOK,text,sameOrigin,body,createPass,validatePass,audit} from '../lib/gateways-security.mjs';
const routeNames=new Set(['me','pass','menu','roster','scan','correct','stats']);
const permission=(u,admin=false)=>(admin?!isAdmin(u):!isStaff(u))?error(403,'Insufficient permissions'):null;
async function me(u){
 const r=await db.pool.query("SELECT full_name,grade,lunch_period,status FROM gateways_students WHERE identity_user_id=$1 LIMIT 1",[u.id]);
 const s=r.rows[0];return reply({account:s?'linked':'unlinked',staff:isStaff(u),student:s?{name:s.full_name,grade:s.grade,lunchPeriod:s.lunch_period,status:s.status}:null});
}
async function pass(u){
 const r=await db.pool.query("SELECT id FROM gateways_students WHERE identity_user_id=$1 AND status='approved' LIMIT 1",[u.id]);
 if(!r.rows.length)return error(403,'Student account not yet approved');
 return reply(createPass(r.rows[0].id));
}
async function menu(u,url){
 const start=url.searchParams.get('start')||today();
 if(!dateOK(start))return error(400,'Invalid date');
 const r=await db.pool.query("SELECT service_date,title,description FROM gateways_menu WHERE service_date >= $1::date AND service_date < ($1::date + INTERVAL '7 days') ORDER BY service_date LIMIT 7",[start]);
 return reply({menus:r.rows});
}
async function editMenu(u,req){
 const denied=permission(u);if(denied)return denied;
 const data=await body(req),date=data?.date,title=text(data?.title,160),description=text(data?.description,500);
 if(!dateOK(date)||!title)return error(400,'Valid date and meal name required');
 const c=await db.pool.connect();
 try{await c.query('BEGIN');
  await c.query("INSERT INTO gateways_menu(service_date,title,description,updated_by) VALUES($1,$2,$3,$4) ON CONFLICT(service_date) DO UPDATE SET title=EXCLUDED.title,description=EXCLUDED.description,updated_by=EXCLUDED.updated_by,updated_at=now()",[date,title,description,u.id]);
  await audit(c,u.id,'menu.updated',date,{title});await c.query('COMMIT');return reply({ok:true});
 }catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
}
async function roster(u){
 const denied=permission(u);if(denied)return denied;
 const r=await db.pool.query("SELECT id,school_student_id,full_name,grade,lunch_period,status,identity_user_id IS NOT NULL AS linked FROM gateways_students ORDER BY full_name LIMIT 2000");
 return reply({students:r.rows});
}
async function addStudent(u,req){
 const denied=permission(u,true);if(denied)return denied;
 const data=await body(req),number=text(data?.studentId,64),name=text(data?.name,120),grade=text(data?.grade,32),period=text(data?.lunchPeriod,64);
 if(!number||!name||!period)return error(400,'Verified student ID, name and lunch period are required');
 const c=await db.pool.connect();
 try{await c.query('BEGIN');
  const r=await c.query("INSERT INTO gateways_students(school_student_id,full_name,grade,lunch_period) VALUES($1,$2,$3,$4) RETURNING id",[number,name,grade||null,period]);
  await audit(c,u.id,'student.created',r.rows[0].id,{studentId:number});await c.query('COMMIT');
  return reply({id:r.rows[0].id,status:'pending'},201);
 }catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
}
async function approveStudent(u,req){
 const denied=permission(u,true);if(denied)return denied;
 const data=await body(req),id=data?.id,identityId=text(data?.identityUserId,160),status=data?.status;
 if(!uuidOK(id)||!['approved','pending','inactive'].includes(status))return error(400,'Valid record ID and status required');
 if(status==='approved'&&!identityId)return error(400,'Verified invited Identity account ID required');
 const c=await db.pool.connect();
 try{await c.query('BEGIN');
  const r=await c.query("UPDATE gateways_students SET status=$1,identity_user_id=COALESCE(NULLIF($2,''),identity_user_id),approved_by=CASE WHEN $1='approved' THEN $3 ELSE approved_by END,approved_at=CASE WHEN $1='approved' THEN now() ELSE approved_at END WHERE id=$4 RETURNING id,status",[status,identityId,u.id,id]);
  if(!r.rowCount){await c.query('ROLLBACK');return error(404,'Record not found')}
  await audit(c,u.id,'student.status',id,{status,linked:!!identityId});
  await c.query('COMMIT');return reply({ok:true,status});
 }catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
}
async function scan(u,req){
 const denied=permission(u);if(denied)return denied;
 const data=await body(req),studentId=validatePass(data?.token),mode=data?.mode,day=today();
 if(!studentId)return error(400,'Invalid or expired pass');
 if(!['arrival','lunch','second'].includes(mode))return error(400,'Invalid service mode');
 const c=await db.pool.connect();
 try{await c.query('BEGIN');
  await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[studentId+':'+day]);
  const sr=await c.query('SELECT id,full_name,status FROM gateways_students WHERE id=$1 FOR SHARE',[studentId]);
  const st=sr.rows[0];
  if(!st||st.status!=='approved'){await c.query('ROLLBACK');return error(403,'Student not approved')}
  const ev=await c.query("SELECT e.event_type FROM gateways_meal_events e WHERE e.student_id=$1 AND e.service_date=$2 AND e.event_type<>'void' AND NOT EXISTS(SELECT 1 FROM gateways_meal_events v WHERE v.reverses_event_id=e.id)",[studentId,day]);
  const modes=new Set(ev.rows.map(x=>x.event_type));
  if(modes.has(mode)){await c.query('ROLLBACK');return error(409,'Already scanned for this service')}
  if(mode==='second'&&!modes.has('lunch')){await c.query('ROLLBACK');return error(409,'First lunch required before second')}
  const result=await c.query('INSERT INTO gateways_meal_events(student_id,service_date,event_type,actor_identity_id) VALUES($1,$2,$3,$4) RETURNING id',[studentId,day,mode,u.id]);
  await audit(c,u.id,'scan.'+mode,result.rows[0].id,{studentId,day});
  await c.query('COMMIT');return reply({ok:true,eventId:result.rows[0].id,student:st.full_name,mode},201);
 }catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
}
async function correct(u,req){
 const denied=permission(u,true);if(denied)return denied;
 const data=await body(req),eventId=Number(data?.eventId),reason=text(data?.reason,500);
 if(!Number.isSafeInteger(eventId)||eventId<1||reason.length<12)return error(400,'Valid event and reason at least 12 characters are required');
 const c=await db.pool.connect();
 try{await c.query('BEGIN');
  const er=await c.query("SELECT id,student_id,service_date FROM gateways_meal_events WHERE id=$1 AND event_type<>'void'",[eventId]);
  if(!er.rowCount){await c.query('ROLLBACK');return error(404,'Original scan not found')}
  const e=er.rows[0],date=String(e.service_date instanceof Date?e.service_date.toISOString().slice(0,10):e.service_date);
  await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[e.student_id+':'+date]);
  const existing=await c.query('SELECT id FROM gateways_meal_events WHERE reverses_event_id=$1',[eventId]);
  if(existing.rowCount){await c.query('ROLLBACK');return error(409,'Already corrected')}
  const r=await c.query("INSERT INTO gateways_meal_events(student_id,service_date,event_type,reverses_event_id,actor_identity_id,reason) VALUES($1,$2,'void',$3,$4,$5) RETURNING id",[e.student_id,e.service_date,eventId,u.id,reason]);
  await audit(c,u.id,'scan.corrected',r.rows[0].id,{originalEventId:eventId,reason});
  await c.query('COMMIT');return reply({ok:true,correctionId:r.rows[0].id},201);
 }catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
}
async function stats(u,url){
 const denied=permission(u);if(denied)return denied;
 const date=url.searchParams.get('date')||today();
 if(!dateOK(date))return error(400,'Invalid date');
 const r=await db.pool.query("SELECT e.event_type,count(*)::int AS count FROM gateways_meal_events e WHERE e.service_date=$1 AND e.event_type<>'void' AND NOT EXISTS(SELECT 1 FROM gateways_meal_events v WHERE v.reverses_event_id=e.id) GROUP BY e.event_type",[date]);
 const counts={arrival:0,lunch:0,second:0};for(const x of r.rows)counts[x.event_type]=x.count;
 return reply({date,counts:{...counts,totalPlates:counts.lunch+counts.second}});
}
export default async function handler(req){
 const url=new URL(req.url),route=url.pathname.replace(/\/$/,'').split('/').pop();
 if(!routeNames.has(route))return error(404,'Not found');
 if(!['GET','POST','PATCH','PUT'].includes(req.method))return error(405,'Method not allowed');
 if(req.method!=='GET'&&!sameOrigin(req))return error(403,'Request origin not verified');
 let u;
 try{u=await getActor()}catch{return error(503,'Identity unavailable')}
 if(!u)return error(401,'Sign in required');
 try{
  if(route==='me'&&req.method==='GET')return await me(u);
  if(route==='pass'&&req.method==='GET')return await pass(u);
  if(route==='menu'&&req.method==='GET')return await menu(u,url);
  if(route==='menu'&&req.method==='PUT')return await editMenu(u,req);
  if(route==='roster'&&req.method==='GET')return await roster(u);
  if(route==='roster'&&req.method==='POST')return await addStudent(u,req);
  if(route==='roster'&&req.method==='PATCH')return await approveStudent(u,req);
  if(route==='scan'&&req.method==='POST')return await scan(u,req);
  if(route==='correct'&&req.method==='POST')return await correct(u,req);
  if(route==='stats'&&req.method==='GET')return await stats(u,url);
  return error(405,'Unsupported method');
 }catch(e){console.error('Gateways backend failure',e?.message);return e?.code==='23505'?error(409,'Duplicate or conflicting record'):error(500,'Request failed')}
}
export const config={path:'/api/gateways/*'};
