// Bounded foreground fetches. Abort is never retried; transient failures retry once.
export async function fetchResource(url,{signal,timeout=18000,retries=1,fetcher=globalThis.fetch,priority='high'}={}){
 for(let attempt=0;;attempt++){
  const controller=new AbortController();let timedOut=false;
  const abort=()=>controller.abort(signal?.reason);signal?.addEventListener('abort',abort,{once:true});
  if(signal?.aborted)abort();
  const timer=setTimeout(()=>{timedOut=true;controller.abort();},timeout);
  try{
   const response=await fetcher(url,{signal:controller.signal,priority});
   if(!response.ok){const error=new Error(`Could not load ${url} (${response.status})`);error.status=response.status;throw error;}
   // Consume the body inside the deadline, including a response which stalls mid-transfer.
   const data=typeof response.arrayBuffer==='function'?await response.arrayBuffer():new TextEncoder().encode(JSON.stringify(await response.json())).buffer;return data;
  }catch(error){
   if(signal?.aborted)throw signal.reason||new DOMException('Loading cancelled','AbortError');
   const transient=timedOut||error.name==='TypeError'||error.name==='AbortError'||error.status>=500||[408,429].includes(error.status);
   if(attempt>=retries||!transient)throw error;
  }finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
 }
}
export async function fetchJSON(url,options={}){
 return JSON.parse(new TextDecoder().decode(await fetchResource(url,options)));
}
export class LessonLibrary{
 constructor(units,{load=id=>fetchJSON(`data/lessons/${id}.json`),limit=3}={}){
  this.units=units;this.metadata=new Map(units.map(u=>[u.id,Object.fromEntries(Object.entries(u).filter(([,v])=>!Array.isArray(v)))]));
  this.loadUnit=load;this.limit=limit;this.loaded=new Map();this.pending=new Map();this.selected=null;
 }
 async select(id){
  if(!this.metadata.has(id))throw Error('Unknown lesson');
  let u=this.loaded.get(id)||this.units.find(u=>u.id===id&&u.vocabulary?.length);
  if(!u){
   if(!this.pending.has(id))this.pending.set(id,Promise.resolve().then(()=>this.loadUnit(id)).finally(()=>this.pending.delete(id)));
   u=await this.pending.get(id);if(u.id!==id||!u.vocabulary?.length||!u.questions?.length)throw Error('Lesson data is incomplete');
  }
  this.units[this.units.findIndex(x=>x.id===id)]=u;this.loaded.delete(id);this.loaded.set(id,u);this.selected=id;
  while(this.loaded.size>this.limit){const old=this.loaded.keys().next().value;this.loaded.delete(old);this.units[this.units.findIndex(x=>x.id===old)]={...this.metadata.get(old)};}
  return u;
 }
}
