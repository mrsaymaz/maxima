import * as T from './vendor/three.module.min.js';
import{chapterPath,TRAIL_WIDTH,CHAPTER_LENGTH,END}from'./trail-layout.js';
// Stylised world look: soft two-tone lighting, silhouette rims, height-graded fog, textured ground with organic trail edges.
// Everything here is generated in code (no image downloads) and works without a DOM so tests can build the world.

let installed=false;
export function installStyleChunks(){
 if(installed)return;installed=true;const C=T.ShaderChunk;
 const lit='float dotNL = saturate( dot( geometryNormal, directLight.direction ) );';
 if(C.lights_physical_pars_fragment.includes(lit))C.lights_physical_pars_fragment=C.lights_physical_pars_fragment.replace(lit,`${lit}
	#ifndef MAXIMA_TOON
		#define MAXIMA_TOON 0.55
	#endif
	dotNL = mix( dotNL, smoothstep( 0.0, 0.2, dotNL ) * 0.82 + dotNL * 0.18, MAXIMA_TOON );`);
 // A rim on upright surfaces separates creatures, rocks and props from the ground; flat ground receives none.
 C.lights_fragment_end+=`
#if defined( STANDARD ) && !defined( MAXIMA_NO_RIM )
	{
		vec3 maximaUp = normalize( ( viewMatrix * vec4( 0.0, 1.0, 0.0, 0.0 ) ).xyz );
		float maximaFacing = saturate( dot( geometryNormal, geometryViewDir ) );
		float maximaRim = pow( 1.0 - maximaFacing, 3.0 ) * ( 1.0 - abs( dot( geometryNormal, maximaUp ) ) );
		reflectedLight.indirectDiffuse += material.diffuseColor * maximaRim * 0.55;
	}
#endif
`;
 C.fog_pars_vertex='#ifdef USE_FOG\n\tvarying float vFogDepth;\n\tvarying float vFogHeight;\n#endif';
 C.fog_vertex='#ifdef USE_FOG\n\tvFogDepth = - mvPosition.z;\n\tvFogHeight = ( transpose( mat3( viewMatrix ) ) * ( mvPosition.xyz - viewMatrix[ 3 ].xyz ) ).y;\n#endif';
 C.fog_pars_fragment=C.fog_pars_fragment.replace('varying float vFogDepth;','varying float vFogDepth;\n\tvarying float vFogHeight;');
 C.fog_fragment=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
		float fogReach = 150.0;
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
		float fogReach = fogFar;
	#endif
	fogFactor *= mix( 1.0, 0.5, smoothstep( 2.0, 28.0, vFogHeight ) );
	vec3 fogTint = mix( fogColor * vec3( 1.05, 1.01, 0.9 ), fogColor, smoothstep( 0.0, fogReach * 0.7, vFogDepth ) );
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogTint, fogFactor );
#endif`;
}
installStyleChunks();

// Periodic value noise so every generated texture tiles seamlessly.
function noiseField(size,period,seed){const lattice=new Float32Array(period*period);let n=seed>>>0||1;for(let i=0;i<lattice.length;i++){n=(Math.imul(n,1664525)+1013904223)>>>0;lattice[i]=n/4294967296;}const at=(x,y)=>lattice[((y%period+period)%period)*period+((x%period+period)%period)];return(px,py)=>{const fx=px/size*period,fy=py/size*period,x0=Math.floor(fx),y0=Math.floor(fy),tx=fx-x0,ty=fy-y0,sx=tx*tx*(3-2*tx),sy=ty*ty*(3-2*ty);return(at(x0,y0)*(1-sx)+at(x0+1,y0)*sx)*(1-sy)+(at(x0,y0+1)*(1-sx)+at(x0+1,y0+1)*sx)*sy;};}
function fbm(size,periods,seed){const layers=periods.map((p,i)=>noiseField(size,p,seed+i*977));return(x,y)=>{let v=0,a=1,total=0;for(const f of layers){v+=f(x,y)*a;total+=a;a*=.5;}return v/total;};}
function random(seed){let n=seed>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
function texture(data,size,format=T.RGBAFormat){const t=new T.DataTexture(data,size,size,format);t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=4;t.needsUpdate=true;return t;}

// Grass detail: RGB is a luminance/hue multiplier centred near 0.8, alpha carries a broad patchiness field.
export function grassDetail(size=128){
 const data=new Uint8ClampedArray(size*size*4),base=fbm(size,[8,16,32],11),patch=fbm(size,[2,4],29),rnd=random(5),lum=new Float32Array(size*size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++)lum[y*size+x]=.72+base(x,y)*.22;
 // Short blade strokes in light and dark, wrapped across the tile edges.
 for(let i=0;i<size*size/9;i++){const x=rnd()*size,y=rnd()*size,len=2+rnd()*4,angle=rnd()*Math.PI*2,shade=rnd()<.5?-.12:.1;for(let k=0;k<len;k++){const px=Math.floor(x+Math.cos(angle)*k+size)%size,py=Math.floor(y+Math.sin(angle)*k+size)%size;lum[py*size+px]+=shade*(1-k/len*.5);}}
 for(let i=0;i<size*size;i++){const x=i%size,y=Math.floor(i/size),l=Math.max(.45,Math.min(1,lum[i])),warm=(base(x+37,y+11)-.5)*.12;data[i*4]=255*Math.min(1,l*(1+warm));data[i*4+1]=255*l;data[i*4+2]=255*Math.min(1,l*(1-warm*.6));data[i*4+3]=255*patch(x,y);}
 return texture(data,size);
}
// Trail detail: packed earth with pebbles and darker grit; alpha drives the irregular grass edge.
export function dirtDetail(size=128){
 const data=new Uint8ClampedArray(size*size*4),base=fbm(size,[4,8,16,32],71),edge=fbm(size,[4,8,16],97),rnd=random(19),lum=new Float32Array(size*size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++)lum[y*size+x]=.74+(base(x,y)-.5)*.3;
 for(let i=0;i<size*size/60;i++){const cx=rnd()*size,cy=rnd()*size,r=.8+rnd()*2.2,bright=.12+rnd()*.12;for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const d=Math.hypot(dx,dy*1.2);if(d>r+1)continue;const px=Math.floor(cx+dx+size)%size,py=Math.floor(cy+dy+size)%size,k=py*size+px;lum[k]+=d<r?bright*(dy<0?1:.55):-.16;}}
 for(let i=0;i<size*size/14;i++){const k=Math.floor(rnd()*size*size);lum[k]-=.1+rnd()*.12;}
 for(let i=0;i<size*size;i++){const x=i%size,y=Math.floor(i/size),l=Math.max(.4,Math.min(1,lum[i]));data[i*4]=255*l;data[i*4+1]=255*l*.97;data[i*4+2]=255*l*.92;data[i*4+3]=255*edge(x,y);}
 return texture(data,size);
}

export const MASK_RECT={x:-48,z:END.z-24,width:96,depth:-(END.z-24)+18};
// Distance-based trail mask in world XZ, rasterised segment by segment.
export function trailMask(resolution=2.5){
 const w=Math.round(MASK_RECT.width*resolution),h=Math.round(MASK_RECT.depth*resolution),data=new Uint8Array(w*h),inner=TRAIL_WIDTH-1.25,outer=TRAIL_WIDTH+.7;
 const stamp=(minX,maxX,minZ,maxZ,distance)=>{const i0=Math.max(0,Math.floor((minX-outer-MASK_RECT.x)*resolution)),i1=Math.min(w-1,Math.ceil((maxX+outer-MASK_RECT.x)*resolution)),j0=Math.max(0,Math.floor((minZ-outer-MASK_RECT.z)*resolution)),j1=Math.min(h-1,Math.ceil((maxZ+outer-MASK_RECT.z)*resolution));for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const x=MASK_RECT.x+(i+.5)/resolution,z=MASK_RECT.z+(j+.5)/resolution,d=distance(x,z);if(d>=outer)continue;const t=Math.min(1,Math.max(0,(outer-d)/(outer-inner))),v=Math.round(255*t*t*(3-2*t)),k=j*w+i;if(v>data[k])data[k]=v;}};
 const segment=(a,b)=>stamp(Math.min(a.x,b.x),Math.max(a.x,b.x),Math.min(a.z,b.z),Math.max(a.z,b.z),(x,z)=>{const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a.x-dx*t,z-a.z-dz*t);});
 for(let c=0;c<5;c++)for(const side of['left','right']){const points=chapterPath(c,side);for(let i=1;i<points.length;i++)segment(points[i-1],points[i]);}
 segment({x:0,z:10},{x:0,z:-2});segment({x:0,z:END.z+12},{x:0,z:END.z-2});
 const t=new T.DataTexture(data,w,h,T.RedFormat,T.UnsignedByteType);t.magFilter=T.LinearFilter;t.minFilter=T.LinearFilter;t.generateMipmaps=false;t.needsUpdate=true;return t;
}

// Ground material: world-space grass/dirt detail blended through the trail mask with a noisy, worn edge.
export function groundMaterial(grassColor,pathColor){
 const material=new T.MeshStandardMaterial({color:grassColor,roughness:.94}),uniforms={uGrassTex:{value:grassDetail()},uDirtTex:{value:dirtDetail()},uMask:{value:trailMask()},uMaskRect:{value:new T.Vector4(MASK_RECT.x,MASK_RECT.z,MASK_RECT.width,MASK_RECT.depth)},uPathColor:{value:new T.Color(pathColor)}};
 material.userData.ground=uniforms;material.userData.shared=true;
 material.onBeforeCompile=shader=>{Object.assign(shader.uniforms,uniforms);
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vGroundWorld;').replace('#include <fog_vertex>','#include <fog_vertex>\nvGroundWorld = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vGroundWorld;\nuniform sampler2D uGrassTex;\nuniform sampler2D uDirtTex;\nuniform sampler2D uMask;\nuniform vec4 uMaskRect;\nuniform vec3 uPathColor;').replace('#include <map_fragment>',`
	vec2 groundUv = vGroundWorld.xz;
	vec4 grassSample = texture2D( uGrassTex, groundUv * 0.31 );
	float patchiness = texture2D( uGrassTex, groundUv * 0.018 + 0.37 ).a;
	vec3 grass = diffuseColor.rgb * grassSample.rgb * 1.25 * mix( 0.8, 1.14, patchiness );
	vec2 maskUv = ( groundUv - uMaskRect.xy ) / uMaskRect.zw;
	float trail = 0.0;
	if ( maskUv.x > 0.0 && maskUv.x < 1.0 && maskUv.y > 0.0 && maskUv.y < 1.0 ) trail = texture2D( uMask, maskUv ).r;
	float ragged = texture2D( uDirtTex, groundUv * 0.23 ).a + texture2D( uDirtTex, groundUv * 0.9 ).a * 0.5 - 0.75;
	float onTrail = smoothstep( 0.42, 0.62, trail + ragged * 0.42 );
	vec3 dirt = uPathColor * texture2D( uDirtTex, groundUv * 0.37 ).rgb * 1.27;
	dirt *= mix( 0.82, 1.04, smoothstep( 0.5, 0.95, trail ) );
	grass *= mix( 1.0, 0.86, smoothstep( 0.2, 0.5, trail ) * ( 1.0 - onTrail ) );
	diffuseColor.rgb = mix( grass, dirt, onTrail );`);
 };
 material.customProgramCacheKey=()=>'maxima-ground-v1';
 return material;
}

// Swaying grass clumps along both trail edges. Instances are interleaved so a lower graphics preset can draw a subset.
export function edgeGrass(color='#5f8d55'){
 const blades=5,positions=[],colors=[],heights=[];for(let b=0;b<blades;b++){const a=b/blades*Math.PI+.3,w=.045,h=.34+(b%3)*.09,ox=Math.cos(a*2.3)*.07,oz=Math.sin(a*1.7)*.07,cx=Math.cos(a)*w,cz=Math.sin(a)*w,lean=(b%2?.06:-.05);
  positions.push(ox-cx,0,oz-cz, ox+cx,0,oz+cz, ox+lean,h,oz+lean*.6);colors.push(.55,.55,.55, .62,.62,.62, 1.12,1.12,1.0);heights.push(0,0,1);}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.setAttribute('sway',new T.Float32BufferAttribute(heights,1));geometry.computeVertexNormals();
 const spots=[],rnd=random(43),add=(x,z,s)=>spots.push({x,z,s,r:rnd()*Math.PI*2});
 for(let c=0;c<5;c++)for(const side of['left','right']){const points=chapterPath(c,side);for(let k=1;k<points.length;k++){const a=points[k-1],b=points[k],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);for(let d=.3;d<len;d+=.55)for(const edge of[-1,1]){const off=TRAIL_WIDTH-.15+rnd()*.85,x=a.x+dx*d/len-dz/len*edge*off,z=a.z+dz*d/len+dx/len*edge*off;if(Math.abs(x)<2.2&&Math.abs(z-(-c*CHAPTER_LENGTH+2))<6)continue;add(x,z,.7+rnd()*.7);if(rnd()<.45)add(x-dz/len*edge*(.5+rnd()),z+dx/len*edge*(.5+rnd()),.6+rnd()*.6);}}}
 for(let i=spots.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[spots[i],spots[j]]=[spots[j],spots[i]];}
 const material=new T.MeshStandardMaterial({color,vertexColors:true,roughness:.9,side:T.DoubleSide}),uniforms={uTime:{value:0}};material.userData.sway=uniforms;
 material.onBeforeCompile=shader=>{shader.uniforms.uTime=uniforms.uTime;shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float sway;\nuniform float uTime;').replace('#include <begin_vertex>',`#include <begin_vertex>
	#ifdef USE_INSTANCING
		vec2 root = instanceMatrix[ 3 ].xz;
	#else
		vec2 root = vec2( 0.0 );
	#endif
	float gust = sin( uTime * 1.6 + root.x * 0.45 + root.y * 0.31 ) * 0.6 + sin( uTime * 2.7 + root.y * 0.9 ) * 0.4;
	transformed.x += gust * 0.07 * sway;
	transformed.z += gust * 0.04 * sway;`);};
 material.customProgramCacheKey=()=>'maxima-grass-v1';
 const mesh=new T.InstancedMesh(geometry,material,spots.length),o=new T.Object3D();spots.forEach((s,i)=>{o.position.set(s.x,-.01,s.z);o.rotation.set(0,s.r,0);o.scale.set(s.s,s.s*(.8+((i*7)%5)*.1),s.s);o.updateMatrix();mesh.setMatrixAt(i,o.matrix);});
 mesh.castShadow=false;mesh.receiveShadow=true;mesh.userData.total=spots.length;mesh.frustumCulled=false;return mesh;
}

export const SKY_ZENITH=['#7fb6d6','#76abdf','#5e6ea6'];
// Gradient sky dome that follows the camera; its horizon matches the fog colour.
export function skyDome(){
 const uniforms={uTop:{value:new T.Color(SKY_ZENITH[0])},uHorizon:{value:new T.Color('#c9ded0')},uSun:{value:new T.Color('#ffe2ab')},uSunDir:{value:new T.Vector3(-.45,.75,.48).normalize()}};
 const material=new T.ShaderMaterial({uniforms,side:T.BackSide,depthWrite:false,depthTest:false,fog:false,
  vertexShader:'varying vec3 vDir;void main(){vDir=normalize(position);vec4 p=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*p;gl_Position.z=gl_Position.w;}',
  fragmentShader:'uniform vec3 uTop;uniform vec3 uHorizon;uniform vec3 uSun;uniform vec3 uSunDir;varying vec3 vDir;void main(){vec3 d=normalize(vDir);float h=max(d.y,0.0);vec3 c=mix(uHorizon,uTop,pow(smoothstep(0.0,0.85,h),0.7));float s=max(dot(d,uSunDir),0.0);c+=uSun*(pow(s,48.0)*0.35+pow(s,6.0)*0.08);gl_FragColor=vec4(c,1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'});
 const mesh=new T.Mesh(new T.SphereGeometry(180,32,16),material);mesh.renderOrder=-10;mesh.frustumCulled=false;mesh.userData.sky=uniforms;return mesh;
}

// Element-coloured rim on the partner so it reads clearly against any arena, plus an optional coat tint.
export function creatureRim(model,color='#d6f4df'){
 const rim={value:new T.Color(color)},tint={value:new T.Vector4(1,1,1,0)};model.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material]){if(!m?.isMeshStandardMaterial||m.userData.rim)continue;m.userData.rim=rim;m.onBeforeCompile=shader=>{shader.uniforms.uRim=rim;shader.uniforms.uTint=tint;shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 uRim;\nuniform vec4 uTint;').replace('#include <map_fragment>','#include <map_fragment>\n\t{ float coatLuma = dot( diffuseColor.rgb, vec3( 0.299, 0.587, 0.114 ) ); diffuseColor.rgb = mix( diffuseColor.rgb, min( uTint.rgb * coatLuma * 1.9, vec3( 1.0 ) ), uTint.a ); }').replace('#include <lights_fragment_end>','#include <lights_fragment_end>\n\t{ float creatureFacing = saturate( dot( geometryNormal, geometryViewDir ) ); reflectedLight.indirectDiffuse += uRim * pow( 1.0 - creatureFacing, 2.4 ) * 0.5; }');};m.customProgramCacheKey=()=>'maxima-creature-rim-v2';m.needsUpdate=true;}});
 return{rim,tint};
}

// Surface detail for untextured world props: world-space (triplanar) stone, wood or foliage detail and a
// soft contact darkening near the ground, so primitive shapes read as carved stone, timber and leaves.
function detailTexture(kind,size=128){
 const data=new Uint8ClampedArray(size*size*4),base=fbm(size,[4,8,16],kind==='wood'?211:kind==='leaf'?337:149),fine=fbm(size,[16,32],kind==='wood'?17:53),rnd=random(kind.length*97);
 const lum=new Float32Array(size*size);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=y*size+x;
  if(kind==='wood'){const g=Math.sin((x/size*18+base(x,y)*5)*Math.PI);lum[i]=.82+g*.08+(fine(x,y)-.5)*.16;}
  else if(kind==='leaf'){lum[i]=.74+base(x,y)*.3+(fine(x,y)-.5)*.2;}
  else{lum[i]=.76+(base(x,y)-.5)*.34+(fine(x,y)-.5)*.16;}}
 if(kind==='stone')for(let k=0;k<26;k++){let x=rnd()*size,y=rnd()*size,a=rnd()*Math.PI*2;for(let s=0;s<22;s++){a+=(rnd()-.5)*.9;x+=Math.cos(a);y+=Math.sin(a);const i=((Math.floor(y)%size+size)%size)*size+((Math.floor(x)%size+size)%size);lum[i]-=.18;}}
 for(let i=0;i<size*size;i++){const v=Math.max(.35,Math.min(1,lum[i]))*255;data[i*4]=data[i*4+1]=data[i*4+2]=v;data[i*4+3]=255;}
 return texture(data,size);
}
let DETAIL=null;
export function propKind(material){
 if(material?.userData?.detail&&!material.userData.stylized)return material.userData.detail;
 if(!material?.isMeshStandardMaterial||material.map||material.vertexColors||material.transparent||material.userData.ground||material.userData.rim||material.userData.stylized)return null;
 if(material.metalness>.3||material.emissiveIntensity>.2&&material.emissive?.getHex())return null;
 const hsl={};material.color.getHSL(hsl);if(material.roughness<.4&&hsl.h>.4&&hsl.h<.6)return null;
 if(hsl.s>.18&&hsl.h>.17&&hsl.h<.45)return'leaf';if(hsl.s>.2&&hsl.h>.03&&hsl.h<.13)return'wood';return'stone';
}
export function stylizeProps(root){
 if(!root)return 0;DETAIL??={stone:detailTexture('stone'),wood:detailTexture('wood'),leaf:detailTexture('leaf')};let count=0;
 root.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material]){const kind=propKind(m);if(!kind)continue;m.userData.stylized=kind;count++;const tex=DETAIL[kind],scale=m.userData.detailScale||(kind==='wood'?1.6:kind==='leaf'?1.1:.75);
  m.onBeforeCompile=shader=>{shader.uniforms.uDetail={value:tex};shader.uniforms.uDetailScale={value:scale};
   shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vDetailPos;\nvarying vec3 vDetailNormal;').replace('#include <fog_vertex>','#include <fog_vertex>\n\t#ifdef USE_INSTANCING\n\t\tvec4 detailWorld = modelMatrix * instanceMatrix * vec4( transformed, 1.0 );\n\t\tvDetailNormal = normalize( mat3( modelMatrix ) * mat3( instanceMatrix ) * objectNormal );\n\t#else\n\t\tvec4 detailWorld = modelMatrix * vec4( transformed, 1.0 );\n\t\tvDetailNormal = normalize( mat3( modelMatrix ) * objectNormal );\n\t#endif\n\tvDetailPos = detailWorld.xyz;');
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vDetailPos;\nvarying vec3 vDetailNormal;\nuniform sampler2D uDetail;\nuniform float uDetailScale;').replace('#include <map_fragment>',`#include <map_fragment>
	{
		vec3 bw = pow( abs( normalize( vDetailNormal ) ), vec3( 4.0 ) ); bw /= bw.x + bw.y + bw.z;
		vec3 p = vDetailPos * uDetailScale;
		float detail = texture2D( uDetail, p.yz ).r * bw.x + texture2D( uDetail, p.xz ).r * bw.y + texture2D( uDetail, p.xy ).r * bw.z;
		float contact = mix( 0.62, 1.0, smoothstep( 0.0, 0.55, vDetailPos.y ) );
		diffuseColor.rgb *= detail * 1.22 * contact;
	}`);};
  m.customProgramCacheKey=()=>'maxima-prop-'+kind;m.needsUpdate=true;}});
 return count;
}
