import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.min.js';
import{freshJourney,freshExpedition as freshCurrentExpedition}from'../dist/expedition.js';
// These mechanics tests use the legacy week layout (rivals in chapters 1, 3 and 5; extra trials in chapters 2 and 4), which older saves keep.
const freshExpedition=(...a)=>Object.assign(freshCurrentExpedition(...a),{adventureVersion:1});
import {sectionsFor,courseCoordinates,localPoint} from '../dist/traversal-layout.js';
import {boulderPose,movingPose,gustState,crystalState} from '../dist/path-trials-layout.js';
import {makeTrialScenery,updateTrialScenery} from '../dist/path-trial-props.js';

const TAU=Math.PI*2;
const originalBatches={boulders:6,wind:8,moving:2,thorns:4,crystals:8,bonus:2};
function course(area=0,side='left',mode='relaxed'){
 const expedition=freshExpedition(freshJourney(),'g5u1',area);expedition.choices.fill(side);
 return sectionsFor(expedition,mode);
}
function fixture(kind,area=0,mode='relaxed',side='left'){
 const section=course(area,side,mode).find(s=>s.trial?.kind===kind);
 return {section,group:makeTrialScenery(section)};
}
function instance(mesh,index){const matrix=new T.Matrix4();mesh.getMatrixAt(index,matrix);return matrix;}
function center(mesh,index){return new T.Vector3().setFromMatrixPosition(instance(mesh,index));}
function scale(mesh,index){return new T.Vector3().setFromMatrixScale(instance(mesh,index));}
function assertFinite(group){group.updateMatrixWorld(true);group.traverse(o=>{assert.ok(o.matrixWorld.elements.every(Number.isFinite));if(o.geometry)assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));if(o.isInstancedMesh)assert.ok(o.instanceMatrix.array.every(Number.isFinite));});}
function dispose(group){const geometries=new Set(),materials=new Set();group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();}

test('Whisperwood complete twenty-stretch course benchmarks all hazard factories before other arenas',()=>{
 const sections=course();assert.equal(sections.length,20);assert.deepEqual(sections.map(s=>s.index),Array.from({length:20},(_,i)=>i));
 const kinds=new Set();for(const section of sections){if(!section.trial)continue;kinds.add(section.trial.kind);const before=JSON.stringify(section),group=makeTrialScenery(section);for(const time of[0,.2,2.4,6.1,13.8]){updateTrialScenery(group,{time,playerRadius:.5});assertFinite(group);}assert.equal(JSON.stringify(section),before,'art must not mutate the physics course');assert.ok(group.userData.drawMeshes<=originalBatches[section.trial.kind]+4,`${section.trial.kind} draw budget`);assert.deepEqual(group.userData.solids,[]);dispose(group);}
 assert.equal(kinds.size,6);
});

test('same art factory remains finite and bounded across all arenas, branches and difficulty modes',()=>{
 for(const area of[0,1,2])for(const side of['left','right'])for(const mode of['relaxed','challenge'])for(const section of course(area,side,mode)){
  if(!section.trial)continue;const group=makeTrialScenery(section);updateTrialScenery(group,{time:11.35,playerRadius:.6});assertFinite(group);assert.ok(group.userData.drawMeshes<=originalBatches[section.trial.kind]+4);dispose(group);
 }
});

test('boulder mouths match physical endpoints and three warning lamps count toward the next roll',()=>{
 const {section:s,group:g}=fixture('boulders'),lane=s.trial.lanes[0],mouths=g.userData.boulderMouths.filter(p=>p.laneId===lane.id),lamps=g.getObjectByName('boulder-countdown-lamps');
 assert.deepEqual(mouths.map(p=>p.role),['entrance','exit']);
 for(const [i,mouth] of mouths.entries()){const q=courseCoordinates(s,mouth);assert.ok(Math.abs(q.s-lane.s)<1e-9);assert.ok(Math.abs(q.lateral-(i?4:-4))<1e-9);}
 for(const [remaining,stage] of[[1.05,1],[.65,2],[.20,3]]){const time=lane.period-lane.phase-remaining;updateTrialScenery(g,{time});assert.equal(g.userData.boulders[0].warningStep,stage);for(let j=0;j<3;j++)assert.ok(Math.abs(scale(lamps,j).x-(j<stage?1:.24))<1e-5);}
 const time=lane.period-lane.phase+.25;updateTrialScenery(g,{time});const p=boulderPose(s,lane,time),actual=center(g.getObjectByName('rolling-boulders'),0);assert.ok(Math.hypot(actual.x-p.x,actual.z-p.z)<1e-5);assert.equal(g.userData.boulders[0].visible,true);dispose(g);
});

test('wind arrows and pennants align with backward push and shelter marks match protected footprints',()=>{
 for(const area of[0,1,2]){const {section:s,group:g}=fixture('wind',area),trial=s.trial,arrows=g.getObjectByName('gust-flow-arrows');
  for(const time of[trial.period-trial.phase+.2,trial.period-trial.phase-.25]){updateTrialScenery(g,{time});const state=gustState(s,time),sign=state.warning?-state.sign:state.sign,dx=-s.forward.x*3.1+s.right.x*(area?sign*.65:0),dz=-s.forward.z*3.1+s.right.z*(area?sign*.65:0),heading=new T.Vector3(1,0,0).transformDirection(instance(arrows,0));assert.ok(heading.dot(new T.Vector3(dx,0,dz).normalize())>.99999);assert.equal(g.userData.windDirection.warning,state.warning);}
  assert.equal(g.userData.shelterFootprints.length,trial.covers.length);for(const [i,fp]of g.userData.shelterFootprints.entries()){const c=trial.covers[i];assert.equal(fp.from,c.s-2.7);assert.equal(fp.to,c.s-.25);assert.equal(fp.halfWidth,1);assert.equal(fp.lateral,c.lateral);const safe=g.getObjectByName('fixed-trial-scenery').children.find(o=>o.material.color.getHexString()==='8ec77d'),positions=safe.geometry.attributes.position,qs=[];for(let k=0;k<positions.count;k++){const q=courseCoordinates(s,{x:positions.getX(k),z:positions.getZ(k)});if(Math.abs(q.s-(c.s-1.475))<1.3)qs.push(q);}assert.ok(Math.abs(Math.min(...qs.map(q=>q.s))-fp.from)<4e-5);assert.ok(Math.abs(Math.max(...qs.map(q=>q.s))-fp.to)<4e-5);assert.ok(Math.abs(Math.min(...qs.map(q=>q.lateral))-(c.lateral-1))<4e-5);assert.ok(Math.abs(Math.max(...qs.map(q=>q.lateral))-(c.lateral+1))<4e-5);const point=localPoint(s,(fp.from+fp.to)/2,fp.lateral);assert.ok(Math.hypot(point.x-c.x,point.z-c.z)>c.r,'protected mark is behind cover');}
  dispose(g);
 }
});

test('moving platform limit rings are exact physical extremes and moving rings follow actual centers',()=>{
 for(const mode of['relaxed','challenge']){const {section:s,group:g}=fixture('moving',0,mode),moving=s.platforms.filter(p=>p.motion),markers=g.getObjectByName('moving-platform-track-markers');
  assert.equal(g.userData.platformTravelLimits.length,moving.length);for(const [i,p]of moving.entries()){const limit=g.userData.platformTravelLimits[i];assert.ok(Math.abs(Math.hypot(limit.normal.x,limit.normal.z)-1)<1e-9);assert.equal(limit.beaconOffset,p.r+.22);g.updateMatrixWorld(true);for(const end of[limit.min,limit.max])for(const sign of[-1,1]){const x=end.x+limit.normal.x*sign*limit.beaconOffset,z=end.z+limit.normal.z*sign*limit.beaconOffset,ray=new T.Raycaster(new T.Vector3(x,2,z),new T.Vector3(0,-1,0)),hit=ray.intersectObject(g.getObjectByName('fixed-trial-scenery'),true)[0];assert.ok(hit&&Math.abs(hit.point.y-.475)<2e-4,'visible endpoint beacon stands outside platform radius');}const lo=courseCoordinates(s,limit.min),hi=courseCoordinates(s,limit.max);assert.ok(Math.abs(lo.s-(p.s-p.motion.ampS))<1e-7);assert.ok(Math.abs(hi.s-(p.s+p.motion.ampS))<1e-7);assert.ok(Math.abs(lo.lateral-(p.lateral-p.motion.ampL))<1e-7);assert.ok(Math.abs(hi.lateral-(p.lateral+p.motion.ampL))<1e-7);for(let frame=0;frame<61;frame++){const time=p.motion.period*frame/60;updateTrialScenery(g,{time});const actual=center(markers,i),expected=movingPose(s,p,time);assert.ok(Math.hypot(actual.x-expected.x,actual.z-expected.z)<3e-5);}}
  dispose(g);
 }
});

test('closed crystal shutters occlude the core, open shutters reveal it and broken targets stay absent',()=>{
 const {section:s,group:g}=fixture('crystals'),trial=s.trial,shells=g.getObjectByName('retracting-crystal-shells'),cores=g.getObjectByName('crystal-nodes'),halos=g.getObjectByName('exposed-crystal-targets'),node=trial.nodes[0];
 const closed=trial.openFor+.3-trial.phase,opened=trial.period+.3-trial.phase;
 const nearest=()=>{g.updateMatrixWorld(true);const start=localPoint(s,trial.s-2,node.lateral),ray=new T.Raycaster(new T.Vector3(start.x,.8,start.z),new T.Vector3(s.forward.x,0,s.forward.z));return ray.intersectObjects([shells,cores],false)[0]?.object;};
 updateTrialScenery(g,{time:closed});assert.equal(crystalState(s,closed).open,false);assert.equal(nearest()?.name,shells.name);assert.equal(scale(halos,0).x,0);assert.equal(g.userData.shellOpen,false);
 updateTrialScenery(g,{time:opened});assert.equal(nearest()?.name,cores.name);assert.ok(scale(halos,0).x>.99);assert.equal(g.userData.shellOpen,true);
 updateTrialScenery(g,{time:opened,crystals:{[trial.id]:{hp:2,broken:[0]}}});assert.equal(scale(halos,0).x,0);assert.ok(scale(halos,1).x>.99);assert.deepEqual(g.userData.crystalBroken,[0]);assert.equal(g.userData.barrierOpen,false);updateTrialScenery(g,{time:closed,crystals:{[trial.id]:{hp:2,broken:[0]}}});assert.ok(scale(shells,0).y<.2);assert.equal(g.userData.crystalTargets[0].exposed,false);
 updateTrialScenery(g,{time:closed,crystals:{[trial.id]:{hp:0,broken:[0,1,2]}}});assert.equal(g.userData.barrierOpen,true);assert.equal(g.getObjectByName('protective-crystal-barrier').visible,false);for(let i=0;i<3;i++)assert.equal(scale(halos,i).x,0);dispose(g);
});

test('animated hazard cues reuse all Three geometry/material/mesh resources over repeated updates',()=>{
 for(const kind of['boulders','wind','moving','crystals']){const {group:g}=fixture(kind),objects=[],geometry=[],materials=[];g.traverse(o=>{objects.push(o);if(o.geometry)geometry.push(o.geometry);if(o.material)materials.push(o.material);});for(let frame=0;frame<240;frame++)updateTrialScenery(g,{time:frame/30});const after=[];g.traverse(o=>after.push(o));assert.deepEqual(after,objects);assert.deepEqual(after.filter(o=>o.geometry).map(o=>o.geometry),geometry);assert.deepEqual(after.filter(o=>o.material).map(o=>o.material),materials);assertFinite(g);dispose(g);}
});

test('boulder entrance faces remain visible on the inner side of the real enclosing cliffs',async()=>{const{makeCorridorEnclosure}=await import('../dist/corridor-geometry.js'),{section:s,group:g}=fixture('boulders'),wall=makeCorridorEnclosure();g.updateMatrixWorld(true);wall.updateMatrixWorld(true);for(const mouth of g.userData.boulderMouths){const centerPoint=localPoint(s,s.trial.lanes.find(l=>l.id===mouth.laneId).s),origin=new T.Vector3(centerPoint.x,.94,centerPoint.z),target=new T.Vector3(mouth.faceX,.94,mouth.faceZ),direction=target.clone().sub(origin).normalize(),ray=new T.Raycaster(origin,direction),art=ray.intersectObject(g,true)[0],cliff=ray.intersectObject(wall,true)[0];assert.ok(art);assert.ok(!cliff||art.distance<cliff.distance,'mouth must sit in front of the cliff surface');}dispose(g);dispose(wall);});
