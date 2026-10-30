// Keep the world full bleed; only the readable objects avoid the task controls.
export function taskReadingRect(width,height,{top=0,bottom=0,left=0,right=0}={}){
 const w=Math.max(1,width),h=Math.max(1,height),landscape=w>h&&h<540;
 const head=landscape?48:60,foot=landscape?76:100;
 return{left:Math.max(8,left+8),right:landscape?right+178:Math.max(8,right+8),top:top+head+8,bottom:landscape?bottom+8:bottom+foot+8};
}
export function measuredTaskRect(container,layer){
 const b=container.getBoundingClientRect(),head=layer?.querySelector?.('.mechanism-hud')?.getBoundingClientRect?.(),tools=layer?.querySelector?.('.mechanism-tools')?.getBoundingClientRect?.();
 if(!head&&!tools)return taskReadingRect(b.width,b.height);
 const sidebar=tools&&tools.width<b.width*.45&&tools.height>90&&tools.left>b.left+b.width*.5;return{left:Math.max(10,(head?.left??b.left+10)-b.left),right:Math.max(10,b.left+b.width-(head?.right??b.left+b.width-10),sidebar?b.left+b.width-tools.left+8:0),top:Math.max(8,(head?.bottom??b.top)-b.top+8),bottom:sidebar?8:Math.max(8,b.bottom-(tools?.top??b.bottom)+8)};
}
// Browser metrics are authoritative. The heuristic only supplies the first size.
// A very long imported label remains readable by scrolling inside its own plate.
export function fitPlateText(el,initial=17){
 if(!el?.querySelector||!el.clientWidth)return;
 const ink=el.querySelector('.label-ink');if(!ink)return;
 let size=Math.min(21,Math.max(13,initial));
 const fits=()=>ink.scrollHeight<=ink.clientHeight+1&&ink.scrollWidth<=ink.clientWidth+1;
 // Words may only break as a last resort: while sizing, a word that is too wide overflows instead of splitting
 // ("celebrat/e"), so the text shrinks until whole words fit; the stylesheet's anywhere-wrapping returns after.
 if(ink.style)ink.style.overflowWrap='normal';
 el.style.fontSize=size+'px';
 while(size>13&&!fits()){size-=.5;el.style.fontSize=size+'px';}
 if(ink.style)ink.style.overflowWrap='';
 const scroll=!fits();if(el.dataset)el.dataset.overflow=scroll?'scroll':'none';
 return{size,scroll};
}
