// These treatments follow the physical piece, rather than applying one floating pill to every task.
export function labelSurface(type,e){
 if(['inscription','assembled'].includes(e.role))return e.role==='assembled'?'inlay':'stone';
 if(e.action==='listen')return'crystal';
 return({translation:'stone',definition:'stone',repair:'stone',sentence:'stone',halves:'timber',picture:'crate',
  'qa-pairs':'scroll',ending:'leaf',answer:'leaf',intruder:'leaf',spelling:'paper',correct:'timber',gap:'timber',
  numbers:'bronze','listen-word':'petal','listen-tr':e.action==='pair-left'?'crystal':'timber','listen-multi':e.action==='confirm'?'weave':'paper',
  sort:'paper',clue:'timber',instructions:e.action==='confirm'?'weave':'paper'})[type]||'stone';
}
const weight=e=>String(e.text||'').length+String(e.context||'').length;
function rowHeight(e,width){return Math.max(.84,.40+Math.ceil(Math.max(1,weight(e))/(width>4?32:23))*.32);}
export function layoutForReading(p){
 if(p.entries.length===1)return p;
 const pairs=p.entries.filter(e=>/^pair-/.test(e.action||'')),options=p.entries.filter(e=>e.key.startsWith('option-'));
 if(p.type==='qa-pairs'){
  // Two unmistakable groups. Ordering within each group remains independently shuffled.
  p.readingLayout='question-groups';let y=.4;
  const left=pairs.filter(e=>e.action==='pair-left'),right=pairs.filter(e=>e.action==='pair-right');
  for(const[group,label]of[[right,'ANSWERS'],[left,'QUESTIONS']]){
   for(const e of [...group].reverse()){e.x=0;e.w=7;e.h=Math.max(1.1,((textLines(e.text,250,13)+(e.action==='pair-left'?1:0))*16.12+8)/38);e.y=y+e.h/2;y+=e.h+.12;e.group=e.action==='pair-left'?'questions':'answers';}

  }
  p.entries=p.entries.filter(e=>e.role!=='inscription');p.width=7.2;p.height=y+.25;return p;
 }
 if(pairs.length&&pairs.some(e=>weight(e)>20)){
  p.readingLayout='paired-wide';const left=pairs.filter(e=>e.action==='pair-left'),right=pairs.filter(e=>e.action==='pair-right');
  const maxLeft=Math.max(...left.map(weight)),maxRight=Math.max(...right.map(weight)),ratio=Math.max(.40,Math.min(.74,maxLeft/Math.max(1,maxLeft+maxRight))),span=7,gap=.30,leftW=(span-gap)*ratio,rightW=span-gap-leftW;let y=.75;
  for(let row=left.length-1;row>=0;row--){const a=left[row],b=right[row],h=Math.max(1.25,(textLines(a.text,leftW*38-14,13)*16.12+12)/38,(textLines(b.text,rightW*38-14,13)*16.12+12)/38);
   for(const[e,w,x]of[[a,leftW,-span/2+leftW/2],[b,rightW,span/2-rightW/2]]){e.w=w;e.x=x;e.h=h;e.y=y+h/2;}y+=h+.18;}
  const header=p.entries.find(e=>e.role==='inscription');if(header){header.h=Math.max(header.h,.72);header.y=y+header.h/2+.12;}
  p.height=y+(header?.h||0)+.55;
 }else if(options.some(e=>weight(e)>28)){
  const grid=options.length>=4&&options.some(e=>weight(e)>55);p.readingLayout=grid?'choice-grid':'wide';let y=1.1;
  if(grid){for(let row=Math.ceil(options.length/2)-1;row>=0;row--){const pair=options.slice(row*2,row*2+2),h=Math.max(1.05,...pair.map(e=>(textLines(e.text,3.25*40-14,13)*16.12+12)/40));for(let k=0;k<pair.length;k++){const e=pair[k];e.x=k?1.78:-1.78;e.w=3.25;e.h=h;e.y=y+h/2;}y+=h+.22;}}
  else for(const e of [...options].reverse()){e.x=0;e.w=5.55;e.h=rowHeight(e,e.w);e.y=y+e.h/2;y+=e.h+.18;}
  const prompt=p.entries.find(e=>e.role==='inscription');if(prompt){prompt.h=Math.max(1.05,rowHeight(prompt,5.55));prompt.y=y+.25+prompt.h/2;p.height=prompt.y+prompt.h/2+.55;}
 }
 // Long written instructions and questions grow their actual engraved support upward.
 const prompt=p.entries.find(e=>e.role==='inscription');if(prompt&&weight(prompt)>55){p.readingLayout??='dense';const h=Math.max(prompt.h,.55+Math.ceil(weight(prompt)/36)*.40),extra=h-prompt.h;prompt.h=h;prompt.y+=extra/2;p.height+=extra;}
 p.width=Math.max(p.width,...p.entries.map(e=>Math.abs(e.x)*2+e.w+.2));
 // Every format, including short headers, confirm plates and sentence blocks,
 // needs enough physical face for the minimum reading size. Grow rows together
 // so extending one plate never pushes its ink onto the row beneath it.
 const density=Math.min(38,296/p.width)*.95,rows=new Map();for(const e of p.entries){const key=e.y.toFixed(4);if(!rows.has(key))rows.set(key,[]);rows.get(key).push(e);}
 let lift=0;for(const row of [...rows.values()].sort((a,b)=>a[0].y-b[0].y)){
  const old=Math.max(...row.map(e=>e.h)),heights=row.map(e=>!e.text?e.h:Math.max(e.h,((textLines(e.text,Math.max(12,e.w*density*.96-12),13)+(e.context?textLines(e.context,Math.max(12,e.w*density*.96-12),13):0))*13*1.24+14)/(density*.96))),next=Math.max(...heights);
  row.forEach((e,i)=>{e.y+=lift+(next-old)/2;e.h=heights[i];});lift+=next-old;
 }
 p.height+=lift;return p;
}
let readingContext;const widths=new Map();
function measuredWidth(text,size){
 if(readingContext===undefined)readingContext=typeof document==='undefined'?null:document.createElement('canvas').getContext('2d');
 if(!readingContext)return[...text].reduce((n,c)=>n+charWidth(c,size),0);
 const key=size+'|'+text;if(widths.has(key))return widths.get(key);readingContext.font='650 '+size+'px system-ui, -apple-system, \"Segoe UI\", sans-serif';const width=readingContext.measureText(text).width;if(widths.size>4096)widths.clear();widths.set(key,width);return width;
}
const charWidth=(c,size)=>size*(/[MW@]/.test(c)?.82:/[ilI.,!:'’]/.test(c)?.26:c===' '?.29:.52);
export function textLines(text,width,size=14){
 const measure=s=>measuredWidth(s,size);let lines=0;
 for(const part of String(text||'').split('\n')){let used=0;lines++;for(const word of part.split(/\s+/).filter(Boolean)){const w=measure(word),space=used?size*.29:0;if(used&&used+space+w>width){lines++;used=0;}if(w>width){const n=Math.ceil(w/Math.max(1,width));lines+=n-1;used=w-(n-1)*width;}else used+= (used?space:0)+w;}}
 return lines;
}
export function labelTypography(e,width,height){
 const usableW=Math.max(12,width-14),usableH=Math.max(12,height-8);
 const need=size=>(textLines(e.text,usableW,size)+(e.context?textLines(e.context,usableW,size):0))*size*1.24+(e.context?3:0);
 let size=e.prominent?21:17;while(size>13&&(need(size)>usableH||!/[\s]/.test(String(e.text||''))&&measuredWidth(String(e.text||''),size)>usableW))size-=.5;
 return{size,needed:need(size),available:usableH,overflow:need(size)>usableH+1};
}
