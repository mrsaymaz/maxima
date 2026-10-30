// Which world style this page shows: the classic look, or the toy-brick prototype. `?style=brick` (or
// `?style=classic`) wins; otherwise `<html data-world-style="brick">` selects it, which is how the brick
// Drop package opens in brick mode by default.
export function worldStyle(){
 try{
  const asked=new URLSearchParams(globalThis.location?.search||'').get('style');
  if(asked==='brick'||asked==='classic')return asked;
  return globalThis.document?.documentElement?.dataset?.worldStyle==='brick'?'brick':'classic';
 }catch{return'classic';}
}
export const BRICK_WORLD=worldStyle()==='brick';
