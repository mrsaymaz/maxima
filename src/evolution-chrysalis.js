import * as T from './vendor/three.module.min.js';
// The Elemental Chrysalis (0.62): the evolution as five beats, layered on the evolution stage.
//  1. Call      a rune circle ignites under the creature in its team colour.
//  2. Gather    the element streams in from the horizon on spiralling paths (fire comets, water droplets, wind streaks,
//               leaves).
//  3. Chrysalis the element wraps the creature in a shell (a molten cocoon with glowing cracks, a water sphere with
//               shimmering light, a spinning tornado, a braided seed pod) that beats like a heart while light leaks out.
//  4. Burst     the shell shatters in slow motion: shards fly past the camera, shockwaves race across the floor and up.
//  5. Reveal    the new form lands inside an aura of rising sparks while confetti in the element's colours falls.
// Times come from the element's score (evolution-timeline.js), so the swap of forms stays hidden in the burst's light.
const clamp = x => Math.max(0, Math.min(1, x)),
  ease = x => {
    x = clamp(x);
    return x * x * (3 - 2 * x);
  },
  span = (t, a, b) => clamp((t - a) / (b - a));
const LOOK = {
  fire: {
    shell: '#2a0b04',
    glowc: '#ff4a10',
    core: '#ffd36b',
    crack: '#ffe08a',
    stream: '#ff8a2a',
    shard: '#ff5a14',
    confetti: ['#ffb238', '#ff6a1f', '#fff1b0'],
  },
  water: {
    shell: '#3fb6ff',
    core: '#d9f6ff',
    crack: '#ffffff',
    stream: '#7fd8ff',
    shard: '#9fe6ff',
    confetti: ['#7fd8ff', '#2f8bff', '#e8fbff'],
  },
  air: {
    shell: '#bff4ff',
    core: '#ffffff',
    crack: '#ffffff',
    stream: '#e9fbff',
    shard: '#d9f6ff',
    confetti: ['#e9fbff', '#9fe8ff', '#fff6c9'],
  },
  nature: {
    shell: '#3f8f3a',
    glowc: '#7fe05a',
    core: '#d9ff8a',
    crack: '#efffc4',
    stream: '#8fe05a',
    shard: '#6fcf4a',
    confetti: ['#a6f05a', '#ffd36b', '#ff8fb3'],
  },
};
// Effects finish by the score's clear time, so the new form's final hold is unobstructed.
export function chrysalisTimes(score) {
  return {
    call: score.sparkEnd,
    gather: score.gatherEnd,
    closed: score.gatherEnd + 0.8,
    burst: score.veilPeak,
    reveal: score.veilEnd,
    end: score.clear,
  };
}
export class Chrysalis {
  constructor(element, palette, height, size, score, { reduced = false } = {}) {
    this.element = LOOK[element] ? element : 'air';
    this.look = LOOK[this.element];
    this.h = height;
    this.s = size;
    this.times = chrysalisTimes(score);
    this.reduced = reduced;
    this.shake = 0;
    this.pulse = 0;
    this.root = new T.Group();
    this.root.name = 'evolution-chrysalis';
    this.owned = [];
    this.dummy = new T.Object3D();
    const glow = (color, opacity = 1) =>
      this.own(
        new T.MeshBasicMaterial({
          color,
          transparent: true,
          opacity,
          depthWrite: false,
          side: T.DoubleSide,
          blending: T.AdditiveBlending,
          toneMapped: false,
        }),
      );
    const tint = palette.color || this.look.shell;
    // 1. The rune circle: two rings and a ring of glyph strokes, turning slowly.
    this.rune = new T.Group();
    this.root.add(this.rune);
    this.runeMats = [glow(tint, 0), glow(this.look.core, 0)];
    for (const [r, w, m] of [
      [size * 2.1, 0.05, 0],
      [size * 1.55, 0.035, 1],
    ]) {
      const ring = new T.Mesh(this.own(new T.RingGeometry(r - w * size, r, 96)), this.runeMats[m]);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.02;
      this.rune.add(ring);
    }
    const glyph = this.own(new T.PlaneGeometry(size * 0.08, size * 0.28));
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2,
        g = new T.Mesh(glyph, this.runeMats[i % 3 ? 0 : 1]);
      g.rotation.set(-Math.PI / 2, 0, -a);
      g.position.set(Math.sin(a) * size * 1.83, 0.022, Math.cos(a) * size * 1.83);
      this.rune.add(g);
    }
    // 2. Gathering streams.
    const n = reduced ? 16 : 42,
      streamGeo =
        this.element === 'fire'
          ? new T.ConeGeometry(0.06 * size, 0.34 * size, 6).rotateX(Math.PI / 2)
          : this.element === 'water'
            ? new T.SphereGeometry(0.07 * size, 10, 8)
            : this.element === 'air'
              ? new T.BoxGeometry(0.025 * size, 0.025 * size, 0.5 * size)
              : new T.PlaneGeometry(0.16 * size, 0.09 * size);
    this.streams = new T.InstancedMesh(this.own(streamGeo), glow(this.look.stream, 0.95), n);
    this.streams.frustumCulled = false;
    this.root.add(this.streams);
    this.streamSeeds = Array.from({ length: n }, (_, i) => ({
      a: (i / n) * Math.PI * 2 * 3 + Math.random(),
      y: 0.2 + Math.random() * 1.4,
      delay: Math.random() * 0.55,
      turns: 0.9 + Math.random() * 0.7,
    }));
    // 3. The shell, shaped per element, with a bright core showing through its cracks.
    this.shell = new T.Group();
    this.root.add(this.shell);
    this.shell.position.y = height * 0.5;
    this.shellScale = new T.Vector3(size * 0.95, height * 0.62, size * 0.95);
    this.coreMat = glow(this.look.core, 0);
    this.core = new T.Mesh(this.own(new T.SphereGeometry(1, 24, 16)), this.coreMat);
    this.shell.add(this.core);
    this.shellMat = this.own(
      new T.MeshStandardMaterial({
        color: this.look.shell,
        emissive: this.look.glowc || this.look.shell,
        emissiveIntensity: 0.25,
        roughness: 0.35,
        metalness: 0.1,
        flatShading: true,
        transparent: this.element === 'water',
        opacity: this.element === 'water' ? 0.62 : 1,
        side: T.DoubleSide,
      }),
    );
    this.crackMat = new T.LineBasicMaterial({
      color: this.look.crack,
      transparent: true,
      opacity: 0,
      toneMapped: false,
      blending: T.AdditiveBlending,
    });
    this.owned.push(this.crackMat);
    if (this.element === 'air') {
      this.rings = [];
      for (let i = 0; i < 9; i++) {
        const m = new T.Mesh(
          this.own(new T.TorusGeometry(1, 0.06, 6, 48, Math.PI * 1.5)),
          glow(i % 2 ? this.look.shell : this.look.core, 0.8),
        );
        m.rotation.x = Math.PI / 2;
        this.shell.add(m);
        this.rings.push({ m, y: (i / 8) * 2 - 1, r: Math.sqrt(1 - ((i / 8) * 2 - 1) ** 2) * 1.02 + 0.15 });
      }
    } else {
      const body = new T.Mesh(this.own(new T.IcosahedronGeometry(1, this.element === 'water' ? 3 : 1)), this.shellMat);
      this.shell.add(body);
      this.body = body;
      const cracks = new T.LineSegments(
        this.own(new T.EdgesGeometry(new T.IcosahedronGeometry(1.01, 1))),
        this.crackMat,
      );
      this.shell.add(cracks);
      if (this.element === 'nature') {
        const vine = this.own(new T.MeshStandardMaterial({ color: '#2f6e31', roughness: 0.8, flatShading: true }));
        for (let k = 0; k < 5; k++) {
          const pts = [];
          for (let j = 0; j <= 40; j++) {
            const f = j / 40,
              a = (k / 5) * Math.PI * 2 + f * Math.PI * 3;
            const r = Math.sin(f * Math.PI) * 1.06 + 0.02;
            pts.push(new T.Vector3(Math.sin(a) * r, f * 2 - 1, Math.cos(a) * r));
          }
          this.shell.add(
            new T.Mesh(this.own(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 80, 0.06, 6, false)), vine),
          );
        }
      }
    }
    this.shell.scale.setScalar(0.0001);
    // 4. The burst: shards in slow motion, floor and sky shockwaves, a white flash.
    const shardCount = reduced ? 14 : 46;
    this.shards = new T.InstancedMesh(
      this.own(new T.TetrahedronGeometry(0.12 * size, 0)),
      this.own(
        new T.MeshStandardMaterial({
          color: this.look.shard,
          emissive: this.look.shard,
          emissiveIntensity: 0.8,
          flatShading: true,
          roughness: 0.4,
        }),
      ),
      shardCount,
    );
    this.shards.frustumCulled = false;
    this.root.add(this.shards);
    this.shardSeeds = Array.from({ length: shardCount }, (_, i) => {
      const a = Math.random() * Math.PI * 2,
        up = Math.random() * 1.2 - 0.2,
        toward = i % 4 === 0;
      return {
        v: new T.Vector3(
          Math.sin(a) * (1.4 + Math.random() * 1.8),
          up * 2 + 1,
          Math.cos(a) * (1.4 + Math.random() * 1.8) + (toward ? 3.2 : 0),
        ),
        spin: new T.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6),
      };
    });
    this.waves = [0, 1, 2].map(i => {
      const m = new T.Mesh(
        this.own(i < 2 ? new T.RingGeometry(0.9, 1, 96) : new T.SphereGeometry(1, 32, 16)),
        glow(i === 1 ? this.look.core : tint, 0),
      );
      if (i < 2) {
        m.rotation.x = -Math.PI / 2;
        m.position.y = 0.03;
      } else m.position.y = height * 0.5;
      this.root.add(m);
      return m;
    });
    this.flash = new T.Mesh(this.own(new T.SphereGeometry(1, 24, 16)), glow('#ffffff', 0));
    this.flash.position.y = height * 0.5;
    this.root.add(this.flash);
    // 5. The reveal: rising sparks around the new form, and confetti in the element's colours.
    const sparkN = reduced ? 12 : 36;
    this.sparks = new T.InstancedMesh(
      this.own(new T.OctahedronGeometry(0.045 * size, 0)),
      glow(this.look.core, 0.95),
      sparkN,
    );
    this.sparks.frustumCulled = false;
    this.root.add(this.sparks);
    this.sparkSeeds = Array.from({ length: sparkN }, () => ({
      a: Math.random() * Math.PI * 2,
      r: 0.55 + Math.random() * 0.6,
      speed: 0.5 + Math.random() * 0.9,
      phase: Math.random(),
    }));
    const confN = reduced ? 0 : 60;
    this.confetti = confN
      ? this.look.confetti.map(c => {
          const m = new T.InstancedMesh(
            this.own(new T.PlaneGeometry(0.07 * size, 0.11 * size)),
            this.own(new T.MeshBasicMaterial({ color: c, side: T.DoubleSide, toneMapped: false })),
            Math.ceil(confN / 3),
          );
          m.frustumCulled = false;
          this.root.add(m);
          return m;
        })
      : [];
    const window = Math.max(0.8, this.times.end - this.times.burst - 0.3);
    this.confSeeds = Array.from({ length: Math.ceil(confN / 3) * 3 }, () => {
      const top = height * 2.2 + Math.random() * height * 1.6;
      return {
        x: (Math.random() - 0.5) * size * 5,
        z: (Math.random() - 0.5) * size * 4 + size,
        top,
        fall: top / height / (window * (0.75 + Math.random() * 0.25)),
        spin: Math.random() * 8,
        sway: Math.random() * 6,
      };
    });
  }
  own(x) {
    this.owned.push(x);
    return x;
  }
  hide(m, i) {
    this.dummy.position.set(0, -999, 0);
    this.dummy.scale.setScalar(0);
    this.dummy.updateMatrix();
    m.setMatrixAt(i, this.dummy.matrix);
  }
  update(t) {
    const { call, gather, closed, burst, reveal, end } = this.times,
      s = this.s,
      h = this.h,
      d = this.dummy;
    this.shake = 0;
    this.pulse = 0;
    // Rune circle.
    const runeOn = ease(span(t, 0, call + 0.4)) * (1 - ease(span(t, end - 1.2, end)));
    this.rune.rotation.y = t * 0.35;
    this.runeMats[0].opacity = runeOn * (0.75 + 0.25 * Math.sin(t * 6)) * (t > burst && t < burst + 0.6 ? 1.4 : 1);
    this.runeMats[1].opacity = runeOn * 0.55;
    this.rune.scale.setScalar(
      0.6 + 0.4 * ease(span(t, 0, call + 0.4)) + (t > burst ? 0.25 * ease(span(t, burst, burst + 0.6)) : 0),
    );
    // Streams: spiral in from far away and vanish into the creature.
    this.streamSeeds.forEach((q, i) => {
      const k = span(t, call * 0.6 + q.delay * (gather - call), gather + 0.35),
        on = k > 0 && k < 1;
      if (!on) {
        this.hide(this.streams, i);
        return;
      }
      const r = s * 6 * (1 - ease(k)) + s * 0.12,
        a = q.a + k * Math.PI * 2 * q.turns,
        y = h * (0.5 + (q.y - 0.5) * (1 - k) * 1.6);
      d.position.set(Math.sin(a) * r, y, Math.cos(a) * r);
      const ahead = a + 0.25;
      d.lookAt(Math.sin(ahead) * r * 0.9, y, Math.cos(ahead) * r * 0.9);
      d.scale.setScalar(1.2 - k * 0.5);
      d.updateMatrix();
      this.streams.setMatrixAt(i, d.matrix);
    });
    this.streams.instanceMatrix.needsUpdate = true;
    // Shell: forms after the gathering, beats faster and faster, cracks open and lets the light out.
    const form = ease(span(t, gather, closed)),
      live = t >= gather && t < burst,
      beatT = span(t, closed, burst);
    let beat = 0;
    for (const at of [0.12, 0.42, 0.64, 0.8, 0.9, 0.97]) {
      const dt = beatT - at;
      if (dt >= 0 && dt < 0.09) beat = Math.max(beat, Math.sin((dt / 0.09) * Math.PI));
    }
    this.pulse = beat;
    this.shell.visible = live;
    if (live) {
      this.shell.scale.copy(this.shellScale).multiplyScalar(Math.max(0.0001, form * (1 + beat * 0.09)));
      this.shell.rotation.y = t * (this.element === 'air' ? 5 : 0.6);
      this.coreMat.opacity = Math.min(0.7, (0.18 + beatT * 0.5) * (0.6 + beat * 0.5));
      this.core.scale.setScalar(0.82);
      this.crackMat.opacity = Math.min(1, beatT * 1.15 + beat * 0.4);
      if (this.shellMat)
        this.shellMat.emissiveIntensity = (this.look.glowc ? 0.2 + beatT * 0.9 : 0.4 + beatT * 1.1) + beat * 0.9;
      if (this.rings)
        for (const g of this.rings) {
          g.m.position.y = g.y;
          g.m.scale.setScalar(g.r * (1 - 0.12 * beatT));
          g.m.rotation.z = t * (4 + g.y * 2);
        }
      if (this.body && this.element === 'water') this.body.scale.setScalar(1 + 0.04 * Math.sin(t * 9));
    }
    this.shake = Math.max(this.shake, beat * 0.06);
    // Burst: slow motion for the first moments, then the shards fall away.
    const b = t - burst,
      slow = b < 0.45 ? b * 0.35 : 0.1575 + (b - 0.45);
    this.shardSeeds.forEach((q, i) => {
      if (b < 0 || b > 2.8) {
        this.hide(this.shards, i);
        return;
      }
      d.position.set(q.v.x * slow * s, h * 0.5 + q.v.y * slow * s - 1.6 * slow * slow * s, q.v.z * slow * s);
      d.rotation.set(q.spin.x * slow, q.spin.y * slow, q.spin.z * slow);
      d.scale.setScalar(1.1 * (1 - span(b, 1.8, 2.8)));
      d.updateMatrix();
      this.shards.setMatrixAt(i, d.matrix);
    });
    this.shards.instanceMatrix.needsUpdate = true;
    this.waves.forEach((m, i) => {
      const k = span(b, i * 0.12, i * 0.12 + (i < 2 ? 1.3 : 1)),
        on = b >= i * 0.12 && k < 1;
      m.visible = on;
      if (on) {
        const r = s * (0.5 + (i < 2 ? 6 : 3.2) * ease(k));
        m.scale.setScalar(r);
        m.material.opacity = (i < 2 ? 0.85 : 0.35) * (1 - k);
      }
    });
    const fk = span(b, 0, 0.55);
    this.flash.visible = b >= 0 && fk < 1;
    if (this.flash.visible) {
      this.flash.scale.setScalar(s * (0.6 + 2.4 * ease(fk)));
      this.flash.material.opacity = 0.9 * (1 - fk) ** 1.5;
    }
    if (b >= 0 && b < 0.7) this.shake = Math.max(this.shake, 0.22 * (1 - b / 0.7));
    // Reveal: rising sparks and falling confetti.
    const aura = b > 0 ? ease(span(t, burst + 0.2, burst + 0.8)) * (1 - ease(span(t, end - 1.4, end))) : 0;
    this.sparkSeeds.forEach((q, i) => {
      if (aura <= 0) {
        this.hide(this.sparks, i);
        return;
      }
      const k = (t * q.speed + q.phase) % 1,
        a = q.a + t * 0.8;
      d.position.set(Math.sin(a) * q.r * s, k * h * 1.4, Math.cos(a) * q.r * s);
      d.rotation.set(0, t * 3, 0);
      d.scale.setScalar(aura * (1 - k) * 1.2);
      d.updateMatrix();
      this.sparks.setMatrixAt(i, d.matrix);
    });
    this.sparks.instanceMatrix.needsUpdate = true;
    this.confetti.forEach((m, c) => {
      for (let i = 0; i < m.count; i++) {
        const q = this.confSeeds[c * m.count + i],
          k = t - burst - 0.25;
        if (k < 0 || k * q.fall * h > q.top + 0.2) {
          this.hide(m, i);
          continue;
        }
        d.position.set(q.x + Math.sin(k * 2 + q.sway) * 0.25 * s, q.top - k * q.fall * h, q.z);
        d.rotation.set(k * q.spin, k * q.spin * 0.7, k * 2);
        d.scale.setScalar(1);
        d.updateMatrix();
        m.setMatrixAt(i, d.matrix);
      }
      m.instanceMatrix.needsUpdate = true;
    });
  }
  // Effects are off for the final clear hold of the new form (the face/body stays unobstructed).
  get busy() {
    return true;
  }
  dispose() {
    this.root.removeFromParent();
    for (const x of this.owned) x.dispose?.();
    this.owned = [];
  }
}
