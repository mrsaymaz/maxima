import * as T from './vendor/three.module.min.js';
import {chapterPath,pathDistance,approachPoint,CHAPTER_LENGTH,END} from './trail-layout.js';

// These are geometry assets. The expedition owns permission to cross a gate.
const STATES=new WeakMap();
let ENCLOSURE_CACHE=null;
const TYPES=['translation','definition','picture','qa-pairs','halves','ending','sentence','gap','correct','repair','answer','sort','intruder','spelling','clue','listen-word','listen-tr','listen-multi','numbers','instructions'];
const PALETTES=[['#637663','#94a28a','#5b8055','#b8e2c5'],['#627b7a','#a3b8ad','#648c7c','#b7e7e9'],['#62697d','#a2a7b9','#75849a','#d5ccfb']];
const clamp=n=>Math.max(0,Math.min(1,Number.isFinite(n)?n:0));
function kit(name,area=0){
 const g=new T.Group();g.name=name;const p=PALETTES[area]||PALETTES[0],cache=new Map();
 const mat=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.88,...extra});
 const m={dark:mat(p[0]),stone:mat(p[1]),moss:mat(p[2]),air:mat(p[3],{emissive:p[3],emissiveIntensity:.55,roughness:.45}),wood:mat('#846b50'),light:mat('#b79b70'),gold:mat('#cbb078',{metalness:.18,roughness:.56}),root:mat('#665b49'),corrupt:mat('#766680'),fruit:mat('#dfaa62'),water:mat('#6fbbb7',{roughness:.3}),cream:mat('#e1d9b9'),eye:mat('#253c36')};
 const geo=(key,fn)=>{if(!cache.has(key))cache.set(key,fn());return cache.get(key);};
 const box=(w,h,d)=>geo(`b${w},${h},${d}`,()=>new T.BoxGeometry(w,h,d));
 const cyl=(a,b,h,n=7)=>geo(`c${a},${b},${h},${n}`,()=>new T.CylinderGeometry(a,b,h,n));
 const ball=r=>geo(`s${r}`,()=>new T.SphereGeometry(r,8,5));
 const crystal=r=>geo(`o${r}`,()=>new T.OctahedronGeometry(r));
 const ring=(r,t=.045,arc=Math.PI*2)=>geo(`t${r},${t},${arc}`,()=>new T.TorusGeometry(r,t,4,20,arc));
 const mesh=(geometry,material,x=0,y=0,z=0,parent=g)=>{const o=new T.Mesh(geometry,material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 const part=(name,parent=g)=>{const o=new T.Group();o.name=name;parent.add(o);return o;};
 const link=(a,b,r,material,parent=g)=>{const av=new T.Vector3(...a),bv=new T.Vector3(...b),delta=bv.clone().sub(av);const o=mesh(cyl(r,r,delta.length(),6),material,0,0,0,parent);o.position.copy(av.add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return o;};
 return{g,m,box,cyl,ball,crystal,ring,mesh,part,link};
}

function rune(k,parent,x,y,z,size=1){const {mesh,box,m}=k;for(const s of[-1,1])mesh(box(.055*size,.30*size,.035),m.air,x+s*.075*size,y,z,parent).rotation.z=s*.35;}
function owl(k,parent,x,y,z,size=.6){const {part,mesh,ball,cyl,m}=k,g=part('woodland-visitor',parent);g.position.set(x,y,z);g.scale.setScalar(size);mesh(ball(.34),m.moss,0,.43,0,g).scale.y=1.2;mesh(ball(.35),m.moss,0,.91,.02,g);for(const s of[-1,1]){mesh(ball(.16),m.cream,s*.16,.94,.30,g).scale.z=.2;mesh(ball(.06),m.eye,s*.16,.95,.335,g);mesh(cyl(0,.09,.23,5),m.moss,s*.23,1.22,0,g).rotation.z=-s*.25;}mesh(cyl(0,.06,.14,5),m.gold,0,.84,.35,g).rotation.x=Math.PI/2;return g;}

function batchStatic(root){
 // Keep each animated stage separate, merging its fixed details by material.
 root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),batches=new Map();
 root.traverse(o=>{if(!o.isMesh)return;const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(inverse.clone().multiply(o.matrixWorld));if(!batches.has(o.material))batches.set(o.material,{position:[],normal:[]});const out=batches.get(o.material);out.position.push(...geo.attributes.position.array);out.normal.push(...geo.attributes.normal.array);geo.dispose();});
 root.clear();for(const [material,data]of batches){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(data.position,3));geo.setAttribute('normal',new T.Float32BufferAttribute(data.normal,3));const mesh=new T.Mesh(geo,material);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);}
}

// Each family has three independently restored spans across the entire 6.4m path.
// Completed pieces either sink into the verges or become a flush crossing deck.
export function makeRouteBarrier(type,{area=0,completed=false}={}){
 if(!TYPES.includes(type))throw new Error('Unknown corridor barrier type: '+type);
 const k=kit('route-barrier-'+type,area),{g,m,mesh,box,cyl,crystal,ball,ring,part,link}=k;
 const updates=[],segments=[],crossing=['halves','sentence','gap'].includes(type);
 const family=['translation','definition','correct','repair','answer'].includes(type)?'rune':crossing?'crossing':['picture','sort','clue','listen-multi','numbers','instructions'].includes(type)?'supplies':['ending','intruder','spelling'].includes(type)?'roots':['listen-word','listen-tr'].includes(type)?'echo':'wind';
 for(const s of[-1,1]){
  mesh(cyl(.24,.34,.24,8),m.dark,s*2.86,.12,0);
  const h=family==='roots'?1.55:2.85;mesh(cyl(.16,.24,h,7),family==='roots'?m.root:m.stone,s*2.86,h/2+.12,0);
  if(family!=='roots')mesh(crystal(.18),m.gold,s*2.86,h+.20,0);
 }
 for(let i=0;i<3;i++){
  const span=part('accepted-stage-'+(i+1));span.position.x=(i-1)*2.1;segments.push(span);
  const deco=part('restored-verge-'+(i+1));deco.position.set((i===1?-1:Math.sign(i-1))*2.96,.18,(i-1)*.32);mesh(crystal(.11),m.air,0,.1,0,deco);deco.visible=false;
  if(family==='rune'){
   mesh(box(2.08,2.35,.36),type==='answer'?m.wood:m.dark,0,1.175,0,span);
   for(const s of[-1,1])mesh(box(.12,2.4,.43),m.stone,s*.97,1.2,0,span);
   mesh(box(1.86,.14,.43),m.stone,0,2.25,0,span);rune(k,span,0,1.22,.20,1.7);
   if(type==='definition')for(let j=0;j<3;j++)mesh(box(.12,.30,.04),m.gold,(j-1)*.38,.62,.205,span);
   if(type==='correct'){const sign=mesh(box(1.34,.32,.07),m.light,0,1.92,.24,span);sign.rotation.z=(i-1)*.16;}
   if(type==='repair'){const arc=mesh(ring(.55,.10,Math.PI*1.65),m.air,0,1.28,.23,span);arc.rotation.z=i*2.1;}
   if(type==='answer')owl(k,span,0,2.36,0,.55);
  }else if(family==='crossing'){
   const deck=part('folding-crossing',span);deck.position.set(0,.04,-.12);
   if(type==='halves')for(let j=0;j<3;j++){const log=mesh(cyl(.17,.19,2.08,7),m.light,0,.22+j*.54,0,deck);log.rotation.z=Math.PI/2;}
   else for(let j=0;j<3;j++)mesh(box(2.08,.48,.20),type==='gap'?m.stone:m.dark,0,.28+j*.54,0,deck);
   for(const s of[-1,1])mesh(box(.14,1.85,.20),type==='gap'?m.gold:m.wood,s*.77,.93,.07,deck);
   if(type==='gap')mesh(box(1.35,1.60,.08),m.water,0,.84,-.13,deck);
   else rune(k,deck,0,.88,.15,1.15);
   batchStatic(deck);updates.push((f,p)=>{deck.rotation.x=-p*Math.PI/2;deck.position.y=.04-p*.04;deck.scale.z=1-p*.82;});
  }else if(family==='supplies'){
   // A loaded expedition sled: boxes and supplies visibly leave the trail.
   mesh(box(2.08,.18,.86),m.wood,0,.34,0,span);
   for(const s of[-1,1]){const wheel=mesh(cyl(.30,.30,.14,10),m.dark,s*.77,.30,.40,span);wheel.rotation.x=Math.PI/2;}
   for(let j=0;j<2;j++){mesh(box(.86,1.03,.76),j?m.light:m.wood,(j-.5)*.99,.96,0,span);mesh(box(.09,1.12,.82),m.gold,(j-.5)*.99,1.0,0,span);}
   mesh(box(1.90,.16,.88),m.light,0,1.58,0,span);
   if(type==='picture')for(const s of[-1,1])mesh(ball(.18),s===1?m.fruit:m.moss,s*.49,1.84,0,span);
   else if(type==='sort')for(const s of[-1,1])mesh(box(.36,.33,.38),s===1?m.moss:m.cream,s*.5,1.83,0,span);
   else if(type==='clue'){const lid=mesh(box(1.58,.2,.70),m.gold,0,1.83,0,span);lid.rotation.z=.10;}
   else if(type==='listen-multi')owl(k,span,0,1.69,-.1,.62);
   else if(type==='numbers'){mesh(cyl(.06,.09,.80),m.gold,0,2,0,span);mesh(box(1.45,.08,.10),m.gold,0,2.38,0,span);for(const s of[-1,1])mesh(cyl(.25,.18,.11,8),m.cream,s*.60,2.16,0,span);}
   else{const pack=mesh(box(.87,.86,.55),m.moss,0,2.02,0,span);mesh(box(.98,.16,.62),m.light,0,2.48,0,span);pack.rotation.z=.08;}
  }else if(family==='roots'){
   const curve=new T.CatmullRomCurve3([new T.Vector3(-.92,.15,0),new T.Vector3(-.70,1.1,.05),new T.Vector3(0,2.12,-.10),new T.Vector3(.64,1.5,.08),new T.Vector3(.92,.30,0)]);
   mesh(new T.TubeGeometry(curve,14,.16,6,false),type==='spelling'?m.corrupt:m.root,0,0,0,span);
   link([-.95,.45,-.12],[.90,1.68,.1],.12,m.root,span);link([-.80,1.63,.1],[.93,.39,-.06],.12,m.root,span);
   for(let j=0;j<4;j++){const x=(j-1.5)*.44;
    if(type==='ending'){const crown=mesh(ball(.35),m.moss,x,2.20+Math.sin(j)*.18,0,span);crown.scale.y=.63;mesh(ball(.13),m.fruit,x,1.96,.18,span);}
    else if(type==='spelling'){mesh(cyl(.07,.12,.33),m.cream,x,.48,.22,span);mesh(cyl(0,.28,.27,7),m.corrupt,x,.78,.22,span);}
    else{const thorn=mesh(cyl(0,.14,.43,5),m.corrupt,x,1.06+(j%2)*.58,.14,span);thorn.rotation.z=j%2?.8:-.8;}
   }
  }else if(family==='echo'){
   mesh(box(2.08,.16,.65),m.dark,0,.08,0,span);
   for(let j=0;j<3;j++){const x=(j-1)*.62,h=1.65+(j%2)*.65;
    if(type==='listen-tr'){const c=mesh(crystal(.45),m.air,x,h*.52,0,span);c.scale.set(.8,h/ .9,.75);}
    else{mesh(cyl(.09,.14,h),m.moss,x,h/2,0,span);for(let t=0;t<4;t++){const a=t*Math.PI/2,petal=mesh(ball(.25),m.cream,x+Math.cos(a)*.24,h+Math.sin(a)*.24,.02,span);petal.scale.z=.30;}mesh(ball(.17),m.gold,x,h,.15,span);}
   }const echo=mesh(ring(.67,.035,Math.PI*1.7),m.air,0,1.18,.27,span);echo.rotation.z=i*.5;
  }else{
   mesh(box(2.08,2.35,.10),m.air,0,1.175,0,span);
   for(const s of[-1,1])mesh(cyl(.07,.1,2.30),m.wood,s*.96,1.15,.12,span);
   mesh(box(1.55,.16,.35),m.light,0,2.31,.08,span);
   for(let j=0;j<3;j++){const x=(j-1)*.46;mesh(box(.36,.25,.06),m.cream,x,1.12,.11,span);for(const s of[-1,1]){const fold=mesh(box(.22,.025,.03),m.gold,x+s*.085,1.16,.16,span);fold.rotation.z=-s*.44;}}
  }
  // All non-crossing obstructions retract toward the ground, never over the player.
  if(!crossing){batchStatic(span);updates.push((f,p)=>{span.scale.y=Math.max(.001,1-p);span.visible=p<1;});}
  updates.push((f,p)=>{deco.visible=p===1;});
 }
 // One update pair per stage above. Each callback carries its stage index.
 const callbacks=updates.map((fn,j)=>({fn,index:Math.floor(j/2)}));
 g.userData={type,area,progress:0,completed:false,blocking:true,family,width:6.4,stages:3,solids:[]};
 STATES.set(g,{callbacks,segments,crossing});setRouteBarrierProgress(g,completed?1:0);return g;
}

export function setRouteBarrierProgress(group,fraction){
 const state=STATES.get(group);if(!state)return group;const f=clamp(fraction);
 group.userData.progress=f;group.userData.completed=f===1;group.userData.blocking=f<1;
 for(const {fn,index}of state.callbacks)fn(f,clamp(f*3-index));
 group.userData.solids=[];
 if(!state.crossing)for(let i=0;i<3;i++){const p=clamp(f*3-i);if(p<1)group.userData.solids.push({id:`barrier-${group.userData.type}-${i}`,kind:'route-barrier',shape:'box',x:(i-1)*2.1,z:0,hx:1.05,hz:.45,minY:0,maxY:3.25*(1-p)});}
 return group;
}

export function makeBranchClosure(chapter,side){
 if(!Number.isInteger(chapter)||chapter<0||chapter>4||!['left','right'].includes(side))throw new Error('Invalid branch closure');
 const k=kit(`branch-closure-${chapter}-${side}`),{g,m,mesh,box,cyl,crystal}=k,path=chapterPath(chapter,side),p=path[1];
 g.position.set(p.x,0,p.z);g.rotation.y=Math.atan2(-(path[2].x-path[0].x),-(path[2].z-path[0].z));
 // Ground to crown is solid: taller than every creature jump, with no overhead gap.
 mesh(box(6.4,3.45,.68),m.dark,0,1.725,0);
 for(let i=0;i<7;i++){mesh(box(.83,3.28,.08),m.stone,(i-3)*.90,1.64,.38);rune(k,g,(i-3)*.90,1.65,.43,.9);}
 for(const s of[-1,1]){mesh(cyl(.30,.38,3.20,7),m.stone,s*2.94,1.60,0);mesh(crystal(.18),m.gold,s*2.94,3.4,0);}
 mesh(box(6.4,.14,.80),m.moss,0,3.45,0);
 const solids=[];for(let i=0;i<9;i++){const x=(i-4)*.73,v=new T.Vector3(x,0,0).applyAxisAngle(new T.Vector3(0,1,0),g.rotation.y);solids.push({id:`closed-${chapter}-${side}-${i}`,kind:'branch-closure',shape:'circle',x:p.x+v.x,z:p.z+v.z,r:.47,minY:0,maxY:3.6});}
 g.userData={chapter,side,closed:true,solids,collidersInWorldSpace:true,width:6.4};return g;
}

// Extract a contour from the distance to the actual path union. Unlike parallel
// ribbons, this naturally preserves both fork mouths and every shared merge.
function cloneEnclosure(source){
 const group=new T.Group();group.name=source.name;group.userData=JSON.parse(JSON.stringify(source.userData));
 for(const original of source.children){const geometry=original.geometry.clone(),material=original.material.clone(),mesh=original.isInstancedMesh?new T.InstancedMesh(geometry,material,original.count):new T.Mesh(geometry,material);mesh.name=original.name;mesh.castShadow=original.castShadow;mesh.receiveShadow=original.receiveShadow;if(original.isInstancedMesh){mesh.instanceMatrix.copy(original.instanceMatrix);mesh.instanceMatrix.needsUpdate=true;}group.add(mesh);}return group;
}
export function makeCorridorEnclosure(){
 const paths=[];
 for(let c=0;c<5;c++)for(const s of['left','right'])paths.push(chapterPath(c,s));
 paths.push([{x:0,z:9},{x:0,z:2}],[{x:0,z:2-5*CHAPTER_LENGTH},{x:END.x,z:END.z-3}]);
 const cacheKey=JSON.stringify({paths,CHAPTER_LENGTH,END});
 if(ENCLOSURE_CACHE?.key===cacheKey)return cloneEnclosure(ENCLOSURE_CACHE.group);
 const k=kit('corridor-enclosure'),{g,m}=k;
 const protectedRoutes=paths.slice();
 for(let c=0;c<5;c++)for(const side of['left','right']){const path=chapterPath(c,side);for(const node of path.slice(2,6)){const a=approachPoint(node);protectedRoutes.push([node,a]);}}
 const distance=p=>Math.min(...paths.map(path=>pathDistance(p,path)));
 const radius=3.45,field=(x,z)=>distance({x,z})-radius;
 const normal=(x,z)=>{const dx=field(x+.04,z)-field(x-.04,z),dz=field(x,z+.04)-field(x,z-.04),len=Math.hypot(dx,dz)||1;return{x:dx/len,z:dz/len};};
 const height=(x,z)=>4.5+.42*Math.sin(z*.18)+.28*Math.cos(z*.53+x*.55)+(Math.abs(x)>9?.6:0);
 const buffers=[[],[],[],[]],solids=[],segments=[];
 const tri=(out,a,b,c)=>out.push(...a,...b,...c);
 const quad=(out,a,b,c,d)=>{tri(out,a,b,c);tri(out,a,c,d);};
 const availableDepth=(p,n)=>{let depth=0;for(let t=.1;t<=1.65+.001;t+=.05){if(field(p.x+n.x*t,p.z+n.z*t)<-.015)break;depth=t;}return Math.max(.03,depth);};
 const shell=(a,b)=>{
  const an=normal(a.x,a.z),bn=normal(b.x,b.z),ha=height(a.x,a.z),hb=height(b.x,b.z),aw=availableDepth(a,an),bw=availableDepth(b,bn),offsets=[0,.18/1.65,.40/1.65,.70/1.65],levels=[0,.42,.78,1];
  for(let l=0;l<3;l++){
   const p=[a.x+an.x*offsets[l]*aw,ha*levels[l],a.z+an.z*offsets[l]*aw],q=[b.x+bn.x*offsets[l]*bw,hb*levels[l],b.z+bn.z*offsets[l]*bw],r=[b.x+bn.x*offsets[l+1]*bw,hb*levels[l+1],b.z+bn.z*offsets[l+1]*bw],s=[a.x+an.x*offsets[l+1]*aw,ha*levels[l+1],a.z+an.z*offsets[l+1]*aw];quad(buffers[l],p,q,r,s);
  }
  quad(buffers[3],[a.x+an.x*aw*.70/1.65,ha,a.z+an.z*aw*.70/1.65],[b.x+bn.x*bw*.70/1.65,hb,b.z+bn.z*bw*.70/1.65],[b.x+bn.x*bw,hb-.12,b.z+bn.z*bw],[a.x+an.x*aw,ha-.12,a.z+an.z*aw]);
  // Back faces seal the narrow cliff shell without filling the scenic valley.
  quad(buffers[0],[a.x+an.x*aw,0,a.z+an.z*aw],[a.x+an.x*aw,ha-.12,a.z+an.z*aw],[b.x+bn.x*bw,hb-.12,b.z+bn.z*bw],[b.x+bn.x*bw,0,b.z+bn.z*bw]);
  const mid={x:(a.x+b.x)/2,z:(a.z+b.z)/2},n=normal(mid.x,mid.z),r=.63,c={x:mid.x+n.x*.48,z:mid.z+n.z*.48};
  // Explicit clearance check includes task approach spurs for adult radius .78.
  if(protectedRoutes.every(path=>pathDistance(c,path)>r+.78+.025))solids.push({id:'cliff-'+solids.length,kind:'cliff',shape:'circle',x:c.x,z:c.z,r,minY:0,maxY:Math.max(ha,hb)+.1});
  segments.push({a,b});
 };
 const step=.9,x0=-20,z0=Math.min(END.z,...paths.flat().map(p=>p.z))-9,nx=45,nz=Math.ceil((16-z0)/step);
 const rows=[];for(let iz=0;iz<=nz;iz++){const row=new Float64Array(nx+1);for(let ix=0;ix<=nx;ix++)row[ix]=field(x0+ix*step,z0+iz*step);rows.push(row);}
 for(let iz=0;iz<nz;iz++)for(let ix=0;ix<nx;ix++){
  const x=x0+ix*step,z=z0+iz*step,ps=[{x,z},{x:x+step,z},{x:x+step,z:z+step},{x,z:z+step}],vs=[rows[iz][ix],rows[iz][ix+1],rows[iz+1][ix+1],rows[iz+1][ix]],hits=[];
  for(let e=0;e<4;e++){const j=(e+1)%4;if((vs[e]<0)!==(vs[j]<0)){const t=vs[e]/(vs[e]-vs[j]);hits.push({x:ps[e].x+(ps[j].x-ps[e].x)*t,z:ps[e].z+(ps[j].z-ps[e].z)*t});}}
  if(hits.length===2)shell(hits[0],hits[1]);else if(hits.length===4){shell(hits[0],hits[1]);shell(hits[2],hits[3]);}
 }
 const materials=[m.dark,m.stone,new T.MeshStandardMaterial({color:'#7f8c77',roughness:1,side:T.DoubleSide}),m.moss];
 buffers.forEach((positions,i)=>{const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.computeVertexNormals();materials[i].side=T.DoubleSide;const mesh=new T.Mesh(geo,materials[i]);mesh.name=['cliff-foot-and-back','cliff-middle','cliff-crown','continuous-moss-cap'][i];mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);});
 // Sparse faceted outcrops give the otherwise merged strips a readable rock scale.
 const sites=segments.filter(({a,b},i)=>{if(i%9)return false;const x=(a.x+b.x)/2,z=(a.z+b.z)/2,n=normal(x,z);return field(x+n.x*1.1,z+n.z*1.1)>.80;}),rocks=new T.InstancedMesh(new T.DodecahedronGeometry(1,0),m.dark,sites.length),caps=new T.InstancedMesh(new T.DodecahedronGeometry(1,0),m.moss,sites.length),o=new T.Object3D();
 sites.forEach(({a,b},i)=>{const x=(a.x+b.x)/2,z=(a.z+b.z)/2,n=normal(x,z),h=height(x,z);o.position.set(x+n.x*1.1,h*.47,z+n.z*1.1);o.rotation.set(.08*Math.sin(i),i*.67,.07*Math.cos(i));o.scale.set(.57,h*.52,.57);o.updateMatrix();rocks.setMatrixAt(i,o.matrix);o.position.y=h-.10;o.scale.set(.64,.19,.64);o.updateMatrix();caps.setMatrixAt(i,o.matrix);});rocks.castShadow=true;rocks.receiveShadow=true;caps.receiveShadow=true;g.add(rocks,caps);
 g.userData={solids,collidersInWorldSpace:true,pathUnionRadius:radius,segments:segments.length,wallHeight:[3.8,5.8],adultRadius:.78,protectedRoutes:protectedRoutes.length};ENCLOSURE_CACHE={key:cacheKey,group:cloneEnclosure(g)};return g;
}
