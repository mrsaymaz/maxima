import{test}from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
import{launchMarkup}from'../src/launch-ui.js';import{growthBar}from'../src/camp-ui.js';import{pathGrowthState}from'../src/path-growth.js';import{freshJourney}from'../src/expedition.js';
// Players see their creature's stage as "Level N" everywhere: no "Form N" text is left in the game's screens.
test('no player-facing "Form N" text remains in the game screens',()=>{
 const files=fs.readdirSync('dist').filter(f=>/\.(js|html)$/.test(f));
 for(const f of files){const s=fs.readFileSync(`dist/${f}`,'utf8').split('\n').filter(l=>!/^\s*\/\//.test(l)).join('\n');
  assert.doesNotMatch(s,/\b(Forms?|FORMS?) (\d|\$\{)/,`${f} still shows Form N`);}
});
test('the opening screen and growth bar say Level',()=>{
 const html=launchMarkup({coins:0,areas:[{selected:true},{locked:true},{locked:true}],nickname:'Max',level:3,grade:5,mode:'relaxed',unitTitle:'Unit',partners:[{id:'hufflepuff',name:'Hufflepuff',element:'Air',portrait:'x.png',level:3,selected:true}]});
 assert.match(html,/Max · Level 3/);assert.match(html,/Air · LvL 3/);assert.match(html,/AIR, [^,"]*, Level 3/);assert.match(html,/Levels 0–4 · Boss victory earns Level 4/);
 assert.match(growthBar(pathGrowthState(freshJourney())),/Level 1/);
});
