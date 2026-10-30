// Word-run panel and control hint for runner mode.
const doc=()=>globalThis.document;
let panel=null,hidden=null,hinted=false;
function ensure(){
 const d=doc();if(!d?.body)return null;if(panel?.isConnected)return panel;
 panel=d.createElement('div');panel.id='runner-word';panel.hidden=true;panel.setAttribute('role','status');panel.setAttribute('aria-live','polite');d.body.append(panel);return panel;
}
const LABEL={en:'Collect the English word',tr:'Collect the Turkish word'};
export function showWord(word){
 const p=ensure();if(!p)return;clearTimeout(hidden);p.className='';p.hidden=false;
 doc().body.classList.add('runner-word');p.setAttribute('aria-label',`${LABEL[word.language]}: ${word.prompt}`);
 p.innerHTML=`<small>${LABEL[word.language]}</small><strong lang="${word.direction==='tr-en'?'tr':'en'}">${word.prompt}</strong><em>→ ${word.language.toUpperCase()}</em><div class="runner-slots">${[...word.answer].map(()=>'<span>&nbsp;</span>').join('')}</div>`;
}
export function showProgress(letters,{wrong=false,language='en'}={}){
 const p=ensure();if(!p||p.hidden)return;const slots=p.querySelectorAll('.runner-slots span');
 letters.forEach((c,i)=>{if(slots[i]&&c){slots[i].textContent=c.toLocaleUpperCase(language);slots[i].classList.add('filled');}});
 if(wrong){p.classList.remove('shake');void p.offsetWidth;p.classList.add('shake');}
}
export function finishWord(word,letters){
 const p=ensure();if(!p)return false;const complete=letters.every(Boolean),slots=p.querySelectorAll('.runner-slots span');
 [...word.answer].forEach((c,i)=>{if(slots[i]&&!letters[i]){slots[i].textContent=c.toLocaleUpperCase(word.language);slots[i].classList.add('missed');}});
 p.classList.add(complete?'complete':'revealed');clearTimeout(hidden);hidden=setTimeout(()=>{p.hidden=true;doc().body.classList.remove('runner-word');},complete?1300:2200);return complete;
}
export function hideWord(){if(panel){clearTimeout(hidden);panel.hidden=true;}doc()?.body?.classList.remove('runner-word');}
export function controlHint(touch){if(hinted)return null;hinted=true;return touch?'Swipe ← → to change lane · swipe ↑ to jump · swipe ↓ to slide':'← → change lane · ↑ jump · ↓ slide';}

// "Stumble!" and similar call-outs: a short pop in the middle of the track.
let flashEl=null,flashTimer=null;
export function flash(text,tone='stumble'){
 const d=doc();if(!d?.body)return;if(!flashEl?.isConnected){flashEl=d.createElement('div');flashEl.id='runner-flash';flashEl.setAttribute('aria-hidden','true');d.body.append(flashEl);}
 flashEl.textContent=text;flashEl.className='';void flashEl.offsetWidth;flashEl.className='show '+tone;clearTimeout(flashTimer);flashTimer=setTimeout(()=>{flashEl.className='';},700);
}
// Vertical progress to the next gate along the right edge: the gate at the top, the creature climbing toward it.
let bar=null;
export function runProgress(fraction){
 const d=doc();if(!d?.body)return;
 if(fraction==null){if(bar)bar.hidden=true;return;}
 if(!bar?.isConnected){bar=d.createElement('div');bar.id='runner-progress';bar.setAttribute('role','progressbar');bar.setAttribute('aria-label','Distance to the next gate');bar.innerHTML='<span class="gate">🏁</span><div class="rail"><div class="fill"></div><span class="me"></span></div>';d.body.append(bar);}
 const f=Math.max(0,Math.min(1,fraction));bar.hidden=false;bar.style.setProperty('--run',f.toFixed(3));bar.setAttribute('aria-valuenow',String(Math.round(f*100)));
}
// Active power-ups as small chips under the top bar, with seconds left.
let chips=null;const CHIP={magnet:'🧲',shield:'🛡️',double:'×2',dash:'⚡'};
export function powerChips(power){
 const d=doc();if(!d?.body)return;const active=power?Object.entries(power).filter(([k,v])=>k==='shield'?v:v>0):[];
 if(!active.length){if(chips)chips.hidden=true;return;}
 if(!chips?.isConnected){chips=d.createElement('div');chips.id='runner-powers';chips.setAttribute('aria-live','polite');d.body.append(chips);}
 chips.hidden=false;const html=active.map(([k,v])=>`<span class="chip ${k}">${CHIP[k]}${k==='shield'?'':` ${Math.ceil(v)}s`}</span>`).join('');if(chips.innerHTML!==html)chips.innerHTML=html;
}
// Speed lines: streaks at the screen edges that grow with speed, boost and dash.
let lines=null;
export function speedLines(amount){
 const d=doc();if(!d?.body)return;const a=Math.max(0,Math.min(1,amount-.35));
 if(!lines?.isConnected){if(!a)return;lines=d.createElement('div');lines.id='runner-speed';lines.setAttribute('aria-hidden','true');d.body.append(lines);}
 lines.style.opacity=String(a.toFixed(2));
}
