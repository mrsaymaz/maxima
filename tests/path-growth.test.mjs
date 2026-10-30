import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {freshSave,freshJourney,expedition,freshExpedition,chooseBranch,currentType,milestone,finishRun,guardianReady,winGuardian,validSave,restart,unlocked,TASK_TYPES} from '../dist/expedition.js';
import {pathGrowthState,pathLevel} from '../dist/path-growth.js';
import {makeTask,actTask} from '../dist/trail-tasks.js';
import {freshGuardian} from '../dist/guardian-combat.js';
import {growthBar} from '../dist/camp-ui.js';
const units=JSON.parse(fs.readFileSync('dist/data/expedition-language.json')).units;
function solve(t){
 let safety=0;
 while(!t.complete&&safety++<100){
  if(t.kind==='pairs'){const index=t.leftOrder.find(i=>!t.matched.includes(i));actTask(t,{kind:'left',index});actTask(t,{kind:'right',index});continue;}
  const q=t.rounds[t.round];
  if(q.kind==='blocks')actTask(t,{kind:'block',index:q.blocks.findIndex((b,i)=>!t.used.includes(i)&&b.text===q.correct[t.used.length])});
  else if(q.kind==='repair'&&!t.repairFound)actTask(t,{kind:'find',text:q.broken});
  else if(['multi','sequence'].includes(q.kind)){for(const text of q.answer)actTask(t,{kind:'pick',text});actTask(t,{kind:'confirm'});}
  else actTask(t,{kind:'choice',text:q.answer});
 }
 assert.ok(t.complete,t.type);
}
function checkpoint(j,e,unit=units[0]){
 if(e.index%4===0)chooseBranch(e,e.index%8?'right':'left');
 const type=currentType(e);e.active=makeTask(unit,type,`${e.id}:${e.index}`,`${e.id}:${e.index}:${type}`,{},j.level);
 solve(e.active);return milestone(j,e,type);
}

test('all44 lessons in both modes earn Forms1–10 across three complete arenas and boss victories, with reloads at every checkpoint',()=>{
 for(const unit of units)for(const mode of ['relaxed','challenge']){
  let save=freshSave();save.selected=unit.id;save.grade=unit.grade;save.mode=mode;
  let j=save.journeys[unit.id]=freshJourney();const forms=[];
  for(let area=0;area<3;area++){
   let e=expedition(j,unit.id,area);const id=e.id,start=[0,4,8][area];
   assert.equal(j.level,start);assert.equal(unlocked(j),area);
   for(let step=1;step<=20;step++){
    const result=checkpoint(j,e,unit);assert.ok(result.changed);
    assert.equal(j.level,pathLevel(step,area),`${unit.id}:${mode}:${area}:${step}`);
    assert.equal(j.pathSteps,area*20+step);
    if(result.evolved){forms.push(j.level);assert.deepEqual(e.pendingEvolution,{from:j.level-1,to:j.level,checkpoint:step});}
    assert.ok(validSave(save,units),'checkpoint and pending reveal reload');
    save=JSON.parse(JSON.stringify(save));j=save.journeys[unit.id];e=expedition(j,unit.id,area);
    assert.equal(e.id,id);assert.equal(e.level,start,'route layout remains frozen');
    delete e.pendingEvolution;
    assert.equal(milestone(j,e,e.completed.at(-1).type).changed,false);
    assert.equal(guardianReady(j,e),false,'boss requires the final chest as well as all tasks');
    if(step%4===0){const out=finishRun(j,e);assert.equal(!!out.guardian,step===20);assert.equal(finishRun(j,e).changed,false);}
   }
   assert.deepEqual(e.completed.map(x=>x.type).sort(),TASK_TYPES.slice().sort());
   assert.equal(j.level,[3,7,9][area]);assert.ok(guardianReady(j,e));
   e.battle=freshGuardian(unit,e.id);assert.equal(winGuardian(j,e),false,'starting a boss grants no evolution');
   Object.assign(e.battle,{phase:'victory',bossHp:0,finishStep:3});
   assert.ok(winGuardian(j,e));assert.equal(j.level,[4,8,10][area]);forms.push(j.level);
   assert.deepEqual(e.pendingEvolution,{from:j.level-1,to:j.level,checkpoint:20,boss:true});
   assert.equal(j.completed,area===2);assert.ok(validSave(save,units));
   save=JSON.parse(JSON.stringify(save));j=save.journeys[unit.id];e=expedition(j,unit.id,area);
   assert.equal(winGuardian(j,e),false,'reloaded victory cannot award twice');assert.equal(e.id,id);
   delete e.pendingEvolution;assert.ok(validSave(save,units));
  }
  assert.deepEqual(forms,[1,2,3,4,5,6,7,8,9,10]);assert.equal(j.pathSteps,60);assert.equal(j.history.length,1);
  assert.deepEqual(j.mastery,{},'recall and cosmetic rewards do not gate evolution');
 }
});

test('growth display distinguishes task milestones from boss-only forms and counts within the active arena',()=>{
 const s=freshSave(),j=s.journeys.g5u1=freshJourney(),e=expedition(j,'g5u1',0);
 assert.match(growthBar(pathGrowthState(j)),/Form 1 in 5 English checkpoints/);
 for(let i=0;i<15;i++){checkpoint(j,e);delete e.pendingEvolution;if(e.index%4===0)finishRun(j,e);}
 assert.equal(j.level,3);assert.match(growthBar(pathGrowthState(j)),/Complete 5 more English checkpoints, then defeat the boss for Form 4/);
 for(let i=15;i<20;i++){checkpoint(j,e);if(e.index%4===0)finishRun(j,e);}
 assert.match(growthBar(pathGrowthState(j)),/Defeat the arena boss to reach Form 4/);
 e.battle=freshGuardian(units[0],'display');Object.assign(e.battle,{phase:'victory',bossHp:0,finishStep:3});winGuardian(j,e);
 assert.match(growthBar(pathGrowthState(j)),/Form 5 in 5 English checkpoints/);
 const next=expedition(j,'g5u1',1);assert.equal(next.index,0);assert.equal(j.pathSteps,20);
});

test('fresh-start save namespace and backup marker exclude previous progression',()=>{
 const s=freshSave();s.journeys.g5u1=freshJourney();assert.ok(validSave(s,units));
 const old=structuredClone(s);delete old.evolutionVersion;assert.equal(validSave(old,units),false);
 const invalid=[j=>j.level=4,j=>j.pathSteps=61,j=>j.pathSteps=1,j=>j.guardians=[1],j=>j.progressionVersion=1];
 for(const change of invalid){const bad=structuredClone(s);change(bad.journeys.g5u1);assert.equal(validSave(bad,units),false);}
});

test('restart resets all three arena milestones only for the selected lesson and team',()=>{
 const s=freshSave(),j=s.journeys.g5u1=freshJourney();s.journeys.g5u2=freshJourney();
 const e=expedition(j,'g5u1',0);for(let step=0;step<20;step++){checkpoint(j,e);if(e.index%4===0)finishRun(j,e);}
 e.battle=freshGuardian(units[0],'restart');Object.assign(e.battle,{phase:'victory',bossHp:0,finishStep:3});winGuardian(j,e);
 const r=restart(j);assert.equal(r.level,0);assert.equal(r.pathSteps,0);assert.deepEqual(r.guardians,[]);assert.deepEqual(r.expeditions,{});assert.equal(s.journeys.g5u2.level,0);
});
