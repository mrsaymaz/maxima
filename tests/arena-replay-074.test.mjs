// 0.74.0/0.75.0: a won arena can be played again: a fresh route from the same lesson, the creature goes back to the
// arena's starting level and grows again, and a won guardian rematch completes the area again (Ulti like any win).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  freshSave,
  freshJourney,
  freshExpedition,
  validSave,
  winGuardian,
  orderFor,
  guardianReady,
  rematchReady,
  fightReady,
  canReplay,
  startReplay,
  finishExpedition,
  syncArenaLevel,
  milestone,
  currentType,
} from '../src/expedition.js';
import { pathGrowthState } from '../src/path-growth.js';
import { freshGuardian } from '../src/guardian-combat.js';
import { gateCount } from '../src/path-shape.js';
import { launchMarkup } from '../src/launch-ui.js';
import { shrineOverlay } from '../src/specials-ui.js';
import { PARTNERS } from '../src/partners.js';

const units = JSON.parse(fs.readFileSync('content/data/expedition-language.json')).units,
  u = units[0];
// Plays an expedition to its end: every gate done, every chest open.
function finishRoute(e) {
  const n = gateCount(e);
  e.index = n;
  e.choices.fill('left');
  e.completed = Array.from({ length: n }, (_, index) => ({
    index,
    id: e.id + ':' + index,
    type: orderFor(e, Math.floor(index / 4))[index % 4],
  }));
  e.chests = [0, 1, 2, 3, 4];
  e.phase = 'end';
}
function wonFirstArena() {
  const s = freshSave(),
    j = (s.journeys[u.id] = freshJourney()),
    e = (j.expeditions[0] = freshExpedition(j, u.id, 0));
  j.level = 3;
  j.pathSteps = 20;
  finishRoute(e);
  e.battle = { round: 3, hp: 100 };
  assert.ok(winGuardian(j, e));
  delete e.pendingEvolution;
  return { s, j };
}

test("a won arena starts again as a practice replay, back at the arena's starting level", () => {
  const { s, j } = wonFirstArena();
  assert.equal(j.level, 4);
  assert.ok(canReplay(j, 0));
  assert.equal(canReplay(j, 1), false, 'only won arenas');
  assert.equal(startReplay(j, u.id, 1), null);
  const old = j.expeditions[0].id,
    e = startReplay(j, u.id, 0);
  assert.equal(e.replay, true);
  assert.notEqual(e.id, old, 'a new route (and a new League ticket id)');
  assert.equal(e.index, 0);
  assert.equal(j.level, 0, 'Whisperwood starts again at Level 0');
  assert.equal(j.levelArea, 0);
  assert.equal(canReplay(j, 0), false, 'already under way');
  assert.deepEqual(j.guardians, [0], 'arenas stay unlocked');
  assert.ok(validSave(s, units));
  assert.equal(pathGrowthState(j).area, 0, 'the HUD follows the replayed arena');
});

test('the replay grows the creature at the same gates, and a won rematch gives the guardian level again', () => {
  const { s, j } = wonFirstArena(),
    e = startReplay(j, u.id, 0);
  assert.equal(fightReady(j, e), false, 'no fight before the end');
  e.choices.fill('left');
  const levels = [];
  for (let i = 0; i < gateCount(e); i++) {
    const type = currentType(e);
    e.active = { type, complete: true, nodeId: `${e.id}:${e.index}` };
    const r = milestone(j, e, type);
    assert.ok(r.changed);
    levels.push(j.level);
    if (r.evolved) {
      assert.deepEqual(e.pendingEvolution, { from: r.from, to: r.to, checkpoint: e.index }, 'a full evolution plays');
      delete e.pendingEvolution;
    }
  }
  assert.equal(j.level, 3, 'Level 3 at the last gate, as the first time');
  assert.ok(levels.includes(1) && levels.includes(2) && levels.includes(3));
  e.chests = [0, 1, 2, 3, 4];
  e.phase = 'end';
  assert.equal(guardianReady(j, e), false, 'the first-win fight is not reopened');
  assert.ok(rematchReady(j, e));
  assert.ok(fightReady(j, e));
  assert.deepEqual(finishExpedition(j, e), { changed: true, guardian: true });
  e.battle = freshGuardian(u, e.id);
  assert.ok(validSave(s, units));
  assert.equal(winGuardian(j, e), false, 'only a defeated guardian');
  e.battle = { round: 3, hp: 100 };
  assert.ok(winGuardian(j, e));
  assert.equal(e.rematchWon, true);
  assert.equal(e.phase, 'closed');
  assert.equal(j.level, 4, 'the guardian gives Level 4 again');
  assert.deepEqual(e.pendingEvolution, { from: 3, to: 4, checkpoint: gateCount(e), boss: true });
  assert.deepEqual(j.guardians, [0]);
  assert.equal(j.rematches, 1);
  assert.equal(winGuardian(j, e), false, 'once per replay');
  assert.ok(validSave(s, units));
  assert.ok(canReplay(j, 0), 'and it can be played again');
});

test('going back to an unfinished arena after a replay returns the level earned there', () => {
  const { s, j } = wonFirstArena();
  const sky = (j.expeditions[1] = freshExpedition(j, u.id, 1));
  sky.index = 0;
  assert.ok(validSave(s, units));
  startReplay(j, u.id, 0);
  assert.equal(j.level, 0);
  assert.ok(syncArenaLevel(j, sky), 'entering Skyreach');
  assert.equal(j.level, 4, 'Skyreach starts at Level 4');
  assert.equal(j.levelArea, undefined);
  assert.ok(validSave(s, units));
  assert.equal(syncArenaLevel(j, sky), false, 'nothing to change the second time');
  // Coming back to the replay that was left halfway puts the creature at that replay's level.
  const back = j.expeditions[0];
  assert.ok(syncArenaLevel(j, back));
  assert.equal(j.level, 0);
  assert.equal(j.levelArea, 0);
  assert.ok(validSave(s, units));
});

test('a finished journey replays from the arena start too, and saves stay valid', () => {
  const { s, j } = wonFirstArena();
  j.guardians = [0, 1, 2];
  j.completed = true;
  j.level = 10;
  for (const a of [1, 2]) {
    const e = (j.expeditions[a] = freshExpedition(j, u.id, a));
    finishRoute(e);
    e.phase = 'closed';
  }
  j.pathSteps = 60;
  assert.ok(validSave(s, units));
  startReplay(j, u.id, 2);
  assert.equal(j.level, 8, 'Stormglass starts at Level 8');
  assert.ok(validSave(s, units));
  j.level = 11;
  assert.equal(validSave(s, units), false);
  j.level = 3;
  assert.equal(validSave(s, units), false, 'a replay level stays inside its arena');
});

test('replay flags are checked when a save is loaded', () => {
  const { s, j } = wonFirstArena();
  const e = (j.expeditions[1] = freshExpedition(j, u.id, 1));
  e.replay = true;
  assert.equal(validSave(s, units), false, 'an arena not yet won cannot be a replay');
  delete e.replay;
  e.rematchWon = true;
  assert.equal(validSave(s, units), false);
});

test('the opening screen offers "Play again" for a won arena and continues a replay under way', () => {
  const c = {
    coins: 0,
    areas: [
      { name: 'Whisperwood', selected: true, completed: true, progress: 6, gates: 6 },
      { name: 'Skyreach', progress: 0, gates: 6 },
      { name: 'Stormglass', locked: true },
    ],
    partners: PARTNERS.map((p, i) => ({ ...p, level: 4, portrait: 'x.png', selected: i === 0 })),
    grade: 5,
    unitTitle: 'School Life',
    nickname: 'Breeze',
    level: 4,
    mode: 'relaxed',
    areaName: 'Whisperwood',
    nextArea: 1,
    nextAreaTitle: 'Skyreach',
    replayable: true,
  };
  const won = launchMarkup(c);
  assert.match(won, /data-do="next-area"/, 'the next arena stays the main button');
  assert.match(won, /class="launch-replay" data-do="replay">↻ Play Whisperwood again/);
  assert.match(won, /from Level 0 · grow again · Ulti for a win/);
  assert.match(won, /Completed · play again/);
  const done = launchMarkup({ ...c, nextArea: null, completed: true });
  assert.match(done, /Choose a new journey/);
  assert.match(done, /launch-replay/, 'a finished journey can still be practised');
  const under = launchMarkup({
    ...c,
    replayable: false,
    replaying: true,
    resume: true,
    progress: 3,
    areas: c.areas.map((a, i) => (i ? a : { ...a, replaying: true, progress: 3 })),
  });
  assert.match(under, /data-do="enter"><span>Continue practice/);
  assert.match(under, /Practice run · 3\/6 gates/);
  assert.match(under, /Practice · 3\/6 gates/);
  assert.ok(!under.includes('launch-replay'));
  assert.match(launchMarkup({ ...c, replaying: true, guardian: 'Thornback' }), /Rematch the guardian/);
});

test('the shrine marks a rematch, shows its Ulti and lets it be skipped', () => {
  const base = { team: 'hufflepuff', element: 'Air', balance: 0, level: 4, owned: [] },
    ulti = { points: 8, grade: 5, team: 'Hufflepuff', icon: '' };
  const r = shrineOverlay({ ...base, rematch: true, ulti });
  assert.match(r, /Practice rematch/);
  assert.match(r, /Win: \+8 Ulti for Grade 5 Hufflepuff/, 'a won rematch earns Ulti too');
  assert.match(r, /data-do="rematch-skip"/);
  assert.ok(!shrineOverlay({ ...base, ulti }).includes('rematch-skip'));
});

test('the game wiring: tickets, Ulti claim, evolutions and lives in a replay', () => {
  const src = fs.readFileSync(new URL('../src/corridor-app.js', import.meta.url), 'utf8');
  assert.match(src, /journey\(\)\.guardians\.includes\(e\.area\) && !e\.replay\)\)/, 'replays get League tickets');
  assert.match(
    src,
    /if \(b\.tough\) claimUlti\(won\.id, info\);\s+const p = state\(\)\.pendingEvolution;/,
    'every guardian win, rematches too, claims Ulti and then evolves',
  );
  assert.match(
    src,
    /const replay = !!e\.replay && j\.guardians\.includes\(area\);\s+j\.level = pathLevel\(0, area, SHORT\.gates\);/,
    'out of lives: back to the arena start',
  );
  assert.match(src, /if \(syncArenaLevel\(journey\(\), state\(\)\)\) \{/, 'entering an arena sets its level');
  assert.match(src, /evolution\(journey\(\)\.completed && p\.to === 10,/, 'a rematch below Level 10 is not the finale');
  assert.match(src, /data-do="replay-confirm"/, 'the level drop is confirmed first');
  assert.ok(!/guardianReady\(/.test(src), 'every fight gate also opens for rematches');
});
