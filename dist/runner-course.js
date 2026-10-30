import{RUNNER}from'./runner-mode.js';

// Runner sections (runner mode only). Between gates the creature runs on its own in three lanes; the last
// CLEARING metres before each gate stay free movement, so tasks and fights keep their current feel.
// Everything here is deterministic per section, so a course rebuilds identically after reloads and retries.
export const LANES=[-1.45,0,1.45],LANE_HALF=.74,CLEARING=14,RUN_FROM=2.5;
const rngFor=text=>{let h=2166136261;for(const c of String(text)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return()=>{h=Math.imul(h^(h>>>15),2246822507)^Math.imul(h^(h>>>13),3266489909);return((h^=h>>>16)>>>0)/4294967296;};};
const pick=(r,list)=>list[Math.floor(r()*list.length)%list.length];

// The current lesson's word pairs; word runs ask for one of them letter by letter.
let wordBank=[];
export function setRunnerWords(vocabulary=[]){
 wordBank=vocabulary.filter(v=>typeof v?.en==='string'&&typeof v?.tr==='string').map(v=>({id:v.id,en:v.en.trim().toLowerCase(),tr:v.tr.trim().toLocaleLowerCase('tr')}))
  .filter(v=>/^[a-z]+$/.test(v.en)&&/^[a-zçğıöşü]+$/.test(v.tr));
}
export const runnerWords=()=>wordBank;
const ALPHABET={en:'abcdefghijklmnopqrstuvwxyz',tr:'abcçdefgğhıijklmnoöprsştuüvyz'};

export function speedFor(mode,chapter){return(mode==='challenge'?7.4:6.2)+.22*chapter;}

function wordRun(section,r,runTo){
 const direction=section.chapter%2?'en-tr':'tr-en',target=direction==='tr-en'?'en':'tr',spacing=6.4,first=8,maxLetters=Math.floor((runTo-3-first)/spacing)+1;
 const fits=wordBank.filter(w=>w[target].length>=3&&w[target].length<=Math.min(8,maxLetters));if(!fits.length)return null;
 const word=fits[Math.floor(r()*fits.length)%fits.length],answer=word[target],letters=[...answer],tokens=[];
 letters.forEach((letter,slot)=>{const s=first+slot*spacing,lane=Math.floor(r()*3)%3,pool=[...ALPHABET[target]].filter(c=>c!==letter);
  for(let i=0;i<3;i++)tokens.push({id:`${section.id}:letter:${slot}:${i}`,slot,s,lane:i,letter:i===lane?letter:pool[Math.floor(r()*pool.length)%pool.length],correct:i===lane});});
 return{id:word.id,direction,prompt:direction==='tr-en'?word.tr:word.en,answer,language:target,tokens,bonusId:section.id+':word'};
}

// Beats: a barrier to jump, a bar to slide under, a hole to dodge or jump, or a free coin stretch.
function beats(section,r,mode,runTo,quiet){
 const hard=mode==='challenge',spacing=quiet?16:hard?7.6:10,list=[],coins=[];let s=8,k=0,lastFree=1;
 const tutorial=section.chapter===0&&section.index===0;
 while(s<runTo-3){
  const roll=r(),type=quiet?'coins':roll<.3?'barrier':roll<.55?'hole':roll<.75?'bar':'coins';
  let lanes=[0,1,2];
  if(type==='hole')lanes=(hard&&!tutorial&&r()<.45)?pick(r,[[0,1],[1,2]]):[Math.floor(r()*3)%3];
  if(type==='barrier')lanes=tutorial?[Math.floor(r()*3)%3]:hard&&r()<.4?[0,1,2]:pick(r,[[0],[1],[2],[0,1],[1,2]]);
  if(type==='bar')lanes=tutorial||!hard?pick(r,[[0,1],[1,2],[0,2],[0,1,2]]):[0,1,2];
  const free=[0,1,2].find(l=>!lanes.includes(l)&&l===lastFree)??[0,1,2].find(l=>!lanes.includes(l))??lastFree;
  if(type!=='coins')list.push({id:`${section.id}:run:${type}:${k}`,type,s,depth:type==='hole'?(hard?2.8:2.3):type==='bar'?.5:.45,lanes,h:type==='barrier'?.5:0});
  // Coins lead into the lane that stays open; over a barrier they arc, inviting the jump.
  const lead=type==='coins'?Math.floor(r()*3)%3:free;
  for(let i=0;i<4;i++){const cs=s-spacing+2.2+i*1.5;if(cs>RUN_FROM+1)coins.push({id:`${section.id}:run-coin:${k}:${i}`,s:cs,lateral:LANES[lead],y:.58});}
  if(type==='barrier')for(let i=0;i<3;i++)coins.push({id:`${section.id}:run-arc:${k}:${i}`,s:s-1+i,lateral:LANES[lanes[0]],y:.95+[0,.38,0][i]});
  lastFree=free;s+=spacing*(.85+r()*.3);k++;
 }
 return{obstacles:list,coins};
}

export function runFor(section,e,mode='relaxed',enabled=RUNNER){
 if(!enabled||!section||section.length<CLEARING+12)return null;
 const r=rngFor(section.id+':'+mode),runTo=section.length-CLEARING,n=section.index%4;
 const word=n===2?wordRun(section,r,runTo):null;
 const{obstacles,coins}=beats(section,r,mode,runTo,!!word);
 return{from:RUN_FROM,to:runTo,clearFrom:runTo,speed:speedFor(mode,section.chapter),obstacles,coins,word};
}
// Lane span covered by an obstacle, in lateral metres.
export function laneSpan(lanes){return{min:LANES[Math.min(...lanes)]-LANE_HALF,max:LANES[Math.max(...lanes)]+LANE_HALF};}
// Ground under a runner section: flat, with holes. Undefined outside the run.
export function runSurface(section,s,lateral){
 const run=section.run;if(!run||s<run.from||s>run.to+1)return undefined;
 for(const o of run.obstacles)if(o.type==='hole'&&Math.abs(s-o.s)<o.depth/2){const span=laneSpan(o.lanes);if(lateral>span.min+.12&&lateral<span.max-.12)return null;}
 return 0;
}
