import{configureTrial,movingPose,runPlan}from'./path-trials-layout.js';
import{chapterPath,nodesFor,approachPoint}from'./trail-layout.js';
export const TRAVERSAL_KINDS=['coins','rocks','plants','steps'];
export function localPoint(section,s,lateral=0){return{x:section.start.x+section.forward.x*s+section.right.x*lateral,z:section.start.z+section.forward.z*s+section.right.z*lateral};}
export function courseCoordinates(section,p){const x=p.x-section.start.x,z=p.z-section.start.z;return{s:x*section.forward.x+z*section.forward.z,lateral:x*section.right.x+z*section.right.z};}
export function sectionFor(e,index,mode='relaxed',side=e.choices[Math.floor(index/4)]){
 if(index<0||index>=20||!side)return null;const chapter=Math.floor(index/4),n=index%4,path=chapterPath(chapter,side),node=nodesFor(e,chapter,side)[n],end=approachPoint(node),previous=path[n+1];let start={...previous};if(n>0){const dx=end.x-start.x,dz=end.z-start.z,len=Math.hypot(dx,dz);start={x:start.x+dx/len*2.5,z:start.z+dz/len*2.5};}
 const dx=end.x-start.x,dz=end.z-start.z,length=Math.hypot(dx,dz),forward={x:dx/length,z:dz/length},right={x:-forward.z,z:forward.x},plan=e.adventureVersion===2?runPlan(e,chapter):null,kind=plan?plan.kinds[n]:TRAVERSAL_KINDS[(index+e.area)%4],section={id:`${e.id}:travel:${index}`,index,chapter,side,kind,area:e.area,adventure:e.adventureVersion,rival:plan?n===plan.rivalAt:undefined,rivalKind:plan?.rival,start,end,length,forward,right,yaw:Math.atan2(right.z,right.x),platforms:[],plants:[],coins:[]};
 const savedEnemy=e.travel?.encounters?.[section.id+':rival'];section.enemyKind=savedEnemy?(savedEnemy.kind||'ram'):null;
 if(kind==='rocks'){
  section.pool={from:4,to:length-3.8,width:6.8};const spacing=mode==='challenge'?2.65:2.62,count=Math.max(3,Math.ceil((section.pool.to-section.pool.from-2.2)/spacing)+1),first=section.pool.from+1.1,last=section.pool.to-1.1;
  for(let i=0;i<count;i++){const s=first+(last-first)*i/(count-1),lateral=(i%2?1:-1)*(mode==='challenge'?.55:.30),r=mode==='challenge'?1.08:1.23;section.platforms.push({id:`${section.id}:rock:${i}`,s,lateral,...localPoint(section,s,lateral),r,y:.20,fragile:chapter>0&&i>0&&i<count-1&&i%2===1,crumbleAfter:mode==='challenge'?1.35:2.2});}
 }
 if(kind==='plants')for(let i=0;i<3;i++){const s=5+i*(length-10)/2,lateral=(i%2?1:-1)*1.35;section.plants.push({id:`${section.id}:plant:${i}`,s,lateral,...localPoint(section,s,lateral),r:.62,cloudRadius:mode==='challenge'?2.05:1.65,phase:(index*.37+i*.91)%6,period:mode==='challenge'?4.8:6.4,warning:1.25,active:mode==='challenge'?2.0:1.5});}
 if(kind==='steps')for(let i=0;i<8;i++){const depth=1.65,s=5+i*depth,y=.18*(i<4?i+1:8-i);section.platforms.push({id:`${section.id}:step:${i}`,s,lateral:0,...localPoint(section,s),hx:2.65,hz:depth/2+.02,y,shape:'step'});}
 const coinPoints=kind==='rocks'?section.platforms.map(p=>({s:p.s,lateral:p.lateral,y:p.y+.58})):Array.from({length:7},(_,i)=>({s:3+(length-6)*i/6,lateral:kind==='plants'?(i%2?-.85:.85):Math.sin(i*.9)*.65,y:kind==='steps'?(i>0&&i<6?.95:.58):.58}));
 coinPoints.forEach((p,i)=>section.coins.push({id:`${section.id}:coin:${i}`,value:1,...p,...localPoint(section,p.s,p.lateral)}));configureTrial(section,e,mode);for(const coin of section.coins)coin.y+=approachHeight(section,coin.s);return section;
}
export function sectionsFor(e,mode='relaxed'){const all=[];for(let i=0;i<20;i++){const s=sectionFor(e,i,mode);if(s)all.push(s);}return all;}
export function plantPhase(plant,time){const phase=((time+plant.phase)%plant.period+plant.period)%plant.period;return phase<plant.active?'active':phase>plant.period-plant.warning?'warning':'rest';}
export function approachHeight(section,s){if(section.trial||section.index%3!==0||s<.4||s>3.8)return 0;const t=(s-.4)/3.4*12,i=Math.min(11,Math.floor(t)),f=t-i,h=k=>Math.sin(Math.PI*k/12)**2*(.22+section.area*.10);return h(i)*(1-f)+h(i+1)*f;}
export function surfaceOnCourse(course,p,radius=.24,crumble=null,time=0){
 for(const section of course){const q=courseCoordinates(section,p);if(Math.abs(q.lateral)>3.4||q.s<0||q.s>section.length)continue;if(!section.trial&&q.s<=3.8)return approachHeight(section,q.s);
  if(section.kind==='rocks'&&q.s>section.pool.from&&q.s<section.pool.to){let top=null;for(const rock of section.platforms)if(!crumble?.get(rock.id)?.fallen&&Math.hypot(p.x-movingPose(section,rock,time).x,p.z-movingPose(section,rock,time).z)<=rock.r-Math.min(.18,radius*.23))top=Math.max(top??-.5,rock.y);return top;}
  if(section.trial?.kind==='bonus'){let top=0;for(const rock of section.platforms)if(Math.hypot(p.x-rock.x,p.z-rock.z)<rock.r-Math.min(.18,radius*.23))top=Math.max(top,rock.y);return top;}
  if(section.kind==='steps'){let top=0;for(const step of section.platforms)if(Math.abs(q.lateral)<=step.hx&&Math.abs(q.s-step.s)<=step.hz)top=Math.max(top,step.y);return top;}
 }return 0;
}
