import * as T from './vendor/three.module.min.js';
import{bevelBox,carvedCylinder,rockLump,liquidMaterial}from'./prop-art.js';
// Themed task gates. Each English task type gets its own obstacle on the trail and its own dressing on the task
// stage, and the obstacle opens in visible steps: runes light and a drawbridge drops, stepping stones rise, brambles
// wither, bell flowers swing aside, a balance lifts its arm. Everything is visual; the expedition decides passage.
// When open, nothing remains over the 5 m walkway (|x| < 2.5) higher than the ground.

export const THEMED_GATES=['translation','sentence','intruder','listen-word','numbers','ending','correct','spelling','listen-tr','halves','qa-pairs','gap','repair','answer','sort'];
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


// Fruit tree: two heavy branches reach across the path; the fruit ripens and drops, then the branches swing aside.
function fruitTree(k,g){
 const{m,mesh,geo,tube,mat}=k,bark=mat(new T.Color(k.p.wood).multiplyScalar(.7).getStyle()),fruitMat=mat('#8fb860',{emissive:'#f0a050',emissiveIntensity:0}),leafGeo=geo('clump',()=>{const c=new T.IcosahedronGeometry(.5,1);c.scale(1,.7,1);return c;});
 tube([[-3.95,0,0],[-3.85,1.4,.1],[-3.95,2.8,-.05],[-4.05,3.6,0]],.34,bark,g,14);for(let i=0;i<4;i++){const r=mesh(rockLump(i+1),bark,-3.95+Math.cos(i*1.6)*.45,.12,Math.sin(i*1.6)*.45,g);r.scale.set(.3,.22,.3);}
 for(let i=0;i<4;i++){const c=mesh(leafGeo,m.leaf,-4.15+Math.cos(i*1.7)*.5,3.75+(i%2)*.45,Math.sin(i*1.7)*.6,g);c.scale.setScalar(1.25);}
 const fruits=[],branches=[[1.85,1],[2.55,-1]].map(([y,turn],b)=>{const pivot=new T.Group();pivot.position.set(-3.85,y,b?.15:-.1);g.add(pivot);
  tube([[0,0,0],[2,-.25,0],[4.2,-.55-b*.1,.05],[6.2,-.75-b*.15,0]],.12-b*.02,bark,pivot,16);
  for(let i=0;i<4;i++){const x=1.9+i*1.4,c=mesh(leafGeo,m.leaf,x,-.25-i*.14+.25,0,pivot);c.scale.set(1,.8,1);const f=mesh(geo('fruit',()=>new T.IcosahedronGeometry(.16,1)),fruitMat,x+.2,-.65-i*.14,.1,pivot);fruits.push({f,y:f.position.y,i:fruits.length});}
  return{pivot,turn};});
 return f=>{
  fruitMat.color.set('#8fb860').lerp(new T.Color('#f2994a'),smooth(span(f,0,.35)));fruitMat.emissiveIntensity=.25*smooth(span(f,.1,.4));
  for(const q of fruits){const t=span(f,.18+q.i*.045,.32+q.i*.045);q.f.position.y=q.y-smooth(t)*2.2;q.f.visible=t<1;q.f.scale.setScalar(1-t*.4);}
  for(const b of branches){const t=smooth(span(f,.55,1));b.pivot.rotation.y=b.turn*t*Math.PI/2;b.pivot.rotation.z=t*.18;}
 };
}

// Signposts in fog: three signs hang over a fog bank; the wrong two crumble, the fog clears and the right one points the way.
function signposts(k,g){
 const{m,mesh,box,cyl,geo,rod,stretch,mat}=k,fog=mat('#f4f1e8',{transparent:true,opacity:.62,depthWrite:false,roughness:1});
 for(const s of[-1,1]){mesh(cyl(.13,.18,2.7,8),m.wood,s*3.05,1.35,0,g);mesh(cyl(.2,.16,.12,8),m.dark,s*3.05,2.74,0,g);}
 const rope=rod(m.ink,.018,g);stretch(rope,new T.Vector3(-3.0,2.35,0),new T.Vector3(3.0,2.35,0));
 const arrow=geo('arrow',()=>{const b=bevelBox(1.25,.38,.09,.03),tip=new T.ConeGeometry(.27,.32,4);tip.rotateZ(-Math.PI/2);tip.rotateX(Math.PI/4);tip.scale(1,1,.33);tip.translate(.78,0,0);const pos=[...b.attributes.position.array],nor=[...b.attributes.normal.array],t2=tip.toNonIndexed();pos.push(...t2.attributes.position.array);nor.push(...t2.attributes.normal.array);const out=new T.BufferGeometry();out.setAttribute('position',new T.Float32BufferAttribute(pos,3));out.setAttribute('normal',new T.Float32BufferAttribute(nor,3));return out;});
 const signs=[-1.7,0,1.7].map((x,i)=>{const sign=new T.Group();sign.position.set(x,1.75,.05);g.add(sign);const plank=mesh(arrow,i===1?mat(k.p.wood,{emissive:k.p.glow,emissiveIntensity:0}):m.wood,0,0,0,sign);plank.rotation.y=i===0?Math.PI:0;for(let j=0;j<3;j++)mesh(box(.22+((i+j)%2)*.16,.04,.02,.008),m.ink,-.35+j*.33,.03,.06,sign);const strings=[-.4,.4].map(dx=>{const r=rod(m.ink,.01,g);return{r,dx};});return{sign,plank,strings,x,i};});
 const puffs=[];for(let i=0;i<9;i++){const p=mesh(geo('puff',()=>{const q=new T.SphereGeometry(.8,10,6);q.scale(1,.42,.8);return q;}),fog,-2.5+i*.62,.35+(i%2)*.1,(i%3-1)*.35,g);p.castShadow=false;puffs.push(p);}
 return(f,time=0)=>{
  for(const s of signs){if(s.i===1){const t=smooth(span(f,.5,1));s.sign.position.set(s.x+t*3.0,1.75+Math.sin(t*Math.PI)*.6-t*.15,.05+t*.22);s.sign.rotation.set(0,t*Math.PI/2,Math.sin(time*1.3)*.04*(1-t));s.plank.material.emissiveIntensity=.7*smooth(span(f,.35,.6));}
   else{const t=span(f,s.i?.2:.05,s.i?.45:.3);s.sign.rotation.z=(s.i?-1:1)*smooth(t)*1.1;s.sign.position.y=1.75-smooth(t)*1.6;s.sign.scale.setScalar(Math.max(.001,1-smooth(span(t,.55,1))));s.sign.visible=t<1;}
   for(const st of s.strings){st.r.visible=f<.5&&s.sign.visible;stretch(st.r,new T.Vector3(s.sign.position.x+st.dx,2.35,0),new T.Vector3(s.sign.position.x+st.dx,s.sign.position.y+.2,s.sign.position.z));}}
  rope.visible=f<.55;fog.opacity=.62*(1-smooth(span(f,.25,.8)));for(const p of puffs){p.visible=f<.8;p.position.x+=Math.sin(time*.4+p.position.z)*.0008;}
 };
}

// Mushroom ring: corrupted glowing mushrooms crowd the path; they burst one by one and the edge mushrooms heal.
function mushroomRing(k,g){
 const{m,mesh,cyl,geo,mat}=k,sick=mat('#8a5aa8',{emissive:'#a070d0',emissiveIntensity:.45}),stem=mat('#d9cdb8'),spot=mat('#efe6f6',{emissive:'#d8c8f0',emissiveIntensity:.3});
 const capGeo=geo('cap',()=>{const c=new T.SphereGeometry(.5,14,8,0,Math.PI*2,0,Math.PI/2);c.scale(1,.62,1);return c;}),spotGeo=geo('spot',()=>new T.CircleGeometry(.07,8));
 const make=(x,z,h,r,cap)=>{const grp=new T.Group();grp.position.set(x,0,z);g.add(grp);mesh(cyl(r*.24,r*.32,h,8),stem,0,h/2,0,grp);const c=mesh(capGeo,cap,0,h-.02,0,grp);c.scale.multiplyScalar(r*2);for(let j=0;j<4;j++){const a=j*1.7,d=mesh(spotGeo,spot,Math.cos(a)*r*.55,h+r*.35+(j%2)*r*.08,Math.sin(a)*r*.55,grp);d.lookAt(new T.Vector3(Math.cos(a)*r*4,h+r*2,Math.sin(a)*r*4).add(grp.position));}return grp;};
 const big=[[-1.9,.2,1.25,.75],[-.7,-.35,1.7,.95],[.6,.25,1.4,.85],[1.8,-.25,1.1,.7],[-.05,.75,.8,.55],[1.2,.85,.7,.5]].map(([x,z,h,r],i)=>({grp:make(x,z,h,r,sick),i}));
 const healthyCap=mat('#c45a3c'),edge=[];for(const s of[-1,1])for(let i=0;i<3;i++)edge.push(make(s*(2.95+(i%2)*.25),(i-1)*.55,.42+i*.12,.28,healthyCap));
 const spores=[];for(let i=0;i<14;i++){const sp=mesh(geo('spore',()=>new T.OctahedronGeometry(.04,0)),spot,-2+((i*7)%10)*.42,.5,((i*3)%5-2)*.3,g);sp.castShadow=false;spores.push(sp);}
 const healthy=new T.Color('#c45a3c'),purple=new T.Color('#8a5aa8');
 return(f,time=0)=>{
  for(const b of big){const t=span(f,.08+b.i*.12,.24+b.i*.12),pop=t<.35?1+Math.sin(t/.35*Math.PI)*.18:Math.max(.001,1-smooth((t-.35)/.65));b.grp.scale.set(pop,t<.35?pop:pop*.6+.001,pop);b.grp.visible=t<1;}
  healthyCap.color.copy(purple).lerp(healthy,smooth(span(f,.4,1)));sick.emissiveIntensity=.35+.15*Math.sin(time*2.2);
  spores.forEach((sp,i)=>{sp.visible=f<.85;sp.position.y=.4+((time*.25+i*.13)%1)*1.6;});
 };
}

// Crystal chimes: chimes hang across the path from a split beam; each rings and shatters, then the beam folds up.
function crystalChimes(k,g){
 const{m,mesh,box,cyl,geo,rod,stretch,mat}=k,glass=mat(k.p.glow,{emissive:k.p.glow,emissiveIntensity:.55,roughness:.15,metalness:.1,transparent:true,opacity:.85});
 for(const s of[-1,1]){mesh(cyl(.2,.28,3.1,6),m.stone,s*3.05,1.55,0,g);mesh(box(.6,.2,.6,.05),m.dark,s*3.05,3.15,0,g);}
 const halves=[-1,1].map(s=>{const pivot=new T.Group();pivot.position.set(s*3.0,3.0,0);g.add(pivot);mesh(box(3.0,.16,.2,.04),m.wood,-s*1.5,0,0,pivot);return{pivot,s};});
 const chimeGeo=geo('chime',()=>{const c=new T.OctahedronGeometry(.22,0);c.scale(.8,2.2,.8);return c;}),shardGeo=geo('shard',()=>new T.OctahedronGeometry(.07,0));
 const chimes=[-2.4,-1.6,-.8,0,.8,1.6,2.4].map((x,i)=>{const len=1.3+((i*5)%4)*.25,c=mesh(chimeGeo,glass,x,3.0-len,0,g);const string=rod(m.ink,.008,g);stretch(string,new T.Vector3(x,2.95,0),new T.Vector3(x,3.0-len+.45,0));const shards=[0,1,2,3].map(j=>{const s=mesh(shardGeo,glass,x,3.0-len,0,g);s.visible=false;s.castShadow=false;return s;});return{c,string,shards,x,y:3.0-len,i};});
 return(f,time=0)=>{
  for(const ch of chimes){const t=span(f,.05+ch.i*.085,.2+ch.i*.085);ch.c.rotation.z=Math.sin(time*2+ch.i)*.06+(t>0&&t<.4?Math.sin(t*60)*.15:0);ch.c.visible=t<.4;ch.string.visible=t<.4;
   ch.shards.forEach((s,j)=>{const a=j*Math.PI/2+ch.i,u=span(t,.4,1);s.visible=u>0&&u<1;s.position.set(ch.x+Math.cos(a)*u*.9,ch.y+u*.5-u*u*1.6,Math.sin(a)*u*.9);s.scale.setScalar(1-u*.7);});}
  const fold=smooth(span(f,.72,1));for(const h of halves)h.pivot.rotation.z=-h.s*fold*Math.PI/2;
 };
}

// Split-log bridge: broken log halves jut up from a murky stream; they swing down and join into a crossing.
function splitLogs(k,g){
 const{m,mesh,box,cyl,geo,mat}=k,water=liquidMaterial(new T.Color(k.p.water).lerp(new T.Color(k.p.moss),.45).getStyle(),{local:true,halfWidth:3.3,halfLength:1.15});k.materials.push(water);
 const stream=mesh(new T.BoxGeometry(6.6,.04,2.3),water,0,0,0,g);stream.castShadow=false;
 for(const s of[-1,1])for(let i=0;i<5;i++){const l=mesh(rockLump(i+1),i%2?m.moss:m.stone,s*(2.95+(i%2)*.3),.12,(i-2)*.5,g);l.scale.set(.34,.3,.32);}
 const split=mat(new T.Color(k.p.wood).lerp(new T.Color('#f0d9a8'),.45).getStyle()),bark=mat(new T.Color(k.p.wood).multiplyScalar(.72).getStyle()),barkShell=mat(new T.Color(k.p.wood).multiplyScalar(.62).getStyle(),{side:T.DoubleSide});
 const halves=[];[-1.25,0,1.25].forEach((x,i)=>{for(const end of[-1,1]){const pivot=new T.Group();pivot.position.set(x,.03,end*1.15);g.add(pivot);
  // Each half reaches from its bank to the middle; its flat split face stays on top when it lies down.
  mesh(box(.62,.05,1.15,.02),split,0,0,-end*.575,pivot);const shell=mesh(geo('bark',()=>{const c=new T.CylinderGeometry(.31,.31,1.15,10,1,true,-Math.PI/2,Math.PI);c.rotateX(Math.PI/2);return c;}),barkShell,0,-.02,-end*.575,pivot);shell.scale.y=.75;
  const tip=mesh(geo('splinter',()=>new T.ConeGeometry(.08,.3,4)),split,(end>0?.15:-.15),0,-end*1.15,pivot);tip.rotation.x=-end*Math.PI/2;tip.name='splinter';
  halves.push({pivot,end,i,tip});}});
 return f=>{
  for(const h of halves){const t=span(f,.08+h.i*.24,.38+h.i*.24),drop=smooth(t),bounce=t>0&&t<1?Math.sin(t*Math.PI*3)*(1-t)*.08:0;h.pivot.rotation.x=h.end*(1-drop)*1.15+bounce*h.end;h.tip.visible=t<1;h.tip.scale.setScalar(t<1?1:.001);}
 };
}

// A small perching bird (body, head, beak, tail, two flapping wings) facing +z.
function bird(k,color){
 const{mesh,geo,mat}=k,g=new T.Group(),body=mat(color),belly=mat(new T.Color(color).lerp(new T.Color('#fff4dc'),.55).getStyle()),beak=mat('#e8a83a');
 const b=mesh(geo('bbody',()=>{const q=new T.SphereGeometry(.2,10,7);q.scale(.85,.8,1.15);return q;}),body,0,.2,0,g);mesh(geo('bbelly',()=>{const q=new T.SphereGeometry(.15,8,6);q.scale(.8,.8,.6);return q;}),belly,0,.15,.1,g);
 mesh(geo('bhead',()=>new T.SphereGeometry(.13,10,7)),body,0,.4,.12,g);const bk=mesh(geo('bbeak',()=>new T.ConeGeometry(.04,.12,5)),beak,0,.39,.27,g);bk.rotation.x=Math.PI/2;
 for(const s of[-1,1]){mesh(geo('beye',()=>new T.SphereGeometry(.025,6,4)),k.m.ink,s*.07,.43,.22,g);}
 const tail=mesh(geo('btail',()=>{const q=new T.ConeGeometry(.08,.28,4);q.rotateX(-Math.PI/2-.4);return q;}),body,0,.22,-.24,g);
 const wings=[-1,1].map(s=>{const pivot=new T.Group();pivot.position.set(s*.15,.27,0);g.add(pivot);const w=mesh(geo('bwing',()=>{const q=new T.SphereGeometry(.17,8,5);q.scale(.35,.12,1);q.translate(0,0,-.02);return q;}),body,s*.05,0,0,pivot);w.rotation.z=s*.3;return{pivot,s};});
 g.userData.flap=(t,amount)=>{for(const w of wings)w.pivot.rotation.z=w.s*(-.2+Math.sin(t)*amount);};
 return g;
}

// Message birds: birds holding message scrolls sit on a rope across the path; they fly off and the rope halves drop.
function messageBirds(k,g){
 const{m,mesh,box,cyl,geo,rod,stretch,mat}=k,paper=mat('#efe2c4');
 for(const s of[-1,1]){mesh(cyl(.12,.16,2.5,8),m.wood,s*3.05,1.25,0,g);mesh(box(.5,.12,.5,.03),m.dark,s*3.05,2.52,0,g);}
 const halves=[-1,1].map(s=>{const pivot=new T.Group();pivot.position.set(s*3.0,2.3,0);g.add(pivot);const r=rod(m.ink,.02,pivot);stretch(r,new T.Vector3(0,0,0),new T.Vector3(-s*3.0,-.25,0));return{pivot,s};});
 const colours=['#5f86b8','#c8783a','#7a9c4c','#b85f6a','#d6b04a'],birds=[-2.3,-1.15,0,1.15,2.3].map((x,i)=>{const b=bird(k,colours[i]);b.position.set(x,2.08-Math.cos(x/3*Math.PI/2)*.22+.0,0);b.scale.setScalar(1.25);g.add(b);
  const scroll=new T.Group();scroll.position.set(0,-.05,.18);b.add(scroll);const string=rod(m.ink,.008,scroll);stretch(string,new T.Vector3(0,0,0),new T.Vector3(0,-.55,0));mesh(geo('scroll',()=>{const q=new T.CylinderGeometry(.06,.06,.42,10);q.rotateZ(Math.PI/2);return q;}),paper,0,-.62,0,scroll);mesh(box(.36,.3,.01,.004),paper,0,-.82,0,scroll);
  return{b,x,i,y:b.position.y};});
 return(f,time=0)=>{
  for(const q of birds){const t=span(f,.04+q.i*.12,.3+q.i*.12),side=q.x<0||(q.x===0&&q.i%2)?-1:1;q.b.position.set(q.x+side*smooth(t)*4.5,q.y+smooth(t)*3.2,smooth(t)*-1.5);q.b.rotation.y=side*smooth(span(t,0,.2))*.9;q.b.userData.flap(time*(t>0?22:3)+q.i,t>0?1.1:.08);q.b.visible=t<1;}
  const drop=smooth(span(f,.72,1));for(const h of halves)h.pivot.rotation.z=h.s*drop*(Math.PI/2-.08);
 };
}

// Water wheel: a portcullis bars the path; paddles slot into the wheel, it turns and lowers the portcullis into the ground.
function waterWheel(k,g){
 const{m,mesh,box,cyl,geo,rod,stretch,mat}=k,water=liquidMaterial(k.p.water,{local:true,halfWidth:.4,halfLength:1.4});k.materials.push(water);
 for(const s of[-1,1]){mesh(box(.42,3.0,.5,.06),m.stone,s*2.95,1.5,0,g);mesh(box(.6,.2,.66,.05),m.dark,s*2.95,3.08,0,g);}
 const gate=new T.Group();g.add(gate);for(let i=0;i<9;i++)mesh(box(.12,2.5,.12,.03),m.dark,-2.4+i*.6,1.25,0,gate);for(const y of[.5,1.4,2.3])mesh(box(5.0,.14,.1,.03),m.dark,0,y,.06,gate);for(let i=0;i<9;i++){const tip=mesh(geo('spike',()=>new T.ConeGeometry(.08,.22,4)),m.metal,-2.4+i*.6,-.08,0,gate);tip.rotation.x=Math.PI;}
 const wheel=new T.Group();wheel.position.set(3.75,1.3,.2);g.add(wheel);const rim=mesh(geo('rim',()=>{const q=new T.TorusGeometry(1.05,.06,6,28);q.rotateY(Math.PI/2);return q;}),m.wood,0,0,0,wheel);rim.castShadow=true;
 for(let i=0;i<6;i++){const sp=mesh(box(.08,2.05,.08,.02),m.wood,0,0,0,wheel);sp.rotation.x=i*Math.PI/6;}mesh(cyl(.16,.16,.4,10),m.metal,0,0,0,wheel).rotation.z=Math.PI/2;
 const paddles=[];for(let i=0;i<8;i++){const a=i*Math.PI/4,p=mesh(box(.42,.06,.36,.015),m.wood,0,Math.cos(a)*1.08,Math.sin(a)*1.08,wheel);p.rotation.x=-a;paddles.push({p,i});}
 const chute=mesh(box(.6,.12,1.6,.03),m.wood,3.75,2.65,-1.1,g);chute.rotation.x=.18;const fall=mesh(new T.BoxGeometry(.4,1.3,.1),water,3.75,1.95,-.35,g);fall.castShadow=false;
 const ropes=[-1,1].map(()=>rod(m.ink,.02,g));
 let angle=0,last=0;
 return(f,time=0)=>{
  const dt=Math.max(0,Math.min(.1,time-last));last=time;
  paddles.forEach(q=>{const on=span(f,q.i*.07,q.i*.07+.06)>0||q.i%2;q.p.visible=!!on;});
  angle+=dt*(.2+smooth(span(f,.4,1))*2.2);wheel.rotation.x=angle;fall.visible=f>.05;
  const lower=smooth(span(f,.55,1));gate.position.y=-lower*2.62;gate.visible=lower<1;ropes.forEach((r,i)=>{const s=i?1:-1;stretch(r,new T.Vector3(s*2.9,3.1,0),new T.Vector3(s*2.4,2.5+gate.position.y,0));r.visible=lower<1;});
 };
}

// Seal stone: a round stone door with a glowing crack and a missing tile; the tile flies in, the crack seals, it rolls down.
function sealStone(k,g){
 const{m,mesh,box,cyl,geo,mat}=k,crack=mat(k.p.glow,{emissive:k.p.glow,emissiveIntensity:1.1}),tileM=mat(k.p.metal,{metalness:.3,roughness:.4,emissive:k.p.glow,emissiveIntensity:0});
 for(const s of[-1,1]){mesh(cyl(.32,.42,3.4,8),m.stone,s*3.05,1.7,0,g);mesh(cyl(.48,.36,.24,8),m.dark,s*3.05,3.5,0,g);}
 const seal=new T.Group();seal.position.set(0,1.7,0);g.add(seal);const disc=mesh(geo('seal',()=>{const q=new T.CylinderGeometry(1.7,1.7,.42,32);q.rotateX(Math.PI/2);return q;}),m.stone,0,0,0,seal);
 mesh(geo('sealrim',()=>new T.TorusGeometry(1.62,.08,6,40)),m.dark,0,0,.22,seal);mesh(geo('sealin',()=>new T.TorusGeometry(.95,.05,6,32)),m.dark,0,0,.22,seal);
 for(let i=0;i<8;i++){const a=i*Math.PI/4,t=mesh(box(.42,.3,.06,.02),i===2?tileM:m.dark,Math.cos(a)*1.28,Math.sin(a)*1.28,.22,seal);t.rotation.z=a+Math.PI/2;if(i===2)t.name='missing-tile';}
 const tile=seal.getObjectByName('missing-tile'),home=tile.position.clone();
 const cracks=[[[-.2,1.5],[.15,.8],[-.1,.2],[.2,-.6],[-.05,-1.5]]].flatMap(pts=>pts.slice(1).map((p,i)=>{const a=pts[i],len=Math.hypot(p[0]-a[0],p[1]-a[1]),c=mesh(box(.06,len,.02,.008),crack,(a[0]+p[0])/2,(a[1]+p[1])/2,.23,seal);c.rotation.z=Math.atan2(-(p[0]-a[0]),p[1]-a[1]);return c;}));
 return f=>{
  const fly=smooth(span(f,.1,.45));tile.position.set(home.x+(1-fly)*1.8,home.y+(1-fly)*1.2,home.z+(1-fly)*.8);tileM.emissiveIntensity=fly*.6;
  crack.emissiveIntensity=1.1*(1-smooth(span(f,.4,.65)));cracks.forEach(c=>c.scale.x=1-smooth(span(f,.45,.65))*.9);
  const sink=smooth(span(f,.62,1));seal.position.y=1.7-sink*3.55;seal.rotation.z=-sink*1.4;seal.visible=sink<1;
 };
}

// A large friendly owl (body, face discs, eyes, tufts, wings, toes) facing +z; returns the figure and its head.
function owlFigure(k){
 const{mesh,geo,mat}=k,feather=mat(new T.Color(k.p.wood).lerp(new T.Color('#c9a87a'),.4).getStyle()),face=mat('#f1e3c4'),eyeM=mat('#f6f2e6'),pupil=mat('#203028'),beakM=mat('#e0a23c');
 const owl=new T.Group();const body=mesh(geo('obody',()=>{const q=new T.SphereGeometry(.75,16,12);q.scale(1,1.15,.9);return q;}),feather,0,.86,0,owl);
 mesh(geo('obelly',()=>{const q=new T.SphereGeometry(.55,12,8);q.scale(1,1.1,.5);return q;}),face,0,.75,.42,owl);
 const head=new T.Group();head.position.set(0,1.7,0);owl.add(head);mesh(geo('ohead',()=>{const q=new T.SphereGeometry(.55,16,12);q.scale(1.1,.9,.95);return q;}),feather,0,0,0,head);
 for(const s of[-1,1]){mesh(geo('odisc',()=>{const q=new T.CircleGeometry(.24,16);return q;}),face,s*.22,.02,.5,head);const eye=mesh(geo('oeye',()=>new T.SphereGeometry(.13,10,8)),eyeM,s*.22,.03,.47,head);eye.scale.z=.6;mesh(geo('opupil',()=>new T.SphereGeometry(.07,8,6)),pupil,s*.22,.03,.55,head);const tuft=mesh(geo('otuft',()=>new T.ConeGeometry(.12,.35,5)),feather,s*.38,.48,0,head);tuft.rotation.z=-s*.4;}
 const beak=mesh(geo('obeak',()=>new T.ConeGeometry(.07,.2,5)),beakM,0,-.12,.55,head);beak.rotation.x=Math.PI/2+.4;
 for(const s of[-1,1]){const w=mesh(geo('owing',()=>{const q=new T.SphereGeometry(.45,10,8);q.scale(.35,1,.8);return q;}),feather,s*.72,.9,-.05,owl);w.rotation.z=s*.15;for(let j=0;j<3;j++){const toe=mesh(geo('otoe',()=>new T.ConeGeometry(.05,.18,4)),beakM,s*.25+(j-1)*.08,.05,.35,owl);toe.rotation.x=Math.PI/2;}}
 return{owl,head};
}

// Woodland visitor: a large owl sits in the middle of the path; it nods, then hops aside and settles.
function woodlandVisitor(k,g){
 const{m,mesh,geo}=k,{owl,head}=owlFigure(k);g.add(owl);
 for(const s of[-1,1]){mesh(k.cyl(.06,.08,1.2,6),m.wood,s*3.0,.6,.3,g);const lamp=mesh(geo('lamp',()=>new T.OctahedronGeometry(.14,0)),m.glow,s*3.0,1.3,.3,g);lamp.castShadow=false;}
 return(f,time=0)=>{
  const nod=span(f,0,.5);head.rotation.x=Math.sin(nod*Math.PI*3)*.25*(1-span(f,.45,.5))+Math.sin(time*.8)*.03;head.rotation.y=Math.sin(time*.5)*.15*(1-f);
  const hop=span(f,.5,1),hx=smooth(hop)*3.45,arc=Math.abs(Math.sin(hop*Math.PI*3))*.45*(1-hop*.3);owl.position.set(hx,arc,smooth(hop)*.6);owl.rotation.y=Math.sin(hop*Math.PI)*-1.2+smooth(span(hop,.8,1))*-.5;owl.scale.setScalar(1-smooth(hop)*.18);
 };
}

// Supply carts: two handcarts block the path; crates and sacks drop in, then the carts turn and roll to the sides.
function supplyCarts(k,g){
 const{m,mesh,box,cyl,geo,mat}=k,sack=mat('#c9b48a'),crate=mat(new T.Color(k.p.wood).lerp(new T.Color('#e0c38a'),.3).getStyle()),signM=mat('#efe2c4');
 const carts=[-1,1].map((s,ci)=>{const c=new T.Group();c.position.set(s*1.3,0,0);g.add(c);mesh(box(2.0,.12,1.05,.03),m.wood,0,.62,0,c);for(const z of[-.5,.5])mesh(box(2.0,.42,.07,.02),m.wood,0,.86,z,c);for(const x of[-1,1])mesh(box(.07,.42,1.05,.02),m.wood,x*.98,.86,0,c);
  const wheels=[-1,1].map(z=>{const w=mesh(geo('cwheel',()=>{const q=new T.CylinderGeometry(.42,.42,.08,14);q.rotateX(Math.PI/2);return q;}),m.dark,.45,.42,z*.6,c);return w;});mesh(box(.06,.06,1.3,.01),m.metal,.45,.42,0,c);
  const handle=mesh(box(.9,.07,.07,.02),m.wood,-1.38,.85,0,c);handle.rotation.z=-.4;const sign=mesh(box(.9,.42,.05,.02),signM,0,1.42,.55,c);mesh(box(.06,.4,.06,.02),m.wood,0,1.12,.55,c);
  const items=[0,1,2].map(i=>{const it=mesh(i===1?geo('sack',()=>{const q=new T.SphereGeometry(.26,10,8);q.scale(1,.8,1);return q;}):box(.38,.34,.38,.04),i===1?sack:crate,(i-1)*.55,.9,(i%2)*.15-.05,c);it.visible=false;return{it,i};});
  return{c,s,wheels,items,ci};});
 return f=>{
  for(const cart of carts){cart.items.forEach(q=>{const t=span(f,cart.ci*.08+q.i*.16,cart.ci*.08+q.i*.16+.12);q.it.visible=t>0;q.it.position.y=.9+(1-smooth(t))*1.6;});
   const roll=smooth(span(f,.6,1));cart.c.rotation.y=-cart.s*roll*Math.PI/2;cart.c.position.x=cart.s*(1.3+roll*2.15);cart.wheels.forEach(w=>w.rotation.z=-roll*5);}
 };
}

const BUILDERS={translation:runeBridge,sentence:steppingStones,intruder:brambleWall,'listen-word':bellFlowers,numbers:balanceGate,ending:fruitTree,correct:signposts,spelling:mushroomRing,'listen-tr':crystalChimes,halves:splitLogs,'qa-pairs':messageBirds,gap:waterWheel,repair:sealStone,answer:woodlandVisitor,sort:supplyCarts};
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

 }else if(type==='ending'){
  // A fruit tree: trunk at the side, branches over the plaques, one fruit per answer that ripens as the task goes on.
  const bark=mat(new T.Color(k.p.wood).multiplyScalar(.7).getStyle()),fruit=mat('#8fb860',{emissive:'#f0a050',emissiveIntensity:0}),clump=geo('clump',()=>{const c=new T.IcosahedronGeometry(.6,1);c.scale(1,.7,1);return c;});
  tube([[-3.05,0,-.45],[-2.95,H*.45,-.4],[-3.1,H*.8,-.45],[-2.6,H+.1,-.5]],.3,bark,object,14);tube([[-2.9,H-.2,-.45],[-1,H+.15,-.4],[1.2,H,-.45],[3.0,H-.25,-.5]],.14,bark,object,16);
  for(let i=0;i<7;i++){const c=mesh(clump,m.leaf,-3+i*1.0,H-.15+(i%2)*.25,-.75,object);c.scale.setScalar(1.15);}for(let i=0;i<4;i++){const c=mesh(clump,m.leaf,-3.15+(i%2)*.35,H*.45+i*.5,-.6,object);c.scale.setScalar(.9);}for(let i=0;i<3;i++){const r=mesh(rockLump(i+1),bark,-3.05+Math.cos(i*2)*.4,.1,-.45+Math.sin(i*2)*.3,object);r.scale.set(.3,.2,.3);}
  const fruits=[],plaque=looks(mat(new T.Color(k.p.petal).lerp(new T.Color(k.p.leaf),.18).getStyle()),'#f3d58c',k.p.glow);
  piece=(e,g)=>{const face=mesh(box(e.w,e.h,.14,Math.min(.25,e.h*.4)),plaque.idle,0,0,0,g);const f=mesh(geo('fruit',()=>new T.IcosahedronGeometry(.2,1)),fruit,e.w/2-.22,e.h/2+.05,.12,g);fruits.push(f);mesh(geo('fleaf',()=>{const q=new T.SphereGeometry(.16,7,4);q.scale(1,.25,.5);return q;}),m.leaf,e.w/2-.02,e.h/2+.2,.08,g).rotation.z=-.6;return{face,looks:plaque};};
  animated.push((f,time)=>{fruit.color.set('#8fb860').lerp(new T.Color('#f2994a'),smooth(f));fruit.emissiveIntensity=.3*smooth(f);fruits.forEach((q,i)=>{q.rotation.z=Math.sin(time*1.4+i)*.12;});});
 }else if(type==='correct'){
  // Signposts in fog: a tall post carries the arrow signs; the fog thins as the right sentences are chosen.
  mesh(cyl(.17,.24,H+.1,8),m.wood,0,(H+.1)/2,-.5,object);mesh(cyl(.3,.22,.18,8),m.dark,0,H+.12,-.5,object);mesh(cyl(.5,.62,.24,8),m.dark,0,.12,-.5,object);
  const fog=mat('#f4f1e8',{transparent:true,opacity:.55,depthWrite:false,roughness:1}),puffs=[];for(let i=0;i<8;i++){const p=mesh(geo('puff',()=>{const q=new T.SphereGeometry(.9,10,6);q.scale(1,.4,.7);return q;}),fog,-3+i*.86,.32+(i%2)*.1,.6+(i%3)*.25,object);p.castShadow=false;puffs.push(p);}
  const sign=looks(m.wood,'#e7c37a',k.p.glow);
  piece=(e,g)=>{const s=e.x<0?-1:1,face=mesh(box(e.w,e.h,.12,.04),sign.idle,0,0,0,g),tip=mesh(geo('signtip',()=>{const c=new T.ConeGeometry(.5,.36,4);c.rotateZ(-Math.PI/2);c.rotateX(Math.PI/4);c.scale(1,1,.25);return c;}),sign.idle,s*(e.w/2+.17),0,0,g);tip.scale.set(s,e.h/1.0,1);return{face,looks:sign,tints:[tip]};};
  animated.push(f=>{fog.opacity=.55*(1-smooth(f)*.85);});
 }else if(type==='spelling'){
  // Corrupted mushrooms: tall caps at the sides and a cap above each word; they heal as faulty words are found.
  const sick=mat('#8a5aa8',{emissive:'#a070d0',emissiveIntensity:.45}),stem=mat('#d9cdb8'),spotM=mat('#efe6f6',{emissive:'#d8c8f0',emissiveIntensity:.3}),cap=geo('cap',()=>{const c=new T.SphereGeometry(.5,14,8,0,Math.PI*2,0,Math.PI/2);c.scale(1,.62,1);return c;});
  for(const s of[-1,1])for(let i=0;i<2;i++){const h=H*(.55-i*.18),x=s*(3.0-i*.15),z=-.4+i*.5;mesh(cyl(.14,.2,h,8),stem,x,h/2,z,object);const c=mesh(cap,sick,x,h,z,object);c.scale.setScalar(1.6-i*.4);}
  const spores=[];for(let i=0;i<12;i++){const sp=mesh(geo('spore',()=>new T.OctahedronGeometry(.045,0)),spotM,-2.8+((i*7)%12)*.5,1,-.2+(i%3)*.2,object);sp.castShadow=false;spores.push(sp);}
  const tag=looks(mat('#efe4d0'),'#f3d58c',k.p.glow);
  piece=(e,g)=>{const face=mesh(box(e.w,e.h,.14,.06),tag.idle,0,0,0,g);mesh(cyl(.07,.09,.28,7),stem,-e.w/2+.3,e.h/2+.1,.02,g);const c=mesh(cap,sick,-e.w/2+.3,e.h/2+.22,.02,g);c.scale.setScalar(.75);return{face,looks:tag};};
  const healthy=new T.Color('#c45a3c'),purple=new T.Color('#8a5aa8');
  animated.push((f,time)=>{sick.color.copy(purple).lerp(healthy,smooth(f));sick.emissiveIntensity=.45*(1-smooth(f))+.05*Math.sin(time*2.2);spores.forEach((sp,i)=>{sp.visible=f<.95;sp.position.y=.6+((time*.22+i*.11)%1)*(H-1);});});
 }else if(type==='listen-tr'){
  // Crystal chimes on a beam: spoken words hang as crystals, Turkish meanings as wooden tags, joined by light threads.
  mesh(box(6.4,.22,.26,.05),m.wood,0,H-.12,-.25,object);for(const s of[-1,1]){mesh(cyl(.18,.26,H,6),m.stone,s*3.05,H/2,-.3,object);}
  for(const e of pieces){const r=k.rod(m.ink,.01,object);k.stretch(r,new T.Vector3(e.x,H-.2,-.2),new T.Vector3(e.x,e.y+e.h/2,-.05));}
  const glass=looks(mat(k.p.glow,{emissive:k.p.glow,emissiveIntensity:.35,roughness:.2}),'#f3e2a0','#c9f7dc'),tag=looks(m.wood,'#e7c37a',k.p.glow);
  piece=(e,g)=>{const left=e.action==='pair-left',face=mesh(box(e.w,e.h,left?.3:.12,left?.16:.04),left?glass.idle:tag.idle,0,0,0,g);if(left)for(const s of[-1,1]){const c=mesh(geo('pcrystal',()=>{const q=new T.OctahedronGeometry(.18,0);q.scale(.7,1.8,.7);return q;}),glass.idle,s*(e.w/2+.05),-.05,0,g);c.rotation.z=s*.2;}return{face,looks:left?glass:tag};};
  link={material:m.glow,radius:.035};
  animated.push((f,time)=>{glass.idle.emissiveIntensity=.3+.12*Math.sin(time*2.4);});
 }else if(type==='halves'){
  // Split logs over a murky stream: each sentence half is a log end; matched halves are pinned together.
  const water=liquidMaterial(new T.Color(k.p.water).lerp(new T.Color(k.p.moss),.45).getStyle(),{local:true,halfWidth:3.2,halfLength:1.1});k.materials.push(water);const stream=mesh(new T.BoxGeometry(6.4,.04,2.2),water,0,0,1.55,object);stream.castShadow=false;
  for(let i=0;i<9;i++){const l=mesh(rockLump(i%5+1),i%3?m.stone:m.moss,-3+i*.75,.2,.3+(i%2)*.15,object);l.scale.set(.42,.36,.34);}
  const bark=looks(mat(new T.Color(k.p.wood).multiplyScalar(.85).getStyle()),'#e2b86e',k.p.glow),ring=mat(new T.Color(k.p.wood).lerp(new T.Color('#f0d9a8'),.55).getStyle()),rings=mat(new T.Color(k.p.wood).multiplyScalar(.6).getStyle());
  piece=(e,g)=>{const left=e.action==='pair-left',s=left?1:-1,face=mesh(box(e.w,e.h,.4,.18),bark.idle,0,0,0,g);const cap=mesh(geo('endgrain',()=>{const c=new T.CylinderGeometry(.5,.5,.06,16);c.rotateZ(Math.PI/2);return c;}),ring,s*(e.w/2+.02),0,0,g);cap.scale.set(1,e.h*.88,.42/.5*.9);for(const r of[.3,.18]){const t=mesh(geo('grain'+r,()=>{const q=new T.TorusGeometry(r,.012,4,20);q.rotateY(Math.PI/2);return q;}),rings,s*(e.w/2+.06),0,0,g);t.scale.set(1,e.h*.88/1,.8);}return{face,looks:bark};};
  link={material:mat(new T.Color(k.p.wood).multiplyScalar(.6).getStyle()),radius:.07};

 }else if(type==='qa-pairs'){
  // Message birds: questions and answers are scrolls hanging from a branch where birds perch; each match sends a bird off.
  const bark=mat(new T.Color(k.p.wood).multiplyScalar(.75).getStyle());tube([[-3.1,H-.5,-.35],[-1.5,H-.2,-.3],[0,H-.35,-.35],[1.5,H-.15,-.3],[3.1,H-.45,-.35]],.11,bark,object,18);for(const s of[-1,1])mesh(cyl(.13,.18,H-.4,8),m.wood,s*3.05,(H-.4)/2,-.35,object);
  for(const e of pieces){const r=k.rod(m.ink,.01,object);k.stretch(r,new T.Vector3(e.x+(e.x<0?-.6:.6),H-.3,-.3),new T.Vector3(e.x+(e.x<0?-.6:.6),e.y+e.h/2,-.05));}
  const colours=['#5f86b8','#c8783a','#7a9c4c','#b85f6a','#d6b04a','#8a6ab0'],perchY=Math.min(...pieces.map(e=>e.y-e.h/2))-.55;tube([[-3.1,perchY-.15,.05],[-1.5,perchY+.05,.1],[0,perchY-.05,.05],[1.5,perchY+.06,.1],[3.1,perchY-.12,.05]],.07,bark,object,18);const birds=colours.map((c,i)=>{const b=bird(k,c);b.position.set(-2.5+i*1.0,perchY+.04+Math.sin(i*1.3)*.04,.08);b.scale.setScalar(.95);object.add(b);return{b,i};});
  const scroll=looks(mat('#efe2c4'),'#f3d58c',k.p.glow);
  piece=(e,g)=>{const face=mesh(box(e.w,e.h*.86,.06,.02),scroll.idle,0,0,0,g);for(const y of[-1,1])mesh(geo('roll',()=>{const q=new T.CylinderGeometry(.075,.075,1,10);q.rotateZ(Math.PI/2);return q;}),scroll.idle,0,y*e.h*.45,.02,g).scale.set(e.w*1.04,1,1);return{face,looks:scroll};};
  link={material:mat('#b84a4a'),radius:.025};
  animated.push((f,time)=>{const gone=Math.round(f*birds.length);birds.forEach(q=>{const away=q.i<gone;q.b.visible=!away;q.b.userData.flap(time*3+q.i,.08);q.b.rotation.y=Math.sin(time*.7+q.i)*.4;});});
 }else if(type==='gap'){
  // Water wheel: a wheel turns beside a sluice; answers are paddles, and the wheel speeds up as the channel fills.
  const water=liquidMaterial(k.p.water,{local:true,halfWidth:3.2,halfLength:1.1});k.materials.push(water);const stream=mesh(new T.BoxGeometry(6.4,.04,2.2),water,0,0,1.55,object);stream.castShadow=false;
  for(const s of[-1,1])mesh(box(.42,H,.5,.06),m.stone,s*3.05,H/2,-.4,object);mesh(box(6.5,.3,.5,.06),m.dark,0,H-.15,-.4,object);
  const gate=new T.Group();object.add(gate);for(let i=0;i<9;i++)mesh(box(.1,1.4,.1,.02),m.dark,-2.4+i*.6,.7,-.6,gate);mesh(box(5.0,.12,.08,.02),m.dark,0,1.2,-.55,gate);
  const wheel=new T.Group();wheel.position.set(-3.55,1.4,.3);object.add(wheel);mesh(geo('rim',()=>{const q=new T.TorusGeometry(1.15,.07,6,28);q.rotateY(Math.PI/2);return q;}),m.wood,0,0,0,wheel);for(let i=0;i<6;i++){const sp=mesh(box(.08,2.25,.08,.02),m.wood,0,0,0,wheel);sp.rotation.x=i*Math.PI/6;}for(let i=0;i<8;i++){const a=i*Math.PI/4,p=mesh(box(.45,.06,.38,.015),m.wood,0,Math.cos(a)*1.18,Math.sin(a)*1.18,wheel);p.rotation.x=-a;}
  const paddle=looks(mat(new T.Color(k.p.wood).lerp(new T.Color('#e8cf9a'),.35).getStyle()),'#f0cf7a',k.p.glow);
  piece=(e,g)=>{const face=mesh(box(e.w,e.h,.14,.04),paddle.idle,0,0,0,g);for(const s of[-1,1])mesh(box(.08,e.h+.04,.16,.02),m.metal,s*(e.w/2-.22),0,.02,g);return{face,looks:paddle};};
  let angle=0;animated.push((f,time)=>{angle=time*(.4+f*1.8);wheel.rotation.x=angle;gate.position.y=-f*1.3;});
 }else if(type==='repair'){
  // Seal stone: a great round seal stands behind the words; its crack glows until the broken word is replaced.
  const crack=mat(k.p.glow,{emissive:k.p.glow,emissiveIntensity:1});for(const s of[-1,1])mesh(cyl(.3,.4,H,8),m.stone,s*3.1,H/2,-.5,object);
  const R=Math.min(3.0,H*.47),seal=new T.Group();seal.position.set(0,H*.5,-.55);object.add(seal);mesh(geo('seal'+R,()=>{const q=new T.CylinderGeometry(R,R,.4,40);q.rotateX(Math.PI/2);return q;}),m.stone,0,0,0,seal);mesh(geo('sealrim'+R,()=>new T.TorusGeometry(R-.08,.09,6,48)),m.dark,0,0,.21,seal);
  const lines=[[-.3,.9],[.2,.45],[-.15,0],[.25,-.45],[-.1,-.95]];for(let i=1;i<lines.length;i++){const a=lines[i-1],b=lines[i],len=Math.hypot(b[0]-a[0],b[1]-a[1])*R,c=mesh(box(.07,len,.02,.008),crack,(a[0]+b[0])/2*R,(a[1]+b[1])/2*R,.22,seal);c.rotation.z=Math.atan2(-(b[0]-a[0]),b[1]-a[1]);}
  const tile=looks(mat(new T.Color(k.p.stone).multiplyScalar(1.08).getStyle()),'#f0cf7a',k.p.glow);
  piece=(e,g)=>{const face=mesh(box(e.w,e.h,.16,.05),tile.idle,0,0,0,g);mesh(box(e.w+.08,e.h+.08,.08,.02),m.dark,0,0,-.06,g);return{face,looks:tile};};
  animated.push((f,time)=>{crack.emissiveIntensity=(1-f)*(.8+.3*Math.sin(time*3));seal.rotation.z=f*.25;});
 }else if(type==='answer'){
  // Woodland visitor: an owl waits beside the question; replies are leaf-cut plaques and it nods at each right answer.
  const{owl,head}=owlFigure(k);object.add(owl);owl.position.set(-3.2,0,.25);owl.scale.setScalar(.9);owl.rotation.y=.5;
  const plaque=looks(mat(new T.Color(k.p.petal).lerp(new T.Color(k.p.leaf),.15).getStyle()),'#f3d58c',k.p.glow);
  piece=(e,g)=>{const face=mesh(box(e.w,e.h,.12,Math.min(.25,e.h*.4)),plaque.idle,0,0,0,g);for(const s of[-1,1]){const l=mesh(geo('pleaf',()=>{const q=new T.SphereGeometry(.3,8,4);q.scale(1,.42,.12);return q;}),m.leaf,s*(e.w/2-.05),-e.h/2+.02,.06,g);l.rotation.z=s*-.5;}return{face,looks:plaque};};
  // The owl dips its head toward each new right answer and then looks around again.
  let seen=0,nod=0;animated.push((f,time)=>{if(f>seen+.01){seen=f;nod=1;}nod=Math.max(0,nod-.03);head.rotation.x=Math.sin(time*.9)*.05+Math.sin(nod*Math.PI)*.35;head.rotation.y=Math.sin(time*.45)*.2*(1-nod);});
 }else if(type==='sort'){
  // Supply carts: the word to sort sits on top; each category is a cart, filling with crates as words are sorted.
  const carts=pieces.filter(e=>e.action).map(e=>{const c=new T.Group();c.position.set(e.x,0,.35);object.add(c);mesh(box(2.2,.12,1.05,.03),m.wood,0,.62,0,c);for(const z of[-.5,.5])mesh(box(2.2,.42,.07,.02),m.wood,0,.86,z,c);for(const x of[-1,1])mesh(box(.07,.42,1.05,.02),m.wood,x*1.08,.86,0,c);for(const x of[-.65,.65])mesh(geo('cwheel',()=>{const q=new T.CylinderGeometry(.42,.42,.08,14);q.rotateX(Math.PI/2);return q;}),m.dark,x,.42,.58,c);mesh(box(.08,e.y-e.h/2-1.0,.08,.02),m.wood,0,(e.y-e.h/2+1.0)/2,-.4,c);return c;});
  const crates=[];carts.forEach((c,ci)=>{for(let i=0;i<3;i++){const it=mesh(i===1?geo('sack',()=>{const q=new T.SphereGeometry(.26,10,8);q.scale(1,.8,1);return q;}):box(.38,.34,.38,.04),i===1?mat('#c9b48a'):m.wood,(i-1)*.6,.9,0,c);it.visible=false;crates.push({it,n:ci*3+i});}});
  const sign=looks(mat('#efe2c4'),'#f3d58c',k.p.glow);
  piece=(e,g)=>{const face=mesh(box(e.w,e.h,.1,.03),sign.idle,0,0,0,g);mesh(box(e.w+.12,e.h+.12,.06,.02),m.wood,0,0,-.05,g);return{face,looks:sign};};
  animated.push(f=>{const n=Math.round(f*crates.length);crates.forEach(q=>q.it.visible=q.n<n);});
 }else if(type==='listen-word'){
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
