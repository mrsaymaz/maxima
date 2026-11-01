import { RUNNER, switchPlayMode } from './runner-mode.js';
import { setRunnerWords, chaseWarning, RUN_LEAD } from './runner-course.js';
import { courseCoordinates, localPoint } from './traversal-layout.js';
import {
  showWord,
  showProgress,
  finishWord,
  hideWord,
  controlHint,
  flash as runFlash,
  runProgress,
  powerChips,
  speedLines,
} from './runner-hud.js';
import {
  registerOffline,
  watchUpdates,
  watchInstall,
  canInstall,
  promptInstall,
  keepAwake,
  toggleFullscreen,
  fullscreenAvailable,
  inFullscreen,
  isAppleTouch,
  installed,
} from './app-shell.js';
import { createFormCache, formKey } from './asset-cache.js';
import { fetchJSON, LessonLibrary } from './asset-network.js';
import { PerformanceMonitor } from './performance-monitor.js';
import { loadingNotice, clearLoading, recoveryNotice } from './loading-ui.js';
import { LanguageCoach, languageFeedbackMarkup, guidancePlan, questionFocus } from './language-feedback.js';
import { englishVoice, spokenRequest } from './voice-preference.js';
import { acceptedLines, pieceLine, revealMarkup, revealTime } from './task-voice.js';
import { lessonPlan, runDangerLesson } from './danger-lessons.js';
import { sketchColor } from './creature-sketch.js';
import { guideFigure, guideCameo, hideGuideCameo } from './guide.js';
import { freshGuardian, GuardianCombat, guardianQuestion } from './guardian-combat.js';
import { loadControls, saveControls, applyControls } from './gesture-controls.js';
import { gateCount, perChapter, chapterOf, slotOf, shortPath, chapterCount, SHORT } from './path-shape.js';
import { runControlsTutorial } from './controls-tutorial.js';
import { buySpecial } from './specials.js';
import { heartsHtml, START_LIVES, MAX_LIVES } from './lives-ui.js';
import { createLeague, leagueApi, ultiMessage, arenaPoints, hoursLabel, LEAGUE_TEAMS } from './league.js';
import { ultiIcon } from './ulti-icon.js';
import { shrineOverlay, specialBar, specialKey, specialReady } from './specials-ui.js';
import { guardianHud, guardianFinisher, guardianControls } from './guardian-ui.js';
import { lessonMarkup } from './launch-ui.js';
import { LESSON_TOPICS } from './lesson-topics.js';
import { upgradePractice, notePracticeMistake, completePractice } from './practice-selection.js';
import { upgradePathGrowth, pathGrowthState, pathLevel, recordPathGrowth } from './path-growth.js';
import { routePreview, forkHint, sceneBeat } from './journey-director.js';
import { expeditionTitle } from './expedition-composition.js';
import { icon } from './ui-icons.js';
import { installControlLayout, updateTrailHint } from './control-layout.js';
const controls = installControlLayout();
import { enemyRewardIds } from './path-combat.js';
import { elementalAttack } from './elemental-attacks.js';
import { deviceReport, VISUAL_CHECKS } from './device-report.js';
import { bindStick, bindActionButton } from './touch-stick.js';
import { GRAPHICS_KEY, QUALITY, graphicsSettings, applyGraphics } from './render-quality.js';
import { approachGuidance, practiceGoal } from './trail-guidance.js';
import { GameAudio } from './game-audio.js';
import { PARTNERS, partnerInfo, partnerPortrait, upgradePartners, choosePartner, journeysFor } from './partners.js';
import { trialHint, crystalState } from './path-trials-layout.js';
import { enemyHint } from './path-combat.js';
import { TrailWorld } from './trail-world.js';
import { mechanismMarkup } from './world-mechanisms.js';
import { TrailNavigator } from './trail-nav.js';
import { TRAILS, collectCoin, equipTrail, upgradeTraversalSave, travelState } from './traversal.js';
import { AREAS } from './core.js';
import {
  ACTIVITIES,
  TASK_TYPES,
  STORE,
  CLASSIC_STORE,
  activity,
  freshJourney,
  freshSave,
  required,
  progress,
  maximum,
  unlocked,
  ready,
  guardianReady,
  freshExpedition,
  expedition,
  currentType,
  chooseBranch,
  autoBranch,
  shuffleGates,
  milestone,
  finishExpedition,
  winGuardian,
  restart,
  validSave,
  encode,
  chestPending,
  finishRun,
  runChapter,
} from './expedition.js';
import { activeNode, approachPoint, chapterPath, CHAPTERS, CHAPTER_LENGTH, endPoint } from './trail-layout.js';
import { makeTask, actTask, taskFraction, taskHint } from './trail-tasks.js';
import { evolutionAudio } from './evolution-audio.js';
import {
  dayNumber,
  poolSize,
  recordAnswer,
  reviewPriority,
  itemIds,
  growthNeed,
  points as growthPoints,
  masteredCount,
  growthProgress,
  upgradeMastery,
  dueCount,
  isDue,
  wordex,
} from './mastery.js';
import { explainMistake } from './mistakes.js';
import { dailyState, questProgress, markPlayed, streakInfo, welcomeLine } from './daily.js';
import { useCosmetic } from './cosmetics.js';
import {
  campMarkup,
  onboardingMarkup,
  wordexMarkup,
  shopMarkup,
  correctionMarkup,
  runSummaryMarkup,
  growthBar,
} from './camp-ui.js';
import { Voice } from './voice.js';
import { floatText, burst, flyCoins, bump, flash, haptic, HAPTICS } from './game-feel.js';
const $ = s => document.querySelector(s),
  esc = s =>
    String(s ?? '').replace(
      /[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
let save = freshSave(),
  units = [],
  world,
  nav,
  screen = 'home',
  modal = false,
  locked = false,
  task = null,
  resultCard = false,
  lastSnapshot = 0,
  toastTimer,
  nearId = '',
  autoOpenAfter = 0,
  audioContext,
  evoState,
  evoStop,
  speechSupported = 'speechSynthesis' in window,
  feedbackText = '',
  pendingCompletion = null;
const performanceMonitor = new PerformanceMonitor();
let lessonLibrary, prefetchTimer;
const languageCoach = new LanguageCoach();
let languageFeedback = null;
const deviceChecks = {};
const gameAudio = new GameAudio(),
  voice = new Voice();
let onboarding = false,
  onboardGrade = 5,
  onboardName = null,
  correction = null,
  pendingSummary = null,
  shopTab = 'trail';
let graphics = graphicsSettings(null);
try {
  graphics = graphicsSettings(JSON.parse(localStorage.getItem(GRAPHICS_KEY) || 'null'));
} catch {}
const partner = () => partnerInfo(save.partner);
const unit = () => units.find(u => u.id === save.selected) || units[0],
  journey = () => {
    const j = (save.journeys[save.selected] ??= freshJourney());
    if (j.mastery === undefined) upgradeMastery(j);
    j.pool ??= poolSize(unit());
    upgradePathGrowth(j);
    upgradePractice(j, unit());
    return j;
  },
  state = () => {
    const e = expedition(journey(), save.selected, save.area);
    e.rushVersion ??= 1;
    return e;
  };
// During play every message goes to the one message area under the top bar (the trail hint slot), one at a time.
let notice = { text: '', until: 0 };
function playNotice(text, ms = 3600) {
  if (
    screen !== 'play' ||
    task ||
    modal ||
    resultCard ||
    typeof document === 'undefined' ||
    !document.querySelector?.('#traversal-hint')
  )
    return false;
  notice = { text, until: Date.now() + ms };
  updateTrailHint($('#traversal-hint'), text, { urgent: true });
  return true;
}
function toast(text) {
  if (playNotice(text)) {
    $('#toast').textContent = text;
    return;
  }
  $('#toast').textContent = text;
  $('#toast').classList.add('toast-shown');
  document.body.classList.add('hud-notice');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    $('#toast').classList.remove('toast-shown');
    document.body.classList.remove('hud-notice');
  }, 3600);
}
function snapshot() {
  if (nav && nav.state === state()) {
    state().position = { ...nav.player };
    state().heading = nav.heading;
  }
}
function persist() {
  snapshot();
  try {
    localStorage.setItem(STORE, encode(save));
    $('#save-indicator').textContent = 'Checkpoint saved on this device';
    return true;
  } catch {
    $('#save-indicator').textContent = 'Not saved · export a backup';
    toast('This browser could not save. Export a backup from the journey journal.');
    return false;
  }
}
function soundUpdate() {
  gameAudio.setMuted(save.muted);
  gameAudio.setMusicEnabled(save.music !== false);
  if (save.muted) gameAudio.silence();
  if (world) {
    world.partner = partner().id;
    world.elementColor = partner().color;
    world.trailColor =
      save.wallet?.equipped === 'air'
        ? partner().color
        : TRAILS.find(t => t.id === save.wallet?.equipped)?.color || partner().color;
  }
  $('#sound-button').innerHTML = icon(save.muted ? 'mute' : 'sound');
  $('#sound-button').setAttribute('aria-pressed', String(!save.muted));
  $('#journal-button').innerHTML = icon('book');
  $('#sound-button').setAttribute('aria-label', save.muted ? 'Enable sound' : 'Mute sound');
}
function unlockAudio() {
  if (save.muted) return;
  try {
    audioContext ??= voice.context || new (window.AudioContext || window.webkitAudioContext)();
    gameAudio.attach(audioContext);
    if (!voice.context) voice.attach(audioContext);
    if (['suspended', 'interrupted'].includes(audioContext.state)) audioContext.resume()?.catch?.(() => {});
  } catch {}
}
function cue(kind = 'place', rate = null) {
  if (save.muted) return;
  try {
    audioContext ??= voice.context || new (window.AudioContext || window.webkitAudioContext)();
    gameAudio.attach(audioContext);
    if (!voice.context) voice.attach(audioContext);
    audioContext.resume()?.catch?.(() => {});
    gameAudio.play(kind, 0, rate);
  } catch {}
}
function tone(ok = true) {
  cue(ok ? 'place' : 'wrong');
}
let modalReturnFocus = null;
function showModal(title, html, { kind = '' } = {}) {
  if (!modal) modalReturnFocus = document.activeElement;
  world.measurementPhase = null;
  modal = true;
  world.paused = true;
  world.setInput(0, 0);
  $('#modal-layer').innerHTML =
    `<div class="modal-backdrop"><section class="modal ${kind}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal-header"><div>${kind === 'lesson-browser' ? '<span class="lesson-modal-kicker">LESSONS</span>' : ''}<h2>${esc(title)}</h2></div><button class="close" data-do="close-modal" aria-label="Close">${icon('close')}</button></div>${html}</section></div>`;
  $('.modal .close')?.focus();
}
function closeModal() {
  modal = false;
  $('#modal-layer').innerHTML = '';
  if (world) world.paused = false;
  if (modalReturnFocus?.isConnected) modalReturnFocus.focus();
  modalReturnFocus = null;
}
async function prepareLesson(id) {
  const before = locked;
  locked = true;
  loadingNotice('Loading your lesson…');
  try {
    await lessonLibrary.select(id);
    return true;
  } catch (error) {
    console.error(error);
    toast('Your lesson could not load. Please check your connection and try again.');
    return false;
  } finally {
    locked = before;
    clearLoading();
  }
}
function warmNextForm() {
  clearTimeout(prefetchTimer);
  if (!world?.prefetchForm || journey().level >= 10) return;
  const partnerId = partner().id,
    level = journey().level + 1;
  prefetchTimer = setTimeout(() => {
    if (document.hidden || partnerId !== partner().id || level !== journey().level + 1) return;
    world.prefetchForm(level).catch(() => {});
  }, 1200);
}
function growthState() {
  return pathGrowthState(journey());
}
// The HUD names the next goal rather than a bare percentage.
function goalText(g) {
  if (g.complete) return 'Journey complete';
  if (g.boss) return 'Guardian next';
  return `${g.remaining} ${g.remaining === 1 ? 'gate' : 'gates'} → LvL ${g.next}`;
}
// The run is the current chapter until its reward chest is opened.
function currentRun() {
  const e = state(),
    chapter = chestPending(e) ? runChapter(e) : chapterOf(e);
  if (!e.run || e.run.chapter !== chapter || e.run.expedition !== e.id)
    e.run = {
      expedition: e.id,
      chapter,
      correct: 0,
      perfect: 0,
      tasks: 0,
      growth: 0,
      learned: [],
      review: [],
      rivals: 0,
    };
  return e.run;
}
const taskPriority = () => reviewPriority(journey());
function quest(id, amount = 1) {
  const done = questProgress(save, id, amount);
  for (const q of done) {
    toast(`Quest complete · ${q.label} · +${q.reward} coins`);
    cue('quest');
    buzz(HAPTICS.reward);
    const w = typeof innerWidth === 'number' ? innerWidth : 400;
    rewardCoins(q.reward, { x: w / 2, y: 120 });
  }
  return done;
}
let coinsInFlight = 0,
  lastTap = null,
  lastDamage = 0;
const coinText = () => Math.max(0, (save.wallet?.balance || 0) - coinsInFlight);
function showCoins() {
  const c = $('#coin-count');
  if (c) c.textContent = coinText();
}
function buzz(pattern) {
  return haptic(pattern, { enabled: save.haptics !== false });
}
// Coins fly from where they were earned to the counter, which ticks up as each arrives.
function rewardCoins(value, from) {
  if (!value) return;
  const target = $('#coin-count');
  if (!target || !from || document.hidden) {
    showCoins();
    return;
  }
  coinsInFlight += value;
  showCoins();
  const n = Math.min(value, 12);
  let left = value;
  flyCoins(from, target, n, i => {
    const add = i === n - 1 ? left : Math.min(left, Math.max(1, Math.floor(value / n)));
    left -= add;
    coinsInFlight = Math.max(0, coinsInFlight - add);
    showCoins();
    bump(target);
    cue('coinTick');
  });
}
function feelDamage(r) {
  world?.combatExpression?.cue('success');
  lastDamage = Date.now();
  const final = r.hp <= 0,
    p = world?.screenPoint?.({ x: r.x, y: 1.35, z: r.z });
  if (p) floatText(p.x, p.y, String(Math.ceil(100 / Math.max(1, r.maxHp))), final ? 'crit' : 'damage');
  world?.juice?.hitstop(final ? 55 : 35);
  world?.juice?.shake(final ? 0.3 : 0.18);
  buzz(final ? HAPTICS.crit : HAPTICS.hit);
}
function feelImpact(p, hit) {
  if (hit && Date.now() - lastDamage < 50) return;
  const s = world?.screenPoint?.({ x: p.x, y: (p.y || 0.6) + 0.5, z: p.z });
  if (hit) {
    if (s) floatText(s.x, s.y, 'Crack!', 'crack');
    world?.juice?.hitstop(60);
    world?.juice?.shake(0.22);
    buzz(HAPTICS.hit);
  } else {
    if (s) floatText(s.x, s.y, 'Blocked', 'blocked');
    world?.juice?.shake(0.08);
  }
}
function feelHurt() {
  world?.combatExpression?.cue('hurt');
  world?.juice?.hitstop(45);
  world?.juice?.shake(0.32);
  flash('hurt');
  buzz(HAPTICS.hurt);
}
function configureTravel() {
  if (RUNNER) setRunnerWords(unit().vocabulary || []);
  nav.rushEnabled = state().rushVersion === 1;
  nav.partner = partner().id;
  nav.enableTraversal(save.mode, {
    heading: () => world?.controlHeading ?? nav.heading,
    face: heading => {
      if (world) {
        world.controlHeading = heading;
        if (world.locomotion) world.locomotion.heading = heading;
      }
    },
    combatSave: () => persist(),
    trialSave: () => persist(),
    trialReward: s => {
      cue('break');
      let gained = 0;
      for (let i = 0; i < 2; i++) gained += collectCoin(save, state(), { id: s.id + ':crystal-reward:' + i });
      persist();
      const node = s.trial?.nodes?.[1];
      rewardCoins(gained, node && world?.screenPoint?.({ x: node.x, y: 1, z: node.z }));
      toast('Crystal barrier cleared · coins saved.');
    },
    impact: (p, hit) => {
      world?.combatEffect?.(p, hit);
      cue(hit ? 'impact' : 'wrong');
      feelImpact(p, hit);
    },
    damaged: r => feelDamage(r),
    projectile: p => cue({ air: 'castAir', fire: 'castFire', nature: 'castNature', water: 'castWater' }[p.element]),
    projectileImpact: (p, kind) => {
      world?.elementalFX?.impact(p, kind);
      if (p.blocked) world?.combatExpression?.cue('blocked');
    },
    attack: a => {
      world?.attackEffect?.(a);
      if (world?.locomotion) world.locomotion.heading = a.heading;
    },
    defeat: r => {
      cue('defeat');
      if (!nav.combat.remaining) {
        cue('reward');
        world?.quietMoments?.settle();
        // The whole group is down: the gate opens and the creature runs to it by itself.
        setTimeout(() => {
          if (screen !== 'play' || task || modal || resultCard || nav.combat?.remaining) return;
          toast('The gate is open!');
          if (nav.approach()) nav.autoRun = true;
        }, 900);
      }
      currentRun().rivals++;
      quest('rival');
      let gained = 0;
      for (const id of enemyRewardIds(r)) gained += collectCoin(save, state(), { id });
      persist();
      const at = world?.screenPoint?.({ x: r.x, y: 1, z: r.z });
      if (at) burst(at.x, at.y, { color: partner().color, priority: nav.combat.remaining ? 'complete' : 'reward' });
      buzz(HAPTICS.reward);
      rewardCoins(gained, at);
      toast(
        r.spec.name +
          (nav.combat.remaining
            ? ' yields! ' + nav.combat.remaining + ' more in this group · '
            : ' yields! Path opened · ') +
          gained +
          ' coins saved.',
      );
    },
    coin: coin => {
      const value =
        collectCoin(save, state(), coin) + (coin.double ? collectCoin(save, state(), { id: coin.id + ':x2' }) : 0);
      if (value) {
        nav.rush?.collect();
        if (nav.rush) {
          state().rushStats = {
            coins: travelState(state()).collected.length,
            bestChain: Math.max(state().rushStats?.bestChain || 0, nav.rush.best),
          };
        }
        if (coin.discovery && coin.id.endsWith(':0')) toast('A trail discovery! Coins saved.');
        quest('coins', value);
        persist();
        const now = Date.now();
        coinStreak = now - lastCoinAt < 900 ? coinStreak + 1 : 1;
        lastCoinAt = now;
        cue('coin', 2 ** (PENTA[Math.min(coinStreak - 1, PENTA.length - 1)] / 12));
        world?.coinEffect?.(coin);
        const at = world?.screenPoint?.(coin);
        rewardCoins(value, at);
        if (coinStreak % 10 === 0 && at) {
          floatText(at.x, at.y - 30, `+${coinStreak} streak!`, 'praise');
          cue('select', 1.5);
        }
      }
    },
    retry: reason => {
      cue('hurt');
      feelHurt();
      persist();
      loseLife(reason);
      world?.retryEffect?.(reason);
      const thumb = $('#joystick-thumb');
      if (thumb) thumb.style.transform = '';
      toast(
        reason === 'boulder'
          ? 'A rolling boulder! Watch the amber lane and wait in an alcove.'
          : reason === 'thorns'
            ? 'Watch the green gap. Your coins and English progress are safe.'
            : reason === 'leaf-slam'
              ? 'Leaf slam! Sidestep the marked sector, then circle behind.'
              : reason === 'spore-ring'
                ? 'Spore ring! Jump as the ring approaches. Coins and English progress are safe.'
                : reason === 'charge'
                  ? 'Caught by the charge! Try a sidestep or jump. Coins and English progress are safe.'
                  : reason === 'poison'
                    ? 'Poison spores! Back to your safe spot.'
                    : reason === 'fall' && nav.runner?.section?.run
                      ? 'Into a hole! Change lane or jump over it. Coins and English progress are safe.'
                      : 'Missed the landing. Aim for a flat stone top; jump near its edge. Your coins and English work are safe.',
      );
    },
    checkpoint: (text, section) => {
      if (section?.trial) quest('trial');
      persist();
    },
    notice: text => toast(text),
  });
  if (nav.runner) {
    nav.runner.events = runnerEvents();
    nav.runner.chestReady = () => chestPending(state());
  }
}
const POWER_NAMES = { magnet: 'Coin magnet!', shield: 'Shield!', double: 'Double coins!', dash: 'Creature dash!' };
// Runner mode: the hint bar names what is coming next, so students learn which move each obstacle needs.
const RUNNER_NAMES = {
  log: 'mossy log',
  mushrooms: 'bouncy mushrooms',
  hedge: 'bramble hedge',
  crates: 'rune crates',
  sandstone: 'sandstone wall',
  tumbleweed: 'tumbleweeds',
  crystals: 'crystal spikes',
  slime: 'jelly slimes',
  vines: 'hanging vines',
  trunk: 'fallen trunk',
  spinner: 'spiky spinner',
  lanterns: 'lantern string',
  banner: 'flag bunting',
  laser: 'laser beam',
  pit: 'pit',
  water: 'water gap',
  chasm: 'chasm',
  void: 'void rift',
  swamp: 'swamp',
  quicksand: 'quicksand',
  glowmire: 'glowing mire',
};
const MOMENT_COACH = {
  guardian: o =>
    `${o.finale ? 'Chase the guardian!' : 'The guardian!'} Leave the amber lanes, take a blue lane, jump the waves.`,
  boulders: () => 'Rolling boulders! Watch the amber lane and switch.',
  wind: o => `Wind ${o.dir > 0 ? '→' : '←'}: it pushes you a lane. Grab the coins upwind!`,
  crystal: () => 'Crystal wall! Tap your creature to cast and break it.',
  thorns: () => 'Thorns rise and fall: run where they are down.',
  ledge: () => 'Optional: take the ramp for bonus coins!',
  hole: o => (o.style === 'stream' ? 'Stepping stones: hop lane to lane!' : null),
};
function runnerCoach(r) {
  const s = r.section,
    run = s?.run,
    at = r.s ?? 0;
  if (!run) return '';
  if (run.word) return 'Collect the letters in order!';
  const next = run.obstacles.find(
    o =>
      o.type !== 'stone' &&
      o.s + o.depth / 2 > at &&
      (o.start ?? o.s) - at < Math.max(14, r.speed * 2.2) &&
      !r.knocked.has(o.id),
  );
  const coach = next && MOMENT_COACH[next.type]?.(next);
  if (coach) return coach;
  if (!next) return 'Run! Grab the coins in your lane.';
  const name = RUNNER_NAMES[next.style] || next.type;
  return next.type === 'barrier'
    ? `Jump over the ${name}!`
    : next.type === 'bar'
      ? `Slide under the ${name}!`
      : next.type === 'swamp'
        ? `Swerve around the ${name} (or jump it)!`
        : `Dodge the ${name}: change lane or jump!`;
}
// Runner mode: the track has its own music while running, held briefly so a stumble does not flip the soundtrack.
let runnerMusicUntil = 0;
function runnerMusic() {
  const now = globalThis.performance?.now?.() || Date.now();
  if (nav?.runner?.running) runnerMusicUntil = now + 2500;
  return now < runnerMusicUntil;
}
const guardianChase = () => !!(nav?.runner?.running && nav.runner.section?.run?.finale);
// Runner mode: control hint on the first run, the word-run panel, bonus coins for a completed word, stumble tips.
let runnerTip = 0;
function runnerEvents() {
  return {
    coin: coin => nav.events.coin?.(coin),
    start: section => {
      const hint = controlHint(!!world?.touchHUD);
      if (hint) toast(hint);
      if (section.run.word) showWord(section.run.word);
      else hideWord();
    },
    letter: (t, word, letters) => {
      if (t.correct) {
        cue('coinTick');
        buzz(HAPTICS.coin);
      } else {
        cue('wrong');
        buzz(HAPTICS.wrong);
      }
      showProgress(letters, { wrong: !t.correct, language: word.language });
    },
    word: (word, letters) => {
      if (finishWord(word, letters)) {
        gainLife();
        let gained = 0;
        for (let i = 0; i < 3; i++) gained += collectCoin(save, state(), { id: word.bonusId + ':' + i });
        persist();
        cue('correct');
        buzz(HAPTICS.correct);
        if (gained) rewardCoins(gained);
        if (word.language === 'en') speak(word.answer);
        guideCameo(['Brilliant spelling!', 'Word complete. Super!', 'You got it!'][word.answer.length % 3], {
          pose: 'cheer',
        });
        toast(`${word.answer.toUpperCase()} = ${word.prompt} · word complete!${gained ? ` +${gained} coins` : ''}`);
      } else toast(`The word was ${word.answer} (${word.prompt}). Try the next word run!`);
    },
    swamp: o => {
      cue('land');
      runFlash('Splash!', 'swamp');
      buzz(HAPTICS.land);
      const now = Date.now();
      if (now - runnerTip > 6000) {
        runnerTip = now;
        toast('Stuck in the mud! Swerve around swamps or jump across them.');
      }
    },
    lane: () => cue('lane'),
    guardian: o => {
      if (o.finale) toast(`Chase ${AREAS[state().area]?.guardian || 'the guardian'} to its arena!`);
      guideCameo(o.finale ? 'Chase it! Leave the amber lanes.' : 'The guardian! Watch the amber lanes.', {
        pose: 'point',
        ms: 2600,
      });
    },
    roar: () => {
      cue('defeat');
      buzz(HAPTICS.crit);
      runFlash('The guardian!', 'stumble');
    },
    warn: a => {
      cue('select');
      const w = chaseWarning(a);
      runFlash(w.text, w.style);
      dangerLesson(a.kind, { attack: a });
    },
    attack: a => {
      if (['slam', 'gale', 'chain', 'dive'].includes(a.kind)) {
        cue('impact');
        buzz(HAPTICS.hit);
      } else cue('lane');
    },
    chest: () => {
      if (screen === 'play' && !task && !modal) openChest();
    },
    finish: section => {
      if (section.run?.finale && screen === 'play')
        setTimeout(() => {
          if (screen === 'play' && !task && !modal && !resultCard) endRoute();
        }, 350);
    },
    // The gate comes into view; a guarded gate shows its rivals waiting in front of it.
    approach: (section, a) => {
      if (section.run?.finale) return;
      if (a.guarded) {
        runFlash('Rivals ahead! Get ready to cast', 'stumble');
        cue('select');
      } else runFlash('Gate ahead!', 'swamp');
    },
    skid: () => {
      cue('slide');
      buzz(HAPTICS.hit);
    },
    // A free gate opens its task as soon as the creature has stopped; at a guarded gate the fight takes over.
    arrive: (section, a) => {
      if (a.guarded) {
        runFlash('Defeat the rivals to open the gate', 'stumble');
        gestureHint('fight', 'Tap anywhere to cast · tap a rival to aim · swipe up to jump');
        joystickLesson(
          'fight',
          'Rivals at the gate! <b>Drag the joystick</b> to walk around them and dodge their attacks. <b>Tap</b> to cast.',
        );
        return;
      }
      const node = activeNode(state());
      if (node && screen === 'play' && !task && !modal && !resultCard) interact(node.id);
    },
    power: p => {
      cue('reward');
      buzz(HAPTICS.reward);
      runFlash(POWER_NAMES[p.kind], 'great');
    },
    shield: () => {
      cue('blocked');
      runFlash('Shield!', 'great');
      buzz(HAPTICS.hit);
    },
    smash: () => {
      cue('break');
      buzz(HAPTICS.hit);
    },
    bridge: () => {
      cue('repair');
      runFlash('Stones settle. Keep running!', 'great');
    },
    crystal: () => {
      cue('break');
      runFlash('Crystal shattered!', 'great');
      buzz(HAPTICS.crit);
    },
    gust: o => {
      cue('lane');
      runFlash(o.dir > 0 ? 'Gust →' : '← Gust', 'swamp');
    },
    boost: () => {
      cue('lane');
      buzz(HAPTICS.correct);
    },
    perfect: o => {
      cue('select');
      runFlash('Perfect!', 'great');
      const at = world?.screenPoint?.({ x: nav.player.x, y: (nav.y || 0) + nav.height * 0.8, z: nav.player.z });
      if (at) burst(at.x, at.y, { color: '#ffe066', priority: 'reward' });
    },
    slide: () => cue('slide'),
    stumble: o => {
      cue('stumble');
      loseLife('bump');
      runFlash('Stumble!');
      buzz(HAPTICS.hurt);
      const now = Date.now();
      if (now - runnerTip > 6000) {
        runnerTip = now;
        toast(stumbleTip(o.type));
      }
    },
  };
}
function syncWorld() {
  sixGateSave();
  world.partner = partner().id;
  world.elementColor = partner().color;
  const e = state();
  nav.state = e;
  configureTravel();
  nav.setLevel(journey().level);
  nav.restore(e.position);
  nav.heading = e.heading;
  world.viewRig.yaw = e.heading;
  world.viewRig.inputYaw = null;
  world.setArea(save.area);
  world.trailColor =
    save.wallet?.equipped === 'air'
      ? partner().color
      : TRAILS.find(t => t.id === save.wallet?.equipped)?.color || partner().color;
  world.setCosmetics?.({ hat: save.wallet?.hat, coat: save.wallet?.coat, camp: save.wallet?.camp });
  if (world.locomotion) world.locomotion.heading = e.heading;
}
async function home() {
  if (!world) return;
  keepAwake(false);
  gameAudio.reading = false;
  pendingCompletion = null;
  pendingSummary = null;
  screen = 'home';
  task = null;
  resultCard = false;
  locked = false;
  world.paused = false;
  document.body.classList.remove(
    'playing',
    'cinematic',
    'in-task',
    'guardian-choice',
    'in-guardian',
    'in-guardian-finisher',
    'task-arriving',
    'returning-to-play',
  );
  $('#task-layer').innerHTML = '';
  $('#world-labels').innerHTML = '';
  world.setView(true);
  renderHome();
}
function applyLook() {
  world?.setCosmetics?.({ hat: save.wallet?.hat, coat: save.wallet?.coat, camp: save.wallet?.camp });
}
function homeFraming(kind) {
  if (!world) return;
  applyLook();
  const phone = typeof innerWidth === 'number' && innerWidth < 760,
    tall = phone && innerHeight >= 760 && innerHeight > innerWidth * 1.3;
  world.homeZoom = tall ? 0.92 : kind === 'onboard' ? (phone ? 1.3 : 1.15) : 0.8;
  // On tall phones the camp card starts lower (launch.css), so the creature is lifted into the hero space above it.
  world.homeLift = tall ? 0.6 : phone ? (kind === 'onboard' ? 0.36 : 0.44) : 0;
}
function setupContext() {
  const j = journey(),
    u = unit(),
    e = state(),
    pending = chestPending(e),
    chapter = pending ? runChapter(e) : chapterOf(e);
  return {
    install: canInstall(),
    firstLaunch: onboarding,
    portrait: partnerPortrait(partner().id, j.level),
    level: j.level,
    element: partner().element,
    nickname: save.nickname,
    unitTitle: u.title,
    unitNumber: units.filter(x => x.grade === u.grade).findIndex(x => x.id === u.id) + 1,
    lessonKind: u.grade < 7 && u.curriculum?.kind !== 'enrichment' ? 'THEME' : 'UNIT',
    grade: u.grade,
    guardian: guardianReady(j, e) ? AREAS[e.area].guardian : null,
    completed: j.completed,
    nextArea: e.phase === 'closed' && save.area < unlocked(j) ? save.area + 1 : null,
    nextAreaTitle: AREAS[Math.min(2, save.area + 1)].name,
    resume: !!(e.index || e.active || e.checkpoint || e.battle || e.choices.some(Boolean)),
    progress: e.index,
    areaName: AREAS[save.area].name,
    runLabel: e.active
      ? `${activity(e.active.type)?.object} is waiting`
      : pending
        ? 'A reward chest is waiting'
        : `${expeditionTitle(save.area, chapter, CHAPTERS[chapter][0])} · ${AREAS[save.area].name}`,
    coins: coinText(),
    partners: PARTNERS.map(p => ({
      ...p,
      level: journeysFor(save, p.id)[u.id]?.level || 0,
      portrait: partnerPortrait(p.id, journeysFor(save, p.id)[u.id]?.level || 0),
      selected: p.id === partner().id,
      ulti: teamUlti(u.grade, p.id),
    })),
    areas: AREAS.map((a, i) => ({
      ...a,
      selected: i === save.area,
      locked: i > unlocked(j),
      completed: j.guardians.includes(i),
      progress: j.expeditions?.[i]?.index || 0,
      gates: j.expeditions?.[i] ? gateCount(j.expeditions[i]) : 6,
    })),
    gates: gateCount(e),
    mode: save.mode,
  };
}
// Each team's live Ulti for the chosen grade, under its banner on the opening screen (null until the League has answered).
const leagueSeen = new Map();
function teamUlti(grade, team) {
  if (!league.enabled) return null;
  const snap = league.snapshot(grade);
  if (Date.now() - (leagueSeen.get(grade) || 0) > 60000) {
    leagueSeen.set(grade, Date.now());
    league
      .refresh(grade)
      .then(r => {
        if (r?.online && screen === 'home' && !modal) renderHome();
      })
      .catch(() => {});
  }
  return snap.known && snap.game ? (snap.teams.find(t => t.id === team)?.points ?? 0) : null;
}
function renderHome() {
  const scroll = $('.launch-body')?.scrollTop || 0;
  homeFraming(onboarding ? 'onboard' : 'camp');
  document.body.classList.add('opening');
  document.body.classList.toggle('onboarding', onboarding);
  const c = setupContext();
  $('#ui').innerHTML = onboarding ? onboardingMarkup(c) : campMarkup(c);
  const body = $('.launch-body');
  if (body) body.scrollTop = scroll;
}
function lessons(grade = unit().grade) {
  if (![5, 6, 7, 8].includes(grade)) return;
  showModal(
    'Choose your lesson',
    lessonMarkup({
      grade,
      units,
      journeys: save.journeys,
      selected: save.selected,
      teamName: partner().name,
      topics: LESSON_TOPICS,
    }),
    { kind: 'lesson-browser' },
  );
}
function graphicsMenu() {
  const rows = ['explore', 'task', 'evolution']
    .map(phase => {
      const m = world.frameMetrics?.snapshot(phase);
      return `<li>${phase}: ${m?.samples ? `${Math.round(m.fps)} fps · p95 ${m.p95.toFixed(1)} ms · ${m.drawCalls} draws · ${Math.round(m.triangles / 1000)}k triangles · ${Math.round(m.slow30 * 100)}% over 33 ms · session worst ${m.sessionWorst.toFixed(1)} ms (${m.samples} recent frames)` : 'no play samples yet'}</li>`;
    })
    .join('');
  showModal(
    'Graphics and performance',
    `<p>Target: 60 fps where practical; stable 30 fps on slower phones. Change settings, play a stretch, then return here to compare observations.</p><div class="graphics-grid">${Object.keys(
      QUALITY,
    )
      .map(
        p =>
          `<button data-do="graphics-preset" data-value="${p}" aria-pressed="${graphics.preset === p}">${p}</button>`,
      )
      .join(
        '',
      )}</div><h3>Resolution cap</h3><div class="graphics-grid">${[0.75, 1, 1.5].map(v => `<button data-do="graphics-resolution" data-value="${v}" aria-pressed="${graphics.resolution === v}">${v}×</button>`).join('')}</div><button class="secondary wide" data-do="graphics-shadows">Shadows: ${graphics.shadows ? 'on' : 'off'}</button><h3>Effects</h3><div class="graphics-grid">${['low', 'medium', 'full'].map(v => `<button data-do="graphics-effects" data-value="${v}" aria-pressed="${graphics.effects === v}">${v}</button>`).join('')}</div><button class="secondary wide" data-do="graphics-adaptive">Adaptive resolution: ${graphics.adaptive ? 'on' : 'off'} · ${world.adaptiveResolution?.ratio?.toFixed(2) || graphics.resolution}×</button><h3>Loading and resources</h3>${(() => {
      const p = performanceMonitor.startup(),
        m = world.renderer?.info?.memory || {},
        c = world.formAssets?.snapshot();
      return `<p>Opening requests: ${p.requestCount || 0} · ${(p.transferBytes / 1048576 || 0).toFixed(2)} MiB reported transferred. Cache and browser restrictions can make sizes unavailable.<br>Renderer: ${m.textures || 0} textures · ${m.geometries || 0} geometries. Creature cache: ${c?.templates || 0}/2 forms.<br>Export the device report for the startup breakdown and resource samples.</p>`;
    })()}<h3>Recent play observations</h3><ul class="frame-observations">${rows}</ul><p>Frame intervals are observed on this browser, with separate exploration, task and evolution samples. These are not GPU timings or a device certification. Menus and hidden-tab gaps are excluded. Test touch, heat and sustained play on real phones.</p><button class="secondary" data-do="graphics-reset">Start a fresh measurement</button><p><a href="partner-preview.html?partner=${partner().id}&level=${journey().level}">Inspect creature animations →</a></p><h3>Device test checklist</h3><p>Play for 15 minutes, include tasks, combat and evolution, then record what you observed. Unchecked items remain untested.</p>${VISUAL_CHECKS.map(([id, label]) => `<label class="device-check">${label}<select data-device-check="${id}"><option value="not-tested">Not tested</option><option value="pass" ${deviceChecks[id] === 'pass' ? 'selected' : ''}>Pass</option><option value="fail" ${deviceChecks[id] === 'fail' ? 'selected' : ''}>Needs work</option></select></label>`).join('')}<button class="primary wide" data-do="device-export">Export device report</button>`,
  );
}
function saveGraphics() {
  applyGraphics(world, graphics, typeof devicePixelRatio === 'number' ? devicePixelRatio : 1);
  world.frameMetrics?.reset();
  try {
    localStorage.setItem(GRAPHICS_KEY, JSON.stringify(graphics));
  } catch {
    toast('Graphics changed for this session. Device settings could not be saved.');
  }
  graphicsMenu();
}
// Install / full-screen tips shown in How to play, matched to the device.
// "New version available": a pill at the top; tapping saves and reloads into the new build.
function showUpdate() {
  if (document.getElementById('update-banner')) return;
  const b = document.createElement('button');
  b.id = 'update-banner';
  b.type = 'button';
  b.textContent = 'New version available · tap to update';
  b.addEventListener('click', () => {
    try {
      persist();
    } catch {}
    location.reload();
  });
  document.body.append(b);
}
function modeSwitch() {
  return RUNNER
    ? '<p><strong>Classic paths:</strong> walk the shorter trail with the joystick instead of running. It keeps its own save.</p><button class="secondary wide" data-do="play-mode" data-value="classic">Play classic paths</button>'
    : '<p><strong>Runner paths:</strong> run between gates in three lanes: jump, slide and dodge.</p><button class="secondary wide" data-do="play-mode" data-value="runner">Back to runner paths</button>';
}
function appTips() {
  if (installed()) return '';
  const tip = isAppleTouch()
    ? '<p><strong>Play like an app:</strong> tap Share, then <em>Add to Home Screen</em>. solMaxima then opens full screen and keeps lessons you have played for weak Wi-Fi.</p>'
    : canInstall()
      ? '<p><strong>Play like an app:</strong> use <em>Install</em> on the opening card. solMaxima then opens full screen and keeps lessons you have played for weak Wi-Fi.</p>'
      : '';
  return (
    tip +
    (fullscreenAvailable()
      ? `<button class="secondary wide" data-do="fullscreen">${inFullscreen() ? 'Leave full screen' : 'Play full screen'}</button>`
      : '')
  );
}
function help() {
  showModal(
    'The Windward Trails',
    `<div class="guide-note">${guideFigure('full')}<p class="guide-bubble">Hello! I'm Mr. Saymaz. Here is how the trails work.</p></div><p>You are ${esc(save.nickname)}. Each <strong>run</strong> takes about five to eight minutes: four English tasks, one rival group, one trail trial and a reward chest at the end. Five runs make a week and cover all twenty activity types.</p><p><strong>Your teams:</strong> each team has its own levels, arena unlocks, Wordex and checkpoints for every lesson. Switch back to continue that team’s journey. Coins and purchased looks are shared.</p><p><strong>Growing:</strong> pass the 6 English gates in each arena. In Whisperwood, gates 2, 4 and 6 earn Levels 1, 2 and 3; its guardian earns Level 4. Skyreach uses the same gates for Levels 5, 6 and 7; its guardian earns Level 8. Stormglass gate 3 earns Level 9; its final guardian earns Level 10. Both modes follow this journey. You can stop and resume from a saved checkpoint. Guardians at the end of each arena unlock the next arena. Wordex stars track recall across days separately; they never block evolution.</p><p><strong>Fresh practice:</strong> new expeditions shuffle their mechanisms and language. Unseen material comes first, with some familiar practice and delayed review of mistakes. Your current task stays exactly as you left it.</p><p><strong>Rush:</strong> Open coin trails accelerate to a run. Tap Boost while moving, or press Shift, for a short burst. Coins refill boost and build a chain. Hazards, rivals and gate approaches slow you down. English checkpoints pause the action.</p><p><strong>Moving:</strong> on phones use the left joystick, the Jump button and your elemental attack. On a keyboard use W / ↑ forward, S / ↓ back, A and D to turn, Space to jump and J or F to cast. Near a rival your creature faces it: A / D sidestep and W / S approach or retreat. Tap <strong>Follow</strong> to walk to the next discovery.</p><p><strong>Rivals:</strong> Rumblebud charges along an amber line: step aside or jump, then strike while it recovers. Brambleguard slams a marked sector: sidestep and strike its side or back. Mistcap sends purple rings: jump over them and strike while its cap is lowered.</p><p><strong>Trials:</strong> wait in alcoves for boulders, shelter from wind, ride turquoise platforms, follow green gaps between thorns, strike crystal cores when their shells open, and try gold ledges for bonus coins. Falling never costs English progress or coins.</p><p><strong>Every day:</strong> three daily quests pay coins. Rest days never break your trail streak. Coins buy wind trails, hats, coat colours and camp decorations in the Wardrobe.</p><p>Progress saves on this device. Export a backup from the journal to move devices.</p><button class="primary wide" data-do="close-modal">Follow the wind →</button>${modeSwitch()}${appTips()}`,
  );
}
function trailShopMarkup() {
  const w = save.wallet;
  return shopMarkup({
    tab: 'trail',
    trails: TRAILS,
    owned: w.owned,
    equipped: w.equipped,
    hat: w.hat,
    coat: w.coat,
    camp: w.camp,
    balance: coinText(),
    nickname: save.nickname,
  });
}
function trailShop() {
  const w = save.wallet;
  showModal(
    'Wardrobe',
    shopMarkup({
      tab: shopTab,
      trails: TRAILS,
      owned: w.owned,
      equipped: w.equipped,
      hat: w.hat,
      coat: w.coat,
      camp: w.camp,
      balance: coinText(),
      nickname: save.nickname,
    }),
  );
}
// The journal: four compact tabs instead of one long list. Every earlier entry and action is still here.
const JOURNAL_TABS = [
  ['journey', '🧭', 'Journey'],
  ['words', '📖', 'Words'],
  ['rewards', '🎁', 'Rewards'],
  ['settings', '⚙️', 'Settings'],
];
let journalTab = 'journey';
function journal(tab = journalTab) {
  journalTab = tab;
  const j = journey(),
    e = state(),
    chapter = chestPending(e) ? runChapter(e) : chapterOf(e),
    g = growthState(),
    next = activeNode(e),
    beat = e.pacingVersion >= 1 ? sceneBeat(e, chapter) : null;
  const tabs = `<div class="journal-tabs" role="tablist">${JOURNAL_TABS.map(([id, mark, label]) => `<button role="tab" data-do="journal-tab" data-tab="${id}" aria-selected="${tab === id}"><span class="tab-icon" aria-hidden="true">${mark}</span>${label}</button>`).join('')}</div>`;
  const panel =
    tab === 'words'
      ? `<div class="journal-card"><h3>Wordex</h3><p>${dueCount(j)} words are ready for review · ${masteredCount(j)} remembered across several days. Difficult language comes back after other activities.</p></div>
  <div class="journal-stats"><div><b>${j.stats.correct}</b><small>accepted steps</small></div><div><b>${j.stats.mistakes}</b><small>corrections</small></div><div><b>${j.stats.hints}</b><small>hints</small></div></div>
  <div class="journal-rows"><button data-do="wordex"><span class="row-icon" aria-hidden="true">📖</span><span>Open the Wordex<small>Every word of ${esc(unit().title)}</small></span></button></div>`
      : tab === 'rewards'
        ? `${leagueCard()}<div class="journal-card"><h3>${icon('coin')} ${coinText()} coins</h3><p>Coins buy hats, coats and camp decorations. Purchases are shared by all your teams.</p></div>
  <div class="journal-rows"><button data-do="trails"><span class="row-icon" aria-hidden="true">🎒</span><span>Wardrobe<small>Looks for ${esc(partner().name)}</small></span></button>${j.level ? '<button data-do="evolution-replay-earned"><span class="row-icon" aria-hidden="true">✨</span><span>Replay latest evolution<small>Watch your last level-up again</small></span></button>' : ''}</div>`
        : tab === 'settings'
          ? `<div class="journal-rows"><button data-do="controls"><span class="row-icon" aria-hidden="true">🎮</span><span>Controls<small>Joystick side, buttons, tutorial</small></span></button><button data-do="graphics"><span class="row-icon" aria-hidden="true">🖥️</span><span>Graphics and performance</span></button><button data-do="music"><span class="row-icon" aria-hidden="true">🎵</span><span>Music</span><span class="row-value">${save.music === false ? 'off' : 'on'}</span></button><button data-do="read-aloud"><span class="row-icon" aria-hidden="true">🗣️</span><span>Read English aloud</span><span class="row-value">${save.readAloud === false ? 'off' : 'on'}</span></button>${typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function' ? `<button data-do="haptics"><span class="row-icon" aria-hidden="true">📳</span><span>Vibration</span><span class="row-value">${save.haptics === false ? 'off' : 'on'}</span></button>` : ''}<button data-do="export"><span class="row-icon" aria-hidden="true">💾</span><span>Export backup</span></button><button data-do="import"><span class="row-icon" aria-hidden="true">📂</span><span>Import backup</span></button><button data-do="restart"><span class="row-icon" aria-hidden="true">↺</span><span>Restart this unit</span></button></div>`
          : `${beat ? `<div class="journal-card"><h3>${esc(beat.title)}</h3><p>${esc(beat.text)}${beat.discovered ? ' · Discovery found' : ''}</p></div>` : ''}
  <div class="journal-card"><h3>${esc(partner().name)} · Level ${j.level}</h3><p>${esc(unit().title)} · Grade ${unit().grade}</p><div class="journal-meter" aria-hidden="true"><i style="width:${Math.round(g.progress * 100)}%"></i></div><p>${esc(goalText(g))}</p></div>
  <div class="journal-card"><h3>${esc(AREAS[save.area].name)} · Run ${(j.runCount || 0) + 1}</h3><p>${esc(expeditionTitle(save.area, chapter, CHAPTERS[chapter][0]))}<br><strong>Next:</strong> ${esc(chestPending(e) ? 'Open the reward chest' : next?.object || 'Choose a path at the fork')}</p></div>
  <div class="journal-card"><h3>${e.index} / ${gateCount(e)} gates on this path</h3><p>${shortPath(e) ? 'Six gates, two per chapter; new areas bring new formats.' : 'Each run covers four formats; five runs cover all twenty.'}${e.checkpoint ? ` Last saved: ${esc(activity(e.checkpoint.type).object)}.` : ''}</p><div class="journal-formats" style="margin-top:8px">${ACTIVITIES.map(
    a => {
      const done = e.completed.some(c => c.type === a.id);
      return `<span class="${done ? 'done' : next?.type === a.id ? 'next' : ''}" title="${esc(a.label)}" aria-label="${esc(a.label)}${done ? ' · done' : ''}">${done ? '✓' : a.symbol}</span>`;
    },
  ).join('')}</div></div>`;
  showModal('Journey journal', `${tabs}<div class="journal-panel" role="tabpanel">${panel}</div>`, {
    kind: 'journal-modal',
  });
}
async function enter({ reuseForm = false } = {}) {
  document.body.classList.remove('opening', 'onboarding');
  locked = true;
  syncWorld();
  try {
    if (!reuseForm) {
      loadingNotice('Loading your creature…');
      await world.loadForm(journey().level);
    }
  } finally {
    locked = false;
    clearLoading();
  }
  screen = 'play';
  locked = false;
  if (shuffleGates(journey(), state(), { six: sixGates })) persist();
  ensureTicket();
  document.body.classList.add('playing');
  world.setView(false);
  world.paused = false;
  const day = markPlayed(save);
  persist();
  if (day.first && save.tutorial) toast(welcomeLine(day, day.gap));
  voice.load().catch(() => {});
  const pending = state().pendingEvolution;
  if (pending) {
    await evolution(!!pending.boss && journey().completed, { from: pending.from, to: pending.to, path: true });
    return;
  }
  if (state().battle) {
    showBattle();
    return;
  }
  if (guardianReady(journey(), state()) && state().index === gateCount(state()) && !chestPending(state())) {
    if (!showShrine()) showBattle();
    return;
  }
  if (state().active) {
    task = state().active;
    openTaskView();
    return;
  }
  renderPlay();
  toNextRun();
  warmNextForm();
  if (!save.tutorial) {
    save.tutorial = true;
    persist();
  }
  if (!controlPrefs.tutorial) startTutorial();
}
// Between chapters (where the chest clearing and the fork used to be) the next run starts far ahead: carry the
// creature straight to it with a short dash, so a new run begins right after every gate.
function toNextRun() {
  const s = nav?.section,
    run = s?.run;
  if (!RUNNER || !run || run.finale || nav.runner?.running || nav.runner?.done?.has(s.id) || task || modal)
    return false;
  const q = courseCoordinates(s, nav.player);
  if (q.s >= run.from - RUN_LEAD && Math.abs(q.lateral) < 3.3) return false;
  const p = localPoint(s, Math.max(0, run.from - 1), 0);
  nav.stop();
  nav.player = { x: p.x, z: p.z };
  nav.heading = Math.atan2(s.forward.x, s.forward.z);
  nav.cancelJump?.();
  world.frameFocus = true;
  document.body.classList?.add?.('run-dash');
  setTimeout(() => document.body.classList?.remove?.('run-dash'), 600);
  return true;
}
function renderPlay() {
  keepAwake(true);
  if (screen === 'play' || document.body.classList?.contains?.('playing')) {
    if (autoBranch(state())) {
      persist();
      world.refresh();
    }
  }
  languageFeedback = null;
  const previewNode = activeNode(state());
  if (
    previewNode &&
    previewNode.type !== 'exit' &&
    world.prepareMechanismPreview &&
    !world.hasMechanismPreview?.(previewNode.id)
  ) {
    const e = state(),
      j = journey(),
      practice = JSON.parse(JSON.stringify(j.practice || {})),
      preview =
        e.active ||
        makeTask(
          unit(),
          previewNode.type,
          `${e.id}:${e.index}`,
          `${e.contentSeed || e.id}:${e.index}:${previewNode.type}`,
          taskPriority(),
          j.level,
          practice,
        );
    world.prepareMechanismPreview(preview);
  }
  document.body.classList.remove('opening', 'onboarding');
  screen = 'play';
  task = null;
  resultCard = false;
  feedbackText = '';
  correction = null;
  nearId = '';
  document.body.classList.remove('guardian-choice');
  const e = state(),
    j = journey(),
    pending = chestPending(e),
    chapter = chapterOf(e),
    fork = !pending && !e.choices[chapter] && e.index < gateCount(e),
    done = pending ? perChapter(e) : slotOf(e),
    g = growthState();
  $('#ui').innerHTML =
    `<button class="play-status" data-do="journal" aria-label="${esc(save.nickname)} Level ${j.level}, run ${(j.runCount || 0) + 1}, ${done} of 4 tasks. Open journey journal."><img src="${partnerPortrait(partner().id, j.level)}" alt=""><span class="status-text">LvL ${j.level}</span><span class="status-goal"><span class="status-growth" aria-hidden="true"><i style="width:${Math.round(g.progress * 100)}%"></i></span><small id="goal-readout">${esc(goalText(g))}</small></span><span class="rush-chip" id="rush-readout" title="Coin chain and boost fuel" hidden></span><b class="status-coins">${icon('coin')} <span id="coin-count">${coinText()}</span></b>${shortPath(e) ? `<b class="status-lives" id="life-readout" role="img" aria-label="${lives()} lives">${livesBadge(lives())}</b>` : ''}</button><div class="play-dock"><div class="traversal-hint" id="traversal-hint">${fork ? esc(forkHint(e, chapter)) : pending ? 'Your reward chest is on the track ahead!' : ''}</div><div class="joystick" id="joystick" aria-label="Move your creature"><div id="joystick-thumb"></div></div>${fork ? `<div class="fork-actions"><button data-do="branch" data-side="left" aria-label="Left: ${esc(CHAPTERS[chapter][1])}. ${esc(firstOnBranch('left'))}">${icon('left')}<small>Left</small></button><button data-do="branch" data-side="right" aria-label="Right: ${esc(CHAPTERS[chapter][2])}. ${esc(firstOnBranch('right'))}">${icon('right')}<small>Right</small></button></div>` : `<button class="attack-button" id="attack-button" style="--cast-color:${elementalAttack(partner().id).color}" data-do="attack" aria-label="${elementalAttack(partner().id).name}: ranged elemental attack">${icon('attack')}<small>Cast</small></button><button class="jump-button" id="jump-button" data-do="jump" aria-label="Jump">${icon('jump')}<small>Jump</small></button><div class="context-action" id="context-action"><small id="context-name"></small><button id="context-button" data-do="follow" aria-label="Follow trail to the next discovery">${icon('follow')}<small>Follow</small></button></div>`}</div>`;
  $('#task-layer').innerHTML = '';
  controls.update();
  joystick();
}
function firstOnBranch(side) {
  const e = state(),
    c = chapterOf(e),
    copy = { ...e, choices: e.choices.slice() };
  copy.choices[c] = side;
  return (
    activity(currentType(copy)).object + ' first' + (e.pacingVersion >= 1 ? ' · ' + routePreview(e, c, side).text : '')
  );
}
let disposeStick = null;
function joystick() {
  disposeStick?.();
  const handlers = [
    bindStick(
      $('#joystick'),
      $('#joystick-thumb'),
      (x, z) => world.setInput(x, z),
      () => persist(),
      window,
      document,
    ),
    bindActionButton($('#jump-button'), () => world.jump(), window, document),
    bindActionButton($('#attack-button'), () => world.attack?.(), window, document),
  ];
  disposeStick = () => handlers.forEach(dispose => dispose());
}
function branch(side) {
  const e = state();
  if (chestPending(e)) {
    toast('Open your reward chest first. It is just ahead.');
    return;
  }
  if (!chooseBranch(e, side)) return;
  persist();
  world.refresh();
  renderPlay();
  toast(
    e.pacingVersion >= 1
      ? routePreview(e, chapterOf(e), side).text + ' · Choice saved.'
      : `Following ${CHAPTERS[chapterOf(e)][side === 'left' ? 1 : 2]}. Branch choice saved.`,
  );
  nav.approach();
}
function frame() {
  if (!world || !nav) return;
  if (shrineOpen) placeShrineTags();
  if (task && !modal && Date.now() - taskOpenedAt > HELP_DELAY && typeof document !== 'undefined')
    document.body.classList.add('task-help-ready');
  {
    const r = nav.runner,
      run = r?.running && r.section?.run,
      live = run && screen === 'play' && !modal && !tutorialOpen && !world.guardianStage?.active;
    runProgress(live ? Math.max(0, r.s) / run.length : null);
    powerChips(live ? r.power : null);
    speedLines(
      live
        ? Math.max(0, Math.min(1, (r.speed - run.start) / (run.top - run.start))) * 0.75 +
            (r.burst > 0 || r.has('dash') ? 0.5 : 0)
        : 0,
    );
  }
  runnerTeach();
  if (screen === 'evolution' && evoState?.returnAt && !document.hidden && Date.now() >= evoState.returnAt) {
    evoState.returnAt = null;
    finishEvolution();
    return;
  }
  if (world.guardianStage?.active && screen === 'play') {
    guardianFrame();
    return;
  }
  world.measurementPhase = document.hidden
    ? null
    : screen === 'evolution'
      ? world.evolution && !world.evolution.resolved
        ? 'evolution'
        : null
      : screen === 'play' && !modal && !resultCard && !locked
        ? task
          ? 'task'
          : 'explore'
        : null;
  gameAudio.frame({
    footfallSerial: world.proceduralMotion?.footfallSerial ?? world.locomotion?.footfallSerial ?? null,
    partner: partner().id,
    position: nav.player,
    height: nav.height,
    moving: nav.moving,
    grounded: nav.grounded,
    stage: nav.jumpStage,
    area: save.area,
    active: !save.muted && !document.hidden && screen === 'play' && !task && !modal && !resultCard && !locked,
    scene: document.hidden
      ? null
      : screen === 'evolution'
        ? 'evolution'
        : screen === 'home'
          ? 'camp'
          : state().battle || guardianChase()
            ? 'guardian'
            : (runnerMusic() ? 'run-' : '') + (['whisperwood', 'skyreach', 'stormglass'][save.area] || 'whisperwood'),
    intensity:
      screen === 'play' && (nav.combat?.blocking?.active || nav.trials?.focus || state().battle)
        ? 1
        : screen === 'play' && nav.section?.trial && !travelState(state()).completed.includes(nav.section.index)
          ? 0.45
          : 0,
  });
  const rushReadout = $('#rush-readout');
  if (rushReadout && nav.rush) {
    const chain = nav.rush.chain | 0,
      text = chain > 1 ? `×${chain}` : '';
    if (rushReadout.textContent !== text) rushReadout.textContent = text;
    rushReadout.hidden = !text;
    rushReadout.style?.setProperty?.('--fuel', Math.round(nav.rush.fuel * 100) + '%');
  }
  if (pendingCompletion) {
    const p = pendingCompletion;
    if (screen !== 'play' || nav.state !== p.expedition) {
      pendingCompletion = null;
    } else if (!modal && !document.hidden && Date.now() >= p.at) {
      pendingCompletion = null;
      if (p.next === 'guardian') showBattle();
      else if (p.next === 'camp') home();
      else returnTrail();
      toast(p.notice);
      return;
    }
  }
  if (pendingSummary && !modal && !document.hidden && Date.now() >= pendingSummary.at) {
    const p = pendingSummary;
    pendingSummary = null;
    runSummary(p);
    return;
  }
  world.paused = screen !== 'play' || !!task || modal || resultCard || locked || tutorialOpen || lessonOpen;
  if (screen !== 'play' || task || modal || resultCard) return;
  const e = state(),
    chapter = chapterOf(e),
    chest = chestPending(e) ? world.chestPoint : null;
  if (
    chest &&
    !locked &&
    !nav.jumping &&
    Math.hypot(nav.player.x - chest.x, nav.player.z - chest.z) < 1.6 + nav.radius
  ) {
    openChest();
    return;
  }
  if (
    !chest &&
    e.index < gateCount(e) &&
    !e.choices[chapter] &&
    Math.abs(nav.player.x) > 1.3 &&
    Math.abs(nav.player.z - (-chapter * CHAPTER_LENGTH + 2)) < 5
  ) {
    branch(nav.player.x < 0 ? 'left' : 'right');
    return;
  }
  const stretch = nav.section,
    travelHint = $('#traversal-hint');
  const keyboardHint = $('.desktop-controls');
  if (keyboardHint)
    keyboardHint.textContent =
      nav.combat?.blocking?.active || nav.trials?.focus
        ? 'W / S approach / retreat · A / D sidestep · Space jump · J / F strike'
        : 'W / ↑ forward · S / ↓ back · A / D turn · Space jump · J / F strike';
  if (travelHint) {
    const done = stretch && travelState(state()).completed.includes(stretch.index);
    const hintText = nav.runner?.running
      ? runnerCoach(nav.runner)
      : chestPending(e)
        ? 'Your reward chest is on the track ahead!'
        : !e.choices[chapter]
          ? forkHint(e, chapter)
          : (nav.combat?.lastFeedback?.until > nav.courseTime &&
            !nav.combat.group.some(
              r =>
                r.active && ['windup', 'charge', 'seedwindup', 'seedstrike', 'sporewindup', 'pulse'].includes(r.phase),
            )
              ? nav.combat.lastFeedback.text
              : '') ||
            approachGuidance(nav) ||
            (nav.combat?.blocking
              ? enemyHint(nav.combat.blocking) + ' · ' + nav.combat.remaining + ' remaining'
              : stretch?.trial && !done
                ? trialHint(stretch)
                : stretch && !done
                  ? {
                      coins: nav.rushEnabled
                        ? 'Coin trail · jump for high coins · Boost / Shift'
                        : 'Follow the coin trail',
                      rocks:
                        save.mode === 'relaxed'
                          ? 'Rock crossing · edge jumps assisted · cracked stones crumble'
                          : 'Rock crossing · move + jump · cracked stones crumble',
                      plants: 'Purple spores hurt · amber means a burst is coming',
                      steps: 'Climb the old stone stairs',
                    }[stretch.kind]
                  : '');
    const noticeOn = Date.now() < notice.until;
    updateTrailHint(travelHint, noticeOn ? notice.text : hintText, {
      urgent:
        noticeOn ||
        !!nav.combat?.blocking?.active ||
        !!nav.trials?.blocking ||
        !!(stretch && !done && ['rocks', 'plants'].includes(stretch.kind)),
    });
  }
  const nearest = nav.jumping || nav.recovery > 0 ? null : nav.nearest(),
    context = $('#context-action');
  if (context) {
    context.classList.toggle('hidden', !!nav.combat?.blocking || !!nav.trials?.blocking);
    const b = $('#context-button'),
      rushBoost = !nearest && nav.rushEnabled && nav.moving && !nav.path.length;
    if (b && rushBoost) {
      b.dataset.do = 'boost';
      b.innerHTML = icon('follow') + '<small>Boost</small>';
      b.setAttribute('aria-label', 'Boost while moving through a coin section');
    }
    if (b && !rushBoost && (b.dataset.do !== (nearest ? 'interact' : 'follow') || (nearest && nearId !== nearest.id))) {
      b.dataset.do = nearest ? 'interact' : 'follow';
      b.innerHTML = icon(nearest ? 'use' : 'follow') + (nearest ? '<small>Use</small>' : '<small>Follow</small>');
      b.setAttribute(
        'aria-label',
        nearest
          ? `${nearest.type === 'exit' ? 'Finish expedition' : 'Interact with'} ${nearest.object}`
          : 'Follow trail to the next discovery',
      );
    }
    if (nearest) nearId = nearest.id;
  }
  const attack = $('#attack-button');
  if (attack) {
    attack.disabled = !!nav.combat?.attack || nav.combat?.cooldown > 0 || nav.recovery > 0;
    const rival = nav.combat?.blocking;
    attack.classList.toggle(
      'opening',
      nav.trials?.canStrike() ||
        false ||
        (!!rival &&
          nav.combat.canDamage(rival, { kind: nav.jumping ? 'jump' : 'strike' }) &&
          Math.hypot(nav.player.x - rival.x, nav.player.z - rival.z) <= elementalAttack(partner().id).range),
    );
    const small = attack.querySelector?.('small');
    if (small) small.textContent = 'Cast';
  }
  const jump = $('#jump-button');
  if (jump)
    jump.disabled = nav.recovery > 0 || nav.jumpStage === 'anticipation' || (nav.jumpStage === 'air' && nav.vy > 0); // Never while the arrival skid is still running: the skid itself opens the gate when the creature has stopped.
  if (
    nearest &&
    nearest.distance < 4.05 &&
    nav.moving &&
    Date.now() > autoOpenAfter &&
    !nav.jumping &&
    !nav.runner?.arrival
  ) {
    interact(nearest.id);
    return;
  }
  if (Date.now() - lastSnapshot > 1000) {
    lastSnapshot = Date.now();
    persist();
  }
}
function interact(id) {
  if (
    screen !== 'play' ||
    shrineOpen ||
    modal ||
    task ||
    resultCard ||
    locked ||
    nav.jumping ||
    nav.combat?.blocking ||
    nav.trials?.blocking
  )
    return;
  const node = activeNode(state());
  if (!node || id !== node.id || Math.hypot(nav.player.x - node.x, nav.player.z - node.z) > 5.3) return;
  persist();
  if (node.type === 'exit') {
    endRoute();
    return;
  }
  const e = state();
  e.active ??= gateTask(e, node.type);
  task = e.active;
  persist();
  openTaskView();
}
// Six-gate areas ask for more at each gate: the same kind of task comes in two sets of three (Part 1, then Part 2),
// so the 3D pieces keep their layout while the gate asks for six answers.
const TASK_PARTS = 2;
function gateTask(e, type, part = 1) {
  const t = makeTask(
    unit(),
    type,
    `${e.id}:${e.index}`,
    `${e.contentSeed || e.id}:${e.index}:${type}${part > 1 ? ':part' + part : ''}`,
    taskPriority(),
    journey().level,
    journey().practice,
  );
  if (shortPath(e)) {
    t.part = part;
    t.parts = TASK_PARTS;
  }
  return t;
}
function nextPart(t) {
  const e = state(),
    next = gateTask(e, t.type, t.part + 1);
  e.active = next;
  task = next;
  correction = null;
  languageFeedback = null;
  feedbackText = `Part ${next.part} of ${next.parts} · the gate needs one more set.`;
  cue('break');
  persist();
  renderTask();
}
// Hint and More stay out of the way at first: they appear after HELP_DELAY on a task, or straight after a mistake.
const HELP_DELAY = 15000;
let taskOpenedAt = 0;
function openTaskView() {
  languageFeedback = null;
  taskOpenedAt = Date.now();
  document.body.classList.remove('task-help-ready');
  document.body.classList.remove('task-arriving', 'returning-to-play');
  document.body.classList.add('task-arriving');
  setTimeout(() => document.body.classList.remove('task-arriving'), 850);
  world.onMechanismSeat = () => {
    if (task && !document.hidden && !modal) cue('seat');
  };
  voice.load().catch(() => {});
  if (task?.type?.startsWith('listen'))
    voice
      .load()
      .then(() => voice.prefetch((task?.pairs || task?.rounds || []).map(x => x.spoken).filter(Boolean)))
      .catch(() => {});
  document.body.classList.remove('guardian-choice');
  document.body.classList.add('in-task');
  world.setView(false, activeNode(state())?.id || null, !!state().battle);
  world.taskStyle = ['sentence', 'halves'].includes(task.type) ? 'side' : 'front';
  world.paused = true;
  $('#ui').innerHTML = '';
  feedbackText =
    task.kind === 'pairs'
      ? 'Tap one piece, then its matching partner. Completed connections stay in place.'
      : task.rounds[task.round]?.kind === 'blocks'
        ? 'Tap the next sentence block. Correct pieces stay fitted.'
        : 'Read the mechanism, then tap a piece to use it.';
  renderTask();
}
function renderTask() {
  if (!task) return;
  const t = task,
    a = activity(t.type),
    plan = guidancePlan(world.showMechanism(t), t, languageFeedback),
    round =
      (t.parts ? `Part ${t.part} of ${t.parts} · ` : '') +
      (t.kind === 'pairs' ? `${t.matched.length} / 3 connected` : `${Math.min(3, t.round + 1)} / 3`);
  $('#task-layer').innerHTML =
    `<div class="mechanism-hud"><div><span>${esc(a.object)} · ${round}</span><strong>${esc(t.type === 'correct' ? 'Complete the inscription' : t.type === 'qa-pairs' ? 'Questions above · answers below' : a.label)}</strong></div><button data-do="close-task" aria-label="Save and step away">${icon('close')}</button></div>${mechanismMarkup(plan)}<div class="mechanism-tools">${languageFeedback ? languageFeedbackMarkup(languageFeedback) : `<p role="status">${esc(feedbackText || 'Touch the pieces on the mechanism.')}</p>`}<div>${t.kind === 'pairs' ? `<button data-do="inspect-task" aria-pressed="${!!world.mechanism?.inspect}">${world.mechanism?.inspect ? 'All pairs' : 'Read closely'}</button>` : ''}<button class="help-later" data-do="hint">${icon('help')}${esc(languageCoach.hintLabel(t))}</button>${t.type.startsWith('listen') ? '<button data-do="speech-text">Reading support</button>' : ''}<button class="help-later" data-do="task-tools">${icon('more')}More</button></div></div>`;
}
function speak(text) {
  text = spokenRequest(text);
  gameAudio.reading = true;
  gameAudio.silence();
  voice
    .say(text, {
      rate: save.mode === 'relaxed' ? 0.94 : 1,
      onend: () => {
        gameAudio.reading = false;
      },
    })
    .then(ok => {
      if (!ok) browserSpeak(text);
    })
    .catch(() => browserSpeak(text));
}
// Browser voice fallback, used only when a recorded clip is missing or audio cannot start.
// A female American or British voice is preferred (voice-preference.js); any English voice is the fallback. `quiet`
// (automatic reading after an answer) never switches on reading support or shows a notice when speech is unavailable.
function browserSpeak(text, { quiet = false } = {}) {
  if (!speechSupported) {
    if (!quiet) {
      showSpeech();
      toast('Speech is unavailable here. Reading support is enabled.');
    }
    return;
  }
  try {
    const voices = speechSynthesis.getVoices(),
      chosen = englishVoice(voices);
    if (!chosen && (!quiet || voices.length)) {
      if (!quiet) {
        showSpeech();
        toast('A clear English voice is unavailable. Reading support is enabled.');
      }
      return;
    }
    gameAudio.reading = true;
    gameAudio.silence();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = chosen?.lang || 'en-US';
    if (chosen) u.voice = chosen;
    u.rate = save.mode === 'relaxed' ? 0.85 : 0.95;
    u.onend = () => {
      gameAudio.reading = false;
    };
    u.onerror = () => {
      gameAudio.reading = false;
      if (task && !quiet) {
        showSpeech();
        toast('Audio could not play. Reading support is enabled.');
      }
    };
    speechSynthesis.speak(u);
  } catch {
    if (!quiet) showSpeech();
  }
}
// Gate tasks read the English that was just formed or matched (task-voice.js). Single words use the recorded voice;
// sentences use the browser's English voice, started inside the tap so phones allow it.
if (speechSupported)
  try {
    speechSynthesis.getVoices();
    speechSynthesis.addEventListener?.('voiceschanged', () => speechSynthesis.getVoices());
  } catch {}
function readAloud(text) {
  text = String(text || '').trim();
  if (!text || save.readAloud === false) return;
  if (voice.manifest && voice.canSay(text)) {
    speak(text);
    return;
  }
  voice.stop();
  browserSpeak(text, { quiet: true });
}
let revealTimer = 0;
function showReveal(r) {
  if (typeof document === 'undefined' || typeof document.body?.appendChild !== 'function' || !r) return;
  let el = document.getElementById('language-reveal');
  if (!el) {
    el = document.createElement('div');
    el.id = 'language-reveal';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.addEventListener('click', e => {
      if (e.target.closest?.('[data-reveal-listen]')) readAloud(el.dataset.say);
    });
    document.body.appendChild(el);
  }
  el.dataset.say = r.en;
  el.className = 'reveal-' + r.kind;
  el.innerHTML = revealMarkup(r);
  el.hidden = false;
  void el.offsetWidth;
  el.classList.add('show');
  clearTimeout(revealTimer);
  revealTimer = setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => {
      if (!el.classList.contains('show')) el.hidden = true;
    }, 400);
  }, revealTime(r));
}
function hideReveal() {
  const el = typeof document !== 'undefined' && document.getElementById?.('language-reveal');
  if (el) {
    clearTimeout(revealTimer);
    el.classList.remove('show');
    el.hidden = true;
  }
}
function showSpeech() {
  gameAudio.reading = false;
  if (!task) return;
  if (!task.showSpeech) {
    task.showSpeech = true;
    task.hints++;
    journey().stats.hints++;
  }
  persist();
  renderTask();
}
function submit(action) {
  if (!task || locked) return;
  const t = task,
    j = journey(),
    u = unit(),
    before = { round: t.round, matched: t.matched.length },
    feedbackBefore = JSON.parse(JSON.stringify(t)),
    run = currentRun(),
    result = actTask(t, action);
  t.missed ??= [];
  if (result.selection) languageFeedback = null;
  if (result.wrong) {
    document.body.classList.add('task-help-ready');
    languageFeedback = languageCoach.wrong(t, action);
    notePracticeMistake(j, t, u);
    j.stats.mistakes++;
    world.mechanism?.reject?.(action);
    tone(false);
    if (lastTap?.el) bump(lastTap.el, 'fx-shake');
    buzz(HAPTICS.wrong);
    // Better mistakes: show the right answer with its Turkish meaning and a reason; the item returns later.
    correction = explainMistake(t, action, u);
    for (const id of correction?.ids || [])
      if (!t.missed.includes(id)) {
        t.missed.push(id);
        recordAnswer(j, id, false);
        const v = u.vocabulary.find(x => x.id === id);
        if (v && !run.review.some(w => w.en === v.en)) run.review.push({ en: v.en, tr: v.tr });
      }
    feedbackText = 'Not quite. Check the correction, then try again. Your correct work is safe.';
    const battle = state().battle;
    if (battle) {
      battle.hp = Math.max(1, battle.hp - (save.mode === 'challenge' ? 10 : 5));
    }
  }
  if (result.accepted) {
    languageFeedback = languageCoach.accepted(feedbackBefore, t, action, result);
    world?.combatExpression?.cue('success');
    j.stats.correct++;
    correction = null;
    world.mechanism?.accept(action, t.type, t);
    if (lastTap)
      burst(lastTap.x, lastTap.y, { color: partner().color, priority: result.complete ? 'complete' : 'step' });
    buzz(HAPTICS.correct);
    cue(
      result.complete
        ? 'correct'
        : t.kind === 'pairs'
          ? 'pair'
          : t.type === 'repair'
            ? 'repair'
            : ['instructions', 'listen-multi', 'sort'].includes(t.type)
              ? 'deliver'
              : 'place',
    );
    feedbackText =
      t.type === 'spelling' && t.rounds[t.round - 1]?.correction
        ? `Correct spelling: ${t.rounds[t.round - 1].correction}`
        : 'The trail responds. Progress saved.';
    {
      const said = acceptedLines(feedbackBefore, t, action, result);
      readAloud(said.say);
      if (said.reveal) showReveal(said.reveal);
    }
    world.progress(t.type, taskFraction(t));
    // Spaced repetition: a finished item counts once; items missed in this task stay due and come back later.
    const finished =
      t.kind === 'pairs'
        ? t.matched.length > before.matched
          ? t.matched.at(-1)
          : null
        : t.round > before.round
          ? before.round
          : null;
    if (finished !== null) {
      const ids = itemIds(t, finished, u),
        missed = ids.some(id => t.missed.includes(id));
      if (!missed) {
        let gained = 0,
          reviews = 0,
          learned = 0;
        const vocab = new Set(u.vocabulary.map(v => v.id));
        for (const id of ids) {
          const m = j.mastery?.[id],
            review = m && m.b >= 1 && isDue(m, dayNumber(), j.runCount || 0);
          const g = recordAnswer(j, id, true);
          gained += Math.max(0, g);
          if (review && g > 0) reviews++;
          if (!m && vocab.has(id) && g > 0) {
            learned++;
            const v = u.vocabulary.find(x => x.id === id);
            if (!run.learned.some(w => w.en === v.en)) run.learned.push({ en: v.en, tr: v.tr });
          }
        }
        run.correct++;
        run.growth += gained;
        quest('correct');
        if (reviews) quest('review', reviews);
        if (learned) quest('learn', learned);
      }
    }
    if (result.complete && t.parts && t.part < t.parts) {
      if (!t.mistakes) {
        run.perfect++;
        quest('perfect');
      }
    } else if (result.complete) {
      world.celebrate();
      run.tasks++;
      if (!t.mistakes) {
        run.perfect++;
        quest('perfect');
      }
      if (t.type.startsWith('listen')) quest('listen');
    }
  }
  if (result.complete && !state().battle && t.parts && t.part < t.parts) {
    completePractice(j, t, u);
    for (const item of t.pairs || t.rounds) if (item.id) j.seen[item.id] = (j.seen[item.id] || 0) + 1;
    nextPart(t);
    return;
  }
  if (result.complete) {
    completePractice(j, t, u);
    world.showMechanism(t);
    for (const item of t.pairs || t.rounds) if (item.id) j.seen[item.id] = (j.seen[item.id] || 0) + 1;
    if (state().battle) {
      completeBattleTask();
      return;
    }
    const m = milestone(j, state(), t.type, nav.player, nav.heading);
    if (!m.changed) return;
    ensureTicket();
    const saved = persist();
    if (t.type === 'ending') world.feed();
    task = null;
    guideCameo(t.mistakes ? 'Gate open! Well read.' : 'Perfect! Not a single mistake!', {
      pose: t.mistakes ? 'smile' : 'cheer',
      ms: 3000,
    });
    queueCompletion(
      'trail',
      saved
        ? chestPending(state())
          ? 'Run complete · your reward chest is ahead!'
          : 'Checkpoint saved · the way is open.'
        : 'Could not save · export a backup.',
    );
    return;
  }
  persist();
  renderTask();
}
function showResult(title, text, label, action) {
  document.body.classList.add('in-task', 'guardian-choice');
  if (!world.focus && !world.battle) world.setView(false, activeNode(state())?.id || null);
  resultCard = true;
  world.paused = true;
  $('#task-layer').innerHTML =
    `<div class="milestone-toast" role="status"><span>✧ ${state().battle ? 'GUARDIAN TRIAL' : 'CHECKPOINT SAVED'}</span><strong>${esc(title)}</strong><p>${esc(text)}</p><button data-do="${action}">${esc(label)} →</button></div>`;
  $('#ui').innerHTML = '';
}
function queueCompletion(next, notice) {
  task = null;
  resultCard = true;
  world.paused = true;
  const p = world.mechanism?.plan;
  $('#task-layer').innerHTML = p && p.entries.every(e => !e.action) ? mechanismMarkup(p) : '';
  $('#ui').innerHTML = '';
  pendingCompletion = { next, notice, expedition: nav.state, at: Date.now() + (world.mechanism?.theme ? 1900 : 1100) };
}
function returnTrail() {
  pendingCompletion = null;
  const p = state().pendingEvolution;
  if (p) {
    document.body.classList.remove('in-task');
    task = null;
    resultCard = false;
    world.hideMechanism();
    return evolution(false, { from: p.from, to: p.to, path: true });
  }
  document.body.classList.remove('in-task');
  task = null;
  resultCard = false;
  state().active = null;
  world.setView(false);
  world.refresh();
  world.paused = false;
  autoOpenAfter = Date.now() + 1400;
  renderPlay();
  toNextRun();
  document.body.classList.remove('task-arriving');
  document.body.classList.add('returning-to-play');
  setTimeout(() => document.body.classList.remove('returning-to-play'), 520);
  persist();
}
// Reward chests end chapters; forms are already earned at English checkpoints.
function openChest() {
  const e = state(),
    j = journey();
  if (!chestPending(e) || locked || task || modal) return false;
  nav.stop();
  world.setInput?.(0, 0);
  const run = currentRun(),
    p = world.chestPoint || nav.player;
  world.openChest?.();
  cue('chest');
  buzz(HAPTICS.reward);
  const coins = (save.mode === 'challenge' && !shortPath(e) ? 12 : 6) + 2 * Math.min(4, run.perfect || 0);
  save.wallet.balance += coins;
  save.wallet.total += coins;
  const outcome = finishRun(j, e);
  quest('run');
  persist();
  {
    const at = world.screenPoint?.({ x: p.x, y: 1.2, z: p.z });
    if (at) screenFx('chest-burst', '<i></i><b></b>', at, 1400);
    rewardCoins(coins, at);
  }
  pendingSummary = {
    at: Date.now() + 1000,
    expedition: e.id,
    outcome,
    run: { ...run },
    coins,
    level: j.level,
    story: e.pacingVersion >= 1 ? sceneBeat(e, run.chapter) : null,
  };
  resultCard = false;
  world.paused = false;
  if (!nav.runner?.running) renderPlay();
  return true;
}
function runSummary(p) {
  if (screen !== 'play' || p.expedition !== state().id) return;
  resultCard = false;
  world.paused = false;
  if (p.outcome.evolved) {
    evolution(false);
    return;
  }
  // Opened on the run: keep running. On the final chase the guardian waits at the end of the chase.
  if (nav.runner?.running) {
    guideCameo(p.outcome.guardian ? 'Treasure! Now the guardian…' : 'Treasure! Keep running!', { pose: 'cheer' });
    toast(
      p.outcome.guardian
        ? `Chest opened · +${p.coins} coins · the guardian waits ahead!`
        : `Chest opened · +${p.coins} coins!`,
    );
    persist();
    return;
  }
  if (p.outcome.guardian) {
    showBattle();
    return;
  }
  if (p.outcome.weekComplete) {
    home();
    toast(`Expedition complete · +${p.coins} coins saved.`);
    return;
  }
  world.refresh();
  renderPlay();
  persist();
  toast(`Chest opened · +${p.coins} coins · the next trail is ready.`);
}

function renderOnboarding() {
  screen = 'home';
  renderHome();
}
// First launch goes straight to the first task: branch chosen, a short walk, then Follow.
async function quickStart() {
  const e = state();
  if (e.index === 0 && !e.choices[0] && !e.active) {
    chooseBranch(e, 'left');
    const node = activeNode(e),
      a = approachPoint(node),
      from = chapterPath(0, 'left')[1],
      dx = a.x - from.x,
      dz = a.z - from.z,
      len = Math.hypot(dx, dz),
      back = RUNNER ? len - 0.3 : Math.min(len - 0.5, 9);
    e.position = { x: a.x - (dx / len) * back, z: a.z - (dz / len) * back };
    e.heading = Math.atan2(dx, dz);
    travelState(e).safe = { ...e.position, y: 0, heading: e.heading };
    nav.restore(e.position);
    nav.heading = e.heading;
  }
  save.tutorial = true;
  persist();
  await enter();
  if (!task && !RUNNER) {
    nav.approach();
    toast(
      `${save.nickname} spotted something ahead! Steer with the joystick; collect coin chains and tap Boost while moving.`,
    );
  }
}
async function selectPartner(id) {
  if (screen !== 'home' || !PARTNERS.some(p => p.id === id) || id === partner().id) return;
  if (onboarding) {
    const typed = $('#onboard-name')?.value?.trim();
    onboardName = typed && typed !== partner().name ? typed : null;
  }
  snapshot();
  locked = true;
  const before = partner().id;
  loadingNotice('Loading your creature…');
  try {
    world.partner = id;
    const form = await world.fetchForm(journeysFor(save, id)[save.selected]?.level || 0);
    if (!choosePartner(save, id)) throw Error('Invalid team progress');
    languageCoach.records.clear();
    languageFeedback = null;
    syncWorld();
    world.adoptForm(form);
    nav.restore(state().position);
    nav.heading = state().heading;
    soundUpdate();
    closeModal();
    await home();
    persist();
    warmNextForm();
  } catch (error) {
    world.partner = before;
    locked = false;
    toast('This creature could not load. Your saved partner is unchanged.');
  } finally {
    clearLoading();
  }
}
function endRoute() {
  const e = state();
  if (chestPending(e)) {
    openChest();
    return;
  }
  const outcome = finishExpedition(journey(), e);
  persist();
  if (outcome.evolved) {
    evolution(false);
    return;
  } // The chase ends at the arena, and the fight begins there.
  if (outcome.guardian) {
    if (showShrine() || showBattle()) return;
    showResult(
      'The guardian is waiting',
      `${AREAS[e.area].guardian} will test your strength.`,
      'Challenge the guardian',
      'guardian',
    );
    return;
  }
  if (outcome.nextExpedition) {
    showResult(
      'Week complete',
      'All 20 activity types completed. Defeat the arena boss to earn its final form.',
      'Begin the next expedition',
      'next-expedition',
    );
  }
}
function newExpedition() {
  const j = journey();
  j.expeditions[save.area] = freshExpedition(j, save.selected, save.area);
  shuffleGates(j, j.expeditions[save.area], { six: sixGates });
  syncWorld();
  world.setView(false);
  renderPlay();
  persist();
}
let guardianHudKey = '',
  guardianSealKey = '',
  guardianFeedback = '',
  guardianFlash = '',
  guardianFlashUntil = 0;
// Every untouched area becomes a six-gate area before its course or scenery is built (path-shape.js).
// A backup from an earlier build: some area is past its start without being a six-gate area.
const earlierBuild = data =>
  Object.values(data.journeys || {}).some(j =>
    Object.values(j.expeditions || {}).some(
      e => e && e.pathVersion !== 3 && (e.index > 0 || e.completed?.length || e.active || e.battle),
    ),
  );
function sixGateSave() {
  state();
  let changed = false;
  for (const j of Object.values(save.journeys || {}))
    for (const e of Object.values(j.expeditions || {})) {
      if (e && shuffleGates(j, e, { six: sixGates })) changed = true;
      if (e && shortPath(e) && !Number.isInteger(e.lives)) {
        e.lives = START_LIVES;
        e.coinStart = save.wallet?.total || 0;
        changed = true;
      }
    }
  if (changed) persist();
  return changed;
}
// Lives (0.57): three per area. A bump on a run, a fall or a hit from a rival or the chasing guardian costs one; a
// completed word run gives one back (up to five). With none left the area starts again from its first gate: the
// coins collected and the Forms earned on that attempt are taken back, while English progress (mastery, Wordex) stays.
// Ulti points (0.58): the English League (league.js). A completed area (guardian won) earns Ulti for the student's grade
// and team pool; the League sets the points, how long they last and the daily limits. A ticket is asked for when an area
// is played, renewed early in the area if it has aged, and claimed on the guardian win.
const league = createLeague({
  api: leagueApi(typeof window !== 'undefined' ? window.SOLMAXIMA_CONFIG : null),
  storage: typeof localStorage === 'undefined' ? null : localStorage,
});
const ULTI_RENEW_MS = 30 * 3600000;
let ultiBanner = null,
  leagueAsked = 0;
const leagueInfo = (e = state()) => ({
  runId: e.id,
  grade: unit().grade,
  team: partner().id,
  arena: e.area,
  pace: save.mode === 'challenge' ? 'challenge' : 'relaxed',
  unit: save.selected,
});
function ensureTicket() {
  const e = state();
  if (!league.enabled || !shortPath(e) || journey().guardians.includes(e.area)) return;
  const info = leagueInfo(e),
    age = league.ticketAge(e.id);
  if (age === null) league.start(info).catch(() => {});
  else if (age > ULTI_RENEW_MS && e.index <= 1 && !e.battle) league.renew(info).catch(() => {});
}
async function claimUlti(runId, info) {
  const result = await league.claim(runId).catch(() => ({ state: 'retry' }));
  const msg = ultiMessage(result, info);
  if (msg) showUlti(msg);
  league.refresh(info.grade).catch(() => {});
}
function showUlti(msg) {
  ultiBanner = msg;
  if (typeof document === 'undefined' || typeof document.body?.appendChild !== 'function') return;
  const show = () => {
    if (screen === 'evolution' || document.body.classList?.contains('cinematic')) {
      setTimeout(show, 1500);
      return;
    }
    const el = document.createElement('div');
    el.className = 'ulti-banner' + (msg.good ? ' good' : '');
    el.setAttribute('role', 'status');
    el.innerHTML = `${ultiIcon('ulti-icon big')}<span>${esc(msg.text)}</span>`;
    document.body.appendChild(el);
    if (msg.good) cue('reward');
    setTimeout(() => el.remove?.(), 7000);
  };
  show();
}
function leagueCard() {
  if (!league.enabled) return '';
  const grade = unit().grade,
    snap = league.snapshot(grade),
    mine = partner().id;
  if (Date.now() - leagueAsked > 60000) {
    leagueAsked = Date.now();
    league
      .refresh(grade)
      .then(() => {
        if (modal && journalTab === 'rewards') journal('rewards');
      })
      .catch(() => {});
  }
  const head = `<h3 class="league-title">${ultiIcon()} Ulti · Grade ${grade} League</h3>`;
  if (!snap.known) return `<div class="journal-card league-card">${head}<p>Connecting to the English League…</p></div>`;
  if (!snap.game)
    return `<div class="journal-card league-card">${head}<p>The English League has not switched solMaxima on yet.</p></div>`;
  const pts = arenaPoints(snap.settings, save.mode, save.area),
    top = Math.max(1, ...snap.teams.map(t => t.points));
  return `<div class="journal-card league-card">${head}<p>Win an area's guardian fight to add Ulti to your team's pool${pts ? ` (this area: <b>+${pts}</b>)` : ''}. Ulti last ${hoursLabel(snap.hours)}, then fade.</p><div class="league-pools">${snap.teams.map(t => `<div class="league-row${t.id === mine ? ' mine' : ''}"><span class="league-team">${esc(t.id.charAt(0).toUpperCase() + t.id.slice(1))}</span><span class="league-bar"><i style="width:${Math.round((t.points / top) * 100)}%"></i></span><b>${t.points}</b>${ultiIcon()}</div>`).join('')}</div>${ultiBanner ? `<p class="league-last">${esc(ultiBanner.text)}</p>` : ''}</div>`;
}
let lifeGraceUntil = 0,
  restarting = false;
// Coins collected within 0.9 s of each other form a streak: each one chimes a step higher on a pentatonic scale.
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
let coinStreak = 0,
  lastCoinAt = 0;
function lives(e = state()) {
  return Number.isInteger(e.lives) ? e.lives : START_LIVES;
}
// Reward and loss effects (0.60): small screen-space pieces that remove themselves.
function screenFx(cls, html = '', at = null, ms = 1200) {
  if (typeof document === 'undefined' || typeof document.body?.appendChild !== 'function') return null;
  const el = document.createElement('div');
  el.className = cls;
  el.setAttribute('aria-hidden', 'true');
  if (at && Number.isFinite(at.x)) {
    el.style.left = at.x + 'px';
    el.style.top = at.y + 'px';
  }
  el.innerHTML = html;
  document.body.appendChild(el);
  setTimeout(() => el.remove?.(), ms);
  return el;
}
function lifeFx(kind) {
  if (typeof document === 'undefined' || !document.getElementById) return;
  const heart = heartsHtml(1).replace(/<svg class="heart full"/, '<svg class="heart full"');
  if (kind === 'lose') {
    screenFx('life-flash', '', null, 700);
    screenFx('heart-crack', `<span class="half l">${heart}</span><span class="half r">${heart}</span>`, null, 1000);
    return;
  }
  const from = document.getElementById('runner-word')?.getBoundingClientRect?.(),
    to = document.getElementById('life-readout')?.getBoundingClientRect?.();
  if (!to) return;
  const start =
    from && from.width
      ? { x: from.left + from.width / 2, y: from.top + from.height / 2 }
      : { x: innerWidth / 2, y: innerHeight * 0.35 };
  const el = screenFx('heart-fly', heart, start, 1200);
  if (el) {
    el.style.setProperty('--dx', to.left + to.width - 10 - start.x + 'px');
    el.style.setProperty('--dy', to.top + to.height / 2 - start.y + 'px');
  }
}
function livesBadge(n) {
  return heartsHtml(n) + `<span class="lives-count">×${n}</span>`;
}
function showLives(kind) {
  const el = $('#life-readout');
  if (!el) return;
  el.innerHTML = livesBadge(lives());
  el.setAttribute?.('aria-label', `${lives()} lives`);
  el.classList?.remove('life-lost', 'life-gained');
  void el.offsetWidth;
  el.classList?.add(kind === 'gain' ? 'life-gained' : 'life-lost');
  lifeFx(kind === 'gain' ? 'gain' : 'lose');
}
function loseLife(reason, { arena = false } = {}) {
  const e = state();
  if (!shortPath(e) || (e.battle && !arena) || restarting || screen !== 'play' || Date.now() < lifeGraceUntil)
    return false;
  lifeGraceUntil = Date.now() + 1500;
  e.lives = Math.max(0, lives(e) - 1);
  persist();
  showLives('lose');
  buzz(HAPTICS.hurt);
  if (!world?.guardianStage?.active && e.lives > 0)
    guideCameo(e.lives === 1 ? 'Careful! One life left.' : 'Ouch! Read the warning and try again.', {
      pose: 'think',
      ms: 2400,
      gap: 5000,
    });
  if (e.lives === 0) {
    outOfLives();
    return 'out';
  }
  playNotice?.(`💔 ${e.lives} ${e.lives === 1 ? 'life' : 'lives'} left`, 2600) ||
    toast(`${e.lives} ${e.lives === 1 ? 'life' : 'lives'} left`);
  return true;
}
function gainLife() {
  const e = state();
  if (!shortPath(e)) return false;
  if (lives(e) >= MAX_LIVES) return false;
  e.lives = lives(e) + 1;
  persist();
  showLives('gain');
  cue('reward');
  setTimeout(() => {
    playNotice?.(`❤️ Word complete · +1 life (${e.lives})`, 3000) || toast(`+1 life (${e.lives})`);
  }, 1600);
  return true;
}
async function outOfLives() {
  const j = journey(),
    e = state(),
    area = save.area,
    lost = Math.max(
      0,
      (save.wallet?.total || 0) - (Number.isInteger(e.coinStart) ? e.coinStart : save.wallet?.total || 0),
    ),
    from = j.level;
  restarting = true;
  try {
    task = null;
    resultCard = false;
    nav.stop?.();
    if (shrineOpen) closeShrine();
    if (world.guardianStage) {
      world.setView(false);
      document.body.classList.remove('in-guardian', 'in-guardian-finisher');
      gameAudio.music?.update?.('explore', 0);
      screen = 'play';
    }
    if (save.wallet) {
      save.wallet.balance = Math.max(0, save.wallet.balance - lost);
      save.wallet.total = Math.max(0, save.wallet.total - lost);
    }
    j.level = pathLevel(0, area, SHORT.gates);
    const fresh = (j.expeditions[area] = freshExpedition(j, save.selected, area));
    shuffleGates(j, fresh, { six: true });
    fresh.lives = START_LIVES;
    fresh.coinStart = save.wallet?.total || 0;
    recordPathGrowth(j, fresh);
    if (nav) nav.runner = null;
    syncWorld();
    if (j.level !== from) await world.loadForm(j.level);
    nav.setLevel(j.level);
    world.refresh?.();
    persist();
    renderPlay();
    toNextRun();
    ensureTicket();
    showModal(
      'Out of lives',
      `<div class="out-of-lives"><div class="guide-note">${guideFigure('think')}<p class="guide-bubble">Don't worry, every explorer falls sometimes. Read the warnings and try again!</p></div><p class="lives-big" aria-hidden="true">${heartsHtml(0)}</p><p>The path starts again from its first gate${j.level < from ? `, and your creature is back to Level ${j.level}` : ''}.${lost ? ` The ${lost} coins collected on this attempt are lost.` : ''}</p><p><b>Your English progress is kept.</b> Watch for the word runs: each word you complete gives an extra life.</p><button class="primary-action wide" data-do="close-modal">Start the path again</button></div>`,
    );
  } finally {
    restarting = false;
  }
}
// New areas have six gates (path-shape.js). Tests of the classic 20-gate layout, which saved expeditions keep, set MAXIMA_PATH=classic.
const sixGates = globalThis.process?.env?.MAXIMA_PATH !== 'classic';
// Controls (gesture-controls.js): device settings, the one-time tutorial and one-time gesture hints.
let controlPrefs = loadControls(typeof localStorage === 'undefined' ? null : localStorage),
  tutorialOpen = false;
function setControls(change) {
  Object.assign(controlPrefs, change);
  saveControls(controlPrefs, typeof localStorage === 'undefined' ? null : localStorage);
  applyControls(controlPrefs);
  controls?.update?.();
}
const touchScreen = () =>
  (typeof matchMedia === 'function' && matchMedia('(pointer:coarse)').matches) || world?.touchHUD;
function startTutorial() {
  if (tutorialOpen || typeof document === 'undefined' || typeof document.body?.appendChild !== 'function') return false;
  tutorialOpen = true;
  world.paused = true;
  world.setInput?.(0, 0);
  try {
    runControlsTutorial({
      left: controlPrefs.left,
      touch: !!touchScreen(),
      color: sketchColor(partner().id),
      onPractice: () => cue('select'),
      onDone: () => {
        tutorialOpen = false;
        setControls({ tutorial: true });
        if (screen === 'play' && !modal && !task) world.paused = false;
        cue('reward');
      },
    });
    return true;
  } catch {
    tutorialOpen = false;
    world.paused = false;
    return false;
  }
}
function gestureHint(key, text, ms = 5200) {
  if (controlPrefs.hints[key] || typeof document === 'undefined' || typeof document.body?.appendChild !== 'function')
    return;
  setControls({ hints: { ...controlPrefs.hints, [key]: true } });
  if (world?.guardianStage?.active) {
    guardianFlash = text;
    guardianFlashUntil = performance.now() + ms;
    return;
  }
  if (playNotice('👆 ' + text, ms)) return;
  const el = document.createElement('div');
  el.className = 'gesture-hint';
  el.setAttribute('role', 'status');
  el.innerHTML = `<span class="hand" aria-hidden="true">👆</span><span>${text}</span>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove?.(), ms);
}
// First-time danger lessons (danger-lessons.js): the run pauses on the first crystal wall, rolling boulders and each
// guardian chase attack, and the student does the move to carry on. That first attack cannot cost a life.
let lessonOpen = false,
  jumpCoachUntil = 0;
const coachedWaves = new Set();
function dangerLesson(key, { attack = null, warnLane = null } = {}) {
  const r = nav?.runner;
  if (
    lessonOpen ||
    tutorialOpen ||
    controlPrefs.hints['lesson:' + key] ||
    !r?.running ||
    screen !== 'play' ||
    task ||
    modal ||
    resultCard ||
    typeof document === 'undefined' ||
    typeof document.body?.appendChild !== 'function'
  )
    return false;
  const plan = lessonPlan(key, { lane: r.lane, attack, warnLane });
  if (!plan) return false;
  lessonOpen = true;
  world.paused = true;
  world.setInput?.(0, 0);
  setControls({ hints: { ...controlPrefs.hints, ['lesson:' + key]: true } });
  creatureCue(null);
  cue('select');
  buzz(HAPTICS.hit);
  const at = world.screenPoint?.({ x: nav.player.x, y: (nav.y || 0) + (nav.height || 0.7) * 0.55, z: nav.player.z });
  try {
    runDangerLesson(plan, {
      color: sketchColor(partner().id),
      touch: !!touchScreen(),
      creatureAt: at,
      onDone: kind => {
        lessonOpen = false;
        if (screen !== 'play' || task || modal) return;
        world.paused = false;
        nav.invincible = Math.max(nav.invincible || 0, plan.grace);
        if (key === 'crystal' && kind) world.attack?.();
        else if ((kind === 'left' || kind === 'right') && r.running) r.shift(kind === 'left' ? -1 : 1);
        if (plan.jump || plan.jumpAfter) jumpCoachUntil = performance.now() + 6000;
        cue('correct');
      },
    });
    return true;
  } catch {
    lessonOpen = false;
    world.paused = false;
    return false;
  }
}
// While a crystal wall is in Cast range, a ring and a tapping hand sit on the creature: "Tap me!".
let creatureCueEl = null;
function creatureCue(at) {
  if (typeof document === 'undefined' || typeof document.body?.appendChild !== 'function') return;
  if (!at) {
    if (creatureCueEl) creatureCueEl.hidden = true;
    return;
  }
  if (!creatureCueEl?.isConnected) {
    creatureCueEl = document.createElement('div');
    creatureCueEl.className = 'creature-cue';
    creatureCueEl.setAttribute('aria-hidden', 'true');
    creatureCueEl.innerHTML =
      '<span class="ring"></span><span class="hand">👆</span><span class="label">Tap me!</span>';
    document.body.appendChild(creatureCueEl);
  }
  creatureCueEl.hidden = false;
  creatureCueEl.style.transform = `translate(${Math.round(at.x)}px,${Math.round(at.y)}px)`;
}
function runnerTeach() {
  const r = nav?.runner,
    run = r?.running && r.section?.run,
    live = run && screen === 'play' && !task && !modal && !resultCard && !tutorialOpen && !world.guardianStage?.active;
  let crystal = null;
  if (live && !lessonOpen) {
    crystal =
      run.obstacles.find(o => o.type === 'crystal' && !r.knocked.has(o.id) && o.s - r.s > -0.3 && o.s - r.s < 18) ||
      null;
    if (crystal && crystal.s - r.s < Math.max(11, r.speed * 1.3) && dangerLesson('crystal')) crystal = null;
    if (!lessonOpen)
      for (const o of run.obstacles)
        if (o.type === 'boulders') {
          const st = r.trials.get(o.id);
          if (st?.warn != null && dangerLesson('boulders', { warnLane: st.warn })) break;
        }
    // Right after a jump lesson, "Jump now!" flashes as each wave reaches the creature.
    if (!lessonOpen && performance.now() < jumpCoachUntil)
      for (const o of run.obstacles)
        if (o.type === 'guardian')
          for (const w of r.trials.get(o.id)?.waves || [])
            if (!coachedWaves.has(w.id) && w.s > r.s && w.s - r.s < Math.max(2.4, (r.speed + (w.speed || 0)) * 0.3)) {
              coachedWaves.add(w.id);
              runFlash('Jump now!', 'great');
            }
  }
  creatureCue(
    crystal && !lessonOpen
      ? world.screenPoint?.({ x: nav.player.x, y: (nav.y || 0) + (nav.height || 0.7) * 0.55, z: nav.player.z })
      : null,
  );
}
const STUMBLE_TIPS = {
  bar: 'Slide under the bars: ↓ or swipe down.',
  crystal: 'Crystal walls need a cast: tap your creature to break them!',
  boulders: 'Boulders roll down the amber lane: swipe to another lane.',
  roots: 'Roots race down the amber lane: swipe to a blue lane.',
  seeds: 'Seed pods land in the amber lane: swipe to a blue lane.',
  volley: 'Stones aim at your lane: keep switching lanes.',
  shards: 'Crystals fall in the amber lanes: take the blue lane.',
  prism: 'The beam bounces: stay out of both amber lanes.',
  dive: 'Sky Dive: switch lanes, then jump the shockwave.',
  slam: 'Shockwave! Swipe up to jump as it reaches you.',
  gale: 'Gale wall! Swipe up to jump as it reaches you.',
  chain: 'Storm Chain! Jump it, or take the blue lane.',
  thorns: 'Run where the thorns are down.',
};
const stumbleTip = type => STUMBLE_TIPS[type] || 'Jump the hurdles: ↑ or swipe up.';
// When rivals wait at a gate, and in the guardian arena, a ring and a dragging hand show the joystick (first two times).
function joystickLesson(key, html, delay = 700) {
  const k = 'stick:' + key,
    seen = Number(controlPrefs.hints[k]) || 0;
  if (seen >= 2 || typeof document === 'undefined' || typeof document.body?.appendChild !== 'function') return;
  setControls({ hints: { ...controlPrefs.hints, [k]: seen + 1 } });
  setTimeout(() => {
    const stick = document.getElementById?.('joystick');
    if (!stick || screen !== 'play' || task || modal) return;
    const box = stick.getBoundingClientRect();
    if (!box.width) return;
    document.querySelector('.joystick-lesson')?.remove();
    const el = document.createElement('div');
    el.className = 'joystick-lesson ' + (box.left + box.width / 2 < innerWidth / 2 ? 'left' : 'right');
    el.setAttribute('role', 'status');
    el.style.left = Math.round(box.left + box.width / 2) + 'px';
    el.style.top = Math.round(box.top + box.height / 2) + 'px';
    el.innerHTML = `<span class="ring" aria-hidden="true"></span><span class="hand" aria-hidden="true">👆</span><span class="label">${guideFigure('bust', { cls: 'label-avatar' })}<span>${html}</span></span>`;
    document.body.appendChild(el);
    let ended = false;
    const end = () => {
        if (ended) return;
        ended = true;
        el.remove();
        removeEventListener('pointerdown', down, true);
        removeEventListener('keydown', key, true);
      },
      down = e => {
        if (e.target?.closest?.('#joystick')) setTimeout(end, 1500);
      },
      key = e => {
        if (/^(?:[wasd]|Arrow.*)$/i.test(e.key || '')) setTimeout(end, 1200);
      };
    addEventListener('pointerdown', down, true);
    addEventListener('keydown', key, true);
    setTimeout(end, 11000);
  }, delay);
}
function controlsMenu() {
  showModal(
    'Controls',
    `<p>Swipe up anywhere to jump. Tap anywhere to cast, or tap a rival to aim at it. On runs, swipe left or right to change lane and down to slide. Move with the joystick in clearings and arenas.</p><div class="controls-menu"><button class="secondary wide" data-do="controls-hand">Joystick: ${controlPrefs.left ? 'left side (left-handed)' : 'right side'}</button><button class="secondary wide" data-do="controls-buttons">Jump and Cast buttons: ${controlPrefs.buttons ? 'shown' : 'hidden'}</button><button class="secondary wide" data-do="controls-tutorial">Play the controls tutorial</button></div>`,
  );
}
function renderGuardian() {
  const b = state().battle;
  document.body.classList.remove('in-task', 'guardian-choice');
  document.body.classList.add('in-guardian', 'playing');
  document.body.classList.toggle('in-guardian-finisher', ['ward', 'finisher', 'victory'].includes(b.phase));
  $('#ui').innerHTML =
    `<div id="guardian-status">${guardianHud(b, AREAS[state().area].guardian, '', b.tough ? lives() : null)}</div>${guardianControls()}<div class="special-bar" id="special-bar" aria-label="Elemental specials">${specialBar(b)}</div>`;
  specialBarKey = '';
  $('#task-layer').innerHTML = '';
  $('#world-labels').innerHTML = '';
  guardianHudKey = '';
  guardianSealKey = '';
  controls.update();
  joystick();
}
function guardianEvent(kind, data) {
  if (kind === 'release')
    cue({ air: 'castAir', fire: 'castFire', nature: 'castNature', water: 'castWater' }[partner().element]);
  if (kind === 'boss-hit' || kind === 'seal') {
    cue('impact');
    buzz(HAPTICS.hit);
  }
  if (kind === 'blocked') cue('wrong');
  if (kind === 'hurt') {
    cue('hurt');
    buzz(HAPTICS.hurt);
  }
  if (kind === 'land') cue('land');
  if (kind === 'finisher') {
    world.setInput(0, 0);
    world.keys?.clear();
    guardianFeedback = 'The last three seals · your correct work stays.';
  }
  if (kind === 'ward') {
    world.setInput(0, 0);
    world.keys?.clear();
    guardianFeedback = 'Read the clue and pick the matching word to break the ward.';
    cue('select');
  }
  if (kind === 'ward-broken') {
    cue('reward');
    buzz(HAPTICS.reward);
    guardianFlash = 'Ward broken! The guardian staggers';
    guardianFlashUntil = performance.now() + 1800;
  }
  if (kind === 'boss-hit' && data?.critical) {
    guardianFlash = 'Critical hit!';
    guardianFlashUntil = performance.now() + 1200;
    buzz(HAPTICS.reward);
  }
  if (kind === 'victory') {
    cue('reward');
    buzz(HAPTICS.reward);
  }
  if (kind === 'special') {
    cue('break');
    buzz(HAPTICS.reward);
    guardianFlash = data.spec.name + '!';
    guardianFlashUntil = performance.now() + data.spec.duration * 1000;
    specialBanner(data.spec);
  }
  if (kind === 'special-hit') {
    cue('impact');
    buzz(HAPTICS.hit);
    if (data.capped) {
      guardianFlash = 'A ward holds back the rest · answer it to break it';
      guardianFlashUntil = performance.now() + 2200;
    }
  }
  if (kind === 'retry') {
    if (state().battle?.tough) {
      const lost = loseLife('knock-out', { arena: true });
      if (!lost || lost === 'out') return;
      toast(
        `Knocked out! ${lives()} ${lives() === 1 ? 'life' : 'lives'} left · the guardian recovers to its last broken ward.`,
      );
    } else toast('Back to safe ground. Guardian damage, English work and coins are saved.');
  }
  if (['boss-hit', 'finisher', 'hurt', 'retry', 'seal', 'victory', 'ward', 'ward-broken', 'special-hit'].includes(kind))
    persist();
}
// A big title card for a special, tinted with the team's element.
function specialBanner(spec) {
  if (typeof document === 'undefined' || typeof document.body?.appendChild !== 'function') return;
  const el = document.createElement('div');
  el.className = `special-banner tier-${spec.tier}`;
  el.dataset.element = partner().element.toLowerCase();
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<span>${spec.name}</span>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove?.(), Math.min(2600, spec.duration * 700));
}
// Elemental Shrine (six-gate areas): before the arena, the student may spend coins on one-use specials (specials.js).
let shrineOpen = false,
  specialBarKey = '';
function newGuardian(e) {
  const b = freshGuardian(unit(), `${e.contentSeed || e.id}:guardian`, { tough: shortPath(e) });
  if (b.tough && e.specials?.length) {
    b.specials = [...e.specials];
    b.specialsUsed = [];
  }
  return b;
}
function shrineHtml() {
  const e = state(),
    p = partner(),
    pts = league.enabled ? arenaPoints(league.snapshot(unit().grade).settings, save.mode, e.area) : null;
  return shrineOverlay({
    team: p.id,
    element: p.element,
    balance: save.wallet?.balance || 0,
    level: journey().level,
    owned: e.specials || [],
    ulti: pts ? { points: pts, grade: unit().grade, team: p.name, icon: ultiIcon() } : null,
  });
}
// The shrine stands on the path at the end of the chase (shrine-stage.js); its tags follow the pedestals on screen.
function shrineForward(e) {
  const side = e.choices?.[chapterCount(e) - 1] || 'left',
    path = chapterPath(chapterCount(e) - 1, side),
    a = path[3],
    b = path[4],
    len = Math.hypot(b.x - a.x, b.z - a.z) || 1;
  return { x: (b.x - a.x) / len, z: (b.z - a.z) / len };
}
function showShrine() {
  if (shrineOpen) return true;
  const e = state();
  if (!shortPath(e) || e.battle || !guardianReady(journey(), e)) return false;
  screen = 'play';
  task = null;
  resultCard = false;
  closeModal();
  world.setInput?.(0, 0);
  document.body.classList.add('in-shrine', 'playing');
  world.setView?.(false);
  world.paused = false;
  world.showShrine?.({
    team: partner().id,
    at: endPoint(e),
    forward: shrineForward(e),
    owned: e.specials || [],
    balance: save.wallet?.balance || 0,
  });
  shrineOpen = true;
  renderShrine();
  cue('chest');
  return true;
}
function renderShrine() {
  const layer = $('#shrine-layer');
  if (layer) layer.innerHTML = shrineOpen ? shrineHtml() : '';
  world.shrineStage?.setState({ owned: state().specials || [], balance: save.wallet?.balance || 0 });
  placeShrineTags();
}
function placeShrineTags() {
  if (!shrineOpen || !world.shrineStage || typeof document === 'undefined') return;
  const layer = $('#shrine-layer');
  layer?.classList?.add('placed');
  for (const tag of layer?.querySelectorAll?.('.shrine-tag') || []) {
    const p = world.shrineStage.labelPoint(Number(tag.dataset.slot));
    if (p) {
      tag.style.left = p.x + 'px';
      tag.style.top = p.y + 'px';
    }
  }
}
function closeShrine() {
  shrineOpen = false;
  document.body.classList.remove('in-shrine');
  const layer = $('#shrine-layer');
  if (layer) {
    layer.innerHTML = '';
    layer.classList?.remove('placed');
  }
  world.hideShrine?.();
}
function buyShrineSpecial(id) {
  const e = state(),
    r = buySpecial(save, e, id, partner().id);
  if (!r.ok) {
    cue('wrong');
    if (r.reason === 'coins') toast(`${r.need} more coins needed.`);
    return;
  }
  cue('reward');
  buzz(HAPTICS.reward);
  persist();
  world.shrineStage?.celebrate(id);
  renderShrine();
}
function useSpecial(id) {
  const b = state().battle,
    combat = world.guardianStage?.combat;
  if (!b || !combat || modal || world.paused) return false;
  if (!combat.special(id, journey().level)) return false;
  persist();
  return true;
}
// Every new six-gate guardian fight is reached through the shrine on the path; Enter the arena skips it.
function showBattle({ skipShrine = false } = {}) {
  const e = state();
  if (!guardianReady(journey(), e)) return false;
  if (!skipShrine && !e.battle && showShrine()) return true;
  // Resume an old, partially solved guardian board exactly as saved. New fights use live combat.
  if (e.battle && !e.battle.version && (e.active || e.battle.round > 0)) return showLegacyBattle();
  const resume = e.battle?.version === 2;
  e.battle = resume ? e.battle : newGuardian(e);
  e.active = null;
  task = null;
  resultCard = false;
  pendingCompletion = null;
  guardianFeedback = '';
  screen = 'play';
  world.hideMechanism();
  world.setView(false, null, true);
  world.paused = false;
  cue('impact');
  gameAudio.music.update('guardian', 1);
  if (shrineOpen) closeShrine();
  runProgress(null);
  powerChips(null);
  speedLines(0);
  world.startGuardian(e.battle, { mode: save.mode, partner: partner().id, event: guardianEvent, resume });
  renderGuardian();
  guardianFrame();
  persist();
  gestureHint('arena', 'Swipe up anywhere to jump · tap anywhere to cast at the open core', 6500);
  joystickLesson(
    'arena',
    '<b>Drag the joystick</b> to move around the arena. Walk out of <b>amber and red</b> zones before the guardian strikes.',
    1800,
  );
  return true;
}
function guardianFrame() {
  const b = state().battle;
  if (b?.version !== 2) return;
  gameAudio.reading = b.phase === 'finisher' || b.phase === 'ward';
  world.paused = modal || locked || document.hidden || screen !== 'play' || tutorialOpen;
  world.measurementPhase = world.paused ? null : 'explore';
  const flash = performance.now() < guardianFlashUntil ? guardianFlash : '',
    key = [b.phase, b.kind, b.hp, b.bossHp, b.stagger, flash, lives()].join(':');
  if (key !== guardianHudKey) {
    guardianHudKey = key;
    $('#guardian-status').innerHTML = guardianHud(b, AREAS[state().area].guardian, flash, b.tough ? lives() : null);
  }
  const final = ['ward', 'finisher', 'victory'].includes(b.phase);
  document.body.classList.toggle('in-guardian-finisher', final);
  {
    const busy = !!world.guardianStage?.combat?.channel,
      bar = $('#special-bar'),
      k = specialKey(b);
    if (bar) {
      if (k !== specialBarKey) {
        specialBarKey = k;
        bar.innerHTML = specialBar(b, { busy });
      } else
        for (const btn of bar.querySelectorAll?.('.special-button') || [])
          btn.disabled = !specialReady(b, btn.dataset.id, busy);
    }
  }
  const sealKey = [b.phase, b.finishStep, b.wardStep, b.finishMistakes].join(':');
  if (sealKey !== guardianSealKey) {
    guardianSealKey = sealKey;
    $('#task-layer').innerHTML =
      b.phase === 'finisher' || b.phase === 'ward' ? guardianFinisher(b, guardianFeedback) : '';
  }
  const combat = world.guardianStage.combat,
    attack = $('#attack-button'),
    jump = $('#jump-button');
  if (attack) {
    attack.disabled = final || b.phase === 'intro' || !!combat.cast || combat.cooldown > 0;
    attack.classList.toggle('opening', b.phase === 'recovery');
  }
  if (jump) jump.disabled = final || b.phase === 'intro' || b.player.y > 0 || b.player.vy > 0;
  gameAudio.frame({
    footfallSerial: world.proceduralMotion?.footfallSerial ?? world.locomotion?.footfallSerial ?? null,
    partner: partner().id,
    position: b.player,
    height: world.nav.height,
    moving: Math.hypot(world.guardianStage.input?.().x || 0, world.guardianStage.input?.().z || 0) > 0.1,
    grounded: b.player.y === 0,
    area: save.area,
    active: !save.muted && !world.paused,
    scene: world.paused ? null : 'guardian',
    intensity: 1,
  });
  if (b.phase === 'victory' && b.timer >= 2.6 && !modal) {
    const won = state(),
      info = leagueInfo(won);
    if (winGuardian(journey(), state())) {
      persist();
      if (b.tough) claimUlti(won.id, info);
      const p = state().pendingEvolution;
      void evolution(journey().completed, { from: p.from, to: p.to, path: true });
    }
    return;
  }
  if (Date.now() - lastSnapshot > 1000) {
    lastSnapshot = Date.now();
    persist();
  }
}
function guardianAnswer(index, step) {
  const b = state().battle,
    current = b && guardianQuestion(b);
  if (
    modal ||
    locked ||
    screen !== 'play' ||
    !current ||
    step !== current.step ||
    !Number.isInteger(index) ||
    index < 0 ||
    index > 2
  )
    return;
  const q = current.q,
    result = world.guardianStage.combat.answer(q.options[index]),
    j = journey();
  if (result.mistake) {
    j.stats.mistakes++;
    recordAnswer(j, q.id, false);
    const focus = q.kind === 'question' ? questionFocus(q.prompt) : null;
    guardianFeedback = focus
      ? `${focus.word.replace(/^./, s => s.toUpperCase())} → ${focus.meaning} (${focus.tr}). Your broken seals stay saved.`
      : current.ward
        ? 'Not quite. Read the clue again and compare all three words.'
        : 'Read the inscription and compare all three answers. Broken seals stay saved.';
    cue('wrong');
    buzz(HAPTICS.wrong);
  }
  if (result.accepted) {
    j.stats.correct++;
    recordAnswer(j, q.id, true);
    guardianFeedback = result.ward
      ? ''
      : result.complete
        ? 'All three seals broken!'
        : 'Seal broken · next inscription';
    cue('correct');
    buzz(HAPTICS.correct);
  }
  persist();
  guardianFrame();
}
function showLegacyBattle() {
  const route = state();
  if (!guardianReady(journey(), route)) return false;
  world.hideMechanism();
  document.body.classList.add('in-task');
  const e = state();
  e.battle ??= { hp: 100, round: 0, action: null };
  world.setView(false, null, true);
  screen = 'play';
  world.paused = true;
  $('#ui').innerHTML = '';
  if (e.active) {
    task = e.active;
    openTaskView();
    return;
  }
  document.body.classList.add('guardian-choice');
  resultCard = true;
  const b = e.battle,
    pattern = ['charge', 'guard', 'recover'][b.round];
  $('#task-layer').innerHTML =
    `<div class="guardian-status"><div class="eyebrow">${AREAS[e.area].guardian} · ${b.round + 1} / 3 · Strength ${b.hp}/100</div><h2>${pattern === 'charge' ? 'A charge gathers.' : pattern === 'guard' ? 'Stone armour rises.' : 'The guardian pauses.'}</h2><p>Your strength: ${b.hp} / 100. Prepare a move through English. Reading stays untimed.</p></div><div class="guardian-actions"><div class="battle-choice">${[
      ['attack', 'Strike', 'sentence', 'Exploit an opening'],
      ['guard', 'Guard', 'answer', 'Absorb a charge'],
      ['disrupt', 'Disrupt', 'translation', 'Break its armour'],
    ]
      .map(
        ([id, name, type, desc]) =>
          `<button class="ability" data-do="ability" data-action="${id}" data-type="${type}"><strong>${name}</strong><small>${desc}</small><small>${activity(type).label}</small></button>`,
      )
      .join('')}</div><button class="text-button" data-do="retreat">Return to sanctuary</button></div>`;
  persist();
}
function ability(action, type) {
  const e = state();
  if (!e.battle || e.battle.version === 2) return;
  e.battle.action = action;
  e.active = makeTask(
    unit(),
    type,
    `${e.id}:battle:${e.battle.round}`,
    `${e.contentSeed || e.id}:battle:${e.battle.round}`,
    taskPriority(),
    journey().level,
    journey().practice,
  );
  task = e.active;
  resultCard = false;
  openTaskView();
  persist();
}
function completeBattleTask() {
  const e = state(),
    b = e.battle,
    perfect = ['guard', 'disrupt', 'attack'][b.round] === b.action;
  b.hp = Math.max(1, b.hp - (perfect ? 0 : save.mode === 'challenge' ? 18 : 8));
  b.round++;
  e.active = null;
  task = null;
  world.hit();
  persist();
  if (b.hp <= 0) {
    e.battle = null;
    persist();
    queueCompletion('trail', 'Your training and checkpoints are safe.');
    return;
  }
  if (b.round === 3) {
    if (winGuardian(journey(), e)) {
      persist();
      const p = e.pendingEvolution;
      void evolution(journey().completed, { from: p.from, to: p.to, path: true });
    }
    return;
  }
  queueCompletion(
    'guardian',
    `${perfect ? 'A perfectly read move.' : 'Your move connects.'} ${b.hp} strength remains.`,
  );
}
function playEvolutionSound() {
  evoStop?.();
  evoStop = null;
  if (save.muted) return;
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    audioContext.resume();
    evoStop = evolutionAudio(audioContext, world.evolution?.time || 0, { element: partner().element });
  } catch {}
}
async function evolution(final = false, options = {}) {
  document.body.classList.remove('opening');
  closeModal();
  const to = options.to ?? (options.demo ? Math.min(10, journey().level + 1) : journey().level),
    from = options.from ?? (final ? to : options.demo ? journey().level : Math.max(0, to - 1));
  evoState = { from, to, final, demo: !!options.demo, path: !!options.path, skip: false };
  const current = evoState;
  screen = 'evolution';
  task = null;
  resultCard = false;
  locked = true;
  modal = true;
  $('#ui').innerHTML = '';
  $('#task-layer').innerHTML = '';
  document.body.classList.remove('in-task', 'guardian-choice', 'in-guardian', 'in-guardian-finisher');
  document.body.classList.add('cinematic');
  world.setView(false);
  world.paused = true;
  $('#modal-layer').innerHTML =
    `<section class="evo-cinematic" data-element="${esc(String(partner().element || 'air').toLowerCase())}"><div class="evo-top"><span>${current.demo ? 'TRANSFORMATION PREVIEW' : 'SOLMAXIMA · ' + partner().awakening.toUpperCase()}</span><div><button data-do="evo-sound" id="evo-sound">${save.muted ? 'Sound off' : 'Sound on'}</button><button data-do="evo-skip" id="evo-skip">Skip</button></div></div><div class="evo-loading" id="evo-loading">${partner().loading}</div><div class="evo-banner" id="evo-banner" aria-hidden="true"></div><div class="evo-caption" id="evo-caption" role="status"></div><div class="evo-finish hidden" id="evo-finish"></div></section>`;
  persist();
  try {
    if (!save.muted) {
      audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
      audioContext.resume();
      gameAudio.attach(audioContext);
      gameAudio.music.update('evolution', 0);
    }
    await world.playEvolution(from, to, {
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches || graphics.effects === 'low',
      onFrame: f => {
        if (current !== evoState) return;
        if (!current.started) {
          current.started = true;
          $('#evo-loading').classList.add('hidden');
          playEvolutionSound();
          if (current.skip) queueMicrotask(() => world.skipEvolution());
        }
        if (current.phase !== f.phase) {
          current.phase = f.phase;
          $('#evo-caption').textContent = {
            spark: 'A rune circle wakes.',
            gather: partner().gather,
            orbit: 'A chrysalis forms. Your knowledge becomes strength.',
            transform: final ? 'Your journey becomes legend.' : 'It breaks open!',
            reveal: '',
          }[f.phase];
        }
        // The reveal banner: the moment the new form appears.
        if (f.newVisible && !current.banner) {
          current.banner = true;
          const b = $('#evo-banner');
          if (b) {
            b.innerHTML = `<small>${esc(partner().name)} · ${esc(partner().element)}</small><b>LvL ${to}</b><span>${final ? 'LEGEND' : 'AWAKENED'}</span>`;
            b.classList?.add('show');
          }
        }
      },
    });
    evoStop?.();
    locked = false;
    $('#evo-skip').classList.add('hidden');
    $('#evo-caption').textContent = `Level ${to} awakened · ${save.nickname}`;
    current.returnAt = Date.now() + 450;
  } catch (e) {
    console.error(e);
    evoStop?.();
    world.endEvolution(false);
    current.failed = true;
    locked = false;
    $('#evo-loading').textContent = 'Your progress is saved. The new model could not load.';
    $('#evo-caption').innerHTML = '<button class="primary" data-do="evo-continue">Return to camp</button>';
  }
}
async function finishEvolution() {
  if (locked || !evoState) return;
  const old = evoState;
  if (old.path) {
    const e = state();
    if (e.pendingEvolution?.to === old.to) delete e.pendingEvolution;
    persist();
  }
  world.endEvolution(!old.demo && !old.failed);
  evoState = null;
  evoStop?.();
  document.body.classList.remove('cinematic');
  closeModal();
  if (!old.demo) {
    syncWorld();
    if (old.failed) await world.loadForm(journey().level);
    if (!old.failed && state().phase !== 'closed' && (state().index < gateCount(state()) || chestPending(state()))) {
      await enter({ reuseForm: true });
      document.body.classList.add('returning-to-play');
      setTimeout(() => document.body.classList.remove('returning-to-play'), 520);
      persist();
      toast(
        save.area < unlocked(journey())
          ? 'New arena unlocked. Your current expedition is saved; visit camp to choose an arena.'
          : 'New form, same expedition. Your next path is ahead.',
      );
      return;
    }
  }
  home();
  persist();
  performanceMonitor.sample(world, undefined, { force: true, label: 'evolution-finished' });
  warmNextForm();
  if (old.path && old.to === 10) toast('Unit journey complete · Level 10 awakened · all three arenas restored!');
  else if (old.path && state().phase === 'closed') toast(`Level ${old.to} awakened · next arena unlocked.`);
}
function exportSave() {
  persist();
  const a = document.createElement('a'),
    url = URL.createObjectURL(new Blob([encode(save)], { type: 'application/json' }));
  a.href = url;
  a.download = 'solMaxima-Journey.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function importSave() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async () => {
    try {
      const file = input.files[0];
      if (!file || file.size > 10000000) throw Error('size');
      let data = JSON.parse(await file.text());
      if (!validSave(data, units)) throw Error('invalid');
      if (RUNNER && sixGates && earlierBuild(data)) {
        toast('This backup is from an earlier build with 20-gate areas, which this version no longer loads.');
        return;
      }
      if (!(await prepareLesson(data.selected))) return;
      save = upgradePartners(upgradeTraversalSave(data));
      closeModal();
      syncWorld();
      await world.loadForm(journey().level);
      nav.restore(state().position);
      nav.heading = state().heading;
      home();
      persist();
      toast('All teams and checkpoints restored.');
    } catch {
      toast('This is not a valid solMaxima journey backup.');
    }
  };
  input.click();
}
async function act(event) {
  const button = event.target.closest('[data-do]');
  if (!button || button.disabled) return;
  const d = button.dataset;
  {
    const r = button.getBoundingClientRect?.();
    if (r) lastTap = { x: r.left + r.width / 2, y: r.top + r.height / 2, el: button };
  }
  if (screen === 'evolution' && !['evo-sound', 'evo-skip', 'evo-replay', 'evo-continue'].includes(d.do)) return;
  if (locked && !['evo-sound', 'evo-skip'].includes(d.do)) return;
  switch (d.do) {
    case 'enter':
      await enter();
      break;
    case 'next-area':
      if (state().phase === 'closed' && save.area < unlocked(journey())) {
        save.area++;
        syncWorld();
        await enter();
        persist();
      }
      break;
    case 'camp':
      persist();
      closeModal();
      home();
      break;
    case 'install':
      if (await promptInstall()) toast('solMaxima is on your home screen.');
      else if (screen === 'home') renderHome();
      break;
    case 'play-mode':
      if (['runner', 'classic'].includes(d.value)) {
        persist();
        switchPlayMode(d.value);
      }
      break;
    case 'fullscreen':
      await toggleFullscreen();
      closeModal();
      break;
    case 'help':
      help();
      break;
    case 'journal':
      journal();
      break;
    case 'trails':
      trailShop();
      break;
    case 'close-modal':
      closeModal();
      break;
    case 'buy-special':
      buyShrineSpecial(d.id);
      break;
    case 'enter-arena':
      closeShrine();
      showBattle({ skipShrine: true });
      break;
    case 'use-special':
      useSpecial(d.id);
      break;
    case 'lessons':
      lessons();
      break;
    case 'grade':
      lessons(Number(d.grade));
      break;
    case 'device-export': {
      const report = deviceReport(world, graphics, deviceChecks),
        blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }),
        url = URL.createObjectURL(blob),
        a = document.createElement('a');
      a.href = url;
      a.download = 'solMaxima-device-report.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      break;
    }
    case 'journal-tab':
      journal(d.tab);
      break;
    case 'controls':
      controlsMenu();
      break;
    case 'controls-hand':
      setControls({ left: !controlPrefs.left });
      controlsMenu();
      break;
    case 'controls-buttons':
      setControls({ buttons: !controlPrefs.buttons });
      controlsMenu();
      break;
    case 'controls-tutorial':
      closeModal();
      startTutorial();
      break;
    case 'graphics':
      graphicsMenu();
      break;
    case 'haptics':
      save.haptics = save.haptics === false;
      persist();
      if (save.haptics) buzz(HAPTICS.correct);
      journal();
      break;
    case 'graphics-preset':
      if (Object.hasOwn(QUALITY, d.value)) {
        graphics = graphicsSettings({ preset: d.value });
        saveGraphics();
      }
      break;
    case 'graphics-resolution':
      graphics = graphicsSettings({ ...graphics, resolution: Number(d.value) });
      saveGraphics();
      break;
    case 'graphics-shadows':
      graphics.shadows = !graphics.shadows;
      saveGraphics();
      break;
    case 'graphics-effects':
      graphics = graphicsSettings({ ...graphics, effects: d.value });
      saveGraphics();
      break;
    case 'graphics-adaptive':
      graphics.adaptive = !graphics.adaptive;
      saveGraphics();
      break;
    case 'graphics-reset':
      world.frameMetrics?.reset();
      for (const key of Object.keys(deviceChecks)) delete deviceChecks[key];
      graphicsMenu();
      break;
    case 'partner':
      await selectPartner(d.partner);
      break;
    case 'unit': {
      const target = units.find(u => u.id === d.unit);
      if (!target || !(await prepareLesson(target.id))) break;
      persist();
      const previous = { selected: save.selected, grade: save.grade, area: save.area },
        hadJourney = !!save.journeys[target.id],
        changed = save.selected !== target.id;
      save.selected = target.id;
      save.grade = target.grade;
      onboardGrade = target.grade;
      if (changed) save.area = unlocked(journey());
      closeModal();
      syncWorld();
      loadingNotice('Loading your creature…');
      locked = true;
      try {
        await world.loadForm(journey().level);
        home();
        persist();
        warmNextForm();
      } catch (error) {
        Object.assign(save, previous);
        if (!hadJourney) delete save.journeys[target.id];
        await lessonLibrary.select(previous.selected);
        syncWorld();
        home();
        persist();
        toast('Your creature could not load. Your previous lesson is ready to continue.');
      } finally {
        locked = false;
        clearLoading();
      }
      break;
    }
    case 'area':
      if (![0, 1, 2].includes(Number(d.area))) break;
      if (Number(d.area) > unlocked(journey())) {
        toast('Defeat the previous guardian to unlock this arena.');
        break;
      }
      persist();
      save.area = Number(d.area);
      syncWorld();
      renderHome();
      persist();
      break;
    case 'mode':
      if (!['relaxed', 'challenge'].includes(d.mode)) break;
      save.mode = d.mode;
      configureTravel();
      nav.restore(state().position);
      world.refresh();
      persist();
      renderHome();
      break;
    case 'branch':
      branch(d.side);
      break;
    case 'follow': {
      const c = chestPending(state()) ? world.chestPoint : null;
      if (c) nav.go(c.x, c.z + 0.6);
      else nav.approach();
      break;
    }
    case 'next-run': {
      closeModal();
      const fresh = state();
      if (fresh !== nav.state) {
        syncWorld();
        world.setView(false);
      }
      world.refresh();
      renderPlay();
      persist();
      toast(chestPending(fresh) ? 'Open your reward chest.' : 'Rush expedition · choose a coin trail!');
      break;
    }
    case 'evolve-now':
      closeModal();
      await evolution(false);
      break;
    case 'wordex': {
      const j = journey(),
        u = unit(),
        words = wordex(j, u);
      showModal(
        'Wordex',
        wordexMarkup({
          words,
          found: words.filter(w => w.box > 0).length,
          mastered: words.filter(w => w.box >= 3).length,
          total: words.length,
          unitTitle: u.title,
        }),
      );
      break;
    }
    case 'say':
      speak(d.text);
      break;
    case 'shop-tab':
      shopTab = d.tab;
      trailShop();
      break;
    case 'cosmetic': {
      const r = useCosmetic(save, d.item);
      if (r.ok) {
        world.setCosmetics?.({ hat: save.wallet.hat, coat: save.wallet.coat, camp: save.wallet.camp });
        if (r.bought) {
          cue('reward');
          buzz(HAPTICS.reward);
        }
        persist();
        trailShop();
      } else toast(r.short ? `Collect ${r.short} more coins for this look.` : 'This look is not available.');
      break;
    }
    case 'partner-step': {
      const i = PARTNERS.findIndex(p => p.id === partner().id);
      await selectPartner(PARTNERS[(i + Number(d.step) + PARTNERS.length) % PARTNERS.length].id);
      break;
    }
    case 'onboard-grade': {
      const first = units.find(u => u.grade === Number(d.grade));
      if (!first || !(await prepareLesson(first.id))) break;
      onboardGrade = first.grade;
      save.selected = first.id;
      save.grade = first.grade;
      save.area = 0;
      syncWorld();
      await world.loadForm(journey().level);
      renderOnboarding();
      persist();
      break;
    }
    case 'go': {
      const name =
        ($('#onboard-name')?.value || onboardName || save.nickname || '').trim().slice(0, 24) || partner().name;
      save.nickname = name;
      save.partnerNames ??= {};
      save.partnerNames[partner().id] = name;
      save.grade = unit().grade;
      onboarding = false;
      onboardName = null;
      document.body.classList.remove('onboarding', 'opening');
      await quickStart();
      break;
    }
    case 'interact':
      if (nav.nearest()) interact(nav.nearest().id);
      break;
    case 'boost':
      if (!task && !modal && !resultCard) {
        if (nav.requestBoost?.()) {
          cue('reward');
          buzz(HAPTICS.correct);
        } else toast('Boost on an open coin trail. Collect coins to refill it.');
      }
      break;
    case 'jump':
      world.jump();
      break;
    case 'attack':
      world.attack?.();
      break;
    case 'close-task':
      if (state().battle) {
        persist();
        await home();
        break;
      }
      world.hideMechanism();
      document.body.classList.remove('in-task');
      persist();
      task = null;
      world.setView(false);
      resultCard = false;
      autoOpenAfter = Date.now() + 1500;
      renderPlay();
      break;
    case 'pair-left':
      if (task?.pairs?.[Number(d.index)]?.spoken) speak(task.pairs[Number(d.index)].spoken);
      else if (task && !task.matched.includes(Number(d.index))) readAloud(pieceLine(task, 'left', Number(d.index)));
      submit({ kind: 'left', index: Number(d.index) });
      break;
    case 'pair-right':
      if (task && task.selected == null && !task.matched.includes(Number(d.index)))
        readAloud(pieceLine(task, 'right', Number(d.index)));
      submit({ kind: 'right', index: Number(d.index) });
      break;
    case 'block':
      submit({ kind: 'block', index: Number(d.index) });
      break;
    case 'find':
      submit({ kind: 'find', text: d.text, ...(d.index !== undefined ? { index: Number(d.index) } : {}) });
      break;
    case 'choice':
      submit({ kind: 'choice', text: d.text });
      break;
    case 'pick':
      submit({ kind: 'pick', text: d.text });
      break;
    case 'confirm':
      submit({ kind: 'confirm' });
      break;
    case 'inspect-task':
      if (task) {
        languageFeedback = null;
        world.mechanism.inspect = !world.mechanism.inspect;
        feedbackText = world.mechanism.inspect
          ? 'Select a beginning or question. It will open beside all three answers.'
          : 'All pairs are visible.';
        renderTask();
      }
      break;
    case 'task-tools':
      showModal(
        'Task tools',
        `<p>Your accepted work is saved.</p><button class="secondary wide" data-do="hud-sound">${save.muted ? 'Enable sound' : 'Mute sound'}</button><button class="secondary wide" data-do="music">Music: ${save.music === false ? 'off' : 'on'}</button><button class="secondary wide" data-do="journal">Journey journal</button><button class="secondary wide" data-do="help">How to play</button>`,
      );
      break;
    case 'hud-sound':
      save.muted = !save.muted;
      persist();
      soundUpdate();
      closeModal();
      break;
    case 'read-aloud':
      save.readAloud = save.readAloud === false;
      persist();
      if (save.readAloud) readAloud('Hello! I will read the English for you.');
      if (screen === 'play' && task) closeModal();
      else journal();
      break;
    case 'music':
      save.music = save.music === false;
      persist();
      soundUpdate();
      if (save.music) cue('select');
      if (screen === 'play' && task) closeModal();
      else journal();
      break;
    case 'listen':
      speak(d.text);
      break;
    case 'speech-text':
      showSpeech();
      break;
    case 'hint':
      if (!task) break;
      if (save.mode === 'challenge' && !task.mistakes) {
        languageFeedback = null;
        feedbackText = 'Try independently first. A hint unlocks after a correction.';
        renderTask();
        break;
      }
      task.hints++;
      journey().stats.hints++;
      languageFeedback = languageCoach.hint(task, unit());
      feedbackText = '';
      persist();
      renderTask();
      break;
    case 'return-trail':
      returnTrail();
      break;
    case 'next-expedition':
      newExpedition();
      break;
    case 'guardian':
      if (!guardianReady(journey(), state())) break;
      closeModal();
      if (screen !== 'play' || !document.body.classList.contains('playing')) {
        if (!state().battle && shortPath(state())) {
          await enter();
          if (!showShrine()) showBattle();
          break;
        }
        state().battle ??= newGuardian(state());
        await enter();
      } else if (!showShrine()) showBattle();
      break;
    case 'guardian-answer':
      guardianAnswer(Number(d.index), Number(d.step));
      break;
    case 'ability':
      if (state().battle && !state().battle.version) ability(d.action, d.type);
      break;
    case 'retreat':
      persist();
      await home();
      break;
    case 'equip-trail':
      if (equipTrail(save, d.trail)) {
        shopTab = 'trail';
        world.trailColor = TRAILS.find(t => t.id === save.wallet.equipped).color;
        persist();
        trailShop();
      } else toast('Collect more coins to unlock this wind trail.');
      break;
    case 'export':
      exportSave();
      break;
    case 'import':
      importSave();
      break;
    case 'rename':
      showModal(
        'Name your creature',
        `<input class="input" id="nickname" maxlength="24" value="${esc(save.nickname)}" aria-label="Creature nickname"><button class="primary wide" data-do="save-name">Save name →</button>`,
      );
      break;
    case 'save-name':
      save.nickname = $('#nickname').value.trim().slice(0, 24) || partner().name;
      save.partnerNames ??= {};
      save.partnerNames[partner().id] = save.nickname;
      persist();
      closeModal();
      renderHome();
      break;
    case 'restart':
      showModal(
        'Restart this unit?',
        `<p>Start ${esc(partner().name)}’s ${esc(unit().title)} journey again at Level 0. Other teams and lessons remain saved.</p><button class="primary wide" data-do="confirm-restart">Restart this journey →</button>`,
      );
      break;
    case 'confirm-restart':
      save.journeys[save.selected] = restart(journey());
      save.area = 0;
      closeModal();
      syncWorld();
      await world.loadForm(0);
      home();
      persist();
      break;
    case 'evolution-preview':
      await evolution(false, { demo: true });
      break;
    case 'evolution-replay-earned':
      await evolution(false);
      break;
    case 'evo-skip':
      evoState.skip = true;
      world.skipEvolution();
      break;
    case 'evo-sound':
      save.muted = !save.muted;
      persist();
      soundUpdate();
      $('#evo-sound').textContent = save.muted ? 'Sound off' : 'Sound on';
      playEvolutionSound();
      break;
    case 'evo-replay': {
      const old = { ...evoState };
      world.endEvolution(!old.demo && !old.failed);
      await evolution(old.final, old);
      break;
    }
    case 'evo-continue':
      await finishEvolution();
      break;
  }
}
document.addEventListener('pointerdown', unlockAudio, { passive: true });
document.addEventListener('keydown', unlockAudio);
document.addEventListener('change', e => {
  const id = e.target?.dataset?.deviceCheck;
  if (VISUAL_CHECKS.some(([key]) => key === id)) deviceChecks[id] = e.target.value;
});
document.addEventListener('click', e =>
  act(e).catch(error => {
    console.error(error);
    locked = false;
    toast('This action was interrupted. Your last saved checkpoint is safe.');
  }),
);
$('#home-button').onclick = () => {
  if (locked || !world || screen === 'evolution') return;
  persist();
  closeModal();
  home();
};
$('#journal-button').onclick = () => {
  if (!locked && screen !== 'evolution') journal();
};
$('#sound-button').onclick = () => {
  save.muted = !save.muted;
  persist();
  soundUpdate();
  tone();
};
document.addEventListener('keydown', e => {
  if (world?.runtimePaused) return;
  if (e.key === 'Tab' && modal) {
    const dialog = $('.modal'),
      nodes = dialog
        ? [...dialog.querySelectorAll('button:not(:disabled),a[href],input,select,textarea,[tabindex="0"]')].filter(
            el => el.getClientRects().length,
          )
        : [];
    if (nodes.length) {
      const first = nodes[0],
        last = nodes[nodes.length - 1];
      if (e.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        e.preventDefault();
        first.focus();
      }
    }
  }
  if (e.key === 'Escape' && screen !== 'evolution') {
    if (modal) closeModal();
    else if (task) $('[data-do="close-task"]')?.click();
  }
});
document.addEventListener('contextmenu', e => {
  if (e.target.closest('#world,.world-piece')) e.preventDefault();
});
function leave() {
  voice.stop();
  hideReveal();
  creatureCue(null);
  hideGuideCameo();
  gameAudio.silence();
  gameAudio.music.stop();
  gameAudio.reading = false;
  if (!world) return;
  world.keys?.clear();
  world.setInput(0, 0);
  nav.stop();
  persist();
  window.speechSynthesis?.cancel?.();
  evoStop?.();
  evoStop = null;
}
window.addEventListener('pagehide', leave);
window.addEventListener('beforeunload', () => {
  if (world) persist();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) leave();
});
async function boot() {
  applyControls(controlPrefs);
  league
    .flush()
    .then(results => {
      for (const r of results) {
        const msg = ultiMessage(r, { grade: r.grade, team: r.team || 'your team' });
        if (msg?.good) {
          showUlti(msg);
          break;
        }
      }
    })
    .catch(() => {});
  controls.update();
  registerOffline();
  watchUpdates(showUpdate);
  watchInstall(() => {
    if (screen === 'home') renderHome();
  });
  let openingAssets;
  try {
    loadingNotice('Opening your journey…');
    const data = await fetchJSON('data/lesson-catalog.json', { fetcher: fetch });
    units = data.units;
    lessonLibrary = new LessonLibrary(units, { load: id => fetchJSON(`data/lessons/${id}.json`, { fetcher: fetch }) });
    try {
      onboarding = true;
      let current = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (validSave(current, units)) {
        save = current;
        onboarding = false;
      }
    } catch {
      toast('A fresh trail is ready. You can import a journey backup.');
    }
    if (!(await prepareLesson(save.selected))) throw Error('Lesson loading interrupted');
    loadingNotice('Loading your creature…');
    save = upgradePartners(upgradeTraversalSave(save));
    save.area = Math.min(save.area, unlocked(journey()));
    sixGateSave();
    const e = state();
    nav = new TrailNavigator(e, interact);
    configureTravel();
    nav.setLevel(journey().level);
    nav.restore(e.position);
    nav.heading = e.heading;
    if (typeof TrailWorld.prototype.fetchUncachedForm === 'function') {
      openingAssets = createFormCache((level, id, options) =>
        TrailWorld.prototype.fetchUncachedForm.call({}, level, id, options),
      );
      openingAssets.prefetch(formKey(partner().id, journey().level)).catch(() => {});
      await Promise.resolve();
    }
    world = new TrailWorld($('#world'), interact, nav);
    if (openingAssets) world.formAssets = openingAssets;
    world.partner = partner().id;
    world.elementColor = partner().color;
    world.onFrame = frame;
    world.performanceMonitor = performanceMonitor;
    world.onRecovery = kind => recoveryNotice(world, kind);
    world.onSuspend = () => {
      clearTimeout(prefetchTimer);
      world.formAssets?.cancelIdleLoads(null);
      voice.stop();
      leave();
    };
    world.onResume = () => {
      unlockAudio();
      if (evoState?.started && world.evolution && !world.evolution.resolved) playEvolutionSound();
      warmNextForm();
    };
    if (typeof location !== 'undefined' && /[?&]debug\b/.test(location.search || ''))
      window.maxima = {
        world,
        nav,
        get save() {
          return save;
        },
        state,
        persist,
        renderPlay,
        gameAudio,
        voice,
        get task() {
          return task;
        },
        submit,
        returnTrail,
        interact,
        act,
      };
    if (world.renderer) applyGraphics(world, graphics, typeof devicePixelRatio === 'number' ? devicePixelRatio : 1);
    await world.loadForm(journey().level);
    await home();
    performanceMonitor.markReady();
    if (state().pendingEvolution) {
      const p = state().pendingEvolution;
      await evolution(!!p.boss && journey().completed, { from: p.from, to: p.to, path: true });
    }
    soundUpdate();
    persist();
    $('#load-note').classList.add('hidden');
    warmNextForm();
  } catch (error) {
    console.error(error);
    world?.dispose?.();
    openingAssets?.close();
    $('#load-note').classList.add('hidden');
    $('#ui').innerHTML =
      '<section class="error-box"><div class="eyebrow">SOLMAXIMA</div><h1>Your journey could not open.</h1><p>Check your connection and retry. If loading still fails, use a current browser with graphics acceleration enabled.</p><p>Your saved journeys are preserved on this device.</p><button class="primary" onclick="location.reload()">Retry</button></section>';
  }
}
boot();
