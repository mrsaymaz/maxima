var g=Object.defineProperty;var l=(s,e)=>g(s,"name",{value:e,configurable:!0});import*as f from"./vendor/three.module.min.js";import{BRICK_COLORS as m}from"./arena-palette.js";const u=.5,p=.4,M=1,d=12,h=/grass|fern|flower|leaf|leaves|crown|canopy|foliage|blossom|bush|petal|vine|moss/i,x=/coin|rune|contact-shade|charge-|threat|beacon|orb|guardian/i;function b(s){const e=Math.cbrt(.4122214708*s.r+.5363325363*s.g+.0514459929*s.b),r=Math.cbrt(.2119034982*s.r+.6806995451*s.g+.1073969566*s.b),t=Math.cbrt(.0883024619*s.r+.2817188376*s.g+.6299787005*s.b);return new f.Vector3(.2104542553*e+.793617785*r-.0040720468*t,1.9779984951*e-2.428592205*r+.4505937099*t,.0259040371*e+.7827717662*r-.808675766*t)}l(b,"oklab");const C=l((s,e)=>{const r=(s.x-e.x)*.6,t=s.y-e.y,o=s.z-e.z;return r*r+t*t+o*o},"distance");function y(s){const e=m[s|0]||m[0],r=Object.values(e.bricks).slice(0,d).map(t=>new f.Color(t));return{id:e.id,linear:r,lab:r.map(b),crystal:e.crystal?new f.Color(e.crystal):null}}l(y,"brickPalette");function w(s,e){const r=b(s);let t=0,o=1/0;return e.lab.forEach((c,n)=>{const a=C(r,c);a<o&&(o=a,t=n)}),e.linear[t]}l(w,"nearestBrick");const v=`
#ifdef MAXIMA_BRICK
uniform vec3 uBrickLinear[${d}];uniform vec3 uBrickLab[${d}];uniform int uBrickCount;
varying vec3 vBrickWorld;varying vec3 vBrickNormal;
#endif`,B=`
#ifdef MAXIMA_BRICK
{vec4 brickWorld=vec4(transformed,1.);vec3 brickNormal=objectNormal;
#ifdef USE_INSTANCING
brickWorld=instanceMatrix*brickWorld;brickNormal=mat3(instanceMatrix)*brickNormal;
#endif
brickWorld=modelMatrix*brickWorld;vBrickWorld=brickWorld.xyz;vBrickNormal=normalize(mat3(modelMatrix)*brickNormal);}
#endif`,I=`
#ifdef MAXIMA_BRICK
{
 // Snap the material's own colour (with vertex colour), so stone grain, wood texture and other surface detail give
 // way to clean plastic; the ground shader mixes grass and path itself, so it reads the trail mask per stud.
 #if defined(MAXIMA_BRICK_GROUND)
 // The trail is laid in whole studs: its mask is read at each stud's centre, so path edges step like a baseplate.
 vec2 brickCell=(floor(vBrickWorld.xz/${u.toFixed(3)})+.5)*${u.toFixed(3)},brickMaskUv=(brickCell-uMaskRect.xy)/uMaskRect.zw;float brickTrail=0.;
 if(brickMaskUv.x>0.&&brickMaskUv.x<1.&&brickMaskUv.y>0.&&brickMaskUv.y<1.)brickTrail=mix(texture2D(uMask,brickMaskUv).r,texture2D(uComposedMask,brickMaskUv).r,uComposition);
 vec3 c=brickTrail>.5?uPathColor:diffuse;
 #else
 vec3 c=diffuse;
 #if defined(USE_COLOR_ALPHA)
 c*=vColor.rgb;
 #elif defined(USE_COLOR)||defined(USE_INSTANCING_COLOR)||defined(USE_BATCHING_COLOR)
 c*=vColor;
 #endif
 #endif
 vec3 lms=pow(vec3(.4122214708*c.r+.5363325363*c.g+.0514459929*c.b,.2119034982*c.r+.6806995451*c.g+.1073969566*c.b,.0883024619*c.r+.2817188376*c.g+.6299787005*c.b),vec3(1./3.));
 vec3 lab=vec3(.2104542553*lms.x+.793617785*lms.y-.0040720468*lms.z,1.9779984951*lms.x-2.428592205*lms.y+.4505937099*lms.z,.0259040371*lms.x+.7827717662*lms.y-.808675766*lms.z);
 float bestScore=1e9;vec3 best=c;
 for(int i=0;i<${d};i++){if(i>=uBrickCount)break;vec3 d=lab-uBrickLab[i];d.x*=.6;float s=dot(d,d);if(s<bestScore){bestScore=s;best=uBrickLinear[i];}}
 diffuseColor.rgb=best;
 #ifndef MAXIMA_BRICK_PLAIN
 vec3 bn=normalize(vBrickNormal);vec3 bw=vBrickWorld;float far=length(vViewPosition);
 // Studs on surfaces that face up.
 float up=smoothstep(.8,.95,bn.y)*(1.-smoothstep(14.,28.,far));
 if(up>0.){
  vec2 cell=fract(bw.xz/${u.toFixed(3)})-.5;float d=length(cell),r=.3,aa=fwidth(d)*1.5+.002;
  float inside=1.-smoothstep(r-aa,r+aa,d),edge=1.-smoothstep(0.,.07+aa,abs(d-r));
  vec2 dir=cell/max(d,1e-4);float lit=dot(dir,vec2(-.62,-.78));
  diffuseColor.rgb*=1.+up*(inside*.05+edge*(lit>0.?.16*lit:.34*lit));
  normal=normalize(normal+mat3(viewMatrix)*vec3(dir.x,0.,dir.y)*edge*up*.55);
 }
 // Staggered seams on walls.
 float wall=(1.-smoothstep(.25,.45,abs(bn.y)))*(1.-smoothstep(20.,40.,far));
 if(wall>0.){
  vec2 t=normalize(vec2(-bn.z,bn.x)+1e-5);float u=dot(bw.xz,t),row=floor(bw.y/${p.toFixed(3)});
  float v=fract(bw.y/${p.toFixed(3)}),w=fract(u/${M.toFixed(3)}+mod(row,2.)*.5);
  float av=fwidth(v)*1.2+.004,aw=fwidth(w)*1.2+.004;
  float seam=max(1.-smoothstep(0.,.05+av,min(v,1.-v)),1.-smoothstep(0.,.025+aw,min(w,1.-w)));
  diffuseColor.rgb*=1.-wall*seam*.32;
 }
 #endif
}
#endif`;class S{static{l(this,"BrickStyle")}constructor(){this.uniforms={uBrickLinear:{value:Array.from({length:d},()=>new f.Vector3)},uBrickLab:{value:Array.from({length:d},()=>new f.Vector3)},uBrickCount:{value:0}},this.patched=new WeakMap,this.area=-1,this.palette=null,this.time=1,this.models=new WeakSet}setArea(e){e!==this.area&&(this.area=e,this.palette=y(e),this.palette.linear.forEach((r,t)=>{this.uniforms.uBrickLinear.value[t].set(r.r,r.g,r.b),this.uniforms.uBrickLab.value[t].copy(this.palette.lab[t])}),this.uniforms.uBrickCount.value=this.palette.linear.length)}apply(e,{skip:r=[],area:t=0,creature:o=null}={}){this.setArea(t);const c=new Set(r.filter(Boolean));e.traverse(n=>{if(c.has(n)||!n.isMesh)return;for(let i=n;i;i=i.parent)if(c.has(i)||x.test(i.name||""))return;const a=h.test(n.name||"")||h.test(n.parent?.name||"");for(const i of[].concat(n.material))i?.isMeshStandardMaterial&&this.patch(i,a||h.test(i.name||""))}),o&&this.vinyl(o)}patch(e,r){const t=this.patched.get(e);if(t&&(t==="static"||e.customProgramCacheKey===t)||(this.patched.set(e,"static"),e.metalness>.5||e.emissive&&e.emissive.getHex()!==0&&e.emissiveIntensity>0))return;if(this.palette.crystal&&e.color?.getHex()===this.palette.crystal.getHex()){e.transparent=!0,e.opacity=.55,e.roughness=.08,e.depthWrite=!1,e.needsUpdate=!0;return}if(e.transparent){e.color&&e.color.copy(w(e.color,this.palette)),e.roughness=Math.min(e.roughness??1,.2),e.needsUpdate=!0;return}e.map?.isDataTexture&&(e.map=null),e.roughness=Math.min(e.roughness??1,.4),e.metalness=0;const o=e.onBeforeCompile,c=e.customProgramCacheKey,n=/maxima-ground/.test(c.call(e));e.onBeforeCompile=(i,k)=>{o?.call(e,i,k),Object.assign(i.uniforms,this.uniforms),i.defines={...i.defines||{},MAXIMA_BRICK:""},r&&(i.defines.MAXIMA_BRICK_PLAIN=""),n&&(i.defines.MAXIMA_BRICK_GROUND=""),i.vertexShader=i.vertexShader.replace("#include <common>","#include <common>"+v).replace("#include <project_vertex>","#include <project_vertex>"+B),i.fragmentShader=i.fragmentShader.replace("#include <common>","#include <common>"+v).replace("#include <lights_physical_fragment>",I+`
#include <lights_physical_fragment>`)};const a=l(()=>c.call(e)+"|brick"+(r?"-plain":""),"key");e.customProgramCacheKey=a,this.patched.set(e,a),e.needsUpdate=!0}vinyl(e){this.models.has(e)||(this.models.add(e),e.traverse(r=>{for(const t of[].concat(r.material||[]))t?.isMeshStandardMaterial&&(t.roughness=Math.min(t.roughness??1,.55),t.needsUpdate=!0)}))}}export{p as BRICK_HEIGHT,M as BRICK_LENGTH,u as BRICK_PITCH,S as BrickStyle,y as brickPalette,w as nearestBrick};
