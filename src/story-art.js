// Vector art for the Sol Crystal story (0.70.0).
//
// Style: layered "paper-cut" landscapes. Each arena is built from silhouettes that grow paler and hazier with
// distance (atmospheric perspective), lit by one soft light source, with mist bands and light rays in front.
// Everything is generated from seeded shapes, so the art is the same on every device and costs no download.
//
// Every layer shares one 1000 × 1000 canvas drawn with `xMidYMid slice`: on a portrait phone the visible band is
// about x 270–730, on a wide screen about y 190–810, so the guardian (centred at x 600) and the light source sit
// inside both. Layers are separate <svg> elements so CSS can drift them at different speeds (parallax) without
// re-rasterising the artwork.
const rng = seed => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const n = v => Math.round(v * 10) / 10;
const pts = list => list.map(([x, y]) => `${n(x)},${n(y)}`).join(' ');
const VIEW = 'viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice"';
const layer = (cls, body, defs = '') =>
  `<svg class="sa-layer ${cls}" ${VIEW} aria-hidden="true">${defs ? `<defs>${defs}</defs>` : ''}${cls === 'sa-sky' ? body : `<g class="sa-lift">${body}</g>`}</svg>`;
const lin = (id, stops, x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</linearGradient>`;
const rad = (id, stops, cx = 0.5, cy = 0.5, r = 0.5) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</radialGradient>`;

// ---------- Shape generators ----------
// A ridge line by midpoint displacement, closed down to the bottom of the canvas. `smooth` rounds it into hills.
function ridge(r, { base, amp, rough = 0.52, step = 28, smooth = true, x0 = -80, x1 = 1080, bottom = 1100 }) {
  let line = [
    [x0, base - r() * amp * 0.6],
    [x1, base - r() * amp * 0.6],
  ];
  let d = amp;
  while (line[1][0] - line[0][0] > step) {
    const next = [line[0]];
    for (let i = 1; i < line.length; i++) {
      const [ax, ay] = line[i - 1],
        [bx, by] = line[i];
      next.push([(ax + bx) / 2, (ay + by) / 2 + (r() - 0.5) * d], line[i]);
    }
    line = next;
    d *= rough;
  }
  let path = `M${x0} ${bottom} L${n(line[0][0])} ${n(line[0][1])}`;
  if (smooth)
    for (let i = 1; i < line.length - 1; i++) {
      const [x, y] = line[i],
        [nx, ny] = line[i + 1];
      path += ` Q${n(x)} ${n(y)} ${n((x + nx) / 2)} ${n((y + ny) / 2)}`;
    }
  else for (const [x, y] of line.slice(1)) path += ` L${n(x)} ${n(y)}`;
  return `${path} L${x1} ${bottom} Z`;
}
// A pine: a notched triangle in three tiers on a short trunk.
function pine(x, base, h, w) {
  const tiers = 3,
    left = [],
    right = [];
  for (let i = 1; i <= tiers; i++) {
    const y = base - h * 0.12 - ((h * 0.88) * (tiers - i)) / tiers,
      wi = w * (0.42 + (0.58 * i) / tiers);
    left.push([x - wi, y], [x - wi * 0.38, y - h * 0.06]);
    right.unshift([x + wi * 0.38, y - h * 0.06], [x + wi, y]);
  }
  return `M${n(x)} ${n(base - h)} L${pts(left).replace(/ /g, ' L')} L${n(x - w * 0.08)} ${n(base - h * 0.1)} L${n(x - w * 0.08)} ${n(base)} L${n(x + w * 0.08)} ${n(base)} L${n(x + w * 0.08)} ${n(base - h * 0.1)} L${pts(right).replace(/ /g, ' L')} Z`;
}
const circle = (cx, cy, r) => `M${n(cx - r)} ${n(cy)} a${n(r)} ${n(r)} 0 1 0 ${n(2 * r)} 0 a${n(r)} ${n(r)} 0 1 0 ${n(-2 * r)} 0Z`;
// A broadleaf tree: a cluster of round canopies over a trunk.
function broadleaf(r, x, base, h) {
  const s = h / 3.2;
  let d = `M${n(x - s * 0.12)} ${n(base)} L${n(x - s * 0.08)} ${n(base - h * 0.45)} L${n(x + s * 0.08)} ${n(base - h * 0.45)} L${n(x + s * 0.12)} ${n(base)} Z`;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + r();
    d += circle(x + Math.cos(a) * s * 0.55, base - h * 0.62 + Math.sin(a) * s * 0.4, s * (0.55 + r() * 0.25));
  }
  return d + circle(x, base - h * 0.78, s * 0.75);
}
// A line of trees standing on a band of ground.
function treeline(r, { base, count, minH, maxH, x0 = -40, x1 = 1040, kind = 'pine', ground = 30 }) {
  let d = `M${x0} ${base - 4} L${x1} ${base - 4} L${x1} 1100 L${x0} 1100 Z`;
  for (let i = 0; i < count; i++) {
    const x = x0 + ((x1 - x0) * (i + r() * 0.8)) / count,
      h = minH + r() * (maxH - minH),
      b = base + r() * ground * 0.3;
    d += kind === 'pine' || (kind === 'mixed' && r() < 0.55) ? pine(x, b, h, h * (0.26 + r() * 0.08)) : broadleaf(r, x, b, h);
  }
  return d;
}
// Soft cumulus: overlapping circles sharing one gradient (light on top, shaded below).
function cloud(r, cx, cy, w) {
  let d = '';
  const k = 4 + Math.floor(r() * 3);
  for (let i = 0; i < k; i++) d += circle(cx - w / 2 + (w * (i + 0.5)) / k, cy - r() * w * 0.12, w * (0.13 + r() * 0.1));
  // A soft rounded base instead of a flat slab.
  const rx = w * 0.52,
    ry = w * 0.09;
  return d + `M${n(cx - rx)} ${n(cy)} a${n(rx)} ${n(ry)} 0 1 0 ${n(2 * rx)} 0 a${n(rx)} ${n(ry)} 0 1 0 ${n(-2 * rx)} 0Z`;
}
// Flat-topped sandstone mesa with a stepped flank.
function mesa(x, base, w, h, step = 0.18) {
  const t = base - h;
  return `M${n(x - w / 2 - h * 0.35)} ${n(base)} L${n(x - w / 2 - h * step)} ${n(t + h * 0.35)} L${n(x - w / 2)} ${n(t + h * 0.3)} L${n(x - w / 2 + w * 0.06)} ${n(t)} L${n(x + w / 2 - w * 0.05)} ${n(t)} L${n(x + w / 2)} ${n(t + h * 0.22)} L${n(x + w / 2 + h * step)} ${n(t + h * 0.3)} L${n(x + w / 2 + h * 0.4)} ${n(base)} Z`;
}
// A crystal spire as two faces split along its ridge: the lit face and the shadow face.
function spire(x, base, w, h, tilt = 0) {
  const tip = [x + tilt, base - h],
    mid = [x + w * 0.06, base],
    left = [
      tip,
      [x - w / 2, base - h * 0.68],
      [x - w * 0.42, base],
      mid,
    ],
    right = [tip, mid, [x + w * 0.46, base], [x + w / 2, base - h * 0.72]];
  return { left: `M${pts(left).replace(/ /g, ' L')} Z`, right: `M${pts(right).replace(/ /g, ' L')} Z`, ridge: `M${n(tip[0])} ${n(tip[1])} L${n(mid[0])} ${n(mid[1])}` };
}
function spires(r, { base, count, minH, maxH, minW = 40, maxW = 90, x0 = -40, x1 = 1040 }) {
  const out = { left: '', right: '', ridge: '' };
  for (let i = 0; i < count; i++) {
    const x = x0 + ((x1 - x0) * (i + r())) / count,
      h = minH + r() * (maxH - minH),
      s = spire(x, base + r() * 20, minW + r() * (maxW - minW), h, (r() - 0.5) * h * 0.18);
    out.left += s.left;
    out.right += s.right;
    out.ridge += s.ridge;
  }
  return out;
}
// Fern and grass blades along the foreground edge.
function blades(r, { base, count, minH, maxH, x0 = -20, x1 = 1020 }) {
  let d = '';
  for (let i = 0; i < count; i++) {
    const x = x0 + (x1 - x0) * r(),
      h = minH + r() * (maxH - minH),
      lean = (r() - 0.5) * h * 0.8;
    d += `M${n(x - 3)} ${base} Q${n(x + lean * 0.3)} ${n(base - h * 0.6)} ${n(x + lean)} ${n(base - h)} Q${n(x + lean * 0.4)} ${n(base - h * 0.5)} ${n(x + 3)} ${base} Z`;
  }
  return d;
}
// Light rays fanning down from a point.
function rays(cx, cy, count, spread, length, id) {
  let d = '';
  for (let i = 0; i < count; i++) {
    const a = Math.PI / 2 + (i / (count - 1) - 0.5) * spread,
      w = 0.025 + (i % 3) * 0.012;
    d += `<path d="M${cx} ${cy} L${n(cx + Math.cos(a - w) * length)} ${n(cy + Math.sin(a - w) * length)} L${n(cx + Math.cos(a + w) * length)} ${n(cy + Math.sin(a + w) * length)} Z" fill="url(#${id})" opacity="${n(0.35 + (i % 2) * 0.3)}"/>`;
  }
  return d;
}
const mist = (id, y, h, color, a = 0.55) =>
  `<defs>${lin(id, [[0, color, 0], [0.5, color, a], [1, color, 0]])}</defs><rect x="-50" y="${y}" width="1100" height="${h}" fill="url(#${id})"/>`;
const stars = (r, count, maxY) => {
  let d = '';
  for (let i = 0; i < count; i++) d += circle(r() * 1000, r() * maxY, 0.8 + r() * 1.8);
  return d;
};

// ---------- Backdrops ----------
function whisperwood() {
  const r = rng(11);
  const sky = layer(
    'sa-sky',
    `<rect width="1000" height="1000" fill="url(#ww-sky)"/><circle cx="640" cy="430" r="420" fill="url(#ww-sun)"/><circle cx="640" cy="430" r="46" fill="#fff6d6" opacity=".9"/><path d="${cloud(r, 250, 250, 260)}" fill="#fff3dc" opacity=".55"/><path d="${cloud(r, 820, 200, 200)}" fill="#fff3dc" opacity=".45"/>`,
    lin('ww-sky', [[0, '#7cc9bf'], [0.45, '#cfe8c8'], [0.72, '#f8e6b4'], [1, '#ffd79a']]) +
      rad('ww-sun', [[0, '#fff4c8', 0.95], [0.25, '#ffe3a0', 0.55], [1, '#ffd79a', 0]]),
  );
  const far = layer(
    'sa-far',
    `<path d="${ridge(r, { base: 560, amp: 90 })}" fill="#a9d1ba"/><path d="${treeline(r, { base: 590, count: 46, minH: 28, maxH: 60 })}" fill="#8ec2a6"/><path d="${treeline(r, { base: 630, count: 38, minH: 40, maxH: 86, kind: 'mixed' })}" fill="#6aa98a"/>`,
  );
  const mid = layer(
    'sa-mid',
    `<path d="${treeline(r, { base: 700, count: 26, minH: 90, maxH: 170, kind: 'mixed' })}" fill="#3f7d5f"/><path d="${ridge(r, { base: 735, amp: 30 })}" fill="#336c51"/><ellipse cx="470" cy="770" rx="150" ry="18" fill="url(#ww-pool)"/><ellipse cx="470" cy="770" rx="90" ry="8" fill="#fffbe0" opacity=".55"/>`,
    rad('ww-pool', [[0, '#e9fff4', 0.95], [0.6, '#9fe0c4', 0.6], [1, '#5c9a7a', 0]]),
  );
  const near = layer(
    'sa-near',
    `<path d="${ridge(r, { base: 860, amp: 40 })}" fill="#24493a"/><path d="${pine(60, 900, 520, 150)}${pine(170, 920, 380, 110)}${pine(930, 900, 560, 160)}${pine(840, 930, 360, 100)}" fill="#1c3b2f"/><path d="${blades(r, { base: 880, count: 70, minH: 30, maxH: 90 })}" fill="#183428"/><path d="M-20 1000 L-20 900 Q500 860 1020 900 L1020 1000Z" fill="#14291f"/>`,
  );
  const fx = layer(
    'sa-fx',
    `${rays(640, 430, 9, 1.4, 900, 'ww-ray')}${mist('ww-m1', 610, 100, '#f4fbf0', 0.26)}${mist('ww-m2', 740, 80, '#e8f6ea', 0.22)}`,
    lin('ww-ray', [[0, '#fff7d6', 0.32], [1, '#fff7d6', 0]]),
  );
  return { sky, far, mid, near, fx };
}
function skyreach() {
  const r = rng(23);
  let clouds = '';
  for (const [x, y, w, o] of [[180, 300, 300, 0.85], [760, 250, 340, 0.8], [520, 420, 260, 0.6], [940, 470, 200, 0.55], [80, 470, 220, 0.5]])
    clouds += `<path d="${cloud(r, x, y, w)}" fill="url(#sr-cloud)" opacity="${o}"/>`;
  const sky = layer(
    'sa-sky',
    `<rect width="1000" height="1000" fill="url(#sr-sky)"/><circle cx="330" cy="300" r="380" fill="url(#sr-sun)"/><circle cx="330" cy="300" r="38" fill="#fffbe8"/>${clouds}`,
    lin('sr-sky', [[0, '#3f86d6'], [0.45, '#8cc3ef'], [0.75, '#d9ecf5'], [1, '#ffe2b5']]) +
      rad('sr-sun', [[0, '#fffbe6', 0.95], [0.3, '#fff0c4', 0.4], [1, '#fff0c4', 0]]) +
      lin('sr-cloud', [[0, '#ffffff'], [0.7, '#eef4fb'], [1, '#c7d9ec']]),
  );
  const farMesas = [mesa(120, 640, 220, 120), mesa(430, 650, 160, 150), mesa(760, 640, 260, 110), mesa(1000, 650, 180, 140)].join('');
  const far = layer(
    'sa-far',
    `<path d="${farMesas}" fill="#ecd2b0"/><path d="${ridge(r, { base: 660, amp: 30, smooth: false })}" fill="#e3c19a"/><g transform="translate(250 430)"><path d="M-70 0 L70 0 L40 40 L10 70 L-30 55 L-55 30Z" fill="#c99a6e"/><path d="M-70 0 L70 0 L66 -10 L-66 -10Z" fill="#8fb36a"/><path d="M50 30 L52 120" stroke="#e8f6ff" stroke-width="3" opacity=".7"/></g><g transform="translate(800 380) scale(.7)"><path d="M-70 0 L70 0 L40 40 L10 70 L-30 55 L-55 30Z" fill="#c99a6e"/><path d="M-70 0 L70 0 L66 -10 L-66 -10Z" fill="#8fb36a"/></g>`,
  );
  const strata = [0, 1, 2, 3].map(i => `<path d="M-20 ${720 + i * 28} L1020 ${712 + i * 30}" stroke="#a96a42" stroke-width="5" opacity=".35"/>`).join('');
  const mid = layer(
    'sa-mid',
    `<path d="${mesa(150, 760, 300, 230)}${mesa(880, 760, 320, 260)}" fill="#c98757"/><path d="${ridge(r, { base: 770, amp: 25, smooth: false })}" fill="#b9774b"/>${strata}<path d="M270 560 Q520 640 770 545" fill="none" stroke="#5a3a1c" stroke-width="5"/><path d="M270 548 Q520 628 770 533" fill="none" stroke="#7a5230" stroke-width="3"/>${Array.from({ length: 13 }, (_, i) => { const t = i / 12, x = 270 + 500 * t, y = (1 - t) * (1 - t) * 560 + 2 * (1 - t) * t * 640 + t * t * 545; return `<path d="M${n(x)} ${n(y - 12)} v14" stroke="#5a3a1c" stroke-width="3"/>`; }).join('')}<path d="M262 520 v60 M778 505 v60" stroke="#4a2f17" stroke-width="10"/><path d="M262 522 l40 10 l-40 12Z M778 507 l40 10 l-40 12Z" fill="#d9583c"/>`,
  );
  const near = layer(
    'sa-near',
    `<path d="M-40 1000 L-40 820 L60 800 L140 760 L230 790 L300 860 L700 880 L780 800 L880 770 L1040 800 L1040 1000Z" fill="#6b3e2a"/><path d="M-40 1000 L-40 870 Q500 840 1040 870 L1040 1000Z" fill="#552f1f"/><path d="${blades(r, { base: 870, count: 40, minH: 20, maxH: 60 })}" fill="#8a7a3a"/><path d="M90 800 v-170" stroke="#3d2414" stroke-width="9"/><path d="M90 640 q60 10 110 -5 q-30 30 -10 60 q-50 -10 -100 0Z" fill="#d9583c"/><path d="M90 650 q40 6 80 -2" stroke="#f2c45a" stroke-width="3" fill="none"/>`,
  );
  const wind = [0, 1, 2, 3, 4].map(i => `<path d="M${-50 + i * 60} ${380 + i * 70} q260 -40 520 0 t520 0" fill="none" stroke="#ffffff" stroke-width="${2 + (i % 2)}" opacity=".35" stroke-linecap="round"/>`).join('');
  const fx = layer('sa-fx', `${wind}${mist('sr-m1', 650, 100, '#fff8ec', 0.28)}`);
  return { sky, far, mid, near, fx };
}
function stormglass() {
  const r = rng(37);
  const sky = layer(
    'sa-sky',
    `<rect width="1000" height="1000" fill="url(#sg-sky)"/><path class="sa-twinkle" d="${stars(r, 90, 520)}" fill="#ffffff" opacity=".85"/><circle cx="330" cy="250" r="48" fill="#f5ecff"/><circle cx="350" cy="236" r="44" fill="url(#sg-skyc)"/><circle cx="600" cy="660" r="380" fill="url(#sg-glow)"/>`,
    lin('sg-sky', [[0, '#120c33'], [0.45, '#33256f'], [0.75, '#7a4aa8'], [1, '#d07ab8']]) +
      lin('sg-skyc', [[0, '#1c1446'], [1, '#2b2060']]) +
      rad('sg-glow', [[0, '#ffb6e6', 0.5], [1, '#ffb6e6', 0]]),
  );
  const aurora = `<path d="M-40 260 C200 180 380 330 560 230 S880 170 1040 240 L1040 300 C860 230 700 300 560 300 S220 260 -40 330Z" fill="url(#sg-aur)" opacity=".55"/><path d="M-40 360 C240 300 440 400 640 330 S900 300 1040 340 L1040 380 C880 350 700 390 600 390 S240 360 -40 410Z" fill="url(#sg-aur2)" opacity=".4"/>`;
  const f1 = spires(r, { base: 640, count: 16, minH: 120, maxH: 260, minW: 50, maxW: 100 });
  const far = layer(
    'sa-far',
    `${aurora}<path d="${f1.left}" fill="#6b58b0"/><path d="${f1.right}" fill="#9a86d6"/><path d="${ridge(r, { base: 650, amp: 30, smooth: false })}" fill="#5c4aa0"/>`,
    lin('sg-aur', [[0, '#5ff0d6', 0], [0.3, '#5ff0d6', 0.8], [0.7, '#b48cff', 0.6], [1, '#b48cff', 0]], 1, 0) +
      lin('sg-aur2', [[0, '#b48cff', 0], [0.5, '#7ff3ff', 0.7], [1, '#7ff3ff', 0]], 1, 0),
  );
  const m1 = spires(r, { base: 760, count: 9, minH: 220, maxH: 420, minW: 80, maxW: 150 });
  const mid = layer(
    'sa-mid',
    `<path d="${m1.left}" fill="#3f2f86"/><path d="${m1.right}" fill="#6f5cc4"/><path d="${m1.ridge}" stroke="#c9b8ff" stroke-width="2" opacity=".6"/><path d="${ridge(r, { base: 770, amp: 20 })}" fill="#2d2266"/>`,
  );
  const n1 = spires(r, { base: 980, count: 5, minH: 260, maxH: 460, minW: 120, maxW: 200, x0: -120, x1: 1120 });
  const near = layer(
    'sa-near',
    `<path d="${ridge(r, { base: 880, amp: 40 })}" fill="#1b1442"/><path d="${n1.left}" fill="#1d1648"/><path d="${n1.right}" fill="#2c2266"/><path d="${n1.ridge}" stroke="#a98cff" stroke-width="2.5" opacity=".7"/><path d="M-20 1000 L-20 930 Q500 900 1020 930 L1020 1000Z" fill="#120d30"/>${[[200, 900], [430, 925], [760, 910], [880, 940]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="26" fill="url(#sg-gem)"/><path d="M${x} ${y - 16} l7 14 l-7 14 l-7 -14Z" fill="#e6d7ff"/>`).join('')}`,
    rad('sg-gem', [[0, '#e9b8ff', 0.9], [1, '#e9b8ff', 0]]),
  );
  const fx = layer('sa-fx', `${mist('sg-m1', 650, 120, '#c9a6ff', 0.28)}${mist('sg-m2', 800, 100, '#b38cff', 0.22)}`);
  return { sky, far, mid, near, fx };
}
// The finale: the whole valley at sunrise, its three lands side by side, under the restored crystal's light.
function finale() {
  const r = rng(53);
  const sky = layer(
    'sa-sky',
    `<rect width="1000" height="1000" fill="url(#fn-sky)"/><circle cx="600" cy="360" r="520" fill="url(#fn-sun)"/><path d="${cloud(r, 220, 300, 260)}${cloud(r, 860, 330, 240)}" fill="#fff1d2" opacity=".55"/>`,
    lin('fn-sky', [[0, '#5d7fcf'], [0.4, '#f0b8a0'], [0.7, '#ffd89a'], [1, '#fff0c4']]) + rad('fn-sun', [[0, '#fffbe6', 1], [0.25, '#ffe6a0', 0.6], [1, '#ffd89a', 0]]),
  );
  const s = spires(r, { base: 640, count: 7, minH: 120, maxH: 220, x0: 700, x1: 1060, minW: 40, maxW: 80 });
  const far = layer(
    'sa-far',
    `<path d="${mesa(470, 640, 200, 120)}${mesa(620, 650, 140, 90)}" fill="#efc9a0"/><path d="${s.left}" fill="#b49ae0"/><path d="${s.right}" fill="#d4c4f2"/><path d="${treeline(r, { base: 650, count: 22, minH: 40, maxH: 90, x0: -60, x1: 420 })}" fill="#a9d1b4"/><path d="${ridge(r, { base: 670, amp: 30 })}" fill="#c9d9b8"/>`,
  );
  const mid = layer('sa-mid', `<path d="${ridge(r, { base: 770, amp: 60 })}" fill="#7fae86"/><path d="${treeline(r, { base: 790, count: 18, minH: 70, maxH: 140, kind: 'mixed' })}" fill="#5f9473"/>`);
  const near = layer('sa-near', `<path d="${ridge(r, { base: 880, amp: 40 })}" fill="#2f5a45"/><path d="${blades(r, { base: 900, count: 60, minH: 30, maxH: 80 })}" fill="#264c3a"/><path d="M-20 1000 L-20 920 Q500 890 1020 920 L1020 1000Z" fill="#1d3b2e"/>`);
  const fx = layer('sa-fx', `${rays(600, 360, 15, 3.4, 1000, 'fn-ray')}${mist('fn-m1', 650, 110, '#fff4dc', 0.3)}`, lin('fn-ray', [[0, '#fff6cf', 0.6], [1, '#fff6cf', 0]]));
  return { sky, far, mid, near, fx };
}
const BACKDROPS = [whisperwood, skyreach, stormglass];
const cache = new Map();
export function backdrop(which) {
  const key = which === 'finale' ? 'finale' : Math.max(0, Math.min(2, Number(which) || 0));
  if (!cache.has(key)) cache.set(key, key === 'finale' ? finale() : BACKDROPS[key]());
  return cache.get(key);
}

// ---------- Guardians ----------
// Each guardian is a stone colossus (as in the 3D arena), drawn from the waist up, rising behind the foreground:
// layered armour plates lit from the upper left, a faceted glowing core, glowing veins and eyes, and its arena's
// dressing. Local coordinates: (0, 0) is the bottom centre; the figure is about 460 wide and 470 tall.
const THEMES = [
  { light: '#7f9a72', stone: '#5e7457', dark: '#2c3f2c', deep: '#1d2b1e', trim: '#d8c27a', energy: '#c6ff6a', glow: '#b6ff7a' },
  { light: '#e7cfa2', stone: '#c9a77a', dark: '#8a6a46', deep: '#5d4530', trim: '#f2c45a', energy: '#7ff3ff', glow: '#bff8ff' },
  { light: '#a99ce8', stone: '#6f5fc0', dark: '#3a2e7e', deep: '#241b55', trim: '#efe4ff', energy: '#e9b8ff', glow: '#f3d6ff' },
];
function colossus(t, i) {
  const id = `g${i}`;
  const defs =
    rad(`${id}-core`, [[0, '#ffffff', 1], [0.35, t.energy, 0.9], [1, t.energy, 0]]) +
    lin(`${id}-plate`, [[0, t.light], [1, t.stone]]) +
    lin(`${id}-shade`, [[0, t.stone], [1, t.dark]]) +
    lin(`${id}-haze`, [[0, '#000', 0], [1, t.deep, 0.75]]);
  const plate = (d, lit) => `<path d="${d}" fill="url(#${id}-${lit ? 'plate' : 'shade'})" stroke="${t.deep}" stroke-width="3" stroke-linejoin="round"/>`;
  const body = [
    // arms
    plate('M-215 -150 L-158 -140 L-172 10 L-252 10Z', true),
    plate('M215 -150 L158 -140 L172 10 L252 10Z', false),
    // torso: chest and belly plates
    plate('M-95 -250 L0 -250 L0 -150 L-122 -122 L-138 -172Z', true),
    plate('M95 -250 L0 -250 L0 -150 L122 -122 L138 -172Z', false),
    plate('M-122 -116 L0 -146 L0 10 L-118 10Z', true),
    plate('M122 -116 L0 -146 L0 10 L118 10Z', false),
    `<path d="M-118 -60 L0 -80 L118 -60 M-118 -20 L0 -36 L118 -20" stroke="${t.deep}" stroke-width="3" fill="none" opacity=".6"/>`,
    // pauldrons: two layered plates per side
    plate('M-92 -258 Q-200 -270 -228 -170 L-196 -118 Q-150 -170 -96 -206Z', true),
    plate('M-120 -214 Q-196 -214 -214 -150 L-188 -112 Q-160 -150 -118 -172Z', false),
    plate('M92 -258 Q200 -270 228 -170 L196 -118 Q150 -170 96 -206Z', false),
    plate('M120 -214 Q196 -214 214 -150 L188 -112 Q160 -150 118 -172Z', false),
    // neck and head
    `<path d="M-40 -250 L40 -250 L34 -278 L-34 -278Z" fill="${t.deep}"/>`,
    plate('M0 -366 L-46 -350 L-64 -302 L-56 -258 L0 -246Z', true),
    plate('M0 -366 L46 -350 L64 -302 L56 -258 L0 -246Z', false),
    `<path d="M-60 -314 L60 -314 L54 -294 L-54 -294Z" fill="${t.deep}"/>`,
    `<path d="M-34 -266 L34 -266 L26 -250 L-26 -250Z" fill="${t.dark}" stroke="${t.deep}" stroke-width="2"/>`,
  ].join('');
  // The faceted core, its glow, and veins running out across the plates.
  const core = `<circle cx="0" cy="-178" r="90" fill="url(#${id}-core)" opacity=".55"/><path d="M0 -218 L28 -178 L0 -136 L-28 -178Z" fill="${t.energy}" stroke="#fff" stroke-width="2"/><path d="M0 -218 L0 -136 M-28 -178 L28 -178" stroke="#ffffff" stroke-width="1.5" opacity=".8"/>`;
  const veins = `<path d="M-28 -178 L-70 -196 L-112 -176 M28 -178 L72 -160 L110 -170 M0 -136 L-20 -90 L-60 -60 M0 -136 L24 -96 L70 -70 M-70 -196 L-80 -232 M72 -160 L90 -126" stroke="${t.energy}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".8"/>`;
  const eyes = `<g class="sa-eyes"><ellipse cx="-24" cy="-304" rx="15" ry="5" fill="${t.glow}"/><ellipse cx="24" cy="-304" rx="15" ry="5" fill="${t.glow}"/><circle cx="-24" cy="-304" r="22" fill="url(#${id}-core)" opacity=".7"/><circle cx="24" cy="-304" r="22" fill="url(#${id}-core)" opacity=".7"/></g>`;
  // Rim light along the lit (left) edges.
  const rim = `<path d="M-252 10 L-215 -150 M-228 -170 Q-200 -270 -92 -258 M-64 -302 L-46 -350 L0 -366" stroke="${t.trim}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>`;
  let behind = '',
    front = '';
  if (i === 0) {
    // Forest titan: moss caps, a crown of leafy branches, hanging vines and a few flowers.
    const moss = (cx, cy, w) => {
      const r = rng(cx * 7 + cy);
      let d = '';
      for (let k = 0; k < 7; k++) d += circle(cx - w / 2 + (w * k) / 6, cy - r() * 14, 12 + r() * 12);
      return d;
    };
    // An antler-like crown of branches with small leaf tufts (not round canopies).
    const branch = (pts2, w) => `<path d="M${pts2.map(p => p.join(' ')).join(' L')}" stroke="${t.deep}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
    const tuft = (x, y, a) => `<g transform="translate(${x} ${y}) rotate(${a})"><ellipse cx="0" cy="-9" rx="5" ry="11" fill="#5fae45"/><ellipse cx="-8" cy="-4" rx="4" ry="9" fill="#4f9a3a" transform="rotate(-35)"/><ellipse cx="8" cy="-4" rx="4" ry="9" fill="#7cc25a" transform="rotate(35)"/></g>`;
    const crown = [
      [[[-26, -356], [-60, -400], [-92, -416], [-120, -452]], 9],
      [[[-60, -400], [-62, -440], [-50, -470]], 6],
      [[[-92, -416], [-128, -412], [-150, -426]], 5],
      [[[26, -356], [62, -402], [96, -414], [122, -450]], 9],
      [[[62, -402], [66, -442], [54, -472]], 6],
      [[[96, -414], [132, -408], [154, -422]], 5],
      [[[0, -366], [-4, -410], [6, -444]], 6],
    ];
    behind = crown.map(([p, w]) => branch(p, w)).join('') +
      [[-120, -452, -20], [-50, -470, -5], [-150, -426, -60], [122, -450, 20], [54, -472, 5], [154, -422, 60], [6, -444, 0], [-76, -408, -40], [80, -410, 40], [-110, -418, -70], [112, -414, 70]].map(([x, y, a]) => tuft(x, y, a)).join('');
    front = `<path d="${moss(-160, -232, 140)}${moss(160, -232, 140)}${moss(0, -360, 90)}" fill="#4f9a3a"/><path d="${moss(-150, -244, 80)}${moss(150, -244, 80)}" fill="#86c95e"/><g stroke="#3f7a2c" stroke-width="3" fill="none" stroke-linecap="round"><path d="M-200 -140 q-12 50 6 100 q-10 30 0 60"/><path d="M-170 -126 q10 40 -4 90"/><path d="M196 -136 q14 46 -4 96 q10 30 0 50"/><path d="M60 -120 q8 40 -4 70"/></g>${[[-200, -60], [-174, -50], [192, -50], [58, -60], [-130, -250], [140, -252], [10, -380]].map(([x, y], k) => `<circle cx="${x}" cy="${y}" r="6" fill="${k % 2 ? '#ffd1e8' : '#fff1a0'}"/>`).join('')}`;
  } else if (i === 1) {
    // Sky sentinel: wing fins fanning behind, gold trim, red banners and orbiting stones.
    const fin = (side, k) => {
      const a = (side * (28 + k * 16) * Math.PI) / 180,
        len = 300 - k * 36,
        bx = side * 160,
        by = -230;
      const tx = bx + Math.sin(a) * len,
        ty = by - Math.cos(a) * len;
      return `<path d="M${bx} ${by} Q${n((bx + tx) / 2 + side * 30)} ${n((by + ty) / 2)} ${n(tx)} ${n(ty)} Q${n((bx + tx) / 2 - side * 10)} ${n((by + ty) / 2 + 30)} ${bx + side * 20} ${by + 24}Z" fill="url(#${id}-${side < 0 ? 'plate' : 'shade'})" stroke="${t.trim}" stroke-width="3"/>`;
    };
    behind = [0, 1, 2, 3].map(k => fin(-1, k) + fin(1, k)).join('');
    front = `<path d="M-200 -128 L-150 -134 L-152 -20 L-176 -40 L-200 -16Z" fill="#d9583c" stroke="${t.deep}" stroke-width="2"/><path d="M200 -128 L150 -134 L152 -20 L176 -40 L200 -16Z" fill="#b84630" stroke="${t.deep}" stroke-width="2"/><circle cx="-175" cy="-96" r="11" fill="${t.trim}"/><circle cx="175" cy="-96" r="11" fill="${t.trim}"/><path d="M-138 -172 L-95 -250 L0 -250 L95 -250 L138 -172" stroke="${t.trim}" stroke-width="4" fill="none"/><path d="M-46 -350 L0 -366 L46 -350" stroke="${t.trim}" stroke-width="4" fill="none"/><g class="sa-orbit"><ellipse cx="0" cy="-170" rx="260" ry="60" fill="none" stroke="#ffffff" stroke-width="1.5" opacity=".35"/>${[[-250, -150], [180, -214], [60, -112]].map(([x, y], k) => `<path d="M${x - 16} ${y} l10 -14 l18 2 l8 14 l-10 12 l-18 -2Z" fill="${k % 2 ? t.stone : t.dark}" stroke="${t.deep}" stroke-width="2"/>`).join('')}</g>`;
  } else {
    // Crystal colossus: facet lines on every plate, a crown of shards and floating crystals.
    const shard = (x, y, w, h, tilt = 0) => `<path d="M${x + tilt} ${y - h} L${x + w / 2} ${y - h * 0.3} L${x} ${y} L${x - w / 2} ${y - h * 0.3}Z" fill="url(#${id}-plate)" stroke="${t.trim}" stroke-width="2"/><path d="M${x + tilt} ${y - h} L${x} ${y}" stroke="#ffffff" stroke-width="1.5" opacity=".7"/>`;
    behind = [[-60, -350, 28, 110, -14], [-28, -362, 30, 150, -4], [0, -366, 34, 180, 0], [28, -362, 30, 150, 4], [60, -350, 28, 110, 14]].map(a => shard(...a)).join('');
    front = `<g stroke="#ffffff" stroke-width="1.5" opacity=".45" fill="none"><path d="M-95 -250 L-60 -190 L-138 -172 M95 -250 L60 -190 L138 -172 M-122 -116 L-60 -60 L-118 10 M122 -116 L60 -60 L118 10 M-215 -150 L-200 -60 L-252 10 M215 -150 L200 -60 L252 10"/></g><g class="sa-float">${shard(-270, -230, 30, 70, -6)}${shard(272, -250, 34, 80, 6)}${shard(-300, -110, 22, 50)}${shard(306, -130, 24, 54)}</g>`;
  }
  return `<defs>${defs}</defs><g class="sa-guardian-body">${behind}${body}${core}${veins}${rim}${front}${eyes}<rect x="-320" y="-200" width="640" height="220" fill="url(#${id}-haze)"/></g>`;
}
export function guardianArt(i) {
  const t = THEMES[i] || THEMES[0];
  return `<svg class="sa-layer sa-guardian" ${VIEW} aria-hidden="true"><g class="sa-guardian-fit"><g transform="translate(600 905) scale(1.3)">${colossus(t, i)}</g></g></svg>`;
}

// ---------- The Sol Crystal ----------
// The solMaxima emblem in three pieces: two crossed gold blades and the sol on its orbit. `shards` pieces are
// whole; the rest are faint outlines. `fresh` (0–2) is the piece that has just come back: it flies in and flashes.
const BLADE_TOP = 'M-62 0 L-40 -12 L-6 -9 L6 -13 L40 -9 L62 0 Z',
  BLADE_LOW = 'M-62 0 L-40 10 L-6 13 L6 9 L40 12 L62 0 Z',
  BLADE = 'M-62 0 L-40 -12 L-6 -9 L6 -13 L40 -9 L62 0 L40 12 L6 9 L-6 13 L-40 10 Z';
export function crystalArt(shards = 0, { whole = false, fresh = -1 } = {}) {
  const piece = (k, inner) => {
    const has = k < shards;
    return `<g class="sa-piece sa-piece-${k}${has ? ' on' : ' off'}${k === fresh ? ' fresh' : ''}">${inner(has)}</g>`;
  };
  const blade = rot => has =>
    has
      ? `<g transform="rotate(${rot})"><path d="${BLADE_TOP}" fill="url(#sc-goldL)"/><path d="${BLADE_LOW}" fill="url(#sc-goldD)"/><path d="${BLADE}" fill="none" stroke="#fff0c0" stroke-width="2" stroke-linejoin="round"/><path d="M-40 -12 L-30 0 L-40 10 M40 -9 L28 0 L40 12 M-6 -9 L0 0 L-6 13 M6 -13 L0 0 L6 9" stroke="#fffbe8" stroke-opacity=".6" stroke-width="1.1" fill="none"/></g>`
      : `<g transform="rotate(${rot})"><path d="${BLADE}" fill="#fff6dc" fill-opacity=".1" stroke="#fff6dc" stroke-opacity=".75" stroke-width="2" stroke-dasharray="6 4"/></g>`;
  const sol = has =>
    has
      ? `<g class="sa-sol-orbit"><path d="M 54 -29 A 61 21 -28 0 0 -54 29" fill="none" stroke="#ffd25a" stroke-opacity=".6" stroke-width="3"/><circle cx="54" cy="-29" r="13" fill="url(#sc-sun)" stroke="#fff3c0" stroke-width="1.5"/></g>`
      : `<path d="M 54 -29 A 61 21 -28 0 0 -54 29" fill="none" stroke="#fff6dc" stroke-opacity=".6" stroke-width="2" stroke-dasharray="4 5"/><circle cx="54" cy="-29" r="12" fill="#fff6dc" fill-opacity=".1" stroke="#fff6dc" stroke-opacity=".75" stroke-width="2" stroke-dasharray="4 4"/>`;
  const rays = whole
    ? `<g class="sa-radiance">${Array.from({ length: 12 }, (_, k) => `<path d="M0 0 L${n(Math.cos((k * Math.PI) / 6 - 0.06) * 120)} ${n(Math.sin((k * Math.PI) / 6 - 0.06) * 120)} L${n(Math.cos((k * Math.PI) / 6 + 0.06) * 120)} ${n(Math.sin((k * Math.PI) / 6 + 0.06) * 120)}Z" fill="url(#sc-ray)"/>`).join('')}</g>`
    : '';
  return `<svg class="story-emblem${whole ? ' whole' : ''}" viewBox="-110 -110 220 220" aria-hidden="true"><defs>${rad('sc-glow', [[0, '#ffe08a', 0.85], [0.45, '#ffc24a', 0.3], [1, '#ffc24a', 0]])}${rad('sc-sun', [[0, '#fffbe0'], [0.45, '#ffd84f'], [1, '#e8700f']], 0.38, 0.33, 0.75)}${lin('sc-goldL', [[0, '#fff8dc'], [0.6, '#f6d37e'], [1, '#e3b25a']])}${lin('sc-goldD', [[0, '#c88f37'], [1, '#6e4515']])}${lin('sc-ray', [[0, '#fff3c0', 0.85], [1, '#fff3c0', 0]], 1, 0)}</defs>${rays}<circle r="${78 + shards * 10}" fill="url(#sc-glow)" opacity="${0.4 + shards * 0.18}"/>${piece(0, blade(45))}${piece(1, blade(-45))}${piece(2, sol)}<g class="sa-flash"><circle r="60" fill="url(#sc-glow)"/></g></svg>`;
}

// ---------- Particles (HTML, animated with CSS transforms) ----------
const PARTICLES = {
  0: { kind: 'firefly', count: 18 },
  1: { kind: 'wind', count: 10 },
  2: { kind: 'mote', count: 22 },
  finale: { kind: 'sparkle', count: 24 },
};
export function particles(which) {
  const p = PARTICLES[which] || PARTICLES[0],
    r = rng(String(which).length * 97 + (Number(which) || 7));
  return `<div class="sa-particles sa-${p.kind}" aria-hidden="true">${Array.from({ length: p.count }, () => `<i style="--x:${n(r() * 100)}%;--y:${n(25 + r() * 70)}%;--d:${n(5 + r() * 9)}s;--delay:${n(-r() * 12)}s;--s:${n(0.6 + r() * 0.9)}"></i>`).join('')}</div>`;
}
