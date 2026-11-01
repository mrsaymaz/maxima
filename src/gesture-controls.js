// Touch gestures for play. The joystick sits on one side of the screen (right by default, left for left-handed
// players); the rest of the screen is the action area:
//   swipe up   jump                     (everywhere)
//   tap        cast                     (everywhere; tap a rival to cast at that one)
//   swipe ← →  change lane, ↓ slide     (on runs)
// The Jump and Cast buttons are hidden unless a player turns them back on. Settings live on this device.
export const SWIPE = 26,
  TAP_MOVE = 14,
  TAP_TIME = 400;
const KEY = 'maxima.controls.v1',
  DEFAULTS = { buttons: false, left: false, tutorial: false, hints: {} };
export function loadControls(store = globalThis.localStorage) {
  try {
    const saved = JSON.parse(store?.getItem(KEY) || '{}');
    return { ...DEFAULTS, ...saved, hints: { ...(saved.hints || {}) } };
  } catch {
    return { ...DEFAULTS, hints: {} };
  }
}
export function saveControls(c, store = globalThis.localStorage) {
  try {
    store?.setItem(KEY, JSON.stringify(c));
  } catch {}
}
export function applyControls(c, doc = globalThis.document) {
  if (!doc?.body) return;
  doc.body.classList.toggle('show-buttons', !!c.buttons);
  doc.body.classList.toggle('left-hand', !!c.left);
}
// A swipe once the finger has moved far enough; a tap when it lifts quickly without moving.
export function classifyGesture(dx, dy, ms, lifted = false) {
  const d = Math.hypot(dx, dy);
  if (d >= SWIPE) return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
  return lifted && d < TAP_MOVE && ms <= TAP_TIME ? 'tap' : null;
}
const EXCLUDED =
  '.danger-lesson,.story-scene,#shrine-layer,button,a,input,select,textarea,label,.modal,.modal-backdrop,#joystick,.task-panel,.guardian-finisher,.play-status,.topbar,.controls-tutorial';
// Where gestures act: a run, the free trail (clearings and gate fights), or the guardian arena; null elsewhere.
export function gestureContext(world, doc = globalThis.document) {
  const body = doc?.body?.classList;
  if (
    !body?.contains('playing') ||
    body.contains('in-task') ||
    body.contains('in-guardian-finisher') ||
    body.contains('cinematic') ||
    body.contains('in-shrine') ||
    doc.querySelector('.modal-backdrop')
  )
    return null;
  if (world.home || world.focus || world.paused || world.runtimePaused) return null;
  if (world.guardianStage?.active) return 'arena';
  if (world.nav?.runner?.running) return 'run';
  if (world.battle) return null;
  return 'free';
}
// The rival nearest to a tap on screen, if the tap lands on (or close to) one.
export function rivalAt(world, x, y, reach = 56) {
  let best = null,
    bestD = reach;
  for (const r of world.nav?.combat?.group || []) {
    if (r.phase === 'defeated') continue;
    const p = world.screenPoint?.({ x: r.x, y: 0.6, z: r.z });
    if (!p) continue;
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < bestD) {
      bestD = d;
      best = r;
    }
  }
  return best;
}
export function performGesture(world, kind, context, at = null) {
  const runner = world.nav?.runner;
  let done = false;
  if (kind === 'up') {
    if (context === 'run' && runner) runner.sliding = 0;
    done = !!world.jump?.();
  } else if (kind === 'tap') {
    const r = context === 'free' && at ? rivalAt(world, at.x, at.y) : null;
    done = !!world.attack?.(r);
  } else if (kind === 'hold' || kind === 'release') {
    done = !!world.nav?.holdBoost?.(kind === 'hold');
  } else if (context === 'run' && runner) {
    if (kind === 'left') done = runner.shift(-1);
    if (kind === 'right') done = runner.shift(1);
    if (kind === 'down') done = runner.slide(world.nav);
  }
  return done;
}
// Hold to boost (0.71): on a run, a finger held still for HOLD_MS anywhere in the action area boosts until it lifts.
// While held, sliding it SWIPE pixels steers (left/right changes lane, up jumps, down slides) and re-anchors, so one
// thumb can boost and steer; a second finger can swipe at the same time. Near a crystal wall, a touch casts as the
// finger goes down, so "tap your creature" always breaks the wall even if the tap turns into a hold.
export const HOLD_MS = 260;
export function installGestures(
  world,
  { win = globalThis.window, doc = globalThis.document, onGesture = () => {} } = {},
) {
  if (!win?.addEventListener) return () => {};
  const controller = new AbortController(),
    options = { capture: true, signal: controller.signal },
    fingers = new Map();
  const fire = (finger, kind, at) => {
    const context = finger?.context;
    if (!context) return false;
    const done = performGesture(world, kind, context, at);
    onGesture(kind, context, done);
    win.dispatchEvent?.(new (win.CustomEvent || CustomEvent)('maxima-gesture', { detail: { kind, context, done } }));
    return done;
  };
  const release = finger => {
    clearTimeout(finger.timer);
    if (finger.holding) {
      finger.holding = false;
      if (![...fingers.values()].some(f => f !== finger && f.holding)) fire(finger, 'release');
    }
  };
  win.addEventListener(
    'pointerdown',
    e => {
      if (fingers.has(e.pointerId) || e.button > 0 || e.target?.closest?.(EXCLUDED)) return;
      const context = gestureContext(world, doc);
      if (!context) return;
      // The action area owns this finger: no tap-to-walk on the world underneath.
      e.stopPropagation();
      const finger = { x: e.clientX, y: e.clientY, ax: e.clientX, ay: e.clientY, t: e.timeStamp, id: e.pointerId, done: false, context, holding: false, cast: false };
      fingers.set(e.pointerId, finger);
      if (context !== 'run') return;
      if (world.nav?.runner?.crystalInRange?.()) finger.cast = fire(finger, 'tap', { x: e.clientX, y: e.clientY });
      finger.timer = setTimeout(() => {
        if (fingers.get(finger.id) !== finger || finger.done || gestureContext(world, doc) !== 'run') return;
        finger.holding = true;
        finger.ax = finger.lx ?? finger.x;
        finger.ay = finger.ly ?? finger.y;
        fire(finger, 'hold');
      }, HOLD_MS);
    },
    options,
  );
  win.addEventListener(
    'pointermove',
    e => {
      const finger = fingers.get(e.pointerId);
      if (!finger) return;
      finger.lx = e.clientX;
      finger.ly = e.clientY;
      if (finger.holding) {
        // Steering while holding: each slide past SWIPE fires once and re-anchors at the finger.
        const kind = classifyGesture(e.clientX - finger.ax, e.clientY - finger.ay, 0);
        if (kind && kind !== 'tap') {
          finger.ax = e.clientX;
          finger.ay = e.clientY;
          fire(finger, kind);
        }
        return;
      }
      if (finger.done) return;
      const kind = classifyGesture(e.clientX - finger.x, e.clientY - finger.y, e.timeStamp - finger.t);
      if (kind) {
        finger.done = true;
        clearTimeout(finger.timer);
        fire(finger, kind);
      }
    },
    options,
  );
  win.addEventListener(
    'pointerup',
    e => {
      const finger = fingers.get(e.pointerId);
      if (!finger) return;
      fingers.delete(e.pointerId);
      const held = finger.holding;
      release(finger);
      if (!finger.done && !held && !finger.cast) {
        const kind = classifyGesture(e.clientX - finger.x, e.clientY - finger.y, e.timeStamp - finger.t, true);
        if (kind) fire(finger, kind, { x: e.clientX, y: e.clientY });
      }
    },
    options,
  );
  win.addEventListener(
    'pointercancel',
    e => {
      const finger = fingers.get(e.pointerId);
      if (!finger) return;
      fingers.delete(e.pointerId);
      release(finger);
    },
    options,
  );
  return () => {
    for (const f of fingers.values()) release(f);
    fingers.clear();
    controller.abort();
  };
}
