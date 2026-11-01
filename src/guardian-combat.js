import { jumpTuning } from './jump-tuning.js';
import {
  bodyDistanceInterval,
  bodyTouchesBeam,
  circlesTouchBody,
  containBody,
  separateBodyFromCircle,
} from './creature-contact.js';
import { elementalAttack, segmentHit } from './elemental-attacks.js';
import { special as specialSpec, specialDamage, validSpecialList } from './specials.js';
import {
  BOSS,
  ARENA,
  guardianPhase,
  ATTACK_KINDS,
  AREA_PATTERNS,
  LEGACY_PATTERNS,
  attackSpec,
  bigAttack,
  attackShapes,
  shapesHit,
  cageWall,
  blockCage,
} from './guardian-attacks.js';
export { BOSS, ARENA, guardianPhase };
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
// Two English wards interrupt the fight; each correct answer staggers the guardian.
export const WARDS = [70, 40];
// The guardian of a six-gate area is far tougher: four wards, smaller hits, and a knock-out lets it recover to the
// last ward the student broke. A student who buys no specials can still win, but it takes a long, careful fight.
export const TOUGH_WARDS = [80, 60, 40, 20];
export const wardList = b => (b?.tough ? TOUGH_WARDS : WARDS);
// Core damage per hit; a staggered guardian takes a double critical hit.
const HIT = 7,
  TOUGH_HIT = 3;
export const guardianHit = (b, critical = false) => (b?.tough ? TOUGH_HIT : HIT) * (critical ? 2 : 1);
export const guardianDefeated = b =>
  b?.version === 2 ? b.phase === 'victory' && b.bossHp === 0 && b.finishStep === 3 : b?.round === 3;
function shuffle(list, random) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function randomFor(seed) {
  let n = 2166136261;
  for (const c of String(seed)) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
  return () => {
    n += 0x6d2b79f5;
    let t = Math.imul(n ^ (n >>> 15), 1 | n);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Checked unit items only; no generated sentences or random distractor substitutions.
export function guardianSeals(unit, seed) {
  const random = randomFor(seed),
    questions = shuffle(
      (unit.questions || []).filter(q => q.prompt?.length <= 115 && (q.options || []).every(s => s.length <= 62)),
      random,
    ),
    gaps = shuffle(
      (unit.gaps || []).filter(q => q.prompt?.length <= 110 && (q.options || []).every(s => s.length <= 62)),
      random,
    ),
    words = shuffle(unit.vocabulary || [], random);
  const candidates = [];
  for (const q of questions)
    if (q.prompt && q.answer && new Set(q.options || []).size >= 3)
      candidates.push({ id: q.id, kind: 'question', prompt: q.prompt, answer: q.answer, options: q.options });
  if (gaps.length) {
    const g = gaps.find(q => q.prompt && q.answer && new Set(q.options || []).size >= 3);
    if (g)
      candidates.splice(1, 0, { id: g.id, kind: 'completion', prompt: g.prompt, answer: g.answer, options: g.options });
  }
  const chosen = candidates.slice(0, 3);
  for (const w of words) {
    if (chosen.length === 3) break;
    if (!w.en || !w.tr) continue;
    const others = shuffle([...new Set(words.map(x => x.tr).filter(t => t && t !== w.tr))], random).slice(0, 2);
    if (others.length === 2)
      chosen.push({ id: w.id, kind: 'meaning', prompt: w.en, answer: w.tr, options: [w.tr, ...others] });
  }
  if (chosen.length !== 3) throw Error('The unit needs three checked finisher items.');
  return chosen.map(q => {
    const wrong = shuffle(
      [...new Set(q.options)].filter(x => x !== q.answer),
      random,
    ).slice(0, 2);
    return { ...q, options: shuffle([q.answer, ...wrong], random) };
  });
}
// Short vocabulary items for the mid-fight wards: read a definition, pick the word.
export function guardianWards(unit, seed, seals = [], count = 2) {
  const random = randomFor(seed + ':wards'),
    used = new Set(seals.map(q => q.id)),
    words = (unit.vocabulary || []).filter(w => w.en && w.tr && !used.has(w.id)),
    pool = shuffle(words, random),
    out = [];
  for (const w of pool) {
    if (out.length === count) break;
    const others = shuffle([...new Set(words.map(x => x.en).filter(t => t !== w.en))], random).slice(0, 2);
    if (others.length < 2) continue;
    if (w.definition && w.definition.length <= 110)
      out.push({
        id: w.id,
        kind: 'definition',
        prompt: w.definition,
        answer: w.en,
        options: shuffle([w.en, ...others], random),
      });
  }
  for (const w of pool) {
    if (out.length === count) break;
    if (out.some(q => q.id === w.id)) continue;
    const others = shuffle([...new Set(words.map(x => x.tr).filter(t => t !== w.tr))], random).slice(0, 2);
    if (others.length === 2)
      out.push({ id: w.id, kind: 'meaning', prompt: w.en, answer: w.tr, options: shuffle([w.tr, ...others], random) });
  }
  return out.length === count ? out : null;
}
export function freshGuardian(unit, seed, { tough = false } = {}) {
  const seals = guardianSeals(unit, seed),
    wards = guardianWards(unit, seed, seals, tough ? TOUGH_WARDS.length : WARDS.length),
    b = {
      version: 2,
      hp: 100,
      bossHp: 100,
      round: 0,
      phase: 'intro',
      timer: 0,
      attackNo: 0,
      kind: 'quake',
      targets: [],
      player: { x: 0, z: 5.8, y: 0, vy: 0 },
      invulnerable: 0,
      retries: 0,
      finishStep: 0,
      finishMistakes: 0,
      seals,
      hazards: [],
      stagger: false,
    };
  if (wards) {
    b.wards = wards;
    b.wardStep = 0;
  }
  if (tough) b.tough = true;
  return b;
}
// The question on screen: a ward mid-fight, or one of the three final seals.
export function guardianQuestion(b) {
  return b.phase === 'ward'
    ? { q: b.wards[b.wardStep], step: b.wardStep, ward: true }
    : b.phase === 'finisher'
      ? { q: b.seals[b.finishStep], step: b.finishStep, ward: false }
      : null;
}
const wardAt = b => (Array.isArray(b.wards) && b.wardStep < wardList(b).length ? wardList(b)[b.wardStep] : null);
const finite = (v, a, b) => Number.isFinite(v) && v >= a && v <= b;
const validQuestion = q =>
  !!q &&
  typeof q.id === 'string' &&
  q.id.length < 180 &&
  ['question', 'completion', 'meaning', 'definition'].includes(q.kind) &&
  typeof q.prompt === 'string' &&
  q.prompt.length <= 1600 &&
  typeof q.answer === 'string' &&
  q.answer.length <= 500 &&
  Array.isArray(q.options) &&
  q.options.length === 3 &&
  new Set(q.options).size === 3 &&
  q.options.every(t => typeof t === 'string' && t.length <= 500) &&
  q.options.includes(q.answer);
export function validGuardian(b) {
  if (!(
    !!b &&
    b.version === 2 &&
    b.round === 0 &&
    finite(b.hp, 1, 100) &&
    finite(b.bossHp, 0, 100) &&
    ['intro', 'windup', 'strike', 'recovery', 'ward', 'finisher', 'victory'].includes(b.phase) &&
    finite(b.timer, 0, 20) &&
    Number.isInteger(b.attackNo) &&
    b.attackNo >= 0 &&
    b.attackNo < 1000000 &&
    ATTACK_KINDS.includes(b.kind) &&
    Array.isArray(b.targets) &&
    b.targets.length <= 8 &&
    b.targets.every(t => finite(t.x, -20, 20) && finite(t.z, -15, 20)) &&
    b.player &&
    finite(b.player.x, -11, 11) &&
    finite(b.player.z, -8, 14) &&
    finite(b.player.y, 0, 5) &&
    finite(b.player.vy, -20, 20) &&
    finite(b.invulnerable, 0, 3) &&
    Number.isInteger(b.retries) &&
    b.retries >= 0 &&
    Number.isInteger(b.finishStep) &&
    b.finishStep >= 0 &&
    b.finishStep <= 3 &&
    Number.isInteger(b.finishMistakes) &&
    b.finishMistakes >= 0 &&
    Array.isArray(b.seals) &&
    b.seals.length === 3 &&
    b.seals.every(validQuestion)
  ))
    return false;
  // Fields added with the arena redesign are optional, so earlier saves still load.
  if (
    b.hazards !== undefined &&
    !(
      Array.isArray(b.hazards) &&
      b.hazards.length <= 6 &&
      b.hazards.every(h => finite(h.x, -20, 20) && finite(h.z, -15, 20) && finite(h.ttl, 0, 10))
    )
  )
    return false;
  if (b.stagger !== undefined && typeof b.stagger !== 'boolean') return false;
  if (b.tough !== undefined && b.tough !== true) return false;
  if (b.specials !== undefined && !(b.tough && validSpecialList(b.specials))) return false;
  if (
    b.specialsUsed !== undefined &&
    !(
      Array.isArray(b.specialsUsed) &&
      new Set(b.specialsUsed).size === b.specialsUsed.length &&
      b.specialsUsed.every(id => b.specials?.includes(id))
    )
  )
    return false;
  const wards = b.wards !== undefined,
    list = wardList(b);
  if (b.tough && !wards) return false;
  if (
    wards &&
    !(
      Array.isArray(b.wards) &&
      b.wards.length === list.length &&
      b.wards.every(validQuestion) &&
      Number.isInteger(b.wardStep) &&
      b.wardStep >= 0 &&
      b.wardStep <= list.length
    )
  )
    return false;
  if (b.phase === 'ward')
    return wards && b.wardStep < list.length && b.bossHp === list[b.wardStep] && b.finishStep === 0;
  return b.phase === 'victory'
    ? b.finishStep === 3 && b.bossHp === 0
    : b.phase === 'finisher'
      ? b.bossHp === 10 - [0, 3, 6][b.finishStep] && b.finishStep < 3
      : b.bossHp > 10 && b.finishStep === 0;
}
export function attackDuration(b, mode = 'relaxed') {
  const fast = mode === 'challenge',
    phase = guardianPhase(b),
    spec = attackSpec(b.kind);
  const tough = b.tough ? 1 : 0;
  return b.phase === 'intro'
    ? 2.3
    : b.phase === 'windup'
      ? ((fast ? 1.45 : 2.05) - (phase - 1) * 0.13) * (tough ? 0.85 : 1) + (spec.windup || 0)
      : b.phase === 'strike'
        ? spec.strike(b, mode)
        : b.phase === 'recovery'
          ? (fast ? 2.8 : 3.6) - (tough ? (fast ? 0.6 : 0.8) : 0) + (b.stagger ? 1.4 : 0)
          : 99;
}
export function quakeRadius(b) {
  return b.timer * 9;
}
export function beamEnd(b) {
  const t = b.targets[0] || b.player,
    dx = t.x - BOSS.x,
    dz = t.z - BOSS.z,
    d = Math.hypot(dx, dz) || 1;
  return { x: BOSS.x + (dx / d) * 23, z: BOSS.z + (dz / d) * 23 };
}
export function inGuardianDanger(b, p = b.player, body = { halfWidth: 0.35, halfDepth: 0.35 }, mode = 'relaxed') {
  if (!['quake', 'beam', 'falls'].includes(b.kind)) return shapesHit(attackShapes(b, mode), p, body);
  if (b.phase !== 'strike') return false;
  const yaw = Math.atan2(BOSS.x - p.x, BOSS.z - p.z);
  if (b.kind === 'quake') {
    const d = bodyDistanceInterval(body, p, yaw, BOSS),
      r = quakeRadius(b);
    return p.y < 0.52 && d.max > r - 0.5 && d.min < r + 0.5;
  }
  if (b.kind === 'beam')
    return b.timer > 0.12 && b.timer < 0.65 && bodyTouchesBeam(body, p, yaw, BOSS, beamEnd(b), 0.85);
  return b.timer > 0.34 && b.timer < 0.67 && b.targets.some(t => circlesTouchBody(body, p, yaw, t, 1.45));
}
export class GuardianCombat {
  constructor(
    state,
    {
      mode = 'relaxed',
      partner = 'hufflepuff',
      area = null,
      bodyProfile = { halfWidth: 0.35, halfDepth: 0.35 },
      event = () => {},
    } = {},
  ) {
    this.state = state;
    this.area = area;
    state.hazards ??= [];
    state.stagger ??= false;
    this.bodyProfile = bodyProfile;
    this.mode = mode;
    this.partner = partner;
    this.event = event;
    this.shots = [];
    this.cast = null;
    this.cooldown = 0;
    this.serial = 0;
    this.active = true;
  }
  resume() {
    const b = this.state;
    if (['windup', 'strike', 'recovery'].includes(b.phase)) {
      if (this.area !== null && !AREA_PATTERNS[this.area].flat().includes(b.kind))
        b.kind = AREA_PATTERNS[this.area][0][0];
      b.phase = 'windup';
      b.timer = 0;
      b.stagger = false;
      this.target();
    }
    b.player.y = 0;
    b.player.vy = 0;
    b.invulnerable = 1.2;
    this.shots = [];
    this.cast = null;
  }
  target() {
    const b = this.state;
    b.targets = attackSpec(b.kind).aim(b, this.mode);
  }
  nextAttack() {
    const b = this.state,
      phase = guardianPhase(b),
      patterns = (this.area === null ? LEGACY_PATTERNS : AREA_PATTERNS[this.area])[phase - 1];
    // A new phase opens with its new attack, then cycles.
    if (this.area !== null && phase !== this.patternPhase) {
      this.patternPhase = phase;
      this.cycle = 0;
    }
    b.kind = patterns[(this.area === null ? b.attackNo : this.cycle++) % patterns.length];
    b.attackNo++;
    b.phase = 'windup';
    b.timer = 0;
    b.stagger = false;
    this.coreClosed = false;
    this.target();
    this.event('warning', b.kind);
  }
  jump() {
    const b = this.state,
      p = b.player;
    if (!this.active || !['windup', 'strike', 'recovery'].includes(b.phase) || p.y > 0 || p.vy !== 0) return false;
    p.vy = jumpTuning(this.bodyProfile?.level ?? 0).guardianVelocity;
    this.event('jump');
    return true;
  }
  attack() {
    const b = this.state;
    if (!this.active || !['windup', 'strike', 'recovery'].includes(b.phase) || this.cast || this.cooldown > 0)
      return false;
    const spec = elementalAttack(this.partner);
    this.cast = {
      ranged: true,
      partner: this.partner,
      spec,
      element: spec.element,
      age: 0,
      duration: spec.windup + spec.recovery,
      heading: Math.atan2(BOSS.x - b.player.x, BOSS.z - b.player.z),
      x: b.player.x,
      z: b.player.z,
    };
    this.cooldown = this.cast.duration + 0.12;
    this.event('cast', this.cast);
    return true;
  }
  hitBoss() {
    const b = this.state;
    if (b.phase !== 'recovery' || this.coreClosed) {
      this.event('blocked');
      return false;
    }
    const critical = b.stagger,
      ward = wardAt(b),
      floor = ward !== null && b.bossHp > ward ? ward : 10;
    b.bossHp = Math.max(floor, b.bossHp - guardianHit(b, critical));
    this.event('boss-hit', { critical });
    // One hit per opening: the core closes and the next attack follows shortly.
    b.stagger = false;
    this.coreClosed = true;
    b.timer = Math.max(b.timer, attackDuration(b, this.mode) - 0.9);
    if (b.bossHp === ward && floor === ward) {
      b.phase = 'ward';
      b.timer = 0;
      b.player.y = 0;
      b.player.vy = 0;
      b.stagger = false;
      this.cast = null;
      this.shots = [];
      this.event('ward', b.wardStep);
      return true;
    }
    if (b.bossHp === 10) {
      b.phase = 'finisher';
      b.timer = 0;
      b.player.y = 0;
      b.player.vy = 0;
      this.cast = null;
      this.shots = [];
      this.event('finisher');
    }
    return true;
  }
  answer(text) {
    const b = this.state;
    if (b.phase === 'ward') {
      const q = b.wards[b.wardStep];
      if (text !== q.answer) {
        b.finishMistakes++;
        this.event('mistake');
        return { accepted: false, mistake: true, id: q.id, ward: true };
      }
      b.wardStep++;
      b.phase = 'recovery';
      b.timer = 0;
      b.stagger = true;
      this.coreClosed = false;
      this.event('ward-broken', b.wardStep);
      return { accepted: true, id: q.id, ward: true, complete: false };
    }
    if (b.phase !== 'finisher') return { accepted: false };
    const q = b.seals[b.finishStep];
    if (text !== q.answer) {
      b.finishMistakes++;
      this.event('mistake');
      return { accepted: false, mistake: true, id: q.id };
    }
    b.finishStep++;
    b.bossHp = [10, 7, 4, 0][b.finishStep];
    b.timer = 0;
    this.event('seal', b.finishStep);
    if (b.finishStep === 3) {
      b.phase = 'victory';
      this.event('victory');
    }
    return { accepted: true, id: q.id, complete: b.finishStep === 3 };
  }
  hurt() {
    const b = this.state;
    if (b.invulnerable > 0) return;
    b.hp = Math.max(0, b.hp - (b.tough ? (this.mode === 'challenge' ? 34 : 25) : this.mode === 'challenge' ? 25 : 20));
    b.invulnerable = 1.5;
    this.event('hurt');
    if (b.hp === 0) {
      if (b.tough) b.bossHp = Math.max(b.bossHp, b.wardStep > 0 ? wardList(b)[b.wardStep - 1] : 100);
      b.hp = 100;
      b.retries++;
      b.player = { x: 0, z: 5.8, y: 0, vy: 0 };
      b.phase = 'windup';
      b.timer = 0;
      b.invulnerable = 2;
      b.stagger = false;
      b.hazards = [];
      this.target();
      this.shots = [];
      this.cast = null;
      this.event('retry');
    }
  }
  // Elemental specials (specials.js): one use each. The guardian is held while the effect plays, the damage lands at
  // the impact moment and stops at the next ward (or at the seals), then the core opens.
  special(id, level = 0) {
    const b = this.state,
      spec = specialSpec(id);
    if (
      !this.active ||
      !spec ||
      this.channel ||
      !['windup', 'strike', 'recovery'].includes(b.phase) ||
      !b.specials?.includes(id) ||
      b.specialsUsed?.includes(id)
    )
      return false;
    this.channel = { spec, age: 0, damage: specialDamage(spec, level), landed: false };
    this.cast = null;
    this.shots = [];
    b.targets = [];
    b.player.vy = 0;
    b.player.y = 0;
    this.event('special', { spec, damage: this.channel.damage });
    return true;
  }
  landSpecial(c) {
    const b = this.state,
      spec = c.spec;
    (b.specialsUsed ??= []).push(spec.id);
    const ward = wardAt(b),
      floor = ward !== null && b.bossHp > ward ? ward : 10,
      before = b.bossHp;
    b.bossHp = Math.max(floor, b.bossHp - c.damage);
    b.hazards = [];
    this.event('special-hit', { spec, damage: before - b.bossHp, capped: before - b.bossHp < c.damage });
    if (b.bossHp === ward && floor === ward) {
      b.phase = 'ward';
      b.timer = 0;
      b.stagger = false;
      this.event('ward', b.wardStep);
      return;
    }
    if (b.bossHp === 10) {
      b.phase = 'finisher';
      b.timer = 0;
      b.stagger = false;
      this.event('finisher');
      return;
    }
    b.phase = 'recovery';
    b.timer = 0;
    b.stagger = spec.bind || b.stagger;
    this.coreClosed = false;
    this.event('opening', { stagger: b.stagger });
  }
  step(dt, input = { x: 0, z: 0 }) {
    if (!this.active || !Number.isFinite(dt) || dt <= 0) return;
    dt = Math.min(0.05, dt);
    const b = this.state,
      p = b.player;
    if (this.channel) {
      const c = this.channel;
      c.age += dt;
      b.invulnerable = Math.max(b.invulnerable, 0.4);
      if (!c.landed && c.age >= c.spec.impactAt) {
        c.landed = true;
        this.landSpecial(c);
      }
      if (c.age >= c.spec.duration) this.channel = null;
      return;
    }
    b.timer = Math.min(20, b.timer + dt);
    b.invulnerable = Math.max(0, b.invulnerable - dt);
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (!['intro', 'ward', 'finisher', 'victory'].includes(b.phase)) {
      const spec = attackSpec(b.kind),
        prev = { x: p.x, z: p.z },
        length = Math.hypot(input.x, input.z),
        speed = this.mode === 'relaxed' ? 4.9 : 5.1;
      if (length > 0) {
        p.x += (input.x / Math.max(1, length)) * speed * dt;
        p.z += (input.z / Math.max(1, length)) * speed * dt;
      }
      if (b.phase === 'strike') {
        spec.pull?.(b, dt);
        spec.step?.(b, this.mode, dt);
        if (spec.land && b.timer >= 0.5 && b.timer - dt < 0.5) spec.land(b, this.mode);
      }
      b.hazards = b.hazards.filter(h => (h.ttl = Math.max(0, h.ttl - dt)) > 0);
      const yaw = Math.atan2(BOSS.x - p.x, BOSS.z - p.z),
        wall = cageWall(b);
      if (wall) blockCage(wall, prev, p, this.bodyProfile);
      for (const s of spec.solids?.(b) || []) separateBodyFromCircle(this.bodyProfile, p, yaw, s, s.r);
      containBody(this.bodyProfile, p, yaw, ARENA);
      separateBodyFromCircle(this.bodyProfile, p, yaw, BOSS, BOSS.radius);
      if (p.y > 0 || p.vy > 0) {
        p.vy -= 16 * dt;
        p.y = Math.max(0, p.y + p.vy * dt);
        if (p.y === 0) {
          p.vy = 0;
          this.event('land');
        }
      }
      if (inGuardianDanger(b, p, this.bodyProfile, this.mode)) this.hurt();
      if (b.timer >= attackDuration(b, this.mode)) {
        if (b.phase === 'intro' || b.phase === 'recovery') this.nextAttack();
        else if (b.phase === 'windup') {
          b.phase = 'strike';
          b.timer = 0;
          this.event('strike', b.kind);
        } else {
          b.phase = 'recovery';
          b.timer = 0;
          b.stagger = bigAttack(b.kind);
          b.targets = b.kind === 'twisters' ? [] : b.targets;
          this.event('opening', { stagger: b.stagger });
        }
      }
    } else if (b.phase === 'intro' && b.timer >= attackDuration(b, this.mode)) this.nextAttack();
    if (this.cast) {
      const a = this.cast,
        old = a.age;
      a.age += dt;
      if (old < a.spec.windup && a.age >= a.spec.windup) {
        a.heading = Math.atan2(BOSS.x - p.x, BOSS.z - p.z);
        const y = Math.max(0.7, p.y + 0.7);
        this.shots.push({
          id: 'guardian-shot-' + ++this.serial,
          partner: this.partner,
          element: a.element,
          spec: a.spec,
          heading: a.heading,
          x: p.x,
          z: p.z,
          y,
          from: { x: p.x, z: p.z, y },
          travel: 0,
          targetDistance: Math.hypot(p.x - BOSS.x, p.z - BOSS.z),
        });
        this.event('release', a);
      }
      if (a.age >= a.duration) this.cast = null;
    }
    this.shots = this.shots.filter(s => {
      const prev = { x: s.x, z: s.z },
        distance = s.spec.speed * dt;
      s.x += Math.sin(s.heading) * distance;
      s.z += Math.cos(s.heading) * distance;
      s.travel += distance;
      s.y = s.from.y + (5.6 - s.from.y) * clamp(s.travel / Math.max(0.1, s.targetDistance - 1.8), 0, 1);
      const bush = b.hazards.findIndex(h => segmentHit(prev, s, h, 0.95) !== null);
      if (bush >= 0) {
        const h = b.hazards.splice(bush, 1)[0];
        this.event('clear', { ...s, x: h.x, z: h.z });
        return false;
      }
      if (segmentHit(prev, s, BOSS, 1.8) !== null) {
        const hit = this.hitBoss();
        this.event('impact', { ...s, hit });
        return false;
      }
      return s.travel < s.spec.range;
    });
  }
}
