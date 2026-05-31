/* ============================================================
   app.js — UI wiring + rendering + print
   ============================================================ */
const $ = (id)=>document.getElementById(id);
const els = {
  subject:$('subject'), type:$('type'), grade:$('grade'), difficulty:$('difficulty'),
  digits:$('digits'), digitField:$('digitField'), count:$('count'), countHint:$('countHint'),
  seed:$('seed'), answerKey:$('answerKey'), title:$('title'), showName:$('showName'),
  theme:$('theme'), themeOn:$('themeOn'),
  generate:$('generate'), print:$('print'), seedInfo:$('seedInfo'), sheet:$('sheet'),
};

/* ---------- merge STEM add-on (stem.js self-registered onto window) ---------- */
(function mergeSTEM(){
  if(!window.WS) return;
  if(window.WS.GENERATORS_STEM) Object.assign(window.WS.GENERATORS, window.WS.GENERATORS_STEM);
  if(window.STEM_META) Object.assign(window.WS.TYPE_META, window.STEM_META);
  if(window.WS.SUBJECTS) window.WS.SUBJECTS.stem = 'STEM';
})();

/* ---------- populate Fun theme dropdown ---------- */
(function populateThemes(){
  if(els.theme && window.THEMES && window.THEMES.list){
    els.theme.innerHTML = window.THEMES.list
      .map(t=>`<option value="${t.id}">${t.emoji?t.emoji+' ':''}${t.label}</option>`).join('');
  }
})();

const META = ()=>window.WS.TYPE_META;
const STACK = new Set(['addition','subtraction','multiplication','division','longmult']);

/* ---------- populate type dropdown by subject + grade ---------- */
function populateTypes(){
  const subject=els.subject.value, grade=Number(els.grade.value);
  const meta=META();
  const groups={};
  for(const [key,m] of Object.entries(meta)){
    if(m.subject!==subject) continue;
    if(!m.grades.includes(grade)) continue;
    (groups[m.group] ||= []).push([key,m.label]);
  }
  const prev=els.type.value;
  els.type.innerHTML='';
  for(const [group,items] of Object.entries(groups)){
    const og=document.createElement('optgroup'); og.label=group;
    for(const [key,label] of items){ const o=document.createElement('option'); o.value=key; o.textContent=label; og.appendChild(o); }
    els.type.appendChild(og);
  }
  // keep selection if still valid
  if([...els.type.options].some(o=>o.value===prev)) els.type.value=prev;
  if(!els.type.value && els.type.options.length) els.type.selectedIndex=0;
}

/* ---------- options ---------- */
function readOpts(){
  const type=els.type.value;
  return {
    type, subject:els.subject.value, grade:els.grade.value, difficulty:els.difficulty.value,
    digits:els.digits.value,
    count:Math.max(1,Math.min(120,Number(els.count.value)||1)),
    seed:(els.seed.value.trim() || Math.floor(Math.random()*1e9).toString()),
    answerKey:els.answerKey.checked, title:els.title.value.trim(), showName:els.showName.checked,
    theme:els.theme?els.theme.value:'none', themeOn:els.themeOn?els.themeOn.checked:false,
  };
}
function syncControls(){
  const m=META()[els.type.value]; if(!m) return;
  els.digitField.style.display = (m.digits && Number(els.grade.value)>=2) ? '' : 'none';
  els.countHint.textContent = m.layout==='passage' ? 'Reading uses one passage per page.'
    : `Default ${m.defaultCount} for this type.`;
}
function applyDefaultCount(){ const m=META()[els.type.value]; if(m) els.count.value=m.defaultCount; }

/* ---------- DOM helpers ---------- */
function el(tag,cls,html){const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e;}
function fracHTML(n,d){return `<span class="frac"><span class="fn">${n}</span><span class="fd">${d}</span></span>`;}

/* ---------- columns ---------- */
function columnsFor(type,count){
  if(STACK.has(type)){ if(type==='longmult')return count<=12?4:5; if(count<=24)return 4; if(count<=48)return 6; return 8; }
  const m=META()[type];
  switch(m.layout){
    case 'inline': return type==='measurement'?3:(count<=20?4:5);
    case 'fraction': return count<=12?3:4;
    case 'clock': return 4;
    case 'factfamily': return 3;
    case 'longdiv': return count<=9?3:4;
    case 'geometry': return 3;
    case 'patterns': return 2;
    default: return 2; // block
  }
}

/* ============================================================
   RENDERERS
   ============================================================ */
function renderStack(probs,type,showAns){
  const wrap=el('div','grid'); wrap.style.gridTemplateColumns=`repeat(${columnsFor(type,probs.length)},1fr)`;
  probs.forEach((p,i)=>{
    const c=el('div','prob'); c.appendChild(el('span','pnum',(i+1)+'.'));
    const stack=el('div','stack');
    stack.appendChild(el('div',null,String(p.a)));
    stack.appendChild(el('div','op-row',`<span class="op">${p.op}</span><span>${p.b}</span>`));
    stack.appendChild(el('div','rule'));
    let ans=''; if(showAns) ans=(type==='division'&&p.remainder)?`${p.answer} r${p.remainder}`:String(p.answer);
    stack.appendChild(el('div','ans',ans)); c.appendChild(stack); wrap.appendChild(c);
  }); return wrap;
}
function renderLongDiv(probs,showAns){
  const wrap=el('div','grid'); wrap.style.gridTemplateColumns=`repeat(${columnsFor('longdiv',probs.length)},1fr)`;
  probs.forEach((p,i)=>{
    const c=el('div','prob ld'); c.appendChild(el('span','pnum',(i+1)+'.'));
    const house=el('div','divhouse');
    house.innerHTML=`<span class="divisor">${p.divisor}</span><span class="house">${showAns?'<span class="ld-ans">'+p.answer+'</span>':''}<span class="dividend">${p.dividend}</span></span>`;
    c.appendChild(house); wrap.appendChild(c);
  }); return wrap;
}
function renderInline(probs,type,showAns){
  const wrap=el('div','inline-grid'); wrap.style.gridTemplateColumns=`repeat(${columnsFor(type,probs.length)},1fr)`;
  probs.forEach((p,i)=>{
    const c=el('div','inline-prob');
    c.appendChild(el('span','pnum',(i+1)+'.'));
    if(p.left!==undefined){ // comparison
      c.appendChild(el('span',null,p.left));
      c.appendChild(el('span','box',showAns?p.answer:''));
      c.appendChild(el('span',null,p.right));
    } else if(type==='measurement'||type==='decimals'){
      const q=showAns? p.q.replace('___',`<b class="ansblue">${p.answer}</b>`)
                     : p.q;
      const tail = (showAns||p.q.includes('___'))?'':` <span class="box">${showAns?p.answer:''}</span>`;
      c.appendChild(el('span',null,q+ (p.q.includes('___')?'':(showAns?` = <b class="ansblue">${p.answer}</b>`:' ______'))));
    } else { // plurals, contractions
      c.appendChild(el('span',null,p.q));
      c.appendChild(el('span','box wide',showAns?p.answer:''));
    }
    wrap.appendChild(c);
  }); return wrap;
}
function renderBlocks(probs,type,showAns){
  const wrap=el('div','block-grid'); wrap.style.gridTemplateColumns=`repeat(${columnsFor(type,probs.length)},1fr)`;
  probs.forEach((p,i)=>{
    const c=el('div','block');
    c.appendChild(el('div',null,`<span class="pnum">${i+1}.</span>${p.q}`));
    const work=el('div','work');
    work.innerHTML = showAns?`Answer: <span class="ans">${p.answer}</span>`:'Answer: __________';
    c.appendChild(work); wrap.appendChild(c);
  }); return wrap;
}
function renderFactFamily(probs,showAns){
  const wrap=el('div','block-grid'); wrap.style.gridTemplateColumns=`repeat(${columnsFor('factfamily',probs.length)},1fr)`;
  probs.forEach((p,i)=>{
    const c=el('div','block');
    c.appendChild(el('div',null,`<span class="pnum">${i+1}.</span> Numbers: <b>${p.numbers.join(', ')}</b> <small>(${p.type})</small>`));
    const work=el('div','work');
    work.innerHTML = showAns? p.family.map(f=>`<span class="ans">${f}</span>`).join('<br>')
      : ['___ ___ ___ = ___','___ ___ ___ = ___','___ ___ ___ = ___','___ ___ ___ = ___'].join('<br>');
    c.appendChild(work); wrap.appendChild(c);
  }); return wrap;
}
/* fractions */
function renderFractions(probs,showAns){
  const wrap=el('div','frac-grid'); wrap.style.gridTemplateColumns=`repeat(${columnsFor('fractions',probs.length)},1fr)`;
  probs.forEach((p,i)=>{
    const c=el('div','frac-cell'); c.appendChild(el('span','pnum',(i+1)+'.'));
    const body=el('div','frac-body');
    if(p.render==='identify'){
      // partitioned bar
      let bar='<svg viewBox="0 0 160 30" class="fbar">';
      const w=160/p.den;
      for(let k=0;k<p.den;k++){ bar+=`<rect x="${k*w}" y="0" width="${w}" height="28" fill="${k<p.num?'#bfdbfe':'#fff'}" stroke="#1f2733"/>`; }
      bar+='</svg>';
      body.innerHTML=`${bar}<div class="fq">What fraction is shaded? ${showAns?'<b class="ansblue">'+p.answer+'</b>':'<span class="blank"></span>'}</div>`;
    } else if(p.render==='equiv'){
      body.innerHTML=`<div class="frow">${fracHTML(p.n1,p.d1)} <span class="feq">=</span> ${fracHTML(showAns?p.answer:'?',p.d2)}</div>`;
      if(!showAns) body.querySelector('.fn').classList.add('blankbox');
    } else if(p.render==='compare'){
      body.innerHTML=`<div class="frow">${fracHTML(p.n1,p.d1)} <span class="box">${showAns?p.answer:''}</span> ${fracHTML(p.n2,p.d2)}</div>`;
    } else if(p.render==='arith'){
      body.innerHTML=`<div class="frow">${fracHTML(p.n1,p.d1)} <span class="fop">${p.op}</span> ${fracHTML(p.n2,p.d2)} <span class="feq">=</span> ${showAns?'<b class="ansblue">'+p.answer+'</b>':'<span class="blank"></span>'}</div>`;
    } else if(p.render==='multw'){
      body.innerHTML=`<div class="frow"><b>${p.whole}</b> <span class="fop">×</span> ${fracHTML(p.n1,p.d1)} <span class="feq">=</span> ${showAns?'<b class="ansblue">'+p.answer+'</b>':'<span class="blank"></span>'}</div>`;
    }
    c.appendChild(body); wrap.appendChild(c);
  }); return wrap;
}
/* patterns / input-output tables */
function renderPatterns(probs,showAns){
  const wrap=el('div','block-grid'); wrap.style.gridTemplateColumns=`repeat(${columnsFor('patterns',probs.length)},1fr)`;
  probs.forEach((p,i)=>{
    const c=el('div','block');
    const showRule = p.ask==='fill';
    c.appendChild(el('div',null,`<span class="pnum">${i+1}.</span> Rule: <b>${showRule||showAns?('Input '+p.rule):'?'}</b>`));
    let t='<table class="iotable"><tr><th>In</th>'+p.inputs.map(x=>`<td>${x}</td>`).join('')+'</tr>';
    t+='<tr><th>Out</th>'+p.outputs.map(o=>`<td>${showAns?('<b class="ansblue">'+o+'</b>'):(p.ask==='rule'?o:'')}</td>`).join('')+'</tr></table>';
    c.appendChild(el('div','work',t));
    if(p.ask==='rule'&&!showAns) c.appendChild(el('div','work','Rule: __________'));
    if(p.ask==='rule'&&showAns) c.appendChild(el('div','work',`Rule: <span class="ans">Input ${p.rule}</span>`));
    wrap.appendChild(c);
  }); return wrap;
}
/* geometry */
function shapeSVG(p){
  if(p.shape==='rect'){
    return `<svg viewBox="0 0 140 90" class="shp">
      <rect x="20" y="20" width="100" height="50" fill="#eff6ff" stroke="#1f2733" stroke-width="2"/>
      <text x="70" y="15" font-size="11" text-anchor="middle">${p.l} units</text>
      <text x="128" y="48" font-size="11" text-anchor="middle" transform="rotate(90 128 48)">${p.w} units</text></svg>`;
  }
  if(p.shape==='triangle'){
    return `<svg viewBox="0 0 140 100" class="shp">
      <polygon points="20,80 120,80 40,20" fill="#eff6ff" stroke="#1f2733" stroke-width="2"/>
      <line x1="40" y1="20" x2="40" y2="80" stroke="#94a3b8" stroke-dasharray="3"/>
      <text x="70" y="94" font-size="11" text-anchor="middle">base ${p.b} units</text>
      <text x="30" y="50" font-size="11" text-anchor="middle">h ${p.h}</text></svg>`;
  }
  // prism
  return `<svg viewBox="0 0 150 110" class="shp">
    <rect x="20" y="35" width="80" height="50" fill="#eff6ff" stroke="#1f2733" stroke-width="2"/>
    <polygon points="20,35 45,15 125,15 100,35" fill="#dbeafe" stroke="#1f2733" stroke-width="2"/>
    <polygon points="100,35 125,15 125,65 100,85" fill="#bfdbfe" stroke="#1f2733" stroke-width="2"/>
    <text x="60" y="100" font-size="11" text-anchor="middle">l ${p.l}</text>
    <text x="118" y="55" font-size="11" text-anchor="middle">w ${p.w}</text>
    <text x="135" y="42" font-size="11" text-anchor="middle">h ${p.h}</text></svg>`;
}
function renderGeometry(probs,showAns){
  const wrap=el('div','geo-grid'); wrap.style.gridTemplateColumns=`repeat(${columnsFor('geometry',probs.length)},1fr)`;
  const askLabel={area:'Find the AREA',perimeter:'Find the PERIMETER',volume:'Find the VOLUME'};
  probs.forEach((p,i)=>{
    const c=el('div','geo-cell'); c.appendChild(el('span','pnum',(i+1)+'.'));
    c.insertAdjacentHTML('beforeend',shapeSVG(p));
    c.appendChild(el('div','geo-q',`${askLabel[p.ask]}<br>${showAns?'<b class="ansblue">'+p.answer+'</b>':'<span class="blank wide"></span>'}`));
    wrap.appendChild(c);
  }); return wrap;
}
/* clocks */
function clockSVG(h,m){
  const cx=60,cy=60,r=54,t=[];
  for(let i=0;i<12;i++){const a=(i/12)*2*Math.PI-Math.PI/2;
    t.push(`<line x1="${(cx+Math.cos(a)*(r-2)).toFixed(1)}" y1="${(cy+Math.sin(a)*(r-2)).toFixed(1)}" x2="${(cx+Math.cos(a)*(r-9)).toFixed(1)}" y2="${(cy+Math.sin(a)*(r-9)).toFixed(1)}" stroke="#1f2733" stroke-width="2"/>`);
    t.push(`<text x="${(cx+Math.cos(a)*(r-19)).toFixed(1)}" y="${(cy+Math.sin(a)*(r-19)+4).toFixed(1)}" font-size="10" text-anchor="middle">${i===0?12:i}</text>`);}
  const ma=(m/60)*2*Math.PI-Math.PI/2, ha=((h%12)/12+m/720)*2*Math.PI-Math.PI/2;
  return `<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" fill="#fff" stroke="#1f2733" stroke-width="2.5"/>${t.join('')}
    <line x1="60" y1="60" x2="${(cx+Math.cos(ha)*r*0.5).toFixed(1)}" y2="${(cy+Math.sin(ha)*r*0.5).toFixed(1)}" stroke="#1f2733" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="60" y1="60" x2="${(cx+Math.cos(ma)*r*0.78).toFixed(1)}" y2="${(cy+Math.sin(ma)*r*0.78).toFixed(1)}" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="60" cy="60" r="3" fill="#1f2733"/></svg>`;
}
function renderClocks(probs,showAns){
  const wrap=el('div','clock-grid'); wrap.style.gridTemplateColumns=`repeat(${columnsFor('time',probs.length)},1fr)`;
  probs.forEach((p,i)=>{
    const c=el('div','clock-cell');
    c.insertAdjacentHTML('beforeend',`<div style="font-size:10px;color:#6b7280;text-align:left">${i+1}.</div>`);
    c.insertAdjacentHTML('beforeend',clockSVG(p.h,p.m));
    c.appendChild(el('div','write', showAns?`<span class="ans">${p.digital}</span>`:`Time: <span class="blank"></span>`));
    wrap.appendChild(c);
  }); return wrap;
}
/* shapes (used by counting + shape-recognition) */
function regPoly(c,r,n,rot){let p=[];for(let i=0;i<n;i++){const a=rot+i*2*Math.PI/n;p.push((c+r*Math.cos(a)).toFixed(1)+','+(c+r*Math.sin(a)).toFixed(1));}return p.join(' ');}
function starPts(c,rO,rI){let p=[];for(let i=0;i<10;i++){const r=i%2?rI:rO;const a=-Math.PI/2+i*Math.PI/5;p.push((c+r*Math.cos(a)).toFixed(1)+','+(c+r*Math.sin(a)).toFixed(1));}return p.join(' ');}
function shapeMarkup(kind,sz){
  const c=sz/2, f='#dbeafe', st='stroke="#1f2733" stroke-width="2"';
  const poly=(pts)=>`<polygon points="${pts}" fill="${f}" ${st}/>`;
  switch(kind){
    case 'circle': return `<circle cx="${c}" cy="${c}" r="${c-3}" fill="${f}" ${st}/>`;
    case 'oval': return `<ellipse cx="${c}" cy="${c}" rx="${c-3}" ry="${(c*0.62).toFixed(1)}" fill="${f}" ${st}/>`;
    case 'square': return `<rect x="3" y="3" width="${sz-6}" height="${sz-6}" fill="${f}" ${st}/>`;
    case 'rectangle': return `<rect x="3" y="${(sz*0.22).toFixed(1)}" width="${sz-6}" height="${(sz*0.56).toFixed(1)}" fill="${f}" ${st}/>`;
    case 'triangle': return poly(`${c},4 ${sz-4},${sz-4} 4,${sz-4}`);
    case 'diamond': return poly(`${c},4 ${sz-4},${c} ${c},${sz-4} 4,${c}`);
    case 'pentagon': return poly(regPoly(c,c-4,5,-Math.PI/2));
    case 'hexagon': return poly(regPoly(c,c-4,6,-Math.PI/2));
    case 'trapezoid': return poly(`${(sz*0.26).toFixed(1)},4 ${(sz*0.74).toFixed(1)},4 ${sz-4},${sz-4} 4,${sz-4}`);
    case 'star': return poly(starPts(c,c-4,(c-4)*0.45));
    default: return `<circle cx="${c}" cy="${c}" r="${c-3}" fill="${f}" ${st}/>`;
  }
}
function renderCounting(probs,showAns){
  const wrap=el('div','count-grid'); wrap.style.gridTemplateColumns='repeat(3,1fr)';
  probs.forEach((p,i)=>{
    const c=el('div','count-cell'); c.appendChild(el('span','pnum',(i+1)+'.'));
    const tray=el('div','count-tray');
    for(let k=0;k<p.count;k++) tray.insertAdjacentHTML('beforeend',`<svg viewBox="0 0 26 26" width="22" height="22">${shapeMarkup(p.kind,26)}</svg>`);
    c.appendChild(tray);
    c.appendChild(el('div','count-q', showAns?`How many? <b class="ansblue">${p.answer}</b>`:`How many? <span class="cbox"></span>`));
    wrap.appendChild(c);
  }); return wrap;
}
function renderShapes(probs,showAns){
  const wrap=el('div','geo-grid'); wrap.style.gridTemplateColumns='repeat(4,1fr)';
  probs.forEach((p,i)=>{
    const c=el('div','geo-cell'); c.appendChild(el('span','pnum',(i+1)+'.'));
    c.insertAdjacentHTML('beforeend',`<svg viewBox="0 0 70 70" class="shp" width="70" height="70">${shapeMarkup(p.kind,70)}</svg>`);
    c.appendChild(el('div','geo-q', showAns?`<b class="ansblue">${p.answer}</b>`:`<span class="blank"></span>`));
    wrap.appendChild(c);
  }); return wrap;
}
/* coins & bills */
function coinSVG(kind){
  const C={
    quarter:{d:56,face:'#c9ccd1',edge:'#9aa0a6',t1:'25',t2:'CENTS',label:'QUARTER'},
    nickel:{d:50,face:'#c9ccd1',edge:'#9aa0a6',t1:'5',t2:'CENTS',label:'NICKEL'},
    penny:{d:46,face:'#c88a4b',edge:'#9c6a36',t1:'1',t2:'CENT',label:'PENNY'},
    dime:{d:40,face:'#c9ccd1',edge:'#9aa0a6',t1:'10',t2:'CENTS',label:'DIME'},
  }[kind];
  const r=C.d/2, cx=r+2, cy=r+2, s=C.d+4;
  return `<svg viewBox="0 0 ${s} ${s}" width="${C.d}" height="${C.d}" class="coin" role="img" aria-label="${C.label}">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.face}" stroke="${C.edge}" stroke-width="2"/>
    <circle cx="${cx}" cy="${cy}" r="${r-3}" fill="none" stroke="${C.edge}" stroke-width="1" stroke-dasharray="2 2"/>
    <text x="${cx}" y="${cy-1}" font-size="${C.d*0.34}" font-weight="700" text-anchor="middle" fill="#3b3f45" font-family="Georgia,serif">${C.t1}¢</text>
    <text x="${cx}" y="${cy+C.d*0.26}" font-size="${C.d*0.13}" text-anchor="middle" fill="#5b6068" font-family="Georgia,serif">${C.t2}</text>
  </svg>`;
}
function billSVG(kind){
  const B={one:{v:'1',word:'ONE'},five:{v:'5',word:'FIVE'}}[kind];
  return `<svg viewBox="0 0 110 50" width="92" height="42" class="bill" role="img" aria-label="${B.word} dollar bill">
    <rect x="1" y="1" width="108" height="48" rx="5" fill="#d7ecd9" stroke="#3a7d44" stroke-width="2"/>
    <rect x="6" y="6" width="98" height="38" rx="3" fill="none" stroke="#3a7d44" stroke-width="1"/>
    <circle cx="55" cy="25" r="14" fill="#eaf5eb" stroke="#3a7d44" stroke-width="1"/>
    <text x="55" y="30" font-size="13" font-weight="700" text-anchor="middle" fill="#2f6b39" font-family="Georgia,serif">$${B.v}</text>
    <text x="14" y="16" font-size="11" font-weight="700" fill="#2f6b39" font-family="Georgia,serif">$${B.v}</text>
    <text x="96" y="40" font-size="11" font-weight="700" fill="#2f6b39" text-anchor="end" font-family="Georgia,serif">$${B.v}</text>
    <text x="55" y="13" font-size="5.5" text-anchor="middle" fill="#2f6b39" font-family="Georgia,serif">${B.word} DOLLAR</text>
  </svg>`;
}
function renderCurrency(probs,showAns){
  const wrap=el('div','block-grid'); wrap.style.gridTemplateColumns='repeat(2,1fr)';
  probs.forEach((p,i)=>{
    const c=el('div','block');
    if(p.mode==='count'){
      c.appendChild(el('div',null,`<span class="pnum">${i+1}.</span> Count the money:`));
      const tray=el('div','coin-tray');
      p.items.forEach(k=> tray.insertAdjacentHTML('beforeend', (k==='one'||k==='five')?billSVG(k):coinSVG(k)));
      c.appendChild(tray);
      c.appendChild(el('div','work', showAns?`Total: <span class="ans">${p.answer}</span>`:'Total: $______'));
    } else {
      c.appendChild(el('div',null,`<span class="pnum">${i+1}.</span>${p.q}`));
      c.appendChild(el('div','work', showAns?`Answer: <span class="ans">${p.answer}</span>`:'Answer: __________'));
    }
    wrap.appendChild(c);
  }); return wrap;
}
/* vocab match (single) */
function renderVocabMatch(data,showAns){
  const wrap=el('div','match-wrap');
  let left='<div class="match-col"><h3>Words</h3>';
  data.words.forEach(w=> left+=`<div class="match-row"><b>${w.label}.</b> ${w.word}</div>`);
  left+='</div>';
  let right='<div class="match-col"><h3>Definitions</h3>';
  data.defs.forEach(d=>{ const ans=showAns?data.answerMap.find(a=>a.num===d.num).letter:'';
    right+=`<div class="match-row"><span class="match-box">${ans}</span> ${d.num}. ${d.def}</div>`; });
  right+='</div>';
  wrap.innerHTML=`<p class="instr">Write the letter of the matching word next to each definition.</p><div class="match-cols">${left}${right}</div>`;
  return wrap;
}
/* word search (single) */
function renderWordSearch(data,showAns){
  const wrap=el('div','ws-wrap');
  const placedSet=new Set(); if(showAns) data.placed.forEach(pl=>pl.cells.forEach(([r,c])=>placedSet.add(r+','+c)));
  let g='<table class="wsgrid">';
  for(let r=0;r<data.size;r++){ g+='<tr>'; for(let c=0;c<data.size;c++){
    const hit=placedSet.has(r+','+c); g+=`<td class="${hit?'wshit':''}">${data.grid[r][c]}</td>`; } g+='</tr>'; }
  g+='</table>';
  let list='<div class="wslist"><h3>Find these words:</h3><div class="wswords">'+data.words.map(w=>`<span>${w}</span>`).join('')+'</div></div>';
  wrap.innerHTML=g+list; return wrap;
}
/* reading passage (single) */
function renderPassage(data,showAns){
  const wrap=el('div','passage-wrap');
  wrap.appendChild(el('h2','passage-title',data.title));
  wrap.appendChild(el('div','passage-text',data.text));
  const ol=el('ol','passage-q');
  data.questions.forEach(q=>{ const li=el('li',null,q.q);
    li.appendChild(el('div','qa', showAns?`<span class="ans">${q.a}</span>`:'<span class="ansline"></span><span class="ansline"></span>'));
    ol.appendChild(li); });
  wrap.appendChild(ol); return wrap;
}

/* ---------- dispatch ---------- */
function renderProblems(opt,data,showAns){
  const layout=META()[opt.type].layout;
  // STEM add-on renderers (registered by stem.js)
  if(window.STEM_RENDERERS && window.STEM_RENDERERS[layout])
    return window.STEM_RENDERERS[layout](data,showAns);
  switch(layout){
    case 'stack': return renderStack(data,opt.type,showAns);
    case 'longdiv': return renderLongDiv(data,showAns);
    case 'inline': return renderInline(data,opt.type,showAns);
    case 'fraction': return renderFractions(data,showAns);
    case 'factfamily': return renderFactFamily(data,showAns);
    case 'patterns': return renderPatterns(data,showAns);
    case 'geometry': return renderGeometry(data,showAns);
    case 'clock': return renderClocks(data,showAns);
    case 'counting': return renderCounting(data,showAns);
    case 'shapes': return renderShapes(data,showAns);
    case 'currency': return renderCurrency(data,showAns);
    case 'vocabmatch': return renderVocabMatch(data,showAns);
    case 'wordsearch': return renderWordSearch(data,showAns);
    case 'passage': return renderPassage(data,showAns);
    case 'block': default: return renderBlocks(data,opt.type,showAns);
  }
}

/* ---------- header ---------- */
function renderHeader(opt,isKey){
  const m=META()[opt.type]; const head=el('div','ws-head');
  const title=opt.title || m.label;
  head.appendChild(el('h1','ws-title',`${title}${isKey?'<span class="key-badge">ANSWER KEY</span>':''}`));
  if(opt.themeOn && window.THEMES)
    head.insertAdjacentHTML('beforeend', window.THEMES.headerDecor(opt.theme, opt.seed));
  if(opt.showName && !isKey)
    head.appendChild(el('div','ws-meta',`<span>Name: <span class="line"></span></span><span>Date: <span class="line"></span></span>`));
  const subj=window.WS.SUBJECTS[opt.subject];
  head.appendChild(el('div','ws-sub',`${subj} · Grade ${opt.grade} · ${opt.difficulty}`));
  return head;
}

/* ---------- generate ---------- */
function generate(){
  const opt=readOpts(); if(!opt.type) return;
  const res=window.WS.generateWorksheet(opt);
  const data = res.single || res.problems;
  els.sheet.innerHTML='';
  els.sheet.appendChild(renderHeader(opt,false));
  els.sheet.appendChild(renderProblems(opt,data,false));
  if(opt.answerKey){
    const key=el('div','sheet-key'); key.style.breakBefore='page'; key.style.pageBreakBefore='always'; key.style.marginTop='0.4in';
    key.appendChild(renderHeader(opt,true));
    key.appendChild(renderProblems(opt,data,true));
    els.sheet.appendChild(key);
  }
  els.seedInfo.textContent=`Seed: ${opt.seed}  (reuse to reprint this exact sheet)`;
  if(!els.seed.value.trim()) els.seed.placeholder=opt.seed;
}

/* ---------- events ---------- */
els.generate.addEventListener('click',generate);
els.print.addEventListener('click',()=>window.print());
els.subject.addEventListener('change',()=>{ populateTypes(); syncControls(); applyDefaultCount(); generate(); });
els.grade.addEventListener('change',()=>{ populateTypes(); syncControls(); generate(); });
els.type.addEventListener('change',()=>{ syncControls(); applyDefaultCount(); generate(); });
els.difficulty.addEventListener('change',generate);
els.digits.addEventListener('change',generate);
els.answerKey.addEventListener('change',generate);
els.showName.addEventListener('change',generate);
if(els.theme) els.theme.addEventListener('change',generate);
if(els.themeOn) els.themeOn.addEventListener('change',generate);

/* ---------- init ---------- */
populateTypes(); syncControls(); applyDefaultCount(); generate();
