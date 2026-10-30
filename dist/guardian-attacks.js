// Guardian attack catalogue. Each attack is described as ground shapes; the same
// shapes drive both the warning footprints on screen and the hit tests, so what a
// student sees is exactly what can hurt them.
//   amber shape (hit:false) = it is coming, move or get ready
//   red shape   (hit:true)  = it hurts now; low:true shapes are cleared by a jump
//   blue shape  (safe:true) = the safe place to stand or the gap to run through
export const BOSS={x:0,z:-5,radius:2.25,height:11.8};
export const ARENA={x:0,z:3,radius:11};
export const guardianPhase=b=>b.bossHp>60?1:b.bossHp>30?2:3;
export const JUMP_CLEAR=.52;
const TAU=Math.PI*2,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const unit=a=>({x:Math.sin(a),z:Math.cos(a)}),angleTo=(a,p)=>Math.atan2(p.x-a.x,p.z-a.z);
const at=(o,d,s)=>({x:o.x+d.x*s,z:o.z+d.z*s}),dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
// Deterministic per attack, so a reload replays the same pattern.
function chance(b,k){let t=Math.imul((b.attackNo+1)*7919+k*104729,0x9E3779B1);t^=t>>>15;t=Math.imul(t,0x85EBCA6B);t^=t>>>13;return(t>>>0)/4294967296;}
// Keeps a centre inside the arena wall and clear of the guardian's feet.
export function place(p,margin){const c=ARENA,dx=p.x-c.x,dz=p.z-c.z,d=Math.hypot(dx,dz),max=c.radius-margin;let q=d>max?{x:c.x+dx/d*max,z:c.z+dz/d*max}:{x:p.x,z:p.z};const bd=dist(q,BOSS),min=BOSS.radius+margin;if(bd<min){const u={x:(q.x-BOSS.x)/(bd||1),z:(q.z-BOSS.z)/(bd||1)};q=at(BOSS,bd?u:{x:0,z:1},min);}return q;}
function rimHit(o,d){const fx=o.x-ARENA.x,fz=o.z-ARENA.z,b=fx*d.x+fz*d.z,c=fx*fx+fz*fz-ARENA.radius**2;return at(o,d,-b+Math.sqrt(Math.max(0,b*b-c)));}
export function segmentDistance(p,a,b){const dx=b.x-a.x,dz=b.z-a.z,l=dx*dx+dz*dz||1,t=clamp(((p.x-a.x)*dx+(p.z-a.z)*dz)/l,0,1);return Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t);}
const circle=(c,r,hit,extra={})=>({type:'circle',x:c.x,z:c.z,r,hit,...extra});
const ring=(c,r,w,hit,extra={})=>({type:'ring',x:c.x,z:c.z,r,w,hit,low:true,...extra});
const strip=(a,b,w,hit,extra={})=>({type:'strip',a,b,w,hit,...extra});
const fast=m=>m==='challenge';

// Shared timings (seconds).
// SLAM_GAP leaves room to land and jump again, even for the highest Form's longer jump.
const ROOT_SPEED=18,ROOT_HOLD=.55,RING_SPEED=9,SLAM_GAP=1.7,DIVE_R=6,CAGE_R=3,CAGE_GAP=.62,BURST=3.4;
export const VOLLEY={interval:m=>fast(m)?.5:.6,travel:.8};
export const galeSpeed=m=>fast(m)?2.2:1.8;
export const chainSpeed=m=>fast(m)?8.5:7;
const volleyCount=(b,m)=>Math.min(6,4+(fast(m)?1:0)+(guardianPhase(b)>=3?1:0));
export const galeAngle=(b,m)=>{const a=b.targets[0]?angleTo(BOSS,b.targets[0]):0,dir=b.attackNo%2?1:-1;return a+(b.phase==='strike'?dir*galeSpeed(m)*b.timer:0);};
export const galeDirection=b=>b.attackNo%2?1:-1;
export function chainFrame(b,m){const t0=b.targets[0]||{x:0,z:3},d=unit(angleTo(BOSS,t0)),n={x:d.z,z:-d.x},g=b.targets[1]||t0,gap=(g.x-t0.x)*n.x+(g.z-t0.z)*n.z,front=2.4+(b.phase==='strike'?b.timer*chainSpeed(m):0);return{d,n,gap,front};}

const ATTACKS={
 // Legacy attacks of version-2 saves made before the redesign.
 quake:{strike:()=>2.25,aim:b=>[{x:b.player.x,z:b.player.z}],shapes:(b)=>b.phase==='windup'?[ring(BOSS,2.9,.5,false)]:[ring(BOSS,b.timer*RING_SPEED,.5,true)]},
 beam:{strike:()=>.85,aim:b=>[{x:b.player.x,z:b.player.z}],shapes:b=>{const t=b.targets[0]||b.player,d=unit(angleTo(BOSS,t));return[strip(BOSS,at(BOSS,d,23),.85,b.phase==='strike'&&b.timer>.12&&b.timer<.65)];}},
 falls:{strike:()=>.85,aim:b=>{const p=b.player;return[{x:p.x,z:p.z},{x:clamp(p.x+3.8,-7,7),z:p.z-1.5},{x:clamp(p.x-3.8,-7,7),z:p.z+1.5}];},shapes:b=>b.targets.map(t=>circle(t,1.45,b.phase==='strike'&&b.timer>.34&&b.timer<.67))},

 // Mossback Warden · Whisperwood
 roots:{area:0,strike:b=>(Math.max(2.4,...b.targets.map(t=>dist(BOSS,t)))-2.4)/ROOT_SPEED+ROOT_HOLD,
  aim:b=>{const a=angleTo(BOSS,b.player),spread=guardianPhase(b)>=2?[0,-.42,.42]:[0];return spread.map(o=>rimHit(BOSS,unit(a+o)));},
  shapes:b=>b.targets.flatMap(t=>{const d=unit(angleTo(BOSS,t)),L=dist(BOSS,t),from=at(BOSS,d,2.4);if(b.phase!=='strike')return[strip(from,t,.75,false)];const front=Math.min(L,2.4+b.timer*ROOT_SPEED),tail=Math.max(2.4,2.4+b.timer*ROOT_SPEED-ROOT_SPEED*ROOT_HOLD),out=[];if(front<L)out.push(strip(at(BOSS,d,front),t,.75,false));if(tail<L)out.push(strip(at(BOSS,d,tail),at(BOSS,d,front),.75,true,{roots:true}));return out;})},
 seeds:{area:0,strike:()=>.85,
  aim:(b,m)=>{const p=b.player,n=guardianPhase(b)>=3||fast(m)&&guardianPhase(b)>=2?4:3,a0=chance(b,1)*TAU,out=[place(p,1.5)];for(let i=1;i<n;i++)out.push(place(at(p,unit(a0+i*TAU/(n-1)),3.4),1.5));return out;},
  shapes:b=>b.targets.map(t=>circle(t,1.3,b.phase==='strike'&&b.timer>=.5&&b.timer<.75)),
  land:(b,m)=>{for(const t of b.targets)b.hazards.push({x:t.x,z:t.z,ttl:fast(m)?8:6});b.hazards.splice(0,Math.max(0,b.hazards.length-6));}},
 slam:{area:0,big:true,strike:(b,m)=>2.25+(slamDouble(b,m)?SLAM_GAP:0),aim:()=>[],
  shapes:(b,m)=>{if(b.phase==='windup')return[ring(BOSS,2.9,.5,false)];const out=[ring(BOSS,b.timer*RING_SPEED,.5,true)];if(slamDouble(b,m)){const t=b.timer-SLAM_GAP;out.push(t>0?ring(BOSS,t*RING_SPEED,.5,true):ring(BOSS,2.9,.5,false));}return out;}},
 overgrowth:{area:0,big:true,windup:.7,strike:()=>1.6,
  // The creeping vines swallow old thorn bushes, so no bush can block a safe patch.
  aim:b=>{if(b.hazards)b.hazards.length=0;const p=b.player,a=angleTo(p,ARENA)+(chance(b,2)-.5)*1.6,first=place(at(p,unit(a),3.2),2),out=[first],c=angleTo(ARENA,first);for(const o of[2.1,-2.1])out.push(place(at(ARENA,unit(c+o),5.6),2));return out;},
  shapes:b=>{const safe=b.targets.map(t=>circle(t,1.8,false,{safe:true}));return[{type:'cover',safe,hit:b.phase==='strike'&&b.timer>=.35&&b.timer<1.35},...safe];}},

 // Galecrest Warden · Skyreach
 gale:{area:1,strike:(b,m)=>TAU/galeSpeed(m)+.1,
  aim:b=>[at(BOSS,unit(angleTo(BOSS,b.player)-galeDirection(b)*1.55),9)],
  shapes:(b,m)=>{const d=unit(galeAngle(b,m));return[strip(at(BOSS,d,2.4),at(BOSS,d,17),.45,b.phase==='strike',{low:true,wind:true})];}},
 volley:{area:1,strike:(b,m)=>(volleyCount(b,m)-1)*VOLLEY.interval(m)+VOLLEY.travel+.2,aim:()=>[],
  step:(b,m)=>{const i=Math.floor(b.timer/VOLLEY.interval(m));if(i<volleyCount(b,m)&&b.targets.length<=i)b.targets.push(place(b.player,1));},
  shapes:(b,m)=>b.phase!=='strike'?[]:b.targets.map((t,i)=>{const land=i*VOLLEY.interval(m)+VOLLEY.travel;return b.timer<land+.12?circle(t,1.15,b.timer>=land-.12):null;}).filter(Boolean)},
 dive:{area:1,big:true,windup:.4,strike:()=>.85+11/RING_SPEED,aim:()=>[],
  shapes:b=>{if(b.phase==='windup'||b.timer<.6)return[circle(BOSS,DIVE_R,false)];if(b.timer<.85)return[circle(BOSS,DIVE_R,true)];return[ring(BOSS,DIVE_R+(b.timer-.85)*RING_SPEED,.5,true)];}},
 twisters:{area:1,big:true,strike:(b,m)=>fast(m)?6:5.5,
  aim:(b,m)=>{const a=angleTo(ARENA,b.player),n=fast(m)?3:2;return[1,-1,0].slice(0,n).map((s,i)=>place(at(ARENA,unit(a+s*2.1+(i===2?Math.PI:0)),9.5),1.2));},
  step:(b,m,dt)=>{const v=fast(m)?2.5:2;for(const t of b.targets){const d=dist(t,b.player)||1;Object.assign(t,place({x:t.x+(b.player.x-t.x)/d*v*dt,z:t.z+(b.player.z-t.z)/d*v*dt},1.2));}},
  pull:(b,dt)=>{for(const t of b.targets){const d=dist(t,b.player);if(d>.3&&d<5){const k=1.4*(1-d/5)*dt;b.player.x+=(t.x-b.player.x)/d*k;b.player.z+=(t.z-b.player.z)/d*k;}}},
  shapes:b=>b.targets.map(t=>circle(t,.9,b.phase==='strike',{twister:true}))},

 // Stormglass Sentinel · Stormglass
 prism:{area:2,strike:b=>.75+.3*(b.targets.length-1),
  aim:(b,m)=>{let o={x:BOSS.x,z:BOSS.z},d=unit(angleTo(BOSS,b.player));const out=[],n=fast(m)||guardianPhase(b)>=3?3:2;for(let i=0;i<n;i++){const p=rimHit(o,d),nx=(p.x-ARENA.x)/ARENA.radius,nz=(p.z-ARENA.z)/ARENA.radius,k=d.x*nx+d.z*nz;out.push(p);d={x:d.x-2*k*nx,z:d.z-2*k*nz};o=at(p,d,.01);}return out;},
  shapes:b=>b.targets.map((t,i)=>{const from=i?b.targets[i-1]:BOSS,start=.1+.3*i;if(b.phase==='strike'&&b.timer>start+.5)return null;return strip(from,t,.8,b.phase==='strike'&&b.timer>=start);}).filter(Boolean)},
 shards:{area:2,strike:()=>2.1+(BURST-.9)/6.5+.15,
  aim:b=>{const p=b.player,n=guardianPhase(b)>=2?4:3,a0=chance(b,3)*TAU,out=[place(p,1.4)];for(let i=1;i<n;i++)out.push(place(at(p,unit(a0+i*TAU/(n-1)),3),1.4));return out;},
  shapes:b=>b.targets.flatMap(t=>{const s=b.phase==='strike'?b.timer:-1;if(s<.7)return[circle(t,1.2,s>=.45)];if(s<2.1)return s>1.5?[ring(t,BURST,.15,false)]:[];const r=.9+(s-2.1)*6.5;return r<=BURST?[ring(t,r,.45,true)]:[];}),
  solids:b=>b.phase==='strike'&&b.timer>=.7&&b.timer<2.1?b.targets.map(t=>({x:t.x,z:t.z,r:.8})):[]},
 cage:{area:2,big:true,windup:1,strike:()=>.8,
  aim:b=>{const c=place(b.player,CAGE_R+.6),a=angleTo(c,ARENA)+(chance(b,4)-.5)*1.8;return[c,at(c,unit(a),CAGE_R)];},
  shapes:b=>{const[c,g]=b.targets;if(!c)return[];const d=unit(angleTo(c,g));return[circle(c,CAGE_R-.1,b.phase==='strike'&&b.timer>=.15&&b.timer<.6),circle(at(c,d,CAGE_R+1.1),.9,false,{safe:true})];}},
 chain:{area:2,big:true,strike:(b,m)=>(19-2.4)/chainSpeed(m),
  aim:b=>{const a=angleTo(BOSS,b.player),d=unit(a),n={x:d.z,z:-d.x},lat=(b.player.x-BOSS.x)*n.x+(b.player.z-BOSS.z)*n.z,side=chance(b,5)<.5?-1:1,gap=clamp(lat+side*(2.4+chance(b,6)*1.6),-6,6),t0=at(BOSS,d,8);return[t0,at(t0,n,gap)];},
  shapes:(b,m)=>{const{d,n,gap,front}=chainFrame(b,m),c=at(BOSS,d,front),hit=b.phase==='strike';return[strip(at(c,n,-16),at(c,n,gap-1.3),.4,hit,{low:true,chain:true}),strip(at(c,n,gap+1.3),at(c,n,16),.4,hit,{low:true,chain:true}),strip(at(at(BOSS,d,front),n,gap),at(at(BOSS,d,19),n,gap),1.1,false,{safe:true})];}},
};
function slamDouble(b,m){return guardianPhase(b)>=3||fast(m)&&guardianPhase(b)>=2;}

export const ATTACK_KINDS=Object.keys(ATTACKS);
export const AREA_PATTERNS=[
 [['roots','slam'],['seeds','roots','slam'],['overgrowth','roots','seeds','slam']],
 [['volley','gale'],['dive','volley','gale'],['twisters','gale','volley','dive']],
 [['prism','shards'],['cage','prism','shards'],['chain','prism','cage','shards']],
];
export const LEGACY_PATTERNS=[['quake','beam'],['falls','quake','beam'],['beam','falls','quake','beam']];
export const attackSpec=kind=>ATTACKS[kind]||ATTACKS.quake;
export const bigAttack=kind=>!!ATTACKS[kind]?.big;
export function attackShapes(b,mode='relaxed'){
 const live=['windup','strike','recovery'].includes(b.phase),spec=attackSpec(b.kind),out=live&&b.phase!=='recovery'?spec.shapes(b,mode):[];
 if(live)for(const h of b.hazards||[])out.push(circle(h,.8,true,{bush:true}));
 return out;
}
export function bodyRadius(body){return((body?.halfWidth??.35)+(body?.halfDepth??.35))/2;}
export function touches(s,p,r){switch(s.type){case'circle':return dist(p,s)<s.r+r;case'ring':return Math.abs(dist(p,s)-s.r)<s.w+r;case'strip':return segmentDistance(p,s.a,s.b)<s.w+r;case'cover':return!s.safe.some(c=>dist(p,c)<c.r-.3);}return false;}
export function shapesHit(shapes,p,body){const r=bodyRadius(body);return shapes.some(s=>s.hit&&!(s.low&&p.y>=JUMP_CLEAR)&&touches(s,p,r));}
// Crystal cage wall: solid all round except its gap, from the moment it has risen.
export function cageWall(b){if(b.kind!=='cage'||!(b.phase==='windup'&&b.timer>.5||b.phase==='strike')||b.targets.length<2)return null;const[c,g]=b.targets;return{x:c.x,z:c.z,r:CAGE_R,gap:angleTo(c,g),half:CAGE_GAP};}
export function blockCage(wall,prev,p,body){
 const r=bodyRadius(body),d0=dist(prev,wall),d1=dist(p,wall),a=angleTo(wall,p),off=Math.abs(Math.atan2(Math.sin(a-wall.gap),Math.cos(a-wall.gap)));
 if(off<=wall.half-Math.asin(Math.min(1,r/wall.r)))return false;
 const inner=wall.r-.3-r,outer=wall.r+.3+r;let target=null;
 if(d0<=inner+.05&&d1>inner)target=inner;else if(d0>=outer-.05&&d1<outer)target=outer;else if(d1>inner&&d1<outer)target=d0<wall.r?inner:outer;
 if(target===null)return false;const u=d1?{x:(p.x-wall.x)/d1,z:(p.z-wall.z)/d1}:{x:0,z:1};p.x=wall.x+u.x*target;p.z=wall.z+u.z*target;return true;
}
export const CAGE={radius:CAGE_R,gap:CAGE_GAP};
export const DIVE={radius:DIVE_R};
