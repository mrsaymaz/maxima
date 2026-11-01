import{FORM_HEIGHTS}from'./world-layout.js';
const clamp=x=>Math.max(0,Math.min(1,x));export const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
export const EVOLUTION_DURATION=13;
// The Elemental Chrysalis (0.62): call, gather, chrysalis, burst, reveal (evolution-chrysalis.js). The forms swap inside
// the burst's light; each element keeps its own pace, lift and camera arc.
// Each creature evolves against a backdrop that contrasts with its element: Hufflepuff (air) on blue, Gryffindor (fire)
// on green, Slytherin (nature) on scarlet and Ravenclaw (water) on gold.
const BASE_SCORES={
 air:{sparkEnd:0.738,gatherEnd:2.215,transform:4.308,swap:4.505,veilIn:4.062,veilPeak:4.431,veilOut:4.738,veilEnd:5.169,clear:5.908,orbitStart:0.554,orbitEnd:5.538,lift:.44,startYaw:Math.PI,endYaw:Math.PI*2+.22,pitch:-.035,roll:.035,background:'#1d5d9c',floor:'#123f6e',sky:{top:'#7cc8f5',horizon:'#174b86',glow:'#d9f1ff'},name:'Spiral Ascension'},
 fire:{sparkEnd:0.646,gatherEnd:2.123,transform:4.215,swap:4.412,veilIn:3.969,veilPeak:4.338,veilOut:4.646,veilEnd:5.077,clear:5.815,orbitStart:0.508,orbitEnd:5.446,lift:.08,startYaw:Math.PI-.25,endYaw:.18,pitch:.04,roll:0,background:'#1d7a52',floor:'#145a3c',sky:{top:'#7fdcaa',horizon:'#0f4a33',glow:'#e1ffd9'},name:'Ember Ignition'},
 nature:{sparkEnd:0.831,gatherEnd:2.308,transform:4.4,swap:4.597,veilIn:4.154,veilPeak:4.523,veilOut:4.831,veilEnd:5.262,clear:6.0,orbitStart:0.6,orbitEnd:5.631,lift:0,startYaw:Math.PI+.12,endYaw:.28,pitch:.012,roll:.008,background:'#9c1f2e',floor:'#6d1424',sky:{top:'#ff7a6e',horizon:'#5c0d1b',glow:'#ffe0d0'},name:'Verdant Awakening'},
 water:{sparkEnd:0.788,gatherEnd:2.265,transform:4.357,swap:4.554,veilIn:4.111,veilPeak:4.48,veilOut:4.788,veilEnd:5.218,clear:5.957,orbitStart:0.578,orbitEnd:5.588,lift:.20,startYaw:Math.PI+.2,endYaw:.16,pitch:-.018,roll:-.02,background:'#b47820',floor:'#7a4c12',sky:{top:'#ffd877',horizon:'#7a4a10',glow:'#fff4cf'},name:'Tidal Emergence'}
};
const TIMED=['sparkEnd','gatherEnd','transform','swap','veilIn','veilPeak','veilOut','veilEnd','clear','orbitStart','orbitEnd'];
export const EVOLUTION_SCORES=Object.fromEntries(Object.entries(BASE_SCORES).map(([element,p])=>[element,{...p,...Object.fromEntries(TIMED.map(k=>[k,p[k]*EVOLUTION_DURATION/8])),endYaw:Math.PI*4+(element==='nature'?.28:element==='air'?.22:.18)}]));
export const evolutionElement=value=>{const s=String(value||'air').toLowerCase();return Object.hasOwn(EVOLUTION_SCORES,s)?s:'air';};
export function evolutionFrame(time,from,to,{reduced=false,aspect=1,element='air'}={}){
 const e=evolutionElement(element),p=EVOLUTION_SCORES[e],t=Math.max(0,Math.min(EVOLUTION_DURATION,time)),major=[3,6,10].includes(to),height=Math.max(FORM_HEIGHTS[from],FORM_HEIGHTS[to]),orbit=ease((t-p.orbitStart)/(p.orbitEnd-p.orbitStart)),reveal=ease((t-p.swap-.18)/.85),finish=ease((t-(p.clear-.8))/.8),lift=p.lift*ease((t-.9)/1.4)*(1-ease((t-(p.swap+.3))/.85)),charge=ease(t/p.sparkEnd)*(1-finish),veil=ease((t-p.veilIn)/(p.veilPeak-p.veilIn))*(1-ease((t-p.veilOut)/(p.veilEnd-p.veilOut))),yaw=reduced?p.endYaw:p.startYaw+(p.endYaw-p.startYaw)*orbit;
 const fit=Math.max(1,.76/Math.max(.35,aspect)),distance=(.5+height*2.5)*fit*(1+.08*(1-reveal)),y=height*(e==='fire'?.80:e==='nature'?.90:1.0)+.8-(reduced?0:height*.12*reveal*(1-finish));
 const poseEnvelope=(1-finish)*(t<p.swap?ease((t-.4)/1.3):Math.max(0,1-(t-p.swap)/.8));
 return{element:e,name:p.name,time:t,done:t>=EVOLUTION_DURATION,phase:t<p.sparkEnd?'spark':t<p.gatherEnd?'gather':t<p.transform?'orbit':t<p.clear?'transform':'reveal',major,oldVisible:t<p.swap,newVisible:t>=p.swap,
  glow:veil,charge,reveal,clear:finish,effects:1-finish,lift:reduced?0:lift,scale:t<p.swap?1:.96+.04*ease((t-p.swap)/.5),yaw,camera:{x:Math.sin(yaw)*distance,y:y+(reduced?0:(e==='air'?.22:e==='water'?.12:.05)*Math.sin(orbit*Math.PI)),z:Math.cos(yaw)*distance},targetY:height*.50+(reduced?0:lift*.35),fov:42,
  ring:charge*.7,ribbons:charge*(major?1:.8),particles:charge*.7,landing:ease((t-(p.clear-.35))/.12)*(1-ease((t-(p.clear-.18))/.18)),
  pose:{pitch:reduced?0:p.pitch*poseEnvelope,roll:reduced?0:p.roll*poseEnvelope,anticipation:poseEnvelope,recovery:finish},score:p};
}
