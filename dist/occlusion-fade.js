import * as T from './vendor/three.module.min.js';

// Gates, arches, task stages and trial pieces must never hide the creature. Whatever mesh stands between the camera
// and the creature borrows a see-through copy of its material until the view clears. Ground-sized meshes (terrain,
// cliffs, paths), instanced crowds and the creature itself are left alone.
const ghosts=new WeakMap();
function ghost(material){
 let g=ghosts.get(material);
 if(!g){g=material.clone();g.transparent=true;g.opacity=.3*(material.opacity??1);g.depthWrite=false;ghosts.set(material,g);}
 return g;
}
const sphere=new T.Sphere();
export class OcclusionFade{
 constructor({maxRadius=14}={}){this.maxRadius=maxRadius;this.faded=new Map();this.ray=new T.Raycaster();}
 candidates(root,skip){
  const list=[],ray=this.ray.ray,far=this.ray.far;
  root.traverseVisible(o=>{
   if(!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh||!o.material||skip.has(o))return;
   for(let p=o.parent;p;p=p.parent)if(skip.has(p))return;
   const geometry=o.geometry;if(!geometry)return;if(!geometry.boundingSphere)geometry.computeBoundingSphere();
   sphere.copy(geometry.boundingSphere).applyMatrix4(o.matrixWorld);if(sphere.radius>this.maxRadius)return;
   const along=sphere.center.clone().sub(ray.origin).dot(ray.direction);
   if(along<-sphere.radius||along>far+sphere.radius||ray.distanceSqToPoint(sphere.center)>sphere.radius*sphere.radius)return;
   list.push(o);
  });
  return list;
 }
 // head and eye are world positions; skip holds objects (and their subtrees) that never fade.
 update(root,head,eye,skip=new Set()){
  const delta=eye.clone().sub(head),length=delta.length();
  const blocking=new Set();
  if(length>.3){
   this.ray.set(head,delta.multiplyScalar(1/length));this.ray.far=length-.15;
   for(const hit of this.ray.intersectObjects(this.candidates(root,skip),false))blocking.add(hit.object);
  }
  for(const [mesh,original] of this.faded)if(!blocking.has(mesh)){mesh.material=original;this.faded.delete(mesh);}
  for(const mesh of blocking)if(!this.faded.has(mesh)){this.faded.set(mesh,mesh.material);mesh.material=Array.isArray(mesh.material)?mesh.material.map(ghost):ghost(mesh.material);}
  return blocking.size;
 }
 clear(){for(const [mesh,original] of this.faded)mesh.material=original;this.faded.clear();}
}
