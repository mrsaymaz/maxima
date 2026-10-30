// One local stroke family. Icons are decorative; their controls retain text/ARIA names.
const paths={
 download:'M12 4v11M7 10l5 5 5-5M5 20h14',expand:'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5',
 attack:'m13 3-8 11h6l-1 7 9-12h-6z',jump:'M12 19V5m-5 5 5-5 5 5M5 21h14',
 follow:'M7 17 17 7M7 7h10v10',use:'M8 12V7a2 2 0 0 1 4 0v5m0-4a2 2 0 0 1 4 0v5m0-3a2 2 0 0 1 4 0v5c0 4-3 6-6 6h-2c-2 0-3-1-4-3l-3-5a2 2 0 0 1 3-2l3 3',
 left:'M17 17 7 7m0 9V7h9',right:'M7 17 17 7M8 7h9v9',close:'m6 6 12 12M6 18 18 6',
 sound:'m4 9 5 0 5-4v14l-5-4H4zm13-1c2 2 2 6 0 8m3-11c4 4 4 10 0 14',mute:'m4 9 5 0 5-4v14l-5-4H4zm14 0 4 6m0-6-4 6',
 book:'M3 5h6a4 4 0 0 1 3 2 4 4 0 0 1 3-2h6v14h-6a4 4 0 0 0-3 2 4 4 0 0 0-3-2H3zm9 2v14',
 coin:'M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-4 3 4-3 4-3-4z',
 check:'m5 12 4 4L19 6',spark:'m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z',
 edit:'m4 16-1 5 5-1L20 8l-4-4zm10-10 4 4',wardrobe:'m8 4-5 4 3 4 2-1v10h8V11l2 1 3-4-5-4c-1 3-7 3-8 0',
 menu:'M5 6h14M5 12h14M5 18h14',fire:'M13 3c1 5-4 5-3 9-2-1-3-3-3-3-5 7-2 12 5 12 8 0 10-8 1-18Z',
 flag:'M5 21V4m0 0c5-3 8 3 14 0v9c-6 3-9-3-14 0',refresh:'M20 10a8 8 0 1 0 0 5m0-10v5h-5',
 mountain:'m2 20 7-15 4 8 3-5 6 12zm5-11 4 0',chest:'M3 9h18v12H3zm0 0V6c0-2 18-2 18 0v3M10 8h4v6h-4zm-3 6v7m10-7v7',
 help:'M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 3m0 4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
 more:'M5 11v2m7-2v2m7-2v2',star:'m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4-4.6-4.5 6.4-.9z'
};
export function icon(name){return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${paths[name]||paths.spark}"/></svg>`;}
export const questIcon=id=>({run:'flag',correct:'check',review:'refresh',rival:'attack',coins:'coin',perfect:'star',listen:'sound',learn:'book',trial:'mountain'}[id]||'spark');
