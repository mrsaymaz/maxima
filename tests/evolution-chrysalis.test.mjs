import{test}from'node:test';import assert from'node:assert/strict';
import{Chrysalis,chrysalisTimes}from'../dist/evolution-chrysalis.js';import{EVOLUTION_SCORES,EVOLUTION_DURATION,evolutionFrame}from'../dist/evolution-timeline.js';
const palette={color:'#ffb968',accent:'#ff8358'};
const visibleMeshes=c=>{let n=0;c.root.traverse(o=>{if(!o.visible)return;let v=o;while(v){if(!v.visible)return;v=v.parent;}if(o.isInstancedMesh){const m=new (o.matrix.constructor)();for(let i=0;i<o.count;i++){o.getMatrixAt(i,m);if(Math.abs(m.elements[0])+Math.abs(m.elements[5])>1e-6&&m.elements[13]>-900){n++;break;}}}else if(o.isMesh&&(o.material.opacity??1)>.01&&o.parent?.visible!==false)n++;});return n;};
test('five beats in order for every element: call, gather, chrysalis, burst, reveal; the swap stays inside the burst light',()=>{for(const element of Object.keys(EVOLUTION_SCORES)){const t=chrysalisTimes(EVOLUTION_SCORES[element]);
 assert.ok(t.call<t.gather&&t.gather<t.closed&&t.closed<t.burst&&t.burst<t.reveal&&t.reveal<=t.end&&t.end<EVOLUTION_DURATION,element);
 const swap=EVOLUTION_SCORES[element].swap;assert.ok(swap>t.burst&&swap<t.burst+.3,'the forms swap just after the burst');assert.ok(evolutionFrame(swap,0,1,{element}).glow>.9,'inside the flash');}});
test('each element has its own chrysalis; it forms, beats, bursts and clears before the final hold',()=>{const kinds=new Set();for(const element of Object.keys(EVOLUTION_SCORES)){const c=new Chrysalis(element,palette,1,.7,EVOLUTION_SCORES[element]),t=c.times;
 kinds.add(c.shell.children.map(o=>(o.geometry?.type||'')+(o.geometry?.attributes?.position?.count||0)).join()+c.shellMat.color.getHexString());
 c.update(t.gather-.2);assert.equal(c.shell.visible,false,'no shell while the element gathers');c.update((t.closed+t.burst)/2);assert.equal(c.shell.visible,true);assert.ok(c.shell.scale.x>.5);
 let beats=0;for(let x=t.closed;x<t.burst;x+=.02){c.update(x);if(c.pulse>.5)beats++;}assert.ok(beats>=4,`${element} beats like a heart`);
 c.update(t.burst+.1);assert.equal(c.shell.visible,false,'the shell shatters');assert.ok(c.flash.visible&&c.shake>0,'flash and shake at the burst');
 c.update(t.end+.05);assert.equal(c.shell.visible,false);assert.equal(c.flash.visible,false);assert.ok(c.waves.every(w=>!w.visible));
 c.root.traverse(o=>{const p=o.geometry?.attributes?.position;if(p)assert.ok([...p.array].every(Number.isFinite));});c.dispose();assert.equal(c.root.parent,null);}
 assert.equal(kinds.size,4,'four different shells');});
test('reduced motion keeps the beats with far fewer pieces and no confetti',()=>{const full=new Chrysalis('fire',palette,1,.7,EVOLUTION_SCORES.fire),calm=new Chrysalis('fire',palette,1,.7,EVOLUTION_SCORES.fire,{reduced:true});assert.ok(calm.shards.count<full.shards.count&&calm.streams.count<full.streams.count);assert.equal(calm.confetti.length,0);});
