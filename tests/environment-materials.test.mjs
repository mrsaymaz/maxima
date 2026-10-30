import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.min.js';
import {environmentPalette,makeEnvironmentMaterials} from '../dist/environment-materials.js';
import {propKind,stylizeProps} from '../dist/world-style.js';

const names=['rock','rockTop','bark','leaf','leafLight','fern','timber','masonry','soil','damp','water','foam','metal'];
const roles={rock:'stone',rockTop:'stone',bark:'wood',leaf:'foliage',leafLight:'foliage',fern:'foliage',timber:'wood',masonry:'stone',soil:'soil',damp:'soil',water:'water',foam:'water',metal:'metal'};

test('three immutable palettes have distinct arena identities and all thirteen colours',()=>{
 const palettes=[0,1,2].map(environmentPalette);assert.equal(new Set(palettes.map(p=>p.id)).size,3);assert.equal(new Set(palettes.map(p=>p.colors.rock)).size,3);assert.equal(new Set(palettes.map(p=>p.colors.leaf)).size,3);
 for(let area=0;area<3;area++){const p=palettes[area];assert.equal(environmentPalette(area),p);assert.ok(Object.isFrozen(p)&&Object.isFrozen(p.colors));assert.deepEqual(Object.keys(p.colors),names);for(const color of Object.values(p.colors))assert.match(color,/^#[0-9a-f]{6}$/i);}
 for(const area of[-1,3,.5,null,'1',NaN])assert.throws(()=>environmentPalette(area),RangeError);
});

test('kit materials retain semantic surfaces, vertex AO and deliberate flat versus smooth shading',()=>{
 for(const area of[0,1,2]){const m=makeEnvironmentMaterials(area);assert.deepEqual(Object.keys(m),names);for(const name of names){assert.ok(m[name].isMeshStandardMaterial);assert.equal(m[name].userData.surface,roles[name]);assert.equal(m[name].userData.environmentRole,name);assert.equal(m[name].vertexColors,true);assert.equal(m[name].flatShading,['rock','rockTop','leaf','leafLight','fern'].includes(name));assert.equal(m[name].transparent,false);assert.equal(m[name].opacity,1);assert.equal(m[name].emissiveIntensity,0);assert.ok(m[name].roughness>=.3&&m[name].roughness<=1);assert.equal(m[name].color.getHexString(),environmentPalette(area).colors[name].slice(1));}assert.ok(m.metal.metalness>0&&m.metal.metalness<.5);for(const material of Object.values(m))material.dispose();}
});

test('small cached colour maps are finite, opaque, sRGB and seamless in both directions',()=>{
 for(const area of[0,1,2]){const a=makeEnvironmentMaterials(area),b=makeEnvironmentMaterials(area),maps=new Set(Object.values(a).flatMap(m=>m.map?[m.map]:[]));assert.equal(maps.size,4);for(const map of maps){assert.ok(map.isDataTexture);assert.equal(map.colorSpace,T.SRGBColorSpace);assert.equal(map.wrapS,T.RepeatWrapping);assert.equal(map.wrapT,T.RepeatWrapping);assert.equal(map.userData.shared,true);assert.equal(map.image.width,64);assert.equal(map.image.height,64);assert.ok(map.image.width*map.image.height<=4096);const data=map.image.data,w=map.image.width,h=map.image.height;assert.equal(data.length,w*h*4);assert.ok(data.every(Number.isFinite));for(let i=0;i<w*h;i++){assert.equal(data[i*4+3],255);assert.ok(data[i*4]>=190);}for(let y=0;y<h;y++)for(let c=0;c<4;c++)assert.equal(data[(y*w)*4+c],data[(y*w+w-1)*4+c]);for(let x=0;x<w;x++)for(let c=0;c<4;c++)assert.equal(data[x*4+c],data[((h-1)*w+x)*4+c]);assert.ok(new Set(data.filter((_,i)=>i%4===0)).size>10);}
  for(const name of names){assert.notEqual(a[name],b[name]);if(a[name].map)assert.equal(a[name].map,b[name].map);}assert.equal(a.bark.map,a.timber.map);assert.equal(a.rockTop.map,a.rock.map);assert.notEqual(a.rock.map,a.masonry.map);for(const m of [...Object.values(a),...Object.values(b)])m.dispose();}
});

test('mapped kit surfaces bypass procedural shader rewrites and material disposal leaves shared maps alive',()=>{
 const m=makeEnvironmentMaterials(),group=new T.Group(),geometry=new T.BoxGeometry(1,1,1);for(const name of['rock','rockTop','masonry','bark','timber','water']){assert.equal(propKind(m[name]),null);group.add(new T.Mesh(geometry,m[name]));}const before=Object.values(m).map(v=>v.onBeforeCompile);assert.equal(stylizeProps(group),0);assert.deepEqual(Object.values(m).map(v=>v.onBeforeCompile),before);let disposed=0;for(const map of new Set(Object.values(m).flatMap(v=>v.map?[v.map]:[])))map.addEventListener('dispose',()=>disposed++);for(const material of Object.values(m))material.dispose();assert.equal(disposed,0);geometry.dispose();
});

test('water flow exposes inexpensive absolute-time offsets without allocating or owning kit materials',()=>{
 for(const area of[0,1,2]){const a=makeEnvironmentMaterials(area),b=makeEnvironmentMaterials(area),flow=a.water.userData.environmentFlow;assert.ok(Object.isFrozen(flow));assert.equal(flow,b.water.userData.environmentFlow);assert.equal(flow.texture,a.water.map);assert.ok(Number.isFinite(flow.speedX)&&Number.isFinite(flow.speedY));assert.ok(Math.abs(flow.speedX)<.03&&Math.abs(flow.speedY)<.03);assert.equal(a.foam.userData.environmentFlow,undefined);for(const material of [...Object.values(a),...Object.values(b)])material.dispose();}
});
