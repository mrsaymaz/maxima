import * as T from './vendor/three.module.min.js';import{ease}from'./evolution-timeline.js';
const TAU=Math.PI*2;
function ribbonGeometry(n=48){const g=new T.BufferGeometry(),p=new Float32Array((n+1)*6),index=[];for(let i=0;i<n;i++){const j=i*2;index.push(j,j+1,j+2,j+1,j+3,j+2);}g.setAttribute('position',new T.BufferAttribute(p,3));g.setIndex(index);return g;}
function leafGeometry(){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([0,-.16,0,-.075,0,0,0,.18,0,0,-.16,0,0,.18,0,.075,0,0],3));g.computeVertexNormals();return g;}
export class EvolutionEffects{
 constructor(element,palette,height,size,{reduced=false}={}){this.element=element;this.h=height;this.s=size;this.reduced=reduced;this.root=new T.Group();this.root.name='evolution-'+element+'-choreography';this.object=new T.Object3D();this.up=new T.Vector3(0,1,0);this.delta=new T.Vector3();this.ribbons=[];this.floor=[];
  const material=(color,opacity=.5)=>new T.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,side:T.DoubleSide,toneMapped:false});this.primary=material(palette.color);this.accent=material(palette.accent);this.materials=[this.primary,this.accent];
  const inst=(geo,mat,n,name)=>{const m=new T.InstancedMesh(geo,mat,n);m.name=name;m.frustumCulled=false;this.root.add(m);return m;};
  const ribbon=n=>{for(let i=0;i<n;i++){const m=new T.Mesh(ribbonGeometry(),i%2?this.primary:this.accent);m.frustumCulled=false;m.name=element+'-flow-'+i;this.ribbons.push(m);this.root.add(m);}};
  if(element==='air'){ribbon(reduced?1:3);this.bits=inst(new T.OctahedronGeometry(.035,0),this.accent,reduced?8:40,'wind-feathers');}
  else if(element==='fire'){this.bits=inst(new T.OctahedronGeometry(.045,0),this.accent,reduced?8:48,'gathering-embers');this.flames=inst(new T.ConeGeometry(.09,.55,5),this.primary,reduced?3:10,'ignition-tongues');}
  else if(element==='nature'){this.bark=material('#91724c',.85);this.materials.push(this.bark);this.roots=inst(new T.CylinderGeometry(.024,.035,1,6),this.bark,reduced?24:72,'growing-vines');this.bits=inst(leafGeometry(),this.primary,reduced?12:36,'unfurling-leaves');}
  else{ribbon(reduced?1:3);this.bits=inst(new T.SphereGeometry(.045,6,4),this.accent,reduced?8:32,'rising-droplets');}
  if(element!=='fire')for(let i=0;i<2;i++){const m=new T.Mesh(new T.TorusGeometry(size*(.95+i*.22),.012,4,48,element==='air'?Math.PI*1.65:TAU),this.primary);m.rotation.x=Math.PI/2;m.position.y=.035+i*.015;m.name=element+'-ground-signature';this.root.add(m);this.floor.push(m);}
  this.root.userData={element,scenicOnly:true};
 }
 stamp(mesh,i,x,y,z,sx=1,sy=sx,sz=sx,rx=0,ry=0,rz=0){const o=this.object;o.position.set(x,y,z);o.rotation.set(rx,ry,rz);o.scale.set(sx,sy,sz);o.updateMatrix();mesh.setMatrixAt(i,o.matrix);}
 update(f){const t=this.reduced?0:f.time,s=this.s,h=this.h,fade=f.effects,burst=Math.max(0,f.time-f.score.swap),grow=ease((f.time-f.score.sparkEnd)/(f.score.transform-f.score.sparkEnd));this.root.visible=fade>.0001;if(!this.root.visible)return;
  this.primary.opacity=fade*(this.reduced?.18:.44);this.accent.opacity=fade*(this.reduced?.22:.62);if(this.bark)this.bark.opacity=fade*.85;
  this.floor.forEach((m,i)=>{m.rotation.z=this.element==='air'?t*(i?-.32:.25):0;m.scale.setScalar(this.element==='water'?1+.09*Math.sin(t*1.5+i):1+f.charge*.10);});
  if(this.element==='air'){
   this.ribbons.forEach((mesh,i)=>{const p=mesh.geometry.attributes.position,n=p.count/2-1;for(let j=0;j<=n;j++){const u=j/n,a=u*Math.PI*4-t*1.8+i*TAU/3,r=s*(.62+.24*Math.sin(u*Math.PI))*(1+f.clear*.7),y=f.lift+u*(h+.65)*(.35+.65*grow),w=s*(this.reduced?.012:.045)*Math.sin(u*Math.PI);for(let k=0;k<2;k++)p.setXYZ(j*2+k,Math.cos(a)*(r+(k?w:-w)),y,Math.sin(a)*(r+(k?w:-w)));}p.needsUpdate=true;});
   for(let i=0;i<this.bits.count;i++){const u=(i*.618+t*.12)%1,a=i*2.399+t*.6,r=s*(1.25-.55*grow)*(1+burst*.6);this.stamp(this.bits,i,Math.cos(a)*r,u*(h+.8),Math.sin(a)*r,1,.45,2.0,0,a,t*.8);}
  }else if(this.element==='fire'){
   for(let i=0;i<this.bits.count;i++){const u=(i*.618+t*.32)%1,a=i*2.399+t*.22,r=s*(1.18-.55*grow)+burst*.85,y=u*(h+.5)+burst*burst*.25;this.stamp(this.bits,i,Math.cos(a)*r,y,Math.sin(a)*r,.6+u*.5,1.4,.6,0,a,t*.6);}
   for(let i=0;i<this.flames.count;i++){const a=i/this.flames.count*TAU,r=s*(.7+burst*.8),flame=(.15+grow)*(1+Math.sin(t*4+i)*.12);this.stamp(this.flames,i,Math.cos(a)*r,.25+grow*.25,Math.sin(a)*r,s*.65,s*flame*1.8,s*.65,.1*Math.sin(a),a,-.1*Math.cos(a));}this.flames.instanceMatrix.needsUpdate=true;
  }else if(this.element==='nature'){
   const vines=this.reduced?2:6,segments=12;
   for(let v=0;v<vines;v++)for(let j=0;j<segments;j++){const u0=Math.min(grow,j/segments),u1=Math.min(grow,(j+1)/segments),angle=v/vines*TAU-.25;const point=u=>{const a=angle+Math.sin(u*Math.PI)*.42,r=s*(.9+u*.18+f.clear*.7);return{x:Math.cos(a)*r,y:u*(h+.65),z:Math.sin(a)*r};},a=point(u0),b=point(u1),o=this.object;this.delta.set(b.x-a.x,b.y-a.y,b.z-a.z);const len=Math.max(.001,this.delta.length());o.position.set((a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2);o.scale.set(s,len,s);o.quaternion.setFromUnitVectors(this.up,this.delta.lengthSq()>1e-8?this.delta.normalize():this.up);o.updateMatrix();this.roots.setMatrixAt(v*segments+j,o.matrix);}this.roots.instanceMatrix.needsUpdate=true;
   for(let i=0;i<this.bits.count;i++){const u=(i+.5)/this.bits.count,a=(i%vines)/vines*TAU-.25+Math.sin(u*Math.PI)*.42,r=s*(.9+u*.18+f.clear*.7),open=ease((grow-u)*7);this.stamp(this.bits,i,Math.cos(a)*r,u*(h+.65),Math.sin(a)*r,s*open,s*open,s*open,0,-a+Math.PI/2,Math.sin(i)*.45);}
  }else{
   this.ribbons.forEach((mesh,i)=>{const p=mesh.geometry.attributes.position,n=p.count/2-1;for(let j=0;j<=n;j++){const u=j/n,a=i*TAU/3+u*2.0+.18*Math.sin(t*.75),r=s*(1.05+.12*Math.cos(u*Math.PI))*(1+f.clear*.65),y=Math.sin(u*Math.PI)*(h+.65)*(.4+.6*grow),w=s*(this.reduced?.013:.055)*Math.sin(u*Math.PI);for(let k=0;k<2;k++)p.setXYZ(j*2+k,Math.cos(a)*(r+(k?w:-w)),y,Math.sin(a)*(r+(k?w:-w)));}p.needsUpdate=true;});
   for(let i=0;i<this.bits.count;i++){const u=(i*.618+t*.20)%1,a=i*2.399+.12*Math.sin(t),r=s*(1.05+Math.sin(u*Math.PI)*.12)*(1+burst*.65);this.stamp(this.bits,i,Math.cos(a)*r,Math.sin(u*Math.PI)*(h+.7),Math.sin(a)*r,.65,1.3,.65,0,a,0);}
  }
  this.bits.instanceMatrix.needsUpdate=true;
 }
 dispose(){const geometries=new Set();this.root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);});geometries.forEach(g=>g.dispose());this.materials.forEach(m=>m.dispose());this.root.removeFromParent();}
}
