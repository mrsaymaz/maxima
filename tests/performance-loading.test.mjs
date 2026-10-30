import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from '../dist/vendor/three.module.min.js';
import {fetchResource,fetchJSON,LessonLibrary} from '../dist/asset-network.js';
import {AssetCache,createFormCache,formKey,acquireForm,loadGLTF} from '../dist/asset-cache.js';
import {releaseForm,disposeResources,estimatedTextureBytes} from '../dist/asset-resources.js';
import {AdaptiveResolution} from '../dist/adaptive-resolution.js';
import {RuntimeLifecycle} from '../dist/runtime-lifecycle.js';
import {PerformanceMonitor} from '../dist/performance-monitor.js';
import {World} from '../dist/scene.js';
import {PostFX} from '../dist/post-fx.js';
import {applyGraphics} from '../dist/render-quality.js';
import {GLTFLoader} from '../dist/vendor/loaders/GLTFLoader.js';
import {MusicPlayer} from '../dist/game-audio.js';
import {Voice} from '../dist/voice.js';
const response=(data,status=200)=>({ok:status>=200&&status<300,status,arrayBuffer:async()=>new TextEncoder().encode(JSON.stringify(data)).buffer});
test('startup requests only the small catalogue and selected lesson; every split record matches the full authoring bank',async()=>{
 const all=JSON.parse(fs.readFileSync('dist/data/expedition-language.json')),catalog=JSON.parse(fs.readFileSync('dist/data/lesson-catalog.json')),requests=[];
 const library=new LessonLibrary(catalog.units,{load:async id=>{requests.push(id);return JSON.parse(fs.readFileSync(`dist/data/lessons/${id}.json`));}});
 assert.deepEqual(requests,[]);await library.select('g8u5');assert.deepEqual(requests,['g8u5']);await library.select('g8u5');assert.deepEqual(requests,['g8u5']);
 assert.ok(!library.units.find(u=>u.id==='g5u1').vocabulary);
 for(const u of all.units)assert.deepEqual(JSON.parse(fs.readFileSync(`dist/data/lessons/${u.id}.json`)),u);
 const largest=Math.max(...all.units.map(u=>fs.statSync(`dist/data/lessons/${u.id}.json`).size));assert.ok(fs.statSync('dist/data/lesson-catalog.json').size+largest<fs.statSync('dist/data/expedition-language.json').size*.06);
 for(const u of all.units.slice(0,8))await library.select(u.id);assert.equal(library.loaded.size,3);assert.equal(library.units.filter(u=>u.vocabulary).length,3);
});
test('failed lesson requests retry without changing the selected lesson; concurrent selections share one request',async()=>{
 let calls=0;const units=[{id:'a'},{id:'b'}],library=new LessonLibrary(units,{load:async id=>{calls++;if(calls===1)throw Error('offline');return{id,vocabulary:[1],questions:[1]};}});
 await assert.rejects(library.select('a'));assert.equal(library.selected,null);await Promise.all([library.select('a'),library.select('a')]);assert.equal(calls,2);assert.equal(library.selected,'a');await assert.rejects(library.select('missing'));assert.equal(library.selected,'a');
});
test('transient HTTP failures retry once, missing files do not retry, and body transfer stays inside its deadline',async()=>{
 let calls=0;const value=await fetchJSON('lesson',{fetcher:async()=>++calls===1?response({},503):response({ok:true})});assert.deepEqual(value,{ok:true});assert.equal(calls,2);
 calls=0;await assert.rejects(fetchResource('missing',{fetcher:async()=>{calls++;return response({},404);}}));assert.equal(calls,1);
 calls=0;await assert.rejects(fetchResource('stalled',{timeout:5,fetcher:async(_,{signal})=>{calls++;return{ok:true,arrayBuffer:()=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError'))))};}}));assert.equal(calls,2);
});
test('cancelled foreground requests stop without a retry',async()=>{
 const controller=new AbortController();let calls=0;const promise=fetchResource('cancel',{signal:controller.signal,fetcher:async(_,{signal})=>{calls++;return new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError'))));}});controller.abort();await assert.rejects(promise);assert.equal(calls,1);
});
test('prefetch and foreground acquisition share work, references protect active assets, and repeated swaps stay bounded',async()=>{
 const loads=[],disposed=[];const cache=new AssetCache({load:async key=>{loads.push(key);return{key};},clone:x=>({...x}),dispose:x=>disposed.push(x.key),limit:2});
 const warm=cache.prefetch('0'),a=await cache.acquire('0');await warm;assert.deepEqual(loads,['0']);await cache.prefetch('1');const b=await cache.acquire('1');assert.deepEqual(loads,['0','1']);a.release();a.release();b.release();
 for(let n=2;n<30;n++){const lease=await cache.acquire(String(n));lease.release();assert.ok(cache.snapshot().templates<=2);assert.equal(cache.snapshot().activeLeases,0);}
 cache.clear();assert.equal(cache.snapshot().templates,0);assert.equal(disposed.length,30);assert.equal(new Set(disposed).size,30);
});
test('cancelled obsolete prefetch cannot poison a later foreground load or leak its late result',async()=>{
 let finish;const disposed=[];const cache=new AssetCache({load:async key=>key==='old'?new Promise(resolve=>finish=resolve):{key},dispose:v=>disposed.push(v.key)});
 const pending=cache.prefetch('old');await Promise.resolve();cache.cancelIdleLoads('new');finish({key:'old'});await assert.rejects(pending);const live=await cache.acquire('new');assert.equal(live.value.key,'new');assert.deepEqual(disposed,['old']);live.release();cache.clear();
});
function skinnedForm(level=0){
 const root=new T.Group(),geometry=new T.BoxGeometry(1,1,1),material=new T.MeshStandardMaterial(),texture=new T.Texture({width:256,height:256,close(){}});material.map=texture;
 const bone=new T.Bone(),child=new T.Bone();bone.add(child);const mesh=new T.SkinnedMesh(geometry,material);mesh.add(bone);mesh.bind(new T.Skeleton([bone,child]));root.add(mesh);root.updateMatrixWorld(true);return{model:root,level,partner:'hufflepuff',clips:[],attackProfile:[{bone:child,role:'head'}]};
}
test('leased forms have independent bones, materials and poses, share immutable texture/geometry, and release resources once',async()=>{
 let source;const cache=createFormCache(async level=>(source=skinnedForm(level)));const key=formKey('hufflepuff',0),a=await acquireForm(cache,key),b=await acquireForm(cache,key),am=a.model.children[0],bm=b.model.children[0];
 assert.equal(am.geometry,bm.geometry);assert.equal(am.material.map,bm.material.map);assert.notEqual(am.material,bm.material);assert.notEqual(am.skeleton,bm.skeleton);assert.notEqual(a.attackProfile[0].bone,b.attackProfile[0].bone);a.attackProfile[0].bone.rotation.x=.7;assert.ok(Math.abs(b.attackProfile[0].bone.rotation.x)<1e-12);
 let geometries=0,textures=0,images=0;source.model.children[0].geometry.addEventListener('dispose',()=>geometries++);source.model.children[0].material.map.addEventListener('dispose',()=>textures++);source.model.children[0].material.map.image.close=()=>images++;
 releaseForm(a.model);releaseForm(a.model);assert.equal(geometries,0);cache.clear();assert.equal(cache.snapshot().activeLeases,1);releaseForm(b.model);cache.clear();assert.equal(geometries,1);assert.equal(textures,1);assert.equal(images,1);
});
test('general scenery disposal deduplicates geometry/material/texture and respects shared resources',()=>{
 const root=new T.Group(),geometry=new T.BoxGeometry(),texture=new T.Texture(),material=new T.MeshBasicMaterial({map:texture});root.add(new T.Mesh(geometry,material),new T.Mesh(geometry,material));let g=0,m=0,t=0;geometry.addEventListener('dispose',()=>g++);material.addEventListener('dispose',()=>m++);texture.addEventListener('dispose',()=>t++);disposeResources(root);assert.deepEqual([g,m,t],[1,1,1]);
 material.userData.shared=true;disposeResources(root);assert.deepEqual([g,m,t],[2,1,1]);
});
test('a cached current form and prefetched next form are reused for the real World evolution path',async()=>{
 const w=Object.create(World.prototype);let loads=0;Object.assign(w,{partner:'hufflepuff',creature:new T.Group(),nav:{stop(){},cancelJump(){}},keys:new Set(),setInput(){},fetchUncachedForm:async(level,partner)=>{loads++;return{...skinnedForm(level),partner};}});
 const current=await w.fetchForm(0);await w.prefetchForm(1);const old=await w.fetchForm(0),next=await w.fetchForm(1);assert.equal(loads,2);assert.notEqual(current.model,old.model);assert.equal(current.model.children[0].geometry,old.model.children[0].geometry);for(const f of[current,old,next])w.disposeModel(f.model);w.formAssets.clear();assert.equal(w.formAssets.snapshot().templates,0);
});
test('GLTF timeout rejects promptly, retries are bounded, and late parsed models are disposed',async()=>{
 const previous=GLTFLoader.prototype.loadAsync;let calls=0,resolveLate,disposed=0;
 try{GLTFLoader.prototype.loadAsync=async()=>{calls++;return new Promise(resolve=>resolveLate=resolve);};await assert.rejects(loadGLTF('stalled',{timeout:5,retries:0}));assert.equal(calls,1);const form=skinnedForm();form.model.children[0].geometry.addEventListener('dispose',()=>disposed++);resolveLate({scene:form.model});await Promise.resolve();await Promise.resolve();assert.equal(disposed,1);
  GLTFLoader.prototype.loadAsync=async()=>{calls++;throw Error('offline');};await assert.rejects(loadGLTF('failed',{timeout:20,retries:1}));assert.equal(calls,3);
 }finally{GLTFLoader.prototype.loadAsync=previous;}
});
test('adaptive resolution responds to sustained load, stays under manual caps and does not react to background gaps',()=>{
 // GPU-bound: frame time follows the pixel count, so stepping down helps and continues to the 0.75 floor.
 const a=new AdaptiveResolution(1,true);let now=0;for(let i=0;i<3000;i++){const ms=40*a.ratio*a.ratio;now+=ms;a.sample(ms,now);}assert.equal(a.ratio,.75);assert.ok(a.changes>0);const low=a.ratio;for(let i=0;i<20;i++)a.sample(50000,now+=50000,{active:false});assert.equal(a.ratio,low);
 for(let i=0;i<6000;i++){now+=16.7;a.sample(16.7,now);}assert.ok(a.ratio>.75&&a.ratio<=1);a.configure(.75,false);for(let i=0;i<2000;i++)a.sample(100,now+=100);assert.equal(a.ratio,.75);
});
test('adaptive resolution keeps a steady 30 fps sharp and undoes steps that do not speed frames up',()=>{
 const capped=new AdaptiveResolution(1.5,true);let now=0;for(let i=0;i<2000;i++){now+=33.4;capped.sample(33.4,now);}assert.equal(capped.ratio,1.5,'a frame-rate cap is not GPU pressure');assert.ok(capped.changes<=2,'one trial step at most');
 const cpu=new AdaptiveResolution(1.5,true);now=0;for(let i=0;i<4000;i++){const ms=24+(i%10);now+=ms;cpu.sample(ms,now);}
 assert.equal(cpu.ratio,1.5,'a step that did not help is undone');assert.equal(cpu.floor,1.5,'and becomes the floor');assert.ok(cpu.changes<=2);
});
function lifecycleWorld(){const canvas=new EventTarget(),doc=new EventTarget(),win=new EventTarget(),world={renderer:{domElement:canvas,state:{reset(){}}},scene:new T.Group(),post:{dispose(){}},nav:{stop(){},invincible:0},keys:new Set(['w']),input:{x:1,z:0},clock:{getDelta(){return 50;}},setInput(x,z){this.input={x,z};},resize(){}};doc.hidden=false;return{canvas,doc,win,world};}
test('background and BFCache recovery clear input, preserve task progress and require an explicit safe resume',()=>{
 const f=lifecycleWorld(),accepted={pairs:[1,2],level:4,coins:16},before=JSON.stringify(accepted),l=new RuntimeLifecycle(f.world,{doc:f.doc,win:f.win});f.doc.hidden=true;f.doc.dispatchEvent(new Event('visibilitychange'));assert.equal(f.world.runtimePaused,true);assert.equal(f.world.keys.size,0);assert.deepEqual(f.world.input,{x:0,z:0});f.doc.hidden=false;f.doc.dispatchEvent(new Event('visibilitychange'));assert.equal(f.world.runtimePaused,true);assert.ok(l.resume());assert.equal(f.world.runtimePaused,false);assert.equal(f.world.nav.invincible,1);assert.equal(JSON.stringify(accepted),before);f.win.dispatchEvent(new Event('pagehide'));assert.ok(f.world.runtimePaused);l.dispose();assert.equal(l.listeners.length,0);
});
test('graphics loss is cancelled, pauses simulation and cannot resume until restoration; accepted work remains untouched',()=>{
 const f=lifecycleWorld(),states=[],l=new RuntimeLifecycle(f.world,{doc:f.doc,win:f.win,notify:state=>states.push(state)}),event=new Event('webglcontextlost',{cancelable:true});assert.equal(f.canvas.dispatchEvent(event),false);assert.equal(event.defaultPrevented,true);assert.equal(l.resume(),false);assert.equal(f.world.runtimePaused,true);f.canvas.dispatchEvent(new Event('webglcontextrestored'));assert.equal(l.contextLost,false);assert.equal(f.world.runtimePaused,true);assert.ok(l.resume());assert.equal(l.snapshot().contextLosses,1);assert.equal(l.snapshot().contextRestores,1);assert.deepEqual(states,['graphics','restored','running']);l.dispose();
});
test('the actual frame loop performs no simulation, scene updates or rendering while lifecycle is paused',()=>{
 const oldDocument=globalThis.document,oldRAF=globalThis.requestAnimationFrame;let frames=0;globalThis.document={hidden:false};globalThis.requestAnimationFrame=()=>1;
 try{const world={runtimePaused:true,clock:{getDelta:()=>50},renderer:{info:{reset(){throw Error('rendered while paused');}}},onFrame(){frames++;}};World.prototype.animate.call(world);assert.equal(frames,0);assert.equal(world.metricsWasHidden,true);}finally{globalThis.document=oldDocument;globalThis.requestAnimationFrame=oldRAF;}
});
test('startup measurements retain actual browser transfer sizes and exclude the later next-form prefetch',()=>{
 const entries=[{name:'https://game/index.html',startTime:0,transferSize:600,encodedBodySize:300,decodedBodySize:500,duration:10},{name:'https://game/creature.glb',startTime:50,transferSize:1300,encodedBodySize:1000,decodedBodySize:1000,duration:50},{name:'https://game/next.glb',startTime:1200,transferSize:2300,encodedBodySize:2000,decodedBodySize:2000,duration:30}];const p=new PerformanceMonitor({now:()=>1000,getEntriesByType:type=>type==='resource'?entries:[],setResourceTimingBufferSize(){}});p.markReady();const s=p.startup();assert.equal(s.requestCount,2);assert.equal(s.transferBytes,1900);assert.equal(s.encodedBodyBytes,1300);assert.equal(s.largest[0].path,'/creature.glb');
});
test('resource samples have bounded history, retain peaks and report estimates separately from renderer object counts',()=>{
 const p=new PerformanceMonitor(),form=skinnedForm(),world={scene:form.model,renderer:{info:{memory:{textures:4,geometries:7},render:{calls:120,triangles:5000},programs:[1,2]}}};for(let i=0;i<200;i++)p.sample(world,i*5000);assert.equal(p.samples.length,180);assert.equal(p.peak.drawCalls,120);assert.equal(p.samples[0].textures,4);assert.ok(p.samples[0].estimatedSceneTextureBytes>0);assert.equal(estimatedTextureBytes({image:{width:1024,height:1024},generateMipmaps:false}),4194304);disposeResources(form.model);
});
test('switching from full effects to Low releases existing postprocessing targets immediately',()=>{
 const renderer={getDrawingBufferSize:v=>v.set(390,844),setPixelRatio(){},shadowMap:{}},post=new PostFX(renderer);post.enabled=true;post.allocate();const target=post.main;let disposed=0;target.addEventListener('dispose',()=>disposed++);const world={renderer,post,resize(){}};applyGraphics(world,{preset:'low'});assert.equal(post.main,null);assert.equal(disposed,1);assert.equal(post.enabled,false);post.destroy();
});
test('voice cancellation during asynchronous decoding never starts stale speech',async()=>{
 const voice=new Voice();let finish,started=0;voice.context={state:'running',currentTime:0};voice.manifest={words:{hello:'hello.mp3'}};voice.buffer=()=>new Promise(resolve=>finish=resolve);voice.context.createGain=()=>({gain:{},connect(){}});voice.context.createBufferSource=()=>({playbackRate:{},connect(){},start(){started++;}});const saying=voice.say('hello');await Promise.resolve();voice.stop();finish({duration:1});await saying;assert.equal(started,0);
});

test('decoded voice and music caches remain bounded through repeated distinct clips',async()=>{
 const previous=globalThis.fetch;globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(4)});const context={state:'running',decodeAudioData(_data,ok){ok({duration:1});}};
 try{const voice=new Voice();voice.attach(context);for(let i=0;i<70;i++)await voice.buffer(`word-${i}.mp3`);assert.equal(voice.buffers.size,32);assert.equal(voice.buffers.has('word-0.mp3'),false);const music=new MusicPlayer({paths:{music:'assets/music/'}});music.context=context;for(let i=0;i<18;i++)await music.buffer(`track-${i}.mp3`);assert.equal(music.buffers.size,4);assert.equal(music.buffers.has('track-0.mp3'),false);}finally{globalThis.fetch=previous;}
});
