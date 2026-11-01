// Regressions from play-testing 0.55 (see docs/releases/RELEASE-v0.56.0.md).
import{test}from'node:test';import assert from'node:assert/strict';
import{freshJourney,freshExpedition,shuffleGates,autoBranch,STORE,EARLIER_STORES}from'../src/expedition.js';
import{makeEnvironmentField}from'../src/environment-field.js';
import{endPoint,chapterPath,activeNode,approachPoint}from'../src/trail-layout.js';
import{RunnerControl}from'../src/runner-control.js';
import{hurdleHeight}from'../src/runner-course.js';
import{FORM_HEIGHTS}from'../src/world-layout.js';
import{jumpTuning,JUMP_GRAVITY}from'../src/jump-tuning.js';
import{RUN_JUMP_BONUS}from'../src/trail-nav.js';
import{specialKey,specialReady}from'../src/specials-ui.js';
const six=()=>{const j=freshJourney(),e=freshExpedition(j,'g5u1',0);shuffleGates(j,e);return{j,e};};

test('a saved six-gate area builds its valley scenery (a reload no longer fails to open)',()=>{const{e}=six();e.choices=['left','right','left',null,null];e.index=3;assert.doesNotThrow(()=>makeEnvironmentField(e));e.index=6;assert.doesNotThrow(()=>makeEnvironmentField(e));});
test('the final chase runs along the third chapter\'s trail, not across the meadow inside its bend',()=>{for(const side of['left','right']){const{e}=six();e.choices=[side,side,side,null,null];e.index=6;const end=endPoint(e),path=chapterPath(2,side);assert.deepEqual(end,path[4]);
 const chase=new RunnerControl().finale(e,'relaxed');assert.ok(chase?.run?.finale);const seg={x:path[4].x-path[3].x,z:path[4].z-path[3].z},len=Math.hypot(seg.x,seg.z),dot=(chase.forward.x*seg.x+chase.forward.z*seg.z)/len;assert.ok(dot>.99,`the chase follows the trail (${dot.toFixed(3)})`);}});
test('on runs every Form clears its barriers with room to spare: no wind-up, and a little higher than other jumps',()=>{for(let level=0;level<=10;level++){const t=jumpTuning(level),rise=t.rise+RUN_JUMP_BONUS,v=Math.sqrt(2*JUMP_GRAVITY*rise),clear=hurdleHeight(FORM_HEIGHTS[level])-.06;
 // Time with the feet above the barrier's top: the window for a swipe to work.
 const disc=v*v-2*JUMP_GRAVITY*clear,window=2*Math.sqrt(disc)/JUMP_GRAVITY;assert.ok(rise-clear>.3,`Form ${level}: ${(rise-clear).toFixed(2)} m above the barrier`);assert.ok(window>.4,`Form ${level}: ${window.toFixed(2)} s over the barrier`);}});
test('the special bar is rebuilt only when specials are bought or used, so a press never lands on a replaced button',()=>{const b={phase:'windup',specials:['ice-spears','tidal-wave'],specialsUsed:[]};const k=specialKey(b);b.phase='strike';assert.equal(specialKey(b),k);b.phase='ward';assert.equal(specialKey(b),k);assert.equal(specialReady(b,'ice-spears'),false,'not during a ward');b.phase='recovery';assert.equal(specialReady(b,'ice-spears'),true);assert.equal(specialReady(b,'ice-spears',true),false,'not while another plays');b.specialsUsed.push('ice-spears');assert.notEqual(specialKey(b),k);});
test('solMaxima 0.56 keeps its saves in a new place, so earlier 20-gate saves are not loaded',()=>{if(process.env.MAXIMA_MODE!=='runner')return;assert.equal(STORE,'solmaxima.save.v1');assert.ok(EARLIER_STORES.includes('maxima.runner.prototype.v1'));assert.ok(!EARLIER_STORES.includes(STORE));});
