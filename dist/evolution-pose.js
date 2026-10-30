import * as T from './vendor/three.module.min.js';
// Authored source clips supply joint motion; parent staging never stretches anatomy.
export class EvolutionPose{
 constructor(form){this.model=form.model;this.mixer=new T.AnimationMixer(form.model);const clips=form.clips||[],idle=clips.find(c=>c.name==='Idle'),cast=clips.find(c=>c.name==='Cast');this.idle=idle?this.mixer.clipAction(idle).play():null;this.cast=cast?this.mixer.clipAction(cast).setLoop(T.LoopOnce,1).setEffectiveTimeScale(0).setEffectiveWeight(0).play():null;this.closed=false;}
 update(dt,frame,isNew){if(this.closed)return;const a=frame.pose.anticipation,weight=this.cast?Math.min(.65,a*(isNew?.42:.62)):0;if(this.idle)this.idle.setEffectiveWeight(1-weight);if(this.cast){this.cast.setEffectiveWeight(weight);this.cast.time=this.cast.getClip().duration*(isNew?.72+.28*frame.clear:.06+.28*a);}this.mixer.update(Math.max(0,dt));}
 dispose(){if(this.closed)return;this.closed=true;this.mixer.stopAllAction();this.mixer.uncacheRoot(this.model);}
}
