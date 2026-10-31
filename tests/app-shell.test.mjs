import{test}from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import path from'node:path';import vm from'node:vm';
import{registerOffline,canInstall,installed,promptInstall,fullscreenAvailable,inFullscreen,toggleFullscreen,keepAwake,loadedFiles}from'../dist/app-shell.js';
import{shellFiles,shellHash}from'../scripts/build-offline.mjs';

const dist=path.resolve('dist'),read=f=>fs.readFileSync(path.join(dist,f),'utf8');
test('app shell helpers are inert without browser APIs (tests, old browsers, plain http)',async()=>{
 assert.equal(registerOffline(),false);assert.equal(canInstall(),false);assert.equal(installed(),false);assert.equal(await promptInstall(),false);
 assert.equal(fullscreenAvailable(),false);assert.equal(inFullscreen(),false);await toggleFullscreen();await keepAwake(true);await keepAwake(false);assert.deepEqual(loadedFiles(),[]);
});
test('offline shell list and hash are current, and the worker carries the hash',()=>{
 const shell=JSON.parse(read('offline-shell.json')),files=shellFiles();
 assert.deepEqual(shell.files,files);assert.equal(shell.hash,shellHash(files));assert.ok(read('sw.js').includes(`const SHELL_HASH='${shell.hash}';`));
 for(const f of['./','index.html','manifest.webmanifest','corridor-app.js','app-shell.js','data/lesson-catalog.json','vendor/three.module.min.js'])assert.ok(files.includes(f),f);
 assert.ok(!files.includes('sw.js'),'the worker never caches itself');for(const f of files)if(f!=='./')assert.ok(fs.existsSync(path.join(dist,f)),f);
});
test('manifest makes solMaxima installable full screen with real icons',()=>{
 const m=JSON.parse(read('manifest.webmanifest')),html=read('index.html');
 assert.equal(m.display,'fullscreen');assert.equal(m.start_url,'./');assert.ok(m.icons.some(i=>i.purpose==='maskable'));
 for(const i of m.icons){const png=fs.readFileSync(path.join(dist,i.src));assert.equal(png.readUInt32BE(16),Number(i.sizes.split('x')[0]),i.src);}
 assert.match(html,/rel="manifest" href="manifest\.webmanifest"/);assert.match(html,/apple-touch-icon/);
});
test('service worker serves media from cache while refreshing it, data and code network-first, and warms first-visit files',async()=>{
 const listeners={},stores=new Map(),log=[];
 const store=name=>{if(!stores.has(name))stores.set(name,new Map());const s=stores.get(name);return{put:async(k,v)=>s.set(typeof k==='string'?k:k.url,v),match:async k=>s.get(typeof k==='string'?k:k.url),keys:async()=>[...s.keys()]};};
 const caches={open:async n=>store(n),keys:async()=>[...stores.keys()],delete:async n=>stores.delete(n),match:async k=>{for(const n of stores.keys()){const hit=await store(n).match(k);if(hit)return hit;}}};
 const response=()=>({ok:true,status:200,type:'basic',clone(){return this;}});
 const self={location:{href:'https://maxima.test/',origin:'https://maxima.test'},addEventListener:(t,f)=>listeners[t]=f,skipWaiting:async()=>{},clients:{claim:async()=>{}}};
 vm.runInNewContext(read('sw.js'),{self,caches,URL,Promise,setTimeout,Request:class{constructor(u){this.url=u;}},fetch:async u=>{log.push(typeof u==='string'?u:u.url);return response();}});
 const pending=[],run=async url=>{let p;listeners.fetch({request:{url,method:'GET',mode:'cors',headers:{has:()=>false}},respondWith:x=>p=x,waitUntil:x=>pending.push(x)});return p;};
 await run('https://maxima.test/assets/creature.glb');await run('https://maxima.test/data/lessons/g5u1.json');await run('https://maxima.test/corridor-app.js');
 assert.deepEqual([...stores.keys()].sort(),['maxima-data-v1','maxima-media-v1',`maxima-shell-${read('offline-shell.json').match(/"hash": "(\w+)"/)[1]}`].sort());
 const glb=stores.get('maxima-media-v1').get('https://maxima.test/assets/creature.glb');let served;listeners.fetch({request:{url:'https://maxima.test/assets/creature.glb',method:'GET',mode:'cors',headers:{has:()=>false}},respondWith:x=>served=x,waitUntil:x=>pending.push(x)});
 assert.equal(await served,glb,'cached media answers at once');assert.equal(pending.length,1,'and refreshes in the background');await Promise.all(pending);log.length=0;
 let warm;listeners.message({data:{type:'warm',urls:['https://maxima.test/data/lessons/g5u2.json','https://elsewhere.test/x.js','https://maxima.test/corridor-app.js']},waitUntil:p=>warm=p});await warm;
 assert.deepEqual(log,['https://maxima.test/data/lessons/g5u2.json'],'only missing same-origin files are fetched');
});
test('a new build offers a reload only when it replaces a running one, never on the first install',async()=>{
 const{watchUpdates}=await import('../dist/app-shell.js');const listeners={},sw={controller:null,addEventListener:(t,f)=>listeners[t]=f};
 const before=globalThis.navigator;Object.defineProperty(globalThis,'navigator',{value:{serviceWorker:sw},configurable:true});
 try{let offers=0;assert.equal(watchUpdates(()=>offers++),true);listeners.controllerchange();assert.equal(offers,0,'first install');listeners.controllerchange();assert.equal(offers,1,'a later build');
  sw.controller={};let again=0;watchUpdates(()=>again++);listeners.controllerchange();assert.equal(again,1,'page already controlled');}
 finally{Object.defineProperty(globalThis,'navigator',{value:before,configurable:true});}
});
test('the game is named solMaxima, with the gold crystal X logo on the loading screen, the top bar and the icons',()=>{
 const m=JSON.parse(read('manifest.webmanifest')),html=read('index.html');assert.equal(m.short_name,'solMaxima');assert.match(m.name,/^solMaxima/);assert.match(html,/<title>solMaxima/);assert.match(html,/apple-mobile-web-app-title" content="solMaxima"/);
 assert.match(html,/class="load-logo" src="logo-animated.svg"/);assert.match(html,/class="brand-mark" src="logo-mark.svg"/);assert.match(html,/BY MR. SAYMAZ/);
 const animated=read('logo-animated.svg'),still=read('logo-mark.svg');assert.match(animated,/animateMotion/);assert.equal((animated.match(/<animateMotion/g)||[]).length,2,'the sol is drawn behind and in front of the X on one path');assert.doesNotMatch(still,/animate/,'the still mark never moves');
});
