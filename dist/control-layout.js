// Coordinates are inside the safe-area rectangle. These also drive the live CSS.
export function controlLayout(width,height){
 const short=height<520,edge=width>=760?24:12,stick=short?72:88,action=short?56:60,gap=16;
 const bottom=short?10:14,right=width-edge-action,attack=right-action-gap,left=edge;
 const context=(left+stick+attack-44)/2;
 return{stick:{x:left,bottom,size:stick},jump:{x:right,bottom:bottom+(short?0:16),size:action},attack:{x:attack,bottom,size:action},context:{x:context,bottom:bottom+8,size:44},gap,edge};
}
export function installControlLayout(win=globalThis.window,doc=globalThis.document){
 if(!win||!doc)return{update(){},dispose(){}};
 const update=()=>{const s=doc.documentElement.style,w=doc.querySelector('.play-dock')?.clientWidth||doc.documentElement.clientWidth||win.innerWidth,h=win.innerHeight,p=controlLayout(w,h);
  s.setProperty('--control-edge',p.edge+'px');for(const[name,r]of Object.entries(p))if(typeof r==='object')for(const[key,v]of Object.entries(r))s.setProperty(`--control-${name}-${key}`,v+'px');
 };
 update();win.addEventListener('resize',update);win.visualViewport?.addEventListener('resize',update);
 return{update,dispose(){win.removeEventListener('resize',update);win.visualViewport?.removeEventListener('resize',update);}};
}
export function updateTrailHint(el,text,{urgent=false,now=Date.now()}={}){
 if(!el)return;if(el._hintText!==text){el._hintText=text;el._hintAt=now;el.textContent=text;}
 el.dataset.urgent=String(urgent);el.classList.toggle('hint-resting',!urgent&&now-(el._hintAt??now)>6500);
}
