import{stretchZ}from'./runner-mode.js';
// The channel keeps its shape; runner mode only moves it along with the stretched route.
const AQUEDUCT_Z=stretchZ(-165);
import * as T from './vendor/three.module.min.js';
import{makeAqueductChannel}from'./aqueduct-channel.js';import{makeSpringVisitor}from'./spring-visitor.js';import{bevelBox,carvedCylinder}from'./prop-art.js';import{makeEnvironmentMaterials}from'./environment-materials.js';import{orderFor}from'./expedition.js';import{taskFraction}from'./trail-tasks.js';import{mergeGeometries}from'./vendor/utils/BufferGeometryUtils.js';
const clamp=v=>Math.max(0,Math.min(1,v));
// Answers remain the only source of restoration. No parallel save or reward.
export function aqueductProgress(e,completed=e?.completed||[]){
 const records=completed.filter(c=>Math.floor(c.index/4)===1);
 if(e&&orderFor(e,1).includes('sentence')){
  if(records.some(c=>c.type==='sentence'))return 1;
  const t=e.active;if(t?.type==='sentence'&&t.nodeId===`${e.id}:${e.index}`&&Math.floor(e.index/4)===1)return taskFraction(t);
  return 0;
 }
 return clamp(records.length/4);
}
export function makeAqueductStory({area=0,baseY=0}={}){
 const root=new T.Group();root.name='aqueduct-living-encounter';root.position.y=baseY;
 const channel=makeAqueductChannel({area});channel.root.position.set(19.5,3.28,AQUEDUCT_Z);root.add(channel.root);
 const visitor=makeSpringVisitor(area),a=channel.state.anchors.basin,d=visitor.root.userData.drinkPoint;
 const wildlife=new T.Group();wildlife.position.copy(channel.root.position);root.add(wildlife);visitor.root.position.set(a.x-d.x,a.y-d.y,a.z-d.z);wildlife.add(visitor.root);
 const all=makeEnvironmentMaterials(area),stone=all.masonry,water=all.water;stone.vertexColors=false;water.vertexColors=false;
 for(const m of Object.values(all))if(m!==stone&&m!==water)m.dispose();
 const construction=new T.Group(),routeWater=new T.Group();root.add(construction,routeWater);
 const floor=bevelBox(1.7,.14,1.3),ledge=new T.Mesh(floor,stone);ledge.position.set(a.x-.12,a.y-d.y-.07,a.z+.65);wildlife.add(ledge);
 const from=new T.Vector3(16,11.9-baseY,AQUEDUCT_Z-36),to=new T.Vector3(19.5-1.85*1.28,3.28+1.23*1.28,AQUEDUCT_Z-.3*1.28),length=from.distanceTo(to),axis=to.clone().sub(from).normalize();
 const beam=(g,m,p)=>{const mesh=new T.Mesh(g,m);mesh.position.copy(p);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),axis);mesh.castShadow=m!==water;mesh.receiveShadow=true;(m===water?routeWater:construction).add(mesh);return mesh;};
 const middle=from.clone().lerp(to,.5);beam(bevelBox(.75,length,.13),stone,middle.clone().add(new T.Vector3(0,-.10,0)));
 for(const x of[-.38,.38])beam(bevelBox(.10,length,.32),stone,middle.clone().add(new T.Vector3(x,.03,0)));
 beam(bevelBox(.52,length,.025),water,middle.clone().add(new T.Vector3(0,.04,0)));
 for(const f of[.15,.45,.75]){const p=from.clone().lerp(to,f),h=p.y+baseY-.22,post=new T.Mesh(carvedCylinder(.20,.32,h,8),stone);post.position.set(p.x,h/2-baseY,p.z);construction.add(post);}
 // Static flume supports batch into one draw. The moving channel/visitor keep pivots.
 construction.updateMatrixWorld(true);const parts=[];for(const o of construction.children){const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrix);parts.push(g);}const merged=mergeGeometries(parts);const originals=construction.children.map(o=>o.geometry);construction.clear();const stonework=new T.Mesh(merged,stone);stonework.castShadow=true;stonework.receiveShadow=true;construction.add(stonework);parts.forEach(g=>g.dispose());originals.forEach(g=>g.dispose());
 const state={progress:0,time:0,routeId:null,side:'left',restored:false};
 function update(dt,{expedition=null,completed=expedition?.completed||[],player={x:0,z:0},active=true,reduced=false,threat=false}={}){
  const progress=aqueductProgress(expedition,completed),side=expedition?.choices?.[1]||'left';root.scale.x=side==='left'?-1:1;const distance=Math.hypot(player.x-root.scale.x*19.5,player.z-AQUEDUCT_Z);root.visible=distance<105;
  if(active&&!reduced)state.time+=Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0));
  channel.update(progress,state.time,{reduced});routeWater.visible=progress>0;if(expedition?.id&&state.routeId!==expedition.id){visitor.state.initialized=false;visitor.update(0,{restored:progress,active:true,reduced,playerDistance:distance,noticeRadius:12,threat});}visitor.update(dt,{restored:progress,active:active&&root.visible,reduced,playerDistance:distance,noticeRadius:12,threat});
  state.progress=progress;state.restored=progress===1;state.side=side;state.routeId=expedition?.id||null;return state;
 }
 root.userData={benchmark:'aqueduct',chapter:1,source:'saved-language-work',solids:[],flumeFrom:from.toArray(),flumeTo:to.toArray()};
 return{root,channel,visitor,state,update};
}
