// Game feel: hitstop, camera shake, squash and stretch, floating numbers, bursts, flying coins and haptics.
// Everything respects reduced-motion and the effects budget; no state here affects saves or progression.
const reduced=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;

export class Juice{
 constructor(){this.freeze=0;this.trauma=0;this.time=0;this.squash=0;this.squashVelocity=0;this.offset={x:0,y:0,z:0,roll:0};this.scale=1;}
 // Freeze simulation briefly so a hit lands with weight (60–80 ms on hits).
 hitstop(ms=70){this.freeze=Math.max(this.freeze,ms/1000);}
 shake(amount=.3){this.trauma=Math.min(1,this.trauma+amount*this.scale);}
 // Squash and stretch spring: negative compresses height, positive stretches it.
 land(impact=1){this.squashVelocity-=3+Math.min(3,impact)*1.6;}
 takeoff(){this.squashVelocity+=3.6;}
 crouch(){this.squash=Math.min(this.squash,-.07);}
 step(dt){
  const frozen=this.freeze>0;this.freeze=Math.max(0,this.freeze-dt);this.time+=dt;
  // Critically damped-ish spring back to rest.
  const k=210,c=17;this.squashVelocity+=(-k*this.squash-c*this.squashVelocity)*dt;this.squash=Math.max(-.32,Math.min(.28,this.squash+this.squashVelocity*dt));
  this.trauma=Math.max(0,this.trauma-dt*1.9);const s=this.trauma*this.trauma,t=this.time*38;
  this.offset={x:s*.16*(Math.sin(t*1.13)+Math.sin(t*2.71)*.5),y:s*.12*(Math.sin(t*1.57+1.3)+Math.sin(t*3.1)*.4),z:s*.1*Math.sin(t*1.91+2.1),roll:s*.035*Math.sin(t*1.37+.7)};
  return frozen;
 }
 squashScale(){const q=this.squash;return{y:1+q,xz:1-q*.55};}
 setLevel(effects='medium'){this.scale=reduced()?.25:effects==='low'?.5:effects==='full'?1:.8;}
}

let lastBuzz=0;
// Android browsers vibrate; iPhone Safari has no web vibration, so this quietly does nothing there.
export function haptic(pattern=12,{enabled=true,minGap=60}={}){
 if(!enabled||typeof navigator==='undefined'||typeof navigator.vibrate!=='function')return false;const now=Date.now();if(now-lastBuzz<minGap)return false;lastBuzz=now;try{return navigator.vibrate(pattern);}catch{return false;}
}
export const HAPTICS={hit:22,crit:[18,30,26],hurt:[40,30,30],correct:14,wrong:[16,40,16],coin:6,reward:[20,40,20,40,50],land:8,levelUp:[30,50,30,50,90]};

function layer(){return typeof document==='undefined'?null:document.querySelector('#fx-layer');}
function el(tag,cls,text=''){const e=document.createElement(tag);e.className=cls;if(text)e.textContent=text;return e;}
// Floating combat text, positioned at a screen point.
export function floatText(x,y,text,kind='damage'){
 const root=layer();if(!root||!Number.isFinite(x)||!Number.isFinite(y))return null;const e=el('div','fx-float fx-'+kind,text);e.style.left=x+'px';e.style.top=y+'px';e.style.setProperty('--drift',((Math.random()-.5)*36).toFixed(1)+'px');root.append(e);setTimeout(()=>e.remove(),1100);return e;
}
// Radiating sparkle burst.
export function burst(x,y,{color='#ffe08a',count=14,size=8,spread=70,ring=true}={}){
 const root=layer();if(!root||!Number.isFinite(x)||!Number.isFinite(y))return;const n=reduced()?Math.ceil(count/3):count;
 if(ring){const r=el('div','fx-ring');r.style.left=x+'px';r.style.top=y+'px';r.style.borderColor=color;root.append(r);setTimeout(()=>r.remove(),650);}
 for(let i=0;i<n;i++){const a=i/n*Math.PI*2+Math.random()*.4,d=spread*(.55+Math.random()*.6),p=el('div','fx-spark'+(i%3===0?' fx-star':''));p.style.left=x+'px';p.style.top=y+'px';p.style.background=i%4===1?'#fff8de':color;p.style.width=p.style.height=(size*(.6+Math.random()*.7)).toFixed(1)+'px';p.style.setProperty('--dx',(Math.cos(a)*d).toFixed(1)+'px');p.style.setProperty('--dy',(Math.sin(a)*d).toFixed(1)+'px');p.style.animationDelay=(Math.random()*40).toFixed(0)+'ms';root.append(p);setTimeout(()=>p.remove(),800);}
}
// Coins arc from the world to the coin counter; each arrival ticks the counter.
export function flyCoins(from,target,count=1,onArrive=()=>{},{stagger=70}={}){
 const root=layer();if(!root||!target||!from){for(let i=0;i<count;i++)onArrive(i);return;}
 const box=target.getBoundingClientRect(),tx=box.left+box.width/2,ty=box.top+box.height/2;
 for(let i=0;i<count;i++){const coin=el('div','fx-coin');const sx=from.x+(count>1?(Math.random()-.5)*40:0),sy=from.y+(count>1?(Math.random()-.5)*30:0);coin.style.left=sx+'px';coin.style.top=sy+'px';root.append(coin);
  const mx=(sx+tx)/2+(Math.random()-.5)*80,my=Math.min(sy,ty)-40-Math.random()*60,frames=[];for(let k=0;k<=8;k++){const t=k/8,u=1-t,x=u*u*sx+2*u*t*mx+t*t*tx,y=u*u*sy+2*u*t*my+t*t*ty;frames.push({transform:`translate(${(x-sx).toFixed(1)}px,${(y-sy).toFixed(1)}px) scale(${(1+Math.sin(Math.PI*t)*.35-t*.35).toFixed(3)})`,opacity:t>.92?.6:1});}
  const done=()=>{coin.remove();onArrive(i);};
  if(typeof coin.animate==='function'&&!reduced()){const a=coin.animate(frames,{duration:560+Math.random()*120,delay:i*stagger,easing:'cubic-bezier(.45,.05,.55,.95)',fill:'backwards'});a.onfinish=done;a.oncancel=done;}else setTimeout(done,i*stagger+120);
 }
}
export function bump(target,cls='fx-bump'){if(!target)return;target.classList.remove(cls);void target.offsetWidth;target.classList.add(cls);}
export function flash(kind='hurt'){const root=layer();if(!root||reduced())return;const f=el('div','fx-flash fx-flash-'+kind);root.append(f);setTimeout(()=>f.remove(),450);}
