import * as T from './vendor/three.module.min.js';
import{surfaceMaterial}from'./surface-materials.js';

// The colossal guardian's body, shared by its arena fight (guardian-stage) and its appearances on the runner track.
// A stone colossus in layered armour with glowing veins and a faceted core, given a character per arena:
// Whisperwood's forest titan (moss, vines, a leafy branch crown), Skyreach's sky sentinel (sandstone with gold,
// wing fins, banners, orbiting stones) and Stormglass's crystal colossus (shards, floating crystals).
// The parts the fight animates (torso, head, arms, core petals, seals) and the overall size are unchanged.
export const GUARDIAN_PALETTES=[{stone:'#56675a',edge:'#a3ae88',dark:'#273d36',energy:'#bde37d',ground:'#888a6d'},{stone:'#637d89',edge:'#c2cfca',dark:'#273e51',energy:'#a8e5ed',ground:'#9aaba9'},{stone:'#5c5679',edge:'#a49db8',dark:'#302c49',energy:'#debbef',ground:'#77748a'}];
const THEMES=[
 {stone:'#5e7457',plate:'#8f9c6a',dark:'#2c3f2c',trim:'#c9b36a',energy:'#c6ff6a',accent:'#4f9a3a',accent2:'#e8f7a0'},
 {stone:'#c9a77a',plate:'#e6d2a8',dark:'#6e5338',trim:'#f2c45a',energy:'#7ff3ff',accent:'#d9583c',accent2:'#3fc6d0'},
 {stone:'#4a4278',plate:'#7d73b8',dark:'#251f45',trim:'#c7b8ff',energy:'#f0a6ff',accent:'#62f5ff',accent2:'#b68cff'},
];
export function guardianMaterials(area=0){const p=GUARDIAN_PALETTES[area]||GUARDIAN_PALETTES[0];return{stone:surfaceMaterial('stone',p.stone,{roughness:.85}),edge:surfaceMaterial('stone',p.edge,{roughness:.75}),dark:surfaceMaterial('stone',p.dark,{roughness:.9}),ground:surfaceMaterial('stone',p.ground,{roughness:1}),metal:surfaceMaterial('metal','#bcaa78',{roughness:.55}),energy:Object.assign(new T.MeshStandardMaterial({color:p.energy,emissive:p.energy,emissiveIntensity:.7,roughness:.3}),{userData:{surface:'effect'}})};}
function mesh(parent,g,m,x=0,y=0,z=0,shadow=true){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=shadow;o.receiveShadow=true;parent.add(o);return o;}
// Merges the still meshes that share a parent, material and shadow setting into one draw call.
// Meshes in `keep` (animated on their own) and meshes with children stay as they are.
export function mergeStatic(root,keep){const parents=[];root.traverse(o=>{if(!o.isMesh)parents.push(o);});
 for(const parent of parents){const groups=new Map();for(const o of parent.children)if(o.isMesh&&!keep.has(o)&&!o.children.length){const key=o.material.uuid+(o.castShadow?'+':'-');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o);}
  for(const list of groups.values()){if(list.length<2)continue;const parts=list.map(o=>{o.updateMatrix();const g=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(o.matrix);o.geometry.dispose();return g;}),names=['position','normal','uv'].filter(n=>parts.every(g=>g.attributes[n])),merged=new T.BufferGeometry();
   for(const n of names){const size=parts[0].attributes[n].itemSize,array=new Float32Array(parts.reduce((a,g)=>a+g.attributes[n].count*size,0));let at=0;for(const g of parts){array.set(g.attributes[n].array,at);at+=g.attributes[n].array.length;}merged.setAttribute(n,new T.BufferAttribute(array,size));}
   parts.forEach(g=>g.dispose());merged.computeBoundingSphere();const one=new T.Mesh(merged,list[0].material);one.castShadow=list[0].castShadow;one.receiveShadow=true;one.renderOrder=list[0].renderOrder;list.forEach(o=>parent.remove(o));parent.add(one);}}}
function limb(parent,x,y,z,mat){const g=new T.Group();g.position.set(x,y,z);parent.add(g);mesh(g,new T.DodecahedronGeometry(1,0),mat,0,-1.1,0).scale.set(.78,1.5,.9);return g;}
function themeMaterials(area,m){
 const t=THEMES[area]||THEMES[0],stone=(c,r=.85)=>surfaceMaterial('stone',c,{roughness:r,flatShading:true});
 const glow=new T.MeshBasicMaterial({color:t.energy,transparent:true,opacity:.55,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});glow.userData.surface='effect';
 // The shared energy material brightens to the theme colour: veins, eyes and the core all pulse together.
 m.energy.color.set(t.energy);m.energy.emissive.set(t.energy);m.energy.emissiveIntensity=1.1;
 return{t,body:stone(t.stone),plate:stone(t.plate,.6),deep:stone(t.dark,.95),trim:surfaceMaterial('metal',t.trim,{roughness:.35,metalness:.6}),accent:stone(t.accent,.7),accent2:stone(t.accent2,.5),glow};
}
// A beveled shield-shaped plate in the XY plane, facing +z.
function plateGeometry(w,h,d=.35){const s=new T.Shape();s.moveTo(-w/2,h/2);s.lineTo(w/2,h/2);s.lineTo(w/2*.85,-h*.15);s.lineTo(0,-h/2);s.lineTo(-w/2*.85,-h*.15);s.closePath();return new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSize:.08,bevelThickness:.08,bevelSegments:1}).translate(0,0,-d/2);}
// Returns the body parts the fight animates: torso, head, arms, core petals and seals; `boss` is the root group.
// `animate(t)` drives the idle life (core pulse, eye glow, orbiting stones or crystals, swaying vines).
export function buildGuardianFigure(area=0,m=guardianMaterials(area)){
 const k=themeMaterials(area,m),t=k.t,motion=[],keep=new Set();
 const boss=new T.Group();boss.name='colossal-guardian';
 const torso=new T.Group();torso.position.y=5.8;boss.add(torso);
 // Body masses: a broad chest, a narrower waist and layered plates over both.
 mesh(torso,new T.DodecahedronGeometry(2.2,0),k.body,0,0,0).scale.set(1.25,1.12,.75);
 mesh(torso,new T.DodecahedronGeometry(1.3,0),k.deep,0,-2.0,0).scale.set(1.25,.8,1);
 const chest=mesh(torso,plateGeometry(3.4,2.6),k.plate,0,.35,1.45);chest.rotation.x=-.12;
 for(const side of[-1,1]){const rib=mesh(torso,new T.BoxGeometry(1.1,.26,.3),k.trim,side*1.25,-.75,1.32);rib.rotation.z=side*.35;}
 // Energy veins run from the core across the chest plate.
 for(const[x,y,r,len]of[[-.95,.85,.7,1.3],[.95,.85,-.7,1.3],[-1.2,-.2,-.5,1],[1.2,-.2,.5,1],[0,1.25,0,.9]]){const v=mesh(torso,new T.BoxGeometry(len,.09,.08),m.energy,x,y,1.72,false);v.rotation.z=r;}
 const belt=mesh(torso,new T.TorusGeometry(1.75,.24,6,18),k.trim,0,-1.55,0);belt.rotation.x=Math.PI/2;belt.scale.set(1,.72,1);
 for(let i=0;i<5;i++){const a=-.9+i*.45;mesh(torso,new T.OctahedronGeometry(.17),m.energy,Math.sin(a)*1.78,-1.55,Math.cos(a)*1.3,false);}
 // Head: a heavy brow, glowing eyes with halos, and the jaw.
 const head=new T.Group();head.position.set(0,2.65,.1);torso.add(head);
 mesh(head,new T.DodecahedronGeometry(1.42,0),k.body,0,0,0).scale.set(1,1.05,.8);
 mesh(head,new T.BoxGeometry(2.0,.5,.55),k.plate,0,.32,.95).rotation.x=-.2;
 const eyes=[];for(const side of[-1,1]){const eye=mesh(head,new T.BoxGeometry(.62,.22,.2),m.energy,side*.5,.02,1.2,false);eye.rotation.z=side*.22;
  const halo=mesh(head,new T.PlaneGeometry(1.4,.8),k.glow,side*.5,.02,1.33,false);halo.renderOrder=4;eyes.push(halo);
  mesh(head,new T.BoxGeometry(.36,.65,.55),k.deep,side*.52,-.75,.8).rotation.z=side*.15;}
 mesh(head,new T.BoxGeometry(.9,.24,.36),k.deep,0,-.63,1.01);mesh(head,new T.ConeGeometry(.55,.9,5),k.plate,0,-1.18,.4).rotation.x=Math.PI;
 const mouth=mesh(head,new T.BoxGeometry(.7,.07,.05),m.energy,0,-.48,1.2,false);
 // Arms: pauldrons with spikes, plated gauntlets with glowing knuckles, energy bands.
 const arms=[];for(const side of[-1,1]){
  const arm=limb(torso,side*2.65,.9,0,k.body);
  const pauldron=mesh(arm,new T.DodecahedronGeometry(1.45,0),k.plate,0,.05,0);pauldron.scale.set(1.08,.72,1.05);
  mesh(arm,new T.TorusGeometry(.95,.13,5,14),k.trim,0,-.55,0).rotation.x=Math.PI/2;
  mesh(arm,new T.BoxGeometry(.12,1.2,.12),m.energy,side*.55,-1.4,.55,false);
  const forearm=limb(arm,0,-2.4,.2,k.deep);
  mesh(forearm,new T.CylinderGeometry(.92,.8,1.5,7),k.plate,0,-1.25,.05);
  mesh(forearm,new T.DodecahedronGeometry(.97,0),k.body,0,-2.4,.25).scale.set(1.15,.8,1.05);
  for(let j=0;j<3;j++){mesh(forearm,new T.ConeGeometry(.18,.85,5),k.trim,(j-1)*.45,-2.85,.6).rotation.x=2.1;mesh(forearm,new T.OctahedronGeometry(.12),m.energy,(j-1)*.45,-2.35,.98,false);}
  arms.push({arm,forearm,side});
  const leg=limb(boss,side*1.25,3,0,k.body);
  mesh(leg,new T.BoxGeometry(1.8,.8,2.5),k.plate,0,-2.55,.55);mesh(leg,new T.BoxGeometry(1.95,.16,2.6),k.trim,0,-2.1,.55);
  mesh(leg,plateGeometry(1.1,1.2,.25),k.plate,0,-.55,.75,true);mesh(leg,new T.BoxGeometry(.1,1.1,.1),m.energy,0,-1.25,.82,false);
 }
 // The core: a bright faceted gem behind armoured petals, with a glowing halo that pulses.
 const core=new T.Group();core.position.set(0,-.2,1.8);torso.add(core);
 mesh(core,new T.IcosahedronGeometry(.75,0),m.energy,0,0,0,false).scale.set(.85,1,.6);
 const coreHalo=mesh(core,new T.RingGeometry(.85,1.35,24),k.glow,0,0,.25,false);coreHalo.renderOrder=4;
 const petals=[];for(let i=0;i<6;i++){const a=i*Math.PI/3,g=new T.Group();g.rotation.z=a;core.add(g);mesh(g,new T.BoxGeometry(.7,.75,.34),k.trim,0,.48,.2);petals.push(g);}
 const seals=[];for(let i=0;i<3;i++){const g=new T.Group();g.position.set((i-1)*2.1,3.4,2.2);boss.add(g);const hoop=mesh(g,new T.TorusGeometry(.52,.08,5,12),m.energy,0,0,0,false);hoop.rotation.z=Math.PI/4;mesh(g,new T.OctahedronGeometry(.22),k.trim);seals.push(g);}
 // Arena character.
 if(area===0){
  // Forest titan: moss caps, a crown of branching antlers with leaves, hanging vines, shoulder mushrooms.
  for(const[x,y,z,s]of[[0,1.15,0,1.1],[-2.65,1.6,0,.85],[2.65,1.6,0,.85],[0,1.2,.6,.7]]){const moss=mesh(x===0&&y===1.15?head:torso,new T.IcosahedronGeometry(1,1),k.accent,x===0&&y===1.15?0:x,x===0&&y===1.15?.9:y,z,true);moss.scale.set(s*1.2,s*.45,s*1.1);}
  for(const side of[-1,1]){const antler=new T.Group();antler.position.set(side*.7,1.1,-.1);antler.rotation.z=-side*.45;head.add(antler);
   mesh(antler,new T.CylinderGeometry(.09,.18,2.4,5).translate(0,1.2,0),k.deep);
   for(let j=0;j<3;j++){const tine=mesh(antler,new T.CylinderGeometry(.06,.1,1.1,5).translate(0,.55,0),k.deep,0,.8+j*.55,0);tine.rotation.z=side*(.9-j*.2);mesh(tine,new T.IcosahedronGeometry(.36,0),k.accent2,0,1.1,0).scale.set(1,.6,1);}}
  for(const side of[-1,1])for(let j=0;j<3;j++){const cap=mesh(torso,new T.SphereGeometry(.42,10,6,0,Math.PI*2,0,Math.PI/2),new T.MeshStandardMaterial({color:j%2?'#ff7a3c':'#ff4f6d',emissive:'#ff3f2a',emissiveIntensity:.25,roughness:.5}),side*(2.2+j*.35),1.75+j*.1,-.4+j*.3,false);cap.material.userData.surface='foliage';}
  for(let i=0;i<9;i++){const side=i%2?1:-1,len=1.6+(i%3)*.7,vine=new T.Group();vine.position.set(side*(.6+(i%4)*.55),-1.2+((i*3)%4)*.4,1.15+((i*5)%3)*.15);torso.add(vine);
   mesh(vine,new T.CylinderGeometry(.04,.04,len,4).translate(0,-len/2,0),k.accent,0,0,0,false);for(let j=0;j<3;j++)mesh(vine,new T.SphereGeometry(.12,6,4),k.accent2,0,-len*(.3+j*.3),0,false).scale.set(1.3,.6,1);
   motion.push(time=>{vine.rotation.x=Math.sin(time*1.3+i)*.12;vine.rotation.z=Math.sin(time*1.1+i*.7)*.08;});}
 }
 if(area===1){
  // Sky sentinel: gold-banded sandstone, stone wing fins, banners and a ring of orbiting stones.
  for(const side of[-1,1]){for(let j=0;j<3;j++){const fin=mesh(torso,new T.BoxGeometry(.35,2.6-j*.5,1.2),k.plate,side*(1.2+j*.75),1.4+j*.3,-1.3-j*.1);fin.rotation.z=side*(.5+j*.22);fin.rotation.y=side*.35;mesh(fin,new T.BoxGeometry(.38,.18,1.22),k.trim,0,(2.6-j*.5)/2-.2,0);}
   const banner=new T.Group();banner.position.set(side*.75,-1.7,1.3);torso.add(banner);const cloth=mesh(banner,new T.PlaneGeometry(.75,2.6).translate(0,-1.3,0),new T.MeshStandardMaterial({color:side<0?t.accent:t.accent2,side:T.DoubleSide,roughness:.8}),0,0,0,false);cloth.material.userData.surface='paper';mesh(banner,new T.BoxGeometry(.8,.12,.12),k.trim,0,0,0);
   motion.push(time=>{banner.rotation.x=-.15+Math.sin(time*2.2+side)*.12;});}
  for(const side of[-1,1])mesh(head,new T.ConeGeometry(.3,1.8,4),k.trim,side*.8,1.05,-.1).rotation.z=-side*.55;
  const orbit=new T.Group();orbit.position.y=6.2;boss.add(orbit);const ring=mesh(orbit,new T.TorusGeometry(4.6,.05,4,48),k.glow,0,0,0,false);ring.rotation.x=Math.PI/2;
  const stones=[];for(let i=0;i<7;i++){const s=mesh(orbit,new T.DodecahedronGeometry(.45+(i%3)*.15,0),i%2?k.plate:k.body,0,0,0,true);stones.push(s);keep.add(s);}
  motion.push(time=>{stones.forEach((s,i)=>{const a=time*.45+i*Math.PI*2/7;s.position.set(Math.cos(a)*4.6,Math.sin(time*1.4+i)*.5,Math.sin(a)*4.6);s.rotation.set(time+i,time*.7,0);});});
 }
 if(area===2){
  // Crystal colossus: crystal shards burst from shoulders, back and brow; loose crystals float around it.
  const crystal=(color,glow)=>{const c=new T.MeshStandardMaterial({color,emissive:glow,emissiveIntensity:.8,roughness:.15,metalness:.1,flatShading:true});c.userData.surface='glass';return c;};
  const teal=crystal(t.accent,'#18b8d8'),violet=crystal(t.accent2,'#7a3dff');
  for(const[parent,x,y,z,h,rz,rx,c]of[[torso,-2.4,2.1,-.3,2.6,.55,-.2,teal],[torso,-2.9,1.6,.2,1.8,.9,0,violet],[torso,2.4,2.1,-.3,2.6,-.55,-.2,violet],[torso,2.9,1.6,.2,1.8,-.9,0,teal],[torso,-.8,1.4,-1.4,3.2,.25,-.6,teal],[torso,.8,1.4,-1.4,3.4,-.25,-.6,violet],[torso,0,1.8,-1.2,3.8,0,-.45,teal],[head,-.5,1.05,0,1.6,.35,0,violet],[head,.5,1.05,0,1.6,-.35,0,teal],[head,0,1.25,0,2.1,0,0,violet]]){
   const shard=mesh(parent,new T.ConeGeometry(.42,h,5).translate(0,h/2,0),c,x,y,z,true);shard.rotation.z=rz;shard.rotation.x=rx;}
  for(let i=0;i<6;i++){const v=mesh(torso,new T.BoxGeometry(.07,1+(i%3)*.4,.07),m.energy,-1.6+i*.64,-.5+((i*3)%4)*.3,1.6,false);v.rotation.z=((i*5)%7-3)*.25;}
  const floaters=[];for(let i=0;i<8;i++){const f=mesh(boss,new T.OctahedronGeometry(.32+(i%3)*.12,0),i%2?teal:violet,0,0,0,false);f.scale.y=1.8;floaters.push(f);keep.add(f);}
  motion.push(time=>{floaters.forEach((f,i)=>{const a=time*.35+i*Math.PI/4,r=4+(i%2)*1.2;f.position.set(Math.cos(a)*r,5+Math.sin(time*1.1+i*.9)*1.6+(i%3),Math.sin(a)*r);f.rotation.y=time*1.5+i;});
   teal.emissiveIntensity=.65+.35*Math.sin(time*2.3);violet.emissiveIntensity=.65+.35*Math.cos(time*2.1);});
 }
 keep.add(coreHalo).add(mouth);eyes.forEach(e=>keep.add(e));mergeStatic(boss,keep);
 const animate=time=>{const pulse=.5+.5*Math.sin(time*2.6);m.energy.emissiveIntensity=.95+.55*pulse;k.glow.opacity=.35+.3*pulse;coreHalo.rotation.z=time*.6;coreHalo.scale.setScalar(1+.12*pulse);eyes.forEach(e=>e.scale.setScalar(.9+.2*pulse));mouth.scale.x=.9+.2*pulse;for(const step of motion)step(time);};
 animate(0);
 return{boss,torso,head,arms,core,petals,seals,materials:m,animate};
}
