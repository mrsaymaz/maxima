import * as T from './vendor/three.module.min.js';

// A small local wildlife vignette. The caller places this root on a basin ledge.
// No simulation state, rewards, collision or save data leave this object.
const PALETTES = [
  ['#56786c', '#a6bea0', '#947757'],
  ['#587f80', '#bed0b1', '#887c65'],
  ['#67728b', '#bdc3bd', '#8e7d78'],
];
const ENTRY_X = -0.54,
  ENTRY_Z = 0.25,
  DRINK_X = 0.09,
  DRINK_Z = -0.09;
const smooth = t => t * t * (3 - 2 * t);
const bounded = n => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));

function batch(root) {
  root.updateMatrixWorld(true);
  const inverse = root.matrixWorld.clone().invert(),
    parts = new Map();
  root.traverse(o => {
    if (!o.isMesh) return;
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    g.applyMatrix4(inverse.clone().multiply(o.matrixWorld));
    if (!parts.has(o.material)) parts.set(o.material, { p: [], n: [] });
    const a = parts.get(o.material);
    for (const v of g.attributes.position.array) a.p.push(v);
    for (const v of g.attributes.normal.array) a.n.push(v);
    g.dispose();
  });
  root.clear();
  for (const [material, a] of parts) {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(a.p, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(a.n, 3));
    const o = new T.Mesh(g, material);
    o.castShadow = true;
    o.receiveShadow = true;
    root.add(o);
  }
}

export function makeSpringVisitor(area = 0) {
  const palette = PALETTES[area] || PALETTES[0],
    root = new T.Group(),
    actor = new T.Group(),
    body = new T.Group(),
    head = new T.Group();
  root.name = 'spring-visitor';
  actor.name = 'visitor-position';
  body.name = 'visitor-body';
  head.name = 'visitor-head';
  root.add(actor);
  actor.add(body, head);
  body.position.y = 0.16;
  head.position.set(0, 0.245, 0.19);
  const mat = (color, extra = {}) => new T.MeshStandardMaterial({ color, roughness: 0.88, ...extra });
  const m = {
    body: mat(palette[0]),
    leaf: mat(palette[1]),
    seed: mat(palette[2]),
    seam: mat('#d6bd84'),
    face: mat('#d8d5b3'),
    dark: mat('#263f39'),
    eye: mat('#dab26c', { roughness: 0.45 }),
    glint: mat('#f5eed0'),
    water: mat('#accfc0', { transparent: true, opacity: 0.36, depthWrite: false, roughness: 0.4 }),
  };
  const ball = new T.SphereGeometry(1, 12, 8),
    footGeo = new T.SphereGeometry(0.065, 9, 6),
    budGeo = new T.ConeGeometry(0.035, 0.08, 5),
    cache = new Map();
  const box = (x, y, z) => {
    const k = x + ',' + y + ',' + z;
    if (!cache.has(k)) cache.set(k, new T.BoxGeometry(x, y, z));
    return cache.get(k);
  };
  const mesh = (geo, material, x, y, z, parent) => {
    const o = new T.Mesh(geo, material);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  };
  const round = (material, x, y, z, sx, sy, sz, parent) => {
    const o = mesh(ball, material, x, y, z, parent);
    o.scale.set(sx, sy, sz);
    return o;
  };
  round(m.body, 0, 0.035, 0, 0.195, 0.145, 0.217, body);
  round(m.seed, 0, 0.14, -0.018, 0.206, 0.123, 0.236, body);
  const seam = new T.CatmullRomCurve3([
    new T.Vector3(0, 0.17, -0.24),
    new T.Vector3(0, 0.257, -0.12),
    new T.Vector3(0, 0.269, 0),
    new T.Vector3(0, 0.21, 0.19),
  ]);
  mesh(new T.TubeGeometry(seam, 16, 0.009, 5, false), m.seam, 0, 0, 0, body);
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * 0.055,
      o = mesh(budGeo, m.leaf, x, 0.294, -0.07 + (i % 2) * 0.03, body);
    o.rotation.z = -(i - 1) * 0.25;
  }
  for (const side of [-1, 1]) {
    round(m.leaf, side * 0.16, 0.17, -0.12, 0.046, 0.018, 0.077, body).rotation.y = side * 0.5;
  }
  batch(body);
  round(m.body, 0, 0, 0.035, 0.139, 0.113, 0.137, head);
  round(m.face, 0, -0.028, 0.145, 0.068, 0.044, 0.078, head);
  for (const side of [-1, 1]) {
    round(m.eye, side * 0.078, 0.025, 0.139, 0.037, 0.043, 0.018, head);
    round(m.dark, side * 0.078, 0.027, 0.155, 0.019, 0.027, 0.009, head);
    round(m.glint, side * 0.078 - 0.009, 0.041, 0.163, 0.007, 0.009, 0.004, head);
    round(m.dark, side * 0.027, -0.015, 0.217, 0.009, 0.006, 0.005, head);
    const smile = mesh(box(0.038, 0.008, 0.009), m.dark, side * 0.018, -0.056, 0.204, head);
    smile.rotation.z = side * 0.15;
  }
  batch(head);
  const feet = [];
  for (let i = 0; i < 4; i++) {
    const foot = new T.Group();
    foot.name = 'visitor-foot-' + i;
    foot.position.set(i % 2 ? 0.135 : -0.135, 0.075, i < 2 ? 0.135 : -0.135);
    actor.add(foot);
    const o = mesh(footGeo, m.dark, 0, -0.01, 0, foot);
    o.scale.set(0.7, 0.8, 1.05);
    feet.push(foot);
  }
  const ripples = [];
  for (let i = 0; i < 2; i++) {
    const o = mesh(
      new T.TorusGeometry(0.065 + i * 0.035, 0.003, 4, 24),
      m.water,
      DRINK_X,
      0.104,
      DRINK_Z - 0.405,
      root,
    );
    o.rotation.x = Math.PI / 2;
    o.castShadow = false;
    o.visible = false;
    ripples.push(o);
  }
  root.userData = {
    kind: 'spring-wildlife',
    species: 'Spriglet',
    area,
    solids: [],
    drinkPoint: { x: DRINK_X, y: 0.104, z: DRINK_Z - 0.405 },
    placementRadius: 0.95,
  };
  const state = {
    phase: 'hidden',
    phaseTime: 0,
    elapsed: 0,
    restored: 0,
    initialized: false,
    reduced: false,
    near: false,
    threat: false,
    positionX: ENTRY_X,
    positionZ: ENTRY_Z,
    heading: Math.PI,
    headPitch: 0,
    headYaw: 0,
    transitions: 0,
  };
  let fromX = ENTRY_X,
    fromZ = ENTRY_Z;
  const enter = phase => {
    state.phase = phase;
    state.phaseTime = 0;
    state.transitions++;
    if (phase === 'approach' || phase === 'withdraw') {
      fromX = state.positionX;
      fromZ = state.positionZ;
    }
  };
  const duration = phase =>
    phase === 'approach'
      ? 1.65
      : phase === 'drink'
        ? 2.8
        : phase === 'look'
          ? 1.35
          : phase === 'rest'
            ? 5.0
            : phase === 'withdraw'
              ? 1.15
              : phase === 'shelter'
                ? 1.1
                : Infinity;
  const phasePose = () => {
    const phase = state.phase,
      t = state.phaseTime,
      quiet = state.reduced,
      walking = phase === 'approach' || phase === 'withdraw';
    let x = DRINK_X,
      z = DRINK_Z,
      heading = Math.PI;
    if (phase === 'hidden' || phase === 'curious' || phase === 'shelter') {
      x = ENTRY_X;
      z = ENTRY_Z;
      heading = 2.5;
    }
    if (phase === 'approach' || phase === 'withdraw') {
      const p = smooth(Math.min(1, t / duration(phase))),
        tx = phase === 'approach' ? DRINK_X : ENTRY_X,
        tz = phase === 'approach' ? DRINK_Z : ENTRY_Z;
      x = fromX + (tx - fromX) * p;
      z = fromZ + (tz - fromZ) * p;
      heading = Math.atan2(tx - fromX, tz - fromZ);
      if (phase === 'approach') heading += (Math.PI - heading) * smooth(Math.max(0, (p - 0.6) / 0.4));
    }
    actor.position.set(x, 0, z);
    actor.rotation.y = heading;
    body.rotation.set(
      quiet ? 0 : Math.sin(state.elapsed * 2.4) * 0.003,
      0,
      quiet ? 0 : Math.sin(state.elapsed * 2.0) * 0.003,
    );
    let pitch =
      phase === 'drink'
        ? 0.66 * smooth(Math.min(1, t / 0.5))
        : phase === 'look'
          ? -0.075
          : phase === 'shelter'
            ? -0.025
            : phase === 'curious'
              ? -0.035
              : 0.02;
    let yaw = phase === 'look' ? -0.48 : phase === 'curious' && state.near ? -0.3 : 0;
    if (!quiet && phase === 'drink') pitch += Math.sin(state.elapsed * 5.5) * 0.018;
    if (!quiet && phase === 'curious') yaw += Math.sin(state.elapsed * 1.2) * 0.055;
    head.rotation.set(pitch, yaw, 0);
    for (let i = 0; i < 4; i++) {
      const foot = feet[i],
        cycle = t * 8 + (i === 0 || i === 3 ? 0 : Math.PI),
        lift = walking && !quiet ? Math.max(0, Math.sin(cycle)) * 0.022 : 0;
      foot.position.y = 0.075 + lift;
      foot.rotation.x = walking && !quiet ? Math.sin(cycle) * 0.12 : 0;
    }
    for (let i = 0; i < 2; i++) {
      const ripple = ripples[i];
      ripple.visible = phase === 'drink' && !quiet;
      const wave = (state.elapsed * 0.7 + i * 0.5) % 1;
      ripple.scale.setScalar(0.85 + wave * 0.6);
    }
    root.visible = phase !== 'hidden';
    state.positionX = x;
    state.positionZ = z;
    state.heading = heading;
    state.headPitch = pitch;
    state.headYaw = yaw;
  };
  const update = (
    dt,
    { restored = 0, active = true, reduced = false, playerDistance = 20, threat = false, noticeRadius = 2.8 } = {},
  ) => {
    if (!active) return state;
    const r = bounded(restored),
      near = Number.isFinite(playerDistance) && playerDistance < (Number.isFinite(noticeRadius) ? noticeRadius : 2.8),
      first = !state.initialized,
      previous = state.restored,
      wasNear = state.near;
    state.initialized = true;
    state.restored = r;
    state.near = near;
    state.threat = !!threat;
    state.reduced = !!reduced;
    if (r === 0) {
      if (state.phase !== 'hidden') enter('hidden');
      state.phaseTime = 0;
      phasePose();
      return state;
    }
    if (first) {
      enter(threat ? 'shelter' : r === 1 ? 'rest' : 'curious');
    } else if (reduced) {
      const phase = threat ? 'shelter' : r === 1 ? 'rest' : 'curious';
      if (state.phase !== phase) enter(phase);
    } else if (threat && state.phase !== 'withdraw' && state.phase !== 'shelter') enter('withdraw');
    else if (previous < 1 && r === 1 && !threat) enter('approach');
    else if (r < 1 && state.phase !== 'curious' && state.phase !== 'withdraw' && state.phase !== 'shelter')
      enter('curious');
    else if (near && !wasNear && r === 1 && state.phase === 'rest' && !threat) enter('look');
    if (reduced) {
      state.phaseTime = 0;
      phasePose();
      return state;
    }
    let remaining = Number.isFinite(dt) && dt > 0 ? Math.min(dt, 30) : 0;
    state.elapsed += remaining;
    // Process complete phase boundaries, retaining remaining time for deterministic
    // results at different frame rates. Indefinite phases do not loop transitions.
    for (let n = 0; n < 32 && remaining > 0; n++) {
      const phase = state.phase,
        d = duration(phase);
      if (phase === 'hidden' || phase === 'curious' || (phase === 'shelter' && threat)) {
        state.phaseTime += remaining;
        remaining = 0;
        break;
      }
      const step = Math.min(remaining, Math.max(0, d - state.phaseTime));
      state.phaseTime += step;
      remaining -= step;
      if (state.phaseTime < d) break;
      // Capture the exact completed movement endpoint before the next phase.
      phasePose();
      if (phase === 'approach') enter('drink');
      else if (phase === 'drink') enter(near ? 'look' : 'rest');
      else if (phase === 'look') enter('rest');
      else if (phase === 'rest') enter('drink');
      else if (phase === 'withdraw') enter('shelter');
      else if (phase === 'shelter') enter(r === 1 ? 'approach' : 'curious');
    }
    phasePose();
    return state;
  };
  root.visible = false;
  phasePose();
  return { root, update, state };
}
