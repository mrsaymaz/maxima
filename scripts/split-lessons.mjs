import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync('dist/data/expedition-language.json','utf8'));
fs.mkdirSync('dist/data/lessons',{recursive:true});
for(const unit of data.units)fs.writeFileSync(`dist/data/lessons/${unit.id}.json`,JSON.stringify(unit)+'\n');
const catalog={schemaVersion:1,units:data.units.map(u=>Object.fromEntries(['id','title','grade','cefr','curriculum'].map(k=>[k,u[k]])))};
fs.writeFileSync('dist/data/lesson-catalog.json',JSON.stringify(catalog)+'\n');
console.log(`Split ${data.units.length} lessons; catalogue and each selected lesson load independently.`);
