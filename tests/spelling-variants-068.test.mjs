import{test}from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
import{spellingVariants,otherSpellings,sameWord,sameSpelling,letterFits,sameLengthSpellings}from'../src/spelling-variants.js';
import{runFor,setRunnerWords,LANES}from'../src/runner-course.js';import{FORM_HEIGHTS}from'../src/world-layout.js';
import{RunnerControl}from'../src/runner-control.js';import{localPoint}from'../src/traversal-layout.js';
import{plausibleMisspelling,makeTask,actTask}from'../src/trail-tasks.js';import{acceptedLines,revealMarkup}from'../src/task-voice.js';
const expedition={id:'t',area:0,adventureVersion:2,level:0,serial:1,choices:Array(5).fill('left'),index:1};
const withRun=index=>{const s={id:`t:travel:${index}`,index,chapter:Math.floor(index/4),side:'left',area:0,start:{x:0,z:0},forward:{x:0,z:-1},right:{x:1,z:0},length:60};s.run=runFor(s,expedition,'relaxed',true);return s;};
const navFor=section=>({section,state:{index:section.index,travel:{collected:[]}},player:localPoint(section,section.run.from+.5,0),height:FORM_HEIGHTS[0],recovery:0,combat:null,y:0,vy:0,grounded:true,invincible:0,rush:null,support(){return 0;},requestJump(){return true;}});
test('British and American spellings of the curriculum words are linked, everyday words are not',()=>{
 for(const[uk,us]of[['organise','organize'],['organised','organized'],['organisation','organization'],['colour','color'],['favourite','favorite'],['centre','center'],['centimetre','centimeter'],['travelled','traveled'],['practising','practicing'],['programme','program'],['jewellery','jewelry'],['pyjamas','pajamas'],['neighbourhood','neighborhood'],['theatre','theater'],['mum','mom'],['grey','gray'],['dialogue','dialog'],['apologise','apologize']]){assert.ok(sameWord(uk,us),uk);assert.ok(sameWord(us.toUpperCase(),uk));}
 for(const w of['prize','size','raise','hour','four','your','sentence','fence','called','skill','spelling','course','tour'])assert.deepEqual(otherSpellings(w),[],w);
 assert.ok(sameSpelling('My favourite colour is grey.','my favorite color is gray'));assert.ok(!sameSpelling('my favourite colour','my favourite car'));
 assert.ok(letterFits('centre',4,'e',['c','e','n','t',null,null]),'center is possible');assert.ok(!letterFits('centre',5,'e',['c','e','n','t','e',null]),'but not cente');
});
test('every British spelling in the lessons that has an American form is recognised',()=>{
 const units=JSON.parse(fs.readFileSync('content/data/expedition-language.json')).units,words=new Set();
 for(const u of units)for(const v of u.vocabulary)for(const w of v.en.toLowerCase().match(/[a-z]+/g)||[])words.add(w);
 for(const w of['organise','colour','favourite','centre','theatre','jewellery','pyjamas','programme','practise','neighbour','travelled'])if(words.has(w))assert.ok(otherSpellings(w).length,w);
});
test('a word run accepts either spelling, letter by letter, and reports the spelling collected',()=>{
 for(const[uk,us]of[['organise','organize'],['centre','center']]){
  setRunnerWords([{id:'w',en:uk,tr:'kelime'}]);const section=withRun(2),word=section.run.word;assert.equal(word.answer,uk);assert.deepEqual(word.variants.sort(),[uk,us].sort());
  for(let slot=1;slot<uk.length;slot++){const row=word.tokens.filter(t=>t.slot===slot),right=row.filter(t=>t.correct).map(t=>t.letter).sort();assert.deepEqual(right,[...new Set([uk[slot],us[slot]])].sort(),`${uk} slot ${slot}`);assert.equal(new Set(row.map(t=>t.lane)).size,3);}
  for(const target of[uk,us]){const nav=navFor(section),r=new RunnerControl(),closed=[],marks=[];r.events={word:(w,letters)=>closed.push(letters.join('')),letter:t=>marks.push(t.correct)};r.engage(nav);
   for(let slot=1;slot<target.length;slot++){const t=word.tokens.find(t=>t.slot===slot&&t.letter===target[slot]);r.s=t.s;r.lat=LANES[t.lane];r.collide(nav);}
   assert.deepEqual(closed,[target],`${target} is complete`);assert.ok(marks.every(Boolean),`${target}: every letter counted as correct`);}
 }
 setRunnerWords([{id:'w',en:'centre',tr:'merkez'}]);const section=withRun(2),word=section.run.word,nav=navFor(section),r=new RunnerControl(),marks=[];r.events={letter:t=>marks.push(t.correct)};r.engage(nav);
 for(const[slot,letter]of[[1,'e'],[2,'n'],[3,'t'],[4,'e'],[5,'e']]){const t=word.tokens.find(t=>t.slot===slot&&t.letter===letter);r.s=t.s;r.lat=LANES[t.lane];r.collide(nav);}
 assert.equal(marks.at(-1),false,'mixing the two spellings (cente…) is not accepted');
 setRunnerWords([{id:'w',en:'rule',tr:'kural'}]);assert.deepEqual(withRun(2).run.word.variants,['rule']);
});
test('the misspelled-word task never offers a valid spelling as the mistake, and shows the other spelling',()=>{
 for(let depth=0;depth<=10;depth++)for(const w of['colour','favourite','neighbour','theatre','organise','travelled','jewellery'])assert.ok(!sameWord(plausibleMisspelling(w,depth,[]),w),`${w} at depth ${depth}`);
 const unit={id:'u',vocabulary:[{id:'a',en:'colour',tr:'renk'},{id:'b',en:'window',tr:'pencere'},{id:'c',en:'garden',tr:'bahçe'},{id:'d',en:'teacher',tr:'öğretmen'}]},t=makeTask(unit,'spelling','n','s',{},5),q=t.rounds.find(q=>q.correction==='colour');
 assert.ok(q,'colour is asked');assert.deepEqual(q.alsoCorrect,['color']);const i=t.rounds.indexOf(q);while(t.round<i)actTask(t,{kind:'choice',text:t.rounds[t.round].answer});
 const before=JSON.parse(JSON.stringify(t)),r=actTask(t,{kind:'choice',text:q.answer}),said=acceptedLines(before,t,{kind:'choice',text:q.answer},r);
 assert.deepEqual(said.reveal.also,['color']);assert.match(revealMarkup(said.reveal),/Also correct: <b lang="en">color<\/b>/);
});
