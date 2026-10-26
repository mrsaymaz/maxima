import * as T from './vendor/three.module.min.js';
import {activity} from './expedition.js';
import {chapterPath} from './trail-layout.js';
import{makeTrailProp,setTrailPropProgress}from'./trail-props.js';import{taskFraction}from'./trail-tasks.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const FAMILIES={translation:'rune',definition:'pillar',picture:'crate','qa-pairs':'message',halves:'bridge',ending:'fruit',sentence:'bridge',gap:'channel',correct:'sign',repair:'seal',answer:'message',sort:'shelf',intruder:'root',spelling:'mushroom',clue:'cache','listen-word':'flower','listen-tr':'crystal','listen-multi':'bowl',numbers:'scale',instructions:'pack'};

// Every entry is a physical piece in the scene, with its own world-space anchor.
// The HTML is only a sharp, accessible text/hit layer projected onto that piece.
function raised(p){for(const e of p.entries)e.y+=1.1;p.height+=1.1;return p;}
export function mechanismPlan(t){
 const a=activity(t.type),p={type:t.type,family:FAMILIES[t.type],caption:a.object,entries:[],links:[],height:6.5,width:6.15};
 const add=(key,text,x,y,w=2.65,h=1.04,extra={})=>p.entries.push({key,text,x,y,z:.28,w,h,...extra});
 if(t.complete){add('complete','The way is open',0,3.2,4.6,1,{role:'inscription',done:true});return raised(p);}
 if(t.kind==='pairs'){
  add('instruction',t.type==='listen-tr'?'Touch a crystal to hear its word. Connect its meaning.':t.type==='halves'?'Join the logs to make complete sentences.':'Connect the matching pieces.',0,5.8,5.6,.72,{role:'inscription'});
  for(const [column,order]of[['left',t.leftOrder],['right',t.rightOrder]])order.forEach((i,row)=>{const v=t.pairs[i],done=t.matched.includes(i),key=column+'-'+i;
   add(key,column==='left'?(v.spoken&&!t.showSpeech?'♪ Listen':v.left):(v.image?'':v.right),column==='left'?-1.53:1.53,4.65-row*1.22,2.68,1.05,{action:'pair-'+column,index:i,image:column==='right'?v.image:null,context:column==='left'?v.context:null,selected:column==='left'&&t.selected===i,done,disabled:done,spoken:column==='left'?v.spoken:null});
  });
  for(const i of t.matched)p.links.push(['left-'+i,'right-'+i]);
  return raised(p);
 }
 const q=t.rounds[t.round],spoken=q.spoken;
 let prompt=spoken?(t.showSpeech?spoken:'Listen to the request in the mechanism.'):q.prompt;
 if(q.context)prompt+='\n'+q.context;
 if(q.kind==='blocks'){
  const rows=Math.ceil(q.blocks.length/2),top=rows*1.02+2.8;p.height=top+.8;
  add('instruction',prompt,0,top,5.55,.85,{role:'inscription'});
  add('built',t.used.length?t.used.map(i=>q.blocks[i].text).join(' '):'Fit the first sentence piece.',0,top-1.0,5.55,.75,{role:'assembled',done:t.used.length>0});
  q.blocks.forEach((b,i)=>{const used=t.used.includes(i),at=used?t.used.indexOf(i):i;add('block-'+i,b.text,(i%2?1:-1)*1.5,top-2.12-Math.floor(i/2)*1.02,2.65,.84,{action:'block',index:i,done:used,disabled:used,placed:used,order:used?at+1:null});});
 }else if(q.kind==='repair'&&!t.repairFound){
  add('instruction','Touch the faulty word or phrase in the seal.',0,5.8,5.55,.72,{role:'inscription'});
  const at=q.prompt.indexOf(q.broken),parts=at<0?[q.prompt]:[q.prompt.slice(0,at),q.broken,q.prompt.slice(at+q.broken.length)],words=parts.flatMap((part,i)=>i===1?[part]:part.trim().split(/\s+/).filter(Boolean)),rows=Math.ceil(words.length/3),top=rows*.9+1.6;p.height=Math.max(6.5,top+1.8);p.entries[0].y=p.height-.7;
  words.forEach((word,i)=>add('fault-'+i,word,(i%3-1)*1.92,top-Math.floor(i/3)*.94,1.72,.90,{action:'find',textValue:word}));
 }else{
  const options=q.options,rows=Math.ceil(options.length/2),top=Math.max(5.8,rows*1.18+2.7);p.height=top+.8;
  add('inscription',q.kind==='repair'?q.prompt+'\nChoose the repair piece.':prompt,0,top,5.55,1.05,{role:'inscription'});
  if(spoken)add('voice','♪ Touch to listen',0,top-1.1,3.3,.86,{action:'listen',textValue:spoken,role:'voice'});
  const first=top-(spoken?2.25:1.55);
  options.forEach((text,i)=>add('option-'+i,text,(i%2?1:-1)*1.52,first-Math.floor(i/2)*1.22,2.68,1.04,{action:['multi','sequence'].includes(q.kind)?'pick':'choice',textValue:text,selected:t.picked.includes(text),order:q.kind==='sequence'&&t.picked.includes(text)?t.picked.indexOf(text)+1:null}));
  if(['multi','sequence'].includes(q.kind))add('confirm',q.kind==='sequence'?'Secure the ordered pack':'Deliver selected supplies',0,1.2,4.0,.90,{action:'confirm',role:'confirm'});
 }
 return raised(p);
}

export function mechanismMarkup(plan){return `<div class="world-pieces" aria-label="${esc(plan.caption)} interactive mechanism">${plan.entries.map(e=>`<${e.action?'button':'div'} class="world-piece ${e.role||''} ${e.selected?'selected':''} ${e.done?'joined':''} ${e.placed?'laid-piece':''}" data-anchor="${esc(e.key)}" ${e.action?`type="button" data-do="${e.action}"${['pair-left','pick'].includes(e.action)?` aria-pressed="${!!e.selected}"`:''}${e.index!==undefined?` data-index="${e.index}"`:''}${e.textValue!==undefined?` data-text="${esc(e.textValue)}"`:''}${e.disabled?' disabled aria-disabled="true"':''}`:''} style="visibility:hidden">${e.image?`<img src="${esc(e.image)}" alt="Picture option" draggable="false">`:''}<span>${esc(e.text)}</span>${e.context?`<small>${esc(e.context)}</small>`:''}${e.order?`<b class="piece-order">${e.order}</b>`:''}${e.done?'<i aria-hidden="true">✓</i>':''}</${e.action?'button':'div'}>`).join('')}</div>`;}

function material(color,emissive=false){return new T.MeshStandardMaterial({color,roughness:.82,emissive:emissive?color:'#000000',emissiveIntensity:emissive?.28:0});}
function mesh(group,geometry,mat,x,y,z){const m=new T.Mesh(geometry,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
function strut(group,a,b,r,mat){const delta=b.clone().sub(a),m=mesh(group,new T.CylinderGeometry(r,r,delta.length(),6),mat,0,0,0);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return m;}
function dispose(group){const geometries=new Set(),materials=new Set(group._mechanismMaterials||[]);group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}

const structure=p=>JSON.stringify([p.family,p.height,p.entries.map(e=>[e.key,e.w,e.h,e.role,e.action])]);
function piecePose(e){const position=new T.Vector3(e.x,e.y,e.z+(e.selected?.16:0)),scale=new T.Vector3(1,1,1),quaternion=new T.Quaternion();if(e.placed){position.set(-.80+((e.order-1)%3)*.8,.20+Math.floor((e.order-1)/3)*.12,1.2+Math.floor((e.order-1)/3)*.65);scale.set(.34,.24,1.8);quaternion.setFromAxisAngle(new T.Vector3(1,0,0),-Math.PI/2);}return{position,scale,quaternion};}
// Four transformed corners keep hit regions aligned while pieces turn or dock.
function projectedPieces(entries,camera,bounds){
 const pieces=[];
 for(const[key,v]of entries){const e=v.entry,m=v.mesh,center=m.getWorldPosition(new T.Vector3()).project(camera),corners=[];for(const x of[-e.w/2,e.w/2])for(const y of[-e.h/2,e.h/2])corners.push(m.localToWorld(new T.Vector3(x,y,.17)).project(camera));const xs=corners.map(p=>(p.x*.5+.5)*bounds.width+bounds.left),ys=corners.map(p=>(-p.y*.5+.5)*bounds.height+bounds.top),x=(Math.min(...xs)+Math.max(...xs))/2,y=(Math.min(...ys)+Math.max(...ys))/2,w=Math.max(...xs)-Math.min(...xs),h=Math.max(...ys)-Math.min(...ys),active=!!e.action&&!e.disabled&&!e.placed;pieces.push({key,v,x,y,w:Math.max(active?44:8,w*.96),h:Math.max(active?44:8,h*.94),active,visible:center.z>-1&&center.z<1&&Math.abs(center.x)<1.1&&Math.abs(center.y)<1.1});}
 const active=pieces.filter(p=>p.active&&p.visible),gap=2;
 for(const p of active){p.w=Math.max(8,Math.min(p.w,2*Math.min(p.x-bounds.left-5,bounds.left+bounds.width-5-p.x)));p.h=Math.max(8,Math.min(p.h,2*Math.min(p.y-bounds.top-5,bounds.top+bounds.height-5-p.y)));}
 for(let pass=0;pass<2;pass++)for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++){const a=active[i],b=active[j],dx=Math.abs(a.x-b.x),dy=Math.abs(a.y-b.y);if(dx+1e-5>=(a.w+b.w)/2+gap||dy+1e-5>=(a.h+b.h)/2+gap)continue;const horizontal=dx/Math.max(1,(a.w+b.w)/2)>=dy/Math.max(1,(a.h+b.h)/2),key=horizontal?'w':'h',space=Math.max(8,(horizontal?dx:dy)-gap),factor=Math.min(1,space/((a[key]+b[key])/2));a[key]*=factor;b[key]*=factor;}
 return pieces;
}

export class WorldMechanism{
 constructor(scene){this.effects=[];this.departures=[];this.connectionAnimations=[];this.linkMap=new Map();this.scene=scene;this.root=null;this.entries=new Map();}
 render(t,node){this.hitNodes=null;this.projectionAge=1;
  const nextPlan=mechanismPlan(t);if(!t.complete&&this.root&&this.id===t.nodeId&&this.type===t.type&&structure(nextPlan)===structure(this.plan))return this.sync(t,nextPlan,node);
  const previous=new Map([...this.entries].map(([k,v])=>[k,v.mesh.position.clone()])),oldRoot=this.root,oldId=this.id;if(t.complete&&oldRoot&&oldId===t.nodeId){this.departures.push({mesh:oldRoot,age:0});this.root=null;}this.clear(true);
  this.id=t.nodeId;this.type=t.type;this.plan=nextPlan;this.node=node;this.linkMap=new Map();this.root=new T.Group();this.root.name='world-mechanism-'+t.type;const path=node.side?chapterPath(node.chapter,node.side):null,previousPoint=path?.[node.index%4+1],back=new T.Vector3(previousPoint?previousPoint.x-node.x:0,0,previousPoint?previousPoint.z-node.z:1).normalize();this.back=back;this.root.position.set(node.x+back.x*1.35,0,node.z+back.z*1.35);this.root.rotation.y=Math.atan2(back.x,back.z);this.scene.add(this.root);
  const p=this.plan,stone=material('#d0c8ab'),wood=material('#a88659'),dark=material('#345648'),edge=material('#655c43'),green=material('#9ccca9',true),gold=material('#e3bc76'),families=['rune','pillar','seal','crystal','scale'],organic=['fruit','root','flower','mushroom'];
  this.palette={stone,wood,dark,edge,green,gold};this.root._mechanismMaterials=Object.values(this.palette);this.families=families;this.entries=new Map();this.object=makeTrailProp(t.type);setTrailPropProgress(this.object,taskFraction(t));this.object.position.z=-.38;if(t.type==='ending'){this.object.scale.setScalar(1.5);this.object.position.z=-1.6;}this.root.add(this.object);
  // Separate uprights, branches, shelves and sockets: there is no floating quiz panel.
  if(!t.complete)for(const side of[-1,1]){
   if(organic.includes(p.family)){strut(this.root,new T.Vector3(0,.1,-.6),new T.Vector3(side*2.45,p.height-.6,-.15),.17,wood);}
   else if(t.kind==='pairs'&&families.includes(p.family)){mesh(this.root,new T.BoxGeometry(2.90,p.height-.9,.52),dark,side*1.53,(p.height-.9)/2,-.20);for(const y of[.18,p.height-1.08])mesh(this.root,new T.BoxGeometry(3.02,.26,.68),stone,side*1.53,y,-.18);mesh(this.root,new T.OctahedronGeometry(.25),gold,side*1.53,p.height-.58,-.12);}
   else mesh(this.root,new T.CylinderGeometry(.12,.21,p.height-.5,7),families.includes(p.family)?stone:wood,side*2.8,(p.height-.5)/2,-.25);
  }
  for(const e of p.entries){
   const g=new T.Group();g.name='piece-'+e.key;g.position.set(e.x,e.y,e.z+(e.selected?.14:0));this.root.add(g);const surface=e.done?green:e.selected?gold:families.includes(p.family)?stone:wood;let face;
   if(e.role==='inscription'||e.role==='assembled'){
    const plaque=mesh(g,new T.BoxGeometry(e.w,e.h,.16),e.role==='assembled'?dark:stone,0,0,0);plaque.userData.role='engraved-inscription';face=plaque;
   }else{
    mesh(g,new T.BoxGeometry(e.w+.08,e.h+.08,.21),edge,0,0,-.05);
    face=mesh(g,new T.BoxGeometry(e.w,e.h,.12),surface,0,0,.06);
    if(['crate','shelf','bowl','pack','cache'].includes(p.family))mesh(g,new T.BoxGeometry(e.w+.14,.12,.45),wood,0,-e.h/2-.06,-.08);
    if(['fruit','flower','mushroom'].includes(p.family)){
     const fruit=mesh(g,p.family==='fruit'?new T.IcosahedronGeometry(.22,1):new T.SphereGeometry(.22,8,6),p.family==='mushroom'?material('#aa788a'):gold,-e.w/2+.06,e.h/2+.14,-.1);fruit.scale.y=p.family==='flower'?.65:1;strut(this.root,new T.Vector3(e.x,e.y+e.h/2+.2,-.05),new T.Vector3(e.x,p.height-.4,-.1),.025,wood);
    }
    if(p.family==='root')strut(this.root,new T.Vector3(e.x-e.w/2,e.y-.3,-.15),new T.Vector3(e.x+e.w/2,e.y+.3,-.15),.08,dark);
    if(p.family==='crystal'){for(const side of[-1,1]){const crystal=mesh(g,new T.OctahedronGeometry(.18),green,side*(e.w/2-.08),0,.17);crystal.scale.y=1.6;}}
    if(p.family==='bridge'){const bolts=material('#d7c28d');for(const side of[-1,1])mesh(g,new T.CylinderGeometry(.045,.045,.05,6),bolts,side*(e.w/2-.12),-e.h/2+.12,.14).rotation.x=Math.PI/2;}
    if(e.placed){g.position.set(-.80+((e.order-1)%3)*.8,.20+Math.floor((e.order-1)/3)*.12,1.2+Math.floor((e.order-1)/3)*.65);g.scale.set(.34,.24,1.8);g.rotation.x=-Math.PI/2;}
    if(p.family==='message')strut(this.root,new T.Vector3(e.x,e.y+e.h/2,-.12),new T.Vector3(e.x,p.height-.4,-.12),.022,edge);
   }
   const target=g.position.clone();if(oldRoot&&oldId===t.nodeId&&previous.has(e.key))g.position.copy(previous.get(e.key));
   this.entries.set(e.key,{entry:e,mesh:g,target,face,targetScale:g.scale.clone(),targetQuaternion:g.quaternion.clone()});
  }
  for(const[a,b]of p.links)this.addLink(a,b,false);
  this.root.updateMatrixWorld(true);return p;
 }

 sync(t,plan,node){
  this.plan=plan;this.node=node;setTrailPropProgress(this.object,taskFraction(t));
  for(const e of plan.entries){const v=this.entries.get(e.key),wasPlaced=v.entry.placed,pose=piecePose(e);v.entry=e;v.target.copy(pose.position);v.targetScale.copy(pose.scale);v.targetQuaternion.copy(pose.quaternion);if(e.placed&&!wasPlaced)v.motion={start:v.mesh.position.clone(),scale:v.mesh.scale.clone(),quaternion:v.mesh.quaternion.clone(),age:0,duration:.42};if(v.face&&e.role!=='inscription'&&e.role!=='assembled')v.face.material=e.done?this.palette.green:e.selected?this.palette.gold:this.families.includes(plan.family)?this.palette.stone:this.palette.wood;}
  for(const[a,b]of plan.links)this.addLink(a,b,true);this.root.updateMatrixWorld(true);return plan;
 }
 addLink(a,b,animate){
  const key=a+'|'+b;if(this.linkMap.has(key))return;const left=this.entries.get(a),right=this.entries.get(b);if(!left||!right)return;const from=left.target.clone(),to=right.target.clone();from.x+=left.entry.w/2+.02;to.x-=right.entry.w/2+.02;from.z+=.20;to.z+=.20;const cable=strut(this.root,from,to,.052,this.palette.green);cable.userData.acceptedConnection=true;this.linkMap.set(key,cable);if(animate){cable.scale.y=.001;cable.position.copy(from);this.connectionAnimations.push({mesh:cable,root:this.root,from,to,age:0});}
 }
 findEntry(action){const kind={left:'pair-left',right:'pair-right',block:'block',choice:'choice',find:'find',confirm:'confirm',pick:'pick'}[action.kind];return[...this.entries.values()].find(v=>v.entry.action===kind&&(action.index===undefined||v.entry.index===action.index)&&(action.text===undefined||v.entry.textValue===action.text));}
 reject(action){const entry=this.findEntry(action);if(entry)entry.rejection={age:0};}

 cameraPose(width,height,{reserved=false}={}){
  const p=this.plan,aspect=width/height,fov=44,tan=Math.tan(fov*Math.PI/360),available=reserved?.92:height<500?.65:.73,distance=Math.max(p.width/(2*tan*aspect)*1.09,(p.height+.6)/(2*tan*available));
  const target=this.root.position.clone();target.y=p.height*.46-.35;const position=target.clone().addScaledVector(this.back,distance);position.y+=distance*.16;
  return{position,target,fov};
 }
 update(dt,camera,container,layer){
  dt=Math.max(0,Math.min(Number.isFinite(dt)?dt:0,1));
  for(const e of this.departures){e.age+=dt;e.mesh.scale.y=Math.max(.001,(1-Math.min(1,e.age/.7))**2);}
  this.departures=this.departures.filter(e=>{if(e.age<.7)return true;this.scene.remove(e.mesh);dispose(e.mesh);return false;});
  for(const e of this.effects){e.age+=dt;const f=Math.max(0,Math.min(1,e.age/.8));e.mesh.position.copy(e.start).lerp(e.end,f);e.mesh.position.y+=Math.sin(f*Math.PI)*.8;e.mesh.scale.setScalar(Math.max(.05,1-f*.75));}
  this.effects=this.effects.filter(e=>{if(e.age<.8)return true;this.scene.remove(e.mesh);dispose(e.mesh);return false;});
  this.connectionAnimations=this.connectionAnimations.filter(e=>{if(!e.root.parent)return false;e.age+=dt;const t=Math.min(1,e.age/.36),f=1-(1-t)**3;e.mesh.scale.y=Math.max(.001,f);e.mesh.position.copy(e.from).lerp(e.to,f*.5);return t<1;});
  if(!this.root)return;
  for(const v of this.entries.values()){
   const {mesh,target,targetScale,targetQuaternion}=v;
   if(v.motion){const m=v.motion;m.age+=dt;const t=Math.min(1,m.age/m.duration),f=t*t*(3-2*t);mesh.position.copy(m.start).lerp(target,f);mesh.position.y+=Math.sin(t*Math.PI)*.36;mesh.scale.copy(m.scale).lerp(targetScale,f);mesh.quaternion.copy(m.quaternion).slerp(targetQuaternion,f);if(t===1)v.motion=null;}
   else{const f=1-Math.exp(-dt*12);mesh.position.lerp(target,f);mesh.scale.lerp(targetScale,f);mesh.quaternion.slerp(targetQuaternion,f);}
   if(v.rejection){v.rejection.age+=dt;const t=v.rejection.age/.32;if(t<1)mesh.position.x+=Math.sin(t*Math.PI*6)*.065*(1-t);else v.rejection=null;}
   if(v.acceptedAge!==undefined){v.acceptedAge+=dt;if(v.acceptedAge<.3&&!v.motion)mesh.scale.multiplyScalar(1+Math.sin(v.acceptedAge/.3*Math.PI)*.012);else if(v.acceptedAge>=.3)delete v.acceptedAge;}
  }
  this.root.updateMatrixWorld(true);if(!layer||!container||!camera)return;
  const bounds=container.getBoundingClientRect();camera.updateMatrixWorld(true);this.projectionAge=(this.projectionAge||0)+dt;const signature=camera.matrixWorld.elements.map(n=>Math.round(n*100000)/100000).join(',')+'|'+camera.projectionMatrix.elements.join(',')+'|'+[bounds.left,bounds.top,bounds.width,bounds.height].join(','),animating=[...this.entries.values()].some(v=>v.motion||v.rejection||v.acceptedAge!==undefined||v.mesh.position.distanceToSquared(v.target)>1e-8);if(this.hitNodes&&signature===this.projectionSignature&&!animating&&this.projectionAge<.25)return;this.projectionAge=0;this.projectionSignature=signature;if(!this.hitNodes||this.hitLayer!==layer){this.hitLayer=layer;this.hitNodes=new Map([...this.entries.keys()].map(key=>[key,layer.querySelector(`[data-anchor="${key}"]`)]));}
  for(const p of projectedPieces(this.entries,camera,bounds)){const {entry:e}=p.v,el=this.hitNodes.get(p.key);if(!el)continue;el.style.visibility=p.visible?'visible':'hidden';el.style.left=p.x+'px';el.style.top=p.y+'px';el.style.width=p.w+'px';el.style.height=p.h+'px';const count=String(e.text).length+(e.context?.length||0);el.style.fontSize=Math.max(12,Math.min(17,Math.sqrt(Math.max(1,p.w*p.h)/(Math.max(8,count)*.7))*.8))+'px';el.style.boxShadow=p.v.rejection?'inset 0 0 0 2px #da8b68':'';}
 }

 accept(action,type){if(!this.root)return;const entry=this.findEntry(action);if(entry)entry.acceptedAge=0;const start=entry?.mesh.getWorldPosition(new T.Vector3())||this.root.localToWorld(new T.Vector3(0,3,.4)),end=this.root.localToWorld(new T.Vector3(type==='ending'?-.80:0,.45,2.2));for(let i=0;i<3;i++){const item=new T.Mesh(type==='ending'?new T.IcosahedronGeometry(.13,1):new T.OctahedronGeometry(.09),material(type==='ending'?'#efb26a':'#b8edca',true));item.position.copy(start).add(new T.Vector3((i-1)*.14,0,0));this.scene.add(item);this.effects.push({mesh:item,start:item.position.clone(),end:end.clone(),age:-i*.07});}}
 clear(preserveEffects=false){this.hitNodes=null;if(!preserveEffects){for(const e of this.departures){this.scene.remove(e.mesh);dispose(e.mesh);}this.departures=[];for(const e of this.effects){this.scene.remove(e.mesh);dispose(e.mesh);}this.effects=[];}if(this.root){this.scene.remove(this.root);dispose(this.root);}this.root=null;this.entries=new Map();this.linkMap=new Map();if(!preserveEffects)this.connectionAnimations=[];}
}
