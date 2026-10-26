// Cosmetics beyond wind trails: hats, coat colours and camp decorations. Coins buy looks only, never growth.
export const COSMETICS=[
 {id:'hat-leaf',kind:'hat',name:'Leaf cap',cost:30,color:'#6fae5a'},
 {id:'hat-acorn',kind:'hat',name:'Acorn cap',cost:40,color:'#a8743c'},
 {id:'hat-party',kind:'hat',name:'Party hat',cost:45,color:'#e86aa5'},
 {id:'hat-flower',kind:'hat',name:'Flower crown',cost:55,color:'#f3a7c3'},
 {id:'hat-wizard',kind:'hat',name:'Star wizard hat',cost:70,color:'#5a5fc4'},
 {id:'hat-crown',kind:'hat',name:'Golden crown',cost:90,color:'#f2c94c'},
 {id:'coat-sunrise',kind:'coat',name:'Sunrise coat',cost:35,color:'#ffae5c'},
 {id:'coat-ocean',kind:'coat',name:'Ocean coat',cost:35,color:'#4fc3e8'},
 {id:'coat-meadow',kind:'coat',name:'Meadow coat',cost:35,color:'#7fd77a'},
 {id:'coat-candy',kind:'coat',name:'Candy coat',cost:50,color:'#ff8ad8'},
 {id:'coat-starlight',kind:'coat',name:'Starlight coat',cost:65,color:'#b9a6ff'},
 {id:'camp-lanterns',kind:'camp',name:'Paper lanterns',cost:25,color:'#ffcf7a'},
 {id:'camp-flags',kind:'camp',name:'Bunting flags',cost:25,color:'#f08a6a'},
 {id:'camp-mushrooms',kind:'camp',name:'Mushroom ring',cost:35,color:'#e06a5a'},
 {id:'camp-fire',kind:'camp',name:'Campfire',cost:40,color:'#ff9440'},
 {id:'camp-crystal',kind:'camp',name:'Glow crystal',cost:50,color:'#9fe6ff'},
 {id:'camp-tent',kind:'camp',name:'Explorer tent',cost:60,color:'#d9b46a'}
];
export const KINDS=[['trail','Wind trails'],['hat','Hats'],['coat','Colours'],['camp','Camp']];
export const cosmetic=id=>COSMETICS.find(c=>c.id===id);
// Buys if needed, then equips a hat or coat (tap again to take it off) or toggles a camp decoration.
export function useCosmetic(save,id){const item=cosmetic(id),w=save.wallet;if(!item||!w)return{ok:false};if(!w.owned.includes(id)){if(w.balance<item.cost)return{ok:false,short:item.cost-w.balance};w.balance-=item.cost;w.owned.push(id);if(item.kind==='camp'){w.camp=[...(w.camp||[]),id];return{ok:true,bought:true,item};}}
 if(item.kind==='hat')w.hat=w.hat===id?null:id;else if(item.kind==='coat')w.coat=w.coat===id?null:id;else{const camp=new Set(w.camp||[]);camp.has(id)?camp.delete(id):camp.add(id);w.camp=[...camp];}
 return{ok:true,item};}
export function validCosmetics(w){if(!w)return true;if(w.hat!=null&&!(cosmetic(w.hat)?.kind==='hat'&&w.owned.includes(w.hat)))return false;if(w.coat!=null&&!(cosmetic(w.coat)?.kind==='coat'&&w.owned.includes(w.coat)))return false;if(w.camp!==undefined&&(!Array.isArray(w.camp)||w.camp.some(id=>cosmetic(id)?.kind!=='camp'||!w.owned.includes(id))))return false;return true;}
