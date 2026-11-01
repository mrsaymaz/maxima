import{test}from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
import{GUIDE_POSES,guideSrc,guideFigure,homeGuideLine,homeGuideMarkup,guideCameo}from'../src/guide.js';
import{tutorialMarkup}from'../src/controls-tutorial.js';
import{lessonMarkup,lessonPlan}from'../src/danger-lessons.js';
const dist=new URL('../dist/',import.meta.url);
test('every Mr. Saymaz pose ships as a small WebP and is cached for offline play',()=>{const shell=JSON.parse(fs.readFileSync(new URL('offline-shell.json',dist))).files;
 for(const p of GUIDE_POSES){const f=guideSrc(p),size=fs.statSync(new URL(f,dist)).size;assert.ok(size<80_000,`${f} is ${size} bytes`);assert.ok(shell.includes(f),f);}
 assert.equal(guideSrc('nope'),'assets/guide/saymaz-smile.webp');assert.match(guideFigure('cheer'),/saymaz-cheer\.webp" alt="" width="305" height="520"/);});
test('the opening-screen line follows the journey: welcome, back again, guardian, new arena, finished lesson',()=>{
 assert.deepEqual(homeGuideLine({firstLaunch:true}).pose,'full');assert.match(homeGuideLine({firstLaunch:true}).text,/I'm Mr\. Saymaz/);
 assert.equal(homeGuideLine({resume:true,nickname:'Bolt'}).text,"Welcome back, Bolt! Let's keep going.");
 assert.equal(homeGuideLine({guardian:'Mossback Warden'}).pose,'point');assert.equal(homeGuideLine({nextArea:1,nextAreaTitle:'Skyreach'}).pose,'cheer');assert.equal(homeGuideLine({completed:true}).pose,'cheer');
 assert.match(homeGuideMarkup({nickname:'<b>'}),/&lt;b&gt;/,'names are escaped');});
test('Mr. Saymaz hosts the controls tutorial and the danger lessons',()=>{
 assert.match(tutorialMarkup(0),/guide-host.*saymaz-full/s);assert.match(tutorialMarkup(2),/saymaz-point/);assert.match(tutorialMarkup(4),/saymaz-cheer/);
 assert.match(lessonMarkup(lessonPlan('roots',{lane:1,attack:{lane:1}})),/guide-host.*saymaz-point.*Roots!/s);});
test('a cameo pops in with a line and is rate-limited',()=>{const made=[];const doc={createElement:()=>{const e={setAttribute(){},className:'',innerHTML:'',isConnected:true};made.push(e);return e;},body:{appendChild(){}}};
 assert.ok(guideCameo('Well done!',{doc,now:10_000}));assert.match(made[0].innerHTML,/Well done!/);assert.equal(made[0].className,'show');assert.equal(guideCameo('Again',{doc,now:10_500}),false);});
