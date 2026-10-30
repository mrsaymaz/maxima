import{jumpTuning}from'./jump-tuning.js';
import * as T from './vendor/three.module.min.js';
import{GuardianCombat,BOSS,ARENA,beamEnd,quakeRadius,attackDuration,guardianPhase}from'./guardian-combat.js';
import{ElementalFX}from'./elemental-fx.js';
import{surfaceMaterial}from'./surface-materials.js';
const palettes=[{stone:'#56675a',edge:'#a3ae88',dark:'#273d36',energy:'#bde37d',ground:'#888a6d'},{stone:'#637d89',edge:'#c2cfca',dark:'#273e51',energy:'#a8e5ed',ground:'#9aaba9'},{stone:'#5c5679',edge:'#a49db8',dark:'#302c49',energy:'#debbef',ground:'#77748a'}];
const smooth=t=>t*t*(3-2*t),clamp=(t,a=0,b=1)=>Math.max(a,Math.min(b,t));
function mesh(parent,g,m,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function limb(parent,x,y,z,mat){const g=new T.Group();g.position.set(x,y,z);parent.add(g);mesh(g,new T.DodecahedronGeometry(1,0),mat,0,-1.1,0).scale.set(.78,1.5,.9);return g;}
function bandGeometry(){const g=new T.BufferGeometry(),pos=new Float32Array(65*2*3),indices=[];for(let i=0;i<64;i++){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}g.setAttribute('position',new T.BufferAttribute(pos,3));g.setIndex(indices);return g;}
function band(g,r,width=.5){const pos=g.attributes.position;for(let i=0;i<=64;i++){const a=i/64*Math.PI*2;for(let k=0;k<2;k++){const rr=Math.max(0,r+(k?width:-width));pos.setXYZ(i*2+k,Math.cos(a)*rr,0,Math.sin(a)*rr);}}pos.needsUpdate=true;g.computeBoundingSphere();}

// Fit boss + complete partner bounds above the controls, even at the arena rim.
export function guardianCameraPose(state,{aspect=1,height=2.18,bodyBounds={halfWidth:1.5,halfDepth:1.5}}={}){
 const p=state.player,target={x:p.x*.4,y:4.9,z:(p.z+BOSS.z)*.5},sin=.3387194683,cos=.9408874119,tan=Math.tan(26*Math.PI/180),r=Math.max(.6,bodyBounds.halfWidth||0,bodyBounds.halfDepth||0),boxes=[[-4.2,4.2,0,12.1,-7.3,-2.4],[p.x-r,p.x+r,p.y,p.y+height,p.z-r,p.z+r]];let distance=20;
 for(const box of boxes)for(const x of[box[0],box[1]])for(const y of[box[2],box[3]])for(const z of[box[4],box[5]]){const dx=x-target.x,dy=y-target.y,dz=z-target.z,back=dy*sin+dz*cos,up=dy*cos-dz*sin;distance=Math.max(distance,back+Math.abs(dx)/(tan*Math.max(.25,aspect)*.84),back+Math.abs(up)/(tan*(up>0?.65:.62)));}
 return{target,position:{x:target.x,y:target.y+sin*distance,z:target.z+cos*distance},distance};
}

// Dedicated, enclosed clearing. Path coordinates and its checkpoint are never moved.
export class GuardianStage{
 constructor(world,state,{mode='relaxed',partner='hufflepuff',event=()=>{},resume=false}={}){
  this.world=world;this.state=state;this.active=true;this.time=0;this.hitAge=9;this.sealAge=9;this.resetCamera=true;this.reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  this.hidden=new Map();for(const o of world.scene.children)if(!o.isLight&&o!==world.creature&&o!==world.sky){this.hidden.set(o,o.visible);o.visible=false;}
  this.root=new T.Group();this.root.name='guardian-colossus-arena';world.scene.add(this.root);this.area=world.area||0;this.palette=palettes[this.area];this.build();this.fx=new ElementalFX(this.root);
  this.combat=new GuardianCombat(state,{bodyProfile:world.nav.bodyProfile||world.bodyProfile,mode,partner,event:(kind,data)=>{if(kind==='boss-hit'||kind==='seal')this.hitAge=0;if(kind==='seal')this.sealAge=0;if(kind==='hurt'){world.locomotion?.hit();world.combatExpression?.cue('hurt');}if(kind==='boss-hit')world.combatExpression?.cue('success');if(kind==='blocked')world.combatExpression?.cue('blocked');if(kind==='impact')this.fx.impact({...data,y:Math.max(1.4,data.y)},data.hit?'rival':'solid');event(kind,data);}});if(resume)this.combat.resume();this.partner=partner;
  world.rival.visible=false;world.creature.visible=true;world.creature.scale.setScalar(1);world.camera.clearViewOffset();world.viewShift=0;
 }
 build(){const p=this.palette,m={stone:surfaceMaterial('stone',p.stone,{roughness:.85}),edge:surfaceMaterial('stone',p.edge,{roughness:.75}),dark:surfaceMaterial('stone',p.dark,{roughness:.9}),ground:surfaceMaterial('stone',p.ground,{roughness:1}),metal:surfaceMaterial('metal','#bcaa78',{roughness:.55}),energy:new T.MeshStandardMaterial({color:p.energy,emissive:p.energy,emissiveIntensity:.7,roughness:.3}),warning:new T.MeshBasicMaterial({color:'#ffc36e',transparent:true,opacity:.5,depthWrite:false,side:T.DoubleSide}),danger:new T.MeshBasicMaterial({color:'#fc684e',transparent:true,opacity:.7,depthWrite:false,side:T.DoubleSide})};this.materials=m;
  const floor=mesh(this.root,new T.CylinderGeometry(ARENA.radius,12.2,1,64),m.ground,0,-.52,3);floor.name='guardian-safe-floor';
  const rim=mesh(this.root,new T.TorusGeometry(10.75,.18,5,64),m.edge,0,-.05,3);rim.rotation.x=Math.PI/2;
  for(let i=0;i<12;i++){const a=i*Math.PI/6;const tile=mesh(this.root,new T.BoxGeometry(.10,.025,9),m.dark,Math.sin(a)*5.4,-.008,3+Math.cos(a)*5.4);tile.rotation.y=a;const post=mesh(this.root,new T.CylinderGeometry(.40,.57,1.3,6),m.stone,Math.sin(a)*11.15,.25,3+Math.cos(a)*11.15);post.rotation.y=a;mesh(post,new T.OctahedronGeometry(.22),m.energy,0,.9,0);}
  // Broken aqueduct / ridge / crystal cathedral silhouettes frame the arena.
  for(let i=0;i<13;i++){const a=Math.PI*.58+i/12*Math.PI*.84,x=Math.sin(a)*19,z=3+Math.cos(a)*19,h=7+(i%4)*2;const cliff=mesh(this.root,new T.DodecahedronGeometry(3,0),i%3?m.stone:m.dark,x,h*.34-1,z);cliff.scale.set(1,h/4,1);cliff.rotation.y=i*.7;}
  for(const side of[-1,1])for(let i=0;i<3;i++){const column=mesh(this.root,new T.CylinderGeometry(.6,.85,5+i,7),m.edge,side*(12+i*1.3),1.8,-3-i*4);column.rotation.z=side*(i===1?.22:.03);mesh(column,new T.BoxGeometry(2,.45,1.7),m.stone,0,(5+i)/2,0);}
  this.boss=new T.Group();this.boss.name='colossal-guardian';this.boss.position.set(BOSS.x,0,BOSS.z);this.root.add(this.boss);this.torso=new T.Group();this.torso.position.y=5.8;this.boss.add(this.torso);
  mesh(this.torso,new T.DodecahedronGeometry(2.2,0),m.stone,0,0,0).scale.set(1.25,1.12,.75);
  mesh(this.torso,new T.DodecahedronGeometry(1.3,0),m.dark,0,-2.0,0).scale.set(1.25,.8,1);
  this.head=new T.Group();this.head.position.set(0,2.65,.1);this.torso.add(this.head);
  mesh(this.head,new T.DodecahedronGeometry(1.42,0),m.stone,0,0,0).scale.set(1,1.05,.8);
  mesh(this.head,new T.BoxGeometry(1.7,.42,.38),m.dark,0,-.07,1.0);for(const side of[-1,1]){const eye=mesh(this.head,new T.BoxGeometry(.49,.14,.18),m.energy,side*.47,.10,1.24);eye.rotation.z=side*.2;mesh(this.head,new T.ConeGeometry(.43,2.2,5),m.edge,side*1.05,1.5,-.2).rotation.z=-side*.35;mesh(this.head,new T.BoxGeometry(.36,.65,.55),m.edge,side*.52,-.75,.8).rotation.z=side*.15;}
  mesh(this.head,new T.BoxGeometry(.8,.22,.35),m.dark,0,-.63,1.01);mesh(this.head,new T.ConeGeometry(.55,.9,5),m.edge,0,-1.18,.4).rotation.x=Math.PI;
  this.arms=[];for(const side of[-1,1]){const arm=limb(this.torso,side*2.65,.9,0,m.stone);mesh(arm,new T.DodecahedronGeometry(1.35,0),m.edge,0,-.1,0).scale.set(1,.75,1);const forearm=limb(arm,0,-2.4,.2,m.edge);mesh(forearm,new T.DodecahedronGeometry(.97,0),m.dark,0,-2.4,.25).scale.set(1.1,.75,1);for(let j=0;j<3;j++)mesh(forearm,new T.ConeGeometry(.18,.85,5),m.edge,(j-1)*.45,-2.85,.6).rotation.x=2.1;this.arms.push({arm,forearm,side});const leg=limb(this.boss,side*1.25,3,0,m.stone);mesh(leg,new T.BoxGeometry(1.8,.8,2.5),m.edge,0,-2.55,.55);}
  // Arena-specific crown silhouettes: living roots, a wind crest, fractured crystal.
  for(const side of[-1,1])for(let i=0;i<3;i++){const x=side*(1.6+i*.35),y=.9-i*.15;const crown=mesh(this.torso,this.area===0?new T.CylinderGeometry(.08,.23,2.0,5):this.area===1?new T.ConeGeometry(.3,2.6,4):new T.OctahedronGeometry(.7,0),this.area===0?m.dark:m.edge,x,y,-.3);crown.rotation.z=side*(.8+i*.25);if(this.area===2)crown.scale.set(.6,2,.6);if(this.area===0)mesh(crown,new T.IcosahedronGeometry(.42,0),m.energy,0,1,0).scale.set(1,.4,1);}
  this.core=new T.Group();this.core.position.set(0,-.2,1.8);this.torso.add(this.core);mesh(this.core,new T.OctahedronGeometry(.73,1),m.energy).scale.set(.82,1,.45);this.petals=[];for(let i=0;i<6;i++){const a=i*Math.PI/3,g=new T.Group();g.rotation.z=a;this.core.add(g);mesh(g,new T.BoxGeometry(.7,.75,.34),m.metal,0,.48,.2);this.petals.push(g);}
  this.seals=[];for(let i=0;i<3;i++){const g=new T.Group();g.position.set((i-1)*2.1,3.4,2.2);this.boss.add(g);const hoop=mesh(g,new T.TorusGeometry(.52,.08,5,12),m.energy);hoop.rotation.z=Math.PI/4;mesh(g,new T.OctahedronGeometry(.22),m.metal);this.seals.push(g);}
  // Warning footprints use the same centres, widths and radii as combat collisions.
  this.wave=mesh(this.root,bandGeometry(),m.warning,0,.04,BOSS.z);this.wave.castShadow=false;
  this.beam=mesh(this.root,new T.PlaneGeometry(1.7,1),m.warning);this.beam.rotation.x=-Math.PI/2;this.beam.castShadow=false;
  this.beamHead=mesh(this.root,new T.CylinderGeometry(.85,.85,.025,24),m.warning);this.beamHead.castShadow=false;
  this.fallMarks=[];this.stones=[];for(let i=0;i<3;i++){const mark=mesh(this.root,new T.CylinderGeometry(1.45,1.45,.025,32),m.warning,0,.035,0);mark.castShadow=false;const edge=mesh(mark,new T.TorusGeometry(1.45,.05,4,32),m.edge);edge.rotation.x=Math.PI/2;const stone=mesh(this.root,new T.IcosahedronGeometry(1.1,0),m.stone);stone.scale.set(.9,1.3,.9);this.fallMarks.push(mark);this.stones.push(stone);}
  this.shadow=mesh(this.root,new T.CircleGeometry(.45,20),new T.MeshBasicMaterial({color:'#162d31',transparent:true,opacity:.35,depthWrite:false}));this.shadow.rotation.x=-Math.PI/2;this.shadow.castShadow=false;
 }
 update(dt){if(!this.active)return;const w=this.world,b=this.state,paused=w.paused||typeof document!=='undefined'&&document.hidden;const realDt=paused?0:dt;this.combat.active=!paused;this.combat.step(realDt,this.input());const slow=b.phase==='finisher'&&!this.reduced?.18:1,animDt=realDt*slow;this.time+=animDt;this.hitAge+=realDt;this.sealAge+=realDt;
  w.quietMoments?.reset();w.combatExpression?.reset();const p=b.player,creature=w.creature;creature.position.set(p.x,p.y,p.z);creature.visible=true;creature.scale.setScalar(1);const attack=this.combat.cast,jump=p.y>0?clamp((jumpTuning(w.level||0).guardianVelocity-p.vy)/(2*jumpTuning(w.level||0).guardianVelocity)):null;
  w.locomotion?.update(animDt,{x:p.x,z:p.z},true,jump,{attack});w.proceduralMotion?.update(animDt,{moving:Math.hypot(this.input().x,this.input().z)>.1,speed:4.9,stage:p.y>0?'air':'ground',attack});
  const face=Math.atan2(BOSS.x-p.x,BOSS.z-p.z)-(w.locomotion?.forwardYaw||0),d=Math.atan2(Math.sin(face-creature.rotation.y),Math.cos(face-creature.rotation.y));creature.rotation.y+=d*(1-Math.exp(-realDt*14));if(w.model){w.model.rotation.z=0;w.model.rotation.x=0;}
  w.combatExpression?.update(realDt,{enabled:!paused,attack:!!attack,airborne:p.y>0,reduced:this.reduced});this.shadow.position.set(p.x,.018,p.z);this.shadow.scale.setScalar(1/(1+p.y*.3));this.shadow.material.opacity=b.invulnerable>0?.2:.35;
  const wind=b.phase==='windup',strike=b.phase==='strike',recovery=b.phase==='recovery',finish=b.phase==='finisher',victory=b.phase==='victory',duration=attackDuration(b,this.combat.mode),charge=wind?smooth(clamp(b.timer/duration)):0;
  const impact=strike?Math.exp(-b.timer*7):0,breathe=Math.sin(this.time*1.4)*.06,recoil=this.hitAge<.32?Math.sin(this.hitAge/.32*Math.PI)**2:0;const poseBlend=1-Math.exp(-animDt*20),torsoY=5.8+breathe-recoil*.18-(b.kind==='quake'?(wind?charge*.9:strike?impact*1.6:0):0)-(recovery?.4:0)-(victory?Math.min(3.4,b.timer*1.2):0);this.torso.position.y+=(torsoY-this.torso.position.y)*poseBlend;
  const torsoX=b.kind==='quake'?(wind?-charge*.13:strike?impact*.32:0):recovery?.12:0;this.torso.rotation.x+=(torsoX-this.torso.rotation.x)*poseBlend;this.boss.rotation.z=this.hitAge<.2?Math.sin(this.hitAge*35)*.018:0;
  const headX=(wind?-.08*charge:recovery?.15:Math.sin(this.time*.8)*.025)+recoil*.095;this.head.rotation.x+=(headX-this.head.rotation.x)*poseBlend;
  for(const {arm,forearm,side}of this.arms){const armZ=side*(.16+(recovery?.18:wind?.1*charge:0)),armX=b.kind==='quake'?(wind?-charge*2.0:strike?-2*(1-smooth(clamp(b.timer/.18))):0):b.kind==='falls'?(wind?-charge*2.5:strike?-2.5*(1-b.timer/.85):0):b.kind==='beam'&&side===-1?(wind?-charge*1.55:strike?-1.55:0):Math.sin(this.time+side)*.04;arm.rotation.z+=(armZ-arm.rotation.z)*poseBlend;arm.rotation.x+=(armX-arm.rotation.x)*poseBlend;forearm.rotation.x+=(-.22-(wind?.3*charge:0)-forearm.rotation.x)*poseBlend;}
  const open=recovery||finish||victory?1:0;for(let i=0;i<6;i++){const petal=this.petals[i];petal.children[0].position.y+=(.48+open*.52-petal.children[0].position.y)*poseBlend;petal.rotation.x+=(open*.65-petal.rotation.x)*poseBlend;}this.core.rotation.z+=animDt*(open?.65:.15);this.materials.energy.emissiveIntensity=finish?1.1:recovery?.95:.38;
  this.seals.forEach((g,i)=>{g.visible=!victory&&i>=b.finishStep;g.rotation.y=Math.sin(this.time+i)*.12;g.scale.setScalar(finish?1.12:1);});
  this.wave.visible=(wind||strike)&&b.kind==='quake';if(this.wave.visible){this.wave.material=strike?this.materials.danger:this.materials.warning;band(this.wave.geometry,strike?quakeRadius(b):2.9,.5);}
  this.beam.visible=this.beamHead.visible=(wind||strike)&&b.kind==='beam';if(this.beam.visible){const end=beamEnd(b),dx=end.x-BOSS.x,dz=end.z-BOSS.z,len=Math.hypot(dx,dz);this.beam.position.set((end.x+BOSS.x)/2,.04,(end.z+BOSS.z)/2);this.beam.rotation.z=Math.atan2(dx,dz);this.beam.scale.set(1,len,1);this.beam.material=strike?this.materials.danger:this.materials.warning;this.beamHead.position.set(end.x,.04,end.z);this.beamHead.material=this.beam.material;}
  this.fallMarks.forEach((mark,i)=>{const show=(wind||strike)&&b.kind==='falls',t=b.targets[i];mark.visible=this.stones[i].visible=!!(show&&t);if(t){mark.position.set(t.x,.035,t.z);mark.material=strike?this.materials.danger:this.materials.warning;const rock=this.stones[i];rock.position.set(t.x,strike?Math.max(.8,12-b.timer*30):12,t.z);rock.rotation.set(this.time*.4,i,this.time*.2);}});
  this.fx.update(animDt,this.combat.shots,attack,{x:p.x,y:p.y+Math.min(.9,(w.nav.height||1)*.55),z:p.z},true,w.graphics?.effects||'medium');
  this.frameCamera(realDt,finish,victory);w.sun.position.set(p.x-12,25,p.z+13);w.sun.target.position.set(0,3,-3);if(w.sky)w.sky.position.copy(w.camera.position);
 }
 input(){const w=this.world;return{x:(w.input?.x||0)+(w.keys?.has('d')||w.keys?.has('ArrowRight')?1:0)-(w.keys?.has('a')||w.keys?.has('ArrowLeft')?1:0),z:(w.input?.z||0)+(w.keys?.has('s')||w.keys?.has('ArrowDown')?1:0)-(w.keys?.has('w')||w.keys?.has('ArrowUp')?1:0)};}
 frameCamera(dt,finish,victory){const w=this.world,b=this.state,p=b.player,portrait=w.camera.aspect<1,wide=portrait?1.25:1,intro=b.phase==='intro'?1-smooth(clamp(b.timer/2.3)):0;
  const pose=guardianCameraPose(b,{aspect:w.camera.aspect,height:w.nav.height,bodyBounds:w.bodyBounds}),target=new T.Vector3(pose.target.x,pose.target.y,pose.target.z),position=new T.Vector3(pose.position.x,pose.position.y,pose.position.z);if(intro>0){position.lerp(new T.Vector3(3,11.5,12),intro);target.lerp(new T.Vector3(0,6,-5),intro);}
  // Full boss silhouette plus a view of the next warning footprint, including Form 10.
  if(finish){position.set(3.8,8.8,20*wide);target.set(0,5.0,-4);}if(victory)position.y=9.4;
  const blend=this.resetCamera?1:1-Math.exp(-dt*5);w.camera.position.lerp(position,blend);w.target.lerp(target,blend);w.camera.fov=52;w.camera.lookAt(w.target);w.camera.updateProjectionMatrix();w.camera.updateMatrixWorld();this.resetCamera=false;
 }
 dispose(){if(!this.active)return;this.active=false;this.combat.active=false;this.fx.dispose();this.world.combatExpression?.reset();this.world.scene.remove(this.root);const geometries=new Set(),materials=new Set();this.root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of o.material?Array.isArray(o.material)?o.material:[o.material]:[])materials.add(m);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());for(const[o,visible]of this.hidden)o.visible=visible;this.world.creature.scale.setScalar(1);this.world.locomotion&&(this.world.locomotion.last=null);this.world.frameFocus=true;}
}
