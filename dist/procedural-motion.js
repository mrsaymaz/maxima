import{castPresentation}from'./combat-presentation.js';
import * as T from './vendor/three.module.min.js';
// Procedural motion for the nineteen forms supplied without a skeleton (Ravenclaw 0–8, Slytherin 0–9).
// A vertex-shader layer bends the single mesh: birds flap their wings, step their feet and bob their heads;
// serpents ripple a travelling wave along the body and sway the neck. This is a stopgap until the forms
// are rigged: it reads as limb motion at game distance but cannot match authored skeletal animation.
const VERTEX=`#include <begin_vertex>
	{
		vec3 mp = transformed - uMotionCenter;
		float mf = dot( mp, uMotionFwd ), ml = dot( mp, uMotionRight ), mu = transformed.y - uMotionBase;
		float mL = uMotionExt.x, mW = uMotionExt.y, mH = uMotionExt.z;
		vec3 md = vec3( 0.0, sin( uMotionTime * 2.3 ) * 0.012 * mH * clamp( mu / mH, 0.0, 1.0 ), 0.0 );
		if ( uMotionKind < 0.5 ) {
			float side = ml < 0.0 ? -1.0 : 1.0, al = abs( ml );
			float wing = smoothstep( 0.4 * mW, 0.85 * mW, al ) * smoothstep( 0.22 * mH, 0.5 * mH, mu ) * ( 1.0 - smoothstep( 0.55 * mL, 0.95 * mL, abs( mf ) ) * 0.5 );
			vec2 r = vec2( al - 0.32 * mW, mu - 0.55 * mH ), rr = vec2( r.x * cos( uMotionFlap ) - r.y * sin( uMotionFlap ), r.x * sin( uMotionFlap ) + r.y * cos( uMotionFlap ) ), dl = ( rr - r ) * wing;
			md += uMotionRight * side * dl.x + vec3( 0.0, dl.y, 0.0 );
			float leg = 1.0 - smoothstep( 0.0, 0.2 * mH, mu ), phase = uMotionGait + ( side > 0.0 ? 0.0 : 3.14159 );
			md += uMotionFwd * sin( phase ) * 0.15 * mL * leg * uMotionMove;
			md.y += max( 0.0, cos( phase ) ) * 0.05 * mH * leg * uMotionMove;
			float head = smoothstep( 0.1 * mL, 0.75 * mL, mf ) * smoothstep( 0.5 * mH, 0.8 * mH, mu );
			md += uMotionFwd * ( sin( uMotionGait * 2.0 ) * 0.07 * uMotionMove + sin( uMotionTime * 1.7 ) * 0.02 ) * mL * head;
		} else {
			float low = 1.0 - smoothstep( 0.35 * mH, 0.85 * mH, mu ), along = mf / max( mL, 1e-3 );
			md += uMotionRight * sin( along * 5.6 - uMotionGait ) * ( 0.05 + 0.08 * uMotionMove ) * mW * low;
			md.y += sin( uMotionGait * 2.0 - along * 6.28 ) * 0.025 * mH * low * uMotionMove;
			float neck = smoothstep( 0.45 * mH, 0.95 * mH, mu );
			md += ( uMotionRight * sin( uMotionTime * 1.5 + along ) * 0.08 * mW + uMotionFwd * ( sin( uMotionTime * 1.1 ) * 0.04 + uMotionStrike * 0.18 ) * mL ) * neck;
		}
		transformed += md * uMotionAmount;
	}`;
export function needsProceduralMotion(partner,model){let skinned=false;model.traverse(o=>{if(o.isSkinnedMesh)skinned=true;});return!skinned&&(partner==='ravenclaw'||partner==='slytherin');}
export class ProceduralMotion{
 constructor(model,{partner='ravenclaw',forward=[0,0,1]}={}){
  this.kind=partner==='slytherin'?1:0;this.time=0;this.gait=0;this.move=0;this.flap=0;this.strike=0;this.footfallSerial=0;
  const f=new T.Vector3(forward[0]||0,0,forward[2]??1).normalize(),r=new T.Vector3(f.z,0,-f.x);
  this.uniforms={uMotionCenter:{value:new T.Vector3()},uMotionBase:{value:0},uMotionFwd:{value:f},uMotionRight:{value:r},uMotionExt:{value:new T.Vector3(1,1,1)},uMotionTime:{value:0},uMotionGait:{value:0},uMotionMove:{value:0},uMotionFlap:{value:0},uMotionStrike:{value:0},uMotionKind:{value:this.kind},uMotionAmount:{value:1}};
  this.materials=[];model.traverse(o=>{if(!o.isMesh||o.isSkinnedMesh)return;const p=o.geometry.attributes.position;let minF=Infinity,maxF=-Infinity,minL=Infinity,maxL=-Infinity,minY=Infinity,maxY=-Infinity;const v=new T.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const a=v.dot(f),b=v.dot(r);minF=Math.min(minF,a);maxF=Math.max(maxF,a);minL=Math.min(minL,b);maxL=Math.max(maxL,b);minY=Math.min(minY,v.y);maxY=Math.max(maxY,v.y);}
   const cf=(minF+maxF)/2,cl=(minL+maxL)/2;this.uniforms.uMotionCenter.value.copy(f.clone().multiplyScalar(cf).add(r.clone().multiplyScalar(cl)));this.uniforms.uMotionBase.value=minY;this.uniforms.uMotionExt.value.set((maxF-minF)/2,(maxL-minL)/2,maxY-minY);
   for(const m of Array.isArray(o.material)?o.material:[o.material]){if(!m||m.userData.motion)continue;const prev=m.onBeforeCompile,key=m.customProgramCacheKey?.bind(m);m.userData.motion=true;m.onBeforeCompile=(shader,renderer)=>{prev?.call(m,shader,renderer);Object.assign(shader.uniforms,this.uniforms);shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform vec3 uMotionCenter;\nuniform float uMotionBase;\nuniform vec3 uMotionFwd;\nuniform vec3 uMotionRight;\nuniform vec3 uMotionExt;\nuniform float uMotionTime;\nuniform float uMotionGait;\nuniform float uMotionMove;\nuniform float uMotionFlap;\nuniform float uMotionStrike;\nuniform float uMotionKind;\nuniform float uMotionAmount;').replace('#include <begin_vertex>',VERTEX);};m.customProgramCacheKey=()=>(key?key():'')+'|maxima-motion-v1';m.needsUpdate=true;this.materials.push(m);}
  });
 }
 // stage: ground | anticipation | air | landing. speed in world units per second.
 update(dt,{moving=false,speed=0,stage='ground',attack=null,enabled=true}={}){
  if(dt<=0)return;this.time+=dt;const target=enabled&&moving?1:0;this.move+=(target-this.move)*(1-Math.exp(-dt*8));const beforeGait=this.gait;this.gait+=dt*(2.2+Math.min(3,speed)*3.2)*(this.move>.02?1:0);
  if(this.kind===0&&enabled&&moving&&stage==='ground')this.footfallSerial+=Math.max(0,Math.floor((this.gait-Math.PI/2)/Math.PI)-Math.floor((beforeGait-Math.PI/2)/Math.PI));
  const air=stage==='air',flap=!enabled?0:stage==='anticipation'?-.25:air?.6*Math.sin(this.time*15):stage==='landing'?.35:attack?.ranged?.45:this.move>.1?.22*Math.sin(this.gait*2):.06*Math.sin(this.time*3.1);
  this.flap+=(flap-this.flap)*(1-Math.exp(-dt*(air?30:12)));const strike=attack?(attack.ranged?castPresentation(attack).release:Math.sin(Math.PI*Math.min(1,attack.age/Math.max(.01,attack.duration)))):0;this.strike+=(strike-this.strike)*(1-Math.exp(-dt*20));
  const u=this.uniforms;u.uMotionTime.value=this.time;u.uMotionGait.value=this.gait;u.uMotionMove.value=this.move;u.uMotionFlap.value=this.flap;u.uMotionStrike.value=this.strike;u.uMotionAmount.value=enabled?1:Math.max(0,u.uMotionAmount.value-dt*4);
 }
}
