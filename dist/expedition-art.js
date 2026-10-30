import{stretchZ}from'./runner-mode.js';
import{makeEnvironmentMaterials}from'./environment-materials.js';
import{bevelBox,carvedCylinder}from'./prop-art.js';
import * as T from './vendor/three.module.min.js';
import{surfaceMaterial}from'./surface-materials.js';import{foliageGeometry,boulderGeometry}from'./cliff-art.js';
import{chapterPath,END}from'./trail-layout.js';import{EXPEDITION_SCENES,segmentRectDistance}from'./expedition-composition.js';

const colors={stone:'#b0a184',dark:'#6e5e48',limestone:'#e3d0a2',wood:'#80583a',leaf:'#3f9845',leafLight:'#8fcd4e',moss:'#6eb04a',water:'#39c0d4',crystal:'#8fe6ee',bronze:'#d6a648'};
const roles={stone:'stone',dark:'stone',limestone:'stone',wood:'wood',leaf:'foliage',leafLight:'foliage',moss:'foliage',water:'water',crystal:'glass',bronze:'metal'};
const PATHS=Array.from({length:5},(_,c)=>['left','right'].map(side=>chapterPath(c,side))).flat();PATHS.push([{x:0,z:9},{x:0,z:2}],[{x:0,z:stretchZ(-658)},END]);
function wedge(){const shape=new T.Shape(),a=Math.PI/12;shape.moveTo(.80,0);shape.lineTo(1,0);for(let i=1;i<=4;i++)shape.lineTo(Math.cos(a*i/4),Math.sin(a*i/4));shape.lineTo(Math.cos(a)*.8,Math.sin(a)*.8);for(let i=3;i>=0;i--)shape.lineTo(Math.cos(a*i/4)*.8,Math.sin(a*i/4)*.8);const g=new T.ExtrudeGeometry(shape,{depth:1,bevelEnabled:false,steps:1,curveSegments:1});g.translate(0,0,-.5);return g;}
function waterTexture(){const data=new Uint8Array(8*64*4);for(let y=0;y<64;y++)for(let x=0;x<8;x++){const i=(y*8+x)*4,v=200+Math.sin(y*.55+x*.9)**2*48;data[i]=v;data[i+1]=Math.min(255,v+7);data[i+2]=255;data[i+3]=255;}const map=new T.DataTexture(data,8,64);map.wrapS=map.wrapT=T.RepeatWrapping;map.needsUpdate=true;return map;}

export function makeExpeditionArt(){
 const root=new T.Group();root.name='whisperwood-composed-expedition';const geometries=new Map(),materials=new Map(),placements=[],solids=[],chapters=[],object=new T.Object3D(),flow=waterTexture(),painted=makeEnvironmentMaterials(0);
 const geometry=kind=>{if(!geometries.has(kind)){const g=kind==='box'?bevelBox(1,1,1,.06):kind==='column'?carvedCylinder(1,1,1,8,.045):kind==='rock'?boulderGeometry(6):kind==='crown'?foliageGeometry(9,1):kind==='shard'?new T.OctahedronGeometry(1,0):kind==='voussoir'?wedge():kind==='ring'?new T.TorusGeometry(1,.065,5,32):new T.PlaneGeometry(1,1);g.computeBoundingBox();geometries.set(kind,g);}return geometries.get(kind);};
 const material=name=>{if(!materials.has(name)){const m=surfaceMaterial(roles[name],colors[name],{roughness:name==='water'?.28:name==='crystal'?.4:.9,metalness:name==='bronze'?.25:0,flatShading:true});const finish={stone:'rock',dark:'rock',limestone:'masonry',wood:'bark'}[name];if(finish){m.map=painted[finish].map;m.flatShading=name==='stone'||name==='dark';}if(name==='water'){m.map=flow;m.transparent=true;m.opacity=.87;m.depthWrite=false;m.side=T.DoubleSide;m.forceSinglePass=true;}if(name==='crystal'){m.emissive.set(colors.crystal);m.emissiveIntensity=.06;}materials.set(name,m);}return materials.get(name);};
 let batches,chapter;
 function put(kind,mat,x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0,{feature=kind,solid=false,detail=false}={}){
  object.position.set(x,y,z);object.rotation.set(rx,ry,rz);object.scale.set(sx,sy,sz);object.updateMatrix();const g=geometry(kind),box=g.boundingBox.clone().applyMatrix4(object.matrix);if(kind==='voussoir'){box.makeEmpty();const v=new T.Vector3();for(let i=0;i<g.attributes.position.count;i++)box.expandByPoint(v.fromBufferAttribute(g.attributes.position,i).applyMatrix4(object.matrix));}
  let clearance=Infinity;for(const path of PATHS)for(let i=1;i<path.length;i++)clearance=Math.min(clearance,segmentRectDistance(path[i-1],path[i],box));
  if(solid&&box.min.y<5.5&&clearance<4.4)throw Error('Landmark would obstruct route: '+feature+' / '+clearance);
  const key=[kind,mat,detail].join('|');if(!batches.has(key))batches.set(key,{g,m:material(mat),items:[],detail,features:new Set()});const batch=batches.get(key);batch.items.push(object.matrix.clone());batch.features.add(feature);
  placements.push({chapter:chapter.chapter,feature,solid,detail,min:box.min.toArray(),max:box.max.toArray(),clearance});
  if(solid&&box.min.y<5.5){const size=box.getSize(new T.Vector3()),r=Math.min(size.x,size.z)/2,axis=size.x>size.z?'x':'z',extent=Math.max(0,(size[axis]/2-r)),count=extent>.1?Math.ceil(extent*2/Math.max(.5,r)) +1:1;for(let i=0;i<count;i++){const p={x:(box.min.x+box.max.x)/2,z:(box.min.z+box.max.z)/2};p[axis]+=count>1?-extent+2*extent*i/(count-1):0;solids.push({...p,r,top:box.max.y,kind:'composed-landmark'});}}
 }
 function rod(mat,a,b,r,feature,solid=false){const d=new T.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.clone().normalize()),e=new T.Euler().setFromQuaternion(q);put('column',mat,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,r,d.length(),r,e.x,e.y,e.z,{feature,solid});}
 function rock(x,y,z,sx,sy,sz,feature='ledge-mass'){const bottom=Math.max(0,y-sy*.8),center=bottom-geometry('rock').boundingBox.min.y*sy;put('rock','stone',x,center,z,sx,sy,sz,0,Math.abs(x)<8?0:.2,0,{feature,solid:true});}
 function tree(x,z,h,form,i){
  const lean=(i%2?1:-1)*.65,feature=['broadleaf','umbrella','willow','snag'][form];rod('wood',[x,0,z],[x+lean,h*.75,z+.25],.22+form*.025,feature+'-trunk',true);
  if(form===3){rod('wood',[x+lean,h*.6,z+.2],[x-1.5,h*.94,z-.4],.14,'snag-fork',true);rod('wood',[x+lean,h*.5,z+.2],[x+1.6,h*.72,z+.5],.1,'snag-fork',true);return;}
  if(form===1){put('crown','leaf',x+lean,h*.85,z,3.1,1.25,2.7,0,i*.7,.1,{feature:'umbrella-canopy'});put('crown','leafLight',x+lean-.6,h*1.02,z,2.2,.9,1.9,0,i*.4,.05,{feature:'umbrella-crown'});}
  else if(form===2){put('crown','leaf',x+lean,h*.86,z,2.3,1.6,2.0,0,i,.1,{feature:'willow-crown'});for(let j=0;j<3;j++){const a=j*2.1;put('crown','leaf',x+lean+Math.cos(a)*1.4,h*.63,z+Math.sin(a)*1.3,.65,h*.26,.62,0,a,.12,{feature:'willow-hanging-leaves'});}}
  else for(let j=0;j<3;j++)put('crown',j===1?'leafLight':'leaf',x+lean+(j-1)*1.3,h*(.80+j*.07),z+(j%2?-.7:.5),1.9,1.65,1.9,.1,i*.7+j,.1,{feature:'broadleaf-cluster'});
 }
 function planting(){
  // Asymmetric stands leave the middle ridge and each reveal free of competing silhouettes.
  for(let i=0;i<chapter.trees;i++){const side=i%3===0?1:-1,p=i*2.399,x=side*(23+(i*7%12)),z=stretchZ(-chapter.chapter*132-9-(i*19%109)),h=4.5+(i%4)*.85;tree(x,z,h,(i+chapter.chapter)%4,i);if(i%3===0){put('crown','moss',x+1,.3,z+1,1.35,.4,.85,0,p,0,{feature:'clustered-understory',detail:true});put('rock','stone',x-1,.25,z-.6,.7,.55,.65,.1,p,0,{feature:'root-stone',detail:true});}}
  for(let i=0;i<8;i++){const side=i%2?1:-1,z=-chapter.chapter*132-10-i*13.5;rock(side*(22+(i%3)*4),1.2+i%2,z,3.4,2.0+i%3,5,'outer-terrace');}
 }
 for(const scene of EXPEDITION_SCENES){chapter=scene;batches=new Map();const c=scene.chapter,z=scene.focus.z;
  if(c===0){
   rock(0,2.4,z,5.2,3.1,8,'spring-ridge');rock(0,5.2,z-2.1,4.4,2.9,3.4,'spring-shelter');
   for(const side of[-1,1])rock(side*4.0,4.2,z+.2,.75,3.6,2.3,'spring-buttress');
   put('column','stone',0,2.4,z+1.7,3.65,4.8,4.0,0,0,0,{feature:'spring-bearing-ridge',solid:true});put('column','dark',0,4.80,z+1.7,3.6,.32,3.8,0,0,0,{feature:'spring-stone-basin',solid:true});
   put('column','water',0,4.98,z+1.7,3.25,.04,3.4,0,0,0,{feature:'sheltered-spring-pool'});
   put('plane','water',0,6.75,z+.45,1.05,3.5,1,0,0,0,{feature:'spring-cascade'});
   for(const side of[-1,1])rod('wood',[side*4.0,4.8,z-1],[side*1.3,8.8,z-1.2],.32,'sheltering-root',true);
   for(let i=0;i<4;i++)put('crown',i%2?'leafLight':'leaf',-3+i*2.0,8.6+(i%2)*.4,z-1.8,1.8,.75,2.0,0,i,0,{feature:'spring-canopy'});
  }else if(c===1){
   // Two route arches and the smaller centre span are carried by four piers clear of both paths.
   for(const x of[-16.8,-4.8,4.8,16.8]){put('column','limestone',x,2.8,z,.65,5.6,.85,0,0,0,{feature:'aqueduct-pier',solid:true});put('box','limestone',x,.22,z,1.8,.44,2.2,0,0,0,{feature:'aqueduct-footing',solid:true});}
   for(const[x,r]of[[-10.8,6],[0,4.8],[10.8,6]])for(let j=0;j<12;j++)put('voussoir','limestone',x,5.6,z,r,r,1.5,0,0,j*Math.PI/12,{feature:'aqueduct-vault',solid:true});
   // The trough is visibly broken at the centre; its spill feeds the lower catch basin.
   for(const[x,w]of[[-10.3,16.6],[11.4,13.8]]){put('box','limestone',x,11.85,z,w,.65,2.3,0,0,0,{feature:'broken-aqueduct-trough',solid:true});for(const dz of[-1,1])put('box','limestone',x,12.35,z+dz*.96,w,.40,.22,0,0,0,{feature:'trough-channel-wall'});put('plane','water',x,12.20,z,w,.7,1,-Math.PI/2,0,Math.PI/2,{feature:'trough-water'});}
   rock(0,1.8,z,3.2,2.2,4.3,'aqueduct-rubble-bed');put('column','stone',0,1.85,z+1.7,2.95,3.7,2.55,0,0,0,{feature:'catch-basin-foundation',solid:true});put('column','dark',0,3.72,z+1.7,2.9,.25,2.5,0,0,0,{feature:'aqueduct-catch-basin',solid:true});put('column','water',0,3.87,z+1.7,2.65,.03,2.25,0,0,0,{feature:'catch-water'});put('plane','water',-1.9,8.04,z+.65,.65,8.3,1,0,0,0,{feature:'broken-trough-spill'});
   for(let i=0;i<4;i++)put('box','limestone',-1.4+i*.8,4.1+(i%2)*.25,z+2.0,1.0,.65,.8,.1,i*.65,.18,{feature:'fallen-keystones',solid:true});
  }else if(c===2){
   for(let i=0;i<3;i++)rock(0,1.0+i*.9,z-i*1.1,5.1-i*.8,1.6,6-i,'lookout-terrace');
   rod('wood',[0,3.0,z],[.6,9,z-.4],.8,'split-oak-trunk',true);rod('wood',[.5,7,z-.2],[-2.1,12.8,z+.2],.46,'split-oak-fork',true);rod('wood',[.5,7,z-.2],[2.5,13.2,z-.5],.40,'split-oak-fork',true);
   for(const side of[-1,1]){rod('wood',[side*.8,9,z],[side*4,11.3,z+.5],.23,'oak-bough',true);put('crown',side<0?'leaf':'leafLight',side*2.5,12.8,z-1.1,2.5,1.2,2.4,0,side,0,{feature:'oak-split-crown'});}
   put('ring','bronze',0,8.6,z+.6,1.1,1.1,.7,0,.1,.15,{feature:'lookout-wind-mark'});
  }else if(c===3){
   rock(0,2.2,z,4.2,3.1,5.6,'fracture-plinth');
   for(const side of[-1,1])put('shard','dark',side*3.2,7.3,z,1.2,7.0,2.0,.06,side*.15,side*-.19,{feature:'split-basalt-fin',solid:true});
   for(let i=0;i<4;i++)put('shard','crystal',(i-1.5)*1.1,5.1+i*.55,z+.5,.55,2.5+(i%2),.8,.08,i*.3,-.12+i*.08,{feature:'quiet-crystal-seam',solid:true});
   for(const side of[-1,1])for(let i=0;i<3;i++){const x=side*(17.7+i*.8);put('shard','dark',x,4.8+i,z+15-i*12,1.05,5.5+i*.7,2.5,.08,i*.1,side*-.08,{feature:'passage-screen',solid:true});}
  }else{
   // A single destination crown is read from both branches and the final shared approach.
   for(const side of[-1,1]){put('column','limestone',side*7.7,3.2,z,.8,6.4,1,0,0,0,{feature:'sanctuary-pier',solid:true});put('box','dark',side*7.7,.2,z,2.2,.4,2.7,0,0,0,{feature:'sanctuary-footing',solid:true});}
   for(let j=0;j<12;j++)put('voussoir','limestone',0,6.3,z,7.7,7.7,1.5,0,0,j*Math.PI/12,{feature:'sanctuary-crown',solid:true});
   put('ring','bronze',0,10.8,z-.15,1.8,1.8,.8,0,0,.2,{feature:'sanctuary-wind-ring'});
   for(const side of[-1,1])for(let i=0;i<3;i++)rock(side*(12+i*4),.8+i*.8,z+5+i*2,3,1.7,5,'sanctuary-amphitheatre');
  }
  planting();const group=new T.Group();group.name=scene.id;group.userData={...scene};let triangles=0;
  for(const[key,b]of batches){const mesh=new T.InstancedMesh(b.g,b.m,b.items.length);mesh.name=scene.id+'-'+key;mesh.userData={features:[...b.features],detail:b.detail};mesh.castShadow=!b.detail&&['wood','limestone'].includes(key.split('|')[1]);mesh.receiveShadow=true;b.items.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.computeBoundingSphere();mesh.computeBoundingBox();group.add(mesh);triangles+=(b.g.index?.count||b.g.attributes.position.count)/3*b.items.length;}
  group.userData.stats={batches:group.children.length,triangles};chapters.push(group);root.add(group);
 }
 root.userData={area:0,scenes:EXPEDITION_SCENES.map(s=>({...s})),placements,solids,scenicOnly:false,stats:{batches:chapters.reduce((n,g)=>n+g.children.length,0),triangles:chapters.reduce((n,g)=>n+g.userData.stats.triangles,0)}};
 Object.defineProperty(root,'_composedState',{value:{chapters,flow},enumerable:false});return root;
}

export function updateExpeditionArt(root,{player={x:0,z:6},time=0,low=false,strength=0}={}){const state=root?._composedState;if(!state)return;state.flow.offset.y=-(Number.isFinite(time)?time:0)*.11%1;for(const g of state.chapters){const distance=Math.abs(player.z-g.userData.focus.z);g.visible=distance<(low?145:185);for(const mesh of g.children)if(mesh.userData.detail)mesh.visible=!low&&distance<85&&strength<.5;}}
