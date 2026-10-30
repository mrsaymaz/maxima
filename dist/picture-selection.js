// Eligible pictures form conflict components. Shared files, explicit groups
// (including group 0), and aliases can never compete on a matching board.
export function pictureCandidates(vocabulary){
 const list=vocabulary.filter(v=>v.picture&&v.picturePolicy!=='text-only'),parent=list.map((_,i)=>i),owners=new Map();
 const root=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
 list.forEach((v,i)=>{const keys=['file:'+v.picture];if(v.pictureGroup!==undefined&&v.pictureGroup!==null)keys.push('group:'+String(v.pictureGroup));for(const k of keys){if(owners.has(k))parent[root(i)]=root(owners.get(k));else owners.set(k,i);}});
 return list.map((v,i)=>({...v,pictureIdentity:'picture:'+root(i)}));
}
