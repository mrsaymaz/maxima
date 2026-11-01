// Keeping the English in English (0.72.0).
//
// 1. Prevention: every page declares translate="no", class "notranslate" and <meta name="google" content="notranslate">.
//    Chrome, Edge, Safari and Firefox then neither offer nor apply page translation, and their translators leave
//    elements marked this way alone even when a student asks for a translation from the browser menu.
// 2. Detection, for tools that ignore those markers (some extensions and browsers):
//    - a canary: a tiny English sentence kept in the page; if its text changes, something rewrote the page;
//    - Google Translate's traces: "translated-ltr/rtl" on <html>, its banner, tooltip and injected <font> wrappers;
//    - Microsoft Translator's traces: _msttexthash / _mstmutation attributes;
//    - <html lang> changed away from English.
//    While any sign is present the game is paused behind a notice (in English and Turkish) and answers do not count.
// 3. Select-to-translate: text in play cannot be selected, so the phone's long-press "Translate" never appears
//    (styles in style.css).
export const CANARY_TEXT = 'Keep learning in English.';
export function translationSigns(doc = globalThis.document) {
  const reasons = [];
  if (!doc?.documentElement) return reasons;
  const html = doc.documentElement,
    cls = html.classList;
  if (cls?.contains?.('translated-ltr') || cls?.contains?.('translated-rtl')) reasons.push('google');
  const lang = String(html.getAttribute?.('lang') || '').toLowerCase();
  if (lang && !lang.startsWith('en')) reasons.push('lang');
  const canary = doc.getElementById?.('translate-canary');
  if (canary && canary.textContent.trim() !== CANARY_TEXT) reasons.push('canary');
  if (doc.querySelector?.('.goog-te-banner-frame, #goog-gt-tt, .goog-te-spinner-pos, font[style*="vertical-align: inherit"]'))
    reasons.push('google-dom');
  if (doc.querySelector?.('[_msttexthash], [_mstmutation]')) reasons.push('microsoft');
  return reasons;
}
// Adds the canary and starts watching. onChange(active, reasons) runs when translation starts or stops.
export function installTranslateGuard({ doc = globalThis.document, win = globalThis.window, onChange = () => {}, every = 1200 } = {}) {
  if (!doc?.body?.appendChild) return { stop() {}, check: () => [] };
  let canary = doc.getElementById?.('translate-canary');
  if (!canary) {
    canary = doc.createElement('span');
    canary.id = 'translate-canary';
    canary.setAttribute('aria-hidden', 'true');
    canary.textContent = CANARY_TEXT;
    doc.body.appendChild(canary);
  }
  let active = false;
  const check = () => {
    const reasons = translationSigns(doc);
    if (!!reasons.length !== active) {
      active = !!reasons.length;
      onChange(active, reasons);
    }
    return reasons;
  };
  const timer = (win?.setInterval || setInterval)(check, every);
  let observer = null;
  const MO = win?.MutationObserver || globalThis.MutationObserver;
  if (MO) {
    observer = new MO(check);
    observer.observe(doc.documentElement, { attributes: true, attributeFilter: ['class', 'lang'] });
    observer.observe(canary, { characterData: true, childList: true, subtree: true });
  }
  check();
  return {
    check,
    get active() {
      return active;
    },
    stop() {
      (win?.clearInterval || clearInterval)(timer);
      observer?.disconnect();
    },
  };
}
// The notice shown while a page translation is active, in English and Turkish (both stay readable either way).
export function translateNoticeMarkup(figure = '') {
  return `<div class="translate-card" role="alertdialog" aria-modal="true" aria-labelledby="translate-title">${figure}<div class="translate-text"><h2 id="translate-title">Please turn off Translate</h2><p>solMaxima is for learning English. Your browser is translating the game, so the game is paused.</p><p lang="tr" class="tr">Tarayıcın oyunu çeviriyor. solMaxima İngilizce öğrenmek için, bu yüzden oyun durduruldu. Lütfen çeviriyi kapat.</p><ul><li><b>Chrome / Android:</b> ⋮ menu → <i>Translate</i> → <i>Show original</i> (or tap “English” in the translate bar).</li><li><b>Safari / iPhone, iPad:</b> <i>aA</i> → <i>Show Original</i>.</li><li><b>Edge:</b> the translate icon in the address bar → <i>Show original</i>.</li><li><b>A translate extension:</b> turn it off for this site.</li></ul><button class="primary-action" data-translate="check">I turned it off</button></div></div>`;
}
