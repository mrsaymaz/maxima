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
 p.innerHTML=`<small>${LABEL[word.language]}</small><strong lang="${word.direction==='tr-en'?'tr':'en'}">${word.prompt}</strong><div class="runner-slots">${[...word.answer].map(()=>'<span>&nbsp;</span>').join('')}</div>`;
}
export function showProgress(letters,{wrong=false,language='en'}={}){
 const p=ensure();if(!p||p.hidden)return;const slots=p.querySelectorAll('.runner-slots span');
 letters.forEach((c,i)=>{if(slots[i]&&c){slots[i].textContent=c.toLocaleUpperCase(language);slots[i].classList.add('filled');}});
 if(wrong){p.classList.remove('shake');void p.offsetWidth;p.classList.add('shake');}
}
export function finishWord(word,letters){
 const p=ensure();if(!p)return false;const complete=letters.every(Boolean),slots=p.querySelectorAll('.runner-slots span');
 [...word.answer].forEach((c,i)=>{if(slots[i]&&!letters[i]){slots[i].textContent=c.toLocaleUpperCase(word.language);slots[i].classList.add('missed');}});
 p.classList.add(complete?'complete':'revealed');clearTimeout(hidden);hidden=setTimeout(()=>{p.hidden=true;},complete?2200:3200);return complete;
}
export function hideWord(){if(panel){clearTimeout(hidden);panel.hidden=true;}}
export function controlHint(touch){if(hinted)return null;hinted=true;return touch?'Swipe ← → to change lane · swipe ↑ to jump · swipe ↓ to slide':'← → change lane · ↑ jump · ↓ slide';}
