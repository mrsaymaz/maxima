import{test}from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
import{freshGuardian,GuardianCombat,validGuardian,guardianQuestion,guardianPhase,inGuardianDanger,attackDuration,BOSS,ARENA,WARDS}from'../dist/guardian-combat.js';
import{AREA_PATTERNS,ATTACK_KINDS,attackShapes,bodyRadius,segmentDistance,cageWall,CAGE,JUMP_CLEAR}from'../dist/guardian-attacks.js';
const units=JSON.parse(fs.readFileSync('dist/data/expedition-language.json')).units,u=units[0];
const dt=.016,dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const create=(area,mode='relaxed',body)=>{const b=freshGuardian(u,'arena-'+area+mode);const events=[];return{b,events,c:new GuardianCombat(b,{area,mode,bodyProfile:body,event:(k,d)=>events.push([k,d])})};};

// How far a body is from touching a shape (negative = touching).
function clearance(s,q,r){if(s.type==='circle')return dist(q,s)-s.r-r;if(s.type==='strip')return segmentDistance(q,s.a,s.b)-s.w-r;if(s.type==='ring')return Math.abs(dist(q,s)-s.r)-s.w-r;return 9;}
// A student who reads the warnings: steers clear of amber and red shapes, heads for blue ones,
// jumps red low shapes, and casts at the open core.
function bot(c,b,mode,r){
 const p=b.player;
 if(b.phase==='ward'||b.phase==='finisher'){const{q}=guardianQuestion(b);c.answer(q.answer);return{x:0,z:0};}
 const shapes=attackShapes(b,mode),saved=b.timer,soon=[];for(const h of[.06,.12,.18]){b.timer=Math.min(20,saved+h);soon.push(...attackShapes(b,mode));}b.timer=saved;
 if(p.y===0&&soon.some(s=>s.hit&&s.low&&clearance(s,p,r)<0))c.jump();
 const recovery=b.phase==='recovery',goal=recovery?(()=>{const a=Math.atan2(p.x-BOSS.x,p.z-BOSS.z);return{x:BOSS.x+Math.sin(a)*5,z:BOSS.z+Math.cos(a)*5};})():null;
 if(recovery&&dist(p,BOSS)<7)c.attack();
 const cage=cageWall(b),inCage=cage&&dist(p,cage)<cage.r;
 let best=null,bestCost=Infinity;
 for(let k=-1;k<16;k++){const d=k<0?{x:0,z:0}:{x:Math.sin(k*Math.PI/8),z:Math.cos(k*Math.PI/8)};let cost=0;
  for(const[h,wt]of[[.15,1],[.4,1],[.8,.35]]){const q={x:p.x+d.x*4.9*h,z:p.z+d.z*4.9*h};
   if(dist(q,ARENA)>ARENA.radius-r-.2)cost+=5;
   for(const s of shapes){if(s.type==='cover'){cost+=wt*10*Math.min(...s.safe.map(c=>Math.max(0,dist(q,c)-(c.r-.7))));continue;}
    if(s.safe){if(inCage||s.type==='strip')cost+=s.type==='strip'?.5*Math.max(0,segmentDistance(q,s.a,s.b)-.4):3*dist(q,s);continue;}
    if(s.low)continue;const gap=clearance(s,q,r);cost+=wt*(s.twister?14:s.hit?10:6)*Math.max(0,(s.twister?2.5:.6)-gap);}
   cost+=wt*(goal?.4*dist(q,goal):.1*Math.max(0,dist(q,ARENA)-3)+.4*Math.max(0,7-dist(q,BOSS)));}
  if(cost<bestCost-1e-9){bestCost=cost;best=d;}}
 return best;
}
function fight(area,mode,body={halfWidth:.35,halfDepth:.35}){
 const{b,c,events}=create(area,mode,body),r=bodyRadius(body);let t=0;const kinds=new Set();
 while(b.phase!=='victory'&&t<400){const input=bot(c,b,mode,r);if(['windup','strike'].includes(b.phase))kinds.add(b.kind);c.step(dt,input);t+=dt;assert.ok(validGuardian(b),`invalid save at ${b.phase} ${b.kind}`);}
 return{b,events,kinds,t};
}

test('each guardian has its own attacks and adds one new attack per phase',()=>{const seen=new Set();AREA_PATTERNS.forEach((phases,area)=>{const own=new Set(phases.flat());for(const k of own){assert.ok(ATTACK_KINDS.includes(k));assert.ok(!seen.has(k),`${k} is shared`);}for(const k of own)seen.add(k);for(let i=1;i<3;i++)assert.ok(phases[i].some(k=>!phases[i-1].includes(k)),`area ${area} phase ${i+1} adds an attack`);const{b,c}=create(area);for(const hp of[100,50,20]){b.bossHp=hp;for(let i=0;i<6;i++){c.nextAttack();assert.ok(phases[guardianPhase(b)-1].includes(b.kind));}}});});

for(const area of[0,1,2])for(const mode of['relaxed','challenge'])test(`guardian ${area+1} (${mode}) can be beaten without a hit by reading the warnings, through both wards and the seals`,()=>{const{b,events,kinds,t}=fight(area,mode);assert.equal(b.phase,'victory',`stalled at ${b.bossHp}% after ${t.toFixed(0)} s`);assert.equal(events.filter(e=>e[0]==='hurt').length,0,`hurt by ${[...kinds]}`);assert.deepEqual([...kinds].sort(),[...new Set(AREA_PATTERNS[area].flat())].sort());assert.equal(events.filter(e=>e[0]==='ward').length,2);assert.ok(events.some(e=>e[0]==='boss-hit'&&e[1].critical),'a stagger gives a critical hit');assert.ok(t>40&&t<300,`fight length ${t}`);});

test('large Forms can still dodge every attack',()=>{for(const area of[0,1,2]){const body={halfWidth:1.1,halfDepth:1.3},{b,events}=fight(area,'challenge',body);assert.equal(b.phase,'victory');assert.equal(events.filter(e=>e[0]==='hurt').length,0,`area ${area}`);}});

test('wards stop the fight at 70 and 40 percent, wrong answers cost nothing, and a broken ward staggers the guardian',()=>{const{b,c,events}=create(0);assert.ok(b.wards.length===2&&b.wards.every(q=>q.options.includes(q.answer)));assert.ok(!b.wards.some(q=>b.seals.some(s=>s.id===q.id)));b.bossHp=80;b.phase='recovery';b.stagger=true;assert.ok(c.hitBoss());assert.equal(b.bossHp,WARDS[0],'critical hit stops at the ward');assert.equal(b.phase,'ward');assert.ok(validGuardian(b));const hp=b.hp,pos={...b.player};for(let i=0;i<300;i++)c.step(dt,{x:1,z:0});assert.deepEqual(b.player,pos);assert.equal(b.hp,hp);const q=b.wards[0];assert.ok(c.answer(q.options.find(x=>x!==q.answer)).mistake);assert.equal(b.phase,'ward');assert.ok(c.answer(q.answer).accepted);assert.equal(b.phase,'recovery');assert.ok(b.stagger);assert.equal(attackDuration(b),3.6+1.4);c.hitBoss();assert.equal(b.bossHp,56,'critical');assert.equal(c.hitBoss(),false,'one hit per opening');assert.ok(events.some(e=>e[0]==='ward-broken'));b.bossHp=45;c.nextAttack();b.phase='recovery';c.hitBoss();assert.equal(b.bossHp,WARDS[1]);assert.equal(b.phase,'ward');assert.equal(guardianQuestion(b).q,b.wards[1]);c.answer(b.wards[1].answer);assert.equal(b.wardStep,2);b.bossHp=15;c.nextAttack();b.phase='recovery';c.hitBoss();assert.equal(b.phase,'finisher');});

test('all 44 units provide two ward questions that differ from the seals',()=>{for(const unit of units){const b=freshGuardian(unit,'w');assert.equal(b.wards.length,2,unit.id);assert.ok(validGuardian(b));for(const q of b.wards){assert.ok(q.prompt.length<=115);assert.equal(new Set(q.options).size,3);}}});

test('saves from before the redesign still load and fight on',()=>{const b=freshGuardian(u,'old');delete b.wards;delete b.wardStep;delete b.hazards;delete b.stagger;b.phase='strike';b.kind='beam';b.targets=[{x:0,z:5}];assert.ok(validGuardian(b));const c=new GuardianCombat(b,{area:1});c.resume();assert.equal(b.kind,'volley');assert.ok(validGuardian(b));b.bossHp=75;b.phase='recovery';c.hitBoss();assert.equal(b.bossHp,68);assert.notEqual(b.phase,'ward','no wards without ward questions');});

test('jumps clear low attacks only: gale wall and storm chain yes, roots and prism beams no',()=>{const{b,c}=create(1);b.bossHp=50;c.nextAttack();while(b.kind!=='gale')c.nextAttack();b.phase='strike';b.timer=0;const s=attackShapes(b)[0];b.player={x:(s.a.x+s.b.x)/2,z:(s.a.z+s.b.z)/2,y:0,vy:0};assert.ok(inGuardianDanger(b));b.player.y=JUMP_CLEAR+.01;assert.equal(inGuardianDanger(b),false);
 const g=create(0).b;g.kind='roots';g.phase='windup';g.player={x:0,z:5,y:0,vy:0};g.targets=[{x:0,z:18}];g.phase='strike';g.timer=.6;g.player={x:0,z:2,y:1,vy:0};assert.ok(inGuardianDanger(g),'roots reach a jumping body');g.player.x=1.5;assert.equal(inGuardianDanger(g),false);});

test('the crystal cage blocks its wall and lets the creature out through the glowing gap',()=>{const{b,c}=create(2);b.bossHp=50;b.kind='cage';b.phase='windup';b.timer=0;b.player={x:0,z:6,y:0,vy:0};c.target();const wall=()=>cageWall(b);b.timer=.6;const w=wall();assert.ok(w);const away={x:-Math.sin(w.gap),z:-Math.cos(w.gap)};for(let i=0;i<80;i++)c.step(dt,away);assert.ok(dist(b.player,w)<CAGE.radius,'wall holds');b.player={x:w.x,z:w.z,y:0,vy:0};b.timer=.6;for(let i=0;i<80;i++)c.step(dt,{x:Math.sin(w.gap),z:Math.cos(w.gap)});assert.ok(dist(b.player,w)>CAGE.radius+.3,'gap lets it out');});

test('thorn bushes from seed pods stay for a while, hurt on touch and are cleared by a cast',()=>{const{b,c,events}=create(0);b.kind='seeds';b.phase='strike';b.timer=.49;b.player={x:6,z:8,y:0,vy:0};b.targets=[{x:0,z:6}];c.step(dt);assert.equal(b.hazards.length,1);b.phase='recovery';b.timer=0;b.player={x:0,z:9,y:0,vy:0};c.cooldown=0;assert.ok(c.attack());for(let i=0;i<60;i++)c.step(dt);assert.equal(b.hazards.length,0);assert.ok(events.some(e=>e[0]==='clear'));b.hazards=[{x:0,z:9,ttl:5}];b.player={x:0,z:9.4,y:0,vy:0};b.invulnerable=0;c.step(dt);assert.ok(events.some(e=>e[0]==='hurt'));});
