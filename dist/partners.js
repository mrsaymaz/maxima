export const PARTNERS=[{id:'hufflepuff',name:'Hufflepuff',element:'Air',color:'#d6f4df',accent:'#aaf3ed',awakening:'Air Awakening',gather:'The wind answers.',loading:'Gathering the wind…',previewMax:10},{id:'gryffindor',name:'Gryffindor',element:'Fire',color:'#ffb968',accent:'#ff8358',awakening:'Fire Awakening',gather:'The flame answers.',loading:'Gathering the flame…',previewMax:10},{id:'ravenclaw',name:'Ravenclaw',element:'Water',color:'#8bd9f4',accent:'#56b8ef',awakening:'Water Awakening',gather:'The tide answers.',loading:'Gathering the tide…',previewMax:10},{id:'slytherin',name:'Slytherin',element:'Nature',color:'#b4e293',accent:'#78cf8a',awakening:'Nature Awakening',gather:'The forest answers.',loading:'Gathering the forest…',previewMax:10}];
export const partnerInfo=id=>PARTNERS.find(p=>p.id===id)||PARTNERS[0];
export const partnerPortrait=(id,level)=>`assets/portraits/${partnerInfo(id).id}-${level}.png`;
// The active bank stays at journeys for compatible saves and app code. Only
// inactive teams live in teamProgress: no duplicate active history in JSON.
export function upgradeTeamProgress(save){
 if(save.teamProgressVersion===undefined&&save.teamProgress===undefined&&save.journeyTeam===undefined){save.teamProgressVersion=1;save.journeyTeam=partnerInfo(save.partner).id;save.teamProgress={};}
 return save;
}
export function journeysFor(save,id=save.partner||'hufflepuff'){
 return id===(save.journeyTeam||save.partner||'hufflepuff')?save.journeys:save.teamProgress?.[id]?.journeys||{};
}
export const allJourneyMaps=save=>[save.journeys||{},...Object.values(save.teamProgress||{}).map(bank=>bank.journeys)];
export function validTeamProgress(save){
 if(save.teamProgressVersion===undefined&&save.teamProgress===undefined&&save.journeyTeam===undefined)return true;
 const known=id=>PARTNERS.some(p=>p.id===id),maps=save.teamProgress;
 return save.teamProgressVersion===1&&known(save.journeyTeam)&&save.journeyTeam===(save.partner||'hufflepuff')&&!!maps&&typeof maps==='object'&&!Array.isArray(maps)&&Object.keys(maps).length<=3&&Object.entries(maps).every(([id,b])=>known(id)&&id!==save.journeyTeam&&!!b&&typeof b==='object'&&!Array.isArray(b)&&Number.isInteger(b.area)&&b.area>=0&&b.area<=2&&!!b.journeys&&typeof b.journeys==='object'&&!Array.isArray(b.journeys));
}
export function upgradePartners(save){save.partner??='hufflepuff';save.partnerNames??={};save.partnerNames[save.partner]??=save.nickname||partnerInfo(save.partner).name;return upgradeTeamProgress(save);}
export function choosePartner(save,id){
 if(!PARTNERS.some(p=>p.id===id))return false;
 upgradePartners(save);if(!validTeamProgress(save))return false;
 save.partnerNames[save.partner]=save.nickname;
 if(id!==save.partner){
  const next=save.teamProgress[id];save.teamProgress[save.partner]={journeys:save.journeys,area:save.area};
  save.journeys=next?.journeys||{};save.area=next?.area||0;delete save.teamProgress[id];save.partner=id;save.journeyTeam=id;
  const j=save.journeys[save.selected],max=j?.guardians?.includes(1)?2:j?.guardians?.includes(0)?1:0;save.area=Math.min(save.area,max);
 }
 save.nickname=save.partnerNames[id]||partnerInfo(id).name;save.partnerNames[id]=save.nickname;return true;
}
export function validPartners(save){return(save.partner===undefined||PARTNERS.some(p=>p.id===save.partner))&&(save.partnerNames===undefined||!!save.partnerNames&&typeof save.partnerNames==='object'&&!Array.isArray(save.partnerNames)&&Object.entries(save.partnerNames).every(([id,n])=>PARTNERS.some(p=>p.id===id)&&typeof n==='string'&&n.length<=30));}
