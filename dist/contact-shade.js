import * as T from './vendor/three.module.min.js';
export function contactState({position,footY=0,support=0,radius=.3,height=.8,shadows=false,visible=true}){
 const gap=support===null?Infinity:Math.max(0,footY-support);
 return{visible:visible&&Number.isFinite(gap)&&gap<1.6,x:position.x,z:position.z,y:(support??0)+.035,
  width:Math.max(.5,radius*3.4)*(1+Math.min(1,gap)*.2),depth:Math.max(.4,Math.min(height*.85,radius*3.1)),opacity:(shadows?.12:.29)*Math.max(0,1-gap/1.6)};
}
export function makeContactShade(){
 const size=32,data=new Uint8Array(size*size*4);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const r=Math.hypot((x+.5)/size*2-1,(y+.5)/size*2-1),i=(y*size+x)*4;data[i]=data[i+1]=data[i+2]=17;data[i+3]=Math.round(255*Math.max(0,1-r*r)**2);}
 const map=new T.DataTexture(data,size,size,T.RGBAFormat);map.needsUpdate=true;map.magFilter=T.LinearFilter;map.minFilter=T.LinearFilter;
 const mesh=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,toneMapped:false,opacity:.29,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));mesh.name='partner-contact-shade';mesh.rotation.x=-Math.PI/2;mesh.castShadow=false;mesh.renderOrder=1;return mesh;
}
export function updateContactShade(mesh,options){const s=contactState(options);mesh.visible=s.visible;if(!s.visible)return;mesh.position.set(s.x,s.y,s.z);mesh.scale.set(s.width,s.depth,1);mesh.material.opacity=s.opacity;}
