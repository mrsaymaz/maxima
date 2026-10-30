import * as T from'./vendor/three.module.min.js';
import{bevelBox,carvedCylinder}from'./prop-art.js';
// Small shared geometry vocabulary; stone and timber use the existing arena kit.
export function sceneryGeometry(kind){let g;
 if(kind==='column')g=carvedCylinder(.85,1,1,8,.035);
 else if(kind==='arch')g=new T.TorusGeometry(1,.13,5,24,Math.PI);
 else if(kind==='ring')g=new T.TorusGeometry(1,.10,5,24);
 else if(kind==='shard')g=new T.OctahedronGeometry(1,0);
 else if(kind==='bell'){const p=[];for(let i=0;i<=7;i++){const t=i/7;p.push(new T.Vector2(.14+.65*t*t,1-t));}g=new T.LatheGeometry(p,10);}
 else if(kind==='pennant'){g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([0,0,0,0,1,0,.8,.84,.04,0,0,0,.8,.84,.04,.65,.15,.02,.8,.84,.04,0,1,0,0,0,0,.65,.15,.02,.8,.84,.04,0,0,0],3));g.computeVertexNormals();}
 else g=bevelBox(1,1,1,.055);
 if(g.index)g=g.toNonIndexed();g.computeBoundingBox();g.translate(0,-g.boundingBox.min.y,0);const a=g.attributes.position,n=g.attributes.normal,c=[],uv=[];for(let i=0;i<a.count;i++){const shade=.82+.12*Math.max(0,n.getY(i));c.push(shade,shade,shade);uv.push(Math.abs(n.getY(i))>.6?a.getX(i):a.getX(i)+a.getZ(i),Math.abs(n.getY(i))>.6?a.getZ(i):a.getY(i));}g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeBoundingBox();return g;
}
// Major landmarks are authored once per chapter. Whisperwood keeps its existing
// spring/aqueduct/oak landmarks; the other arenas get distinct physical scenes.
export function authorScenery(scene,{put,groundY}){const {area,chapter:c,focus}=scene,x=focus.x,z=focus.z,h=groundY(x,z),A=(kind,role,dx,y,dz,sx,sy,sz,feature,extra={})=>put(kind,role,x+dx,h+y,z+dz,sx,sy,sz,extra.turn||0,{feature:'scene-'+feature,solid:false,...extra}),column=(dx,height,dz=0,r=.42,role='masonry',feature='bearing')=>put('column',role,x+dx,groundY(x+dx,z+dz)-.08,z+dz,r,height,r,0,{feature:'scene-'+feature,solid:true}),rock=(dx,dz,sx,sy,sz,feature='footing')=>put('rock','rock',x+dx,groundY(x+dx,z+dz)-.14,z+dz,sx,sy,sz,c*.4,{feature:'scene-'+feature,solid:true});
 if(area===1){
  if(c===0){rock(0,0,3.4,1.6,4,'rooted-terrace');column(-1,7.0,0,.60,'bark','cloudroot-fork');column(1.2,8.6,-.3,.43,'bark','cloudroot-fork');A('arch','bark',0,5.2,0,2.9,2.3,.65,'cloudroot-arch');for(const s of[-1,1])A('canopy',s<0?'leaf':'leafLight',s*2.0,8.3,-.4,1.8,.8,1.6,'cloudroot-crown');A('masonry','masonry',0,.6,1.6,3.3,.8,1.8,'worn-terrace');}
  else if(c===1){for(const s of[-1,1])column(s*3.05,6.4,0,.55,'masonry','watercourse-pier');A('arch','masonry',0,6.0,0,3.05,3.4,.9,'sunlit-vault');A('box','masonry',0,9.5,-.4,6.7,.30,1.2,'watercourse-trough');for(const s of[-1,1])A('box','masonry',s*1.9,9.8,-.4,2.8,.32,.2,'broken-parapet');rock(0,1.4,2.7,1.3,2.4,'fallen-watercourse');A('masonry','masonry',-1.3,.25,3.0,1.1,.7,.9,'fallen-keystone',{turn:.65});}
  else if(c===2){for(const [dx,height,r]of[[-2.5,8.7,.4],[0,10.6,.5],[2.6,7.9,.36]]){column(dx,height,0,r,'masonry','bellwind-spire');A('box','timber',dx,height-.1,0,2.0,.16,.38,'bell-bearing');for(const y of[.2,3.1,6.0])A('column','rockTop',dx,y,0,r*1.24,.16,r*1.24,'bell-spire-collar');A('bell','metal',dx,height-1.0,.15,.48,.74,.48,'wind-bell');A('column','metal',dx,height-.4,.15,.035,.35,.035,'bell-hanger');A('column','metal',dx,height-1.05,.15,.065,.30,.065,'bell-clapper');A('pennant','leafLight',dx+.6,height-1.7,.22,.7,1.6,1,'bellwind-pennant',{flex:.08,detail:false});}rock(0,1.0,3,1.25,2,'bell-court');}
  else if(c===3){for(const [level,w]of[[0,3.3],[1,2.5],[2,1.6]]){A('box','masonry',0,.12+level*1.55,-level*.6,w*2,.45,2.1,'garden-terrace');for(const s of[-1,1]){column(s*w,3.0+level*1.3,-level*.6,.22,'timber','garden-bearing');A('fern','fern',s*w,3.15+level*1.3,-level*.6,1.0,1.35,1,'hanging-fronds',{flex:.08});}}A('arch','masonry',0,6.7,-1.5,2.6,2.3,.5,'garden-crown');}
  else{for(const s of[-1,1])column(s*8.5,5.3,0,.65,'masonry','crown-pier');A('arch','masonry',0,5.0,0,8.5,8.0,1.2,'crown-of-arches');A('arch','rockTop',0,6.2,-2.8,6.2,5.8,.6,'inner-crown');for(const s of[-1,1])A('pennant','leafLight',s*7.6,7.1,.2,.7,2.2,1,'crown-pennant',{flex:.06});}
 }else if(area===2){
  if(c===0){for(const s of[-1,1]){rock(s*2.8,0,1.4,2.3,2.4,'threshold-foot');A('shard','rock',s*2.5,.5,0,1.15,6.0,1.6,'basalt-sentinel',{roll:-s*.13});A('shard','rockTop',s*3.7,.2,1.1,.45,3.2,.8,'threshold-splinter',{roll:s*.08});}A('ring','metal',0,8.6,-.4,1.25,1.25,.6,'threshold-mark');}
  else if(c===1){for(const[dx,dz,height]of[[-2.4,0,5.6],[1.6,-.8,6.2],[3,1.5,3.2]]){rock(dx,dz,1.1,1.4,1.4,'glasswater-bed');A('shard','water',dx,.5,dz,.70,height,1.1,'glasswater-spire',{roll:dx*.035});}A('arch','rock',0,5.4,-1.8,3.6,3.3,.65,'glasswater-rift');}
  else if(c===2){rock(0,0,2.5,1.4,2.4,'echo-foundation');A('shard','rockTop',0,.7,0,1.2,5.4,1.3,'echo-spire');for(const[dx,y,r]of[[-1.1,7.5,1.2],[.6,8.9,.9]])A('ring','metal',dx,y,.7,r,r,.75,'echo-resonator',{roll:dx*.15});for(const s of[-1,1])A('shard','rock',s*3.2,.3,1.0,.6,3.5,1.0,'echo-flank',{roll:-s*.2});}
  else if(c===3){for(const s of[-1,1]){rock(s*3.0,-1,1.1,2.2,3,'reservoir-wall');A('shard','rockTop',s*2.7,.3,-1.6,.8,5.1,1.2,'reservoir-watchstone',{roll:-s*.08});}A('arch','masonry',0,6.5,-2.1,2.45,2.7,.65,'reservoir-lintel');}
  else{for(const s of[-1,1]){column(s*8.7,6.2,0,.55,'rockTop','refuge-bearing');A('shard','rock',s*8.7,5.7,0,.7,3.4,1.1,'refuge-spire',{roll:-s*.16});}A('arch','rockTop',0,6.0,0,8.7,7.3,1,'fractured-refuge-crown');A('ring','metal',0,11.7,-.2,1.7,1.7,.7,'refuge-resonator');}
 }
 // A restrained material trail leads from approach stands toward the reveal.
 // These fragments remain outside the full walkable union, on real terrain.
 for(const s of[-1,1])for(let i=0;i<3;i++){const px=s*(19.0+i*.65),pz=-c*132-18-i*1.7;put(area===2?'shard':'masonry',area===0?'rockTop':'masonry',px,groundY(px,pz)-.08,pz,.35+i*.10,area===2?.9+i*.4:.6,.6,c*.3,{solid:true,detail:false,feature:'scene-approach-traces'});}
}
