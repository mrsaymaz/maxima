var Z=Object.defineProperty;var h=(t,e)=>Z(t,"name",{value:e,configurable:!0});import{stretchZ as q}from"./runner-mode.js";import{composedHalfWidth as W}from"./expedition-composition.js";import{ARENA_LOOKS as Y}from"./arena-palette.js";import{SURFACES as R,assignSurface as j}from"./surface-materials.js";import*as m from"./vendor/three.module.min.js";import{chapterPath as Q,TRAIL_WIDTH as E,CHAPTER_LENGTH as $,END as L}from"./trail-layout.js";let K=!1;function J(){if(K)return;K=!0;const t=m.ShaderChunk,e="float dotNL = saturate( dot( geometryNormal, directLight.direction ) );";t.lights_physical_pars_fragment.includes(e)&&(t.lights_physical_pars_fragment=t.lights_physical_pars_fragment.replace(e,`${e}
	#ifndef MAXIMA_TOON
		#define MAXIMA_TOON 0.28
	#endif
	dotNL = mix( dotNL, smoothstep( 0.0, 0.2, dotNL ) * 0.82 + dotNL * 0.18, MAXIMA_TOON );`)),t.fog_pars_vertex=`#ifdef USE_FOG
	varying float vFogDepth;
	varying float vFogHeight;
#endif`,t.fog_vertex=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
	vFogHeight = ( transpose( mat3( viewMatrix ) ) * ( mvPosition.xyz - viewMatrix[ 3 ].xyz ) ).y;
#endif`,t.fog_pars_fragment=t.fog_pars_fragment.replace("varying float vFogDepth;",`varying float vFogDepth;
	varying float vFogHeight;`),t.fog_fragment=`#ifdef USE_FOG
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
#endif`}h(J,"installStyleChunks"),J();function z(t,e,l){const r=new Float32Array(e*e);let n=l>>>0||1;for(let o=0;o<r.length;o++)n=Math.imul(n,1664525)+1013904223>>>0,r[o]=n/4294967296;const c=h((o,a)=>r[(a%e+e)%e*e+(o%e+e)%e],"at");return(o,a)=>{const s=o/t*e,u=a/t*e,i=Math.floor(s),d=Math.floor(u),g=s-i,v=u-d,p=g*g*(3-2*g),x=v*v*(3-2*v);return(c(i,d)*(1-p)+c(i+1,d)*p)*(1-x)+(c(i,d+1)*(1-p)+c(i+1,d+1)*p)*x}}h(z,"noiseField");function G(t,e,l){const r=e.map((n,c)=>z(t,n,l+c*977));return(n,c)=>{let o=0,a=1,s=0;for(const u of r)o+=u(n,c)*a,s+=a,a*=.5;return o/s}}h(G,"fbm");function I(t){let e=t>>>0;return()=>(e=Math.imul(e,1664525)+1013904223>>>0,e/4294967296)}h(I,"random");function O(t,e,l=m.RGBAFormat){const r=new m.DataTexture(t,e,e,l);return r.wrapS=r.wrapT=m.RepeatWrapping,r.magFilter=m.LinearFilter,r.minFilter=m.LinearMipmapLinearFilter,r.generateMipmaps=!0,r.anisotropy=4,r.needsUpdate=!0,r}h(O,"texture");function tt(t=128){const e=new Uint8ClampedArray(t*t*4),l=G(t,[8,16,32],11),r=G(t,[2,4],29),n=I(5),c=new Float32Array(t*t);for(let o=0;o<t;o++)for(let a=0;a<t;a++)c[o*t+a]=.72+l(a,o)*.22;for(let o=0;o<t*t/9;o++){const a=n()*t,s=n()*t,u=2+n()*4,i=n()*Math.PI*2,d=n()<.5?-.12:.1;for(let g=0;g<u;g++){const v=Math.floor(a+Math.cos(i)*g+t)%t,p=Math.floor(s+Math.sin(i)*g+t)%t;c[p*t+v]+=d*(1-g/u*.5)}}for(let o=0;o<t*t;o++){const a=o%t,s=Math.floor(o/t),u=Math.max(.45,Math.min(1,c[o])),i=(l(a+37,s+11)-.5)*.12;e[o*4]=255*Math.min(1,u*(1+i)),e[o*4+1]=255*u,e[o*4+2]=255*Math.min(1,u*(1-i*.6)),e[o*4+3]=255*r(a,s)}return O(e,t)}h(tt,"grassDetail");function et(t=128){const e=new Uint8ClampedArray(t*t*4),l=G(t,[4,8,16,32],71),r=G(t,[4,8,16],97),n=I(19),c=new Float32Array(t*t);for(let o=0;o<t;o++)for(let a=0;a<t;a++)c[o*t+a]=.74+(l(a,o)-.5)*.3;for(let o=0;o<t*t/60;o++){const a=n()*t,s=n()*t,u=.8+n()*2.2,i=.12+n()*.12;for(let d=-4;d<=4;d++)for(let g=-4;g<=4;g++){const v=Math.hypot(g,d*1.2);if(v>u+1)continue;const p=Math.floor(a+g+t)%t,x=Math.floor(s+d+t)%t,f=x*t+p;c[f]+=v<u?i*(d<0?1:.55):-.16}}for(let o=0;o<t*t/14;o++){const a=Math.floor(n()*t*t);c[a]-=.1+n()*.12}for(let o=0;o<t*t;o++){const a=o%t,s=Math.floor(o/t),u=Math.max(.4,Math.min(1,c[o]));e[o*4]=255*u,e[o*4+1]=255*u*.97,e[o*4+2]=255*u*.92,e[o*4+3]=255*r(a,s)}return O(e,t)}h(et,"dirtDetail");const C={x:-48,z:L.z-24,width:96,depth:-(L.z-24)+18};function V(t=2.5,{composed:e=!1}={}){const l=Math.round(C.width*t),r=Math.round(C.depth*t),n=new Uint8Array(l*r),c=E-1.25,o=e?6.7:E+.7,a=h((i,d,g,v,p)=>{const x=Math.max(0,Math.floor((i-o-C.x)*t)),f=Math.min(l-1,Math.ceil((d+o-C.x)*t)),M=Math.max(0,Math.floor((g-o-C.z)*t)),b=Math.min(r-1,Math.ceil((v+o-C.z)*t));for(let S=M;S<=b;S++)for(let D=x;D<=f;D++){const F=C.x+(D+.5)/t,w=C.z+(S+.5)/t,_=p(F,w),y=e?W(w)+.7:o,U=e?W(w)-1.25:c;if(_>=y)continue;const T=Math.min(1,Math.max(0,(y-_)/(y-U))),A=Math.round(255*T*T*(3-2*T)),N=S*l+D;A>n[N]&&(n[N]=A)}},"stamp"),s=h((i,d)=>a(Math.min(i.x,d.x),Math.max(i.x,d.x),Math.min(i.z,d.z),Math.max(i.z,d.z),(g,v)=>{const p=d.x-i.x,x=d.z-i.z,f=Math.max(0,Math.min(1,((g-i.x)*p+(v-i.z)*x)/(p*p+x*x||1)));return Math.hypot(g-i.x-p*f,v-i.z-x*f)}),"segment");for(let i=0;i<5;i++)for(const d of["left","right"]){const g=Q(i,d);for(let v=1;v<g.length;v++)s(g[v-1],g[v])}s({x:0,z:10},{x:0,z:-2}),s({x:0,z:q(-654)},{x:0,z:L.z-2});const u=new m.DataTexture(n,l,r,m.RedFormat,m.UnsignedByteType);return u.magFilter=m.LinearFilter,u.minFilter=m.LinearFilter,u.generateMipmaps=!1,u.needsUpdate=!0,u}h(V,"trailMask");function ct(t,e){const l=new m.MeshStandardMaterial({color:t,roughness:.94}),r={uGrassTex:{value:tt()},uDirtTex:{value:et()},uMask:{value:V()},uComposedMask:{value:V(2.5,{composed:!0})},uComposition:{value:0},uCanopyShade:{value:.1},uMaskRect:{value:new m.Vector4(C.x,C.z,C.width,C.depth)},uPathColor:{value:new m.Color(e)}};return j(l,"soil"),l.userData.ground=r,l.userData.shared=!0,l.onBeforeCompile=n=>{Object.assign(n.uniforms,r),n.vertexShader=n.vertexShader.replace("#include <common>",`#include <common>
varying vec3 vGroundWorld;`).replace("#include <fog_vertex>",`#include <fog_vertex>
vGroundWorld = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;`),n.fragmentShader=n.fragmentShader.replace("#include <common>",`#include <common>
varying vec3 vGroundWorld;
uniform sampler2D uGrassTex;
uniform sampler2D uDirtTex;
uniform sampler2D uMask;
uniform sampler2D uComposedMask;
uniform float uComposition;
uniform float uCanopyShade;
uniform vec4 uMaskRect;
uniform vec3 uPathColor;`).replace("#include <map_fragment>",`
	vec2 groundUv = vGroundWorld.xz;
	vec4 grassSample = texture2D( uGrassTex, groundUv * 0.31 );
	float patchiness = texture2D( uGrassTex, groundUv * 0.018 + 0.37 ).a;
	vec3 grass = diffuseColor.rgb * grassSample.rgb * 1.25 * mix( 0.8, 1.14, patchiness );
	vec2 maskUv = ( groundUv - uMaskRect.xy ) / uMaskRect.zw;
	float trail = 0.0;
	if ( maskUv.x > 0.0 && maskUv.x < 1.0 && maskUv.y > 0.0 && maskUv.y < 1.0 ) trail = mix( texture2D( uMask, maskUv ).r, texture2D( uComposedMask, maskUv ).r, uComposition );
	float ragged = texture2D( uDirtTex, groundUv * 0.23 ).a + texture2D( uDirtTex, groundUv * 0.9 ).a * 0.5 - 0.75;
	float onTrail = smoothstep( 0.16, 0.84, trail + ragged * 0.26 );
	vec3 dirt = mix(grass, uPathColor * texture2D( uDirtTex, groundUv * 0.37 ).rgb * 1.27, .82);
	dirt *= mix( 0.82, 1.04, smoothstep( 0.5, 0.95, trail ) );
	grass *= mix( 1.0, 0.86, smoothstep( 0.2, 0.5, trail ) * ( 1.0 - onTrail ) );
	float wear = texture2D( uDirtTex, groundUv * .075 + vec2(.21, .38) ).a;
 float dampEdge = (1.0 - smoothstep(.44, .72, trail)) * smoothstep(.20, .48, trail) * smoothstep(.43, .72, wear);
 dirt = mix(dirt, dirt * vec3(.76, .84, .82), dampEdge * .55);
 float canopy = smoothstep(.35, .72, texture2D(uGrassTex, groundUv * .065 + .18).a);
 diffuseColor.rgb = mix( grass, dirt, onTrail ) * (1.0 - canopy * uCanopyShade);`)},l.customProgramCacheKey=()=>"maxima-ground-v4",l}h(ct,"groundMaterial");function mt(t="#5f8d55",{widthAt:e=h(()=>E,"widthAt"),heightAt:l=h(()=>0,"heightAt"),clusterAt:r=null}={}){const c=[],o=[],a=[];for(let f=0;f<5;f++){const M=f/5*Math.PI+.3,b=.045,S=.34+f%3*.09,D=Math.cos(M*2.3)*.07,F=Math.sin(M*1.7)*.07,w=Math.cos(M)*b,_=Math.sin(M)*b,y=f%2?.06:-.05;c.push(D-w,0,F-_,D+w,0,F+_,D+y,S,F+y*.6),o.push(.55,.55,.55,.62,.62,.62,1.12,1.12,1),a.push(0,0,1)}const s=new m.BufferGeometry;s.setAttribute("position",new m.Float32BufferAttribute(c,3)),s.setAttribute("color",new m.Float32BufferAttribute(o,3)),s.setAttribute("sway",new m.Float32BufferAttribute(a,1)),s.computeVertexNormals();const u=[],i=I(43),d=h((f,M,b)=>u.push({x:f,y:l(f,M),z:M,s:b,r:i()*Math.PI*2}),"add");for(let f=0;f<5;f++)for(const M of["left","right"]){const b=Q(f,M);for(let S=1;S<b.length;S++){const D=b[S-1],F=b[S],w=F.x-D.x,_=F.z-D.z,y=Math.hypot(w,_);for(let U=.3;U<y;U+=.55)for(const T of[-1,1]){const A={x:D.x+w*U/y,z:D.z+_*U/y},N=e(A.x,A.z)-(r?.3:.15)+i()*(r?.5:.85),P=A.x-_/y*T*N,k=A.z+w/y*T*N;if(!(Math.abs(P)<2.2&&Math.abs(k-(-f*$+2))<6)&&!(r&&i()>r(P,k))&&(d(P,k,.7+i()*.7),i()<.45))if(r){const H=-(.15+i()*.25);d(P-_/y*T*H,k+w/y*T*H,.6+i()*.6)}else d(P-_/y*T*(.5+i()),k+w/y*T*(.5+i()),.6+i()*.6)}}}for(let f=u.length-1;f>0;f--){const M=Math.floor(i()*(f+1));[u[f],u[M]]=[u[M],u[f]]}const g=new m.MeshStandardMaterial({color:t,vertexColors:!0,roughness:.9,side:m.DoubleSide}),v={uTime:{value:0},uQuietCenter:{value:new m.Vector2},uQuietRadius:{value:11},uQuietness:{value:0}};j(g,"foliage"),g.userData.sway=v,g.onBeforeCompile=f=>{Object.assign(f.uniforms,v),f.vertexShader=f.vertexShader.replace("#include <common>",`#include <common>
attribute float sway;
uniform float uTime;
uniform vec2 uQuietCenter;
uniform float uQuietRadius;
uniform float uQuietness;
varying float vGrassCalm;`).replace("#include <begin_vertex>",`#include <begin_vertex>
	#ifdef USE_INSTANCING
		vec2 root = instanceMatrix[ 3 ].xz;
	#else
		vec2 root = vec2( 0.0 );
	#endif
	float gust = sin( uTime * 1.6 + root.x * 0.45 + root.y * 0.31 ) * 0.6 + sin( uTime * 2.7 + root.y * 0.9 ) * 0.4;
	vGrassCalm = ( 1.0 - smoothstep( uQuietRadius * 0.65, uQuietRadius, distance( root, uQuietCenter ) ) ) * uQuietness;
	transformed.y *= 1.0 - vGrassCalm * 0.12;
	transformed.x += gust * 0.07 * sway * ( 1.0 - vGrassCalm * 0.88 );
	transformed.z += gust * 0.04 * sway * ( 1.0 - vGrassCalm * 0.88 );`),f.fragmentShader=f.fragmentShader.replace("#include <common>",`#include <common>
varying float vGrassCalm;`).replace("#include <color_fragment>",`#include <color_fragment>
diffuseColor.rgb = mix( diffuseColor.rgb, vec3( dot( diffuseColor.rgb, vec3( 0.25, 0.6, 0.15 ) ) ), vGrassCalm * 0.25 ) * ( 1.0 - vGrassCalm * 0.08 );`)},g.customProgramCacheKey=()=>"maxima-grass-v2";const p=new m.InstancedMesh(s,g,u.length),x=new m.Object3D;return u.forEach((f,M)=>{x.position.set(f.x,f.y-.01,f.z),x.rotation.set(0,f.r,0),x.scale.set(f.s,f.s*(.8+M*7%5*.1),f.s),x.updateMatrix(),p.setMatrixAt(M,x.matrix)}),p.castShadow=!1,p.receiveShadow=!0,p.userData.total=u.length,p.frustumCulled=!1,p}h(mt,"edgeGrass");const ot=Y.map(t=>t.zenith);function dt(){const t={uTop:{value:new m.Color(ot[0])},uHorizon:{value:new m.Color("#c9ded0")},uSun:{value:new m.Color("#ffe2ab")},uSunDir:{value:new m.Vector3(-.45,.75,.48).normalize()}},e=new m.ShaderMaterial({uniforms:t,side:m.BackSide,depthWrite:!1,depthTest:!1,fog:!1,vertexShader:"varying vec3 vDir;void main(){vDir=normalize(position);vec4 p=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*p;gl_Position.z=gl_Position.w;}",fragmentShader:`uniform vec3 uTop;uniform vec3 uHorizon;uniform vec3 uSun;uniform vec3 uSunDir;varying vec3 vDir;void main(){vec3 d=normalize(vDir);float h=max(d.y,0.0);vec3 c=mix(uHorizon,uTop,pow(smoothstep(0.0,0.85,h),0.7));float s=max(dot(d,uSunDir),0.0);c+=uSun*(pow(s,48.0)*0.35+pow(s,6.0)*0.08);gl_FragColor=vec4(c,1.0);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`}),l=new m.Mesh(new m.SphereGeometry(180,32,16),e);return l.renderOrder=-10,l.frustumCulled=!1,l.userData.sky=t,l}h(dt,"skyDome");function gt(t,e="#d6f4df"){const l={value:new m.Color(e)},r={value:new m.Vector4(1,1,1,0)};return t.traverse(n=>{if(n.isMesh)for(const c of Array.isArray(n.material)?n.material:[n.material])!c?.isMeshStandardMaterial||c.userData.rim||(c.userData.rim=l,c.onBeforeCompile=o=>{o.uniforms.uRim=l,o.uniforms.uTint=r,o.fragmentShader=o.fragmentShader.replace("#include <common>",`#include <common>
uniform vec3 uRim;
uniform vec4 uTint;`).replace("#include <map_fragment>",`#include <map_fragment>
	{ float coatLuma = dot( diffuseColor.rgb, vec3( 0.299, 0.587, 0.114 ) ); diffuseColor.rgb = mix( diffuseColor.rgb, min( uTint.rgb * coatLuma * 1.9, vec3( 1.0 ) ), uTint.a ); }`).replace("#include <lights_fragment_end>",`#include <lights_fragment_end>
	{ float creatureFacing = saturate( dot( geometryNormal, geometryViewDir ) ); reflectedLight.indirectDiffuse += uRim * pow( 1.0 - creatureFacing, 2.4 ) * 0.14; }`)},c.customProgramCacheKey=()=>"maxima-creature-rim-v2",c.needsUpdate=!0)}),{rim:l,tint:r}}h(gt,"creatureRim");function B(t,e=128){const l=new Uint8ClampedArray(e*e*4),r=G(e,[4,8,16],t==="wood"?211:t==="leaf"?337:149),n=G(e,[16,32],t==="wood"?17:53),c=I(t.length*97),o=new Float32Array(e*e);for(let a=0;a<e;a++)for(let s=0;s<e;s++){const u=a*e+s;if(t==="wood"){const i=Math.sin((s/e*18+r(s,a)*5)*Math.PI);o[u]=.82+i*.08+(n(s,a)-.5)*.16}else t==="leaf"?o[u]=.74+r(s,a)*.3+(n(s,a)-.5)*.2:o[u]=.76+(r(s,a)-.5)*.34+(n(s,a)-.5)*.16}if(t==="stone")for(let a=0;a<26;a++){let s=c()*e,u=c()*e,i=c()*Math.PI*2;for(let d=0;d<22;d++){i+=(c()-.5)*.9,s+=Math.cos(i),u+=Math.sin(i);const g=(Math.floor(u)%e+e)%e*e+(Math.floor(s)%e+e)%e;o[g]-=.18}}for(let a=0;a<e*e;a++){const s=Math.max(.35,Math.min(1,o[a]))*255;l[a*4]=l[a*4+1]=l[a*4+2]=s,l[a*4+3]=255}return O(l,e)}h(B,"detailTexture");let X=null;function at(t){if(!t?.isMeshStandardMaterial||t.map||t.userData.ground||t.userData.sway||t.userData.rim||t.userData.liquid||t.userData.stylized)return null;const e=R[t.userData.surface]?.detail||t.userData.detail;return["stone","wood","leaf"].includes(e)?e:null}h(at,"propKind");function rt(t,e,l){const r=Math.sin(e*.19+Math.sin(l*.041)*1.4)+Math.cos(l*.13-e*.047),n=r<-.55?0:r>.55?2:1,c=t==="wood"?[[.86,.87,.89],[.95,.93,.9],[1,.97,.93]]:t==="leaf"?[[.85,.91,.88],[.93,.98,.92],[1,1,.94]]:[[.88,.91,.94],[.95,.95,.94],[1,.97,.92]];return new m.Color().setRGB(...c[n])}h(rt,"sceneryTint");function ht(t,e,l){e.forEach((r,n)=>t.setColorAt(n,rt(l,r.x,r.z))),t.instanceColor&&(t.instanceColor.needsUpdate=!0)}h(ht,"varySceneryInstances");function pt(t){if(!t)return 0;X??={stone:B("stone"),wood:B("wood"),leaf:B("leaf")};let e=0;const l=new Set(t._mechanismMaterials||[]);t.traverse(r=>{if(r.isMesh)for(const n of Array.isArray(r.material)?r.material:[r.material])l.add(n)});for(const r of l){const n=at(r);if(!n)continue;r.userData.stylized=n,e++;const c=X[n],o=r.userData.detailScale||(n==="wood"?R.wood.scale:n==="leaf"?R.foliage.scale:R.stone.scale);r.onBeforeCompile=a=>{a.uniforms.uDetail={value:c},a.uniforms.uDetailScale={value:o},a.vertexShader=a.vertexShader.replace("#include <common>",`#include <common>
varying vec3 vDetailPos;
varying vec3 vDetailNormal;`).replace("#include <fog_vertex>",`#include <fog_vertex>
	#ifdef USE_INSTANCING
		vec4 detailWorld = modelMatrix * instanceMatrix * vec4( transformed, 1.0 );
		vDetailNormal = normalize( mat3( modelMatrix ) * mat3( instanceMatrix ) * objectNormal );
	#else
		vec4 detailWorld = modelMatrix * vec4( transformed, 1.0 );
		vDetailNormal = normalize( mat3( modelMatrix ) * objectNormal );
	#endif
	vDetailPos = detailWorld.xyz;`),a.fragmentShader=a.fragmentShader.replace("#include <common>",`#include <common>
varying vec3 vDetailPos;
varying vec3 vDetailNormal;
uniform sampler2D uDetail;
uniform float uDetailScale;`).replace("#include <map_fragment>",`#include <map_fragment>
	{
		vec3 bw = pow( abs( normalize( vDetailNormal ) ), vec3( 4.0 ) ); bw /= bw.x + bw.y + bw.z;
		vec3 p = vDetailPos * uDetailScale;
		float detail = texture2D( uDetail, p.yz ).r * bw.x + texture2D( uDetail, p.xz ).r * bw.y + texture2D( uDetail, p.xy ).r * bw.z;
		float broadTone = texture2D( uDetail, p.xz * 0.09 + vec2( 0.37, 0.13 ) ).r;
		detail *= mix( 0.94, 1.06, smoothstep( 0.52, 0.9, broadTone ) );
		float contact = mix( 0.62, 1.0, smoothstep( 0.0, 0.55, vDetailPos.y ) );
		diffuseColor.rgb *= detail * 1.22 * contact;
	}`)},r.customProgramCacheKey=()=>"maxima-prop-"+n,r.needsUpdate=!0}return e}h(pt,"stylizeProps");export{C as MASK_RECT,ot as SKY_ZENITH,gt as creatureRim,et as dirtDetail,mt as edgeGrass,tt as grassDetail,ct as groundMaterial,J as installStyleChunks,at as propKind,rt as sceneryTint,dt as skyDome,pt as stylizeProps,V as trailMask,ht as varySceneryInstances};
