import{surfaceMaterial,assignSurfaceRoles,replaceCueMaterials}from'./surface-materials.js';
import{composedHalfWidth,scenicSurface}from'./expedition-composition.js';
import{bevelBox,carvedCylinder,stoneColumn,liquidMaterial,rockLump,fadeNearCamera}from'./prop-art.js';
import{approachHeight}from'./traversal-layout.js';
import{movingPose,coinPose}from'./path-trials-layout.js';
import * as T from './vendor/three.module.min.js';
import {localPoint,plantPhase} from './traversal-layout.js';

const STATES=new WeakMap();
const PALETTES=[{rock:'#8e8977',top:'#aeb08f',rim:'#6f6c5e',water:'#5cabae',glow:'#addbca'},{rock:'#a8a088',top:'#c4c8a8',rim:'#857c66',water:'#48667a',glow:'#8fdbe2'},{rock:'#6d6f80',top:'#a8a0a0',rim:'#545266',water:'#b95f45',glow:'#f2ac68'}];
function merge(root){
 root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),batches=new Map();
 root.traverse(o=>{if(!o.isMesh)return;const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(inverse.clone().multiply(o.matrixWorld));if(!batches.has(o.material))batches.set(o.material,{p:[],n:[]});const out=batches.get(o.material);for(const v of geo.attributes.position.array)out.p.push(v);for(const v of geo.attributes.normal.array)out.n.push(v);geo.dispose();});
 root.clear();for(const[material,data]of batches){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(data.p,3));geo.setAttribute('normal',new T.Float32BufferAttribute(data.n,3));const mesh=new T.Mesh(geo,material);mesh.receiveShadow=true;mesh.castShadow=true;root.add(mesh);}
}
function joinGeometry(geometries){const p=[],n=[];for(const original of geometries){const g=original.index?original.toNonIndexed():original;for(const v of g.attributes.position.array)p.push(v);for(const v of g.attributes.normal.array)n.push(v);if(g!==original)g.dispose();}const out=new T.BufferGeometry();out.setAttribute('position',new T.Float32BufferAttribute(p,3));out.setAttribute('normal',new T.Float32BufferAttribute(n,3));return out;}

export function makeTraversalScenery(section,{mode='relaxed',ground=null}={}){
 if(!section||!['coins','rocks','plants','steps'].includes(section.kind))throw new Error('Unknown traversal section');
 const group=new T.Group();group.name='traversal-'+section.kind;
 const palette=PALETTES[section.area]||PALETTES[0],geometries=new Map();
 const material=(color,extra={})=>surfaceMaterial('stone',color,extra);
 const m={rock:material(palette.rock),top:material(palette.top),rim:material(palette.rim),pool:material(palette.water,{roughness:section.area===2?.65:.28,emissive:section.area===0?'#142b29':palette.water,emissiveIntensity:section.area===0?.08:.55}),glow:material(palette.glow,{emissive:palette.glow,emissiveIntensity:.45}),gold:material('#f1c65d',{metalness:.35,roughness:.3,emissive:'#b78024',emissiveIntensity:.30}),rune:material('#fff1a7',{emissive:'#ffe49c',emissiveIntensity:.75}),leaf:material('#5e8054'),stem:material('#6a7450'),bud:material('#a6bf80'),spore:material('#b98ad5',{emissive:'#9768bb',emissiveIntensity:.45}),cloud:material('#9e70bb',{transparent:true,opacity:.15,depthWrite:false,roughness:1}),cloudRim:material('#b290ca',{transparent:true,opacity:.70,depthWrite:false,emissive:'#5a3d71',emissiveIntensity:.3})};
 assignSurfaceRoles(m,{"stone": ["rock", "top", "rim"], "foliage": ["leaf", "stem", "bud"], "metal": ["gold"], "effect": ["glow", "rune", "spore", "cloud"], "cue": ["cloudRim"], "water": ["pool"]});replaceCueMaterials(m,["cloudRim"]);m.top.color.offsetHSL(0,-.025,.045);
 const geo=(key,make)=>{if(!geometries.has(key))geometries.set(key,make());return geometries.get(key);};
 const box=(w,h,d)=>geo(`b${w},${h},${d}`,()=>bevelBox(w,h,d));
 const cylinder=(r1,r2,h,n=16)=>geo(`c${r1},${r2},${h},${n}`,()=>carvedCylinder(r1,r2,h,n));
 const mesh=(geometry,mat,x,y,z,parent=group)=>{const o=new T.Mesh(geometry,mat);o.position.set(x,y,z);o.receiveShadow=true;o.castShadow=true;parent.add(o);return o;};
 const fragileData=[];
 const yaw=Math.atan2(-section.right.z,section.right.x),fixed=new T.Group();fixed.name='fixed-scenery';group.add(fixed);
 const at=(s,l=0)=>localPoint(section,s,l);
 const placeBox=(w,h,d,mat,s,l,y)=>{const p=at(s,l),o=mesh(box(w,h,d),mat,p.x,y,p.z,fixed);o.rotation.y=yaw;return o;};

 if(section.scenicRise||section.index%3===0){
  const vertices=[],slices=section.scenicRise?.segments||12,from=section.scenicRise?.from??.4,to=section.scenicRise?.to??3.8;
  const point=(d,f)=>{const width=section.scenicRise?composedHalfWidth(at(d).z)+.12:3.2,p=at(d,width*f);return[p.x,(section.scenicRise?scenicSurface(section,d,width*f):approachHeight(section,d))+.033,p.z];};
  for(let i=0;i<slices;i++){const a=from+(to-from)*i/slices,b=from+(to-from)*(i+1)/slices;
   for(let j=0;j<6;j++){const v=[point(a,-1+j/3),point(a,-1+(j+1)/3),point(b,-1+(j+1)/3),point(b,-1+j/3)];for(const k of[0,1,2,0,2,3])vertices.push(...v[k]);}
   if(section.scenicRise)for(const edge of[-1,1]){const v=point(a,edge),w=point(b,edge),lowV=[v[0],.025,v[2]],lowW=[w[0],.025,w[2]];vertices.push(...v,...w,...lowW,...v,...lowW,...lowV);}
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.computeVertexNormals();const rise=mesh(geo,ground||m.top,0,0,0,fixed);rise.name=section.scenicRise?'composed-approach-rise':'approach-rise';
 }

 if(section.kind==='rocks'||section.trial?.kind==='bonus'){
 if(section.kind==='rocks'){
  const pool=section.pool,length=pool.to-pool.from,center=(pool.from+pool.to)/2;
  const c=at(center),liquid=liquidMaterial(palette.water,{lava:section.area===2,center:c,forward:section.forward,right:section.right,halfWidth:pool.width/2,halfLength:length/2});if(section.area===1){liquid.emissive.set(palette.water);liquid.emissiveIntensity=.35;}const surface=placeBox(pool.width,.10,length,liquid,center,0,.015);surface.name=['water-surface','luminous-ravine-surface','lava-surface'][section.area]||'water-surface';surface.castShadow=false;
  // Rocky banks: lumps along both sides and across both ends, never over the water the player crosses.
  let n=0;const lump=(s,l,r)=>{const p=at(s,l),o=mesh(rockLump(1+n%5),n%3?m.rim:m.rock,p.x,r*.18,p.z,fixed);o.scale.set(r,r*(.55+(n*37%10)/30),r*(.8+(n*13%10)/40));o.rotation.y=n*1.37;n++;};
  for(const side of[-1,1])for(let s=pool.from;s<=pool.to;s+=.42){const r=.17+((n*7)%10)/80;lump(s,side*(pool.width/2+.12+r*.55),r);}
  for(const s of[pool.from,pool.to])for(let l=-pool.width/2;l<=pool.width/2;l+=.4){const r=.14+((n*7)%10)/110;lump(s+(s===pool.from?-1:1)*(.02+r*.4),l,r);}
  }
  // Flat cap is exactly the physics platform radius and declared world Y.
  for(const platform of section.platforms){const parent=platform.fragile||platform.motion?new T.Group():fixed;if(platform.fragile||platform.motion){parent.name='crumbling-stone-'+platform.id;fixed.add(parent);fragileData.push({platform,parent});}const height=platform.y+.18,o=mesh(geo('column'+platform.r+','+height+','+platform.id.length%5,()=>stoneColumn(platform.r,height,1+platform.id.length%5)),m.rock,platform.x,platform.y-.003,platform.z,parent);o.rotation.y=platform.x*1.7;o.name='rock-'+platform.id;const top=mesh(cylinder(platform.r,platform.r,.012,24),platform.fragile?m.rim:m.top,platform.x,platform.y-.006,platform.z,parent);top.name='platform-top-'+platform.id;if(platform.fragile){for(const side of[-1,1]){const crack=mesh(box(.025,.006,platform.r*.72),m.glow,platform.x+side*.17,platform.y+.004,platform.z,parent);crack.rotation.y=side*.5;}}}
 }
 if(section.kind==='steps'){
  for(const platform of section.platforms){const h=platform.y+.12,p={x:platform.x,z:platform.z},o=mesh(box(platform.hx*2,h,platform.hz*2),m.rock,p.x,platform.y-h/2-.014,p.z,fixed);o.rotation.y=yaw;o.name='stair-'+platform.id;
   const tread=mesh(box(platform.hx*2,.012,platform.hz*2),m.top,p.x,platform.y-.006,p.z,fixed);tread.rotation.y=yaw;tread.name='platform-top-'+platform.id;
  }
 }
 // A shallow discovery medallion marks a quiet, optional three-coin detour.
 const discovery=section.coins.find(c=>c.discovery);if(discovery){const y=approachHeight(section,discovery.s),base=mesh(cylinder(.20,.24,.035,10),m.rim,discovery.x,y+.045,discovery.z,fixed);base.name='discovery-medallion';for(const side of[-1,1]){const notch=mesh(box(.035,.012,.20),m.gold,discovery.x+side*.07,y+.070,discovery.z,fixed);notch.rotation.y=side*.4;}}
 // Low verge markers are scenery, leaving the full central course accessible.
 for(const s of[1,section.length-1])for(const lateral of[-2.8,2.8]){const p=at(s,lateral);mesh(cylinder(.12,.17,.24,7),m.rim,p.x,.12,p.z,fixed);mesh(cylinder(.085,.10,.035,7),m.glow,p.x,.255,p.z,fixed);}
 for(const data of fragileData)fixed.remove(data.parent);merge(fixed);for(const data of fragileData)fixed.add(data.parent);

 const object=new T.Object3D(),coinParts=[],coinCount=section.coins.length;
 if(coinCount){
  const bodyGeo=new T.CylinderGeometry(.22,.22,.065,12);bodyGeo.rotateX(Math.PI/2);
  const rims=[];for(const face of[-1,1]){const rim=new T.TorusGeometry(.185,.018,4,16);rim.translate(0,0,face*.038);rims.push(rim);}const rimGeo=joinGeometry(rims);rims.forEach(g=>g.dispose());const fronts=[];
  for(const face of[-1,1])for(const side of[-1,1]){const bit=new T.BoxGeometry(.033,.21,.012);bit.rotateZ(side*.33);bit.translate(side*.045,0,face*.042);fronts.push(bit);}
  const runeGeo=joinGeometry(fronts);fronts.forEach(g=>g.dispose());
  fadeNearCamera(m.gold);fadeNearCamera(m.rune);
  for(const[geometry,mat,name]of[[bodyGeo,m.gold,'gold-coins'],[rimGeo,m.rune,'coin-rims'],[runeGeo,m.rune,'double-sided-coin-runes']]){const batch=new T.InstancedMesh(geometry,mat,coinCount);batch.name=name;batch.castShadow=true;batch.frustumCulled=false;group.add(batch);coinParts.push(batch);}
 }
 const plantData=[],solids=[];
 for(const plant of section.plants){
  const body=new T.Group();body.name='poison-plant-'+plant.id;body.position.set(plant.x,0,plant.z);group.add(body);
  const bodyR=plant.r*.6,budMat=m.bud.clone();mesh(cylinder(.045,.075,.44,7),m.stem,0,.22,0,body);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5,r=bodyR*.47,leaf=mesh(geo('leaf',()=>new T.SphereGeometry(1,7,4)),m.leaf,Math.cos(a)*r,.12,Math.sin(a)*r,body);leaf.scale.set(bodyR*.48,.07,bodyR*.24);leaf.rotation.y=-a;}
  const bud=mesh(geo('bud',()=>new T.OctahedronGeometry(1,0)),budMat,0,.55,0,body);bud.scale.set(bodyR*.62,.24,bodyR*.62);merge(body);
  const cloud=new T.Group();cloud.name='poison-radius-'+plant.id;cloud.position.set(plant.x,0,plant.z);group.add(cloud);
  const fogMat=m.cloud.clone(),ringMat=m.cloudRim.clone(),sporeMat=m.spore.clone(),radius=plant.cloudRadius;
  const fog=mesh(geo('cloud',()=>new T.SphereGeometry(1,20,10)),fogMat,0,.47,0,cloud);fog.scale.set(radius,.42,radius);fog.castShadow=false;
  const boundary=mesh(geo('radius-'+radius,()=>new T.TorusGeometry(radius-.018,.018,4,40)),ringMat,0,.045,0,cloud);boundary.rotation.x=Math.PI/2;boundary.castShadow=false;
  const spores=new T.InstancedMesh(geo('spore',()=>new T.OctahedronGeometry(.035,0)),sporeMat,10);spores.name='spores';spores.frustumCulled=false;cloud.add(spores);
  plantData.push({plant,bodyR,budMat,cloud,fog,fogMat,boundary,ringMat,spores,sporeMat});
  solids.push({id:plant.id,kind:'poison-plant',shape:'circle',x:plant.x,z:plant.z,r:plant.r,minY:0,maxY:.79});
 }
 group.userData={sectionId:section.id,kind:section.kind,area:section.area,mode,solids,collidersInWorldSpace:true,coinCount,coinVisibleCount:coinCount,completed:false,plantStates:[],platformTops:section.platforms.map(p=>({id:p.id,x:p.x,z:p.z,y:p.y,...(p.r?{r:p.r}:{hx:p.hx,hz:p.hz})}))};
 STATES.set(group,{section,coinParts,plantData,fragileData,object});updateTraversalScenery(group,{time:0,collected:new Set(),completed:false});return group;
}

export function updateTraversalScenery(group,{time=0,collected=new Set(),completed=false,crumble=null,playerRadius=0}={}){
 const state=STATES.get(group);if(!state)return group;time=Number.isFinite(time)?time:0;const{section,coinParts,plantData,fragileData,object}=state;
 for(const{platform,parent}of fragileData){if(platform.motion){const p=movingPose(section,platform,time);parent.position.set(p.x-platform.x,p.y-platform.y,p.z-platform.z);parent.visible=true;continue;}const c=crumble?.get(platform.id),age=c?.age||0;parent.position.y=c?.fallen?-Math.min(1.4,(age-platform.crumbleAfter)*2):Math.sin(age*45)*.018*(age/platform.crumbleAfter);parent.visible=!c?.fallen||age<platform.crumbleAfter+.65;}
 let visible=0;section.coins.forEach((raw,i)=>{const coin=coinPose(section,raw,time);const hidden=collected?.has?.(coin.id)===true;if(!hidden)visible++;object.position.set(coin.x,coin.y+Math.sin(time*2.8+i*.8)*.065,coin.z);object.rotation.set(0,Math.atan2(-section.forward.x,-section.forward.z)+time*1.7+i*.12,0);object.scale.setScalar(hidden?0:1);object.updateMatrix();for(const batch of coinParts)batch.setMatrixAt(i,object.matrix);});
 for(const batch of coinParts)batch.instanceMatrix.needsUpdate=true;
 const phases=[];for(const data of plantData){const{plant,budMat,cloud,fog,fogMat,boundary,ringMat,spores,sporeMat}=data,phase=plantPhase(plant,time),warning=phase==='warning',active=phase==='active',color=active?'#a27ac7':warning?'#efb85c':'#a6bf80';
  phases.push({id:plant.id,phase,cloudRadius:plant.cloudRadius});budMat.color.set(color);budMat.emissive.set(active?'#58346d':warning?'#735019':'#000000');budMat.emissiveIntensity=.35;
  cloud.visible=warning||active;fog.visible=active;spores.visible=active;ringMat.color.set(color);ringMat.emissive?.set(color);fogMat.color.set('#9e70bb');sporeMat.color.set(color);
  boundary.scale.setScalar((plant.cloudRadius+playerRadius*.3)/plant.cloudRadius);boundary.position.y=.045;ringMat.opacity=warning?.42+.25*Math.sin(time*8)**2:.72;
  for(let i=0;i<spores.count;i++){const a=i*Math.PI*2/spores.count+time*.25,r=(plant.cloudRadius-.08)*(.42+.50*((i*7)%10)/9);object.position.set(Math.cos(a)*r,.18+((i*.17+time*.25)% .77),Math.sin(a)*r);object.rotation.set(time*.4+i,i*.8,time*.2);object.scale.setScalar(1);object.updateMatrix();spores.setMatrixAt(i,object.matrix);}spores.instanceMatrix.needsUpdate=true;
 }
 group.userData.coinVisibleCount=visible;group.userData.collectedCoinCount=section.coins.length-visible;group.userData.completed=!!completed;group.userData.plantStates=phases;return group;
}
