// Mr. Saymaz's English League (the tally system): finishing an area by winning its guardian fight adds Ulti points to
// the student's (grade, team) pool in the League's Battle Arena. The League decides every point value, how long
// points last and the daily limits; the game only says which win it claims and never sends a points value or holds a
// secret. Same protocol as Wordramp (its league.js), under the League id 'solmaxima'. An empty ultiApi switches it off.
export const LEAGUE_GAME='solmaxima';
export const LEAGUE_URL='https://mrsaymaz.netlify.app/api/ulti';
export const LEAGUE_TEAMS=Object.freeze(['gryffindor','hufflepuff','slytherin','ravenclaw']);
// Drawing defaults before the League has ever answered. Point values are never invented.
export const LEAGUE_FALLBACK=Object.freeze({capacity:100,maxStrength:2,hours:168});
const STORE='solmaxima-league.v1',TICKET_MS=48*3600000,OUTBOX_MS=47*3600000;

// config.js sets window.SOLMAXIMA_CONFIG = { ultiApi }. A missing config (tests, a bare copy) means off.
export function leagueApi(config){return config&&typeof config.ultiApi==='string'?config.ultiApi.trim():'';}
export function livePoints(entries,hours,now=Date.now()){
 const after=now-hours*3600000;
 return (Array.isArray(entries)?entries:[]).reduce((n,[minute,points])=>minute*60000>after&&Number.isFinite(points)?n+points:n,0);
}
export function strength(points,capacity,maxStrength){if(!(capacity>0))return 1;return 1+(maxStrength-1)*Math.sqrt(Math.min(Math.max(points,0),capacity)/capacity);}
// This game's League settings, or null while the League has not switched solMaxima on.
export function gameSettings(settings){const game=settings?.games?.[LEAGUE_GAME];return settings&&settings.enabled!==false&&game&&game.enabled!==false?game:null;}
export function hoursLabel(hours){return hours%24===0?`${hours/24} day${hours===24?'':'s'}`:`${hours} hours`;}
// The Ulti an arena win would bring, from the League's settings (null when unknown).
export function arenaPoints(settings,pace,arena){const v=gameSettings(settings)?.points?.[pace==='challenge'?'challenge':'relaxed']?.[arena];return Number.isFinite(v)?v:null;}

function randomId(length=24){const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',bytes=new Uint8Array(length);if(globalThis.crypto?.getRandomValues)globalThis.crypto.getRandomValues(bytes);else for(let i=0;i<length;i++)bytes[i]=Math.floor(Math.random()*256);return Array.from(bytes,b=>chars[b%chars.length]).join('');}

export function createLeague({api='',storage=globalThis.localStorage,fetchImpl=globalThis.fetch?.bind(globalThis),now=()=>Date.now(),timeoutMs=8000}={}){
 const enabled=!!api&&!!fetchImpl;let memory={};
 const load=()=>{try{const raw=storage?.getItem(STORE);if(raw){const data=JSON.parse(raw);if(data&&typeof data==='object')return data;}}catch{}return memory;};
 const save=data=>{memory=data;try{storage?.setItem(STORE,JSON.stringify(data));}catch{}};
 const state=()=>{const s=load();s.pools||={};s.outbox||=[];s.tickets||={};return s;};
 function device(){const s=state();if(typeof s.device!=='string'||!/^[A-Za-z0-9_-]{8,64}$/.test(s.device)){s.device=randomId();save(s);}return s.device;}
 // ok: 2xx with status 'success'. refused: 4xx or a non-retryable failure. retry: network error, timeout, 5xx or retry:true.
 async function request(body){
  if(!enabled)return{kind:'off'};
  const controller=typeof AbortController==='function'?new AbortController():null,timer=controller?setTimeout(()=>controller.abort(),timeoutMs):null;
  try{const res=await fetchImpl(api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:controller?.signal});let data=null;try{data=await res.json();}catch{}
   if(res.status>=500||data?.retry===true)return{kind:'retry',status:res.status,data};if(res.ok&&data?.status==='success')return{kind:'ok',data};return{kind:'refused',status:res.status,data};}
  catch{return{kind:'retry'};}finally{if(timer)clearTimeout(timer);}
 }
 function remember(data){const s=state();if(data?.settings&&typeof data.settings==='object')s.settings=data.settings;if(data?.pools&&typeof data.pools==='object')for(const[grade,pool]of Object.entries(data.pools))s.pools[grade]={at:now(),pool};save(s);}
 // Last known settings and this grade's pools, with live totals and strengths.
 function snapshot(grade){const s=state(),settings=s.settings||null,base={...LEAGUE_FALLBACK,...(settings||{})},pool=s.pools[grade]?.pool||{},t=now();
  const teams=LEAGUE_TEAMS.map(id=>{const points=livePoints(pool[id]?.entries,base.hours,t);return{id,points,players:pool[id]?.players||0,strength:strength(points,base.capacity,base.maxStrength)};});
  return{enabled,known:!!settings,settings,game:gameSettings(settings),capacity:base.capacity,hours:base.hours,teams,updatedAt:s.pools[grade]?.at||null};}
 async function refresh(grade){if(!enabled)return snapshot(grade);const reply=await request({action:'pools',grade});if(reply.kind==='ok')remember(reply.data);return{...snapshot(grade),online:reply.kind==='ok'};}
 function forgetOld(s){const t=now();for(const[runId,entry]of Object.entries(s.tickets))if(!entry||t-entry.at>TICKET_MS)delete s.tickets[runId];s.outbox=s.outbox.filter(item=>item&&t-item.at<=OUTBOX_MS);}
 // A ticket when an area begins, kept under the area's run id so a paused or reloaded game can still claim. null offline.
 async function start({runId,grade,team,arena,pace,unit=''}){
  if(!enabled)return null;const existing=state().tickets[runId];if(existing)return existing.ticket;
  const reply=await request({action:'start',game:LEAGUE_GAME,grade,team,arena,pace,unit:String(unit).replace(/[^A-Za-z0-9_-]/g,'').slice(0,24),device:device()});
  if(reply.kind!=='ok'||typeof reply.data.ticket!=='string')return null;const s=state();forgetOld(s);s.tickets[runId]={ticket:reply.data.ticket,at:now(),grade,team};save(s);return reply.data.ticket;}
 const ticketFor=runId=>state().tickets[runId]?.ticket||null;
 const ticketAge=runId=>{const e=state().tickets[runId];return e?now()-e.at:null;};
 // A long area (played over days) swaps an ageing ticket for a fresh one before it can expire.
 async function renew(info){if(!enabled)return null;const s=state();delete s.tickets[info.runId];save(s);return start(info);}
 async function send(ticket){const reply=await request({action:'claim',ticket,device:device()});
  if(reply.kind==='ok'){remember(reply.data);const d=reply.data;return{state:'counted',points:d.points||0,requested:d.requested,deviceWins:d.deviceWins,reason:d.reason||null,duplicate:!!d.duplicate};}
  if(reply.kind==='refused')return{state:'refused',reason:reply.data?.reason||'refused'};return{state:'retry'};}
 // Claim only after a real win. A network or server failure queues the ticket; a refusal is final.
 async function claim(runId){if(!enabled)return{state:'off'};const s=state(),entry=s.tickets[runId];if(!entry)return{state:'no-ticket'};delete s.tickets[runId];save(s);
  const result=await send(entry.ticket);if(result.state==='retry'){const q=state();q.outbox.push({ticket:entry.ticket,at:entry.at,grade:entry.grade,team:entry.team});forgetOld(q);save(q);return{state:'queued'};}return result;}
 // Resend queued wins on launch; items older than 47 hours are dropped.
 async function flush(){if(!enabled)return[];const s=state();forgetOld(s);save(s);const results=[];
  for(const item of s.outbox.slice()){const result=await send(item.ticket);if(result.state!=='retry'){const q=state();q.outbox=q.outbox.filter(x=>x.ticket!==item.ticket);save(q);}results.push({...item,...result});}return results;}
 const outbox=()=>state().outbox.slice();
 return{enabled,device,refresh,snapshot,start,renew,ticketFor,ticketAge,claim,flush,outbox};
}
// What the student reads after a win (same wording as Wordramp, for an area instead of a race).
export function ultiMessage(result,{grade,team}){const name=team.charAt(0).toUpperCase()+team.slice(1);
 if(!result||result.state==='off')return null;
 if(result.state==='counted'){
  if(result.duplicate)return{text:'This win was already counted in the English League.',good:true};
  if(result.points>0)return{text:`+${result.points} Ulti for Grade ${grade} ${name}!${result.reason==='team-limit'?` ${name} reached today's team limit, so this win counted ${result.points} of ${result.requested}.`:''}`,good:true,points:result.points};
  if(result.reason==='device-limit')return{text:"Today's Ulti wins on this device are used. Tomorrow they count again."};
  if(result.reason==='team-limit')return{text:`${name} reached today's Ulti limit for Grade ${grade}. Tomorrow wins count again.`};
  if(result.reason==='off')return{text:'Ulti points are switched off in the English League right now.'};
  return{text:'This win added no Ulti points.'};}
 if(result.state==='queued')return{text:"You're offline. This win will be sent to the English League when you're online."};
 if(result.state==='refused')return{text:result.reason==='too-fast'?'That win was faster than the English League allows, so it did not count.':result.reason==='expired'?"This area's League ticket expired before the win could be sent.":'The English League did not accept this win.'};
 if(result.state==='no-ticket')return{text:'This area could not reach the English League when it started, so its win cannot count.'};
 return null;}
