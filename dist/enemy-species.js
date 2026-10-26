import * as T from './vendor/three.module.min.js';

const STATES=new WeakMap(),TAU=Math.PI*2;
const finite=(n,f=0)=>Number.isFinite(n)?n:f;
const clamp=n=>Math.max(0,Math.min(1,finite(n)));
const PALETTES=[['#876c4e','#62814e','#9ab678'],['#7b7560','#668d79','#b0c5a0'],['#787080','#6f7e85','#b4b8bd']];
function merge(root){root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),batches=new Map();root.traverse(o=>{if(!o.isMesh)return;const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(inverse.clone().multiply(o.matrixWorld));if(!batches.has(o.material))batches.set(o.material,{p:[],n:[]});const a=batches.get(o.material);for(const v of geo.attributes.position.array)a.p.push(v);for(const v of geo.attributes.normal.array)a.n.push(v);geo.dispose();});root.clear();for(const[material,data]of batches){const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(data.p,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(data.n,3));const mesh=new T.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);}}
function leafGeometry(){const vertices=[[0,0,0],[-.14,.19,0],[0,.43,0],[.14,.19,0],[0,.20,.075],[0,.20,-.035]],faces=[[0,1,4],[1,2,4],[2,3,4],[3,0,4],[1,0,5],[2,1,5],[3,2,5],[0,3,5]],p=[];for(const face of faces)for(const i of face)p.push(...vertices[i]);const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.computeVertexNormals();return geo;}
function sectorGeometry(angle,outline=false){const p=[],n=40;const tri=(a,b,c)=>p.push(...a,...b,...c),at=(r,a)=>[Math.sin(a)*r,0,Math.cos(a)*r];for(let i=0;i<n;i++){const a=-angle+2*angle*i/n,b=-angle+2*angle*(i+1)/n;if(outline){tri(at(.981,a),at(1,a),at(1,b));tri(at(.981,a),at(1,b),at(.981,b));}else tri([0,0,0],at(1,a),at(1,b));}if(outline)for(const a of[-angle,angle]){const normal=[Math.cos(a)*.009,0,-Math.sin(a)*.009],v=at(.99,a),q=normal.map(x=>-x),r=v.map((x,i)=>x+normal[i]),s=v.map((x,i)=>x-normal[i]);tri(normal,r,s);tri(normal,s,q);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.computeVertexNormals();return geo;}

export function makeEnemySpecies(section){
 const enemy=section?.enemy;if(!enemy||!['seed','spore'].includes(enemy.kind))throw new Error('Unknown path enemy species');
 const group=new T.Group();group.name='enemy-species-'+enemy.kind;const palette=PALETTES[section.area]||PALETTES[0],cache=new Map();
 const mat=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.85,...extra});
 const m={bark:mat(palette[0]),leaf:mat(palette[1]),leafLight:mat(palette[2]),dark:mat('#304c43'),amber:mat('#ecc267',{emissive:'#bc823b',emissiveIntensity:.6,roughness:.42}),cream:mat('#f1e7bb'),teal:mat('#9bc7b7'),violet:mat('#8e72b0'),rim:mat('#b8a2cd'),gills:mat('#b2e5d9',{emissive:'#77cbb8',emissiveIntensity:.8}),warning:mat('#f5b94e',{transparent:true,opacity:.20,depthWrite:false,emissive:'#ec9a36',emissiveIntensity:.6,side:T.DoubleSide}),outline:mat('#ffdc7b',{transparent:true,opacity:.95,depthWrite:false,emissive:'#f7b849',emissiveIntensity:.8,side:T.DoubleSide}),spores:mat('#f1c76b',{transparent:true,opacity:.9,emissive:'#c18d40',emissiveIntensity:.6})};
 const geo=(key,fn)=>{if(!cache.has(key))cache.set(key,fn());return cache.get(key);};
 const box=(x,y,z)=>geo(`b${x},${y},${z}`,()=>new T.BoxGeometry(x,y,z));
 const ball=r=>geo('s'+r,()=>new T.SphereGeometry(r,10,6));
 const pebble=r=>geo('p'+r,()=>new T.DodecahedronGeometry(r,0));
 const cyl=(a,b,h)=>geo(`c${a},${b},${h}`,()=>new T.CylinderGeometry(a,b,h,8));
 const mesh=(geometry,material,x=0,y=0,z=0,parent=group)=>{const o=new T.Mesh(geometry,material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 const actor=new T.Group();actor.name='species-actor';group.add(actor);const body=new T.Group();body.name='species-body';actor.add(body);const fixed=new T.Group();fixed.name='fixed-creature';body.add(fixed);
 const state={section,enemy,actor,body,m,object:new T.Object3D(),kind:enemy.kind};
 const eyes=(y,z,spacing=.12)=>{for(const side of[-1,1]){mesh(ball(.073),m.dark,side*spacing,y,z,fixed).scale.set(1,.88,.32);mesh(ball(.053),enemy.kind==='seed'?m.amber:m.gills,side*spacing,y,z+.018,fixed).scale.set(.83,1,.26);mesh(ball(.021),m.dark,side*spacing,y+.001,z+.033,fixed).scale.set(.65,1.1,.3);mesh(ball(.010),m.cream,side*spacing-.014,y+.022,z+.039,fixed);}};
 const legs=new T.InstancedMesh(pebble(.085),enemy.kind==='seed'?m.bark:m.teal,4);legs.name='little-root-feet';actor.add(legs);legs.castShadow=true;state.legs=legs;
 if(enemy.kind==='seed'){
  const seed=mesh(pebble(.34),m.bark,0,.46,-.015,fixed);seed.scale.set(.95,1.32,.91);
  for(let row=0;row<3;row++)for(let i=0;i<6;i++){const a=i*TAU/6+row*.43,r=.265-.018*row,scale=mesh(pebble(.13),i%2?m.bark:m.leaf,Math.sin(a)*r,.30+row*.18,Math.cos(a)*r,fixed);scale.scale.set(.78,.73,.60);scale.rotation.y=a;}
  const face=mesh(pebble(.20),m.leafLight,0,.73,.175,fixed);face.scale.set(1.06,.70,.74);eyes(.756,.321,.10);
  for(const side of[-1,1]){const smile=mesh(box(.057,.014,.015),m.dark,side*.026,.667,.307,fixed);smile.rotation.z=side*.25;}
  mesh(new T.ConeGeometry(.072,.17,5),m.leaf,0,.935,-.01,fixed);
  for(const z of[-.285,.285]){const core=mesh(ball(.165),m.amber,0,.46,z,fixed);core.scale.set(.85,1.16,.43);}
  merge(fixed);
  const armour=new T.InstancedMesh(leafGeometry(),m.leaf,6);armour.name='shield-leaf-petals';body.add(armour);armour.castShadow=true;
  const veins=new T.InstancedMesh(box(.026,.23,.018),m.leafLight,6);veins.name='shield-leaf-veins';body.add(veins);state.armour=armour;state.veins=veins;
  const warning=new T.Group();warning.name='forward-slam-sector';group.add(warning);const fill=mesh(sectorGeometry(.78),m.warning,0,0,0,warning),outline=mesh(sectorGeometry(.78,true),m.outline,0,.006,0,warning);fill.castShadow=false;outline.castShadow=false;state.sector={group:warning,fill,outline,angle:.78};
 }else{
  const stem=mesh(cyl(.14,.19,.52),m.teal,0,.36,0,fixed);stem.scale.z=.84;
  const face=mesh(ball(.18),m.teal,0,.48,.07,fixed);face.scale.set(1,.91,.80);eyes(.49,.213,.080);
  for(const side of[-1,1]){const mouth=mesh(box(.044,.014,.014),m.dark,side*.019,.397,.205,fixed);mouth.rotation.z=-side*.17;}
  merge(fixed);
  const cap=new T.Group();cap.name='mistcap-bell';cap.position.y=.70;body.add(cap);
  const profile=[[0,.265],[.13,.24],[.29,.16],[.43,.045],[.485,-.005],[.45,-.055],[.30,-.047],[.10,-.035]].map(([x,y])=>new T.Vector2(x,y));
  mesh(new T.LatheGeometry(profile,20),m.violet,0,0,0,cap);
  const rim=mesh(new T.TorusGeometry(.481,.018,4,32),m.rim,0,-.010,0,cap);rim.rotation.x=Math.PI/2;
  for(let i=0;i<12;i++){const a=i*TAU/12,gill=mesh(box(.028,.015,.30),m.gills,Math.sin(a)*.285,-.059,Math.cos(a)*.285,cap);gill.rotation.y=a;}
  for(let i=0;i<5;i++){const a=i*2.4,r=.14+(i%2)*.13,spot=mesh(ball(.049),m.rim,Math.sin(a)*r,.31-r*.50,Math.cos(a)*r,cap);spot.scale.set(1,.15,.8);}
  merge(cap);state.cap=cap;
  const warning=mesh(new T.TorusGeometry(.75,.035,5,48),m.outline);warning.name='initial-pulse-annulus';warning.rotation.x=Math.PI/2;warning.castShadow=false;state.annulus=warning;
  state.rings=[];for(let i=0;i<2;i++){const material=mat('#ba8ddd',{emissive:'#9965bf',emissiveIntensity:.8,transparent:true,opacity:.88,roughness:.6}),geometry=new T.TorusGeometry(1,.075,6,64);geometry.rotateX(Math.PI/2);const ring=mesh(geometry,material);ring.name='expanding-spore-ring-'+i;ring.castShadow=false;ring.frustumCulled=false;state.rings.push(ring);}
 }
 const spores=new T.InstancedMesh(new T.OctahedronGeometry(.027,0),m.spores,8);spores.name='gathering-and-dispersing-spores';spores.frustumCulled=false;group.add(spores);state.spores=spores;
 state.flashMaterials=[m.bark,m.leaf,m.leafLight,m.dark,m.teal,m.violet,m.rim];state.baseColors=state.flashMaterials.map(material=>material.color.clone());state.flashColor=new T.Color('#fff4d4');
 group.userData={id:enemy.id,kind:enemy.kind,name:enemy.name||(enemy.kind==='seed'?'Brambleguard':'Mistcap'),radius:.62,height:1.08,worldCoordinates:true,drawMeshes:0,triangles:0,warningRadius:enemy.kind==='spore'?.75:null};STATES.set(group,state);
 updateEnemySpecies(group,{...enemy,heading:Math.atan2(-section.forward.x,-section.forward.z),phase:'watch',timer:0,duration:1,hp:enemy.maxHp,maxHp:enemy.maxHp,flash:0,active:false,rings:[]},{time:0});
 group.traverse(o=>{if(o.isMesh){group.userData.drawMeshes++;group.userData.triangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);}});return group;
}

export function updateEnemySpecies(group,runtime,{time=0,playerRadius=0}={}){
 const state=STATES.get(group);if(!state||!runtime)return group;time=finite(time);const{enemy,section,kind,actor,body,legs,m,object,spores}=state;
 const phase=runtime.phase||'watch',timer=Math.max(0,finite(runtime.timer)),progress=clamp(timer/Math.max(.001,finite(runtime.duration,1))),defeat=phase==='defeated'?clamp(timer/1.1):0,heading=finite(runtime.heading),x=finite(runtime.x,enemy.x),z=finite(runtime.z,enemy.z),recover=phase==='recover',wind=phase===(kind==='seed'?'seedwindup':'sporewindup'),strike=phase==='seedstrike',pulse=phase==='pulse',hurt=phase==='hurt';
 const bounce=Math.sin(time*2.7)*.004,lunge=strike?Math.sin(progress*Math.PI)*.045:0;
 actor.position.set(x+Math.sin(heading)*lunge+(section.right.x*.43-section.forward.x*.10)*defeat,.028+bounce,z+Math.cos(heading)*lunge+(section.right.z*.43-section.forward.z*.10)*defeat);actor.rotation.set(0,heading+defeat*.6,0);actor.scale.setScalar(phase==='defeated'?Math.max(.001,1-defeat):1);actor.visible=phase!=='defeated'||defeat<1;
 body.rotation.set(defeat?defeat*.4:strike?.10*Math.sin(progress*Math.PI):hurt?.025*Math.sin(timer*42):wind?-.045*progress:recover?.025*Math.sin(progress*Math.PI):0,0,hurt?Math.sin(timer*38)*.035:0);body.position.y=wind?-.018*Math.sin(progress*Math.PI/2):0;
 for(let i=0;i<4;i++){const side=i%2?1:-1,front=i<2?1:-1;object.position.set(side*(kind==='seed'?.20:.14),.086,front*(kind==='seed'?.18:.12));object.rotation.set(runtime.returning?Math.sin(time*11+(i%2===Math.floor(i/2)?0:Math.PI))*.18:0,side*.25,side*.10);object.scale.set(1,.84,1.18);object.updateMatrix();legs.setMatrixAt(i,object.matrix);}legs.instanceMatrix.needsUpdate=true;
 const flash=clamp(runtime.flash);state.flashMaterials.forEach((material,i)=>material.color.copy(state.baseColors[i]).lerp(state.flashColor,flash*.8));
 if(kind==='seed'){
  const opening=defeat?1-defeat:hurt?.92:recover?.14+.78*Math.min(1,timer/.22):wind?.03:.14;
  for(let i=0;i<6;i++){
   const rear=i===5,side=i===2?0:(i<2?-1:1),row=i%2;
   if(rear){object.position.set(.22*opening,.255+opening*.17,-.285);object.rotation.set(-.12,0,-opening*.6);object.scale.set(1.20,1.20,.95);}
   else{object.position.set(i===2?0:side*(.155+opening*.15)+side*.035*row,.24+row*.13,(i===2?.35:.285)+(strike?.018*Math.sin(progress*Math.PI):0));object.rotation.set(-.15+opening*.15,i===2?0:side*opening*.7,i===2?0:side*(.10+opening*.30));object.scale.set(i===2?1.1:1,1.05,1);}
   object.updateMatrix();state.armour.setMatrixAt(i,object.matrix);const matrix=object.matrix.clone().multiply(new T.Matrix4().makeTranslation(0,.22,.081));state.veins.setMatrixAt(i,matrix);
  }state.armour.instanceMatrix.needsUpdate=true;state.veins.instanceMatrix.needsUpdate=true;m.amber.emissiveIntensity=(recover||hurt)?1.35:wind?.85+progress*.4:.60;
  const sector=state.sector,angle=Math.max(.05,Math.min(Math.PI*.8,finite(runtime.slamHalfAngle,.78))),range=Math.max(.1,finite(runtime.slamRange,2.9));
  if(Math.abs(angle-sector.angle)>1e-6){sector.fill.geometry.dispose();sector.outline.geometry.dispose();sector.fill.geometry=sectorGeometry(angle);sector.outline.geometry=sectorGeometry(angle,true);sector.angle=angle;}
  sector.group.position.set(x,.065,z);sector.group.rotation.y=heading;sector.group.scale.set(range+playerRadius*.30,1,range+playerRadius*.30);sector.group.visible=runtime.active!==false&&(wind||strike);m.warning.opacity=strike?.28*(1-progress):.14+.16*progress;m.outline.opacity=strike?1-progress*.65:.65+.30*progress;group.userData.slamRange=range;group.userData.slamHalfAngle=angle;
 }else{
  const cap=state.cap;cap.position.y=.70-(recover?.035:0);cap.rotation.set(defeat?defeat*.8:recover?-.16:pulse?.035*Math.sin(progress*Math.PI):0,0,hurt?.035*Math.sin(timer*30):0);cap.scale.set(wind?1+.10*progress:pulse?1.08:1,wind?1-.06*progress:pulse?.94:1,wind?1+.10*progress:pulse?1.08:1);
  state.annulus.position.set(x,.074,z);state.annulus.visible=runtime.active!==false&&wind;m.outline.opacity=.55+.4*Math.sin(time*7)**2;
  const visibleRings=[];for(let i=0;i<2;i++){const ring=state.rings[i],data=runtime.rings?.[i],r=Math.max(0,finite(data?.radius)),width=Math.max(.01,finite(data?.width,.15)),maxRadius=Math.max(.1,finite(data?.maxRadius,9));ring.visible=!!data&&r>0&&r<=maxRadius+width;
   if(!ring.visible)continue;ring.position.set(x,.11,z);const a=ring.geometry.attributes.position,tube=width/2+playerRadius*.30;for(let j=0;j<=6;j++)for(let k=0;k<=64;k++){const u=k*TAU/64,v=j*TAU/6,d=r+Math.cos(v)*tube;a.setXYZ(j*65+k,Math.cos(u)*d,-Math.sin(v)*tube,Math.sin(u)*d);}a.needsUpdate=true;ring.geometry.boundingSphere=new T.Sphere(new T.Vector3(),r+tube);ring.geometry.boundingBox=new T.Box3(new T.Vector3(-r-tube,-tube,-r-tube),new T.Vector3(r+tube,tube,r+tube));ring.material.opacity=.88*(1-.65*clamp((r/maxRadius-.85)/.15));visibleRings.push({radius:r,width,y:.11});
  }group.userData.rings=visibleRings;m.gills.emissiveIntensity=recover?1.3:wind?1+progress:.8;
 }
 spores.visible=(kind==='spore'&&wind)||phase==='defeated';m.spores.opacity=phase==='defeated'?1-defeat:.65+.30*progress;m.spores.color.set(phase==='defeated'?'#c6badb':'#f1c76b');for(let i=0;i<8;i++){const a=i*TAU/8+time*.8,r=phase==='defeated'?.35+defeat*.48:.50-.15*progress;object.position.set(x+Math.sin(a)*r,.65+Math.sin(a*2)*.12+(phase==='defeated'?defeat*.4:progress*.12),z+Math.cos(a)*r);object.rotation.set(time+i,.3*i,time*.5);object.scale.setScalar(phase==='defeated'?Math.max(.01,1-defeat):1);object.updateMatrix();spores.setMatrixAt(i,object.matrix);}spores.instanceMatrix.needsUpdate=true;
 group.userData.phase=phase;group.userData.bodyVisible=actor.visible;group.userData.warningVisible=kind==='seed'?state.sector.group.visible:state.annulus.visible;group.userData.returning=!!runtime.returning;return group;
}
