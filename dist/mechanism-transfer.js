import * as T from'./vendor/three.module.min.js';import{surfaceMaterial}from'./surface-materials.js';
export function transferPiece(type){
 const delivery=['sort','instructions','listen-multi'].includes(type),organic=['ending','intruder','spelling','listen-word'].includes(type),water=type==='gap',repair=['repair','correct'].includes(type),kind=delivery?'parcel':organic?'seed':water?'valve':repair?'key':'coupler';
 const root=new T.Group();root.name='accepted-'+kind;
 const material=surfaceMaterial(organic?'organic':delivery?'wood':'metal',organic?'#b3c989':delivery?'#aa8356':'#cfb67c'),dark=surfaceMaterial('metal','#635a43');
 const body=new T.Mesh(organic?new T.IcosahedronGeometry(.11,1):water?new T.TorusGeometry(.10,.025,5,12):new T.BoxGeometry(delivery?.22:.13,delivery?.17:.08,delivery?.18:.20),material);root.add(body);
 if(delivery){const band=new T.Mesh(new T.BoxGeometry(.035,.182,.192),dark);root.add(band);}else if(repair){const tooth=new T.Mesh(new T.BoxGeometry(.06,.12,.045),dark);tooth.position.set(.035,-.03,.075);root.add(tooth);}
 root.userData.kind=kind;root.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true;}});return root;
}
// Approach the socket from its front, then insert along its depth axis.
export function transferPose(effect,age){
 const t=Math.min(1,Math.max(0,age/.62)),travel=Math.min(1,t/.72),ease=travel*travel*(3-2*travel),mouth=effect.end.clone().addScaledVector(effect.axis,.23);
 const p=effect.start.clone().lerp(mouth,ease);p.y+=Math.sin(travel*Math.PI)*.20;
 if(t>.72){const seat=(t-.72)/.28;p.copy(mouth).lerp(effect.end,seat*seat*(3-2*seat));}
 return{position:p,done:t===1};
}
