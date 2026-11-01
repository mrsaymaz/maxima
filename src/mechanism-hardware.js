import * as T from './vendor/three.module.min.js';

const clamp = x => Math.max(0, Math.min(1, Number.isFinite(x) ? x : 0));
const smooth = x => {
  x = clamp(x);
  return x * x * (3 - 2 * x);
};
// Derived entirely from the existing task checkpoint. Selections and mistakes never power a part.
export function taskMechanismState(task) {
  if (!task) return null;
  const groups =
    task.kind === 'pairs'
      ? task.pairs.map((_, i) => ({ id: 'pair-' + i, steps: [task.complete || task.matched.includes(i) ? 1 : 0] }))
      : task.rounds.map((q, i) => {
          const count = q.kind === 'blocks' ? q.correct.length : q.kind === 'repair' ? 2 : 1,
            done = task.complete || i < task.round;
          return {
            id: 'round-' + i,
            weights: q.kind === 'repair' ? [0.4, 0.6] : Array(count).fill(1 / count),
            steps: Array.from({ length: count }, (_, n) =>
              done
                ? 1
                : i !== task.round
                  ? 0
                  : q.kind === 'blocks'
                    ? n < task.used.length
                      ? 1
                      : 0
                    : q.kind === 'repair' && n === 0 && task.repairFound
                      ? 1
                      : 0,
            ),
          };
        });
  return {
    type: task.type,
    groups,
    complete: !!task.complete,
    fraction:
      groups.reduce((n, g) => n + g.steps.reduce((a, b, i) => a + b * (g.weights?.[i] ?? 1 / g.steps.length), 0), 0) /
      groups.length,
  };
}

export const HARDWARE_PROFILES = {
  translation: ['paired-bolts', 'winch'],
  sentence: ['stone-sockets', 'piston'],
  intruder: ['pruning-grips', 'reel'],
  'listen-word': ['echo-clappers', 'bell'],
  numbers: ['weight-hooks', 'balance'],
  ending: ['fruit-catches', 'basket'],
  correct: ['direction-detents', 'sign'],
  spelling: ['cleansing-valves', 'filter'],
  'listen-tr': ['tuning-sockets', 'chime'],
  halves: ['log-couplers', 'hinge'],
  'qa-pairs': ['scroll-receivers', 'spool'],
  gap: ['sluice-stops', 'valve'],
  repair: ['replacement-keyways', 'key'],
  answer: ['perch-catches', 'latch'],
  sort: ['cargo-stops', 'cart'],
  definition: ['totem-detents', 'track'],
  picture: ['crate-bolts', 'lid'],
  clue: ['cache-ratchets', 'rack'],
  'listen-multi': ['delivery-pans', 'pan'],
  instructions: ['strap-anchors', 'buckle'],
};

// Small, supported input assemblies sit below reading pieces in close-up, or on a verge pedestal on the trail.
// Each checkpoint item owns a receiver, moving input, shaft and a visible route to the driven component.
export function mechanismHardware(k, type, { stage = false, targets = [] } = {}) {
  const profile = HARDWARE_PROFILES[type],
    { mesh, box, cyl, geo, m, stretch } = k,
    root = new T.Group(),
    moving = new Set();
  const rod = (...args) => {
    const o = k.rod(...args);
    moving.add(o);
    return o;
  };
  root.name = 'mechanical-drive-' + type;
  root.userData.profile = profile[0];
  root.position.set(stage ? 2.62 : 3.35, 0, stage ? 0.8 : 0.45);
  const units = [],
    channels = [],
    connections = [],
    v = new T.Vector3(),
    end = new T.Vector3();
  const ringGeo = geo('hardware-collar', () => new T.TorusGeometry(0.105, 0.028, 5, 12));
  const pinGeo = cyl(0.045, 0.045, 0.24, 6),
    shaftGeo = cyl(0.055, 0.055, 0.44, 8);
  const support = mesh(box(0.44, 1.65, 0.4, 0.045), m.wood, 0, 0.825, -0.16, root);
  support.name = 'drive-support';
  mesh(box(0.62, 0.12, 0.6, 0.025), m.stone, 0, 0.06, -0.12, root);
  for (let i = 0; i < 3; i++) {
    const group = new T.Group();
    group.position.set(0, 0.35 + i * 0.49, 0);
    group.name = profile[0] + '-' + i;
    root.add(group);
    const collar = mesh(ringGeo, m.metal, 0, 0, 0.13, group);
    collar.name = 'receiver-' + i;
    const shaft = mesh(shaftGeo, m.metal, 0, 0, -0.02, group);
    shaft.rotation.x = Math.PI / 2;
    const input = mesh(pinGeo, m.metal, 0, 0, 0.31, group);
    input.rotation.x = Math.PI / 2;
    input.name = 'accepted-input-' + i;
    const lever = new T.Group();
    lever.position.z = -0.02;
    group.add(lever);
    mesh(box(0.055, 0.26, 0.045, 0.012), m.metal, 0, 0.1, 0, lever);
    mesh(cyl(0.055, 0.055, 0.055, 6), m.dark, 0, 0.22, 0, lever).rotation.x = Math.PI / 2;
    const detent = mesh(box(0.045, 0.1, 0.05, 0.008), m.dark, 0.11, -0.04, 0.03, group);
    detent.name = 'ratchet-stop';
    const receiver = profile[1];
    let part,
      other = null;
    if (['winch', 'reel', 'spool', 'rack'].includes(receiver)) {
      part = mesh(cyl(0.12, 0.12, 0.18, 10), m.wood, -0.3, 0, -0.08, group);
      part.rotation.x = Math.PI / 2;
      for (const z of [-0.19, 0.03])
        mesh(cyl(0.15, 0.15, 0.035, 10), m.metal, -0.3, 0, z, group).rotation.x = Math.PI / 2;
      other = mesh(box(0.065, 0.2, 0.065, 0.012), m.metal, -0.3, -0.13, 0.12, group);
    } else if (['valve', 'filter'].includes(receiver)) {
      part = mesh(box(0.2, 0.19, 0.045, 0.015), m.metal, -0.3, 0, 0.02, group);
      for (const x of [-0.43, -0.17]) mesh(box(0.04, 0.35, 0.12, 0.01), m.stone, x, -0.04, 0, group);
      other = mesh(box(0.14, 0.025, 0.17, 0.005), m.glow, -0.3, -0.14, 0.13, group);
      other.name = 'flow-port';
    } else if (['balance', 'basket', 'pan'].includes(receiver)) {
      const beam = new T.Group();
      beam.position.set(-0.3, 0.12, 0.0);
      group.add(beam);
      mesh(box(0.38, 0.035, 0.045, 0.008), m.wood, 0, 0, 0, beam);
      mesh(cyl(0.04, 0.04, 0.1, 8), m.metal, -0.3, 0.12, 0, group).rotation.x = Math.PI / 2;
      part = beam;
      other = mesh(cyl(0.11, 0.075, 0.06, 10), m.metal, -0.15, -0.02, 0, group);
      const hanger = rod(m.ink, 0.009, group);
      stretch(hanger, new T.Vector3(-0.15, 0.12, 0), new T.Vector3(-0.15, -0.02, 0));
      channels.push(() => {
        const p = new T.Vector3(0.15, 0, 0).applyEuler(beam.rotation).add(beam.position);
        other.position.set(p.x, p.y - 0.15, p.z);
        stretch(hanger, p, other.position);
      });
    } else if (['bell', 'chime'].includes(receiver)) {
      const pivot = new T.Group();
      pivot.position.set(-0.3, 0.15, 0);
      group.add(pivot);
      mesh(cyl(0.12, 0.045, 0.16, 8), receiver === 'chime' ? m.bell : m.metal, 0, -0.1, 0, pivot);
      part = new T.Group();
      part.position.set(0, -0.02, 0);
      pivot.add(part);
      mesh(cyl(0.018, 0.018, 0.14, 6), m.metal, 0, -0.07, 0, part);
      mesh(cyl(0.04, 0.04, 0.045, 6), m.dark, 0, -0.14, 0, part);
      mesh(box(0.18, 0.035, 0.16, 0.01), m.wood, -0.3, 0.19, 0, group);
    } else if (['hinge', 'lid', 'buckle', 'sign', 'latch', 'key'].includes(receiver)) {
      const pivot = new T.Group();
      pivot.position.set(-0.4, -0.1, 0);
      group.add(pivot);
      part = pivot;
      mesh(box(0.23, 0.19, 0.05, 0.015), receiver === 'key' ? m.metal : m.wood, 0.1, 0.085, 0, pivot);
      mesh(cyl(0.035, 0.035, 0.3, 8), m.metal, -0.4, -0.1, 0, group).rotation.z = Math.PI / 2;
      for (const x of [-0.46, -0.34]) mesh(box(0.045, 0.1, 0.1, 0.012), m.dark, x, -0.1, 0, group);
      if (receiver === 'buckle')
        mesh(
          geo('strap-eye', () => new T.TorusGeometry(0.07, 0.02, 4, 10)),
          m.metal,
          0.1,
          0.09,
          0.04,
          pivot,
        );
      if (receiver === 'key') {
        other = mesh(box(0.12, 0.18, 0.04, 0.008), m.dark, -0.29, 0.01, -0.04, group);
        other.name = 'empty-keyway';
      }
    } else {
      part = mesh(box(0.18, 0.13, 0.18, 0.025), receiver === 'piston' ? m.stone : m.wood, -0.3, -0.08, 0, group);
      for (const x of [-0.43, -0.17]) mesh(box(0.035, 0.33, 0.05, 0.008), m.metal, x, -0.04, -0.06, group);
      if (receiver === 'cart')
        for (const x of [-0.38, -0.22])
          mesh(cyl(0.04, 0.04, 0.035, 8), m.dark, x, -0.15, 0.1, group).rotation.x = Math.PI / 2;
    }
    const marks = new T.Group();
    marks.name = 'accepted-notches-' + i;
    marks.position.set(0.19, -0.14, 0.1);
    group.add(marks);
    for (const node of [input, lever, part, other, marks]) if (node) moving.add(node);
    units.push({ group, input, lever, part, other, marks, value: null, values: [], goal: [], receiver });
  }
  // Positive connections terminate at real output transforms. Routes are kept behind readable faces.
  if (stage)
    for (let i = 0; i < 3; i++) {
      const target = targets[i] || targets[0];
      if (!target) continue;
      const parts = Array.from({ length: 3 }, (_, n) => {
        const cable = rod(m.ink, 0.014, root);
        cable.name = 'drive-link-' + i + '-' + n;
        return cable;
      });
      connections.push({ parts, target, index: i });
      channels.push(() => {
        root.updateWorldMatrix(true, false);
        target.object.updateWorldMatrix(true, false);
        end.copy(target.point || v.set(0, 0, 0));
        target.object.localToWorld(end);
        root.worldToLocal(end);
        const start = new T.Vector3(-0.3, 0.35 + i * 0.49, -0.08),
          a = new T.Vector3(0.35, start.y, -1.65),
          b = new T.Vector3(0.35, end.y, -1.65);
        stretch(parts[0], start, a);
        stretch(parts[1], a, b);
        stretch(parts[2], b, end);
      });
    }
  // Instance repeated fixed collars/bearings. Moving parts keep their independent transforms.
  root.updateMatrixWorld(true);
  const inverse = root.matrixWorld.clone().invert(),
    batches = new Map();
  root.traverse(o => {
    if (!o.isMesh) return;
    for (let p = o; p && p !== root; p = p.parent) if (moving.has(p)) return;
    const key = o.geometry.uuid + '|' + o.material.uuid;
    if (!batches.has(key)) batches.set(key, []);
    batches.get(key).push(o);
  });
  for (const items of batches.values())
    if (items.length > 1) {
      const first = items[0],
        batch = new T.InstancedMesh(first.geometry, first.material, items.length);
      batch.name = 'fixed-bearing-batch';
      batch.userData.parts = items.map(o => o.name);
      items.forEach((o, i) => {
        batch.setMatrixAt(i, new T.Matrix4().multiplyMatrices(inverse, o.matrixWorld));
        o.removeFromParent();
      });
      batch.castShadow = true;
      batch.receiveShadow = true;
      root.add(batch);
    }
  let snapshot = null,
    shownFraction = 0;
  function setState(state, { immediate = false } = {}) {
    snapshot = state;
    for (let i = 0; i < 3; i++) {
      const unit = units[i],
        steps = state?.groups?.[i]?.steps || [clamp((state?.fraction || 0) * 3 - i)];
      unit.weights = state?.groups?.[i]?.weights || Array(steps.length).fill(1 / steps.length);
      if (unit.values.length !== steps.length) {
        unit.values = steps.map(x => (immediate ? x : 0));
        unit.goal = steps.slice();
        while (unit.marks.children.length) {
          const child = unit.marks.children.pop();
          child.parent = null;
        }
        steps.forEach((_, n) => {
          const notch = mesh(box(0.025, 0.045, 0.025, 0.004), m.metal, 0, n * 0.052, 0, unit.marks);
          notch.name = 'step-' + n;
        });
      } else unit.goal = steps.slice();
      if (immediate) unit.values = steps.slice();
    }
    update(0, 0);
    return root;
  }
  function update(dt, time = 0) {
    let total = 0;
    for (const unit of units) {
      unit.values = unit.values.map((x, n) => {
        const goal = unit.goal[n] || 0,
          next = x + (goal - x) * (1 - Math.exp(-Math.max(0, dt) * 8));
        return Math.abs(next - goal) < 0.001 ? goal : next;
      });
      const amount = unit.values.reduce((a, b, n) => a + b * unit.weights[n], 0),
        q = smooth(amount);
      unit.value = amount;
      total += amount;
      unit.input.position.z = 0.31 - 0.18 * q;
      unit.lever.rotation.z = -q * 1.25;
      unit.marks.children.forEach((mark, n) => {
        mark.position.z = 0.08 * (unit.values[n] || 0);
        mark.visible = (unit.values[n] || 0) > 0.001;
      });
      const { part, other, receiver } = unit;
      if (['winch', 'reel', 'spool', 'rack'].includes(receiver)) {
        part.rotation.z = -q * Math.PI * 2;
        other.position.y = -0.13 + q * 0.2;
      } else if (['valve', 'filter'].includes(receiver)) {
        part.position.y = q * 0.18;
        other.scale.x = Math.max(0.001, q);
      } else if (['balance', 'basket', 'pan'].includes(receiver)) part.rotation.z = -q * 0.45;
      else if (['bell', 'chime'].includes(receiver)) part.rotation.z = Math.sin(q * Math.PI * 2) * 0.6;
      else if (receiver === 'key') {
        part.position.z = 0.22 * ((unit.values[0] || 0) - (unit.values[1] || 0));
        part.children[0].material = (unit.values[1] || 0) > 0.001 ? m.metal : m.dark;
      } else if (['hinge', 'lid', 'buckle'].includes(receiver)) part.rotation.x = -q * Math.PI * 0.5;
      else if (['sign', 'latch'].includes(receiver)) part.rotation.y = q * Math.PI * 0.5;
      else part.position.y = -0.08 + q * 0.22;
    }
    shownFraction = total / 3;
    for (const updateChannel of channels) updateChannel();
    root.userData.restored = !!snapshot?.complete;
    root.userData.accepted = units.map(u => u.goal.slice());
  }
  setState({ fraction: 0 }, { immediate: true });
  return {
    root,
    units,
    connections,
    setState,
    update,
    connect() {
      for (const updateChannel of channels) updateChannel();
    },
    values: () => units.map(u => u.values.slice()),
    resume(values) {
      units.forEach((u, i) => {
        if (values[i]?.length === u.values.length) u.values = values[i].slice();
      });
      update(0);
    },
    fraction: () => shownFraction,
    receiver(index = 0) {
      root.updateWorldMatrix(true, false);
      return units[Math.max(0, Math.min(2, index))].input.getWorldPosition(new T.Vector3());
    },
  };
}
