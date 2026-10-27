import * as T from './vendor/three.module.min.js';
import{bevelBox,carvedCylinder,rockLump,liquidMaterial}from'./prop-art.js';
// Themed task gates. Each English task type gets its own obstacle on the trail and its own dressing on the task
// stage, and the obstacle opens in visible steps: runes light and a drawbridge drops, stepping stones rise, brambles
// wither, bell flowers swing aside, a balance lifts its arm. Everything is visual; the expedition decides passage.
// When open, nothing remains over the 5 m walkway (|x| < 2.5) higher than the ground.

export const THEMED_GATES=['translation','sentence','intruder','listen-word','numbers'];
const PALETTES=[
 {stone:'#a39c88',dark:'#5f5b4e',moss:'#5f8452',wood:'#8b6b4a',metal:'#c8a25a',glow:'#8ff0cf',bramble:'#5a4334',thorn:'#8f7562',leaf:'#4f7a45',petal:'#f6efff',bell:'#c7a2e6',water:'#5cabae',ink:'#2f3b33'},
 {stone:'#c9bfa2',dark:'#7a705c',moss:'#7f9a6c',wood:'#9a7a55',metal:'#d8b56a',glow:'#9fe3f2',bramble:'#6b5544',thorn:'#a08a74',leaf:'#6f9a64',petal:'#fff8e8',bell:'#9cc7ef',water:'#48a7c4',ink:'#4a4435'},
 {stone:'#8f91a8',dark:'#4b4d62',moss:'#6f8199',wood:'#6e5a52',metal:'#c7a76a',glow:'#c9b6ff',bramble:'#4a3a4a',thorn:'#7d6a7e',leaf:'#5c7486',petal:'#f1e9ff',bell:'#b29ae8',water:'#5f7fb0',ink:'#2c2d3c'}];
const clamp=n=>Math.max(0,Math.min(1,Number.isFinite(n)?n:0));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
const span=(f,a,b)=>clamp((f-a)/(b-a));
const UP=new T.Vector3(0,1,0);

export function gateKit(area=0){
 const p=PALETTES[area]||PALETTES[0],materials=[],cache=new Map();
 const mat=(color,extra={})=>{const m=new T.MeshStandardMaterial({color,roughness:.86,...extra});materials.push(m);return m;};
 const m={stone:mat(p.stone),dark:mat(p.dark),moss:mat(p.moss),wood:mat(p.wood),metal:mat(p.metal,{metalness:.4,roughness:.42}),glow:mat(p.glow,{emissive:p.glow,emissiveIntensity:.9,roughness:.35}),bramble:mat(p.bramble,{roughness:.95}),thorn:mat(p.thorn),leaf:mat(p.leaf,{side:T.DoubleSide}),petal:mat(p.petal,{side:T.DoubleSide,emissive:p.bell,emissiveIntensity:.08}),bell:mat(p.bell,{side:T.DoubleSide,emissive:p.bell,emissiveIntensity:.12}),ink:mat(p.ink),chasm:mat('#141a17',{roughness:1})};
 const geo=(key,make)=>{if(!cache.has(key))cache.set(key,make());return cache.get(key);};
 const mesh=(geometry,material,x=0,y=0,z=0,parent)=>{const o=new T.Mesh(geometry,material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent?.add(o);return o;};
 const box=(w,h,d,bevel)=>geo(`b${w},${h},${d},${bevel}`,()=>bevelBox(w,h,d,bevel));
 const cyl=(a,b,h,n=8)=>geo(`c${a},${b},${h},${n}`,()=>carvedCylinder(a,b,h,n));
 // A unit cylinder stretched between two points each frame (chains, beams, ropes).
 const unitRod=geo('rod',()=>new T.CylinderGeometry(1,1,1,6));
 const rod=(material,r,parent)=>{const o=mesh(unitRod,material,0,0,0,parent);o.userData.r=r;return o;};
 const stretch=(o,a,b)=>{const d=new T.Vector3().subVectors(b,a),len=d.length()||1e-4;o.position.copy(a).addScaledVector(d,.5);o.quaternion.setFromUnitVectors(UP,d.divideScalar(len));o.scale.set(o.userData.r,len,o.userData.r);};
 const tube=(points,r,material,parent,segments=24)=>mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(q=>new T.Vector3(...q))),segments,r,6,false),material,0,0,0,parent);
 return{p,m,mat,materials,geo,mesh,box,cyl,rod,stretch,tube};
}

// Rune bridge: rune stones on two monoliths light up in pairs, beams cross the chasm, then the drawbridge drops.
function runeBridge(k,g){
 const{m,mesh,box,cyl,rod,stretch,mat}=k;
 mesh(box(4.9,.012,2.2,.004),m.chasm,0,.006,-.15,g).name='chasm';
 for(const z of[-1.25,.95]){const lip=mesh(box(4.9,.03,.08,.01),m.glow,0,.015,z,g);lip.castShadow=false;}
 const runes=[];
 for(const s of[-1,1]){
  const pillar=mesh(cyl(.42,.56,3.3,6),m.stone,s*3.2,1.65,-.15,g);pillar.rotation.y=.3;
  mesh(box(1.05,.3,1.05,.06),m.dark,s*3.2,3.42,-.15,g);mesh(cyl(.6,.64,.22,6),m.dark,s*3.2,.11,-.15,g);
  for(let i=0;i<3;i++){const glyph=mat(k.p.dark,{emissive:k.p.glow,emissiveIntensity:0});const rune=mesh(box(.2,.42,.08,.02),glyph,s*2.78,1.25+i*.62,.12,g);rune.rotation.z=s*.22*(i%2?1:-1);runes.push({glyph,index:i});}
 }
 const beams=[0,1,2].map(i=>{const beam=rod(m.glow,.045,g);stretch(beam,new T.Vector3(-2.75,1.25+i*.62,.12),new T.Vector3(2.75,1.25+i*.62,.12));beam.castShadow=false;return beam;});
 // The deck is hinged at the far edge of the chasm and stands upright until it drops toward the traveller.
 const hinge=new T.Group();hinge.position.set(0,.03,-1.2);g.add(hinge);
 for(let i=0;i<7;i++){const plank=mesh(box(.62,2.25,.05,.012),i%2?m.wood:k.mat(k.p.wood,{color:new T.Color(k.p.wood).multiplyScalar(.86)}),(i-3)*.66,1.12,0,hinge);plank.rotation.z=(i%3-1)*.012;}
 for(const y of[.35,1.9])mesh(box(4.6,.14,.05,.02),m.dark,0,y,.04,hinge);for(const x of[-1.7,1.7])mesh(box(.12,2.1,.05,.02),m.metal,x,1.12,.045,hinge);const emblem=mesh(k.geo('emblem',()=>new T.TorusGeometry(.42,.05,6,28)),m.metal,0,1.15,.05,hinge);emblem.castShadow=false;for(const s of[-1,1]){const bar=mesh(box(.09,.55,.03,.01),m.glow,s*.11,1.15,.06,hinge);bar.rotation.z=s*.35;}
 const chains=[-1,1].map(s=>rod(m.metal,.025,g));
 return f=>{
  runes.forEach(r=>{r.glyph.emissiveIntensity=smooth(span(f,r.index*.2,r.index*.2+.18))*1.4;});
  beams.forEach((b,i)=>{const on=span(f,i*.2+.08,i*.2+.2);b.visible=on>0&&f<1;b.scale.x=b.scale.z=.045*(.3+on);});
  const drop=span(f,.62,1),bounce=drop<1?Math.sin(drop*Math.PI*2.5)*(1-drop)*.12:0;hinge.rotation.x=Math.min(Math.PI/2,(smooth(drop)+bounce)*Math.PI/2);
  const tip=new T.Vector3(0,2.25,0).applyEuler(hinge.rotation).add(hinge.position);chains.forEach((c,i)=>{const s=i?1:-1;stretch(c,new T.Vector3(s*2.9,3.3,-.15),new T.Vector3(s*2.25,tip.y,tip.z));c.visible=f<1;});
 };
}

// Stepping stones: a stream crosses the path; reeds block it until stones rise one by one.
function steppingStones(k,g){
 const{m,mesh,box,cyl,geo}=k,water=liquidMaterial(k.p.water,{local:true,halfWidth:3.3,halfLength:1.15});k.materials.push(water);
 const stream=mesh(new T.BoxGeometry(6.6,.04,2.3),water,0,.0,0,g);stream.castShadow=false;stream.name='stream';
 for(const s of[-1,1]){mesh(cyl(.32,.48,2.2,7),m.stone,s*3.2,1.1,0,g);mesh(box(.6,.42,.16,.04),m.dark,s*3.1,1.75,.5,g);for(let i=0;i<4;i++){const l=mesh(rockLump(i+1),i%2?m.moss:m.stone,s*(2.95+i%2*.3),.12,(i-1.5)*.62,g);l.scale.set(.32,.28,.3);}}
 const reeds=new T.Group();g.add(reeds);const reedGeo=geo('reed',()=>new T.ConeGeometry(.035,1,4));
 for(let i=0;i<34;i++){const x=-2.35+(i*.142)%4.7,z=-.75+((i*37)%17)/17*1.5,h=.65+((i*13)%7)/10,r=mesh(reedGeo,m.leaf,x,h/2,z,reeds);r.scale.y=h;r.rotation.z=((i*29)%11-5)*.03;if(i%4===0){mesh(cyl(.045,.045,.22,6),m.wood,x,h*.82,z,reeds);}}
 const stones=[[-.5,.85],[.55,.35],[-.45,-.15],[.5,-.62],[-.2,-1.0]].map(([x,z],i)=>{const s=mesh(geo('stone'+i,()=>{const b=bevelBox(.95,.2,.72,.08);b.translate(0,-.1,0);return b;}),i%2?m.stone:k.mat(new T.Color(k.p.stone).multiplyScalar(.9).getStyle()),x,-.3,z,g);s.rotation.y=i*.7;return s;});
 const rings=stones.map(s=>{const r=mesh(geo('ring',()=>new T.TorusGeometry(.55,.025,4,24)),m.petal,s.position.x,.03,s.position.z,g);r.rotation.x=Math.PI/2;r.castShadow=false;return r;});
 return f=>{
  stones.forEach((s,i)=>{const t=span(f,.08+i*.16,.24+i*.16);s.position.y=-.3+smooth(t)*.365;s.visible=t>0;const ring=rings[i];ring.visible=t>0&&t<1;ring.scale.setScalar(.6+t*1.4);});
  const fall=span(f,.2,.95);reeds.scale.y=Math.max(.001,1-smooth(fall));reeds.visible=fall<1;
 };
}

// Bramble wall: thorny vines weave across the path from two tangled roots and wither back to them.
function brambleWall(k,g){
 const{m,mesh,geo,tube}=k,vines=[],thornGeo=geo('thorn',()=>new T.ConeGeometry(.05,.2,4));
 for(const s of[-1,1]){for(let i=0;i<5;i++){const l=mesh(rockLump(i+2),i%2?m.bramble:m.leaf,s*(3.05+(i%3)*.2),.2+i*.12,(i-2)*.22,g);l.scale.set(.38,.5,.34);}}
 const heights=[.35,.75,1.15,1.55,1.95,.55];
 heights.forEach((h,i)=>{for(const s of[-1,1]){const anchor=new T.Group();anchor.position.set(s*3.0,0,0);g.add(anchor);const wob=(i%2?1:-1)*.25;
  // The half-vine is built in anchor space, reaching 3.1 m inward so the halves interlock in the middle.
  const pts=[[0,h*.6,0],[-s*.8,h+wob,.12],[-s*1.7,h-wob*.6,-.1],[-s*2.5,h+wob*.5,.08],[-s*3.1,h,0]];tube(pts,.075,m.bramble,anchor,20);
  for(let j=0;j<7;j++){const t=.15+j*.12,x=-s*3.1*t,y=h+Math.sin(t*9+i)*.2,th=mesh(thornGeo,m.thorn,x,y+.06,(j%2?.08:-.08),anchor);th.rotation.z=(j%2?1:-1)*.9;th.rotation.x=j%2?.5:-.5;}
  if(i%2===0){const bloom=mesh(geo('bloom',()=>new T.IcosahedronGeometry(.11,0)),m.bell,-s*(1.4+i*.2),h+.1,.12,anchor);bloom.scale.y=.7;}
  vines.push({anchor,index:i});}});
 const dry=new T.Color(k.p.thorn),live=new T.Color(k.p.bramble);
 return f=>{
  m.bramble.color.copy(live).lerp(dry,smooth(span(f,.1,.9))*.7);
  for(const v of vines){const t=smooth(span(f,v.index/heights.length*.8,v.index/heights.length*.8+.35));v.anchor.scale.set(Math.max(.03,1-t*.97),Math.max(.25,1-t*.6),1);v.anchor.rotation.z=(v.anchor.position.x<0?-1:1)*t*.12;}
 };
}

// Bell flowers: tall stems lean over the path so their bells hang across it; they ring, open and swing aside.
function bellFlowers(k,g){
 const{m,mesh,geo,tube}=k,flowers=[];
 const bellGeo=geo('bell',()=>{const pts=[];for(let i=0;i<=8;i++){const t=i/8;pts.push(new T.Vector2(.05+Math.sin(t*Math.PI*.5)*.32+t*t*.08,-t*.55));}return new T.LatheGeometry(pts,10);});
 const petalGeo=geo('petal',()=>{const s=new T.SphereGeometry(.16,8,5);s.scale(1,.35,1.6);s.translate(0,0,.22);return s;});
 [[-1,.25,1.15],[-1,-.35,1.7],[-1,.05,2.25],[1,.2,1.3],[1,-.3,1.85],[1,.1,1.0]].forEach(([s,z,h],i)=>{
  const root=new T.Group();root.position.set(s*(3.1+(i%3)*.1),0,z);g.add(root);const reach=2.6+(i%3)*.15;
  tube([[0,0,0],[-s*.25,h*.7,0],[-s*reach*.6,h+.55,0],[-s*reach,h,0]],.06,m.leaf,root,18);
  const leaf=mesh(geo('leaf',()=>{const l=new T.SphereGeometry(.3,8,4);l.scale(1,.12,.45);return l;}),m.leaf,-s*.35,.45,0,root);leaf.rotation.z=s*.6;
  const head=new T.Group();head.position.set(-s*reach,h,0);root.add(head);mesh(bellGeo,m.bell,0,0,0,head);
  const petals=[];for(let j=0;j<5;j++){const pivot=new T.Group();pivot.rotation.y=j*Math.PI*2/5;pivot.position.y=-.5;head.add(pivot);petals.push(mesh(petalGeo,m.petal,0,0,0,pivot));}
  mesh(geo('pistil',()=>new T.SphereGeometry(.07,6,4)),m.glow,0,-.48,0,head);
  flowers.push({root,head,petals,s,index:i});});
 const echo=k.mat(k.p.glow,{emissive:k.p.glow,emissiveIntensity:.9,transparent:true,depthWrite:false}),rings=[0,1].map(i=>{const r=mesh(geo('echo',()=>new T.TorusGeometry(1,.02,4,40)),i?echo.clone():echo,0,1.4,0,g);k.materials.push(r.material);r.castShadow=false;return r;});
 return(f,time=0)=>{
  for(const fl of flowers){const t=smooth(span(f,.1+fl.index*.06,.62+fl.index*.06));fl.root.rotation.z=-fl.s*t*1.45;fl.head.rotation.z=fl.s*t*1.45*.8+Math.sin(time*1.6+fl.index)*.04*(1-t);for(const p of fl.petals)p.rotation.x=-.25-t*.75;}
  rings.forEach((r,i)=>{const a=((time*.45+i*.5)%1);r.visible=f<.6;r.scale.setScalar(.6+a*2.2);r.material.opacity=1-a;});
 };
}

// Balance gate: a lever arm bars the path; number weights fill the counter-pan until the arm swings up.
function balanceGate(k,g){
 const{m,mesh,box,cyl,rod,stretch,geo}=k;
 for(const s of[-1,1]){mesh(cyl(.2,.3,2.6,8),m.stone,s*3.05,1.3,0,g);mesh(cyl(.34,.34,.12,8),m.metal,s*3.05,2.66,0,g);mesh(cyl(.42,.5,.2,8),m.dark,s*3.05,.1,0,g);}
 const hook=mesh(box(.28,.12,.3,.03),m.metal,2.86,1.02,0,g);hook.name='rest-hook';
 const pivot=new T.Group();pivot.position.set(-3.05,1.6,.32);g.add(pivot);mesh(cyl(.12,.12,.3,10),m.metal,0,0,-.05,pivot).rotation.x=Math.PI/2;
 const arm=mesh(box(6.1,.2,.2,.04),m.wood,2.95,0,0,pivot);mesh(box(1.25,.16,.16,.03),m.wood,-.62,0,0,pivot);
 for(let i=0;i<5;i++)mesh(box(.08,.24,.24,.02),m.metal,.6+i*1.15,0,0,pivot);
 const pan=new T.Group();g.add(pan);mesh(cyl(.42,.32,.08,12),m.metal,0,0,0,pan);
 const weights=[0,1,2].map(i=>{const w=mesh(cyl(.13,.15,.2,8),m.metal,(i-1)*.22,.14,(i%2)*.1,pan);w.visible=false;return w;});
 const ropes=[0,1,2].map(()=>rod(m.ink,.012,g));
 const dial=new T.Group();dial.position.set(3.05,2.1,.22);g.add(dial);mesh(cyl(.3,.3,.04,16),m.petal,0,0,0,dial).rotation.x=Math.PI/2;const needle=new T.Group();needle.position.z=.04;dial.add(needle);mesh(box(.035,.24,.02,.004),m.ink,0,.1,0,needle);
 return f=>{
  weights.forEach((w,i)=>{const t=span(f,i*.2,i*.2+.12);w.visible=t>0;w.position.y=.14+(1-smooth(t))*.9;});
  const lift=smooth(span(f,.62,1));pivot.rotation.z=-.1+lift*(Math.PI/2+.1)-(f<.62?0:0);
  const end=new T.Vector3(-.62-.55,0,0).applyEuler(pivot.rotation).add(pivot.position);pan.position.set(end.x,Math.max(.3,end.y-1.05-(1-lift)*.02),end.z);
  ropes.forEach((r,i)=>stretch(r,end,new T.Vector3(pan.position.x+Math.cos(i*2.1)*.36,pan.position.y+.04,pan.position.z+Math.sin(i*2.1)*.36)));
  needle.rotation.z=.9-.9*span(f,0,.62);
 };
}

const BUILDERS={translation:runeBridge,sentence:steppingStones,intruder:brambleWall,'listen-word':bellFlowers,numbers:balanceGate};
export function makeTaskGate(type,{area=0}={}){const k=gateKit(area),g=new T.Group();g.name='task-gate-'+type;const update=BUILDERS[type](k,g);g.userData.materials=k.materials;return{group:g,update};}

// Task-stage dressing for the same five types. The stage keeps the shared layout (piece positions, sizes and touch
// targets come from mechanismPlan); only the scenery behind the pieces, the pieces' own shapes and the link style change.
export function themeStage(type,plan,area=0){
 if(!THEMED_GATES.includes(type))return null;
 const k=gateKit(area),{m,mesh,box,cyl,tube,geo,mat}=k,object=new T.Group();object.name='themed-stage-'+type;
 const H=plan.height,entries=plan.entries,pieces=entries.filter(e=>e.action),animated=[];
 const looks=(idle,selectedColor,doneColor)=>({idle,selected:mat(selectedColor,{emissive:selectedColor,emissiveIntensity:.25}),done:mat(doneColor,{emissive:doneColor,emissiveIntensity:.3})});
 let piece,link=null;
 if(type==='translation'){
  for(const s of[-1,1]){mesh(box(3.0,H-1.05,.6,.12),m.stone,s*1.62,(H-1.05)/2,-.32,object);for(let i=0;i<3;i++){const l=mesh(rockLump(i+1),i%2?m.moss:m.stone,s*(1.1+i*.55),.15,.15,object);l.scale.set(.35,.3,.3);}}
  mesh(box(6.3,.95,.5,.1),m.dark,0,H-.7,-.25,object);mesh(box(.3,H-1.2,.2,.03),m.chasm,0,(H-1.2)/2,-.5,object);
  const hinge=new T.Group();hinge.position.set(0,.05,.38);object.add(hinge);for(let i=0;i<5;i++)mesh(box(.5,2.3,.06,.015),i%2?m.wood:k.mat(new T.Color(k.p.wood).multiplyScalar(.82).getStyle()),(i-2)*.53,1.15,0,hinge);for(const y of[.4,1.9])mesh(box(2.7,.12,.05,.02),m.metal,0,y,.04,hinge);mesh(geo('emblem',()=>new T.TorusGeometry(.32,.045,6,24)),m.metal,0,1.15,.05,hinge);for(const s of[-1,1]){const bar=mesh(box(.07,.42,.03,.01),m.glow,s*.08,1.15,.06,hinge);bar.rotation.z=s*.35;}
  animated.push(f=>{hinge.rotation.x=smooth(f)*Math.PI/2;});
  const stone=looks(m.stone,k.p.metal,k.p.glow);
  piece=(e,g)=>{const face=mesh(box(e.w,e.h,.2,.07),stone.idle,0,0,0,g);for(const s of[-1,1]){const glyph=mesh(box(.07,e.h*.62,.05,.015),m.glow,s*(e.w/2-.16),0,.11,g);glyph.rotation.z=s*.12;}return{face,looks:stone};};
  link={material:m.glow,radius:.06};
 }else if(type==='numbers'){
  mesh(cyl(.16,.24,H-.2,8),m.wood,0,(H-.2)/2,-.5,object);mesh(cyl(.5,.6,.25,8),m.dark,0,.12,-.5,object);
  const beam=new T.Group();beam.position.set(0,H-.15,-.3);object.add(beam);mesh(box(6.4,.2,.24,.05),m.wood,0,0,0,beam);mesh(cyl(.16,.16,.36,10),m.metal,0,0,0,beam).rotation.x=Math.PI/2;for(const s of[-1,1])mesh(box(.24,.32,.3,.04),m.metal,s*3.1,0,0,beam);
  for(const s of[-1,1]){const r=k.rod(m.ink,.015,object);k.stretch(r,new T.Vector3(s*1.53,H-.25,-.2),new T.Vector3(s*1.53,1.0,-.2));const pan=mesh(cyl(.6,.45,.1,14),m.metal,s*1.53,1.05,-.1,object);pan.name='pan';}
  const pile=[0,1,2].map(i=>{const w=mesh(cyl(.16,.18,.22,8),m.metal,-1.53+(i-1)*.36,1.21,-.1,object);w.visible=false;return w;});
  animated.push(f=>{beam.rotation.z=(1-smooth(f))*.11;pile.forEach((w,i)=>w.visible=f>=(i+1)/3-.001);});
  const brass=looks(m.metal,'#f1cf78',k.p.glow),wood=looks(m.wood,'#e6c27a',k.p.glow);
  piece=(e,g)=>{const left=e.action==='pair-left',face=mesh(box(e.w,e.h,left?.24:.12,left?.09:.04),left?brass.idle:wood.idle,0,0,0,g);const ring=mesh(geo('hook',()=>new T.TorusGeometry(.1,.025,5,12)),m.metal,0,e.h/2+.1,-.02,g);ring.castShadow=false;return{face,looks:left?brass:wood};};
  link={material:m.metal,radius:.035};
 }else if(type==='sentence'){
  const water=liquidMaterial(k.p.water,{local:true,halfWidth:3.2,halfLength:1.1});k.materials.push(water);const stream=mesh(new T.BoxGeometry(6.4,.04,2.2),water,0,0,1.55,object);stream.castShadow=false;stream.receiveShadow=false;
  for(let i=0;i<9;i++){const l=mesh(rockLump(i%5+1),i%3?m.stone:m.moss,-3+i*.75,.2,.3+(i%2)*.15,object);l.scale.set(.42,.36,.34);}
  for(const s of[-1,1]){mesh(cyl(.26,.4,H-.4,7),m.stone,s*3.05,(H-.4)/2,-.3,object);mesh(box(.7,.25,.7,.06),m.moss,s*3.05,H-.3,-.3,object);}
  mesh(box(6.4,.5,.4,.1),m.dark,0,H-.65,-.4,object);
  const tones=[m.stone,mat(new T.Color(k.p.stone).multiplyScalar(.9).getStyle()),mat(new T.Color(k.p.stone).lerp(new T.Color(k.p.moss),.25).getStyle())],picked=looks(m.stone,'#e9c983',k.p.glow);
  piece=(e,g)=>{const tone=tones[(e.index||0)%3],l={...picked,idle:tone},face=mesh(box(e.w,e.h,.36,.16),tone,0,0,0,g);return{face,looks:l};};
 }else if(type==='intruder'){
  const vines=[];for(const s of[-1,1]){tube([[s*3.0,0,-.3],[s*3.15,H*.35,-.25],[s*2.9,H*.7,-.35],[s*3.05,H-.3,-.3]],.2,m.bramble,object,14);}
  const rows=[...new Set(pieces.map(e=>e.y))];rows.forEach((y,i)=>{const top=y+.62,v=new T.Group();object.add(v);tube([[-3.0,top,-.2],[-1.6,top+.18,-.1],[0,top-.12,-.18],[1.6,top+.16,-.1],[3.0,top,-.2]],.11,m.bramble,v,24);tube([[-3.0,top-.3,-.25],[-1.5,top+.05,-.05],[0,top+.12,-.25],[1.5,top-.04,-.05],[3.0,top-.25,-.25]],.07,m.bramble,v,24);for(let j=0;j<7;j++){const leaf=mesh(geo('vleaf',()=>{const l=new T.SphereGeometry(.2,7,4);l.scale(1,.12,.5);return l;}),m.leaf,-2.7+j*.9,top+(j%2?.12:-.1),-.02,v);leaf.rotation.set(.4,j*1.3,j%2?.5:-.5);if(j%3===1){const b=mesh(geo('bloom',()=>new T.IcosahedronGeometry(.1,0)),m.bell,-2.7+j*.9+.12,top+.2,.04,v);b.scale.y=.7;}}for(let j=0;j<12;j++){const th=mesh(geo('thorn',()=>new T.ConeGeometry(.045,.18,4)),m.thorn,-2.8+j*.5,top+(j%2?.08:-.08),-.12,v);th.rotation.z=j%2?.7:-.7;}vines.push(v);});
  const tag=looks(m.wood,'#e7c37a',k.p.glow);
  piece=(e,g)=>{const face=mesh(box(e.w*.94,e.h*.9,.12,.05),tag.idle,0,0,0,g);for(const s of[-1,1]){tube([[s*(e.w/2+.08),-e.h*.15,-.05],[s*(e.w/2-.02),e.h*.38,.1],[s*(e.w/2-.3),e.h/2+.02,.12],[s*(e.w/2-.62),e.h/2+.2,-.04]],.05,m.bramble,g,10);for(let j=0;j<2;j++){const th=mesh(geo('thorn',()=>new T.ConeGeometry(.045,.18,4)),m.thorn,s*(e.w/2-.1-j*.25),e.h/2+.06+j*.06,.12,g);th.rotation.z=s*(j?.4:1.2);}}return{face,looks:tag};};
  animated.push(f=>{const dry=smooth(f);m.bramble.color.set(k.p.bramble).lerp(new T.Color(k.p.thorn),dry*.6);vines.forEach((v,i)=>{v.scale.y=1-dry*.06*(i+1);});});
 }else{
  const bellGeo=geo('bell',()=>{const pts=[];for(let i=0;i<=8;i++){const t=i/8;pts.push(new T.Vector2(.04+Math.sin(t*Math.PI*.5)*.26+t*t*.06,-t*.45));}return new T.LatheGeometry(pts,10);}),heads=[];
  for(const e of pieces){const side=e.x<0?-1:1,base=new T.Vector3(side*3.0,0,-.25),top=new T.Vector3(e.x+side*(e.w/2-.25),e.y+e.h/2+.3,.42);tube([[base.x,0,base.z],[side*2.9,top.y*.6,-.3],[(base.x+top.x)/2,top.y+.35,-.2],[top.x,top.y,top.z]],.05,m.leaf,object,16);const head=new T.Group();head.position.copy(top);head.scale.setScalar(.72);object.add(head);mesh(bellGeo,e.action==='listen'?m.glow:m.bell,0,0,0,head);mesh(geo('pistil',()=>new T.SphereGeometry(.06,6,4)),m.glow,0,-.42,0,head);heads.push(head);}
  for(const s of[-1,1])for(let i=0;i<3;i++){const leaf=mesh(geo('leaf',()=>{const l=new T.SphereGeometry(.42,8,4);l.scale(1,.1,.4);return l;}),m.leaf,s*(2.6+i*.18),.3+i*.35,.1,object);leaf.rotation.set(0,i,s*.5);}
  const petal=looks(mat(new T.Color(k.p.petal).lerp(new T.Color(k.p.bell),.22).getStyle()),'#f3d58c',k.p.glow),voice=looks(m.bell,'#f3d58c',k.p.glow);
  piece=(e,g)=>{const l=e.action==='listen'?voice:petal,face=mesh(box(e.w,e.h,.14,Math.min(.3,e.h*.45)),l.idle,0,0,0,g);for(const s of[-1,1]){const leaf=mesh(geo('pleaf',()=>{const q=new T.SphereGeometry(.3,8,4);q.scale(1,.42,.12);return q;}),m.leaf,s*(e.w/2-.05),-e.h/2+.02,.06,g);leaf.rotation.z=s*-.5;}return{face,looks:l};};
  animated.push((f,time)=>{heads.forEach((h,i)=>{h.rotation.z=Math.sin(time*1.7+i*1.3)*.08;h.scale.setScalar(1+smooth(f)*.25);});});
 }
 // The scenery eases toward the task's progress, so each accepted answer (and the final opening) animates.
 let shown=null;
 return{type,object,materials:k.materials,piece,link,inscription:m.stone,shown:()=>shown??0,setShown(v){shown=v;},update(dt,f,time){shown=shown===null?f:shown+(f-shown)*(1-Math.exp(-dt*3.2));if(Math.abs(f-shown)<.002)shown=f;for(const a of animated)a(shown,time);}};
}
