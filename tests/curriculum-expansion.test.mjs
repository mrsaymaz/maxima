import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {makeTask,actTask,numberWords} from '../dist/trail-tasks.js';
import {ordinalLabel,ordinalWords} from '../dist/curriculum-numbers.js';
import {freshJourney,freshSave,expedition,chooseBranch,currentType,milestone,finishRun,validSave,TASK_TYPES} from '../dist/expedition.js';
import {upgradePractice} from '../dist/practice-selection.js';
import {mechanismPlan,repairOffset} from '../dist/world-mechanisms.js';
const data=JSON.parse(fs.readFileSync('dist/data/expedition-language.json')),units=data.units;
const base=JSON.parse(fs.readFileSync('content/curriculum-v1/baseline-v0.34.0.json'));
const map=JSON.parse(fs.readFileSync('dist/data/curriculum-manifest.json'));
const master=JSON.parse(fs.readFileSync('language-pack/authored-expansion.json'));
const core=units.filter(u=>u.curriculum.kind==='core');
function solve(t){let safety=0;while(!t.complete&&safety++<100){
 if(t.kind==='pairs'){const index=t.leftOrder.find(i=>!t.matched.includes(i));actTask(t,{kind:'left',index});actTask(t,{kind:'right',index});continue;}
 const q=t.rounds[t.round];if(q.kind==='blocks')actTask(t,{kind:'block',index:q.blocks.findIndex((b,i)=>!t.used.includes(i)&&b.text===q.correct[t.used.length])});
 else if(q.kind==='repair'&&!t.repairFound)actTask(t,{kind:'find',text:q.broken});
 else if(['multi','sequence'].includes(q.kind)){for(const text of q.answer)actTask(t,{kind:'pick',text});actTask(t,{kind:'confirm'});}
 else actTask(t,{kind:'choice',text:q.answer});
}assert.ok(t.complete,t.type);}

test('all44 journeys and every legacy language record survive the curriculum expansion unchanged',()=>{
 assert.equal(units.length,44);assert.equal(core.length,36);
 for(const old of base.units){const u=units.find(u=>u.id===old.id);assert.ok(u);assert.equal(u.title,old.title);
  for(const kind of ['vocabulary','descriptions','sentences','questions','gaps','repairs','categories']){
   const byId=new Map(u[kind].map(r=>[r.id,r]));assert.equal(byId.size,u[kind].length,kind);
   for(const record of old[kind])assert.deepEqual(byId.get(record.id),record,old.id+':'+record.id);
   if(u.curriculum.kind==='enrichment')assert.equal(u[kind].length,old[kind].length);
  }
 }
});
test('the36 core packs have verified programme references and eight enrichment journeys stay distinct',()=>{
 for(const g of [5,6,7,8])assert.equal(core.filter(u=>u.grade===g).length,g<7?8:10);
 assert.equal(units.filter(u=>u.curriculum.kind==='enrichment').length,8);
 for(const u of core){const m=map.units.find(m=>m.id===u.id);assert.ok(m.sources[0].pdfPage>0);assert.ok(m.outcomeCodes.length);assert.ok(m.grammarTargets.length);assert.equal(u.cefr,u.grade===5?'A2.1':u.grade===6?'A2.2':'A2');}
});
test('each core unit has a larger bilingual pool and twelve grounded contexts rather than renamed copies',()=>{
 for(const u of core){assert.ok(u.vocabulary.length>=40,u.id);assert.ok(u.sentences.length>=60,u.id);assert.ok(u.questions.length>=40,u.id);assert.ok(u.gaps.length>=28,u.id);assert.ok(u.repairs.length>=27,u.id);assert.equal(u.contexts.length,12);
  assert.equal(new Set(u.contexts.map(t=>t.en)).size,12);
  const defined=new Set(u.descriptions.map(d=>d.answer.toLowerCase()));for(const v of u.vocabulary)assert.ok(defined.has(v.en.toLowerCase()),u.id+':'+v.en);
 }
 for(const row of master.records.vocabulary)assert.ok(row.en&&row.tr&&row.definition&&row.example&&row.exampleTr&&row.pos&&row.sourceRefs.length&&row.reviewStatus.includes('teacher-review-pending'));
 for(const row of master.records.questions){assert.ok(row.context&&row.contextTr&&row.question&&row.questionTr&&row.answerTr);assert.equal(row.options.length,3);assert.equal(new Set(row.options).size,3);assert.ok(row.options.includes(row.answer));assert.equal(row.acceptedAnswers[0],row.answer);assert.ok(row.sourceRefs.length);}
});
test('authored grammar slots reconstruct their supplied sentences and target exactly one faulty piece',()=>{
 for(const g of master.records.gaps){assert.equal((g.prompt.match(/___/g)||[]).length,1);assert.equal(g.prompt.replace('___',g.answer),g.fullCorrect);assert.equal(g.options.length,3);assert.equal(new Set(g.options).size,3);assert.ok(g.tr);assert.ok(!/[{}~]/.test(g.fullCorrect));}
 for(const g of master.records.repairs){assert.ok(g.broken!==g.answer);assert.ok(g.options.includes(g.broken));assert.ok(g.options.includes(g.answer));assert.equal(g.prompt.replace('___',g.answer),g.fullCorrect);}
});
test('Grade6 number tasks cover100–500 and all50 ordinals; Grade5 Classroom Life covers50–100',()=>{
 const g6=units.find(u=>u.id==='g6u2'),g5=units.find(u=>u.id==='g5u2');let cardinals=0,ordinals=0;
 for(let seed=0;seed<160;seed++)for(const u of [g5,g6]){
  const t=makeTask(u,'numbers','n','number:'+seed,{},seed%11);
  for(const p of t.pairs){if(p.id.startsWith('ordinal-')){ordinals++;const n=parseInt(p.left);assert.ok(n>=1&&n<=50);assert.equal(p.right,ordinalWords(n,numberWords));}
   else{cardinals++;const n=Number(p.left);assert.ok(n>=u.numberProfile.cardinalMin&&n<=u.numberProfile.cardinalMax);assert.equal(p.right,numberWords(n));}}
  solve(t);
 }
 assert.ok(cardinals>0&&ordinals>0);assert.equal(numberWords(500),'five hundred');
 assert.deepEqual([1,2,3,8,9,11,12,13,21,30,40,50].map(ordinalLabel),['1st','2nd','3rd','8th','9th','11th','12th','13th','21st','30th','40th','50th']);
 assert.equal(ordinalWords(12,numberWords),'twelfth');assert.equal(ordinalWords(21,numberWords),'twenty-first');assert.equal(ordinalWords(40,numberWords),'fortieth');assert.equal(ordinalWords(50,numberWords),'fiftieth');
});
test('the repair mechanism never splits a word to manufacture a faulty token; actual piece positions are checked',()=>{
 assert.equal(repairOffset('The visitors is ready.','is'),13);
 const unit={...units[0],repairs:[1,2,3].map(n=>({id:'repair'+n,prompt:'The visitors ___ ready.',answer:'are',broken:'is',options:['are','is','am'],fullCorrect:'The visitors are ready.'}))};
 const t=makeTask(unit,'repair','repair','repair'),q=t.rounds[0],plan=mechanismPlan(t),faults=plan.entries.filter(e=>e.action==='find');
 assert.ok(faults.some(e=>e.text==='visitors'));assert.equal(faults.filter(e=>e.text==='is').length,1);
 const correct=faults.find(e=>e.text==='is');assert.ok(actTask(t,{kind:'find',text:'is',index:0}).wrong);
 assert.ok(actTask(t,{kind:'find',text:'is',index:correct.index}).accepted);assert.equal(q.brokenAt,13);
});
test('the expanded data supports all20 formats in both modes and reaches the Form3 boss approach on the first saved path',()=>{
 for(const u of core)for(const mode of ['relaxed','challenge']){
  const save=freshSave();save.selected=u.id;save.grade=u.grade;save.mode=mode;let j=save.journeys[u.id]=freshJourney();upgradePractice(j,u);let e=expedition(j,u.id,0);const types=[];
  for(let step=0;step<20;step++){if(step%4===0)chooseBranch(e,step%8?'right':'left');const type=currentType(e);types.push(type);e.active=makeTask(u,type,e.id+':'+e.index,e.contentSeed+':'+step,{},j.level,j.practice);solve(e.active);assert.ok(milestone(j,e,type).changed);delete e.pendingEvolution;if(e.index%4===0)finishRun(j,e);assert.ok(validSave(save,units));const copy=JSON.parse(JSON.stringify(save));j=copy.journeys[u.id];e=j.expeditions[0];save.journeys[u.id]=j;}
  assert.deepEqual(types.sort(),TASK_TYPES.slice().sort());assert.equal(j.level,3);
 }
});
test('grade exports contain the same language records as runtime, with full editorial provenance retained',()=>{
 for(const g of [5,6,7,8]){const pack=JSON.parse(fs.readFileSync(`language-pack/grade-${g}.json`));assert.equal(pack.units.length,g<7?10:12);
  for(const u of pack.units){const runtime=units.find(x=>x.id===u.id);for(const kind of ['vocabulary','sentences','questions','gaps','repairs'])assert.deepEqual(u[kind].map(r=>r.id),runtime[kind].map(r=>r.id));}
 }
});
