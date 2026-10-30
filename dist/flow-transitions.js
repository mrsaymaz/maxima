export const GATE_ENTER_SECONDS=.82;
export const PLAY_RETURN_SECONDS=.48;
export const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export function gateEntry(age,{reduced=false}={}){const p=smooth(age/(reduced?.18:GATE_ENTER_SECONDS));return{progress:p,ready:p>=.98,fold:reduced?0:(1-p)*Math.PI*.47,pullback:reduced?1:1.12-.12*p};}
