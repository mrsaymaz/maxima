import * as T from './vendor/three.module.min.js';
const leases=new WeakMap();
const materials=o=>o.material?(Array.isArray(o.material)?o.material:[o.material]):[];
export function textureSet(root){const textures=new Set();root?.traverse?.(o=>{for(const m of materials(o)){for(const value of Object.values(m))if(value?.isTexture)textures.add(value);for(const bag of[m.uniforms,m.userData?.ground])for(const uniform of Object.values(bag||{}))if(uniform?.value?.isTexture)textures.add(uniform.value);}});return textures;}
export function disposeResources(root,{geometry=true,textures=true,closeImages=false}={}){
 const geometries=new Set(),mats=new Set(),skeletons=new Set(),maps=new Set(),instances=new Set();
 root?.traverse?.(o=>{if(o.geometry)geometries.add(o.geometry);if(o.isInstancedMesh)instances.add(o);if(o.skeleton)skeletons.add(o.skeleton);for(const m of materials(o))if(!m.userData?.shared)mats.add(m);});
 for(const m of mats){for(const value of Object.values(m))if(value?.isTexture&&!value.userData?.shared)maps.add(value);for(const uniform of Object.values(m.uniforms||{}))if(uniform?.value?.isTexture&&!uniform.value.userData?.shared)maps.add(uniform.value);}
 for(const s of skeletons)s.dispose();for(const o of instances)o.dispose?.();
 if(geometry)for(const g of geometries)g.dispose();for(const m of mats)m.dispose();
 if(textures){const images=new Set();for(const t of maps){t.dispose();if(closeImages&&t.image?.close)images.add(t.image);}for(const image of images)image.close();}
 return{geometries:geometry?geometries.size:0,materials:mats.size,textures:textures?maps.size:0,skeletons:skeletons.size};
}
// Clone skeletons and materials, share immutable geometry/texture data under a lease.
export function cloneForm(form){
 const model=form.model.clone(true),pairs=new Map(),original=[],copies=[];form.model.traverse(o=>original.push(o));model.traverse(o=>copies.push(o));
 original.forEach((o,i)=>pairs.set(o,copies[i]));const mats=new Map();
 for(const o of original){const c=pairs.get(o);if(o.material){const clone=m=>{if(!mats.has(m))mats.set(m,m.clone());return mats.get(m);};c.material=Array.isArray(o.material)?o.material.map(clone):clone(o.material);}
  if(o.isSkinnedMesh){c.skeleton=o.skeleton.clone();c.skeleton.bones=o.skeleton.bones.map(b=>pairs.get(b));if(c.skeleton.bones.some(b=>!b))throw Error('A creature bone is outside its model');c.bindMatrix.copy(o.bindMatrix);c.bindMatrixInverse.copy(o.bindMatrixInverse);}
 }
 return{...form,model,attackProfile:(form.attackProfile||[]).map(p=>({...p,bone:pairs.get(p.bone)}))};
}
export function attachLease(form,release){leases.set(form.model,{release,closed:false});return form;}
export function releaseForm(root){const lease=leases.get(root);if(!lease)return false;if(!lease.closed){lease.closed=true;disposeResources(root,{geometry:false,textures:false});lease.release();}return true;}
export function estimatedTextureBytes(texture){
 if(texture.isCompressedTexture)return(texture.mipmaps||[]).reduce((n,m)=>n+(m.data?.byteLength||0),0);
 const image=texture.image||texture.source?.data,w=image?.width||0,h=image?.height||0,faces=Array.isArray(image)?6:1;
 const bytes=texture.type===T.FloatType?16:texture.type===T.HalfFloatType?8:4;
 return Math.ceil(w*h*faces*bytes*(texture.generateMipmaps?4/3:1));
}
