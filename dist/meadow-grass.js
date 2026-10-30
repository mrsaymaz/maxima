import * as T from './vendor/three.module.min.js';
import{routeDistance,terrainTint}from'./valley-terrain.js';
import{composedHalfWidth}from'./expedition-composition.js';
import{assignSurface}from'./surface-materials.js';
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
const hash=(x,z)=>{let h=Math.imul(x|0,374761393)^Math.imul(z|0,668265263);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967295;};
// Sample the rendered triangles, so roots sit on the mesh rather than hovering
// between its vertices. This also avoids thousands of startup ray casts.
export function terrainSampler(chunks){return(x,z)=>{
 const g=chunks.find(g=>z>=g.userData.minZ-.001&&z<=g.userData.maxZ+.001);if(!g)return null;
 const p=g.attributes.position,dx=2,dz=(g.userData.maxZ-g.userData.minZ)/30,fx=(x+60)/dx,fz=(z-g.userData.minZ)/dz,ix=Math.max(0,Math.min(59,Math.floor(fx))),iz=Math.max(0,Math.min(29,Math.floor(fz))),u=fx-ix,v=fz-iz,a=iz*61+ix,b=a+1,d=a+61,e=d+1,A=p.getY(a),B=p.getY(b),D=p.getY(d),E=p.getY(e);
 if((ix+iz)%2)return u+v<=1?A*(1-u-v)+B*u+D*v:E*(u+v-1)+B*(1-v)+D*(1-u);
 return v>=u?A*(1-v)+D*(v-u)+E*u:A*(1-u)+E*v+B*(u-v);
};}
export function makeMeadowGrass(area,chunks){
 const root=new T.Group();root.name='valley-meadow';const sample=terrainSampler(chunks),groups=Array.from({length:12},()=>[]),p=[],c=[],tip=[];
 for(let i=0;i<6;i++){const a=i*2.399,w=.035+(i%2)*.012,h=.55+(i%3)*.12,x=Math.cos(a)*.11,z=Math.sin(a)*.11,rx=Math.cos(a)*w,rz=Math.sin(a)*w;for(const v of[[x-rx,0,z-rz,0],[x+rx,0,z+rz,0],[x+.10,h,z+.06,1]]){p.push(...v.slice(0,3));c.push(...(v[3]?[1.08,1.08,.99]:[.67,.72,.63]));tip.push(v[3]);}}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('color',new T.Float32BufferAttribute(c,3));geo.setAttribute('grassTip',new T.Float32BufferAttribute(tip,1));geo.computeVertexNormals();
 const material=new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:1,side:T.DoubleSide});assignSurface(material,'foliage');const u={uMeadowTime:{value:0},uMeadowMotion:{value:1},uMeadowPlayer:{value:new T.Vector2()},uMeadowQuiet:{value:0}};material.userData.stylized='meadow';material.userData.meadow=u;
 material.onBeforeCompile=shader=>{Object.assign(shader.uniforms,u);shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float grassTip; uniform float uMeadowTime; uniform float uMeadowMotion; uniform vec2 uMeadowPlayer; uniform float uMeadowQuiet;').replace('#include <begin_vertex>',`#include <begin_vertex>
 vec3 meadowRoot=(modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.)).xyz;
 float nearP=1.-smoothstep(.5,1.9,distance(meadowRoot.xz,uMeadowPlayer));
 transformed.y*=1.-nearP*.65;
 float quiet=1.-uMeadowQuiet*(1.-smoothstep(5.,13.,distance(meadowRoot.xz,uMeadowPlayer)))*.9;
 transformed.x+=sin(meadowRoot.x*.38+meadowRoot.z*.21+uMeadowTime*1.35)*.14*grassTip*uMeadowMotion*quiet;
 transformed.z+=cos(meadowRoot.z*.31+uMeadowTime)*.07*grassTip*uMeadowMotion*quiet;`);};material.customProgramCacheKey=()=>'maxima-meadow-v1';
 for(let iz=0;iz<665;iz++)for(let ix=0;ix<84;ix++){
  const x=-46+ix*1.1+(hash(ix+13,iz)-.5)*.9,z=29-iz*1.1+(hash(ix,iz+81)-.5)*.9,d=routeDistance(x,z),width=Math.max(3.2,composedHalfWidth(z)),clear=d-width;
  if(clear<.65||hash(ix+501,iz+61)>.88)continue;
  const y=sample(x,z);if(y===null||Math.abs(sample(x+.35,z)-y)>.75||Math.abs(sample(x,z+.35)-y)>.75)continue;
  const edge=smooth((clear-.65)/2),h=(.38+hash(ix+11,iz+9)*.62)*(.32+edge*.68),row={x,y:y-.015,z,h,turn:hash(ix+2,iz+33)*Math.PI*2,color:terrainTint(x,z,y,area)};
  groups[Math.max(0,Math.min(11,Math.floor((z+700)/(730/12))))].push(row);
 }
 const dummy=new T.Object3D();groups.forEach((rows,index)=>{if(!rows.length)return;for(let i=rows.length-1;i>0;i--){const j=Math.min(i,Math.floor(hash(i,index+91)*(i+1)));[rows[i],rows[j]]=[rows[j],rows[i]];}const m=new T.InstancedMesh(geo,material,rows.length);m.name='meadow-chunk-'+index;m.userData={total:rows.length,centerZ:-700+(index+.5)*730/12,taskTransparent:true,nonBlocking:true};rows.forEach((v,i)=>{dummy.position.set(v.x,v.y,v.z);dummy.rotation.set(0,v.turn,0);const spread=1.7+hash(i,index+51)*.4;dummy.scale.set(spread,v.h,spread);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);m.setColorAt(i,v.color);});m.computeBoundingSphere();m.castShadow=false;m.receiveShadow=false;root.add(m);});
 Object.defineProperty(root,'_meadow',{value:{uniforms:u,groups,material,geometry:geo},enumerable:false});root.userData={nonBlocking:true,clumps:groups.reduce((n,g)=>n+g.length,0),blades:6};return root;
}
export function updateMeadowGrass(root,{player={x:0,z:0},time=0,preset='balanced',reduced=false,strength=0}={}){const s=root?._meadow;if(!s)return;s.uniforms.uMeadowTime.value=time;s.uniforms.uMeadowMotion.value=reduced?0:preset==='low'?.4:1;s.uniforms.uMeadowPlayer.value.set(player.x,player.z);s.uniforms.uMeadowQuiet.value=strength;for(const m of root.children){m.visible=Math.abs(player.z-m.userData.centerZ)<(preset==='low'?72:110);m.count=Math.ceil(m.userData.total*(preset==='low'?.28:preset==='high'?1:.65));}}
