// Runner controls. While a run is active: ← → / A D change lane, ↑ / W jump, ↓ / S slide; on touch screens a swipe
// anywhere does the same (the joystick is hidden during runs). Outside runs every key keeps its usual meaning.
export function installRunnerInput(world){
 const win=globalThis.window;if(!win?.addEventListener)return;
 const runner=()=>world.nav?.runner?.running&&!world.home&&!world.focus&&!world.paused&&!world.runtimePaused?world.nav.runner:null;
 const act=(kind)=>{const r=runner();if(!r)return false;if(kind==='left')return r.shift(-1);if(kind==='right')return r.shift(1);if(kind==='up'){r.sliding=0;return world.jump?world.jump():r.jump(world.nav);}if(kind==='down')return r.slide(world.nav);return false;};
 const KEYS={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'up',w:'up',ArrowDown:'down',s:'down'};
 win.addEventListener('keydown',e=>{if(e.target?.matches?.('input,textarea,select'))return;const key=e.key?.length===1?e.key.toLowerCase():e.key,kind=KEYS[key];if(!kind||!runner())return;e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)act(kind);},{capture:true});
 let start=null;
 win.addEventListener('pointerdown',e=>{if(!runner()||e.target?.closest?.('button,a,input,.modal,#joystick'))return;start={x:e.clientX,y:e.clientY,t:e.timeStamp,id:e.pointerId,done:false};},{capture:true,passive:true});
 win.addEventListener('pointermove',e=>{if(!start||start.done||e.pointerId!==start.id)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.hypot(dx,dy)<26)return;start.done=true;act(Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down'));},{capture:true,passive:true});
 const end=()=>{start=null;};win.addEventListener('pointerup',end,{capture:true,passive:true});win.addEventListener('pointercancel',end,{capture:true,passive:true});
}
