import{RUNNER,TRAIL_STRETCH,stretchZ}from'../dist/runner-mode.js';
import{test}from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import * as T from'../dist/vendor/three.module.min.js';
import{EXPEDITION_SCENES,composedHalfWidth,routeHalfWidth,scenicRise,segmentRectDistance,expeditionTitle}from'../dist/expedition-composition.js';
import{makeExpeditionArt,updateExpeditionArt}from'../dist/expedition-art.js';import{makeCorridorEnclosure}from'../dist/corridor-geometry.js';
import{chapterPath,trailAllowed,pathDistance,approachPoint,activeNode}from'../dist/trail-layout.js';import{freshExpedition,freshJourney}from'../dist/expedition.js';
import{sectionFor,sectionsFor,localPoint,surfaceOnCourse,approachHeight}from'../dist/traversal-layout.js';import{makeTraversalScenery}from'../dist/traversal-props.js';import{TrailNavigator}from'../dist/trail-nav.js';import{TrailWorld}from'../dist/trail-world.js';
const eFor=(area=0,side='left',index=0)=>{const e=freshExpedition(freshJourney(),'g5u1',area);e.choices.fill(side);e.index=index;return e;};
const fields=()=>makeExpeditionArt();

test('the complete first-arena expedition has five unique focal scenes, four tree silhouettes, bounded batches and finite real geometry',()=>{
 const art=fields();assert.equal(art.children.length,5);assert.equal(new Set(EXPEDITION_SCENES.map(s=>s.id)).size,5);assert.ok(art.userData.stats.batches<=55);assert.ok(art.userData.stats.triangles<30000);
 const features=new Set();art.traverse(o=>{for(const f of o.userData.features||[])features.add(f);if(o.geometry)for(const attribute of Object.values(o.geometry.attributes))assert.ok(attribute.array.every(Number.isFinite));if(o.isInstancedMesh){assert.ok(o.instanceMatrix.array.every(Number.isFinite));assert.ok(o.count>0);}});
 for(const f of['spring-cascade','aqueduct-vault','broken-aqueduct-trough','split-oak-fork','quiet-crystal-seam','sanctuary-crown','broadleaf-cluster','umbrella-canopy','willow-hanging-leaves','snag-fork'])assert.ok(features.has(f),f);
 for(const p of art.userData.placements)if(p.solid&&p.min[1]<5.5)assert.ok(p.clearance>=4.4,p.feature);
 const a=fields();assert.deepEqual(a.userData,art.userData);for(let i=0;i<a.children.length;i++)for(let j=0;j<a.children[i].children.length;j++)assert.deepEqual(a.children[i].children[j].instanceMatrix.array,art.children[i].children[j].instanceMatrix.array);
});

test('solid landmark colliders leave both complete routes clear for cub and adult forms, including task approaches',()=>{
 const art=fields();for(const side of['left','right'])for(let chapter=0;chapter<5;chapter++){const e=eFor(0,side,chapter*4),course=sectionsFor(e);for(const section of course.filter(s=>s.chapter===chapter))for(let d=0;d<=section.length;d+=.3){const p=localPoint(section,d);for(const solid of art.userData.solids)assert.ok(Math.hypot(p.x-solid.x,p.z-solid.z)>solid.r+.78+.05,section.index+':'+solid.kind);}
  for(let n=0;n<4;n++){e.index=chapter*4+n;const p=approachPoint(activeNode(e));assert.ok(trailAllowed(e,p,.78));for(const solid of art.userData.solids)assert.ok(Math.hypot(p.x-solid.x,p.z-solid.z)>solid.r+.78);}}
});

test('narrow approaches open into wider quiet clearings while unfinished gates and rejected branches remain closed',()=>{
 // Classic coordinates, carried onto the runner trail by its warp.
 assert.ok(composedHalfWidth(stretchZ(-9))<3.0);assert.ok(composedHalfWidth(stretchZ(-19))>4.4);assert.equal(composedHalfWidth(stretchZ(-40)),3.2);assert.equal(composedHalfWidth(stretchZ(-664)),6);
 for(const side of['left','right'])for(let chapter=0;chapter<5;chapter++){const e=eFor(0,side,chapter*4),s=sectionFor(e,e.index),p=localPoint(s,9*TRAIL_STRETCH,3.0),other=chapterPath(chapter,side==='left'?'right':'left')[2];assert.ok(trailAllowed(e,p,.24));assert.equal(trailAllowed(e,other,.24),false);const n=activeNode(e);assert.equal(trailAllowed(e,{x:n.x,z:n.z-1},.24),false);}
 for(const area of[1,2])assert.equal(routeHalfWidth(eFor(area),{x:0,z:stretchZ(-19)}),3.2);const legacy={...eFor(),adventureVersion:1};assert.equal(routeHalfWidth(legacy,{x:0,z:stretchZ(-19)}),3.2);
});

test('[classic] gentle rises affect only the five opening coin stretches; every task, battle, trial and old layout keeps its surface contract',()=>{
 for(const area of[0,1,2])for(const mode of['relaxed','challenge'])for(let serial=1;serial<=6;serial++){const e=eFor(area);e.serial=serial;for(let index=0;index<20;index++){const s=sectionFor(e,index,mode);assert.equal(!!s.scenicRise,index%4===0);if(s.scenicRise){assert.equal(approachHeight(s,0),0);assert.equal(approachHeight(s,s.length),0);assert.ok(approachHeight(s,s.length/2)>.6);for(const coin of s.coins)assert.ok(Math.abs(coin.y-(.58+scenicRise(s,coin.s)))<1e-8);}else assert.ok(!s.scenicRise);}}
 for(const area of[1,2]){const saved=eFor(area);delete saved.terrainVersion;for(let i=0;i<20;i++)assert.equal(sectionFor(saved,i).scenicRise,null);}
 const old=eFor();old.adventureVersion=1;for(let i=0;i<20;i++)assert.equal(sectionFor(old,i).scenicRise,null);
});

test('[classic] the actual raised geometry matches navigable support and keeps coins at the correct relative height in both branches',()=>{
 for(const side of['left','right'])for(let chapter=0;chapter<5;chapter++){const e=eFor(0,side,chapter*4),s=sectionFor(e,e.index),scene=makeTraversalScenery(s);scene.updateMatrixWorld(true);for(let d=s.scenicRise.from+.1;d<s.scenicRise.to-.1;d+=.6){const p=localPoint(s,d,.25),y=surfaceOnCourse([s],p),ray=new T.Raycaster(new T.Vector3(p.x,5,p.z),new T.Vector3(0,-1,0)),hit=ray.intersectObject(scene.getObjectByName('fixed-scenery'),true)[0];assert.ok(hit);assert.ok(Math.abs(hit.point.y-y-.033)<.008,'visual support differs at '+chapter+':'+d);}}
});

test('[classic] cub and adult walk over every composed rise without forced jumps, safe retries return supported positions, and reload preserves task data',()=>{
 for(const side of['left','right'])for(let chapter=0;chapter<5;chapter++)for(const level of[0,10]){const e=eFor(0,side,chapter*4);e.active={sentinel:'accepted work'};const nav=new TrailNavigator(e);nav.enableTraversal();nav.setLevel(level);const s=nav.section;nav.player=localPoint(s,1.0);nav.cancelJump();for(let n=0;n<Math.ceil((s.length-2)/2.6/.016);n++){nav.step(.016,s.forward);assert.equal(nav.grounded,true);assert.equal(nav.jumpStage,'ground');assert.equal(nav.recovery,0);}assert.ok(Math.hypot(nav.player.x-s.start.x,nav.player.z-s.start.z)>s.length-3);nav.retry('fall');assert.ok(nav.retrySafe(nav.player));assert.equal(nav.y,nav.support());assert.deepEqual(e.active,{sentinel:'accepted work'});const restored=new TrailNavigator(JSON.parse(JSON.stringify(e)));restored.enableTraversal();restored.restore(nav.player);assert.equal(restored.y,restored.support());assert.deepEqual(restored.state.active,e.active);}
});

test('composed and legacy enclosures are independent, retain branch walls and reduce repetitive rim planting',()=>{
 const base=makeCorridorEnclosure(),composed=makeCorridorEnclosure({composed:true}),again=makeCorridorEnclosure({composed:true});assert.equal(base.userData.composed,false);assert.equal(composed.userData.composed,true);assert.deepEqual(composed.userData,again.userData);const count=(g,prefix)=>g.children.filter(m=>m.name.startsWith(prefix)).reduce((n,m)=>n+(m.count||1),0);assert.ok(count(composed,'rim-tree-crowns')<count(base,'rim-tree-crowns')*.4);assert.ok(count(composed,'rim-bushes')<count(base,'rim-bushes')*.5);for(const mesh of composed.children){assert.ok(mesh.geometry.attributes.position.array.every(Number.isFinite));if(mesh.isInstancedMesh)assert.ok(mesh.instanceMatrix.array.every(Number.isFinite));}
 for(const side of['left','right']){const e=eFor(0,side),nav=new TrailNavigator(e);nav.enableTraversal();nav.solids=composed.userData.solids.map(s=>({...s,top:s.maxY}));const s=nav.section;for(let d=1;d<s.length-1;d+=.4){const p=localPoint(s,d);assert.ok(nav.clear(p.x,p.z,nav.support(p)),side+': blocked centre approach');}}
});

test('Low retains major landmarks and a clear silhouette while range culling/detail updates reuse resources and avoid new HUD panels',()=>{
 const art=fields(),resources=[];art.traverse(o=>{if(o.geometry)resources.push([o,o.geometry,o.material,o.instanceMatrix?.array]);});for(const scene of EXPEDITION_SCENES){updateExpeditionArt(art,{player:{x:0,z:scene.focus.z},time:2,low:true,strength:1});const group=art.children[scene.chapter];assert.ok(group.visible);assert.ok(group.children.some(m=>!m.userData.detail&&m.visible));assert.ok(group.children.filter(m=>m.userData.detail).every(m=>!m.visible));}
 for(let i=0;i<240;i++)updateExpeditionArt(art,{player:{x:0,z:-i*2},time:i/60});for(const[o,g,m,a]of resources){assert.equal(o.geometry,g);assert.equal(o.material,m);assert.equal(o.instanceMatrix?.array,a);}assert.notEqual(expeditionTitle(0,0,''),expeditionTitle(0,1,''));assert.equal(expeditionTitle(1,0,'Original'), 'Original');
 const world=Object.create(TrailWorld.prototype);Object.assign(world,{area:0,crowns:new T.Group(),treeTrunks:new T.Group(),baseStones:new T.Group(),legacyVerge:[new T.Group()],dressing:new T.Group(),edgeGrassMesh:new T.Group()});world.setSceneDetail({preset:'high'});assert.equal(world.crowns.visible,false);assert.equal(world.dressing.visible,true);world.area=1;world.setSceneDetail({preset:'high'});assert.equal(world.crowns.visible,true);assert.equal(world.dressing.visible,true);
});

test('rectangle clearance calculation detects a route through a box interior rather than checking only corners',()=>{const box={min:{x:-1,z:-1},max:{x:1,z:1}};assert.equal(segmentRectDistance({x:-4,z:0},{x:4,z:0},box),0);assert.equal(segmentRectDistance({x:-4,z:4},{x:4,z:4},box),3);});

test('[classic] authored reveal sightlines reach the focal landmark through the real cliff meshes from either branch',()=>{
 const cliffs=makeCorridorEnclosure({composed:true});cliffs.updateMatrixWorld(true);for(const scene of EXPEDITION_SCENES)for(const side of[-1,1]){const eye=new T.Vector3(side*9,3.1,scene.focus.z+48),target=new T.Vector3(scene.focus.x,scene.focus.y,scene.focus.z),delta=target.clone().sub(eye),ray=new T.Raycaster(eye,delta.clone().normalize(),0,delta.length());assert.equal(ray.intersectObject(cliffs,true).length,0,scene.id+': ridge blocks the reveal');}
});

test('the actual world retains its first-arena landmarks and enables enriched terrain and scenery in every arena',()=>{
 const world=Object.create(TrailWorld.prototype),e=eFor();Object.assign(world,{nav:new TrailNavigator(e),land:new T.Group(),scene:new T.Scene(),rival:new T.Group()});world.scene.background=new T.Color();world.scene.fog=new T.Fog('#ffffff',40,125);world.makeLand();world.makeAreaDetails();world.setArea(0);assert.equal(world.expeditionArt.visible,true);assert.equal(world.enclosure.userData.composed,true);assert.equal(world.arenaArtGroups[0].visible,false);assert.equal(world.crowns.visible,false);assert.equal(world.legacyLandscape[0].visible,false);world.setArea(1);assert.equal(world.expeditionArt.visible,false);assert.equal(world.enclosure.userData.composed,false);assert.equal(world.arenaArtGroups[1].visible,true);assert.equal(world.crowns.visible,false);assert.equal(world.legacyLandscape[0].visible,false);assert.equal(world.environmentField.userData.area,1);assert.equal(world.groundBase.visible,false);world.setArea(0);assert.equal(world.enclosure.userData.composed,true);assert.equal(world.expeditionArt.visible,true);
});
