// Speed belongs to movement, never to language mastery. All timers use active
// simulation time; reading, menus and hidden tabs do not consume a chain/boost.
export class RushMotion{
 constructor(){this.speed=2.6;this.fuel=.7;this.boost=0;this.chain=0;this.best=0;this.chainTime=0;this.coins=0;}
 start(){if(this.fuel<.25||this.boost>0)return false;this.boost=1.25;return true;}
 collect(){this.fuel=Math.min(1,this.fuel+.075);this.chain=this.chainTime>0?this.chain+1:1;this.best=Math.max(this.best,this.chain);this.chainTime=3.5;this.coins++;}
 reset(){this.speed=2.6;this.boost=0;this.chain=0;this.chainTime=0;}
 update(dt,{moving=false,safe=false,gateDistance=Infinity,blocked=false,recovery=false}={}){
  dt=Math.max(0,Math.min(.05,dt));if(recovery||blocked){this.reset();return 2.6;}
  if(this.chainTime>0){this.chainTime=Math.max(0,this.chainTime-dt);if(!this.chainTime)this.chain=0;}
  const allowed=safe&&gateDistance>7;if(!allowed)this.boost=0;
  if(this.boost>0&&moving){this.boost=Math.max(0,this.boost-dt);this.fuel=Math.max(0,this.fuel-dt*.38);if(this.fuel===0)this.boost=0;}
  const target=!moving?0:!allowed?2.6:this.boost>0?8.5:5.6,rate=target<this.speed?22:5;
  this.speed+=(target-this.speed)*(1-Math.exp(-dt*rate));if(!allowed)this.speed=Math.min(this.speed,2.6);
  return Math.max(0,this.speed);
 }
}
