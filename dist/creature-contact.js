// A measured torso capsule handles solid contact. Full silhouette bounds remain
// separate so decorative wings and tails can collect coins without blocking paths.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function makeBodyProfile(bounds,height=.65,level=0){const b=bounds||{halfWidth:.24,halfDepth:.24};return{halfWidth:clamp(b.halfWidth*.64,.16,Math.max(.18,height*.50)),halfDepth:clamp(b.halfDepth*.68,.18,Math.max(.22,height*.72)),height,level,visual:{...b}};}
export function profileOf(nav,factor=1){return nav.bodyProfile||{halfWidth:nav.radius*factor,halfDepth:nav.radius*factor};}
export function capsule(body,p,yaw=0){const w=body.halfWidth,d=body.halfDepth,r=Math.min(w,d),h=Math.abs(d-w),angle=yaw+(w>d?Math.PI/2:0),x=Math.sin(angle)*h,z=Math.cos(angle)*h;return{a:{x:p.x-x,z:p.z-z},b:{x:p.x+x,z:p.z+z},r};}
export function nearestOnSegment(p,a,b){const dx=b.x-a.x,dz=b.z-a.z,t=clamp(((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1),0,1);return{x:a.x+dx*t,z:a.z+dz*t};}
export function pointSegmentDistance(p,a,b){const q=nearestOnSegment(p,a,b);return Math.hypot(p.x-q.x,p.z-q.z);}
export function circlesTouchBody(body,p,yaw,circle,r=circle.r||0){const c=capsule(body,p,yaw);return pointSegmentDistance(circle,c.a,c.b)<r+c.r;}
export function bodyExtent(body,yaw,direction){const c=capsule(body,{x:0,z:0},yaw),l=Math.hypot(direction.x,direction.z)||1;return c.r+Math.abs(c.b.x*direction.x/l+c.b.z*direction.z/l);}
export function bodyDistanceInterval(body,p,yaw,origin){const c=capsule(body,p,yaw);return{min:Math.max(0,pointSegmentDistance(origin,c.a,c.b)-c.r),max:Math.max(Math.hypot(c.a.x-origin.x,c.a.z-origin.z),Math.hypot(c.b.x-origin.x,c.b.z-origin.z))+c.r};}
export function segmentDistance(a,b,c,d){const cross=(p,q,r)=>(q.x-p.x)*(r.z-p.z)-(q.z-p.z)*(r.x-p.x);if(cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0)return 0;return Math.min(pointSegmentDistance(a,c,d),pointSegmentDistance(b,c,d),pointSegmentDistance(c,a,b),pointSegmentDistance(d,a,b));}
export function bodyTouchesBeam(body,p,yaw,a,b,halfWidth){const c=capsule(body,p,yaw);return segmentDistance(c.a,c.b,a,b)<halfWidth+c.r;}
export function separateBodyFromCircle(body,p,yaw,circle,r,skin=.1){const c=capsule(body,p,yaw),q=nearestOnSegment(circle,c.a,c.b),dx=q.x-circle.x,dz=q.z-circle.z,d=Math.hypot(dx,dz),overlap=r+c.r+skin-d;if(overlap>0){p.x+=(d?dx/d:0)*overlap;p.z+=(d?dz/d:1)*overlap;}return p;}
export function containBody(body,p,yaw,arena,skin=.1){for(let i=0;i<4;i++){const c=capsule(body,p,yaw);for(const q of[c.a,c.b]){const dx=q.x-arena.x,dz=q.z-arena.z,d=Math.hypot(dx,dz),overlap=d+c.r+skin-arena.radius;if(overlap>0){p.x-=dx/(d||1)*overlap;p.z-=dz/(d||1)*overlap;}}}return p;}
