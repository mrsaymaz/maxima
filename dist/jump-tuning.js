import{FORM_HEIGHTS}from'./world-layout.js';
// Feet rise with the growing body. Physics, coyote jumps and wave timing share
// this profile; model clips never add a second vertical arc.
export const JUMP_GRAVITY=13;
export function jumpTuning(level=0){
 const height=FORM_HEIGHTS[Math.max(0,Math.min(10,Math.round(level))) ]??FORM_HEIGHTS[0];
 const rise=.56+1.9*(height-FORM_HEIGHTS[0]),velocity=Math.sqrt(2*JUMP_GRAVITY*rise),flight=2*velocity/JUMP_GRAVITY;
 return{rise,velocity,flight,ringInterval:Math.max(1.2,flight+.40),guardianVelocity:Math.sqrt(49+24*(rise-.56))};
}
