import{allJourneyMaps}from'./partners.js';
import{stretchZ}from'./runner-mode.js';
import{upgradeTraversalSave}from'./traversal.js';

// The first runner launch on a device carries the classic journey over: same creatures, Forms, coins and lesson
// progress, with every saved world position moved onto the longer runner trail. The classic save stays as it was.
export function importClassicSave(classic,stretch=stretchZ){
 if(!classic||typeof classic!=='object')return null;
 // Older layouts are first brought to the current classic coordinates, then stretched.
 const save=upgradeTraversalSave(JSON.parse(JSON.stringify(classic))),move=p=>{if(p&&Number.isFinite(p.z))p.z=stretch(p.z);};
 for(const bank of allJourneyMaps(save))for(const j of Object.values(bank||{}))for(const e of Object.values(j?.expeditions||{})){
  move(e.position);move(e.checkpoint?.position);for(const cp of e.checkpointHistory||[])move(cp.position);move(e.travel?.safe);
 }
 save.importedFromClassic=true;return save;
}
