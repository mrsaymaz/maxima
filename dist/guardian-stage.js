import{jumpTuning}from'./jump-tuning.js';
import * as T from './vendor/three.module.min.js';
import{GuardianCombat,BOSS,ARENA,attackDuration,guardianPhase}from'./guardian-combat.js';
import{attackShapes,galeAngle,galeDirection,chainFrame,VOLLEY,CAGE}from'./guardian-attacks.js';
import{ElementalFX}from'./elemental-fx.js';
import{surfaceMaterial}from'./surface-materials.js';import{buildGuardianFigure,GUARDIAN_PALETTES,mergeStatic}from'./guardian-figure.js';
const smooth=t=>t*t*(3-2*t),clamp=(t,a=0,b=1)=>Math.max(a,Math.min(b,t));
function mesh(parent,g,m,x=0,y=0,z=0,shadow=true){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=shadow;o.receiveShadow=true;parent.add(o);return o;}
function bandGeometry(){const g=new T.BufferGeometry(),pos=new Float32Array(65*2*3),indices=[];for(let i=0;i<64;i++){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}g.setAttribute('position',new T.BufferAttribute(pos,3));g.setIndex(indices);return g;}
function band(g,r,width=.5){const pos=g.attributes.position;for(let i=0;i<=64;i++){const a=i/64*Math.PI*2;for(let k=0;k<2;k++){const rr=Math.max(0,r+(k?width:-width));pos.setXYZ(i*2+k,Math.cos(a)*rr,0,Math.sin(a)*rr);}}pos.needsUpdate=true;g.computeBoundingSphere();}
const overlay=(color,opacity)=>new T.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,side:T.DoubleSide});
const glowMaterial=(color,opacity=.6)=>{const g=new T.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,toneMapped:false});g.userData.surface='effect';return g;};
// Which body pose the guardian uses to wind up each attack.
const POSE={quake:'slam',slam:'slam',dive:'slam',overgrowth:'slam',chain:'slam',falls:'raise',seeds:'raise',shards:'raise',volley:'raise',cage:'raise',twisters:'raise',beam:'aim',roots:'aim',prism:'aim',gale:'aim'};
const SPIKES=96,UP=new T.Vector3(0,1,0);

// Fit boss + complete partner bounds above the controls, even at the arena rim.
export function guardianCameraPose(state,{aspect=1,height=2.18,bodyBounds={halfWidth:1.5,halfDepth:1.5}}={}){
 const p=state.player,target={x:p.x*.4,y:4.9,z:(p.z+BOSS.z)*.5},sin=.3387194683,cos=.9408874119,tan=Math.tan(26*Math.PI/180),r=Math.max(.6,bodyBounds.halfWidth||0,bodyBounds.halfDepth||0),boxes=[[-4.2,4.2,0,12.1,-7.3,-2.4],[p.x-r,p.x+r,p.y,p.y+height,p.z-r,p.z+r]];let distance=20;
 for(const box of boxes)for(const x of[box[0],box[1]])for(const y of[box[2],box[3]])for(const z of[box[4],box[5]]){const dx=x-target.x,dy=y-target.y,dz=z-target.z,back=dy*sin+dz*cos,up=dy*cos-dz*sin;distance=Math.max(distance,back+Math.abs(dx)/(tan*Math.max(.25,aspect)*.84),back+Math.abs(up)/(tan*(up>0?.65:.62)));}
 return{target,position:{x:target.x,y:target.y+sin*distance,z:target.z+cos*distance},distance};
}

// Dedicated, enclosed clearing. Path coordinates and its checkpoint are never moved.
export class GuardianStage{
 constructor(world,state,{mode='relaxed',partner='hufflepuff',event=()=>{},resume=false}={}){
  this.world=world;this.state=state;this.active=true;this.time=0;this.hitAge=9;this.critAge=9;this.sealAge=9;this.wardAge=9;this.resetCamera=true;this.reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  this.hidden=new Map();for(const o of world.scene.children)if(!o.isLight&&o!==world.creature&&o!==world.sky){this.hidden.set(o,o.visible);o.visible=false;}
  this.root=new T.Group();this.root.name='guardian-colossus-arena';world.scene.add(this.root);this.area=world.area||0;this.palette=GUARDIAN_PALETTES[this.area];this.build();this.fx=new ElementalFX(this.root);
  this.combat=new GuardianCombat(state,{area:this.area,bodyProfile:world.nav.bodyProfile||world.bodyProfile,mode,partner,event:(kind,data)=>{if(kind==='boss-hit'||kind==='seal')this.hitAge=0;if(kind==='boss-hit'&&data?.critical)this.critAge=0;if(kind==='seal')this.sealAge=0;if(kind==='ward-broken')this.wardAge=0;if(kind==='hurt'){world.locomotion?.hit();world.combatExpression?.cue('hurt');}if(kind==='boss-hit')world.combatExpression?.cue('success');if(kind==='blocked')world.combatExpression?.cue('blocked');if(kind==='impact')this.fx.impact({...data,y:Math.max(1.4,data.y)},data.hit?'rival':'solid');if(kind==='clear')this.fx.impact({...data,y:.8},'solid');event(kind,data);}});if(resume)this.combat.resume();this.partner=partner;
  world.rival.visible=false;world.creature.visible=true;world.creature.scale.setScalar(1);world.camera.clearViewOffset();world.viewShift=0;
 }
 build(){const p=this.palette,area=this.area,m={stone:surfaceMaterial('stone',p.stone,{roughness:.85}),edge:surfaceMaterial('stone',p.edge,{roughness:.75}),dark:surfaceMaterial('stone',p.dark,{roughness:.9}),ground:surfaceMaterial('stone',p.ground,{roughness:1}),metal:surfaceMaterial('metal','#bcaa78',{roughness:.55}),energy:new T.MeshStandardMaterial({color:p.energy,emissive:p.energy,emissiveIntensity:.7,roughness:.3}),
   // One colour code for every guardian: amber = coming, red = hurts now, blue = safe.
   warning:overlay('#ffc36e',.5),danger:overlay('#fc684e',.7),safe:overlay('#7fe9ff',.8),cover:overlay('#ffb057',.3),coverHit:overlay('#e0503c',.55)};this.materials=m;
  const decor=new T.Group();this.root.add(decor);
  const floor=mesh(this.root,new T.CylinderGeometry(ARENA.radius,12.2,1,64),m.ground,0,-.52,3);floor.name='guardian-safe-floor';
  const rim=mesh(decor,new T.TorusGeometry(10.75,.18,5,64),m.edge,0,-.05,3);rim.rotation.x=Math.PI/2;
  for(let i=0;i<12;i++){const a=i*Math.PI/6;const tile=mesh(decor,new T.BoxGeometry(.10,.025,9),m.dark,Math.sin(a)*5.4,-.008,3+Math.cos(a)*5.4);tile.rotation.y=a;const post=mesh(decor,new T.CylinderGeometry(.40,.57,1.3,6),m.stone,Math.sin(a)*11.15,.25,3+Math.cos(a)*11.15);post.rotation.y=a;mesh(decor,new T.OctahedronGeometry(.22),m.energy,Math.sin(a)*11.15,1.15,3+Math.cos(a)*11.15);}
  // Broken aqueduct / ridge / crystal cathedral silhouettes frame the arena.
  for(let i=0;i<13;i++){const a=Math.PI*.58+i/12*Math.PI*.84,x=Math.sin(a)*19,z=3+Math.cos(a)*19,h=7+(i%4)*2;const cliff=mesh(decor,new T.DodecahedronGeometry(3,0),i%3?m.stone:m.dark,x,h*.34-1,z);cliff.scale.set(1,h/4,1);cliff.rotation.y=i*.7;}
  for(const side of[-1,1])for(let i=0;i<3;i++){const x=side*(12+i*1.3),z=-3-i*4,rz=side*(i===1?.22:.03);const column=mesh(decor,new T.CylinderGeometry(.6,.85,5+i,7),m.edge,x,1.8,z);column.rotation.z=rz;const cap=mesh(decor,new T.BoxGeometry(2,.45,1.7),m.stone,x-Math.sin(rz)*(5+i)/2,1.8+Math.cos(rz)*(5+i)/2,z);cap.rotation.z=rz;}
  mergeStatic(decor,new Set());
  Object.assign(this,buildGuardianFigure(area,m));this.boss.position.set(BOSS.x,0,BOSS.z);this.root.add(this.boss);this.materials=m;
  // Ward: a shimmering shell the guardian raises at 70% and 40%; an English answer breaks it.
  this.ward=mesh(this.boss,new T.IcosahedronGeometry(5.4,2),glowMaterial(p.energy,.22),0,6.2,0,false);this.ward.scale.set(1,1.25,.85);this.ward.visible=false;
  // Footprint pools. Every ground shape from guardian-attacks.js is drawn by one of these.
  const flat=(g,mat)=>{const o=mesh(this.root,g,mat,0,.04,0,false);o.rotation.x=-Math.PI/2;o.visible=false;o.renderOrder=2;return o;};
  this.strips=Array.from({length:7},()=>flat(new T.PlaneGeometry(1,1),m.warning));this.beam=this.strips[0];
  this.rings=Array.from({length:6},()=>{const o=mesh(this.root,bandGeometry(),m.warning,0,.05,0,false);o.visible=false;o.renderOrder=2;return o;});
  this.discs=Array.from({length:8},()=>{const o=flat(new T.CircleGeometry(1,40),m.warning);const edge=mesh(o,new T.RingGeometry(.93,1,40),m.edge,0,0,.01,false);edge.renderOrder=3;return o;});
  this.cover=flat(new T.CircleGeometry(ARENA.radius-.3,64),m.cover);this.cover.position.set(ARENA.x,.03,ARENA.z);this.cover.renderOrder=1;
  // Roots, thorn bushes and vines (Whisperwood) or crystals (Stormglass) spring from the ground as instances.
  const spikeGeometry=area===2?new T.OctahedronGeometry(.42,0).scale(1,2.6,1).translate(0,.9,0):new T.ConeGeometry(.3,1.7,5).translate(0,.85,0);
  const spikeMaterial=area===2?Object.assign(new T.MeshStandardMaterial({color:'#b68cff',emissive:'#7a3dff',emissiveIntensity:.7,roughness:.15,flatShading:true}),{}):surfaceMaterial('stone',area===0?'#5a4a2c':'#8a7a5c',{roughness:.9,flatShading:true});
  this.spikes=new T.InstancedMesh(spikeGeometry,spikeMaterial,SPIKES);this.spikes.castShadow=true;this.spikes.frustumCulled=false;this.spikes.count=0;this.root.add(this.spikes);this.dummy=new T.Object3D();
  // Projectiles: seed pods, orbit stones or falling crystals.
  const rockGeometry=area===0?new T.IcosahedronGeometry(.8,1).scale(1,1.25,1):area===2?new T.OctahedronGeometry(.75,0).scale(1,2.2,1):new T.DodecahedronGeometry(.75,0);
  const rockMaterial=area===0?surfaceMaterial('stone','#6f9a3a',{roughness:.7,flatShading:true}):area===2?spikeMaterial:m.stone;
  this.rocks=Array.from({length:6},()=>{const o=mesh(this.root,rockGeometry,rockMaterial);o.visible=false;return o;});
  // Galecrest: a low wall of wind, its turning arrow and the twisters.
  const windTexture=(()=>{if(typeof document==='undefined')return null;const c=document.createElement('canvas');c.width=128;c.height=32;const g=c.getContext('2d');const grad=g.createLinearGradient(0,0,0,32);grad.addColorStop(0,'rgba(255,255,255,0)');grad.addColorStop(.6,'rgba(220,250,255,.9)');grad.addColorStop(1,'rgba(255,255,255,.3)');g.fillStyle=grad;g.fillRect(0,0,128,32);g.strokeStyle='rgba(255,255,255,.9)';g.lineWidth=2;for(let i=0;i<9;i++){g.beginPath();g.moveTo(i*15,24-i%3*6);g.lineTo(i*15+11,22-i%3*6);g.stroke();}const t=new T.CanvasTexture(c);t.wrapS=T.RepeatWrapping;t.repeat.set(4,1);return t;})();
  const windMaterial=glowMaterial('#d8f8ff',.75);if(windTexture)windMaterial.map=windTexture;this.windTexture=windTexture;
  this.wall=mesh(this.root,new T.PlaneGeometry(1,1),windMaterial,0,.5,0,false);this.wall.visible=false;
  this.arrow=mesh(this.root,new T.ConeGeometry(.6,1.5,3),m.warning,0,.3,0,false);this.arrow.visible=false;
  this.twisters=Array.from({length:3},()=>{const g=new T.Group();this.root.add(g);g.visible=false;for(let i=0;i<3;i++){const swirl=glowMaterial(i?'#bfefff':'#ffffff',.5-i*.12);if(windTexture)swirl.map=windTexture;const funnel=mesh(g,new T.CylinderGeometry(1.25-i*.25,.18+i*.1,4.2-i*.6,16,1,true),swirl,0,2.1+i*.2,0,false);funnel.rotation.z=(i-1)*.08;funnel.userData.spin=(i%2?-1:1)*(2+i);}mesh(g,new T.TorusGeometry(.95,.12,5,20),glowMaterial('#e8fbff',.45),0,.15,0,false).rotation.x=Math.PI/2;return g;});
  // Stormglass: the prism beam's glowing cores and the storm chain.
  this.beamCores=Array.from({length:3},()=>{const o=mesh(this.root,new T.BoxGeometry(.28,.28,1),glowMaterial(p.energy,.85),0,.9,0,false);o.visible=false;return o;});
  this.chain=mesh(this.root,new T.CylinderGeometry(.12,.12,1,6),glowMaterial('#f6d4ff',.95),0,.45,0,false);this.chain.visible=false;
  this.shadow=mesh(this.root,new T.CircleGeometry(.45,20),new T.MeshBasicMaterial({color:'#162d31',transparent:true,opacity:.35,depthWrite:false}));this.shadow.rotation.x=-Math.PI/2;this.shadow.castShadow=false;
 }
 // Lays a flat plane from a to b with the given half-width.
 setStrip(o,s,y=.04){const dx=s.b.x-s.a.x,dz=s.b.z-s.a.z,len=Math.hypot(dx,dz)||.01;o.position.set((s.a.x+s.b.x)/2,y,(s.a.z+s.b.z)/2);o.rotation.set(-Math.PI/2,0,Math.atan2(dx,dz));o.scale.set(s.w*2,len,1);}
 spike(x,z,h,yaw=0,tilt=0,s=1){if(this.spikes.count>=SPIKES||h<=.02)return;const d=this.dummy;d.position.set(x,0,z);d.rotation.set(tilt,yaw,0,'YXZ');d.scale.set(s,h,s);d.updateMatrix();this.spikes.setMatrixAt(this.spikes.count++,d.matrix);}
 drawAttack(b,mode){
  const m=this.materials,shapes=attackShapes(b,mode),pulse=.5+.5*Math.sin(this.time*12);let strip=0,ring=0,disc=0;
  m.warning.opacity=.38+.18*pulse;m.danger.opacity=.62+.15*pulse;m.safe.opacity=.7+.2*Math.sin(this.time*5);
  const material=s=>s.safe?m.safe:s.hit?m.danger:m.warning;this.cover.visible=false;
  for(const s of shapes){
   if(s.type==='strip'&&strip<this.strips.length){const o=this.strips[strip++];o.visible=true;o.material=material(s);this.setStrip(o,s,s.safe?.035:.045);}
   else if(s.type==='ring'&&ring<this.rings.length){const o=this.rings[ring++];o.visible=true;o.material=material(s);o.position.set(s.x,.05,s.z);band(o.geometry,s.r,s.w);}
   else if(s.type==='circle'&&!s.twister&&disc<this.discs.length){const o=this.discs[disc++];o.visible=true;o.material=s.bush?m.danger:material(s);o.position.set(s.x,s.safe?.06:.04,s.z);o.scale.setScalar(s.r);}
   else if(s.type==='cover'){this.cover.visible=true;this.cover.material=s.hit?m.coverHit:m.cover;}}
  this.strips.slice(strip).forEach(o=>o.visible=false);this.rings.slice(ring).forEach(o=>o.visible=false);this.discs.slice(disc).forEach(o=>o.visible=false);
  // Props that bring each attack to life.
  this.spikes.count=0;this.rocks.forEach(o=>o.visible=false);this.twisters.forEach(o=>o.visible=false);this.beamCores.forEach(o=>o.visible=false);this.wall.visible=this.arrow.visible=this.chain.visible=false;
  const wind=b.phase==='windup',strike=b.phase==='strike',t=b.timer,live=wind||strike;
  for(const h of b.hazards||[]){const grow=clamp(h.ttl*1.5);for(let i=0;i<6;i++){const a=i*Math.PI/3+h.x;this.spike(h.x+Math.sin(a)*.35,h.z+Math.cos(a)*.35,.7*grow,a,.55,.75);}this.spike(h.x,h.z,1.1*grow,0,0,.9);}
  if(!live)return;
  if(b.kind==='roots')for(const s of shapes.filter(s=>s.roots)){const dx=s.b.x-s.a.x,dz=s.b.z-s.a.z,len=Math.hypot(dx,dz);for(let d=0;d<len;d+=.7){const k=d/len,wob=Math.sin(d*3.1)*.35;this.spike(s.a.x+dx*k+dz/len*wob,s.a.z+dz*k-dx/len*wob,1.3+Math.sin(d*5)*.4,d,Math.sin(d*7)*.3);}}
  if(b.kind==='overgrowth'&&strike){const rise=smooth(clamp((t-.2)/.3))*(1-smooth(clamp((t-1.3)/.3)));for(let i=0;i<70;i++){const a=i*2.399,r=Math.sqrt((i+.5)/70)*(ARENA.radius-.8),x=ARENA.x+Math.sin(a)*r,z=ARENA.z+Math.cos(a)*r;if(Math.hypot(x-BOSS.x,z-BOSS.z)<BOSS.radius+.4||b.targets.some(c=>Math.hypot(x-c.x,z-c.z)<1.9))continue;this.spike(x,z,rise*(1.2+(i%3)*.3),a,(i%5-2)*.12);}}
  if(b.kind==='seeds'||b.kind==='shards'){const land=b.kind==='seeds'?.5:.45;b.targets.forEach((c,i)=>{const o=this.rocks[i];if(!o)return;if(wind||t<land){o.visible=true;const k=wind?0:t/land;o.position.set(c.x,Math.max(.8,13-k*k*12.2),c.z);o.rotation.set(this.time*2,i,this.time);}else if(b.kind==='shards'&&t<2.1){o.visible=true;const shake=t>1.5?Math.sin(this.time*60)*.08:0;o.position.set(c.x+shake,1.3,c.z);o.rotation.set(0,i,0);}});}
  if(b.kind==='volley'){const n=b.targets.length;for(let i=0;i<n&&i<this.rocks.length;i++){const c=b.targets[i],from=i*VOLLEY.interval(mode),k=strike?(t-from)/VOLLEY.travel:-1;if(k<0||k>1)continue;const o=this.rocks[i],a=i*1.7,sx=BOSS.x+Math.cos(a)*4.6,sz=BOSS.z+Math.sin(a)*4.6;o.visible=true;o.position.set(sx+(c.x-sx)*k,6.2+(0-6.2)*k+Math.sin(k*Math.PI)*3,sz+(c.z-sz)*k);o.rotation.set(this.time*5,i,0);}}
  if(b.kind==='gale'){const a=galeAngle(b,mode),d={x:Math.sin(a),z:Math.cos(a)};if(strike){this.wall.visible=true;this.wall.position.set(BOSS.x+d.x*9.7,.55,BOSS.z+d.z*9.7);this.wall.rotation.set(0,a-Math.PI/2,0);this.wall.scale.set(14.6,1.1,1);if(this.windTexture)this.windTexture.offset.x=-this.time*2*galeDirection(b);}else{const side=galeDirection(b),n={x:d.z*side,z:-d.x*side};this.arrow.visible=true;this.arrow.material=m.warning;this.arrow.position.set(BOSS.x+d.x*8-n.x*1.4,.35,BOSS.z+d.z*8-n.z*1.4);this.arrow.quaternion.setFromUnitVectors(UP,new T.Vector3(-n.x,0,-n.z));}}
  if(b.kind==='twisters')b.targets.forEach((c,i)=>{const g=this.twisters[i];if(!g)return;g.visible=true;g.position.set(c.x,0,c.z);const grow=wind?smooth(clamp(t/1.2)):1;g.scale.set(grow,grow,grow);g.children.forEach(f=>{f.rotation.y=this.time*f.userData.spin*3;});});
  if(b.kind==='prism'){b.targets.forEach((c,i)=>{const o=this.rocks[i];if(o){o.visible=true;o.position.set(c.x,1.4+Math.sin(this.time*3+i)*.2,c.z);o.rotation.y=this.time;}});if(strike)b.targets.forEach((c,i)=>{const start=.1+.3*i;if(t<start||t>start+.5)return;const from=i?b.targets[i-1]:BOSS,o=this.beamCores[i],dx=c.x-from.x,dz=c.z-from.z;o.visible=true;o.position.set((c.x+from.x)/2,.9,(c.z+from.z)/2);o.rotation.set(0,Math.atan2(dx,dz),0);o.scale.set(1+pulse*.6,1+pulse*.6,Math.hypot(dx,dz));});}
  if(b.kind==='cage'&&b.targets.length>1){const[c,g]=b.targets,gap=Math.atan2(g.x-c.x,g.z-c.z),rise=wind?smooth(clamp(t/.5)):1-smooth(clamp((t-.55)/.2));for(let i=0;i<24;i++){const a=i/24*Math.PI*2,off=Math.abs(Math.atan2(Math.sin(a-gap),Math.cos(a-gap)));if(off<CAGE.gap)continue;this.spike(c.x+Math.sin(a)*CAGE.radius,c.z+Math.cos(a)*CAGE.radius,rise*(1+(i%3)*.25),a,(i%2?.15:-.1));}}
  if(b.kind==='chain'){const{d,n,front}=chainFrame(b,mode),c={x:BOSS.x+d.x*front,z:BOSS.z+d.z*front};this.chain.visible=strike;if(strike){this.chain.position.set(c.x,.45,c.z);this.chain.quaternion.setFromUnitVectors(UP,new T.Vector3(n.x,0,n.z));this.chain.scale.set(1+pulse*.8,32,1+pulse*.8);}}
  this.spikes.instanceMatrix.needsUpdate=true;
 }
 update(dt){if(!this.active)return;this.animate?.(this.time);const w=this.world,b=this.state,paused=w.paused||typeof document!=='undefined'&&document.hidden;const realDt=paused?0:dt;this.combat.active=!paused;this.combat.step(realDt,this.input());const quiet=b.phase==='finisher'||b.phase==='ward',slow=quiet&&!this.reduced?.18:1,animDt=realDt*slow;this.time+=animDt;this.hitAge+=realDt;this.critAge+=realDt;this.sealAge+=realDt;this.wardAge+=realDt;
  w.quietMoments?.reset();w.combatExpression?.reset();const p=b.player,creature=w.creature;creature.position.set(p.x,p.y,p.z);creature.visible=true;creature.scale.setScalar(1);const attack=this.combat.cast,jump=p.y>0?clamp((jumpTuning(w.level||0).guardianVelocity-p.vy)/(2*jumpTuning(w.level||0).guardianVelocity)):null;
  w.locomotion?.update(animDt,{x:p.x,z:p.z},true,jump,{attack});w.proceduralMotion?.update(animDt,{moving:Math.hypot(this.input().x,this.input().z)>.1,speed:4.9,stage:p.y>0?'air':'ground',attack});
  const face=Math.atan2(BOSS.x-p.x,BOSS.z-p.z)-(w.locomotion?.forwardYaw||0),d=Math.atan2(Math.sin(face-creature.rotation.y),Math.cos(face-creature.rotation.y));creature.rotation.y+=d*(1-Math.exp(-realDt*14));if(w.model){w.model.rotation.z=0;w.model.rotation.x=0;}
  w.combatExpression?.update(realDt,{enabled:!paused,attack:!!attack,airborne:p.y>0,reduced:this.reduced});this.shadow.position.set(p.x,.018,p.z);this.shadow.scale.setScalar(1/(1+p.y*.3));this.shadow.material.opacity=b.invulnerable>0?.2:.35;
  const wind=b.phase==='windup',strike=b.phase==='strike',recovery=b.phase==='recovery',stagger=recovery&&b.stagger,ward=b.phase==='ward',finish=b.phase==='finisher',victory=b.phase==='victory',duration=attackDuration(b,this.combat.mode),charge=wind?smooth(clamp(b.timer/duration)):0,pose=POSE[b.kind]||'aim';
  const impact=strike?Math.exp(-b.timer*7):0,breathe=Math.sin(this.time*1.4)*.06,recoil=this.hitAge<.32?Math.sin(this.hitAge/.32*Math.PI)**2*(this.critAge<.32?1.8:1):0;const poseBlend=1-Math.exp(-animDt*20);
  // Sky Dive: the guardian crouches, leaps out of view and crashes back onto its spot.
  const leap=b.kind==='dive'&&strike&&b.timer<.6?Math.sin(b.timer/.6*Math.PI)*9:0;this.boss.position.y=b.kind==='dive'&&wind?-charge*.5:leap;
  const torsoY=5.8+breathe-recoil*.18-(pose==='slam'?(wind?charge*.9:strike?impact*1.6:0):0)-(recovery?(stagger?1.3:.4):0)-(victory?Math.min(3.4,b.timer*1.2):0);this.torso.position.y+=(torsoY-this.torso.position.y)*poseBlend;
  const torsoX=pose==='slam'?(wind?-charge*.13:strike?impact*.32:0):recovery?(stagger?.32:.12):0;this.torso.rotation.x+=(torsoX-this.torso.rotation.x)*poseBlend;this.boss.rotation.z=this.hitAge<.2?Math.sin(this.hitAge*35)*(this.critAge<.2?.035:.018):0;
  const headX=(wind?-.08*charge:recovery?(stagger?.35:.15):Math.sin(this.time*.8)*.025)+recoil*.095;this.head.rotation.x+=(headX-this.head.rotation.x)*poseBlend;
  for(const {arm,forearm,side}of this.arms){const armZ=side*(.16+(recovery?(stagger?.4:.18):wind?.1*charge:0)),armX=pose==='slam'?(wind?-charge*2.0:strike?-2*(1-smooth(clamp(b.timer/.18))):0):pose==='raise'?(wind?-charge*2.5:strike?-2.5*(1-clamp(b.timer/.85)):0):pose==='aim'&&side===-1?(wind?-charge*1.55:strike?-1.55:0):Math.sin(this.time+side)*.04;arm.rotation.z+=(armZ-arm.rotation.z)*poseBlend;arm.rotation.x+=(armX-arm.rotation.x)*poseBlend;forearm.rotation.x+=(-.22-(wind?.3*charge:0)-forearm.rotation.x)*poseBlend;}
  const open=recovery||finish||victory?1:0;for(let i=0;i<6;i++){const petal=this.petals[i];petal.children[0].position.y+=(.48+open*(stagger?.85:.52)-petal.children[0].position.y)*poseBlend;petal.rotation.x+=(open*.65-petal.rotation.x)*poseBlend;}this.core.rotation.z+=animDt*(open?.65:.15);this.core.scale.setScalar(stagger?1.25+.1*Math.sin(this.time*10):1);this.materials.energy.emissiveIntensity=stagger?2.2:finish?1.1:recovery?1.4:this.materials.energy.emissiveIntensity;
  this.seals.forEach((g,i)=>{g.visible=!victory&&i>=b.finishStep;g.rotation.y=Math.sin(this.time+i)*.12;g.scale.setScalar(finish?1.12:1);});
  const shatter=this.wardAge<.5?this.wardAge/.5:1;this.ward.visible=ward||shatter<1;if(this.ward.visible){this.ward.material.opacity=ward?.18+.08*Math.sin(this.time*20):.3*(1-shatter);this.ward.scale.set(1+shatter*.5*(ward?0:1),1.25+(ward?0:shatter*.6),.85+(ward?0:shatter*.4));this.ward.rotation.y=this.time*.8;}
  this.drawAttack(b,this.combat.mode);
  this.fx.update(animDt,this.combat.shots,attack,{x:p.x,y:p.y+Math.min(.9,(w.nav.height||1)*.55),z:p.z},true,w.graphics?.effects||'medium');
  this.frameCamera(realDt,finish||ward,victory);w.sun.position.set(p.x-12,25,p.z+13);w.sun.target.position.set(0,3,-3);if(w.sky)w.sky.position.copy(w.camera.position);
 }
 input(){const w=this.world;return{x:(w.input?.x||0)+(w.keys?.has('d')||w.keys?.has('ArrowRight')?1:0)-(w.keys?.has('a')||w.keys?.has('ArrowLeft')?1:0),z:(w.input?.z||0)+(w.keys?.has('s')||w.keys?.has('ArrowDown')?1:0)-(w.keys?.has('w')||w.keys?.has('ArrowUp')?1:0)};}
 frameCamera(dt,finish,victory){const w=this.world,b=this.state,p=b.player,portrait=w.camera.aspect<1,wide=portrait?1.25:1,intro=b.phase==='intro'?1-smooth(clamp(b.timer/2.3)):0;
  const pose=guardianCameraPose(b,{aspect:w.camera.aspect,height:w.nav.height,bodyBounds:w.bodyBounds}),target=new T.Vector3(pose.target.x,pose.target.y,pose.target.z),position=new T.Vector3(pose.position.x,pose.position.y,pose.position.z);if(intro>0){position.lerp(new T.Vector3(3,11.5,12),intro);target.lerp(new T.Vector3(0,6,-5),intro);}
  // Full boss silhouette plus a view of the next warning footprint, including Form 10.
  if(finish){position.set(3.8,8.8,20*wide);target.set(0,5.0,-4);}if(victory)position.y=9.4;
  const blend=this.resetCamera?1:1-Math.exp(-dt*5);w.camera.position.lerp(position,blend);w.target.lerp(target,blend);w.camera.fov=52;w.camera.lookAt(w.target);w.camera.updateProjectionMatrix();w.camera.updateMatrixWorld();this.resetCamera=false;
 }
 dispose(){if(!this.active)return;this.active=false;this.combat.active=false;this.fx.dispose();this.world.combatExpression?.reset();this.world.scene.remove(this.root);const geometries=new Set(),materials=new Set();this.root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of o.material?Array.isArray(o.material)?o.material:[o.material]:[])materials.add(m);});Object.values(this.materials).forEach(m=>m?.isMaterial&&materials.add(m));geometries.forEach(g=>g.dispose());materials.forEach(m=>{m.map?.dispose();m.dispose();});for(const[o,visible]of this.hidden)o.visible=visible;this.world.creature.scale.setScalar(1);this.world.locomotion&&(this.world.locomotion.last=null);this.world.frameFocus=true;}
}
