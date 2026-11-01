import * as T from './vendor/three.module.min.js';

// Small authored silhouettes for instancing: +Y up, base at y=0. Colours are
// neutral occlusion/light values, so a shared arena material supplies the hue.
// Each call owns its geometry; callers may cache one geometry per variant.
const TAU = Math.PI * 2;
const seedOf = v => (Number.isFinite(v) ? Math.trunc(v) : 0);
const noise = (v, a, b = 0) => {
  const q = Math.sin(v * 17.317 + a * 73.19 + b * 31.77) * 43758.5453;
  return q - Math.floor(q);
};
class Sculpture {
  constructor() {
    this.positions = [];
    this.colors = [];
  }
  tri(a, b, c, shade = 0.9) {
    const ab = new T.Vector3().fromArray(b).sub(new T.Vector3().fromArray(a)),
      ac = new T.Vector3().fromArray(c).sub(new T.Vector3().fromArray(a));
    if (ab.cross(ac).lengthSq() < 1e-14) return;
    for (const p of [a, b, c]) {
      this.positions.push(...p);
      const s = Math.max(0.4, Math.min(1, shade));
      this.colors.push(s, s, s);
    }
  }
  quad(a, b, c, d, shade) {
    this.tri(a, b, c, shade);
    this.tri(a, c, d, shade);
  }
  // Coordinates may run along any axis: orient the finished local-Y piece once.
  rings(rings, n, phase = 0, shade = 0.9, transform = p => p, caps = true) {
    const rows = rings.map((r, j) =>
      Array.from({ length: n }, (_, i) => {
        const a = (i / n) * TAU + phase,
          k = 1 + (r.jitter || 0) * Math.sin(i * 2.33 + j * 0.53 + phase);
        return transform([r.x + Math.cos(a) * r.r * k, r.y, r.z + Math.sin(a) * r.r * k]);
      }),
    );
    for (let j = 0; j < rows.length - 1; j++)
      for (let i = 0; i < n; i++)
        this.quad(
          rows[j][i],
          rows[j + 1][i],
          rows[j + 1][(i + 1) % n],
          rows[j][(i + 1) % n],
          shade * (0.87 + (0.09 * j) / (rows.length - 1) + 0.04 * Math.cos(i * 1.1)),
        );
    const lower = transform([rings[0].x, rings[0].y, rings[0].z]),
      upper = transform([rings.at(-1).x, rings.at(-1).y, rings.at(-1).z]);
    if (caps)
      for (let i = 0; i < n; i++) {
        this.tri(lower, rows[0][i], rows[0][(i + 1) % n], shade * 0.65);
        this.tri(upper, rows.at(-1)[(i + 1) % n], rows.at(-1)[i], shade);
      }
  }
  limb(a, b, r0, r1, n = 7, shade = 0.86) {
    const start = new T.Vector3(...a),
      end = new T.Vector3(...b),
      delta = end.clone().sub(start),
      len = delta.length(),
      q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize());
    this.rings(
      [
        { x: 0, y: 0, z: 0, r: r0 },
        { x: 0.035, y: len * 0.48, z: -0.017, r: (r0 + r1) * 0.52 },
        { x: 0, y: len, z: 0, r: r1 },
      ],
      n,
      0,
      shade,
      p => new T.Vector3(...p).applyQuaternion(q).add(start).toArray(),
    );
  }
  finish(name, variant, features) {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(this.positions, 3));
    g.setAttribute('color', new T.Float32BufferAttribute(this.colors, 3));
    g.computeVertexNormals();
    g.computeBoundingBox();
    // Ground all components together (thin roots/stems can otherwise dip below
    // the anchor). Dominant-face planar UVs preserve usable wood/stone grain.
    g.translate(0, -g.boundingBox.min.y, 0);
    const p = g.attributes.position,
      n = g.attributes.normal,
      uv = [];
    for (let i = 0; i < p.count; i++) {
      const nx = Math.abs(n.getX(i)),
        ny = Math.abs(n.getY(i)),
        nz = Math.abs(n.getZ(i));
      if (ny >= nx && ny >= nz) uv.push(p.getX(i), p.getZ(i));
      else if (nx >= nz) uv.push(p.getZ(i), p.getY(i));
      else uv.push(p.getX(i), p.getY(i));
    }
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    g.computeBoundingBox();
    g.computeBoundingSphere();
    g.name = 'maxima-' + name;
    g.userData = {
      family: 'environment-kit',
      asset: name,
      variant,
      baseY: 0,
      vertexShade: 'neutral-occlusion',
      features,
    };
    return g;
  }
}

export function rockFormation(variant = 0) {
  const v = seedOf(variant),
    s = new Sculpture(),
    phase = noise(v, 1) * TAU;
  const strata = [
    { y: 0, r: 0.94 },
    { y: 0.12, r: 1.12 },
    { y: 0.55, r: 1.02 },
    { y: 0.62, r: 0.87 },
    { y: 0.95, r: 0.93 },
    { y: 1.08, r: 0.71 },
    { y: 1.46, r: 0.64 },
    { y: 1.58, r: 0.43 },
  ];
  s.rings(
    strata.map((r, j) => ({
      ...r,
      y: r.y * (0.93 + noise(v, 2) * 0.15),
      x: j * 0.033 + Math.sin(v + 1) * j * 0.014,
      z: -j * 0.025,
      r: r.r * (0.94 + noise(v, j + 3) * 0.12),
      jitter: 0.1,
    })),
    9,
    phase,
    0.92,
  );
  for (let i = 0; i < 2; i++) {
    const a = phase + i * 2.2,
      r = 0.32 + noise(v, i + 7) * 0.19,
      x = Math.cos(a) * 0.85,
      z = Math.sin(a) * 0.8;
    s.rings(
      [
        { x, y: 0, z, r: r * 0.86 },
        { x: x + 0.04, y: 0.21, z, r },
        { x: x + 0.1, y: 0.42 + noise(v, i + 9) * 0.19, z: z - 0.04, r: r * 0.56 },
      ],
      7,
      a,
      0.82,
    );
  }
  return s.finish('rock-formation', v, ['offset-strata', 'fractured-shelves', 'embedded-satellites']);
}

export function treeTrunk(variant = 0) {
  const v = seedOf(variant),
    s = new Sculpture(),
    bend = (noise(v, 2) - 0.5) * 0.38,
    phase = noise(v, 6) * TAU;
  s.rings(
    [
      { x: 0, y: 0, z: 0, r: 0.53 },
      { x: 0.02, y: 0.23, z: 0, r: 0.43 },
      { x: -0.05, y: 0.85, z: 0.04, r: 0.31 },
      { x: bend, y: 1.85, z: 0.05, r: 0.26 },
      { x: bend + 0.15, y: 2.68, z: -0.08, r: 0.19 },
      { x: bend + 0.27, y: 3.52, z: -0.12, r: 0.085 },
    ],
    9,
    phase,
    0.86,
  );
  // Triangular buttresses merge visually into a wide, stable rooted foot.
  for (let i = 0; i < 5; i++) {
    const a = phase + (i * TAU) / 5,
      r = 0.92 + noise(v, i + 12) * 0.22,
      w = 0.12,
      c = Math.cos(a),
      sn = Math.sin(a),
      l = [c * 0.24, 0, sn * 0.24],
      r0 = [c * 1.03 - sn * w, 0, sn * 1.03 + c * w],
      r1 = [c * 1.03 + sn * w, 0, sn * 1.03 - c * w],
      t = [c * 0.28, 0.57 + noise(v, i) * 0.12, sn * 0.28];
    s.tri(l, r0, t, 0.67);
    s.tri(t, r0, r1, 0.79);
    s.tri(t, r1, l, 0.72);
    s.limb([c * 0.56, 0.09, sn * 0.56], [c * r, 0.035, sn * r], 0.12, 0.025, 5, 0.73);
  }
  for (let i = 0; i < 3; i++) {
    const a = phase + i * 2.18,
      join = [bend * 0.6, 1.89 + i * 0.39, 0.02],
      elbow = [Math.cos(a) * 0.65 + bend, 2.41 + i * 0.31, Math.sin(a) * 0.62],
      tip = [Math.cos(a) * 1.16 + bend, 2.94 + i * 0.28, Math.sin(a) * 1.03];
    s.limb(join, elbow, 0.17 - i * 0.02, 0.11, 7, 0.88);
    s.limb(elbow, tip, 0.11, 0.032, 6, 0.88);
  }
  return s.finish('tree-trunk', v, ['flared-foot', 'buttress-roots', 'crooked-leader', 'forked-boughs']);
}

export function treeCanopy(variant = 0) {
  const v = seedOf(variant),
    s = new Sculpture(),
    phase = noise(v, 4) * TAU;
  // Five offset crowns overlap into a tiered, open-edged silhouette, rather than
  // one sphere. Underside rings are deeply shaded; shoulders catch the light.
  const lobes = [
    [0, 0, 0, 1.43, 1.47],
    [-0.91, 0.23, 0.13, 0.99, 1.2],
    [0.85, 0.46, 0.18, 1.05, 1.23],
    [0.13, 0.59, -0.74, 1.13, 1.42],
    [0.05, 1.12, 0.07, 1.03, 1.32],
  ];
  lobes.forEach(([x, y, z, r, h], i) => {
    const vary = 0.94 + noise(v, i + 3) * 0.13,
      rot = phase + i * 0.71;
    s.rings(
      [
        { x: x * 0.95, y: y + 0.02, z, r: r * 0.55 },
        { x: x - 0.06, y: y + h * 0.2, z: z + 0.03, r: r * vary },
        { x: x + 0.06, y: y + h * 0.56, z: z - 0.07, r: r * 0.88 * vary },
        { x: x + 0.14, y: y + h * 0.86, z: z - 0.09, r: r * 0.47 },
        { x: x + 0.13, y: y + h, z: z - 0.09, r: r * 0.13 },
      ],
      8,
      rot,
      0.81 + i * 0.028,
    );
  });
  return s.finish('tree-canopy', v, ['five-offset-crowns', 'tiered-shoulders', 'shaded-undersides']);
}

function leaf(s, a, b, width, shade) {
  const d = new T.Vector3(...b).sub(new T.Vector3(...a)),
    side = new T.Vector3(-d.z, 0, d.x).normalize().multiplyScalar(width),
    mid = new T.Vector3(...a).lerp(new T.Vector3(...b), 0.48),
    ridge = mid.clone();
  ridge.y += width * 0.3;
  const left = mid.clone().add(side),
    right = mid.clone().sub(side),
    av = new T.Vector3(...a),
    bv = new T.Vector3(...b);
  // Four upper and four reverse triangles give opaque folded leaves without a
  // DoubleSide material or overlapping coplanar cards.
  for (const [p, q, r] of [
    [av, left, ridge],
    [left, bv, ridge],
    [bv, right, ridge],
    [right, av, ridge],
  ]) {
    s.tri(p.toArray(), q.toArray(), r.toArray(), shade);
    const low = r.clone();
    low.y -= 0.018;
    s.tri(p.toArray(), low.toArray(), q.toArray(), shade * 0.73);
  }
}
export function fernCluster(variant = 0) {
  const v = seedOf(variant),
    s = new Sculpture(),
    phase = noise(v, 1) * TAU;
  for (let f = 0; f < 5; f++) {
    const a = phase + (f * TAU) / 5,
      reach = 0.72 + noise(v, f + 2) * 0.24,
      height = 0.72 + noise(v, f + 13) * 0.28,
      c = Math.cos(a),
      sn = Math.sin(a),
      at = t => [c * reach * t, height * Math.sin(t * Math.PI * 0.66), sn * reach * t];
    s.rings(
      [0, 0.36, 0.7, 1].map((t, i) => {
        const p = at(t);
        return { x: p[0], y: p[1] + 0.015, z: p[2], r: [0.024, 0.019, 0.012, 0.005][i] };
      }),
      3,
      a,
      0.76,
    );
    for (let j = 1; j <= 3; j++) {
      const t = j / 4,
        root = at(t),
        len = (1 - t) * 0.31 + 0.035;
      for (const side of [-1, 1]) {
        const tip = [root[0] + c * 0.12 - sn * len * side, root[1] + 0.06, root[2] + sn * 0.12 + c * len * side];
        leaf(s, root, tip, len * 0.22, 0.76 + t * 0.19);
      }
    }
    const a0 = at(0.82),
      b0 = at(1.08);
    leaf(s, a0, b0, 0.057, 0.94);
  }
  return s.finish('fern-cluster', v, ['five-arching-fronds', 'paired-folded-leaflets', 'raised-midribs']);
}

export function fallenLog(variant = 0) {
  const v = seedOf(variant),
    s = new Sculpture(),
    length = 2.85 + noise(v, 5) * 0.38,
    r = 0.32 + noise(v, 3) * 0.055,
    phase = noise(v, 1) * TAU;
  // Cylinder local Y maps onto X. End rings form a pale broken rim around an
  // inset dark heart; narrow outer ridges retain the single-material batch.
  const orient = p => [p[1] - length / 2, r - p[0], p[2]];
  s.rings(
    [
      { x: 0, y: 0, z: 0, r: r * 0.86 },
      { x: 0, y: 0.1, z: 0, r },
      { x: 0.025, y: length * 0.45, z: -0.015, r: r * 1.04 },
      { x: 0, y: length - 0.1, z: 0.01, r: r * 0.98 },
      { x: 0, y: length, z: 0, r: r * 0.82 },
    ],
    10,
    phase,
    0.73,
    orient,
    false,
  );
  for (const end of [0, length]) {
    const inset = end === 0 ? 0.045 : -0.045,
      reverse = end === 0,
      center = orient([0, end + inset, 0]);
    for (let i = 0; i < 10; i++) {
      const a = phase + (i * TAU) / 10,
        b = phase + ((i + 1) * TAU) / 10,
        o = orient([Math.cos(a) * r * 0.82, end, Math.sin(a) * r * 0.82]),
        on = orient([Math.cos(b) * r * 0.82, end, Math.sin(b) * r * 0.82]),
        q = orient([Math.cos(a) * r * 0.64, end + inset, Math.sin(a) * r * 0.64]),
        qn = orient([Math.cos(b) * r * 0.64, end + inset, Math.sin(b) * r * 0.64]);
      if (reverse) {
        s.quad(o, on, qn, q, 0.93);
        s.tri(center, q, qn, 0.76);
      } else {
        s.quad(o, q, qn, on, 0.93);
        s.tri(center, qn, q, 0.76);
      }
    }
  }
  for (let i = 0; i < 5; i++) {
    const a = phase + (i * TAU) / 5,
      x = Math.cos(a) * r * 0.95,
      z = Math.sin(a) * r * 0.95;
    s.limb([-0.99, x + r, z], [1.0, x + r + 0.015, z], 0.025, 0.018, 4, 0.59 + noise(v, i) * 0.13);
  }
  s.limb([-0.37, r * 1.45, 0.08], [-0.54, r * 2.3, 0.23], 0.11, 0.045, 6, 0.77);
  return s.finish('fallen-log', v, ['fluted-bark', 'inset-end-grain', 'broken-branch']);
}

// A chamfered irregular block, with a knocked-off upper corner. Faces are wound
// around their centroid to keep culling reliable on either side of the path.
function wornBlock(s, x, y, z, w, h, d, phase, shade) {
  const b = 0.075; // Explicit corner loops retain masonry planes.
  const corners = [
    [-w / 2 + b, -d / 2],
    [w / 2 - b, -d / 2],
    [w / 2, -d / 2 + b],
    [w / 2, d / 2 - b],
    [w / 2 - b, d / 2],
    [-w / 2 + b, d / 2],
    [-w / 2, d / 2 - b],
    [-w / 2, -d / 2 + b],
  ];
  const loops = [
    { y: y, s: 0.92 },
    { y: y + b, s: 1 },
    { y: y + h - b, s: 1 },
    { y: y + h, s: 0.86 },
  ].map((r, j) =>
    corners.map(([a, c], i) => [
      x + a * r.s + (j > 1 ? Math.sin(i * 1.1 + phase) * 0.025 : 0),
      r.y - (j === 3 && i === 2 ? 0.13 : 0),
      z + c * r.s,
    ]),
  );
  for (let j = 0; j < 3; j++)
    for (let i = 0; i < 8; i++) {
      const k = (i + 1) % 8;
      s.quad(
        loops[j][i],
        loops[j + 1][i],
        loops[j + 1][k],
        loops[j][k],
        shade * (j === 0 ? 0.72 : j === 1 ? 0.86 : 0.98),
      );
    }
  for (let i = 0; i < 8; i++) {
    s.tri([x, y, z], loops[0][i], loops[0][(i + 1) % 8], shade * 0.62);
    s.tri([x, y + h - 0.025, z], loops[3][(i + 1) % 8], loops[3][i], shade);
  }
}
export function masonryFragment(variant = 0) {
  const v = seedOf(variant),
    s = new Sculpture(),
    j = (noise(v, 1) - 0.5) * 0.13;
  wornBlock(s, 0, 0, 0, 2.02, 0.24, 0.91, v, 0.87);
  wornBlock(s, -0.49 + j, 0.25, -0.01, 0.92, 0.45, 0.73, v + 1, 0.91);
  wornBlock(s, 0.46 + j, 0.25, 0.02, 0.88, 0.43, 0.76, v + 2, 0.85);
  wornBlock(s, -0.13 - j, 0.71, -0.05, 1.02, 0.44, 0.69, v + 3, 0.94);
  wornBlock(s, -0.31 + j, 1.16, -0.045, 0.7, 0.19, 0.79, v + 4, 0.98);
  wornBlock(s, 0.8, 0.03, 0.39, 0.34, 0.21, 0.31, v + 5, 0.78);
  return s.finish('masonry-fragment', v, [
    'staggered-courses',
    'open-mortar-joints',
    'chamfered-fractures',
    'broken-coping',
  ]);
}
