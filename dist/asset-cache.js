import * as T from './vendor/three.module.min.js';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {cloneForm,attachLease,disposeResources} from './asset-resources.js';
export class AssetCache{
 constructor({load,clone=x=>x,dispose=()=>{},limit=2}){this.load=load;this.clone=clone;this.disposedTemplates=0;this.releases=0;this.dispose=value=>{this.disposedTemplates++;dispose(value);};this.limit=limit;this.entries=new Map();this.serial=0;this.hits=0;this.misses=0;this.evictions=0;this.closed=false;}
 ensure(key){
  if(this.closed)throw Error('Asset cache closed');let e=this.entries.get(key);
  if(e){this.hits++;e.used=++this.serial;return e;}
  this.misses++;e={key,refs:0,used:++this.serial,controller:new AbortController(),value:null};this.entries.set(key,e);
  e.promise=Promise.resolve().then(()=>this.load(key,{signal:e.controller.signal})).then(value=>{if(this.closed||this.entries.get(key)!==e){this.dispose(value);throw new DOMException('Loading cancelled','AbortError');}e.value=value;return value;}).catch(error=>{if(this.entries.get(key)===e)this.entries.delete(key);throw error;});return e;
 }
 async acquire(key){const e=this.ensure(key);e.refs++;try{const value=await e.promise;const instance=this.clone(value);let released=false;const release=()=>{if(released)return;released=true;this.releases++;e.refs--;if(this.closed&&e.refs===0&&e.value){this.dispose(e.value);e.value=null;this.entries.delete(e.key);}this.trim();};this.trim();return{value:instance,release};}catch(error){e.refs--;this.trim();throw error;}}
 async prefetch(key){const e=this.ensure(key);try{await e.promise;}finally{this.trim();}}
 cancelIdleLoads(except){for(const[key,e]of this.entries)if(!e.refs&&!e.value&&!(typeof except==='function'?except(key):key===except)){this.entries.delete(key);e.controller.abort();}}
 trim(){while(this.entries.size>this.limit){const idle=[...this.entries.values()].filter(e=>!e.refs&&e.value).sort((a,b)=>a.used-b.used)[0];if(!idle)break;this.entries.delete(idle.key);this.dispose(idle.value);idle.value=null;this.evictions++;}}
 clear(){for(const[key,e]of this.entries)if(!e.refs){this.entries.delete(key);e.controller.abort();if(e.value)this.dispose(e.value);e.value=null;}}
 close(){this.closed=true;this.clear();for(const e of this.entries.values())e.controller.abort();}
 snapshot(){return{templates:this.entries.size,activeLeases:[...this.entries.values()].reduce((n,e)=>n+e.refs,0),disposedTemplates:this.disposedTemplates,releasedInstances:this.releases,loading:[...this.entries.values()].filter(e=>!e.value).length,hits:this.hits,misses:this.misses,evictions:this.evictions,limit:this.limit};}
}
export const formKey=(partner,level)=>JSON.stringify([partner,level]);
export function createFormCache(load){return new AssetCache({load:(key,options)=>{const[partner,level]=JSON.parse(key);return load(level,partner,options);},clone:cloneForm,dispose:form=>disposeResources(form.model,{closeImages:true}),limit:2});}
export async function acquireForm(cache,key){const lease=await cache.acquire(key);return attachLease(lease.value,lease.release);}
export async function loadGLTF(url,{signal,timeout=20000,retries=1}={}){
 for(let attempt=0;;attempt++){
  if(signal?.aborted)throw new DOMException('Loading cancelled','AbortError');
  const manager=new T.LoadingManager();let settled=false,timer,abort;
  try{return await new Promise((resolve,reject)=>{
   const finish=(error,value)=>{if(settled){if(value)disposeResources(value.scene,{closeImages:true});return;}settled=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);error?reject(error):resolve(value);};
   abort=()=>{manager.abort();finish(new DOMException('Loading cancelled','AbortError'));};signal?.addEventListener('abort',abort,{once:true});
   timer=setTimeout(()=>{manager.abort();const error=new Error('Creature loading timed out. Please retry.');error.transient=true;finish(error);},timeout);
   new GLTFLoader(manager).loadAsync(url).then(value=>finish(null,value),error=>finish(error));
  });}catch(error){if(signal?.aborted||attempt>=retries||error.response?.status===404)throw error;}
  finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
 }
}
