// Simplified icons for the twelve elemental specials (24×24, two tones: the line colour and a soft fill).
const P = {
  'fire-pillars':
    '<path d="M5 21V12c0-2 2-3 2-6 2 2 2 4 2 6v9M10.5 21V9c0-2 2-3 1.5-7 2.5 2.5 2.5 5 2.5 7v12M16 21v-8c0-2 2-3 2-5 1.5 2 1.5 3.5 1.5 5v8" /><path class="f" d="M3 21h18"/>',
  'flame-prison':
    '<ellipse cx="12" cy="17" rx="9" ry="3.5"/><path d="M5 17v-6M9 18.5V9M15 18.5V9M19 17v-6"/><path class="f" d="M12 14c-2-1.5-2-4 0-6.5 2 2.5 2 5 0 6.5Z"/>',
  'meteor-storm':
    '<circle class="f" cx="15" cy="15" r="4.5"/><path d="M11.8 11.8 3 3M13 10 8 3.5M10 13 3.5 8M19.5 4.5l-2 2M21 9h-2.5"/>',
  'ice-spears': '<path d="M3 12h13l5-3-1.5 3 1.5 3-5-3M3 6.5h9l4-2-1 2 1 2-4-2M3 17.5h9l4-2-1 2 1 2-4-2"/>',
  'frost-lock':
    '<path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 3.5l3 2 3-2M9 20.5l3-2 3 2"/><rect class="f" x="8.5" y="9" width="7" height="6" rx="1.5"/>',
  'tidal-wave':
    '<path d="M2 18c3 0 4-2 6-2s3 2 6 2 4-2 8-2M2 13c2-6 7-10 13-9-4 1.5-5 4-4 6 1.5 3 5 2 6 0 1 3-1 6-5 6"/><path class="f" d="M2 21h20"/>',
  thunderbolt: '<path class="f" d="M13 2 5 13.5h6L9 22l9-12.5h-6.2L13 2Z"/>',
  updraft: '<path d="M4 6h16M6 10h12M8 14h8M10 18h4M12 22v-2"/><path class="f" d="M12 2c3 1 4 3 2 4"/>',
  tempest:
    '<path class="f" d="M6 11a4 4 0 0 1 .5-8 5.5 5.5 0 0 1 10.3 1.5A3.6 3.6 0 0 1 17.5 11H6Z"/><path d="M12 13l-2.5 4h3L10 22M6 14l-1 3M18 14l-1 3"/>',
  'thorn-volley': '<path d="M3 21 7 9l4 12M10 21l4-14 4 14M16 21l3-8 2 8"/><path class="f" d="M2 21h20"/>',
  'root-bind':
    '<path d="M12 21c0-4-5-4-5-8s4-4 4-7M12 21c0-4 5-4 5-8s-4-4-4-7M4 21c2-2 5-1 8 0 3-1 6-2 8 0"/><circle class="f" cx="12" cy="4" r="2"/>',
  'ancient-grove':
    '<path d="M12 22v-8M12 16l-4-3M12 14l4-3M9 22c1-2 2-3 3-3s2 1 3 3"/><path class="f" d="M12 2c4 0 7 2.5 7 6 0 2.6-2 4.5-4.5 5h-5C7 12.5 5 10.6 5 8c0-3.5 3-6 7-6Z"/>',
};
export function specialIcon(id) {
  return `<svg class="special-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${P[id] || ''}</svg>`;
}
