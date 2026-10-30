// Presentation only: keep saved task strings and answer identities unchanged.
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const WH='how often|how many|how much|how long|how far|how old|what time|what kind of|what type of|where|when|who|whose|which|what|why|how';
export function splitQuestion(value){
 const text=String(value??'').trim();
 const lines=text.split(/\n+/);if(lines.length>1&&lines.at(-1).includes('?'))return{context:lines.slice(0,-1).join('\n'),question:lines.at(-1)};
 const start=new RegExp('(?:[.!]\\s+)(?=(?:'+WH+'|do|does|did|is|are|can|will|would|should)\\b[^?]*\\?\\s*$)','i').exec(text);
 return start?{context:text.slice(0,start.index+1),question:text.slice(start.index+start[0].length)}:{context:'',question:text};
}
export function questionText(value){const {context,question}=splitQuestion(value);return context?context+'\n'+question:question;}
export function questionMarkup(value){const {context,question}=splitQuestion(value),m=new RegExp('^('+WH+')\\b','i').exec(question);const q=m?`<mark class="question-cue">${esc(m[0])}</mark>${esc(question.slice(m[0].length))}`:esc(question);return `${context?`<span class="question-context">${esc(context)}</span>`:''}<span class="question-line">${q}</span>`;}
// Old saved signposts have full-sentence options but no separate source template.
export function grammarTarget(q){if(q.sourceSentence)return q.sourceSentence;const lists=(q.options||[]).map(s=>s.split(/\s+/));if(!lists.length)return q.prompt;let a=0,z=0;while(lists.every(s=>s[a]!==undefined&&s[a]===lists[0][a]))a++;while(lists.every(s=>s.length-z-1>=a&&s.at(-1-z)===lists[0].at(-1-z)))z++;return[...lists[0].slice(0,a),'___',...(z?lists[0].slice(-z):[])].join(' ');}
