import * as T from './vendor/three.module.min.js';
import{ARENA_LOOKS}from'./arena-palette.js';
import{localPoint}from'./traversal-layout.js';
import{LANES,laneSpan}from'./runner-course.js';

// What a runner section looks like: hurdles to jump, bars to slide under, dark holes to dodge, and floating
// letter tokens for word runs. Shapes are simple and high-contrast so they read at speed on a phone.
const letterTextures=new Map();
function letterTexture(letter,language='en'){
 const key=language+':'+letter;if(letterTextures.has(key))return letterTextures.get(key);
 const size=128,canvas=typeof document!=='undefined'?document.createElement('canvas'):null;let texture;
 if(canvas){canvas.width=canvas.height=size;const g=canvas.getContext('2d');g.beginPath();g.arc(64,64,58,0,Math.PI*2);g.fillStyle='#fff6d8';g.fill();g.lineWidth=8;g.strokeStyle='#e0a93a';g.stroke();
  g.fillStyle='#1b294f';g.font='800 76px system-ui,-apple-system,"Segoe UI",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(letter.toLocaleUpperCase(language),64,70);texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;}
 else texture=new T.Texture();
 letterTextures.set(key,texture);return texture;
}
const yawOf=section=>Math.atan2(section.forward.x,section.forward.z);
export function makeRunnerScenery(section,{creatureHeight=.65}={}){
 const run=section.run,group=new T.Group();group.name='runner-course';if(!run)return group;
 const kit=(ARENA_LOOKS[section.area]||ARENA_LOOKS[0]).kit,yaw=yawOf(section);
 const mat=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.82,...extra});
 const timber=mat(kit.timber),stripe=mat('#f2b53a',{emissive:'#6b3c00',emissiveIntensity:.25}),post=mat(kit.masonry),pit=new T.MeshBasicMaterial({color:'#140d08',polygonOffset:true,polygonOffsetFactor:-2}),rim=mat(kit.damp,{polygonOffset:true,polygonOffsetFactor:-1});
 const place=(mesh,s,lateral,y=0)=>{const p=localPoint(section,s,lateral);mesh.position.set(p.x,y,p.z);mesh.rotation.order='YXZ';mesh.rotation.y=yaw;group.add(mesh);return mesh;};
 // Faint guides between the three lanes, so lane changes have something to aim at.
 const guide=new T.MeshBasicMaterial({color:'#fff3c4',transparent:true,opacity:.42,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3}),length=run.to-run.from;
 for(const lateral of[(LANES[0]+LANES[1])/2,(LANES[1]+LANES[2])/2]){const strip=new T.Mesh(new T.PlaneGeometry(.07,length).rotateX(-Math.PI/2),guide);strip.name='runner-lane-guide';place(strip,(run.from+run.to)/2,lateral,.045);}
 for(const o of run.obstacles){
  const span=laneSpan(o.lanes),width=span.max-span.min-.1,mid=(span.max+span.min)/2;
  if(o.type==='barrier'){
   const g=new T.Group();g.name=o.id;g.add(new T.Mesh(new T.BoxGeometry(width,.34,.28),timber).translateY(.21));g.add(new T.Mesh(new T.BoxGeometry(width,.1,.3),stripe).translateY(.43));
   for(const x of[-width/2+.1,width/2-.1])g.add(new T.Mesh(new T.BoxGeometry(.14,.5,.36),post).translateX(x).translateY(.25));place(g,o.s,mid);
  }else if(o.type==='bar'){
   // The beam sits under the creature's shoulders: standing hits it, sliding passes.
   const beamY=Math.max(.55,creatureHeight*.62),g=new T.Group();g.name=o.id;
   g.add(new T.Mesh(new T.BoxGeometry(width+.3,.22,.26),timber).translateY(beamY+.11));g.add(new T.Mesh(new T.BoxGeometry(width+.3,.07,.28),stripe).translateY(beamY+.02));
   for(const x of[-(width+.3)/2,(width+.3)/2])g.add(new T.Mesh(new T.BoxGeometry(.2,beamY+.4,.24),post).translateX(x).translateY((beamY+.4)/2));place(g,o.s,mid);
  }else if(o.type==='hole'){
   const g=new T.Group();g.name=o.id;g.add(new T.Mesh(new T.BoxGeometry(width+.2,.05,o.depth+.2),rim).translateY(.005));g.add(new T.Mesh(new T.BoxGeometry(width,.06,o.depth),pit).translateY(.012));place(g,o.s,mid);
  }
 }
 const obstacles=new Map();for(const child of group.children)if(child.name.includes(':run:'))obstacles.set(child.name,child);
 const tokens=new Map();
 for(const t of run.word?.tokens||[]){const sprite=new T.Sprite(new T.SpriteMaterial({map:letterTexture(t.letter,run.word.language),transparent:true,depthWrite:false}));sprite.scale.set(.82,.82,1);sprite.name=t.id;place(sprite,t.s,LANES[t.lane],.95);tokens.set(t.id,sprite);}
 group.userData.runnerTokens=tokens;group.userData.runnerObstacles=obstacles;return group;
}
export function updateRunnerScenery(group,{time=0,taken=new Set(),knocked=new Set()}={}){
 const tokens=group?.userData?.runnerTokens;if(!tokens)return;
 // A knocked hurdle or bar tips over and sinks out of the way.
 for(const[id,mesh]of group.userData.runnerObstacles||[])if(knocked.has(id)){mesh.rotation.x=Math.min(1.45,mesh.rotation.x+.12);mesh.position.y=Math.max(-.6,mesh.position.y-.012);}
 for(const[id,sprite]of tokens){sprite.visible=!taken.has(id);if(sprite.visible)sprite.position.y=.95+Math.sin(time*3+sprite.position.x)*.06;}
}
