import{textLines}from'./mechanism-labels.js';
// Rebuild the physical rows for the available screen, without stretching meshes
// or changing task data. Close reading keeps one question and EVERY answer.
export function arrangeForReading(plan,{width=320,height=568,inspect=false,selected=null}={}){
 if(plan.entries.length<2)return plan;
 const landscape=width>height&&height<540,span=landscape?Math.min(14,Math.max(8,(width-200)/42)):6.8;
 if(!landscape&&!(inspect&&selected!==null&&selected!==undefined))return plan;
 const oldSpan=Math.max(...plan.entries.map(e=>Math.abs(e.x)*2+e.w)),factor=span/oldSpan;
 if(inspect&&selected!==null&&selected!==undefined){
  plan.entries=plan.entries.filter(e=>e.action!=='pair-left'||e.index===selected);
  const question=plan.entries.find(e=>e.action==='pair-left');
  if(question){plan.entries=plan.entries.filter(e=>e.role!=='group-label');const answers=plan.entries.filter(e=>e.action==='pair-right'),header=plan.entries.find(e=>e.role==='inscription');
   const ordered=[...answers].reverse();if(header&&question.supportContext)ordered.push(header);else if(header)plan.entries=plan.entries.filter(e=>e!==header);ordered.push(question);
   let y=1.75;for(const e of ordered){e.x=0;e.w=span;e.h=Math.max(1.1,(textLines(e.text,span*36-16,14)*17.36+16)/36);e.y=y+e.h/2;y+=e.h+.18;}
   plan.links=[];plan.width=span+.2;plan.height=y+.35;plan.viewportLayout=true;plan.readingLayout='inspect-question';return plan;
  }
 }
 const rows=new Map();for(const e of plan.entries){const key=e.y.toFixed(4);if(!rows.has(key))rows.set(key,[]);rows.get(key).push(e);e.x*=factor;e.w*=factor;}
 let y=1.75;for(const row of [...rows.values()].sort((a,b)=>a[0].y-b[0].y)){
  const heights=row.map(e=>Math.max(e.image?1.4:e.action?1.12:.9,(textLines(e.text,Math.max(20,e.w*36-16),14)*17.36+16)/36)),h=Math.max(...heights);
  row.forEach((e,i)=>{e.h=heights[i];e.y=y+h/2;});y+=h+.18;
 }
 plan.width=span+.2;plan.height=y+.35;plan.viewportLayout=true;plan.readingLayout='viewport';return plan;
}
