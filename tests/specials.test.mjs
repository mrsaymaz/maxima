import{test}from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
import*as T from'../src/vendor/three.module.min.js';
import{SPECIALS,SPECIAL_PRICES,specialsFor,specialDamage,buySpecial,special,validSpecialList}from'../src/specials.js';
import{SpecialFX,SPECIAL_FX_IDS}from'../src/special-fx.js';import{specialIcon}from'../src/special-icons.js';import{shrineMarkup,specialBar}from'../src/specials-ui.js';
import{freshGuardian,GuardianCombat,validGuardian,guardianQuestion,BOSS}from'../src/guardian-combat.js';
const u=JSON.parse(fs.readFileSync('content/data/expedition-language.json')).units[0];
const TEAMS=['gryffindor','ravenclaw','hufflepuff','slytherin'];
const fight=(team,level=0,owned=specialsFor(team).map(s=>s.id))=>{const b=freshGuardian(u,'sp-'+team,{tough:true});b.specials=owned;b.specialsUsed=[];const events=[];const c=new GuardianCombat(b,{area:0,partner:team,event:(k,d)=>events.push([k,d])});b.phase='windup';b.timer=0;return{b,c,events};};
const run=(c,s)=>{for(let t=0;t<s;t+=.016)c.step(.016,{x:0,z:0});};

test('three specials per team (twelve in all) at 60, 120 and 200 coins, each with its own icon and animation',()=>{
 assert.equal(SPECIALS.length,12);assert.deepEqual(SPECIAL_PRICES,[60,120,200]);for(const team of TEAMS){const list=specialsFor(team);assert.deepEqual(list.map(s=>s.price),[60,120,200],team);assert.deepEqual(list.map(s=>s.tier),[1,2,3]);}
 assert.equal(new Set(SPECIALS.map(s=>s.name)).size,12);assert.deepEqual([...SPECIAL_FX_IDS].sort(),SPECIALS.map(s=>s.id).sort());for(const s of SPECIALS)assert.match(specialIcon(s.id),/<path/,s.id);
});
test('a special grows with Level: power × (1 + 0.1 × Level)',()=>{const meteor=special('meteor-storm');assert.equal(specialDamage(meteor,0),20);assert.equal(specialDamage(meteor,3),26);assert.equal(specialDamage(meteor,10),40);assert.equal(specialDamage(special('fire-pillars'),5),14);});
test('buying takes coins from the wallet, one of each, only for the student\'s own team, never mid-fight',()=>{const save={wallet:{balance:250,total:400}},e={};
 assert.deepEqual(buySpecial(save,e,'ice-spears','gryffindor'),{ok:false,reason:'unavailable'});assert.ok(buySpecial(save,e,'fire-pillars','gryffindor').ok);assert.equal(save.wallet.balance,190);assert.equal(save.wallet.total,400,'lifetime coins are unchanged');
 assert.equal(buySpecial(save,e,'fire-pillars','gryffindor').reason,'owned');assert.ok(buySpecial(save,e,'flame-prison','gryffindor').ok);assert.deepEqual(buySpecial(save,e,'meteor-storm','gryffindor'),{ok:false,reason:'coins',need:130});
 assert.deepEqual(e.specials,['fire-pillars','flame-prison']);assert.ok(validSpecialList(e.specials));assert.ok(!validSpecialList(['fire-pillars','ice-spears']),'one team only');e.battle={};assert.equal(buySpecial({wallet:{balance:999}},e,'meteor-storm','gryffindor').reason,'unavailable');});
test('a special holds the guardian while it plays, lands at its impact moment, and works only once',()=>{const{b,c,events}=fight('gryffindor',0);const hp=b.bossHp,timer=b.timer;
 assert.ok(c.special('fire-pillars',0));assert.equal(c.special('flame-prison',0),false,'one at a time');run(c,1.0);assert.equal(b.bossHp,hp,'no damage before the impact');assert.equal(b.timer,timer,'the guardian is held');assert.ok(b.invulnerable>0,'the creature is safe meanwhile');
 run(c,.2);assert.equal(b.bossHp,hp-9);assert.deepEqual(b.specialsUsed,['fire-pillars']);assert.equal(b.phase,'recovery','the core opens after the special');assert.ok(validGuardian(b));run(c,2);
 assert.equal(c.special('fire-pillars',0),false,'one use');assert.ok(events.some(e=>e[0]==='special')&&events.some(e=>e[0]==='special-hit'));});
test('a binding special staggers the guardian, so the next cast is a critical hit',()=>{const{b,c}=fight('slytherin',0);c.special('root-bind',0);run(c,1.6);assert.equal(b.stagger,true);assert.equal(b.phase,'recovery');const before=b.bossHp;c.hitBoss();assert.equal(before-b.bossHp,6,'critical');});
test('specials stop at each English ward: even all three at Level 10 leave most of the fight to casts and answers',()=>{for(const team of TEAMS){const{b,c,events}=fight(team,10);
 for(const s of specialsFor(team)){if(b.phase==='ward')c.answer(guardianQuestion(b).q.answer);b.phase='windup';assert.ok(c.special(s.id,10),s.id);run(c,s.duration+.1);}
 assert.ok(events.some(e=>e[0]==='special-hit'&&e[1].capped),'a ward held one back');assert.ok(b.bossHp>=60,`${team}: ${b.bossHp}% left`);assert.notEqual(b.phase,'victory');assert.ok(validGuardian(b));}});
test('saves keep bought and used specials; classic guardians, unknown or reused specials are rejected',()=>{const{b,c}=fight('ravenclaw',2);c.special('ice-spears',2);run(c,1.3);const copy=JSON.parse(JSON.stringify(b));assert.ok(validGuardian(copy));
 assert.ok(!validGuardian({...copy,specialsUsed:['ice-spears','ice-spears']}));assert.ok(!validGuardian({...copy,specials:['ice-spears','made-up']}));const plain=freshGuardian(u,'p');plain.specials=['ice-spears'];assert.ok(!validGuardian(plain),'only the six-gate guardian takes specials');});
test('every one of the twelve animations plays through, lifts or shakes where it should, and cleans up after itself',()=>{const scene=new T.Scene();
 for(const s of SPECIALS)for(const effects of['low','high']){const fx=new SpecialFX(scene);fx.play(s,{x:0,y:0,z:5.8},BOSS,{effects});let shake=0,lift=0,objects=0;for(let t=0;t<s.duration+.4;t+=1/30){fx.update(1/30);shake=Math.max(shake,fx.shake);lift=Math.max(lift,fx.lift);if(Math.abs(t-s.impactAt)<.04){let n=0;fx.root.traverse(()=>n++);objects=n;}}
  assert.ok(shake>.2,`${s.id} shakes the camera`);assert.ok(objects>4,`${s.id} is on screen at impact`);if(['updraft','ancient-grove'].includes(s.id))assert.ok(lift>2.5,`${s.id} lifts the guardian`);assert.equal(fx.playing,false);assert.equal(fx.root.children.filter(c=>!c.isLight).length,0,`${s.id} disposed`);fx.dispose();}
 assert.equal(scene.children.length,0);});
test('the shrine lists the team\'s three specials with prices and Level damage; the arena bar shows bought ones until used',()=>{const html=shrineMarkup({team:'hufflepuff',element:'Air',balance:130,level:3,owned:['thunderbolt']});
 for(const name of['Thunderbolt','Updraft','Tempest'])assert.ok(html.includes(name));assert.match(html,/Ready ✓/);assert.match(html,/data-id="updraft"(?![^>]*disabled)/);assert.match(html,/data-id="tempest" disabled/);assert.match(html,/26% guardian damage/);assert.match(html,/enter-arena/);
 const b={phase:'windup',specials:['thunderbolt','tempest'],specialsUsed:['thunderbolt']};const bar=specialBar(b);assert.equal(bar.match(/special-button/g).length,2);assert.match(bar,/used" data-do="use-special" data-id="thunderbolt" disabled/);assert.match(specialBar({...b,phase:'ward'}),/data-id="tempest" disabled/);assert.equal(specialBar({phase:'windup'}),'');});
