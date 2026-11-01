import { guideFigure } from './guide.js';
import { STORY_SCENES, STORY_GUARDIANS, sceneLines } from './story.js';
// Story cut-scenes (0.69.0): an illustrated panel over the paused game. Each arena has a painted SVG backdrop;
// the Sol Crystal shows how many shards are back; guardian scenes add the guardian's silhouette. Mr. Saymaz stands
// beside a dialogue box. Each line is read aloud (onLine); TR shows the Turkish meaning, Next moves on, Skip ends.
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const SKY = [
  ['#7fd3c0', '#d7f4c8', '#2f6b3f', '#1f4c2d'],
  ['#8ec5ff', '#ffe0b3', '#b0763f', '#7a4a26'],
  ['#3b2a6e', '#c08cf0', '#4a3a8a', '#261b4d'],
];
function landscape(area) {
  const [top, low, near, far] = SKY[area] || SKY[0];
  const sky = `<defs><linearGradient id="sky${area}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${low}"/></linearGradient><radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6c8" stop-opacity=".9"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></radialGradient></defs><rect width="400" height="300" fill="url(#sky${area})"/>`;
  if (area === 1)
    return `${sky}<path d="M0 190 L40 150 L80 150 L95 120 L150 120 L170 170 L230 170 L250 110 L320 110 L340 160 L400 150 L400 300 L0 300Z" fill="${far}" opacity=".75"/><path d="M60 200 h120 M60 196 h120" stroke="#5a3a1c" stroke-width="3"/><path d="M60 200 q60 18 120 0" fill="none" stroke="#5a3a1c" stroke-width="2"/><path d="M0 240 Q100 200 200 230 T400 220 L400 300 L0 300Z" fill="${near}"/><g fill="#fff" opacity=".7"><ellipse cx="80" cy="60" rx="34" ry="10"/><ellipse cx="290" cy="40" rx="44" ry="11"/></g><g stroke="#fff" stroke-width="2" fill="none" opacity=".6"><path d="M240 80 q30 -10 60 0"/><path d="M60 100 q24 -8 48 0"/></g>`;
  if (area === 2)
    return `${sky}<g fill="${far}" opacity=".9">${[20, 70, 130, 200, 260, 330, 370].map((x, i) => `<polygon points="${x},300 ${x + 18},${150 - (i % 3) * 30} ${x + 36},300"/>`).join('')}</g><g fill="#9f7cf0" opacity=".55">${[45, 160, 300].map(x => `<polygon points="${x},300 ${x + 12},200 ${x + 24},300"/>`).join('')}</g><path d="M0 250 Q120 230 200 245 T400 240 L400 300 L0 300Z" fill="${near}"/><g fill="#fff" opacity=".8">${[[50, 40], [120, 70], [310, 50], [360, 90], [220, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6"/>`).join('')}</g>`;
  return `${sky}<g fill="${far}">${[0, 60, 120, 180, 240, 300, 360].map((x, i) => `<circle cx="${x + 20}" cy="${200 - (i % 2) * 18}" r="${46 + (i % 3) * 8}"/>`).join('')}</g><path d="M0 240 Q90 215 200 235 T400 228 L400 300 L0 300Z" fill="${near}"/><g fill="#ffe27a" opacity=".85">${[[70, 230], [150, 250], [260, 240], [330, 255]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4"/>`).join('')}</g>`;
}
// Guardian silhouettes: dark shapes with glowing eyes, drawn in the backdrop's far right.
function guardian(i) {
  const eye = ['#b6ff7a', '#bfe9ff', '#e2b6ff'][i] || '#fff';
  if (i === 1)
    return `<g class="story-guardian" transform="translate(120 70)"><path d="M0 0 C-60 -40 -95 -10 -110 20 C-80 10 -50 20 -30 30 C-40 50 -30 70 0 80 C30 70 40 50 30 30 C50 20 80 10 110 20 C95 -10 60 -40 0 0Z" fill="#1d2b44"/><circle cx="-8" cy="22" r="4" fill="${eye}"/><circle cx="8" cy="22" r="4" fill="${eye}"/></g>`;
  if (i === 2)
    return `<g class="story-guardian" transform="translate(120 62)"><polygon points="0,-30 26,10 18,95 -18,95 -26,10" fill="#24184a"/><polygon points="-26,10 -60,40 -40,48 -22,30" fill="#24184a"/><polygon points="26,10 60,40 40,48 22,30" fill="#24184a"/><polygon points="0,-30 10,-52 0,-44 -10,-52" fill="#24184a"/><circle cx="-8" cy="8" r="4" fill="${eye}"/><circle cx="8" cy="8" r="4" fill="${eye}"/></g>`;
  return `<g class="story-guardian" transform="translate(120 82)"><path d="M-80 90 C-90 30 -50 -20 0 -24 C50 -20 90 30 80 90Z" fill="#1d3b24"/><path d="M-50 -10 q-10 -30 -30 -36 M50 -10 q10 -30 30 -36" stroke="#1d3b24" stroke-width="8" fill="none" stroke-linecap="round"/><circle cx="-16" cy="16" r="5" fill="${eye}"/><circle cx="16" cy="16" r="5" fill="${eye}"/></g>`;
}
const crystalDefs = '<defs><radialGradient id="glow2" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6c8" stop-opacity=".9"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></radialGradient></defs>';
// The Sol Crystal (the solMaxima emblem): three shard lights, lit as shards come back.
function crystal(shards, whole) {
  const lit = i => i < shards;
  return `<g class="story-crystal${whole ? ' whole' : ''}" transform="translate(60 60)"><circle r="56" fill="url(#glow2)" opacity="${0.25 + shards * 0.22}"/><image href="logo-mark.svg" x="-34" y="-34" width="68" height="68" opacity="${whole ? 1 : 0.55 + shards * 0.12}"/>${[0, 1, 2].map(i => `<circle class="shard${lit(i) ? ' lit' : ''}" cx="${-22 + i * 22}" cy="48" r="7"/>`).join('')}</g>`;
}
export function sceneMarkup(id, { grade = 5, index = 0, showTr = false } = {}) {
  const scene = STORY_SCENES[id],
    lines = sceneLines(id, grade),
    line = lines[index];
  if (!scene || !line) return '';
  const last = index === lines.length - 1;
  return `<div class="story-art" aria-hidden="true"><svg class="story-land" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">${landscape(scene.area)}</svg><svg class="story-emblem" viewBox="0 0 120 120">${crystalDefs}${crystal(scene.shards, scene.whole)}</svg>${scene.guardian != null ? `<svg class="story-foe" viewBox="0 0 240 180">${guardian(scene.guardian)}</svg>` : ''}</div>
<div class="story-title"><small>${esc(['Whisperwood', 'Skyreach', 'Stormglass'][scene.area])}</small><span>${esc(scene.title)}</span></div>
<div class="story-cast">${guideFigure(line.pose, { cls: 'story-figure' })}</div>
<div class="story-box" role="group" aria-label="Mr. Saymaz says"><b class="story-name">Mr. Saymaz</b><p class="story-line" lang="en">${esc(line.en)}</p>${showTr ? `<p class="story-tr" lang="tr">${esc(line.tr)}</p>` : ''}
<div class="story-actions"><button data-story="skip" class="story-skip">Skip</button><span class="story-dots" aria-hidden="true">${lines.map((_, i) => `<i class="${i <= index ? 'on' : ''}"></i>`).join('')}</span><button data-story="tr" aria-pressed="${showTr}" aria-label="Turkish meaning">TR</button><button data-story="listen" aria-label="Listen again">🔊</button><button data-story="next" class="story-next">${last ? (id.startsWith('guardian') ? 'Fight!' : id === 'finale' ? 'The end ✦' : "Let's go!") : 'Next ▶'}</button></div></div>`;
}
// Plays a scene and resolves when it ends (Next on the last line, or Skip). onLine(text) reads each line aloud.
export function playScene(id, { doc = globalThis.document, win = globalThis.window, grade = 5, onLine = () => {}, onStop = () => {} } = {}) {
  return new Promise(resolve => {
    const lines = sceneLines(id, grade);
    if (!lines.length || !doc?.body?.appendChild) return resolve(false);
    const root = doc.createElement('div');
    root.className = `story-scene area-${STORY_SCENES[id].area}`;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', `Story: ${STORY_SCENES[id].title}`);
    doc.body.appendChild(root);
    let index = 0,
      showTr = false;
    const controller = new AbortController();
    const render = (speak = true) => {
      root.innerHTML = sceneMarkup(id, { grade, index, showTr });
      root.querySelector?.('.story-next')?.focus?.();
      if (speak) onLine(lines[index].en);
    };
    const end = done => {
      controller.abort();
      onStop();
      root.classList?.add('leaving');
      setTimeout(() => root.remove(), 280);
      resolve(done);
    };
    const next = () => (index < lines.length - 1 ? (index++, render()) : end(true));
    root.addEventListener(
      'click',
      e => {
        const b = e.target.closest?.('[data-story]');
        const what = b?.dataset.story;
        if (what === 'skip') end(false);
        else if (what === 'tr') {
          showTr = !showTr;
          render(false);
        } else if (what === 'listen') onLine(lines[index].en);
        else if (what === 'next' || e.target.closest?.('.story-line')) next();
      },
      { signal: controller.signal },
    );
    win?.addEventListener?.(
      'keydown',
      e => {
        if (['Enter', ' ', 'ArrowRight'].includes(e.key)) {
          e.preventDefault();
          e.stopImmediatePropagation();
          next();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          e.stopImmediatePropagation();
          end(false);
        }
      },
      { capture: true, signal: controller.signal },
    );
    render();
    return undefined;
  });
}
export { STORY_GUARDIANS };
