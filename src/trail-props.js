import { surfaceMaterial, assignSurfaceRoles, replaceCueMaterials } from './surface-materials.js';
import { bevelBox, carvedCylinder } from './prop-art.js';
import * as T from './vendor/three.module.min.js';

// One recognisable prop family per language activity. Content labels belong to the
// encounter UI; these assets carry the physical change made by accepted work.
const STATES = new WeakMap();
const clamp = n => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
const PALETTES = [
  { stone: '#a4b29a', pale: '#e2d4ad', moss: '#6f965e', leaf: '#5d8955', dark: '#345544', accent: '#a8e5cf' },
  { stone: '#a8bab9', pale: '#e6debe', moss: '#7f9d83', leaf: '#669c8a', dark: '#3b5a5d', accent: '#bceaf0' },
  { stone: '#8e93aa', pale: '#d7d1c2', moss: '#7c8c9b', leaf: '#687a8b', dark: '#424b6c', accent: '#cec4f6' },
];
export const TRAIL_PROP_TYPES = [
  'translation',
  'definition',
  'picture',
  'qa-pairs',
  'halves',
  'ending',
  'sentence',
  'gap',
  'correct',
  'repair',
  'answer',
  'sort',
  'intruder',
  'spelling',
  'clue',
  'listen-word',
  'listen-tr',
  'listen-multi',
  'numbers',
  'instructions',
];

function context(type, area) {
  const group = new T.Group(),
    palette = PALETTES[area] || PALETTES[0],
    materials = new Map(),
    geometries = new Map(),
    updates = [];
  group.name = 'trail-prop-' + type;
  group.userData = { type, progress: 0, completed: false, progressable: true, focusHeight: 1.1, solidRadius: 1.55 };
  const mat = (name, color, extra = {}) => {
    if (!materials.has(name)) materials.set(name, surfaceMaterial('stone', color, extra));
    return materials.get(name);
  };
  const m = {
    wood: mat('wood', '#92775b'),
    woodLight: mat('woodLight', '#b89c70'),
    bark: mat('bark', '#74634c'),
    stone: mat('stone', palette.stone),
    pale: mat('pale', palette.pale),
    moss: mat('moss', palette.moss),
    leaf: mat('leaf', palette.leaf),
    dark: mat('dark', palette.dark),
    gold: mat('gold', '#d7b36b', { metalness: 0.28, roughness: 0.43 }),
    air: mat('air', palette.accent, { emissive: palette.accent, emissiveIntensity: 0.72, roughness: 0.42 }),
    water: mat('water', '#6cc3c0', { roughness: 0.22, metalness: 0.1 }),
    fruit: mat('fruit', '#e1aa5a'),
    red: mat('red', '#d18d72'),
    corrupt: mat('corrupt', '#7c6a93', { emissive: '#514365', emissiveIntensity: 0.15 }),
    cream: mat('cream', '#ead9b3'),
    eye: mat('eye', '#203c35', { roughness: 0.3 }),
  };
  assignSurfaceRoles(m, {
    wood: ['wood', 'woodLight', 'bark'],
    stone: ['stone', 'pale', 'dark'],
    foliage: ['moss', 'leaf'],
    metal: ['gold'],
    effect: ['air'],
    water: ['water'],
    organic: ['fruit', 'red', 'corrupt', 'cream', 'eye'],
  });
  const geo = (key, make) => {
    if (!geometries.has(key)) geometries.set(key, make());
    return geometries.get(key);
  };
  const box = (w, h, d) => geo(`b:${w}:${h}:${d}`, () => bevelBox(w, h, d));
  const sphere = (r = 0.2) => geo(`s:${r}`, () => new T.SphereGeometry(r, 10, 7));
  const cyl = (a, b, h, n = 10) => geo(`c:${a}:${b}:${h}:${n}`, () => carvedCylinder(a, b, h, n));
  const cone = (r, h, n = 7) => geo(`co:${r}:${h}:${n}`, () => new T.ConeGeometry(r, h, n));
  const octa = r => geo(`o:${r}`, () => new T.OctahedronGeometry(r, 0));
  const torus = (r, t = 0.025, arc = Math.PI * 2) =>
    geo(`t:${r}:${t}:${arc}`, () => new T.TorusGeometry(r, t, 5, 32, arc));
  const mesh = (geometry, material, x = 0, y = 0, z = 0, parent = group) => {
    const o = new T.Mesh(geometry, material);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  };
  const part = (name, parent = group) => {
    const g = new T.Group();
    g.name = name;
    parent.add(g);
    return g;
  };
  const link = (a, b, r, material, parent = group) => {
    const av = new T.Vector3(...a),
      bv = new T.Vector3(...b),
      d = bv.clone().sub(av),
      o = mesh(cyl(r, r, d.length(), 6), material, 0, 0, 0, parent);
    o.position.copy(av.add(bv).multiplyScalar(0.5));
    o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
    return o;
  };
  const step = (items, f, fn) => items.forEach((o, i) => fn(o, clamp(f * items.length - i), i));
  const rune = (x, y, z, parent = group) => {
    const g = part('rune', parent);
    g.position.set(x, y, z);
    mesh(box(0.055, 0.26, 0.035), m.air, -0.07, 0, 0, g).rotation.z = -0.35;
    mesh(box(0.055, 0.26, 0.035), m.air, 0.07, 0, 0, g).rotation.z = 0.35;
    return g;
  };
  const leaf = (x, y, z, scale = 0.3, material = m.leaf, parent = group) => {
    const o = mesh(sphere(1), material, x, y, z, parent);
    o.scale.set(scale * 0.38, scale * 0.18, scale);
    o.rotation.set(-0.24, 0.7, 0);
    return o;
  };
  const base = mesh(cyl(1.49, 1.53, 0.1, 24), m.moss, 0, 0.05, 0);
  base.name = 'rooted-base';
  STATES.set(group, { updates, materials, geometries });
  return { group, palette, m, mesh, part, box, sphere, cyl, cone, octa, torus, link, step, rune, leaf, updates };
}

function bowl(c, x, z, parent = c.group) {
  const { mesh, cyl, m, torus } = c;
  const g = new T.Group();
  g.position.set(x, 0, z);
  parent.add(g);
  mesh(cyl(0.42, 0.27, 0.23, 12), m.woodLight, 0, 0.2, 0, g);
  const rim = mesh(torus(0.42, 0.035), m.cream, 0, 0.32, 0, g);
  rim.rotation.x = Math.PI / 2;
  mesh(cyl(0.34, 0.34, 0.018, 12), m.dark, 0, 0.325, 0, g);
  return g;
}
function owl(c, x, y, z, scale = 1, parent = c.group) {
  const { part, mesh, sphere, cone, m } = c,
    g = part('woodland-owl', parent);
  g.position.set(x, y, z);
  g.scale.setScalar(scale);
  mesh(sphere(0.33), m.moss, 0, 0.48, 0, g).scale.set(0.9, 1.2, 0.85);
  mesh(sphere(0.34), m.moss, 0, 0.91, 0.015, g).scale.z = 0.8;
  const wings = [];
  for (const side of [-1, 1]) {
    const disk = mesh(sphere(0.17), m.cream, side * 0.15, 0.92, 0.255, g);
    disk.scale.z = 0.21;
    mesh(sphere(0.064), m.eye, side * 0.15, 0.94, 0.292, g);
    mesh(sphere(0.016), m.pale, side * 0.15 - 0.017, 0.961, 0.353, g);
    const tuft = mesh(cone(0.095, 0.25), m.moss, side * 0.23, 1.2, -0.025, g);
    tuft.rotation.z = -side * 0.32;
    const wing = mesh(sphere(0.19), m.leaf, side * 0.32, 0.49, -0.01, g);
    wing.scale.set(0.55, 1.5, 0.6);
    wing.rotation.z = side * 0.18;
    wings.push(wing);
    mesh(sphere(0.075), m.gold, side * 0.13, 0.08, 0.1, g);
  }
  const beak = mesh(cone(0.065, 0.16, 5), m.gold, 0, 0.83, 0.31, g);
  beak.rotation.x = Math.PI / 2;
  return { g, wings };
}

const BUILDERS = {
  translation(c) {
    const { mesh, cyl, box, octa, m, rune, step, updates } = c;
    for (const side of [-1, 1]) {
      const stone = mesh(cyl(0.37, 0.46, 1.65, 7), m.stone, side * 0.78, 0.92, 0);
      stone.rotation.z = -side * 0.065;
      mesh(octa(0.24), m.gold, side * 0.78, 1.96, 0);
      rune(side * 0.78, 1.2, 0.365);
      mesh(box(0.62, 0.12, 0.55), m.pale, side * 0.78, 0.18, 0);
    }
    const beams = [];
    for (let i = 0; i < 3; i++) {
      const beam = mesh(box(0.92, 0.05, 0.065), m.air, 0, 0.62 + i * 0.36, 0.1);
      beam.userData.progressRole = 'accepted-link';
      beams.push(beam);
    }
    const key = mesh(octa(0.22), m.air, 0, 2.08, 0);
    updates.push(f => {
      step(beams, f, (o, p) => {
        o.visible = p > 0;
        o.scale.x = Math.max(0.01, p);
      });
      key.visible = f === 1;
      key.position.y = 1.96 + f * 0.22;
    });
  },
  definition(c) {
    const { mesh, cyl, octa, box, m, rune, step, updates } = c,
      columns = [];
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * 0.88,
        h = 1.65 + (i % 2) * 0.35,
        g = new T.Group();
      g.position.set(x, 0, -0.05);
      c.group.add(g);
      mesh(cyl(0.27, 0.34, h, 7), m.stone, 0, h / 2 + 0.12, 0, g);
      mesh(box(0.58, 0.13, 0.52), m.pale, 0, 0.17, 0, g);
      const top = mesh(octa(0.21), m.gold, 0, h + 0.35, 0, g);
      rune(0, h * 0.62, 0.28, g);
      columns.push({ g, top, h });
    }
    updates.push(f =>
      step(columns, f, (o, p) => {
        o.g.position.y = p * 0.12;
        o.top.position.y = o.h + 0.35 + p * 0.18;
        o.top.material = p === 1 ? m.air : m.gold;
      }),
    );
  },
  picture(c) {
    const { mesh, box, sphere, octa, m, step, updates } = c,
      crates = [];
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * 0.86,
        z = i === 1 ? 0.37 : -0.18,
        g = new T.Group();
      g.position.set(x, 0.12, z);
      c.group.add(g);
      mesh(box(0.64, 0.58, 0.66), m.wood, 0, 0.29, 0, g);
      for (const side of [-1, 1]) mesh(box(0.07, 0.65, 0.73), m.woodLight, side * 0.26, 0.32, 0, g);
      mesh(box(0.43, 0.28, 0.035), m.pale, 0, 0.32, 0.35, g);
      const lid = mesh(box(0.72, 0.1, 0.74), m.woodLight, 0, 0.67, 0, g),
        treasure = mesh(i === 1 ? octa(0.18) : sphere(0.15), i === 1 ? m.air : m.fruit, 0, 0.68, 0, g);
      crates.push({ lid, treasure });
    }
    updates.push(f =>
      step(crates, f, (o, p) => {
        o.lid.rotation.z = -p * 1.1;
        o.lid.position.set(-p * 0.24, 0.67 + p * 0.2, 0);
        o.treasure.visible = p > 0.3;
        o.treasure.position.y = 0.6 + p * 0.23;
      }),
    );
  },
  'qa-pairs'(c) {
    const { mesh, cyl, box, torus, octa, m, link, step, updates } = c;
    for (const side of [-1, 1]) {
      mesh(cyl(0.1, 0.15, 1.7, 7), m.wood, side * 0.9, 0.96, 0);
      mesh(box(0.62, 0.12, 0.5), m.woodLight, side * 0.9, 1.86, 0);
      mesh(octa(0.15), m.gold, side * 0.9, 2.07, 0);
    }
    link([-0.9, 1.71, 0], [0.9, 1.71, 0], 0.025, m.dark);
    const messages = [];
    for (let i = 0; i < 3; i++) {
      const g = new T.Group();
      g.position.set(-0.7, 0.77 + i * 0.33, 0.14);
      c.group.add(g);
      mesh(box(0.24, 0.16, 0.045), m.pale, 0, 0, 0, g);
      const fold = mesh(torus(0.08, 0.017, Math.PI), m.gold, 0, 0.018, 0.03, g);
      fold.rotation.z = Math.PI;
      messages.push(g);
    }
    updates.push(f =>
      step(messages, f, (o, p, i) => {
        o.position.x = -0.7 + p * 1.4;
        o.position.y = 0.77 + i * 0.33 + Math.sin(p * Math.PI) * 0.19;
        o.children[0].material = p === 1 ? m.air : m.pale;
      }),
    );
  },
  halves(c) {
    const { mesh, cyl, box, m, step, updates } = c;
    mesh(box(2.55, 0.08, 1.64), m.water, 0, 0.13, 0);
    for (const side of [-1, 1]) mesh(box(0.23, 0.21, 1.94), m.stone, side * 1.22, 0.2, 0);
    const pairs = [];
    for (let i = 0; i < 3; i++) {
      const pair = [];
      for (const side of [-1, 1]) {
        const log = mesh(cyl(0.16, 0.18, 1.14, 9), m.woodLight, side * 0.65, 0.32, (i - 1) * 0.52);
        log.rotation.z = Math.PI / 2;
        pair.push({ log, side });
      }
      pairs.push(pair);
    }
    updates.push(f =>
      step(pairs, f, (pair, p) =>
        pair.forEach(({ log, side }) => {
          log.position.x = side * (0.65 - 0.1 * p);
          log.position.y = 0.32 + (1 - p) * 0.09;
          log.rotation.y = side * (1 - p) * 0.2;
        }),
      ),
    );
  },
  ending(c) {
    const { mesh, cyl, sphere, link, leaf, m, step, updates } = c;
    c.group.userData.focusHeight = 2;
    mesh(cyl(0.17, 0.29, 2.2, 9), m.bark, 0, 1.2, -0.13);
    for (const side of [-1, 1]) {
      link([0, 1.56, -0.13], [side * 0.75, 2.48, -0.15], 0.1, m.bark);
      leaf(side * 0.92, 0.14, 0.22, 0.38);
    }
    const crowns = [
      [-0.62, 2.72, 0, 0.76],
      [0.65, 2.88, -0.06, 0.73],
      [0, 3.22, -0.12, 0.83],
    ];
    for (const [x, y, z, r] of crowns) {
      const o = mesh(sphere(r), m.leaf, x, y, z);
      o.scale.y = 0.85;
    }
    const fruit = [];
    for (let i = 0; i < 3; i++) {
      const start = new T.Vector3((i - 1) * 0.68, 2.43 + (i % 2) * 0.22, 0.48),
        o = mesh(sphere(0.15), m.moss, start.x, start.y, start.z);
      leaf(start.x + 0.04, start.y + 0.16, start.z, 0.16, m.leaf);
      fruit.push({ o, start });
    }
    bowl(c, 0, 1.0);
    updates.push(f =>
      step(fruit, f, ({ o, start }, p, i) => {
        o.material = p > 0 ? m.fruit : m.moss;
        o.position.copy(start).lerp(new T.Vector3((i - 1) * 0.19, 0.43, 1), p);
        o.scale.setScalar(1 + Math.sin(p * Math.PI) * 0.12);
      }),
    );
  },
  sentence(c) {
    const { mesh, cyl, box, m, step, updates } = c;
    mesh(cyl(1.35, 1.42, 0.12, 20), m.water, 0, 0.14, 0);
    const stones = [];
    for (let i = 0; i < 4; i++) {
      const o = mesh(cyl(0.3, 0.37, 0.15, 6), m.pale, (i % 2 ? 1 : -1) * 0.28, 0.23, (i - 1.5) * 0.59);
      stones.push(o);
    }
    updates.push(f =>
      step(stones, f, (o, p, i) => {
        o.position.y = 0.2 + p * 0.16;
        o.rotation.z = (1 - p) * (i % 2 ? -0.22 : 0.22);
        o.material = p === 1 ? m.cream : m.stone;
      }),
    );
  },
  gap(c) {
    const { mesh, box, cyl, m, step, updates } = c;
    for (const side of [-1, 1]) mesh(box(2.63, 0.3, 0.16), m.stone, 0, 0.31, side * 0.44);
    mesh(box(2.63, 0.13, 0.8), m.pale, 0, 0.15, 0);
    const plugs = [],
      water = [];
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * 0.77,
        o = mesh(box(0.28, 0.23, 0.75), m.woodLight, x, 0.56, 0);
      plugs.push(o);
      water.push(mesh(box(0.65, 0.035, 0.61), m.water, x, 0.34, 0));
    }
    for (const side of [-1, 1]) {
      const o = mesh(cyl(0.17, 0.17, 0.36, 8), m.gold, side * 1.2, 0.57, 0);
      o.rotation.x = Math.PI / 2;
    }
    updates.push(f => {
      step(plugs, f, (o, p) => {
        o.position.y = 0.56 - 0.23 * p;
        o.rotation.y = (1 - p) * 0.3;
      });
      step(water, f, (o, p) => {
        o.visible = p > 0;
        o.scale.x = Math.max(0.03, p);
      });
    });
  },
  correct(c) {
    const { mesh, cyl, box, cone, m, step, updates } = c;
    mesh(cyl(0.09, 0.16, 2.45, 7), m.wood, 0, 1.32, 0);
    const arrows = [];
    for (let i = 0; i < 3; i++) {
      const g = new T.Group();
      g.position.y = 1.12 + i * 0.49;
      c.group.add(g);
      mesh(box(1.4, 0.31, 0.13), m.woodLight, 0, 0, 0, g);
      const arrow = mesh(cone(0.23, 0.44, 3), m.pale, 0.82, 0, 0, g);
      arrow.rotation.z = -Math.PI / 2;
      arrows.push(g);
    }
    updates.push(f =>
      step(arrows, f, (o, p, i) => {
        o.rotation.y = (1 - p) * (i % 2 ? -0.5 : 0.5);
        o.children[0].material = p === 1 ? m.pale : m.woodLight;
      }),
    );
  },
  repair(c) {
    const { mesh, cyl, torus, octa, m, step, updates } = c;
    mesh(cyl(0.57, 0.71, 0.32, 10), m.stone, 0, 0.25, 0);
    const segments = [];
    for (let i = 0; i < 3; i++) {
      const g = new T.Group();
      g.position.set(0, 1.27, 0);
      c.group.add(g);
      const ring = mesh(torus(0.72, 0.09, (Math.PI * 2) / 3 - 0.06), m.pale, 0, 0, 0, g);
      ring.rotation.z = (i * Math.PI * 2) / 3;
      segments.push(g);
    }
    const core = mesh(octa(0.26), m.air, 0, 1.27, 0);
    updates.push(f => {
      step(segments, f, (o, p, i) => {
        o.position.x = (1 - p) * Math.cos((i * Math.PI * 2) / 3) * 0.17;
        o.position.y = 1.27 + (1 - p) * Math.sin((i * Math.PI * 2) / 3) * 0.17;
        o.rotation.y = (1 - p) * 0.4;
      });
      core.scale.setScalar(0.55 + f * 0.45);
    });
  },
  answer(c) {
    const { mesh, cyl, octa, m, step, updates } = c;
    mesh(cyl(0.47, 0.64, 0.4, 10), m.stone, 0, 0.3, 0);
    const bird = owl(c, 0, 0.49, 0);
    const tokens = [];
    for (let i = 0; i < 3; i++) tokens.push(mesh(octa(0.11), m.air, (i - 1) * 0.36, 0.28, 0.85));
    updates.push(f => {
      step(tokens, f, (o, p) => {
        o.visible = p > 0;
        o.scale.setScalar(0.6 + p * 0.4);
      });
      bird.wings.forEach((o, i) => (o.rotation.z = (i === 0 ? -1 : 1) * (0.18 + f * 0.38)));
      bird.g.rotation.x = -f * 0.04;
    });
    c.group.userData.focusHeight = 1.35;
  },
  sort(c) {
    const { mesh, box, m, step, updates } = c;
    for (const side of [-1, 1]) mesh(box(0.12, 1.73, 0.9), m.wood, side * 1.13, 0.99, -0.1);
    for (let i = 0; i < 3; i++) mesh(box(2.35, 0.13, 0.94), m.woodLight, 0, 0.38 + i * 0.58, -0.1);
    const boxes = [];
    for (let i = 0; i < 6; i++) {
      const o = mesh(box(0.54, 0.37, 0.52), i % 2 ? m.pale : m.leaf, ((i % 3) - 1) * 0.69, 0.31, 0.87);
      boxes.push(o);
    }
    updates.push(f =>
      step(boxes, f, (o, p, i) => {
        o.position.set(((i % 3) - 1) * 0.69, 0.31 + p * (0.64 + Math.floor(i / 3) * 0.58), 0.87 - p * 0.95);
        o.rotation.y = (1 - p) * 0.18 * (i % 2 ? 1 : -1);
      }),
    );
  },
  intruder(c) {
    const { mesh, cone, sphere, m, part, leaf, step, updates } = c,
      vines = [];
    for (let i = 0; i < 3; i++) {
      const g = part('bramble-cluster');
      g.position.x = (i - 1) * 0.74;
      const curve = new T.CatmullRomCurve3([
        new T.Vector3(-0.12, 0.13, 0),
        new T.Vector3(0.16, 0.54, -0.12),
        new T.Vector3(-0.1, 1.02, 0.09),
        new T.Vector3(0.16, 1.45, -0.03),
      ]);
      mesh(new T.TubeGeometry(curve, 14, 0.065, 5, false), m.corrupt, 0, 0, 0, g);
      for (let j = 0; j < 4; j++) {
        const a = j * Math.PI * 0.7,
          o = mesh(cone(0.1, 0.26, 5), m.dark, Math.cos(a) * 0.15, 0.37 + j * 0.28, Math.sin(a) * 0.15, g);
        o.rotation.z = j % 2 ? 1.1 : -1.1;
      }
      vines.push(g);
    }
    for (let i = 0; i < 4; i++) leaf(Math.sin(i * 1.7) * 0.8, 0.15, Math.cos(i * 1.7) * 0.8, 0.4);
    const bloom = mesh(sphere(0.15), m.gold, 0, 0.35, 0.7);
    updates.push(f => {
      step(vines, f, (o, p) => {
        o.visible = p < 1;
        o.scale.setScalar(1 - p * 0.85);
      });
      bloom.scale.setScalar(0.4 + f * 0.8);
    });
  },
  spelling(c) {
    const { mesh, cyl, m, step, updates } = c,
      mushrooms = [];
    for (let i = 0; i < 3; i++) {
      const g = new T.Group();
      g.position.set((i - 1) * 0.83, 0.13, i === 1 ? 0.45 : -0.07);
      c.group.add(g);
      mesh(cyl(0.1, 0.16, 0.57, 8), m.cream, 0, 0.285, 0, g);
      const cap = mesh(new T.SphereGeometry(0.44, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), m.corrupt, 0, 0.58, 0, g);
      const spot = mesh(cyl(0.1, 0.1, 0.015, 7), m.pale, 0.16, 0.95, 0.06, g);
      spot.rotation.z = -0.25;
      mushrooms.push({ g, cap, spot });
    }
    updates.push(f =>
      step(mushrooms, f, (o, p) => {
        o.cap.material = p === 1 ? m.red : m.corrupt;
        o.cap.scale.set(1 + p * 0.08, 1 + p * 0.12, 1 + p * 0.08);
        o.spot.visible = p === 1;
      }),
    );
  },
  clue(c) {
    const { mesh, box, octa, m, part, step, updates } = c;
    mesh(box(1.78, 0.76, 1.07), m.wood, 0, 0.51, 0);
    for (const side of [-1, 1]) {
      mesh(box(0.11, 0.84, 1.14), m.gold, side * 0.65, 0.55, 0);
      mesh(box(0.22, 0.12, 1.25), m.woodLight, side * 0.65, 0.13, 0);
    }
    const hinge = part('cache-lid');
    hinge.position.set(0, 0.91, -0.53);
    mesh(box(1.91, 0.16, 1.16), m.woodLight, 0, 0.02, 0.53, hinge);
    mesh(box(0.21, 0.26, 0.07), m.gold, 0, 0.83, 0.58);
    const contents = [];
    for (let i = 0; i < 3; i++) contents.push(mesh(octa(0.18), m.air, (i - 1) * 0.4, 0.86, 0));
    updates.push(f => {
      hinge.rotation.x = -f * 1.05;
      step(contents, f, (o, p) => {
        o.visible = p > 0;
        o.position.y = 0.76 + p * 0.29;
      });
    });
  },
  'listen-word'(c) {
    const { mesh, cyl, sphere, torus, m, step, updates } = c,
      flowers = [];
    for (let i = 0; i < 3; i++) {
      const g = new T.Group();
      g.position.set((i - 1) * 0.9, 0.1, i === 1 ? 0.37 : -0.1);
      c.group.add(g);
      mesh(cyl(0.045, 0.07, 0.91, 6), m.leaf, 0, 0.46, 0, g);
      const petals = [];
      for (let j = 0; j < 5; j++) {
        const a = (j * Math.PI * 2) / 5,
          o = mesh(sphere(0.22), i === 1 ? m.pale : m.red, Math.cos(a) * 0.24, 1.0 + Math.sin(a) * 0.24, 0, g);
        o.scale.set(1, 0.6, 0.35);
        o.rotation.z = a;
        petals.push(o);
      }
      const core = mesh(sphere(0.15), m.gold, 0, 1, 0.1, g);
      const ring = mesh(torus(0.43, 0.018, Math.PI * 1.45), m.air, 0, 1, -0.08, g);
      flowers.push({ petals, core, ring });
    }
    updates.push(f =>
      step(flowers, f, (o, p) => {
        o.petals.forEach(x => {
          x.scale.z = 0.25 + p * 0.18;
          x.rotation.y = (1 - p) * 0.4;
        });
        o.core.material = p === 1 ? m.air : m.gold;
        o.ring.visible = p > 0;
        o.ring.scale.setScalar(0.7 + p * 0.4);
      }),
    );
  },
  'listen-tr'(c) {
    const { mesh, cyl, octa, torus, m, link, step, updates } = c,
      crystals = [];
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * 0.87,
        z = i === 1 ? 0.4 : -0.08;
      mesh(cyl(0.38, 0.44, 0.19, 8), m.stone, x, 0.19, z);
      const crystal = mesh(octa(0.32), m.stone, x, 0.97, z);
      crystal.scale.y = 2.05;
      const arc = mesh(torus(0.44, 0.024, Math.PI * 1.4), m.air, x, 1.08, z - 0.1);
      arc.rotation.z = i * 0.5;
      crystals.push({ crystal, arc });
    }
    updates.push(f =>
      step(crystals, f, (o, p) => {
        o.crystal.material = p === 1 ? m.air : m.stone;
        o.crystal.position.y = 0.97 + p * 0.18;
        o.arc.visible = p > 0;
        o.arc.scale.setScalar(0.6 + p * 0.4);
      }),
    );
  },
  'listen-multi'(c) {
    const { mesh, box, cyl, sphere, m, step, updates } = c;
    mesh(box(2.42, 0.14, 0.61), m.woodLight, 0, 1.4, -0.46);
    for (const side of [-1, 1]) mesh(cyl(0.08, 0.13, 1.5, 6), m.wood, side * 1.08, 0.84, -0.46);
    owl(c, 0, 1.42, -0.5, 0.58);
    const items = [];
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * 0.91;
      bowl(c, x, 0.55);
      const o = mesh(i === 1 ? c.octa(0.13) : sphere(0.13), i === 1 ? m.air : m.fruit, x, 1.55, -0.44);
      items.push(o);
    }
    updates.push(f =>
      step(items, f, (o, p, i) => {
        o.position.set((i - 1) * 0.91, 1.55 - p * 1.12, -0.44 + p * 0.99);
        o.scale.setScalar(0.8 + p * 0.2);
      }),
    );
  },
  numbers(c) {
    const { mesh, cyl, box, sphere, m, part, link, step, updates } = c;
    mesh(cyl(0.14, 0.26, 1.45, 8), m.wood, 0, 0.83, 0);
    const beam = part('balance-arm');
    beam.position.y = 1.63;
    mesh(box(2.35, 0.12, 0.15), m.woodLight, 0, 0, 0, beam);
    mesh(sphere(0.12), m.gold, 0, 0.08, 0, beam);
    for (const side of [-1, 1]) {
      for (const z of [-0.23, 0.23]) link([side * 0.93, -0.04, 0], [side * 0.93, -0.59, z], 0.017, m.gold, beam);
      mesh(cyl(0.39, 0.31, 0.11, 12), m.pale, side * 0.93, -0.63, 0, beam);
    }
    const weights = [];
    for (let i = 0; i < 3; i++) weights.push(mesh(box(0.17, 0.19, 0.18), m.gold, (i - 1) * 0.25, 0.23, 0.83));
    updates.push(f => {
      beam.rotation.z = 0.16 * (1 - f);
      step(weights, f, (o, p, i) => {
        o.position.set((i - 1) * 0.25 * (1 - p) + (-0.93 + (i - 1) * 0.17) * p, 0.23 + p * 0.87, 0.83 * (1 - p));
      });
    });
  },
  instructions(c) {
    const { mesh, box, cyl, torus, m, part, step, updates } = c;
    mesh(box(2.46, 0.14, 1.17), m.woodLight, 0, 0.82, 0);
    for (const x of [-1.02, 1.02]) for (const z of [-0.43, 0.43]) mesh(box(0.12, 0.72, 0.12), m.wood, x, 0.4, z);
    const bag = part('packing-bag');
    bag.position.set(0, 0.9, -0.23);
    mesh(box(0.88, 0.94, 0.58), m.leaf, 0, 0.47, 0, bag);
    const flap = mesh(box(0.98, 0.15, 0.66), m.moss, 0, 1.03, 0, bag);
    for (const side of [-1, 1]) {
      const strap = mesh(torus(0.23, 0.034, Math.PI * 1.6), m.woodLight, side * 0.31, 0.49, -0.31, bag);
      strap.scale.set(0.6, 1.5, 1);
    }
    const items = [];
    for (let i = 0; i < 3; i++) {
      const item = mesh(
        i === 1 ? cyl(0.12, 0.12, 0.31, 9) : box(0.25, 0.2, 0.3),
        i === 1 ? m.water : i === 0 ? m.pale : m.gold,
        (i - 1) * 0.69,
        1.0,
        0.39,
      );
      items.push(item);
    }
    updates.push(f => {
      step(items, f, (o, p, i) => {
        o.position.set((i - 1) * 0.69 * (1 - p), 1.0 + p * 0.29, 0.39 - p * 0.62);
        o.visible = p < 1;
      });
      flap.rotation.x = -(1 - f) * 0.52;
      flap.position.y = 1.03 + (1 - f) * 0.1;
    });
  },
};

export function makeTrailProp(type, { area = 0, completed = false } = {}) {
  if (!BUILDERS[type]) throw new Error('Unknown trail prop type: ' + type);
  const c = context(type, area);
  BUILDERS[type](c);
  setTrailPropProgress(c.group, completed ? 1 : 0);
  return c.group;
}
export function setTrailPropProgress(group, fraction) {
  const state = STATES.get(group);
  if (!state) return group;
  const f = clamp(fraction);
  group.userData.progress = f;
  group.userData.completed = f >= 1;
  for (const update of state.updates) update(f);
  return group;
}
