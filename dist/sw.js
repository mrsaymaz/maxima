// Maxima offline support. The app shell (code, styles, fonts, icons, lesson catalogue) is cached on install;
// lessons, creatures, pictures, voice and music are cached the first time they are used, so a lesson that was
// played once still opens on weak or no school Wi-Fi. Code is fetched network-first so updates arrive promptly;
// media is served from the cache at once and refreshed in the background (the HTTP cache keeps that cheap), so
// replaced art reaches players on their next visit. SHELL_HASH changes with every build.
const SHELL_HASH='32c4be5dcdf0';
const SHELL=`maxima-shell-${SHELL_HASH}`,MEDIA='maxima-media-v1',DATA='maxima-data-v1';
const MEDIA_EXT=/\.(glb|gltf|bin|mp3|ogg|m4a|wav|webp|png|jpe?g|svg|woff2?|ktx2)$/i;

self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(SHELL),list=await fetch('offline-shell.json',{cache:'no-store'}).then(r=>r.json());
  await cache.addAll(list.files.map(f=>new Request(f,{cache:'reload'})));
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  for(const key of await caches.keys())if(key.startsWith('maxima-shell-')&&key!==SHELL)await caches.delete(key);
  await self.clients.claim();
 })());
});

async function networkFirst(request,cacheName,timeout=4500){
 const cache=await caches.open(cacheName);
 try{
  const response=await Promise.race([fetch(request),new Promise((_,fail)=>setTimeout(()=>fail(new Error('slow network')),timeout))]);
  if(response.ok&&response.type==='basic')cache.put(request,response.clone());
  return response;
 }catch(error){
  const cached=await cache.match(request,{ignoreSearch:request.mode==='navigate'})||await caches.match(request,{ignoreSearch:request.mode==='navigate'});
  if(cached)return cached;throw error;
 }
}
async function cachedThenRefresh(event,request,cacheName){
 const cached=await caches.match(request);
 const refresh=fetch(request).then(async response=>{
  if(response.ok&&response.status===200&&response.type==='basic')await (await caches.open(cacheName)).put(request,response.clone());
  return response;
 });
 if(!cached)return refresh;
 event.waitUntil(refresh.catch(()=>{}));return cached;
}

function bucket(url){return MEDIA_EXT.test(url.pathname)?MEDIA:url.pathname.includes('/data/')?DATA:SHELL;}
// The page lists what it loaded before this worker controlled it (see app-shell.js); cache anything missing.
self.addEventListener('message',event=>{
 if(event.data?.type!=='warm'||!Array.isArray(event.data.urls))return;
 event.waitUntil(Promise.all(event.data.urls.slice(0,400).map(async href=>{
  const url=new URL(href,self.location.href);if(url.origin!==self.location.origin||await caches.match(url.href))return;
  try{const response=await fetch(url.href);if(response.ok&&response.status===200)await (await caches.open(bucket(url))).put(url.href,response);}catch{}
 })));
});

self.addEventListener('fetch',event=>{
 const request=event.request;if(request.method!=='GET')return;
 const url=new URL(request.url);if(url.origin!==self.location.origin)return;
 // Partial (Range) requests come from media elements; let the network handle them directly.
 if(request.headers.has('range'))return;
 if(request.mode==='navigate'){event.respondWith(networkFirst(request,SHELL).catch(()=>caches.match('index.html')));return;}
 const cacheName=bucket(url);
 event.respondWith(cacheName===MEDIA?cachedThenRefresh(event,request,MEDIA):networkFirst(request,cacheName));
});
