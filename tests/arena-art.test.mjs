import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.min.js';
import {makeArenaArt,updateArenaArt} from '../dist/arena-art.js';
import {chapterPath,pathDistance,END} from '../dist/trail-layout.js';

const paths=Array.from({length:5},(_,c)=>['left','right'].map(s=>chapterPath(c,s))).flat();
paths.push([{x:0,z:9},{x:0,z:2}],[{x:0,z:END.z+8},{...END}]);
const themes=['forest','skyreach','stormglass'];
const expectedLandmarks=['ancient-root-arch','wind-crown','shattered-storm-halo'];

function boundsFor(mesh,index){const matrix=new T.Matrix4();mesh.getMatrixAt(index,matrix);return mesh.geometry.boundingBox.clone().applyMatrix4(matrix);}
function rectangleSamples(box,path){const result=[];for(const x of[box.min.x,box.max.x])for(const z of[box.min.z,box.max.z])result.push({x,z});for(const p of path)result.push({x:Math.max(box.min.x,Math.min(box.max.x,p.x)),z:Math.max(box.min.z,Math.min(box.max.z,p.z))});return result;}

for(let area=0;area<3;area++){
 test(`arena${area}: actual geometry is finite, mobile batched and strictly off the corridor`,()=>{
  const group=makeArenaArt(area);assert.equal(group.userData.theme,themes[area]);assert.equal(group.userData.scenicOnly,true);assert.equal(group.userData.requiresColliders,false);assert.ok(group.children.length<=15);assert.equal(group.userData.stats.drawCalls,group.children.length);assert.ok(group.userData.stats.triangles<100000);assert.ok(group.userData.stats.instances>100);
  for(const mesh of group.children){
   assert.ok(mesh.isInstancedMesh);assert.ok(mesh.count>0);assert.ok(!Array.isArray(mesh.material));assert.equal(mesh.castShadow,false,'off-corridor scenery must not add shadow draw passes');
   if(mesh.material.transparent&&mesh.material.side===T.DoubleSide)assert.equal(mesh.material.forceSinglePass,true);
   for(const attribute of Object.values(mesh.geometry.attributes))for(const n of attribute.array)assert.ok(Number.isFinite(n));
   for(const n of mesh.instanceMatrix.array)assert.ok(Number.isFinite(n));
   for(let i=0;i<mesh.count;i++){
    const box=boundsFor(mesh,i);assert.ok(box.min.x>=19-1e-5||box.max.x<=-19+1e-5,`${mesh.name} intrudes across off-corridor x19`);
    // The complete transformed AABB lies beyond x19; every path is within x±11.
    // Check official path distances as well, including endpoint-adjacent samples.
    for(const path of paths){for(const p of rectangleSamples(box,path))assert.ok(pathDistance(p,path)>=5-1e-5,`${mesh.name} violates path clearance`);}
   }
  }
  assert.ok(group.userData.landmarks.length>=5);assert.ok(group.userData.landmarks.every(l=>l.kind===expectedLandmarks[area]));assert.ok(group.userData.landmarks.every(l=>l.height>=8));
 });
}

test('arenas have different silhouettes, vegetation, architecture and lighting rather than only recolors',()=>{
 const groups=[0,1,2].map(makeArenaArt),features=groups.map(g=>new Set(g.children.flatMap(m=>m.userData.features)));
 assert.ok(features[0].has('rounded-broadleaf-crown'));assert.ok(features[0].has('mushroom-cap'));assert.ok(features[0].has('woodland-waterfall'));
 assert.ok(features[1].has('connected-aqueduct-trough'));assert.ok(features[1].has('aqueduct-water-channel'));assert.ok(features[1].has('wind-ribbon'));assert.ok(features[1].has('silver-cypress'));
 assert.ok(features[2].has('basalt-organ-column'));assert.ok(features[2].has('angular-crystal-cluster'));assert.ok(features[2].has('shattered-storm-halo'));assert.ok(features[2].has('silver-storm-sedge'));
 assert.equal(new Set(groups.map(g=>g.userData.lighting.sky)).size,3);assert.equal(new Set(groups.map(g=>g.userData.lighting.sun)).size,3);
 for(const g of groups){for(const field of['sky','fog','hemisphereSky','hemisphereGround','sun'])assert.match(g.userData.lighting[field],/^#[0-9a-f]{6}$/i);assert.ok(g.userData.lighting.sunIntensity>0);assert.ok(g.userData.lighting.exposure>0);}
});

test('static batches reuse resources locally and repeated creation is deterministic and independent',()=>{
 for(let area=0;area<3;area++){
  const a=makeArenaArt(area),b=makeArenaArt(area);assert.deepEqual(a.userData,b.userData);assert.equal(a.children.length,b.children.length);
  assert.ok(new Set(a.children.map(m=>m.geometry)).size<a.children.length,'geometries should be shared across batches');assert.ok(new Set(a.children.map(m=>m.material)).size<a.children.length,'materials should be shared across compatible batches');
  a.children.forEach((mesh,i)=>{assert.deepEqual(mesh.instanceMatrix.array,b.children[i].instanceMatrix.array);assert.notEqual(mesh.geometry,b.children[i].geometry,'separate arenas must dispose independently');assert.notEqual(mesh.material,b.children[i].material);});
 }
});

test('atmosphere updates change only existing material/texture uniforms and preserve all geometry',()=>{
 for(let area=0;area<3;area++){
  const group=makeArenaArt(area),children=group.children.slice(),state=children.map(m=>({geometry:m.geometry,material:m.material,matrix:m.instanceMatrix.array,values:Array.from(m.instanceMatrix.array),map:m.material.map})),flow=children.find(m=>m.material.map)?.material;
  assert.ok(flow);const initial=flow.map.offset.y;
  for(let frame=0;frame<300;frame++)updateArenaArt(group,frame/60);
  assert.notEqual(flow.map.offset.y,initial);assert.equal(group.children.length,children.length);
  children.forEach((mesh,i)=>{assert.equal(group.children[i],mesh);assert.equal(mesh.geometry,state[i].geometry);assert.equal(mesh.material,state[i].material);assert.equal(mesh.material.map,state[i].map);assert.equal(mesh.instanceMatrix.array,state[i].matrix);assert.deepEqual(Array.from(mesh.instanceMatrix.array),state[i].values);});
  updateArenaArt(group,NaN);assert.ok(Number.isFinite(flow.map.offset.y));assert.doesNotThrow(()=>updateArenaArt(null,0));
 }
});

test('invalid arena identities fail explicitly',()=>{for(const value of[-1,3,.5,NaN,'1',null])assert.throws(()=>makeArenaArt(value),RangeError);});
