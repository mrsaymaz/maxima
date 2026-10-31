import{gateCount}from'./path-shape.js';
// Each arena owns its English milestones; its final form belongs to its guardian.
export const PATH_STEPS=20;
export const TOTAL_PATH_STEPS=60;
export const ARENA_GROWTH=[
 {start:0,boss:4,milestones:[[5,1],[10,2],[15,3]]},
 {start:4,boss:8,milestones:[[5,5],[10,6],[15,7]]},
 {start:8,boss:10,milestones:[[10,9]]}
];
// Six-gate areas (path-shape.js) earn their Forms at gates 2, 4 and 6 (Stormglass: gate 3); the boss still gives the last.
export const SHORT_GROWTH=[
 {start:0,boss:4,milestones:[[2,1],[4,2],[6,3]]},
 {start:4,boss:8,milestones:[[2,5],[4,6],[6,7]]},
 {start:8,boss:10,milestones:[[3,9]]}
];
const growthPlan=(area,gates=20)=>(gates===6?SHORT_GROWTH:ARENA_GROWTH)[area];
export function pathLevel(steps,area=0,gates=20){
 const plan=growthPlan(area,gates);
 return plan.milestones.reduce((level,[at,to])=>steps>=at?to:level,plan.start);
}
const activeArea=j=>Math.min(2,j.guardians.length);
const completedSteps=j=>[0,1,2].reduce((sum,area)=>sum+(j.guardians.includes(area)?gateCount(j.expeditions?.[area]):j.expeditions?.[area]?.index||0),0);
export function upgradePathGrowth(j){return j;}
export function recordPathGrowth(j,e){
 const from=j.level;
 // A revisited arena can never grow a creature or count the same task twice.
 if(!j.completed&&e.area===activeArea(j)&&!j.guardians.includes(e.area))j.level=Math.max(j.level,pathLevel(e.index,e.area,gateCount(e)));
 j.pathSteps=completedSteps(j);
 if(j.level>from)e.pendingEvolution={from,to:j.level,checkpoint:e.index};
 return{evolved:j.level>from,from,to:j.level};
}
export function recordGuardianGrowth(j,e){
 const from=j.level;
 j.level=ARENA_GROWTH[e.area].boss;j.pathSteps=completedSteps(j);
 e.pendingEvolution={from,to:j.level,checkpoint:gateCount(e),boss:true};
 return{from,to:j.level};
}
export function pathGrowthState(j){
 const area=activeArea(j),e=j.expeditions?.[area],gates=gateCount(e),plan=growthPlan(area,gates),steps=e?.index||0,complete=j.completed&&j.level===10;
 const nextMilestone=plan.milestones.find(([,to])=>to>j.level),boss=!complete&&!nextMilestone;
 const [target,next]=nextMilestone||[gates,plan.boss];
 const previous=plan.milestones.filter(([at])=>at<target).at(-1)?.[0]||0;
 return{path:true,area,next,points:steps,total:gates,mastered:0,need:{points:target,mastered:0},remaining:Math.max(0,target-steps),boss,bossLevel:plan.boss,complete,
  progress:complete?1:Math.max(0,Math.min(1,(steps-previous)/(target-previous)))};
}
export function validPathGrowth(j){
 if(j.progressionVersion!==2||!Number.isInteger(j.pathSteps)||j.pathSteps<0||j.pathSteps>TOTAL_PATH_STEPS)return false;
 if(j.guardians.length>3||j.guardians.some((area,i)=>area!==i))return false;
 const area=activeArea(j),plan=ARENA_GROWTH[area];
 const gates=gateCount(j.expeditions?.[area]);
 if(j.completed!==j.guardians.includes(2)||j.level<(j.completed?10:plan.start)||j.level>(j.completed?10:pathLevel(gates,area,gates)))return false;
 if(j.pathSteps!==completedSteps(j))return false;
 // Progressed future arenas and unearned levels cannot be imported.
 for(const e of Object.values(j.expeditions||{}))if(e.area>area&&e.index>0)return false;
 return j.completed||j.level===pathLevel(j.expeditions?.[area]?.index||0,area,gates);
}
