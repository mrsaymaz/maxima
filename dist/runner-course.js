import{RUNNER}from'./runner-mode.js';

// Runner sections (runner mode). Between gates the creature runs on its own in three lanes along a long moving
// track. Gates guarded by rivals keep a CLEARING of free movement for the fight; other runs end GATE_RUNUP metres
// before the gate, where the creature skids to a stop and the gate's task opens.
// A run is measured in track metres (`s` below), RUN_SCALE times the real stretch it covers: most of the run
// slides the track under the creature, and its final real metres lead into the gate clearing
// (see runner-control.js). Everything here is deterministic per section, so retries and reloads rebuild it.
// RUN_FROM sits past the short rise at each stretch's start, so the moving track lies on flat valley ground.
export const LANES=[-1.45,0,1.45],LANE_HALF=.74,CLEARING=14,RUN_FROM=8,RUN_LEAD=16,RUN_SCALE=10,GATE_RUNUP=3;
// Gates guarded by rivals keep a clearing for the fight; every other run goes right up to its gate and skids to a stop.
export const gateRival=s=>s.adventure===2?!!s.rival:(s.baseKind??s.kind)==='coins'&&[0,2,4].includes(s.chapter);
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
 if(type==='swamp')lanes=hard?pick(r,[[0,1],[1,2]]):pick(r,[[0],[1],[2],[0,1],[1,2]]);
 if(type==='barrier')lanes=tutorial?[Math.floor(r()*3)%3]:hard&&r()<.4?[0,1,2]:pick(r,[[0],[1],[2],[0,1],[1,2]]);
 if(type==='bar')lanes=tutorial||!hard?pick(r,[[0,1],[1,2],[0,2],[0,1,2]]):[0,1,2];
 const free=[0,1,2].find(l=>!lanes.includes(l)&&l===lastFree)??[0,1,2].find(l=>!lanes.includes(l))??lastFree,looks=RUNNER_STYLES[type]?.[section.area]||RUNNER_STYLES[type]?.[0];
 const obstacle=type==='coins'?null:{id:`${section.id}:run:${type}:${k}`,type,style:looks[Math.floor(r()*looks.length)%looks.length],s,depth:type==='hole'?(hard?2.8:2.3):type==='swamp'?(hard?5.2:4.2):type==='bar'?.5:.45,lanes};
 return{obstacle,free,lanes,type};
}

// Trial moments: the six old trials, rebuilt for lanes. One or two per run, rotating so that every chapter
// (seven moments over its four runs) shows all six. Each returns its obstacles, coins and the track it uses.
export const RUN_MOMENTS=['boulders','wind','stones','crystal','thorns','ledge'];
const MOMENT_SLOTS=[[0],[1,2],[3],[4,5]];
function moment(kind,section,r,run,s,hard){
 const v=speedAt(run,s),id=`${section.id}:moment:${kind}:${Math.round(s)}`,obstacles=[],coins=[],coin=(k,cs,lane,y=.58)=>coins.push({id:`${id}:coin:${k}`,s:cs,lateral:LANES[lane],y});
 if(kind==='boulders'){
  // Boulders roll toward the creature down one lane at a time; an amber stripe warns which lane is next.
  const len=v*6,count=Math.ceil(6/(hard?1.1:1.4)),pattern=Array.from({length:count},(_,i)=>(Math.floor(r()*3)+i)%3);
  obstacles.push({id,type:'boulders',s:s+len/2,depth:len,start:s,end:s+len,lanes:[0,1,2],pattern,interval:hard?1.1:1.4,roll:hard?6:4.5});
  for(let i=0;i<6;i++)coin(i,s+len*(.1+i*.14),i%2?0:2);return{obstacles,coins,length:len};
 }
 if(kind==='wind'){
  // Gusts push the creature one lane downwind after a warning; the coins sit in the upwind lane.
  const len=v*7.5,dir=r()<.5?-1:1,upwind=dir>0?0:2;obstacles.push({id,type:'wind',s:s+len/2,depth:len,start:s,end:s+len,lanes:[0,1,2],dir,period:hard?2.1:2.6});
  for(let i=0;i<9;i++)coin(i,s+len*(.08+i*.1),upwind);return{obstacles,coins,length:len};
 }
 if(kind==='stones'){
  // A stream with stepping stones in one lane per row: hop between lanes to stay on the stones.
  const rows=hard?7:5,row=v*1.05,first=Math.floor(r()*3)%3;let open=first;
  // Water is split into runs of neighbouring lanes (a lane span covers everything between its ends).
  for(let i=0;i<rows;i++){const cs=s+row*(i+.5),wet=open===1?[[0],[2]]:[[0,1,2].filter(l=>l!==open)];wet.forEach((lanes,k)=>obstacles.push({id:`${id}:water:${i}:${k}`,type:'hole',style:'stream',s:cs,depth:row,lanes,stream:{start:s,first}}));obstacles.push({id:`${id}:stone:${i}`,type:'stone',s:cs,depth:row,lanes:[open]});coin(i,cs,open);
   open=open===1?(r()<.5?0:2):1;}
  return{obstacles,coins,length:row*rows};
 }
 if(kind==='crystal'){
  // A crystal gate fills all lanes; Cast shatters it from up to 18 m away. Running into it is a stumble.
  const gates=hard?2:1;for(let i=0;i<gates;i++)obstacles.push({id:`${id}:${i}`,type:'crystal',s:s+v*(2.2+i*2.6),depth:.8,lanes:[0,1,2]});
  for(let i=0;i<5;i++)coin(i,s+v*(2.6+i*.3),1);return{obstacles,coins,length:v*(2.6*gates+1)};
 }
 if(kind==='thorns'){
  // Thorn hedges in each lane rise and fall in turn; one lane is always open.
  const rows=hard?4:3,gap=v*1.9;for(let i=0;i<rows;i++)obstacles.push({id:`${id}:${i}`,type:'thorns',s:s+gap*(i+.5),depth:.9,lanes:[0,1,2],period:hard?2:2.6,phase:i*.21});
  return{obstacles,coins,length:gap*rows};
 }
 // The higher route: a ramp onto a raised ledge in one lane with bonus coins; the other lanes stay clear.
 const lane=Math.floor(r()*3)%3,ramp=5,top=v*4,h=1.2,len=ramp+top;
 obstacles.push({id,type:'ledge',s:s+len/2,depth:len,start:s,end:s+len,ramp,h,lanes:[lane]});
 for(let i=0;i<8;i++)coin(i,s+ramp+top*(.08+i*.12),lane,h+.58);return{obstacles,coins,length:len};
}
// Power-ups: a coin magnet, a shield, double coins and a creature dash, two or three per run in open lanes.
export const POWERUPS=['magnet','shield','double','dash'];

// The guardian. It stays ahead of the creature at its true size and chases with lane versions of its own arena
// attacks (guardian-attacks.js), each after a warning: amber lanes are dangerous, a blue lane is the way through.
//  Mossback Warden:     seed pods that become thorn bushes (change lane) · Canopy Slam shockwave (jump) ·
//                       roots racing down a lane (change lane)
//  Galecrest Warden:    Orbit Volley stones aimed at your lane (keep switching) · Gale Sweep wall (jump) ·
//                       Sky Dive: a crash into your lane, then its shockwave (switch, then jump)
//  Stormglass Sentinel: Shard Rain crystals in two lanes (take the blue lane) · Storm Chain with one open lane
//                       (jump or take the gap) · Prism Beam that bounces into a second lane (read both lanes)
// Sightings in the last run of chapters 2, 3 and 4 (code chapters 1–3) teach one attack at a time and grow
// longer and fiercer; the final chase, from the last chest to the guardian's arena, tests all of them.
export const CHASE_KITS=[['seeds','slam','roots'],['volley','gale','dive'],['shards','chain','prism']];
export const CHASE_WAVES=['slam','gale','chain'],CHASE_STREAKS=['roots','prism'];
export const SIGHTINGS={1:{duration:10,attacks:[0,0]},2:{duration:12.5,attacks:[0,1,0]},3:{duration:15,attacks:[0,1,2,0,1]}};
export const GUARDIAN_ENTER=1.5,GUARDIAN_LEAVE=2,VOLLEY_SHOTS=3,VOLLEY_GAP=.75;
const kitFor=area=>CHASE_KITS[area]||CHASE_KITS[0];
// One planned attack. Lanes are fixed in the plan, except Volley and Sky Dive, which aim at the lane the
// creature is in when the warning starts ('aim').
// `standing` is the lanes still blocked by the previous attack's bushes or crystals: the next attack always
// leaves one of the other lanes open, so two attacks never close the track between them.
function chaseAttack(kind,t,r,standing=[]){const free=[0,1,2].filter(l=>!standing.includes(l)),pick=list=>list[Math.floor(r()*list.length)%list.length];
 let lane=Math.floor(r()*3)%3,other=(lane+1+Math.floor(r()*2))%3;
 if(kind==='shards'&&standing.length)lane=pick(free);
 if(kind==='prism'&&standing.length){const open=pick(free),pair=[0,1,2].filter(l=>l!==open);lane=pair[Math.floor(r()*2)%2];other=pair.find(l=>l!==lane);}
 if(kind==='volley')return Array.from({length:VOLLEY_SHOTS},(_,i)=>({kind,t:t+i*VOLLEY_GAP,lane:'aim',shot:i}));
 if(kind==='dive')return[{kind,t,lane:'aim'}];
 if(kind==='shards')return[{kind,t,lane,lanes:[0,1,2].filter(l=>l!==lane),gap:lane}];
 if(kind==='chain')return[{kind,t,lane,gap:lane}];
 if(kind==='prism')return[{kind,t,lane,lanes:[lane,other],turn:other}];
 return[{kind,t,lane}];}
const tailOf=kind=>kind==='volley'?(VOLLEY_SHOTS-1)*VOLLEY_GAP:0;
const standingAfter=list=>{const a=list.at(-1);return a?.kind==='seeds'?[a.lane]:a?.kind==='shards'?a.lanes:[];};
function planAttacks(kinds,times,r){const out=[];kinds.forEach((k,i)=>out.push(...chaseAttack(k,times[i],r,standingAfter(out))));return out;}
function sighting(section,r,run,s,hard,level,area){
 // The first warning begins only after the guardian has risen and roared; the last attack lands before it leaves.
 const plan=SIGHTINGS[level],kinds=plan.attacks.map(i=>kitFor(area)[i]),v=speedAt(run,s),warn=hard?.85:1.2,first=GUARDIAN_ENTER+.5+warn,gap=(plan.duration-GUARDIAN_LEAVE-.6-first-tailOf(kinds.at(-1)))/Math.max(1,kinds.length-1);
 const o={id:`${section.id}:guardian:${level}`,type:'guardian',level,area,start:s,duration:plan.duration,warn,attacks:planAttacks(kinds,kinds.map((k,i)=>first+i*gap),r),lanes:[0,1,2]};
 o.depth=v*plan.duration*1.15;o.end=s+o.depth;o.s=s+o.depth/2;
 return{obstacles:[o],coins:[],length:o.depth};
}
// What the warning says, shown with the amber or blue lane.
export function chaseWarning(a){const side=l=>l===0?'◀':l===2?'▶':'▲',kind=a.kind;
 if(kind==='slam')return{text:'Canopy Slam · Jump!',style:'swamp'};if(kind==='gale')return{text:'Gale wall · Jump!',style:'swamp'};
 if(kind==='chain')return{text:`Storm Chain · jump or ${side(a.gap)} blue lane`,style:'swamp'};
 if(kind==='shards')return{text:`Crystals · ${side(a.gap)} blue lane`,style:'stumble'};
 if(kind==='dive')return{text:'Sky Dive · switch, then jump!',style:'stumble'};
 if(kind==='volley')return{text:'Volley · switch lanes!',style:'stumble'};
 if(kind==='prism')return{text:'Prism Beam · it bounces!',style:'stumble'};
 return{text:`${side(a.lane)} ${kind==='roots'?'Roots':'Seed pod'}`,style:'stumble'};}
// The chapter's reward chest stands on the track under an arch across all lanes: running through it opens it.
// It goes on the first run of the next chapter (and on the final chase), with a clear stretch around it.
export const CHEST_CLEAR=9;
function placeChest(run,id){const s=Math.round(Math.min(48,run.length*.12)),near=o=>Math.abs((o.s??0)-s)<CHEST_CLEAR+(o.depth||0)/2;
 run.obstacles=run.obstacles.filter(o=>o.type==='guardian'||!near(o));run.coins=run.coins.filter(c=>Math.abs(c.s-s)>3);run.powerups=(run.powerups||[]).filter(p=>Math.abs(p.s-s)>4);run.chest={id,s};}
export function finaleRun(section,mode='relaxed'){
 const hard=mode==='challenge',r=rngFor(section.id+':finale:'+mode),{start,top}=speedRange(mode,4),real=Math.max(4,section.length-4-1),length=hard?720:620;
 const run={from:1,to:section.length-4,clearFrom:section.length-4,real,length,start,top:top+.6,obstacles:[],coins:[],word:null,moments:['guardian'],powerups:[],finale:true};
 const area=section.area||0,kit=kitFor(area),cycle=[0,1,2,0,2,1,0].map(i=>kit[i]),attacks=[];let t=GUARDIAN_ENTER+.5+(hard?.8:1.15);for(let i=0;t<160;i++){const kind=cycle[i%cycle.length];attacks.push(...chaseAttack(kind,t,r,standingAfter(attacks)));t+=tailOf(kind)+Math.max(hard?1.4:1.8,(hard?2.4:2.9)-i*.04)+(kind==='dive'?1:0);}
 run.obstacles.push({id:`${section.id}:guardian:finale`,type:'guardian',level:4,area,finale:true,start:6,end:length-real-4,s:(length-real)/2,depth:length-real-10,duration:999,warn:hard?.8:1.15,attacks,lanes:[0,1,2]});
 for(let k=0;k*24+30<length-30;k++){const lane=k%3===1?1:(k%2?0:2);for(let i=0;i<4;i++)run.coins.push({id:`${section.id}:chase-coin:${k}:${i}`,s:30+k*24+i*2.2,lateral:LANES[lane],y:.58});}
 run.powerups.push({id:`${section.id}:power:shield:chase`,kind:'shield',s:length*.18,lane:1},{id:`${section.id}:power:magnet:chase`,kind:'magnet',s:length*.5,lane:0},{id:`${section.id}:power:dash:chase`,kind:'dash',s:length*.78,lane:2});
 placeChest(run,`${section.id}:chest`);
 return run;
}
export function runFor(section,e,mode='relaxed',enabled=RUNNER){
 if(!enabled||!section||section.length<CLEARING+12)return null;
 const clearing=gateRival(section)?CLEARING:GATE_RUNUP,r=rngFor(section.id+':'+mode),real=section.length-clearing-RUN_FROM,length=Math.round(real*RUN_SCALE),n=section.index%4,hard=mode==='challenge',{start,top}=speedRange(mode,section.chapter);
 const run={from:RUN_FROM,to:section.length-clearing,clearFrom:section.length-clearing,rival:clearing===CLEARING,real,length,start,top,obstacles:[],coins:[],word:null};
 const reaction=hard?1.2:1.6,tutorial=section.chapter===0&&section.index===0,wordAt=n===2?length*.3:Infinity;let s=Math.max(18,start*2.4),k=0,lastFree=1;
 const offset=(section.chapter+(e?.area||0)+(e?.serial||0))%6,kinds=MOMENT_SLOTS[n].map(i=>RUN_MOMENTS[(i+offset)%6]),momentAt=kinds.map((_,i)=>length*(kinds.length===1?(n===2?.75:.55):[.38,.72][i]));
 const sightingLevel=n===3&&SIGHTINGS[section.chapter]?section.chapter:0,sightingAt=sightingLevel?length*.5:Infinity;if(sightingLevel){momentAt[0]=length*.12;momentAt[1]=length*.3;}
 const powers=Array.from({length:length>350?3:2},(_,i)=>({at:length*(.22+i*(length>350?.27:.36)),kind:POWERUPS[(section.index+i+section.chapter)%4]}));run.moments=kinds;run.powerups=[];
 while(s<length-12){
  // A power-up whose spot fell inside a moment or sighting waits just before the next one.
  const pending=()=>{while(powers.length&&powers[0].at<=s){const p=powers.shift();run.powerups.push({id:`${section.id}:power:${p.kind}:m${k++}`,kind:p.kind,s:s-2,lane:lastFree});}};
  if(s>=sightingAt&&!run.obstacles.some(o=>o.type==='guardian')){pending();const g=sighting(section,r,run,s+speedAt(run,s)*.6,hard,sightingLevel,section.area??e?.area??0);run.obstacles.push(...g.obstacles);s+=speedAt(run,s)*.6+g.length+speedAt(run,s)*reaction;continue;}
  if(momentAt.length&&s>=momentAt[0]&&!(run.word&&s<run.word.tokens.at(-1).s)){pending();momentAt.shift();const kind=kinds[kinds.length-momentAt.length-1],m=moment(kind,section,r,run,s+speedAt(run,s)*.6,hard);if(s+speedAt(run,s)*.6+m.length>length-15)continue;run.obstacles.push(...m.obstacles);run.coins.push(...m.coins);s+=speedAt(run,s)*.6+m.length+speedAt(run,s)*reaction*1.2;lastFree=1;continue;}
  if(s>=wordAt&&!run.word){const w=wordRun(section,r,run,s);if(w){run.word=w.word;run.coins.push(...w.coins);s=w.end+speedAt(run,w.end)*reaction;continue;}}
  const b=beat(section,r,mode,run,s,k,lastFree,tutorial&&s<length*.25),spacing=speedAt(run,s)*reaction*(.9+r()*.35);
  if(b.obstacle)run.obstacles.push(b.obstacle);
  // Coins lead into the lane that stays open; over a hurdle they arc, inviting the jump.
  const lead=b.type==='coins'?Math.floor(r()*3)%3:b.free;
  for(let i=0;i<5;i++){const cs=s-spacing*.85+i*spacing*.13;if(cs>4)run.coins.push({id:`${section.id}:run-coin:${k}:${i}`,s:cs,lateral:LANES[lead],y:.58});}
  if(b.type==='barrier')for(let i=0;i<3;i++)run.coins.push({id:`${section.id}:run-arc:${k}:${i}`,s:b.obstacle.s-1.2+i*1.2,lateral:LANES[b.lanes[0]],y:.95+[0,.4,0][i],arc:true});
  if(powers.length&&s>=powers[0].at&&b.type!=='barrier'){const p=powers.shift();run.powerups.push({id:`${section.id}:power:${p.kind}:${k}`,kind:p.kind,s:s-spacing*.4,lane:b.free});}
  lastFree=b.free;s+=spacing;k++;
 }
 if(section.index%4===0&&section.index>0)placeChest(run,`${section.id}:chest`);
 return run;
}
// Lane span covered by an obstacle, in lateral metres.
export function laneSpan(lanes){return{min:LANES[Math.min(...lanes)]-LANE_HALF,max:LANES[Math.max(...lanes)]+LANE_HALF};}
// Ground under the track at track distance s: flat, with holes. Swamps are ground too (they slow instead).
// Ledges raise their lane (a ramp, then a flat top). Holes in `bridged` (shield or dash) carry the creature.
export function runSurface(run,s,lateral,bridged=null){
 let ground=0;
 for(const o of run.obstacles){
  if(o.type==='ledge'&&s>=o.start&&s<=o.end){const span=laneSpan(o.lanes);if(lateral>span.min+.1&&lateral<span.max-.1)ground=Math.max(ground,o.h*Math.min(1,(s-o.start)/o.ramp));continue;}
  if(o.type==='hole'&&Math.abs(s-o.s)<o.depth/2&&!bridged?.has(o.id)){const span=laneSpan(o.lanes);if(lateral>span.min+.12&&lateral<span.max-.12)return null;}
 }
 return ground;
}
