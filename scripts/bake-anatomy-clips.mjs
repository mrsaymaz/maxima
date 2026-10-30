import fs from'node:fs';import path from'node:path';import * as T from'../dist/vendor/three.module.min.js';
const DIR='dist/assets/rigs',TAU=Math.PI*2,report=[];
const clamp=(x,a=-1,b=1)=>Math.max(a,Math.min(b,x));
for(const filename of fs.readdirSync(DIR).filter(f=>f.endsWith('.gltf')).sort()){
 const file=path.join(DIR,filename),j=JSON.parse(fs.readFileSync(file)),rig=j.extras.maximaRig,meta=j.extras.maximaLocomotion,H=rig.height,partner=filename.startsWith('ravenclaw')?'ravenclaw':'slytherin',level=Number(filename.match(/-(\d+)/)[1]),base=rig.jointBase;
 const buffers=j.buffers.map(b=>fs.readFileSync(path.resolve(DIR,b.uri))),width={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
 const read=id=>{const a=j.accessors[id],v=j.bufferViews[a.bufferView],b=buffers[v.buffer],out=[],w=width[a.type],size={5121:1,5123:2,5125:4,5126:4}[a.componentType];for(let i=0;i<a.count;i++)for(let k=0;k<w;k++){const at=(v.byteOffset||0)+(a.byteOffset||0)+i*(v.byteStride||w*size)+k*size;out.push(a.componentType===5126?b.readFloatLE(at):a.componentType===5123?b.readUInt16LE(at):a.componentType===5125?b.readUInt32LE(at):b.readUInt8(at));}return out;};
 const bones=rig.positions.map((p,i)=>{const b=new T.Bone();b.name=j.nodes[base+i].name;b.position.fromArray(j.nodes[base+i].translation);return b;}),root=bones[0],scene=new T.Group();bones.forEach((b,i)=>rig.parents[i]===null?scene.add(b):bones[rig.parents[i]].add(b));scene.updateMatrixWorld(true);
 const rest=bones.map(b=>({p:b.position.clone(),q:b.quaternion.clone()})),inverse=rig.positions.map(p=>new T.Matrix4().makeTranslation(-p[0],-p[1],-p[2])),f=new T.Vector3(...rig.forward),r=new T.Vector3(...rig.right),up=new T.Vector3(0,1,0),rotation=new T.Quaternion();
 const all=j.meshes[0].primitives.map(p=>({p:read(p.attributes.POSITION),w:read(p.attributes.WEIGHTS_0),ids:read(p.attributes.JOINTS_0)}));
 const restPoints=all.flatMap(a=>Array.from({length:a.p.length/3},(_,i)=>new T.Vector3().fromArray(a.p,i*3))),restBox=new T.Box3().setFromPoints(restPoints);
 const rotate=(idx,axis,angle)=>bones[idx].quaternion.multiply(rotation.setFromAxisAngle(axis,angle));
 const reset=()=>bones.forEach((b,i)=>{b.position.copy(rest[i].p);b.quaternion.copy(rest[i].q);});
 function legPose(data,along,lift){
  const[hip,knee,ankle,toe]=data.joints,v1=rest[knee].p,v2=rest[ankle].p,L1=v1.length(),L2=v2.length(),dx=along,dy=rig.positions[ankle][1]-rig.positions[hip][1]+lift,D=Math.min(L1+L2-1e-7,Math.hypot(dx,dy)),target=Math.atan2(dx,-dy),a=target-Math.acos(clamp((L1*L1+D*D-L2*L2)/(2*L1*D))),k=Math.PI-Math.acos(clamp((L1*L1+L2*L2-D*D)/(2*L1*L2))),a0=Math.atan2(v1.dot(f),-v1.y),k0=Math.atan2(v2.dot(f),-v2.y)-a0;
  rotate(hip,r,-(a-a0));rotate(knee,r,-(k-k0));rotate(ankle,r,a-a0+k-k0);rotate(toe,r,0);
 }
 function pose(name,t){reset();const pulse=Math.sin(Math.PI*t)**2,wind=Math.sin(Math.PI*Math.min(1,t/.30)),release=Math.exp(-(((t-.36)/.14)**2))*Math.sin(Math.PI*t),cycle=TAU*t,body=rig.roles.body;
  if(partner==='ravenclaw'){
   for(const data of Object.values(rig.limbs))if(data.role==='wing'){
    const amount=name==='Walk'?.028*Math.sin(cycle*2):name==='Jump'?.13*pulse:name==='Cast'?.075*wind-.095*release:name==='Idle'?.006*Math.sin(cycle):name==='Hit'?-.025*pulse:.065*pulse;
    rotate(data.joints[0],f,data.side*amount);rotate(data.joints[1],f,data.side*amount*.35);
   }else if(data.joints.length===4){if(name==='Walk'){const phase=(t+data.phase)%1,stance=phase<.62,u=stance?phase/.62:(phase-.62)/.38,along=H*(stance?.075-.15*u:-.075+.15*u),lift=stance?0:Math.sin(u*Math.PI)*H*.055;legPose(data,along,lift);}else if(name==='Jump')legPose(data,-.015*H*pulse,.045*H*pulse);}
   rotate(body,up,name==='Cast'?.024*Math.sin(cycle)*Math.sin(Math.PI*t):name==='TurnStrike'?.045*Math.sin(cycle)*Math.sin(Math.PI*t):0);
  }else{
   for(let k=0;k<rig.roles.coils.length;k++){const idx=rig.roles.coils[k],a=TAU*k/8,amp=name==='Walk'?.024:name==='Idle'?.002:name==='Jump'?.004:pulse*.005;const envelope=['Walk','Idle'].includes(name)?1:pulse;bones[idx].position.addScaledVector(r,Math.sin(cycle-a)*H*amp*envelope);}
   for(const idx of rig.roles.tail||[])rotate(idx,f,(name==='Walk'?.035:name==='Idle'?.012:.025*pulse)*Math.sin(cycle));
   for(const data of Object.values(rig.limbs)){const mid=data.joints[0],h=data.joints[1],side=data.side||0,amp=name==='Walk'?.015:name==='Idle'?.006:name==='Cast'?.025*wind-.035*release:name==='Hit'?-.02*pulse:.025*pulse;rotate(mid,up,['Walk','Idle'].includes(name)?Math.sin(cycle+side*.65)*amp:amp);rotate(h,up,['Walk','Idle'].includes(name)?-Math.sin(cycle+side*.65)*amp*.45:-amp*.3);}
   rotate(body,up,name==='TurnStrike'?.035*Math.sin(cycle)*Math.sin(Math.PI*t):name==='Cast'?-.02*wind+.03*release:0);
  }
  for(const h of rig.heads){const angle=name==='Idle'?.004*Math.sin(cycle):name==='Walk'?.005*Math.sin(cycle*2):name==='Cast'?.018*wind-.026*release:name==='Hit'?.027*Math.sin(Math.PI*t)*Math.exp(-t*2):name==='Jump'?-.012*pulse:.035*wind-.045*release;rotate(h,r,angle);}
 }
 const vector=new T.Vector3(),out=new T.Vector3();function points(){scene.updateMatrixWorld(true);const mats=bones.map((b,i)=>new T.Matrix4().multiplyMatrices(b.matrixWorld,inverse[i])),result=[];for(const a of all)for(let i=0;i<a.p.length/3;i++){out.set(0,0,0);for(let k=0;k<4;k++){const index=i*4+k,w=a.w[index];if(w)out.addScaledVector(vector.fromArray(a.p,i*3).applyMatrix4(mats[a.ids[index]]),w);}result.push(out.clone());}return result;}
 const bindAccessor=j.skins[0].inverseBindMatrices,bindView=j.accessors[bindAccessor].bufferView,source=buffers[1].subarray(0,j.bufferViews[bindView].byteOffset+j.bufferViews[bindView].byteLength);j.accessors=j.accessors.slice(0,bindAccessor+1);j.bufferViews=j.bufferViews.slice(0,bindView+1);const chunks=[source];let bytes=source.length;function append(values,type){const pad=(4-bytes%4)%4;chunks.push(Buffer.alloc(pad));bytes+=pad;const data=Buffer.from(new Float32Array(values).buffer),view=j.bufferViews.push({buffer:1,byteOffset:bytes,byteLength:data.length})-1;chunks.push(data);bytes+=data.length;const a={bufferView:view,componentType:5126,count:values.length/width[type],type};if(type==='SCALAR'){a.min=[0];a.max=[values.at(-1)];}return j.accessors.push(a)-1;}
 let maxDisplacement=0,minRatio=1,maxRatio=1,maxFootError=0;
 j.animations=[];const durations={Idle:3.8,Walk:partner==='ravenclaw'?.375:1.15,Jump:.74,Strike:.48,AirStrike:.58,TurnStrike:.48,Hit:.34,Cast:.48};
 for(const[name,duration]of Object.entries(durations)){
  const N=32,rot=bones.map(()=>[]),pos=bones.map(()=>[]),input=append(Array.from({length:N+1},(_,i)=>i/N*duration),'SCALAR');
  for(let i=0;i<=N;i++){pose(name,i/N);let sample=points(),box=new T.Box3().setFromPoints(sample);root.position.y+=rig.ground-box.min.y;sample=points();box.setFromPoints(sample);minRatio=Math.min(minRatio,(box.max.y-box.min.y)/H);maxRatio=Math.max(maxRatio,(box.max.y-box.min.y)/H);sample.forEach((p,k)=>{if(!Number.isFinite(p.x+p.y+p.z))throw Error('Invalid skin pose');maxDisplacement=Math.max(maxDisplacement,p.distanceTo(restPoints[k])/H);});
   bones.forEach((b,k)=>{rot[k].push(...b.quaternion.toArray());pos[k].push(...b.position.toArray());});
   if(process.env.MAXIMA_RIG_QA&&['Walk','Cast','Jump'].includes(name)&&[0,8,16,24].includes(i)){fs.mkdirSync(process.env.MAXIMA_RIG_QA,{recursive:true});fs.writeFileSync(path.join(process.env.MAXIMA_RIG_QA,`${partner}-${level}-${name}-${i}.f32`),Buffer.from(new Float32Array(sample.flatMap(p=>p.toArray())).buffer));}
  }
  const anim={name,samplers:[],channels:[]};for(let k=0;k<bones.length;k++)for(const[type,values,field]of[['VEC4',rot[k],'rotation'],['VEC3',pos[k],'translation']]){const output=append(values,type),sampler=anim.samplers.push({input,output,interpolation:'LINEAR'})-1;anim.channels.push({sampler,target:{node:base+k,path:field}});}j.animations.push(anim);
 }
 if(maxDisplacement>.24||minRatio<.82||maxRatio>1.18)throw Error(filename+' deformation guard '+[maxDisplacement,minRatio,maxRatio]);
 meta.clips=Object.keys(durations);meta.walkCycleSeconds=durations.Walk;meta.contacts=partner==='ravenclaw'?[0,.5]:[];meta.validation={samplesPerClip:33,maxDisplacementInHeights:maxDisplacement,minHeightRatio:minRatio,maxHeightRatio:maxRatio};
 j.buffers[1].byteLength=bytes;fs.writeFileSync(path.resolve(DIR,j.buffers[1].uri),Buffer.concat(chunks));fs.writeFileSync(file,JSON.stringify(j));report.push({partner,level,joints:bones.length,vertices:rig.vertices,headCount:rig.headCount,clips:meta.clips,validation:meta.validation});console.log(filename,'8 clips',maxDisplacement.toFixed(3),'height',minRatio.toFixed(3),maxRatio.toFixed(3));
}
fs.writeFileSync('docs/new-rig-audit.json',JSON.stringify({newSkins:19,forms:report},null,2)+'\n');
