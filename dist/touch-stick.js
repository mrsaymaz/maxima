// Pointer ownership and radial response shared by the visible mobile stick.
export function stickVector(x,z,radius=28){
 const distance=Math.hypot(x,z),raw=Math.min(1,distance/radius);
 const strength=raw<=.12?0:(raw-.12)/.88;
 return {x:distance?x/distance*strength:0,z:distance?z/distance*strength:0,px:distance?x/distance*Math.min(distance,radius):0,pz:distance?z/distance*Math.min(distance,radius):0};
}
export function bindStick(pad,thumb,setInput,onRelease=()=>{},win=window,doc=document){
 let pointer=null;const controller=new AbortController(),options={signal:controller.signal};
 const move=e=>{const b=pad.getBoundingClientRect(),v=stickVector(e.clientX-b.left-b.width/2,e.clientY-b.top-b.height/2,Math.min(28,b.width*.32));setInput(v.x,v.z);thumb.style.transform=`translate(${v.px}px,${v.pz}px)`;};
 const reset=()=>{const old=pointer;pointer=null;setInput(0,0);thumb.style.transform='';pad.classList.remove('engaged');if(old!==null&&pad.hasPointerCapture?.(old))pad.releasePointerCapture(old);if(old!==null)onRelease();};
 pad.addEventListener('pointerdown',e=>{if(pointer!==null||e.button>0)return;e.preventDefault();pointer=e.pointerId;pad.setPointerCapture(pointer);pad.classList.add('engaged');move(e);},options);
 pad.addEventListener('pointermove',e=>{if(e.pointerId===pointer)move(e);},options);
 for(const type of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(type,e=>{if(e.pointerId===pointer)reset();},options);
 win.addEventListener('blur',reset,options);
 doc.addEventListener('visibilitychange',()=>{if(doc.hidden)reset();},options);
 return ()=>{reset();controller.abort();};
}

// Action presses belong to their own pointer; a held stick never owns this button.
export function bindActionButton(button,onPress,win=window,doc=document){
 if(!button)return()=>{};let pointer=null,suppressUntil=0;const controller=new AbortController(),options={signal:controller.signal};
 const reset=()=>{const old=pointer;pointer=null;button.classList.remove('pressed');if(old!==null){suppressUntil=Date.now()+700;if(button.hasPointerCapture?.(old))button.releasePointerCapture(old);}};
 button.addEventListener('pointerdown',e=>{if(pointer!==null||button.disabled||e.button>0)return;e.preventDefault();e.stopPropagation();pointer=e.pointerId;suppressUntil=Infinity;button.setPointerCapture?.(pointer);button.classList.add('pressed');onPress();},options);
 for(const kind of['pointerup','pointercancel','lostpointercapture'])button.addEventListener(kind,e=>{if(e.pointerId===pointer)reset();},options);
 button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(!button.disabled&&((e.detail===0&&!e.pointerType)||Date.now()>suppressUntil))onPress();},options);
 for(const kind of ['pointerup','pointercancel'])win.addEventListener(kind,e=>{if(e.pointerId===pointer)reset();},{...options,capture:true});win.addEventListener('blur',reset,options);doc.addEventListener('visibilitychange',()=>{if(doc.hidden)reset();},options);
 return()=>{reset();controller.abort();};
}
