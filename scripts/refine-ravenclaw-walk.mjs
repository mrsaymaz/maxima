// Rebuild only Walk on the eleven runtime birds. Other clips, bind data, skins,
// original geometry and images remain intact. Run from the project root.
import fs from'node:fs';import path from'node:path';
import * as T from'../dist/vendor/three.module.min.js';
import{GLTFLoader}from'../dist/vendor/loaders/GLTFLoader.js';
import{readGLB,packGLB}from'./lib/glb.mjs';
import{FORM_HEIGHTS}from'../dist/world-layout.js';
globalThis.ProgressEvent??=class extends Event{constructor(t,o={}){super(t);Object.assign(this,o);}};
const N=64,duration=.72,report=[],clamp=n=>Math.max(-1,Math.min(1,n));
const hermite=(a,b,m,u)=>(2*u**3-3*u*u+1)*a+(u**3-2*u*u+u)*m+(-2*u**3+3*u*u)*b+(u**3-u*u)*m;
for(let level=0;level<=10;level++){
 const derived=level<9,file=`dist/assets/${derived?'rigs':'creatures'}/ravenclaw-${level}.${derived?'gltf':'glb'}`;
 let j,binary;if(derived)j=JSON.parse(fs.readFileSync(file));else({json:j,binary}=readGLB(file));
 let buffers=derived?j.buffers.map(b=>fs.readFileSync(path.resolve(path.dirname(file),b.uri))):[binary];
 const previous=j.extras.ravenclawWalkV2,buffer=derived?1:0;
 if(previous){j.accessors.length=previous.baseAccessors;j.bufferViews.length=previous.baseViews;buffers[buffer]=buffers[buffer].subarray(0,previous.baseBytes);j.animations[j.animations.findIndex(a=>a.name==='Walk')]=previous.sourceWalk;}
 const original={baseAccessors:j.accessors.length,baseViews:j.bufferViews.length,baseBytes:buffers[buffer].length,sourceWalk:structuredClone(j.animations.find(a=>a.name==='Walk'))};
 const copy=structuredClone(j);delete copy.images;delete copy.textures;delete copy.samplers;for(const m of copy.materials||[])delete m.pbrMetallicRoughness?.baseColorTexture;
 copy.buffers.forEach((b,i)=>{b.uri='data:application/octet-stream;base64,'+buffers[i].toString('base64');b.byteLength=buffers[i].length;});
 const g=await new GLTFLoader().parseAsync(JSON.stringify(copy),''),scene=g.scene,meta=j.extras.maximaLocomotion,rig=j.extras.maximaRig,H0=rig?.height??meta.restDimensions.height;
 scene.updateMatrixWorld(true);const byIndex=new Map();scene.traverse(o=>{const i=g.parser.associations.get(o)?.nodes;if(i!==undefined)byIndex.set(i,o);});
 const boneIndices=j.skins[0].joints,rest=new Map(boneIndices.map(i=>{const o=byIndex.get(i);return[i,{p:o.position.clone(),q:o.quaternion.clone()}];}));
 const rootIndex=meta.rootNode,root=byIndex.get(rootIndex),f=new T.Vector3(...(rig?.forward??meta.forwardVector)),r=new T.Vector3(f.z,0,-f.x),meshes=[];
 scene.traverse(o=>{if(o.isSkinnedMesh)meshes.push(o);});
 const v=new T.Vector3();function bounds(){scene.updateMatrixWorld(true);const b=new T.Box3();for(const mesh of meshes)for(let k=0;k<mesh.geometry.attributes.position.count;k++){mesh.getVertexPosition(k,v);b.expandByPoint(v.applyMatrix4(mesh.matrixWorld));}return b;}
 const restBounds=bounds(),ground=restBounds.min.y,H=derived?H0:restBounds.getSize(new T.Vector3()).y;
 const upLocal=new T.Vector3(0,1,0).applyMatrix3(new T.Matrix3().setFromMatrix4(root.parent.matrixWorld.clone().invert()));
 const mixer=derived?null:new T.AnimationMixer(scene),oldWalk=g.animations.find(c=>c.name==='Walk');if(mixer)mixer.clipAction(oldWalk).play();
 const rotate=(i,axis,a)=>byIndex.get(i).quaternion.multiply(new T.Quaternion().setFromAxisAngle(axis,a));
 function leg(data,along,lift){const[hip,knee,ankle]=data.joints.map(i=>rig.jointBase+i),v1=rest.get(knee).p,v2=rest.get(ankle).p,L1=v1.length(),L2=v2.length(),dy=rig.positions[data.joints[2]][1]-rig.positions[data.joints[0]][1]+lift,D=Math.min(L1+L2-1e-7,Math.hypot(along,dy)),target=Math.atan2(along,-dy),a=target-Math.acos(clamp((L1*L1+D*D-L2*L2)/(2*L1*D))),k=Math.PI-Math.acos(clamp((L1*L1+L2*L2-D*D)/(2*L1*L2))),a0=Math.atan2(v1.dot(f),-v1.y),k0=Math.atan2(v2.dot(f),-v2.y)-a0;rotate(hip,r,-(a-a0));rotate(knee,r,-(k-k0));rotate(ankle,r,a-a0+k-k0);}
 const frames=[];for(let n=0;n<N;n++){
  const t=n/N;if(derived){for(const[i,b]of rest){const o=byIndex.get(i);o.position.copy(b.p);o.quaternion.copy(b.q);}
   for(const data of Object.values(rig.limbs))if(data.role==='wing'){rotate(rig.jointBase+data.joints[0],f,data.side*.013*Math.sin(4*Math.PI*t));rotate(rig.jointBase+data.joints[1],f,data.side*.004*Math.sin(4*Math.PI*t));}
   else if(data.joints.length===4){const phase=(t+data.phase)%1,stance=phase<.62,u=stance?phase/.62:(phase-.62)/.38,along=stance?.035-.07*u:hermite(-.035,.035,-.07*.38/.62,u),lift=stance?0:Math.sin(Math.PI*u)**2*.03;leg(data,along*H,lift*H);}
   for(const h of rig.heads)rotate(rig.jointBase+h,r,.0025*Math.sin(4*Math.PI*t));
  }else mixer.setTime(t*oldWalk.duration);
  // Keep ground correction small and continuous instead of following the
  // single lowest animated vertex with an abrupt change on foot exchange.
  const b=bounds();root.position.addScaledVector(upLocal,ground-b.min.y);
  frames.push(new Map(boneIndices.map(i=>[i,{p:byIndex.get(i).position.clone(),q:byIndex.get(i).quaternion.clone()}])));
 }
 const rootY=frames.map(fr=>fr.get(rootIndex).p.y),smoothY=rootY.map((_,i)=>[-2,-1,0,1,2].reduce((s,k)=>s+rootY[(i+k+N)%N]*[1,4,6,4,1][k+2]/16,0));
 frames.forEach((fr,i)=>fr.get(rootIndex).p.y=smoothY[i]);
 // The native generated rig also has abrupt changes at leg phase boundaries.
 // Filter its loop in pose space, then normalize quaternions; never scale skin.
 if(!derived){const snapshot=frames.map(fr=>new Map([...fr].map(([i,b])=>[i,{p:b.p.clone(),q:b.q.clone()}])));for(let n=0;n<N;n++)for(const i of boneIndices){const result=frames[n].get(i),center=snapshot[n].get(i),q=new T.Vector4(0,0,0,0),p=new T.Vector3();for(let k=-2;k<=2;k++){const b=snapshot[(n+k+N)%N].get(i),w=[1,4,6,4,1][k+2]/16,sign=center.q.dot(b.q)<0?-1:1;q.addScaledVector(new T.Vector4(...b.q.toArray()),w*sign);p.addScaledVector(b.p,w);}result.q.set(...q.toArray()).normalize();result.p.copy(p);}}
 let minGround=Infinity,maxGround=-Infinity,minRatio=Infinity,maxRatio=0,maxRootStep=0;
 for(let n=0;n<N;n++){for(const[i,b]of frames[n]){const o=byIndex.get(i);o.position.copy(b.p);o.quaternion.copy(b.q);}const b=bounds();minGround=Math.min(minGround,(b.min.y-ground)/H);maxGround=Math.max(maxGround,(b.min.y-ground)/H);minRatio=Math.min(minRatio,b.getSize(v).y/H);maxRatio=Math.max(maxRatio,b.getSize(v).y/H);maxRootStep=Math.max(maxRootStep,Math.abs(frames[n].get(rootIndex).p.y-frames[(n+1)%N].get(rootIndex).p.y)/H);}
 if(Math.abs(minGround)>.018||Math.abs(maxGround)>.018||minRatio<.85||maxRatio>1.15)throw Error(`Unsafe Ravenclaw walk ${level}: ${[minGround,maxGround,minRatio,maxRatio]}`);
 const chunks=[buffers[buffer]];let bytes=chunks[0].length;
 const append=(values,type)=>{const pad=(4-bytes%4)%4;if(pad){chunks.push(Buffer.alloc(pad));bytes+=pad;}const b=Buffer.from(new Float32Array(values).buffer),view=j.bufferViews.push({buffer,byteOffset:bytes,byteLength:b.length})-1;chunks.push(b);bytes+=b.length;const a={bufferView:view,componentType:5126,count:values.length/(type==='VEC4'?4:type==='VEC3'?3:1),type};if(type==='SCALAR'){a.min=[0];a.max=[duration];}return j.accessors.push(a)-1;};
 const animatedKeys=new Set(original.sourceWalk.channels.map(c=>c.target.node+':'+c.target.path));
 const input=append(Array.from({length:N+1},(_,i)=>duration*i/N),'SCALAR'),walk={name:'Walk',samplers:[],channels:[]};
 for(const i of boneIndices)for(const[field,type]of[['rotation','VEC4'],['translation','VEC3']]){if(!derived&&!animatedKeys.has(i+':'+field))continue;const values=[];for(let n=0;n<=N;n++)values.push(...frames[n%N].get(i)[field==='rotation'?'q':'p'].toArray());const output=append(values,type),sampler=walk.samplers.push({input,output,interpolation:'LINEAR'})-1;walk.channels.push({sampler,target:{node:i,path:field}});}
 j.animations[j.animations.findIndex(a=>a.name==='Walk')]=walk;
 const speedFloor=1.8+.15*(FORM_HEIGHTS[level]-FORM_HEIGHTS[0]);
 if(derived)meta.referenceSpeed=.07/(.62*duration);
 meta.playbackReferenceSpeed=speedFloor/FORM_HEIGHTS[level];meta.referenceSpeedUnit='modelHeightsPerSecond';meta.playbackReferenceSpeedUnit='modelHeightsPerSecond';meta.walkCycleSeconds=duration;meta.contacts=[0,.5];
 j.extras.ravenclawWalkV2={...original,version:2,samples:N+1,duration,playbackSpeedWorld:speedFloor,stance:derived?.62:null,groundErrorInHeights:[minGround,maxGround],heightRatio:[minRatio,maxRatio],maxRootStepInHeights:maxRootStep,limitations:'Bounded visual cadence at fixed gameplay travel speed. No runtime terrain foot IK; fast travel can still slip. Native forms retain their supplied leg anatomy.'};
 const output=Buffer.concat(chunks);j.buffers[buffer].byteLength=output.length;
 if(derived){j.buffers[1].uri=`ravenclaw-${level}-stride-v2.bin`;const dest=path.resolve(path.dirname(file),j.buffers[1].uri);fs.writeFileSync(dest,output);fs.writeFileSync(file,JSON.stringify(j));}
 else fs.writeFileSync(file,packGLB(j,output));
 mixer?.stopAllAction();for(const mesh of meshes){mesh.skeleton.dispose();mesh.geometry.dispose();}report.push({level,duration,playbackSpeedWorld:speedFloor,groundErrorInHeights:[minGround,maxGround],maxRootStepInHeights:maxRootStep});
 console.log(JSON.stringify(report.at(-1)));
}
fs.writeFileSync('docs/ravenclaw-stride-v0.42.0.json',JSON.stringify(report,null,2)+'\n');
