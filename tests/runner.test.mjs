import{test}from'node:test';import assert from'node:assert/strict';
import{RUNNER,TRAIL_STRETCH,trailWarp,stretchZ}from'../dist/runner-mode.js';
import{CHAPTER_LENGTH,chapterPath,END}from'../dist/trail-layout.js';
import{gateRival,GATE_RUNUP,runFor,setRunnerWords,runSurface,LANES,CLEARING,RUN_SCALE,laneSpan,speedAt,speedRange,hurdleHeight}from'../dist/runner-course.js';import{FORM_HEIGHTS}from'../dist/world-layout.js';import{jumpTuning}from'../dist/jump-tuning.js';
import{RunnerControl}from'../dist/runner-control.js';
import{sectionFor,localPoint,courseCoordinates}from'../dist/traversal-layout.js';

const expedition={id:'t',area:0,adventureVersion:2,level:0,serial:1,choices:Array(5).fill('left'),index:1};
// Runner sections exist only on the stretched map, so these tests use a straight 60 m section of the same shape.
const withRun=(index,mode='relaxed',length=index%4===0?44:60,area=0)=>{const s={id:`t:travel:${index}`,index,chapter:Math.floor(index/4),side:'left',area,start:{x:0,z:0},forward:{x:0,z:-1},right:{x:1,z:0},length};s.run=runFor(s,expedition,mode,true);return s;};

test('[classic] classic play is untouched unless runner mode is asked for',()=>{
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
  assert.ok(Math.abs(run.to-(s.length-(gateRival(s)?CLEARING:GATE_RUNUP)))<1e-9,'a guarded gate keeps its clearing, the others run right up to the gate');assert.equal(run.length,Math.round(run.real*RUN_SCALE));
  assert.ok(speedAt(run,run.length*.9)>speedAt(run,run.length*.2)+3,'faster and faster toward the gate');
  for(const o of run.obstacles){assert.ok(o.s>0&&o.s<run.length);if(o.type==='hole')assert.ok(o.lanes.length<3,'holes never close every lane');}
  // Reaction time between beats (a trial moment counts as one beat: its own pieces are deliberately close).
  const beats=[];for(const o of run.obstacles){const key=o.id.includes(':moment:')?o.id.split(':moment:')[1].split(':').slice(0,2).join(':'):o.id;const at=o.start??o.stream?.start??o.s;if(beats.at(-1)?.key===key)beats.at(-1).end=Math.max(beats.at(-1).end,o.end??o.s+o.depth/2);else beats.push({key,at,end:o.end??o.s+o.depth/2});}
  for(let i=1;i<beats.length;i++)assert.ok((beats[i].at-beats[i-1].end)/speedAt(run,beats[i].at)>=(mode==='challenge'?.6:.8),'enough reaction time between beats');
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
  for(const o of run.obstacles.filter(o=>RUNNER_STYLES[o.type]&&o.style!=='stream')){assert.ok(RUNNER_STYLES[o.type][area].includes(o.style),`${o.style} belongs to arena ${area}`);if(o.type==='swamp'){assert.ok(o.lanes.length<3);assert.equal(runSurface(run,o.s,LANES[o.lanes[0]]),0,'swamps are ground, not holes');}}}
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
test('the word closes as soon as it is spelled or its last row is passed, not at the end of the run',()=>{
 setRunnerWords([{id:'w1',en:'rule',tr:'kural'}]);
 const section=withRun(2),run=section.run,word=run.word,nav=navFor(section),r=new RunnerControl(),closed=[];r.events={word:(w,letters)=>closed.push(letters.join(''))};r.engage(nav);
 for(const t of word.tokens.filter(t=>t.correct)){r.s=t.s;r.lat=LANES[t.lane];r.collide(nav);}
 assert.deepEqual(closed,[word.answer],'closes on the last correct letter');r.finish(section,nav);assert.equal(closed.length,1,'and only once');
 const other=withRun(6),missed=[],r2=new RunnerControl();r2.events={word:(w,letters)=>missed.push(letters)};const nav2=navFor(other);r2.engage(nav2);
 r2.s=other.run.word.tokens.at(-1).s+2;r2.collide(nav2);assert.equal(missed.length,1,'closes once the last row is behind');assert.ok(missed[0].every(c=>c===null));
});
test('Low graphics keeps the track readable with far fewer objects; the HUD helpers are safe without a page',async()=>{
 const{makeRunnerScenery}=await import('../dist/runner-props.js');const{flash,runProgress}=await import('../dist/runner-hud.js');
 // Triangles drawn per tile (walls, backdrop, arches) are what cheaper phones feel.
 const count=low=>{let n=0;makeRunnerScenery(withRun(5),{creatureHeight:1,low}).traverse(o=>{if(o.isMesh&&!o.isInstancedMesh){const g=o.geometry;n+=(g.index?g.index.count:g.attributes.position.count)/3;}});return n;};
 const full=count(false),low=count(true);assert.ok(low<full*.8,`low ${low} vs full ${full}`);
 flash('Stumble!');runProgress(.5);runProgress(null);
});
test('the valley eases away while the track slides and grows back for the final real metres',async()=>{
 const T=await import('../dist/vendor/three.module.min.js');const{TrailWorld}=await import('../dist/trail-world.js');
 const w=Object.create(TrailWorld.prototype),field=new T.Group(),cluster=new T.Group(),meadow=new T.Group(),crowns=new T.Mesh();cluster.name='environment-cluster-3';meadow.name='valley-meadow';field.add(cluster,meadow);
 const run={length:400,real:40},runner={running:true,s:10,section:{run}};
 Object.assign(w,{nav:{runner},environmentField:field,crowns,scene:{fog:{near:40,far:125}},time:0});
 const step=n=>{for(let i=0;i<n;i++){w.time+=.05;w.updateTrackVeil();}};
 step(2);assert.ok(meadow.scale.y<1&&meadow.scale.y>0,'sinking, not vanishing');assert.ok(w.scene.fog.far<125);
 step(20);assert.equal(meadow.visible,false);assert.equal(cluster.visible,false);assert.equal(crowns.visible,false);assert.ok(w.scene.fog.far<=82.5);
 runner.s=run.length-run.real+2;step(2);assert.ok(meadow.visible&&meadow.scale.y>0&&meadow.scale.y<1,'growing back');
 step(20);assert.equal(meadow.scale.y,1);assert.equal(crowns.visible,true);assert.equal(cluster.scale.y,1);assert.deepEqual([w.scene.fog.near,w.scene.fog.far],[40,125]);assert.equal(w.trackVeil,null);
});

test('each chapter brings all six trials back as runner moments, and power-ups ride the open lanes',async()=>{
 const{RUN_MOMENTS}=await import('../dist/runner-course.js');
 for(const mode of['relaxed','challenge'])for(let chapter=0;chapter<5;chapter++){const seen=new Set();for(let n=0;n<4;n++){const run=withRun(chapter*4+n,mode).run;run.moments.forEach(k=>seen.add(k));assert.ok(run.powerups.length>=1);for(const p of run.powerups)assert.ok(!run.obstacles.some(o=>Math.abs(o.s-p.s)<1&&o.lanes.includes(p.lane)&&o.type!=='wind'),'power-ups are not inside an obstacle');}
  assert.deepEqual([...seen].sort(),[...RUN_MOMENTS].sort(),`chapter ${chapter}`);}
});
function momentRun(kind,mode='relaxed'){for(let i=0;i<40;i++){const s=withRun(i%20,mode,60+i);const o=s.run.obstacles.find(o=>o.type===kind||(kind==='stones'&&o.style==='stream'));if(o)return{section:s,o};}throw Error('no '+kind);}
test('boulders roll down one warned lane at a time and a lane change avoids them',()=>{
 const{section,o}=momentRun('boulders'),nav=navFor(section),r=new RunnerControl(),hits=[];r.events={stumble:x=>hits.push(x.id)};r.engage(nav);r.s=o.start-10;
 let warned=false;for(let i=0;i<600&&r.s<o.end;i++){r.advance(nav,1/60);const st=r.trials.get(o.id);if(st?.warn!=null)warned=true;const near=st?.rolling.find(b=>b.s-r.s<6&&b.s>r.s);if(near&&near.lane===r.laneNow())r.lane=(near.lane+1)%3;r.collide(nav);}
 assert.ok(warned,'an amber warning comes first');assert.deepEqual(hits,[],'dodging every boulder');
 const r2=new RunnerControl(),nav2=navFor(section);r2.events={stumble:x=>hits.push(x.id)};r2.engage(nav2);r2.s=o.start-10;for(let i=0;i<900&&!hits.length;i++){r2.advance(nav2,1/60);const st=r2.trials.get(o.id);if(st?.rolling[0])r2.lane=st.rolling[0].lane;r2.collide(nav2);}
 assert.ok(hits.length>0,'standing in the boulder lane is a stumble');
});
test('wind gusts push one lane downwind after a warning, and a dash rides through',()=>{
 const{section,o}=momentRun('wind'),nav=navFor(section),r=new RunnerControl(),gusts=[];r.events={gust:()=>gusts.push(r.lane)};r.engage(nav);r.s=o.start+1;r.lane=1;let warned=false;
 for(let i=0;i<60*o.period*1.2;i++){r.advance(nav,1/60);if(r.trials.get(o.id)?.warning)warned=true;if(r.s>o.end)break;}
 assert.ok(warned);assert.deepEqual(gusts,[1+o.dir]);
 const r2=new RunnerControl(),nav2=navFor(section);r2.engage(nav2);r2.s=o.start+1;r2.lane=1;r2.power.dash=99;for(let i=0;i<60*o.period*1.2;i++)r2.advance(nav2,1/60);assert.equal(r2.lane,1);
});
test('stepping stones leave one lane per row; a fall returns to the bank lined up with the first stone',()=>{
 const{section,o}=momentRun('stones'),run=section.run,rows=run.obstacles.filter(x=>x.stream?.start===o.stream.start);
 for(const w of rows){const stone=run.obstacles.find(x=>x.type==='stone'&&x.s===w.s),wet=rows.filter(x=>x.s===w.s).flatMap(x=>x.lanes);assert.equal(wet.length,2);assert.deepEqual(stone.lanes,[0,1,2].filter(l=>!wet.includes(l)));assert.equal(runSurface(run,w.s,LANES[stone.lanes[0]]),0);assert.equal(runSurface(run,w.s,LANES[w.lanes[0]]),null);}
 const nav=navFor(section),r=new RunnerControl();r.engage(nav);r.s=rows[2].s;r.lane=rows[2].lanes[0];assert.ok(r.afterRetry(nav));assert.ok(r.s<o.stream.start);assert.equal(r.lane,o.stream.first);
});
test('Cast shatters a crystal gate from range; running into an unbroken gate is a stumble',()=>{
 const{section,o}=momentRun('crystal'),nav=navFor(section),r=new RunnerControl(),broke=[],hits=[];r.events={crystal:g=>broke.push(g.id),stumble:x=>hits.push(x.id)};r.engage(nav);
 r.s=o.s-25;assert.equal(r.cast(),false,'out of range');r.s=o.s-12;assert.equal(r.cast(),true);assert.deepEqual(broke,[o.id]);r.s=o.s;assert.equal(r.collide(nav),null);
 const r2=new RunnerControl(),nav2=navFor(section);r2.events={stumble:x=>hits.push(x.id)};r2.engage(nav2);r2.s=o.s;assert.ok(r2.collide(nav2));assert.deepEqual(hits,[o.id]);
});
test('thorns rise and fall per lane with at least one lane always open',()=>{
 const{section,o}=momentRun('thorns'),r=new RunnerControl();r.section=section;
 for(let t=0;t<o.period*3;t+=.02){const open=[0,1,2].filter(l=>!r.thornUp(o,l,t));assert.ok(open.length>=1,`t ${t}`);}
 const nav=navFor(section);r.engage(nav);r.s=o.s;for(let t=0;t<o.period;t+=.05){r.clock=t;const lane=[0,1,2].find(l=>!r.thornUp(o,l,t));r.lane=lane;r.lat=LANES[lane];nav.invincible=0;assert.equal(r.collide(nav),null,'the open lane is safe');}
});
test('the optional ledge raises its lane, carries bonus coins and leaves the other lanes flat',()=>{
 const{section,o}=momentRun('ledge'),run=section.run,lane=o.lanes[0],top=o.start+o.ramp+1;
 assert.equal(runSurface(run,top,LANES[lane]),o.h);assert.equal(runSurface(run,top,LANES[(lane+1)%3]),0);assert.ok(Math.abs(runSurface(run,o.start+o.ramp/2,LANES[lane])-o.h/2)<1e-9);
 const bonus=run.coins.filter(c=>c.s>o.start+o.ramp&&c.s<o.end&&c.lateral===LANES[lane]);assert.ok(bonus.length>=6&&bonus.every(c=>c.y>o.h));
 const nav=navFor(section),r=new RunnerControl(),got=[];r.events={coin:c=>got.push(c.id)};r.engage(nav);r.lane=lane;r.lat=LANES[lane];r.s=bonus[0].s;nav.y=0;r.collide(nav);assert.deepEqual(got,[],'not from the ground');nav.y=o.h;r.collide(nav);assert.deepEqual(got,[bonus[0].id],'from the ledge');
});
test('power-ups: magnet pulls coins from every lane, double pays twice, shield absorbs one stumble, dash smashes through',()=>{
 const section=withRun(5),run=section.run,nav=navFor(section),r=new RunnerControl(),coins=[],events=[];r.events={coin:c=>coins.push(c),shield:()=>events.push('shield'),smash:()=>events.push('smash'),stumble:()=>events.push('stumble')};r.engage(nav);
 run.coins=[{id:'c0',s:50,lateral:LANES[0],y:.58},{id:'c2',s:52,lateral:LANES[2],y:.58}];run.obstacles=[];r.lane=1;r.lat=0;r.s=50;r.power.magnet=5;r.power.double=5;r.collide(nav);
 assert.deepEqual(coins.map(c=>c.id),['c0','c2']);assert.ok(coins.every(c=>c.double));
 run.obstacles=[{id:'b1',type:'barrier',s:60,depth:.45,lanes:[0,1,2]},{id:'b2',type:'barrier',s:70,depth:.45,lanes:[0,1,2]},{id:'h1',type:'hole',s:80,depth:2.4,lanes:[0,1,2]}];
 r.power={shield:true};r.s=60;assert.equal(r.collide(nav),null);assert.equal(r.power.shield,false);nav.invincible=0;r.s=70;assert.ok(r.collide(nav),'only one stumble is absorbed');
 r.power={dash:2};r.s=80;assert.equal(r.surface(),null);r.advance(nav,1/60);assert.equal(r.surface(),0,'a dash bridges the hole');assert.deepEqual(events,['shield','stumble']);
});
test('a dodge just before an obstacle is a Perfect; boost bursts on fuel',()=>{
 const section=withRun(5),run=section.run,nav=navFor(section),r=new RunnerControl(),perfect=[];r.events={perfect:o=>perfect.push(o.id)};r.engage(nav);
 run.obstacles=[{id:'p1',type:'barrier',s:40,depth:.45,lanes:[1]}];r.s=39.5;r.lane=1;r.lat=0;r.shift(1);for(let i=0;i<20;i++)r.advance(nav,1/60);assert.deepEqual(perfect,['p1']);
 nav.rush={start(){return true;},reset(){}};assert.equal(r.boost(nav),true);assert.ok(r.burst>0);assert.equal(r.boost(nav),false,'one burst at a time');
});
test('never stuck at a stream: after a second fall its stones settle into a bridge',()=>{
 const{section,o}=momentRun('stones'),run=section.run,nav=navFor(section),r=new RunnerControl(),bridges=[];r.events={bridge:()=>bridges.push(1)};r.engage(nav);
 const water=run.obstacles.filter(x=>x.stream?.start===o.stream.start);
 for(let fall=0;fall<2;fall++){r.running=true;r.s=water[1].s;r.lane=water[1].lanes[0];r.lat=LANES[r.lane];assert.equal(r.surface(),null);r.afterRetry(nav);}
 assert.equal(bridges.length,1);r.s=water[1].s;r.lat=LANES[water[1].lanes[0]];assert.equal(r.surface(),0,'the whole stream now carries the creature');
});
test('guardian sightings come in the last run of chapters 2, 3 and 4 only, each longer and fiercer, with the area guardian\'s own attacks',async()=>{
 const{SIGHTINGS,CHASE_KITS}=await import('../dist/runner-course.js');
 for(const area of[0,1,2]){const found=[];
  for(let index=0;index<20;index++){const run=withRun(index,'relaxed',undefined,area).run,g=run.obstacles.filter(o=>o.type==='guardian');if(index%4===3&&index>=7&&index<=15){assert.equal(g.length,1,`run ${index}`);found.push(g[0]);}else assert.equal(g.length,0,`run ${index}`);}
  assert.deepEqual(found.map(g=>g.level),[1,2,3]);
  for(let i=1;i<3;i++){assert.ok(found[i].duration>found[i-1].duration);assert.ok(new Set(found[i].attacks.map(a=>a.kind)).size>new Set(found[i-1].attacks.map(a=>a.kind)).size||found[i].attacks.length>found[i-1].attacks.length);}
  assert.deepEqual([...new Set(found[0].attacks.map(a=>a.kind))],[CHASE_KITS[area][0]],'the first sighting teaches one attack');assert.deepEqual([...new Set(found[2].attacks.map(a=>a.kind))].sort(),[...CHASE_KITS[area]].sort(),'the last shows all three');
  for(const g of found){assert.ok(SIGHTINGS[g.level].duration>=10&&SIGHTINGS[g.level].duration<=15);assert.ok(g.attacks.every(a=>a.t-g.warn>=1.5),'nothing before it has risen and roared');assert.ok(g.attacks.at(-1).t<g.duration-2,'the last attack comes before it leaves');}}
});
function guardianRun(level=3,mode='relaxed',area=0){const index=[7,11,15][level-1];const section=withRun(index,mode,undefined,area),o=section.run.obstacles.find(x=>x.type==='guardian');return{section,o};}
function playGuardian(section,o,policy,seconds=20){
 const nav=navFor(section),r=new RunnerControl(),log=[];r.events={roar:()=>log.push('roar'),warn:a=>log.push('warn:'+a.kind),attack:a=>log.push('attack:'+a.kind),stumble:x=>log.push((String(x.id).startsWith(o.id)?'hit:':'track:')+x.type)};r.engage(nav);r.s=o.start-1;
 let vy=0;for(let i=0;i<seconds*60;i++){const st=r.trials.get(o.id);policy?.(r,nav,st);r.advance(nav,1/60);
  if(nav.jumpUntil>r.clock){nav.y=1.1;}else nav.y=0;r.collide(nav);}
 return{r,log,st:r.trials.get(o.id),nav};
}
// A student who reads the warnings: leaves amber lanes for a blue or clear one, sidesteps what is coming down
// its lane, and jumps every wave unless it stands in the storm chain's gap.
const readWarnings=(r,nav,st)=>{if(!st)return;const danger=new Set(st.pose?.lanes||[]),near=new Set();
 for(const p of st.flying){const at=p.flight?p.to:p.s;if(at>r.s-.5&&at-r.s<16){danger.add(p.lane);if(p.turn!=null)danger.add(p.turn);}if(at>r.s-.5&&at-r.s<9)near.add(p.lane);}
 // Never cut across a lane with something about to arrive in it.
 const path=l=>[...Array(Math.abs(l-r.lane)+1).keys()].map(i=>r.lane+Math.sign(l-r.lane)*i).slice(1,-1).every(m=>!near.has(m));
 if(danger.has(r.lane)){const options=[st.pose?.gap,...[0,1,2].sort((x,y)=>Math.abs(x-r.lane)-Math.abs(y-r.lane))].filter(l=>l!=null&&!danger.has(l)&&path(l));if(options.length)r.lane=options[0];}
 for(const w of st.waves)if(w.gap!==r.lane&&w.s-r.s<3.2&&w.s>r.s&&!(nav.jumpUntil>r.clock))nav.jumpUntil=r.clock+.5;};
test('the guardian rises, roars, warns before every attack and backs away when the sighting ends',async()=>{
 const{CHASE_KITS}=await import('../dist/runner-course.js');
 for(const area of[0,1,2]){const{section,o}=guardianRun(3,'relaxed',area),{log,st}=playGuardian(section,o,null,o.duration+3);
  assert.equal(log[0],'roar');const warns=log.filter(x=>x.startsWith('warn:')),attacks=log.filter(x=>x.startsWith('attack:'));assert.equal(warns.length,o.attacks.length);assert.equal(attacks.length,o.attacks.length);
  for(const kind of CHASE_KITS[area])assert.ok(log.indexOf('warn:'+kind)>=0&&log.indexOf('warn:'+kind)<log.indexOf('attack:'+kind),`${kind} is warned first`);
  assert.equal(st.visible,false,'gone after its sighting');assert.ok(log.some(x=>x.startsWith('hit:')),'standing still gets hit');}
});
test('every guardian\'s chase attacks can be dodged by reading the warnings, in every sighting and both modes',()=>{
 for(const area of[0,1,2])for(const mode of['relaxed','challenge'])for(const level of[1,2,3]){const{section,o}=guardianRun(level,mode,area);
  const{log}=playGuardian(section,o,readWarnings,o.duration+3);assert.deepEqual(log.filter(x=>x.startsWith('hit:')),[],`area ${area} ${mode} sighting ${level}`);}
});
test('volley and sky dive aim at the lane the creature is in, the prism beam bounces into its second lane, and the storm chain spares its gap',()=>{
 const{section,o}=guardianRun(3,'relaxed',1),seen=[];const{log}=playGuardian(section,o,(r,nav,st)=>{if(st?.pose&&['volley','dive'].includes(st.pose.kind)){seen.push(st.pose.lane===r.laneNow());r.lane=2;}},o.duration+3);assert.ok(seen.length&&seen[0],'aimed at the lane the creature was in');
 const p=guardianRun(3,'relaxed',2),prism=p.o.attacks.find(a=>a.kind==='prism'),chain=p.o.attacks.find(a=>a.kind==='chain');assert.notEqual(prism.lanes[0],prism.lanes[1]);
 let bounced=false;playGuardian(p.section,p.o,(r,nav,st)=>{r.lane=3-prism.lanes[0]-prism.lanes[1];for(const f of st?.flying||[])if(f.kind==='prism'&&f.bounced)bounced=f.lane===prism.turn;},p.o.duration+3);assert.ok(bounced,'the beam switched lanes');
 const g=playGuardian(p.section,p.o,(r,nav,st)=>{r.lane=chain.gap;},p.o.duration+3);assert.ok(!g.log.includes('hit:chain'),'the gap lane is safe without jumping');
});
test('the final chase exists only after the last gate, runs to the arena and asks for the fight',()=>{
 const e={id:'t',area:0,index:19,choices:['left','left','left','left','left'],battle:null},r=new RunnerControl();
 assert.equal(r.finale(e,'relaxed'),null,'not before the last gate');e.index=20;const section=r.finale(e,'relaxed');assert.ok(section?.run?.finale);
 const run=section.run,g=run.obstacles.find(o=>o.type==='guardian');assert.ok(g.finale&&g.attacks.length>20&&new Set(g.attacks.map(a=>a.kind)).size===3);assert.ok(run.length>=600);
 for(let i=1;i<g.attacks.length;i++)if(!g.attacks[i].shot)assert.ok(g.attacks[i].t-g.attacks[i-1].t>=g.warn+.3,'every attack gets its warning');
 e.battle={};assert.equal(new RunnerControl().finale(e,'relaxed'),null,'not during the fight');e.battle=null;
 const nav={...navFor(section),state:{index:20,travel:{collected:[]}}},rc=new RunnerControl(),finished=[];rc.events={finish:x=>finished.push(x.id)};nav.section=section;rc.engage(nav);rc.power.dash=999;
 for(let i=0;i<60*120&&!finished.length;i++){rc.power.dash=999;rc.advance(nav,1/60);rc.collide(nav);}
 assert.deepEqual(finished,[section.id]);assert.ok(Math.abs(courseCoordinates(section,nav.player).s-run.to)<.6,'arrives at the arena');
});
test('each guardian\'s final chase can be run without a guardian hit by reading the warnings',()=>{
 for(const area of[0,1,2])for(const mode of['relaxed','challenge']){const e={id:'t'+area,area,index:20,choices:Array(5).fill('left'),battle:null},section=new RunnerControl().finale(e,mode),o=section.run.obstacles.find(x=>x.type==='guardian');
  assert.equal(o.area,area);const{log}=playGuardian(section,{...o,start:o.start},readWarnings,70);const kinds=new Set(log.filter(x=>x.startsWith('attack:')).map(x=>x.slice(7)));
  assert.ok(kinds.size===3,`area ${area} shows all three attacks`);assert.deepEqual(log.filter(x=>x.startsWith('hit:')),[],`area ${area} ${mode}`);}
});
