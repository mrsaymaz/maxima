import{test}from'node:test';import assert from'node:assert/strict';import * as T from'../dist/vendor/three.module.min.js';import{PartnerLocomotion}from'../dist/locomotion.js';
test('moving casts retain locomotion, jump blend is bounded, and mixer weights remain normalized',()=>{
 const root=new T.Group(),bone=new T.Bone();bone.name='TestBody';root.add(bone);const clips=['Idle','Walk','Jump','Cast'].map(name=>new T.AnimationClip(name,1,[new T.QuaternionKeyframeTrack('TestBody.quaternion',[0,1],[0,0,0,1,0,0,0,1])]));const m=new PartnerLocomotion(root,clips);let x=0;
 for(let i=0;i<60;i++){x+=.04;m.update(1/60,{x,z:0},true,null,{attack:{partner:'hufflepuff',ranged:true,age:.18,duration:.6}});const cast=m.actions.get('Cast').getEffectiveWeight();assert.ok(cast<=.72+1e-8);assert.ok(Math.abs(cast+m.walk.getEffectiveWeight()+m.idle.getEffectiveWeight()+m.jump.getEffectiveWeight()-1)<1e-7);}
 m.update(1/60,{x,z:0},true,.2);assert.ok(m.jumpBlend>0&&m.jumpBlend<1);for(let i=0;i<120;i++)m.update(1/60,{x,z:0},true,null);assert.ok(m.jumpBlend<.001);assert.ok(bone.quaternion.toArray().every(Number.isFinite));m.dispose();
});
