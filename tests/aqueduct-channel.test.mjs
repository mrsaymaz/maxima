import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.min.js';
import {makeAqueductChannel} from '../dist/aqueduct-channel.js';

const meshes=root=>{const list=[];root.traverse(o=>{if(o.isMesh)list.push(o);});return list;};
const snapshot=root=>{root.updateMatrixWorld(true);const result=[];root.traverse(o=>result.push([o.name,o.visible,...o.position.toArray(),...o.rotation.toArray().slice(0,3),...o.scale.toArray()]));return result;};

test('both aqueduct sizes keep finite grounded supported construction within their authored envelope',()=>{
 for(const compact of[true,false])for(let area=0;area<3;area++){
  const a=makeAqueductChannel({area,compact}),parts=a.root.getObjectByName('supported-channel-construction').userData.parts;
  for(let i=0;i<3;i++){assert.ok(parts.includes('grounded-pier-'+i));assert.ok(parts.includes('pier-footing-'+i));assert.ok(parts.includes('hinge-socket-'+i));}
  assert.ok(parts.includes('basin-pedestal'));assert.ok(parts.includes('spring-headwall'));assert.ok(parts.includes('inlet-sill'));
  const limits=compact?{x:2.2,y:2.5,zlo:-1.3,zhi:.7}:{x:3,y:3.6,zlo:-2,zhi:2};
  for(let n=0;n<=24;n++){
   a.update(n/24,n*.37);const b=new T.Box3().setFromObject(a.root);
   assert.ok(b.min.y>=-1e-6&&b.max.y<=limits.y);assert.ok(b.min.x>=-limits.x&&b.max.x<=limits.x);assert.ok(b.min.z>=limits.zlo&&b.max.z<=limits.zhi);
  }
  const list=meshes(a.root);assert.ok(list.length<=24,'rigid detail is batched');
  assert.equal(a.materials.length,6);assert.equal(a.root.userData.resourceCounts.materials,6);assert.ok(a.root.userData.resourceCounts.geometries<=18);
  let triangles=0;for(const o of list){const p=o.geometry.attributes.position;for(const attr of Object.values(o.geometry.attributes))for(const value of attr.array)assert.ok(Number.isFinite(value));triangles+=(o.geometry.index?.count||p.count)/3;}
  assert.ok(triangles<12000,'small vignette stays compact');
  assert.equal(a.state.anchors.visitor.y,0);assert.ok(a.state.anchors.basin.y>0);assert.equal(a.state.anchors.basin.x,1.8*(compact?1:1.28));
 }
});

test('each third aligns a real hinged trough and downstream water waits for every upstream alignment',()=>{
 const a=makeAqueductChannel({compact:true}),segments=[0,1,2].map(i=>a.root.getObjectByName('aligning-trough-'+i));
 const initial=segments.map(s=>s.rotation.z);assert.ok(initial.every(n=>Math.abs(n)>.2));
 const saved=[0,1/6,1/3,.5,2/3,5/6,1];
 for(const p of saved){
  a.update(p,3);for(let i=0;i<3;i++){
   const fraction=Math.max(0,Math.min(1,p*3-i)),complete=fraction===1;
   assert.equal(a.state.segments[i],fraction);assert.equal(a.state.aligned[i],complete);assert.equal(a.state.flow[i],complete&&a.state.aligned.slice(0,i).every(Boolean));
   assert.equal(a.root.getObjectByName('restored-flow-'+i).visible,a.state.flow[i]);
   assert.equal(a.root.getObjectByName('flow-highlight-'+i).visible,a.state.flow[i]);
   if(complete)assert.equal(segments[i].rotation.z,0);else assert.ok(Math.abs(segments[i].rotation.z)>0);
  }
  assert.equal(a.state.powered,p===1);assert.equal(a.root.getObjectByName('outlet-cascade').visible,p===1);assert.equal(a.root.getObjectByName('restored-basin-water').visible,p===1);
 }
 a.update(.5);assert.notEqual(segments[1].rotation.z,initial[1]);assert.equal(segments[2].rotation.z,initial[2]);
 a.update(1);assert.equal(a.state.sluice,1);assert.equal(a.state.restored,true);
});

test('aligned water surfaces connect continuously from source through troughs to the supported basin',()=>{
 const a=makeAqueductChannel({compact:true});a.update(1);a.root.updateMatrixWorld(true);
 const flow=[0,1,2].map(i=>new T.Box3().setFromObject(a.root.getObjectByName('restored-flow-'+i)));
 for(let i=0;i<2;i++){assert.ok(flow[i].intersectsBox(flow[i+1]));assert.ok(Math.abs(flow[i].max.y-flow[i+1].max.y)<1e-6);}
 const outlet=new T.Box3().setFromObject(a.root.getObjectByName('outlet-cascade')),basin=new T.Box3().setFromObject(a.root.getObjectByName('restored-basin-water'));
 assert.ok(flow[2].intersectsBox(outlet));assert.ok(outlet.intersectsBox(basin));
 // Source water sits in the one merged static water mesh and reaches trough0.
 const staticWater=a.root.getObjectByName('supported-channel-construction').children.find(o=>o.material.userData.environmentRole==='water');
 assert.ok(new T.Box3().setFromObject(staticWater).intersectsBox(flow[0]));
});

test('saved fractional state applies immediately, motion is deterministic, and updates reuse all resources',()=>{
 const a=makeAqueductChannel(),state=a.state,list=meshes(a.root),geometries=list.map(o=>o.geometry),arrays=list.map(o=>o.geometry.attributes.position.array),materials=list.map(o=>o.material);
 a.update(.5,7);const saved=snapshot(a.root);a.update(1,42);a.update(.5,7);assert.deepEqual(snapshot(a.root),saved);assert.equal(a.state,state);
 const fresh=makeAqueductChannel();fresh.update(.5,7);assert.deepEqual(snapshot(fresh.root),saved);
 for(let i=0;i<300;i++)a.update(i/299,i*.017,{reduced:i%2===0});
 assert.deepEqual(meshes(a.root),list);list.forEach((o,i)=>{assert.equal(o.geometry,geometries[i]);assert.equal(o.geometry.attributes.position.array,arrays[i]);assert.equal(o.material,materials[i]);});
 a.update(NaN,Infinity);assert.equal(a.state.progress,0);a.update(3);assert.equal(a.state.progress,1);a.update(-1);assert.equal(a.state.progress,0);
});

test('waterwheel is powered only on restoration, and reduced motion freezes wheel and flow ornaments',()=>{
 const a=makeAqueductChannel(),wheel=a.root.getObjectByName('powered-waterwheel');a.update(.99,6);assert.equal(wheel.rotation.z,0);
 a.update(1,6);assert.notEqual(wheel.rotation.z,0);a.update(1,8);assert.notEqual(wheel.rotation.z,-6*.92);
 a.update(1,1,{reduced:true});const still=snapshot(a.root);a.update(1,200,{reduced:true});assert.deepEqual(snapshot(a.root),still);assert.equal(wheel.rotation.z,0);assert.ok(a.state.flow.every(Boolean));
});
