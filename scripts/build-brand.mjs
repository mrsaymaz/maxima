// Builds the solMaxima logo files from one drawing: a faceted gold crystal X with a small sun at its heart, wrapped
// by a tilted orbit on which the sol travels, passing behind the X on the far half of each lap.
//   dist/logo-mark.svg       still mark (transparent), for the top bar and pages
//   dist/logo-animated.svg   the sol revolves (loading screen, home title)
//   dist/icon.svg            browser-tab icon on the dark rounded tile
//   dist/icons/*.png         app icons (rendered with the preinstalled Chromium when available)
// Run: node scripts/build-brand.mjs
import fs from 'node:fs';import path from 'node:path';import{createRequire}from'node:module';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..'),dist=path.join(root,'dist');

const ORBIT='M 54 -29 A 61 21 -28 0 0 -54 29 A 61 21 -28 0 0 54 -29',BACK='M 54 -29 A 61 21 -28 0 0 -54 29',FRONT='M -54 29 A 61 21 -28 0 0 54 -29';
const defs=`<defs>
 <radialGradient id="sun" cx=".38" cy=".33" r=".75"><stop offset="0" stop-color="#fffbe0"/><stop offset=".4" stop-color="#ffd84f"/><stop offset="1" stop-color="#e8700f"/></radialGradient>
 <radialGradient id="glow"><stop offset="0" stop-color="#ffcf4a" stop-opacity=".85"/><stop offset=".5" stop-color="#ffb02a" stop-opacity=".25"/><stop offset="1" stop-color="#ffb02a" stop-opacity="0"/></radialGradient>
 <linearGradient id="orbit" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffd25a" stop-opacity=".15"/><stop offset=".55" stop-color="#ffd25a" stop-opacity=".9"/><stop offset="1" stop-color="#fff2b0"/></linearGradient>
 <linearGradient id="goldL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff8dc"/><stop offset=".6" stop-color="#f6d37e"/><stop offset="1" stop-color="#e3b25a"/></linearGradient>
 <linearGradient id="goldD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c88f37"/><stop offset="1" stop-color="#6e4515"/></linearGradient>
 <linearGradient id="tile" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#24564a"/><stop offset="1" stop-color="#0b2421"/></linearGradient>
 <filter id="lift" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity=".55"/><feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#f5c04a" flood-opacity=".35"/></filter>
</defs>`;
// One faceted shard arm along x; the X is two of them at ±45°.
const arm=a=>`<g transform="rotate(${a})"><path d="M-62 0 L-40 -12 L-6 -9 L6 -13 L40 -9 L62 0 Z" fill="url(#goldL)"/><path d="M-62 0 L-40 10 L-6 13 L6 9 L40 12 L62 0 Z" fill="url(#goldD)"/>
 <path d="M-62 0 L-40 -12 L-6 -9 L6 -13 L40 -9 L62 0 L40 12 L6 9 L-6 13 L-40 10 Z" fill="none" stroke="#fff0c0" stroke-width="2" stroke-linejoin="round"/>
 <path d="M-40 -12 L-30 0 L-40 10 M40 -9 L28 0 L40 12 M-6 -9 L0 0 L-6 13 M6 -13 L0 0 L6 9" stroke="#fffbe8" stroke-opacity=".55" stroke-width="1.1" fill="none"/></g>`;
const cross=`<g filter="url(#lift)">${arm(45)}${arm(-45)}</g><circle r="11.5" fill="#12352f" stroke="#fff0c0" stroke-width="2.5"/><circle r="6.5" fill="url(#sun)"/>`;
const rays=`<g stroke="#ffe39a" stroke-width="2.4" stroke-linecap="round"><line y1="-18" y2="-14"/><line y1="18" y2="14"/><line x1="-18" x2="-14"/><line x1="18" x2="14"/><line x1="-12.7" y1="-12.7" x2="-10" y2="-10"/><line x1="12.7" y1="12.7" x2="10" y2="10"/><line x1="12.7" y1="-12.7" x2="10" y2="-10"/><line x1="-12.7" y1="12.7" x2="-10" y2="10"/></g>`;
const sol=(extra='')=>`<g${extra}><circle r="24" fill="url(#glow)"/>${rays}<circle r="10" fill="url(#sun)"/></g>`;
const orbitBack=`<path d="${BACK}" fill="none" stroke="#ffd25a" stroke-opacity=".35" stroke-width="3"/>`,orbitFront=`<path d="${FRONT}" fill="none" stroke="url(#orbit)" stroke-width="3.6" stroke-linecap="round"/>`;
// Still: the sol rests on the near side of the orbit.
export function markSvg(){return `<g>${orbitBack}${cross}${orbitFront}<g transform="translate(42 30)">${sol()}</g></g>`;}
// Animated: one lap every 9 s. The sol is drawn twice on the same motion path, behind the X for the far half of the lap
// and in front of it for the near half, so it truly passes behind the cross.
export function animatedSvg(){const motion=`<animateMotion dur="9s" repeatCount="indefinite" path="${ORBIT}"/>`;
 const vis=(near)=>`<animate attributeName="opacity" dur="9s" repeatCount="indefinite" calcMode="discrete" keyTimes="0;.5" values="${near?'0;1':'1;0'}"/>`;
 return `<g>${orbitBack}<g opacity=".8">${sol()}${motion}${vis(false)}</g>${cross}${orbitFront}<g>${sol()}${motion}${vis(true)}</g></g>`;}
const doc=(body,{tile=false,pad=0}={})=>{const v=80+pad;return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-v} ${-v} ${2*v} ${2*v}" role="img" aria-label="solMaxima">${defs}${tile?`<rect x="${-v}" y="${-v}" width="${2*v}" height="${2*v}" rx="${v*.45}" fill="url(#tile)"/>`:''}${body}</svg>`;};

const files={'logo-mark.svg':doc(markSvg()),'logo-animated.svg':doc(animatedSvg()),'icon.svg':doc(markSvg(),{tile:true,pad:8})};
for(const[name,svg]of Object.entries(files))fs.writeFileSync(path.join(dist,name),svg+'\n');
console.log('Wrote',Object.keys(files).join(', '));

// App icons: the still mark on the dark tile (maskable keeps the mark inside the 80% safe zone).
try{
 const require=createRequire('/opt/node22/lib/node_modules/');const{chromium}=require('playwright');const browser=await chromium.launch();const page=await browser.newPage();
 const render=async(svg,size,out)=>{await page.setViewportSize({width:size,height:size});await page.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ',`<svg width="${size}" height="${size}" `)}</body></html>`);await page.screenshot({path:path.join(dist,'icons',out),omitBackground:true});};
 for(const[size,out]of[[192,'icon-192.png'],[512,'icon-512.png'],[180,'apple-touch-icon.png']])await render(doc(markSvg(),{tile:true,pad:8}),size,out);
 await render(doc(markSvg(),{tile:true,pad:30}).replace(/rx="[^"]*"/,'rx="0"'),512,'maskable-512.png');
 await browser.close();console.log('Rendered app icons');
}catch(e){console.log('App icons not rendered (no browser here):',e.message);}
