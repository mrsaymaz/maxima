import{nodesFor}from'./trail-layout.js';
// Completed story state comes from existing checkpoint records, never a second save.
export function restoredSites(e){const chapter=Math.min(4,Math.floor(e.index/4)),sites=[];for(const record of e.completed||[]){const c=Math.floor(record.index/4),side=e.choices[c];if(c>=chapter||!side)continue;const node=nodesFor(e,c,side)[record.index%4];sites.push({...node,type:record.type,id:record.id,propX:node.x+(side==='left'?-1:1)*2.75,propZ:node.z+2.8});}return sites;}
