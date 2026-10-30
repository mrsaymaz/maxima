import * as T from './vendor/three.module.min.js';
import{mergeGeometries}from'./vendor/utils/BufferGeometryUtils.js';
import{ARENA_LOOKS}from'./arena-palette.js';
import{buildGuardianFigure}from'./guardian-figure.js';
import{localPoint}from'./traversal-layout.js';
import{LANES,laneSpan,hurdleHeight}from'./runner-course.js';

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
 stream(w,d,kit,anim){const g=new T.Group(),water=mat(kit.water||'#39c0d4',{rough:.1,emissive:'#0b6f8f',glow:.4}).clone();g.add(mesh(geo(`stream${w}x${d}`,()=>new T.BoxGeometry(w+.02,.06,d+.02)),water,0,.012));anim.push(t=>{water.emissiveIntensity=.3+.15*Math.sin(t*2.5);});return g;},
 chasm(w,d){const g=new T.Group();g.add(mesh(geo(`crim${w}x${d}`,()=>new T.BoxGeometry(w+.3,.06,d+.3)),mat('#d0794a',{flat:true}),0,.008),mesh(geo(`chasm${w}x${d}`,()=>new T.BoxGeometry(w,.07,d)),mat('#1a0f0a',{basic:true}),0,.014));
  for(let i=0;i<4;i++)g.add(mesh(geo('shard',()=>new T.ConeGeometry(.12,.3,4)),mat('#e9c68f',{flat:true}),(i%2?-1:1)*(w/2+.1),.1,(i<2?-1:1)*d/3));return g;},
 void(w,d,kit,anim){const g=new T.Group();g.add(mesh(geo(`vrim${w}x${d}`,()=>new T.BoxGeometry(w+.24,.05,d+.24)),mat('#c47dff',{basic:true}),0,.008),mesh(geo(`void${w}x${d}`,()=>new T.BoxGeometry(w,.06,d)),mat('#0d0620',{basic:true}),0,.014));
  for(let i=0;i<6;i++){const p=mesh(geo('mote',()=>new T.OctahedronGeometry(.05)),mat('#e6b8ff',{basic:true,additive:true}).clone(),((i*.43)%1-.5)*w*.8,0,((i*.71)%1-.5)*d*.8);g.add(p);anim.push(t=>{const k=(t*.5+i/6)%1;p.position.y=.05+k*1.1;p.material.opacity=1-k;});}return g;},
 swamp(w,d,kit,anim){const g=mire(w,d,anim,'#5fbf1f','#2f5a12','#e4ff6a',['#2f9a2a','#ffd84a'],'#d8ff3a');for(let i=0;i<6;i++){const x=(i%2?1:-1)*(w/2+.05),z=(i/5-.5)*d*.9,reed=mesh(geo('reed',()=>new T.CylinderGeometry(.015,.02,.7,4).translate(0,.35,0)),mat('#6b8f2a'),x,0,z);reed.add(mesh(geo('cattail',()=>new T.CylinderGeometry(.04,.04,.16,6)),mat('#6b3f1f'),0,.66,0));reed.rotation.z=(i%2?-1:1)*.15;g.add(reed);}return g;},
 quicksand(w,d,kit,anim){const g=mire(w,d,anim,'#f0a23a','#a8621c','#ffe7a3',null,'#ffdd55');const swirl=mesh(geo('swirl',()=>new T.TorusGeometry(.5,.03,4,28).rotateX(Math.PI/2)),mat('#8f5f2b'),0,.04,0);g.add(swirl);anim.push(t=>{swirl.rotation.y=t*1.5;swirl.scale.setScalar(.8+Math.sin(t*2)*.15);});return g;},
 glowmire(w,d,kit,anim){return mire(w,d,anim,'#1fd8c8','#0f4f5a','#b8fff4',null,'#7affea');},
};
// Swamps glow and bubble: a bright sludge surface that pulses, a neon outline that marks the edge from far away,
// rising bubbles and lily pads, so they read as "keep out" at sprint speed.
function mire(w,d,anim,top,edge,bubble,pads,outline){
 const g=new T.Group(),surface=mat(top,{rough:.3,emissive:top,glow:.35}).clone();surface.userData.surface='effect';
 g.add(mesh(geo(`mrim${w}x${d}`,()=>new T.BoxGeometry(w+.24,.05,d+.24)),mat(edge),0,0),mesh(geo(`mire${w}x${d}`,()=>new T.BoxGeometry(w,.06,d)),surface,0,.012));
 const line=mat(outline,{basic:true,additive:true,opacity:.95}).clone();
 for(const[x,z,lx,lz]of[[0,d/2+.1,w+.24,.07],[0,-d/2-.1,w+.24,.07],[w/2+.1,0,.07,d+.24],[-w/2-.1,0,.07,d+.24]])g.add(mesh(geo(`mline${lx}x${lz}`,()=>new T.BoxGeometry(lx,.04,lz)),line,x,.05,z));
 anim.push(t=>{surface.emissiveIntensity=.25+.25*Math.sin(t*3.2);line.opacity=.55+.4*Math.max(0,Math.sin(t*6));});
 for(let i=0;i<Math.min(lowDetail?3:10,Math.round(w*d*1.1));i++){const b=mesh(geo('bubble',()=>new T.SphereGeometry(.13,10,8)),mat(bubble,{rough:.15,emissive:bubble,glow:.5}),((i*.37)%1-.5)*w*.85,.06,((i*.59)%1-.5)*d*.85);g.add(b);anim.push(t=>{const k=(t*1.1+i*.31)%1;b.scale.setScalar(.25+k*1.2);b.position.y=.06+k*.12;b.visible=k<.9;});}
 if(pads)for(let i=0;i<Math.min(6,Math.round(w*d*.6));i++)g.add(mesh(geo('pad',()=>new T.CylinderGeometry(.18,.18,.02,12)),mat(pads[i%2]),((i*.53)%1-.5)*w*.8,.08,((i*.29)%1-.5)*d*.8));
 return g;
}

// A still obstacle becomes one mesh per material, so a busy course stays a handful of draw calls on phones.
function compact(group){
 group.updateMatrixWorld(true);const byMaterial=new Map();
 group.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);for(const k of Object.keys(g.attributes))if(!['position','normal','uv'].includes(k))g.deleteAttribute(k);if(!g.attributes.uv)return;const list=byMaterial.get(o.material)||[];list.push(g);byMaterial.set(o.material,list);});
 const out=new T.Group();for(const[material,list]of byMaterial){const merged=mergeGeometries(list,false);if(merged)out.add(new T.Mesh(merged,material));list.forEach(g=>g.dispose());}
 return out;
}
// The track: 24 m tiles of coloured lanes, a floor, neon edges, themed side walls and an arch, built along the
// run's track metres. Each frame the whole track is placed so track metre `s` sits where the run says
// (runner-control: the track slides under the creature, then the final metres are real), and only the stretch
// the creature can see (never past the real clearing) is drawn.
const TILE=24;
// Side walls carry bold repeating patterns and lights, and a backdrop row (trees, mesas, crystal spires) stands
// behind them: all of it slides with the track, so speed reads from every side, not only from the lanes.
const wallTextures=new Map();
function wallTexture(area){
 if(wallTextures.has(area))return wallTextures.get(area);const canvas=typeof document!=='undefined'?document.createElement('canvas'):null;let texture;
 if(canvas){canvas.width=128;canvas.height=128;const g=canvas.getContext('2d');
  if(area===0){g.fillStyle='#2f7d2c';g.fillRect(0,0,128,128);g.fillStyle='#4fae3a';g.fillRect(0,0,64,128);for(let i=0;i<14;i++){g.fillStyle=i%3?'#7fd04e':'#1f5a22';g.beginPath();g.arc((i*37)%128,(i*53)%128,9+(i%3)*4,0,Math.PI*2);g.fill();}
   for(let i=0;i<4;i++){g.fillStyle=['#ff6fa8','#ffe14d','#ffffff','#ff9a3c'][i];g.beginPath();g.arc(20+i*30,30+(i%2)*60,6,0,Math.PI*2);g.fill();}}
  else if(area===1){g.fillStyle='#e8c38a';g.fillRect(0,0,128,128);g.fillStyle='#d58a4e';g.fillRect(0,40,128,14);g.fillRect(0,96,128,8);g.fillStyle='#c4733d';g.fillRect(0,0,6,128);g.fillRect(64,0,6,128);
   g.fillStyle='#36c9d6';for(const x of[18,82])g.fillRect(x,64,26,22);g.fillStyle='#fff3c9';for(const x of[26,90])g.fillRect(x,70,10,10);}
  else{g.fillStyle='#2b2266';g.fillRect(0,0,128,128);g.strokeStyle='#5ff3ff';g.lineWidth=5;g.beginPath();g.moveTo(0,100);g.lineTo(40,60);g.lineTo(64,80);g.lineTo(128,20);g.stroke();g.strokeStyle='#c47dff';g.lineWidth=4;g.beginPath();g.moveTo(0,30);g.lineTo(50,10);g.lineTo(90,50);g.lineTo(128,40);g.stroke();
   g.fillStyle='#3d3290';g.fillRect(0,0,128,6);g.fillRect(62,0,4,128);}
  texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(TILE/2.2,1.8);}
 else texture=new T.Texture();
 wallTextures.set(area,texture);return texture;
}
function wallMaterial(area){const key='wall'+area;if(materials.has(key))return materials.get(key);const m=new T.MeshStandardMaterial({map:wallTexture(area),roughness:.85,emissive:area===2?'#3a2f8a':'#000000',emissiveIntensity:area===2?.4:0});m.userData.surface=area===2?'glass':area===0?'foliage':'stone';m.name='runner-wall-'+area;materials.set(key,m);return m;}
const WALLS={
 0(tile,kit,low){const g=new T.Group(),wall=wallMaterial(0);for(const side of[-1,1]){g.add(mesh(geo('wall0',()=>new T.BoxGeometry(.7,3.4,TILE)),wall,side*3.15,1.7,TILE/2));
   for(let z=1;z<TILE;z+=2.4)g.add(mesh(geo('hedgetop',()=>new T.IcosahedronGeometry(.6,0)),mat(kit.leafLight||kit.leaf,{flat:true}),side*3.15,3.4,z));
   for(let z=3;z<TILE;z+=6)g.add(mesh(geo('flowerlamp',()=>new T.SphereGeometry(.2,10,8)),mat('#ffe066',{emissive:'#ffb800',glow:1.2,rough:.3}),side*2.78,1.6,z));
   if(!low)for(let z=2;z<TILE;z+=4.8){const big=(z/4.8|0)%2;g.add(mesh(geo('btrunk',()=>new T.CylinderGeometry(.22,.32,4.5,7).translate(0,2.25,0)),mat(kit.bark),side*(5.2+big*1.6),0,z));g.add(mesh(geo('bcrown'+big,()=>new T.IcosahedronGeometry(1.7+big*.5,0)),mat(big?kit.leaf:(kit.leafLight||kit.leaf),{flat:true}),side*(5.2+big*1.6),4.8+big*.6,z));}}return g;},
 1(tile,kit,low){const g=new T.Group(),wall=wallMaterial(1);for(const side of[-1,1]){g.add(mesh(geo('wall1',()=>new T.BoxGeometry(.8,3.6,TILE)),wall,side*3.2,1.8,TILE/2));
   for(let z=0;z<TILE;z+=6){g.add(mesh(geo('sandpillar',()=>new T.CylinderGeometry(.42,.5,4.2,8).translate(0,2.1,0)),mat('#f1dcae',{flat:true}),side*3.25,0,z));g.add(mesh(geo('sconce',()=>new T.SphereGeometry(.18,10,8)),mat('#ff9a3c',{emissive:'#ff6a00',glow:1.3}),side*2.85,2.6,z+3));}
   if(!low)for(let z=1;z<TILE;z+=6){const h=5+((z*7)%3)*1.6;g.add(mesh(geo('mesa'+h,()=>new T.CylinderGeometry(1.3,1.8,h,6).translate(0,h/2,0)),mat(z%12<6?'#d98b4e':'#e9b779',{flat:true}),side*(6+((z*3)%2)*1.8),0,z));}}return g;},
 2(tile,kit,low){const g=new T.Group(),wall=wallMaterial(2);for(const side of[-1,1]){g.add(mesh(geo('wall2',()=>new T.BoxGeometry(.7,3.2,TILE)),wall,side*3.15,1.6,TILE/2));
   g.add(mesh(geo('cseam',()=>new T.BoxGeometry(.74,.08,TILE)),mat('#5ff3ff',{basic:true}),side*3.15,3.22,TILE/2));
   for(let z=1.5;z<TILE;z+=3)g.add(mesh(geo('cspike',()=>new T.ConeGeometry(.28,1.1,5).translate(0,.55,0)),mat(z%2?'#9f7bff':'#62f5ff',{emissive:z%2?'#7a4dff':'#22c8ff',glow:.7,flat:true}),side*3.15,3.2,z));
   if(!low)for(let z=2;z<TILE;z+=4){const h=4+((z*5)%4)*1.3;g.add(mesh(geo('spire'+h,()=>new T.ConeGeometry(.9,h,5).translate(0,h/2,0)),mat(z%8<4?'#5b44c9':'#2fb8d8',{emissive:z%8<4?'#3a1f9a':'#0f7f9f',glow:.5,flat:true}),side*(5.4+((z*3)%2)*1.5),0,z));}}return g;},
};
// Trial moments (see runner-course RUN_MOMENTS). `data` gives animations the live run (clock, trial state).
const MOMENTS={
 boulders(o,kit,anim,data){
  const g=new T.Group(),warn=LANES.map(()=>new T.MeshBasicMaterial({color:'#ffb020',transparent:true,opacity:0,depthWrite:false,toneMapped:false}));
  LANES.forEach((x,i)=>{const strip=mesh(geo('bwarn'+o.depth.toFixed(0),()=>new T.PlaneGeometry(1.2,o.depth).rotateX(-Math.PI/2)),warn[i],-x,.1,0);strip.renderOrder=3;g.add(strip);});
  const pool=Array.from({length:4},()=>{const b=mesh(geo('boulder',()=>new T.IcosahedronGeometry(.5,1)),mat(kit.rock,{flat:true,rough:.95}));b.visible=false;return b;});
  data.pools.push({o,pool});
  anim.push(()=>{const st=data.live&&data.runner.trials.get(o.id);LANES.forEach((x,i)=>{warn[i].opacity=st?.warn===i?.35+.3*Math.sin(data.runner.clock*14):0;});});
  return g;
 },
 wind(o,kit,anim,data){
  const g=new T.Group(),glow=new T.MeshBasicMaterial({color:'#9ff3ff',transparent:true,opacity:.35,depthWrite:false,toneMapped:false}),side=o.dir;
  const arrow=geo('windarrow',()=>{const sh=new T.Shape();sh.moveTo(-.5,-.28);sh.lineTo(.1,-.28);sh.lineTo(.1,-.5);sh.lineTo(.55,0);sh.lineTo(.1,.5);sh.lineTo(.1,.28);sh.lineTo(-.5,.28);sh.closePath();return new T.ShapeGeometry(sh).rotateX(-Math.PI/2);});
  for(let z=-o.depth/2+3;z<o.depth/2;z+=6)for(const x of LANES){const a=mesh(arrow,glow,-x,.1,z);a.rotation.y=side>0?Math.PI:0;a.renderOrder=3;g.add(a);}
  for(let z=-o.depth/2;z<o.depth/2;z+=9)for(const w of[-1,1]){const pole=mesh(geo('wpole',()=>new T.CylinderGeometry(.05,.06,3.4,6).translate(0,1.7,0)),mat('#e8e2d0'),w*2.75,0,z);const flag=mesh(geo('wflag',()=>new T.PlaneGeometry(.9,.45).translate(.45,0,0)),new T.MeshStandardMaterial({color:'#ff5b5b',side:T.DoubleSide}),0,3.1,0);flag.material.userData.surface='paper';pole.add(flag);g.add(pole);anim.push(t=>{flag.rotation.y=(side>0?Math.PI:0)+Math.sin(t*9+z)*.35;});}
  const streaks=Array.from({length:10},(_,i)=>{const m=mesh(geo('streak',()=>new T.PlaneGeometry(1.6,.05)),new T.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide,toneMapped:false}),0,.6+(i%4)*.5,0);g.add(m);return m;});
  anim.push(t=>{const st=data.live&&data.runner.trials.get(o.id);glow.opacity=st?.warning?.55+.4*Math.sin(t*18):st?.gust?.9:.3;const near=data.live?data.runner.s-o.s:0;
   streaks.forEach((m,i)=>{const k=(t*2.2+i*.13)%1;m.position.set(side*(-3+6*k)*-1,m.position.y,near+((i*7)%10)-3);m.material.opacity=st?.gust||st?.warning?.7*(1-Math.abs(k-.5)*2):0;});});
  return g;
 },
 stone(o,kit,anim,data){
  const g=new T.Group(),n=Math.max(2,Math.round(o.depth/1.6)),stones=[];
  for(let i=0;i<n;i++){const st=mesh(geo('stepstone',()=>new T.CylinderGeometry(.62,.7,.28,9)),mat(kit.rock,{flat:true}),((i*37)%3-1)*.1,.02,-o.depth/2+(i+.5)*o.depth/n);g.add(st);stones.push(st);}
  // Stones sink once the creature has passed them.
  anim.push(()=>{const behind=data.live&&data.runner.s>o.s+o.depth/2+1;for(const st of stones)st.position.y+=((behind?-.5:.02)-st.position.y)*.08;});
  return g;
 },
 crystal(o,kit,anim,data){
  const g=new T.Group(),glass=new T.MeshStandardMaterial({color:'#7ff0ff',emissive:'#36c8ff',emissiveIntensity:.6,transparent:true,opacity:.55,roughness:.1});glass.userData.surface='glass';
  const pane=mesh(geo('cpane',()=>new T.BoxGeometry(4.6,2.6,.25)),glass,0,1.3,0);g.add(pane);const shards=[];
  for(let i=0;i<9;i++){const h=1.2+((i*5)%4)*.45,c=mesh(geo('cshard'+h.toFixed(2),()=>new T.ConeGeometry(.32,h,5).translate(0,h/2,0)),mat(i%2?'#b48cff':'#62f5ff',{emissive:i%2?'#7a4dff':'#22c8ff',glow:.9,flat:true}),-2.2+i*.55,0,((i*3)%3-1)*.15);g.add(c);shards.push({c,vx:(i-4)*.6,vy:2.5+(i%3),vz:-1-(i%2)});}
  let broken=null;
  anim.push(t=>{if(!data.runner?.knocked?.has(o.id)){glass.emissiveIntensity=.45+.3*Math.sin(t*5);return;}broken??=t;const k=Math.min(1.5,t-broken);pane.visible=k<.05;
   for(const sh of shards){sh.c.position.x+=sh.vx*.016;sh.c.position.y=Math.max(-2,sh.vy*k-4.9*k*k);sh.c.position.z+=sh.vz*.016;sh.c.rotation.x=k*6;sh.c.visible=k<1.4;}});
  return g;
 },
 thorns(o,kit,anim,data){
  const g=new T.Group();
  LANES.forEach((x,lane)=>{const cluster=new T.Group();cluster.position.set(-x,0,0);
   for(let i=0;i<6;i++){const h=.7+((i*3)%3)*.18,c=mesh(geo('thorn'+h.toFixed(2),()=>new T.ConeGeometry(.12,h,5).translate(0,h/2,0)),mat(i%2?'#3f7a2a':'#6fae3a',{flat:true}),-.5+(i%3)*.5,0,(i<3?-.18:.18));c.rotation.z=((i*7)%5-2)*.12;cluster.add(c);}
   cluster.add(mesh(geo('thornbase',()=>new T.BoxGeometry(1.3,.12,.6)),mat('#5a3d22'),0,.06,0));
   const glow=mesh(geo('thornglow',()=>new T.PlaneGeometry(1.3,1.2).rotateX(-Math.PI/2)),new T.MeshBasicMaterial({color:'#7dff9a',transparent:true,opacity:0,depthWrite:false,toneMapped:false}),-x,.11,0);g.add(cluster,glow);
   anim.push(t=>{const r=data.runner,up=r?.thornUp?r.thornUp(o,lane,data.live?r.clock:t):true;cluster.position.y+=((up?0:-1.05)-cluster.position.y)*.25;glow.material.opacity=up?0:.45;});});
  return g;
 },
 // The guardian at its true size, riding ahead of the creature; its throws, stomps and bolts come down the lanes.
 guardian(o,kit,anim,data){
  const g=new T.Group(),fig=buildGuardianFigure(data.section.area||0);fig.boss.rotation.y=Math.PI;fig.boss.visible=false;data.pools.push({o,pool:[],guardian:fig});
  const warnMats=LANES.map(()=>new T.MeshBasicMaterial({color:'#ffb020',transparent:true,opacity:0,depthWrite:false,toneMapped:false})),warn=LANES.map((x,i)=>{const m=mesh(geo('gwarn',()=>new T.PlaneGeometry(1.2,30).rotateX(-Math.PI/2).translate(0,0,15)),warnMats[i],-x,.12,0);m.renderOrder=3;m.visible=false;return m;});
  const band=mesh(geo('gstompwarn',()=>new T.PlaneGeometry(5.4,.6).rotateX(-Math.PI/2)),new T.MeshBasicMaterial({color:'#ff5b3a',transparent:true,opacity:0,depthWrite:false,toneMapped:false}),0,.13,0);band.renderOrder=3;
  const energy=fig.materials.energy,boulders=Array.from({length:4},()=>mesh(geo('gboulder',()=>new T.IcosahedronGeometry(.55,1)),mat(kit.rock,{flat:true,rough:.95}))),bolts=Array.from({length:3},()=>mesh(geo('gbolt',()=>new T.SphereGeometry(.38,14,10)),new T.MeshBasicMaterial({color:energy.color,toneMapped:false}))),waves=Array.from({length:3},()=>mesh(geo('gwave',()=>new T.BoxGeometry(5.6,.32,.35)),new T.MeshBasicMaterial({color:'#ffd9a0',transparent:true,opacity:.85,toneMapped:false})));
  data.guardianParts={o,fig,warn,warnMats,band,boulders,bolts,waves};return g;
 },
 ledge(o,kit){
  const g=new T.Group(),top=o.depth-o.ramp,stone=mat(kit.masonry||'#d6c49a',{flat:true}),gold=mat('#ffd23f',{emissive:'#c98a00',glow:.5});
  const ramp=geo('ramp'+o.h,()=>{const sh=new T.Shape();sh.moveTo(0,0);sh.lineTo(o.ramp,0);sh.lineTo(o.ramp,o.h);sh.closePath();return new T.ExtrudeGeometry(sh,{depth:1.3,bevelEnabled:false}).rotateY(-Math.PI/2).translate(.65,0,0);});
  g.add(mesh(ramp,stone,0,0,-o.depth/2));
  g.add(mesh(geo(`ledge${top.toFixed(1)}`,()=>new T.BoxGeometry(1.3,o.h,top)),stone,0,o.h/2,-o.depth/2+o.ramp+top/2));
  for(const x of[-.66,.66])g.add(mesh(geo(`ledgetrim${top.toFixed(1)}`,()=>new T.BoxGeometry(.06,.08,top)),gold,x,o.h+.04,-o.depth/2+o.ramp+top/2));
  return g;
 },
};
const ICON_COLORS={magnet:'#ff5b5b',shield:'#3fb8ff',double:'#ffd23f',dash:'#b0ff4a'};
const iconTextures=new Map();
function powerTexture(kind){
 if(iconTextures.has(kind))return iconTextures.get(kind);const canvas=typeof document!=='undefined'?document.createElement('canvas'):null;let texture;
 if(canvas){canvas.width=canvas.height=128;const g=canvas.getContext('2d');g.beginPath();g.arc(64,64,58,0,Math.PI*2);g.fillStyle='#1b294f';g.fill();g.lineWidth=8;g.strokeStyle=ICON_COLORS[kind];g.stroke();g.lineCap='round';g.lineJoin='round';
  if(kind==='magnet'){g.lineWidth=18;g.strokeStyle='#ff5b5b';g.beginPath();g.arc(64,58,24,Math.PI,0,true);g.stroke();g.strokeStyle='#e8eef5';g.beginPath();g.moveTo(40,58);g.lineTo(40,84);g.moveTo(88,58);g.lineTo(88,84);g.stroke();}
  if(kind==='shield'){g.fillStyle='#3fb8ff';g.beginPath();g.moveTo(64,28);g.lineTo(94,40);g.quadraticCurveTo(92,82,64,100);g.quadraticCurveTo(36,82,34,40);g.closePath();g.fill();g.fillStyle='#bfe9ff';g.fillRect(58,44,12,40);}
  if(kind==='double'){g.fillStyle='#ffd23f';g.font='900 54px system-ui,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('×2',64,68);}
  if(kind==='dash'){g.fillStyle='#b0ff4a';g.beginPath();g.moveTo(72,24);g.lineTo(42,70);g.lineTo(62,70);g.lineTo(54,104);g.lineTo(88,54);g.lineTo(67,54);g.closePath();g.fill();}
  texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;}
 else texture=new T.Texture();
 iconTextures.set(kind,texture);return texture;
}
const wallCache=new Map();
// Low graphics keeps the patterned walls and lights but drops the backdrop row, half the arches and most bubbles.
function wallsFor(area,kit,low){const key=area+(low?':low':'');if(!wallCache.has(key))wallCache.set(key,compact((WALLS[area]||WALLS[0])(0,kit,low)));return wallCache.get(key);}
let lowDetail=false;
export function makeRunnerScenery(section,{creatureHeight=.65,low=false}={}){
 lowDetail=low;
 const run=section.run,root=new T.Group();root.name='runner-course';root.rotation.order='YXZ';if(!run)return root;
 const area=section.area||0,kit=(ARENA_LOOKS[area]||ARENA_LOOKS[0]).kit,neon=NEON[area]||NEON[0],anim=[],items=[];
 const at=(object,s,lateral,y=0)=>{object.position.set(-lateral,y,s);root.add(object);return object;};
 const laneMats=LANE_COLORS.map(color=>{const map=laneTexture(color).clone();map.needsUpdate=true;map.repeat.set(1,TILE/2.4);return Object.assign(new T.MeshBasicMaterial({map,color:'#ffffff',transparent:true,opacity:.62,depthWrite:false,toneMapped:false}),{userData:{surface:'effect'}});});
 const floor=mat(area===2?'#2a2357':area===1?'#cfae78':'#5c7a3a');
 const tiles=[],arches=[];
 for(let z=-TILE,i=0;z<run.length+2;z+=TILE,i++){
  const tile=new T.Group();
  tile.add(mesh(geo('floor',()=>new T.PlaneGeometry(5.9,TILE).rotateX(-Math.PI/2).translate(0,0,TILE/2)),floor,0,.06,0));
  LANES.forEach((x,k)=>{const lane=mesh(geo('lane',()=>new T.PlaneGeometry(1.32,TILE).rotateX(-Math.PI/2).translate(0,0,TILE/2)),laneMats[k],-x,.075,0);lane.renderOrder=1;tile.add(lane);});
  for(const x of[LANES[0]-.73,(LANES[0]+LANES[1])/2,(LANES[1]+LANES[2])/2,LANES[2]+.73]){const edge=mesh(geo('edge',()=>new T.PlaneGeometry(.07,TILE).rotateX(-Math.PI/2).translate(0,0,TILE/2)),mat(neon,{basic:true,additive:true,opacity:.9}),-x,.085,0);edge.renderOrder=2;tile.add(edge);}
  tile.add(wallsFor(area,kit,low).clone());
  if(!low||i%2===0){const arch=mesh(geo('arch',()=>new T.TorusGeometry(2.75,.07,6,40,Math.PI)),mat(i%2?LANE_COLORS[(i>>1)%3]:neon,{basic:true,additive:true,opacity:.85}).clone(),0,0,TILE/2);tile.add(arch);arches.push({arch,i});}
  at(tile,z,0);tiles.push({object:tile,from:z,to:z+TILE});
 }
 anim.push(t=>{for(const{arch,i}of arches)if(arch.parent.visible)arch.material.opacity=.35+.6*Math.max(0,Math.sin(t*5-i*.9));});
 const hurdle=hurdleHeight(creatureHeight)/.5,data={section,pools:[],runner:null,live:false};
 for(const o of run.obstacles){
  const span=laneSpan(o.lanes),width=+(span.max-span.min-.1).toFixed(2),center=(span.max+span.min)/2,moving=anim.length;let g;
  if(MOMENTS[o.type]){g=MOMENTS[o.type](o,kit,anim,data);if(['boulders','wind','thorns','crystal'].includes(o.type)){g.name=o.id;at(g,o.s,o.type==='crystal'||o.type==='thorns'||o.type==='wind'||o.type==='boulders'?0:center);items.push({object:g,from:o.s-o.depth/2-2,to:o.s+o.depth/2+2,id:o.id,moment:true});continue;}}
  else if(o.type==='barrier'){g=(JUMPS[o.style]||JUMPS.crates)(width,kit,anim);g.scale.set(1,hurdle,Math.min(1.6,hurdle));}
  else if(o.type==='bar')g=(SLIDES[o.style]||SLIDES.trunk)(width,Math.max(.55,creatureHeight*.62),kit,anim);
  else g=(GROUNDS[o.style]||GROUNDS.pit)(width,o.depth,kit,anim);
  // Holes and swamps lie on top of the lanes (y .09), or the track floor would hide them.
  if(anim.length===moving&&o.type!=='barrier')g=compact(g);g.name=o.id;at(g,o.s,center,o.type==='hole'||o.type==='swamp'?.09:0);items.push({object:g,from:o.s-o.depth,to:o.s+o.depth,id:o.id,style:o.style});
 }
 // Coins: one instanced mesh for the whole run; collected and out-of-view coins are scaled away.
 const coins=new T.InstancedMesh(geo('runcoin',()=>new T.CylinderGeometry(.22,.22,.05,18).rotateZ(Math.PI/2)),mat('#ffcc3a',{emissive:'#c98a00',glow:.55,rough:.3}),Math.max(1,run.coins.length));
 const rims=new T.InstancedMesh(geo('runcoinrim',()=>new T.TorusGeometry(.22,.035,6,20).rotateY(Math.PI/2)),mat('#b8730f',{rough:.4}),Math.max(1,run.coins.length));
 coins.name='runner-coins';coins.frustumCulled=rims.frustumCulled=false;root.add(coins,rims);
 const tokens=[];
 for(const t of run.word?.tokens||[]){const sprite=new T.Sprite(new T.SpriteMaterial({map:letterTexture(t.letter,run.word.language),transparent:true,depthWrite:false}));sprite.scale.set(.9,.9,1);sprite.name=t.id;sprite.raycast=()=>{};/* decoration: never picked */at(sprite,t.s,LANES[t.lane],1);tokens.push({object:sprite,from:t.s,to:t.s,id:t.id});}
 // Power-ups float above their lane until taken.
 const powers=[];for(const p of run.powerups||[]){const sprite=new T.Sprite(new T.SpriteMaterial({map:powerTexture(p.kind),transparent:true,depthWrite:false}));sprite.scale.set(1.05,1.05,1);sprite.name=p.id;sprite.raycast=()=>{};at(sprite,p.s,LANES[p.lane],1.15);powers.push({object:sprite,from:p.s,to:p.s,id:p.id});}
 for(const{pool}of data.pools)for(const b of pool)root.add(b);
 if(data.guardianParts){const gp=data.guardianParts;root.add(gp.fig.boss,gp.band,...gp.warn,...gp.boulders,...gp.bolts,...gp.waves);for(const m of[gp.band,...gp.boulders,...gp.bolts,...gp.waves])m.visible=false;}
 // userData is the very object the animations close over, so they see the live run each frame.
 Object.assign(data,{tiles,items,tokens,coins,rims,powers,runnerAnim:anim});root.userData=data;return root;
}
const dummy=new T.Object3D();
function updateGuardianParts(gp,runner,time){
 const st=runner?.trials.get(gp.o.id),show=!!st&&st.visible,f=gp.fig;f.boss.visible=show;
 if(show){const g=runner.s+st.dist;f.boss.position.set(0,st.rise,g);f.head.rotation.y=Math.sin(time*.8)*.12;f.torso.rotation.z=Math.sin(time*1.6)*.03;
  // Poses: one arm winds up to throw, both rise for a stomp, the core flares for a bolt.
  const pose=st.pose,k=pose?.k||0;f.arms.forEach(({arm,side})=>{const target=pose?.kind==='boulder'&&side===(pose.lane===0?1:-1)?-2.4*k:pose?.kind==='stomp'?-2.6*k:0;arm.rotation.x+=(target-arm.rotation.x)*.25;});
  f.animate?.(time);if(pose?.kind==='bolt')f.materials.energy.emissiveIntensity+=2.5*k;}
 const pose=show?st.pose:null;gp.warn.forEach((m,i)=>{const on=!!pose&&pose.kind!=='stomp'&&pose.lane===i;m.visible=on;if(on){m.position.z=runner.s+3;gp.warnMats[i].opacity=.3+.35*Math.abs(Math.sin(time*12));}});
 gp.band.visible=!!pose&&pose.kind==='stomp';if(gp.band.visible){gp.band.position.z=runner.s+st.dist-3;gp.band.material.opacity=.4+.4*Math.abs(Math.sin(time*12));}
 const flying=show||st?st.flying:[];let b=0,v=0;for(const p of flying||[]){const target=p.kind==='boulder'?gp.boulders[b++]:gp.bolts[v++];if(!target)continue;target.visible=true;target.position.set(-LANES[p.lane],p.y,p.s);target.rotation.x=-p.spin;}
 for(let i=b;i<gp.boulders.length;i++)gp.boulders[i].visible=false;for(let i=v;i<gp.bolts.length;i++)gp.bolts[i].visible=false;
 gp.waves.forEach((m,i)=>{const w=st?.waves[i];m.visible=!!w;if(w)m.position.set(0,.18,w.s);});
}
export function updateRunnerScenery(root,{time=0,runner=null,collected=null}={}){
 const data=root?.userData,section=data?.section,run=section?.run;if(!run)return;
 const live=runner?.running&&runner.section?.id===section.id,s=live?runner.s:run.length,origin=live?runner.origin():run.from-(run.length-run.real);
 const p=localPoint(section,origin,0);root.position.set(p.x,0,p.z);root.rotation.y=Math.atan2(section.forward.x,section.forward.z);
 // Visible: a little behind the creature up to the real end of the run (and at most ~95 m ahead).
 const behind=s-14,ahead=Math.min(run.length+1,s+95,run.to+1-origin),show=o=>o.to>=behind&&o.from<=ahead;
 // Pieces near the far edge rise out of the ground over their last 16 m, so the track grows into view.
 const rise=from=>-(Math.max(0,1-(ahead-from)/16)**2);
 for(const tile of data.tiles){tile.object.visible=show(tile);if(tile.object.visible)tile.object.position.y=rise(tile.from)*4.5;}
 const knocked=runner?.knocked,taken=runner?.taken;data.runner=runner;data.live=!!live;
 for(const{o,pool}of data.pools){const rolling=live?runner.trials.get(o.id)?.rolling||[]:[];pool.forEach((b,i)=>{const r=rolling[i];b.visible=!!r&&r.s<=ahead;if(r){b.position.set(-LANES[r.lane],.5,r.s);b.rotation.x=-r.spin;}});}
 if(data.guardianParts)updateGuardianParts(data.guardianParts,live?runner:null,time);
 for(const p of data.powers){p.object.visible=show(p)&&!taken?.has(p.id);if(p.object.visible)p.object.position.y=1.15+Math.sin(time*4+p.from)*.12;}
 for(const item of data.items){item.object.visible=show(item);if(!item.object.visible)continue;item.base??=item.object.position.y;if(knocked?.has(item.id)&&item.style==='stream'){if(!item.settled){item.settled=true;item.object.traverse(m=>{if(m.material){m.material=m.material.clone();m.material.color?.set('#9a8a66');if(m.material.emissive)m.material.emissiveIntensity=0;}});}}
  else if(knocked?.has(item.id)&&!item.moment&&item.style!=='stream'){item.object.rotation.x=Math.min(1.45,item.object.rotation.x+.12);item.sink=Math.max(-.8,(item.sink||0)-.015);}item.object.position.y=item.base+(item.sink||0)+rise(item.from)*2.5;}
 for(const token of data.tokens){token.object.visible=show(token)&&!taken?.has(token.id);if(token.object.visible)token.object.position.y=1+Math.sin(time*3+token.from)*.07;}
 run.coins.forEach((c,i)=>{const visible=c.s>=behind&&c.s<=ahead&&!taken?.has(c.id)&&!collected?.has?.(c.id);dummy.position.set(-c.lateral,c.y,c.s);dummy.rotation.set(0,time*3+i*.4,0);dummy.scale.setScalar(visible?1:0);dummy.updateMatrix();data.coins.setMatrixAt(i,dummy.matrix);data.rims.setMatrixAt(i,dummy.matrix);});
 data.coins.instanceMatrix.needsUpdate=data.rims.instanceMatrix.needsUpdate=true;
 for(const step of data.runnerAnim)step(time);
}
