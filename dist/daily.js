// Reasons to come back: three daily quests and a gentle streak that never shames a missed day.
import{dayNumber}from'./mastery.js';
export const QUESTS=[
 {id:'run',label:'Finish a run',goal:1,reward:20,icon:'⚑'},
 {id:'correct',label:'Answer 15 items correctly',goal:15,reward:15,icon:'✓'},
 {id:'review',label:'Review 5 words that came back',goal:5,reward:15,icon:'↻'},
 {id:'rival',label:'Defeat 2 rivals',goal:2,reward:15,icon:'✦'},
 {id:'coins',label:'Collect 25 coins on the trail',goal:25,reward:10,icon:'◉'},
 {id:'perfect',label:'Finish 2 tasks without a mistake',goal:2,reward:20,icon:'★'},
 {id:'listen',label:'Complete a listening task',goal:1,reward:15,icon:'♪'},
 {id:'learn',label:'Discover 4 new words',goal:4,reward:15,icon:'❖'},
 {id:'trial',label:'Clear a trail trial',goal:1,reward:15,icon:'⛰'}
];
export const ALL_QUESTS_BONUS=30;
const hash=n=>{let x=Math.imul(n^0x9e3779b9,2654435761)>>>0;x^=x>>>15;x=Math.imul(x,2246822519)>>>0;return(x^(x>>>13))>>>0;};
// Every day offers "Finish a run" plus two others chosen from the date, so classmates share the same quests.
export function questsFor(day){const pool=QUESTS.filter(q=>q.id!=='run'),a=hash(day)%pool.length;let b=hash(day+7919)%(pool.length-1);if(b>=a)b++;return[QUESTS[0],pool[a],pool[b]];}
export function dailyState(save,day=dayNumber()){if(!save.daily||save.daily.day!==day)save.daily={day,quests:questsFor(day).map(q=>({id:q.id,progress:0,done:false})),bonus:false};return save.daily;}
// Advances a quest; completed quests pay coins straight into the wallet. Returns newly completed quests.
export function questProgress(save,id,amount=1,day=dayNumber()){
 const d=dailyState(save,day),done=[];for(const q of d.quests){if(q.id!==id||q.done)continue;const spec=QUESTS.find(x=>x.id===q.id);q.progress=Math.min(spec.goal,q.progress+amount);if(q.progress>=spec.goal){q.done=true;done.push(spec);pay(save,spec.reward);}}
 if(done.length&&!d.bonus&&d.quests.every(q=>q.done)){d.bonus=true;pay(save,ALL_QUESTS_BONUS);done.push({id:'bonus',label:'All daily quests',reward:ALL_QUESTS_BONUS,icon:'✧'});}
 return done;
}
function pay(save,n){if(!save.wallet)return;save.wallet.balance+=n;save.wallet.total+=n;}

// Gentle streak: one rest day between play days keeps the streak going; a longer break quietly starts a new one.
export function markPlayed(save,day=dayNumber()){const s=save.streak??={days:[],total:0,best:0};if(s.days.includes(day))return{first:false,...streakInfo(save,day)};const gap=s.days.length?day-Math.max(...s.days):null;s.days.push(day);s.days=s.days.sort((a,b)=>a-b).slice(-30);s.total++;const info=streakInfo(save,day);s.best=Math.max(s.best,info.streak);return{first:true,gap,...info};}
export function streakInfo(save,today=dayNumber()){const days=[...new Set(save.streak?.days||[])].sort((a,b)=>b-a);let streak=0,prev=null;for(const d of days){if(d>today)continue;if(prev===null){if(today-d>2)break;streak=1;prev=d;continue;}if(prev-d<=2){streak++;prev=d;}else break;}const week=Array.from({length:7},(_,i)=>days.includes(today-6+i));return{streak,week,total:save.streak?.total||0,best:save.streak?.best||0,playedToday:days.includes(today)};}
export function welcomeLine(info,gap){if(gap===null||gap===undefined)return'Your first day on the trail!';if(gap<=1)return info.streak>1?`${info.streak} trail days in a row. Lovely to see you!`:'Welcome back to the trail!';if(gap===2)return'A rest day is part of the journey. Your streak is safe.';return'Welcome back! Your creature kept the campfire warm.';}
export function validDaily(save){const d=save.daily,s=save.streak;if(d!==undefined&&(!d||!Number.isInteger(d.day)||!Array.isArray(d.quests)||d.quests.length>5||d.quests.some(q=>!QUESTS.some(x=>x.id===q.id)||!Number.isInteger(q.progress)||q.progress<0)))return false;if(s!==undefined&&(!s||!Array.isArray(s.days)||s.days.length>40||s.days.some(x=>!Number.isInteger(x))||!Number.isInteger(s.total)||s.total<0))return false;return true;}
