const clamp=x=>Math.max(0,Math.min(1,x));
// Keep the model's proportions. A yielded opponent bows, then steps aside.
export function yieldPose(kind,timer){const t=clamp(timer/1.1),retreat=clamp((t-.25)/.75),ease=retreat*retreat*(3-2*retreat),bow=Math.sin(Math.PI*Math.min(1,t/.55));return{side:ease*.82,back:ease*.36,yaw:ease*(kind==='spore'?-.7:.55),pitch:bow*(kind==='seed'?.14:kind==='spore'?.10:.18),roll:0,visible:t<1};}
