import{courseCoordinates,localPoint}from'./traversal-layout.js';
import{LANES,LANE_HALF,RUN_LEAD,laneSpan,speedAt,runSurface,hurdleHeight}from'./runner-course.js';

// Drives the creature through a runner section on a moving track. Progress is measured in track metres (`s`,
// up to run.length). While s is below run.length - run.real the creature holds its place in the valley and the
// track slides beneath it; the final run.real metres are real running into the gate clearing, so the run ends
// exactly where the valley expects. Lanes are real lateral offsets either way.
// Lane changes, slides and jumps arrive as discrete requests from keys, swipes or joystick flicks.
export class RunnerControl{
 constructor(){this.lane=1;this.lat=0;this.s=0;this.sliding=0;this.speed=0;this.stun=0;this.mire=0;this.mired=null;this.running=false;this.section=null;
  this.taken=new Set();this.knocked=new Set();this.wordsDone=new Set();this.filled=new Map();this.done=new Set();this.progress=new Map();this.events={};}
 get forwardYaw(){const f=this.section?.forward;return f?Math.atan2(f.x,f.z):null;}
 // Real distance along the section for track distance s; and where track metre 0 sits in the valley.
 realS(s=this.s){const run=this.section.run;return run.from+(s<0?s:Math.max(0,s-(run.length-run.real)));}
 origin(){return this.realS()-this.s;}
 engage(nav){
  const section=nav.section,run=section?.run;
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
  if(this.done.has(section.id))return;this.done.add(section.id);this.progress.delete(section.id);this.sliding=0;this.running=false;
  this.closeWord(section);
  this.events.finish?.(section);nav&&(nav.passiveCarry=false);
 }
 shift(direction){if(!this.running)return false;const next=Math.max(0,Math.min(2,this.lane+direction));if(next===this.lane)return false;this.lane=next;this.events.lane?.(direction);return true;}
 slide(nav){if(!this.running)return false;this.sliding=.78;if(!nav.grounded)nav.vy=Math.min(nav.vy,-7);this.events.slide?.();return true;}
 jump(nav){if(!this.running)return false;this.sliding=0;return nav.requestJump();}
 // Ground under the creature while running (holes are track holes, not valley holes).
 surface(){return runSurface(this.section.run,this.s,this.lat);}
 // One simulation step: speed builds toward the sprint, the track advances, the creature steers into its lane.
 advance(nav,dt){
  const section=this.section,run=section.run;this.sliding=Math.max(0,this.sliding-dt);this.stun=Math.max(0,this.stun-dt);this.mire=Math.max(0,this.mire-dt);
  const target=this.stun>0?0:(this.s<0?run.start:speedAt(run,this.s))*(nav.rush?.boost>0?1.15:1)*(this.mire>0?.42:1);
  this.speed+=(target-this.speed)*Math.min(1,dt*(this.stun>0?10:3));this.s+=this.speed*dt;
  const lane=this.s<.5?0:LANES[this.lane],shift=Math.max(-9*dt,Math.min(9*dt,lane-this.lat));this.lat+=shift;
  const p=localPoint(section,this.realS(),this.lat);nav.player={x:p.x,z:p.z};nav.heading=this.forwardYaw;nav.moving=true;
  this.progress.set(section.id,this.s);
  if(this.s>=run.length)this.finish(section,nav);
 }
 // Swamps slow the creature to a wade and break the coin chain (jump across or change lane).
 // Hurdles need a jump, bars a slide; touching either is a stumble (a short stop and a step back), never a fail.
 // The obstacle is knocked aside, so a student who has not yet learned the move still reaches the gate.
 collide(nav){
  const run=this.section.run,feet=nav.y-(this.surface()??0),hurdle=hurdleHeight(nav.height||.65);
  for(const o of run.obstacles){
   const span=laneSpan(o.lanes);
   if(o.type==='swamp'){if(Math.abs(this.s-o.s)<o.depth/2&&this.lat>span.min&&this.lat<span.max&&feet<.12){this.mire=.25;if(this.mired!==o.id){this.mired=o.id;nav.rush?.reset();this.events.swamp?.(o);}}continue;}
   if(o.type==='hole'||this.knocked.has(o.id)||Math.abs(this.s-o.s)>o.depth/2+.28)continue;if(this.lat<span.min-.2||this.lat>span.max+.2)continue;
   const hit=o.type==='barrier'?feet<hurdle-.06:this.sliding<=0;
   if(hit&&nav.invincible<=0){this.knocked.add(o.id);this.s=o.s-o.depth/2-1.2;this.stun=.7;this.speed=0;nav.invincible=.9;nav.rush?.reset();this.events.stumble?.(o);return o;}
  }
  for(const c of run.coins){
   if(Math.abs(this.s-c.s)>.7||Math.abs(this.lat-c.lateral)>.75||this.taken.has(c.id)||nav.state?.travel?.collected?.includes(c.id))continue;
   const reach=(nav.height||.65)*.9+feet;if(c.y>reach+.2)continue;
   this.taken.add(c.id);const p=localPoint(this.section,this.realS(),c.lateral);this.events.coin?.({...c,x:p.x,y:c.y+nav.y,z:p.z});
  }
  const word=run.word;if(word&&feet<1.6)for(const t of word.tokens){
   if(this.taken.has(t.id)||Math.abs(this.s-t.s)>.75||Math.abs(this.lat-LANES[t.lane])>LANE_HALF)continue;
   this.taken.add(t.id);if(t.correct)this.filled.set(t.id,true);for(const other of word.tokens)if(other.slot===t.slot)this.taken.add(other.id);this.events.letter?.(t,word,this.progress_(word));
  }
  // The word panel closes as soon as the word is complete or its last letter row is behind the creature.
  if(word&&(this.progress_(word).every(Boolean)||this.s>word.tokens.at(-1).s+1.5))this.closeWord(this.section);
  return null;
 }
 closeWord(section){const word=section.run.word;if(!word||this.wordsDone.has(section.id))return;this.wordsDone.add(section.id);this.events.word?.(word,this.progress_(word),section);}
 progress_(word){return[...word.answer].map((c,i)=>this.filled.get(word.tokens.find(t=>t.slot===i&&t.correct).id)?c:null);}
 // After a fall in a run: back a few metres, standing, in an open lane, so the hole can be read and the run goes on.
 afterRetry(nav){
  if(!this.running||!this.section?.run)return false;const run=this.section.run;
  const hole=run.obstacles.filter(o=>o.type==='hole'&&o.s<=this.s+1.5).at(-1);this.s=Math.max(Math.min(this.s,0),(hole?hole.s-hole.depth/2:this.s)-8);
  if(hole?.lanes.includes(this.lane))this.lane=[0,1,2].filter(l=>!hole.lanes.includes(l)).sort((a,b)=>Math.abs(a-this.lane)-Math.abs(b-this.lane))[0]??this.lane;
  this.lat=LANES[this.lane];const p=localPoint(this.section,this.realS(),this.lat);nav.player={x:p.x,z:p.z};nav.y=0;nav.vy=0;this.speed=0;this.stun=.9;this.sliding=0;this.progress.set(this.section.id,this.s);return true;
 }
}
