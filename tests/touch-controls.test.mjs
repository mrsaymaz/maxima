import {test} from 'node:test';
import assert from 'node:assert/strict';
import {stickVector,bindStick} from '../dist/touch-stick.js';
import {TrailNavigator} from '../dist/trail-nav.js';
import {freshJourney,freshExpedition} from '../dist/expedition.js';
import {BodyMotion} from '../dist/body-motion.js';
import * as T from '../dist/vendor/three.module.min.js';
test('radial stick has neutral center, graduated speed and bounded diagonal output',()=>{
 assert.equal(stickVector(2,1).x,0);
 const slow=stickVector(14,0),fast=stickVector(28,0),diagonal=stickVector(90,90);
 assert.ok(slow.x>.4&&slow.x<.5);assert.equal(fast.x,1);
 assert.ok(Math.abs(Math.hypot(diagonal.x,diagonal.z)-1)<1e-9);
 assert.ok(Math.abs(Math.hypot(diagonal.px,diagonal.pz)-28)<1e-9);
});
test('secondary touch cannot steal or release stick; cancellation and backgrounding release it',()=>{
 const oldWindow=globalThis.window,oldDocument=globalThis.document;
 const win=new EventTarget(),doc=new EventTarget();globalThis.window=win;globalThis.document=doc;
 const pad=new EventTarget(),thumb={style:{}},states=[],captures=new Set();
 pad.getBoundingClientRect=()=>({left:0,top:0,width:88,height:88});pad.classList={add(){},remove(){}};
 pad.setPointerCapture=id=>captures.add(id);pad.hasPointerCapture=id=>captures.has(id);pad.releasePointerCapture=id=>captures.delete(id);
 const send=(type,id,x=72,y=44)=>{const e=new Event(type);Object.assign(e,{pointerId:id,clientX:x,clientY:y,button:0});pad.dispatchEvent(e);};
 try{const dispose=bindStick(pad,thumb,(x,z)=>states.push({x,z}));
 send('pointerdown',1);assert.equal(states.at(-1).x,1);send('pointerdown',2,16);send('pointermove',2,16);send('pointerup',2);assert.equal(states.at(-1).x,1);
 send('pointercancel',1);assert.deepEqual(states.at(-1),{x:0,z:0});send('pointerdown',3);doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));assert.deepEqual(states.at(-1),{x:0,z:0});assert.equal(captures.size,0);
 dispose();const n=states.length;send('pointerdown',4);assert.equal(states.length,n);
 }finally{globalThis.window=oldWindow;globalThis.document=oldDocument;}
});
test('actual navigator honors analog strength without diagonal speed boost and stops immediately',()=>{
 const run=input=>{const e=freshExpedition(freshJourney(),'g5u1',0),n=new TrailNavigator(e);const start={...n.player};n.step(.1,input);const distance=Math.hypot(n.player.x-start.x,n.player.z-start.z);const end={...n.player};n.step(.1);assert.deepEqual(n.player,end);return distance;};
 const full=run({x:0,z:-1}),half=run({x:0,z:-.5}),diagonal=run({x:.3,z:-.4});
 assert.ok(Math.abs(full-.26)<1e-8);assert.ok(Math.abs(half/full-.5)<1e-8);assert.ok(Math.abs(diagonal-half)<1e-8);
});
test('turn lean stays bounded, preserves mesh proportions, and resets without accumulating',()=>{
 const root=new T.Group(),motion=new BodyMotion(root,.65);for(let i=0;i<120;i++){motion.reset();motion.update(1/60,{moving:true,heading:i*.05});assert.ok(Math.abs(root.rotation.z)<=.045);assert.deepEqual(root.scale.toArray(),[1,1,1]);}
 for(let i=0;i<120;i++){motion.reset();motion.update(1/60,{moving:false,heading:6});}assert.ok(Math.abs(root.rotation.z)<1e-7);motion.reset();assert.equal(root.rotation.z,0);
});
