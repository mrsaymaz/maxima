// British and American spellings of the same word (0.68.0). The curriculum is written in British English; both
// spellings are correct English, so wherever the game checks spelling it accepts either one.
//   - Word runs: a letter that spells either variant counts (organise / organize), as long as it is consistent
//     with the letters already collected (centre / center).
//   - Misspelled-word task: a generated misspelling is never a valid variant (colour → color is not a mistake).
// The list is curated (word families, not blind suffix rules), because rules would accept real misspellings or
// different words (prize / prise, tire / tyre as verbs).
const ISE = ['apologis', 'organis', 'realis', 'recognis', 'emphasis', 'socialis', 'memoris', 'summaris', 'criticis', 'prioritis', 'visualis', 'sympathis', 'customis', 'specialis', 'minimis', 'maximis', 'categoris', 'personalis', 'modernis', 'standardis', 'energis', 'finalis', 'familiaris', 'hospitalis', 'harmonis', 'symbolis', 'authoris', 'colonis', 'civilis', 'computeris', 'digitis', 'fertilis', 'globalis', 'immunis', 'industrialis', 'legalis', 'mobilis', 'neutralis', 'optimis', 'organis', 'stabilis', 'sterilis', 'utilis', 'vandalis', 'vaporis', 'agonis', 'baptis', 'characteris', 'dramatis', 'economis', 'hypnotis', 'idealis', 'itemis', 'jeopardis', 'magnetis', 'mechanis', 'patronis', 'publicis', 'scrutinis', 'theoris', 'tranquillis'];
const ISE_ENDINGS = ['e', 'ed', 'es', 'ing', 'er', 'ers', 'ation', 'ations', 'able'].map(e => [e, e]);
const OUR = ['colour', 'favour', 'flavour', 'harbour', 'neighbour', 'behaviour', 'honour', 'humour', 'labour', 'rumour', 'odour', 'vapour', 'armour', 'parlour', 'savour', 'splendour', 'vigour', 'endeavour', 'glamour', 'tumour', 'valour', 'clamour', 'candour', 'ardour', 'rigour'];
const OUR_ENDINGS = ['', 's', 'ed', 'ing', 'ful', 'fully', 'less', 'ite', 'ites', 'hood', 'hoods', 'able', 'ably', 'er', 'ers', 'ly', 'y'];
const RE = ['centre', 'theatre', 'metre', 'litre', 'fibre', 'calibre', 'lustre', 'meagre', 'sabre', 'sombre', 'spectre', 'centimetre', 'millimetre', 'kilometre', 'decilitre', 'millilitre', 'manoeuvre'];
const LL = ['travel', 'cancel', 'label', 'model', 'dial', 'pedal', 'level', 'signal', 'fuel', 'quarrel', 'marvel', 'channel', 'tunnel', 'total', 'shovel', 'snorkel', 'yodel', 'counsel', 'equal', 'jewel', 'rival', 'panel', 'parcel', 'pencil', 'spiral', 'grovel', 'travel'];
const LL_ENDINGS = ['led', 'ling', 'ler', 'lers'];
const PAIRS = [
  ['dialogue', 'dialog'], ['dialogues', 'dialogs'], ['catalogue', 'catalog'], ['catalogues', 'catalogs'], ['analogue', 'analog'], ['prologue', 'prolog'], ['epilogue', 'epilog'],
  ['licence', 'license'], ['defence', 'defense'], ['offence', 'offense'], ['pretence', 'pretense'],
  ['analyse', 'analyze'], ['analysed', 'analyzed'], ['analyses', 'analyzes'], ['analysing', 'analyzing'], ['paralyse', 'paralyze'], ['paralysed', 'paralyzed'],
  ['practise', 'practice'], ['practised', 'practiced'], ['practises', 'practices'], ['practising', 'practicing'],
  ['programme', 'program'], ['programmes', 'programs'], ['pyjamas', 'pajamas'], ['pyjama', 'pajama'], ['jewellery', 'jewelry'], ['jeweller', 'jeweler'], ['jewellers', 'jewelers'],
  ['grey', 'gray'], ['greys', 'grays'], ['greyish', 'grayish'], ['mum', 'mom'], ['mums', 'moms'], ['mummy', 'mommy'],
  ['aluminium', 'aluminum'], ['cosy', 'cozy'], ['mould', 'mold'], ['mouldy', 'moldy'], ['plough', 'plow'], ['sceptical', 'skeptical'], ['ageing', 'aging'],
  ['fulfil', 'fulfill'], ['fulfilment', 'fulfillment'], ['enrol', 'enroll'], ['enrolment', 'enrollment'], ['skilful', 'skillful'], ['wilful', 'willful'], ['instalment', 'installment'],
  ['tyre', 'tire'], ['tyres', 'tires'], ['kerb', 'curb'], ['doughnut', 'donut'], ['doughnuts', 'donuts'], ['moustache', 'mustache'], ['axe', 'ax'], ['storey', 'story'],
  ['travellers', 'travelers'], ['woollen', 'woolen'], ['judgement', 'judgment'], ['acknowledgement', 'acknowledgment'], ['ageing', 'aging'],
  ['encyclopaedia', 'encyclopedia'], ['paediatric', 'pediatric'], ['oestrogen', 'estrogen'], ['manoeuvres', 'maneuvers'], ['manoeuvre', 'maneuver'],
];
const groups = new Map();
function link(...words) {
  const set = new Set(words.map(w => w.toLowerCase()));
  for (const w of [...set]) for (const other of groups.get(w) || []) set.add(other);
  for (const w of set) groups.set(w, set);
}
for (const stem of ISE) for (const [a, b] of ISE_ENDINGS) link(stem + a, stem.slice(0, -1) + 'z' + b);
for (const word of OUR) for (const end of OUR_ENDINGS) link(word + end, word.replace(/our$/, 'or') + end);
for (const word of RE) {
  const us = word === 'manoeuvre' ? 'maneuver' : word.replace(/re$/, 'er');
  link(word, us);
  link(word + 's', us + 's');
}
for (const stem of LL) for (const end of LL_ENDINGS) link(stem + 'l' + end.slice(1), stem + end.slice(1));
for (const pair of PAIRS) link(...pair);

const key = word => String(word ?? '').toLowerCase();
// Every accepted spelling of a word (itself first), lower case.
export function spellingVariants(word) {
  const w = key(word),
    set = groups.get(w);
  return set ? [w, ...[...set].filter(x => x !== w)] : [w];
}
// The other spelling(s) only.
export const otherSpellings = word => spellingVariants(word).slice(1);
// True when two words are the same word in British or American spelling (case-insensitive).
export const sameWord = (a, b) => key(a) === key(b) || spellingVariants(a).includes(key(b));
// Compares two phrases word by word, treating British and American spellings as equal.
export function sameSpelling(a, b) {
  const words = s =>
    String(s ?? '')
      .toLowerCase()
      .match(/[a-z']+/g) || [];
  const x = words(a),
    y = words(b);
  return x.length === y.length && x.every((w, i) => sameWord(w, y[i]));
}
// Variants with the same number of letters can share one row of letters in a word run.
export const sameLengthSpellings = word => spellingVariants(word).filter(v => v.length === key(word).length);
// Whether `letter` at `slot` keeps at least one accepted spelling possible, given the letters collected so far
// (null for slots not collected yet).
export function letterFits(word, slot, letter, collected = []) {
  const l = key(letter);
  return sameLengthSpellings(word).some(
    v => v[slot] === l && collected.every((c, i) => c == null || i === slot || v[i] === key(c)),
  );
}
