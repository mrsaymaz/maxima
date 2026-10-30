import{test}from'node:test';import assert from'node:assert/strict';
import{terrainHeight,buildTerrainChunks,TERRAIN_BOUNDS}from'../dist/valley-terrain.js';
import{chapterPath,START,END,pathDistance}from'../dist/trail-layout.js';
import{composedHalfWidth}from'../dist/expedition-composition.js';
const paths=[];for(let chapter=0;chapter<5;chapter++)for(const side of['left','right'])paths.push(chapterPath(chapter,side));paths.push([{x:0,z:12},START,{x:0,z:2}],[{x:0,z:-658},END,{x:0,z:END.z-6}]);
const protectedPoint=p=>paths.some(path=>pathDistance(p,path)<=Math.max(composedHalfWidth(p.z),3.2)+.45);

test('terrain leaves both branches, all chapter forks and widened start/end courts below original supports',()=>{
 for(let area=0;area<3;area++)for(const path of paths)for(let i=1;i<path.length;i++){
  const a=path[i-1],b=path[i],length=Math.hypot(b.x-a.x,b.z-a.z),nx=-(b.z-a.z)/length,nz=(b.x-a.x)/length;
  for(let d=0;d<=length;d+=.9){const t=d/length,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;for(const side of[-1,0,1]){const r=Math.max(composedHalfWidth(z),3.2)+.45,p={x:x+nx*r*side,z:z+nz*r*side};if(protectedPoint(p))assert.equal(terrainHeight(p.x,p.z,area),-.015);}}
 }
});

test('indexed chunks are finite, deterministic, bounded and under the mobile terrain budget',()=>{
 for(let area=0;area<3;area++){
  const chunks=buildTerrainChunks(area);assert.equal(chunks.length,12);let triangles=0;
  for(const[gIndex,g]of chunks.entries()){
   const p=g.getAttribute('position'),n=g.getAttribute('normal'),c=g.getAttribute('color');assert.ok(g.index);assert.equal(n.count,p.count);assert.equal(c.count,p.count);assert.ok(g.boundingBox&&g.boundingSphere);assert.equal(g.userData.chunk,gIndex);assert.equal(g.userData.nonBlocking,true);assert.equal(g.userData.scenicOnly,true);assert.ok(g.userData.maxZ-g.userData.minZ>=55&&g.userData.maxZ-g.userData.minZ<=65);
   for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);assert.ok([x,y,z,n.getX(i),n.getY(i),n.getZ(i),c.getX(i),c.getY(i),c.getZ(i)].every(Number.isFinite));assert.ok(n.getY(i)>.02);assert.ok(Math.abs(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))-1)<1e-5);assert.ok(Math.abs(y-terrainHeight(x,z,area))<1e-6);assert.ok(y>=-1.5&&y<12);assert.ok(x>=TERRAIN_BOUNDS.minX&&x<=TERRAIN_BOUNDS.maxX);}
   if(gIndex){const prior=chunks[gIndex-1],pn=prior.getAttribute('normal'),pp=prior.getAttribute('position');for(let ix=0;ix<=60;ix++){const pi=pp.count-61+ix;assert.equal(p.getZ(ix),pp.getZ(pi));assert.equal(n.getX(ix),pn.getX(pi));assert.equal(n.getY(ix),pn.getY(pi));assert.equal(n.getZ(ix),pn.getZ(pi));}}
   triangles+=g.index.count/3;
  }
  assert.ok(triangles<=60000);assert.equal(chunks[0].boundingBox.min.z,-700);assert.equal(chunks.at(-1).boundingBox.max.z,30);assert.deepEqual(chunks[3].getAttribute('position').array,buildTerrainChunks(area)[3].getAttribute('position').array);
 }
});

test('the actual triangle interiors stay flat anywhere they cover playable routes',()=>{
 for(let area=0;area<3;area++)for(const g of buildTerrainChunks(area)){
  const p=g.getAttribute('position'),indices=g.index.array;
  for(let i=0;i<indices.length;i+=3){const ids=[indices[i],indices[i+1],indices[i+2]];for(const weights of[[1/3,1/3,1/3],[.5,.5,0],[.5,0,.5],[0,.5,.5]]){
   let x=0,y=0,z=0;ids.forEach((id,k)=>{x+=p.getX(id)*weights[k];y+=p.getY(id)*weights[k];z+=p.getZ(id)*weights[k];});if(protectedPoint({x,z}))assert.ok(y<=-.01499,`route intrusion at ${area}: ${x},${z}: ${y}`);
  }}
 }
});

test('off-path terrain has broad relief, recessed drainage and distinctive arena silhouettes',()=>{
 const samples=[[],[],[]];for(let area=0;area<3;area++)for(let x=-58;x<=58;x+=2)for(let z=-690;z<=20;z+=5)if(!protectedPoint({x,z}))samples[area].push(terrainHeight(x,z,area));
 for(const values of samples){assert.ok(Math.max(...values)>4);assert.ok(Math.min(...values)<-.2);assert.ok(values.filter(y=>y>1).length>values.length*.35);}
 for(let a=0;a<3;a++)for(let b=a+1;b<3;b++){const mean=samples[a].reduce((sum,y,i)=>sum+Math.abs(y-samples[b][i]),0)/samples[a].length;assert.ok(mean>.55);}
 assert.equal(terrainHeight(44,-337,1),terrainHeight(44,-337,1));
});
