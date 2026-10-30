// Conservative hysteresis: down after sustained pressure, up only after a long quiet window. Each step down is a trial:
// if frames are not clearly faster afterwards (a steady 30 fps from Low Power Mode or thermal caps, or a CPU-bound
// stretch), the step is undone and becomes the floor, so phones cannot ratchet the picture into pixels.
// The floor never goes below 0.75 CSS pixels.
export class AdaptiveResolution{
 constructor(cap=1,enabled=true){this.configure(cap,enabled);}
 configure(cap,enabled=true){this.cap=Math.max(.5,Math.min(2,cap));this.floor=Math.min(.75,this.cap);this.ratio=this.cap;this.enabled=enabled;this.changes=0;this.trial=null;this.reset();}
 reset(now=0){this.frames=[];this.since=now;this.cooldownUntil=now+2500;this.goodSince=null;this.trial=null;}
 sample(ms,now,{active=true}={}){
  if(!this.enabled||!active||!Number.isFinite(ms)||ms<=0||ms>1000){this.frames=[];this.goodSince=null;return null;}
  if(now<this.cooldownUntil)return null;this.frames.push(ms);if(this.frames.length<90||now-this.since<1800)return null;
  const a=this.frames.slice().sort((a,b)=>a-b),mean=a.reduce((n,v)=>n+v,0)/a.length,p95=a[Math.ceil(a.length*.95)-1];this.frames=[];this.since=now;
  let next=this.ratio;
  if(this.trial){const t=this.trial;this.trial=null;if(t.mean/mean<1.1){this.floor=Math.min(this.cap,t.from);return this.apply(t.from,now);}}
  if((mean>20||p95>26)&&this.ratio>this.floor){next=Math.max(this.floor,this.ratio-.1);this.goodSince=null;this.trial={from:this.ratio,mean};}
  else if(mean<17.8&&p95<19){this.goodSince??=now;if(now-this.goodSince>10000)next=Math.min(this.cap,this.ratio+.05);}
  else this.goodSince=null;
  return this.apply(next,now);
 }
 apply(next,now){next=Math.round(next*100)/100;if(next===this.ratio){this.trial=null;return null;}this.ratio=next;this.changes++;this.cooldownUntil=now+(next<this.cap?5000:12000);this.goodSince=null;return next;}
 snapshot(){return{enabled:this.enabled,pixelRatio:this.ratio,cap:this.cap,floor:this.floor,adjustments:this.changes};}
}
