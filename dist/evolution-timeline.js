import{FORM_HEIGHTS}from'./world-layout.js';
const clamp=x=>Math.max(0,Math.min(1,x));export const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
export const EVOLUTION_DURATION=13;
const BASE_SCORES={
 air:{sparkEnd:.9,gatherEnd:2.3,transform:4.4,swap:4.95,veilIn:3.8,veilPeak:4.7,veilOut:5.18,veilEnd:5.85,clear:6.2,orbitStart:1.0,orbitEnd:6.0,lift:.44,startYaw:Math.PI,endYaw:Math.PI*2+.22,pitch:-.035,roll:.035,background:'#102b32',floor:'#16343a',name:'Spiral Ascension'},
 fire:{sparkEnd:.65,gatherEnd:2.8,transform:4.1,swap:4.58,veilIn:3.85,veilPeak:4.32,veilOut:4.82,veilEnd:5.5,clear:6.05,orbitStart:1.7,orbitEnd:5.8,lift:.08,startYaw:Math.PI-.25,endYaw:.18,pitch:.04,roll:0,background:'#291b25',floor:'#35252b',name:'Ember Ignition'},
 nature:{sparkEnd:1.15,gatherEnd:3.0,transform:4.45,swap:5.12,veilIn:4.25,veilPeak:4.88,veilOut:5.35,veilEnd:5.9,clear:6.35,orbitStart:1.85,orbitEnd:6.15,lift:0,startYaw:Math.PI+.12,endYaw:.28,pitch:.012,roll:.008,background:'#142b24',floor:'#223b2b',name:'Verdant Awakening'},
 water:{sparkEnd:1.0,gatherEnd:2.4,transform:4.25,swap:4.8,veilIn:3.9,veilPeak:4.55,veilOut:5.03,veilEnd:5.72,clear:6.15,orbitStart:.85,orbitEnd:5.95,lift:.20,startYaw:Math.PI+.2,endYaw:.16,pitch:-.018,roll:-.02,background:'#14263e',floor:'#19374b',name:'Tidal Emergence'}
};
const TIMED=['sparkEnd','gatherEnd','transform','swap','veilIn','veilPeak','veilOut','veilEnd','clear','orbitStart','orbitEnd'];
export const EVOLUTION_SCORES=Object.fromEntries(Object.entries(BASE_SCORES).map(([element,p])=>[element,{...p,...Object.fromEntries(TIMED.map(k=>[k,p[k]*EVOLUTION_DURATION/8])),endYaw:Math.PI*4+(element==='nature'?.28:element==='air'?.22:.18)}]));
export const evolutionElement=value=>{const s=String(value||'air').toLowerCase();return Object.hasOwn(EVOLUTION_SCORES,s)?s:'air';};
export function evolutionFrame(time,from,to,{reduced=false,aspect=1,element='air'}={}){
 const e=evolutionElement(element),p=EVOLUTION_SCORES[e],t=Math.max(0,Math.min(EVOLUTION_DURATION,time)),major=[3,6,10].includes(to),height=Math.max(FORM_HEIGHTS[from],FORM_HEIGHTS[to]),orbit=ease((t-p.orbitStart)/(p.orbitEnd-p.orbitStart)),reveal=ease((t-p.swap-.18)/.85),finish=ease((t-(p.clear-.8))/.8),lift=p.lift*ease((t-.9)/1.4)*(1-ease((t-(p.swap+.3))/.85)),charge=ease(t/p.sparkEnd)*(1-finish),veil=ease((t-p.veilIn)/(p.veilPeak-p.veilIn))*(1-ease((t-p.veilOut)/(p.veilEnd-p.veilOut))),yaw=reduced?p.endYaw:p.startYaw+(p.endYaw-p.startYaw)*orbit;
 const fit=Math.max(1,.76/Math.max(.35,aspect)),distance=(.5+height*2.5)*fit*(1+.08*(1-reveal)),y=height*(e==='fire'?.80:e==='nature'?.90:1.0)+.8;
 const poseEnvelope=(1-finish)*(t<p.swap?ease((t-.4)/1.3):Math.max(0,1-(t-p.swap)/.8));
 return{element:e,name:p.name,time:t,done:t>=EVOLUTION_DURATION,phase:t<p.sparkEnd?'spark':t<p.gatherEnd?'gather':t<p.transform?'orbit':t<p.clear?'transform':'reveal',major,oldVisible:t<p.swap,newVisible:t>=p.swap,
  glow:veil,charge,reveal,clear:finish,effects:1-finish,lift:reduced?0:lift,scale:t<p.swap?1:.96+.04*ease((t-p.swap)/.5),yaw,camera:{x:Math.sin(yaw)*distance,y:y+(reduced?0:(e==='air'?.22:e==='water'?.12:.05)*Math.sin(orbit*Math.PI)),z:Math.cos(yaw)*distance},targetY:height*.50+(reduced?0:lift*.35),fov:42,
  ring:charge*.7,ribbons:charge*(major?1:.8),particles:charge*.7,landing:ease((t-(p.clear-.35))/.12)*(1-ease((t-(p.clear-.18))/.18)),
  pose:{pitch:reduced?0:p.pitch*poseEnvelope,roll:reduced?0:p.roll*poseEnvelope,anticipation:poseEnvelope,recovery:finish},score:p};
}
