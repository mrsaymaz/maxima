import{test}from'node:test';import assert from'node:assert/strict';
import{freshSave,freshJourney,freshExpedition,currentType}from'../dist/expedition.js';
import{pathLevel}from'../dist/path-growth.js';
import{TrailNavigator}from'../dist/trail-nav.js';
import{activeNode,approachPoint}from'../dist/trail-layout.js';
import{sectionFor,localPoint}from'../dist/traversal-layout.js';
import{gateRival}from'../dist/runner-course.js';
import{RUNNER}from'../dist/runner-mode.js';
const dt=1/60,dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
// A current (runner) expedition standing at the start of stretch `index`.
function journeyAt(index,{area=0,mode='relaxed'}={}){
 const save=freshSave(),j=save.journeys.g5u1=freshJourney(),e=j.expeditions[area]=freshExpedition(j,'g5u1',area);save.mode=mode;e.choices.fill('left');e.index=index;
 e.completed=Array.from({length:index},(_,i)=>({index:i,id:`${e.id}:${i}`,type:currentType({...e,index:i})}));j.guardians=Array.from({length:area},(_,i)=>i);j.level=pathLevel(index,area);
 const arrived=[],nav=new TrailNavigator(e,id=>arrived.push(id));nav.setLevel(j.level);nav.enableTraversal(mode,{});const log=[];
 nav.runner.events={approach:(s,a)=>log.push(['approach',a.guarded]),skid:()=>log.push(['skid']),arrive:(s,a)=>log.push(['arrive',a.guarded]),stumble:()=>{}};
 const section=nav.section;nav.player=localPoint(section,section.run.from-.5,0);nav.cancelJump();return{e,nav,section,log,arrived};}
function runToArrival(nav,log,limit=240){for(let t=0;t<limit&&!log.some(x=>x[0]==='arrive');t+=dt)nav.step(dt);}
const indexWith=(want,area=0)=>{const save=freshSave(),j=save.journeys.g5u1=freshJourney(),e=freshExpedition(j,'g5u1',area);e.choices.fill('left');for(let i=1;i<20;i++){const s=sectionFor(e,i,'relaxed');if(s?.run&&!s.run.finale&&gateRival(s)===want)return i;}return -1;};

test('runner mode is on for these tests',()=>assert.equal(RUNNER,true));

test('a run to a gate without rivals goes right up to the gate, skids to a stop there and is in reach to open its task',()=>{
 const index=indexWith(false);assert.ok(index>0);const{nav,section,log}=journeyAt(index);assert.equal(section.run.rival,false);
 runToArrival(nav,log);assert.deepEqual(log.map(x=>x[0]).filter(k=>k!=='approach'),['skid','arrive'],'skid, then arrival');assert.ok(log.some(x=>x[0]==='approach'&&!x[1]),'"Gate ahead" as it comes into view');
 const node=activeNode(nav.state);assert.ok(dist(nav.player,approachPoint(node))<.3,'stops at the gate');assert.ok(dist(nav.player,node)<=5.3,'inside the gate\'s reach (interact)');
 assert.equal(nav.runner.arrival,null);assert.equal(nav.runner.running,false);const at={...nav.player};for(let i=0;i<60;i++)nav.step(dt);assert.ok(dist(at,nav.player)<.05,'stays put while the task opens');
});

test('a guarded gate keeps its clearing: the creature skids to a stop short of the rivals, and after the win runs to the gate on its own',()=>{
 const index=indexWith(true);assert.ok(index>0);const{nav,section,log,arrived}=journeyAt(index);assert.equal(section.run.rival,true);const group=()=>nav.combat.group;
 runToArrival(nav,log);assert.ok(log.some(x=>x[0]==='approach'&&x[1]),'"Rivals ahead" as they come into view');assert.deepEqual(log.find(x=>x[0]==='arrive'),['arrive',true]);
 const nearest=Math.min(...group().map(r=>dist(nav.player,r)));assert.ok(nearest>2.4&&nearest<5,`stops a few metres short (${nearest.toFixed(2)})`);assert.ok(group().some(r=>r.active),'the fight is on');
 for(const r of group())while(r.phase!=='defeated')nav.combat.damage(r);
 const from={...nav.player};assert.ok(nav.approach());nav.autoRun=true;let t=0;for(;t<20&&!arrived.length;t+=dt)nav.step(dt);
 assert.deepEqual(arrived,[activeNode(nav.state).id],'reaches the gate, which opens its task');const node=activeNode(nav.state),speed=dist(from,approachPoint(node))/t;assert.ok(speed>4,`runs, not walks (${speed.toFixed(1)} m/s)`);
});

test('rival groups are one larger, take turns attacking and can be cleared by casting from the front',()=>{
 for(const[area,mode,size]of[[0,'relaxed',2],[1,'relaxed',3],[2,'challenge',4]]){
  const index=indexWith(true,area),{nav,log}=journeyAt(index,{area,mode});runToArrival(nav,log);const group=nav.combat.group,limit=mode==='challenge'?2:1;assert.equal(group.length,size,`area ${area} ${mode}`);
  let most=0,t=0;for(;t<180&&nav.combat.remaining;t+=dt){const target=nav.combat.current;if(target){const heading=Math.atan2(target.x-nav.player.x,target.z-nav.player.z);nav.heading=heading;nav.requestRanged();}nav.step(dt);most=Math.max(most,nav.combat.attackers());}
  assert.equal(nav.combat.remaining,0,`cleared in ${t.toFixed(0)} s`);assert.ok(most<=limit,`at most ${limit} attacking at once (${most})`);}
});

test('a tapped rival is the one the cast aims at, even when another rival is nearer',()=>{
 const index=indexWith(true,1),{nav,log}=journeyAt(index,{area:1});runToArrival(nav,log);const group=[...nav.combat.group].sort((a,b)=>dist(nav.player,a)-dist(nav.player,b)),near=group[0],far=group.at(-1);assert.notEqual(near,far);
 assert.ok(nav.requestRanged(far));const heading=nav.combat.attack.heading,want=Math.atan2(far.x-nav.player.x,far.z-nav.player.z);assert.ok(Math.abs(Math.atan2(Math.sin(heading-want),Math.cos(heading-want)))<.05,'aimed at the tapped rival');
});

test('rivals start attacking soon after the creature has stopped in front of them',()=>{
 for(const mode of['relaxed','challenge']){const index=indexWith(true),{nav,log}=journeyAt(index,{mode});runToArrival(nav,log);let first=null;nav.invincible=99;
  for(let t=0;t<6&&first===null;t+=dt){nav.step(dt);nav.invincible=99;if(nav.combat.attackers()>0)first=t;}assert.ok(first!==null&&first<3.5,`${mode}: first attack after ${first} s`);}
});

test('a skid cut short (the gate opened first) never blocks the next run or the rivals there',()=>{
 const index=indexWith(false),{nav,section,log}=journeyAt(index);for(let t=0;t<240&&!nav.runner.arrival;t+=dt)nav.step(dt);assert.ok(nav.runner.arrival,'skidding');
 // The journey moves on to the next stretch before the skid has finished.
 nav.state.index++;nav.state.completed.push({index:index,id:'x',type:'x'});const next=nav.section;assert.notEqual(next,section);nav.player=localPoint(next,next.run.from-1,0);nav.cancelJump();
 for(let i=0;i<30;i++)nav.step(dt);assert.equal(nav.runner.arrival,null,'the stale skid is dropped');assert.equal(nav.runner.running,true,'the next run starts');
});
