// Runner keys. While a run is active: ← → / A D change lane, ↑ / W jump, ↓ / S slide. Outside runs every key keeps
// its usual meaning. Touch swipes and taps for runs (and everywhere else) live in gesture-controls.js.
export function installRunnerInput(world){
 const win=globalThis.window;if(!win?.addEventListener)return;
 const runner=()=>world.nav?.runner?.running&&!world.home&&!world.focus&&!world.paused&&!world.runtimePaused?world.nav.runner:null;
 const act=(kind)=>{const r=runner();if(!r)return false;if(kind==='left')return r.shift(-1);if(kind==='right')return r.shift(1);if(kind==='up'){r.sliding=0;return world.jump?world.jump():r.jump(world.nav);}if(kind==='down')return r.slide(world.nav);return false;};
 const KEYS={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'up',w:'up',ArrowDown:'down',s:'down'};
 win.addEventListener('keydown',e=>{if(e.target?.matches?.('input,textarea,select'))return;const key=e.key?.length===1?e.key.toLowerCase():e.key,kind=KEYS[key];if(!kind||!runner())return;e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)act(kind);},{capture:true});
}
