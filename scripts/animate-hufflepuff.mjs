// Bake conservative, in-place Idle, Walk and Jump clips into the actual Level 0 rig.
// No mesh, texture, rest pose or skin weights are replaced.
import {readFileSync,writeFileSync} from 'node:fs';
import * as T from '../dist/vendor/three.module.min.js';
const path=process.argv[2]||'dist/assets/creatures/hufflepuff-0.glb';
const raw=readFileSync(path);let json,binary;for(let o=12;o<raw.length;){const n=raw.readUInt32LE(o),kind=raw.readUInt32LE(o+4);const chunk=raw.subarray(o+8,o+8+n);if(kind===0x4e4f534a)json=JSON.parse(chunk);if(kind===0x004e4942)binary=chunk;o+=8+n;}
if(json.skins?.[0]?.joints.length!==28||json.nodes[27]?.name!=='tripo::Root')throw Error('This baker is specific to the supplied Level 0 Hufflepuff rig.');
const original=json.extras?.maximaLocomotion?.original||{binaryLength:json.buffers[0].byteLength,bufferViews:json.bufferViews.length,accessors:json.accessors.length};binary=binary.subarray(0,original.binaryLength);json.bufferViews=json.bufferViews.slice(0,original.bufferViews);json.accessors=json.accessors.slice(0,original.accessors);delete json.animations;
const widths={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
function accessor(index){const a=json.accessors[index],v=json.bufferViews[a.bufferView],n=widths[a.type],size={5121:1,5123:2,5125:4,5126:4}[a.componentType],out=[];const data=new DataView(binary.buffer,binary.byteOffset,binary.byteLength),stride=v.byteStride||n*size;for(let i=0;i<a.count;i++)for(let k=0;k<n;k++){const p=(v.byteOffset||0)+(a.byteOffset||0)+i*stride+k*size;out.push(a.componentType===5126?data.getFloat32(p,true):a.componentType===5123?data.getUint16(p,true):a.componentType===5121?data.getUint8(p):data.getUint32(p,true));}return out;}
const objects=json.nodes.map(n=>{const o=new T.Object3D();o.name=n.name||'';if(n.matrix){o.matrix.fromArray(n.matrix);o.matrix.decompose(o.position,o.quaternion,o.scale);}else{o.position.fromArray(n.translation||[0,0,0]);o.quaternion.fromArray(n.rotation||[0,0,0,1]);o.scale.fromArray(n.scale||[1,1,1]);}return o;});json.nodes.forEach((n,i)=>(n.children||[]).forEach(k=>objects[i].add(objects[k])));const roots=json.scenes[json.scene||0].nodes.map(i=>objects[i]);const update=()=>roots.forEach(o=>o.updateMatrixWorld(true));update();const rest=objects.map(o=>({p:o.position.clone(),q:o.quaternion.clone()}));
const lateral=new T.Vector3(.8320502943,0,-.5547001962),axes=new Map();for(let i=0;i<objects.length;i++)axes.set(i,lateral.clone().applyQuaternion(objects[i].getWorldQuaternion(new T.Quaternion()).invert()).normalize());
const chains=[{name:'left hind',nodes:[6,5,4],phase:0},{name:'left fore',nodes:[12,11,10],phase:.25},{name:'right hind',nodes:[3,2,1],phase:.5},{name:'right fore',nodes:[9,8,7],phase:.75}];
const rotationNodes=[...chains.flatMap(x=>x.nodes),24,17,26];
function reset(){objects.forEach((o,i)=>{o.position.copy(rest[i].p);o.quaternion.copy(rest[i].q);});}
function rotate(i,axis,angle){const local=axis==='lateral'?axes.get(i):new T.Vector3(0,1,0).applyQuaternion(objects[i].getWorldQuaternion(new T.Quaternion()).invert()).normalize();objects[i].quaternion.copy(rest[i].q).multiply(new T.Quaternion().setFromAxisAngle(local,angle));}
const prim=json.meshes[0].primitives[0],positions=accessor(prim.attributes.POSITION),weights=accessor(prim.attributes.WEIGHTS_0),joints=accessor(prim.attributes.JOINTS_0),skin=json.skins[0],ib=accessor(skin.inverseBindMatrices),inverse=skin.joints.map((_,i)=>new T.Matrix4().fromArray(ib,i*16));
function skinMinY(){update();const matrices=skin.joints.map((id,i)=>new T.Matrix4().multiplyMatrices(objects[id].matrixWorld,inverse[i]));let min=Infinity;for(let i=0;i<positions.length/3;i++){const x=positions[i*3],y=positions[i*3+1],z=positions[i*3+2];let py=0;for(let k=0;k<4;k++){const j=i*4+k,w=weights[j];if(!w)continue;const e=matrices[joints[j]].elements;py+=(e[1]*x+e[5]*y+e[9]*z+e[13])*w;}min=Math.min(min,py);}return min;}
reset();const ground=skinMinY();
const chunks=[binary];let bytes=binary.length;
function append(values,type){const pad=(4-bytes%4)%4;if(pad){chunks.push(Buffer.alloc(pad));bytes+=pad;}const a=new Float32Array(values),b=Buffer.from(a.buffer);const view=json.bufferViews.push({buffer:0,byteOffset:bytes,byteLength:b.length})-1;chunks.push(b);bytes+=b.length;const count=values.length/widths[type],desc={bufferView:view,componentType:5126,count,type};if(type==='SCALAR'){desc.min=[Math.min(...values)];desc.max=[Math.max(...values)];}return json.accessors.push(desc)-1;}
const frameCount=40;
function clip(name,duration,pose,groundedAt=()=>true,criticalPhases=[]){
 const phases=[...new Set([...Array.from({length:frameCount+1},(_,i)=>i/frameCount),...criticalPhases])].sort((a,b)=>a-b),times=phases.map(t=>t*duration),input=append(times,'SCALAR'),rotations=new Map(rotationNodes.map(i=>[i,[]])),translations=[];
 for(const t of phases){reset();pose(t);if(groundedAt(t)){const correction=ground-skinMinY();objects[27].position.y+=correction;}for(const id of rotationNodes){const q=objects[id].quaternion.clone().normalize();rotations.get(id).push(...q.toArray());}translations.push(...objects[27].position.toArray());}
 const animation={name,samplers:[],channels:[]};for(const id of rotationNodes){const out=append(rotations.get(id),'VEC4'),sampler=animation.samplers.push({input,output:out,interpolation:'LINEAR'})-1;animation.channels.push({sampler,target:{node:id,path:'rotation'}});}const out=append(translations,'VEC3'),sampler=animation.samplers.push({input,output:out,interpolation:'LINEAR'})-1;animation.channels.push({sampler,target:{node:27,path:'translation'}});return animation;
}
const idle=clip('Idle',3.6,t=>{rotate(24,'lateral',Math.sin(t*Math.PI*2)*.007);rotate(17,'yaw',Math.sin(t*Math.PI*2)*.016);rotate(26,'yaw',Math.sin(t*Math.PI*2+.4)*.035);});
const walk=clip('Walk',1.12,t=>{for(const c of chains){const p=(t+c.phase)%1,split=.34,swing=p<split,u=swing?p/split:(p-split)/(1-split),upper=(swing?1:-1)*Math.cos(Math.PI*u)*.175,middle=swing?Math.sin(Math.PI*u)*.35:0;rotate(c.nodes[0],'lateral',upper);rotate(c.nodes[1],'lateral',middle);rotate(c.nodes[2],'lateral',-upper-middle);}rotate(24,'lateral',Math.sin(t*Math.PI*4)*.006);rotate(17,'lateral',Math.sin(t*Math.PI*4+.35)*.009);rotate(26,'yaw',Math.sin(t*Math.PI*2)*.055);});
// Jump changes limb posture only. The game owns the airborne world-space arc.
// Solve each generated limb's own rest-plane knee direction: the source's hind
// knees and fore elbows do not all bend with the same local angle sign.
reset();update();
const forward=new T.Vector3(.5547001962,0,.8320502943),jumpLegs=new Map();
for(const c of chains){const [a,b,d]=c.nodes.map(i=>objects[i].getWorldPosition(new T.Vector3())),one=b.clone().sub(a),two=d.clone().sub(b),x1=one.dot(forward),y1=one.y,x2=two.dot(forward),y2=two.y,angle1=Math.atan2(y1,x1),angle2=Math.atan2(y2,x2),bend=Math.atan2(Math.sin(angle2-angle1),Math.cos(angle2-angle1));jumpLegs.set(c.name,{x:x1+x2,y:y1+y2,length1:Math.hypot(x1,y1),length2:Math.hypot(x2,y2),angle1,bend,sign:Math.sign(bend)||1});}
function jumpAngles(c,compression,shift){if(compression<1e-8&&Math.abs(shift)<1e-8)return[0,0];const k=jumpLegs.get(c.name),x=k.x+shift,y=k.y+compression,cosine=Math.max(-1,Math.min(1,(x*x+y*y-k.length1*k.length1-k.length2*k.length2)/(2*k.length1*k.length2))),bend=k.sign*Math.acos(cosine),angle=Math.atan2(y,x)-Math.atan2(k.length2*Math.sin(bend),k.length1+k.length2*Math.cos(bend));return[k.angle1-angle,k.bend-bend];}
// Forelegs retract beneath the chest; hindlegs fold forward beneath the pelvis.
// Grounded compression is obtained by planting the actual skinned sole, rather
// than by moving the mesh down through a stationary set of paws.
const jumpPoses=[
 {t:0,compression:0,tuck:0,spine:0,head:0,tail:0},
 {t:.075,compression:.025,tuck:0,spine:.045,head:.025,tail:.025},
 {t:.15,compression:0,tuck:0,spine:-.008,head:.012,tail:-.02},
 {t:.30,compression:.055,tuck:1,spine:-.012,head:.018,tail:-.035},
 {t:.50,compression:.055,tuck:1,spine:-.012,head:.018,tail:-.035},
 {t:.675,compression:0,tuck:0,spine:.004,head:-.006,tail:.012},
 {t:.78,compression:0,tuck:0,spine:0,head:0,tail:0},
 {t:.85,compression:.035,tuck:0,spine:.060,head:.030,tail:.03},
 {t:1,compression:0,tuck:0,spine:0,head:0,tail:0}
];
const jump=clip('Jump',.9,t=>{let index=jumpPoses.findIndex(p=>p.t>=t);if(index<1)index=1;const a=jumpPoses[index-1],b=jumpPoses[index],v=Math.max(0,Math.min(1,(t-a.t)/(b.t-a.t))),s=v*v*(3-2*v),mix=(x,y)=>x+(y-x)*s;
 const compression=mix(a.compression,b.compression),tuck=mix(a.tuck,b.tuck);for(const c of chains){const shift=(c.name.includes('fore')?-.035:.025)*tuck,[upper,middle]=jumpAngles(c,compression,shift);rotate(c.nodes[0],'lateral',upper);rotate(c.nodes[1],'lateral',middle);rotate(c.nodes[2],'lateral',-upper-middle);}
 rotate(24,'lateral',mix(a.spine,b.spine));rotate(17,'lateral',mix(a.head,b.head));rotate(26,'yaw',mix(a.tail,b.tail));
},t=>t<.15||t>.78,[.78]);
json.animations=[idle,walk,jump];json.extras??={};json.extras.maximaLocomotion={version:2,original,forwardYaw:Math.atan2(.5547001962,.8320502943),clips:['Idle','Walk','Jump'],walkCycleSeconds:1.12,jumpSeconds:.9,jumpPhases:{anticipation:[0,.15],air:[.15,.78],landing:[.78,1]},rootMotion:'in-place; world movement and jump elevation belong to the game',rig:'Four anatomical limb chains; misleading source bone names are preserved.',groundCorrection:'Idle/Walk: CPU-skinned minimum Y at each sample. Jump: grounded anticipation/landing only; airborne root translation stays at rest.'};
const pad=(4-bytes%4)%4;if(pad){chunks.push(Buffer.alloc(pad));bytes+=pad;}json.buffers[0].byteLength=bytes;const bin=Buffer.concat(chunks),text=Buffer.from(JSON.stringify(json)),textPad=Buffer.alloc((4-text.length%4)%4,32),body=Buffer.concat([text,textPad]),header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(28+body.length+bin.length,8);header.writeUInt32LE(body.length,12);header.writeUInt32LE(0x4e4f534a,16);const bh=Buffer.alloc(8);bh.writeUInt32LE(bin.length,0);bh.writeUInt32LE(0x004e4942,4);writeFileSync(path,Buffer.concat([header,body,bh,bin]));console.log(`${path}: baked Idle + Walk (${frameCount+1} keys) + Jump (${frameCount+2} keys), 16 channels each; original mesh/texture/skin preserved.`);
