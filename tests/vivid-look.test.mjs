import{test}from'node:test';import assert from'node:assert/strict';import * as T from'../dist/vendor/three.module.min.js';
import{ARENA_LOOKS,arenaLook}from'../dist/arena-palette.js';import{installVividToneMapping,VIVID_GRADE_GLSL}from'../dist/color-grade.js';
import{applyGraphics}from'../dist/render-quality.js';import{ENVIRONMENT_LIGHTING}from'../dist/environment-field.js';import{environmentPalette}from'../dist/environment-materials.js';
import{SKY_ZENITH}from'../dist/world-style.js';import{CLIFF_TINTS}from'../dist/cliff-art.js';import{terrainTint}from'../dist/valley-terrain.js';

const hsl=c=>{const o={};new T.Color(c).getHSL(o);return o;};
test('each arena look is complete, frozen and actually used by sky, light, kit, terrain and cliffs',()=>{
 assert.equal(ARENA_LOOKS.length,3);assert.ok(Object.isFrozen(ARENA_LOOKS[0].kit));assert.equal(arenaLook(5),ARENA_LOOKS[0]);
 for(let a=0;a<3;a++){const look=ARENA_LOOKS[a];assert.equal(ENVIRONMENT_LIGHTING[a],look.lighting);assert.equal(SKY_ZENITH[a],look.zenith);assert.deepEqual({...environmentPalette(a).colors},{...look.kit});assert.equal(CLIFF_TINTS[a],look.cliffs);
  for(const key of['sky','fog','hemisphereSky','hemisphereGround','sun'])assert.match(look.lighting[key],/^#[0-9a-f]{6}$/);
  // Vivid but readable: grass and foliage are clearly coloured, the sky is clearly blue/violet, not grey.
  assert.ok(hsl(look.terrain.low).s>.35,`${look.id} grass saturation`);assert.ok(hsl(look.kit.leaf).s>.4,`${look.id} leaf saturation`);assert.ok(hsl(look.zenith).s>.45,`${look.id} sky saturation`);
  const t=terrainTint(0,-40,0,a);assert.ok(Number.isFinite(t.r+t.g+t.b));}
 assert.equal(new Set(ARENA_LOOKS.map(l=>l.zenith)).size,3);
});
test('every preset uses the vivid tone curve instead of ACES',()=>{
 const renderer={toneMapping:T.ACESFilmicToneMapping};assert.ok(installVividToneMapping(renderer));assert.equal(renderer.toneMapping,T.CustomToneMapping);
 assert.ok(T.ShaderChunk.tonemapping_pars_fragment.includes('maximaVivid( color, toneMappingExposure )'));assert.ok(VIVID_GRADE_GLSL.includes('#ifndef MAXIMA_VIVID'));
 installVividToneMapping(renderer);assert.equal(T.ShaderChunk.tonemapping_pars_fragment.split('vec3 maximaVivid(').length,2,'installed once');
});
test('turning shadows off also stops the sun casting, so Low is not left in a stale shadow',()=>{
 const world={renderer:{setPixelRatio(){},shadowMap:{}},sun:{castShadow:true,shadow:{mapSize:{x:512,set(){}},map:null}},resize(){},dressing:{visible:true},edgeGrassMesh:{visible:true,userData:{total:10}}};
 applyGraphics(world,{preset:'low'},1);assert.equal(world.renderer.shadowMap.enabled,false);assert.equal(world.sun.castShadow,false);
 applyGraphics(world,{preset:'balanced'},1);assert.equal(world.renderer.shadowMap.enabled,true);assert.equal(world.sun.castShadow,true);
});
