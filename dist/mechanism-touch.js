// Delegated presses survive text-layer rebuilds and keep independent pointers.
export function bindMechanismPress(layer,press,win=globalThis.window,doc=globalThis.document){
 const held=new Map(),cancelled=new Map(),controller=new AbortController(),options={signal:controller.signal};
 const prune=()=>{for(const[id,v]of cancelled)if(v.until<Date.now())cancelled.delete(id);};
 const release=(id,cancel=false)=>{const item=held.get(id);if(!item)return;held.delete(id);if(cancel){prune();cancelled.set(id,{key:item.key,until:Date.now()+700});}if(![...held.values()].some(v=>v.key===item.key))press(item.key,false);};
 const reset=()=>{for(const id of [...held.keys()])release(id,true);};
 layer.addEventListener('pointerdown',e=>{const el=e.target?.closest?.('button[data-anchor]');if(!el||el.disabled||e.button>0||held.has(e.pointerId))return;prune();cancelled.delete(e.pointerId);const key=el.dataset.anchor;held.set(e.pointerId,{key,x:e.clientX,y:e.clientY});press(key,true);},options);
 win?.addEventListener('pointermove',e=>{const item=held.get(e.pointerId);if(item&&Number.isFinite(item.x)&&Number.isFinite(e.clientX)&&Math.hypot(e.clientX-item.x,e.clientY-item.y)>12)release(e.pointerId,true);},{...options,capture:true});
 for(const type of['pointerup','pointercancel','lostpointercapture'])win?.addEventListener(type,e=>release(e.pointerId,type!=='pointerup'),{...options,capture:true});
 layer.addEventListener('click',e=>{if(e.detail===0&&!e.pointerType)return;prune();const key=e.target?.closest?.('button[data-anchor]')?.dataset.anchor,match=cancelled.get(e.pointerId)||(!Number.isFinite(e.pointerId)?[...cancelled.values()].find(v=>v.key===key):null);if(match&&match.key===key){e.preventDefault();e.stopImmediatePropagation();}},{...options,capture:true});
 win?.addEventListener('blur',reset,options);doc?.addEventListener('visibilitychange',()=>{if(doc.hidden)reset();},options);
 return()=>{reset();cancelled.clear();controller.abort();};
}
