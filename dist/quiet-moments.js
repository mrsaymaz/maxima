import * as T from './vendor/three.module.min.js';
// Additive, reversible head motion after the mixer. No asset, root translation or collision changes.
export class QuietMoments{
 constructor(model,profile=[]){this.model=model;this.head=profile.find(p=>p.role==='head'&&p.bone?.isBone)?.bone||null;this.subject=this.head||model;this.age=99;this.kind=null;this.seen=null;this.applied=false;this.base=new T.Quaternion();this.worldQ=new T.Quaternion();this.axis=new T.Vector3();this.delta=new T.Quaternion();}
 reset(){if(this.applied){this.subject.quaternion.copy(this.base);this.applied=false;}}
 observe(key,side=1){if(!key||key===this.seen)return;this.seen=key;this.side=Math.sign(side)||1;this.kind='glance';this.age=0;}
 acknowledge(){this.kind='acknowledge';this.age=0;}
 settle(){this.kind='settle';this.age=0;}
 update(dt,{enabled=true,moving=false,attack=false,airborne=false,reduced=false}={}){
  this.reset();if(dt<=0)return;if(!enabled){this.kind=null;this.seen=null;return;}if(moving||attack||airborne||reduced)return;this.age+=dt;if(this.age>2.2||!this.kind)return;
  const t=this.age,duration=this.kind==='glance'?1.8:this.kind==='settle'?2.2:1.1;if(t>=duration)return;
  const envelope=Math.sin(Math.PI*t/duration)**2,factor=this.head?1:.32;
  const yaw=this.kind==='glance'?(this.side||1)*.075*envelope:0,pitch=this.kind==='acknowledge'?Math.sin(t/duration*Math.PI*2)*.045*envelope:this.kind==='settle'?.022*envelope:0;
  this.base.copy(this.subject.quaternion);this.subject.updateWorldMatrix(true,false);this.subject.getWorldQuaternion(this.worldQ).invert();
  this.axis.set(0,1,0).applyQuaternion(this.worldQ);this.subject.quaternion.multiply(this.delta.setFromAxisAngle(this.axis,yaw*factor));
  this.model.getWorldQuaternion(this.worldQ);this.axis.set(1,0,0).applyQuaternion(this.worldQ);this.subject.getWorldQuaternion(this.worldQ).invert();this.axis.applyQuaternion(this.worldQ);
  this.subject.quaternion.multiply(this.delta.setFromAxisAngle(this.axis,pitch*factor));this.applied=true;
 }
}
