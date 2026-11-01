import{test}from'node:test';import assert from'node:assert/strict';
import{backdrop,guardianArt,crystalArt,particles}from'../src/story-art.js';
import{stageMarkup,lineMarkup,playScene}from'../src/story-scene.js';import{sceneLines}from'../src/story.js';
test('each arena and the finale have a layered landscape: sky, far, mid, near and light/mist, the same every time',()=>{
 for(const which of[0,1,2,'finale']){const art=backdrop(which);for(const k of['sky','far','mid','near','fx'])assert.match(art[k],new RegExp(`class="sa-layer sa-${k}"`),`${which} ${k}`);
  assert.ok(Object.values(art).join('').length>6000,`${which} has real detail`);assert.match(art.far,/<g class="sa-lift">/);assert.doesNotMatch(art.sky,/sa-lift/);}
 assert.equal(backdrop(1).mid,backdrop(1).mid);assert.notEqual(backdrop(0).far,backdrop(2).far);
});
test('the three guardians are distinct colossi with glowing eyes and their arena dressing',()=>{
 const g=[0,1,2].map(guardianArt);for(const a of g){assert.match(a,/sa-eyes/);assert.match(a,/sa-guardian-fit/);}
 assert.match(g[0],/#5fae45/,'leafy crown');assert.match(g[1],/sa-orbit/,'orbiting stones');assert.match(g[2],/sa-float/,'floating crystals');assert.equal(new Set(g).size,3);
});
test('the Sol Crystal comes back piece by piece: blades, then the sol; a returning piece flies in',()=>{
 assert.equal((crystalArt(0).match(/ on"/g)||[]).length,0);assert.equal((crystalArt(2).match(/ on"/g)||[]).length,2);assert.match(crystalArt(2),/sa-piece-2 off/);
 assert.match(crystalArt(2,{fresh:1}),/sa-piece-1 on fresh/);assert.match(crystalArt(3,{whole:true}),/sa-radiance/);assert.doesNotMatch(crystalArt(2),/sa-radiance/);
 assert.match(stageMarkup('win-1'),/sa-piece-1 on fresh/);assert.doesNotMatch(stageMarkup('guardian-1'),/fresh/);
 assert.match(particles(0),/sa-firefly/);assert.match(particles('finale'),/sa-sparkle/);
});
test('lines type out while they are read; Next first finishes the line, then moves on',async()=>{
 const els={},root={className:'',innerHTML:'',classList:{add(){}},setAttribute(){},addEventListener(t,f){root[t]=f;},querySelector:sel=>els[sel]||(els[sel]={innerHTML:'',textContent:'',focus(){}}),remove(){}};
 const doc={createElement:()=>root,body:{appendChild(){}}},said=[];
 const done=playScene('intro-1',{doc,win:{addEventListener(){}},grade:5,typeSpeed:5,onLine:t=>said.push(t)});
 const press=what=>root.click({target:{closest:s=>s==='[data-story]'?{dataset:{story:what}}:null}});
 assert.match(els['.story-box'].innerHTML,/story-ghost/,'the first line starts typing');press('next');assert.equal(said.length,1,'Next finished the line without moving on');
 assert.doesNotMatch(lineMarkup('intro-1',{grade:5,index:0}).box,/story-ghost" aria-hidden="true">[^<]/);
 press('next');assert.equal(said.length,2);press('skip');assert.equal(await done,false);assert.equal(said[1],sceneLines('intro-1',5)[1].en);
});
