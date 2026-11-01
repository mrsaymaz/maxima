import { classifyGesture } from './gesture-controls.js';
import { sketchScene, sketchAct } from './creature-sketch.js';
import { guideFigure } from './guide.js';
// The controls tutorial: a short practice before play. Each step shows a simplified creature (creature-sketch.js) on a
// small track with a moving hand, and waits until the student does the gesture on the practice pad (or presses the
// matching key); the creature then does the move. The joystick step shows the joystick moving the creature.
export const TUTORIAL_STEPS = [
  {
    id: 'lane',
    title: 'Change lane',
    text: 'On a run, swipe left or right.',
    want: ['left', 'right'],
    hand: 'side',
    keys: '← →',
    demo: 'lanes',
  },
  {
    id: 'jump',
    title: 'Jump',
    text: 'Swipe up anywhere to jump over waves and hurdles.',
    want: ['up'],
    hand: 'up',
    keys: '↑ or Space',
    demo: 'wave',
  },
  {
    id: 'slide',
    title: 'Slide',
    text: 'On a run, swipe down to slide under bars.',
    want: ['down'],
    hand: 'down',
    keys: '↓',
    demo: 'bar',
  },
  {
    id: 'boost',
    title: 'Hold to boost',
    text: 'On a run, hold your finger anywhere to run faster. Slide it to steer while you hold. Coins fill your boost.',
    want: ['hold'],
    hand: 'hold',
    keys: 'hold Shift',
    demo: 'boost',
  },
  {
    id: 'cast',
    title: 'Break crystal walls',
    text: 'A crystal wall blocks the track. Tap your creature to cast and break it! Near gates, tap a rival to aim at it.',
    want: ['tap'],
    hand: 'tap',
    keys: 'J or F',
    demo: 'crystal',
  },
  {
    id: 'move',
    title: 'Move with the joystick',
    text: 'When rivals wait at a gate and in the guardian arena, drag the joystick to walk around and dodge their attacks.',
    want: null,
    stick: true,
    keys: 'WASD',
    demo: 'arena',
  },
];
const HANDS = { side: '👉', up: '☝️', down: '👇', tap: '👆', hold: '👆' };
// A finger held still this long counts as a hold (as in the game, gesture-controls.js).
const HOLD_PRACTICE_MS = 300;
const KEYS = {
  ArrowLeft: 'left',
  a: 'left',
  ArrowRight: 'right',
  d: 'right',
  ArrowUp: 'up',
  w: 'up',
  ' ': 'up',
  ArrowDown: 'down',
  s: 'down',
  j: 'tap',
  f: 'tap',
  Enter: 'tap',
};
export function tutorialMarkup(index, { left = false, touch = true, done = false, color } = {}) {
  const step = TUTORIAL_STEPS[index],
    last = index === TUTORIAL_STEPS.length - 1,
    stickText = step.stick
      ? step.text.replace('the joystick', `the joystick on the ${left ? 'left' : 'right'}`)
      : step.text;
  return `<div class="tutorial-step">Controls · ${index + 1} of ${TUTORIAL_STEPS.length}</div><div class="guide-host">${guideFigure(last ? 'cheer' : index === 0 ? 'full' : 'point', { cls: 'host-figure' })}<div class="guide-bubble"><h2>${step.title}</h2><p>${stickText}${touch ? '' : ` <small>(keyboard: ${step.keys})</small>`}</p></div></div>
 <div class="tutorial-pad${done ? ' done' : ''}" data-tutorial-pad>${sketchScene({ demo: step.demo, color, stick: left ? 'left' : 'right', caption: step.title })}${step.stick ? '' : `<span class="tutorial-hand ${step.hand}" aria-hidden="true">${done ? '✅' : HANDS[step.hand]}</span>`}</div>
 <div class="tutorial-dots" aria-hidden="true">${TUTORIAL_STEPS.map((_, i) => `<i class="${i <= index ? 'on' : ''}"></i>`).join('')}</div>
 <div class="tutorial-actions">${last ? `<button class="primary-action" data-tutorial="next">Let's go!</button>` : `<button data-tutorial="skip">Skip</button>${step.want ? '' : `<button class="primary-action" data-tutorial="next">Next</button>`}`}</div>`;
}
export function runControlsTutorial({
  doc = globalThis.document,
  win = globalThis.window,
  left = false,
  touch = true,
  color,
  onDone = () => {},
  onPractice = () => {},
} = {}) {
  const root = doc.createElement('div');
  root.className = 'controls-tutorial';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Controls tutorial');
  doc.body.appendChild(root);
  const controller = new AbortController(),
    options = { signal: controller.signal };
  let index = 0,
    done = false,
    start = null,
    timer = null;
  const render = () => {
    root.innerHTML = tutorialMarkup(index, { left, touch, done, color });
    root.querySelector('[data-tutorial="next"],[data-tutorial="skip"]')?.focus?.();
  };
  const finish = skipped => {
    controller.abort();
    clearTimeout(timer);
    root.remove();
    onDone({ skipped, step: TUTORIAL_STEPS[index].id });
  };
  const advance = () => {
    done = false;
    if (index < TUTORIAL_STEPS.length - 1) {
      index++;
      render();
    } else finish(false);
  };
  const practise = kind => {
    const step = TUTORIAL_STEPS[index];
    if (done || !step.want?.includes(kind)) return;
    done = true;
    onPractice(step.id);
    const pad = root.querySelector?.('[data-tutorial-pad]');
    if (pad) {
      pad.classList?.add('done');
      const hand = pad.querySelector?.('.tutorial-hand');
      if (hand) hand.textContent = '✅';
      const host = root.querySelector?.('.host-figure');
      if (host) host.src = 'assets/guide/saymaz-smile.webp';
      sketchAct(pad, kind);
    } else render();
    timer = setTimeout(advance, 650);
  };
  root.addEventListener(
    'click',
    e => {
      const b = e.target.closest?.('[data-tutorial]');
      if (!b) return;
      if (b.dataset.tutorial === 'skip') finish(true);
      else advance();
    },
    options,
  );
  root.addEventListener(
    'pointerdown',
    e => {
      if (e.target.closest?.('button')) return;
      clearTimeout(start?.hold);
      const s = { x: e.clientX, y: e.clientY, t: e.timeStamp, id: e.pointerId, fired: false };
      s.hold = setTimeout(() => {
        if (start === s && !s.fired) {
          s.fired = true;
          practise('hold');
        }
      }, HOLD_PRACTICE_MS);
      start = s;
    },
    options,
  );
  root.addEventListener(
    'pointermove',
    e => {
      if (!start || start.fired || e.pointerId !== start.id) return;
      const kind = classifyGesture(e.clientX - start.x, e.clientY - start.y, e.timeStamp - start.t);
      if (kind) {
        start.fired = true;
        clearTimeout(start.hold);
        practise(kind);
      }
    },
    options,
  );
  root.addEventListener(
    'pointerup',
    e => {
      if (!start || e.pointerId !== start.id) return;
      clearTimeout(start.hold);
      if (!start.fired) {
        const kind = classifyGesture(e.clientX - start.x, e.clientY - start.y, e.timeStamp - start.t, true);
        if (kind) practise(kind);
      }
      start = null;
    },
    options,
  );
  win?.addEventListener?.(
    'keydown',
    e => {
      const key = e.key?.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === 'Escape') {
        finish(true);
        return;
      }
      const kind = e.key === 'Shift' ? 'hold' : KEYS[key];
      if (kind && !done && TUTORIAL_STEPS[index].want?.includes(kind)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        practise(kind);
      }
    },
    { capture: true, signal: controller.signal },
  );
  render();
  return {
    root,
    finish,
    practise,
    get index() {
      return index;
    },
  };
}
