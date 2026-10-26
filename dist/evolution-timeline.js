import{FORM_HEIGHTS}from'./world-layout.js';
const clamp=x=>Math.max(0,Math.min(1,x));export const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
export const EVOLUTION_DURATION=8;
export function evolutionFrame(time,from,to,{reduced=false,aspect=1}={}){
 const t=Math.max(0,Math.min(8,time)),major=[3,6,10].includes(to),h0=FORM_HEIGHTS[from],h1=FORM_HEIGHTS[to],height=Math.max(h0,h1),orbit=ease((t-1.1)/5.1),reveal=ease((t-5.2)/1.05),lift=.52*ease((t-1.1)/1.3)*(1-ease((t-6)/.75)),charge=ease(t/1.2)*(1-ease((t-5.9)/1.1)),veil=ease((t-3.8)/.95)*(1-ease((t-5.15)/.85));
 const yaw=reduced?.42:Math.PI-(Math.PI-.42)*orbit,fov=42,fit=Math.max(1, .76/Math.max(.35,aspect)),distance=(.5+height*2.5)*fit*(1+.1*(1-reveal))*(1-.12*ease((t-2)/.8)*(1-ease((t-4.1)/.7)));
 return{time:t,done:t>=8,phase:t<1?'spark':t<2.5?'gather':t<4.4?'orbit':t<6?'transform':'reveal',major,oldVisible:t<4.95,newVisible:t>=4.95,glow:veil,charge,reveal,lift:reduced?0:lift,scale:t<4.95?1+.08*ease((t-3)/2):.86+.14*ease((t-4.95)/1.2),yaw,camera:{x:Math.sin(yaw)*distance,y:height*.6+.9+height*.22+(reduced?0:.12*Math.sin(orbit*Math.PI)),z:Math.cos(yaw)*distance},targetY:height*.53+lift*.55,fov,ring:charge*.7+reveal*.22,ribbons:charge*(major?1:.8),particles:charge*.7+(1-ease((t-7.1)/.9))*.3,landing:ease((t-6.1)/.15)*(1-ease((t-6.5)/.7))};
}
