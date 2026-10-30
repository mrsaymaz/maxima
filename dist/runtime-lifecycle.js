// Hold simulation after interruption. The student resumes explicitly, with cleared input.
export class RuntimeLifecycle{
 constructor(world,{doc=globalThis.document,win=globalThis.window,notify=()=>{}}={}){
  this.world=world;this.doc=doc;this.win=win;this.notify=notify;this.suspended=false;this.contextLost=false;this.losses=0;this.restores=0;this.resumes=0;this.listeners=[];
  const canvas=world.renderer.domElement;this.listen(canvas,'webglcontextlost',event=>{event.preventDefault();this.contextLost=true;this.losses++;this.pause('graphics');});
  this.listen(canvas,'webglcontextrestored',()=>{this.contextLost=false;this.restores++;if(world.renderer.info)world.renderer.info.autoReset=false;if(world.sun?.shadow)world.sun.shadow.needsUpdate=true;world.post?.dispose();world.renderer.state?.reset?.();world.scene.traverse(o=>{if(o.geometry){for(const a of Object.values(o.geometry.attributes||{}))a.needsUpdate=true;if(o.geometry.index)o.geometry.index.needsUpdate=true;}if(o.instanceMatrix)o.instanceMatrix.needsUpdate=true;if(o.instanceColor)o.instanceColor.needsUpdate=true;if(o.skeleton?.boneTexture)o.skeleton.boneTexture.needsUpdate=true;});world.resize();this.notify('restored');});
  this.listen(doc,'visibilitychange',()=>{if(doc.hidden)this.pause('background');else if(this.suspended)this.notify(this.contextLost?'graphics':'paused');});
  this.listen(win,'pagehide',()=>this.pause('background'));this.listen(win,'pageshow',event=>{if(event.persisted)this.pause('paused');});
 }
 listen(target,name,fn){target?.addEventListener?.(name,fn);this.listeners.push([target,name,fn]);}
 pause(reason){const w=this.world;this.suspended=true;w.runtimePaused=true;w.keys?.clear();w.setInput(0,0);w.nav.stop();w.clock?.getDelta();w.metricsWasHidden=true;w.adaptiveResolution?.reset(globalThis.performance?.now?.()||0);w.onSuspend?.(reason);this.notify(reason);}
 resume(){if(this.contextLost)return false;const w=this.world;this.suspended=false;w.runtimePaused=false;this.resumes++;w.keys?.clear();w.setInput(0,0);w.clock?.getDelta();w.metricsWasHidden=true;w.adaptiveResolution?.reset(globalThis.performance?.now?.()||0);w.nav.invincible=Math.max(w.nav.invincible||0,1);const combat=w.guardianStage?.combat;if(combat?.state)combat.state.invulnerable=Math.max(combat.state.invulnerable||0,1);w.onResume?.();this.notify('running');return true;}
 snapshot(){return{paused:this.suspended,contextLost:this.contextLost,contextLosses:this.losses,contextRestores:this.restores,resumes:this.resumes};}
 dispose(){for(const[t,n,fn]of this.listeners)t?.removeEventListener?.(n,fn);this.listeners=[];}
}
