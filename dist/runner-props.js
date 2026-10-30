import * as T from './vendor/three.module.min.js';
import{mergeGeometries}from'./vendor/utils/BufferGeometryUtils.js';
import{ARENA_LOOKS}from'./arena-palette.js';
import{localPoint}from'./traversal-layout.js';
import{LANES,laneSpan}from'./runner-course.js';

// What a runner section looks like. Three coloured lanes with neon edges and pulsing neon arches make the track
// read as a track; every obstacle has an arena look (logs, mushrooms, vines, lanterns, crystal lasers, swamps…)
// with simple bold shapes that read at speed on a phone. Rules live in runner-course/runner-control.
export const LANE_COLORS=['#2fe0ff','#ffd23f','#ff5bd1'];
export const NEON=['#8dff4a','#ffae3c','#c47dff'];
const geometries=new Map(),materials=new Map();
const geo=(key,make)=>{if(!geometries.has(key))geometries.set(key,make());return geometries.get(key);};
function mat(color,{emissive=null,glow=0,rough=.78,flat=false,opacity=1,additive=false,basic=false}={}){
 const key=[color,emissive,glow,rough,flat,opacity,additive,basic].join('|');if(materials.has(key))return materials.get(key);
 const options={color,transparent:opacity<1||additive,opacity,depthWrite:!(opacity<1||additive),blending:additive?T.AdditiveBlending:T.NormalBlending};
 const m=basic?new T.MeshBasicMaterial({...options,toneMapped:false}):new T.MeshStandardMaterial({...options,roughness:rough,flatShading:flat,emissive:emissive||'#000000',emissiveIntensity:glow});
 // Surface role for the shared material reading (stone-like props, glowing effects).
 m.userData.surface=basic||glow>.5?'effect':'stone';m.name='runner-'+color;materials.set(key,m);return m;
}
const mesh=(geometry,material,x=0,y=0,z=0)=>{const m=new T.Mesh(geometry,material);m.position.set(x,y,z);return m;};

// Lane surface: a bright lane colour with chevrons pointing up the track, scrolling toward the camera.
// (Canvas rows map to the far end last, so the chevron is drawn apex-down to point away from the camera.)
const laneTextures=new Map();
function laneTexture(color){
 if(laneTextures.has(color))return laneTextures.get(color);const canvas=typeof document!=='undefined'?document.createElement('canvas'):null;let texture;
 if(canvas){canvas.width=64;canvas.height=128;const g=canvas.getContext('2d');g.fillStyle=color;g.globalAlpha=.55;g.fillRect(0,0,64,128);g.globalAlpha=1;g.strokeStyle='#ffffff';g.lineWidth=9;g.lineCap='round';g.beginPath();g.moveTo(12,54);g.lineTo(32,80);g.lineTo(52,54);g.stroke();texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;}
 else texture=new T.Texture();
 laneTextures.set(color,texture);return texture;
}
const letterTextures=new Map();
function letterTexture(letter,language='en'){
 const key=language+':'+letter;if(letterTextures.has(key))return letterTextures.get(key);
 const size=128,canvas=typeof document!=='undefined'?document.createElement('canvas'):null;let texture;
 if(canvas){canvas.width=canvas.height=size;const g=canvas.getContext('2d');g.beginPath();g.arc(64,64,58,0,Math.PI*2);g.fillStyle='#fff6d8';g.fill();g.lineWidth=8;g.strokeStyle='#e0a93a';g.stroke();
  g.fillStyle='#1b294f';g.font='800 76px system-ui,-apple-system,"Segoe UI",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(letter.toLocaleUpperCase(language),64,70);texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;}
 else texture=new T.Texture();
 letterTextures.set(key,texture);return texture;
}

// Builders take the obstacle width across its lanes and return a group centred on the obstacle; `anim` collects
// per-frame motion (rolling, bobbing, spinning, pulsing, bubbling).
const JUMPS={
 log(w,kit,anim){const g=new T.Group(),log=mesh(geo('log'+w,()=>new T.CylinderGeometry(.24,.24,w,14).rotateZ(Math.PI/2)),mat(kit.bark,{rough:.9}),0,.25);g.add(log);
  for(const x of[-w/2,w/2])g.add(mesh(geo('logend',()=>new T.CylinderGeometry(.245,.245,.03,14).rotateZ(Math.PI/2)),mat('#d9b07a'),x,.25));
  for(let i=0;i<Math.round(w/.6);i++)g.add(mesh(geo('moss',()=>new T.SphereGeometry(.1,8,6)),mat(kit.leafLight||'#8fcd4e'),-w/2+.3+i*.6,.47,(i%2?.06:-.05)));
  anim.push(t=>{log.rotation.x=Math.sin(t*2.2)*.25;});return g;},
 mushrooms(w,kit,anim){const g=new T.Group(),n=Math.max(2,Math.round(w/.42));
  for(let i=0;i<n;i++){const x=-w/2+w*(i+.5)/n,h=.22+(i%2)*.08,cap=mesh(geo('cap',()=>new T.SphereGeometry(.2,14,8,0,Math.PI*2,0,Math.PI/2)),mat(i%3===1?'#ffb02e':'#ff4b4b',{rough:.5}),x,h);
   g.add(mesh(geo('stem',()=>new T.CylinderGeometry(.07,.09,.3,8).translate(0,.15,0)),mat('#fff4e0'),x,0),cap);
   for(let d=0;d<2;d++)cap.add(mesh(geo('dot',()=>new T.SphereGeometry(.035,6,4)),mat('#ffffff'),Math.cos(d*2.1)*.11,.12,Math.sin(d*2.1)*.11));
   anim.push(t=>{const k=1+Math.sin(t*5+i)*.08;cap.scale.set(k,2-k,k);});}return g;},
 hedge(w,kit){const g=new T.Group(),n=Math.max(2,Math.round(w/.36));
  for(let i=0;i<n;i++){const x=-w/2+w*(i+.5)/n;g.add(mesh(geo('bush',()=>new T.IcosahedronGeometry(.24,1)),mat(kit.leaf,{flat:true}),x,.24));
   for(let k=0;k<3;k++)g.add(mesh(geo('thorn',()=>new T.ConeGeometry(.035,.14,5)),mat('#f3ead0'),x+Math.cos(k*2.2+i)*.18,.32+k*.06,Math.sin(k*2.2+i)*.18).rotateZ(Math.cos(k*2.2+i)*-.9));
   g.add(mesh(geo('berry',()=>new T.SphereGeometry(.045,6,4)),mat('#ff2f6d',{emissive:'#ff2f6d',glow:.4}),x+.1,.4,.14));}return g;},
 crates(w,kit){const g=new T.Group(),n=Math.max(1,Math.round(w/.5));
  for(let i=0;i<n;i++){const x=-w/2+w*(i+.5)/n,c=mesh(geo('crate',()=>new T.BoxGeometry(.46,.46,.46)),mat(kit.timber),x,.23);c.rotation.y=(i%2?.12:-.1);g.add(c);
   c.add(mesh(geo('rune',()=>new T.PlaneGeometry(.2,.2)),mat('#4ff0ff',{basic:true}),0,0,.235));c.add(mesh(geo('band',()=>new T.BoxGeometry(.48,.06,.48)),mat('#6d4a2c'),0,.12,0));}return g;},
 sandstone(w){const g=new T.Group();g.add(mesh(geo('ss'+w,()=>new T.BoxGeometry(w,.46,.42)),mat('#e9c68f',{flat:true}),0,.23));
  for(const y of[.12,.32])g.add(mesh(geo('ssband'+w,()=>new T.BoxGeometry(w+.02,.05,.44)),mat('#d0794a'),0,y));
  for(let i=0;i<Math.round(w/.5);i++)g.add(mesh(geo('sun',()=>new T.CircleGeometry(.07,10)),mat('#ffef9a',{basic:true}),-w/2+.25+i*.5,.22,.215));return g;},
 tumbleweed(w,kit,anim){const g=new T.Group(),n=Math.max(1,Math.round(w/.6));
  for(let i=0;i<n;i++){const ball=mesh(geo('tumble',()=>new T.IcosahedronGeometry(.24,1)),mat('#c79a5b',{flat:true,rough:1}),-w/2+w*(i+.5)/n,.25);
   const wire=mesh(geo('tumblewire',()=>new T.IcosahedronGeometry(.27,1)),new T.MeshBasicMaterial({color:'#8a5d2c',wireframe:true}));ball.add(wire);g.add(ball);
   anim.push(t=>{ball.position.y=.25+Math.abs(Math.sin(t*4+i*1.3))*.12;ball.rotation.x=t*3+i;});}return g;},
 crystals(w,kit,anim){const g=new T.Group(),n=Math.max(3,Math.round(w/.22)),glow=mat('#62f5ff',{emissive:'#38d9ff',glow:.9,rough:.2,flat:true}),alt=mat('#d48bff',{emissive:'#a85bff',glow:.9,rough:.2,flat:true});
  for(let i=0;i<n;i++){const h=.3+((i*7)%4)*.06,c=mesh(geo('cr'+h,()=>new T.ConeGeometry(.09,h,5).translate(0,h/2,0)),i%2?alt:glow,-w/2+w*(i+.5)/n,0,((i*5)%3-1)*.06);c.rotation.z=((i*3)%5-2)*.1;g.add(c);}
  anim.push(t=>{glow.emissiveIntensity=.6+Math.sin(t*4)*.35;alt.emissiveIntensity=.6+Math.cos(t*4)*.35;});return g;},
 slime(w,kit,anim){const g=new T.Group(),n=Math.max(1,Math.round(w/.5));
  for(let i=0;i<n;i++){const b=mesh(geo('slime',()=>new T.SphereGeometry(.24,16,10)),mat(i%2?'#ff7ad9':'#7dff9a',{rough:.15,opacity:.85,emissive:i%2?'#ff3fc0':'#2fff7a',glow:.25}),-w/2+w*(i+.5)/n,.2);g.add(b);
   b.add(mesh(geo('eye',()=>new T.SphereGeometry(.045,8,6)),mat('#1b294f'),-.07,.08,.2),mesh(geo('eye',()=>new T.SphereGeometry(.045,8,6)),mat('#1b294f'),.07,.08,.2));
   anim.push(t=>{const k=1+Math.sin(t*6+i*2)*.12;b.scale.set(k,2-k,k);b.position.y=.2*(2-k);});}return g;},
};
// Bars: the obstacle's underside sits at beamY (under the creature's shoulders); standing hits it, sliding passes.
function posts(g,w,height,material){for(const x of[-w/2-.12,w/2+.12])g.add(mesh(geo('post'+height.toFixed(2),()=>new T.CylinderGeometry(.09,.11,height,8).translate(0,height/2,0)),material,x,0));}
const SLIDES={
 vines(w,y,kit,anim){const g=new T.Group();posts(g,w,y+1,mat(kit.bark));g.add(mesh(geo('vbeam'+w,()=>new T.CylinderGeometry(.08,.08,w+.3,8).rotateZ(Math.PI/2)),mat(kit.bark),0,y+.95));
  const n=Math.round(w/.28);for(let i=0;i<n;i++){const x=-w/2+w*(i+.5)/n,len=.95-((i*7)%3)*.08,v=new T.Group();v.position.set(x,y+.95,0);v.add(mesh(geo('vine'+len.toFixed(2),()=>new T.CylinderGeometry(.018,.018,len,4).translate(0,-len/2,0)),mat(kit.leaf)));
   for(let k=0;k<2;k++)v.add(mesh(geo('vleaf',()=>new T.SphereGeometry(.05,6,4).scale(1,.5,1.4)),mat(k===2&&i%3===0?'#ff7ab8':kit.leafLight||kit.leaf),0,-len*(.45+k*.45),0));g.add(v);
   anim.push(t=>{v.rotation.x=Math.sin(t*2+i*.7)*.12;});}return g;},
 trunk(w,y,kit){const g=new T.Group();for(const x of[-w/2-.05,w/2+.05])g.add(mesh(geo('stump'+y.toFixed(2),()=>new T.CylinderGeometry(.22,.26,y,10).translate(0,y/2,0)),mat(kit.bark),x,0));
  g.add(mesh(geo('trunk'+w,()=>new T.CylinderGeometry(.27,.3,w+.7,12).rotateZ(Math.PI/2)),mat(kit.bark,{rough:.95}),0,y+.27));
  for(let i=0;i<4;i++)g.add(mesh(geo('tmoss',()=>new T.SphereGeometry(.11,8,6)),mat(kit.leafLight||kit.leaf),-w/2+i*w/3,y+.5,(i%2?.1:-.1)));return g;},
 spinner(w,y,kit,anim){const g=new T.Group();posts(g,w,y+.45,mat(kit.masonry));const rod=new T.Group();rod.position.y=y+.25;
  rod.add(mesh(geo('rod'+w,()=>new T.CylinderGeometry(.13,.13,w+.2,10).rotateZ(Math.PI/2)),mat('#e0563a',{rough:.5})));
  for(let i=0;i<Math.round(w/.45);i++)for(let k=0;k<3;k++){const a=k*Math.PI*2/3+i*.5,s=mesh(geo('spike',()=>new T.ConeGeometry(.05,.18,6)),mat('#fff1c2',{rough:.4}),-w/2+.2+i*.45,Math.cos(a)*.2,Math.sin(a)*.2);s.rotation.x=a;rod.add(s);}
  g.add(rod);anim.push(t=>{rod.rotation.x=t*5;});return g;},
 lanterns(w,y,kit,anim){const g=new T.Group();posts(g,w,y+.75,mat('#8a5d3a'));g.add(mesh(geo('rope'+w,()=>new T.CylinderGeometry(.02,.02,w+.3,4).rotateZ(Math.PI/2)),mat('#5a3d22'),0,y+.7));
  const n=Math.max(2,Math.round(w/.42));for(let i=0;i<n;i++){const l=new T.Group();l.position.set(-w/2+w*(i+.5)/n,y+.7,0);l.add(mesh(geo('lstring',()=>new T.CylinderGeometry(.008,.008,.3,3).translate(0,-.15,0)),mat('#5a3d22')));
   l.add(mesh(geo('lantern',()=>new T.SphereGeometry(.13,10,8).scale(1,1.25,1)),mat(['#ff9a3c','#ff4f6d','#ffd54a'][i%3],{emissive:['#ff7a1a','#ff2f55','#ffb800'][i%3],glow:1.1,rough:.4}),0,-.42,0));g.add(l);
   anim.push(t=>{l.rotation.z=Math.sin(t*2.4+i)*.15;});}return g;},
 banner(w,y,kit,anim){const g=new T.Group();posts(g,w,y+.8,mat('#f2e6c9'));g.add(mesh(geo('brope'+w,()=>new T.CylinderGeometry(.02,.02,w+.3,4).rotateZ(Math.PI/2)),mat('#6b4b2b'),0,y+.75));
  const n=Math.max(3,Math.round(w/.26)),colors=['#ff5b5b','#ffd23f','#3fd0ff','#7bff6b','#ff7ad9'];for(let i=0;i<n;i++){const f=mesh(geo('flag',()=>{const s=new T.Shape();s.moveTo(-.11,0);s.lineTo(.11,0);s.lineTo(0,-.62);s.closePath();return new T.ShapeGeometry(s);}),Object.assign(new T.MeshStandardMaterial({color:colors[i%5],side:T.DoubleSide,roughness:.7}),{userData:{surface:'paper'}}),-w/2+w*(i+.5)/n,y+.75,0);g.add(f);anim.push(t=>{f.rotation.x=Math.sin(t*3+i*.8)*.2;});}return g;},
 laser(w,y,kit,anim){const g=new T.Group();for(const x of[-w/2-.15,w/2+.15]){g.add(mesh(geo('pylon'+y.toFixed(2),()=>new T.CylinderGeometry(.1,.16,y+.35,6).translate(0,(y+.35)/2,0)),mat('#3b2f6b',{flat:true}),x,0));g.add(mesh(geo('pgem',()=>new T.OctahedronGeometry(.13)),mat('#d48bff',{emissive:'#b05cff',glow:1.2}),x,y+.45));}
  const beam=mesh(geo('lbeam'+w,()=>new T.BoxGeometry(w+.3,.07,.07)),mat('#ff4fd8',{basic:true,additive:true,opacity:.95}),0,y+.12),halo=mesh(geo('lhalo'+w,()=>new T.BoxGeometry(w+.3,.22,.22)),mat('#ff4fd8',{basic:true,additive:true,opacity:.25}),0,y+.12);
  g.add(beam,halo);anim.push(t=>{halo.scale.y=halo.scale.z=1+Math.sin(t*9)*.25;});return g;},
};
// Holes and swamps are flat inlays on the path. Holes drop the creature (a retry); swamps slow it to a wade.
const GROUNDS={
 pit(w,d,kit){const g=new T.Group();g.add(mesh(geo(`rim${w}x${d}`,()=>new T.BoxGeometry(w+.24,.05,d+.24)),mat('#ff9a2e',{emissive:'#ff6a00',glow:.6}),0,.008),mesh(geo(`pit${w}x${d}`,()=>new T.BoxGeometry(w,.06,d)),mat('#120b07',{basic:true}),0,.014));return g;},
 water(w,d,kit,anim){const g=new T.Group(),water=mesh(geo(`wat${w}x${d}`,()=>new T.BoxGeometry(w,.06,d)),mat(kit.water||'#39c0d4',{rough:.1,emissive:'#0b6f8f',glow:.35}),0,.012);g.add(mesh(geo(`wrim${w}x${d}`,()=>new T.BoxGeometry(w+.24,.05,d+.24)),mat('#effcff'),0,.008),water);
  for(let i=0;i<3;i++){const ripple=mesh(geo('ripple',()=>new T.RingGeometry(.12,.16,20).rotateX(-Math.PI/2)),mat('#ffffff',{basic:true,opacity:.6}).clone(),((i*.37)%1-.5)*w*.7,.05,((i*.61)%1-.5)*d*.6);g.add(ripple);anim.push(t=>{const k=(t*.7+i/3)%1;ripple.scale.setScalar(.5+k*3);ripple.material.opacity=.6*(1-k);});}return g;},
 chasm(w,d){const g=new T.Group();g.add(mesh(geo(`crim${w}x${d}`,()=>new T.BoxGeometry(w+.3,.06,d+.3)),mat('#d0794a',{flat:true}),0,.008),mesh(geo(`chasm${w}x${d}`,()=>new T.BoxGeometry(w,.07,d)),mat('#1a0f0a',{basic:true}),0,.014));
  for(let i=0;i<4;i++)g.add(mesh(geo('shard',()=>new T.ConeGeometry(.12,.3,4)),mat('#e9c68f',{flat:true}),(i%2?-1:1)*(w/2+.1),.1,(i<2?-1:1)*d/3));return g;},
 void(w,d,kit,anim){const g=new T.Group();g.add(mesh(geo(`vrim${w}x${d}`,()=>new T.BoxGeometry(w+.24,.05,d+.24)),mat('#c47dff',{basic:true}),0,.008),mesh(geo(`void${w}x${d}`,()=>new T.BoxGeometry(w,.06,d)),mat('#0d0620',{basic:true}),0,.014));
  for(let i=0;i<6;i++){const p=mesh(geo('mote',()=>new T.OctahedronGeometry(.05)),mat('#e6b8ff',{basic:true,additive:true}).clone(),((i*.43)%1-.5)*w*.8,0,((i*.71)%1-.5)*d*.8);g.add(p);anim.push(t=>{const k=(t*.5+i/6)%1;p.position.y=.05+k*1.1;p.material.opacity=1-k;});}return g;},
 swamp(w,d,kit,anim){const g=mire(w,d,anim,'#3a3416','#5a4a22','#b6e05a',['#4fc23a','#8be04e']);for(let i=0;i<6;i++){const x=(i%2?1:-1)*(w/2+.05),z=(i/5-.5)*d*.9,reed=mesh(geo('reed',()=>new T.CylinderGeometry(.015,.02,.7,4).translate(0,.35,0)),mat('#6b8f2a'),x,0,z);reed.add(mesh(geo('cattail',()=>new T.CylinderGeometry(.04,.04,.16,6)),mat('#6b3f1f'),0,.66,0));reed.rotation.z=(i%2?-1:1)*.15;g.add(reed);}return g;},
 quicksand(w,d,kit,anim){const g=mire(w,d,anim,'#d9a95e','#b9833f','#f4d08f',null);const swirl=mesh(geo('swirl',()=>new T.TorusGeometry(.5,.03,4,28).rotateX(Math.PI/2)),mat('#8f5f2b'),0,.04,0);g.add(swirl);anim.push(t=>{swirl.rotation.y=t*1.5;swirl.scale.setScalar(.8+Math.sin(t*2)*.15);});return g;},
 glowmire(w,d,kit,anim){return mire(w,d,anim,'#1d8f8a','#0f4f5a','#7affea',null,true);},
};
function mire(w,d,anim,top,edge,bubble,pads,glow=false){
 const g=new T.Group();g.add(mesh(geo(`mrim${w}x${d}`,()=>new T.BoxGeometry(w+.2,.04,d+.2)),mat(edge),0,.008),mesh(geo(`mire${w}x${d}`,()=>new T.BoxGeometry(w,.05,d)),mat(top,{rough:.35,emissive:glow?'#1fe0d0':'#000000',glow:glow?.45:0}),0,.016));
 for(let i=0;i<Math.min(8,Math.round(w*d*.9));i++){const b=mesh(geo('bubble',()=>new T.SphereGeometry(.1,8,6)),mat(bubble,{rough:.2,emissive:glow?bubble:'#000000',glow:glow?.8:0}),((i*.37)%1-.5)*w*.85,.04,((i*.59)%1-.5)*d*.85);g.add(b);anim.push(t=>{const k=(t*.9+i*.31)%1;b.scale.setScalar(.3+k*1.1);b.visible=k<.92;});}
 if(pads)for(let i=0;i<Math.min(5,Math.round(w*d*.5));i++)g.add(mesh(geo('pad',()=>new T.CylinderGeometry(.16,.16,.02,10)),mat(pads[i%2]),((i*.53)%1-.5)*w*.8,.05,((i*.29)%1-.5)*d*.8));
 return g;
}

// A still obstacle becomes one mesh per material, so a busy course stays a handful of draw calls on phones.
function compact(group){
 group.updateMatrixWorld(true);const byMaterial=new Map();
 group.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);for(const k of Object.keys(g.attributes))if(!['position','normal','uv'].includes(k))g.deleteAttribute(k);if(!g.attributes.uv)return;const list=byMaterial.get(o.material)||[];list.push(g);byMaterial.set(o.material,list);});
 const out=new T.Group();for(const[material,list]of byMaterial){const merged=mergeGeometries(list,false);if(merged)out.add(new T.Mesh(merged,material));list.forEach(g=>g.dispose());}
 return out;
}
export function makeRunnerScenery(section,{creatureHeight=.65}={}){
 const run=section.run,group=new T.Group();group.name='runner-course';if(!run)return group;
 const area=section.area||0,kit=(ARENA_LOOKS[area]||ARENA_LOOKS[0]).kit,neon=NEON[area]||NEON[0],yaw=Math.atan2(section.forward.x,section.forward.z),anim=[];
 const place=(object,s,lateral,y=0)=>{const p=localPoint(section,s,lateral);object.position.set(p.x,y,p.z);object.rotation.order='YXZ';object.rotation.y=yaw;group.add(object);return object;};
 // Lanes: a translucent colour per lane, neon edges outside and between them, and arches that pulse in sequence.
 const length=run.to-run.from,mid=(run.from+run.to)/2;
 const laneMats=LANE_COLORS.map(color=>{const map=laneTexture(color).clone();map.needsUpdate=true;map.repeat.set(1,length/2.4);return new T.MeshBasicMaterial({map,color:'#ffffff',transparent:true,opacity:.62,depthWrite:false,toneMapped:false});});
 LANES.forEach((x,i)=>place(mesh(geo('lane'+length.toFixed(1),()=>new T.PlaneGeometry(1.32,length).rotateX(-Math.PI/2)),laneMats[i]),mid,x,.04).renderOrder=1);
 anim.push(t=>{for(const m of laneMats)m.map.offset.y=-t*1.6;});
 for(const x of[LANES[0]-.73,(LANES[0]+LANES[1])/2,(LANES[1]+LANES[2])/2,LANES[2]+.73])place(mesh(geo('edge'+length.toFixed(1),()=>new T.PlaneGeometry(.07,length).rotateX(-Math.PI/2)),mat(neon,{basic:true,additive:true,opacity:.9})),mid,x,.05).renderOrder=2;
 const arches=[];for(let s=run.from+5,i=0;s<run.to-2;s+=13,i++){const color=i%2?LANE_COLORS[(i>>1)%3]:neon,arch=mesh(geo('arch',()=>new T.TorusGeometry(2.75,.06,6,40,Math.PI)),mat(color,{basic:true,additive:true,opacity:.85}));arch.material=arch.material.clone();place(arch,s,0,0);arches.push({arch,i});}
 anim.push(t=>{for(const{arch,i}of arches)arch.material.opacity=.35+.6*Math.max(0,Math.sin(t*5-i*.9));});
 for(const o of run.obstacles){
  const span=laneSpan(o.lanes),width=+(span.max-span.min-.1).toFixed(2),center=(span.max+span.min)/2,moving=anim.length;let g;
  if(o.type==='barrier')g=(JUMPS[o.style]||JUMPS.crates)(width,kit,anim);
  else if(o.type==='bar')g=(SLIDES[o.style]||SLIDES.trunk)(width,Math.max(.55,creatureHeight*.62),kit,anim);
  else g=(GROUNDS[o.style]||GROUNDS.pit)(width,o.depth,kit,anim);
  if(anim.length===moving)g=compact(g);g.name=o.id;place(g,o.s,center);
 }
 const tokens=new Map();
 for(const t of run.word?.tokens||[]){const sprite=new T.Sprite(new T.SpriteMaterial({map:letterTexture(t.letter,run.word.language),transparent:true,depthWrite:false}));sprite.scale.set(.82,.82,1);sprite.name=t.id;place(sprite,t.s,LANES[t.lane],.95);tokens.set(t.id,sprite);}
 const obstacles=new Map();for(const child of group.children)if(child.name.includes(':run:'))obstacles.set(child.name,child);
 Object.assign(group.userData,{runnerTokens:tokens,runnerObstacles:obstacles,runnerAnim:anim});return group;
}
export function updateRunnerScenery(group,{time=0,taken=new Set(),knocked=new Set()}={}){
 const data=group?.userData;if(!data?.runnerTokens)return;
 for(const step of data.runnerAnim||[])step(time);
 // A knocked hurdle or bar tips over and sinks out of the way.
 for(const[id,object]of data.runnerObstacles||[])if(knocked.has(id)){object.rotation.x=Math.min(1.45,object.rotation.x+.12);object.position.y=Math.max(-.8,object.position.y-.015);}
 for(const[id,sprite]of data.runnerTokens){sprite.visible=!taken.has(id);if(sprite.visible)sprite.position.y=.95+Math.sin(time*3+sprite.position.x)*.06;}
}
