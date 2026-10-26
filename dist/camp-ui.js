// Markup for the camp, first-launch picker, Wordex, wardrobe, run summary and mistake corrections.
// Pure template functions: the app passes in state and wires the data-do actions.
import{QUESTS}from'./daily.js';
import{COSMETICS,KINDS}from'./cosmetics.js';
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=v=>Math.round(Math.max(0,Math.min(1,v))*100);

export function growthBar(g,{label=true}={}){return`<div class="growth-bar" role="img" aria-label="Growth to Form ${g.next}: ${pct(g.progress)} percent">${label?`<div class="growth-label"><span>Growth to Form ${g.next}</span><b>${g.points} / ${g.need.points}</b></div>`:''}<div class="growth-track"><i style="width:${pct(g.progress)}%"></i></div>${label&&g.need.mastered?`<small>${g.mastered} / ${g.need.mastered} words mastered over several days</small>`:''}</div>`;}
export function streakMarkup(info){const days=['M','T','W','T','F','S','S'],today=new Date().getDay(),labels=Array.from({length:7},(_,i)=>days[(today+i+0)%7]);return`<div class="streak-row"><span class="flame ${info.streak>1?'lit':''}">${info.streak>1?'🔥':'✧'} ${info.streak>1?`${info.streak}-day trail`:info.playedToday?'On the trail today':'Ready when you are'}</span><span class="week-dots" aria-label="Days played in the last week">${info.week.map((on,i)=>`<i class="${on?'on':''}" title="${labels[i]}"></i>`).join('')}</span><small>${info.total} journey day${info.total===1?'':'s'}</small></div>`;}
export function questsMarkup(daily){return`<div class="quest-list"><div class="quest-head"><span>Today's quests</span>${daily.bonus?'<b>All done ✧</b>':''}</div>${daily.quests.map(q=>{const spec=QUESTS.find(x=>x.id===q.id);return`<div class="quest ${q.done?'done':''}"><span class="quest-icon">${q.done?'✓':spec.icon}</span><span class="quest-text">${esc(spec.label)}<i style="width:${pct(q.progress/spec.goal)}%"></i></span><b>${q.done?'Done':`${q.progress}/${spec.goal}`}</b></div>`;}).join('')}</div>`;}

// Camp: the creature, its growth, today's quests and one big button back onto the trail.
export function campMarkup(c){
 return`<div class="camp-layout"><section class="camp-card">
 <div class="camp-head"><img src="${c.portrait}" alt=""><div><span class="level-badge">FORM ${c.level} · ${esc(c.element.toUpperCase())}</span><strong>${esc(c.nickname)}</strong><small>${esc(c.unitTitle)} · Grade ${c.grade}</small></div><button class="icon-button rename" data-do="rename" aria-label="Rename your creature">✎</button></div>
 ${c.guardian?`<button class="guardian-call" data-do="guardian">⚔ ${esc(c.guardian)} awaits · Challenge the guardian →</button>`:growthBar(c.growth)}
 ${streakMarkup(c.streak)}
 ${questsMarkup(c.daily)}
 <button class="primary wide go-button" data-do="${c.completed?'lessons':'enter'}"><span>${c.completed?'Choose a new journey':c.resume?'Continue from checkpoint':`Start run ${c.runNumber}`}<small>${esc(c.runLabel)}</small></span><span>→</span></button>
 <div class="camp-actions"><button data-do="wordex"><b>❖</b>Wordex<small>${c.words.found}/${c.words.total}</small></button><button data-do="trails"><b>✦</b>Wardrobe<small>◉ ${c.coins}</small></button><button data-do="lessons"><b>▤</b>Lesson<small>G${c.grade}</small></button><button data-do="journal"><b>☰</b>Journal<small>${c.due} due</small></button></div>
 <details class="camp-more"><summary>Creature, arena and mode</summary>
 <div class="partner-choices" role="group" aria-label="Choose your creature">${c.partners.map(p=>`<button data-do="partner" data-partner="${p.id}" class="${p.selected?'selected':''}" aria-pressed="${p.selected}"><img src="${p.portrait}" alt=""><span><strong>${esc(p.name)}</strong><small>${esc(p.element.toUpperCase())} · Form ${c.level}</small></span></button>`).join('')}</div>
 <div class="area-options">${c.areas.map((a,i)=>`<button class="area-card ${a.selected?'selected':''}" data-do="area" data-area="${i}" aria-pressed="${a.selected}"><span class="area-number">0${i+1}</span>${a.locked?'<span class="lock">LOCKED</span>':''}<strong>${esc(a.name)}</strong><small>${a.locked?'Defeat the previous guardian':esc(a.levels)}</small></button>`).join('')}</div>
 <div class="segmented">${['relaxed','challenge'].map(m=>`<button data-do="mode" data-mode="${m}" class="${m===c.mode?'selected':''}" aria-pressed="${m===c.mode}">${m==='relaxed'?'Relaxed':'Challenge'}</button>`).join('')}</div>
 <div class="camp-links"><button class="text-button" data-do="help">How to play</button><button class="text-button" data-do="evolution-preview">✧ Preview transformation</button><a class="walk-preview-link" href="${c.previewHref}" target="_blank" rel="noopener">Movement previews ↗</a></div>
 </details></section></div>`;
}

// First launch: one big creature, a name, a grade and Go.
export function onboardingMarkup(o){
 return`<section class="onboard" aria-label="Choose your creature"><div class="onboard-title"><span class="eyebrow">MAXIMA · YOUR CREATURE PARTNER</span><h1>Who will you explore with?</h1></div>
 <div class="onboard-panel"><div class="onboard-picker"><button class="onboard-arrow" data-do="partner-step" data-step="-1" aria-label="Previous creature">‹</button><div class="onboard-name"><strong>${esc(o.partner.name)}</strong><small>${esc(o.partner.element.toUpperCase())} · ${esc(o.attack)}</small></div><button class="onboard-arrow" data-do="partner-step" data-step="1" aria-label="Next creature">›</button></div>
 <div class="onboard-dots">${o.partners.map(p=>`<button data-do="partner" data-partner="${p.id}" class="${p.selected?'selected':''}" aria-label="${esc(p.name)}, ${esc(p.element)}"><img src="${p.portrait}" alt=""></button>`).join('')}</div>
 <label class="onboard-label" for="onboard-name">Name your creature</label><input class="input onboard-input" id="onboard-name" maxlength="24" value="${esc(o.nickname)}" autocomplete="off" enterkeyhint="go">
 <div class="onboard-grades" role="group" aria-label="Your grade">${[5,6,7,8].map(g=>`<button data-do="onboard-grade" data-grade="${g}" class="${g===o.grade?'selected':''}" aria-pressed="${g===o.grade}">Grade ${g}</button>`).join('')}</div>
 <button class="primary wide go-button" data-do="go"><span>Go!</span><span>→</span></button></div></section>`;
}

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
 return`<div class="trail-shop wardrobe"><h3>◉ ${s.balance} coins</h3><p>Coins unlock looks for ${esc(s.nickname)}. English practice is what grows your creature.</p><div class="shop-tabs" role="tablist">${KINDS.map(([id,label])=>`<button role="tab" data-do="shop-tab" data-tab="${id}" aria-selected="${id===tab}" class="${id===tab?'selected':''}">${label}</button>`).join('')}</div>
 <div class="shop-items">${items.map(t=>`<button data-do="${t.kind==='trail'?'equip-trail':'cosmetic'}" data-${t.kind==='trail'?'trail':'item'}="${t.id}" class="${t.on?'equipped':''}"><i style="background:${t.color||'#ccc'}"></i><span>${esc(t.name)}</span><b>${t.on?(t.kind==='camp'?'Placed':'Equipped'):t.owned?(t.kind==='camp'?'Place':'Equip'):t.cost+' coins'}</b></button>`).join('')}</div>${tab==='camp'?'<p class="shop-note">Camp decorations appear around your creature at camp.</p>':''}</div>`;
}

// Better mistakes: the right answer, its Turkish meaning and one reason, then the item returns later.
export function correctionMarkup(x){if(!x)return'';return`<div class="correction-card" role="status"><div class="correction-top"><span>Not quite</span><small>We'll practise this again soon</small></div><div class="correction-answer">✓ ${esc(x.answer)}</div>${x.tr?`<div class="correction-tr"><abbr title="Türkçe">TR</abbr> ${esc(x.tr)}</div>`:''}<p>${esc(x.reason)}</p></div>`;}

export function runSummaryMarkup(r){
 const actions=r.outcome.evolved?`<button class="primary wide" data-do="evolve-now">Evolve to Form ${r.level} ✧</button>`:r.outcome.guardian?`<button class="primary wide" data-do="guardian">Challenge the guardian →</button><button class="secondary wide" data-do="camp">Rest at camp</button>`:`<button class="primary wide" data-do="next-run">${r.outcome.weekComplete?'Start a new week of runs':'Next run'} →</button><button class="secondary wide" data-do="camp">Rest at camp</button>`;
 return`<div class="run-summary"><div class="chest-burst" aria-hidden="true"><span class="chest-icon">🎁</span></div><p class="run-sub">${esc(r.title)}</p>
 <div class="run-stats"><div><b>${r.correct}</b><small>correct</small></div><div><b>${r.perfect}</b><small>perfect tasks</small></div><div><b>+${r.coins}</b><small>chest coins</small></div><div><b>+${r.growth}</b><small>growth</small></div></div>
 ${r.outcome.evolved?`<p class="evolve-ready">✧ ${esc(r.nickname)} is ready to grow!</p>`:growthBar(r.growthState)}
 ${r.learned.length?`<div class="word-chips"><span>New in your Wordex</span>${r.learned.slice(0,8).map(w=>`<button data-do="say" data-text="${esc(w.en)}">${esc(w.en)} <small>${esc(w.tr)}</small></button>`).join('')}</div>`:''}
 ${r.review.length?`<div class="word-chips review"><span>Coming back next time</span>${r.review.slice(0,6).map(w=>`<button data-do="say" data-text="${esc(w.en)}">${esc(w.en)} <small>${esc(w.tr)}</small></button>`).join('')}</div>`:''}
 ${questsMarkup(r.daily)}
 <div class="run-actions">${actions}</div></div>`;
}
