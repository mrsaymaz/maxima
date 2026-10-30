import * as T from './vendor/three.module.min.js';
// Fade only scenery on a camera-to-plate ray. Never move the camera behind text.
// Visibility belongs to objects rather than shared materials, and is restored on exit.
export class TaskOcclusion{
 constructor(){this.hidden=new Map();this.signature='';this.ray=new T.Raycaster();}
 clear(){for(const[o,visible]of this.hidden)o.visible=visible;this.hidden.clear();this.signature='';}
 update(camera,stage,scenery){
  if(!stage?.root||!scenery){this.clear();return;}
  const signature=stage.id+'|'+stage.plan.height+'|'+stage.plan.width+'|'+camera.matrixWorld.elements.map(v=>v.toFixed(3)).join(',');
  if(signature===this.signature)return;
  this.clear();this.signature=signature;scenery.updateMatrixWorld(true);
  const points=[];for(const v of stage.entries.values())if(!v.entry.placed){points.push(v.mesh.localToWorld(new T.Vector3(0,0,.19)));if(v.entry.w>3.4)for(const x of[-.4,.4])points.push(v.mesh.localToWorld(new T.Vector3(v.entry.w*x,0,.19)));if(v.entry.h>1.8)for(const y of[-.35,.35])points.push(v.mesh.localToWorld(new T.Vector3(0,v.entry.h*y,.19)));}
  const candidates=[];scenery.traverseVisible(o=>{let own=false;for(let p=o;p;p=p.parent)if(p===stage.root||p===stage.mount?.root){own=true;break;}if(!own&&o.isMesh&&!o.userData.taskTransparent){if(o.isInstancedMesh){if(!o.boundingSphere)o.computeBoundingSphere();}else if(!o.geometry.boundingSphere)o.geometry.computeBoundingSphere();const sphere=(o.isInstancedMesh?o.boundingSphere:o.geometry.boundingSphere).clone().applyMatrix4(o.matrixWorld);candidates.push({o,sphere});}});
  for(const point of points){const direction=point.clone().sub(camera.position),distance=direction.length();this.ray.set(camera.position,direction.normalize());this.ray.far=Math.max(0,distance-.25);
   const meshes=candidates.filter(v=>this.ray.ray.intersectsSphere(v.sphere)).map(v=>v.o);
   for(const hit of this.ray.intersectObjects(meshes,false)){if(hit.distance>=this.ray.far)continue;const o=hit.object;if(!this.hidden.has(o)){this.hidden.set(o,o.visible);o.visible=false;}}
  }
 }
}
