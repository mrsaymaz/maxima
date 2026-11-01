import { enemyExpression } from './combat-expression.js';
import { yieldPose } from './enemy-yield.js';
import { surfaceMaterial, assignSurfaceRoles, replaceCueMaterials, cueMaterial } from './surface-materials.js';
import * as T from './vendor/three.module.min.js';

const STATES = new WeakMap(),
  TAU = Math.PI * 2;
const finite = (n, f = 0) => (Number.isFinite(n) ? n : f);
const clamp = n => Math.max(0, Math.min(1, finite(n)));
const PALETTES = [
  ['#876c4e', '#62814e', '#9ab678'],
  ['#7b7560', '#668d79', '#b0c5a0'],
  ['#787080', '#6f7e85', '#b4b8bd'],
];
function merge(root) {
  root.updateMatrixWorld(true);
  const inverse = root.matrixWorld.clone().invert(),
    batches = new Map();
  root.traverse(o => {
    if (!o.isMesh) return;
    const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    geo.applyMatrix4(inverse.clone().multiply(o.matrixWorld));
    if (!batches.has(o.material)) batches.set(o.material, { p: [], n: [] });
    const a = batches.get(o.material);
    for (const v of geo.attributes.position.array) a.p.push(v);
    for (const v of geo.attributes.normal.array) a.n.push(v);
    geo.dispose();
  });
  root.clear();
  for (const [material, data] of batches) {
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(data.p, 3));
    geometry.setAttribute('normal', new T.Float32BufferAttribute(data.n, 3));
    const mesh = new T.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
  }
}
function leafGeometry() {
  const vertices = [
      [0, 0, 0],
      [-0.14, 0.19, 0],
      [0, 0.43, 0],
      [0.14, 0.19, 0],
      [0, 0.2, 0.075],
      [0, 0.2, -0.035],
    ],
    faces = [
      [0, 1, 4],
      [1, 2, 4],
      [2, 3, 4],
      [3, 0, 4],
      [1, 0, 5],
      [2, 1, 5],
      [3, 2, 5],
      [0, 3, 5],
    ],
    p = [];
  for (const face of faces) for (const i of face) p.push(...vertices[i]);
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(p, 3));
  geo.computeVertexNormals();
  return geo;
}
function sectorGeometry(angle, outline = false) {
  const p = [],
    n = 40;
  const tri = (a, b, c) => p.push(...a, ...b, ...c),
    at = (r, a) => [Math.sin(a) * r, 0, Math.cos(a) * r];
  for (let i = 0; i < n; i++) {
    const a = -angle + (2 * angle * i) / n,
      b = -angle + (2 * angle * (i + 1)) / n;
    if (outline) {
      tri(at(0.981, a), at(1, a), at(1, b));
      tri(at(0.981, a), at(1, b), at(0.981, b));
    } else tri([0, 0, 0], at(1, a), at(1, b));
  }
  if (outline)
    for (const a of [-angle, angle]) {
      const normal = [Math.cos(a) * 0.009, 0, -Math.sin(a) * 0.009],
        v = at(0.99, a),
        q = normal.map(x => -x),
        r = v.map((x, i) => x + normal[i]),
        s = v.map((x, i) => x - normal[i]);
      tri(normal, r, s);
      tri(normal, s, q);
    }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(p, 3));
  geo.computeVertexNormals();
  return geo;
}

export function makeEnemySpecies(section) {
  const enemy = section?.enemy;
  if (!enemy || !['seed', 'spore'].includes(enemy.kind)) throw new Error('Unknown path enemy species');
  const group = new T.Group();
  group.name = 'enemy-species-' + enemy.kind;
  const palette = PALETTES[section.area] || PALETTES[0],
    cache = new Map();
  const mat = (color, extra = {}) => surfaceMaterial('organic', color, extra);
  const m = {
    bark: mat(palette[0]),
    leaf: mat(palette[1]),
    leafLight: mat(palette[2]),
    dark: mat('#304c43'),
    amber: mat('#ecc267', { emissive: '#bc823b', emissiveIntensity: 0.6, roughness: 0.42 }),
    cream: mat('#f1e7bb'),
    teal: mat('#9bc7b7'),
    violet: mat('#8e72b0'),
    rim: mat('#b8a2cd'),
    gills: mat('#b2e5d9', { emissive: '#77cbb8', emissiveIntensity: 0.8 }),
    warning: mat('#f5b94e', {
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      emissive: '#ec9a36',
      emissiveIntensity: 0.6,
      side: T.DoubleSide,
    }),
    outline: mat('#ffdc7b', {
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      emissive: '#f7b849',
      emissiveIntensity: 0.8,
      side: T.DoubleSide,
    }),
    spores: mat('#f1c76b', { transparent: true, opacity: 0.9, emissive: '#c18d40', emissiveIntensity: 0.6 }),
  };
  assignSurfaceRoles(m, {
    wood: ['bark'],
    foliage: ['leaf', 'leafLight'],
    organic: ['dark', 'cream', 'teal', 'violet', 'rim'],
    effect: ['amber', 'gills', 'spores'],
    cue: ['warning', 'outline'],
  });
  replaceCueMaterials(m, ['warning', 'outline']);
  const geo = (key, fn) => {
    if (!cache.has(key)) cache.set(key, fn());
    return cache.get(key);
  };
  const box = (x, y, z) => geo(`b${x},${y},${z}`, () => new T.BoxGeometry(x, y, z));
  const ball = r => geo('s' + r, () => new T.SphereGeometry(r, 10, 6));
  const pebble = r => geo('p' + r, () => new T.DodecahedronGeometry(r, 0));
  const cyl = (a, b, h) => geo(`c${a},${b},${h}`, () => new T.CylinderGeometry(a, b, h, 8));
  const mesh = (geometry, material, x = 0, y = 0, z = 0, parent = group) => {
    const o = new T.Mesh(geometry, material);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  };
  const actor = new T.Group();
  actor.name = 'species-actor';
  group.add(actor);
  const body = new T.Group();
  body.name = 'species-body';
  actor.add(body);
  const fixed = new T.Group();
  fixed.name = 'fixed-creature';
  body.add(fixed);
  const state = { section, enemy, actor, body, m, object: new T.Object3D(), kind: enemy.kind };
  const eyes = (y, z, spacing = 0.12) => {
    for (const side of [-1, 1]) {
      mesh(ball(0.073), m.dark, side * spacing, y, z, fixed).scale.set(1, 0.88, 0.32);
      mesh(ball(0.053), enemy.kind === 'seed' ? m.amber : m.gills, side * spacing, y, z + 0.018, fixed).scale.set(
        0.83,
        1,
        0.26,
      );
      mesh(ball(0.021), m.dark, side * spacing, y + 0.001, z + 0.033, fixed).scale.set(0.65, 1.1, 0.3);
      mesh(ball(0.01), m.cream, side * spacing - 0.014, y + 0.022, z + 0.039, fixed);
    }
  };
  const legs = new T.InstancedMesh(pebble(0.085), enemy.kind === 'seed' ? m.bark : m.teal, 4);
  legs.name = 'little-root-feet';
  actor.add(legs);
  legs.castShadow = true;
  state.legs = legs;
  if (enemy.kind === 'seed') {
    const seed = mesh(pebble(0.34), m.bark, 0, 0.46, -0.015, fixed);
    seed.scale.set(0.95, 1.32, 0.91);
    for (let row = 0; row < 3; row++)
      for (let i = 0; i < 6; i++) {
        const a = (i * TAU) / 6 + row * 0.43,
          r = 0.265 - 0.018 * row,
          scale = mesh(
            pebble(0.13),
            i % 2 ? m.bark : m.leaf,
            Math.sin(a) * r,
            0.3 + row * 0.18,
            Math.cos(a) * r,
            fixed,
          );
        scale.scale.set(0.78, 0.73, 0.6);
        scale.rotation.y = a;
      }
    const face = mesh(pebble(0.2), m.leafLight, 0, 0.73, 0.175, fixed);
    face.scale.set(1.06, 0.7, 0.74);
    eyes(0.756, 0.321, 0.1);
    for (const side of [-1, 1]) {
      const smile = mesh(box(0.057, 0.014, 0.015), m.dark, side * 0.026, 0.667, 0.307, fixed);
      smile.rotation.z = side * 0.25;
    }
    mesh(new T.ConeGeometry(0.072, 0.17, 5), m.leaf, 0, 0.935, -0.01, fixed);
    for (const z of [-0.285, 0.285]) {
      const core = mesh(ball(0.165), m.amber, 0, 0.46, z, fixed);
      core.scale.set(0.85, 1.16, 0.43);
    }
    merge(fixed);
    const armour = new T.InstancedMesh(leafGeometry(), m.leaf, 6);
    armour.name = 'shield-leaf-petals';
    body.add(armour);
    armour.castShadow = true;
    const veins = new T.InstancedMesh(box(0.026, 0.23, 0.018), m.leafLight, 6);
    veins.name = 'shield-leaf-veins';
    body.add(veins);
    state.armour = armour;
    state.veins = veins;
    const warning = new T.Group();
    warning.name = 'forward-slam-sector';
    group.add(warning);
    const fill = mesh(sectorGeometry(0.78), m.warning, 0, 0, 0, warning),
      outline = mesh(sectorGeometry(0.78, true), m.outline, 0, 0.006, 0, warning);
    fill.castShadow = false;
    outline.castShadow = false;
    state.sector = { group: warning, fill, outline, angle: 0.78 };
  } else {
    const stem = mesh(cyl(0.14, 0.19, 0.52), m.teal, 0, 0.36, 0, fixed);
    stem.scale.z = 0.84;
    const face = mesh(ball(0.18), m.teal, 0, 0.48, 0.07, fixed);
    face.scale.set(1, 0.91, 0.8);
    eyes(0.49, 0.213, 0.08);
    for (const side of [-1, 1]) {
      const mouth = mesh(box(0.044, 0.014, 0.014), m.dark, side * 0.019, 0.397, 0.205, fixed);
      mouth.rotation.z = -side * 0.17;
    }
    merge(fixed);
    const cap = new T.Group();
    cap.name = 'mistcap-bell';
    cap.position.y = 0.7;
    body.add(cap);
    const profile = [
      [0, 0.265],
      [0.13, 0.24],
      [0.29, 0.16],
      [0.43, 0.045],
      [0.485, -0.005],
      [0.45, -0.055],
      [0.3, -0.047],
      [0.1, -0.035],
    ].map(([x, y]) => new T.Vector2(x, y));
    mesh(new T.LatheGeometry(profile, 20), m.violet, 0, 0, 0, cap);
    const rim = mesh(new T.TorusGeometry(0.481, 0.018, 4, 32), m.rim, 0, -0.01, 0, cap);
    rim.rotation.x = Math.PI / 2;
    for (let i = 0; i < 12; i++) {
      const a = (i * TAU) / 12,
        gill = mesh(box(0.028, 0.015, 0.3), m.gills, Math.sin(a) * 0.285, -0.059, Math.cos(a) * 0.285, cap);
      gill.rotation.y = a;
    }
    for (let i = 0; i < 5; i++) {
      const a = i * 2.4,
        r = 0.14 + (i % 2) * 0.13,
        spot = mesh(ball(0.049), m.rim, Math.sin(a) * r, 0.31 - r * 0.5, Math.cos(a) * r, cap);
      spot.scale.set(1, 0.15, 0.8);
    }
    merge(cap);
    state.cap = cap;
    const warning = mesh(new T.TorusGeometry(0.75, 0.035, 5, 48), m.outline);
    warning.name = 'initial-pulse-annulus';
    warning.rotation.x = Math.PI / 2;
    warning.castShadow = false;
    state.annulus = warning;
    state.rings = [];
    for (let i = 0; i < 2; i++) {
      const material = cueMaterial('#ba8ddd', { transparent: true, opacity: 0.88 }),
        geometry = new T.TorusGeometry(1, 0.075, 6, 64);
      geometry.rotateX(Math.PI / 2);
      const ring = mesh(geometry, material);
      ring.name = 'expanding-spore-ring-' + i;
      ring.castShadow = false;
      ring.frustumCulled = false;
      state.rings.push(ring);
    }
  }
  const spores = new T.InstancedMesh(new T.OctahedronGeometry(0.027, 0), m.spores, 8);
  spores.name = 'gathering-and-dispersing-spores';
  spores.frustumCulled = false;
  group.add(spores);
  state.spores = spores;
  state.flashMaterials = [m.bark, m.leaf, m.leafLight, m.dark, m.teal, m.violet, m.rim];
  state.baseColors = state.flashMaterials.map(material => material.color.clone());
  state.flashColor = new T.Color('#fff4d4');
  group.userData = {
    id: enemy.id,
    kind: enemy.kind,
    name: enemy.name || (enemy.kind === 'seed' ? 'Brambleguard' : 'Mistcap'),
    radius: 0.62,
    height: 1.08,
    worldCoordinates: true,
    drawMeshes: 0,
    triangles: 0,
    warningRadius: enemy.kind === 'spore' ? 0.75 : null,
  };
  STATES.set(group, state);
  updateEnemySpecies(
    group,
    {
      ...enemy,
      heading: Math.atan2(-section.forward.x, -section.forward.z),
      phase: 'watch',
      timer: 0,
      duration: 1,
      hp: enemy.maxHp,
      maxHp: enemy.maxHp,
      flash: 0,
      active: false,
      rings: [],
    },
    { time: 0 },
  );
  group.traverse(o => {
    if (o.isMesh) {
      group.userData.drawMeshes++;
      group.userData.triangles +=
        ((o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3) *
        (o.isInstancedMesh ? o.count : 1);
    }
  });
  return group;
}

export function updateEnemySpecies(group, runtime, { time = 0, playerRadius = 0 } = {}) {
  const state = STATES.get(group);
  if (!state || !runtime) return group;
  time = finite(time);
  const { enemy, section, kind, actor, body, legs, m, object, spores } = state;
  const phase = runtime.phase || 'watch',
    timer = Math.max(0, finite(runtime.timer)),
    progress = clamp(timer / Math.max(0.001, finite(runtime.duration, 1))),
    defeat = phase === 'defeated' ? clamp(timer / 1.1) : 0,
    heading = finite(runtime.heading),
    x = finite(runtime.x, enemy.x),
    z = finite(runtime.z, enemy.z),
    recover = phase === 'recover',
    wind = phase === (kind === 'seed' ? 'seedwindup' : 'sporewindup'),
    strike = phase === 'seedstrike',
    pulse = phase === 'pulse',
    hurt = phase === 'hurt';
  const expression = enemyExpression(runtime, time);
  const yielding = yieldPose(kind, timer);
  const bounce = Math.sin(time * 2.7) * 0.004,
    lunge = strike ? Math.sin(progress * Math.PI) * 0.045 : 0;
  actor.position.set(
    x + Math.sin(heading) * lunge + (section.right.x * 0.43 - section.forward.x * 0.1) * defeat,
    0.028 + bounce,
    z + Math.cos(heading) * lunge + (section.right.z * 0.43 - section.forward.z * 0.1) * defeat,
  );
  if (phase === 'defeated') {
    actor.position.x = x + section.right.x * yielding.side - section.forward.x * yielding.back;
    actor.position.z = z + section.right.z * yielding.side - section.forward.z * yielding.back;
  }
  actor.rotation.set(0, heading + (phase === 'defeated' ? yielding.yaw : 0), 0);
  actor.scale.setScalar(1);
  actor.visible = phase !== 'defeated' || defeat < 1;
  body.rotation.set(
    phase === 'defeated'
      ? yielding.pitch
      : strike
        ? 0.1 * Math.sin(progress * Math.PI)
        : hurt
          ? 0.025 * Math.sin(timer * 42)
          : wind
            ? -0.045 * progress
            : recover
              ? 0.025 * Math.sin(progress * Math.PI)
              : 0,
    0,
    hurt ? Math.sin(timer * 38) * 0.035 : 0,
  );
  body.position.y = wind ? -0.018 * Math.sin((progress * Math.PI) / 2) : 0;
  body.position.x = 0;
  body.position.z = 0;
  if (phase !== 'defeated') {
    body.rotation.x += expression.pitch;
    body.rotation.z += expression.roll;
    body.position.x += expression.recoilX;
    body.position.z += expression.recoilZ;
  }
  for (let i = 0; i < 4; i++) {
    const side = i % 2 ? 1 : -1,
      front = i < 2 ? 1 : -1;
    object.position.set(side * (kind === 'seed' ? 0.2 : 0.14), 0.086, front * (kind === 'seed' ? 0.18 : 0.12));
    object.rotation.set(
      runtime.returning ? Math.sin(time * 11 + (i % 2 === Math.floor(i / 2) ? 0 : Math.PI)) * 0.18 : 0,
      side * 0.25,
      side * 0.1,
    );
    object.scale.set(1, 0.84, 1.18);
    object.updateMatrix();
    legs.setMatrixAt(i, object.matrix);
  }
  legs.instanceMatrix.needsUpdate = true;
  const flash = clamp(runtime.flash);
  state.flashMaterials.forEach((material, i) =>
    material.color.copy(state.baseColors[i]).lerp(state.flashColor, flash * 0.45),
  );
  if (kind === 'seed') {
    const opening = defeat
      ? 1 - defeat
      : hurt
        ? 0.92
        : recover
          ? 0.14 + 0.78 * Math.min(1, timer / 0.22)
          : wind
            ? 0.03
            : 0.14;
    for (let i = 0; i < 6; i++) {
      const rear = i === 5,
        side = i === 2 ? 0 : i < 2 ? -1 : 1,
        row = i % 2;
      if (rear) {
        object.position.set(0.22 * opening, 0.255 + opening * 0.17, -0.285);
        object.rotation.set(-0.12, 0, -opening * 0.6);
        object.scale.set(1.2, 1.2, 0.95);
      } else {
        object.position.set(
          i === 2 ? 0 : side * (0.155 + opening * 0.15) + side * 0.035 * row,
          0.24 + row * 0.13,
          (i === 2 ? 0.35 : 0.285) + (strike ? 0.018 * Math.sin(progress * Math.PI) : 0),
        );
        object.rotation.set(
          -0.15 + opening * 0.15,
          i === 2 ? 0 : side * opening * 0.7,
          i === 2 ? 0 : side * (0.1 + opening * 0.3),
        );
        object.scale.set(i === 2 ? 1.1 : 1, 1.05, 1);
      }
      object.updateMatrix();
      state.armour.setMatrixAt(i, object.matrix);
      const matrix = object.matrix.clone().multiply(new T.Matrix4().makeTranslation(0, 0.22, 0.081));
      state.veins.setMatrixAt(i, matrix);
    }
    state.armour.instanceMatrix.needsUpdate = true;
    state.veins.instanceMatrix.needsUpdate = true;
    m.amber.emissiveIntensity = recover || hurt ? 1.35 : wind ? 0.85 + progress * 0.4 : 0.6;
    const sector = state.sector,
      angle = Math.max(0.05, Math.min(Math.PI * 0.8, finite(runtime.slamHalfAngle, 1.08))),
      range = Math.max(0.1, finite(runtime.slamRange, 4.4));
    if (Math.abs(angle - sector.angle) > 1e-6) {
      sector.fill.geometry.dispose();
      sector.outline.geometry.dispose();
      sector.fill.geometry = sectorGeometry(angle);
      sector.outline.geometry = sectorGeometry(angle, true);
      sector.angle = angle;
    }
    sector.group.position.set(x, 0.065, z);
    sector.group.rotation.y = heading;
    sector.group.scale.set(range + playerRadius * 0.3, 1, range + playerRadius * 0.3);
    sector.group.visible = runtime.active !== false && (wind || strike);
    m.warning.opacity = strike ? 0.28 * (1 - progress) : 0.14 + 0.16 * progress;
    m.outline.opacity = strike ? 1 - progress * 0.65 : 0.65 + 0.3 * progress;
    group.userData.slamRange = range;
    group.userData.slamHalfAngle = angle;
  } else {
    const cap = state.cap;
    cap.position.y = 0.7 - (recover ? 0.035 : 0) + expression.capLift;
    cap.rotation.set(
      defeat ? defeat * 0.8 : recover ? -0.16 : pulse ? 0.035 * Math.sin(progress * Math.PI) : 0,
      0,
      hurt ? 0.035 * Math.sin(timer * 30) : 0,
    );
    cap.scale.set(
      wind ? 1 + 0.1 * progress : pulse ? 1.08 : 1,
      wind ? 1 - 0.06 * progress : pulse ? 0.94 : 1,
      wind ? 1 + 0.1 * progress : pulse ? 1.08 : 1,
    );
    state.annulus.position.set(x, 0.074, z);
    state.annulus.visible = runtime.active !== false && wind;
    m.outline.opacity = 0.55 + 0.4 * Math.sin(time * 7) ** 2;
    const visibleRings = [];
    for (let i = 0; i < 2; i++) {
      const ring = state.rings[i],
        data = runtime.rings?.[i],
        r = Math.max(0, finite(data?.radius)),
        width = Math.max(0.01, finite(data?.width, 0.15)),
        maxRadius = Math.max(0.1, finite(data?.maxRadius, 9));
      ring.visible = !!data && r > 0 && r <= maxRadius + width;
      if (!ring.visible) continue;
      ring.position.set(x, 0.11, z);
      const a = ring.geometry.attributes.position,
        tube = width / 2 + playerRadius * 0.3;
      for (let j = 0; j <= 6; j++)
        for (let k = 0; k <= 64; k++) {
          const u = (k * TAU) / 64,
            v = (j * TAU) / 6,
            d = r + Math.cos(v) * tube;
          a.setXYZ(j * 65 + k, Math.cos(u) * d, -Math.sin(v) * tube, Math.sin(u) * d);
        }
      a.needsUpdate = true;
      ring.geometry.boundingSphere = new T.Sphere(new T.Vector3(), r + tube);
      ring.geometry.boundingBox = new T.Box3(
        new T.Vector3(-r - tube, -tube, -r - tube),
        new T.Vector3(r + tube, tube, r + tube),
      );
      ring.material.opacity = 0.88 * (1 - 0.65 * clamp((r / maxRadius - 0.85) / 0.15));
      visibleRings.push({ radius: r, width, y: 0.11 });
    }
    group.userData.rings = visibleRings;
    m.gills.emissiveIntensity = recover ? 1.3 : wind ? 1 + progress : 0.8;
  }
  spores.visible = (kind === 'spore' && wind) || phase === 'defeated';
  m.spores.opacity = phase === 'defeated' ? 1 - defeat : 0.65 + 0.3 * progress;
  m.spores.color.set(phase === 'defeated' ? '#c6badb' : '#f1c76b');
  for (let i = 0; i < 8; i++) {
    const a = (i * TAU) / 8 + time * 0.8,
      r = phase === 'defeated' ? 0.35 + defeat * 0.48 : 0.5 - 0.15 * progress;
    object.position.set(
      x + Math.sin(a) * r,
      0.65 + Math.sin(a * 2) * 0.12 + (phase === 'defeated' ? defeat * 0.4 : progress * 0.12),
      z + Math.cos(a) * r,
    );
    object.rotation.set(time + i, 0.3 * i, time * 0.5);
    object.scale.setScalar(phase === 'defeated' ? Math.max(0.01, 1 - defeat) : 1);
    object.updateMatrix();
    spores.setMatrixAt(i, object.matrix);
  }
  spores.instanceMatrix.needsUpdate = true;
  group.userData.phase = phase;
  group.userData.bodyVisible = actor.visible;
  group.userData.warningVisible = kind === 'seed' ? state.sector.group.visible : state.annulus.visible;
  group.userData.returning = !!runtime.returning;
  return group;
}
