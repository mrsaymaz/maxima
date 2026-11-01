import * as T from './vendor/three.module.min.js';
// The twelve elemental specials as 3D set pieces in the guardian arena. Each effect is a short timeline (seconds)
// built from glowing primitives, instanced particles, ground shockwaves and a light flash. The effect lands at the
// special's impactAt (when combat deals the damage); the stage reads `shake` and `lift` to shake the camera and raise
// the guardian. Particle counts scale with the graphics setting.
const CORE_Y = 6.2,
  clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n)),
  ease = t => t * t * (3 - 2 * t),
  out = t => 1 - (1 - t) ** 3,
  inn = t => t * t * t;
const span = (t, a, b) => clamp((t - a) / (b - a));
const PALETTES = {
  gryffindor: { a: '#ff5a14', b: '#ffb238', c: '#fff1b0', dark: '#5a1306' },
  ravenclaw: { a: '#2f8bff', b: '#8fe0ff', c: '#f0fbff', dark: '#0c2f5e' },
  hufflepuff: { a: '#7fe8ff', b: '#e9fbff', c: '#ffffff', dark: '#2c4a66' },
  slytherin: { a: '#3fae3a', b: '#a6f05a', c: '#efffc4', dark: '#3b2614' },
};
class Kit {
  constructor(fx, spec, from, to) {
    this.fx = fx;
    this.spec = spec;
    this.group = new T.Group();
    this.group.name = 'special-' + spec.id;
    fx.root.add(this.group);
    this.from = from;
    this.to = to;
    this.owned = [];
    this.systems = [];
    this.colors = PALETTES[spec.team];
    this.q = fx.quality;
  }
  own(x) {
    this.owned.push(x);
    return x;
  }
  glow(color, opacity = 1, { additive = false, side = T.DoubleSide } = {}) {
    return this.own(
      new T.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        side,
        blending: additive ? T.AdditiveBlending : T.NormalBlending,
        fog: false,
      }),
    );
  }
  solid(color, emissive = '#000', intensity = 0, rough = 0.7) {
    return this.own(new T.MeshStandardMaterial({ color, emissive, emissiveIntensity: intensity, roughness: rough }));
  }
  mesh(g, m, parent = this.group) {
    const o = new T.Mesh(this.own(g), m);
    parent.add(o);
    return o;
  }
  // A glowing segment from a to b (lightning, chains).
  segment(a, b, r, m, parent = this.group) {
    const d = new T.Vector3().subVectors(b, a),
      o = this.mesh(new T.CylinderGeometry(r, r, 1, 5, 1, true), m, parent);
    o.position.copy(a).addScaledVector(d, 0.5);
    o.scale.y = d.length();
    o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
    return o;
  }
  // A flat ring that expands across the ground.
  shock(color, { at, dur = 0.7, from = 0.5, to = 12, y = 0.06, opacity = 0.9, p = this.to }) {
    const m = this.glow(color, 0, { additive: true }),
      o = this.mesh(new T.RingGeometry(0.86, 1, 64), m);
    o.rotation.x = -Math.PI / 2;
    o.position.set(p.x, y, p.z);
    o.visible = false;
    return {
      update: t => {
        const k = span(t, at, at + dur);
        o.visible = t >= at && k < 1;
        const r = from + (to - from) * out(k);
        o.scale.set(r, r, 1);
        m.opacity = opacity * (1 - k);
      },
    };
  }
  // A light flash plus a white sphere bloom at a point.
  flash(color, { at, dur = 0.45, power = 60, size = 4, p = null }) {
    const fx = this.fx,
      pos = p || new T.Vector3(this.to.x, CORE_Y, this.to.z),
      tint = new T.Color(color);
    const m = this.glow(color, 0, { additive: true }),
      ball = this.mesh(new T.SphereGeometry(1, 20, 12), m);
    ball.position.copy(pos);
    return {
      update: t => {
        const k = span(t, at, at + dur);
        const on = t >= at && k < 1,
          level = on ? power * (1 - k) ** 2 : 0;
        if (fx.light && level > fx.light.intensity) {
          fx.light.intensity = level;
          fx.light.color.copy(tint);
          fx.light.position.copy(pos);
        }
        ball.visible = on;
        ball.scale.setScalar(size * (0.3 + 0.7 * out(k)));
        m.opacity = on ? 0.45 * (1 - k) ** 2 : 0;
      },
    };
  }
  // Instanced particles: spawn(i) returns {p:Vector3,v:Vector3,life,size,delay}; gravity pulls down, drag slows.
  particles(
    color,
    count,
    spawn,
    { geometry = new T.OctahedronGeometry(0.12, 0), gravity = -6, drag = 0.4, spin = 4, opacity = 1 } = {},
  ) {
    const n = Math.max(4, Math.round(count * this.q)),
      m = this.glow(color, opacity),
      mesh = new T.InstancedMesh(this.own(geometry), m, n);
    mesh.frustumCulled = false;
    this.group.add(mesh);
    const ps = Array.from({ length: n }, (_, i) => ({ ...spawn(i, n), age: 0, rot: Math.random() * 6 }));
    const o = new T.Object3D();
    const sys = {
      update: (t, dt) => {
        for (let i = 0; i < n; i++) {
          const p = ps[i],
            live = t - (p.delay || 0);
          if (live < 0 || live > p.life) {
            o.position.set(0, -99, 0);
            o.scale.setScalar(0);
          } else if (p.orbit) {
            p.a += p.w * dt;
            p.y += p.rise * dt;
            p.r += p.out * dt;
            p.p.set(p.orbit.x + Math.sin(p.a) * p.r, p.y, p.orbit.z + Math.cos(p.a) * p.r);
            p.rot += spin * dt;
            const k = live / p.life;
            o.position.copy(p.p);
            o.rotation.set(p.rot, p.rot * 0.7, 0);
            o.scale.setScalar(p.size * (1 - k * k));
          } else {
            p.v.y += gravity * dt;
            p.v.multiplyScalar(Math.exp(-drag * dt));
            p.p.addScaledVector(p.v, dt);
            p.rot += spin * dt;
            const k = live / p.life;
            o.position.copy(p.p);
            o.rotation.set(p.rot, p.rot * 0.7, 0);
            o.scale.setScalar(p.size * (1 - k * k));
          }
          o.updateMatrix();
          mesh.setMatrixAt(i, o.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
      },
    };
    return sys;
  }
  around(r, a, y = 0) {
    return new T.Vector3(this.to.x + Math.sin(a) * r, y, this.to.z + Math.cos(a) * r);
  }
  jagged(a, b, steps = 9, wild = 1.2) {
    const pts = [a.clone()];
    for (let i = 1; i < steps; i++) {
      const p = a.clone().lerp(b, i / steps);
      p.x += (Math.random() - 0.5) * wild * 2;
      p.z += (Math.random() - 0.5) * wild * 2;
      pts.push(p);
    }
    pts.push(b.clone());
    return pts;
  }
  bolt(a, b, m, r = 0.09, parent = this.group) {
    const g = new T.Group();
    parent.add(g);
    const pts = this.jagged(a, b);
    for (let i = 0; i < pts.length - 1; i++) {
      this.segment(pts[i], pts[i + 1], r, m, g);
      if (Math.random() < 0.35 && i > 1) {
        const fork = pts[i]
          .clone()
          .add(new T.Vector3((Math.random() - 0.5) * 4, -2 - Math.random() * 2, (Math.random() - 0.5) * 4));
        this.segment(pts[i], fork, r * 0.55, m, g);
      }
    }
    return g;
  }
  dispose() {
    this.group.removeFromParent();
    for (const x of this.owned) x.dispose?.();
    this.group.traverse(o => {
      if (o.isInstancedMesh) o.dispose?.();
    });
  }
}
const sparks = (
  k,
  color,
  count,
  { y = CORE_Y, speed = 9, up = 4, life = 1.2, size = 1, at = 0, geometry, gravity = -9 } = {},
) =>
  k.particles(
    color,
    count,
    () => {
      const a = Math.random() * Math.PI * 2,
        e = Math.random() * 0.9 + 0.1;
      return {
        p: new T.Vector3(k.to.x, y, k.to.z),
        v: new T.Vector3(Math.sin(a) * speed * e, up + Math.random() * up, Math.cos(a) * speed * e),
        life: life * (0.5 + Math.random() * 0.6),
        size: size * (0.6 + Math.random() * 0.8),
        delay: at,
      };
    },
    { geometry, gravity },
  );

// ——— Gryffindor ———
function firePillars(k) {
  const c = k.colors,
    parts = [],
    pillars = [];
  const rune = k.mesh(new T.RingGeometry(2.6, 3.4, 48), k.glow(c.b, 0));
  rune.rotation.x = -Math.PI / 2;
  rune.position.set(k.to.x, 0.05, k.to.z);
  const ring = [0, 1, 2, 3, 4].map(i => (i * Math.PI * 2) / 5 + 0.3);
  const all = [
    ...ring.map(a => ({ p: k.around(4, a), at: 0.35 + ring.indexOf(a) * 0.12, h: 11 })),
    { p: k.around(0, 0), at: 1.05, h: 16, big: true },
  ];
  for (const s of all) {
    const g = new T.Group();
    g.position.copy(s.p);
    k.group.add(g);
    const outer = k.mesh(new T.CylinderGeometry(0.55, 1.2, 1, 16, 1, true), k.glow(c.a, 0.85), g),
      inner = k.mesh(new T.CylinderGeometry(0.25, 0.6, 1, 12, 1, true), k.glow(c.c, 0.95), g),
      cap = k.mesh(new T.ConeGeometry(1.3, 2.2, 16, 1, true), k.glow(c.b, 0.8), g);
    g.scale.set(s.big ? 2.1 : 1, 1, s.big ? 2.1 : 1);
    pillars.push({ g, outer, inner, cap, ...s });
    parts.push(
      k.particles(
        c.b,
        26,
        () => ({
          p: s.p.clone().add(new T.Vector3((Math.random() - 0.5) * 1.4, 0.2, (Math.random() - 0.5) * 1.4)),
          v: new T.Vector3((Math.random() - 0.5) * 2, 6 + Math.random() * 7, (Math.random() - 0.5) * 2),
          life: 1 + Math.random() * 0.6,
          size: 0.8 + Math.random(),
          delay: s.at + Math.random() * 0.4,
        }),
        { gravity: -1, geometry: new T.ConeGeometry(0.07, 0.24, 4) },
      ),
    );
  }
  parts.push(
    k.shock(c.b, { at: 1.05, dur: 0.8, to: 13 }),
    k.shock(c.c, { at: 1.1, dur: 0.5, to: 7, opacity: 1 }),
    k.flash(c.b, { at: 1.05, power: 90, size: 5 }),
    sparks(k, c.a, 60, { at: 1.05, speed: 12, up: 6 }),
  );
  return {
    update(t, dt) {
      const r = span(t, 0, 0.4);
      rune.material.opacity = 0.9 * ease(r) * (1 - span(t, 1.6, 2.4));
      rune.rotation.z = t * 1.5;
      rune.scale.setScalar(0.6 + 0.4 * out(r));
      for (const p of pillars) {
        const rise = out(span(t, p.at, p.at + 0.3)),
          fall = span(t, 1.7, 2.5),
          h = p.h * rise * (1 - fall * 0.85) + 0.01;
        for (const m of [p.outer, p.inner]) {
          m.scale.y = h;
          m.position.y = h / 2;
        }
        p.cap.position.y = h + 0.8;
        p.cap.visible = rise > 0;
        p.outer.visible = p.inner.visible = rise > 0;
        const flick = 1 + 0.08 * Math.sin(t * 40 + p.at * 9);
        p.outer.scale.x = p.outer.scale.z = flick;
        p.outer.material.opacity = 0.85 * (1 - fall);
        p.inner.material.opacity = 0.95 * (1 - fall);
        p.cap.material.opacity = 0.8 * (1 - fall);
        p.outer.rotation.y = t * 3;
      }
      for (const s of parts) s.update(t, dt);
      k.fx.shake = Math.max(
        k.fx.shake,
        t > 1.05 && t < 1.6 ? 0.5 * (1 - span(t, 1.05, 1.6)) : t > 0.35 && t < 1 ? 0.12 : 0,
      );
    },
  };
}
function flamePrison(k) {
  const c = k.colors,
    walls = [],
    parts = [],
    N = 8;
  const cage = new T.Group();
  cage.position.set(k.to.x, 0, k.to.z);
  k.group.add(cage);
  for (let i = 0; i < N; i++) {
    const g = new T.Group();
    cage.add(g);
    const sheet = k.mesh(new T.PlaneGeometry(2.6, 1, 1, 1), k.glow(c.a, 0.75), g),
      core = k.mesh(new T.PlaneGeometry(1.2, 1, 1, 1), k.glow(c.c, 0.7), g);
    sheet.geometry.translate(0, 0.5, 0);
    core.geometry.translate(0, 0.5, 0);
    walls.push({ g, sheet, core, a: (i * Math.PI * 2) / N });
  }
  const chains = [2.5, 5, 7.5].map((y, i) => {
    const m = k.mesh(new T.TorusGeometry(3, 0.18, 8, 48), k.glow(i === 1 ? c.c : c.b, 0), cage);
    m.rotation.x = Math.PI / 2;
    m.position.y = y;
    return m;
  });
  parts.push(
    k.shock(c.a, { at: 1.5, dur: 0.6, to: 9 }),
    k.flash(c.b, { at: 1.5, power: 70, size: 4 }),
    sparks(k, c.b, 50, { at: 1.5, speed: 7, up: 5 }),
    k.particles(
      c.b,
      50,
      () => {
        const a = Math.random() * Math.PI * 2;
        return {
          p: k.around(3.2 + Math.random(), a, 0.3),
          v: new T.Vector3(0, 3 + Math.random() * 4, 0),
          life: 1.4,
          size: 1,
          delay: 0.4 + Math.random() * 2.4,
        };
      },
      { gravity: 0, geometry: new T.ConeGeometry(0.07, 0.24, 4) },
    ),
  );
  return {
    update(t, dt) {
      const close = ease(span(t, 0.15, 1.5)),
        r = 7.5 - 4.4 * close,
        fade = span(t, 2.8, 3.4),
        h = (8.5 + Math.sin(t * 9) * 0.4) * out(span(t, 0, 0.5));
      cage.rotation.y = t * (1.2 - 0.6 * close);
      for (const w of walls) {
        w.g.position.set(Math.sin(w.a) * r, 0, Math.cos(w.a) * r);
        w.g.rotation.y = w.a;
        w.sheet.scale.set(1 + 0.1 * Math.sin(t * 20 + w.a * 3), h, 1);
        w.core.scale.set(1, h * 0.8, 1);
        w.sheet.material.opacity = 0.75 * (1 - fade);
        w.core.material.opacity = 0.7 * (1 - fade);
      }
      chains.forEach((m, i) => {
        const on = span(t, 1.3 + i * 0.08, 1.6 + i * 0.08);
        m.material.opacity = 0.9 * ease(on) * (1 - fade);
        m.scale.setScalar(1.25 - 0.25 * ease(on) + 0.04 * Math.sin(t * 12 + i));
        m.rotation.z = t * (i % 2 ? -2 : 2);
      });
      for (const s of parts) s.update(t, dt);
      k.fx.shake = Math.max(k.fx.shake, t > 1.5 && t < 1.9 ? 0.4 : 0);
    },
  };
}
function meteorStorm(k) {
  const c = k.colors,
    parts = [],
    meteors = [];
  const portal = k.mesh(new T.RingGeometry(2, 7, 64, 1), k.glow(c.a, 0));
  portal.rotation.x = Math.PI / 2;
  portal.position.set(k.to.x, 24, k.to.z + 2);
  const swirl = k.mesh(new T.CircleGeometry(6.5, 48), k.glow(c.dark, 0, { additive: false }));
  swirl.rotation.x = Math.PI / 2;
  swirl.position.copy(portal.position).add(new T.Vector3(0, 0.1, 0));
  const rock = k.solid('#4a2410', '#ff5a14', 1.6, 0.9);
  const N = Math.max(6, Math.round(14 * k.q));
  for (let i = 0; i < N; i++) {
    const a = Math.random() * Math.PI * 2,
      d = 2.5 + Math.random() * 7,
      start = 0.45 + i * (1.55 / N);
    meteors.push({
      start,
      end: start + 0.55,
      from: new T.Vector3(k.to.x + (Math.random() - 0.5) * 6, 24, k.to.z + 2 + (Math.random() - 0.5) * 6),
      hit: k.around(d, a, 0),
      size: 0.5 + Math.random() * 0.5,
    });
  }
  meteors.push({
    start: 1.55,
    end: 2.4,
    from: new T.Vector3(k.to.x + 3, 30, k.to.z + 4),
    hit: new T.Vector3(k.to.x, CORE_Y - 1, k.to.z),
    size: 2.6,
    big: true,
  });
  for (const m of meteors) {
    m.body = k.mesh(new T.IcosahedronGeometry(1, 1), rock);
    m.body.scale.setScalar(m.size);
    m.tail = k.mesh(new T.ConeGeometry(1, 1, 12, 1, true), k.glow(c.b, 0.85));
    m.glow = k.mesh(new T.SphereGeometry(1.35, 14, 10), k.glow(c.a, 0.6));
    m.glow.scale.setScalar(m.size);
    m.body.visible = m.tail.visible = m.glow.visible = false;
    parts.push(
      k.particles(c.b, m.big ? 40 : 10, () => {
        const a = Math.random() * Math.PI * 2,
          s = (m.big ? 14 : 6) * (0.4 + Math.random() * 0.6);
        return {
          p: m.hit.clone().setY(m.big ? CORE_Y - 1 : 0.3),
          v: new T.Vector3(Math.sin(a) * s, 3 + Math.random() * (m.big ? 9 : 4), Math.cos(a) * s),
          life: 0.9,
          size: m.big ? 1.6 : 0.9,
          delay: m.end,
        };
      }),
    );
    parts.push(
      k.shock(m.big ? c.c : c.a, {
        at: m.end,
        dur: m.big ? 0.9 : 0.5,
        to: m.big ? 16 : 4,
        opacity: m.big ? 1 : 0.7,
        p: m.hit,
      }),
    );
  }
  parts.push(
    k.flash(c.c, { at: 2.4, dur: 0.7, power: 160, size: 8 }),
    k.shock(c.b, { at: 2.45, dur: 1.2, to: 20, width: 1 }),
    sparks(k, c.a, 90, { at: 2.4, speed: 16, up: 10, life: 1.6, size: 1.6 }),
  );
  return {
    update(t, dt) {
      const open = ease(span(t, 0, 0.5)),
        close = span(t, 2.4, 3.4);
      portal.material.opacity = 0.85 * open * (1 - close);
      swirl.material.opacity = 0.7 * open * (1 - close);
      portal.rotation.z = t * 2;
      portal.scale.setScalar(0.4 + 0.6 * out(span(t, 0, 0.5)));
      for (const m of meteors) {
        const k2 = span(t, m.start, m.end),
          on = t >= m.start && t < m.end;
        m.body.visible = m.tail.visible = m.glow.visible = on;
        if (!on) continue;
        const p = m.from.clone().lerp(m.hit, inn(k2) * 0.6 + k2 * 0.4),
          dir = new T.Vector3().subVectors(m.hit, m.from).normalize();
        m.body.position.copy(p);
        m.glow.position.copy(p);
        m.body.rotation.x += dt * 6;
        m.body.rotation.y += dt * 4;
        const len = m.size * 5;
        m.tail.scale.set(m.size * 0.9, len, m.size * 0.9);
        m.tail.position.copy(p).addScaledVector(dir, -len / 2);
        m.tail.quaternion.setFromUnitVectors(new T.Vector3(0, -1, 0), dir);
      }
      for (const s of parts) s.update(t, dt);
      k.fx.shake = Math.max(
        k.fx.shake,
        t > 2.4 && t < 3.3 ? 1.1 * (1 - span(t, 2.4, 3.3)) : meteors.some(m => Math.abs(t - m.end) < 0.12) ? 0.25 : 0,
      );
    },
  };
}

// ——— Ravenclaw ———
function iceSpears(k) {
  const c = k.colors,
    parts = [],
    N = 9,
    spears = [];
  const ice = k.solid('#cfefff', '#5fc8ff', 0.9, 0.15);
  ice.transparent = true;
  ice.opacity = 0.92;
  const core = new T.Vector3(k.to.x, CORE_Y, k.to.z);
  for (let i = 0; i < N; i++) {
    const s = (i - (N - 1) / 2) / ((N - 1) / 2),
      start = new T.Vector3(k.from.x + s * 3.4, k.from.y + 3.2 + Math.abs(s) * -0.8 + 1.2, k.from.z + 1),
      launch = 0.55 + Math.abs(s) * 0.0 + i * 0.05;
    const g = new T.Group();
    k.group.add(g);
    const body = k.mesh(new T.OctahedronGeometry(1, 0), ice, g);
    body.scale.set(0.32, 0.32, 2.2);
    const halo = k.mesh(new T.ConeGeometry(0.5, 3.2, 8, 1, true), k.glow(c.b, 0.55), g);
    halo.rotation.x = -Math.PI / 2;
    halo.position.z = -1.6;
    const hit = core.clone().add(new T.Vector3(s * 1.2, (Math.random() - 0.5) * 2.2, 1.6));
    spears.push({ g, start, hit, launch, arrive: Math.min(1.1, launch + 0.42), halo });
  }
  parts.push(
    k.flash(c.b, { at: 1.1, power: 70, size: 3.5 }),
    k.shock(c.c, { at: 1.1, dur: 0.6, to: 8 }),
    sparks(k, c.c, 70, { at: 1.1, speed: 9, up: 5, geometry: new T.TetrahedronGeometry(0.18) }),
  );
  return {
    update(t, dt) {
      for (const s of spears) {
        const form = out(span(t, 0, 0.45)),
          fly = span(t, s.launch, s.arrive),
          shatter = span(t, 2, 2.4);
        s.g.visible = shatter < 1 && t > 0;
        s.g.scale.setScalar(Math.max(0.01, form * (1 - shatter)));
        const p = s.start.clone().lerp(s.hit, inn(fly));
        if (fly <= 0) p.y += Math.sin(t * 6 + s.launch * 20) * 0.12;
        s.g.position.copy(p);
        s.g.lookAt(fly < 1 ? s.hit : core);
        s.halo.material.opacity = fly > 0 && fly < 1 ? 0.6 : 0.15;
      }
      for (const s of parts) s.update(t, dt);
      k.fx.shake = Math.max(k.fx.shake, t > 1 && t < 1.4 ? 0.35 : 0);
    },
  };
}
function frostLock(k) {
  const c = k.colors,
    parts = [],
    crystals = [];
  const ice = k.solid('#dff6ff', '#64c6ff', 0.7, 0.1);
  ice.transparent = true;
  ice.opacity = 0.85;
  const frost = k.mesh(new T.CircleGeometry(1, 64), k.glow(c.b, 0));
  frost.rotation.x = -Math.PI / 2;
  frost.position.set(k.to.x, 0.04, k.to.z);
  const N = Math.max(8, Math.round(16 * k.q));
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + Math.random() * 0.2,
      r = 2.6 + Math.random() * 1.4,
      h = 5 + Math.random() * 6,
      g = k.mesh(new T.CylinderGeometry(0, 0.7 + Math.random() * 0.4, 1, 6), ice);
    g.position.copy(k.around(r, a, 0));
    g.rotation.set(Math.cos(a) * -0.35, 0, Math.sin(a) * 0.35);
    crystals.push({ g, h, at: 0.45 + (i / N) * 0.9, a, r });
  }
  const shell = k.mesh(new T.IcosahedronGeometry(3.4, 1), k.glow(c.c, 0));
  shell.position.set(k.to.x, CORE_Y, k.to.z);
  parts.push(
    k.flash(c.c, { at: 1.5, power: 80, size: 4.5 }),
    k.shock(c.b, { at: 1.5, dur: 0.7, to: 11 }),
    k.particles(
      c.c,
      60,
      () => ({
        p: k.around(Math.random() * 8, Math.random() * 7, 9 + Math.random() * 4),
        v: new T.Vector3((Math.random() - 0.5) * 0.6, -1.5 - Math.random(), (Math.random() - 0.5) * 0.6),
        life: 2.5,
        size: 0.8,
        delay: Math.random() * 1.5,
      }),
      { gravity: 0, geometry: new T.TetrahedronGeometry(0.1) },
    ),
    sparks(k, c.c, 70, { at: 3, speed: 8, up: 3, y: 3, geometry: new T.TetrahedronGeometry(0.22), gravity: -14 }),
  );
  return {
    update(t, dt) {
      const spread = out(span(t, 0, 0.9)),
        gone = span(t, 3, 3.4);
      frost.scale.setScalar(9 * spread);
      frost.material.opacity = 0.55 * spread * (1 - gone);
      for (const s of crystals) {
        const g = out(span(t, s.at, s.at + 0.45)) * (1 - gone);
        s.g.scale.set(Math.max(0.01, g), Math.max(0.01, s.h * g), Math.max(0.01, g));
        s.g.position.y = (s.h * g) / 2;
      }
      const lock = span(t, 1.35, 1.6);
      shell.material.opacity = lock > 0 && gone < 1 ? 0.25 + 0.1 * Math.sin(t * 14) : 0;
      shell.scale.setScalar(0.8 + 0.2 * out(lock));
      shell.rotation.y = t * 0.4;
      for (const s of parts) s.update(t, dt);
      k.fx.shake = Math.max(k.fx.shake, t > 1.5 && t < 1.9 ? 0.4 : t > 3 && t < 3.2 ? 0.3 : 0);
    },
  };
}
function tidalWave(k) {
  const c = k.colors,
    parts = [];
  const g = new T.Group();
  k.group.add(g);
  const W = 26,
    shape = new T.CylinderGeometry(6, 6, W, 36, 1, true, Math.PI * 0.5, Math.PI * 1.1);
  shape.rotateZ(Math.PI / 2);
  const water = k.mesh(shape, k.glow(c.a, 0.8), g),
    inner = k.mesh(shape.clone(), k.glow(c.b, 0.45), g);
  inner.scale.setScalar(0.82);
  const foam = k.mesh(new T.CylinderGeometry(0.75, 0.75, W, 14, 1, true), k.glow(c.c, 0.85), g);
  foam.rotation.z = Math.PI / 2;
  foam.position.set(0, 6, -0.4);
  const lip = k.mesh(new T.CylinderGeometry(0.45, 0.45, W * 0.96, 10, 1, true), k.glow('#ffffff', 0.7), g);
  lip.rotation.z = Math.PI / 2;
  lip.position.set(0, 5.4, -1.6);
  const spray = k.particles(
    c.c,
    90,
    () => {
      const a = Math.random() * Math.PI * 2,
        s = 4 + Math.random() * 10;
      return {
        p: new T.Vector3(k.to.x + (Math.random() - 0.5) * 10, 1, k.to.z + 1),
        v: new T.Vector3(Math.sin(a) * s * 0.6, 8 + Math.random() * 12, Math.cos(a) * s * 0.4),
        life: 1.8,
        size: 1.3,
        delay: 2.35,
      };
    },
    { gravity: -14, geometry: new T.SphereGeometry(0.2, 6, 4) },
  );
  parts.push(
    spray,
    k.flash(c.b, { at: 2.4, power: 90, size: 6 }),
    k.shock(c.c, { at: 2.4, dur: 1.1, to: 18 }),
    k.shock(c.b, { at: 2.6, dur: 1.1, to: 14 }),
  );
  return {
    update(t, dt) {
      const rise = out(span(t, 0, 1)),
        sweep = ease(span(t, 1, 2.4)),
        fade = span(t, 2.9, 4.4),
        z = k.from.z + 7 - (k.from.z + 7 - (k.to.z - 1)) * sweep,
        h = rise * (1 - fade * 0.9);
      g.position.set(k.to.x, -1 + 7 * h - 6, z);
      g.scale.set(1, Math.max(0.01, 1.45 * h), 1.2);
      g.rotation.x = -0.25 * sweep;
      water.material.opacity = 0.8 * (1 - fade);
      inner.material.opacity = 0.45 * (1 - fade);
      water.rotation.x = inner.rotation.x = Math.sin(t * 3) * 0.03;
      foam.material.opacity = 0.85 * (1 - fade);
      lip.material.opacity = 0.7 * (1 - fade);
      foam.scale.x = lip.scale.x = 1 + 0.15 * Math.sin(t * 14);
      for (const s of parts) s.update(t, dt);
      k.fx.shake = Math.max(
        k.fx.shake,
        t > 1 && t < 2.4 ? 0.18 + 0.3 * sweep : t > 2.4 && t < 3.2 ? 0.9 * (1 - span(t, 2.4, 3.2)) : 0,
      );
    },
  };
}

// ——— Hufflepuff ———
function cloud(k, color, r, y, n = 7) {
  const g = new T.Group();
  g.position.set(k.to.x, y, k.to.z);
  k.group.add(g);
  const m = k.glow(color, 0, { additive: false });
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2,
      s = k.mesh(new T.SphereGeometry(1, 12, 8), m, g);
    s.position.set(Math.sin(a) * r * 0.6, (Math.random() - 0.5) * 0.6, Math.cos(a) * r * 0.6);
    s.scale.set(r * 0.45, r * 0.22, r * 0.45);
  }
  return { g, m };
}
function thunderbolt(k) {
  const c = k.colors,
    parts = [],
    bolt = k.glow('#ffffff', 1),
    halo = k.glow('#4fc8ff', 0.6),
    strikes = [0.7, 0.9, 1.1];
  const sky = cloud(k, '#3c4f66', 5, 15);
  const bolts = strikes.map((at, i) => {
    const end = i === 2 ? new T.Vector3(k.to.x, CORE_Y, k.to.z) : k.around(2 + Math.random() * 2, i * 2.2, 0),
      start = new T.Vector3(k.to.x + (Math.random() - 0.5) * 3, 15, k.to.z + (Math.random() - 0.5) * 3);
    const g = new T.Group();
    k.group.add(g);
    k.bolt(start, end, bolt, i === 2 ? 0.24 : 0.15, g);
    k.bolt(start, end, halo, i === 2 ? 0.6 : 0.38, g);
    g.visible = false;
    parts.push(
      k.flash('#eaf6ff', { at, dur: 0.3, power: i === 2 ? 120 : 60, size: i === 2 ? 4 : 2, p: end }),
      k.shock(c.a, { at, dur: 0.5, to: i === 2 ? 10 : 4 }),
    );
    return { g, at };
  });
  parts.push(sparks(k, '#f4fbff', 60, { at: 1.1, speed: 10, up: 5, geometry: new T.BoxGeometry(0.05, 0.05, 0.4) }));
  return {
    update(t, dt) {
      sky.m.opacity = 0.85 * ease(span(t, 0, 0.5)) * (1 - span(t, 1.8, 2.6));
      sky.g.rotation.y = t * 0.6;
      for (const b of bolts) {
        const live = t - b.at;
        b.g.visible = live >= 0 && live < 0.28 && Math.floor(live * 30) % 3 !== 2;
      }
      for (const s of parts) s.update(t, dt);
      k.fx.shake = Math.max(k.fx.shake, bolts.some(b => t > b.at && t < b.at + 0.25) ? 0.45 : 0);
    },
  };
}
function updraft(k) {
  const c = k.colors,
    parts = [],
    rings = [];
  const funnel = k.mesh(new T.CylinderGeometry(4.2, 1.2, 14, 32, 6, true), k.glow(c.a, 0)),
    inner = k.mesh(new T.CylinderGeometry(3, 0.6, 14, 24, 1, true), k.glow(c.b, 0));
  for (const f of [funnel, inner]) f.position.set(k.to.x, 7, k.to.z);
  for (let i = 0; i < 7; i++) {
    const m = k.mesh(new T.TorusGeometry(1, 0.09, 6, 40, Math.PI * 1.4), k.glow(i % 2 ? c.b : c.c, 0));
    m.rotation.x = Math.PI / 2;
    rings.push({ m, phase: i / 7 });
  }
  const debris = k.particles(
    c.b,
    80,
    () => ({
      p: new T.Vector3(),
      v: new T.Vector3(),
      life: 1.6 + Math.random(),
      size: 0.9,
      delay: 0.3 + Math.random() * 1.6,
      orbit: k.to,
      a: Math.random() * Math.PI * 2,
      w: 5 + Math.random() * 3,
      r: 1.2 + Math.random() * 1.5,
      out: 0.9,
      y: Math.random() * 2,
      rise: 4 + Math.random() * 3,
    }),
    { gravity: 0, drag: 0, geometry: new T.TetrahedronGeometry(0.18) },
  );
  parts.push(k.flash(c.c, { at: 1.5, power: 60, size: 4 }), k.shock(c.b, { at: 1.5, dur: 0.7, to: 10 }));
  return {
    update(t, dt) {
      const grow = out(span(t, 0.2, 1.2)),
        fade = span(t, 2.8, 3.4);
      funnel.material.opacity = 0.4 * grow * (1 - fade);
      inner.material.opacity = 0.35 * grow * (1 - fade);
      funnel.rotation.y = t * 6;
      inner.rotation.y = -t * 8;
      funnel.scale.set(1, Math.max(0.01, grow), 1);
      inner.scale.set(1, Math.max(0.01, grow), 1);
      for (const r of rings) {
        const k2 = (t * 0.7 + r.phase) % 1,
          rad = 1.6 + k2 * 3.5;
        r.m.position.set(k.to.x, k2 * 13, k.to.z);
        r.m.scale.setScalar(rad);
        r.m.rotation.z = t * 7 + r.phase * 6;
        r.m.material.opacity = 0.8 * grow * (1 - fade) * Math.sin(k2 * Math.PI);
      }
      debris.update(t, dt);
      k.fx.lift = 4.2 * ease(span(t, 0.6, 1.5)) * (1 - ease(span(t, 2.6, 3.3))) + Math.sin(t * 5) * 0.2 * grow;
      for (const s of parts) s.update(t, dt);
      k.fx.shake = Math.max(k.fx.shake, t > 1.5 && t < 1.9 ? 0.45 : t > 0.4 && t < 2.8 ? 0.15 : 0);
    },
  };
}
function tempest(k) {
  const c = k.colors,
    parts = [],
    bolt = k.glow('#ffffff', 1),
    halo = k.glow('#4fc8ff', 0.55);
  const wheel = new T.Group();
  wheel.position.set(k.to.x, 19, k.to.z + 3);
  k.group.add(wheel);
  const disc = k.mesh(new T.CircleGeometry(15, 64), k.glow('#26384d', 0, { additive: false }), wheel);
  disc.rotation.x = Math.PI / 2;
  const arms = [0, 1, 2, 3].map(i => {
    const m = k.mesh(new T.TorusGeometry(6 + i * 2, 0.35, 6, 60, Math.PI * 1.2), k.glow(i % 2 ? c.a : c.b, 0), wheel);
    m.rotation.x = Math.PI / 2;
    return m;
  });
  const eye = k.mesh(new T.CircleGeometry(2.4, 32), k.glow(c.c, 0), wheel);
  eye.rotation.x = Math.PI / 2;
  eye.position.y = -0.1;
  const rain = k.particles(
    c.b,
    160,
    () => ({
      p: new T.Vector3(k.to.x + (Math.random() - 0.5) * 26, 18, k.to.z + 3 + (Math.random() - 0.5) * 22),
      v: new T.Vector3(-2, -22, 0),
      life: 0.9,
      size: 1,
      delay: 0.6 + Math.random() * 3.2,
    }),
    { gravity: 0, drag: 0, spin: 0, geometry: new T.BoxGeometry(0.03, 0.9, 0.03), opacity: 0.6 },
  );
  const strikes = [1.2, 1.45, 1.65, 1.85, 2.05, 2.4].map((at, i) => {
    const big = i === 5,
      end = big ? new T.Vector3(k.to.x, CORE_Y, k.to.z) : k.around(3 + Math.random() * 5, i * 1.9, 0),
      start = new T.Vector3(end.x + (Math.random() - 0.5) * 3, 19, end.z + (Math.random() - 0.5) * 3 + 2);
    const g = new T.Group();
    k.group.add(g);
    k.bolt(start, end, bolt, big ? 0.4 : 0.15, g);
    k.bolt(start, end, halo, big ? 1 : 0.4, g);
    g.visible = false;
    parts.push(
      k.flash('#eef8ff', { at, dur: big ? 0.6 : 0.25, power: big ? 200 : 50, size: big ? 7 : 2, p: end }),
      k.shock(big ? c.c : c.a, { at, dur: big ? 1.1 : 0.4, to: big ? 20 : 5 }),
    );
    return { g, at, big };
  });
  parts.push(
    rain,
    sparks(k, '#f8fdff', 90, { at: 2.4, speed: 15, up: 8, size: 1.4, geometry: new T.BoxGeometry(0.06, 0.06, 0.5) }),
  );
  return {
    update(t, dt) {
      const open = ease(span(t, 0, 1)),
        close = span(t, 3.2, 4.4);
      disc.material.opacity = 0.5 * open * (1 - close);
      arms.forEach((a, i) => {
        a.material.opacity = 0.7 * open * (1 - close);
        a.rotation.z = t * (1.5 + i * 0.4);
      });
      eye.material.opacity = (0.4 + 0.4 * Math.sin(t * 8)) * open * (1 - close);
      wheel.scale.setScalar(0.3 + 0.7 * out(span(t, 0, 1)));
      for (const s of strikes) {
        const live = t - s.at;
        s.g.visible = live >= 0 && live < (s.big ? 0.5 : 0.22) && Math.floor(live * 30) % 3 !== 2;
      }
      for (const s of parts) s.update(t, dt);
      k.fx.shake = Math.max(
        k.fx.shake,
        t > 2.4 && t < 3.2
          ? 1 * (1 - span(t, 2.4, 3.2))
          : strikes.some(s => t > s.at && t < s.at + 0.2)
            ? 0.35
            : t > 0.6
              ? 0.1
              : 0,
      );
    },
  };
}

// ——— Slytherin ———
function thorns(k, color, tip) {
  return { shaft: k.solid('#4b2f17', '#1a0d03', 0, 0.9), tip: k.solid(tip, color, 0.6, 0.6) };
}
function thornVolley(k) {
  const c = k.colors,
    parts = [],
    spikes = [],
    mat = thorns(k, c.a, '#9be25a');
  const dir = new T.Vector3(k.to.x - k.from.x, 0, k.to.z - k.from.z),
    len = dir.length();
  dir.normalize();
  const side = new T.Vector3(dir.z, 0, -dir.x);
  const waves = [
    [0.15, 0.55],
    [0.4, 0.8],
    [0.65, 1.1],
  ];
  waves.forEach(([a, b], w) => {
    const n = Math.round(9 * k.q) + 3;
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1),
        p = new T.Vector3(k.from.x, 0, k.from.z)
          .addScaledVector(dir, 1.5 + f * (len - 1.5))
          .addScaledVector(side, (w - 1) * 1.6 + (Math.random() - 0.5));
      const h = 1.6 + f * 3.5 + (w === 2 && f > 0.85 ? 4 : 0),
        m = k.mesh(new T.ConeGeometry(0.35 + f * 0.5, 1, 7), mat.tip);
      m.position.copy(p);
      m.rotation.set((Math.random() - 0.5) * 0.5, 0, (Math.random() - 0.5) * 0.5);
      spikes.push({ m, h, at: a + (b - a) * f });
    }
  });
  const crown = [0, 1, 2, 3, 4, 5].map(i => {
    const m = k.mesh(new T.ConeGeometry(0.9, 1, 7), mat.tip);
    m.position.copy(k.around(1.6, (i * Math.PI) / 3, 0));
    m.rotation.set(Math.cos((i * Math.PI) / 3) * 0.5, 0, -Math.sin((i * Math.PI) / 3) * 0.5);
    return { m, h: 8, at: 1.05 };
  });
  spikes.push(...crown);
  parts.push(
    k.flash(c.b, { at: 1.1, power: 70, size: 4 }),
    k.shock(c.b, { at: 1.1, dur: 0.6, to: 9 }),
    k.particles(
      c.b,
      70,
      () => {
        const a = Math.random() * Math.PI * 2;
        return {
          p: new T.Vector3(k.to.x, 2, k.to.z),
          v: new T.Vector3(Math.sin(a) * 6, 5 + Math.random() * 6, Math.cos(a) * 6),
          life: 1.6,
          size: 1.2,
          delay: 1.1,
        };
      },
      { gravity: -6, geometry: new T.PlaneGeometry(0.35, 0.2) },
    ),
  );
  return {
    update(t, dt) {
      const sink = span(t, 1.9, 2.6);
      for (const s of spikes) {
        const g = out(span(t, s.at, s.at + 0.16)) * (1 - sink);
        s.m.scale.set(Math.max(0.01, g), Math.max(0.01, s.h * g), Math.max(0.01, g));
        s.m.position.y = (s.h * g) / 2 - 0.2;
      }
      for (const s of parts) s.update(t, dt);
      k.fx.shake = Math.max(
        k.fx.shake,
        spikes.some(s => Math.abs(t - s.at) < 0.05) ? 0.2 : t > 1.05 && t < 1.4 ? 0.45 : 0,
      );
    },
  };
}
function rootBind(k) {
  const c = k.colors,
    parts = [],
    roots = [],
    bark = k.solid('#5a3a1c', '#2a5a12', 0.25, 0.95),
    moss = k.glow(c.b, 0.55);
  const N = Math.max(4, Math.round(6 * k.q));
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2,
      pts = [];
    for (let j = 0; j <= 24; j++) {
      const f = j / 24,
        a = a0 + f * Math.PI * 2.4 * (i % 2 ? 1 : -1),
        r = 5.5 - 3 * f + Math.sin(f * 9) * 0.3;
      pts.push(new T.Vector3(k.to.x + Math.sin(a) * r, -0.5 + f * 10, k.to.z + Math.cos(a) * r));
    }
    const curve = new T.CatmullRomCurve3(pts),
      geo = new T.TubeGeometry(curve, 96, 0.42 - i * 0.02, 8, false),
      m = k.mesh(geo, bark),
      glow = k.mesh(new T.TubeGeometry(curve, 96, 0.55, 6, false), moss);
    roots.push({ m, glow, at: 0.2 + i * 0.1, count: geo.index.count });
  }
  parts.push(
    k.flash(c.b, { at: 1.5, power: 60, size: 4 }),
    k.shock(c.a, { at: 1.5, dur: 0.7, to: 10 }),
    k.particles(
      c.b,
      70,
      () => {
        const a = Math.random() * Math.PI * 2,
          r = 3 + Math.random() * 2;
        return {
          p: k.around(r, a, Math.random() * 9),
          v: new T.Vector3(Math.sin(a) * 2, 1 + Math.random() * 2, Math.cos(a) * 2),
          life: 2,
          size: 1.1,
          delay: 0.6 + Math.random() * 2,
        };
      },
      { gravity: -1.5, geometry: new T.PlaneGeometry(0.35, 0.2) },
    ),
  );
  const rim = k.mesh(new T.RingGeometry(4.5, 6.5, 48), k.glow(c.dark, 0, { additive: false }));
  rim.rotation.x = -Math.PI / 2;
  rim.position.set(k.to.x, 0.05, k.to.z);
  return {
    update(t, dt) {
      const recede = span(t, 2.8, 3.4);
      rim.material.opacity = 0.6 * ease(span(t, 0, 0.4)) * (1 - recede);
      for (const r of roots) {
        const g = out(span(t, r.at, r.at + 1.1)) * (1 - recede),
          n = Math.floor((g * r.count) / 3) * 3;
        r.m.geometry.setDrawRange(0, n);
        r.glow.geometry.setDrawRange(0, Math.floor((g * r.glow.geometry.index.count) / 3) * 3);
        r.glow.material.opacity = 0.3 + 0.25 * Math.sin(t * 6);
        const squeeze = 1 - 0.08 * ease(span(t, 1.4, 1.7));
        r.m.scale.set(squeeze, 1, squeeze);
        r.m.position.set(k.to.x * (1 - squeeze), 0, k.to.z * (1 - squeeze));
        r.glow.scale.copy(r.m.scale);
        r.glow.position.copy(r.m.position);
      }
      for (const s of parts) s.update(t, dt);
      k.fx.shake = Math.max(k.fx.shake, t > 0.2 && t < 1.4 ? 0.15 : t > 1.5 && t < 1.9 ? 0.4 : 0);
    },
  };
}
function ancientGrove(k) {
  const c = k.colors,
    parts = [],
    bark = k.solid('#6b4424', '#1c3a0e', 0.15, 0.95),
    leaf = k.solid('#3c9a3a', '#5ee05a', 0.45, 0.8),
    bloom = k.glow(c.b, 0.55); // The tree rises just behind the guardian; its roots lift the guardian and the canopy arches over it.
  const tree = new T.Group();
  tree.position.set(k.to.x, 0, k.to.z - 4.2);
  k.group.add(tree);
  const trunk = k.mesh(new T.CylinderGeometry(1.6, 3.2, 1, 14), bark, tree);
  trunk.geometry.translate(0, 0.5, 0);
  const branches = [0, 1, 2, 3, 4, 5].map(i => {
    const a = (i / 6) * Math.PI * 2 + 0.4,
      g = new T.Group();
    tree.add(g);
    g.rotation.y = a;
    const b = k.mesh(new T.CylinderGeometry(0.35, 0.75, 1, 8), bark, g);
    b.geometry.translate(0, 0.5, 0);
    b.rotation.z = -1.0;
    return { g, b, len: 5 + Math.random() * 2 };
  });
  const crowns = Array.from({ length: Math.max(5, Math.round(9 * k.q)) }, (_, i) => {
    const a = (i / 9) * Math.PI * 2,
      m = k.mesh(new T.IcosahedronGeometry(1, 1), leaf, tree);
    m.userData = {
      a,
      r: i === 0 ? 0 : 4 + Math.random() * 3,
      y: i === 0 ? 3 : Math.random() * 2,
      s: i === 0 ? 5 : 2.6 + Math.random() * 1.4,
      z: i === 0 ? 0 : 2.5,
    };
    return m;
  });
  const ground = k.mesh(new T.RingGeometry(1, 1.3, 64), k.glow(c.b, 0));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(k.to.x, 0.05, k.to.z);
  const cracks = [0, 1, 2, 3, 4, 5, 6, 7].map(i => {
    const m = k.mesh(new T.PlaneGeometry(0.25, 1), bloom);
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = (i / 8) * Math.PI * 2;
    m.position.set(k.to.x, 0.06, k.to.z);
    return m;
  });
  parts.push(
    k.flash(c.c, { at: 2.4, dur: 0.7, power: 120, size: 7, p: new T.Vector3(k.to.x, 16, k.to.z) }),
    k.shock(c.b, { at: 2.4, dur: 1.2, to: 20 }),
    k.shock(c.a, { at: 0.8, dur: 0.6, to: 8 }),
    k.particles(
      c.b,
      140,
      () => {
        const a = Math.random() * Math.PI * 2,
          s = 3 + Math.random() * 9;
        return {
          p: new T.Vector3(k.to.x, 17, k.to.z),
          v: new T.Vector3(Math.sin(a) * s, 2 + Math.random() * 6, Math.cos(a) * s),
          life: 2.2,
          size: 1.3,
          delay: 2.3 + Math.random() * 0.3,
        };
      },
      { gravity: -4, drag: 0.8, geometry: new T.PlaneGeometry(0.4, 0.24) },
    ),
  );
  return {
    update(t, dt) {
      const crack = ease(span(t, 0, 0.8)),
        grow = out(span(t, 0.8, 2.2)),
        sink = ease(span(t, 3.4, 4.4)),
        h = Math.max(0.01, 15 * grow * (1 - sink));
      ground.scale.setScalar(1 + 9 * crack);
      ground.material.opacity = 0.8 * crack * (1 - sink);
      cracks.forEach((m, i) => {
        m.scale.set(1, 1 + 10 * crack, 1);
        m.position.set(k.to.x + Math.sin((i / 8) * Math.PI * 2) * (0.5 + 5 * crack) * 0, 0.06, k.to.z);
        m.material.opacity = 0.6 * crack * (1 - span(t, 1, 1.8));
      });
      trunk.scale.set(1, h, 1);
      for (const b of branches) {
        const g2 = out(span(t, 1.5, 2.3)) * (1 - sink);
        b.g.position.y = h * 0.78;
        b.b.scale.set(Math.max(0.01, g2), Math.max(0.01, b.len * g2), Math.max(0.01, g2));
      }
      const leaves = out(span(t, 1.9, 2.5)) * (1 - sink);
      for (const m of crowns) {
        const u = m.userData;
        m.position.set(Math.sin(u.a) * u.r, h + u.y, Math.cos(u.a) * u.r + u.z);
        m.scale.setScalar(Math.max(0.01, u.s * leaves * (1 + 0.05 * Math.sin(t * 3 + u.a))));
      }
      k.fx.lift = 3.2 * ease(span(t, 1, 2.3)) * (1 - ease(span(t, 3.3, 4.2)));
      for (const s of parts) s.update(t, dt);
      k.fx.shake = Math.max(
        k.fx.shake,
        t > 0.8 && t < 2.3 ? 0.3 : t > 2.4 && t < 3.1 ? 0.8 * (1 - span(t, 2.4, 3.1)) : 0,
      );
    },
  };
}

const BUILD = {
  'fire-pillars': firePillars,
  'flame-prison': flamePrison,
  'meteor-storm': meteorStorm,
  'ice-spears': iceSpears,
  'frost-lock': frostLock,
  'tidal-wave': tidalWave,
  thunderbolt: thunderbolt,
  updraft: updraft,
  tempest: tempest,
  'thorn-volley': thornVolley,
  'root-bind': rootBind,
  'ancient-grove': ancientGrove,
};
export const SPECIAL_FX_IDS = Object.keys(BUILD);
export class SpecialFX {
  // One light is kept for every flash (lights:false for small previews): adding and removing lights would make the
  // renderer rebuild its shaders mid-effect, a visible hitch on phones.
  constructor(parent, { lights = true } = {}) {
    this.root = new T.Group();
    this.root.name = 'special-fx';
    parent.add(this.root);
    this.active = [];
    this.shake = 0;
    this.lift = 0;
    this.quality = 1;
    if (lights) {
      this.light = new T.PointLight('#ffffff', 0, 40, 1.6);
      this.root.add(this.light);
    }
  }
  play(spec, from, to, { effects = 'medium' } = {}) {
    this.quality = effects === 'low' ? 0.4 : effects === 'high' ? 1 : 0.7;
    const k = new Kit(this, spec, new T.Vector3(from.x, from.y || 0, from.z), new T.Vector3(to.x, 0, to.z)),
      fx = BUILD[spec.id](k);
    this.active.push({ k, fx, t: 0, dur: spec.duration + 0.2 });
    return k.group;
  }
  update(dt) {
    this.shake = 0;
    this.lift = 0;
    if (this.light) this.light.intensity = 0;
    for (const a of this.active) {
      a.t += dt;
      a.fx.update(a.t, dt);
    }
    this.active = this.active.filter(a => {
      if (a.t < a.dur) return true;
      a.k.dispose();
      return false;
    });
  }
  get playing() {
    return this.active.length > 0;
  }
  dispose() {
    for (const a of this.active) a.k.dispose();
    this.active = [];
    this.light?.dispose?.();
    this.root.removeFromParent();
  }
}
