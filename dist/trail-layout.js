import{orderFor,activity}from'./expedition.js';
import{routeHalfWidth}from'./expedition-composition.js';
import{CHAPTER_SPAN,stretchZ}from'./runner-mode.js';
// Classic lengths; runner mode stretches every gap between gates (see runner-mode.js).
export const CHAPTER_LENGTH=CHAPTER_SPAN,TRAIL_WIDTH=3.2,END={x:0,z:stretchZ(-666)},START={x:0,z:6};
export const CHAPTERS=[['The silent spring','Fern Hollow','Willow Bend'],['The broken crossing','Root Passage','River Ledge'],['The missing signal','Lantern Rise','Mossy Steps'],['The hidden supplies','Bramble Hollow','Stone Gallery'],['The wind sanctuary','Echo Approach','Crystal Turn']];
export function chapterPath(chapter,side){const z=-chapter*132,s=side==='left'?-1:1;return[{x:0,z:z+2},{x:s*6,z:z-9},{x:s*10,z:z-28},{x:s*11,z:z-58},{x:s*10,z:z-88},{x:s*6,z:z-118},{x:0,z:z-130}].map(p=>({x:p.x,z:stretchZ(p.z)}));}
export function nodesFor(e,chapter,side){const copy={...e,choices:e.choices.slice()};copy.choices[chapter]=side;const order=orderFor(copy,chapter),path=chapterPath(chapter,side);return order.map((type,i)=>({...activity(type),...path[i+2],id:`task-${chapter*4+i}-${side}`,index:chapter*4+i,chapter,side,type}));}
export function nearestOnSegment(p,a,b){const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz)));return{x:a.x+dx*t,z:a.z+dz*t,distance:Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t),t};}
export function pathDistance(p,path){let d=Infinity;for(let i=1;i<path.length;i++)d=Math.min(d,nearestOnSegment(p,path[i-1],path[i]).distance);return d;}
export function pathFor(e,chapter){return chapterPath(chapter,e.choices[chapter]||'left');}
export function activeNode(e){if(e.index>=20)return{id:'exit',index:20,...END,type:'exit',object:'Wind sanctuary',label:'Finish expedition'};const chapter=Math.floor(e.index/4),side=e.choices[chapter];return side?nodesFor(e,chapter,side)[e.index%4]:null;}
// The reward chest sits on the merged trail just before the next fork.
export function chestPoint(chapter){return{x:0,z:-(chapter+1)*CHAPTER_LENGTH+7};}
export function approachPoint(node){if(node.side&&node.index<20){const previous=chapterPath(node.chapter,node.side)[node.index%4+1],dx=node.x-previous.x,dz=node.z-previous.z,len=Math.hypot(dx,dz);return{x:node.x-dx/len*3.8,z:node.z-dz/len*3.8};}return{x:node.x,z:node.z+3.7};}
export function trailAllowed(e,p,r=.24){if(!Number.isFinite(p.x)||!Number.isFinite(p.z)||p.z>9-r||p.z<END.z-3)return false;for(let c=0;c<5;c++){if(c*4>e.index)break;const side=e.choices[c];if(!side){if(c*4===e.index)return Math.hypot(p.x,p.z-(-c*CHAPTER_LENGTH+2))<5-r;break;}if(pathDistance(p,chapterPath(c,side))<=routeHalfWidth(e,p)-r){const node=activeNode(e);if(node&&node.type!=='exit'&&p.z<node.z+2+r)return false;if(c===0&&p.z>2&&Math.abs(p.x)>3)return false;return true;}}if(e.index>=20&&pathDistance(p,[{x:0,z:stretchZ(-658)},END])<routeHalfWidth(e,p)-r)return true;return e.index===0&&Math.abs(p.x)<3-r&&p.z>=0&&p.z<=9-r;}
export function routeTo(e,player,target){const c=Math.min(4,Math.floor(e.index/4)),path=pathFor(e,c),points=[];let nearest=0,best=Infinity;path.forEach((p,i)=>{const d=Math.hypot(p.x-player.x,p.z-player.z);if(d<best){best=d;nearest=i;}});if(path[nearest].z>player.z+1)nearest++;for(let i=nearest;i<path.length&&path[i].z>target.z;i++)points.push({...path[i]});points.push({...target});return points;}
