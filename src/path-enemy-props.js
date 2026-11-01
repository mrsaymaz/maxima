import { enemyExpression } from './combat-expression.js';
import { yieldPose } from './enemy-yield.js';
import { surfaceMaterial, assignSurfaceRoles, replaceCueMaterials } from './surface-materials.js';
import { bevelBox, carvedCylinder } from './prop-art.js';
import { makeEnemySpecies, updateEnemySpecies } from './enemy-species.js';
import * as T from './vendor/three.module.min.js';

const STATES = new WeakMap();
const clamp = n => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
const finite = (n, fallback) => (Number.isFinite(n) ? n : fallback);
const PALETTES = [
  ['#8a8574', '#b2ab94', '#5c594d', '#5f8955'],
  ['#a39a82', '#cfc4a6', '#6d6555', '#6f9b82'],
  ['#7b7d92', '#b6b2be', '#4f536b', '#7d8b92'],
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
    const out = batches.get(o.material);
    for (const v of geo.attributes.position.array) out.p.push(v);
    for (const v of geo.attributes.normal.array) out.n.push(v);
    geo.dispose();
  });
  root.clear();
  for (const [material, data] of batches) {
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(data.p, 3));
    geo.setAttribute('normal', new T.Float32BufferAttribute(data.n, 3));
    const mesh = new T.Mesh(geo, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
  }
}

export function makePathEnemy(section) {
  if (!section?.enemy) throw new Error('Path enemy section requires enemy data');
  const group = new T.Group();
  group.name = 'path-enemy-rumblebud';
  const enemy = section.enemy,
    palette = PALETTES[section.area] || PALETTES[0],
    cache = new Map();
  const mat = (color, extra = {}) => surfaceMaterial('stone', color, extra);
  const m = {
    stone: mat(palette[0]),
    layer: mat(palette[1]),
    deep: mat(palette[2]),
    moss: mat(palette[3]),
    amber: mat('#edb85d', { emissive: '#bc792c', emissiveIntensity: 0.48, roughness: 0.35 }),
    glint: mat('#fff0bb', { emissive: '#f9dda1', emissiveIntensity: 0.32 }),
    gate: mat(palette[0]),
    gatePale: mat(palette[1]),
    gateDark: mat(palette[2]),
    gateGlow: mat('#a6bd8c', { emissive: '#658d5e', emissiveIntensity: 0.35 }),
    lane: mat('#efb655', {
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      emissive: '#e5a23d',
      emissiveIntensity: 0.5,
    }),
    laneMark: mat('#ffbd57', {
      transparent: true,
      opacity: 0.86,
      depthWrite: false,
      emissive: '#df9e3a',
      emissiveIntensity: 0.6,
    }),
    pips: mat('#fff0bd', { emissive: '#af8b39', emissiveIntensity: 0.35 }),
    stars: mat('#e9cc7d', { emissive: '#c09e42', emissiveIntensity: 0.3 }),
  };
  assignSurfaceRoles(m, {
    stone: ['stone', 'layer', 'deep', 'gate', 'gatePale', 'gateDark'],
    foliage: ['moss'],
    effect: ['amber', 'glint', 'gateGlow', 'pips', 'stars'],
    cue: ['lane', 'laneMark'],
  });
  replaceCueMaterials(m, ['lane', 'laneMark']);
  const geo = (key, fn) => {
    if (!cache.has(key)) cache.set(key, fn());
    return cache.get(key);
  };
  const box = (w, h, d) => geo(`b${w},${h},${d}`, () => bevelBox(w, h, d));
  const pebble = r => geo('p' + r, () => new T.DodecahedronGeometry(r, 0));
  const ball = r => geo('s' + r, () => new T.SphereGeometry(r, 10, 6));
  const cone = (r, h) => geo(`c${r},${h}`, () => new T.ConeGeometry(r, h, 5));
  const mesh = (geometry, material, x = 0, y = 0, z = 0, parent = group) => {
    const o = new T.Mesh(geometry, material);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  };
  const actor = new T.Group();
  actor.name = 'rumblebud-actor';
  group.add(actor);
  const body = new T.Group();
  body.name = 'rumblebud-body';
  body.position.y = 0.19;
  actor.add(body);
  const fixedBody = new T.Group();
  fixedBody.name = 'layered-pebble-body';
  body.add(fixedBody);
  const core = mesh(pebble(0.36), m.stone, 0, 0.24, -0.045, fixedBody);
  core.scale.set(1.13, 0.88, 1.07);
  core.rotation.y = 0.25;
  const saddle = mesh(pebble(0.3), m.layer, 0, 0.38, -0.09, fixedBody);
  saddle.scale.set(1.03, 0.66, 0.95);
  saddle.rotation.set(0.12, -0.25, 0.1);
  const face = mesh(pebble(0.28), m.layer, 0, 0.32, 0.225, fixedBody);
  face.scale.set(1.08, 0.86, 0.7);
  for (const side of [-1, 1]) {
    const cheek = mesh(pebble(0.13), m.stone, side * 0.27, 0.25, 0.21, fixedBody);
    cheek.scale.set(0.8, 0.83, 0.76);
    const socket = mesh(ball(0.092), m.deep, side * 0.133, 0.365, 0.401, fixedBody);
    socket.scale.set(1, 0.79, 0.35);
    const eye = mesh(ball(0.072), m.amber, side * 0.133, 0.365, 0.428, fixedBody);
    eye.scale.set(0.85, 0.92, 0.27);
    const pupil = mesh(ball(0.027), m.deep, side * 0.133, 0.367, 0.449, fixedBody);
    pupil.scale.set(0.65, 1.12, 0.38);
    mesh(ball(0.013), m.glint, side * 0.133 - 0.018, 0.392, 0.455, fixedBody).scale.z = 0.3;
  }
  // A small upturned mouth keeps the rival readable as a creature, not a hazard block.
  for (const side of [-1, 1]) {
    const smile = mesh(box(0.067, 0.017, 0.018), m.deep, side * 0.03, 0.248, 0.412, fixedBody);
    smile.rotation.z = side * 0.28;
  }
  for (let i = 0; i < 3; i++) {
    const tuft = mesh(
      cone(0.072, 0.19),
      m.moss,
      (i - 1) * 0.088,
      0.62 + (i === 1 ? 0.025 : 0),
      -0.105 + (i % 2) * 0.025,
      fixedBody,
    );
    tuft.rotation.z = (i - 1) * -0.23;
  }
  for (const side of [-1, 1]) {
    const moss = mesh(pebble(0.075), m.moss, side * 0.22, 0.48, -0.17, fixedBody);
    moss.scale.set(1, 0.36, 0.85);
  }
  merge(fixedBody);
  const brows = new T.InstancedMesh(box(0.135, 0.031, 0.035), m.deep, 2);
  brows.name = 'expressive-brows';
  body.add(brows);
  const legTemplate = new T.Group();
  mesh(pebble(0.105), m.deep, 0, 0, 0, legTemplate);
  mesh(new T.CylinderGeometry(0.05, 0.066, 0.2, 6), m.deep, 0, 0.08, 0, legTemplate);
  merge(legTemplate);
  const legs = new T.InstancedMesh(legTemplate.children[0].geometry, m.deep, 4);
  legs.name = 'four-pebble-legs';
  actor.add(legs);
  legs.castShadow = true;
  const maxPips = Math.max(1, Math.min(9, Math.round(finite(enemy.maxHp, 3)))),
    pips = new T.InstancedMesh(ball(0.027), m.pips, maxPips);
  pips.name = 'world-health-pips';
  pips.frustumCulled = false;
  group.add(pips);
  const stars = new T.InstancedMesh(new T.OctahedronGeometry(0.045, 0), m.stars, 3);
  stars.name = 'recovery-stars';
  actor.add(stars);
  stars.frustumCulled = false;

  const gate = new T.Group();
  gate.name = 'rumblebud-stone-arch';
  gate.visible = !enemy.ordinal;
  const gateS = finite(enemy.gateS, finite(enemy.s, section.length * 0.7));
  gate.position.set(section.start.x + section.forward.x * gateS, 0, section.start.z + section.forward.z * gateS);
  gate.rotation.y = Math.atan2(-section.right.z, section.right.x);
  group.add(gate);
  const gateFixed = new T.Group();
  gateFixed.name = 'arch-frame';
  gate.add(gateFixed);
  for (const side of [-1, 1]) {
    mesh(carvedCylinder(0.22, 0.3, 2.9, 7), m.gate, side * 2.9, 1.45, 0, gateFixed);
    mesh(box(0.56, 0.17, 0.62), m.gatePale, side * 2.9, 0.1, 0, gateFixed);
    const cap = mesh(pebble(0.24), m.gateGlow, side * 2.9, 3.01, 0, gateFixed);
    cap.scale.y = 0.5;
  }
  for (let i = 0; i < 7; i++) {
    const x = (i - 3) * 0.8,
      arch = mesh(box(0.84, 0.26, 0.48), m.gatePale, x, 3.04 + 0.17 * (1 - (x / 2.4) ** 2), 0, gateFixed);
    arch.rotation.z = -x * 0.045;
  }
  merge(gateFixed);
  const bars = new T.Group();
  bars.name = 'descending-gate-bars';
  gate.add(bars);
  for (let i = 0; i < 9; i++) mesh(box(0.18, 2.85, 0.19), m.gateDark, (i - 4) * 0.65, 1.425, 0, bars);
  for (const y of [0.55, 1.42, 2.3]) mesh(box(5.7, 0.13, 0.23), m.gateDark, 0, y, 0, bars);
  for (let i = 0; i < 3; i++) {
    const rune = mesh(new T.OctahedronGeometry(0.12, 0), m.gateGlow, (i - 1) * 1.3, 1.42, 0.16, bars);
    rune.scale.set(0.72, 1.35, 0.35);
  }
  merge(bars);

  const caps = new T.InstancedMesh(new T.CircleGeometry(1, 24).rotateX(-Math.PI / 2), m.lane, 2);
  caps.name = 'charge-end-caps';
  group.add(caps);
  const lane = mesh(box(1.4, 0.006, 1), m.lane);
  lane.name = 'amber-charge-lane';
  lane.castShadow = false;
  const arrowTemplate = new T.Group();
  for (const side of [-1, 1]) {
    const bit = mesh(box(0.075, 0.007, 0.4), m.laneMark, side * 0.12, 0, -0.01, arrowTemplate);
    bit.rotation.y = -side * 0.65;
  }
  merge(arrowTemplate);
  const arrows = new T.InstancedMesh(arrowTemplate.children[0].geometry, m.laneMark, 3);
  arrows.name = 'charge-direction-chevrons';
  arrows.frustumCulled = false;
  group.add(arrows);
  const laneEdges = new T.InstancedMesh(box(0.04, 0.008, 1), m.laneMark, 2);
  laneEdges.name = 'charge-lane-boundaries';
  laneEdges.frustumCulled = false;
  group.add(laneEdges);
  const species = enemy.kind && enemy.kind !== 'ram' ? makeEnemySpecies(section) : null;
  if (species) group.add(species);
  const opening = mesh(new T.OctahedronGeometry(0.13, 0), m.glint);
  opening.name = 'attack-opening-diamond';
  const object = new T.Object3D(),
    bodyMaterials = [m.stone, m.layer, m.deep, m.moss],
    baseColors = bodyMaterials.map(material => material.color.clone());
  group.userData = {
    id: enemy.id,
    creature: enemy.name || 'Rumblebud',
    radius: enemy.radius || 0.58,
    height: species ? 1.08 : 1.0,
    maxPips,
    gateWidth: 6.4,
    gateOpen: 0,
    phase: 'watch',
    worldCoordinates: true,
    drawMeshes: 0,
    triangles: 0,
  };
  STATES.set(group, {
    section,
    enemy,
    species,
    actor,
    body,
    brows,
    legs,
    pips,
    stars,
    gate,
    bars,
    lane,
    caps,
    arrows,
    laneEdges,
    m,
    object,
    opening,
    bodyMaterials,
    baseColors,
    gateOpen: 0,
  });
  updatePathEnemy(
    group,
    {
      ...enemy,
      heading: Math.atan2(-section.forward.x, -section.forward.z),
      phase: 'watch',
      timer: 0,
      duration: 1,
      hp: enemy.maxHp,
      maxHp: enemy.maxHp,
      active: false,
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

export function updatePathEnemy(group, runtime, { time = 0, playerRadius = 0 } = {}) {
  const state = STATES.get(group);
  if (!state || !runtime) return group;
  time = finite(time, 0);
  const {
      section,
      enemy,
      species,
      actor,
      body,
      brows,
      legs,
      pips,
      stars,
      bars,
      lane,
      caps,
      arrows,
      laneEdges,
      m,
      object,
      opening,
      bodyMaterials,
      baseColors,
    } = state,
    phase = runtime.phase || 'watch',
    timer = Math.max(0, finite(runtime.timer, 0)),
    duration = Math.max(0.001, finite(runtime.duration, 1)),
    progress = clamp(timer / duration),
    defeat = phase === 'defeated' ? clamp(timer / 1.1) : 0;
  const x = finite(runtime.x, enemy.x),
    z = finite(runtime.z, enemy.z),
    heading = finite(runtime.heading, 0),
    wind = phase === 'windup',
    charging = phase === 'charge',
    recover = phase === 'recover',
    hurt = phase === 'hurt';
  const expression = enemyExpression(runtime, time);
  const yielding = yieldPose('ram', timer);
  const crouch = wind ? Math.sin((progress * Math.PI) / 2) : 0,
    bounce = charging
      ? Math.abs(Math.sin(time * 26)) * 0.027
      : recover
        ? Math.sin(time * 8) * 0.008
        : Math.sin(time * 2.7) * 0.007;
  actor.position.set(
    x + (section.right.x * 0.43 - section.forward.x * 0.1) * defeat,
    0.028 + bounce,
    z + (section.right.z * 0.43 - section.forward.z * 0.1) * defeat,
  );
  if (phase === 'defeated') {
    actor.position.x = x + section.right.x * yielding.side - section.forward.x * yielding.back;
    actor.position.z = z + section.right.z * yielding.side - section.forward.z * yielding.back;
  }
  actor.rotation.set(0, heading + (phase === 'defeated' ? yielding.yaw : 0), 0);
  actor.scale.setScalar(1);
  actor.visible = phase !== 'defeated' || defeat < 1;
  body.position.set(0, 0.19 - 0.09 * crouch, 0);
  body.scale.set(1 + 0.06 * crouch, 1 - 0.12 * crouch, 1 + 0.04 * crouch);
  body.rotation.set(
    phase === 'defeated' ? yielding.pitch : charging ? 0.13 : wind ? -0.06 : recover ? Math.sin(time * 8) * 0.018 : 0,
    0,
    hurt ? Math.sin(timer * 40) * 0.055 : 0,
  );
  if (phase !== 'defeated') {
    body.rotation.x += expression.pitch;
    body.rotation.z += expression.roll;
    body.position.x += expression.recoilX;
    body.position.z += expression.recoilZ;
  }
  for (let i = 0; i < 4; i++) {
    const side = i % 2 ? 1 : -1,
      front = i < 2 ? 1 : -1,
      cycle = time * (charging ? 22 : runtime.returning ? 10 : 4) + (i % 2 === Math.floor(i / 2) ? 0 : Math.PI);
    object.position.set(
      side * 0.265,
      0.105 + (charging || runtime.returning ? Math.max(0, Math.sin(cycle)) * 0.035 : 0) - crouch * 0.022,
      front * 0.225,
    );
    object.rotation.set(charging || runtime.returning ? Math.sin(cycle) * 0.33 : 0, side * 0.14, side * 0.08);
    object.scale.set(0.87, 1.02 - crouch * 0.22, 0.91);
    object.updateMatrix();
    legs.setMatrixAt(i, object.matrix);
  }
  legs.instanceMatrix.needsUpdate = true;
  for (let i = 0; i < 2; i++) {
    const side = i ? 1 : -1;
    object.position.set(side * 0.133, 0.459, 0.43);
    object.rotation.set(0, 0, side * (hurt ? -0.1 : expression.blink ? 0.38 : wind ? -0.24 : recover ? 0.18 : 0.045));
    object.scale.set(1, 1, 1);
    object.updateMatrix();
    brows.setMatrixAt(i, object.matrix);
  }
  brows.instanceMatrix.needsUpdate = true;
  const flash = clamp(finite(runtime.flash, 0));
  for (let i = 0; i < bodyMaterials.length; i++) {
    bodyMaterials[i].color.copy(baseColors[i]).lerp(new T.Color('#fff5db'), flash * 0.45);
    bodyMaterials[i].emissive.set(flash > 0 ? '#d1a46a' : '#000000');
    bodyMaterials[i].emissiveIntensity = flash * 0.45;
  }
  m.amber.emissiveIntensity = wind ? 0.72 + progress * 0.55 : charging ? 0.95 : 0.48;
  const hp = clamp(
    finite(runtime.hp, finite(runtime.maxHp, enemy.maxHp)) / Math.max(1, finite(runtime.maxHp, enemy.maxHp)),
  );
  pips.visible = phase !== 'defeated';
  for (let i = 0; i < pips.count; i++) {
    object.position.set(x + (i - (pips.count - 1) / 2) * 0.087, 0.97, z);
    object.rotation.set(0, 0, 0);
    object.scale.setScalar(1);
    object.updateMatrix();
    pips.setMatrixAt(i, object.matrix);
    pips.setColorAt(i, new T.Color(i < hp * pips.count ? '#edc16a' : '#536251'));
  }
  pips.instanceMatrix.needsUpdate = true;
  if (pips.instanceColor) pips.instanceColor.needsUpdate = true;
  stars.visible = recover;
  for (let i = 0; i < 3; i++) {
    const angle = time * 2.2 + (i * Math.PI * 2) / 3;
    object.position.set(Math.cos(angle) * 0.27, 0.875 + Math.sin(angle * 2) * 0.018, Math.sin(angle) * 0.27);
    object.rotation.set(0.2, time + i, Math.PI / 4);
    object.scale.setScalar(1);
    object.updateMatrix();
    stars.setMatrixAt(i, object.matrix);
  }
  stars.instanceMatrix.needsUpdate = true;
  const from = runtime.chargeFrom,
    to = runtime.chargeTo,
    showLane =
      runtime.active !== false &&
      (wind || charging) &&
      from &&
      to &&
      [from.x, from.z, to.x, to.z].every(Number.isFinite);
  lane.visible = !!showLane;
  caps.visible = !!showLane;
  arrows.visible = !!showLane;
  laneEdges.visible = !!showLane;
  if (showLane) {
    const radius = (runtime.spec?.radius || enemy.radius || 0.58) + playerRadius * 0.7;
    [from, to].forEach((p, i) => {
      object.position.set(p.x, 0.041, p.z);
      object.rotation.set(0, 0, 0);
      object.scale.setScalar(radius);
      object.updateMatrix();
      caps.setMatrixAt(i, object.matrix);
    });
    caps.instanceMatrix.needsUpdate = true;
    const dx = to.x - from.x,
      dz = to.z - from.z,
      len = Math.hypot(dx, dz),
      yaw = Math.atan2(dx, dz);
    lane.position.set((from.x + to.x) / 2, 0.041, (from.z + to.z) / 2);
    lane.rotation.set(0, yaw, 0);
    lane.scale.set(
      (2 * ((runtime.spec?.radius || enemy.radius || 0.58) + playerRadius * 0.7)) / 1.4,
      1,
      Math.max(0.001, len),
    );
    m.lane.opacity = wind ? 0.16 + 0.2 * progress : 0.12;
    m.laneMark.opacity = wind ? 0.5 + 0.42 * progress : 0.62;
    for (let i = 0; i < 3; i++) {
      const t = (i + 1) / 4;
      object.position.set(from.x + dx * t, 0.047, from.z + dz * t);
      object.rotation.set(0, yaw, 0);
      object.scale.setScalar(1);
      object.updateMatrix();
      arrows.setMatrixAt(i, object.matrix);
    }
    arrows.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < 2; i++) {
      const offset = (i ? 1 : -1) * ((runtime.spec?.radius || enemy.radius || 0.58) + playerRadius * 0.7);
      object.position.set(
        (from.x + to.x) / 2 + Math.cos(yaw) * offset,
        0.046,
        (from.z + to.z) / 2 - Math.sin(yaw) * offset,
      );
      object.rotation.set(0, yaw, 0);
      object.scale.set(1, 1, len);
      object.updateMatrix();
      laneEdges.setMatrixAt(i, object.matrix);
    }
    laneEdges.instanceMatrix.needsUpdate = true;
  }
  if (runtime.groupCleared === true) state.gateOpen = Math.max(state.gateOpen, clamp(runtime.groupTimer / 0.9));
  else if (runtime.groupCleared === undefined && phase === 'defeated')
    state.gateOpen = Math.max(state.gateOpen, clamp(timer / 0.9));
  const open = state.gateOpen,
    smooth = open * open * (3 - 2 * open);
  bars.scale.y = Math.max(0.001, 1 - smooth);
  bars.visible = open < 1;
  m.gateGlow.color.set(open === 1 ? '#b8d99d' : '#a6bd8c');
  m.gateGlow.emissiveIntensity = 0.35 + open * 0.35;
  const canOpen = recover || hurt || (enemy.kind === 'spore' && phase === 'sporewindup' && runtime.cycles > 0);
  opening.visible = canOpen;
  const rear = enemy.kind === 'seed' ? -1 : 0;
  opening.position.set(x + Math.sin(heading) * rear, 1.2 + Math.sin(time * 5) * 0.035, z + Math.cos(heading) * rear);
  opening.rotation.y = time;
  group.userData.openingVisible = !!canOpen;
  group.userData.chargeHalfWidth = (runtime.spec?.radius || enemy.radius || 0.58) + playerRadius * 0.7;
  group.userData.phase = phase;
  group.userData.gateOpen = open;
  group.userData.bodyVisible = actor.visible;
  group.userData.healthFraction = hp;
  group.userData.laneVisible = !!showLane;
  if (species) {
    actor.visible = false;
    pips.position.y = 0.22;
    lane.visible = false;
    caps.visible = false;
    arrows.visible = false;
    laneEdges.visible = false;
    group.userData.laneVisible = false;
    updateEnemySpecies(species, runtime, { time, playerRadius });
  }
  return group;
}
