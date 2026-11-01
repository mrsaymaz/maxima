var k=Object.defineProperty;var y=(h,t)=>k(h,"name",{value:t,configurable:!0});import{castPresentation as S}from"./combat-presentation.js";import*as v from"./vendor/three.module.min.js";const I=`#include <begin_vertex>
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
	}`;function T(h,t){let m=!1;return t.traverse(s=>{s.isSkinnedMesh&&(m=!0)}),!m&&(h==="ravenclaw"||h==="slytherin")}y(T,"needsProceduralMotion");class A{static{y(this,"ProceduralMotion")}constructor(t,{partner:m="ravenclaw",forward:s=[0,0,1]}={}){this.kind=m==="slytherin"?1:0,this.time=0,this.gait=0,this.move=0,this.flap=0,this.strike=0,this.footfallSerial=0;const e=new v.Vector3(s[0]||0,0,s[2]??1).normalize(),a=new v.Vector3(e.z,0,-e.x);this.uniforms={uMotionCenter:{value:new v.Vector3},uMotionBase:{value:0},uMotionFwd:{value:e},uMotionRight:{value:a},uMotionExt:{value:new v.Vector3(1,1,1)},uMotionTime:{value:0},uMotionGait:{value:0},uMotionMove:{value:0},uMotionFlap:{value:0},uMotionStrike:{value:0},uMotionKind:{value:this.kind},uMotionAmount:{value:1}},this.materials=[],t.traverse(n=>{if(!n.isMesh||n.isSkinnedMesh)return;const d=n.geometry.attributes.position;let r=1/0,u=-1/0,l=1/0,M=-1/0,i=1/0,g=-1/0;const f=new v.Vector3;for(let o=0;o<d.count;o++){f.fromBufferAttribute(d,o);const p=f.dot(e),c=f.dot(a);r=Math.min(r,p),u=Math.max(u,p),l=Math.min(l,c),M=Math.max(M,c),i=Math.min(i,f.y),g=Math.max(g,f.y)}const w=(r+u)/2,F=(l+M)/2;this.uniforms.uMotionCenter.value.copy(e.clone().multiplyScalar(w).add(a.clone().multiplyScalar(F))),this.uniforms.uMotionBase.value=i,this.uniforms.uMotionExt.value.set((u-r)/2,(M-l)/2,g-i);for(const o of Array.isArray(n.material)?n.material:[n.material]){if(!o||o.userData.motion)continue;const p=o.onBeforeCompile,c=o.customProgramCacheKey?.bind(o);o.userData.motion=!0,o.onBeforeCompile=(x,H)=>{p?.call(o,x,H),Object.assign(x.uniforms,this.uniforms),x.vertexShader=x.vertexShader.replace("#include <common>",`#include <common>
uniform vec3 uMotionCenter;
uniform float uMotionBase;
uniform vec3 uMotionFwd;
uniform vec3 uMotionRight;
uniform vec3 uMotionExt;
uniform float uMotionTime;
uniform float uMotionGait;
uniform float uMotionMove;
uniform float uMotionFlap;
uniform float uMotionStrike;
uniform float uMotionKind;
uniform float uMotionAmount;`).replace("#include <begin_vertex>",I)},o.customProgramCacheKey=()=>(c?c():"")+"|maxima-motion-v1",o.needsUpdate=!0,this.materials.push(o)}})}update(t,{moving:m=!1,speed:s=0,stage:e="ground",attack:a=null,enabled:n=!0}={}){if(t<=0)return;this.time+=t;const d=n&&m?1:0;this.move+=(d-this.move)*(1-Math.exp(-t*8));const r=this.gait;this.gait+=t*(2.2+Math.min(3,s)*3.2)*(this.move>.02?1:0),this.kind===0&&n&&m&&e==="ground"&&(this.footfallSerial+=Math.max(0,Math.floor((this.gait-Math.PI/2)/Math.PI)-Math.floor((r-Math.PI/2)/Math.PI)));const u=e==="air",l=n?e==="anticipation"?-.25:u?.6*Math.sin(this.time*15):e==="landing"?.35:a?.ranged?.45:this.move>.1?.22*Math.sin(this.gait*2):.06*Math.sin(this.time*3.1):0;this.flap+=(l-this.flap)*(1-Math.exp(-t*(u?30:12)));const M=a?a.ranged?S(a).release:Math.sin(Math.PI*Math.min(1,a.age/Math.max(.01,a.duration))):0;this.strike+=(M-this.strike)*(1-Math.exp(-t*20));const i=this.uniforms;i.uMotionTime.value=this.time,i.uMotionGait.value=this.gait,i.uMotionMove.value=this.move,i.uMotionFlap.value=this.flap,i.uMotionStrike.value=this.strike,i.uMotionAmount.value=n?1:Math.max(0,i.uMotionAmount.value-t*4)}}export{A as ProceduralMotion,T as needsProceduralMotion};
