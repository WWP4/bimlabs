import {getUser,signup,login,logout,getSettings,handleAuthCallback,acceptInvite,requestPasswordRecovery,updateUser} from '@netlify/identity';
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
 const signUpLink=student?'<div class="helpbar">New to Gateways? <button id="create-link" type="button" class="btn tiny primary">Create student account</button><p class="small" style="margin:8px 0 0">Students register themselves. The school reviews each application before enabling a QR lunch pass.</p></div>':'<div class="helpbar">Staff accounts are created by a Gateways school administrator.</div>';
 root.innerHTML='<div class="auth-wrap"><div class="eyebrow">GATEWAYS / '+(student?'STUDENT':'KITCHEN')+' PORTAL</div><h1>Welcome back.</h1><p>Sign in with your Gateways account.</p><section class="panel"><div class="panel-body"><form id="login-form"><div class="form-row"><label for="login-email">Email address</label><input id="login-email" name="email" type="email" autocomplete="username" required></div><div class="form-row"><label for="login-password">Password</label><input id="login-password" name="password" type="password" autocomplete="current-password" required></div><div class="form-actions"><button class="btn primary" type="submit">Sign in</button><button class="btn flat" type="button" id="forgot">Forgot password?</button></div></form><div id="message" hidden></div></div></section>'+signUpLink+'</div>';
 el('login-form').onsubmit=async ev=>{ev.preventDefault();const b=ev.submitter;b.disabled=true;const data=new FormData(ev.target);try{await login(String(data.get('email')).trim(),String(data.get('password')));await load()}catch(err){msg(err.message)}finally{b.disabled=false}};
 if(el('create-link'))el('create-link').onclick=signupPage;
 el('forgot').onclick=()=>{
  root.innerHTML='<div class="auth-wrap"><div class="eyebrow">GATEWAYS / PASSWORD RECOVERY</div><h1>Reset your password.</h1><p>Enter the email associated with your account.</p><section class="panel"><div class="panel-body"><form id="reset-request"><div class="form-row"><label>Email address</label><input type="email" name="email" autocomplete="email" required></div><button type="submit" class="btn primary">Send recovery email</button></form><div id="message" hidden></div></div></section><button class="btn flat" id="back">Back to sign in</button></div>';
  el('back').onclick=loginPage;
  el('reset-request').onsubmit=async e=>{e.preventDefault();try{await requestPasswordRecovery(new FormData(e.target).get('email'));msg('Check your email for the recovery link.',true)}catch(err){msg(err.message)}};
 };
}
function signupPage(){
 if(!student){loginPage();return}
 root.innerHTML='<div class="auth-wrap"><div class="eyebrow">GATEWAYS / NEW STUDENT</div><h1>Create your account.</h1><p>One short form. You will receive an email to verify your account, and the school will approve your lunch pass.</p><section class="panel"><div class="panel-body"><form id="register-form"><div class="form-row"><label for="register-name">Student full name</label><input id="register-name" name="name" autocomplete="name" maxlength="100" required placeholder="First and last name"></div><div class="form-grid"><div><label for="register-grade">Grade</label><select name="grade" id="register-grade" required><option value="">Choose grade</option>'+['K','1','2','3','4','5','6','7','8','9','10','11','12'].map(x=>'<option value="'+x+'">'+(x==='K'?'Kindergarten':'Grade '+x)+'</option>').join('')+'</select></div><div><label for="register-period">Lunch period</label><select name="lunchPeriod" id="register-period" required><option value="">Choose lunch</option><option value="Lunch A">Lunch A</option><option value="Lunch B">Lunch B</option><option value="Lunch C">Lunch C</option></select></div></div><div class="form-row" style="margin-top:14px"><label for="register-email">Email address</label><input id="register-email" name="email" type="email" autocomplete="email" maxlength="200" required></div><div class="form-row"><label for="register-password">Create password (12+ characters)</label><input id="register-password" name="password" type="password" minlength="12" autocomplete="new-password" required></div><button class="btn primary" type="submit" style="width:100%">Create account</button></form><div id="message" hidden></div></div></section><div class="helpbar">Your information is used only to request a school lunch pass. A school administrator must verify your enrollment before your QR code is activated.</div><button class="btn flat" id="back-login">Already have an account? Sign in</button></div>';
 el('back-login').onclick=loginPage;
 el('register-form').onsubmit=async ev=>{
  ev.preventDefault();const button=ev.submitter;button.disabled=true;
  const f=new FormData(ev.target),name=String(f.get('name')||'').trim(),grade=String(f.get('grade')||''),lunchPeriod=String(f.get('lunchPeriod')||''),email=String(f.get('email')||'').trim().toLowerCase(),password=String(f.get('password')||'');
  if(name.length<2||!grade||!lunchPeriod||password.length<12){msg('Please complete your name, grade, lunch period, and password.');button.disabled=false;return}
  try{
   // Metadata is stored in the Identity account to avoid retyping the same
   // school details after clicking the email confirmation link.
   await signup(email,password,{full_name:name,grade,lunchPeriod});
   const possibleUser=await getUser().catch(()=>null);
   if(possibleUser){await load();return}
   root.innerHTML='<div class="auth-wrap"><div class="eyebrow">GATEWAYS / EMAIL CONFIRMATION</div><h1>Check your email.</h1><p>We sent a verification link to <strong>'+safe(email)+'</strong>. Open it to finish setting up your account.</p><section class="panel"><div class="panel-body"><span class="badge good">ACCOUNT REQUESTED</span><h2 style="margin:16px 0 8px">You’re almost done.</h2><p class="small muted">Once you verify your email, Gateways can send your application to the kitchen staff for review. You’ll only receive a working QR pass after approval.</p><button class="btn primary" id="go-signin" style="margin-top:12px">Go to sign in</button></div></section></div>';
   el('go-signin').onclick=loginPage;
  }catch(err){msg(err.message)}
  finally{button.disabled=false}
 };
}
function selfDetails(){
 const metadata=currentUser?.userMetadata||currentUser?.user_metadata||{};
 return {name:String(metadata.full_name||metadata.fullName||'').trim(),
  grade:String(metadata.grade||'').trim(),
  lunchPeriod:String(metadata.lunchPeriod||metadata.lunch_period||'').trim()};
}
function completeApplication(){
 const d=selfDetails();
 root.innerHTML='<div class="student-shell"><div class="eyebrow">GATEWAYS / LAST STEP</div><h1 style="font-size:34px;letter-spacing:-1px;margin:14px 0">Finish your lunch pass request.</h1><p class="small muted">Your email is verified. Confirm these details so the kitchen can review your application.</p><section class="panel"><div class="panel-body"><form id="application-form"><div class="form-row"><label>Full name</label><input name="name" maxlength="100" autocomplete="name" value="'+safe(d.name)+'" required></div><div class="form-grid"><div><label>Grade</label><select name="grade" required><option value="">Choose grade</option>'+['K','1','2','3','4','5','6','7','8','9','10','11','12'].map(x=>'<option value="'+x+'"'+(d.grade===x?' selected':'')+'>'+x+'</option>').join('')+'</select></div><div><label>Lunch period</label><select name="lunchPeriod" required><option value="">Choose lunch</option>'+['Lunch A','Lunch B','Lunch C'].map(x=>'<option'+(d.lunchPeriod===x?' selected':'')+'>'+x+'</option>').join('')+'</select></div></div><button class="btn primary" style="width:100%;margin-top:18px">Submit application</button></form><div id="message" hidden></div></div></section><p class="small muted">Applications require school approval. No meal history or plate counts will be visible to students.</p><div class="flex">'+logoutButton()+'</div></div>';
 bindLogout();
 el('application-form').onsubmit=async ev=>{ev.preventDefault();const b=ev.submitter;b.disabled=true;try{await api('apply','POST',Object.fromEntries(new FormData(ev.target)));await load()}catch(err){msg(err.message)}finally{b.disabled=false}};
}
function newPassword(mode,token){
 root.innerHTML='<div class="auth-wrap"><div class="eyebrow">GATEWAYS / ACCOUNT ACTIVATION</div><h1>Choose a password.</h1><p>'+(mode==='invite'?'Your school invitation is ready.':'Complete your account recovery.')+'</p><section class="panel"><div class="panel-body"><form id="password-form"><div class="form-row"><label>Password, at least 12 characters</label><input type="password" name="password" minlength="12" autocomplete="new-password" required></div><div class="form-row"><label>Confirm password</label><input type="password" name="confirm" minlength="12" autocomplete="new-password" required></div><button class="btn primary">Activate account</button></form><div id="message" hidden></div></div></section></div>';
 el('password-form').onsubmit=async ev=>{ev.preventDefault();const f=new FormData(ev.target),pass=f.get('password');if(pass!==f.get('confirm'))return msg('Passwords must match');try{if(mode==='invite')await acceptInvite(token,pass);else await updateUser({password:pass});await load()}catch(err){msg(err.message)}};
}
async function load(){
 stopCamera();
 try{currentUser=await getUser()}catch{currentUser=null}
 if(!currentUser)return loginPage();
 try{
  if(student){
   const my=await api('me');
   if(my.account==='unlinked'){
    const d=selfDetails();
    if(d.name.length>=2&&d.grade&&['Lunch A','Lunch B','Lunch C'].includes(d.lunchPeriod)){
     try{await api('apply','POST',d)}catch(err){console.warn('Automatic application submission not completed',err.message)}
    }
   }
  }
 }catch{}
 try{profile=await api('me')}catch(err){root.innerHTML='<div class="auth-wrap"><h1>Activation pending.</h1><p class="muted">The Netlify Identity or database setup is incomplete. No student records have been accessed.</p><div class="error">'+safe(err.message)+'</div><button id="logout" class="btn">Sign out</button></div>';bindLogout();return}
 student?renderStudent():renderStaff();
}
function logoutButton(){return '<button id="logout" class="btn tiny">Sign out</button>'}
function bindLogout(){if(el('logout'))el('logout').onclick=async()=>{stopCamera();await logout();currentUser=null;profile=null;loginPage()}}
function renderStudent(){
 let s=profile?.student;
 if(!s){completeApplication();return}
 if(s.status!=='approved'){
  root.innerHTML='<div class="student-shell"><div class="eyebrow">GATEWAYS / APPLICATION STATUS</div><h1 style="font-size:35px;letter-spacing:-1px;margin:14px 0">Application received.</h1><p class="small muted">Your information has been sent to the Gateways kitchen staff.</p><section class="panel"><div class="panel-body"><span class="badge neutral">'+(s.status==='pending'?'WAITING FOR APPROVAL':'NOT ACTIVE')+'</span><h2 style="margin:16px 0 8px">'+(s.status==='pending'?'Your lunch pass is under review.':'Please contact the school office.')+'</h2><p class="small muted">Name: '+safe(s.name)+'<br>Grade: '+safe(s.grade)+'<br>Lunch period: '+safe(s.lunchPeriod)+'</p><p class="small muted">Once the school verifies your enrollment, your QR pass becomes available in this account.</p><button id="retry" class="btn primary" type="button">Check status</button></div></section><div class="flex" style="margin-top:16px">'+logoutButton()+'</div></div>';
  el('retry').onclick=load;bindLogout();return;
 }
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
  const rows=(await api('roster')).students||[];
  const isAdmin=(currentUser.roles||[]).includes('gateways_admin');
  const pending=rows.filter(x=>x.status==='pending'),others=rows.filter(x=>x.status!=='pending');
  const renderRow=(r,canReview)=>'<div class="listrow" style="align-items:flex-start"><div style="min-width:0;flex:1"><strong>'+safe(r.full_name)+'</strong><div class="small muted">'+safe(r.account_email||'No email linked')+' · Grade '+safe(r.grade||'—')+' · '+safe(r.lunch_period)+'</div><div class="small muted">Account: '+(r.linked?'Verified email linked':'Not linked')+'</div></div><div style="display:flex;align-items:flex-end;flex-direction:column;gap:7px"><span class="badge '+(r.status==='approved'?'good':'neutral')+'">'+safe(r.status.toUpperCase())+'</span>'+(canReview&&r.linked?'<div class="flex"><button type="button" class="btn tiny primary" data-approve="'+safe(r.id)+'">Approve</button><button type="button" class="btn tiny" data-decline="'+safe(r.id)+'">Decline</button></div>':'')+'</div></div>';
  content.innerHTML=head('GATEWAYS / STUDENT APPLICATIONS','Student signups.','Students create their own accounts. Review each application before QR access is activated.')
   +'<section class="panel"><div class="panel-head"><h2>Awaiting approval</h2><span class="badge">'+pending.length+' PENDING</span></div><div class="panel-body">'+(pending.length?pending.map(x=>renderRow(x,isAdmin)).join(''):'<p class="small muted">No pending applications. When students register, their accounts appear here automatically.</p>')+'</div></section>'
   +'<section class="panel" style="margin-top:14px"><div class="panel-head"><h2>Registered students</h2><span class="badge neutral">'+others.length+' RECORDS</span></div><div class="panel-body">'+(others.length?others.map(x=>renderRow(x,false)).join(''):'<p class="small muted">No approved students yet.</p>')+'</div></section>'
   +(isAdmin?'<div id="message" hidden></div>':'<div class="notice">Only school administrators can approve applications.</div>');
  if(isAdmin){
   const decide=async(id,status)=>{
    const prompt=status==='approved'?'Approve this student after verifying their enrollment?':'Mark this application inactive?';
    if(!window.confirm(prompt))return;
    try{await api('roster','PATCH',{id,status});await showStaff()}catch(err){msg(err.message)}
   };
   content.querySelectorAll('[data-approve]').forEach(b=>b.onclick=()=>decide(b.dataset.approve,'approved'));
   content.querySelectorAll('[data-decline]').forEach(b=>b.onclick=()=>decide(b.dataset.decline,'inactive'));
  }
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
