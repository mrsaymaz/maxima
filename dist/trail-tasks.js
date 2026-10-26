import{activity}from'./expedition.js';
export function rngFor(text){let n=2166136261;for(const c of String(text))n=Math.imul(n^c.charCodeAt(0),16777619);return()=>{n^=n<<13;n^=n>>>17;n^=n<<5;return(n>>>0)/4294967296;};}
export function shuffle(a,r=Math.random){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const unique=(items,key)=>items.filter((x,i,a)=>a.findIndex(y=>key(y)===key(x))===i);
export function numberWords(n){const ones=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'],tens=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];if(n<20)return ones[n];if(n<100)return tens[Math.floor(n/10)]+(n%10?'-'+ones[n%10]:'');return ones[Math.floor(n/100)]+' hundred'+(n%100?' and '+numberWords(n%100):'');}
function corrupt(word){return word.replace(/^([A-Za-z])/,"$1$1");}
function splitSentence(s){const cut=Math.max(1,Math.ceil(s.blocks.length/2));return{id:s.id,left:s.blocks.slice(0,cut).join(' '),right:s.blocks.slice(cut).join(' '),context:s.tr||'',answer:s.answer||s.blocks.join(' ')};}
export function makeTask(unit,type,nodeId,seed=nodeId,seen={},level=0){
 const r=rngFor(seed),depth=Math.max(0,Math.min(10,level)),complexity=x=>x.blocks?x.blocks.length*3+(x.answer||'').split(' ').length:((x.prompt||x.en||x.clue||x.word||'')+' '+(x.answer||'')).split(/\s+/).length,take=(list,n=3,key=x=>x.id)=>{const ranked=unique(shuffle(list,r),key).sort((a,b)=>complexity(a)-complexity(b)),target=complexity(ranked[Math.min(ranked.length-1,Math.floor((ranked.length-1)*depth/10))]||{});return shuffle(ranked,r).sort((a,b)=>(seen[a.id]||0)-(seen[b.id]||0)||Math.abs(complexity(a)-target)-Math.abs(complexity(b)-target)).slice(0,n)},vocab=unique(unit.vocabulary,v=>v.en.toLowerCase()),voc=take(vocab,4),task={version:1,type,nodeId,round:0,rounds:[],complete:false,hints:0,mistakes:0,selected:null,matched:[],used:[],picked:[],repairFound:false};
 if(['translation','definition','picture','qa-pairs','halves','listen-tr','numbers'].includes(type)){
  task.kind='pairs';let pairs=[];
  if(type==='translation'||type==='listen-tr')pairs=take(vocab,3,v=>v.en+'|'+v.tr).map(v=>({id:v.id,left:v.en,right:v.tr,spoken:type==='listen-tr'?v.en:null}));
  if(type==='definition')pairs=take(unit.descriptions,3,v=>v.answer).map(v=>({id:v.id,left:v.answer,right:v.clue}));
  if(type==='picture')pairs=take(vocab.filter(v=>v.picture),3,v=>v.pictureGroup||v.picture).map(v=>({id:v.id,left:v.en,right:v.en,image:v.picture}));
  if(type==='qa-pairs')pairs=take(unit.questions,3,q=>q.answer).map(q=>({id:q.id,left:q.prompt,right:q.answer}));
  if(type==='halves')pairs=take(unit.sentences,3,s=>s.answer||s.blocks.join(' ')).map(splitSentence);
  if(type==='numbers'){const values=shuffle(Array.from({length:201},(_,i)=>i),r).slice(0,3);pairs=values.map(n=>({id:'number-'+n,left:String(n),right:numberWords(n)}));}
  if(pairs.length<3)throw Error(`${unit.id}: ${type} needs three distinct records`);task.pairs=pairs;task.leftOrder=shuffle([0,1,2],r);task.rightOrder=shuffle([0,1,2],r);return task;
 }
 task.kind='rounds';const choice=(id,prompt,answer,options,extra={})=>({id,prompt,answer,options:shuffle(unique([answer,...options],x=>x),r),...extra});
 if(type==='sentence')task.rounds=take(unit.sentences).map(s=>({id:s.id,kind:'blocks',prompt:depth>=5?'Restore the complete English sentence.':s.tr||'Build a complete English sentence.',answer:s.blocks.join(' '),blocks:shuffle(s.blocks.map((text,index)=>({text,index})),r),correct:s.blocks.slice()}));
 if(type==='ending')task.rounds=take(unit.sentences).map(s=>{const h=splitSentence(s);const others=take(unit.sentences.filter(x=>x.id!==s.id),3).map(x=>splitSentence(x).right).filter(x=>x!==h.right);return choice(s.id,h.left+'…',h.right,others.slice(0,2),{context:h.context});});
 if(type==='gap'||type==='correct')task.rounds=take(unit.gaps).map(g=>type==='gap'?choice(g.id,g.prompt,g.answer,g.options):choice(g.id,'Choose the sentence with correct grammar.',g.prompt.replace(/_{2,}/,g.answer),g.options.map(o=>g.prompt.replace(/_{2,}/,o)),{context:g.tr||''}));
 if(type==='repair')task.rounds=take(unit.repairs).map(g=>({id:g.id,kind:'repair',prompt:g.prompt.replace(/_{2,}/,g.broken),broken:g.broken,answer:g.answer,options:shuffle(g.options.filter(x=>x!==g.broken),r),correct:g.fullCorrect||g.prompt.replace(/_{2,}/,g.answer)}));
 if(type==='answer')task.rounds=take(unit.questions).map(q=>choice(q.id,q.prompt,q.answer,q.options));
 if(type==='clue')task.rounds=take(unit.descriptions).map(d=>choice(d.id,d.clue,d.answer,d.options));
 if(type==='listen-word')task.rounds=take(vocab).map(v=>choice(v.id,'Listen to the echo flower.',v.en,take(vocab.filter(x=>x.en!==v.en),2).map(x=>x.en),{spoken:v.en}));
 if(type==='sort'){
  const cats=unit.categories.slice(0,2),labels=cats.map(c=>c.title);const list=cats.flatMap((c,i)=>c.yes.filter(w=>!cats[1-i].yes.includes(w)).map(w=>({id:`${c.id}:${w}`,word:w,category:c.title})));task.rounds=take(list,3).map(v=>choice(v.id,v.word,v.category,labels,{context:'Choose the correct supply shelf.'}));
 }
 if(type==='intruder')task.rounds=Array.from({length:3},(_,i)=>{const c=unit.categories[i%unit.categories.length],yes=take(c.yes.map((word,j)=>({id:j,word})),3).map(v=>v.word),wrong=shuffle(c.no.filter(w=>!c.yes.includes(w)),r)[0];return choice(c.id+':'+i,`Remove the word that does NOT belong: ${c.title}`,wrong,yes);});
 if(type==='spelling')task.rounds=take(vocab.filter(v=>v.en.replace(/[^a-z]/gi,'').length>=4)).map(v=>{const wrong=corrupt(v.en),others=take(vocab.filter(w=>w.en!==v.en&&w.en!==wrong),2).map(w=>w.en);return choice(v.id,'Which word is misspelled?',wrong,others,{correction:v.en});});
 if(type==='listen-multi'||type==='instructions')task.rounds=Array.from({length:3},(_,i)=>{const words=take(vocab,4,v=>v.en),a=words[0],b=words[1],c=words[2],sequence=type==='instructions'&&(i===0||depth>=6&&i===2),negative=type==='instructions'&&i===1,needed=negative?[a.en]:depth>=6?[a.en,b.en,c.en]:[a.en,b.en];return{id:`${type}:${words.map(w=>w.id).join(':')}`,kind:sequence?'sequence':'multi',prompt:type==='listen-multi'?`Listen, select ${needed.length===3?'all three':'both'} requested cards, then confirm.`:sequence?`Pack the English card for “${a.tr}” FIRST, then the card for “${b.tr}” SECOND.${depth>=6?` Finally pack “${c.tr}” THIRD.`:''}`:negative?`Pack the English card for “${a.tr}”. Leave “${b.tr}” behind.`:`Pack the ${needed.length===3?'three':'two'} English cards for “${a.tr}”, “${b.tr}”${needed.length===3?` and “${c.tr}”`:''}. Leave the other cards behind.`,spoken:type==='listen-multi'?`Please bring ${a.en}${needed.length===3?`, ${b.en} and ${c.en}`:` and ${b.en}`}.`:null,answer:needed,options:shuffle(words.map(w=>w.en),r)};});
 if(task.rounds.length!==3||task.rounds.some(x=>x.answer==null||!x.options&&!x.blocks))throw Error(`${unit.id}: cannot prepare ${type}`);return task;
}
export const taskFraction=t=>t.complete?1:t.kind==='pairs'?t.matched.length/3:(t.round+(t.rounds[t.round]?.kind==='blocks'?t.used.length/t.rounds[t.round].correct.length: t.rounds[t.round]?.kind==='repair'&&t.repairFound?.4:0))/3;
export function actTask(t,action){if(t.complete)return{accepted:false};const fail=()=>{t.mistakes++;return{accepted:false,wrong:true};},done=()=>{if(t.kind==='pairs'){if(t.matched.length===3)t.complete=true;}else{t.round++;t.used=[];t.picked=[];t.repairFound=false;if(t.round===3)t.complete=true;}return{accepted:true,complete:t.complete};};
 if(t.kind==='pairs'){
  if(action.kind==='left'){if(t.matched.includes(action.index))return{accepted:false};t.selected=action.index;return{accepted:false,selection:true};}
  if(action.kind!=='right'||t.selected==null||t.matched.includes(action.index))return{accepted:false};if(action.index!==t.selected)return fail();t.matched.push(action.index);t.selected=null;return done();
 }
 const q=t.rounds[t.round];if(q.kind==='blocks'){if(action.kind!=='block'||t.used.includes(action.index))return{accepted:false};const b=q.blocks[action.index];if(!b||b.text!==q.correct[t.used.length])return fail();t.used.push(action.index);return t.used.length===q.correct.length?done():{accepted:true};}
 if(q.kind==='repair'&&!t.repairFound){if(action.kind!=='find')return{accepted:false};if(action.text!==q.broken)return fail();t.repairFound=true;return{accepted:true};}
 if(q.kind==='multi'||q.kind==='sequence'){
  if(action.kind==='pick'){if(!q.options.includes(action.text))return{accepted:false};if(t.picked.includes(action.text))t.picked=t.picked.filter(x=>x!==action.text);else t.picked.push(action.text);return{selection:true,accepted:false};}
  if(action.kind!=='confirm')return{accepted:false};const ok=q.kind==='sequence'?JSON.stringify(t.picked)===JSON.stringify(q.answer):t.picked.length===q.answer.length&&q.answer.every(x=>t.picked.includes(x));return ok?done():fail();
 }
 if(action.kind!=='choice'||!q.options.includes(action.text))return{accepted:false};return action.text===q.answer?done():fail();
}
export function taskHint(t){if(t.kind==='pairs'){const i=t.selected??t.leftOrder.find(i=>!t.matched.includes(i)),p=t.pairs[i];return`${p.left} → ${p.right}`;}const q=t.rounds[t.round];return q.kind==='blocks'?`Next block: ${q.correct[t.used.length]}`:q.kind==='repair'&&!t.repairFound?`Check: ${q.broken}`:q.correction?`Correct spelling: ${q.correction}`:`Try: ${Array.isArray(q.answer)?q.answer.join(' → '):q.answer}`;}
