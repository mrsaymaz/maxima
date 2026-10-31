import{courseCoordinates,localPoint}from'./traversal-layout.js';
import{LANES,LANE_HALF,RUN_LEAD,laneSpan,speedAt,runSurface,hurdleHeight,finaleRun,GUARDIAN_ENTER,GUARDIAN_LEAVE,CHASE_WAVES}from'./runner-course.js';
import{activeNode,approachPoint}from'./trail-layout.js';

// Drives the creature through a runner section on a moving track. Progress is measured in track metres (`s`,
// up to run.length). While s is below run.length - run.real the creature holds its place in the valley and the
// track slides beneath it; the final run.real metres are real running into the gate clearing, so the run ends
// exactly where the valley expects. Lanes are real lateral offsets either way.
// Lane changes, slides, jumps, Cast and Boost arrive as discrete requests from keys, swipes and buttons.
export const POWER_SECONDS={magnet:8,double:10,dash:2.5};
const BOULDER_HEIGHT=1,THORN_HEIGHT=1.05,THORN_UP=.45,THORN_LANES=[0,.67,.34];
// How high a guardian projectile stands: pods and stones can be jumped, rocks, crystals, roots and beams cannot.
const CHASE_HEIGHT={seeds:BOULDER_HEIGHT,volley:BOULDER_HEIGHT};
export class RunnerControl{
 constructor(){this.lane=1;this.lat=0;this.s=0;this.clock=0;this.sliding=0;this.speed=0;this.stun=0;this.mire=0;this.mired=null;this.running=false;this.section=null;
  this.taken=new Set();this.knocked=new Set();this.wordsDone=new Set();this.filled=new Map();this.done=new Set();this.progress=new Map();this.events={};
  this.trials=new Map();this.power={};this.burst=0;this.burstCooldown=0;this.lastMove={t:-9,kind:null,lane:1};this.passed=new Set();this.wasGrounded=true;}
 get forwardYaw(){const f=this.section?.forward;return f?Math.atan2(f.x,f.z):null;}
 // Real distance along the section for track distance s; and where track metre 0 sits in the valley.
 realS(s=this.s){const run=this.section.run;return run.from+(s<0?s:Math.max(0,s-(run.length-run.real)));}
 origin(){return this.realS()-this.s;}
 engage(nav){
  const section=nav.section,run=section?.run;
  // Arriving: the controller still places the creature while it skids to a stop. An arrival cut short (the gate's
  // task opened first and the journey moved on) is dropped, so the next stretch's run can start.
  if(this.arrival&&this.arrival.section!==section)this.arrival=null;
  if(this.arrival)return true;
  // A rival only stops the run once its fight has started; an unbeaten rival waiting in the clearing does not.
  const fighting=!!nav.combat?.blocking?.active;
  let on=false;
  if(run&&nav.recovery<=0&&!fighting&&!this.done.has(section.id)){
   if(this.running&&this.section===section)on=true;
   else{const q=courseCoordinates(section,nav.player);if(q.s>=run.from-RUN_LEAD&&q.s<run.to&&Math.abs(q.lateral)<3.3){on=true;this.start(section,q);}}
  }
  // A fight that starts as the creature reaches the clearing ends the run there.
  if(fighting&&this.running&&this.section===section&&this.s>run.length-run.real)this.finish(section,nav);
  if(!on&&this.running)this.running=false;
  this.running=on;return on;
 }
 start(section,q){
  const run=section.run,resume=this.progress.get(section.id);this.section=section;
  this.s=Number.isFinite(resume)?resume:Math.min(0,q.s-run.from);
  this.lat=Math.max(LANES[0],Math.min(LANES[2],q.lateral));this.lane=LANES.reduce((best,x,i)=>Math.abs(x-this.lat)<Math.abs(LANES[best]-this.lat)?i:best,1);
  this.speed=Math.max(this.speed,3);this.events.start?.(section);
 }
 finish(section,nav){
  if(this.done.has(section.id))return;this.done.add(section.id);this.progress.delete(section.id);this.sliding=0;this.running=false;this.power={};this.burst=0;
  this.closeWord(section);
  if(nav&&!section.run.finale)this.beginArrival(section,nav);
  this.events.finish?.(section);nav&&(nav.passiveCarry=false);
 }
 // The arrival: the creature skids to a stop, either at the gate (its task then opens) or, at a guarded gate,
 // a few metres short of the rivals, where the fight takes over.
 beginArrival(section,nav){
  const run=section.run,from=this.realS(),rivals=nav.combat?[...nav.combat.enemies.values()].filter(r=>r.section.index===section.index&&r.phase!=='defeated').map(r=>r.spec):[],guarded=!!run.rival&&rivals.length>0;
  const to=guarded?Math.max(from+.5,Math.min(run.to+2.5,Math.min(...rivals.map(r=>r.s))-3.2)):Math.max(from+.5,section.length-.2),speed=Math.max(4,this.speed);
  this.arrival={section,guarded,s:from,to,lat:this.lat,toLat:guarded?this.lat:0,speed,decel:speed*speed/(2*(to-from)),skid:false};
 }
 arrive(nav,dt){
  const a=this.arrival,left=a.to-a.s;this.clock+=dt;
  // Decelerate so the creature comes to rest exactly at the end: v² = 2·decel·remaining.
  a.speed=Math.min(a.speed,Math.sqrt(2*a.decel*Math.max(0,left)));a.s+=Math.min(left,Math.max(a.speed,.8)*dt);a.lat+=(a.toLat-a.lat)*Math.min(1,dt*6);
  if(!a.skid){a.skid=true;this.events.skid?.(a.section,a);}
  const p=localPoint(a.section,a.s,a.lat);nav.player={x:p.x,z:p.z};nav.heading=this.forwardYaw;nav.moving=left>.05;
  // A retry during the fight brings the creature back here, in front of the rivals, not to the start of the run.
  if(a.to-a.s<=.02){this.arrival=null;nav.moving=false;if(nav.state?.travel)nav.state.travel.safe={...nav.player,y:nav.y||0,heading:nav.heading};this.events.arrive?.(a.section,a);}
  return true;
 }
 move(kind){this.lastMove={t:this.clock,kind,lane:this.lane};}
 shift(direction){if(!this.running)return false;const next=Math.max(0,Math.min(2,this.lane+direction));if(next===this.lane)return false;this.move('lane');this.lane=next;this.events.lane?.(direction);return true;}
 slide(nav){if(!this.running)return false;this.move('slide');this.sliding=.78;if(!nav.grounded)nav.vy=Math.min(nav.vy,-7);this.events.slide?.();return true;}
 jump(nav){if(!this.running)return false;this.sliding=0;return nav.requestJump();}
 // Cast shatters the nearest crystal gate within 18 m ahead.
 cast(){
  if(!this.running)return false;const gate=this.section.run.obstacles.find(o=>o.type==='crystal'&&!this.knocked.has(o.id)&&o.s-this.s>-.5&&o.s-this.s<18);
  if(!gate)return false;this.knocked.add(gate.id);this.events.crystal?.(gate);return true;
 }
 // Boost: a short burst of speed, paid from the coin-chain fuel when there is one, otherwise on a cooldown.
 boost(nav){
  if(!this.running||this.burst>0||this.burstCooldown>0)return false;
  if(nav.rush&&!nav.rush.start())return false;this.burst=1.2;this.burstCooldown=nav.rush?0:5;this.events.boost?.();return true;
 }
 has(kind){return kind==='shield'?!!this.power.shield:(this.power[kind]||0)>0;}
 // Ground under the creature while running (track holes and ledges; shield or dash can bridge a hole).
 surface(){return runSurface(this.section.run,this.s,this.lat,this.knocked);}
 // One simulation step: speed builds toward the sprint, the track advances, the creature steers into its lane.
 advance(nav,dt){
  if(this.arrival)return this.arrive(nav,dt);
  const section=this.section,run=section.run;this.clock+=dt;
  for(const k of['sliding','stun','mire','burst','burstCooldown'])this[k]=Math.max(0,this[k]-dt);
  for(const k of['magnet','double','dash'])if(this.power[k])this.power[k]=Math.max(0,this.power[k]-dt);
  const dash=this.has('dash'),target=this.stun>0?0:(this.s<0?run.start:speedAt(run,this.s))*(this.burst>0?1.4:1)*(dash?1.5:1)*(this.mire>0&&!dash?.42:1);
  this.speed+=(target-this.speed)*Math.min(1,dt*(this.stun>0?10:this.burst>0||dash?6:3));const before=this.s;this.s+=this.speed*dt;
  this.updateTrials(nav,dt);
  const lane=this.s<.5?0:LANES[this.lane],shift=Math.max(-9*dt,Math.min(9*dt,lane-this.lat));this.lat+=shift;
  // A shield (used up) or a dash carries the creature over a hole it would fall into.
  if(nav.grounded&&this.surface()===null&&(dash||this.power.shield)){const hole=this.holeHere();if(hole){this.knocked.add(hole.id);if(!dash)this.useShield(hole);}}
  if(this.wasGrounded&&!nav.grounded&&nav.vy>0)this.move('jump');this.wasGrounded=nav.grounded;
  const p=localPoint(section,this.realS(),this.lat);nav.player={x:p.x,z:p.z};nav.heading=this.forwardYaw;nav.moving=true;
  // The final real metres begin: the gate (and any rivals guarding it) come into view.
  if(before<run.length-run.real&&this.s>=run.length-run.real)this.events.approach?.(section,{guarded:!!run.rival&&!!nav.combat?.group?.some(r=>r.phase!=='defeated')});
  this.progress.set(section.id,this.s);this.checkPerfect(before);
  if(this.s>=run.length)this.finish(section,nav);
 }
 holeHere(){return this.section.run.obstacles.find(o=>o.type==='hole'&&Math.abs(this.s-o.s)<o.depth/2&&!this.knocked.has(o.id)&&this.lat>laneSpan(o.lanes).min&&this.lat<laneSpan(o.lanes).max);}
 useShield(o){this.power.shield=false;this.events.shield?.(o);}
 // Time-driven trial state: rolling boulders, wind gusts. (Thorns read the clock directly.)
 updateTrials(nav,dt){
  for(const o of this.section.run.obstacles){
   if(o.type==='boulders'){
    let st=this.trials.get(o.id);
    if(!st&&this.s>=o.start-30&&this.s<o.end){st={t0:this.clock,next:0,rolling:[]};this.trials.set(o.id,st);}
    if(!st)continue;
    // Each boulder appears 34 m ahead after a one-second amber warning on its lane, then rolls toward the creature.
    const due=st.t0+1+st.next*o.interval;st.warn=st.next<o.pattern.length&&this.s<o.end-20&&this.clock>=due-1?o.pattern[st.next]:null;
    if(st.next<o.pattern.length&&this.clock>=due){if(this.s<o.end-20)st.rolling.push({id:`${o.id}:${st.next}`,lane:o.pattern[st.next],s:this.s+34,spin:0});st.next++;}
    for(const b of st.rolling){b.s-=o.roll*dt;b.spin+=dt*(o.roll+this.speed)/.5;}
    st.rolling=st.rolling.filter(b=>b.s>this.s-12&&!b.hit);
   }
   if(o.type==='guardian'){this.updateGuardian(o,dt);continue;}
   if(o.type==='wind'){
    if(this.s<o.start||this.s>o.end){if(this.trials.get(o.id))this.trials.get(o.id).phase=0;continue;}
    let st=this.trials.get(o.id);if(!st){st={t0:this.clock,gusts:0};this.trials.set(o.id,st);}
    // Arrows glow for the warning, then the gust pushes one lane downwind (a dash rides through it).
    const phase=((this.clock-st.t0)/o.period)%1,cycle=Math.floor((this.clock-st.t0)/o.period);st.phase=phase;st.warning=phase>.55&&phase<.85;st.gust=phase>=.85;
    if(phase>=.85&&st.gusts<=cycle){st.gusts=cycle+1;if(!this.has('dash')){const next=Math.max(0,Math.min(2,this.lane+o.dir));if(next!==this.lane){this.lane=next;this.events.gust?.(o);}}}
   }
  }
 }
 // The guardian rides ahead (track metre s + dist), rises in, roars, attacks after each warning and backs away.
 updateGuardian(o,dt){
  let st=this.trials.get(o.id);
  if(!st&&this.s>=o.start&&this.s<o.end){st={t0:this.clock,next:0,warned:-1,flying:[],waves:[],roared:false,leaveAt:null,dist:70,rise:-9};this.trials.set(o.id,st);this.events.guardian?.(o);}
  if(!st)return;const t=this.clock-st.t0;st.t=t;
  if(st.leaveAt==null&&(o.finale?this.s>=o.end:t>o.duration-GUARDIAN_LEAVE))st.leaveAt=t;
  const enter=Math.min(1,t/GUARDIAN_ENTER),leave=st.leaveAt==null?0:Math.min(1,(t-st.leaveAt)/GUARDIAN_LEAVE);
  st.dist=70-32*enter+40*leave;st.rise=-9*(1-enter)-9*leave;st.visible=leave<1;
  if(!st.roared&&enter>=1){st.roared=true;this.events.roar?.(o);}
  st.pose=null;const a=st.leaveAt==null?o.attacks[st.next]:null;
  if(a&&t>=a.t-o.warn){if(st.warned<st.next){st.warned=st.next;st.aim=a.lane==='aim'?this.laneNow():a.lane;this.events.warn?.({...a,lane:st.aim});}
   const wave=CHASE_WAVES.includes(a.kind);st.pose={kind:a.kind,lane:st.aim,lanes:a.lanes||(wave?[]:[st.aim]),gap:a.gap,wave:wave||a.kind==='dive',k:Math.min(1,(t-(a.t-o.warn))/o.warn)};}
  if(a&&t>=a.t){this.launch(o,st,a);st.next++;}
  for(const p of st.flying){if(p.turn!=null&&!p.flight&&p.s<this.s+12){p.lane=p.turn;p.turn=null;p.bounced=true;}if(p.flight>0){p.flight=Math.max(0,p.flight-dt);const k=1-p.flight/p.total;p.s=p.from+(p.to-p.from)*k;p.y=p.y0*(1-k)+p.y1*k+p.arc*Math.sin(Math.PI*k);}else{p.s-=p.speed*dt;p.y=p.y1;}p.spin+=dt*9;
   if(!p.passed&&!p.flight&&p.s<this.s-.8){p.passed=true;if(!p.hit&&this.clock-this.lastMove.t<.6&&this.lastMove.kind==='lane'&&this.lastMove.lane===p.lane)this.events.perfect?.(p);}}
  for(const w of st.waves){w.s-=w.speed*dt;if(!w.passed&&w.s<this.s-.6){w.passed=true;if(!w.hit&&this.clock-this.lastMove.t<.6&&this.lastMove.kind==='jump')this.events.perfect?.(w);}}
  st.flying=st.flying.filter(p=>p.s>this.s-10&&!p.hit);st.waves=st.waves.filter(w=>w.s>this.s-8&&!w.hit);
 }
 launch(o,st,a){
  const g=this.s+st.dist,id=`${o.id}:${a.kind}:${st.next}`,lane=st.aim??a.lane,v=Math.max(4,this.speed||0);
  const lob=(kind,l,to,roll=0)=>st.flying.push({id:`${id}:${l}`,kind,lane:l,from:g-2,to,s:g-2,y:7,y0:7,y1:.5,arc:3,total:.9,flight:.9,speed:roll,spin:0});
  const streak=(kind,speed,extra={})=>st.flying.push({id,kind,lane,from:g-2,to:g-2,s:g-2,y:kind==='roots'?.4:1.1,y0:1.2,y1:kind==='roots'?.4:1.1,arc:0,total:0,flight:0,speed,spin:0,...extra});
  // Pods land and grow into thorn bushes; stones land and roll; crystals land and stand.
  // Landing spots scale with speed, so there is always about a second to react after a landing.
  const ahead=Math.max(22,v*2.2);
  if(a.kind==='seeds')lob('seeds',lane,this.s+ahead);
  if(a.kind==='volley')lob('volley',lane,this.s+Math.max(18,v*2.1),5);
  if(a.kind==='shards')for(const l of a.lanes)lob('shards',l,this.s+ahead);
  if(a.kind==='roots')streak('roots',20);
  if(a.kind==='prism')streak('prism',24,{turn:a.turn});
  // Waves cross all lanes toward the creature: jump them (the storm chain leaves one lane open).
  if(['slam','gale','chain'].includes(a.kind))st.waves.push({id,kind:a.kind,gap:a.gap,s:g-3,speed:13});
  // Sky Dive: it crashes into the creature's lane (reached in ~1.4 s), then its shockwave arrives (~2.3 s).
  if(a.kind==='dive'){lob('dive',lane,this.s+v*1.4);st.waves.push({id:id+':wave',kind:'dive',s:g-3,speed:Math.max(2,(st.dist-3)/2.3-v)});}
  this.events.attack?.({...a,lane});
 }
 // The final chase: a run from just past the last gate to the guardian's arena at the end of the trail.
 finale(e,mode){
  if(!e||e.index<20||e.battle||!e.choices?.[4])return null;const key=e.id+':'+mode;if(this.finaleKey===key)return this.finaleSection;
  const node=activeNode({...e,index:19}),exit=activeNode(e),from={x:node.x,z:node.z},to=approachPoint(exit),dx=to.x-from.x,dz=to.z-from.z,len=Math.hypot(dx,dz),forward={x:dx/len,z:dz/len},start={x:from.x+forward.x*2.5,z:from.z+forward.z*2.5},length=len-2.5;
  const section={id:`${e.id}:travel:finale`,index:20,chapter:4,side:e.choices[4],area:e.area,kind:'coins',start,end:to,length,forward,right:{x:-forward.z,z:forward.x},platforms:[],plants:[],coins:[],enemies:[],enemy:null,trial:null,finale:true};
  section.run=finaleRun(section,mode);this.finaleKey=key;this.finaleSection=section;return section;
 }
 thornUp(o,lane,clock=this.clock){return((clock/o.period+o.phase+THORN_LANES[lane])%1)<THORN_UP;}
 // A stumble: a short stop and a step back, never a fail; a shield absorbs it and a dash smashes through.
 stumble(nav,o,{back=true}={}){
  this.knocked.add(o.id);
  if(this.has('dash')){this.events.smash?.(o);return null;}
  if(this.power.shield){this.useShield(o);return null;}
  if(back)this.s=o.s-(o.depth||0)/2-1.2;this.stun=.7;this.speed=0;nav.invincible=.9;nav.rush?.reset();this.events.stumble?.(o);return o;
 }
 // Swamps slow the creature to a wade and break the coin chain (jump across or change lane).
 // Hurdles need a jump, bars a slide; crystals need Cast; thorns need the open lane; boulders a lane change.
 // The obstacle is knocked aside, so a student who has not yet learned the move still reaches the gate.
 collide(nav){
  if(this.arrival)return null;
  const run=this.section.run,feet=nav.y-(this.surface()??0),hurdle=hurdleHeight(nav.height||.65),lane=this.laneNow();
  for(const o of run.obstacles){
   const span=laneSpan(o.lanes);
   if(o.type==='swamp'){if(!this.has('dash')&&Math.abs(this.s-o.s)<o.depth/2&&this.lat>span.min&&this.lat<span.max&&feet<.12){this.mire=.25;if(this.mired!==o.id){this.mired=o.id;nav.rush?.reset();this.events.swamp?.(o);}}continue;}
   if(o.type==='guardian'){const st=this.trials.get(o.id);if(!st||nav.invincible>0)continue;
    for(const p of st.flying)if(!p.hit&&!p.flight&&Math.abs(p.s-this.s)<.7&&p.lane===lane&&nav.y<(CHASE_HEIGHT[p.kind]??1.5)-.1){p.hit=true;return this.stumble(nav,{id:p.id,type:p.kind,s:this.s+1.2,depth:0});}
    for(const w of st.waves)if(!w.hit&&w.gap!==lane&&Math.abs(w.s-this.s)<.55&&feet<.35){w.hit=true;return this.stumble(nav,{id:w.id,type:w.kind,s:this.s+1.2,depth:0});}
    continue;}
   if(o.type==='boulders'){const st=this.trials.get(o.id);for(const b of st?.rolling||[])if(!b.hit&&Math.abs(b.s-this.s)<.75&&b.lane===lane&&nav.y<BOULDER_HEIGHT-.1&&nav.invincible<=0){b.hit=true;return this.stumble(nav,{...o,id:b.id,s:this.s+1.2,depth:0});}continue;}
   if(['hole','stone','wind','ledge'].includes(o.type)||this.knocked.has(o.id)||Math.abs(this.s-o.s)>o.depth/2+.28)continue;if(this.lat<span.min-.2||this.lat>span.max+.2)continue;
   const hit=o.type==='barrier'?feet<hurdle-.06:o.type==='bar'?this.sliding<=0:o.type==='thorns'?this.thornUp(o,lane)&&feet<THORN_HEIGHT-.1:o.type==='crystal';
   if(hit&&nav.invincible<=0)return this.stumble(nav,o);
  }
  for(const p of run.powerups||[]){
   if(this.taken.has(p.id)||Math.abs(this.s-p.s)>.9||p.lane!==lane)continue;this.taken.add(p.id);
   if(p.kind==='shield')this.power.shield=true;else this.power[p.kind]=POWER_SECONDS[p.kind];this.events.power?.(p);
  }
  const magnet=this.has('magnet');
  for(const c of run.coins){
   const reach=magnet?4.5:.7;if(Math.abs(this.s-c.s)>reach||(!magnet&&Math.abs(this.lat-c.lateral)>.75)||this.taken.has(c.id)||nav.state?.travel?.collected?.includes(c.id))continue;
   if(!magnet&&(c.y>nav.y+(nav.height||.65)*.9+.2||c.y<nav.y-.6))continue;
   this.taken.add(c.id);const p=localPoint(this.section,this.realS(),c.lateral);this.events.coin?.({...c,x:p.x,y:c.y,z:p.z,double:this.has('double')});
  }
  const word=run.word;if(word&&feet<1.6)for(const t of word.tokens){
   if(this.taken.has(t.id)||Math.abs(this.s-t.s)>.75||Math.abs(this.lat-LANES[t.lane])>LANE_HALF)continue;
   this.taken.add(t.id);if(t.correct)this.filled.set(t.id,true);for(const other of word.tokens)if(other.slot===t.slot)this.taken.add(other.id);this.events.letter?.(t,word,this.progress_(word));
  }
  // The word panel closes as soon as the word is complete or its last letter row is behind the creature.
  if(word&&(this.progress_(word).every(Boolean)||this.s>word.tokens.at(-1).s+1.5))this.closeWord(this.section);
  return null;
 }
 laneNow(){return LANES.reduce((best,x,i)=>Math.abs(x-this.lat)<Math.abs(LANES[best]-this.lat)?i:best,1);}
 // "Perfect!": an obstacle passed cleanly within 0.45 s of the move that avoided it.
 checkPerfect(before){
  if(this.clock-this.lastMove.t>.45)return;const lane=this.laneNow();
  for(const o of this.section.run.obstacles){
   const end=o.s+(o.depth||0)/2;if(this.passed.has(o.id)||before>=end||this.s<end||this.knocked.has(o.id))continue;
   const m=this.lastMove.kind,clean=m==='lane'?o.lanes.includes(this.lastMove.lane)&&!o.lanes.includes(lane)&&['barrier','bar','hole','swamp','thorns'].includes(o.type):m==='jump'?['barrier','hole','swamp'].includes(o.type)&&o.lanes.includes(lane):m==='slide'?o.type==='bar'&&o.lanes.includes(lane):false;
   if(clean){this.passed.add(o.id);this.events.perfect?.(o);}
  }
 }
 closeWord(section){const word=section.run.word;if(!word||this.wordsDone.has(section.id))return;this.wordsDone.add(section.id);this.events.word?.(word,this.progress_(word),section);}
 progress_(word){return[...word.answer].map((c,i)=>this.filled.get(word.tokens.find(t=>t.slot===i&&t.correct).id)?c:null);}
 // After a fall in a run: back a few metres, standing, in an open lane, so the hole can be read and the run goes on.
 // A stepping-stone stream sends the creature back to its bank, lined up with the first stone.
 afterRetry(nav){
  if(!this.running||!this.section?.run)return false;const run=this.section.run;
  const hole=run.obstacles.filter(o=>o.type==='hole'&&o.s<=this.s+1.5).at(-1);
  if(hole?.stream){this.s=hole.stream.start-6;this.lane=hole.stream.first;
   // Never stuck: after a second fall in the same stream its stones settle into a full bridge.
   const falls=(this.streamFalls??=new Map()).get(hole.stream.start)||0;this.streamFalls.set(hole.stream.start,falls+1);
   if(falls+1>=2){for(const w of run.obstacles)if(w.stream?.start===hole.stream.start)this.knocked.add(w.id);this.events.bridge?.(hole);}}
  else{this.s=Math.max(Math.min(this.s,0),(hole?hole.s-hole.depth/2:this.s)-8);if(hole?.lanes.includes(this.lane))this.lane=[0,1,2].filter(l=>!hole.lanes.includes(l)).sort((a,b)=>Math.abs(a-this.lane)-Math.abs(b-this.lane))[0]??this.lane;}
  this.lat=LANES[this.lane];const p=localPoint(this.section,this.realS(),this.lat);nav.player={x:p.x,z:p.z};nav.y=0;nav.vy=0;this.speed=0;this.stun=.9;this.sliding=0;this.progress.set(this.section.id,this.s);return true;
 }
}
