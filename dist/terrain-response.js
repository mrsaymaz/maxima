const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
// Presentation only: never alters navigation position, jump timing or collision.
export class TerrainResponse{
 constructor(){this.previous=null;this.speed=0;this.slope=0;this.brake=0;}
 update(dt,nav,{enabled=true}={}){
  const p=nav.player||{x:0,z:0},step=Number.isFinite(dt)?clamp(dt,0,.1):0;
  if(!enabled||!step||!this.previous||Math.hypot(p.x-this.previous.x,p.z-this.previous.z)>2){this.previous={...p};this.speed=0;this.slope=0;this.brake=0;return{pace:0,terrain:0,brake:0};}
  const distance=Math.hypot(p.x-this.previous.x,p.z-this.previous.z),raw=nav.passiveCarry?0:Math.min(5,distance/step),old=this.speed;this.previous={...p};this.speed+=(raw-this.speed)*(1-Math.exp(-step*13));
  if(nav.grounded!==false&&nav.jumpStage==='ground'&&typeof nav.support==='function'){
   const x=Math.sin(nav.heading||0)*.4,z=Math.cos(nav.heading||0)*.4,a=nav.support({x:p.x+x,z:p.z+z}),b=nav.support({x:p.x-x,z:p.z-z}),target=Number.isFinite(a)&&Number.isFinite(b)?clamp(Math.atan2(a-b,.8)*.22,-.035,.035):0;
   this.slope+=(target-this.slope)*(1-Math.exp(-step*9));this.brake=Math.max(this.brake,raw<.25&&old>1?clamp(old/3,0,1):0);this.brake=Math.max(0,this.brake-step*3.5);
  }else{this.slope=0;this.brake=0;}
  return{pace:this.speed,terrain:this.slope,brake:this.brake};
 }
}
