// Better mistakes: after a wrong answer, show the right answer, its Turkish meaning and a one-line reason.
const lower=s=>String(s??'').toLowerCase().trim();
export function turkishFor(unit,english){const e=lower(english);return unit?.vocabulary?.find(v=>lower(v.en)===e)?.tr||'';}
function sentenceTr(unit,id){const base=String(id||'').replace(/-grammar.*$/,'');return unit?.sentences?.find(s=>s.id===base)?.tr||'';}
const QUESTION=[[/^how often/i,'“How often” asks about frequency: how regularly something happens.'],[/^how long/i,'“How long” asks about duration or length.'],[/^how far/i,'“How far” asks about distance.'],[/^how old/i,'“How old” asks about age.'],[/^whose/i,'“Whose” asks who owns something.'],[/^how many|^how much/i,'“How many / How much” asks for a number or amount.'],[/^who/i,'“Who” asks about a person, so the answer names someone.'],[/^where/i,'“Where” asks about a place.'],[/^when|^what time/i,'“When” asks about a time.'],[/^why/i,'“Why” asks for a reason, often with “because”.'],[/^which/i,'“Which” asks you to choose one of the things mentioned.'],[/^what/i,'“What” asks about a thing or an action.'],[/^how/i,'“How” asks about the way or condition.'],[/^(do|does|did|is|are|was|were|can|have|has|will)\b/i,'A yes/no question is answered with the same helper verb.']];
export function questionReason(q){for(const[re,text]of QUESTION)if(re.test(String(q).trim()))return text;return'The answer must reply to exactly what the question asks.';}
// Compares the chosen option with the answer to name the grammar point.
export function grammarReason(answer,chosen=''){
 const a=lower(answer),c=lower(chosen),last=s=>s.split(/\s+/).pop()||'',la=last(a),lc=last(c);
 if(/^(must|can|should|will|could|would|may|might|mustn't|can't|won't|shouldn't)\b/.test(a)&&la!==lc)return`After must, can or should, use the base verb: “${answer}”.`;
 if(/^(am|is|are|was|were)$/.test(la)||/^(am|is|are|was|were)$/.test(lc))return`Match the verb “be” to the subject: “${answer}”.`;
 if(/^(has|have|do|does|don't|doesn't)$/.test(la)&&/^(has|have|do|does|don't|doesn't)$/.test(lc))return`With he, she or it use has/does; with I, you, we, they use have/do: “${answer}”.`;
 if((la===lc+'s'||la===lc+'es'||la===lc.replace(/y$/,'ies'))&&la!==lc)return`With he, she or it, the present simple verb adds -s: “${answer}”.`;
 if((lc===la+'s'||lc===la+'es')&&la!==lc)return`With I, you, we or they, the verb has no -s: “${answer}”.`;
 if(lc.endsWith('ing')&&!la.endsWith('ing'))return`This sentence needs “${answer}”, not the -ing form.`;
 if(la.endsWith('ing')&&!lc.endsWith('ing'))return`After am, is or are we use the -ing form: “${answer}”.`;
 if(la.endsWith('ed')&&!lc.endsWith('ed'))return`This happened in the past, so we use “${answer}”.`;
 if(/(er|more)\b/.test(a)&&/(est|most)\b/.test(c))return`Comparing two things uses “${answer}”.`;
 if(/(est|most)\b/.test(a)&&/(er|more)\b/.test(c))return`Comparing three or more things uses “${answer}”.`;
 if(/^an?$/.test(la)||/^an?$/.test(lc))return'Use “an” before a vowel sound and “a” before a consonant sound.';
 return`Only “${answer}” fits the grammar and meaning here.`;
}
// The words that differ between two otherwise matching sentences.
export function diffWords(a,b){const x=String(a).split(/\s+/),y=String(b).split(/\s+/);let i=0;while(i<x.length&&i<y.length&&x[i]===y[i])i++;let j=0;while(j<x.length-i&&j<y.length-i&&x[x.length-1-j]===y[y.length-1-j])j++;return{answer:x.slice(i,x.length-j).join(' '),chosen:y.slice(i,y.length-j).join(' ')};}
function numberReason(n){n=Number(n);if(n>100&&n%100)return'For numbers over 100, say “hundred and …”.';if(n>20&&n<100&&n%10)return'Two-word numbers from 21 to 99 use a hyphen, like “twenty-one”.';return'Read the number word carefully: each digit has its own name.';}

// Returns {answer, tr, reason, ids} describing the right answer for a mistake, or null.
export function explainMistake(task,action,unit){
 if(!task)return null;const t=task;
 if(t.kind==='pairs'){
  const i=t.selected??(action?.kind==='left'?action.index:null);const p=t.pairs?.[i];if(!p)return null;
  if(t.type==='translation'||t.type==='listen-tr')return{answer:`${p.left} = ${p.right}`,tr:p.right,reason:`“${p.left}” means “${p.right}” in Turkish.`,ids:[p.id]};
  if(t.type==='definition')return{answer:`${p.left}: ${p.right}`,tr:turkishFor(unit,p.left),reason:`This description matches “${p.left}”.`,ids:[p.id]};
  if(t.type==='picture')return{answer:p.left,tr:turkishFor(unit,p.left),reason:`The picture shows “${p.left}”.`,ids:[p.id]};
  if(t.type==='qa-pairs')return{answer:`${p.left} → ${p.right}`,tr:'',reason:questionReason(p.left),ids:[p.id]};
  if(t.type==='halves')return{answer:`${p.left} ${p.right}`,tr:p.context||'',reason:'Both halves must join into one sentence with a clear meaning.',ids:[p.id]};
  if(t.type==='numbers'&&String(p.id).startsWith('ordinal-'))return{answer:`${p.left} = ${p.right}`,tr:'',reason:'Ordinal numbers show position: first, second, third, and so on.',ids:[]};
  if(t.type==='numbers')return{answer:`${p.left} = ${p.right}`,tr:'',reason:numberReason(p.left),ids:[]};
  return{answer:`${p.left} → ${p.right}`,tr:'',reason:'Match each piece with its partner.',ids:[p.id]};
 }
 const q=t.rounds?.[t.round];if(!q)return null;const chosen=action?.text??'';
 switch(t.type){
  case'sentence':return{answer:q.answer,tr:sentenceTr(unit,q.id),reason:q.answer.trim().endsWith('?')?'Questions begin with the question word or helper verb.':`Next comes “${q.correct[t.used.length]}”. English order: who → does what → the rest.`,ids:[q.id]};
  case'ending':return{answer:`${q.prompt.replace(/…$/,'')} ${q.answer}`,tr:q.context||'',reason:'Only this ending completes the meaning of the sentence.',ids:[q.id]};
  case'gap':return{answer:q.answer,tr:sentenceTr(unit,q.id),reason:grammarReason(q.answer,chosen),ids:[q.id]};
  case'correct':{const d=diffWords(q.answer,chosen);return{answer:q.answer,tr:q.context||sentenceTr(unit,q.id),reason:d.answer&&chosen?grammarReason(d.answer.replace(/[.!?]$/,''),d.chosen.replace(/[.!?]$/,'')):'Check the verb form and word order against the subject.',ids:[q.id]};}
  case'repair':return t.repairFound?{answer:q.correct,tr:sentenceTr(unit,q.id),reason:grammarReason(q.answer,chosen||q.broken),ids:[q.id]}:{answer:`The broken word is “${q.broken}”.`,tr:sentenceTr(unit,q.id),reason:grammarReason(q.answer,q.broken),ids:[q.id]};
  case'answer':return{answer:q.answer,tr:'',reason:questionReason(q.prompt),ids:[q.id]};
  case'sort':return{answer:`${q.prompt} → ${q.answer}`,tr:turkishFor(unit,q.prompt),reason:`“${q.prompt}” belongs with ${String(q.answer).toLowerCase()}.`,ids:[q.id]};
  case'intruder':return{answer:`Remove “${q.answer}”.`,tr:turkishFor(unit,q.answer),reason:`“${q.answer}” is not part of this group: ${q.prompt.replace(/^.*?:\s*/,'').toLowerCase()}.`,ids:[]};
  case'spelling':return{answer:`${q.answer} → ${q.correction}`,tr:turkishFor(unit,q.correction),reason:`“${q.answer}” is misspelled; the correct spelling is “${q.correction}”.`,ids:[q.id]};
  case'clue':return{answer:q.answer,tr:turkishFor(unit,q.answer),reason:`The clue describes “${q.answer}”.`,ids:[q.id]};
  case'listen-word':return{answer:q.answer,tr:turkishFor(unit,q.answer),reason:`You heard “${q.answer}”. Listen to the first sound again.`,ids:[q.id]};
  case'listen-multi':return{answer:q.answer.join(' + '),tr:q.answer.map(w=>turkishFor(unit,w)).filter(Boolean).join(' + '),reason:'Listen for every item after “Please select”.',ids:[]};
  case'instructions':return{answer:q.answer.join(q.kind==='sequence'?' → ':' + '),tr:q.answer.map(w=>turkishFor(unit,w)).filter(Boolean).join(q.kind==='sequence'?' → ':' + '),reason:q.kind==='sequence'?'Follow the order words: FIRST, SECOND, THIRD.':/Leave/.test(q.prompt)?'“Leave … behind” means do not pack that card.':'Pack every card the request names, and nothing else.',ids:[]};
 }
 return{answer:Array.isArray(q.answer)?q.answer.join(', '):String(q.answer),tr:'',reason:'Read the request again and compare each option.',ids:[q.id]};
}
