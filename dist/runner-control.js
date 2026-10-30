import{courseCoordinates,localPoint}from'./traversal-layout.js';
import{LANES,LANE_HALF,RUN_LEAD,laneSpan}from'./runner-course.js';

// Drives the creature through a runner section: constant forward speed, three lanes, jump, slide, stumbles on
// barriers and bars, falls through holes (the navigator's own retry), and letter tokens for word runs.
// Lane changes, slides and jumps arrive as discrete requests from keys, swipes or joystick flicks.
export class RunnerControl{
 constructor(){this.lane=1;this.sliding=0;this.speed=0;this.stun=0;this.running=false;this.section=null;this.q=null;this.taken=new Set();this.knocked=new Set();this.mire=0;this.mired=null;this.filled=new Map();this.done=new Set();this.events={};}
 get forwardYaw(){const f=this.section?.forward;return f?Math.atan2(f.x,f.z):null;}
 engage(nav){
  const section=nav.section,run=section?.run;let q=null,on=false;
  if(run&&nav.recovery<=0&&!nav.combat?.blocking){q=courseCoordinates(section,nav.player);on=q.s>=run.from-RUN_LEAD&&q.s<run.to&&Math.abs(q.lateral)<3.3;}
  if(on&&!this.running){this.section=section;this.lane=LANES.reduce((best,x,i)=>Math.abs(x-q.lateral)<Math.abs(LANES[best]-q.lateral)?i:best,1);this.speed=Math.max(this.speed,3);this.events.start?.(section);}
  if(!on&&this.running&&this.section){const left=this.section;if(q===null||q.s>=left.run.to)this.finish(left);}
  this.running=on;this.q=q;return on;
 }
 finish(section){
  if(this.done.has(section.id))return;this.done.add(section.id);this.sliding=0;
  const word=section.run.word;if(word){const letters=[...word.answer].map((c,i)=>this.filled.get(word.tokens.find(t=>t.slot===i&&t.correct).id)?c:null);this.events.word?.(word,letters,section);}
  this.events.finish?.(section);
 }
 shift(direction){if(!this.running)return false;const next=Math.max(0,Math.min(2,this.lane+direction));if(next===this.lane)return false;this.lane=next;this.events.lane?.(direction);return true;}
 slide(nav){if(!this.running)return false;this.sliding=.78;if(!nav.grounded)nav.vy=Math.min(nav.vy,-7);this.events.slide?.();return true;}
 jump(nav){if(!this.running)return false;this.sliding=0;return nav.requestJump();}
 // World-space input for one simulation step: forward, steering into the chosen lane.
 input(nav,dt){
  const s=this.section,run=s.run;this.sliding=Math.max(0,this.sliding-dt);this.stun=Math.max(0,this.stun-dt);
  this.mire=Math.max(0,this.mire-dt);const target=this.stun>0?0:(run.speed+(nav.rush?.boost>0?1.6:0))*(this.mire>0?.42:1);this.speed+=(target-this.speed)*Math.min(1,dt*(this.stun>0?10:2.6));
  // Behind the start line (through a gate or out of a fork) hold the middle lane; lanes begin at the line.
  const lane=this.q.s<.5?0:LANES[this.lane],steer=Math.max(-1.6,Math.min(1.6,(lane-this.q.lateral)*4.2));
  return{x:s.forward.x+s.right.x*steer,z:s.forward.z+s.right.z*steer};
 }
 // Swamps slow the creature to a wade and break the coin chain (jump across or change lane).
 // Barriers need a jump, bars a slide; touching either is a stumble (a short stop and a step back), never a fail.
 // The obstacle is knocked aside, so a student who has not yet learned the move still reaches the gate.
 collide(nav){
  const section=this.section,run=section.run,q=courseCoordinates(section,nav.player),feet=nav.y-(nav.support()??0);
  for(const o of run.obstacles){
   if(o.type==='swamp'){const span=laneSpan(o.lanes);if(Math.abs(q.s-o.s)<o.depth/2&&q.lateral>span.min&&q.lateral<span.max&&feet<.12){this.mire=.25;if(this.mired!==o.id){this.mired=o.id;nav.rush?.reset();this.events.swamp?.(o);}}continue;}
   if(o.type==='hole'||this.knocked.has(o.id)||Math.abs(q.s-o.s)>o.depth/2+.28)continue;const span=laneSpan(o.lanes);if(q.lateral<span.min-.2||q.lateral>span.max+.2)continue;
   const hit=o.type==='barrier'?feet<o.h-.06:this.sliding<=0;
   if(hit&&nav.invincible<=0){this.knocked.add(o.id);const back=localPoint(section,Math.max(run.from,o.s-o.depth/2-1.2),q.lateral);nav.player={x:back.x,z:back.z};this.stun=.7;this.speed=0;nav.invincible=.9;nav.rush?.reset();this.events.stumble?.(o);return o;}
  }
  const word=run.word;if(word&&nav.y<1.6)for(const t of word.tokens){
   if(this.taken.has(t.id)||Math.abs(q.s-t.s)>.75||Math.abs(q.lateral-LANES[t.lane])>LANE_HALF)continue;
   this.taken.add(t.id);if(t.correct)this.filled.set(t.id,true);for(const other of word.tokens)if(other.slot===t.slot)this.taken.add(other.id);this.events.letter?.(t,word,this.progress(word));
  }
  return null;
 }
 progress(word){return[...word.answer].map((c,i)=>this.filled.get(word.tokens.find(t=>t.slot===i&&t.correct).id)?c:null);}
 // After a fall in a run: back a few metres, standing, in an open lane, so the hole can be read and the run goes on.
 afterRetry(nav){
  const section=this.section,run=section?.run;if(!run||!this.q||this.q.s<run.from||this.q.s>run.to)return false;
  const hole=run.obstacles.filter(o=>o.type==='hole'&&o.s<=this.q.s+1.5).at(-1),s=Math.max(run.from+.2,(hole?hole.s-hole.depth/2:this.q.s)-6.5);
  // Come back in the nearest lane the hole leaves open; holes never span all three lanes.
  if(hole?.lanes.includes(this.lane))this.lane=[0,1,2].filter(l=>!hole.lanes.includes(l)).sort((a,b)=>Math.abs(a-this.lane)-Math.abs(b-this.lane))[0]??this.lane;
  const p=localPoint(section,s,LANES[this.lane]);
  nav.player={x:p.x,z:p.z};nav.y=nav.support()??0;this.speed=0;this.stun=.9;this.sliding=0;return true;
 }
}
