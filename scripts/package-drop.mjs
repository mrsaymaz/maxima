#!/usr/bin/env node
// Packages dist/ for Netlify Drop or any manual upload: release/solMaxima-v<version>-Netlify-Drop.zip, and for Vercel's
// drag and drop: release/solMaxima-v<version>-Vercel-Drop.zip (the same site with a vercel.json carrying only the
// repository vercel.json's headers: a dropped folder is published as it is, with no build step).
// The zip's top level is the site itself (index.html, corridor-app.js, assets/, data/ …). A drag-and-drop deploy
// does not read the repository's netlify.toml, so its [[headers]] rules are written into a _headers file at the
// top of the site, which Netlify applies to manual deploys. Run after npm run build: npm run package
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),DIST=path.join(ROOT,'dist');
const {version}=JSON.parse(fs.readFileSync(path.join(ROOT,'package.json'),'utf8'));
execFileSync(process.execPath,[path.join(ROOT,'scripts/verify.mjs')],{stdio:'inherit'});
// netlify.toml [[headers]] → _headers
const toml=fs.readFileSync(path.join(ROOT,'netlify.toml'),'utf8'),rules=[];
for(const block of toml.split('[[headers]]').slice(1)){const route=/for\s*=\s*"([^"]+)"/.exec(block)?.[1];if(!route)continue;
 const values=[...block.split('[headers.values]')[1]?.matchAll(/^\s*([A-Za-z-]+)\s*=\s*"([^"]*)"/gm)||[]].map(m=>`  ${m[1]}: ${m[2]}`);if(values.length)rules.push(`${route}\n${values.join('\n')}`);}
const stage=fs.mkdtempSync(path.join(os.tmpdir(),'solmaxima-drop-')),site=path.join(stage,'site');
fs.cpSync(DIST,site,{recursive:true});fs.writeFileSync(path.join(site,'_headers'),`# Generated from netlify.toml by scripts/package-drop.mjs\n${rules.join('\n\n')}\n`);
const outDir=path.join(ROOT,'release');fs.mkdirSync(outDir,{recursive:true});
const pack=name=>{const zip=path.join(outDir,`solMaxima-v${version}-${name}.zip`);fs.rmSync(zip,{force:true});execFileSync('zip',['-q','-r','-X',zip,'.'],{cwd:site});return zip;};
const netlify=pack('Netlify-Drop');
// Vercel: the dropped folder is the site; its vercel.json keeps only the headers (no build command or output folder).
const vercel=JSON.parse(fs.readFileSync(path.join(ROOT,'vercel.json'),'utf8'));
fs.rmSync(path.join(site,'_headers'));fs.writeFileSync(path.join(site,'vercel.json'),JSON.stringify({headers:vercel.headers},null,2)+'\n');
const vercelZip=pack('Vercel-Drop');fs.rmSync(stage,{recursive:true,force:true});
for(const [zip,n] of [[netlify,rules.length],[vercelZip,vercel.headers.length]])console.log(`${path.relative(ROOT,zip)}: ${(fs.statSync(zip).size/1048576).toFixed(1)} MB, ${n} header rules`);
