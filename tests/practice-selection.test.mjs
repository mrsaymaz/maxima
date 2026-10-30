import{pathLevel}from'../dist/path-growth.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {freshSave,freshJourney,freshExpedition,expedition,orderFor,chooseBranch,currentType,milestone,finishRun,validSave,restart,TASK_TYPES} from '../dist/expedition.js';
import {makeTask,actTask} from '../dist/trail-tasks.js';
import {upgradePractice,completePractice,notePracticeMistake,practiceKey,PRACTICE_ROLES,validPractice} from '../dist/practice-selection.js';
const units=JSON.parse(fs.readFileSync('dist/data/expedition-language.json')).units;
function solve(t){
 let guard=0;
 while(!t.complete&&guard++<100){
  if(t.kind==='pairs'){const index=t.leftOrder.find(i=>!t.matched.includes(i));actTask(t,{kind:'left',index});actTask(t,{kind:'right',index});continue;}
  const q=t.rounds[t.round];
  if(q.kind==='blocks')actTask(t,{kind:'block',index:q.blocks.findIndex((b,i)=>!t.used.includes(i)&&b.text===q.correct[t.used.length])});
  else if(q.kind==='repair'&&!t.repairFound)actTask(t,{kind:'find',text:q.broken});
  else if(['multi','sequence'].includes(q.kind)){for(const text of q.answer)actTask(t,{kind:'pick',text});actTask(t,{kind:'confirm'});}
  else actTask(t,{kind:'choice',text:q.answer});
 }
 assert.ok(t.complete,t.type);
}
const task=(j,u,type,seed,level=j.level)=>makeTask(u,type,seed,seed,{},level,upgradePractice(j,u));
const finish=(j,u,t)=>{solve(t);assert.ok(completePractice(j,t,u));return t;};

test('new expeditions have independent persisted orders and all32 branch combinations retain all20 formats',()=>{
 const j=freshJourney();upgradePractice(j,units[0]);const orders=new Set(),seeds=new Set();
 for(let run=0;run<12;run++){
  const e=freshExpedition(j,units[0].id,run%3);orders.add(e.formatOrder.join('|'));seeds.add(e.contentSeed);
  for(let mask=0;mask<32;mask++){
   const copy=JSON.parse(JSON.stringify(e));copy.choices=copy.choices.map((_,i)=>mask>>i&1?'left':'right');
   assert.deepEqual(Array.from({length:5},(_,i)=>orderFor(copy,i)).flat().sort(),TASK_TYPES.slice().sort());
   assert.deepEqual(orderFor(copy,2),orderFor(JSON.parse(JSON.stringify(copy)),2));
  }
 }
 assert.equal(orders.size,12);assert.equal(seeds.size,12);
});

test('all44 unit paths in both modes use varied real content, save every checkpoint and reach the Form3 boss approach in arena one',()=>{
 for(const u of units)for(const mode of ['relaxed','challenge']){
  let save=freshSave();save.selected=u.id;save.grade=u.grade;save.mode=mode;
  let j=save.journeys[u.id]=freshJourney();upgradePractice(j,u);let e=expedition(j,u.id,0);const id=e.id,formats=[];
  for(let step=0;step<20;step++){
   if(step%4===0)chooseBranch(e,step%8?'right':'left');const type=currentType(e);formats.push(type);
   e.active=makeTask(u,type,`${e.id}:${step}`,`${e.contentSeed}:${step}:${type}`,{},j.level,j.practice);finish(j,u,e.active);
   assert.ok(milestone(j,e,type).changed);assert.equal(j.level,pathLevel(step+1,0));
   assert.ok(validSave(save,units),u.id+':'+mode+':'+step);
   save=JSON.parse(JSON.stringify(save));j=save.journeys[u.id];e=expedition(j,u.id,0);assert.equal(e.id,id);
   delete e.pendingEvolution;if(e.index%4===0)finishRun(j,e);
  }
  assert.deepEqual(formats.sort(),TASK_TYPES.slice().sort());assert.equal(j.level,3);assert.equal(j.practice.clock,20);
 }
});

test('available unseen vocabulary is covered before small-pool cycles settle into repetition; recent triples do not immediately repeat',()=>{
 for(const u of units){
  const j=freshJourney(),covered=new Set();let previous=[];
  for(let run=0;run<Math.ceil(u.vocabulary.length/2)+3;run++){
   const t=task(j,u,'translation',u.id+':'+run,10),words=t.pairs.map(p=>p.left);
   assert.ok(words.every(w=>!previous.includes(w)),u.id+': immediate repeat despite alternatives');
   words.forEach(w=>covered.add(w.toLowerCase()));finish(j,u,t);previous=words;
  }
  assert.ok(covered.size>=new Set(u.vocabulary.map(v=>v.en.toLowerCase())).size*.8,`${u.id}: ${covered.size}/${u.vocabulary.length}`);
 }
});

test('a mistake waits for two other activities and can return as an existing definition of the same word',()=>{
 const u=units[0],j=freshJourney(),t=task(j,u,'translation','miss');
 const index=t.leftOrder[0],word=t.pairs[index].left,canonical=practiceKey(u,t.pairs[index]);
 actTask(t,{kind:'left',index});assert.ok(actTask(t,{kind:'right',index:(index+1)%3}).wrong);notePracticeMistake(j,t,u);finish(j,u,t);
 assert.equal(j.practice.items[canonical].reviewAt,3);
 for(const type of ['listen-word','definition']){
  const next=task(j,u,type,'delay:'+type);assert.ok(!(next.pairs||next.rounds).some(row=>practiceKey(u,row)===canonical));finish(j,u,next);
 }
 j.practice.cursor=2; // The next selection is a review slot in the documented mix.
 const review=task(j,u,'definition','review');assert.ok(review.pairs.some(p=>p.left===word),'same word, definition mechanism');
 finish(j,u,review);assert.equal(j.practice.items[canonical].misses,0);assert.equal(j.level,0,'practice history never awards levels');
});

test('answer layouts vary, matching is not pre-aligned, and sentence blocks never arrive already solved',()=>{
 const u=units[0],j=freshJourney(),pairs=new Set(),answers=new Set();
 for(let i=0;i<80;i++){
  const p=task(j,u,'translation','pair:'+i);assert.ok(!p.leftOrder.every((v,n)=>p.rightOrder[n]===v));pairs.add(p.layoutSignature);finish(j,u,p);
  const q=task(j,u,'answer','answer:'+i);answers.add(q.rounds.map(r=>r.options.indexOf(r.answer)).join('|'));finish(j,u,q);
  const s=task(j,u,'sentence','blocks:'+i);for(const row of s.rounds)assert.ok(!row.blocks.every((b,n)=>b.text===row.correct[n]));finish(j,u,s);
 }
 assert.ok(pairs.size>12);assert.ok(answers.size>12);
});

test('varied selection stays solvable across44 units,20 formats,three difficulty depths and eight fresh seeds',()=>{
 for(const u of units)for(const level of [0,5,10]){
  const j=freshJourney();j.level=level;
  for(let seed=0;seed<8;seed++)for(const type of TASK_TYPES){
   const t=task(j,u,type,u.id+':'+level+':'+seed+':'+type);finish(j,u,t);assert.ok(validPractice(j));
   if(t.kind==='pairs'){
    assert.equal(new Set(t.pairs.map(p=>p.left.toLowerCase())).size,3);
    assert.equal(new Set(t.pairs.map(p=>(p.image||p.right).toLowerCase())).size,3);
   }
  }
 }
});

test('sentence assembly, halves, completion and grammar retain checked source meanings and share review identity',()=>{
 const u=units[0],sentence=u.sentences[0],gap=u.gaps.find(g=>g.id.startsWith(sentence.id+'-')),repair=u.repairs.find(g=>g.id.startsWith(sentence.id+'-'));
 assert.equal(practiceKey(u,sentence),practiceKey(u,gap));assert.equal(practiceKey(u,gap),practiceKey(u,repair));
 const j=freshJourney();for(const type of ['sentence','halves','ending','gap','correct','repair','qa-pairs','answer']){
  const t=task(j,u,type,type,8);for(const row of t.pairs||t.rounds)assert.ok([...u.sentences,...u.questions,...u.gaps,...u.repairs].some(x=>x.id===row.id));finish(j,u,t);
 }
});

test('old routes and accepted pieces survive upgrade; replay history persists through unit restart without leaking to another unit',()=>{
 const save=freshSave(),j=save.journeys.g5u1=freshJourney(),e=j.expeditions[0]=freshExpedition(j,'g5u1',0);
 chooseBranch(e,'left');e.active=makeTask(units[0],currentType(e),e.id+':0');actTask(e.active,{kind:'left',index:0});actTask(e.active,{kind:'right',index:0});
 const before=JSON.stringify(e);j.seen[units[0].vocabulary[0].id]=3;upgradePractice(j,units[0]);assert.equal(JSON.stringify(e),before);assert.equal(e.varietyVersion,undefined);
 assert.equal(j.practice.items[practiceKey(units[0],units[0].vocabulary[0])].count,3);
 const r=restart(j);assert.equal(r.level,0);assert.deepEqual(r.practice,j.practice);assert.notEqual(r.practice,j.practice);assert.equal(freshJourney().practice,undefined);
 assert.ok(validSave(save,units));assert.equal(upgradePractice(j,units[0]),j.practice);
});

test('practice completion is once-only, the mix is60/25/15, and malformed imported history or duplicate formats are rejected',()=>{
 const save=freshSave(),j=save.journeys.g5u1=freshJourney(),t=task(j,units[0],'translation','once');finish(j,units[0],t);
 assert.equal(completePractice(j,t,units[0]),false);assert.equal(j.practice.clock,1);
 assert.deepEqual(['fresh','review','familiar'].map(role=>PRACTICE_ROLES.filter(x=>x===role).length),[12,5,3]);
 const e=j.expeditions[0]=freshExpedition(j,'g5u1',0);assert.ok(validSave(save,units));e.formatOrder[0]=e.formatOrder[1];assert.equal(validSave(save,units),false);
 delete j.expeditions[0];j.practice.items=3;assert.equal(validPractice(j),false);
});
