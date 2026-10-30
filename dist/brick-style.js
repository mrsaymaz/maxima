import * as T from './vendor/three.module.min.js';
import{BRICK_COLORS}from'./arena-palette.js';

// Toy-brick world (prototype). Every environment surface becomes glossy plastic in one of the arena's brick colours:
// colours snap to the nearest brick colour (in Oklab, so hue is kept), flat tops grow round studs, walls show
// staggered brick seams, and crystal parts turn see-through. All of it is drawn in the shader on existing geometry,
// so phones pay a few ALU ops per pixel and no extra triangles. Studs and seams fade with distance to avoid shimmer.
export const BRICK_PITCH=.5,BRICK_HEIGHT=.4,BRICK_LENGTH=1;
const MAX_COLORS=12;
const FOLIAGE=/grass|fern|flower|leaf|leaves|crown|canopy|foliage|blossom|bush|petal|vine|moss/i;
const SKIP=/coin|rune|contact-shade|charge-|threat|beacon|orb|guardian/i;

function oklab(c){
 const l=Math.cbrt(.4122214708*c.r+.5363325363*c.g+.0514459929*c.b),m=Math.cbrt(.2119034982*c.r+.6806995451*c.g+.1073969566*c.b),s=Math.cbrt(.0883024619*c.r+.2817188376*c.g+.6299787005*c.b);
 return new T.Vector3(.2104542553*l+.793617785*m-.0040720468*s,1.9779984951*l-2.428592205*m+.4505937099*s,.0259040371*l+.7827717662*m-.808675766*s);
}
const distance=(a,b)=>{const dl=(a.x-b.x)*.6,da=a.y-b.y,db=a.z-b.z;return dl*dl+da*da+db*db;};

export function brickPalette(area){
 const entry=BRICK_COLORS[area|0]||BRICK_COLORS[0];
 const linear=Object.values(entry.bricks).slice(0,MAX_COLORS).map(h=>new T.Color(h));
 return{id:entry.id,linear,lab:linear.map(oklab),crystal:entry.crystal?new T.Color(entry.crystal):null};
}
export function nearestBrick(color,palette){
 const target=oklab(color);let best=0,score=Infinity;
 palette.lab.forEach((lab,i)=>{const d=distance(target,lab);if(d<score){score=d;best=i;}});
 return palette.linear[best];
}

const COMMON=`
#ifdef MAXIMA_BRICK
uniform vec3 uBrickLinear[${MAX_COLORS}];uniform vec3 uBrickLab[${MAX_COLORS}];uniform int uBrickCount;
varying vec3 vBrickWorld;varying vec3 vBrickNormal;
#endif`;
const VERTEX=`
#ifdef MAXIMA_BRICK
{vec4 brickWorld=vec4(transformed,1.);vec3 brickNormal=objectNormal;
#ifdef USE_INSTANCING
brickWorld=instanceMatrix*brickWorld;brickNormal=mat3(instanceMatrix)*brickNormal;
#endif
brickWorld=modelMatrix*brickWorld;vBrickWorld=brickWorld.xyz;vBrickNormal=normalize(mat3(modelMatrix)*brickNormal);}
#endif`;
const FRAGMENT=`
#ifdef MAXIMA_BRICK
{
 // Snap the material's own colour (with vertex colour), so stone grain, wood texture and other surface detail give
 // way to clean plastic; the ground shader mixes grass and path itself, so it reads the trail mask per stud.
 #if defined(MAXIMA_BRICK_GROUND)
 // The trail is laid in whole studs: its mask is read at each stud's centre, so path edges step like a baseplate.
 vec2 brickCell=(floor(vBrickWorld.xz/${BRICK_PITCH.toFixed(3)})+.5)*${BRICK_PITCH.toFixed(3)},brickMaskUv=(brickCell-uMaskRect.xy)/uMaskRect.zw;float brickTrail=0.;
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
 for(int i=0;i<${MAX_COLORS};i++){if(i>=uBrickCount)break;vec3 d=lab-uBrickLab[i];d.x*=.6;float s=dot(d,d);if(s<bestScore){bestScore=s;best=uBrickLinear[i];}}
 diffuseColor.rgb=best;
 #ifndef MAXIMA_BRICK_PLAIN
 vec3 bn=normalize(vBrickNormal);vec3 bw=vBrickWorld;float far=length(vViewPosition);
 // Studs on surfaces that face up.
 float up=smoothstep(.8,.95,bn.y)*(1.-smoothstep(14.,28.,far));
 if(up>0.){
  vec2 cell=fract(bw.xz/${BRICK_PITCH.toFixed(3)})-.5;float d=length(cell),r=.3,aa=fwidth(d)*1.5+.002;
  float inside=1.-smoothstep(r-aa,r+aa,d),edge=1.-smoothstep(0.,.07+aa,abs(d-r));
  vec2 dir=cell/max(d,1e-4);float lit=dot(dir,vec2(-.62,-.78));
  diffuseColor.rgb*=1.+up*(inside*.05+edge*(lit>0.?.16*lit:.34*lit));
  normal=normalize(normal+mat3(viewMatrix)*vec3(dir.x,0.,dir.y)*edge*up*.55);
 }
 // Staggered seams on walls.
 float wall=(1.-smoothstep(.25,.45,abs(bn.y)))*(1.-smoothstep(20.,40.,far));
 if(wall>0.){
  vec2 t=normalize(vec2(-bn.z,bn.x)+1e-5);float u=dot(bw.xz,t),row=floor(bw.y/${BRICK_HEIGHT.toFixed(3)});
  float v=fract(bw.y/${BRICK_HEIGHT.toFixed(3)}),w=fract(u/${BRICK_LENGTH.toFixed(3)}+mod(row,2.)*.5);
  float av=fwidth(v)*1.2+.004,aw=fwidth(w)*1.2+.004;
  float seam=max(1.-smoothstep(0.,.05+av,min(v,1.-v)),1.-smoothstep(0.,.025+aw,min(w,1.-w)));
  diffuseColor.rgb*=1.-wall*seam*.32;
 }
 #endif
}
#endif`;

export class BrickStyle{
 constructor(){
  this.uniforms={uBrickLinear:{value:Array.from({length:MAX_COLORS},()=>new T.Vector3())},uBrickLab:{value:Array.from({length:MAX_COLORS},()=>new T.Vector3())},uBrickCount:{value:0}};
  this.patched=new WeakMap();this.area=-1;this.palette=null;this.time=1;this.models=new WeakSet();
 }
 setArea(area){
  if(area===this.area)return;this.area=area;this.palette=brickPalette(area);
  this.palette.linear.forEach((c,i)=>{this.uniforms.uBrickLinear.value[i].set(c.r,c.g,c.b);this.uniforms.uBrickLab.value[i].copy(this.palette.lab[i]);});
  this.uniforms.uBrickCount.value=this.palette.linear.length;
 }
 // Patches every new environment material in the scene; cheap to call often, each material is touched once.
 apply(root,{skip=[],area=0,creature=null}={}){
  this.setArea(area);const skipped=new Set(skip.filter(Boolean));
  root.traverse(o=>{
   if(skipped.has(o)||!o.isMesh)return;
   for(let p=o;p;p=p.parent)if(skipped.has(p)||SKIP.test(p.name||''))return;
   const plain=FOLIAGE.test(o.name||'')||FOLIAGE.test(o.parent?.name||'');
   for(const m of[].concat(o.material))if(m?.isMeshStandardMaterial)this.patch(m,plain||FOLIAGE.test(m.name||''));
  });
  if(creature)this.vinyl(creature);
 }
 patch(material,plain){
  // Other passes (world-style.js) may replace the shader hooks later; a material whose hook is no longer ours is
  // patched again on top of the new one.
  const mine=this.patched.get(material);if(mine&&(mine==='static'||material.customProgramCacheKey===mine))return;this.patched.set(material,'static');
  if(material.metalness>.5||material.emissive&&material.emissive.getHex()!==0&&material.emissiveIntensity>0)return;
  if(this.palette.crystal&&material.color?.getHex()===this.palette.crystal.getHex()){material.transparent=true;material.opacity=.55;material.roughness=.08;material.depthWrite=false;material.needsUpdate=true;return;}
  if(material.transparent){if(material.color)material.color.copy(nearestBrick(material.color,this.palette));material.roughness=Math.min(material.roughness??1,.2);material.needsUpdate=true;return;}
  if(material.map?.isDataTexture)material.map=null;
  material.roughness=Math.min(material.roughness??1,.4);material.metalness=0;
  const previous=material.onBeforeCompile,previousKey=material.customProgramCacheKey,ground=/maxima-ground/.test(previousKey.call(material));
  material.onBeforeCompile=(shader,renderer)=>{
   previous?.call(material,shader,renderer);
   Object.assign(shader.uniforms,this.uniforms);
   shader.defines={...(shader.defines||{}),MAXIMA_BRICK:''};if(plain)shader.defines.MAXIMA_BRICK_PLAIN='';if(ground)shader.defines.MAXIMA_BRICK_GROUND='';
   shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>'+COMMON).replace('#include <project_vertex>','#include <project_vertex>'+VERTEX);
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>'+COMMON).replace('#include <lights_physical_fragment>',FRAGMENT+'\n#include <lights_physical_fragment>');
  };
  const key=()=>previousKey.call(material)+'|brick'+(plain?'-plain':'');
  material.customProgramCacheKey=key;this.patched.set(material,key);material.needsUpdate=true;
 }
 // Creatures read as vinyl toy figures in the playset: a little gloss, colours untouched.
 vinyl(model){
  if(this.models.has(model))return;this.models.add(model);
  model.traverse(o=>{for(const m of[].concat(o.material||[]))if(m?.isMeshStandardMaterial){m.roughness=Math.min(m.roughness??1,.55);m.needsUpdate=true;}});
 }
}
