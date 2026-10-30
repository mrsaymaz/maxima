import{stretchZ}from'./runner-mode.js';
import{assignSurface}from'./surface-materials.js';
import * as T from './vendor/three.module.min.js';
import {chapterPath,pathDistance,CHAPTER_LENGTH,END} from './trail-layout.js';

const THEMES=[
 {name:'forest',title:'Whisperwood terraces',lighting:{sky:'#c9ded0',fog:'#c9ded0',hemisphereSky:'#e9f5db',hemisphereGround:'#435b36',sun:'#ffe2ab',sunIntensity:3.0,hemisphereIntensity:1.28,exposure:1.02},colors:{rock:'#a99b80',cap:'#86b957',bark:'#7a5638',leaf:'#3f9845',leafLight:'#8fcd4e',bloom:'#ffe08a',fungus:'#e0a066',flow:'#39c0d4'}},
 {name:'skyreach',title:'Skyreach aqueducts',lighting:{sky:'#c9dfeb',fog:'#c9dfeb',hemisphereSky:'#edf6ff',hemisphereGround:'#687d78',sun:'#fff0d2',sunIntensity:3.1,hemisphereIntensity:1.65,exposure:1.06},colors:{rock:'#cdb68f',cap:'#a6cf66',stone:'#f1e2bd',brass:'#e2b24e',leaf:'#5cb574',veil:'#bfe9f7',flow:'#46c6ea'}},
 {name:'stormglass',title:'Stormglass basalt spires',lighting:{sky:'#9caac4',fog:'#9caac4',hemisphereSky:'#ccd6ff',hemisphereGround:'#31354d',sun:'#d3dfff',sunIntensity:2.55,hemisphereIntensity:1.35,exposure:1.0},colors:{rock:'#4b3f86',cap:'#4db7a3',glass:'#b59cff',cyan:'#5fe6ff',leaf:'#3aa69e',flow:'#5be0ff'}}
];
const PATHS=Array.from({length:5},(_,c)=>['left','right'].map(s=>chapterPath(c,s))).flat();
PATHS.push([{x:0,z:9},{x:0,z:2}],[{x:0,z:stretchZ(-658)},{...END}]);
const CLEARANCE=5,OFF_CORRIDOR=19;

function rectangleDistance(box){
 const lo=box.min,hi=box.max;
 let result=Infinity;
 for(const path of PATHS){
  for(const x of [lo.x,hi.x])for(const z of [lo.z,hi.z])result=Math.min(result,pathDistance({x,z},path));
  for(const p of path){const dx=Math.max(lo.x-p.x,0,p.x-hi.x),dz=Math.max(lo.z-p.z,0,p.z-hi.z);result=Math.min(result,Math.hypot(dx,dz));}
 }
 return result;
}
function makeFlowTexture(){
 const width=8,height=64,data=new Uint8Array(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4,light=190+Math.round(50*Math.sin(y*.43+x*1.8)**2);data[i]=light;data[i+1]=Math.min(255,light+12);data[i+2]=255;data[i+3]=205+Math.round(40*Math.sin(y*.21+x)**2);}
 const texture=new T.DataTexture(data,width,height,T.RGBAFormat);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.magFilter=T.LinearFilter;texture.minFilter=T.LinearFilter;texture.needsUpdate=true;return texture;
}
function kit(area){
 const theme=THEMES[area],group=new T.Group();group.name=`arena-art-${theme.name}`;
 const geometry=new Map(),materials=new Map(),batches=new Map(),object=new T.Object3D(),placements=[],landmarks=[];
 const geometryFor=kind=>{if(!geometry.has(kind)){const g=kind==='box'?new T.BoxGeometry(1,1,1):kind==='cylinder'?new T.CylinderGeometry(1,1,1,8):kind==='hex'?new T.CylinderGeometry(1,1,1,6):kind==='sphere'?new T.SphereGeometry(1,10,6):kind==='cap'?new T.SphereGeometry(1,10,5,0,Math.PI*2,0,Math.PI/2):kind==='cone'?new T.ConeGeometry(1,1,6):kind==='rock'?new T.DodecahedronGeometry(1,0):kind==='octa'?new T.OctahedronGeometry(1,0):kind==='arch'?new T.TorusGeometry(1,.15,6,18,Math.PI):kind==='ring'?new T.TorusGeometry(1,.105,6,24):kind==='brokenRing'?new T.TorusGeometry(1,.13,5,24,Math.PI*1.65):new T.PlaneGeometry(1,1);g.computeBoundingBox();geometry.set(kind,g);}return geometry.get(kind);};
 const materialFor=name=>{if(!materials.has(name)){const flow=name==='flow',glow=name==='cyan'||name==='glass'||name==='bloom';const m=new T.MeshStandardMaterial({color:theme.colors[name],roughness:flow?.28:name==='glass'?.3:name==='brass'?.43:.93,metalness:name==='brass'?.32:name==='glass'?.18:0,emissive:glow?theme.colors[name]:'#000000',emissiveIntensity:glow?.12:0});assignSurface(m,name==='brass'?'metal':name==='glass'?'glass':name==='flow'?'water':['leaf','leafLight','cap'].includes(name)?'foliage':['bark'].includes(name)?'wood':['veil'].includes(name)?'fabric':['cyan','bloom'].includes(name)?'effect':'stone');if(flow){m.map=makeFlowTexture();m.transparent=true;m.opacity=.88;m.side=T.DoubleSide;m.forceSinglePass=true;m.depthWrite=false;m.emissive.set(theme.colors.flow);m.emissiveIntensity=.12;}if(name==='veil'){m.side=T.DoubleSide;m.forceSinglePass=true;}materials.set(name,m);}return materials.get(name);};
 function put(kind,material,x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0,feature=kind){
  object.position.set(x,y,z);object.scale.set(sx,sy,sz);object.rotation.set(rx,ry,rz);object.updateMatrix();const g=geometryFor(kind),box=g.boundingBox.clone().applyMatrix4(object.matrix),outside=box.min.x>=OFF_CORRIDOR||box.max.x<=-OFF_CORRIDOR,distance=rectangleDistance(box);
  if(!outside||distance<CLEARANCE-1e-6)throw Error(`Scenic ${theme.name}/${feature} would intrude on corridor (${x},${z}; clearance ${distance}).`);
  const key=kind+'|'+material;if(!batches.has(key))batches.set(key,{geometry:g,material:materialFor(material),matrices:[],features:new Set()});const batch=batches.get(key);batch.matrices.push(object.matrix.clone());batch.features.add(feature);placements.push({feature,x,z,minX:box.min.x,maxX:box.max.x,minZ:box.min.z,maxZ:box.max.z,clearance:distance});
 }
 function terrace(side,chapter,tier){const x=side*(32+tier*11+(chapter%2)*3),z=stretchZ(-chapter*132-63+tier*5),h=4+tier*2;put('rock','rock',x,h*.58,z,9+tier*2,h,24+tier*2,0,chapter*.035,0,'terrace-relief');put('box','cap',x,h*1.58+.12,z,15+tier*4,.65,36+tier*3,0,0,0,'terrace-top');}
 function landmark(kind,x,z,height){landmarks.push({kind,x,z,height});}
 function finish(){
  let triangles=0,instances=0;
  for(const [key,b]of batches){const mesh=new T.InstancedMesh(b.geometry,b.material,b.matrices.length);mesh.name=`${theme.name}-${key}`;mesh.userData.scenicOnly=true;mesh.userData.features=[...b.features];mesh.castShadow=false;mesh.receiveShadow=true;b.matrices.forEach((m,i)=>{mesh.setMatrixAt(i,m);if(!b.material.transparent){const tint=new T.Color().setHSL(.10+(i%5)*.008,.035,.82+(i*7%11)*.015);mesh.setColorAt(i,tint);}});mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();group.add(mesh);instances+=mesh.count;triangles+=(b.geometry.index?.count||b.geometry.attributes.position.count)/3*mesh.count;}
  if(group.children.length>15)throw Error('Arena art exceeded mobile draw budget.');
  group.userData={area,theme:theme.name,title:theme.title,scenicOnly:true,requiresColliders:false,minimumPathClearance:CLEARANCE,minimumAbsX:OFF_CORRIDOR,lighting:{...theme.lighting},landmarks,placements,stats:{drawCalls:group.children.length,instances,triangles}};
  Object.defineProperty(group,'_arenaAtmosphere',{value:{flow:materials.get('flow'),glow:materials.get(area===2?'cyan':'bloom')},enumerable:false});
  return group;
 }
 return {put,terrace,landmark,finish};
}
function forest(k){
 const {put,terrace,landmark}=k;
 for(let c=0;c<5;c++)for(const side of[-1,1]){
  for(let tier=0;tier<2;tier++)terrace(side,c,tier);
  const x=side*(29+c%2*3),z=stretchZ(-c*132-79);
  put('arch','bark',x,2.8,z,4.2,4.6,1.65,0,.12*side,0,'ancient-root-arch');
  for(const s of[-1,1])put('cylinder','bark',x+s*4.2,1.45,z,.65,3.1,.7,0,0,s*.07,'arch-root');
  for(let j=0;j<6;j++)put('sphere',j%2?'leaf':'leafLight',x+(j-2.5)*1.15,6.1+Math.sin(j*.65)*1.2,z-.5,1.65,1.25,1.7,0,j*.5,0,'arch-moss-canopy');
  landmark('ancient-root-arch',x,z,8.2);
  const waterX=side*(32+(c%2)*3),waterZ=stretchZ(-c*132-39);
  put('plane','flow',waterX,4.5,waterZ,1.85,5.8,1,0,0,0,'woodland-waterfall');
  put('rock','rock',waterX,.75,waterZ+1.5,3.3,.9,4.1,0,.13,0,'spring-basin');put('cylinder','flow',waterX,1.61,waterZ+1.5,2.8,.1,3.5,0,0,0,'spring-pool');
 }
 for(let i=0;i<110;i++){const side=i%2?1:-1,x=side*(27+(i*17%19)),z=5-(i*37%675),h=5.3+(i%5)*.9;
  put('cylinder','bark',x,h*.45,z,.32,h*.9,.36,0,i*.4,.025*Math.sin(i),'broadleaf-trunk');
  put('sphere','leaf',x,h,z,2.4+(i%3)*.3,2.1,2.7,0,i*.3,0,'rounded-broadleaf-crown');
  put('sphere','leafLight',x+.8,h+1.1,z+.3,1.7,1.5,1.8,0,i*.7,0,'sunlit-leaf-crown');
  if(i%3===0)put('cylinder','leaf',x+.6,h*.62,z+.8,.045,h*.54,.045,0,0,.02,'hanging-vine');
  for(let j=0;j<3;j++)put('sphere','leaf',x+(j-1)*.65,.35,z+1.4,.25,.13,.9,.2,j*2.1,.08,'fern-frond');
  if(i%2===0){put('cylinder','bark',x+.9,.35,z-.9,.12,.7,.12,0,0,0,'mushroom-stem');put('cap','fungus',x+.9,.7,z-.9,.65,.37,.65,0,0,0,'mushroom-cap');}
  if(i%4===0)put('octa','bloom',x-.6,.6,z+.7,.13,.13,.13,0,i,0,'forest-flower');
 }
}
function skyreach(k){
 const {put,terrace,landmark}=k;
 for(let c=0;c<5;c++)for(const side of[-1,1]){
  for(let tier=0;tier<2;tier++)terrace(side,c,tier);
  const x=side*(33+c%2*3),z=stretchZ(-c*132-64);
  // A continuous elevated trough connects three arches and its spill basin.
  for(const off of[-16,0,16]){put('arch','stone',x,2.4,z+off,7.4,5.8,1.05,0,Math.PI/2,0,'aqueduct-arch');for(const edge of[-1,1])put('cylinder','stone',x,4.4,z+off+edge*7.2,.62,8.8,.62,0,0,0,'aqueduct-pier');}
  put('box','stone',x,8.95,z,2.8,.5,48,0,0,0,'connected-aqueduct-trough');
  put('plane','flow',x,9.23,z,1.55,46,1,-Math.PI/2,0,0,'aqueduct-water-channel');
  put('plane','flow',x,5.05,z+23.6,1.55,8.2,1,0,0,0,'aqueduct-spill');
  put('rock','rock',x,.55,z+25.4,3.8,.65,4.4,0,.2,0,'spill-basin');put('cylinder','flow',x,1.22,z+25.4,3.1,.08,3.6,0,0,0,'sky-pool');
  const gateX=side*(28+c%2*4),gateZ=stretchZ(-c*132-104);
  for(const s of[-1,1])put('cylinder','stone',gateX+s*3.7,4.2,gateZ,.65,8.4,.65,0,0,0,'wind-crown-pillar');
  put('arch','stone',gateX,8.2,gateZ,3.7,3.4,.9,0,0,0,'wind-crown-arch');put('ring','brass',gateX,10.2,gateZ,2,2,.7,0,.12,0,'wind-crown-ring');
  put('plane','veil',gateX+2.4,6.1,gateZ+.1,.85,3.8,1,0,.1,.08,'wind-ribbon');
  landmark('wind-crown',gateX,gateZ,12.5);
 }
 for(let i=0;i<90;i++){const side=i%2?1:-1,x=side*(26+(i*13%21)),z=10-(i*41%685),h=1.6+(i%5)*.45;put('cone','leaf',x,h*.5,z,.45,h,.45,0,i,0,'silver-cypress');if(i%3===0){put('cylinder','stone',x+.7,1.2,z-1.3,.34,2.4,.34,0,i,.08,'broken-column');put('octa','brass',x+.7,2.7,z-1.3,.24,.24,.24,0,i,0,'wind-stone-cap');}}
}
function stormglass(k){
 const {put,terrace,landmark}=k;
 for(let c=0;c<5;c++)for(const side of[-1,1]){
  for(let tier=0;tier<2;tier++)terrace(side,c,tier);
  const x=side*(31+(c%2)*4),z=stretchZ(-c*132-77);
  put('brokenRing','rock',x,7.8,z,4.6,6.9,1.2,0,.12*side,-.22*side,'shattered-storm-halo');
  for(const s of[-1,1])put('hex','rock',x+s*4.1,3.6,z,.85,7.2,.85,0,Math.PI/6,0,'halo-basalt-support');
  put('octa','glass',x,5.1,z-.6,1.6,4.4,1.4,0,.35,.08,'stormglass-heart');put('ring','cyan',x,5.7,z,2.6,2.6,.4,0,.1,.17,'charged-halo');
  landmark('shattered-storm-halo',x,z,16);
  put('box','cyan',side*33,.09,stretchZ(-c*132-30),2.1,.05,24,0,0,0,'crystal-runnel');put('plane','flow',side*33,4.45,stretchZ(-c*132-42),1.4,8.7,1,0,0,0,'luminous-spill');
 }
 for(let i=0;i<150;i++){const side=i%2?1:-1,x=side*(25+(i*17%27)),z=8-(i*43%684),h=2.5+(i%7)*1.3;put('hex','rock',x,h*.5,z,.75+(i%3)*.18,h,.75,0,i*.5,0,'basalt-organ-column');if(i%2===0)put('octa',i%4?'glass':'cyan',x+.9,h*.75,z+1,1.05,2.8+(i%4)*.7,.8,.08,i*.32,.13*side,'angular-crystal-cluster');if(i%5===0)put('cone','leaf',x-1,.5,z+1.8,.38,1,.38,0,i,.14,'silver-storm-sedge');}
}

export function makeArenaArt(area=0){
 if(!Number.isInteger(area)||area<0||area>2)throw new RangeError('Arena area must be0,1 or2.');
 const k=kit(area);[forest,skyreach,stormglass][area](k);return k.finish();
}
export function updateArenaArt(group,time=0){
 const atmosphere=group?._arenaAtmosphere;if(!atmosphere)return;
 const t=Number.isFinite(time)?time:0;
 if(atmosphere.flow){atmosphere.flow.map.offset.y=-(t*.19)%1;atmosphere.flow.emissiveIntensity=.12+Math.sin(t*.7)*.025;}
 if(atmosphere.glow)atmosphere.glow.emissiveIntensity=.12+Math.sin(t*.65)*.035;
}
