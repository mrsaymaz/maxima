import{specialsFor,specialDamage,special}from'./specials.js';
import{specialIcon}from'./special-icons.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const COIN='<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.5 10h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4"/></svg>';
// The Elemental Shrine: the team's three specials, what each costs and does at this Level, and the way into the arena.
export function shrineMarkup({team,element,balance=0,level=0,owned=[]}){
 const cards=specialsFor(team).map(s=>{const have=owned.includes(s.id),short=balance<s.price;return `<div class="shrine-card tier-${s.tier}${have?' owned':''}" data-element="${esc(element.toLowerCase())}"><span class="shrine-icon">${specialIcon(s.id)}</span><div class="shrine-text"><h3>${esc(s.name)}</h3><p>${esc(s.line)}</p><small>${specialDamage(s,level)}% guardian damage${s.bind?' · binds: next cast is critical':''}</small></div><button type="button" data-do="buy-special" data-id="${s.id}"${have||short?' disabled':''} aria-label="${have?esc(s.name)+' ready':'Buy '+esc(s.name)+' for '+s.price+' coins'}">${have?'Ready ✓':`${COIN}${s.price}`}</button></div>`;}).join('');
 return `<div class="shrine" data-element="${esc(element.toLowerCase())}"><p class="shrine-intro">Your ${esc(element)} power gathers here. Each special works <b>once</b> in this guardian fight and grows with your Level. It cannot break the English wards: you still answer them to win.</p><div class="shrine-wallet">${COIN}<b>${balance}</b> coins · Level ${level}</div><div class="shrine-cards">${cards}</div><button type="button" class="primary-action wide" data-do="enter-arena">Enter the arena</button></div>`;
}
// The arena's special bar: one simple icon per bought special, stacked on the side away from the joystick.
export const specialReady=(b,id,busy=false)=>!busy&&['windup','strike','recovery'].includes(b?.phase)&&!!b?.specials?.includes(id)&&!b.specialsUsed?.includes(id);
export function specialBar(b,{busy=false}={}){const list=b?.specials||[];if(!list.length)return'';
 return list.map(id=>{const s=special(id),used=b.specialsUsed?.includes(id);return `<button type="button" class="special-button tier-${s.tier}${used?' used':''}" data-do="use-special" data-id="${id}"${specialReady(b,id,busy)?'':' disabled'} aria-label="${esc(s.name)}${used?' (used)':' · one use'}">${specialIcon(id)}<small>${esc(s.name)}</small></button>`;}).join('');}
// The bar is rebuilt only when the bought or used specials change; phase changes just enable or disable buttons,
// so a press never lands on a button that was replaced mid-tap.
export const specialKey=b=>[(b?.specials||[]).join(),(b?.specialsUsed||[]).join()].join('|');
// The shrine on the path: a title chip with the coins, one tag under each pedestal (placed by the app on screen),
// and the way into the arena. A tag shows the special, its damage at this Level and a Buy button with its price;
// when the coins are short it says how many more are needed, so the goal stays in sight.
export function shrineOverlay({team,element,balance=0,level=0,owned=[],ulti=null}){
 const tags=specialsFor(team).map((s,i)=>{const have=owned.includes(s.id),need=Math.max(0,s.price-balance);
  return `<div class="shrine-tag tier-${s.tier}${have?' owned':need?' short':' ready'}" data-slot="${i}" data-element="${esc(element.toLowerCase())}"><span class="shrine-tag-icon">${specialIcon(s.id)}</span><b>${esc(s.name)}</b><small>${specialDamage(s,level)}% damage${s.bind?' · binds':''}</small>
  <button type="button" data-do="buy-special" data-id="${s.id}"${have||need?' disabled':''} aria-label="${have?esc(s.name)+' ready':'Buy '+esc(s.name)+' for '+s.price+' coins'}">${have?'Ready ✓':`<span class="buy-word">Buy</span>${COIN}${s.price}`}</button>${have?'':need?`<em>${need} more coins</em>`:''}</div>`;}).join('');
 return `<div class="shrine-head"><b>Elemental Shrine</b><span class="shrine-coins">${COIN}${balance}</span><small>Each special works once in the guardian fight · it cannot break the English wards</small>${ulti?`<span class="shrine-ulti">${ulti.icon}Win: +${ulti.points} Ulti for Grade ${ulti.grade} ${esc(ulti.team)}</span>`:''}</div><div class="shrine-tags">${tags}</div><button type="button" class="shrine-enter" data-do="enter-arena">Enter the arena →</button>`;
}
