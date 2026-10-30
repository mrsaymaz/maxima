// Phone/tablet app behaviour around the game: offline cache registration, home-screen install, full screen and
// keeping the screen awake during play. Every call is optional and safe in browsers (or tests) without the API.
let deferredInstall=null,wakeLock=null,wantAwake=false;
const nav=()=>globalThis.navigator,doc=()=>globalThis.document;

// The service worker keeps the game's code and the lessons/creatures already used, for weak or no Wi-Fi.
export function registerOffline({scope='./',script='sw.js'}={}){
 const n=nav(),loc=globalThis.location;if(!n?.serviceWorker||!loc)return false;
 const secure=loc.protocol==='https:'||['localhost','127.0.0.1'].includes(loc.hostname);if(!secure||/\bnosw\b/.test(loc.search||''))return false;
 // Lessons and media fetched on the very first visit load before the worker takes control, so hand their URLs
 // over once it is ready; otherwise the lesson just played would be missing offline.
 // Devices that stay open for days look for a new build whenever the game returns to the foreground.
 const go=()=>n.serviceWorker.register(script,{scope}).then(reg=>{doc()?.addEventListener?.('visibilitychange',()=>{if(doc().visibilityState==='visible')reg.update?.().catch(()=>{});});return n.serviceWorker.ready;}).then(reg=>reg.active?.postMessage({type:'warm',urls:loadedFiles()})).catch(()=>{});
 if(doc()?.readyState==='complete')go();else globalThis.addEventListener?.('load',go,{once:true});
 return true;
}

// A new build has taken over the offline cache while this page still runs the old code: offer a reload.
// The first install (no previous controller) is not an update.
export function watchUpdates(onUpdate=()=>{}){
 const sw=nav()?.serviceWorker;if(!sw?.addEventListener)return false;let had=!!sw.controller;
 sw.addEventListener('controllerchange',()=>{if(had)onUpdate();had=true;});return true;
}
export function loadedFiles(){
 const origin=globalThis.location?.origin;let entries=[];try{entries=globalThis.performance?.getEntriesByType?.('resource')||[];}catch{}
 return[...new Set(entries.map(e=>e.name).filter(url=>origin&&url.startsWith(origin+'/')))];
}

// Chrome/Edge/Android offer a deferred install prompt; iPhone/iPad use Share → Add to Home Screen instead.
export function watchInstall(onChange=()=>{}){
 globalThis.addEventListener?.('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;onChange();});
 globalThis.addEventListener?.('appinstalled',()=>{deferredInstall=null;onChange();});
}
export const installed=()=>!!(globalThis.matchMedia?.('(display-mode: standalone)').matches||globalThis.matchMedia?.('(display-mode: fullscreen)').matches||nav()?.standalone);
export const canInstall=()=>!!deferredInstall&&!installed();
export const isAppleTouch=()=>/iPhone|iPad|iPod/.test(nav()?.userAgent||'')||nav()?.platform==='MacIntel'&&nav()?.maxTouchPoints>1;
export async function promptInstall(){if(!deferredInstall)return false;const e=deferredInstall;deferredInstall=null;await e.prompt();const choice=await e.userChoice.catch(()=>null);return choice?.outcome==='accepted';}

export const fullscreenAvailable=()=>!!doc()?.fullscreenEnabled&&!installed();
export const inFullscreen=()=>!!doc()?.fullscreenElement;
export async function toggleFullscreen(){
 const d=doc();if(!d?.fullscreenEnabled)return false;
 try{if(d.fullscreenElement)await d.exitFullscreen();else{await d.documentElement.requestFullscreen({navigationUI:'hide'});await globalThis.screen?.orientation?.lock?.('any').catch?.(()=>{});}}catch{return false;}
 return true;
}

// Keep the screen on while playing; browsers release the lock when the page is hidden, so re-acquire on return.
export async function keepAwake(on){
 wantAwake=!!on;const n=nav();
 if(!wantAwake){const lock=wakeLock;wakeLock=null;await lock?.release?.().catch?.(()=>{});return false;}
 if(!n?.wakeLock||wakeLock||doc()?.visibilityState==='hidden')return!!wakeLock;
 try{wakeLock=await n.wakeLock.request('screen');wakeLock.addEventListener?.('release',()=>{wakeLock=null;});}catch{wakeLock=null;}
 return!!wakeLock;
}
doc()?.addEventListener?.('visibilitychange',()=>{if(wantAwake&&doc().visibilityState==='visible')keepAwake(true);});
