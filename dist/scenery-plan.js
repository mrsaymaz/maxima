import{EXPEDITION_SCENES}from'./expedition-composition.js';
// Authored composition, independent of language selection, rewards and navigation.
const NAMES=[EXPEDITION_SCENES.map(s=>s.name.replace(/^The /,'')),['Cloudroot Approach','Sunlit Watercourse','Bellwind Lookout','Hanging Gardens','Crown of Arches'],['Basalt Threshold','Glasswater Crossing','Echo Spire','Hidden Reservoir','Stormglass Refuge']];
const KINDS=[['spring','aqueduct','oak','fracture','sanctuary'],['cloudroot','watercourse','bells','gardens','arches'],['threshold','glasswater','echo','reservoir','refuge']];
const HEIGHTS=[[7.4,11.2,11,10,10.8],[10.2,11.2,12.1,10.2,13.5],[11.5,11.8,13.8,10.5,14.0]];
const BASIN_HEIGHTS=[[1.15,3.25,1.6,.95,1.4],[1.3,2.2,1.8,2.4,1.7],[.8,1.25,1.5,2.2,1.1]];
const OFFSETS=[[-1.5,-1.7],[.4,.6],[1.8,-.5],[-.6,2.2],[2.1,2.0]];
export function sceneryScene(area,chapter){area=Math.max(0,Math.min(2,area|0));chapter=Math.max(0,Math.min(4,chapter|0));const z=-chapter*132,focusZ=chapter===4?-664:z-[64,69,65,66][chapter],centralBasin=area>0&&chapter===3;
 return{area,chapter,id:KINDS[area][chapter],name:NAMES[area][chapter],focus:{x:0,y:HEIGHTS[area][chapter],z:focusZ},
  approach:{from:z-5,to:z-13},reveal:{from:z-16,to:z-51},rest:{from:z-92,to:z-110},
  basin:{x:centralBasin?0:(chapter%2?1:-1)*19.5,z:centralBasin?focusZ+2:z-33,height:BASIN_HEIGHTS[area][chapter],shape:area===0&&chapter!==2?'pool':chapter%2?'trough':'square',width:centralBasin?2.5:1.65,depth:centralBasin?1.7:chapter%2?.68:1.05},
  stands:[{x:-23.8+(chapter%2)*1.4,z:z-17-(chapter%3)*3,side:-1},{x:25.2-(chapter%3)*.7,z:z-93+(chapter%2)*7,side:1}],
  framing:area===0?'rooted woodland':area===1?'eroded limestone and hanging leaves':'fractured basalt and silver growth'};
}
export function sceneryPlan(area=0){const scenes=Array.from({length:5},(_,c)=>sceneryScene(area,c)),trees=[];for(const scene of scenes)for(const[stand,a]of scene.stands.entries())for(const[i,o]of OFFSETS.entries())trees.push({chapter:scene.chapter,stand,x:a.x+o[0]*a.side,z:a.z+o[1]*(1.2+scene.chapter*.08),variant:(i+scene.chapter)%4,turn:i*2.399+scene.chapter*.41,scale:.88+(i%3)*.13,crown:!(area===2&&scene.chapter===3&&i%3===0)});return{area,scenes,trees};}
// A view corridor to the focal point stays quiet; it is not a walkable shortcut.
export function inRevealWindow(scene,x,z){return z<=scene.reveal.from&&z>=scene.reveal.to&&Math.abs(x)<8.2;}

const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export function sceneryFocus(e,section,player){if(e.adventureVersion!==2||!section?.scenicRise||section.trial||section.enemy)return null;const t=((player.x-section.start.x)*section.forward.x+(player.z-section.start.z)*section.forward.z)/section.length,strength=smooth((t-.12)/.22)*(1-smooth((t-.72)/.2));return strength>.001?{...sceneryScene(e.area,section.chapter).focus,strength}:null;}
