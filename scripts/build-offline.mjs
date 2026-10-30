#!/usr/bin/env node
// Writes dist/offline-shell.json (the app shell the service worker caches on install) and stamps a content hash
// into dist/sw.js so browsers pick up each new build. Run after changing any shell file: `npm run offline`.
// `npm run build` (scripts/verify.mjs) fails when the list or the hash is out of date.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const DIST=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','dist');
const PREVIEWS=new Set(['environment-preview.js','partner-preview.js','task-preview.js','sw.js']);
export function shellFiles(dist=DIST){
 const top=fs.readdirSync(dist).filter(f=>/\.(js|css)$/.test(f)&&!PREVIEWS.has(f)).sort();
 const walk=dir=>fs.readdirSync(path.join(dist,dir),{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(path.join(dir,d.name)):[path.join(dir,d.name)]);
 const vendor=walk('vendor').filter(f=>f.endsWith('.js')),fonts=walk('assets/fonts').filter(f=>/\.(woff2?|ttf|otf)$/.test(f)),icons=walk('icons');
 return['./','index.html','manifest.webmanifest','icon.svg','data/lesson-catalog.json',...top,...vendor,...fonts,...icons].map(f=>f.split(path.sep).join('/'));
}
export function shellHash(files,dist=DIST){
 const h=crypto.createHash('sha256');for(const f of files){if(f==='./')continue;h.update(f);h.update(fs.readFileSync(path.join(dist,f)));}
 return h.digest('hex').slice(0,12);
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const files=shellFiles(),hash=shellHash(files);
 fs.writeFileSync(path.join(DIST,'offline-shell.json'),JSON.stringify({hash,files},null,1)+'\n');
 const sw=path.join(DIST,'sw.js'),source=fs.readFileSync(sw,'utf8').replace(/const SHELL_HASH='[^']*';/,`const SHELL_HASH='${hash}';`);
 fs.writeFileSync(sw,source);
 console.log(`Offline shell: ${files.length} files, hash ${hash}`);
}
