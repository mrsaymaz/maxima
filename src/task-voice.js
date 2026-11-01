// Reading English aloud during gate tasks (0.64.0).
// After every correct step, the English sentence, question and answer, or word that was just formed or matched is
// read aloud, so students hear the flow of each sentence. Tapping an English piece in a matching task reads it too.
// Sentence-order tasks keep the Turkish meaning hidden until the sentence is complete; misspelled-word tasks then show
// the correct spelling. Both appear on a short reveal card (see revealMarkup).
const clean = s =>
  String(s ?? '')
    .replace(/\s+/g, ' ')
    .replace(/…/g, ' ')
    .replace(/\s+([.?!,])/g, '$1')
    .trim();
const sentence = s => {
  s = clean(s);
  return s && !/[.?!]$/.test(s) ? s + '.' : s;
};
const joinHalves = (a, b) => clean(String(a).replace(/…\s*$/, '') + ' ' + String(b).replace(/^\s*…/, ''));

// Which English side of a matching piece a tap should read (null when that side is Turkish or a picture).
export function pieceLine(t, side, index) {
  if (!t || t.kind !== 'pairs') return null;
  const p = t.pairs?.[index];
  if (!p) return null;
  if (side === 'left')
    return t.type === 'numbers' ? (/^\d+$/.test(String(p.left)) ? String(p.left) : clean(p.left)) : clean(p.left);
  if (['definition', 'qa-pairs', 'halves', 'numbers'].includes(t.type)) return clean(p.right);
  return null;
}

// What to say and show after an accepted action. `before` is the task as it was before the action.
// Returns {say, reveal} where say is English text (or '') and reveal is a card description (or null).
export function acceptedLines(before, after, action, result) {
  const none = { say: '', reveal: null };
  if (!before || !result?.accepted) return none;
  if (before.kind === 'pairs') {
    const p = before.pairs?.[action.index];
    if (!p) return none;
    switch (before.type) {
      case 'halves': {
        const full = sentence(joinHalves(p.left, p.right));
        return { say: full, reveal: { kind: 'sentence', label: 'Sentence complete', en: full, tr: p.context || '' } };
      }
      case 'qa-pairs':
        return { say: `${clean(p.left)} ${sentence(p.right)}`, reveal: null };
      case 'definition':
        return { say: `${clean(p.left)}. ${sentence(p.right)}`, reveal: null };
      case 'numbers':
        return { say: clean(p.right), reveal: null };
      default:
        return { say: clean(p.left), reveal: null }; // translation, picture, listen-tr: the English word
    }
  }
  const q = before.rounds?.[before.round];
  if (!q) return none;
  const finished = after.round !== before.round || after.complete;
  if (q.kind === 'blocks') {
    if (!finished) return none;
    const en = sentence(q.answer);
    return {
      say: en,
      reveal: {
        kind: 'sentence',
        label: q.answer.trim().endsWith('?') ? 'Question complete' : 'Sentence complete',
        en,
        tr: q.meaning || '',
      },
    };
  }
  if (q.kind === 'repair') {
    if (!finished) return none;
    const en = sentence(q.correct);
    return { say: en, reveal: { kind: 'sentence', label: 'Sentence repaired', en, tr: '' } };
  }
  switch (before.type) {
    case 'spelling':
      return {
        say: q.correction,
        reveal: { kind: 'spelling', label: 'Correct spelling', en: q.correction, wrong: q.answer },
      };
    case 'answer':
      return { say: `${clean(q.prompt)} ${sentence(q.answer)}`, reveal: null };
    case 'ending':
      return { say: sentence(joinHalves(q.prompt, q.answer)), reveal: null };
    case 'correct':
      return { say: sentence(q.answer), reveal: null };
    case 'gap':
      return { say: sentence(String(q.prompt).replace(/_{2,}/, q.answer)), reveal: null };
    case 'clue':
      return { say: `${sentence(q.prompt)} ${clean(q.answer)}`, reveal: null };
    case 'listen-word':
    case 'intruder':
      return { say: clean(q.answer), reveal: null };
    case 'sort':
      return { say: clean(q.prompt), reveal: null };
    default:
      return none;
  }
}

const escape = s =>
  String(s ?? '').replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
export function revealMarkup(r) {
  if (!r) return '';
  if (r.kind === 'spelling')
    return `<small>${escape(r.label)}</small><div class="reveal-spelling"><s lang="en" aria-label="Misspelled: ${escape(r.wrong)}">${escape(r.wrong)}</s><span aria-hidden="true">→</span><strong lang="en">${escape(r.en)}</strong></div><div class="reveal-letters" aria-hidden="true">${[...String(r.en)].map((c, i) => (c === ' ' ? '<i class="gap"></i>' : `<i style="--i:${i * 70}">${escape(c)}</i>`)).join('')}</div><button class="reveal-listen" data-reveal-listen aria-label="Listen again">🔊</button>`;
  return `<small>${escape(r.label)}</small><strong lang="en">${escape(r.en)}</strong>${r.tr ? `<em lang="tr"><b>TR</b> ${escape(r.tr)}</em>` : ''}<button class="reveal-listen" data-reveal-listen aria-label="Listen again">🔊</button>`;
}
// How long a reveal card stays: long enough to read the sentence, at least 2.6 s.
export const revealTime = r =>
  r ? Math.min(6500, Math.max(2600, 1400 + String(r.en || '').length * 55 + String(r.tr || '').length * 35)) : 0;
