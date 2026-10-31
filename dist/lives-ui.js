// Lives (0.57): three per area, shown as hearts on the path's top badge and in the guardian arena's header.
export const START_LIVES=3,MAX_LIVES=5;
export function heartsHtml(n){const shown=Math.max(START_LIVES,n);return Array.from({length:shown},(_,i)=>`<svg class="heart${i<n?' full':''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.7 4.5c2.2 0 3.7 1.3 4.3 2.6.6-1.3 2.1-2.6 4.3-2.6 3.7 0 5.8 3.8 4.3 7.2C19.5 16.4 12 21 12 21Z"/></svg>`).join('');}
