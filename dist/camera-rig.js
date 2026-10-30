import{cameraSettings}from'./world-layout.js';import{cameraCast}from'./solids.js';
// Exploration is always third person: low behind the creature, looking ahead toward the next goal.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// True when every corner of every box projects inside the shrunken frustum.
export function framesBoxes(position,target,boxes,fov,aspect=1,margin=.88){
 const dx=target.x-position.x,dy=target.y-position.y,dz=target.z-position.z,len=Math.hypot(dx,dy,dz)||1,f={x:dx/len,y:dy/len,z:dz/len},rl=Math.hypot(f.x,f.z)||1,right={x:-f.z/rl,y:0,z:f.x/rl},up={x:-f.y*right.z,y:f.x*right.z-f.z*right.x,z:f.y*right.x},limit=Math.tan(fov*Math.PI/360)*margin;
 for(const box of boxes)for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z]){const v={x:x-position.x,y:y-position.y,z:z-position.z},depth=v.x*f.x+v.y*f.y+v.z*f.z;if(depth<=.1||Math.abs(v.x*right.x+v.z*right.z)>depth*limit*aspect||Math.abs(v.x*up.x+v.y*up.y+v.z*up.z)>depth*limit)return false;}
 return true;
}
export class CreatureCamera{
 constructor(){this.yaw=Math.PI;this.inputYaw=null;}
 movement(x,z){if(Math.hypot(x,z)<.05){this.inputYaw=null;return{x:0,z:0};}this.inputYaw??=this.yaw;return{x:-x*Math.cos(this.inputYaw)-z*Math.sin(this.inputYaw),z:x*Math.sin(this.inputYaw)-z*Math.cos(this.inputYaw)};}
 sample({player,footY=0,groundY=footY,level=0,view='explore',area=0,mobile=false,zoom=1,heading=this.yaw,focus=null,taskStyle='front',rival=null,cast=cameraCast,frameFocus=false,focusBounds=null,aspect=1,combatFocus=null,bodyBounds=null,combatThreats=[],combatBlend=0,goal=null,scenicFocus=null}){
  const rig=cameraSettings(level,mobile,view),head={x:player.x,y:footY+rig.height*.72,z:player.z};if(view==='explore')this.yaw=heading;
  let target={x:player.x,y:footY+rig.targetY,z:player.z},anchor=null,yaw=view==='explore'?this.yaw:heading,actorYaw=heading,fov=view==='explore'?(mobile?60:48):40;
  const growth=Math.max(0,Math.min(1,(rig.height-.65)/1.53)),combat=view==='explore'&&combatFocus?clamp(combatBlend,0,1):0,half=rig.height*.78,hx=bodyBounds?Math.abs(Math.cos(heading))*bodyBounds.halfWidth+Math.abs(Math.sin(heading))*bodyBounds.halfDepth:half,hz=bodyBounds?Math.abs(Math.sin(heading))*bodyBounds.halfWidth+Math.abs(Math.cos(heading))*bodyBounds.halfDepth:half,playerBox={min:{x:player.x-hx,y:footY,z:player.z-hz},max:{x:player.x+hx,y:footY+rig.height,z:player.z+hz}};
  if(view==='explore'){
   // Aim well ahead of the creature so it sits in the lower third with the route above it.
   const lead=rig.lookAhead/Math.max(.7,zoom);anchor={...target,y:groundY+rig.targetY};target.y=groundY+rig.lookY;target.x+=Math.sin(yaw)*lead;target.z+=Math.cos(yaw)*lead;
   let scenicShift=0;if(scenicFocus&&!combat&&aspect<1.15){const dx=scenicFocus.x-player.x,dz=scenicFocus.z-player.z,d=Math.hypot(dx,dz),ahead=dx*Math.sin(yaw)+dz*Math.cos(yaw),side=dx*Math.cos(yaw)-dz*Math.sin(yaw);if(d>30&&d<110&&ahead>d*.7){const strength=clamp(scenicFocus.strength,0,1),shift=scenicShift=clamp(side*.20,-1.5,1.5)*strength;target.x+=Math.cos(yaw)*shift;target.z-=Math.sin(yaw)*shift;target.y+=.08*strength;}}
   if(goal&&!combat){const gx=goal.x-player.x,gz=goal.z-player.z,dist=Math.hypot(gx,gz),ahead=gx*Math.sin(yaw)+gz*Math.cos(yaw),side=gx*Math.cos(yaw)-gz*Math.sin(yaw);if(dist>1.5&&dist<32&&ahead>0){const shift=clamp(scenicShift+clamp(side*.32,-1.5,1.5)*Math.min(1,(32-dist)/10),-1.5,1.5)-scenicShift;target.x+=Math.cos(yaw)*shift;target.z-=Math.sin(yaw)*shift;}}
  }
  let rivalBox=null,groupBoxes=[];
  if(combat){
   // Combat framing keeps the creature and its rival on screen together, whatever their spacing.
   const rh=combatFocus.h||1.6,rr=combatFocus.r||.7,mid={x:player.x*.55+combatFocus.x*.45,y:footY+Math.max(rig.height,rh)*.45,z:player.z*.55+combatFocus.z*.45};rivalBox={min:{x:combatFocus.x-rr,y:0,z:combatFocus.z-rr},max:{x:combatFocus.x+rr,y:rh,z:combatFocus.z+rr}};
   const nearby=combatThreats.filter(t=>t.urgent&&Math.hypot(t.x-player.x,t.z-player.z)<6.5&&(t.x-player.x)*Math.sin(yaw)+(t.z-player.z)*Math.cos(yaw)>-1.0).slice(0,3);
   groupBoxes=nearby.map(t=>({min:{x:t.x-t.r,y:0,z:t.z-t.r},max:{x:t.x+t.r,y:t.h,z:t.z+t.r}}));
   if(nearby.length>1){const x=nearby.reduce((n,t)=>n+t.x,0)/nearby.length,z=nearby.reduce((n,t)=>n+t.z,0)/nearby.length;mid.x+=clamp((x-combatFocus.x)*.22,-.7,.7);mid.z+=clamp((z-combatFocus.z)*.22,-.7,.7);}
   for(const k of['x','y','z']){target[k]+=(mid[k]-target[k])*combat;if(anchor)anchor[k]+=(mid[k]-anchor[k])*combat;}
  }
  if(view==='home'){target.x+=rig.homeOffsetX;yaw=Math.PI;actorYaw=0;}
  if(view==='battle'&&rival){target.x=(player.x+rival.x)/2;target.z=(player.z+rival.z)/2;target.y=footY+Math.max(rig.targetY,1.05);yaw=Math.PI;actorYaw=Math.atan2(rival.x-player.x,rival.z-player.z);}
  if(view==='focus'){
   const toward=focus?Math.atan2(focus.x-player.x,focus.z-player.z):heading;
   const bias=taskStyle==='front'?.16:.32;if(focus){target.x=player.x*(1-bias)+focus.x*bias;target.z=player.z*(1-bias)+focus.z*bias;}
   yaw=taskStyle==='front'?toward+Math.PI:toward+Math.PI/2;actorYaw=toward;fov=44;if(frameFocus&&focus){target.x=(player.x+focus.x)/2;target.z=(player.z+focus.z)/2;target.y=footY+Math.max(rig.targetY,1.15);yaw=toward+Math.PI+Math.PI/3;}
  }
  const normalDistance=rig.cameraZ/zoom,distance=normalDistance+((3.4+growth*2)/zoom-normalDistance)*combat,height=rig.cameraY/zoom+((2.2+growth*2.2)/zoom-rig.cameraY/zoom)*combat,contextDistance=frameFocus&&view==='focus'&&focus?Math.hypot(focus.x-player.x,focus.z-player.z)*1.4+1:0,framedDistance=Math.max(distance,contextDistance),framedHeight=Math.max(height,contextDistance*.6),
   fitBoxes=frameFocus&&view==='focus'&&focusBounds?[focusBounds,playerBox]:rivalBox&&combat>.02?[playerBox,rivalBox]:view==='explore'?[playerBox]:null,candidate=a=>{
   let scale=1,position;for(let attempt=0;attempt<24;attempt++){const base=anchor||target;position={x:base.x-Math.sin(a)*framedDistance*scale,y:base.y+framedHeight*scale,z:base.z-Math.cos(a)*framedDistance*scale};if(!fitBoxes||framesBoxes(position,target,fitBoxes,fov,aspect))break;scale*=1.1;}
   // Extra attackers may widen the established focus framing by at most 34%; distant/behind threats use edge cues.
   if(groupBoxes.length){const start=scale,base=anchor||target;for(let i=0;i<5&&!framesBoxes(position,target,[playerBox,...groupBoxes],fov,aspect);i++){scale=Math.min(start*1.34,scale*1.06);position={x:base.x-Math.sin(a)*framedDistance*scale,y:base.y+framedHeight*scale,z:base.z-Math.cos(a)*framedDistance*scale};}}
   // A close rival must stay visible over the creature: lift the camera until the sight line clears its head.
   if(rivalBox&&combat>.02){const dp=Math.hypot(position.x-player.x,position.z-player.z),d=Math.hypot(combatFocus.x-player.x,combatFocus.z-player.z);if(d>.05){const need=((footY+rig.height*1.1)*(dp+d)-.55*dp)/d;if(position.y<need)position.y+=(need-position.y)*combat;}}
   return position;
  };let position=candidate(yaw);
  if(view!=='home'){
   const angles=view==='explore'?[yaw]:[yaw,yaw+Math.PI/6,yaw-Math.PI/6,yaw+Math.PI/3,yaw-Math.PI/3,yaw+Math.PI];let best=null;
   for(const a of angles){const result=cast(head,candidate(a),area,.1),score=Math.hypot(result.x-head.x,result.y-head.y,result.z-head.z);if(!best||score>best.score)best={...result,score};if(result.fraction>.98)break;}
   if(view==='explore'&&best.score<Math.max(1.5,rig.height*1.15,(bodyBounds?.halfDepth||0)+.45)){
    const overhead={x:head.x-Math.sin(yaw)*rig.radius*.55,y:head.y+2+rig.height*1.3,z:head.z-Math.cos(yaw)*rig.radius*.55},safe=cast(head,overhead,area,.1),score=Math.hypot(safe.x-head.x,safe.y-head.y,safe.z-head.z);if(score>best.score)best={...safe,score};
   }
   position={x:best.x,y:best.y,z:best.z};
  }
  if(view==='focus'&&taskStyle==='front')actorYaw=Math.atan2(position.x-player.x,position.z-player.z);
  return{position,target,fov,head,firstPerson:false,actorYaw};
 }
}
