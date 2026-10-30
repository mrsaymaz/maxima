import * as T from './vendor/three.module.min.js';

// Small authored silhouettes for instancing: +Y up, base at y=0. Colours are
// neutral occlusion/light values, so a shared arena material supplies the hue.
// Each call owns its geometry; callers may cache one geometry per variant.
const TAU=Math.PI*2;
const seedOf=v=>Number.isFinite(v)?Math.trunc(v):0;
const noise=(v,a,b=0)=>{const q=Math.sin(v*17.317+a*73.19+b*31.77)*43758.5453;return q-Math.floor(q);};
class Sculpture{
 constructor(){this.positions=[];this.colors=[];}
 tri(a,b,c,shade=.9){
  const ab=new T.Vector3().fromArray(b).sub(new T.Vector3().fromArray(a)),ac=new T.Vector3().fromArray(c).sub(new T.Vector3().fromArray(a));
  if(ab.cross(ac).lengthSq()<1e-14)return;
  for(const p of[a,b,c]){this.positions.push(...p);const s=Math.max(.4,Math.min(1,shade));this.colors.push(s,s,s);}
 }
 quad(a,b,c,d,shade){this.tri(a,b,c,shade);this.tri(a,c,d,shade);}
 // Coordinates may run along any axis: orient the finished local-Y piece once.
 rings(rings,n,phase=0,shade=.9,transform=p=>p,caps=true){
  const rows=rings.map((r,j)=>Array.from({length:n},(_,i)=>{const a=i/n*TAU+phase,k=1+(r.jitter||0)*Math.sin(i*2.33+j*.53+phase);return transform([r.x+Math.cos(a)*r.r*k,r.y,r.z+Math.sin(a)*r.r*k]);}));
  for(let j=0;j<rows.length-1;j++)for(let i=0;i<n;i++)this.quad(rows[j][i],rows[j+1][i],rows[j+1][(i+1)%n],rows[j][(i+1)%n],shade*(.87+.09*j/(rows.length-1)+.04*Math.cos(i*1.1)));
  const lower=transform([rings[0].x,rings[0].y,rings[0].z]),upper=transform([rings.at(-1).x,rings.at(-1).y,rings.at(-1).z]);
  if(caps)for(let i=0;i<n;i++){this.tri(lower,rows[0][i],rows[0][(i+1)%n],shade*.65);this.tri(upper,rows.at(-1)[(i+1)%n],rows.at(-1)[i],shade);}
 }
 limb(a,b,r0,r1,n=7,shade=.86){
  const start=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(start),len=delta.length(),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());
  this.rings([{x:0,y:0,z:0,r:r0},{x:.035,y:len*.48,z:-.017,r:(r0+r1)*.52},{x:0,y:len,z:0,r:r1}],n,0,shade,p=>new T.Vector3(...p).applyQuaternion(q).add(start).toArray());
 }
 finish(name,variant,features){
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(this.positions,3));g.setAttribute('color',new T.Float32BufferAttribute(this.colors,3));g.computeVertexNormals();g.computeBoundingBox();
  // Ground all components together (thin roots/stems can otherwise dip below
  // the anchor). Dominant-face planar UVs preserve usable wood/stone grain.
  g.translate(0,-g.boundingBox.min.y,0);const p=g.attributes.position,n=g.attributes.normal,uv=[];
  for(let i=0;i<p.count;i++){const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),nz=Math.abs(n.getZ(i));if(ny>=nx&&ny>=nz)uv.push(p.getX(i),p.getZ(i));else if(nx>=nz)uv.push(p.getZ(i),p.getY(i));else uv.push(p.getX(i),p.getY(i));}
  g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeBoundingBox();g.computeBoundingSphere();g.name='maxima-'+name;g.userData={family:'environment-kit',asset:name,variant,baseY:0,vertexShade:'neutral-occlusion',features};return g;
 }
}

export function rockFormation(variant=0){
 const v=seedOf(variant),s=new Sculpture(),phase=noise(v,1)*TAU;
 const strata=[{y:0,r:.94},{y:.12,r:1.12},{y:.55,r:1.02},{y:.62,r:.87},{y:.95,r:.93},{y:1.08,r:.71},{y:1.46,r:.64},{y:1.58,r:.43}];
 s.rings(strata.map((r,j)=>({...r,y:r.y*(.93+noise(v,2)*.15),x:j*.033+Math.sin(v+1)*j*.014,z:-j*.025,r:r.r*(.94+noise(v,j+3)*.12),jitter:.10})),9,phase,.92);
 for(let i=0;i<2;i++){const a=phase+i*2.2,r=.32+noise(v,i+7)*.19,x=Math.cos(a)*.85,z=Math.sin(a)*.8;s.rings([{x,y:0,z,r:r*.86},{x:x+.04,y:.21,z,r},{x:x+.1,y:.42+noise(v,i+9)*.19,z:z-.04,r:r*.56}],7,a,.82);}
 return s.finish('rock-formation',v,['offset-strata','fractured-shelves','embedded-satellites']);
}

export function treeTrunk(variant=0){
 const v=seedOf(variant),s=new Sculpture(),bend=(noise(v,2)-.5)*.38,phase=noise(v,6)*TAU;
 s.rings([{x:0,y:0,z:0,r:.53},{x:.02,y:.23,z:0,r:.43},{x:-.05,y:.85,z:.04,r:.31},{x:bend,y:1.85,z:.05,r:.26},{x:bend+.15,y:2.68,z:-.08,r:.19},{x:bend+.27,y:3.52,z:-.12,r:.085}],9,phase,.86);
 // Triangular buttresses merge visually into a wide, stable rooted foot.
 for(let i=0;i<5;i++){const a=phase+i*TAU/5,r=.92+noise(v,i+12)*.22,w=.12,c=Math.cos(a),sn=Math.sin(a),l=[c*.24,0,sn*.24],r0=[c*1.03-sn*w,0,sn*1.03+c*w],r1=[c*1.03+sn*w,0,sn*1.03-c*w],t=[c*.28,.57+noise(v,i)*.12,sn*.28];s.tri(l,r0,t,.67);s.tri(t,r0,r1,.79);s.tri(t,r1,l,.72);s.limb([c*.56,.09,sn*.56],[c*r,.035,sn*r],.12,.025,5,.73);}
 for(let i=0;i<3;i++){const a=phase+i*2.18,join=[bend*.6,1.89+i*.39,.02],elbow=[Math.cos(a)*.65+bend,2.41+i*.31,Math.sin(a)*.62],tip=[Math.cos(a)*1.16+bend,2.94+i*.28,Math.sin(a)*1.03];s.limb(join,elbow,.17-i*.02,.11,7,.88);s.limb(elbow,tip,.11,.032,6,.88);}
 return s.finish('tree-trunk',v,['flared-foot','buttress-roots','crooked-leader','forked-boughs']);
}

export function treeCanopy(variant=0){
 const v=seedOf(variant),s=new Sculpture(),phase=noise(v,4)*TAU;
 // Five offset crowns overlap into a tiered, open-edged silhouette, rather than
 // one sphere. Underside rings are deeply shaded; shoulders catch the light.
 const lobes=[[0,0,0,1.43,1.47],[-.91,.23,.13,.99,1.2],[.85,.46,.18,1.05,1.23],[.13,.59,-.74,1.13,1.42],[.05,1.12,.07,1.03,1.32]];
 lobes.forEach(([x,y,z,r,h],i)=>{const vary=.94+noise(v,i+3)*.13,rot=phase+i*.71;s.rings([{x:x*.95,y:y+.02,z,r:r*.55},{x:x-.06,y:y+h*.20,z:z+.03,r:r*vary},{x:x+.06,y:y+h*.56,z:z-.07,r:r*.88*vary},{x:x+.14,y:y+h*.86,z:z-.09,r:r*.47},{x:x+.13,y:y+h,z:z-.09,r:r*.13}],8,rot,.81+i*.028);});
 return s.finish('tree-canopy',v,['five-offset-crowns','tiered-shoulders','shaded-undersides']);
}

function leaf(s,a,b,width,shade){
 const d=new T.Vector3(...b).sub(new T.Vector3(...a)),side=new T.Vector3(-d.z,0,d.x).normalize().multiplyScalar(width),mid=new T.Vector3(...a).lerp(new T.Vector3(...b),.48),ridge=mid.clone();ridge.y+=width*.3;
 const left=mid.clone().add(side),right=mid.clone().sub(side),av=new T.Vector3(...a),bv=new T.Vector3(...b);
 // Four upper and four reverse triangles give opaque folded leaves without a
 // DoubleSide material or overlapping coplanar cards.
 for(const [p,q,r]of[[av,left,ridge],[left,bv,ridge],[bv,right,ridge],[right,av,ridge]]){s.tri(p.toArray(),q.toArray(),r.toArray(),shade);const low=r.clone();low.y-=.018;s.tri(p.toArray(),low.toArray(),q.toArray(),shade*.73);}
}
export function fernCluster(variant=0){
 const v=seedOf(variant),s=new Sculpture(),phase=noise(v,1)*TAU;
 for(let f=0;f<5;f++){const a=phase+f*TAU/5,reach=.72+noise(v,f+2)*.24,height=.72+noise(v,f+13)*.28,c=Math.cos(a),sn=Math.sin(a),at=t=>[c*reach*t,height*Math.sin(t*Math.PI*.66),sn*reach*t];
  s.rings([0,.36,.7,1].map((t,i)=>{const p=at(t);return{x:p[0],y:p[1]+.015,z:p[2],r:[.024,.019,.012,.005][i]};}),3,a,.76);
  for(let j=1;j<=3;j++){const t=j/4,root=at(t),len=(1-t)*.31+.035;for(const side of[-1,1]){const tip=[root[0]+c*.12-sn*len*side,root[1]+.06,root[2]+sn*.12+c*len*side];leaf(s,root,tip,len*.22,.76+t*.19);}}
  const a0=at(.82),b0=at(1.08);leaf(s,a0,b0,.057,.94);
 }
 return s.finish('fern-cluster',v,['five-arching-fronds','paired-folded-leaflets','raised-midribs']);
}

export function fallenLog(variant=0){
 const v=seedOf(variant),s=new Sculpture(),length=2.85+noise(v,5)*.38,r=.32+noise(v,3)*.055,phase=noise(v,1)*TAU;
 // Cylinder local Y maps onto X. End rings form a pale broken rim around an
 // inset dark heart; narrow outer ridges retain the single-material batch.
 const orient=p=>[p[1]-length/2,r-p[0],p[2]];
 s.rings([{x:0,y:0,z:0,r:r*.86},{x:0,y:.10,z:0,r},{x:.025,y:length*.45,z:-.015,r:r*1.04},{x:0,y:length-.10,z:.01,r:r*.98},{x:0,y:length,z:0,r:r*.82}],10,phase,.73,orient,false);
 for(const end of[0,length]){const inset=end===0?.045:-.045,reverse=end===0,center=orient([0,end+inset,0]);
  for(let i=0;i<10;i++){const a=phase+i*TAU/10,b=phase+(i+1)*TAU/10,o=orient([Math.cos(a)*r*.82,end,Math.sin(a)*r*.82]),on=orient([Math.cos(b)*r*.82,end,Math.sin(b)*r*.82]),q=orient([Math.cos(a)*r*.64,end+inset,Math.sin(a)*r*.64]),qn=orient([Math.cos(b)*r*.64,end+inset,Math.sin(b)*r*.64]);
   if(reverse){s.quad(o,on,qn,q,.93);s.tri(center,q,qn,.76);}else{s.quad(o,q,qn,on,.93);s.tri(center,qn,q,.76);}
  }
 }
 for(let i=0;i<5;i++){const a=phase+i*TAU/5,x=Math.cos(a)*r*.95,z=Math.sin(a)*r*.95;s.limb([-.99,x+r,z],[1.0,x+r+.015,z],.025,.018,4,.59+noise(v,i)*.13);}
 s.limb([-.37,r*1.45,.08],[-.54,r*2.3,.23],.11,.045,6,.77);
 return s.finish('fallen-log',v,['fluted-bark','inset-end-grain','broken-branch']);
}

// A chamfered irregular block, with a knocked-off upper corner. Faces are wound
// around their centroid to keep culling reliable on either side of the path.
function wornBlock(s,x,y,z,w,h,d,phase,shade){
 const b=.075; // Explicit corner loops retain masonry planes.
 const corners=[[-w/2+b,-d/2],[w/2-b,-d/2],[w/2,-d/2+b],[w/2,d/2-b],[w/2-b,d/2],[-w/2+b,d/2],[-w/2,d/2-b],[-w/2,-d/2+b]];
 const loops=[{y:y,s:.92},{y:y+b,s:1},{y:y+h-b,s:1},{y:y+h,s:.86}].map((r,j)=>corners.map(([a,c],i)=>[x+a*r.s+(j>1?Math.sin(i*1.1+phase)*.025:0),r.y-(j===3&&i===2?.13:0),z+c*r.s]));
 for(let j=0;j<3;j++)for(let i=0;i<8;i++){const k=(i+1)%8;s.quad(loops[j][i],loops[j+1][i],loops[j+1][k],loops[j][k],shade*(j===0?.72:j===1?.86:.98));}
 for(let i=0;i<8;i++){s.tri([x,y,z],loops[0][i],loops[0][(i+1)%8],shade*.62);s.tri([x,y+h-.025,z],loops[3][(i+1)%8],loops[3][i],shade);}
}
export function masonryFragment(variant=0){
 const v=seedOf(variant),s=new Sculpture(),j=(noise(v,1)-.5)*.13;
 wornBlock(s,0,0,0,2.02,.24,.91,v,.87);
 wornBlock(s,-.49+j,.25,-.01,.92,.45,.73,v+1,.91);
 wornBlock(s,.46+j,.25,.02,.88,.43,.76,v+2,.85);
 wornBlock(s,-.13-j,.71,-.05,1.02,.44,.69,v+3,.94);
 wornBlock(s,-.31+j,1.16,-.045,.70,.19,.79,v+4,.98);
 wornBlock(s,.80,.03,.39,.34,.21,.31,v+5,.78);
 return s.finish('masonry-fragment',v,['staggered-courses','open-mortar-joints','chamfered-fractures','broken-coping']);
}
