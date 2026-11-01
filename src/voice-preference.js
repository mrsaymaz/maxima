// Browser voices expose names/locales, not a reliable gender field. Prefer known female English voices.
export function femaleEnglishVoice(voices = []) {
  const english = voices.filter(v => /^en(?:[-_]|$)/i.test(v.lang));
  const female =
      /samantha|flo|sandy|shelley|grandma|martha|serena|karen|moira|tessa|victoria|aria|jenny|sonia|libby|hazel|susan|zira|ava|emma|allison|joanna|salli|kendra|kimberly|female|google (?:us|uk) english(?! male)/i,
    knownMale = /\b(?:daniel|alex|david|george|mark|james|ryan|guy|aaron|fred|oliver|male)\b/i;
  const usgb = v => Number(/^en[-_](?:US|GB)/i.test(v.lang));
  return (
    english
      .filter(v => female.test(v.name) && !knownMale.test(v.name))
      .sort(
        (a, b) =>
          usgb(b) - usgb(a) ||
          Number(b.localService) - Number(a.localService) ||
          Number(/^en[-_]GB/i.test(b.lang)) - Number(/^en[-_]GB/i.test(a.lang)),
      )[0] || null
  );
}
// Any clear English voice when no female voice is installed: American or British first, then other English voices.
export function englishVoice(voices = []) {
  const female = femaleEnglishVoice(voices);
  if (female) return female;
  const english = voices.filter(
    v =>
      /^en(?:[-_]|$)/i.test(v.lang) &&
      !/whisper|bad news|bells|boing|bubbles|cellos|zarvox|trinoids|organ|hysterical|jester|wobble|albert|bahh/i.test(
        v.name,
      ),
  );
  return (
    english.sort(
      (a, b) =>
        Number(/^en[-_](?:US|GB)/i.test(b.lang)) - Number(/^en[-_](?:US|GB)/i.test(a.lang)) ||
        Number(b.localService) - Number(a.localService),
    )[0] || null
  );
}
export function supplyWords(text) {
  const m = /^please\s+(?:bring|select(?:\s+the word cards for)?)\s+(.+?)[.!]?$/i.exec(String(text).trim());
  return m
    ? m[1]
        .split(/,\s*|\s+and\s+/)
        .map(w => w.trim())
        .filter(Boolean)
    : null;
}
export function spokenRequest(text) {
  const words = supplyWords(text);
  return words
    ? `Please select ${words.length > 1 ? words.slice(0, -1).join(', ') + ' and ' + words.at(-1) : words[0]}.`
    : String(text);
}
// Mr. Saymaz's story voice: a British male voice where the device has one (Apple Daniel, Arthur or Oliver;
// Google UK English Male; Microsoft Ryan, Thomas or George), then any male English voice, then any British voice,
// then any English voice. Voice lists expose no gender, so known names decide.
const MALE = /\b(?:daniel|arthur|oliver|george|harry|ryan|thomas|alfie|brian|jamie|rishi|alex|fred|aaron|david|mark|guy|tom|evan|nathan|reed|rocko|eddy|male)\b/i,
  FEMALE = /female|samantha|serena|karen|moira|tessa|victoria|kate|stephanie|martha|flo|sandy|shelley|aria|jenny|sonia|libby|hazel|susan|zira|ava|emma|allison|joanna|salli|kendra|kimberly|fiona|veena|catherine/i;
export function storyVoice(voices = []) {
  const english = voices.filter(v => /^en(?:[-_]|$)/i.test(v.lang)),
    gb = v => /^en[-_]GB/i.test(v.lang),
    male = v => MALE.test(v.name) && !FEMALE.test(v.name.replace(/\bmale\b/i, ''));
  const rank = v => (gb(v) && male(v) ? 0 : male(v) ? 1 : gb(v) && !FEMALE.test(v.name) ? 2 : gb(v) ? 3 : 4);
  return english.sort((a, b) => rank(a) - rank(b) || Number(b.localService) - Number(a.localService))[0] || null;
}
