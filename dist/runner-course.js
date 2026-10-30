import{RUNNER}from'./runner-mode.js';

// Runner sections (runner mode). Between gates the creature runs on its own in three lanes along a long moving
// track; the last CLEARING metres before each gate stay free movement, so tasks and fights keep their feel.
// A run is measured in track metres (`s` below), RUN_SCALE times the real stretch it covers: most of the run
// slides the track under the creature, and its final real metres lead into the gate clearing
// (see runner-control.js). Everything here is deterministic per section, so retries and reloads rebuild it.
// RUN_FROM sits past the short rise at each stretch's start, so the moving track lies on flat valley ground.
export const LANES=[-1.45,0,1.45],LANE_HALF=.74,CLEARING=14,RUN_FROM=8,RUN_LEAD=16,RUN_SCALE=10;
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

// Speed builds from a jog to a sprint over the run, reaching its top just before the clearing.
export function speedRange(mode,chapter=0){const hard=mode==='challenge';return{start:hard?6.6:5.6,top:(hard?12.6:10.4)+.25*chapter};}
export function speedAt(run,s){const t=Math.max(0,Math.min(1,s/(run.length*.88)));return run.start+(run.top-run.start)*t*t*(3-2*t);}
// Obstacles grow with the creature: a hurdle sits at knee height for every Form, and stays below its jump.
export const hurdleHeight=creatureHeight=>Math.max(.5,.62*creatureHeight);

// Each obstacle carries a look from its arena's set; the rules depend only on its type.
export const RUNNER_STYLES={
 barrier:[['log','mushrooms','hedge','crates'],['crates','sandstone','tumbleweed','mushrooms'],['crystals','slime','crates','log']],
 bar:[['vines','trunk','spinner'],['lanterns','banner','spinner'],['laser','spinner','vines']],
 hole:[['pit','water'],['chasm','pit'],['void','pit']],
 swamp:[['swamp'],['quicksand'],['glowmire']],
};

// Word runs: rows of three letters, one row every ROW_SECONDS of running, with a coin trail between rows that
// zig-zags across the lanes (it never points at the answer).
const ROW_SECONDS=2.7;
function wordRun(section,r,run,from){
 const direction=section.chapter%2?'en-tr':'tr-en',target=direction==='tr-en'?'en':'tr';
 const fits=wordBank.filter(w=>w[target].length>=3&&w[target].length<=8);if(!fits.length)return null;
 const word=fits[Math.floor(r()*fits.length)%fits.length],answer=word[target],tokens=[],coins=[];let s=from;
 [...answer].forEach((letter,slot)=>{const lane=Math.floor(r()*3)%3,pool=[...ALPHABET[target]].filter(c=>c!==letter);
  for(let i=0;i<3;i++)tokens.push({id:`${section.id}:letter:${slot}:${i}`,slot,s,lane:i,letter:i===lane?letter:pool[Math.floor(r()*pool.length)%pool.length],correct:i===lane});
  const gap=speedAt(run,s+speedAt(run,s)*ROW_SECONDS)*ROW_SECONDS;if(slot<answer.length-1)for(let i=0;i<4;i++)coins.push({id:`${section.id}:word-coin:${slot}:${i}`,s:s+gap*(.3+i*.12),lateral:LANES[(slot+i)%3===1?1:(slot%2?0:2)],y:.58});
  s+=gap;});
 return{word:{id:word.id,direction,prompt:direction==='tr-en'?word.tr:word.en,answer,language:target,tokens,bonusId:section.id+':word'},coins,end:s};
}

// Beats: a hurdle to jump, a bar to slide under, a hole to dodge or jump, a swamp that slows, or a coin stretch.
// Spacing is measured in reaction time, so faster running keeps the same thinking time between obstacles.
function beat(section,r,mode,run,s,k,lastFree,tutorial){
 const hard=mode==='challenge',roll=r(),type=roll<.26?'barrier':roll<.44?'hole':roll<.58?'swamp':roll<.8?'bar':'coins';
 let lanes=[0,1,2];
 if(type==='hole')lanes=(hard&&!tutorial&&r()<.45)?pick(r,[[0,1],[1,2]]):[Math.floor(r()*3)%3];
 if(type==='swamp')lanes=hard?pick(r,[[0,1],[1,2],[0,2]]):pick(r,[[0],[1],[2],[0,1],[1,2]]);
 if(type==='barrier')lanes=tutorial?[Math.floor(r()*3)%3]:hard&&r()<.4?[0,1,2]:pick(r,[[0],[1],[2],[0,1],[1,2]]);
 if(type==='bar')lanes=tutorial||!hard?pick(r,[[0,1],[1,2],[0,2],[0,1,2]]):[0,1,2];
 const free=[0,1,2].find(l=>!lanes.includes(l)&&l===lastFree)??[0,1,2].find(l=>!lanes.includes(l))??lastFree,looks=RUNNER_STYLES[type]?.[section.area]||RUNNER_STYLES[type]?.[0];
 const obstacle=type==='coins'?null:{id:`${section.id}:run:${type}:${k}`,type,style:looks[Math.floor(r()*looks.length)%looks.length],s,depth:type==='hole'?(hard?2.8:2.3):type==='swamp'?(hard?5.2:4.2):type==='bar'?.5:.45,lanes};
 return{obstacle,free,lanes,type};
}

export function runFor(section,e,mode='relaxed',enabled=RUNNER){
 if(!enabled||!section||section.length<CLEARING+12)return null;
 const r=rngFor(section.id+':'+mode),real=section.length-CLEARING-RUN_FROM,length=Math.round(real*RUN_SCALE),n=section.index%4,hard=mode==='challenge',{start,top}=speedRange(mode,section.chapter);
 const run={from:RUN_FROM,to:section.length-CLEARING,clearFrom:section.length-CLEARING,real,length,start,top,obstacles:[],coins:[],word:null};
 const reaction=hard?1.2:1.6,tutorial=section.chapter===0&&section.index===0,wordAt=n===2?length*.3:Infinity;let s=Math.max(18,start*2.4),k=0,lastFree=1;
 while(s<length-12){
  if(s>=wordAt&&!run.word){const w=wordRun(section,r,run,s);if(w){run.word=w.word;run.coins.push(...w.coins);s=w.end+speedAt(run,w.end)*reaction;continue;}}
  const b=beat(section,r,mode,run,s,k,lastFree,tutorial&&s<length*.25),spacing=speedAt(run,s)*reaction*(.9+r()*.35);
  if(b.obstacle)run.obstacles.push(b.obstacle);
  // Coins lead into the lane that stays open; over a hurdle they arc, inviting the jump.
  const lead=b.type==='coins'?Math.floor(r()*3)%3:b.free;
  for(let i=0;i<5;i++){const cs=s-spacing*.85+i*spacing*.13;if(cs>4)run.coins.push({id:`${section.id}:run-coin:${k}:${i}`,s:cs,lateral:LANES[lead],y:.58});}
  if(b.type==='barrier')for(let i=0;i<3;i++)run.coins.push({id:`${section.id}:run-arc:${k}:${i}`,s:b.obstacle.s-1.2+i*1.2,lateral:LANES[b.lanes[0]],y:.95+[0,.4,0][i],arc:true});
  lastFree=b.free;s+=spacing;k++;
 }
 return run;
}
// Lane span covered by an obstacle, in lateral metres.
export function laneSpan(lanes){return{min:LANES[Math.min(...lanes)]-LANE_HALF,max:LANES[Math.max(...lanes)]+LANE_HALF};}
// Ground under the track at track distance s: flat, with holes. Swamps are ground too (they slow instead).
export function runSurface(run,s,lateral){
 for(const o of run.obstacles)if(o.type==='hole'&&Math.abs(s-o.s)<o.depth/2){const span=laneSpan(o.lanes);if(lateral>span.min+.12&&lateral<span.max-.12)return null;}
 return 0;
}
