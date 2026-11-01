import{test}from'node:test';import assert from'node:assert/strict';
import{STORY_SCENES,STORY_ORDER,STORY_GUARDIANS,sceneLines,storyLevel,reaction,sceneSeen,markSeen,introScene,guardianScene,winScenes}from'../src/story.js';
import{sceneMarkup,playScene}from'../src/story-scene.js';import{storyVoice}from'../src/voice-preference.js';import{AREAS}from'../src/core.js';import{GUIDE_POSES}from'../src/guide.js';
test('the story covers every arena: an intro, the guardian, the win and the finale, in order',()=>{
 assert.deepEqual(STORY_ORDER,['intro-0','guardian-0','win-0','intro-1','guardian-1','win-1','intro-2','guardian-2','win-2','finale']);
 for(const id of STORY_ORDER)assert.ok(STORY_SCENES[id],id);
 assert.deepEqual(STORY_GUARDIANS,AREAS.map(a=>a.guardian),'guardian names match the arenas');
 for(let a=0;a<3;a++){assert.equal(STORY_SCENES[introScene(a)].area,a);assert.equal(STORY_SCENES[guardianScene(a)].guardian,a);assert.match(sceneLines(guardianScene(a),5)[0].en,new RegExp(STORY_GUARDIANS[a]));}
 assert.deepEqual(winScenes(0),['win-0']);assert.deepEqual(winScenes(2),['win-2','finale']);
 assert.deepEqual(STORY_ORDER.map(id=>STORY_SCENES[id].shards),[0,0,1,1,1,2,2,2,3,3],'shards come back one per guardian');
});
test('every line has an easier version for Grades 5–6, a richer one for Grades 7–8, and a Turkish meaning',()=>{
 assert.equal(storyLevel(5),'easy');assert.equal(storyLevel(6),'easy');assert.equal(storyLevel(7),'more');assert.equal(storyLevel(8),'more');
 for(const id of STORY_ORDER)for(const l of STORY_SCENES[id].lines){assert.ok(GUIDE_POSES.includes(l.pose));
  for(const level of['easy','more']){assert.ok(l[level].en.length>5&&l[level].tr.length>5,`${id} ${level}`);assert.notEqual(l[level].en,l[level].tr);}
  const words=s=>s.split(/\s+/).length,sentences=s=>s.split(/[.!?]+\s/).map(words);
  assert.ok(Math.max(...sentences(l.easy.en))<=12,`${id}: easy sentences stay short: ${l.easy.en}`);assert.ok(words(l.more.en)<=22,`${id}: ${l.more.en}`);}
 assert.notEqual(sceneLines('intro-0',5)[1].en,sceneLines('intro-0',8)[1].en);
 assert.ok(reaction('out',5).en&&reaction('knockout',8,1).en);
});
test('each scene is seen once and remembered in the save',()=>{const save={};assert.equal(sceneSeen(save,'intro-0'),false);markSeen(save,'intro-0');markSeen(save,'intro-0');assert.deepEqual(save.story.seen,['intro-0']);assert.ok(sceneSeen(save,'intro-0'));});
test('a cut-scene shows Mr. Saymaz, the line, a Turkish toggle and the Sol Crystal; it reads each line and ends on the last Next',async()=>{
 const html=sceneMarkup('guardian-1',{grade:8,index:0,showTr:true});assert.match(html,/saymaz-point/);assert.match(html,/Galecrest Warden, riding the storm winds/);assert.match(html,/story-tr" lang="tr"/);assert.match(html,/story-foe/);assert.match(html,/class="shard lit"/);
 assert.match(sceneMarkup('guardian-1',{grade:8,index:2}),/>Fight!</);assert.match(sceneMarkup('finale',{grade:5,index:2}),/The end/);
 const handlers={},root={className:'',innerHTML:'',classList:{add(){}},setAttribute(){},addEventListener(t,f){handlers[t]=f;},querySelector:()=>null,remove(){root.removed=true;}};
 const doc={createElement:()=>root,body:{appendChild(){}}},said=[];let stopped=0;
 const done=playScene('intro-0',{doc,win:{addEventListener(){}},grade:5,onLine:t=>said.push(t),onStop:()=>stopped++});
 const press=what=>handlers.click({target:{closest:s=>s==='[data-story]'?{dataset:{story:what}}:null}});
 press('tr');assert.equal(said.length,1,'Turkish does not repeat the line');press('listen');assert.equal(said.length,2);
 for(let i=0;i<4;i++)press('next');assert.equal(await done,true);assert.equal(stopped,1);assert.deepEqual(said.slice(2),sceneLines('intro-0',5).slice(1).map(l=>l.en));
 const skipped=playScene('win-0',{doc,win:{addEventListener(){}},grade:5});press('skip');assert.equal(await skipped,false);
});
test('Mr. Saymaz speaks with a British male voice when the device has one',()=>{const v=(name,lang)=>({name,lang,localService:true});
 assert.equal(storyVoice([v('Samantha','en-US'),v('Daniel','en-GB'),v('Serena','en-GB')]).name,'Daniel');
 assert.equal(storyVoice([v('Google UK English Female','en-GB'),v('Google UK English Male','en-GB')]).name,'Google UK English Male');
 assert.equal(storyVoice([v('Microsoft Sonia Online','en-GB'),v('Microsoft Ryan Online (Natural) - English (United Kingdom)','en-GB')]).name,'Microsoft Ryan Online (Natural) - English (United Kingdom)');
 assert.equal(storyVoice([v('Samantha','en-US'),v('Alex','en-US')]).name,'Alex','a male voice before a female one');assert.equal(storyVoice([v('Yelda','tr-TR')]),null);
});
