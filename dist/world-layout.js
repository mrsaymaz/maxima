import{partnerInfo}from'./partners.js';
// Refresh the three updated models even on devices caching earlier static assets.
export const creatureAsset=(level,partner='hufflepuff')=>{const id=partnerInfo(partner).id;return `assets/creatures/${id}-${level}.glb${id==='hufflepuff'&&level>=1&&level<=3?'?animation=young-walk-v1':id==='gryffindor'?'?animation=fire-walk-v1':id==='ravenclaw'?'?animation=water-hop-v1':id==='slytherin'?'?animation=nature-sway-v1':''}`;};
// Creature-controlled exploration: stable world dimensions, growing bodies and camera framing.
export const FORM_HEIGHTS=[.65,.75,.85,.96,1.08,1.22,1.38,1.55,1.74,1.95,2.18];
export const CREATURE_RADII=[.24,.27,.30,.34,.38,.43,.49,.55,.62,.70,.78];
export function cameraSettings(level,mobile=false,view='explore'){
 const height=FORM_HEIGHTS[level]??FORM_HEIGHTS[0],growth=(height-FORM_HEIGHTS[0])/(FORM_HEIGHTS[10]-FORM_HEIGHTS[0]);
 const values=view==='home'?[1.8+1.9*growth,2.7+2.8*growth]:view==='focus'?[1.3+1.6*growth,2.8+3.0*growth]:view==='battle'?[3.6+1.8*growth,5.4+2.7*growth]:[1.0+1.25*growth,3.05+2.9*growth];
 // Exploration sits low and further back, aimed ahead of the creature so it occupies the lower third and the route stays visible.
 return{height,radius:CREATURE_RADII[level]??CREATURE_RADII[0],cameraY:values[0]*(mobile?1.06:1),cameraZ:values[1]*(mobile?1.04:1),targetY:height*.6,leadZ:view==='explore'?-.45:0,lookAhead:view==='explore'?3.3+3.2*growth:0,lookY:height*(mobile?.86:.78),homeOffsetX:mobile?0:-(1.1+.75*growth)};
}
export const BOUNDS={left:-47,right:47,top:-39,bottom:39};
export const SPAWN={x:-29,z:23};
export const PLACES=[
 {id:'ranger',name:'Mosswing',action:'Talk',x:-26,z:18,kind:'creature',note:'A woodland elder’s request'},
 {id:'match',name:'Willow Spring',action:'Restore spring',x:-27,z:-8,kind:'task',note:'Word connections'},
 {id:'sentence',name:'Old Wind Bridge',action:'Repair bridge',x:4,z:-8,kind:'task',note:'Sentence paths'},
 {id:'qa',name:'Echo Watchtower',action:'Read signals',x:23,z:-23,kind:'task',note:'Question links'},
 {id:'wild',name:'Bramble Sprite',action:'Challenge',x:18,z:14,kind:'wild',note:'A wild training encounter'},
 {id:'guardian',name:'Guardian Gate',action:'Challenge guardian',x:35,z:-28,kind:'guardian',note:'The path to the next region'},
 {id:'camp',name:'Root Haven',action:'Return to camp',x:-35,z:25,kind:'camp',note:'Change your lesson or region'},
 {id:'sign',name:'Route sign',action:'Read sign',x:-13,z:14,kind:'sign',note:'Whisperwood routes'}
];
export const BUILDINGS=[{x:-35,z:19,w:7,d:6,type:'lodge'},{x:-23,z:28,w:6,d:5,type:'house'},{x:-12,z:29,w:6,d:5,type:'house'},{x:-39,z:8,w:6,d:6,type:'house'}];
export const ROUTES=[[[ -42,23],[34,23]], [[-14,23],[-14,-8],[-29,-8]], [[-14,-8],[27,-8],[27,-28],[39,-28]], [[18,23],[18,11]], [[-29,23],[-29,18]]];
export const GRASS=[{x:9,z:7,w:17,d:12},{x:-39,z:-25,w:14,d:11},{x:15,z:-35,w:14,d:7}];
export function segmentDistance(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);}
export function roadDistance(x,z){let min=Infinity;for(const r of ROUTES)for(let i=1;i<r.length;i++)min=Math.min(min,segmentDistance(x,z,r[i-1],r[i]));return min;}
export function makeTrees(){const trees=[];let seed=173;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};for(let i=0;i<470;i++){const x=-46+rnd()*92,z=-38+rnd()*76;if(roadDistance(x,z)<3.2||PLACES.some(p=>Math.hypot(x-p.x,z-p.z)<4)||BUILDINGS.some(b=>Math.abs(x-b.x)<b.w/2+2&&Math.abs(z-b.z)<b.d/2+2)||x>0&&x<8||GRASS.some(g=>x>g.x-1&&x<g.x+g.w+1&&z>g.z-1&&z<g.z+g.d+1))continue;trees.push({x,z,size:2.8+rnd()*1.8});}return trees;}
export const TREES=makeTrees();

export const LANTERNS=[[-16.3,21],[-16.3,-5],[18,-10.3],[29.3,-20],[-31,25]];
export const REGION_SITES=Array.from({length:12},(_,i)=>({x:12+(i%4)*7,z:-32+Math.floor(i/4)*9,index:i}));
export function roadsideSpots(){const spots=[];for(const route of ROUTES)for(let i=1;i<route.length;i++){const a=route[i-1],b=route[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]),ux=(b[0]-a[0])/len,uz=(b[1]-a[1])/len;for(let d=1;d<len;d+=1.75)for(const side of[-1,1]){const offset=1.38+.12*Math.sin(d*2),x=a[0]+ux*d-uz*offset*side,z=a[1]+uz*d+ux*offset*side;if(x>0&&x<8||BUILDINGS.some(h=>Math.hypot((x-h.x)/(h.w*.56),(z-h.z)/(h.d*.56))<1))continue;spots.push({x,z});}}return spots;}
export const ROADSIDE=roadsideSpots();
