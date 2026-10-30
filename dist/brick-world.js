import * as T from './vendor/three.module.min.js';
import{BRICK_COLORS}from'./arena-palette.js';
import{routeDistance}from'./valley-terrain.js';
import{composedHalfWidth}from'./expedition-composition.js';

// Toy-brick world (prototype, Whisperwood). The natural scenery is rebuilt from real blocks: every ground, cliff,
// rock, ruin and tree surface is sampled into a grid of 2×2 bricks (1 m wide, 0.6 m tall), ground becomes stepped
// brick columns, objects become brick shells, and the trail is laid in flat tiles. Gameplay objects (gates,
// mechanisms, coins, platforms, story machines, water) keep their own geometry with the brick finish from
// brick-style.js, and navigation and collision are untouched: the bricks are only what you see.
export const CELL=1,LEVEL=.6;
const GRID={minX:-92,maxX:92,minZ:-716,maxZ:48},W=Math.round((GRID.maxX-GRID.minX)/CELL),D=Math.round((GRID.maxZ-GRID.minZ)/CELL);
const K_MIN=-4,K_MAX=60,LEVELS=K_MAX-K_MIN,BASE=-3,CHUNK=32,CLEAR_LEVELS=12;
const NONE=-1e9;

// Which scenery becomes bricks. Anything matching KEEP (and everything inside it) stays as it is.
const KEEP=/task|gate|mechanism|coin|rune|barrier|branch-closure|traversal|trial|stage|drive|bearing|bridge|platform|visitor|pebble-body|enemy|rival|guardian|chest|camp|beacon|orb|wheel|channel|flow|water|crafted|threat|charge|contact-shade|restor|story|basin|projectile|sign|lantern|banner|marker|hazard|thorn|boulder-lane|alcove|ledge|shelter|wind/i;
const DECOR=/pebble|flower|fern|grass|meadow|rootlet|edge-stone|fungus|dressing|petal|clover|tuft|reed|mushroom|leaf-litter|path-detail|near-path/i;
const GROUND=/sculpted-ground|cliff-wall|moss-cap|valley-bank|fixed-scenery|valley-ground|groundbase/i;
export function classify(tag,{inTerrain=false,instanced=false}={}){
 if(KEEP.test(tag))return null;
 if(GROUND.test(tag))return'ground';
 if(/rockTop|moss/i.test(tag))return'moss';
 if(/leaf|crown|bush|canopy|sphere|cone|foliage/i.test(tag))return'leaf';
 if(/bark|trunk|timber|wood|cylinder|log|stump/i.test(tag))return'wood';
 if(/rock|outcrop|cliff|hex/i.test(tag))return'rock';
 if(/stone|limestone|masonry|voussoir|arch|column|ruin|pillar|ring/i.test(tag))return'stone';
 if(DECOR.test(tag))return'decor';
 if(inTerrain)return instanced?'decor':'ground';
 return null;
}

const hash=(a,b,c=0)=>{let h=Math.imul(a|0,374761393)^Math.imul(b|0,668265263)^Math.imul(c|0,1442695041);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967295;};
function noise(x,z){const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz,s=t=>t*t*(3-2*t),u=s(fx),v=s(fz);const a=hash(ix,iz,7),b=hash(ix+1,iz,7),c=hash(ix,iz+1,7),d=hash(ix+1,iz+1,7);return(a*(1-u)+b*u)*(1-v)+(c*(1-u)+d*u)*v;}

export class BrickWorld{
 constructor(area=0){
  const b=BRICK_COLORS[area|0].bricks;this.colors=Object.fromEntries(Object.entries(b).map(([k,v])=>[k,new T.Color(v)]));
  this.top=new Float32Array(W*D).fill(NONE);this.levels=new Int16Array(W*D).fill(-32768);this.kind=new Uint8Array(W*D);this.voxels=new Map();
  this.group=new T.Group();this.group.name='brick-world';this.hidden=[];this.processed=new WeakSet();
 }
 index(i,j){return j*W+i;}
 cell(x,z){const i=Math.floor((x-GRID.minX)/CELL),j=Math.floor((z-GRID.minZ)/CELL);return i<0||j<0||i>=W||j>=D?-1:j*W+i;}
 key(i,j,k){return(j*W+i)*LEVELS+(k-K_MIN);}

 // Collect the scenery to convert: returns [{mesh,category}] and the meshes to hide.
 collect(scene,skip){
  const out=[],terrain=skip.terrain;
  const visit=(o,kept,inTerrain)=>{
   if(!o.visible||skip.roots.has(o))return;
   const tag=[o.name,...[].concat(o.material||[]).map(m=>m?.name||'')].join('|');
   if(!kept&&o.name&&KEEP.test(o.name))kept=true;
   inTerrain=inTerrain||o===terrain;
   if(o.isMesh&&!kept&&!o.isSkinnedMesh){
    const parentTag=o.parent?.name||'',category=classify(tag+'|'+parentTag,{inTerrain,instanced:!!o.isInstancedMesh});
    if(category&&!(category!=='decor'&&[].concat(o.material).some(m=>m?.transparent&&m.opacity<.95)))out.push({mesh:o,category});
   }
   for(const c of o.children)visit(c,kept,inTerrain);
  };
  visit(scene,false,false);return out;
 }

 sample(mesh,category){
  const g=mesh.geometry,pos=g.attributes.position;if(!pos)return;
  const idx=g.index,count=idx?idx.count:pos.count,matrices=[];
  if(mesh.isInstancedMesh){const m=new T.Matrix4();for(let n=0;n<mesh.count;n++){mesh.getMatrixAt(n,m);matrices.push(m.clone().premultiply(mesh.matrixWorld));}}
  else matrices.push(mesh.matrixWorld);
  const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),p=new T.Vector3();const ground=category==='ground';
  for(const matrix of matrices)for(let t=0;t+2<count;t+=3){
   a.fromBufferAttribute(pos,idx?idx.getX(t):t).applyMatrix4(matrix);b.fromBufferAttribute(pos,idx?idx.getX(t+1):t+1).applyMatrix4(matrix);c.fromBufferAttribute(pos,idx?idx.getX(t+2):t+2).applyMatrix4(matrix);
   const n=Math.max(1,Math.ceil(Math.max(a.distanceTo(b),b.distanceTo(c),c.distanceTo(a))/(CELL*.45)));
   for(let u=0;u<=n;u++)for(let v=0;v<=n-u;v++){
    p.copy(a).addScaledVector(b.clone().sub(a),u/n).addScaledVector(c.clone().sub(a),v/n);
    const id=this.cell(p.x,p.z);if(id<0)continue;
    if(ground){if(p.y>this.top[id])this.top[id]=p.y;continue;}
    const k=Math.floor(p.y/LEVEL);if(k<K_MIN||k>=K_MAX)continue;const key=id*LEVELS+(k-K_MIN);if(!this.voxels.has(key))this.voxels.set(key,category);
   }
  }
 }

 // Ground columns snap to whole bricks; the trail corridor is flattened into tiles and kept clear of blocks.
 settle(){
  for(let j=0;j<D;j++)for(let i=0;i<W;i++){
   const id=j*W+i,x=GRID.minX+(i+.5)*CELL,z=GRID.minZ+(j+.5)*CELL,half=Math.max(composedHalfWidth(z),3.2),d=routeDistance(x,z);
   if(d<half+.45){
    this.levels[id]=0;this.kind[id]=d<half-.7?1:2;
    for(let k=K_MIN;k<CLEAR_LEVELS;k++)this.voxels.delete(id*LEVELS+(k-K_MIN));
   }else if(this.top[id]>NONE)this.levels[id]=Math.max(BASE+1,Math.round(this.top[id]/LEVEL));
  }
  for(const key of this.voxels.keys()){const id=Math.floor(key/LEVELS),k=key%LEVELS+K_MIN;if(this.levels[id]>-32768&&k<this.levels[id])this.voxels.delete(key);}
 }

 // A few white brick clouds over the valley.
 clouds(){
  for(let c=0;c<22;c++){
   const cx=GRID.minX+20+hash(c,1)*(W*CELL-40),cz=GRID.minZ+20+hash(c,2)*(D*CELL-40),rx=4+hash(c,3)*6,rz=3+hash(c,4)*4,k=50+Math.floor(hash(c,5)*6);
   for(let dz=-rz;dz<=rz;dz++)for(let dx=-rx;dx<=rx;dx++){const e=(dx*dx)/(rx*rx)+(dz*dz)/(rz*rz);if(e>1)continue;const id=this.cell(cx+dx,cz+dz);if(id<0)continue;this.voxels.set(id*LEVELS+(k-K_MIN),'cloud');if(e<.35)this.voxels.set(id*LEVELS+(k+1-K_MIN),'cloud');}
  }
 }

 groundColor(i,j,k,topLevel){
  const C=this.colors;
  if(k===topLevel-1){const n=noise(i*.09,j*.09)+hash(i,j,3)*.18;return n<.6?C.green:n<.85?C.lime:C.darkGreen;}
  return hash(i,j,k)<.62?C.white:C.lightGrey;
 }
 voxelColor(category,i,j,k){
  const C=this.colors,h=hash(i,j,k);
  if(category==='leaf'){if(h<.025)return C.yellow;if(h<.04)return C.blue;const n=noise(i*.3+k,j*.3);return n<.5?C.green:n<.8?C.darkGreen:C.lime;}
  if(category==='moss')return h<.7?C.green:C.lime;
  if(category==='wood')return h<.8?C.ochre:C.yellow;
  if(category==='cloud')return C.white;
  return h<.6?C.white:C.lightGrey;
 }
 solid(i,j,k){if(i<0||j<0||i>=W||j>=D)return false;const id=j*W+i;return k<this.levels[id]&&this.levels[id]>-32768||this.voxels.has(id*LEVELS+(k-K_MIN));}

 mesh(){
  const material=brickMaterial(),chunks=new Map();
  const at=(i,j)=>{const key=Math.floor(i/CHUNK)+','+Math.floor(j/CHUNK);let c=chunks.get(key);if(!c){c={p:[],n:[],c:[],k:[]};chunks.set(key,c);}return c;};
  const quad=(c,v,normal,color,kind)=>{for(const n of[0,1,2,0,2,3]){c.p.push(...v[n]);c.n.push(...normal);c.c.push(color.r,color.g,color.b);c.k.push(kind);}};
  const x0=i=>GRID.minX+i*CELL,z0=j=>GRID.minZ+j*CELL;
  const C=this.colors;
  // Ground columns: top faces merged along rows, then exposed side faces brick by brick.
  for(let j=0;j<D;j++){
   let i=0;
   while(i<W){
    const id=j*W+i,L=this.levels[id];if(L===-32768){i++;continue;}
    const kind=this.kind[id],color=kind===1?C.yellow:kind===2?C.white:this.groundColor(i,j,L,L);
    let run=1;while(i+run<W&&(i+run)%CHUNK!==0){const id2=id+run;if(this.levels[id2]!==L||this.kind[id2]!==kind)break;const c2=kind===1?C.yellow:kind===2?C.white:this.groundColor(i+run,j,L,L);if(c2!==color)break;run++;}
    const y=L*LEVEL,a=x0(i),b=x0(i+run),z=z0(j),z1=z0(j+1);
    quad(at(i,j),[[a,y,z1],[b,y,z1],[b,y,z],[a,y,z]],[0,1,0],color,kind?1:0);
    i+=run;
   }
  }
  const dirs=[[1,0,[1,0,0]],[-1,0,[-1,0,0]],[0,1,[0,0,1]],[0,-1,[0,0,-1]]];
  for(let j=0;j<D;j++)for(let i=0;i<W;i++){
   const L=this.levels[j*W+i];if(L===-32768)continue;
   for(const[di,dj,normal]of dirs){
    const ni=i+di,nj=j+dj,inside=ni>=0&&nj>=0&&ni<W&&nj<D,NL=inside&&this.levels[nj*W+ni]>-32768?this.levels[nj*W+ni]:BASE;
    for(let k=Math.max(NL,BASE);k<L;k++){
     if(inside&&this.voxels.has((nj*W+ni)*LEVELS+(k-K_MIN)))continue;
     const color=this.kind[j*W+i]?(k===L-1?C.white:C.lightGrey):this.groundColor(i,j,k,L),y0=k*LEVEL,y1=y0+LEVEL;
     const ex=di>0?x0(i+1):x0(i),ez=dj>0?z0(j+1):z0(j);
     const v=di?[[ex,y0,z0(j+(di>0?1:0))],[ex,y0,z0(j+(di>0?0:1))],[ex,y1,z0(j+(di>0?0:1))],[ex,y1,z0(j+(di>0?1:0))]]:[[x0(i+(dj>0?0:1)),y0,ez],[x0(i+(dj>0?1:0)),y0,ez],[x0(i+(dj>0?1:0)),y1,ez],[x0(i+(dj>0?0:1)),y1,ez]];
     quad(at(i,j),v,normal,color,0);
    }
   }
  }
  // Brick shells: one face for each side that touches air.
  for(const[key,category]of this.voxels){
   const id=Math.floor(key/LEVELS),k=key%LEVELS+K_MIN,i=id%W,j=Math.floor(id/W),color=this.voxelColor(category,i,j,k),c=at(i,j);
   const a=x0(i),b=x0(i+1),z=z0(j),z1=z0(j+1),y0=k*LEVEL,y1=y0+LEVEL;
   if(!this.solid(i,j,k+1))quad(c,[[a,y1,z1],[b,y1,z1],[b,y1,z],[a,y1,z]],[0,1,0],color,0);
   if(!this.solid(i,j,k-1))quad(c,[[a,y0,z],[b,y0,z],[b,y0,z1],[a,y0,z1]],[0,-1,0],color,0);
   if(!this.solid(i+1,j,k))quad(c,[[b,y0,z1],[b,y0,z],[b,y1,z],[b,y1,z1]],[1,0,0],color,0);
   if(!this.solid(i-1,j,k))quad(c,[[a,y0,z],[a,y0,z1],[a,y1,z1],[a,y1,z]],[-1,0,0],color,0);
   if(!this.solid(i,j+1,k))quad(c,[[a,y0,z1],[b,y0,z1],[b,y1,z1],[a,y1,z1]],[0,0,1],color,0);
   if(!this.solid(i,j-1,k))quad(c,[[b,y0,z],[a,y0,z],[a,y1,z],[b,y1,z]],[0,0,-1],color,0);
  }
  let triangles=0;
  for(const c of chunks.values()){
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(c.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(c.n,3));g.setAttribute('color',new T.Float32BufferAttribute(c.c,3));g.setAttribute('brickKind',new T.Float32BufferAttribute(c.k,1));g.computeBoundingSphere();g.computeBoundingBox();
   const m=new T.Mesh(g,material);m.name='brick-chunk';m.castShadow=m.receiveShadow=true;m.matrixAutoUpdate=false;this.group.add(m);triangles+=c.p.length/9;
  }
  this.stats={chunks:chunks.size,triangles,voxels:this.voxels.size};
 }

 // Little brick flowers on open grass.
 flowers(){
  const spots=[];
  for(let j=0;j<D;j++)for(let i=0;i<W;i++){const id=j*W+i,L=this.levels[id];if(L===-32768||this.kind[id]||hash(i,j,11)>.045||this.voxels.has(id*LEVELS+(L-K_MIN)))continue;spots.push([GRID.minX+(i+.5)*CELL,L*LEVEL,GRID.minZ+(j+.5)*CELL,hash(i,j,12)]);}
  const stem=new T.CylinderGeometry(.05,.05,.32,6).translate(0,.16,0),head=new T.CylinderGeometry(.2,.2,.1,8).translate(0,.36,0);
  const geometry=mergeGeometries([stem,head]),mesh=new T.InstancedMesh(geometry,new T.MeshStandardMaterial({roughness:.38}),spots.length),m=new T.Matrix4(),C=this.colors;
  spots.forEach(([x,y,z,h],n)=>{m.makeTranslation(x+(h-.5)*.3,y,z+(hash(n,3)-.5)*.3);mesh.setMatrixAt(n,m);mesh.setColorAt(n,h<.45?C.yellow:h<.8?C.blue:C.white);});
  mesh.name='brick-flowers';this.group.add(mesh);
 }

 build(scene,skip){
  const t0=globalThis.performance?.now?.()??0;
  const items=this.collect(scene,skip);
  for(const{mesh,category}of items){this.processed.add(mesh);if(category!=='decor')this.sample(mesh,category);}
  this.settle();this.clouds();this.mesh();this.flowers();
  for(const{mesh}of items){mesh.visible=false;this.hidden.push(mesh);}
  this.stats.ms=Math.round((globalThis.performance?.now?.()??0)-t0);this.stats.converted=items.length;
  return this.group;
 }
 // Scenery that appears later (new chapters, story sites) is hidden too; returns true when a rebuild is due.
 sweep(scene,skip){let fresh=false;for(const{mesh,category}of this.collect(scene,skip)){if(this.processed.has(mesh))continue;this.processed.add(mesh);mesh.visible=false;this.hidden.push(mesh);if(category!=='decor')fresh=true;}return fresh;}
 dispose(){for(const m of this.hidden)m.visible=true;this.hidden=[];this.group.removeFromParent();this.group.traverse(o=>{o.geometry?.dispose();});}
}

function mergeGeometries(list){
 const p=[],n=[];for(const g of list){const s=g.index?g.toNonIndexed():g;p.push(...s.attributes.position.array);n.push(...s.attributes.normal.array);}
 const out=new T.BufferGeometry();out.setAttribute('position',new T.Float32BufferAttribute(p,3));out.setAttribute('normal',new T.Float32BufferAttribute(n,3));return out;
}

// Glossy plastic with 2×2 studs on every brick top (tiles stay smooth), dark joints between bricks and a light
// bevel along each brick's upper edge. Studs and joints fade out with distance so they never shimmer.
let shared=null;
export function brickMaterial(){
 if(shared)return shared;
 const m=new T.MeshStandardMaterial({vertexColors:true,roughness:.36,metalness:0});
 m.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float brickKind;varying float vBrickKind;varying vec3 vBrickPos;varying vec3 vBrickN;')
   .replace('#include <project_vertex>','#include <project_vertex>\nvBrickKind=brickKind;vBrickPos=(modelMatrix*vec4(transformed,1.)).xyz;vBrickN=normalize(mat3(modelMatrix)*objectNormal);');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float vBrickKind;varying vec3 vBrickPos;varying vec3 vBrickN;')
   .replace('#include <lights_physical_fragment>',`{
  vec3 bn=normalize(vBrickN),bp=vBrickPos;float dist=length(vViewPosition),near=1.-smoothstep(18.,34.,dist),joints=1.-smoothstep(30.,60.,dist);
  if(bn.y>.5){
   vec2 f=fract(bp.xz);vec2 e=min(f,1.-f);float edge=min(e.x,e.y),aa=fwidth(edge)+.002;
   diffuseColor.rgb*=1.-joints*.28*(1.-smoothstep(.0,.03+aa,edge));
   if(vBrickKind<.5&&near>0.){
    vec2 cell=fract(bp.xz*2.)-.5;float d=length(cell),r=.3,ad=fwidth(d)*1.5+.003;
    float inside=1.-smoothstep(r-ad,r+ad,d),ring=1.-smoothstep(0.,.08+ad,abs(d-r));vec2 dir=cell/max(d,1e-4);float lit=dot(dir,vec2(-.62,-.78));
    diffuseColor.rgb*=1.+near*(inside*.07+ring*(lit>0.?.2*lit:.38*lit));
    normal=normalize(normal+mat3(viewMatrix)*vec3(dir.x,0.,dir.y)*ring*near*.6);
   }
  }else{
   float v=fract(bp.y/${LEVEL.toFixed(2)}),u=fract(abs(bn.x)>.5?bp.z:bp.x),ev=min(v,1.-v),eu=min(u,1.-u),av=fwidth(v)+.003,au=fwidth(u)+.002;
   diffuseColor.rgb*=1.-joints*.3*max(1.-smoothstep(0.,.035+av,ev),1.-smoothstep(0.,.02+au,eu));
   diffuseColor.rgb*=1.+joints*.12*smoothstep(.9,.97,v)*(1.-smoothstep(.97,1.,v));
  }
 }
 #include <lights_physical_fragment>`);
 };
 m.customProgramCacheKey=()=>'maxima-brick-world-v1';
 shared=m;return m;
}
