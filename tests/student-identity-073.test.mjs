// 0.73.0 "Who are you?": students choose their class and name from the English League roster, so the League's Ulti log
// shows who earned each win, and a named student's wins go to their own class grade and League team.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createLeague, validStudentId } from '../src/league.js';
import {
  classStepMarkup,
  nameStepMarkup,
  confirmMarkup,
  studentLineMarkup,
  pickerClasses,
} from '../src/student-picker.js';
import { launchMarkup } from '../src/launch-ui.js';
import { PARTNERS } from '../src/partners.js';

const store = () => {
  const m = new Map();
  return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
};
function server(reply) {
  const sent = [];
  return {
    sent,
    fetch: async (url, o) => {
      const body = JSON.parse(o.body);
      sent.push(body);
      const r = reply(body);
      if (r instanceof Error) throw r;
      return { ok: (r.code || 200) < 400, status: r.code || 200, json: async () => r.data };
    },
  };
}
const ROSTER = {
  status: 'success',
  rosterVersion: 1,
  grade: 5,
  classes: ['5-A', '5-C'],
  students: [
    { id: '5-A:slytherin:0', name: 'Zeynep', className: '5-A', team: 'slytherin' },
    { id: '5-A:gryffindor:1', name: 'Çağrı', className: '5-A', team: 'gryffindor' },
    { id: '5-A:ravenclaw:2', name: 'Ada', className: '5-A', team: 'ravenclaw' },
    { id: '5-C:hufflepuff:0', name: 'Emir', className: '5-C', team: 'hufflepuff' },
    { id: 'bad id!', name: 'Nope', className: '5-A', team: 'slytherin' },
    { id: '5-A:x:9', name: 'Wrong team', className: '5-A', team: 'dragons' },
  ],
};

test('Student IDs are the roster form only', () => {
  assert.ok(validStudentId('5-A:slytherin:0'));
  for (const bad of ['', 'a b', 'x'.repeat(101), null, 5, '<b>']) assert.equal(validStudentId(bad), false);
});

test('the roster comes from the League without a code, is checked, and is kept for offline use', async () => {
  let online = true;
  const s = server(b => (online ? { data: ROSTER } : new Error('offline')));
  const st = store(),
    L = createLeague({ api: 'https://x', storage: st, fetchImpl: s.fetch });
  assert.equal(L.cachedRoster(5), null);
  const r = await L.roster(5);
  assert.deepEqual(s.sent[0], { action: 'roster', grade: 5 });
  assert.equal(r.online, true);
  assert.deepEqual(r.classes, ['5-A', '5-C']);
  assert.equal(r.students.length, 4, 'malformed IDs and unknown teams are dropped');
  online = false;
  const again = createLeague({ api: 'https://x', storage: st, fetchImpl: s.fetch });
  const cached = await again.roster(5);
  assert.equal(cached.online, false);
  assert.equal(cached.students.length, 4);
  assert.equal(await again.roster(9), null);
  assert.equal(await createLeague({ api: '' }).roster(5), null, 'League off: no picker data');
});

test("a ticket carries the student; the League's credited grade and team come back with the win", async () => {
  const s = server(b =>
    b.action === 'start'
      ? { data: { status: 'success', ticket: 'T' + s.sent.length } }
      : { data: { status: 'success', points: 8, grade: 5, team: 'slytherin', student: { id: '5-A:slytherin:0' } } },
  );
  const L = createLeague({ api: 'https://x', storage: store(), fetchImpl: s.fetch });
  await L.start({ runId: 'r1', grade: 7, team: 'gryffindor', arena: 0, pace: 'relaxed', student: '5-A:slytherin:0' });
  assert.equal(s.sent[0].student, '5-A:slytherin:0');
  const r = await L.claim('r1');
  assert.deepEqual([r.points, r.grade, r.team], [8, 5, 'slytherin']);
  await L.start({ runId: 'r2', grade: 7, team: 'gryffindor', arena: 0, pace: 'relaxed', student: 'bad id!' });
  assert.equal('student' in s.sent[2], false, 'an invalid ID is never sent');
  await L.start({ runId: 'r3', grade: 7, team: 'gryffindor', arena: 0, pace: 'relaxed' });
  assert.equal('student' in s.sent[3], false, 'without a name the start is as before');
});

test("the picker lists the chosen grade's classes and, in the class, the chosen team's names only", () => {
  const S = ROSTER.students.slice(0, 4);
  const c = classStepMarkup({ grade: 5, team: 'slytherin', classes: ROSTER.classes, students: S });
  assert.match(c, /Grade 5 Slytherin! Which class are you in\?/);
  assert.equal((c.match(/data-do="student-class"/g) || []).length, 1, 'only 5-A has a Slytherin');
  assert.ok(!c.includes('student-grade'), 'no grade tabs: the lesson grade is used');
  assert.match(c, /data-do="student-all"/);
  assert.match(c, /data-do="student-skip"/);
  assert.deepEqual(pickerClasses(ROSTER.classes, S, 'hufflepuff'), ['5-C']);
  assert.deepEqual(pickerClasses(ROSTER.classes, S, 'hufflepuff', true), ['5-A', '5-C']);
  assert.match(classStepMarkup({ loading: true }), /Loading the class list/);
  assert.match(classStepMarkup({ offline: true }), /data-do="student-retry"/);
  const all = classStepMarkup({ grade: 5, team: 'slytherin', all: true, classes: ROSTER.classes, students: S });
  assert.match(all, /data-do="student-grade" data-value="5" aria-pressed="true"/);
  assert.equal((all.match(/data-do="student-class"/g) || []).length, 2);
  assert.ok(!all.includes('student-all'));
  const team = [...S, { id: '5-A:slytherin:7', name: 'Ömer', className: '5-A', team: 'slytherin' }];
  const n = nameStepMarkup({ className: '5-A', team: 'slytherin', students: team, canGoBack: false });
  const names = html => [...html.matchAll(/<\/i>([^<]+)<\/button>/g)].map(m => m[1]);
  assert.deepEqual(names(n), ['Ömer', 'Zeynep'], 'teammates only, sorted with Turkish letters in place');
  assert.match(n, /Hello, 5-A Slytherin! Tap your name\./);
  assert.ok(!n.includes('data-do="student-back"'), 'a one-class grade has no class step to go back to');
  const everyone = nameStepMarkup({ className: '5-A', team: 'slytherin', all: true, students: team });
  assert.deepEqual(names(everyone), ['Ada', 'Çağrı', 'Ömer', 'Zeynep']);
  assert.match(everyone, /data-do="student-back"/);
  const k = confirmMarkup({ student: ROSTER.students[0] });
  assert.match(k, /Are you Zeynep\?/);
  assert.match(k, /Grade 5 Slytherin\./);
  assert.match(k, /data-do="student-confirm"/);
  assert.match(
    nameStepMarkup({ className: '5-A', students: [{ ...ROSTER.students[0], name: '<img>' }] }),
    /&lt;img&gt;/,
  );
});

test('the opening screen names who is playing (League on only), with a way to change it', () => {
  assert.match(studentLineMarkup(null), /Who are you\?/);
  const line = studentLineMarkup({ name: 'Zeynep', className: '5-A', team: 'slytherin' });
  assert.match(line, /Playing as <\/em><b>Zeynep<\/b> · 5-A/);
  assert.match(line, /data-do="student"/);
  const c = {
    coins: 0,
    areas: [{ name: 'Whisperwood', selected: true, progress: 0, gates: 6 }],
    partners: PARTNERS.map((p, i) => ({ ...p, level: 0, portrait: 'x.png', selected: i === 0 })),
    grade: 5,
    unitTitle: 'School Life',
    nickname: 'Breeze',
    level: 0,
    mode: 'relaxed',
  };
  assert.ok(!launchMarkup(c).includes('launch-student'));
  assert.match(launchMarkup({ ...c, studentLine: line }), /class="launch-student"/);
});

test('the game asks only when the League is on, before the first run, and remembers the choice', () => {
  const src = fs.readFileSync(new URL('../src/corridor-app.js', import.meta.url), 'utf8');
  assert.match(
    src,
    /if \(!league\.enabled \|\| save\.student \|\| save\.studentSkip\) return Promise\.resolve\(true\);/,
  );
  assert.equal(
    (src.match(/if \(!\(await ensureStudent\(\)\)\) break;/g) || []).length,
    2,
    'PLAY and Continue both ask first',
  );
  assert.match(src, /student: save\.student\?\.id \|\| ''/, "the Student ID goes into each area's ticket");
  assert.match(
    src,
    /grade: unit\(\)\.grade,\s+team: partner\(\)\.id,/,
    'the chosen lesson grade and team filter the list',
  );
  const html = fs.readFileSync(new URL('../src/index.html', import.meta.url), 'utf8');
  assert.match(html, /href="student\.css"/);
});
