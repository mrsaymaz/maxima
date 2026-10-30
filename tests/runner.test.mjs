import{test}from'node:test';import assert from'node:assert/strict';
import{RUNNER,TRAIL_STRETCH,trailWarp,stretchZ}from'../dist/runner-mode.js';
import{CHAPTER_LENGTH,chapterPath,END}from'../dist/trail-layout.js';
import{runFor,setRunnerWords,runSurface,LANES,CLEARING,RUN_SCALE,laneSpan,speedAt,speedRange,hurdleHeight}from'../dist/runner-course.js';import{FORM_HEIGHTS}from'../dist/world-layout.js';import{jumpTuning}from'../dist/jump-tuning.js';
import{RunnerControl}from'../dist/runner-control.js';
import{sectionFor,localPoint,courseCoordinates}from'../dist/traversal-layout.js';

const expedition={id:'t',area:0,adventureVersion:2,level:0,serial:1,choices:Array(5).fill('left'),index:1};
// Runner sections exist only on the stretched map, so these tests use a straight 60 m section of the same shape.
const withRun=(index,mode='relaxed',length=index%4===0?44:60)=>{const s={id:`t:travel:${index}`,index,chapter:Math.floor(index/4),side:'left',area:0,start:{x:0,z:0},forward:{x:0,z:-1},right:{x:1,z:0},length};s.run=runFor(s,expedition,mode,true);return s;};

test('classic play is untouched unless runner mode is asked for',()=>{
 assert.equal(RUNNER,false);assert.equal(TRAIL_STRETCH,1);assert.equal(CHAPTER_LENGTH,132);assert.equal(END.z,-666);assert.equal(stretchZ(-400),-400);
 assert.deepEqual(chapterPath(1,'left').map(p=>p.z),[-130,-141,-160,-190,-220,-250,-262]);
 assert.equal(sectionFor(expedition,1,'relaxed','left').run,undefined);assert.equal(runFor(withRun(1),expedition,'relaxed'),null,'no runs in classic mode');
});
test('the runner warp stretches every gap between gates, keeps forks compact and is continuous and invertible',()=>{
 const w=trailWarp(2.5);let previous=Infinity;
 for(let z=12;z>-760;z-=.5){const s=w.stretchZ(z);assert.ok(s<previous,`monotonic at ${z}`);previous=s;assert.ok(Math.abs(w.classicZ(s)-z)<1e-9);}
 assert.equal(w.stretchZ(-9),-9,'the first fork is unchanged');assert.equal(w.stretchZ(-58)-w.stretchZ(-88),75,'gates 75 m apart instead of 30');
 assert.equal(w.stretchZ(-130),-w.span+2,'each chapter ends where the next fork begins');
});
test('runs are ten times their stretch, speed up toward the gate, stay inside the track and always leave a way through',()=>{
 setRunnerWords([{id:'w1',en:'rule',tr:'kural'},{id:'w2',en:'science club',tr:'fen kulübü'},{id:'w3',en:'whistle',tr:'düdük'}]);
 for(const mode of['relaxed','challenge'])for(let index=0;index<20;index++){
  const s=withRun(index,mode),again=withRun(index,mode),run=s.run;assert.deepEqual(run,again.run);
  assert.ok(Math.abs(run.to-(s.length-CLEARING))<1e-9,'the last metres before the gate stay free');assert.equal(run.length,Math.round(run.real*RUN_SCALE));
  assert.ok(speedAt(run,run.length*.9)>speedAt(run,run.length*.2)+3,'faster and faster toward the gate');
  for(const o of run.obstacles){assert.ok(o.s>0&&o.s<run.length);if(o.type==='hole')assert.ok(o.lanes.length<3,'holes never close every lane');}
  for(let i=1;i<run.obstacles.length;i++){const a=run.obstacles[i-1],b=run.obstacles[i];assert.ok((b.s-a.s)/speedAt(run,b.s)>=(mode==='challenge'?1:1.35),'enough reaction time between obstacles');}
  for(const c of run.coins)assert.ok(c.s<=run.length&&LANES.includes(c.lateral));
  if(index%4===2){const word=run.word;assert.ok(word,'every third run of a chapter is a word run');
   const slots=[...word.answer].map((c,i)=>word.tokens.filter(t=>t.slot===i));
   slots.forEach((row,i)=>{assert.equal(row.length,3);assert.equal(row.filter(t=>t.correct).length,1);assert.equal(row.find(t=>t.correct).letter,word.answer[i]);assert.ok(row.filter(t=>!t.correct).every(t=>t.letter!==word.answer[i]));
    if(i){const gap=row[0].s-slots[i-1][0].s;assert.ok(gap/speedAt(run,row[0].s)>=2.5,'time to switch lanes between letter rows');assert.ok(run.coins.some(c=>c.s>slots[i-1][0].s&&c.s<row[0].s),'coins between letter rows');}});
   assert.ok(['rule','whistle','kural','düdük'].includes(word.answer),'single words only');assert.ok(!run.obstacles.some(o=>o.s>word.tokens[0].s-2&&o.s<word.tokens.at(-1).s+2),'no obstacles among the letters');}
 }
});
function navFor(section,level=0){
 return{section,state:{index:section.index,travel:{collected:[]}},player:localPoint(section,section.run.from+.5,0),height:FORM_HEIGHTS[level],recovery:0,combat:null,y:0,vy:0,grounded:true,invincible:0,rush:null,support(){return 0;},requestJump(){this.jumped=true;return true;}};
}
test('the run slides the track under the creature, then its final real metres reach the gate clearing',()=>{
 const section=withRun(1),run=section.run,nav=navFor(section),r=new RunnerControl();
 assert.equal(r.engage(nav),true);const start=courseCoordinates(section,nav.player).s;
 let t=0;while(r.running&&t<200){r.advance(nav,1/30);t+=1/30;if(r.s<run.length-run.real-1)assert.ok(Math.abs(courseCoordinates(section,nav.player).s-run.from)<.6,'held in place on the moving track');}
 assert.ok(r.done.has(section.id));assert.ok(Math.abs(courseCoordinates(section,nav.player).s-run.to)<.5,'arrives at the clearing');assert.ok(t>run.length/run.top,'a long run');assert.ok(start<run.from+1);
});
test('an unbeaten rival waiting in the clearing does not turn the run into a walk; a started fight does',()=>{
 const section=withRun(1),nav=navFor(section),r=new RunnerControl();nav.combat={blocking:{active:false}};assert.equal(r.engage(nav),true);
 nav.combat={blocking:{active:true}};assert.equal(r.engage(nav),false);
});
test('runner control steers into lanes and turns hurdles into stumbles that never block the way',()=>{
 const section=withRun(1),nav=navFor(section),r=new RunnerControl(),events=[];r.events={stumble:o=>events.push(o.type)};
 assert.equal(r.engage(nav),true);r.s=5;r.shift(1);for(let i=0;i<20;i++)r.advance(nav,1/30);assert.ok(Math.abs(r.lat-LANES[2])<.05,'reaches the right lane');
 const barrier={id:'b',type:'barrier',s:40,depth:.45,lanes:[0,1,2]};section.run.obstacles=[barrier];r.s=40;
 assert.equal(r.collide(nav),barrier);assert.deepEqual(events,['barrier']);assert.ok(r.s<40);
 nav.invincible=0;r.s=40;assert.equal(r.collide(nav),null,'a knocked hurdle no longer stops the creature');
 section.run.obstacles=[{id:'c',type:'bar',s:60,depth:.5,lanes:[0,1,2]}];r.s=60;r.slide(nav);assert.equal(r.collide(nav),null,'sliding passes under a bar');
});
test('every Form of every creature can clear hurdles, slide under bars and jump holes at run speed',()=>{
 for(let level=0;level<=10;level++){
  const height=FORM_HEIGHTS[level],tuning=jumpTuning(level),hurdle=hurdleHeight(height);
  assert.ok(tuning.rise>hurdle+.05,`Form ${level} jumps above its hurdle`);
  // Time with feet above the hurdle top, against the time the hurdle's collision band takes to pass at top speed.
  const above=2*Math.sqrt(2*(tuning.rise-(hurdle-.06))/13),band=(.45+.56)/speedRange('challenge',4).top;assert.ok(above>band*1.5,`Form ${level} clears the hurdle band`);
  assert.ok(tuning.flight*speedRange('relaxed',0).start>2.8+.4,`Form ${level} jumps the widest hole even at the slowest speed`);
  const section=withRun(1),nav=navFor(section,level),r=new RunnerControl();r.engage(nav);
  section.run.obstacles=[{id:'bar'+level,type:'bar',s:30,depth:.5,lanes:[0,1,2]},{id:'h'+level,type:'barrier',s:50,depth:.45,lanes:[0,1,2]}];
  r.s=30;r.slide(nav);assert.equal(r.collide(nav),null,`Form ${level} slides under`);
  r.s=50;nav.y=tuning.rise*.9;assert.equal(r.collide(nav),null,`Form ${level} sails over`);nav.y=0;nav.invincible=0;r.s=50;assert.ok(r.collide(nav),`a standing Form ${level} meets the hurdle`);
 }
});
test('after falling into a hole the creature returns before it, in a lane the hole leaves open',()=>{
 const section=withRun(1),nav=navFor(section),r=new RunnerControl();r.engage(nav);
 section.run.obstacles=[{id:'h',type:'hole',s:120,depth:2.4,lanes:[1,2]}];r.s=120;r.lane=1;
 assert.equal(r.afterRetry(nav),true);assert.ok(r.s<120-1.2-6);assert.equal(r.lane,0);assert.ok(Math.abs(r.lat-LANES[0])<1e-9);
});
test('every obstacle wears a look from its own arena, and swamps slow the creature instead of dropping it',async()=>{
 const{RUNNER_STYLES}=await import('../dist/runner-course.js');
 for(const area of[0,1,2])for(let index=0;index<20;index++){const base=withRun(index,index%2?'challenge':'relaxed'),run=runFor({...base,area},expedition,index%2?'challenge':'relaxed',true);
  for(const o of run.obstacles){assert.ok(RUNNER_STYLES[o.type][area].includes(o.style),`${o.style} belongs to arena ${area}`);if(o.type==='swamp'){assert.ok(o.lanes.length<3);assert.equal(runSurface(run,o.s,LANES[o.lanes[0]]),0,'swamps are ground, not holes');}}}
 const section=withRun(1),nav=navFor(section),r=new RunnerControl(),events=[];r.events={swamp:o=>events.push(o.id)};r.engage(nav);
 section.run.obstacles=[{id:'sw',type:'swamp',style:'swamp',s:120,depth:4,lanes:[1]}];r.s=120;r.speed=speedAt(section.run,120);
 r.collide(nav);r.collide(nav);assert.deepEqual(events,['sw'],'one splash per swamp');const fast=r.speed;for(let i=0;i<30;i++){r.s=120;r.collide(nav);r.advance(nav,1/30);}assert.ok(r.speed<fast*.6,'wading is slow');
});

test('runner mode has its own running loop per arena',async()=>{
 const{readFileSync,existsSync}=await import('node:fs');const m=JSON.parse(readFileSync('dist/assets/music/manifest.json','utf8'));
 for(const arena of['whisperwood','skyreach','stormglass']){const t=m.tracks['run-'+arena];assert.ok(t&&t.bpm>=130&&t.loop>40,arena);assert.ok(existsSync('dist/assets/music/'+t.base));}
});
test('a classic journey carries over to the runner with its positions moved onto the longer trail',async()=>{
 const{importClassicSave}=await import('../dist/runner-save.js');const{freshSave,freshJourney,freshExpedition}=await import('../dist/expedition.js');
 const save=freshSave(),j=freshJourney(),e=freshExpedition(j,'g5u1',0);e.position={x:-10,z:-58};e.checkpoint={position:{x:6,z:-200}};e.travel={collected:[],completed:[0],earned:3,retries:0,safe:{x:-10,z:-58,y:0,heading:1}};
 j.expeditions={[e.id]:e};save.journeys={g5u1:j};save.wallet={balance:12,total:12,owned:['air'],equipped:'air'};
 const w=trailWarp(2.5),runner=importClassicSave(save,w.stretchZ),moved=runner.journeys.g5u1.expeditions[e.id];
 assert.equal(moved.position.z,w.stretchZ(-58));assert.equal(moved.position.x,-10);assert.equal(moved.checkpoint.position.z,w.stretchZ(-200));assert.equal(moved.travel.safe.z,w.stretchZ(-58));
 assert.equal(runner.wallet.balance,12,'coins come along');assert.equal(e.position.z,-58,'the classic save itself is untouched');assert.equal(importClassicSave(null),null);
});
