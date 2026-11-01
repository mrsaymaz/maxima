import{test}from'node:test';import assert from'node:assert/strict';
import{runFor,setRunnerWords}from'../src/runner-course.js';import{FORM_HEIGHTS}from'../src/world-layout.js';
import{RunnerControl,BOOST_DRAIN,BOOST_START}from'../src/runner-control.js';import{localPoint}from'../src/traversal-layout.js';
import{installGestures,HOLD_MS}from'../src/gesture-controls.js';import{TUTORIAL_STEPS}from'../src/controls-tutorial.js';
const expedition={id:'t',area:0,adventureVersion:2,level:0,serial:1,choices:Array(5).fill('left'),index:1};
setRunnerWords([{id:'w',en:'rule',tr:'kural'}]);
const withRun=index=>{const s={id:`t:travel:${index}`,index,chapter:Math.floor(index/4),side:'left',area:0,start:{x:0,z:0},forward:{x:0,z:-1},right:{x:1,z:0},length:60};s.run=runFor(s,expedition,'relaxed',true);return s;};
const navFor=(section,rush=null)=>({section,rush,state:{index:section.index,travel:{collected:[]}},player:localPoint(section,section.run.from+.5,0),height:FORM_HEIGHTS[0],recovery:0,combat:null,y:0,vy:0,grounded:true,invincible:0,support(){return 0;},requestJump(){return true;}});
const running=(rush)=>{const section=withRun(1),nav=navFor(section,rush),r=new RunnerControl(),events=[];r.events={boost:()=>events.push('boost'),boostEnd:why=>events.push('end:'+why),boostEmpty:()=>events.push('empty')};r.engage(nav);r.s=60;return{r,nav,events};};
test('holding boosts while held: faster running that burns fuel, and letting go ends it',()=>{
 const{r,nav,events}=running();assert.equal(r.fuel,1);for(let i=0;i<60;i++)r.advance(nav,1/60);const cruise=r.speed;
 assert.ok(r.holdBoost(nav,true));assert.ok(r.boosting);for(let i=0;i<60;i++)r.advance(nav,1/60);
 assert.ok(r.speed>cruise*1.25,`${r.speed} vs ${cruise}`);assert.ok(Math.abs(r.fuel-(1-BOOST_DRAIN))<0.02,'one second of holding burns BOOST_DRAIN');
 r.holdBoost(nav,false);assert.equal(r.boosting,false);for(let i=0;i<90;i++)r.advance(nav,1/60);assert.ok(r.speed<cruise*1.15,'back to running speed');assert.ok(r.fuel>1-BOOST_DRAIN,'the tank refills when idle');
 assert.deepEqual(events,['boost','end:release']);
});
test('the boost ends when the fuel runs out, and an empty tank cannot start one',()=>{
 const{r,nav,events}=running();r.fuel=0.2;r.holdBoost(nav,true);let frames=0;while(r.boosting&&frames<300){r.advance(nav,1/60);frames++;}assert.equal(r.boosting,false);assert.ok(Math.abs(frames/60-0.2/BOOST_DRAIN)<0.05,'lasts as long as the fuel');assert.ok(r.fuel<0.01);assert.deepEqual(events.slice(0,3),['boost','end:empty','empty']);
 r.fuel=BOOST_START/2;assert.equal(r.holdBoost(nav,true),false);assert.equal(events.at(-1),'empty');
});
test('with a coin chain the boost burns its fuel instead (coins fill it)',()=>{const rush={fuel:0.8};const{r,nav}=running(rush);r.holdBoost(nav,true);for(let i=0;i<30;i++)r.advance(nav,1/60);assert.ok(rush.fuel<0.8&&rush.fuel>0.6);assert.equal(r.fuel,1,'the own tank is untouched');});
const harness=({crystal=false}={})=>{const handlers={},log=[],win={addEventListener:(t,f)=>handlers[t]=f,dispatchEvent(){},CustomEvent:class{constructor(t,o){this.detail=o.detail;}}};
 const doc={body:{classList:{contains:c=>c==='playing'}},querySelector:()=>null};
 const runner={running:true,crystalInRange:()=>crystal,shift:d=>(log.push(d<0?'left':'right'),true),slide:()=>(log.push('down'),true),sliding:0};
 const world={nav:{runner,holdBoost:on=>(log.push(on?'hold':'release'),true)},jump:()=>(log.push('up'),true),attack:()=>(log.push('tap'),true)};
 installGestures(world,{win,doc});const ev=(id,x,y,t)=>({pointerId:id,clientX:x,clientY:y,timeStamp:t,button:0,target:{closest:()=>null},stopPropagation(){}});return{handlers,log,ev};};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
test('on a run, a finger held still boosts; sliding it steers; lifting it stops',async()=>{
 const{handlers:h,log,ev}=harness();h.pointerdown(ev(1,200,500,0));await wait(HOLD_MS+40);assert.deepEqual(log,['hold']);
 h.pointermove(ev(1,160,500,400));h.pointermove(ev(1,150,500,420));assert.deepEqual(log,['hold','left'],'one lane per slide, then it re-anchors');
 h.pointermove(ev(1,195,500,500));h.pointermove(ev(1,200,460,560));h.pointerup(ev(1,200,460,600));assert.deepEqual(log,['hold','left','right','up','release'],'no tap after a hold');
});
test('a quick tap still casts, a quick swipe still changes lane, and neither boosts',async()=>{
 const{handlers:h,log,ev}=harness();h.pointerdown(ev(1,200,500,0));h.pointerup(ev(1,201,500,120));h.pointerdown(ev(2,200,500,200));h.pointermove(ev(2,150,500,260));h.pointerup(ev(2,140,500,300));await wait(HOLD_MS+40);assert.deepEqual(log,['tap','left']);
});
test('near a crystal wall a touch casts as it lands, even if it becomes a hold; a second finger can swipe while one holds',async()=>{
 const{handlers:h,log,ev}=harness({crystal:true});h.pointerdown(ev(1,200,500,0));assert.deepEqual(log,['tap'],'cast on touch-down');await wait(HOLD_MS+40);assert.deepEqual(log,['tap','hold']);
 h.pointerdown(ev(2,300,500,400));h.pointermove(ev(2,340,500,440));h.pointerup(ev(2,345,500,460));assert.deepEqual(log,['tap','hold','tap','right'],'the second finger casts again near the wall, then its swipe steers');
 h.pointerup(ev(1,200,500,600));assert.equal(log.at(-1),'release');assert.equal(log.filter(x=>x==='tap').length,2,'each touch-down near the wall casts once');
});
test('the controls tutorial teaches the hold with the creature sketch',()=>{const s=TUTORIAL_STEPS.find(s=>s.id==='boost');assert.deepEqual(s.want,['hold']);assert.equal(s.demo,'boost');assert.match(s.text,/hold your finger anywhere/i);});
