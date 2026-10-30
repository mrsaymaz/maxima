// Spaced recall drives Wordex stars and review selection. Current creature forms follow path-growth.js; legacy thresholds remain available for older journeys.
// Each item sits in a box 0–5. A correct answer while the item is due moves it up one box;
// a miss drops it one box and makes it due again in the same run, so missed words come back later.
export const BOX_DAYS=[0,0,1,3,7,16];
// Cumulative growth needed to leave each level, for a median-sized unit (136 items); scaled per unit.
export const GROWTH_POINTS=[8,20,34,50,70,92,118,148,182,220,260];
export const GROWTH_MASTERED=[0,0,0,4,8,13,19,26,34,44,56];
export const MEDIAN_POOL=136;

export function dayNumber(now=Date.now()){const offset=new Date(now).getTimezoneOffset()*60000;return Math.floor((now-offset)/86400000);}
export function poolSize(unit){if(!unit)return MEDIAN_POOL;const ids=new Set();for(const k of['vocabulary','descriptions','sentences','questions','gaps','repairs'])for(const x of unit[k]||[])ids.add(x.id);for(const c of unit.categories||[])for(const w of c.yes||[])ids.add(c.id+':'+w);return ids.size||MEDIAN_POOL;}
export function isDue(m,day,run){if(!m)return true;if(m.miss)return true;if(m.b<=1)return m.dr==null||run>=m.dr;return day>=m.dd;}
export function points(j){let n=0;for(const m of Object.values(j.mastery||{}))n+=Math.max(0,Math.min(5,m.b|0));return n;}
export function masteredCount(j){let n=0;for(const m of Object.values(j.mastery||{}))if(m.b>=3)n++;return n;}
export function growthNeed(j,pool=j.pool||MEDIAN_POOL){const s=Math.max(.75,Math.min(1.25,pool/MEDIAN_POOL)),level=Math.max(0,Math.min(10,j.level|0));return{points:Math.round(GROWTH_POINTS[level]*s),mastered:Math.round(GROWTH_MASTERED[level]*s)};}
export function masteryReady(j){const need=growthNeed(j);return points(j)>=need.points&&masteredCount(j)>=need.mastered;}
// Progress toward the next form, 0..1, blending points and spaced mastery.
export function growthProgress(j){const need=growthNeed(j),previous=j.level>0?growthNeed({...j,level:j.level-1}):{points:0,mastered:0},span=Math.max(1,need.points-previous.points),p=Math.max(0,Math.min(1,(points(j)-previous.points)/span)),m=need.mastered?Math.min(1,masteredCount(j)/need.mastered):1;return Math.min(p,m);}

// Records one answered item. Returns how many boxes it gained (negative after a miss).
export function recordAnswer(j,id,correct,{day=dayNumber(),run=j.runCount||0}={}){
 if(!id)return 0;j.mastery??={};const m=j.mastery[id]??={b:0,dd:day,dr:run,n:0,w:0};const before=m.b,due=isDue(m,day,run);m.n++;m.ld=day;
 if(correct){if(m.miss){m.b=Math.max(m.b,1);m.miss=false;}else if(due)m.b=Math.min(5,m.b+1);}
 else{m.w++;m.miss=true;m.b=Math.max(0,m.b-1);}
 m.dd=day+(m.miss?0:BOX_DAYS[m.b]);m.dr=m.miss?run:m.b<=1?run+1:null;
 return m.b-before;
}
// Lower values are chosen first by task generation: missed, then due, then new, then not yet due.
export function reviewPriority(j,{day=dayNumber(),run=j.runCount||0}={}){const p={};for(const[id,m]of Object.entries(j.mastery||{}))p[id]=m.miss?-3:isDue(m,day,run)?-2+Math.max(-.9,(m.dd-day)*.05):1+m.b+(m.n||0)*.01;return p;}
export function dueCount(j,{day=dayNumber(),run=j.runCount||0}={}){let n=0;for(const m of Object.values(j.mastery||{}))if(m.b>0&&isDue(m,day,run))n++;return n;}

// Which tracked items a completed round or pair practised. Synthetic or unbounded items are not tracked.
export function itemIds(task,index,unit){
 const item=task.kind==='pairs'?task.pairs[index]:task.rounds[index];if(!item?.id)return[];
 if(['listen-multi','instructions'].includes(task.type)){const byWord=new Map((unit?.vocabulary||[]).map(v=>[v.en,v.id]));return(item.answer||[]).map(w=>byWord.get(w)).filter(Boolean);}
 if(task.type==='intruder'||task.type==='numbers'||String(item.id).startsWith('number-')||String(item.id).startsWith('ordinal-'))return[];
 const ids=[item.id];if(['definition','clue'].includes(task.type)&&unit){const word=task.kind==='pairs'?item.left:item.answer,v=unit.vocabulary.find(x=>x.en===word);if(v)ids.push(v.id);}
 return ids;
}
// Older journeys keep a head start: anything already practised starts in box 1 and is due now.
export function upgradeMastery(j,day=dayNumber()){if(j.mastery)return j;j.mastery={};for(const[id,n]of Object.entries(j.seen||{}))if(n>0&&!String(id).startsWith('number-'))j.mastery[id]={b:1,dd:day,dr:0,n,w:0};j.runCount??=0;j.formatCursor??=0;return j;}
export function validMastery(j){if(j.mastery===undefined)return true;if(!j.mastery||typeof j.mastery!=='object'||Array.isArray(j.mastery)||Object.keys(j.mastery).length>5000)return false;for(const m of Object.values(j.mastery))if(!m||!Number.isInteger(m.b)||m.b<0||m.b>5||!Number.isFinite(m.dd)||!Number.isInteger(m.n)||m.n<0)return false;return(j.runCount===undefined||Number.isInteger(j.runCount)&&j.runCount>=0)&&(j.formatCursor===undefined||Number.isInteger(j.formatCursor)&&j.formatCursor>=0);}

// Wordex: every vocabulary word with its best mastery box (vocabulary or matching description item).
export function wordex(j,unit){const boxes=j.mastery||{},byWord=new Map();for(const d of unit.descriptions||[])byWord.set(d.answer,d.id);return unit.vocabulary.filter((v,i,a)=>a.findIndex(x=>x.en.toLowerCase()===v.en.toLowerCase())===i).map(v=>{const a=boxes[v.id]?.b||0,b=boxes[byWord.get(v.en)]?.b||0;return{...v,box:Math.max(a,b),misses:(boxes[v.id]?.w||0)};});}
