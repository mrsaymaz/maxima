import * as T from './vendor/three.module.min.js';
import {surfaceMaterial} from './surface-materials.js';

// Colours are authored in sRGB. Vertex colours remain available for the kit's
// contact AO; restrained maps add broad painted variation without shader hooks.
const PALETTES=Object.freeze([
 {id:'whisperwood',title:'Whisperwood',colors:{rock:'#7e8470',rockTop:'#929b77',bark:'#75634b',leaf:'#68824d',leafLight:'#9baa68',fern:'#78935c',timber:'#9a7955',masonry:'#a89f81',soil:'#8a7452',damp:'#5d6b54',water:'#6baba2',foam:'#d9ead4',metal:'#b99a56'}},
 {id:'skyreach',title:'Skyreach',colors:{rock:'#8a9896',rockTop:'#b2bba7',bark:'#7b8070',leaf:'#879e87',leafLight:'#bec9a8',fern:'#9aad8d',timber:'#a18d69',masonry:'#d0c9ae',soil:'#a29b7c',damp:'#718781',water:'#82b9bd',foam:'#e6ecdc',metal:'#b79860'}},
 {id:'stormglass',title:'Stormglass',colors:{rock:'#5b6c83',rockTop:'#8795a5',bark:'#687685',leaf:'#96aab1',leafLight:'#c0ccca',fern:'#9dafb9',timber:'#7e8790',masonry:'#8e9dad',soil:'#68798a',damp:'#455c70',water:'#719fb7',foam:'#d7e6eb',metal:'#aab9c6'}}
].map(p=>Object.freeze({...p,colors:Object.freeze(p.colors)})));
const ROLES=Object.freeze({rock:'stone',rockTop:'stone',bark:'wood',leaf:'foliage',leafLight:'foliage',fern:'foliage',timber:'wood',masonry:'stone',soil:'soil',damp:'soil',water:'water',foam:'water',metal:'metal'});
const FLAT=new Set(['rock','rockTop','leaf','leafLight','fern']);
const CACHE=new Map(),TAU=Math.PI*2,SIZE=64;
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));

export function environmentPalette(area=0){
 if(!Number.isInteger(area)||area<0||area>=PALETTES.length)throw new RangeError('Unknown environment arena: '+area);
 return PALETTES[area];
}

function paintedTexture(kind,area){
 const data=new Uint8Array(SIZE*SIZE*4);
 // Integer periodic harmonics make all four edges agree, including the
 // staggered masonry courses. No random speckle or downloaded texture assets.
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
  const u=x/(SIZE-1),v=y/(SIZE-1),a=TAU*u,b=TAU*v;
  const broad=.5+.5*Math.sin(a+Math.sin(b)*.38)*Math.cos(b);
  let tone=.94;
  if(kind==='rock'){
   const strata=.5+.5*Math.sin(b*(area===2?7:4)+.38*Math.sin(a*2));
   const seam=Math.max(0,Math.cos(b*(area===2?7:4)+.38*Math.sin(a*2))-.965)/.035;
   const fissure=Math.max(0,Math.cos(a*3+.45*Math.sin(b*2))-.985)/.015;
   tone=.91+.065*broad+.026*strata-.075*seam-.035*fissure;
  }else if(kind==='masonry'){
   const row=Math.floor(v*4),course=Math.abs(Math.sin(b*2));
   const joint=Math.abs(Math.sin(a*3+(row%2)*Math.PI/2));
   const mortar=Math.max(clamp((.11-course)/.11,0,1),clamp((.085-joint)/.085,0,1));
   tone=.93+.05*broad-.11*mortar;
  }else if(kind==='timber'){
   const grain=.5+.5*Math.sin(a*6+.35*Math.sin(b)+.10*Math.sin(b*3));
   const ridge=Math.max(0,Math.cos(a*6+.35*Math.sin(b))-.97)/.03;
   tone=.91+.05*broad+.035*grain-.045*ridge;
  }else{
   const ripple=.5+.5*Math.sin(b*3+.35*Math.sin(a*2));
   tone=.94+.035*broad+.025*ripple;
  }
  const i=(y*SIZE+x)*4,value=Math.round(clamp(tone,.76,1)*255);
  data[i]=value;data[i+1]=value;data[i+2]=value;data[i+3]=255;
 }
 const texture=new T.DataTexture(data,SIZE,SIZE,T.RGBAFormat,T.UnsignedByteType);
 texture.name=`environment-${area}-${kind}`;texture.colorSpace=T.SRGBColorSpace;
 texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.magFilter=T.LinearFilter;
 texture.minFilter=T.LinearMipmapLinearFilter;texture.generateMipmaps=true;
 texture.userData={shared:true,environmentTexture:true,arena:area,pattern:kind};
 texture.needsUpdate=true;return texture;
}

function texturesFor(area){
 if(!CACHE.has(area)){
  const rock=paintedTexture('rock',area),masonry=paintedTexture('masonry',area),timber=paintedTexture('timber',area),water=paintedTexture('water',area);
  CACHE.set(area,{rock,masonry,timber,water,flow:Object.freeze({texture:water,speedX:area===2?.006:.009,speedY:area===0?-.018:-.014})});
 }
 return CACHE.get(area);
}

export function makeEnvironmentMaterials(area=0){
 const palette=environmentPalette(area),textures=texturesFor(area),materials={};
 for(const [name,role]of Object.entries(ROLES)){
  const material=surfaceMaterial(role,palette.colors[name],{vertexColors:true,flatShading:FLAT.has(name),transparent:false,opacity:1,emissive:'#000000',emissiveIntensity:0});
  material.name=`environment-${palette.id}-${name}`;
  material.userData.environmentRole=name;material.userData.environmentArena=area;
  // Material ownership belongs to the kit instance; only the map is shared.
  if(name==='rock'||name==='rockTop')material.map=textures.rock;
  else if(name==='masonry')material.map=textures.masonry;
  else if(name==='timber'||name==='bark')material.map=textures.timber;
  else if(name==='water'){
   material.map=textures.water;material.roughness=.32;
   material.userData.environmentFlow=textures.flow;
  }else if(name==='foam')material.roughness=.78;
  else if(name==='metal'){material.roughness=.48;material.metalness=.34;}
  materials[name]=material;
 }
 return materials;
}
