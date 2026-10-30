import{classicZ,stretchZ}from'./runner-mode.js';
// The first arena's five chapters form one composed expedition. Saved task/route identities do not change.
export const EXPEDITION_SCENES=[
 {id:'sheltered-spring',name:'The Sheltered Spring',chapter:0,focus:{x:0,y:7.4,z:-64},rise:.68,trees:14,story:'Water spills from a sheltered hollow in the central ridge.'},
 {id:'ruined-aqueduct',name:'The Ruined Aqueduct',chapter:1,focus:{x:0,y:11.2,z:-201},rise:.92,trees:8,story:'A broken watercourse crosses the valley above the path.'},
 {id:'split-oak-lookout',name:'Split-Oak Lookout',chapter:2,focus:{x:0,y:11,z:-329},rise:1.12,trees:11,story:'An old split oak crowns a terraced lookout.'},
 {id:'fractured-passage',name:'The Fractured Passage',chapter:3,focus:{x:0,y:10,z:-462},rise:.78,trees:5,story:'Fractured stone frames a quiet crystal seam.'},
 {id:'wind-sanctuary',name:'The Wind Sanctuary',chapter:4,focus:{x:0,y:8.4,z:-664},rise:.98,trees:9,story:'The valley opens toward a weathered sanctuary crown.'}
];
for(const scene of EXPEDITION_SCENES)scene.focus.z=stretchZ(scene.focus.z);
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export const sceneForChapter=chapter=>EXPEDITION_SCENES[Math.max(0,Math.min(4,chapter|0))];
export function expeditionTitle(area,chapter,fallback=''){return area===0?sceneForChapter(chapter).name:fallback;}
export function composedHalfWidth(z){
 z=classicZ(z);
 if(z<-657)return 3.2+2.8*smooth((-z-657)/5);
 const p=(((-z)%132)+132)%132;
 const pinch=smooth((p-6)/2)*(1-smooth((p-11)/2));
 const clearing=smooth((p-13)/3)*(1-smooth((p-22)/4));
 return 3.2-.38*pinch+1.25*clearing;
}
export function routeHalfWidth(e,p){return e.area===0&&e.adventureVersion===2?composedHalfWidth(p.z):3.2;}
export function scenicRiseFor(section,e){return (e.area===0||e.terrainVersion===1)&&e.adventureVersion===2&&section.index%4===0&&section.kind==='coins'&&!section.trial&&!section.rival?{height:sceneForChapter(section.chapter).rise*(e.area===1?1.08:e.area===2?1.18:1),from:.7,to:section.length-1.0,segments:48}:null;}
export function scenicRise(section,s){const r=section.scenicRise;if(!r||s<r.from||s>r.to)return 0;const t=(s-r.from)/(r.to-r.from);return r.height*smooth(t/.36)*(1-smooth((t-.64)/.36));}
// A shallow worn crown across quiet rises; shoulders descend into the bank.
// Centre-line heights stay unchanged, and hazards/tasks keep their original support.
export function scenicSurface(section,s,lateral=0){const base=scenicRise(section,s),width=composedHalfWidth(section.start.z+section.forward.z*s)+.12,edge=Math.min(1,Math.abs(lateral)/width);return base-Math.pow(edge,3)*Math.min(.12,base*.18);}
// Lower ridge windows expose the main scene without opening a connection between the two branches.
export function scenicWallHeight(x,z,base){z=classicZ(z);const p=(((-z)%132)+132)%132,window=smooth((p-13)/3)*(1-smooth((p-51)/9)),court=smooth((-z-650)/9);return Math.max(2.2,base*(1-window*.48)*(1-court*.32));}

// Exact 2D segment / rectangle distance for verifying low solid scenery against the whole route.
export function segmentRectDistance(a,b,box){
 const lo=box.min,hi=box.max,dx=b.x-a.x,dz=b.z-a.z;let near=0,far=1;
 for(const [v,d,min,max]of[[a.x,dx,lo.x,hi.x],[a.z,dz,lo.z,hi.z]]){if(Math.abs(d)<1e-10){if(v<min||v>max){near=2;break;}}else{let p=(min-v)/d,q=(max-v)/d;if(p>q)[p,q]=[q,p];near=Math.max(near,p);far=Math.min(far,q);}}
 if(near<=far)return 0;
 const pointDistance=p=>Math.hypot(Math.max(lo.x-p.x,0,p.x-hi.x),Math.max(lo.z-p.z,0,p.z-hi.z));let distance=Math.min(pointDistance(a),pointDistance(b));
 for(const x of[lo.x,hi.x])for(const z of[lo.z,hi.z]){const t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1)));distance=Math.min(distance,Math.hypot(x-a.x-dx*t,z-a.z-dz*t));}return distance;
}
