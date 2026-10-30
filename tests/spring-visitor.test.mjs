import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.min.js';
import {makeSpringVisitor} from '../dist/spring-visitor.js';

function advance(v,seconds,options,step=1/60){for(let t=0;t<seconds;){const dt=Math.min(step,seconds-t);v.update(dt,options);t+=dt;}}
function pose(v){v.root.updateMatrixWorld(true);const result=[];v.root.traverse(o=>{result.push(o.visible,...o.position.toArray(),...o.quaternion.toArray(),...o.scale.toArray());});return result;}
function resources(v){const geometries=new Set(),materials=new Set();v.root.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);materials.add(o.material);}});return{geometries:[...geometries],materials:[...materials]};}

test('visitor progresses from hidden to curious, approaching, drinking and resting',()=>{
 const v=makeSpringVisitor();assert.equal(v.root.visible,false);v.update(0);assert.equal(v.state.phase,'hidden');v.update(.1,{restored:.45});assert.equal(v.state.phase,'curious');assert.equal(v.root.visible,true);v.update(0,{restored:1});assert.equal(v.state.phase,'approach');advance(v,1.7,{restored:1});assert.equal(v.state.phase,'drink');assert.ok(v.state.headPitch>0);advance(v,2.9,{restored:1});assert.equal(v.state.phase,'rest');assert.equal(v.root.userData.solids.length,0);
});

test('restored reload starts settled without replaying an entrance',()=>{
 const v=makeSpringVisitor(1);v.update(0,{restored:1});assert.equal(v.state.phase,'rest');assert.equal(v.state.positionX,.09);assert.equal(v.state.positionZ,-.09);assert.equal(v.state.transitions,1);assert.ok(v.state.headPitch<.1);advance(v,.7,{restored:1});assert.equal(v.state.phase,'rest');
});

test('nearby player receives a glance; threats withdraw the visitor and calm returns it',()=>{
 const v=makeSpringVisitor();v.update(0,{restored:1});v.update(.1,{restored:1,playerDistance:1});assert.equal(v.state.phase,'look');assert.ok(Math.abs(v.state.headYaw)>.3);v.update(.1,{restored:1,threat:true});assert.equal(v.state.phase,'withdraw');advance(v,1.2,{restored:1,threat:true});assert.equal(v.state.phase,'shelter');assert.ok(v.state.positionX<-.5);advance(v,1.2,{restored:1,threat:false});assert.equal(v.state.phase,'approach');
});

test('paused updates freeze geometry, visibility, clock and all state',()=>{
 const v=makeSpringVisitor();v.update(0,{restored:.5});v.update(.4,{restored:1});const beforePose=pose(v),beforeState={...v.state};for(let i=0;i<8;i++)v.update(2,{restored:0,active:false,reduced:true,threat:true});assert.deepEqual(pose(v),beforePose);assert.deepEqual(v.state,beforeState);
});

test('reduced motion adopts a stable grounded pose with no bob, stepping or ripples',()=>{
 const v=makeSpringVisitor();v.update(0,{restored:.5});v.update(.3,{restored:1});v.update(.1,{restored:1,reduced:true});assert.equal(v.state.phase,'rest');const before=pose(v);advance(v,12,{restored:1,reduced:true});assert.deepEqual(pose(v),before);for(const child of v.root.children)if(child.isMesh)assert.equal(child.visible,false);assert.equal(v.state.phaseTime,0);
});

test('state transitions and movement are deterministic across frame rates',()=>{
 const a=makeSpringVisitor(),b=makeSpringVisitor();for(const v of[a,b]){v.update(0,{restored:.5});v.update(0,{restored:1});}advance(a,9.7,{restored:1},1/120);advance(b,9.7,{restored:1},.37);assert.equal(a.state.phase,b.state.phase);assert.ok(Math.abs(a.state.phaseTime-b.state.phaseTime)<1e-9);assert.ok(Math.abs(a.state.positionX-b.state.positionX)<1e-9);assert.ok(Math.abs(a.state.positionZ-b.state.positionZ)<1e-9);
});

test('all palette and phase geometry remains finite, grounded and within its ledge bounds',()=>{
 const point=new T.Vector3();for(let area=0;area<3;area++){
  const v=makeSpringVisitor(area);v.update(0,{restored:.5});v.update(0,{restored:1});for(let i=0;i<700;i++){v.update(.035,{restored:1,playerDistance:i%200<80?1:20,threat:i>=300&&i<370});v.root.updateMatrixWorld(true);v.root.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position;for(let n=0;n<a.count;n++){point.fromBufferAttribute(a,n).applyMatrix4(o.matrixWorld);assert.ok([point.x,point.y,point.z].every(Number.isFinite));assert.ok(Math.abs(point.x)<=1.001&&Math.abs(point.z)<=1.001);assert.ok(point.y>=-.001&&point.y<=1.001);}});}
 }
});

test('updates reuse the same objects, geometries and materials and accept invalid time safely',()=>{
 const v=makeSpringVisitor(),before=resources(v),count=[];v.root.traverse(o=>count.push(o));v.update(0,{restored:1});for(let i=0;i<500;i++)v.update(i%3?1/60:NaN,{restored:1});assert.deepEqual(resources(v),before);const after=[];v.root.traverse(o=>after.push(o));assert.deepEqual(after,count);const t=v.state.elapsed;v.update(-1,{restored:1});assert.equal(v.state.elapsed,t);assert.ok(Number.isFinite(v.state.elapsed));
});
