// A simplified creature on a small three-lane track, drawn in SVG (0.64.0). The controls tutorial and the first-time
// danger lessons use it to show each move: the sketch changes lane, jumps, slides, casts at a crystal wall and walks
// with the joystick. It is coloured like the student's team, so it reads as "your creature" without loading a model.
const LANE_X=[52,100,148];
export const sketchLaneX=lane=>LANE_X[Math.max(0,Math.min(2,lane))];
// Body colours that read like each team's creature (the bear, lion cub, snake and owl), not the pale UI tints.
export const SKETCH_COLORS={hufflepuff:'#b8743c',gryffindor:'#f0a33a',slytherin:'#63b04f',ravenclaw:'#8d9bb3'};
export const sketchColor=id=>SKETCH_COLORS[id]||'#f0a33a';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// The creature itself: a round body, ears, big eyes and feet, centred on (0,0) and about 34 px tall.
export function creatureSvg(color='#ffb968'){
 return`<g class="sk-creature-body"><ellipse class="sk-shadow" cx="0" cy="17" rx="15" ry="4"/><ellipse cx="-9" cy="-15" rx="5.5" ry="7" fill="${esc(color)}" stroke="#2b2116" stroke-width="2"/><ellipse cx="9" cy="-15" rx="5.5" ry="7" fill="${esc(color)}" stroke="#2b2116" stroke-width="2"/><ellipse cx="0" cy="0" rx="16" ry="15" fill="${esc(color)}" stroke="#2b2116" stroke-width="2.2"/><ellipse cx="0" cy="5" rx="9" ry="7" fill="#fff6e0" opacity=".85"/><circle cx="-6" cy="-3" r="4.2" fill="#fff"/><circle cx="6" cy="-3" r="4.2" fill="#fff"/><circle cx="-5.2" cy="-2.6" r="2.3" fill="#1c1c24"/><circle cx="6.8" cy="-2.6" r="2.3" fill="#1c1c24"/><path d="M-3 4 Q0 7 3 4" stroke="#2b2116" stroke-width="1.6" fill="none" stroke-linecap="round"/><ellipse cx="-8" cy="14" rx="5" ry="3" fill="${esc(color)}" stroke="#2b2116" stroke-width="1.8"/><ellipse cx="8" cy="14" rx="5" ry="3" fill="${esc(color)}" stroke="#2b2116" stroke-width="1.8"/></g>`;
}
// What stands on the track ahead in each demo. `danger` lanes glow amber, `safe` lanes blue.
const HAZARD={roots:'🌿',seeds:'🌰',volley:'🪨',shards:'💎',prism:'🔆',boulders:'🪨',thorns:'🌵',dive:'💥'};
function lanePoly(lane,colour,opacity){const top=[88,100,112][lane],bottom=LANE_X[lane];return`<polygon points="${top-6},26 ${top+6},26 ${bottom+24},150 ${bottom-24},150" fill="${colour}" opacity="${opacity}"/>`;}
// demo: 'lanes' (plain track) · 'crystal' · 'lane' (amber lanes to leave) · 'wave' (a wave to jump) · 'arena' (joystick)
export function sketchScene({demo='lanes',lane=1,color='#ffb968',danger=[],safe=[],hazard='roots',stick='right',caption='',loop=false}={}){
 let ahead='';
 if(demo==='crystal')ahead=`<g class="sk-wall">${[0,1,2,3,4,5,6].map(i=>`<polygon class="sk-shard" style="--k:${i}" points="${60+i*12},84 ${66+i*12},62 ${72+i*12},84" fill="${i%2?'#d48bff':'#62f5ff'}" stroke="#e9fbff" stroke-width="1.2"/>`).join('')}</g>`;
 if(demo==='lane')ahead=danger.map(l=>lanePoly(l,'#ffb02e',.55)).join('')+safe.map(l=>lanePoly(l,'#3fa7ff',.45)).join('')+danger.map(l=>`<text class="sk-hazard" x="${[88,100,112][l]}" y="40" text-anchor="middle" font-size="18" style="--to:${LANE_X[l]-[88,100,112][l]}px">${HAZARD[hazard]||'⚠️'}</text>`).join('');
 if(demo==='bar')ahead=`<g class="sk-bar"><rect x="62" y="58" width="6" height="30" fill="#7a4e2a"/><rect x="132" y="58" width="6" height="30" fill="#7a4e2a"/><rect x="58" y="56" width="84" height="9" rx="3" fill="#e8a13a" stroke="#5b3512" stroke-width="2"/></g>`;
 if(demo==='wave')ahead=`<g class="sk-wave"><path d="M40 0 Q100 -10 160 0" stroke="#ffd34d" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M40 0 Q100 -10 160 0" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></g>`;
 const track=demo==='arena'?`<ellipse cx="100" cy="98" rx="92" ry="46" fill="#3a6b45" stroke="#244a30" stroke-width="3"/><text x="100" y="62" text-anchor="middle" font-size="22" class="sk-rival">👾</text>`
  :`<polygon points="82,26 118,26 176,150 24,150" fill="#41644a"/><line x1="94" y1="26" x2="76" y2="150" stroke="#e9f6d4" stroke-opacity=".55" stroke-width="2" stroke-dasharray="6 6"/><line x1="106" y1="26" x2="124" y2="150" stroke="#e9f6d4" stroke-opacity=".55" stroke-width="2" stroke-dasharray="6 6"/>`;
 const at=demo==='arena'?'translate(100px,112px)':`translate(${sketchLaneX(lane)}px,122px)`;
 const joystick=demo==='arena'?`<g class="sk-stick" transform="translate(${stick==='left'?32:168},128)"><circle r="18" fill="#102e28" fill-opacity=".75" stroke="#f2e9c7" stroke-width="2"/><circle class="sk-thumb" r="8" fill="#efe3bc"/></g>`:'';
 return`<div class="sketch-scene demo-${esc(demo)}${loop?' loop':''}" data-lane="${lane}" style="--x:${demo==='arena'?100:sketchLaneX(lane)}px"><svg viewBox="0 0 200 150" role="img" aria-label="${esc(caption||'Your creature on the track')}">${track}${ahead}<g class="sk-creature" style="transform:${at}"><g class="sk-act">${creatureSvg(color)}</g><circle class="sk-tap-ring" r="22" fill="none" stroke="#fff4b8" stroke-width="3"/></g><g class="sk-bolt"><circle r="6" fill="#fff4b8"/><circle r="10" fill="#ffd34d" opacity=".35"/></g>${joystick}</svg></div>`;
}
// Plays one move on a sketch already in the page: lane change, jump, slide or cast (which shatters a crystal wall).
export function sketchAct(root,kind){
 const scene=root?.querySelector?.('.sketch-scene');if(!scene)return;const creature=scene.querySelector('.sk-creature');
 if(kind==='left'||kind==='right'){const lane=Math.max(0,Math.min(2,Number(scene.dataset.lane||1)+(kind==='left'?-1:1)));scene.dataset.lane=String(lane);if(creature&&!scene.classList.contains('demo-arena')){creature.style.transform=`translate(${sketchLaneX(lane)}px,122px)`;scene.style.setProperty?.('--x',sketchLaneX(lane)+'px');}}
 const cls={up:'act-jump',down:'act-slide',tap:'act-cast',left:'act-lane',right:'act-lane'}[kind];if(!cls)return;
 scene.classList.remove('act-jump','act-slide','act-cast','act-lane');void scene.offsetWidth;scene.classList.add(cls);
}
