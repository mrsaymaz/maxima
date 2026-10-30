import{splitQuestion}from'./question-cues.js';
import{explainMistake}from'./mistakes.js';
import{taskHint}from'./trail-tasks.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const FOCUS=[['what kind of','a type or category','tür'],['what type of','a type or category','tür'],['how often','frequency','sıklık'],['how many','a number','sayı'],['how much','an amount or price','miktar veya fiyat'],['how long','duration or length','süre veya uzunluk'],['how far','distance','uzaklık'],['how old','age','yaş'],['what time','a clock time','saat'],['whose','an owner','kime ait'],['where','a place','yer'],['when','a time','zaman'],['who','a person','kişi'],['why','a reason','neden'],['which','a choice','seçim'],['what','a thing or action','şey veya eylem'],['how','a way or condition','nasıl']];
export function questionFocus(value){const q=splitQuestion(value).question.toLowerCase();const f=FOCUS.find(([w])=>q.startsWith(w+' ')||q.startsWith(w+'?'));return f?{word:f[0],meaning:f[1],tr:f[2]}:null;}
function current(t){return t.kind==='pairs'?t.pairs[t.selected??t.leftOrder.find(i=>!t.matched.includes(i))]:t.rounds[t.round];}
export function feedbackKey(t){const q=current(t);return[t.nodeId,q?.id,t.repairFound?'replace':'read',t.kind==='pairs'?t.selected??'first':''].join('|');}
export function grammarCue(q){const a=String(q.answer),s=String(q.sourceSentence||q.prompt);if(/^(am|is|are|was|were)$/.test(a))return'Match the form of “be” to the subject and time.';if(/^(has|have|do|does)$/.test(a))return'Match the verb to the subject: I/you/we/they or he/she/it.';if(/^(a|an)$/.test(a))return'Choose “a” or “an” by the next sound, not just its written letter.';if(/\b(am|is|are|was|were)\s+_{2,}/i.test(s)&&/ing$/.test(a))return'After this form of “be”, check the -ing verb.';if(/\bthan\b/i.test(s))return'Notice “than”: check the comparison form.';if(/\b(yesterday|ago|last (week|year|month|night))\b/i.test(s))return'Notice the past-time clue. Check the past form.';return'Check the subject, verb and time clues in the sentence.';}
export function learningCue(t){const q=current(t);if(!q)return'Your accepted work is safe.';const f=questionFocus(t.kind==='pairs'?q.left:q.prompt);
 if(['answer','qa-pairs'].includes(t.type))return f?`${f.word.replace(/^./,s=>s.toUpperCase())} → ${f.meaning} (${f.tr}).`:'Match the reply to exactly what the question asks.';
 switch(t.type){
 case'translation':return'Compare the English meaning with each Turkish word.';
 case'definition':return'Find the word described by the whole clue, not just one shared word.';
 case'picture':return'Look at the object or action in the picture, then read the English word.';
 case'halves':case'ending':return'Read both parts together. They must make the supplied meaning.';
 case'sentence':return q.answer.trim().endsWith('?')?'Build a question: start with its question word or helper verb.':'Read the fitted beginning, then add the next fragment in English order.';
 case'gap':case'correct':return grammarCue(q);
 case'repair':return t.repairFound?'Choose the replacement that fits the whole sentence.':'The marked block needs repair. Read it with the words around it.';
 case'sort':return'Compare the word with both category names.';
 case'intruder':return'Find the word outside the named group. Keep the words that belong.';
 case'spelling':return'Compare the letters carefully. You are finding the misspelled word.';
 case'clue':return'Use every part of the clue before choosing a word.';
 case'listen-word':return'Listen again. Compare the beginning and ending sounds.';
 case'listen-tr':return'Listen to the English word, then choose its Turkish meaning.';
 case'listen-multi':return'Listen again after “Please select”. Deliver every requested item, and no extras.';
 case'instructions':return q.kind==='sequence'?'Check FIRST, SECOND and THIRD. Selection order matters.':/leave/i.test(q.prompt)?'Check what to pack and what to leave behind.':'Select every requested card, then confirm.';
 case'numbers':return String(q.id).startsWith('ordinal-')?'Match the position: first, second, third…':'Check tens, units and hundreds before connecting.';
 default:return'Read the request again. Your correct work stays fitted.';
 }}
function anchorFor(plan,action){if(!action)return[];const names={left:'pair-left',right:'pair-right',block:'block',choice:'choice',find:'find',pick:'pick',confirm:'confirm'};return plan.entries.filter(e=>e.action===names[action?.kind]&&(action.index===undefined||e.index===action.index)&&(action.text===undefined||e.textValue===action.text)).map(e=>e.key);}
export function guidancePlan(plan,t,feedback){if(!feedback||feedback.key!==feedbackKey(t))return plan;let anchors=anchorFor(plan,feedback.action);if(feedback.kind==='answer'){
 const q=current(t);if(t.kind==='pairs'){const i=t.selected??t.leftOrder.find(i=>!t.matched.includes(i));anchors=['left-'+i,'right-'+i];}
 else if(q.kind==='blocks')anchors=plan.entries.filter(e=>e.action==='block'&&!e.disabled&&e.text===q.correct[t.used.length]).map(e=>e.key);
 else if(q.kind==='repair'&&!t.repairFound)anchors=plan.entries.filter(e=>e.faulty).map(e=>e.key);
 else anchors=plan.entries.filter(e=>!e.disabled&&e.textValue!==undefined&&(Array.isArray(q.answer)?q.answer.includes(e.textValue):e.textValue===q.answer)).map(e=>e.key);
 }return{...plan,entries:plan.entries.map(e=>({...e,feedback:anchors.includes(e.key)?feedback.kind:null}))};}
export class LanguageCoach{
 constructor(){this.records=new Map();}
 record(t){const key=feedbackKey(t);if(!this.records.has(key)){if(this.records.size>=96)this.records.delete(this.records.keys().next().value);this.records.set(key,{wrong:0,hints:0});}return this.records.get(key);}
 wrong(t,action){const r=this.record(t);r.wrong++;return{kind:'retry',key:feedbackKey(t),action:{...action},cue:'Try again. '+learningCue(t),detail:r.wrong>1?'Your correct work stays. Use Hint for more support.':'Try another piece. Your correct work stays.'};}
 hint(t,u){const r=this.record(t);r.hints++;const reveal=r.hints>1,x=reveal?explainMistake(t,{},u):null;return{kind:reveal?'answer':'hint',key:feedbackKey(t),cue:reveal?(taskHint(t).length<=100?taskHint(t):'Read the outlined answer on the mechanism.'):learningCue(t),detail:reveal?(x?.tr&&x.tr.length<=90?`TR: ${x.tr}`:'The matching piece is outlined on the mechanism.'):'Read the mechanism again, or tap Show answer for a worked cue.'};}
 hintLabel(t){return this.record(t).hints?'Show answer':'Hint';}
 accepted(before,after,action,result){const q=current(before),f=questionFocus(before.kind==='pairs'?q?.left:q?.prompt);let cue='Correct — the mechanism moves one step.';
 if(before.kind==='pairs'){const pair=before.pairs[action.index];cue=before.type==='qa-pairs'&&f?`${f.word.replace(/^./,s=>s.toUpperCase())} answered: ${pair.right}`:before.type==='picture'?`Picture matched: ${pair.left}`:before.type==='definition'?`Description matched: ${pair.left}`:`Connected: ${pair.left} → ${pair.right}`;}
 else if(q.kind==='blocks')cue=after.round!==before.round?`Sentence complete: ${q.answer}`:`Fitted ${after.used.length} of ${q.correct.length} fragments. Read the joined beginning.`;
 else if(q.kind==='repair')cue=after.round===before.round?'Fault found. Now choose its replacement.':`Repaired: ${q.correct}`;
 else if(before.type==='spelling')cue=`Correct spelling: ${q.correction}`;
 else if(before.type==='answer'&&f)cue=`${f.word.replace(/^./,s=>s.toUpperCase())} answered: ${q.answer}`;
 else if(q.kind==='sequence')cue='Packed in the requested order.';
 else if(q.kind==='multi')cue='Every requested item delivered. No extras.';
 else if(before.type==='sort')cue=`${q.prompt} → ${q.answer}`;
 else if(before.type==='correct')cue=`Sentence restored: ${q.answer}`;else if(before.type==='ending')cue=`Completed: ${q.prompt.replace(/…$/,'')} ${q.answer}`;else if(before.type==='clue')cue=`Clue solved: ${q.answer}`;else if(before.type==='listen-word')cue=`You heard: ${q.answer}`;else if(before.type==='intruder')cue=`Removed the intruder: ${q.answer}`;else if(before.type==='gap')cue=`Fits the sentence: ${q.answer}`;
 if(cue.length>120)cue=f?`${f.word.replace(/^./,s=>s.toUpperCase())} answered — you identified ${f.meaning}.`:before.type==='halves'?'Both halves now make one complete meaning.':before.type==='sentence'?'Sentence complete — every fragment is fitted.':before.type==='correct'||before.type==='repair'?'Sentence restored — the grammar and meaning fit.':'Meaning connected — the mechanism advances.';return{kind:'correct',key:feedbackKey(after),cue,detail:result.complete?'Mechanism restored. Checkpoint saved.':'Accepted work saved; continue with the next piece.'};}
}
export function languageFeedbackMarkup(f){if(!f)return'';return`<div class="language-feedback" data-feedback="${esc(f.kind)}" role="status" aria-live="polite" aria-atomic="true"><strong>${esc(f.cue)}</strong><span>${esc(f.detail)}</span></div>`;}
