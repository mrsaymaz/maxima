export const TYPES=['match','sentence','qa'];
export const AREAS=[
 {name:'Whisperwood',subtitle:'THE WOODLAND AWAKENS',colour:'#9de2bc',levels:'Forms 0–4',story:'A spring has fallen silent. Bring the valley back to life as your creature.',guardian:'Mossback Warden'},
 {name:'Skyreach',subtitle:'THE WINDS ABOVE',colour:'#c6d8ef',levels:'Forms 4–8',story:'Follow the rising wind. Restore the sky bridges and awaken the highland beacons.',guardian:'Galecrest Warden'},
 {name:'Stormglass',subtitle:'THE LAST ELEMENTAL GATE',colour:'#c5b8ed',levels:'Forms 8–10',story:'Beyond the violet mist, an ancient guardian protects the heart of the sanctuary.',guardian:'Stormglass Sentinel'}
];
export const STORAGE='maxima.save.v1';
export function freshJourney(){return {level:0,sets:{match:0,sentence:0,qa:0},guardians:[],completed:false,seen:{},stats:{correct:0,mistakes:0,hints:0},active:null,pending:{},history:[],runs:0};}
export function freshSave(){return {version:1,selected:'g5u1',grade:5,mode:'relaxed',cameraMode:'follow',area:0,nickname:'Hufflepuff',journeys:{},muted:true,tutorial:false};}
export function required(j){return j.level+1;}
export function totalSets(j){return TYPES.reduce((n,k)=>n+Math.min(j.sets[k],required(j)),0);}
export function maxSets(j){return required(j)*3;}
export function ready(j){return TYPES.every(k=>j.sets[k]>=required(j));}
export function unlocked(j){return j.guardians.includes(1)?2:j.guardians.includes(0)?1:0;}
export function gate(j){return j.level===2||j.level===5||j.level===10;}
export function guardianReady(j){return !j.completed&&gate(j)&&ready(j)&&!j.guardians.includes(j.level===2?0:j.level===5?1:2);}
export function nextLevel(j){if(j.level>=10)return false;j.level++;j.sets={match:0,sentence:0,qa:0};j.active=null;j.pending={};return true;}
export function recordSet(j,type){if(j.completed||!TYPES.includes(type)||j.sets[type]>=required(j))return {changed:false};j.sets[type]++;j.active=null;if(ready(j)&&!gate(j)){nextLevel(j);return {changed:true,evolved:true};}return {changed:true,evolved:false,guardian:guardianReady(j)};}
export function winGuardian(j){if(!guardianReady(j))return false;const area=j.level===2?0:j.level===5?1:2;j.guardians.push(area);j.active=null;if(j.level===10){j.completed=true;j.history.push({completedAt:new Date().toISOString(),mistakes:j.stats.mistakes,correct:j.stats.correct});}else nextLevel(j);return true;}
export function restart(j){const history=j.history.slice();if(!j.completed)history.push({level:j.level,archivedAt:new Date().toISOString()});return {...freshJourney(),history,runs:j.runs+1};}
export function shuffle(items,rng=Math.random){const a=items.slice();for(let i=a.length-1;i>0;i--){let k=Math.floor(rng()*(i+1));[a[i],a[k]]=[a[k],a[i]];}return a;}
export function choose(items,count,seen={}){let pool=shuffle(items).sort((a,b)=>(seen[a.id]||0)-(seen[b.id]||0));return pool.slice(0,count);}
export function markSeen(j,items){for(const x of items)j.seen[x.id]=(j.seen[x.id]||0)+1;}
export function validSave(s,units){if(!s||s.version!==1||!s.journeys||typeof s.journeys!=='object')return false;const ids=new Set(units.map(x=>x.id));if(!ids.has(s.selected)||!['relaxed','challenge'].includes(s.mode))return false;if(s.cameraMode!==undefined&&!['creature','follow'].includes(s.cameraMode))return false;if(typeof s.nickname!=='string'||s.nickname.length>30)return false;for(const [id,j] of Object.entries(s.journeys)){if(!ids.has(id)||!j||!Number.isInteger(j.level)||j.level<0||j.level>10||!j.sets||!TYPES.every(t=>Number.isInteger(j.sets[t])&&j.sets[t]>=0&&j.sets[t]<=j.level+1)||!Array.isArray(j.guardians)||j.guardians.some(a=>![0,1,2].includes(a))||!j.stats||!Array.isArray(j.history)||!j.seen||typeof j.completed!=='boolean')return false; if(j.guardians.includes(1)&&!j.guardians.includes(0))return false;if(j.level>=3&&!j.guardians.includes(0)||j.level>=6&&!j.guardians.includes(1)||j.completed&&(!j.guardians.includes(2)||j.level!==10))return false;}return true;}
