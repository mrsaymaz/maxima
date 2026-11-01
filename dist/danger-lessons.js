import{classifyGesture}from'./gesture-controls.js';
import{sketchScene,sketchAct}from'./creature-sketch.js';
// First-time danger lessons (0.64.0). The first time a student meets a danger on a run (a crystal wall, rolling
// boulders, or each of the guardian's chase attacks such as Roots), the run pauses on the warning. A card shows the
// danger with a simplified creature and asks for the move. Doing the move (a swipe, or a tap on the creature)
// carries on the run with that move. That first attack is practice, so it cannot cost a life.
// Each lesson is shown once per device (controls hints in gesture-controls.js).
export const DANGER_LESSONS={
 crystal:{title:'Break the crystal wall!',text:'Crystal walls block every lane. <b>Tap your creature</b> to cast and shatter the wall.',demo:'crystal'},
 boulders:{title:'Rolling boulders!',text:'Boulders roll down the <b>amber lane</b>. Swipe to a <b>blue lane</b> to dodge them.',demo:'lane',hazard:'boulders'},
 roots:{title:'Roots!',text:'Roots race down the <b>amber lane</b>. Swipe to a <b>blue lane</b> before they reach you.',demo:'lane',hazard:'roots'},
 seeds:{title:'Seed pods!',text:'A seed pod lands in the <b>amber lane</b> and grows into a thorn bush. Swipe to a <b>blue lane</b>.',demo:'lane',hazard:'seeds'},
 volley:{title:'Stone volley!',text:'The guardian throws stones at <b>your lane</b>. Swipe to another lane, and keep switching.',demo:'lane',hazard:'volley'},
 shards:{title:'Crystal rain!',text:'Crystals fall into the <b>amber lanes</b>. Take the <b>blue lane</b>.',demo:'lane',hazard:'shards'},
 prism:{title:'Prism beam!',text:'The beam bounces into a second lane. Stay out of <b>both amber lanes</b>.',demo:'lane',hazard:'prism'},
 dive:{title:'Sky Dive!',text:'The guardian crashes into <b>your lane</b>. Swipe to another lane, then <b>swipe up</b> to jump its shockwave.',demo:'lane',hazard:'dive',jumpAfter:true},
 slam:{title:'Canopy Slam!',text:'A shockwave rolls across every lane. <b>Swipe up</b> to jump it when it reaches you.',demo:'wave',jump:true},
 gale:{title:'Gale wall!',text:'A wall of wind sweeps every lane. <b>Swipe up</b> to jump it when it reaches you.',demo:'wave',jump:true},
 chain:{title:'Storm Chain!',text:'A chain sweeps the track. <b>Swipe up</b> to jump it, or take the <b>blue lane</b>.',demo:'wave',jump:true},
};
// The lanes an attack makes dangerous, given the creature's lane when the warning starts.
export function dangerLanes(key,{lane=1,attack=null,warnLane=null}={}){
 const a=attack||{},all=[0,1,2];
 switch(key){
  case'roots':case'seeds':return[a.lane??lane];
  case'volley':case'dive':return[a.lane==='aim'||a.lane==null?lane:a.lane];
  case'shards':case'prism':return a.lanes?.length?a.lanes:[a.lane??lane];
  case'chain':return all.filter(l=>l!==a.gap);
  case'slam':case'gale':return all;
  case'boulders':return[warnLane??lane];
  default:return[];
 }
}
const ARROW={left:'←',right:'→'};
// What the lesson asks for. `want` lists the gestures that count; `move` is what to do with them in the run.
export function lessonPlan(key,{lane=1,attack=null,warnLane=null}={}){
 const def=DANGER_LESSONS[key];if(!def)return null;
 const danger=key==='crystal'?[]:dangerLanes(key,{lane,attack,warnLane}),safe=[0,1,2].filter(l=>!danger.includes(l));
 let want,prompt,hand='👆';
 if(key==='crystal'){want=['tap'];prompt='Tap your creature!';}
 else if(def.jump){want=['up'];prompt='Swipe up to jump!';hand='☝️';if(key==='chain'&&safe.length&&!safe.includes(lane)){const dir=safe[0]<lane?'left':'right';want.push(dir);prompt=`Swipe up to jump, or ${ARROW[dir]} to the blue lane`;}}
 else if(danger.includes(lane)&&safe.length){const dirs=[...new Set(safe.map(l=>l<lane?'left':'right'))];want=dirs;prompt=dirs.length>1?'Swipe ← or → to a blue lane!':`Swipe ${ARROW[dirs[0]]} to the blue lane!`;hand=dirs.length>1?'👆':dirs[0]==='left'?'👈':'👉';}
 else{want=['tap','left','right','up'];prompt='You are in a safe lane. Tap to carry on!';}
 // How long the first attack cannot hurt: its warning plus the time it takes to arrive.
 const grace=key==='crystal'?0:key==='boulders'?3.2:key==='volley'?5:key==='dive'?4.8:3.6;
 return{key,...def,danger,safe,lane,want,prompt,hand,grace};
}
export function lessonMarkup(plan,{color,touch=true}={}){
 const keys=touch?'':` <small>(keyboard: ${plan.want.includes('up')?'↑ / Space':''}${plan.want.some(w=>w==='left'||w==='right')?' ← →':''}${plan.want.includes('tap')?' J / F':''})</small>`;
 return`<div class="lesson-tag">New danger · learn the move</div><h2>${plan.title}</h2><p>${plan.text}</p>${sketchScene({demo:plan.demo,lane:plan.lane,color,danger:plan.danger,safe:plan.safe,hazard:plan.hazard,caption:plan.title,loop:plan.demo==='wave'})}<div class="lesson-try" role="status"><span class="hand" aria-hidden="true">${plan.hand}</span><span>${plan.prompt}${keys}</span></div><button class="lesson-skip" data-lesson="skip" hidden>Carry on</button>`;
}
const KEYS={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'up',w:'up',' ':'up',ArrowDown:'down',s:'down',j:'tap',f:'tap',Enter:'tap'};
// Shows a lesson over the paused run and resolves with the gesture the student made (or null after "Carry on").
// For the crystal lesson, `creatureAt` (screen point) puts a ring and a tapping hand on the real creature.
export function runDangerLesson(plan,{doc=globalThis.document,win=globalThis.window,color,touch=true,creatureAt=null,onDone=()=>{}}={}){
 const root=doc.createElement('div');root.className='danger-lesson';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label',plan.title.replace(/!$/,''));
 root.innerHTML=lessonMarkup(plan,{color,touch});
 if(creatureAt&&plan.key==='crystal'){const cue=doc.createElement('div');cue.className='creature-cue';cue.style.transform=`translate(${Math.round(creatureAt.x)}px,${Math.round(creatureAt.y)}px)`;cue.innerHTML='<span class="ring"></span><span class="hand" aria-hidden="true">👆</span><span class="label">Tap me!</span>';root.appendChild(cue);}
 doc.body.appendChild(root);
 const controller=new AbortController(),options={signal:controller.signal};let start=null,finished=false;
 const skipTimer=setTimeout(()=>{const b=root.querySelector?.('[data-lesson="skip"]');if(b)b.hidden=false;},7000);
 const close=kind=>{if(finished)return;finished=true;clearTimeout(skipTimer);controller.abort();root.classList?.add('done');root.querySelector?.('.sketch-scene')?.classList?.remove('loop');if(kind)sketchAct(root,kind);const t=root.querySelector?.('.lesson-try span:last-child');if(t&&kind)t.textContent='Great!';setTimeout(()=>{root.remove();onDone(kind);},kind?420:0);};
 const attempt=kind=>{if(!finished&&plan.want.includes(kind))close(kind);};
 root.addEventListener('click',e=>{if(e.target.closest?.('[data-lesson="skip"]'))close(null);},options);
 root.addEventListener('pointerdown',e=>{if(e.target.closest?.('button'))return;e.preventDefault?.();start={x:e.clientX,y:e.clientY,t:e.timeStamp,id:e.pointerId,fired:false};},options);
 root.addEventListener('pointermove',e=>{if(!start||start.fired||e.pointerId!==start.id)return;const kind=classifyGesture(e.clientX-start.x,e.clientY-start.y,e.timeStamp-start.t);if(kind){start.fired=true;attempt(kind);}},options);
 root.addEventListener('pointerup',e=>{if(!start||e.pointerId!==start.id)return;if(!start.fired){const kind=classifyGesture(e.clientX-start.x,e.clientY-start.y,e.timeStamp-start.t,true);if(kind)attempt(kind);}start=null;},options);
 win?.addEventListener?.('keydown',e=>{const key=e.key?.length===1?e.key.toLowerCase():e.key,kind=KEYS[key];if(kind){e.preventDefault();e.stopImmediatePropagation();attempt(kind);}},{capture:true,signal:controller.signal});
 return{root,attempt,close};
}
