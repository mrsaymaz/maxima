// Keep exploration framing tied to terrain while the creature visibly jumps.
export class CameraGround{
 constructor(){this.y=null;}
 update(dt,{footY=0,grounded=true,reset=false}={}){
  if(!Number.isFinite(footY))footY=0;
  if(reset||this.y===null){this.y=footY;return this.y;}
  if(grounded){if(Math.abs(footY-this.y)>3)this.y=footY;else this.y+=(footY-this.y)*(1-Math.exp(-(Number.isFinite(dt)?Math.max(0,dt):0)*14));}
  return this.y;
 }
}
