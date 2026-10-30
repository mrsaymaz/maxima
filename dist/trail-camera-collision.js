// The camera observes the same support heights as the creature, including rises
// and moving platforms. A missing surface is an open gap, not an invisible wall.
export function castTrailCamera(nav,a,b,r=.1){
 const len=Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z),n=Math.max(1,Math.ceil(len/.07));
 const nearby=(nav.solids||[]).filter(s=>s.x+s.r+r>=Math.min(a.x,b.x)&&s.x-s.r-r<=Math.max(a.x,b.x)&&s.z+s.r+r>=Math.min(a.z,b.z)&&s.z-s.r-r<=Math.max(a.z,b.z));let t=0;
 for(let i=1;i<=n;i++){const k=i/n,x=a.x+(b.x-a.x)*k,y=a.y+(b.y-a.y)*k,z=a.z+(b.z-a.z)*k,support=nav.support?.({x,z})??0;if(y<support+r||nearby.some(s=>y<(s.top??4)+r&&Math.hypot(x-s.x,z-s.z)<s.r+r))break;t=k;}
 return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t,fraction:t};
}
