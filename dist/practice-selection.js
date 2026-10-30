// Per-unit practice history. It affects content, never creature levels or coins.
const key=s=>String(s??'').trim().toLocaleLowerCase('en').replace(/[\s.…?!,;:]+/g,' ').trim();
const catalogs=new WeakMap();
export const PRACTICE_ROLES=['fresh','fresh','review','fresh','familiar','fresh','review','fresh','fresh','familiar','fresh','review','fresh','fresh','review','familiar','fresh','review','fresh','fresh'];
export function varietySeed(){
 const a=new Uint32Array(4);
 if(globalThis.crypto?.getRandomValues)globalThis.crypto.getRandomValues(a);
 else for(let i=0;i<a.length;i++)a[i]=(Math.random()*4294967296)>>>0;
 return Array.from(a,n=>n.toString(36)).join('-');
}
export function varietyRng(text){let n=2166136261;for(const c of String(text))n=Math.imul(n^c.charCodeAt(0),16777619);return()=>{n^=n<<13;n^=n>>>17;n^=n<<5;return(n>>>0)/4294967296;};}
export function varietyShuffle(items,r){const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

function catalog(unit){
 if(catalogs.has(unit))return catalogs.get(unit);
 const ids=new Map(),words=new Map((unit.vocabulary||[]).map(v=>[key(v.en),'word:'+key(v.en)]));
 for(const v of unit.vocabulary||[])ids.set(v.id,words.get(key(v.en)));
 for(const d of unit.descriptions||[])ids.set(d.id,words.get(key(d.answer))||'definition:'+key(d.answer+'|'+d.clue));
 for(const s of unit.sentences||[])ids.set(s.id,'sentence:'+key(s.answer||s.blocks.join(' ')));
 for(const q of unit.questions||[])ids.set(q.id,'question:'+key(q.prompt+'|'+q.answer));
 for(const g of unit.gaps||[])ids.set(g.id,'sentence:'+key(g.prompt.replace(/_{2,}/,g.answer)));
 for(const g of unit.repairs||[])ids.set(g.id,'sentence:'+key(g.fullCorrect||g.prompt.replace(/_{2,}/,g.answer)));
 for(const c of unit.categories||[]){ids.set(c.id,'category:'+c.id);for(const w of c.yes)ids.set(c.id+':'+w,words.get(key(w))||'word:'+key(w));}
 const result={ids,words};catalogs.set(unit,result);return result;
}
export function practiceKey(unit,item){
 const c=catalog(unit);return c.ids.get(item.id)||(/^(?:number|ordinal)-\d+$/.test(String(item.id))?String(item.id).replace('-',':'):item.en?c.words.get(key(item.en))||'word:'+key(item.en):item.word?'word:'+key(item.word):'record:'+String(item.id));
}
export function upgradePractice(j,unit){
 if(j.practice)return j.practice;
 const p=j.practice={version:1,clock:0,cursor:0,items:{},recent:[],layouts:{}};
 const ids=new Set([...Object.keys(j.seen||{}),...Object.keys(j.mastery||{})]);
 for(const id of ids){const m=j.mastery?.[id],count=Math.max(j.seen?.[id]||0,m?.n||0);if(!count)continue;
  const k=practiceKey(unit,{id}),old=p.items[k];p.items[k]={count:Math.max(count,old?.count||0),last:-100,lastFormat:'',misses:Math.max(m?.miss?1:0,old?.misses||0),reviewAt:0};
 }
 return p;
}

// A shuffled lottery inside each role keeps difficulty from fixing the content order.
// Recently used targets and mistakes still cooling down are avoided when alternatives exist.
export function practiceSelector(unit,p,type,r,depth){
 const reserved=new Set();let advance=0;
 function take(list,n=3,identity=x=>x.id){
  const seen=new Set(),unique=list.filter(x=>{const id=identity(x);if(seen.has(id))return false;seen.add(id);return true;}),picked=[],local=new Set();
  const complexity=x=>x.blocks?x.blocks.length*3+(x.answer||'').split(' ').length:String((x.prompt||x.en||x.clue||x.word||'')+' '+(x.answer||'')).split(/\s+/).length;
  const values=unique.map(complexity).sort((a,b)=>a-b),target=values[Math.floor(Math.max(0,values.length-1)*depth/10)]||0,span=Math.max(1,(values.at(-1)||0)-(values[0]||0));
  while(picked.length<Math.min(n,unique.length)){
   let candidates=unique.filter(x=>!local.has(identity(x)));
   const freshWithinTask=candidates.filter(x=>!reserved.has(practiceKey(unit,x)));if(freshWithinTask.length)candidates=freshWithinTask;
   const cooled=candidates.filter(x=>{const m=p.items[practiceKey(unit,x)];return !m?.misses||m.reviewAt<=p.clock;});if(cooled.length)candidates=cooled;
   const notRecent=candidates.filter(x=>{const m=p.items[practiceKey(unit,x)];return !m||p.clock-m.last>=3;});if(notRecent.length)candidates=notRecent;
   const role=PRACTICE_ROLES[(p.cursor+advance++)%PRACTICE_ROLES.length];
   const tier=x=>{const m=p.items[practiceKey(unit,x)],due=m?.misses&&m.reviewAt<=p.clock;
    if(role==='fresh')return !m?.count?0:due?1:2;
    if(role==='review')return due?0:!m?.count?1:2;
    return m?.count&&!m.misses?0:!m?.count?1:2;
   };
   let ranked=candidates.map(x=>{const m=p.items[practiceKey(unit,x)];return{x,tier:tier(x),score:r()+Math.abs(complexity(x)-target)/span*.3+(m?.count||0)*.015+(m?1/Math.max(1,p.clock-m.last+1):0)-(m?.lastFormat&&m.lastFormat!==type ? .06 : 0)};}).sort((a,b)=>a.tier-b.tier||a.score-b.score);
   // Once the unseen pool is exhausted, fresh slots cycle through its least-used
   // eligible targets in a newly shuffled order instead of favouring a few words.
   if(role==='fresh'){
    const bucket=ranked.filter(v=>v.tier===ranked[0].tier),least=Math.min(...bucket.map(v=>p.items[practiceKey(unit,v.x)]?.count||0));
    ranked=bucket.filter(v=>(p.items[practiceKey(unit,v.x)]?.count||0)===least);
   }
   const x=ranked[0].x;picked.push(x);local.add(identity(x));reserved.add(practiceKey(unit,x));
  }
  return picked;
 }
 return{take,get advance(){return advance;}};
}

function targetKeys(t,i,unit){
 const row=t.kind==='pairs'?t.pairs[i]:t.rounds[i];if(!row)return[];
 if(['listen-multi','instructions'].includes(t.type))return [...new Set(row.answer.map(en=>practiceKey(unit,{en})))];
 if(t.type==='intruder')return['category:'+(row.categoryId||String(row.id).replace(/:\d+$/,''))];
 return[practiceKey(unit,row)];
}
export function notePracticeMistake(j,t,unit){
 const p=upgradePractice(j,unit),i=t.kind==='pairs'?t.selected:t.round;
 t.practiceMissed??=[];
 for(const k of targetKeys(t,i,unit))if(!t.practiceMissed.includes(k)){
  t.practiceMissed.push(k);const m=p.items[k]??={count:0,last:-100,lastFormat:'',misses:0,reviewAt:0};
  m.misses++;m.reviewAt=p.clock+3;
 }
}
export function completePractice(j,t,unit){
 const p=upgradePractice(j,unit);if(!t.complete||t.practiceRecorded)return false;
 const keys=new Set((t.kind==='pairs'?t.pairs:t.rounds).flatMap((_,i)=>targetKeys(t,i,unit)));
 for(const k of keys){const m=p.items[k]??={count:0,last:-100,lastFormat:'',misses:0,reviewAt:0};m.count++;m.last=p.clock;m.lastFormat=t.type;
  if(!t.practiceMissed?.includes(k)){m.misses=0;m.reviewAt=0;}
 }
 p.cursor+=t.practiceAdvance||keys.size;p.clock++;p.recent=[...p.recent,...keys].slice(-60);
 if(t.layoutSignature)p.layouts[t.type]=t.layoutSignature;
 t.practiceRecorded=true;return true;
}

// Layout randomness is stored in the task itself, never applied on resume.
export function finishTaskLayout(t,r,p,advance=0){
 t.practiceAdvance=advance;
 if(t.kind==='pairs'){
  const last=p.layouts[t.type];
  for(let tries=0;tries<12;tries++){
   t.leftOrder=varietyShuffle([0,1,2],r);t.rightOrder=varietyShuffle([0,1,2],r);
   t.layoutSignature=t.leftOrder.join('')+'|'+t.rightOrder.join('');
   if(t.layoutSignature!==last&&!t.leftOrder.every((v,i)=>t.rightOrder[i]===v))break;
  }
 }else{
  for(const q of t.rounds)if(q.kind==='blocks'){
   for(let tries=0;tries<12&&q.blocks.every((b,i)=>b.text===q.correct[i]);tries++)q.blocks=varietyShuffle(q.blocks,r);
   if(q.blocks.every((b,i)=>b.text===q.correct[i])&&q.blocks.some(b=>b.text!==q.blocks[0].text))q.blocks.push(q.blocks.shift());
  }
  const choices=t.rounds.filter(q=>!Array.isArray(q.answer)&&q.options);
  const signature=()=>choices.map(q=>q.options.indexOf(q.answer)).join('|');
  for(let tries=0;tries<12&&signature()===p.layouts[t.type];tries++)for(const q of choices)q.options=varietyShuffle(q.options,r);
  t.layoutSignature=signature();
 }
 return t;
}

export function newFormatPlan(types,j){
 const contentSeed=varietySeed(),r=varietyRng(contentSeed),formatOrder=varietyShuffle(types,r);
 // The very first guided encounter teaches matching. Replays have no fixed opener.
 if(!j.practice?.clock&&j.serial===1&&j.level===0){const i=formatOrder.indexOf('translation');[formatOrder[0],formatOrder[i]]=[formatOrder[i],formatOrder[0]];}
 return{varietyVersion:1,contentSeed,formatOrder};
}
export function validPractice(j){
 const p=j.practice;if(p===undefined)return true;
 if(!p||p.version!==1||!Number.isSafeInteger(p.clock)||p.clock<0||!Number.isSafeInteger(p.cursor)||p.cursor<0||!p.items||typeof p.items!=='object'||Array.isArray(p.items)||Object.keys(p.items).length>5000||!Array.isArray(p.recent)||p.recent.length>60||p.recent.some(k=>typeof k!=='string'||k.length>2000)||!p.layouts||typeof p.layouts!=='object'||Array.isArray(p.layouts)||Object.keys(p.layouts).length>20)return false;
 return Object.entries(p.items).every(([k,m])=>k.length<=2000&&m&&Number.isSafeInteger(m.count)&&m.count>=0&&Number.isSafeInteger(m.last)&&m.last>=-100&&m.last<=p.clock&&typeof m.lastFormat==='string'&&m.lastFormat.length<=30&&Number.isSafeInteger(m.misses)&&m.misses>=0&&Number.isSafeInteger(m.reviewAt)&&m.reviewAt>=0)&&Object.values(p.layouts).every(v=>typeof v==='string'&&v.length<=100);
}
