import{test}from'node:test';import assert from'node:assert/strict';import * as T from'../dist/vendor/three.module.min.js';
import{freshJourney,freshExpedition,validSave,freshSave,chooseBranch}from'../dist/expedition.js';
import{makeEnvironmentField,updateEnvironmentField,environmentClearance}from'../dist/environment-field.js';
import{composedHalfWidth,scenicSurface}from'../dist/expedition-composition.js';
import{TrailNavigator}from'../dist/trail-nav.js';import{sectionFor,localPoint,surfaceOnCourse}from'../dist/traversal-layout.js';import{makeTraversalScenery}from'../dist/traversal-props.js';
import{TrailWorld}from'../dist/trail-world.js';
const eFor=(area=0)=>freshExpedition(freshJourney(),'g5u1',area),fields=[0,1,2].map(a=>makeEnvironmentField(eFor(a)));

// Two five-tree stands per chapter replace uniform scatter; scene coverage and
// sightlines are checked separately in scenery-composition.test.mjs.
test('all arenas receive real terrain, varied rooted stands and readable path detail with bounded spatial batches',()=>{
 for(const root of fields){const s=root.userData.stats;assert.ok(s.trees>=50);assert.ok(s.ferns>=100);assert.ok(s.triangles<240000);assert.ok(s.batches<115);assert.equal(s.terrainTriangles,43200);const features=new Set(root.userData.placements.map(p=>p.feature));for(const f of['embedded-stone','verge-fronds','bank-outcrop','fallen-timber','weathered-shelf','channel-foundation','layered-canopy'])assert.ok(features.has(f),f);root.traverse(o=>{if(o.geometry)for(const a of Object.values(o.geometry.attributes))assert.ok(a.array.every(Number.isFinite));});}
});

test('solid new scenery lies outside the entire playable path union, including widened courts',()=>{
 for(const root of fields)for(const p of root.userData.placements.filter(p=>p.solid)){assert.ok(p.clearance-p.r>=Math.max(3.2,composedHalfWidth(p.z))+.299);assert.equal(environmentClearance(p.x,p.z),p.clearance);}
});

test('nearby ferns follow the raised trail and rooted assets meet actual terrain triangles',()=>{
 for(const root of fields){const area=root.userData.area,e=eFor(area),ray=new T.Raycaster(new T.Vector3(),new T.Vector3(0,-1,0),0,50);for(const p of root.userData.placements.filter(p=>p.kind==='trunk')){ray.ray.origin.set(p.x,30,p.z);const hit=ray.intersectObjects(root._environment.terrainMeshes,false)[0];assert.ok(hit);assert.ok(Math.abs(p.y-hit.point.y+.015)<1e-6);}
  for(const p of root.userData.placements.filter(p=>p.feature==='verge-fronds')){for(const side of ['left','right']){const s=sectionFor({...e,choices:Array(5).fill(side)},Math.max(0,Math.min(4,Math.floor(-p.z/132)))*4,'relaxed',side);const dx=p.x-s.start.x,dz=p.z-s.start.z,d=dx*s.forward.x+dz*s.forward.z,l=dx*s.right.x+dz*s.right.z;if(d>=0&&d<=s.length&&Math.abs(l)<composedHalfWidth(p.z)+.1)assert.ok(Math.abs(p.y-scenicSurface(s,d,l)-.035)<1e-6);}}
 }
});

test('Low retains terrain, canopy silhouettes, rocks and primary ferns while hiding optional detail',()=>{
 for(const root of fields){updateEnvironmentField(root,{player:{x:-9,z:-24},preset:'low',dt:.016});const active=root._environment.chunks.filter(g=>g.visible),meshes=active.flatMap(g=>g.children);assert.ok(active.length<=4);assert.ok(meshes.some(m=>m.userData.environmentRole==='fern'&&m.visible&&!m.userData.detail));assert.ok(meshes.some(m=>m.userData.environmentRole==='leaf'&&m.visible));assert.ok(meshes.filter(m=>m.userData.detail).every(m=>!m.visible));assert.ok(root.children.filter(m=>m.name.startsWith('sculpted-ground')).every(m=>m.visible));}
});

test('environmental wind and water preserve resources, pause, respect reduced motion and quiet near danger',()=>{
 const root=fields[0],s=root._environment,resources=[];root.traverse(o=>{if(o.geometry)resources.push([o,o.geometry,o.material]);});const start=s.clock;updateEnvironmentField(root,{dt:.05,player:{x:1,z:2},strength:1});assert.ok(s.clock>start);assert.equal(s.uniforms.uEnvironmentQuiet.value,1);const clock=s.clock;updateEnvironmentField(root,{dt:.1,active:false});assert.equal(s.clock,clock);updateEnvironmentField(root,{dt:.1,reduced:true});assert.equal(s.clock,clock);assert.equal(s.uniforms.uEnvironmentMotion.value,0);for(const[o,g,m]of resources){assert.equal(o.geometry,g);assert.equal(o.material,m);}const shader={uniforms:{},vertexShader:'#include <common>\n#include <begin_vertex>'};s.materials.leaf.onBeforeCompile(shader);assert.ok(shader.vertexShader.includes('environmentFlex'));assert.ok(shader.vertexShader.includes('uEnvironmentQuiet'));assert.ok(!shader.vertexShader.includes('\\n'));
});

test('restoration water follows saved chapter milestones and initializes correctly without replay or language XP',()=>{
 const e=eFor(),root=makeEnvironmentField(e),before=JSON.stringify(e),s=root._environment;assert.ok(s.chapters.every(c=>!c.spill.visible));const completed=Array.from({length:4},(_,index)=>({index}));for(let i=0;i<150;i++)updateEnvironmentField(root,{dt:.016,completed});assert.ok(s.chapters[0].fill>.99);assert.equal(s.chapters[0].spill.visible,true);assert.equal(s.chapters[1].spill.visible,false);assert.equal(JSON.stringify(e),before);const restored=makeEnvironmentField({...e,completed});assert.equal(restored._environment.chapters[0].fill,1);assert.equal(restored._environment.chapters[0].spill.visible,true);
});

test('new gentle rises in every arena agree with rendered geometry, navigation, coins and safe retries',()=>{
 for(let area=0;area<3;area++)for(const side of ['left','right'])for(let chapter=0;chapter<5;chapter++)for(const level of [0,10]){
  const e=eFor(area);e.choices.fill(side);e.index=chapter*4;const s=sectionFor(e,e.index),scene=makeTraversalScenery(s);scene.updateMatrixWorld(true);const nav=new TrailNavigator(e);nav.enableTraversal();nav.setLevel(level);nav.player=localPoint(s,1);nav.cancelJump();const fixed=scene.getObjectByName('fixed-scenery');
  for(let d=2;d<s.length-1;d+=2){const p=localPoint(s,d),ray=new T.Raycaster(new T.Vector3(p.x,5,p.z),new T.Vector3(0,-1,0));assert.ok(Math.abs(ray.intersectObject(fixed,true)[0].point.y-surfaceOnCourse([s],p)-.033)<.012);}
  for(let i=0;i<Math.ceil((s.length-2)/2.6/.016);i++){nav.step(.016,s.forward);assert.equal(nav.grounded,true);assert.equal(nav.recovery,0);}nav.retry('fall');assert.ok(nav.retrySafe(nav.player));assert.equal(nav.y,nav.support());
 }
});

test('older saved routes retain flat supports outside the first arena and all task records remain untouched',()=>{
 for(const area of [1,2]){const e=eFor(area);delete e.terrainVersion;e.choices.fill('left');e.active={sentinel:'accepted work'};const before=JSON.stringify(e);assert.equal(sectionFor(e,0).scenicRise,null);const art=makeEnvironmentField(e);assert.equal(art.userData.terrainVersion,0);assert.equal(JSON.stringify(e),before);}
});
