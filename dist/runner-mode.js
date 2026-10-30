// Play mode. The runner (auto-run between gates on a longer trail) is the game; classic play stays available
// through `?mode=classic` or the Help screen's switch (remembered on this device), or `<html data-play-mode>`.
// The two keep separate saves, so trying the runner never touches a classic journey.
const MODE_KEY='maxima.playMode';
export function playMode(){
 try{
  const asked=new URLSearchParams(globalThis.location?.search||'').get('mode');
  // An address choice is remembered, so a home-screen app opened later keeps the mode.
  if(asked==='runner'||asked==='classic'){try{globalThis.localStorage?.setItem(MODE_KEY,asked);}catch{}return asked;}
  const saved=globalThis.localStorage?.getItem(MODE_KEY);if(saved==='runner'||saved==='classic')return saved;
  const page=globalThis.document?.documentElement?.dataset?.playMode;if(page==='runner'||page==='classic')return page;
  // The runner is the game; outside a browser (tests, build checks) MAXIMA_MODE picks, classic by default.
  if(globalThis.document)return'runner';return globalThis.process?.env?.MAXIMA_MODE==='runner'?'runner':'classic';
 }catch{return'classic';}
}
// Switch modes from inside the game (Help), then reload into the chosen mode.
export function switchPlayMode(mode){
 try{globalThis.localStorage?.setItem(MODE_KEY,mode);}catch{}
 const url=new URL(globalThis.location.href);url.searchParams.delete('mode');globalThis.location.replace(url.toString());
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
