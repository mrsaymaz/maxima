import{test}from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
import{CREATURE_WEB}from'../dist/creature-web-assets.js';
import{creatureAsset,runtimeCreatureAsset}from'../dist/world-layout.js';
import{configureModelDecoders,compressedModelsReady}from'../dist/asset-cache.js';
const json=file=>{const b=fs.readFileSync(file);if(file.endsWith('.gltf'))return JSON.parse(b);return JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));};
const PARTNERS=['gryffindor','hufflepuff','ravenclaw','slytherin'];
test('every Level of every team has a compressed runtime model with meshopt geometry and a KTX2 texture',()=>{
 assert.equal(Object.keys(CREATURE_WEB).length,44);
 for(const id of PARTNERS)for(let level=0;level<=10;level++){const file=CREATURE_WEB[`${id}-${level}`];assert.match(file,/^assets\/creatures-web\/[a-z]+-\d+\.[0-9a-f]{10}\.glb$/);assert.equal(runtimeCreatureAsset(level,id),file);
  const j=json('dist/'+file);for(const e of['EXT_meshopt_compression','KHR_mesh_quantization','KHR_texture_basisu'])assert.ok(j.extensionsRequired.includes(e),`${file} ${e}`);assert.deepEqual(j.images.map(i=>i.mimeType),['image/ktx2']);}
});
test('runtime models keep the locomotion and rig data, animation and bone names of the asset the game loaded before',()=>{
 for(const id of PARTNERS)for(let level=0;level<=10;level++){const src=json('dist/'+creatureAsset(level,id).split('?')[0]),out=json('dist/'+CREATURE_WEB[`${id}-${level}`]);
  assert.deepEqual(out.extras,src.extras,`${id}-${level} extras`);assert.ok(out.extras?.maximaLocomotion,`${id}-${level} locomotion`);
  assert.deepEqual(out.animations.map(a=>a.name).sort(),src.animations.map(a=>a.name).sort());assert.deepEqual(out.nodes.map(n=>n.name).filter(Boolean).sort(),src.nodes.map(n=>n.name).filter(Boolean).sort());}
});
test('the compressed set is at least 70% smaller than the sources and every file is under 600 KB',()=>{
 const report=JSON.parse(fs.readFileSync('docs/CREATURE-COMPRESSION.json'));let total=0;
 for(const f of Object.values(CREATURE_WEB)){const n=fs.statSync('dist/'+f).size;assert.ok(n<600_000,`${f} ${n}`);total+=n;}
 assert.equal(total,report.runtimeBytes);assert.ok(total<report.sourceBytes*.3,`${total} of ${report.sourceBytes}`);
});
test('the decoders and transcoder ship with the game and are cached for offline play',()=>{const shell=JSON.parse(fs.readFileSync('dist/offline-shell.json')).files;
 for(const f of['vendor/loaders/KTX2Loader.js','vendor/libs/meshopt_decoder.module.js','vendor/libs/basis/basis_transcoder.js','vendor/libs/basis/basis_transcoder.wasm','creature-web-assets.js'])assert.ok(shell.includes(f),f);
 assert.equal(compressedModelsReady(),false,'without a renderer or WebGL, the game keeps loading the source models');assert.equal(configureModelDecoders(null),false);
});
