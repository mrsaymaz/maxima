// 0.74.0: a won arena can be played again for practice: a fresh route from the same lesson, the creature keeps its
// level, and a won guardian rematch completes the area again (Ulti like any completed area).
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
} from '../src/expedition.js';
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

test('a won arena starts again as a practice replay; the creature keeps its level', () => {
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
  assert.equal(canReplay(j, 0), false, 'already under way');
  assert.ok(validSave(s, units));
  assert.deepEqual(j.guardians, [0]);
  assert.equal(j.level, 4);
});

test('the replay ends with a rematch; winning it completes the area again without a new level', () => {
  const { s, j } = wonFirstArena(),
    e = startReplay(j, u.id, 0);
  assert.equal(fightReady(j, e), false, 'no fight before the end');
  finishRoute(e);
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
  assert.equal(e.pendingEvolution, undefined, 'no evolution');
  assert.equal(j.level, 4);
  assert.deepEqual(j.guardians, [0]);
  assert.equal(j.rematches, 1);
  assert.equal(winGuardian(j, e), false, 'once per replay');
  assert.ok(validSave(s, units));
  assert.ok(canReplay(j, 0), 'and it can be played again');
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

test('the game wiring: tickets, Ulti claim and lives in a replay', () => {
  const src = fs.readFileSync(new URL('../src/corridor-app.js', import.meta.url), 'utf8');
  assert.match(
    src,
    /journey\(\)\.guardians\.includes\(e\.area\) && !e\.replay\)\) return;/,
    'replays get League tickets',
  );
  assert.match(src, /if \(b\.tough\) claimUlti\(won\.id, info\);\s+if \(won\.replay\) \{/, 'a won rematch claims Ulti');
  assert.match(
    src,
    /if \(!replay\) j\.level = pathLevel\(0, area, SHORT\.gates\);/,
    'running out of lives keeps the level',
  );
  assert.ok(!/guardianReady\(/.test(src), 'every fight gate also opens for rematches');
});
