// World collision metadata shares the same layout as the visible 3D props.
import{BOUNDS,BUILDINGS,TREES,PLACES,LANTERNS,REGION_SITES,ROADSIDE}from'./world-layout.js';
const worlds=new Map(),indexes=new Map(),CELL=4,EPS=.0005;
function build(area){const a=[];const add=(id,kind,shape,x,z,dimensions,minY,maxY,support=false)=>a.push({id,kind,shape,x,z,...dimensions,minY,maxY,support});
 for(let i=0;i<TREES.length;i++){const t=TREES[i];add('tree-'+i,'tree','circle',t.x,t.z,{r:.265},0,1.2+1.2*t.size/3.5);}
 for(let i=0;i<BUILDINGS.length;i++){const b=BUILDINGS[i];add('den-'+i,'den','ellipse',b.x,b.z,{rx:b.w*.515,rz:b.d*.515},0,2.4);add('roof-'+i,'roof','ellipse',b.x,b.z,{rx:b.w*.56,rz:b.d*.56},2.4,2.4+b.w*.56);for(const side of[-1,1]){add(`root-${i}-${side}`,'root','capsule',b.x+side*b.w*.43,b.z+b.d*.3,{ax:-.44,az:0,bx:.44,bz:0,r:.45},0,2.45);add(`mushroom-${i}-${side}`,'mushroom','circle',b.x+side*b.w*.42,b.z+b.d*.55,{r:.29},0,.79);}}
 const at=id=>PLACES.find(p=>p.id===id);let p=at('match');add('spring','mechanism','circle',p.x,p.z,{r:1.55},0,1.22);for(let i=0;i<3;i++){const t=i*Math.PI*2/3;add('spring-terminal-'+i,'mechanism','circle',p.x+Math.cos(t)*1.35,p.z+Math.sin(t)*1.35,{r:.31},0,1.27);}
 // Decks and altar pads are walkable support surfaces, never empty volume.
 add('wind-deck','bridge','box',4,-8,{hx:3.7,hz:1.9},0,.24,true);add('village-deck','bridge','box',4,23,{hx:3.7,hz:1.85},0,.145,true);
 for(const z of[-9.65,-6.35]){add('rail-'+z,'rail','box',4,z,{hx:3.8,hz:.09},.97,1.13);for(const x of[.6,7.4])add(`bridge-post-${x}-${z}`,'rail','box',x,z,{hx:.11,hz:.11},0,1.25);}
 p=at('qa');add('tower-pad','platform','circle',p.x,p.z,{r:2},0,.3,true);for(const side of[-1,1])add('tower-column-'+side,'stone','box',p.x+side*1.15,p.z,{hx:.19,hz:.19},0,3.8);add('tower-lintel','stone','box',p.x,p.z,{hx:1.4,hz:.3},3.65,3.95);add('echo-orb','mechanism','circle',p.x,p.z,{r:.49},1.5,2.5);
 p=at('guardian');add('gate-pad','platform','circle',p.x,p.z,{r:2.3},0,.2,true);for(const side of[-1,1])add('gate-column-'+side,'stone','box',p.x+side*2,p.z,{hx:.36,hz:.41},0,4.7);add('gate-lintel','stone','box',p.x,p.z,{hx:2.5,hz:.45},3.55,4.05);
 p=at('sign');add('sign-post','wood','box',p.x,p.z,{hx:.09,hz:.09},0,1.5);add('sign-board','wood','box',p.x,p.z,{hx:.71,hz:.09},1.27,1.93);
 for(let i=0;i<LANTERNS.length;i++){const[x,z]=LANTERNS[i];add('lantern-'+i,'pole','circle',x,z,{r:.105},0,2.2);add('lamp-'+i,'pole','circle',x,z,{r:.19},2.01,2.4);}
 for(let i=0;i<ROADSIDE.length;i++){const p=ROADSIDE[i];add('pebble-'+i,'pebble','circle',p.x+.22,p.z+.15,{r:.15},0,.14,true);}
 p=at('ranger');add('mosswing','creature','circle',p.x,p.z,{r:.58},0,1.78);p=at('wild');add('bramble','creature','circle',p.x,p.z,{r:.47},0,1.42);
 if(area===1)for(const p of REGION_SITES){add('sky-pillar-'+p.index,'stone','circle',p.x,p.z,{r:1.12},0,3+(p.index%2)*.5);add('sky-ring-'+p.index,'stone','circle',p.x,p.z,{r:.93},2.78+p.index%2,4.62+p.index%2);}
 if(area===2)for(const p of REGION_SITES){add('ruin-pillar-'+p.index,'stone','circle',p.x,p.z,{r:.67},0,2+p.index%3);add('crystal-'+p.index,'crystal','circle',p.x+1.3,p.z+1.8,{r:.73},0,3.07);}
 return a;
}
export function solidsFor(area=0){if(!worlds.has(area))worlds.set(area,build(area));return worlds.get(area);}
function extent(s){if(s.shape==='box')return[s.hx,s.hz];if(s.shape==='ellipse')return[s.rx,s.rz];if(s.shape==='capsule')return[Math.max(Math.abs(s.ax),Math.abs(s.bx))+s.r,Math.max(Math.abs(s.az),Math.abs(s.bz))+s.r];return[s.r,s.r];}
function indexFor(area){if(indexes.has(area))return indexes.get(area);const map=new Map();for(const s of solidsFor(area)){const[x,z]=extent(s);for(let i=Math.floor((s.x-x)/CELL);i<=Math.floor((s.x+x)/CELL);i++)for(let j=Math.floor((s.z-z)/CELL);j<=Math.floor((s.z+z)/CELL);j++){const k=i+','+j;if(!map.has(k))map.set(k,[]);map.get(k).push(s);}}indexes.set(area,map);return map;}
export function nearbySolids(x,z,r,area=0){const result=new Set(),map=indexFor(area);for(let i=Math.floor((x-r)/CELL);i<=Math.floor((x+r)/CELL);i++)for(let j=Math.floor((z-r)/CELL);j<=Math.floor((z+r)/CELL);j++)for(const s of map.get(i+','+j)||[])result.add(s);return result;}
export function overlaps(s,x,z,r=0){const dx=x-s.x,dz=z-s.z;if(s.shape==='box'){const a=Math.max(0,Math.abs(dx)-s.hx),b=Math.max(0,Math.abs(dz)-s.hz);return a*a+b*b<(r+EPS)*(r+EPS);}if(s.shape==='ellipse')return (dx/(s.rx+r))**2+(dz/(s.rz+r))**2<1;if(s.shape==='capsule'){const vx=s.bx-s.ax,vz=s.bz-s.az,t=Math.max(0,Math.min(1,((dx-s.ax)*vx+(dz-s.az)*vz)/(vx*vx+vz*vz||1)));return Math.hypot(dx-s.ax-vx*t,dz-s.az-vz*t)<s.r+r;}return Math.hypot(dx,dz)<s.r+r;}
export function riverBlocked(x,z,r=0){return x>1-r&&x<7+r&&Math.abs(z+8)>1.62-r&&Math.abs(z-23)>1.78-r;}
export function groundHeight(x,z,r,area=0,ceiling=.31){let h=0;for(const s of nearbySolids(x,z,r,area))if(s.support&&s.maxY<=ceiling+EPS&&overlaps(s,x,z,r))h=Math.max(h,s.maxY);return h;}
export function canOccupy(x,z,y,height,r,area=0){if(!Number.isFinite(x)||!Number.isFinite(z)||!Number.isFinite(y)||x<BOUNDS.left+r||x>BOUNDS.right-r||z<BOUNDS.top+r||z>BOUNDS.bottom-r||riverBlocked(x,z,r))return false;for(const s of nearbySolids(x,z,r,area))if(y<s.maxY-EPS&&y+height>s.minY+EPS&&overlaps(s,x,z,r))return false;return true;}
export function groundPassable(x,z,height,r,area=0){const y=groundHeight(x,z,r,area);return canOccupy(x,z,y,height,r,area);}
export function cameraClear(x,y,z,r=.09,area=0){for(const s of nearbySolids(x,z,r,area))if(y-r<s.maxY&&y+r>s.minY&&overlaps(s,x,z,r))return false;return y>=r;}
export function cameraCast(origin,end,area=0,r=.09){const dx=end.x-origin.x,dy=end.y-origin.y,dz=end.z-origin.z,len=Math.hypot(dx,dy,dz),n=Math.max(1,Math.ceil(len/.08));let t=0;for(let i=1;i<=n;i++){const k=i/n;if(!cameraClear(origin.x+dx*k,origin.y+dy*k,origin.z+dz*k,r,area))break;t=k;}return{x:origin.x+dx*t,y:origin.y+dy*t,z:origin.z+dz*t,fraction:t};}
export function verticalLimit(x,z,oldY,nextY,height,r,area=0){let result=nextY;for(const s of nearbySolids(x,z,r,area)){if(!overlaps(s,x,z,r))continue;if(nextY>oldY&&oldY+height<=s.minY+EPS&&nextY+height>s.minY)result=Math.min(result,s.minY-height-.002);if(nextY<oldY&&s.support&&oldY>=s.maxY-EPS&&nextY<s.maxY)result=Math.max(result,s.maxY);}return result;}
