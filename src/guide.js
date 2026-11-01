// Mr. Saymaz, the game's guide (0.65.0). Six illustrated poses (assets/guide, transparent WebP, about 40 KB each):
//   bust · head and shoulders (avatar)      full  · presenting, open hand (welcome, How to play)
//   point · pointing up (teaching a move)   smile · thumbs up (well done)
//   cheer · both fists up (big wins)        think · hand on chin (mistakes, out of lives)
// He hosts the opening screen, the controls tutorial and the danger lessons, and pops in for key moments in play.
export const GUIDE_POSES = ['bust', 'cheer', 'full', 'point', 'smile', 'think'];
const SIZE = {
  bust: [320, 305],
  cheer: [305, 520],
  full: [321, 520],
  point: [300, 520],
  smile: [272, 520],
  think: [269, 520],
};
const pose = p => (GUIDE_POSES.includes(p) ? p : 'smile');
export const guideSrc = p => `assets/guide/saymaz-${pose(p)}.webp`;
const esc = s =>
  String(s ?? '').replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
export function guideFigure(p, { cls = '' } = {}) {
  const k = pose(p),
    [w, h] = SIZE[k];
  return `<img class="guide-figure guide-${k}${cls ? ' ' + esc(cls) : ''}" src="${guideSrc(k)}" alt="" width="${w}" height="${h}" decoding="async" draggable="false">`;
}
// What Mr. Saymaz says on the opening screen, from the journey's state (setupContext in corridor-app.js).
export function homeGuideLine(c = {}) {
  const name = c.nickname || 'explorer';
  if (c.firstLaunch)
    return { pose: 'full', text: `Welcome, explorer! I'm Mr. Saymaz. Choose your team, then press PLAY!` };
  if (c.completed) return { pose: 'cheer', text: `You finished this lesson, ${name}! Choose a new journey.` };
  if (c.nextArea != null)
    return { pose: 'cheer', text: `Well done! ${c.nextAreaTitle || 'The next arena'} is open now.` };
  if (c.guardian) return { pose: 'point', text: `${c.guardian} is waiting. Read every warning!` };
  if (c.resume) return { pose: 'smile', text: `Welcome back, ${name}! Let's keep going.` };
  return { pose: 'full', text: `Hello, ${name}! Let's explore ${c.areaName || 'the trails'}.` };
}
export function homeGuideMarkup(c) {
  const l = homeGuideLine(c);
  return `<aside class="launch-guide" aria-label="Mr. Saymaz says: ${esc(l.text)}">${guideFigure(l.pose)}<p class="guide-bubble">${esc(l.text)}</p></aside>`;
}
// A short pop-in during play: Mr. Saymaz slides in at the side with a speech bubble, then leaves.
let cameo = null,
  cameoTimer = 0,
  lastCameo = 0;
export function guideCameo(
  text,
  { pose: p = 'smile', ms = 2800, doc = globalThis.document, now = Date.now(), gap = 1500 } = {},
) {
  if (!doc?.body?.appendChild || !text) return false;
  if (now - lastCameo < gap) return false;
  lastCameo = now;
  if (!cameo?.isConnected) {
    cameo = doc.createElement('div');
    cameo.id = 'guide-cameo';
    cameo.setAttribute('role', 'status');
    cameo.setAttribute('aria-live', 'polite');
    doc.body.appendChild(cameo);
  }
  cameo.innerHTML = `${guideFigure(p)}<p class="guide-bubble">${esc(text)}</p>`;
  cameo.className = '';
  void cameo.offsetWidth;
  cameo.className = 'show';
  clearTimeout(cameoTimer);
  cameoTimer = setTimeout(() => {
    if (cameo) cameo.className = '';
  }, ms);
  return true;
}
export function hideGuideCameo() {
  clearTimeout(cameoTimer);
  if (cameo) cameo.className = '';
}
