import{stretchZ}from'./runner-mode.js';
import{sceneryPlan}from'./scenery-plan.js';import{sceneryGeometry,authorScenery}from'./scenery-art.js';
import{ARENA_LOOKS}from'./arena-palette.js';
import{makeMeadowGrass,updateMeadowGrass}from'./meadow-grass.js';
import{makeAqueductStory}from'./aqueduct-story.js';
import * as T from './vendor/three.module.min.js';
import {rockFormation,treeTrunk,treeCanopy,fernCluster,fallenLog,masonryFragment} from './environment-kit.js';
import {makeEnvironmentMaterials,environmentPalette} from './environment-materials.js';
import {buildTerrainChunks,terrainHeight,TERRAIN_BOUNDS,TERRAIN_CHUNKS} from './valley-terrain.js';
import {groundMaterial} from './world-style.js';
import {chapterPath,pathDistance,START,END} from './trail-layout.js';
import {composedHalfWidth,scenicSurface} from './expedition-composition.js';
import {sectionFor,courseCoordinates} from './traversal-layout.js';
const ROUTES=Array.from({length:5},(_,c)=>['left','right'].map(side=>chapterPath(c,side))).flat();
ROUTES.push([{x:0,z:12},START,{x:0,z:2}],[{x:0,z:stretchZ(-658)},END,{x:0,z:stretchZ(-674)}]);
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function environmentClearance(x,z){return Math.min(...ROUTES.map(p=>pathDistance({x,z},p)));}
// Sky, fog, hemisphere and sun per arena live with the rest of the arena look.
export const ENVIRONMENT_LIGHTING=ARENA_LOOKS.map(look=>look.lighting);
function windMaterial(material,uniforms){
 material.userData.stylized='environment-foliage';
 material.onBeforeCompile=shader=>{Object.assign(shader.uniforms,uniforms);shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float environmentFlex;\nuniform float uEnvironmentTime;\nuniform float uEnvironmentMotion;\nuniform vec2 uEnvironmentFocus;\nuniform float uEnvironmentQuiet;').replace('#include <begin_vertex>',`#include <begin_vertex>
 float calm = 1.0 - uEnvironmentQuiet * (1.0 - smoothstep(8.0, 15.0, distance(position.xz, uEnvironmentFocus)));
 float wave = sin(position.z*.29 + position.x*.37 + uEnvironmentTime*1.12) + .35*sin(position.x*.68-uEnvironmentTime*1.7);
 transformed.x += wave * environmentFlex * uEnvironmentMotion * calm;
 transformed.z += cos(position.z*.24+uEnvironmentTime*.9) * environmentFlex * .34 * uEnvironmentMotion * calm;`);};
 material.customProgramCacheKey=()=>'maxima-environment-foliage-v1';
}

// Geometry is spatially batched by material, keeping the authored kit's UVs,
// normals and baked vertex shade. Flex is zero on all solid or static objects.
export function makeEnvironmentField(e){
 const area=e.area||0,plan=sceneryPlan(area),root=new T.Group();root.name='enriched-valley-'+area;
 const materials=makeEnvironmentMaterials(area),uniforms={uEnvironmentTime:{value:0},uEnvironmentMotion:{value:1},uEnvironmentFocus:{value:new T.Vector2()},uEnvironmentQuiet:{value:0}},batches=new Map(),geometryCache=new Map(),placements=[],solids=[],chapters=[],chunks=new Map(),matrix=new T.Matrix4(),normalMatrix=new T.Matrix3(),object=new T.Object3D();
 let story=null;
 const quiet=Array.from({length:5},(_,chapter)=>['left','right'].map(side=>sectionFor({...e,choices:Array(5).fill(side)},chapter*4,'relaxed',side))).flat();
 const foot=(x,z)=>{for(const s of quiet){if(!s.scenicRise)continue;const p=courseCoordinates(s,{x,z});if(p.s>=0&&p.s<=s.length&&Math.abs(p.lateral)<composedHalfWidth(z)+.1)return scenicSurface(s,p.s,p.lateral)+.035;}return .018;};
 for(const name of ['leaf','leafLight','fern'])windMaterial(materials[name],uniforms);
 const ground=groundMaterial('#ffffff',environmentPalette(area).colors.soil);ground.vertexColors=true;ground.userData.ground.uComposition.value=area===0&&e.adventureVersion===2?1:0;ground.userData.ground.uCanopyShade.value=area===0?.17:area===1?.045:.09;
 const terrainMeshes=[];for(const geometry of buildTerrainChunks(area)){const mesh=new T.Mesh(geometry,ground);mesh.name='sculpted-ground-'+geometry.userData.chunk;mesh.receiveShadow=true;mesh.castShadow=false;root.add(mesh);mesh.updateMatrixWorld(true);terrainMeshes.push(mesh);}
 const meadow=makeMeadowGrass(area,terrainMeshes.map(m=>m.geometry));root.add(meadow);
 const groundRay=new T.Raycaster(new T.Vector3(),new T.Vector3(0,-1,0),0,50),groundY=(x,z)=>{groundRay.ray.origin.set(x,30,z);return (groundRay.intersectObjects(terrainMeshes,false)[0]?.point.y??terrainHeight(x,z,area))-.015;};
 function chunkFor(z){const c=Math.max(0,Math.min(TERRAIN_CHUNKS-1,Math.floor((TERRAIN_BOUNDS.maxZ-z)/((TERRAIN_BOUNDS.maxZ-TERRAIN_BOUNDS.minZ)/TERRAIN_CHUNKS))));if(!chunks.has(c)){const g=new T.Group();g.name='environment-cluster-'+c;g.userData.centerZ=TERRAIN_BOUNDS.maxZ-(c+.5)*((TERRAIN_BOUNDS.maxZ-TERRAIN_BOUNDS.minZ)/TERRAIN_CHUNKS);chunks.set(c,g);root.add(g);}return c;}
 function geometryFor(kind,variant){const key=kind+':'+variant;if(!geometryCache.has(key))geometryCache.set(key,(({rock:rockFormation,trunk:treeTrunk,canopy:treeCanopy,fern:fernCluster,log:fallenLog,masonry:masonryFragment})[kind]?.(variant)||sceneryGeometry(kind)));return geometryCache.get(key);}
 function put(kind,role,x,y,z,sx=1,sy=sx,sz=sx,turn=0,{variant=0,solid=false,detail=false,flex=0,feature=kind,pitch=0,roll=0}={}){
  const geo=geometryFor(kind,variant),c=chunkFor(z),key=[c,role,detail].join(':');object.position.set(x,y,z);object.rotation.set(pitch,turn,roll);object.scale.set(sx,sy,sz);object.updateMatrix();matrix.copy(object.matrix);normalMatrix.getNormalMatrix(matrix);
  const bounds=geo.boundingBox.clone().applyMatrix4(matrix),r=Math.max(Math.abs(bounds.min.x-x),Math.abs(bounds.max.x-x),Math.abs(bounds.min.z-z),Math.abs(bounds.max.z-z)),clearance=environmentClearance(x,z);
  if(solid&&clearance-r<Math.max(3.2,composedHalfWidth(z))+.3)return false;
  if(!batches.has(key))batches.set(key,{c,role,detail,p:[],n:[],color:[],uv:[],flex:[]});const b=batches.get(key),v=new T.Vector3(),n=new T.Vector3(),a=geo.attributes;
  for(let i=0;i<a.position.count;i++){v.fromBufferAttribute(a.position,i).applyMatrix4(matrix);n.fromBufferAttribute(a.normal,i).applyNormalMatrix(normalMatrix);b.p.push(v.x,v.y,v.z);b.n.push(n.x,n.y,n.z);b.color.push(a.color.getX(i),a.color.getY(i),a.color.getZ(i));b.uv.push(a.uv.getX(i),a.uv.getY(i));b.flex.push(flex*smooth(a.position.getY(i)/Math.max(.1,geo.boundingBox.max.y)));}
  placements.push({kind,feature,role,x,y,z,detail,solid,r,clearance,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()}});if(solid)solids.push({x,z,r,top:bounds.max.y,kind:'environment-'+kind});return true;
 }
 // Near-path forms are deliberately broad enough to read from the chase camera.
 // Ferns and shallow embedded chips are soft dressing; hard forms remain beyond
 // the full walkable union so a reloaded save never appears inside a new rock.
 let i=0;
 for(let c=0;c<5;c++)for(const side of ['left','right']){const points=chapterPath(c,side);for(let k=1;k<points.length;k++){const a=points[k-1],b=points[k],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len;
  for(let d=4;d<len-2;d+=6.7+(i%6)*.65){const cx=a.x+dx*d/len,cz=a.z+dz*d/len;if(Math.abs(cz-c*-132)<12)continue;for(const edge of [-1,1]){i++;const width=area===0&&e.adventureVersion===2?composedHalfWidth(cz):3.2,phase=Math.sin(i*2.399),off=width-.35,x=cx+nx*edge*off,z=cz+nz*edge*off;
   if(i%3!==0){const wall=i%2===0,fx=wall?cx+nx*edge*(width+.12):x,fz=wall?cz+nz*edge*(width+.12):z;put('fern','fern',fx,foot(fx,fz)+(wall?1.55:0),fz,wall?.58:.48,wall?.72:.66,.55,phase,{variant:i%3,detail:i%3===2,flex:wall?.04:.07,feature:wall?'wall-fronds':'verge-fronds',pitch:wall?Math.PI:0});}
   if(i%2===0)put('rock',i%4?'rock':'rockTop',x,foot(x,z)-.07,z,.24,.10,.36,phase,{variant:i%4,feature:'embedded-stone'});
   const outward=width+3.3+(i%3)*.6,rx=cx+nx*edge*outward,rz=cz+nz*edge*outward,base=groundY(rx,rz);
   if(i%4===0)put('rock','rock',rx,base-.12,rz,1.25,1.65+(i%3)*.4,1.2,phase,{variant:i%4,solid:true,feature:'bank-outcrop'});
   if(i%9===0)put('log','timber',rx,base,rz,1.0,.8,1,phase,{variant:i%3,solid:true,feature:'fallen-timber'});
  }}
 }}
 // Authored stands cluster around approach/rest pockets, leaving each main
 // reveal quiet. Near-path grass, ferns and embedded chips remain intact.
 for(const t of plan.trees){const {x,z,variant:v,turn}=t,h=groundY(x,z),scale=t.scale*(area===1?.92:area===2?1.02:1.08),heightScale=scale*(area===1?1.10:1);const planted=put('trunk','bark',x,h,z,scale,heightScale,scale,turn,{variant:v,solid:true,feature:['buttress-tree','wind-tree','silver-tree'][area]});if(planted&&t.crown){const y=h+2.15*heightScale;put('canopy',t.variant%3?'leaf':'leafLight',x,y,z,scale*(area===1?.78:1),scale*(area===2?.77:1),scale,turn,{variant:v,flex:.055,feature:'layered-canopy'});if(t.variant===0)put('canopy','leafLight',x+.65*scale,y+.8*scale,z-.3,scale*.65,scale*.65,scale*.65,turn+.6,{variant:(v+1)%4,flex:.035,feature:'sunlit-crown'});}if(planted&&t.variant%2===0){for(const n of[-1,1]){if(t.variant===0&&n===-1)put('fern','fern',x+n*.9,groundY(x+n*.9,z+.6),z+.6,.54,.58,.54,turn+n,{variant:v,detail:true,flex:.05,feature:'stand-understory'});put('rock','rockTop',x+n*1.6,groundY(x+n*1.6,z-.5)-.07,z-.5,.50,.26,.55,turn,{variant:v,detail:true,feature:'root-stone'});}}if(t.variant===0)put('rock','rockTop',x+(x<0?-1:1)*2.3,h,z+1.7,2.0,1.05,1.65,turn,{variant:v,solid:true,feature:'weathered-shelf'});}
 for(const scene of plan.scenes){authorScenery(scene,{put,groundY});if(area>0)chunks.get(chunkFor(scene.focus.z)).userData.focusZ=scene.focus.z;}
 // Ruined low walls and channel basins give each chapter a local landmark.
 // Their broad stone feet physically support the raised water surface.
 for(let c=0;c<5;c++){
  const basin=plan.scenes[c].basin,sign=basin.x<0?-1:1,x=basin.x,z=basin.z,h=groundY(x,z),height=basin.height;
  const round=basin.shape==='pool';put(round?'column':'box','masonry',x,h-.04,z,round?basin.width*1.27+.18:basin.width*2.5+.4,height+.04,round?basin.depth*1.27+.18:basin.depth*2.5+.4,0,{solid:true,feature:'channel-foundation'});
  for(const n of[-1,1])put(area===0?'rock':'masonry',area===0?'rock':'masonry',x+n*(basin.width+.35),h-.08,z+.6,.65,height*.55,.7,n*.2,{variant:(c+1)%3,solid:true,feature:'basin-buttress'});
  const pedestal=new T.Group();pedestal.position.set(x,h+height+.04,z);pedestal.name='restoration-basin-'+c;chunks.get(chunkFor(z)).add(pedestal);
  if(c===1&&area===0){story=makeAqueductStory({area,baseY:h});pedestal.visible=false;root.add(story.root);}
  const water=new T.Mesh(round?new T.CircleGeometry(1.25,16):new T.PlaneGeometry(2.5,2.5),materials.water);water.rotation.x=-Math.PI/2;water.scale.set(basin.width,basin.depth,1);water.position.y=.02;water.name='restored-water';pedestal.add(water);
  if(round){const lip=new T.Mesh(new T.TorusGeometry(1.27,.10,4,20),materials.masonry);lip.rotation.x=-Math.PI/2;lip.scale.set(basin.width,basin.depth,1);pedestal.add(lip);}else{for(const n of[-1,1]){put('box','masonry',x,h+height-.03,z+n*basin.depth*1.25,basin.width*2.5+.12,.14,.12,0,{feature:'basin-coping'});put('box','masonry',x+n*basin.width*1.25,h+height-.03,z,.12,.14,basin.depth*2.5+.12,0,{feature:'basin-coping'});}}
  const spill=new T.Mesh(new T.PlaneGeometry(.40,height-.15),materials.water);spill.position.set(-sign*basin.width*1.26,-height*.5,0);spill.rotation.y=-sign*Math.PI/2;pedestal.add(spill);
  const foam=new T.Mesh(new T.TorusGeometry(.9,.018,3,18),materials.foam);foam.rotation.x=-Math.PI/2;foam.position.y=.035;foam.scale.set(basin.width,basin.depth,1);pedestal.add(foam);
  const target=(e.completed||[]).filter(r=>Math.floor(r.index/4)===c).length/4;chapters.push({chapter:c,water,spill,foam,fill:target,target,baseScale:water.scale.clone(),foamScale:foam.scale.clone(),basin:{...basin}});
 }
 let triangles=0;
 for(const b of batches.values()){const g=new T.BufferGeometry();for(const [name,array,size]of [['position',b.p,3],['normal',b.n,3],['color',b.color,3],['uv',b.uv,2],['environmentFlex',b.flex,1]])g.setAttribute(name,new T.Float32BufferAttribute(array,size));g.computeBoundingBox();g.computeBoundingSphere();const mesh=new T.Mesh(g,materials[b.role]);mesh.name='environment-'+b.role+'-'+b.c+(b.detail?'-detail':'');mesh.userData={detail:b.detail,environmentRole:b.role};mesh.castShadow=['bark','masonry','timber'].includes(b.role);mesh.receiveShadow=true;chunks.get(b.c).add(mesh);triangles+=b.p.length/9;}
 for(const geo of geometryCache.values())geo.dispose();
 root.userData={area,composition:plan,placements,solids,stats:{triangles,batches:batches.size,terrainTriangles:43200,trees:placements.filter(p=>p.kind==='trunk').length,ferns:placements.filter(p=>p.kind==='fern').length},enriched:true,terrainVersion:e.terrainVersion||0};
 Object.defineProperty(root,'_environment',{value:{materials,ground,terrainMeshes,meadow,story,uniforms,chunks:[...chunks.values()],chapters,clock:0},enumerable:false});
 updateEnvironmentField(root,{player:e.position||START,completed:e.completed||[],expedition:e,dt:0});return root;
}

export function updateEnvironmentField(root,{player=START,dt=0,completed=[],preset='balanced',strength=0,reduced=false,active=true,expedition=null,threat=false}={}){
 const s=root?._environment;if(!s)return;const step=Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0));if(active&&!reduced)s.clock+=step;
 s.uniforms.uEnvironmentTime.value=s.clock;s.uniforms.uEnvironmentMotion.value=reduced?0:preset==='low'?.35:1;s.uniforms.uEnvironmentFocus.value.set(player.x,player.z);s.uniforms.uEnvironmentQuiet.value=Math.max(0,Math.min(1,strength));
 updateMeadowGrass(s.meadow,{player,time:s.clock,preset,reduced,strength});
 s.story?.update(step,{expedition,completed,player,active,reduced,threat});
 const flow=s.materials.water.userData.environmentFlow;flow.texture.offset.set((s.clock*flow.speedX)%1,(s.clock*flow.speedY)%1);
 for(const g of s.chunks){g.visible=Math.abs(player.z-g.userData.centerZ)<(preset==='low'?91:125)||Number.isFinite(g.userData.focusZ)&&Math.abs(player.z-g.userData.focusZ)<(preset==='low'?110:140);for(const m of g.children)if(m.userData.detail)m.visible=preset!=='low'&&strength<.65;}
 for(const c of s.chapters){c.target=completed.filter(r=>Math.floor(r.index/4)===c.chapter).length/4;c.fill+=(c.target-c.fill)*(reduced?1:1-Math.exp(-step*3));const fill=Math.max(.02,c.fill);c.water.scale.copy(c.baseScale).multiplyScalar(.45+fill*.55);c.spill.visible=c.fill>.24;c.spill.scale.y=.2+fill*.8;c.foam.visible=preset!=='low'&&c.fill>.05&&strength<.7;c.foam.scale.copy(c.foamScale).multiplyScalar(.65+fill*.35);}
}
