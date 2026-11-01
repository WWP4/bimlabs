import {getUser,login,logout,getSettings,handleAuthCallback,acceptInvite,requestPasswordRecovery,updateUser} from '@netlify/identity';
const root=document.getElementById('gateways-root');
const student=document.body.dataset.gatewaysPortal==='student';
let currentUser=null,profile=null,activeTab=student?'pass':'overview',activeCamera=null,cameraFrame=0,detector=null,scanBusy=false,scanMode='lunch';
const el=id=>document.getElementById(id);
const safe=value=>String(value??'').replace(/[&<>"']/g,ch=>ch==='&'?'&amp;':ch==='<'?'&lt;':ch==='>'?'&gt;':ch==='"'?'&quot;':'&#39;');
const dayISO=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const monday=()=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-(d.getDay()+6)%7+([0,6].includes(d.getDay())?7:0));return d};
const weekDays=()=>Array.from({length:5},(_,i)=>{let d=monday();d.setDate(d.getDate()+i);return{iso:dayISO(d),name:d.toLocaleDateString('en-US',{weekday:'long'}),num:d.getDate()}});
const msg=(message,ok=false)=>{const a=el('message');if(a){a.hidden=false;a.className=ok?'success':'error';a.textContent=message}};
async function api(path,method='GET',body){
 const res=await fetch('/api/gateways/'+path,{method,credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json'},body:body?JSON.stringify(body):undefined});
 let data;try{data=await res.json()}catch{throw Error('The school database is not available')}
 if(!res.ok)throw Error(data.error||'Request failed');return data;
}
function loginPage(){
 root.innerHTML='<div class="auth-wrap"><div class="eyebrow">GATEWAYS / SECURE '+(student?'STUDENT':'KITCHEN')+' ACCESS</div><h1>Welcome back.</h1><p>Sign in with your school-approved account. For security, the school verifies every student before issuing a lunch pass.</p><div class="panel"><div class="panel-body"><form id="login-form"><div class="form-row"><label>Email address</label><input name="email" type="email" autocomplete="username" required></div><div class="form-row"><label>Password</label><input name="password" type="password" autocomplete="current-password" required></div><div class="form-actions"><button class="btn primary">Sign in</button><button class="btn flat" type="button" id="forgot">Forgot password?</button></div></form><div id="message" hidden></div></div></div><div class="helpbar">School accounts are by invitation only. If you have not been invited, contact the kitchen office.</div></div>';
 el('login-form').onsubmit=async ev=>{ev.preventDefault();const b=ev.submitter;b.disabled=true;const data=new FormData(ev.target);try{await login(String(data.get('email')).trim(),String(data.get('password')));await load()}catch(err){msg(err.message)}finally{b.disabled=false}};
 el('forgot').onclick=()=>{root.innerHTML='<div class="auth-wrap"><h1>Reset your password.</h1><p>Enter the email associated with your school account.</p><div class="panel"><div class="panel-body"><form id="reset-request"><label>Email</label><input type="email" name="email" required><button class="btn primary" style="margin-top:14px">Send recovery link</button></form><div id="message" hidden></div></div></div><button class="btn flat" id="back">Back to sign in</button></div>';el('back').onclick=loginPage;el('reset-request').onsubmit=async e=>{e.preventDefault();try{await requestPasswordRecovery(new FormData(e.target).get('email'));msg('Check your email for the recovery link.','success')}catch(err){msg(err.message)}}};
}
function newPassword(mode,token){
 root.innerHTML='<div class="auth-wrap"><div class="eyebrow">GATEWAYS / ACCOUNT ACTIVATION</div><h1>Choose a password.</h1><p>'+(mode==='invite'?'Your school invitation is ready.':'Complete your account recovery.')+'</p><section class="panel"><div class="panel-body"><form id="password-form"><div class="form-row"><label>Password, at least 12 characters</label><input type="password" name="password" minlength="12" autocomplete="new-password" required></div><div class="form-row"><label>Confirm password</label><input type="password" name="confirm" minlength="12" autocomplete="new-password" required></div><button class="btn primary">Activate account</button></form><div id="message" hidden></div></div></section></div>';
 el('password-form').onsubmit=async ev=>{ev.preventDefault();const f=new FormData(ev.target),pass=f.get('password');if(pass!==f.get('confirm'))return msg('Passwords must match');try{if(mode==='invite')await acceptInvite(token,pass);else await updateUser({password:pass});await load()}catch(err){msg(err.message)}};
}
async function load(){
 stopCamera();
 try{currentUser=await getUser()}catch{currentUser=null}
 if(!currentUser)return loginPage();
 try{profile=await api('me')}catch(err){root.innerHTML='<div class="auth-wrap"><h1>Activation pending.</h1><p class="muted">The Netlify Identity or database setup is incomplete. No student records have been accessed.</p><div class="error">'+safe(err.message)+'</div><button id="logout" class="btn">Sign out</button></div>';bindLogout();return}
 student?renderStudent():renderStaff();
}
function logoutButton(){return '<button id="logout" class="btn tiny">Sign out</button>'}
function bindLogout(){if(el('logout'))el('logout').onclick=async()=>{stopCamera();await logout();currentUser=null;profile=null;loginPage()}}
function renderStudent(){
 let s=profile?.student;
 if(!s||s.status!=='approved'){
 root.innerHTML='<div class="student-shell"><div class="eyebrow">GATEWAYS / STUDENT ACCESS</div><h1 style="font-size:35px;letter-spacing:-1px">School approval required.</h1><p class="muted">Your account must be linked to an approved school roster entry. Please contact the kitchen office.</p><div class="flex"><button id="retry" class="btn primary">Check approval</button>'+logoutButton()+'</div></div>';el('retry').onclick=load;bindLogout();return}
 root.innerHTML='<div class="student-shell"><div class="flex" style="justify-content:space-between"><span class="eyebrow">GATEWAYS / STUDENT PORTAL</span>'+logoutButton()+'</div><h1 style="font-size:36px;letter-spacing:-1.5px;margin:17px 0 5px">Lunch, on your time.</h1><p class="muted small">Your QR pass is yours alone.</p><nav class="student-tabs"><button data-tab="pass">My pass</button><button data-tab="menu">Weekly menu</button><button data-tab="profile">Profile</button></nav><div id="content"></div></div>';
 bindLogout();root.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{activeTab=b.dataset.tab;showStudent()});showStudent();
}
async function showStudent(){
 root.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===activeTab));
 const content=el('content'),s=profile.student;
 if(activeTab==='profile'){content.innerHTML='<div class="panel"><div class="panel-head"><h2>My verified profile</h2><span class="badge good">ACTIVE</span></div><div class="panel-body"><div class="listrow"><strong>Student</strong><span>'+safe(s.name)+'</span></div><div class="listrow"><strong>Grade</strong><span>'+safe(s.grade||'—')+'</span></div><div class="listrow"><strong>Lunch period</strong><span>'+safe(s.lunchPeriod)+'</span></div></div></div>';return}
 if(activeTab==='menu'){
 content.innerHTML='<div class="eyebrow">WHAT IS COOKING</div><h2 style="font-size:32px;letter-spacing:-1.3px;margin:9px 0">Good food. <span style="color:#c9213a">Good days.</span></h2><p class="muted small">Your lunch lineup for this week.</p><div class="panel"><div class="panel-body" id="menu-list"><div class="loader">Loading menu…</div></div></div>';
 try{const days=weekDays(),response=await api('menu?start='+days[0].iso),items=new Map((response.menus||[]).map(x=>[String(x.service_date).slice(0,10),x]));if(!el('menu-list'))return;el('menu-list').innerHTML=days.map(d=>{const meal=items.get(d.iso);return '<div class="menu-row"><div class="menu-day">'+d.name.slice(0,3).toUpperCase()+'<br>'+d.num+'</div><div><h3>'+safe(meal?.title||'Menu coming soon')+'</h3><p>'+safe(meal?.description||'Published by the kitchen when available.')+'</p></div></div>'}).join('')}catch(err){if(el('menu-list'))el('menu-list').innerHTML='<div class="error">'+safe(err.message)+'</div>'}return}
 content.innerHTML='<article class="pass"><div class="pass-top"><div class="line"><span>GATEWAYS / DIGITAL ID</span><span class="badge good">ACTIVE</span></div><div class="name">'+safe(s.name)+'</div><div class="period">'+safe(s.lunchPeriod)+' · School lunch</div></div><div class="qr-wrap"><div class="sub">Ready to scan</div><div id="qr" class="qr">Retrieving secure QR…</div><p class="pass-expire">New code generated automatically every 90 seconds</p></div><div class="pass-info"><span>LUNCH PERIOD <strong>'+safe(s.lunchPeriod)+'</strong></span><span>STATUS <strong>VERIFIED</strong></span></div></article><p class="tip">Your QR code is temporary and cannot be altered. Hold your phone in front of the cafeteria scanner.</p>';
 await refreshPass();
}
async function refreshPass(){
 if(activeTab!=='pass'||!student||!profile?.student||profile.student.status!=='approved'||!el('qr'))return;
 try{let pass=await api('pass');if(!el('qr')||activeTab!=='pass')return;if(window.KitchenQR&&window.KitchenQR.svg)el('qr').innerHTML=window.KitchenQR.svg(pass.token);else el('qr').textContent='QR renderer unavailable. Reload the page.'}catch(err){if(el('qr'))el('qr').textContent=err.message}
}
function renderStaff(){
 if(!profile?.staff){root.innerHTML='<div class="auth-wrap"><h1>Staff role required.</h1><p>Your school account does not have permission to view kitchen records.</p>'+logoutButton()+'</div>';bindLogout();return}
 root.innerHTML='<div class="staff-layout"><aside class="side"><p class="side-label">KITCHEN WORKSPACE</p><button data-section="overview" class="side-btn">Overview</button><button data-section="scan" class="side-btn">QR scanner</button><button data-section="roster" class="side-btn">Students</button><button data-section="menu" class="side-btn">Weekly menu</button><button data-section="correct" class="side-btn">Corrections</button></aside><div class="staff-main"><div class="flex" style="justify-content:flex-end;margin-bottom:16px">'+logoutButton()+'</div><div id="content"></div></div></div>';
 bindLogout();root.querySelectorAll('[data-section]').forEach(b=>b.onclick=()=>{stopCamera();activeTab=b.dataset.section;showStaff()});showStaff();
}
const head=(label,title,subtitle)=>'<div class="hero"><div><div class="eyebrow">'+safe(label)+'</div><h1>'+title+'</h1><p>'+safe(subtitle)+'</p></div></div>';
async function showStaff(){
 root.querySelectorAll('[data-section]').forEach(b=>b.classList.toggle('active',b.dataset.section===activeTab));
 let content=el('content');content.innerHTML='<div class="loader">Loading school records…</div>';
 try{
 if(activeTab==='overview'){
  const y=await api('stats'),c=y.counts;
  content.innerHTML=head('KITCHEN / TODAY','Lunch overview.','Records verified by the Netlify database.')+'<div class="metric-grid">'+[['ARRIVALS',c.arrival],['FIRST LUNCHES',c.lunch],['SECONDS',c.second],['TOTAL PLATES',c.totalPlates]].map(x=>'<div class="metric"><small>'+x[0]+'</small><strong>'+x[1]+'</strong></div>').join('')+'</div><section class="panel"><div class="panel-body"><h2>Ready for the next student?</h2><p class="muted small">Every scan is verified and stored centrally, not on this device.</p><button class="btn primary" id="scan-next">Open scanner ↗</button></div></section>';el('scan-next').onclick=()=>{activeTab='scan';showStaff()};
 }
 else if(activeTab==='scan'){
  content.innerHTML=head('KITCHEN / POINT OF SERVICE','Scan & serve.','Students present rotating, signed QR codes.')+'<div class="panel"><div class="panel-body"><label>Scan mode</label><select id="mode"><option value="lunch">First lunch</option><option value="second">Second serving</option><option value="arrival">Campus arrival</option></select><div class="scanbox"><h2>Ready when you are.</h2><p>Scan from the camera or compatible USB scanner.</p><form id="scan-form" class="scan-input"><input id="token" placeholder="Scan student QR here" autocomplete="off" required><button class="btn primary">Record</button></form><div class="flex" style="justify-content:center;margin:14px 0"><button id="camera-start" class="btn" type="button">Start camera</button><button id="camera-stop" class="btn" type="button" hidden>Stop camera</button></div><video id="camera" class="video" autoplay playsinline muted hidden></video></div><div id="message" hidden></div></div></div>';
  el('mode').value=scanMode;el('mode').onchange=ev=>scanMode=ev.target.value;el('scan-form').onsubmit=async ev=>{ev.preventDefault();await submitScan(el('token').value)};el('camera-start').onclick=startCamera;el('camera-stop').onclick=stopCamera;el('token').focus();
 }
 else if(activeTab==='roster'){
  const rows=(await api('roster')).students||[],admin=(currentUser.roles||[]).includes('gateways_admin');
  content.innerHTML=head('KITCHEN / SCHOOL ROSTER','Student directory.','Verified student records only.')+'<section class="panel"><div class="panel-head"><h2>School roster</h2><span class="badge neutral">'+rows.length+' students</span></div><div class="table-wrap"><table class="table"><thead><tr><th>Name</th><th>Student ID</th><th>Period</th><th>Account</th><th>Status</th></tr></thead><tbody>'+rows.map(r=>'<tr><td><strong>'+safe(r.full_name)+'</strong></td><td>'+safe(r.school_student_id)+'</td><td>'+safe(r.lunch_period)+'</td><td>'+(r.linked?'Linked':'Unlinked')+'</td><td>'+safe(r.status)+'</td></tr>').join('')+'</tbody></table></div></section>'+(admin?'<section class="panel" style="margin-top:15px"><div class="panel-head"><h2>Add verified student</h2></div><div class="panel-body"><form id="new-student" class="form-grid"><div><label>School-issued ID</label><input name="studentId" required></div><div><label>Full name</label><input name="name" required></div><div><label>Grade</label><input name="grade"></div><div><label>Lunch period</label><input name="lunchPeriod" required></div><button class="btn primary">Create pending record</button></form><div id="message" hidden></div></div></section><section class="panel" style="margin-top:15px"><div class="panel-head"><h2>Link verified school account</h2></div><div class="panel-body"><p class="muted small">Only link after confirming the Netlify Identity user matches the school student roster.</p><form id="approve"><div class="form-grid"><div><label>Roster record UUID</label><input name="id" required></div><div><label>Verified Identity user ID</label><input name="identityUserId" required></div><div><label>Status</label><select name="status"><option value="approved">Approved</option><option value="inactive">Inactive</option></select></div></div><button style="margin-top:15px" class="btn primary">Save link & status</button></form></div></section>':'');
  if(admin){el('new-student').onsubmit=async ev=>{ev.preventDefault();try{await api('roster','POST',Object.fromEntries(new FormData(ev.target)));showStaff()}catch(err){msg(err.message)}};el('approve').onsubmit=async ev=>{ev.preventDefault();try{await api('roster','PATCH',Object.fromEntries(new FormData(ev.target)));showStaff()}catch(err){msg(err.message)}}}
 }
 else if(activeTab==='menu'){
  const d=weekDays(),res=await api('menu?start='+d[0].iso),map=new Map((res.menus||[]).map(x=>[String(x.service_date).slice(0,10),x]));
  content.innerHTML=head('KITCHEN / FOOD PLANNING','Weekly menu.','Student menu updates are shared across devices.')+'<div class="panel"><div class="panel-body">'+d.map(x=>'<div class="listrow"><div><strong>'+x.name+'</strong><div class="muted small">'+safe(map.get(x.iso)?.title||'Not published')+'</div></div><span>'+safe(x.iso)+'</span></div>').join('')+'</div></div><section class="panel" style="margin-top:14px"><div class="panel-head"><h2>Publish a meal</h2></div><div class="panel-body"><form id="menu-form"><div class="form-grid"><div><label>Date</label><input name="date" type="date" value="'+d[0].iso+'" required></div><div><label>Meal</label><input name="title" required maxlength="160"></div></div><div class="form-row" style="margin-top:13px"><label>Description</label><textarea name="description" maxlength="500"></textarea></div><button class="btn primary">Publish menu</button></form><div id="message" hidden></div></div></section>';
  el('menu-form').onsubmit=async ev=>{ev.preventDefault();try{await api('menu','PUT',Object.fromEntries(new FormData(ev.target)));showStaff()}catch(err){msg(err.message)}};
 }
 else if(activeTab==='correct'){
  content.innerHTML=head('KITCHEN / AUDIT HISTORY','Correct a scan.','Original scan records are never silently deleted.')+'<section class="panel"><div class="panel-body"><form id="correct-form"><div class="form-row"><label>Original scan event number</label><input name="eventId" type="number" min="1" required></div><div class="form-row"><label>Reason, minimum 12 characters</label><textarea name="reason" minlength="12" maxlength="500" required></textarea></div><button class="btn primary">Record audited correction</button></form><div id="message" hidden></div></section>';
  el('correct-form').onsubmit=async ev=>{ev.preventDefault();try{await api('correct','POST',Object.fromEntries(new FormData(ev.target)));msg('Correction recorded.','success');ev.target.reset()}catch(err){msg(err.message)}};
 }
 }catch(err){content.innerHTML='<div class="error">'+safe(err.message)+'</div>'}
}
async function submitScan(token){
 if(scanBusy)return;scanBusy=true;
 try{let r=await api('scan','POST',{token:String(token||'').trim(),mode:scanMode});msg(r.student+' · '+(r.mode==='lunch'?'First lunch':r.mode==='second'?'Second serving':'Arrival')+' recorded.',true);if(el('token'))el('token').value='';stopCamera()}catch(err){msg(err.message)}finally{scanBusy=false}
}
async function startCamera(){
 if(activeCamera)return;
 try{
  const video=el('camera');activeCamera=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});video.srcObject=activeCamera;video.hidden=false;el('camera-start').hidden=true;el('camera-stop').hidden=false;await video.play();
  if('BarcodeDetector'in window)try{detector=new BarcodeDetector({formats:['qr_code']})}catch{}
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
  async function loop(){
   if(!activeCamera||!el('camera'))return;
   if(video.readyState>=2){
    try{
     let code;
     if(detector){code=(await detector.detect(video))[0]?.rawValue}
     else if(window.jsQR){canvas.width=video.videoWidth;canvas.height=video.videoHeight;ctx.drawImage(video,0,0);const pic=ctx.getImageData(0,0,canvas.width,canvas.height);code=window.jsQR(pic.data,pic.width,pic.height)?.data}
     if(code){await submitScan(code);return}
    }catch{}
   }
   cameraFrame=requestAnimationFrame(loop);
  }loop();
 }catch(err){msg('Camera unavailable: '+err.message);stopCamera()}
}
function stopCamera(){
 if(cameraFrame)cancelAnimationFrame(cameraFrame);cameraFrame=0;
 if(activeCamera){activeCamera.getTracks().forEach(t=>t.stop());activeCamera=null}
 if(el('camera')){el('camera').srcObject=null;el('camera').hidden=true}
 if(el('camera-start'))el('camera-start').hidden=false;
 if(el('camera-stop'))el('camera-stop').hidden=true;
 detector=null;
}
async function start(){
 try{const callback=await handleAuthCallback();if(callback?.type==='invite'&&callback.token)return newPassword('invite',callback.token);if(callback?.type==='recovery')return newPassword('recovery')}catch(err){root.innerHTML='<div class="auth-wrap"><div class="error">'+safe(err.message)+'</div></div>';return}
 try{await getSettings()}catch{}
 await load();
}
setInterval(()=>{if(student&&activeTab==='pass'&&currentUser&&profile?.student?.status==='approved')refreshPass()},85000);
window.addEventListener('pagehide',stopCamera);
start();
