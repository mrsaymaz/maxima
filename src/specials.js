// Elemental specials: three one-use attacks per team, bought with coins at the Elemental Shrine before the guardian
// arena of a six-gate area, and gone once the fight is over. Their strength grows with the creature's Level (Form),
// but they never break a ward or a seal: a special stops at the next ward, so the English wards and the three final
// seals still have to be answered to win.
export const SPECIAL_PRICES = [60, 120, 200];
const S = (team, tier, id, name, line, extra = {}) => ({
  id,
  team,
  tier,
  price: SPECIAL_PRICES[tier - 1],
  name,
  line,
  power: [9, 13, 20][tier - 1],
  // Seconds the effect plays, and when it lands (damage is dealt at the impact moment).
  duration: [2.6, 3.4, 4.4][tier - 1],
  impactAt: [1.1, 1.5, 2.4][tier - 1],
  // A tier-2 special binds the guardian: it staggers, so the next cast is a critical hit, and the opening lasts longer.
  bind: tier === 2,
  ...extra,
});
export const SPECIALS = [
  S('gryffindor', 1, 'fire-pillars', 'Fire Pillars', 'Five pillars of flame burst up around the guardian.'),
  S('gryffindor', 2, 'flame-prison', 'Flame Prison', 'A ring of fire walls closes in and binds the guardian.'),
  S('gryffindor', 3, 'meteor-storm', 'Meteor Storm', 'Blazing meteors rain down, ending in one colossal strike.'),
  S('ravenclaw', 1, 'ice-spears', 'Ice Spears', 'A volley of ice spears flies straight at the core.'),
  S('ravenclaw', 2, 'frost-lock', 'Frost Lock', 'Ice crystals grow over the guardian and lock it in place.'),
  S('ravenclaw', 3, 'tidal-wave', 'Tidal Wave', 'A towering wave rises behind you and crashes over the guardian.'),
  S('hufflepuff', 1, 'thunderbolt', 'Thunderbolt', 'Three bolts of lightning strike from a clear sky.'),
  S('hufflepuff', 2, 'updraft', 'Updraft', 'A roaring whirlwind lifts the guardian and holds it.'),
  S('hufflepuff', 3, 'tempest', 'Tempest', 'A storm wheel opens above the arena: wind, rain and lightning.'),
  S('slytherin', 1, 'thorn-volley', 'Thorn Volley', 'Waves of giant thorns burst from the ground.'),
  S('slytherin', 2, 'root-bind', 'Root Bind', 'Ancient roots erupt and wrap the guardian tight.'),
  S(
    'slytherin',
    3,
    'ancient-grove',
    'Ancient Grove',
    'A colossal tree grows beneath the guardian and lifts it skyward.',
  ),
];
export const SPECIAL_IDS = SPECIALS.map(s => s.id);
export const special = id => SPECIALS.find(s => s.id === id) || null;
export const specialsFor = team => SPECIALS.filter(s => s.team === team);
// Damage in guardian health points: power × (1 + 0.1 × Level).
export const specialDamage = (spec, level = 0) =>
  Math.round(spec.power * (1 + 0.1 * Math.max(0, Math.min(10, level || 0))));
// Buying: one of each per fight, paid from the wallet.
export function buySpecial(save, e, id, team) {
  const spec = special(id);
  if (!spec || spec.team !== team || !e || e.battle) return { ok: false, reason: 'unavailable' };
  e.specials ??= [];
  if (e.specials.includes(id)) return { ok: false, reason: 'owned' };
  const balance = save.wallet?.balance || 0;
  if (balance < spec.price) return { ok: false, reason: 'coins', need: spec.price - balance };
  save.wallet.balance -= spec.price;
  e.specials.push(id);
  return { ok: true, spec };
}
export const validSpecialList = list =>
  Array.isArray(list) &&
  list.length <= 3 &&
  new Set(list).size === list.length &&
  list.every(id => SPECIAL_IDS.includes(id)) &&
  new Set(list.map(id => special(id).team)).size <= 1;
