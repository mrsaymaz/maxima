// Runner prototype switch. `?mode=runner` (or `<html data-play-mode="runner">`, as the runner Drop package does)
// opens the auto-run version on a longer trail; `?mode=classic` or no setting plays the classic expedition.
// The two keep separate saves, so trying the runner never touches a classic journey.
export function playMode(){
 try{
  const asked=new URLSearchParams(globalThis.location?.search||'').get('mode');
  if(asked==='runner'||asked==='classic')return asked;
  return globalThis.document?.documentElement?.dataset?.playMode==='runner'?'runner':'classic';
 }catch{return'classic';}
}
export const RUNNER=playMode()==='runner';

// In runner mode every stretch between gates is TRAIL_STRETCH times longer. Each chapter keeps its compact fork
// (the first 9 m) and stretches the rest, so the map is a monotonic warp of the classic one: scenery placed from
// classic coordinates goes through stretchZ, and anything shaped by position (hills, clearings, tree rhythm)
// reads classicZ, so the valley keeps its composition around the longer route.
export const TRAIL_STRETCH=RUNNER?2.5:1;
// A chapter runs from its fork top (local +2) to the next fork top (local -130).
const CLASSIC_CHAPTER=132,TOP=2,FORK=-9;
export function trailWarp(k){
 const span=(TOP-FORK)+(CLASSIC_CHAPTER-(TOP-FORK))*k;
 const warp=(z,from,to,f)=>{
  if(f===1||z>=FORK)return z;
  const chapter=Math.max(0,Math.min(4,Math.floor((TOP-z)/from))),local=z+chapter*from;
  return -chapter*to+(local>=FORK?local:FORK+(local-FORK)*f);
 };
 return{span,stretchZ:z=>warp(z,CLASSIC_CHAPTER,span,k),classicZ:z=>warp(z,span,CLASSIC_CHAPTER,1/k)};
}
const WARP=trailWarp(TRAIL_STRETCH);
export const CHAPTER_SPAN=WARP.span,stretchZ=WARP.stretchZ,classicZ=WARP.classicZ;
