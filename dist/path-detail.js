import * as T from './vendor/three.module.min.js';
import{ARENA_LOOKS}from'./arena-palette.js';
import{edgeGrass}from'./world-style.js';import{trailDressing}from'./prop-art.js';
import{chapterPath}from'./trail-layout.js';import{sectionFor,courseCoordinates}from'./traversal-layout.js';
import{composedHalfWidth,scenicSurface}from'./expedition-composition.js';import{chunkedInstances}from'./cliff-art.js';import{surfaceMaterial}from'./surface-materials.js';
const quietSections=Array.from({length:5},(_,chapter)=>['left','right'].map(side=>sectionFor({id:'path-detail',area:0,adventureVersion:2,level:0,serial:1,choices:Array(5).fill(side)},chapter*4,'relaxed',side))).flat();
// Detail placement follows the same quiet-section height profile and the ramp's visual offset.
export function pathDetailHeight(x,z){const p={x,z};for(const s of quietSections){const q=courseCoordinates(s,p),r=s.scenicRise;if(q.s>=r.from&&q.s<=r.to&&Math.abs(q.lateral)<=composedHalfWidth(z)+.12)return scenicSurface(s,q.s,q.lateral)+.033;}return 0;}
export function pathDetailPatch(x,z){const v=.5+.30*Math.sin(z*.29+x*.71)+.16*Math.sin(z*.73-x*.39);return Math.max(.12,Math.min(.94,v));}
function rootGeometry(){const positions=[],normals=[];for(const points of[[[-.40,.035,-.06],[-.12,.04,.02],[.16,.035,-.03],[.48,.03,.04]],[[.03,.035,0],[.13,.03,.13],[.28,.025,.23]]]){const g=new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),6,.026,4,false),n=g.toNonIndexed();positions.push(...n.attributes.position.array);normals.push(...n.attributes.normal.array);g.dispose();n.dispose();}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));return g;}

export function makePathDetail(){
 const root=new T.Group();root.name='whisperwood-near-path-detail';const options={widthAt:(_x,z)=>composedHalfWidth(z),heightAt:pathDetailHeight,clusterAt:pathDetailPatch},grass=edgeGrass(ARENA_LOOKS[0].edgeGrass,options),dressing=trailDressing(options),relief=new T.Group();grass.name='composed-edge-grass';relief.name='path-edge-relief';root.add(grass,dressing,relief);
 const roots=[],stones=[];let seed=7321;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let c=0;c<5;c++)for(const side of['left','right']){const points=chapterPath(c,side);for(let k=1;k<points.length;k++){const a=points[k-1],b=points[k],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len;for(let d=2;d<len-1;d+=3.6){const cx=a.x+dx*d/len,cz=a.z+dz*d/len;if(Math.abs(cx)<3&&Math.abs(cz+c*132)<7)continue;for(const edge of[-1,1]){const off=composedHalfWidth(cz)-.27,x=cx+nx*off*edge,z=cz+nz*off*edge,patch=pathDetailPatch(x,z);if(rnd()>patch)continue;stones.push({x,z,y:pathDetailHeight(x,z),r:.11+rnd()*.12,turn:rnd()*6.28});if(rnd()<.32)roots.push({x:x-nx*edge*.18,z:z-nz*edge*.18,y:pathDetailHeight(x-nx*edge*.18,z-nz*edge*.18),s:.65+rnd()*.45,turn:Math.atan2(-dz,dx)+edge*.4});}}}}
 const stoneGeo=new T.IcosahedronGeometry(1,0),p=stoneGeo.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,Math.max(0,p.getY(i)*.36));stoneGeo.computeVertexNormals();
 const stone=surfaceMaterial('stone',ARENA_LOOKS[0].pathStone,{roughness:.96}),wood=surfaceMaterial('wood',ARENA_LOOKS[0].pathWood,{roughness:.98});
 for(const m of chunkedInstances(stoneGeo,stone,stones,(o,v)=>{o.position.set(v.x,v.y+.008,v.z);o.rotation.set(0,v.turn,0);o.scale.set(v.r*1.6,v.r,v.r);},'path-edge-stones')){m.castShadow=false;relief.add(m);}
 for(const m of chunkedInstances(rootGeometry(),wood,roots,(o,v)=>{o.position.set(v.x,v.y,v.z);o.rotation.set(0,v.turn,0);o.scale.setScalar(v.s);},'path-rootlets')){m.castShadow=false;relief.add(m);}
 root.userData={composed:true,nonBlocking:true,grass:grass.count,...dressing.userData,roots:roots.length,edgeStones:stones.length};Object.defineProperty(root,'_pathDetail',{value:{grass,dressing,relief},enumerable:false});return root;
}

export function configurePathDetail(root,{preset='balanced'}={}){const state=root?._pathDetail;if(!state)return;const low=preset==='low';state.grass.visible=!low;state.grass.count=Math.floor(state.grass.userData.total*(preset==='high'?1:.7));for(const mesh of state.dressing.children)mesh.visible=!low||mesh.name.startsWith('trail-pebbles');state.relief.visible=true;}
export function updatePathDetail(root,{time=0,strength=0,x=0,z=0,radius=11}={}){const u=root?._pathDetail?.grass.material.userData.sway;if(!u)return;u.uTime.value=Number.isFinite(time)?time:0;u.uQuietness.value=Math.max(0,Math.min(1,strength));u.uQuietCenter.value.set(x,z);u.uQuietRadius.value=radius;}
