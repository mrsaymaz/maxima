import * as T from './vendor/three.module.min.js';
// High preset only: HDR scene target, soft bloom from a dual-filter blur chain, ACES tone mapping and per-arena colour grading.
const VERTEX='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}';
const BRIGHT=`uniform sampler2D tInput;uniform vec2 uTexel;uniform float uThreshold;varying vec2 vUv;
void main(){vec3 c=texture2D(tInput,vUv+uTexel*vec2(-1.0,-1.0)).rgb+texture2D(tInput,vUv+uTexel*vec2(1.0,-1.0)).rgb+texture2D(tInput,vUv+uTexel*vec2(-1.0,1.0)).rgb+texture2D(tInput,vUv+uTexel*vec2(1.0,1.0)).rgb;c*=0.25;
float l=max(c.r,max(c.g,c.b)),soft=clamp(l-uThreshold+0.25,0.0,0.5);soft=soft*soft/(2.0*0.25+1e-4);float w=max(soft,l-uThreshold)/max(l,1e-4);gl_FragColor=vec4(c*w,1.0);}`;
const DOWN=`uniform sampler2D tInput;uniform vec2 uTexel;varying vec2 vUv;
void main(){vec2 h=uTexel*0.5;vec3 c=texture2D(tInput,vUv).rgb*4.0+texture2D(tInput,vUv-h).rgb+texture2D(tInput,vUv+h).rgb+texture2D(tInput,vUv+vec2(h.x,-h.y)).rgb+texture2D(tInput,vUv-vec2(h.x,-h.y)).rgb;gl_FragColor=vec4(c/8.0,1.0);}`;
const UP=`uniform sampler2D tInput;uniform sampler2D tHigh;uniform vec2 uTexel;uniform float uMix;varying vec2 vUv;
void main(){vec2 h=uTexel*0.5;vec3 c=texture2D(tInput,vUv+vec2(-h.x*2.0,0.0)).rgb+texture2D(tInput,vUv+vec2(h.x*2.0,0.0)).rgb+texture2D(tInput,vUv+vec2(0.0,h.y*2.0)).rgb+texture2D(tInput,vUv+vec2(0.0,-h.y*2.0)).rgb;
c+=(texture2D(tInput,vUv+h).rgb+texture2D(tInput,vUv-h).rgb+texture2D(tInput,vUv+vec2(h.x,-h.y)).rgb+texture2D(tInput,vUv+vec2(-h.x,h.y)).rgb)*2.0;gl_FragColor=vec4(c/12.0+texture2D(tHigh,vUv).rgb*uMix,1.0);}`;
const COMPOSITE=`uniform sampler2D tScene;uniform sampler2D tBloom;uniform float uBloom;uniform float uExposure;uniform float uSaturation;uniform float uContrast;uniform float uVignette;uniform vec3 uShadows;uniform vec3 uHighlights;uniform vec2 uAspect;varying vec2 vUv;
vec3 fit(vec3 v){vec3 a=v*(v+0.0245786)-0.000090537;vec3 b=v*(0.983729*v+0.4329510)+0.238081;return a/b;}
vec3 aces(vec3 c){const mat3 i=mat3(vec3(0.59719,0.07600,0.02840),vec3(0.35458,0.90834,0.13383),vec3(0.04823,0.01566,0.83777));const mat3 o=mat3(vec3(1.60475,-0.10208,-0.00327),vec3(-0.53108,1.10813,-0.07276),vec3(-0.07367,-0.00605,1.07602));c*=uExposure/0.6;return clamp(o*fit(i*c),0.0,1.0);}
vec3 srgb(vec3 c){return mix(c*12.92,1.055*pow(c,vec3(1.0/2.4))-0.055,step(0.0031308,c));}
void main(){vec3 c=texture2D(tScene,vUv).rgb+texture2D(tBloom,vUv).rgb*uBloom;c=srgb(aces(c));
float l=dot(c,vec3(0.2126,0.7152,0.0722));c=mix(vec3(l),c,uSaturation);c=(c-0.5)*uContrast+0.5;
c+=uShadows*(1.0-smoothstep(0.0,0.55,l))+uHighlights*smoothstep(0.45,1.0,l);
vec2 p=(vUv-0.5)*uAspect;c*=1.0-uVignette*smoothstep(0.35,0.95,length(p));gl_FragColor=vec4(clamp(c,0.0,1.0),1.0);}`;
export const GRADES=[
 {saturation:1.12,contrast:1.05,shadows:[-.012,.004,.014],highlights:[.03,.018,-.012],bloom:.5,vignette:.24},
 {saturation:1.08,contrast:1.04,shadows:[-.01,0,.02],highlights:[.024,.02,.006],bloom:.45,vignette:.2},
 {saturation:1.1,contrast:1.07,shadows:[.008,-.006,.03],highlights:[.012,.014,.03],bloom:.62,vignette:.3}
];
export class PostFX{
 constructor(renderer){
  this.renderer=renderer;this.enabled=false;this.info={calls:0,triangles:0};this.size=new T.Vector2();this.threshold=.86;
  this.scene=new T.Scene();this.camera=new T.OrthographicCamera(-1,1,1,-1,0,1);const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));geometry.setAttribute('uv',new T.Float32BufferAttribute([0,0,2,0,0,2],2));this.quad=new T.Mesh(geometry);this.quad.frustumCulled=false;this.scene.add(this.quad);
  const make=(fragmentShader,uniforms)=>new T.ShaderMaterial({vertexShader:VERTEX,fragmentShader,uniforms,depthTest:false,depthWrite:false});
  this.bright=make(BRIGHT,{tInput:{value:null},uTexel:{value:new T.Vector2()},uThreshold:{value:this.threshold}});this.down=make(DOWN,{tInput:{value:null},uTexel:{value:new T.Vector2()}});this.up=make(UP,{tInput:{value:null},tHigh:{value:null},uTexel:{value:new T.Vector2()},uMix:{value:1}});
  this.composite=make(COMPOSITE,{tScene:{value:null},tBloom:{value:null},uBloom:{value:.5},uExposure:{value:1},uSaturation:{value:1.1},uContrast:{value:1.05},uVignette:{value:.24},uShadows:{value:new T.Vector3()},uHighlights:{value:new T.Vector3()},uAspect:{value:new T.Vector2(1,1)}});
  this.grade(0);
 }
 grade(area=0){const g=GRADES[area]||GRADES[0],u=this.composite.uniforms;u.uSaturation.value=g.saturation;u.uContrast.value=g.contrast;u.uShadows.value.set(...g.shadows);u.uHighlights.value.set(...g.highlights);u.uBloom.value=g.bloom;u.uVignette.value=g.vignette;}
 allocate(){const r=this.renderer;r.getDrawingBufferSize(this.size);const w=Math.max(2,this.size.x),h=Math.max(2,this.size.y);if(this.main&&this.main.width===w&&this.main.height===h)return;this.dispose();
  this.main=new T.WebGLRenderTarget(w,h,{type:T.HalfFloatType,samples:4});this.downs=[];this.ups=[];let lw=w,lh=h;for(let i=0;i<5;i++){lw=Math.max(1,lw>>1);lh=Math.max(1,lh>>1);this.downs.push(new T.WebGLRenderTarget(lw,lh,{type:T.HalfFloatType,depthBuffer:false}));if(i<4)this.ups.push(new T.WebGLRenderTarget(lw,lh,{type:T.HalfFloatType,depthBuffer:false}));}
  this.composite.uniforms.uAspect.value.set(w/Math.max(w,h),h/Math.max(w,h));
 }
 pass(material,target){this.quad.material=material;this.renderer.setRenderTarget(target);this.renderer.render(this.scene,this.camera);}
 render(scene,camera){
  const r=this.renderer;this.allocate();const previous=r.getRenderTarget();r.setRenderTarget(this.main);r.render(scene,camera);this.info={calls:r.info.render.calls,triangles:r.info.render.triangles};
  const b=this.bright.uniforms;b.tInput.value=this.main.texture;b.uTexel.value.set(1/this.main.width,1/this.main.height);b.uThreshold.value=this.threshold;this.pass(this.bright,this.downs[0]);
  for(let i=1;i<this.downs.length;i++){const s=this.downs[i-1];this.down.uniforms.tInput.value=s.texture;this.down.uniforms.uTexel.value.set(1/s.width,1/s.height);this.pass(this.down,this.downs[i]);}
  let low=this.downs[this.downs.length-1];for(let i=this.ups.length-1;i>=0;i--){const u=this.up.uniforms;u.tInput.value=low.texture;u.tHigh.value=this.downs[i].texture;u.uTexel.value.set(1/low.width,1/low.height);u.uMix.value=.8;this.pass(this.up,this.ups[i]);low=this.ups[i];}
  const c=this.composite.uniforms;c.tScene.value=this.main.texture;c.tBloom.value=low.texture;c.uExposure.value=r.toneMappingExposure;this.pass(this.composite,previous);
 }
 dispose(){this.main?.dispose();for(const t of[...(this.downs||[]),...(this.ups||[])])t.dispose();this.main=null;this.downs=[];this.ups=[];}
}
