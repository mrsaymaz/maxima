import{test}from'node:test';import assert from'node:assert/strict';import * as T from'../dist/vendor/three.module.min.js';
import{makeCorridorEnclosure}from'../dist/corridor-geometry.js';import{bankSection}from'../dist/valley-banks.js';
import{freshJourney,freshExpedition,chooseBranch}from'../dist/expedition.js';import{TrailNavigator}from'../dist/trail-nav.js';
import{sectionFor,localPoint,surfaceOnCourse}from'../dist/traversal-layout.js';import{composedHalfWidth,scenicSurface}from'../dist/expedition-composition.js';
import{makeTraversalScenery}from'../dist/traversal-props.js';import{groundMaterial}from'../dist/world-style.js';
import{CreatureCamera,framesBoxes}from'../dist/camera-rig.js';import{castTrailCamera}from'../dist/trail-camera-collision.js';
import{TrailWorld}from'../dist/trail-world.js';import{FrameMetrics}from'../dist/render-quality.js';
const state=()=>{const e=freshExpedition(freshJourney(),'g5u1',0);chooseBranch(e,'left');return e;};
test('moving jump keeps horizontal travel through anticipation and still launches/lands safely',()=>{
 const e=state(),n=new TrailNavigator(e);n.player={x:0,z:2};n.cancelJump();const z=n.player.z;assert.equal(n.requestJump(),true);n.step(.06,{x:0,z:-1});assert.equal(n.jumpStage,'anticipation');assert.ok(z-n.player.z>.15);n.step(.08,{x:0,z:-1});assert.equal(n.jumpStage,'air');assert.ok(n.y>0);for(let i=0;i<70;i++)n.step(.016);assert.equal(n.grounded,true);assert.equal(n.jumpStage,'ground');assert.equal(n.recovery,0);
});
test('held combat touch direction survives a focus switch, then re-anchors after releasing the stick',()=>{
 const n=new TrailNavigator(state()),r={active:true,x:0,z:-3};n.player={x:0,z:0};n.combat={blocking:r};const w=Object.create(TrailWorld.prototype);Object.assign(w,{nav:n,input:{x:0,z:-1},keys:new Set(),viewRig:new CreatureCamera()});const first=w.movementInput(.016).input;r.x=3;r.z=0;const second=w.movementInput(.016).input;assert.deepEqual(first,second);w.input={x:0,z:0};w.movementInput(.016);w.input={x:0,z:-1};const third=w.movementInput(.016).input;assert.ok(third.x>.99);assert.ok(Math.abs(third.z)<.01);
});
test('moving anticipation preserves launch height when crossing a raised ledge lip',()=>{
 const n=new TrailNavigator(state());n.player={x:0,z:.12};n.support=(p=n.player)=>p.z>0?1:0;n.cancelJump();assert.equal(n.y,1);n.requestJump();n.step(.08,{x:0,z:-1});assert.ok(n.player.z<0);assert.equal(n.y,1);n.step(.05,{x:0,z:-1});assert.equal(n.jumpStage,'air');assert.ok(n.y>1);assert.ok(n.vy>0);
});
test('quiet crowned terrain matches support across both shoulders and every chapter without moving tasks/hazards',()=>{
 for(const side of['left','right'])for(let chapter=0;chapter<5;chapter++){const e=state();e.choices.fill(side);e.index=chapter*4;const s=sectionFor(e,e.index),scene=makeTraversalScenery(s);scene.updateMatrixWorld(true);const fixed=scene.getObjectByName('fixed-scenery');
  for(const distance of[3,7,11]){if(distance>=s.length-1)continue;const width=composedHalfWidth(localPoint(s,distance).z);for(const lateral of[-.8*width,0,.8*width]){const p=localPoint(s,distance,lateral),support=surfaceOnCourse([s],p),ray=new T.Raycaster(new T.Vector3(p.x,5,p.z),new T.Vector3(0,-1,0)),hit=ray.intersectObject(fixed,true)[0];assert.ok(hit);assert.ok(Math.abs(hit.point.y-support-.033)<.012);assert.ok(Math.abs(support-scenicSurface(s,distance,lateral))<1e-8);}}
  assert.equal(scenicSurface(s,0,2),0);assert.equal(scenicSurface(s,s.length,2),0);
 }
});
test('bank geometry follows the composed enclosure, retains finite chunked depth on Low and adds no collider or shadow pass',()=>{
 const a=makeCorridorEnclosure({composed:true}),b=makeCorridorEnclosure();const banks=a.children.filter(m=>m.name.startsWith('valley-bank-'));assert.ok(banks.length>=20&&banks.length<=26);assert.ok(a.userData.bankTriangles>10000);assert.ok(!b.children.some(m=>m.name.startsWith('valley-bank-')));
 for(const m of banks){assert.equal(m.castShadow,false);assert.equal(m.receiveShadow,true);assert.ok(m.geometry.attributes.position.array.every(Number.isFinite));assert.equal(m.userData.solids,undefined);}
 for(const depth of[.03,.3,1.65]){const row=bankSection({x:5,z:-20},{x:1,z:0},depth);assert.equal(row.length,4);assert.ok(row[2].y>row[0].y+.3);assert.ok(row.at(-1).x<=6.05);}
});
test('ground blend uses separate composed and legacy route masks without replacing the material or textures',()=>{
 const m=groundMaterial('#87a96d','#cfbf92'),u=m.userData.ground;assert.equal(u.uComposition.value,0);const old=u.uMask.value,newMask=u.uComposedMask.value;assert.notDeepEqual(old.image.data,newMask.image.data);u.uComposition.value=1;assert.equal(u.uMask.value,old);assert.equal(u.uComposedMask.value,newMask);const shader={uniforms:{},vertexShader:'#include <common>\n#include <fog_vertex>',fragmentShader:'#include <common>\n#include <map_fragment>'};m.onBeforeCompile(shader);assert.ok(shader.fragmentShader.includes('uniform sampler2D uComposedMask;'));assert.ok(shader.fragmentShader.includes('uComposition );'));assert.ok(!shader.fragmentShader.includes('\\n'));
});
test('camera sweep respects rising support and solids while clear sightlines retain their length',()=>{
 const nav={solids:[],support:p=>p.z<0?1:0},a={x:0,y:1.5,z:1},b={x:0,y:.5,z:-2},hit=castTrailCamera(nav,a,b);assert.ok(hit.fraction<1);assert.ok(hit.y>=nav.support(hit)+.1);const free=castTrailCamera(nav,a,{...b,y:2});assert.equal(free.fraction,1);nav.solids=[{x:0,z:0,r:.4,top:4}];assert.ok(castTrailCamera(nav,a,{...b,y:2}).fraction<.3);
});
test('portrait exploration framing includes wide adult bodies without requiring a combat target',()=>{
 const rig=new CreatureCamera(),player={x:0,z:0},bodyBounds={halfWidth:1.8,halfDepth:.7},pose=rig.sample({player,level:10,mobile:true,aspect:.46,bodyBounds,heading:Math.PI,cast:(a,b)=>({...b,fraction:1})});const box={min:{x:-1.8,y:0,z:-.7},max:{x:1.8,y:2.18,z:.7}};assert.equal(framesBoxes(pose.position,pose.target,[box],pose.fov,.46),true);
});
test('session metrics retain expensive encounter peaks after recent frames have rolled out',()=>{
 const m=new FrameMetrics(3);m.sample(40,{calls:190,triangles:100000});for(let i=0;i<10;i++)m.sample(16.7,{calls:35,triangles:8000});assert.equal(m.snapshot().drawCalls,35);assert.equal(m.session().peakDrawCalls,190);assert.equal(m.session().peakTriangles,100000);m.reset();assert.equal(m.session().frames,0);
});
