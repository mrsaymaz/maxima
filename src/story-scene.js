import { guideFigure } from './guide.js';
import { STORY_SCENES, STORY_GUARDIANS, sceneLines } from './story.js';
import { backdrop, guardianArt, crystalArt, particles } from './story-art.js';
// Story cut-scenes (0.70.0): a cinematic panel over the paused game.
// The stage (layered vector landscape, guardian, Sol Crystal, particles) is built once per scene and drifts slowly
// (parallax and a gentle push-in). Per line, only Mr. Saymaz's pose and the dialogue change; the line types out
// while it is read aloud (onLine). TR shows the Turkish meaning, Next moves on (or finishes the typing), Skip ends.
const esc = s =>
  String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const AREA_NAMES = ['Whisperwood', 'Skyreach', 'Stormglass'];
const sceneBackdrop = id => (id === 'finale' ? 'finale' : STORY_SCENES[id].area);
// The piece of the crystal that comes back in this scene (wins), so it can fly in.
const freshShard = id => (id.startsWith('win-') ? STORY_SCENES[id].shards - 1 : -1);
export function stageMarkup(id) {
  const scene = STORY_SCENES[id];
  if (!scene) return '';
  const which = sceneBackdrop(id),
    art = backdrop(which);
  return `<div class="story-stage">${art.sky}${art.far}${art.mid}${scene.guardian != null ? guardianArt(scene.guardian) : ''}${art.near}${art.fx}${particles(which)}</div><div class="story-grain" aria-hidden="true"></div><div class="story-bars" aria-hidden="true"><i></i><i></i></div>${crystalArt(scene.shards, { whole: !!scene.whole, fresh: freshShard(id) })}<header class="story-title"><small>${esc(id === 'finale' ? 'The valley' : AREA_NAMES[scene.area])}</small><span>${esc(scene.title)}</span>${scene.guardian != null ? `<em>Keeper of the ${['first', 'second', 'last'][scene.guardian]} shard</em>` : ''}</header><div class="story-cast"></div><div class="story-box" role="group" aria-label="Mr. Saymaz says"></div>`;
}
export function lineMarkup(id, { grade = 5, index = 0, showTr = false, typed = null } = {}) {
  const lines = sceneLines(id, grade),
    line = lines[index];
  if (!line) return { cast: '', box: '' };
  const last = index === lines.length - 1,
    text = typed == null ? line.en : line.en.slice(0, typed);
  return {
    cast: guideFigure(line.pose, { cls: 'story-figure' }),
    box: `<b class="story-name">Mr. Saymaz</b><p class="story-line" lang="en" aria-label="${esc(line.en)}"><span aria-hidden="true">${esc(text)}</span><span class="story-ghost" aria-hidden="true">${esc(line.en.slice(text.length))}</span></p>${showTr ? `<p class="story-tr" lang="tr">${esc(line.tr)}</p>` : ''}<div class="story-actions"><button data-story="skip" class="story-skip">Skip</button><span class="story-dots" aria-hidden="true">${lines.map((_, i) => `<i class="${i <= index ? 'on' : ''}"></i>`).join('')}</span><button data-story="tr" aria-pressed="${showTr}" aria-label="Turkish meaning">TR</button><button data-story="listen" aria-label="Listen again">🔊</button><button data-story="next" class="story-next">${last ? (id.startsWith('guardian') ? 'Fight!' : id === 'finale' ? 'The end ✦' : "Let's go!") : 'Next ▶'}</button></div>`,
  };
}
// The whole scene as one string (first paint and tests).
export function sceneMarkup(id, options = {}) {
  if (!STORY_SCENES[id]) return '';
  const { cast, box } = lineMarkup(id, options);
  return stageMarkup(id)
    .replace('<div class="story-cast"></div>', `<div class="story-cast">${cast}</div>`)
    .replace('<div class="story-box" role="group" aria-label="Mr. Saymaz says"></div>', `<div class="story-box" role="group" aria-label="Mr. Saymaz says">${box}</div>`);
}
// Plays a scene and resolves when it ends (Next on the last line, or Skip). onLine(text) reads each line aloud.
export function playScene(id, { doc = globalThis.document, win = globalThis.window, grade = 5, onLine = () => {}, onStop = () => {}, typeSpeed } = {}) {
  return new Promise(resolve => {
    const lines = sceneLines(id, grade);
    if (!lines.length || !doc?.body?.appendChild) return resolve(false);
    const root = doc.createElement('div'),
      scene = STORY_SCENES[id];
    root.className = `story-scene backdrop-${sceneBackdrop(id)}${scene.guardian != null ? ' with-guardian' : ''}`;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', `Story: ${scene.title}`);
    root.innerHTML = stageMarkup(id);
    doc.body.appendChild(root);
    const reduce = !!win?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches,
      speed = typeSpeed ?? (grade >= 7 ? 26 : 34);
    let index = 0,
      showTr = false,
      typed = 0,
      timer = null,
      lastPose = null;
    const controller = new AbortController();
    const cast = () => root.querySelector?.('.story-cast'),
      box = () => root.querySelector?.('.story-box');
    const paint = () => {
      const m = lineMarkup(id, { grade, index, showTr, typed: typed >= lines[index].en.length ? null : typed });
      const c = cast(),
        b = box();
      if (c && lines[index].pose !== lastPose) {
        c.innerHTML = m.cast;
        lastPose = lines[index].pose;
      }
      if (b) b.innerHTML = m.box;
      else root.innerHTML = sceneMarkup(id, { grade, index, showTr });
    };
    const typing = () => typed < lines[index].en.length;
    const finishTyping = () => {
      clearInterval(timer);
      timer = null;
      typed = lines[index].en.length;
      paint();
      root.querySelector?.('.story-next')?.focus?.();
    };
    const show = (speak = true) => {
      clearInterval(timer);
      typed = reduce || !speed ? lines[index].en.length : 0;
      paint();
      if (speak) onLine(lines[index].en);
      if (typing())
        timer = setInterval(() => {
          typed = Math.min(lines[index].en.length, typed + 1);
          const span = root.querySelector?.('.story-line span');
          const ghost = root.querySelector?.('.story-ghost');
          if (span && ghost) {
            span.textContent = lines[index].en.slice(0, typed);
            ghost.textContent = lines[index].en.slice(typed);
          }
          if (!typing()) finishTyping();
        }, speed);
      else root.querySelector?.('.story-next')?.focus?.();
    };
    const end = done => {
      clearInterval(timer);
      controller.abort();
      onStop();
      root.classList?.add('leaving');
      setTimeout(() => root.remove(), 380);
      resolve(done);
    };
    const next = () => {
      if (typing()) return finishTyping();
      if (index < lines.length - 1) {
        index++;
        show();
      } else end(true);
    };
    root.addEventListener(
      'click',
      e => {
        const what = e.target.closest?.('[data-story]')?.dataset.story;
        if (what === 'skip') end(false);
        else if (what === 'tr') {
          showTr = !showTr;
          paint();
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
    show();
    return undefined;
  });
}
export { STORY_GUARDIANS };
