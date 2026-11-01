#!/usr/bin/env node
// Builds the deployable game in dist/ from the readable source in src/ (0.67.0).
//
//   src/            code: ES modules, CSS, HTML pages, the service worker and the vendored libraries
//   dist/           what is deployed: the built code below, plus static content kept in place
//                   (assets/, data/, icons/, logos, manifest.webmanifest, offline-shell.json)
//
// Steps:
//   1. Start from the HTML pages in src/ and follow every <script>, <link rel=stylesheet> and static import.
//      Only reachable modules are built, so test-only or retired modules never ship.
//   2. ES modules and CSS are minified with esbuild (keepNames, no bundling: one file in, one file out, same name).
//      Classic scripts (config.js, sw.js) and HTML are copied unchanged. src/vendor is copied as-is.
//   3. Stale built code in dist/ (top-level .js/.css/.html that is no longer produced) is removed.
//   4. scripts/build-offline.mjs refreshes the offline shell list and hash (dist/offline-shell.json, sw.js).
//
// Usage: npm run build            build, refresh the offline shell, verify
//        node scripts/build.mjs --out <dir> --no-offline   build code only (used by the build-sync test)
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {transform} from 'esbuild';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),SRC=path.join(ROOT,'src');
const arg=name=>{const i=process.argv.indexOf(name);return i>0?process.argv[i+1]:null;};
const OUT=path.resolve(arg('--out')||path.join(ROOT,'dist')),offline=!process.argv.includes('--no-offline');
const PAGES=fs.readdirSync(SRC).filter(f=>f.endsWith('.html')).sort(),CLASSIC=new Set(['sw.js']);
const modules=new Set(),styles=new Set(),classic=new Set(['sw.js']);
const IMPORT=/(?:^|[;\s}])(?:import|export)\s*(?:[^'"`;]*?\sfrom\s*)?['"](\.{1,2}\/[^'"]+)['"]/g;
function follow(file){if(modules.has(file))return;if(!fs.existsSync(path.join(SRC,file)))throw Error(`Missing module src/${file}`);modules.add(file);
 const text=fs.readFileSync(path.join(SRC,file),'utf8');
 for(const m of text.matchAll(IMPORT)){const next=path.posix.normalize(path.posix.join(path.posix.dirname(file),m[1]));if(!next.startsWith('vendor/'))follow(next);}}
for(const page of PAGES){const html=fs.readFileSync(path.join(SRC,page),'utf8');
 for(const m of html.matchAll(/<script([^>]*)\ssrc="([^"]+)"/g)){const file=m[2];if(/type="module"/.test(m[1]))follow(file);else{classic.add(file);CLASSIC.add(file);}}
 for(const m of html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"|<link[^>]*href="([^"]+\.css)"[^>]*rel="stylesheet"/g))styles.add(m[1]||m[2]);}
fs.mkdirSync(OUT,{recursive:true});
const written=new Set();let before=0,after=0;
async function emit(file,loader){const source=fs.readFileSync(path.join(SRC,file),'utf8');let out=source;
 if(loader){out=(await transform(source,{loader,minify:true,keepNames:loader==='js',format:loader==='js'?'esm':undefined,target:loader==='js'?'es2022':['chrome90','safari15','firefox90'],legalComments:'none',charset:'utf8'})).code;}
 const dest=path.join(OUT,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,out);written.add(file);before+=source.length;after+=out.length;}
for(const f of [...modules].sort())await emit(f,'js');
for(const f of [...styles].sort())await emit(f,'css');
for(const f of [...classic].sort())await emit(f,null);
for(const f of PAGES)await emit(f,null);
fs.rmSync(path.join(OUT,'vendor'),{recursive:true,force:true});fs.cpSync(path.join(SRC,'vendor'),path.join(OUT,'vendor'),{recursive:true});
for(const f of fs.readdirSync(OUT))if(/\.(js|css|html)$/.test(f)&&!written.has(f)){fs.rmSync(path.join(OUT,f));console.log('removed stale dist/'+f);}
console.log(`Built ${modules.size} modules, ${styles.size} stylesheets, ${classic.size} classic scripts and ${PAGES.length} pages: ${(before/1024).toFixed(0)} KB source → ${(after/1024).toFixed(0)} KB.`);
if(offline&&OUT===path.join(ROOT,'dist')){const {execFileSync}=await import('node:child_process');execFileSync(process.execPath,[path.join(ROOT,'scripts/build-offline.mjs')],{stdio:'inherit'});}
