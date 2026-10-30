// The look of each arena in one place: sky and light, terrain, environment kit, cliffs, banks and path edges.
// Colours are sRGB and tuned for the shared vivid tone curve (color-grade.js), so Low and Balanced look as bright
// and readable as High. Whisperwood is a sunny spring forest, Skyreach a bright plateau of sandstone and meadows,
// Stormglass a magical twilight of violet stone, teal moss and glowing water.
const freeze=o=>{for(const v of Object.values(o))if(v&&typeof v==='object')freeze(v);return Object.freeze(o);};
export const ARENA_LOOKS=freeze([
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
export const arenaLook=area=>ARENA_LOOKS[area|0]||ARENA_LOOKS[0];
