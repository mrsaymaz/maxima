import{test}from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
import{translationSigns,installTranslateGuard,translateNoticeMarkup,CANARY_TEXT}from'../src/translate-guard.js';
function fakeDoc({lang='en',classes=[],canary=CANARY_TEXT,selectors=[]}={}){const els={};const html={classList:{contains:c=>classes.includes(c)},getAttribute:k=>k==='lang'?lang:null};
 const doc={documentElement:html,body:{appendChild(e){els[e.id]=e;}},getElementById:id=>els[id]||(id==='translate-canary'&&canary!=null?(els[id]={textContent:canary}):null),querySelector:sel=>selectors.some(s=>sel.includes(s))?{}:null,createElement:()=>({setAttribute(){},textContent:''}),set lang(v){lang=v;},set canary(v){els['translate-canary'].textContent=v;},addClass(c){classes.push(c);}};return doc;}
test('every page asks browsers not to translate it',()=>{for(const f of fs.readdirSync('src').filter(f=>f.endsWith('.html'))){const s=fs.readFileSync('src/'+f,'utf8');assert.match(s,/<html lang="en" translate="no" class="notranslate">/,f);assert.match(s,/<meta name="google" content="notranslate" \/>/,f);}
 for(const f of fs.readdirSync('dist').filter(f=>f.endsWith('.html')))assert.match(fs.readFileSync('dist/'+f,'utf8'),/translate="no"/,'built '+f);});
test('the guard recognises Google, Microsoft and generic page translation, and an untouched page is clean',()=>{
 assert.deepEqual(translationSigns(fakeDoc()),[]);assert.deepEqual(translationSigns(fakeDoc({lang:'en-GB'})),[]);
 assert.ok(translationSigns(fakeDoc({classes:['translated-ltr']})).includes('google'));
 assert.ok(translationSigns(fakeDoc({lang:'tr'})).includes('lang'));
 assert.ok(translationSigns(fakeDoc({canary:'İngilizce öğrenmeye devam et.'})).includes('canary'));
 assert.ok(translationSigns(fakeDoc({selectors:['goog-te-banner-frame']})).includes('google-dom'));
 assert.ok(translationSigns(fakeDoc({selectors:['_msttexthash']})).includes('microsoft'));
});
test('the guard reports when translation starts and stops',()=>{
 const doc=fakeDoc(),changes=[];let tick=null;const win={setInterval:f=>(tick=f,1),clearInterval(){}};
 const g=installTranslateGuard({doc,win,onChange:(a,r)=>changes.push([a,r])});assert.equal(g.active,false);
 doc.lang='tr';doc.addClass('translated-ltr');tick();assert.deepEqual(changes,[[true,['google','lang']]]);tick();assert.equal(changes.length,1,'reported once');
 doc.lang='en';doc.documentElement.classList.contains=()=>false;tick();assert.deepEqual(changes.at(-1),[false,[]]);g.stop();
});
test('the notice explains in English and Turkish how to switch translation off in each browser',()=>{const html=translateNoticeMarkup();
 assert.match(html,/Please turn off Translate/);assert.match(html,/lang="tr"/);for(const b of['Chrome','Safari','Edge','extension'])assert.match(html,new RegExp(b));assert.match(html,/data-translate="check"/);});
test('play blocks selection and the long-press menu, and answers are refused while translated',()=>{
 const css=fs.readFileSync('src/style.css','utf8');assert.match(css,/body\.playing \*,[\s\S]*-webkit-touch-callout: none/);
 const app=fs.readFileSync('src/corridor-app.js','utf8');assert.match(app,/function submit\(action\) \{\n  \/\/ While the page is machine-translated, answers do not count[^\n]*\n  if \(translationActive\) return;/);assert.match(app,/addEventListener\('contextmenu'/);
});
