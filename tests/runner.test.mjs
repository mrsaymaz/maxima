import{test}from'node:test';import assert from'node:assert/strict';
import{RUNNER,TRAIL_STRETCH,trailWarp,stretchZ}from'../dist/runner-mode.js';
import{CHAPTER_LENGTH,chapterPath,END}from'../dist/trail-layout.js';
import{runFor,setRunnerWords,runSurface,LANES,CLEARING,laneSpan}from'../dist/runner-course.js';
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
test('runner courses are deterministic, stay inside the run and always leave a way through',()=>{
 setRunnerWords([{id:'w1',en:'rule',tr:'kural'},{id:'w2',en:'science club',tr:'fen kulübü'},{id:'w3',en:'whistle',tr:'düdük'}]);
 for(const mode of['relaxed','challenge'])for(let index=0;index<20;index++){
  const s=withRun(index,mode),again=withRun(index,mode),run=s.run;assert.deepEqual(run,again.run);
  assert.ok(Math.abs(run.to-(s.length-CLEARING))<1e-9,'the last metres before the gate stay free');
  for(const o of run.obstacles){assert.ok(o.s>run.from&&o.s<run.to);if(o.type==='hole')assert.ok(o.lanes.length<3,'holes never close every lane');}
  for(const c of run.coins)assert.ok(c.s<=run.to&&LANES.includes(c.lateral));
  assert.equal(runSurface(s,run.to+5,0),undefined);
  if(index%4===2){const word=run.word;assert.ok(word,'every third run of a chapter is a word run');
   const slots=[...word.answer].map((c,i)=>word.tokens.filter(t=>t.slot===i));
   slots.forEach((row,i)=>{assert.equal(row.length,3);assert.equal(row.filter(t=>t.correct).length,1);assert.equal(row.find(t=>t.correct).letter,word.answer[i]);assert.ok(row.filter(t=>!t.correct).every(t=>t.letter!==word.answer[i]));});
   assert.ok(['rule','whistle','kural','düdük'].includes(word.answer),'single words only');}
 }
 const hole=withRun(1,'challenge').run.obstacles.find(o=>o.type==='hole');
 if(hole){const s=withRun(1,'challenge'),span=laneSpan(hole.lanes);assert.equal(runSurface(s,hole.s,(span.min+span.max)/2),null);}
});
function navFor(section){
 return{section,state:{index:section.index},player:localPoint(section,4,0),recovery:0,combat:null,y:0,vy:0,grounded:true,invincible:0,rush:null,support(){return 0;},requestJump(){this.jumped=true;return true;}};
}
test('runner control runs forward, steers into lanes, and turns hurdles into stumbles that never block the way',()=>{
 const section=withRun(1),nav=navFor(section),r=new RunnerControl(),events=[];r.events={stumble:o=>events.push(o.type)};
 assert.equal(r.engage(nav),true);assert.equal(r.lane,1);
 const forward=r.input(nav,.1);assert.ok(forward.x*section.forward.x+forward.z*section.forward.z>.99);
 r.shift(1);const steer=r.input(nav,.1);assert.ok(steer.x*section.right.x+steer.z*section.right.z>0,'steers toward the right lane');
 const barrier={id:'b',type:'barrier',s:10,depth:.45,lanes:[0,1,2],h:.5};section.run.obstacles=[barrier];
 nav.player=localPoint(section,10,0);r.engage(nav);assert.equal(r.collide(nav),barrier);assert.deepEqual(events,['barrier']);assert.ok(courseCoordinates(section,nav.player).s<10);
 nav.invincible=0;nav.player=localPoint(section,10,0);assert.equal(r.collide(nav),null,'a knocked hurdle no longer stops the creature');
 const bar={id:'c',type:'bar',s:14,depth:.5,lanes:[0,1,2]};section.run.obstacles=[bar];nav.player=localPoint(section,14,0);r.slide(nav);assert.equal(r.collide(nav),null,'sliding passes under a bar');
});
test('after falling into a hole the creature returns before it, in a lane the hole leaves open',()=>{
 const section=withRun(1),nav=navFor(section),r=new RunnerControl();
 section.run.obstacles=[{id:'h',type:'hole',s:12,depth:2.4,lanes:[1,2]}];nav.player=localPoint(section,12,LANES[1]);r.engage(nav);r.lane=1;
 assert.equal(r.afterRetry(nav),true);const q=courseCoordinates(section,nav.player);
 assert.ok(q.s<12-1.2-5);assert.equal(r.lane,0);assert.ok(Math.abs(q.lateral-LANES[0])<1e-9);
});
