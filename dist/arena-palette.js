// The look of each arena in one place: sky and light, terrain, environment kit, cliffs, banks and path edges.
// Colours are sRGB and tuned for the shared vivid tone curve (color-grade.js), so Low and Balanced look as bright
// and readable as High. Whisperwood is a sunny spring forest, Skyreach a bright plateau of sandstone and meadows,
// Stormglass a magical twilight of violet stone, teal moss and glowing water.
import{BRICK_WORLD}from'./world-style-mode.js';
const freeze=o=>{for(const v of Object.values(o))if(v&&typeof v==='object')freeze(v);return Object.freeze(o);};
const CLASSIC_LOOKS=freeze([
 {id:'whisperwood',
  lighting:{sky:'#a9dcf5',fog:'#cdeaf2',hemisphereSky:'#e3f4ff',hemisphereGround:'#5f8a3e',hemisphereIntensity:1.32,sun:'#fff0cc',sunIntensity:3.15,exposure:.98,near:36,far:132},
  zenith:'#4c9fe3',
  terrain:{low:'#5ea844',high:'#a3c95a',route:'#78b54c'},
  kit:{rock:'#a99b80',rockTop:'#86b957',bark:'#7a5638',leaf:'#3f9845',leafLight:'#8fcd4e',fern:'#5bb049',timber:'#a87a4c',masonry:'#d6c49a',soil:'#cdb388',damp:'#a38d5f',water:'#39c0d4',foam:'#effcff',metal:'#d6a648'},
  cliffs:{rock:'#c3a780',moss:'#6eb04a',grass:'#7cc058',dark:'#7b664e',leaf:'#4f9e45'},
  banks:{earth:'#a8895c',moss:'#6aa948'},
  edgeGrass:'#5aa846',pathStone:'#c2b28c',pathWood:'#8a6544'},
 {id:'skyreach',
  lighting:{sky:'#9fd6fb',fog:'#d6effc',hemisphereSky:'#eaf7ff',hemisphereGround:'#8aa766',hemisphereIntensity:1.4,sun:'#fff5da',sunIntensity:3.25,exposure:1.0,near:42,far:150},
  zenith:'#3e98ea',
  terrain:{low:'#88c457',high:'#d6d088',route:'#a5cc66'},
  kit:{rock:'#dcc7a2',rockTop:'#a6cf66',bark:'#8a6c4f',leaf:'#5cb574',leafLight:'#b6de76',fern:'#79c166',timber:'#b78c5a',masonry:'#f1e2bd',soil:'#d8c59a',damp:'#b8a37a',water:'#46c6ea',foam:'#f4fdff',metal:'#e2b24e'},
  cliffs:{rock:'#e4cfa8',moss:'#9acd68',grass:'#a6d36f',dark:'#9a8364',leaf:'#6fbe72'},
  banks:{earth:'#c8ad7c',moss:'#93c865'},
  edgeGrass:'#88c457',pathStone:'#e0cfa6',pathWood:'#9c7a52'},
 {id:'stormglass',
  lighting:{sky:'#b7a8e6',fog:'#b9aee0',hemisphereSky:'#d8ccff',hemisphereGround:'#3c6070',hemisphereIntensity:1.3,sun:'#ffd6ea',sunIntensity:2.85,exposure:1.04,near:30,far:122},
  zenith:'#3a2f86',
  terrain:{low:'#3d9284',high:'#7d74c6',route:'#4ca796'},
  kit:{rock:'#6c60ad',rockTop:'#4db7a3',bark:'#5b4f7c',leaf:'#3aa69e',leafLight:'#7fe2c6',fern:'#4cb8a7',timber:'#71649a',masonry:'#a99de2',soil:'#9a92bd',damp:'#8b7dbb',water:'#5be0ff',foam:'#e9fbff',metal:'#ffd27a'},
  cliffs:{rock:'#7a6cbc',moss:'#4cb19e',grass:'#5abfa7',dark:'#433a70',leaf:'#3fa89c'},
  banks:{earth:'#6f63a6',moss:'#4cad99'},
  edgeGrass:'#45a593',pathStone:'#b9addf',pathWood:'#6f6396'}
]);

// Toy-brick prototype. Each arena is built from its own set of brick colours (with a darker shade of each for
// depth); every surface is snapped to the nearest one by brick-style.js. Crystal is see-through plastic.
export const BRICK_COLORS=freeze([
 {id:'whisperwood',bricks:{green:'#2f9e44',darkGreen:'#1f6f35',lime:'#79c142',yellow:'#f5c518',ochre:'#c98d16',blue:'#1f72d2',darkBlue:'#17509c',white:'#f3f2ec',lightGrey:'#b8bcb6'}},
 {id:'skyreach',bricks:{tan:'#dcbd7e',darkTan:'#a9874f',skyBlue:'#72c4ef',deepSky:'#3a94cf',red:'#d4372d',darkRed:'#992220',white:'#f5f2ea',pink:'#f49cc3',rose:'#d0679b'}},
 {id:'stormglass',bricks:{purple:'#7c50c6',darkPurple:'#4c2e8c',lavender:'#b39be6',teal:'#1db3a3',darkTeal:'#11766f',green:'#4cbd4b',darkGreen:'#2a7c36'},crystal:'#c9f3ff'}
]);
const B=BRICK_COLORS.map(a=>a.bricks);
const BRICK_LOOKS=freeze([
 {id:'whisperwood',
  lighting:{sky:'#9fd8f7',fog:'#cfeaf6',hemisphereSky:'#eef8ff',hemisphereGround:'#4f8c3a',hemisphereIntensity:1.38,sun:'#fff4dc',sunIntensity:3.2,exposure:1,near:38,far:136},
  zenith:'#3f97e6',
  terrain:{low:B[0].green,high:B[0].lime,route:B[0].yellow},
  kit:{rock:B[0].white,rockTop:B[0].green,bark:B[0].ochre,leaf:B[0].green,leafLight:B[0].lime,fern:B[0].darkGreen,timber:B[0].ochre,masonry:B[0].white,soil:B[0].yellow,damp:B[0].ochre,water:B[0].blue,foam:B[0].white,metal:B[0].yellow},
  cliffs:{rock:B[0].white,moss:B[0].green,grass:B[0].lime,dark:B[0].lightGrey,leaf:B[0].green},
  banks:{earth:B[0].lightGrey,moss:B[0].green},
  edgeGrass:B[0].darkGreen,pathStone:B[0].white,pathWood:B[0].ochre},
 {id:'skyreach',
  lighting:{sky:'#a6dcfb',fog:'#dcf1fd',hemisphereSky:'#f2faff',hemisphereGround:'#b39363',hemisphereIntensity:1.42,sun:'#fff6e2',sunIntensity:3.25,exposure:1,near:42,far:150},
  zenith:'#3d96e8',
  terrain:{low:B[1].tan,high:B[1].white,route:B[1].white},
  kit:{rock:B[1].tan,rockTop:B[1].pink,bark:B[1].darkTan,leaf:B[1].pink,leafLight:B[1].rose,fern:B[1].red,timber:B[1].red,masonry:B[1].white,soil:B[1].white,damp:B[1].darkTan,water:B[1].skyBlue,foam:B[1].white,metal:B[1].red},
  cliffs:{rock:B[1].tan,moss:B[1].pink,grass:B[1].white,dark:B[1].darkTan,leaf:B[1].pink},
  banks:{earth:B[1].darkTan,moss:B[1].pink},
  edgeGrass:B[1].rose,pathStone:B[1].white,pathWood:B[1].red},
 {id:'stormglass',
  lighting:{sky:'#b4a2ea',fog:'#bcaee6',hemisphereSky:'#e0d4ff',hemisphereGround:'#3a5f6e',hemisphereIntensity:1.34,sun:'#ffe0f0',sunIntensity:2.95,exposure:1.04,near:32,far:124},
  zenith:'#3a2c8c',
  terrain:{low:B[2].darkPurple,high:B[2].purple,route:B[2].teal},
  kit:{rock:B[2].purple,rockTop:B[2].green,bark:B[2].darkPurple,leaf:B[2].teal,leafLight:B[2].green,fern:B[2].darkGreen,timber:B[2].darkTeal,masonry:BRICK_COLORS[2].crystal,soil:B[2].lavender,damp:B[2].purple,water:BRICK_COLORS[2].crystal,foam:B[2].lavender,metal:B[2].green},
  cliffs:{rock:B[2].purple,moss:B[2].teal,grass:B[2].green,dark:B[2].darkPurple,leaf:B[2].teal},
  banks:{earth:B[2].darkPurple,moss:B[2].teal},
  edgeGrass:B[2].darkGreen,pathStone:B[2].lavender,pathWood:B[2].darkTeal}
]);
export const ARENA_LOOKS=BRICK_WORLD?BRICK_LOOKS:CLASSIC_LOOKS;
export const arenaLook=area=>ARENA_LOOKS[area|0]||ARENA_LOOKS[0];
