import{courseCoordinates}from'./traversal-layout.js';
export function demandingEncounter(nav){
 const foes=(nav.combat?.group||[]).filter(e=>e.active&&e.phase!=='defeated'&&Math.hypot(nav.player.x-e.x,nav.player.z-e.z)<11);
 if(foes.length)return{active:true,x:nav.player.x,z:nav.player.z,radius:13};
 const s=nav.section;if(s){const q=courseCoordinates(s,nav.player),done=nav.state.travel?.completed?.includes(s.index);if(!done&&q.s>2&&q.s<s.length-2&&(s.trial||['rocks','plants'].includes(s.kind)))return{active:true,x:nav.player.x,z:nav.player.z,radius:11};}
 return{active:false,x:nav.player.x,z:nav.player.z,radius:11};
}
export class VisualHierarchy{
 constructor(){this.strength=0;this.scenicTime=0;}
 update(dt,nav,{enabled=true}={}){const focus=demandingEncounter(nav),target=enabled&&focus.active?1:0;this.strength+=(target-this.strength)*(1-Math.exp(-Math.max(0,dt)*5));if(this.strength<.001)this.strength=0;this.scenicTime+=Math.max(0,dt)*(1-this.strength*.8);return{...focus,strength:this.strength,scenicTime:this.scenicTime};}
}
