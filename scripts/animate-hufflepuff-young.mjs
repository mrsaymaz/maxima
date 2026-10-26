// Portable in-place animation profiles for the supplied Hufflepuff forms1–3.
// Source names are unreliable: these mappings use rest anatomy AND skin weights.
// Meshes, skin, textures, rest nodes and inverse bind matrices stay unchanged.
import {readFileSync,writeFileSync} from 'node:fs';
import * as T from '../dist/vendor/three.module.min.js';
const profiles={
 1:{joints:17,root:16,body:15,head:8,tail:0,duration:1.00,upper:.13,middle:.16,tailAmplitude:.022,limbs:[
  {id:'leftHind',nodes:[3,2,1],phase:0},
  {id:'leftFore',nodes:[12,11,10],phase:.25},
  {id:'rightHind',nodes:[7,6,5,4],phase:.5},
  {id:'rightFore',nodes:[13],phase:.75,single:true}
 ]},
 2:{joints:33,root:32,body:31,head:2,tail:30,duration:1.05,upper:.135,middle:.17,tailAmplitude:.012,limbs:[
  {id:'leftHind',nodes:[24,23,22,21],phase:0},
  {id:'leftFore',nodes:[11,10,9,8],phase:.25},
  {id:'rightHind',nodes:[20,19,18,17],phase:.5},
  {id:'rightFore',nodes:[6,5,4,3],phase:.75}
 ]},
 3:{joints:26,root:25,body:24,head:null,tail:0,duration:1.10,upper:.135,middle:.17,tailAmplitude:.018,limbs:[
  {id:'leftHind',nodes:[22,21,20],phase:0},
  {id:'leftFore',nodes:[10,9,8],phase:.25},
  {id:'rightHind',nodes:[19,18,17],phase:.5},
  {id:'rightFore',nodes:[6,5,4],phase:.75}
 ]}
};
const widths={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
const samples=48;
function bake(level,path){
 const profile=profiles[level];if(!profile)throw Error('Only supplied forms1–3 are supported.');
 const raw=readFileSync(path);let json,binary;
 for(let offset=12;offset<raw.length;){const length=raw.readUInt32LE(offset),kind=raw.readUInt32LE(offset+4),data=raw.subarray(offset+8,offset+8+length);if(kind===0x4e4f534a)json=JSON.parse(data);if(kind===0x004e4942)binary=data;offset+=8+length;}
 if(json.skins?.[0]?.joints.length!==profile.joints||json.nodes[profile.root]?.name!=='tripo::Root')throw Error(`Form${level}: unexpected original rig.`);
 // Reappend extras after animations so a first bake and subsequent rebakes use
 // identical JSON property order as well as identical animation/payload bytes.
 const retainedExtras=json.extras||{};delete json.extras;
 const original=retainedExtras.maximaLocomotion?.original||{binaryLength:json.buffers[0].byteLength,bufferViews:json.bufferViews.length,accessors:json.accessors.length};
 binary=binary.subarray(0,original.binaryLength);json.bufferViews=json.bufferViews.slice(0,original.bufferViews);json.accessors=json.accessors.slice(0,original.accessors);delete json.animations;
 function accessor(index){const a=json.accessors[index],view=json.bufferViews[a.bufferView],width=widths[a.type],size={5121:1,5123:2,5125:4,5126:4}[a.componentType],result=[],data=new DataView(binary.buffer,binary.byteOffset,binary.byteLength),stride=view.byteStride||width*size;for(let i=0;i<a.count;i++)for(let k=0;k<width;k++){const at=(view.byteOffset||0)+(a.byteOffset||0)+i*stride+k*size;result.push(a.componentType===5126?data.getFloat32(at,true):a.componentType===5123?data.getUint16(at,true):a.componentType===5121?data.getUint8(at):data.getUint32(at,true));}return result;}
 const nodes=json.nodes.map(n=>{const o=new T.Object3D();o.name=n.name||'';if(n.matrix)o.matrix.fromArray(n.matrix).decompose(o.position,o.quaternion,o.scale);else{o.position.fromArray(n.translation||[0,0,0]);o.quaternion.fromArray(n.rotation||[0,0,0,1]);o.scale.fromArray(n.scale||[1,1,1]);}return o;});
 json.nodes.forEach((n,i)=>(n.children||[]).forEach(c=>nodes[i].add(nodes[c])));const roots=json.scenes[json.scene||0].nodes.map(i=>nodes[i]),update=()=>roots.forEach(o=>o.updateMatrixWorld(true));update();
 const rest=nodes.map(o=>({p:o.position.clone(),q:o.quaternion.clone(),world:o.matrixWorld.clone()})),positionOf=i=>new T.Vector3().setFromMatrixPosition(rest[i].world),midpoint=limbs=>limbs.reduce((v,c)=>v.add(positionOf(c.nodes[0])),new T.Vector3()).multiplyScalar(1/limbs.length);
 const forward=midpoint(profile.limbs.filter(c=>c.id.includes('Fore'))).sub(midpoint(profile.limbs.filter(c=>c.id.includes('Hind'))));forward.y=0;forward.normalize();const lateral=new T.Vector3().crossVectors(new T.Vector3(0,1,0),forward).normalize(),axes=new Map(),upAxes=new Map(),yawAxes=new Map();
 nodes.forEach((o,i)=>{const inverse=o.getWorldQuaternion(new T.Quaternion()).invert();axes.set(i,lateral.clone().applyQuaternion(inverse).normalize());yawAxes.set(i,new T.Vector3(0,1,0).applyQuaternion(inverse).normalize());upAxes.set(i,new T.Vector3(0,1,0).applyQuaternion(o.parent?.getWorldQuaternion(new T.Quaternion()).invert()||new T.Quaternion()).normalize());});
 const primitive=json.meshes[0].primitives[0],attr=primitive.attributes,positions=accessor(attr.POSITION),jointIds=accessor(attr.JOINTS_0),weights=accessor(attr.WEIGHTS_0),skin=json.skins[0],inverseValues=accessor(skin.inverseBindMatrices),inverse=skin.joints.map((_,i)=>new T.Matrix4().fromArray(inverseValues,i*16)),slotOf=new Map(skin.joints.map((node,slot)=>[node,slot]));
 let minY=Infinity,maxY=-Infinity;for(let i=1;i<positions.length;i+=3){minY=Math.min(minY,positions[i]);maxY=Math.max(maxY,positions[i]);}const height=maxY-minY;
 for(const c of profile.limbs){if(c.nodes.some(i=>!slotOf.has(i)))throw Error('Mapped limb missing from skin.');let bend=0;if(!c.single){const [a,b,d]=c.nodes.map(positionOf),one=b.clone().sub(a),two=d.clone().sub(b);bend=Math.atan2(Math.sin(Math.atan2(two.y,two.dot(forward))-Math.atan2(one.y,one.dot(forward))),Math.cos(Math.atan2(two.y,two.dot(forward))-Math.atan2(one.y,one.dot(forward))));}c.flexSign=Math.abs(bend)>.03?-Math.sign(bend):(c.id.includes('Fore')?1:-1);const slots=(c.single?c.nodes:c.nodes.slice(2)).map(i=>slotOf.get(i)),candidate=[];let low=Infinity;for(let v=0;v<positions.length/3;v++){let influence=0;for(let k=0;k<4;k++)if(slots.includes(jointIds[v*4+k]))influence+=weights[v*4+k];if(influence>.55){candidate.push(v);low=Math.min(low,positions[v*3+1]);}}c.pawVertices=candidate.filter(v=>positions[v*3+1]<low+height*.13);if(c.pawVertices.length<12)throw Error(`Form${level} ${c.id}: unusable weighted paw region.`);}
 function reset(){nodes.forEach((o,i)=>{o.position.copy(rest[i].p);o.quaternion.copy(rest[i].q);});}
 function rotate(index,angle,axis=axes.get(index)){nodes[index].quaternion.copy(rest[index].q).multiply(new T.Quaternion().setFromAxisAngle(axis,angle));}
 function matrices(){update();return skin.joints.map((id,i)=>new T.Matrix4().multiplyMatrices(nodes[id].matrixWorld,inverse[i]));}
 function point(index,mats){const x=positions[index*3],y=positions[index*3+1],z=positions[index*3+2],out=new T.Vector3();for(let k=0;k<4;k++){const at=index*4+k,w=weights[at];if(!w)continue;const e=mats[jointIds[at]].elements;out.x+=(e[0]*x+e[4]*y+e[8]*z+e[12])*w;out.y+=(e[1]*x+e[5]*y+e[9]*z+e[13])*w;out.z+=(e[2]*x+e[6]*y+e[10]*z+e[14])*w;}return out;}
 function skinMinimum(mats){let minimum=Infinity;for(let v=0;v<positions.length/3;v++)minimum=Math.min(minimum,point(v,mats).y);return minimum;}
 reset();const ground=skinMinimum(matrices()),rotationNodes=[...new Set([...profile.limbs.flatMap(c=>c.nodes),profile.body,profile.head,profile.tail].filter(i=>i!==null))],positionNodes=[profile.root,...profile.limbs.map(c=>c.nodes[0])],chunks=[binary];let bytes=binary.length;
 function append(values,type){const pad=(4-bytes%4)%4;if(pad){chunks.push(Buffer.alloc(pad));bytes+=pad;}const data=Buffer.from(new Float32Array(values).buffer),view=json.bufferViews.push({buffer:0,byteOffset:bytes,byteLength:data.length})-1;chunks.push(data);bytes+=data.length;const descriptor={bufferView:view,componentType:5126,count:values.length/widths[type],type};if(type==='SCALAR'){descriptor.min=[Math.min(...values)];descriptor.max=[Math.max(...values)];}return json.accessors.push(descriptor)-1;}
 const measured=new Map(profile.limbs.map(c=>[c.id,[]]));
 function clip(name,duration,pose){const time=append(Array.from({length:samples+1},(_,i)=>i/samples*duration),'SCALAR'),rot=new Map(rotationNodes.map(i=>[i,[]])),pos=new Map(positionNodes.map(i=>[i,[]]));for(let frame=0;frame<=samples;frame++){reset();pose(frame/samples);nodes[profile.root].position.y+=ground-skinMinimum(matrices());const mats=matrices();for(const i of rotationNodes)rot.get(i).push(...nodes[i].quaternion.clone().normalize().toArray());for(const i of positionNodes)pos.get(i).push(...nodes[i].position.toArray());if(name==='Walk')for(const c of profile.limbs){const center=c.pawVertices.reduce((v,index)=>v.add(point(index,mats)),new T.Vector3()).multiplyScalar(1/c.pawVertices.length);measured.get(c.id).push(center.dot(forward));}}
  const animation={name,samplers:[],channels:[]};for(const [path,map,type]of[['rotation',rot,'VEC4'],['translation',pos,'VEC3']])for(const [node,values]of map){const output=append(values,type),sampler=animation.samplers.push({input:time,output,interpolation:'LINEAR'})-1;animation.channels.push({sampler,target:{node,path}});}return animation;}
 const idle=clip('Idle',3.8,t=>{rotate(profile.body,Math.sin(t*Math.PI*2)*.0028);if(profile.head!==null)rotate(profile.head,Math.sin(t*Math.PI*2)*.008);if(profile.tail!==null)rotate(profile.tail,Math.sin(t*Math.PI*2)*profile.tailAmplitude,yawAxes.get(profile.tail));});
 const walk=clip('Walk',profile.duration,t=>{for(const c of profile.limbs){const phase=(t+c.phase)%1,split=.34,swing=phase<split,u=swing?phase/split:(phase-split)/(1-split),upper=(swing?1:-1)*Math.cos(Math.PI*u)*(c.single?.10:profile.upper),middle=swing?Math.sin(Math.PI*u)*profile.middle*c.flexSign:0;rotate(c.nodes[0],upper);if(!c.single){rotate(c.nodes[1],middle);rotate(c.nodes[2],-upper-middle);for(const i of c.nodes.slice(3))rotate(i,0);}const lift=(swing?Math.sin(Math.PI*u):0)*height*(c.single?.018:.008);nodes[c.nodes[0]].position.addScaledVector(upAxes.get(c.nodes[0]),lift);}
  rotate(profile.body,Math.sin(t*Math.PI*4)*.0025);if(profile.head!==null)rotate(profile.head,Math.sin(t*Math.PI*4+.3)*.005);if(profile.tail!==null)rotate(profile.tail,Math.sin(t*Math.PI*2)*profile.tailAmplitude*1.2,yawAxes.get(profile.tail));});
 const strides=profile.limbs.map(c=>(Math.max(...measured.get(c.id))-Math.min(...measured.get(c.id)))/height),strideLength=strides.reduce((a,b)=>a+b,0)/strides.length;
 json.animations=[idle,walk];json.extras=retainedExtras;json.extras.maximaLocomotion={version:1,profile:`hufflepuff-young-${level}`,original,forwardYaw:Math.atan2(forward.x,forward.z),forwardVector:forward.toArray(),clips:['Idle','Walk'],walkCycleSeconds:profile.duration,strideLength,strideLengthUnit:'modelHeightsPerCycle',referenceSpeed:strideLength/profile.duration,referenceSpeedUnit:'modelHeightsPerSecond',playbackReferenceSpeed:2.2,playbackReferenceSpeedUnit:'modelHeightsPerSecond',playbackNote:'Artistic cadence reference; playback should be clamped. Conservative supplied rigs cannot foot-lock at fast exploration speeds.',limbNodes:Object.fromEntries(profile.limbs.map((c,i)=>[c.id,{nodes:c.nodes,names:c.nodes.map(n=>json.nodes[n].name),endNode:c.nodes.at(-1),endName:json.nodes[c.nodes.at(-1)].name,singleBone:!!c.single,phase:c.phase,pawVertexIndices:c.pawVertices,measuredStride:strides[i]}])),rootNode:profile.root,bodyNode:profile.body,headNode:profile.head,tailNode:profile.tail,rootMotion:'In-place; root X/Z stay at original rest values. World travel belongs to the game.',groundCorrection:'CPU-skinned whole-mesh minimum Y is planted at every sample.',limitations:level===1?'One foreleg has only one supplied bone: conservative whole-leg swing/lift, no independent elbow/paw articulation.':level===3?'Original upright stance retained: hindfoot stepping and forearm swing, not a forced four-paw stance. Generated head hierarchy parents both forelegs, so isolated head nod is omitted.':'Original upright stance retained: hindfoot stepping and forearm swing, not a forced four-paw stance. Generated skeleton and rest stance are asymmetric.'};
 const pad=(4-bytes%4)%4;if(pad){chunks.push(Buffer.alloc(pad));bytes+=pad;}json.buffers[0].byteLength=bytes;const bin=Buffer.concat(chunks),text=Buffer.from(JSON.stringify(json)),body=Buffer.concat([text,Buffer.alloc((4-text.length%4)%4,32)]),header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(28+body.length+bin.length,8);header.writeUInt32LE(body.length,12);header.writeUInt32LE(0x4e4f534a,16);const bh=Buffer.alloc(8);bh.writeUInt32LE(bin.length);bh.writeUInt32LE(0x004e4942,4);writeFileSync(path,Buffer.concat([header,body,bh,bin]));
 console.log(JSON.stringify({level,bones:profile.joints,tracks:idle.channels.length,samples:samples+1,forwardYaw:json.extras.maximaLocomotion.forwardYaw,strideLength,referenceSpeed:strideLength/profile.duration,paws:profile.limbs.map(c=>({id:c.id,vertices:c.pawVertices.length,single:!!c.single}))}));
}
for(const level of process.argv.slice(2).map(Number).length?process.argv.slice(2).map(Number):[1,2,3])bake(level,`dist/assets/creatures/hufflepuff-${level}.glb`);
