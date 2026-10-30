import{castPresentation}from'./combat-presentation.js';
import * as T from'./vendor/three.module.min.js';
// Small anatomy-local accents, aligned to the real elemental release time.
export function elementalCastPose(attack){const f=castPresentation(attack),q=f.charge,r=f.release;switch(attack.element){
 case 'fire':return{body:q*.055-r*.065,head:q*.025-r*.045,limb:-q*.065+r*.085};
 case 'nature':return{body:q*.040-r*.024,head:-q*.025+r*.018,limb:q*.065-r*.040};
 case 'water':return{body:-q*.035+r*.045,head:q*.025-r*.035,limb:q*.055-r*.065};
 default:return{body:-q*.045+r*.055,head:-q*.025+r*.035,limb:q*.065-r*.080};
}}
// Temporary additive poses restore before the walking mixer runs; no accumulation.
export class PartnerAttackPose{
 constructor(model,profile=null,forwardYaw=0){this.model=model;this.bones=[];if(Array.isArray(profile)){model.updateMatrixWorld(true);const lateral=new T.Vector3(Math.cos(forwardYaw),0,-Math.sin(forwardYaw)).applyQuaternion(model.getWorldQuaternion(new T.Quaternion()));for(const p of profile)this.bones.push({...p,base:p.bone.quaternion.clone(),axis:lateral.clone().applyQuaternion(p.bone.getWorldQuaternion(new T.Quaternion()).invert()).normalize()});}else model.traverse(b=>{if(b.isBone&&/Spine|Head_0|0_(Left|Right)_Limb_0|Chest|UpperArm|Head$/.test(b.name))this.bones.push({bone:b,base:b.quaternion.clone()});});this.offset=new T.Quaternion();this.axis=new T.Vector3(1,0,0);this.applied=false;}
 reset(){if(!this.applied)return;for(const b of this.bones)b.bone.quaternion.copy(b.base);this.model.rotation.x=this.baseX;this.model.rotation.z=this.baseZ;this.applied=false;}
 apply(attack){if(!attack)return;this.baseX=this.model.rotation.x;this.baseZ=this.model.rotation.z;const t=Math.min(1,attack.age/attack.duration),prepare=Math.sin(Math.PI*Math.min(1,t/.34)),strike=Math.sin(Math.PI*Math.max(0,Math.min(1,(t-.25)/.75))),jump=attack.kind==='jump';for(const b of this.bones){b.base.copy(b.bone.quaternion);const head=b.role?b.role==='head':b.bone.name.includes('Head'),limb=b.role?b.role==='limb':b.bone.name.includes('Limb'),sign=b.bone.name.includes('Left')?-1:1;const elemental=attack.ranged?elementalCastPose(attack):null,angle=elemental?(limb?sign*elemental.limb:head?elemental.head:elemental.body):limb?sign*(prepare*.10-strike*.19):head?prepare*.065-strike*.105:prepare*.05-strike*.09;this.offset.setFromAxisAngle(b.axis||this.axis,angle*(b.role?.55:.7)*(jump?1.1:1));b.bone.quaternion.multiply(this.offset);}if(attack.ranged){const f=castPresentation(attack),a=attack.element==='fire'?.035:attack.element==='nature'?.02:.015;this.model.rotation.x+=f.charge*a-f.release*a;this.model.rotation.z+=attack.element==='air'?f.charge*.02:attack.element==='water'?-f.charge*.015:0;}else{this.model.rotation.x+=prepare*.045-strike*.065;this.model.rotation.z+=attack.kind==='turn'?Math.sin(t*Math.PI*2)*.08:0;}this.applied=true;}
}
