import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.min.js';
import * as kit from '../dist/environment-kit.js';

const budgets={rockFormation:320,treeTrunk:650,treeCanopy:500,fernCluster:450,fallenLog:420,masonryFragment:480};
const sizeOf=g=>g.boundingBox.getSize(new T.Vector3());
const positions=g=>g.attributes.position;
const bandRadius=(g,lo,hi)=>{const p=positions(g);let r=0;for(let i=0;i<p.count;i++)if(p.getY(i)>=lo&&p.getY(i)<=hi)r=Math.max(r,Math.hypot(p.getX(i),p.getZ(i)));return r;};
for(const [name,make]of Object.entries(kit)){
 test(`${name}: reusable compact geometry has finite attributes, unit normals and grounded bounds`,()=>{
  for(const variant of[0,1,2,7,-2]){
   const g=make(variant),p=positions(g),n=g.attributes.normal,c=g.attributes.color,uv=g.attributes.uv;
   assert.ok(g.isBufferGeometry);assert.equal(g.index,null);assert.equal(p.count%3,0);
   assert.equal(n.count,p.count);assert.equal(c.count,p.count);assert.equal(uv.count,p.count);
   assert.ok(p.count/3<=budgets[name],`${name} has ${p.count/3} triangles`);
   assert.ok(p.count/3>=150,'asset retains authored component detail');
   for(const a of[p,n,c,uv])for(const f of a.array)assert.ok(Number.isFinite(f));
   for(let i=0;i<p.count;i++){
    assert.ok(Math.abs(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))-1)<1e-5,'no degenerate faces');
    assert.equal(c.getX(i),c.getY(i));assert.equal(c.getY(i),c.getZ(i));assert.ok(c.getX(i)>=.4&&c.getX(i)<=1);
   }
   assert.ok(Math.abs(g.boundingBox.min.y)<1e-6,'all component bases share ground pivot');
   const size=sizeOf(g);assert.ok(size.x>.5&&size.y>.5&&size.z>.5);assert.ok(Math.max(size.x,size.y,size.z)<5);
   assert.ok(g.boundingSphere.radius<3);assert.equal(g.userData.family,'environment-kit');assert.equal(g.userData.variant,variant);assert.ok(g.userData.features.length>=3);
   // No negative scales in the local mesh and no missing bottom caps: some
   // root/base triangles must face down, while upper exposed surfaces face up.
   let down=0,up=0;for(let i=0;i<n.count;i++){if(n.getY(i)<-.5)down++;if(n.getY(i)>.5)up++;}assert.ok(down>0&&up>0);
   g.dispose();
  }
 });
 test(`${name}: variants change their silhouette deterministically and own independent buffers`,()=>{
  const a=make(0),b=make(1),again=make(0);assert.deepEqual(positions(a).array,positions(again).array);assert.notDeepEqual(positions(a).array,positions(b).array);assert.notEqual(positions(a).array,positions(again).array);
  const boundsA=a.boundingBox,boundsB=b.boundingBox;assert.notDeepEqual([...boundsA.min.toArray(),...boundsA.max.toArray()],[...boundsB.min.toArray(),...boundsB.max.toArray()]);
  a.dispose();b.dispose();again.dispose();
 });
}

test('rooted trunk, tiered canopy and irregular shelves provide shaped silhouettes',()=>{
 for(let v=0;v<3;v++){
  const trunk=kit.treeTrunk(v),canopy=kit.treeCanopy(v),rock=kit.rockFormation(v),fern=kit.fernCluster(v);
  assert.ok(bandRadius(trunk,0,.2)>bandRadius(trunk,.8,1.1)*1.6,'root flare wider than mid trunk');
  assert.ok(bandRadius(trunk,2.3,3.6)>.85,'branches reach beyond leader');
  assert.ok(bandRadius(canopy,.15,.75)>bandRadius(canopy,0,.08)*1.25,'canopy shoulders flare above its shaded base');
  assert.ok(sizeOf(canopy).x>3.3&&sizeOf(canopy).y>2.2,'multi-crown canopy has volume');
  assert.ok(bandRadius(rock,0,.3)>bandRadius(rock,1.2,1.7)*1.25,'shelved rock narrows toward crown');
  assert.ok(bandRadius(fern,.55,1.15)>.75,'fern has outward arching fronds');
  assert.ok(bandRadius(fern,0,.1)<.1,'fern grows from a compact central root');
  for(const g of[trunk,canopy,rock,fern])g.dispose();
 }
});

test('fallen timber follows X and broken masonry has exposed horizontal coping',()=>{
 const log=kit.fallenLog(),masonry=kit.masonryFragment(),l=sizeOf(log),m=sizeOf(masonry);
 assert.ok(l.x>l.y*3&&l.x>l.z*3,'log long axis is X');
 assert.ok(m.x>m.y&&m.y>m.z,'wall fragment is upright');
 const p=positions(masonry),n=masonry.attributes.normal;let top=0;for(let i=0;i<p.count;i++)if(p.getY(i)>1.2&&n.getY(i)>.75)top++;assert.ok(top>=12,'coping retains upward-facing chipped planes');
 log.dispose();masonry.dispose();
});
