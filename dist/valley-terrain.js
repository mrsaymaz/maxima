import{stretchZ}from'./runner-mode.js';
import * as T from './vendor/three.module.min.js';
import{ARENA_LOOKS}from'./arena-palette.js';
import {chapterPath,START,END} from './trail-layout.js';
import {composedHalfWidth} from './expedition-composition.js';

// Scenic ground only. Navigation, raised path supports and collision stay in
// their existing systems. The extra flat apron also protects the interior of
// each triangle, rather than protecting just its sampled corner vertices.
export const TERRAIN_BOUNDS=Object.freeze({minX:-60,maxX:60,minZ:stretchZ(-700),maxZ:30});
const FLOOR=-.015,CHUNKS=12,X_CELLS=60,Z_CELLS=30,CELL_APRON=3.1;
const CHUNK_LENGTH=(TERRAIN_BOUNDS.maxZ-TERRAIN_BOUNDS.minZ)/CHUNKS;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
const mix=(a,b,t)=>a+(b-a)*t;
const segments=[];
function addPath(points){for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b.x-a.x,dz=b.z-a.z;segments.push({x:a.x,z:a.z,dx,dz,length2:dx*dx+dz*dz,minZ:Math.min(a.z,b.z),maxZ:Math.max(a.z,b.z)});}}
for(let chapter=0;chapter<5;chapter++)for(const side of ['left','right'])addPath(chapterPath(chapter,side));
addPath([{x:0,z:12},START,chapterPath(0,'left')[0]]);
addPath([chapterPath(4,'left').at(-1),END,{x:0,z:END.z-6}]);
export function routeDistance(x,z){let best=Infinity;for(const s of segments){if(z<s.minZ-best||z>s.maxZ+best)continue;const t=clamp(((x-s.x)*s.dx+(z-s.z)*s.dz)/s.length2);best=Math.min(best,Math.hypot(x-s.x-s.dx*t,z-s.z-s.dz*t));}return best;}
function hash(x,z,seed){let h=Math.imul(x|0,374761393)^Math.imul(z|0,668265263)^Math.imul(seed,1442695041);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967295;}
function noise(x,z,scale,seed){x/=scale;z/=scale;const ix=Math.floor(x),iz=Math.floor(z),u=smooth(x-ix),v=smooth(z-iz);return mix(mix(hash(ix,iz,seed),hash(ix+1,iz,seed),u),mix(hash(ix,iz+1,seed),hash(ix+1,iz+1,seed),u),v);}
function relief(x,z,area){
 const broad=noise(x,z,35,31+area*17),small=noise(x+13,z-7,12,63+area*11),warp=noise(x,z,48,101+area*13);
 if(area===1){
  // Eroded limestone shelves around a low, wandering drainage channel.
  const channelX=34+(noise(0,z,49,207)-.5)*15;
  const drainage=1-smooth((Math.abs(Math.abs(x)-channelX)-1.2)/5.3);
  const level=1.4+broad*5.8+small*.8,terrace=level+Math.sin(level/1.35*Math.PI*2)*.12;
  return mix(terrace,-.75-small*.28,drainage);
 }
 if(area===2){
  // Broad, stepped volcanic shoulders, with low broken seams between them.
  const level=1.3+broad*8.6+small*.7,step=1.75;
  const terrace=level+Math.sin(level/step*Math.PI*2)*.16;
  const seamX=-35+(warp-.5)*18,seam=1-smooth((Math.abs(x-seamX)-1.0)/3.8);
  return mix(terrace,-.9-small*.25,seam);
 }
 // Woodland banks are rounded and irregular rather than a row of wave ridges.
 const channelX=30+(noise(0,z,57,318)-.5)*13;
 const drainage=1-smooth((Math.abs(x-channelX)-.8)/4.5);
 return mix(.7+broad*4.8+small*1.4+warp*.8,-.45-small*.25,drainage);
}
export function terrainHeight(x,z,area=0){
 area=clamp(area|0,0,2);
 const clearance=routeDistance(x,z)-(Math.max(composedHalfWidth(z),3.2)+.45);
 if(clearance<=CELL_APRON)return FLOOR;
 const shoulder=smooth((clearance-CELL_APRON)/6.5);
 return FLOOR+shoulder*relief(x,z,area);
}
const COLORS=ARENA_LOOKS.map(({terrain:t})=>[t.low,t.high,t.route].map(c=>new T.Color(c)));
export function terrainTint(x,z,y=terrainHeight(x,z),area=0){
 const palette=COLORS[area],color=palette[0].clone().lerp(palette[1],smooth((y-.3)/9)*.48).lerp(palette[2],(1-smooth((routeDistance(x,z)-5)/8))*.15);return color.multiplyScalar(.94+noise(x,z,15,409+area)*.10);
}
export function buildTerrainChunks(area=0){
 area=clamp(area|0,0,2);const result=[];
 for(let chunk=0;chunk<CHUNKS;chunk++){
  const minZ=TERRAIN_BOUNDS.minZ+chunk*CHUNK_LENGTH,maxZ=TERRAIN_BOUNDS.minZ+(chunk+1)*CHUNK_LENGTH;
  const p=[],c=[],indices=[],palette=COLORS[area],color=new T.Color();
  for(let iz=0;iz<=Z_CELLS;iz++)for(let ix=0;ix<=X_CELLS;ix++){
   // Round to the actual Float32 mesh coordinates before sampling. The public
   // height function and vertex height consequently agree at every vertex.
   const x=Math.fround(TERRAIN_BOUNDS.minX+ix*(TERRAIN_BOUNDS.maxX-TERRAIN_BOUNDS.minX)/X_CELLS),z=Math.fround(mix(minZ,maxZ,iz/Z_CELLS)),y=terrainHeight(x,z,area);
   p.push(x,y,z);
   color.copy(terrainTint(x,z,y,area));c.push(color.r,color.g,color.b);
  }
  for(let iz=0;iz<Z_CELLS;iz++)for(let ix=0;ix<X_CELLS;ix++){
   const a=iz*(X_CELLS+1)+ix,b=a+1,d=a+X_CELLS+1,e=d+1;
   // Alternating diagonals avoid a visible repeated directional crease.
   if((ix+iz)%2)indices.push(a,d,b,b,d,e);else indices.push(a,d,e,a,e,b);
  }
  const g=new T.BufferGeometry();g.name=`valley-terrain-${area}-${chunk}`;g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.setIndex(indices);
  // Sample the same continuous field on both sides of chunk boundaries.
  // Independent computeVertexNormals calls would leave a lighting seam.
  const normals=[];for(let i=0;i<p.length;i+=3){const x=p[i],z=p[i+2],dx=(terrainHeight(x+.35,z,area)-terrainHeight(x-.35,z,area))/.7,dz=(terrainHeight(x,z+.35,area)-terrainHeight(x,z-.35,area))/.7,length=Math.hypot(dx,1,dz);normals.push(-dx/length,1/length,-dz/length);}
  g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.computeBoundingBox();g.computeBoundingSphere();
  g.userData={area,chunk,minZ,maxZ,bounds:{minX:TERRAIN_BOUNDS.minX,maxX:TERRAIN_BOUNDS.maxX,minZ,maxZ},triangles:indices.length/3,nonBlocking:true,scenicOnly:true,flatHeight:FLOOR,protectedApron:CELL_APRON};result.push(g);
 }
 return result;
}
