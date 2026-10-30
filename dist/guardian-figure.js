import * as T from './vendor/three.module.min.js';
import{surfaceMaterial}from'./surface-materials.js';

// The colossal guardian's body, shared by its arena fight (guardian-stage) and its appearances on the runner track.
export const GUARDIAN_PALETTES=[{stone:'#56675a',edge:'#a3ae88',dark:'#273d36',energy:'#bde37d',ground:'#888a6d'},{stone:'#637d89',edge:'#c2cfca',dark:'#273e51',energy:'#a8e5ed',ground:'#9aaba9'},{stone:'#5c5679',edge:'#a49db8',dark:'#302c49',energy:'#debbef',ground:'#77748a'}];
export function guardianMaterials(area=0){const p=GUARDIAN_PALETTES[area]||GUARDIAN_PALETTES[0];return{stone:surfaceMaterial('stone',p.stone,{roughness:.85}),edge:surfaceMaterial('stone',p.edge,{roughness:.75}),dark:surfaceMaterial('stone',p.dark,{roughness:.9}),ground:surfaceMaterial('stone',p.ground,{roughness:1}),metal:surfaceMaterial('metal','#bcaa78',{roughness:.55}),energy:new T.MeshStandardMaterial({color:p.energy,emissive:p.energy,emissiveIntensity:.7,roughness:.3})};}
function mesh(parent,g,m,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function limb(parent,x,y,z,mat){const g=new T.Group();g.position.set(x,y,z);parent.add(g);mesh(g,new T.DodecahedronGeometry(1,0),mat,0,-1.1,0).scale.set(.78,1.5,.9);return g;}
// Returns the body parts the fight animates: torso, head, arms, core petals and seals; `boss` is the root group.
export function buildGuardianFigure(area=0,m=guardianMaterials(area)){
  const boss=new T.Group();boss.name='colossal-guardian';const torso=new T.Group();torso.position.y=5.8;boss.add(torso);
  mesh(torso,new T.DodecahedronGeometry(2.2,0),m.stone,0,0,0).scale.set(1.25,1.12,.75);
  mesh(torso,new T.DodecahedronGeometry(1.3,0),m.dark,0,-2.0,0).scale.set(1.25,.8,1);
  const head=new T.Group();head.position.set(0,2.65,.1);torso.add(head);
  mesh(head,new T.DodecahedronGeometry(1.42,0),m.stone,0,0,0).scale.set(1,1.05,.8);
  mesh(head,new T.BoxGeometry(1.7,.42,.38),m.dark,0,-.07,1.0);for(const side of[-1,1]){const eye=mesh(head,new T.BoxGeometry(.49,.14,.18),m.energy,side*.47,.10,1.24);eye.rotation.z=side*.2;mesh(head,new T.ConeGeometry(.43,2.2,5),m.edge,side*1.05,1.5,-.2).rotation.z=-side*.35;mesh(head,new T.BoxGeometry(.36,.65,.55),m.edge,side*.52,-.75,.8).rotation.z=side*.15;}
  mesh(head,new T.BoxGeometry(.8,.22,.35),m.dark,0,-.63,1.01);mesh(head,new T.ConeGeometry(.55,.9,5),m.edge,0,-1.18,.4).rotation.x=Math.PI;
  const arms=[];for(const side of[-1,1]){const arm=limb(torso,side*2.65,.9,0,m.stone);mesh(arm,new T.DodecahedronGeometry(1.35,0),m.edge,0,-.1,0).scale.set(1,.75,1);const forearm=limb(arm,0,-2.4,.2,m.edge);mesh(forearm,new T.DodecahedronGeometry(.97,0),m.dark,0,-2.4,.25).scale.set(1.1,.75,1);for(let j=0;j<3;j++)mesh(forearm,new T.ConeGeometry(.18,.85,5),m.edge,(j-1)*.45,-2.85,.6).rotation.x=2.1;arms.push({arm,forearm,side});const leg=limb(boss,side*1.25,3,0,m.stone);mesh(leg,new T.BoxGeometry(1.8,.8,2.5),m.edge,0,-2.55,.55);}
  // Arena-specific crown silhouettes: living roots, a wind crest, fractured crystal.
  for(const side of[-1,1])for(let i=0;i<3;i++){const x=side*(1.6+i*.35),y=.9-i*.15;const crown=mesh(torso,area===0?new T.CylinderGeometry(.08,.23,2.0,5):area===1?new T.ConeGeometry(.3,2.6,4):new T.OctahedronGeometry(.7,0),area===0?m.dark:m.edge,x,y,-.3);crown.rotation.z=side*(.8+i*.25);if(area===2)crown.scale.set(.6,2,.6);if(area===0)mesh(crown,new T.IcosahedronGeometry(.42,0),m.energy,0,1,0).scale.set(1,.4,1);}
  const core=new T.Group();core.position.set(0,-.2,1.8);torso.add(core);mesh(core,new T.OctahedronGeometry(.73,1),m.energy).scale.set(.82,1,.45);const petals=[];for(let i=0;i<6;i++){const a=i*Math.PI/3,g=new T.Group();g.rotation.z=a;core.add(g);mesh(g,new T.BoxGeometry(.7,.75,.34),m.metal,0,.48,.2);petals.push(g);}
  const seals=[];for(let i=0;i<3;i++){const g=new T.Group();g.position.set((i-1)*2.1,3.4,2.2);boss.add(g);const hoop=mesh(g,new T.TorusGeometry(.52,.08,5,12),m.energy);hoop.rotation.z=Math.PI/4;mesh(g,new T.OctahedronGeometry(.22),m.metal);seals.push(g);}
 return{boss,torso,head,arms,core,petals,seals,materials:m};
}
