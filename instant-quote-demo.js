(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const fmtMoney = n => (isFinite(n)? n : 0).toLocaleString(undefined,{style:'currency',currency:'USD'});
  const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));

  // DEMO pricing model (replace with client-specific logic in production)
  const BASE_RATE = {
    Standard: { standard: 3.25, premium: 4.10, designer: 5.10 },
    Premium:  { standard: 4.10, premium: 5.25, designer: 6.45 },
    "High-End":{ standard: 5.00, premium: 6.25, designer: 7.75 },
    Unsure:   { standard: 3.80, premium: 4.80, designer: 5.90 }
  };
  const PKG = { base: 0, plus: 0.35, max: 0.85 }; // add-on per sq ft (demo)
  const OPT = { demo1: 0.65, demo2: 250, demo3: 175 }; // demo items

  let step = 1, maxStep = 3, generated = false;

  const data = {
    name:'', email:'', phone:'', zip:'',
    service:'', roofType:'Premium', area:2400,
    pitch:1.00, stories:1.00,
    grade:'premium', under:'base',
    options:{ demo1:true, demo2:true, demo3:true, finance:false },
    notes:'', total:0, monthly:0, lineItems:[]
  };

  const prog = $('#iqProg'), stepLbl = $('#iqStepLabel');
  const title = $('#iqTitle'), desc = $('#iqDesc');
  const steps = $$('.iq-step');
  const nextBtn = $('#iqNextBtn'), backBtn = $('#iqBackBtn');
  const afterBox = $('#iqAfter');
  const lines = $('#iqLines'), grand = $('#iqGrand'), finNote = $('#iqFinance');
  const sArea = $('#iqArea'), sBub = $('#iqAreaBub');

  function setActiveChips(rootSel, val){
    $$(rootSel+' .iq-chip').forEach(c=>c.classList.toggle('active', c.dataset.val===val));
  }

  function bindChips(rootSel, key){
    const root = $(rootSel); if(!root) return;
    root.addEventListener('click', e=>{
      const chip = e.target.closest('.iq-chip'); if(!chip) return;
      setActiveChips(rootSel, chip.dataset.val);
      const v = chip.dataset.val;
      if(key === 'pitch' || key === 'stories') data[key] = parseFloat(v);
      else data[key] = v;

      if(['service','roofType','grade','under','pitch','stories'].includes(key)) calc();
    });
  }

  bindChips('#iqService','service');
  bindChips('#iqType','roofType');
  bindChips('#iqPitch','pitch');
  bindChips('#iqStories','stories');
  bindChips('#iqGrade','grade');
  bindChips('#iqUnder','under');

  $('#iqOpts').addEventListener('click', e=>{
    const t = e.target.closest('.iq-tile'); if(!t) return;
    const key = t.dataset.key;
    const ck  = t.querySelector('input');
    ck.checked = !ck.checked;
    t.classList.toggle('active', ck.checked);

    if(key === 'finance') data.options.finance = ck.checked;
    else data.options[key] = ck.checked;

    calc();
  });

  function showArea(){
    sBub.textContent = parseInt(sArea.value).toLocaleString()+' sf';
  }
  sArea.addEventListener('input', ()=>{ data.area=parseInt(sArea.value); showArea(); calc(); });
  showArea();

  [['iqName','name'],['iqEmail','email'],['iqPhone','phone'],['iqZip','zip'],['iqNotes','notes']]
    .forEach(([id,key])=>{ $('#'+id).addEventListener('input',e=>data[key]=e.target.value.trim()); });

  function showStep(n){
    step = clamp(n,1,maxStep);
    steps.forEach((s,i)=>s.classList.toggle('active', i===step-1));
    const pct = (step-1)/(maxStep-1);
    prog.style.transform = `scaleX(${pct})`;
    backBtn.disabled = step===1;

    nextBtn.textContent = step===maxStep ? (generated?'Regenerate Quote':'Generate Quote') : 'Next';
    stepLbl.textContent = step===maxStep && generated ? 'Quote ready' : `Step ${step} of ${maxStep}`;

    const t = ['Contact','Project','Options & Notes'];
    const d = [
      'We’ll attach the quote to you. Add an email if you want a copy.',
      'Quick selections to estimate your project.',
      'Choose options, add notes, and generate the quote.'
    ];
    title.textContent = t[step-1];
    desc.textContent = d[step-1];
  }

  function renderSummary(list,total,monthly,needsChoice){
    lines.innerHTML='';
    if(needsChoice){
      const row = document.createElement('div');
      row.className='iq-row';
      row.innerHTML = `<div>Select project type + material/system to see pricing.</div><div class="r"></div>`;
      lines.appendChild(row);
      grand.textContent='$0';
      finNote.hidden=true; finNote.textContent='';
      return;
    }
    list.forEach(li=>{
      const [label,qty,price] = li;
      const row = document.createElement('div');
      row.className='iq-row';
      row.innerHTML = `<div>${label}${qty?` · ${qty}`:''}</div><div class="r">${fmtMoney(price||0)}</div>`;
      lines.appendChild(row);
    });
    grand.textContent = fmtMoney(total||0);
    if(monthly){
      finNote.hidden=false;
      finNote.textContent = `Illustrative 12-mo plan: ~${fmtMoney(monthly)}/mo (OAC).`;
    } else {
      finNote.hidden=true; finNote.textContent='';
    }
  }

  function calc(){
    if(!data.service || !data.roofType || !data.grade){
      renderSummary([],0,null,true);
      return;
    }

    const eff = Math.round(data.area * data.pitch * data.stories);
    const baseRate = (BASE_RATE[data.roofType] || BASE_RATE.Unsure)[data.grade] || 4.5;
    const pkgAdd = PKG[data.under] || 0;

    let items=[];
    items.push([`Base system — ${data.service}`, eff.toLocaleString()+' sf', eff*(baseRate+pkgAdd)]);

    if(data.options.demo1) items.push(['Removal / haul-away','',eff*OPT.demo1]);
    if(data.options.demo2) items.push(['Disposal / dump fees','',OPT.demo2]);
    if(data.options.demo3) items.push(['Permits / admin','',OPT.demo3]);

    const sub = items.reduce((t,i)=>t+(+i[2]||0),0);
    const cont = sub * 0.03;
    const total = sub + cont;

    data.total = total;
    data.monthly = total/12;
    data.lineItems = [...items, ['Contingency (3%)','',cont]];

    renderSummary(data.lineItems,total,data.options.finance?data.monthly:null,false);
  }

  function canProceedStep(curr){
    if(curr===1) return ['name','phone','zip'].every(k => (data[k]||'').length);
    if(curr===2) return !!(data.service && data.roofType && data.area>=200);
    return true;
  }

  function validateOrToast(curr){
    if(canProceedStep(curr)) return true;
    alert(curr===1 ? 'Please complete your contact info.' : 'Please choose project type, material/system, and set an approximate size.');
    return false;
  }

  backBtn.addEventListener('click',()=>showStep(step-1));

  nextBtn.addEventListener('click',()=>{
    if(step<maxStep){
      if(!validateOrToast(step)) return;
      showStep(step+1); return;
    }
    if(!validateOrToast(2)) { showStep(2); return; }

    calc();
    generated = true;

    afterBox.classList.add('show');
    backBtn.disabled = true;
    nextBtn.textContent = 'Regenerate Quote';
    stepLbl.textContent = 'Quote ready';
  });

  // Copy summary
  $('#iqCopyBtn').addEventListener('click', ()=>{
    if(!generated){ alert('Generate your quote first.'); return; }
    const eff = Math.round(data.area*data.pitch*data.stories).toLocaleString();
    const li = (data.lineItems||[]).map(l=>`- ${l[0]} ${l[1]?'('+l[1]+')':''}: ${fmtMoney(l[2]||0)}`).join('\n');
    const text =
`BIM Labs Instant Quote (Demo)
Name: ${data.name}
Email: ${data.email||'(not provided)'}
Phone: ${data.phone}
ZIP: ${data.zip}

Project: ${data.service}
System: ${data.roofType} (${data.grade})
Approx size: ~${eff} sf
${data.notes?`Notes: ${data.notes}\n`:''}
Line Items:
${li}

TOTAL: ${fmtMoney(data.total)}
${data.options.finance?`12-mo est: ~${fmtMoney(data.total/12)}/mo (OAC)`:''}

Ballpark estimate only. Final price confirmed after on-site assessment.`;

    navigator.clipboard?.writeText(text)
      .then(()=>alert('Summary copied.'))
      .catch(()=>alert('Could not copy.'));
  });

  // Schedule button (replace with your actual Calendly link)
  $('#iqScheduleBtn').addEventListener('click', ()=>{
    if(!generated){ alert('Generate your quote first.'); return; }

    // Replace with your real scheduling URL
    const CAL_URL = "YOUR_CALENDLY_LINK";

    // Optionally pass name/email/phone via query params if your scheduler supports it
    const url = CAL_URL
      .replace("{{name}}", encodeURIComponent(data.name||""))
      .replace("{{email}}", encodeURIComponent(data.email||""))
      .replace("{{phone}}", encodeURIComponent(data.phone||""));

    window.open(url, "_blank", "noopener");
  });

  // PDF (with safe logo fallback)
  $('#iqPdfBtn').addEventListener('click', async ()=>{
    if(!generated){ alert('Generate your quote first.'); return; }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({unit:'pt',format:'letter'});
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const pad = 42, lh = 18;
    let y = pad;

    // Header band
    doc.setFillColor('#0B5FFF');
    doc.rect(0,0,W,78,'F');

    // Try to load logo from same domain (avoid CORS issues)
    const logoUrl = '/images/bimlabs-logo.png';
    const logo = new Image();
    logo.src = logoUrl;

    await new Promise(r => { logo.onload = r; logo.onerror = r; });

    doc.setTextColor('#fff');
    doc.setFont('helvetica','bold');
    doc.setFontSize(14);

    // If logo loads, place it; otherwise text fallback
    try{
      if(logo.naturalWidth && logo.naturalHeight){
        const maxW = 180, maxH = 48;
        const ratio = logo.naturalWidth / logo.naturalHeight;
        let drawW = maxW, drawH = drawW / ratio;
        if(drawH > maxH){ drawH = maxH; drawW = drawH * ratio; }
        doc.addImage(logo, 'PNG', 42, 18, drawW, drawH);
      } else {
        doc.text('BIM Labs', 42, 46);
      }
    } catch(e){
      doc.text('BIM Labs', 42, 46);
    }

    doc.text('INSTANT QUOTE (DEMO)', W-42, 28, {align:'right'});
    doc.setFont('helvetica','normal');
    doc.setFontSize(10);
    doc.text('Built by BIM Labs — branded + installed for contractors', W-42, 44, {align:'right'});
    doc.text('Ballpark estimate only • Final price confirmed after on-site assessment', W-42, 58, {align:'right'});

    // Body
    y = 98;
    const section = (t)=>{
      doc.setTextColor('#0b1423');
      doc.setFont('helvetica','bold');
      doc.setFontSize(12);
      doc.text(t,pad,y);
      y += lh;
      doc.setFont('helvetica','normal');
    };

    section('Customer');
    doc.text(`${data.name||''}`, pad, y); y+=lh;
    doc.text(`${data.email||''}  |  ${data.phone||''}`, pad, y); y+=lh;
    doc.text(`ZIP: ${data.zip||''}`, pad, y); y+=lh+6;

    section('Project');
    const eff = Math.round(data.area*data.pitch*data.stories).toLocaleString();
    doc.text(`${data.service||''}  •  ${data.roofType||''} (${data.grade||''})`, pad, y); y+=lh;
    doc.text(`Approx. size: ~${eff} sf`, pad, y); y+=lh;
    if(data.notes){ doc.text(`Notes: ${String(data.notes).substring(0,140)}`, pad, y); y+=lh; }
    y+=6;

    section('Line Items');
    const left=pad, right=W-pad, qtyX=W*0.64, amtX=right;
    doc.setFont('helvetica','bold');
    doc.text('Description', left, y);
    doc.text('Qty', qtyX, y, {align:'right'});
    doc.text('Amount', amtX, y, {align:'right'});
    y+=lh-4;
    doc.setDrawColor('#e7edf5');
    doc.line(left,y,right,y);
    y+=10;
    doc.setFont('helvetica','normal');

    (data.lineItems||[]).forEach(li=>{
      const [label,qty,price]=li;
      const val = typeof price==='number'?price:parseFloat(String(price).replace(/[^0-9.]/g,''))||0;
      doc.text(String(label||''), left, y);
      if(qty) doc.text(String(qty), qtyX, y, {align:'right'});
      doc.text(fmtMoney(val), amtX, y, {align:'right'});
      y+=lh;
      if(y>H-150){ doc.addPage(); y=pad; }
    });

    y+=6;
    doc.setDrawColor('#e7edf5');
    doc.line(left,y,right,y);
    y+=lh;

    doc.setFont('helvetica','bold');
    doc.setFontSize(14);
    doc.text('TOTAL', left, y);
    doc.text(fmtMoney(data.total||0), amtX, y, {align:'right'});
    y+=lh+6;

    if(data.options?.finance){
      doc.setFont('helvetica','normal');
      doc.setFontSize(10);
      doc.text(`Illustrative 12-month plan: ~${fmtMoney((data.total||0)/12)}/mo (OAC).`, left, y);
      y+=lh+4;
    }

    doc.setFont('helvetica','normal');
    doc.setFontSize(10);
    doc.text('Ballpark estimate only. Final price confirmed after on-site assessment.', pad, y);

    doc.setFillColor('#0b1220');
    doc.rect(0, H-10, W, 10,'F');

    doc.save(`BIMLabs_QuoteDemo_${(data.name||'Customer').replace(/\s+/g,'_')}.pdf`);
  });

  // Email modal (save only)
  const emailModal = $('#emailModal');
  const emailSave  = $('#emailSave');
  const emailCancel= $('#emailCancel');
  const sendTo     = $('#sendTo');

  $('#iqEmailBtn').addEventListener('click', ()=>{
    if(!generated){ alert('Generate your quote first.'); return; }
    sendTo.value = data.email || '';
    emailModal.style.display='flex';
    sendTo.focus();
  });

  emailCancel.addEventListener('click', ()=> emailModal.style.display='none');

  emailSave.addEventListener('click', ()=>{
    const val = (sendTo.value||'').trim();
    if(val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)){
      alert('Please enter a valid email.');
      return;
    }
    data.email = val;
    emailModal.style.display='none';
    alert(val ? 'Email saved to the quote.' : 'Email cleared.');
  });

  // Init
  calc();
  showStep(1);
})();
