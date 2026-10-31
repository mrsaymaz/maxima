import{test}from'node:test';import assert from'node:assert/strict';
import{classifyGesture,gestureContext,performGesture,installGestures,loadControls,saveControls,applyControls,rivalAt,SWIPE}from'../dist/gesture-controls.js';
import{TUTORIAL_STEPS,tutorialMarkup,runControlsTutorial}from'../dist/controls-tutorial.js';

const classes=(...names)=>{const set=new Set(names);return{contains:n=>set.has(n),toggle:(n,on)=>on?set.add(n):set.delete(n),add:n=>set.add(n),remove:n=>set.delete(n),has:n=>set.has(n)};};
const docWith=(...names)=>({body:{classList:classes(...names)},querySelector:()=>null});
function fakeWorld({running=false,arena=false}={}){const log=[];const runner={running,sliding:.5,shift:d=>(log.push('shift'+d),true),slide:()=>(log.push('slide'),true)};
 return{log,nav:{runner,combat:{group:[]}},guardianStage:arena?{active:true}:null,jump:()=>(log.push('jump'),true),attack:t=>(log.push(t?'attack:'+t.id:'attack'),true),screenPoint:p=>({x:p.x*10,y:p.z*10})};}

test('a swipe is recognised as soon as the finger has moved far enough; a tap only when it lifts quickly without moving',()=>{
 assert.equal(classifyGesture(0,-SWIPE,120),'up');assert.equal(classifyGesture(0,40,120),'down');assert.equal(classifyGesture(-40,10,120),'left');assert.equal(classifyGesture(40,-10,120),'right');
 assert.equal(classifyGesture(3,2,150),null,'not before the finger lifts');assert.equal(classifyGesture(3,2,150,true),'tap');assert.equal(classifyGesture(3,2,900,true),null,'a long press is not a tap');assert.equal(classifyGesture(18,0,150,true),null,'a short drag is neither');
});

test('gestures act only in play: on runs, on the free trail and in the guardian arena, never during tasks, menus or the seal questions',()=>{
 const w=fakeWorld();assert.equal(gestureContext(w,docWith('playing')),'free');w.nav.runner.running=true;assert.equal(gestureContext(w,docWith('playing')),'run');w.guardianStage={active:true};assert.equal(gestureContext(w,docWith('playing')),'arena');
 for(const blocked of['in-task','in-guardian-finisher','cinematic'])assert.equal(gestureContext(w,docWith('playing',blocked)),null,blocked);
 assert.equal(gestureContext(w,docWith()),null,'not on the home screen');assert.equal(gestureContext(w,{body:{classList:classes('playing')},querySelector:s=>s==='.modal-backdrop'?{}:null}),null,'not under a menu');
 w.paused=true;assert.equal(gestureContext(w,docWith('playing')),null,'not while paused');
});

test('swipe up jumps and a tap casts everywhere; on runs swipes also change lane and slide; off runs sideways swipes do nothing',()=>{
 const run=fakeWorld({running:true});for(const k of['left','right','down','up','tap'])performGesture(run,k,'run');assert.deepEqual(run.log,['shift-1','shift1','slide','jump','attack']);assert.equal(run.nav.runner.sliding,0,'a jump ends a slide');
 const free=fakeWorld();for(const k of['left','right','down','up','tap'])performGesture(free,k,'free');assert.deepEqual(free.log,['jump','attack']);
 const arena=fakeWorld({arena:true});for(const k of['up','tap','left'])performGesture(arena,k,'arena');assert.deepEqual(arena.log,['jump','attack']);
});

test('tapping on a rival casts at that rival; a tap elsewhere casts at the nearest one',()=>{
 const w=fakeWorld();w.nav.combat.group=[{id:'near',x:1,z:1,phase:'watch'},{id:'far',x:20,z:20,phase:'watch'},{id:'down',x:30,z:30,phase:'defeated'}];
 assert.equal(rivalAt(w,200,200)?.id,'far');assert.equal(rivalAt(w,300,300),null,'defeated rivals are ignored');
 performGesture(w,'tap','free',{x:205,y:198});performGesture(w,'tap','free',{x:600,y:600});assert.deepEqual(w.log,['attack:far','attack']);
});

test('the gesture layer owns fingers in the action area, leaves the joystick and buttons alone, and stops tap-to-walk underneath',()=>{
 const handlers={},win={addEventListener:(type,fn)=>handlers[type]=fn,dispatchEvent(){},CustomEvent:class{constructor(t,o){this.type=t;this.detail=o.detail;}}},doc=docWith('playing'),w=fakeWorld(),seen=[];
 installGestures(w,{win,doc,onGesture:(k,c,done)=>seen.push(k+':'+c+':'+done)});
 const target=(match=false)=>({closest:()=>match?{}:null});let stopped=0;const ev=(x,y,t,extra={})=>({clientX:x,clientY:y,timeStamp:t,pointerId:1,button:0,target:target(),stopPropagation:()=>stopped++,...extra});
 handlers.pointerdown(ev(100,300,0));handlers.pointermove(ev(100,260,80));handlers.pointerup(ev(100,250,120));assert.deepEqual(seen,['up:free:true']);assert.equal(stopped,1,'the world underneath never sees it');
 handlers.pointerdown(ev(50,50,200));handlers.pointerup(ev(52,51,300));assert.deepEqual(seen.at(-1),'tap:free:true');
 handlers.pointerdown(ev(50,50,400,{target:target(true)}));handlers.pointermove(ev(50,0,450));handlers.pointerup(ev(50,0,500));assert.equal(seen.length,2,'joystick and buttons are excluded');
});

test('control settings default to the right-hand joystick with hidden buttons, persist on the device and set the body classes',()=>{
 const store=new Map(),storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};const c=loadControls(storage);assert.deepEqual({buttons:c.buttons,left:c.left,tutorial:c.tutorial},{buttons:false,left:false,tutorial:false});
 c.left=true;c.buttons=true;c.hints.fight=true;saveControls(c,storage);const again=loadControls(storage);assert.equal(again.left,true);assert.equal(again.buttons,true);assert.equal(again.hints.fight,true);
 const doc=docWith();applyControls(again,doc);assert.ok(doc.body.classList.has('left-hand'));assert.ok(doc.body.classList.has('show-buttons'));applyControls({buttons:false,left:false},doc);assert.ok(!doc.body.classList.has('left-hand'));
 assert.equal(loadControls({getItem:()=>'not json'}).buttons,false,'a damaged setting falls back to the defaults');
});

test('the tutorial teaches lane, jump, slide and cast by doing them, then shows the joystick on the chosen side',async()=>{
 assert.deepEqual(TUTORIAL_STEPS.map(s=>s.id),['lane','jump','slide','cast','move']);assert.match(tutorialMarkup(4,{left:false}),/joystick on the right/);assert.match(tutorialMarkup(4,{left:true}),/joystick on the left/);assert.match(tutorialMarkup(1,{touch:false}),/keyboard: ↑ or Space/);
 const made=[];const element=()=>{const e={className:'',innerHTML:'',attrs:{},handlers:{},setAttribute(k,v){this.attrs[k]=v;},addEventListener(t,fn){this.handlers[t]=fn;},querySelector:()=>null,remove(){this.removed=true;}};made.push(e);return e;};
 const doc={createElement:element,body:{appendChild(){}}},win={addEventListener(){}};let finished=null;const practised=[];
 const t=runControlsTutorial({doc,win,onDone:r=>finished=r,onPractice:id=>practised.push(id)});assert.equal(t.index,0);
 t.practise('up');assert.equal(t.index,0,'the wrong gesture does not count');t.practise('left');await new Promise(r=>setTimeout(r,700));assert.equal(t.index,1);
 for(const k of['up','down','tap']){t.practise(k);await new Promise(r=>setTimeout(r,700));}assert.equal(t.index,4);assert.deepEqual(practised,['lane','jump','slide','cast']);
 t.root.handlers.click({target:{closest:()=>({dataset:{tutorial:'next'}})}});assert.deepEqual(finished,{skipped:false,step:'move'});assert.ok(t.root.removed);
 let skipped=null;const s=runControlsTutorial({doc,win,onDone:r=>skipped=r});s.root.handlers.click({target:{closest:()=>({dataset:{tutorial:'skip'}})}});assert.deepEqual(skipped,{skipped:true,step:'lane'});
});
