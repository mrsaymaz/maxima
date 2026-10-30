import{elementalAttack}from'./elemental-attacks.js';
const clamp=x=>Math.max(0,Math.min(1,x));
// The generated Cast clip releases at 36%; map that pose to the real gameplay wind-up.
export function castPresentation(attack){
 const spec=elementalAttack(attack?.partner),age=Math.max(0,attack?.age||0),windup=spec.windup,recovery=Math.max(.01,(attack?.duration||windup+spec.recovery)-windup),released=!!attack?.hit||age>=windup;
 const charge=clamp(age/windup),after=Math.max(0,age-windup),recover=clamp(after/recovery);
 return{released,charge:released?Math.max(0,1-after/.12):charge,release:released?Math.max(0,1-after/.13):0,clipPhase:released?.36+.64*recover:.36*charge,after,recover};
}
export function anatomicalSquash(partner='hufflepuff',level=0,amount=0){
 // Only soft cub forms use a small stretch; feathers, scales, armour and multiple heads retain proportions.
 const limit=partner==='hufflepuff'&&level<=2?.018:partner==='gryffindor'&&level<=1?.012:0,q=Math.max(-limit,Math.min(limit,amount*.3));
 return{y:1+q,xz:1-q*.35};
}
export function walkContacts(meta={},partner='hufflepuff'){
 if(Array.isArray(meta.contacts))return meta.contacts.filter(n=>Number.isFinite(n)&&n>=0&&n<1);if(partner==='slytherin')return[];const limbs=Object.values(meta.limbNodes||{}),split=partner==='ravenclaw'?.40:partner==='hufflepuff'&&(meta.version===2||String(meta.profile).includes('young'))?.34:.35;
 return [...new Set(limbs.map(l=>((split-(l.phase||0))%1+1)%1))].sort((a,b)=>a-b);
}
export function crossedContacts(from,to,phases){if(to<=from||!Number.isFinite(from)||!Number.isFinite(to))return 0;let n=0;for(const p of phases)for(let k=Math.floor(from)-1;k<=Math.floor(to);k++)if(k+p>from+1e-8&&k+p<=to+1e-8)n++;return n;}
