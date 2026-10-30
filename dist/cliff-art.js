import{assignSurface}from'./surface-materials.js';
import * as T from './vendor/three.module.min.js';
// Stylised cliff walls for the corridor enclosure: faceted, noise-displaced rock with strata bands,
// darker bases, moss on ledges, a ragged skyline and plants along the rim. Visual only: the enclosure's
// collision circles are built separately and do not change.

// Small deterministic 3D value noise.
function hash(x,y,z){let h=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(z|0,2147483647);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296;}
export function noise3(x,y,z){const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),fx=x-ix,fy=y-iy,fz=z-iz,s=t=>t*t*(3-2*t),u=s(fx),v=s(fy),w=s(fz);const l=(a,b,t)=>a+(b-a)*t;return l(l(l(hash(ix,iy,iz),hash(ix+1,iy,iz),u),l(hash(ix,iy+1,iz),hash(ix+1,iy+1,iz),u),v),l(l(hash(ix,iy,iz+1),hash(ix+1,iy,iz+1),u),l(hash(ix,iy+1,iz+1),hash(ix+1,iy+1,iz+1),u),v),w);}
export const fbm3=(x,y,z)=>noise3(x,y,z)*.55+noise3(x*2.1+7.3,y*2.1,z*2.1-3.1)*.3+noise3(x*4.3,y*4.3+1.7,z*4.3)*.15;

export const CLIFF_TINTS=[{rock:'#959782',moss:'#6f8b59',grass:'#7f9b66',dark:'#515e51'},{rock:'#c6bea2',moss:'#8fa57a',grass:'#9fb68a',dark:'#737967'},{rock:'#8d90a8',moss:'#6c7f8c',grass:'#7d8fa2',dark:'#4a4c61'}];
const LEVELS=[0,.13,.29,.46,.63,.8,.93,1];
export const CHUNK=66;
export const chunkOf=z=>Math.floor((12-z)/CHUNK);
// Splits instance placements into one InstancedMesh per route chunk so they can be frustum culled.
export function chunkedInstances(geometry,material,items,place,name){const groups=new Map();for(const item of items){const k=chunkOf(item.z);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(item);}const o=new T.Object3D(),out=[];for(const[k,list]of groups){const mesh=new T.InstancedMesh(geometry,material,list.length);list.forEach((item,i)=>{place(o,item,i);o.updateMatrix();mesh.setMatrixAt(i,o.matrix);});mesh.computeBoundingSphere();mesh.name=`${name}-${k}`;mesh.castShadow=true;mesh.receiveShadow=true;out.push(mesh);}return out;}
// strips: [{a,b,an,bn,ha,hb,aw,bw}] contour segments with outward normals, wall heights and available depth.
export function buildCliffs(strips){
 const wall=[],wallColor=[],cap=[],capColor=[],rim=[];
 const offset=(p,n,y,h,aw,v)=>{
  // The wall leans back as it rises, with strata steps and rocky bulges; low on the wall it never bulges toward the trail.
  let o=aw*(.04+.4*Math.pow(v,1.25))+.08*((y/1.05)%1);const d=(fbm3(p.x*.55,y*.75,p.z*.55)-.5)*.62+(fbm3(p.x*1.7,y*1.5,p.z*1.7)-.5)*.2;o+=d;if(y<1.25)o=Math.max(o,aw*.04);o=Math.max(-.14,Math.min(aw,o));
  return[p.x+n.x*o,y,p.z+n.z*o];
 };
 const topY=(p,h)=>h+(fbm3(p.x*.35,0,p.z*.35)-.5)*.9;
 for(const s of strips){
  const ta=topY(s.a,s.ha),tb=topY(s.b,s.hb),col=[];
  const va=LEVELS.map(v=>offset(s.a,s.an,ta*v,ta,s.aw,v)),vb=LEVELS.map(v=>offset(s.b,s.bn,tb*v,tb,s.bw,v));
  for(let l=0;l<LEVELS.length-1;l++){const p=va[l],q=vb[l],r=vb[l+1],t=va[l+1];wall.push(...p,...q,...r,...p,...r,...t);}
  // Grass cap from the crown back to the shell edge, slightly domed.
  const ia=va.at(-1),ib=vb.at(-1),oa=[s.a.x+s.an.x*s.aw,ta-.05,s.a.z+s.an.z*s.aw],ob=[s.b.x+s.bn.x*s.bw,tb-.05,s.b.z+s.bn.z*s.bw],ma=[(ia[0]+oa[0])/2,ta+.12,(ia[2]+oa[2])/2],mb=[(ib[0]+ob[0])/2,tb+.12,(ib[2]+ob[2])/2];
  cap.push(...ia,...ib,...mb,...ia,...mb,...ma,...ma,...mb,...ob,...ma,...ob,...oa);
  // The back of the shell drops to the valley floor so the ridge has no hole when seen from outside.
  const ga=[oa[0],0,oa[2]],gb=[ob[0],0,ob[2]];cap.push(...oa,...ob,...gb,...oa,...gb,...ga);
  rim.push({x:(ia[0]+ib[0])/2,y:(ta+tb)/2,z:(ia[2]+ib[2])/2,nx:(s.an.x+s.bn.x)/2,nz:(s.an.z+s.bn.z)/2,depth:(s.aw+s.bw)/2});
 }
 // Per-face colour: strata bands, darker bases, moss on upward faces and a lighter weathered crown.
 const c=new T.Color(),moss=new T.Color('#6f9a54'),v1=new T.Vector3(),v2=new T.Vector3(),v3=new T.Vector3(),n=new T.Vector3();
 for(let i=0;i<wall.length;i+=9){const facet=.9+hash(i,7,3)*.2;v1.fromArray(wall,i);v2.fromArray(wall,i+3);v3.fromArray(wall,i+6);n.copy(v2).sub(v1).cross(v3.clone().sub(v1)).normalize();
  for(let k=0;k<3;k++){const y=wall[i+k*3+1],x=wall[i+k*3],z=wall[i+k*3+2],band=Math.floor(y/1.05+fbm3(x*.2,0,z*.2)*.8),strata=(.8+hash(band,11,5)*.26)*facet,ao=.55+.45*Math.min(1,y/1.8),grain=.86+fbm3(x*1.3,y*2.6,z*1.3)*.26;const warm=hash(band,3,9)*.08;c.setRGB(strata*ao*grain*(1+warm),strata*ao*grain*.98,strata*ao*grain*(.94-warm));const up=Math.max(0,Math.abs(n.y)-.42)/.58;if(up>0)c.lerp(moss,Math.min(1,up*1.4));wallColor.push(c.r,c.g,c.b);}}
 for(let i=0;i<cap.length;i+=3){const x=cap[i],y=cap[i+1],z=cap[i+2],g=.82+fbm3(x*.8,0,z*.8)*.3,low=y<.5?.7:1;capColor.push(g*low,g*low,g*.9*low);}
 const geometry=(positions,colors)=>{const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();return geo;};
 const rock=new T.MeshStandardMaterial({color:CLIFF_TINTS[0].rock,vertexColors:true,roughness:.95,flatShading:true,side:T.DoubleSide});const grass=new T.MeshStandardMaterial({color:CLIFF_TINTS[0].grass,vertexColors:true,roughness:1,side:T.DoubleSide});
 assignSurface(rock,'stone');assignSurface(grass,'foliage');
 // Vertex colours carry strata and moss; stylizeProps adds world-space rock detail on top.
 rock.userData.detail='stone';rock.userData.detailScale=.2;
 // Split into chunks along the route so only the nearby walls are drawn.
 const meshes=[],split=(positions,colors,material,name)=>{const buckets=new Map();for(let i=0;i<positions.length;i+=9){const k=chunkOf((positions[i+2]+positions[i+5]+positions[i+8])/3);if(!buckets.has(k))buckets.set(k,{p:[],c:[]});const b=buckets.get(k);b.p.push(...positions.slice(i,i+9));b.c.push(...colors.slice(i,i+9));}for(const[k,b]of buckets){const m=new T.Mesh(geometry(b.p,b.c),material);m.name=`${name}-${k}`;m.castShadow=true;m.receiveShadow=true;meshes.push(m);}};
 split(wall,wallColor,rock,'cliff-wall');split(cap,capColor,grass,'continuous-moss-cap');
 return{meshes,rim,materials:{rock,grass}};
}

// Low-poly foliage blob: an icosahedron pushed around by noise, with darker undersides.
export function foliageGeometry(seed=1,detail=1){const geo=new T.IcosahedronGeometry(1,detail),p=geo.attributes.position,v=new T.Vector3(),colors=[];for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const k=.78+fbm3(v.x*1.6+seed,v.y*1.6,v.z*1.6-seed)*.45;v.multiplyScalar(k);v.y*=.82;p.setXYZ(i,v.x,v.y,v.z);const shade=.62+.38*(v.y*.5+.5);colors.push(shade,shade,shade*.95);}geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();return geo;}
// Faceted boulder with a lighter, mossy top.
export function boulderGeometry(seed=1){const geo=new T.IcosahedronGeometry(1,1),p=geo.attributes.position,v=new T.Vector3(),colors=[];for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const k=.72+fbm3(v.x*1.3+seed,v.y*1.3,v.z*1.3+seed*.7)*.5;v.multiplyScalar(k);if(v.y<-.3)v.y=-.3-(v.y+.3)*.2;p.setXYZ(i,v.x,v.y,v.z);}geo.computeVertexNormals();const n=geo.attributes.normal;for(let i=0;i<p.count;i++){const up=Math.max(0,n.getY(i)-.55)/.45,g=.78+fbm3(p.getX(i)*3,p.getY(i)*3,p.getZ(i)*3)*.3;colors.push(g*(1-up*.45),g*(1-up*.15),g*(1-up*.55));}geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));return geo;}
// Arena palette for walls, caps, outcrops and rim plants.
export function tintCliffs(group,area=0){const t=CLIFF_TINTS[area]||CLIFF_TINTS[0],leaf=['#5f8a4c','#7c9a6a','#5d6f86'][area]||'#5f8a4c';group?.traverse(o=>{if(!o.material)return;const n=o.name;if(n.startsWith('cliff-wall'))o.material.color.set(t.rock);else if(n.startsWith('continuous-moss-cap'))o.material.color.set(t.grass);else if(n.startsWith('cliff-outcrops'))o.material.color.set(t.rock).multiplyScalar(1.05);else if(n.startsWith('rim-bushes')||n.startsWith('rim-tree-crowns'))o.material.color.set(leaf);});}
