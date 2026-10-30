import fs from'node:fs';
import{makeCorridorEnclosure}from'../dist/corridor-geometry.js';
import{makePathDetail}from'../dist/path-detail.js';
import{makeExpeditionArt}from'../dist/expedition-art.js';
const forms=[];
for(const partner of['hufflepuff','gryffindor','ravenclaw','slytherin'])for(let level=0;level<=10;level++){
 const bytes=fs.readFileSync(`dist/assets/creatures/${partner}-${level}.glb`),g=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12))),weightedPrimitives=(g.meshes||[]).flatMap(m=>m.primitives||[]).filter(p=>p.attributes.JOINTS_0!==undefined&&p.attributes.WEIGHTS_0!==undefined).length;
 forms.push({partner,level,bytes:bytes.length,skins:g.skins?.length||0,joints:(g.skins||[]).reduce((n,s)=>n+s.joints.length,0),weightedPrimitives,skeletal:weightedPrimitives>0&&(g.skins?.length||0)>0,clips:(g.animations||[]).map(a=>a.name)});
}
const geometry=root=>{let batches=0,triangles=0,shadowBatches=0;root.traverse(o=>{if(!o.isMesh)return;batches++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);shadowBatches+=Number(o.castShadow);});return{batches,triangles,shadowBatches};};
const enclosure=makeCorridorEnclosure({composed:true});
const report={release:'0.25.0',scope:'CPU asset/geometry inventory; entire first-arena layers, not a rendered frame or measured device cost',forms,summary:{forms:forms.length,skeletal:forms.filter(f=>f.skeletal).length,unrigged:forms.filter(f=>!f.skeletal).length},layers:{enclosure:geometry(enclosure),foreground:geometry(makePathDetail()),landmarks:geometry(makeExpeditionArt())},banks:{triangles:enclosure.userData.bankTriangles,batches:enclosure.userData.bankBatches},deviceTesting:{physicalDevicesTested:0,browserVisualReview:false,status:'pending',targets:{preferredFps:60,lowerTierStableFps:30}}};
fs.mkdirSync('docs',{recursive:true});fs.writeFileSync('docs/PHASE1-ASSET-BASELINE.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({summary:report.summary,layers:report.layers,banks:report.banks,deviceTesting:report.deviceTesting}));
