import{test}from'node:test';import assert from'node:assert/strict';
import{freshJourney,freshExpedition,autoBranch,shuffleGates,orderFor,TASK_TYPES}from'../dist/expedition.js';
import{sectionFor}from'../dist/traversal-layout.js';
import{CHEST_CLEAR}from'../dist/runner-course.js';

test('a new expedition becomes a six-gate area with six different, shuffled formats',()=>{
 const j=freshJourney(),orders=new Set();for(let i=0;i<12;i++){const e=freshExpedition(j,'g5u1',0);assert.ok(shuffleGates(j,e));assert.equal(e.pathVersion,3);assert.equal(shuffleGates(j,e),false,'only once');e.choices.fill('left');const six=[0,1,2].flatMap(c=>orderFor(e,c));assert.equal(six.length,6);assert.equal(new Set(six).size,6);assert.ok(six.every(t=>TASK_TYPES.includes(t)));orders.add(six.join());}
 assert.ok(orders.size>8,`varied orders (${orders.size} of 12)`);
});
test('[classic paths] a shuffled 20-gate expedition still covers all twenty formats in its five chapters',()=>{
 const j=freshJourney(),orders=new Set();for(let i=0;i<12;i++){const e=freshExpedition(j,'g5u1',0);assert.ok(shuffleGates(j,e,{six:false}));assert.ok(!e.pathVersion);assert.equal(e.varietyVersion,1);assert.equal(shuffleGates(j,e,{six:false}),false,'only once');e.choices.fill('left');const all=[0,1,2,3,4].flatMap(c=>orderFor(e,c));assert.deepEqual([...all].sort(),[...TASK_TYPES].sort());orders.add(all.join());}
 assert.ok(orders.size>8,`varied orders (${orders.size} of 12)`);
});
test('there is no fork stop: each chapter picks its path side when it begins, the same way after a reload, and both sides appear',()=>{
 const j=freshJourney(),sides=new Set();for(let i=0;i<8;i++){const e=freshExpedition(j,'g5u1',0);assert.ok(autoBranch(e));assert.ok(['left','right'].includes(e.choices[0]));assert.equal(autoBranch(e),false,'only once');sides.add(e.choices[0]);
  const copy=JSON.parse(JSON.stringify(e));copy.choices[0]=null;autoBranch(copy);assert.equal(copy.choices[0],e.choices[0],'deterministic');e.index=2;assert.equal(autoBranch(e),false,'not mid-chapter');}
 assert.equal(sides.size,2);
});
test('the reward chest stands on the first run of each new chapter, with a clear stretch of track around it',()=>{
 const j=freshJourney(),e=freshExpedition(j,'g5u1',0);e.choices.fill('left');for(let i=0;i<20;i++){const s=sectionFor(e,i,'relaxed'),run=s?.run;if(!run)continue;
  if(i%4===0&&i>0){assert.ok(run.chest,`chest on run ${i}`);for(const o of run.obstacles)assert.ok(Math.abs(o.s-run.chest.s)>=CHEST_CLEAR+(o.depth||0)/2-1e-9,`nothing in the way (${o.type})`);}else assert.equal(run.chest,undefined);}
});
test('an expedition already under way keeps its gate order',()=>{const j=freshJourney(),e=freshExpedition(j,'g5u1',0);e.index=1;e.completed=[{index:0,id:'x',type:'translation'}];assert.equal(shuffleGates(j,e),false);assert.equal(e.varietyVersion,undefined);});
