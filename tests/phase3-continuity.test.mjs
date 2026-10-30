import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {freshSave,freshJourney,freshExpedition,expedition,currentType,chooseBranch,milestone,finishRun,winGuardian,validSave,TASK_TYPES,orderFor} from '../dist/expedition.js';
import {makeTask,actTask} from '../dist/trail-tasks.js';
import {sectionFor} from '../dist/traversal-layout.js';
import {runPlan,TRIAL_HOST} from '../dist/path-trials-layout.js';
import {routePreview} from '../dist/journey-director.js';
import {mechanismPlan} from '../dist/world-mechanisms.js';
const units=JSON.parse(fs.readFileSync('dist/data/expedition-language.json')).units;
const key=s=>s.trim().toLowerCase().replace(/[\s.…?!,;:]+/g,' ').trim();
const half=s=>{const c=Math.ceil(s.blocks.length/2);return{left:s.blocks.slice(0,c).join(' '),right:s.blocks.slice(c).join(' '),context:s.tr||''};};
const checkpointRun=(j,e)=>{chooseBranch(e,e.index%8?'right':'left');for(let i=0;i<4;i++){const type=currentType(e);e.active={nodeId:`${e.id}:${e.index}`,type,complete:true};assert.ok(milestone(j,e,type).changed);}};
const charge=j=>{for(let i=0;i<100;i++)j.mastery['review-'+i]={b:5,dd:0,dr:null,n:5,w:0};};

test('level-ups and guardian wins retain the same full twenty-format expedition through JSON reloads',()=>{
 for(const unit of units)for(const mode of ['relaxed','challenge']){
  let save=freshSave();save.selected=unit.id;save.grade=unit.grade;save.mode=mode;let j=save.journeys[unit.id]=freshJourney();charge(j);let e=expedition(j,unit.id,0);const id=e.id,layoutLevel=e.level,types=[];
  for(let chapter=0;chapter<5;chapter++){
   checkpointRun(j,e);types.push(...e.completed.slice(-4).map(c=>c.type));const completed=JSON.stringify(e.completed),choices=JSON.stringify(e.choices),out=finishRun(j,e);
   if(out.guardian){e.battle={round:3,hp:100};assert.ok(winGuardian(j,e));}
   assert.equal(JSON.stringify(e.completed),completed);assert.equal(JSON.stringify(e.choices),choices);assert.equal(e.level,layoutLevel,'layout snapshot never changes');
   assert.equal(finishRun(j,e).changed,false,'chest cannot pay twice');assert.ok(validSave(save,units));
   save=JSON.parse(JSON.stringify(save));j=save.journeys[unit.id];e=expedition(j,unit.id,0);
   if(chapter<4){assert.equal(e.id,id);assert.equal(e.index,(chapter+1)*4);}else assert.equal(e.id,id,'the restored completed path stays saved until explicit replay');
  }
  assert.deepEqual(types.slice().sort(),TASK_TYPES.slice().sort());assert.ok(j.level>=4);assert.ok(j.guardians.includes(0));
 }
});

test('an existing unmarked route adopts continuity only at evolution and preserves travel and accepted work',()=>{
 const s=freshSave(),j=s.journeys.g5u1=freshJourney(),e=j.expeditions[0]=freshExpedition(j,'g5u1',0);e.pacingVersion=1;delete e.continuityVersion;checkpointRun(j,e);charge(j);e.travel={...(e.travel||{}),collected:['kept-coin'],completed:[0],safe:{x:0,z:0}};
 const travel=JSON.stringify(e.travel),plan=runPlan(e,0,'left');assert.ok(finishRun(j,e).changed);assert.equal(j.level,0);assert.equal(expedition(j,'g5u1',0),e);assert.equal(JSON.stringify(e.travel),travel);assert.deepEqual(runPlan(e,0,'left'),plan);
 chooseBranch(e,'right');e.active=makeTask(units[0],currentType(e),`${e.id}:4`);const t=e.active;if(t.kind==='pairs'){actTask(t,{kind:'left',index:0});actTask(t,{kind:'right',index:0});}else{const q=t.rounds[0];if(q.kind==='blocks')actTask(t,{kind:'block',index:q.blocks.findIndex(b=>b.text===q.correct[0])});else actTask(t,{kind:'choice',text:q.answer});}
 const copy=JSON.parse(JSON.stringify(s));assert.deepEqual(expedition(copy.journeys.g5u1,'g5u1',0).active,t);
});

test('final guardian waits for all20 checkpoints and awards Form10 and ends the unit',()=>{const j=freshJourney();j.level=8;j.pathSteps=40;j.guardians=[0,1];const e=j.expeditions[2]=freshExpedition(j,'g5u1',2);for(let c=0;c<5;c++){checkpointRun(j,e);const out=finishRun(j,e);assert.equal(!!out.guardian,c===4);}e.battle={round:3,hp:100};assert.ok(winGuardian(j,e));assert.ok(j.completed);assert.equal(e.phase,'closed');assert.equal(j.level,10);assert.equal(j.history.length,1);assert.equal(e.completed.length,20);assert.equal(winGuardian(j,e),false);});

test('sentence endings always specify the intended meaning; no attested equivalent is offered as a wrong ending',()=>{
 let rounds=0;for(const u of units)for(const level of [0,5,10])for(let seed=0;seed<12;seed++){
  const t=makeTask(u,'ending','meaning',u.id+seed,{},level);
  for(const q of t.rounds){rounds++;const source=u.sentences.find(s=>s.id===q.id),h=half(source);assert.ok(h.context);assert.equal(q.context,'Meaning: '+h.context);assert.equal(q.options.length,3);const valid=u.sentences.map(half).filter(x=>key(x.left)===key(h.left)&&key(x.context)===key(h.context)).map(x=>key(x.right));for(const o of q.options.filter(o=>o!==q.answer))assert.ok(!valid.includes(key(o)));}
  const plan=mechanismPlan(t);assert.ok(JSON.stringify(plan).includes(t.rounds[0].context),'meaning reaches the world-mounted mechanism');
 }
 assert.equal(rounds,4752);
 const telephone=units.find(u=>u.id==='g8u4');for(let i=0;i<30;i++)assert.ok(makeTask(telephone,'ending','phone','phone'+i,{},8).rounds.every(q=>q.context),'the former Could you ambiguity never appears without meaning');
});

test('matching has distinct visible terminals and question choices exclude other answers attested for that prompt',()=>{
 for(const u of units)for(const level of [0,5,10])for(let seed=0;seed<8;seed++){
  for(const type of ['translation','definition','qa-pairs','halves']){
   const t=makeTask(u,type,'pairs',u.id+seed,{},level);assert.equal(t.pairs.length,3);for(const field of ['left','right'])assert.equal(new Set(t.pairs.map(p=>key(p[field]))).size,3,`${u.id}:${type}:${field}`);if(type==='halves')assert.ok(t.pairs.every(p=>p.context));
   if(type==='qa-pairs')for(const p of t.pairs){const valid=u.questions.filter(q=>key(q.prompt)===key(p.left)).map(q=>key(q.answer));for(const other of t.pairs.filter(x=>x!==p))assert.ok(!valid.includes(key(other.right)));}
  }
  const t=makeTask(u,'answer','answers',u.id+seed,{},level);for(const q of t.rounds){const valid=u.questions.filter(x=>key(x.prompt)===key(q.prompt)).map(x=>key(x.answer));for(const o of q.options.filter(o=>o!==q.answer))assert.ok(!valid.includes(key(o)));assert.ok(q.options.length>=2);}
 }
});

test('[classic] new encounter rhythms stay quiet first, host trials on compatible ground, and leave combat on flat ground',()=>{
 const rhythms=new Set();for(let area=0;area<3;area++)for(let serial=1;serial<=6;serial++)for(let mask=0;mask<32;mask++){
  const e=freshExpedition(freshJourney(),'g5u1',area);e.serial=serial;e.choices=e.choices.map((_,i)=>mask>>i&1?'right':'left');
  for(let chapter=0;chapter<5;chapter++){
   const p=runPlan(e,chapter);rhythms.add(p.sequence.join(','));const other=runPlan(e,chapter,e.choices[chapter]==='left'?'right':'left');assert.notDeepEqual(p.sequence,other.sequence);assert.equal(p.sequence[0],'quiet');assert.equal(p.kinds[p.rivalAt],'coins');assert.equal(p.kinds[p.trialAt],TRIAL_HOST[p.trial]);assert.notEqual(p.rivalAt,p.trialAt);assert.deepEqual(routePreview(e,chapter,e.choices[chapter]).sequence,p.sequence);
   for(const mode of ['relaxed','challenge']){const sections=Array.from({length:4},(_,n)=>sectionFor(e,chapter*4+n,mode));assert.equal(sections.filter(s=>s.rival).length,1);assert.equal(sections.filter(s=>s.trial).length,1);assert.equal(sections[0].trial,undefined);assert.equal(sections[0].rival,false);assert.equal(sections[p.rivalAt].platforms.length,0);assert.equal(sections[p.rivalAt].plants.length,0);const trial=sections[p.trialAt];for(const lane of trial.trial.lanes||[])assert.ok(lane.s>0&&lane.s<trial.length);for(const stone of trial.platforms)assert.ok(stone.s>0&&stone.s<trial.length);}
  }
 }
 assert.equal(rhythms.size,4);
});

test('[classic] pacing v1 and older layouts keep their published trial and combat slots',()=>{
 for(const version of [undefined,1])for(let area=0;area<3;area++)for(const side of ['left','right']){
  const e=freshExpedition(freshJourney(),'g5u1',area);e.pacingVersion=version;e.choices.fill(side);for(let c=0;c<5;c++){const p=runPlan(e,c);assert.equal(p.trialAt,2);assert.equal(p.rivalAt,1);assert.equal(p.sequence,undefined);assert.equal(sectionFor(e,c*4+2).trial.kind,p.trial);assert.equal(sectionFor(e,c*4+1).rivalKind,p.rival);}
 }
});

test('unmarked unfinished routes in other arenas survive levels earned elsewhere',()=>{
 const s=freshSave(),j=s.journeys.g5u1=freshJourney();j.level=4;j.guardians=[0];const older=j.expeditions[0]=freshExpedition(j,'g5u1',0);older.pacingVersion=1;delete older.continuityVersion;checkpointRun(j,older);const before=JSON.stringify(older),current=j.expeditions[1]=freshExpedition(j,'g5u1',1);checkpointRun(j,current);finishRun(j,current);checkpointRun(j,current);assert.ok(finishRun(j,current).changed);assert.equal(j.level,5);assert.equal(expedition(j,'g5u1',0),older);assert.equal(JSON.stringify(older),before);assert.ok(validSave(s,units));const reloaded=JSON.parse(JSON.stringify(s));assert.equal(expedition(reloaded.journeys.g5u1,'g5u1',0).id,older.id);
});
