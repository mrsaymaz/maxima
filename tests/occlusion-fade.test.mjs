import{test}from'node:test';import assert from'node:assert/strict';import * as T from'../dist/vendor/three.module.min.js';
import{OcclusionFade}from'../dist/occlusion-fade.js';

test('meshes between camera and creature turn see-through and recover once the view clears',()=>{
 const scene=new T.Scene(),material=new T.MeshStandardMaterial({color:'#aa8866'});
 const slab=new T.Mesh(new T.BoxGeometry(4,.6,.4),material);slab.position.set(0,2,3);
 const ground=new T.Mesh(new T.PlaneGeometry(200,200),material);ground.rotation.x=-Math.PI/2;
 const creature=new T.Mesh(new T.BoxGeometry(1,1,1),material);creature.position.set(0,1,0);
 const crowd=new T.InstancedMesh(new T.BoxGeometry(1,1,1),material,1);crowd.position.set(0,2.1,4);
 scene.add(slab,ground,creature,crowd);scene.updateMatrixWorld(true);
 const fade=new OcclusionFade(),head=new T.Vector3(0,1,0),eye=new T.Vector3(0,3,6);
 assert.equal(fade.update(scene,head,eye,new Set([creature])),1,'only the slab blocks; ground, creature and instanced crowds never fade');
 assert.notEqual(slab.material,material);assert.ok(slab.material.transparent&&slab.material.opacity<.5&&!slab.material.depthWrite);assert.equal(material.opacity,1,'the shared material is untouched');
 slab.position.x=8;scene.updateMatrixWorld(true);assert.equal(fade.update(scene,head,eye,new Set([creature])),0);assert.equal(slab.material,material,'restored once clear');
 slab.position.x=0;scene.updateMatrixWorld(true);fade.update(scene,head,eye);fade.clear();assert.equal(slab.material,material);
});
