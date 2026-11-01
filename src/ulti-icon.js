// The Ulti point: a faceted cyan crystal with a white U (after the English League's Ulti artwork).
const ULTI_BODY = `<defs><linearGradient id="ulti-a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9fbff"/><stop offset=".5" stop-color="#2fd2f2"/><stop offset="1" stop-color="#1279c6"/></linearGradient><linearGradient id="ulti-b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7ff0ff"/><stop offset="1" stop-color="#1a8fd8"/></linearGradient></defs>
<path d="M32 3 55 31 32 61 9 31Z" fill="url(#ulti-a)" stroke="#0b3550" stroke-width="2.6" stroke-linejoin="round"/>
<path d="M32 3 44 20 32 33 20 20Z" fill="#c9fdff" opacity=".55"/><path d="M9 31 20 20 32 33 20 44Z" fill="url(#ulti-b)" opacity=".7"/><path d="M55 31 44 20 32 33 44 44Z" fill="#0f6fb8" opacity=".55"/><path d="M20 44 32 33 44 44 32 61Z" fill="#0d5f9f" opacity=".6"/>
<path d="M23.5 21v13.5L32 41l8.5-6.5V21h-4.6v11.2L32 35.3l-3.9-3.1V21Z" fill="#f4ffff" stroke="#bff6ff" stroke-width=".8" stroke-linejoin="round"/>`;
export function ultiIcon(cls = 'ulti-icon') {
  return `<svg class="${cls}" viewBox="0 0 64 64" aria-hidden="true" focusable="false">${ULTI_BODY}</svg>`;
}
export const ULTI_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Ulti">${ULTI_BODY}</svg>`;
