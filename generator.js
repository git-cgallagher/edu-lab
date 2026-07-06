/* ============================================================
   generator.js — seeded RNG + all worksheet generators
   Pure logic, no DOM. Requires banks.js loaded first.
   ============================================================ */

/* ---------- Seeded RNG (mulberry32 + string hash) ---------- */
function hashSeed(str){
  let h = 1779033703 ^ str.length;
  for (let i=0;i<str.length;i++){
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h >>> 0);
}
function mulberry32(a){
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeRng(seedStr){
  const rng = mulberry32(hashSeed(String(seedStr)));
  return {
    next: rng,
    int: (min,max)=> Math.floor(rng()*(max-min+1))+min,
    pick: (arr)=> arr[Math.floor(rng()*arr.length)],
    chance: (p)=> rng() < p,
    shuffle: (arr)=>{ const a=arr.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
  };
}

/* ---------- math helpers ---------- */
function gcd(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){[a,b]=[b,a%b];} return a||1; }
function reduceFrac(n,d){ const g=gcd(n,d); return [n/g, d/g]; }
function fracStr(n,d){ return `${n}/${d}`; }
function digitRange(d){
  const map = {1:[1,9], 2:[10,99], 3:[100,999]};
  const [a,b] = d.split('x').map(Number);
  return [ {min:map[a][0],max:map[a][1]}, {min:map[b][0],max:map[b][1]} ];
}
const G = (opt)=>Number(opt.grade);

/* ============================================================
   CORE ARITHMETIC
   ============================================================ */
// Dedup is on for every grade. K/G1 draw from a small operand range, so the number of
// distinct problems is tiny (e.g. K addition, operands 0–5, has only 21). TYPE_META asks
// for 48, which previously produced ~40% duplicates because dedup was disabled below G2.
// We now cap the target to the distinct-problem space for those grades so the sheet fills
// with unique problems instead of padding with repeats. Higher grades are unaffected
// (their operand space dwarfs any requested count, so the cap never bites).
function tri(n){ return (n+1)*(n+2)/2; } // # of unordered pairs {a,b} with 0<=a,b<=n
function genAddition(R, opt){
  const g=G(opt); const probs=[], seen=new Set(); const [r1,r2]=digitRange(opt.digits);
  const cap = g===0?5 : g===1?10 : null;             // K within 5, G1 within 10
  const count = cap===null ? opt.count : Math.min(opt.count, tri(cap));
  let guard=0;
  while(probs.length<count && guard++<count*60){
    let a,b;
    if(cap===null){ a=R.int(r1.min,r1.max); b=R.int(r2.min,r2.max); }
    else { a=R.int(0,cap); b=R.int(0,cap); }
    const k=a<b?a+'+'+b:b+'+'+a;
    if(seen.has(k))continue; seen.add(k);
    probs.push({a,b,op:'+',answer:a+b});
  } return probs;
}
function genSubtraction(R, opt){
  const g=G(opt); const probs=[], seen=new Set(); const [r1,r2]=digitRange(opt.digits);
  const cap = g===0?10 : g===1?20 : null;            // K within 10, G1 within 20 (minuend)
  const count = cap===null ? opt.count : Math.min(opt.count, tri(cap)); // pairs 0<=b<=a<=cap
  let guard=0;
  while(probs.length<count && guard++<count*60){
    let a,b;
    if(cap===null){
      a=R.int(r1.min,r1.max); b=R.int(r2.min,r2.max); if(a<b)[a,b]=[b,a];
      if(opt.difficulty==='easy'&&a===b)continue;    // G2+ easy: skip trivial n − n = 0
    } else { a=R.int(0,cap); b=R.int(0,a); }
    const k=a+'-'+b;
    if(seen.has(k))continue; seen.add(k);
    probs.push({a,b,op:'−',answer:a-b});
  } return probs;
}
function genMultiplication(R, opt){
  const probs=[], seen=new Set(); let [r1,r2]=digitRange(opt.digits); let guard=0;
  while(probs.length<opt.count && guard++<opt.count*60){
    let a=R.int(r1.min,r1.max), b=R.int(r2.min,r2.max);
    if(G(opt)<=2){ if(r2.max<=9)b=R.int(opt.difficulty==='easy'?0:1,opt.difficulty==='hard'?12:10); if(r1.max<=9)a=R.int(2,12); }
    const k=a<b?a+'x'+b:b+'x'+a; if(seen.has(k))continue; seen.add(k);
    probs.push({a,b,op:'×',answer:a*b});
  } return probs;
}
function genDivision(R, opt){
  const probs=[], seen=new Set(); const allowRem=opt.difficulty!=='easy';
  const divMax = G(opt)<=2?(opt.difficulty==='easy'?5:9):(opt.difficulty==='hard'?12:10);
  const quoMax = G(opt)<=2?9:(opt.difficulty==='hard'?12:10); let guard=0;
  while(probs.length<opt.count && guard++<opt.count*60){
    const divisor=R.int(2,divMax), quotient=R.int(1,quoMax);
    let rem=0; if(allowRem&&R.chance(opt.difficulty==='hard'?0.5:0.3))rem=R.int(1,divisor-1);
    const dividend=divisor*quotient+rem; const k=dividend+'/'+divisor;
    if(seen.has(k))continue; seen.add(k);
    probs.push({a:dividend,b:divisor,op:'÷',answer:quotient,remainder:rem});
  } return probs;
}
/* long multiplication: 2-3 digit x 2 digit */
function genLongMult(R, opt){
  const probs=[], seen=new Set(); let guard=0;
  const aMax = G(opt)>=5?999:99; const aMin = G(opt)>=5?100:10;
  while(probs.length<opt.count && guard++<opt.count*40){
    const a=R.int(aMin,aMax), b=R.int(opt.difficulty==='easy'?11:12, opt.difficulty==='hard'?99:50);
    const k=a+'x'+b; if(seen.has(k))continue; seen.add(k);
    probs.push({a,b,op:'×',answer:a*b});
  } return probs;
}
/* long division: dividend up to 3-4 digit / 1-2 digit */
function genLongDiv(R, opt){
  const probs=[], seen=new Set(); const allowRem=opt.difficulty!=='easy'; let guard=0;
  const divMax = G(opt)>=5?(opt.difficulty==='hard'?25:12):12;
  while(probs.length<opt.count && guard++<opt.count*40){
    const divisor=R.int(2,divMax);
    const quotient=R.int(G(opt)>=5?20:11, G(opt)>=5?400:120);
    let rem=0; if(allowRem&&R.chance(0.5))rem=R.int(1,divisor-1);
    const dividend=divisor*quotient+rem; const k=dividend+'/'+divisor;
    if(seen.has(k))continue; seen.add(k);
    probs.push({dividend,divisor,quotient,remainder:rem,
      answer: rem?`${quotient} r${rem}`:String(quotient)});
  } return probs;
}

/* ============================================================
   NUMBER SENSE (existing + new)
   ============================================================ */
function genComparison(R, opt){
  const g=G(opt), dd=g>=2; const probs=[], seen=new Set();
  const max = g<=1?(g===0?10:20): g<=2?(opt.difficulty==='hard'?200:100):(g>=4?(opt.difficulty==='hard'?10000:5000):(opt.difficulty==='hard'?1000:500));
  let guard=0;
  while(probs.length<opt.count && guard++<opt.count*60){
    let left,right;
    const useExpr = g>=2 && opt.difficulty!=='easy' && R.chance(0.4);
    if(useExpr){ const a=R.int(1,20),b=R.int(1,20),c=R.int(1,40);
      left={text:`${a} + ${b}`,val:a+b}; right={text:`${c}`,val:c}; }
    else { const a=R.int(0,max); let b=a; if(R.chance(0.78))b=R.int(0,max);
      left={text:`${a}`,val:a}; right={text:`${b}`,val:b}; }
    const k=left.text+'?'+right.text; if(dd){ if(seen.has(k))continue; seen.add(k); }
    probs.push({left:left.text,right:right.text,answer:left.val>right.val?'>':left.val<right.val?'<':'='});
  } return probs;
}
function genPlaceValue(R, opt){
  const g=G(opt); const probs=[], seen=new Set(); const big=g>=3||opt.difficulty!=='easy';
  const huge=g>=4; let guard=0;
  while(probs.length<opt.count && guard++<opt.count*40){
    if(g<=1){
      const n=R.int(10,99); const s=String(n); const mode=R.pick(['tens','ones','place']); let q,answer;
      if(mode==='tens'){q=`How many TENS are in ${n}?`;answer=s[0];}
      else if(mode==='ones'){q=`How many ONES are in ${n}?`;answer=s[1];}
      else{const which=R.chance(0.5)?'tens':'ones';q=`In ${n}, what digit is in the ${which} place?`;answer=which==='tens'?s[0]:s[1];}
      if(seen.has(q))continue; seen.add(q); probs.push({q,answer}); continue;
    }
    const n = huge?R.int(1000,99999):(big?R.int(100,999):R.int(10,99));
    const modes = huge?['round10','round100','round1000','place','expand']:big?['round10','round100','place','expand']:['round10','place','expand'];
    const mode=R.pick(modes); let q,answer;
    if(mode==='round10'){q=`Round ${n} to the nearest ten.`;answer=String(Math.round(n/10)*10);}
    else if(mode==='round100'){q=`Round ${n} to the nearest hundred.`;answer=String(Math.round(n/100)*100);}
    else if(mode==='round1000'){q=`Round ${n} to the nearest thousand.`;answer=String(Math.round(n/1000)*1000);}
    else if(mode==='place'){const s=String(n);const idx=R.int(0,s.length-1);
      const allNames=['ten-thousands','thousands','hundreds','tens','ones'];
      const names=allNames.slice(allNames.length-s.length);
      q=`In ${n}, what digit is in the ${names[idx]} place?`;answer=s[idx];}
    else{const s=String(n);const parts=[];for(let i=0;i<s.length;i++){const place=Math.pow(10,s.length-1-i);const v=Number(s[i])*place;if(v)parts.push(v);}
      q=`Write ${n} in expanded form.`;answer=parts.join(' + ');}
    if(seen.has(q))continue; seen.add(q); probs.push({q,answer});
  } return probs;
}
function genFactFamily(R, opt){
  const g=G(opt), dd=g>=2; const probs=[], seen=new Set(); let guard=0;
  while(probs.length<opt.count && guard++<opt.count*40){
    const useMult=g>=3&&R.chance(0.5);
    let trio,type;
    if(useMult){const a=R.int(2,opt.difficulty==='hard'?12:9),b=R.int(2,opt.difficulty==='hard'?12:9);trio=[a,b,a*b];type='× ÷';}
    else{const hi=g<=1?5:(g<=2?20:50);const lo=g<=1?1:2;const a=R.int(lo,hi),b=R.int(lo,hi);trio=[a,b,a+b];type='+ −';}
    const k=trio.join(','); if(dd){ if(seen.has(k))continue; seen.add(k); }
    probs.push({numbers:trio,type,family: type==='+ −'
      ?[`${trio[0]} + ${trio[1]} = ${trio[2]}`,`${trio[1]} + ${trio[0]} = ${trio[2]}`,`${trio[2]} − ${trio[0]} = ${trio[1]}`,`${trio[2]} − ${trio[1]} = ${trio[0]}`]
      :[`${trio[0]} × ${trio[1]} = ${trio[2]}`,`${trio[1]} × ${trio[0]} = ${trio[2]}`,`${trio[2]} ÷ ${trio[0]} = ${trio[1]}`,`${trio[2]} ÷ ${trio[1]} = ${trio[0]}`]});
  } return probs;
}
function genOrderOps(R, opt){
  const probs=[], seen=new Set(); let guard=0;
  while(probs.length<opt.count && guard++<opt.count*60){
    const ops=['+','−','×']; let expr,val;
    const useParen = opt.difficulty!=='easy' && R.chance(0.5);
    const a=R.int(2,9),b=R.int(2,9),c=R.int(2,9);
    if(useParen){
      const o1=R.pick(['+','−']), o2=R.pick(['×']);
      let inner = o1==='+'?a+b:Math.max(a,b)-Math.min(a,b);
      const x=Math.max(a,b),y=Math.min(a,b);
      expr=`(${x} ${o1} ${y}) ${o2} ${c}`; val=(o1==='+'?x+y:x-y)*c;
    } else {
      const o1=R.pick(['+','−']), o2='×';
      // a o1 (b o2 c) with precedence: multiplication first
      expr=`${a} ${o1} ${b} ${o2} ${c}`;
      val = o1==='+' ? a + b*c : a - 0; // ensure non-negative: rebuild
      val = a + b*c; if(o1==='−'){ // make positive
        const big=Math.max(a, b*c)+R.int(0,5); expr=`${big} − ${b} × ${c}`; val=big-b*c;
      }
    }
    if(seen.has(expr))continue; seen.add(expr);
    probs.push({q:`${expr} =`, answer:String(val)});
  } return probs;
}
function genFactors(R, opt){
  const probs=[], seen=new Set(); let guard=0;
  const isPrime=(n)=>{ if(n<2)return false; for(let i=2;i*i<=n;i++)if(n%i===0)return false; return true; };
  while(probs.length<opt.count && guard++<opt.count*40){
    const mode=R.pick(G(opt)>=5?['factors','prime','multiples','gcf']:['factors','prime','multiples']);
    let q,answer;
    if(mode==='factors'){const n=R.int(6,opt.difficulty==='hard'?60:36);
      const f=[];for(let i=1;i<=n;i++)if(n%i===0)f.push(i);
      q=`List all the factors of ${n}.`;answer=f.join(', ');}
    else if(mode==='prime'){const n=R.int(2,60);q=`Is ${n} prime or composite?`;answer=isPrime(n)?'prime':'composite';}
    else if(mode==='multiples'){const n=R.int(2,12);q=`Write the first 5 multiples of ${n}.`;answer=[1,2,3,4,5].map(k=>k*n).join(', ');}
    else{let a=R.int(8,40),b=R.int(8,40);q=`What is the greatest common factor (GCF) of ${a} and ${b}?`;answer=String(gcd(a,b));}
    if(seen.has(q))continue; seen.add(q); probs.push({q,answer});
  } return probs;
}
function genPatterns(R, opt){
  const g=G(opt), dd=g>=2; const probs=[], seen=new Set(); let guard=0;
  while(probs.length<opt.count && guard++<opt.count*40){
    const type=g<=1?'add':R.pick(['add','mul']);
    const step=type==='add'?(g<=1?R.int(1,3):R.int(2,9)):R.int(2,5);
    const start=g<=1?R.int(1,4):R.int(1,9);
    const inputs=[start,start+1,start+2,start+3,start+4];
    const rule= type==='add'?`+ ${step}`:`× ${step}`;
    const outputs=inputs.map(x=> type==='add'?x+step:x*step);
    const ask = (g<=1||opt.difficulty==='easy')?'fill':R.pick(['fill','rule']);
    const k=type+step+start; if(dd){ if(seen.has(k))continue; seen.add(k); }
    probs.push({rule,inputs,outputs,ask});
  } return probs;
}

/* ============================================================
   FRACTIONS
   ============================================================ */
function genFractions(R, opt){
  const probs=[], seen=new Set(); let guard=0;
  const g=G(opt);
  const modes = g<=3 ? ['identify','equiv','compareSame']
            : g===4 ? ['equiv','compareUnlike','addLike','subLike','identify']
            : ['addUnlike','subUnlike','multWhole','multFrac','compareUnlike'];
  while(probs.length<opt.count && guard++<opt.count*60){
    const mode=R.pick(modes); let prob;
    if(mode==='identify'){
      const den=R.int(2,8), num=R.int(1,den-1);
      prob={render:'identify',num,den,answer:fracStr(num,den)};
      if(seen.has('id'+num+'/'+den))continue; seen.add('id'+num+'/'+den);
    } else if(mode==='equiv'){
      const den=R.int(2,6), num=R.int(1,den-1), m=R.int(2,5);
      // a/b = ?/(b*m)  -> find numerator
      prob={render:'equiv',n1:num,d1:den,d2:den*m,answer:String(num*m)};
      const k='eq'+num+den+m; if(seen.has(k))continue; seen.add(k);
    } else if(mode==='compareSame'){
      const den=R.int(3,10); let a=R.int(1,den-1),b=R.int(1,den-1);
      prob={render:'compare',n1:a,d1:den,n2:b,d2:den,answer:a>b?'>':a<b?'<':'='};
      const k='cs'+a+b+den; if(seen.has(k))continue; seen.add(k);
    } else if(mode==='compareUnlike'){
      const d1=R.int(2,8),d2=R.int(2,8),n1=R.int(1,d1-1),n2=R.int(1,d2-1);
      const v1=n1/d1,v2=n2/d2;
      prob={render:'compare',n1,d1,n2,d2,answer:Math.abs(v1-v2)<1e-9?'=':v1>v2?'>':'<'};
      const k='cu'+n1+d1+n2+d2; if(seen.has(k))continue; seen.add(k);
    } else if(mode==='addLike'||mode==='subLike'){
      const den=R.int(3,10); let a=R.int(1,den-1),b=R.int(1,den-1);
      if(mode==='subLike'&&a<b)[a,b]=[b,a];
      const rn = mode==='addLike'?a+b:a-b; const [rnr,rdr]=reduceFrac(rn,den);
      prob={render:'arith',n1:a,d1:den,n2:b,d2:den,op:mode==='addLike'?'+':'−',
        answer: rdr===1?String(rnr):fracStr(rnr,rdr)};
      const k=mode+a+b+den; if(seen.has(k))continue; seen.add(k);
    } else if(mode==='addUnlike'||mode==='subUnlike'){
      let d1=R.int(2,8),d2=R.int(2,8); let n1=R.int(1,d1-1),n2=R.int(1,d2-1);
      const L=d1*d2/gcd(d1,d2); let rn=mode==='addUnlike'?(n1*(L/d1)+n2*(L/d2)):(n1*(L/d1)-n2*(L/d2));
      if(mode==='subUnlike'&&rn<0){[n1,d1,n2,d2]=[n2,d2,n1,d1];rn=-rn;}
      const [rnr,rdr]=reduceFrac(rn,L);
      prob={render:'arith',n1,d1,n2,d2,op:mode==='addUnlike'?'+':'−',
        answer: rdr===1?String(rnr):fracStr(rnr,rdr)};
      const k=mode+n1+d1+n2+d2; if(seen.has(k))continue; seen.add(k);
    } else if(mode==='multWhole'){
      const den=R.int(2,8),num=R.int(1,den-1),w=R.int(2,6);
      const [rn,rd]=reduceFrac(num*w,den);
      prob={render:'multw',n1:num,d1:den,whole:w,answer: rd===1?String(rn):fracStr(rn,rd)};
      const k='mw'+num+den+w; if(seen.has(k))continue; seen.add(k);
    } else { // multFrac
      const d1=R.int(2,6),d2=R.int(2,6),n1=R.int(1,d1-1),n2=R.int(1,d2-1);
      const [rn,rd]=reduceFrac(n1*n2,d1*d2);
      prob={render:'arith',n1,d1,n2,d2,op:'×',answer: rd===1?String(rn):fracStr(rn,rd)};
      const k='mf'+n1+d1+n2+d2; if(seen.has(k))continue; seen.add(k);
    }
    probs.push(prob);
  } return probs;
}

/* ============================================================
   DECIMALS
   ============================================================ */
function dec(n){ return Number(n.toFixed(2)); }
function genDecimals(R, opt){
  const probs=[], seen=new Set(); let guard=0; const g=G(opt);
  const modes = g===4 ? ['place','compare','round','addsub'] : ['addsub','mult','compare','round'];
  while(probs.length<opt.count && guard++<opt.count*40){
    const mode=R.pick(modes); let q,answer;
    const r2=()=>R.int(1,99)/100, r1=()=>R.int(1,9)/10;
    if(mode==='place'){
      const whole=R.int(0,9), t=R.int(0,9), h=R.int(0,9); const num=`${whole}.${t}${h}`;
      const place=R.pick(['tenths','hundredths','ones']);
      q=`In ${num}, what digit is in the ${place} place?`;
      answer= place==='ones'?String(whole):place==='tenths'?String(t):String(h);
    } else if(mode==='compare'){
      const a=dec(R.int(1,999)/100), b=dec(R.int(1,999)/100);
      q=`Compare: ${a.toFixed(2)} ___ ${b.toFixed(2)}`; answer=a>b?'>':a<b?'<':'=';
    } else if(mode==='round'){
      const a=R.int(1,9999)/100; const to=R.pick(['whole','tenth']);
      q=`Round ${a.toFixed(2)} to the nearest ${to}.`;
      answer= to==='whole'?String(Math.round(a)):(Math.round(a*10)/10).toFixed(1);
    } else if(mode==='addsub'){
      let a=dec(R.int(10,999)/100), b=dec(R.int(10,999)/100); const add=R.chance(0.5);
      if(!add&&a<b)[a,b]=[b,a];
      q=`${a.toFixed(2)} ${add?'+':'−'} ${b.toFixed(2)} =`;
      answer=(add?dec(a+b):dec(a-b)).toFixed(2);
    } else { // mult
      const a=dec(R.int(11,99)/10), b=R.int(2,9);
      q=`${a.toFixed(1)} × ${b} =`; answer=dec(a*b).toFixed(2).replace(/0$/,'').replace(/\.$/,'');
    }
    if(seen.has(q))continue; seen.add(q); probs.push({q,answer});
  } return probs;
}

/* ============================================================
   GEOMETRY (area / perimeter / volume / triangle)
   ============================================================ */
function genGeometry(R, opt){
  const probs=[], seen=new Set(); let guard=0; const g=G(opt);
  const modes = g<=3 ? ['perimeter','areaRect'] : g===4 ? ['areaRect','perimeter','areaTri'] : ['areaRect','areaTri','volume','perimeter'];
  while(probs.length<opt.count && guard++<opt.count*40){
    const mode=R.pick(modes); let prob;
    if(mode==='perimeter'){const w=R.int(2,20),l=R.int(2,20);
      prob={shape:'rect',w,l,ask:'perimeter',answer:`${2*(w+l)} units`};}
    else if(mode==='areaRect'){const w=R.int(2,20),l=R.int(2,20);
      prob={shape:'rect',w,l,ask:'area',answer:`${w*l} sq units`};}
    else if(mode==='areaTri'){const b=R.int(2,20),h=R.int(2,20);
      prob={shape:'triangle',b,h,ask:'area',answer:`${(b*h/2)} sq units`};}
    else {const l=R.int(2,12),w=R.int(2,12),h=R.int(2,12);
      prob={shape:'prism',l,w,h,ask:'volume',answer:`${l*w*h} cubic units`};}
    const k=JSON.stringify(prob); if(seen.has(k))continue; seen.add(k);
    probs.push(prob);
  } return probs;
}

/* ============================================================
   APPLIED (time / currency / measurement / word problems)
   ============================================================ */
function genTime(R, opt){
  const g=G(opt), dd=g>=2; const probs=[], seen=new Set();
  let step=30;
  if(g===0)step=60;                                          // K: o'clock only
  else if(g===1)step=opt.difficulty==='easy'?60:30;          // G1: hour / half-hour
  else if(g<=2)step=opt.difficulty==='easy'?30:15;
  else step=opt.difficulty==='easy'?15:(opt.difficulty==='hard'?1:5);
  let guard=0;
  while(probs.length<opt.count && guard++<opt.count*60){
    const h=R.int(1,12); const m=(R.int(0,Math.floor(59/step))*step)%60;
    const k=h+':'+m; if(dd){ if(seen.has(k))continue; seen.add(k); }
    probs.push({h,m,digital:`${h}:${String(m).padStart(2,'0')}`});
  } return probs;
}
const COINS=[{kind:'quarter',value:25},{kind:'dime',value:10},{kind:'nickel',value:5},{kind:'penny',value:1}];
const BILLS=[{kind:'one',value:100},{kind:'five',value:500}];
function money(c){return '$'+(c/100).toFixed(2);}
function genCurrency(R, opt){
  const probs=[], seen=new Set(); let guard=0; const g=G(opt);
  const useBills = g>=4;
  while(probs.length<opt.count && guard++<opt.count*40){
    if(g<=1){   // K-1: count a small handful of coins (no quarters/bills)
      const n=R.int(2,4); const items=[]; let total=0;
      const small=[{kind:'dime',value:10},{kind:'nickel',value:5},{kind:'penny',value:1}];
      for(let i=0;i<n;i++){const c=R.pick(small); items.push(c.kind); total+=c.value;}
      probs.push({mode:'count',items,answer:money(total)}); continue;
    }
    const mode=opt.difficulty==='easy'?'count':(g>=3?R.pick(['count','count','change','add']):R.pick(['count','count','add']));
    if(mode==='count'){
      const n=R.int(3,opt.difficulty==='hard'?7:5);
      const items=[]; let total=0;
      for(let i=0;i<n;i++){
        const useBill = useBills && R.chance(0.3);
        const c = useBill ? R.pick(BILLS) : R.pick(COINS);
        items.push(c.kind); total+=c.value;
      }
      const k='c'+items.join(''); if(seen.has(k))continue; seen.add(k);
      probs.push({mode:'count',items,answer:money(total)});
    } else if(mode==='add'){
      const a=R.int(5,g>=3?999:50),b=R.int(5,g>=3?999:50);
      const q=`${money(a)} + ${money(b)} =`; if(seen.has(q))continue; seen.add(q);
      probs.push({mode:'text',q,answer:money(a+b)});
    } else {
      const price=R.int(10,g>=4?480:95);const paid=g>=4?500:100;
      const q=`You pay ${money(paid)} for an item that costs ${money(price)}. How much change?`;
      if(seen.has(q))continue; seen.add(q);
      probs.push({mode:'text',q,answer:money(paid-price)});
    }
  } return probs;
}
const MEAS={standard:[['1 foot = ___ inches','12'],['2 feet = ___ inches','24'],['1 yard = ___ feet','3'],
  ['1 pound = ___ ounces','16'],['1 gallon = ___ quarts','4'],['1 quart = ___ pints','2'],['1 pint = ___ cups','2'],
  ['3 feet = ___ yard(s)','1'],['1 cup = ___ fluid ounces','8'],['1 mile = ___ feet','5280']],
  metric:[['1 meter = ___ centimeters','100'],['1 centimeter = ___ millimeters','10'],['1 kilometer = ___ meters','1000'],
  ['1 kilogram = ___ grams','1000'],['1 liter = ___ milliliters','1000'],['2 meters = ___ centimeters','200'],
  ['3 kilometers = ___ meters','3000'],['5 centimeters = ___ millimeters','50']]};
function genMeasurement(R, opt){
  const probs=[]; let pool=MEAS.standard.concat(G(opt)>=3||opt.difficulty!=='easy'?MEAS.metric:[]);
  pool=R.shuffle(pool); let i=0;
  while(probs.length<opt.count){ const item=pool[i%pool.length]; i++;
    probs.push({q:item[0],answer:item[1]});
    if(i%pool.length===0)pool=R.shuffle(pool); }
  return probs.slice(0,opt.count);
}
const NAMES=['Mia','Leo','Ava','Noah','Zoe','Eli','Maya','Sam','Ivy','Max','Ruby','Theo'];
const ITEMS=['stickers','marbles','apples','crayons','cookies','books','shells','cards','pencils','blocks'];
function genWordProblems(R, opt){
  const probs=[], seen=new Set(); const big=G(opt)>=3||opt.difficulty==='hard'; let guard=0;
  while(probs.length<opt.count && guard++<opt.count*40){
    const name=R.pick(NAMES), item=R.pick(ITEMS);
    const op=R.pick(G(opt)>=3?['add','sub','mul','div']:['add','sub']); let q,answer;
    if(op==='add'){const a=R.int(big?10:5,big?90:30),b=R.int(big?10:5,big?90:30);
      q=`${name} has ${a} ${item}. A friend gives ${name} ${b} more. How many ${item} now?`;answer=a+b;}
    else if(op==='sub'){let a=R.int(big?20:10,big?99:40),b=R.int(2,a-1);
      q=`${name} had ${a} ${item} and gave away ${b}. How many are left?`;answer=a-b;}
    else if(op==='mul'){const a=R.int(2,9),b=R.int(2,9);
      q=`${name} has ${a} bags with ${b} ${item} in each. How many ${item} in all?`;answer=a*b;}
    else{const b=R.int(2,6),quo=R.int(2,9);const a=b*quo;
      q=`${name} shares ${a} ${item} equally among ${b} friends. How many does each friend get?`;answer=quo;}
    if(seen.has(q))continue; seen.add(q); probs.push({q,answer:String(answer)});
  } return probs;
}

/* ============================================================
   LANGUAGE ARTS
   ============================================================ */
function bankByGrade(bank, grade){ // merges this grade + lower for variety
  let out=[]; for(let g=2;g<=grade;g++) if(bank[g]) out=out.concat(bank[g]); return out.length?out:bank[2]||[];
}
function genSynAnt(R, opt){
  const probs=[], seen=new Set(); const B=window.BANKS; const g=G(opt); let guard=0;
  const syns=bankByGrade(B.SYNONYMS,g), ants=bankByGrade(B.ANTONYMS,g);
  while(probs.length<opt.count && guard++<opt.count*40){
    if(R.chance(0.5)){ const e=R.pick(syns); const k='s'+e[0]; if(seen.has(k))continue; seen.add(k);
      probs.push({q:`Write a <b>synonym</b> for: <b>${e[0]}</b>`,answer:e[1].join(' / ')}); }
    else { const e=R.pick(ants); const k='a'+e[0]; if(seen.has(k))continue; seen.add(k);
      probs.push({q:`Write an <b>antonym</b> for: <b>${e[0]}</b>`,answer:e[1]}); }
  } return probs;
}
function genAffixes(R, opt){
  const probs=[], seen=new Set(); const B=window.BANKS; let guard=0;
  const all=B.PREFIXES.map(p=>['prefix',...p]).concat(B.SUFFIXES.map(s=>['suffix',...s]));
  while(probs.length<opt.count && guard++<opt.count*40){
    const e=R.pick(all); const mode=R.pick(['meaning','example']);
    let q,answer; const k=e[1]+mode; if(seen.has(k))continue; seen.add(k);
    if(mode==='meaning'){q=`What does the ${e[0]} <b>${e[1]}</b> mean?`;answer=e[2];}
    else{q=`Write a word using the ${e[0]} <b>${e[1]}</b>.`;answer=`example: ${e[3]}`;}
    probs.push({q,answer});
  } return probs;
}
function genPOS(R, opt){
  const probs=[], seen=new Set(); const B=window.BANKS; let guard=0;
  const entries=[]; for(const pos of Object.keys(B.POS)) for(const w of B.POS[pos]) entries.push([w,pos]);
  while(probs.length<opt.count && guard++<opt.count*40){
    const e=R.pick(entries); if(seen.has(e[0]))continue; seen.add(e[0]);
    probs.push({q:`What part of speech is <b>${e[0]}</b>? (noun, verb, adjective, adverb)`,answer:e[1]});
  } return probs;
}
function genPlurals(R, opt){
  const probs=[], seen=new Set(); const B=window.BANKS; let guard=0;
  while(probs.length<opt.count && guard++<opt.count*40){
    const e=R.pick(B.PLURALS); if(seen.has(e[0]))continue; seen.add(e[0]);
    probs.push({q:`Write the plural of: <b>${e[0]}</b>`,answer:e[1]});
  } return probs;
}
function genContractions(R, opt){
  const probs=[], seen=new Set(); const B=window.BANKS; let guard=0;
  while(probs.length<opt.count && guard++<opt.count*40){
    const e=R.pick(B.CONTRACTIONS); const fwd=R.chance(0.5);
    const k=(fwd?'f':'b')+e[0]; if(seen.has(k))continue; seen.add(k);
    if(fwd) probs.push({q:`Write the contraction for: <b>${e[0]}</b>`,answer:e[1]});
    else probs.push({q:`Write out the contraction: <b>${e[1]}</b>`,answer:e[0]});
  } return probs;
}
function genSentenceType(R, opt){
  const probs=[], seen=new Set(); const B=window.BANKS; let guard=0;
  while(probs.length<opt.count && guard++<opt.count*40){
    const e=R.pick(B.SENTENCES); if(seen.has(e[0]))continue; seen.add(e[0]);
    probs.push({q:`What type of sentence? <i>${e[0]}</i><br><small>(declarative, interrogative, exclamatory, imperative)</small>`,answer:e[1]});
  } return probs;
}

/* ============================================================
   SPELLING / VOCAB
   ============================================================ */
function scramble(R,word){ let a=word.split(''); for(let i=a.length-1;i>0;i--){const j=Math.floor(R.next()*(i+1));[a[i],a[j]]=[a[j],a[i]];} const s=a.join(''); return s===word?scramble(R,word):s; }
function genSpelling(R, opt){
  const probs=[], seen=new Set(); const B=window.BANKS; const g=G(opt); let guard=0;
  const words=(B.SPELLING[g]||B.SPELLING[3]).slice();
  while(probs.length<opt.count && guard++<opt.count*60){
    const w=R.pick(words); const mode=R.pick(['blanks','scramble']);
    const k=mode+w; if(seen.has(k))continue; seen.add(k);
    if(mode==='blanks'){ // remove ~40% of letters
      const chars=w.split(''); const idxs=R.shuffle(chars.map((_,i)=>i)).slice(0,Math.max(1,Math.round(chars.length*0.4)));
      const masked=chars.map((c,i)=>idxs.includes(i)?'_':c).join(' ');
      probs.push({q:`Fill in the blanks: <b>${masked}</b>`,answer:w});
    } else probs.push({q:`Unscramble: <b>${scramble(R,w)}</b>`,answer:w});
  } return probs;
}
function genVocabMatch(R, opt){
  const B=window.BANKS; const g=G(opt);
  const pool=R.shuffle(B.VOCAB[g]||B.VOCAB[3]).slice(0,Math.min(opt.count,10));
  const words=pool.map((p,i)=>({label:String.fromCharCode(65+i),word:p[0]}));
  const defs=R.shuffle(pool.map((p,i)=>({num:i+1,def:p[1],word:p[0]})));
  // answer: for each definition number, which letter
  const answerMap=defs.map(d=>{ const w=words.find(x=>x.word===d.word); return {num:d.num,letter:w.label}; });
  return { single:true, render:'vocabmatch', words, defs, answerMap };
}
function genWordSearch(R, opt){
  const B=window.BANKS; const g=G(opt);
  const words=R.shuffle((B.SPELLING[g]||B.SPELLING[3]).filter(w=>w.length<=9)).slice(0,Math.min(10, Math.max(6,Math.round(opt.count))));
  const size=Math.max(10, Math.min(15, Math.max(...words.map(w=>w.length))+3));
  const grid=Array.from({length:size},()=>Array(size).fill(''));
  const placed=[];
  const dirs=[[0,1],[1,0],[1,1]]; // across, down, diag (no reverse to keep kid-friendly)
  const upper=words.map(w=>w.toUpperCase());
  for(const w of upper){
    let ok=false;
    for(let tries=0;tries<200&&!ok;tries++){
      const dir=R.pick(dirs); const r=R.int(0,size-1),c=R.int(0,size-1);
      const er=r+dir[0]*(w.length-1), ec=c+dir[1]*(w.length-1);
      if(er>=size||ec>=size)continue;
      let fits=true; for(let i=0;i<w.length;i++){const rr=r+dir[0]*i,cc=c+dir[1]*i; if(grid[rr][cc]&&grid[rr][cc]!==w[i]){fits=false;break;}}
      if(!fits)continue;
      const cells=[]; for(let i=0;i<w.length;i++){const rr=r+dir[0]*i,cc=c+dir[1]*i;grid[rr][cc]=w[i];cells.push([rr,cc]);}
      placed.push({word:w,cells}); ok=true;
    }
  }
  const letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for(let r=0;r<size;r++)for(let c=0;c<size;c++)if(!grid[r][c])grid[r][c]=letters[Math.floor(R.next()*26)];
  return { single:true, render:'wordsearch', grid, words:upper, placed, size };
}

/* ============================================================
   READING COMPREHENSION
   ============================================================ */
function genReading(R, opt){
  const B=window.BANKS; const g=G(opt);
  let pool=B.PASSAGES.filter(p=>p.grade===g);
  if(!pool.length) pool=B.PASSAGES.filter(p=>Math.abs(p.grade-g)<=1);
  if(!pool.length) pool=B.PASSAGES;
  const p=R.pick(pool);
  return { single:true, render:'passage', title:p.title, text:p.text, questions:p.questions };
}

/* ============================================================
   EARLY MATH (K-1): counting & shape recognition
   ============================================================ */
function genCounting(R, opt){
  const g=G(opt); const max=g===0?10:20; const kinds=['circle','square','triangle','star'];
  const probs=[];
  for(let i=0;i<opt.count;i++){ const count=R.int(1,max); const kind=R.pick(kinds);
    probs.push({count,kind,answer:String(count)}); }
  return probs;
}
function genShapes(R, opt){
  const g=G(opt);
  const basic=['circle','square','triangle','rectangle','star','oval'];
  const more=basic.concat(['pentagon','hexagon','diamond','trapezoid']);
  const pool=g===0?basic:more; const probs=[];
  for(let i=0;i<opt.count;i++){ const kind=R.pick(pool); probs.push({kind,answer:kind}); }
  return probs;
}

/* ============================================================
   MIXED REVIEW — several topics on one page
   Picks 2-4 array-returning types from the same subject+grade,
   generates a small batch of each. Reproducible by seed.
   ============================================================ */
function genMixed(R, opt){
  const subj=opt.subject, g=G(opt);
  const SKIP=new Set(['passage','vocabmatch','wordsearch','mixed']); // single-content / self
  let pool=Object.keys(TYPE_META).filter(t=>{
    const m=TYPE_META[t];
    return m.subject===subj && m.grades.includes(g) && !SKIP.has(m.layout);
  });
  pool=R.shuffle(pool);
  const n=Math.min(4, Math.max(2, pool.length));
  const chosen=pool.slice(0, n);
  const per=(layout)=> layout==='stack'?8 : layout==='inline'?8 : layout==='clock'?4
    : layout==='geometry'?3 : layout==='currency'?4 : layout==='counting'?6
    : layout==='shapes'?8 : layout==='factfamily'?3 : layout==='fraction'?4 : 4;
  const sections=chosen.map(t=>{
    const m=TYPE_META[t]; const want=per(m.layout);
    const subOpt=Object.assign({}, opt, {type:t, count:want});
    let data=GENERATORS[t](R, subOpt);
    // some generators enforce an internal minimum; cap each section so the
    // combined sheet stays on one page (single-content types are excluded above)
    if(Array.isArray(data) && data.length>want) data=data.slice(0, want);
    return { type:t, label:m.label, layout:m.layout, data };
  });
  return { render:'mixed', sections };
}

/* ============================================================
   DISPATCH + METADATA
   ============================================================ */
const GENERATORS = {
  mixedmath:genMixed, mixedela:genMixed, mixedstem:genMixed,
  addition:genAddition, subtraction:genSubtraction, multiplication:genMultiplication, division:genDivision,
  longmult:genLongMult, longdiv:genLongDiv,
  counting:genCounting, shapes:genShapes,
  comparison:genComparison, placevalue:genPlaceValue, factfamily:genFactFamily,
  orderops:genOrderOps, factors:genFactors, patterns:genPatterns,
  fractions:genFractions, decimals:genDecimals, geometry:genGeometry,
  time:genTime, currency:genCurrency, measurement:genMeasurement, wordproblems:genWordProblems,
  synant:genSynAnt, affixes:genAffixes, pos:genPOS, plurals:genPlurals,
  contractions:genContractions, sentencetype:genSentenceType,
  spelling:genSpelling, vocabmatch:genVocabMatch, wordsearch:genWordSearch,
  reading:genReading,
};

/* subject: math | la | reading ; grades: applicable grade array ; layout ; defaultCount */
const TYPE_META = {
  // ---- MATH ----
  counting:{subject:'math',group:'Early math (K–1)',label:'Counting objects',grades:[0,1],layout:'counting',defaultCount:12},
  shapes:{subject:'math',group:'Early math (K–1)',label:'Shape recognition',grades:[0,1],layout:'shapes',defaultCount:12},
  addition:{subject:'math',group:'Core arithmetic',label:'Addition',grades:[0,1,2,3,4,5],layout:'stack',defaultCount:48,digits:true},
  subtraction:{subject:'math',group:'Core arithmetic',label:'Subtraction',grades:[0,1,2,3,4,5],layout:'stack',defaultCount:48,digits:true},
  multiplication:{subject:'math',group:'Core arithmetic',label:'Multiplication',grades:[3,4,5],layout:'stack',defaultCount:48,digits:true},
  division:{subject:'math',group:'Core arithmetic',label:'Division',grades:[3,4,5],layout:'stack',defaultCount:48,digits:true},
  longmult:{subject:'math',group:'Core arithmetic',label:'Long multiplication',grades:[4,5],layout:'stack',defaultCount:20},
  longdiv:{subject:'math',group:'Core arithmetic',label:'Long division',grades:[4,5],layout:'longdiv',defaultCount:12},
  fractions:{subject:'math',group:'Fractions & decimals',label:'Fractions',grades:[3,4,5],layout:'fraction',defaultCount:20},
  decimals:{subject:'math',group:'Fractions & decimals',label:'Decimals',grades:[4,5],layout:'inline',defaultCount:24},
  comparison:{subject:'math',group:'Number sense',label:'Comparisons (> = <)',grades:[0,1,2,3,4,5],layout:'inline',defaultCount:40},
  placevalue:{subject:'math',group:'Number sense',label:'Place value & rounding',grades:[2,3,4,5],layout:'block',defaultCount:16},
  factfamily:{subject:'math',group:'Number sense',label:'Fact families',grades:[1,2,3,4,5],layout:'factfamily',defaultCount:9},
  orderops:{subject:'math',group:'Number sense',label:'Order of operations',grades:[5],layout:'inline',defaultCount:24},
  factors:{subject:'math',group:'Number sense',label:'Factors, multiples & primes',grades:[4,5],layout:'block',defaultCount:16},
  patterns:{subject:'math',group:'Number sense',label:'Patterns & tables',grades:[0,1,2,3,4,5],layout:'patterns',defaultCount:8},
  geometry:{subject:'math',group:'Geometry & measurement',label:'Geometry (area/perimeter/volume)',grades:[3,4,5],layout:'geometry',defaultCount:9},
  time:{subject:'math',group:'Geometry & measurement',label:'Telling time',grades:[0,1,2,3,4,5],layout:'clock',defaultCount:12},
  currency:{subject:'math',group:'Geometry & measurement',label:'US currency',grades:[2,3,4,5],layout:'currency',defaultCount:12},
  measurement:{subject:'math',group:'Geometry & measurement',label:'Measurement',grades:[2,3,4,5],layout:'inline',defaultCount:24},
  wordproblems:{subject:'math',group:'Applied',label:'Word problems',grades:[1,2,3,4,5],layout:'block',defaultCount:8},
  mixedmath:{subject:'math',group:'Mixed review',label:'Mixed math review',grades:[0,1,2,3,4,5],layout:'mixed',defaultCount:4},
  // ---- LANGUAGE ARTS ----
  synant:{subject:'la',group:'Vocabulary',label:'Synonyms & antonyms',grades:[2,3,4,5],layout:'block',defaultCount:16},
  affixes:{subject:'la',group:'Word study',label:'Prefixes & suffixes',grades:[3,4,5],layout:'block',defaultCount:14},
  pos:{subject:'la',group:'Grammar',label:'Parts of speech',grades:[2,3,4,5],layout:'block',defaultCount:16},
  plurals:{subject:'la',group:'Grammar',label:'Plurals',grades:[2,3,4,5],layout:'inline',defaultCount:20},
  contractions:{subject:'la',group:'Grammar',label:'Contractions',grades:[2,3,4,5],layout:'inline',defaultCount:20},
  sentencetype:{subject:'la',group:'Grammar',label:'Sentence types',grades:[3,4,5],layout:'block',defaultCount:10},
  spelling:{subject:'la',group:'Spelling & vocabulary',label:'Spelling practice',grades:[2,3,4,5],layout:'block',defaultCount:16},
  vocabmatch:{subject:'la',group:'Spelling & vocabulary',label:'Vocabulary match',grades:[2,3,4,5],layout:'vocabmatch',defaultCount:8},
  wordsearch:{subject:'la',group:'Spelling & vocabulary',label:'Word search',grades:[2,3,4,5],layout:'wordsearch',defaultCount:8},
  mixedela:{subject:'la',group:'Mixed review',label:'Mixed language arts review',grades:[2,3,4,5],layout:'mixed',defaultCount:4},
  // ---- READING ----
  reading:{subject:'reading',group:'Comprehension',label:'Reading passage + questions',grades:[1,2,3,4,5],layout:'passage',defaultCount:1},
  // ---- STEM mixed (stem types are merged in from stem.js at runtime) ----
  mixedstem:{subject:'stem',group:'Mixed review',label:'Mixed STEM review',grades:[2,3,4,5],layout:'mixed',defaultCount:4},
};

const SUBJECTS = { math:'Math', la:'Language Arts', reading:'Reading' };

function generateWorksheet(opt){
  const meta=TYPE_META[opt.type]; const R=makeRng(opt.seed);
  const result=GENERATORS[opt.type](R,opt);
  // single-content types (passage, vocabmatch, wordsearch) return an object, not an array
  if(Array.isArray(result)) return { meta, problems:result };
  return { meta, problems:result, single:result };
}

window.WS = { generateWorksheet, GENERATORS, TYPE_META, SUBJECTS, makeRng };
