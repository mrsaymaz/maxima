import{test}from'node:test';import assert from'node:assert/strict';import * as T from'../dist/vendor/three.module.min.js';
import{makePathDetail,configurePathDetail,updatePathDetail,pathDetailHeight,pathDetailPatch}from'../dist/path-detail.js';
import{TrailWorld}from'../dist/trail-world.js';import{TrailNavigator}from'../dist/trail-nav.js';import{freshExpedition,freshJourney}from'../dist/expedition.js';
import{sectionsFor,localPoint}from'../dist/traversal-layout.js';import{scenicRise}from'../dist/expedition-composition.js';

test('the real first-arena world shows path details on Balanced/High and keeps grounded relief on Low',()=>{
 const state=freshExpedition(freshJourney(),'g5u1',0),w=Object.create(TrailWorld.prototype);Object.assign(w,{nav:new TrailNavigator(state),land:new T.Group(),scene:new T.Scene(),rival:new T.Group()});w.scene.background=new T.Color();w.scene.fog=new T.Fog('#ffffff',40,125);w.makeLand();w.makeAreaDetails();w.setArea(0);const near=w.nearPathDetails,detail=near._pathDetail;
 for(const preset of['balanced','high']){w.setSceneDetail({preset});assert.equal(near.visible,true);assert.equal(detail.grass.visible,true);assert.ok(detail.grass.count>2000);assert.ok(detail.dressing.children.every(m=>m.visible));assert.ok(detail.relief.children.some(m=>m.name.startsWith('path-rootlets')));}
 w.setSceneDetail({preset:'low'});assert.equal(near.visible,true);assert.equal(detail.grass.visible,false);assert.ok(detail.dressing.children.filter(m=>m.name.startsWith('trail-pebbles')).every(m=>m.visible));assert.equal(detail.relief.visible,true);assert.ok(near.userData.pebbles>1500);w.setArea(1);assert.equal(near.visible,false);assert.equal(w.dressing.visible,true);w.setArea(0);assert.equal(near.visible,true);state.adventureVersion=1;w.setSceneDetail({preset:'balanced'});assert.equal(near.visible,false);assert.equal(w.dressing.visible,true);assert.equal(w.edgeGrassMesh.visible,true);
});

test('[classic] grass, flowers, ferns, pebbles, rootlets and edge stones follow the raised visual surface, with finite deterministic instance transforms',()=>{
 const a=makePathDetail(),b=makePathDetail(),matrix=new T.Matrix4();let raised=0,instances=0;
 const check=(mesh,kind)=>{for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);assert.ok(matrix.elements.every(Number.isFinite));const x=matrix.elements[12],z=matrix.elements[14],actual=matrix.elements[13],expected=pathDetailHeight(x,z);let offset=kind==='grass'?-.01:kind==='stone'?.008:0;if(kind==='pebble')offset=new T.Vector3().setFromMatrixColumn(matrix,0).length()/1.2*.15;assert.ok(Math.abs(actual-expected-offset)<1e-4,kind+': buried/floating detail');if(expected>.1)raised++;instances++;}};
 check(a._pathDetail.grass,'grass');for(const mesh of a._pathDetail.dressing.children)check(mesh,mesh.name.startsWith('trail-pebbles')?'pebble':'plant');for(const mesh of a._pathDetail.relief.children)check(mesh,mesh.name.startsWith('path-edge-stones')?'stone':'root');assert.ok(raised>100);assert.ok(instances>6000);const all=root=>{const list=[];root.traverse(o=>{if(o.isInstancedMesh)list.push(o);});return list;};const left=all(a),right=all(b);assert.equal(left.length,right.length);left.forEach((mesh,i)=>assert.deepEqual(mesh.instanceMatrix.array,right[i].instanceMatrix.array));
});

test('detail height follows each branch rise and returns to the original valley floor outside those sections',()=>{
 for(const side of['left','right']){const e=freshExpedition(freshJourney(),'g5u1',0);e.choices.fill(side);for(const s of sectionsFor(e).filter(s=>s.scenicRise)){for(const d of[2,5,8,11])if(d<s.scenicRise.to){const p=localPoint(s,d);assert.ok(Math.abs(pathDetailHeight(p.x,p.z)-(scenicRise(s,d)+.033))<1e-8);}const p=localPoint(s,s.length+3);assert.equal(pathDetailHeight(p.x,p.z),0);}}
 assert.equal(pathDetailHeight(30,-60),0);const patch=Array.from({length:80},(_,i)=>pathDetailPatch(-10,-30-i*.7));assert.ok(Math.min(...patch)<.2);assert.ok(Math.max(...patch)>.8);
});

test('graphics and encounter updates reuse all detail geometry/materials and calm grass without removing the static path relief',()=>{
 const root=makePathDetail(),resources=[];root.traverse(o=>{if(o.geometry)resources.push([o,o.geometry,o.material,o.instanceMatrix.array]);});for(let i=0;i<180;i++){configurePathDetail(root,{preset:['low','balanced','high'][i%3]});updatePathDetail(root,{time:i/60,strength:1,x:2,z:-40,radius:13});}for(const[o,g,m,a]of resources){assert.equal(o.geometry,g);assert.equal(o.material,m);assert.equal(o.instanceMatrix.array,a);}const u=root._pathDetail.grass.material.userData.sway;assert.equal(u.uQuietness.value,1);assert.equal(u.uQuietCenter.value.x,2);assert.equal(root._pathDetail.relief.visible,true);assert.equal(root.userData.nonBlocking,true);
});

test('[classic] foreground detail has no navigation/save mutation and remains batched with no added shadow passes',()=>{
 const root=makePathDetail();let batches=0;root.traverse(o=>{if(o.isMesh){batches++;assert.ok(o.isInstancedMesh);assert.equal(o.castShadow,false);assert.ok(!o.userData.solids);}});assert.ok(batches<=60);assert.ok(root.userData.roots>=50);assert.ok(root.userData.edgeStones>=250);assert.ok(!root.userData.solids);assert.ok(root._pathDetail.dressing.children.some(m=>m.name.startsWith('trail-ferns')));assert.ok(root._pathDetail.dressing.children.some(m=>m.name.startsWith('trail-flowers')));
});
