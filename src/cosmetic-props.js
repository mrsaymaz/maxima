import { surfaceMaterial } from './surface-materials.js';
import * as T from './vendor/three.module.min.js';
// Low-poly 3D cosmetics and the run reward chest, built from primitives so no extra downloads are needed.
const mat = (color, { kind = 'fabric', ...opts } = {}) => surfaceMaterial(kind, color, opts);
function add(parent, geometry, material, x = 0, y = 0, z = 0) {
  const m = new T.Mesh(geometry, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

// Reward chest with a hinged lid. open(t) animates 0 (closed) → 1 (open).
export function makeChest() {
  const g = new T.Group(),
    wood = mat('#8a5a2e', { kind: 'wood' }),
    dark = mat('#5b3a1d', { kind: 'wood' }),
    gold = mat('#f2c55a', {
      kind: 'metal',
      metalness: 0.55,
      roughness: 0.32,
      emissive: '#7a5212',
      emissiveIntensity: 0.25,
    }),
    glow = new T.MeshBasicMaterial({
      color: '#ffe9a6',
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: T.AdditiveBlending,
    });
  add(g, new T.BoxGeometry(1.1, 0.62, 0.74), wood, 0, 0.31, 0);
  for (const x of [-0.5, 0.5]) add(g, new T.BoxGeometry(0.09, 0.66, 0.8), gold, x, 0.33, 0);
  add(g, new T.BoxGeometry(1.16, 0.08, 0.8), dark, 0, 0.04, 0);
  const lid = new T.Group();
  lid.position.set(0, 0.62, -0.37);
  g.add(lid);
  const top = add(lid, new T.CylinderGeometry(0.37, 0.37, 1.1, 14, 1, false, 0, Math.PI), wood, 0, 0, 0.37);
  top.rotation.z = Math.PI / 2;
  for (const x of [-0.5, 0.5]) {
    const band = add(lid, new T.CylinderGeometry(0.39, 0.39, 0.09, 14, 1, false, 0, Math.PI), gold, x, 0, 0.37);
    band.rotation.z = Math.PI / 2;
  }
  add(g, new T.BoxGeometry(0.2, 0.24, 0.08), gold, 0, 0.56, 0.4);
  const light = add(g, new T.SphereGeometry(0.42, 16, 10), glow, 0, 0.7, 0);
  light.castShadow = false;
  light.scale.set(1.2, 0.6, 0.8);
  const beam = add(
    g,
    new T.CylinderGeometry(0.05, 0.5, 3.2, 16, 1, true),
    new T.MeshBasicMaterial({
      color: '#fff1b8',
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      side: T.DoubleSide,
      blending: T.AdditiveBlending,
    }),
    0,
    2.1,
    0,
  );
  beam.castShadow = false;
  g.userData = { lid, light, beam, openness: 0 };
  g.userData.update = (time, open) => {
    const u = g.userData;
    u.openness += (open - u.openness) * 0.12;
    lid.rotation.x = -u.openness * 1.9;
    light.material.opacity = u.openness * 0.85;
    beam.visible = open < 0.5;
    beam.material.opacity = 0.16 + Math.sin(time * 3) * 0.06;
    if (open < 0.5) g.rotation.y = Math.sin(time * 1.4) * 0.08;
    g.position.y = open < 0.5 ? Math.max(0, Math.sin(time * 3.2)) * 0.06 : 0;
  };
  return g;
}

// Hats sit on the top of the creature's bounding box and scale with its height.
export function makeHat(id) {
  const g = new T.Group();
  g.name = 'cosmetic-hat';
  if (id === 'hat-leaf') {
    const leaf = mat('#6fae5a', { kind: 'foliage' });
    const cap = add(g, new T.SphereGeometry(0.5, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), leaf);
    cap.scale.set(1, 0.55, 1);
    const tip = add(g, new T.ConeGeometry(0.12, 0.5, 6), mat('#4f8a3f', { kind: 'foliage' }), 0.1, 0.3, 0);
    tip.rotation.z = -0.6;
  } else if (id === 'hat-acorn') {
    const cap = add(
      g,
      new T.SphereGeometry(0.5, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      mat('#a8743c', { kind: 'wood' }),
    );
    cap.scale.set(1, 0.6, 1);
    add(g, new T.CylinderGeometry(0.05, 0.07, 0.22, 6), mat('#6b4a24', { kind: 'wood' }), 0, 0.38, 0);
  } else if (id === 'hat-party') {
    add(g, new T.ConeGeometry(0.34, 0.95, 18), mat('#e86aa5'), 0, 0.47, 0);
    add(g, new T.SphereGeometry(0.11, 10, 8), mat('#ffe066'), 0, 0.98, 0);
    add(g, new T.TorusGeometry(0.33, 0.04, 6, 18), mat('#7fd3ff'), 0, 0.05, 0).rotation.x = Math.PI / 2;
  } else if (id === 'hat-flower') {
    const ring = add(g, new T.TorusGeometry(0.42, 0.06, 6, 20), mat('#6fa85a', { kind: 'foliage' }), 0, 0.03, 0);
    ring.rotation.x = Math.PI / 2;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      add(
        g,
        new T.SphereGeometry(0.1, 8, 6),
        mat(['#f3a7c3', '#fff1a8', '#c7a6ff'][i % 3]),
        Math.cos(a) * 0.42,
        0.08,
        Math.sin(a) * 0.42,
      );
    }
  } else if (id === 'hat-wizard') {
    const cone = add(g, new T.ConeGeometry(0.34, 1.15, 18), mat('#5a5fc4'), 0, 0.58, 0);
    cone.rotation.z = 0.12;
    add(g, new T.CylinderGeometry(0.58, 0.58, 0.05, 22), mat('#4a4fae'), 0, 0.02, 0);
    add(
      g,
      new T.OctahedronGeometry(0.1),
      mat('#ffe066', { emissive: '#b8901a', emissiveIntensity: 0.6 }),
      0.12,
      0.75,
      0.24,
    );
  } else if (id === 'hat-crown') {
    const gold = mat('#f2c94c', {
      kind: 'metal',
      metalness: 0.65,
      roughness: 0.28,
      emissive: '#6b4c0a',
      emissiveIntensity: 0.2,
    });
    add(g, new T.CylinderGeometry(0.36, 0.4, 0.24, 16, 1, true), gold, 0, 0.12, 0);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      add(g, new T.ConeGeometry(0.08, 0.22, 5), gold, Math.cos(a) * 0.37, 0.33, Math.sin(a) * 0.37);
      add(
        g,
        new T.SphereGeometry(0.045, 8, 6),
        mat(['#e84a5f', '#4fc3e8'][i % 2], { roughness: 0.2 }),
        Math.cos(a) * 0.39,
        0.15,
        Math.sin(a) * 0.39,
      );
    }
  }
  return g;
}
export function placeHat(creature, model, hat) {
  const yaw = creature.rotation.y,
    scale = creature.scale.clone();
  creature.rotation.y = 0;
  creature.scale.set(1, 1, 1);
  creature.updateMatrixWorld(true);
  const box = new T.Box3().setFromObject(model),
    size = box.getSize(new T.Vector3()),
    top = creature.worldToLocal(new T.Vector3((box.min.x + box.max.x) / 2, box.max.y, (box.min.z + box.max.z) / 2));
  creature.rotation.y = yaw;
  creature.scale.copy(scale);
  creature.updateMatrixWorld(true);
  hat.position.set(top.x, top.y - size.y * 0.07, top.z);
  hat.scale.setScalar(Math.max(0.14, Math.min(size.x, size.z) * 0.5));
  return hat;
}

// Camp decorations are arranged around the creature behind and beside it, never between it and the camera.
export const CAMP_SPOTS = {
  'camp-tent': [-1.25, -2.7, 0.45],
  'camp-fire': [1.0, -1.3, 0],
  'camp-lanterns': [0, -2.2, 0],
  'camp-flags': [0, -3.4, 0],
  'camp-mushrooms': [-0.75, -0.7, 0],
  'camp-crystal': [1.25, -2.1, 0],
};
export function makeCampDecor(id) {
  const g = new T.Group();
  g.name = id;
  if (id === 'camp-tent') {
    const cloth = mat('#d9b46a', { side: T.DoubleSide });
    const tent = add(g, new T.ConeGeometry(1.1, 1.5, 4, 1, true), cloth, 0, 0.75, 0);
    tent.rotation.y = Math.PI / 4;
    add(g, new T.PlaneGeometry(0.5, 0.8), mat('#5b3a1d', { kind: 'wood' }), 0, 0.4, 0.62);
    add(g, new T.CylinderGeometry(0.03, 0.03, 1.9, 5), mat('#6b4a24', { kind: 'wood' }), 0, 0.95, 0);
  }
  if (id === 'camp-fire') {
    for (let i = 0; i < 5; i++) {
      const log = add(g, new T.CylinderGeometry(0.06, 0.07, 0.7, 6), mat('#6b4a24', { kind: 'wood' }), 0, 0.1, 0);
      log.rotation.z = Math.PI / 2.4;
      log.rotation.y = (i / 5) * Math.PI * 2;
    }
    const flame = add(g, new T.ConeGeometry(0.22, 0.6, 8), new T.MeshBasicMaterial({ color: '#ffb347' }), 0, 0.38, 0);
    flame.castShadow = false;
    const core = add(g, new T.ConeGeometry(0.12, 0.38, 8), new T.MeshBasicMaterial({ color: '#fff1a8' }), 0, 0.3, 0);
    core.castShadow = false;
    const light = new T.PointLight('#ff9a3c', 2.2, 6, 1.6);
    light.position.y = 0.6;
    g.add(light);
    g.userData.flame = [flame, core, light];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      add(
        g,
        new T.DodecahedronGeometry(0.1),
        mat('#8f8a80', { kind: 'stone' }),
        Math.cos(a) * 0.42,
        0.05,
        Math.sin(a) * 0.42,
      );
    }
  }
  if (id === 'camp-lanterns')
    for (const x of [-1.15, 1.15]) {
      add(g, new T.CylinderGeometry(0.04, 0.05, 1.5, 6), mat('#6b4a24', { kind: 'wood' }), x, 0.75, 0);
      const lamp = add(
        g,
        new T.SphereGeometry(0.17, 12, 10),
        mat('#ffcf7a', { emissive: '#ff9f3a', emissiveIntensity: 1.4 }),
        x,
        1.5,
        0,
      );
      lamp.scale.y = 1.25;
      lamp.castShadow = false;
    }
  if (id === 'camp-flags') {
    for (const x of [-1.5, 1.5])
      add(g, new T.CylinderGeometry(0.04, 0.05, 1.7, 6), mat('#6b4a24', { kind: 'wood' }), x, 0.85, 0);
    for (let i = 0; i < 9; i++) {
      const t = i / 8,
        x = -1.4 + 2.8 * t,
        y = 1.62 - Math.sin(t * Math.PI) * 0.35;
      const flag = add(
        g,
        new T.ConeGeometry(0.12, 0.26, 3),
        mat(['#f08a6a', '#ffd166', '#7fd3ff', '#9be38f'][i % 4], { side: T.DoubleSide }),
        x,
        y - 0.13,
        0,
      );
      flag.rotation.x = Math.PI;
      flag.castShadow = false;
    }
  }
  if (id === 'camp-mushrooms')
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2,
        r = 0.55 + (i % 2) * 0.12,
        h = 0.18 + (i % 3) * 0.07;
      add(g, new T.CylinderGeometry(0.035, 0.045, h, 6), mat('#f1e6c8'), Math.cos(a) * r, h / 2, Math.sin(a) * r);
      const cap = add(
        g,
        new T.SphereGeometry(0.11 + (i % 2) * 0.03, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
        mat('#e06a5a'),
        Math.cos(a) * r,
        h,
        Math.sin(a) * r,
      );
      cap.scale.y = 0.8;
    }
  if (id === 'camp-crystal') {
    const c = add(
      g,
      new T.OctahedronGeometry(0.42),
      mat('#9fe6ff', {
        kind: 'glass',
        emissive: '#4fb8e8',
        emissiveIntensity: 0.9,
        roughness: 0.15,
        metalness: 0.1,
        transparent: true,
        opacity: 0.92,
      }),
      0,
      0.7,
      0,
    );
    c.scale.y = 1.7;
    add(g, new T.DodecahedronGeometry(0.3), mat('#8a93a0', { kind: 'stone' }), 0, 0.12, 0);
    g.userData.spin = c;
  }
  return g;
}
export function animateCamp(group, time) {
  group.traverse(o => {
    if (o.userData.flame) {
      const [f, c, l] = o.userData.flame;
      const k = 1 + Math.sin(time * 13) * 0.08 + Math.sin(time * 7.3) * 0.06;
      f.scale.set(1, k, 1);
      c.scale.set(1, 2 - k, 1);
      l.intensity = 2 + Math.sin(time * 11) * 0.4;
    }
    if (o.userData.spin) o.userData.spin.rotation.y = time * 0.6;
  });
}
