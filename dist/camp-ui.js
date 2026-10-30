import{launchMarkup}from'./launch-ui.js';
// Markup for the camp, first-launch picker, Wordex, wardrobe, run summary and mistake corrections.
// Pure template functions: the app passes in state and wires the data-do actions.
import{icon,questIcon}from'./ui-icons.js';
import{QUESTS}from'./daily.js';
import{COSMETICS,KINDS}from'./cosmetics.js';
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=v=>Math.round(Math.max(0,Math.min(1,v))*100);

export function growthBar(g,{label=true}={}){if(g.path){const text=g.complete?'Form 10 reached':g.boss?(g.remaining?`Complete ${g.remaining} more English checkpoint${g.remaining===1?'':'s'}, then defeat the boss for Form ${g.next}`:`Defeat the arena boss to reach Form ${g.next}`):`Form ${g.next} in ${g.remaining} English checkpoint${g.remaining===1?'':'s'}`;return`<div class="growth-bar" role="img" aria-label="${text}">${label?`<div class="growth-label"><span>${text}</span><b>${g.points} / ${g.total||20}</b></div>`:''}<div class="growth-track"><i style="width:${pct(g.progress)}%"></i></div></div>`;}return`<div class="growth-bar" role="img" aria-label="Growth to Form ${g.next}: ${pct(g.progress)} percent">${label?`<div class="growth-label"><span>Growth to Form ${g.next}</span><b>${g.points} / ${g.need.points}</b></div>`:''}<div class="growth-track"><i style="width:${pct(g.progress)}%"></i></div>${label&&g.need.mastered?`<small>${g.mastered} / ${g.need.mastered} words mastered over several days</small>`:''}</div>`;}
export function streakMarkup(info){const days=['M','T','W','T','F','S','S'],today=new Date().getDay(),labels=Array.from({length:7},(_,i)=>days[(today+i+0)%7]);return`<div class="streak-row"><span class="flame ${info.streak>1?'lit':''}">${icon(info.streak>1?'fire':'spark')} ${info.streak>1?`${info.streak}-day trail`:info.playedToday?'On the trail today':'Ready when you are'}</span><span class="week-dots" aria-label="Days played in the last week">${info.week.map((on,i)=>`<i class="${on?'on':''}" title="${labels[i]}"></i>`).join('')}</span><small>${info.total} journey day${info.total===1?'':'s'}</small></div>`;}
export function questsMarkup(daily){return`<div class="quest-list"><div class="quest-head"><span>Today's quests</span>${daily.bonus?'<b>All done ✧</b>':''}</div>${daily.quests.map(q=>{const spec=QUESTS.find(x=>x.id===q.id);return`<div class="quest ${q.done?'done':''}"><span class="quest-icon">${icon(q.done?'check':questIcon(q.id))}</span><span class="quest-text">${esc(spec.label)}<i style="width:${pct(q.progress/spec.goal)}%"></i></span><b>${q.done?'Done':`${q.progress}/${spec.goal}`}</b></div>`;}).join('')}</div>`;}

// Camp: the creature, its growth, today's quests and one big button back onto the trail.
export function campMarkup(c){return launchMarkup(c);}
export function onboardingMarkup(o){return launchMarkup({...o,firstLaunch:true});}

// Wordex: a collection book of the unit's words. Unknown words stay as silhouettes until discovered.
export function wordexMarkup(w){
 const stars=b=>'★'.repeat(Math.min(5,b))+'☆'.repeat(Math.max(0,5-b));
 return`<div class="wordex"><div class="wordex-summary"><div><b>${w.found}</b><small>discovered</small></div><div><b>${w.mastered}</b><small>mastered</small></div><div><b>${w.total}</b><small>in ${esc(w.unitTitle)}</small></div></div>
 <p class="wordex-hint">Answer a word correctly to discover it. Words grow stars when you remember them on different days. Tap a card to hear it.</p>
 <div class="wordex-grid">${w.words.map(x=>x.box>0?`<button class="word-card box-${Math.min(5,x.box)}" data-do="say" data-text="${esc(x.en)}" aria-label="${esc(x.en)}, ${esc(x.tr)}, ${x.box} of 5 stars">${x.picture?`<img src="${esc(x.picture)}" alt="">`:`<span class="word-glyph">${esc(x.en.slice(0,1).toUpperCase())}</span>`}<strong>${esc(x.en)}</strong><small>${esc(x.tr)}</small><span class="stars">${stars(x.box)}</span></button>`:`<div class="word-card unknown" aria-label="Undiscovered word"><span class="word-glyph">?</span><strong>${'•'.repeat(Math.min(8,Math.max(3,x.en.length)))}</strong><small>Not yet found</small></div>`).join('')}</div></div>`;
}

// Wardrobe: wind trails, hats, coat colours and camp decorations, all bought with coins.
export function shopMarkup(s){
 const tab=s.tab||'trail';const items=tab==='trail'?s.trails.map(t=>({...t,kind:'trail',owned:s.owned.includes(t.id),on:s.equipped===t.id})):COSMETICS.filter(c=>c.kind===tab).map(c=>({...c,owned:s.owned.includes(c.id),on:c.kind==='hat'?s.hat===c.id:c.kind==='coat'?s.coat===c.id:(s.camp||[]).includes(c.id)}));
 return`<div class="trail-shop wardrobe"><h3>${icon('coin')} ${s.balance} coins</h3><p>Coins unlock looks for ${esc(s.nickname)}. English practice is what grows your creature.</p><div class="shop-tabs" role="tablist">${KINDS.map(([id,label])=>`<button role="tab" data-do="shop-tab" data-tab="${id}" aria-selected="${id===tab}" class="${id===tab?'selected':''}">${label}</button>`).join('')}</div>
 <div class="shop-items">${items.map(t=>`<button data-do="${t.kind==='trail'?'equip-trail':'cosmetic'}" data-${t.kind==='trail'?'trail':'item'}="${t.id}" class="${t.on?'equipped':''}"><i style="background:${t.color||'#ccc'}"></i><span>${esc(t.name)}</span><b>${t.on?(t.kind==='camp'?'Placed':'Equipped'):t.owned?(t.kind==='camp'?'Place':'Equip'):t.cost+' coins'}</b></button>`).join('')}</div>${tab==='camp'?'<p class="shop-note">Camp decorations appear around your creature at camp.</p>':''}</div>`;
}

// Better mistakes: the right answer, its Turkish meaning and one reason, then the item returns later.
export function correctionMarkup(x){if(!x)return'';return`<div class="correction-card" role="status"><div class="correction-top"><span>Not quite</span><small>We'll practise this again soon</small></div><div class="correction-answer">✓ ${esc(x.answer)}</div>${x.tr?`<div class="correction-tr"><abbr title="Türkçe">TR</abbr> ${esc(x.tr)}</div>`:''}<p>${esc(x.reason)}</p></div>`;}

export function runSummaryMarkup(r){
 const actions=r.outcome.evolved?`<button class="primary wide" data-do="evolve-now">Evolve to Form ${r.level} ✧</button>`:r.outcome.guardian?`<button class="primary wide" data-do="guardian">Challenge the guardian →</button><button class="secondary wide" data-do="camp">Rest at camp</button>`:`<button class="primary wide" data-do="${r.outcome.weekComplete?'next-expedition':'next-run'}">${r.outcome.weekComplete?'Replay this path':'Next run'} →</button><button class="secondary wide" data-do="camp">Rest at camp</button>`;
 return`<div class="run-summary">${r.story?`<p class="run-story"><strong>${esc(r.story.title)}</strong><br>${esc(r.story.text)}${r.story.discovered?'<br>Trail discovery found.':''}<br>You can rest here. Your progress is saved.</p>`:''}<div class="chest-burst" aria-hidden="true"><span class="chest-icon">${icon('chest')}</span></div><p class="run-sub">${esc(r.title)}</p>
 <div class="run-stats"><div><b>${r.correct}</b><small>correct</small></div><div><b>${r.perfect}</b><small>perfect tasks</small></div><div><b>+${r.coins}</b><small>chest coins</small></div><div><b>+${r.growth}</b><small>Wordex stars</small></div></div>
 ${r.outcome.evolved?`<p class="evolve-ready">✧ ${esc(r.nickname)} is ready to grow!</p>`:growthBar(r.growthState)}
 ${r.learned.length?`<div class="word-chips"><span>New in your Wordex</span>${r.learned.slice(0,8).map(w=>`<button data-do="say" data-text="${esc(w.en)}">${esc(w.en)} <small>${esc(w.tr)}</small></button>`).join('')}</div>`:''}
 ${r.review.length?`<div class="word-chips review"><span>Coming back next time</span>${r.review.slice(0,6).map(w=>`<button data-do="say" data-text="${esc(w.en)}">${esc(w.en)} <small>${esc(w.tr)}</small></button>`).join('')}</div>`:''}
 ${questsMarkup(r.daily)}
 <div class="run-actions">${actions}</div></div>`;
}
