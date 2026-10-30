import * as T from './vendor/three.module.min.js';
import {bevelBox,carvedCylinder} from './prop-art.js';
import {makeEnvironmentMaterials} from './environment-materials.js';
import {mergeGeometries} from './vendor/utils/BufferGeometryUtils.js';

const clamp=n=>Math.max(0,Math.min(1,Number.isFinite(n)?n:0));
const smooth=n=>n*n*(3-2*n);

// +X is downstream. All supports start at ground; no invisible gameplay solids
// are introduced. The task and world vignette consume the same saved fraction.
export function makeAqueductChannel({area=0,compact=false}={}){
 const root=new T.Group();root.name='restoration-aqueduct';root.userData={mechanism:'three-stage-aqueduct',compact,flowDirection:'+X',grounded:true};
 root.scale.setScalar(compact?1:1.28);
 const all=makeEnvironmentMaterials(area),materials={stone:all.masonry,dark:all.damp,wood:all.timber,metal:all.metal,water:all.water,foam:all.foam};
 for(const [name,mat]of Object.entries(all))if(!Object.values(materials).includes(mat))mat.dispose();
 const cache=new Map(),statics=new T.Group();statics.name='supported-channel-construction';root.add(statics);
 const geo=(key,make)=>{if(!cache.has(key))cache.set(key,make());return cache.get(key);};
 const box=(w,h,d)=>geo(`b:${w}:${h}:${d}`,()=>bevelBox(w,h,d));
 const cyl=(r,h,n=12)=>geo(`c:${r}:${h}:${n}`,()=>carvedCylinder(r,r,h,n));
 const torus=(r,t)=>geo(`t:${r}:${t}`,()=>new T.TorusGeometry(r,t,5,16));
 const mesh=(g,m,x=0,y=0,z=0,parent=statics,name='')=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.name=name;o.castShadow=m!==materials.water&&m!==materials.foam;o.receiveShadow=true;parent.add(o);return o;};
 // Batch a single rigid assembly by material. Animated assemblies keep their
 // own local transforms; geometry, maps and materials are never rebuilt.
 function batch(group){
  group.updateMatrixWorld(true);const sets=new Map();group.userData.parts=group.children.filter(o=>o.isMesh).map(o=>o.name).filter(Boolean);
  for(const o of [...group.children])if(o.isMesh){o.updateMatrix();const g=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(o.matrix);if(!sets.has(o.material))sets.set(o.material,[]);sets.get(o.material).push(g);group.remove(o);}
  for(const [material,parts]of sets){const g=mergeGeometries(parts);for(const p of parts)p.dispose();const o=mesh(g,material,0,0,0,group,'crafted-assembly');o.userData.assembly=group.name;}
 }
 // Inlet is a real raised source chamber, with a low spill opening, arch
 // cap, recessed water and a vertical metal gate carried by two stone jambs.
 mesh(box(.53,1.74,.16),materials.stone,-1.88,.87,-.59,statics,'spring-headwall');
 mesh(box(.62,.15,.66),materials.stone,-1.88,1.83,-.53);
 mesh(box(.38,.52,.06),materials.dark,-1.88,1.34,-.495,statics,'inlet-recess');
 for(const z of[-.55,-.05])mesh(box(.13,.65,.08),materials.stone,-1.585,1.44,z);
 mesh(box(.15,.09,.66),materials.stone,-1.585,1.81,-.30);
 mesh(box(.54,.12,.50),materials.stone,-1.83,1.175,-.29,statics,'inlet-sill');
 mesh(box(.54,.024,.37),materials.water,-1.83,1.303,-.30,statics,'source-water');
 mesh(box(.62,.14,.66),materials.stone,-1.88,.07,-.53);
 const sluice=mesh(box(.065,.39,.34),materials.metal,-1.585,1.41,-.30,root,'sluice-slider');
 const spindle=mesh(cyl(.025,.68,6),materials.metal,-1.585,1.75,-.30);spindle.name='sluice-spindle';
 mesh(torus(.125,.025),materials.metal,-1.585,2.07,-.30).rotation.x=Math.PI/2;
 // Every trough is carried on a transverse hinge and a grounded masonry pier.
 const segments=[],water=[],ripples=[];
 for(let i=0;i<3;i++){
  const x=(i-1)*1.04,z=-.30;
  mesh(box(.66,.15,.79),materials.stone,x,.075,z,statics,'pier-footing-'+i);
  mesh(box(.31,.83,.39),materials.stone,x,.565,z,statics,'grounded-pier-'+i);
  mesh(box(.60,.13,.68),materials.stone,x,1.045,z,statics,'pier-cap-'+i);
  for(const side of[-1,1]){
   mesh(box(.12,.23,.16),materials.metal,x,1.15,z+side*.30,statics,'hinge-socket-'+i);
   mesh(cyl(.075,.14,8),materials.metal,x,1.15,z+side*.29).rotation.x=Math.PI/2;
  }
  const shaft=mesh(cyl(.045,.79,8),materials.metal,x,1.15,z);shaft.rotation.x=Math.PI/2;
  const group=new T.Group();group.name='aligning-trough-'+i;group.position.set(x,1.15,z);root.add(group);
  mesh(box(1.065,.11,.54),materials.stone,0,.08,0,group,'trough-floor');
  for(const side of[-1,1]){
   mesh(box(1.065,.20,.075),materials.stone,0,.205,side*.235,group,'trough-wall');
   mesh(box(.085,.21,.085),materials.metal,-.32,.20,side*.237,group);
   mesh(box(.085,.21,.085),materials.metal,.32,.20,side*.237,group);
  }
  // Matching triangular teeth visually seat into the stationary cap.
  mesh(box(.17,.12,.30),materials.metal,0,-.02,0,group,'alignment-key');batch(group);
  const flow=mesh(box(1.065,.026,.38),materials.water,0,.153,0,group,'restored-flow-'+i);flow.castShadow=false;
  const ripple=mesh(box(.065,.006,.24),materials.foam,-.4,.17,0,group,'flow-highlight-'+i);ripple.castShadow=false;
  segments.push(group);water.push(flow);ripples.push(ripple);
 }
 // A masonry basin holds the waterwheel instead of a floating reward effect.
 const bx=1.80,bz=-.30;
 mesh(box(.68,.12,.75),materials.stone,bx,.06,bz,statics,'basin-footing');
 mesh(box(.48,.24,.52),materials.stone,bx,.23,bz,statics,'basin-pedestal');
 mesh(box(.68,.11,.72),materials.stone,bx,.405,bz,statics,'basin-floor');
 for(const side of[-1,1]){mesh(box(.075,.20,.73),materials.stone,bx+side*.30,.53,bz);mesh(box(.67,.20,.075),materials.stone,bx,.53,bz+side*.325);}
 const basinWater=mesh(box(.52,.018,.55),materials.water,bx,.498,bz,root,'restored-basin-water');basinWater.castShadow=false;
 const outlet=mesh(box(.052,.86,.19),materials.water,1.59,.91,bz,root,'outlet-cascade');outlet.castShadow=false;
 const wheel=new T.Group();wheel.name='powered-waterwheel';wheel.position.set(1.70,.91,-.30);wheel.scale.setScalar(.88);root.add(wheel);
 for(const z of[-.135,.135])mesh(torus(.353,.036),materials.wood,0,0,z,wheel);
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4,spoke=mesh(box(.045,.66,.045),materials.wood,0,0,.04,wheel);spoke.rotation.z=a;
  const paddle=mesh(box(.14,.09,.36),materials.wood,Math.sin(a)*.35,Math.cos(a)*.35,0,wheel);paddle.rotation.z=-a;
 }
 mesh(cyl(.09,.43,10),materials.metal,0,0,0,wheel).rotation.x=Math.PI/2;batch(wheel);
 for(const z of[-.56,-.04]){mesh(box(.10,.45,.12),materials.metal,1.70,.72,z);mesh(cyl(.095,.09,8),materials.metal,1.70,.91,z).rotation.x=Math.PI/2;}
 batch(statics);
 // Public state is stable and reused. Consumers can inspect restored sections
 // without traversing geometry or inferring success from cosmetic motion.
 const scale=compact?1:1.28,anchors={basin:{x:1.80*scale,y:.50*scale,z:-.30*scale},visitor:{x:1.80*scale,y:0,z:.65*scale}};
 const state={anchors,progress:0,segments:[0,0,0],aligned:[false,false,false],flow:[false,false,false],sluice:0,basin:false,powered:false,restored:false,reduced:false};
 function update(progress,time=0,{reduced=false}={}){
  const p=clamp(progress),t=Number.isFinite(time)?time:0;state.progress=p;state.reduced=!!reduced;let upstream=true;
  for(let i=0;i<3;i++){
   const f=clamp(p*3-i),q=smooth(f),aligned=f>=1;state.segments[i]=f;state.aligned[i]=aligned;
   segments[i].rotation.z=aligned?0:(i%2?-.24:.22)*(1-q);
   state.flow[i]=upstream&&aligned;upstream=state.flow[i];water[i].visible=state.flow[i];ripples[i].visible=state.flow[i];
   ripples[i].position.x=reduced?0:-.42+((t*.31+i*.23)%1+1)%1*.84;
  }
  state.sluice=state.aligned[0]?1:0;sluice.position.y=1.41+state.sluice*.34;
  state.basin=state.flow[2];state.powered=state.basin;state.restored=p===1;
  basinWater.visible=outlet.visible=state.basin;wheel.rotation.z=state.powered&&!reduced?-t*.92:0;
  return state;
 }
 update(0);const usedGeometry=new Set(),usedMaterials=new Set();root.traverse(o=>{if(o.isMesh){usedGeometry.add(o.geometry);usedMaterials.add(o.material);}});for(const g of cache.values())if(!usedGeometry.has(g))g.dispose();root.userData.resourceCounts={geometries:usedGeometry.size,materials:usedMaterials.size};
 return{root,update,state,materials:[...usedMaterials]};
}
