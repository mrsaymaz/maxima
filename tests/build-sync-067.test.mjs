import{test}from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import os from'node:os';import path from'node:path';import{execFileSync}from'node:child_process';
// dist/ holds built code committed for deployment. It must be exactly what scripts/build.mjs makes from src/.
test('the committed dist code is exactly a fresh build of src (run npm run build after editing src)',()=>{
 const out=fs.mkdtempSync(path.join(os.tmpdir(),'maxima-build-'));
 try{execFileSync(process.execPath,['scripts/build.mjs','--out',out,'--no-offline'],{stdio:'pipe'});
  const code=dir=>fs.readdirSync(dir).filter(f=>/\.(js|css|html)$/.test(f)).sort();
  assert.deepEqual(code('dist'),code(out),'the same built files');
  for(const f of code(out))assert.ok(fs.readFileSync(path.join(out,f)).equals(fs.readFileSync(path.join('dist',f))),`dist/${f} is stale: run npm run build`);
  const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
  for(const f of walk('src/vendor'))assert.ok(fs.readFileSync(f).equals(fs.readFileSync(f.replace(/^src/,'dist'))),`${f} differs in dist`);
 }finally{fs.rmSync(out,{recursive:true,force:true});}
});
test('authoring sources and retired code stay out of the deploy',()=>{
 for(const p of['dist/assets/creatures','dist/assets/rigs','dist/data/expedition-language.json','dist/data/units.json','dist/data/curriculum','dist/app.js','dist/runner-save.js'])assert.equal(fs.existsSync(p),false,p);
 assert.ok(fs.readdirSync('dist/assets/portraits').every(f=>f.endsWith('.webp')));
 assert.ok(fs.existsSync('art/creatures/hufflepuff-0.glb')&&fs.existsSync('art/rigs/ravenclaw-0.gltf')&&fs.existsSync('content/data/expedition-language.json'));
});
