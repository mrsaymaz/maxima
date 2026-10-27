import * as T from './vendor/three.module.min.js';
import{fbm3,chunkedInstances,chunkOf}from'./cliff-art.js';
import{chapterPath,TRAIL_WIDTH,CHAPTER_LENGTH}from'./trail-layout.js';
// Shared building blocks that make hand-placed props read as carved stone and worn wood instead of raw
// primitives: chamfered boxes, carved posts, irregular rock columns and animated water. Every shape keeps the
// bounding box (and, for platforms, the exact top height) of the primitive it replaces, so physics is unchanged.

export const WORLD_TIME={value:0};

function finish(positions){
 // Faces are wound outward from the shape's centre line, then flat shaded so chamfers catch the light.
 const lo=[1e9,1e9,1e9],hi=[-1e9,-1e9,-1e9];for(let i=0;i<positions.length;i++){lo[i%3]=Math.min(lo[i%3],positions[i]);hi[i%3]=Math.max(hi[i%3],positions[i]);}const centre=new T.Vector3((lo[0]+hi[0])/2,(lo[1]+hi[1])/2,(lo[2]+hi[2])/2);
 for(let i=0;i<positions.length;i+=9){const a=new T.Vector3(positions[i],positions[i+1],positions[i+2]),b=new T.Vector3(positions[i+3],positions[i+4],positions[i+5]),c=new T.Vector3(positions[i+6],positions[i+7],positions[i+8]),n=b.clone().sub(a).cross(c.clone().sub(a)),mid=a.add(b).add(c).multiplyScalar(1/3).sub(centre);if(n.dot(mid)<0)for(let k=0;k<3;k++){const t=positions[i+3+k];positions[i+3+k]=positions[i+6+k];positions[i+6+k]=t;}}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.computeVertexNormals();
 const uv=[];for(let i=0;i<positions.length;i+=3)uv.push(positions[i]+positions[i+2],positions[i+1]);geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));return geo;
}

// A box with chamfered edges and corners; the faces stay where BoxGeometry puts them.
export function bevelBox(w,h,d,bevel){
 const hx=w/2,hy=h/2,hz=d/2,b=Math.min(bevel??.05,Math.min(w,h,d)*.22);if(b<.004)return new T.BoxGeometry(w,h,d);
 const p=[],tri=(a,c,e)=>p.push(...a,...c,...e),quad=(a,c,e,f)=>{tri(a,c,e);tri(a,e,f);};
 const ix=hx-b,iy=hy-b,iz=hz-b;
 for(const s of[-1,1]){
  quad([s*hx,-iy,-iz],[s*hx,iy,-iz],[s*hx,iy,iz],[s*hx,-iy,iz]);
  quad([-ix,s*hy,-iz],[ix,s*hy,-iz],[ix,s*hy,iz],[-ix,s*hy,iz]);
  quad([-ix,-iy,s*hz],[ix,-iy,s*hz],[ix,iy,s*hz],[-ix,iy,s*hz]);
 }
 for(const sx of[-1,1])for(const sy of[-1,1]){quad([sx*hx,sy*iy,-iz],[sx*ix,sy*hy,-iz],[sx*ix,sy*hy,iz],[sx*hx,sy*iy,iz]);}
 for(const sx of[-1,1])for(const sz of[-1,1]){quad([sx*hx,-iy,sz*iz],[sx*ix,-iy,sz*hz],[sx*ix,iy,sz*hz],[sx*hx,iy,sz*iz]);}
 for(const sy of[-1,1])for(const sz of[-1,1]){quad([-ix,sy*iy,sz*hz],[-ix,sy*hy,sz*iz],[ix,sy*hy,sz*iz],[ix,sy*iy,sz*hz]);}
 for(const sx of[-1,1])for(const sy of[-1,1])for(const sz of[-1,1])tri([sx*hx,sy*iy,sz*iz],[sx*ix,sy*hy,sz*iz],[sx*ix,sy*iy,sz*hz]);
 return finish(p);
}

function ringShape(rings,n,jitter=()=>0){
 const p=[],pt=(j,i)=>{const r=rings[j],a=i/n*Math.PI*2,k=r.r*(1+jitter(i%n,j));return[Math.sin(a)*k,r.y,Math.cos(a)*k];};
 for(let j=0;j<rings.length-1;j++)for(let i=0;i<n;i++){const a=pt(j,i),b=pt(j,i+1),c=pt(j+1,i+1),d=pt(j+1,i);if(rings[j].r>1e-5)p.push(...a,...b,...c);if(rings[j+1].r>1e-5)p.push(...a,...c,...d);}
 return finish(p);
}
// A post or disc with chamfered rims (CylinderGeometry argument order).
export function carvedCylinder(top,bottom,h,n=8,bevel){
 const c=Math.min(bevel??.04,h*.28,Math.max(top,bottom)*.35),y=h/2;if(c<.004||h<.03)return new T.CylinderGeometry(top,bottom,h,n);
 const rings=[{y:-y,r:0}];if(bottom>c)rings.push({y:-y,r:bottom-c},{y:-y+c,r:bottom-c*.1});else rings.push({y:-y,r:bottom});
 if(top>c)rings.push({y:y-c,r:top-c*.1},{y,r:top-c});else rings.push({y,r:top});rings.push({y,r:0});
 return ringShape(rings,n);
}
// An irregular rock column whose flat top is exactly radius r at local y=0, widening into the ground below.
export function stoneColumn(r,depth,seed=1,n=13){
 const c=Math.min(.07,r*.15),rings=[{y:0,r:0},{y:0,r:r-c*.6},{y:-c,r:r*1.01},{y:-c-.2,r:r*1.04},{y:-depth*.55,r:r*1.07},{y:-depth,r:r*1.12},{y:-depth,r:0}];
 return ringShape(rings,n,(i,j)=>j<2||j>5?0:(fbm3(i*.9+seed*3.1,j*1.7,seed*.37)-.5)*.16);
}

// Animated surface for pools and lava (world-space ripples, shoreline foam, moving glints).
export function liquidMaterial(color,{lava=false,center={x:0,z:0},forward={x:0,z:-1},right={x:1,z:0},halfWidth=3,halfLength=3}={}){
 const material=new T.MeshStandardMaterial({color,roughness:lava?.7:.16,metalness:0,emissive:lava?'#ff6a2b':'#000000',emissiveIntensity:lava?.9:0});
 const u={uTime:WORLD_TIME,uCenter:{value:new T.Vector2(center.x,center.z)},uForward:{value:new T.Vector2(forward.x,forward.z)},uRight:{value:new T.Vector2(right.x,right.z)},uHalf:{value:new T.Vector2(halfWidth,halfLength)}};
 material.userData.liquid=u;material.userData.stylized='liquid';
 material.onBeforeCompile=shader=>{Object.assign(shader.uniforms,u);
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vLiquidWorld;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvLiquidWorld = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
varying vec3 vLiquidWorld;
uniform float uTime;
uniform vec2 uCenter, uForward, uRight, uHalf;
float liquidWave( vec2 p ) {
	return sin( p.x * 2.1 + uTime * 1.3 ) * 0.5 + sin( p.y * 1.7 - uTime * 1.1 + p.x * 0.6 ) * 0.5 + sin( ( p.x + p.y ) * 3.7 + uTime * 2.2 ) * 0.25;
}`).replace('#include <color_fragment>',`#include <color_fragment>
	vec2 liquidRel = vLiquidWorld.xz - uCenter;
	vec2 liquidLocal = vec2( dot( liquidRel, uRight ), dot( liquidRel, uForward ) );
	float liquidEdge = min( uHalf.x - abs( liquidLocal.x ), uHalf.y - abs( liquidLocal.y ) );
	float liquidW = liquidWave( liquidLocal );
	float liquidShore = 1.0 - smoothstep( 0.0, ${lava?'0.55':'0.42'}, liquidEdge + liquidW * 0.05 );
	float liquidBands = smoothstep( 0.55, 0.95, sin( liquidLocal.x * 5.0 + liquidW * 1.6 ) * sin( liquidLocal.y * 4.3 - uTime * 0.8 ) );
	${lava?`float liquidCrack = smoothstep( 0.25, 0.0, abs( sin( liquidLocal.x * 2.3 + liquidW * 0.9 ) * sin( liquidLocal.y * 1.9 - uTime * 0.35 + liquidW * 0.5 ) ) );
	float liquidHeat = max( liquidCrack, liquidShore * 0.8 );
	diffuseColor.rgb = mix( vec3( 0.16, 0.08, 0.07 ), diffuseColor.rgb * 0.8, liquidHeat );
	vec3 liquidGlow = mix( vec3( 0.55, 0.1, 0.02 ), vec3( 1.0, 0.62, 0.18 ), liquidHeat * liquidHeat ) * ( 0.15 + 1.1 * liquidHeat ) * ( 0.85 + 0.15 * sin( uTime * 2.0 + liquidW ) );`:`float liquidDepth = smoothstep( 0.0, 1.6, liquidEdge );
	diffuseColor.rgb = mix( diffuseColor.rgb * 1.18, diffuseColor.rgb * 0.62, liquidDepth );
	diffuseColor.rgb += vec3( 0.10, 0.13, 0.12 ) * liquidBands;
	diffuseColor.rgb = mix( diffuseColor.rgb, vec3( 0.93, 0.97, 0.95 ), liquidShore * ( 0.65 + 0.35 * sin( liquidLocal.y * 9.0 + uTime * 3.0 ) ) );`}`).replace('#include <normal_fragment_begin>',`#include <normal_fragment_begin>
	{
		vec2 lq = vec2( dot( vLiquidWorld.xz - uCenter, uRight ), dot( vLiquidWorld.xz - uCenter, uForward ) );
		float e = 0.05, h0 = liquidWave( lq );
		vec2 g = vec2( liquidWave( lq + vec2( e, 0.0 ) ) - h0, liquidWave( lq + vec2( 0.0, e ) ) - h0 ) / e;
		vec3 worldTilt = vec3( g.x * uRight.x + g.y * uForward.x, 0.0, g.x * uRight.y + g.y * uForward.y ) * ${lava?'0.04':'0.12'};
		normal = normalize( normal - ( viewMatrix * vec4( worldTilt, 0.0 ) ).xyz );
	}`);
  if(lava)shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n\ttotalEmissiveRadiance = liquidGlow;');
 };
 material.customProgramCacheKey=()=>'maxima-liquid-'+(lava?1:0);
 return material;
}

// A round, lumpy boulder that still reads as a ball when it rolls; vertex coloured with a mossy crown.
export function roundBoulderGeometry(seed=1,moss='#6f9a54'){
 const geo=new T.IcosahedronGeometry(1,2),p=geo.attributes.position,v=new T.Vector3(),colors=[],m=new T.Color(moss),c=new T.Color();
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);v.multiplyScalar(1+(fbm3(v.x*1.4+seed,v.y*1.4,v.z*1.4-seed)-.5)*.32);p.setXYZ(i,v.x,v.y,v.z);}
 const nn=[];for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).normalize();nn.push(v.x,v.y,v.z);}geo.setAttribute('normal',new T.Float32BufferAttribute(nn,3));for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const g=.74+fbm3(v.x*3.2,v.y*3.2,v.z*3.2)*.34,band=Math.sin(v.y*7+v.x*2)*.04;c.setRGB(g+band,g+band,g*.96+band);const up=Math.max(0,v.y-.45)/.55;if(up>0)c.lerp(m,Math.min(1,up*1.3));colors.push(c.r,c.g,c.b);}
 geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));return geo;
}
// An irregular rock lump (unit radius, flattened base) for shorelines, cave mouths and rubble.
const LUMPS=new Map();
export function rockLump(seed=1){if(!LUMPS.has(seed)){const geo=new T.IcosahedronGeometry(1,1),p=geo.attributes.position,v=new T.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);v.multiplyScalar(.74+fbm3(v.x*1.5+seed*1.7,v.y*1.5,v.z*1.5+seed)*.42);if(v.y<-.25)v.y=-.25+(v.y+.25)*.25;p.setXYZ(i,v.x,v.y,v.z);}geo.computeVertexNormals();LUMPS.set(seed,geo);}return LUMPS.get(seed);}

// Ground dressing along every trail edge: scattered pebbles, wildflower clusters and fern fans. Purely visual,
// small enough never to read as obstacles, and split into route chunks for culling.
function flowerGeometry(){
 const p=[],c=[],push=(v,col)=>{p.push(...v);for(let i=0;i<v.length/3;i++)c.push(...col);};
 for(let k=0;k<3;k++){const a=k*2.1,ox=Math.cos(a)*.07,oz=Math.sin(a)*.07,h=.16+k*.04;push([ox-.006,0,oz,ox+.006,0,oz,ox,h,oz],[.35,.5,.3]);
  for(let j=0;j<5;j++){const b=j/5*Math.PI*2+k;push([ox,h,oz,ox+Math.cos(b)*.045,h+.01,oz+Math.sin(b)*.045,ox+Math.cos(b+.6)*.045,h+.01,oz+Math.sin(b+.6)*.045],[1,1,1]);}
  push([ox-.012,h+.012,oz,ox+.012,h+.012,oz,ox,h+.02,oz+.012],[1.4,1.2,.4]);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.computeVertexNormals();return g;
}
function fernGeometry(){
 const p=[],c=[];for(let k=0;k<6;k++){const a=k/6*Math.PI*2,dx=Math.cos(a),dz=Math.sin(a),sx=-dz*.05,sz=dx*.05;const pts=[[0,0,0],[dx*.18+sx,.16,dz*.18+sz],[dx*.34,.2,dz*.34],[dx*.18-sx,.16,dz*.18-sz]];for(const[i,j,l]of[[0,1,2],[0,2,3]]){p.push(...pts[i],...pts[j],...pts[l]);c.push(.55,.6,.5,.9,.95,.85,1.1,1.1,1,.9,.95,.85,.55,.6,.5,1.1,1.1,1);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c.slice(0,p.length),3));g.computeVertexNormals();return g;
}
export function trailDressing(){
 let seed=811;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const pebbles=[],flowers=[],ferns=[];
 for(let c=0;c<5;c++)for(const side of['left','right']){const points=chapterPath(c,side);for(let k=1;k<points.length;k++){const a=points[k-1],b=points[k],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len;
  for(let d=.2;d<len;d+=.7){const at=(off)=>({x:a.x+dx*d/len+nx*off,z:a.z+dz*d/len+nz*off});if(Math.abs(a.x+dx*d/len)<2.4&&Math.abs(a.z+dz*d/len-(-c*CHAPTER_LENGTH+2))<6)continue;
   for(const edge of[-1,1]){const p=at(edge*(TRAIL_WIDTH-.6+rnd()*1.6));pebbles.push({...p,s:.03+rnd()*.06,r:rnd()*6,seed:rnd()});if(rnd()<.4){const q=at(edge*(TRAIL_WIDTH+.1+rnd()*1.4));flowers.push({...q,s:1.3+rnd()*.8,r:rnd()*6,hue:rnd()});}if(rnd()<.2){const q=at(edge*(TRAIL_WIDTH+.5+rnd()*1.6));ferns.push({...q,s:1.4+rnd()*1.4,r:rnd()*6});}}
   if(rnd()<.35){const p=at((rnd()-.5)*TRAIL_WIDTH*1.4);pebbles.push({...p,s:.02+rnd()*.035,r:rnd()*6,seed:rnd()});}}}}
 const group=new T.Group();group.name='trail-dressing';
 const stone=new T.MeshStandardMaterial({color:'#9b9583',roughness:.95,flatShading:true}),bloom=new T.MeshStandardMaterial({vertexColors:true,roughness:.8,side:T.DoubleSide}),fern=new T.MeshStandardMaterial({color:'#5b8a4c',vertexColors:true,roughness:.9,side:T.DoubleSide});
 stone.userData.stylized='pebble';bloom.userData.stylized='flower';fern.userData.stylized='fern';
 const petals=['#f4e2a1','#f0b6c8','#ffffff','#c9b8f2','#f6c27a'].map(h=>new T.Color(h));
 const add=list=>{for(const m of list){m.castShadow=false;group.add(m);}return list;};
 const pebble=new T.IcosahedronGeometry(1,0),pp=pebble.attributes.position;for(let i=0;i<pp.count;i++)pp.setY(i,Math.max(-.3,pp.getY(i)));pebble.computeVertexNormals();
 add(chunkedInstances(pebble,stone,pebbles,(o,v)=>{o.position.set(v.x,v.s*.15,v.z);o.rotation.set(v.seed,v.r,0);o.scale.set(v.s*1.2,v.s*.7,v.s);},'trail-pebbles'));
 const blooms=add(chunkedInstances(flowerGeometry(),bloom,flowers,(o,v)=>{o.position.set(v.x,0,v.z);o.rotation.set(0,v.r,0);o.scale.setScalar(v.s);},'trail-flowers'));
 for(const mesh of blooms){const list=flowers.filter(f=>mesh.name.endsWith('-'+chunkOf(f.z)));list.forEach((f,i)=>mesh.setColorAt(i,petals[Math.floor(f.hue*petals.length)]));}
 add(chunkedInstances(fernGeometry(),fern,ferns,(o,v)=>{o.position.set(v.x,0,v.z);o.rotation.set(0,v.r,0);o.scale.setScalar(v.s*.6);},'trail-ferns'));
 group.userData={pebbles:pebbles.length,flowers:flowers.length,ferns:ferns.length,materials:{stone,fern}};return group;
}
