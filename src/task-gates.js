import { makeAqueductChannel } from './aqueduct-channel.js';
import { eyeBlink, blinkFigures } from './eye-blink.js';
import { mechanismHardware, taskMechanismState } from './mechanism-hardware.js';
import { surfaceMaterial, assignSurfaceRoles, assignSurface } from './surface-materials.js';
import * as T from './vendor/three.module.min.js';
import { bevelBox, carvedCylinder, rockLump, liquidMaterial } from './prop-art.js';
// Themed task gates. Each English task type gets its own obstacle on the trail and its own dressing on the task
// stage, and the obstacle opens in visible steps: runes light and a drawbridge drops, stepping stones rise, brambles
// wither, bell flowers swing aside, a balance lifts its arm. Everything is visual; the expedition decides passage.
// When open, nothing remains over the 5 m walkway (|x| < 2.5) higher than the ground.

export const THEMED_GATES = [
  'translation',
  'sentence',
  'intruder',
  'listen-word',
  'numbers',
  'ending',
  'correct',
  'spelling',
  'listen-tr',
  'halves',
  'qa-pairs',
  'gap',
  'repair',
  'answer',
  'sort',
  'definition',
  'picture',
  'clue',
  'listen-multi',
  'instructions',
];
const PALETTES = [
  {
    stone: '#a39c88',
    dark: '#5f5b4e',
    moss: '#5f8452',
    wood: '#8b6b4a',
    metal: '#c8a25a',
    glow: '#8ff0cf',
    bramble: '#5a4334',
    thorn: '#8f7562',
    leaf: '#4f7a45',
    petal: '#f6efff',
    bell: '#c7a2e6',
    water: '#5cabae',
    ink: '#2f3b33',
  },
  {
    stone: '#c9bfa2',
    dark: '#7a705c',
    moss: '#7f9a6c',
    wood: '#9a7a55',
    metal: '#d8b56a',
    glow: '#9fe3f2',
    bramble: '#6b5544',
    thorn: '#a08a74',
    leaf: '#6f9a64',
    petal: '#fff8e8',
    bell: '#9cc7ef',
    water: '#48a7c4',
    ink: '#4a4435',
  },
  {
    stone: '#8f91a8',
    dark: '#4b4d62',
    moss: '#6f8199',
    wood: '#6e5a52',
    metal: '#c7a76a',
    glow: '#c9b6ff',
    bramble: '#4a3a4a',
    thorn: '#7d6a7e',
    leaf: '#5c7486',
    petal: '#f1e9ff',
    bell: '#b29ae8',
    water: '#5f7fb0',
    ink: '#2c2d3c',
  },
];
const clamp = n => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
const smooth = t => {
  t = clamp(t);
  return t * t * (3 - 2 * t);
};
const span = (f, a, b) => clamp((f - a) / (b - a));
const UP = new T.Vector3(0, 1, 0);

export function gateKit(area = 0) {
  const p = PALETTES[area] || PALETTES[0],
    materials = [],
    cache = new Map();
  const mat = (color, extra = {}, kind = 'organic') => {
    const m = surfaceMaterial(kind, color, extra);
    materials.push(m);
    return m;
  };
  const m = {
    stone: mat(p.stone),
    dark: mat(p.dark),
    moss: mat(p.moss),
    wood: mat(p.wood),
    metal: mat(p.metal, { metalness: 0.4, roughness: 0.42 }),
    glow: mat(p.glow, { emissive: p.glow, emissiveIntensity: 0.9, roughness: 0.35 }),
    bramble: mat(p.bramble, { roughness: 0.95 }),
    thorn: mat(p.thorn),
    leaf: mat(p.leaf, { side: T.DoubleSide }),
    petal: mat(p.petal, { side: T.DoubleSide, emissive: p.bell, emissiveIntensity: 0.08 }),
    bell: mat(p.bell, { side: T.DoubleSide, emissive: p.bell, emissiveIntensity: 0.12 }),
    ink: mat(p.ink),
    chasm: mat('#141a17', { roughness: 1 }),
  };
  assignSurfaceRoles(m, {
    stone: ['stone', 'dark', 'ink'],
    wood: ['wood', 'bramble', 'thorn'],
    foliage: ['moss', 'leaf'],
    metal: ['metal'],
    effect: ['glow'],
    organic: ['petal', 'bell'],
    soil: ['chasm'],
  });
  const geo = (key, make) => {
    if (!cache.has(key)) cache.set(key, make());
    return cache.get(key);
  };
  const mesh = (geometry, material, x = 0, y = 0, z = 0, parent) => {
    const o = new T.Mesh(geometry, material);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    parent?.add(o);
    return o;
  };
  const box = (w, h, d, bevel) => geo(`b${w},${h},${d},${bevel}`, () => bevelBox(w, h, d, bevel));
  const cyl = (a, b, h, n = 8) => geo(`c${a},${b},${h},${n}`, () => carvedCylinder(a, b, h, n));
  // A unit cylinder stretched between two points each frame (chains, beams, ropes).
  const unitRod = geo('rod', () => new T.CylinderGeometry(1, 1, 1, 6));
  const rod = (material, r, parent) => {
    const o = mesh(unitRod, material, 0, 0, 0, parent);
    o.userData.r = r;
    return o;
  };
  const stretch = (o, a, b) => {
    const d = new T.Vector3().subVectors(b, a),
      len = d.length() || 1e-4;
    o.position.copy(a).addScaledVector(d, 0.5);
    o.quaternion.setFromUnitVectors(UP, d.divideScalar(len));
    o.scale.set(o.userData.r, len, o.userData.r);
  };
  const tube = (points, r, material, parent, segments = 24) =>
    mesh(
      new T.TubeGeometry(new T.CatmullRomCurve3(points.map(q => new T.Vector3(...q))), segments, r, 6, false),
      material,
      0,
      0,
      0,
      parent,
    );
  return { p, m, mat, materials, geo, mesh, box, cyl, rod, stretch, tube };
}

// Rune bridge: rune stones on two monoliths light up in pairs, beams cross the chasm, then the drawbridge drops.
function runeBridge(k, g) {
  const { m, mesh, box, cyl, rod, stretch, mat } = k;
  mesh(box(4.9, 0.012, 2.2, 0.004), m.chasm, 0, 0.006, -0.15, g).name = 'chasm';
  for (const z of [-1.25, 0.95]) {
    const lip = mesh(box(4.9, 0.03, 0.08, 0.01), m.glow, 0, 0.015, z, g);
    lip.castShadow = false;
  }
  const runes = [];
  for (const s of [-1, 1]) {
    const pillar = mesh(cyl(0.42, 0.56, 3.3, 6), m.stone, s * 3.2, 1.65, -0.15, g);
    pillar.rotation.y = 0.3;
    mesh(box(1.05, 0.3, 1.05, 0.06), m.dark, s * 3.2, 3.42, -0.15, g);
    mesh(cyl(0.6, 0.64, 0.22, 6), m.dark, s * 3.2, 0.11, -0.15, g);
    for (let i = 0; i < 3; i++) {
      const glyph = mat(k.p.dark, { emissive: k.p.glow, emissiveIntensity: 0 });
      const rune = mesh(box(0.2, 0.42, 0.08, 0.02), glyph, s * 2.78, 1.25 + i * 0.62, 0.12, g);
      rune.rotation.z = s * 0.22 * (i % 2 ? 1 : -1);
      runes.push({ glyph, index: i });
    }
  }
  const beams = [0, 1, 2].map(i => {
    const beam = rod(m.glow, 0.045, g);
    stretch(beam, new T.Vector3(-2.75, 1.25 + i * 0.62, 0.12), new T.Vector3(2.75, 1.25 + i * 0.62, 0.12));
    beam.castShadow = false;
    return beam;
  });
  // The deck is hinged at the far edge of the chasm and stands upright until it drops toward the traveller.
  const hinge = new T.Group();
  hinge.position.set(0, 0.03, -1.2);
  g.add(hinge);
  for (let i = 0; i < 7; i++) {
    const plank = mesh(
      box(0.62, 2.25, 0.05, 0.012),
      i % 2 ? m.wood : k.mat(k.p.wood, { color: new T.Color(k.p.wood).multiplyScalar(0.86) }, 'wood'),
      (i - 3) * 0.66,
      1.12,
      0,
      hinge,
    );
    plank.rotation.z = ((i % 3) - 1) * 0.012;
  }
  for (const y of [0.35, 1.9]) mesh(box(4.6, 0.14, 0.05, 0.02), m.dark, 0, y, 0.04, hinge);
  for (const x of [-1.7, 1.7]) mesh(box(0.12, 2.1, 0.05, 0.02), m.metal, x, 1.12, 0.045, hinge);
  const emblem = mesh(
    k.geo('emblem', () => new T.TorusGeometry(0.42, 0.05, 6, 28)),
    m.metal,
    0,
    1.15,
    0.05,
    hinge,
  );
  emblem.castShadow = false;
  for (const s of [-1, 1]) {
    const bar = mesh(box(0.09, 0.55, 0.03, 0.01), m.glow, s * 0.11, 1.15, 0.06, hinge);
    bar.rotation.z = s * 0.35;
  }
  const chains = [-1, 1].map(s => rod(m.metal, 0.025, g));
  hinge.name = 'drawbridge-hinge';
  mesh(cyl(0.04, 0.04, 5.8, 10), m.metal, 0, 0.02, -1.2, g).rotation.z = Math.PI / 2;
  for (const x of [-2.8, 2.8]) {
    mesh(box(0.16, 0.16, 0.24, 0.02), m.dark, x, 0.08, -1.2, g);
    mesh(box(0.22, 0.035, 0.06, 0.01), m.metal, x, 2.25, 0, hinge);
  }
  const weights = [-1, 1].map(s => {
    const weight = mesh(box(0.28, 0.55, 0.28, 0.03), m.stone, s * 3.25, 2.4, -0.3, g),
      line = rod(m.ink, 0.02, g),
      pulley = mesh(
        k.geo('bridge-sheave', () => new T.TorusGeometry(0.16, 0.045, 5, 16)),
        m.metal,
        s * 2.9,
        3.3,
        -0.15,
        g,
      );
    return { weight, line, pulley, s };
  });
  return (f, time, state) => {
    const value = i => state?.groups[i]?.steps[0] ?? smooth(span(f, i * 0.2, i * 0.2 + 0.18));
    runes.forEach(r => {
      r.glyph.emissiveIntensity = value(r.index) * 0.6;
    });
    beams.forEach((b, i) => {
      const on = value(i);
      b.visible = on > 0 && f < 1;
      b.scale.x = b.scale.z = 0.045 * (0.3 + on);
    });
    const drop = span(f, 0.62, 1),
      bounce = drop < 1 ? Math.sin(drop * Math.PI * 2.5) * (1 - drop) * 0.12 : 0;
    hinge.rotation.x = Math.min(Math.PI / 2, ((smooth(drop) + bounce) * Math.PI) / 2);
    const tip = new T.Vector3(0, 2.25, 0).applyEuler(hinge.rotation).add(hinge.position);
    chains.forEach((c, i) => {
      const s = i ? 1 : -1;
      stretch(c, new T.Vector3(s * 2.9, 3.3, -0.15), new T.Vector3(s * 2.8, tip.y, tip.z));
      c.visible = true;
    });
    for (const q of weights) {
      q.weight.position.y = 2.4 - smooth(drop) * 1.7;
      stretch(q.line, new T.Vector3(q.s * 2.9, 3.3, -0.15), q.weight.position);
      q.pulley.rotation.z = smooth(drop) * Math.PI * 2;
    }
  };
}

// Stepping stones: a stream crosses the path; reeds block it until stones rise one by one.
function steppingStones(k, g) {
  const { m, mesh, box, cyl, geo } = k,
    water = liquidMaterial(k.p.water, { local: true, halfWidth: 3.3, halfLength: 1.15 });
  k.materials.push(water);
  const stream = mesh(new T.BoxGeometry(6.6, 0.04, 2.3), water, 0, 0.0, 0, g);
  stream.castShadow = false;
  stream.name = 'stream';
  for (const s of [-1, 1]) {
    mesh(cyl(0.32, 0.48, 2.2, 7), m.stone, s * 3.2, 1.1, 0, g);
    mesh(box(0.6, 0.42, 0.16, 0.04), m.dark, s * 3.1, 1.75, 0.5, g);
    for (let i = 0; i < 4; i++) {
      const l = mesh(rockLump(i + 1), i % 2 ? m.moss : m.stone, s * (2.95 + (i % 2) * 0.3), 0.12, (i - 1.5) * 0.62, g);
      l.scale.set(0.32, 0.28, 0.3);
    }
  }
  const reeds = new T.Group();
  g.add(reeds);
  const reedGeo = geo('reed', () => new T.ConeGeometry(0.035, 1, 4));
  for (let i = 0; i < 34; i++) {
    const x = -2.35 + ((i * 0.142) % 4.7),
      z = -0.75 + (((i * 37) % 17) / 17) * 1.5,
      h = 0.65 + ((i * 13) % 7) / 10,
      r = mesh(reedGeo, m.leaf, x, h / 2, z, reeds);
    r.scale.y = h;
    r.rotation.z = (((i * 29) % 11) - 5) * 0.03;
    if (i % 4 === 0) {
      mesh(cyl(0.045, 0.045, 0.22, 6), m.wood, x, h * 0.82, z, reeds);
    }
  }
  const stones = [
    [-0.5, 0.85],
    [0.55, 0.35],
    [-0.45, -0.15],
    [0.5, -0.62],
    [-0.2, -1.0],
  ].map(([x, z], i) => {
    const s = mesh(
      geo('stone' + i, () => {
        const b = bevelBox(0.95, 0.2, 0.72, 0.08);
        b.translate(0, -0.1, 0);
        return b;
      }),
      i % 2 ? m.stone : k.mat(new T.Color(k.p.stone).multiplyScalar(0.9).getStyle(), {}, 'stone'),
      x,
      -0.3,
      z,
      g,
    );
    s.rotation.y = i * 0.7;
    return s;
  });
  const rings = stones.map(s => {
    const r = mesh(
      geo('ring', () => new T.TorusGeometry(0.55, 0.025, 4, 24)),
      m.petal,
      s.position.x,
      0.03,
      s.position.z,
      g,
    );
    r.rotation.x = Math.PI / 2;
    r.castShadow = false;
    return r;
  });
  return f => {
    stones.forEach((s, i) => {
      const t = span(f, 0.08 + i * 0.16, 0.24 + i * 0.16);
      s.position.y = -0.3 + smooth(t) * 0.365;
      s.visible = t > 0;
      const ring = rings[i];
      ring.visible = t > 0 && t < 1;
      ring.scale.setScalar(0.6 + t * 1.4);
    });
    const fall = span(f, 0.2, 0.95);
    reeds.scale.y = Math.max(0.001, 1 - smooth(fall));
    reeds.visible = fall < 1;
  };
}

// Bramble wall: thorny vines weave across the path from two tangled roots and wither back to them.
function brambleWall(k, g) {
  const { m, mesh, geo, tube } = k,
    vines = [],
    thornGeo = geo('thorn', () => new T.ConeGeometry(0.05, 0.2, 4));
  for (const s of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const l = mesh(
        rockLump(i + 2),
        i % 2 ? m.bramble : m.leaf,
        s * (3.05 + (i % 3) * 0.2),
        0.2 + i * 0.12,
        (i - 2) * 0.22,
        g,
      );
      l.scale.set(0.38, 0.5, 0.34);
    }
  }
  const heights = [0.35, 0.75, 1.15, 1.55, 1.95, 0.55];
  heights.forEach((h, i) => {
    for (const s of [-1, 1]) {
      const anchor = new T.Group();
      anchor.position.set(s * 3.0, 0, 0);
      g.add(anchor);
      const wob = (i % 2 ? 1 : -1) * 0.25;
      // The half-vine is built in anchor space, reaching 3.1 m inward so the halves interlock in the middle.
      const pts = [
        [0, h * 0.6, 0],
        [-s * 0.8, h + wob, 0.12],
        [-s * 1.7, h - wob * 0.6, -0.1],
        [-s * 2.5, h + wob * 0.5, 0.08],
        [-s * 3.1, h, 0],
      ];
      tube(pts, 0.075, m.bramble, anchor, 20);
      for (let j = 0; j < 7; j++) {
        const t = 0.15 + j * 0.12,
          x = -s * 3.1 * t,
          y = h + Math.sin(t * 9 + i) * 0.2,
          th = mesh(thornGeo, m.thorn, x, y + 0.06, j % 2 ? 0.08 : -0.08, anchor);
        th.rotation.z = (j % 2 ? 1 : -1) * 0.9;
        th.rotation.x = j % 2 ? 0.5 : -0.5;
      }
      if (i % 2 === 0) {
        const bloom = mesh(
          geo('bloom', () => new T.IcosahedronGeometry(0.11, 0)),
          m.bell,
          -s * (1.4 + i * 0.2),
          h + 0.1,
          0.12,
          anchor,
        );
        bloom.scale.y = 0.7;
      }
      vines.push({ anchor, index: i });
    }
  });
  const dry = new T.Color(k.p.thorn),
    live = new T.Color(k.p.bramble);
  return f => {
    m.bramble.color.copy(live).lerp(dry, smooth(span(f, 0.1, 0.9)) * 0.7);
    for (const v of vines) {
      const t = smooth(span(f, (v.index / heights.length) * 0.8, (v.index / heights.length) * 0.8 + 0.35));
      v.anchor.scale.set(Math.max(0.03, 1 - t * 0.97), Math.max(0.25, 1 - t * 0.6), 1);
      v.anchor.rotation.z = (v.anchor.position.x < 0 ? -1 : 1) * t * 0.12;
    }
  };
}

// Bell flowers: tall stems lean over the path so their bells hang across it; they ring, open and swing aside.
function bellFlowers(k, g) {
  const { m, mesh, geo, tube } = k,
    flowers = [];
  const bellGeo = geo('bell', () => {
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      pts.push(new T.Vector2(0.05 + Math.sin(t * Math.PI * 0.5) * 0.32 + t * t * 0.08, -t * 0.55));
    }
    return new T.LatheGeometry(pts, 10);
  });
  const petalGeo = geo('petal', () => {
    const s = new T.SphereGeometry(0.16, 8, 5);
    s.scale(1, 0.35, 1.6);
    s.translate(0, 0, 0.22);
    return s;
  });
  [
    [-1, 0.25, 1.15],
    [-1, -0.35, 1.7],
    [-1, 0.05, 2.25],
    [1, 0.2, 1.3],
    [1, -0.3, 1.85],
    [1, 0.1, 1.0],
  ].forEach(([s, z, h], i) => {
    const root = new T.Group();
    root.position.set(s * (3.1 + (i % 3) * 0.1), 0, z);
    g.add(root);
    const reach = 2.6 + (i % 3) * 0.15;
    tube(
      [
        [0, 0, 0],
        [-s * 0.25, h * 0.7, 0],
        [-s * reach * 0.6, h + 0.55, 0],
        [-s * reach, h, 0],
      ],
      0.06,
      m.leaf,
      root,
      18,
    );
    const leaf = mesh(
      geo('leaf', () => {
        const l = new T.SphereGeometry(0.3, 8, 4);
        l.scale(1, 0.12, 0.45);
        return l;
      }),
      m.leaf,
      -s * 0.35,
      0.45,
      0,
      root,
    );
    leaf.rotation.z = s * 0.6;
    const head = new T.Group();
    head.position.set(-s * reach, h, 0);
    root.add(head);
    mesh(bellGeo, m.bell, 0, 0, 0, head);
    const petals = [];
    for (let j = 0; j < 5; j++) {
      const pivot = new T.Group();
      pivot.rotation.y = (j * Math.PI * 2) / 5;
      pivot.position.y = -0.5;
      head.add(pivot);
      petals.push(mesh(petalGeo, m.petal, 0, 0, 0, pivot));
    }
    mesh(
      geo('pistil', () => new T.SphereGeometry(0.07, 6, 4)),
      m.glow,
      0,
      -0.48,
      0,
      head,
    );
    flowers.push({ root, head, petals, s, index: i });
  });
  const echo = k.mat(k.p.glow, { emissive: k.p.glow, emissiveIntensity: 0.9, transparent: true, depthWrite: false }),
    rings = [0, 1].map(i => {
      const r = mesh(
        geo('echo', () => new T.TorusGeometry(1, 0.02, 4, 40)),
        i ? echo.clone() : echo,
        0,
        1.4,
        0,
        g,
      );
      k.materials.push(r.material);
      r.castShadow = false;
      return r;
    });
  return (f, time = 0) => {
    for (const fl of flowers) {
      const t = smooth(span(f, 0.1 + fl.index * 0.06, 0.62 + fl.index * 0.06));
      fl.root.rotation.z = -fl.s * t * 1.45;
      fl.head.rotation.z = fl.s * t * 1.45 * 0.8 + Math.sin(time * 1.6 + fl.index) * 0.04 * (1 - t);
      for (const p of fl.petals) p.rotation.x = -0.25 - t * 0.75;
    }
    rings.forEach((r, i) => {
      const a = (time * 0.45 + i * 0.5) % 1;
      r.visible = f < 0.6;
      r.scale.setScalar(0.6 + a * 2.2);
      r.material.opacity = 1 - a;
    });
  };
}

// Balance gate: a lever arm bars the path; number weights fill the counter-pan until the arm swings up.
function balanceGate(k, g) {
  const { m, mesh, box, cyl, rod, stretch, geo } = k;
  for (const s of [-1, 1]) {
    mesh(cyl(0.2, 0.3, 2.6, 8), m.stone, s * 3.05, 1.3, 0, g);
    mesh(cyl(0.34, 0.34, 0.12, 8), m.metal, s * 3.05, 2.66, 0, g);
    mesh(cyl(0.42, 0.5, 0.2, 8), m.dark, s * 3.05, 0.1, 0, g);
  }
  const hook = mesh(box(0.28, 0.12, 0.3, 0.03), m.metal, 2.86, 1.02, 0, g);
  hook.name = 'rest-hook';
  const pivot = new T.Group();
  pivot.position.set(-3.05, 1.6, 0.32);
  g.add(pivot);
  mesh(cyl(0.12, 0.12, 0.3, 10), m.metal, 0, 0, -0.05, pivot).rotation.x = Math.PI / 2;
  const arm = mesh(box(6.1, 0.2, 0.2, 0.04), m.wood, 2.95, 0, 0, pivot);
  mesh(box(1.25, 0.16, 0.16, 0.03), m.wood, -0.62, 0, 0, pivot);
  for (let i = 0; i < 5; i++) mesh(box(0.08, 0.24, 0.24, 0.02), m.metal, 0.6 + i * 1.15, 0, 0, pivot);
  const pan = new T.Group();
  g.add(pan);
  mesh(cyl(0.42, 0.32, 0.08, 12), m.metal, 0, 0, 0, pan);
  const weights = [0, 1, 2].map(i => {
    const w = mesh(cyl(0.13, 0.15, 0.2, 8), m.metal, (i - 1) * 0.22, 0.14, (i % 2) * 0.1, pan);
    w.visible = false;
    return w;
  });
  const ropes = [0, 1, 2].map(() => rod(m.ink, 0.012, g));
  const dial = new T.Group();
  dial.position.set(3.05, 2.1, 0.22);
  g.add(dial);
  mesh(cyl(0.3, 0.3, 0.04, 16), m.petal, 0, 0, 0, dial).rotation.x = Math.PI / 2;
  const needle = new T.Group();
  needle.position.z = 0.04;
  dial.add(needle);
  mesh(box(0.035, 0.24, 0.02, 0.004), m.ink, 0, 0.1, 0, needle);
  return (f, time, state) => {
    weights.forEach((w, i) => {
      const t = state?.groups[i]?.steps[0] ?? span(f, i * 0.2, i * 0.2 + 0.12);
      w.visible = t > 0;
      w.position.y = 0.14 + (1 - smooth(t)) * 0.9;
    });
    const lift = smooth(span(f, 0.62, 1));
    pivot.rotation.z = -0.1 + lift * (Math.PI / 2 + 0.1) - (f < 0.62 ? 0 : 0);
    const end = new T.Vector3(-0.62 - 0.55, 0, 0).applyEuler(pivot.rotation).add(pivot.position);
    pan.position.set(end.x, Math.max(0.3, end.y - 1.05 - (1 - lift) * 0.02), end.z);
    ropes.forEach((r, i) =>
      stretch(
        r,
        end,
        new T.Vector3(
          pan.position.x + Math.cos(i * 2.1) * 0.36,
          pan.position.y + 0.04,
          pan.position.z + Math.sin(i * 2.1) * 0.36,
        ),
      ),
    );
    needle.rotation.z = 0.9 - 0.9 * span(f, 0, 0.62);
  };
}

// Fruit tree: two heavy branches reach across the path; the fruit ripens and drops, then the branches swing aside.
function fruitTree(k, g) {
  const { m, mesh, geo, tube, mat } = k,
    bark = mat(new T.Color(k.p.wood).multiplyScalar(0.7).getStyle(), {}, 'wood'),
    fruitMat = mat('#8fb860', { emissive: '#f0a050', emissiveIntensity: 0 }),
    leafGeo = geo('clump', () => {
      const c = new T.IcosahedronGeometry(0.5, 1);
      c.scale(1, 0.7, 1);
      return c;
    });
  tube(
    [
      [-3.95, 0, 0],
      [-3.85, 1.4, 0.1],
      [-3.95, 2.8, -0.05],
      [-4.05, 3.6, 0],
    ],
    0.34,
    bark,
    g,
    14,
  );
  for (let i = 0; i < 4; i++) {
    const r = mesh(rockLump(i + 1), bark, -3.95 + Math.cos(i * 1.6) * 0.45, 0.12, Math.sin(i * 1.6) * 0.45, g);
    r.scale.set(0.3, 0.22, 0.3);
  }
  for (let i = 0; i < 4; i++) {
    const c = mesh(leafGeo, m.leaf, -4.15 + Math.cos(i * 1.7) * 0.5, 3.75 + (i % 2) * 0.45, Math.sin(i * 1.7) * 0.6, g);
    c.scale.setScalar(1.25);
  }
  const fruits = [],
    branches = [
      [1.85, 1],
      [2.55, -1],
    ].map(([y, turn], b) => {
      const pivot = new T.Group();
      pivot.position.set(-3.85, y, b ? 0.15 : -0.1);
      g.add(pivot);
      tube(
        [
          [0, 0, 0],
          [2, -0.25, 0],
          [4.2, -0.55 - b * 0.1, 0.05],
          [6.2, -0.75 - b * 0.15, 0],
        ],
        0.12 - b * 0.02,
        bark,
        pivot,
        16,
      );
      for (let i = 0; i < 4; i++) {
        const x = 1.9 + i * 1.4,
          c = mesh(leafGeo, m.leaf, x, -0.25 - i * 0.14 + 0.25, 0, pivot);
        c.scale.set(1, 0.8, 1);
        const f = mesh(
          geo('fruit', () => new T.IcosahedronGeometry(0.16, 1)),
          fruitMat,
          x + 0.2,
          -0.65 - i * 0.14,
          0.1,
          pivot,
        );
        fruits.push({ f, y: f.position.y, i: fruits.length });
      }
      return { pivot, turn };
    });
  return f => {
    fruitMat.color.set('#8fb860').lerp(new T.Color('#f2994a'), smooth(span(f, 0, 0.35)));
    fruitMat.emissiveIntensity = 0.25 * smooth(span(f, 0.1, 0.4));
    for (const q of fruits) {
      const t = span(f, 0.18 + q.i * 0.045, 0.32 + q.i * 0.045);
      q.f.position.y = q.y - smooth(t) * 2.2;
      q.f.visible = t < 1;
      q.f.scale.setScalar(1 - t * 0.4);
    }
    for (const b of branches) {
      const t = smooth(span(f, 0.55, 1));
      b.pivot.rotation.y = (b.turn * t * Math.PI) / 2;
      b.pivot.rotation.z = t * 0.18;
    }
  };
}

// Signposts in fog: three signs hang over a fog bank; the wrong two crumble, the fog clears and the right one points the way.
function signposts(k, g) {
  const { m, mesh, box, cyl, geo, rod, stretch, mat } = k,
    fog = mat('#f4f1e8', { transparent: true, opacity: 0.62, depthWrite: false, roughness: 1 });
  for (const s of [-1, 1]) {
    mesh(cyl(0.13, 0.18, 2.7, 8), m.wood, s * 3.05, 1.35, 0, g);
    mesh(cyl(0.2, 0.16, 0.12, 8), m.dark, s * 3.05, 2.74, 0, g);
  }
  const rope = rod(m.ink, 0.018, g);
  stretch(rope, new T.Vector3(-3.0, 2.35, 0), new T.Vector3(3.0, 2.35, 0));
  const arrow = geo('arrow', () => {
    const b = bevelBox(1.25, 0.38, 0.09, 0.03),
      tip = new T.ConeGeometry(0.27, 0.32, 4);
    tip.rotateZ(-Math.PI / 2);
    tip.rotateX(Math.PI / 4);
    tip.scale(1, 1, 0.33);
    tip.translate(0.78, 0, 0);
    const pos = [...b.attributes.position.array],
      nor = [...b.attributes.normal.array],
      t2 = tip.toNonIndexed();
    pos.push(...t2.attributes.position.array);
    nor.push(...t2.attributes.normal.array);
    const out = new T.BufferGeometry();
    out.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    out.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
    return out;
  });
  const signs = [-1.7, 0, 1.7].map((x, i) => {
    const sign = new T.Group();
    sign.position.set(x, 1.75, 0.05);
    g.add(sign);
    const plank = mesh(
      arrow,
      i === 1 ? mat(k.p.wood, { emissive: k.p.glow, emissiveIntensity: 0 }, 'wood') : m.wood,
      0,
      0,
      0,
      sign,
    );
    plank.rotation.y = i === 0 ? Math.PI : 0;
    for (let j = 0; j < 3; j++)
      mesh(box(0.22 + ((i + j) % 2) * 0.16, 0.04, 0.02, 0.008), m.ink, -0.35 + j * 0.33, 0.03, 0.06, sign);
    const strings = [-0.4, 0.4].map(dx => {
      const r = rod(m.ink, 0.01, g);
      return { r, dx };
    });
    return { sign, plank, strings, x, i };
  });
  const puffs = [];
  for (let i = 0; i < 9; i++) {
    const p = mesh(
      geo('puff', () => {
        const q = new T.SphereGeometry(0.8, 10, 6);
        q.scale(1, 0.42, 0.8);
        return q;
      }),
      fog,
      -2.5 + i * 0.62,
      0.35 + (i % 2) * 0.1,
      ((i % 3) - 1) * 0.35,
      g,
    );
    p.castShadow = false;
    puffs.push(p);
  }
  return (f, time = 0) => {
    for (const s of signs) {
      if (s.i === 1) {
        const t = smooth(span(f, 0.5, 1));
        s.sign.position.set(s.x + t * 3.0, 1.75 + Math.sin(t * Math.PI) * 0.6 - t * 0.15, 0.05 + t * 0.22);
        s.sign.rotation.set(0, (t * Math.PI) / 2, Math.sin(time * 1.3) * 0.04 * (1 - t));
        s.plank.material.emissiveIntensity = 0.7 * smooth(span(f, 0.35, 0.6));
      } else {
        const t = smooth(span(f, s.i ? 0.2 : 0.05, s.i ? 0.45 : 0.3)),
          side = s.i ? 1 : -1;
        s.sign.rotation.z = -side * t * 1.3;
        s.sign.position.set(s.x + (side * 3.4 - s.x) * t, 1.75 - t * 0.25, 0.05 + t * 0.2);
        s.sign.visible = true;
      }
      for (const st of s.strings) {
        st.r.visible = f < 0.5 && s.sign.visible;
        stretch(
          st.r,
          new T.Vector3(s.sign.position.x + st.dx, 2.35, 0),
          new T.Vector3(s.sign.position.x + st.dx, s.sign.position.y + 0.2, s.sign.position.z),
        );
      }
    }
    rope.visible = f < 0.55;
    fog.opacity = 0.62 * (1 - smooth(span(f, 0.25, 0.8)));
    for (const p of puffs) {
      p.visible = f < 0.8;
      p.position.x += Math.sin(time * 0.4 + p.position.z) * 0.0008;
    }
  };
}

// Mushroom ring: corrupted glowing mushrooms crowd the path; they burst one by one and the edge mushrooms heal.
function mushroomRing(k, g) {
  const { m, mesh, cyl, geo, mat } = k,
    sick = mat('#8a5aa8', { emissive: '#a070d0', emissiveIntensity: 0.45 }),
    stem = mat('#d9cdb8'),
    spot = mat('#efe6f6', { emissive: '#d8c8f0', emissiveIntensity: 0.3 });
  const capGeo = geo('cap', () => {
      const c = new T.SphereGeometry(0.5, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      c.scale(1, 0.62, 1);
      return c;
    }),
    spotGeo = geo('spot', () => new T.CircleGeometry(0.07, 8));
  const make = (x, z, h, r, cap) => {
    const grp = new T.Group();
    grp.position.set(x, 0, z);
    g.add(grp);
    mesh(cyl(r * 0.24, r * 0.32, h, 8), stem, 0, h / 2, 0, grp);
    const c = mesh(capGeo, cap, 0, h - 0.02, 0, grp);
    c.scale.multiplyScalar(r * 2);
    for (let j = 0; j < 4; j++) {
      const a = j * 1.7,
        d = mesh(spotGeo, spot, Math.cos(a) * r * 0.55, h + r * 0.35 + (j % 2) * r * 0.08, Math.sin(a) * r * 0.55, grp);
      d.lookAt(new T.Vector3(Math.cos(a) * r * 4, h + r * 2, Math.sin(a) * r * 4).add(grp.position));
    }
    return grp;
  };
  const big = [
    [-1.9, 0.2, 1.25, 0.75],
    [-0.7, -0.35, 1.7, 0.95],
    [0.6, 0.25, 1.4, 0.85],
    [1.8, -0.25, 1.1, 0.7],
    [-0.05, 0.75, 0.8, 0.55],
    [1.2, 0.85, 0.7, 0.5],
  ].map(([x, z, h, r], i) => ({ grp: make(x, z, h, r, sick), i }));
  const healthyCap = mat('#c45a3c'),
    edge = [];
  for (const s of [-1, 1])
    for (let i = 0; i < 3; i++)
      edge.push(make(s * (2.95 + (i % 2) * 0.25), (i - 1) * 0.55, 0.42 + i * 0.12, 0.28, healthyCap));
  const spores = [];
  for (let i = 0; i < 14; i++) {
    const sp = mesh(
      geo('spore', () => new T.OctahedronGeometry(0.04, 0)),
      spot,
      -2 + ((i * 7) % 10) * 0.42,
      0.5,
      (((i * 3) % 5) - 2) * 0.3,
      g,
    );
    sp.castShadow = false;
    spores.push(sp);
  }
  const healthy = new T.Color('#c45a3c'),
    purple = new T.Color('#8a5aa8');
  return (f, time = 0) => {
    for (const b of big) {
      const t = span(f, 0.08 + b.i * 0.12, 0.24 + b.i * 0.12),
        pop = t < 0.35 ? 1 + Math.sin((t / 0.35) * Math.PI) * 0.18 : Math.max(0.001, 1 - smooth((t - 0.35) / 0.65));
      b.grp.scale.set(pop, t < 0.35 ? pop : pop * 0.6 + 0.001, pop);
      b.grp.visible = t < 1;
    }
    healthyCap.color.copy(purple).lerp(healthy, smooth(span(f, 0.4, 1)));
    sick.emissiveIntensity = 0.35 + 0.15 * Math.sin(time * 2.2);
    spores.forEach((sp, i) => {
      sp.visible = f < 0.85;
      sp.position.y = 0.4 + ((time * 0.25 + i * 0.13) % 1) * 1.6;
    });
  };
}

// Crystal chimes: chimes hang across the path from a split beam; each rings and shatters, then the beam folds up.
function crystalChimes(k, g) {
  const { m, mesh, box, cyl, geo, rod, stretch, mat } = k,
    glass = mat(k.p.glow, {
      emissive: k.p.glow,
      emissiveIntensity: 0.15,
      roughness: 0.2,
      transparent: true,
      opacity: 0.88,
    });
  for (const side of [-1, 1]) {
    mesh(cyl(0.2, 0.28, 3.1, 6), m.stone, side * 3.05, 1.55, 0, g);
    mesh(box(0.6, 0.2, 1.6, 0.05), m.dark, side * 3.05, 3.15, 0, g);
  }
  const arms = [];
  for (let i = 0; i < 3; i++) {
    const side = i === 1 ? 1 : -1,
      pivot = new T.Group();
    pivot.position.set(side * 3.05, 2.9, (i - 1) * 0.5);
    g.add(pivot);
    mesh(cyl(0.09, 0.09, 0.5, 10), m.metal, side * 3.05, 2.9, (i - 1) * 0.5, g);
    mesh(box(2.7, 0.14, 0.18, 0.025), m.wood, -side * 1.35, 0, 0, pivot);
    for (let j = 0; j < 3; j++) {
      const x = -side * (0.7 + j * 0.82),
        y = -0.75 - j * 0.22,
        chime = mesh(
          geo('tuned-chime', () => {
            const q = new T.OctahedronGeometry(0.17, 0);
            q.scale(0.8, 2, 0.8);
            return q;
          }),
          glass,
          x,
          y,
          0,
          pivot,
        ),
        string = rod(m.ink, 0.01, pivot);
      stretch(string, new T.Vector3(x, -0.05, 0), new T.Vector3(x, y + 0.34, 0));
      chime.name = 'chime-' + i + '-' + j;
    }
    const stop = mesh(box(0.18, 0.25, 0.28, 0.025), m.metal, side * 3.05, 2.75, (i - 1) * 0.5, g);
    stop.name = 'chime-bearing-' + i;
    arms.push({ pivot, side, i });
  }
  return (f, time = 0, state) => {
    for (const a of arms) {
      const value = state?.groups[a.i]?.steps[0] ?? span(f, a.i / 3, (a.i + 1) / 3);
      a.pivot.rotation.y = (a.side * smooth(value) * Math.PI) / 2;
    }
  };
}

// Split-log bridge: broken log halves jut up from a murky stream; they swing down and join into a crossing.
function splitLogs(k, g) {
  const { m, mesh, box, cyl, geo, mat } = k,
    water = liquidMaterial(new T.Color(k.p.water).lerp(new T.Color(k.p.moss), 0.45).getStyle(), {
      local: true,
      halfWidth: 3.3,
      halfLength: 1.15,
    });
  k.materials.push(water);
  const stream = mesh(new T.BoxGeometry(6.6, 0.04, 2.3), water, 0, 0, 0, g);
  stream.castShadow = false;
  for (const s of [-1, 1])
    for (let i = 0; i < 5; i++) {
      const l = mesh(rockLump(i + 1), i % 2 ? m.moss : m.stone, s * (2.95 + (i % 2) * 0.3), 0.12, (i - 2) * 0.5, g);
      l.scale.set(0.34, 0.3, 0.32);
    }
  const split = mat(new T.Color(k.p.wood).lerp(new T.Color('#f0d9a8'), 0.45).getStyle(), {}, 'wood'),
    bark = mat(new T.Color(k.p.wood).multiplyScalar(0.72).getStyle(), {}, 'wood'),
    barkShell = mat(new T.Color(k.p.wood).multiplyScalar(0.62).getStyle(), { side: T.DoubleSide }, 'wood');
  const halves = [];
  [-1.25, 0, 1.25].forEach((x, i) => {
    for (const end of [-1, 1]) {
      const pivot = new T.Group();
      pivot.position.set(x, 0.03, end * 1.15);
      g.add(pivot);
      // Each half reaches from its bank to the middle; its flat split face stays on top when it lies down.
      mesh(box(0.62, 0.05, 1.15, 0.02), split, 0, 0, -end * 0.575, pivot);
      const shell = mesh(
        geo('bark', () => {
          const c = new T.CylinderGeometry(0.31, 0.31, 1.15, 10, 1, true, -Math.PI / 2, Math.PI);
          c.rotateX(Math.PI / 2);
          return c;
        }),
        barkShell,
        0,
        -0.02,
        -end * 0.575,
        pivot,
      );
      shell.scale.y = 0.75;
      const tip = mesh(
        geo('splinter', () => new T.ConeGeometry(0.08, 0.3, 4)),
        split,
        end > 0 ? 0.15 : -0.15,
        0,
        -end * 1.15,
        pivot,
      );
      tip.rotation.x = (-end * Math.PI) / 2;
      tip.name = 'splinter';
      mesh(cyl(0.035, 0.035, 0.75, 8), m.metal, x, 0.025, end * 1.15, g).rotation.z = Math.PI / 2;
      for (const dx of [-0.32, 0.32]) mesh(box(0.06, 0.06, 0.18, 0.01), m.metal, x + dx, 0.035, end * 1.15, g);
      halves.push({ pivot, end, i, tip });
    }
  });
  return (f, time, state) => {
    for (const h of halves) {
      const t = state?.groups[h.i]?.steps[0] ?? span(f, 0.08 + h.i * 0.24, 0.38 + h.i * 0.24),
        drop = smooth(t),
        bounce = t > 0 && t < 1 ? Math.sin(t * Math.PI * 3) * (1 - t) * 0.08 : 0;
      h.pivot.rotation.x = h.end * (1 - drop) * 1.15 + bounce * h.end;
      h.tip.visible = t < 1;
      h.tip.scale.setScalar(t < 1 ? 1 : 0.001);
    }
  };
}

// A small perching bird (body, head, beak, tail, two flapping wings) facing +z.
function bird(k, color) {
  const { mesh, geo, mat } = k,
    g = new T.Group(),
    body = mat(color),
    belly = mat(new T.Color(color).lerp(new T.Color('#fff4dc'), 0.55).getStyle()),
    beak = mat('#e8a83a');
  const b = mesh(
    geo('bbody', () => {
      const q = new T.SphereGeometry(0.2, 10, 7);
      q.scale(0.85, 0.8, 1.15);
      return q;
    }),
    body,
    0,
    0.2,
    0,
    g,
  );
  mesh(
    geo('bbelly', () => {
      const q = new T.SphereGeometry(0.15, 8, 6);
      q.scale(0.8, 0.8, 0.6);
      return q;
    }),
    belly,
    0,
    0.15,
    0.1,
    g,
  );
  mesh(
    geo('bhead', () => new T.SphereGeometry(0.13, 10, 7)),
    body,
    0,
    0.4,
    0.12,
    g,
  );
  const bk = mesh(
    geo('bbeak', () => new T.ConeGeometry(0.04, 0.12, 5)),
    beak,
    0,
    0.39,
    0.27,
    g,
  );
  bk.rotation.x = Math.PI / 2;
  const birdEyes = [];
  for (const s of [-1, 1]) {
    birdEyes.push(
      mesh(
        geo('beye', () => new T.SphereGeometry(0.025, 6, 4)),
        k.m.ink,
        s * 0.07,
        0.43,
        0.22,
        g,
      ),
    );
  }
  g.userData.blink = eyeBlink(birdEyes, g.id);
  const tail = mesh(
    geo('btail', () => {
      const q = new T.ConeGeometry(0.08, 0.28, 4);
      q.rotateX(-Math.PI / 2 - 0.4);
      return q;
    }),
    body,
    0,
    0.22,
    -0.24,
    g,
  );
  const wings = [-1, 1].map(s => {
    const pivot = new T.Group();
    pivot.position.set(s * 0.15, 0.27, 0);
    g.add(pivot);
    const w = mesh(
      geo('bwing', () => {
        const q = new T.SphereGeometry(0.17, 8, 5);
        q.scale(0.35, 0.12, 1);
        q.translate(0, 0, -0.02);
        return q;
      }),
      body,
      s * 0.05,
      0,
      0,
      pivot,
    );
    w.rotation.z = s * 0.3;
    return { pivot, s };
  });
  g.userData.flap = (t, amount) => {
    for (const w of wings) w.pivot.rotation.z = w.s * (-0.2 + Math.sin(t) * amount);
  };
  return g;
}

// Message birds: birds holding message scrolls sit on a rope across the path; they fly off and the rope halves drop.
function messageBirds(k, g) {
  const { m, mesh, box, cyl, geo, rod, stretch, mat } = k,
    paper = mat('#efe2c4', {}, 'paper');
  for (const s of [-1, 1]) {
    mesh(cyl(0.12, 0.16, 2.5, 8), m.wood, s * 3.05, 1.25, 0, g);
    mesh(box(0.5, 0.12, 0.5, 0.03), m.dark, s * 3.05, 2.52, 0, g);
  }
  const halves = [-1, 1].map(s => {
    const pivot = new T.Group();
    pivot.position.set(s * 3.0, 2.3, 0);
    g.add(pivot);
    const r = rod(m.ink, 0.02, pivot);
    stretch(r, new T.Vector3(0, 0, 0), new T.Vector3(-s * 3.0, -0.25, 0));
    return { pivot, s };
  });
  const colours = ['#5f86b8', '#c8783a', '#7a9c4c', '#b85f6a', '#d6b04a'],
    birds = [-2.3, -1.15, 0, 1.15, 2.3].map((x, i) => {
      const b = bird(k, colours[i]);
      b.position.set(x, 2.08 - Math.cos(((x / 3) * Math.PI) / 2) * 0.22 + 0.0, 0);
      b.scale.setScalar(1.25);
      g.add(b);
      const scroll = new T.Group();
      scroll.position.set(0, -0.05, 0.18);
      b.add(scroll);
      const string = rod(m.ink, 0.008, scroll);
      stretch(string, new T.Vector3(0, 0, 0), new T.Vector3(0, -0.55, 0));
      mesh(
        geo('scroll', () => {
          const q = new T.CylinderGeometry(0.06, 0.06, 0.42, 10);
          q.rotateZ(Math.PI / 2);
          return q;
        }),
        paper,
        0,
        -0.62,
        0,
        scroll,
      );
      mesh(box(0.36, 0.3, 0.01, 0.004), paper, 0, -0.82, 0, scroll);
      return { b, x, i, y: b.position.y };
    });
  return (f, time = 0, state) => {
    for (const q of birds) {
      const t = state?.groups[q.i % 3]?.steps[0] ?? span(f, 0.04 + q.i * 0.12, 0.3 + q.i * 0.12),
        side = q.x < 0 || (q.x === 0 && q.i % 2) ? -1 : 1;
      q.b.position.set(q.x + side * smooth(t) * 4.5, q.y + smooth(t) * 3.2, smooth(t) * -1.5);
      q.b.rotation.y = side * smooth(span(t, 0, 0.2)) * 0.9;
      q.b.userData.flap(time * (t > 0 ? 22 : 3) + q.i, t > 0 ? 1.1 : 0.08);
      q.b.visible = t < 1;
    }
    const drop = smooth(span(f, 0.72, 1));
    for (const h of halves) h.pivot.rotation.z = h.s * drop * (Math.PI / 2 - 0.08);
  };
}

// Water wheel: a portcullis bars the path; paddles slot into the wheel, it turns and lowers the portcullis into the ground.
function waterWheel(k, g) {
  const { m, mesh, box, cyl, geo, rod, stretch, mat } = k,
    water = liquidMaterial(k.p.water, { local: true, halfWidth: 0.4, halfLength: 1.4 });
  k.materials.push(water);
  for (const s of [-1, 1]) {
    mesh(box(0.42, 3.0, 0.5, 0.06), m.stone, s * 2.95, 1.5, 0, g);
    mesh(box(0.6, 0.2, 0.66, 0.05), m.dark, s * 2.95, 3.08, 0, g);
  }
  const gate = new T.Group();
  g.add(gate);
  for (let i = 0; i < 9; i++) mesh(box(0.12, 2.5, 0.12, 0.03), m.dark, -2.4 + i * 0.6, 1.25, 0, gate);
  for (const y of [0.5, 1.4, 2.3]) mesh(box(5.0, 0.14, 0.1, 0.03), m.dark, 0, y, 0.06, gate);
  for (let i = 0; i < 9; i++) {
    const tip = mesh(
      geo('spike', () => new T.ConeGeometry(0.08, 0.22, 4)),
      m.metal,
      -2.4 + i * 0.6,
      -0.08,
      0,
      gate,
    );
    tip.rotation.x = Math.PI;
  }
  const wheel = new T.Group();
  wheel.name = 'water-drive-wheel';
  wheel.position.set(3.75, 1.3, 0.2);
  g.add(wheel);
  const rim = mesh(
    geo('rim', () => {
      const q = new T.TorusGeometry(1.05, 0.06, 6, 28);
      q.rotateY(Math.PI / 2);
      return q;
    }),
    m.wood,
    0,
    0,
    0,
    wheel,
  );
  rim.castShadow = true;
  for (let i = 0; i < 6; i++) {
    const sp = mesh(box(0.08, 2.05, 0.08, 0.02), m.wood, 0, 0, 0, wheel);
    sp.rotation.x = (i * Math.PI) / 6;
  }
  mesh(cyl(0.16, 0.16, 0.4, 10), m.metal, 0, 0, 0, wheel).rotation.z = Math.PI / 2;
  const paddles = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4,
      p = mesh(box(0.42, 0.06, 0.36, 0.015), m.wood, 0, Math.cos(a) * 1.08, Math.sin(a) * 1.08, wheel);
    p.rotation.x = -a;
    paddles.push({ p, i });
  }
  for (const x of [3.4, 4.1]) mesh(box(0.14, 1.35, 0.35, 0.025), m.stone, x, 0.67, 0.2, g);
  for (const z of [-0.15, 0.15]) mesh(box(0.08, 0.2, 1.6, 0.015), m.wood, 3.75 + z * 1.65, 2.7, -1.1, g);
  for (const x of [-2.7, 2.7]) mesh(box(0.12, 2.65, 0.18, 0.02), m.metal, x, 1.3, 0, g);
  mesh(box(5.6, 0.035, 0.28, 0.01), m.dark, 0, 0.03, 0, g);
  const chute = mesh(box(0.6, 0.12, 1.6, 0.03), m.wood, 3.75, 2.65, -1.1, g);
  chute.rotation.x = 0.18;
  const fall = mesh(new T.BoxGeometry(0.4, 1.3, 0.1), water, 3.75, 1.95, -0.35, g);
  fall.name = 'wheel-feed-flow';
  fall.castShadow = false;
  const ropes = [-1, 1].map(() => rod(m.ink, 0.02, g));
  let angle = 0,
    last = 0;
  return (f, time = 0) => {
    const dt = Math.max(0, Math.min(0.1, time - last));
    last = time;
    paddles.forEach(q => {
      const on = span(f, q.i * 0.07, q.i * 0.07 + 0.06) > 0 || q.i % 2;
      q.p.visible = !!on;
    });
    angle += dt * f * 2.2;
    wheel.rotation.x = angle;
    fall.visible = f > 0.05;
    const lower = smooth(span(f, 0.55, 1));
    gate.position.y = -lower * 2.62;
    gate.visible = lower < 1;
    ropes.forEach((r, i) => {
      const s = i ? 1 : -1;
      stretch(r, new T.Vector3(s * 2.9, 3.1, 0), new T.Vector3(s * 2.4, 2.5 + gate.position.y, 0));
      r.visible = lower < 1;
    });
  };
}

// Seal stone: a round stone door with a glowing crack and a missing tile; the tile flies in, the crack seals, it rolls down.
function sealStone(k, g) {
  const { m, mesh, box, cyl, geo, mat } = k,
    crack = mat(k.p.glow, { emissive: k.p.glow, emissiveIntensity: 1.1 }),
    tileM = mat(k.p.metal, { metalness: 0.3, roughness: 0.4, emissive: k.p.glow, emissiveIntensity: 0 });
  for (const s of [-1, 1]) {
    mesh(cyl(0.32, 0.42, 3.4, 8), m.stone, s * 3.05, 1.7, 0, g);
    mesh(cyl(0.48, 0.36, 0.24, 8), m.dark, s * 3.05, 3.5, 0, g);
  }
  const seal = new T.Group();
  seal.position.set(0, 1.7, 0);
  g.add(seal);
  const disc = mesh(
    geo('seal', () => {
      const q = new T.CylinderGeometry(1.7, 1.7, 0.42, 32);
      q.rotateX(Math.PI / 2);
      return q;
    }),
    m.stone,
    0,
    0,
    0,
    seal,
  );
  mesh(
    geo('sealrim', () => new T.TorusGeometry(1.62, 0.08, 6, 40)),
    m.dark,
    0,
    0,
    0.22,
    seal,
  );
  mesh(
    geo('sealin', () => new T.TorusGeometry(0.95, 0.05, 6, 32)),
    m.dark,
    0,
    0,
    0.22,
    seal,
  );
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4,
      t = mesh(
        box(0.42, 0.3, 0.06, 0.02),
        i === 2 ? tileM : m.dark,
        Math.cos(a) * 1.28,
        Math.sin(a) * 1.28,
        0.22,
        seal,
      );
    t.rotation.z = a + Math.PI / 2;
    if (i === 2) t.name = 'missing-tile';
  }
  const tile = seal.getObjectByName('missing-tile'),
    home = tile.position.clone();
  const cracks = [
    [
      [-0.2, 1.5],
      [0.15, 0.8],
      [-0.1, 0.2],
      [0.2, -0.6],
      [-0.05, -1.5],
    ],
  ].flatMap(pts =>
    pts.slice(1).map((p, i) => {
      const a = pts[i],
        len = Math.hypot(p[0] - a[0], p[1] - a[1]),
        c = mesh(box(0.06, len, 0.02, 0.008), crack, (a[0] + p[0]) / 2, (a[1] + p[1]) / 2, 0.23, seal);
      c.rotation.z = Math.atan2(-(p[0] - a[0]), p[1] - a[1]);
      return c;
    }),
  );
  return f => {
    const fly = smooth(span(f, 0.1, 0.45));
    tile.position.set(home.x + (1 - fly) * 1.8, home.y + (1 - fly) * 1.2, home.z + (1 - fly) * 0.8);
    tileM.emissiveIntensity = fly * 0.6;
    crack.emissiveIntensity = 1.1 * (1 - smooth(span(f, 0.4, 0.65)));
    cracks.forEach(c => (c.scale.x = 1 - smooth(span(f, 0.45, 0.65)) * 0.9));
    const sink = smooth(span(f, 0.62, 1));
    seal.position.y = 1.7 - sink * 3.55;
    seal.rotation.z = -sink * 1.4;
    seal.visible = sink < 1;
  };
}

// A large friendly owl (body, face discs, eyes, tufts, wings, toes) facing +z; returns the figure and its head.
function owlFigure(k) {
  const { mesh, geo, mat } = k,
    feather = mat(new T.Color(k.p.wood).lerp(new T.Color('#c9a87a'), 0.4).getStyle(), {}, 'wood'),
    face = mat('#f1e3c4'),
    eyeM = mat('#f6f2e6'),
    pupil = mat('#203028'),
    beakM = mat('#e0a23c');
  const owl = new T.Group();
  const body = mesh(
    geo('obody', () => {
      const q = new T.SphereGeometry(0.75, 16, 12);
      q.scale(1, 1.15, 0.9);
      return q;
    }),
    feather,
    0,
    0.86,
    0,
    owl,
  );
  mesh(
    geo('obelly', () => {
      const q = new T.SphereGeometry(0.55, 12, 8);
      q.scale(1, 1.1, 0.5);
      return q;
    }),
    face,
    0,
    0.75,
    0.42,
    owl,
  );
  const head = new T.Group();
  head.position.set(0, 1.7, 0);
  owl.add(head);
  mesh(
    geo('ohead', () => {
      const q = new T.SphereGeometry(0.55, 16, 12);
      q.scale(1.1, 0.9, 0.95);
      return q;
    }),
    feather,
    0,
    0,
    0,
    head,
  );
  const owlEyes = [];
  for (const s of [-1, 1]) {
    mesh(
      geo('odisc', () => {
        const q = new T.CircleGeometry(0.24, 16);
        return q;
      }),
      face,
      s * 0.22,
      0.02,
      0.5,
      head,
    );
    const eye = mesh(
      geo('oeye', () => new T.SphereGeometry(0.13, 10, 8)),
      eyeM,
      s * 0.22,
      0.03,
      0.47,
      head,
    );
    eye.scale.z = 0.6;
    owlEyes.push(
      eye,
      mesh(
        geo('opupil', () => new T.SphereGeometry(0.07, 8, 6)),
        pupil,
        s * 0.22,
        0.03,
        0.55,
        head,
      ),
    );
    const tuft = mesh(
      geo('otuft', () => new T.ConeGeometry(0.12, 0.35, 5)),
      feather,
      s * 0.38,
      0.48,
      0,
      head,
    );
    tuft.rotation.z = -s * 0.4;
  }
  const beak = mesh(
    geo('obeak', () => new T.ConeGeometry(0.07, 0.2, 5)),
    beakM,
    0,
    -0.12,
    0.55,
    head,
  );
  beak.rotation.x = Math.PI / 2 + 0.4;
  for (const s of [-1, 1]) {
    const w = mesh(
      geo('owing', () => {
        const q = new T.SphereGeometry(0.45, 10, 8);
        q.scale(0.35, 1, 0.8);
        return q;
      }),
      feather,
      s * 0.72,
      0.9,
      -0.05,
      owl,
    );
    w.rotation.z = s * 0.15;
    for (let j = 0; j < 3; j++) {
      const toe = mesh(
        geo('otoe', () => new T.ConeGeometry(0.05, 0.18, 4)),
        beakM,
        s * 0.25 + (j - 1) * 0.08,
        0.05,
        0.35,
        owl,
      );
      toe.rotation.x = Math.PI / 2;
    }
  }
  owl.userData.blink = eyeBlink(owlEyes, owl.id);
  return { owl, head };
}

// Woodland visitor: a large owl sits in the middle of the path; it nods, then hops aside and settles.
function woodlandVisitor(k, g) {
  const { m, mesh, geo } = k,
    { owl, head } = owlFigure(k);
  g.add(owl);
  for (const s of [-1, 1]) {
    mesh(k.cyl(0.06, 0.08, 1.2, 6), m.wood, s * 3.0, 0.6, 0.3, g);
    const lamp = mesh(
      geo('lamp', () => new T.OctahedronGeometry(0.14, 0)),
      m.glow,
      s * 3.0,
      1.3,
      0.3,
      g,
    );
    lamp.castShadow = false;
  }
  return (f, time = 0) => {
    const nod = span(f, 0, 0.5);
    head.rotation.x = Math.sin(nod * Math.PI * 3) * 0.25 * (1 - span(f, 0.45, 0.5)) + Math.sin(time * 0.8) * 0.03;
    head.rotation.y = Math.sin(time * 0.5) * 0.15 * (1 - f);
    const hop = span(f, 0.5, 1),
      hx = smooth(hop) * 3.45,
      arc = Math.abs(Math.sin(hop * Math.PI * 3)) * 0.45 * (1 - hop * 0.3);
    owl.position.set(hx, arc, smooth(hop) * 0.6);
    owl.rotation.y = Math.sin(hop * Math.PI) * -1.2 + smooth(span(hop, 0.8, 1)) * -0.5;
    owl.scale.setScalar(1 - smooth(hop) * 0.18);
  };
}

// Supply carts: two handcarts block the path; crates and sacks drop in, then the carts turn and roll to the sides.
function supplyCarts(k, g) {
  const { m, mesh, box, cyl, geo, mat } = k,
    sack = mat('#c9b48a'),
    crate = mat(new T.Color(k.p.wood).lerp(new T.Color('#e0c38a'), 0.3).getStyle(), {}, 'wood'),
    signM = mat('#efe2c4', {}, 'paper');
  const carts = [-1, 1].map((s, ci) => {
    const c = new T.Group();
    c.position.set(s * 1.3, 0, 0);
    g.add(c);
    mesh(box(2.0, 0.12, 1.05, 0.03), m.wood, 0, 0.62, 0, c);
    for (const z of [-0.5, 0.5]) mesh(box(2.0, 0.42, 0.07, 0.02), m.wood, 0, 0.86, z, c);
    for (const x of [-1, 1]) mesh(box(0.07, 0.42, 1.05, 0.02), m.wood, x * 0.98, 0.86, 0, c);
    const wheels = [-1, 1].map(z => {
      const w = mesh(
        geo('cwheel', () => {
          const q = new T.CylinderGeometry(0.42, 0.42, 0.08, 14);
          q.rotateX(Math.PI / 2);
          return q;
        }),
        m.dark,
        0.45,
        0.42,
        z * 0.6,
        c,
      );
      return w;
    });
    mesh(box(0.06, 0.06, 1.3, 0.01), m.metal, 0.45, 0.42, 0, c);
    const handle = mesh(box(0.9, 0.07, 0.07, 0.02), m.wood, -1.38, 0.85, 0, c);
    handle.rotation.z = -0.4;
    const sign = mesh(box(0.9, 0.42, 0.05, 0.02), signM, 0, 1.42, 0.55, c);
    mesh(box(0.06, 0.4, 0.06, 0.02), m.wood, 0, 1.12, 0.55, c);
    const items = [0, 1, 2].map(i => {
      const it = mesh(
        i === 1
          ? geo('sack', () => {
              const q = new T.SphereGeometry(0.26, 10, 8);
              q.scale(1, 0.8, 1);
              return q;
            })
          : box(0.38, 0.34, 0.38, 0.04),
        i === 1 ? sack : crate,
        (i - 1) * 0.55,
        0.9,
        (i % 2) * 0.15 - 0.05,
        c,
      );
      it.visible = false;
      return { it, i };
    });
    return { c, s, wheels, items, ci };
  });
  return f => {
    for (const cart of carts) {
      cart.items.forEach(q => {
        const t = span(f, cart.ci * 0.08 + q.i * 0.16, cart.ci * 0.08 + q.i * 0.16 + 0.12);
        q.it.visible = t > 0;
        q.it.position.y = 0.9 + (1 - smooth(t)) * 1.6;
      });
      const roll = smooth(span(f, 0.6, 1));
      cart.c.rotation.y = (-cart.s * roll * Math.PI) / 2;
      cart.c.position.x = cart.s * (1.3 + roll * 2.15);
      cart.wheels.forEach(w => (w.rotation.z = -roll * 5));
    }
  };
}

// A carved totem with a sleeping face whose eyes can open and glow; returns the figure and its eye material.
function totemFigure(k, h = 2.4) {
  const { m, mesh, box, cyl, geo, mat } = k,
    g = new T.Group(),
    eye = mat(k.p.dark, { emissive: k.p.glow, emissiveIntensity: 0 });
  mesh(box(0.95, h, 0.75, 0.12), m.stone, 0, h / 2, 0, g);
  mesh(box(1.15, 0.22, 0.9, 0.06), m.dark, 0, h + 0.1, 0, g);
  mesh(cyl(0.6, 0.7, 0.2, 8), m.dark, 0, 0.1, 0, g);
  const lids = [-1, 1].map(s => {
    mesh(box(0.26, 0.12, 0.06, 0.03), eye, s * 0.22, h * 0.72, 0.39, g);
    const lid = mesh(box(0.3, 0.08, 0.08, 0.03), m.stone, s * 0.22, h * 0.72 + 0.03, 0.42, g);
    return lid;
  });
  mesh(box(0.12, 0.3, 0.08, 0.03), m.dark, 0, h * 0.58, 0.4, g);
  mesh(box(0.42, 0.07, 0.06, 0.02), m.dark, 0, h * 0.44, 0.39, g);
  for (const s of [-1, 1]) mesh(box(0.12, 0.5, 0.1, 0.03), m.moss, s * 0.42, h * 0.2, 0.36, g);
  return { g, eye, lids, h };
}

// Word totems: three sleeping totems stand across the path; their eyes open, then they slide aside.
function wordTotems(k, g) {
  const totems = [-1.75, 0, 1.75].map((x, i) => {
    const t = totemFigure(k, 2.3 + (i % 2) * 0.35);
    t.g.position.set(x, 0, 0);
    g.add(t.g);
    return { ...t, x, i };
  });
  return (f, time, state) => {
    for (const t of totems) {
      const wake = state?.groups[t.i]?.steps[0] ?? smooth(span(f, t.i * 0.15, t.i * 0.15 + 0.2));
      t.eye.emissiveIntensity = wake * 1.4;
      t.lids.forEach(l => (l.position.y = t.h * 0.72 + 0.03 + wake * 0.12));
      const move = state ? wake : smooth(span(f, 0.6 + t.i * 0.05, 0.95 + t.i * 0.02));
      if (t.i === 1) {
        t.g.position.y = -move * (t.h + 0.3);
        t.g.visible = move < 1;
      } else {
        t.g.position.x = t.x + Math.sign(t.x) * move * 1.85;
        t.g.rotation.y = -Math.sign(t.x) * move * 0.3;
      }
    }
  };
}

// Crate wall: picture crates stacked across the path; lids pop and the crates slide off and stack at the sides.
function crateWall(k, g) {
  const { m, mesh, box, cyl, geo, mat } = k,
    woodL = mat(new T.Color(k.p.wood).lerp(new T.Color('#e0c38a'), 0.3).getStyle(), {}, 'wood'),
    label = mat('#efe2c4', {}, 'paper');
  const crate = parent => {
    mesh(box(0.9, 0.9, 0.9, 0.05), woodL, 0, 0.45, 0, parent);
    for (const y of [0.12, 0.78]) mesh(box(0.94, 0.1, 0.94, 0.02), m.wood, 0, y, 0, parent);
    for (const x of [-1, 1]) mesh(box(0.1, 0.9, 0.94, 0.02), m.wood, x * 0.42, 0.45, 0, parent);
    mesh(box(0.45, 0.36, 0.02, 0.01), label, 0, 0.46, 0.47, parent);
    const lid = new T.Group();
    lid.position.set(0, 0.9, -0.47);
    parent.add(lid);
    mesh(box(0.94, 0.07, 0.94, 0.02), m.wood, 0, 0.035, 0.47, lid);
    mesh(cyl(0.04, 0.04, 0.9, 8), m.metal, 0, 0.9, -0.47, parent).rotation.z = Math.PI / 2;
    return lid;
  };
  const crates = [];
  for (let r = 0; r < 2; r++)
    for (let c = 0; c < 5; c++) {
      if (r && (c === 0 || c === 4)) continue;
      const grp = new T.Group(),
        x = (c - 2) * 0.95,
        y = r * 0.9;
      grp.position.set(x, y, 0);
      g.add(grp);
      const lid = crate(grp);
      crates.push({ grp, lid, x, y, n: crates.length });
    }
  const sides = [];
  crates.forEach((q, i) => {
    const s = q.x < 0 || (q.x === 0 && i % 2) ? -1 : 1,
      count = sides.filter(v => v === s).length;
    sides.push(s);
    q.side = s;
    q.slot = count;
  });
  return (f, time, state) => {
    for (const q of crates) {
      const t = state?.groups[q.n % 3]?.steps[0] ?? smooth(span(f, 0.05 + q.n * 0.11, 0.22 + q.n * 0.11)),
        pop = state?.groups[q.n % 3]?.steps[0] ?? span(f, 0.02 + q.n * 0.11, 0.1 + q.n * 0.11);
      q.lid.rotation.x = -smooth(pop) * 1.1;
      const tx = q.side * 3.12,
        ty = Math.floor(q.slot / 2) * 0.9,
        tz = (q.slot % 2) * 0.95 - 0.45;
      q.grp.position.set(q.x + (tx - q.x) * t, q.y + (ty - q.y) * t + Math.sin(t * Math.PI) * 0.8, tz * t);
      q.grp.rotation.y = Math.sin(t * Math.PI) * q.side * 0.3;
    }
  };
}

// Buried cache: a riddle stone and a dirt mound; the mound bursts, a chest rises and opens, then both sink away.
function buriedCache(k, g) {
  const { m, mesh, box, cyl, geo, mat } = k,
    dirt = mat(new T.Color(k.p.wood).lerp(new T.Color('#6b5a44'), 0.6).getStyle(), { roughness: 1 }, 'wood'),
    gold = m.metal,
    glyph = mat(k.p.glow, { emissive: k.p.glow, emissiveIntensity: 0.9 });
  const stone = new T.Group();
  g.add(stone);
  mesh(box(1.6, 2.6, 0.45, 0.14), m.stone, 0, 1.3, -0.6, stone);
  mesh(
    geo('qmark', () => new T.TorusGeometry(0.32, 0.07, 6, 16, Math.PI * 1.4)),
    glyph,
    0,
    1.75,
    -0.36,
    stone,
  ).rotation.z = -0.6;
  mesh(box(0.12, 0.3, 0.06, 0.02), glyph, 0.02, 1.25, -0.36, stone);
  mesh(
    geo('qdot', () => new T.SphereGeometry(0.08, 8, 6)),
    glyph,
    0.02,
    0.95,
    -0.36,
    stone,
  );
  for (const s of [-1, 1]) mesh(cyl(0.12, 0.16, 1.4, 6), m.wood, s * 2.95, 0.7, 0, g);
  const rope = k.rod(m.ink, 0.02, g);
  k.stretch(rope, new T.Vector3(-2.9, 1.1, 0), new T.Vector3(2.9, 1.1, 0));
  const mound = new T.Group();
  g.add(mound);
  const clods = [];
  for (let i = 0; i < 14; i++) {
    const a = i * 2.4,
      r = 0.4 + (i % 4) * 0.35,
      c = mesh(rockLump((i % 5) + 1), dirt, Math.cos(a) * r * 1.6, 0.15, Math.sin(a) * r * 0.7 + 0.3, mound);
    c.scale.set(0.45, 0.35, 0.4);
    clods.push({ c, a, r, home: c.position.clone() });
  }
  const chest = new T.Group();
  chest.position.set(0, -1.2, 0.35);
  g.add(chest);
  mesh(box(1.1, 0.6, 0.7, 0.05), m.wood, 0, 0.3, 0, chest);
  for (const x of [-1, 1]) mesh(box(0.08, 0.64, 0.74, 0.02), gold, x * 0.45, 0.3, 0, chest);
  const lid = new T.Group();
  lid.position.set(0, 0.6, -0.35);
  chest.add(lid);
  mesh(box(1.12, 0.18, 0.72, 0.05), m.wood, 0, 0.09, 0.36, lid);
  mesh(box(0.16, 0.2, 0.08, 0.02), gold, 0, 0.02, 0.72, lid);
  const shine = mesh(
    geo('shine', () => new T.OctahedronGeometry(0.18, 0)),
    glyph,
    0,
    0.75,
    0,
    chest,
  );
  return (f, time = 0) => {
    const burst = span(f, 0.05, 0.35);
    clods.forEach(q => {
      q.c.position.set(
        q.home.x + Math.cos(q.a) * burst * 2.2,
        q.home.y + Math.sin(burst * Math.PI) * 1.1 - burst * 0.4,
        q.home.z + Math.sin(q.a) * burst * 0.8,
      );
      q.c.scale.setScalar(0.42 * (1 - smooth(span(burst, 0.7, 1))));
    });
    mound.visible = burst < 1;
    const rise = smooth(span(f, 0.25, 0.5)),
      sink = smooth(span(f, 0.75, 1));
    chest.position.set(sink * 3.25, -1.2 + rise * 1.2, 0.35);
    lid.rotation.x = -smooth(span(f, 0.45, 0.65)) * 1.9;
    shine.visible = f > 0.5 && f < 0.9;
    shine.rotation.y = time * 3;
    chest.visible = true;
    stone.position.x = -sink * 3.5;
    stone.visible = true;
    rope.visible = f < 0.7;
  };
}

// A hedgehog with a little basket, facing +z; returns the figure and its basket group.
function hedgehogFigure(k) {
  const { mesh, geo, mat } = k,
    g = new T.Group(),
    fur = mat('#b08a62'),
    spine = mat('#6a5038'),
    face = mat('#e8d2b0'),
    dark = k.m.ink;
  mesh(
    geo('hbody', () => {
      const q = new T.SphereGeometry(0.45, 14, 10);
      q.scale(1, 0.8, 1.15);
      return q;
    }),
    fur,
    0,
    0.38,
    0,
    g,
  );
  for (let i = 0; i < 26; i++) {
    const a = i * 2.4,
      b = 0.25 + (i % 5) * 0.12,
      sp = mesh(
        geo('hspine', () => new T.ConeGeometry(0.05, 0.24, 4)),
        spine,
        Math.cos(a) * 0.4 * Math.sin(b * 2),
        0.42 + Math.cos(b * 2) * 0.3,
        -0.05 - Math.abs(Math.sin(a)) * 0.35,
        g,
      );
    sp.lookAt(
      sp.position
        .clone()
        .multiplyScalar(3)
        .add(new T.Vector3(0, 0, -1)),
    );
    sp.rotateX(Math.PI / 2);
  }
  const head = mesh(
    geo('hhead', () => {
      const q = new T.SphereGeometry(0.24, 12, 8);
      q.scale(1, 0.9, 1.3);
      return q;
    }),
    face,
    0,
    0.4,
    0.45,
    g,
  );
  mesh(
    geo('hnose', () => new T.SphereGeometry(0.06, 8, 6)),
    dark,
    0,
    0.42,
    0.76,
    g,
  );
  for (const s of [-1, 1])
    mesh(
      geo('heye', () => new T.SphereGeometry(0.04, 6, 4)),
      dark,
      s * 0.11,
      0.5,
      0.62,
      g,
    );
  const basket = new T.Group();
  basket.position.set(0.55, 0, 0.35);
  g.add(basket);
  mesh(
    geo('basket', () => {
      const q = new T.CylinderGeometry(0.3, 0.22, 0.28, 12, 1, true);
      return q;
    }),
    mat('#c09a5a', { side: T.DoubleSide }),
    0,
    0.14,
    0,
    basket,
  );
  mesh(
    geo('bhandle', () => new T.TorusGeometry(0.26, 0.025, 4, 16, Math.PI)),
    spine,
    0,
    0.28,
    0,
    basket,
  );
  return { g, basket };
}

// Hungry hedgehog: it waits by a gated fence with an empty basket; requested items drop in, it hops, the gate opens.
function hungryCreature(k, g) {
  const { m, mesh, box, cyl, geo, mat } = k;
  for (const s of [-1, 1]) {
    mesh(cyl(0.13, 0.17, 1.6, 8), m.wood, s * 2.95, 0.8, 0, g);
    for (const x of [3.3, 3.7]) mesh(box(0.1, 1.0, 0.1, 0.02), m.wood, s * x, 0.5, 0, g);
  }
  const doors = [-1, 1].map(s => {
    const pivot = new T.Group();
    pivot.position.set(s * 2.9, 0, 0);
    g.add(pivot);
    for (let i = 0; i < 5; i++)
      mesh(box(0.1, 1.2 - (i % 2) * 0.15, 0.08, 0.02), m.wood, -s * (0.3 + i * 0.55), 0.65, 0, pivot);
    for (const y of [0.35, 0.95]) mesh(box(2.75, 0.1, 0.06, 0.02), m.wood, -s * 1.42, y, 0.05, pivot);
    return { pivot, s };
  });
  const { g: hog, basket } = hedgehogFigure(k);
  hog.position.set(-0.6, 0, 0.9);
  g.add(hog);
  const colours = ['#d6493a', '#e8b84a', '#7aa850', '#5a8fc4'],
    items = colours.map((c, i) => {
      const it = mesh(
        geo('apple', () => new T.IcosahedronGeometry(0.11, 1)),
        mat(c),
        ((i % 2) - 0.5) * 0.18,
        0.32,
        i > 1 ? 0.08 : -0.08,
        basket,
      );
      it.visible = false;
      return { it, i };
    });
  return (f, time = 0) => {
    items.forEach(q => {
      const t = span(f, 0.05 + q.i * 0.1, 0.15 + q.i * 0.1);
      q.it.visible = t > 0;
      q.it.position.y = 0.32 + (1 - smooth(t)) * 1.4;
    });
    const happy = span(f, 0.45, 0.65);
    hog.position.y = Math.abs(Math.sin(happy * Math.PI * 3)) * 0.25;
    const open = smooth(span(f, 0.55, 0.85));
    doors.forEach(d => (d.pivot.rotation.y = ((d.s * open * Math.PI) / 2) * -1));
    const walk = smooth(span(f, 0.7, 1));
    hog.position.x = -0.6 + walk * 4.0;
    hog.position.z = 0.9 - walk * 0.5;
    hog.rotation.y = (walk * Math.PI) / 2;
  };
}

// Packing station: a packing bench bars the path; items jump into the pack in order, then the bench swings up aside.
function packingStation(k, g) {
  const { m, mesh, box, cyl, geo, mat } = k,
    canvas = mat('#7a9c6a', {}, 'fabric'),
    strap = mat('#5a4030');
  for (const s of [-1, 1]) mesh(cyl(0.13, 0.17, 2.2, 8), m.wood, s * 3.0, 1.1, 0, g);
  const bench = new T.Group();
  bench.position.set(-2.9, 0, 0);
  g.add(bench);
  mesh(box(5.7, 0.12, 1.0, 0.03), m.wood, 2.85, 0.9, 0, bench);
  const legs = [0.4, 2.85, 5.3].map(x => {
    const pivot = new T.Group();
    pivot.position.set(x, 0.84, 0);
    bench.add(pivot);
    mesh(box(0.12, 0.84, 0.8, 0.03), m.wood, 0, -0.42, 0, pivot);
    mesh(cyl(0.04, 0.04, 0.9, 8), m.metal, x, 0.84, 0, bench).rotation.x = Math.PI / 2;
    return pivot;
  });
  mesh(cyl(0.08, 0.08, 1.2, 10), m.metal, -2.9, 0.0, 0, g).rotation.x = Math.PI / 2;
  const note = mesh(box(0.5, 0.65, 0.03, 0.01), mat('#efe2c4', {}, 'paper'), 3.0, 1.8, 0.12, g);
  note.name = 'packing-note';
  const pack = new T.Group();
  pack.position.set(0.4, 0.96, 0);
  g.add(pack);
  mesh(
    geo('pack', () => {
      const q = new T.SphereGeometry(0.5, 12, 10);
      q.scale(0.9, 1.1, 0.7);
      return q;
    }),
    canvas,
    0,
    0.5,
    0,
    pack,
  );
  const flap = mesh(box(0.7, 0.12, 0.5, 0.04), canvas, 0, 0.98, 0.08, pack);
  for (const x of [-0.2, 0.2]) mesh(box(0.07, 0.9, 0.06, 0.02), strap, x, 0.5, 0.36, pack);
  const colours = ['#d6493a', '#e8b84a', '#5a8fc4'],
    items = colours.map((c, i) => {
      const it = mesh(box(0.32, 0.28, 0.28, 0.04), mat(c), -1.7 + i * 0.8, 1.1, 0, g);
      return { it, i, home: it.position.clone() };
    });
  return f => {
    items.forEach(q => {
      const t = span(f, 0.05 + q.i * 0.13, 0.17 + q.i * 0.13),
        e = smooth(t);
      q.it.position.set(
        q.home.x + (pack.position.x - q.home.x) * e,
        q.home.y + Math.sin(t * Math.PI) * 1.0 + (1.4 - q.home.y) * e,
        q.home.z,
      );
      q.it.visible = t < 1;
    });
    flap.rotation.x = f > 0.45 ? -0.0 : 0.6;
    const fly = smooth(span(f, 0.5, 0.75));
    pack.position.set(0.4 + fly * 2.85, 0.96 - fly * 0.96 + Math.sin(fly * Math.PI) * 1.2, fly * 0.6);
    const lift = smooth(span(f, 0.7, 1));
    bench.rotation.z = (lift * Math.PI) / 2;
    legs.forEach(l => (l.rotation.z = (lift * Math.PI) / 2));
  };
}

const BUILDERS = {
  translation: runeBridge,
  sentence: steppingStones,
  intruder: brambleWall,
  'listen-word': bellFlowers,
  numbers: balanceGate,
  ending: fruitTree,
  correct: signposts,
  spelling: mushroomRing,
  'listen-tr': crystalChimes,
  halves: splitLogs,
  'qa-pairs': messageBirds,
  gap: waterWheel,
  repair: sealStone,
  answer: woodlandVisitor,
  sort: supplyCarts,
  definition: wordTotems,
  picture: crateWall,
  clue: buriedCache,
  'listen-multi': hungryCreature,
  instructions: packingStation,
};
export function makeTaskGate(type, { area = 0 } = {}) {
  const k = gateKit(area),
    g = new T.Group();
  g.name = 'task-gate-' + type;
  const animate = BUILDERS[type](k, g),
    blinks = blinkFigures(g),
    hardware = mechanismHardware(k, type);
  g.add(hardware.root);
  g.userData.materials = k.materials;
  let state = null,
    last = 0;
  return {
    group: g,
    hardware,
    setTask(task, { immediate = true } = {}) {
      state = taskMechanismState(task);
      hardware.setState(state, { immediate });
    },
    update(f, time = 0) {
      if (!state) hardware.setState({ fraction: f, complete: f === 1 }, { immediate: true });
      hardware.update(Math.max(0, Math.min(0.1, time - last)), time);
      last = time;
      animate(f, time, state);
      blinks(time);
    },
  };
}

// Task-stage dressing for the same five types. The stage keeps the shared layout (piece positions, sizes and touch
// targets come from mechanismPlan); only the scenery behind the pieces, the pieces' own shapes and the link style change.
export function themeStage(type, plan, area = 0) {
  if (!THEMED_GATES.includes(type)) return null;
  const k = gateKit(area),
    { m, mesh, box, cyl, tube, geo, mat } = k,
    object = new T.Group();
  object.name = 'themed-stage-' + type;
  const H = plan.height,
    entries = plan.entries,
    pieces = entries.filter(e => e.action),
    animated = [],
    targets = [],
    motion = { wheelAngle: 0, lastTime: 0 };
  const driven = (object, point = [0, 0, 0]) => {
    targets.push({ object, point: new T.Vector3(...point) });
    return object;
  };
  const looks = (idle, selectedColor, doneColor) => ({
    idle,
    selected: mat(selectedColor, { emissive: selectedColor, emissiveIntensity: 0.09 }, idle.userData.surface),
    done: mat(doneColor, { emissive: doneColor, emissiveIntensity: 0.06 }, idle.userData.surface),
  });
  let piece,
    link = null;
  if (type === 'translation') {
    for (const s of [-1, 1]) {
      mesh(box(3.0, H - 1.05, 0.6, 0.12), m.stone, s * 1.62, (H - 1.05) / 2, -0.32, object);
      for (let i = 0; i < 3; i++) {
        const l = mesh(rockLump(i + 1), i % 2 ? m.moss : m.stone, s * (1.1 + i * 0.55), 0.15, 0.15, object);
        l.scale.set(0.35, 0.3, 0.3);
      }
    }
    mesh(box(6.3, 0.95, 0.5, 0.1), m.dark, 0, H - 0.7, -0.25, object);
    mesh(box(0.3, H - 1.2, 0.2, 0.03), m.chasm, 0, (H - 1.2) / 2, -0.5, object);
    const hinge = new T.Group();
    hinge.position.set(0, 0.05, 0.38);
    object.add(hinge);
    for (let i = 0; i < 5; i++)
      mesh(
        box(0.5, 2.3, 0.06, 0.015),
        i % 2 ? m.wood : k.mat(new T.Color(k.p.wood).multiplyScalar(0.82).getStyle(), {}, 'wood'),
        (i - 2) * 0.53,
        1.15,
        0,
        hinge,
      );
    for (const y of [0.4, 1.9]) mesh(box(2.7, 0.12, 0.05, 0.02), m.metal, 0, y, 0.04, hinge);
    mesh(
      geo('emblem', () => new T.TorusGeometry(0.32, 0.045, 6, 24)),
      m.metal,
      0,
      1.15,
      0.05,
      hinge,
    );
    for (const s of [-1, 1]) {
      const bar = mesh(box(0.07, 0.42, 0.03, 0.01), m.glow, s * 0.08, 1.15, 0.06, hinge);
      bar.rotation.z = s * 0.35;
    }
    // Bearings, winch lines and counterweights remain attached throughout the lowering.
    mesh(cyl(0.075, 0.075, 2.9, 10), m.metal, 0, 0.05, 0.38, object).rotation.z = Math.PI / 2;
    for (const x of [-1.45, 1.45]) mesh(box(0.15, 0.18, 0.3, 0.025), m.dark, x, 0.09, 0.38, object);
    for (const s of [-1, 1]) {
      const top = new T.Vector3(s * 2.8, 2.65, -0.08),
        pulley = mesh(
          geo('bridge-pulley', () => new T.TorusGeometry(0.15, 0.04, 5, 16)),
          m.metal,
          top.x,
          top.y,
          top.z,
          object,
        ),
        counter = mesh(box(0.28, 0.48, 0.28, 0.03), m.stone, s * 2.8, 2.15, -0.32, object),
        rope = k.rod(m.ink, 0.018, object),
        back = k.rod(m.ink, 0.018, object);
      animated.push(f => {
        const tip = hinge.localToWorld(new T.Vector3(s * 1.1, 2.25, 0));
        object.worldToLocal(tip);
        k.stretch(rope, top, tip);
        counter.position.y = 2.15 - smooth(f) * 1.55;
        k.stretch(back, new T.Vector3(top.x, top.y, -0.32), counter.position);
        pulley.rotation.z = smooth(f) * Math.PI * 2;
      });
    }
    driven(hinge, [1.1, 1.9, 0]);
    animated.unshift(f => {
      hinge.rotation.x = (smooth(f) * Math.PI) / 2;
    });
    const stone = looks(m.stone, k.p.metal, k.p.glow);
    piece = (e, g) => {
      const face = mesh(box(e.w, e.h, 0.2, 0.07), stone.idle, 0, 0, 0, g);
      for (const s of [-1, 1]) {
        const glyph = mesh(box(0.07, e.h * 0.62, 0.05, 0.015), m.glow, s * (e.w / 2 - 0.16), 0, 0.11, g);
        glyph.rotation.z = s * 0.12;
      }
      return { face, looks: stone };
    };
    link = { material: m.glow, radius: 0.06 };
  } else if (type === 'numbers') {
    mesh(cyl(0.16, 0.24, H - 0.2, 8), m.wood, 0, (H - 0.2) / 2, -0.5, object);
    mesh(cyl(0.5, 0.6, 0.25, 8), m.dark, 0, 0.12, -0.5, object);
    const beam = new T.Group();
    beam.position.set(0, H - 0.15, -0.3);
    object.add(beam);
    mesh(box(6.4, 0.2, 0.24, 0.05), m.wood, 0, 0, 0, beam);
    mesh(cyl(0.16, 0.16, 0.36, 10), m.metal, 0, 0, 0, beam).rotation.x = Math.PI / 2;
    for (const s of [-1, 1]) mesh(box(0.24, 0.32, 0.3, 0.04), m.metal, s * 3.1, 0, 0, beam);
    for (const s of [-1, 1]) {
      const r = k.rod(m.ink, 0.015, object);
      k.stretch(r, new T.Vector3(s * 1.53, H - 0.25, -0.2), new T.Vector3(s * 1.53, 1.0, -0.2));
      const pan = mesh(cyl(0.6, 0.45, 0.1, 14), m.metal, s * 1.53, 1.05, -0.1, object);
      pan.name = 'pan';
    }
    const pile = [0, 1, 2].map(i => {
      const w = mesh(cyl(0.16, 0.18, 0.22, 8), m.metal, -1.53 + (i - 1) * 0.36, 1.21, -0.1, object);
      w.visible = false;
      return w;
    });
    driven(beam, [1.53, 0, 0]);
    animated.push((f, time, values) => {
      beam.rotation.z = (1 - smooth(f)) * 0.11;
      pile.forEach((w, i) => {
        w.visible = values[i] > 0.001;
        w.position.y = 1.21 + (1 - values[i]) * 0.4;
      });
    });
    const brass = looks(m.metal, '#f1cf78', k.p.glow),
      wood = looks(m.wood, '#e6c27a', k.p.glow);
    piece = (e, g) => {
      const left = e.action === 'pair-left',
        face = mesh(box(e.w, e.h, left ? 0.24 : 0.12, left ? 0.09 : 0.04), left ? brass.idle : wood.idle, 0, 0, 0, g);
      const ring = mesh(
        geo('hook', () => new T.TorusGeometry(0.1, 0.025, 5, 12)),
        m.metal,
        0,
        e.h / 2 + 0.1,
        -0.02,
        g,
      );
      ring.castShadow = false;
      return { face, looks: left ? brass : wood };
    };
    link = { material: m.metal, radius: 0.035 };
  } else if (type === 'sentence') {
    const hydraulic = makeAqueductChannel({ area, compact: true });
    hydraulic.root.position.set(0, 0.07, -0.5);
    object.add(hydraulic.root);
    k.materials.push(...hydraulic.materials);
    object.userData.hydraulic = hydraulic.state;
    animated.push((f, time) =>
      hydraulic.update(f, time, {
        reduced: typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
      }),
    );
    const water = liquidMaterial(k.p.water, { local: true, halfWidth: 3.2, halfLength: 1.1 });
    k.materials.push(water);
    const stream = mesh(new T.BoxGeometry(6.4, 0.04, 2.2), water, 0, 0, 1.55, object);
    stream.castShadow = false;
    stream.receiveShadow = false;
    for (let i = 0; i < 9; i++) {
      const l = mesh(rockLump((i % 5) + 1), i % 3 ? m.stone : m.moss, -3 + i * 0.75, 0.2, 0.3 + (i % 2) * 0.15, object);
      l.scale.set(0.42, 0.36, 0.34);
    }
    for (const s of [-1, 1]) {
      mesh(cyl(0.26, 0.4, H - 0.4, 7), m.stone, s * 3.05, (H - 0.4) / 2, -0.3, object);
      mesh(box(0.7, 0.25, 0.7, 0.06), m.moss, s * 3.05, H - 0.3, -0.3, object);
    }
    mesh(box(6.4, 0.5, 0.4, 0.1), m.dark, 0, H - 0.65, -0.4, object);
    const tones = [
        m.stone,
        mat(new T.Color(k.p.stone).multiplyScalar(0.9).getStyle(), {}, 'stone'),
        mat(new T.Color(k.p.stone).lerp(new T.Color(k.p.moss), 0.25).getStyle(), {}, 'stone'),
      ],
      picked = looks(m.stone, '#e9c983', k.p.glow);
    // Accepted fragments already form the crossing; visible runners and piston sleeves explain their support.
    for (let i = 0; i < pieces.length; i++) {
      const row = Math.floor(i / 3),
        socket = driven(
          mesh(box(0.92, 0.06, 0.64, 0.025), m.dark, -0.8 + (i % 3) * 0.8, 0.14 + row * 0.12, 1.2 + row * 0.65, object),
        );
      for (const x of [-0.25, 0.25])
        mesh(
          cyl(0.07, 0.09, 0.16 + row * 0.12, 8),
          m.metal,
          socket.position.x + x,
          0.07 + row * 0.06,
          socket.position.z,
          object,
        );
    }
    piece = (e, g) => {
      const tone = tones[(e.index || 0) % 3],
        l = { ...picked, idle: tone },
        face = mesh(box(e.w, e.h, 0.36, 0.16), tone, 0, 0, 0, g);
      return { face, looks: l };
    };
  } else if (type === 'intruder') {
    const vines = [];
    for (const s of [-1, 1]) {
      tube(
        [
          [s * 3.0, 0, -0.3],
          [s * 3.15, H * 0.35, -0.25],
          [s * 2.9, H * 0.7, -0.35],
          [s * 3.05, H - 0.3, -0.3],
        ],
        0.2,
        m.bramble,
        object,
        14,
      );
    }
    const rows = [...new Set(pieces.map(e => e.y))];
    rows.forEach((y, i) => {
      const top = y + 0.62,
        v = new T.Group();
      object.add(v);
      tube(
        [
          [-3.0, top, -0.2],
          [-1.6, top + 0.18, -0.1],
          [0, top - 0.12, -0.18],
          [1.6, top + 0.16, -0.1],
          [3.0, top, -0.2],
        ],
        0.11,
        m.bramble,
        v,
        24,
      );
      tube(
        [
          [-3.0, top - 0.3, -0.25],
          [-1.5, top + 0.05, -0.05],
          [0, top + 0.12, -0.25],
          [1.5, top - 0.04, -0.05],
          [3.0, top - 0.25, -0.25],
        ],
        0.07,
        m.bramble,
        v,
        24,
      );
      for (let j = 0; j < 7; j++) {
        const leaf = mesh(
          geo('vleaf', () => {
            const l = new T.SphereGeometry(0.2, 7, 4);
            l.scale(1, 0.12, 0.5);
            return l;
          }),
          m.leaf,
          -2.7 + j * 0.9,
          top + (j % 2 ? 0.12 : -0.1),
          -0.02,
          v,
        );
        leaf.rotation.set(0.4, j * 1.3, j % 2 ? 0.5 : -0.5);
        if (j % 3 === 1) {
          const b = mesh(
            geo('bloom', () => new T.IcosahedronGeometry(0.1, 0)),
            m.bell,
            -2.7 + j * 0.9 + 0.12,
            top + 0.2,
            0.04,
            v,
          );
          b.scale.y = 0.7;
        }
      }
      for (let j = 0; j < 12; j++) {
        const th = mesh(
          geo('thorn', () => new T.ConeGeometry(0.045, 0.18, 4)),
          m.thorn,
          -2.8 + j * 0.5,
          top + (j % 2 ? 0.08 : -0.08),
          -0.12,
          v,
        );
        th.rotation.z = j % 2 ? 0.7 : -0.7;
      }
      vines.push(v);
    });
    const tag = looks(m.wood, '#e7c37a', k.p.glow);
    piece = (e, g) => {
      const face = mesh(box(e.w * 0.94, e.h * 0.9, 0.12, 0.05), tag.idle, 0, 0, 0, g);
      for (const s of [-1, 1]) {
        tube(
          [
            [s * (e.w / 2 + 0.08), -e.h * 0.15, -0.05],
            [s * (e.w / 2 - 0.02), e.h * 0.38, 0.1],
            [s * (e.w / 2 - 0.3), e.h / 2 + 0.02, 0.12],
            [s * (e.w / 2 - 0.62), e.h / 2 + 0.2, -0.04],
          ],
          0.05,
          m.bramble,
          g,
          10,
        );
        for (let j = 0; j < 2; j++) {
          const th = mesh(
            geo('thorn', () => new T.ConeGeometry(0.045, 0.18, 4)),
            m.thorn,
            s * (e.w / 2 - 0.1 - j * 0.25),
            e.h / 2 + 0.06 + j * 0.06,
            0.12,
            g,
          );
          th.rotation.z = s * (j ? 0.4 : 1.2);
        }
      }
      return { face, looks: tag };
    };
    vines.forEach(v => driven(v));
    animated.push((f, time, values) => {
      const dry = smooth(f);
      m.bramble.color.set(k.p.bramble).lerp(new T.Color(k.p.thorn), dry * 0.6);
      vines.forEach((v, i) => {
        v.position.x = -values[Math.min(i, 2)] * 2.7;
      });
    });
  } else if (type === 'ending') {
    // A fruit tree: trunk at the side, branches over the plaques, one fruit per answer that ripens as the task goes on.
    const bark = mat(new T.Color(k.p.wood).multiplyScalar(0.7).getStyle(), {}, 'wood'),
      fruit = mat('#8fb860', { emissive: '#f0a050', emissiveIntensity: 0 }),
      clump = geo('clump', () => {
        const c = new T.IcosahedronGeometry(0.6, 1);
        c.scale(1, 0.7, 1);
        return c;
      });
    tube(
      [
        [-3.05, 0, -0.45],
        [-2.95, H * 0.45, -0.4],
        [-3.1, H * 0.8, -0.45],
        [-2.6, H + 0.1, -0.5],
      ],
      0.3,
      bark,
      object,
      14,
    );
    tube(
      [
        [-2.9, H - 0.2, -0.45],
        [-1, H + 0.15, -0.4],
        [1.2, H, -0.45],
        [3.0, H - 0.25, -0.5],
      ],
      0.14,
      bark,
      object,
      16,
    );
    for (let i = 0; i < 7; i++) {
      const c = mesh(clump, m.leaf, -3 + i * 1.0, H - 0.15 + (i % 2) * 0.25, -0.75, object);
      c.scale.setScalar(1.15);
    }
    for (let i = 0; i < 4; i++) {
      const c = mesh(clump, m.leaf, -3.15 + (i % 2) * 0.35, H * 0.45 + i * 0.5, -0.6, object);
      c.scale.setScalar(0.9);
    }
    for (let i = 0; i < 3; i++) {
      const r = mesh(rockLump(i + 1), bark, -3.05 + Math.cos(i * 2) * 0.4, 0.1, -0.45 + Math.sin(i * 2) * 0.3, object);
      r.scale.set(0.3, 0.2, 0.3);
    }
    const fruits = [],
      plaque = looks(mat(new T.Color(k.p.petal).lerp(new T.Color(k.p.leaf), 0.18).getStyle()), '#f3d58c', k.p.glow);
    const basket = driven(new T.Group());
    basket.position.set(-1.7, 0.12, 1.0);
    object.add(basket);
    mesh(cyl(0.38, 0.28, 0.3, 10), m.wood, 0, 0.15, 0, basket);
    for (let i = 0; i < 3; i++) {
      const fruitBit = mesh(
        geo('caught-fruit', () => new T.IcosahedronGeometry(0.12, 1)),
        fruit,
        (i - 1) * 0.18,
        0.32,
        0,
        basket,
      );
      animated.push((f, time, values) => {
        fruitBit.visible = values[i] > 0.01;
        fruitBit.position.y = 0.32 + (1 - values[i]) * 0.5;
      });
    }
    piece = (e, g) => {
      const face = mesh(box(e.w, e.h, 0.14, Math.min(0.25, e.h * 0.4)), plaque.idle, 0, 0, 0, g);
      const f = mesh(
        geo('fruit', () => new T.IcosahedronGeometry(0.2, 1)),
        fruit,
        e.w / 2 - 0.22,
        e.h / 2 + 0.05,
        0.12,
        g,
      );
      fruits.push(f);
      mesh(
        geo('fleaf', () => {
          const q = new T.SphereGeometry(0.16, 7, 4);
          q.scale(1, 0.25, 0.5);
          return q;
        }),
        m.leaf,
        e.w / 2 - 0.02,
        e.h / 2 + 0.2,
        0.08,
        g,
      ).rotation.z = -0.6;
      return { face, looks: plaque };
    };
    animated.push((f, time) => {
      fruit.color.set('#8fb860').lerp(new T.Color('#f2994a'), smooth(f));
      fruit.emissiveIntensity = 0.3 * smooth(f);
      fruits.forEach((q, i) => {
        q.rotation.z = Math.sin(time * 1.4 + i) * 0.12;
      });
    });
  } else if (type === 'correct') {
    // Signposts in fog: a tall post carries the arrow signs; the fog thins as the right sentences are chosen.
    mesh(cyl(0.17, 0.24, H + 0.1, 8), m.wood, 0, (H + 0.1) / 2, -0.5, object);
    mesh(cyl(0.3, 0.22, 0.18, 8), m.dark, 0, H + 0.12, -0.5, object);
    mesh(cyl(0.5, 0.62, 0.24, 8), m.dark, 0, 0.12, -0.5, object);
    const fog = mat('#f4f1e8', { transparent: true, opacity: 0.55, depthWrite: false, roughness: 1 }),
      puffs = [];
    for (let i = 0; i < 8; i++) {
      const p = mesh(
        geo('puff', () => {
          const q = new T.SphereGeometry(0.9, 10, 6);
          q.scale(1, 0.4, 0.7);
          return q;
        }),
        fog,
        -3 + i * 0.86,
        0.32 + (i % 2) * 0.1,
        0.6 + (i % 3) * 0.25,
        object,
      );
      p.castShadow = false;
      puffs.push(p);
    }
    const sign = looks(m.wood, '#e7c37a', k.p.glow);
    piece = (e, g) => {
      const s = e.x < 0 ? -1 : 1,
        face = mesh(box(e.w, e.h, 0.12, 0.04), sign.idle, 0, 0, 0, g),
        tip = mesh(
          geo('signtip', () => {
            const c = new T.ConeGeometry(0.5, 0.36, 4);
            c.rotateZ(-Math.PI / 2);
            c.rotateX(Math.PI / 4);
            c.scale(1, 1, 0.25);
            return c;
          }),
          sign.idle,
          s * (e.w / 2 + 0.17),
          0,
          0,
          g,
        );
      tip.scale.set(s, e.h / 1.0, 1);
      return { face, looks: sign, tints: [tip] };
    };
    const signDrive = driven(mesh(box(0.4, 0.16, 0.22, 0.025), m.metal, 0, 0.8, -0.5, object));
    animated.push(f => {
      signDrive.rotation.y = (f * Math.PI) / 2;
      fog.opacity = 0.55 * (1 - smooth(f));
    });
  } else if (type === 'spelling') {
    // Corrupted mushrooms: tall caps at the sides and a cap above each word; they heal as faulty words are found.
    const sick = mat('#8a5aa8', { emissive: '#a070d0', emissiveIntensity: 0.45 }),
      stem = mat('#d9cdb8'),
      spotM = mat('#efe6f6', { emissive: '#d8c8f0', emissiveIntensity: 0.3 }),
      cap = geo('cap', () => {
        const c = new T.SphereGeometry(0.5, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        c.scale(1, 0.62, 1);
        return c;
      });
    for (const s of [-1, 1])
      for (let i = 0; i < 2; i++) {
        const h = H * (0.55 - i * 0.18),
          x = s * (3.0 - i * 0.15),
          z = -0.4 + i * 0.5;
        mesh(cyl(0.14, 0.2, h, 8), stem, x, h / 2, z, object);
        const c = mesh(cap, sick, x, h, z, object);
        c.scale.setScalar(1.6 - i * 0.4);
      }
    const spores = [];
    for (let i = 0; i < 12; i++) {
      const sp = mesh(
        geo('spore', () => new T.OctahedronGeometry(0.045, 0)),
        spotM,
        -2.8 + ((i * 7) % 12) * 0.5,
        1,
        -0.2 + (i % 3) * 0.2,
        object,
      );
      sp.castShadow = false;
      spores.push(sp);
    }
    const tag = looks(mat('#efe4d0', {}, 'paper'), '#f3d58c', k.p.glow);
    piece = (e, g) => {
      const face = mesh(box(e.w, e.h, 0.14, 0.06), tag.idle, 0, 0, 0, g);
      mesh(cyl(0.07, 0.09, 0.28, 7), stem, -e.w / 2 + 0.3, e.h / 2 + 0.1, 0.02, g);
      const c = mesh(cap, sick, -e.w / 2 + 0.3, e.h / 2 + 0.22, 0.02, g);
      c.scale.setScalar(0.75);
      return { face, looks: tag };
    };
    const healthy = new T.Color('#c45a3c'),
      purple = new T.Color('#8a5aa8');
    const filter = driven(mesh(cyl(0.15, 0.2, 0.45, 10), m.metal, 1.5, 0.3, 0.8, object));
    mesh(cyl(0.18, 0.18, 0.06, 10), m.dark, 1.5, 0.55, 0.8, object);
    animated.push(f => (filter.position.y = 0.3 - f * 0.15));
    animated.push((f, time) => {
      sick.color.copy(purple).lerp(healthy, smooth(f));
      sick.emissiveIntensity = 0.45 * (1 - smooth(f)) + 0.05 * Math.sin(time * 2.2);
      spores.forEach((sp, i) => {
        sp.visible = f < 0.95;
        sp.position.y = 0.6 + ((time * 0.22 + i * 0.11) % 1) * (H - 1);
      });
    });
  } else if (type === 'listen-tr') {
    // Crystal chimes on a beam: spoken words hang as crystals, Turkish meanings as wooden tags, joined by light threads.
    mesh(box(6.4, 0.22, 0.26, 0.05), m.wood, 0, H - 0.12, -0.25, object);
    for (const s of [-1, 1]) {
      mesh(cyl(0.18, 0.26, H, 6), m.stone, s * 3.05, H / 2, -0.3, object);
    }
    for (let i = 0; i < 3; i++) {
      const tuner = driven(mesh(cyl(0.1, 0.1, 0.24, 8), m.metal, -0.8 + i * 0.8, 0.35, 0.5, object));
      tuner.rotation.z = Math.PI / 2;
      animated.push((f, time, values) => (tuner.rotation.x = values[i] * Math.PI));
    }
    for (const e of pieces) {
      const r = k.rod(m.ink, 0.01, object);
      k.stretch(r, new T.Vector3(e.x, H - 0.2, -0.2), new T.Vector3(e.x, e.y + e.h / 2, -0.05));
    }
    const glass = looks(mat(k.p.glow, { emissive: k.p.glow, emissiveIntensity: 0.18 }, 'glass'), '#f3e2a0', '#c9f7dc'),
      tag = looks(m.wood, '#e7c37a', k.p.glow);
    piece = (e, g) => {
      const left = e.action === 'pair-left',
        face = mesh(box(e.w, e.h, left ? 0.3 : 0.12, left ? 0.16 : 0.04), left ? glass.idle : tag.idle, 0, 0, 0, g);
      if (left)
        for (const s of [-1, 1]) {
          const c = mesh(
            geo('pcrystal', () => {
              const q = new T.OctahedronGeometry(0.18, 0);
              q.scale(0.7, 1.8, 0.7);
              return q;
            }),
            glass.idle,
            s * (e.w / 2 + 0.05),
            -0.05,
            0,
            g,
          );
          c.rotation.z = s * 0.2;
        }
      return { face, looks: left ? glass : tag };
    };
    link = { material: m.glow, radius: 0.035 };
    animated.push((f, time) => {
      glass.idle.emissiveIntensity = 0.3 + 0.12 * Math.sin(time * 2.4);
    });
  } else if (type === 'halves') {
    // Split logs over a murky stream: each sentence half is a log end; matched halves are pinned together.
    const water = liquidMaterial(new T.Color(k.p.water).lerp(new T.Color(k.p.moss), 0.45).getStyle(), {
      local: true,
      halfWidth: 3.2,
      halfLength: 1.1,
    });
    k.materials.push(water);
    const stream = mesh(new T.BoxGeometry(6.4, 0.04, 2.2), water, 0, 0, 1.55, object);
    stream.castShadow = false;
    for (let i = 0; i < 9; i++) {
      const l = mesh(rockLump((i % 5) + 1), i % 3 ? m.stone : m.moss, -3 + i * 0.75, 0.2, 0.3 + (i % 2) * 0.15, object);
      l.scale.set(0.42, 0.36, 0.34);
    }
    const bark = looks(mat(new T.Color(k.p.wood).multiplyScalar(0.85).getStyle(), {}, 'wood'), '#e2b86e', k.p.glow),
      ring = mat(new T.Color(k.p.wood).lerp(new T.Color('#f0d9a8'), 0.55).getStyle(), {}, 'wood'),
      rings = mat(new T.Color(k.p.wood).multiplyScalar(0.6).getStyle(), {}, 'wood');
    piece = (e, g) => {
      const left = e.action === 'pair-left',
        s = left ? 1 : -1,
        face = mesh(box(e.w, e.h, 0.4, 0.18), bark.idle, 0, 0, 0, g);
      const cap = mesh(
        geo('endgrain', () => {
          const c = new T.CylinderGeometry(0.5, 0.5, 0.06, 16);
          c.rotateZ(Math.PI / 2);
          return c;
        }),
        ring,
        s * (e.w / 2 + 0.02),
        0,
        0,
        g,
      );
      cap.scale.set(1, e.h * 0.88, (0.42 / 0.5) * 0.9);
      for (const r of [0.3, 0.18]) {
        const t = mesh(
          geo('grain' + r, () => {
            const q = new T.TorusGeometry(r, 0.012, 4, 20);
            q.rotateY(Math.PI / 2);
            return q;
          }),
          rings,
          s * (e.w / 2 + 0.06),
          0,
          0,
          g,
        );
        t.scale.set(1, (e.h * 0.88) / 1, 0.8);
      }
      return { face, looks: bark };
    };
    link = { material: mat(new T.Color(k.p.wood).multiplyScalar(0.6).getStyle(), {}, 'wood'), radius: 0.07 };
    // Three independent log couplers; out-of-order pairs seat their own crossing, not the next one in a list.
    for (let i = 0; i < 3; i++) {
      const pivot = driven(new T.Group());
      pivot.position.set((i - 1) * 0.82, 0.08, 0.55);
      object.add(pivot);
      mesh(box(0.65, 0.09, 1.7, 0.04), m.wood, 0, 0, 0.85, pivot);
      mesh(cyl(0.06, 0.06, 0.8, 8), m.metal, pivot.position.x, 0.08, 0.55, object).rotation.z = Math.PI / 2;
      const pin = mesh(cyl(0.07, 0.07, 0.2, 8), m.metal, 0, 0.1, 1.6, pivot);
      animated.push((f, time, values) => {
        pivot.rotation.x = -(1 - values[i]) * 0.95;
        pin.position.y = 0.1 + (1 - values[i]) * 0.25;
      });
    }
  } else if (type === 'qa-pairs') {
    // Message birds: questions and answers are scrolls hanging from a branch where birds perch; each match sends a bird off.
    const bark = mat(new T.Color(k.p.wood).multiplyScalar(0.75).getStyle(), {}, 'wood');
    tube(
      [
        [-3.1, H - 0.5, -0.35],
        [-1.5, H - 0.2, -0.3],
        [0, H - 0.35, -0.35],
        [1.5, H - 0.15, -0.3],
        [3.1, H - 0.45, -0.35],
      ],
      0.11,
      bark,
      object,
      18,
    );
    for (const s of [-1, 1]) mesh(cyl(0.13, 0.18, H - 0.4, 8), m.wood, s * 3.05, (H - 0.4) / 2, -0.35, object);
    for (const e of pieces) {
      const r = k.rod(m.ink, 0.01, object);
      k.stretch(
        r,
        new T.Vector3(e.x + (e.x < 0 ? -0.6 : 0.6), H - 0.3, -0.3),
        new T.Vector3(e.x + (e.x < 0 ? -0.6 : 0.6), e.y + e.h / 2, -0.05),
      );
    }
    const colours = ['#5f86b8', '#c8783a', '#7a9c4c', '#b85f6a', '#d6b04a', '#8a6ab0'],
      perchY = pieces.length ? Math.min(...pieces.map(e => e.y - e.h / 2)) - 0.55 : 1.6;
    tube(
      [
        [-3.1, perchY - 0.15, 0.05],
        [-1.5, perchY + 0.05, 0.1],
        [0, perchY - 0.05, 0.05],
        [1.5, perchY + 0.06, 0.1],
        [3.1, perchY - 0.12, 0.05],
      ],
      0.07,
      bark,
      object,
      18,
    );
    const birds = colours.map((c, i) => {
      const b = bird(k, c);
      b.position.set(-2.5 + i * 1.0, perchY + 0.04 + Math.sin(i * 1.3) * 0.04, 0.08);
      b.scale.setScalar(0.95);
      object.add(b);
      return { b, i };
    });
    const scroll = looks(mat('#efe2c4', {}, 'paper'), '#f3d58c', k.p.glow);
    piece = (e, g) => {
      const face = mesh(box(e.w, e.h * 0.86, 0.06, 0.02), scroll.idle, 0, 0, 0, g);
      for (const y of [-1, 1])
        mesh(
          geo('roll', () => {
            const q = new T.CylinderGeometry(0.075, 0.075, 1, 10);
            q.rotateZ(Math.PI / 2);
            return q;
          }),
          scroll.idle,
          0,
          y * e.h * 0.45,
          0.02,
          g,
        ).scale.set(e.w * 1.04, 1, 1);
      return { face, looks: scroll };
    };
    link = { material: mat('#b84a4a'), radius: 0.025 };
    for (let i = 0; i < 3; i++) {
      const catchArm = driven(new T.Group());
      catchArm.position.set(-1.5 + i * 1.5, perchY - 0.12, 0.05);
      object.add(catchArm);
      mesh(box(0.36, 0.045, 0.06, 0.012), m.metal, 0.18, 0, 0, catchArm);
      mesh(cyl(0.045, 0.045, 0.14, 8), m.metal, catchArm.position.x, perchY - 0.12, 0.05, object).rotation.x =
        Math.PI / 2;
      animated.push((f, time, values) => (catchArm.rotation.z = (-values[i] * Math.PI) / 2));
    }
    animated.push((f, time, values) => {
      birds.forEach(q => {
        const fly = values[Math.floor(q.i / 2)];
        q.b.position.y = perchY + 0.04 + fly * 1.0;
        q.b.position.z = 0.08 - fly * 0.7;
        q.b.visible = fly < 1;
        q.b.userData.flap(time * (fly > 0 ? 14 : 3) + q.i, fly > 0 ? 0.7 : 0.08);
        q.b.rotation.y = Math.sin(time * 0.7 + q.i) * 0.4;
      });
    });
  } else if (type === 'gap') {
    // Water wheel: a wheel turns beside a sluice; answers are paddles, and the wheel speeds up as the channel fills.
    const water = liquidMaterial(k.p.water, { local: true, halfWidth: 3.2, halfLength: 1.1 });
    k.materials.push(water);
    const stream = mesh(new T.BoxGeometry(6.4, 0.04, 2.2), water, 0, 0, 1.55, object);
    stream.castShadow = false;
    for (const s of [-1, 1]) mesh(box(0.42, H, 0.5, 0.06), m.stone, s * 3.05, H / 2, -0.4, object);
    mesh(box(6.5, 0.3, 0.5, 0.06), m.dark, 0, H - 0.15, -0.4, object);
    const gate = new T.Group();
    object.add(gate);
    for (let i = 0; i < 9; i++) mesh(box(0.1, 1.4, 0.1, 0.02), m.dark, -2.4 + i * 0.6, 0.7, -0.6, gate);
    mesh(box(5.0, 0.12, 0.08, 0.02), m.dark, 0, 1.2, -0.55, gate);
    const wheel = new T.Group();
    wheel.name = 'water-drive-wheel';
    wheel.position.set(-3.55, 1.4, 0.3);
    object.add(wheel);
    mesh(
      geo('rim', () => {
        const q = new T.TorusGeometry(1.15, 0.07, 6, 28);
        q.rotateY(Math.PI / 2);
        return q;
      }),
      m.wood,
      0,
      0,
      0,
      wheel,
    );
    for (let i = 0; i < 6; i++) {
      const sp = mesh(box(0.08, 2.25, 0.08, 0.02), m.wood, 0, 0, 0, wheel);
      sp.rotation.x = (i * Math.PI) / 6;
    }
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4,
        p = mesh(box(0.45, 0.06, 0.38, 0.015), m.wood, 0, Math.cos(a) * 1.18, Math.sin(a) * 1.18, wheel);
      p.rotation.x = -a;
    }
    const paddle = looks(
      mat(new T.Color(k.p.wood).lerp(new T.Color('#e8cf9a'), 0.35).getStyle(), {}, 'wood'),
      '#f0cf7a',
      k.p.glow,
    );
    piece = (e, g) => {
      const face = mesh(box(e.w, e.h, 0.14, 0.04), paddle.idle, 0, 0, 0, g);
      for (const s of [-1, 1]) mesh(box(0.08, e.h + 0.04, 0.16, 0.02), m.metal, s * (e.w / 2 - 0.22), 0, 0.02, g);
      return { face, looks: paddle };
    };
    driven(gate, [2.4, 1.2, -0.55]);
    // A fitted channel feeds the paddles; a shaft, drum and guided rack transmit rotation to the drop gate.
    mesh(cyl(0.11, 0.11, 0.68, 10), m.metal, -3.55, 1.4, 0.3, object).rotation.z = Math.PI / 2;
    for (const x of [-3.83, -3.24]) mesh(box(0.14, 1.45, 0.36, 0.025), m.stone, x, 0.72, 0.3, object);
    const flow = mesh(new T.BoxGeometry(0.28, 0.85, 0.09), water, -3.55, 1.8, -0.3, object);
    flow.name = 'wheel-feed-flow';
    flow.castShadow = false;
    mesh(box(0.55, 0.08, 1.0, 0.02), m.wood, -3.55, 2.25, -0.7, object);
    for (const s of [-1, 1]) mesh(box(0.08, 0.2, 1.0, 0.015), m.wood, -3.55 + s * 0.25, 2.32, -0.7, object);
    for (const x of [-2.6, 2.6]) mesh(box(0.12, 1.55, 0.18, 0.02), m.metal, x, 0.7, -0.6, object);
    mesh(box(5.4, 0.04, 0.25, 0.012), m.dark, 0, 0.025, -0.6, object);
    animated.push((f, time) => {
      motion.wheelAngle += Math.max(0, Math.min(0.1, time - motion.lastTime)) * f * 1.8;
      motion.lastTime = time;
      wheel.rotation.x = motion.wheelAngle;
      gate.position.y = -f * 1.3;
      flow.visible = f > 0.001;
      flow.scale.x = Math.max(0.001, f);
    });
  } else if (type === 'repair') {
    // Seal stone: a great round seal stands behind the words; its crack glows until the broken word is replaced.
    const crack = mat(k.p.glow, { emissive: k.p.glow, emissiveIntensity: 1 });
    for (const s of [-1, 1]) mesh(cyl(0.3, 0.4, H, 8), m.stone, s * 3.1, H / 2, -0.5, object);
    const R = Math.min(3.0, H * 0.47),
      seal = new T.Group();
    seal.position.set(0, H * 0.5, -0.55);
    object.add(seal);
    mesh(
      geo('seal' + R, () => {
        const q = new T.CylinderGeometry(R, R, 0.4, 40);
        q.rotateX(Math.PI / 2);
        return q;
      }),
      m.stone,
      0,
      0,
      0,
      seal,
    );
    mesh(
      geo('sealrim' + R, () => new T.TorusGeometry(R - 0.08, 0.09, 6, 48)),
      m.dark,
      0,
      0,
      0.21,
      seal,
    );
    const lines = [
      [-0.3, 0.9],
      [0.2, 0.45],
      [-0.15, 0],
      [0.25, -0.45],
      [-0.1, -0.95],
    ];
    for (let i = 1; i < lines.length; i++) {
      const a = lines[i - 1],
        b = lines[i],
        len = Math.hypot(b[0] - a[0], b[1] - a[1]) * R,
        c = mesh(box(0.07, len, 0.02, 0.008), crack, ((a[0] + b[0]) / 2) * R, ((a[1] + b[1]) / 2) * R, 0.22, seal);
      c.rotation.z = Math.atan2(-(b[0] - a[0]), b[1] - a[1]);
    }
    const tile = looks(mat(new T.Color(k.p.stone).multiplyScalar(1.08).getStyle(), {}, 'stone'), '#f0cf7a', k.p.glow);
    piece = (e, g) => {
      const face = mesh(box(e.w, e.h, 0.16, 0.05), tile.idle, 0, 0, 0, g);
      mesh(box(e.w + 0.08, e.h + 0.08, 0.08, 0.02), m.dark, 0, 0, -0.06, g);
      return { face, looks: tile };
    };
    driven(seal, [R * 0.6, 0, 0.23]);
    for (let i = 0; i < 3; i++) {
      const socket = mesh(box(0.3, 0.22, 0.08, 0.02), m.dark, -0.55 + i * 0.55, 0.35, 0.8, object),
        key = mesh(box(0.22, 0.16, 0.07, 0.015), m.metal, socket.position.x, 0.35, 1.05, object);
      animated.push((f, time, values) => {
        key.position.z = 1.05 - values[i] * 0.23;
      });
    }
    animated.push((f, time) => {
      crack.emissiveIntensity = (1 - f) * (0.8 + 0.3 * Math.sin(time * 3));
      seal.rotation.z = f * 0.25;
    });
  } else if (type === 'answer') {
    // Woodland visitor: an owl waits beside the question; replies are leaf-cut plaques and it nods at each right answer.
    const { owl, head } = owlFigure(k);
    object.add(owl);
    owl.position.set(-3.2, 0, 0.25);
    owl.scale.setScalar(0.9);
    owl.rotation.y = 0.5;
    const perchLatch = driven(new T.Group());
    perchLatch.position.set(-1.8, 0.5, 0.6);
    object.add(perchLatch);
    mesh(box(0.7, 0.1, 0.12, 0.02), m.wood, 0.35, 0, 0, perchLatch);
    mesh(cyl(0.065, 0.065, 0.2, 8), m.metal, -1.8, 0.5, 0.6, object);
    animated.push(f => (perchLatch.rotation.y = (-f * Math.PI) / 2));
    const plaque = looks(mat(new T.Color(k.p.petal).lerp(new T.Color(k.p.leaf), 0.15).getStyle()), '#f3d58c', k.p.glow);
    piece = (e, g) => {
      const face = mesh(box(e.w, e.h, 0.12, Math.min(0.25, e.h * 0.4)), plaque.idle, 0, 0, 0, g);
      for (const s of [-1, 1]) {
        const l = mesh(
          geo('pleaf', () => {
            const q = new T.SphereGeometry(0.3, 8, 4);
            q.scale(1, 0.42, 0.12);
            return q;
          }),
          m.leaf,
          s * (e.w / 2 - 0.05),
          -e.h / 2 + 0.02,
          0.06,
          g,
        );
        l.rotation.z = s * -0.5;
      }
      return { face, looks: plaque };
    };
    // The owl dips its head toward each new right answer and then looks around again.
    let seen = 0,
      nod = 0;
    animated.push((f, time) => {
      if (f > seen + 0.01) {
        seen = f;
        nod = 1;
      }
      nod = Math.max(0, nod - 0.03);
      head.rotation.x = Math.sin(time * 0.9) * 0.05 + Math.sin(nod * Math.PI) * 0.35;
      head.rotation.y = Math.sin(time * 0.45) * 0.2 * (1 - nod);
    });
  } else if (type === 'sort') {
    // Supply carts: the word to sort sits on top; each category is a cart, filling with crates as words are sorted.
    const carts = pieces
      .filter(e => e.action)
      .map(e => {
        const c = new T.Group();
        c.position.set(e.x, 0, 0.35);
        object.add(c);
        mesh(box(2.2, 0.12, 1.05, 0.03), m.wood, 0, 0.62, 0, c);
        for (const z of [-0.5, 0.5]) mesh(box(2.2, 0.42, 0.07, 0.02), m.wood, 0, 0.86, z, c);
        for (const x of [-1, 1]) mesh(box(0.07, 0.42, 1.05, 0.02), m.wood, x * 1.08, 0.86, 0, c);
        for (const x of [-0.65, 0.65])
          mesh(
            geo('cwheel', () => {
              const q = new T.CylinderGeometry(0.42, 0.42, 0.08, 14);
              q.rotateX(Math.PI / 2);
              return q;
            }),
            m.dark,
            x,
            0.42,
            0.58,
            c,
          );
        mesh(box(0.08, e.y - e.h / 2 - 1.0, 0.08, 0.02), m.wood, 0, (e.y - e.h / 2 + 1.0) / 2, -0.4, c);
        return c;
      });
    const crates = [];
    carts.forEach((c, ci) => {
      for (let i = 0; i < 3; i++) {
        const it = mesh(
          i === 1
            ? geo('sack', () => {
                const q = new T.SphereGeometry(0.26, 10, 8);
                q.scale(1, 0.8, 1);
                return q;
              })
            : box(0.38, 0.34, 0.38, 0.04),
          i === 1 ? mat('#c9b48a') : m.wood,
          (i - 1) * 0.6,
          0.9,
          0,
          c,
        );
        it.visible = false;
        crates.push({ it, n: ci * 3 + i });
      }
    });
    const sign = looks(mat('#efe2c4', {}, 'paper'), '#f3d58c', k.p.glow);
    piece = (e, g) => {
      const face = mesh(box(e.w, e.h, 0.1, 0.03), sign.idle, 0, 0, 0, g);
      mesh(box(e.w + 0.12, e.h + 0.12, 0.06, 0.02), m.wood, 0, 0, -0.05, g);
      return { face, looks: sign };
    };
    carts.slice(0, 3).forEach(c => driven(c));
    for (const c of carts)
      for (const x of [-0.8, 0.8]) mesh(box(0.06, 0.06, 1.5, 0.012), m.metal, c.position.x + x, 0.1, 0.35, object);
    animated.push((f, time, values, task) => {
      crates.forEach(q => {
        const cartIndex = Math.floor(q.n / 3),
          entry = pieces.filter(e => e.action)[cartIndex];
        q.it.visible = values[q.n % 3] > 0.01 && task?.rounds[q.n % 3]?.answer === entry.textValue;
      });
      carts.forEach(c => (c.position.z = 0.35 + f * 0.35));
    });
  } else if (type === 'definition') {
    // Word totems: two sleeping totems flank the pillars; words are carved faces, definitions are tablets; matches wake the totems.
    const eyes = [];
    for (const s of [-1, 1]) {
      const t = totemFigure(k, H * 0.55);
      t.g.position.set(s * 3.25, 0, -0.3);
      object.add(t.g);
      eyes.push(t);
    }
    mesh(box(6.3, 0.9, 0.5, 0.1), m.dark, 0, H - 0.7, -0.3, object);
    for (const s of [-1, 1]) mesh(box(0.5, H - 1.1, 0.5, 0.08), m.stone, s * 0.02, (H - 1.1) / 2, -0.55, object);
    const face = looks(m.stone, k.p.metal, k.p.glow),
      tablet = looks(mat(new T.Color(k.p.stone).multiplyScalar(1.12).getStyle(), {}, 'stone'), k.p.metal, k.p.glow);
    piece = (e, g) => {
      const left = e.action === 'pair-left',
        f = mesh(box(e.w, e.h, left ? 0.3 : 0.16, left ? 0.12 : 0.05), left ? face.idle : tablet.idle, 0, 0, 0, g);
      if (left)
        for (const s of [-1, 1])
          mesh(box(0.2, 0.06, 0.04, 0.01), m.ink, s * (e.w / 2 - 0.3), e.h / 2 - 0.18, left ? 0.16 : 0.09, g);
      return { face: f, looks: left ? face : tablet };
    };
    link = { material: m.glow, radius: 0.045 };
    eyes.forEach(t => driven(t.g));
    for (const s of [-1, 1]) {
      mesh(box(0.9, 0.1, 1.2, 0.02), m.dark, s * 3.25, 0.05, -0.3, object);
      for (const x of [-0.3, 0.3]) mesh(box(0.06, 0.07, 1.3, 0.01), m.metal, s * 3.25 + x, 0.12, -0.3, object);
    }
    animated.push(f => {
      for (const t of eyes) {
        t.eye.emissiveIntensity = smooth(f) * 1.4;
        t.lids.forEach(l => (l.position.y = t.h * 0.72 + 0.03 + smooth(f) * 0.12));
        t.g.position.z = -0.3 - f * 0.5;
      }
    });
  } else if (type === 'picture') {
    // Picture crates: words and pictures are crate faces; matched pairs are roped together and crates pile up at the sides.
    const woodL = mat(new T.Color(k.p.wood).lerp(new T.Color('#e0c38a'), 0.3).getStyle(), {}, 'wood'),
      piles = [];
    for (const s of [-1, 1])
      for (let i = 0; i < 3; i++) {
        const c = new T.Group();
        c.position.set(s * (3.0 + (i % 2) * 0.15), Math.floor(i / 2) * 0.9, -0.3 + (i % 2) * 0.9);
        object.add(c);
        mesh(box(0.9, 0.9, 0.9, 0.05), woodL, 0, 0.45, 0, c);
        for (const y of [0.12, 0.78]) mesh(box(0.94, 0.1, 0.94, 0.02), m.wood, 0, y, 0, c);
        piles.push(c);
      }
    mesh(box(6.4, 0.16, 0.6, 0.04), m.wood, 0, H - 0.4, -0.3, object);
    for (const s of [-1, 1]) mesh(box(0.16, H - 0.4, 0.16, 0.03), m.wood, s * 3.05, (H - 0.4) / 2, -0.3, object);
    const crate = looks(woodL, '#f0cf7a', k.p.glow);
    piece = (e, g) => {
      const face = mesh(box(e.w, e.h, 0.3, 0.05), crate.idle, 0, 0, 0, g);
      for (const y of [-1, 1]) mesh(box(e.w + 0.04, 0.09, 0.32, 0.02), m.wood, 0, y * (e.h / 2 - 0.04), 0, g);
      for (const x of [-1, 1]) mesh(box(0.09, e.h, 0.32, 0.02), m.wood, x * (e.w / 2 - 0.04), 0, 0, g);
      return { face, looks: crate };
    };
    link = { material: m.ink, radius: 0.03 };
    piles.slice(0, 3).forEach(c => driven(c));
    for (const s of [-1, 1]) mesh(box(0.6, 0.08, 2.4, 0.02), m.metal, s * 3.1, 0.06, 0.1, object);
    animated.push((f, time, values) =>
      piles.forEach((c, i) => (c.position.z = -0.3 + (i % 2) * 0.9 + values[i % 3] * 0.4)),
    );
  } else if (type === 'clue') {
    // Buried cache: a riddle stone behind the clue, answers on dug-up boards, and the chest rises as clues are solved.
    const dirt = mat(new T.Color(k.p.wood).lerp(new T.Color('#6b5a44'), 0.6).getStyle(), { roughness: 1 }, 'wood'),
      glyph = mat(k.p.glow, { emissive: k.p.glow, emissiveIntensity: 0.8 });
    mesh(box(5.8, H - 0.6, 0.5, 0.2), m.stone, 0, (H - 0.6) / 2, -0.7, object);
    for (const s of [-1, 1]) {
      const q = mesh(
        geo('qmark', () => new T.TorusGeometry(0.32, 0.07, 6, 16, Math.PI * 1.4)),
        glyph,
        s * 2.45,
        H * 0.55,
        -0.42,
        object,
      );
      q.rotation.z = -0.6;
      mesh(
        geo('qdot', () => new T.SphereGeometry(0.08, 8, 6)),
        glyph,
        s * 2.45 + 0.02,
        H * 0.55 - 0.75,
        -0.42,
        object,
      );
    }
    for (let i = 0; i < 10; i++) {
      const c = mesh(rockLump((i % 5) + 1), dirt, -3 + i * 0.66, 0.15, 0.4 + (i % 3) * 0.2, object);
      c.scale.set(0.42, 0.3, 0.38);
    }
    const chest = driven(new T.Group());
    chest.position.set(0, -0.7, 0.9);
    object.add(chest);
    mesh(box(1.0, 0.55, 0.62, 0.05), m.wood, 0, 0.27, 0, chest);
    for (const x of [-1, 1]) mesh(box(0.07, 0.58, 0.66, 0.02), m.metal, x * 0.4, 0.27, 0, chest);
    const lid = new T.Group();
    lid.position.set(0, 0.55, -0.31);
    chest.add(lid);
    mesh(box(1.02, 0.16, 0.64, 0.05), m.wood, 0, 0.07, 0.31, lid);
    mesh(cyl(0.045, 0.045, 1.0, 8), m.metal, 0, 0.55, -0.31, chest).rotation.z = Math.PI / 2;
    for (const x of [-0.65, 0.65]) mesh(box(0.09, 1.2, 0.14, 0.02), m.metal, x, 0.1, 0.9, object);
    const board = looks(
      mat(new T.Color(k.p.wood).lerp(new T.Color('#e0c38a'), 0.35).getStyle(), {}, 'wood'),
      '#f0cf7a',
      k.p.glow,
    );
    piece = (e, g) => {
      const face = mesh(box(e.w, e.h, 0.12, 0.04), board.idle, 0, 0, 0, g);
      for (const x of [-1, 1]) {
        const c = mesh(rockLump(3), dirt, x * (e.w / 2 - 0.25), -e.h / 2 - 0.05, 0.05, g);
        c.scale.set(0.22, 0.14, 0.18);
      }
      return { face, looks: board };
    };
    animated.push((f, time) => {
      chest.position.y = -0.7 + smooth(f) * 0.7;
      lid.rotation.x = -smooth((f - 0.8) / 0.2) * 1.2;
      glyph.emissiveIntensity = 0.6 + 0.3 * Math.sin(time * 2);
    });
  } else if (type === 'listen-multi') {
    // Hungry hedgehog: item cards lie on a market table, the basket is the deliver button, and it fills as requests are met.
    const { g: hog, basket } = hedgehogFigure(k);
    hog.position.set(-2.55, 0, 0.85);
    hog.rotation.y = 0.5;
    hog.scale.setScalar(1.25);
    object.add(hog);
    driven(basket);
    mesh(cyl(0.04, 0.04, 0.5, 8), m.metal, -2.25, 0.5, 1.25, object);
    const hut = new T.Group();
    hut.position.set(3.0, 0, -0.4);
    object.add(hut);
    mesh(box(1.4, 1.6, 1.3, 0.05), m.wood, 0, 0.8, 0, hut);
    const roof = mesh(
      geo('roof', () => new T.ConeGeometry(1.15, 0.9, 4)),
      m.moss,
      0,
      2.05,
      0,
      hut,
    );
    roof.rotation.y = Math.PI / 4;
    mesh(box(0.5, 0.9, 0.04, 0.02), m.dark, -0.2, 0.45, 0.66, hut);
    const colours = ['#d6493a', '#e8b84a', '#7aa850', '#5a8fc4'],
      fruits = colours.map((c, i) => {
        const it = mesh(
          geo('apple', () => new T.IcosahedronGeometry(0.11, 1)),
          mat(c),
          ((i % 2) - 0.5) * 0.18,
          0.32,
          i > 1 ? 0.08 : -0.08,
          basket,
        );
        it.visible = false;
        return it;
      });
    const card = looks(mat('#efe2c4', {}, 'paper'), '#f3d58c', k.p.glow),
      weave = looks(mat('#c09a5a', {}, 'wood'), '#f3d58c', k.p.glow),
      voice = looks(m.bell, '#f3d58c', k.p.glow);
    piece = (e, g) => {
      const l = e.action === 'confirm' ? weave : e.action === 'listen' ? voice : card,
        face = mesh(box(e.w, e.h, 0.14, e.action === 'confirm' ? 0.3 : 0.05), l.idle, 0, 0, 0, g);
      if (e.action === 'confirm')
        for (let i = 0; i < 4; i++)
          mesh(box(e.w - 0.2, 0.03, 0.02, 0.01), m.wood, 0, -e.h / 2 + 0.18 + i * 0.18, 0.08, g);
      return { face, looks: l };
    };
    animated.push((f, time) => {
      const n = Math.round(f * fruits.length);
      fruits.forEach((q, i) => (q.visible = i < n));
      hog.position.y = Math.abs(Math.sin(time * 2)) * 0.04;
    });
  } else if (type === 'instructions') {
    // Packing station: tags lie on a packing bench, the backpack is the secure button, and it fills as orders are packed.
    mesh(box(6.2, 0.12, 1.0, 0.03), m.wood, 0, 0.9, 0.25, object);
    for (const x of [-2.8, 0, 2.8]) mesh(box(0.12, 0.84, 0.8, 0.03), m.wood, x, 0.42, 0.25, object);
    const pack = new T.Group();
    pack.position.set(-2.6, 0.96, 0.3);
    object.add(pack);
    mesh(
      geo('pack', () => {
        const q = new T.SphereGeometry(0.5, 12, 10);
        q.scale(0.9, 1.1, 0.7);
        return q;
      }),
      mat('#7a9c6a', {}, 'fabric'),
      0,
      0.5,
      0,
      pack,
    );
    for (const x of [-0.2, 0.2]) mesh(box(0.07, 0.9, 0.06, 0.02), mat('#5a4030'), x, 0.5, 0.36, pack);
    driven(pack, [0.2, 0.5, 0.36]);
    const buckle = mesh(
      geo('pack-buckle', () => new T.TorusGeometry(0.1, 0.025, 4, 12)),
      m.metal,
      0.2,
      0.45,
      0.4,
      pack,
    );
    animated.push(f => (buckle.rotation.x = (1 - f) * 0.6));
    const boxes = ['#d6493a', '#e8b84a', '#5a8fc4'].map((c, i) => {
      const b = mesh(box(0.32, 0.28, 0.28, 0.04), mat(c), -1.4 + i * 0.75, 1.1, 0.25, object);
      return b;
    });
    const tag = looks(mat('#efe2c4', {}, 'paper'), '#f3d58c', k.p.glow),
      canvas = looks(mat('#7a9c6a', {}, 'fabric'), '#f3d58c', k.p.glow);
    piece = (e, g) => {
      const l = e.action === 'confirm' ? canvas : tag,
        face = mesh(box(e.w, e.h, 0.14, e.action === 'confirm' ? 0.25 : 0.04), l.idle, 0, 0, 0, g);
      if (e.action !== 'confirm') {
        const hole = mesh(
          geo('taghole', () => new T.TorusGeometry(0.07, 0.02, 4, 12)),
          m.metal,
          -e.w / 2 + 0.18,
          e.h / 2 - 0.16,
          0.08,
          g,
        );
        hole.castShadow = false;
      }
      return { face, looks: l };
    };
    animated.push(f => {
      const n = Math.round(f * boxes.length);
      boxes.forEach((b, i) => (b.visible = i >= n));
      pack.scale.setScalar(1 + smooth(f) * 0.15);
    });
  } else if (type === 'listen-word') {
    const bellGeo = geo('bell', () => {
        const pts = [];
        for (let i = 0; i <= 8; i++) {
          const t = i / 8;
          pts.push(new T.Vector2(0.04 + Math.sin(t * Math.PI * 0.5) * 0.26 + t * t * 0.06, -t * 0.45));
        }
        return new T.LatheGeometry(pts, 10);
      }),
      heads = [];
    for (const e of pieces) {
      const side = e.x < 0 ? -1 : 1,
        base = new T.Vector3(side * 3.0, 0, -0.25),
        top = new T.Vector3(e.x + side * (e.w / 2 - 0.25), e.y + e.h / 2 + 0.3, 0.42);
      tube(
        [
          [base.x, 0, base.z],
          [side * 2.9, top.y * 0.6, -0.3],
          [(base.x + top.x) / 2, top.y + 0.35, -0.2],
          [top.x, top.y, top.z],
        ],
        0.05,
        m.leaf,
        object,
        16,
      );
      const head = new T.Group();
      head.position.copy(top);
      head.scale.setScalar(0.72);
      object.add(head);
      mesh(bellGeo, e.action === 'listen' ? m.glow : m.bell, 0, 0, 0, head);
      mesh(
        geo('pistil', () => new T.SphereGeometry(0.06, 6, 4)),
        m.glow,
        0,
        -0.42,
        0,
        head,
      );
      heads.push(head);
    }
    for (const s of [-1, 1])
      for (let i = 0; i < 3; i++) {
        const leaf = mesh(
          geo('leaf', () => {
            const l = new T.SphereGeometry(0.42, 8, 4);
            l.scale(1, 0.1, 0.4);
            return l;
          }),
          m.leaf,
          s * (2.6 + i * 0.18),
          0.3 + i * 0.35,
          0.1,
          object,
        );
        leaf.rotation.set(0, i, s * 0.5);
      }
    const petal = looks(mat(new T.Color(k.p.petal).lerp(new T.Color(k.p.bell), 0.22).getStyle()), '#f3d58c', k.p.glow),
      voice = looks(m.bell, '#f3d58c', k.p.glow);
    piece = (e, g) => {
      const l = e.action === 'listen' ? voice : petal,
        face = mesh(box(e.w, e.h, 0.14, Math.min(0.3, e.h * 0.45)), l.idle, 0, 0, 0, g);
      for (const s of [-1, 1]) {
        const leaf = mesh(
          geo('pleaf', () => {
            const q = new T.SphereGeometry(0.3, 8, 4);
            q.scale(1, 0.42, 0.12);
            return q;
          }),
          m.leaf,
          s * (e.w / 2 - 0.05),
          -e.h / 2 + 0.02,
          0.06,
          g,
        );
        leaf.rotation.z = s * -0.5;
      }
      return { face, looks: l };
    };
    heads.slice(0, 3).forEach(h => driven(h));
    animated.push((f, time) => {
      heads.forEach((h, i) => {
        h.rotation.z = Math.sin(time * 1.7 + i * 1.3) * 0.08;
        h.scale.setScalar(1 + smooth(f) * 0.25);
      });
    });
  }
  // The scenery eases toward the task's progress, so each accepted answer (and the final opening) animates.
  let shown = null,
    checkpoint = null;
  const blinks = blinkFigures(object),
    hardware = mechanismHardware(k, type, { stage: true, targets });
  object.add(hardware.root);
  return {
    type,
    object,
    hardware,
    targets,
    materials: k.materials,
    piece,
    link,
    inscription: m.stone,
    captureMotion: () => ({ ...motion }),
    resumeMotion(saved) {
      Object.assign(motion, saved);
    },
    shown: () => shown ?? 0,
    setShown(v) {
      shown = v;
    },
    setTask(task, { immediate = false } = {}) {
      checkpoint = task;
      hardware.setState(taskMechanismState(task), { immediate });
    },
    update(dt, f, time) {
      if (shown === null) shown = f;
      hardware.update(dt, time);
      shown = hardware.fraction();
      for (const a of animated)
        a(
          shown,
          time,
          hardware.units.map(u => u.value),
          checkpoint,
        );
      hardware.connect();
      blinks(time);
    },
  };
}
