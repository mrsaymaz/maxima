export function loadingNotice(text){const el=globalThis.document?.getElementById?.('load-note');if(!el)return;el.replaceChildren(document.createTextNode(text),document.createElement('span'));el.classList.remove('hidden');}
export function clearLoading(){globalThis.document?.getElementById?.('load-note')?.classList.add('hidden');}
export function recoveryNotice(world,kind){
 for(const selector of ['#ui','#task-layer','#modal-layer','.topbar']){const node=document.querySelector(selector);if(node)node.inert=kind!=='running';}
 let layer=document.getElementById('recovery-layer');if(!layer){layer=document.createElement('div');layer.id='recovery-layer';layer.className='recovery-layer';document.body.append(layer);}
 if(kind==='running'){layer.replaceChildren();layer.hidden=true;return;}
 layer.hidden=false;const box=document.createElement('section');box.className='recovery-card';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','Game paused');
 const title=document.createElement('h2'),copy=document.createElement('p'),button=document.createElement('button');button.className='primary wide';
 title.textContent=kind==='graphics'?'Restoring the world…':'Ready when you are';copy.textContent=kind==='graphics'?'Your checkpoint is saved. Waiting for graphics to recover.':'Your journey is paused. Tap Continue when you are ready.';button.textContent=kind==='graphics'?'Try restoring graphics':'Continue';
 button.onclick=()=>{if(kind==='graphics'){world.renderer.getContext()?.getExtension('WEBGL_lose_context')?.restoreContext();}else world.lifecycle.resume();};box.append(title,copy,button);
 if(kind==='graphics'){const reload=document.createElement('button');reload.className='secondary wide';reload.textContent='Reload saved checkpoint';reload.onclick=()=>location.reload();box.append(reload);}
 layer.replaceChildren(box);button.focus();
}
