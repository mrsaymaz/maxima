import{test}from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import crypto from'node:crypto';
import{pictureCandidates}from'../dist/picture-selection.js';import{makeTask,actTask}from'../dist/trail-tasks.js';import{freshJourney}from'../dist/expedition.js';import{upgradePractice}from'../dist/practice-selection.js';
const data=JSON.parse(fs.readFileSync('dist/data/expedition-language.json')),review=JSON.parse(fs.readFileSync('dist/data/picture-review.json')),assets=JSON.parse(fs.readFileSync('content/curriculum-v1/fluent-assets.json')),full=JSON.parse(fs.readFileSync('language-pack/authored-expansion.json'));
const added=data.units.flatMap(u=>u.vocabulary.filter(v=>v.id.includes('mx35')).map(v=>({unit:u,...v}))),byId=new Map(review.records.map(r=>[r.vocabularyId,r]));
test('every expansion word has a sense-specific picture decision, with portable provenance for approved words',()=>{
 assert.equal(added.length,735);assert.equal(byId.size,735);assert.equal(added.filter(v=>v.picture).length,33);
 for(const v of added){const r=byId.get(v.id);assert.equal(r.en,v.en);assert.equal(r.tr,v.tr);assert.ok(r.reason.length>25);if(r.decision==='picture'){assert.equal(v.picture,r.picture);assert.equal(v.picturePolicy,'reviewed');assert.ok(fs.existsSync('dist/'+v.picture));assert.ok(r.reviewStatus.includes('teacher-review-pending'));}else{assert.equal(v.picturePolicy,'text-only');assert.ok(!v.picture);assert.ok(r.reasonCategory);}}
 for(const v of full.records.vocabulary){const r=byId.get(v.runtimeVocabularyId);if(r?.decision==='picture'){assert.equal(v.picture,r.picture);assert.equal(v.pictureReview.reason,r.reason);}}
 for(const g of [5,6,7,8]){const pack=JSON.parse(fs.readFileSync(`language-pack/grade-${g}.json`));for(const u of pack.units)for(const v of u.vocabulary){const r=byId.get(v.id);if(r?.decision==='picture')assert.equal(v.picture,r.picture);}}
});
test('different senses and underspecified scenes never receive an inferred image',()=>{
 for(const en of ['train','ring','wool','seed','paragliding','scuba diving','canoeing','rafting','recycling bin','plastic bag','cloth bag','paper plate','temperature','honest','permission','privacy']){const words=added.filter(v=>v.en===en);assert.ok(words.length,en);for(const v of words)assert.ok(!v.picture,en);}
 for(const en of ['robot','heart','needle','rubbish bin','magnifying glass'])assert.ok(added.find(v=>v.en===en)?.picture,en);
});
test('shared files, confusable groups including zero, and transitive aliases cannot compete',()=>{
 const input=[{id:'a',picture:'one',pictureGroup:0},{id:'b',picture:'two',pictureGroup:0},{id:'c',picture:'two',pictureGroup:'other'},{id:'d',picture:'three',pictureGroup:'other'},{id:'e',picture:'four'},{id:'f',picture:'five',picturePolicy:'text-only'}],before=JSON.stringify(input),out=pictureCandidates(input);
 assert.equal(out.length,5);assert.equal(new Set(out.slice(0,4).map(v=>v.pictureIdentity)).size,1);assert.notEqual(out[4].pictureIdentity,out[0].pictureIdentity);assert.equal(JSON.stringify(input),before);
});
test('picture boards remain solvable across all44 units in old and adaptive selection; approved additions can be drawn',()=>{
 const drawn=new Set();for(const u of data.units){const p=upgradePractice(freshJourney(),u),candidates=pictureCandidates(u.vocabulary),identities=new Map(candidates.map(v=>[v.id,v.pictureIdentity]));assert.ok(new Set(identities.values()).size>=3,u.id);
 for(let seed=0;seed<80;seed++)for(const practice of [null,p]){const t=makeTask(u,'picture','emoji',`${u.id}:fluent:${seed}`,{},seed%11,practice);assert.equal(t.pairs.length,3);assert.equal(new Set(t.pairs.map(v=>identities.get(v.id))).size,3,u.id);assert.equal(new Set(t.pairs.map(v=>v.image)).size,3,u.id);for(const pair of t.pairs){drawn.add(pair.id);assert.ok(fs.existsSync('dist/'+pair.image));}const before=JSON.parse(JSON.stringify(t));actTask(t,{kind:'left',index:0});actTask(t,{kind:'right',index:1});assert.deepEqual(t.matched,before.matched);for(let i=0;i<3;i++){actTask(t,{kind:'left',index:i});actTask(t,{kind:'right',index:i});}assert.ok(t.complete);}}
 for(const v of added.filter(v=>v.picture))assert.ok(drawn.has(v.id),v.id+' must be reachable, including same-image aliases');
});
test('new Fluent assets are pinned, intact transparent WebP files with attribution',()=>{
 assert.equal(Object.keys(assets.assets).length,14);assert.ok(/^[a-f0-9]{40}$/.test(assets.commit));assert.ok(fs.readFileSync('dist/assets/emoji/LICENSE.txt','utf8').includes('Permission is hereby granted'));
 for(const[code,a]of Object.entries(assets.assets)){const b=fs.readFileSync(`dist/assets/emoji/${code}.webp`);assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');assert.equal(crypto.createHash('sha256').update(b).digest('hex'),a.sha256);assert.ok(a.url.includes(assets.commit));assert.equal(a.licence,'MIT');assert.ok(a.width<=256&&a.height<=256);}
});
