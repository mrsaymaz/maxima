import * as T from './vendor/three.module.min.js';
// Low-poly 3D cosmetics and the run reward chest, built from primitives so no extra downloads are needed.
const mat=(color,opts={})=>new T.MeshStandardMaterial({color,roughness:.7,...opts});
function add(parent,geometry,material,x=0,y=0,z=0){const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}

// Reward chest with a hinged lid. open(t) animates 0 (closed) → 1 (open).
export function makeChest(){
 const g=new T.Group(),wood=mat('#8a5a2e'),dark=mat('#5b3a1d'),gold=mat('#f2c55a',{metalness:.55,roughness:.32,emissive:'#7a5212',emissiveIntensity:.25}),glow=new T.MeshBasicMaterial({color:'#ffe9a6',transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending});
 add(g,new T.BoxGeometry(1.1,.62,.74),wood,0,.31,0);for(const x of[-.5,.5])add(g,new T.BoxGeometry(.09,.66,.8),gold,x,.33,0);add(g,new T.BoxGeometry(1.16,.08,.8),dark,0,.04,0);
 const lid=new T.Group();lid.position.set(0,.62,-.37);g.add(lid);const top=add(lid,new T.CylinderGeometry(.37,.37,1.1,14,1,false,0,Math.PI),wood,0,0,.37);top.rotation.z=Math.PI/2;for(const x of[-.5,.5]){const band=add(lid,new T.CylinderGeometry(.39,.39,.09,14,1,false,0,Math.PI),gold,x,0,.37);band.rotation.z=Math.PI/2;}
 add(g,new T.BoxGeometry(.2,.24,.08),gold,0,.56,.4);
 const light=add(g,new T.SphereGeometry(.42,16,10),glow,0,.7,0);light.castShadow=false;light.scale.set(1.2,.6,.8);
 const beam=add(g,new T.CylinderGeometry(.05,.5,3.2,16,1,true),new T.MeshBasicMaterial({color:'#fff1b8',transparent:true,opacity:.22,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending}),0,2.1,0);beam.castShadow=false;
 g.userData={lid,light,beam,openness:0};
 g.userData.update=(time,open)=>{const u=g.userData;u.openness+=(open-u.openness)*.12;lid.rotation.x=-u.openness*1.9;light.material.opacity=u.openness*.85;beam.visible=open<.5;beam.material.opacity=.16+Math.sin(time*3)*.06;if(open<.5)g.rotation.y=Math.sin(time*1.4)*.08;g.position.y=open<.5?Math.max(0,Math.sin(time*3.2))*.06:0;};
 return g;
}

// Hats sit on the top of the creature's bounding box and scale with its height.
export function makeHat(id){
 const g=new T.Group();g.name='cosmetic-hat';
 if(id==='hat-leaf'){const leaf=mat('#6fae5a');const cap=add(g,new T.SphereGeometry(.5,14,8,0,Math.PI*2,0,Math.PI/2),leaf);cap.scale.set(1,.55,1);const tip=add(g,new T.ConeGeometry(.12,.5,6),mat('#4f8a3f'),.1,.3,0);tip.rotation.z=-.6;}
 else if(id==='hat-acorn'){const cap=add(g,new T.SphereGeometry(.5,14,8,0,Math.PI*2,0,Math.PI/2),mat('#a8743c'));cap.scale.set(1,.6,1);add(g,new T.CylinderGeometry(.05,.07,.22,6),mat('#6b4a24'),0,.38,0);}
 else if(id==='hat-party'){add(g,new T.ConeGeometry(.34,.95,18),mat('#e86aa5'),0,.47,0);add(g,new T.SphereGeometry(.11,10,8),mat('#ffe066'),0,.98,0);add(g,new T.TorusGeometry(.33,.04,6,18),mat('#7fd3ff'),0,.05,0).rotation.x=Math.PI/2;}
 else if(id==='hat-flower'){const ring=add(g,new T.TorusGeometry(.42,.06,6,20),mat('#6fa85a'),0,.03,0);ring.rotation.x=Math.PI/2;for(let i=0;i<7;i++){const a=i/7*Math.PI*2;add(g,new T.SphereGeometry(.1,8,6),mat(['#f3a7c3','#fff1a8','#c7a6ff'][i%3]),Math.cos(a)*.42,.08,Math.sin(a)*.42);}}
 else if(id==='hat-wizard'){const cone=add(g,new T.ConeGeometry(.34,1.15,18),mat('#5a5fc4'),0,.58,0);cone.rotation.z=.12;add(g,new T.CylinderGeometry(.58,.58,.05,22),mat('#4a4fae'),0,.02,0);add(g,new T.OctahedronGeometry(.1),mat('#ffe066',{emissive:'#b8901a',emissiveIntensity:.6}),.12,.75,.24);}
 else if(id==='hat-crown'){const gold=mat('#f2c94c',{metalness:.65,roughness:.28,emissive:'#6b4c0a',emissiveIntensity:.2});add(g,new T.CylinderGeometry(.36,.4,.24,16,1,true),gold,0,.12,0);for(let i=0;i<6;i++){const a=i/6*Math.PI*2;add(g,new T.ConeGeometry(.08,.22,5),gold,Math.cos(a)*.37,.33,Math.sin(a)*.37);add(g,new T.SphereGeometry(.045,8,6),mat(['#e84a5f','#4fc3e8'][i%2],{roughness:.2}),Math.cos(a)*.39,.15,Math.sin(a)*.39);}}
 return g;
}
export function placeHat(creature,model,hat){const yaw=creature.rotation.y,scale=creature.scale.clone();creature.rotation.y=0;creature.scale.set(1,1,1);creature.updateMatrixWorld(true);const box=new T.Box3().setFromObject(model),size=box.getSize(new T.Vector3()),top=creature.worldToLocal(new T.Vector3((box.min.x+box.max.x)/2,box.max.y,(box.min.z+box.max.z)/2));creature.rotation.y=yaw;creature.scale.copy(scale);creature.updateMatrixWorld(true);hat.position.set(top.x,top.y-size.y*.07,top.z);hat.scale.setScalar(Math.max(.14,Math.min(size.x,size.z)*.5));return hat;}

// Camp decorations are arranged around the creature behind and beside it, never between it and the camera.
export const CAMP_SPOTS={'camp-tent':[-1.25,-2.7,.45],'camp-fire':[1.0,-1.3,0],'camp-lanterns':[0,-2.2,0],'camp-flags':[0,-3.4,0],'camp-mushrooms':[-.75,-.7,0],'camp-crystal':[1.25,-2.1,0]};
export function makeCampDecor(id){
 const g=new T.Group();g.name=id;
 if(id==='camp-tent'){const cloth=mat('#d9b46a',{side:T.DoubleSide});const tent=add(g,new T.ConeGeometry(1.1,1.5,4,1,true),cloth,0,.75,0);tent.rotation.y=Math.PI/4;add(g,new T.PlaneGeometry(.5,.8),mat('#5b3a1d'),0,.4,.62);add(g,new T.CylinderGeometry(.03,.03,1.9,5),mat('#6b4a24'),0,.95,0);}
 if(id==='camp-fire'){for(let i=0;i<5;i++){const log=add(g,new T.CylinderGeometry(.06,.07,.7,6),mat('#6b4a24'),0,.1,0);log.rotation.z=Math.PI/2.4;log.rotation.y=i/5*Math.PI*2;}const flame=add(g,new T.ConeGeometry(.22,.6,8),new T.MeshBasicMaterial({color:'#ffb347'}),0,.38,0);flame.castShadow=false;const core=add(g,new T.ConeGeometry(.12,.38,8),new T.MeshBasicMaterial({color:'#fff1a8'}),0,.3,0);core.castShadow=false;const light=new T.PointLight('#ff9a3c',2.2,6,1.6);light.position.y=.6;g.add(light);g.userData.flame=[flame,core,light];for(let i=0;i<9;i++){const a=i/9*Math.PI*2;add(g,new T.DodecahedronGeometry(.1),mat('#8f8a80'),Math.cos(a)*.42,.05,Math.sin(a)*.42);}}
 if(id==='camp-lanterns')for(const x of[-1.15,1.15]){add(g,new T.CylinderGeometry(.04,.05,1.5,6),mat('#6b4a24'),x,.75,0);const lamp=add(g,new T.SphereGeometry(.17,12,10),mat('#ffcf7a',{emissive:'#ff9f3a',emissiveIntensity:1.4}),x,1.5,0);lamp.scale.y=1.25;lamp.castShadow=false;}
 if(id==='camp-flags'){for(const x of[-1.5,1.5])add(g,new T.CylinderGeometry(.04,.05,1.7,6),mat('#6b4a24'),x,.85,0);for(let i=0;i<9;i++){const t=i/8,x=-1.4+2.8*t,y=1.62-Math.sin(t*Math.PI)*.35;const flag=add(g,new T.ConeGeometry(.12,.26,3),mat(['#f08a6a','#ffd166','#7fd3ff','#9be38f'][i%4],{side:T.DoubleSide}),x,y-.13,0);flag.rotation.x=Math.PI;flag.castShadow=false;}}
 if(id==='camp-mushrooms')for(let i=0;i<7;i++){const a=i/7*Math.PI*2,r=.55+(i%2)*.12,h=.18+(i%3)*.07;add(g,new T.CylinderGeometry(.035,.045,h,6),mat('#f1e6c8'),Math.cos(a)*r,h/2,Math.sin(a)*r);const cap=add(g,new T.SphereGeometry(.11+(i%2)*.03,10,6,0,Math.PI*2,0,Math.PI/2),mat('#e06a5a'),Math.cos(a)*r,h,Math.sin(a)*r);cap.scale.y=.8;}
 if(id==='camp-crystal'){const c=add(g,new T.OctahedronGeometry(.42),mat('#9fe6ff',{emissive:'#4fb8e8',emissiveIntensity:.9,roughness:.15,metalness:.1,transparent:true,opacity:.92}),0,.7,0);c.scale.y=1.7;add(g,new T.DodecahedronGeometry(.3),mat('#8a93a0'),0,.12,0);g.userData.spin=c;}
 return g;
}
export function animateCamp(group,time){group.traverse(o=>{if(o.userData.flame){const[f,c,l]=o.userData.flame;const k=1+Math.sin(time*13)*.08+Math.sin(time*7.3)*.06;f.scale.set(1,k,1);c.scale.set(1,2-k,1);l.intensity=2+Math.sin(time*11)*.4;}if(o.userData.spin)o.userData.spin.rotation.y=time*.6;});}
