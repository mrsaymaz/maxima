// Desktop steering is creature-relative. The camera can follow without changing
// what a held key means: forward, reverse and turn always remain predictable.
export function desktopSteering(keys,heading,dt){
 const has=(...names)=>names.some(k=>keys.has(k)),left=has('a','ArrowLeft'),right=has('d','ArrowRight'),forward=has('w','ArrowUp'),backward=has('s','ArrowDown'),active=left||right||forward||backward;
 const angle=heading+(Number(left)-Number(right))*2.1*Math.max(0,Math.min(.05,dt));
 const facing=Math.atan2(Math.sin(angle),Math.cos(angle)),drive=Number(forward)-Number(backward);
 return{active,heading:facing,input:{x:Math.sin(facing)*drive,z:Math.cos(facing)*drive}};
}
