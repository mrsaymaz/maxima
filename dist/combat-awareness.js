import * as T from './vendor/three.module.min.js';
export const ATTACK_PHASES=new Set(['windup','charge','seedwindup','seedstrike','sporewindup','pulse']);
export function combatThreats(combat,player){return(combat?.group||[]).filter(r=>r.active&&r.phase!=='defeated'&&r.hp>0&&Math.hypot(r.x-player.x,r.z-player.z)<10).map(r=>({id:r.id,x:r.x,z:r.z,r:(r.spec?.radius||.6)+.12,h:r.spec?.kind==='spore'?1.25:1.45,urgent:ATTACK_PHASES.has(r.phase),phase:r.phase})).sort((a,b)=>Number(b.urgent)-Number(a.urgent)||Math.hypot(a.x-player.x,a.z-player.z)-Math.hypot(b.x-player.x,b.z-player.z));}
export function threatPins(threats,camera,viewport,cast=null){
 camera.updateMatrixWorld(true);const pins=[],forward=new T.Vector3();camera.getWorldDirection(forward);const cameraRight=new T.Vector3(1,0,0).applyQuaternion(camera.quaternion),w=viewport.width,h=viewport.height,left=viewport.left||0,top=viewport.top||0;
 const marginX=26,minY=Math.min(142,h*.28),maxY=Math.max(minY+40,h-150),cx=w/2,cy=(minY+maxY)/2;
 for(const t of threats.filter(t=>t.urgent)){const point=new T.Vector3(t.x,t.h*.65,t.z),delta=point.clone().sub(camera.position),front=delta.dot(forward)>0,ndc=point.clone().project(camera),clear=!cast||cast(camera.position,point,0,.08).fraction>.97;
  if(front&&Math.abs(ndc.x)<.90&&ndc.y>-.7&&ndc.y<.85&&clear)continue;
  let dx=front?ndc.x:delta.dot(cameraRight)/Math.max(.01,delta.length())*1.4,dy=front?-ndc.y:1;if(!Number.isFinite(dx)||!Number.isFinite(dy)){dx=0;dy=1;}
  const len=Math.hypot(dx,dy)||1;dx/=len;dy/=len;const sx=(w/2-marginX)/Math.max(.001,Math.abs(dx)),sy=(dy<0?cy-minY:maxY-cy)/Math.max(.001,Math.abs(dy)),scale=Math.min(sx,sy);let x=cx+dx*scale,y=cy+dy*scale;
  // Spread simultaneous warnings around the perimeter rather than stacking over one target.
  const vertical=Math.abs(dx)>.65,baseX=x,baseY=y;for(const offset of[0,36,-36,72,-72,108,-108]){const xx=vertical?baseX:Math.max(marginX,Math.min(w-marginX,baseX+offset)),yy=vertical?Math.max(minY,Math.min(maxY,baseY+offset)):baseY;if(pins.every(p=>Math.hypot(xx+left-p.x,yy+top-p.y)>=32)){x=xx;y=yy;break;}}
  pins.push({id:t.id,x:x+left,y:y+top,angle:Math.atan2(dy,dx),phase:t.phase});if(pins.length===3)break;
 }return pins;
}
export class ThreatOverlay{
 constructor(container){this.container=container;this.nodes=new Map();}
 update(pins=[]){if(!this.container)return;const ids=new Set(pins.map(p=>p.id));for(const[id,node]of this.nodes)if(!ids.has(id)){node.remove();this.nodes.delete(id);}for(const p of pins){let node=this.nodes.get(p.id);if(!node){node=document.createElement('div');node.className='threat-pin';node.innerHTML='<svg viewBox="0 0 28 28" aria-hidden="true"><path d="m19 14-8-8v16z"/><circle cx="10" cy="14" r="1.5"/></svg>';this.container.append(node);this.nodes.set(p.id,node);}node.style.left=p.x+'px';node.style.top=p.y+'px';node.style.setProperty('--threat-angle',p.angle+'rad');}}
 clear(){this.update([]);}
}
