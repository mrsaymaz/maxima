import{test}from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
import{makeTask,actTask}from'../dist/trail-tasks.js';
import{acceptedLines,pieceLine,revealMarkup,revealTime}from'../dist/task-voice.js';
import{femaleEnglishVoice,englishVoice}from'../dist/voice-preference.js';
import{lessonPlan,dangerLanes,DANGER_LESSONS,lessonMarkup,runDangerLesson}from'../dist/danger-lessons.js';
import{sketchScene,creatureSvg}from'../dist/creature-sketch.js';
import{CHASE_KITS}from'../dist/runner-course.js';
import{explainMistake}from'../dist/mistakes.js';
const unit=JSON.parse(fs.readFileSync(new URL('../dist/data/lessons/g5u1.json',import.meta.url)));
const clone=t=>JSON.parse(JSON.stringify(t));

test('sentence order shows no Turkish while building and reveals the meaning once the sentence is complete',()=>{
 for(const level of[0,5,10]){const t=makeTask(unit,'sentence','n','seed-'+level,{},level),q=t.rounds[0],s=unit.sentences.find(x=>x.id===q.id);
  assert.match(q.prompt,/^Put the blocks in order to build the English (sentence|question)\.$/);assert.ok(!q.prompt.includes(s.tr));assert.equal(q.meaning,s.tr);
  assert.equal(explainMistake(t,{kind:'block',index:0},unit).tr,'','a wrong block does not give the Turkish away');
  let said=null;q.correct.forEach(text=>{const before=clone(t),index=q.blocks.findIndex((b,i)=>b.text===text&&!t.used.includes(i)),r=actTask(t,{kind:'block',index});said=acceptedLines(before,t,{kind:'block',index},r);});
  assert.equal(said.reveal.kind,'sentence');assert.equal(said.reveal.tr,s.tr);assert.equal(said.say,said.reveal.en);assert.match(said.say,/[.?!]$/);}
});
test('matching tasks keep their Turkish meaning and read the full English sentence when halves are joined',()=>{
 const t=makeTask(unit,'halves','n','h'),p=t.pairs[0];assert.ok(p.context,'halves keep the Turkish meaning');const before=clone(t);actTask(t,{kind:'left',index:0});const mid=clone(t);const r=actTask(t,{kind:'right',index:0});
 const said=acceptedLines(mid,t,{kind:'right',index:0},r);assert.equal(said.reveal.tr,p.context);assert.ok(said.say.startsWith(p.left.replace(/…$/,'').trim()));
 const e=makeTask(unit,'ending','n','e');assert.match(e.rounds[0].context,/^Meaning: /);void before;
});
test('English sentences, questions with answers and English words are read after each correct match or answer',()=>{
 const qa=makeTask(unit,'qa-pairs','n','q');actTask(qa,{kind:'left',index:1});const b=clone(qa),r=actTask(qa,{kind:'right',index:1});const said=acceptedLines(b,qa,{kind:'right',index:1},r);assert.ok(said.say.startsWith(qa.pairs[1].left));assert.ok(said.say.includes(qa.pairs[1].right.replace(/[.]$/,'')));
 const tr=makeTask(unit,'translation','n','t');actTask(tr,{kind:'left',index:2});const b2=clone(tr),r2=actTask(tr,{kind:'right',index:2});assert.equal(acceptedLines(b2,tr,{kind:'right',index:2},r2).say,tr.pairs[2].left);
 assert.equal(pieceLine(tr,'left',0),tr.pairs[0].left);assert.equal(pieceLine(tr,'right',0),null,'Turkish pieces are not read in English');
 const def=makeTask(unit,'definition','n','d');assert.equal(pieceLine(def,'right',0),def.pairs[0].right);
 const ans=makeTask(unit,'answer','n','a'),q=ans.rounds[0],b3=clone(ans),r3=actTask(ans,{kind:'choice',text:q.answer});assert.equal(acceptedLines(b3,ans,{kind:'choice',text:q.answer},r3).say,`${q.prompt} ${q.answer.replace(/[.]?$/,'.')}`);
 const wrong=acceptedLines(clone(ans),ans,{kind:'choice',text:'x'},{accepted:false,wrong:true});assert.equal(wrong.say,'');
});
test('the misspelled-word task shows and reads the correct spelling after the student finds the mistake',()=>{
 const t=makeTask(unit,'spelling','n','s'),q=t.rounds[0],b=clone(t),r=actTask(t,{kind:'choice',text:q.answer});const said=acceptedLines(b,t,{kind:'choice',text:q.answer},r);
 assert.deepEqual(said.reveal,{kind:'spelling',label:'Correct spelling',en:q.correction,wrong:q.answer});assert.equal(said.say,q.correction);
 const html=revealMarkup(said.reveal);assert.match(html,new RegExp(`<s[^>]*>${q.answer}</s>`));assert.match(html,new RegExp(`<strong lang="en">${q.correction}</strong>`));assert.equal((html.match(/<i style/g)||[]).length,q.correction.replace(/ /g,'').length);
 assert.ok(revealTime(said.reveal)>=2600);
});
test('a female American or British voice is preferred, with any English voice as the fallback',()=>{
 const v=(name,lang,localService=true)=>({name,lang,localService});
 assert.equal(femaleEnglishVoice([v('Karen','en-AU'),v('Samantha','en-US')]).name,'Samantha');
 assert.equal(femaleEnglishVoice([v('Daniel','en-GB'),v('Serena','en-GB'),v('Moira','en-IE')]).name,'Serena');
 assert.equal(englishVoice([v('Daniel','en-GB'),v('Rishi','en-IN')]).name,'Daniel');assert.equal(englishVoice([v('Yelda','tr-TR')]),null);
});
test('every guardian chase attack and the crystal wall has a first-time lesson asking for the right move',()=>{
 for(const kind of CHASE_KITS.flat())assert.ok(DANGER_LESSONS[kind],kind);
 assert.deepEqual(lessonPlan('crystal',{lane:1}).want,['tap']);assert.match(lessonPlan('crystal').text,/Tap your creature/);
 const roots=lessonPlan('roots',{lane:1,attack:{kind:'roots',lane:1}});assert.deepEqual(roots.danger,[1]);assert.deepEqual(roots.want.sort(),['left','right']);
 const edge=lessonPlan('roots',{lane:0,attack:{kind:'roots',lane:0}});assert.deepEqual(edge.want,['right']);assert.match(edge.prompt,/→/);
 const safe=lessonPlan('roots',{lane:2,attack:{kind:'roots',lane:0}});assert.ok(safe.want.includes('tap'));
 assert.deepEqual(lessonPlan('slam',{lane:1,attack:{kind:'slam'}}).want,['up']);
 assert.deepEqual(dangerLanes('shards',{attack:{lanes:[0,2],gap:1}}),[0,2]);assert.deepEqual(dangerLanes('volley',{lane:2,attack:{lane:'aim'}}),[2]);
 assert.deepEqual(lessonPlan('chain',{lane:0,attack:{kind:'chain',gap:2}}).want,['up','right']);
 for(const key of Object.keys(DANGER_LESSONS))assert.ok(lessonPlan(key,{lane:1}).grace>=0);
 assert.match(lessonMarkup(roots,{color:'#ffb968'}),/sketch-scene demo-lane/);
});
test('a danger lesson waits for the right gesture and passes it back to the run',async()=>{
 const element=()=>({className:'',innerHTML:'',style:{},attrs:{},handlers:{},classList:{add(){}},setAttribute(k,v){this.attrs[k]=v;},addEventListener(t,fn){this.handlers[t]=fn;},appendChild(){},querySelector:()=>null,remove(){this.removed=true;}});
 const doc={createElement:element,body:{appendChild(){}}},win={addEventListener(){}};let done='none';
 const l=runDangerLesson(lessonPlan('roots',{lane:1,attack:{lane:1}}),{doc,win,onDone:k=>done=k});l.attempt('up');l.attempt('tap');assert.equal(done,'none','a wrong move does not count');
 l.attempt('left');await new Promise(r=>setTimeout(r,500));assert.equal(done,'left');assert.ok(l.root.removed);
});
test('the simplified creature sketch is coloured like the team and shows the joystick on the chosen side',()=>{
 assert.match(creatureSvg('#8bd9f4'),/#8bd9f4/);assert.match(sketchScene({demo:'arena',stick:'left'}),/translate\(32,128\)/);assert.match(sketchScene({demo:'crystal'}),/sk-wall/);
});
