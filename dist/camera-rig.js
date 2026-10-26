import{cameraSettings}from'./world-layout.js';import{cameraCast}from'./solids.js';
// Exploration is always third person, at a fixed angle behind the creature.
export class CreatureCamera{
 constructor(){this.yaw=Math.PI;this.inputYaw=null;}
 movement(x,z){if(Math.hypot(x,z)<.05){this.inputYaw=null;return{x:0,z:0};}this.inputYaw??=this.yaw;return{x:-x*Math.cos(this.inputYaw)-z*Math.sin(this.inputYaw),z:x*Math.sin(this.inputYaw)-z*Math.cos(this.inputYaw)};}
 sample({player,footY=0,level=0,view='explore',area=0,mobile=false,zoom=1,heading=this.yaw,focus=null,taskStyle='front',rival=null,cast=cameraCast,frameFocus=false,focusBounds=null,aspect=1,combatFocus=null,combatBlend=0}){
  const rig=cameraSettings(level,mobile,view),head={x:player.x,y:footY+rig.height*.72,z:player.z};if(view==='explore')this.yaw=heading;
  let target={x:player.x,y:footY+rig.targetY,z:player.z},yaw=view==='explore'?this.yaw:heading,actorYaw=heading,fov=view==='explore'?(mobile?64:48):40;
  if(view==='explore'){const lead=.45+rig.height*.12;target.x+=Math.sin(yaw)*lead;target.z+=Math.cos(yaw)*lead;}
  if(view==='explore'&&combatFocus&&combatBlend>0){const b=Math.max(0,Math.min(1,combatBlend));target.x+=(player.x*.6+combatFocus.x*.4-target.x)*b;target.z+=(player.z*.6+combatFocus.z*.4-target.z)*b;}
  if(view==='home'){target.x+=rig.homeOffsetX;yaw=Math.PI;actorYaw=0;}
  if(view==='battle'&&rival){target.x=(player.x+rival.x)/2;target.z=(player.z+rival.z)/2;target.y=footY+Math.max(rig.targetY,1.05);yaw=Math.PI;actorYaw=Math.atan2(rival.x-player.x,rival.z-player.z);}
  if(view==='focus'){
   const toward=focus?Math.atan2(focus.x-player.x,focus.z-player.z):heading;
   const bias=taskStyle==='front'?.16:.32;if(focus){target.x=player.x*(1-bias)+focus.x*bias;target.z=player.z*(1-bias)+focus.z*bias;}
   yaw=taskStyle==='front'?toward+Math.PI:toward+Math.PI/2;actorYaw=toward;fov=44;if(frameFocus&&focus){target.x=(player.x+focus.x)/2;target.z=(player.z+focus.z)/2;target.y=footY+Math.max(rig.targetY,1.15);yaw=toward+Math.PI+Math.PI/3;}
  }
  const growth=Math.max(0,Math.min(1,(rig.height-.65)/1.53)),combat=view==='explore'?Math.max(0,Math.min(1,combatBlend)):0,normalDistance=rig.cameraZ/zoom*(mobile&&view==='explore'?1+growth*.12:1),distance=normalDistance+((3.3+growth*1.6)/zoom-normalDistance)*combat,height=rig.cameraY/zoom+((3.6+growth*5.2)/zoom-rig.cameraY/zoom)*combat,contextDistance=frameFocus&&view==='focus'&&focus?Math.hypot(focus.x-player.x,focus.z-player.z)*1.4+1:0,framedDistance=Math.max(distance,contextDistance),framedHeight=Math.max(height,contextDistance*.6),candidate=a=>{
   let scale=1,position;for(let attempt=0;attempt<24;attempt++){position={x:target.x-Math.sin(a)*framedDistance*scale,y:target.y+framedHeight*scale,z:target.z-Math.cos(a)*framedDistance*scale};if(!frameFocus||view!=='focus'||!focusBounds)return position;
    const dx=target.x-position.x,dy=target.y-position.y,dz=target.z-position.z,len=Math.hypot(dx,dy,dz),f={x:dx/len,y:dy/len,z:dz/len},rl=Math.hypot(f.x,f.z),right={x:-f.z/rl,y:0,z:f.x/rl},up={x:-f.y*right.z,y:f.x*right.z-f.z*right.x,z:f.y*right.x},limit=Math.tan(fov*Math.PI/360)*.88,half=rig.height*.78,boxes=[focusBounds,{min:{x:player.x-half,y:footY,z:player.z-half},max:{x:player.x+half,y:footY+rig.height,z:player.z+half}}];let fits=true;
    for(const box of boxes)for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z]){const v={x:x-position.x,y:y-position.y,z:z-position.z},depth=v.x*f.x+v.y*f.y+v.z*f.z;if(depth<=.1||Math.abs(v.x*right.x+v.z*right.z)>depth*limit*aspect||Math.abs(v.x*up.x+v.y*up.y+v.z*up.z)>depth*limit)fits=false;}if(fits)return position;scale*=1.12;
   }return position;
  };let position=candidate(yaw);
  if(view!=='home'){
   const angles=view==='explore'?[yaw]:[yaw,yaw+Math.PI/6,yaw-Math.PI/6,yaw+Math.PI/3,yaw-Math.PI/3,yaw+Math.PI];let best=null;
   for(const a of angles){const result=cast(head,candidate(a),area,.1),score=Math.hypot(result.x-head.x,result.y-head.y,result.z-head.z);if(!best||score>best.score)best={...result,score};if(result.fraction>.98)break;}
   position={x:best.x,y:best.y,z:best.z};
  }
  if(view==='focus'&&taskStyle==='front')actorYaw=Math.atan2(position.x-player.x,position.z-player.z);
  return{position,target,fov,head,firstPerson:false,actorYaw};
 }
}
