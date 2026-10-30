import {textureSet,estimatedTextureBytes} from './asset-resources.js';
export class PerformanceMonitor{
 constructor(perf=globalThis.performance){this.perf=perf;this.readyAt=null;this.samples=[];this.peak={textures:0,geometries:0,drawCalls:0,estimatedTextureBytes:0};this.lastSample=-Infinity;perf?.setResourceTimingBufferSize?.(3000);}
 markReady(){this.readyAt=this.perf?.now?.()??0;}
 startup(){
  const p=this.perf;if(!p?.getEntriesByType)return{available:false};
  const all=[...p.getEntriesByType('navigation'),...p.getEntriesByType('resource')];
  const entries=all.filter(e=>(this.readyAt===null||e.startTime<=this.readyAt)&&!String(e.name).startsWith('blob:'));
  return{available:true,readyMs:this.readyAt,requestCount:entries.length,transferBytes:entries.reduce((n,e)=>n+(e.transferSize||0),0),encodedBodyBytes:entries.reduce((n,e)=>n+(e.encodedBodySize||0),0),decodedBodyBytes:entries.reduce((n,e)=>n+(e.decodedBodySize||0),0),zeroTransferCount:entries.filter(e=>!e.transferSize).length,
   largest:entries.slice().sort((a,b)=>(b.encodedBodySize||0)-(a.encodedBodySize||0)).slice(0,10).map(e=>({path:String(e.name).replace(/^https?:\/\/[^/]+/,''),transferBytes:e.transferSize||0,encodedBytes:e.encodedBodySize||0,durationMs:e.duration})),
   limits:'Browser resource timing, including HTML and imports; zero transfer can indicate cache or unavailable size metadata. Source file budgets are separate from wire transfers.'};
 }
 sample(world,now=this.perf?.now?.()??0,{force=false,label='play'}={}){
  if(!force&&now-this.lastSample<5000)return;this.lastSample=now;
  const renderer=world.renderer,mem=renderer?.info?.memory||{},textures=textureSet(world.scene),cached=new Set();
  for(const e of world.formAssets?.entries?.values?.()||[])if(e.value)for(const t of textureSet(e.value.model))cached.add(t);
  const estimated=[...textures].reduce((n,t)=>n+estimatedTextureBytes(t),0),sample={atMs:Math.round(now),label,textures:mem.textures||0,geometries:mem.geometries||0,programs:renderer?.info?.programs?.length||0,drawCalls:renderer?.info?.render?.calls||0,triangles:renderer?.info?.render?.triangles||0,estimatedSceneTextureBytes:estimated,cachedTemplateTextureBytes:[...cached].reduce((n,t)=>n+estimatedTextureBytes(t),0),cache:world.formAssets?.snapshot?.()||null,disposal:{...world.resourceDisposals},resolution:world.adaptiveResolution?.snapshot?.()||null};
  this.peak.textures=Math.max(this.peak.textures,sample.textures);this.peak.geometries=Math.max(this.peak.geometries,sample.geometries);this.peak.drawCalls=Math.max(this.peak.drawCalls,sample.drawCalls);this.peak.estimatedTextureBytes=Math.max(this.peak.estimatedTextureBytes,estimated);this.samples.push(sample);if(this.samples.length>180)this.samples.shift();return sample;
 }
 snapshot(){return{startup:this.startup(),peak:{...this.peak},samples:this.samples.slice(),limits:'Renderer object counts and estimated texture storage; not a GPU memory measurement. Samples are bounded to the most recent 15 minutes at five-second intervals.'};}
}
