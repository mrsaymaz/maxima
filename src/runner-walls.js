import * as T from './vendor/three.module.min.js';
// Run-track scenery with depth (0.60). Three layers per area, from the lanes outward:
//  1. Near walls, sculpted per area: Whisperwood's bushy hedge on mossy stones, Skyreach's carved sandstone with
//     pillars, banners and torches, Stormglass's dark crags with glowing crystal clusters.
//  2. The middle row (trees, mesas, spires) as before, sliding with the track.
//  3. A far layer of big silhouettes that slides at a third of the track's speed (parallax), wrapping endlessly.
// Walls are built once per area (one 24 m tile, both sides) and merged by material; the far layer is a handful of
// objects re-placed each frame. Everything is deterministic (seeded), so every tile looks the same on every device.
export const TILE = 24;
function seeded(seed) {
  let n = seed >>> 0 || 1;
  return () => {
    n = (n * 1664525 + 1013904223) >>> 0;
    return n / 4294967296;
  };
}

export function wallTile(area, { kit, low, mat, geo, mesh }) {
  const g = new T.Group(),
    r = seeded(97 + area * 13);
  const add = (geometry, material, x, y, z, sx = 1, sy = 1, sz = 1, ry = 0) => {
    const m = mesh(geometry, material, x, y, z);
    m.scale.set(sx, sy, sz);
    m.rotation.y = ry;
    g.add(m);
    return m;
  };
  for (const side of [-1, 1]) {
    if (area === 0) {
      // Mossy stone curb, then a hedge of overlapping leafy mounds, with a few glowing flower lamps and blossoms.
      const stone = [mat('#7d8a66', { flat: true }), mat('#66745a', { flat: true })],
        leaf = [
          mat(kit.leaf || '#3f8f3a', { flat: true }),
          mat(kit.leafLight || '#69b84a', { flat: true }),
          mat('#2f6e31', { flat: true }),
        ];
      add(
        geo('w0curb', () => new T.BoxGeometry(0.5, 0.42, TILE)),
        stone[1],
        side * 2.98,
        0.21,
        TILE / 2,
      );
      for (let z = 0.4; z < TILE; z += (low ? 2.6 : 1.5) + r() * 0.6)
        add(
          geo('w0rock', () => new T.DodecahedronGeometry(0.32, 0)),
          stone[((z * 3) | 0) % 2],
          side * (2.95 + r() * 0.12),
          0.3,
          z,
          1 + r() * 0.5,
          0.7 + r() * 0.5,
          1 + r() * 0.6,
          r() * 3,
        );
      add(
        geo('w0back', () => new T.BoxGeometry(0.6, 2.7, TILE)),
        leaf[2],
        side * 3.75,
        1.35,
        TILE / 2,
      );
      for (let z = 0.3; z < TILE; z += (low ? 1.5 : 1.05) + r() * 0.35) {
        const h = 1.25 + r() * 0.55;
        add(
          geo('w0bush', () => new T.IcosahedronGeometry(1, 0)),
          leaf[(r() * 3) | 0],
          side * (3.45 + r() * 0.12),
          1.05 + h * 0.55,
          z,
          0.62 + r() * 0.25,
          h,
          0.85 + r() * 0.35,
          r() * 3,
        );
      }
      if (!low)
        for (let z = 1.2; z < TILE; z += 2.2 + r() * 1.5)
          add(
            geo('w0bloom', () => new T.IcosahedronGeometry(0.11, 0)),
            mat(['#ff7eb6', '#fff1a8', '#ffffff', '#ffb05c'][(r() * 4) | 0], {
              flat: true,
              emissive: '#ffffff',
              glow: 0.15,
            }),
            side * 2.92,
            1.1 + r() * 1.6,
            z,
          );
      for (let z = 3; z < TILE; z += 6)
        add(
          geo('w0lamp', () => new T.SphereGeometry(0.19, 10, 8)),
          mat('#ffe066', { emissive: '#ffb800', glow: 1.2, rough: 0.3 }),
          side * 2.86,
          1.5,
          z,
        );
      if (!low)
        for (let z = 0.8; z < TILE; z += 1.7 + r())
          add(
            geo('w0fern', () => new T.ConeGeometry(0.22, 0.55, 5).translate(0, 0.27, 0)),
            leaf[1],
            side * 2.72,
            0.05,
            z,
            1,
            1 + r() * 0.6,
            1,
            r() * 3,
          );
      if (!low)
        for (let z = 2; z < TILE; z += 4.8) {
          const big = ((z / 4.8) | 0) % 2,
            x = side * (5.4 + big * 1.6);
          add(
            geo('w0trunk', () => new T.CylinderGeometry(0.22, 0.32, 4.6, 7).translate(0, 2.3, 0)),
            mat(kit.bark || '#7a5432'),
            x,
            0,
            z,
          );
          add(
            geo('w0crown' + big, () => new T.IcosahedronGeometry(1.7 + big * 0.5, 0)),
            leaf[big],
            x,
            4.9 + big * 0.6,
            z,
            1,
            0.85,
            1,
          );
        }
    } else if (area === 1) {
      // Carved sandstone in running bond, a pale coping, pillars with capitals, striped banners and torches.
      const sand = [mat('#ecc98f', { flat: true }), mat('#ddb479', { flat: true }), mat('#f4dcae', { flat: true })];
      for (let row = 0; row < 4; row++)
        for (let z = (row % 2) * 0.7; z < TILE; z += low ? 2.8 : 1.4) {
          const len = Math.min(1.36, TILE - z);
          if (len < 0.3) continue;
          const span = low ? Math.min(2.76, TILE - z) : len;
          add(
            geo('w1block', () => new T.BoxGeometry(0.6, 0.66, 1)),
            sand[(row + ((z / 1.4) | 0)) % 2],
            side * (3.2 + (r() - 0.5) * 0.06),
            0.35 + row * 0.7,
            z + span / 2,
            1,
            1,
            span,
          );
        }
      add(
        geo('w1cope', () => new T.BoxGeometry(0.8, 0.22, TILE)),
        sand[2],
        side * 3.18,
        2.9,
        TILE / 2,
      );
      for (let z = 0; z < TILE; z += 6) {
        add(
          geo('w1pillar', () => new T.CylinderGeometry(0.36, 0.44, 3.6, 10).translate(0, 1.8, 0)),
          sand[2],
          side * 2.95,
          0,
          z,
        );
        add(
          geo('w1cap', () => new T.BoxGeometry(1, 0.3, 1)),
          sand[1],
          side * 2.95,
          3.65,
          z,
        );
        add(
          geo('w1torch', () => new T.SphereGeometry(0.17, 10, 8)),
          mat('#ff9a3c', { emissive: '#ff6a00', glow: 1.4 }),
          side * 2.7,
          2.45,
          z + 3,
        );
        const banner = geo('w1banner', () => {
          const p = new T.PlaneGeometry(1.1, 2, 1, 6);
          const a = p.attributes.position;
          for (let i = 0; i < a.count; i++) a.setX(i, a.getX(i) + Math.sin(a.getY(i) * 2.2) * 0.12);
          p.computeVertexNormals();
          return p;
        });
        const cloth = mat(z % 12 ? '#2fb7c4' : '#ff8a3d', { flat: true });
        cloth.side = T.DoubleSide;
        add(banner, cloth, side * 2.74, 2, z + 1.5, 1, 1, 1, Math.PI / 2);
        add(
          geo('w1stripe', () => new T.PlaneGeometry(1.12, 0.18)),
          mat('#fff3c9', { basic: true }),
          side * 2.73,
          1.35,
          z + 1.5,
          1,
          1,
          1,
          side > 0 ? -Math.PI / 2 : Math.PI / 2,
        );
      }
      if (!low)
        for (let z = 1; z < TILE; z += 6) {
          const h = 5 + ((z * 7) % 3) * 1.6;
          add(
            geo('w1mesa' + h, () => new T.CylinderGeometry(1.3, 1.8, h, 6).translate(0, h / 2, 0)),
            mat(z % 12 < 6 ? '#d98b4e' : '#e9b779', { flat: true }),
            side * (6 + ((z * 3) % 2) * 1.8),
            0,
            z,
          );
        }
    } else {
      // Dark crags of stacked slabs, with crystal clusters growing out of them and a glowing seam along the top.
      const rock = [mat('#3b3470', { flat: true }), mat('#2c2658', { flat: true }), mat('#4a4185', { flat: true })];
      add(
        geo('w2back', () => new T.BoxGeometry(0.6, 2.9, TILE)),
        rock[1],
        side * 3.6,
        1.45,
        TILE / 2,
      );
      for (let z = 0.2; z < TILE; z += (low ? 1.9 : 1.3) + r() * 0.6)
        for (const y of low ? [1.3] : [0.6, 1.9])
          add(
            geo('w2slab', () => new T.DodecahedronGeometry(0.6, 0)),
            rock[(r() * 3) | 0],
            side * (3.25 + r() * 0.2),
            y + r() * 0.2,
            z,
            0.8 + r() * 0.4,
            0.75 + r() * 0.35,
            1 + r() * 0.6,
            r() * 3,
          );
      add(
        geo('w2seam', () => new T.BoxGeometry(0.7, 0.07, TILE)),
        mat('#5ff3ff', { basic: true }),
        side * 3.2,
        3.05,
        TILE / 2,
      );
      for (let z = 1; z < TILE; z += (low ? 4.5 : 2.6) + r() * 1.6) {
        const y = 0.4 + r() * 2.1,
          c = r() < 0.5;
        for (let k = 0; k < 3; k++) {
          const h = 0.5 + r() * 0.7,
            m = add(
              geo('w2crystal', () => new T.ConeGeometry(0.16, 1, 5).translate(0, 0.5, 0)),
              mat(c ? '#7af6ff' : '#b48cff', { emissive: c ? '#22c8ff' : '#7a4dff', glow: 0.9, flat: true }),
              side * 2.9,
              y,
              z + (k - 1) * 0.18,
              1,
              h,
              1,
            );
          m.rotation.z = -side * (0.5 + k * 0.3);
        }
      }
      if (!low)
        for (let z = 2; z < TILE; z += 4) {
          const h = 4 + ((z * 5) % 4) * 1.3;
          add(
            geo('w2spire' + h, () => new T.ConeGeometry(0.9, h, 5).translate(0, h / 2, 0)),
            mat(z % 8 < 4 ? '#5b44c9' : '#2fb8d8', {
              emissive: z % 8 < 4 ? '#3a1f9a' : '#0f7f9f',
              glow: 0.5,
              flat: true,
            }),
            side * (5.4 + ((z * 3) % 2) * 1.5),
            0,
            z,
          );
        }
    }
  }
  return g;
}

// The far layer: big, slightly hazy silhouettes beyond the walls, scrolling at PARALLAX × the track's speed.
export const PARALLAX = 0.35,
  FAR_SPAN = 110;
export function makeFarLayer(area, { mat, geo, mesh, low = false }) {
  const g = new T.Group();
  g.name = 'runner-far';
  const r = seeded(311 + area),
    items = [];
  const count = low ? 8 : 16;
  for (let i = 0; i < count; i++) {
    const side = i % 2 ? 1 : -1,
      x = side * (13 + r() * 9),
      base = (i / count) * FAR_SPAN + r() * 4,
      piece = new T.Group();
    if (area === 0) {
      const h = 7 + r() * 7;
      piece.add(
        mesh(
          geo('f0trunk', () => new T.CylinderGeometry(0.5, 0.8, 1, 7).translate(0, 0.5, 0)),
          mat('#4d5f3d'),
          0,
          0,
          0,
        ),
      );
      piece.children[0].scale.y = h * 0.55;
      piece.add(
        mesh(
          geo('f0crown', () => new T.IcosahedronGeometry(1, 1)),
          mat(r() < 0.5 ? '#4f8a4c' : '#3d7442', { flat: true }),
          0,
          h * 0.65,
          0,
        ),
      );
      piece.children[1].scale.set(3 + r() * 2, 2.6 + r() * 1.6, 3 + r() * 2);
    } else if (area === 1) {
      const h = 8 + r() * 10;
      piece.add(
        mesh(
          geo('f1mesa', () => new T.CylinderGeometry(0.7, 1, 1, 6).translate(0, 0.5, 0)),
          mat(r() < 0.5 ? '#e2a46c' : '#efc58f', { flat: true }),
          0,
          0,
          0,
        ),
      );
      piece.children[0].scale.set(3 + r() * 3, h, 3 + r() * 3);
      if (r() < 0.35) {
        const pole = mesh(
          geo('f1pole', () => new T.CylinderGeometry(0.08, 0.08, 1).translate(0, 0.5, 0)),
          mat('#8a5a32'),
          0,
          h,
          0,
        );
        pole.scale.y = 3.5;
        piece.add(pole);
        const sail = mat('#fff3d9', { flat: true });
        sail.side = T.DoubleSide;
        piece.add(
          mesh(
            geo('f1sail', () => new T.PlaneGeometry(2.4, 2.2)),
            sail,
            1.2,
            h + 2.4,
            0,
          ),
        );
      }
    } else {
      const h = 10 + r() * 12;
      const tower = mesh(
        geo('f2tower', () => new T.ConeGeometry(1, 1, 5).translate(0, 0.5, 0)),
        mat(r() < 0.5 ? '#6a54d8' : '#3fc1e0', { emissive: '#3a1f9a', glow: 0.35, flat: true }),
        0,
        0,
        0,
      );
      tower.scale.set(1.6 + r() * 1.4, h, 1.6 + r() * 1.4);
      piece.add(tower);
      if (r() < 0.5) {
        const isle = mesh(
          geo('f2isle', () => new T.DodecahedronGeometry(1, 0)),
          mat('#4a4185', { flat: true }),
          side * -2,
          h * 0.7 + r() * 4,
          0,
        );
        isle.scale.set(2, 1.1, 2);
        piece.add(isle);
      }
    }
    piece.position.x = x;
    g.add(piece);
    items.push({ piece, base });
  }
  g.userData.items = items;
  return g;
}
// Re-place the far pieces around the creature's track metre s: they drift toward the camera at PARALLAX speed and
// wrap from just behind the creature to the far end of the span.
export function updateFarLayer(layer, s) {
  for (const it of layer.userData.items) {
    const rel = ((((it.base - s * PARALLAX) % FAR_SPAN) + FAR_SPAN) % FAR_SPAN) - 18;
    it.piece.position.z = s + rel;
  }
}

// Dust puffs kicked up by the creature's feet on the track (they ride the track, so they stream back with it).
const DUST = ['#e6f0c8', '#f4ddb0', '#d9cfff'];
export function makeDust(area = 0) {
  const g = new T.Group();
  g.name = 'runner-dust';
  const m = new T.MeshBasicMaterial({
    color: DUST[area] || DUST[0],
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
  });
  const geometry = new T.IcosahedronGeometry(0.13, 0);
  const puffs = Array.from({ length: 14 }, () => {
    const p = new T.Mesh(geometry, m.clone());
    p.visible = false;
    g.add(p);
    return { p, age: 9 };
  });
  g.userData = { puffs, next: 0, clock: 0 };
  return g;
}
export function updateDust(dust, { s, lat, speed, grounded, dt, tint }) {
  const d = dust.userData;
  d.clock += dt;
  if (grounded && speed > 4 && d.clock > 0.07) {
    d.clock = 0;
    const q = d.puffs[d.next++ % d.puffs.length];
    q.age = 0;
    q.p.position.set(-lat + (Math.random() - 0.5) * 0.35, 0.12, s - 0.25);
    q.drift = (Math.random() - 0.5) * 0.6;
    if (tint) q.p.material.color.set(tint);
  }
  for (const q of d.puffs) {
    q.age += dt;
    const k = q.age / 0.55;
    q.p.visible = k < 1;
    if (k < 1) {
      q.p.scale.setScalar(0.35 + k * 1.3);
      q.p.position.y = 0.1 + k * 0.28;
      q.p.position.x += q.drift * dt;
      q.p.material.opacity = 0.28 * (1 - k) * (1 - k);
    }
  }
}
