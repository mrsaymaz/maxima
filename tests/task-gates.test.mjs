import{test}from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import * as T from'../dist/vendor/three.module.min.js';
import{makeTask,actTask}from'../dist/trail-tasks.js';import{TASK_TYPES}from'../dist/expedition.js';import{mechanismPlan,mechanismMarkup,WorldMechanism}from'../dist/world-mechanisms.js';
import{makeRouteBarrier,setRouteBarrierProgress,animateRouteBarrier}from'../dist/corridor-geometry.js';import{THEMED_GATES,makeTaskGate,themeStage}from'../dist/task-gates.js';
const units=JSON.parse(fs.readFileSync('dist/data/expedition-language.json')).units;
const finite=g=>{g.updateMatrixWorld(true);g.traverse(o=>{assert.ok(o.matrixWorld.elements.every(Number.isFinite));if(o.geometry)assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));});};
function solve(t,stage,node){let guard=0,before=null;while(!t.complete&&guard++<80){before=stage?.object;if(t.kind==='pairs'){const i=t.leftOrder.find(i=>!t.matched.includes(i));actTask(t,{kind:'left',index:i});actTask(t,{kind:'right',index:i});}else{const q=t.rounds[t.round];if(q.kind==='repair'&&!t.repairFound)actTask(t,{kind:'find',text:q.broken});else if(['multi','sequence'].includes(q.kind)){for(const text of q.answer)actTask(t,{kind:'pick',text});actTask(t,{kind:'confirm'});}else if(q.kind==='blocks'){const i=q.blocks.findIndex((b,i)=>!t.used.includes(i)&&b.text===q.correct[t.used.length]);actTask(t,{kind:'block',index:i});}else actTask(t,{kind:'choice',text:q.answer});}stage?.render(t,node);}return before;}

test('every task type has its own gate, which blocks the walkway until it opens and stays finite while animating',()=>{
 for(const type of THEMED_GATES)for(const area of[0,1,2]){const g=makeRouteBarrier(type,{area});assert.equal(g.userData.themed,true);assert.equal(g.name,'route-barrier-'+type);
  const box=new T.Box3();g.updateMatrixWorld(true);const blocking=g.children.filter(c=>c.visible&&box.setFromObject(c)&&box.min.x<2.5&&box.max.x>-2.5&&box.max.y>.3);assert.ok(blocking.length>0,`${type} closed gate blocks the walkway`);
  for(const f of[0,.2,.5,.8,1]){setRouteBarrierProgress(g,f);for(const time of[0,1.7,9.3])animateRouteBarrier(g,time);finite(g);}
  assert.equal(g.userData.blocking,false);assert.equal(g.userData.solids.length,0);}
 const shapes=new Set(THEMED_GATES.map(type=>{const{group}=makeTaskGate(type);let n=0,tris=0;group.traverse(o=>{if(o.isMesh){n++;tris+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;}});return n+':'+tris;}));assert.equal(shapes.size,THEMED_GATES.length,'each gate is built differently');
});

test('themed task stages keep the shared layout and touch targets but swap boards for themed pieces and scenery',()=>{
 const node={x:0,z:-28,index:0,chapter:0,side:'left'};
 for(const type of THEMED_GATES)for(const u of[units[0],units.at(-1)]){const t=makeTask(u,type,'themed'),plan=mechanismPlan(t);assert.equal(plan.theme,type);assert.ok(mechanismMarkup(plan).includes(`data-theme="${type}"`));
  const stage=new WorldMechanism(new T.Scene());stage.area=1;stage.render(t,node);assert.equal(stage.object.name,'themed-stage-'+type);const pieces=[...stage.entries.values()].filter(v=>v.entry.action);assert.ok(pieces.length&&pieces.every(v=>v.looks&&v.face.material===v.looks.idle||v.entry.selected||v.entry.done));
  for(let i=0;i<20;i++)stage.update(.05,null,null,null);finite(stage.root);stage.clear();}
 // Every task type now has its own gate and stage.
 assert.deepEqual([...THEMED_GATES].sort(),[...TASK_TYPES].sort());
});

test('finishing a themed task keeps its scenery on stage and eases it fully open while the answered pieces retract',()=>{
 const node={x:0,z:-28,index:0,chapter:0,side:'left'};
 for(const type of THEMED_GATES){const scene=new T.Scene(),stage=new WorldMechanism(scene),t=makeTask(units[0],type,'finish');stage.render(t,node);const scenery=solve(t,stage,node);assert.ok(t.complete);
  // Compare identities with ok(): a failing equal() would try to diff two whole scenes.
  assert.ok(stage.object===scenery,`${type}: scenery carried over`);assert.equal(stage.departures.length,1);assert.ok(stage.theme.shown()<1);for(let i=0;i<60;i++)stage.update(.05,null,null,null);assert.equal(stage.theme.shown(),1);assert.equal(stage.departures.length,0);
  finite(stage.root);stage.clear();assert.equal(scene.children.length,0);}
});

