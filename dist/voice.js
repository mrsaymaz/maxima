// Pre-recorded English voice for listening tasks. Every learner hears the same clear pronunciation,
// whatever their device. Clips were generated offline (see scripts/build-voice.py); the browser voice
// is used only if a clip is missing or audio cannot start.
const normal=t=>String(t??'').trim().toLowerCase().replace(/[.!?]+$/,'').replace(/\s+/g,' ');
export function requestWords(text){const m=/^please bring (.+?)\.?$/i.exec(String(text).trim());if(!m)return null;return m[1].split(/,\s*|\s+and\s+/).map(s=>s.trim()).filter(Boolean);}
export class Voice{
 constructor(base='assets/voice/'){this.base=base;this.manifest=null;this.buffers=new Map();this.context=null;this.current=[];this.loading=null;}
 async load(fetcher=fetch){if(this.manifest)return this.manifest;this.loading??=fetcher(this.base+'manifest.json').then(r=>r.ok?r.json():null).catch(()=>null);this.manifest=await this.loading;return this.manifest;}
 file(text){return this.manifest?.words?.[normal(text)]||null;}
 canSay(text){const words=requestWords(text);return words?words.every(w=>this.file(w))&&!!this.manifest?.fragments?.please:!!this.file(text);}
 attach(context){this.context=context;}
 ensureContext(){if(!this.context){const C=globalThis.AudioContext||globalThis.webkitAudioContext;if(!C)return null;this.context=new C();}if(this.context.state==='suspended')this.context.resume?.().catch?.(()=>{});return this.context;}
 async buffer(file){if(this.buffers.has(file))return this.buffers.get(file);const ctx=this.ensureContext();const p=fetch(this.base+file).then(r=>{if(!r.ok)throw Error('voice clip missing');return r.arrayBuffer();}).then(data=>new Promise((ok,fail)=>ctx.decodeAudioData(data,ok,fail)));this.buffers.set(file,p);p.catch(()=>this.buffers.delete(file));return p;}
 // Warm the clips a task will need so the first tap plays instantly.
 prefetch(texts){if(!this.manifest||!this.context)return;for(const t of texts){const words=requestWords(t)||[t];for(const w of words){const f=this.file(w);if(f)this.buffer(f).catch(()=>{});}}}
 stop(){for(const s of this.current)try{s.stop();}catch{}this.current=[];}
 // Plays a word, or a "Please bring … and …" request assembled from recorded parts. Resolves when finished.
 async say(text,{rate=1,onend}={}){
  await this.load();const words=requestWords(text),parts=words?[this.manifest?.fragments?.please,...words.flatMap((w,i)=>i===words.length-1&&i>0?[this.manifest?.fragments?.and,this.file(w)]:[this.file(w)])]:[this.file(text)];
  if(!parts.length||parts.some(p=>!p))return false;const ctx=this.ensureContext();if(!ctx)return false;this.stop();
  const buffers=await Promise.all(parts.map(p=>this.buffer(p)));let at=ctx.currentTime+.05;const gain=ctx.createGain();gain.gain.value=1;gain.connect(ctx.destination);
  this.current=buffers.map((b,i)=>{const s=ctx.createBufferSource();s.buffer=b;s.playbackRate.value=rate;s.connect(gain);s.start(at);at+=b.duration/rate+(i===0&&words?.length?.12:.08);return s;});
  const last=this.current.at(-1);return new Promise(resolve=>{last.onended=()=>{gain.disconnect();onend?.();resolve(true);};});
 }
}
