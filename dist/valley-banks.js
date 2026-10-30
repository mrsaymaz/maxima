import * as T from './vendor/three.module.min.js';
import{chunkOf,noise3}from'./cliff-art.js';
import{pathDetailHeight}from'./path-detail.js';
import{surfaceMaterial}from'./surface-materials.js';

// Cross sections sit outside the playable path union. Heights are geometry,
// not a painted bevel; the existing enclosure remains the collision boundary.
export function bankSection(p,normal,depth=1){
 const patch=noise3(p.x*.33,0,p.z*.17),foot=pathDetailHeight(p.x-normal.x*.55,p.z-normal.z*.55);
 const span=Math.min(1.05,Math.max(.03,depth));
 return [[-.12,0],[span*.23,.14+patch*.12],[span*.61,.32+patch*.28],[span,.10]].map(([d,y])=>({x:p.x+normal.x*d,y:foot+y-.012,z:p.z+normal.z*d}));
}

export function buildValleyBanks(strips){
 const batches=new Map(),materials={earth:surfaceMaterial('soil','#8c8063',{vertexColors:true,roughness:1,side:T.DoubleSide}),moss:surfaceMaterial('foliage','#708451',{vertexColors:true,roughness:1,side:T.DoubleSide})};
 let triangles=0;
 for(const s of strips){
  // A thin central ridge must retain its width. Never bridge across to another path.
  const a=bankSection(s.a,s.an,s.aw),b=bankSection(s.b,s.bn,s.bw);
  for(let lane=0;lane<3;lane++){
   const kind=lane===1?'moss':'earth',points=[a[lane],b[lane],b[lane+1],a[lane],b[lane+1],a[lane+1]],key=kind+':'+chunkOf((s.a.z+s.b.z)/2);
   if(!batches.has(key))batches.set(key,{p:[],c:[],kind});const batch=batches.get(key);
   for(const p of points){batch.p.push(p.x,p.y,p.z);const shade=.79+noise3(p.x*.7,1,p.z*.7)*.23;batch.c.push(shade,shade,shade*.94);}triangles+=2;
  }
 }
 const meshes=[];
 for(const[key,b]of batches){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(b.p,3));g.setAttribute('color',new T.Float32BufferAttribute(b.c,3));g.computeVertexNormals();g.computeBoundingSphere();const mesh=new T.Mesh(g,materials[b.kind]);mesh.name='valley-bank-'+key;mesh.receiveShadow=true;mesh.castShadow=false;meshes.push(mesh);}
 return{meshes,triangles};
}
